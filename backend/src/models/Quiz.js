// src/models/Quiz.js
const mongoose = require('mongoose');

const QuizSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: String,
  category: { type: String, default: 'general-nursing' },
  topic: { type: String, default: '' },
  questions: [{
    questionText: String,
    options: [String],
    correctAnswer: Number,
    points: { type: Number, default: 1 },
    imageUrl: { type: String, default: null } 
  }],
  passingScore: { type: Number, default: 70 },
  isPremium: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Quiz', QuizSchema);