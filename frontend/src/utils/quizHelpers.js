// src/utils/quizHelpers.js
import axios from 'axios';

// ---------- Quiz Cache ----------
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

export const hasCachedQuizzes = () => globalQuizzesCache !== null;

// ---------- Category Cache ----------
let globalCategoriesCache = null;
let globalCategoriesPromise = null;

export async function getCachedCategories() {
  if (globalCategoriesCache) return globalCategoriesCache;
  if (globalCategoriesPromise) return await globalCategoriesPromise;
  
  globalCategoriesPromise = (async () => {
    const res = await axios.get('/api/categories');
    // Sort categories by the 'order' field from MongoDB (ascending)
    // This ensures categories appear in the order set in the Admin Panel
    const categories = (res.data.categories || [])
      .sort((a, b) => (a.order || 0) - (b.order || 0));
    globalCategoriesCache = categories;
    globalCategoriesPromise = null;
    return globalCategoriesCache;
  })();
  
  return await globalCategoriesPromise;
}

export const hasCachedCategories = () => globalCategoriesCache !== null;

// ---------- Exam History Helpers ----------
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