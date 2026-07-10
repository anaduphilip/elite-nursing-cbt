// src/components/exams/PremiumExam.jsx
import React, { useState, useEffect, useContext } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { AuthContext } from '../../context/AuthContext';
import { getHeadingColor, getSecondaryText, getTextColor } from '../../utils/theme';
import { Timer } from '../common/Timer';
import { saveExamAttempt } from '../../utils/quizHelpers';
import { LoadingWithBar } from '../common/LoadingWithBar';

export const PremiumExam = () => {
  const { categoryName, topic, examId, mode } = useParams();
  const [loading, setLoading] = useState(true);
  const [questions, setQuestions] = useState([]);
  const [examTitle, setExamTitle] = useState('');
  const [answers, setAnswers] = useState({});
  const [currentIndex, setCurrentIndex] = useState(0);
  const [submitted, setSubmitted] = useState(false);
  const [result, setResult] = useState(null);
  const [showReview, setShowReview] = useState(false);
  const [timeUp, setTimeUp] = useState(false);
  const [premiumBlocked, setPremiumBlocked] = useState(false);
  const { token, darkMode } = useContext(AuthContext);
  const headingColor = getHeadingColor(darkMode);
  const secondaryText = getSecondaryText(darkMode);
  const textColor = getTextColor(darkMode);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchExam = async () => {
      setLoading(true);
      try {
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

        const res = await axios.get('/api/quizzes', { headers: { Authorization: `Bearer ${token}` } });
        const allQuizzes = res.data.filter(q => q.category === categoryName && q.topic === topic);
        allQuizzes.sort((a, b) => {
          const numA = parseInt(a.title.match(/\d+/)?.[0] || 0);
          const numB = parseInt(b.title.match(/\d+/)?.[0] || 0);
          return numA - numB;
        });
        const allQuestions = [];
        allQuizzes.forEach(quiz => {
          allQuestions.push(...quiz.questions);
        });
        const chunkSize = 250;
        const examIndex = parseInt(examId) - 1;
        const start = examIndex * chunkSize;
        const end = Math.min(start + chunkSize, allQuestions.length);
        if (start >= allQuestions.length) {
          alert('Exam not found');
          navigate(`/courses/${categoryName}/${mode}`);
          return;
        }
        const chunk = allQuestions.slice(start, end);
        setQuestions(chunk);
        const from = start + 1;
        const to = end;
        setExamTitle(`Exam ${examId}: ${topic} (Questions ${from} – ${to})`);
        setAnswers({});
        setCurrentIndex(0);
        setSubmitted(false);
        setResult(null);
        setShowReview(false);
        setTimeUp(false);
      } catch (error) {
        console.error(error);
        alert('Failed to load premium exam');
      } finally {
        setLoading(false);
      }
    };
    if (token && categoryName && topic && examId) {
      fetchExam();
    }
  }, [categoryName, topic, examId, token, navigate, mode]);

  useEffect(() => {
    if (!submitted && Object.keys(answers).length > 0) {
      localStorage.setItem(`premium_exam_${examId}_answers`, JSON.stringify(answers));
    }
  }, [answers, examId, submitted]);

  // ===== NEW: Send premium exam results to backend after submission =====
  useEffect(() => {
    if (submitted && result && Object.keys(answers).length > 0) {
      const sendToBackend = async () => {
        try {
          // Construct a payload for the premium exam
          // The backend will need a special handler for this endpoint
          await axios.post(
            '/api/premium-exam/submit',
            {
              category: categoryName,
              topic,
              examId,
              answers,
              score: result.score,
              total: result.total,
              percentage: parseFloat(result.percentage),
            },
            { headers: { Authorization: `Bearer ${token}` } }
          );
          console.log('✅ Premium exam results saved to backend');
        } catch (error) {
          console.error('❌ Failed to save premium exam results:', error);
        }
      };
      sendToBackend();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [submitted, result]);

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

    const quizId = `premium-${categoryName}-${topic}-${examId}`;
    saveExamAttempt(
      quizId,
      examTitle,
      categoryName,
      topic,
      answers,
      score,
      total,
      parseFloat(percentage),
      true
    );

    localStorage.removeItem(`premium_exam_${examId}_answers`);
  };

  const answeredCount = Object.keys(answers).length;
  const totalQuestions = questions.length;
  const allAnswered = answeredCount === totalQuestions;

  if (loading) return <LoadingWithBar message="Loading premium exam..." />;

  if (premiumBlocked) {
    return (
      <div style={{ background: darkMode ? '#1a1a2e' : '#f0f7f4', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ background: darkMode ? '#16213e' : 'white', borderRadius: 20, padding: 32, maxWidth: 400, textAlign: 'center' }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>⭐</div>
          <h2 style={{ color: headingColor }}>Premium Required</h2>
          <p>This exam is only available in Premium Mode. Please upgrade to access it.</p>
          <div style={{ display: 'flex', gap: 12, marginTop: 20 }}>
            <Link to={`/courses/${categoryName}/${mode}`} style={{ flex: 1 }}>
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

  if (questions.length === 0) {
    return <div style={{ padding: 40, textAlign: 'center' }}>Exam not found</div>;
  }

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
            <button onClick={() => setShowReview(true)} style={{ background: '#1e3c72', color: 'white', padding: '10px 20px', border: 'none', borderRadius: 10, cursor: 'pointer', fontWeight: 'bold', fontSize: 14 }}>Review Answers</button>
            <Link to={`/courses/${categoryName}/${mode}`}><button style={{ background: '#6c757d', color: 'white', padding: '10px 20px', border: 'none', borderRadius: 10, cursor: 'pointer', fontWeight: 'bold', fontSize: 14 }}>Back to Topics</button></Link>
          </div>
        </div>
      </div>
    );
  }

  if (submitted && showReview) {
    return (
      <div style={{ background: darkMode ? '#1a1a2e' : '#f0f7f4', minHeight: '100vh', padding: '20px' }}>
        <div style={{ maxWidth: 800, margin: '0 auto' }}>
          <div style={{ background: darkMode ? '#16213e' : 'white', borderRadius: 16, padding: 20, marginBottom: 20, textAlign: 'center' }}>
            <h2 style={{ color: headingColor, fontSize: 22 }}>Answer Review</h2>
            <p style={{ fontSize: 14 }}>Score: {result.score}/{result.total} ({result.percentage}%)</p>
            <Link to={`/courses/${categoryName}/${mode}`}><button style={{ background: '#1e3c72', color: 'white', padding: '8px 20px', border: 'none', borderRadius: 8, cursor: 'pointer', fontSize: 13, marginTop: 10 }}>Back to Topics</button></Link>
          </div>
          {questions.map((q, idx) => {
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
              </div>
            );
          })}
          <Link to={`/courses/${categoryName}/${mode}`}><button style={{ width: '100%', marginTop: 20, background: '#1e3c72', color: 'white', padding: 14, border: 'none', borderRadius: 10, cursor: 'pointer', fontWeight: 'bold' }}>Back to Topics</button></Link>
        </div>
      </div>
    );
  }

  const currentQuestion = questions[currentIndex];
  const timerDuration = questions.length;

  return (
    <div style={{ background: darkMode ? '#1a1a2e' : '#f0f7f4', minHeight: '100vh' }}>
      <Timer duration={timerDuration} onTimeUp={handleTimeUp} />
      <div style={{ padding: '20px', maxWidth: 1000, margin: '0 auto' }}>
        <div style={{ background: darkMode ? '#16213e' : 'white', borderRadius: 16, padding: 20, marginBottom: 20, textAlign: 'center' }}>
          <h2 style={{ color: headingColor, margin: 0, fontSize: 20 }}>{examTitle}</h2>
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