import React, { useState, useEffect, createContext, useContext, useRef } from 'react';
import { BrowserRouter, Routes, Route, Navigate, Link, useParams, useSearchParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Browser } from '@capacitor/browser';
import { App as CapacitorApp } from '@capacitor/app';
import { Capacitor } from '@capacitor/core';

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
        <p style={{ color: '#999', fontSize: 10 }}>© 2026 ELITE Nursing & Midwifery CBT. All rights reserved.</p>
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

// Premium Modal Component (updated for in-app payment)
const PremiumModal = ({ onClose, examTitle, sectionNumber }) => {
  const { token, user } = useContext(AuthContext);
  const [loading, setLoading] = useState(false);

  const handlePayment = async () => {
    if (!user?.id) {
      alert('Please log in again to make payment.');
      return;
    }

    setLoading(true);
    try {
      console.log('User ID for payment:', user.id);

      // Determine redirect URL based on platform
      const isNative = Capacitor.isNativePlatform();
      const redirectUrl = isNative
        ? 'https://elite-nursing-cbt.vercel.app/payment-success.html'
        : 'https://elite-nursing-cbt.vercel.app/payment-return';

      const response = await axios.post('/api/initialize-payment', {
        email: user.email,
        amount: 5900,
        userId: user.id,
        planType: examTitle ? 'single' : 'premium',
        examId: examTitle ? window.location.pathname.split('/')[2] : null,
        examTitle: examTitle || null,
        sectionNumber: sectionNumber || null,
        redirect_url: redirectUrl
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      localStorage.setItem('payment_reference', response.data.reference);

      if (isNative) {
        // Open payment in in-app browser (Chrome Custom Tab)
        await Browser.open({ url: response.data.authorization_url });
        localStorage.setItem('waiting_for_payment', 'true');
      } else {
        // Web: normal redirect
        window.location.href = response.data.authorization_url;
      }
    } catch (error) {
      console.error('Payment error:', error);
      alert('Payment initialization failed. Please try again.');
      setLoading(false);
    }
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
        <p style={{ fontSize: 14, marginBottom: 15, color: '#666' }}>Upgrade to unlock ALL premium exams!</p>
        <div style={{ fontSize: 25, fontWeight: 'bold', color: '#1e3c72', margin: '15px 0' }}>
          ₦5,900 <span style={{ fontSize: 14, color: '#666' }}>/ lifetime</span>
        </div>
        <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
          <button onClick={onClose} style={{ flex: 1, background: '#6c757d', color: 'white', padding: 12, border: 'none', borderRadius: 10, cursor: 'pointer', fontWeight: '500', fontSize: 14 }}>Cancel</button>
          <button onClick={handlePayment} disabled={loading} style={{ flex: 1, background: '#ff9800', color: 'white', padding: 12, border: 'none', borderRadius: 10, cursor: 'pointer', fontWeight: 'bold', fontSize: 14 }}>
            {loading ? 'Processing...' : 'Pay ₦5,900'}
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
          <p style={{ fontSize: 11, color: '#999' }}>© 2026 ELITE Nursing & Midwifery CBT. All rights reserved.</p>
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
      if (errorMsg.includes('already logged in on another device')) {
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

  if (isLoading) {
    return <LoadingWithBar message="Logging in" />;
  }

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #1e3c72 0%, #2a5298 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px', position: 'relative' }}>
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
              <button onClick={cancelForceLogout} style={{ background: '#6c757d', color: 'white', padding: '10px 24px', border: 'none', borderRadius: 8, cursor: 'pointer', fontWeight: 'bold', fontSize: 14 }}>Cancel</button>
              <button onClick={handleForceLogout} style={{ background: '#dc3545', color: 'white', padding: '10px 24px', border: 'none', borderRadius: 8, cursor: 'pointer', fontWeight: 'bold', fontSize: 14 }}>Logout from Other Device</button>
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
            Sign In
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
        </div>
      </div>
    </div>
  );
};

// Home Page Component (updated to use cached quizzes)
const HomePage = () => {
  const [mode, setMode] = useState('free');
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
    const categories = {};
    quizzes.forEach(quiz => {
      if (!categories[quiz.category]) {
        categories[quiz.category] = [];
      }
      categories[quiz.category].push(quiz);
    });
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
          {Object.entries(categories).map(([category, categoryQuizzes]) => (
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
                <p style={{ color: darkMode ? '#aaa' : '#666', fontSize: 14, marginBottom: 12 }}>{categoryQuizzes.length} courses</p>
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
        <p style={{ color: '#999', fontSize: 12 }}>© 2026 ELITE Nursing & Midwifery CBT. All rights reserved.</p>
      </div>
    </div>
  );
};

// Course List Component – final version with large gaps and no overlap
const CourseList = () => {
  const { categoryName, mode } = useParams();
  const [displayData, setDisplayData] = useState([]);
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
          let topicQuizzes = filtered.filter(q => q.topic === currentTopic);
          topicQuizzes.sort((a, b) => {
            const numA = parseInt(a.title.match(/\d+/)?.[0] || 0);
            const numB = parseInt(b.title.match(/\d+/)?.[0] || 0);
            return numA - numB;
          });
          if (mode === 'free') topicQuizzes = topicQuizzes.slice(0, 1);
          setDisplayData(topicQuizzes);
          setIsTopicView(false);
        } else {
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
          setDisplayData(Array.from(topicMap.values()));
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

        {/* CSS Grid – large gap to prevent overlap */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
          gap: '40px',
          marginBottom: '60px'
        }}>
          {displayData.map(item => {
            if (isTopicView) {
              // Course card
              return (
                <Link to={`/courses/${categoryName}/${mode}?topic=${encodeURIComponent(item.topic)}`} key={item.topic} style={{ textDecoration: 'none' }}>
                  <div style={{ 
                    background: darkMode ? '#16213e' : 'white', 
                    padding: 20, 
                    borderRadius: 16, 
                    boxShadow: '0 2px 8px rgba(0,0,0,0.1)', 
                    display: 'flex', 
                    flexDirection: 'column', 
                    height: '100%',
                    wordBreak: 'break-word'
                  }}>
                    <div style={{ fontSize: 40, marginBottom: 12 }}>📚</div>
                    <h3 style={{ color: category.color, fontSize: 'clamp(16px, 4vw, 18px)', marginBottom: 8 }}>{item.topic}</h3>
                    <p style={{ color: darkMode ? '#aaa' : '#666', fontSize: 13, marginBottom: 12 }}>{item.quizCount} exam sets, {item.totalQuestions} total questions</p>
                    <div style={{ marginTop: 'auto' }}>
                      <button style={{ width: '100%', background: category.color, color: 'white', border: 'none', padding: '10px', borderRadius: 10, cursor: 'pointer', fontWeight: 'bold', fontSize: 14 }}>View Exams →</button>
                    </div>
                  </div>
                </Link>
              );
            } else {
              // Exam set card
              const quiz = item;
              const totalQuestions = quiz.questions?.length || 0;
              const lastScore = getLastScore(quiz._id);
              const hasTakenFree = localStorage.getItem(`exam_${quiz._id}_taken`) === 'true';

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
                  <div style={{ 
                    background: darkMode ? '#16213e' : 'white', 
                    padding: 20, 
                    borderRadius: 16, 
                    boxShadow: '0 2px 8px rgba(0,0,0,0.1)', 
                    display: 'flex', 
                    flexDirection: 'column', 
                    height: '100%',
                    wordBreak: 'break-word'
                  }}>
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
                ⭐ Upgrade to Premium (₦5,900)
              </button>
            </Link>
          </div>
        )}

        {/* Copyright */}
        <div style={{ textAlign: 'center', padding: '20px', marginTop: 20 }}>
          <p style={{ color: '#999', fontSize: 12 }}>© 2026 ELITE Nursing & Midwifery CBT. All rights reserved.</p>
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
              <p style={{ color: '#ff9800', fontWeight: 'bold', fontSize: 16 }}>⭐ Unlock ALL premium exams and retakes for ₦5,900 (Lifetime Access)!</p>
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
                <p style={{ color: '#ff9800', fontSize: 14 }}>⭐ Upgrade to access all examinations for ₦5,900 (Lifetime Access)!</p>
                <Link to="/get-premium"><button style={{ background: '#ff9800', color: 'white', padding: '10px 24px', border: 'none', borderRadius: 30, cursor: 'pointer', fontWeight: 'bold', fontSize: 14, marginTop: 8 }}>Upgrade Now →</button></Link>
              </div>
            )}
          </div>
        )}
      </div>
      <div style={{ textAlign: 'center', padding: '20px', marginTop: 20 }}>
        <p style={{ color: '#999', fontSize: 12 }}>© 2026 ELITE Nursing & Midwifery CBT. All rights reserved.</p>
      </div>
    </div>
  );
};

// Take Exam Component – with question palette and single‑question navigation
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
        
        if (mode === 'free') {
          const hasTaken = localStorage.getItem(`exam_${id}_taken`) === 'true';
          if (hasTaken) {
            alert('You have already taken this free exam. Upgrade to Premium to retake.');
            window.location.href = '/get-premium';
            setLoading(false);
            return;
          }
        } else {
          const profileRes = await axios.get('/api/user/profile', { headers: { Authorization: `Bearer ${token}` } });
          if (!profileRes.data.isPremium) {
            setPremiumBlocked(true);
            setLoading(false);
            return;
          }
        }
        
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

  // Save answers to localStorage whenever they change
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
              <Link to="/get-premium"><button style={{ width: '100%', background: '#ff9800', color: 'white', padding: 10, border: 'none', borderRadius: 8, cursor: 'pointer', fontWeight: 'bold', marginTop: 8 }}>⭐ Upgrade Now (₦5,900)</button></Link>
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
        <p style={{ color: '#999', fontSize: 12 }}>© 2026 ELITE Nursing & Midwifery CBT. All rights reserved.</p>
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
            <li>✓ Upgrade for only ₦5,900 (Lifetime Access) to unlock everything</li>
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
            <li>⭐ <strong>Get Premium</strong> - Upgrade for full access (₦5,900 Lifetime Access)</li>
          </ul>
        </div>
        
        <div style={{ background: darkMode ? '#1a1a2e' : '#f0f7f4', padding: 16, borderRadius: 12, textAlign: 'center' }}>
          <p style={{ color: '#ff9800', fontWeight: 'bold', margin: 0 }}>Need help? Contact us via WhatsApp or Email!</p>
        </div>
      </div>
      <div style={{ textAlign: 'center', padding: '20px', marginTop: 20 }}>
        <p style={{ color: '#999', fontSize: 12 }}>© 2026 ELITE Nursing & Midwifery CBT. All rights reserved.</p>
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
        <p style={{ color: '#999', fontSize: 12 }}>© 2026 ELITE Nursing & Midwifery CBT. All rights reserved.</p>
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
              <p style={{ fontSize: 13, wordBreak: 'break-all' }}>anaduphilip2000@gmail.com</p>
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
        <p style={{ color: '#999', fontSize: 12 }}>© 2026 ELITE Nursing & Midwifery CBT. All rights reserved.</p>
      </div>
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
        <p style={{ color: '#999', fontSize: 12 }}>© 2026 ELITE Nursing & Midwifery CBT. All rights reserved.</p>
      </div>
    </div>
  );
};

