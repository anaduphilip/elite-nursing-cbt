// src/App.jsx
import React, { useState, useEffect, useContext } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import axios from 'axios';
import { Capacitor } from '@capacitor/core';
import { App as CapacitorApp } from '@capacitor/app';
import { initializeApp } from 'firebase/app';
import { getMessaging, getToken, onMessage } from 'firebase/messaging';
import { FirebaseMessaging } from '@capacitor-firebase/messaging';

import { AuthContext } from './context/AuthContext';
import { AlertProvider } from './context/AlertContext';
import { getHeadingColor, getSecondaryText, getTextColor, getCardBg } from './utils/theme';

// Import all components
import { Login } from './components/auth/Login';
import { Register } from './components/auth/Register';
import { ForgotPassword } from './components/auth/ForgotPassword';
import { HomePage } from './components/home/HomePage';
import { CourseList } from './components/courses/CourseList';
import { ExamList } from './components/exams/ExamList';
import { TakeExam } from './components/exams/TakeExam';
import { PremiumExam } from './components/exams/PremiumExam';
import { GetPremium } from './components/premium/GetPremium';
import { WeeklyQuiz } from './components/weekly/WeeklyQuiz';
import { WeeklyLeaderboard } from './components/weekly/WeeklyLeaderboard';
import { Profile } from './components/profile/Profile';
import { MyHistory } from './components/profile/MyHistory';
import { ReviewExam } from './components/profile/ReviewExam';
import { AdminPanel } from './components/admin/AdminPanel';
import { AboutUs } from './components/pages/AboutUs';
import { ContactUs } from './components/pages/ContactUs';
import { HowToUse } from './components/pages/HowToUse';
import { JoinWhatsApp } from './components/pages/JoinWhatsApp';
import { PrivacyPolicy } from './components/pages/PrivacyPolicy';
import { TermsAndConditions } from './components/pages/TermsAndConditions';
import { PaymentReturn } from './components/payment/PaymentReturn';
import { DropdownMenu } from './components/navigation/DropdownMenu';
import { FloatingChatButton } from './components/common/FloatingChatButton';
import { WeeklyQuizLanding } from './components/weekly/WeeklyQuizLanding';
import { LogoutModal } from './components/common/LogoutModal';
import { FAQ } from './components/pages/FAQ';
import { Maintenance } from './components/pages/Maintenance';

const API_URL = 'https://elite-nursing-cbt.onrender.com';
axios.defaults.baseURL = API_URL;

// Helper functions
const getTextColorHelper = (darkMode) => darkMode ? '#f0f7f4' : '#333';
const getSecondaryTextHelper = (darkMode) => darkMode ? '#aaa' : '#666';
const getHeadingColorHelper = (darkMode) => darkMode ? '#e0e0e0' : '#1e3c72';
const getBorderColorHelper = (darkMode) => darkMode ? '#444' : '#e0e0e0';
const getCardBgHelper = (darkMode) => darkMode ? '#2d2d3d' : 'white';

