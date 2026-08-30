// src/components/rating/FeedbackList.jsx
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import FeedbackItem from './FeedbackItem';

const FeedbackList = ({
  darkMode,
  headingColor,
  textColor,
  secondaryText,
  cardBg,
  token
}) => {
  const [feedbacks, setFeedbacks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchFeedbacks = async () => {
    try {
      setLoading(true);
      const res = await axios.get('/api/ratings/latest');
      if (res.data.success) {
        setFeedbacks(res.data.ratings || []);
      }
    } catch (err) {
      console.error('Fetch feedbacks error:', err);
      setError('Failed to load feedbacks.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFeedbacks();
  }, []);

  if (loading) return null; // no loading text

  if (error) {
    return (
      <div style={{ textAlign: 'center', padding: 20, color: '#dc3545' }}>
        {error}
      </div>
    );
  }

  if (feedbacks.length === 0) {
    return (
      <div style={{ textAlign: 'center', padding: 20, color: secondaryText }}>
        No feedback yet. Be the first to share your experience!
      </div>
    );
  }

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      gap: 16,
      marginTop: 12
    }}>
      {feedbacks
        .filter(fb => fb && fb._id)
        .map((fb) => (
          <FeedbackItem
            key={fb._id}
            feedback={fb}
            darkMode={darkMode}
            headingColor={headingColor}
            textColor={textColor}
            secondaryText={secondaryText}
            cardBg={cardBg}
            token={token}
          />
        ))}
    </div>
  );
};

export default FeedbackList;