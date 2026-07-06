// src/components/pages/FAQ.jsx
import React, { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { AuthContext } from '../../context/AuthContext';
import { getHeadingColor, getSecondaryText, getTextColor, getCardBg } from '../../utils/theme';
import { LoadingWithBar } from '../common/LoadingWithBar';
import { Link } from 'react-router-dom';

export const FAQ = () => {
  const [faqs, setFaqs] = useState([]);
  const [loading, setLoading] = useState(true);
  const { darkMode } = useContext(AuthContext);
  const headingColor = getHeadingColor(darkMode);
  const secondaryText = getSecondaryText(darkMode);
  const textColor = getTextColor(darkMode);
  const cardBg = getCardBg(darkMode);
  const [expanded, setExpanded] = useState(null);

  useEffect(() => {
    const fetchFaqs = async () => {
      try {
        const res = await axios.get('/api/faqs');
        if (res.data.success) {
          setFaqs(res.data.faqs);
        }
      } catch (error) {
        console.error('Failed to fetch FAQs:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchFaqs();
  }, []);

  if (loading) return <LoadingWithBar message="Loading FAQs" />;

  const grouped = faqs.reduce((acc, faq) => {
    const cat = faq.category || 'General';
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(faq);
    return acc;
  }, {});

  return (
    <div style={{ background: darkMode ? '#1a1a2e' : '#f0f7f4', minHeight: '100vh', padding: '20px' }}>
      <div style={{ maxWidth: 900, margin: '0 auto' }}>
        <Link to="/" style={{ color: headingColor, textDecoration: 'none', display: 'inline-block', marginBottom: 20 }}>← Back to Home</Link>
        <h1 style={{ color: headingColor, textAlign: 'center', marginBottom: 10 }}>Frequently Asked Questions</h1>
        <p style={{ color: secondaryText, textAlign: 'center', marginBottom: 40 }}>Find answers to common questions about our platform</p>
        {Object.entries(grouped).map(([category, items]) => (
          <div key={category} style={{ marginBottom: 30 }}>
            <h2 style={{ color: headingColor, fontSize: 20, marginBottom: 16 }}>{category}</h2>
            {items.map((faq, idx) => (
              <div key={faq._id} style={{ background: cardBg, borderRadius: 12, marginBottom: 12, overflow: 'hidden', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
                <button
                  onClick={() => setExpanded(expanded === faq._id ? null : faq._id)}
                  style={{
                    width: '100%',
                    padding: '16px 20px',
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    color: headingColor,
                    fontSize: 16,
                    fontWeight: 'bold',
                    textAlign: 'left'
                  }}
                >
                  <span>{faq.question}</span>
                  <span style={{ fontSize: 20 }}>{expanded === faq._id ? '−' : '+'}</span>
                </button>
                {expanded === faq._id && (
                  <div style={{ padding: '0 20px 20px', color: textColor, lineHeight: 1.6 }}>
                    {faq.answer}
                  </div>
                )}
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
};