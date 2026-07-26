// src/components/pre-council/PreCouncilExamList.jsx
import React, { useState, useEffect, useContext } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { AuthContext } from '../../context/AuthContext';
import { getHeadingColor, getSecondaryText } from '../../utils/theme';
import { LoadingWithBar } from '../common/LoadingWithBar';
import { PremiumModal } from '../premium/PremiumModal';
import { getCachedCategories, getCachedPapers, getCachedExams } from '../../utils/preCouncilCache';

export const PreCouncilExamList = () => {
  const { categorySlug, paperSlug } = useParams();
  const [exams, setExams] = useState([]);
  const [paper, setPaper] = useState(null);
  const [category, setCategory] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showPremiumModal, setShowPremiumModal] = useState(false);
  const [selectedExam, setSelectedExam] = useState(null);
  const [showInstructionModal, setShowInstructionModal] = useState(false);
  const [examToStart, setExamToStart] = useState(null);
  const { darkMode, token, user } = useContext(AuthContext);
  const headingColor = getHeadingColor(darkMode);
  const secondaryText = getSecondaryText(darkMode);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Get category from cache
        const allCategories = await getCachedCategories();
        const cat = allCategories.find(c => c.slug === categorySlug);
        if (!cat) { navigate('/pre-council'); return; }
        setCategory(cat);

        // Get papers from cache
        const papersData = await getCachedPapers(cat._id);
        const paperData = papersData.find(p => p.slug === paperSlug);
        if (!paperData) { navigate(`/pre-council/${categorySlug}`); return; }
        setPaper(paperData);

        // Get exams from cache (pass token)
        const examsData = await getCachedExams(paperData._id, token);
        setExams(examsData);
      } catch (error) {
        console.error('Failed to fetch data:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [categorySlug, paperSlug, navigate, token]);

  const handleStartExam = (exam) => {
    if (exam.order > 1 && !user?.isPremium) {
      setSelectedExam(exam);
      setShowPremiumModal(true);
      return;
    }
    setExamToStart(exam);
    setShowInstructionModal(true);
  };

  const confirmStartExam = () => {
    setShowInstructionModal(false);
    navigate(`/pre-council/exam/${examToStart._id}`);
  };

  const goBack = () => {
    navigate(`/pre-council/${categorySlug}`);
  };

  if (loading) return <LoadingWithBar message="Loading exams..." />;

  return (
    <div style={{ 
      background: darkMode ? '#0f0f1a' : '#f5f7fa', 
      minHeight: '100vh', 
      padding: '12px' 
    }}>
      {showPremiumModal && selectedExam && (
        <PremiumModal
          onClose={() => setShowPremiumModal(false)}
          examTitle={selectedExam.title}
          sectionNumber={selectedExam.order}
        />
      )}

      {/* Instruction Modal */}
      {showInstructionModal && examToStart && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0,0,0,0.7)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 2000,
          padding: 20
        }}>
          <div style={{
            background: darkMode ? '#1a1a2e' : '#ffffff',
            borderRadius: 16,
            padding: 24,
            maxWidth: 450,
            width: '100%',
            textAlign: 'center',
            boxShadow: '0 8px 30px rgba(0,0,0,0.3)',
            borderTop: `4px solid #1e3c72`
          }}>
            <div style={{ fontSize: 48, marginBottom: 12 }}></div>
            <h2 style={{ color: headingColor, fontSize: 22, marginBottom: 6 }}>Ready to Start?</h2>
            <p style={{ color: secondaryText, fontSize: 14, marginBottom: 16 }}>Please read the instructions carefully.</p>
            <div style={{
              background: darkMode ? '#1a1a2e' : '#f0f7f4',
              padding: '14px 16px',
              borderRadius: 12,
              marginBottom: 20,
              textAlign: 'left'
            }}>
              <p style={{ color: headingColor, fontSize: 16, fontWeight: 600, marginBottom: 8 }}> Instructions</p>
              <ul style={{ 
                color: secondaryText, 
                fontSize: 13, 
                paddingLeft: 20, 
                margin: 0,
                listStyle: 'disc'
              }}>
                <li><strong>{examToStart.questionCount || 250}</strong> questions</li>
                <li>Time limit: <strong>{examToStart.timeLimit || 180} minutes</strong></li>
                <li>You <strong>cannot go back</strong> once you move to the next question</li>
                <li>Passing score: <strong>{examToStart.passingScore || 70}%</strong></li>
              </ul>
            </div>
            <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
              <button
                onClick={() => setShowInstructionModal(false)}
                style={{ 
                  flex: 1, 
                  background: '#6c757d', 
                  color: 'white', 
                  padding: '10px', 
                  border: 'none', 
                  borderRadius: 30, 
                  cursor: 'pointer', 
                  fontWeight: 600,
                  fontSize: 14
                }}
              >
                Cancel
              </button>
              <button
                onClick={confirmStartExam}
                style={{ 
                  flex: 1, 
                  background: 'linear-gradient(135deg, #1e3c72 0%, #2a5298 100%)', 
                  color: 'white', 
                  padding: '10px', 
                  border: 'none', 
                  borderRadius: 30, 
                  cursor: 'pointer', 
                  fontWeight: 600,
                  fontSize: 14,
                  boxShadow: '0 4px 12px rgba(30, 60, 114, 0.3)'
                }}
              >
                Start Exam
              </button>
            </div>
          </div>
        </div>
      )}

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
              {paper?.name || 'EXAM'}
            </span>
          </div>
          <h1 style={{ 
            color: headingColor, 
            fontSize: 'clamp(16px, 3vw, 24px)', 
            fontWeight: 700, 
            marginBottom: 2 
          }}>
            {paper?.name || 'Examinations'}
          </h1>
          <p style={{ 
            color: secondaryText, 
            fontSize: 'clamp(11px, 1.2vw, 14px)', 
            maxWidth: 500, 
            margin: '0 auto' 
          }}>
            {category?.name} – Select an exam to begin
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
               {exams.length} Exams
            </span>
            <span style={{ 
              background: darkMode ? '#2d2d3d' : '#f0f2f5', 
              padding: '2px 10px', 
              borderRadius: 16, 
              fontSize: 'clamp(9px, 1vw, 11px)', 
              color: secondaryText 
            }}>
               180 min each
            </span>
            <span style={{ 
              background: darkMode ? '#2d2d3d' : '#f0f2f5', 
              padding: '2px 10px', 
              borderRadius: 16, 
              fontSize: 'clamp(9px, 1vw, 11px)', 
              color: secondaryText 
            }}>
               70% Pass
            </span>
          </div>
        </div>

        {/* ===== EXAMS – STACKED FULL‑WIDTH ROWS ===== */}
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '10px'
        }}>
          {exams.map((exam, index) => {
            const isLocked = index > 0 && !user?.isPremium;
            return (
              <div
                key={exam._id}
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
                  opacity: isLocked ? 0.85 : 1,
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
                {/* Premium Badge */}
                {isLocked && (
                  <div style={{
                    position: 'absolute',
                    top: '-8px',
                    right: '12px',
                    background: '#ff9800',
                    color: 'white',
                    padding: '2px 12px',
                    borderRadius: 20,
                    fontSize: 'clamp(8px, 1vw, 10px)',
                    fontWeight: 'bold',
                    zIndex: 2,
                    boxShadow: '0 2px 8px rgba(255, 152, 0, 0.3)'
                  }}>
                    ⭐ PREMIUM
                  </div>
                )}

                {/* Left: Icon + Title + Stats */}
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  flex: '1 1 auto',
                  minWidth: 0
                }}>
                  <span style={{ fontSize: 'clamp(22px, 3.5vw, 30px)' }}>
                    {isLocked ? '🔒' : '📝'}
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
                      {exam.title}
                    </h3>
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      flexWrap: 'wrap'
                    }}>
                      <span style={{ 
                        background: darkMode ? '#1a1a2e' : '#f0f2f5', 
                        padding: '2px 8px', 
                        borderRadius: 16, 
                        fontSize: 'clamp(9px, 0.8vw, 11px)', 
                        color: secondaryText,
                        whiteSpace: 'nowrap'
                      }}>
                         {exam.questionCount || 250}
                      </span>
                      <span style={{ 
                        background: darkMode ? '#1a1a2e' : '#f0f2f5', 
                        padding: '2px 8px', 
                        borderRadius: 16, 
                        fontSize: 'clamp(9px, 0.8vw, 11px)', 
                        color: secondaryText,
                        whiteSpace: 'nowrap'
                      }}>
                         {exam.timeLimit || 180}m
                      </span>
                    </div>
                  </div>
                </div>

                {/* Right: Button – only clickable element */}
                <div style={{ flex: '0 0 auto' }}>
                  <button
                    onClick={() => handleStartExam(exam)}
                    style={{
                      background: isLocked 
                        ? 'linear-gradient(135deg, #ff9800, #e65100)' 
                        : 'linear-gradient(135deg, #1e3c72, #2a5298)',
                      color: 'white',
                      border: 'none',
                      padding: '6px 18px',
                      borderRadius: 30,
                      fontSize: 'clamp(12px, 1.2vw, 14px)',
                      fontWeight: 600,
                      cursor: 'pointer',
                      transition: 'transform 0.2s ease, box-shadow 0.2s ease',
                      boxShadow: isLocked 
                        ? '0 2px 8px rgba(255, 152, 0, 0.25)' 
                        : '0 2px 8px rgba(30, 60, 114, 0.2)'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.transform = 'scale(1.05)';
                      e.currentTarget.style.boxShadow = isLocked 
                        ? '0 4px 12px rgba(255, 152, 0, 0.35)' 
                        : '0 4px 12px rgba(30, 60, 114, 0.35)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.transform = 'scale(1)';
                      e.currentTarget.style.boxShadow = isLocked 
                        ? '0 2px 8px rgba(255, 152, 0, 0.25)' 
                        : '0 2px 8px rgba(30, 60, 114, 0.2)';
                    }}
                  >
                    {isLocked ? 'Unlock' : 'Start'}
                  </button>
                </div>
              </div>
            );
          })}
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