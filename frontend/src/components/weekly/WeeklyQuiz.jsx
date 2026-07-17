// src/components/weekly/WeeklyQuiz.jsx
import React, { useState, useEffect, useContext } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import ReactMarkdown from 'react-markdown';
import { AuthContext } from '../../context/AuthContext';
import { getHeadingColor, getSecondaryText, getTextColor } from '../../utils/theme';
import { LoadingWithBar } from '../common/LoadingWithBar';

export const WeeklyQuiz = () => {
  const navigate = useNavigate();                                 // ← NEW for Back button
  const [quiz, setQuiz] = useState(null);
  const [answers, setAnswers] = useState({});
  const [currentIndex, setCurrentIndex] = useState(0);
  const [submitted, setSubmitted] = useState(false);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(true);
  const [alreadyAttempted, setAlreadyAttempted] = useState(false);
  const [attemptScore, setAttemptScore] = useState(null);
  const [attemptPercentage, setAttemptPercentage] = useState(null);
  const [timeLeft, setTimeLeft] = useState(null);
  const [showReview, setShowReview] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const { token, darkMode, user } = useContext(AuthContext);    // ← added 'user'
  const headingColor = getHeadingColor(darkMode);
  const secondaryText = getSecondaryText(darkMode);
  const textColor = getTextColor(darkMode);

  // ===== AI Explanation States =====
  const [explanation, setExplanation] = useState({});
  const [loadingExplanation, setLoadingExplanation] = useState({});
  const [explanationRemaining, setExplanationRemaining] = useState(null);
  const [isPremium, setIsPremium] = useState(false);

  // ===== NEW: Premium block state =====
  const [showPremiumBlock, setShowPremiumBlock] = useState(false);

  let weeklyQuizCache = null;
  let weeklyQuizPromise = null;

  useEffect(() => {
    const fetchQuiz = async () => {
      setLoading(true);
      try {
        if (weeklyQuizCache) {
          setQuiz(weeklyQuizCache.quiz);
          setAlreadyAttempted(weeklyQuizCache.alreadyAttempted);
          if (weeklyQuizCache.alreadyAttempted) {
            setAttemptScore(weeklyQuizCache.attemptScore);
            setAttemptPercentage(weeklyQuizCache.attemptPercentage);
          } else if (weeklyQuizCache.quiz.timeLimit) {
            setTimeLeft(weeklyQuizCache.quiz.timeLimit * 60);
          }
          // ---- Check premium block ----
          if (weeklyQuizCache.quiz.isPremium && !user?.isPremium) {
            setShowPremiumBlock(true);
          }
          setLoading(false);
          return;
        }

        if (weeklyQuizPromise) {
          const data = await weeklyQuizPromise;
          setQuiz(data.quiz);
          setAlreadyAttempted(data.alreadyAttempted);
          if (data.alreadyAttempted) {
            setAttemptScore(data.attemptScore);
            setAttemptPercentage(data.attemptPercentage);
          } else if (data.quiz.timeLimit) {
            setTimeLeft(data.quiz.timeLimit * 60);
          }
          if (data.quiz.isPremium && !user?.isPremium) {
            setShowPremiumBlock(true);
          }
          setLoading(false);
          return;
        }

        weeklyQuizPromise = (async () => {
          const res = await axios.get('/api/weekly-quiz/current', {
            headers: { Authorization: `Bearer ${token}` }
          });
          if (res.data.success) {
            weeklyQuizCache = {
              quiz: res.data.quiz,
              alreadyAttempted: res.data.alreadyAttempted,
              attemptScore: res.data.quiz.attemptScore || null,
              attemptPercentage: res.data.quiz.attemptPercentage || null
            };
            return weeklyQuizCache;
          }
          return null;
        })();

        const data = await weeklyQuizPromise;
        if (data) {
          setQuiz(data.quiz);
          setAlreadyAttempted(data.alreadyAttempted);
          if (data.alreadyAttempted) {
            setAttemptScore(data.attemptScore);
            setAttemptPercentage(data.attemptPercentage);
          } else if (data.quiz.timeLimit) {
            setTimeLeft(data.quiz.timeLimit * 60);
          }
          if (data.quiz.isPremium && !user?.isPremium) {
            setShowPremiumBlock(true);
          }
        }
      } catch (error) {
        console.error('Error fetching weekly quiz:', error);
        alert('Failed to load weekly quiz. Please try again.');
      } finally {
        setLoading(false);
        weeklyQuizPromise = null;
      }
    };
    fetchQuiz();
  }, [token, user?.isPremium]);                          // ← added user?.isPremium dependency

  // ===== Fetch remaining explanations =====
  useEffect(() => {
    const fetchRemaining = async () => {
      try {
        const res = await axios.get('/api/explanation-remaining', {
          headers: { Authorization: `Bearer ${token}` }
        });
        setExplanationRemaining(res.data.remaining);
        setIsPremium(res.data.isPremium);
      } catch (error) {
        console.error('Failed to fetch explanation limit:', error);
      }
    };
    if (token) fetchRemaining();
  }, [token]);

  useEffect(() => {
    if (!timeLeft || timeLeft <= 0 || submitted) return;
    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          handleSubmit();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [timeLeft, submitted]);

  const handleAnswer = (index, answerIndex) => {
    setAnswers(prev => ({ ...prev, [index]: answerIndex }));
  };

  const handleSubmit = async () => {
    if (!quiz) return;
    const answeredCount = Object.keys(answers).length;
    if (answeredCount < quiz.questions.length) {
      alert(`Please answer all questions (${answeredCount}/${quiz.questions.length})`);
      return;
    }
    setSubmitting(true);
    try {
      const res = await axios.post('/api/weekly-quiz/submit', {
        quizId: quiz._id,
        answers: answers,
        timeSpent: (quiz.timeLimit * 60) - (timeLeft || 0)
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setResult(res.data);
      setSubmitted(true);
    } catch (error) {
      alert(error.response?.data?.error || 'Failed to submit quiz');
    } finally {
      setSubmitting(false);
    }
  };

  const goToQuestion = (index) => {
    if (index >= 0 && index < quiz?.questions?.length) {
      setCurrentIndex(index);
    }
  };

  // ===== Get AI explanation for a question =====
  const getExplanation = async (idx) => {
    if (!isPremium && explanationRemaining <= 0) {
      alert('You have used all your free explanations for today (10/day). Upgrade to Premium for unlimited!');
      return;
    }
    
    setLoadingExplanation({ ...loadingExplanation, [idx]: true });
    try {
      const question = quiz.questions[idx];
      const res = await axios.post('/api/explain-question', {
        questionText: question.questionText,
        options: question.options,
        correctAnswer: question.correctAnswer,
        userAnswer: answers[idx]
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

  if (loading) return <LoadingWithBar message="Loading Weekly Quiz..." />;

  // ===== NEW: Premium Block =====
  if (showPremiumBlock) {
    return (
      <div style={{ background: darkMode ? '#1a1a2e' : '#f0f7f4', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
        <div style={{ maxWidth: 400, width: '100%', background: darkMode ? '#16213e' : 'white', borderRadius: 20, padding: 32, textAlign: 'center', boxShadow: '0 4px 15px rgba(0,0,0,0.1)' }}>
          <div style={{ fontSize: 56, marginBottom: 16 }}>⭐</div>
          <h2 style={{ color: headingColor, marginBottom: 8 }}>Premium Quiz</h2>
          <p style={{ color: secondaryText, marginBottom: 20 }}>
            This week's quiz is a premium feature. Upgrade to access it and all other premium content.
          </p>
          <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link to="/get-premium" style={{ flex: 1, minWidth: '120px' }}>
              <button style={{ width: '100%', background: '#ff9800', color: 'white', padding: '12px 20px', border: 'none', borderRadius: 10, cursor: 'pointer', fontWeight: 'bold', fontSize: 14 }}>
                ⭐ Upgrade Now
              </button>
            </Link>
            <button
              onClick={() => navigate('/')}
              style={{ flex: 1, minWidth: '120px', background: '#6c757d', color: 'white', padding: '12px 20px', border: 'none', borderRadius: 10, cursor: 'pointer', fontWeight: 'bold', fontSize: 14 }}
            >
              ← Back
            </button>
          </div>
          <p style={{ marginTop: 16, fontSize: 13, color: secondaryText }}>
            Already a premium user? <Link to="/login" style={{ color: '#2196f3', textDecoration: 'none' }}>Sign in</Link>
          </p>
        </div>
      </div>
    );
  }

  if (!quiz) {
    return (
      <div style={{ background: darkMode ? '#1a1a2e' : '#f0f7f4', minHeight: '100vh', padding: '50px', textAlign: 'center' }}>
        <div style={{ fontSize: 64, marginBottom: 20 }}>📅</div>
        <h2 style={{ color: headingColor }}>No Active Weekly Quiz</h2>
        <p style={{ color: secondaryText }}>Check back next week for a new quiz!</p>
        <Link to="/"><button style={{ marginTop: 20, background: '#1e3c72', color: 'white', padding: '10px 20px', border: 'none', borderRadius: 8, cursor: 'pointer' }}>Go Home</button></Link>
      </div>
    );
  }

  if (alreadyAttempted) {
    return (
      <div style={{ background: darkMode ? '#1a1a2e' : '#f0f7f4', minHeight: '100vh', padding: '20px' }}>
        <div style={{ maxWidth: 600, margin: '0 auto', background: darkMode ? '#16213e' : 'white', borderRadius: 20, padding: 30, textAlign: 'center' }}>
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

  // ===== REVIEW VIEW with AI =====
  if (submitted && showReview && quiz) {
    const allQuestions = quiz.questions;
    return (
      <div style={{ background: darkMode ? '#1a1a2e' : '#f0f7f4', minHeight: '100vh', padding: '20px' }}>
        <div style={{ maxWidth: 800, margin: '0 auto' }}>
          <div style={{ background: darkMode ? '#16213e' : 'white', borderRadius: 16, padding: 20, marginBottom: 20, textAlign: 'center' }}>
            <h2 style={{ color: headingColor, fontSize: 22 }}>Answer Review</h2>
            <p style={{ fontSize: 14 }}>Score: {result.score}/{result.total} ({result.percentage}%)</p>
            <button onClick={() => setShowReview(false)} style={{ background: '#6c757d', color: 'white', padding: '8px 16px', border: 'none', borderRadius: 8, cursor: 'pointer', fontSize: 13, marginTop: 10 }}>Back to Results</button>
          </div>

          {/* ===== Remaining counter ===== */}
          {!isPremium && explanationRemaining !== null && (
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

          {allQuestions.map((q, idx) => {
            const userAnswer = answers[idx];
            const isCorrect = userAnswer !== undefined && userAnswer === q.correctAnswer;
            return (
              <div key={idx} style={{ background: darkMode ? '#16213e' : 'white', borderRadius: 12, padding: 16, marginBottom: 12, borderLeft: `5px solid ${isCorrect ? '#4caf50' : '#f44336'}` }}>
                <h4 style={{ fontSize: 15, marginBottom: 10 }}>Q{idx+1}: {q.questionText}</h4>
                {q.options.map((opt, optIdx) => (
                  <div key={optIdx} style={{ padding: '10px 12px', margin: '6px 0', background: optIdx === q.correctAnswer ? '#c8e6c9' : (optIdx === userAnswer ? '#ffcdd2' : '#f5f5f5'), borderRadius: 10, fontSize: 14 }}>
                    <span style={{ fontWeight: 'bold', marginRight: 10 }}>{String.fromCharCode(65 + optIdx)}.</span> {opt}
                    {optIdx === q.correctAnswer && <span style={{ color: '#4caf50', marginLeft: 10, fontSize: 12 }}>✓ Correct</span>}
                    {optIdx === userAnswer && optIdx !== q.correctAnswer && <span style={{ color: '#f44336', marginLeft: 10, fontSize: 12 }}>✗ Your Answer</span>}
                  </div>
                ))}

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
                      <span style={{ display: 'inline-block', width: 14, height: 14, border: '2px solid #fff', borderTop: '2px solid transparent', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
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
          <Link to="/"><button style={{ width: '100%', marginTop: 20, background: '#1e3c72', color: 'white', padding: 14, border: 'none', borderRadius: 10, cursor: 'pointer', fontWeight: 'bold' }}>Home</button></Link>
          <style>{`
            @keyframes spin {
              0% { transform: rotate(0deg); }
              100% { transform: rotate(360deg); }
            }
          `}</style>
        </div>
      </div>
    );
  }

  if (submitted && result) {
    return (
      <div style={{ background: darkMode ? '#1a1a2e' : '#f0f7f4', minHeight: '100vh', padding: '20px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column' }}>
        <div style={{ maxWidth: 500, width: '100%', background: darkMode ? '#16213e' : 'white', borderRadius: 20, padding: 32, textAlign: 'center' }}>
          <h2 style={{ color: headingColor, fontSize: 24 }}>Weekly Quiz Results</h2>
          <p style={{ fontSize: 36, margin: '20px 0' }}>Score: <strong style={{ color: headingColor }}>{result.score}</strong> / {result.total}</p>
          <p style={{ fontSize: 24, marginBottom: 20 }}>Percentage: <strong>{result.percentage}%</strong></p>
          <p style={{ fontSize: 24, color: result.passed ? '#2e7d32' : '#dc3545', fontWeight: 'bold' }}>
            {result.passed ? '✓ PASSED!' : '✗ Failed'}
          </p>
          <div style={{ display: 'flex', gap: 12, marginTop: 24, justifyContent: 'center', flexWrap: 'wrap' }}>
            <button onClick={() => setShowReview(true)} style={{ background: '#1e3c72', color: 'white', padding: '10px 20px', border: 'none', borderRadius: 10, cursor: 'pointer', fontWeight: 'bold' }}>Review Answers</button>
            <Link to="/weekly-leaderboard"><button style={{ background: '#ff9800', color: 'white', padding: '10px 20px', border: 'none', borderRadius: 10, cursor: 'pointer', fontWeight: 'bold' }}>🏆 View Leaderboard</button></Link>
            <Link to="/"><button style={{ background: '#6c757d', color: 'white', padding: '10px 20px', border: 'none', borderRadius: 10, cursor: 'pointer', fontWeight: 'bold' }}>Home</button></Link>
          </div>
        </div>
      </div>
    );
  }

  // Active exam view (unchanged)
  const currentQuestion = quiz.questions[currentIndex];
  const totalQuestions = quiz.questions.length;
  const answeredCount = Object.keys(answers).length;

  const minutes = Math.floor((timeLeft || 0) / 60);
  const seconds = (timeLeft || 0) % 60;

  return (
    <div style={{ background: darkMode ? '#1a1a2e' : '#f0f7f4', minHeight: '100vh' }}>
      <div style={{
        position: 'sticky',
        top: 0,
        zIndex: 1000,
        background: (timeLeft || 0) < 120 ? '#f44336' : '#1e3c72',
        color: 'white',
        padding: '12px 20px',
        textAlign: 'center',
        fontSize: 22,
        fontWeight: 'bold',
        boxShadow: '0 2px 10px rgba(0,0,0,0.1)'
      }}>
        ⏰ {minutes}:{seconds.toString().padStart(2, '0')}
        {(timeLeft || 0) < 120 && <span style={{ marginLeft: 10, fontSize: 14 }}>⚠️ TIME RUNNING OUT!</span>}
      </div>
      <div style={{ padding: '20px', maxWidth: 1000, margin: '0 auto' }}>
        <div style={{ background: darkMode ? '#16213e' : 'white', borderRadius: 16, padding: 20, marginBottom: 20, textAlign: 'center' }}>
          <h2 style={{ color: headingColor, margin: 0, fontSize: 20 }}>{quiz.title}</h2>
          <p style={{ fontSize: 14, marginTop: 4 }}>Question {currentIndex+1} of {totalQuestions}</p>
          <p style={{ fontSize: 13, color: secondaryText }}>Answered: {answeredCount}/{totalQuestions}</p>
        </div>

        <div style={{ background: '#1e3c72', borderRadius: 16, padding: 20, marginBottom: 20 }}>
          <h4 style={{ color: 'white', marginBottom: 16, fontSize: 16 }}>Question {currentIndex+1}: {currentQuestion.questionText}</h4>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {currentQuestion.options.map((opt, optIdx) => (
              <label key={optIdx} style={{
                display: 'flex', alignItems: 'center', cursor: 'pointer', padding: 12, margin: 0,
                background: 'white', border: answers[currentIndex] === optIdx ? '2px solid #1e3c72' : '2px solid #e0e0e0',
                transition: 'all 0.2s ease', fontWeight: answers[currentIndex] === optIdx ? 'bold' : 'normal'
              }}>
                <input type="radio" name="currentQuestion" onChange={() => handleAnswer(currentIndex, optIdx)} checked={answers[currentIndex] === optIdx} style={{ marginRight: 15, width: 18, height: 18 }} />
                <span style={{ fontWeight: 'bold', marginRight: 10, fontSize: 14 }}>{String.fromCharCode(65 + optIdx)}.</span>
                <span style={{ fontSize: 14 }}>{opt}</span>
              </label>
            ))}
          </div>
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, marginBottom: 30 }}>
          <button onClick={() => goToQuestion(currentIndex-1)} disabled={currentIndex === 0} style={{ background: currentIndex === 0 ? '#ccc' : '#1e3c72', color: 'white', padding: '10px 20px', border: 'none', borderRadius: 8, cursor: currentIndex === 0 ? 'not-allowed' : 'pointer', fontWeight: 'bold' }}>← Previous</button>
          <button onClick={() => goToQuestion(currentIndex+1)} disabled={currentIndex === totalQuestions-1} style={{ background: currentIndex === totalQuestions-1 ? '#ccc' : '#1e3c72', color: 'white', padding: '10px 20px', border: 'none', borderRadius: 8, cursor: currentIndex === totalQuestions-1 ? 'not-allowed' : 'pointer', fontWeight: 'bold' }}>Next →</button>
        </div>

        <div style={{ background: darkMode ? '#16213e' : 'white', borderRadius: 16, padding: 20, marginBottom: 20 }}>
          <p style={{ fontSize: 14, fontWeight: 'bold', marginBottom: 12, color: darkMode ? '#fff' : '#333' }}>Question Palette</p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
            {quiz.questions.map((_, idx) => {
              const isAnswered = answers[idx] !== undefined;
              return (
                <button key={idx} onClick={() => goToQuestion(idx)} style={{
                  width: 40, height: 40, borderRadius: 8,
                  background: idx === currentIndex ? '#ff9800' : (isAnswered ? '#4caf50' : (darkMode ? '#444' : '#e0e0e0')),
                  color: (idx === currentIndex || isAnswered) ? 'white' : (darkMode ? headingColor : '#333'),
                  fontWeight: 'bold', border: 'none', cursor: 'pointer'
                }}>
                  {idx+1}
                </button>
              );
            })}
          </div>
        </div>

        <button 
          onClick={handleSubmit} 
          disabled={answeredCount < totalQuestions || submitting}
          style={{ 
            width: '100%', 
            background: answeredCount === totalQuestions ? '#28a745' : '#ccc', 
            color: 'white', 
            padding: 14, 
            border: 'none', 
            borderRadius: 50, 
            cursor: (answeredCount === totalQuestions && !submitting) ? 'pointer' : 'not-allowed', 
            fontSize: 16, 
            fontWeight: 'bold', 
            marginBottom: 30, 
            opacity: (answeredCount === totalQuestions && !submitting) ? 1 : 0.7,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '10px'
          }}
        >
          {submitting ? (
            <>
              <span style={{
                display: 'inline-block',
                width: 20,
                height: 20,
                border: '3px solid rgba(255,255,255,0.3)',
                borderTop: '3px solid #fff',
                borderRadius: '50%',
                animation: 'spin 0.8s linear infinite'
              }} />
              Submitting...
            </>
          ) : (
            answeredCount === totalQuestions ? 'Submit Weekly Quiz' : `Please answer all questions (${answeredCount}/${totalQuestions})`
          )}
        </button>
        <style>{`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    </div>
  );
};