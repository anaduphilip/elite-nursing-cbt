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
                border: `1px solid ${userReacted ? '#1e3c72' : (darkMode ? '#444' : '#ddd')}`,
                background: userReacted ? (darkMode ? '#2d3a5a' : '#e8f0fe') : 'transparent',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                fontSize: 14,
                fontWeight: userReacted ? '600' : '400',
                color: textColor,
              }}
              onMouseEnter={(e) => (e.currentTarget.style.transform = 'scale(1.03)')}
              onMouseLeave={(e) => (e.currentTarget.style.transform = 'scale(1)')}
            >
              <span style={{ fontSize: 16 }}>{emoji}</span>
              <span style={{ fontSize: 13, fontWeight: '500' }}>{count}</span>
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
                border: `1px solid ${darkMode ? '#444' : '#ddd'}`,
                background: 'transparent',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                color: secondaryText,
                fontSize: 13,
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
                  boxShadow: '0 4px 16px rgba(0,0,0,0.15)',
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
        padding: 18,
        border: `1px solid ${darkMode ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)'}`,
        boxShadow: darkMode
          ? '0 1px 4px rgba(0,0,0,0.3)'
          : '0 1px 4px rgba(0,0,0,0.04)',
        transition: 'box-shadow 0.2s',
        marginBottom: 16,
      }}
    >
      {/* Header: Stars + Name + Date */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: 6,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ color: '#FFD700', fontSize: 16 }}>
            {renderStars(feedback.stars)}
          </span>
          <span style={{ fontWeight: 600, color: textColor, fontSize: 14 }}>
            {feedback.name || 'Anonymous'}
          </span>
        </div>
        <span style={{ color: secondaryText, fontSize: 11 }}>
          {formatDate(feedback.createdAt)}
        </span>
      </div>

      {/* Feedback text */}
      {feedback.feedback && (
        <p
          style={{
            color: textColor,
            fontSize: 14,
            lineHeight: 1.6,
            margin: '4px 0 10px 0',
          }}
        >
          {feedback.feedback}
        </p>
      )}

      {/* Reactions */}
      {renderReactions(reactions, feedback._id, null)}

      {/* Replies toggle */}
      {feedback.replies && feedback.replies.length > 0 && (
        <div style={{ marginTop: 10 }}>
          <button
            onClick={() => setShowReplies(!showReplies)}
            style={{
              background: 'transparent',
              border: 'none',
              color: '#1e3c72',
              cursor: 'pointer',
              fontSize: 12,
              fontWeight: 600,
              padding: 0,
              textDecoration: 'underline',
            }}
          >
            {showReplies ? 'Hide replies' : `View ${feedback.replies.length} reply${feedback.replies.length > 1 ? 's' : ''}`}
          </button>
        </div>
      )}

      {/* Replies list */}
      {showReplies &&
        feedback.replies &&
        feedback.replies.map((reply) => {
          const replyReactionsList =
            replyReactions.find(r => r._id === reply._id)?.reactions || [];
          return (
            <div
              key={reply._id}
              style={{
                marginTop: 10,
                padding: 10,
                background: darkMode ? 'rgba(255,255,255,0.04)' : '#f8f9fa',
                borderRadius: 8,
                borderLeft: `3px solid #1e3c72`,
              }}
            >
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: 2,
                }}
              >
                <span style={{ fontWeight: 600, color: headingColor, fontSize: 12 }}>
                  Admin
                </span>
                <span style={{ color: secondaryText, fontSize: 10 }}>
                  {formatDate(reply.createdAt)}
                </span>
              </div>
              <p
                style={{
                  color: textColor,
                  fontSize: 13,
                  margin: '2px 0 6px 0',
                }}
              >
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