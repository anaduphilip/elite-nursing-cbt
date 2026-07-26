// src/components/pre-council/PreCouncilPapers.jsx
import React, { useState, useEffect, useContext } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { AuthContext } from '../../context/AuthContext';
import { getHeadingColor, getSecondaryText } from '../../utils/theme';
import { LoadingWithBar } from '../common/LoadingWithBar';
import { PreCouncilCourseModal } from './PreCouncilCourseModal';
import { getCachedCategories, getCachedPapers } from '../../utils/preCouncilCache';

export const PreCouncilPapers = () => {
  const { categorySlug } = useParams();
  const [category, setCategory] = useState(null);
  const [papers, setPapers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedPaper, setSelectedPaper] = useState(null);
  const [showCourseModal, setShowCourseModal] = useState(false);
  const { darkMode } = useContext(AuthContext);
  const headingColor = getHeadingColor(darkMode);
  const secondaryText = getSecondaryText(darkMode);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Get categories from cache
        const allCategories = await getCachedCategories();
        const cat = allCategories.find(c => c.slug === categorySlug);
        if (!cat) {
          navigate('/pre-council');
          return;
        }
        setCategory(cat);

        // Get papers for this category from cache
        const papersData = await getCachedPapers(cat._id);
        setPapers(papersData);
      } catch (error) {
        console.error('Failed to fetch data:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [categorySlug, navigate]);

  const handlePaperSelect = (paper) => {
    if (paper.hasCourses && paper.courses && paper.courses.length > 0) {
      setSelectedPaper(paper);
      setShowCourseModal(true);
    } else {
      navigate(`/pre-council/${categorySlug}/${paper.slug}/exams`);
    }
  };

  const goBack = () => {
    navigate('/pre-council');
  };

  if (loading) return <LoadingWithBar message="Loading papers..." />;

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
              {category?.name || 'CATEGORY'}
            </span>
          </div>
          <h1 style={{ 
            color: headingColor, 
            fontSize: 'clamp(16px, 3vw, 24px)', 
            fontWeight: 700, 
            marginBottom: 2 
          }}>
            Select a Paper
          </h1>
          <p style={{ 
            color: secondaryText, 
            fontSize: 'clamp(11px, 1.2vw, 14px)', 
            maxWidth: 500, 
            margin: '0 auto' 
          }}>
            Choose a paper to begin your {category?.name} exam preparation
          </p>
          <div style={{
            display: 'flex',
            justifyContent: 'center',
            gap: '6px 12px',
            marginTop: 8,
            flexWrap: 'wrap'
          }}>
            <span style={{ 
              background: darkMode ? '#2d2d3d' : '#f0f2f5', 
              padding: '2px 10px', 
              borderRadius: 16, 
              fontSize: 'clamp(9px, 1vw, 11px)', 
              color: secondaryText 
            }}>
               {papers.length} Papers
            </span>
            <span style={{ 
              background: darkMode ? '#2d2d3d' : '#f0f2f5', 
              padding: '2px 10px', 
              borderRadius: 16, 
              fontSize: 'clamp(9px, 1vw, 11px)', 
              color: secondaryText 
            }}>
               NMCN Standard
            </span>
          </div>
        </div>

        {/* ===== PAPERS – STACKED FULL‑WIDTH ROWS ===== */}
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '10px'
        }}>
          {papers.map(paper => (
            <div
              key={paper._id}
              style={{
                background: darkMode ? '#16213e' : '#ffffff',
                padding: '12px 16px',
                borderRadius: 8,
                boxShadow: darkMode ? '0 2px 10px rgba(0,0,0,0.3)' : '0 2px 10px rgba(0,0,0,0.06)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: '12px',
                border: `1px solid ${darkMode ? '#2d2d3d' : '#eef0f2'}`,
                borderBottom: `3px solid #1e3c72`,
                transition: 'transform 0.2s ease, box-shadow 0.2s ease',
                minHeight: '56px',
                position: 'relative',
                cursor: 'default'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateX(4px)';
                e.currentTarget.style.boxShadow = darkMode ? '0 4px 16px rgba(0,0,0,0.4)' : '0 4px 16px rgba(0,0,0,0.1)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateX(0)';
                e.currentTarget.style.boxShadow = darkMode ? '0 2px 10px rgba(0,0,0,0.3)' : '0 2px 10px rgba(0,0,0,0.06)';
              }}
            >
              {/* Left: Icon + Name + (hasCourses badge) */}
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                flex: '1 1 auto',
                minWidth: 0
              }}>
                <span style={{ fontSize: 'clamp(22px, 3.5vw, 30px)' }}>
                  
                </span>
                <div style={{ minWidth: 0, textAlign: 'left' }}>
                  <h3 style={{
                    color: headingColor,
                    fontSize: 'clamp(14px, 1.8vw, 17px)',
                    fontWeight: 600,
                    margin: 0,
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis'
                  }}>
                    {paper.name}
                  </h3>
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    flexWrap: 'wrap'
                  }}>
                    {paper.hasCourses && paper.courses && paper.courses.length > 0 && (
                      <span style={{ 
                        background: darkMode ? '#1a1a2e' : '#f0f2f5', 
                        padding: '2px 8px', 
                        borderRadius: 16, 
                        fontSize: 'clamp(9px, 0.8vw, 11px)', 
                        color: secondaryText,
                        whiteSpace: 'nowrap'
                      }}>
                        Courses
                      </span>
                    )}
                    {paper.description && (
                      <span style={{ 
                        background: darkMode ? '#1a1a2e' : '#f0f2f5', 
                        padding: '2px 8px', 
                        borderRadius: 16, 
                        fontSize: 'clamp(9px, 0.8vw, 11px)', 
                        color: secondaryText,
                        whiteSpace: 'nowrap'
                      }}>
                        {paper.description}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Right: Button – only clickable element */}
              <div style={{ flex: '0 0 auto' }}>
                <button
                  onClick={() => handlePaperSelect(paper)}
                  style={{
                    background: 'linear-gradient(135deg, #1e3c72 0%, #2a5298 100%)',
                    color: 'white',
                    border: 'none',
                    padding: '6px 18px',
                    borderRadius: 30,
                    fontSize: 'clamp(12px, 1.2vw, 14px)',
                    fontWeight: 600,
                    cursor: 'pointer',
                    transition: 'transform 0.2s ease, box-shadow 0.2s ease',
                    boxShadow: '0 2px 8px rgba(30, 60, 114, 0.2)'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'scale(1.05)';
                    e.currentTarget.style.boxShadow = '0 4px 12px rgba(30, 60, 114, 0.3)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'scale(1)';
                    e.currentTarget.style.boxShadow = '0 2px 8px rgba(30, 60, 114, 0.2)';
                  }}
                >
                  Select 
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* ===== COURSE MODAL ===== */}
        {showCourseModal && selectedPaper && (
          <PreCouncilCourseModal
            paper={selectedPaper}
            categorySlug={categorySlug}
            onClose={() => setShowCourseModal(false)}
          />
        )}

        {/* ===== FOOTER – Compact ===== */}
        <div style={{ textAlign: 'center', padding: '12px', marginTop: 12 }}>
          <p style={{ color: secondaryText, fontSize: 'clamp(9px, 0.8vw, 11px)' }}>
            © 2026 ELITE Nursing & Midwifery CBT.
            <Link to="/privacy" style={{ color: '#2196f3', fontSize: 'clamp(9px, 0.8vw, 11px)', textDecoration: 'none', marginLeft: 4 }}>
              Privacy Policy
            </Link>
            <span style={{ color: secondaryText, margin: '0 4px' }}>|</span>
            <Link to="/terms" style={{ color: '#2196f3', fontSize: 'clamp(9px, 0.8vw, 11px)', textDecoration: 'none' }}>
              Terms & Conditions
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};