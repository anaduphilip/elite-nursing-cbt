// src/utils/helpers.js
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Config = require('../models/Config');
const { JWT_SECRET } = require('../config/constants');

// Generate OTP
const generateOTP = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

// Generate unique session token
const generateSessionToken = () => {
  return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
};

// Helper to check and update premium status
const checkAndUpdatePremium = async (user) => {
  if (user.premiumExpiry && user.premiumExpiry < new Date()) {
    user.isPremium = false;
    user.premiumPlan = null;
    user.premiumExpiry = null;
    await user.save();
    return { isPremium: false, plan: null, expiry: null };
  }
  return {
    isPremium: user.isPremium,
    plan: user.premiumPlan,
    expiry: user.premiumExpiry
  };
};

module.exports = {
  generateOTP,
  generateSessionToken,
  checkAndUpdatePremium,
  JWT_SECRET
};