// src/components/rating/RatingSummary.jsx
import React, { useState, useEffect } from 'react';
import axios from 'axios';

const CACHE_KEY = 'ratingStats';

const RatingSummary = ({ darkMode, headingColor, textColor, secondaryText, cardBg, onRateClick }) => {
  const [stats, setStats] = useState(() => {
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

  // ----- Helper: render stars (full stars only for summary) -----
  const renderStars = (count) => {
    const full = Math.round(count);
    return '★'.repeat(full) + '☆'.repeat(5 - full);
  };

  // ----- Loading skeleton (compact shimmer) -----
  if (loading) {
    return (
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: 16,
        padding: '12px 20px',
        background: cardBg,
        borderRadius: 12,
        border: `1px solid ${darkMode ? '#444' : '#e0e0e0'}`,
        flexWrap: 'wrap',
        justifyContent: 'space-between',
        marginBottom: 24
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{
            width: 40,
            height: 32,
            borderRadius: 4,
            background: darkMode ? '#333' : '#e8e8e8',
            animation: 'shimmer 1.5s infinite linear',
            backgroundImage: `linear-gradient(90deg, ${darkMode ? '#333' : '#e8e8e8'} 0%, ${darkMode ? '#444' : '#f0f0f0'} 50%, ${darkMode ? '#333' : '#e8e8e8'} 100%)`,
            backgroundSize: '200% 100%'
          }} />
          <div>
            <div style={{
              width: 120,
              height: 20,
              borderRadius: 4,
              background: darkMode ? '#333' : '#e8e8e8',
              marginBottom: 4,
              animation: 'shimmer 1.5s infinite linear',
              backgroundImage: `linear-gradient(90deg, ${darkMode ? '#333' : '#e8e8e8'} 0%, ${darkMode ? '#444' : '#f0f0f0'} 50%, ${darkMode ? '#333' : '#e8e8e8'} 100%)`,
              backgroundSize: '200% 100%'
            }} />
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
        </div>
        <div style={{
          width: 90,
          height: 32,
          borderRadius: 30,
          background: darkMode ? '#333' : '#e8e8e8',
          animation: 'shimmer 1.5s infinite linear',
          backgroundImage: `linear-gradient(90deg, ${darkMode ? '#333' : '#e8e8e8'} 0%, ${darkMode ? '#444' : '#f0f0f0'} 50%, ${darkMode ? '#333' : '#e8e8e8'} 100%)`,
          backgroundSize: '200% 100%'
        }} />

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
    return null; // hide entirely if no ratings
  }

  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      gap: 16,
      padding: '12px 20px',
      background: cardBg,
      borderRadius: 12,
      border: `1px solid ${darkMode ? '#444' : '#e0e0e0'}`,
      flexWrap: 'wrap',
      justifyContent: 'space-between',
      marginBottom: 24
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <span style={{ fontSize: 28, fontWeight: 'bold', color: headingColor }}>
          {stats.average.toFixed(1)}
        </span>
        <div>
          <div style={{ fontSize: 20, color: '#FFD700' }}>
            {renderStars(stats.average)}
          </div>
          <span style={{ fontSize: 13, color: secondaryText }}>
            {stats.total.toLocaleString()} ratings
          </span>
        </div>
      </div>
      <button
        onClick={onRateClick}
        style={{
          padding: '6px 20px',
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
  );
};

export default RatingSummary;