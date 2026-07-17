// src/components/profile/GamificationWidget.jsx
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
  const [earnedBadges, setEarnedBadges] = useState([]);
  const [totalBadges, setTotalBadges] = useState(0);
  const [nextMilestone, setNextMilestone] = useState(null);
  const [streakBadges, setStreakBadges] = useState([]);

  useEffect(() => {
    const fetchGamification = async () => {
      try {
        const res = await axios.get('/api/gamification/user', {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (res.data.success) {
          const userStreak = res.data.streak || 0;
          setStreak(userStreak);
          
          const earned = res.data.badges?.filter(b => b.isEarned) || [];
          setEarnedBadges(earned);
          setTotalBadges(res.data.totalBadges || 0);

          // Get all streak badges and sort by requirement
          const allBadges = res.data.badges || [];
          const streakBadges = allBadges
            .filter(b => b.requirementType === 'streak_days' && b.active !== false)
            .sort((a, b) => a.requirementValue - b.requirementValue);
          setStreakBadges(streakBadges);

          // Find the next milestone
          const next = streakBadges.find(b => b.requirementValue > userStreak);
          setNextMilestone(next || null);
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

  // Calculate progress towards next milestone
  const progressPercent = nextMilestone ? Math.min((streak / nextMilestone.requirementValue) * 100, 100) : 0;
  const progressText = nextMilestone ? `${streak} / ${nextMilestone.requirementValue} days` : `✨ All streak badges earned!`;

  return (
    <div style={{
      background: darkMode ? '#16213e' : 'white',
      borderRadius: 16,
      padding: '20px 24px',
      boxShadow: '0 2px 8px rgba(0,0,0,0.08)'
    }}>
      {/* Summary Row */}
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 32, flexWrap: 'wrap', marginBottom: 16 }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 32, fontWeight: 'bold', color: streak > 0 ? '#ff9800' : secondaryText }}>
            🔥 {streak}
          </div>
          <div style={{ fontSize: 12, color: secondaryText }}>Day Streak</div>
        </div>

        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 32, fontWeight: 'bold', color: headingColor }}>
            {earnedBadges.length}
          </div>
          <div style={{ fontSize: 12, color: secondaryText }}>
            of {totalBadges} badges earned
          </div>
        </div>
      </div>

      {/* Progress Bar */}
      {nextMilestone && (
        <div style={{ marginBottom: 16 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
            <span style={{ fontSize: 13, color: secondaryText }}>
              🎯 Next: {nextMilestone.icon} {nextMilestone.name}
            </span>
            <span style={{ fontSize: 13, color: headingColor, fontWeight: 'bold' }}>
              {progressText}
            </span>
          </div>
          <div style={{
            width: '100%',
            height: 12,
            background: darkMode ? '#333' : '#e0e0e0',
            borderRadius: 6,
            overflow: 'hidden',
            position: 'relative'
          }}>
            <div style={{
              width: `${progressPercent}%`,
              height: '100%',
              background: progressPercent >= 100 ? '#4caf50' : 'linear-gradient(90deg, #ff9800, #ff5722)',
              borderRadius: 6,
              transition: 'width 0.5s ease'
            }} />
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 2 }}>
            <span style={{ fontSize: 10, color: secondaryText }}>0</span>
            <span style={{ fontSize: 10, color: secondaryText }}>{nextMilestone.requirementValue}</span>
          </div>
        </div>
      )}

      {!nextMilestone && (
        <div style={{ textAlign: 'center', padding: '8px', marginBottom: 12 }}>
          <p style={{ color: '#4caf50', fontSize: 14, fontWeight: 'bold' }}>
            🏆 You've earned all streak badges! Keep going!
          </p>
        </div>
      )}

      {/* Badges Gallery */}
      {earnedBadges.length > 0 ? (
        <div>
          <p style={{ fontSize: 13, color: secondaryText, marginBottom: 12, textAlign: 'center' }}>
            🏅 Your Badge Collection ({earnedBadges.length})
          </p>
          <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: 12 }}>
            {earnedBadges.map((badge, index) => (
              <div key={badge._id || index} style={{
                textAlign: 'center',
                padding: '10px 14px',
                background: darkMode ? '#2d2d3d' : '#f5f5f5',
                borderRadius: 12,
                minWidth: '80px',
                border: '1px solid #ddd'
              }}>
                <div style={{ fontSize: 32 }}>{badge.icon || '🏅'}</div>
                <div style={{ fontSize: 11, color: headingColor, marginTop: 4, fontWeight: 'bold' }}>
                  {badge.name}
                </div>
                {badge.earnedAt && (
                  <div style={{ fontSize: 9, color: secondaryText, marginTop: 2 }}>
                    {new Date(badge.earnedAt).toLocaleDateString()}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div style={{ textAlign: 'center', padding: '20px 0' }}>
          <p style={{ color: secondaryText, fontSize: 14 }}>No badges earned yet.</p>
          <p style={{ color: secondaryText, fontSize: 12 }}>Complete more exams to earn your first badge! 🎯</p>
        </div>
      )}
    </div>
  );
};