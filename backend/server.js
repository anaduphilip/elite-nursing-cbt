// server.js
const express = require('express');
const cors = require('cors');
require('dotenv').config();
const admin = require('firebase-admin');

// ===== FIREBASE INIT (only if credentials exist) =====
if (process.env.GOOGLE_APPLICATION_CREDENTIALS) {
  try {
    admin.initializeApp({
      credential: admin.credential.cert(require(process.env.GOOGLE_APPLICATION_CREDENTIALS))
    });
    console.log('Firebase Admin initialized');
  } catch (err) {
    console.warn('Firebase Admin init failed:', err.message);
  }
} else {
  console.warn('Firebase Admin not initialized (GOOGLE_APPLICATION_CREDENTIALS not set)');
}

// ===== IMPORTS =====
const { connectWithRetry } = require('./src/utils');
const { allowedOrigins } = require('./src/config/constants');
const routes = require('./src/routes');
const { startPremiumReminderCron } = require('./src/utils');

const app = express();

// ===== CORS =====
app.use(cors({
  origin: function(origin, callback) {
    if (!origin) return callback(null, true);
    if (allowedOrigins.indexOf(origin) === -1) {
      const msg = 'The CORS policy for this site does not allow access from the specified Origin.';
      return callback(new Error(msg), false);
    }
    return callback(null, true);
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept']
}));
app.options('*', cors());
app.use(express.json());

// ===== DATABASE =====
connectWithRetry();

// ===== CRON JOBS =====
startPremiumReminderCron();

// ===== ROUTES =====
app.use('/api', routes);

// ===== HEALTH =====
app.get('/', (req, res) => {
  res.send('ELITE NURSING & MIDWIFERY CBT API is Running!');
});
app.get('/api/health', (req, res) => {
  const mongoose = require('mongoose');
  res.json({ status: 'ok', timestamp: new Date().toISOString(), mongodb: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected' });
});

// ===== START =====
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📍 http://localhost:${PORT}`);
});