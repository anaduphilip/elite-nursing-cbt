// src/components/weekly/WeeklyLeaderboard.jsx
import React, { useState, useEffect, useContext } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { AuthContext } from '../../context/AuthContext';
import { getHeadingColor, getSecondaryText, getTextColor, getCardBg } from '../../utils/theme';
import { LoadingWithBar } from '../common/LoadingWithBar';

export const WeeklyLeaderboard = () => {
  const [attempts, setAttempts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [userRank, setUserRank] = useState(null);
  const { token, darkMode, user } = useContext(AuthContext);
  const headingColor = getHeadingColor(darkMode);
  const secondaryText = getSecondaryText(darkMode);
  const textColor = getTextColor(darkMode);
  const cardBg = getCardBg(darkMode);

  useEffect(() => {
    const fetchLeaderboard = async () => {
      setLoading(true);
      try {
        const res = await axios.get('/api/weekly-quiz/current/leaderboard', {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (res.data.success) {
          setAttempts(res.data.attempts);
          const idx = res.data.attempts.findIndex(a => a.userId?._id === user?.id);
          setUserRank(idx !== -1 ? idx + 1 : null);
        }
      } catch (error) {
        console.error('Error fetching leaderboard:', error);
        alert('Failed to load leaderboard');
      } finally {
        setLoading(false);
      }
    };
    fetchLeaderboard();
  }, [token, user]);

  if (loading) return <LoadingWithBar message="Loading leaderboard..." />;

  if (attempts.length === 0) {
    return (
      <div style={{ background: darkMode ? '#1a1a2e' : '#f0f7f4', minHeight: '100vh', padding: '50px', textAlign: 'center' }}>
        <div style={{ fontSize: 64, marginBottom: 20 }}>🏆</div>
        <h2 style={{ color: headingColor }}>No Attempts Yet</h2>
        <p style={{ color: secondaryText }}>Be the first to take the weekly quiz!</p>
        <Link to="/weekly-quiz"><button style={{ marginTop: 20, background: '#1e3c72', color: 'white', padding: '10px 20px', border: 'none', borderRadius: 8, cursor: 'pointer' }}>Take Weekly Quiz</button></Link>
      </div>
    );
  }

  return (
    <div style={{ background: darkMode ? '#1a1a2e' : '#f0f7f4', minHeight: '100vh', padding: '20px' }}>
      <div style={{ maxWidth: 900, margin: '0 auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <h1 style={{ color: headingColor }}>🏆 Weekly Quiz Leaderboard</h1>
          <Link to="/weekly-quiz" style={{ color: headingColor, textDecoration: 'none' }}>← Back to Quiz</Link>
        </div>
        {userRank && (
          <div style={{ background: '#e8f5e9', padding: 12, borderRadius: 8, marginBottom: 20, textAlign: 'center' }}>
            <p style={{ color: '#2e7d32', margin: 0, fontSize: 16 }}>
              Your Rank: <strong>#{userRank}</strong> out of {attempts.length} participants
            </p>
          </div>
        )}
        <div style={{ background: cardBg, borderRadius: 16, overflow: 'hidden', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: '#1e3c72', color: 'white' }}>
                <th style={{ padding: '12px 16px', textAlign: 'left' }}>#</th>
                <th style={{ padding: '12px 16px', textAlign: 'left' }}>Name</th>
                <th style={{ padding: '12px 16px', textAlign: 'center' }}>Score</th>
                <th style={{ padding: '12px 16px', textAlign: 'center' }}>Percentage</th>
              </tr>
            </thead>
            <tbody>
              {attempts.map((attempt, index) => {
                const isCurrentUser = attempt.userId?._id === user?.id;
                return (
                  <tr key={attempt._id} style={{
                    background: isCurrentUser ? (darkMode ? '#2d2d3d' : '#e3f2fd') : 'transparent',
                    borderBottom: `1px solid ${darkMode ? '#444' : '#eee'}`
                  }}>
                    <td style={{ padding: '10px 16px', fontWeight: 'bold', color: isCurrentUser ? headingColor : secondaryText }}>
                      {index + 1}
                    </td>
                    <td style={{ padding: '10px 16px', fontWeight: isCurrentUser ? 'bold' : 'normal', color: textColor }}>
                      {attempt.userId?.name || 'Unknown'}
                      {isCurrentUser && <span style={{ marginLeft: 8, color: '#1e3c72', fontSize: 12 }}>(You)</span>}
                    </td>
                    <td style={{ padding: '10px 16px', textAlign: 'center', color: textColor }}>
                      {attempt.score} / {attempt.total}
                    </td>
                    <td style={{ padding: '10px 16px', textAlign: 'center', color: textColor }}>
                      {attempt.percentage.toFixed(1)}%
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <div style={{ textAlign: 'center', marginTop: 20 }}>
          <Link to="/"><button style={{ background: '#1e3c72', color: 'white', padding: '10px 20px', border: 'none', borderRadius: 8, cursor: 'pointer' }}>Home</button></Link>
        </div>
      </div>
      <div style={{ textAlign: 'center', padding: '20px', marginTop: 20 }}>
        <p style={{ color: secondaryText, fontSize: 12 }}>© 2026 ELITE Nursing & Midwifery CBT. All rights reserved.</p>
      </div>
    </div>
  );
};