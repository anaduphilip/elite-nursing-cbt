// src/routes/notification.js
const express = require('express');
const { User } = require('../models');
const { authenticate, isAdmin } = require('../middleware');
const admin = require('firebase-admin');

const router = express.Router();

// Register device token (public, but requires userId)
router.post('/register-token', async (req, res) => {
  const { token, userId } = req.body;
  if (!token || !userId) return res.status(400).json({ error: 'Missing token or userId' });
  try {
    const user = await User.findById(userId);
    if (!user) {
      return res.status(401).json({ error: 'Your account has been deleted. Please log out and contact support.' });
    }
    await User.findByIdAndUpdate(userId, { $addToSet: { deviceTokens: token } });
    console.log(`Token registered for user ${userId}`);
    res.json({ success: true });
  } catch (error) {
    console.error('Error registering token:', error);
    res.status(500).json({ error: 'Failed to register token' });
  }
});

// Admin send push notification (admin only)
router.post('/admin/send-notification', isAdmin, async (req, res) => {
  const { title, message } = req.body;
  if (!title || !message) {
    return res.status(400).json({ error: 'Missing title or message' });
  }
  try {
    const users = await User.find({ deviceTokens: { $exists: true, $ne: [] } });
    const tokens = users.flatMap(user => user.deviceTokens);
    if (tokens.length === 0) {
      return res.status(400).json({ error: 'No registered devices found' });
    }
    const response = await admin.messaging().sendEachForMulticast({
      tokens: tokens,
      notification: { title, body: message }
    });
    console.log(`Notification sent to ${response.successCount} devices.`);
    if (response.failureCount > 0) {
      console.error('Failed tokens:', response.responses);
    }
    res.json({ success: true, successCount: response.successCount, failureCount: response.failureCount });
  } catch (error) {
    console.error('Error sending notification:', error);
    res.status(500).json({ error: 'Failed to send notifications' });
  }
});

module.exports = router;