// Get Premium Component (updated for in-app payment)
const GetPremium = () => {
  const { token, user, darkMode } = useContext(AuthContext);
  const [loading, setLoading] = useState(false);

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
        amount: 5900,
        userId: user.id,
        planType: 'premium',
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

  return (
    <div style={{ background: darkMode ? '#1a1a2e' : '#f0f7f4', minHeight: '100vh', padding: '20px' }}>
      <div style={{ maxWidth: 900, margin: '0 auto', background: darkMode ? '#16213e' : 'white', borderRadius: 20, padding: 24, textAlign: 'center', boxShadow: '0 4px 15px rgba(0,0,0,0.1)' }}>
        <div style={{ fontSize: 56, marginBottom: 16 }}>⭐</div>
        <h2 style={{ color: '#1e3c72' }}>Upgrade to Premium</h2>
        <p style={{ marginBottom: 20 }}>Get unlimited access to all examinations and features</p>
        {user?.isPremium ? (
          <div style={{ background: '#e8f5e9', padding: 20, borderRadius: 16 }}>
            <div style={{ fontSize: 48, marginBottom: 8 }}>✅</div>
            <h3 style={{ color: '#1e3c72' }}>You are already a Premium Member!</h3>
          </div>
        ) : (
          <>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 16, margin: 20 }}>
              <div><div style={{ fontSize: 36, marginBottom: 8 }}>📚</div><h3 style={{ fontSize: 14 }}>All Subjects</h3></div>
              <div><div style={{ fontSize: 36, marginBottom: 8 }}>📝</div><h3 style={{ fontSize: 14 }}>All Exams</h3></div>
              <div><div style={{ fontSize: 36, marginBottom: 8 }}>🎯</div><h3 style={{ fontSize: 14 }}>20k+ Questions</h3></div>
              <div><div style={{ fontSize: 36, marginBottom: 8 }}>🏆</div><h3 style={{ fontSize: 14 }}>Lifetime Access</h3></div>
            </div>
            <div style={{ background: darkMode ? '#1a1a2e' : '#f0f7f4', padding: 16, borderRadius: 12, margin: 20 }}>
              <div style={{ fontSize: 28, fontWeight: 'bold', color: '#1e3c72' }}>₦5,900 <span style={{ fontSize: 14, color: '#666' }}>/ lifetime</span></div>
            </div>
            <button onClick={handlePayment} disabled={loading} style={{ background: '#ff9800', color: 'white', padding: '12px 32px', border: 'none', borderRadius: 30, cursor: 'pointer', fontSize: 16, fontWeight: 'bold' }}>
              {loading ? 'Processing...' : 'Pay ₦5,900'}
            </button>
          </>
        )}
      </div>
      <div style={{ textAlign: 'center', padding: '20px', marginTop: 20 }}>
        <p style={{ color: '#999', fontSize: 12 }}>© 2026 ELITE Nursing & Midwifery CBT. All rights reserved.</p>
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
          
          const updatedUser = { ...currentUser, isPremium: true };
          localStorage.setItem('auth', JSON.stringify({ token: currentToken, user: updatedUser }));
          
          if (login && currentToken) {
            login(currentToken, updatedUser);
          }
          
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

