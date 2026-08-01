// src/components/common/LoadingWithBar.jsx
import React, { useState, useEffect, useContext } from 'react';
import { Link } from 'react-router-dom';
import { AuthContext } from '../../context/AuthContext';
import { getHeadingColor, getSecondaryText } from '../../utils/theme';

export const LoadingWithBar = ({ message = "Loading" }) => {
  const { darkMode } = useContext(AuthContext);
  const headingColor = getHeadingColor(darkMode);
  const secondaryText = getSecondaryText(darkMode);
  const [dots, setDots] = useState('');

  useEffect(() => {
    const interval = setInterval(() => {
      setDots(prev => {
        if (prev.length >= 3) return '';
        return prev + '.';
      });
    }, 400);
    return () => clearInterval(interval);
  }, []);

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'center',
      alignItems: 'center',
      minHeight: '100vh',
      width: '100%',
      background: darkMode ? '#1a1a2e' : '#f0f7f4',
      position: 'relative'
    }}>
      <div style={{ textAlign: 'center', maxWidth: 300, width: '100%' }}>
        {/* Branded Spinner – your logo spinning */}
        <div style={{
          display: 'inline-block',
          animation: 'spin 1.2s linear infinite',
          marginBottom: 16,
          borderRadius: '50%',
          overflow: 'hidden',
          width: 80,
          height: 80,
          boxShadow: '0 4px 20px rgba(0,0,0,0.08)'
        }}>
          <img 
            src="/logo.png" 
            alt="ELITE Nursing CBT"
            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
          />
        </div>

        <h2 style={{ color: headingColor, fontSize: 20, marginBottom: 8 }}>ELITE NURSING & MIDWIFERY CBT</h2>
        <p style={{ color: secondaryText, fontSize: 12, marginBottom: 20 }}>Computer Based Testing Platform</p>

        <p style={{ color: headingColor, fontSize: 16, marginBottom: 10 }}>
          {message}{dots}
        </p>

        <style>{`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}</style>
      </div>
      <div style={{
        position: 'absolute',
        bottom: 20,
        left: 0,
        right: 0,
        textAlign: 'center'
      }}>
        <p style={{ color: secondaryText, fontSize: 10 }}>
          © 2026 ELITE Nursing & Midwifery CBT. All rights reserved.{' '}
          <Link to="/privacy" style={{ color: '#2196f3', fontSize: 11, textDecoration: 'none', marginLeft: 4 }}>
            Privacy Policy
          </Link>
          <span style={{ color: secondaryText, margin: '0 6px' }}>|</span>
          <Link to="/terms" style={{ color: '#2196f3', fontSize: 11, textDecoration: 'none' }}>
            Terms & Conditions
          </Link>
        </p>
      </div>
    </div>
  );
};