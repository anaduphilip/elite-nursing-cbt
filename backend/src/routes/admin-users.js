// src/routes/admin-users.js
const express = require('express');
const mongoose = require('mongoose');
const { User, Quiz, Badge } = require('../models');
const { isAdmin } = require('../middleware');
const { sendEmail, generateOTP } = require('../utils');
const jwt = require('jsonwebtoken');
const SibApiV3Sdk = require('sib-api-v3-sdk');
const otpStore = require('../utils/otpStore');

const router = express.Router();

// ---- Get user profile with full details ----
router.get('/:userId', isAdmin, async (req, res) => {
  try {
    const user = await User.findById(req.params.userId).select('-password');
    if (!user) return res.status(404).json({ error: 'User not found' });

    // ---- Stats ----
    const totalExams = user.quizResults.length;
    let passed = 0, failed = 0;
    for (const r of user.quizResults) {
      if (r.percentage >= 70) passed++;
      else failed++;
    }
    const passRate = totalExams > 0 ? Math.round((passed / totalExams) * 100) : 0;
    const badgesCount = user.badges?.length || 0;
    const streak = user.streak || 0;

    // ---- Transactions ----
    const transactions = user.transactions
      .filter(t => t.status === 'completed')
      .sort((a, b) => new Date(b.date) - new Date(a.date))
      .slice(0, 20)
      .map(t => ({
        date: t.date,
        planType: t.planType || 'premium',
        amount: t.amount,
        status: t.status,
        couponCode: t.couponCode || null,
        discountAmount: t.discountAmount || 0
      }));

    // ---- Quiz History with titles, category & topic ----
    const quizHistory = await Promise.all(
      user.quizResults
        .sort((a, b) => new Date(b.date) - new Date(a.date))
        .slice(0, 30)
        .map(async (result) => {
          let quizTitle = result.title || 'Unknown Quiz';
          if (!result.title && mongoose.Types.ObjectId.isValid(result.quizId)) {
            try {
              const quiz = await Quiz.findById(result.quizId);
              if (quiz) quizTitle = quiz.title;
            } catch (e) {}
          }
          return {
            date: result.date,
            quizId: result.quizId,
            quizTitle: quizTitle,
            score: result.score,
            total: result.total,
            percentage: result.percentage,
            category: result.category || 'N/A',
            topic: result.topic || 'N/A'
          };
        })
    );

    // ---- Response ----
    res.json({
      success: true,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        isPremium: user.isPremium,
        premiumPlan: user.premiumPlan,
        premiumExpiry: user.premiumExpiry,
        isVerified: user.isVerified,
        isBanned: user.isBanned || false,
        isDeleted: user.isDeleted || false,
        createdAt: user.createdAt,
        marketingConsent: user.marketingConsent
      },
      stats: {
        totalExams,
        passed,
        failed,
        passRate,
        streak,
        badgesCount,
        badges: user.badges?.map(b => b.badgeId) || []
      },
      transactions,
      quizHistory
    });
  } catch (error) {
    console.error('Admin user profile error:', error);
    res.status(500).json({ error: 'Failed to fetch user profile' });
  }
});

// ---- Send private message ----
router.post('/:userId/message', isAdmin, async (req, res) => {
  try {
    const { message, buttonText, buttonLink } = req.body;
    const user = await User.findById(req.params.userId);
    if (!user) return res.status(404).json({ error: 'User not found' });
    const PrivateMessage = require('../models/PrivateMessage');
    const newMessage = new PrivateMessage({
      userId: user._id,
      message,
      buttonText: buttonText || 'Learn More',
      buttonLink: buttonLink || null,
      isRead: false
    });
    await newMessage.save();
    console.log(`📩 Private message sent to ${user.email} (${user._id})`);
    res.json({ success: true, message: 'Private message sent successfully', data: newMessage });
  } catch (error) {
    console.error('Send private message error:', error);
    res.status(500).json({ error: 'Failed to send private message' });
  }
});

