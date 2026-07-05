// src/components/pages/JoinWhatsApp.jsx
import React, { useContext } from 'react';
import { Link } from 'react-router-dom';
import { AuthContext } from '../../context/AuthContext';
import { getHeadingColor, getSecondaryText, getTextColor, getCardBg, getBorderColor } from '../../utils/theme';

export const JoinWhatsApp = () => {
  const { darkMode } = useContext(AuthContext);
  const headingColor = getHeadingColor(darkMode);
  const secondaryText = getSecondaryText(darkMode);
  const textColor = getTextColor(darkMode);
  const cardBg = getCardBg(darkMode);
  const borderColor = getBorderColor(darkMode);
  return (
    <div style={{ background: darkMode ? '#1a1a2e' : '#f0f7f4', minHeight: '100vh', padding: '20px' }}>
      <div style={{ maxWidth: 500, margin: '0 auto', background: darkMode ? '#16213e' : 'white', borderRadius: 20, padding: 30, textAlign: 'center', boxShadow: '0 4px 15px rgba(0,0,0,0.1)' }}>
        <div style={{ fontSize: 64, marginBottom: 16 }}>💬</div>
        <h2 style={{ color: headingColor, marginBottom: 10 }}>Join Our WhatsApp Community</h2>
        <p style={{ marginBottom: 20, fontSize: 14 }}>Get instant updates, study tips, and connect with fellow nursing students!</p>
        <div style={{ background: darkMode ? '#1a1a2e' : '#f0f7f4', padding: 16, borderRadius: 12, marginBottom: 20, textAlign: 'left' }}>
          <h3 style={{ color: headingColor, fontSize: 16, marginBottom: 10 }}>What you'll get:</h3>
          <ul style={{ listStyle: 'none', padding: 0, fontSize: 13 }}>
            <li style={{ marginBottom: 6 }}>✓ Daily practice questions</li>
            <li style={{ marginBottom: 6 }}>✓ Exam tips and strategies</li>
            <li style={{ marginBottom: 6 }}>✓ Updates on new features</li>
            <li style={{ marginBottom: 6 }}>✓ Peer support and discussions</li>
            <li style={{ marginBottom: 6 }}>✓ Special announcements</li>
          </ul>
        </div>
        <a href="https://chat.whatsapp.com/HdpwnXzyrLrIqwnpjZqVsb" target="_blank" rel="noopener noreferrer" style={{ textDecoration: 'none' }}>
          <button style={{ background: '#25D366', color: 'white', padding: '12px 30px', border: 'none', borderRadius: 30, cursor: 'pointer', fontSize: 16, fontWeight: 'bold' }}>Join WhatsApp Group</button>
        </a>
      </div>
      <div style={{ textAlign: 'center', padding: '20px', marginTop: 20 }}>
        <p style={{ color: secondaryText, fontSize: 12 }}>© 2026 ELITE Nursing & Midwifery CBT. All rights reserved.{' '}
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