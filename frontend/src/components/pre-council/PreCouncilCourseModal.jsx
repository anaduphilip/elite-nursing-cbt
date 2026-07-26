// src/components/pre-council/PreCouncilCourseModal.jsx
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { getHeadingColor, getSecondaryText, getCardBg } from '../../utils/theme';
import { AuthContext } from '../../context/AuthContext';

export const PreCouncilCourseModal = ({ paper, categorySlug, onClose }) => {
  const { darkMode } = React.useContext(AuthContext);
  const navigate = useNavigate();
  const headingColor = getHeadingColor(darkMode);
  const secondaryText = getSecondaryText(darkMode);
  const cardBg = getCardBg(darkMode);

  const handleProceed = () => {
    onClose();
    navigate(`/pre-council/${categorySlug}/${paper.slug}/exams`);
  };

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: 'rgba(0,0,0,0.7)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 2000,
      padding: 20
    }}>
      <div style={{
        background: cardBg,
        borderRadius: 20,
        padding: 28,
        maxWidth: 500,
        width: '100%',
        maxHeight: '80vh',
        overflowY: 'auto',
        boxShadow: '0 8px 30px rgba(0,0,0,0.3)'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <h2 style={{ color: headingColor, margin: 0 }}>{paper.name} – Courses</h2>
          <button onClick={onClose} style={{ background: 'none', border: 'none', fontSize: 24, cursor: 'pointer', color: secondaryText }}>✕</button>
        </div>
        <p style={{ color: secondaryText, marginBottom: 16 }}>This paper covers the following courses:</p>
        <ul style={{ listStyle: 'none', padding: 0 }}>
          {paper.courses.map((course, idx) => (
            <li key={idx} style={{
              padding: '10px 14px',
              marginBottom: 8,
              background: darkMode ? '#1a1a2e' : '#f0f7f4',
              borderRadius: 8,
              color: headingColor,
              fontWeight: '500'
            }}>
              {idx+1}. {course}
            </li>
          ))}
        </ul>
        <button
          onClick={handleProceed}
          style={{
            width: '100%',
            marginTop: 16,
            background: '#28a745',
            color: 'white',
            padding: '14px',
            border: 'none',
            borderRadius: 10,
            cursor: 'pointer',
            fontWeight: 'bold',
            fontSize: 16
          }}
        >
          Proceed to Exams
        </button>
      </div>
    </div>
  );
};