// src/routes/study-plan.js
const express = require('express');
const mongoose = require('mongoose');
const { authenticate } = require('../middleware');
const { User, Quiz, PreCouncilExam } = require('../models');

const router = express.Router();

// ===== Helper: Fetch questions from a quiz/exam by its ID =====
const fetchQuestions = async (id) => {
  if (mongoose.Types.ObjectId.isValid(id)) {
    const quiz = await Quiz.findById(id);
    return quiz ? quiz.questions : [];
  }
  if (typeof id === 'string' && id.startsWith('precouncil_')) {
    const examId = id.replace('precouncil_', '');
    const exam = await PreCouncilExam.findById(examId);
    return exam ? exam.questions : [];
  }
  return [];
};

// ===== GET /api/study-plan/status =====
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

// ===== GET /api/study-plan/current =====
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

// ===== POST /api/study-plan/generate =====
router.post('/generate', authenticate, async (req, res) => {
  try {
    const user = req.user;
    const isPremium = user.isPremium;

    // Free users: one plan per week
    const lastGenerated = user.lastStudyPlanGenerated;
    if (!isPremium && lastGenerated) {
      const oneWeek = 7 * 24 * 60 * 60 * 1000;
      const diff = Date.now() - lastGenerated.getTime();
      if (diff < oneWeek) {
        return res.status(403).json({ error: 'Free users can generate one plan per week. Upgrade to Premium for unlimited.' });
      }
    }

    // Check if user has taken any exams
    if (!user.quizResults || user.quizResults.length === 0) {
      return res.status(400).json({ error: 'You haven\'t taken any exams yet. Take some exams first to generate a study plan.' });
    }

    // ----- COLLECT ALL WRONG QUESTIONS FROM ALL EXAMS -----
    let allWrongQuestions = [];

    for (const result of user.quizResults) {
      const quizId = result.quizId?.toString();
      if (!quizId) continue;

      // Fetch the exam questions (from Quiz or PreCouncil)
      const examQuestions = await fetchQuestions(quizId);
      if (!examQuestions || examQuestions.length === 0) continue;

      // Get user's answers for this exam
      const userAnswers = result.answers || {};

      // Compare each question with user's answer
      for (let i = 0; i < examQuestions.length; i++) {
        const q = examQuestions[i];
        // If the user answered this question AND it's wrong
        if (userAnswers[i] !== undefined && userAnswers[i] !== q.correctAnswer) {
          allWrongQuestions.push({
            ...(q.toObject ? q.toObject() : q),
            quizId: quizId,
            userAnswer: userAnswers[i] || null
          });
        }
      }
    }

    if (allWrongQuestions.length === 0) {
      return res.status(400).json({ error: 'You have no wrong answers yet! Keep studying and take more exams.' });
    }

    // Shuffle and limit to max questions
    const shuffled = allWrongQuestions.sort(() => 0.5 - Math.random());
    const maxQuestions = isPremium ? 25 : 10;
    const selectedQuestions = shuffled.slice(0, Math.min(maxQuestions, shuffled.length));

    // Save the study plan
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
      message: `Study plan generated with ${selectedQuestions.length} questions (all from your wrong answers).`
    });
  } catch (error) {
    console.error('Study plan generation error:', error);
    res.status(500).json({ error: error.message });
  }
});

// ===== POST /api/study-plan/submit =====
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