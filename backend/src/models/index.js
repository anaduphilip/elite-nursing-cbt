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
const WeeklyQuiz = require('./WeeklyQuiz');
const WeeklyQuizAttempt = require('./WeeklyQuizAttempt');
const PreCouncilCategory = require('./PreCouncilCategory');
const PreCouncilPaper = require('./PreCouncilPaper');
const PreCouncilExam = require('./PreCouncilExam');

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
  WeeklyQuiz,
  WeeklyQuizAttempt,
  PreCouncilCategory,
  PreCouncilPaper,
  PreCouncilExam
};