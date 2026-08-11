// src/routes/referral.js
const express = require('express');
const { User } = require('../models');
const { authenticate } = require('../middleware');

const router = express.Router();

// Helper to generate a unique referral code
const generateReferralCode = () => {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 8; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return `ELITE-${code}`;
};

// ---- Get or generate referral code ----
router.get('/code', authenticate, async (req, res) => {
  try {
    const user = req.user;
    if (!user.referralCode) {
      let code;
      let exists = true;
      while (exists) {
        code = generateReferralCode();
        const existing = await User.findOne({ referralCode: code });
        if (!existing) exists = false;
      }
      user.referralCode = code;
      await user.save();
    }
    res.json({ success: true, referralCode: user.referralCode });
  } catch (error) {
    console.error('Referral code error:', error);
    res.status(500).json({ error: 'Failed to generate referral code' });
  }
});

// ---- Apply referral code (during registration) ----
router.post('/apply', async (req, res) => {
  try {
    const { referralCode, newUserId } = req.body;
    if (!referralCode || !newUserId) {
      return res.status(400).json({ error: 'Referral code and user ID are required' });
    }

    const referrer = await User.findOne({ referralCode: referralCode.toUpperCase() });
    if (!referrer) {
      return res.status(404).json({ error: 'Invalid referral code' });
    }

    if (referrer._id.toString() === newUserId) {
      return res.status(400).json({ error: 'You cannot refer yourself' });
    }

    const newUser = await User.findById(newUserId);
    if (!newUser) {
      return res.status(404).json({ error: 'User not found' });
    }

    if (newUser.referredBy) {
      return res.status(400).json({ error: 'You have already used a referral code' });
    }

    // ---- 1. Link the referral ----
    newUser.referredBy = referrer._id;
    await newUser.save();

    // ---- 2. Reward referrer with +1 day Premium (instant) ----
    let expiry = referrer.premiumExpiry && referrer.premiumExpiry > new Date() 
      ? referrer.premiumExpiry 
      : new Date();
    expiry.setDate(expiry.getDate() + 1);
    
    referrer.isPremium = true;
    referrer.premiumExpiry = expiry;
    referrer.premiumPlan = 'daily';
    referrer.referralCount = (referrer.referralCount || 0) + 1;
    referrer.referralRewards.push({
      rewardedAt: new Date(),
      type: 'premium_days',
      value: 1
    });
    await referrer.save();

    // ---- 3. Give referred user a 10% discount (valid 24 hours) ----
    const discountCode = `REF-${newUserId.slice(-6).toUpperCase()}-${Date.now().toString(36).toUpperCase()}`;
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    newUser.referralDiscount = {
      code: discountCode,
      discountPercent: 10,
      expiresAt: expiresAt,
      used: false
    };
    await newUser.save();

    res.json({ 
      success: true, 
      message: '🎉 Referral applied! You got 1 free Premium day. The referred user also gets 10% off their first purchase (valid 24h).'
    });
  } catch (error) {
    console.error('Referral apply error:', error);
    res.status(500).json({ error: 'Failed to apply referral' });
  }
});

// ---- Get referral stats ----
router.get('/stats', authenticate, async (req, res) => {
  try {
    const user = req.user;
    const referredUsers = await User.find({ referredBy: user._id }).select('name email createdAt');
    res.json({
      success: true,
      referralCode: user.referralCode,
      referralCount: user.referralCount || 0,
      referralRewards: user.referralRewards || [],
      referredUsers: referredUsers || []
    });
  } catch (error) {
    console.error('Referral stats error:', error);
    res.status(500).json({ error: 'Failed to fetch referral stats' });
  }
});

// ---- Get active referral discount for the logged-in user ----
router.get('/discount', authenticate, async (req, res) => {
  try {
    const user = req.user;
    const discount = user.referralDiscount;

    if (!discount || !discount.code || discount.used) {
      return res.json({ success: true, active: false });
    }

    if (discount.expiresAt && new Date(discount.expiresAt) < new Date()) {
      // Expired – mark as used
      user.referralDiscount = { code: null, discountPercent: 0, expiresAt: null, used: true };
      await user.save();
      return res.json({ success: true, active: false });
    }

    res.json({
      success: true,
      active: true,
      code: discount.code,
      discountPercent: discount.discountPercent,
      expiresAt: discount.expiresAt
    });
  } catch (error) {
    console.error('Get referral discount error:', error);
    res.status(500).json({ error: 'Failed to fetch discount' });
  }
});

module.exports = router;