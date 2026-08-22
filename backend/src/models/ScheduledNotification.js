// src/models/ScheduledNotification.js
const mongoose = require('mongoose');

const ScheduledNotificationSchema = new mongoose.Schema({
  title: { type: String, required: true },
  message: { type: String, required: true },
  scheduledFor: { type: Date, required: true },
  sentAt: { type: Date, default: null },
  lastSentAt: { type: Date, default: null },
  status: { 
    type: String, 
    enum: ['pending', 'sent', 'cancelled'], 
    default: 'pending' 
  },
  targetAudience: {
    type: String,
    enum: ['all', 'free', 'premium', 'inactive'],
    default: 'all'
  },
  repeatType: {
    type: String,
    enum: ['once', 'daily'],
    default: 'once'
  },
  sentCount: { type: Number, default: 0 },
  successCount: { type: Number, default: 0 },
  failureCount: { type: Number, default: 0 },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('ScheduledNotification', ScheduledNotificationSchema);