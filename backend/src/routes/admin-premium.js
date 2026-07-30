// src/routes/admin-premium.js
const express = require('express');
const { User } = require('../models');
const { isAdmin } = require('../middleware');

const router = express.Router();

// Set premium plan
router.post('/set-premium-plan', isAdmin, async (req, res) => {
  try {
    const { userId, planType } = req.body;
    if (!userId || !planType) return res.status(400).json({ error: 'Missing userId or planType' });
    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ error: 'User not found' });
    if (planType === 'none') {
      await User.updateOne({ _id: userId }, { $set: { isPremium: false, premiumPlan: null, premiumExpiry: null } });
      const updated = await User.findById(userId);
      return res.json({ success: true, message: 'Premium removed', user: updated });
    }
    const validPlans = ['daily', 'monthly', 'yearly'];
    if (!validPlans.includes(planType)) return res.status(400).json({ error: 'Invalid plan type' });
    let expiryDate = user.premiumExpiry && user.premiumExpiry > new Date() ? user.premiumExpiry : new Date();
    switch(planType) {
      case 'daily': expiryDate.setDate(expiryDate.getDate() + 1); break;
      case 'monthly': expiryDate.setMonth(expiryDate.getMonth() + 1); break;
      case 'yearly': expiryDate.setFullYear(expiryDate.getFullYear() + 1); break;
    }
    await User.updateOne({ _id: userId }, { $set: { isPremium: true, premiumPlan: planType, premiumExpiry: expiryDate, purchaseDate: new Date() } });
    const updated = await User.findById(userId);
    res.json({ success: true, message: `Premium ${planType} plan applied until ${expiryDate.toISOString()}`, user: updated });
  } catch (error) {
    console.error('Set premium plan error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Add premium time manually
router.post('/add-premium-time', isAdmin, async (req, res) => {
  try {
    const { userId, planType, customDays, customHours } = req.body;
    if (!userId) return res.status(400).json({ error: 'User ID is required' });
    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ error: 'User not found' });
    let expiry = user.premiumExpiry && user.premiumExpiry > new Date() ? user.premiumExpiry : new Date();
    if (planType) {
      switch(planType) {
        case 'daily': expiry.setDate(expiry.getDate() + 1); break;
        case 'monthly': expiry.setMonth(expiry.getMonth() + 1); break;
        case 'yearly': expiry.setFullYear(expiry.getFullYear() + 1); break;
        default: return res.status(400).json({ error: 'Invalid plan type' });
      }
    } else if (customDays || customHours) {
      if (customDays) expiry.setDate(expiry.getDate() + parseInt(customDays));
      if (customHours) expiry.setHours(expiry.getHours() + parseInt(customHours));
    } else {
      return res.status(400).json({ error: 'Must provide planType or custom days/hours' });
    }
    await User.updateOne({ _id: userId }, { $set: { isPremium: true, premiumExpiry: expiry, premiumPlan: planType || user.premiumPlan } });
    const updated = await User.findById(userId);
    res.json({ success: true, message: `Premium extended until ${expiry.toISOString()}`, newExpiry: expiry, user: updated });
  } catch (error) {
    console.error('Manual premium adjustment error:', error);
    res.status(500).json({ error: 'Failed to adjust premium' });
  }
});

module.exports = router;