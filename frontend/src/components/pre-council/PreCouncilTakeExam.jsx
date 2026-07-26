// src/components/pre-council/PreCouncilTakeExam.jsx
import React, { useState, useEffect, useContext } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { AuthContext } from '../../context/AuthContext';
import { getHeadingColor, getSecondaryText } from '../../utils/theme';
import { LoadingWithBar } from '../common/LoadingWithBar';
import { Timer } from '../common/Timer';
import { saveExamAttempt } from '../../utils/quizHelpers';

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
  const navigate = useNavigate();

  useEffect(() => {
    const fetchExam = async () => {
      try {
        const res = await axios.get(`/api/pre-council/exams/${examId}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (res.data.success) {
          const examData = res.data.exam;
          setExam(examData);
          setQuestions(examData.questions);
          setCurrentIndex(0);
          setAnswers({});
          setSubmitted(false);
          setResult(null);
          setShowReview(false);
          setTimeUp(false);
        } else {
          alert('Exam not found');
          navigate('/pre-council');
        }
      } catch (error) {
        console.error('Failed to fetch exam:', error);
        alert('Failed to load exam');
      } finally {
        setLoading(false);
      }
    };
    fetchExam();
  }, [examId, token, navigate]);

  const handleAnswer = (answerIndex) => {
    setAnswers(prev => ({ ...prev, [currentIndex]: answerIndex }));
  };

  const handleTimeUp = () => {
    setTimeUp(true);
    handleSubmit();
  };

  const handleSubmit = () => {
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

    // Save attempt (for history)
    if (exam) {
      saveExamAttempt(
        `precouncil_${exam._id}`,
        exam.title,
        'pre-council',
        exam.paperId?.name || 'Pre Council',
        answers,
        score,
        total,
        parseFloat(percentage),
        false
      );
    }
  };

  const goToQuestion = (index) => {
    if (index >= 0 && index < questions.length) {
      setCurrentIndex(index);
    }
  };

  if (loading) return <LoadingWithBar message="Loading exam..." />;
  if (!exam || questions.length === 0) return <div style={{ padding: 40, textAlign: 'center' }}>Exam not found</div>;

  const answeredCount = Object.keys(answers).length;
  const totalQuestions = questions.length;
  const allAnswered = answeredCount === totalQuestions;

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
            <button onClick={() => setShowReview(true)} style={{ background: '#1e3c72', color: 'white', padding: '10px 20px', border: 'none', borderRadius: 10, cursor: 'pointer', fontWeight: 'bold' }}>Review Answers</button>
            <button onClick={() => navigate('/pre-council')} style={{ background: '#6c757d', color: 'white', padding: '10px 20px', border: 'none', borderRadius: 10, cursor: 'pointer', fontWeight: 'bold' }}>Back to Pre Council</button>
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
            <button onClick={() => navigate('/pre-council')} style={{ background: '#6c757d', color: 'white', padding: '8px 20px', border: 'none', borderRadius: 8, cursor: 'pointer', fontSize: 13, marginTop: 10 }}>Back to Pre Council</button>
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
        </div>
      </div>
    );
  }

  // Active exam – one question at a time (no going back)
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

        {/* Navigation: Only Next button, no Previous (no going back) */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12, marginBottom: 30 }}>
          {currentIndex < totalQuestions - 1 ? (
            <button
              onClick={() => goToQuestion(currentIndex + 1)}
              style={{ background: '#1e3c72', color: 'white', padding: '10px 20px', border: 'none', borderRadius: 8, cursor: 'pointer', fontWeight: 'bold' }}
            >
              Next Question →
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
    </div>
  );
};