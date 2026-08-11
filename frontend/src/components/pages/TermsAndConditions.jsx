// src/components/pages/TermsAndConditions.jsx
import React, { useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../../context/AuthContext';
import { getHeadingColor, getSecondaryText } from '../../utils/theme';

export const TermsAndConditions = () => {
  const { darkMode } = useContext(AuthContext);
  const headingColor = getHeadingColor(darkMode);
  const secondaryText = getSecondaryText(darkMode);
  const navigate = useNavigate();

  const goBack = () => {
    navigate(-1);
  };

  // Floating Back Button style
  const backButtonStyle = {
    position: 'fixed',
    bottom: '24px',
    left: '50%',
    transform: 'translateX(-50%)',
    zIndex: 1000,
    background: darkMode ? '#2d2d3d' : '#ffffff',
    color: headingColor,
    border: `1px solid ${darkMode ? '#444' : '#ddd'}`,
    borderRadius: '30px',
    padding: '10px 28px',
    fontSize: '15px',
    fontWeight: 600,
    cursor: 'pointer',
    boxShadow: '0 4px 16px rgba(0,0,0,0.15)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
    transition: 'transform 0.2s ease, box-shadow 0.2s ease',
    backdropFilter: 'blur(4px)',
    backgroundColor: darkMode ? 'rgba(26, 26, 46, 0.85)' : 'rgba(255, 255, 255, 0.9)'
  };

  return (
    <div style={{ background: darkMode ? '#1a1a2e' : '#f0f7f4', minHeight: '100vh', padding: '40px 20px' }}>
      <button
        onClick={goBack}
        style={backButtonStyle}
        onMouseEnter={(e) => {
          e.currentTarget.style.transform = 'translateX(-50%) scale(1.05)';
          e.currentTarget.style.boxShadow = '0 6px 24px rgba(0,0,0,0.2)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.transform = 'translateX(-50%) scale(1)';
          e.currentTarget.style.boxShadow = '0 4px 16px rgba(0,0,0,0.15)';
        }}
        aria-label="Go back"
      >
        Back
      </button>

      <div style={{ maxWidth: 800, margin: '0 auto', background: darkMode ? '#16213e' : 'white', borderRadius: 20, padding: 30, boxShadow: '0 4px 15px rgba(0,0,0,0.1)', color: darkMode ? '#eee' : '#333' }}>
        <h2 style={{ color: headingColor, textAlign: 'center', marginBottom: 20 }}>Terms and Conditions</h2>
        <p><strong>Last updated:</strong> June 2026</p>
        <p>Welcome to ELITE Nursing & Midwifery CBT. By using our Platform, you agree to comply with and be bound by the following terms and conditions. Please read them carefully.</p>

        <h3 style={{ color: headingColor, marginTop: 20 }}>1. Acceptance of Terms</h3>
        <p>By creating an account or using our Platform, you agree to these Terms and Conditions. If you do not agree, please do not use the Platform.</p>

        <h3 style={{ color: headingColor, marginTop: 20 }}>2. User Accounts</h3>
        <ul style={{ paddingLeft: 20 }}>
          <li>You must provide accurate and complete information when creating an account.</li>
          <li>You are responsible for maintaining the confidentiality of your login credentials.</li>
          <li>You are responsible for all activities that occur under your account.</li>
          <li>You must be at least 13 years old to use the Platform.</li>
        </ul>

        <h3 style={{ color: headingColor, marginTop: 20 }}>3. Acceptable Use</h3>
        <p>You agree not to:</p>
        <ul style={{ paddingLeft: 20 }}>
          <li>Use the Platform for any unlawful purpose.</li>
          <li>Share or distribute questions, answers, or exam content outside the Platform.</li>
          <li>Attempt to reverse-engineer or exploit the Platform.</li>
          <li>Impersonate another user or provide false information.</li>
          <li>Use automated scripts or bots to interact with the Platform.</li>
        </ul>

        <h3 style={{ color: headingColor, marginTop: 20 }}>4. Intellectual Property</h3>
        <ul style={{ paddingLeft: 20 }}>
          <li>All content on the Platform, including questions, answers, graphics, and logos, is the property of ELITE Nursing & Midwifery CBT or its licensors.</li>
          <li>You may not copy, reproduce, distribute, or create derivative works without our prior written consent.</li>
        </ul>

        <h3 style={{ color: headingColor, marginTop: 20 }}>5. Payments and Refunds</h3>
        <ul style={{ paddingLeft: 20 }}>
          <li>Premium features are available via any subscription plan that suits you (subject to change).</li>
          <li>Payments are processed securely via Flutterwave.</li>
          <li>All payments are non-refundable unless otherwise required by law.</li>
          <li>Premium access is granted immediately upon successful payment verification.</li>
        </ul>

        <h3 style={{ color: headingColor, marginTop: 20 }}>6. Disclaimer of Warranties</h3>
        <p>The Platform is provided "as is" without any warranties of any kind, express or implied. We do not guarantee that the Platform will be error‑free, secure, or uninterrupted.</p>

        <h3 style={{ color: headingColor, marginTop: 20 }}>7. Limitation of Liability</h3>
        <p>To the fullest extent permitted by law, ELITE Nursing & Midwifery CBT shall not be liable for any indirect, incidental, special, consequential, or punitive damages arising from your use of the Platform.</p>

        <h3 style={{ color: headingColor, marginTop: 20 }}>8. Termination</h3>
        <ul style={{ paddingLeft: 20 }}>
          <li>We reserve the right to suspend or terminate your account if you violate these Terms.</li>
          <li>You may delete your account at any time by contacting us.</li>
        </ul>

        <h3 style={{ color: headingColor, marginTop: 20 }}>9. Changes to Terms</h3>
        <p>We may update these Terms from time to time. Continued use of the Platform after changes constitutes acceptance of the revised Terms.</p>

        <h3 style={{ color: headingColor, marginTop: 20 }}>10. Governing Law</h3>
        <p>These Terms are governed by the laws of Nigeria. Any disputes arising from these Terms shall be subject to the exclusive jurisdiction of the courts of Nigeria.</p>

        <h3 style={{ color: headingColor, marginTop: 20 }}>11. Contact Us</h3>
        <p>If you have any questions about these Terms, please contact us:</p>
        <p>Email: elitenursingcbt@gmail.com</p>
        <p>Phone/WhatsApp: 09063908476</p>
      </div>
    </div>
  );
};