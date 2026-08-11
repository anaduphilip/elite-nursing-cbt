// src/components/pages/PrivacyPolicy.jsx
import React, { useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../../context/AuthContext';
import { getHeadingColor, getSecondaryText } from '../../utils/theme';

export const PrivacyPolicy = () => {
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
        <h2 style={{ color: headingColor, textAlign: 'center', marginBottom: 20 }}>Privacy Policy</h2>
        <p><strong>Last updated:</strong> June 2026</p>
        <p>ELITE Nursing & Midwifery CBT ("we", "our", "us") is committed to protecting your privacy. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our mobile application and website (collectively, the "Platform").</p>
        
        <h3 style={{ color: headingColor, marginTop: 20 }}>1. Information We Collect</h3>
        <p>We collect the following types of information:</p>
        <ul style={{ paddingLeft: 20 }}>
          <li><strong>Personal Identification Information:</strong> Name, email address, and phone number (if provided).</li>
          <li><strong>Account Credentials:</strong> Hashed password (we do not store plain-text passwords).</li>
          <li><strong>Quiz Activity:</strong> Exam attempts, scores, and progress.</li>
          <li><strong>Payment Information:</strong> Transaction records (via Flutterwave) – we do not store full card details.</li>
          <li><strong>Device Information:</strong> Device tokens for push notifications (via Firebase Cloud Messaging).</li>
          <li><strong>Usage Data:</strong> IP address, browser type, and interaction with the Platform.</li>
        </ul>

        <h3 style={{ color: headingColor, marginTop: 20 }}>2. How We Use Your Information</h3>
        <ul style={{ paddingLeft: 20 }}>
          <li>To create and manage your account.</li>
          <li>To provide exam content and track your progress.</li>
          <li>To process payments and activate premium features.</li>
          <li>To send you important notifications (e.g., password reset, payment confirmation).</li>
          <li>To improve our services and user experience.</li>
        </ul>

        <h3 style={{ color: headingColor, marginTop: 20 }}>3. Sharing Your Information</h3>
        <p>We do not sell or rent your personal data. We may share your information with:</p>
        <ul style={{ paddingLeft: 20 }}>
          <li><strong>Service Providers:</strong> MongoDB Atlas (database), Brevo (email), Firebase (push notifications), Flutterwave (payments) – all are GDPR/Privacy Shield compliant.</li>
          <li><strong>Legal Authorities:</strong> If required by law or to protect our rights.</li>
        </ul>

        <h3 style={{ color: headingColor, marginTop: 20 }}>4. Data Security</h3>
        <p>We implement industry-standard measures (encryption, secure connections, access controls) to protect your data. However, no method of transmission over the internet is 100% secure.</p>

        <h3 style={{ color: headingColor, marginTop: 20 }}>5. Your Rights</h3>
        <ul style={{ paddingLeft: 20 }}>
          <li>You may access, update, or delete your personal information by logging into your account or contacting us.</li>
          <li>You can opt out of push notifications via your device settings.</li>
          <li>You can request deletion of your account and associated data.</li>
        </ul>

        <h3 style={{ color: headingColor, marginTop: 20 }}>6. Data Retention</h3>
        <p>We retain your data as long as your account is active. You can delete your account at any time; we will remove your personal data within a reasonable period, except for records required for legal or compliance reasons.</p>

        <h3 style={{ color: headingColor, marginTop: 20 }}>7. Children's Privacy</h3>
        <p>Our Platform is not intended for children under the age of 13. We do not knowingly collect personal information from children.</p>

        <h3 style={{ color: headingColor, marginTop: 20 }}>8. Changes to This Policy</h3>
        <p>We may update this policy from time to time. We will notify you of any changes by posting the new policy on this page and updating the "Last updated" date.</p>

        <h3 style={{ color: headingColor, marginTop: 20 }}>9. Contact Us</h3>
        <p>If you have questions about this Privacy Policy, please contact us at:</p>
        <p>Email: elitenursingcbt@gmail.com</p>
        <p>Phone/WhatsApp: 09063908476</p>
      </div>
    </div>
  );
};