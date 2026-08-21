// src/models/index.js
const User = require('./User');
const Quiz = require('./Quiz');
const Contact = require('./Contact');
const Config = require('./Config');
const Category = require('./Category');
const Coupon = require('./Coupon');
const FAQ = require('./FAQ');
const Badge = require('./Badge');
const StudyNote = require('./StudyNote');
const PrivateMessage = require('./PrivateMessage');
const MarketingConsent = require('./MarketingConsent');
const Announcement = require('./Announcement');
const ScheduledNotification = require('./ScheduledNotification');

// WeeklyQuiz and WeeklyQuizAttempt are in the same file
const WeeklyQuizModule = require('./WeeklyQuiz');

// PreCouncil models are in the same file
const PreCouncilModule = require('./PreCouncil');

module.exports = {
  User,
  Quiz,
  Contact,
  Config,
  Category,
  Coupon,
  FAQ,
  Badge,
  StudyNote,
  PrivateMessage,
  MarketingConsent,
  Announcement,
  ScheduledNotification,
  WeeklyQuiz: WeeklyQuizModule.WeeklyQuiz,
  WeeklyQuizAttempt: WeeklyQuizModule.WeeklyQuizAttempt,
  PreCouncilCategory: PreCouncilModule.PreCouncilCategory,
  PreCouncilPaper: PreCouncilModule.PreCouncilPaper,
  PreCouncilExam: PreCouncilModule.PreCouncilExam
};