// ---- Force logout ----
router.post('/:userId/force-logout', isAdmin, async (req, res) => {
  try {
    const user = await User.findById(req.params.userId);
    if (!user) return res.status(404).json({ error: 'User not found' });
    user.currentSessionToken = null;
    await user.save();
    console.log(`🔒 Admin force logged out: ${user.email}`);
    res.json({ success: true, message: 'User logged out from all devices' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ---- Reset streak ----
router.post('/:userId/reset-streak', isAdmin, async (req, res) => {
  try {
    const user = await User.findById(req.params.userId);
    if (!user) return res.status(404).json({ error: 'User not found' });
    user.streak = 0;
    await user.save();
    console.log(`🔄 Admin reset streak for: ${user.email}`);
    res.json({ success: true, message: 'Streak reset to 0' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ---- Toggle ban ----
router.post('/:userId/toggle-ban', isAdmin, async (req, res) => {
  try {
    const user = await User.findById(req.params.userId);
    if (!user) return res.status(404).json({ error: 'User not found' });
    user.isBanned = !user.isBanned;
    await user.save();
    console.log(`🚫 Admin ${user.isBanned ? 'banned' : 'unbanned'}: ${user.email}`);
    res.json({ success: true, isBanned: user.isBanned, message: user.isBanned ? 'User banned' : 'User unbanned' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ---- Toggle soft delete ----
router.post('/:userId/toggle-delete', isAdmin, async (req, res) => {
  try {
    const user = await User.findById(req.params.userId);
    if (!user) return res.status(404).json({ error: 'User not found' });
    user.isDeleted = !user.isDeleted;
    await user.save();
    console.log(`🗑️ Admin ${user.isDeleted ? 'soft deleted' : 'restored'}: ${user.email}`);
    res.json({ success: true, isDeleted: user.isDeleted, message: user.isDeleted ? 'User soft deleted' : 'User restored' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ---- Resend verification email ----
router.post('/:userId/resend-verification', isAdmin, async (req, res) => {
  try {
    const user = await User.findById(req.params.userId);
    if (!user) return res.status(404).json({ error: 'User not found' });
    if (user.isVerified) {
      return res.json({ success: false, message: 'User is already verified' });
    }
    const otp = generateOTP();
    otpStore.set(`verify_${user.email}`, { otp, expires: Date.now() + 10 * 60000, name: user.name });
    await sendEmail(user.email, user.name || 'User', otp, 'verification');
    console.log(`📧 Admin resent verification to: ${user.email}`);
    res.json({ success: true, message: 'Verification email sent' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ---- Send direct email ----
router.post('/:userId/send-email', isAdmin, async (req, res) => {
  try {
    const { subject, body } = req.body;
    const user = await User.findById(req.params.userId);
    if (!user) return res.status(404).json({ error: 'User not found' });
    if (!subject || !body) {
      return res.status(400).json({ error: 'Subject and body are required' });
    }
    const sendSmtpEmail = new SibApiV3Sdk.SendSmtpEmail();
    sendSmtpEmail.to = [{ email: user.email }];
    sendSmtpEmail.sender = { email: 'elitenursingcbt@gmail.com', name: 'ELITE Nursing CBT Support' };
    sendSmtpEmail.subject = subject;
    sendSmtpEmail.htmlContent = `
      <h2>${subject}</h2>
      <p>Dear ${user.name || 'User'},</p>
      <p>${body.replace(/\n/g, '<br/>')}</p>
      <br/>
      <p>Best regards,<br/>ELITE Nursing CBT Support Team</p>
    `;
    sendSmtpEmail.textContent = `Dear ${user.name || 'User'},\n\n${body}\n\nBest regards,\nELITE Nursing CBT Support Team`;
    await new SibApiV3Sdk.TransactionalEmailsApi().sendTransacEmail(sendSmtpEmail);
    console.log(`📧 Admin sent email to: ${user.email} - "${subject}"`);
    res.json({ success: true, message: 'Email sent successfully' });
  } catch (error) {
    console.error('Send email error:', error);
    res.status(500).json({ error: 'Failed to send email' });
  }
});

// ---- Update user ----
router.put('/:userId', isAdmin, async (req, res) => {
  try {
    const { name, email, isVerified } = req.body;
    const user = await User.findById(req.params.userId);
    if (!user) return res.status(404).json({ error: 'User not found' });

    if (name !== undefined) user.name = name;
    if (email !== undefined) user.email = email;
    if (isVerified !== undefined) user.isVerified = isVerified;

    await user.save();
    const updated = user.toObject();
    delete updated.password;
    res.json({ success: true, user: updated });
  } catch (error) {
    console.error('Update user error:', error);
    res.status(500).json({ error: error.message });
  }
});

// ---- Restore deleted history ----
router.post('/:userId/restore-history', isAdmin, async (req, res) => {
  try {
    const user = await User.findById(req.params.userId);
    if (!user) return res.status(404).json({ error: 'User not found' });

    let modified = 0;
    user.quizResults.forEach(entry => {
      if (entry.deleted === true) {
        entry.deleted = false;
        modified++;
      }
    });
    if (modified === 0) {
      return res.json({ success: true, message: 'No deleted history to restore.' });
    }
    await user.save();
    res.json({ success: true, message: `Restored ${modified} deleted history entries.` });
  } catch (error) {
    console.error('Restore history error:', error);
    res.status(500).json({ error: error.message });
  }
});

// ---- Award badge ----
router.post('/:userId/award-badge/:badgeId', isAdmin, async (req, res) => {
  try {
    const { userId, badgeId } = req.params;
    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ error: 'User not found' });
    const badge = await Badge.findById(badgeId);
    if (!badge) return res.status(404).json({ error: 'Badge not found' });

    const alreadyHas = user.awardedBadgeIds && user.awardedBadgeIds.some(id => id.toString() === badgeId);
    if (alreadyHas) {
      return res.json({ success: false, message: 'User already has this badge' });
    }
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