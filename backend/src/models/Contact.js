// src/models/Contact.js
const mongoose = require('mongoose');

const ContactSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true },
  message: { type: String, required: true },
  adminReply: { type: String, default: '' },
  adminReplyDate: { type: Date, default: null },
  status: {
    type: String,
    enum: ['new', 'read', 'replied'],
    default: 'new'
  },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Contact', ContactSchema);