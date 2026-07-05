import React, { useState, useEffect, useContext } from 'react';
import { Link } from 'react-router-dom';
import { AuthContext } from '../../context/AuthContext';
import { getHeadingColor, getSecondaryText } from '../../utils/theme';

export const LoadingWithBar = ({ message = "Loading", onComplete }) => {
  const [progress, setProgress] = useState(0);
  const { darkMode } = useContext(AuthContext);
  const headingColor = getHeadingColor(darkMode);
  const secondaryText = getSecondaryText(darkMode);

  useEffect(() => {
    const interval = setInterval(() => {
      setProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval);
          if (onComplete) onComplete();
          return 100;
        }
        return prev + Math.random() * 15;
      });
    }, 200);
    return () => clearInterval(interval);
  }, [onComplete]);

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
        <div style={{ fontSize: 48, marginBottom: 16 }}>📚</div>
        <h2 style={{ color: headingColor, fontSize: 20, marginBottom: 8 }}>ELITE NURSING & MIDWIFERY CBT</h2>
        <p style={{ color: secondaryText, fontSize: 12, marginBottom: 20 }}>Computer Based Testing Platform</p>
        <p style={{ color: headingColor, fontSize: 14, marginBottom: 10 }}>{message}...</p>
        <div style={{
          width: '100%',
          height: 8,
          background: '#e0e0e0',
          borderRadius: 4,
          overflow: 'hidden'
        }}>
          <div style={{
            width: `${Math.min(progress, 100)}%`,
            height: '100%',
            background: 'linear-gradient(90deg, #1e3c72, #2a5298)',
            borderRadius: 4,
            transition: 'width 0.3s ease'
          }} />
        </div>
        <p style={{ color: headingColor, fontSize: 12, marginTop: 10 }}>{Math.floor(Math.min(progress, 100))}%</p>
      </div>
      <div style={{
        position: 'absolute',
        bottom: 20,
        left: 0,
        right: 0,
        textAlign: 'center'
      }}>
        <p style={{ color: secondaryText, fontSize: 10 }}>© 2026 ELITE Nursing & Midwifery CBT. All rights reserved.{' '}
  <Link to="/privacy" style={{ color: '#2196f3', fontSize: 11, textDecoration: 'none', marginLeft: 4 }}>
    Privacy Policy
  </Link>
  <span style={{ color: secondaryText, margin: '0 6px' }}>|</span>
  <Link to="/terms" style={{ color: '#2196f3', fontSize: 11, textDecoration: 'none' }}>
    Terms & Conditions
  </Link></p>
      </div>
    </div>
  );
};