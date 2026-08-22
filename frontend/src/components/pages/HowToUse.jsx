// src/components/pages/HowToUse.jsx
import React, { useContext } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AuthContext } from '../../context/AuthContext';
import { getHeadingColor, getSecondaryText, getTextColor } from '../../utils/theme';

export const HowToUse = () => {
  const { darkMode } = useContext(AuthContext);
  const headingColor = getHeadingColor(darkMode);
  const secondaryText = getSecondaryText(darkMode);
  const textColor = getTextColor(darkMode);
  const navigate = useNavigate();

  const cardBg = darkMode ? '#1a1a2e' : '#f8f9fa';
  const borderColor = darkMode ? '#444' : '#e9ecef';

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

  const navTips = [
    { label: 'Home', desc: 'Switch between Free / Premium / Study modes' },
    { label: 'Categories', desc: 'Pick your subject area' },
    { label: 'Course', desc: 'Select a specific topic' },
    { label: 'Exams', desc: 'Start your chosen exam' },
    { label: 'Premium', desc: 'Upgrade for full access' },
    { label: 'Profile', desc: 'View stats, history & settings' },
  ];

  return (
    <div style={{ background: darkMode ? '#12121c' : '#f0f7f4', minHeight: '100vh', padding: '24px 16px' }}>
      <div style={{ maxWidth: 900, margin: '0 auto' }}>
        
        <button
          onClick={() => navigate(-1)}
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

        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <h1 style={{ color: headingColor, fontSize: 28, fontWeight: '700', marginBottom: 8 }}>
            How to Use ELITE Nursing & Midwifery CBT
          </h1>
          <p style={{ color: secondaryText, fontSize: 16 }}>
            Everything you need to know to get started and make the most of your learning experience.
          </p>
        </div>

        {/* ===== FREE vs PREMIUM – RESPONSIVE GRID ===== */}
        <div 
          className="free-premium-grid"
          style={{ 
            display: 'grid', 
            gridTemplateColumns: '1fr 1fr', 
            gap: 24, 
            marginBottom: 40,
            width: '100%'
          }}
        >
          
          {/* ===== FREE MODE CARD ===== */}
          <div style={{
            background: cardBg,
            border: `2px solid ${borderColor}`,
            borderRadius: 16,
            padding: 24,
            boxShadow: darkMode ? '0 4px 12px rgba(0,0,0,0.3)' : '0 4px 12px rgba(0,0,0,0.06)',
            display: 'flex',
            flexDirection: 'column',
            maxWidth: '100%',
            overflowWrap: 'break-word',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 4 }}>
              <span style={{ fontSize: 28 }}>🆓</span>
              <h2 style={{ color: headingColor, fontSize: 22, margin: 0 }}>Free Mode</h2>
            </div>
            <p style={{ color: secondaryText, fontSize: 14, marginBottom: 16 }}>
              Perfect for getting started and testing the platform at no cost.
            </p>

            <div style={{ flex: 1, textAlign: 'left' }}>
              <div style={{ marginBottom: 16 }}>
                <div style={{ fontWeight: 600, color: headingColor, fontSize: 14, marginBottom: 6, textAlign: 'left' }}>What You Get:</div>
                <ul style={{ listStyle: 'none', padding: 0, margin: 0, lineHeight: 1.8, color: textColor, textAlign: 'left' }}>
                  <li style={{ padding: '3px 0', borderBottom: `1px solid ${borderColor}` }}>
                    <span style={{ color: '#28a745', marginRight: 8 }}>✓</span> <strong>20 questions</strong> per exam (first section only)
                  </li>
                  <li style={{ padding: '3px 0', borderBottom: `1px solid ${borderColor}` }}>
                    <span style={{ color: '#28a745', marginRight: 8 }}>✓</span> <strong>Pre‑Council:</strong> Access only the <strong>first exam</strong> (250 questions), no retakes
                  </li>
                  <li style={{ padding: '3px 0', borderBottom: `1px solid ${borderColor}` }}>
                    <span style={{ color: '#28a745', marginRight: 8 }}>✓</span> Take each free exam <strong>once</strong> (no retakes)
                  </li>
                  <li style={{ padding: '3px 0', borderBottom: `1px solid ${borderColor}` }}>
                    <span style={{ color: '#28a745', marginRight: 8 }}>✓</span> <strong>10 AI Explanations</strong> per day
                  </li>
                  <li style={{ padding: '3px 0', borderBottom: `1px solid ${borderColor}` }}>
                    <span style={{ color: '#28a745', marginRight: 8 }}>✓</span> Access to free study notes
                  </li>
                  <li style={{ padding: '3px 0' }}>
                    <span style={{ color: '#28a745', marginRight: 8 }}>✓</span> Weekly Quiz (when available)
                  </li>
                </ul>
              </div>

              <div>
                <div style={{ fontWeight: 600, color: '#dc3545', fontSize: 14, marginBottom: 6, textAlign: 'left' }}>Limitations:</div>
                <ul style={{ listStyle: 'none', padding: 0, margin: 0, lineHeight: 1.8, color: textColor, textAlign: 'left' }}>
                  <li style={{ padding: '3px 0', borderBottom: `1px solid ${borderColor}` }}>
                    <span style={{ color: '#dc3545', marginRight: 8 }}>✗</span> Only <strong>20 questions</strong> per course (out of 250+)
                  </li>
                  <li style={{ padding: '3px 0', borderBottom: `1px solid ${borderColor}` }}>
                    <span style={{ color: '#dc3545', marginRight: 8 }}>✗</span> <strong>Pre‑Council:</strong> Only <strong>1 exam</strong> available (out of 10+)
                  </li>
                  <li style={{ padding: '3px 0', borderBottom: `1px solid ${borderColor}` }}>
                    <span style={{ color: '#dc3545', marginRight: 8 }}>✗</span> <strong>Cannot retake</strong> any exam
                  </li>
                  <li style={{ padding: '3px 0', borderBottom: `1px solid ${borderColor}` }}>
                    <span style={{ color: '#dc3545', marginRight: 8 }}>✗</span> Limited to <strong>10 AI explanations</strong> per day
                  </li>
                  <li style={{ padding: '3px 0', borderBottom: `1px solid ${borderColor}` }}>
                    <span style={{ color: '#dc3545', marginRight: 8 }}>✗</span> <strong>Limited access</strong> to all category and precouncil questions
                  </li>
                  <li style={{ padding: '3px 0' }}>
                    <span style={{ color: '#dc3545', marginRight: 8 }}>✗</span> Premium exams, premium study notes & gamification locked
                  </li>
                </ul>
              </div>
            </div>
          </div>

          {/* ===== PREMIUM MODE CARD ===== */}
          <div style={{
            background: darkMode ? '#1a1a2e' : '#fff8e1',
            border: '2px solid #ff9800',
            borderRadius: 16,
            padding: 24,
            boxShadow: darkMode ? '0 4px 12px rgba(0,0,0,0.3)' : '0 4px 12px rgba(255,152,0,0.2)',
            display: 'flex',
            flexDirection: 'column',
            maxWidth: '100%',
            overflowWrap: 'break-word',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 4 }}>
              <span style={{ fontSize: 28 }}>⭐</span>
              <h2 style={{ color: '#ff9800', fontSize: 22, margin: 0 }}>Premium Mode</h2>
            </div>
            <p style={{ color: secondaryText, fontSize: 14, marginBottom: 16 }}>
              Unlock the full platform and take your preparation to the next level.
            </p>

            <div style={{ flex: 1, textAlign: 'left' }}>
              <div style={{ marginBottom: 16 }}>
                <div style={{ fontWeight: 600, color: '#ff9800', fontSize: 14, marginBottom: 6, textAlign: 'left' }}>What You Get:</div>
                <ul style={{ listStyle: 'none', padding: 0, margin: 0, lineHeight: 1.8, color: textColor, textAlign: 'left' }}>
                  <li style={{ padding: '3px 0', borderBottom: `1px solid ${borderColor}` }}>
                    <span style={{ color: '#ff9800', marginRight: 8 }}>★</span> <strong>250+ questions</strong> per exam (all sections)
                  </li>
                  <li style={{ padding: '3px 0', borderBottom: `1px solid ${borderColor}` }}>
                    <span style={{ color: '#ff9800', marginRight: 8 }}>★</span> <strong>Pre‑Council:</strong> Access to <strong>all 10+ exams</strong> (each with 250 questions)
                  </li>
                  <li style={{ padding: '3px 0', borderBottom: `1px solid ${borderColor}` }}>
                    <span style={{ color: '#ff9800', marginRight: 8 }}>★</span> <strong>Unlimited retakes</strong> – practise as much as you want
                  </li>
                  <li style={{ padding: '3px 0', borderBottom: `1px solid ${borderColor}` }}>
                    <span style={{ color: '#ff9800', marginRight: 8 }}>★</span> <strong>Unlimited AI Explanations</strong> – no daily limits
                  </li>
                  <li style={{ padding: '3px 0', borderBottom: `1px solid ${borderColor}` }}>
                    <span style={{ color: '#ff9800', marginRight: 8 }}>★</span> All premium study notes unlocked
                  </li>
                  <li style={{ padding: '3px 0', borderBottom: `1px solid ${borderColor}` }}>
                    <span style={{ color: '#ff9800', marginRight: 8 }}>★</span> Premium Weekly Quiz with leaderboard
                  </li>
                  <li style={{ padding: '3px 0', borderBottom: `1px solid ${borderColor}` }}>
                    <span style={{ color: '#ff9800', marginRight: 8 }}>★</span> Advanced study plan – 25 questions from your weak areas
                  </li>
                  <li style={{ padding: '3px 0' }}>
                    <span style={{ color: '#ff9800', marginRight: 8 }}>★</span> <strong>Gamification:</strong> Streaks, badges & achievements
                  </li>
                </ul>
              </div>

              <div>
                <div style={{ fontWeight: 600, color: '#2e7d32', fontSize: 14, marginBottom: 6, textAlign: 'left' }}>Advantage:</div>
                <ul style={{ listStyle: 'none', padding: 0, margin: 0, lineHeight: 1.8, color: textColor, textAlign: 'left' }}>
                  <li style={{ padding: '3px 0', borderBottom: `1px solid ${borderColor}` }}>
                    <span style={{ color: '#2e7d32', marginRight: 8 }}>✓</span> <strong>Complete access</strong> to all 30,000+ questions
                  </li>
                  <li style={{ padding: '3px 0' }}>
                    <span style={{ color: '#2e7d32', marginRight: 8 }}>✓</span> <strong>Complete access</strong> to all Pre‑Council exams
                  </li>
                  <li style={{ padding: '3px 0' }}>
                    <span style={{ color: '#2e7d32', marginRight: 8 }}>✓</span> <strong>Unlimited practise</strong> – perfect for mastery
                  </li>
                </ul>
              </div>
            </div>

            <Link to="/get-premium" style={{ marginTop: 16 }}>
              <button style={{
                width: '100%',
                padding: '12px',
                background: '#ff9800',
                color: 'white',
                border: 'none',
                borderRadius: 8,
                fontSize: 16,
                fontWeight: 'bold',
                cursor: 'pointer',
                transition: 'background 0.2s ease',
                boxShadow: '0 2px 8px rgba(255,152,0,0.3)'
              }}
              onMouseEnter={(e) => e.currentTarget.style.background = '#e65100'}
              onMouseLeave={(e) => e.currentTarget.style.background = '#ff9800'}
              >
                Upgrade to Premium
              </button>
            </Link>
          </div>
        </div>

        {/* Feature Highlights */}
        <div style={{ marginBottom: 40 }}>
          <h2 style={{ color: headingColor, fontSize: 22, marginBottom: 16, textAlign: 'center' }}>
            Key Features Explained
          </h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 16 }}>
            {[
              { title: 'Exam Categories', desc: 'General Nursing, Midwifery, Public Health, and Pre-Council exams.' },
              { title: 'Exam Taking', desc: 'One question at a time with timer, question palette, and instant results.' },
              { title: 'AI Explanations', desc: 'Detailed breakdowns of every question – why right, why wrong, study tips.' },
              { title: 'Study Plan', desc: 'Personalised plan generated from your weak areas – 10 or 25 questions.' },
              { title: 'Study Notes', desc: 'Premium and free nursing notes with AI Q&A capability.' },
              { title: 'Gamification', desc: 'Earn streaks and badges for achievements – stay motivated!' },
              { title: 'Weekly Quiz', desc: 'New quiz every week with leaderboard – test your knowledge against others.' },
              { title: 'Referral Program', desc: 'Share your referral code – get +1 day premium per conversion.' },
            ].map((feature, idx) => (
              <div key={idx} style={{
                background: cardBg,
                border: `1px solid ${borderColor}`,
                borderRadius: 12,
                padding: 16,
                textAlign: 'center',
                boxShadow: darkMode ? '0 2px 6px rgba(0,0,0,0.2)' : '0 2px 6px rgba(0,0,0,0.05)'
              }}>
                <h4 style={{ color: headingColor, fontSize: 16, margin: '4px 0' }}>{feature.title}</h4>
                <p style={{ color: secondaryText, fontSize: 13, margin: 0 }}>{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Navigation Tips */}
        <div style={{ marginBottom: 40 }}>
          <h2 style={{ color: headingColor, fontSize: 22, marginBottom: 16, textAlign: 'center' }}>
            Navigation Tips
          </h2>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: 12,
          }}>
            {navTips.map((item, idx) => (
              <div key={idx} style={{
                background: cardBg,
                border: `1px solid ${borderColor}`,
                borderRadius: 12,
                padding: '14px 18px',
                textAlign: 'center',
                transition: 'all 0.2s ease',
                boxShadow: darkMode ? '0 2px 6px rgba(0,0,0,0.15)' : '0 2px 6px rgba(0,0,0,0.04)',
              }}>
                <div style={{ fontWeight: 600, color: headingColor, fontSize: 15, marginBottom: 4 }}>
                  {item.label}
                </div>
                <div style={{ fontSize: 13, color: secondaryText, lineHeight: 1.4 }}>
                  {item.desc}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Quick Start Guide */}
        <div style={{ marginBottom: 32 }}>
          <h2 style={{ color: headingColor, fontSize: 22, marginBottom: 12, textAlign: 'center' }}>
            Quick Start
          </h2>
          <div style={{
            background: cardBg,
            border: `1px solid ${borderColor}`,
            borderRadius: 12,
            padding: 20,
            lineHeight: 1.8,
            color: textColor,
            textAlign: 'left'
          }}>
            <ol style={{ margin: 0, paddingLeft: 24 }}>
              <li><strong>Register</strong> – Create a free account and verify your email.</li>
              <li><strong>Take a free exam</strong> – Start with any course's first section (20 questions).</li>
              <li><strong>Review & learn</strong> – Use AI explanations to understand your mistakes (10/day free).</li>
              <li><strong>Upgrade to Premium</strong> – Unlock all 250+ questions, unlimited AI, retakes, and more.</li>
              <li><strong>Track progress</strong> – Check your history, stats, and study plan.</li>
            </ol>
          </div>
        </div>

        {/* Support / Contact */}
        <div style={{
          background: darkMode ? '#1a1a2e' : '#fff3e0',
          border: '2px solid #ff9800',
          borderRadius: 12,
          padding: 20,
          textAlign: 'center',
          marginBottom: 32
        }}>
          <p style={{ color: '#ff9800', fontWeight: 'bold', fontSize: 16, margin: 0 }}>
            Need help? Reach out to us via{' '}
            <a href="https://wa.me/2349063908476" target="_blank" rel="noopener noreferrer" style={{ color: '#25d366', textDecoration: 'none' }}>
              WhatsApp
            </a>
            {' '}or{' '}
            <a href="/contact" style={{ color: '#1e3c72', textDecoration: 'none' }}>
              Contact Us
            </a>
          </p>
        </div>

        <div style={{ textAlign: 'center', padding: '20px 0' }}>
          <p style={{ color: secondaryText, fontSize: 12, margin: 0 }}>
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

      {/* ===== RESPONSIVE MEDIA QUERY ===== */}
      <style>{`
        @media (max-width: 768px) {
          .free-premium-grid {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </div>
  );
};