// src/utils/ratingHelpers.js
import axios from 'axios';

export const checkRatingPrompt = async (token) => {
  try {
    const res = await axios.get('/api/ratings/check', {
      headers: { Authorization: `Bearer ${token}` }
    });
    return res.data.shouldShow;
  } catch (err) {
    console.error('Rating check error:', err);
    return false;
  }
};