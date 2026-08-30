// src/models/Rating.js
const mongoose = require('mongoose');

const RatingSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null 
  },
  stars: {
    type: Number,
    required: true,
    min: 1,
    max: 5
  },
  feedback: {
    type: String,
    default: '',
    maxlength: 2000
  },
  name: {
    type: String,
    default: 'Anonymous User'
  },
  isFake: {
    type: Boolean,
    default: false 
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

// Indexes for performance
RatingSchema.index({ createdAt: -1 });
RatingSchema.index({ isDeleted: 1, createdAt: -1 });
RatingSchema.index({ userId: 1 });
RatingSchema.index({ stars: 1 });
RatingSchema.index({ isFake: 1 });

module.exports = mongoose.model('Rating', RatingSchema);