// src/components/profile/Profile.jsx
import React, { useState, useEffect, useContext } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { AuthContext } from '../../context/AuthContext';
import { getHeadingColor, getSecondaryText, getTextColor, getCardBg } from '../../utils/theme';
import { AdminLoginModal } from '../admin/AdminLoginModal'; // ← NEW IMPORT

export const Profile = () => {
  const { token, user, login, logout, darkMode, toggleDarkMode, openLogoutModal } = useContext(AuthContext);
  const headingColor = getHeadingColor(darkMode);
  const secondaryText = getSecondaryText(darkMode);
  const textColor = getTextColor(darkMode);
  const cardBg = getCardBg(darkMode);
  const [editName, setEditName] = useState(user?.name || '');
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  // ===== ADMIN SECURITY STATES =====
  const [showAdminLogin, setShowAdminLogin] = useState(false);
  const [adminAuthenticated, setAdminAuthenticated] = useState(() => {
    return localStorage.getItem('admin_token') ? true : false;
  });

  const [timeLeft, setTimeLeft] = useState(null);

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

  const handleSaveName = async () => {
    if (!editName.trim()) {
      setError('Name cannot be empty');
      return;
    }
    setLoading(true);
    setError('');
    setMessage('');
    try {
      const response = await axios.put('/api/user/profile', 
        { name: editName.trim() },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      login(token, response.data);
      setMessage('Name updated successfully!');
      setIsEditing(false);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to update name');
    } finally {
      setLoading(false);
    }
  };

  const [otpSent, setOtpSent] = useState(false);
  const [otp, setOtp] = useState('');
  const [verifyMessage, setVerifyMessage] = useState('');
  const [verifyError, setVerifyError] = useState('');

  const sendVerification = async () => {
    setVerifyError('');
    setVerifyMessage('');
    try {
      await axios.post('/api/send-verification', { email: user.email, name: user.name });
      setOtpSent(true);
      setVerifyMessage('Verification code sent to your email.');
    } catch (err) {
      setVerifyError(err.response?.data?.error || 'Failed to send code');
    }
  };

  const verifyOtp = async () => {
    if (!otp || otp.length !== 6) {
      setVerifyError('Please enter a valid 6-digit code');
      return;
    }
    try {
      const res = await axios.post('/api/verify-email', { email: user.email, otp });
      if (res.data.success) {
        setVerifyMessage('Email verified successfully!');
        const profileRes = await axios.get('/api/user/profile', {
          headers: { Authorization: `Bearer ${token}` }
        });
        login(token, profileRes.data);
        setOtpSent(false);
        setOtp('');
      }
    } catch (err) {
      setVerifyError(err.response?.data?.error || 'Verification failed');
    }
  };

  const isPremiumActive = user?.isPremium && user?.premiumExpiry && new Date(user.premiumExpiry) > new Date();

  // Handle logout click – opens the confirmation modal
  const handleLogoutClick = () => {
    openLogoutModal();
  };

  // ===== ADMIN LINK HANDLER =====
  const handleAdminClick = (e) => {
    e.preventDefault();
    if (adminAuthenticated) {
      navigate('/admin');
    } else {
      setShowAdminLogin(true);
    }
  };

  // ===== ADMIN LOGIN SUCCESS =====
  const handleAdminLoginSuccess = () => {
    setAdminAuthenticated(true);
    setShowAdminLogin(false);
    navigate('/admin');
  };

  return (
    <div style={{ background: darkMode ? '#1a1a2e' : '#f0f7f4', minHeight: '100vh', padding: '20px' }}>
      <div style={{ maxWidth: 800, margin: '0 auto', background: darkMode ? '#16213e' : 'white', borderRadius: 20, padding: 30, boxShadow: '0 4px 15px rgba(0,0,0,0.1)' }}>
        {/* ... existing profile content ... */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 24 }}>
          <div style={{ width: 64, height: 64, borderRadius: '50%', background: '#1e3c72', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 32, color: 'white' }}>
            {user?.name?.charAt(0) || 'U'}
          </div>
          <div>
            <h1 style={{ color: headingColor, fontSize: 22, margin: 0 }}>My Profile</h1>
            <p style={{ color: secondaryText, fontSize: 14, margin: 0 }}>{user?.email}</p>
          </div>
        </div>

        <div style={{ marginBottom: 20 }}>
          <label style={{ fontWeight: 'bold', display: 'block', marginBottom: 4, color: textColor }}>Name</label>
          {isEditing ? (
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
              <input
                type="text"
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                style={{ flex: 1, padding: '8px 12px', border: '1px solid #ccc', borderRadius: 8, minWidth: 150 }}
              />
              <button onClick={handleSaveName} disabled={loading} style={{ background: '#1e3c72', color: 'white', padding: '8px 16px', border: 'none', borderRadius: 8, cursor: 'pointer' }}>
                {loading ? 'Saving...' : 'Save'}
              </button>
              <button onClick={() => { setIsEditing(false); setEditName(user?.name || ''); }} style={{ background: '#6c757d', color: 'white', padding: '8px 16px', border: 'none', borderRadius: 8, cursor: 'pointer' }}>Cancel</button>
            </div>
          ) : (
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: 16, color: textColor }}>{user?.name || 'Not set'}</span>
              <button onClick={() => setIsEditing(true)} style={{ background: 'transparent', color: headingColor, border: '1px solid #1e3c72', padding: '4px 12px', borderRadius: 6, cursor: 'pointer' }}>Edit</button>
            </div>
          )}
          {message && <p style={{ color: '#2e7d32', fontSize: 13, marginTop: 4 }}>{message}</p>}
          {error && <p style={{ color: '#c62828', fontSize: 13, marginTop: 4 }}>{error}</p>}
        </div>

        <div style={{ marginBottom: 20 }}>
          <label style={{ fontWeight: 'bold', display: 'block', marginBottom: 4, color: textColor }}>Email</label>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
            <span style={{ fontSize: 16, color: textColor }}>{user?.email}</span>
            {user?.isVerified ? (
              <span style={{ color: '#2e7d32', fontSize: 13, fontWeight: 'bold' }}>✅ Verified</span>
            ) : (
              <span style={{ color: '#ff9800', fontSize: 13, fontWeight: 'bold' }}>⚠️ Not Verified</span>
            )}
          </div>
          {!user?.isVerified && (
            <div style={{ marginTop: 8 }}>
              {!otpSent ? (
                <button onClick={sendVerification} style={{ background: '#ff9800', color: 'white', padding: '6px 14px', border: 'none', borderRadius: 6, cursor: 'pointer' }}>Verify Email</button>
              ) : (
                <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
                  <input
                    type="text"
                    placeholder="Enter 6-digit code"
                    value={otp}
                    onChange={(e) => setOtp(e.target.value)}
                    style={{ width: '150px', padding: '6px 10px', border: '1px solid #ccc', borderRadius: 6 }}
                  />
                  <button onClick={verifyOtp} style={{ background: '#28a745', color: 'white', padding: '6px 14px', border: 'none', borderRadius: 6, cursor: 'pointer' }}>Verify</button>
                  <button onClick={() => setOtpSent(false)} style={{ background: 'transparent', color: '#6c757d', border: 'none', cursor: 'pointer', fontSize: 13 }}>Cancel</button>
                </div>
              )}
              {verifyMessage && <p style={{ color: '#2e7d32', fontSize: 13, marginTop: 4 }}>{verifyMessage}</p>}
              {verifyError && <p style={{ color: '#c62828', fontSize: 13, marginTop: 4 }}>{verifyError}</p>}
            </div>
          )}
        </div>

        <div style={{ marginBottom: 20, background: darkMode ? '#2d2d3d' : '#f5f5f5', padding: 16, borderRadius: 12 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <strong style={{ color: textColor }}>Premium Status</strong>
            {isPremiumActive ? (
              <span style={{ color: '#2e7d32', fontWeight: 'bold' }}>✅ Active</span>
            ) : (
              <span style={{ color: '#dc3545', fontWeight: 'bold' }}> </span>
            )}
          </div>
          {isPremiumActive && (
            <>
              <p style={{ marginTop: 4, color: textColor }}><strong>Plan:</strong> {user.premiumPlan ? user.premiumPlan.toUpperCase() : 'N/A'}</p>
              <p style={{ color: textColor }}><strong>Expires:</strong> {new Date(user.premiumExpiry).toLocaleString()}</p>
              {timeLeft && (
                <div style={{ marginTop: 8, padding: 10, background: '#fff3e0', borderRadius: 8 }}>
                  <p style={{ margin: 0, fontSize: 14, fontWeight: 'bold', color: '#e65100' }}>⏳ Time remaining:</p>
                  <div style={{ display: 'flex', gap: 12, marginTop: 4, flexWrap: 'wrap' }}>
                    {timeLeft.days > 0 && <span><strong>{timeLeft.days}</strong>d</span>}
                    <span><strong>{String(timeLeft.hours).padStart(2, '0')}</strong>h</span>
                    <span><strong>{String(timeLeft.minutes).padStart(2, '0')}</strong>m</span>
                    <span><strong>{String(timeLeft.seconds).padStart(2, '0')}</strong>s</span>
                  </div>
                </div>
              )}
            </>
          )}
          <Link to="/get-premium">
            <button style={{ marginTop: 10, background: '#ff9800', color: 'white', padding: '8px 16px', border: 'none', borderRadius: 8, cursor: 'pointer', fontWeight: 'bold' }}>
              {isPremiumActive ? 'Renew / Upgrade' : 'Get Premium'}
            </button>
          </Link>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 20 }}>
          <Link to="/history" style={{ display: 'flex', alignItems: 'center', gap: 10, background: darkMode ? '#2d2d3d' : '#e8f5e9', padding: 12, borderRadius: 8, textDecoration: 'none', color: headingColor, fontWeight: 'bold' }}>
            <span style={{ fontSize: 20 }}> </span> My History
          </Link>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: 12, background: darkMode ? '#2d2d3d' : '#f5f5f5', borderRadius: 8 }}>
            <span style={{ fontWeight: 'bold', color: textColor }}>{darkMode ? '☀️ Light Mode' : '🌙 Dark Mode'}</span>
            <button onClick={toggleDarkMode} style={{ background: '#1e3c72', color: 'white', padding: '6px 12px', border: 'none', borderRadius: 6, cursor: 'pointer' }}>
              Toggle
            </button>
          </div>
          {user?.email === 'elitenursingcbt@gmail.com' && (
            // ===== UPDATED ADMIN LINK WITH SECURITY =====
            <Link 
              to="#" 
              onClick={handleAdminClick}
              style={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: 10, 
                background: '#ffebee', 
                padding: 12, 
                borderRadius: 8, 
                textDecoration: 'none', 
                color: '#dc3545', 
                fontWeight: 'bold' 
              }}
            >
              <span style={{ fontSize: 20 }}>👑</span> Admin Panel
              {adminAuthenticated && (
                <span style={{ 
                  fontSize: 11, 
                  background: '#4caf50', 
                  color: 'white', 
                  padding: '2px 10px', 
                  borderRadius: 12,
                  marginLeft: 'auto'
                }}>
                  ✅ Authenticated
                </span>
              )}
            </Link>
          )}
        </div>

        {/* Logout button – now triggers the confirmation modal */}
        <button 
          onClick={handleLogoutClick} 
          style={{ width: '100%', background: '#dc3545', color: 'white', padding: '12px', border: 'none', borderRadius: 8, cursor: 'pointer', fontWeight: 'bold', fontSize: 16 }}
        >
          Logout
        </button>
      </div>
      <div style={{ textAlign: 'center', padding: '20px', marginTop: 20 }}>
        <p style={{ color: secondaryText, fontSize: 12 }}>© 2026 ELITE Nursing & Midwifery CBT. All rights reserved.</p>
      </div>

      {/* ===== ADMIN LOGIN MODAL ===== */}
      {showAdminLogin && (
        <AdminLoginModal
          darkMode={darkMode}
          onClose={() => setShowAdminLogin(false)}
          onSuccess={handleAdminLoginSuccess}
        />
      )}
    </div>
  );
};