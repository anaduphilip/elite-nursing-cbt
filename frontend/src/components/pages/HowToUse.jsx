// src/components/pages/HowToUse.jsx
import React, { useContext } from 'react';
import { Link } from 'react-router-dom';
import { AuthContext } from '../../context/AuthContext';
import { getHeadingColor, getSecondaryText } from '../../utils/theme';

export const HowToUse = () => {
  const { darkMode } = useContext(AuthContext);
  const headingColor = getHeadingColor(darkMode);
  const secondaryText = getSecondaryText(darkMode);
  
  return (
    <div style={{ background: darkMode ? '#1a1a2e' : '#f0f7f4', minHeight: '100vh', padding: '20px' }}>
      <div style={{ maxWidth: 800, margin: '0 auto', background: darkMode ? '#16213e' : 'white', borderRadius: 20, padding: 30, boxShadow: '0 4px 15px rgba(0,0,0,0.1)' }}>
        <h2 style={{ color: headingColor, textAlign: 'center', marginBottom: 20 }}>📖 How To Use ELITE CBT</h2>
        
        <div style={{ marginBottom: 30 }}>
          <h3 style={{ color: headingColor, marginBottom: 10 }}>🆓 Free Mode</h3>
          <ul style={{ lineHeight: 1.8, color: darkMode ? '#ccc' : '#555', paddingLeft: 20 }}>
            <li>✓ Access Examination 1 of ANY course for FREE</li>
            <li>✓ Each free exam can only be taken ONCE</li>
            <li>✓ Your score is saved and displayed</li>
            <li>✓ Review your answers after completion</li>
            <li>✓ Upgrade to Premium to retake and unlock all exams</li>
          </ul>
        </div>
        
        <div style={{ marginBottom: 30 }}>
          <h3 style={{ color: '#ff9800', marginBottom: 10 }}>⭐ Premium Mode</h3>
          <ul style={{ lineHeight: 1.8, color: darkMode ? '#ccc' : '#555', paddingLeft: 20 }}>
            <li>✓ View ALL examinations across ALL courses</li>
            <li>✓ Premium badge shows which exams require upgrade</li>
            <li>✓ Upgrade and Choose a subscription plan that suits you to unlock everything</li>
            <li>✓ Lifetime access to 20,000+ questions</li>
            <li>✓ Unlimited exam retakes</li>
          </ul>
        </div>
        
        <div style={{ marginBottom: 30 }}>
          <h3 style={{ color: headingColor, marginBottom: 10 }}>📱 Navigation Tips</h3>
          <ul style={{ lineStyle: 'none', lineHeight: 1.8, color: darkMode ? '#ccc' : '#555', paddingLeft: 0 }}>
            <li>🏠 <strong>Home</strong> - Select FREE or PREMIUM mode</li>
            <li>📚 <strong>Categories</strong> - Choose your subject area</li>
            <li>📖 <strong>Courses</strong> - Select specific topic</li>
            <li>📝 <strong>Exams</strong> - Take your chosen examination</li>
            <li>⭐ <strong>Get Premium</strong> - Upgrade for full access </li>
          </ul>
        </div>
        
        <div style={{ background: darkMode ? '#1a1a2e' : '#f0f7f4', padding: 16, borderRadius: 12, textAlign: 'center' }}>
          <p style={{ color: '#ff9800', fontWeight: 'bold', margin: 0 }}>Need help? Contact us via WhatsApp or Email!</p>
        </div>
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