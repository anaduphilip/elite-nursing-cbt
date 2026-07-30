// src/routes/admin-weekly-quiz.js
const express = require('express');
const { WeeklyQuiz, WeeklyQuizAttempt } = require('../models');
const { isAdmin } = require('../middleware');

const router = express.Router();

// Get all weekly quizzes
router.get('/', isAdmin, async (req, res) => {
  try {
    const quizzes = await WeeklyQuiz.find().sort({ createdAt: -1 });
    res.json(quizzes);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch quizzes' });
  }
});

// Create weekly quiz
router.post('/', isAdmin, async (req, res) => {
  try {
    const { title, description, instructions, weekNumber, questions, passingScore, timeLimit, startDate, endDate, isActive, isPremium } = req.body;
    const quiz = new WeeklyQuiz({
      title,
      description,
      instructions: instructions || '',
      weekNumber,
      questions,
      passingScore: passingScore || 70,
      timeLimit: timeLimit || 20,
      startDate: startDate ? new Date(startDate) : null,
      endDate: endDate ? new Date(endDate) : null,
      isActive: isActive || false,
      isPremium: isPremium || false,
      publishedAt: isActive ? new Date() : null
    });
    await quiz.save();
    res.json({ success: true, quiz });
  } catch (error) {
    console.error('Error creating weekly quiz:', error);
    res.status(500).json({ error: 'Failed to create quiz' });
  }
});

// Toggle publish status
router.post('/:id/toggle-publish', isAdmin, async (req, res) => {
  try {
    const { isActive } = req.body;
    const quiz = await WeeklyQuiz.findById(req.params.id);
    if (!quiz) return res.status(404).json({ error: 'Quiz not found' });
    quiz.isActive = isActive;
    quiz.publishedAt = isActive ? new Date() : null;
    await quiz.save();
    res.json({ success: true, quiz });
  } catch (error) {
    res.status(500).json({ error: 'Failed to toggle publish status' });
  }
});

// Toggle premium status
router.post('/:id/toggle-premium', isAdmin, async (req, res) => {
  try {
    const { isPremium } = req.body;
    const quiz = await WeeklyQuiz.findById(req.params.id);
    if (!quiz) return res.status(404).json({ error: 'Quiz not found' });
    quiz.isPremium = isPremium;
    await quiz.save();
    res.json({ success: true, quiz });
  } catch (error) {
    res.status(500).json({ error: 'Failed to toggle premium status' });
  }
});

// Update quiz
router.put('/:id', isAdmin, async (req, res) => {
  try {
    const updateData = { ...req.body };
    if (updateData.isActive === true) {
      updateData.publishedAt = new Date();
    }
    const quiz = await WeeklyQuiz.findByIdAndUpdate(req.params.id, updateData, { new: true });
    if (!quiz) return res.status(404).json({ error: 'Quiz not found' });
    res.json({ success: true, quiz });
  } catch (error) {
    console.error('Update quiz error:', error);
    res.status(500).json({ error: 'Failed to update quiz' });
  }
});

// Delete quiz
router.delete('/:id', isAdmin, async (req, res) => {
  try {
    await WeeklyQuiz.findByIdAndDelete(req.params.id);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete quiz' });
  }
});

// Get results for a quiz
router.get('/:id/results', isAdmin, async (req, res) => {
  try {
    const attempts = await WeeklyQuizAttempt.find({ weeklyQuizId: req.params.id })
      .populate('userId', 'name email')
      .sort({ score: -1 });
    res.json(attempts);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch results' });
  }
});

module.exports = router;