import React, { useState, useEffect, useContext } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { AuthContext } from '../../context/AuthContext';
import { getHeadingColor, getSecondaryText, getTextColor, getCardBg } from '../../utils/theme';
import { LoadingWithBar } from '../common/LoadingWithBar';

export const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showWelcome, setShowWelcome] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [showForceLogoutDialog, setShowForceLogoutDialog] = useState(false);
  const [pendingCredentials, setPendingCredentials] = useState(null);
  const { login } = useContext(AuthContext);
  const { darkMode } = useContext(AuthContext);
  const headingColor = getHeadingColor(darkMode);
  const secondaryText = getSecondaryText(darkMode);
  const textColor = getTextColor(darkMode);
  const cardBg = getCardBg(darkMode);

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
            <p style={{ marginTop: 16, color: headingColor }}>Logging in...</p>
          </div>
        </div>
      )}

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
            background: cardBg,
            borderRadius: 20,
            padding: 28,
            maxWidth: 400,
            width: '90%',
            textAlign: 'center',
            boxShadow: '0 20px 40px rgba(0,0,0,0.2)'
          }}>
            <div style={{ fontSize: 48, marginBottom: 16 }}>⚠️</div>
            <h2 style={{ color: headingColor, marginBottom: 8 }}>Already Logged In Elsewhere</h2>
            <p style={{ color: secondaryText, marginBottom: 20 }}>
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
          background: cardBg,
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
            <strong style={{ color: headingColor, fontSize: 14 }}>Welcome to ELITE Nursing & Midwifery CBT!</strong>
            <p style={{ margin: 0, fontSize: 11, color: secondaryText }}>Sign in to continue your learning journey</p>
          </div>
          <button onClick={() => setShowWelcome(false)} style={{ background: 'none', border: 'none', fontSize: 16, cursor: 'pointer', color: secondaryText }}>✕</button>
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

      <div style={{ maxWidth: 400, width: '100%', background: cardBg, borderRadius: 24, padding: '32px', boxShadow: '0 20px 40px rgba(0,0,0,0.2)' }}>
        <div style={{ textAlign: 'center', marginBottom: 24 }}>
          <div style={{ fontSize: 48, marginBottom: 12 }}>📚</div>
          <h1 style={{ color: headingColor, fontSize: 20, margin: 0, fontWeight: 'bold' }}>ELITE NURSING &</h1>
          <h1 style={{ color: headingColor, fontSize: 20, margin: 0, fontWeight: 'bold' }}>MIDWIFERY CBT</h1>
          <p style={{ color: secondaryText, fontSize: 12, marginTop: 6 }}>Computer Based Testing Platform</p>
        </div>
        
        <div style={{ textAlign: 'center', marginBottom: 20 }}>
          <h2 style={{ color: textColor, fontSize: 18, marginBottom: 4 }}>Welcome Back</h2>
          <p style={{ color: '#888', fontSize: 12 }}>Sign in to continue your preparation</p>
        </div>
        
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <div style={{ marginBottom: 16, width: '100%' }}>
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
          <div style={{ marginBottom: 20, width: '100%' }}>
            <label style={{ display: 'block', marginBottom: 6, color: textColor, fontSize: 13, fontWeight: 500 }}>Password</label>
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
            <Link to="/forgot-password" style={{ color: headingColor, fontSize: 12, textDecoration: 'none' }}>
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
          <p style={{ color: secondaryText, fontSize: 13 }}>
            Don't have an account? <Link to="/register" style={{ color: headingColor, fontWeight: 'bold', textDecoration: 'none' }}>Create Account</Link>
          </p>
        </div>
        
        <div style={{ marginTop: 24, paddingTop: 16, borderTop: '1px solid #eee', textAlign: 'center' }}>
          <p style={{ fontSize: 11, color: secondaryText }}>© 2026 ELITE Nursing & Midwifery CBT</p>
          <p style={{ fontSize: 11, color: secondaryText }}>Over 20,000+ practice questions</p>
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