// src/routes/gamification.js
const express = require('express');
const { User, Badge, Config } = require('../models');
const { authenticate } = require('../middleware');

const router = express.Router();

// Get user's badges and streak
router.get('/user', authenticate, async (req, res) => {
  try {
    const user = await User.findById(req.user._id).populate('badges.badgeId');
    const config = await Config.findOne();
    const gamification = config?.gamification || {};
    const allBadges = await Badge.find({ active: true }).sort({ order: 1 });
    const earnedBadgeIds = user.badges.map(b => b.badgeId?._id?.toString() || b.badgeId?.toString()).filter(Boolean);
    const badgesWithStatus = allBadges.map(badge => {
      const isEarned = earnedBadgeIds.includes(badge._id.toString());
      const earnedDate = user.badges.find(b => (b.badgeId?._id?.toString() || b.badgeId?.toString()) === badge._id.toString())?.earnedAt || null;
      return { ...badge.toObject(), isEarned, earnedAt: earnedDate };
    });
    res.json({
      success: true,
      streak: user.streak || 0,
      lastActivityDate: user.lastActivityDate,
      badges: badgesWithStatus,
      earnedBadgeIds: earnedBadgeIds,
      totalEarned: earnedBadgeIds.length,
      totalBadges: allBadges.length,
      gamificationEnabled: gamification.enabled !== false
    });
  } catch (error) {
    console.error('Gamification fetch error:', error);
    res.status(500).json({ error: 'Failed to fetch gamification data' });
  }
});

module.exports = router;