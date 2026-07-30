// src/routes/admin-force-refresh.js
const express = require('express');
const { Config } = require('../models');
const { isAdmin } = require('../middleware');

const router = express.Router();

// Trigger force refresh
router.post('/', isAdmin, async (req, res) => {
  try {
    const { message, version } = req.body;
    let config = await Config.findOne();
    if (!config) config = new Config();
    const newVersion = version || (config.refreshVersion || 0) + 1;
    config.refreshRequired = true;
    config.refreshVersion = newVersion;
    if (message) config.refreshMessage = message;
    await config.save();
    res.json({ success: true, version: newVersion, message: config.refreshMessage });
  } catch (error) {
    res.status(500).json({ error: 'Failed to trigger refresh' });
  }
});

// Deactivate force refresh
router.delete('/', isAdmin, async (req, res) => {
  try {
    let config = await Config.findOne();
    if (config) {
      config.refreshRequired = false;
      config.refreshVersion = 0;
      await config.save();
    }
    res.json({ success: true, message: 'Force refresh deactivated' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to deactivate refresh' });
  }
});

// Get current state (public)
router.get('/', async (req, res) => {
  try {
    const config = await Config.findOne();
    if (!config) return res.json({ success: true, version: 0, message: '' });
    res.json({ success: true, version: config.refreshVersion || 0, message: config.refreshMessage || 'A new version is available. Please refresh your page to continue.' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch refresh status' });
  }
});

module.exports = router;