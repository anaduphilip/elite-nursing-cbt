// src/components/home/HomePage.jsx
import React, { useState, useEffect, useContext } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { AuthContext } from '../../context/AuthContext';
import { getHeadingColor, getSecondaryText } from '../../utils/theme';
import { LoadingWithBar } from '../common/LoadingWithBar';
import { ProgressSnapshot } from './ProgressSnapshot';
import { getCachedCategories, getCachedQuizzes } from '../../utils/quizHelpers';

export const HomePage = () => {
  const [loading, setLoading] = useState(false);
  const { darkMode, user, login, token } = useContext(AuthContext);
  const headingColor = getHeadingColor(darkMode);
  const secondaryText = getSecondaryText(darkMode);
  const navigate = useNavigate();

  // ---- TOGGLES FOR EXPANDABLE SECTIONS ----
  const [showProgress, setShowProgress] = useState(false);

  // ---- HOME PAGE VISIBILITY CONFIG ----
  const [config, setConfig] = useState({
    showFreeMode: true,
    showPremiumMode: true,
    showStudyMode: true,
    showProgressSnapshot: true,
    showDownloadApp: true,
    showWeeklyQuiz: true,
    showGetPremium: true
  });
  const [configLoading, setConfigLoading] = useState(true);

  // ---- ANNOUNCEMENT BANNER STATE ----
  const [announcement, setAnnouncement] = useState(null);
  const [showBanner, setShowBanner] = useState(false);
  const [dismissedVersion, setDismissedVersion] = useState(() => {
    return localStorage.getItem('announcementDismissed') || '0';
  });

  // ---- MARKETING CONSENT BANNER STATE ----
  const [consentBanner, setConsentBanner] = useState(null);
  const [showConsentBanner, setShowConsentBanner] = useState(false);
  const [consentDismissedVersion, setConsentDismissedVersion] = useState(() => {
    return localStorage.getItem('consentBannerDismissed') || '0';
  });

  // ===== LIMITED TIME OFFER STATE =====
  const [offer, setOffer] = useState(null);
  const [showOffer, setShowOffer] = useState(false);
  const [offerDismissed, setOfferDismissed] = useState(false);
  const [offerTimeLeft, setOfferTimeLeft] = useState(null);

  // ===== PRIVATE MESSAGE STATE (NEW) =====
  const [privateMessages, setPrivateMessages] = useState([]);
  const [showPrivateMessage, setShowPrivateMessage] = useState(false);
  const [currentPrivateMessage, setCurrentPrivateMessage] = useState(null);
  const [privateMessageDismissed, setPrivateMessageDismissed] = useState({});

  // ---- FETCH CONFIG (includes home page visibility toggles) ----
  useEffect(() => {
    const fetchConfig = async () => {
      try {
        const res = await axios.get('/api/config');
        if (res.data.success && res.data.config) {
          setConfig({
            showFreeMode: res.data.config.showFreeMode !== undefined ? res.data.config.showFreeMode : true,
            showPremiumMode: res.data.config.showPremiumMode !== undefined ? res.data.config.showPremiumMode : true,
            showStudyMode: res.data.config.showStudyMode !== undefined ? res.data.config.showStudyMode : true,
            showProgressSnapshot: res.data.config.showProgressSnapshot !== undefined ? res.data.config.showProgressSnapshot : true,
            showDownloadApp: res.data.config.showDownloadApp !== undefined ? res.data.config.showDownloadApp : true,
            showWeeklyQuiz: res.data.config.showWeeklyQuiz !== undefined ? res.data.config.showWeeklyQuiz : true,
            showGetPremium: res.data.config.showGetPremium !== undefined ? res.data.config.showGetPremium : true
          });
        }
      } catch (error) {
        console.error('Failed to fetch config:', error);
      } finally {
        setConfigLoading(false);
      }
    };
    fetchConfig();
  }, []);

  // ---- FETCH ANNOUNCEMENT ----
  useEffect(() => {
    const fetchAnnouncement = async () => {
      try {
        const res = await axios.get('/api/announcement');
        if (res.data.success && res.data.announcement) {
          const ann = res.data.announcement;
          setAnnouncement(ann);
          if (ann.active && parseInt(dismissedVersion) !== ann.version) {
            setShowBanner(true);
          } else {
            setShowBanner(false);
          }
        }
      } catch (error) {
        console.error('Failed to fetch announcement:', error);
      }
    };
    fetchAnnouncement();
  }, [dismissedVersion]);

  // ---- FETCH MARKETING CONSENT BANNER ----
  useEffect(() => {
    const fetchConsentBanner = async () => {
      try {
        const res = await axios.get('/api/marketing-consent');
        if (res.data.success && res.data.consent) {
          const banner = res.data.consent;
          setConsentBanner(banner);
          if (banner.active && !user?.marketingConsent && parseInt(consentDismissedVersion) !== banner.version) {
            setShowConsentBanner(true);
          } else {
            setShowConsentBanner(false);
          }
        }
      } catch (error) {
        console.error('Failed to fetch consent banner:', error);
      }
    };
    fetchConsentBanner();
  }, [user?.marketingConsent, consentDismissedVersion]);

  // ===== FETCH LIMITED TIME OFFER =====
  useEffect(() => {
    const fetchOffer = async () => {
      try {
        const res = await axios.get('/api/config');
        if (res.data.success && res.data.config?.limitedOffer) {
          const offerData = res.data.config.limitedOffer;
          setOffer(offerData);
          
          if (offerData.isActive && offerData.discountPercent > 0) {
            let userQualifies = true;
            const target = offerData.targetAudience || 'free';
            if (target === 'free' && user?.isPremium) {
              userQualifies = false;
            } else if (target === 'premium' && !user?.isPremium) {
              userQualifies = false;
            }
            const dismissed = localStorage.getItem('offerDismissed');
            if (userQualifies && dismissed !== String(offerData.version || '1')) {
              setShowOffer(true);
            } else {
              setShowOffer(false);
            }
          } else {
            setShowOffer(false);
          }
        }
      } catch (error) {
        console.error('Failed to fetch limited offer:', error);
      }
    };
    fetchOffer();
  }, [user?.isPremium]);

  // ===== COUNTDOWN TIMER FOR OFFER =====
  useEffect(() => {
    if (!showOffer || !offer?.endDate) {
      setOfferTimeLeft(null);
      return;
    }

    const updateTimer = () => {
      const now = new Date();
      const end = new Date(offer.endDate);
      const diff = end - now;

      if (diff <= 0) {
        setOfferTimeLeft(null);
        setShowOffer(false);
        return;
      }

      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);

      setOfferTimeLeft({ days, hours, minutes, seconds });
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, [showOffer, offer?.endDate]);

  // ===== FETCH PRIVATE MESSAGES (NEW) =====
  useEffect(() => {
    const fetchPrivateMessages = async () => {
      if (!token) return;
      try {
        const res = await axios.get('/api/private-messages', {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (res.data.success && res.data.messages.length > 0) {
          // Get only unread messages
          const unread = res.data.messages.filter(m => !m.isRead);
          setPrivateMessages(unread);
          
          // Show the first unread message if any
          if (unread.length > 0) {
            // Check if this message was already dismissed in this session
            const dismissed = localStorage.getItem(`privateMsg_${unread[0]._id}`);
            if (!dismissed) {
              setCurrentPrivateMessage(unread[0]);
              setShowPrivateMessage(true);
            }
          }
        }
      } catch (error) {
        console.error('Failed to fetch private messages:', error);
      }
    };
    fetchPrivateMessages();
  }, [token]);

  // ===== PRELOAD CATEGORIES & QUIZZES =====
  useEffect(() => {
    if (!token) return;
    const preloadData = async () => {
      try {
        await Promise.all([
          getCachedCategories(),
          getCachedQuizzes(token)
        ]);
        console.log('📚 Preloaded categories and quizzes');
      } catch (error) {
        console.error('Failed to preload data:', error);
      }
    };
    preloadData();
  }, [token]);

  // ===== MARK PRIVATE MESSAGE AS READ =====
  const dismissPrivateMessage = async (messageId) => {
    try {
      await axios.put(
        `/api/private-messages/${messageId}/read`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      localStorage.setItem(`privateMsg_${messageId}`, 'dismissed');
      setShowPrivateMessage(false);
      setCurrentPrivateMessage(null);
      
      // Remove from list
      setPrivateMessages(prev => prev.filter(m => m._id !== messageId));
    } catch (error) {
      console.error('Failed to dismiss message:', error);
      // Still hide it locally
      localStorage.setItem(`privateMsg_${messageId}`, 'dismissed');
      setShowPrivateMessage(false);
      setCurrentPrivateMessage(null);
    }
  };

  const handlePrivateMessageAction = (message) => {
    if (message.buttonLink) {
      navigate(message.buttonLink);
    }
    dismissPrivateMessage(message._id);
  };

  if (loading || configLoading) {
    return <LoadingWithBar message="Loading..." />;
  }

  const isUserPremium = user?.isPremium && user?.premiumExpiry && new Date(user.premiumExpiry) > new Date();

  // ---- UNIFORM BUTTON STYLE ----
  const buttonStyle = {
    padding: '12px 32px',
    fontSize: 'clamp(16px, 4vw, 18px)',
    fontWeight: 'bold',
    background: 'linear-gradient(135deg, #1e3c72 0%, #2a5298 100%)',
    color: 'white',
    border: 'none',
    borderRadius: '50px',
    cursor: 'pointer',
    minWidth: '200px'
  };

  // ---- GET PREMIUM BUTTON STYLE (gold/orange) ----
  const premiumButtonStyle = {
    padding: '12px 32px',
    fontSize: 'clamp(16px, 4vw, 18px)',
    fontWeight: 'bold',
    background: 'linear-gradient(135deg, #ff9800 0%, #e65100 100%)',
    color: 'white',
    border: 'none',
    borderRadius: '50px',
    cursor: 'pointer',
    minWidth: '200px'
  };

  // ---- Build the button array based on config ----
  const renderModeButtons = () => {
    const buttons = [];

    if (config.showFreeMode) {
      buttons.push(
        <button
          key="free"
          onClick={() => navigate('/free-mode')}
          style={buttonStyle}
        >
          🆓 FREE MODE
        </button>
      );
    }

    if (config.showPremiumMode) {
      buttons.push(
        <button
          key="premium"
          onClick={() => navigate('/premium-mode')}
          style={buttonStyle}
        >
          ⭐ PREMIUM MODE
        </button>
      );
    }

    if (config.showStudyMode) {
      buttons.push(
        <button
          key="study"
          onClick={() => navigate('/study-mode')}
          style={buttonStyle}
        >
          📖 STUDY MODE
        </button>
      );
    }

    if (config.showWeeklyQuiz) {
      buttons.push(
        <button
          key="weekly"
          onClick={() => navigate('/weekly-quiz')}
          style={buttonStyle}
        >
          📅 WEEKLY QUIZ
        </button>
      );
    }

    if (config.showGetPremium) {
      buttons.push(
        <button
          key="get-premium"
          onClick={() => navigate('/get-premium')}
          style={premiumButtonStyle}
        >
          {isUserPremium ? '⭐ PREMIUM ACTIVE' : '⭐ GET PREMIUM'}
        </button>
      );
    }

    return buttons;
  };

  return (
    <div style={{ background: darkMode ? '#1a1a2e' : '#f0f7f4', minHeight: '100vh', padding: '20px' }}>
      <div style={{ maxWidth: 1200, margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: 24 }}>
          <h1 style={{ color: headingColor, fontSize: 'clamp(24px, 5vw, 36px)', marginBottom: 8 }}>ELITE NURSING & MIDWIFERY CBT</h1>
          <p style={{ color: darkMode ? '#aaa' : '#666', fontSize: 'clamp(14px, 4vw, 16px)' }}>Computer Based Testing Platform</p>
        </div>

        {/* ===== PRIVATE MESSAGE BANNER (NEW) ===== */}
        {showPrivateMessage && currentPrivateMessage && (
          <div style={{
            background: darkMode ? '#2d2d3d' : '#e8f5e9',
            borderRadius: 12,
            padding: '16px 24px',
            marginBottom: 24,
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: 16,
            border: `2px solid ${darkMode ? '#4caf50' : '#2e7d32'}`,
            boxShadow: '0 2px 12px rgba(46, 125, 50, 0.15)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <span style={{ fontSize: 24 }}>📩</span>
              <div>
                <span style={{ color: darkMode ? '#eee' : '#333', fontSize: 15 }}>
                  <strong>Admin Note:</strong> {currentPrivateMessage.message}
                </span>
              </div>
            </div>
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
              {currentPrivateMessage.buttonLink && (
                <button
                  onClick={() => handlePrivateMessageAction(currentPrivateMessage)}
                  style={{
                    background: '#2e7d32',
                    color: 'white',
                    padding: '8px 24px',
                    border: 'none',
                    borderRadius: 30,
                    cursor: 'pointer',
                    fontWeight: 'bold'
                  }}
                >
                  {currentPrivateMessage.buttonText || 'Learn More'}
                </button>
              )}
              <button
                onClick={() => dismissPrivateMessage(currentPrivateMessage._id)}
                style={{
                  background: 'transparent',
                  color: secondaryText,
                  border: '1px solid ' + secondaryText,
                  padding: '8px 20px',
                  borderRadius: 30,
                  cursor: 'pointer'
                }}
              >
                Dismiss
              </button>
            </div>
          </div>
        )}

        {/* ---- ANNOUNCEMENT BANNER ---- */}
        {showBanner && announcement && (
          <div style={{
            background: darkMode ? '#2d2d3d' : '#fff3e0',
            borderRadius: 12,
            padding: '16px 24px',
            marginBottom: 24,
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: 16,
            border: `1px solid ${darkMode ? '#444' : '#ffcc80'}`
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <span style={{ fontSize: 24 }}>📢</span>
              <span style={{ color: darkMode ? '#eee' : '#333' }}>{announcement.message}</span>
            </div>
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
              <button
                onClick={() => {
                  navigate(announcement.buttonLink);
                  localStorage.setItem('announcementDismissed', announcement.version);
                  setShowBanner(false);
                }}
                style={{
                  background: '#ff9800',
                  color: 'white',
                  padding: '8px 24px',
                  border: 'none',
                  borderRadius: 30,
                  cursor: 'pointer',
                  fontWeight: 'bold'
                }}
              >
                {announcement.buttonText}
              </button>
              <button
                onClick={() => {
                  localStorage.setItem('announcementDismissed', announcement.version);
                  setShowBanner(false);
                }}
                style={{
                  background: 'transparent',
                  color: secondaryText,
                  border: '1px solid ' + secondaryText,
                  padding: '8px 20px',
                  borderRadius: 30,
                  cursor: 'pointer'
                }}
              >
                Dismiss
              </button>
            </div>
          </div>
        )}

        {/* ---- MARKETING CONSENT BANNER ---- */}
        {showConsentBanner && consentBanner && (
          <div style={{
            background: darkMode ? '#2d2d3d' : '#e3f2fd',
            borderRadius: 12,
            padding: '16px 24px',
            marginBottom: 24,
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: 16,
            border: `1px solid ${darkMode ? '#444' : '#90caf9'}`
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <span style={{ fontSize: 24 }}>📬</span>
              <span style={{ color: darkMode ? '#eee' : '#333' }}>{consentBanner.message}</span>
            </div>
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
              <button
                onClick={async () => {
                  try {
                    const res = await axios.put('/api/user/marketing-consent',
                      { consent: true },
                      { headers: { Authorization: `Bearer ${token}` } }
                    );
                    if (res.data.success) {
                      const updatedUser = { ...user, marketingConsent: true };
                      login(token, updatedUser);
                      setShowConsentBanner(false);
                      localStorage.setItem('consentBannerDismissed', consentBanner.version);
                      alert('✅ You are now opted in for promotional emails!');
                    }
                  } catch (err) {
                    alert('Failed to update preference. Please try again later.');
                  }
                }}
                style={{
                  background: '#1e3c72',
                  color: 'white',
                  padding: '8px 24px',
                  border: 'none',
                  borderRadius: 30,
                  cursor: 'pointer',
                  fontWeight: 'bold'
                }}
              >
                {consentBanner.buttonText || 'Yes, Opt me in!'}
              </button>
              <button
                onClick={() => {
                  localStorage.setItem('consentBannerDismissed', consentBanner.version);
                  setShowConsentBanner(false);
                }}
                style={{
                  background: 'transparent',
                  color: secondaryText,
                  border: '1px solid ' + secondaryText,
                  padding: '8px 20px',
                  borderRadius: 30,
                  cursor: 'pointer'
                }}
              >
                No thanks
              </button>
            </div>
          </div>
        )}

        {/* ===== LIMITED TIME OFFER BANNER ===== */}
        {showOffer && offer && offerTimeLeft && (
          <div style={{
            background: darkMode ? '#2d2d3d' : '#fff3e0',
            borderRadius: 12,
            padding: '16px 24px',
            marginBottom: 24,
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: 16,
            border: `2px solid #ff9800`,
            boxShadow: '0 2px 12px rgba(255, 152, 0, 0.2)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
              <span style={{ fontSize: 28 }}>🔥</span>
              <div>
                <span style={{ color: darkMode ? '#eee' : '#333', fontSize: 15, fontWeight: 'bold' }}>
                  {offer.message || `🔥 ${offer.discountPercent}% OFF!`}
                </span>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 4 }}>
                  <span style={{ color: '#e65100', fontSize: 13, fontWeight: 'bold' }}>
                    ⏰ {offerTimeLeft.days > 0 && `${offerTimeLeft.days}d `}
                    {String(offerTimeLeft.hours).padStart(2, '0')}h 
                    {String(offerTimeLeft.minutes).padStart(2, '0')}m 
                    {String(offerTimeLeft.seconds).padStart(2, '0')}s
                  </span>
                  <span style={{ color: '#ff9800', fontSize: 12, fontWeight: 'bold', background: '#fff3e0', padding: '2px 10px', borderRadius: 20 }}>
                    {offer.discountPercent}% OFF
                  </span>
                </div>
              </div>
            </div>
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
              <button
                onClick={() => {
                  navigate(offer.buttonLink || '/get-premium');
                  localStorage.setItem('offerDismissed', offer.version || '1');
                  setShowOffer(false);
                }}
                style={{
                  background: '#ff9800',
                  color: 'white',
                  padding: '8px 24px',
                  border: 'none',
                  borderRadius: 30,
                  cursor: 'pointer',
                  fontWeight: 'bold',
                  boxShadow: '0 2px 8px rgba(255, 152, 0, 0.3)'
                }}
              >
                {offer.buttonText || 'Claim Offer →'}
              </button>
              <button
                onClick={() => {
                  localStorage.setItem('offerDismissed', offer.version || '1');
                  setShowOffer(false);
                }}
                style={{
                  background: 'transparent',
                  color: secondaryText,
                  border: '1px solid ' + secondaryText,
                  padding: '8px 20px',
                  borderRadius: 30,
                  cursor: 'pointer'
                }}
              >
                Dismiss
              </button>
            </div>
          </div>
        )}

        {/* ===== MODE SELECTION ===== */}
        <div style={{ textAlign: 'center', padding: '20px 0' }}>
          <p style={{ color: secondaryText, fontSize: 'clamp(14px, 4vw, 16px)', marginBottom: 24 }}>
            Select a mode to start your nursing exam preparation
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
            {renderModeButtons()}
          </div>
        </div>

        {/* ===== PROGRESS SNAPSHOT (EXPANDABLE) ===== */}
        {config.showProgressSnapshot && (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginTop: 16 }}>
            <button
              onClick={() => setShowProgress(!showProgress)}
              style={buttonStyle}
            >
              {showProgress ? '📊 Hide Progress' : '📊 View Progress'}
            </button>
            {showProgress && (
              <div style={{ marginTop: 12, width: '100%', maxWidth: '600px' }}>
                <ProgressSnapshot />
              </div>
            )}
          </div>
        )}

        {/* ===== DOWNLOAD APP (DIRECT ACTION) ===== */}
        {config.showDownloadApp && (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginTop: 16 }}>
            <button
              onClick={() => alert('📱 App download coming soon! Stay tuned.')}
              style={buttonStyle}
            >
              📱 Download App
            </button>
          </div>
        )}
      </div>

      {/* ---- FOOTER ---- */}
      <div style={{ textAlign: 'center', padding: '20px', marginTop: 20 }}>
        <p style={{ color: secondaryText, fontSize: 12 }}>© 2026 ELITE Nursing & Midwifery CBT. All rights reserved.{' '}
          <Link to="/privacy" style={{ color: '#2196f3', fontSize: 11, textDecoration: 'none', marginLeft: 4 }}>
            Privacy Policy
          </Link>
          <span style={{ color: secondaryText, margin: '0 6px' }}>|</span>
          <Link to="/terms" style={{ color: '#2196f3', fontSize: 11, textDecoration: 'none' }}>
            Terms & Conditions
          </Link>
        </p>
      </div>
    </div>
  );
};