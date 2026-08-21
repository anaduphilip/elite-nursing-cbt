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

  const backButtonStyle = {
    position: 'fixed',
    bottom: '28px',
    left: '50%',
    transform: 'translateX(-50%)',
    zIndex: 1000,
    background: darkMode ? '#2d2d3d' : '#ffffff',
    color: headingColor,
    border: `1px solid ${darkMode ? '#555' : '#ddd'}`,
    borderRadius: '40px',
    padding: '12px 28px',
    fontSize: '14px',
    fontWeight: 500,
    cursor: 'pointer',
    boxShadow: '0 4px 20px rgba(0,0,0,0.12)',
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    transition: 'all 0.25s ease',
    backdropFilter: 'blur(6px)',
    backgroundColor: darkMode ? 'rgba(26, 26, 46, 0.85)' : 'rgba(255, 255, 255, 0.9)',
    fontFamily: 'system-ui, -apple-system, sans-serif'
  };

  return (
    <div
      style={{
        background: darkMode ? '#0d0d1a' : '#f0f4f8',
        minHeight: '100vh',
        padding: '60px 20px 100px',
        display: 'flex',
        justifyContent: 'center',
        fontFamily: 'system-ui, -apple-system, sans-serif'
      }}
    >
      <div
        style={{
          maxWidth: 820,
          width: '100%',
          background: darkMode ? '#16213e' : '#ffffff',
          borderRadius: '28px',
          padding: '48px 44px',
          boxShadow: darkMode
            ? '0 12px 40px rgba(0,0,0,0.5)'
            : '0 12px 40px rgba(0,0,0,0.08)',
          color: darkMode ? '#e8edf5' : '#1a2332',
          lineHeight: 1.7,
          textAlign: 'left',
          position: 'relative'
        }}
      >
        {/* Header */}
        <div style={{ marginBottom: 32 }}>
          <h1
            style={{
              fontSize: '1.8rem',
              fontWeight: 700,
              color: headingColor,
              letterSpacing: '-0.5px',
              borderBottom: `2px solid ${darkMode ? '#2a3a5a' : '#e2e8f0'}`,
              paddingBottom: 16,
              margin: 0
            }}
          >
            Privacy Policy
          </h1>
          <p
            style={{
              color: secondaryText,
              fontSize: '0.95rem',
              marginTop: 10,
              opacity: 0.8
            }}
          >
            <strong>Last updated:</strong> August 2026
          </p>
        </div>

        {/* Intro paragraph */}
        <p style={{ fontSize: '1.05rem', marginBottom: 28, textAlign: 'left' }}>
          ELITE Nursing & Midwifery CBT ("we", "our", "us") is committed to protecting your privacy. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our mobile application and website (collectively, the "Platform").
        </p>

        {/* Sections – 1 to 13 (excluding Contact) */}
        {sections.map((section, idx) => (
          <div
            key={idx}
            style={{
              marginBottom: 28,
              paddingBottom: 24,
              borderBottom:
                idx < sections.length - 1
                  ? `1px solid ${darkMode ? '#1e2d47' : '#edf2f7'}`
                  : 'none'
            }}
          >
            <h3
              style={{
                color: headingColor,
                fontSize: '1.25rem',
                fontWeight: 600,
                marginBottom: 12,
                display: 'flex',
                alignItems: 'center',
                gap: 8
              }}
            >
              {section.title}
            </h3>
            <div style={{ paddingLeft: 0 }}>{section.content}</div>
          </div>
        ))}

        {/* Contact Section – professionally styled, last */}
        <div
          style={{
            marginTop: 12,
            padding: '20px 24px',
            background: darkMode ? '#1a2a44' : '#f8fafc',
            borderRadius: 16,
            borderLeft: `4px solid #1e3c72`,
            textAlign: 'left'
          }}
        >
          <h3
            style={{
              color: headingColor,
              fontSize: '1.25rem',
              fontWeight: 600,
              margin: '0 0 8px 0'
            }}
          >
            Contact Us
          </h3>
          <p style={{ margin: 0 }}>
            If you have questions about this Privacy Policy, please contact us at:
            <br />
            <strong>Email:</strong>{' '}
            <a
              href="mailto:elitenursingcbt@gmail.com"
              style={{ color: headingColor, textDecoration: 'underline' }}
            >
              elitenursingcbt@gmail.com
            </a>
            <br />
            <strong>Phone/WhatsApp:</strong> 09063908476
          </p>
        </div>
      </div>

      {/* Centered Floating Back Button */}
      <button
        onClick={goBack}
        style={backButtonStyle}
        onMouseEnter={(e) => {
          e.currentTarget.style.transform = 'translateX(-50%) scale(1.03)';
          e.currentTarget.style.boxShadow = '0 6px 28px rgba(0,0,0,0.18)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.transform = 'translateX(-50%) scale(1)';
          e.currentTarget.style.boxShadow = '0 4px 20px rgba(0,0,0,0.12)';
        }}
        aria-label="Go back"
      >
        <span style={{ fontSize: '1.2rem', lineHeight: 1 }}></span> Back
      </button>
    </div>
  );
};

