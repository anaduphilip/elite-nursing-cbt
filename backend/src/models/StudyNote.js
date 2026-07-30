// src/models/StudyNote.js
const mongoose = require('mongoose');

const StudyNoteSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String, default: '' },
  content: { type: String, required: true },
  category: { type: String, default: 'General' },
  order: { type: Number, default: 0 },
  active: { type: Boolean, default: true },
  isPremium: { type: Boolean, default: false },
  estimatedReadTime: { type: Number, default: 5 },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('StudyNote', StudyNoteSchema);