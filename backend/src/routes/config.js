// src/routes/config.js
const express = require('express');
const { Config } = require('../models');

const router = express.Router();

// Get public config (limited fields)
router.get('/', async (req, res) => {
  try {
    let config = await Config.findOne();
    if (!config) {
      config = new Config();
      await config.save();
    }
    const now = new Date();
    const offer = config.limitedOffer || {};
    const isOfferActive = offer.enabled && offer.discountPercent > 0 &&
      (!offer.startDate || new Date(offer.startDate) <= now) &&
      (!offer.endDate || new Date(offer.endDate) >= now);

    res.json({
      success: true,
      config: {
        appName: config.appName,
        freeExamLimit: config.freeExamLimit,
        defaultPassingScore: config.defaultPassingScore,
        showWeeklyQuiz: config.showWeeklyQuiz,
        showLeaderboard: config.showLeaderboard,
        maintenanceMode: config.maintenanceMode,
        maintenanceMessage: config.maintenanceMessage,
        limitedOffer: {
          enabled: offer.enabled || false,
          discountPercent: offer.discountPercent || 0,
          startDate: offer.startDate || null,
          endDate: offer.endDate || null,
          message: offer.message || '🔥 Limited Time Offer!',
          buttonText: offer.buttonText || 'Get Premium Now',
          buttonLink: offer.buttonLink || '/get-premium',
          targetAudience: offer.targetAudience || 'free',
          isActive: isOfferActive
        },
        showFreeMode: config.showFreeMode !== undefined ? config.showFreeMode : true,
        showPremiumMode: config.showPremiumMode !== undefined ? config.showPremiumMode : true,
        showStudyMode: config.showStudyMode !== undefined ? config.showStudyMode : true,
        showProgressSnapshot: config.showProgressSnapshot !== undefined ? config.showProgressSnapshot : true,
        showDownloadApp: config.showDownloadApp !== undefined ? config.showDownloadApp : true,
        gamification: {
          enabled: config.gamification?.enabled !== undefined ? config.gamification.enabled : true,
          showStreak: config.gamification?.showStreak !== undefined ? config.gamification.showStreak : true,
          showBadges: config.gamification?.showBadges !== undefined ? config.gamification.showBadges : true,
          streakResetHours: config.gamification?.streakResetHours || 24,
          showBadgesOnHome: config.gamification?.showBadgesOnHome !== undefined ? config.gamification.showBadgesOnHome : true,
          showStreakOnHome: config.gamification?.showStreakOnHome !== undefined ? config.gamification.showStreakOnHome : true
        }
      }
    });
  } catch (error) {
    console.error('Config fetch error:', error);
    res.status(500).json({ error: 'Failed to fetch config' });
  }
});

module.exports = router;