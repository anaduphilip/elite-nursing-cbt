// src/components/study/StudyPlan.jsx
import React, { useState, useEffect, useContext } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
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

  // Fetch status and plan
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
        setPlan(planRes.data.plan);
        if (planRes.data.plan?.completed) {
          setResult({ score: planRes.data.plan.score, total: planRes.data.plan.total });
        }
      }
    } catch (error) {
      console.error('Error fetching study plan status:', error);
      alert('Failed to load study plan status.');
    } finally {
      setLoading(false);
    }
  };

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
        alert('Study plan generated successfully!');
      }
    } catch (error) {
      const msg = error.response?.data?.error || 'Failed to generate study plan.';
      alert(msg);
    } finally {
      setGenerating(false);
    }
  };

  const handleAnswer = (index, answerIndex) => {
    setAnswers(prev => ({ ...prev, [index]: answerIndex }));
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
        // Update plan status
        setPlan(prev => ({ ...prev, completed: true, score: res.data.score }));
        alert(`You scored ${res.data.score}/${res.data.total} (${res.data.percentage}%)`);
      }
    } catch (error) {
      alert(error.response?.data?.error || 'Failed to submit study plan.');
    } finally {
      setSubmitting(false);
    }
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

  // If plan exists and is completed or not
  if (plan) {
    const questions = plan.questions || [];
    const total = questions.length;
    const answered = Object.keys(answers).length;

    // Completed plan with result
    if (plan.completed && result) {
      return (
        <div style={{ background: darkMode ? '#1a1a2e' : '#f0f7f4', minHeight: '100vh', padding: '20px' }}>
          <div style={{ maxWidth: 800, margin: '0 auto' }}>
            <div style={{ background: cardBg, borderRadius: 16, padding: 20, marginBottom: 20, textAlign: 'center' }}>
              <h2 style={{ color: headingColor }}>Study Plan Results</h2>
              <p>Score: <strong>{result.score}</strong> / {result.total} ({result.percentage}%)</p>
              <p style={{ color: result.passed ? '#2e7d32' : '#dc3545', fontWeight: 'bold' }}>
                {result.passed ? '✓ PASSED' : '✗ Needs Improvement'}
              </p>
              <button onClick={() => setShowReview(!showReview)} style={{ background: '#1e3c72', color: 'white', padding: '8px 16px', border: 'none', borderRadius: 6, cursor: 'pointer', marginTop: 10 }}>
                {showReview ? 'Hide Review' : 'Show Review'}
              </button>
              <button onClick={generatePlan} disabled={generating} style={{ marginLeft: 10, background: '#ff9800', color: 'white', padding: '8px 16px', border: 'none', borderRadius: 6, cursor: 'pointer' }}>
                {generating ? 'Generating...' : 'Generate New Plan'}
              </button>
              <Link to="/profile"><button style={{ marginLeft: 10, background: '#6c757d', color: 'white', padding: '8px 16px', border: 'none', borderRadius: 6, cursor: 'pointer' }}>Back to Profile</button></Link>
            </div>

            {showReview && (
              <div>
                {questions.map((q, idx) => {
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
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      );
    }

    // Active plan - show questions
    return (
      <div style={{ background: darkMode ? '#1a1a2e' : '#f0f7f4', minHeight: '100vh', padding: '20px' }}>
        <div style={{ maxWidth: 800, margin: '0 auto' }}>
          <div style={{ background: cardBg, borderRadius: 16, padding: 20, marginBottom: 20, textAlign: 'center' }}>
            <h2 style={{ color: headingColor }}>Your Study Plan</h2>
            <p style={{ color: secondaryText }}>Answer all {total} questions to get feedback.</p>
            <p style={{ color: secondaryText, fontSize: 13 }}>Answered: {answered}/{total}</p>
            <button onClick={generatePlan} disabled={generating} style={{ marginTop: 10, background: '#ff9800', color: 'white', padding: '8px 16px', border: 'none', borderRadius: 6, cursor: 'pointer' }}>
              {generating ? 'Generating...' : 'Regenerate Plan'}
            </button>
            <Link to="/profile"><button style={{ marginLeft: 10, background: '#6c757d', color: 'white', padding: '8px 16px', border: 'none', borderRadius: 6, cursor: 'pointer' }}>Back to Profile</button></Link>
          </div>

          {questions.map((q, idx) => (
            <div key={idx} style={{ background: cardBg, borderRadius: 12, padding: 16, marginBottom: 16, border: '1px solid ' + (darkMode ? '#444' : '#ddd') }}>
              <h4 style={{ fontSize: 15, marginBottom: 12 }}>Q{idx+1}: {q.questionText}</h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {q.options.map((opt, optIdx) => {
                  const selected = answers[idx] === optIdx;
                  return (
                    <label key={optIdx} style={{
                      display: 'flex', alignItems: 'center', cursor: 'pointer', padding: 10, margin: 0,
                      background: selected ? '#1e3c72' : 'white',
                      borderRadius: 8,
                      border: selected ? '2px solid #1e3c72' : '2px solid #e0e0e0',
                      color: selected ? 'white' : textColor,
                      transition: 'all 0.2s ease'
                    }}>
                      <input type="radio" name={`q${idx}`} onChange={() => handleAnswer(idx, optIdx)} checked={selected} style={{ marginRight: 12, width: 18, height: 18 }} />
                      <span style={{ fontWeight: 'bold', marginRight: 10, fontSize: 14 }}>{String.fromCharCode(65 + optIdx)}.</span>
                      <span style={{ fontSize: 14 }}>{opt}</span>
                    </label>
                  );
                })}
              </div>
            </div>
          ))}

          <button onClick={submitPlan} disabled={submitting || answered < total} style={{
            width: '100%',
            background: answered === total ? '#28a745' : '#ccc',
            color: 'white',
            padding: 14,
            border: 'none',
            borderRadius: 50,
            cursor: answered === total && !submitting ? 'pointer' : 'not-allowed',
            fontSize: 16,
            fontWeight: 'bold',
            marginTop: 20,
            marginBottom: 30,
            opacity: answered === total ? 1 : 0.7
          }}>
            {submitting ? 'Submitting...' : (answered === total ? 'Submit Study Plan' : `Please answer all questions (${answered}/${total})`)}
          </button>
        </div>
      </div>
    );
  }

  // No plan but can generate
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