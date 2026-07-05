// src/components/exams/ExamList.jsx
import React, { useState, useEffect, useContext } from 'react';
import { Link, useParams } from 'react-router-dom';
import axios from 'axios';
import { AuthContext } from '../../context/AuthContext';
import { getHeadingColor, getSecondaryText } from '../../utils/theme';
import { PremiumModal } from '../premium/PremiumModal';
import { LoadingWithBar } from '../common/LoadingWithBar';

export const ExamList = () => {
  const { id, mode } = useParams();
  const [quiz, setQuiz] = useState(null);
  const [sections, setSections] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showPremiumModal, setShowPremiumModal] = useState(false);
  const [selectedSection, setSelectedSection] = useState(null);
  const [userPremium, setUserPremium] = useState(false);
  const [lastScores, setLastScores] = useState({});
  const [hasTakenExam1, setHasTakenExam1] = useState(false);
  const { token, logout, darkMode } = useContext(AuthContext);
  const headingColor = getHeadingColor(darkMode);
  const secondaryText = getSecondaryText(darkMode);

  useEffect(() => {
    const fetchQuiz = async () => {
      setLoading(true);
      try {
        if (!token) return;
        const res = await axios.get(`/api/quizzes/${id}`, { headers: { Authorization: `Bearer ${token}` } });
        setQuiz(res.data);
        
        const totalQuestions = res.data.questions.length;
        const sectionsArray = [];
        let startIndex = 0;
        let sectionNumber = 1;
        const batchSize = 20;
        
        while (startIndex < totalQuestions) {
          let endIndex = startIndex + batchSize;
          if (endIndex > totalQuestions) endIndex = totalQuestions;
          sectionsArray.push({
            number: sectionNumber,
            count: endIndex - startIndex,
            isPremium: sectionNumber > 1,
            timeMinutes: endIndex - startIndex
          });
          startIndex = endIndex;
          sectionNumber++;
        }
        setSections(sectionsArray);
        
        const profileRes = await axios.get('/api/user/profile', { headers: { Authorization: `Bearer ${token}` } });
        setUserPremium(profileRes.data.isPremium);
        
        const savedScores = localStorage.getItem(`exam_${id}_scores`);
        if (savedScores) {
          setLastScores(JSON.parse(savedScores));
        }
        
        const taken = localStorage.getItem(`exam_${id}_taken`) === 'true';
        setHasTakenExam1(taken);
      } catch (error) {
        if (error.response?.status === 401) {
          localStorage.removeItem('auth');
          logout();
          window.location.href = '/login';
        } else {
          alert('Error loading exam: ' + (error.response?.data?.error || error.message));
        }
      } finally {
        setLoading(false);
      }
    };
    if (id && token) fetchQuiz();
  }, [id, token, logout]);

  const handleStartExam = (section) => {
    if (mode === 'free') {
      if (section.number === 1 && hasTakenExam1) {
        alert('📢 You have already taken this free exam! Upgrade to Premium for unlimited retakes.');
        return;
      }
      window.location.href = `/take/${id}/${section.number}/${mode}`;
      return;
    }
    
    if (section.isPremium && !userPremium) {
      setSelectedSection(section);
      setShowPremiumModal(true);
      return;
    }
    
    window.location.href = `/take/${id}/${section.number}/${mode}`;
  };

  if (loading) {
    return <LoadingWithBar message="Loading examination details" />;
  }
  if (!quiz) return <div style={{ textAlign: 'center', padding: 30 }}>Course not found</div>;

  const getCategorySlug = () => {
    if (quiz.category === 'general-nursing') return `/courses/general-nursing/${mode}`;
    if (quiz.category === 'midwifery') return `/courses/midwifery/${mode}`;
    if (quiz.category === 'public-health') return `/courses/public-health/${mode}`;
    if (quiz.category === 'pediatric-nursing') return `/courses/pediatric-nursing/${mode}`;
    if (quiz.category === 'dental-nursing') return `/courses/dental-nursing/${mode}`;
    return '/';
  };

  const examColor = mode === 'free' ? '#1e3c72' : '#ff9800';

  return (
    <div style={{ background: darkMode ? '#1a1a2e' : '#f0f7f4', minHeight: '100vh', padding: '20px' }}>
      {showPremiumModal && <PremiumModal onClose={() => setShowPremiumModal(false)} examTitle={quiz.title} sectionNumber={selectedSection?.number} />}
      <div style={{ maxWidth: 1000, margin: '0 auto' }}>
        <Link to={getCategorySlug()} style={{ textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 8, background: examColor, color: 'white', padding: '10px 20px', borderRadius: 30, marginBottom: 20, fontSize: 14 }}>
          ← Back to Courses
        </Link>
        
        <div style={{ background: `linear-gradient(135deg, ${examColor} 0%, ${mode === 'free' ? '#1a3a5c' : '#e65100'} 100%)`, borderRadius: 20, padding: 24, marginBottom: 28, color: 'white', textAlign: 'center' }}>
          <h1 style={{ margin: 0, fontSize: 'clamp(20px, 5vw, 28px)' }}>{quiz.title}</h1>
          <p style={{ marginTop: 8, fontSize: 14 }}>{quiz.description}</p>
          <p style={{ fontSize: 14 }}>📚 Total Questions: {quiz.questions?.length || 0}</p>
          {mode === 'free' && <p style={{ marginTop: 8, background: '#4caf50', display: 'inline-block', padding: '6px 16px', borderRadius: 20, fontSize: 13, fontWeight: 'bold' }}>🎯 FREE MODE</p>}
        </div>
        
        <h2 style={{ color: examColor, fontSize: 20, marginBottom: 20 }}>Examinations:</h2>
        
        {mode === 'free' && sections[0] && (
          <>
            <div style={{ marginBottom: 28 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
                <span style={{ fontSize: 24 }}>🎯</span>
                <h3 style={{ color: headingColor, margin: 0, fontSize: 18 }}>Free Examination</h3>
                <span style={{ background: '#4caf50', color: 'white', padding: '4px 12px', borderRadius: 20, fontSize: 12 }}>FREE</span>
                {hasTakenExam1 && <span style={{ background: '#ff9800', color: 'white', padding: '4px 12px', borderRadius: 20, fontSize: 12 }}>✓ COMPLETED</span>}
              </div>
              <div style={{ background: darkMode ? '#16213e' : 'white', padding: 20, borderRadius: 16, border: `2px solid ${hasTakenExam1 ? '#ff9800' : '#4caf50'}` }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16 }}>
                  <div>
                    <h3 style={{ color: headingColor, margin: 0, fontSize: 18 }}>Examination 1</h3>
                    <p style={{ fontSize: 14, marginTop: 4 }}>{sections[0].count} Questions | ⏰ {sections[0].timeMinutes} minutes</p>
                    {lastScores[1] && <p style={{ color: '#ff9800', fontSize: 13, marginTop: 4 }}>📊 Your Last Score: {lastScores[1].score}/{lastScores[1].total} ({lastScores[1].percentage}%)</p>}
                  </div>
                  <button onClick={() => handleStartExam(sections[0])} style={{ background: hasTakenExam1 ? '#ff9800' : '#4caf50', color: 'white', padding: '10px 24px', border: 'none', borderRadius: 30, cursor: 'pointer', fontWeight: 'bold', fontSize: 14 }}>
                    {hasTakenExam1 ? '⭐ Upgrade to Retake' : 'Start Free Exam →'}
                  </button>
                </div>
              </div>
            </div>
            
            <div style={{ textAlign: 'center', padding: 28, background: '#fff3e0', borderRadius: 16, marginBottom: 20 }}>
              <p style={{ color: '#ff9800', fontWeight: 'bold', fontSize: 16 }}>⭐ Unlock ALL premium exams and retakes by chooseing a subscription plan that suits you!</p>
              <Link to="/get-premium"><button style={{ background: '#ff9800', color: 'white', padding: '10px 24px', border: 'none', borderRadius: 30, cursor: 'pointer', fontWeight: 'bold', fontSize: 14, marginTop: 12 }}>Upgrade Now →</button></Link>
            </div>
          </>
        )}
        
        {mode === 'premium' && (
          <div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 20 }}>
              {sections.map((section) => {
                const canAccess = userPremium;
                const isLocked = section.isPremium && !userPremium;
                return (
                  <div key={section.number} style={{ background: darkMode ? '#16213e' : 'white', padding: 18, borderRadius: 16, border: `2px solid ${isLocked ? '#ff9800' : '#4caf50'}`, opacity: isLocked ? 0.8 : 1 }}>
                    <div style={{ fontSize: 36, textAlign: 'center', marginBottom: 8 }}>{section.number === 1 ? '🎯' : '⭐'}</div>
                    <h3 style={{ color: darkMode ? headingColor : (section.number === 1 ? '#1e3c72' : '#ff9800'), textAlign: 'center', fontSize: 18, marginBottom: 6 }}>Examination {section.number}</h3>
                    <p style={{ textAlign: 'center', fontSize: 14 }}>{section.count} Questions | ⏰ {section.timeMinutes} minutes</p>
                    {lastScores[section.number] && <p style={{ color: '#ff9800', textAlign: 'center', fontSize: 13, marginTop: 4 }}>📊 Score: {lastScores[section.number].score}/{lastScores[section.number].total}</p>}
                    <button onClick={() => handleStartExam(section)} style={{ width: '100%', marginTop: 14, background: canAccess ? '#ff9800' : '#ccc', color: 'white', padding: '10px', border: 'none', borderRadius: 10, cursor: canAccess ? 'pointer' : 'not-allowed', fontWeight: 'bold', fontSize: 14 }}>
                      {canAccess ? 'Start Exam →' : '🔒 Premium Required'}
                    </button>
                  </div>
                );
              })}
            </div>
            {!userPremium && (
              <div style={{ marginTop: 24, textAlign: 'center', padding: 20, background: '#fff3e0', borderRadius: 16 }}>
                <p style={{ color: '#ff9800', fontSize: 14 }}>⭐ Upgrade to access all examinations by Choosing a subscription plan that suits you!</p>
                <Link to="/get-premium"><button style={{ background: '#ff9800', color: 'white', padding: '10px 24px', border: 'none', borderRadius: 30, cursor: 'pointer', fontWeight: 'bold', fontSize: 14, marginTop: 8 }}>Upgrade Now →</button></Link>
              </div>
            )}
          </div>
        )}
      </div>
      <div style={{ textAlign: 'center', padding: '20px', marginTop: 20 }}>
        <p style={{ color: secondaryText, fontSize: 12 }}>© 2026 ELITE Nursing & Midwifery CBT. All rights reserved.{' '}
  <Link to="/privacy" style={{ color: '#2196f3', fontSize: 11, textDecoration: 'none', marginLeft: 4 }}>
    Privacy Policy
  </Link>
  <span style={{ color: secondaryText, margin: '0 6px' }}>|</span>
  <Link to="/terms" style={{ color: '#2196f3', fontSize: 11, textDecoration: 'none' }}>
    Terms & Conditions
  </Link></p>
      </div>
    </div>
  );
};