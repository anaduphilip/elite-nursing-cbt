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
            Terms and Conditions
          </h1>
          <p
            style={{
              color: secondaryText,
              fontSize: '0.9rem',
              marginTop: 10,
              opacity: 0.8
            }}
          >
            <strong>Last updated:</strong> August 2026
          </p>
        </div>

        {/* Intro paragraph */}
        <p style={{ fontSize: '1.05rem', marginBottom: 28 }}>
          Welcome to ELITE Nursing & Midwifery CBT ("we", "our", "us"). By using our Platform, you agree to comply with and be bound by the following Terms and Conditions. Please read them carefully. If you do not agree with these terms, please do not use our Platform.
        </p>

        {/* Sections */}
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
                fontSize: '1.2rem',
                fontWeight: 600,
                marginBottom: 12
              }}
            >
              {section.title}
            </h3>
            <div>{section.content}</div>
          </div>
        ))}

        {/* Contact Section – professionally styled, last */}
        <div
          style={{
            marginTop: 12,
            padding: '20px 24px',
            background: darkMode ? '#1a2a44' : '#f8fafc',
            borderRadius: 16,
            borderLeft: `4px solid #1e3c72`
          }}
        >
          <h3
            style={{
              color: headingColor,
              fontSize: '1.2rem',
              fontWeight: 600,
              margin: '0 0 8px 0'
            }}
          >
            Contact Us
          </h3>
          <p style={{ margin: 0 }}>
            If you have any questions about these Terms, please contact us:
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

