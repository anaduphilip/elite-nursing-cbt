// src/components/rating/RatingModal.jsx
import React, { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../../context/AuthContext';
import axios from 'axios';

const RatingModal = ({
  isOpen,
  onClose,
  onRatingSubmitted,
  darkMode,
  cardBg,
  headingColor,
  textColor,
  secondaryText
}) => {
  const { token, user } = useContext(AuthContext);
  const [stars, setStars] = useState(0);
  const [hoveredStar, setHoveredStar] = useState(0);
  const [feedback, setFeedback] = useState('');
  const [showSuggestionBox, setShowSuggestionBox] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [name, setName] = useState(user?.name || '');

  // Reset state when modal opens
  useEffect(() => {
    if (isOpen) {
      setStars(0);
      setHoveredStar(0);
      setFeedback('');
      setShowSuggestionBox(false);
      setSubmitted(false);
      setSubmitting(false);
      setName(user?.name || '');
    }
  }, [isOpen, user]);

  if (!isOpen) return null;

  const handleStarClick = (star) => {
    setStars(star);
    setShowSuggestionBox(true);
  };

  const handleSubmit = async () => {
    if (stars === 0) return;
    setSubmitting(true);
    try {
      await axios.post(
        '/api/ratings',
        {
          stars,
          feedback: feedback.trim(),
          name: name.trim() || 'Anonymous User'
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      localStorage.removeItem('latestFeedbacks');
      localStorage.removeItem('ratingStats');

      setSubmitted(true);
      setShowSuggestionBox(false);
      if (onRatingSubmitted) onRatingSubmitted();
      setTimeout(() => {
        onClose();
        setSubmitted(false);
      }, 3000);
    } catch (err) {
      console.error('Rating submission error:', err);
      alert('Failed to submit rating. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleSkip = () => {
    onClose();
  };

  return (
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
      zIndex: 9999,
      padding: 20
    }}>
      <div style={{
        background: cardBg,
        borderRadius: 20,
        padding: 30,
        maxWidth: 480,
        width: '100%',
        maxHeight: '90vh',
        overflowY: 'auto',
        boxShadow: '0 8px 30px rgba(0,0,0,0.3)',
        position: 'relative'
      }}>
        {submitted ? (
          <div style={{ textAlign: 'center', padding: '20px 0' }}>
            <div style={{ fontSize: 48, marginBottom: 16 }}>🎉</div>
            <h3 style={{ color: headingColor, marginBottom: 8 }}>Thank You!</h3>
            <p style={{ color: secondaryText }}>Your feedback helps us improve.</p>
          </div>
        ) : (
          <>
            <h3 style={{ color: headingColor, marginBottom: 8 }}>Rate Your Experience</h3>
            <p style={{ color: secondaryText, fontSize: 14, marginBottom: 20 }}>
              We value your feedback! Please rate your experience with our app.
            </p>

            <div style={{ display: 'flex', justifyContent: 'center', gap: 8, marginBottom: 16 }}>
              {[1, 2, 3, 4, 5].map((star) => (
                <span
                  key={star}
                  style={{
                    fontSize: 42,
                    cursor: 'pointer',
                    color: (hoveredStar || stars) >= star ? '#FFD700' : '#ddd',
                    transition: 'transform 0.2s',
                    transform: (hoveredStar || stars) >= star ? 'scale(1.1)' : 'scale(1)'
                  }}
                  onMouseEnter={() => setHoveredStar(star)}
                  onMouseLeave={() => setHoveredStar(0)}
                  onClick={() => handleStarClick(star)}
                >
                  ★
                </span>
              ))}
            </div>

            {stars > 0 && (
              <p style={{ textAlign: 'center', color: textColor, marginBottom: 16 }}>
                You rated {stars} {stars === 1 ? 'star' : 'stars'}
              </p>
            )}

            <div style={{ marginBottom: 12 }}>
              <input
                type="text"
                placeholder="Your name (optional)"
                value={name}
                onChange={(e) => setName(e.target.value)}
                style={{
                  width: '100%',
                  maxWidth: '100%',
                  boxSizing: 'border-box',
                  padding: '10px 14px',
                  borderRadius: 8,
                  border: `1px solid ${darkMode ? '#444' : '#ddd'}`,
                  background: darkMode ? '#1a1a2e' : 'white',
                  color: textColor,
                  fontSize: 14,
                  outline: 'none'
                }}
              />
            </div>

            {showSuggestionBox && (
              <div style={{ marginBottom: 16 }}>
                <label style={{ display: 'block', marginBottom: 6, color: textColor, fontWeight: 'bold' }}>
                  Any suggestions? (optional)
                </label>
                <textarea
                  placeholder="Tell us how we can improve..."
                  value={feedback}
                  onChange={(e) => setFeedback(e.target.value)}
                  rows="3"
                  style={{
                    width: '100%',
                    maxWidth: '100%',
                    boxSizing: 'border-box',
                    padding: '10px 14px',
                    borderRadius: 8,
                    border: `1px solid ${darkMode ? '#444' : '#ddd'}`,
                    background: darkMode ? '#1a1a2e' : 'white',
                    color: textColor,
                    fontSize: 14,
                    resize: 'vertical',
                    outline: 'none'
                  }}
                />
              </div>
            )}

            <div style={{ display: 'flex', gap: 12, marginTop: 20 }}>
              <button
                onClick={handleSkip}
                style={{
                  flex: 1,
                  padding: '12px',
                  background: 'transparent',
                  border: `1px solid ${darkMode ? '#555' : '#ccc'}`,
                  borderRadius: 8,
                  color: secondaryText,
                  cursor: 'pointer',
                  fontWeight: 'bold',
                  fontSize: 14
                }}
              >
                Skip
              </button>
              <button
                onClick={handleSubmit}
                disabled={stars === 0 || submitting}
                style={{
                  flex: 1,
                  padding: '12px',
                  background: stars === 0 || submitting ? '#ccc' : '#1e3c72',
                  color: 'white',
                  border: 'none',
                  borderRadius: 8,
                  cursor: stars === 0 || submitting ? 'not-allowed' : 'pointer',
                  fontWeight: 'bold',
                  fontSize: 14,
                  opacity: stars === 0 || submitting ? 0.7 : 1
                }}
              >
                {submitting ? 'Submitting...' : 'Submit'}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default RatingModal;