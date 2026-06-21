import React, { useState, useEffect, createContext, useContext, useRef } from 'react';
import { BrowserRouter, Routes, Route, Navigate, Link, useParams, useSearchParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Browser } from '@capacitor/browser';
import { App as CapacitorApp } from '@capacitor/app';
import { Capacitor } from '@capacitor/core';
import { initializeApp } from 'firebase/app';
import { getMessaging, getToken, onMessage } from 'firebase/messaging';
import { FirebaseMessaging } from '@capacitor-firebase/messaging';

const API_URL = 'https://elite-nursing-cbt.onrender.com';
axios.defaults.baseURL = API_URL;

const AuthContext = createContext();

// Module-level cache for quizzes (shared across all components)
let globalQuizzesCache = null;
let globalQuizzesPromise = null;

async function getCachedQuizzes(token) {
  if (globalQuizzesCache) return globalQuizzesCache;
  if (globalQuizzesPromise) return await globalQuizzesPromise;
  
  globalQuizzesPromise = (async () => {
    const res = await axios.get('/api/quizzes', { headers: { Authorization: `Bearer ${token}` } });
    globalQuizzesCache = res.data;
    globalQuizzesPromise = null;
    return globalQuizzesCache;
  })();
  
  return await globalQuizzesPromise;
}

// Helper functions for exam history (permanent storage)
const saveExamAttempt = (quizId, title, category, topic, answers, score, total, percentage) => {
  const attempts = JSON.parse(localStorage.getItem('exam_attempts') || '{}');
  attempts[quizId] = {
    title,
    category,
    topic,
    answers,
    score,
    total,
    percentage,
    completedAt: new Date().toISOString()
  };
  localStorage.setItem('exam_attempts', JSON.stringify(attempts));
};

const getAllAttempts = () => JSON.parse(localStorage.getItem('exam_attempts') || '{}');
const getExamAttempt = (quizId) => getAllAttempts()[quizId] || null;
const clearAllAttempts = () => localStorage.removeItem('exam_attempts');

// Loading Component with Percentage Bar
const LoadingWithBar = ({ message = "Loading", onComplete }) => {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval);
          if (onComplete) onComplete();
          return 100;
        }
        return prev + Math.random() * 15;
      });
    }, 200);
    return () => clearInterval(interval);
  }, [onComplete]);

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'center',
      alignItems: 'center',
      minHeight: '100vh',
      width: '100%',
      background: '#f0f7f4',
      position: 'relative'
    }}>
      <div style={{ textAlign: 'center', maxWidth: 300, width: '100%' }}>
        <div style={{ fontSize: 48, marginBottom: 16 }}>📚</div>
        <h2 style={{ color: '#1e3c72', fontSize: 20, marginBottom: 8 }}>ELITE NURSING & MIDWIFERY CBT</h2>
        <p style={{ color: '#666', fontSize: 12, marginBottom: 20 }}>Computer Based Testing Platform</p>
        <p style={{ color: '#1e3c72', fontSize: 14, marginBottom: 10 }}>{message}...</p>
        <div style={{
          width: '100%',
          height: 8,
          background: '#e0e0e0',
          borderRadius: 4,
          overflow: 'hidden'
        }}>
          <div style={{
            width: `${Math.min(progress, 100)}%`,
            height: '100%',
            background: 'linear-gradient(90deg, #1e3c72, #2a5298)',
            borderRadius: 4,
            transition: 'width 0.3s ease'
          }} />
        </div>
        <p style={{ color: '#1e3c72', fontSize: 12, marginTop: 10 }}>{Math.floor(Math.min(progress, 100))}%</p>
      </div>
      <div style={{
        position: 'absolute',
        bottom: 20,
        left: 0,
        right: 0,
        textAlign: 'center'
      }}>
        <p style={{ color: '#999', fontSize: 10 }}>© 2026 ELITE Nursing & Midwifery CBT. All rights reserved.{' '}
  <Link to="/privacy" style={{ color: '#2196f3', fontSize: 11, textDecoration: 'none', marginLeft: 4 }}>
    Privacy Policy
  </Link>
  <span style={{ color: '#999', margin: '0 6px' }}>|</span>
  <Link to="/terms" style={{ color: '#2196f3', fontSize: 11, textDecoration: 'none' }}>
    Terms & Conditions
  </Link></p>
      </div>
    </div>
  );
};

// Password Input with Eye Icon
const PasswordInput = ({ value, onChange, placeholder, id }) => {
  const [showPassword, setShowPassword] = useState(false);

  return (
    <div style={{ position: 'relative', width: '100%' }}>
      <input 
        type={showPassword ? 'text' : 'password'}
        id={id}
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        style={{ width: '100%', padding: '12px 14px', paddingRight: '45px', border: '2px solid #e0e0e0', borderRadius: 10, fontSize: 14, outline: 'none', boxSizing: 'border-box' }}
        onFocus={(e) => e.target.style.borderColor = '#1e3c72'}
        onBlur={(e) => e.target.style.borderColor = '#e0e0e0'}
        required 
      />
      <button
        type="button"
        onClick={() => setShowPassword(!showPassword)}
        style={{
          position: 'absolute',
          right: 12,
          top: '50%',
          transform: 'translateY(-50%)',
          background: 'none',
          border: 'none',
          cursor: 'pointer',
          fontSize: 18,
          padding: 0,
          margin: 0,
          color: '#888'
        }}
      >
        {showPassword ? '🙈' : '👁️'}
      </button>
    </div>
  );
};

// Timer Component
const Timer = ({ duration, onTimeUp }) => {
  const [timeLeft, setTimeLeft] = useState(duration * 60);

  useEffect(() => {
    if (timeLeft <= 0) {
      onTimeUp();
      return;
    }
    const timer = setInterval(() => setTimeLeft(prev => prev - 1), 1000);
    return () => clearInterval(timer);
  }, [timeLeft, onTimeUp]);

  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;
  const isWarning = timeLeft < 300;

  return (
    <div style={{
      position: 'sticky',
      top: 0,
      zIndex: 1000,
      background: isWarning ? '#f44336' : '#1e3c72',
      color: 'white',
      padding: '12px 20px',
      textAlign: 'center',
      fontSize: 22,
      fontWeight: 'bold',
      boxShadow: '0 2px 10px rgba(0,0,0,0.1)'
    }}>
      ⏰ {minutes}:{seconds.toString().padStart(2, '0')}
      {isWarning && <span style={{ marginLeft: 10, fontSize: 14 }}>⚠️ TIME RUNNING OUT!</span>}
    </div>
  );
};

// Premium Modal Component – redirects to subscription plans (no direct payment)
const PremiumModal = ({ onClose, examTitle, sectionNumber }) => {
  const { user } = useContext(AuthContext);

  const handleUpgrade = () => {
    onClose(); // close modal
    window.location.href = '/get-premium';
  };

  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
      background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center',
      justifyContent: 'center', zIndex: 2000
    }}>
      <div style={{
        background: 'white', borderRadius: 20, padding: 28, maxWidth: 360,
        textAlign: 'center', margin: '20px'
      }}>
        <div style={{ fontSize: 48, marginBottom: 10 }}>⭐</div>
        <h2 style={{ color: '#1e3c72', fontSize: 22, margin: '10px 0' }}>Premium Required</h2>
        <p style={{ fontSize: 15, marginBottom: 10 }}><strong>{examTitle}</strong> is premium content.</p>
        <p style={{ fontSize: 14, marginBottom: 15, color: '#666' }}>
          Subscribe to a plan to unlock ALL premium exams!
        </p>
        <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
          <button onClick={onClose} style={{ flex: 1, background: '#6c757d', color: 'white', padding: 12, border: 'none', borderRadius: 10, cursor: 'pointer', fontWeight: '500', fontSize: 14 }}>Cancel</button>
          <button onClick={handleUpgrade} style={{ flex: 1, background: '#ff9800', color: 'white', padding: 12, border: 'none', borderRadius: 10, cursor: 'pointer', fontWeight: 'bold', fontSize: 14 }}>
            View Plans →
          </button>
        </div>
      </div>
    </div>
  );
};

// Forgot Password Component
const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const handleSendOtp = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    setMessage('');
    try {
      const res = await axios.post('/api/forgot-password', { email });
      setMessage(res.data.message);
      setOtpSent(true);
    } catch (error) {
      setError(error.response?.data?.error || 'Failed to send reset code');
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    if (newPassword.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }
    setIsLoading(true);
    setError('');
    setMessage('');
    try {
      const res = await axios.post('/api/reset-password', { email, otp, newPassword });
      setMessage(res.data.message);
      setTimeout(() => {
        window.location.href = '/login';
      }, 3000);
    } catch (error) {
      setError(error.response?.data?.error || 'Failed to reset password');
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) return <LoadingWithBar message="Processing" />;

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #1e3c72 0%, #2a5298 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
      <div style={{ maxWidth: 450, width: '100%', background: 'white', borderRadius: 24, padding: 32, boxShadow: '0 20px 40px rgba(0,0,0,0.2)' }}>
        <div style={{ textAlign: 'center', marginBottom: 24 }}>
          <div style={{ fontSize: 52, marginBottom: 16 }}>🔐</div>
          <h1 style={{ color: '#1e3c72', fontSize: 22, margin: 0, fontWeight: 'bold' }}>Reset Password</h1>
          <p style={{ color: '#666', fontSize: 12, marginTop: 6 }}>Enter your email to receive a verification code</p>
        </div>

        {message && (
          <div style={{ background: '#e8f5e9', padding: 12, borderRadius: 10, marginBottom: 16, textAlign: 'center' }}>
            <p style={{ color: '#2e7d32', margin: 0, fontSize: 13 }}>{message}</p>
          </div>
        )}
        {error && (
          <div style={{ background: '#ffebee', padding: 12, borderRadius: 10, marginBottom: 16, textAlign: 'center' }}>
            <p style={{ color: '#c62828', margin: 0, fontSize: 13 }}>{error}</p>
          </div>
        )}

        {!otpSent ? (
          <form onSubmit={handleSendOtp}>
            <div style={{ marginBottom: 20 }}>
              <label style={{ display: 'block', marginBottom: 6, color: '#333', fontSize: 13, fontWeight: 500 }}>Email Address</label>
              <input 
                type="email" 
                placeholder="you@example.com" 
                value={email} 
                onChange={(e) => setEmail(e.target.value)} 
                style={{ width: '100%', padding: '12px 14px', border: '2px solid #e0e0e0', borderRadius: 10, fontSize: 14, outline: 'none', boxSizing: 'border-box' }}
                onFocus={(e) => e.target.style.borderColor = '#1e3c72'}
                onBlur={(e) => e.target.style.borderColor = '#e0e0e0'}
                required 
              />
            </div>
            <button 
              type="submit" 
              disabled={isLoading}
              style={{ 
                width: '100%', 
                background: 'linear-gradient(135deg, #1e3c72 0%, #2a5298 100%)', 
                color: 'white', 
                padding: '12px', 
                border: 'none', 
                borderRadius: 10, 
                cursor: 'pointer', 
                fontWeight: 'bold', 
                fontSize: 14,
                opacity: isLoading ? 0.7 : 1
              }}
            >
              {isLoading ? 'Sending...' : 'Send Verification Code'}
            </button>
          </form>
        ) : (
          <form onSubmit={handleResetPassword}>
            <div style={{ marginBottom: 16 }}>
              <label style={{ display: 'block', marginBottom: 6, color: '#333', fontSize: 13, fontWeight: 500 }}>Verification Code</label>
              <input 
                type="text" 
                placeholder="Enter 6-digit code" 
                value={otp} 
                onChange={(e) => setOtp(e.target.value)} 
                style={{ width: '100%', padding: '12px 14px', border: '2px solid #e0e0e0', borderRadius: 10, fontSize: 14, outline: 'none', boxSizing: 'border-box' }}
                onFocus={(e) => e.target.style.borderColor = '#1e3c72'}
                onBlur={(e) => e.target.style.borderColor = '#e0e0e0'}
                required 
              />
            </div>
            <div style={{ marginBottom: 16 }}>
              <label style={{ display: 'block', marginBottom: 6, color: '#333', fontSize: 13, fontWeight: 500 }}>New Password</label>
              <div style={{ position: 'relative' }}>
                <input 
                  type={showNewPassword ? 'text' : 'password'}
                  placeholder="Enter new password" 
                  value={newPassword} 
                  onChange={(e) => setNewPassword(e.target.value)} 
                  style={{ width: '100%', padding: '12px 14px', paddingRight: '45px', border: '2px solid #e0e0e0', borderRadius: 10, fontSize: 14, outline: 'none', boxSizing: 'border-box' }}
                  onFocus={(e) => e.target.style.borderColor = '#1e3c72'}
                  onBlur={(e) => e.target.style.borderColor = '#e0e0e0'}
                  required 
                />
                <button type="button" onClick={() => setShowNewPassword(!showNewPassword)} style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', fontSize: 18, color: '#888' }}>{showNewPassword ? '🙈' : '👁️'}</button>
              </div>
            </div>
            <div style={{ marginBottom: 20 }}>
              <label style={{ display: 'block', marginBottom: 6, color: '#333', fontSize: 13, fontWeight: 500 }}>Confirm Password</label>
              <div style={{ position: 'relative' }}>
                <input 
                  type={showConfirmPassword ? 'text' : 'password'}
                  placeholder="Confirm new password" 
                  value={confirmPassword} 
                  onChange={(e) => setConfirmPassword(e.target.value)} 
                  style={{ width: '100%', padding: '12px 14px', paddingRight: '45px', border: '2px solid #e0e0e0', borderRadius: 10, fontSize: 14, outline: 'none', boxSizing: 'border-box' }}
                  onFocus={(e) => e.target.style.borderColor = '#1e3c72'}
                  onBlur={(e) => e.target.style.borderColor = '#e0e0e0'}
                  required 
                />
                <button type="button" onClick={() => setShowConfirmPassword(!showConfirmPassword)} style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', fontSize: 18, color: '#888' }}>{showConfirmPassword ? '🙈' : '👁️'}</button>
              </div>
            </div>
            <button 
              type="submit" 
              disabled={isLoading}
              style={{ 
                width: '100%', 
                background: 'linear-gradient(135deg, #1e3c72 0%, #2a5298 100%)', 
                color: 'white', 
                padding: '12px', 
                border: 'none', 
                borderRadius: 10, 
                cursor: 'pointer', 
                fontWeight: 'bold', 
                fontSize: 14,
                opacity: isLoading ? 0.7 : 1
              }}
            >
              {isLoading ? 'Resetting...' : 'Reset Password'}
            </button>
          </form>
        )}

        <div style={{ marginTop: 20, textAlign: 'center' }}>
          <Link to="/login" style={{ color: '#1e3c72', fontSize: 13, textDecoration: 'none' }}>
            ← Back to Login
          </Link>
        </div>
        <div style={{ marginTop: 24, paddingTop: 16, borderTop: '1px solid #eee', textAlign: 'center' }}>
          <p style={{ fontSize: 11, color: '#999' }}>© 2026 ELITE Nursing & Midwifery CBT. All rights reserved.{' '}
  <Link to="/privacy" style={{ color: '#2196f3', fontSize: 11, textDecoration: 'none', marginLeft: 4 }}>
    Privacy Policy
  </Link>
  <span style={{ color: '#999', margin: '0 6px' }}>|</span>
  <Link to="/terms" style={{ color: '#2196f3', fontSize: 11, textDecoration: 'none' }}>
    Terms & Conditions
  </Link></p>
        </div>
      </div>
    </div>
  );
};

