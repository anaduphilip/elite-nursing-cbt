// src/middleware/auth.js
const jwt = require('jsonwebtoken');
const { User } = require('../models');
const { JWT_SECRET } = require('../utils');

const authenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    console.log(`🔑 [authenticate] Authorization header: ${authHeader}`);

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      console.warn('⚠️ [authenticate] Missing or malformed Authorization header');
      return res.status(401).json({ error: 'No token provided' });
    }

    const token = authHeader.split(' ')[1];

    // Explicitly reject token values that are literally "undefined" or "null" (common frontend bug)
    if (!token || token === 'undefined' || token === 'null') {
      console.warn(`⚠️ [authenticate] Token is "${token}" – this is a frontend error`);
      return res.status(401).json({ error: 'Invalid token (undefined)' });
    }

    console.log(`🔑 [authenticate] Token (first 30 chars): ${token.substring(0, 30)}...`);

    const decoded = jwt.verify(token, JWT_SECRET);
    console.log(`✅ [authenticate] Decoded: userId=${decoded.userId}, sessionToken=${decoded.sessionToken}`);

    const user = await User.findById(decoded.userId).select('-password');
    if (!user) {
      console.log('❌ [authenticate] User not found');
      return res.status(401).json({ error: 'Your account has been deleted. Please log out and contact support.' });
    }

    // Optional: you can leave the session check enabled or commented out as you prefer
    if (user.currentSessionToken !== decoded.sessionToken) {
      console.log(`⚠️ [authenticate] Session mismatch! DB: ${user.currentSessionToken}, JWT: ${decoded.sessionToken}`);
      // If you want to enforce session token match, uncomment the next line:
      // return res.status(401).json({ error: 'Session expired. You have been logged out from another device.' });
    }

    req.user = user;
    next();
  } catch (error) {
    console.error('❌ [authenticate] Error:', error);
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
};

module.exports = authenticate;