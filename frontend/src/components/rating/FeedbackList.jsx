// src/components/rating/FeedbackList.jsx
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import FeedbackItem from './FeedbackItem';

const CACHE_KEY = 'latestFeedbacks';

const FeedbackList = ({
  darkMode,
  headingColor,
  textColor,
  secondaryText,
  cardBg,
  token
}) => {
  // Try to read from cache on initial render
  const [feedbacks, setFeedbacks] = useState(() => {
    const cached = localStorage.getItem(CACHE_KEY);
    if (cached) {
      try {
        return JSON.parse(cached);
      } catch (_) { /* ignore */ }
    }
    return null;
  });
  const [loading, setLoading] = useState(!feedbacks);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchFeedbacks = async () => {
      try {
        const res = await axios.get('/api/ratings/latest');
        if (res.data.success) {
          const data = res.data.ratings || [];
          setFeedbacks(data);
          localStorage.setItem(CACHE_KEY, JSON.stringify(data));
        }
      } catch (err) {
        console.error('Fetch feedbacks error:', err);
        setError('Failed to load feedbacks.');
      } finally {
        setLoading(false);
      }
    };
    fetchFeedbacks();
  }, []);

  // ----- Skeleton (shows when loading and no cache) -----
  if (loading && !feedbacks) {
    return (
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        gap: 16,
        marginTop: 12
      }}>
        {[1, 2, 3].map((_, idx) => (
          <div
            key={idx}
            style={{
              background: cardBg,
              borderRadius: 12,
              padding: 18,
              border: `1px solid ${darkMode ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)'}`,
              boxShadow: darkMode ? '0 1px 4px rgba(0,0,0,0.3)' : '0 1px 4px rgba(0,0,0,0.04)',
              display: 'flex',
              flexDirection: 'column',
              gap: 8
            }}
          >
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{
                  width: 80,
                  height: 18,
                  borderRadius: 4,
                  background: darkMode ? '#333' : '#e8e8e8',
                  animation: 'shimmer 1.5s infinite linear',
                  backgroundImage: `linear-gradient(90deg, ${darkMode ? '#333' : '#e8e8e8'} 0%, ${darkMode ? '#444' : '#f0f0f0'} 50%, ${darkMode ? '#333' : '#e8e8e8'} 100%)`,
                  backgroundSize: '200% 100%'
                }} />
                <div style={{
                  width: 100,
                  height: 16,
                  borderRadius: 4,
                  background: darkMode ? '#333' : '#e8e8e8',
                  animation: 'shimmer 1.5s infinite linear',
                  backgroundImage: `linear-gradient(90deg, ${darkMode ? '#333' : '#e8e8e8'} 0%, ${darkMode ? '#444' : '#f0f0f0'} 50%, ${darkMode ? '#333' : '#e8e8e8'} 100%)`,
                  backgroundSize: '200% 100%'
                }} />
              </div>
              <div style={{
                width: 80,
                height: 14,
                borderRadius: 4,
                background: darkMode ? '#333' : '#e8e8e8',
                animation: 'shimmer 1.5s infinite linear',
                backgroundImage: `linear-gradient(90deg, ${darkMode ? '#333' : '#e8e8e8'} 0%, ${darkMode ? '#444' : '#f0f0f0'} 50%, ${darkMode ? '#333' : '#e8e8e8'} 100%)`,
                backgroundSize: '200% 100%'
              }} />
            </div>
            <div style={{
              width: '100%',
              height: 14,
              borderRadius: 4,
              background: darkMode ? '#333' : '#e8e8e8',
              animation: 'shimmer 1.5s infinite linear',
              backgroundImage: `linear-gradient(90deg, ${darkMode ? '#333' : '#e8e8e8'} 0%, ${darkMode ? '#444' : '#f0f0f0'} 50%, ${darkMode ? '#333' : '#e8e8e8'} 100%)`,
              backgroundSize: '200% 100%'
            }} />
            <div style={{
              width: '70%',
              height: 14,
              borderRadius: 4,
              background: darkMode ? '#333' : '#e8e8e8',
              animation: 'shimmer 1.5s infinite linear',
              backgroundImage: `linear-gradient(90deg, ${darkMode ? '#333' : '#e8e8e8'} 0%, ${darkMode ? '#444' : '#f0f0f0'} 50%, ${darkMode ? '#333' : '#e8e8e8'} 100%)`,
              backgroundSize: '200% 100%'
            }} />
            <div style={{ display: 'flex', gap: 6, marginTop: 4 }}>
              <div style={{
                width: 60,
                height: 28,
                borderRadius: 20,
                background: darkMode ? '#333' : '#e8e8e8',
                animation: 'shimmer 1.5s infinite linear',
                backgroundImage: `linear-gradient(90deg, ${darkMode ? '#333' : '#e8e8e8'} 0%, ${darkMode ? '#444' : '#f0f0f0'} 50%, ${darkMode ? '#333' : '#e8e8e8'} 100%)`,
                backgroundSize: '200% 100%'
              }} />
              <div style={{
                width: 60,
                height: 28,
                borderRadius: 20,
                background: darkMode ? '#333' : '#e8e8e8',
                animation: 'shimmer 1.5s infinite linear',
                backgroundImage: `linear-gradient(90deg, ${darkMode ? '#333' : '#e8e8e8'} 0%, ${darkMode ? '#444' : '#f0f0f0'} 50%, ${darkMode ? '#333' : '#e8e8e8'} 100%)`,
                backgroundSize: '200% 100%'
              }} />
            </div>
          </div>
        ))}
        <style>{`
          @keyframes shimmer {
            0% { background-position: -200% 0; }
            100% { background-position: 200% 0; }
          }
        `}</style>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ textAlign: 'center', padding: 20, color: '#dc3545' }}>
        {error}
      </div>
    );
  }

  if (!feedbacks || feedbacks.length === 0) {
    return (
      <div style={{ textAlign: 'center', padding: 20, color: secondaryText }}>
        No feedback yet. Be the first to share your experience!
      </div>
    );
  }

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      gap: 16,
      marginTop: 12
    }}>
      {feedbacks
        .filter(fb => fb && fb._id)
        .map((fb) => (
          <FeedbackItem
            key={fb._id}
            feedback={fb}
            darkMode={darkMode}
            headingColor={headingColor}
            textColor={textColor}
            secondaryText={secondaryText}
            cardBg={cardBg}
            token={token}
          />
        ))}
    </div>
  );
};

export default FeedbackList;