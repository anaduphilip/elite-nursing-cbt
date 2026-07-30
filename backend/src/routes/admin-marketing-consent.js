// src/routes/admin-marketing-consent.js
const express = require('express');
const { MarketingConsent } = require('../models');
const { isAdmin } = require('../middleware');

const router = express.Router();

// Get current consent banner
router.get('/', isAdmin, async (req, res) => {
  try {
    const consent = await MarketingConsent.findOne();
    res.json({ success: true, consent });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch consent banner' });
  }
});

// Create or update consent banner
router.post('/', isAdmin, async (req, res) => {
  try {
    const { message, buttonText, active } = req.body;
    if (!message) return res.status(400).json({ error: 'Message is required' });
    let consent = await MarketingConsent.findOne();
    if (consent) {
      consent.message = message;
      consent.buttonText = buttonText || 'Yes, Opt me in!';
      consent.active = active !== undefined ? active : true;
      consent.version += 1;
      consent.updatedAt = new Date();
    } else {
      consent = new MarketingConsent({
        message,
        buttonText: buttonText || 'Yes, Opt me in!',
        active: active !== undefined ? active : true,
        version: 1
      });
    }
    await consent.save();
    res.json({ success: true, consent });
  } catch (error) {
    console.error('Consent save error:', error);
    res.status(500).json({ error: 'Failed to save consent banner' });
  }
});

// Deactivate consent banner
router.delete('/', isAdmin, async (req, res) => {
  try {
    const consent = await MarketingConsent.findOne();
    if (!consent) return res.status(404).json({ error: 'No consent banner found' });
    consent.active = false;
    consent.version += 1;
    await consent.save();
    res.json({ success: true, message: 'Consent banner deactivated' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to deactivate consent banner' });
  }
});

module.exports = router;