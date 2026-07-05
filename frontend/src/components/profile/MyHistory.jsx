// src/components/profile/MyHistory.jsx
import React, { useState, useEffect, useContext } from 'react';
import { Link } from 'react-router-dom';
import { AuthContext } from '../../context/AuthContext';
import { getAllAttempts, clearAllAttempts } from '../../utils/quizHelpers';
import { getHeadingColor, getSecondaryText, getTextColor, getCardBg } from '../../utils/theme';
import { LoadingWithBar } from '../common/LoadingWithBar';

export const MyHistory = () => {
  const [attempts, setAttempts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const { darkMode, user } = useContext(AuthContext);
  const headingColor = getHeadingColor(darkMode);
  const secondaryText = getSecondaryText(darkMode);
  const textColor = getTextColor(darkMode);
  const cardBg = getCardBg(darkMode);

  const loadAttempts = () => {
    const all = getAllAttempts();
    const list = Object.entries(all).map(([quizId, data]) => ({
      quizId,
      ...data
    }));
    list.sort((a, b) => new Date(b.completedAt) - new Date(a.completedAt));
    setAttempts(list);
    setLoading(false);
  };

  useEffect(() => {
    loadAttempts();
  }, []);

  const handleClearAll = () => {
    setDeleteConfirm({ quizId: 'ALL', title: 'ALL exams' });
  };

  const confirmDelete = () => {
    if (deleteConfirm.quizId === 'ALL') {
      clearAllAttempts();
    } else {
      const all = getAllAttempts();
      delete all[deleteConfirm.quizId];
      localStorage.setItem('exam_attempts', JSON.stringify(all));
    }
    setDeleteConfirm(null);
    loadAttempts();
  };

  const cancelDelete = () => {
    setDeleteConfirm(null);
  };

  const isUserPremium = user?.isPremium && user?.premiumExpiry && new Date(user.premiumExpiry) > new Date();

  if (loading) return <LoadingWithBar message="Loading history..." />;

  if (attempts.length === 0) {
    return (
      <div style={{ background: darkMode ? '#1a1a2e' : '#f0f7f4', minHeight: '100vh', padding: '50px', textAlign: 'center' }}>
        <Link to="/profile" style={{ display: 'inline-block', marginBottom: 16, color: headingColor, textDecoration: 'none', fontWeight: 'bold' }}>
          ← Back to Profile
        </Link>
        <div style={{ fontSize: 64, marginBottom: 20 }}>📖</div>
        <h2 style={{ color: headingColor }}>No Exam History</h2>
        <p>Complete some exams to see your history here.</p>
        <Link to="/"><button style={{ marginTop: 20, background: '#1e3c72', color: 'white', padding: '10px 20px', border: 'none', borderRadius: 8, cursor: 'pointer' }}>Browse Exams</button></Link>
      </div>
    );
  }

  const grouped = {};
  attempts.forEach(attempt => {
    const cat = attempt.category || 'general-nursing';
    const topic = attempt.topic || 'General';
    if (!grouped[cat]) grouped[cat] = {};
    if (!grouped[cat][topic]) grouped[cat][topic] = [];
    grouped[cat][topic].push(attempt);
  });

  const categoryNames = {
    'general-nursing': 'General Nursing',
    'midwifery': 'Midwifery',
    'public-health': 'Public Health',
    'pediatric-nursing': 'Pediatric Nursing',
    'dental-nursing': 'Dental Nursing'
  };

  return (
    <div style={{ background: darkMode ? '#1a1a2e' : '#f0f7f4', minHeight: '100vh', padding: '20px' }}>
      <div style={{ maxWidth: 1200, margin: '0 auto' }}>
        <Link to="/profile" style={{ display: 'inline-block', marginBottom: 16, color: headingColor, textDecoration: 'none', fontWeight: 'bold' }}>
          ← Back to Profile
        </Link>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, flexWrap: 'wrap', gap: 12 }}>
          <h1 style={{ color: headingColor }}>📚 My Exam History</h1>
          <button
            onClick={handleClearAll}
            style={{ background: '#dc3545', color: 'white', border: 'none', padding: '8px 16px', borderRadius: 8, cursor: 'pointer', fontWeight: 'bold' }}
          >
            Clear All History
          </button>
        </div>

        {Object.entries(grouped).map(([category, topics]) => (
          <div key={category} style={{ marginBottom: 40 }}>
            <h2 style={{ color: '#ff9800', borderLeft: `4px solid #ff9800`, paddingLeft: 12, marginBottom: 16 }}>
              {categoryNames[category] || category}
            </h2>
            {Object.entries(topics).map(([topic, exams]) => (
              <div key={topic} style={{ marginBottom: 24 }}>
                <h3 style={{ color: headingColor, fontSize: 18, marginBottom: 12 }}>{topic}</h3>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 16 }}>
                  {exams.map((exam) => {
                    const isPremiumExam = exam.isPremium === true;
                    const isLocked = isPremiumExam && !isUserPremium;

                    return (
                      <div key={exam.quizId} style={{ background: darkMode ? '#16213e' : 'white', padding: 16, borderRadius: 12, boxShadow: '0 2px 8px rgba(0,0,0,0.1)', position: 'relative', opacity: isLocked ? 0.7 : 1 }}>
                        <button
                          onClick={() => setDeleteConfirm({ quizId: exam.quizId, title: exam.title })}
                          style={{
                            position: 'absolute',
                            top: 8,
                            right: 8,
                            background: '#dc3545',
                            color: 'white',
                            border: 'none',
                            borderRadius: 4,
                            fontSize: 12,
                            cursor: 'pointer',
                            padding: '4px 8px',
                            fontWeight: 'bold',
                            zIndex: 1
                          }}
                        >
                          Delete
                        </button>
                        <div style={{ fontSize: 32, marginBottom: 8 }}>{isLocked ? '🔒' : '📝'}</div>
                        <h4 style={{ color: headingColor, marginBottom: 4 }}>{exam.title}</h4>

                        {isLocked ? (
                          <>
                            <p style={{ fontSize: 13, color: secondaryText, fontStyle: 'italic' }}>
                              This is a premium exam history. Upgrade to view details.
                            </p>
                            <Link to="/get-premium">
                              <button style={{ width: '100%', marginTop: 12, background: '#ff9800', color: 'white', border: 'none', padding: '8px', borderRadius: 8, cursor: 'pointer', fontWeight: 'bold' }}>
                                ⭐ Upgrade to View
                              </button>
                            </Link>
                          </>
                        ) : (
                          <>
                            <p style={{ fontSize: 13, color: secondaryText }}>Score: {exam.score}/{exam.total} ({exam.percentage}%)</p>
                            <p style={{ fontSize: 12, color: secondaryText }}>Completed: {new Date(exam.completedAt).toLocaleString()}</p>
                            {isPremiumExam && isUserPremium && (
                              <p style={{ fontSize: 11, color: '#ff9800', fontWeight: 'bold' }}>⭐ Premium Exam</p>
                            )}
                            <Link to={`/review/${exam.quizId}`}>
                              <button style={{ width: '100%', marginTop: 12, background: '#1e3c72', color: 'white', border: 'none', padding: '8px', borderRadius: 8, cursor: 'pointer', fontWeight: 'bold' }}>
                                Review Exam
                              </button>
                            </Link>
                          </>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        ))}
      </div>

      {deleteConfirm && (
        <div style={{
          position: 'fixed',
          top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0,0,0,0.7)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 2000
        }}>
          <div style={{
            background: cardBg,
            borderRadius: 20,
            padding: 24,
            maxWidth: 320,
            width: '90%',
            textAlign: 'center',
            boxShadow: '0 4px 15px rgba(0,0,0,0.2)'
          }}>
            <div style={{ fontSize: 48, marginBottom: 12 }}>⚠️</div>
            <h3 style={{ color: headingColor, marginBottom: 8 }}>Delete Exam History</h3>
            <p style={{ color: secondaryText, marginBottom: 20 }}>
              {deleteConfirm.quizId === 'ALL'
                ? 'Are you sure you want to delete ALL exam history? This cannot be undone.'
                : `Delete "${deleteConfirm.title}" from your history?`
              }
            </p>
            <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
              <button onClick={cancelDelete} style={{ background: '#6c757d', color: 'white', padding: '8px 20px', border: 'none', borderRadius: 8, cursor: 'pointer', fontWeight: 'bold' }}>Back</button>
              <button onClick={confirmDelete} style={{ background: '#dc3545', color: 'white', padding: '8px 20px', border: 'none', borderRadius: 8, cursor: 'pointer', fontWeight: 'bold' }}>Delete</button>
            </div>
          </div>
        </div>
      )}

      <div style={{ textAlign: 'center', padding: '20px', marginTop: 20 }}>
        <p style={{ color: secondaryText, fontSize: 12 }}>© 2026 ELITE Nursing & Midwifery CBT. All rights reserved.</p>
      </div>
    </div>
  );
};