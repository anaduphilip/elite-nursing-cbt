// src/utils/quizHelpers.js
import axios from 'axios';

// ---------- Quiz Cache ----------
let globalQuizzesCache = null;
let globalQuizzesPromise = null;

export async function getCachedQuizzes(token) {
  // 🔧 GUARD: Reject invalid token
  if (!token || token === 'undefined' || token === 'null') {
    console.warn('⚠️ getCachedQuizzes called with invalid token:', token);
    return null; // Return null so components can handle it
  }

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
    const categories = (res.data.categories || [])
      .sort((a, b) => (a.order || 0) - (b.order || 0));
    globalCategoriesCache = categories;
    globalCategoriesPromise = null;
    return globalCategoriesCache;
  })();
  
  return await globalCategoriesPromise;
}

export const hasCachedCategories = () => globalCategoriesCache !== null;

// ---------- Pre-Council Exam Cache ----------
let globalPreCouncilExamsCache = null;
let globalPreCouncilExamsPromise = null;

export async function getCachedPreCouncilExams(token) {
  // 🔧 GUARD: Reject invalid token
  if (!token || token === 'undefined' || token === 'null') {
    console.warn('⚠️ getCachedPreCouncilExams called with invalid token:', token);
    return null;
  }

  if (globalPreCouncilExamsCache) return globalPreCouncilExamsCache;
  if (globalPreCouncilExamsPromise) return await globalPreCouncilExamsPromise;
  
  globalPreCouncilExamsPromise = (async () => {
    const res = await axios.get('/api/pre-council/exams', {
      params: { all: true },
      headers: { Authorization: `Bearer ${token}` }
    });
    // Assuming the response has { success: true, exams: [...] }
    globalPreCouncilExamsCache = res.data.exams || [];
    globalPreCouncilExamsPromise = null;
    return globalPreCouncilExamsCache;
  })();
  
  return await globalPreCouncilExamsPromise;
}

export async function getCachedPreCouncilExam(examId, token) {
  const exams = await getCachedPreCouncilExams(token);
  return exams ? exams.find(e => e._id === examId) : null;
}

export const hasCachedPreCouncilExams = () => globalPreCouncilExamsCache !== null;

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