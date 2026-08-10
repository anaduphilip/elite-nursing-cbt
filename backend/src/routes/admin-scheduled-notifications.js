// src/routes/admin-scheduled-notifications.js
const express = require('express');
const { ScheduledNotification } = require('../models');
const { isAdmin } = require('../middleware');
const admin = require('firebase-admin');

const router = express.Router();

// ---- Get all scheduled notifications ----
router.get('/scheduled-notifications', isAdmin, async (req, res) => {
  try {
    const notifications = await ScheduledNotification.find()
      .sort({ scheduledFor: -1 })
      .populate('createdBy', 'name email');
    res.json({ success: true, notifications });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch scheduled notifications' });
  }
});

// ---- Create scheduled notification ----
router.post('/scheduled-notifications', isAdmin, async (req, res) => {
  try {
    const { title, message, scheduledFor, targetAudience } = req.body;
    
    if (!title || !message || !scheduledFor) {
      return res.status(400).json({ error: 'Title, message, and scheduled time are required' });
    }

    const scheduledDate = new Date(scheduledFor);
    if (scheduledDate < new Date()) {
      return res.status(400).json({ error: 'Scheduled time must be in the future' });
    }

    const notification = new ScheduledNotification({
      title,
      message,
      scheduledFor: scheduledDate,
      targetAudience: targetAudience || 'all',
      createdBy: req.userId
    });

    await notification.save();
    res.json({ success: true, notification });
  } catch (error) {
    console.error('Schedule notification error:', error);
    res.status(500).json({ error: 'Failed to schedule notification' });
  }
});

// ---- Cancel scheduled notification ----
router.delete('/scheduled-notifications/:id', isAdmin, async (req, res) => {
  try {
    const notification = await ScheduledNotification.findById(req.params.id);
    if (!notification) {
      return res.status(404).json({ error: 'Notification not found' });
    }
    if (notification.status === 'sent') {
      return res.status(400).json({ error: 'Cannot cancel a notification that has already been sent' });
    }
    notification.status = 'cancelled';
    await notification.save();
    res.json({ success: true, message: 'Notification cancelled' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to cancel notification' });
  }
});

module.exports = router;