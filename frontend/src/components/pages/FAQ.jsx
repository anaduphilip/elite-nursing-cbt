// src/components/pages/FAQ.jsx
import React, { useState, useEffect, useContext } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { AuthContext } from '../../context/AuthContext';
import { getHeadingColor, getSecondaryText, getTextColor, getCardBg } from '../../utils/theme';
import { LoadingWithBar } from '../common/LoadingWithBar';

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
    <div style={{ 
      background: darkMode ? '#1a1a2e' : '#f0f7f4', 
      minHeight: '100vh', 
      padding: '16px 12px' 
    }}>
      <div style={{ 
        maxWidth: 800, 
        margin: '0 auto', 
        padding: '0 4px'
      }}>
        <Link 
          to="/" 
          style={{ 
            color: headingColor, 
            textDecoration: 'none', 
            display: 'inline-block', 
            marginBottom: 16,
            fontSize: 14
          }}
        >
          ← Back to Home
        </Link>
        <h1 style={{ 
          color: headingColor, 
          textAlign: 'center', 
          marginBottom: 6,
          fontSize: 'clamp(22px, 5vw, 28px)'
        }}>
          Frequently Asked Questions
        </h1>
        <p style={{ 
          color: secondaryText, 
          textAlign: 'center', 
          marginBottom: 28,
          fontSize: 'clamp(13px, 3vw, 15px)'
        }}>
          Find answers to common questions about our platform
        </p>

        {Object.entries(grouped).map(([category, items]) => (
          <div key={category} style={{ marginBottom: 24 }}>
            <h2 style={{ 
              color: headingColor, 
              fontSize: 'clamp(16px, 4vw, 18px)', 
              marginBottom: 12,
              fontWeight: 600
            }}>
              {category}
            </h2>
            {items.map((faq) => (
              <div 
                key={faq._id} 
                style={{ 
                  background: cardBg, 
                  borderRadius: 10, 
                  marginBottom: 8, 
                  overflow: 'hidden', 
                  boxShadow: '0 1px 4px rgba(0,0,0,0.08)'
                }}
              >
                <button
                  onClick={() => setExpanded(expanded === faq._id ? null : faq._id)}
                  style={{
                    width: '100%',
                    padding: '12px 16px',
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    color: headingColor,
                    fontSize: 'clamp(14px, 3vw, 15px)',
                    fontWeight: 600,
                    textAlign: 'left',
                    fontFamily: 'inherit'
                  }}
                >
                  <span style={{ paddingRight: 12 }}>{faq.question}</span>
                  <span style={{ 
                    fontSize: 18, 
                    fontWeight: 400,
                    flexShrink: 0,
                    marginLeft: 8
                  }}>
                    {expanded === faq._id ? '−' : '+'}
                  </span>
                </button>
                {expanded === faq._id && (
                  <div style={{ 
                    padding: '4px 16px 16px 16px', 
                    color: textColor, 
                    lineHeight: 1.6,
                    fontSize: 'clamp(13px, 2.8vw, 14px)'
                  }}>
                    {faq.answer}
                  </div>
                )}
              </div>
            ))}
          </div>
        ))}

        {Object.keys(grouped).length === 0 && (
          <p style={{ textAlign: 'center', color: secondaryText, padding: '30px 0' }}>
            No FAQs available yet. Check back soon!
          </p>
        )}
      </div>
    </div>
  );
};