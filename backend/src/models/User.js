// src/models/User.js
const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
  name: { type: String, default: '' },
  email: { type: String, unique: true, required: true },
  password: { type: String, required: true },
  isPremium: { type: Boolean, default: false },
  isVerified: { type: Boolean, default: false },
  isBanned: { type: Boolean, default: false },
  isDeleted: { type: Boolean, default: false },

  loginAttempts: { type: Number, default: 0 },
  lockedUntil: { type: Date, default: null },
  manuallyBlocked: { type: Boolean, default: false },
  manualBlockExpiry: { type: Date, default: null },
  manualBlockReason: { type: String, default: '' },

  createdAt: { type: Date, default: Date.now },
  currentSessionToken: { type: String, default: null },
  lastLoginAt: { type: Date, default: null },
  purchaseDate: Date,
  premiumPlan: { type: String, enum: ['daily', 'monthly', 'yearly', null], default: null },
  premiumExpiry: { type: Date, default: null },
  purchasedExams: [{
    examId: String,
    examTitle: String,
    sectionNumber: Number,
    purchaseDate: { type: Date, default: Date.now }
  }],
  transactions: [{
    reference: String,
    amount: Number,
    status: String,
    planType: String,
    examId: String,
    examTitle: String,
    sectionNumber: Number,
    date: { type: Date, default: Date.now }
  }],
  quizResults: [{
    quizId: String,
    title: String,
    category: String,
    topic: String,
    score: Number,
    total: Number,
    percentage: Number,
    date: { type: Date, default: Date.now },
    answers: Object,
    questions: Array,
    isPremium: { type: Boolean, default: false },
    isPreCouncil: { type: Boolean, default: false },
    sectionNumber: Number,
    deleted: { type: Boolean, default: false }
  }],
  deviceTokens: [{ type: String }],
  marketingConsent: { type: Boolean, default: false },
  lastMarketingEmailSent: { type: Date, default: null },
  appliedCoupons: [{
    code: String,
    discountAmount: Number,
    appliedAt: { type: Date, default: Date.now }
  }],
  dailyExplanations: { type: Number, default: 0 },
  lastExplanationReset: { type: Date, default: null },
  lastReminderSent: { type: String, default: null },
  notifiedExpired: { type: Boolean, default: false },
  lastStudyPlanGenerated: { type: Date, default: null },
  studyPlan: {
    generatedAt: { type: Date, default: null },
    questions: [{
      questionText: { type: String },
      options: [{ type: String }],
      correctAnswer: { type: Number },
      quizId: { type: String },
      userAnswer: { type: Number, default: null }
    }],
    completed: { type: Boolean, default: false },
    score: { type: Number, default: null },
    total: { type: Number, default: 0 }
  },
  readStudyNotes: [{ type: mongoose.Schema.Types.ObjectId, ref: 'StudyNote' }],
  badges: [{
    badgeId: { type: mongoose.Schema.Types.ObjectId, ref: 'Badge' },
    earnedAt: { type: Date, default: Date.now }
  }],
  streak: { type: Number, default: 0 },
  lastActivityDate: { type: Date, default: null },
  awardedBadgeIds: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Badge' }],

  // ===== REFERRAL SYSTEM =====
  referralCode: { type: String, unique: true, sparse: true },
  referredBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  referralCount: { type: Number, default: 0 },
  referralRewards: [{
    rewardedAt: { type: Date, default: Date.now },
    type: { type: String, enum: ['premium_days', 'discount'], default: 'premium_days' },
    value: { type: Number, default: 1 }
  }],
  referralDiscount: {
    code: { type: String, default: null },
    discountPercent: { type: Number, default: 0 },
    expiresAt: { type: Date, default: null },
    used: { type: Boolean, default: false }
  },

  referralBonusClaimed: { type: Boolean, default: false },

  // ===== STUDY PLAN REVIEW TRACKING =====
  reviewedQuestions: [{
    quizId: { type: String, required: true },
    questionIndex: { type: Number, required: true },
    passed: { type: Boolean, default: false }
  }],

  lastRatingPromptDate: { type: Date, default: null },
  lastRatingPromptExamCount: { type: Number, default: 0 }
});

module.exports = mongoose.model('User', UserSchema);