// src/context/AlertContext.jsx
import React, { createContext, useState, useContext, useCallback } from 'react';
import { getHeadingColor, getSecondaryText, getTextColor, getCardBg, getBorderColor } from '../utils/theme';

const AlertContext = createContext();

export const useAlert = () => useContext(AlertContext);

export const AlertProvider = ({ children }) => {
  const { darkMode } = useContext(useContext)?.darkMode || { darkMode: false }; // We'll get darkMode from AuthContext in modal
  const [alertData, setAlertData] = useState(null);

  const showAlert = useCallback((message, title = 'Notice') => {
    return new Promise((resolve) => {
      setAlertData({
        message,
        title,
        onConfirm: () => {
          setAlertData(null);
          resolve();
        }
      });
    });
  }, []);

  // Override the global alert
  React.useEffect(() => {
    const originalAlert = window.alert;
    window.alert = (message) => {
      showAlert(message);
    };
    return () => {
      window.alert = originalAlert;
    };
  }, [showAlert]);

  return (
    <AlertContext.Provider value={{ showAlert }}>
      {children}
      {alertData && <AlertModal {...alertData} />}
    </AlertContext.Provider>
  );
};

// AlertModal component – uses AuthContext for darkMode
const AlertModal = ({ message, title, onConfirm }) => {
  const { darkMode } = useContext(useContext)?.darkMode || { darkMode: false };
  const headingColor = getHeadingColor(darkMode);
  const secondaryText = getSecondaryText(darkMode);
  const textColor = getTextColor(darkMode);
  const cardBg = getCardBg(darkMode);
  const borderColor = getBorderColor(darkMode);

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
      zIndex: 99999,
      padding: '20px',
      backdropFilter: 'blur(5px)'
    }}>
      <div style={{
        background: cardBg,
        borderRadius: 24,
        padding: '28px 32px',
        maxWidth: 420,
        width: '100%',
        boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
        textAlign: 'center',
        border: `1px solid ${borderColor}`
      }}>
        <div style={{ fontSize: 48, marginBottom: 12 }}>📢</div>
        <h3 style={{ color: headingColor, fontSize: 20, marginBottom: 8, fontWeight: 'bold' }}>
          {title}
        </h3>
        <p style={{ color: textColor, fontSize: 16, lineHeight: 1.6, marginBottom: 24 }}>
          {message}
        </p>
        <button
          onClick={onConfirm}
          style={{
            background: 'linear-gradient(135deg, #1e3c72 0%, #2a5298 100%)',
            color: 'white',
            border: 'none',
            padding: '12px 32px',
            borderRadius: 30,
            fontSize: 16,
            fontWeight: 'bold',
            cursor: 'pointer',
            transition: 'transform 0.2s',
            boxShadow: '0 4px 12px rgba(0,0,0,0.15)'
          }}
          onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.03)'}
          onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
        >
          OK
        </button>
      </div>
    </div>
  );
};