// src/components/rating/FeedbackItem.jsx
import React, { useState, useContext } from 'react';
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
  const [reactions, setReactions] = useState(feedback.reactions || []);
  const [replyReactions, setReplyReactions] = useState(
    feedback.replies?.map(r => ({ ...r, reactions: r.reactions || [] })) || []
  );
  const [showReplies, setShowReplies] = useState(false);
  const [reacting, setReacting] = useState(false);

  const allowedEmojis = ['👍', '❤️', '👏', '😊', '🔥', '💯', '🌟', '🙌'];

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
              const updatedReplies = updatedFeedback.replies?.map(r => ({
                ...r,
                reactions: r.reactions || []
              })) || [];
              setReplyReactions(updatedReplies);
            }
          }
        }
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

  return (
    <div style={{
      background: cardBg,
      borderRadius: 12,
      padding: 20,
      border: `1px solid ${darkMode ? '#444' : '#eee'}`,
      boxShadow: '0 2px 8px rgba(0,0,0,0.05)'
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
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

      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 8 }}>
        {allowedEmojis.map((emoji) => {
          const count = reactions.filter(r => r.emoji === emoji).length;
          const userReacted = reactions.some(r => r.emoji === emoji && isOwnReaction(r));
          return (
            <button
              key={emoji}
              onClick={() => handleReaction(feedback._id, emoji, null)}
              disabled={reacting}
              style={{
                background: userReacted ? (darkMode ? '#3a3a5a' : '#e8f0fe') : 'transparent',
                border: `1px solid ${userReacted ? '#1e3c72' : (darkMode ? '#555' : '#ddd')}`,
                borderRadius: 20,
                padding: '4px 12px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: 4,
                fontSize: 14,
                color: textColor
              }}
            >
              {emoji} {count > 0 && <span style={{ fontSize: 12 }}>{count}</span>}
            </button>
          );
        })}
      </div>

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
              textDecoration: 'underline'
            }}
          >
            {showReplies ? 'Hide Replies' : `View Replies (${feedback.replies.length})`}
          </button>
        </div>
      )}

      {showReplies && feedback.replies && feedback.replies.map((reply) => {
        const replyReactionsList = replyReactions.find(r => r._id === reply._id)?.reactions || [];
        return (
          <div key={reply._id} style={{
            marginTop: 12,
            padding: 12,
            background: darkMode ? '#1a1a2e' : '#f8f9fa',
            borderRadius: 8,
            borderLeft: `3px solid #1e3c72`
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
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
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {allowedEmojis.map((emoji) => {
                const count = replyReactionsList.filter(r => r.emoji === emoji).length;
                const userReacted = replyReactionsList.some(r => r.emoji === emoji && isOwnReaction(r));
                return (
                  <button
                    key={emoji}
                    onClick={() => handleReaction(feedback._id, emoji, reply._id)}
                    disabled={reacting}
                    style={{
                      background: userReacted ? (darkMode ? '#3a3a5a' : '#e8f0fe') : 'transparent',
                      border: `1px solid ${userReacted ? '#1e3c72' : (darkMode ? '#555' : '#ddd')}`,
                      borderRadius: 20,
                      padding: '2px 10px',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 4,
                      fontSize: 13,
                      color: textColor
                    }}
                  >
                    {emoji} {count > 0 && <span style={{ fontSize: 11 }}>{count}</span>}
                  </button>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default FeedbackItem;