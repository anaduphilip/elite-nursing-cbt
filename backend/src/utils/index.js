// src/utils/index.js
const { connectWithRetry, mongoose } = require('./db');
const { generateOTP, generateSessionToken, checkAndUpdatePremium, JWT_SECRET } = require('./helpers');
const { sendEmail, getContactEmailTemplate, getReplyEmailTemplate, sendMarketingEmail, sendReminderEmail } = require('./email');
const { updateUserStreak, checkBadgeEligibility, awardBadges, checkAndAwardBadges } = require('./gamification');
const { aiProviders, callAIModels } = require('./ai-providers');
const { startPremiumReminderCron } = require('./cron');

module.exports = {
  connectWithRetry,
  mongoose,
  generateOTP,
  generateSessionToken,
  checkAndUpdatePremium,
  JWT_SECRET,
  sendEmail,
  getContactEmailTemplate,
  getReplyEmailTemplate,
  sendMarketingEmail,
  sendReminderEmail,
  updateUserStreak,
  checkBadgeEligibility,
  awardBadges,
  checkAndAwardBadges,
  aiProviders,
  callAIModels,
  startPremiumReminderCron
};