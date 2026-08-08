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

// ===== Get user's full exam history (excluding deleted) =====
router.get('/history', authenticate, async (req, res) => {
  try {
    const history = req.user.quizResults.filter(entry => !entry.deleted);
    res.json({ success: true, history });
  } catch (error) {
    console.error('Fetch history error:', error);
    res.status(500).json({ error: 'Failed to fetch history' });
  }
});

// ===== SOFT DELETE all history =====
router.delete('/history', authenticate, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    user.quizResults.forEach(entry => { entry.deleted = true; });
    await user.save();
    res.json({ success: true, message: 'All history marked as deleted.' });
  } catch (error) {
    console.error('Soft delete error:', error);
    res.status(500).json({ error: error.message });
  }
});

// ===== SOFT DELETE a specific attempt =====
router.delete('/history/:quizId', authenticate, async (req, res) => {
  try {
    const { quizId } = req.params;
    const user = await User.findById(req.user._id);
    const entry = user.quizResults.find(e => e.quizId === quizId);
    if (entry) entry.deleted = true;
    await user.save();
    res.json({ success: true, message: 'Attempt marked as deleted.' });
  } catch (error) {
    console.error('Delete attempt error:', error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;