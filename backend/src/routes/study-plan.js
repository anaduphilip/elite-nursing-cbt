// src/routes/study-plan.js
const express = require('express');
const { authenticate } = require('../middleware');
const { User, Quiz } = require('../models');

const router = express.Router();

// Helper: get user quiz averages
const getUserQuizAverages = async (userId) => {
  const user = await User.findById(userId).populate('quizResults.quizId');
  if (!user) return {};
  const quizScores = {};
  for (const result of user.quizResults) {
    const quizId = result.quizId?.toString();
    if (!quizId) continue;
    if (!quizScores[quizId]) quizScores[quizId] = { scores: [], total: 0, count: 0 };
    quizScores[quizId].scores.push(result.percentage);
    quizScores[quizId].total += result.percentage;
    quizScores[quizId].count++;
  }
  const averages = {};
  for (const [quizId, data] of Object.entries(quizScores)) {
    averages[quizId] = data.total / data.count;
  }
  return averages;
};

// GET /api/study-plan/status
router.get('/status', authenticate, async (req, res) => {
  try {
    const user = req.user;
    const isPremium = user.isPremium;
    const lastGenerated = user.lastStudyPlanGenerated;
    let canGenerate = true;
    let message = 'You can generate a new study plan.';
    if (!isPremium && lastGenerated) {
      const oneWeek = 7 * 24 * 60 * 60 * 1000;
      const diff = Date.now() - lastGenerated.getTime();
      if (diff < oneWeek) {
        const remaining = oneWeek - diff;
        const days = Math.floor(remaining / (24 * 60 * 60 * 1000));
        const hours = Math.floor((remaining % (24 * 60 * 60 * 1000)) / (60 * 60 * 1000));
        canGenerate = false;
        message = `Free users can generate one plan per week. You can generate again in ${days}d ${hours}h.`;
      }
    }
    res.json({ canGenerate, message, isPremium, hasPlan: !!user.studyPlan?.questions?.length });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/study-plan/current
router.get('/current', authenticate, async (req, res) => {
  try {
    const user = req.user;
    if (!user.studyPlan || !user.studyPlan.questions.length) {
      return res.json({ success: true, plan: null });
    }
    res.json({ success: true, plan: user.studyPlan });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/study-plan/generate
router.post('/generate', authenticate, async (req, res) => {
  try {
    const user = req.user;
    const isPremium = user.isPremium;
    const lastGenerated = user.lastStudyPlanGenerated;
    if (!isPremium && lastGenerated) {
      const oneWeek = 7 * 24 * 60 * 60 * 1000;
      const diff = Date.now() - lastGenerated.getTime();
      if (diff < oneWeek) {
        return res.status(403).json({ error: 'Free users can generate one plan per week. Upgrade to Premium for unlimited.' });
      }
    }

    const averages = await getUserQuizAverages(user._id);
    if (Object.keys(averages).length === 0) {
      return res.status(400).json({ error: 'You haven\'t taken enough quizzes to generate a study plan. Take more exams first.' });
    }

    const sortedQuizzes = Object.entries(averages).sort((a, b) => a[1] - b[1]);
    const weakQuizIds = sortedQuizzes.slice(0, Math.min(3, sortedQuizzes.length)).map(([id]) => id);
    const quizzes = await Quiz.find({ _id: { $in: weakQuizIds } });
    if (quizzes.length === 0) {
      return res.status(400).json({ error: 'No quizzes found for your weak areas.' });
    }

    const totalQuestions = isPremium ? 25 : 10;
    const questionsPerQuiz = Math.floor(totalQuestions / quizzes.length);
    const extra = totalQuestions % quizzes.length;

    let selectedQuestions = [];
    for (let i = 0; i < quizzes.length; i++) {
      const quiz = quizzes[i];
      const qCount = questionsPerQuiz + (i < extra ? 1 : 0);
      const shuffled = quiz.questions.sort(() => 0.5 - Math.random());
      const picked = shuffled.slice(0, Math.min(qCount, shuffled.length));
      picked.forEach(q => {
        selectedQuestions.push({
          ...q.toObject(),
          quizId: quiz._id,
          userAnswer: null
        });
      });
    }

    if (selectedQuestions.length < totalQuestions) {
      const strongQuizIds = sortedQuizzes.slice(Math.min(3, sortedQuizzes.length)).map(([id]) => id);
      if (strongQuizIds.length) {
        const strongQuizzes = await Quiz.find({ _id: { $in: strongQuizIds } });
        const remaining = totalQuestions - selectedQuestions.length;
        const allQuestions = [];
        strongQuizzes.forEach(q => {
          q.questions.forEach(qq => {
            allQuestions.push({ ...qq.toObject(), quizId: q._id });
          });
        });
        const shuffledStrong = allQuestions.sort(() => 0.5 - Math.random());
        const pickedStrong = shuffledStrong.slice(0, remaining);
        selectedQuestions = selectedQuestions.concat(pickedStrong);
      }
    }

    user.studyPlan = {
      generatedAt: new Date(),
      questions: selectedQuestions,
      completed: false,
      score: null,
      total: selectedQuestions.length
    };
    user.lastStudyPlanGenerated = new Date();
    await user.save();

    res.json({
      success: true,
      plan: user.studyPlan,
      message: `Study plan generated with ${selectedQuestions.length} questions.`
    });
  } catch (error) {
    console.error('Study plan generation error:', error);
    res.status(500).json({ error: error.message });
  }
});

// POST /api/study-plan/submit
router.post('/submit', authenticate, async (req, res) => {
  try {
    const user = req.user;
    const { answers } = req.body;
    if (!user.studyPlan || !user.studyPlan.questions.length) {
      return res.status(400).json({ error: 'No active study plan.' });
    }
    if (user.studyPlan.completed) {
      return res.status(400).json({ error: 'This study plan has already been completed.' });
    }
    const plan = user.studyPlan;
    const questions = plan.questions;
    if (answers.length !== questions.length) {
      return res.status(400).json({ error: 'Please answer all questions.' });
    }
    let score = 0;
    for (let i = 0; i < questions.length; i++) {
      const q = questions[i];
      const userAns = answers[i];
      if (userAns === undefined || userAns === null) {
        return res.status(400).json({ error: 'Please answer all questions.' });
      }
      q.userAnswer = userAns;
      if (userAns === q.correctAnswer) {
        score++;
      }
    }
    plan.completed = true;
    plan.score = score;
    await user.save();
    res.json({
      success: true,
      score,
      total: questions.length,
      percentage: ((score / questions.length) * 100).toFixed(1),
      passed: score / questions.length >= 0.7
    });
  } catch (error) {
    console.error('Submit study plan error:', error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;