const sections = [
  {
    title: '1. Acceptance of Terms',
    content: (
      <p>
        By creating an account, accessing, or using our Platform, you agree to be bound by these Terms and Conditions. If you are using the Platform on behalf of an organisation, you represent that you have the authority to bind that organisation to these Terms. These Terms constitute a legally binding agreement between you and ELITE Nursing & Midwifery CBT.
      </p>
    )
  },
  {
    title: '2. Eligibility',
    content: (
      <ul style={{ paddingLeft: 20, margin: 0 }}>
        <li>You must be at least <strong>13 years old</strong> to use the Platform.</li>
        <li>You must have the legal capacity to enter into a binding agreement.</li>
        <li>You must not be located in a country where use of the Platform is prohibited by law.</li>
        <li>We reserve the right to refuse service to anyone for any reason at any time.</li>
      </ul>
    )
  },
  {
    title: '3. User Accounts and Security',
    content: (
      <>
        <p style={{ marginTop: 0 }}>When you create an account, you agree to:</p>
        <ul style={{ paddingLeft: 20 }}>
          <li>Provide accurate, current, and complete information.</li>
          <li>Maintain and promptly update your information to keep it accurate.</li>
          <li>Keep your password and account credentials confidential.</li>
          <li>Notify us immediately of any unauthorised use of your account.</li>
          <li>Accept responsibility for all activities that occur under your account.</li>
        </ul>
        <p>
          We reserve the right to suspend or terminate accounts that violate these Terms or that we suspect have been compromised.
        </p>
      </>
    )
  },
  {
    title: '4. Acceptable Use Policy',
    content: (
      <>
        <p style={{ marginTop: 0 }}>You agree <strong>not</strong> to:</p>
        <ul style={{ paddingLeft: 20 }}>
          <li>Use the Platform for any unlawful, fraudulent, or malicious purpose.</li>
          <li>Share, distribute, or reproduce exam questions or answers outside the Platform.</li>
          <li>Attempt to reverse-engineer, decompile, or extract source code from the Platform.</li>
          <li>Impersonate another person or entity, or provide false information.</li>
          <li>Use automated scripts, bots, or scrapers to access or interact with the Platform.</li>
          <li>Interfere with or disrupt the security, integrity, or performance of the Platform.</li>
          <li>Upload or transmit viruses, malware, or any harmful code.</li>
          <li>Engage in any activity that could damage, disable, or impair the Platform or our servers.</li>
        </ul>
      </>
    )
  },
  {
    title: '5. Intellectual Property Rights',
    content: (
      <>
        <p style={{ marginTop: 0 }}>
          All content on the Platform, including but not limited to:
        </p>
        <ul style={{ paddingLeft: 20 }}>
          <li><strong>Exam Questions & Answers:</strong> All questions, answers, and explanations are our proprietary content or licensed from third parties.</li>
          <li><strong>Graphics & Logos:</strong> All visual elements, including the ELITE Nursing & Midwifery CBT logo, are protected by trademark and copyright laws.</li>
          <li><strong>Software & Code:</strong> The underlying code, architecture, and design are our intellectual property.</li>
        </ul>
        <p>
          You may not copy, reproduce, distribute, create derivative works from, or publicly display any content from the Platform without our prior written consent. Unauthorised use of our intellectual property is strictly prohibited and may result in legal action.
        </p>
      </>
    )
  },
  {
    title: '6. Payments and Subscriptions',
    content: (
      <>
        <p style={{ marginTop: 0 }}>
          We offer subscription plans that unlock premium features on the Platform.
        </p>
        <ul style={{ paddingLeft: 20 }}>
          <li><strong>Pricing:</strong> Subscription fees are clearly displayed on the Platform and are subject to change with prior notice.</li>
          <li><strong>Payment Processing:</strong> All payments are securely processed via Flutterwave. We do not store your full payment card details.</li>
          <li><strong>Refund Policy:</strong> All payments are <strong>non-refundable</strong> unless otherwise required by applicable law.</li>
          <li><strong>Access:</strong> Premium access is granted immediately upon successful payment verification.</li>
          <li><strong>No Auto‑Renewal:</strong> Subscriptions are <strong>one‑time purchases</strong>. They do not auto-renew. You must manually purchase a new plan upon expiry if you wish to continue.</li>
          <li><strong>Expiry:</strong> Premium features are available only for the duration of the plan you purchased. Once the plan expires, your account reverts to the free tier.</li>
        </ul>
        <p>
          If you purchase a subscription through a third‑party provider (e.g., Google Play, Apple App Store), their terms and conditions also apply.
        </p>
      </>
    )
  },
  {
    title: '7. Referral Program',
    content: (
      <>
        <p style={{ marginTop: 0 }}>
          We offer a referral program that allows you to earn rewards by inviting others to join the Platform.
        </p>
        <ul style={{ paddingLeft: 20 }}>
          <li><strong>Referral Code:</strong> You will receive a unique referral code to share with others.</li>
          <li><strong>Rewards:</strong> When a new user registers using your referral code and completes a qualifying action (e.g., makes a purchase), you may receive a reward as specified on the Platform.</li>
          <li><strong>Abuse:</strong> We reserve the right to revoke rewards if we suspect fraudulent or abusive referral activity.</li>
          <li><strong>Changes:</strong> We may modify, suspend, or terminate the referral program at any time without prior notice.</li>
        </ul>
      </>
    )
  },
  {
    title: '8. AI-Powered Features',
    content: (
      <>
        <p style={{ marginTop: 0 }}>
          The Platform includes artificial intelligence (AI) features that provide explanations for exam questions.
        </p>
        <ul style={{ paddingLeft: 20 }}>
          <li><strong>Accuracy:</strong> AI-generated responses are provided for educational purposes only. We do not guarantee the accuracy, completeness, or reliability of AI-generated content.</li>
          <li><strong>Limitations:</strong> Free users are limited to a certain number of AI explanations per day. Premium users enjoy unlimited access.</li>
          <li><strong>Data Usage:</strong> When you use AI features, the question text and your answer are sent to third-party AI providers. No personally identifiable information (PII) is shared.</li>
          <li><strong>No Liability:</strong> We are not liable for any decisions or actions you take based on AI-generated content.</li>
        </ul>
      </>
    )
  },
  {
    title: '9. Study Plan Feature',
    content: (
      <>
        <p style={{ marginTop: 0 }}>
          The Platform includes a Study Plan feature that generates personalised question sets based on your exam performance.
        </p>
        <ul style={{ paddingLeft: 20 }}>
          <li><strong>Generation:</strong> Study plans are generated from your incorrect answers and weak areas.</li>
          <li><strong>Limitations:</strong> Free users may generate one study plan per week. Premium users have unlimited access.</li>
          <li><strong>No Guarantee:</strong> We do not guarantee that using the study plan will improve your exam performance.</li>
        </ul>
      </>
    )
  },
  {
    title: '10. Push Notifications and Communications',
    content: (
      <>
        <p style={{ marginTop: 0 }}>
          By creating an account, you consent to receive communications from us, including:
        </p>
        <ul style={{ paddingLeft: 20 }}>
          <li><strong>Transactional Emails:</strong> Verification codes, password resets, payment confirmations, and account updates.</li>
          <li><strong>Promotional Emails:</strong> Updates about new features, exam content, and special offers (you can opt out by reaching out to the admin).</li>
          <li><strong>Push Notifications:</strong> Announcements, weekly quiz reminders, and platform updates (you can opt out via your device settings).</li>
        </ul>
        <p>
          We respect your privacy and do not share your contact information with third parties for marketing purposes without your explicit consent.
        </p>
      </>
    )
  },
  {
    title: '11. User-Generated Content',
    content: (
      <>
        <p style={{ marginTop: 0 }}>
          The Platform may allow you to submit content, including but not limited to:
        </p>
        <ul style={{ paddingLeft: 20 }}>
          <li>Feedback, suggestions, and feature requests.</li>
          <li>Quiz results and progress data (stored in your account).</li>
        </ul>
        <p>
          By submitting content, you grant us a non-exclusive, royalty-free, perpetual, irrevocable right to use, reproduce, modify, and distribute your content for the purpose of operating and improving the Platform. You retain ownership of your content, but you represent that you have the rights to grant this license.
        </p>
      </>
    )
  },
  {
    title: '12. Disclaimer of Warranties',
    content: (
      <>
        <p style={{ marginTop: 0 }}>
          The Platform and its content are provided on an <strong>"as is"</strong> and <strong>"as available"</strong> basis without any warranties of any kind, express or implied. To the fullest extent permitted by law, we disclaim:
        </p>
        <ul style={{ paddingLeft: 20 }}>
          <li><strong>Accuracy:</strong> We do not guarantee that exam content, answers, or AI explanations are error‑free or complete.</li>
          <li><strong>Availability:</strong> We do not guarantee that the Platform will be uninterrupted, secure, or always accessible.</li>
          <li><strong>Fitness:</strong> We do not warrant that the Platform will meet your specific requirements or expectations.</li>
          <li><strong>Results:</strong> We do not guarantee that using the Platform will improve your exam performance or pass rates.</li>
        </ul>
      </>
    )
  },
  {
    title: '13. Limitation of Liability',
    content: (
      <>
        <p style={{ marginTop: 0 }}>
          To the fullest extent permitted by law, ELITE Nursing & Midwifery CBT, its affiliates, officers, employees, and agents shall <strong>not</strong> be liable for:
        </p>
        <ul style={{ paddingLeft: 20 }}>
          <li>Any indirect, incidental, special, consequential, or punitive damages.</li>
          <li>Loss of profits, data, use, goodwill, or other intangible losses.</li>
          <li>Any damages arising from your use of or inability to use the Platform.</li>
          <li>Any errors, omissions, interruptions, or delays in the Platform's operation.</li>
          <li>Any decisions or actions you take based on content from the Platform.</li>
        </ul>
        <p>
          In no event shall our total liability exceed the amount you have paid us, if any, in the 2 months preceding the claim.
        </p>
      </>
    )
  },
  {
    title: '14. Indemnification',
    content: (
      <>
        <p style={{ marginTop: 0 }}>
          You agree to indemnify, defend, and hold harmless ELITE Nursing & Midwifery CBT, its affiliates, officers, directors, employees, and agents from and against any claims, liabilities, damages, losses, and expenses (including reasonable legal fees) arising out of or related to:
        </p>
        <ul style={{ paddingLeft: 20 }}>
          <li>Your use of the Platform in violation of these Terms.</li>
          <li>Any content you submit to the Platform.</li>
          <li>Any violation of applicable laws or regulations.</li>
          <li>Any infringement of third-party rights, including intellectual property rights.</li>
        </ul>
      </>
    )
  },
  {
    title: '15. Suspension and Termination',
    content: (
      <>
        <p style={{ marginTop: 0 }}>
          We reserve the right to suspend, restrict, or terminate your access to the Platform at our sole discretion, without prior notice or liability, for any reason, including but not limited to:
        </p>
        <ul style={{ paddingLeft: 20 }}>
          <li>Violation of these Terms.</li>
          <li>Suspected fraudulent, abusive, or illegal activity.</li>
          <li>Non-payment of subscription fees.</li>
          <li>At the request of law enforcement or government agencies.</li>
          <li>For technical or security reasons.</li>
        </ul>
        <p>
          You may delete your account at any time by contacting us. Upon termination, your right to use the Platform will immediately cease.
        </p>
      </>
    )
  },
  {
    title: '16. Changes to These Terms',
    content: (
      <p>
        We reserve the right to update, modify, or replace these Terms at any time. We will notify you of any material changes by posting the new Terms on this page with a new "Last updated" date. Your continued use of the Platform after such changes constitutes your acceptance of the revised Terms. If you do not agree to the changes, you must stop using the Platform.
      </p>
    )
  },
  {
    title: '17. Governing Law and Dispute Resolution',
    content: (
      <>
        <p style={{ marginTop: 0 }}>
          These Terms shall be governed by and construed in accordance with the laws of <strong>Nigeria</strong>. Any disputes arising out of or relating to these Terms or your use of the Platform shall be resolved through:
        </p>
        <ul style={{ paddingLeft: 20 }}>
          <li><strong>Informal Resolution:</strong> You agree to attempt to resolve any dispute by contacting us first.</li>
          <li><strong>Binding Arbitration:</strong> If the dispute cannot be resolved informally, it shall be referred to binding arbitration in accordance with the laws of Nigeria.</li>
          <li><strong>Jurisdiction:</strong> The courts of Nigeria shall have exclusive jurisdiction over any disputes not subject to arbitration.</li>
        </ul>
      </>
    )
  },
  {
    title: '18. Entire Agreement',
    content: (
      <p>
        These Terms, together with our Privacy Policy, constitute the entire agreement between you and ELITE Nursing & Midwifery CBT regarding your use of the Platform and supersede all prior agreements, understandings, or representations, whether written or oral.
      </p>
    )
  },
  {
    title: '19. Severability',
    content: (
      <p>
        If any provision of these Terms is found to be invalid, illegal, or unenforceable, the remaining provisions shall continue in full force and effect. The invalid provision shall be modified to the minimum extent necessary to make it enforceable.
      </p>
    )
  },
  {
    title: '20. Waiver',
    content: (
      <p>
        Our failure to enforce any right or provision of these Terms shall not be considered a waiver of those rights. Any waiver of any provision of these Terms must be in writing and signed by us.
      </p>
    )
  }
];