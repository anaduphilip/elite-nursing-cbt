// src/components/profile/ReviewExam.jsx
import React, { useState, useEffect, useContext } from 'react';
import { Link, useParams } from 'react-router-dom';
import axios from 'axios';
import ReactMarkdown from 'react-markdown';
import { AuthContext } from '../../context/AuthContext';
import { getExamAttempt } from '../../utils/quizHelpers';
import { getHeadingColor, getSecondaryText, getTextColor } from '../../utils/theme';
import { LoadingWithBar } from '../common/LoadingWithBar';

export const ReviewExam = () => {
  const { id } = useParams();
  const [attempt, setAttempt] = useState(null);
  const [quiz, setQuiz] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isPreCouncil, setIsPreCouncil] = useState(false);
  const [isPremiumLocked, setIsPremiumLocked] = useState(false);
  const { token, darkMode, user } = useContext(AuthContext);
  const headingColor = getHeadingColor(darkMode);
  const secondaryText = getSecondaryText(darkMode);
  const textColor = getTextColor(darkMode);

  // ===== AI Explanation States =====
  const [explanation, setExplanation] = useState({});
  const [loadingExplanation, setLoadingExplanation] = useState({});
  const [explanationRemaining, setExplanationRemaining] = useState(null);
  const [isPremiumUser, setIsPremiumUser] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const saved = getExamAttempt(id);
        if (!saved) {
          alert('No saved attempt found for this exam.');
          window.location.href = '/history';
          return;
        }
        setAttempt(saved);

        // ===== NEW: Check if it's a PreCouncil attempt =====
        if (saved.isPreCouncil) {
          setIsPreCouncil(true);
          // PreCouncil: use stored questions and check premium lock
          if (saved.isPremium) {
            const isUserPremium = user?.isPremium && user?.premiumExpiry && new Date(user.premiumExpiry) > new Date();
            if (!isUserPremium) {
              setIsPremiumLocked(true);
              setLoading(false);
              return;
            }
          }
          // No backend fetch needed – we'll use saved.questions
          setQuiz({ questions: saved.questions, title: saved.title });
          setLoading(false);
          return;
        }

        // ---- Regular exam (existing logic) ----
        const res = await axios.get(`/api/quizzes/${id}`, { headers: { Authorization: `Bearer ${token}` } });
        setQuiz(res.data);
      } catch (error) {
        console.error(error);
        alert('Failed to load review data.');
      } finally {
        setLoading(false);
      }
    };
    if (id && token) fetchData();
  }, [id, token, user]);

  // ===== Fetch remaining explanations =====
  useEffect(() => {
    const fetchRemaining = async () => {
      try {
        const res = await axios.get('/api/explanation-remaining', {
          headers: { Authorization: `Bearer ${token}` }
        });
        setExplanationRemaining(res.data.remaining);
        setIsPremiumUser(res.data.isPremium);
      } catch (error) {
        console.error('Failed to fetch explanation limit:', error);
      }
    };
    if (token) fetchRemaining();
  }, [token]);

  // ===== Get AI explanation for a question =====
  const getExplanation = async (idx) => {
    if (!isPremiumUser && explanationRemaining <= 0) {
      alert('You have used all your free explanations for today (10/day). Upgrade to Premium for unlimited!');
      return;
    }
    
    setLoadingExplanation({ ...loadingExplanation, [idx]: true });
    try {
      const question = questions[idx];
      const res = await axios.post('/api/explain-question', {
        questionText: question.questionText,
        options: question.options,
        correctAnswer: question.correctAnswer,
        userAnswer: userAnswers[idx]
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      setExplanation({ ...explanation, [idx]: res.data.explanation });
      setExplanationRemaining(res.data.remaining);
    } catch (error) {
      if (error.response?.status === 403 && error.response?.data?.limitReached) {
        alert('Daily explanation limit reached (10/day). Upgrade to Premium for unlimited!');
      } else {
        alert(error.response?.data?.error || 'Failed to generate explanation. Please try again.');
      }
    } finally {
      setLoadingExplanation({ ...loadingExplanation, [idx]: false });
    }
  };

  // ===== Close/Dismiss explanation =====
  const closeExplanation = (idx) => {
    setExplanation((prev) => {
      const updated = { ...prev };
      delete updated[idx];
      return updated;
    });
  };

  if (loading) return <LoadingWithBar message="Loading review..." />;

  // ===== NEW: Premium lock screen for PreCouncil premium exams =====
  if (isPremiumLocked) {
    return (
      <div style={{ background: darkMode ? '#1a1a2e' : '#f0f7f4', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ background: darkMode ? '#16213e' : 'white', borderRadius: 20, padding: 32, maxWidth: 400, textAlign: 'center' }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>⭐</div>
          <h2 style={{ color: headingColor }}>Premium Required</h2>
          <p>This Pre-Council exam (Section 2+) requires a premium subscription to review.</p>
          <div style={{ display: 'flex', gap: 12, marginTop: 20 }}>
            <Link to="/history" style={{ flex: 1 }}>
              <button style={{ width: '100%', background: '#6c757d', color: 'white', padding: '12px', border: 'none', borderRadius: 8, cursor: 'pointer', fontWeight: 'bold' }}>Back to History</button>
            </Link>
            <Link to="/get-premium" style={{ flex: 1 }}>
              <button style={{ width: '100%', background: '#ff9800', color: 'white', padding: '12px', border: 'none', borderRadius: 8, cursor: 'pointer', fontWeight: 'bold' }}>Upgrade Now</button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (!attempt || !quiz) return <div>Review data not found</div>;

  const questions = quiz.questions;
  const userAnswers = attempt.answers;

  return (
    <div style={{ background: darkMode ? '#1a1a2e' : '#f0f7f4', minHeight: '100vh', padding: '20px' }}>
      <div style={{ maxWidth: 800, margin: '0 auto' }}>
        <div style={{ marginBottom: 24 }}>
          <Link to="/history" style={{ textDecoration: 'none', color: headingColor }}>← Back to History</Link>
        </div>

        {/* ===== Remaining counter ===== */}
        {!isPremiumUser && explanationRemaining !== null && (
          <div style={{
            textAlign: 'center',
            padding: 8,
            background: darkMode ? '#2d2d3d' : '#fff3e0',
            borderRadius: 8,
            marginBottom: 16
          }}>
            <span style={{ color: '#ff9800' }}>
              🎯 {explanationRemaining} AI explanation{explanationRemaining !== 1 ? 's' : ''} remaining today
              {explanationRemaining === 0 && ' – Upgrade to Premium for unlimited!'}
            </span>
          </div>
        )}

        <div style={{ background: darkMode ? '#16213e' : 'white', borderRadius: 16, padding: 24, textAlign: 'center', marginBottom: 20 }}>
          <h2 style={{ color: headingColor }}>{attempt.title}</h2>
          <p>Your Score: {attempt.score}/{attempt.total} ({attempt.percentage}%)</p>
          <p>Completed: {new Date(attempt.completedAt).toLocaleString()}</p>
          {/* ===== NEW: PreCouncil badge ===== */}
          {attempt.isPreCouncil && (
            <span style={{ display: 'inline-block', background: '#ff9800', color: 'white', fontSize: 12, fontWeight: 'bold', padding: '4px 12px', borderRadius: 12, marginTop: 6 }}>
              Pre-Council Exam {attempt.sectionNumber || ''}
            </span>
          )}
        </div>

        {questions.map((q, idx) => {
          const userAnswer = userAnswers[idx];
          const isCorrect = (userAnswer !== undefined && userAnswer === q.correctAnswer);
          return (
            <div key={idx} style={{ background: darkMode ? '#16213e' : 'white', borderRadius: 12, padding: 16, marginBottom: 16, borderLeft: `5px solid ${isCorrect ? '#4caf50' : '#f44336'}` }}>
              <h4 style={{ marginBottom: 12 }}>Q{idx+1}: {q.questionText}</h4>
              {q.options.map((opt, optIdx) => {
                let bgColor = '#f5f5f5';
                if (optIdx === q.correctAnswer) bgColor = '#c8e6c9';
                if (optIdx === userAnswer && optIdx !== q.correctAnswer) bgColor = '#ffcdd2';
                return (
                  <div key={optIdx} style={{ padding: '10px 12px', margin: '6px 0', background: bgColor, borderRadius: 8, fontSize: 14 }}>
                    <span style={{ fontWeight: 'bold', marginRight: 10 }}>{String.fromCharCode(65 + optIdx)}.</span> {opt}
                    {optIdx === q.correctAnswer && <span style={{ color: '#4caf50', marginLeft: 10, fontSize: 12 }}>✓ Correct Answer</span>}
                    {optIdx === userAnswer && optIdx !== q.correctAnswer && <span style={{ color: '#f44336', marginLeft: 10, fontSize: 12 }}>✗ Your Answer</span>}
                  </div>
                );
              })}

              {/* ===== AI EXPLANATION BUTTON ===== */}
              <button
                onClick={() => getExplanation(idx)}
                disabled={loadingExplanation[idx]}
                style={{
                  marginTop: 12,
                  background: loadingExplanation[idx] ? '#6c757d' : '#ff9800',
                  color: 'white',
                  padding: '6px 16px',
                  border: 'none',
                  borderRadius: 6,
                  cursor: loadingExplanation[idx] ? 'not-allowed' : 'pointer',
                  fontWeight: 'bold',
                  fontSize: 13,
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 6
                }}
              >
                {loadingExplanation[idx] ? (
                  <>
                    <span style={{ display: 'inline-block', animation: 'spin 0.8s linear infinite' }}></span>
                    Generating...
                  </>
                ) : (
                  'Explain with AI'
                )}
              </button>

              {/* ===== AI EXPLANATION DISPLAY WITH CLOSE BUTTON ===== */}
              {explanation[idx] && (
                <div style={{
                  marginTop: 12,
                  padding: 16,
                  paddingRight: 40,
                  background: darkMode ? '#1a1a2e' : '#f0f7f4',
                  borderRadius: 8,
                  borderLeft: '4px solid #ff9800',
                  textAlign: 'left',
                  position: 'relative'
                }}>
                  {/* Close button */}
                  <button
                    onClick={() => closeExplanation(idx)}
                    style={{
                      position: 'absolute',
                      top: 8,
                      right: 10,
                      background: 'none',
                      border: 'none',
                      fontSize: 18,
                      cursor: 'pointer',
                      color: secondaryText,
                      padding: '4px 8px',
                      borderRadius: 4,
                      lineHeight: 1,
                      transition: 'background 0.2s'
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.background = darkMode ? '#333' : '#e0e0e0'}
                    onMouseLeave={(e) => e.currentTarget.style.background = 'none'}
                    aria-label="Close explanation"
                  >
                    ✕
                  </button>

                  <div style={{ fontWeight: 'bold', color: '#ff9800', marginBottom: 8, textAlign: 'left' }}>AI Explanation</div>
                  <ReactMarkdown
                    components={{
                      p: ({ children }) => (
                        <p style={{ margin: '4px 0', fontSize: 14, color: textColor, lineHeight: 1.6, textAlign: 'left' }}>
                          {children}
                        </p>
                      ),
                      strong: ({ children }) => (
                        <strong style={{ color: headingColor, fontWeight: 'bold' }}>{children}</strong>
                      ),
                      ul: ({ children }) => (
                        <ul style={{ paddingLeft: 20, margin: '4px 0', listStyleType: 'disc', textAlign: 'left' }}>
                          {children}
                        </ul>
                      ),
                      li: ({ children }) => (
                        <li style={{ margin: '2px 0', fontSize: 14, color: textColor, lineHeight: 1.6, textAlign: 'left' }}>
                          {children}
                        </li>
                      ),
                      h3: ({ children }) => (
                        <h3 style={{ margin: '8px 0 4px', fontSize: 15, color: headingColor, fontWeight: 'bold', textAlign: 'left' }}>
                          {children}
                        </h3>
                      )
                    }}
                  >
                    {explanation[idx]}
                  </ReactMarkdown>
                </div>
              )}
            </div>
          );
        })}

        <div style={{ textAlign: 'center', marginTop: 24 }}>
          <Link to="/history"><button style={{ background: '#1e3c72', color: 'white', padding: '10px 20px', border: 'none', borderRadius: 8, cursor: 'pointer' }}>Back to History</button></Link>
        </div>
      </div>
    </div>
  );
};