// src/routes/private-message.js
const express = require('express');
const { PrivateMessage } = require('../models');
const { authenticate } = require('../middleware');

const router = express.Router();

// Get user's private messages (unread first)
router.get('/', authenticate, async (req, res) => {
  try {
    const userId = req.user._id;
    const messages = await PrivateMessage.find({ userId }).sort({ isRead: 1, createdAt: -1 });
    const now = new Date();
    const activeMessages = messages.filter(m => !m.expiresAt || m.expiresAt > now);
    res.json({ success: true, messages: activeMessages });
  } catch (error) {
    console.error('Fetch private messages error:', error);
    res.status(500).json({ error: 'Failed to fetch messages' });
  }
});

// Mark a private message as read
router.put('/:messageId/read', authenticate, async (req, res) => {
  try {
    const { messageId } = req.params;
    const userId = req.user._id;
    const message = await PrivateMessage.findOne({ _id: messageId, userId });
    if (!message) return res.status(404).json({ error: 'Message not found' });
    message.isRead = true;
    await message.save();
    res.json({ success: true, message: 'Message marked as read' });
  } catch (error) {
    console.error('Mark message read error:', error);
    res.status(500).json({ error: 'Failed to mark message as read' });
  }
});

module.exports = router;