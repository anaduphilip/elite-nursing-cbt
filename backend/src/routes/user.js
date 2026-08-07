// src/routes/user.js
const express = require('express');
const { User } = require('../models');
const { authenticate } = require('../middleware');
const { checkAndUpdatePremium } = require('../utils');

const router = express.Router();

// Get user profile
router.get('/profile', authenticate, async (req, res) => {
  const premiumStatus = await checkAndUpdatePremium(req.user);
  res.json({
    id: req.user._id,
    name: req.user.name,
    isPremium: premiumStatus.isPremium,
    premiumPlan: premiumStatus.plan,
    premiumExpiry: premiumStatus.expiry,
    email: req.user.email,
    isVerified: req.user.isVerified,
    marketingConsent: req.user.marketingConsent
  });
});

// Update user profile (name)
router.put('/profile', authenticate, async (req, res) => {
  try {
    const { name } = req.body;
    if (!name || name.trim().length === 0) {
      return res.status(400).json({ error: 'Name cannot be empty' });
    }
    req.user.name = name.trim();
    await req.user.save();
    const updatedUser = req.user.toObject();
    delete updatedUser.password;
    res.json(updatedUser);
  } catch (error) {
    console.error('Profile update error:', error);
    res.status(500).json({ error: 'Failed to update profile' });
  }
});

// Check exam access
router.post('/check-exam-access', authenticate, async (req, res) => {
  const { examId, sectionNumber } = req.body;
  if (req.user.isPremium) return res.json({ hasAccess: true });
  const hasPurchased = req.user.purchasedExams.some(p => p.examId === examId && p.sectionNumber === sectionNumber);
  res.json({ hasAccess: hasPurchased });
});

// ===== Get user's full exam history (with answers & questions) =====
router.get('/history', authenticate, async (req, res) => {
  try {
    res.json({ success: true, history: req.user.quizResults });
  } catch (error) {
    console.error('Fetch history error:', error);
    res.status(500).json({ error: 'Failed to fetch history' });
  }
});

// ===== DELETE all history =====
router.delete('/history', authenticate, async (req, res) => {
  try {
    await User.findByIdAndUpdate(req.user._id, { $set: { quizResults: [] } });
    res.json({ success: true, message: 'All history cleared.' });
  } catch (error) {
    console.error('Clear history error:', error);
    res.status(500).json({ error: error.message });
  }
});

// ===== DELETE a specific attempt =====
router.delete('/history/:quizId', authenticate, async (req, res) => {
  try {
    const { quizId } = req.params;
    await User.findByIdAndUpdate(req.user._id, { $pull: { quizResults: { quizId: quizId } } });
    res.json({ success: true, message: 'Attempt deleted.' });
  } catch (error) {
    console.error('Delete attempt error:', error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;