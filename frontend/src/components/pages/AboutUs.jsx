// src/components/pages/AboutUs.jsx
import React, { useContext } from 'react';
import { Link } from 'react-router-dom';
import { AuthContext } from '../../context/AuthContext';
import { getHeadingColor, getSecondaryText } from '../../utils/theme';

export const AboutUs = () => {
  const { darkMode } = useContext(AuthContext);
  const headingColor = getHeadingColor(darkMode);
  const secondaryText = getSecondaryText(darkMode);
  return (
    <div style={{ background: darkMode ? '#1a1a2e' : '#f0f7f4', minHeight: '100vh', padding: '20px' }}>
      <div style={{ maxWidth: 800, margin: '0 auto', background: darkMode ? '#16213e' : 'white', borderRadius: 20, padding: 30, boxShadow: '0 4px 15px rgba(0,0,0,0.1)' }}>
        <h2 style={{ color: headingColor, textAlign: 'center', marginBottom: 20 }}>About Us</h2>
        <p style={{ lineHeight: 1.8, marginBottom: 20, color: darkMode ? '#ccc' : '#555' }}>ELITE NURSING & MIDWIFERY CBT is a premier Computer Based Testing platform designed specifically for nursing and midwifery students.</p>
        <p style={{ lineHeight: 1.8, marginBottom: 20, color: darkMode ? '#ccc' : '#555' }}>Our mission is to provide high-quality, accessible exam preparation materials that help students succeed in their nursing and midwifery licensing examinations.</p>
        <p style={{ lineHeight: 1.8, marginBottom: 20, color: darkMode ? '#ccc' : '#555' }}>With over 20,000 practice questions covering General Nursing, Midwifery, Pediatric Nursing, Dental Nursing, and Public Health, we are committed to excellence in nursing education.</p>
        <h3 style={{ color: '#ff9800', marginTop: 30 }}>Coming Soon</h3>
        <p>NCLEX Practice questions are coming soon!</p>
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