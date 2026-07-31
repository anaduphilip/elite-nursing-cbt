// src/routes/admin.js
const express = require('express');
const { User, Contact } = require('../models');
const { isAdmin } = require('../middleware');
const { getReplyEmailTemplate } = require('../utils');
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

// ===== NEW: Admin generate verification OTP =====
router.post('/generate-verification-code', isAdmin, async (req, res) => {
  const { email } = req.body;
  if (!email) return res.status(400).json({ error: 'Email required' });
  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  otpStore.set(`verify_${email}`, { otp, expires: Date.now() + 10 * 60000 });
  console.log(`Admin generated OTP for ${email}: ${otp}`);
  res.json({ otp, message: 'Verification code generated successfully' });
});

// ===== NEW: Admin generate reset password OTP =====
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

module.exports = router;