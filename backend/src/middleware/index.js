// src/middleware/index.js
const authenticate = require('./auth');
const isAdmin = require('./admin');

module.exports = {
  authenticate,
  isAdmin
};