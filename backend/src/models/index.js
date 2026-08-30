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
const WeeklyQuizModule = require('./WeeklyQuiz');
const PreCouncilModule = require('./PreCouncil');
const Rating = require('./Rating');
const FeedbackReply = require('./FeedbackReply');
const FeedbackReaction = require('./FeedbackReaction');

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
  PreCouncilExam: PreCouncilModule.PreCouncilExam,
  Rating,
  FeedbackReply,
  FeedbackReaction
};