// Sections 1–13 (Contact removed – placed separately)
const sections = [
  {
    title: '1. Information We Collect',
    content: (
      <ul style={{ paddingLeft: 20, margin: 0, textAlign: 'left' }}>
        <li><strong>Personal Identification Information:</strong> Name, email address, and phone number (if provided).</li>
        <li><strong>Account Credentials:</strong> Hashed password (we do not store plain-text passwords).</li>
        <li><strong>Quiz Activity:</strong> Exam attempts, scores, and progress.</li>
        <li><strong>Payment Information:</strong> Transaction records (via Flutterwave) – we do not store full card details.</li>
        <li><strong>Device Information:</strong> Device tokens for push notifications (via Firebase Cloud Messaging).</li>
        <li><strong>Usage Data:</strong> IP address, browser type, and interaction with the Platform.</li>
      </ul>
    )
  },
  {
    title: '2. How We Use Your Information',
    content: (
      <ul style={{ paddingLeft: 20, margin: 0, textAlign: 'left' }}>
        <li>To create and manage your account.</li>
        <li>To provide exam content and track your progress.</li>
        <li>To process payments and activate premium features.</li>
        <li>To send you important notifications (e.g., password reset, payment confirmation).</li>
        <li>To send you push notifications about exam updates, weekly quizzes, and platform announcements (you can opt out in device settings).</li>
        <li>To improve our services and user experience.</li>
      </ul>
    )
  },
  {
    title: '3. Sharing Your Information',
    content: (
      <>
        <p style={{ marginTop: 0, textAlign: 'left' }}>
          We do not sell or rent your personal data. We use the following third-party services to operate our Platform:
        </p>
        <ul style={{ paddingLeft: 20, textAlign: 'left' }}>
          <li><strong>MongoDB Atlas:</strong> Cloud database hosting – stores your account data and exam results.</li>
          <li><strong>Brevo (Sendinblue):</strong> Email service – sends verification, password reset, and marketing emails.</li>
          <li><strong>Firebase Cloud Messaging:</strong> Push notification service – delivers notifications to your device.</li>
          <li><strong>Flutterwave:</strong> Payment processor – handles all financial transactions (we do not store your card details).</li>
          <li><strong>RelayFreeLLM / AI Providers:</strong> Generates AI explanations for exam questions (anonymized data only).</li>
          <li><strong>Vercel & Render:</strong> Hosting providers – host our frontend and backend services.</li>
        </ul>
        <p style={{ textAlign: 'left' }}>
          All third-party services are GDPR/Privacy Shield compliant or have appropriate data protection agreements in place. We may also share your information with legal authorities if required by law or to protect our rights.
        </p>
      </>
    )
  },
  {
    title: '4. Data Security',
    content: (
      <p style={{ textAlign: 'left' }}>
        We implement industry-standard measures (encryption, secure connections, access controls) to protect your data. However, no method of transmission over the internet is 100% secure.
      </p>
    )
  },
  {
    title: '5. Your Rights',
    content: (
      <ul style={{ paddingLeft: 20, margin: 0, textAlign: 'left' }}>
        <li>You may access, update, or delete your personal information by logging into your account or contacting us.</li>
        <li>You can opt out of push notifications via your device settings.</li>
        <li>You can request deletion of your account and associated data.</li>
      </ul>
    )
  },
  {
    title: '6. Data Retention',
    content: (
      <>
        <p style={{ marginTop: 0, textAlign: 'left' }}>We retain your data as follows:</p>
        <ul style={{ paddingLeft: 20, textAlign: 'left' }}>
          <li><strong>Active Accounts:</strong> Your data is retained as long as your account is active.</li>
          <li><strong>Quiz Results & Transactions:</strong> Retained for account history and compliance purposes.</li>
          <li><strong>Deleted Accounts:</strong> When you delete your account, we permanently delete your personal data within 30 days, except for:</li>
          <ul style={{ paddingLeft: 20, textAlign: 'left' }}>
            <li>Anonymized quiz results used for aggregate analytics.</li>
            <li>Transaction records required for financial/legal compliance.</li>
          </ul>
        </ul>
      </>
    )
  },
  {
    title: "7. Children's Privacy",
    content: (
      <p style={{ textAlign: 'left' }}>
        Our Platform is not intended for children under the age of 13. We do not knowingly collect personal information from children.
      </p>
    )
  },
  {
    title: '8. Changes to This Policy',
    content: (
      <p style={{ textAlign: 'left' }}>
        We may update this policy from time to time. We will notify you of any changes by posting the new policy on this page and updating the "Last updated" date.
      </p>
    )
  },
  // Note: Section 9 (Contact Us) is now placed after the loop
  {
    title: '9. Referral Program',
    content: (
      <>
        <p style={{ marginTop: 0, textAlign: 'left' }}>
          Our Platform includes a referral program that allows you to share a unique referral code with others. When you share your referral code:
        </p>
        <ul style={{ paddingLeft: 20, textAlign: 'left' }}>
          <li>Your referral code is visible to the person you share it with.</li>
          <li>When someone uses your referral code to register, we record the referral relationship to apply discounts and rewards.</li>
          <li>We do not share your personal information with the referred user, only your referral code.</li>
        </ul>
      </>
    )
  },
  {
    title: '10. AI-Powered Features',
    content: (
      <>
        <p style={{ marginTop: 0, textAlign: 'left' }}>
          Our Platform uses third-party AI services to provide explanation features for exam questions. When you use the "Explain with AI" feature:
        </p>
        <ul style={{ paddingLeft: 20, textAlign: 'left' }}>
          <li>The question text and your answer are sent to our AI service providers (including Gemini, Groq, Mistral, DeepSeek, and NVIDIA).</li>
          <li>We do not send any personally identifiable information (PII) to AI providers.</li>
          <li>Data sent to AI providers is anonymized and used only to generate your explanation.</li>
          <li>We do not store AI explanations or use them to train AI models.</li>
        </ul>
      </>
    )
  },
  {
    title: '11. Cookies & Local Storage',
    content: (
      <>
        <p style={{ marginTop: 0, textAlign: 'left' }}>We use local storage and session storage to:</p>
        <ul style={{ paddingLeft: 20, textAlign: 'left' }}>
          <li>Keep you logged in (authentication token).</li>
          <li>Remember your dark mode preference.</li>
          <li>Store exam progress temporarily.</li>
        </ul>
        <p style={{ textAlign: 'left' }}>We do not use tracking cookies for advertising purposes. You can clear your browser's local storage at any time.</p>
      </>
    )
  },
  {
    title: '12. Admin Access',
    content: (
      <>
        <p style={{ marginTop: 0, textAlign: 'left' }}>
          Our authorized administrators have limited access to user data solely for:
        </p>
        <ul style={{ paddingLeft: 20, textAlign: 'left' }}>
          <li>Providing technical support and resolving issues.</li>
          <li>Managing platform content and security.</li>
        </ul>
        <p style={{ textAlign: 'left' }}>Admins cannot access your password (only hashed) or full payment card details.</p>
      </>
    )
  },
  {
    title: '13. International Data Transfers',
    content: (
      <p style={{ textAlign: 'left' }}>
        Your data may be transferred to and processed in countries where our service providers operate (including the United States, Europe, and other regions). We ensure that appropriate safeguards (Standard Contractual Clauses) are in place for such transfers.
      </p>
    )
  }
];