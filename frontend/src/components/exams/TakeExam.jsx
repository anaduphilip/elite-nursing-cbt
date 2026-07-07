// src/components/exams/TakeExam.jsx
import React, { useState, useEffect, useContext } from 'react';
import { Link, useParams } from 'react-router-dom';
import axios from 'axios';
import ReactMarkdown from 'react-markdown';
import { AuthContext } from '../../context/AuthContext';
import { getHeadingColor, getSecondaryText, getTextColor } from '../../utils/theme';
import { Timer } from '../common/Timer';
import { saveExamAttempt } from '../../utils/quizHelpers';
import { LoadingWithBar } from '../common/LoadingWithBar';

export const TakeExam = () => {
  const { id, sectionNumber, mode } = useParams();
  const [exam, setExam] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [answers, setAnswers] = useState({});
  const [currentIndex, setCurrentIndex] = useState(0);
  const [submitted, setSubmitted] = useState(false);
  const [result, setResult] = useState(null);
  const [showReview, setShowReview] = useState(false);
  const [timeUp, setTimeUp] = useState(false);
  const [loading, setLoading] = useState(true);
  const [premiumBlocked, setPremiumBlocked] = useState(false);
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
    const fetchExam = async () => {
      try {
        setLoading(true);
        const res = await axios.get(`/api/quizzes/${id}`, { headers: { Authorization: `Bearer ${token}` } });
        const examData = res.data;
        setExam(examData);

        if (mode === 'free' && examData.isPremium) {
          setPremiumBlocked(true);
          setLoading(false);
          return;
        }

        if (mode === 'free') {
          const hasTaken = localStorage.getItem(`exam_${id}_taken`) === 'true';
          if (hasTaken && !user?.isPremium) {
            alert('You have already taken this free exam. Upgrade to Premium to retake.');
            window.location.href = '/get-premium';
            setLoading(false);
            return;
          }
        }

        if (mode === 'premium') {
          try {
            const profileRes = await axios.get('/api/user/profile', { headers: { Authorization: `Bearer ${token}` } });
            if (!profileRes.data.isPremium) {
              setPremiumBlocked(true);
              setLoading(false);
              return;
            }
          } catch (profileError) {
            setPremiumBlocked(true);
            setLoading(false);
            return;
          }
        }

        setQuestions(examData.questions);
        const savedAnswers = localStorage.getItem(`exam_${id}_answers`);
        if (savedAnswers) {
          setAnswers(JSON.parse(savedAnswers));
        }
        setCurrentIndex(0);
        setSubmitted(false);
        setResult(null);
        setShowReview(false);
        setTimeUp(false);
      } catch (error) {
        console.error('Fetch error:', error);
        alert('Error loading exam: ' + error.message);
        setLoading(false);
      } finally {
        setLoading(false);
      }
    };
    if (id && token) fetchExam();
  }, [id, sectionNumber, token, mode, user]);

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

  // ===== Save answers to localStorage =====
  useEffect(() => {
    if (!submitted && Object.keys(answers).length > 0) {
      localStorage.setItem(`exam_${id}_answers`, JSON.stringify(answers));
    }
  }, [answers, id, submitted]);

  const handleAnswer = (answerIndex) => {
    setAnswers(prev => ({ ...prev, [currentIndex]: answerIndex }));
  };

  const goToQuestion = (index) => {
    if (index >= 0 && index < questions.length) {
      setCurrentIndex(index);
    }
  };

  const handleTimeUp = () => {
    setTimeUp(true);
    handleSubmit();
  };

  const handleSubmit = () => {
    let score = 0;
    questions.forEach((question, idx) => {
      if (answers[idx] !== undefined && answers[idx] === question.correctAnswer) {
        score++;
      }
    });
    const percentage = ((score / questions.length) * 100).toFixed(1);
    const total = questions.length;

    setResult({ score, total, percentage, passed: percentage >= 70 });
    setSubmitted(true);

    const savedScores = localStorage.getItem(`exam_${id}_scores`);
    const scores = savedScores ? JSON.parse(savedScores) : {};
    scores[1] = { score, total, percentage };
    localStorage.setItem(`exam_${id}_scores`, JSON.stringify(scores));

    if (exam) {
      saveExamAttempt(
        id,
        exam.title,
        exam.category || 'general-nursing',
        exam.topic || 'General',
        answers,
        score,
        total,
        parseFloat(percentage),
        false
      );
    }

    if (mode === 'free') {
      localStorage.setItem(`exam_${id}_taken`, 'true');
    }
    localStorage.removeItem(`exam_${id}_answers`);
  };

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

  const closeExplanation = (idx) => {
    setExplanation((prev) => {
      const updated = { ...prev };
      delete updated[idx];
      return updated;
    });
  };

  const answeredCount = Object.keys(answers).length;
  const totalQuestions = questions.length;
  const allAnswered = answeredCount === totalQuestions;

  if (loading) return <LoadingWithBar message="Loading examination..." />;

  if (premiumBlocked) {
    const backCategory = exam?.category || (window.location.pathname.split('/')[2] || 'general-nursing');
    return (
      <div style={{ background: darkMode ? '#1a1a2e' : '#f0f7f4', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ background: darkMode ? '#16213e' : 'white', borderRadius: 20, padding: 32, maxWidth: 400, textAlign: 'center' }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>⭐</div>
          <h2 style={{ color: headingColor }}>Premium Required</h2>
          <p>This exam is only available in Premium Mode. Please upgrade to access it.</p>
          <div style={{ display: 'flex', gap: 12, marginTop: 20 }}>
            <Link to={`/courses/${backCategory}/${mode}`} style={{ flex: 1 }}>
              <button style={{ width: '100%', background: '#6c757d', color: 'white', padding: '12px', border: 'none', borderRadius: 8, cursor: 'pointer', fontWeight: 'bold' }}>Back</button>
            </Link>
            <Link to="/get-premium" style={{ flex: 1 }}>
              <button style={{ width: '100%', background: '#ff9800', color: 'white', padding: '12px', border: 'none', borderRadius: 8, cursor: 'pointer', fontWeight: 'bold' }}>Upgrade Now</button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (!exam || questions.length === 0) return <div style={{ padding: 40, textAlign: 'center' }}>Exam not found</div>;

  // ===== Results view (without review) =====
  if (submitted && !showReview) {
    return (
      <div style={{ background: darkMode ? '#1a1a2e' : '#f0f7f4', minHeight: '100vh', padding: '20px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column' }}>
        <div style={{ maxWidth: 450, width: '100%', background: darkMode ? '#16213e' : 'white', borderRadius: 20, padding: 32, textAlign: 'center' }}>
          <h2 style={{ color: headingColor, fontSize: 24 }}>Exam Results</h2>
          <p style={{ fontSize: 36, margin: '20px 0' }}>Score: <strong style={{ color: headingColor }}>{result.score}</strong> / {result.total}</p>
          <p style={{ fontSize: 24, marginBottom: 20 }}>Percentage: <strong>{result.percentage}%</strong></p>
          <p style={{ fontSize: 24, color: result.passed ? '#2e7d32' : '#dc3545', fontWeight: 'bold' }}>
            {result.passed ? '✓ PASSED!' : '✗ Failed'}
          </p>
          {timeUp && <p style={{ color: '#ff9800' }}>⏰ Time's up!</p>}

          {mode === 'free' && (
            <div style={{ marginTop: 20, padding: 16, background: '#fff3e0', borderRadius: 12 }}>
              <p style={{ color: '#ff9800', fontWeight: 'bold', margin: 0, fontSize: 14 }}>📢 You have completed the free exam!</p>
              <p style={{ color: secondaryText, marginTop: 8, fontSize: 13 }}>Upgrade to Premium to retake and unlock all exams.</p>
              <Link to="/get-premium"><button style={{ width: '100%', background: '#ff9800', color: 'white', padding: 10, border: 'none', borderRadius: 8, cursor: 'pointer', fontWeight: 'bold', marginTop: 8 }}>⭐ Upgrade Now</button></Link>
            </div>
          )}

          <div style={{ display: 'flex', gap: 12, marginTop: 24, justifyContent: 'center' }}>
            <button onClick={() => setShowReview(true)} style={{ background: '#1e3c72', color: 'white', padding: '10px 20px', border: 'none', borderRadius: 10, cursor: 'pointer', fontWeight: 'bold', fontSize: 14 }}>Review Answers</button>
            <Link to={`/courses/${exam.category}/${mode}`}><button style={{ background: '#6c757d', color: 'white', padding: '10px 20px', border: 'none', borderRadius: 10, cursor: 'pointer', fontWeight: 'bold', fontSize: 14 }}>Back to Topics</button></Link>
          </div>
        </div>
      </div>
    );
  }

  // ===== Review view (with AI explanations) =====
  if (submitted && showReview) {
    return (
      <div style={{ background: darkMode ? '#1a1a2e' : '#f0f7f4', minHeight: '100vh', padding: '20px' }}>
        <div style={{ maxWidth: 800, margin: '0 auto' }}>
          {/* Remaining counter */}
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

          <div style={{ background: darkMode ? '#16213e' : 'white', borderRadius: 16, padding: 20, marginBottom: 20, textAlign: 'center' }}>
            <h2 style={{ color: headingColor, fontSize: 22 }}>Answer Review</h2>
            <p style={{ fontSize: 14 }}>Score: {result.score}/{result.total} ({result.percentage}%)</p>
            <Link to={`/courses/${exam.category}/${mode}`}><button style={{ background: '#1e3c72', color: 'white', padding: '8px 20px', border: 'none', borderRadius: 8, cursor: 'pointer', fontSize: 13, marginTop: 10 }}>Back to Topics</button></Link>
          </div>

          {questions.map((q, idx) => {
            const userAnswer = answers[idx];
            const isCorrect = userAnswer !== undefined && userAnswer === q.correctAnswer;

            return (
              <div key={idx} style={{ background: darkMode ? '#16213e' : 'white', borderRadius: 12, padding: 16, marginBottom: 12, borderLeft: `5px solid ${isCorrect ? '#4caf50' : '#f44336'}` }}>
                <h4 style={{ fontSize: 15, marginBottom: 10 }}>Q{idx+1}: {q.questionText}</h4>
                {q.options.map((opt, optIdx) => {
                  let bgColor = '#f5f5f5';
                  if (optIdx === q.correctAnswer) bgColor = '#c8e6c9';
                  if (optIdx === userAnswer && optIdx !== q.correctAnswer) bgColor = '#ffcdd2';
                  return (
                    <div key={optIdx} style={{ padding: '10px 12px', margin: '6px 0', background: bgColor, borderRadius: 10, fontSize: 14 }}>
                      <span style={{ fontWeight: 'bold', marginRight: 10 }}>{String.fromCharCode(65 + optIdx)}.</span> {opt}
                      {optIdx === q.correctAnswer && <span style={{ color: '#4caf50', marginLeft: 10, fontSize: 12 }}>✓ Correct</span>}
                      {optIdx === userAnswer && optIdx !== q.correctAnswer && <span style={{ color: '#f44336', marginLeft: 10, fontSize: 12 }}>✗ Your Answer</span>}
                    </div>
                  );
                })}

                {/* AI Explanation Button */}
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

                {/* AI Explanation Display */}
                {explanation[idx] && (
                  <div
                    style={{
                      marginTop: 12,
                      padding: 16,
                      paddingRight: 40,
                      background: darkMode ? '#1a1a2e' : '#f0f7f4',
                      borderRadius: 8,
                      borderLeft: '4px solid #ff9800',
                      textAlign: 'left',
                      position: 'relative'
                    }}
                  >
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

          <Link to={`/courses/${exam.category}/${mode}`}><button style={{ width: '100%', marginTop: 20, background: '#1e3c72', color: 'white', padding: 14, border: 'none', borderRadius: 10, cursor: 'pointer', fontWeight: 'bold' }}>Back to Topics</button></Link>
        </div>
      </div>
    );
  }

  // ===== Active exam (one question at a time) =====
  const currentQuestion = questions[currentIndex];
  const timerDuration = questions.length;

  return (
    <div style={{ background: darkMode ? '#1a1a2e' : '#f0f7f4', minHeight: '100vh' }}>
      <Timer duration={timerDuration} onTimeUp={handleTimeUp} />
      <div style={{ padding: '20px', maxWidth: 1000, margin: '0 auto' }}>
        <div style={{ background: darkMode ? '#16213e' : 'white', borderRadius: 16, padding: 20, marginBottom: 20, textAlign: 'center' }}>
          <h2 style={{ color: headingColor, margin: 0, fontSize: 20 }}>{exam.title}</h2>
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
                <input type="radio" name="currentQuestion" onChange={() => handleAnswer(optIdx)} checked={answers[currentIndex] === optIdx} style={{ marginRight: 15, width: 18, height: 18 }} />
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
            {questions.map((_, idx) => {
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

        <button onClick={handleSubmit} disabled={!allAnswered} style={{ width: '100%', background: allAnswered ? '#28a745' : '#ccc', color: 'white', padding: 14, border: 'none', borderRadius: 50, cursor: allAnswered ? 'pointer' : 'not-allowed', fontSize: 16, fontWeight: 'bold', marginBottom: 30, opacity: allAnswered ? 1 : 0.7 }}>
          {allAnswered ? 'Submit Examination' : `Please answer all questions (${answeredCount}/${totalQuestions})`}
        </button>
      </div>
      <div style={{ textAlign: 'center', padding: '20px' }}>
        <p style={{ color: secondaryText, fontSize: 12 }}>© 2026 ELITE Nursing & Midwifery CBT. All rights reserved.</p>
      </div>
    </div>
  );
};