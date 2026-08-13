// src/routes/admin.js
const express = require('express');
const { User, Contact } = require('../models');
const { isAdmin } = require('../middleware');
const { getReplyEmailTemplate, sendMarketingEmail } = require('../utils');
const SibApiV3Sdk = require('sib-api-v3-sdk');
const otpStore = require('../utils/otpStore');

const router = express.Router();

// Get all users
router.get('/users', isAdmin, async (req, res) => {
  try {
    const users = await User.find().select('-password').sort({ createdAt: -1 });
    res.json(users);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get all contacts
router.get('/contacts', isAdmin, async (req, res) => {
  try {
    const contacts = await Contact.find().sort({ createdAt: -1 });
    res.json(contacts);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Delete user
router.delete('/users/:userId', isAdmin, async (req, res) => {
  try {
    await User.findByIdAndDelete(req.params.userId);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Reply to contact message
router.post('/reply-message', isAdmin, async (req, res) => {
  try {
    const { to, name, originalMessage, reply } = req.body;
    const htmlContent = getReplyEmailTemplate(name, originalMessage, reply);
    const textContent = `Response to your message:\n\n${reply}\n\nOriginal message: ${originalMessage}`;
    const sendSmtpEmail = new SibApiV3Sdk.SendSmtpEmail();
    sendSmtpEmail.to = [{ email: to }];
    sendSmtpEmail.sender = { email: 'elitenursingcbt@gmail.com', name: 'ELITE Nursing CBT Support' };
    sendSmtpEmail.subject = `Response to your message - ELITE Nursing CBT`;
    sendSmtpEmail.textContent = textContent;
    sendSmtpEmail.htmlContent = htmlContent;
    await new SibApiV3Sdk.TransactionalEmailsApi().sendTransacEmail(sendSmtpEmail);
    console.log(`✅ Reply sent to ${to}`);
    res.json({ success: true, message: 'Reply sent successfully' });
  } catch (error) {
    console.error('Reply error:', error);
    res.status(500).json({ error: 'Failed to send reply' });
  }
});

// ===== Admin generate verification OTP =====
router.post('/generate-verification-code', isAdmin, async (req, res) => {
  const { email } = req.body;
  if (!email) return res.status(400).json({ error: 'Email required' });
  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  otpStore.set(`verify_${email}`, { otp, expires: Date.now() + 10 * 60000 });
  console.log(`Admin generated OTP for ${email}: ${otp}`);
  res.json({ otp, message: 'Verification code generated successfully' });
});

// ===== Admin generate reset password OTP =====
router.post('/generate-reset-code', isAdmin, async (req, res) => {
  const { email } = req.body;
  if (!email) return res.status(400).json({ error: 'Email required' });
  const user = await User.findOne({ email });
  if (!user) return res.status(404).json({ error: 'User not found' });
  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  otpStore.set(`reset_${email}`, { otp, expires: Date.now() + 10 * 60000, name: user.name });
  console.log(`Admin generated reset OTP for ${email}: ${otp}`);
  res.json({ otp, message: 'Reset code generated successfully' });
});

// ===== NEW: Broadcast email to free users =====
router.post('/broadcast-email', isAdmin, async (req, res) => {
  try {
    const { subject, message, templateType } = req.body;
    const freeUsers = await User.find({
      isPremium: false,
      isVerified: true,
      marketingConsent: true
    });

    if (freeUsers.length === 0) {
      return res.json({ success: true, sent: 0, message: 'No eligible free users found.' });
    }

    let successCount = 0;
    const failures = [];

    for (const user of freeUsers) {
      try {
        const sent = await sendMarketingEmail(
          user.email,
          user.name,
          templateType || 'upgrade',
          subject || null,
          message || null
        );
        if (sent) {
          successCount++;
          user.lastMarketingEmailSent = new Date();
          await user.save();
        }
      } catch (err) {
        failures.push(user.email);
      }
    }

    res.json({
      success: true,
      sent: successCount,
      total: freeUsers.length,
      failures: failures,
      message: `Sent to ${successCount} out of ${freeUsers.length} users.`
    });
  } catch (error) {
    console.error('Broadcast error:', error);
    res.status(500).json({ error: 'Failed to send broadcast' });
  }
});

// ===== NEW: Get gamification settings =====
router.get('/gamification-settings', isAdmin, async (req, res) => {
  try {
    const { Config } = require('../models');
    const config = await Config.findOne();
    res.json({
      success: true,
      settings: config?.gamification || {
        enabled: true,
        showStreak: true,
        showBadges: true,
        streakResetHours: 24,
        showBadgesOnHome: true,
        showStreakOnHome: true
      }
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch gamification settings' });
  }
});

// ---- Get referral dashboard stats ----
router.get('/referral/stats', isAdmin, async (req, res) => {
  try {
    const totalReferrals = await User.aggregate([
      { $group: { _id: null, total: { $sum: '$referralCount' } } }
    ]);
    const activeReferrers = await User.countDocuments({ referralCount: { $gt: 0 } });
    const totalPremiumDays = await User.aggregate([
      { $unwind: { path: '$referralRewards', preserveNullAndEmptyArrays: true } },
      { $group: { _id: null, total: { $sum: '$referralRewards.value' } } }
    ]);
    res.json({
      success: true,
      stats: {
        totalReferrals: totalReferrals[0]?.total || 0,
        activeReferrers,
        totalPremiumDays: totalPremiumDays[0]?.total || 0,
      }
    });
  } catch (error) {
    console.error('Referral stats error:', error);
    res.status(500).json({ error: 'Failed to fetch referral stats' });
  }
});

// ---- Get all users with referral data (with search & sorting) ----
router.get('/referral/users', isAdmin, async (req, res) => {
  try {
    const { search, sortBy, order } = req.query;
    const sort = {};
    if (sortBy) {
      sort[sortBy] = order === 'desc' ? -1 : 1;
    } else {
      sort.referralCount = -1;
    }
    const query = {};
    if (search) {
      query.$or = [
        { email: { $regex: search, $options: 'i' } },
        { name: { $regex: search, $options: 'i' } },
        { referralCode: { $regex: search, $options: 'i' } }
      ];
    }
    const users = await User.find(query)
      .select('name email referralCode referralCount referralRewards referredBy premiumExpiry isPremium createdAt')
      .sort(sort)
      .limit(100);
    res.json({ success: true, users });
  } catch (error) {
    console.error('Referral users error:', error);
    res.status(500).json({ error: 'Failed to fetch referral users' });
  }
});

// ---- Get detailed referral history for a specific user ----
router.get('/referral/users/:userId/history', isAdmin, async (req, res) => {
  try {
    const user = await User.findById(req.params.userId)
      .select('name email referralCode referralCount referralRewards');
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    const referredUsers = await User.find({ referredBy: req.params.userId })
      .select('name email createdAt');
    res.json({
      success: true,
      user,
      referredUsers
    });
  } catch (error) {
    console.error('Referral history error:', error);
    res.status(500).json({ error: 'Failed to fetch referral history' });
  }
});

// ---- Manually reward a referrer with premium days ----
router.post('/referral/users/:userId/reward', isAdmin, async (req, res) => {
  try {
    const { days } = req.body;
    if (!days || days <= 0) {
      return res.status(400).json({ error: 'Valid days required' });
    }
    const user = await User.findById(req.params.userId);
    if (!user) return res.status(404).json({ error: 'User not found' });

    let expiry = user.premiumExpiry && user.premiumExpiry > new Date()
      ? user.premiumExpiry
      : new Date();
    expiry.setDate(expiry.getDate() + days);

    user.isPremium = true;
    user.premiumExpiry = expiry;
    user.premiumPlan = 'daily';
    user.referralRewards.push({
      rewardedAt: new Date(),
      type: 'premium_days',
      value: days
    });
    await user.save();

    res.json({
      success: true,
      message: `✅ ${days} premium day(s) added to ${user.email}`,
      newExpiry: expiry
    });
  } catch (error) {
    console.error('Manual reward error:', error);
    res.status(500).json({ error: 'Failed to reward user' });
  }
});

module.exports = router;