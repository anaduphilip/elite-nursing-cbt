// src/routes/marketing-consent.js
const express = require('express');
const { MarketingConsent } = require('../models');

const router = express.Router();

// Get active consent banner (public)
router.get('/', async (req, res) => {
  try {
    const consent = await MarketingConsent.findOne({ active: true });
    if (!consent) {
      return res.json({ success: false, message: 'No active consent banner' });
    }
    res.json({ success: true, consent });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch consent banner' });
  }
});

// User updates own consent
const { authenticate } = require('../middleware');
router.put('/user', authenticate, async (req, res) => {
  try {
    const { consent } = req.body;
    if (typeof consent !== 'boolean') {
      return res.status(400).json({ error: 'Consent must be a boolean' });
    }
    req.user.marketingConsent = consent;
    await req.user.save();
    res.json({ success: true, marketingConsent: consent });
  } catch (error) {
    console.error('Marketing consent update error:', error);
    res.status(500).json({ error: 'Failed to update consent' });
  }
});

module.exports = router;