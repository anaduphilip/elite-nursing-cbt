// src/routes/premium.js
const express = require('express');
const { User } = require('../models');
const { authenticate } = require('../middleware');
const { checkAndAwardBadges } = require('../utils');

const router = express.Router();

// Premium exam submission (matches original monolithic path)
router.post('/premium-exam/submit', authenticate, async (req, res) => {
  try {
    console.log('📝 Premium exam submission received for user:', req.user._id);
    const { category, topic, examId, answers, score, total, percentage, questions } = req.body;

    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const quizId = `premium-${category}-${topic}-${examId}`;
    const title = `${category} - ${topic} - Exam ${examId}`;

    // Store full attempt
    user.quizResults.push({
      quizId: quizId,
      title: title,
      category: category,
      topic: topic,
      score: score,
      total: total,
      percentage: percentage,
      date: new Date(),
      answers: answers || {},
      questions: questions || [],
      isPremium: true,
      isPreCouncil: false,
      sectionNumber: null
    });

    await user.save();
    console.log(`✅ Premium exam saved for ${user.email}: ${score}/${total}`);

    // Gamification
    try {
      const gamificationResult = await checkAndAwardBadges(user._id);
      console.log(`🏆 GAMIFICATION (premium exam): ${gamificationResult.awarded?.length || 0} badges awarded`);
    } catch (gamificationError) {
      console.error('Gamification check error:', gamificationError);
    }

    res.json({ success: true, message: 'Premium exam result saved' });
  } catch (error) {
    console.error('❌ Premium exam submission error:', error);
    res.status(500).json({ error: 'Failed to save premium exam result' });
  }
});

module.exports = router;