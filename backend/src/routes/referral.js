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
      console.log(`✅ [REFERRAL] Code generated for ${user.email}: ${code}`);
    }
    res.json({ success: true, referralCode: user.referralCode });
  } catch (error) {
    console.error('❌ [REFERRAL] Code generation error:', error);
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

    // Find referrer
    const referrer = await User.findOne({ referralCode: referralCode.toUpperCase() });
    if (!referrer) {
      console.log(`❌ [REFERRAL] Invalid code: ${referralCode}`);
      return res.status(404).json({ error: 'Invalid referral code' });
    }

    // Prevent self-referral
    if (referrer._id.toString() === newUserId) {
      console.log(`❌ [REFERRAL] Self-referral attempt by ${referrer.email}`);
      return res.status(400).json({ error: 'You cannot refer yourself' });
    }

    // Find new user
    const newUser = await User.findById(newUserId);
    if (!newUser) {
      console.log(`❌ [REFERRAL] New user not found: ${newUserId}`);
      return res.status(404).json({ error: 'User not found' });
    }

    // Check if new user already used a referral
    if (newUser.referredBy) {
      console.log(`⚠️ [REFERRAL] ${newUser.email} already used a referral`);
      return res.status(400).json({ error: 'You have already used a referral code' });
    }

    // ---- Link the referral ----
    newUser.referredBy = referrer._id;
    await newUser.save();

    // ---- Give referred user a 10% discount (valid 24 hours) ----
    const discountCode = `REF-${newUserId.slice(-6).toUpperCase()}-${Date.now().toString(36).toUpperCase()}`;
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);

    newUser.referralDiscount = {
      code: discountCode,
      discountPercent: 10,
      expiresAt: expiresAt,
      used: false
    };
    await newUser.save();

    console.log(`✅ [REFERRAL] ${newUser.email} → ${referrer.email} | 10% discount applied`);

    res.json({ 
      success: true, 
      message: '🎉 Referral applied! You get 10% off your first purchase (valid 24h).'
    });

  } catch (error) {
    console.error('❌ [REFERRAL] Apply error:', error);
    res.status(500).json({ error: 'Failed to apply referral' });
  }
});

// ---- Get referral stats (DYNAMIC – counts only active, verified, non‑deleted users) ----
router.get('/stats', authenticate, async (req, res) => {
  try {
    const user = req.user;

    // All users who signed up using this user's referral code
    // Exclude soft‑deleted and unverified accounts
    const referredUsers = await User.find({
      referredBy: user._id,
      isDeleted: { $ne: true },        // not soft‑deleted
      isVerified: true                 // email verified
    }).select('name email createdAt isPremium referralBonusClaimed');

    const totalReferred = referredUsers.length;

    // Rewards already earned (from referralRewards array)
    const rewardCount = user.referralRewards?.length || 0;
    const totalFreeDays = user.referralRewards?.reduce((sum, r) => sum + (r.value || 0), 0) || 0;

    res.json({
      success: true,
      referralCode: user.referralCode,
      totalReferred,
      rewardCount,
      totalFreeDays,
      referredUsers: referredUsers.map(u => ({
        id: u._id,
        name: u.name,
        email: u.email,
        createdAt: u.createdAt,
        isPremium: u.isPremium,
        bonusClaimed: u.referralBonusClaimed || false   // 👈 whether the bonus has been given
      }))
    });
  } catch (error) {
    console.error('❌ [REFERRAL] Stats error:', error);
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
      user.referralDiscount = { code: null, discountPercent: 0, expiresAt: null, used: true };
      await user.save();
      console.log(`⏰ [REFERRAL] Discount expired for ${user.email}`);
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
    console.error('❌ [REFERRAL] Discount fetch error:', error);
    res.status(500).json({ error: 'Failed to fetch discount' });
  }
});

module.exports = router;