// src/routes/study-plan.js
const express = require('express');
const mongoose = require('mongoose');
const { authenticate } = require('../middleware');
const { User, Quiz, PreCouncilExam } = require('../models');

const router = express.Router();

// ===== Helper: Fetch questions from a quiz/exam by its ID =====
const fetchQuestions = async (id) => {
  // If it's a valid ObjectId, treat as regular Quiz
  if (mongoose.Types.ObjectId.isValid(id)) {
    const quiz = await Quiz.findById(id);
    return quiz ? quiz.questions : [];
  }
  // If it starts with "precouncil_", treat as PreCouncil exam
  if (typeof id === 'string' && id.startsWith('precouncil_')) {
    const examId = id.replace('precouncil_', '');
    const exam = await PreCouncilExam.findById(examId);
    return exam ? exam.questions : [];
  }
  return [];
};

// ===== Helper: Get category/topic (prefer topic, fallback to category/title) =====
const getQuizCategoryAndTopic = async (quizId) => {
  try {
    if (mongoose.Types.ObjectId.isValid(quizId)) {
      const quiz = await Quiz.findById(quizId).select('category topic title');
      if (quiz) {
        let cat = quiz.category || 'General';
        let top = quiz.topic || '';
        if (!top && quiz.title) top = quiz.title;
        return { category: cat, topic: top };
      }
    } else if (typeof quizId === 'string' && quizId.startsWith('precouncil_')) {
      const examId = quizId.replace('precouncil_', '');
      const exam = await PreCouncilExam.findById(examId).select('category topic title');
      if (exam) {
        let cat = exam.category || 'General';
        let top = exam.topic || '';
        if (!top && exam.title) top = exam.title;
        return { category: cat, topic: top };
      }
    }
    return { category: 'General', topic: '' };
  } catch (err) {
    return { category: 'General', topic: '' };
  }
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

    const lastGenerated = user.lastStudyPlanGenerated;
    if (!isPremium && lastGenerated) {
      const oneWeek = 7 * 24 * 60 * 60 * 1000;
      const diff = Date.now() - lastGenerated.getTime();
      if (diff < oneWeek) {
        return res.status(403).json({ error: 'Free users can generate one plan per week. Upgrade to Premium for unlimited.' });
      }
    }

    if (!user.quizResults || user.quizResults.length === 0) {
      return res.status(400).json({ error: 'You haven\'t taken any exams yet. Take some exams first to generate a study plan.' });
    }

    // Build set of passed questions (using string keys)
    const passedKeys = new Set();
    if (user.reviewedQuestions && user.reviewedQuestions.length > 0) {
      user.reviewedQuestions.forEach(r => {
        if (r.passed && r.quizId && r.questionIndex !== undefined) {
          passedKeys.add(`${r.quizId}|${r.questionIndex}`);
        }
      });
    }

    let allWrongQuestions = [];

    for (const result of user.quizResults) {
      const quizId = result.quizId?.toString();
      if (!quizId) continue;

      // Fetch exam questions (works for both regular and PreCouncil)
      const examQuestions = await fetchQuestions(quizId);
      if (!examQuestions || examQuestions.length === 0) continue;

      const userAnswers = result.answers || {};
      
      // Get category/topic (or use title as fallback)
      const quizData = await getQuizCategoryAndTopic(quizId);
      const displayCategory = quizData.topic ? quizData.topic : (quizData.category || 'General');

      for (let i = 0; i < examQuestions.length; i++) {
        const q = examQuestions[i];
        if (userAnswers[i] !== undefined && userAnswers[i] !== q.correctAnswer) {
          const key = `${quizId}|${i}`;
          if (!passedKeys.has(key)) {
            allWrongQuestions.push({
              ...(q.toObject ? q.toObject() : q),
              quizId: quizId,
              userAnswer: null,
              questionIndex: i,
              category: displayCategory
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

    const shuffled = allWrongQuestions.sort(() => 0.5 - Math.random());
    const maxQuestions = isPremium ? 25 : 10;
    const selectedQuestions = shuffled.slice(0, Math.min(maxQuestions, shuffled.length));

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
    // Return a clean error message – our frontend will show a friendly version
    res.status(500).json({ error: 'Failed to generate study plan. Please try again later.' });
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
    // Clean up invalid entries in reviewedQuestions
    let reviewed = (user.reviewedQuestions || []).filter(r => r.quizId && r.questionIndex !== undefined && r.questionIndex !== null);

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

      // Try to get a real category – if q.category is 'General' or empty, fetch from database
      let category = q.category || 'General';
      if ((category === 'General' || category === '') && q.quizId) {
        const quizData = await getQuizCategoryAndTopic(q.quizId);
        category = quizData.topic ? quizData.topic : (quizData.category || 'General');
      }

      if (isCorrect) {
        score++;
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
      } else {
        if (q.quizId && q.questionIndex !== undefined && q.questionIndex !== null) {
          const existingIndex = reviewed.findIndex(r => r.quizId === q.quizId && r.questionIndex === q.questionIndex);
          if (existingIndex !== -1) {
            reviewed.splice(existingIndex, 1);
          }
        }
      }

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

    const percentage = (score / questions.length) * 100;
    const passed = percentage >= 70;

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
    res.status(500).json({ error: 'Failed to submit study plan. Please try again later.' });
  }
});

module.exports = router;