// Register Component
const Register = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [step, setStep] = useState('form');
  const [otp, setOtp] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [resendTimer, setResendTimer] = useState(0);
  const [showPassword, setShowPassword] = useState(false);
  const [showWelcome, setShowWelcome] = useState(true);
  const [agreeChecked, setAgreeChecked] = useState(false); // <-- NEW state
  const { login } = useContext(AuthContext);

  useEffect(() => {
    const timer = setTimeout(() => setShowWelcome(false), 5000);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    let timer;
    if (resendTimer > 0) {
      timer = setTimeout(() => setResendTimer(resendTimer - 1), 1000);
    }
    return () => clearTimeout(timer);
  }, [resendTimer]);

  const handleSendVerification = async (e) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Please enter your full name');
      return;
    }
    if (!agreeChecked) {
      setError('You must agree to the Terms and Privacy Policy');
      return;
    }
    setIsLoading(true);
    setError('');
    setMessage('');
    try {
      const res = await axios.post('/api/send-verification', { email, name });
      setMessage(res.data.message);
      setStep('verify');
      setResendTimer(60);
    } catch (error) {
      setError(error.response?.data?.error || 'Failed to send verification code');
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyAndRegister = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    setMessage('');
    try {
      console.log('Sending verification request:', { email, otp });
      await axios.post('/api/verify-email', { email, otp });
      const res = await axios.post('/api/register', { name, email, password });
      if (res.data.success) {
        setMessage('Registration successful! Redirecting...');
        setTimeout(() => {
          login(res.data.token, res.data.user);
        }, 2000);
      }
    } catch (error) {
      setError(error.response?.data?.error || 'Verification failed');
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendCode = async () => {
    if (resendTimer > 0) return;
    setIsLoading(true);
    setError('');
    try {
      const res = await axios.post('/api/send-verification', { email, name });
      setMessage(res.data.message);
      setResendTimer(60);
    } catch (error) {
      setError(error.response?.data?.error || 'Failed to resend code');
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading && step === 'form') {
    return <LoadingWithBar message="Sending verification code" />;
  }

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #1e3c72 0%, #2a5298 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px', position: 'relative' }}>
      {showWelcome && (
        <div style={{
          position: 'fixed',
          top: '20px',
          left: '50%',
          transform: 'translateX(-50%)',
          background: 'white',
          borderRadius: '40px',
          padding: '10px 20px',
          boxShadow: '0 10px 40px rgba(0,0,0,0.2)',
          zIndex: 1000,
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          animation: 'slideDown 0.5s ease'
        }}>
          <span style={{ fontSize: 20 }}>🎉</span>
          <div>
            <strong style={{ color: '#1e3c72', fontSize: 14 }}>Join ELITE Nursing & Midwifery CBT!</strong>
            <p style={{ margin: 0, fontSize: 11, color: '#666' }}>Create your account to access 20,000+ questions</p>
          </div>
          <button onClick={() => setShowWelcome(false)} style={{ background: 'none', border: 'none', fontSize: 16, cursor: 'pointer', color: '#999' }}>✕</button>
        </div>
      )}
      
      <style>{`
        @keyframes slideDown {
          from {
            opacity: 0;
            transform: translateX(-50%) translateY(-100px);
          }
          to {
            opacity: 1;
            transform: translateX(-50%) translateY(0);
          }
        }
      `}</style>

      <div style={{ maxWidth: 450, width: '100%', background: 'white', borderRadius: 24, padding: '32px', boxShadow: '0 20px 40px rgba(0,0,0,0.2)' }}>
        <div style={{ textAlign: 'center', marginBottom: 24 }}>
          <div style={{ fontSize: 48, marginBottom: 12 }}>🎓</div>
          <h1 style={{ color: '#1e3c72', fontSize: 20, margin: 0, fontWeight: 'bold' }}>ELITE NURSING &</h1>
          <h1 style={{ color: '#1e3c72', fontSize: 20, margin: 0, fontWeight: 'bold' }}>MIDWIFERY CBT</h1>
          <p style={{ color: '#666', fontSize: 12, marginTop: 6 }}>Computer Based Testing Platform</p>
        </div>
        
        {step === 'form' ? (
          <>
            <div style={{ textAlign: 'center', marginBottom: 20 }}>
              <h2 style={{ color: '#333', fontSize: 18, marginBottom: 4 }}>Create Account</h2>
              <p style={{ color: '#888', fontSize: 12 }}>Sign up to begin your journey</p>
            </div>

            {error && (
              <div style={{ background: '#ffebee', padding: '12px', borderRadius: 10, marginBottom: 16, textAlign: 'center' }}>
                <p style={{ color: '#c62828', margin: 0, fontSize: 13 }}>{error}</p>
              </div>
            )}

            <form onSubmit={handleSendVerification}>
              <div style={{ marginBottom: 16 }}>
                <label style={{ display: 'block', marginBottom: 6, color: '#333', fontSize: 13, fontWeight: 500 }}>Full Name</label>
                <input 
                  type="text" 
                  placeholder="Enter your full name" 
                  value={name} 
                  onChange={(e) => setName(e.target.value)} 
                  style={{ width: '100%', padding: '12px 14px', border: '2px solid #e0e0e0', borderRadius: 10, fontSize: 14, outline: 'none', boxSizing: 'border-box' }}
                  onFocus={(e) => e.target.style.borderColor = '#1e3c72'}
                  onBlur={(e) => e.target.style.borderColor = '#e0e0e0'}
                  required 
                />
              </div>
              <div style={{ marginBottom: 16 }}>
                <label style={{ display: 'block', marginBottom: 6, color: '#333', fontSize: 13, fontWeight: 500 }}>Email Address</label>
                <input 
                  type="email" 
                  placeholder="you@example.com" 
                  value={email} 
                  onChange={(e) => setEmail(e.target.value)} 
                  style={{ width: '100%', padding: '12px 14px', border: '2px solid #e0e0e0', borderRadius: 10, fontSize: 14, outline: 'none', boxSizing: 'border-box' }}
                  onFocus={(e) => e.target.style.borderColor = '#1e3c72'}
                  onBlur={(e) => e.target.style.borderColor = '#e0e0e0'}
                  required 
                />
              </div>
              <div style={{ marginBottom: 20 }}>
                <label style={{ display: 'block', marginBottom: 6, color: '#333', fontSize: 13, fontWeight: 500 }}>Password</label>
                <div style={{ position: 'relative' }}>
                  <input 
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Create a strong password (min 6 characters)" 
                    value={password} 
                    onChange={(e) => setPassword(e.target.value)} 
                    style={{ width: '100%', padding: '12px 14px', paddingRight: '45px', border: '2px solid #e0e0e0', borderRadius: 10, fontSize: 14, outline: 'none', boxSizing: 'border-box' }}
                    onFocus={(e) => e.target.style.borderColor = '#1e3c72'}
                    onBlur={(e) => e.target.style.borderColor = '#e0e0e0'}
                    required 
                    minLength="6"
                  />
                  <button type="button" onClick={() => setShowPassword(!showPassword)} style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', fontSize: 18, color: '#888' }}>{showPassword ? '🙈' : '👁️'}</button>
                </div>
              </div>

              {/* ===== NEW: Terms & Privacy checkbox ===== */}
              <div style={{ marginBottom: 20, display: 'flex', alignItems: 'flex-start', gap: 8 }}>
                <input
                  type="checkbox"
                  id="agreeTerms"
                  checked={agreeChecked}
                  onChange={(e) => setAgreeChecked(e.target.checked)}
                  style={{ marginTop: 3, cursor: 'pointer' }}
                />
                <label htmlFor="agreeTerms" style={{ fontSize: 13, color: '#555', cursor: 'pointer' }}>
                  I agree to the{' '}
                  <Link to="/terms" style={{ color: '#0c5bed', textDecoration: 'none' }}>
                    Terms and Conditions
                  </Link>
                  {' '}&{' '}
                  <Link to="/privacy" style={{ color: '#0c5bed', textDecoration: 'none' }}>
                    Privacy Policy
                  </Link>
                </label>
              </div>
              {/* ====================================== */}

              <button 
                type="submit" 
                disabled={isLoading || !agreeChecked}
                style={{ 
                  width: '100%', 
                  background: 'linear-gradient(135deg, #1e3c72 0%, #2a5298 100%)', 
                  color: 'white', 
                  padding: '12px', 
                  border: 'none', 
                  borderRadius: 10, 
                  cursor: isLoading || !agreeChecked ? 'not-allowed' : 'pointer', 
                  fontWeight: 'bold', 
                  fontSize: 14,
                  opacity: (isLoading || !agreeChecked) ? 0.7 : 1
                }}
              >
                Verify Email
              </button>
            </form>
            
            <div style={{ marginTop: 20, textAlign: 'center' }}>
              <Link to="/login" style={{ color: '#1e3c72', fontSize: 13, textDecoration: 'none' }}>
                ← Back to Login
              </Link>
            </div>
          </>
        ) : (
          <>
            <div style={{ textAlign: 'center', marginBottom: 20 }}>
              <h2 style={{ color: '#333', fontSize: 18, marginBottom: 4 }}>Verify Your Email</h2>
              <p style={{ color: '#888', fontSize: 12 }}>Enter the 6-digit code sent to {email}</p>
            </div>

            {message && (
              <div style={{ background: '#e8f5e9', padding: '12px', borderRadius: 10, marginBottom: 16, textAlign: 'center' }}>
                <p style={{ color: '#2e7d32', margin: 0, fontSize: 13 }}>{message}</p>
              </div>
            )}
            {error && (
              <div style={{ background: '#ffebee', padding: '12px', borderRadius: 10, marginBottom: 16, textAlign: 'center' }}>
                <p style={{ color: '#c62828', margin: 0, fontSize: 13 }}>{error}</p>
              </div>
            )}

            <form onSubmit={handleVerifyAndRegister}>
              <div style={{ marginBottom: 20 }}>
                <label style={{ display: 'block', marginBottom: 6, color: '#333', fontSize: 13, fontWeight: 500 }}>Verification Code</label>
                <input 
                  type="text" 
                  placeholder="Enter 6-digit code" 
                  value={otp} 
                  onChange={(e) => setOtp(e.target.value)} 
                  style={{ width: '100%', padding: '12px 14px', border: '2px solid #e0e0e0', borderRadius: 10, fontSize: 14, outline: 'none', boxSizing: 'border-box' }}
                  onFocus={(e) => e.target.style.borderColor = '#1e3c72'}
                  onBlur={(e) => e.target.style.borderColor = '#e0e0e0'}
                  required 
                />
              </div>
              <button 
                type="submit" 
                disabled={isLoading}
                style={{ 
                  width: '100%', 
                  background: 'linear-gradient(135deg, #1e3c72 0%, #2a5298 100%)', 
                  color: 'white', 
                  padding: '12px', 
                  border: 'none', 
                  borderRadius: 10, 
                  cursor: 'pointer', 
                  fontWeight: 'bold', 
                  fontSize: 14
                }}
              >
                {isLoading ? 'Creating Account...' : 'Create Account'}
              </button>
            </form>

            <div style={{ textAlign: 'center', marginTop: 20 }}>
              <p style={{ color: '#666', fontSize: 13 }}>
                Didn't receive code?{" "}
                <button 
                  onClick={handleResendCode} 
                  disabled={resendTimer > 0}
                  style={{ 
                    background: 'none', 
                    border: 'none', 
                    color: resendTimer > 0 ? '#999' : '#1e3c72', 
                    fontWeight: 'bold', 
                    cursor: resendTimer > 0 ? 'not-allowed' : 'pointer',
                    fontSize: 13
                  }}
                >
                  Resend {resendTimer > 0 ? `(${resendTimer}s)` : ''}
                </button>
              </p>
              <Link to="/login" style={{ color: '#1e3c72', fontSize: 13, textDecoration: 'none', display: 'inline-block', marginTop: 10 }}>
                ← Back to Login
              </Link>
            </div>
          </>
        )}
        
        <div style={{ marginTop: 24, paddingTop: 16, borderTop: '1px solid #eee', textAlign: 'center' }}>
          <p style={{ fontSize: 11, color: '#999' }}>© 2026 ELITE Nursing & Midwifery CBT</p>
          <p style={{ fontSize: 11, color: '#999' }}>Over 20,000+ practice questions</p>
        </div>
      </div>
    </div>
  );
};

// Login Component
  const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showWelcome, setShowWelcome] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [showForceLogoutDialog, setShowForceLogoutDialog] = useState(false);
  const [pendingCredentials, setPendingCredentials] = useState(null);
  const { login } = useContext(AuthContext);

  useEffect(() => {
    const timer = setTimeout(() => setShowWelcome(false), 5000);
    return () => clearTimeout(timer);
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const res = await axios.post('/api/login', { email, password });
      login(res.data.token, res.data.user);
    } catch (error) {
      const errorMsg = error.response?.data?.error || error.message;
      console.log('Login error:', errorMsg);
      
      // Check for session conflict using includes (more reliable)
      if (errorMsg.includes('already logged in') || errorMsg.includes('another device')) {
        setPendingCredentials({ email, password });
        setShowForceLogoutDialog(true);
      } else {
        alert('Login failed: ' + errorMsg);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleForceLogout = async () => {
    setIsLoading(true);
    try {
      const res = await axios.post('/api/force-logout', { email: pendingCredentials.email });
      if (res.data.success) {
        const loginRes = await axios.post('/api/login', { email: pendingCredentials.email, password: pendingCredentials.password });
        login(loginRes.data.token, loginRes.data.user);
      }
    } catch (error) {
      alert('Failed to force logout from other device. Please try again later.');
    } finally {
      setIsLoading(false);
      setShowForceLogoutDialog(false);
      setPendingCredentials(null);
    }
  };

  const cancelForceLogout = () => {
    setShowForceLogoutDialog(false);
    setPendingCredentials(null);
  };

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #1e3c72 0%, #2a5298 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px', position: 'relative' }}>
      {/* Loading overlay */}
      {isLoading && (
        <div style={{
          position: 'fixed',
          top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(255,255,255,0.7)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 10000,
          backdropFilter: 'blur(3px)'
        }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ width: 50, height: 50, border: '4px solid #e0e0e0', borderTop: '4px solid #1e3c72', borderRadius: '50%', animation: 'spin 1s linear infinite', margin: '0 auto' }} />
            <p style={{ marginTop: 16, color: '#1e3c72' }}>Logging in...</p>
          </div>
        </div>
      )}

      {/* Custom force logout dialog */}
      {showForceLogoutDialog && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0,0,0,0.7)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 2000
        }}>
          <div style={{
            background: 'white',
            borderRadius: 20,
            padding: 28,
            maxWidth: 400,
            width: '90%',
            textAlign: 'center',
            boxShadow: '0 20px 40px rgba(0,0,0,0.2)'
          }}>
            <div style={{ fontSize: 48, marginBottom: 16 }}>⚠️</div>
            <h2 style={{ color: '#1e3c72', marginBottom: 8 }}>Already Logged In Elsewhere</h2>
            <p style={{ color: '#666', marginBottom: 20 }}>
              You are already logged in on another device. Would you like to log out from that device and continue here?
            </p>
            <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
              <button 
                onClick={cancelForceLogout} 
                disabled={isLoading}
                style={{ 
                  flex: 1, 
                  background: '#6c757d', 
                  color: 'white', 
                  padding: '10px 24px', 
                  border: 'none', 
                  borderRadius: 8, 
                  cursor: isLoading ? 'not-allowed' : 'pointer', 
                  fontWeight: 'bold', 
                  fontSize: 14,
                  opacity: isLoading ? 0.7 : 1
                }}
              >
                Cancel
              </button>
              <button 
                onClick={handleForceLogout} 
                disabled={isLoading}
                style={{ 
                  flex: 1, 
                  background: '#dc3545', 
                  color: 'white', 
                  padding: '10px 24px', 
                  border: 'none', 
                  borderRadius: 8, 
                  cursor: isLoading ? 'not-allowed' : 'pointer', 
                  fontWeight: 'bold', 
                  fontSize: 14,
                  opacity: isLoading ? 0.7 : 1
                }}
              >
                {isLoading ? 'Logging out...' : 'Logout from Other Device'}
              </button>
            </div>
          </div>
        </div>
      )}

      {showWelcome && !showForceLogoutDialog && (
        <div style={{
          position: 'fixed',
          top: '20px',
          left: '50%',
          transform: 'translateX(-50%)',
          background: 'white',
          borderRadius: '40px',
          padding: '10px 20px',
          boxShadow: '0 10px 40px rgba(0,0,0,0.2)',
          zIndex: 1000,
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          animation: 'slideDown 0.5s ease'
        }}>
          <span style={{ fontSize: 20 }}>👋</span>
          <div>
            <strong style={{ color: '#1e3c72', fontSize: 14 }}>Welcome to ELITE Nursing & Midwifery CBT!</strong>
            <p style={{ margin: 0, fontSize: 11, color: '#666' }}>Sign in to continue your learning journey</p>
          </div>
          <button onClick={() => setShowWelcome(false)} style={{ background: 'none', border: 'none', fontSize: 16, cursor: 'pointer', color: '#999' }}>✕</button>
        </div>
      )}
      
      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        @keyframes slideDown {
          from {
            opacity: 0;
            transform: translateX(-50%) translateY(-100px);
          }
          to {
            opacity: 1;
            transform: translateX(-50%) translateY(0);
          }
        }
      `}</style>

      <div style={{ maxWidth: 400, width: '100%', background: 'white', borderRadius: 24, padding: '32px', boxShadow: '0 20px 40px rgba(0,0,0,0.2)' }}>
        <div style={{ textAlign: 'center', marginBottom: 24 }}>
          <div style={{ fontSize: 48, marginBottom: 12 }}>📚</div>
          <h1 style={{ color: '#1e3c72', fontSize: 20, margin: 0, fontWeight: 'bold' }}>ELITE NURSING &</h1>
          <h1 style={{ color: '#1e3c72', fontSize: 20, margin: 0, fontWeight: 'bold' }}>MIDWIFERY CBT</h1>
          <p style={{ color: '#666', fontSize: 12, marginTop: 6 }}>Computer Based Testing Platform</p>
        </div>
        
        <div style={{ textAlign: 'center', marginBottom: 20 }}>
          <h2 style={{ color: '#333', fontSize: 18, marginBottom: 4 }}>Welcome Back</h2>
          <p style={{ color: '#888', fontSize: 12 }}>Sign in to continue your preparation</p>
        </div>
        
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <div style={{ marginBottom: 16, width: '100%' }}>
            <label style={{ display: 'block', marginBottom: 6, color: '#333', fontSize: 13, fontWeight: 500 }}>Email Address</label>
            <input 
              type="email" 
              placeholder="you@example.com" 
              value={email} 
              onChange={(e) => setEmail(e.target.value)} 
              style={{ width: '100%', padding: '12px 14px', border: '2px solid #e0e0e0', borderRadius: 10, fontSize: 14, outline: 'none', boxSizing: 'border-box' }}
              onFocus={(e) => e.target.style.borderColor = '#1e3c72'}
              onBlur={(e) => e.target.style.borderColor = '#e0e0e0'}
              required 
            />
          </div>
          <div style={{ marginBottom: 20, width: '100%' }}>
            <label style={{ display: 'block', marginBottom: 6, color: '#333', fontSize: 13, fontWeight: 500 }}>Password</label>
            <div style={{ position: 'relative', width: '100%' }}>
              <input 
                type={showPassword ? 'text' : 'password'}
                placeholder="••••••••" 
                value={password} 
                onChange={(e) => setPassword(e.target.value)} 
                style={{ width: '100%', padding: '12px 14px', paddingRight: '45px', border: '2px solid #e0e0e0', borderRadius: 10, fontSize: 14, outline: 'none', boxSizing: 'border-box' }}
                onFocus={(e) => e.target.style.borderColor = '#1e3c72'}
                onBlur={(e) => e.target.style.borderColor = '#e0e0e0'}
                required 
              />
              <button type="button" onClick={() => setShowPassword(!showPassword)} style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', fontSize: 18, color: '#888' }}>{showPassword ? '🙈' : '👁️'}</button>
            </div>
          </div>
          <div style={{ textAlign: 'right', marginBottom: 20, width: '100%' }}>
            <Link to="/forgot-password" style={{ color: '#1e3c72', fontSize: 12, textDecoration: 'none' }}>
              Forgot Password?
            </Link>
          </div>
          <button 
            type="submit" 
            disabled={isLoading}
            style={{ 
              width: '100%', 
              background: 'linear-gradient(135deg, #1e3c72 0%, #2a5298 100%)', 
              color: 'white', 
              padding: '12px', 
              border: 'none', 
              borderRadius: 10, 
              cursor: isLoading ? 'not-allowed' : 'pointer', 
              fontWeight: 'bold', 
              fontSize: 14,
              opacity: isLoading ? 0.7 : 1
            }}
          >
            {isLoading ? 'Signing In...' : 'Sign In'}
          </button>
        </form>
        
        <div style={{ marginTop: 20, textAlign: 'center' }}>
          <p style={{ color: '#666', fontSize: 13 }}>
            Don't have an account? <Link to="/register" style={{ color: '#1e3c72', fontWeight: 'bold', textDecoration: 'none' }}>Create Account</Link>
          </p>
        </div>
        
        <div style={{ marginTop: 24, paddingTop: 16, borderTop: '1px solid #eee', textAlign: 'center' }}>
          <p style={{ fontSize: 11, color: '#999' }}>© 2026 ELITE Nursing & Midwifery CBT</p>
          <p style={{ fontSize: 11, color: '#999' }}>Over 20,000+ practice questions</p>
          <p style={{ fontSize: 11, marginTop: 4 }}>
            <Link to="/terms" style={{ color: '#0c5bed', textDecoration: 'none' }}>Terms</Link>
            {' | '}
            <Link to="/privacy" style={{ color: '#0c5bed', textDecoration: 'none' }}>Privacy</Link>
          </p>
        </div>
      </div>
    </div>
  );
};

// Home Page Component – shows number of topics (courses) per category
const HomePage = () => {
  const [mode, setMode] = useState('premium');
  const [quizzes, setQuizzes] = useState([]);
  const [loading, setLoading] = useState(true);
  const { token, darkMode, user } = useContext(AuthContext);

  useEffect(() => {
    const fetchQuizzes = async () => {
      setLoading(true);
      try {
        const data = await getCachedQuizzes(token);
        setQuizzes(data);
      } catch (error) {
        console.error('Error fetching quizzes:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchQuizzes();
  }, [token]);

  const getCategories = () => {
    // Group topics by category
    const categoryTopics = {};
    quizzes.forEach(quiz => {
      if (!categoryTopics[quiz.category]) {
        categoryTopics[quiz.category] = new Set();
      }
      if (quiz.topic) {
        categoryTopics[quiz.category].add(quiz.topic);
      }
    });
    // Convert to object with topic count
    const categories = {};
    for (const [category, topics] of Object.entries(categoryTopics)) {
      categories[category] = topics.size;
    }
    return categories;
  };

  const getCategoryIcon = (category) => {
    const icons = {
      'general-nursing': '🩺',
      'midwifery': '🤰',
      'public-health': '🌍',
      'pediatric-nursing': '👶',
      'dental-nursing': '🦷'
    };
    return icons[category] || '📚';
  };

  const getCategoryName = (category) => {
    const names = {
      'general-nursing': 'General Nursing',
      'midwifery': 'Midwifery',
      'public-health': 'Public Health',
      'pediatric-nursing': 'Pediatric Nursing',
      'dental-nursing': 'Dental Nursing'
    };
    return names[category] || category;
  };

  if (loading) {
    return <LoadingWithBar message="Loading courses" />;
  }

  const categories = getCategories();

  return (
    <div style={{ background: darkMode ? '#1a1a2e' : '#f0f7f4', minHeight: '100vh', padding: '20px' }}>
      <div style={{ maxWidth: 1200, margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: 24 }}>
          <h1 style={{ color: '#1e3c72', fontSize: 'clamp(24px, 5vw, 36px)', marginBottom: 8 }}>ELITE NURSING & MIDWIFERY CBT</h1>
          <p style={{ color: darkMode ? '#aaa' : '#666', fontSize: 'clamp(14px, 4vw, 16px)' }}>Computer Based Testing Platform</p>
        </div>

        <div style={{ display: 'flex', gap: 16, marginBottom: 32, justifyContent: 'center', flexWrap: 'wrap' }}>
          <button
            onClick={() => setMode('free')}
            style={{
              padding: '12px 32px',
              fontSize: 'clamp(16px, 4vw, 18px)',
              fontWeight: 'bold',
              background: mode === 'free' ? 'linear-gradient(135deg, #1e3c72 0%, #2a5298 100%)' : darkMode ? '#16213e' : 'white',
              color: mode === 'free' ? 'white' : '#1e3c72',
              border: mode === 'free' ? 'none' : '2px solid #1e3c72',
              borderRadius: '50px',
              cursor: 'pointer'
            }}
          >
            🆓 FREE MODE
          </button>
          <button
            onClick={() => setMode('premium')}
            style={{
              padding: '12px 32px',
              fontSize: 'clamp(16px, 4vw, 18px)',
              fontWeight: 'bold',
              background: mode === 'premium' ? 'linear-gradient(135deg, #ff9800 0%, #e65100 100%)' : darkMode ? '#16213e' : 'white',
              color: mode === 'premium' ? 'white' : '#ff9800',
              border: mode === 'premium' ? 'none' : '2px solid #ff9800',
              borderRadius: '50px',
              cursor: 'pointer'
            }}
          >
            ⭐ PREMIUM MODE
          </button>
        </div>

        {mode === 'free' && (
          <div style={{ background: '#e8f5e9', padding: 16, borderRadius: 12, textAlign: 'center', marginBottom: 24 }}>
            <p style={{ color: '#1e3c72', margin: 0, fontSize: 'clamp(14px, 4vw, 16px)' }}>
              🎯 <strong>Free Mode:</strong> Take each examination ONCE. Upgrade to retake exams and unlock all questions!
            </p>
          </div>
        )}
        {mode === 'premium' && (
          <div style={{ background: '#fff3e0', padding: 16, borderRadius: 12, textAlign: 'center', marginBottom: 24 }}>
            <p style={{ color: '#ff9800', margin: 0, fontSize: 'clamp(14px, 4vw, 16px)' }}>
              ⭐ <strong>Premium Mode:</strong> {user?.isPremium ? 'Full access to all examinations!' : 'Upgrade to unlock unlimited access!'}
            </p>
          </div>
        )}

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 24 }}>
          {Object.entries(categories).map(([category, topicCount]) => (
            <Link to={`/courses/${category}/${mode}`} key={category} style={{ textDecoration: 'none' }}>
              <div style={{ 
                background: darkMode ? '#16213e' : 'white', 
                padding: 24, 
                borderRadius: 20, 
                boxShadow: '0 4px 12px rgba(0,0,0,0.1)', 
                textAlign: 'center',
                transition: 'transform 0.2s',
                cursor: 'pointer',
                borderBottom: `4px solid ${mode === 'free' ? '#1e3c72' : '#ff9800'}`
              }}
              onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-5px)'}
              onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}>
                <div style={{ fontSize: 56, marginBottom: 12 }}>{getCategoryIcon(category)}</div>
                <h2 style={{ color: mode === 'free' ? '#1e3c72' : '#ff9800', fontSize: 'clamp(18px, 4vw, 20px)', marginBottom: 8 }}>{getCategoryName(category)}</h2>
                <p style={{ color: darkMode ? '#aaa' : '#666', fontSize: 14, marginBottom: 12 }}>{topicCount} courses</p>
                <div style={{ display: 'flex', justifyContent: 'center', gap: 12, flexWrap: 'wrap' }}>
                  <span style={{ background: '#e8f5e9', color: '#1e3c72', padding: '4px 12px', borderRadius: 20, fontSize: 12 }}>🎯 Free Exam 1</span>
                  <span style={{ background: '#fff3e0', color: '#ff9800', padding: '4px 12px', borderRadius: 20, fontSize: 12 }}>⭐ Premium</span>
                </div>
                <button style={{ marginTop: 16, background: mode === 'free' ? '#1e3c72' : '#ff9800', color: 'white', border: 'none', padding: '10px 20px', borderRadius: 30, cursor: 'pointer', fontWeight: 'bold', fontSize: 14, width: '100%' }}>
                  Explore Courses →
                </button>
              </div>
            </Link>
          ))}
        </div>
      </div>
      <div style={{ textAlign: 'center', padding: '20px', marginTop: 20 }}>
        <p style={{ color: '#999', fontSize: 12 }}>© 2026 ELITE Nursing & Midwifery CBT. All rights reserved.{' '}
          <Link to="/privacy" style={{ color: '#2196f3', fontSize: 11, textDecoration: 'none', marginLeft: 4 }}>
            Privacy Policy
          </Link>
          <span style={{ color: '#999', margin: '0 6px' }}>|</span>
          <Link to="/terms" style={{ color: '#2196f3', fontSize: 11, textDecoration: 'none' }}>
            Terms & Conditions
          </Link>
        </p>
      </div>
    </div>
  );
};

// Course List Component – final version (topic card shows premium exam seats)
const CourseList = () => {
  const { categoryName, mode } = useParams();
  const [displayData, setDisplayData] = useState([]);
  const [fullTopicQuizzes, setFullTopicQuizzes] = useState([]);
  const [isTopicView, setIsTopicView] = useState(true);
  const [loading, setLoading] = useState(true);
  const { token, darkMode } = useContext(AuthContext);

  const categoryMap = {
    'general-nursing': { name: 'General Nursing', icon: '🩺', color: mode === 'free' ? '#1e3c72' : '#ff9800' },
    'midwifery': { name: 'Midwifery', icon: '🤰', color: mode === 'free' ? '#1e3c72' : '#ff9800' },
    'public-health': { name: 'Public Health', icon: '🌍', color: mode === 'free' ? '#1e3c72' : '#ff9800' },
    'pediatric-nursing': { name: 'Pediatric Nursing', icon: '👶', color: mode === 'free' ? '#1e3c72' : '#ff9800' },
    'dental-nursing': { name: 'Dental Nursing', icon: '🦷', color: mode === 'free' ? '#1e3c72' : '#ff9800' }
  };
  const category = categoryMap[categoryName] || { name: 'Courses', icon: '📚', color: mode === 'free' ? '#1e3c72' : '#ff9800' };

  const urlParams = new URLSearchParams(window.location.search);
  const currentTopic = urlParams.get('topic');

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const quizzesData = await getCachedQuizzes(token);
        let filtered = quizzesData.filter(q => q.category === categoryName);

        if (currentTopic) {
          const allTopicQuizzes = filtered.filter(q => q.topic === currentTopic);
          allTopicQuizzes.sort((a, b) => {
            const numA = parseInt(a.title.match(/\d+/)?.[0] || 0);
            const numB = parseInt(b.title.match(/\d+/)?.[0] || 0);
            return numA - numB;
          });
          setFullTopicQuizzes(allTopicQuizzes);

          if (mode === 'free') {
            // Free mode: only first quiz
            let topicQuizzes = [...allTopicQuizzes];
            if (topicQuizzes.length > 0) topicQuizzes = topicQuizzes.slice(0, 1);
            setDisplayData(topicQuizzes);
            setIsTopicView(false);
          } else {
            // Premium mode: flatten all questions and chunk into 250
            const allQuestions = [];
            allTopicQuizzes.forEach(quiz => {
              allQuestions.push(...quiz.questions);
            });
            const chunkSize = 250;
            const chunks = [];
            for (let i = 0; i < allQuestions.length; i += chunkSize) {
              chunks.push(allQuestions.slice(i, i + chunkSize));
            }
            const examCards = chunks.map((chunk, idx) => {
              const start = idx * chunkSize + 1;
              const end = Math.min((idx + 1) * chunkSize, allQuestions.length);
              return {
                id: idx + 1,
                title: `Exam ${idx + 1}`,
                description: `Questions ${start} – ${end}`,
                questions: chunk,
                totalQuestions: chunk.length
              };
            });
            setDisplayData(examCards);
            setIsTopicView(false);
          }
        } else {
          // Category view: show topics with premium exam count
          const topicMap = new Map();
          filtered.forEach(quiz => {
            const topic = quiz.topic || 'General';
            if (!topicMap.has(topic)) {
              topicMap.set(topic, { topic, totalQuestions: 0, quizCount: 0 });
            }
            const entry = topicMap.get(topic);
            entry.totalQuestions += quiz.questions?.length || 0;
            entry.quizCount += 1;
          });
          const topicArray = Array.from(topicMap.values()).map(entry => ({
            ...entry,
            premiumExamCount: Math.ceil(entry.totalQuestions / 250)
          }));
          setDisplayData(topicArray);
          setIsTopicView(true);
        }
      } catch (error) {
        console.error('Error fetching courses:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [categoryName, token, currentTopic, mode]);

  const getLastScore = (quizId) => {
    const scores = localStorage.getItem(`exam_${quizId}_scores`);
    if (scores) {
      const parsed = JSON.parse(scores);
      if (parsed[1]) return parsed[1];
    }
    return null;
  };

  const firstIncompleteQuiz = !isTopicView && mode === 'free' && fullTopicQuizzes.length > 0
    ? fullTopicQuizzes.find(quiz => !getLastScore(quiz._id))
    : null;

  if (loading) {
    const loadingMsg = currentTopic ? 'Loading exams...' : 'Loading courses...';
    return <LoadingWithBar message={loadingMsg} />;
  }

  if (displayData.length === 0) {
    return (
      <div style={{ background: darkMode ? '#1a1a2e' : '#f0f7f4', minHeight: '100vh', padding: '50px', textAlign: 'center' }}>
        <p>No {isTopicView ? 'courses' : 'exams'} found for {category.name}. Please try again later.</p>
        <button onClick={() => window.location.reload()} style={{ marginTop: 20, padding: '10px 20px', background: '#1e3c72', color: 'white', border: 'none', borderRadius: 8, cursor: 'pointer' }}>
          Refresh
        </button>
      </div>
    );
  }

  return (
    <div style={{ background: darkMode ? '#1a1a2e' : '#f0f7f4', minHeight: '100vh', padding: '20px' }}>
      <div style={{ maxWidth: 1200, margin: '0 auto', width: '100%', boxSizing: 'border-box' }}>
        {/* Header */}
        <div style={{ background: `linear-gradient(135deg, ${category.color} 0%, ${mode === 'free' ? '#1a3a5c' : '#e65100'} 100%)`, borderRadius: 20, padding: 32, marginBottom: 28, color: 'white', textAlign: 'center' }}>
          <div style={{ fontSize: 56, marginBottom: 12 }}>{category.icon}</div>
          <h1 style={{ margin: '8px 0 0', fontSize: 'clamp(24px, 5vw, 32px)' }}>
            {currentTopic ? currentTopic : category.name}
          </h1>
          <p style={{ marginTop: 8, fontSize: 14 }}>{mode === 'free' ? 'FREE MODE' : 'PREMIUM MODE'}</p>
          <p style={{ fontSize: 14 }}>{displayData.length} {isTopicView ? 'courses' : 'exam sets'} available</p>
        </div>

        {/* Continue button (free mode only) */}
        {mode === 'free' && !isTopicView && firstIncompleteQuiz && (
          <div style={{ marginBottom: 24, textAlign: 'center' }}>
            <Link to={`/take/${firstIncompleteQuiz._id}/1/${mode}`}>
              <button style={{
                background: '#4caf50',
                color: 'white',
                border: 'none',
                padding: '12px 24px',
                borderRadius: 50,
                cursor: 'pointer',
                fontWeight: 'bold',
                fontSize: 16,
                boxShadow: '0 2px 8px rgba(0,0,0,0.2)'
              }}>
                ▶ Continue: {firstIncompleteQuiz.title}
              </button>
            </Link>
          </div>
        )}

        {/* Grid */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
          rowGap: '60px',
          columnGap: '40px',
          marginBottom: '60px'
        }}>
          {displayData.map(item => {
            if (isTopicView) {
              // Topic card – show premium exam seats instead of quiz count
              const examCount = item.premiumExamCount;
              const label = examCount === 1 ? 'exam seat' : 'exam seats';
              return (
                <Link to={`/courses/${categoryName}/${mode}?topic=${encodeURIComponent(item.topic)}`} key={item.topic} style={{ textDecoration: 'none' }}>
                  <div style={{ background: darkMode ? '#16213e' : 'white', padding: 20, borderRadius: 16, boxShadow: '0 2px 8px rgba(0,0,0,0.1)', display: 'flex', flexDirection: 'column', height: '100%', wordBreak: 'break-word' }}>
                    <div style={{ fontSize: 40, marginBottom: 12 }}>📚</div>
                    <h3 style={{ color: category.color, fontSize: 'clamp(16px, 4vw, 18px)', marginBottom: 8 }}>{item.topic}</h3>
                    <p style={{ color: darkMode ? '#aaa' : '#666', fontSize: 13, marginBottom: 12 }}>{examCount} {label}, {item.totalQuestions} total questions</p>
                    <div style={{ marginTop: 'auto' }}>
                      <button style={{ width: '100%', background: category.color, color: 'white', border: 'none', padding: '10px', borderRadius: 10, cursor: 'pointer', fontWeight: 'bold', fontSize: 14 }}>View Exams →</button>
                    </div>
                  </div>
                </Link>
              );
            } else if (mode === 'premium') {
              // Premium exam card
              const exam = item;
              const link = `/premium-exam/${categoryName}/${encodeURIComponent(currentTopic)}/${exam.id}/${mode}`;
              return (
                <Link to={link} key={exam.id} style={{ textDecoration: 'none' }}>
                  <div style={{ background: darkMode ? '#16213e' : 'white', padding: 20, borderRadius: 16, boxShadow: '0 2px 8px rgba(0,0,0,0.1)', display: 'flex', flexDirection: 'column', height: '100%', wordBreak: 'break-word' }}>
                    <div style={{ fontSize: 40, marginBottom: 12 }}>📚</div>
                    <h3 style={{ color: category.color, fontSize: 'clamp(16px, 4vw, 18px)', marginBottom: 8 }}>{exam.title}</h3>
                    <p style={{ color: darkMode ? '#aaa' : '#666', fontSize: 13, marginBottom: 12 }}>{exam.description}</p>
                    <p style={{ fontSize: 14 }}><strong style={{ color: category.color }}>Questions:</strong> {exam.totalQuestions}</p>
                    <div style={{ marginTop: 'auto' }}>
                      <button style={{ width: '100%', background: category.color, color: 'white', border: 'none', padding: '10px', borderRadius: 10, cursor: 'pointer', fontWeight: 'bold', fontSize: 14 }}>Start Exam →</button>
                    </div>
                  </div>
                </Link>
              );
            } else {
              // Free mode quiz card (unchanged)
              const quiz = item;
              const totalQuestions = quiz.questions?.length || 0;
              const lastScore = getLastScore(quiz._id);
              const hasTakenFree = localStorage.getItem(`exam_${quiz._id}_taken`) === 'true';
              const isCompleted = !!lastScore;

              let buttonText = 'Start Exam →';
              let buttonLink = `/take/${quiz._id}/1/${mode}`;
              let buttonColor = category.color;

              if (mode === 'free') {
                if (hasTakenFree) {
                  buttonText = '⭐ Upgrade to Retake';
                  buttonLink = '/get-premium';
                  buttonColor = '#ff9800';
                }
              }

              return (
                <Link to={buttonLink} key={quiz._id} style={{ textDecoration: 'none' }}>
                  <div style={{ background: darkMode ? '#16213e' : 'white', padding: 20, borderRadius: 16, boxShadow: '0 2px 8px rgba(0,0,0,0.1)', display: 'flex', flexDirection: 'column', height: '100%', wordBreak: 'break-word', position: 'relative' }}>
                    {isCompleted && (
                      <div style={{
                        position: 'absolute',
                        top: 12,
                        right: 12,
                        background: '#4caf50',
                        color: 'white',
                        padding: '4px 10px',
                        borderRadius: 20,
                        fontSize: 12,
                        fontWeight: 'bold',
                        zIndex: 1
                      }}>
                        ✅ Completed
                      </div>
                    )}
                    <div style={{ fontSize: 40, marginBottom: 12 }}>📚</div>
                    <h3 style={{ color: category.color, fontSize: 'clamp(16px, 4vw, 18px)', marginBottom: 8 }}>{quiz.title}</h3>
                    <p style={{ color: darkMode ? '#aaa' : '#666', fontSize: 13, marginBottom: 12 }}>{quiz.description?.substring(0, 80)}...</p>
                    <p style={{ fontSize: 14 }}><strong style={{ color: category.color }}>Questions:</strong> {totalQuestions.toLocaleString()}</p>
                    {lastScore && <p style={{ fontSize: 13, color: '#ff9800', marginTop: 4 }}>📊 Last Score: {lastScore.score}/{lastScore.total} ({lastScore.percentage}%)</p>}
                    <div style={{ marginTop: 'auto' }}>
                      <button style={{ width: '100%', background: buttonColor, color: 'white', border: 'none', padding: '10px', borderRadius: 10, cursor: 'pointer', fontWeight: 'bold', fontSize: 14 }}>{buttonText}</button>
                    </div>
                  </div>
                </Link>
              );
            }
          })}
        </div>

        {/* Upgrade button (free mode, not in topic view) */}
        {mode === 'free' && !currentTopic && (
          <div style={{ textAlign: 'center', marginTop: 20, marginBottom: 40 }}>
            <Link to="/get-premium">
              <button style={{ background: '#ff9800', color: 'white', padding: '14px 32px', border: 'none', borderRadius: 50, cursor: 'pointer', fontWeight: 'bold', fontSize: 16 }}>
                ⭐ Upgrade to Premium
              </button>
            </Link>
          </div>
        )}

        {/* Copyright */}
        <div style={{ textAlign: 'center', padding: '20px', marginTop: 20 }}>
          <p style={{ color: '#999', fontSize: 12 }}>© 2026 ELITE Nursing & Midwifery CBT. All rights reserved.{' '}
          <Link to="/privacy" style={{ color: '#2196f3', fontSize: 11, textDecoration: 'none', marginLeft: 4 }}>
            Privacy Policy
          </Link>
          <span style={{ color: '#999', margin: '0 6px' }}>|</span>
          <Link to="/terms" style={{ color: '#2196f3', fontSize: 11, textDecoration: 'none' }}>
            Terms & Conditions
          </Link>
          </p>
        </div>
      </div>

      {/* Floating Back Button */}
      <Link to={currentTopic ? `/courses/${categoryName}/${mode}` : `/?mode=${mode}`}>
        <button style={{
          position: 'fixed',
          bottom: '20px',
          left: '50%',
          transform: 'translateX(-50%)',
          background: '#6c757d',
          color: 'white',
          border: 'none',
          borderRadius: '50px',
          padding: '12px 24px',
          cursor: 'pointer',
          fontWeight: 'bold',
          fontSize: '14px',
          boxShadow: '0 2px 10px rgba(0,0,0,0.2)',
          zIndex: 1000
        }}>
          ← {currentTopic ? 'Back to Courses' : 'Back to Categories'}
        </button>
      </Link>
    </div>
  );
};

// Exam List Component
const ExamList = () => {
  const { id, mode } = useParams();
  const [quiz, setQuiz] = useState(null);
  const [sections, setSections] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showPremiumModal, setShowPremiumModal] = useState(false);
  const [selectedSection, setSelectedSection] = useState(null);
  const [userPremium, setUserPremium] = useState(false);
  const [lastScores, setLastScores] = useState({});
  const [hasTakenExam1, setHasTakenExam1] = useState(false);
  const { token, logout, darkMode } = useContext(AuthContext);

  useEffect(() => {
    const fetchQuiz = async () => {
      setLoading(true);
      try {
        if (!token) return;
        const res = await axios.get(`/api/quizzes/${id}`, { headers: { Authorization: `Bearer ${token}` } });
        setQuiz(res.data);
        
        const totalQuestions = res.data.questions.length;
        const sectionsArray = [];
        let startIndex = 0;
        let sectionNumber = 1;
        const batchSize = 20;
        
        while (startIndex < totalQuestions) {
          let endIndex = startIndex + batchSize;
          if (endIndex > totalQuestions) endIndex = totalQuestions;
          sectionsArray.push({
            number: sectionNumber,
            count: endIndex - startIndex,
            isPremium: sectionNumber > 1,
            timeMinutes: endIndex - startIndex
          });
          startIndex = endIndex;
          sectionNumber++;
        }
        setSections(sectionsArray);
        
        const profileRes = await axios.get('/api/user/profile', { headers: { Authorization: `Bearer ${token}` } });
        setUserPremium(profileRes.data.isPremium);
        
        const savedScores = localStorage.getItem(`exam_${id}_scores`);
        if (savedScores) {
          setLastScores(JSON.parse(savedScores));
        }
        
        const taken = localStorage.getItem(`exam_${id}_taken`) === 'true';
        setHasTakenExam1(taken);
      } catch (error) {
        if (error.response?.status === 401) {
          localStorage.removeItem('auth');
          logout();
          window.location.href = '/login';
        } else {
          alert('Error loading exam: ' + (error.response?.data?.error || error.message));
        }
      } finally {
        setLoading(false);
      }
    };
    if (id && token) fetchQuiz();
  }, [id, token, logout]);

  const handleStartExam = (section) => {
    if (mode === 'free') {
      if (section.number === 1 && hasTakenExam1) {
        alert('📢 You have already taken this free exam! Upgrade to Premium for unlimited retakes.');
        return;
      }
      window.location.href = `/take/${id}/${section.number}/${mode}`;
      return;
    }
    
    if (section.isPremium && !userPremium) {
      setSelectedSection(section);
      setShowPremiumModal(true);
      return;
    }
    
    window.location.href = `/take/${id}/${section.number}/${mode}`;
  };

  if (loading) {
    return <LoadingWithBar message="Loading examination details" />;
  }
  if (!quiz) return <div style={{ textAlign: 'center', padding: 30 }}>Course not found</div>;

  const getCategorySlug = () => {
    if (quiz.category === 'general-nursing') return `/courses/general-nursing/${mode}`;
    if (quiz.category === 'midwifery') return `/courses/midwifery/${mode}`;
    if (quiz.category === 'public-health') return `/courses/public-health/${mode}`;
    if (quiz.category === 'pediatric-nursing') return `/courses/pediatric-nursing/${mode}`;
    if (quiz.category === 'dental-nursing') return `/courses/dental-nursing/${mode}`;
    return '/';
  };

  const examColor = mode === 'free' ? '#1e3c72' : '#ff9800';

  return (
    <div style={{ background: darkMode ? '#1a1a2e' : '#f0f7f4', minHeight: '100vh', padding: '20px' }}>
      {showPremiumModal && <PremiumModal onClose={() => setShowPremiumModal(false)} examTitle={quiz.title} sectionNumber={selectedSection?.number} />}
      <div style={{ maxWidth: 1000, margin: '0 auto' }}>
        <Link to={getCategorySlug()} style={{ textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 8, background: examColor, color: 'white', padding: '10px 20px', borderRadius: 30, marginBottom: 20, fontSize: 14 }}>
          ← Back to Courses
        </Link>
        
        <div style={{ background: `linear-gradient(135deg, ${examColor} 0%, ${mode === 'free' ? '#1a3a5c' : '#e65100'} 100%)`, borderRadius: 20, padding: 24, marginBottom: 28, color: 'white', textAlign: 'center' }}>
          <h1 style={{ margin: 0, fontSize: 'clamp(20px, 5vw, 28px)' }}>{quiz.title}</h1>
          <p style={{ marginTop: 8, fontSize: 14 }}>{quiz.description}</p>
          <p style={{ fontSize: 14 }}>📚 Total Questions: {quiz.questions?.length || 0}</p>
          {mode === 'free' && <p style={{ marginTop: 8, background: '#4caf50', display: 'inline-block', padding: '6px 16px', borderRadius: 20, fontSize: 13, fontWeight: 'bold' }}>🎯 FREE MODE</p>}
        </div>
        
        <h2 style={{ color: examColor, fontSize: 20, marginBottom: 20 }}>Examinations:</h2>
        
        {mode === 'free' && sections[0] && (
          <>
            <div style={{ marginBottom: 28 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
                <span style={{ fontSize: 24 }}>🎯</span>
                <h3 style={{ color: '#1e3c72', margin: 0, fontSize: 18 }}>Free Examination</h3>
                <span style={{ background: '#4caf50', color: 'white', padding: '4px 12px', borderRadius: 20, fontSize: 12 }}>FREE</span>
                {hasTakenExam1 && <span style={{ background: '#ff9800', color: 'white', padding: '4px 12px', borderRadius: 20, fontSize: 12 }}>✓ COMPLETED</span>}
              </div>
              <div style={{ background: darkMode ? '#16213e' : 'white', padding: 20, borderRadius: 16, border: `2px solid ${hasTakenExam1 ? '#ff9800' : '#4caf50'}` }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16 }}>
                  <div>
                    <h3 style={{ color: '#1e3c72', margin: 0, fontSize: 18 }}>Examination 1</h3>
                    <p style={{ fontSize: 14, marginTop: 4 }}>{sections[0].count} Questions | ⏰ {sections[0].timeMinutes} minutes</p>
                    {lastScores[1] && <p style={{ color: '#ff9800', fontSize: 13, marginTop: 4 }}>📊 Your Last Score: {lastScores[1].score}/{lastScores[1].total} ({lastScores[1].percentage}%)</p>}
                  </div>
                  <button onClick={() => handleStartExam(sections[0])} style={{ background: hasTakenExam1 ? '#ff9800' : '#4caf50', color: 'white', padding: '10px 24px', border: 'none', borderRadius: 30, cursor: 'pointer', fontWeight: 'bold', fontSize: 14 }}>
                    {hasTakenExam1 ? '⭐ Upgrade to Retake' : 'Start Free Exam →'}
                  </button>
                </div>
              </div>
            </div>
            
            <div style={{ textAlign: 'center', padding: 28, background: '#fff3e0', borderRadius: 16, marginBottom: 20 }}>
              <p style={{ color: '#ff9800', fontWeight: 'bold', fontSize: 16 }}>⭐ Unlock ALL premium exams and retakes by chooseing a subscription plan that suits you!</p>
              <Link to="/get-premium"><button style={{ background: '#ff9800', color: 'white', padding: '10px 24px', border: 'none', borderRadius: 30, cursor: 'pointer', fontWeight: 'bold', fontSize: 14, marginTop: 12 }}>Upgrade Now →</button></Link>
            </div>
          </>
        )}
        
        {mode === 'premium' && (
          <div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 20 }}>
              {sections.map((section) => {
                const canAccess = userPremium;
                const isLocked = section.isPremium && !userPremium;
                return (
                  <div key={section.number} style={{ background: darkMode ? '#16213e' : 'white', padding: 18, borderRadius: 16, border: `2px solid ${isLocked ? '#ff9800' : '#4caf50'}`, opacity: isLocked ? 0.8 : 1 }}>
                    <div style={{ fontSize: 36, textAlign: 'center', marginBottom: 8 }}>{section.number === 1 ? '🎯' : '⭐'}</div>
                    <h3 style={{ color: section.number === 1 ? '#1e3c72' : '#ff9800', textAlign: 'center', fontSize: 18, marginBottom: 6 }}>Examination {section.number}</h3>
                    <p style={{ textAlign: 'center', fontSize: 14 }}>{section.count} Questions | ⏰ {section.timeMinutes} minutes</p>
                    {lastScores[section.number] && <p style={{ color: '#ff9800', textAlign: 'center', fontSize: 13, marginTop: 4 }}>📊 Score: {lastScores[section.number].score}/{lastScores[section.number].total}</p>}
                    <button onClick={() => handleStartExam(section)} style={{ width: '100%', marginTop: 14, background: canAccess ? '#ff9800' : '#ccc', color: 'white', padding: '10px', border: 'none', borderRadius: 10, cursor: canAccess ? 'pointer' : 'not-allowed', fontWeight: 'bold', fontSize: 14 }}>
                      {canAccess ? 'Start Exam →' : '🔒 Premium Required'}
                    </button>
                  </div>
                );
              })}
            </div>
            {!userPremium && (
              <div style={{ marginTop: 24, textAlign: 'center', padding: 20, background: '#fff3e0', borderRadius: 16 }}>
                <p style={{ color: '#ff9800', fontSize: 14 }}>⭐ Upgrade to access all examinations by Choosing a subscription plan that suits you!</p>
                <Link to="/get-premium"><button style={{ background: '#ff9800', color: 'white', padding: '10px 24px', border: 'none', borderRadius: 30, cursor: 'pointer', fontWeight: 'bold', fontSize: 14, marginTop: 8 }}>Upgrade Now →</button></Link>
              </div>
            )}
          </div>
        )}
      </div>
      <div style={{ textAlign: 'center', padding: '20px', marginTop: 20 }}>
        <p style={{ color: '#999', fontSize: 12 }}>© 2026 ELITE Nursing & Midwifery CBT. All rights reserved.{' '}
  <Link to="/privacy" style={{ color: '#2196f3', fontSize: 11, textDecoration: 'none', marginLeft: 4 }}>
    Privacy Policy
  </Link>
  <span style={{ color: '#999', margin: '0 6px' }}>|</span>
  <Link to="/terms" style={{ color: '#2196f3', fontSize: 11, textDecoration: 'none' }}>
    Terms & Conditions
  </Link></p>
      </div>
    </div>
  );
};

// Take Exam Component with correct premium blocking and error handling
const TakeExam = () => {
  const { id, sectionNumber, mode } = useParams();
  const [exam, setExam] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [answers, setAnswers] = useState({});
  const [currentIndex, setCurrentIndex] = useState(0);
  const [submitted, setSubmitted] = useState(false);
  const [result, setResult] = useState(null);
  const [showReview, setShowReview] = useState(false);
  const [timeUp, setTimeUp] = useState(false);
  const [loading, setLoading] = useState(true);
  const [premiumBlocked, setPremiumBlocked] = useState(false);
  const { token, darkMode } = useContext(AuthContext);

  useEffect(() => {
    const fetchExam = async () => {
      try {
        setLoading(true);
        const res = await axios.get(`/api/quizzes/${id}`, { headers: { Authorization: `Bearer ${token}` } });
        const examData = res.data;
        setExam(examData);
        console.log('📚 Exam loaded:', examData.title, 'mode:', mode);

        // ========== Premium check for Free Mode ==========
        if (mode === 'free' && examData.isPremium) {
          console.log('🔒 Free mode: exam is premium, blocking');
          setPremiumBlocked(true);
          setLoading(false);
          return;
        }

        // ========== Free mode: check if already taken ==========
        if (mode === 'free') {
          const hasTaken = localStorage.getItem(`exam_${id}_taken`) === 'true';
          if (hasTaken) {
            alert('You have already taken this free exam. Upgrade to Premium to retake.');
            window.location.href = '/get-premium';
            setLoading(false);
            return;
          }
        }

        // ========== Premium mode: check user's premium status ==========
        if (mode === 'premium') {
          try {
            console.log('🔍 Checking premium status for user...');
            const profileRes = await axios.get('/api/user/profile', { headers: { Authorization: `Bearer ${token}` } });
            console.log('👤 Profile response:', profileRes.data);

            if (!profileRes.data.isPremium) {
              console.log('⛔ User is NOT premium, blocking exam');
              setPremiumBlocked(true);
              setLoading(false);
              return;
            } else {
              console.log('✅ User is premium, allowing access');
            }
          } catch (profileError) {
            console.error('❌ Error fetching profile:', profileError);
            // If we can't verify premium status, block access to be safe
            setPremiumBlocked(true);
            setLoading(false);
            return;
          }
        }

        // ========== Load questions ==========
        setQuestions(examData.questions);
        const savedAnswers = localStorage.getItem(`exam_${id}_answers`);
        if (savedAnswers) {
          setAnswers(JSON.parse(savedAnswers));
        }
        setCurrentIndex(0);
        setSubmitted(false);
        setResult(null);
        setShowReview(false);
        setTimeUp(false);
      } catch (error) {
        console.error('Fetch error:', error);
        alert('Error loading exam: ' + error.message);
        setLoading(false);
      } finally {
        setLoading(false);
      }
    };
    if (id && token) fetchExam();
  }, [id, sectionNumber, token, mode]);

  // Save answers to localStorage
  useEffect(() => {
    if (!submitted && Object.keys(answers).length > 0) {
      localStorage.setItem(`exam_${id}_answers`, JSON.stringify(answers));
    }
  }, [answers, id, submitted]);

  const handleAnswer = (answerIndex) => {
    setAnswers(prev => ({ ...prev, [currentIndex]: answerIndex }));
  };

  const goToQuestion = (index) => {
    if (index >= 0 && index < questions.length) {
      setCurrentIndex(index);
    }
  };

  const handleTimeUp = () => {
    setTimeUp(true);
    handleSubmit();
  };

  const handleSubmit = () => {
    let score = 0;
    questions.forEach((question, idx) => {
      if (answers[idx] !== undefined && answers[idx] === question.correctAnswer) {
        score++;
      }
    });
    const percentage = ((score / questions.length) * 100).toFixed(1);
    const total = questions.length;
    
    setResult({ score, total, percentage, passed: percentage >= 70 });
    setSubmitted(true);
    
    // Save score
    const savedScores = localStorage.getItem(`exam_${id}_scores`);
    const scores = savedScores ? JSON.parse(savedScores) : {};
    scores[1] = { score, total, percentage };
    localStorage.setItem(`exam_${id}_scores`, JSON.stringify(scores));
    
    if (mode === 'free') {
      localStorage.setItem(`exam_${id}_taken`, 'true');
    }
    localStorage.removeItem(`exam_${id}_answers`);
  };

  const answeredCount = Object.keys(answers).length;
  const totalQuestions = questions.length;
  const allAnswered = answeredCount === totalQuestions;

  if (loading) return <LoadingWithBar message="Loading examination..." />;
  
  // ========== Premium blocked modal ==========
  if (premiumBlocked) {
    const backCategory = exam?.category || (window.location.pathname.split('/')[2] || 'general-nursing');
    return (
      <div style={{ background: darkMode ? '#1a1a2e' : '#f0f7f4', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ background: darkMode ? '#16213e' : 'white', borderRadius: 20, padding: 32, maxWidth: 400, textAlign: 'center' }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>⭐</div>
          <h2 style={{ color: '#1e3c72' }}>Premium Required</h2>
          <p>This exam is only available in Premium Mode. Please upgrade to access it.</p>
          <div style={{ display: 'flex', gap: 12, marginTop: 20 }}>
            <Link to={`/courses/${backCategory}/${mode}`} style={{ flex: 1 }}>
              <button style={{ width: '100%', background: '#6c757d', color: 'white', padding: '12px', border: 'none', borderRadius: 8, cursor: 'pointer', fontWeight: 'bold' }}>Back</button>
            </Link>
            <Link to="/get-premium" style={{ flex: 1 }}>
              <button style={{ width: '100%', background: '#ff9800', color: 'white', padding: '12px', border: 'none', borderRadius: 8, cursor: 'pointer', fontWeight: 'bold' }}>Upgrade Now</button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (!exam || questions.length === 0) return <div style={{ padding: 40, textAlign: 'center' }}>Exam not found</div>;

  // Results view (after submission, not reviewing)
  if (submitted && !showReview) {
    return (
      <div style={{ background: darkMode ? '#1a1a2e' : '#f0f7f4', minHeight: '100vh', padding: '20px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column' }}>
        <div style={{ maxWidth: 450, width: '100%', background: darkMode ? '#16213e' : 'white', borderRadius: 20, padding: 32, textAlign: 'center' }}>
          <h2 style={{ color: '#1e3c72', fontSize: 24 }}>Exam Results</h2>
          <p style={{ fontSize: 36, margin: '20px 0' }}>Score: <strong style={{ color: '#1e3c72' }}>{result.score}</strong> / {result.total}</p>
          <p style={{ fontSize: 24, marginBottom: 20 }}>Percentage: <strong>{result.percentage}%</strong></p>
          <p style={{ fontSize: 24, color: result.passed ? '#2e7d32' : '#dc3545', fontWeight: 'bold' }}>
            {result.passed ? '✓ PASSED!' : '✗ Failed'}
          </p>
          {timeUp && <p style={{ color: '#ff9800' }}>⏰ Time's up!</p>}
          
          {mode === 'free' && (
            <div style={{ marginTop: 20, padding: 16, background: '#fff3e0', borderRadius: 12 }}>
              <p style={{ color: '#ff9800', fontWeight: 'bold', margin: 0, fontSize: 14 }}>📢 You have completed the free exam!</p>
              <p style={{ color: '#666', marginTop: 8, fontSize: 13 }}>Upgrade to Premium to retake and unlock all exams.</p>
              <Link to="/get-premium"><button style={{ width: '100%', background: '#ff9800', color: 'white', padding: 10, border: 'none', borderRadius: 8, cursor: 'pointer', fontWeight: 'bold', marginTop: 8 }}>⭐ Upgrade Now</button></Link>
            </div>
          )}
          
          <div style={{ display: 'flex', gap: 12, marginTop: 24, justifyContent: 'center' }}>
            <button onClick={() => setShowReview(true)} style={{ background: '#1e3c72', color: 'white', padding: '10px 20px', border: 'none', borderRadius: 10, cursor: 'pointer', fontWeight: 'bold', fontSize: 14 }}>Review Answers</button>
            <Link to={`/courses/${exam.category}/${mode}`}><button style={{ background: '#6c757d', color: 'white', padding: '10px 20px', border: 'none', borderRadius: 10, cursor: 'pointer', fontWeight: 'bold', fontSize: 14 }}>Back to Topics</button></Link>
          </div>
        </div>
      </div>
    );
  }

  // Review answers view
  if (submitted && showReview) {
    return (
      <div style={{ background: darkMode ? '#1a1a2e' : '#f0f7f4', minHeight: '100vh', padding: '20px' }}>
        <div style={{ maxWidth: 800, margin: '0 auto' }}>
          <div style={{ background: darkMode ? '#16213e' : 'white', borderRadius: 16, padding: 20, marginBottom: 20, textAlign: 'center' }}>
            <h2 style={{ color: '#1e3c72', fontSize: 22 }}>Answer Review</h2>
            <p style={{ fontSize: 14 }}>Score: {result.score}/{result.total} ({result.percentage}%)</p>
            <Link to={`/courses/${exam.category}/${mode}`}><button style={{ background: '#1e3c72', color: 'white', padding: '8px 20px', border: 'none', borderRadius: 8, cursor: 'pointer', fontSize: 13, marginTop: 10 }}>Back to Topics</button></Link>
          </div>
          {questions.map((q, idx) => {
            const userAnswer = answers[idx];
            const isCorrect = userAnswer !== undefined && userAnswer === q.correctAnswer;
            return (
              <div key={idx} style={{ background: darkMode ? '#16213e' : 'white', borderRadius: 12, padding: 16, marginBottom: 12, borderLeft: `5px solid ${isCorrect ? '#4caf50' : '#f44336'}` }}>
                <h4 style={{ fontSize: 15, marginBottom: 10 }}>Q{idx+1}: {q.questionText}</h4>
                {q.options.map((opt, optIdx) => (
                  <div key={optIdx} style={{ padding: '10px 12px', margin: '6px 0', background: optIdx === q.correctAnswer ? '#c8e6c9' : (optIdx === userAnswer ? '#ffcdd2' : '#f5f5f5'), borderRadius: 10, fontSize: 14 }}>
                    <span style={{ fontWeight: 'bold', marginRight: 10 }}>{String.fromCharCode(65 + optIdx)}.</span> {opt}
                    {optIdx === q.correctAnswer && <span style={{ color: '#4caf50', marginLeft: 10, fontSize: 12 }}>✓ Correct</span>}
                    {optIdx === userAnswer && optIdx !== q.correctAnswer && <span style={{ color: '#f44336', marginLeft: 10, fontSize: 12 }}>✗ Your Answer</span>}
                  </div>
                ))}
              </div>
            );
          })}
          <Link to={`/courses/${exam.category}/${mode}`}><button style={{ width: '100%', marginTop: 20, background: '#1e3c72', color: 'white', padding: 14, border: 'none', borderRadius: 10, cursor: 'pointer', fontWeight: 'bold' }}>Back to Topics</button></Link>
        </div>
      </div>
    );
  }

  // Active exam – one question at a time
  const currentQuestion = questions[currentIndex];
  const timerDuration = questions.length;

  return (
    <div style={{ background: darkMode ? '#1a1a2e' : '#f0f7f4', minHeight: '100vh' }}>
      <Timer duration={timerDuration} onTimeUp={handleTimeUp} />
      <div style={{ padding: '20px', maxWidth: 1000, margin: '0 auto' }}>
        <div style={{ background: darkMode ? '#16213e' : 'white', borderRadius: 16, padding: 20, marginBottom: 20, textAlign: 'center' }}>
          <h2 style={{ color: '#1e3c72', margin: 0, fontSize: 20 }}>{exam.title}</h2>
          <p style={{ fontSize: 14, marginTop: 4 }}>Question {currentIndex+1} of {totalQuestions}</p>
          <p style={{ fontSize: 13, color: '#666' }}>Answered: {answeredCount}/{totalQuestions}</p>
        </div>

        {/* Current question */}
        <div style={{ background: '#1e3c72', borderRadius: 16, padding: 20, marginBottom: 20 }}>
          <h4 style={{ color: 'white', marginBottom: 16, fontSize: 16 }}>Question {currentIndex+1}: {currentQuestion.questionText}</h4>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {currentQuestion.options.map((opt, optIdx) => (
              <label key={optIdx} style={{ 
                display: 'flex', alignItems: 'center', cursor: 'pointer', padding: 12, margin: 0,
                background: answers[currentIndex] === optIdx ? '#ff9800' : 'white', borderRadius: 10,
                transition: 'all 0.2s ease', fontWeight: answers[currentIndex] === optIdx ? 'bold' : 'normal'
              }}>
                <input type="radio" name="currentQuestion" onChange={() => handleAnswer(optIdx)} checked={answers[currentIndex] === optIdx} style={{ marginRight: 15, width: 18, height: 18 }} />
                <span style={{ fontWeight: 'bold', marginRight: 10, fontSize: 14 }}>{String.fromCharCode(65 + optIdx)}.</span>
                <span style={{ fontSize: 14 }}>{opt}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Navigation buttons */}
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, marginBottom: 30 }}>
          <button onClick={() => goToQuestion(currentIndex-1)} disabled={currentIndex === 0} style={{ background: currentIndex === 0 ? '#ccc' : '#1e3c72', color: 'white', padding: '10px 20px', border: 'none', borderRadius: 8, cursor: currentIndex === 0 ? 'not-allowed' : 'pointer', fontWeight: 'bold' }}>← Previous</button>
          <button onClick={() => goToQuestion(currentIndex+1)} disabled={currentIndex === totalQuestions-1} style={{ background: currentIndex === totalQuestions-1 ? '#ccc' : '#1e3c72', color: 'white', padding: '10px 20px', border: 'none', borderRadius: 8, cursor: currentIndex === totalQuestions-1 ? 'not-allowed' : 'pointer', fontWeight: 'bold' }}>Next →</button>
        </div>

        {/* Question Palette */}
        <div style={{ background: darkMode ? '#16213e' : 'white', borderRadius: 16, padding: 20, marginBottom: 20 }}>
          <p style={{ fontSize: 14, fontWeight: 'bold', marginBottom: 12, color: darkMode ? '#fff' : '#333' }}>Question Palette</p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
            {questions.map((_, idx) => {
              const isAnswered = answers[idx] !== undefined;
              return (
                <button key={idx} onClick={() => goToQuestion(idx)} style={{
                  width: 40, height: 40, borderRadius: 8,
                  background: idx === currentIndex ? '#ff9800' : (isAnswered ? '#4caf50' : '#e0e0e0'),
                  color: (idx === currentIndex || isAnswered) ? 'white' : '#333',
                  fontWeight: 'bold', border: 'none', cursor: 'pointer'
                }}>
                  {idx+1}
                </button>
              );
            })}
          </div>
        </div>

        {/* Submit button */}
        <button onClick={handleSubmit} disabled={!allAnswered} style={{ width: '100%', background: allAnswered ? '#28a745' : '#ccc', color: 'white', padding: 14, border: 'none', borderRadius: 50, cursor: allAnswered ? 'pointer' : 'not-allowed', fontSize: 16, fontWeight: 'bold', marginBottom: 30, opacity: allAnswered ? 1 : 0.7 }}>
          {allAnswered ? 'Submit Examination' : `Please answer all questions (${answeredCount}/${totalQuestions})`}
        </button>
      </div>
      <div style={{ textAlign: 'center', padding: '20px' }}>
        <p style={{ color: '#999', fontSize: 12 }}>© 2026 ELITE Nursing & Midwifery CBT. All rights reserved.{' '}
          <Link to="/privacy" style={{ color: '#2196f3', fontSize: 11, textDecoration: 'none', marginLeft: 4 }}>
            Privacy Policy
          </Link>
          <span style={{ color: '#999', margin: '0 6px' }}>|</span>
          <Link to="/terms" style={{ color: '#2196f3', fontSize: 11, textDecoration: 'none' }}>
            Terms & Conditions
          </Link>
        </p>
      </div>
    </div>
  );
};

// How To Use Component
const HowToUse = () => {
  const { darkMode } = useContext(AuthContext);
  
  return (
    <div style={{ background: darkMode ? '#1a1a2e' : '#f0f7f4', minHeight: '100vh', padding: '20px' }}>
      <div style={{ maxWidth: 800, margin: '0 auto', background: darkMode ? '#16213e' : 'white', borderRadius: 20, padding: 30, boxShadow: '0 4px 15px rgba(0,0,0,0.1)' }}>
        <h2 style={{ color: '#1e3c72', textAlign: 'center', marginBottom: 20 }}>📖 How To Use ELITE CBT</h2>
        
        <div style={{ marginBottom: 30 }}>
          <h3 style={{ color: '#1e3c72', marginBottom: 10 }}>🆓 Free Mode</h3>
          <ul style={{ lineHeight: 1.8, color: darkMode ? '#ccc' : '#555', paddingLeft: 20 }}>
            <li>✓ Access Examination 1 of ANY course for FREE</li>
            <li>✓ Each free exam can only be taken ONCE</li>
            <li>✓ Your score is saved and displayed</li>
            <li>✓ Review your answers after completion</li>
            <li>✓ Upgrade to Premium to retake and unlock all exams</li>
          </ul>
        </div>
        
        <div style={{ marginBottom: 30 }}>
          <h3 style={{ color: '#ff9800', marginBottom: 10 }}>⭐ Premium Mode</h3>
          <ul style={{ lineHeight: 1.8, color: darkMode ? '#ccc' : '#555', paddingLeft: 20 }}>
            <li>✓ View ALL examinations across ALL courses</li>
            <li>✓ Premium badge shows which exams require upgrade</li>
            <li>✓ Upgrade and Choose a subscription plan that suits you to unlock everything</li>
            <li>✓ Lifetime access to 20,000+ questions</li>
            <li>✓ Unlimited exam retakes</li>
          </ul>
        </div>
        
        <div style={{ marginBottom: 30 }}>
          <h3 style={{ color: '#1e3c72', marginBottom: 10 }}>📱 Navigation Tips</h3>
          <ul style={{ lineStyle: 'none', lineHeight: 1.8, color: darkMode ? '#ccc' : '#555', paddingLeft: 0 }}>
            <li>🏠 <strong>Home</strong> - Select FREE or PREMIUM mode</li>
            <li>📚 <strong>Categories</strong> - Choose your subject area</li>
            <li>📖 <strong>Courses</strong> - Select specific topic</li>
            <li>📝 <strong>Exams</strong> - Take your chosen examination</li>
            <li>⭐ <strong>Get Premium</strong> - Upgrade for full access </li>
          </ul>
        </div>
        
        <div style={{ background: darkMode ? '#1a1a2e' : '#f0f7f4', padding: 16, borderRadius: 12, textAlign: 'center' }}>
          <p style={{ color: '#ff9800', fontWeight: 'bold', margin: 0 }}>Need help? Contact us via WhatsApp or Email!</p>
        </div>
      </div>
      <div style={{ textAlign: 'center', padding: '20px', marginTop: 20 }}>
        <p style={{ color: '#999', fontSize: 12 }}>© 2026 ELITE Nursing & Midwifery CBT. All rights reserved.{' '}
  <Link to="/privacy" style={{ color: '#2196f3', fontSize: 11, textDecoration: 'none', marginLeft: 4 }}>
    Privacy Policy
  </Link>
  <span style={{ color: '#999', margin: '0 6px' }}>|</span>
  <Link to="/terms" style={{ color: '#2196f3', fontSize: 11, textDecoration: 'none' }}>
    Terms & Conditions
  </Link></p>
      </div>
    </div>
  );
};

// About Us Component
const AboutUs = () => {
  const { darkMode } = useContext(AuthContext);
  return (
    <div style={{ background: darkMode ? '#1a1a2e' : '#f0f7f4', minHeight: '100vh', padding: '20px' }}>
      <div style={{ maxWidth: 800, margin: '0 auto', background: darkMode ? '#16213e' : 'white', borderRadius: 20, padding: 30, boxShadow: '0 4px 15px rgba(0,0,0,0.1)' }}>
        <h2 style={{ color: '#1e3c72', textAlign: 'center', marginBottom: 20 }}>About Us</h2>
        <p style={{ lineHeight: 1.8, marginBottom: 20, color: darkMode ? '#ccc' : '#555' }}>ELITE NURSING & MIDWIFERY CBT is a premier Computer Based Testing platform designed specifically for nursing and midwifery students in Nigeria.</p>
        <p style={{ lineHeight: 1.8, marginBottom: 20, color: darkMode ? '#ccc' : '#555' }}>Our mission is to provide high-quality, accessible exam preparation materials that help students succeed in their nursing and midwifery licensing examinations.</p>
        <p style={{ lineHeight: 1.8, marginBottom: 20, color: darkMode ? '#ccc' : '#555' }}>With over 20,000 practice questions covering General Nursing, Midwifery, Pediatric Nursing, Dental Nursing, and Public Health, we are committed to excellence in nursing education.</p>
        <h3 style={{ color: '#ff9800', marginTop: 30 }}>Coming Soon</h3>
        <p>NCLEX Practice questions are coming soon!</p>
      </div>
      <div style={{ textAlign: 'center', padding: '20px', marginTop: 20 }}>
        <p style={{ color: '#999', fontSize: 12 }}>© 2026 ELITE Nursing & Midwifery CBT. All rights reserved.{' '}
  <Link to="/privacy" style={{ color: '#2196f3', fontSize: 11, textDecoration: 'none', marginLeft: 4 }}>
    Privacy Policy
  </Link>
  <span style={{ color: '#999', margin: '0 6px' }}>|</span>
  <Link to="/terms" style={{ color: '#2196f3', fontSize: 11, textDecoration: 'none' }}>
    Terms & Conditions
  </Link></p>
      </div>
    </div>
  );
};

// Contact Us Component
const ContactUs = () => {
  const { darkMode } = useContext(AuthContext);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSubmitted(false);
    try {
      await axios.post('/api/contact', { name, email, message });
      setSubmitted(true);
      setName('');
      setEmail('');
      setMessage('');
      setTimeout(() => setSubmitted(false), 5000);
    } catch (error) {
      setError('Failed to send message. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ background: darkMode ? '#1a1a2e' : '#f0f7f4', minHeight: '100vh', padding: '20px' }}>
      <div style={{ maxWidth: 900, margin: '0 auto' }}>
        <div style={{ background: darkMode ? '#16213e' : 'white', borderRadius: 20, padding: 24, marginBottom: 24, boxShadow: '0 4px 15px rgba(0,0,0,0.1)' }}>
          <h2 style={{ color: '#1e3c72', textAlign: 'center', marginBottom: 20 }}>Get in Touch</h2>
          <p style={{ textAlign: 'center', marginBottom: 30, color: darkMode ? '#ccc' : '#666' }}>We'd love to hear from you! Choose your preferred way to reach us.</p>
          
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 20, marginBottom: 30 }}>
            <div style={{ textAlign: 'center', padding: 16, background: darkMode ? '#1a1a2e' : '#f0f7f4', borderRadius: 12 }}>
              <div style={{ fontSize: 36, marginBottom: 8 }}>📧</div>
              <h3 style={{ color: '#1e3c72', fontSize: 16, marginBottom: 4 }}>Email</h3>
              <p style={{ fontSize: 13, wordBreak: 'break-all' }}>elitenursingcbt@gmail.com</p>
            </div>
            <div style={{ textAlign: 'center', padding: 16, background: darkMode ? '#1a1a2e' : '#f0f7f4', borderRadius: 12 }}>
              <div style={{ fontSize: 36, marginBottom: 8 }}>📞</div>
              <h3 style={{ color: '#1e3c72', fontSize: 16, marginBottom: 4 }}>Phone / WhatsApp</h3>
              <p style={{ fontSize: 13 }}>09063908476</p>
            </div>
            <div style={{ textAlign: 'center', padding: 16, background: darkMode ? '#1a1a2e' : '#f0f7f4', borderRadius: 12 }}>
              <div style={{ fontSize: 36, marginBottom: 8 }}>💬</div>
              <h3 style={{ color: '#1e3c72', fontSize: 16, marginBottom: 4 }}>WhatsApp Group</h3>
              <a href="https://chat.whatsapp.com/HdpwnXzyrLrIqwnpjZqVsb" target="_blank" rel="noopener noreferrer" style={{ color: '#25D366', textDecoration: 'none', fontWeight: 'bold', fontSize: 13 }}>Join Community →</a>
            </div>
          </div>
        </div>
        
        <div style={{ background: darkMode ? '#16213e' : 'white', borderRadius: 20, padding: 24, boxShadow: '0 4px 15px rgba(0,0,0,0.1)' }}>
          <h3 style={{ color: '#1e3c72', textAlign: 'center', marginBottom: 20, fontSize: 18 }}>Send us a Message</h3>
          
          {error && (
            <div style={{ background: '#ffebee', padding: 12, borderRadius: 10, marginBottom: 16, textAlign: 'center' }}>
              <p style={{ color: '#c62828', margin: 0, fontSize: 13 }}>{error}</p>
            </div>
          )}
          {submitted && (
            <div style={{ background: '#e8f5e9', padding: 12, borderRadius: 10, marginBottom: 16, textAlign: 'center' }}>
              <p style={{ color: '#2e7d32', margin: 0, fontSize: 13 }}>✅ Message sent! We'll respond soon.</p>
            </div>
          )}
          
          <form onSubmit={handleSubmit}>
            <div style={{ marginBottom: 16 }}>
              <input type="text" placeholder="Your Name" value={name} onChange={(e) => setName(e.target.value)} required style={{ width: '100%', padding: '12px 14px', border: '1px solid #ddd', borderRadius: 10, fontSize: 14, background: darkMode ? '#1a1a2e' : '#f8f9fa', color: darkMode ? 'white' : '#333', boxSizing: 'border-box' }} />
            </div>
            <div style={{ marginBottom: 16 }}>
              <input type="email" placeholder="Your Email" value={email} onChange={(e) => setEmail(e.target.value)} required style={{ width: '100%', padding: '12px 14px', border: '1px solid #ddd', borderRadius: 10, fontSize: 14, background: darkMode ? '#1a1a2e' : '#f8f9fa', color: darkMode ? 'white' : '#333', boxSizing: 'border-box' }} />
            </div>
            <div style={{ marginBottom: 20 }}>
              <textarea placeholder="Your Message" value={message} onChange={(e) => setMessage(e.target.value)} required rows="4" style={{ width: '100%', padding: '12px', border: '1px solid #ddd', borderRadius: 10, fontSize: 14, resize: 'vertical', background: darkMode ? '#1a1a2e' : '#f8f9fa', color: darkMode ? 'white' : '#333', boxSizing: 'border-box' }} />
            </div>
            <button type="submit" disabled={loading} style={{ width: '100%', background: 'linear-gradient(135deg, #1e3c72 0%, #2a5298 100%)', color: 'white', padding: '12px', border: 'none', borderRadius: 10, cursor: 'pointer', fontWeight: 'bold', fontSize: 14, opacity: loading ? 0.7 : 1 }}>
              {loading ? 'Sending...' : 'Send Message'}
            </button>
          </form>
        </div>
      </div>
      <div style={{ textAlign: 'center', padding: '20px', marginTop: 20 }}>
        <p style={{ color: '#999', fontSize: 12 }}>© 2026 ELITE Nursing & Midwifery CBT. All rights reserved.{' '}
  <Link to="/privacy" style={{ color: '#2196f3', fontSize: 11, textDecoration: 'none', marginLeft: 4 }}>
    Privacy Policy
  </Link>
  <span style={{ color: '#999', margin: '0 6px' }}>|</span>
  <Link to="/terms" style={{ color: '#2196f3', fontSize: 11, textDecoration: 'none' }}>
    Terms & Conditions
  </Link></p>
      </div>
    </div>
  );
};

// My History Component – with custom delete confirmation modal
const MyHistory = () => {
  const [attempts, setAttempts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deleteConfirm, setDeleteConfirm] = useState(null); // { quizId, title }
  const { darkMode } = useContext(AuthContext);

  const loadAttempts = () => {
    const all = getAllAttempts();
    const list = Object.entries(all).map(([quizId, data]) => ({
      quizId,
      ...data
    }));
    list.sort((a, b) => new Date(b.completedAt) - new Date(a.completedAt));
    setAttempts(list);
    setLoading(false);
  };

  useEffect(() => {
    loadAttempts();
  }, []);

  const handleClearAll = () => {
    setDeleteConfirm({ quizId: 'ALL', title: 'ALL exams' });
  };

  const confirmDelete = () => {
    if (deleteConfirm.quizId === 'ALL') {
      clearAllAttempts();
    } else {
      const all = getAllAttempts();
      delete all[deleteConfirm.quizId];
      localStorage.setItem('exam_attempts', JSON.stringify(all));
    }
    setDeleteConfirm(null);
    loadAttempts(); // refresh list
  };

  const cancelDelete = () => {
    setDeleteConfirm(null);
  };

  if (loading) return <LoadingWithBar message="Loading history..." />;

  if (attempts.length === 0) {
    return (
      <div style={{ background: darkMode ? '#1a1a2e' : '#f0f7f4', minHeight: '100vh', padding: '50px', textAlign: 'center' }}>
        <div style={{ fontSize: 64, marginBottom: 20 }}>📖</div>
        <h2 style={{ color: '#1e3c72' }}>No Exam History</h2>
        <p>Complete some exams to see your history here.</p>
        <Link to="/"><button style={{ marginTop: 20, background: '#1e3c72', color: 'white', padding: '10px 20px', border: 'none', borderRadius: 8, cursor: 'pointer' }}>Browse Exams</button></Link>
      </div>
    );
  }

  // Group by category and topic
  const grouped = {};
  attempts.forEach(attempt => {
    const cat = attempt.category || 'general-nursing';
    const topic = attempt.topic || 'General';
    if (!grouped[cat]) grouped[cat] = {};
    if (!grouped[cat][topic]) grouped[cat][topic] = [];
    grouped[cat][topic].push(attempt);
  });

  const categoryNames = {
    'general-nursing': 'General Nursing',
    'midwifery': 'Midwifery',
    'public-health': 'Public Health',
    'pediatric-nursing': 'Pediatric Nursing',
    'dental-nursing': 'Dental Nursing'
  };

  return (
    <div style={{ background: darkMode ? '#1a1a2e' : '#f0f7f4', minHeight: '100vh', padding: '20px' }}>
      <div style={{ maxWidth: 1200, margin: '0 auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, flexWrap: 'wrap', gap: 12 }}>
          <h1 style={{ color: '#1e3c72' }}>📚 My Exam History</h1>
          <button
            onClick={handleClearAll}
            style={{ background: '#dc3545', color: 'white', border: 'none', padding: '8px 16px', borderRadius: 8, cursor: 'pointer', fontWeight: 'bold' }}
          >
            Clear All History
          </button>
        </div>

        {Object.entries(grouped).map(([category, topics]) => (
          <div key={category} style={{ marginBottom: 40 }}>
            <h2 style={{ color: '#ff9800', borderLeft: `4px solid #ff9800`, paddingLeft: 12, marginBottom: 16 }}>
              {categoryNames[category] || category}
            </h2>
            {Object.entries(topics).map(([topic, exams]) => (
              <div key={topic} style={{ marginBottom: 24 }}>
                <h3 style={{ color: '#1e3c72', fontSize: 18, marginBottom: 12 }}>{topic}</h3>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 16 }}>
                  {exams.map((exam) => (
                    <div key={exam.quizId} style={{ background: darkMode ? '#16213e' : 'white', padding: 16, borderRadius: 12, boxShadow: '0 2px 8px rgba(0,0,0,0.1)', position: 'relative' }}>
                      <button
                        onClick={() => setDeleteConfirm({ quizId: exam.quizId, title: exam.title })}
                        style={{
                          position: 'absolute',
                          top: 8,
                          right: 8,
                          background: '#dc3545',
                          color: 'white',
                          border: 'none',
                          borderRadius: 4,
                          fontSize: 12,
                          cursor: 'pointer',
                          padding: '4px 8px',
                          fontWeight: 'bold'
                        }}
                      >
                        Delete
                      </button>
                      <div style={{ fontSize: 32, marginBottom: 8 }}>📝</div>
                      <h4 style={{ color: '#1e3c72', marginBottom: 4 }}>{exam.title}</h4>
                      <p style={{ fontSize: 13, color: '#666' }}>Score: {exam.score}/{exam.total} ({exam.percentage}%)</p>
                      <p style={{ fontSize: 12, color: '#999' }}>Completed: {new Date(exam.completedAt).toLocaleString()}</p>
                      <Link to={`/review/${exam.quizId}`}>
                        <button style={{ width: '100%', marginTop: 12, background: '#1e3c72', color: 'white', border: 'none', padding: '8px', borderRadius: 8, cursor: 'pointer', fontWeight: 'bold' }}>Review Exam</button>
                      </Link>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        ))}
      </div>

      {/* Custom Delete Confirmation Modal */}
      {deleteConfirm && (
        <div style={{
          position: 'fixed',
          top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0,0,0,0.7)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 2000
        }}>
          <div style={{
            background: 'white',
            borderRadius: 20,
            padding: 24,
            maxWidth: 320,
            width: '90%',
            textAlign: 'center',
            boxShadow: '0 4px 15px rgba(0,0,0,0.2)'
          }}>
            <div style={{ fontSize: 48, marginBottom: 12 }}>⚠️</div>
            <h3 style={{ color: '#1e3c72', marginBottom: 8 }}>Delete Exam History</h3>
            <p style={{ color: '#666', marginBottom: 20 }}>
              {deleteConfirm.quizId === 'ALL'
                ? 'Are you sure you want to delete ALL exam history? This cannot be undone.'
                : `Delete "${deleteConfirm.title}" from your history?`
              }
            </p>
            <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
              <button onClick={cancelDelete} style={{ background: '#6c757d', color: 'white', padding: '8px 20px', border: 'none', borderRadius: 8, cursor: 'pointer', fontWeight: 'bold' }}>Back</button>
              <button onClick={confirmDelete} style={{ background: '#dc3545', color: 'white', padding: '8px 20px', border: 'none', borderRadius: 8, cursor: 'pointer', fontWeight: 'bold' }}>Delete</button>
            </div>
          </div>
        </div>
      )}

      <div style={{ textAlign: 'center', padding: '20px', marginTop: 20 }}>
        <p style={{ color: '#999', fontSize: 12 }}>© 2026 ELITE Nursing & Midwifery CBT. All rights reserved.{' '}
  <Link to="/privacy" style={{ color: '#2196f3', fontSize: 11, textDecoration: 'none', marginLeft: 4 }}>
    Privacy Policy
  </Link>
  <span style={{ color: '#999', margin: '0 6px' }}>|</span>
  <Link to="/terms" style={{ color: '#2196f3', fontSize: 11, textDecoration: 'none' }}>
    Terms & Conditions
  </Link></p>
      </div>
    </div>
  );
};

