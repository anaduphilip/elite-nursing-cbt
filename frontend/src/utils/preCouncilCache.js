// src/utils/preCouncilCache.js
import axios from 'axios';

// Module-level caches
let categoriesCache = null;
let categoriesPromise = null;
const papersCache = {};
const examsCache = {};

export async function getCachedCategories() {
  if (categoriesCache) return categoriesCache;
  if (categoriesPromise) return await categoriesPromise;

  categoriesPromise = (async () => {
    const res = await axios.get('/api/pre-council/categories');
    categoriesCache = res.data.categories || [];
    categoriesPromise = null;
    return categoriesCache;
  })();

  return await categoriesPromise;
}

export async function getCachedPapers(categoryId) {
  if (papersCache[categoryId]) return papersCache[categoryId];
  
  // We'll use a simple promise to avoid duplicate requests
  if (!papersCache[`${categoryId}_promise`]) {
    papersCache[`${categoryId}_promise`] = (async () => {
      const res = await axios.get(`/api/pre-council/categories/${categoryId}/papers`);
      papersCache[categoryId] = res.data.papers || [];
      delete papersCache[`${categoryId}_promise`];
      return papersCache[categoryId];
    })();
  }
  return await papersCache[`${categoryId}_promise`];
}

export async function getCachedExams(paperId, token) {
  if (examsCache[paperId]) return examsCache[paperId];
  
  if (!examsCache[`${paperId}_promise`]) {
    examsCache[`${paperId}_promise`] = (async () => {
      const res = await axios.get(`/api/pre-council/papers/${paperId}/exams`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      examsCache[paperId] = res.data.exams || [];
      delete examsCache[`${paperId}_promise`];
      return examsCache[paperId];
    })();
  }
  return await examsCache[`${paperId}_promise`];
}

// Optional: clear cache (e.g., after admin updates)
export function clearPreCouncilCache() {
  categoriesCache = null;
  categoriesPromise = null;
  Object.keys(papersCache).forEach(key => delete papersCache[key]);
  Object.keys(examsCache).forEach(key => delete examsCache[key]);
}