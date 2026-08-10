// src/routes/index.js
const express = require('express');
const { Config, User } = require('../models');
const { authenticate } = require('../middleware');
const { checkAndUpdatePremium } = require('../utils');

const authRoutes = require('./auth');
const quizRoutes = require('./quiz');
const adminRoutes = require('./admin');
const adminUsersRoutes = require('./admin-users');
const adminConfigRoutes = require('./admin-config');
const adminCategoriesRoutes = require('./admin-categories');
const adminCouponsRoutes = require('./admin-coupons');
const adminFaqsRoutes = require('./admin-faqs');
const adminStudyNotesRoutes = require('./admin-study-notes');
const adminAnnouncementRoutes = require('./admin-announcement');
const adminMarketingConsentRoutes = require('./admin-marketing-consent');
const adminWeeklyQuizRoutes = require('./admin-weekly-quiz');
const adminPreCouncilRoutes = require('./admin-pre-council');
const adminBadgesRoutes = require('./admin-badges');
const adminDashboardRoutes = require('./admin-dashboard');
const adminForceRefreshRoutes = require('./admin-force-refresh');
const adminQuizManagementRoutes = require('./admin-quiz-management');
const adminPremiumRoutes = require('./admin-premium');
const adminScheduledNotificationsRoutes = require('./admin-scheduled-notifications');
const weeklyQuizRoutes = require('./weekly-quiz');
const preCouncilRoutes = require('./pre-council');
const paymentRoutes = require('./payment');
const contactRoutes = require('./contact');
const announcementRoutes = require('./announcement');
const marketingConsentRoutes = require('./marketing-consent');
const privateMessageRoutes = require('./private-message');
const studyNotesRoutes = require('./study-notes');
const gamificationRoutes = require('./gamification');
const aiExplainRoutes = require('./ai-explain');
const userRoutes = require('./user');
const configRoutes = require('./config');
const categoriesRoutes = require('./categories');
const faqsRoutes = require('./faqs');
const notificationRoutes = require('./notification');
const studyPlanRoutes = require('./study-plan');
const premiumRoutes = require('./premium');
const referralRoutes = require('./referral');

const router = express.Router();

// ============ FORCE REFRESH (public) ============
router.get('/force-refresh', async (req, res) => {
  try {
    const config = await Config.findOne();
    if (!config) return res.json({ success: true, version: 0, message: '' });
    res.json({
      success: true,
      version: config.refreshVersion || 0,
      message: config.refreshMessage || 'A new version is available. Please refresh your page to continue.'
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch refresh status' });
  }
});

// ============ AI EXPLANATION REMAINING (uses authenticate) ============
router.get('/explanation-remaining', authenticate, async (req, res) => {
  if (req.user.isPremium) {
    return res.json({ remaining: Infinity, isPremium: true });
  }
  const today = new Date().toDateString();
  const lastReset = req.user.lastExplanationReset ? new Date(req.user.lastExplanationReset).toDateString() : null;
  if (lastReset !== today) {
    req.user.dailyExplanations = 0;
    req.user.lastExplanationReset = new Date();
    await req.user.save();
  }
  const limit = 10;
  const used = req.user.dailyExplanations || 0;
  const remaining = Math.max(0, limit - used);
  res.json({ remaining, isPremium: false });
});

// ============ VERIFY SESSION – FIXED ============
router.get('/verify-session', authenticate, async (req, res) => {
  try {
    const premiumStatus = await checkAndUpdatePremium(req.user);
    res.json({
      valid: true,
      user: {
        id: req.user._id,
        name: req.user.name,
        email: req.user.email,
        isPremium: premiumStatus.isPremium
      }
    });
  } catch (error) {
    res.status(401).json({ error: 'Invalid token' });
  }
});

// ============ MOUNT ROUTES ============
router.use('/', notificationRoutes);
router.use('/', authRoutes);
router.use('/quizzes', quizRoutes);

router.use('/admin', adminRoutes);
router.use('/admin/users', adminUsersRoutes);
router.use('/admin/config', adminConfigRoutes);
router.use('/admin/categories', adminCategoriesRoutes);
router.use('/admin/coupons', adminCouponsRoutes);
router.use('/admin/faqs', adminFaqsRoutes);
router.use('/admin/study-notes', adminStudyNotesRoutes);
router.use('/admin/announcement', adminAnnouncementRoutes);
router.use('/admin/marketing-consent', adminMarketingConsentRoutes);
router.use('/admin/weekly-quiz', adminWeeklyQuizRoutes);
router.use('/admin/weekly-quizzes', adminWeeklyQuizRoutes);
router.use('/admin/pre-council', adminPreCouncilRoutes);
router.use('/admin/badges', adminBadgesRoutes);
router.use('/admin/dashboard', adminDashboardRoutes);
router.use('/admin/force-refresh', adminForceRefreshRoutes);
router.use('/admin/quizzes', adminQuizManagementRoutes);
router.use('/admin', adminPremiumRoutes);
router.use('/admin', adminScheduledNotificationsRoutes);

router.use('/weekly-quiz', weeklyQuizRoutes);
router.use('/pre-council', preCouncilRoutes);
router.use('/', paymentRoutes);
router.use('/contact', contactRoutes);
router.use('/announcement', announcementRoutes);
router.use('/marketing-consent', marketingConsentRoutes);
router.use('/private-messages', privateMessageRoutes);
router.use('/study-notes', studyNotesRoutes);
router.use('/gamification', gamificationRoutes);
router.use('/explain-question', aiExplainRoutes);
router.use('/user', userRoutes);
router.use('/study-plan', studyPlanRoutes);
router.use('/referral', referralRoutes);
router.use('/config', configRoutes);
router.use('/categories', categoriesRoutes);
router.use('/faqs', faqsRoutes);
router.use('/', premiumRoutes);

module.exports = router;