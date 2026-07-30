// src/routes/admin-config.js
const express = require('express');
const { Config } = require('../models');
const { isAdmin } = require('../middleware');

const router = express.Router();

// Get full config
router.get('/', isAdmin, async (req, res) => {
  try {
    let config = await Config.findOne();
    if (!config) {
      config = new Config();
      await config.save();
    }
    res.json({ success: true, config });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch config' });
  }
});

// Update config
router.put('/', isAdmin, async (req, res) => {
  try {
    let config = await Config.findOne();
    if (!config) config = new Config();

    const allowedFields = [
      'premiumDailyPrice', 'premiumMonthlyPrice', 'premiumYearlyPrice',
      'freeExamLimit', 'defaultPassingScore', 'maintenanceMode',
      'maintenanceMessage', 'appName', 'appLogo', 'contactEmail',
      'contactPhone', 'defaultTimeLimit', 'showWeeklyQuiz', 'showLeaderboard',
      'showFreeMode', 'showPremiumMode', 'showStudyMode',
      'showProgressSnapshot', 'showDownloadApp'
    ];
    for (const field of allowedFields) {
      if (req.body[field] !== undefined) {
        config[field] = req.body[field];
      }
    }

    if (req.body.limitedOffer) {
      const offer = req.body.limitedOffer;
      if (!config.limitedOffer) config.limitedOffer = {};
      if (offer.enabled !== undefined) config.limitedOffer.enabled = offer.enabled;
      if (offer.discountPercent !== undefined) config.limitedOffer.discountPercent = offer.discountPercent;
      if (offer.startDate !== undefined) config.limitedOffer.startDate = offer.startDate ? new Date(offer.startDate) : null;
      if (offer.endDate !== undefined) config.limitedOffer.endDate = offer.endDate ? new Date(offer.endDate) : null;
      if (offer.message !== undefined) config.limitedOffer.message = offer.message;
      if (offer.buttonText !== undefined) config.limitedOffer.buttonText = offer.buttonText;
      if (offer.buttonLink !== undefined) config.limitedOffer.buttonLink = offer.buttonLink;
      if (offer.targetAudience !== undefined) config.limitedOffer.targetAudience = offer.targetAudience;
    }

    if (req.body.gamification) {
      const gam = req.body.gamification;
      if (!config.gamification) config.gamification = {};
      if (gam.enabled !== undefined) config.gamification.enabled = gam.enabled;
      if (gam.showStreak !== undefined) config.gamification.showStreak = gam.showStreak;
      if (gam.showBadges !== undefined) config.gamification.showBadges = gam.showBadges;
      if (gam.streakResetHours !== undefined) config.gamification.streakResetHours = gam.streakResetHours;
      if (gam.showBadgesOnHome !== undefined) config.gamification.showBadgesOnHome = gam.showBadgesOnHome;
      if (gam.showStreakOnHome !== undefined) config.gamification.showStreakOnHome = gam.showStreakOnHome;
    }

    config.updatedAt = new Date();
    await config.save();
    res.json({ success: true, config });
  } catch (error) {
    console.error('Config update error:', error);
    res.status(500).json({ error: 'Failed to update config' });
  }
});

module.exports = router;