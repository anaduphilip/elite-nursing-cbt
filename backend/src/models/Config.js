// src/models/Config.js
const mongoose = require('mongoose');

const ConfigSchema = new mongoose.Schema({
  premiumDailyPrice: { type: Number, default: 500 },
  premiumMonthlyPrice: { type: Number, default: 2000 },
  premiumYearlyPrice: { type: Number, default: 10000 },
  freeExamLimit: { type: Number, default: 1 },
  defaultPassingScore: { type: Number, default: 70 },
  maintenanceMode: { type: Boolean, default: false },
  maintenanceMessage: { type: String, default: 'We are currently performing maintenance. Please check back soon.' },
  appName: { type: String, default: 'ELITE Nursing & Midwifery CBT' },
  appLogo: { type: String, default: '' },
  contactEmail: { type: String, default: 'elitenursingcbt@gmail.com' },
  contactPhone: { type: String, default: '09063908476' },
  defaultTimeLimit: { type: Number, default: 20 },
  showWeeklyQuiz: { type: Boolean, default: true },
  showLeaderboard: { type: Boolean, default: true },
  updatedAt: { type: Date, default: Date.now },
  refreshRequired: { type: Boolean, default: false },
  refreshVersion: { type: Number, default: 0 },
  refreshMessage: { type: String, default: 'A new version is available. Please refresh your page to continue.' },
  limitedOffer: {
    enabled: { type: Boolean, default: false },
    discountPercent: { type: Number, default: 0 },
    startDate: { type: Date, default: null },
    endDate: { type: Date, default: null },
    message: { type: String, default: '🔥 Limited Time Offer!' },
    buttonText: { type: String, default: 'Get Premium Now' },
    buttonLink: { type: String, default: '/get-premium' },
    targetAudience: { type: String, enum: ['all', 'free', 'premium'], default: 'free' }
  },
  showFreeMode: { type: Boolean, default: true },
  showPremiumMode: { type: Boolean, default: true },
  showStudyMode: { type: Boolean, default: true },
  showProgressSnapshot: { type: Boolean, default: true },
  showDownloadApp: { type: Boolean, default: true },
  gamification: {
    enabled: { type: Boolean, default: true },
    showStreak: { type: Boolean, default: true },
    showBadges: { type: Boolean, default: true },
    streakResetHours: { type: Number, default: 24 },
    showBadgesOnHome: { type: Boolean, default: true },
    showStreakOnHome: { type: Boolean, default: true }
  }
});

module.exports = mongoose.model('Config', ConfigSchema);