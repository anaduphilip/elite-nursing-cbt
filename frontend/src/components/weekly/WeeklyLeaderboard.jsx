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
      <div style={{ 
        background: darkMode ? '#1a1a2e' : '#f0f7f4', 
        minHeight: '100vh', 
        padding: '16px 12px', 
        textAlign: 'center' 
      }}>
        <div style={{ fontSize: 48, marginBottom: 16 }}>🏆</div>
        <h2 style={{ color: headingColor, fontSize: 'clamp(20px, 5vw, 24px)' }}>No Attempts Yet</h2>
        <p style={{ color: secondaryText, fontSize: 'clamp(14px, 3vw, 16px)' }}>Be the first to take the weekly quiz!</p>
        <Link to="/weekly-quiz">
          <button style={{ marginTop: 20, background: '#1e3c72', color: 'white', padding: '10px 24px', border: 'none', borderRadius: 8, cursor: 'pointer' }}>Take Weekly Quiz</button>
        </Link>
        <div style={{ textAlign: 'center', padding: '16px 12px', marginTop: 20 }}>
          <p style={{ color: secondaryText, fontSize: 'clamp(10px, 2vw, 12px)' }}>
            © 2026 ELITE Nursing & Midwifery CBT. All rights reserved.{' '}
            <Link to="/privacy" style={{ color: '#2196f3', fontSize: 'clamp(10px, 2vw, 11px)', textDecoration: 'none' }}>Privacy Policy</Link>
            <span style={{ color: secondaryText, margin: '0 6px' }}>|</span>
            <Link to="/terms" style={{ color: '#2196f3', fontSize: 'clamp(10px, 2vw, 11px)', textDecoration: 'none' }}>Terms & Conditions</Link>
          </p>
        </div>
      </div>
    );
  }

  return (
    <div style={{ 
      background: darkMode ? '#1a1a2e' : '#f0f7f4', 
      minHeight: '100vh', 
      padding: '16px 12px' 
    }}>
      <div style={{ 
        maxWidth: 900, 
        margin: '0 auto', 
        padding: '0 4px'
      }}>
        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center', 
          marginBottom: 16,
          flexWrap: 'wrap',
          gap: 10
        }}>
          <h1 style={{ 
            color: headingColor, 
            fontSize: 'clamp(20px, 5vw, 24px)',
            margin: 0
          }}>
            🏆 Weekly Quiz Leaderboard
          </h1>
          <Link 
            to="/weekly-quiz" 
            style={{ 
              color: headingColor, 
              textDecoration: 'none',
              fontSize: 'clamp(13px, 3vw, 14px)'
            }}
          >
            ← Back to Quiz
          </Link>
        </div>

        <div style={{ 
          background: userRank ? '#e8f5e9' : '#fff3e0', 
          padding: '10px 16px', 
          borderRadius: 8, 
          marginBottom: 16, 
          textAlign: 'center' 
        }}>
          <p style={{ 
            color: userRank ? '#2e7d32' : '#ff9800', 
            margin: 0, 
            fontSize: 'clamp(14px, 3vw, 16px)' 
          }}>
            {userRank ? (
              <>Your Rank: <strong>#{userRank}</strong> out of {attempts.length} participants</>
            ) : (
              <>🏆 Take the weekly quiz to see your rank! <Link to="/weekly-quiz" style={{ color: '#1e3c72', fontWeight: 'bold' }}>Start Quiz →</Link></>
            )}
          </p>
        </div>

        <div style={{ 
          background: cardBg, 
          borderRadius: 12, 
          overflow: 'hidden', 
          boxShadow: '0 1px 4px rgba(0,0,0,0.08)'
        }}>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ 
              width: '100%', 
              borderCollapse: 'collapse',
              minWidth: '420px'
            }}>
              <thead>
                <tr style={{ background: '#1e3c72', color: 'white' }}>
                  <th style={{ padding: '10px 14px', textAlign: 'left', fontSize: 'clamp(13px, 3vw, 14px)' }}>#</th>
                  <th style={{ padding: '10px 14px', textAlign: 'left', fontSize: 'clamp(13px, 3vw, 14px)' }}>Name</th>
                  <th style={{ padding: '10px 14px', textAlign: 'center', fontSize: 'clamp(13px, 3vw, 14px)' }}>Score</th>
                  <th style={{ padding: '10px 14px', textAlign: 'center', fontSize: 'clamp(13px, 3vw, 14px)' }}>Percentage</th>
                </tr>
              </thead>
              <tbody>
                {attempts.map((attempt, index) => {
                  const isCurrentUser = attempt.userId?._id === user?.id;
                  return (
                    <tr 
                      key={attempt._id} 
                      style={{
                        background: isCurrentUser ? (darkMode ? '#2d2d3d' : '#e3f2fd') : 'transparent',
                        borderBottom: `1px solid ${darkMode ? '#444' : '#eee'}`
                      }}
                    >
                      <td style={{ 
                        padding: '8px 14px', 
                        fontWeight: 'bold', 
                        color: isCurrentUser ? headingColor : secondaryText,
                        fontSize: 'clamp(13px, 3vw, 14px)'
                      }}>
                        {index + 1}
                      </td>
                      <td style={{ 
                        padding: '8px 14px', 
                        fontWeight: isCurrentUser ? 'bold' : 'normal', 
                        color: textColor,
                        fontSize: 'clamp(13px, 3vw, 14px)'
                      }}>
                        {attempt.userId?.name || 'Unknown'}
                        {isCurrentUser && <span style={{ marginLeft: 8, color: '#1e3c72', fontSize: 'clamp(11px, 2.5vw, 12px)' }}>(You)</span>}
                      </td>
                      <td style={{ 
                        padding: '8px 14px', 
                        textAlign: 'center', 
                        color: textColor,
                        fontSize: 'clamp(13px, 3vw, 14px)'
                      }}>
                        {attempt.score} / {attempt.total}
                      </td>
                      <td style={{ 
                        padding: '8px 14px', 
                        textAlign: 'center', 
                        color: textColor,
                        fontSize: 'clamp(13px, 3vw, 14px)'
                      }}>
                        {attempt.percentage.toFixed(1)}%
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        <div style={{ textAlign: 'center', marginTop: 20 }}>
          <Link to="/">
            <button style={{ 
              background: '#1e3c72', 
              color: 'white', 
              padding: '10px 24px', 
              border: 'none', 
              borderRadius: 8, 
              cursor: 'pointer',
              fontSize: 'clamp(14px, 3vw, 16px)'
            }}>
              Home
            </button>
          </Link>
        </div>
      </div>

      {/* UPDATED FOOTER */}
      <div style={{ textAlign: 'center', padding: '16px 12px', marginTop: 12 }}>
        <p style={{ color: secondaryText, fontSize: 'clamp(10px, 2vw, 12px)' }}>
          © 2026 ELITE Nursing & Midwifery CBT. All rights reserved.{' '}
          <Link to="/privacy" style={{ color: '#2196f3', fontSize: 'clamp(10px, 2vw, 11px)', textDecoration: 'none' }}>Privacy Policy</Link>
          <span style={{ color: secondaryText, margin: '0 6px' }}>|</span>
          <Link to="/terms" style={{ color: '#2196f3', fontSize: 'clamp(10px, 2vw, 11px)', textDecoration: 'none' }}>Terms & Conditions</Link>
        </p>
      </div>
    </div>
  );
};