import React, { useState, useContext } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { AuthContext } from '../../context/AuthContext';
import { getHeadingColor, getSecondaryText, getTextColor, getCardBg } from '../../utils/theme';
import { LoadingWithBar } from '../common/LoadingWithBar';

export const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const { darkMode } = useContext(AuthContext);
  const headingColor = getHeadingColor(darkMode);
  const secondaryText = getSecondaryText(darkMode);
  const textColor = getTextColor(darkMode);
  const cardBg = getCardBg(darkMode);
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
      <div style={{ maxWidth: 450, width: '100%', background: cardBg, borderRadius: 24, padding: 32, boxShadow: '0 20px 40px rgba(0,0,0,0.2)' }}>
        <div style={{ textAlign: 'center', marginBottom: 24 }}>
          <div style={{ fontSize: 52, marginBottom: 16 }}>🔐</div>
          <h1 style={{ color: headingColor, fontSize: 22, margin: 0, fontWeight: 'bold' }}>Reset Password</h1>
          <p style={{ color: secondaryText, fontSize: 12, marginTop: 6 }}>Enter your email to receive a verification code</p>
        </div>

        {message && (
          <div style={{ background: darkMode ? '#2d2d3d' : '#e8f5e9', padding: 12, borderRadius: 10, marginBottom: 16, textAlign: 'center' }}>
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
              <label style={{ display: 'block', marginBottom: 6, color: textColor, fontSize: 13, fontWeight: 500 }}>Email Address</label>
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
              <label style={{ display: 'block', marginBottom: 6, color: textColor, fontSize: 13, fontWeight: 500 }}>Verification Code</label>
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
              <label style={{ display: 'block', marginBottom: 6, color: textColor, fontSize: 13, fontWeight: 500 }}>New Password</label>
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
              <label style={{ display: 'block', marginBottom: 6, color: textColor, fontSize: 13, fontWeight: 500 }}>Confirm Password</label>
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
          <Link to="/login" style={{ color: headingColor, fontSize: 13, textDecoration: 'none' }}>
            ← Back to Login
          </Link>
        </div>
        <div style={{ marginTop: 24, paddingTop: 16, borderTop: '1px solid #eee', textAlign: 'center' }}>
          <p style={{ fontSize: 11, color: secondaryText }}>© 2026 ELITE Nursing & Midwifery CBT. All rights reserved.</p>
        </div>
      </div>
    </div>
  );
};