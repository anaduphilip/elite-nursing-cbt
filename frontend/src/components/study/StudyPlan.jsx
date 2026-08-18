// src/components/study/StudyPlan.jsx
import React, { useState, useEffect, useContext } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import ReactMarkdown from 'react-markdown';
import { AuthContext } from '../../context/AuthContext';
import { getHeadingColor, getSecondaryText, getTextColor, getCardBg } from '../../utils/theme';
import { LoadingWithBar } from '../common/LoadingWithBar';

export const StudyPlan = () => {
  const { token, darkMode } = useContext(AuthContext);
  const headingColor = getHeadingColor(darkMode);
  const secondaryText = getSecondaryText(darkMode);
  const textColor = getTextColor(darkMode);
  const cardBg = getCardBg(darkMode);

  const [status, setStatus] = useState(null);
  const [plan, setPlan] = useState(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [answers, setAnswers] = useState({});
  const [result, setResult] = useState(null);
  const [showReview, setShowReview] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);

  const [explanation, setExplanation] = useState({});
  const [loadingExplanation, setLoadingExplanation] = useState({});
  const [explanationRemaining, setExplanationRemaining] = useState(null);
  const [isPremiumUser, setIsPremiumUser] = useState(false);

  // ===== Helper: Extract user‑friendly error message =====
  const getFriendlyErrorMessage = (error) => {
    if (!error) return 'An unexpected error occurred. Please try again.';
    if (error.response) {
      const data = error.response.data;
      const status = error.response.status;
      if (data && typeof data.error === 'string' && data.error.length < 200) {
        return data.error;
      }
      if (status === 400 || status === 500) {
        if (data.error && (data.error.includes('Cast to ObjectId failed') || data.error.includes('BSONError'))) {
          return 'There was a problem with your study plan data. Please generate a new plan.';
        }
        if (data.error && data.error.includes('validation failed')) {
          return 'Invalid data submitted. Please generate a new study plan and try again.';
        }
      }
      return 'Failed to process your request. Please try again later.';
    }
    return 'Network error. Please check your connection and try again.';
  };

  // ===== Fetch status and plan =====
  const fetchStatus = async () => {
    setLoading(true);
    try {
      const res = await axios.get('/api/study-plan/status', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setStatus(res.data);
      if (res.data.hasPlan) {
        const planRes = await axios.get('/api/study-plan/current', {
          headers: { Authorization: `Bearer ${token}` }
        });
        const loadedPlan = planRes.data.plan;
        setPlan(loadedPlan);
        setCurrentIndex(0);

        if (loadedPlan && loadedPlan.questions) {
          const savedAnswers = {};
          loadedPlan.questions.forEach((q, idx) => {
            if (q.userAnswer !== undefined && q.userAnswer !== null) {
              savedAnswers[idx] = q.userAnswer;
            }
          });
          setAnswers(savedAnswers);
        }

        if (loadedPlan?.completed) {
          const perc = loadedPlan.total > 0 ? (loadedPlan.score / loadedPlan.total) * 100 : 0;
          setResult({
            score: loadedPlan.score,
            total: loadedPlan.total,
            percentage: perc.toFixed(1),
            passed: perc >= 70,
          });
        }
      }
    } catch (error) {
      console.error('Error fetching study plan status:', error);
      alert('Unable to load your study plan. Please refresh the page and try again.');
    } finally {
      setLoading(false);
    }
  };

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

  useEffect(() => {
    fetchStatus();
  }, [token]);

  const generatePlan = async () => {
    setGenerating(true);
    try {
      const res = await axios.post('/api/study-plan/generate', {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.data.success) {
        setPlan(res.data.plan);
        setStatus(prev => ({ ...prev, hasPlan: true }));
        setAnswers({});
        setResult(null);
        setShowReview(false);
        setCurrentIndex(0);
        alert('✅ Study plan generated successfully!');
      }
    } catch (error) {
      const userMessage = getFriendlyErrorMessage(error);
      alert('❌ ' + userMessage);
    } finally {
      setGenerating(false);
    }
  };

  const handleAnswer = (index, answerIndex) => {
    setAnswers(prev => ({ ...prev, [index]: answerIndex }));
  };

  const goToQuestion = (index) => {
    if (index >= 0 && index < plan.questions.length) {
      setCurrentIndex(index);
    }
  };

  const submitPlan = async () => {
    const total = plan.questions.length;
    const answered = Object.keys(answers).length;
    if (answered < total) {
      alert(`Please answer all ${total} questions.`);
      return;
    }
    setSubmitting(true);
    try {
      const answerArray = Array.from({ length: total }, (_, i) => answers[i] !== undefined ? answers[i] : null);
      const res = await axios.post('/api/study-plan/submit', { answers: answerArray }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.data.success) {
        setResult(res.data);
        const updatedQuestions = plan.questions.map((q, idx) => ({
          ...q,
          userAnswer: answers[idx] !== undefined ? answers[idx] : null
        }));
        setPlan({ ...plan, questions: updatedQuestions, completed: true, score: res.data.score, total: res.data.total });
        alert(`✅ You scored ${res.data.score}/${res.data.total} (${res.data.percentage}%)`);
      }
    } catch (error) {
      const userMessage = getFriendlyErrorMessage(error);
      alert('❌ ' + userMessage);
    } finally {
      setSubmitting(false);
    }
  };

  // ===== AI Explanation Handlers =====
  const getExplanation = async (idx) => {
    if (!isPremiumUser && explanationRemaining <= 0) {
      alert('You have used all your free explanations for today (10/day). Upgrade to Premium for unlimited!');
      return;
    }

    setLoadingExplanation({ ...loadingExplanation, [idx]: true });
    try {
      const question = plan.questions[idx];
      const userAnswer = question.userAnswer !== undefined && question.userAnswer !== null
        ? question.userAnswer
        : answers[idx];

      if (userAnswer === undefined || userAnswer === null) {
        alert('You did not answer this question.');
        setLoadingExplanation({ ...loadingExplanation, [idx]: false });
        return;
      }

      const res = await axios.post('/api/explain-question', {
        questionText: question.questionText,
        options: question.options,
        correctAnswer: question.correctAnswer,
        userAnswer: userAnswer
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      setExplanation({ ...explanation, [idx]: res.data.explanation });
      setExplanationRemaining(res.data.remaining);
    } catch (error) {
      if (error.response?.status === 403 && error.response?.data?.limitReached) {
        alert('Daily explanation limit reached (10/day). Upgrade to Premium for unlimited!');
      } else {
        alert('Failed to generate explanation. Please try again later.');
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

  if (loading) return <LoadingWithBar message="Loading study plan" />;

  // If no plan and cannot generate
  if (!status?.hasPlan && !status?.canGenerate) {
    return (
      <div style={{ background: darkMode ? '#1a1a2e' : '#f0f7f4', minHeight: '100vh', padding: '20px' }}>
        <div style={{ maxWidth: 600, margin: '0 auto', background: cardBg, borderRadius: 20, padding: 30, textAlign: 'center' }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>📅</div>
          <h2 style={{ color: headingColor }}>Study Plan Not Available</h2>
          <p style={{ color: secondaryText }}>{status?.message || 'You have reached your free limit. Upgrade to Premium for unlimited access.'}</p>
          {!status?.isPremium && (
            <Link to="/get-premium">
              <button style={{ marginTop: 20, background: '#ff9800', color: 'white', padding: '10px 20px', border: 'none', borderRadius: 8, cursor: 'pointer', fontWeight: 'bold' }}>Upgrade to Premium</button>
            </Link>
          )}
        </div>
      </div>
    );
  }

  // If plan exists and is completed
  if (plan && plan.completed && result) {
    const percentage = parseFloat(result.percentage);
    const passed = result.passed !== undefined ? result.passed : percentage >= 70;
    const feedback = result.feedback || {};

    return (
      <div style={{ background: darkMode ? '#1a1a2e' : '#f0f7f4', minHeight: '100vh', padding: '20px' }}>
        <div style={{ maxWidth: 800, margin: '0 auto' }}>
          <div style={{ background: cardBg, borderRadius: 16, padding: 20, marginBottom: 20, textAlign: 'center' }}>
            <h2 style={{ color: headingColor }}>Study Plan Results</h2>
            <p>Score: <strong>{result.score}</strong> / {result.total} ({result.percentage}%)</p>
            <p style={{ fontSize: 24, color: passed ? '#2e7d32' : '#dc3545', fontWeight: 'bold' }}>
              {passed ? '✓ PASSED' : '✗ Needs Improvement'}
            </p>

            {feedback.overallMessage && (
              <div style={{ marginTop: 16, padding: 16, background: darkMode ? '#2d2d3d' : '#f0f7f4', borderRadius: 12, textAlign: 'left' }}>
                <p style={{ fontSize: 16, color: textColor, lineHeight: 1.6, fontWeight: 'bold' }}>{feedback.overallMessage}</p>
                {feedback.suggestion && (
                  <p style={{ marginTop: 8, fontSize: 14, color: '#ff9800', fontWeight: 'bold' }}>
                    {feedback.suggestion}
                  </p>
                )}
              </div>
            )}

            {feedback.categoryFeedback && Object.keys(feedback.categoryFeedback).length > 0 && (
              <div style={{ marginTop: 16, textAlign: 'left' }}>
                <h4 style={{ color: headingColor, marginBottom: 8 }}>📊 Category Breakdown</h4>
                {Object.entries(feedback.categoryFeedback).map(([cat, data]) => (
                  <div key={cat} style={{
                    marginBottom: 8,
                    padding: '8px 12px',
                    background: darkMode ? '#2d2d3d' : '#f8f9fa',
                    borderRadius: 8,
                    borderLeft: `4px solid ${data.percentage >= 70 ? '#4caf50' : data.percentage >= 40 ? '#ff9800' : '#f44336'}`
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ color: textColor, fontWeight: 'bold' }}>{cat}</span>
                      <span style={{ color: secondaryText, fontWeight: 'bold' }}>
                        {data.correct}/{data.total} ({data.percentage}%)
                      </span>
                    </div>
                    <div style={{ marginTop: 4, fontSize: 13, color: data.percentage >= 70 ? '#4caf50' : data.percentage >= 40 ? '#ff9800' : '#f44336' }}>
                      {data.message}
                    </div>
                  </div>
                ))}
              </div>
            )}

            <div style={{ marginTop: 16, display: 'flex', gap: 10, justifyContent: 'center', flexWrap: 'wrap' }}>
              <button onClick={() => setShowReview(!showReview)} style={{ background: '#1e3c72', color: 'white', padding: '8px 16px', border: 'none', borderRadius: 6, cursor: 'pointer' }}>
                {showReview ? 'Hide Review' : 'Show Review'}
              </button>
              <button onClick={generatePlan} disabled={generating} style={{ background: '#ff9800', color: 'white', padding: '8px 16px', border: 'none', borderRadius: 6, cursor: 'pointer' }}>
                {generating ? 'Generating...' : 'Generate New Plan'}
              </button>
              <Link to="/profile"><button style={{ background: '#6c757d', color: 'white', padding: '8px 16px', border: 'none', borderRadius: 6, cursor: 'pointer' }}>Back to Profile</button></Link>
            </div>
          </div>

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

          {showReview && (
            <div>
              {plan.questions.map((q, idx) => {
                const userAns = q.userAnswer;
                const isCorrect = userAns === q.correctAnswer;
                return (
                  <div key={idx} style={{ background: cardBg, borderRadius: 12, padding: 16, marginBottom: 12, borderLeft: `5px solid ${isCorrect ? '#4caf50' : '#f44336'}` }}>
                    <h4 style={{ fontSize: 15, marginBottom: 10 }}>Q{idx+1}: {q.questionText}</h4>
                    {q.options.map((opt, optIdx) => (
                      <div key={optIdx} style={{ padding: '10px 12px', margin: '6px 0', background: optIdx === q.correctAnswer ? '#c8e6c9' : (optIdx === userAns ? '#ffcdd2' : '#f5f5f5'), borderRadius: 10, fontSize: 14 }}>
                        <span style={{ fontWeight: 'bold', marginRight: 10 }}>{String.fromCharCode(65 + optIdx)}.</span> {opt}
                        {optIdx === q.correctAnswer && <span style={{ color: '#4caf50', marginLeft: 10, fontSize: 12 }}>✓ Correct</span>}
                        {optIdx === userAns && optIdx !== q.correctAnswer && <span style={{ color: '#f44336', marginLeft: 10, fontSize: 12 }}>✗ Your Answer</span>}
                      </div>
                    ))}

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
                          <span style={{ display: 'inline-block', animation: 'spin 0.8s linear infinite' }}>⚡</span>
                          Generating...
                        </>
                      ) : (
                        'Explain with AI'
                      )}
                    </button>

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

                        <div style={{ fontWeight: 'bold', color: '#ff9800', marginBottom: 8, textAlign: 'left' }}>
                          AI Explanation
                        </div>
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
            </div>
          )}
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

  // ===== Active plan – one question at a time =====
  if (plan && !plan.completed) {
    const questions = plan.questions;
    const total = questions.length;
    const answered = Object.keys(answers).length;
    const currentQuestion = questions[currentIndex];

    return (
      <div style={{ background: darkMode ? '#1a1a2e' : '#f0f7f4', minHeight: '100vh', padding: '20px' }}>
        <div style={{ maxWidth: 1000, margin: '0 auto' }}>
          {/* Header */}
          <div style={{ background: cardBg, borderRadius: 16, padding: 20, marginBottom: 20, textAlign: 'center' }}>
            <h2 style={{ color: headingColor, margin: 0, fontSize: 20 }}>Your Study Plan</h2>
            <p style={{ fontSize: 14, marginTop: 4 }}>
              Question {currentIndex+1} of {total}
            </p>
            <p style={{ fontSize: 13, color: secondaryText }}>Answered: {answered}/{total}</p>
          </div>

          {/* Question card */}
          <div style={{ background: '#1e3c72', borderRadius: 16, padding: 20, marginBottom: 20 }}>
            <h4 style={{ color: 'white', marginBottom: 16, fontSize: 16 }}>Question {currentIndex+1}: {currentQuestion.questionText}</h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {currentQuestion.options.map((opt, optIdx) => {
                const selected = answers[currentIndex] === optIdx;
                return (
                  <label
                    key={optIdx}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      cursor: 'pointer',
                      padding: 12,
                      margin: 0,
                      background: 'white',
                      border: selected ? '2px solid #1e3c72' : '2px solid #e0e0e0',
                      borderRadius: 8,
                      color: darkMode ? '#333' : 'inherit',
                      transition: 'all 0.2s ease',
                    }}
                  >
                    <input
                      type="radio"
                      name="currentQuestion"
                      onChange={() => handleAnswer(currentIndex, optIdx)}
                      checked={selected}
                      style={{ marginRight: 15, width: 18, height: 18 }}
                    />
                    <span style={{ fontWeight: 'bold', marginRight: 10, fontSize: 14 }}>
                      {String.fromCharCode(65 + optIdx)}.
                    </span>
                    <span style={{ fontSize: 14 }}>{opt}</span>
                  </label>
                );
              })}
            </div>
          </div>

          {/* Navigation */}
          <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, marginBottom: 30 }}>
            {currentIndex > 0 && (
              <button
                onClick={() => goToQuestion(currentIndex - 1)}
                style={{ background: '#6c757d', color: 'white', padding: '10px 20px', border: 'none', borderRadius: 8, cursor: 'pointer', fontWeight: 'bold' }}
              >
                Previous
              </button>
            )}
            <div style={{ flex: 1, display: 'flex', justifyContent: 'flex-end', gap: 12 }}>
              {currentIndex < total - 1 ? (
                <button
                  onClick={() => goToQuestion(currentIndex + 1)}
                  style={{ background: '#1e3c72', color: 'white', padding: '10px 20px', border: 'none', borderRadius: 8, cursor: 'pointer', fontWeight: 'bold' }}
                >
                  Next Question
                </button>
              ) : (
                <button
                  onClick={submitPlan}
                  disabled={submitting || answered < total}
                  style={{
                    background: answered === total ? '#28a745' : '#ccc',
                    color: 'white',
                    padding: '10px 20px',
                    border: 'none',
                    borderRadius: 8,
                    cursor: answered === total && !submitting ? 'pointer' : 'not-allowed',
                    fontWeight: 'bold'
                  }}
                >
                  {submitting ? 'Submitting...' : (answered === total ? 'Submit Study Plan' : `Answer all (${answered}/${total})`)}
                </button>
              )}
            </div>
          </div>

          {/* Question Palette */}
          <div style={{ background: cardBg, borderRadius: 16, padding: 20, marginBottom: 20 }}>
            <p style={{ fontSize: 14, fontWeight: 'bold', marginBottom: 12, color: headingColor }}>Question Palette</p>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
              {questions.map((_, idx) => {
                const isAnswered = answers[idx] !== undefined;
                return (
                  <button
                    key={idx}
                    onClick={() => goToQuestion(idx)}
                    style={{
                      width: 40,
                      height: 40,
                      borderRadius: 8,
                      background: idx === currentIndex ? '#ff9800' : (isAnswered ? '#4caf50' : (darkMode ? '#444' : '#e0e0e0')),
                      color: (idx === currentIndex || isAnswered) ? 'white' : (darkMode ? headingColor : '#333'),
                      fontWeight: 'bold',
                      border: 'none',
                      cursor: 'pointer'
                    }}
                  >
                    {idx+1}
                  </button>
                );
              })}
            </div>
          </div>

          <div style={{ textAlign: 'center', padding: '10px' }}>
            <Link to="/profile"><button style={{ background: '#6c757d', color: 'white', padding: '8px 20px', border: 'none', borderRadius: 8, cursor: 'pointer' }}>Back to Profile</button></Link>
          </div>
        </div>
      </div>
    );
  }

  // ===== No plan but can generate =====
  return (
    <div style={{ background: darkMode ? '#1a1a2e' : '#f0f7f4', minHeight: '100vh', padding: '20px' }}>
      <div style={{ maxWidth: 600, margin: '0 auto', background: cardBg, borderRadius: 20, padding: 30, textAlign: 'center' }}>
        <div style={{ fontSize: 48, marginBottom: 16 }}>🧠</div>
        <h2 style={{ color: headingColor }}>Personalized Study Plan</h2>
        <p style={{ color: secondaryText }}>
          {status?.isPremium ? 'Generate a custom study plan based on your weak areas.' : 'Free users can generate one plan per week. Upgrade to Premium for unlimited.'}
        </p>
        <p style={{ color: secondaryText, fontSize: 14, marginTop: 10 }}>{status?.message}</p>
        <button onClick={generatePlan} disabled={generating || !status?.canGenerate} style={{
          marginTop: 20,
          background: (generating || !status?.canGenerate) ? '#ccc' : '#ff9800',
          color: 'white',
          padding: '12px 24px',
          border: 'none',
          borderRadius: 30,
          cursor: (generating || !status?.canGenerate) ? 'not-allowed' : 'pointer',
          fontWeight: 'bold',
          fontSize: 16
        }}>
          {generating ? 'Generating...' : 'Generate Study Plan'}
        </button>
        <div style={{ marginTop: 20 }}>
          <Link to="/profile"><button style={{ background: '#6c757d', color: 'white', padding: '10px 20px', border: 'none', borderRadius: 8, cursor: 'pointer' }}>Back to Profile</button></Link>
        </div>
      </div>
    </div>
  );
};