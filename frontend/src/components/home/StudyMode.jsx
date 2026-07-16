// src/components/home/StudyMode.jsx
import React, { useState, useEffect, useContext } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { AuthContext } from '../../context/AuthContext';
import { getHeadingColor, getSecondaryText } from '../../utils/theme';
import { LoadingWithBar } from '../common/LoadingWithBar';

export const StudyMode = () => {
  const { token, darkMode, user } = useContext(AuthContext);
  const headingColor = getHeadingColor(darkMode);
  const secondaryText = getSecondaryText(darkMode);
  const navigate = useNavigate();

  const [notes, setNotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedNote, setSelectedNote] = useState(null);
  const [question, setQuestion] = useState('');
  const [aiAnswer, setAiAnswer] = useState('');
  const [aiLoading, setAiLoading] = useState(false);
  const [readNotes, setReadNotes] = useState([]);

  // ---- FETCH REAL STUDY NOTES FROM API ----
  useEffect(() => {
    const fetchNotes = async () => {
      try {
        const res = await axios.get('/api/study-notes', {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (res.data.success) {
          setNotes(res.data.notes || []);
        }
      } catch (error) {
        console.error('Failed to fetch study notes:', error);
        setNotes([]);
      } finally {
        setLoading(false);
      }
    };
    fetchNotes();
  }, [token]);

  // ---- FETCH USER'S READ NOTES ----
  useEffect(() => {
    const fetchReadNotes = async () => {
      try {
        const res = await axios.get('/api/user/read-notes', {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (res.data.success) {
          setReadNotes(res.data.readNotes || []);
        }
      } catch (error) {
        console.error('Failed to fetch read notes:', error);
      }
    };
    if (token) fetchReadNotes();
  }, [token]);

  const handleMarkAsRead = async (noteId) => {
    try {
      const res = await axios.post(`/api/study-notes/${noteId}/read`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.data.success) {
        setReadNotes(prev => [...prev, noteId]);
      }
    } catch (error) {
      alert('Failed to mark as read. Please try again.');
    }
  };

  const handleAskAI = async (note) => {
    if (!question.trim()) return;
    setAiLoading(true);
    setAiAnswer('');
    try {
      const res = await axios.post(`/api/study-notes/${note._id}/ask`, {
        question: question.trim()
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.data.success) {
        setAiAnswer(res.data.answer);
      } else {
        setAiAnswer('Sorry, I could not process your question. Please try again.');
      }
    } catch (error) {
      console.error('AI question error:', error);
      const errorMsg = error.response?.data?.error || 'Failed to get answer. Please try again.';
      setAiAnswer(errorMsg);
    } finally {
      setAiLoading(false);
    }
  };

  if (loading) return <LoadingWithBar message="Loading study notes" />;

  const isUserPremium = user?.isPremium && user?.premiumExpiry && new Date(user.premiumExpiry) > new Date();

  return (
    <div style={{ background: darkMode ? '#1a1a2e' : '#f0f7f4', minHeight: '100vh', padding: '20px' }}>
      <div style={{ maxWidth: 1200, margin: '0 auto' }}>
        {/* ---- BACK BUTTON ---- */}
        <div style={{ marginBottom: 20 }}>
          <button
            onClick={() => navigate('/')}
            style={{
              background: 'transparent',
              color: headingColor,
              border: '1px solid ' + headingColor,
              padding: '8px 20px',
              borderRadius: 30,
              cursor: 'pointer',
              fontSize: 14,
              fontWeight: 'bold',
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8
            }}
          >
            ← Back to Home
          </button>
        </div>

        {/* ---- HEADER ---- */}
        <div style={{ marginBottom: 28 }}>
          <h1 style={{ color: headingColor, fontSize: 'clamp(24px, 5vw, 32px)', marginBottom: 4 }}>📖 Study Mode</h1>
          <p style={{ color: secondaryText, fontSize: 'clamp(14px, 4vw, 16px)' }}>
            Read lecture notes, mark them as read, and ask AI questions about the content.
          </p>
        </div>

        {/* ---- NOTES LIST ---- */}
        {notes.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px 0', color: secondaryText }}>
            <p style={{ fontSize: 18 }}>📚 No study notes available yet.</p>
            <p style={{ fontSize: 14 }}>Check back later for new content.</p>
          </div>
        ) : (
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', 
            gap: 20,
            marginBottom: 40
          }}>
            {notes.map(note => {
              // Check if user can see this note (premium check)
              if (note.isPremium && !isUserPremium) {
                return (
                  <div key={note._id} style={{
                    background: darkMode ? '#16213e' : 'white',
                    borderRadius: 16,
                    padding: 20,
                    boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
                    border: `1px solid ${darkMode ? '#444' : '#e0e0e0'}`,
                    position: 'relative',
                    opacity: 0.7,
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    minHeight: '180px'
                  }}>
                    <div style={{ fontSize: 48, marginBottom: 12 }}>🔒</div>
                    <h3 style={{ color: headingColor, fontSize: 18, marginBottom: 8, textAlign: 'center' }}>{note.title}</h3>
                    <p style={{ color: secondaryText, fontSize: 14, textAlign: 'center', marginBottom: 12 }}>
                      ⭐ This is a premium note. Upgrade to access it.
                    </p>
                    <Link to="/get-premium">
                      <button style={{
                        background: '#ff9800',
                        color: 'white',
                        border: 'none',
                        padding: '8px 20px',
                        borderRadius: 30,
                        cursor: 'pointer',
                        fontWeight: 'bold',
                        fontSize: 13
                      }}>
                        Upgrade to Premium
                      </button>
                    </Link>
                  </div>
                );
              }

              const isRead = readNotes.includes(note._id);

              return (
                <div key={note._id} style={{
                  background: darkMode ? '#16213e' : 'white',
                  borderRadius: 16,
                  padding: 20,
                  boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
                  border: isRead ? '2px solid #4caf50' : `1px solid ${darkMode ? '#444' : '#e0e0e0'}`,
                  position: 'relative',
                  transition: 'transform 0.2s, box-shadow 0.2s',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-4px)';
                  e.currentTarget.style.boxShadow = '0 4px 16px rgba(0,0,0,0.12)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.08)';
                }}>
                  {/* READ BADGE */}
                  {isRead && (
                    <span style={{
                      position: 'absolute',
                      top: 12,
                      right: 12,
                      background: '#4caf50',
                      color: 'white',
                      padding: '2px 12px',
                      borderRadius: 12,
                      fontSize: 11,
                      fontWeight: 'bold'
                    }}>
                      ✅ Read
                    </span>
                  )}
                  {note.isPremium && (
                    <span style={{
                      position: 'absolute',
                      top: 12,
                      left: 12,
                      background: '#ff9800',
                      color: 'white',
                      padding: '2px 10px',
                      borderRadius: 12,
                      fontSize: 11,
                      fontWeight: 'bold'
                    }}>
                      ⭐ Premium
                    </span>
                  )}

                  {/* ICON & TITLE */}
                  <div>
                    <div style={{ fontSize: 32, marginBottom: 8 }}>📄</div>
                    <h3 style={{ color: headingColor, fontSize: 18, marginBottom: 4, fontWeight: 600 }}>{note.title}</h3>
                    <p style={{ color: secondaryText, fontSize: 14, marginBottom: 4, lineHeight: 1.5 }}>{note.description}</p>
                    <p style={{ color: secondaryText, fontSize: 12, marginBottom: 16 }}>
                      📂 {note.category || 'General'} • ⏱️ {note.estimatedReadTime || 5} min
                    </p>
                  </div>

                  {/* ACTION BUTTONS */}
                  <div>
                    {!isRead ? (
                      <button
                        onClick={() => handleMarkAsRead(note._id)}
                        style={{
                          width: '100%',
                          background: 'linear-gradient(135deg, #1e3c72 0%, #2a5298 100%)',
                          color: 'white',
                          border: 'none',
                          padding: '10px 0',
                          borderRadius: 8,
                          cursor: 'pointer',
                          fontWeight: 'bold',
                          fontSize: 14,
                          transition: 'opacity 0.2s'
                        }}
                        onMouseEnter={(e) => e.currentTarget.style.opacity = '0.9'}
                        onMouseLeave={(e) => e.currentTarget.style.opacity = '1'}
                      >
                        Mark as Read
                      </button>
                    ) : (
                      <button
                        onClick={() => setSelectedNote(selectedNote?._id === note._id ? null : note)}
                        style={{
                          width: '100%',
                          background: selectedNote?._id === note._id ? '#6c757d' : '#ff9800',
                          color: 'white',
                          border: 'none',
                          padding: '10px 0',
                          borderRadius: 8,
                          cursor: 'pointer',
                          fontWeight: 'bold',
                          fontSize: 14,
                          transition: 'background 0.2s'
                        }}
                        onMouseEnter={(e) => {
                          if (selectedNote?._id !== note._id) {
                            e.currentTarget.style.background = '#e65100';
                          }
                        }}
                        onMouseLeave={(e) => {
                          if (selectedNote?._id !== note._id) {
                            e.currentTarget.style.background = '#ff9800';
                          }
                        }}
                      >
                        {selectedNote?._id === note._id ? 'Close Q&A' : '🤖 Ask AI'}
                      </button>
                    )}
                  </div>

                  {/* ---- Q&A SECTION (when selected) ---- */}
                  {selectedNote?._id === note._id && isRead && (
                    <div style={{ 
                      marginTop: 16, 
                      borderTop: `1px solid ${darkMode ? '#444' : '#e0e0e0'}`, 
                      paddingTop: 16,
                      animation: 'fadeIn 0.3s ease'
                    }}>
                      <style>{`
                        @keyframes fadeIn {
                          from { opacity: 0; transform: translateY(-8px); }
                          to { opacity: 1; transform: translateY(0); }
                        }
                      `}</style>
                      <textarea
                        rows="3"
                        placeholder="Ask a question about this note..."
                        value={question}
                        onChange={(e) => setQuestion(e.target.value)}
                        style={{
                          width: '100%',
                          padding: 10,
                          borderRadius: 8,
                          border: `1px solid ${darkMode ? '#555' : '#ccc'}`,
                          fontSize: 14,
                          background: darkMode ? '#2d2d3d' : 'white',
                          color: darkMode ? '#eee' : '#333',
                          resize: 'vertical',
                          boxSizing: 'border-box',
                          fontFamily: 'inherit'
                        }}
                      />
                      <button
                        onClick={() => handleAskAI(note)}
                        disabled={!question.trim() || aiLoading}
                        style={{
                          width: '100%',
                          marginTop: 8,
                          background: aiLoading ? '#6c757d' : '#1e3c72',
                          color: 'white',
                          border: 'none',
                          padding: '8px 0',
                          borderRadius: 8,
                          cursor: aiLoading ? 'not-allowed' : 'pointer',
                          fontWeight: 'bold',
                          fontSize: 14,
                          transition: 'background 0.2s'
                        }}
                        onMouseEnter={(e) => {
                          if (!aiLoading) e.currentTarget.style.background = '#2a5298';
                        }}
                        onMouseLeave={(e) => {
                          if (!aiLoading) e.currentTarget.style.background = '#1e3c72';
                        }}
                      >
                        {aiLoading ? '⏳ Thinking...' : '🤖 Ask AI'}
                      </button>
                      {aiAnswer && (
                        <div style={{
                          marginTop: 12,
                          padding: 12,
                          background: darkMode ? '#2d2d3d' : '#f0f7f4',
                          borderRadius: 8,
                          fontSize: 14,
                          color: darkMode ? '#eee' : '#333',
                          whiteSpace: 'pre-wrap',
                          lineHeight: 1.6,
                          borderLeft: `4px solid #1e3c72`
                        }}>
                          <strong style={{ display: 'block', marginBottom: 6 }}>💡 AI Answer:</strong>
                          {aiAnswer}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ---- FOOTER ---- */}
      <div style={{ textAlign: 'center', padding: '20px', marginTop: 20 }}>
        <p style={{ color: secondaryText, fontSize: 12 }}>© 2026 ELITE Nursing & Midwifery CBT. All rights reserved.</p>
      </div>
    </div>
  );
};