// src/routes/index.js
const express = require('express');
const jwt = require('jsonwebtoken');
const { Config, User } = require('../models');
const { authenticate } = require('../middleware');
const { JWT_SECRET, checkAndUpdatePremium } = require('../utils');

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
const notificationRoutes = require('./notification');   // NEW

const router = express.Router();

// ---- PUBLIC ROUTES (must match original paths) ----
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

// ---- VERIFY SESSION (public, but uses token) ----
router.get('/verify-session', async (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) return res.status(401).json({ error: 'No token' });
    const decoded = jwt.verify(token, JWT_SECRET);
    const user = await User.findById(decoded.userId);
    if (!user) return res.status(401).json({ error: 'User not found' });
    if (user.currentSessionToken !== decoded.sessionToken) {
      return res.status(401).json({ error: 'Session expired. You have been logged out from another device.' });
    }
    const premiumStatus = await checkAndUpdatePremium(user);
    res.json({
      valid: true,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        isPremium: premiumStatus.isPremium
      }
    });
  } catch (error) {
    res.status(401).json({ error: 'Invalid token' });
  }
});

// ---- NOTIFICATION ROUTES (mounted at root) ----
router.use('/', notificationRoutes);

// ---- AUTH ----
router.use('/auth', authRoutes);

// ---- QUIZ (user) ----
router.use('/quizzes', quizRoutes);

// ---- ADMIN ----
router.use('/admin', adminRoutes);
router.use('/admin/users', adminUsersRoutes);
router.use('/admin/config', adminConfigRoutes);
router.use('/admin/categories', adminCategoriesRoutes);
router.use('/admin/coupons', adminCouponsRoutes);
router.use('/admin/faqs', adminFaqsRoutes);
router.use('/admin/study-notes', adminStudyNotesRoutes);
router.use('/admin/announcement', adminAnnouncementRoutes);
router.use('/admin/marketing-consent', adminMarketingConsentRoutes);
router.use('/admin/weekly-quizzes', adminWeeklyQuizRoutes);   // plural
router.use('/admin/pre-council', adminPreCouncilRoutes);
router.use('/admin/badges', adminBadgesRoutes);
router.use('/admin/dashboard', adminDashboardRoutes);
router.use('/admin/force-refresh', adminForceRefreshRoutes);
router.use('/admin/quizzes', adminQuizManagementRoutes);
router.use('/admin/premium', adminPremiumRoutes);

// ---- WEEKLY QUIZ (user) ----
router.use('/weekly-quiz', weeklyQuizRoutes);

// ---- PRE COUNCIL (user) ----
router.use('/pre-council', preCouncilRoutes);

// ---- PAYMENT ----
router.use('/payment', paymentRoutes);

// ---- CONTACT ----
router.use('/contact', contactRoutes);

// ---- ANNOUNCEMENT (public) ----
router.use('/announcement', announcementRoutes);

// ---- MARKETING CONSENT ----
router.use('/marketing-consent', marketingConsentRoutes);

// ---- PRIVATE MESSAGES ----
router.use('/private-messages', privateMessageRoutes);

// ---- STUDY NOTES ----
router.use('/study-notes', studyNotesRoutes);

// ---- GAMIFICATION ----
router.use('/gamification', gamificationRoutes);

// ---- AI EXPLANATION ----
router.use('/explain-question', aiExplainRoutes);

// ---- USER PROFILE ----
router.use('/user', userRoutes);

// ---- CONFIG (public) ----
router.use('/config', configRoutes);

// ---- CATEGORIES (public) ----
router.use('/categories', categoriesRoutes);

// ---- FAQS (public) ----
router.use('/faqs', faqsRoutes);

module.exports = router;