// Review Exam Component – shows questions, user answers, correct answers
const ReviewExam = () => {
  const { id } = useParams();
  const [attempt, setAttempt] = useState(null);
  const [quiz, setQuiz] = useState(null);
  const [loading, setLoading] = useState(true);
  const { token, darkMode } = useContext(AuthContext);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        // Load the saved attempt
        const saved = getExamAttempt(id);
        if (!saved) {
          alert('No saved attempt found for this exam.');
          window.location.href = '/history';
          return;
        }
        setAttempt(saved);
        // Fetch the quiz questions (to get the full question text and options)
        const res = await axios.get(`/api/quizzes/${id}`, { headers: { Authorization: `Bearer ${token}` } });
        setQuiz(res.data);
      } catch (error) {
        console.error(error);
        alert('Failed to load review data.');
      } finally {
        setLoading(false);
      }
    };
    if (id && token) fetchData();
  }, [id, token]);

  if (loading) return <LoadingWithBar message="Loading review..." />;
  if (!attempt || !quiz) return <div>Review data not found</div>;

  const questions = quiz.questions;
  const userAnswers = attempt.answers;

  return (
    <div style={{ background: darkMode ? '#1a1a2e' : '#f0f7f4', minHeight: '100vh', padding: '20px' }}>
      <div style={{ maxWidth: 800, margin: '0 auto' }}>
        <div style={{ marginBottom: 24 }}>
          <Link to="/history" style={{ textDecoration: 'none', color: '#1e3c72' }}>← Back to History</Link>
        </div>
        <div style={{ background: darkMode ? '#16213e' : 'white', borderRadius: 16, padding: 24, textAlign: 'center', marginBottom: 20 }}>
          <h2 style={{ color: '#1e3c72' }}>{attempt.title}</h2>
          <p>Your Score: {attempt.score}/{attempt.total} ({attempt.percentage}%)</p>
          <p>Completed: {new Date(attempt.completedAt).toLocaleString()}</p>
        </div>
        {questions.map((q, idx) => {
          const userAnswer = userAnswers[idx];
          const isCorrect = (userAnswer !== undefined && userAnswer === q.correctAnswer);
          return (
            <div key={idx} style={{ background: darkMode ? '#16213e' : 'white', borderRadius: 12, padding: 16, marginBottom: 16, borderLeft: `5px solid ${isCorrect ? '#4caf50' : '#f44336'}` }}>
              <h4 style={{ marginBottom: 12 }}>Q{idx+1}: {q.questionText}</h4>
              {q.options.map((opt, optIdx) => {
                let bgColor = '#f5f5f5';
                if (optIdx === q.correctAnswer) bgColor = '#c8e6c9';
                if (optIdx === userAnswer && optIdx !== q.correctAnswer) bgColor = '#ffcdd2';
                return (
                  <div key={optIdx} style={{ padding: '10px 12px', margin: '6px 0', background: bgColor, borderRadius: 8, fontSize: 14 }}>
                    <span style={{ fontWeight: 'bold', marginRight: 10 }}>{String.fromCharCode(65 + optIdx)}.</span> {opt}
                    {optIdx === q.correctAnswer && <span style={{ color: '#4caf50', marginLeft: 10, fontSize: 12 }}>✓ Correct Answer</span>}
                    {optIdx === userAnswer && optIdx !== q.correctAnswer && <span style={{ color: '#f44336', marginLeft: 10, fontSize: 12 }}>✗ Your Answer</span>}
                  </div>
                );
              })}
            </div>
          );
        })}
        <div style={{ textAlign: 'center', marginTop: 24 }}>
          <Link to="/history"><button style={{ background: '#1e3c72', color: 'white', padding: '10px 20px', border: 'none', borderRadius: 8, cursor: 'pointer' }}>Back to History</button></Link>
        </div>
      </div>
    </div>
  );
};

