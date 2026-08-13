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

module.exports = router;