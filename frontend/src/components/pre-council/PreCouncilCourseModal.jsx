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

  const handleBack = () => {
    onClose(); // Close the modal (which essentially goes back to papers)
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
        boxShadow: '0 8px 30px rgba(0,0,0,0.3)',
        position: 'relative'
      }}>
        {/* ===== BACK ARROW BUTTON (replaces ✕) ===== */}
        <button
          onClick={handleBack}
          style={{
            position: 'absolute',
            top: '16px',
            left: '16px',
            zIndex: 10,
            background: darkMode ? '#2d2d3d' : '#ffffff',
            color: headingColor,
            border: `1px solid ${darkMode ? '#444' : '#ddd'}`,
            borderRadius: '50%',
            width: '40px',
            height: '40px',
            fontSize: '18px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'transform 0.2s ease, box-shadow 0.2s ease',
            boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
            backdropFilter: 'blur(4px)',
            backgroundColor: darkMode ? 'rgba(26, 26, 46, 0.85)' : 'rgba(255, 255, 255, 0.9)'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'scale(1.08)';
            e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.2)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'scale(1)';
            e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.1)';
          }}
          aria-label="Go back"
        >
          ←
        </button>

        <div style={{ marginLeft: '48px' }}>
          {/* Title now has left margin to avoid overlap with back button */}
          <h2 style={{ color: headingColor, marginTop: 0, marginBottom: 16 }}>
            {paper.name} – Courses
          </h2>
        </div>

        <p style={{ color: secondaryText, marginBottom: 16 }}>
          This paper covers the following courses:
        </p>
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