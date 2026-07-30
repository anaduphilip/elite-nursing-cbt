// src/models/Announcement.js
const mongoose = require('mongoose');

const AnnouncementSchema = new mongoose.Schema({
  message: { type: String, required: true },
  buttonText: { type: String, default: 'Learn More' },
  buttonLink: { type: String, default: '/get-premium' },
  active: { type: Boolean, default: false },
  version: { type: Number, default: 1 },
  updatedAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Announcement', AnnouncementSchema);