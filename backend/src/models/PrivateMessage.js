// src/models/PrivateMessage.js
const mongoose = require('mongoose');

const PrivateMessageSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  message: { type: String, required: true },
  buttonText: { type: String, default: 'Learn More' },
  buttonLink: { type: String, default: null },
  isRead: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now },
  expiresAt: { type: Date, default: null }
});

module.exports = mongoose.model('PrivateMessage', PrivateMessageSchema);