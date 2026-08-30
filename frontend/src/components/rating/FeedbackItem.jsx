// src/components/rating/FeedbackItem.jsx
import React, { useState, useContext, useRef, useEffect } from 'react';
import { AuthContext } from '../../context/AuthContext';
import axios from 'axios';

const FeedbackItem = ({
  feedback,
  darkMode,
  headingColor,
  textColor,
  secondaryText,
  cardBg,
  token
}) => {
  const { user } = useContext(AuthContext);

  // ----- GUARD: Exit early if feedback is invalid -----
  if (!feedback || !feedback._id) {
    return null;
  }

  const [reactions, setReactions] = useState(feedback.reactions || []);
  const [replyReactions, setReplyReactions] = useState(
    (feedback.replies || []).map(r => ({
      ...r,
      reactions: r.reactions || []
    }))
  );
  const [showReplies, setShowReplies] = useState(false);
  const [reacting, setReacting] = useState(false);
  const [pickerOpen, setPickerOpen] = useState({});
  const pickerRef = useRef({});

  const allowedEmojis = ['👍', '❤️', '👏', '😊', '🔥', '💯', '🌟', '🙌'];

  const togglePicker = (key) => {
    setPickerOpen(prev => ({ ...prev, [key]: !prev[key] }));
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      Object.keys(pickerOpen).forEach(key => {
        if (pickerOpen[key] && pickerRef.current[key] && !pickerRef.current[key].contains(event.target)) {
          setPickerOpen(prev => ({ ...prev, [key]: false }));
        }
      });
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [pickerOpen]);

  const handleReaction = async (feedbackId, emoji, replyId = null) => {
    if (!token || !user) {
      alert('Please log in to react.');
      return;
    }
    setReacting(true);
    try {
      const res = await axios.post(
        `/api/ratings/${feedbackId}/reactions`,
        { emoji, replyId },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (res.data.success) {
        const updated = await axios.get('/api/ratings/latest');
        if (updated.data.success) {
          const updatedFeedback = updated.data.ratings.find(f => f._id === feedbackId);
          if (updatedFeedback) {
            setReactions(updatedFeedback.reactions || []);
            if (replyId) {
              const updatedReplies = (updatedFeedback.replies || []).map(r => ({
                ...r,
                reactions: r.reactions || []
              }));
              setReplyReactions(updatedReplies);
            }
          }
        }
        const key = replyId ? `reply_${replyId}` : 'feedback';
        setPickerOpen(prev => ({ ...prev, [key]: false }));
      }
    } catch (err) {
      console.error('Reaction error:', err);
      alert('Failed to add reaction.');
    } finally {
      setReacting(false);
    }
  };

  const renderStars = (count) => {
    return '★'.repeat(count) + '☆'.repeat(5 - count);
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const isOwnReaction = (reaction) => {
    return reaction.userId && reaction.userId._id === user?._id;
  };

  const renderReactions = (targetReactions, targetId, replyId = null) => {
    const key = replyId ? `reply_${replyId}` : 'feedback';
    const isPickerOpen = pickerOpen[key] || false;
    const visibleEmojis = allowedEmojis.filter(emoji =>
      targetReactions.some(r => r.emoji === emoji)
    );

    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap', marginTop: 4 }}>
        {visibleEmojis.map((emoji) => {
          const count = targetReactions.filter(r => r.emoji === emoji).length;
          const userReacted = targetReactions.some(r => r.emoji === emoji && isOwnReaction(r));
          return (
            <button
              key={emoji}
              onClick={() => handleReaction(feedback._id, emoji, replyId)}
              disabled={reacting}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 4,
                padding: '4px 12px',
                borderRadius: 20,
                border: `1px solid ${userReacted ? '#1e3c72' : (darkMode ? '#555' : '#ddd')}`,
                background: userReacted ? (darkMode ? '#2d3a5a' : '#e8f0fe') : 'transparent',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                boxShadow: userReacted ? '0 2px 6px rgba(30,60,114,0.15)' : 'none',
                fontSize: 14,
                fontWeight: userReacted ? 'bold' : 'normal',
                color: textColor,
              }}
              onMouseEnter={(e) => (e.currentTarget.style.transform = 'scale(1.05)')}
              onMouseLeave={(e) => (e.currentTarget.style.transform = 'scale(1)')}
            >
              <span style={{ fontSize: 16 }}>{emoji}</span>
              <span style={{ fontSize: 13, fontWeight: 'bold' }}>{count}</span>
            </button>
          );
        })}

        {allowedEmojis.length > visibleEmojis.length && (
          <div style={{ position: 'relative', display: 'inline-block' }} ref={el => (pickerRef.current[key] = el)}>
            <button
              onClick={() => togglePicker(key)}
              disabled={reacting}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 4,
                padding: '4px 12px',
                borderRadius: 20,
                border: `1px solid ${darkMode ? '#555' : '#ddd'}`,
                background: 'transparent',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                color: secondaryText,
                fontSize: 14,
              }}
            >
              😊 React
            </button>
            {isPickerOpen && (
              <div
                style={{
                  position: 'absolute',
                  top: 'calc(100% + 6px)',
                  left: 0,
                  background: cardBg,
                  border: `1px solid ${darkMode ? '#444' : '#ddd'}`,
                  borderRadius: 12,
                  padding: 8,
                  boxShadow: '0 4px 16px rgba(0,0,0,0.2)',
                  display: 'flex',
                  gap: 6,
                  flexWrap: 'wrap',
                  minWidth: '180px',
                  zIndex: 10,
                }}
              >
                {allowedEmojis.map(emoji => (
                  <button
                    key={emoji}
                    onClick={() => handleReaction(feedback._id, emoji, replyId)}
                    disabled={reacting}
                    style={{
                      padding: '4px 8px',
                      borderRadius: 8,
                      border: 'none',
                      background: 'transparent',
                      cursor: 'pointer',
                      fontSize: 24,
                      transition: 'transform 0.15s',
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.transform = 'scale(1.2)')}
                    onMouseLeave={(e) => (e.currentTarget.style.transform = 'scale(1)')}
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    );
  };

  return (
    <div
      style={{
        background: cardBg,
        borderRadius: 12,
        padding: 20,
        border: `1px solid ${darkMode ? '#444' : '#eee'}`,
        boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
      }}
    >
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: 8,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <span style={{ color: '#FFD700', fontSize: 18 }}>
            {renderStars(feedback.stars)}
          </span>
          <span style={{ fontWeight: 'bold', color: textColor }}>
            {feedback.name || 'Anonymous User'}
          </span>
        </div>
        <span style={{ color: secondaryText, fontSize: 12 }}>
          {formatDate(feedback.createdAt)}
        </span>
      </div>

      {feedback.feedback && (
        <p style={{ color: textColor, marginBottom: 12, fontSize: 14 }}>
          {feedback.feedback}
        </p>
      )}

      {renderReactions(reactions, feedback._id, null)}

      {feedback.replies && feedback.replies.length > 0 && (
        <div style={{ marginTop: 8 }}>
          <button
            onClick={() => setShowReplies(!showReplies)}
            style={{
              background: 'transparent',
              border: 'none',
              color: '#1e3c72',
              cursor: 'pointer',
              fontSize: 13,
              fontWeight: 'bold',
              textDecoration: 'underline',
            }}
          >
            {showReplies ? 'Hide Replies' : `View Replies (${feedback.replies.length})`}
          </button>
        </div>
      )}

      {showReplies &&
        feedback.replies &&
        feedback.replies.map((reply) => {
          const replyReactionsList =
            replyReactions.find(r => r._id === reply._id)?.reactions || [];
          return (
            <div
              key={reply._id}
              style={{
                marginTop: 12,
                padding: 12,
                background: darkMode ? '#1a1a2e' : '#f8f9fa',
                borderRadius: 8,
                borderLeft: `3px solid #1e3c72`,
              }}
            >
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: 4,
                }}
              >
                <span style={{ fontWeight: 'bold', color: headingColor, fontSize: 13 }}>
                  Admin
                </span>
                <span style={{ color: secondaryText, fontSize: 11 }}>
                  {formatDate(reply.createdAt)}
                </span>
              </div>
              <p style={{ color: textColor, fontSize: 14, marginBottom: 8 }}>
                {reply.replyText}
              </p>
              {renderReactions(replyReactionsList, feedback._id, reply._id)}
            </div>
          );
        })}
    </div>
  );
};

export default FeedbackItem;