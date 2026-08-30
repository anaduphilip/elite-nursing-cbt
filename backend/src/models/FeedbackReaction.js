// src/models/FeedbackReaction.js
const mongoose = require('mongoose');

const FeedbackReactionSchema = new mongoose.Schema({
  feedbackId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Rating',
    required: true
  },
  replyId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'FeedbackReply',
    default: null 
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  emoji: {
    type: String,
    required: true,
    enum: ['👍', '❤️', '👏', '😊', '🔥', '💯', '🌟', '🙌']
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

FeedbackReactionSchema.index(
  { feedbackId: 1, replyId: 1, userId: 1 },
  { unique: true }
);
FeedbackReactionSchema.index({ feedbackId: 1, replyId: 1 });

module.exports = mongoose.model('FeedbackReaction', FeedbackReactionSchema);