// src/components/common/LogoutModal.jsx
import React, { useContext } from 'react';
import axios from 'axios';
import { AuthContext } from '../../context/AuthContext';
import { getHeadingColor, getSecondaryText, getCardBg, getBorderColor } from '../../utils/theme';

export const LogoutModal = ({ isOpen, onClose }) => {
  const { logout, darkMode } = useContext(AuthContext);
  const headingColor = getHeadingColor(darkMode);
  const secondaryText = getSecondaryText(darkMode);
  const cardBg = getCardBg(darkMode) || 'white';
  const borderColor = getBorderColor(darkMode) || '#e0e0e0';

  if (!isOpen) return null;

  const handleConfirm = async () => {
    try {
      const token = localStorage.getItem('auth') ? JSON.parse(localStorage.getItem('auth')).token : null;
      if (token) {
        await axios.post('/api/logout', {}, { headers: { Authorization: `Bearer ${token}` } });
      }
    } catch (error) {
      console.error('Logout error:', error);
    }
    onClose();
    logout();
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
      zIndex: 100000,
      padding: '20px',
      backdropFilter: 'blur(4px)'
    }}>
      <div style={{
        background: cardBg,
        borderRadius: 20,
        padding: 28,
        maxWidth: 340,
        width: '100%',
        textAlign: 'center',
        boxShadow: '0 20px 40px rgba(0,0,0,0.3)',
        border: `1px solid ${borderColor}`
      }}>
        <div style={{ fontSize: 52, marginBottom: 16 }}></div>
        <h3 style={{ color: headingColor, marginBottom: 8, fontSize: 20 }}>Confirm Logout</h3>
        <p style={{ color: secondaryText, fontSize: 14, marginBottom: 24 }}>
          Are you sure you want to logout?
        </p>
        <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
          <button
            onClick={onClose}
            style={{
              flex: 1,
              background: '#6c757d',
              color: 'white',
              padding: '10px 24px',
              border: 'none',
              borderRadius: 8,
              cursor: 'pointer',
              fontWeight: 'bold',
              fontSize: 14
            }}
          >
            Cancel
          </button>
          <button
            onClick={handleConfirm}
            style={{
              flex: 1,
              background: '#dc3545',
              color: 'white',
              padding: '10px 24px',
              border: 'none',
              borderRadius: 8,
              cursor: 'pointer',
              fontWeight: 'bold',
              fontSize: 14
            }}
          >
            Logout
          </button>
        </div>
      </div>
    </div>
  );
};