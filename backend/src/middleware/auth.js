// src/middleware/auth.js
const jwt = require('jsonwebtoken');
const { User } = require('../models');
const { JWT_SECRET } = require('../utils');

const authenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    console.log(`🔑 [authenticate] Authorization header: ${authHeader}`);
    const token = authHeader?.split(' ')[1];
    if (!token) {
      console.log('❌ [authenticate] No token provided');
      return res.status(401).json({ error: 'No token provided' });
    }
    console.log(`🔑 [authenticate] Token (first 30 chars): ${token.substring(0, 30)}...`);

    const decoded = jwt.verify(token, JWT_SECRET);
    console.log(`✅ [authenticate] Decoded: userId=${decoded.userId}, sessionToken=${decoded.sessionToken}`);

    const user = await User.findById(decoded.userId).select('-password');
    if (!user) {
      console.log('❌ [authenticate] User not found');
      return res.status(401).json({ error: 'Your account has been deleted. Please log out and contact support.' });
    }

    // Log but do not block on session mismatch (since we disabled it)
    if (user.currentSessionToken !== decoded.sessionToken) {
      console.log(`⚠️ [authenticate] Session mismatch! DB: ${user.currentSessionToken}, JWT: ${decoded.sessionToken}`);
      // We are intentionally NOT returning 401 here.
    }

    req.user = user;
    next();
  } catch (error) {
    console.error('❌ [authenticate] Error:', error);
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
};

module.exports = authenticate;