// Admin Panel Component
const AdminPanel = () => {
  const [users, setUsers] = useState([]);
  const [contacts, setContacts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('users');
  const [replyingTo, setReplyingTo] = useState(null);
  const [replyMessage, setReplyMessage] = useState('');
  const [sendingReply, setSendingReply] = useState(false);
  const { token, user, darkMode, logout } = useContext(AuthContext);

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
    
    if (user?.email === 'anaduphilip2000@gmail.com') {
      fetchData();
    } else if (user) {
      alert('Admin access only');
      window.location.href = '/';
    }
  }, [token, user, logout]);

  const togglePremium = async (userId, currentStatus) => {
    try {
      await axios.post('/api/admin/toggle-premium', 
        { userId, isPremium: !currentStatus },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setUsers(users.map(u => 
        u._id === userId ? { ...u, isPremium: !currentStatus } : u
      ));
    } catch (error) {
      alert('Failed to update user status');
    }
  };

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

  if (loading) return <LoadingWithBar message="Loading admin panel" />;

  if (user?.email !== 'anaduphilip2000@gmail.com') {
    return <Navigate to="/" />;
  }

  return (
    <div style={{ background: darkMode ? '#1a1a2e' : '#f0f7f4', minHeight: '100vh', padding: '20px' }}>
      <div style={{ maxWidth: 1200, margin: '0 auto' }}>
        <div style={{ background: darkMode ? '#16213e' : 'white', borderRadius: 20, padding: 24, boxShadow: '0 4px 15px rgba(0,0,0,0.1)' }}>
          <h1 style={{ color: '#1e3c72', textAlign: 'center', marginBottom: 20, fontSize: 28 }}>Admin Panel</h1>
          
          <div style={{ display: 'flex', gap: 12, marginBottom: 24, borderBottom: '2px solid #e0e0e0', paddingBottom: 12, justifyContent: 'center' }}>
            <button onClick={() => setActiveTab('users')} style={{ background: activeTab === 'users' ? '#1e3c72' : 'transparent', color: activeTab === 'users' ? 'white' : '#1e3c72', padding: '10px 24px', border: activeTab === 'users' ? 'none' : '1px solid #1e3c72', borderRadius: 8, cursor: 'pointer', fontWeight: 'bold' }}>Users ({users.length})</button>
            <button onClick={() => setActiveTab('contacts')} style={{ background: activeTab === 'contacts' ? '#1e3c72' : 'transparent', color: activeTab === 'contacts' ? 'white' : '#1e3c72', padding: '10px 24px', border: activeTab === 'contacts' ? 'none' : '1px solid #1e3c72', borderRadius: 8, cursor: 'pointer', fontWeight: 'bold' }}>Contact Messages ({contacts.length})</button>
          </div>

          {activeTab === 'users' && (
            <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: 20 }}>
              {users.map(u => (
                <div key={u._id} style={{ width: '350px', background: darkMode ? '#1a1a2e' : '#f8f9fa', padding: 20, borderRadius: 12, border: '1px solid #e0e0e0' }}>
                  <p><strong>Name:</strong> {u.name || 'N/A'}</p>
                  <p><strong>Email:</strong> {u.email}</p>
                  <p><strong>Premium:</strong> {u.isPremium ? '✅ Yes' : '❌ No'}</p>
                  <p><strong>Verified:</strong> {u.isVerified ? '✅ Yes' : '❌ No'}</p>
                  <p><strong>Joined:</strong> {new Date(u.createdAt).toLocaleDateString()}</p>
                  <div style={{ display: 'flex', gap: 10, marginTop: 15 }}>
                    <button onClick={() => togglePremium(u._id, u.isPremium)} style={{ background: u.isPremium ? '#dc3545' : '#28a745', color: 'white', padding: '8px 16px', border: 'none', borderRadius: 6, cursor: 'pointer', fontSize: 13, fontWeight: 'bold' }}>
                      {u.isPremium ? 'Remove Premium' : 'Make Premium'}
                    </button>
                    <button onClick={() => deleteUser(u._id)} style={{ background: '#dc3545', color: 'white', padding: '8px 16px', border: 'none', borderRadius: 6, cursor: 'pointer', fontSize: 13, fontWeight: 'bold' }}>Delete User</button>
                  </div>
                </div>
              ))}
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
        </div>
      </div>
      <div style={{ textAlign: 'center', padding: '20px', marginTop: 20 }}>
        <p style={{ color: '#999', fontSize: 12 }}>© 2026 ELITE Nursing & Midwifery CBT. All rights reserved.</p>
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

  const isAdmin = user?.email === 'anaduphilip2000@gmail.com';

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
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/payment-return" element={<PaymentReturn />} />
        <Route path="*" element={<Navigate to="/login" />} />
      </Routes>
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
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
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

  const toggleDarkMode = () => {
    setDarkMode(!darkMode);
    localStorage.setItem('darkMode', !darkMode);
  };

  if (auth.token) {
    axios.defaults.headers.common['Authorization'] = `Bearer ${auth.token}`;
  }

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

  // ========== 2. NEW: Listen for app coming to foreground (Android only) ==========
  // Only change the listener line
useEffect(() => {
  if (!Capacitor.isNativePlatform()) return;

  const handleAppStateChange = async (state) => {
    if (state.isActive) {
      const pendingRef = localStorage.getItem('payment_reference');
      const waiting = localStorage.getItem('waiting_for_payment');

      if (waiting === 'true' && pendingRef && auth.user?.id) {
        localStorage.removeItem('waiting_for_payment');
        try {
          const response = await axios.post('/api/verify-payment', {
            reference: pendingRef,
            userId: auth.user.id
          });
          if (response.data.success) {
            alert('✅ Payment successful! Your account is now PREMIUM.');
            const updatedUser = { ...auth.user, isPremium: true };
            setAuth({ ...auth, user: updatedUser });
            localStorage.setItem('auth', JSON.stringify({ token: auth.token, user: updatedUser }));
            window.location.reload();
          } else {
            alert('Payment verification failed. Please contact support if you were charged.');
          }
        } catch (err) {
          console.error('Verification error:', err);
          alert('Could not verify payment. Please contact support.');
        } finally {
          localStorage.removeItem('payment_reference');
        }
      }
    }
  };

  const listener = CapacitorApp.addListener('appStateChange', handleAppStateChange);
  return () => listener.remove();
}, [auth.user?.id, auth.token]);

  return (
    <AuthContext.Provider value={{ ...auth, login, logout, darkMode, toggleDarkMode }}>
      <BrowserRouter>
        <AppContent />
      </BrowserRouter>
    </AuthContext.Provider>
  );
}

export default App;