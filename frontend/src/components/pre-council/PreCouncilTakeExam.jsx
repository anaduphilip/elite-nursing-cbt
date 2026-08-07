// src/components/pre-council/PreCouncilTakeExam.jsx
import React, { useState, useEffect, useContext } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import ReactMarkdown from 'react-markdown';
import { AuthContext } from '../../context/AuthContext';
import { getHeadingColor, getSecondaryText, getTextColor } from '../../utils/theme';
import { LoadingWithBar } from '../common/LoadingWithBar';
import { Timer } from '../common/Timer';
import { saveExamAttempt, getCachedPreCouncilExam } from '../../utils/quizHelpers';

export const PreCouncilTakeExam = () => {
  const { examId } = useParams();
  const [exam, setExam] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState({});
  const [submitted, setSubmitted] = useState(false);
  const [result, setResult] = useState(null);
  const [showReview, setShowReview] = useState(false);
  const [timeUp, setTimeUp] = useState(false);
  const [loading, setLoading] = useState(true);
  const { token, darkMode, user } = useContext(AuthContext);
  const headingColor = getHeadingColor(darkMode);
  const secondaryText = getSecondaryText(darkMode);
  const textColor = getTextColor(darkMode);
  const navigate = useNavigate();

  // ===== AI Explanation States =====
  const [explanation, setExplanation] = useState({});
  const [loadingExplanation, setLoadingExplanation] = useState({});
  const [explanationRemaining, setExplanationRemaining] = useState(null);
  const [isPremiumUser, setIsPremiumUser] = useState(false);

  // ===== Fetch exam using cache =====
  useEffect(() => {
    const fetchExam = async () => {
      setLoading(true);
      try {
        let examData = null;
        try {
          examData = await getCachedPreCouncilExam(examId, token);
        } catch (cacheError) {
          console.log('Cache miss or error, falling back to API');
        }

        if (!examData) {
          const res = await axios.get(`/api/pre-council/exams/${examId}`, {
            headers: { Authorization: `Bearer ${token}` }
          });
          if (res.data.success) {
            examData = res.data.exam;
          } else {
            alert('Exam not found');
            navigate('/pre-council');
            return;
          }
        }

        setExam(examData);
        setQuestions(examData.questions);
        setCurrentIndex(0);
        setAnswers({});
        setSubmitted(false);
        setResult(null);
        setShowReview(false);
        setTimeUp(false);
      } catch (error) {
        console.error('Failed to fetch exam:', error);
        alert('Failed to load exam');
      } finally {
        setLoading(false);
      }
    };
    if (examId && token) fetchExam();
  }, [examId, token, navigate]);

  // ===== Check if free exam (order === 1) is already taken =====
  useEffect(() => {
    if (!loading && exam && !isPremiumUser && exam.order === 1) {
      const takenKey = `precouncil_exam_${examId}_taken`;
      if (localStorage.getItem(takenKey) === 'true') {
        alert('You can only take this free exam once. Upgrade to Premium to retake.');
        navigate('/pre-council');
      }
    }
  }, [loading, exam, isPremiumUser, examId, navigate]);

  // ===== Fetch remaining AI explanations =====
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

  // ===== Handlers =====
  const handleAnswer = (answerIndex) => {
    setAnswers(prev => ({ ...prev, [currentIndex]: answerIndex }));
  };

  const handleTimeUp = () => {
    setTimeUp(true);
    handleSubmit();
  };

  // ===== handleSubmit – save locally, send to backend, set taken flag =====
  const handleSubmit = async () => {
    let score = 0;
    questions.forEach((q, idx) => {
      if (answers[idx] !== undefined && answers[idx] === q.correctAnswer) {
        score++;
      }
    });
    const percentage = ((score / questions.length) * 100).toFixed(1);
    const total = questions.length;

    setResult({ score, total, percentage, passed: percentage >= 70 });
    setSubmitted(true);

    if (exam) {
      const sectionNumber = exam.order || 1;
      const isPremiumExam = sectionNumber > 1;
      const paperName = exam.paperId?.name || 'Pre Council';
      const categorySlug = exam.paperId?.categoryId?.slug || 'pre-council';
      const categoryName = exam.paperId?.categoryId?.name || 'Pre-Council';

      // Save locally
      saveExamAttempt(
        `precouncil_${exam._id}`,
        exam.title,
        categorySlug,
        paperName,
        answers,
        score,
        total,
        parseFloat(percentage),
        isPremiumExam,
        true,
        sectionNumber,
        categoryName,
        questions
      );

      // Send to backend
      try {
        await axios.post(
          `/api/pre-council/exams/${examId}/submit`,
          { answers },
          { headers: { Authorization: `Bearer ${token}` } }
        );
        console.log('✅ PreCouncil exam result saved to backend');
      } catch (error) {
        console.error('❌ Failed to save PreCouncil exam to backend:', error);
      }

      // ===== Set taken flag for free exam (exam 1) =====
      if (exam.order === 1) {
        localStorage.setItem(`precouncil_exam_${examId}_taken`, 'true');
      }
    }
  };

  const goToQuestion = (index) => {
    if (index >= 0 && index < questions.length) {
      setCurrentIndex(index);
    }
  };

  // ===== AI Explanation Functions =====
  const getExplanation = async (idx) => {
    if (!isPremiumUser && explanationRemaining <= 0) {
      alert('You have used all your free explanations for today (10/day). Upgrade to Premium for unlimited!');
      return;
    }

    setLoadingExplanation({ ...loadingExplanation, [idx]: true });
    try {
      const question = questions[idx];
      const res = await axios.post(
        '/api/explain-question',
        {
          questionText: question.questionText,
          options: question.options,
          correctAnswer: question.correctAnswer,
          userAnswer: answers[idx]
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

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
    setExplanation(prev => {
      const updated = { ...prev };
      delete updated[idx];
      return updated;
    });
  };

  // ===== Loading state =====
  if (loading) return <LoadingWithBar message="Loading exam..." />;
  if (!exam || questions.length === 0) return <div style={{ padding: 40, textAlign: 'center' }}>Exam not found</div>;

  const answeredCount = Object.keys(answers).length;
  const totalQuestions = questions.length;
  const allAnswered = answeredCount === totalQuestions;

  // ===== Results view =====
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
          <div style={{ display: 'flex', gap: 12, marginTop: 24, justifyContent: 'center' }}>
            <button onClick={() => setShowReview(true)} style={{ background: '#1e3c72', color: 'white', padding: '10px 20px', border: 'none', borderRadius: 10, cursor: 'pointer', fontWeight: 'bold' }}>
              Review Answers
            </button>
            <button onClick={() => navigate('/pre-council')} style={{ background: '#6c757d', color: 'white', padding: '10px 20px', border: 'none', borderRadius: 10, cursor: 'pointer', fontWeight: 'bold' }}>
              Back to Pre Council
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ===== Review view with AI explanations =====
  if (submitted && showReview) {
    return (
      <div style={{ background: darkMode ? '#1a1a2e' : '#f0f7f4', minHeight: '100vh', padding: '20px' }}>
        <div style={{ maxWidth: 800, margin: '0 auto' }}>
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
            <button onClick={() => navigate('/pre-council')} style={{ background: '#6c757d', color: 'white', padding: '8px 20px', border: 'none', borderRadius: 8, cursor: 'pointer', fontSize: 13, marginTop: 10 }}>
              Back to Pre Council
            </button>
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
        </div>
      </div>
    );
  }

  // ===== Active exam =====
  const currentQuestion = questions[currentIndex];
  const timerDuration = exam.timeLimit || 180;

  return (
    <div style={{ background: darkMode ? '#1a1a2e' : '#f0f7f4', minHeight: '100vh' }}>
      <Timer duration={timerDuration} onTimeUp={handleTimeUp} />
      <div style={{ padding: '20px', maxWidth: 1000, margin: '0 auto' }}>
        <div style={{ background: darkMode ? '#16213e' : 'white', borderRadius: 16, padding: 20, marginBottom: 20, textAlign: 'center' }}>
          <h2 style={{ color: headingColor, margin: 0, fontSize: 20 }}>{exam.title}</h2>
          <p style={{ fontSize: 14, marginTop: 4 }}>Question {currentIndex+1} of {totalQuestions}</p>
          <p style={{ fontSize: 13, color: secondaryText }}>Answered: {answeredCount}/{totalQuestions}</p>
        </div>

        {/* Question */}
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
            {currentIndex < totalQuestions - 1 ? (
              <button
                onClick={() => goToQuestion(currentIndex + 1)}
                style={{ background: '#1e3c72', color: 'white', padding: '10px 20px', border: 'none', borderRadius: 8, cursor: 'pointer', fontWeight: 'bold' }}
              >
                Next Question
              </button>
            ) : (
              <button
                onClick={handleSubmit}
                disabled={!allAnswered}
                style={{
                  background: allAnswered ? '#28a745' : '#ccc',
                  color: 'white',
                  padding: '10px 20px',
                  border: 'none',
                  borderRadius: 8,
                  cursor: allAnswered ? 'pointer' : 'not-allowed',
                  fontWeight: 'bold'
                }}
              >
                {allAnswered ? 'Submit Exam' : `Answer all questions (${answeredCount}/${totalQuestions})`}
              </button>
            )}
          </div>
        </div>

        {/* Question Palette */}
        <div style={{ background: darkMode ? '#16213e' : 'white', borderRadius: 16, padding: 20, marginBottom: 20 }}>
          <p style={{ fontSize: 14, fontWeight: 'bold', marginBottom: 12, color: darkMode ? '#fff' : '#333' }}>Question Palette</p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
            {questions.map((_, idx) => {
              const isAnswered = answers[idx] !== undefined;
              return (
                <button
                  key={idx}
                  onClick={() => goToQuestion(idx)}
                  style={{
                    width: 40, height: 40, borderRadius: 8,
                    background: idx === currentIndex ? '#ff9800' : (isAnswered ? '#4caf50' : (darkMode ? '#444' : '#e0e0e0')),
                    color: (idx === currentIndex || isAnswered) ? 'white' : (darkMode ? headingColor : '#333'),
                    fontWeight: 'bold', border: 'none', cursor: 'pointer'
                  }}
                >
                  {idx+1}
                </button>
              );
            })}
          </div>
        </div>
      </div>
      <div style={{ textAlign: 'center', padding: '20px' }}>
        <p style={{ color: secondaryText, fontSize: 12 }}>© 2026 ELITE Nursing & Midwifery CBT. All rights reserved.</p>
      </div>
      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};