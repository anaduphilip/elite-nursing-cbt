// src/components/home/HomePage.jsx
import React, { useState, useEffect, useContext } from 'react';
import { Link, useNavigate } from 'react-router-dom';   
import axios from 'axios';                                
import { AuthContext } from '../../context/AuthContext';
import { getCachedQuizzes, hasCachedQuizzes, getCachedCategories, hasCachedCategories } from '../../utils/quizHelpers';
import { getHeadingColor, getSecondaryText } from '../../utils/theme';
import { LoadingWithBar } from '../common/LoadingWithBar';

export const HomePage = () => {
  const [mode, setMode] = useState('premium');
  const [quizzes, setQuizzes] = useState([]);
  const [loading, setLoading] = useState(true);
  const { token, darkMode, user, login } = useContext(AuthContext);
  const headingColor = getHeadingColor(darkMode);
  const secondaryText = getSecondaryText(darkMode);
  const navigate = useNavigate(); 

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

  // ---- DYNAMIC CATEGORIES FROM API (with cache) ----
  const [apiCategories, setApiCategories] = useState([]);
  const [categoriesLoading, setCategoriesLoading] = useState(true);

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

  // ---- FETCH CATEGORIES (CACHED) ----
  useEffect(() => {
    const fetchCategories = async () => {
      // Only show loading if categories are NOT cached
      if (!hasCachedCategories()) {
        setCategoriesLoading(true);
      }
      try {
        const categories = await getCachedCategories();
        setApiCategories(categories);
      } catch (error) {
        console.error('Failed to fetch categories:', error);
        // Fallback to hardcoded categories if API fails
        setApiCategories([
          { slug: 'general-nursing', name: 'General Nursing', icon: '🩺', active: true, order: 1 },
          { slug: 'midwifery', name: 'Midwifery', icon: '🤰', active: true, order: 2 },
          { slug: 'public-health', name: 'Public Health', icon: '🌍', active: true, order: 3 },
          { slug: 'pediatric-nursing', name: 'Pediatric Nursing', icon: '👶', active: true, order: 4 },
          { slug: 'dental-nursing', name: 'Dental Nursing', icon: '🦷', active: true, order: 5 }
        ]);
      } finally {
        setCategoriesLoading(false);
      }
    };
    fetchCategories();
  }, []);

  // ---- FETCH QUIZZES (CACHED) ----
  useEffect(() => {
    const fetchQuizzes = async () => {
      if (!hasCachedQuizzes()) {
        setLoading(true);
      }
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

  // ---- Get categories with topic count from quizzes ----
  // Sorted by the 'order' field from the database
  const getCategoriesWithCount = () => {
    // Build category -> topics count from quizzes
    const categoryTopics = {};
    quizzes.forEach(quiz => {
      if (!categoryTopics[quiz.category]) {
        categoryTopics[quiz.category] = new Set();
      }
      if (quiz.topic) {
        categoryTopics[quiz.category].add(quiz.topic);
      }
    });
    
    // Map API categories to include topic count and icon
    const result = [];
    const activeSlugs = apiCategories.filter(c => c.active).map(c => c.slug);
    
    // First, include all active categories from API
    for (const cat of apiCategories) {
      if (!cat.active) continue;
      const topics = categoryTopics[cat.slug] || new Set();
      result.push({
        slug: cat.slug,
        name: cat.name,
        icon: cat.icon || '📚',
        topicCount: topics.size,
        active: true,
        order: cat.order || 999 // Use the order field from MongoDB
      });
    }
    
    // Also include any categories that exist in quizzes but not in API (fallback)
    for (const [slug, topics] of Object.entries(categoryTopics)) {
      if (!activeSlugs.includes(slug)) {
        const iconMap = {
          'general-nursing': '🩺',
          'midwifery': '🤰',
          'public-health': '🌍',
          'pediatric-nursing': '👶',
          'dental-nursing': '🦷'
        };
        const nameMap = {
          'general-nursing': 'General Nursing',
          'midwifery': 'Midwifery',
          'public-health': 'Public Health',
          'pediatric-nursing': 'Pediatric Nursing',
          'dental-nursing': 'Dental Nursing'
        };
        result.push({
          slug: slug,
          name: nameMap[slug] || slug,
          icon: iconMap[slug] || '📚',
          topicCount: topics.size,
          active: true,
          order: 999 // high order so they appear at the end
        });
      }
    }
    
    // Sort by order (ascending) – this makes the category order match the admin panel
    result.sort((a, b) => (a.order || 999) - (b.order || 999));
    
    return result;
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

  if (loading || categoriesLoading) {
    return <LoadingWithBar message="Loading courses" />;
  }

  const displayCategories = getCategoriesWithCount();

  return (
    <div style={{ background: darkMode ? '#1a1a2e' : '#f0f7f4', minHeight: '100vh', padding: '20px' }}>
      <div style={{ maxWidth: 1200, margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: 24 }}>
          <h1 style={{ color: headingColor, fontSize: 'clamp(24px, 5vw, 36px)', marginBottom: 8 }}>ELITE NURSING & MIDWIFERY CBT</h1>
          <p style={{ color: darkMode ? '#aaa' : '#666', fontSize: 'clamp(14px, 4vw, 16px)' }}>Computer Based Testing Platform</p>
        </div>

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

        {/* ---- MODE BUTTONS ---- */}
        <div style={{ display: 'flex', gap: 16, marginBottom: 32, justifyContent: 'center', flexWrap: 'wrap' }}>
          <button
            onClick={() => setMode('free')}
            style={{
              padding: '12px 32px',
              fontSize: 'clamp(16px, 4vw, 18px)',
              fontWeight: 'bold',
              background: mode === 'free' ? 'linear-gradient(135deg, #1e3c72 0%, #2a5298 100%)' : darkMode ? '#16213e' : 'white',
              color: mode === 'free' ? 'white' : (darkMode ? headingColor : '#1e3c72'),
              border: mode === 'free' ? 'none' : (darkMode ? `2px solid ${headingColor}` : '2px solid #1e3c72'),
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
              color: mode === 'premium' ? 'white' : (darkMode ? headingColor : '#ff9800'),
              border: mode === 'premium' ? 'none' : (darkMode ? `2px solid ${headingColor}` : '2px solid #ff9800'),
              borderRadius: '50px',
              cursor: 'pointer'
            }}
          >
            ⭐ PREMIUM MODE
          </button>
        </div>

        {/* ---- MODE INFO BANNERS ---- */}
        {mode === 'free' && (
          <div style={{ background: darkMode ? '#2d2d3d' : '#e8f5e9', padding: 16, borderRadius: 12, textAlign: 'center', marginBottom: 24 }}>
            <p style={{ color: headingColor, margin: 0, fontSize: 'clamp(14px, 4vw, 16px)' }}>
              🎯 <strong>Free Mode:</strong> Take each examination ONCE. Upgrade to retake exams and unlock all questions!
            </p>
          </div>
        )}
        {mode === 'premium' && (
          <div style={{ background: darkMode ? '#2d2d3d' : '#e8f5e9', padding: 16, borderRadius: 12, textAlign: 'center', marginBottom: 24 }}>
            <p style={{ color: '#ff9800', margin: 0, fontSize: 'clamp(14px, 4vw, 16px)' }}>
              ⭐ <strong>Premium Mode:</strong> {user?.isPremium ? 'Full access to all examinations!' : 'Upgrade to unlock unlimited access!'}
            </p>
          </div>
        )}

        {/* ---- DYNAMIC CATEGORIES GRID (sorted by MongoDB 'order' field) ---- */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 24 }}>
          {displayCategories.map((cat) => (
            <Link to={`/courses/${cat.slug}/${mode}`} key={cat.slug} style={{ textDecoration: 'none' }}>
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
                <div style={{ fontSize: 56, marginBottom: 12 }}>{cat.icon}</div>
                <h2 style={{ color: darkMode ? headingColor : (mode === 'free' ? '#1e3c72' : '#ff9800'), fontSize: 'clamp(18px, 4vw, 20px)', marginBottom: 8 }}>{cat.name}</h2>
                <p style={{ color: darkMode ? '#aaa' : '#666', fontSize: 14, marginBottom: 12 }}>{cat.topicCount} courses</p>
                <div style={{ display: 'flex', justifyContent: 'center', gap: 12, flexWrap: 'wrap' }}>
                  <span style={{ background: darkMode ? '#333' : '#e8f5e9', color: headingColor, padding: '4px 12px', borderRadius: 20, fontSize: 12 }}>🎯 Free Exam 1</span>
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