// src/utils/quizHelpers.js
import axios from 'axios';

// ---------- Quiz Cache ----------
let globalQuizzesCache = null;
let globalQuizzesPromise = null;

export async function getCachedQuizzes(token) {
  if (!token || token === 'undefined' || token === 'null') {
    console.warn('⚠️ getCachedQuizzes called with invalid token:', token);
    return null;
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
export const saveExamAttempt = (
  quizId,
  title,
  category,
  topic,
  answers,
  score,
  total,
  percentage,
  isPremium = false,
  isPreCouncil = false,
  sectionNumber = null,
  categoryName = null,
  questions = null
) => {
  const attempts = JSON.parse(localStorage.getItem('exam_attempts') || '{}');
  attempts[quizId] = {
    quizId,
    title,
    category,
    topic,
    answers,
    score,
    total,
    percentage,
    isPremium,
    isPreCouncil,
    sectionNumber,
    categoryName: categoryName || null,
    questions: questions || [],
    completedAt: new Date().toISOString()
  };
  localStorage.setItem('exam_attempts', JSON.stringify(attempts));
};

export const getAllAttempts = () => JSON.parse(localStorage.getItem('exam_attempts') || '{}');
export const getExamAttempt = (quizId) => getAllAttempts()[quizId] || null;
export const clearAllAttempts = () => localStorage.removeItem('exam_attempts');

// ===== Sync history from server (smart merge) =====
export const syncHistoryFromServer = async (token) => {
  try {
    const res = await axios.get('/api/user/history', {
      headers: { Authorization: `Bearer ${token}` }
    });
    if (res.data.success) {
      const serverHistory = res.data.history || [];
      const existing = JSON.parse(localStorage.getItem('exam_attempts') || '{}');
      const merged = { ...existing };

      serverHistory.forEach((entry) => {
        const key = entry.quizId || `history_${entry._id || Date.now()}`;
        const candidate = {
          quizId: key,
          title: entry.title || entry.quizTitle || 'Exam',
          category: entry.category || 'general',
          topic: entry.topic || 'General',
          score: entry.score || 0,
          total: entry.total || 0,
          percentage: entry.percentage || 0,
          answers: entry.answers || {},
          questions: entry.questions || [],
          completedAt: entry.date || entry.completedAt || new Date().toISOString(),
          isPremium: entry.isPremium || false,
          isPreCouncil: entry.isPreCouncil || false,
          sectionNumber: entry.sectionNumber || null,
          categoryName: entry.categoryName || null,
          paperName: entry.paperName || null
        };

        if (merged[key]) {
          const local = merged[key];
          // Preserve local topic if server has "General" or empty
          if (local.topic && local.topic !== 'General' && (!candidate.topic || candidate.topic === 'General')) {
            candidate.topic = local.topic;
          }
          // Preserve local categoryName if server doesn't have it
          if (local.categoryName && !candidate.categoryName) {
            candidate.categoryName = local.categoryName;
          }
          if (local.paperName && !candidate.paperName) {
            candidate.paperName = local.paperName;
          }
          // Preserve local isPreCouncil and sectionNumber if server missing
          if (local.isPreCouncil !== undefined && candidate.isPreCouncil === undefined) {
            candidate.isPreCouncil = local.isPreCouncil;
          }
          if (local.sectionNumber !== undefined && candidate.sectionNumber === undefined) {
            candidate.sectionNumber = local.sectionNumber;
          }
        }

        merged[key] = candidate;
      });

      localStorage.setItem('exam_attempts', JSON.stringify(merged));
      return merged;
    }
  } catch (error) {
    console.error('Failed to sync history:', error);
  }
};

// ===== Clear local history (on logout) =====
export const clearLocalHistory = () => {
  localStorage.removeItem('exam_attempts');
};