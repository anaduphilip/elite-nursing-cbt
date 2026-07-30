// src/routes/announcement.js
const express = require('express');
const { Announcement } = require('../models');

const router = express.Router();

router.get('/', async (req, res) => {
  try {
    const announcement = await Announcement.findOne({ active: true });
    if (!announcement) {
      return res.json({ success: false, message: 'No active announcement' });
    }
    res.json({ success: true, announcement });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch announcement' });
  }
});

module.exports = router;