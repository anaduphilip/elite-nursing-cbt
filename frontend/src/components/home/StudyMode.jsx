// src/components/home/StudyMode.jsx
import React, { useState, useEffect, useContext } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import ReactMarkdown from 'react-markdown';
import { AuthContext } from '../../context/AuthContext';
import { getHeadingColor, getSecondaryText, getTextColor } from '../../utils/theme';
import { LoadingWithBar } from '../common/LoadingWithBar';

export const StudyMode = () => {
  const { token, darkMode, user } = useContext(AuthContext);
  const headingColor = getHeadingColor(darkMode);
  const secondaryText = getSecondaryText(darkMode);
  const textColor = getTextColor(darkMode);
  const navigate = useNavigate();

  const [notes, setNotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedNote, setSelectedNote] = useState(null);
  const [question, setQuestion] = useState('');
  const [aiAnswer, setAiAnswer] = useState('');
  const [aiLoading, setAiLoading] = useState(false);
  const [readNotes, setReadNotes] = useState([]);
  const [modalNote, setModalNote] = useState(null);

  // ---- Fetch study notes ----
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

  // ---- Fetch read notes ----
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

  // ---- Mark as read ----
  const handleMarkAsRead = async (noteId) => {
    try {
      const res = await axios.post(`/api/study-notes/${noteId}/read`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.data.success) {
        setReadNotes(prev => [...prev, noteId]);
        setModalNote(null);
      }
    } catch (error) {
      alert('Failed to mark as read. Please try again.');
    }
  };

  // ---- Ask AI ----
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

  // ---- Modal controls ----
  const openModal = (note) => {
    setModalNote(note);
  };

  const closeModal = () => {
    setModalNote(null);
    setAiAnswer('');
    setQuestion('');
  };

  // ---- Premium check ----
  const isUserPremium = user?.isPremium && user?.premiumExpiry && new Date(user.premiumExpiry) > new Date();

  if (loading) return <LoadingWithBar message="Loading study notes" />;

  return (
    <div style={{ background: darkMode ? '#1a1a2e' : '#f0f7f4', minHeight: '100vh', padding: '20px' }}>
      <div style={{ maxWidth: 1200, margin: '0 auto' }}>
        {/* Back button */}
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

        {/* Header */}
        <div style={{ marginBottom: 28 }}>
          <h1 style={{ color: headingColor, fontSize: 'clamp(24px, 5vw, 32px)', marginBottom: 4 }}>📖 Study Mode</h1>
          <p style={{ color: secondaryText, fontSize: 'clamp(14px, 4vw, 16px)' }}>
            Read lecture notes, mark them as read, and ask AI questions about the content.
          </p>
        </div>

        {/* Notes grid */}
        {notes.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px 0', color: secondaryText }}>
            <p style={{ fontSize: 18 }}>📚 No study notes available yet.</p>
            <p style={{ fontSize: 14 }}>Check back later for new content.</p>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: 24, marginBottom: 40 }}>
            {notes.map(note => {
              // Premium lock
              if (note.isPremium && !isUserPremium) {
                return (
                  <div key={note._id} style={{
                    background: darkMode ? '#16213e' : 'white',
                    borderRadius: 16,
                    padding: 24,
                    boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
                    border: `1px solid ${darkMode ? '#444' : '#e0e0e0'}`,
                    opacity: 0.7,
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    minHeight: '200px',
                    textAlign: 'center'
                  }}>
                    <div style={{ fontSize: 48, marginBottom: 12 }}>🔒</div>
                    <h3 style={{ color: headingColor, fontSize: 18, marginBottom: 8 }}>{note.title}</h3>
                    <p style={{ color: secondaryText, fontSize: 14, marginBottom: 16 }}>⭐ Premium note. Upgrade to access.</p>
                    <Link to="/get-premium">
                      <button style={{ background: '#ff9800', color: 'white', border: 'none', padding: '8px 24px', borderRadius: 30, cursor: 'pointer', fontWeight: 'bold', fontSize: 14 }}>Upgrade</button>
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
                  height: 'fit-content'
                }}
                onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-4px)'; e.currentTarget.style.boxShadow = '0 4px 16px rgba(0,0,0,0.12)'; }}
                onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.08)'; }}>
                  {/* Badges */}
                  {isRead && <span style={{ position: 'absolute', top: 12, right: 12, background: '#4caf50', color: 'white', padding: '2px 12px', borderRadius: 12, fontSize: 11, fontWeight: 'bold' }}>✅ Read</span>}
                  {note.isPremium && <span style={{ position: 'absolute', top: 12, left: 12, background: '#ff9800', color: 'white', padding: '2px 10px', borderRadius: 12, fontSize: 11, fontWeight: 'bold' }}>⭐ Premium</span>}

                  <div>
                    <div style={{ fontSize: 32, marginBottom: 8 }}>📄</div>
                    <h3 style={{ color: headingColor, fontSize: 18, marginBottom: 4, fontWeight: 600 }}>{note.title}</h3>
                    <p style={{ color: secondaryText, fontSize: 14, marginBottom: 4, lineHeight: 1.5 }}>{note.description}</p>
                    <p style={{ color: secondaryText, fontSize: 12, marginBottom: 16 }}>📂 {note.category || 'General'} • ⏱️ {note.estimatedReadTime || 5} min</p>
                  </div>

                  {/* Action buttons */}
                  <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                    <button
                      onClick={() => openModal(note)}
                      style={{
                        flex: 1,
                        background: '#1e3c72',
                        color: 'white',
                        border: 'none',
                        padding: '10px 0',
                        borderRadius: 8,
                        cursor: 'pointer',
                        fontWeight: 'bold',
                        fontSize: 14,
                        transition: 'background 0.2s'
                      }}
                    >
                      📖 Read Full Note
                    </button>
                    {isRead && (
                      <button
                        onClick={() => setSelectedNote(selectedNote?._id === note._id ? null : note)}
                        style={{
                          flex: 1,
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
                      >
                        {selectedNote?._id === note._id ? 'Close Q&A' : '🤖 Ask AI'}
                      </button>
                    )}
                  </div>

                  {/* Q&A section */}
                  {selectedNote?._id === note._id && isRead && (
                    <div style={{ marginTop: 12, borderTop: `1px solid ${darkMode ? '#444' : '#e0e0e0'}`, paddingTop: 12, animation: 'fadeIn 0.3s ease' }}>
                      <style>{`@keyframes fadeIn { from { opacity: 0; transform: translateY(-8px); } to { opacity: 1; transform: translateY(0); } }`}</style>
                      <textarea
                        rows="3"
                        placeholder="Ask a question about this note..."
                        value={question}
                        onChange={(e) => setQuestion(e.target.value)}
                        style={{ width: '100%', padding: 10, borderRadius: 8, border: `1px solid ${darkMode ? '#555' : '#ccc'}`, fontSize: 14, background: darkMode ? '#2d2d3d' : 'white', color: darkMode ? '#eee' : '#333', resize: 'vertical', boxSizing: 'border-box', fontFamily: 'inherit' }}
                      />
                      <button
                        onClick={() => handleAskAI(note)}
                        disabled={!question.trim() || aiLoading}
                        style={{ width: '100%', marginTop: 8, background: aiLoading ? '#6c757d' : '#1e3c72', color: 'white', border: 'none', padding: '8px 0', borderRadius: 8, cursor: aiLoading ? 'not-allowed' : 'pointer', fontWeight: 'bold', fontSize: 14 }}
                      >
                        {aiLoading ? '⏳ Thinking...' : '🤖 Ask AI'}
                      </button>
                      {aiAnswer && (
                        <div style={{ marginTop: 12, padding: 16, paddingRight: 40, background: darkMode ? '#1a1a2e' : '#f0f7f4', borderRadius: 8, borderLeft: '4px solid #ff9800', position: 'relative', textAlign: 'left' }}>
                          <button onClick={() => { setAiAnswer(''); setQuestion(''); }} style={{ position: 'absolute', top: 8, right: 10, background: 'none', border: 'none', fontSize: 18, cursor: 'pointer', color: secondaryText, padding: '4px 8px', borderRadius: 4, lineHeight: 1 }}>✕</button>
                          <div style={{ fontWeight: 'bold', color: '#ff9800', marginBottom: 8, textAlign: 'left' }}>AI Answer</div>
                          <ReactMarkdown
                            components={{
                              p: ({ children }) => <p style={{ margin: '4px 0', fontSize: 14, color: textColor, lineHeight: 1.6, textAlign: 'left' }}>{children}</p>,
                              strong: ({ children }) => <strong style={{ color: headingColor }}>{children}</strong>,
                              ul: ({ children }) => <ul style={{ paddingLeft: 20, margin: '4px 0', listStyleType: 'disc', textAlign: 'left' }}>{children}</ul>,
                              li: ({ children }) => <li style={{ margin: '2px 0', fontSize: 14, color: textColor, lineHeight: 1.6, textAlign: 'left' }}>{children}</li>,
                              h3: ({ children }) => <h3 style={{ margin: '8px 0 4px', fontSize: 15, color: headingColor, fontWeight: 'bold', textAlign: 'left' }}>{children}</h3>
                            }}
                          >
                            {aiAnswer}
                          </ReactMarkdown>
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

      {/* ---- MODAL FOR READING NOTE (Professional Design) ---- */}
      {modalNote && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0,0,0,0.7)',
          backdropFilter: 'blur(4px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 2000,
          padding: '20px',
          animation: 'fadeIn 0.3s ease'
        }}>
          <style>{`
            @keyframes fadeIn {
              from { opacity: 0; transform: scale(0.96); }
              to { opacity: 1; transform: scale(1); }
            }
            /* Scrollbar styling */
            .modal-scroll::-webkit-scrollbar {
              width: 6px;
            }
            .modal-scroll::-webkit-scrollbar-track {
              background: ${darkMode ? '#1a1a2e' : '#f0f0f0'};
              border-radius: 4px;
            }
            .modal-scroll::-webkit-scrollbar-thumb {
              background: ${darkMode ? '#4a4a5a' : '#c1c1c1'};
              border-radius: 4px;
            }
            .modal-scroll::-webkit-scrollbar-thumb:hover {
              background: ${darkMode ? '#6a6a7a' : '#a1a1a1'};
            }
            .modal-content p {
              margin: 8px 0;
              line-height: 1.8;
            }
            .modal-content h1 {
              font-size: 24px;
              margin: 16px 0 8px;
              color: ${headingColor};
            }
            .modal-content h2 {
              font-size: 20px;
              margin: 14px 0 6px;
              color: ${headingColor};
            }
            .modal-content h3 {
              font-size: 18px;
              margin: 12px 0 6px;
              color: ${headingColor};
            }
            .modal-content ul {
              padding-left: 24px;
              margin: 6px 0;
            }
            .modal-content li {
              margin: 4px 0;
            }
            .modal-content blockquote {
              border-left: 4px solid #ff9800;
              padding-left: 16px;
              margin: 12px 0;
              color: ${secondaryText};
            }
          `}</style>

          <div style={{
            background: darkMode ? '#16213e' : 'white',
            borderRadius: 24,
            padding: 32,
            maxWidth: 820,
            width: '100%',
            maxHeight: '90vh',
            display: 'flex',
            flexDirection: 'column',
            boxShadow: '0 20px 60px rgba(0,0,0,0.4)',
            position: 'relative',
            overflow: 'hidden'
          }}>
            {/* Header with gradient accent */}
            <div style={{
              background: `linear-gradient(135deg, ${headingColor} 0%, ${darkMode ? '#2a5298' : '#1e3c72'} 100%)`,
              margin: '-32px -32px 20px -32px',
              padding: '20px 32px',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              borderTopLeftRadius: 24,
              borderTopRightRadius: 24
            }}>
              <div>
                <h2 style={{ color: 'white', margin: 0, fontSize: 22, fontWeight: 600 }}>{modalNote.title}</h2>
                <div style={{ color: 'rgba(255,255,255,0.8)', fontSize: 13, marginTop: 4 }}>
                  📂 {modalNote.category || 'General'} • ⏱️ {modalNote.estimatedReadTime || 5} min
                  {modalNote.isPremium && <span style={{ marginLeft: 12, background: '#ff9800', color: 'white', padding: '2px 10px', borderRadius: 12, fontSize: 12, fontWeight: 'bold' }}>⭐ Premium</span>}
                </div>
              </div>
              <button
                onClick={closeModal}
                style={{
                  background: 'rgba(255,255,255,0.15)',
                  border: 'none',
                  borderRadius: '50%',
                  width: 40,
                  height: 40,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  color: 'white',
                  fontSize: 22,
                  transition: 'background 0.2s',
                  flexShrink: 0
                }}
                onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.3)'}
                onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.15)'}
              >
                ✕
              </button>
            </div>

            {/* Scrollable content area */}
            <div
              className="modal-scroll"
              style={{
                flex: 1,
                overflowY: 'auto',
                overflowX: 'hidden',
                paddingRight: 8,
                marginBottom: 20,
                wordWrap: 'break-word',
                color: textColor,
                fontSize: 15,
                lineHeight: 1.8
              }}
            >
              <div
                className="modal-content"
                dangerouslySetInnerHTML={{ __html: modalNote.content || '<p>No content available.</p>' }}
                style={{
                  textAlign: 'left' // default left-aligned; admin's inline styles will override if alignment was set
                }}
              />
            </div>

            {/* Footer actions */}
            <div style={{
              display: 'flex',
              gap: 12,
              justifyContent: 'flex-end',
              borderTop: `1px solid ${darkMode ? '#444' : '#eee'}`,
              paddingTop: 16,
              flexWrap: 'wrap'
            }}>
              {!readNotes.includes(modalNote._id) && (
                <button
                  onClick={() => handleMarkAsRead(modalNote._id)}
                  style={{
                    background: '#4caf50',
                    color: 'white',
                    padding: '10px 24px',
                    border: 'none',
                    borderRadius: 30,
                    cursor: 'pointer',
                    fontWeight: 'bold',
                    fontSize: 14,
                    transition: 'background 0.2s',
                    boxShadow: '0 2px 8px rgba(76,175,80,0.3)'
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.background = '#43a047'}
                  onMouseLeave={(e) => e.currentTarget.style.background = '#4caf50'}
                >
                  ✅ Mark as Read
                </button>
              )}
              <button
                onClick={closeModal}
                style={{
                  background: '#6c757d',
                  color: 'white',
                  padding: '10px 24px',
                  border: 'none',
                  borderRadius: 30,
                  cursor: 'pointer',
                  fontWeight: 'bold',
                  fontSize: 14,
                  transition: 'background 0.2s'
                }}
                onMouseEnter={(e) => e.currentTarget.style.background = '#5a6268'}
                onMouseLeave={(e) => e.currentTarget.style.background = '#6c757d'}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ---- FOOTER ---- */}
      <div style={{ textAlign: 'center', padding: '20px', marginTop: 20 }}>
        <p style={{ color: secondaryText, fontSize: 12 }}>© 2026 ELITE Nursing & Midwifery CBT. All rights reserved.</p>
      </div>
    </div>
  );
};