// src/models/MarketingConsent.js
const mongoose = require('mongoose');

const MarketingConsentSchema = new mongoose.Schema({
  message: { type: String, required: true },
  buttonText: { type: String, default: 'Yes, Opt me in!' },
  active: { type: Boolean, default: false },
  version: { type: Number, default: 1 },
  updatedAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('MarketingConsent', MarketingConsentSchema);