// src/routes/admin-badges.js
const express = require('express');
const { Badge, User } = require('../models');
const { isAdmin } = require('../middleware');

const router = express.Router();

// Get all badges
router.get('/', isAdmin, async (req, res) => {
  try {
    const badges = await Badge.find().sort({ order: 1 });
    res.json({ success: true, badges });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch badges' });
  }
});

// Create badge
router.post('/', isAdmin, async (req, res) => {
  try {
    const { name, icon, description, requirementType, targetCategory, targetQuizId, requirementValue, active, order } = req.body;
    if (!name || !requirementType || !requirementValue) {
      return res.status(400).json({ error: 'Name, requirement type, and requirement value are required' });
    }
    const badge = new Badge({
      name,
      icon: icon || '🏅',
      description: description || '',
      requirementType,
      targetCategory: targetCategory || null,
      targetQuizId: targetQuizId || null,
      requirementValue,
      active: active !== undefined ? active : true,
      order: order || 0
    });
    await badge.save();
    res.json({ success: true, badge });
  } catch (error) {
    console.error('Badge create error:', error);
    res.status(500).json({ error: 'Failed to create badge' });
  }
});

// Update badge
router.put('/:id', isAdmin, async (req, res) => {
  try {
    const { name, icon, description, requirementType, targetCategory, targetQuizId, requirementValue, active, order } = req.body;
    const badge = await Badge.findById(req.params.id);
    if (!badge) return res.status(404).json({ error: 'Badge not found' });
    if (name) badge.name = name;
    if (icon !== undefined) badge.icon = icon;
    if (description !== undefined) badge.description = description;
    if (requirementType) badge.requirementType = requirementType;
    if (targetCategory !== undefined) badge.targetCategory = targetCategory;
    if (targetQuizId !== undefined) badge.targetQuizId = targetQuizId;
    if (requirementValue !== undefined) badge.requirementValue = requirementValue;
    if (active !== undefined) badge.active = active;
    if (order !== undefined) badge.order = order;
    await badge.save();
    res.json({ success: true, badge });
  } catch (error) {
    console.error('Badge update error:', error);
    res.status(500).json({ error: 'Failed to update badge' });
  }
});

// Delete badge
router.delete('/:id', isAdmin, async (req, res) => {
  try {
    const badge = await Badge.findByIdAndDelete(req.params.id);
    if (!badge) return res.status(404).json({ error: 'Badge not found' });
    res.json({ success: true, message: 'Badge deleted' });
  } catch (error) {
    console.error('Badge delete error:', error);
    res.status(500).json({ error: 'Failed to delete badge' });
  }
});

// Award badge to user
router.post('/users/:userId/award-badge/:badgeId', isAdmin, async (req, res) => {
  try {
    const user = await User.findById(req.params.userId);
    if (!user) return res.status(404).json({ error: 'User not found' });
    const badge = await Badge.findById(req.params.badgeId);
    if (!badge) return res.status(404).json({ error: 'Badge not found' });
    const alreadyHas = user.awardedBadgeIds && user.awardedBadgeIds.some(id => id.toString() === req.params.badgeId);
    if (alreadyHas) return res.json({ success: false, message: 'User already has this badge' });
    user.badges.push({ badgeId: badge._id, earnedAt: new Date() });
    user.awardedBadgeIds.push(badge._id);
    await user.save();
    res.json({ success: true, message: `Badge "${badge.name}" awarded to ${user.email}`, badge });
  } catch (error) {
    console.error('Manual badge award error:', error);
    res.status(500).json({ error: 'Failed to award badge' });
  }
});

module.exports = router;