// Main App Content
const AppContent = () => {
  const { token, darkMode, user } = useContext(AuthContext);
  const headingColor = getHeadingColorHelper(darkMode);

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
          <Route path="/faq" element={<FAQ />} />
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
          <h1 style={{ color: headingColor, fontSize: 'clamp(16px, 4vw, 20px)', margin: 0 }}>ELITE NURSING & MIDWIFERY CBT</h1>
          <p style={{ margin: 0, fontSize: '10px', color: headingColor }}>Computer Based Testing Platform</p>
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
        <Route path="/profile" element={<Profile />} />
        <Route path="/review/:id" element={<ReviewExam />} />
        <Route path="/privacy" element={<PrivacyPolicy />} />
        <Route path="/terms" element={<TermsAndConditions />} />
        <Route path="/weekly-quiz" element={<WeeklyQuizLanding />} />
        <Route path="/weekly-quiz/take/:id" element={<WeeklyQuiz />} />
        <Route path="/weekly-leaderboard" element={<WeeklyLeaderboard />} />
        <Route path="/premium-exam/:categoryName/:topic/:examId/:mode" element={<PremiumExam />} />
        <Route path="/faq" element={<FAQ />} />
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
  const [showLogoutModal, setShowLogoutModal] = useState(false);

  // ========== Maintenance mode states ==========
  const [maintenance, setMaintenance] = useState(null);
  const [maintenanceLoading, setMaintenanceLoading] = useState(true);

  const headingColor = getHeadingColorHelper(darkMode);
  const secondaryText = getSecondaryTextHelper(darkMode);
  const textColor = getTextColorHelper(darkMode);
  const cardBg = getCardBgHelper(darkMode);

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

  const openLogoutModal = () => setShowLogoutModal(true);
  const closeLogoutModal = () => setShowLogoutModal(false);

  useEffect(() => {
    const interceptor = axios.interceptors.response.use(
      response => response,
      error => {
        if (error.response?.status === 401) {
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

  const toggleDarkMode = () => {
    setDarkMode(!darkMode);
    localStorage.setItem('darkMode', !darkMode);
  };

  // ========== Fetch maintenance config with polling ==========
  useEffect(() => {
    const fetchConfig = async () => {
      try {
        const res = await axios.get('/api/config');
        if (res.data.success) {
          setMaintenance(res.data.config);
        }
      } catch (error) {
        console.error('Failed to fetch config:', error);
      } finally {
        setMaintenanceLoading(false);
      }
    };

    // Initial fetch
    fetchConfig();

    // Poll every 30 seconds to check for maintenance mode changes
    const interval = setInterval(fetchConfig, 30000);

    return () => clearInterval(interval);
  }, []);

  const [notificationModal, setNotificationModal] = useState(null);

  const registerDeviceToken = async (token) => {
    if (!token || !auth.user?.id) return;
    try {
      const response = await axios.post('/api/register-token', { token, userId: auth.user.id });
      console.log('Token registered', response.data);
    } catch (error) {
      console.error('Token registration error:', error);
    }
  };

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
            setNotificationModal({ title: payload.notification.title, body: payload.notification.body });
          });
        }
      } catch (err) {
        console.error('Notification init error:', err);
      }
    })();
  };

  useEffect(() => {
    if (auth.user?.id) {
      initializeNotifications();
    }
  }, [auth.user?.id]);

  useEffect(() => {
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
            
            try {
              const profileRes = await axios.get('/api/user/profile', {
                headers: { Authorization: `Bearer ${auth.token}` }
              });
              const fullUser = profileRes.data;
              setAuth({ ...auth, user: fullUser });
              localStorage.setItem('auth', JSON.stringify({ token: auth.token, user: fullUser }));
            } catch (profileError) {
              const updatedUser = { ...auth.user, isPremium: true };
              setAuth({ ...auth, user: updatedUser });
              localStorage.setItem('auth', JSON.stringify({ ...auth, user: updatedUser }));
            }
            
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
              transactionId: transactionId,
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

  useEffect(() => {
    if (!auth.token) return;

    let isMounted = true;

    const refreshUserStatus = async () => {
      try {
        const response = await axios.get('/api/user/profile', {
          headers: { Authorization: `Bearer ${auth.token}` }
        });
        const freshUser = response.data;
        if (isMounted) {
          const currentUser = auth.user;
          const hasChanged = (
            currentUser?.isPremium !== freshUser.isPremium ||
            currentUser?.premiumPlan !== freshUser.premiumPlan ||
            currentUser?.premiumExpiry !== freshUser.premiumExpiry ||
            currentUser?.name !== freshUser.name ||
            currentUser?.isVerified !== freshUser.isVerified
          );
          if (hasChanged) {
            setAuth({ ...auth, user: freshUser });
            localStorage.setItem('auth', JSON.stringify({ token: auth.token, user: freshUser }));
            console.log('User profile synced (changed):', freshUser);
          }
        }
      } catch (error) {
        console.error('Failed to refresh user status:', error);
      }
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        refreshUserStatus();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('focus', refreshUserStatus);

    return () => {
      isMounted = false;
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('focus', refreshUserStatus);
    };
  }, [auth.token, auth.user?.isPremium, auth.user?.premiumExpiry]);

  // ========== MAINTENANCE MODE CHECK ==========
  // Show maintenance page if:
  // 1. Config is loaded
  // 2. Maintenance mode is enabled
  // 3. User is NOT admin (elitenursingcbt@gmail.com)
  // This check runs on every render, so it will reflect the latest state from polling.
  if (maintenanceLoading) {
    return <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh' }}>Loading...</div>;
  }

  if (maintenance?.maintenanceMode && auth.user?.email !== 'elitenursingcbt@gmail.com') {
    return <Maintenance message={maintenance.maintenanceMessage} />;
  }

  return (
    <AuthContext.Provider value={{ ...auth, login, logout, darkMode, toggleDarkMode, openLogoutModal }}>
      <AlertProvider>
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
              background: cardBg,
              borderRadius: 20,
              padding: 24,
              maxWidth: 320,
              textAlign: 'center',
              boxShadow: '0 4px 15px rgba(0,0,0,0.2)'
            }}>
              <div style={{ fontSize: 48, marginBottom: 12 }}>📢</div>
              <h3 style={{ color: headingColor, marginBottom: 8 }}>{notificationModal.title}</h3>
              <p style={{ color: secondaryText, marginBottom: 20 }}>{notificationModal.body}</p>
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
        <LogoutModal isOpen={showLogoutModal} onClose={closeLogoutModal} />
      </AlertProvider>
    </AuthContext.Provider>
  );
}

export default App;