// Premium Exam Component – with premium blocking
const PremiumExam = () => {
  const { categoryName, topic, examId, mode } = useParams();
  const [loading, setLoading] = useState(true);
  const [questions, setQuestions] = useState([]);
  const [examTitle, setExamTitle] = useState('');
  const [answers, setAnswers] = useState({});
  const [currentIndex, setCurrentIndex] = useState(0);
  const [submitted, setSubmitted] = useState(false);
  const [result, setResult] = useState(null);
  const [showReview, setShowReview] = useState(false);
  const [timeUp, setTimeUp] = useState(false);
  const [premiumBlocked, setPremiumBlocked] = useState(false);
  const { token, darkMode } = useContext(AuthContext);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchExam = async () => {
      setLoading(true);
      try {
        // ========== PREMIUM BLOCK ==========
        if (mode === 'premium') {
          try {
            const profileRes = await axios.get('/api/user/profile', { headers: { Authorization: `Bearer ${token}` } });
            if (!profileRes.data.isPremium) {
              setPremiumBlocked(true);
              setLoading(false);
              return;
            }
          } catch (profileError) {
            setPremiumBlocked(true);
            setLoading(false);
            return;
          }
        }
        // ===================================

        const res = await axios.get('/api/quizzes', { headers: { Authorization: `Bearer ${token}` } });
        const allQuizzes = res.data.filter(q => q.category === categoryName && q.topic === topic);
        allQuizzes.sort((a, b) => {
          const numA = parseInt(a.title.match(/\d+/)?.[0] || 0);
          const numB = parseInt(b.title.match(/\d+/)?.[0] || 0);
          return numA - numB;
        });
        const allQuestions = [];
        allQuizzes.forEach(quiz => {
          allQuestions.push(...quiz.questions);
        });
        const chunkSize = 250;
        const examIndex = parseInt(examId) - 1;
        const start = examIndex * chunkSize;
        const end = Math.min(start + chunkSize, allQuestions.length);
        if (start >= allQuestions.length) {
          alert('Exam not found');
          navigate(`/courses/${categoryName}/${mode}`);
          return;
        }
        const chunk = allQuestions.slice(start, end);
        setQuestions(chunk);
        const from = start + 1;
        const to = end;
        setExamTitle(`Exam ${examId}: ${topic} (Questions ${from} – ${to})`);
        setAnswers({});
        setCurrentIndex(0);
        setSubmitted(false);
        setResult(null);
        setShowReview(false);
        setTimeUp(false);
      } catch (error) {
        console.error(error);
        alert('Failed to load premium exam');
      } finally {
        setLoading(false);
      }
    };
    if (token && categoryName && topic && examId) {
      fetchExam();
    }
  }, [categoryName, topic, examId, token, navigate, mode]);

  // Save answers to localStorage
  useEffect(() => {
    if (!submitted && Object.keys(answers).length > 0) {
      localStorage.setItem(`premium_exam_${examId}_answers`, JSON.stringify(answers));
    }
  }, [answers, examId, submitted]);

  const handleAnswer = (answerIndex) => {
    setAnswers(prev => ({ ...prev, [currentIndex]: answerIndex }));
  };

  const goToQuestion = (index) => {
    if (index >= 0 && index < questions.length) {
      setCurrentIndex(index);
    }
  };

  const handleTimeUp = () => {
    setTimeUp(true);
    handleSubmit();
  };

  const handleSubmit = () => {
    let score = 0;
    questions.forEach((question, idx) => {
      if (answers[idx] !== undefined && answers[idx] === question.correctAnswer) {
        score++;
      }
    });
    const percentage = ((score / questions.length) * 100).toFixed(1);
    const total = questions.length;

    setResult({ score, total, percentage, passed: percentage >= 70 });
    setSubmitted(true);
    localStorage.removeItem(`premium_exam_${examId}_answers`);
  };

  const answeredCount = Object.keys(answers).length;
  const totalQuestions = questions.length;
  const allAnswered = answeredCount === totalQuestions;

  if (loading) return <LoadingWithBar message="Loading premium exam..." />;

  // ========== PREMIUM BLOCKED MODAL ==========
  if (premiumBlocked) {
    return (
      <div style={{ background: darkMode ? '#1a1a2e' : '#f0f7f4', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ background: darkMode ? '#16213e' : 'white', borderRadius: 20, padding: 32, maxWidth: 400, textAlign: 'center' }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>⭐</div>
          <h2 style={{ color: '#1e3c72' }}>Premium Required</h2>
          <p>This exam is only available in Premium Mode. Please upgrade to access it.</p>
          <div style={{ display: 'flex', gap: 12, marginTop: 20 }}>
            <Link to={`/courses/${categoryName}/${mode}`} style={{ flex: 1 }}>
              <button style={{ width: '100%', background: '#6c757d', color: 'white', padding: '12px', border: 'none', borderRadius: 8, cursor: 'pointer', fontWeight: 'bold' }}>Back</button>
            </Link>
            <Link to="/get-premium" style={{ flex: 1 }}>
              <button style={{ width: '100%', background: '#ff9800', color: 'white', padding: '12px', border: 'none', borderRadius: 8, cursor: 'pointer', fontWeight: 'bold' }}>Upgrade Now</button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (questions.length === 0) {
    return <div style={{ padding: 40, textAlign: 'center' }}>Exam not found</div>;
  }

  // Results view
  if (submitted && !showReview) {
    return (
      <div style={{ background: darkMode ? '#1a1a2e' : '#f0f7f4', minHeight: '100vh', padding: '20px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column' }}>
        <div style={{ maxWidth: 450, width: '100%', background: darkMode ? '#16213e' : 'white', borderRadius: 20, padding: 32, textAlign: 'center' }}>
          <h2 style={{ color: '#1e3c72', fontSize: 24 }}>Exam Results</h2>
          <p style={{ fontSize: 36, margin: '20px 0' }}>Score: <strong style={{ color: '#1e3c72' }}>{result.score}</strong> / {result.total}</p>
          <p style={{ fontSize: 24, marginBottom: 20 }}>Percentage: <strong>{result.percentage}%</strong></p>
          <p style={{ fontSize: 24, color: result.passed ? '#2e7d32' : '#dc3545', fontWeight: 'bold' }}>
            {result.passed ? '✓ PASSED!' : '✗ Failed'}
          </p>
          {timeUp && <p style={{ color: '#ff9800' }}>⏰ Time's up!</p>}
          <div style={{ display: 'flex', gap: 12, marginTop: 24, justifyContent: 'center' }}>
            <button onClick={() => setShowReview(true)} style={{ background: '#1e3c72', color: 'white', padding: '10px 20px', border: 'none', borderRadius: 10, cursor: 'pointer', fontWeight: 'bold', fontSize: 14 }}>Review Answers</button>
            <Link to={`/courses/${categoryName}/${mode}`}><button style={{ background: '#6c757d', color: 'white', padding: '10px 20px', border: 'none', borderRadius: 10, cursor: 'pointer', fontWeight: 'bold', fontSize: 14 }}>Back to Topics</button></Link>
          </div>
        </div>
      </div>
    );
  }

  // Review answers
  if (submitted && showReview) {
    return (
      <div style={{ background: darkMode ? '#1a1a2e' : '#f0f7f4', minHeight: '100vh', padding: '20px' }}>
        <div style={{ maxWidth: 800, margin: '0 auto' }}>
          <div style={{ background: darkMode ? '#16213e' : 'white', borderRadius: 16, padding: 20, marginBottom: 20, textAlign: 'center' }}>
            <h2 style={{ color: '#1e3c72', fontSize: 22 }}>Answer Review</h2>
            <p style={{ fontSize: 14 }}>Score: {result.score}/{result.total} ({result.percentage}%)</p>
            <Link to={`/courses/${categoryName}/${mode}`}><button style={{ background: '#1e3c72', color: 'white', padding: '8px 20px', border: 'none', borderRadius: 8, cursor: 'pointer', fontSize: 13, marginTop: 10 }}>Back to Topics</button></Link>
          </div>
          {questions.map((q, idx) => {
            const userAnswer = answers[idx];
            const isCorrect = userAnswer !== undefined && userAnswer === q.correctAnswer;
            return (
              <div key={idx} style={{ background: darkMode ? '#16213e' : 'white', borderRadius: 12, padding: 16, marginBottom: 12, borderLeft: `5px solid ${isCorrect ? '#4caf50' : '#f44336'}` }}>
                <h4 style={{ fontSize: 15, marginBottom: 10 }}>Q{idx+1}: {q.questionText}</h4>
                {q.options.map((opt, optIdx) => (
                  <div key={optIdx} style={{ padding: '10px 12px', margin: '6px 0', background: optIdx === q.correctAnswer ? '#c8e6c9' : (optIdx === userAnswer ? '#ffcdd2' : '#f5f5f5'), borderRadius: 10, fontSize: 14 }}>
                    <span style={{ fontWeight: 'bold', marginRight: 10 }}>{String.fromCharCode(65 + optIdx)}.</span> {opt}
                    {optIdx === q.correctAnswer && <span style={{ color: '#4caf50', marginLeft: 10, fontSize: 12 }}>✓ Correct</span>}
                    {optIdx === userAnswer && optIdx !== q.correctAnswer && <span style={{ color: '#f44336', marginLeft: 10, fontSize: 12 }}>✗ Your Answer</span>}
                  </div>
                ))}
              </div>
            );
          })}
          <Link to={`/courses/${categoryName}/${mode}`}><button style={{ width: '100%', marginTop: 20, background: '#1e3c72', color: 'white', padding: 14, border: 'none', borderRadius: 10, cursor: 'pointer', fontWeight: 'bold' }}>Back to Topics</button></Link>
        </div>
      </div>
    );
  }

  // Active exam – one question at a time
  const currentQuestion = questions[currentIndex];
  const timerDuration = questions.length;

  return (
    <div style={{ background: darkMode ? '#1a1a2e' : '#f0f7f4', minHeight: '100vh' }}>
      <Timer duration={timerDuration} onTimeUp={handleTimeUp} />
      <div style={{ padding: '20px', maxWidth: 1000, margin: '0 auto' }}>
        <div style={{ background: darkMode ? '#16213e' : 'white', borderRadius: 16, padding: 20, marginBottom: 20, textAlign: 'center' }}>
          <h2 style={{ color: '#1e3c72', margin: 0, fontSize: 20 }}>{examTitle}</h2>
          <p style={{ fontSize: 14, marginTop: 4 }}>Question {currentIndex+1} of {totalQuestions}</p>
          <p style={{ fontSize: 13, color: '#666' }}>Answered: {answeredCount}/{totalQuestions}</p>
        </div>

        {/* Current question */}
        <div style={{ background: '#1e3c72', borderRadius: 16, padding: 20, marginBottom: 20 }}>
          <h4 style={{ color: 'white', marginBottom: 16, fontSize: 16 }}>Question {currentIndex+1}: {currentQuestion.questionText}</h4>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {currentQuestion.options.map((opt, optIdx) => (
              <label key={optIdx} style={{
                display: 'flex', alignItems: 'center', cursor: 'pointer', padding: 12, margin: 0,
                background: answers[currentIndex] === optIdx ? '#ff9800' : 'white', borderRadius: 10,
                transition: 'all 0.2s ease', fontWeight: answers[currentIndex] === optIdx ? 'bold' : 'normal'
              }}>
                <input type="radio" name="currentQuestion" onChange={() => handleAnswer(optIdx)} checked={answers[currentIndex] === optIdx} style={{ marginRight: 15, width: 18, height: 18 }} />
                <span style={{ fontWeight: 'bold', marginRight: 10, fontSize: 14 }}>{String.fromCharCode(65 + optIdx)}.</span>
                <span style={{ fontSize: 14 }}>{opt}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Navigation */}
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, marginBottom: 30 }}>
          <button onClick={() => goToQuestion(currentIndex-1)} disabled={currentIndex === 0} style={{ background: currentIndex === 0 ? '#ccc' : '#1e3c72', color: 'white', padding: '10px 20px', border: 'none', borderRadius: 8, cursor: currentIndex === 0 ? 'not-allowed' : 'pointer', fontWeight: 'bold' }}>← Previous</button>
          <button onClick={() => goToQuestion(currentIndex+1)} disabled={currentIndex === totalQuestions-1} style={{ background: currentIndex === totalQuestions-1 ? '#ccc' : '#1e3c72', color: 'white', padding: '10px 20px', border: 'none', borderRadius: 8, cursor: currentIndex === totalQuestions-1 ? 'not-allowed' : 'pointer', fontWeight: 'bold' }}>Next →</button>
        </div>

        {/* Question Palette */}
        <div style={{ background: darkMode ? '#16213e' : 'white', borderRadius: 16, padding: 20, marginBottom: 20 }}>
          <p style={{ fontSize: 14, fontWeight: 'bold', marginBottom: 12, color: darkMode ? '#fff' : '#333' }}>Question Palette</p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
            {questions.map((_, idx) => {
              const isAnswered = answers[idx] !== undefined;
              return (
                <button key={idx} onClick={() => goToQuestion(idx)} style={{
                  width: 40, height: 40, borderRadius: 8,
                  background: idx === currentIndex ? '#ff9800' : (isAnswered ? '#4caf50' : '#e0e0e0'),
                  color: (idx === currentIndex || isAnswered) ? 'white' : '#333',
                  fontWeight: 'bold', border: 'none', cursor: 'pointer'
                }}>
                  {idx+1}
                </button>
              );
            })}
          </div>
        </div>

        {/* Submit */}
        <button onClick={handleSubmit} disabled={!allAnswered} style={{ width: '100%', background: allAnswered ? '#28a745' : '#ccc', color: 'white', padding: 14, border: 'none', borderRadius: 50, cursor: allAnswered ? 'pointer' : 'not-allowed', fontSize: 16, fontWeight: 'bold', marginBottom: 30, opacity: allAnswered ? 1 : 0.7 }}>
          {allAnswered ? 'Submit Examination' : `Please answer all questions (${answeredCount}/${totalQuestions})`}
        </button>
      </div>
      <div style={{ textAlign: 'center', padding: '20px' }}>
        <p style={{ color: '#999', fontSize: 12 }}>© 2026 ELITE Nursing & Midwifery CBT. All rights reserved.</p>
      </div>
    </div>
  );
};

// Privacy Policy Component
const PrivacyPolicy = () => {
  const { darkMode } = useContext(AuthContext);
  return (
    <div style={{ background: darkMode ? '#1a1a2e' : '#f0f7f4', minHeight: '100vh', padding: '40px 20px' }}>
      <div style={{ maxWidth: 800, margin: '0 auto', background: darkMode ? '#16213e' : 'white', borderRadius: 20, padding: 30, boxShadow: '0 4px 15px rgba(0,0,0,0.1)', color: darkMode ? '#eee' : '#333' }}>
        <button
          onClick={() => window.history.back()}
          style={{
            background: 'none',
            border: 'none',
            fontSize: 16,
            cursor: 'pointer',
            color: '#1e3c72',
            marginBottom: 16,
            display: 'inline-flex',
            alignItems: 'center',
            gap: 8
          }}
        >
          ← Back
        </button>
        <h2 style={{ color: '#1e3c72', textAlign: 'center', marginBottom: 20 }}>Privacy Policy</h2>
        <p><strong>Last updated:</strong> June 2026</p>
        <p>ELITE Nursing & Midwifery CBT ("we", "our", "us") is committed to protecting your privacy. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our mobile application and website (collectively, the "Platform").</p>
        
        <h3 style={{ color: '#1e3c72', marginTop: 20 }}>1. Information We Collect</h3>
        <p>We collect the following types of information:</p>
        <ul style={{ paddingLeft: 20 }}>
          <li><strong>Personal Identification Information:</strong> Name, email address, and phone number (if provided).</li>
          <li><strong>Account Credentials:</strong> Hashed password (we do not store plain-text passwords).</li>
          <li><strong>Quiz Activity:</strong> Exam attempts, scores, and progress.</li>
          <li><strong>Payment Information:</strong> Transaction records (via Flutterwave) – we do not store full card details.</li>
          <li><strong>Device Information:</strong> Device tokens for push notifications (via Firebase Cloud Messaging).</li>
          <li><strong>Usage Data:</strong> IP address, browser type, and interaction with the Platform.</li>
        </ul>

        <h3 style={{ color: '#1e3c72', marginTop: 20 }}>2. How We Use Your Information</h3>
        <ul style={{ paddingLeft: 20 }}>
          <li>To create and manage your account.</li>
          <li>To provide exam content and track your progress.</li>
          <li>To process payments and activate premium features.</li>
          <li>To send you important notifications (e.g., password reset, payment confirmation).</li>
          <li>To improve our services and user experience.</li>
        </ul>

        <h3 style={{ color: '#1e3c72', marginTop: 20 }}>3. Sharing Your Information</h3>
        <p>We do not sell or rent your personal data. We may share your information with:</p>
        <ul style={{ paddingLeft: 20 }}>
          <li><strong>Service Providers:</strong> MongoDB Atlas (database), Brevo (email), Firebase (push notifications), Flutterwave (payments) – all are GDPR/Privacy Shield compliant.</li>
          <li><strong>Legal Authorities:</strong> If required by law or to protect our rights.</li>
        </ul>

        <h3 style={{ color: '#1e3c72', marginTop: 20 }}>4. Data Security</h3>
        <p>We implement industry-standard measures (encryption, secure connections, access controls) to protect your data. However, no method of transmission over the internet is 100% secure.</p>

        <h3 style={{ color: '#1e3c72', marginTop: 20 }}>5. Your Rights</h3>
        <ul style={{ paddingLeft: 20 }}>
          <li>You may access, update, or delete your personal information by logging into your account or contacting us.</li>
          <li>You can opt out of push notifications via your device settings.</li>
          <li>You can request deletion of your account and associated data.</li>
        </ul>

        <h3 style={{ color: '#1e3c72', marginTop: 20 }}>6. Data Retention</h3>
        <p>We retain your data as long as your account is active. You can delete your account at any time; we will remove your personal data within a reasonable period, except for records required for legal or compliance reasons.</p>

        <h3 style={{ color: '#1e3c72', marginTop: 20 }}>7. Children's Privacy</h3>
        <p>Our Platform is not intended for children under the age of 13. We do not knowingly collect personal information from children.</p>

        <h3 style={{ color: '#1e3c72', marginTop: 20 }}>8. Changes to This Policy</h3>
        <p>We may update this policy from time to time. We will notify you of any changes by posting the new policy on this page and updating the "Last updated" date.</p>

        <h3 style={{ color: '#1e3c72', marginTop: 20 }}>9. Contact Us</h3>
        <p>If you have questions about this Privacy Policy, please contact us at:</p>
        <p>Email: elitenursingcbt@gmail.com</p>
        <p>Phone/WhatsApp: 09063908476</p>
      </div>
    </div>
  );
};

// Terms and Conditions Component
const TermsAndConditions = () => {
  const { darkMode } = useContext(AuthContext);
  return (
    <div style={{ background: darkMode ? '#1a1a2e' : '#f0f7f4', minHeight: '100vh', padding: '40px 20px' }}>
      <div style={{ maxWidth: 800, margin: '0 auto', background: darkMode ? '#16213e' : 'white', borderRadius: 20, padding: 30, boxShadow: '0 4px 15px rgba(0,0,0,0.1)', color: darkMode ? '#eee' : '#333' }}>
        <button
          onClick={() => window.history.back()}
          style={{
            background: 'none',
            border: 'none',
            fontSize: 16,
            cursor: 'pointer',
            color: '#1e3c72',
            marginBottom: 16,
            display: 'inline-flex',
            alignItems: 'center',
            gap: 8
          }}
        >
          ← Back
        </button>
        <h2 style={{ color: '#1e3c72', textAlign: 'center', marginBottom: 20 }}>Terms and Conditions</h2>
        <p><strong>Last updated:</strong> June 2026</p>
        <p>Welcome to ELITE Nursing & Midwifery CBT. By using our Platform, you agree to comply with and be bound by the following terms and conditions. Please read them carefully.</p>

        <h3 style={{ color: '#1e3c72', marginTop: 20 }}>1. Acceptance of Terms</h3>
        <p>By creating an account or using our Platform, you agree to these Terms and Conditions. If you do not agree, please do not use the Platform.</p>

        <h3 style={{ color: '#1e3c72', marginTop: 20 }}>2. User Accounts</h3>
        <ul style={{ paddingLeft: 20 }}>
          <li>You must provide accurate and complete information when creating an account.</li>
          <li>You are responsible for maintaining the confidentiality of your login credentials.</li>
          <li>You are responsible for all activities that occur under your account.</li>
          <li>You must be at least 13 years old to use the Platform.</li>
        </ul>

        <h3 style={{ color: '#1e3c72', marginTop: 20 }}>3. Acceptable Use</h3>
        <p>You agree not to:</p>
        <ul style={{ paddingLeft: 20 }}>
          <li>Use the Platform for any unlawful purpose.</li>
          <li>Share or distribute questions, answers, or exam content outside the Platform.</li>
          <li>Attempt to reverse-engineer or exploit the Platform.</li>
          <li>Impersonate another user or provide false information.</li>
          <li>Use automated scripts or bots to interact with the Platform.</li>
        </ul>

        <h3 style={{ color: '#1e3c72', marginTop: 20 }}>4. Intellectual Property</h3>
        <ul style={{ paddingLeft: 20 }}>
          <li>All content on the Platform, including questions, answers, graphics, and logos, is the property of ELITE Nursing & Midwifery CBT or its licensors.</li>
          <li>You may not copy, reproduce, distribute, or create derivative works without our prior written consent.</li>
        </ul>

        <h3 style={{ color: '#1e3c72', marginTop: 20 }}>5. Payments and Refunds</h3>
        <ul style={{ paddingLeft: 20 }}>
          <li>Premium features are available via any subscription plan that suits you (subject to change).</li>
          <li>Payments are processed securely via Flutterwave.</li>
          <li>All payments are non-refundable unless otherwise required by law.</li>
          <li>Premium access is granted immediately upon successful payment verification.</li>
        </ul>

        <h3 style={{ color: '#1e3c72', marginTop: 20 }}>6. Disclaimer of Warranties</h3>
        <p>The Platform is provided "as is" without any warranties of any kind, express or implied. We do not guarantee that the Platform will be error‑free, secure, or uninterrupted.</p>

        <h3 style={{ color: '#1e3c72', marginTop: 20 }}>7. Limitation of Liability</h3>
        <p>To the fullest extent permitted by law, ELITE Nursing & Midwifery CBT shall not be liable for any indirect, incidental, special, consequential, or punitive damages arising from your use of the Platform.</p>

        <h3 style={{ color: '#1e3c72', marginTop: 20 }}>8. Termination</h3>
        <ul style={{ paddingLeft: 20 }}>
          <li>We reserve the right to suspend or terminate your account if you violate these Terms.</li>
          <li>You may delete your account at any time by contacting us.</li>
        </ul>

        <h3 style={{ color: '#1e3c72', marginTop: 20 }}>9. Changes to Terms</h3>
        <p>We may update these Terms from time to time. Continued use of the Platform after changes constitutes acceptance of the revised Terms.</p>

        <h3 style={{ color: '#1e3c72', marginTop: 20 }}>10. Governing Law</h3>
        <p>These Terms are governed by the laws of Nigeria. Any disputes arising from these Terms shall be subject to the exclusive jurisdiction of the courts of Nigeria.</p>

        <h3 style={{ color: '#1e3c72', marginTop: 20 }}>11. Contact Us</h3>
        <p>If you have any questions about these Terms, please contact us:</p>
        <p>Email: elitenursingcbt@gmail.com</p>
        <p>Phone/WhatsApp: 09063908476</p>
      </div>
    </div>
  );
};

// Floating Chat Button – snap to edges, close button on outer side
const FloatingChatButton = () => {
  const [isVisible, setIsVisible] = useState(true);
  const [position, setPosition] = useState(() => {
    const saved = localStorage.getItem('chatButtonPosition');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        // Snap to edge based on saved X
        const snapX = parsed.x < window.innerWidth / 2 ? 0 : window.innerWidth - 60;
        return { x: snapX, y: parsed.y || 20 };
      } catch (e) {
        return { x: window.innerWidth - 60, y: 20 };
      }
    }
    return { x: window.innerWidth - 60, y: 20 };
  });
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [wasDragged, setWasDragged] = useState(false);

  // Load/save state (same as before)
  useEffect(() => {
    const visible = localStorage.getItem('chatButtonVisible');
    if (visible !== null) setIsVisible(visible === 'true');
  }, []);
  useEffect(() => {
    localStorage.setItem('chatButtonPosition', JSON.stringify(position));
  }, [position]);
  useEffect(() => {
    localStorage.setItem('chatButtonVisible', isVisible);
  }, [isVisible]);

  // Mouse drag
  const handleMouseDown = (e) => {
    e.preventDefault();
    setWasDragged(false);
    setIsDragging(true);
    const rect = e.currentTarget.getBoundingClientRect();
    setDragOffset({ x: e.clientX - rect.left, y: e.clientY - rect.top });
  };
  useEffect(() => {
    const handleMouseMove = (e) => {
      if (!isDragging) return;
      setWasDragged(true);
      let newX = e.clientX - dragOffset.x;
      let newY = e.clientY - dragOffset.y;
      const buttonSize = 60;
      newY = Math.max(0, Math.min(window.innerHeight - buttonSize, newY));
      const center = window.innerWidth / 2;
      newX = newX < center ? 0 : window.innerWidth - buttonSize;
      setPosition({ x: newX, y: newY });
    };
    const handleMouseUp = () => setIsDragging(false);
    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    }
    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, dragOffset]);

  // Touch drag
  const handleTouchStart = (e) => {
    const touch = e.touches[0];
    setWasDragged(false);
    setIsDragging(true);
    const rect = e.currentTarget.getBoundingClientRect();
    setDragOffset({ x: touch.clientX - rect.left, y: touch.clientY - rect.top });
  };
  useEffect(() => {
    const handleTouchMove = (e) => {
      if (!isDragging) return;
      e.preventDefault();
      setWasDragged(true);
      const touch = e.touches[0];
      let newX = touch.clientX - dragOffset.x;
      let newY = touch.clientY - dragOffset.y;
      const buttonSize = 60;
      newY = Math.max(0, Math.min(window.innerHeight - buttonSize, newY));
      const center = window.innerWidth / 2;
      newX = newX < center ? 0 : window.innerWidth - buttonSize;
      setPosition({ x: newX, y: newY });
    };
    const handleTouchEnd = () => setIsDragging(false);
    if (isDragging) {
      document.addEventListener('touchmove', handleTouchMove, { passive: false });
      document.addEventListener('touchend', handleTouchEnd);
    }
    return () => {
      document.removeEventListener('touchmove', handleTouchMove);
      document.removeEventListener('touchend', handleTouchEnd);
    };
  }, [isDragging, dragOffset]);

  const hideButton = () => setIsVisible(false);
  const showButton = () => setIsVisible(true);

  const handleClick = () => {
    if (!wasDragged) {
      window.open('https://wa.me/2349063908476', '_blank');
    }
  };

  const buttonSize = 60;
  const isOnRight = position.x > 0; // true if snapped to right edge
  const arrow = isOnRight ? '←' : '→';

  // Hidden trigger button
  if (!isVisible) {
    return (
      <button
        onClick={showButton}
        style={{
          position: 'fixed',
          ...(isOnRight ? { right: '10px' } : { left: '10px' }),
          top: Math.min(position.y, window.innerHeight - 50),
          zIndex: 9999,
          backgroundColor: '#25D366',
          color: 'white',
          width: '40px',
          height: '40px',
          borderRadius: '50%',
          border: 'none',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: '0 4px 15px rgba(0,0,0,0.2)',
          fontSize: '20px',
          cursor: 'pointer',
          transition: 'transform 0.2s'
        }}
        onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.1)'}
        onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
        aria-label="Show chat"
      >
        {arrow}
      </button>
    );
  }

  // Main draggable button
  return (
    <div
      style={{
        position: 'fixed',
        left: position.x,
        top: position.y,
        zIndex: 9999,
        width: buttonSize,
        height: buttonSize,
        borderRadius: '50%',
        backgroundColor: '#25D366',
        boxShadow: '0 4px 15px rgba(0,0,0,0.2)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        cursor: isDragging ? 'grabbing' : 'grab',
        transition: isDragging ? 'none' : 'box-shadow 0.2s',
        touchAction: 'none',
        userSelect: 'none'
      }}
      onMouseDown={handleMouseDown}
      onTouchStart={handleTouchStart}
      onClick={handleClick}
      onMouseEnter={(e) => {
        if (!isDragging) e.currentTarget.style.boxShadow = '0 6px 20px rgba(0,0,0,0.3)';
      }}
      onMouseLeave={(e) => {
        if (!isDragging) e.currentTarget.style.boxShadow = '0 4px 15px rgba(0,0,0,0.2)';
      }}
    >
      <span style={{ fontSize: '28px', pointerEvents: 'none' }}>💬</span>

      {/* Close button – positioned on outer side */}
      <button
        onClick={(e) => {
          e.stopPropagation();
          hideButton();
        }}
        style={{
          position: 'absolute',
          top: '-6px',
          // If on right edge, place X on left; else place on right
          ...(isOnRight ? { left: '-6px' } : { right: '-6px' }),
          width: '22px',
          height: '22px',
          borderRadius: '50%',
          background: '#dc3545',
          color: 'white',
          border: '2px solid white',
          fontSize: '12px',
          fontWeight: 'bold',
          lineHeight: '1',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer',
          boxShadow: '0 2px 6px rgba(0,0,0,0.2)',
          padding: 0,
          pointerEvents: 'auto'
        }}
        aria-label="Hide chat button"
      >
        ×
      </button>
    </div>
  );
};

