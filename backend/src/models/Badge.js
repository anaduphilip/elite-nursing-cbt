// src/models/Badge.js
const mongoose = require('mongoose');

const BadgeSchema = new mongoose.Schema({
  name: { type: String, required: true },
  icon: { type: String, default: '🏅' },
  description: { type: String, default: '' },
  requirementType: {
    type: String,
    enum: [
      'total_exams',
      'category_exams',
      'streak_days',
      'perfect_score',
      'category_perfect',
      'pass_rate',
      'retake_improve',
      'premium',
      'first_exam',
      'total_passed',
      'total_failed',
      'specific_exam'
    ],
    required: true
  },
  targetCategory: { type: String, default: null },
  targetQuizId: { type: mongoose.Schema.Types.ObjectId, ref: 'Quiz', default: null },
  requirementValue: { type: Number, default: 1 },
  active: { type: Boolean, default: true },
  order: { type: Number, default: 0 },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Badge', BadgeSchema);