// src/routes/pre-council.js
const express = require('express');
const { PreCouncilCategory, PreCouncilPaper, PreCouncilExam, User } = require('../models');
const { authenticate } = require('../middleware');
const { checkAndAwardBadges } = require('../utils');

const router = express.Router();

// Get all active categories
router.get('/categories', async (req, res) => {
  try {
    const categories = await PreCouncilCategory.find({ active: true }).sort({ order: 1 });
    res.json({ success: true, categories });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch categories' });
  }
});

// Get papers for a category
router.get('/categories/:categoryId/papers', async (req, res) => {
  try {
    const papers = await PreCouncilPaper.find({ categoryId: req.params.categoryId, active: true }).sort({ order: 1 });
    res.json({ success: true, papers });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch papers' });
  }
});

// Get exams for a paper (only active ones)
router.get('/papers/:paperId/exams', authenticate, async (req, res) => {
  try {
    const exams = await PreCouncilExam.find({ paperId: req.params.paperId, isActive: true }).sort({ order: 1 });
    res.json({ success: true, exams });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch exams' });
  }
});

// ===== Get all exams (for caching) with ?all=true =====
router.get('/exams', authenticate, async (req, res) => {
  try {
    if (req.query.all === 'true') {
      const exams = await PreCouncilExam.find({ isActive: true })
        .populate({
          path: 'paperId',
          select: 'name categoryId',
          populate: { path: 'categoryId', select: 'name slug' }
        })
        .lean();
      return res.json({ success: true, exams });
    }
    return res.status(400).json({ error: 'Missing paperId or all flag' });
  } catch (error) {
    console.error('Failed to fetch exams:', error);
    res.status(500).json({ error: 'Failed to fetch exams' });
  }
});

// Get a single exam
router.get('/exams/:examId', authenticate, async (req, res) => {
  try {
    const exam = await PreCouncilExam.findById(req.params.examId);
    if (!exam) return res.status(404).json({ error: 'Exam not found' });
    res.json({ success: true, exam });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch exam' });
  }
});

// ===== UPDATED: Submit Pre Council exam result =====
router.post('/exams/:examId/submit', authenticate, async (req, res) => {
  try {
    // Populate paper and its category
    const exam = await PreCouncilExam.findById(req.params.examId)
      .populate({
        path: 'paperId',
        populate: { path: 'categoryId' }
      });

    if (!exam) return res.status(404).json({ error: 'Exam not found' });

    const { answers } = req.body;
    let score = 0, total = 0;
    exam.questions.forEach((q, i) => {
      total += q.points || 1;
      if (answers[i] === q.correctAnswer) score += q.points || 1;
    });
    const percentage = (score / total) * 100;
    const passed = percentage >= 70;

    const user = await User.findById(req.user._id);
    if (user) {
      const sectionNumber = exam.order || 1;
      const isPremiumExam = sectionNumber > 1;

      // Extract paper name and category slug
      const paperName = exam.paperId?.name || 'Pre Council';
      const categorySlug = exam.paperId?.categoryId?.slug || 'pre-council';

      // Store full attempt with correct category slug and paper name
      user.quizResults.push({
        quizId: `precouncil_${exam._id}`,
        title: exam.title,
        category: categorySlug,          
        topic: paperName,                
        score: score,
        total: total,
        percentage: percentage,
        date: new Date(),
        answers: answers,
        questions: exam.questions,
        isPremium: isPremiumExam,
        isPreCouncil: true,
        sectionNumber: sectionNumber,
        paperName: paperName,
        categoryName: exam.paperId?.categoryId?.name
      });

      await user.save();
      console.log(`✅ PreCouncil result saved for ${user.email}: ${score}/${total} (${categorySlug} → ${paperName})`);
    }

    try {
      await checkAndAwardBadges(req.user._id);
    } catch (e) { console.error('Gamification error:', e); }

    res.json({ score, total, percentage, passed });
  } catch (error) {
    console.error('Pre Council submit error:', error);
    res.status(400).json({ error: error.message });
  }
});

module.exports = router;