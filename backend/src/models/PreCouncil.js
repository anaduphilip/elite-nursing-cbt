// src/models/PreCouncil.js
const mongoose = require('mongoose');

// Category (Nursing, Midwifery, Public Health)
const PreCouncilCategorySchema = new mongoose.Schema({
  name: { type: String, required: true },
  slug: { type: String, required: true, unique: true },
  description: { type: String, default: '' },
  icon: { type: String, default: '📚' },
  order: { type: Number, default: 0 },
  active: { type: Boolean, default: true },
  createdAt: { type: Date, default: Date.now }
});

// Paper (Paper I, Paper II, OSCE/VIVA)
const PreCouncilPaperSchema = new mongoose.Schema({
  categoryId: { type: mongoose.Schema.Types.ObjectId, ref: 'PreCouncilCategory', required: true },
  name: { type: String, required: true },
  slug: { type: String, required: true },
  description: { type: String, default: '' },
  hasCourses: { type: Boolean, default: false },
  courses: [{ type: String }],
  order: { type: Number, default: 0 },
  active: { type: Boolean, default: true },
  createdAt: { type: Date, default: Date.now }
});

// Exam (contains questions)
const PreCouncilExamSchema = new mongoose.Schema({
  paperId: { type: mongoose.Schema.Types.ObjectId, ref: 'PreCouncilPaper', required: true },
  title: { type: String, required: true },
  description: { type: String, default: '' },
  questions: [{
    questionText: String,
    options: [String],
    correctAnswer: Number,
    points: { type: Number, default: 1 }
  }],
  timeLimit: { type: Number, default: 180 },
  questionCount: { type: Number, default: 250 },
  passingScore: { type: Number, default: 70 },
  isActive: { type: Boolean, default: true },
  order: { type: Number, default: 0 },
  createdAt: { type: Date, default: Date.now }
});

const PreCouncilCategory = mongoose.model('PreCouncilCategory', PreCouncilCategorySchema);
const PreCouncilPaper = mongoose.model('PreCouncilPaper', PreCouncilPaperSchema);
const PreCouncilExam = mongoose.model('PreCouncilExam', PreCouncilExamSchema);

module.exports = {
  PreCouncilCategory,
  PreCouncilPaper,
  PreCouncilExam
};