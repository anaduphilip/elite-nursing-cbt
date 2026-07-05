// src/components/payment/PaymentReturn.jsx
import React, { useState, useEffect, useContext } from 'react';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { AuthContext } from '../../context/AuthContext';
import { getHeadingColor, getSecondaryText, getTextColor, getCardBg } from '../../utils/theme';

export const PaymentReturn = () => {
  const { token, user, login } = useContext(AuthContext);
  const { darkMode } = useContext(AuthContext);
  const headingColor = getHeadingColor(darkMode);
  const secondaryText = getSecondaryText(darkMode);
  const textColor = getTextColor(darkMode);
  const cardBg = getCardBg(darkMode);
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
          transactionId: transaction_id,
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
          
          try {
            const profileRes = await axios.get('/api/user/profile', {
              headers: { Authorization: `Bearer ${currentToken}` }
            });
            const fullUser = profileRes.data;
            localStorage.setItem('auth', JSON.stringify({ token: currentToken, user: fullUser }));
            if (login && currentToken) {
              login(currentToken, fullUser);
            }
          } catch (profileError) {
            const updatedUser = { ...currentUser, isPremium: true };
            localStorage.setItem('auth', JSON.stringify({ token: currentToken, user: updatedUser }));
            if (login && currentToken) {
              login(currentToken, updatedUser);
            }
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
    setTimeout(() => {}, 100);
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
      <p style={{ fontSize: 13, color: secondaryText, marginTop: 12 }}>Attempt {retryCount + 1}/20 - Please wait...</p>
    </div>
  );

  return (
    <div style={{ minHeight: '100vh', background: darkMode ? '#1a1a2e' : '#f0f7f4', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
      <div style={{ background: cardBg, borderRadius: 20, padding: 40, textAlign: 'center', maxWidth: 450, boxShadow: '0 4px 15px rgba(0,0,0,0.1)' }}>
        {status === 'verifying' && (
          <>
            <div style={{ fontSize: 52, marginBottom: 20 }}>⏳</div>
            <h2 style={{ color: headingColor }}>Verifying Payment...</h2>
            <p style={{ color: secondaryText, marginTop: 8 }}>Please wait while we confirm your Flutterwave payment.</p>
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
              <p style={{ fontSize: 12, color: secondaryText }}>Contact support on WhatsApp: <strong style={{ color: '#25D366' }}>09063908476</strong></p>
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