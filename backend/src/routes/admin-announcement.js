// src/routes/admin-announcement.js
const express = require('express');
const { Announcement } = require('../models');
const { isAdmin } = require('../middleware');

const router = express.Router();

// Get current announcement
router.get('/', isAdmin, async (req, res) => {
  try {
    const announcement = await Announcement.findOne();
    res.json({ success: true, announcement });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch announcement' });
  }
});

// Create or update announcement
router.post('/', isAdmin, async (req, res) => {
  try {
    const { message, buttonText, buttonLink, active } = req.body;
    if (!message) return res.status(400).json({ error: 'Message is required' });
    let announcement = await Announcement.findOne();
    if (announcement) {
      announcement.message = message;
      announcement.buttonText = buttonText || 'Learn More';
      announcement.buttonLink = buttonLink || '/get-premium';
      announcement.active = active !== undefined ? active : true;
      announcement.version += 1;
      announcement.updatedAt = new Date();
    } else {
      announcement = new Announcement({
        message,
        buttonText: buttonText || 'Learn More',
        buttonLink: buttonLink || '/get-premium',
        active: active !== undefined ? active : true,
        version: 1
      });
    }
    await announcement.save();
    res.json({ success: true, announcement });
  } catch (error) {
    console.error('Announcement save error:', error);
    res.status(500).json({ error: 'Failed to save announcement' });
  }
});

// Deactivate announcement
router.delete('/', isAdmin, async (req, res) => {
  try {
    const announcement = await Announcement.findOne();
    if (!announcement) return res.status(404).json({ error: 'No announcement found' });
    announcement.active = false;
    announcement.version += 1;
    await announcement.save();
    res.json({ success: true, message: 'Announcement deactivated' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to deactivate announcement' });
  }
});

module.exports = router;