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

// ===== Reply to contact message (UPDATED: saves reply in DB) =====
router.post('/reply-message', isAdmin, async (req, res) => {
  try {
    const { to, name, originalMessage, reply, contactId } = req.body;

    // 1. Send the email
    const htmlContent = getReplyEmailTemplate(name, originalMessage, reply);
    const textContent = `Response to your message:\n\n${reply}\n\nOriginal message: ${originalMessage}`;
    const sendSmtpEmail = new SibApiV3Sdk.SendSmtpEmail();
    sendSmtpEmail.to = [{ email: to }];
    sendSmtpEmail.sender = { email: 'elitenursingcbt@gmail.com', name: 'ELITE Nursing CBT Support' };
    sendSmtpEmail.subject = `Response to your message - ELITE Nursing CBT`;
    sendSmtpEmail.textContent = textContent;
    sendSmtpEmail.htmlContent = htmlContent;
    await new SibApiV3Sdk.TransactionalEmailsApi().sendTransacEmail(sendSmtpEmail);

    // 2. Save the reply on the contact document
    if (contactId) {
      await Contact.findByIdAndUpdate(contactId, {
        adminReply: reply,
        adminReplyDate: new Date(),
        status: 'replied'
      });
    }

    console.log(`✅ Reply sent to ${to} and saved to database`);
    res.json({ success: true, message: 'Reply sent successfully' });
  } catch (error) {
    console.error('Reply error:', error);
    res.status(500).json({ error: 'Failed to send reply' });
  }
});

// ===== DELETE a contact message =====
router.delete('/contacts/:contactId', isAdmin, async (req, res) => {
  try {
    await Contact.findByIdAndDelete(req.params.contactId);
    res.json({ success: true, message: 'Message deleted' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete message' });
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

// ===== Broadcast email to free users =====
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

// ===== Get gamification settings =====
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

// ===== ADMIN BLOCK / UNLOCK ENDPOINTS =====

router.get('/blocked-users', isAdmin, async (req, res) => {
  try {
    const now = new Date();
    const blockedUsers = await User.find({
      manuallyBlocked: true,
      $or: [
        { manualBlockExpiry: { $gt: now } },
        { manualBlockExpiry: null }
      ]
    }).select('name email manuallyBlocked manualBlockExpiry manualBlockReason loginAttempts lockedUntil');
    res.json({ success: true, users: blockedUsers });
  } catch (error) {
    console.error('❌ Failed to fetch blocked users:', error);
    res.status(500).json({ error: 'Failed to fetch blocked users' });
  }
});

router.post('/block-user', isAdmin, async (req, res) => {
  try {
    const { email, duration, reason } = req.body;
    if (!email) return res.status(400).json({ error: 'Email is required' });
    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ error: 'User not found' });

    const { parseDuration } = require('../utils/rateLimitHelpers');
    const durationMs = parseDuration(duration);
    let expiry = null;
    if (durationMs !== null) {
      expiry = new Date(Date.now() + durationMs);
    }

    user.manuallyBlocked = true;
    user.manualBlockExpiry = expiry;
    user.manualBlockReason = reason || '';
    user.lockedUntil = null;
    user.loginAttempts = 0;
    await user.save();

    console.log(`🔒 Admin blocked ${user.email}${expiry ? ` until ${expiry.toISOString()}` : ' permanently'}`);
    res.json({ success: true, message: `User ${user.email} blocked${expiry ? ` until ${expiry.toISOString()}` : ' permanently'}.` });
  } catch (error) {
    console.error('❌ Block user error:', error);
    res.status(500).json({ error: 'Failed to block user' });
  }
});

router.post('/unblock-user', isAdmin, async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ error: 'Email is required' });
    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ error: 'User not found' });

    user.manuallyBlocked = false;
    user.manualBlockExpiry = null;
    user.manualBlockReason = '';
    await user.save();

    console.log(`🔓 Admin unblocked ${user.email}`);
    res.json({ success: true, message: `User ${user.email} unblocked.` });
  } catch (error) {
    console.error('❌ Unblock user error:', error);
    res.status(500).json({ error: 'Failed to unblock user' });
  }
});

router.get('/locked-users', isAdmin, async (req, res) => {
  try {
    const now = new Date();
    const lockedUsers = await User.find({
      lockedUntil: { $gt: now },
      loginAttempts: { $gt: 0 }
    }).select('name email loginAttempts lockedUntil');
    res.json({ success: true, users: lockedUsers });
  } catch (error) {
    console.error('❌ Failed to fetch locked users:', error);
    res.status(500).json({ error: 'Failed to fetch locked users' });
  }
});

router.post('/unlock-user', isAdmin, async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ error: 'Email is required' });
    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ error: 'User not found' });

    user.loginAttempts = 0;
    user.lockedUntil = null;
    await user.save();

    console.log(`🔓 Admin unlocked ${user.email}`);
    res.json({ success: true, message: `User ${user.email} unlocked.` });
  } catch (error) {
    console.error('❌ Unlock user error:', error);
    res.status(500).json({ error: 'Failed to unlock user' });
  }
});

module.exports = router;