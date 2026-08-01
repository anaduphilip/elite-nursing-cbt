// src/middleware/auth.js
const jwt = require('jsonwebtoken');
const { User } = require('../models');
const { JWT_SECRET } = require('../config/constants');

const authenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    console.log('🔑 [auth] Authorization header:', authHeader ? authHeader.substring(0, 30) + '...' : 'none');

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      console.log('❌ [auth] No Bearer token');
      return res.status(401).json({ error: 'No token provided' });
    }

    const token = authHeader.split(' ')[1];
    console.log('🔑 [auth] Token (first 20 chars):', token.substring(0, 20) + '...');

    const decoded = jwt.verify(token, JWT_SECRET);
    console.log('✅ [auth] Decoded payload:', JSON.stringify(decoded, null, 2));

    const user = await User.findById(decoded.userId).select('-password');
    if (!user) {
      console.log('❌ [auth] User not found for ID:', decoded.userId);
      return res.status(401).json({ error: 'Your account has been deleted. Please log out and contact support.' });
    }

    console.log('👤 [auth] Found user:', user.email);
    console.log('🔑 [auth] DB sessionToken:', user.currentSessionToken);
    console.log('🔑 [auth] Token sessionToken:', decoded.sessionToken);

    if (!decoded.sessionToken || user.currentSessionToken !== decoded.sessionToken) {
      console.log('❌ [auth] Session token mismatch!');
      return res.status(401).json({ error: 'Session expired. You have been logged out from another device.' });
    }

    console.log('✅ [auth] Authentication successful for:', user.email);
    req.user = user;
    next();
  } catch (error) {
    console.error('❌ [auth] Error:', error.message);
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ error: 'Token expired. Please log in again.' });
    }
    if (error.name === 'JsonWebTokenError') {
      console.error('❌ [auth] JWT error: invalid signature or malformed token');
      return res.status(401).json({ error: 'Invalid token signature.' });
    }
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
};

module.exports = authenticate;