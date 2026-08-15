// src/routes/auth.js
const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { User } = require('../models');
const { authenticate, isAdmin } = require('../middleware');
const {
  generateOTP,
  generateSessionToken,
  checkAndUpdatePremium,
  sendEmail
} = require('../utils');
const { JWT_SECRET } = require('../config/constants');
const { checkUserAccess } = require('../utils/rateLimitHelpers');
const { getRegistrationLimitInfo, incrementRegistrationAttempts, resetRegistrationAttempts } = require('../utils/registerAttempts');

const router = express.Router();

// OTP Store (in-memory for simplicity – in production use Redis)
const otpStore = require('../utils/otpStore');

// ============ VERIFICATION ROUTES ============
router.post('/send-verification', async (req, res) => {
  try {
    const { email, name } = req.body;
    const ip = req.ip || req.connection.remoteAddress || '0.0.0.0';

    // ---- Check registration rate limits ----
    const limitInfo = getRegistrationLimitInfo(email, ip);
    if (limitInfo.blocked) {
      return res.status(429).json({ error: limitInfo.message });
    }

    const existingUser = await User.findOne({ email });
    if (existingUser && existingUser.isVerified) {
      return res.status(400).json({ error: 'Email already registered' });
    }

    const otp = generateOTP();
    otpStore.set(`verify_${email}`, { otp, expires: Date.now() + 10 * 60000, name });
    await sendEmail(email, name || 'User', otp, 'verification');

    // ---- Increment attempts after successful OTP send ----
    incrementRegistrationAttempts(email, ip);

    res.json({ success: true, message: 'Verification code sent' });
  } catch (error) {
    console.error('❌ Send verification error:', error);
    res.status(500).json({ error: 'Failed to send code' });
  }
});

router.post('/verify-email', async (req, res) => {
  try {
    const { email, otp } = req.body;
    const stored = otpStore.get(`verify_${email}`);
    if (!stored) return res.status(400).json({ error: 'No code found' });
    if (Date.now() > stored.expires) return res.status(400).json({ error: 'Code expired' });
    if (stored.otp !== otp) return res.status(400).json({ error: 'Invalid code' });

    // ===== Update user's isVerified in the database =====
    const user = await User.findOne({ email });
    if (user) {
      user.isVerified = true;
      await user.save();
      console.log(`✅ User ${email} verified via OTP`);
    }

    otpStore.set(`verified_${email}`, { verified: true, name: stored.name });
    otpStore.delete(`verify_${email}`);

    res.json({ success: true, message: 'Email verified' });
  } catch (error) {
    console.error('Verification error:', error);
    res.status(500).json({ error: 'Verification failed' });
  }
});

// ============ FORGOT PASSWORD ============
router.post('/forgot-password', async (req, res) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ error: 'No account found' });
    const otp = generateOTP();
    otpStore.set(`reset_${email}`, { otp, expires: Date.now() + 10 * 60000, name: user.name });
    await sendEmail(email, user.name || 'User', otp, 'password-reset');
    res.json({ success: true, message: 'Reset code sent' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to send code' });
  }
});

router.post('/reset-password', async (req, res) => {
  try {
    const { email, otp, newPassword } = req.body;
    const stored = otpStore.get(`reset_${email}`);
    if (!stored) return res.status(400).json({ error: 'No code found' });
    if (Date.now() > stored.expires) return res.status(400).json({ error: 'Code expired' });
    if (stored.otp !== otp) return res.status(400).json({ error: 'Invalid code' });
    if (newPassword.length < 6) return res.status(400).json({ error: 'Password too short' });
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await User.findOneAndUpdate({ email }, { password: hashedPassword });
    otpStore.delete(`reset_${email}`);
    res.json({ success: true, message: 'Password reset successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to reset password' });
  }
});

// ============ FORCE LOGOUT ============
router.post('/force-logout', async (req, res) => {
  try {
    const { email } = req.body;
    await User.findOneAndUpdate({ email }, { currentSessionToken: null });
    console.log(`✅ Force logged out from all devices for: ${email}`);
    res.json({ success: true, message: 'Logged out from all other devices' });
  } catch (error) {
    console.error('Force logout error:', error);
    res.status(500).json({ error: 'Failed to force logout' });
  }
});

