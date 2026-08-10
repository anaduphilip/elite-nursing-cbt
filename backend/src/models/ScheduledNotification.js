// src/models/ScheduledNotification.js
const mongoose = require('mongoose');

const ScheduledNotificationSchema = new mongoose.Schema({
  title: { type: String, required: true },
  message: { type: String, required: true },
  scheduledFor: { type: Date, required: true },
  sentAt: { type: Date, default: null },
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
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('ScheduledNotification', ScheduledNotificationSchema);