// Join WhatsApp Component
const JoinWhatsApp = () => {
  const { darkMode } = useContext(AuthContext);
  return (
    <div style={{ background: darkMode ? '#1a1a2e' : '#f0f7f4', minHeight: '100vh', padding: '20px' }}>
      <div style={{ maxWidth: 500, margin: '0 auto', background: darkMode ? '#16213e' : 'white', borderRadius: 20, padding: 30, textAlign: 'center', boxShadow: '0 4px 15px rgba(0,0,0,0.1)' }}>
        <div style={{ fontSize: 64, marginBottom: 16 }}>💬</div>
        <h2 style={{ color: '#1e3c72', marginBottom: 10 }}>Join Our WhatsApp Community</h2>
        <p style={{ marginBottom: 20, fontSize: 14 }}>Get instant updates, study tips, and connect with fellow nursing students!</p>
        <div style={{ background: darkMode ? '#1a1a2e' : '#f0f7f4', padding: 16, borderRadius: 12, marginBottom: 20, textAlign: 'left' }}>
          <h3 style={{ color: '#1e3c72', fontSize: 16, marginBottom: 10 }}>What you'll get:</h3>
          <ul style={{ listStyle: 'none', padding: 0, fontSize: 13 }}>
            <li style={{ marginBottom: 6 }}>✓ Daily practice questions</li>
            <li style={{ marginBottom: 6 }}>✓ Exam tips and strategies</li>
            <li style={{ marginBottom: 6 }}>✓ Updates on new features</li>
            <li style={{ marginBottom: 6 }}>✓ Peer support and discussions</li>
            <li style={{ marginBottom: 6 }}>✓ Special announcements</li>
          </ul>
        </div>
        <a href="https://chat.whatsapp.com/HdpwnXzyrLrIqwnpjZqVsb" target="_blank" rel="noopener noreferrer" style={{ textDecoration: 'none' }}>
          <button style={{ background: '#25D366', color: 'white', padding: '12px 30px', border: 'none', borderRadius: 30, cursor: 'pointer', fontSize: 16, fontWeight: 'bold' }}>Join WhatsApp Group</button>
        </a>
      </div>
      <div style={{ textAlign: 'center', padding: '20px', marginTop: 20 }}>
        <p style={{ color: '#999', fontSize: 12 }}>© 2026 ELITE Nursing & Midwifery CBT. All rights reserved.{' '}
  <Link to="/privacy" style={{ color: '#2196f3', fontSize: 11, textDecoration: 'none', marginLeft: 4 }}>
    Privacy Policy
  </Link>
  <span style={{ color: '#999', margin: '0 6px' }}>|</span>
  <Link to="/terms" style={{ color: '#2196f3', fontSize: 11, textDecoration: 'none' }}>
    Terms & Conditions
  </Link></p>
      </div>
    </div>
  );
};

