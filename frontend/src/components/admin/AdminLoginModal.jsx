// frontend/src/components/admin/AdminLoginModal.jsx
import React, { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { AuthContext } from '../../context/AuthContext';
import { getHeadingColor, getSecondaryText, getTextColor, getCardBg } from '../../utils/theme';

export const AdminLoginModal = ({ onSuccess, onClose }) => {
  const { darkMode } = useContext(AuthContext);
  const headingColor = getHeadingColor(darkMode);
  const secondaryText = getSecondaryText(darkMode);
  const textColor = getTextColor(darkMode);
  const cardBg = getCardBg(darkMode);
  const navigate = useNavigate();

  const [step, setStep] = useState('password'); // 'password' | 'key' | 'security' | 'locked' | 'reset-request' | 'reset-verify'
  const [password, setPassword] = useState('');
  const [key, setKey] = useState('');
  const [securityAnswer, setSecurityAnswer] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [securityQuestion, setSecurityQuestion] = useState('');
  const [isConfigured, setIsConfigured] = useState(false);
  const [lockedUntil, setLockedUntil] = useState(null);

  // Reset states
  const [resetEmail, setResetEmail] = useState('elitenursingcbt@gmail.com');
  const [resetCode, setResetCode] = useState('');
  const [resetMessage, setResetMessage] = useState('');
  const [resetNewPassword, setResetNewPassword] = useState('');
  const [resetNewKey, setResetNewKey] = useState('');
  const [resetNewSecurityQuestion, setResetNewSecurityQuestion] = useState('What is your pet\'s name?');
  const [resetNewSecurityAnswer, setResetNewSecurityAnswer] = useState('');
  const [resetLoading, setResetLoading] = useState(false);

  // Check security status
  useEffect(() => {
    const checkStatus = async () => {
      try {
        const res = await axios.get('/api/admin/security-status');
        setIsConfigured(res.data.isConfigured);
        if (res.data.isConfigured) {
          setSecurityQuestion(res.data.securityQuestion || 'What is your pet\'s name?');
        }
      } catch (error) {
        console.error('Failed to check admin security status:', error);
      }
    };
    checkStatus();
  }, []);

  // Handlers for main login flow
  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      // We'll send all fields in one request and let backend tell us which step failed
      const res = await axios.post('/api/admin/verify', {
        password,
        key: '',
        securityAnswer: ''
      });
      // If we get here, password is valid, move to key
      setStep('key');
    } catch (error) {
      if (error.response?.data?.locked) {
        setStep('locked');
        setLockedUntil(error.response.data.remainingMinutes);
        setError(`Too many failed attempts. Try again in ${error.response.data.remainingMinutes} minutes.`);
      } else if (error.response?.data?.step === 'password') {
        setError(error.response.data.error);
      } else {
        setError(error.response?.data?.error || 'Invalid password');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleKeySubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await axios.post('/api/admin/verify', {
        password,
        key,
        securityAnswer: ''
      });
      // Key is valid, move to security
      setStep('security');
    } catch (error) {
      if (error.response?.data?.locked) {
        setStep('locked');
        setLockedUntil(error.response.data.remainingMinutes);
        setError(`Too many failed attempts. Try again in ${error.response.data.remainingMinutes} minutes.`);
      } else if (error.response?.data?.step === 'key') {
        setError(error.response.data.error);
      } else {
        setError(error.response?.data?.error || 'Invalid admin key');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSecuritySubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await axios.post('/api/admin/verify', {
        password,
        key,
        securityAnswer
      });
      if (res.data.success) {
        localStorage.setItem('admin_token', res.data.adminToken);
        onSuccess();
      }
    } catch (error) {
      if (error.response?.data?.locked) {
        setStep('locked');
        setLockedUntil(error.response.data.remainingMinutes);
        setError(`Too many failed attempts. Try again in ${error.response.data.remainingMinutes} minutes.`);
      } else if (error.response?.data?.step === 'security') {
        setError(error.response.data.error);
      } else {
        setError(error.response?.data?.error || 'Invalid security answer');
      }
    } finally {
      setLoading(false);
    }
  };

  // Reset handlers
  const handleSendResetCode = async (e) => {
    e.preventDefault();
    setError('');
    setResetMessage('');
    setResetLoading(true);
    try {
      const res = await axios.post('/api/admin/send-reset-code', { email: resetEmail });
      setResetMessage('✅ Reset code sent to your admin email. Please check your inbox.');
      setStep('reset-verify');
    } catch (error) {
      setError(error.response?.data?.error || 'Failed to send reset code.');
    } finally {
      setResetLoading(false);
    }
  };

  const handleVerifyReset = async (e) => {
    e.preventDefault();
    setError('');
    setResetMessage('');
    setResetLoading(true);
    if (resetNewPassword !== resetNewKey) {
      setError('New password and key must match (you can use the same value).');
      setResetLoading(false);
      return;
    }
    if (!resetNewPassword || !resetNewKey || !resetNewSecurityAnswer) {
      setError('All fields are required.');
      setResetLoading(false);
      return;
    }
    try {
      const res = await axios.post('/api/admin/verify-reset-code', {
        email: resetEmail,
        code: resetCode,
        newPassword: resetNewPassword,
        newKey: resetNewKey,
        newSecurityQuestion: resetNewSecurityQuestion,
        newSecurityAnswer: resetNewSecurityAnswer
      });
      if (res.data.success) {
        setResetMessage('✅ Credentials updated successfully! You can now log in with your new password.');
        setTimeout(() => {
          setStep('password');
          setPassword('');
          setKey('');
          setSecurityAnswer('');
          setResetCode('');
          setResetNewPassword('');
          setResetNewKey('');
          setResetNewSecurityAnswer('');
          setResetMessage('');
        }, 3000);
      }
    } catch (error) {
      setError(error.response?.data?.error || 'Failed to reset credentials.');
    } finally {
      setResetLoading(false);
    }
  };

  // ===== RENDER STATES =====

  // If admin security not configured
  if (!isConfigured) {
    return (
      <ModalContainer darkMode={darkMode}>
        <div style={{ textAlign: 'center', padding: '10px 0' }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>🔐</div>
          <h2 style={{ color: headingColor, marginBottom: 12 }}>Admin Security Not Configured</h2>
          <p style={{ color: secondaryText, marginBottom: 20 }}>
            Please set up admin security in the admin panel settings.
          </p>
          <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
            <button
              onClick={() => {
                // Proceed directly to admin panel
                onSuccess();
              }}
              style={{
                background: '#ff9800',
                color: 'white',
                padding: '10px 24px',
                border: 'none',
                borderRadius: 8,
                cursor: 'pointer',
                fontWeight: 'bold'
              }}
            >
              Proceed to Admin Panel
            </button>
            <button
              onClick={onClose}
              style={{
                background: '#6c757d',
                color: 'white',
                padding: '10px 24px',
                border: 'none',
                borderRadius: 8,
                cursor: 'pointer'
              }}
            >
              Cancel
            </button>
          </div>
        </div>
      </ModalContainer>
    );
  }

  // Locked state
  if (step === 'locked') {
    return (
      <ModalContainer darkMode={darkMode}>
        <div style={{ textAlign: 'center', padding: '10px 0' }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>⏰</div>
          <h2 style={{ color: headingColor, marginBottom: 12 }}>Admin Access Locked</h2>
          <p style={{ color: secondaryText, marginBottom: 20 }}>
            {error || `Too many failed attempts. Try again in ${lockedUntil} minutes.`}
          </p>
          <button
            onClick={onClose}
            style={{
              background: '#6c757d',
              color: 'white',
              padding: '10px 24px',
              border: 'none',
              borderRadius: 8,
              cursor: 'pointer',
              fontWeight: 'bold'
            }}
          >
            Close
          </button>
        </div>
      </ModalContainer>
    );
  }

  // Reset request step
  if (step === 'reset-request') {
    return (
      <ModalContainer darkMode={darkMode}>
        <div style={{ textAlign: 'center', marginBottom: 24 }}>
          <div style={{ fontSize: 48, marginBottom: 12 }}>📧</div>
          <h2 style={{ color: headingColor }}>Reset Admin Credentials</h2>
          <p style={{ color: secondaryText, fontSize: 14 }}>A reset code will be sent to your admin email.</p>
        </div>

        {error && (
          <div style={{
            background: '#ffebee',
            padding: 12,
            borderRadius: 8,
            marginBottom: 16,
            textAlign: 'center'
          }}>
            <p style={{ color: '#c62828', margin: 0, fontSize: 13 }}>{error}</p>
          </div>
        )}
        {resetMessage && (
          <div style={{
            background: '#e8f5e9',
            padding: 12,
            borderRadius: 8,
            marginBottom: 16,
            textAlign: 'center'
          }}>
            <p style={{ color: '#2e7d32', margin: 0, fontSize: 13 }}>{resetMessage}</p>
          </div>
        )}

        <form onSubmit={handleSendResetCode}>
          <div style={{ marginBottom: 20 }}>
            <label style={{ display: 'block', marginBottom: 6, color: textColor, fontSize: 13, fontWeight: 500 }}>
              Admin Email
            </label>
            <input
              type="email"
              value={resetEmail}
              onChange={(e) => setResetEmail(e.target.value)}
              style={{
                width: '100%',
                padding: '12px 14px',
                border: '2px solid #e0e0e0',
                borderRadius: 10,
                fontSize: 14,
                outline: 'none',
                boxSizing: 'border-box'
              }}
              required
            />
          </div>
          <button
            type="submit"
            disabled={resetLoading}
            style={{
              width: '100%',
              background: '#1e3c72',
              color: 'white',
              padding: '12px',
              border: 'none',
              borderRadius: 10,
              cursor: 'pointer',
              fontWeight: 'bold',
              fontSize: 14,
              opacity: resetLoading ? 0.7 : 1
            }}
          >
            {resetLoading ? 'Sending...' : 'Send Reset Code'}
          </button>
        </form>

        <div style={{ marginTop: 16, textAlign: 'center' }}>
          <button
            onClick={() => setStep('password')}
            style={{
              background: 'none',
              border: 'none',
              color: headingColor,
              cursor: 'pointer',
              fontSize: 13,
              fontWeight: 'bold'
            }}
          >
            ← Back to Login
          </button>
        </div>
      </ModalContainer>
    );
  }

  // Reset verify step
  if (step === 'reset-verify') {
    return (
      <ModalContainer darkMode={darkMode}>
        <div style={{ textAlign: 'center', marginBottom: 24 }}>
          <div style={{ fontSize: 48, marginBottom: 12 }}>🔐</div>
          <h2 style={{ color: headingColor }}>Enter Reset Code</h2>
          <p style={{ color: secondaryText, fontSize: 14 }}>Enter the 6‑digit code sent to your email.</p>
        </div>

        {error && (
          <div style={{
            background: '#ffebee',
            padding: 12,
            borderRadius: 8,
            marginBottom: 16,
            textAlign: 'center'
          }}>
            <p style={{ color: '#c62828', margin: 0, fontSize: 13 }}>{error}</p>
          </div>
        )}
        {resetMessage && (
          <div style={{
            background: '#e8f5e9',
            padding: 12,
            borderRadius: 8,
            marginBottom: 16,
            textAlign: 'center'
          }}>
            <p style={{ color: '#2e7d32', margin: 0, fontSize: 13 }}>{resetMessage}</p>
          </div>
        )}

        <form onSubmit={handleVerifyReset}>
          <div style={{ marginBottom: 16 }}>
            <label style={{ display: 'block', marginBottom: 6, color: textColor, fontSize: 13, fontWeight: 500 }}>
              Reset Code
            </label>
            <input
              type="text"
              placeholder="6-digit code"
              value={resetCode}
              onChange={(e) => setResetCode(e.target.value)}
              style={{
                width: '100%',
                padding: '12px 14px',
                border: '2px solid #e0e0e0',
                borderRadius: 10,
                fontSize: 14,
                outline: 'none',
                boxSizing: 'border-box'
              }}
              required
              maxLength="6"
              pattern="\d{6}"
            />
          </div>
          <div style={{ marginBottom: 16 }}>
            <label style={{ display: 'block', marginBottom: 6, color: textColor, fontSize: 13, fontWeight: 500 }}>
              New Password
            </label>
            <input
              type="password"
              placeholder="New admin password"
              value={resetNewPassword}
              onChange={(e) => setResetNewPassword(e.target.value)}
              style={{
                width: '100%',
                padding: '12px 14px',
                border: '2px solid #e0e0e0',
                borderRadius: 10,
                fontSize: 14,
                outline: 'none',
                boxSizing: 'border-box'
              }}
              required
            />
          </div>
          <div style={{ marginBottom: 16 }}>
            <label style={{ display: 'block', marginBottom: 6, color: textColor, fontSize: 13, fontWeight: 500 }}>
              New Admin Key
            </label>
            <input
              type="password"
              placeholder="New admin key"
              value={resetNewKey}
              onChange={(e) => setResetNewKey(e.target.value)}
              style={{
                width: '100%',
                padding: '12px 14px',
                border: '2px solid #e0e0e0',
                borderRadius: 10,
                fontSize: 14,
                outline: 'none',
                boxSizing: 'border-box'
              }}
              required
            />
          </div>
          <div style={{ marginBottom: 16 }}>
            <label style={{ display: 'block', marginBottom: 6, color: textColor, fontSize: 13, fontWeight: 500 }}>
              Security Question
            </label>
            <input
              type="text"
              placeholder="e.g., What is your pet's name?"
              value={resetNewSecurityQuestion}
              onChange={(e) => setResetNewSecurityQuestion(e.target.value)}
              style={{
                width: '100%',
                padding: '12px 14px',
                border: '2px solid #e0e0e0',
                borderRadius: 10,
                fontSize: 14,
                outline: 'none',
                boxSizing: 'border-box'
              }}
              required
            />
          </div>
          <div style={{ marginBottom: 20 }}>
            <label style={{ display: 'block', marginBottom: 6, color: textColor, fontSize: 13, fontWeight: 500 }}>
              Security Answer
            </label>
            <input
              type="password"
              placeholder="Your answer"
              value={resetNewSecurityAnswer}
              onChange={(e) => setResetNewSecurityAnswer(e.target.value)}
              style={{
                width: '100%',
                padding: '12px 14px',
                border: '2px solid #e0e0e0',
                borderRadius: 10,
                fontSize: 14,
                outline: 'none',
                boxSizing: 'border-box'
              }}
              required
            />
          </div>
          <button
            type="submit"
            disabled={resetLoading}
            style={{
              width: '100%',
              background: '#28a745',
              color: 'white',
              padding: '12px',
              border: 'none',
              borderRadius: 10,
              cursor: 'pointer',
              fontWeight: 'bold',
              fontSize: 14,
              opacity: resetLoading ? 0.7 : 1
            }}
          >
            {resetLoading ? 'Resetting...' : 'Reset Credentials'}
          </button>
        </form>

        <div style={{ marginTop: 16, textAlign: 'center' }}>
          <button
            onClick={() => setStep('password')}
            style={{
              background: 'none',
              border: 'none',
              color: headingColor,
              cursor: 'pointer',
              fontSize: 13,
              fontWeight: 'bold'
            }}
          >
            ← Back to Login
          </button>
        </div>
      </ModalContainer>
    );
  }

  // Main login steps (password, key, security)
  return (
    <ModalContainer darkMode={darkMode}>
      <div style={{ textAlign: 'center', marginBottom: 24 }}>
        <div style={{ fontSize: 48, marginBottom: 12 }}>🔐</div>
        <h2 style={{ color: headingColor }}>Admin Verification</h2>
        <p style={{ color: secondaryText, fontSize: 14 }}>
          {step === 'password' && 'Enter your admin password'}
          {step === 'key' && 'Enter your admin key'}
          {step === 'security' && 'Answer your security question'}
        </p>
      </div>

      {error && (
        <div style={{
          background: '#ffebee',
          padding: 12,
          borderRadius: 8,
          marginBottom: 16,
          textAlign: 'center'
        }}>
          <p style={{ color: '#c62828', margin: 0, fontSize: 13 }}>{error}</p>
        </div>
      )}

      {step === 'password' && (
        <form onSubmit={handlePasswordSubmit}>
          <div style={{ marginBottom: 20 }}>
            <label style={{ display: 'block', marginBottom: 6, color: textColor, fontSize: 13, fontWeight: 500 }}>
              Admin Password
            </label>
            <input
              type="password"
              placeholder="Enter admin password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              style={{
                width: '100%',
                padding: '12px 14px',
                border: '2px solid #e0e0e0',
                borderRadius: 10,
                fontSize: 14,
                outline: 'none',
                boxSizing: 'border-box'
              }}
              required
              autoFocus
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            style={{
              width: '100%',
              background: '#1e3c72',
              color: 'white',
              padding: '12px',
              border: 'none',
              borderRadius: 10,
              cursor: 'pointer',
              fontWeight: 'bold',
              fontSize: 14,
              opacity: loading ? 0.7 : 1
            }}
          >
            {loading ? 'Verifying...' : 'Next'}
          </button>

          <div style={{ marginTop: 12, textAlign: 'center' }}>
            <button
              type="button"
              onClick={() => setStep('reset-request')}
              style={{
                background: 'none',
                border: 'none',
                color: '#1e3c72',
                cursor: 'pointer',
                fontSize: 13,
                textDecoration: 'underline'
              }}
            >
              Forgot password?
            </button>
          </div>
        </form>
      )}

      {step === 'key' && (
        <form onSubmit={handleKeySubmit}>
          <div style={{ marginBottom: 20 }}>
            <label style={{ display: 'block', marginBottom: 6, color: textColor, fontSize: 13, fontWeight: 500 }}>
              Admin Key
            </label>
            <input
              type="password"
              placeholder="Enter admin key"
              value={key}
              onChange={(e) => setKey(e.target.value)}
              style={{
                width: '100%',
                padding: '12px 14px',
                border: '2px solid #e0e0e0',
                borderRadius: 10,
                fontSize: 14,
                outline: 'none',
                boxSizing: 'border-box'
              }}
              required
              autoFocus
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            style={{
              width: '100%',
              background: '#1e3c72',
              color: 'white',
              padding: '12px',
              border: 'none',
              borderRadius: 10,
              cursor: 'pointer',
              fontWeight: 'bold',
              fontSize: 14,
              opacity: loading ? 0.7 : 1
            }}
          >
            {loading ? 'Verifying...' : 'Next'}
          </button>
        </form>
      )}

      {step === 'security' && (
        <form onSubmit={handleSecuritySubmit}>
          <div style={{ marginBottom: 16 }}>
            <label style={{ display: 'block', marginBottom: 6, color: textColor, fontSize: 13, fontWeight: 500 }}>
              Security Question
            </label>
            <p style={{
              padding: '12px 14px',
              background: darkMode ? '#2d2d3d' : '#f5f5f5',
              borderRadius: 10,
              fontSize: 14,
              color: textColor
            }}>
              {securityQuestion}
            </p>
          </div>
          <div style={{ marginBottom: 20 }}>
            <label style={{ display: 'block', marginBottom: 6, color: textColor, fontSize: 13, fontWeight: 500 }}>
              Your Answer
            </label>
            <input
              type="password"
              placeholder="Enter your answer"
              value={securityAnswer}
              onChange={(e) => setSecurityAnswer(e.target.value)}
              style={{
                width: '100%',
                padding: '12px 14px',
                border: '2px solid #e0e0e0',
                borderRadius: 10,
                fontSize: 14,
                outline: 'none',
                boxSizing: 'border-box'
              }}
              required
              autoFocus
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            style={{
              width: '100%',
              background: '#28a745',
              color: 'white',
              padding: '12px',
              border: 'none',
              borderRadius: 10,
              cursor: 'pointer',
              fontWeight: 'bold',
              fontSize: 14,
              opacity: loading ? 0.7 : 1
            }}
          >
            {loading ? 'Verifying...' : 'Access Admin Panel'}
          </button>
        </form>
      )}

      <div style={{ marginTop: 16, textAlign: 'center' }}>
        <button
          onClick={onClose}
          style={{
            background: 'none',
            border: 'none',
            color: secondaryText,
            cursor: 'pointer',
            fontSize: 13,
            textDecoration: 'underline'
          }}
        >
          Cancel
        </button>
      </div>
    </ModalContainer>
  );
};

// Helper modal container
const ModalContainer = ({ children, darkMode }) => (
  <div style={{
    position: 'fixed',
    top: 0, left: 0, right: 0, bottom: 0,
    background: 'rgba(0,0,0,0.7)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 2000,
    padding: 20
  }}>
    <div style={{
      background: getCardBg(darkMode),
      borderRadius: 20,
      padding: 32,
      maxWidth: 400,
      width: '100%',
      boxShadow: '0 8px 30px rgba(0,0,0,0.3)'
    }}>
      {children}
    </div>
  </div>
);