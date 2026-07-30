// src/routes/admin-quiz-management.js
const express = require('express');
const { Quiz } = require('../models');
const { isAdmin } = require('../middleware');

const router = express.Router();

// Get all quizzes (admin)
router.get('/', isAdmin, async (req, res) => {
  try {
    const quizzes = await Quiz.find().select('title category _id');
    res.json({ success: true, quizzes });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch quizzes' });
  }
});

// Get questions for a specific quiz
router.get('/:quizId/questions', isAdmin, async (req, res) => {
  try {
    const quiz = await Quiz.findById(req.params.quizId);
    if (!quiz) return res.status(404).json({ error: 'Quiz not found' });
    res.json({ success: true, questions: quiz.questions });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch questions' });
  }
});

// Create a new quiz
router.post('/', isAdmin, async (req, res) => {
  try {
    const { title, description, category, topic, questions, passingScore, isPremium } = req.body;
    if (!title || !category || !questions || questions.length === 0) {
      return res.status(400).json({ error: 'Title, category, and questions are required' });
    }
    const quiz = new Quiz({
      title,
      description: description || `${title} - ${questions.length} practice questions`,
      category,
      topic: topic || title,
      questions,
      passingScore: passingScore || 70,
      isPremium: isPremium || false
    });
    await quiz.save();
    res.json({ success: true, quiz });
  } catch (error) {
    console.error('Create quiz error:', error);
    res.status(500).json({ error: 'Failed to create quiz' });
  }
});

// Add a new question to a quiz
router.post('/:quizId/questions', isAdmin, async (req, res) => {
  try {
    const { questionText, options, correctAnswer, points } = req.body;
    if (!questionText || !options || options.length !== 4 || correctAnswer === undefined) {
      return res.status(400).json({ error: 'Missing required fields' });
    }
    const quiz = await Quiz.findById(req.params.quizId);
    if (!quiz) return res.status(404).json({ error: 'Quiz not found' });
    quiz.questions.push({ questionText, options, correctAnswer, points: points || 1 });
    await quiz.save();
    res.json({ success: true, question: quiz.questions[quiz.questions.length - 1] });
  } catch (error) {
    console.error('Add question error:', error);
    res.status(500).json({ error: 'Failed to add question' });
  }
});

// Update a question
router.put('/:quizId/questions/:questionId', isAdmin, async (req, res) => {
  try {
    const { questionText, options, correctAnswer, points } = req.body;
    const quiz = await Quiz.findById(req.params.quizId);
    if (!quiz) return res.status(404).json({ error: 'Quiz not found' });
    const question = quiz.questions.id(req.params.questionId);
    if (!question) return res.status(404).json({ error: 'Question not found' });
    if (questionText !== undefined) question.questionText = questionText;
    if (options !== undefined) question.options = options;
    if (correctAnswer !== undefined) question.correctAnswer = correctAnswer;
    if (points !== undefined) question.points = points;
    await quiz.save();
    res.json({ success: true, question });
  } catch (error) {
    console.error('Update question error:', error);
    res.status(500).json({ error: 'Failed to update question' });
  }
});

// Update a quiz (including questions)
router.put('/:quizId', isAdmin, async (req, res) => {
  try {
    const { title, description, category, topic, questions, passingScore, isPremium } = req.body;
    const quiz = await Quiz.findById(req.params.quizId);
    if (!quiz) return res.status(404).json({ error: 'Quiz not found' });
    if (title) quiz.title = title;
    if (description) quiz.description = description;
    if (category) quiz.category = category;
    if (topic) quiz.topic = topic;
    if (questions) quiz.questions = questions;
    if (passingScore !== undefined) quiz.passingScore = passingScore;
    if (isPremium !== undefined) quiz.isPremium = isPremium;
    await quiz.save();
    res.json({ success: true, quiz });
  } catch (error) {
    console.error('Update quiz error:', error);
    res.status(500).json({ error: 'Failed to update quiz: ' + error.message });
  }
});

// Delete a question
router.delete('/:quizId/questions/:questionId', isAdmin, async (req, res) => {
  try {
    const quiz = await Quiz.findById(req.params.quizId);
    if (!quiz) return res.status(404).json({ error: 'Quiz not found' });
    const question = quiz.questions.id(req.params.questionId);
    if (!question) return res.status(404).json({ error: 'Question not found' });
    quiz.questions.pull(req.params.questionId);
    await quiz.save();
    res.json({ success: true, message: 'Question deleted' });
  } catch (error) {
    console.error('Delete question error:', error);
    res.status(500).json({ error: 'Failed to delete question' });
  }
});

// Delete a quiz (hard delete)
router.delete('/:quizId', isAdmin, async (req, res) => {
  try {
    const quiz = await Quiz.findByIdAndDelete(req.params.quizId);
    if (!quiz) return res.status(404).json({ error: 'Quiz not found' });
    res.json({ success: true, message: 'Quiz deleted' });
  } catch (error) {
    console.error('Delete quiz error:', error);
    res.status(500).json({ error: 'Failed to delete quiz' });
  }
});

module.exports = router;