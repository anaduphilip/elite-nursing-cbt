// src/utils/quizHelpers.js
import axios from 'axios';   // ← ADD THIS

// Module-level cache for quizzes
let globalQuizzesCache = null;
let globalQuizzesPromise = null;

export async function getCachedQuizzes(token) {
  if (globalQuizzesCache) return globalQuizzesCache;
  if (globalQuizzesPromise) return await globalQuizzesPromise;
  
  globalQuizzesPromise = (async () => {
    const res = await axios.get('/api/quizzes', { headers: { Authorization: `Bearer ${token}` } });
    globalQuizzesCache = res.data;
    globalQuizzesPromise = null;
    return globalQuizzesCache;
  })();
  
  return await globalQuizzesPromise;
}

// Helper functions for exam history (permanent storage)
export const saveExamAttempt = (quizId, title, category, topic, answers, score, total, percentage, isPremium = false) => {
  const attempts = JSON.parse(localStorage.getItem('exam_attempts') || '{}');
  attempts[quizId] = {
    title,
    category,
    topic,
    answers,
    score,
    total,
    percentage,
    isPremium,
    completedAt: new Date().toISOString()
  };
  localStorage.setItem('exam_attempts', JSON.stringify(attempts));
};

export const getAllAttempts = () => JSON.parse(localStorage.getItem('exam_attempts') || '{}');
export const getExamAttempt = (quizId) => getAllAttempts()[quizId] || null;
export const clearAllAttempts = () => localStorage.removeItem('exam_attempts');