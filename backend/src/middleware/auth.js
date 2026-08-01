// src/middleware/auth.js
const jwt = require('jsonwebtoken');
const { User } = require('../models');
const { JWT_SECRET } = require('../config/constants');

const authenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'No token provided' });
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, JWT_SECRET);

    const user = await User.findById(decoded.userId).select('-password');
    if (!user) {
      return res.status(401).json({ error: 'Your account has been deleted. Please log out and contact support.' });
    }

    if (!decoded.sessionToken || user.currentSessionToken !== decoded.sessionToken) {
      return res.status(401).json({ error: 'Session expired. You have been logged out from another device.' });
    }

    req.user = user;
    next();
  } catch (error) {
    console.error('[auth] Authentication error:', error.message);
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ error: 'Token expired. Please log in again.' });
    }
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ error: 'Invalid token signature.' });
    }
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
};

module.exports = authenticate;