// src/models/FeedbackReply.js
const mongoose = require('mongoose');

const FeedbackReplySchema = new mongoose.Schema({
  feedbackId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Rating',
    required: true
  },
  adminId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  replyText: {
    type: String,
    required: true,
    maxlength: 2000
  },
  isDeleted: {
    type: Boolean,
    default: false
  },
  deletedAt: {
    type: Date,
    default: null
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

FeedbackReplySchema.index({ feedbackId: 1, createdAt: -1 });
FeedbackReplySchema.index({ feedbackId: 1, isDeleted: 1 });

module.exports = mongoose.model('FeedbackReply', FeedbackReplySchema);