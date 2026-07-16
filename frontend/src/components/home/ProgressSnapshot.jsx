// src/components/home/ProgressSnapshot.jsx
import React, { useContext, useEffect, useState } from 'react';
import { AuthContext } from '../../context/AuthContext';
import { getAllAttempts } from '../../utils/quizHelpers';
import { getHeadingColor, getSecondaryText } from '../../utils/theme';

export const ProgressSnapshot = () => {
  const { darkMode } = useContext(AuthContext);
  const headingColor = getHeadingColor(darkMode);
  const secondaryText = getSecondaryText(darkMode);
  const [stats, setStats] = useState({
    totalExams: 0,
    passed: 0,
    failed: 0,
    passRate: 0,
    recentScores: []
  });

  useEffect(() => {
    const attempts = getAllAttempts();
    const list = Object.values(attempts);
    if (list.length === 0) {
      setStats({
        totalExams: 0,
        passed: 0,
        failed: 0,
        passRate: 0,
        recentScores: []
      });
      return;
    }

    // Count passed/failed (percentage >= 70 is passing)
    let passed = 0;
    let failed = 0;
    const recent = list.slice(-5).reverse(); // last 5 attempts

    list.forEach(a => {
      if (a.percentage >= 70) passed++;
      else failed++;
    });

    const total = list.length;
    const passRate = total > 0 ? Math.round((passed / total) * 100) : 0;

    setStats({
      totalExams: total,
      passed,
      failed,
      passRate,
      recentScores: recent
    });
  }, []);

  if (stats.totalExams === 0) {
    return (
      <div style={{ textAlign: 'center', padding: '16px', background: darkMode ? '#16213e' : 'white', borderRadius: 12 }}>
        <p style={{ color: secondaryText, fontSize: 14 }}>📊 Take your first exam to see progress statistics here.</p>
      </div>
    );
  }

  return (
    <div style={{
      background: darkMode ? '#16213e' : 'white',
      borderRadius: 16,
      padding: '20px 24px',
      boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
      marginBottom: 24
    }}>
      <h3 style={{ color: headingColor, fontSize: 16, marginBottom: 16, fontWeight: 600 }}>📊 Your Progress Snapshot</h3>
      
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: 16, marginBottom: 16 }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 28, fontWeight: 'bold', color: headingColor }}>{stats.totalExams}</div>
          <div style={{ fontSize: 12, color: secondaryText }}>Exams Taken</div>
        </div>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 28, fontWeight: 'bold', color: '#2e7d32' }}>{stats.passed}</div>
          <div style={{ fontSize: 12, color: secondaryText }}>Passed</div>
        </div>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 28, fontWeight: 'bold', color: '#c62828' }}>{stats.failed}</div>
          <div style={{ fontSize: 12, color: secondaryText }}>Failed</div>
        </div>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 28, fontWeight: 'bold', color: '#ff9800' }}>{stats.passRate}%</div>
          <div style={{ fontSize: 12, color: secondaryText }}>Pass Rate</div>
        </div>
      </div>

      {stats.recentScores.length > 0 && (
        <div>
          <p style={{ fontSize: 13, color: secondaryText, marginBottom: 8 }}>Recent Attempts:</p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {stats.recentScores.map((attempt, idx) => (
              <span key={idx} style={{
                padding: '4px 12px',
                borderRadius: 20,
                fontSize: 12,
                background: attempt.percentage >= 70 ? '#e8f5e9' : '#ffebee',
                color: attempt.percentage >= 70 ? '#2e7d32' : '#c62828',
                fontWeight: 'bold'
              }}>
                {attempt.title?.substring(0, 20) || 'Exam'} – {attempt.percentage}%
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};