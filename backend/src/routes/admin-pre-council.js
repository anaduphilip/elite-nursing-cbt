// src/routes/admin-pre-council.js
const express = require('express');
const { PreCouncilCategory, PreCouncilPaper, PreCouncilExam } = require('../models');
const { isAdmin } = require('../middleware');

const router = express.Router();

// ===== CATEGORIES =====
router.get('/categories', isAdmin, async (req, res) => {
  try {
    const categories = await PreCouncilCategory.find().sort({ order: 1 });
    res.json({ success: true, categories });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch categories' });
  }
});

router.post('/categories', isAdmin, async (req, res) => {
  try {
    const { name, description, icon, order, active } = req.body;
    if (!name) return res.status(400).json({ error: 'Name is required' });
    const slug = name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
    const category = new PreCouncilCategory({ name, slug, description: description || '', icon: icon || '📚', order: order || 0, active: active !== undefined ? active : true });
    await category.save();
    res.json({ success: true, category });
  } catch (error) {
    console.error('Create category error:', error);
    res.status(500).json({ error: 'Failed to create category' });
  }
});

router.put('/categories/:id', isAdmin, async (req, res) => {
  try {
    const { name, description, icon, order, active } = req.body;
    const category = await PreCouncilCategory.findById(req.params.id);
    if (!category) return res.status(404).json({ error: 'Category not found' });
    if (name) { category.name = name; category.slug = name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, ''); }
    if (description !== undefined) category.description = description;
    if (icon !== undefined) category.icon = icon;
    if (order !== undefined) category.order = order;
    if (active !== undefined) category.active = active;
    await category.save();
    res.json({ success: true, category });
  } catch (error) {
    console.error('Update category error:', error);
    res.status(500).json({ error: 'Failed to update category' });
  }
});

router.delete('/categories/:id', isAdmin, async (req, res) => {
  try {
    await PreCouncilCategory.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: 'Category deleted' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete category' });
  }
});

// ===== PAPERS =====
router.get('/papers', isAdmin, async (req, res) => {
  try {
    const papers = await PreCouncilPaper.find().sort({ order: 1 });
    res.json({ success: true, papers });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch papers' });
  }
});

router.post('/papers', isAdmin, async (req, res) => {
  try {
    const { categoryId, name, description, hasCourses, courses, order, active } = req.body;
    if (!categoryId || !name) return res.status(400).json({ error: 'Category and name are required' });
    const slug = name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
    const paper = new PreCouncilPaper({ categoryId, name, slug, description: description || '', hasCourses: hasCourses || false, courses: courses || [], order: order || 0, active: active !== undefined ? active : true });
    await paper.save();
    res.json({ success: true, paper });
  } catch (error) {
    console.error('Create paper error:', error);
    res.status(500).json({ error: 'Failed to create paper' });
  }
});

router.put('/papers/:id', isAdmin, async (req, res) => {
  try {
    const { categoryId, name, description, hasCourses, courses, order, active } = req.body;
    const paper = await PreCouncilPaper.findById(req.params.id);
    if (!paper) return res.status(404).json({ error: 'Paper not found' });
    if (categoryId) paper.categoryId = categoryId;
    if (name) { paper.name = name; paper.slug = name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, ''); }
    if (description !== undefined) paper.description = description;
    if (hasCourses !== undefined) paper.hasCourses = hasCourses;
    if (courses !== undefined) paper.courses = courses;
    if (order !== undefined) paper.order = order;
    if (active !== undefined) paper.active = active;
    await paper.save();
    res.json({ success: true, paper });
  } catch (error) {
    console.error('Update paper error:', error);
    res.status(500).json({ error: 'Failed to update paper' });
  }
});

router.delete('/papers/:id', isAdmin, async (req, res) => {
  try {
    await PreCouncilPaper.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: 'Paper deleted' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete paper' });
  }
});

// ===== EXAMS =====
router.get('/exams', isAdmin, async (req, res) => {
  try {
    const exams = await PreCouncilExam.find().sort({ order: 1 });
    res.json({ success: true, exams });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch exams' });
  }
});

router.post('/exams', isAdmin, async (req, res) => {
  try {
    const { paperId, title, description, questions, timeLimit, passingScore, order, isActive } = req.body;
    if (!paperId || !title || !questions || questions.length === 0) {
      return res.status(400).json({ error: 'Paper, title, and questions are required' });
    }
    const exam = new PreCouncilExam({
      paperId,
      title,
      description: description || '',
      questions,
      timeLimit: timeLimit || 180,
      questionCount: questions.length,
      passingScore: passingScore || 70,
      order: order || 0,
      isActive: isActive !== undefined ? isActive : true
    });
    await exam.save();
    res.json({ success: true, exam });
  } catch (error) {
    console.error('Create exam error:', error);
    res.status(500).json({ error: 'Failed to create exam' });
  }
});

router.put('/exams/:id', isAdmin, async (req, res) => {
  try {
    const { paperId, title, description, questions, timeLimit, passingScore, order, isActive } = req.body;
    const exam = await PreCouncilExam.findById(req.params.id);
    if (!exam) return res.status(404).json({ error: 'Exam not found' });
    if (paperId) exam.paperId = paperId;
    if (title) exam.title = title;
    if (description !== undefined) exam.description = description;
    if (questions) { exam.questions = questions; exam.questionCount = questions.length; }
    if (timeLimit !== undefined) exam.timeLimit = timeLimit;
    if (passingScore !== undefined) exam.passingScore = passingScore;
    if (order !== undefined) exam.order = order;
    if (isActive !== undefined) exam.isActive = isActive;
    await exam.save();
    res.json({ success: true, exam });
  } catch (error) {
    console.error('Update exam error:', error);
    res.status(500).json({ error: 'Failed to update exam' });
  }
});

router.delete('/exams/:id', isAdmin, async (req, res) => {
  try {
    await PreCouncilExam.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: 'Exam deleted' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete exam' });
  }
});

// ===== QUESTION IMAGE ROUTES =====

// PATCH /api/admin/pre-council/exams/:examId/questions/:questionId/image
router.patch('/exams/:examId/questions/:questionId/image', isAdmin, async (req, res) => {
  try {
    const { examId, questionId } = req.params;
    const { imageUrl } = req.body;

    if (!imageUrl) {
      return res.status(400).json({ error: 'Image URL is required' });
    }

    const exam = await PreCouncilExam.findById(examId);
    if (!exam) {
      return res.status(404).json({ error: 'Exam not found' });
    }

    const question = exam.questions.id(questionId);
    if (!question) {
      return res.status(404).json({ error: 'Question not found' });
    }

    question.imageUrl = imageUrl;
    await exam.save();

    res.json({ success: true, question });
  } catch (error) {
    console.error('Save image error:', error);
    res.status(500).json({ error: 'Failed to save image' });
  }
});

// DELETE /api/admin/pre-council/exams/:examId/questions/:questionId/image
router.delete('/exams/:examId/questions/:questionId/image', isAdmin, async (req, res) => {
  try {
    const { examId, questionId } = req.params;

    const exam = await PreCouncilExam.findById(examId);
    if (!exam) {
      return res.status(404).json({ error: 'Exam not found' });
    }

    const question = exam.questions.id(questionId);
    if (!question) {
      return res.status(404).json({ error: 'Question not found' });
    }

    question.imageUrl = null;
    await exam.save();

    res.json({ success: true, message: 'Image removed' });
  } catch (error) {
    console.error('Remove image error:', error);
    res.status(500).json({ error: 'Failed to remove image' });
  }
});

module.exports = router;