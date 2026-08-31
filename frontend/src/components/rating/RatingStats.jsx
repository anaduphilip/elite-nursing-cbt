// src/components/rating/RatingStats.jsx
import React, { useState, useEffect } from 'react';
import axios from 'axios';

const CACHE_KEY = 'ratingStats';

const RatingStats = ({ darkMode, headingColor, textColor, secondaryText, cardBg, onRateClick }) => {
  const [stats, setStats] = useState(() => {
    // Try to read from cache on initial render
    const cached = localStorage.getItem(CACHE_KEY);
    if (cached) {
      try {
        return JSON.parse(cached);
      } catch (_) { /* ignore */ }
    }
    return null;
  });
  const [loading, setLoading] = useState(!stats);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await axios.get('/api/ratings/stats');
        if (res.data.success) {
          const newStats = res.data.stats;
          setStats(newStats);
          localStorage.setItem(CACHE_KEY, JSON.stringify(newStats));
        }
      } catch (err) {
        console.error('Failed to fetch rating stats:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  // ----- Helper: render stars (with half-star support) -----
  const renderStars = (count) => {
    const full = Math.floor(count);
    const half = count % 1 >= 0.5 ? 1 : 0;
    const empty = 5 - full - half;
    return (
      <span style={{ color: '#FFD700', fontSize: 28 }}>
        {'★'.repeat(full)}
        {half === 1 && '★'}
        {'☆'.repeat(empty)}
      </span>
    );
  };

  // ----- Loading skeleton with shimmer (looks like the real component) -----
  if (loading) {
    return (
      <div style={{
        background: cardBg,
        borderRadius: 16,
        padding: 24,
        border: `1px solid ${darkMode ? '#444' : '#e0e0e0'}`,
        marginBottom: 24
      }}>
        <h3 style={{ color: headingColor, marginBottom: 16 }}>User Ratings</h3>
        <div style={{
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          gap: 24,
          justifyContent: 'space-between'
        }}>
          {/* Left skeleton */}
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            minWidth: 120,
            textAlign: 'center'
          }}>
            <div style={{
              width: 70,
              height: 48,
              borderRadius: 8,
              background: darkMode ? '#333' : '#e8e8e8',
              marginBottom: 8,
              animation: 'shimmer 1.5s infinite linear',
              backgroundImage: `linear-gradient(90deg, ${darkMode ? '#333' : '#e8e8e8'} 0%, ${darkMode ? '#444' : '#f0f0f0'} 50%, ${darkMode ? '#333' : '#e8e8e8'} 100%)`,
              backgroundSize: '200% 100%'
            }} />
            <div style={{
              width: 120,
              height: 28,
              borderRadius: 4,
              background: darkMode ? '#333' : '#e8e8e8',
              marginBottom: 8,
              animation: 'shimmer 1.5s infinite linear',
              backgroundImage: `linear-gradient(90deg, ${darkMode ? '#333' : '#e8e8e8'} 0%, ${darkMode ? '#444' : '#f0f0f0'} 50%, ${darkMode ? '#333' : '#e8e8e8'} 100%)`,
              backgroundSize: '200% 100%'
            }} />
            <div style={{
              width: 80,
              height: 16,
              borderRadius: 4,
              background: darkMode ? '#333' : '#e8e8e8',
              marginBottom: 12,
              animation: 'shimmer 1.5s infinite linear',
              backgroundImage: `linear-gradient(90deg, ${darkMode ? '#333' : '#e8e8e8'} 0%, ${darkMode ? '#444' : '#f0f0f0'} 50%, ${darkMode ? '#333' : '#e8e8e8'} 100%)`,
              backgroundSize: '200% 100%'
            }} />
            <div style={{
              width: 100,
              height: 36,
              borderRadius: 30,
              background: darkMode ? '#333' : '#e8e8e8',
              animation: 'shimmer 1.5s infinite linear',
              backgroundImage: `linear-gradient(90deg, ${darkMode ? '#333' : '#e8e8e8'} 0%, ${darkMode ? '#444' : '#f0f0f0'} 50%, ${darkMode ? '#333' : '#e8e8e8'} 100%)`,
              backgroundSize: '200% 100%'
            }} />
          </div>

          {/* Right skeleton bars */}
          <div style={{ flex: 1, minWidth: 200 }}>
            {[1, 2, 3, 4, 5].map((_, idx) => (
              <div key={idx} style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                marginBottom: 6
              }}>
                <span style={{
                  width: 30,
                  height: 14,
                  borderRadius: 4,
                  background: darkMode ? '#333' : '#e8e8e8',
                  animation: 'shimmer 1.5s infinite linear',
                  backgroundImage: `linear-gradient(90deg, ${darkMode ? '#333' : '#e8e8e8'} 0%, ${darkMode ? '#444' : '#f0f0f0'} 50%, ${darkMode ? '#333' : '#e8e8e8'} 100%)`,
                  backgroundSize: '200% 100%'
                }} />
                <div style={{
                  flex: 1,
                  height: 8,
                  borderRadius: 4,
                  background: darkMode ? '#333' : '#e8e8e8',
                  animation: 'shimmer 1.5s infinite linear',
                  backgroundImage: `linear-gradient(90deg, ${darkMode ? '#333' : '#e8e8e8'} 0%, ${darkMode ? '#444' : '#f0f0f0'} 50%, ${darkMode ? '#333' : '#e8e8e8'} 100%)`,
                  backgroundSize: '200% 100%'
                }} />
                <span style={{
                  width: 50,
                  height: 13,
                  borderRadius: 4,
                  background: darkMode ? '#333' : '#e8e8e8',
                  animation: 'shimmer 1.5s infinite linear',
                  backgroundImage: `linear-gradient(90deg, ${darkMode ? '#333' : '#e8e8e8'} 0%, ${darkMode ? '#444' : '#f0f0f0'} 50%, ${darkMode ? '#333' : '#e8e8e8'} 100%)`,
                  backgroundSize: '200% 100%'
                }} />
              </div>
            ))}
          </div>
        </div>

        <style>{`
          @keyframes shimmer {
            0% { background-position: -200% 0; }
            100% { background-position: 200% 0; }
          }
        `}</style>
      </div>
    );
  }

  if (!stats || stats.total === 0) {
    return (
      <div style={{ textAlign: 'center', padding: 20, color: secondaryText }}>
        No ratings yet. Be the first to rate!
      </div>
    );
  }

  const maxCount = Math.max(...Object.values(stats.distribution));

  return (
    <div style={{
      background: cardBg,
      borderRadius: 16,
      padding: 24,
      border: `1px solid ${darkMode ? '#444' : '#e0e0e0'}`,
      marginBottom: 24
    }}>
      <h3 style={{ color: headingColor, marginBottom: 16 }}>User Ratings</h3>

      <div style={{
        display: 'flex',
        flexWrap: 'wrap',
        alignItems: 'center',
        gap: 24,
        justifyContent: 'space-between'
      }}>
        {/* Left: Average + stars + count */}
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          minWidth: 120,
          textAlign: 'center'
        }}>
          <div style={{
            fontSize: 48,
            fontWeight: 'bold',
            color: headingColor,
            lineHeight: 1.2
          }}>
            {stats.average.toFixed(1)}
          </div>
          <div style={{ margin: '4px 0 2px' }}>
            {renderStars(stats.average)}
          </div>
          <div style={{
            fontSize: 14,
            color: secondaryText
          }}>
            {stats.total.toLocaleString()} ratings
          </div>
          <button
            onClick={onRateClick}
            style={{
              marginTop: 12,
              padding: '8px 24px',
              background: '#ff9800',
              color: 'white',
              border: 'none',
              borderRadius: 30,
              cursor: 'pointer',
              fontWeight: 'bold',
              fontSize: 14
            }}
          >
            Rate Us
          </button>
        </div>

        {/* Right: Distribution bars */}
        <div style={{ flex: 1, minWidth: 200 }}>
          {[5, 4, 3, 2, 1].map((star) => {
            const count = stats.distribution[star] || 0;
            const percentage = stats.total > 0 ? (count / stats.total) * 100 : 0;
            const barWidth = maxCount > 0 ? (count / maxCount) * 100 : 0;
            return (
              <div key={star} style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                marginBottom: 6
              }}>
                <span style={{
                  width: 30,
                  fontSize: 14,
                  color: secondaryText
                }}>
                  {star}★
                </span>
                <div style={{
                  flex: 1,
                  height: 8,
                  background: darkMode ? '#444' : '#e0e0e0',
                  borderRadius: 4,
                  overflow: 'hidden'
                }}>
                  <div style={{
                    width: `${barWidth}%`,
                    height: '100%',
                    background: '#FFD700',
                    borderRadius: 4
                  }} />
                </div>
                <span style={{
                  width: 50,
                  fontSize: 13,
                  color: secondaryText,
                  textAlign: 'right'
                }}>
                  {percentage.toFixed(0)}%
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default RatingStats;