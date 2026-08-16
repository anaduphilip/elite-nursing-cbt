// src/components/auth/Register.jsx
import React, { useState, useEffect, useContext } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { AuthContext } from '../../context/AuthContext';
import { getHeadingColor, getSecondaryText, getTextColor, getCardBg } from '../../utils/theme';
import { LoadingWithBar } from '../common/LoadingWithBar';

export const Register = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [step, setStep] = useState('form');
  const [otp, setOtp] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [resendTimer, setResendTimer] = useState(0);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [agreeChecked, setAgreeChecked] = useState(false);
  const [marketingConsent, setMarketingConsent] = useState(false);
  const [referralCode, setReferralCode] = useState('');
  const [errorDetails, setErrorDetails] = useState(null);
  const [countdown, setCountdown] = useState('');
  const [attemptsRemaining, setAttemptsRemaining] = useState(null);

  const { login } = useContext(AuthContext);
  const { darkMode } = useContext(AuthContext);
  const headingColor = getHeadingColor(darkMode);
  const secondaryText = getSecondaryText(darkMode);
  const textColor = getTextColor(darkMode);
  const cardBg = getCardBg(darkMode);

  useEffect(() => {
    let interval;
    if (errorDetails?.locked && errorDetails.remainingSeconds > 0) {
      let remaining = errorDetails.remainingSeconds;
      const updateCountdown = () => {
        if (remaining <= 0) {
          clearInterval(interval);
          setErrorDetails(null);
          setError('');
          setCountdown('');
          return;
        }
        const days = Math.floor(remaining / 86400);
        const hours = Math.floor((remaining % 86400) / 3600);
        const minutes = Math.floor((remaining % 3600) / 60);
        const seconds = Math.floor(remaining % 60);
        const parts = [];
        if (days > 0) parts.push(`${days}d`);
        if (hours > 0) parts.push(`${hours}h`);
        if (minutes > 0) parts.push(`${minutes}m`);
        if (seconds > 0 || parts.length === 0) parts.push(`${seconds}s`);
        setCountdown(parts.join(' '));
        remaining--;
      };
      updateCountdown();
      interval = setInterval(updateCountdown, 1000);
    } else {
      setCountdown('');
    }
    return () => clearInterval(interval);
  }, [errorDetails]);

  useEffect(() => {
    let timer;
    if (resendTimer > 0) {
      timer = setTimeout(() => setResendTimer(resendTimer - 1), 1000);
    }
    return () => clearTimeout(timer);
  }, [resendTimer]);

  const handleSendVerification = async (e) => {
    e.preventDefault();
    setError('');
    setErrorDetails(null);
    setCountdown('');
    setAttemptsRemaining(null);

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    if (!name.trim()) {
      setError('Please enter your full name');
      return;
    }
    if (!agreeChecked) {
      setError('You must agree to the Terms and Privacy Policy');
      return;
    }

    setIsLoading(true);
    try {
      const res = await axios.post('/api/send-verification', { email, name });
      setMessage(res.data.message);
      setStep('verify');
      setResendTimer(60);
      if (res.data.attemptsRemaining !== undefined) {
        setAttemptsRemaining(res.data.attemptsRemaining);
      }
    } catch (error) {
      const status = error.response?.status;
      const data = error.response?.data || {};
      const errorMsg = data.error || error.message;
      console.log('Send verification error:', status, data);

      if (data.locked === true) {
        setErrorDetails({
          locked: true,
          remainingSeconds: data.remainingSeconds || 0,
        });
        setError(errorMsg);
      } else {
        setError(`❌ ${errorMsg}`);
      }
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
      
      const regRes = await axios.post('/api/register', {
        name,
        email,
        password,
        marketingConsent
      });

      if (regRes.data.success) {
        setMessage('Registration successful! Redirecting...');

        if (referralCode.trim()) {
          try {
            const userId = regRes.data.user.id;
            await axios.post('/api/referral/apply', {
              referralCode: referralCode.trim(),
              newUserId: userId
            });
            console.log('✅ Referral applied successfully!');
            setMessage(prev => prev + ' 🎉 Referral bonus applied!');
          } catch (refErr) {
            console.error('❌ Failed to apply referral:', refErr.response?.data?.error || refErr.message);
          }
        }

        setTimeout(() => {
          login(regRes.data.token, regRes.data.user);
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
      if (res.data.attemptsRemaining !== undefined) {
        setAttemptsRemaining(res.data.attemptsRemaining);
      }
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
      <div style={{ maxWidth: 450, width: '100%', background: cardBg, borderRadius: 24, padding: '32px', boxShadow: '0 20px 40px rgba(0,0,0,0.2)' }}>
        <div style={{ textAlign: 'center', marginBottom: 24 }}>
          <div style={{ fontSize: 48, marginBottom: 12 }}>🎓</div>
          <h1 style={{ color: headingColor, fontSize: 20, margin: 0, fontWeight: 'bold' }}>ELITE NURSING &</h1>
          <h1 style={{ color: headingColor, fontSize: 20, margin: 0, fontWeight: 'bold' }}>MIDWIFERY CBT</h1>
          <p style={{ color: secondaryText, fontSize: 12, marginTop: 6 }}>Computer Based Testing Platform</p>
        </div>
        
        {step === 'form' ? (
          <>
            <div style={{ textAlign: 'center', marginBottom: 20 }}>
              <h2 style={{ color: textColor, fontSize: 18, marginBottom: 4 }}>Create Account</h2>
              <p style={{ color: '#888', fontSize: 12 }}>Sign up to begin your journey</p>
            </div>

            {error && (
              <div style={{
                background: '#ffebee',
                padding: '12px 16px',
                borderRadius: 10,
                marginBottom: 16,
                border: '1px solid #ef5350'
              }}>
                <p style={{ color: '#c62828', margin: 0, fontSize: 14, whiteSpace: 'pre-wrap' }}>
                  {error}
                  {errorDetails?.locked && countdown && (
                    <span style={{ display: 'block', fontWeight: 'bold', marginTop: 4 }}>
                      ⏳ {countdown}
                    </span>
                  )}
                </p>
                {errorDetails?.locked && (
                  <div style={{ marginTop: 8 }}>
                    <a
                      href="https://wa.me/2349063908476?text=Hello%2C%20I%20am%20unable%20to%20register.%20Please%20help."
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{
                        display: 'inline-block',
                        background: '#25D366',
                        color: 'white',
                        padding: '6px 16px',
                        borderRadius: 20,
                        textDecoration: 'none',
                        fontWeight: 'bold',
                        fontSize: 13
                      }}
                    >
                      Contact Support
                    </a>
                  </div>
                )}
                {!errorDetails?.locked && attemptsRemaining !== null && attemptsRemaining <= 2 && (
                  <p style={{ color: '#856404', fontSize: 13, marginTop: 6 }}>
                    ⚠️ You have {attemptsRemaining} {attemptsRemaining === 1 ? 'attempt' : 'attempts'} remaining before lock.
                  </p>
                )}
              </div>
            )}

            <form onSubmit={handleSendVerification}>
              <div style={{ marginBottom: 16 }}>
                <label style={{ display: 'block', marginBottom: 6, color: textColor, fontSize: 13, fontWeight: 500 }}>Full Name</label>
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

              <div style={{ marginBottom: 16 }}>
                <label style={{ display: 'block', marginBottom: 6, color: textColor, fontSize: 13, fontWeight: 500 }}>Password</label>
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

              <div style={{ marginBottom: 20 }}>
                <label style={{ display: 'block', marginBottom: 6, color: textColor, fontSize: 13, fontWeight: 500 }}>Confirm Password</label>
                <div style={{ position: 'relative' }}>
                  <input 
                    type={showConfirmPassword ? 'text' : 'password'}
                    placeholder="Confirm your password" 
                    value={confirmPassword} 
                    onChange={(e) => setConfirmPassword(e.target.value)} 
                    style={{ width: '100%', padding: '12px 14px', paddingRight: '45px', border: '2px solid #e0e0e0', borderRadius: 10, fontSize: 14, outline: 'none', boxSizing: 'border-box' }}
                    onFocus={(e) => e.target.style.borderColor = '#1e3c72'}
                    onBlur={(e) => e.target.style.borderColor = '#e0e0e0'}
                    required 
                    minLength="6"
                  />
                  <button type="button" onClick={() => setShowConfirmPassword(!showConfirmPassword)} style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', fontSize: 18, color: '#888' }}>{showConfirmPassword ? '🙈' : '👁️'}</button>
                </div>
              </div>

              {/* Referral Code Input */}
              <div style={{ marginBottom: 16 }}>
                <label style={{ display: 'block', marginBottom: 6, color: textColor, fontSize: 13, fontWeight: 500 }}>
                  Referral Code (optional)
                </label>
                <input 
                  type="text" 
                  placeholder="Enter referral code (e.g., ELITE-XXXX1234)" 
                  value={referralCode} 
                  onChange={(e) => setReferralCode(e.target.value)} 
                  style={{ width: '100%', padding: '12px 14px', border: '2px solid #e0e0e0', borderRadius: 10, fontSize: 14, outline: 'none', boxSizing: 'border-box' }}
                  onFocus={(e) => e.target.style.borderColor = '#ff9800'}
                  onBlur={(e) => e.target.style.borderColor = '#e0e0e0'}
                />
                <small style={{ color: secondaryText, fontSize: 11 }}>
                  Have a referral code? Enter it here to get a bonus!
                </small>
              </div>

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

              {/* Marketing Consent Checkbox */}
              <div style={{ marginBottom: 20, display: 'flex', alignItems: 'flex-start', gap: 8 }}>
                <input
                  type="checkbox"
                  id="marketingConsent"
                  checked={marketingConsent}
                  onChange={(e) => setMarketingConsent(e.target.checked)}
                  style={{ marginTop: 3, cursor: 'pointer' }}
                />
                <label htmlFor="marketingConsent" style={{ fontSize: 13, color: '#555', cursor: 'pointer' }}>
                  I agree to receive occasional promotional emails about new features and premium offers.
                </label>
              </div>

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
              <Link to="/login" style={{ color: headingColor, fontSize: 13, textDecoration: 'none' }}>
                ← Back to Login
              </Link>
            </div>
          </>
        ) : (
          // ===== OTP VERIFICATION STEP =====
          <>
            <div style={{ textAlign: 'center', marginBottom: 20 }}>
              <h2 style={{ color: textColor, fontSize: 18, marginBottom: 4 }}>Verify Your Email</h2>
              <p style={{ color: '#888', fontSize: 12 }}>Enter the 6-digit code sent to {email}</p>
            </div>

            {message && (
              <div style={{ background: darkMode ? '#2d2d3d' : '#e8f5e9', padding: '12px', borderRadius: 10, marginBottom: 16, textAlign: 'center' }}>
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
              <p style={{ color: secondaryText, fontSize: 13 }}>
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
              <Link to="/login" style={{ color: headingColor, fontSize: 13, textDecoration: 'none', display: 'inline-block', marginTop: 10 }}>
                ← Back to Login
              </Link>
            </div>
          </>
        )}
        
        <div style={{ marginTop: 24, paddingTop: 16, borderTop: '1px solid #eee', textAlign: 'center' }}>
          <p style={{ fontSize: 11, color: secondaryText }}>© 2026 ELITE Nursing & Midwifery CBT</p>
          <p style={{ fontSize: 11, color: secondaryText }}>Over 20,000+ practice questions</p>
        </div>
      </div>
    </div>
  );
};