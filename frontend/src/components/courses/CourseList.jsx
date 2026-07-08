// src/components/courses/CourseList.jsx
import React, { useState, useEffect, useContext } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { AuthContext } from '../../context/AuthContext';
import { getCachedQuizzes, hasCachedQuizzes } from '../../utils/quizHelpers';
import { getHeadingColor, getSecondaryText, getTextColor } from '../../utils/theme';
import { LoadingWithBar } from '../common/LoadingWithBar';

export const CourseList = () => {
  const { categoryName, mode } = useParams();
  const navigate = useNavigate();
  const [displayData, setDisplayData] = useState([]);
  const [fullTopicQuizzes, setFullTopicQuizzes] = useState([]);
  const [isTopicView, setIsTopicView] = useState(true);
  const [loading, setLoading] = useState(true);
  const { token, darkMode, user } = useContext(AuthContext);
  const headingColor = getHeadingColor(darkMode);
  const secondaryText = getSecondaryText(darkMode);
  const textColor = getTextColor(darkMode);

  const categoryMap = {
    'general-nursing': { name: 'General Nursing', icon: '🩺', color: mode === 'free' ? '#1e3c72' : '#ff9800' },
    'midwifery': { name: 'Midwifery', icon: '🤰', color: mode === 'free' ? '#1e3c72' : '#ff9800' },
    'public-health': { name: 'Public Health', icon: '🌍', color: mode === 'free' ? '#1e3c72' : '#ff9800' },
    'pediatric-nursing': { name: 'Pediatric Nursing', icon: '👶', color: mode === 'free' ? '#1e3c72' : '#ff9800' },
    'dental-nursing': { name: 'Dental Nursing', icon: '🦷', color: mode === 'free' ? '#1e3c72' : '#ff9800' }
  };
  const category = categoryMap[categoryName] || { name: 'Courses', icon: '📚', color: mode === 'free' ? '#1e3c72' : '#ff9800' };

  const urlParams = new URLSearchParams(window.location.search);
  const currentTopic = urlParams.get('topic');

  useEffect(() => {
    const fetchData = async () => {
      // ✅ Only show loading if data is NOT already cached
      if (!hasCachedQuizzes()) {
        setLoading(true);
      }
      try {
        const quizzesData = await getCachedQuizzes(token);
        let filtered = quizzesData.filter(q => q.category === categoryName);

        if (currentTopic) {
          const allTopicQuizzes = filtered.filter(q => q.topic === currentTopic);
          allTopicQuizzes.sort((a, b) => {
            const numA = parseInt(a.title.match(/\d+/)?.[0] || 0);
            const numB = parseInt(b.title.match(/\d+/)?.[0] || 0);
            return numA - numB;
          });
          setFullTopicQuizzes(allTopicQuizzes);

          if (mode === 'free') {
            let topicQuizzes = [...allTopicQuizzes];
            if (topicQuizzes.length > 0) topicQuizzes = topicQuizzes.slice(0, 1);
            setDisplayData(topicQuizzes);
            setIsTopicView(false);
          } else {
            const allQuestions = [];
            allTopicQuizzes.forEach(quiz => {
              allQuestions.push(...quiz.questions);
            });
            const chunkSize = 250;
            const chunks = [];
            for (let i = 0; i < allQuestions.length; i += chunkSize) {
              chunks.push(allQuestions.slice(i, i + chunkSize));
            }
            const examCards = chunks.map((chunk, idx) => {
              const start = idx * chunkSize + 1;
              const end = Math.min((idx + 1) * chunkSize, allQuestions.length);
              return {
                id: idx + 1,
                title: `Exam ${idx + 1}`,
                description: `Questions ${start} – ${end}`,
                questions: chunk,
                totalQuestions: chunk.length
              };
            });
            setDisplayData(examCards);
            setIsTopicView(false);
          }
        } else {
          const topicMap = new Map();
          filtered.forEach(quiz => {
            const topic = quiz.topic || 'General';
            if (!topicMap.has(topic)) {
              topicMap.set(topic, { topic, totalQuestions: 0, quizCount: 0 });
            }
            const entry = topicMap.get(topic);
            entry.totalQuestions += quiz.questions?.length || 0;
            entry.quizCount += 1;
          });
          const topicArray = Array.from(topicMap.values()).map(entry => {
            const freeQuestions = Math.min(20, entry.totalQuestions);
            const freeExamCount = freeQuestions > 0 ? 1 : 0;
            const premiumQuestions = entry.totalQuestions - freeQuestions;
            const premiumExamCount = premiumQuestions > 0 ? Math.ceil(premiumQuestions / 250) : 0;
            return {
              ...entry,
              freeExamCount,
              freeQuestions,
              premiumExamCount
            };
          });
          setDisplayData(topicArray);
          setIsTopicView(true);
        }
      } catch (error) {
        console.error('Error fetching courses:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [categoryName, token, currentTopic, mode]);

  const getLastScore = (quizId) => {
    const scores = localStorage.getItem(`exam_${quizId}_scores`);
    if (scores) {
      const parsed = JSON.parse(scores);
      if (parsed[1]) return parsed[1];
    }
    return null;
  };

  if (loading) {
    const loadingMsg = currentTopic ? 'Loading exams...' : 'Loading courses...';
    return <LoadingWithBar message={loadingMsg} />;
  }

  if (displayData.length === 0) {
    return (
      <div style={{ background: darkMode ? '#1a1a2e' : '#f0f7f4', minHeight: '100vh', padding: '50px', textAlign: 'center' }}>
        <p>No {isTopicView ? 'courses' : 'exams'} found for {category.name}. Please try again later.</p>
        <button onClick={() => window.location.reload()} style={{ marginTop: 20, padding: '10px 20px', background: '#1e3c72', color: 'white', border: 'none', borderRadius: 8, cursor: 'pointer' }}>
          Refresh
        </button>
      </div>
    );
  }

  return (
    <div style={{ background: darkMode ? '#1a1a2e' : '#f0f7f4', minHeight: '100vh', padding: '20px' }}>
      <div style={{ maxWidth: 1200, margin: '0 auto', width: '100%', boxSizing: 'border-box' }}>
        <div style={{ background: `linear-gradient(135deg, ${category.color} 0%, ${mode === 'free' ? '#1a3a5c' : '#e65100'} 100%)`, borderRadius: 20, padding: 32, marginBottom: 28, color: 'white', textAlign: 'center' }}>
          <div style={{ fontSize: 56, marginBottom: 12 }}>{category.icon}</div>
          <h1 style={{ margin: '8px 0 0', fontSize: 'clamp(24px, 5vw, 32px)' }}>
            {currentTopic ? currentTopic : category.name}
          </h1>
          <p style={{ marginTop: 8, fontSize: 14 }}>{mode === 'free' ? 'FREE MODE' : 'PREMIUM MODE'}</p>
          <p style={{ fontSize: 14 }}>{displayData.length} {isTopicView ? 'courses' : 'exam sets'} available</p>
        </div>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
          rowGap: '60px',
          columnGap: '40px',
          marginBottom: '60px'
        }}>
          {displayData.map(item => {
            if (isTopicView) {
              const { topic, totalQuestions, freeQuestions, premiumExamCount } = item;
              let infoText = '';
              let premiumTag = null;
              if (mode === 'free') {
                const freeQ = freeQuestions > 0 ? freeQuestions : totalQuestions;
                infoText = `🎯 1 Free Exam (${freeQ} questions)`;
                if (premiumExamCount > 0) {
                  premiumTag = <p style={{ color: '#ff9800', fontSize: 12, marginTop: 4 }}>⭐ Access more questions in Premium</p>;
                }
              } else {
                const totalExams = premiumExamCount > 0 ? premiumExamCount : 0;
                infoText = `⭐ ${totalExams} Premium Exam${totalExams > 1 ? 's' : ''} (${totalQuestions} total questions)`;
              }
              return (
                <Link to={`/courses/${categoryName}/${mode}?topic=${encodeURIComponent(topic)}`} key={topic} style={{ textDecoration: 'none' }}>
                  <div style={{ background: darkMode ? '#16213e' : 'white', padding: 20, borderRadius: 16, boxShadow: '0 2px 8px rgba(0,0,0,0.1)', display: 'flex', flexDirection: 'column', height: '100%', wordBreak: 'break-word' }}>
                    <div style={{ fontSize: 40, marginBottom: 12 }}>📚</div>
                    <h3 style={{ color: darkMode ? headingColor : category.color, fontSize: 'clamp(16px, 4vw, 18px)', marginBottom: 8 }}>{topic}</h3>
                    <p style={{ color: darkMode ? '#aaa' : '#666', fontSize: 13, marginBottom: 12 }}>{infoText}</p>
                    {premiumTag && premiumTag}
                    <div style={{ marginTop: 'auto' }}>
                      <button style={{ width: '100%', background: category.color, color: 'white', border: 'none', padding: '10px', borderRadius: 10, cursor: 'pointer', fontWeight: 'bold', fontSize: 14 }}>View Exams →</button>
                    </div>
                  </div>
                </Link>
              );
            } else if (mode === 'premium') {
              const exam = item;
              const link = `/premium-exam/${categoryName}/${encodeURIComponent(currentTopic)}/${exam.id}/${mode}`;
              return (
                <Link to={link} key={exam.id} style={{ textDecoration: 'none' }}>
                  <div style={{ background: darkMode ? '#16213e' : 'white', padding: 20, borderRadius: 16, boxShadow: '0 2px 8px rgba(0,0,0,0.1)', display: 'flex', flexDirection: 'column', height: '100%', wordBreak: 'break-word' }}>
                    <div style={{ fontSize: 40, marginBottom: 12 }}>📚</div>
                    <h3 style={{ color: category.color, fontSize: 'clamp(16px, 4vw, 18px)', marginBottom: 8 }}>{exam.title}</h3>
                    <p style={{ color: darkMode ? '#aaa' : '#666', fontSize: 13, marginBottom: 12 }}>{exam.description}</p>
                    <p style={{ fontSize: 14 }}><strong style={{ color: category.color }}>Questions:</strong> {exam.totalQuestions}</p>
                    <div style={{ marginTop: 'auto' }}>
                      <button style={{ width: '100%', background: category.color, color: 'white', border: 'none', padding: '10px', borderRadius: 10, cursor: 'pointer', fontWeight: 'bold', fontSize: 14 }}>Start Exam →</button>
                    </div>
                  </div>
                </Link>
              );
            } else {
              const quiz = item;
              const totalQuestions = quiz.questions?.length || 0;
              const lastScore = getLastScore(quiz._id);
              const hasTakenFree = localStorage.getItem(`exam_${quiz._id}_taken`) === 'true';
              const isCompleted = !!lastScore;

              let buttonText = 'Start Exam →';
              let buttonLink = `/take/${quiz._id}/1/${mode}`;
              let buttonColor = category.color;

              if (mode === 'free') {
                if (hasTakenFree) {
                  if (user?.isPremium) {
                    buttonText = '🔄 Retake Exam';
                    buttonLink = `/take/${quiz._id}/1/${mode}`;
                    buttonColor = category.color;
                  } else {
                    buttonText = '⭐ Upgrade to Retake';
                    buttonLink = '/get-premium';
                    buttonColor = '#ff9800';
                  }
                }
              }

              return (
                <Link to={buttonLink} key={quiz._id} style={{ textDecoration: 'none' }}>
                  <div style={{ background: darkMode ? '#16213e' : 'white', padding: 20, borderRadius: 16, boxShadow: '0 2px 8px rgba(0,0,0,0.1)', display: 'flex', flexDirection: 'column', height: '100%', wordBreak: 'break-word', position: 'relative' }}>
                    {isCompleted && (
                      <div style={{
                        position: 'absolute',
                        top: 12,
                        right: 12,
                        background: '#4caf50',
                        color: 'white',
                        padding: '4px 10px',
                        borderRadius: 20,
                        fontSize: 12,
                        fontWeight: 'bold',
                        zIndex: 1
                      }}>
                        ✅ Completed
                      </div>
                    )}
                    <div style={{ fontSize: 40, marginBottom: 12 }}>📚</div>
                    <h3 style={{ color: darkMode ? headingColor : category.color, fontSize: 'clamp(16px, 4vw, 18px)', marginBottom: 8 }}>{quiz.title}</h3>
                    <p style={{ color: darkMode ? '#aaa' : '#666', fontSize: 13, marginBottom: 12 }}>{quiz.description?.substring(0, 80)}...</p>
                    <p style={{ fontSize: 14 }}><strong style={{ color: category.color }}>Questions:</strong> {totalQuestions.toLocaleString()}</p>
                    {lastScore && <p style={{ fontSize: 13, color: '#ff9800', marginTop: 4 }}>📊 Last Score: {lastScore.score}/{lastScore.total} ({lastScore.percentage}%)</p>}
                    <div style={{ marginTop: 'auto' }}>
                      <button style={{ width: '100%', background: buttonColor, color: 'white', border: 'none', padding: '10px', borderRadius: 10, cursor: 'pointer', fontWeight: 'bold', fontSize: 14 }}>{buttonText}</button>
                    </div>
                  </div>
                </Link>
              );
            }
          })}
        </div>

        {mode === 'free' && !currentTopic && (
          <div style={{ textAlign: 'center', marginTop: 20, marginBottom: 40 }}>
            <Link to="/get-premium">
              <button style={{ background: '#ff9800', color: 'white', padding: '14px 32px', border: 'none', borderRadius: 50, cursor: 'pointer', fontWeight: 'bold', fontSize: 16 }}>
                ⭐ Upgrade to Premium
              </button>
            </Link>
          </div>
        )}

        <div style={{ textAlign: 'center', padding: '20px', marginTop: 20 }}>
          <p style={{ color: secondaryText, fontSize: 12 }}>© 2026 ELITE Nursing & Midwifery CBT. All rights reserved.{' '}
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

      <button
        onClick={() => {
          if (currentTopic) {
            navigate(`/courses/${categoryName}/${mode}`, { replace: true });
          } else {
            navigate(`/?mode=${mode}`, { replace: true });
          }
        }}
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
        ← {currentTopic ? 'Back to Courses' : 'Back to Categories'}
      </button>
    </div>
  );
};