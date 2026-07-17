// src/components/home/GamificationWidget.jsx
import React, { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { AuthContext } from '../../context/AuthContext';
import { getHeadingColor, getSecondaryText } from '../../utils/theme';

export const GamificationWidget = () => {
  const { token, darkMode } = useContext(AuthContext);
  const headingColor = getHeadingColor(darkMode);
  const secondaryText = getSecondaryText(darkMode);
  const [loading, setLoading] = useState(true);
  const [streak, setStreak] = useState(0);
  const [latestBadge, setLatestBadge] = useState(null);
  const [totalBadges, setTotalBadges] = useState(0);

  useEffect(() => {
    const fetchGamification = async () => {
      try {
        const res = await axios.get('/api/user/gamification', {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (res.data.success) {
          setStreak(res.data.streak || 0);
          setLatestBadge(res.data.latestBadge || null);
          setTotalBadges(res.data.totalBadges || 0);
        }
      } catch (error) {
        console.error('Failed to fetch gamification data:', error);
      } finally {
        setLoading(false);
      }
    };
    if (token) fetchGamification();
  }, [token]);

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '16px', background: darkMode ? '#16213e' : 'white', borderRadius: 12 }}>
        <p style={{ color: secondaryText, fontSize: 14 }}>Loading achievements...</p>
      </div>
    );
  }

  return (
    <div style={{
      background: darkMode ? '#16213e' : 'white',
      borderRadius: 16,
      padding: '20px 24px',
      boxShadow: '0 2px 8px rgba(0,0,0,0.08)'
    }}>
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 32, flexWrap: 'wrap' }}>
        {/* Streak */}
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 32, fontWeight: 'bold', color: streak > 0 ? '#ff9800' : secondaryText }}>
            🔥 {streak}
          </div>
          <div style={{ fontSize: 12, color: secondaryText }}>Day Streak</div>
        </div>

        {/* Latest Badge */}
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 32, fontWeight: 'bold' }}>
            {latestBadge ? latestBadge.icon || '🏅' : '🏅'}
          </div>
          <div style={{ fontSize: 12, color: secondaryText }}>
            {latestBadge ? latestBadge.name || 'Badge Earned' : 'No badges yet'}
          </div>
        </div>

        {/* Total Badges Count */}
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 32, fontWeight: 'bold', color: headingColor }}>
            {totalBadges}
          </div>
          <div style={{ fontSize: 12, color: secondaryText }}>
            badge{totalBadges !== 1 ? 's' : ''} earned
          </div>
        </div>
      </div>
    </div>
  );
};