// Get Premium Component – with subscription plans and live countdown timer
const GetPremium = () => {
  const { token, user, darkMode } = useContext(AuthContext);
  const [loading, setLoading] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState('monthly');
  const [timeLeft, setTimeLeft] = useState(null);

  const plans = {
    daily: { label: 'Daily', amount: 500, duration: '24 hours' },
    monthly: { label: 'Monthly', amount: 2000, duration: '30 days' },
    yearly: { label: 'Yearly', amount: 10000, duration: '365 days' }
  };

  // Live countdown timer
  useEffect(() => {
    if (!user?.premiumExpiry) {
      setTimeLeft(null);
      return;
    }

    const updateTimer = () => {
      const now = new Date();
      const expiry = new Date(user.premiumExpiry);
      const diff = expiry - now;

      if (diff <= 0) {
        setTimeLeft(null);
        return;
      }

      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);

      setTimeLeft({ days, hours, minutes, seconds });
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, [user?.premiumExpiry]);

  const handlePayment = async () => {
    if (!user?.id) {
      alert('Please log in again to make payment.');
      return;
    }

    setLoading(true);
    try {
      console.log('User ID for payment:', user.id);

      const isNative = Capacitor.isNativePlatform();
      const redirectUrl = isNative
        ? 'https://elite-nursing-cbt.vercel.app/payment-success.html'
        : 'https://elite-nursing-cbt.vercel.app/payment-return';

      const response = await axios.post('/api/initialize-payment', {
        email: user.email,
        amount: plans[selectedPlan].amount,
        userId: user.id,
        planType: selectedPlan,
        examId: null,
        examTitle: null,
        sectionNumber: null,
        redirect_url: redirectUrl
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      localStorage.setItem('payment_reference', response.data.reference);

      if (isNative) {
        await Browser.open({ url: response.data.authorization_url });
        localStorage.setItem('waiting_for_payment', 'true');
      } else {
        window.location.href = response.data.authorization_url;
      }
    } catch (error) {
      console.error('Payment error:', error);
      alert('Payment initialization failed. Please try again.');
      setLoading(false);
    }
  };

  // Format expiry date
  const formatExpiry = (date) => {
    if (!date) return 'N/A';
    const d = new Date(date);
    return d.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Check if premium is still active
  const isPremiumActive = user?.isPremium && user?.premiumExpiry && new Date(user.premiumExpiry) > new Date();

  return (
    <div style={{ background: darkMode ? '#1a1a2e' : '#f0f7f4', minHeight: '100vh', padding: '20px' }}>
      <div style={{ maxWidth: 900, margin: '0 auto', background: darkMode ? '#16213e' : 'white', borderRadius: 20, padding: 24, textAlign: 'center', boxShadow: '0 4px 15px rgba(0,0,0,0.1)' }}>
        <div style={{ fontSize: 56, marginBottom: 16 }}>⭐</div>
        <h2 style={{ color: '#1e3c72' }}>Upgrade to Premium</h2>
        <p style={{ marginBottom: 20 }}>Get unlimited access to all examinations and features</p>
        
        {isPremiumActive ? (
          <div style={{ background: '#e8f5e9', padding: 20, borderRadius: 16 }}>
            <div style={{ fontSize: 48, marginBottom: 8 }}>✅</div>
            <h3 style={{ color: '#1e3c72' }}>You are already a Premium Member!</h3>
            <div style={{ marginTop: 12, padding: 12, background: '#f5f5f5', borderRadius: 8 }}>
              <p style={{ margin: '4px 0' }}>
                <strong>Plan:</strong> {user.premiumPlan ? user.premiumPlan.toUpperCase() : 'N/A'}
              </p>
              <p style={{ margin: '4px 0' }}>
                <strong>Expires:</strong> {formatExpiry(user.premiumExpiry)}
              </p>
              
              {/* ===== LIVE COUNTDOWN TIMER ===== */}
              {timeLeft && (
                <div style={{ marginTop: 12, padding: 12, background: '#fff3e0', borderRadius: 8 }}>
                  <p style={{ margin: 0, fontSize: 14, fontWeight: 'bold', color: '#e65100' }}>
                    ⏳ Time remaining:
                  </p>
                  <div style={{ display: 'flex', justifyContent: 'center', gap: 12, marginTop: 8 }}>
                    {timeLeft.days > 0 && (
                      <div>
                        <span style={{ fontSize: 24, fontWeight: 'bold', color: '#1e3c72' }}>{timeLeft.days}</span>
                        <span style={{ fontSize: 11, color: '#666', display: 'block' }}>days</span>
                      </div>
                    )}
                    <div>
                      <span style={{ fontSize: 24, fontWeight: 'bold', color: '#1e3c72' }}>{String(timeLeft.hours).padStart(2, '0')}</span>
                      <span style={{ fontSize: 11, color: '#666', display: 'block' }}>hrs</span>
                    </div>
                    <div>
                      <span style={{ fontSize: 24, fontWeight: 'bold', color: '#1e3c72' }}>{String(timeLeft.minutes).padStart(2, '0')}</span>
                      <span style={{ fontSize: 11, color: '#666', display: 'block' }}>min</span>
                    </div>
                    <div>
                      <span style={{ fontSize: 24, fontWeight: 'bold', color: '#1e3c72' }}>{String(timeLeft.seconds).padStart(2, '0')}</span>
                      <span style={{ fontSize: 11, color: '#666', display: 'block' }}>sec</span>
                    </div>
                  </div>
                </div>
              )}
              {!timeLeft && user.premiumExpiry && new Date(user.premiumExpiry) <= new Date() && (
                <p style={{ marginTop: 12, color: '#dc3545', fontWeight: 'bold' }}>
                  ⚠️ Your premium has expired. Please select a plan below to renew.
                </p>
              )}
            </div>
          </div>
        ) : (
          <>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 16, margin: 20 }}>
              {Object.entries(plans).map(([key, plan]) => (
                <div 
                  key={key} 
                  onClick={() => setSelectedPlan(key)}
                  style={{
                    padding: 16,
                    borderRadius: 12,
                    border: selectedPlan === key ? '3px solid #1e3c72' : '2px solid #e0e0e0',
                    background: selectedPlan === key ? '#e8f5e9' : 'white',
                    cursor: 'pointer',
                    transition: '0.2s',
                    boxShadow: selectedPlan === key ? '0 4px 12px rgba(30, 60, 114, 0.15)' : 'none'
                  }}
                >
                  <div style={{ fontSize: 24, fontWeight: 'bold', color: '#1e3c72' }}>₦{plan.amount}</div>
                  <div style={{ fontSize: 16, fontWeight: 'bold', color: '#333' }}>{plan.label}</div>
                  <div style={{ fontSize: 12, color: '#666' }}>{plan.duration}</div>
                  {selectedPlan === key && (
                    <div style={{ marginTop: 8, fontSize: 11, color: '#1e3c72', fontWeight: 'bold' }}>✓ SELECTED</div>
                  )}
                </div>
              ))}
            </div>
            <div style={{ background: darkMode ? '#1a1a2e' : '#f0f7f4', padding: 16, borderRadius: 12, margin: '20px 0' }}>
              <div style={{ fontSize: 18, fontWeight: 'bold', color: '#1e3c72' }}>
                Selected: <span style={{ color: '#ff9800' }}>{plans[selectedPlan].label}</span> – 
                ₦{plans[selectedPlan].amount}
              </div>
            </div>
            <button onClick={handlePayment} disabled={loading} style={{ background: '#ff9800', color: 'white', padding: '12px 32px', border: 'none', borderRadius: 30, cursor: 'pointer', fontSize: 16, fontWeight: 'bold' }}>
              {loading ? 'Processing...' : `Pay ₦${plans[selectedPlan].amount} (${plans[selectedPlan].label})`}
            </button>
          </>
        )}
      </div>
      <div style={{ textAlign: 'center', padding: '20px', marginTop: 20 }}>
        <p style={{ color: '#999', fontSize: 12 }}>© 2026 ELITE Nursing & Midwifery CBT. All rights reserved.{' '}
          <Link to="/privacy" style={{ color: '#2196f3', fontSize: 11, textDecoration: 'none', marginLeft: 4 }}>
            Privacy Policy
          </Link>
          <span style={{ color: '#999', margin: '0 6px' }}>|</span>
          <Link to="/terms" style={{ color: '#2196f3', fontSize: 11, textDecoration: 'none' }}>
            Terms & Conditions
          </Link>
        </p>
      </div>
    </div>
  );
};

// Payment Return Component - Captures transaction_id from URL
const PaymentReturn = () => {
  const { token, user, login } = useContext(AuthContext);
  const [status, setStatus] = useState('verifying');
  const [message, setMessage] = useState('');
  const [retryCount, setRetryCount] = useState(0);
  const [progress, setProgress] = useState(0);
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  // Progress animation
  useEffect(() => {
    if (status === 'verifying') {
      const interval = setInterval(() => {
        setProgress(prev => {
          if (prev >= 95) return 95;
          return prev + 2;
        });
      }, 200);
      return () => clearInterval(interval);
    }
  }, [status]);

  useEffect(() => {
    const verifyPayment = async () => {
      // Get parameters from URL: tx_ref (reference) and transaction_id
      let tx_ref = searchParams.get('reference') || searchParams.get('tx_ref');
      let transaction_id = searchParams.get('transaction_id') || searchParams.get('id');
      const storedRef = localStorage.getItem('payment_reference');
      
      if (!tx_ref && storedRef) {
        tx_ref = storedRef;
      }
      
      console.log(`Payment Return - tx_ref: ${tx_ref}, transaction_id: ${transaction_id}, Retry: ${retryCount}`);
      
      if (!tx_ref && !transaction_id) {
        setStatus('error');
        setMessage('No payment reference found');
        return;
      }
      
      // Get current user from context or localStorage
      let currentUser = user;
      let currentToken = token;
      
      if (!currentUser || !currentToken) {
        const savedAuth = localStorage.getItem('auth');
        if (savedAuth) {
          try {
            const auth = JSON.parse(savedAuth);
            currentUser = auth.user;
            currentToken = auth.token;
          } catch (e) {
            console.error('Error parsing auth:', e);
          }
        }
      }
      
      if (!currentUser?.id) {
        setStatus('error');
        setMessage('Please log in to verify payment');
        setTimeout(() => navigate('/login'), 3000);
        return;
      }
      
      try {
        console.log(`Sending verification request... Attempt ${retryCount + 1}/20`);
        
        const response = await axios.post('/api/verify-payment', {
          reference: tx_ref,
          transactionId: transaction_id,  // Send the numeric ID if available
          userId: currentUser.id
        }, {
          headers: { Authorization: `Bearer ${currentToken}` }
        });
        
        console.log('Verification response:', response.data);
        
        if (response.data.success) {
          setProgress(100);
          setStatus('success');
          setMessage('Payment successful! Your account has been upgraded to PREMIUM!');
          localStorage.removeItem('payment_reference');
          
          // ==== FIX: Fetch full user profile to get premiumExpiry and premiumPlan ====
          try {
            const profileRes = await axios.get('/api/user/profile', {
              headers: { Authorization: `Bearer ${currentToken}` }
            });
            const fullUser = profileRes.data;
            // Update localStorage and context with full user data
            localStorage.setItem('auth', JSON.stringify({ token: currentToken, user: fullUser }));
            if (login && currentToken) {
              login(currentToken, fullUser);
            }
          } catch (profileError) {
            // Fallback: use only isPremium true
            const updatedUser = { ...currentUser, isPremium: true };
            localStorage.setItem('auth', JSON.stringify({ token: currentToken, user: updatedUser }));
            if (login && currentToken) {
              login(currentToken, updatedUser);
            }
          }
          // ===============================================================
          
          setTimeout(() => navigate('/get-premium'), 3000);
        } else if (response.data.pending) {
          if (retryCount < 20) {
            const delay = Math.min(4000 * Math.pow(1.2, retryCount), 15000);
            console.log(`Payment pending, retrying in ${delay/1000} seconds... (${retryCount + 1}/20)`);
            setTimeout(() => setRetryCount(prev => prev + 1), delay);
          } else {
            setStatus('pending');
            setMessage(response.data.message || 'Payment is still processing. Please check back later.');
          }
        } else {
          setStatus('failed');
          setMessage(response.data.error || 'Payment verification failed. Please contact support.');
        }
      } catch (error) {
        console.error('Verification error:', error);
        if (retryCount < 20) {
          const delay = Math.min(4000 * Math.pow(1.2, retryCount), 15000);
          setTimeout(() => setRetryCount(prev => prev + 1), delay);
        } else {
          setStatus('failed');
          setMessage('Payment verification failed after multiple attempts. Please contact support on WhatsApp: 09063908476');
        }
      }
    };
    
    verifyPayment();
  }, [searchParams, user, token, navigate, login, retryCount]);

  const checkPaymentManually = async () => {
    let tx_ref = searchParams.get('reference') || searchParams.get('tx_ref');
    let transaction_id = searchParams.get('transaction_id') || searchParams.get('id');
    const storedRef = localStorage.getItem('payment_reference');
    if (!tx_ref && storedRef) tx_ref = storedRef;
    
    if (!tx_ref && !transaction_id) {
      alert('No payment reference found');
      return;
    }
    
    let currentUser = user;
    let currentToken = token;
    if (!currentUser || !currentToken) {
      const savedAuth = localStorage.getItem('auth');
      if (savedAuth) {
        try {
          const auth = JSON.parse(savedAuth);
          currentUser = auth.user;
          currentToken = auth.token;
        } catch (e) {}
      }
    }
    
    if (!currentUser?.id) {
      alert('Please log in first');
      navigate('/login');
      return;
    }
    
    setStatus('verifying');
    setRetryCount(0);
    setProgress(0);
    // Force re-run effect by resetting state
    setTimeout(() => {
      // The useEffect will run again because retryCount changed
    }, 100);
  };

  const SimpleLoader = () => (
    <div style={{ marginTop: 20 }}>
      <div style={{ width: '100%', height: 10, background: '#e0e0e0', borderRadius: 5, overflow: 'hidden' }}>
        <div style={{ 
          width: `${Math.min(progress, 100)}%`, 
          height: '100%', 
          background: 'linear-gradient(90deg, #1e3c72, #2a5298)', 
          borderRadius: 5,
          transition: 'width 0.5s ease'
        }} />
      </div>
      <p style={{ fontSize: 13, color: '#666', marginTop: 12 }}>Attempt {retryCount + 1}/20 - Please wait...</p>
    </div>
  );

  return (
    <div style={{ minHeight: '100vh', background: '#f0f7f4', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
      <div style={{ background: 'white', borderRadius: 20, padding: 40, textAlign: 'center', maxWidth: 450, boxShadow: '0 4px 15px rgba(0,0,0,0.1)' }}>
        {status === 'verifying' && (
          <>
            <div style={{ fontSize: 52, marginBottom: 20 }}>⏳</div>
            <h2 style={{ color: '#1e3c72' }}>Verifying Payment...</h2>
            <p style={{ color: '#666', marginTop: 8 }}>Please wait while we confirm your Flutterwave payment.</p>
            <p style={{ fontSize: 13, color: '#ff9800', marginTop: 8 }}>This may take up to 30 seconds.</p>
            <SimpleLoader />
          </>
        )}
        {status === 'success' && (
          <>
            <div style={{ fontSize: 52, marginBottom: 20 }}>✅</div>
            <h2 style={{ color: '#2e7d32' }}>Payment Successful!</h2>
            <p style={{ fontSize: 16, margin: '15px 0' }}>{message}</p>
            <p>Redirecting you to the premium page...</p>
          </>
        )}
        {status === 'pending' && (
          <>
            <div style={{ fontSize: 52, marginBottom: 20 }}>⏰</div>
            <h2 style={{ color: '#ff9800' }}>Payment Processing</h2>
            <p style={{ margin: '15px 0' }}>{message}</p>
            <button onClick={checkPaymentManually} style={{ background: '#1e3c72', color: 'white', padding: '12px 28px', border: 'none', borderRadius: 30, cursor: 'pointer', fontWeight: 'bold', marginTop: 15 }}>
              Check Status Now
            </button>
            <Link to="/">
              <button style={{ background: '#6c757d', color: 'white', padding: '12px 28px', border: 'none', borderRadius: 30, cursor: 'pointer', marginTop: 10 }}>
                Go to Home
              </button>
            </Link>
          </>
        )}
        {status === 'failed' && (
          <>
            <div style={{ fontSize: 52, marginBottom: 20 }}>❌</div>
            <h2 style={{ color: '#dc3545' }}>Verification Failed</h2>
            <p style={{ margin: '15px 0' }}>{message}</p>
            <button onClick={checkPaymentManually} style={{ background: '#1e3c72', color: 'white', padding: '12px 28px', border: 'none', borderRadius: 30, cursor: 'pointer', fontWeight: 'bold', marginTop: 15 }}>
              Try Again
            </button>
            <Link to="/get-premium">
              <button style={{ background: '#ff9800', color: 'white', padding: '12px 28px', border: 'none', borderRadius: 30, cursor: 'pointer', marginTop: 10 }}>
                Go to Get Premium
              </button>
            </Link>
            <div style={{ marginTop: 20, padding: 12, background: '#fff3e0', borderRadius: 12 }}>
              <p style={{ fontSize: 12, color: '#666' }}>Contact support on WhatsApp: <strong style={{ color: '#25D366' }}>09063908476</strong></p>
            </div>
          </>
        )}
        {status === 'error' && (
          <>
            <div style={{ fontSize: 52, marginBottom: 20 }}>⚠️</div>
            <h2 style={{ color: '#ff9800' }}>Please Log In</h2>
            <p>{message}</p>
            <Link to="/login">
              <button style={{ background: '#1e3c72', color: 'white', padding: '12px 28px', border: 'none', borderRadius: 30, cursor: 'pointer', marginTop: 20 }}>Go to Login</button>
            </Link>
          </>
        )}
      </div>
    </div>
  );
};

// Admin Panel Component – with plan selector for each user
const AdminPanel = () => {
  const [users, setUsers] = useState([]);
  const [contacts, setContacts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('users');
  const [replyingTo, setReplyingTo] = useState(null);
  const [replyMessage, setReplyMessage] = useState('');
  const [sendingReply, setSendingReply] = useState(false);
  const { token, user, darkMode, logout } = useContext(AuthContext);
  const [notificationTitle, setNotificationTitle] = useState('');
  const [notificationMessage, setNotificationMessage] = useState('');
  const [sendingNotification, setSendingNotification] = useState(false);
  const [notificationStatus, setNotificationStatus] = useState('');

  // Manual OTP states
  const [manualOtpEmail, setManualOtpEmail] = useState('');
  const [manualOtpResult, setManualOtpResult] = useState('');
  const [generatingOtp, setGeneratingOtp] = useState(false);

  // Manual Reset states
  const [resetEmail, setResetEmail] = useState('');
  const [resetOtpResult, setResetOtpResult] = useState('');
  const [generatingResetOtp, setGeneratingResetOtp] = useState(false);

  // ---------- NEW: Selected plan per user ----------
  const [selectedPlan, setSelectedPlan] = useState({}); // { userId: 'daily'|'monthly'|'yearly'|'none' }
  // ------------------------------------------------

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [usersRes, contactsRes] = await Promise.all([
          axios.get('/api/admin/users', { headers: { Authorization: `Bearer ${token}` } }),
          axios.get('/api/admin/contacts', { headers: { Authorization: `Bearer ${token}` } })
        ]);
        setUsers(usersRes.data);
        setContacts(contactsRes.data);
        // Initialize selectedPlan from existing user data
        const initial = {};
        usersRes.data.forEach(u => {
          initial[u._id] = u.isPremium ? (u.premiumPlan || 'monthly') : 'none';
        });
        setSelectedPlan(initial);
      } catch (error) {
        if (error.response?.status === 403 || error.response?.status === 401) {
          alert('Admin access only. You will be redirected.');
          logout();
          window.location.href = '/login';
        } else {
          console.error('Error fetching admin data:', error);
        }
      } finally {
        setLoading(false);
      }
    };
    
    if (user?.email === 'elitenursingcbt@gmail.com') {
      fetchData();
    } else if (user) {
      alert('Admin access only');
      window.location.href = '/';
    }
  }, [token, user, logout]);

  // ---------- NEW: Apply plan for a user ----------
  const applyPlan = async (userId) => {
    const plan = selectedPlan[userId];
    if (!plan) return alert('Please select a plan first.');
    try {
      const response = await axios.post('/api/admin/set-premium-plan',
        { userId, planType: plan },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (response.data.success) {
        // Update the user in the local list
        const updatedUser = response.data.user || { ...users.find(u => u._id === userId), isPremium: plan !== 'none', premiumPlan: plan !== 'none' ? plan : null };
        setUsers(users.map(u => u._id === userId ? updatedUser : u));
        alert(response.data.message);
      }
    } catch (error) {
      alert('Failed to apply plan: ' + (error.response?.data?.error || error.message));
    }
  };
  // ------------------------------------------------

  // ---------- Existing functions (unchanged) ----------
  const deleteUser = async (userId) => {
    if (window.confirm('Are you sure you want to delete this user? This action cannot be undone.')) {
      try {
        await axios.delete(`/api/admin/users/${userId}`, { headers: { Authorization: `Bearer ${token}` } });
        setUsers(users.filter(u => u._id !== userId));
        alert('User deleted successfully');
      } catch (error) {
        alert('Failed to delete user');
      }
    }
  };

  const sendReply = async (contactEmail, contactName, originalMessage) => {
    if (!replyMessage.trim()) {
      alert('Please enter a reply message');
      return;
    }
    setSendingReply(true);
    try {
      await axios.post('/api/admin/reply-message', {
        to: contactEmail,
        name: contactName,
        originalMessage: originalMessage,
        reply: replyMessage
      }, { headers: { Authorization: `Bearer ${token}` } });
      alert('Reply sent successfully!');
      setReplyingTo(null);
      setReplyMessage('');
    } catch (error) {
      alert('Failed to send reply: ' + (error.response?.data?.error || 'Unknown error'));
    } finally {
      setSendingReply(false);
    }
  };

  const sendNotification = async () => {
    if (!notificationTitle || !notificationMessage) {
      alert('Please enter both a title and a message.');
      return;
    }
    setSendingNotification(true);
    setNotificationStatus('');
    try {
      const response = await axios.post('/api/admin/send-notification', {
        title: notificationTitle,
        message: notificationMessage
      }, { headers: { Authorization: `Bearer ${token}` } });
      if (response.data.success) {
        setNotificationStatus(`✅ Sent successfully to ${response.data.successCount} devices.`);
        setNotificationTitle('');
        setNotificationMessage('');
      } else {
        setNotificationStatus('❌ Failed to send notifications.');
      }
    } catch (error) {
      console.error('Error sending notification:', error);
      setNotificationStatus('❌ An error occurred.');
    } finally {
      setSendingNotification(false);
    }
  };

  // ---------- Manual OTP function (email verification) ----------
  const generateManualOtp = async () => {
    if (!manualOtpEmail.trim()) {
      alert('Please enter an email address');
      return;
    }
    setGeneratingOtp(true);
    setManualOtpResult('');
    try {
      const response = await axios.post('/api/admin/generate-verification-code', 
        { email: manualOtpEmail },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (response.data.otp) {
        setManualOtpResult(`✅ Verification code for ${manualOtpEmail}: ${response.data.otp} (valid 10 minutes)`);
      } else {
        setManualOtpResult('❌ Failed to generate code');
      }
    } catch (error) {
      console.error('Generate OTP error:', error);
      setManualOtpResult(`❌ Error: ${error.response?.data?.error || error.message}`);
    } finally {
      setGeneratingOtp(false);
    }
  };

  // ---------- Manual Reset function (password reset) ----------
  const generateManualResetOtp = async () => {
    if (!resetEmail.trim()) {
      alert('Please enter an email address');
      return;
    }
    setGeneratingResetOtp(true);
    setResetOtpResult('');
    try {
      const response = await axios.post('/api/admin/generate-reset-code', 
        { email: resetEmail },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (response.data.otp) {
        setResetOtpResult(`✅ Reset code for ${resetEmail}: ${response.data.otp} (valid 10 minutes)`);
      } else {
        setResetOtpResult('❌ Failed to generate code');
      }
    } catch (error) {
      console.error('Generate reset OTP error:', error);
      setResetOtpResult(`❌ Error: ${error.response?.data?.error || error.message}`);
    } finally {
      setGeneratingResetOtp(false);
    }
  };

  if (loading) return <LoadingWithBar message="Loading admin panel" />;
  if (user?.email !== 'elitenursingcbt@gmail.com') return <Navigate to="/" />;

  return (
    <div style={{ background: darkMode ? '#1a1a2e' : '#f0f7f4', minHeight: '100vh', padding: '20px' }}>
      <div style={{ maxWidth: 1200, margin: '0 auto' }}>
        <div style={{ background: darkMode ? '#16213e' : 'white', borderRadius: 20, padding: 24, boxShadow: '0 4px 15px rgba(0,0,0,0.1)' }}>
          <h1 style={{ color: '#1e3c72', textAlign: 'center', marginBottom: 20, fontSize: 28 }}>Admin Panel</h1>
          
          <div style={{ display: 'flex', gap: 12, marginBottom: 24, borderBottom: '2px solid #e0e0e0', paddingBottom: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
            <button onClick={() => setActiveTab('users')} style={{ background: activeTab === 'users' ? '#1e3c72' : 'transparent', color: activeTab === 'users' ? 'white' : '#1e3c72', padding: '10px 24px', border: activeTab === 'users' ? 'none' : '1px solid #1e3c72', borderRadius: 8, cursor: 'pointer', fontWeight: 'bold' }}>Users ({users.length})</button>
            <button onClick={() => setActiveTab('contacts')} style={{ background: activeTab === 'contacts' ? '#1e3c72' : 'transparent', color: activeTab === 'contacts' ? 'white' : '#1e3c72', padding: '10px 24px', border: activeTab === 'contacts' ? 'none' : '1px solid #1e3c72', borderRadius: 8, cursor: 'pointer', fontWeight: 'bold' }}>Contact Messages ({contacts.length})</button>
            <button onClick={() => setActiveTab('notifications')} style={{ background: activeTab === 'notifications' ? '#ff9800' : 'transparent', color: activeTab === 'notifications' ? 'white' : '#ff9800', padding: '10px 24px', border: activeTab === 'notifications' ? 'none' : '1px solid #ff9800', borderRadius: 8, cursor: 'pointer', fontWeight: 'bold' }}>Send Notification</button>
            <button onClick={() => setActiveTab('manualOtp')} style={{ background: activeTab === 'manualOtp' ? '#6c757d' : 'transparent', color: activeTab === 'manualOtp' ? 'white' : '#6c757d', padding: '10px 24px', border: activeTab === 'manualOtp' ? 'none' : '1px solid #6c757d', borderRadius: 8, cursor: 'pointer', fontWeight: 'bold' }}>Manual OTP</button>
            <button onClick={() => setActiveTab('manualReset')} style={{ background: activeTab === 'manualReset' ? '#6c757d' : 'transparent', color: activeTab === 'manualReset' ? 'white' : '#6c757d', padding: '10px 24px', border: activeTab === 'manualReset' ? 'none' : '1px solid #6c757d', borderRadius: 8, cursor: 'pointer', fontWeight: 'bold' }}>Manual Reset</button>
          </div>

          {activeTab === 'users' && (
            <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: 20 }}>
              {users.map(u => {
                // Determine current plan from user data
                const currentPlan = u.isPremium ? (u.premiumPlan || 'monthly') : 'none';
                return (
                  <div key={u._id} style={{ width: '350px', background: darkMode ? '#1a1a2e' : '#f8f9fa', padding: 20, borderRadius: 12, border: '1px solid #e0e0e0' }}>
                    <p><strong>Name:</strong> {u.name || 'N/A'}</p>
                    <p><strong>Email:</strong> {u.email}</p>
                    <p><strong>Premium:</strong> {u.isPremium ? '✅ Yes' : '❌ No'}</p>
                    {u.isPremium && <p><strong>Plan:</strong> {u.premiumPlan ? u.premiumPlan.toUpperCase() : 'N/A'}</p>}
                    {u.isPremium && u.premiumExpiry && <p><strong>Expires:</strong> {new Date(u.premiumExpiry).toLocaleDateString()}</p>}
                    <p><strong>Verified:</strong> {u.isVerified ? '✅ Yes' : '❌ No'}</p>
                    <p><strong>Joined:</strong> {new Date(u.createdAt).toLocaleDateString()}</p>
                    
                    {/* ===== NEW: Plan Selector ===== */}
                    <div style={{ marginTop: 15 }}>
                      <label style={{ fontSize: 13, fontWeight: 'bold', display: 'block', marginBottom: 4 }}>Set Premium Plan:</label>
                      <select 
                        value={selectedPlan[u._id] || currentPlan}
                        onChange={(e) => setSelectedPlan(prev => ({ ...prev, [u._id]: e.target.value }))}
                        style={{ width: '100%', padding: '8px', borderRadius: 6, border: '1px solid #ccc', background: 'white', fontSize: 14 }}
                      >
                        <option value="none">None (Remove Premium)</option>
                        <option value="daily">Daily (₦500)</option>
                        <option value="monthly">Monthly (₦2000)</option>
                        <option value="yearly">Yearly (₦10000)</option>
                      </select>
                      <button 
                        onClick={() => applyPlan(u._id)}
                        style={{ width: '100%', marginTop: 6, background: '#1e3c72', color: 'white', border: 'none', padding: '8px', borderRadius: 6, cursor: 'pointer', fontWeight: 'bold', fontSize: 13 }}
                      >
                        Apply Plan
                      </button>
                    </div>
                    {/* ================================= */}

                    <div style={{ display: 'flex', gap: 10, marginTop: 10 }}>
                      <button onClick={() => deleteUser(u._id)} style={{ background: '#dc3545', color: 'white', padding: '8px 16px', border: 'none', borderRadius: 6, cursor: 'pointer', fontSize: 13, fontWeight: 'bold' }}>Delete User</button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {activeTab === 'contacts' && (
            <div style={{ maxHeight: '500px', overflowY: 'auto' }}>
              {contacts.map(c => (
                <div key={c._id} style={{ background: darkMode ? '#1a1a2e' : '#f8f9fa', padding: 20, borderRadius: 12, marginBottom: 16, border: '1px solid #e0e0e0' }}>
                  <p><strong>From:</strong> {c.name} ({c.email})</p>
                  <p><strong>Message:</strong> {c.message}</p>
                  <p><strong>Received:</strong> {new Date(c.createdAt).toLocaleString()}</p>
                  {replyingTo === c._id ? (
                    <div style={{ marginTop: 16 }}>
                      <textarea
                        placeholder="Type your reply here..."
                        value={replyMessage}
                        onChange={(e) => setReplyMessage(e.target.value)}
                        rows="4"
                        style={{ width: '100%', padding: '12px', border: '1px solid #ddd', borderRadius: 10, fontSize: 14, marginBottom: 12, boxSizing: 'border-box' }}
                      />
                      <div style={{ display: 'flex', gap: 12 }}>
                        <button onClick={() => sendReply(c.email, c.name, c.message)} disabled={sendingReply} style={{ background: '#28a745', color: 'white', padding: '10px 20px', border: 'none', borderRadius: 8, cursor: 'pointer', fontSize: 14, fontWeight: 'bold' }}>
                          {sendingReply ? 'Sending...' : 'Send Reply'}
                        </button>
                        <button onClick={() => { setReplyingTo(null); setReplyMessage(''); }} style={{ background: '#6c757d', color: 'white', padding: '10px 20px', border: 'none', borderRadius: 8, cursor: 'pointer', fontSize: 14, fontWeight: 'bold' }}>Cancel</button>
                      </div>
                    </div>
                  ) : (
                    <button onClick={() => setReplyingTo(c._id)} style={{ marginTop: 12, background: '#1e3c72', color: 'white', padding: '8px 16px', border: 'none', borderRadius: 6, cursor: 'pointer', fontSize: 13, fontWeight: 'bold' }}>📧 Reply to Message</button>
                  )}
                </div>
              ))}
            </div>
          )}

          {activeTab === 'notifications' && (
            <div style={{ padding: 20 }}>
              <h3 style={{ color: '#1e3c72', marginBottom: 20 }}>Send Push Notification to All Users</h3>
              <div style={{ marginBottom: 16 }}>
                <input
                  type="text"
                  placeholder="Notification Title"
                  value={notificationTitle}
                  onChange={(e) => setNotificationTitle(e.target.value)}
                  style={{ width: '100%', padding: 12, border: '1px solid #ccc', borderRadius: 8, fontSize: 14 }}
                />
              </div>
              <div style={{ marginBottom: 16 }}>
                <textarea
                  placeholder="Notification Message"
                  value={notificationMessage}
                  onChange={(e) => setNotificationMessage(e.target.value)}
                  rows="4"
                  style={{ width: '100%', padding: 12, border: '1px solid #ccc', borderRadius: 8, fontSize: 14, resize: 'vertical' }}
                />
              </div>
              <button
                onClick={sendNotification}
                disabled={sendingNotification}
                style={{ background: '#ff9800', color: 'white', padding: '12px 24px', border: 'none', borderRadius: 8, cursor: 'pointer', fontWeight: 'bold' }}
              >
                {sendingNotification ? 'Sending...' : 'Send Notification'}
              </button>
              {notificationStatus && <p style={{ marginTop: 16, color: '#2e7d32' }}>{notificationStatus}</p>}
            </div>
          )}

          {activeTab === 'manualOtp' && (
            <div style={{ padding: 20 }}>
              <h3 style={{ color: '#1e3c72', marginBottom: 20 }}>Generate Manual Verification Code</h3>
              <p style={{ marginBottom: 16, color: '#666' }}>Use this only when a user cannot receive email. The code will be shown here and can be given to the user.</p>
              <div style={{ marginBottom: 16 }}>
                <input
                  type="email"
                  placeholder="User's email address"
                  value={manualOtpEmail}
                  onChange={(e) => setManualOtpEmail(e.target.value)}
                  style={{ width: '100%', padding: 12, border: '1px solid #ccc', borderRadius: 8, fontSize: 14 }}
                />
              </div>
              <button
                onClick={generateManualOtp}
                disabled={generatingOtp}
                style={{ background: '#6c757d', color: 'white', padding: '10px 20px', border: 'none', borderRadius: 8, cursor: 'pointer', fontWeight: 'bold' }}
              >
                {generatingOtp ? 'Generating...' : 'Generate Code'}
              </button>
              {manualOtpResult && (
                <div style={{ marginTop: 16, padding: 12, background: '#e8f5e9', borderRadius: 8, borderLeft: '4px solid #2e7d32' }}>
                  <p style={{ margin: 0, color: '#2e7d32' }}>{manualOtpResult}</p>
                </div>
              )}
            </div>
          )}

          {activeTab === 'manualReset' && (
            <div style={{ padding: 20 }}>
              <h3 style={{ color: '#1e3c72', marginBottom: 20 }}>Generate Password Reset Code</h3>
              <p style={{ marginBottom: 16, color: '#666' }}>Use this when a user cannot receive password reset email. The code will be shown here and can be given to the user.</p>
              <div style={{ marginBottom: 16 }}>
                <input
                  type="email"
                  placeholder="User's email address"
                  value={resetEmail}
                  onChange={(e) => setResetEmail(e.target.value)}
                  style={{ width: '100%', padding: 12, border: '1px solid #ccc', borderRadius: 8, fontSize: 14 }}
                />
              </div>
              <button
                onClick={generateManualResetOtp}
                disabled={generatingResetOtp}
                style={{ background: '#6c757d', color: 'white', padding: '10px 20px', border: 'none', borderRadius: 8, cursor: 'pointer', fontWeight: 'bold' }}
              >
                {generatingResetOtp ? 'Generating...' : 'Generate Reset Code'}
              </button>
              {resetOtpResult && (
                <div style={{ marginTop: 16, padding: 12, background: '#e8f5e9', borderRadius: 8, borderLeft: '4px solid #2e7d32' }}>
                  <p style={{ margin: 0, color: '#2e7d32' }}>{resetOtpResult}</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
      <div style={{ textAlign: 'center', padding: '20px', marginTop: 20 }}>
        <p style={{ color: '#999', fontSize: 12 }}>© 2026 ELITE Nursing & Midwifery CBT. All rights reserved.{' '}
          <Link to="/privacy" style={{ color: '#2196f3', fontSize: 11, textDecoration: 'none', marginLeft: 4 }}>Privacy Policy</Link>
          <span style={{ color: '#999', margin: '0 6px' }}>|</span>
          <Link to="/terms" style={{ color: '#2196f3', fontSize: 11, textDecoration: 'none' }}>Terms & Conditions</Link>
        </p>
      </div>
    </div>
  );
};

// Dropdown Menu Component
const DropdownMenu = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const { user, logout, darkMode, toggleDarkMode } = useContext(AuthContext);

  const handleLogoutClick = () => {
    setIsOpen(false);
    setShowLogoutConfirm(true);
  };

  const confirmLogout = async () => {
    try {
      const token = localStorage.getItem('auth') ? JSON.parse(localStorage.getItem('auth')).token : null;
      if (token) {
        await axios.post('/api/logout', {}, { headers: { Authorization: `Bearer ${token}` } });
      }
    } catch (error) {
      console.error('Logout error:', error);
    }
    setShowLogoutConfirm(false);
    logout();
  };

  const cancelLogout = () => {
    setShowLogoutConfirm(false);
  };

  const isAdmin = user?.email === 'elitenursingcbt@gmail.com';

  return (
    <div style={{ position: 'relative', display: 'inline-block' }}>
      {showLogoutConfirm && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0,0,0,0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}>
          <div style={{
            background: 'white',
            borderRadius: 16,
            padding: 24,
            maxWidth: 320,
            width: '90%',
            textAlign: 'center',
            boxShadow: '0 20px 40px rgba(0,0,0,0.2)'
          }}>
            <div style={{ fontSize: 52, marginBottom: 16 }}>🚪</div>
            <h3 style={{ color: '#1e3c72', marginBottom: 8, fontSize: 20 }}>Confirm Logout</h3>
            <p style={{ color: '#666', fontSize: 14, marginBottom: 24 }}>Are you sure you want to logout?</p>
            <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
              <button onClick={cancelLogout} style={{ padding: '10px 24px', background: '#6c757d', color: 'white', border: 'none', borderRadius: 8, cursor: 'pointer', fontWeight: 'bold', fontSize: 14 }}>Cancel</button>
              <button onClick={confirmLogout} style={{ padding: '10px 24px', background: '#dc3545', color: 'white', border: 'none', borderRadius: 8, cursor: 'pointer', fontWeight: 'bold', fontSize: 14 }}>Logout</button>
            </div>
          </div>
        </div>
      )}
      <button onClick={() => setIsOpen(!isOpen)} style={{ background: '#1e3c72', color: 'white', border: 'none', borderRadius: 8, padding: '10px 16px', fontSize: 14, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8 }}>
        <span>☰</span> Menu
      </button>
      {isOpen && (
        <>
          <div onClick={() => setIsOpen(false)} style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 198 }} />
          <div style={{ position: 'absolute', top: '48px', right: 0, width: 240, background: darkMode ? '#16213e' : 'white', borderRadius: 12, boxShadow: '0 4px 12px rgba(0,0,0,0.15)', zIndex: 199, overflow: 'hidden' }}>
            <div style={{ padding: '12px 16px', background: '#1e3c72', color: 'white', textAlign: 'center' }}>
              <div style={{ fontSize: 14, fontWeight: 'bold' }}>{user?.name || user?.email?.split('@')[0]}</div>
              {user?.isPremium && <div style={{ background: '#ff9800', display: 'inline-block', padding: '2px 10px', borderRadius: 20, fontSize: 11, marginTop: 4 }}>⭐ PREMIUM</div>}
            </div>
            <div style={{ padding: '8px 0' }}>
              <Link to="/" onClick={() => setIsOpen(false)} style={{ display: 'block', padding: '10px 20px', textDecoration: 'none', color: darkMode ? '#eee' : '#333', fontSize: 13, borderBottom: '1px solid #eee' }}>🏠 Home</Link>
              <Link to="/how-to-use" onClick={() => setIsOpen(false)} style={{ display: 'block', padding: '10px 20px', textDecoration: 'none', color: '#1e3c72', fontWeight: 'bold', fontSize: 13, borderBottom: '1px solid #eee', background: '#e8f5e9' }}>📖 How To Use</Link>
              <Link to="/get-premium" onClick={() => setIsOpen(false)} style={{ display: 'block', padding: '10px 20px', textDecoration: 'none', color: '#e65100', fontWeight: 'bold', fontSize: 13, borderBottom: '1px solid #eee', background: '#fff3e0' }}>⭐ Get Premium</Link>
              <Link to="/about" onClick={() => setIsOpen(false)} style={{ display: 'block', padding: '10px 20px', textDecoration: 'none', color: darkMode ? '#eee' : '#333', fontSize: 13, borderBottom: '1px solid #eee' }}>ℹ️ About Us</Link>
              <Link to="/contact" onClick={() => setIsOpen(false)} style={{ display: 'block', padding: '10px 20px', textDecoration: 'none', color: darkMode ? '#eee' : '#333', fontSize: 13, borderBottom: '1px solid #eee' }}>📞 Contact Us</Link>
              <Link to="/whatsapp" onClick={() => setIsOpen(false)} style={{ display: 'block', padding: '10px 20px', textDecoration: 'none', color: '#25D366', fontWeight: 'bold', fontSize: 13, borderBottom: '1px solid #eee' }}>💬 Join WhatsApp</Link>
              <Link to="/history" onClick={() => setIsOpen(false)} style={{ display: 'block', padding: '10px 20px', textDecoration: 'none', color: darkMode ? '#eee' : '#333', fontSize: 13, borderBottom: '1px solid #eee' }}>📜 My History</Link>
              {isAdmin && <Link to="/admin" onClick={() => setIsOpen(false)} style={{ display: 'block', padding: '10px 20px', textDecoration: 'none', color: '#dc3545', fontWeight: 'bold', fontSize: 13, borderBottom: '1px solid #eee', background: '#ffebee' }}>👑 Admin Panel</Link>}
              <div onClick={() => { toggleDarkMode(); setIsOpen(false); }} style={{ display: 'block', padding: '10px 20px', cursor: 'pointer', borderBottom: '1px solid #eee', color: darkMode ? '#eee' : '#333', fontSize: 13 }}>
                {darkMode ? '☀️ Light Mode' : '🌙 Dark Mode'}
              </div>
              <button onClick={handleLogoutClick} style={{ width: '100%', padding: '10px 20px', background: 'none', border: 'none', cursor: 'pointer', color: '#dc3545', fontWeight: 'bold', textAlign: 'left', fontSize: 13 }}>🚪 Logout</button>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

// Main App Component
const AppContent = () => {
  const { token, darkMode } = useContext(AuthContext);

  useEffect(() => {
    const verifySession = async () => {
      if (token) {
        try {
          await axios.get('/api/verify-session', { headers: { Authorization: `Bearer ${token}` } });
        } catch (error) {
          if (error.response?.data?.error === 'Session expired. You have been logged out from another device.') {
            alert('You have been logged out because you logged in on another device.');
            localStorage.removeItem('auth');
            window.location.href = '/login';
          }
        }
      }
    };
    verifySession();
  }, [token]);

  if (!token) {
    return (
      <>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/payment-return" element={<PaymentReturn />} />
          <Route path="/privacy" element={<PrivacyPolicy />} />
          <Route path="/terms" element={<TermsAndConditions />} />
          <Route path="*" element={<Navigate to="/login" />} />
        </Routes>
        <FloatingChatButton />
      </>
    );
  }

  return (
    <div style={{ background: darkMode ? '#1a1a2e' : '#f0f7f4', minHeight: '100vh' }}>
      <nav style={{ background: darkMode ? '#16213e' : 'white', padding: '12px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', boxShadow: '0 1px 4px rgba(0,0,0,0.1)', position: 'sticky', top: 0, zIndex: 100 }}>
        <div>
          <h1 style={{ color: '#1e3c72', fontSize: 'clamp(16px, 4vw, 20px)', margin: 0 }}>ELITE NURSING & MIDWIFERY CBT</h1>
          <p style={{ margin: 0, fontSize: '10px', color: '#1e3c72' }}>Computer Based Testing Platform</p>
        </div>
        <DropdownMenu />
      </nav>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/courses/:categoryName/:mode" element={<CourseList />} />
        <Route path="/exams/:id/:mode" element={<ExamList />} />
        <Route path="/take/:id/:sectionNumber/:mode" element={<TakeExam />} />
        <Route path="/how-to-use" element={<HowToUse />} />
        <Route path="/get-premium" element={<GetPremium />} />
        <Route path="/about" element={<AboutUs />} />
        <Route path="/contact" element={<ContactUs />} />
        <Route path="/whatsapp" element={<JoinWhatsApp />} />
        <Route path="/admin" element={<AdminPanel />} />
        <Route path="/payment-return" element={<PaymentReturn />} />
        <Route path="/history" element={<MyHistory />} />
        <Route path="/review/:id" element={<ReviewExam />} />
        <Route path="/privacy" element={<PrivacyPolicy />} />
        <Route path="/terms" element={<TermsAndConditions />} />
        <Route path="/premium-exam/:categoryName/:topic/:examId/:mode" element={<PremiumExam />} />
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
      <FloatingChatButton />
    </div>
  );
};

function App() {
  const [auth, setAuth] = useState(() => {
    const saved = localStorage.getItem('auth');
    return saved ? JSON.parse(saved) : { token: null, user: null };
  });
  const [darkMode, setDarkMode] = useState(() => {
    const saved = localStorage.getItem('darkMode');
    return saved === 'true';
  });

  const login = (token, user) => {
    setAuth({ token, user });
    localStorage.setItem('auth', JSON.stringify({ token, user }));
    axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
  };

  const logout = () => {
    setAuth({ token: null, user: null });
    localStorage.removeItem('auth');
    delete axios.defaults.headers.common['Authorization'];
  };

  // ========== ADD THIS NEW useEffect ==========
  useEffect(() => {
  const interceptor = axios.interceptors.response.use(
    response => response,
    error => {
      if (error.response?.status === 401) {
        // Skip handling for login endpoint – let Login component manage it
        if (error.config.url === '/api/login') {
          return Promise.reject(error);
        }
        const message = error.response?.data?.error || 'Session expired. Please log in again.';
        alert(`⚠️ ${message}`);
        logout();
        window.location.href = '/login';
      }
      return Promise.reject(error);
    }
  );
  return () => axios.interceptors.response.eject(interceptor);
}, [logout]);
  // ===========================================

  const toggleDarkMode = () => {
    setDarkMode(!darkMode);
    localStorage.setItem('darkMode', !darkMode);
  };

    // ---------- Notification state ----------
  const [notificationModal, setNotificationModal] = useState(null);

// ---------- Device token registration ----------
const registerDeviceToken = async (token) => {
  if (!token || !auth.user?.id) return;
  try {
    const response = await axios.post('/api/register-token', { token, userId: auth.user.id });
    console.log('Token registered', response.data);
  } catch (error) {
    console.error('Token registration error:', error);
  }
};

// ========== PUSH NOTIFICATION FUNCTIONS ==========
const initializeNotifications = () => {
  (async () => {
    try {
      const firebaseConfig = {
        apiKey: "AIzaSyCo4DSsdcfEYFeg7XQrnCwMi3a7vIkdDYM",
        authDomain: "elite-nursing-cbt.firebaseapp.com",
        projectId: "elite-nursing-cbt",
        storageBucket: "elite-nursing-cbt.firebasestorage.app",
        messagingSenderId: "18123266651",
        appId: "1:18123266651:web:7632db14d93727bec47d7e"
      };
      if (!window.firebaseInitialized && !Capacitor.isNativePlatform()) {
        initializeApp(firebaseConfig);
        window.firebaseInitialized = true;
      }

      if (Capacitor.isNativePlatform()) {
        const permStatus = await FirebaseMessaging.requestPermissions();
        if (permStatus.receive === 'granted') {
          const tokenResult = await FirebaseMessaging.getToken();
          let tokenValue = null;
          if (typeof tokenResult === 'string') {
            tokenValue = tokenResult;
          } else if (tokenResult && typeof tokenResult === 'object' && tokenResult.token) {
            tokenValue = tokenResult.token;
          }
          if (tokenValue) {
            await registerDeviceToken(tokenValue);
          }
        }
      } else {
        const messaging = getMessaging();
        const permission = await Notification.requestPermission();
        if (permission === 'granted') {
          const token = await getToken(messaging, {
            vapidKey: "BE0Jw0SRKTNxmAZmFegaQSalkRV4Nb789tCU6YezdyDNMZSWJAJv6gS4swqPMgEUvEC_8rGdF91by94OkJj4-UQ"
          });
          if (token) registerDeviceToken(token);
        }
        onMessage(messaging, (payload) => {
          // Show a custom modal or alert
          alert(`${payload.notification.title}\n${payload.notification.body}`);
        });
      }
    } catch (err) {
      console.error('Notification init error:', err);
    }
  })();
};

// ---------- Call after login ----------
useEffect(() => {
  if (auth.user?.id) {
    initializeNotifications();
  }
}, [auth.user?.id]);

  // ========== 1. EXISTING: Payment verification from URL (web & fallback) ==========
  // ========== 1. EXISTING: Payment verification from URL (web & fallback) ==========
useEffect(() => {
  // Only proceed if there's an ongoing payment intent
  const waitingForPayment = localStorage.getItem('waiting_for_payment');
  if (waitingForPayment !== 'true') return;

  const params = new URLSearchParams(window.location.search);
  const reference = params.get('reference') || params.get('trxref');
  const storedReference = localStorage.getItem('payment_reference');
  const paymentRef = reference || storedReference;
  
  if (paymentRef && auth.user?.id) {
    const verifyPayment = async () => {
      try {
        console.log('Verifying payment:', paymentRef, 'for user:', auth.user?.id);
        const response = await axios.post('/api/verify-payment', { 
          reference: paymentRef, 
          userId: auth.user?.id 
        });
        console.log('Verification response:', response.data);
        
        if (response.data.success) {
          alert('✅ Payment successful! Your account has been upgraded to PREMIUM!');
          localStorage.removeItem('payment_reference');
          const updatedUser = { ...auth.user, isPremium: true };
          setAuth({ ...auth, user: updatedUser });
          localStorage.setItem('auth', JSON.stringify({ ...auth, user: updatedUser }));
          if (auth.token) {
            axios.defaults.headers.common['Authorization'] = `Bearer ${auth.token}`;
          }
          window.location.href = '/';
        } else {
          alert('Payment verification failed: ' + (response.data.error || 'Unknown error') + '. Please contact support if you were charged.');
        }
      } catch (error) { 
        console.error('Verification error:', error);
        alert('Payment verification failed. Please contact support if you were charged.');
      } finally {
        localStorage.removeItem('waiting_for_payment');
        localStorage.removeItem('payment_reference');
      }
    };
    verifyPayment();
  }
}, [auth.user?.id]);

// ========== 2. DEEP LINK LISTENER for automatic return from payment ==========
useEffect(() => {
  if (!Capacitor.isNativePlatform()) return;

  const listener = CapacitorApp.addListener('appUrlOpen', async (data) => {
    console.log('Deep link received:', data.url);
    if (data.url?.startsWith('elitenursing://payment')) {
      const url = new URL(data.url);
      const reference = url.searchParams.get('reference');
      const transactionId = url.searchParams.get('transactionId');
      if (reference && auth.user?.id) {
        try {
          const response = await axios.post('/api/verify-payment', {
            reference: reference,
            transactionId: transactionId,  // send the numeric ID
            userId: auth.user.id
          });
          if (response.data.success) {
            alert('✅ Payment successful! Your account is now PREMIUM.');
            const updatedUser = { ...auth.user, isPremium: true };
            setAuth({ ...auth, user: updatedUser });
            localStorage.setItem('auth', JSON.stringify({ token: auth.token, user: updatedUser }));
            window.location.reload();
          } else {
            alert('Payment verification failed: ' + (response.data.error || 'Unknown error'));
          }
        } catch (err) {
          console.error('Verification error:', err);
          alert('Could not verify payment. Please contact support.');
        }
        localStorage.removeItem('payment_reference');
        localStorage.removeItem('waiting_for_payment');
      }
    }
  });

  return () => listener.remove();
}, [auth.user?.id, auth.token]);

// Auto-refresh user status when app becomes active
useEffect(() => {
  if (!auth.token) return;

  let isMounted = true;

  const refreshUserStatus = async () => {
    try {
      const response = await axios.get('/api/user/profile', {
        headers: { Authorization: `Bearer ${auth.token}` }
      });
      const freshUser = response.data;
      if (isMounted && freshUser.isPremium !== auth.user?.isPremium) {
        // Update local state and localStorage
        const updatedUser = { ...auth.user, isPremium: freshUser.isPremium };
        setAuth({ ...auth, user: updatedUser });
        localStorage.setItem('auth', JSON.stringify({ token: auth.token, user: updatedUser }));
        console.log('Premium status synced:', freshUser.isPremium);
      }
    } catch (error) {
      console.error('Failed to refresh user status:', error);
    }
  };

  // Refresh immediately when app becomes visible (e.g., after returning from background)
  const handleVisibilityChange = () => {
    if (document.visibilityState === 'visible') {
      refreshUserStatus();
    }
  };

  document.addEventListener('visibilitychange', handleVisibilityChange);
  // Also refresh on page focus (optional)
  window.addEventListener('focus', refreshUserStatus);

  // ✅ NEW: Poll every 5 seconds to update premium badge quickly
  const intervalId = setInterval(refreshUserStatus, 5000);

  return () => {
    isMounted = false;
    document.removeEventListener('visibilitychange', handleVisibilityChange);
    window.removeEventListener('focus', refreshUserStatus);
    clearInterval(intervalId);  // ✅ NEW: Clean up the interval
  };
}, [auth.token, auth.user?.isPremium]);

  return (
  <AuthContext.Provider value={{ ...auth, login, logout, darkMode, toggleDarkMode }}>
    <BrowserRouter>
      <AppContent />
    </BrowserRouter>
    {notificationModal && (
      <div style={{
        position: 'fixed',
        top: 0, left: 0, right: 0, bottom: 0,
        background: 'rgba(0,0,0,0.7)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 9999
      }}>
        <div style={{
          background: 'white',
          borderRadius: 20,
          padding: 24,
          maxWidth: 320,
          textAlign: 'center',
          boxShadow: '0 4px 15px rgba(0,0,0,0.2)'
        }}>
          <div style={{ fontSize: 48, marginBottom: 12 }}>📢</div>
          <h3 style={{ color: '#1e3c72', marginBottom: 8 }}>{notificationModal.title}</h3>
          <p style={{ color: '#666', marginBottom: 20 }}>{notificationModal.body}</p>
          <button
            onClick={() => setNotificationModal(null)}
            style={{
              background: '#1e3c72',
              color: 'white',
              border: 'none',
              padding: '8px 20px',
              borderRadius: 30,
              cursor: 'pointer',
              fontWeight: 'bold'
            }}
          >
            OK
          </button>
        </div>
      </div>
    )}
  </AuthContext.Provider>
);
}

export default App;