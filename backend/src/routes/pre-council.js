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

// Submit Pre Council exam result (no going back)
router.post('/exams/:examId/submit', authenticate, async (req, res) => {
  try {
    const exam = await PreCouncilExam.findById(req.params.examId);
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
      user.quizResults.push({
        quizId: `precouncil_${exam._id}`,
        score,
        total,
        percentage,
        date: new Date()
      });
      await user.save();
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