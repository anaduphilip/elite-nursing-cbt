// src/components/rating/RatingSummary.jsx
import React, { useState, useEffect } from 'react';
import axios from 'axios';

const RatingSummary = ({ darkMode, headingColor, textColor, secondaryText, cardBg, onRateClick }) => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await axios.get('/api/ratings/stats');
        if (res.data.success) {
          setStats(res.data.stats);
        }
      } catch (err) {
        console.error('Failed to fetch rating stats:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  if (loading) return null;
  if (!stats || stats.total === 0) return null;

  const renderStars = (count) => {
    return '★'.repeat(Math.round(count)) + '☆'.repeat(5 - Math.round(count));
  };

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