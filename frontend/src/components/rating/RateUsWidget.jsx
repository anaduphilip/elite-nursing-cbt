// src/components/rating/RateUsWidget.jsx
import React, { useState, useContext, useEffect } from 'react';
import { AuthContext } from '../../context/AuthContext';
import axios from 'axios';

const RateUsWidget = ({
  darkMode,
  headingColor,
  textColor,
  secondaryText,
  cardBg
}) => {
  const { token, user } = useContext(AuthContext);
  const [stars, setStars] = useState(0);
  const [hoveredStar, setHoveredStar] = useState(0);
  const [feedback, setFeedback] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [userRating, setUserRating] = useState(null);
  const [loading, setLoading] = useState(true);
  const [name, setName] = useState(user?.name || '');
  const [collapsed, setCollapsed] = useState(false);

  // Fetch user's existing rating
  useEffect(() => {
    const fetchUserRating = async () => {
      if (!token) return;
      try {
        const res = await axios.get('/api/ratings/check', {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (res.data.hasRated) {
          setUserRating(res.data.userRating);
          setStars(res.data.userRating);
        }
      } catch (err) {
        console.error('Fetch rating error:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchUserRating();
  }, [token]);

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
      setSubmitted(true);
      setUserRating(stars);
      setTimeout(() => {
        setCollapsed(true);
        setSubmitted(false);
      }, 3000);
    } catch (err) {
      console.error('Rating submission error:', err);
      alert('Failed to submit rating. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleExpand = () => {
    setCollapsed(false);
    setStars(userRating || 0);
    setFeedback('');
    setSubmitted(false);
  };

  if (loading) return null;

  if (collapsed) {
    return (
      <div style={{
        background: cardBg,
        borderRadius: 16,
        padding: '12px 20px',
        border: `1px solid ${darkMode ? '#444' : '#e0e0e0'}`,
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: 12
      }}>
        <span style={{ color: textColor, fontWeight: 'bold' }}>
          ⭐ Thank you for your feedback! {userRating && `(${userRating}★)`}
        </span>
        <button
          onClick={handleExpand}
          style={{
            padding: '6px 16px',
            background: '#1e3c72',
            color: 'white',
            border: 'none',
            borderRadius: 20,
            cursor: 'pointer',
            fontWeight: 'bold',
            fontSize: 13
          }}
        >
          Update Rating
        </button>
      </div>
    );
  }

  return (
    <div style={{
      background: cardBg,
      borderRadius: 16,
      padding: 24,
      border: `1px solid ${darkMode ? '#444' : '#e0e0e0'}`,
      marginBottom: 24,
      textAlign: 'center',
      transition: 'all 0.3s ease'
    }}>
      {submitted ? (
        <div style={{ padding: '8px 0' }}>
          <div style={{ fontSize: 32, marginBottom: 4 }}>🎉</div>
          <h4 style={{ color: headingColor, marginBottom: 4 }}>Thank You!</h4>
          <p style={{ color: secondaryText, fontSize: 14 }}>Your feedback helps us improve.</p>
        </div>
      ) : (
        <>
          <h4 style={{ color: headingColor, marginBottom: 4 }}>Rate Your Experience</h4>
          <p style={{ color: secondaryText, fontSize: 13, marginBottom: 12 }}>
            {userRating !== null ? 'Update your rating below' : 'Help us improve – rate our app!'}
          </p>

          <div style={{ display: 'flex', justifyContent: 'center', gap: 8, marginBottom: 12 }}>
            {[1, 2, 3, 4, 5].map((star) => (
              <span
                key={star}
                style={{
                  fontSize: 36,
                  cursor: 'pointer',
                  color: (hoveredStar || stars) >= star ? '#FFD700' : '#ddd',
                  transition: 'transform 0.15s, color 0.15s',
                  transform: (hoveredStar || stars) >= star ? 'scale(1.1)' : 'scale(1)'
                }}
                onMouseEnter={() => setHoveredStar(star)}
                onMouseLeave={() => setHoveredStar(0)}
                onClick={() => setStars(star)}
              >
                ★
              </span>
            ))}
          </div>

          {stars > 0 && (
            <>
              <div style={{ marginBottom: 10 }}>
                <input
                  type="text"
                  placeholder="Your name (optional)"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  style={{
                    width: '100%',
                    maxWidth: 300,
                    padding: '8px 12px',
                    borderRadius: 8,
                    border: `1px solid ${darkMode ? '#444' : '#ddd'}`,
                    background: darkMode ? '#1a1a2e' : 'white',
                    color: textColor,
                    fontSize: 14,
                    outline: 'none'
                  }}
                />
              </div>
              <div style={{ marginBottom: 12 }}>
                <textarea
                  placeholder="Any suggestions? (optional)"
                  value={feedback}
                  onChange={(e) => setFeedback(e.target.value)}
                  rows="2"
                  style={{
                    width: '100%',
                    maxWidth: 400,
                    padding: '8px 12px',
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
              <button
                onClick={handleSubmit}
                disabled={submitting}
                style={{
                  padding: '8px 24px',
                  background: '#1e3c72',
                  color: 'white',
                  border: 'none',
                  borderRadius: 30,
                  cursor: 'pointer',
                  fontWeight: 'bold',
                  fontSize: 14,
                  opacity: submitting ? 0.7 : 1
                }}
              >
                {submitting ? 'Submitting...' : 'Submit Rating'}
              </button>
            </>
          )}
        </>
      )}
    </div>
  );
};

export default RateUsWidget;