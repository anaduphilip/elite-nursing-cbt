// src/components/pre-council/PreCouncilCategories.jsx
import React, { useState, useEffect, useContext } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { AuthContext } from '../../context/AuthContext';
import { getHeadingColor, getSecondaryText } from '../../utils/theme';
import { LoadingWithBar } from '../common/LoadingWithBar';

export const PreCouncilCategories = () => {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const { darkMode } = useContext(AuthContext);
  const headingColor = getHeadingColor(darkMode);
  const secondaryText = getSecondaryText(darkMode);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const res = await axios.get('/api/pre-council/categories');
        if (res.data.success) {
          setCategories(res.data.categories);
        }
      } catch (error) {
        console.error('Failed to fetch categories:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchCategories();
  }, []);

  if (loading) return <LoadingWithBar message="Loading Pre Council categories..." />;

  const goBack = () => {
    navigate('/');
  };

  return (
    <div style={{ 
      background: darkMode ? '#0f0f1a' : '#f5f7fa', 
      minHeight: '100vh', 
      padding: '12px' 
    }}>
      {/* ===== FLOATING BACK BUTTON – BOTTOM CENTER ===== */}
      <button
        onClick={goBack}
        style={{
          position: 'fixed',
          bottom: '24px',
          left: '50%',
          transform: 'translateX(-50%)',
          zIndex: 1000,
          background: darkMode ? '#2d2d3d' : '#ffffff',
          color: headingColor,
          border: `1px solid ${darkMode ? '#444' : '#ddd'}`,
          borderRadius: '50%',
          width: '50px',
          height: '50px',
          fontSize: '22px',
          cursor: 'pointer',
          boxShadow: '0 4px 16px rgba(0,0,0,0.15)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          transition: 'transform 0.2s ease, box-shadow 0.2s ease',
          backdropFilter: 'blur(4px)',
          backgroundColor: darkMode ? 'rgba(26, 26, 46, 0.85)' : 'rgba(255, 255, 255, 0.9)'
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.transform = 'translateX(-50%) scale(1.08)';
          e.currentTarget.style.boxShadow = '0 6px 24px rgba(0,0,0,0.2)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.transform = 'translateX(-50%) scale(1)';
          e.currentTarget.style.boxShadow = '0 4px 16px rgba(0,0,0,0.15)';
        }}
        aria-label="Go back"
      >
        ←
      </button>

      <div style={{ maxWidth: 1000, margin: '0 auto' }}>
        {/* ===== HEADER – Compact ===== */}
        <div style={{
          background: darkMode ? '#1a1a2e' : '#ffffff',
          borderRadius: 12,
          padding: '16px 20px',
          marginBottom: 16,
          boxShadow: darkMode ? '0 2px 12px rgba(0,0,0,0.3)' : '0 2px 12px rgba(0,0,0,0.06)',
          borderBottom: `3px solid #1e3c72`,
          textAlign: 'center'
        }}>
          <div style={{
            display: 'inline-block',
            background: 'linear-gradient(135deg, #1e3c72 0%, #2a5298 100%)',
            padding: '4px 14px',
            borderRadius: 30,
            marginBottom: 6
          }}>
            <span style={{ color: 'white', fontWeight: 'bold', fontSize: 'clamp(10px, 1.5vw, 13px)', letterSpacing: 0.5 }}>
              PRE COUNCIL EXAM
            </span>
          </div>
          <h1 style={{ 
            color: headingColor, 
            fontSize: 'clamp(16px, 3vw, 24px)', 
            fontWeight: 700, 
            marginBottom: 2 
          }}>
            Select Your Category
          </h1>
          <p style={{ 
            color: secondaryText, 
            fontSize: 'clamp(11px, 1.2vw, 14px)', 
            maxWidth: 500, 
            margin: '0 auto' 
          }}>
            Choose your discipline to begin your pre-licensing exam preparation
          </p>
        </div>

        {/* ===== CATEGORY CARDS – HORIZONTAL, FULL WIDTH, WITH BORDER BOTTOM ACCENT ===== */}
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '10px'
        }}>
          {categories.map(cat => (
            <Link 
              to={`/pre-council/${cat.slug}`} 
              key={cat._id} 
              style={{ textDecoration: 'none' }}
            >
              <div style={{
                background: darkMode ? '#16213e' : '#ffffff',
                padding: '12px 16px',
                borderRadius: 8,
                boxShadow: darkMode ? '0 2px 10px rgba(0,0,0,0.3)' : '0 2px 10px rgba(0,0,0,0.06)',
                display: 'flex',
                alignItems: 'center',
                border: `1px solid ${darkMode ? '#2d2d3d' : '#eef0f2'}`,
                borderBottom: `3px solid #1e3c72`,   // ← subtle blue border at bottom
                transition: 'transform 0.2s ease, box-shadow 0.2s ease',
                cursor: 'pointer',
                minHeight: '56px'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateX(4px)';
                e.currentTarget.style.boxShadow = darkMode ? '0 4px 16px rgba(0,0,0,0.4)' : '0 4px 16px rgba(0,0,0,0.1)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateX(0)';
                e.currentTarget.style.boxShadow = darkMode ? '0 2px 10px rgba(0,0,0,0.3)' : '0 2px 10px rgba(0,0,0,0.06)';
              }}>
                {/* Icon + Name */}
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  flex: '1 1 auto',
                  minWidth: 0
                }}>
                  <span style={{ fontSize: 'clamp(24px, 4vw, 32px)' }}>
                    {cat.icon || '📚'}
                  </span>
                  <div style={{ 
                    minWidth: 0,
                    textAlign: 'left'
                  }}>
                    <h2 style={{
                      color: headingColor,
                      fontSize: 'clamp(14px, 1.8vw, 18px)',
                      fontWeight: 600,
                      margin: 0,
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis'
                    }}>
                      {cat.name}
                    </h2>
                    {cat.description && (
                      <p style={{
                        color: secondaryText,
                        fontSize: 'clamp(10px, 1vw, 12px)',
                        margin: 0,
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis'
                      }}>
                        {cat.description}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>

        {/* ===== FOOTER – Compact ===== */}
        <div style={{ textAlign: 'center', padding: '12px', marginTop: 12 }}>
          <p style={{ color: secondaryText, fontSize: 'clamp(9px, 0.8vw, 11px)' }}>
            © 2026 ELITE Nursing & Midwifery CBT.
            <Link to="/privacy" style={{ color: '#2196f3', fontSize: 'clamp(9px, 0.8vw, 11px)', textDecoration: 'none', marginLeft: 4 }}>
              Privacy
            </Link>
            <span style={{ color: secondaryText, margin: '0 4px' }}>|</span>
            <Link to="/terms" style={{ color: '#2196f3', fontSize: 'clamp(9px, 0.8vw, 11px)', textDecoration: 'none' }}>
              Terms
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};