// src/routes/faqs.js
const express = require('express');
const { FAQ } = require('../models');

const router = express.Router();

// Get all active FAQs (public)
router.get('/', async (req, res) => {
  try {
    const faqs = await FAQ.find({ active: true }).sort({ order: 1 });
    res.json({ success: true, faqs });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch FAQs' });
  }
});

module.exports = router;