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

    // Build a set of questions that have been PASSED in previous plans
    const passedKeys = new Set();
    if (user.reviewedQuestions && user.reviewedQuestions.length > 0) {
      user.reviewedQuestions.forEach(r => {
        if (r.passed && r.quizId && r.questionIndex !== undefined) {
          passedKeys.add(`${r.quizId}|${r.questionIndex}`);
        }
      });
    }

    // ----- COLLECT ALL UNPASSED WRONG QUESTIONS FROM ALL EXAMS -----
    let allWrongQuestions = [];

    for (const result of user.quizResults) {
      const quizId = result.quizId?.toString();
      if (!quizId) continue;

      const examQuestions = await fetchQuestions(quizId);
      if (!examQuestions || examQuestions.length === 0) continue;

      const userAnswers = result.answers || {};

      for (let i = 0; i < examQuestions.length; i++) {
        const q = examQuestions[i];
        // If user answered and got it wrong
        if (userAnswers[i] !== undefined && userAnswers[i] !== q.correctAnswer) {
          const key = `${quizId}|${i}`;
          // Exclude only if it has been PASSED before
          if (!passedKeys.has(key)) {
            allWrongQuestions.push({
              ...(q.toObject ? q.toObject() : q),
              quizId: quizId,
              userAnswer: null,
              questionIndex: i
            });
          }
        }
      }
    }

    if (allWrongQuestions.length === 0) {
      return res.status(400).json({
        error: 'No new wrong questions to review. You\'ve passed all your previously wrong questions – keep practicing new exams!'
      });
    }

    // Shuffle and limit
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
      message: `Study plan generated with ${selectedQuestions.length} questions (only unpassed wrong answers).`
    });
  } catch (error) {
    console.error('Study plan generation error:', error);
    res.status(500).json({ error: error.message });
  }
});

// ===== POST /api/study-plan/submit (FIXED) =====
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
    let reviewed = (user.reviewedQuestions || []).filter(r => r.quizId && r.questionIndex !== undefined && r.questionIndex !== null);

    // ---- Category stats and question details for feedback ----
    const categoryStats = {};
    const questionDetails = [];

    for (let i = 0; i < questions.length; i++) {
      const q = questions[i];
      const userAns = answers[i];
      if (userAns === undefined || userAns === null) {
        return res.status(400).json({ error: 'Please answer all questions.' });
      }
      q.userAnswer = userAns;
      const isCorrect = (userAns === q.correctAnswer);

      if (isCorrect) {
        score++;
        // If we have a valid questionIndex, update reviewedQuestions
        if (q.quizId && q.questionIndex !== undefined && q.questionIndex !== null) {
          const existingIndex = reviewed.findIndex(r => r.quizId === q.quizId && r.questionIndex === q.questionIndex);
          if (existingIndex !== -1) {
            reviewed[existingIndex].passed = true;
          } else {
            reviewed.push({
              quizId: q.quizId,
              questionIndex: q.questionIndex,
              passed: true
            });
          }
        }
        // If no questionIndex, we cannot track it – just ignore.
      } else {
        // If incorrect, remove any existing entry for this question (if we have the index)
        if (q.quizId && q.questionIndex !== undefined && q.questionIndex !== null) {
          const existingIndex = reviewed.findIndex(r => r.quizId === q.quizId && r.questionIndex === q.questionIndex);
          if (existingIndex !== -1) {
            reviewed.splice(existingIndex, 1);
          }
        }
      }

      // Track category stats (only if question has a category)
      const category = q.category || 'General';
      if (!categoryStats[category]) {
        categoryStats[category] = { correct: 0, total: 0 };
      }
      categoryStats[category].total++;
      if (isCorrect) {
        categoryStats[category].correct++;
      }

      questionDetails.push({
        questionText: q.questionText,
        isCorrect,
        category
      });
    }

    plan.completed = true;
    plan.score = score;
    user.reviewedQuestions = reviewed;
    await user.save();

    // ---- Build feedback ----
    const percentage = (score / questions.length) * 100;
    const passed = percentage >= 70;

    // Overall message
    let overallMessage = '';
    if (percentage >= 90) {
      overallMessage = '🌟 Excellent work! You\'re mastering these topics brilliantly. Keep up the great momentum!';
    } else if (percentage >= 70) {
      overallMessage = '💪 Great job! You\'ve shown solid understanding. With a bit more focus, you\'ll ace the rest!';
    } else if (percentage >= 50) {
      overallMessage = '📚 You\'re on the right track! Review the questions you missed and try again. You\'ve got this!';
    } else if (percentage >= 30) {
      overallMessage = '🧠 Don\'t give up! Every mistake is a learning opportunity. Focus on understanding the concepts better.';
    } else {
      overallMessage = '💡 Rome wasn\'t built in a day. Take your time to review the material thoroughly, then try again. You can do this!';
    }

    // Category feedback
    const categoryFeedback = {};
    for (const [cat, stats] of Object.entries(categoryStats)) {
      const catPct = (stats.correct / stats.total) * 100;
      let catMessage = '';
      if (catPct >= 80) {
        catMessage = `✅ You're strong in ${cat}! Keep it up.`;
      } else if (catPct >= 60) {
        catMessage = `📖 You have a good grasp of ${cat}. Review the ones you missed for extra confidence.`;
      } else if (catPct >= 40) {
        catMessage = `⚠️ ${cat} needs more attention. Spend some extra time reviewing these concepts.`;
      } else {
        catMessage = `🔴 ${cat} is your weak spot. Focus on studying this topic more thoroughly.`;
      }
      categoryFeedback[cat] = {
        correct: stats.correct,
        total: stats.total,
        percentage: catPct.toFixed(0),
        message: catMessage
      };
    }

    // Weakest/strongest
    const sortedCategories = Object.entries(categoryStats)
      .sort((a, b) => (a[1].correct / a[1].total) - (b[1].correct / b[1].total));
    const weakestCategory = sortedCategories.length > 0 ? sortedCategories[0][0] : null;
    const suggestion = weakestCategory
      ? `🎯 Focus on improving in **${weakestCategory}** – that's your biggest opportunity for growth.`
      : '🎯 Keep practicing to maintain your skills!';

    res.json({
      success: true,
      score,
      total: questions.length,
      percentage: percentage.toFixed(1),
      passed,
      feedback: {
        overallMessage,
        categoryFeedback,
        suggestion,
        strongestCategory: sortedCategories.length > 0 ? sortedCategories[sortedCategories.length - 1][0] : null,
        weakestCategory,
        questionDetails: questionDetails.slice(0, 10)
      }
    });

  } catch (error) {
    console.error('Submit study plan error:', error);
    if (error.name === 'ValidationError') {
      return res.status(400).json({ error: 'Invalid data submitted. Please generate a new study plan and try again.' });
    }
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;