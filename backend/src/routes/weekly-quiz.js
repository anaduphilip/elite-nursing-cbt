// src/routes/weekly-quiz.js
const express = require('express');
const { WeeklyQuiz, WeeklyQuizAttempt, User } = require('../models');
const { authenticate } = require('../middleware');
const { checkAndAwardBadges } = require('../utils');

const router = express.Router();

router.get('/current', authenticate, async (req, res) => {
  try {
    const today = new Date();
    const quiz = await WeeklyQuiz.findOne({
      isActive: true,
      $or: [{ startDate: { $lte: today } }, { startDate: null }],
      $or: [{ endDate: { $gte: today } }, { endDate: null }]
    }).sort({ weekNumber: -1 });

    if (!quiz) {
      return res.json({ success: false, message: 'No active weekly quiz available right now.' });
    }

    const existingAttempt = await WeeklyQuizAttempt.findOne({
      userId: req.user._id,
      weeklyQuizId: quiz._id
    });

    let quizData = quiz.toObject();
    if (existingAttempt) {
      quizData.questions = quizData.questions.map(q => ({ ...q, correctAnswer: undefined }));
      quizData.alreadyAttempted = true;
      quizData.attemptScore = existingAttempt.score;
      quizData.attemptPercentage = existingAttempt.percentage;
      quizData.attemptId = existingAttempt._id;
    } else {
      quizData.alreadyAttempted = false;
    }

    res.json({
      success: true,
      quiz: quizData,
      alreadyAttempted: !!existingAttempt,
      isPremium: quiz.isPremium
    });
  } catch (error) {
    console.error('Error fetching weekly quiz:', error);
    res.status(500).json({ error: 'Failed to fetch weekly quiz' });
  }
});

router.post('/submit', authenticate, async (req, res) => {
  try {
    const { quizId, answers, timeSpent } = req.body;
    if (!quizId) return res.status(400).json({ error: 'Quiz ID required' });

    const existingAttempt = await WeeklyQuizAttempt.findOne({
      userId: req.user._id,
      weeklyQuizId: quizId
    });
    if (existingAttempt) {
      return res.status(400).json({ error: 'You have already attempted this weekly quiz.' });
    }

    const quiz = await WeeklyQuiz.findById(quizId);
    if (!quiz) return res.status(404).json({ error: 'Quiz not found' });

    const now = new Date();
    if (!quiz.isActive) return res.status(400).json({ error: 'This quiz is no longer available.' });
    if (quiz.startDate && quiz.startDate > now) {
      return res.status(400).json({ error: 'This quiz has not started yet.' });
    }
    if (quiz.endDate && quiz.endDate < now) {
      return res.status(400).json({ error: 'This quiz has already expired.' });
    }

    let score = 0, total = 0;
    quiz.questions.forEach((q, index) => {
      total += q.points || 1;
      if (answers[index] !== undefined && answers[index] === q.correctAnswer) {
        score += q.points || 1;
      }
    });

    const percentage = (score / total) * 100;
    const passed = percentage >= (quiz.passingScore || 70);

    const attempt = new WeeklyQuizAttempt({
      userId: req.user._id,
      weeklyQuizId: quizId,
      answers,
      score,
      total,
      percentage,
      passed,
      completedAt: new Date(),
      timeSpent: timeSpent || 0
    });
    await attempt.save();

    try {
      const gamificationResult = await checkAndAwardBadges(req.user._id);
      console.log(`🏆 GAMIFICATION (weekly quiz): ${gamificationResult.awarded?.length || 0} badges awarded`);
    } catch (e) {
      console.error('Gamification error:', e);
    }

    res.json({
      success: true,
      score,
      total,
      percentage: percentage.toFixed(1),
      passed
    });
  } catch (error) {
    console.error('Error submitting weekly quiz:', error);
    res.status(500).json({ error: 'Failed to submit weekly quiz' });
  }
});

router.get('/history', authenticate, async (req, res) => {
  try {
    const attempts = await WeeklyQuizAttempt.find({ userId: req.user._id })
      .sort({ completedAt: -1 })
      .populate('weeklyQuizId', 'title weekNumber');
    res.json({ success: true, attempts });
  } catch (error) {
    console.error('Error fetching weekly quiz history:', error);
    res.status(500).json({ error: 'Failed to fetch history' });
  }
});

router.get('/:quizId/leaderboard', authenticate, async (req, res) => {
  try {
    const { quizId } = req.params;
    let query = {};
    if (quizId === 'current') {
      const activeQuiz = await WeeklyQuiz.findOne({
        isActive: true,
        startDate: { $lte: new Date() },
        $or: [{ endDate: { $gte: new Date() } }, { endDate: null }]
      });
      if (!activeQuiz) return res.status(404).json({ error: 'No active quiz' });
      query = { weeklyQuizId: activeQuiz._id };
    } else {
      query = { weeklyQuizId: quizId };
    }
    const attempts = await WeeklyQuizAttempt.find(query)
      .populate('userId', 'name email')
      .sort({ score: -1, percentage: -1 });
    res.json({ success: true, attempts });
  } catch (error) {
    console.error('Leaderboard error:', error);
    res.status(500).json({ error: 'Failed to fetch leaderboard' });
  }
});

// ===== NEW: GET /api/weekly-quiz/attempt/:attemptId =====
router.get('/attempt/:attemptId', authenticate, async (req, res) => {
  try {
    const attempt = await WeeklyQuizAttempt.findOne({
      _id: req.params.attemptId,
      userId: req.user._id
    }).populate('weeklyQuizId', 'title questions');

    if (!attempt) {
      return res.status(404).json({ error: 'Attempt not found' });
    }

    res.json({
      success: true,
      attempt: {
        score: attempt.score,
        total: attempt.total,
        percentage: attempt.percentage,
        passed: attempt.passed,
        answers: attempt.answers,
        questions: attempt.weeklyQuizId.questions,
        quizTitle: attempt.weeklyQuizId.title,
        completedAt: attempt.completedAt
      }
    });
  } catch (error) {
    console.error('Error fetching attempt:', error);
    res.status(500).json({ error: 'Failed to fetch attempt' });
  }
});

module.exports = router;