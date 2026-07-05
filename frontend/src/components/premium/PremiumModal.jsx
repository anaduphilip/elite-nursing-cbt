import React, { useState, useContext } from 'react';
import { AuthContext } from '../../context/AuthContext';
import { getHeadingColor, getSecondaryText, getCardBg } from '../../utils/theme';
import axios from 'axios';

export const PremiumModal = ({ onClose, examTitle, sectionNumber }) => {
  const { token, user, darkMode } = useContext(AuthContext);
  const [loading, setLoading] = useState(false);
  const headingColor = getHeadingColor(darkMode);
  const secondaryText = getSecondaryText(darkMode);
  const cardBg = getCardBg(darkMode);

  const handleUpgrade = () => {
    onClose();
    window.location.href = '/get-premium';
  };

  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
      background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center',
      justifyContent: 'center', zIndex: 2000
    }}>
      <div style={{
        background: cardBg, borderRadius: 20, padding: 28, maxWidth: 360,
        textAlign: 'center', margin: '20px'
      }}>
        <div style={{ fontSize: 48, marginBottom: 10 }}>⭐</div>
        <h2 style={{ color: headingColor, fontSize: 22, margin: '10px 0' }}>Premium Required</h2>
        <p style={{ fontSize: 15, marginBottom: 10 }}><strong>{examTitle}</strong> is premium content.</p>
        <p style={{ fontSize: 14, marginBottom: 15, color: secondaryText }}>
          Subscribe to a plan to unlock ALL premium exams!
        </p>
        <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
          <button onClick={onClose} style={{ flex: 1, background: '#6c757d', color: 'white', padding: 12, border: 'none', borderRadius: 10, cursor: 'pointer', fontWeight: '500', fontSize: 14 }}>Cancel</button>
          <button onClick={handleUpgrade} style={{ flex: 1, background: '#ff9800', color: 'white', padding: 12, border: 'none', borderRadius: 10, cursor: 'pointer', fontWeight: 'bold', fontSize: 14 }}>
            View Plans →
          </button>
        </div>
      </div>
    </div>
  );
};