// ============ REGISTER ============
router.post('/register', async (req, res) => {
  try {
    const { name, email, password, marketingConsent } = req.body;
    const ip = req.ip || req.connection.remoteAddress || '0.0.0.0';

    const verifiedData = otpStore.get(`verified_${email}`);
    if (!verifiedData || !verifiedData.verified) {
      return res.status(400).json({ error: 'Please verify your email first' });
    }
    const existingUser = await User.findOne({ email });
    if (existingUser && existingUser.isVerified) {
      otpStore.delete(`verified_${email}`);
      return res.status(400).json({ error: 'User already exists' });
    }
    const hashedPassword = await bcrypt.hash(password, 10);
    if (existingUser && !existingUser.isVerified) {
      existingUser.name = name || verifiedData.name;
      existingUser.password = hashedPassword;
      existingUser.isVerified = true;
      existingUser.marketingConsent = marketingConsent || false;
      const sessionToken = generateSessionToken();
      existingUser.currentSessionToken = sessionToken;
      existingUser.lastLoginAt = new Date();
      await existingUser.save();
      const token = jwt.sign({ userId: existingUser._id, sessionToken }, JWT_SECRET);
      otpStore.delete(`verified_${email}`);

      // ---- Reset registration attempts on successful registration ----
      resetRegistrationAttempts(email, ip);

      return res.json({ success: true, token, user: { id: existingUser._id, name: existingUser.name, email, isPremium: existingUser.isPremium, marketingConsent: existingUser.marketingConsent } });
    }
    const sessionToken = generateSessionToken();
    const user = new User({
      name: name || verifiedData.name,
      email,
      password: hashedPassword,
      isVerified: true,
      currentSessionToken: sessionToken,
      lastLoginAt: new Date(),
      marketingConsent: marketingConsent || false
    });
    await user.save();
    otpStore.delete(`verified_${email}`);
    const token = jwt.sign({ userId: user._id, sessionToken }, JWT_SECRET);

    // ---- Reset registration attempts on successful registration ----
    resetRegistrationAttempts(email, ip);

    res.json({ success: true, token, user: { id: user._id, name: user.name, email, isPremium: user.isPremium, marketingConsent: user.marketingConsent } });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// ============ LOGIN ============
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ error: 'User not found' });

    // ---- Check manual block and temporary lock ----
    const access = checkUserAccess(user);
    if (!access.allowed) {
      const statusCode = access.blockType === 'manual' ? 403 : 429;
      return res.status(statusCode).json({ error: access.reason });
    }

    if (!user.isVerified) return res.status(400).json({ error: 'Email not verified' });
    if (user.isBanned) {
      return res.status(403).json({ error: 'Your account has been banned. Please contact support.' });
    }
    if (user.isDeleted) {
      return res.status(403).json({ error: 'Your account has been deactivated.' });
    }

    const valid = await bcrypt.compare(password, user.password);
    if (!valid) {
      user.loginAttempts = (user.loginAttempts || 0) + 1;
      const attempts = user.loginAttempts;
      const duration = require('../utils/rateLimitHelpers').getLockDuration(attempts);
      if (duration > 0) {
        user.lockedUntil = new Date(Date.now() + duration);
      } else {
        user.lockedUntil = null;
      }
      await user.save();

      const lockMessage = require('../utils/rateLimitHelpers').getLockMessage(attempts, user.lockedUntil);
      return res.status(401).json({ error: lockMessage });
    }

    // ---- Successful login – reset attempts and lock ----
    user.loginAttempts = 0;
    user.lockedUntil = null;
    await user.save();

    const premiumStatus = await checkAndUpdatePremium(user);

    if (user.currentSessionToken) {
      return res.status(401).json({ error: 'You are already logged in on another device. Please log out from that device first.' });
    }

    const sessionToken = generateSessionToken();
    user.currentSessionToken = sessionToken;
    user.lastLoginAt = new Date();
    await user.save();

    const token = jwt.sign({ userId: user._id, sessionToken }, JWT_SECRET);
    res.json({
      token,
      user: {
        id: user._id,
        name: user.name,
        email,
        isPremium: premiumStatus.isPremium
      }
    });
  } catch (error) {
    console.error('❌ Login error:', error);
    res.status(400).json({ error: error.message });
  }
});

// ============ LOGOUT ============
router.post('/logout', async (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) return res.status(200).json({ success: true });
    const decoded = jwt.verify(token, JWT_SECRET);
    await User.findByIdAndUpdate(decoded.userId, { currentSessionToken: null });
    res.json({ success: true });
  } catch (error) {
    res.status(200).json({ success: true });
  }
});

// ============ VERIFY SESSION ============
router.get('/verify-session', async (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) return res.status(401).json({ error: 'No token' });
    const decoded = jwt.verify(token, JWT_SECRET);
    const user = await User.findById(decoded.userId);
    if (!user) return res.status(401).json({ error: 'User not found' });
    if (user.currentSessionToken !== decoded.sessionToken) {
      return res.status(401).json({ error: 'Session expired. You have been logged out from another device.' });
    }
    const premiumStatus = await checkAndUpdatePremium(user);
    res.json({
      valid: true,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        isPremium: premiumStatus.isPremium
      }
    });
  } catch (error) {
    res.status(401).json({ error: 'Invalid token' });
  }
});

module.exports = router;