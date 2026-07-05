// src/components/weekly/WeeklyQuizLanding.jsx
import React, { useState, useEffect, useContext } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { AuthContext } from '../../context/AuthContext';
import { getHeadingColor, getSecondaryText, getTextColor, getCardBg } from '../../utils/theme';
import { LoadingWithBar } from '../common/LoadingWithBar';

export const WeeklyQuizLanding = () => {
  const [quiz, setQuiz] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showStartDialog, setShowStartDialog] = useState(false);
  const [alreadyAttempted, setAlreadyAttempted] = useState(false);
  const [attemptScore, setAttemptScore] = useState(null);
  const [attemptPercentage, setAttemptPercentage] = useState(null);
  const { token, darkMode, user } = useContext(AuthContext);
  const headingColor = getHeadingColor(darkMode);
  const secondaryText = getSecondaryText(darkMode);
  const textColor = getTextColor(darkMode);
  const cardBg = getCardBg(darkMode);

  useEffect(() => {
    const fetchQuiz = async () => {
      setLoading(true);
      try {
        const res = await axios.get('/api/weekly-quiz/current', {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (res.data.success) {
          setQuiz(res.data.quiz);
          setAlreadyAttempted(res.data.alreadyAttempted);
          if (res.data.alreadyAttempted) {
            setAttemptScore(res.data.quiz.attemptScore);
            setAttemptPercentage(res.data.quiz.attemptPercentage);
          }
        }
      } catch (error) {
        console.error('Error fetching weekly quiz:', error);
        alert('Failed to load weekly quiz. Please try again.');
      } finally {
        setLoading(false);
      }
    };
    fetchQuiz();
  }, [token]);

  const handleStartQuiz = () => {
    setShowStartDialog(true);
  };

  const handleConfirmStart = () => {
    setShowStartDialog(false);
    window.location.href = `/weekly-quiz/take/${quiz._id}`;
  };

  if (loading) return <LoadingWithBar message="Loading Weekly Quiz..." />;

  if (!quiz) {
    return (
      <div style={{ background: darkMode ? '#1a1a2e' : '#f0f7f4', minHeight: '100vh', padding: '50px', textAlign: 'center' }}>
        <div style={{ fontSize: 64, marginBottom: 20 }}>📅</div>
        <h2 style={{ color: headingColor }}>No Active Weekly Quiz</h2>
        <p style={{ color: secondaryText }}>Check back soon for a new quiz!</p>
        <Link to="/"><button style={{ marginTop: 20, background: '#1e3c72', color: 'white', padding: '10px 20px', border: 'none', borderRadius: 8, cursor: 'pointer' }}>Go Home</button></Link>
      </div>
    );
  }

  if (alreadyAttempted) {
    return (
      <div style={{ background: darkMode ? '#1a1a2e' : '#f0f7f4', minHeight: '100vh', padding: '20px' }}>
        <div style={{ maxWidth: 600, margin: '0 auto', background: cardBg, borderRadius: 20, padding: 30, textAlign: 'center' }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>✅</div>
          <h2 style={{ color: headingColor }}>You've Already Completed This Week's Quiz!</h2>
          <p style={{ fontSize: 18, margin: '10px 0', color: headingColor }}>Your Score: <strong>{attemptScore}</strong></p>
          <p style={{ fontSize: 18, margin: '10px 0', color: headingColor }}>Percentage: <strong>{attemptPercentage}%</strong></p>
          <p style={{ color: secondaryText, marginTop: 20 }}>Check back next week for a new quiz.</p>
          <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link to="/weekly-leaderboard"><button style={{ marginTop: 20, background: '#ff9800', color: 'white', padding: '10px 20px', border: 'none', borderRadius: 8, cursor: 'pointer', fontWeight: 'bold' }}>🏆 View Leaderboard</button></Link>
            <Link to="/"><button style={{ marginTop: 20, background: '#1e3c72', color: 'white', padding: '10px 20px', border: 'none', borderRadius: 8, cursor: 'pointer' }}>Go Home</button></Link>
          </div>
        </div>
      </div>
    );
  }

  if (quiz.isPremium && !user?.isPremium) {
    return (
      <div style={{ background: darkMode ? '#1a1a2e' : '#f0f7f4', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
        <div style={{ background: cardBg, borderRadius: 20, padding: 32, maxWidth: 400, textAlign: 'center' }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>⭐</div>
          <h2 style={{ color: headingColor }}>Premium Quiz</h2>
          <p style={{ color: secondaryText }}>This week's quiz is premium content. Upgrade to access it.</p>
          <Link to="/get-premium">
            <button style={{ marginTop: 20, background: '#ff9800', color: 'white', padding: '12px 24px', border: 'none', borderRadius: 8, cursor: 'pointer', fontWeight: 'bold' }}>Upgrade Now</button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div style={{ background: darkMode ? '#1a1a2e' : '#f0f7f4', minHeight: '100vh', padding: '20px' }}>
      {showStartDialog && (
        <div style={{
          position: 'fixed',
          top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0,0,0,0.7)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 2000,
          padding: '20px'
        }}>
          <div style={{
            background: cardBg,
            borderRadius: 20,
            padding: 28,
            maxWidth: 450,
            width: '100%',
            maxHeight: '90vh',
            overflowY: 'auto',
            textAlign: 'center',
            boxShadow: '0 8px 30px rgba(0,0,0,0.3)'
          }}>
            <div style={{ fontSize: 48, marginBottom: 12 }}>📝</div>
            <h2 style={{ color: headingColor, marginBottom: 8 }}>Ready to Start?</h2>
            <p style={{ color: secondaryText, marginBottom: 16 }}>Please read the instructions before you begin.</p>
            
            <div style={{
              background: darkMode ? '#1a1a2e' : '#f0f7f4',
              padding: '16px 18px',
              borderRadius: 12,
              marginBottom: 20,
              textAlign: 'left'
            }}>
              <h4 style={{ color: headingColor, marginBottom: 8 }}>📋 Instructions</h4>
              <p style={{ color: textColor, fontSize: 14, whiteSpace: 'pre-wrap' }}>
                {quiz.instructions || 'No specific instructions for this quiz. Answer all questions and submit before the timer runs out.'}
              </p>
              <div style={{ marginTop: 12, paddingTop: 12, borderTop: `1px solid ${darkMode ? '#444' : '#ddd'}` }}>
                <p style={{ color: textColor, fontSize: 13, margin: '4px 0' }}>
                  <strong>Questions:</strong> {quiz.questions?.length || 0}
                </p>
                <p style={{ color: textColor, fontSize: 13, margin: '4px 0' }}>
                  <strong>Time Limit:</strong> {quiz.timeLimit || 20} minutes
                </p>
                <p style={{ color: textColor, fontSize: 13, margin: '4px 0' }}>
                  <strong>Passing Score:</strong> {quiz.passingScore || 70}%
                </p>
                {quiz.isPremium && (
                  <p style={{ color: '#ff9800', fontSize: 13, margin: '4px 0', fontWeight: 'bold' }}>
                    ⭐ This is a Premium Quiz
                  </p>
                )}
              </div>
            </div>

            <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
              <button
                onClick={() => setShowStartDialog(false)}
                style={{ flex: 1, background: '#6c757d', color: 'white', padding: '12px', border: 'none', borderRadius: 10, cursor: 'pointer', fontWeight: 'bold' }}
              >
                Back
              </button>
              <button
                onClick={handleConfirmStart}
                style={{ flex: 1, background: '#28a745', color: 'white', padding: '12px', border: 'none', borderRadius: 10, cursor: 'pointer', fontWeight: 'bold' }}
              >
                Start Quiz →
              </button>
            </div>
          </div>
        </div>
      )}

      <div style={{ maxWidth: 700, margin: '0 auto' }}>
        <Link to="/" style={{ display: 'inline-block', marginBottom: 20, color: headingColor, textDecoration: 'none' }}>
          ← Back to Home
        </Link>

        <div style={{
          background: `linear-gradient(135deg, #1e3c72 0%, #2a5298 100%)`,
          borderRadius: 20,
          padding: '32px 24px',
          marginBottom: 24,
          color: 'white',
          textAlign: 'center'
        }}>
          <div style={{ fontSize: 48, marginBottom: 12 }}>📅</div>
          <h1 style={{ margin: 0, fontSize: 'clamp(24px, 5vw, 28px)' }}>{quiz.title}</h1>
          <p style={{ marginTop: 8, fontSize: 14, opacity: 0.9 }}>{quiz.description}</p>
          <div style={{ display: 'flex', justifyContent: 'center', gap: 20, marginTop: 16, flexWrap: 'wrap' }}>
            <span style={{ background: 'rgba(255,255,255,0.2)', padding: '4px 14px', borderRadius: 20, fontSize: 13 }}>
              📝 {quiz.questions?.length || 0} Questions
            </span>
            <span style={{ background: 'rgba(255,255,255,0.2)', padding: '4px 14px', borderRadius: 20, fontSize: 13 }}>
              ⏰ {quiz.timeLimit || 20} minutes
            </span>
            <span style={{ background: 'rgba(255,255,255,0.2)', padding: '4px 14px', borderRadius: 20, fontSize: 13 }}>
              🎯 {quiz.passingScore || 70}% to pass
            </span>
            {quiz.isPremium && (
              <span style={{ background: '#ff9800', padding: '4px 14px', borderRadius: 20, fontSize: 13, fontWeight: 'bold' }}>
                ⭐ Premium
              </span>
            )}
          </div>
        </div>

        <div style={{ background: cardBg, borderRadius: 16, padding: 24, marginBottom: 20 }}>
          <h3 style={{ color: headingColor, marginBottom: 12 }}>📋 Instructions</h3>
          <p style={{ color: textColor, fontSize: 14, lineHeight: 1.6 }}>
            {quiz.instructions || 'Answer all questions carefully. You cannot go back to previous questions after submitting. Make sure you complete all questions before the timer runs out.'}
          </p>
        </div>

        <button
          onClick={handleStartQuiz}
          style={{
            width: '100%',
            background: '#28a745',
            color: 'white',
            padding: '16px',
            border: 'none',
            borderRadius: 12,
            cursor: 'pointer',
            fontWeight: 'bold',
            fontSize: '18px',
            boxShadow: '0 4px 15px rgba(40, 167, 69, 0.3)',
            transition: 'transform 0.2s, box-shadow 0.2s'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'translateY(-2px)';
            e.currentTarget.style.boxShadow = '0 6px 20px rgba(40, 167, 69, 0.4)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'translateY(0)';
            e.currentTarget.style.boxShadow = '0 4px 15px rgba(40, 167, 69, 0.3)';
          }}
        >
          🚀 Start Quiz
        </button>
      </div>
      <div style={{ textAlign: 'center', padding: '20px', marginTop: 20 }}>
        <p style={{ color: secondaryText, fontSize: 12 }}>© 2026 ELITE Nursing & Midwifery CBT. All rights reserved.</p>
      </div>
    </div>
  );
};