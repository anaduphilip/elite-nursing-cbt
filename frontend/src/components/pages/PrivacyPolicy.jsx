// src/components/pages/PrivacyPolicy.jsx
import React, { useContext } from 'react';
import { AuthContext } from '../../context/AuthContext';
import { getHeadingColor, getSecondaryText } from '../../utils/theme';

export const PrivacyPolicy = () => {
  const { darkMode } = useContext(AuthContext);
  const headingColor = getHeadingColor(darkMode);
  const secondaryText = getSecondaryText(darkMode);
  return (
    <div style={{ background: darkMode ? '#1a1a2e' : '#f0f7f4', minHeight: '100vh', padding: '40px 20px' }}>
      <div style={{ maxWidth: 800, margin: '0 auto', background: darkMode ? '#16213e' : 'white', borderRadius: 20, padding: 30, boxShadow: '0 4px 15px rgba(0,0,0,0.1)', color: darkMode ? '#eee' : '#333' }}>
        <button
          onClick={() => window.history.back()}
          style={{
            background: 'none',
            border: 'none',
            fontSize: 16,
            cursor: 'pointer',
            color: headingColor,
            marginBottom: 16,
            display: 'inline-flex',
            alignItems: 'center',
            gap: 8
          }}
        >
          ← Back
        </button>
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