// src/components/profile/ReviewExam.jsx
import React, { useState, useEffect, useContext } from 'react';
import { Link, useParams } from 'react-router-dom';
import axios from 'axios';
import { AuthContext } from '../../context/AuthContext';
import { getExamAttempt } from '../../utils/quizHelpers';
import { getHeadingColor } from '../../utils/theme';
import { LoadingWithBar } from '../common/LoadingWithBar';

export const ReviewExam = () => {
  const { id } = useParams();
  const [attempt, setAttempt] = useState(null);
  const [quiz, setQuiz] = useState(null);
  const [loading, setLoading] = useState(true);
  const { token, darkMode } = useContext(AuthContext);
  const headingColor = getHeadingColor(darkMode);

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
  }, [id, token]);

  if (loading) return <LoadingWithBar message="Loading review..." />;
  if (!attempt || !quiz) return <div>Review data not found</div>;

  const questions = quiz.questions;
  const userAnswers = attempt.answers;

  return (
    <div style={{ background: darkMode ? '#1a1a2e' : '#f0f7f4', minHeight: '100vh', padding: '20px' }}>
      <div style={{ maxWidth: 800, margin: '0 auto' }}>
        <div style={{ marginBottom: 24 }}>
          <Link to="/history" style={{ textDecoration: 'none', color: headingColor }}>← Back to History</Link>
        </div>
        <div style={{ background: darkMode ? '#16213e' : 'white', borderRadius: 16, padding: 24, textAlign: 'center', marginBottom: 20 }}>
          <h2 style={{ color: headingColor }}>{attempt.title}</h2>
          <p>Your Score: {attempt.score}/{attempt.total} ({attempt.percentage}%)</p>
          <p>Completed: {new Date(attempt.completedAt).toLocaleString()}</p>
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