// src/routes/admin-faqs.js
const express = require('express');
const { FAQ } = require('../models');
const { isAdmin } = require('../middleware');

const router = express.Router();

// Get all FAQs
router.get('/', isAdmin, async (req, res) => {
  try {
    const faqs = await FAQ.find().sort({ order: 1 });
    res.json({ success: true, faqs });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch FAQs' });
  }
});

// Create FAQ
router.post('/', isAdmin, async (req, res) => {
  try {
    const { question, answer, category, order, active } = req.body;
    if (!question || !answer) {
      return res.status(400).json({ error: 'Question and answer are required' });
    }
    const faq = new FAQ({ question, answer, category: category || 'General', order: order || 0, active: active !== undefined ? active : true });
    await faq.save();
    res.json({ success: true, faq });
  } catch (error) {
    console.error('FAQ create error:', error);
    res.status(500).json({ error: 'Failed to create FAQ' });
  }
});

// Update FAQ
router.put('/:id', isAdmin, async (req, res) => {
  try {
    const faq = await FAQ.findById(req.params.id);
    if (!faq) return res.status(404).json({ error: 'FAQ not found' });
    const { question, answer, category, order, active } = req.body;
    if (question) faq.question = question;
    if (answer) faq.answer = answer;
    if (category) faq.category = category;
    if (order !== undefined) faq.order = order;
    if (active !== undefined) faq.active = active;
    await faq.save();
    res.json({ success: true, faq });
  } catch (error) {
    console.error('FAQ update error:', error);
    res.status(500).json({ error: 'Failed to update FAQ' });
  }
});

// Delete FAQ
router.delete('/:id', isAdmin, async (req, res) => {
  try {
    await FAQ.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: 'FAQ deleted' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete FAQ' });
  }
});

module.exports = router;