// src/models/WeeklyQuiz.js
const mongoose = require('mongoose');

const WeeklyQuizSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: String,
  instructions: { type: String, default: '' },
  weekNumber: { type: Number, required: true },
  year: { type: Number, default: () => new Date().getFullYear() },
  questions: [{
    questionText: String,
    options: [String],
    correctAnswer: Number,
    points: { type: Number, default: 1 },
    imageUrl: { type: String, default: null }
  }],
  passingScore: { type: Number, default: 70 },
  timeLimit: { type: Number, default: 20 },
  isActive: { type: Boolean, default: false },
  isPremium: { type: Boolean, default: false },
  startDate: { type: Date, default: null },
  endDate: { type: Date, default: null },
  createdAt: { type: Date, default: Date.now },
  publishedAt: { type: Date, default: null }
});

const WeeklyQuizAttemptSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  weeklyQuizId: { type: mongoose.Schema.Types.ObjectId, ref: 'WeeklyQuiz', required: true },
  answers: { type: Object, default: {} },
  score: { type: Number, default: 0 },
  total: { type: Number, default: 0 },
  percentage: { type: Number, default: 0 },
  passed: { type: Boolean, default: false },
  startedAt: { type: Date, default: Date.now },
  completedAt: { type: Date },
  timeSpent: { type: Number, default: 0 }
});

const WeeklyQuiz = mongoose.model('WeeklyQuiz', WeeklyQuizSchema);
const WeeklyQuizAttempt = mongoose.model('WeeklyQuizAttempt', WeeklyQuizAttemptSchema);

module.exports = {
  WeeklyQuiz,
  WeeklyQuizAttempt
};