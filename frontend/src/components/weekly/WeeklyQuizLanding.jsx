// src/components/weekly/WeeklyQuizLanding.jsx
import React, { useState, useEffect, useContext } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import ReactMarkdown from 'react-markdown';
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
  const [attemptId, setAttemptId] = useState(null);

  // ===== Past Review States =====
  const [showPastReview, setShowPastReview] = useState(false);
  const [pastAttemptData, setPastAttemptData] = useState(null);
  const [loadingPast, setLoadingPast] = useState(false);

  // ===== AI Explanation States =====
  const [explanation, setExplanation] = useState({});
  const [loadingExplanation, setLoadingExplanation] = useState({});
  const [explanationRemaining, setExplanationRemaining] = useState(null);
  const [isPremium, setIsPremium] = useState(false);

  const { token, darkMode, user } = useContext(AuthContext);
  const headingColor = getHeadingColor(darkMode);
  const secondaryText = getSecondaryText(darkMode);
  const textColor = getTextColor(darkMode);
  const cardBg = getCardBg(darkMode);
  const navigate = useNavigate();

  const formatPercentage = (value) => {
    if (value === null || value === undefined) return '0';
    return Number(value).toFixed(1);
  };

  const goBack = () => navigate(-1);

  // Floating Back Button style
  const backButtonStyle = {
    position: 'fixed',
    bottom: '24px',
    left: '50%',
    transform: 'translateX(-50%)',
    zIndex: 1000,
    background: darkMode ? '#2d2d3d' : '#ffffff',
    color: headingColor,
    border: `1px solid ${darkMode ? '#444' : '#ddd'}`,
    borderRadius: '30px',
    padding: '10px 28px',
    fontSize: '15px',
    fontWeight: 600,
    cursor: 'pointer',
    boxShadow: '0 4px 16px rgba(0,0,0,0.15)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
    transition: 'transform 0.2s ease, box-shadow 0.2s ease',
    backdropFilter: 'blur(4px)',
    backgroundColor: darkMode ? 'rgba(26, 26, 46, 0.85)' : 'rgba(255, 255, 255, 0.9)'
  };

  // ===== Fetch current weekly quiz =====
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
            setAttemptId(res.data.quiz.attemptId || null);
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

  const handleStartQuiz = () => setShowStartDialog(true);
  const handleConfirmStart = () => {
    setShowStartDialog(false);
    window.location.href = `/weekly-quiz/take/${quiz._id}`;
  };

  // ===== Fetch past attempt for review =====
  const fetchPastAttempt = async () => {
    if (!attemptId) {
      alert('No past attempt found to review.');
      return;
    }
    setLoadingPast(true);
    try {
      const res = await axios.get(`/api/weekly-quiz/attempt/${attemptId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.data.success) {
        setPastAttemptData(res.data.attempt);
        setShowPastReview(true);
      }
    } catch (error) {
      console.error('Failed to fetch past attempt:', error);
      alert('Unable to load past attempt. Please try again later.');
    } finally {
      setLoadingPast(false);
    }
  };

  // ===== Get AI explanation =====
  const getExplanation = async (idx, questionsArray, answersObject) => {
    if (!isPremium && explanationRemaining <= 0) {
      alert('You have used all your free explanations for today (10/day). Upgrade to Premium for unlimited!');
      return;
    }
    setLoadingExplanation({ ...loadingExplanation, [idx]: true });
    try {
      const question = questionsArray[idx];
      const res = await axios.post('/api/explain-question', {
        questionText: question.questionText,
        options: question.options,
        correctAnswer: question.correctAnswer,
        userAnswer: answersObject[idx]
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

  const closeExplanation = (idx) => {
    setExplanation((prev) => {
      const updated = { ...prev };
      delete updated[idx];
      return updated;
    });
  };

  if (loading) return <LoadingWithBar message="Loading Weekly Quiz..." />;

  if (!quiz) {
    return (
      <div style={{ background: darkMode ? '#1a1a2e' : '#f0f7f4', minHeight: '100vh', padding: '50px', textAlign: 'center' }}>
        <button onClick={goBack} style={backButtonStyle}>Back</button>
        <div style={{ fontSize: 64, marginBottom: 20 }}></div>
        <h2 style={{ color: headingColor }}>No Active Weekly Quiz</h2>
        <p style={{ color: secondaryText }}>Check back soon for a new quiz!</p>
      </div>
    );
  }

  // ===== Already attempted – with Review Button =====
  if (alreadyAttempted) {
    // If showing past review modal, render it
    if (showPastReview && pastAttemptData) {
      const { questions, answers: pastAnswers, score, total, percentage, quizTitle } = pastAttemptData;
      return (
        <div style={{ background: darkMode ? '#1a1a2e' : '#f0f7f4', minHeight: '100vh', padding: '20px' }}>
          <div style={{ maxWidth: 800, margin: '0 auto' }}>
            {!isPremium && explanationRemaining !== null && (
              <div style={{ textAlign: 'center', padding: 8, background: darkMode ? '#2d2d3d' : '#fff3e0', borderRadius: 8, marginBottom: 16 }}>
                <span style={{ color: '#ff9800' }}>🎯 {explanationRemaining} AI explanation{explanationRemaining !== 1 ? 's' : ''} remaining today{explanationRemaining === 0 && ' – Upgrade to Premium for unlimited!'}</span>
              </div>
            )}
            <div style={{ background: cardBg, borderRadius: 16, padding: 20, marginBottom: 20, textAlign: 'center' }}>
              <h2 style={{ color: headingColor, fontSize: 22 }}>Past Quiz Review</h2>
              <p style={{ fontSize: 14 }}>Score: {score}/{total} ({formatPercentage(percentage)}%)</p>
              <button
                onClick={() => setShowPastReview(false)}
                style={{ background: '#6c757d', color: 'white', padding: '8px 16px', border: 'none', borderRadius: 8, cursor: 'pointer', fontSize: 13, marginTop: 10 }}
              >
                Back to Overview
              </button>
            </div>
            {questions.map((q, idx) => {
              const userAnswer = pastAnswers[idx];
              const isCorrect = userAnswer !== undefined && userAnswer === q.correctAnswer;
              return (
                <div key={idx} style={{ background: cardBg, borderRadius: 12, padding: 16, marginBottom: 12, borderLeft: `5px solid ${isCorrect ? '#4caf50' : '#f44336'}` }}>
                  <h4 style={{ fontSize: 15, marginBottom: 10 }}>Q{idx+1}: {q.questionText}</h4>
                  {q.options.map((opt, optIdx) => (
                    <div key={optIdx} style={{ padding: '10px 12px', margin: '6px 0', background: optIdx === q.correctAnswer ? '#c8e6c9' : (optIdx === userAnswer ? '#ffcdd2' : '#f5f5f5'), borderRadius: 10, fontSize: 14 }}>
                      <span style={{ fontWeight: 'bold', marginRight: 10 }}>{String.fromCharCode(65 + optIdx)}.</span> {opt}
                      {optIdx === q.correctAnswer && <span style={{ color: '#4caf50', marginLeft: 10, fontSize: 12 }}>✓ Correct</span>}
                      {optIdx === userAnswer && optIdx !== q.correctAnswer && <span style={{ color: '#f44336', marginLeft: 10, fontSize: 12 }}>✗ Your Answer</span>}
                    </div>
                  ))}
                  <button
                    onClick={() => getExplanation(idx, questions, pastAnswers)}
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
                      <><span style={{ display: 'inline-block', width: 14, height: 14, border: '2px solid #fff', borderTop: '2px solid transparent', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} /> Generating...</>
                    ) : 'Explain with AI'}
                  </button>
                  {explanation[idx] && (
                    <div style={{ marginTop: 12, padding: 16, paddingRight: 40, background: darkMode ? '#1a1a2e' : '#f0f7f4', borderRadius: 8, borderLeft: '4px solid #ff9800', textAlign: 'left', position: 'relative' }}>
                      <button onClick={() => closeExplanation(idx)} style={{ position: 'absolute', top: 8, right: 10, background: 'none', border: 'none', fontSize: 18, cursor: 'pointer', color: secondaryText, padding: '4px 8px', borderRadius: 4, lineHeight: 1, transition: 'background 0.2s' }} onMouseEnter={(e) => e.currentTarget.style.background = darkMode ? '#333' : '#e0e0e0'} onMouseLeave={(e) => e.currentTarget.style.background = 'none'} aria-label="Close explanation">✕</button>
                      <div style={{ fontWeight: 'bold', color: '#ff9800', marginBottom: 8, textAlign: 'left' }}>AI Explanation</div>
                      <ReactMarkdown components={{ p: ({ children }) => <p style={{ margin: '4px 0', fontSize: 14, color: textColor, lineHeight: 1.6, textAlign: 'left' }}>{children}</p>, strong: ({ children }) => <strong style={{ color: headingColor, fontWeight: 'bold' }}>{children}</strong>, ul: ({ children }) => <ul style={{ paddingLeft: 20, margin: '4px 0', listStyleType: 'disc', textAlign: 'left' }}>{children}</ul>, li: ({ children }) => <li style={{ margin: '2px 0', fontSize: 14, color: textColor, lineHeight: 1.6, textAlign: 'left' }}>{children}</li>, h3: ({ children }) => <h3 style={{ margin: '8px 0 4px', fontSize: 15, color: headingColor, fontWeight: 'bold', textAlign: 'left' }}>{children}</h3> }}>{explanation[idx]}</ReactMarkdown>
                    </div>
                  )}
                </div>
              );
            })}
            <button onClick={() => setShowPastReview(false)} style={{ width: '100%', marginTop: 20, background: '#1e3c72', color: 'white', padding: 14, border: 'none', borderRadius: 10, cursor: 'pointer', fontWeight: 'bold' }}>Back to Overview</button>
          </div>
        </div>
      );
    }

    // Landing page – already attempted
    return (
      <div style={{ background: darkMode ? '#1a1a2e' : '#f0f7f4', minHeight: '100vh', padding: '20px' }}>
        <button onClick={goBack} style={backButtonStyle}>Back</button>

        <div style={{ maxWidth: 600, margin: '0 auto', background: cardBg, borderRadius: 20, padding: 30, textAlign: 'center' }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>✅</div>
          <h2 style={{ color: headingColor }}>You've Already Completed This Week's Quiz!</h2>
          <p style={{ fontSize: 18, margin: '10px 0', color: headingColor }}>Your Score: <strong>{attemptScore}</strong></p>
          <p style={{ fontSize: 18, margin: '10px 0', color: headingColor }}>Percentage: <strong>{formatPercentage(attemptPercentage)}%</strong></p>
          <p style={{ color: secondaryText, marginTop: 20 }}>Check back next week for a new quiz.</p>

          <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
            <button
              onClick={fetchPastAttempt}
              disabled={loadingPast}
              style={{
                marginTop: 20,
                background: '#1e3c72',
                color: 'white',
                padding: '10px 20px',
                border: 'none',
                borderRadius: 8,
                cursor: loadingPast ? 'not-allowed' : 'pointer',
                fontWeight: 'bold',
                opacity: loadingPast ? 0.6 : 1
              }}
            >
              {loadingPast ? 'Loading...' : 'Review Answers'}
            </button>

            <Link to="/weekly-leaderboard">
              <button style={{ marginTop: 20, background: '#ff9800', color: 'white', padding: '10px 20px', border: 'none', borderRadius: 8, cursor: 'pointer', fontWeight: 'bold' }}>🏆 View Leaderboard</button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // ===== Premium block =====
  if (quiz.isPremium && !user?.isPremium) {
    return (
      <div style={{ background: darkMode ? '#1a1a2e' : '#f0f7f4', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
        <button onClick={goBack} style={backButtonStyle}>Back</button>
        <div style={{ background: cardBg, borderRadius: 20, padding: 32, maxWidth: 400, textAlign: 'center', boxShadow: '0 4px 15px rgba(0,0,0,0.1)' }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>⭐</div>
          <h2 style={{ color: headingColor, marginBottom: 8 }}>Premium Quiz</h2>
          <p style={{ color: secondaryText, marginBottom: 20 }}>
            This week's quiz is a premium feature. Upgrade to access it and all other premium content.
          </p>
          <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link to="/get-premium" style={{ flex: 1, minWidth: '120px', textDecoration: 'none' }}>
              <button style={{ width: '100%', background: '#ff9800', color: 'white', padding: '12px 20px', border: 'none', borderRadius: 10, cursor: 'pointer', fontWeight: 'bold', fontSize: 12 }}>Upgrade Now</button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // ===== Main landing (not attempted) =====
  return (
    <div style={{ background: darkMode ? '#1a1a2e' : '#f0f7f4', minHeight: '100vh', padding: '20px' }}>
      <button onClick={goBack} style={backButtonStyle}>Back</button>

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
          <div style={{ background: cardBg, borderRadius: 20, padding: 28, maxWidth: 450, width: '100%', maxHeight: '90vh', overflowY: 'auto', textAlign: 'center', boxShadow: '0 8px 30px rgba(0,0,0,0.3)' }}>
            <div style={{ fontSize: 48, marginBottom: 12 }}></div>
            <h2 style={{ color: headingColor, marginBottom: 8 }}>Ready to Start?</h2>
            <p style={{ color: secondaryText, marginBottom: 16 }}>Please read the instructions before you begin.</p>
            <div style={{ background: darkMode ? '#1a1a2e' : '#f0f7f4', padding: '16px 18px', borderRadius: 12, marginBottom: 20, textAlign: 'left' }}>
              <h4 style={{ color: headingColor, marginBottom: 8 }}>Instructions</h4>
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
                  <p style={{ color: '#ff9800', fontSize: 13, margin: '4px 0', fontWeight: 'bold' }}>⭐ This is a Premium Quiz</p>
                )}
              </div>
            </div>
            <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
              <button onClick={() => setShowStartDialog(false)} style={{ flex: 1, background: '#6c757d', color: 'white', padding: '12px', border: 'none', borderRadius: 10, cursor: 'pointer', fontWeight: 'bold' }}>Back</button>
              <button onClick={handleConfirmStart} style={{ flex: 1, background: '#28a745', color: 'white', padding: '12px', border: 'none', borderRadius: 10, cursor: 'pointer', fontWeight: 'bold' }}>Start Quiz</button>
            </div>
          </div>
        </div>
      )}

      <div style={{ maxWidth: 700, margin: '0 auto' }}>
        <div style={{ background: `linear-gradient(135deg, #1e3c72 0%, #2a5298 100%)`, borderRadius: 20, padding: '32px 24px', marginBottom: 24, color: 'white', textAlign: 'center' }}>
          <h1 style={{ margin: 0, fontSize: 'clamp(24px, 5vw, 28px)' }}>{quiz.title}</h1>
          <p style={{ marginTop: 8, fontSize: 14, opacity: 0.9 }}>{quiz.description}</p>
          <div style={{ display: 'flex', justifyContent: 'center', gap: 20, marginTop: 16, flexWrap: 'wrap' }}>
            <span style={{ background: 'rgba(255,255,255,0.2)', padding: '4px 14px', borderRadius: 20, fontSize: 13 }}>
              {quiz.questions?.length || 0} Questions
            </span>
            <span style={{ background: 'rgba(255,255,255,0.2)', padding: '4px 14px', borderRadius: 20, fontSize: 13 }}>
              {quiz.timeLimit || 20} minutes
            </span>
            <span style={{ background: 'rgba(255,255,255,0.2)', padding: '4px 14px', borderRadius: 20, fontSize: 13 }}>
              {quiz.passingScore || 70}% to pass
            </span>
            {quiz.isPremium && (
              <span style={{ background: '#ff9800', padding: '4px 14px', borderRadius: 20, fontSize: 13, fontWeight: 'bold' }}>⭐ Premium</span>
            )}
          </div>
        </div>

        <div style={{ background: cardBg, borderRadius: 16, padding: 24, marginBottom: 20 }}>
          <h3 style={{ color: headingColor, marginBottom: 12 }}>Instructions</h3>
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
          Start Quiz
        </button>
      </div>
      <div style={{ textAlign: 'center', padding: '20px', marginTop: 20 }}>
        <p style={{ color: secondaryText, fontSize: 12 }}>
          © 2026 ELITE Nursing & Midwifery CBT. All rights reserved.{' '}
          <Link to="/privacy" style={{ color: '#2196f3', fontSize: 11, textDecoration: 'none' }}>Privacy Policy</Link>
          <span style={{ color: secondaryText, margin: '0 6px' }}>|</span>
          <Link to="/terms" style={{ color: '#2196f3', fontSize: 11, textDecoration: 'none' }}>Terms & Conditions</Link>
        </p>
      </div>
    </div>
  );
};