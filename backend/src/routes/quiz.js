// src/routes/quiz.js
const express = require('express');
const { Quiz, User } = require('../models');
const { authenticate } = require('../middleware');
const { checkAndAwardBadges, sendMarketingEmail } = require('../utils');

const router = express.Router();

// Get all quizzes
router.get('/', authenticate, async (req, res) => {
  try {
    const quizzes = await Quiz.find();
    res.json(quizzes);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get a single quiz
router.get('/:quizId', authenticate, async (req, res) => {
  try {
    const quiz = await Quiz.findById(req.params.quizId);
    if (!quiz) return res.status(404).json({ error: 'Quiz not found' });
    res.json(quiz);
  } catch (error) {
    res.status(404).json({ error: 'Quiz not found' });
  }
});

// Submit quiz (regular)
router.post('/:quizId/submit', authenticate, async (req, res) => {
  try {
    console.log('📝 Quiz submission started for user:', req.user?._id);
    const quiz = await Quiz.findById(req.params.quizId);
    if (!quiz) {
      console.log('❌ Quiz not found:', req.params.quizId);
      return res.status(404).json({ error: 'Quiz not found' });
    }

    const { answers } = req.body;
    let score = 0, total = 0;
    quiz.questions.forEach((q, i) => {
      total += q.points || 1;
      if (answers[i] === q.correctAnswer) score += q.points || 1;
    });
    const percentage = (score / total) * 100;
    const passed = percentage >= 70;

    console.log(`📊 Score: ${score}/${total} (${percentage}%)`);

    const user = await User.findById(req.user._id);
    console.log('🔍 User found:', user?.email);

    let awardedBadges = [];

    if (user) {
      const resultEntry = {
        quizId: req.params.quizId,
        title: quiz.title,
        category: quiz.category,
        topic: quiz.topic || '',
        score: score,
        total: total,
        percentage: percentage,
        date: new Date(),
        answers: answers,
        questions: quiz.questions,
        isPremium: quiz.isPremium || false,
        isPreCouncil: false,
        sectionNumber: null
      };
      user.quizResults.push(resultEntry);
      await user.save();
      console.log(`✅ After save: ${user.quizResults.length} results`);

      try {
        const gamificationResult = await checkAndAwardBadges(user._id);
        awardedBadges = gamificationResult.awarded || [];
        console.log(`🏆 GAMIFICATION: ${awardedBadges.length} badges awarded`);
      } catch (gamificationError) {
        console.error('Gamification check error:', gamificationError);
      }
    }

    if (user && !user.isPremium && user.marketingConsent) {
      const freeExamsTaken = user.quizResults.length || 0;
      const lastEmailDate = user.lastMarketingEmailSent || new Date(0);
      const daysSinceLast = (Date.now() - lastEmailDate.getTime()) / (1000 * 60 * 60 * 24);
      if (freeExamsTaken >= 3 && daysSinceLast > 7) {
        console.log(`📧 Sending marketing email to ${user.email} (${freeExamsTaken} exams)`);
        sendMarketingEmail(user.email, user.name, 'upgrade')
          .then(sent => {
            if (sent) console.log(`✅ Upgrade email sent to ${user.email}`);
          })
          .catch(err => console.error('Async email error:', err));
        user.lastMarketingEmailSent = new Date();
        await user.save();
      }
    }

    res.json({ score, total, percentage, passed, awardedBadges });
  } catch (error) {
    console.error('❌ Submit error:', error);
    res.status(400).json({ error: error.message });
  }
});

module.exports = router;