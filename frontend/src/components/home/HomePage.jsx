// src/components/home/HomePage.jsx
import React, { useState, useEffect, useContext } from 'react';
import { Link, useNavigate } from 'react-router-dom';   
import axios from 'axios';                                
import { AuthContext } from '../../context/AuthContext';
import { getCachedQuizzes } from '../../utils/quizHelpers';
import { getHeadingColor, getSecondaryText } from '../../utils/theme';
import { LoadingWithBar } from '../common/LoadingWithBar';

export const HomePage = () => {
  const [mode, setMode] = useState('premium');
  const [quizzes, setQuizzes] = useState([]);
  const [loading, setLoading] = useState(true);
  const { token, darkMode, user } = useContext(AuthContext);
  const headingColor = getHeadingColor(darkMode);
  const secondaryText = getSecondaryText(darkMode);
  const navigate = useNavigate(); 

  // ---- ANNOUNCEMENT BANNER STATE ----
  const [announcement, setAnnouncement] = useState(null);
  const [showBanner, setShowBanner] = useState(false);
  const [dismissedVersion, setDismissedVersion] = useState(() => {
    return localStorage.getItem('announcementDismissed') || '0';
  });

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

  // ---- ORIGINAL CODE (unchanged) ----
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
    const categoryTopics = {};
    quizzes.forEach(quiz => {
      if (!categoryTopics[quiz.category]) {
        categoryTopics[quiz.category] = new Set();
      }
      if (quiz.topic) {
        categoryTopics[quiz.category].add(quiz.topic);
      }
    });
    const categories = {};
    for (const [category, topics] of Object.entries(categoryTopics)) {
      categories[category] = topics.size;
    }
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
  const categoryPriority = ['general-nursing', 'midwifery', 'public-health', 'pediatric-nursing', 'dental-nursing'];
  const sortedCategories = Object.entries(categories).sort((a, b) => {
    const indexA = categoryPriority.indexOf(a[0]);
    const indexB = categoryPriority.indexOf(b[0]);
    if (indexA !== -1 && indexB !== -1) return indexA - indexB;
    if (indexA !== -1) return -1;
    if (indexB !== -1) return 1;
    return a[0].localeCompare(b[0]);
  });

  return (
    <div style={{ background: darkMode ? '#1a1a2e' : '#f0f7f4', minHeight: '100vh', padding: '20px' }}>
      <div style={{ maxWidth: 1200, margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: 24 }}>
          <h1 style={{ color: headingColor, fontSize: 'clamp(24px, 5vw, 36px)', marginBottom: 8 }}>ELITE NURSING & MIDWIFERY CBT</h1>
          <p style={{ color: darkMode ? '#aaa' : '#666', fontSize: 'clamp(14px, 4vw, 16px)' }}>Computer Based Testing Platform</p>
        </div>

        {/* ---- ANNOUNCEMENT BANNER (NEW) ---- */}
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
        {/* ---- END ANNOUNCEMENT BANNER ---- */}

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

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 24 }}>
          {sortedCategories.map(([category, topicCount]) => (
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
                <h2 style={{ color: darkMode ? headingColor : (mode === 'free' ? '#1e3c72' : '#ff9800'), fontSize: 'clamp(18px, 4vw, 20px)', marginBottom: 8 }}>{getCategoryName(category)}</h2>
                <p style={{ color: darkMode ? '#aaa' : '#666', fontSize: 14, marginBottom: 12 }}>{topicCount} courses</p>
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