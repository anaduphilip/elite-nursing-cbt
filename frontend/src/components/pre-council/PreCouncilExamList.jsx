// src/components/pre-council/PreCouncilExamList.jsx
import React, { useState, useEffect, useContext } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import { AuthContext } from '../../context/AuthContext';
import { getHeadingColor, getSecondaryText } from '../../utils/theme';
import { LoadingWithBar } from '../common/LoadingWithBar';
import { PremiumModal } from '../premium/PremiumModal';

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
        // Fetch categories to get categoryId
        const catRes = await axios.get('/api/pre-council/categories');
        const cat = catRes.data.categories.find(c => c.slug === categorySlug);
        if (!cat) { navigate('/pre-council'); return; }
        setCategory(cat);

        // Fetch papers to get paperId
        const papersRes = await axios.get(`/api/pre-council/categories/${cat._id}/papers`);
        const paperData = papersRes.data.papers.find(p => p.slug === paperSlug);
        if (!paperData) { navigate(`/pre-council/${categorySlug}`); return; }
        setPaper(paperData);

        // Fetch exams for this paper
        const examsRes = await axios.get(`/api/pre-council/papers/${paperData._id}/exams`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setExams(examsRes.data.exams);
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

  if (loading) return <LoadingWithBar message="Loading exams..." />;

  return (
    <div style={{ background: darkMode ? '#1a1a2e' : '#f0f7f4', minHeight: '100vh', padding: '20px' }}>
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
            background: darkMode ? '#16213e' : 'white',
            borderRadius: 20,
            padding: 28,
            maxWidth: 450,
            width: '100%',
            textAlign: 'center',
            boxShadow: '0 8px 30px rgba(0,0,0,0.3)'
          }}>
            <div style={{ fontSize: 48, marginBottom: 12 }}>📝</div>
            <h2 style={{ color: headingColor, marginBottom: 8 }}>Ready to Start?</h2>
            <p style={{ color: secondaryText, marginBottom: 16 }}>Please read the instructions carefully.</p>
            <div style={{
              background: darkMode ? '#1a1a2e' : '#f0f7f4',
              padding: '16px 18px',
              borderRadius: 12,
              marginBottom: 20,
              textAlign: 'left'
            }}>
              <p style={{ color: headingColor, fontSize: 14, marginBottom: 6 }}><strong>📋 Instructions:</strong></p>
              <ul style={{ color: secondaryText, fontSize: 13, paddingLeft: 20 }}>
                <li>This exam contains <strong>{examToStart.questionCount || 250}</strong> questions.</li>
                <li>Time limit: <strong>{examToStart.timeLimit || 180} minutes</strong>.</li>
                <li>You <strong>cannot go back</strong> once you move to the next question.</li>
                <li>Answer all questions before submitting.</li>
                <li>Passing score: {examToStart.passingScore || 70}%</li>
              </ul>
            </div>
            <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
              <button
                onClick={() => setShowInstructionModal(false)}
                style={{ flex: 1, background: '#6c757d', color: 'white', padding: '12px', border: 'none', borderRadius: 10, cursor: 'pointer', fontWeight: 'bold' }}
              >
                Cancel
              </button>
              <button
                onClick={confirmStartExam}
                style={{ flex: 1, background: '#28a745', color: 'white', padding: '12px', border: 'none', borderRadius: 10, cursor: 'pointer', fontWeight: 'bold' }}
              >
                Start Exam →
              </button>
            </div>
          </div>
        </div>
      )}

      <div style={{ maxWidth: 1200, margin: '0 auto' }}>
        {/* Floating Back Button */}
        <button
          onClick={() => navigate(`/pre-council/${categorySlug}`)}
          style={{
            position: 'fixed',
            bottom: '20px',
            left: '50%',
            transform: 'translateX(-50%)',
            background: '#6c757d',
            color: 'white',
            border: 'none',
            borderRadius: '50px',
            padding: '12px 24px',
            cursor: 'pointer',
            fontWeight: 'bold',
            fontSize: '14px',
            boxShadow: '0 2px 10px rgba(0,0,0,0.2)',
            zIndex: 1000
          }}
        >
          ← Back to Papers
        </button>

        <div style={{ textAlign: 'center', marginBottom: 24 }}>
          <h1 style={{ color: headingColor, fontSize: 'clamp(24px, 5vw, 36px)' }}>{paper?.name}</h1>
          <p style={{ color: secondaryText }}>{category?.name} – Select an exam to begin</p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 24 }}>
          {exams.map((exam, index) => {
            const isLocked = index > 0 && !user?.isPremium;
            return (
              <div key={exam._id} style={{
                background: darkMode ? '#16213e' : 'white',
                padding: 20,
                borderRadius: 16,
                boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                textAlign: 'center',
                opacity: isLocked ? 0.7 : 1,
                position: 'relative',
                border: isLocked ? '2px solid #ff9800' : '2px solid #1e3c72'
              }}>
                {isLocked && (
                  <div style={{
                    position: 'absolute',
                    top: '-12px',
                    right: '20px',
                    background: '#ff9800',
                    color: 'white',
                    padding: '4px 12px',
                    borderRadius: 20,
                    fontSize: 12,
                    fontWeight: 'bold'
                  }}>
                    ⭐ PREMIUM
                  </div>
                )}
                <div style={{ fontSize: 40, marginBottom: 12 }}>{isLocked ? '🔒' : '📝'}</div>
                <h3 style={{ color: headingColor, fontSize: 18, marginBottom: 8 }}>{exam.title}</h3>
                <p style={{ color: secondaryText, fontSize: 14, marginBottom: 12 }}>
                  {exam.questionCount || 250} questions | ⏰ {exam.timeLimit || 180} min
                </p>
                <button
                  onClick={() => handleStartExam(exam)}
                  style={{
                    width: '100%',
                    padding: '12px',
                    border: 'none',
                    borderRadius: 10,
                    background: isLocked ? '#ff9800' : '#1e3c72',
                    color: 'white',
                    cursor: isLocked && !user?.isPremium ? 'pointer' : 'pointer',
                    fontWeight: 'bold',
                    fontSize: 14
                  }}
                >
                  {isLocked ? '⭐ Unlock Premium' : 'Start Exam →'}
                </button>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};