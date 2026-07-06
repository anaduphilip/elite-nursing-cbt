// Force DNS resolution to use Google DNS
const dns = require('dns');
dns.setServers(['8.8.8.8', '8.8.4.4']);

const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const axios = require('axios');
const crypto = require('crypto');
const SibApiV3Sdk = require('sib-api-v3-sdk');
require('dotenv').config();
const admin = require('firebase-admin');
// We will not require any local JSON file. Instead, we'll initialize only if a secret file is provided via environment variable.
// For local development, you can set GOOGLE_APPLICATION_CREDENTIALS to the path of your JSON file (outside the repo).
// On Render, you will add the JSON as a secret file and set the environment variable.
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

const app = express();

// ============ CORS CONFIGURATION ============
const allowedOrigins = [
  'https://elite-nursing-cbt.vercel.app',
  'http://localhost:5173',
  'http://localhost:5000',
  'https://elite-nursing-backend.onrender.com',
  'https://localhost',
  'http://localhost',
  'capacitor://localhost',
  'http://capacitor://localhost'
];

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

// Configure Brevo
const defaultClient = SibApiV3Sdk.ApiClient.instance;
const apiKey = defaultClient.authentications['api-key'];
apiKey.apiKey = process.env.BREVO_API_KEY;

const apiInstance = new SibApiV3Sdk.TransactionalEmailsApi();

// ============ MONGODB CONNECTION ============
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/quizzapp';

const connectWithRetry = () => {
  console.log('🔄 Attempting to connect to MongoDB...');
  mongoose.connect(MONGODB_URI, {
    serverSelectionTimeoutMS: 30000,
    connectTimeoutMS: 30000,
    socketTimeoutMS: 45000,
    family: 4,
    retryWrites: true,
    w: 'majority'
  })
  .then(() => console.log('✅ MongoDB connected successfully'))
  .catch(err => {
    console.log('❌ MongoDB connection error:', err.message);
    console.log('🔄 Retrying in 5 seconds...');
    setTimeout(connectWithRetry, 5000);
  });
};

connectWithRetry();

mongoose.connection.on('error', err => {
  console.log('MongoDB connection error event:', err.message);
});

mongoose.connection.on('disconnected', () => {
  console.log('MongoDB disconnected. Attempting to reconnect...');
  setTimeout(connectWithRetry, 5000);
});

// OTP Store
const otpStore = new Map();

// User Schema with session token
const UserSchema = new mongoose.Schema({
  name: { type: String, default: '' },
  email: { type: String, unique: true, required: true },
  password: { type: String, required: true },
  isPremium: { type: Boolean, default: false },
  isVerified: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now },
  currentSessionToken: { type: String, default: null },
  lastLoginAt: { type: Date, default: null },
  purchaseDate: Date,
  premiumPlan: { type: String, enum: ['daily', 'monthly', 'yearly', null], default: null },
  premiumExpiry: { type: Date, default: null },
  purchasedExams: [{
    examId: String,
    examTitle: String,
    sectionNumber: Number,
    purchaseDate: { type: Date, default: Date.now }
  }],
  transactions: [{
    reference: String,
    amount: Number,
    status: String,
    planType: String,
    examId: String,
    examTitle: String,
    sectionNumber: Number,
    date: { type: Date, default: Date.now }
  }],
  quizResults: [{
    quizId: String,
    score: Number,
    total: Number,
    percentage: Number,
    date: { type: Date, default: Date.now }
  }],
  deviceTokens: [{ type: String }],
  marketingConsent: { type: Boolean, default: false },
  lastMarketingEmailSent: { type: Date, default: null }
});

// Quiz Schema
const QuizSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: String,
  category: { type: String, default: 'general-nursing' },
  questions: [{
    questionText: String,
    options: [String],
    correctAnswer: Number,
    points: { type: Number, default: 1 }
  }],
  passingScore: { type: Number, default: 70 },
  isPremium: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now }
});

// Contact Schema
const ContactSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true },
  message: { type: String, required: true },
  createdAt: { type: Date, default: Date.now }
});

// ============ MARKETING CONSENT SCHEMA ============
const MarketingConsentSchema = new mongoose.Schema({
  message: { type: String, required: true },
  buttonText: { type: String, default: 'Yes, Opt me in!' },
  active: { type: Boolean, default: false },
  version: { type: Number, default: 1 },
  updatedAt: { type: Date, default: Date.now }
});

const MarketingConsent = mongoose.model('MarketingConsent', MarketingConsentSchema);

// ============ ANNOUNCEMENT SCHEMA ============
const AnnouncementSchema = new mongoose.Schema({
  message: { type: String, required: true },
  buttonText: { type: String, default: 'Learn More' },
  buttonLink: { type: String, default: '/get-premium' },
  active: { type: Boolean, default: false },
  version: { type: Number, default: 1 },
  updatedAt: { type: Date, default: Date.now }
});

const Announcement = mongoose.model('Announcement', AnnouncementSchema);

// ============ WEEKLY QUIZ SCHEMAS ============
const WeeklyQuizSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: String,
  instructions: { type: String, default: '' }, // NEW: instructions shown before quiz
  weekNumber: { type: Number, required: true },
  year: { type: Number, default: () => new Date().getFullYear() },
  questions: [{
    questionText: String,
    options: [String],
    correctAnswer: Number,
    points: { type: Number, default: 1 }
  }],
  passingScore: { type: Number, default: 70 },
  timeLimit: { type: Number, default: 20 },
  isActive: { type: Boolean, default: false }, 
  isPremium: { type: Boolean, default: false }, 
  startDate: { type: Date, default: null }, 
  endDate: { type: Date, default: null },
  createdAt: { type: Date, default: Date.now },
  publishedAt: { type: Date, default: null } 
});

const WeeklyQuizAttemptSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  weeklyQuizId: { type: mongoose.Schema.Types.ObjectId, ref: 'WeeklyQuiz', required: true },
  answers: { type: Object, default: {} },
  score: { type: Number, default: 0 },
  total: { type: Number, default: 0 },
  percentage: { type: Number, default: 0 },
  passed: { type: Boolean, default: false },
  startedAt: { type: Date, default: Date.now },
  completedAt: { type: Date },
  timeSpent: { type: Number, default: 0 }
});

const WeeklyQuiz = mongoose.model('WeeklyQuiz', WeeklyQuizSchema);
const WeeklyQuizAttempt = mongoose.model('WeeklyQuizAttempt', WeeklyQuizAttemptSchema);

const User = mongoose.model('User', UserSchema);
// Helper to check and update premium status
const checkAndUpdatePremium = async (user) => {
  if (user.premiumExpiry && user.premiumExpiry < new Date()) {
    user.isPremium = false;
    user.premiumPlan = null;
    user.premiumExpiry = null;
    await user.save();
    return { isPremium: false, plan: null, expiry: null };
  }
  return { 
    isPremium: user.isPremium, 
    plan: user.premiumPlan, 
    expiry: user.premiumExpiry 
  };
};

const Quiz = mongoose.model('Quiz', QuizSchema);
const Contact = mongoose.model('Contact', ContactSchema);

// Helper function
const generateOTP = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

// Generate unique session token
const generateSessionToken = () => {
  return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
};

// Professional Email Template
const getEmailTemplate = (name, otp, type) => {
  const year = new Date().getFullYear();
  
  const emailContent = type === 'verification' 
    ? {
        title: 'Verify Your Email Address',
        message: `Thank you for choosing ELITE Nursing & Midwifery CBT. Please use the verification code below to complete your registration.`,
        note: 'This code will expire in 10 minutes.'
      }
    : {
        title: 'Reset Your Password',
        message: `We received a request to reset your password. Use the verification code below to create a new password.`,
        note: 'If you did not request this, please ignore this email.'
      };
  
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${emailContent.title} - ELITE Nursing CBT</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #f0f7f4; }
    .container { max-width: 550px; margin: 0 auto; padding: 20px; }
    .email-card { background-color: #ffffff; border-radius: 20px; overflow: hidden; box-shadow: 0 10px 35px rgba(0,0,0,0.1); }
    .header { background: linear-gradient(135deg, #1e3c72 0%, #2a5298 100%); padding: 30px 20px; text-align: center; }
    .header h1 { color: #ffffff; font-size: 22px; margin: 0; }
    .header p { color: rgba(255,255,255,0.9); font-size: 12px; margin: 8px 0 0; }
    .content { padding: 30px 25px; }
    .greeting { font-size: 18px; font-weight: 600; color: #1e3c72; margin-bottom: 15px; }
    .message { color: #4a5568; font-size: 15px; line-height: 1.6; margin-bottom: 25px; }
    .code-container { background: linear-gradient(135deg, #f0f7f4 0%, #e8f0ea 100%); border-radius: 16px; padding: 25px 20px; text-align: center; margin: 25px 0; }
    .code { font-size: 42px; font-weight: 800; letter-spacing: 12px; color: #1e3c72; font-family: monospace; background: white; display: inline-block; padding: 12px 20px; border-radius: 12px; }
    .expiry-note { font-size: 12px; color: #8b9a8b; margin-top: 12px; }
    .footer { background-color: #f8f9fa; padding: 20px 25px; text-align: center; border-top: 1px solid #e2e8f0; }
    .footer p { color: #94a3b8; font-size: 11px; margin: 5px 0; }
    @media (max-width: 480px) { .code { font-size: 28px; letter-spacing: 8px; padding: 10px 15px; } }
  </style>
</head>
<body>
  <div class="container">
    <div class="email-card">
      <div class="header">
        <h1>ELITE NURSING & MIDWIFERY CBT</h1>
        <p>Computer Based Testing Platform</p>
      </div>
      <div class="content">
        <div class="greeting">Dear ${name || 'Valued User'},</div>
        <div class="message">${emailContent.message}</div>
        <div class="code-container">
          <div class="code">${otp}</div>
          <div class="expiry-note">⏰ ${emailContent.note}</div>
        </div>
        <div class="message" style="font-size: 13px;">If you didn't request this, please ignore this email.</div>
      </div>
      <div class="footer">
        <p>© ${year} ELITE Nursing & Midwifery CBT. All rights reserved.</p>
        <p>Empowering nursing and midwifery excellence.</p>
      </div>
    </div>
  </div>
</body>
</html>`;
};

// Send email function
const sendEmail = async (to, name, otp, type) => {
  try {
    const htmlContent = getEmailTemplate(name, otp, type);
    const textContent = type === 'verification' 
      ? `Your verification code is: ${otp}\n\nThis code expires in 10 minutes.`
      : `Your password reset code is: ${otp}\n\nThis code expires in 10 minutes.`;
    
    const subject = type === 'verification' 
      ? 'Verify Your Email - ELITE Nursing CBT'
      : 'Reset Your Password - ELITE Nursing CBT';
    
    const sendSmtpEmail = new SibApiV3Sdk.SendSmtpEmail();
    sendSmtpEmail.to = [{ email: to }];
    sendSmtpEmail.sender = { email: 'elitenursingcbt@gmail.com', name: 'ELITE Nursing CBT' };
    sendSmtpEmail.subject = subject;
    sendSmtpEmail.textContent = textContent;
    sendSmtpEmail.htmlContent = htmlContent;
    
    await apiInstance.sendTransacEmail(sendSmtpEmail);
    console.log('✅ Email sent to:', to);
    return true;
  } catch (error) {
    console.error('❌ Email failed:', error.response?.body || error.message);
    return false;
  }
};

// Contact Email Template
const getContactEmailTemplate = (name, email, message) => {
  const year = new Date().getFullYear();
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>New Contact Message - ELITE Nursing CBT</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #f0f7f4; }
    .container { max-width: 550px; margin: 0 auto; padding: 20px; }
    .email-card { background-color: #ffffff; border-radius: 20px; overflow: hidden; box-shadow: 0 10px 35px rgba(0,0,0,0.1); }
    .header { background: linear-gradient(135deg, #1e3c72 0%, #2a5298 100%); padding: 30px 20px; text-align: center; }
    .header h1 { color: white; font-size: 22px; }
    .content { padding: 30px 25px; }
    .message-box { background: #f8f9fa; border-radius: 12px; padding: 20px; margin: 20px 0; border-left: 4px solid #1e3c72; }
    .footer { background-color: #f8f9fa; padding: 20px; text-align: center; border-top: 1px solid #e2e8f0; }
    .footer p { color: #94a3b8; font-size: 11px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="email-card">
      <div class="header">
        <h1>ELITE NURSING & MIDWIFERY CBT</h1>
        <p>Computer Based Testing Platform</p>
      </div>
      <div class="content">
        <h2>New Contact Message</h2>
        <p><strong>From:</strong> ${name} (${email})</p>
        <div class="message-box">
          <p><strong>Message:</strong></p>
          <p style="margin-top: 10px;">${message}</p>
        </div>
      </div>
      <div class="footer">
        <p>© ${year} ELITE Nursing & Midwifery CBT. All rights reserved.</p>
      </div>
    </div>
  </div>
</body>
</html>`;
};

// Reply Email Template
const getReplyEmailTemplate = (name, originalMessage, reply) => {
  const year = new Date().getFullYear();
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Response to your message - ELITE Nursing CBT</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #f0f7f4; }
    .container { max-width: 550px; margin: 0 auto; padding: 20px; }
    .email-card { background-color: #ffffff; border-radius: 20px; overflow: hidden; box-shadow: 0 10px 35px rgba(0,0,0,0.1); }
    .header { background: linear-gradient(135deg, #1e3c72 0%, #2a5298 100%); padding: 30px 20px; text-align: center; }
    .header h1 { color: white; font-size: 22px; }
    .content { padding: 30px 25px; }
    .original-box { background: #f8f9fa; border-radius: 12px; padding: 15px; margin: 15px 0; border-left: 4px solid #6c757d; }
    .reply-box { background: #e8f5e9; border-radius: 12px; padding: 15px; margin: 15px 0; border-left: 4px solid #28a745; }
    .footer { background-color: #f8f9fa; padding: 20px; text-align: center; border-top: 1px solid #e2e8f0; }
    .footer p { color: #94a3b8; font-size: 11px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="email-card">
      <div class="header">
        <h1>ELITE NURSING & MIDWIFERY CBT</h1>
        <p>Computer Based Testing Platform</p>
      </div>
      <div class="content">
        <h2>Response to Your Message</h2>
        <p>Dear ${name},</p>
        <p>Thank you for reaching out to us. Here is our response:</p>
        <div class="reply-box">
          <p><strong>Our Response:</strong></p>
          <p style="margin-top: 10px;">${reply}</p>
        </div>
        <div class="original-box">
          <p><strong>Your Original Message:</strong></p>
          <p style="margin-top: 10px;">${originalMessage}</p>
        </div>
        <p>If you have any further questions, feel free to reach out again.</p>
        <p>Best regards,<br/>ELITE Nursing CBT Support Team</p>
      </div>
      <div class="footer">
        <p>© ${year} ELITE Nursing & Midwifery CBT. All rights reserved.</p>
      </div>
    </div>
  </div>
</body>
</html>`;
};

// ============ ADMIN MIDDLEWARE ============
const isAdmin = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) return res.status(401).json({ error: 'Unauthorized' });
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'elite_secret_key_2024');
    const user = await User.findById(decoded.userId);
    if (user.email !== 'elitenursingcbt@gmail.com') {
      return res.status(403).json({ error: 'Admin access only' });
    }
    req.userId = decoded.userId;
    next();
  } catch (error) {
    res.status(401).json({ error: 'Invalid token' });
  }
};

// ============ MARKETING CONSENT ROUTES ============

// Get active consent banner (public)
app.get('/api/marketing-consent', async (req, res) => {
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

// Admin: Create or update consent banner
app.post('/api/admin/marketing-consent', isAdmin, async (req, res) => {
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

// Admin: Deactivate consent banner
app.delete('/api/admin/marketing-consent', isAdmin, async (req, res) => {
  try {
    const consent = await MarketingConsent.findOne();
    if (!consent) {
      return res.status(404).json({ error: 'No consent banner found' });
    }
    consent.active = false;
    consent.version += 1;
    await consent.save();
    res.json({ success: true, message: 'Consent banner deactivated' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to deactivate consent banner' });
  }
});

// Admin: Get current consent banner
app.get('/api/admin/marketing-consent', isAdmin, async (req, res) => {
  try {
    const consent = await MarketingConsent.findOne();
    res.json({ success: true, consent });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch consent banner' });
  }
});

// ============ USER MARKETING CONSENT UPDATE ============

// Update user's marketing consent preference
app.put('/api/user/marketing-consent', authenticate, async (req, res) => {
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

// ============ AUTHENTICATION MIDDLEWARE ============
const authenticate = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
      return res.status(401).json({ error: 'No token provided' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'elite_secret_key_2024');
    const user = await User.findById(decoded.userId).select('-password');

    if (!user) {
      return res.status(401).json({ error: 'Your account has been deleted. Please log out and contact support.' });
    }

    // Validate that the session token in the JWT matches the user's current session token
    if (!decoded.sessionToken || user.currentSessionToken !== decoded.sessionToken) {
      return res.status(401).json({ error: 'Session expired. You have been logged out from another device.' });
    }

    req.user = user;
    next();
  } catch (error) {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
};

// ============ ADMIN ROUTES ============
app.get('/api/admin/users', isAdmin, async (req, res) => {
  try {
    const users = await User.find().select('-password').sort({ createdAt: -1 });
    res.json(users);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/admin/contacts', isAdmin, async (req, res) => {
  try {
    const contacts = await Contact.find().sort({ createdAt: -1 });
    res.json(contacts);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});


app.delete('/api/admin/users/:userId', isAdmin, async (req, res) => {
  try {
    await User.findByIdAndDelete(req.params.userId);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Admin reply to contact message
app.post('/api/admin/reply-message', isAdmin, async (req, res) => {
  try {
    const { to, name, originalMessage, reply } = req.body;
    
    const htmlContent = getReplyEmailTemplate(name, originalMessage, reply);
    const textContent = `Response to your message:\n\n${reply}\n\nOriginal message: ${originalMessage}`;
    
    const sendSmtpEmail = new SibApiV3Sdk.SendSmtpEmail();
    sendSmtpEmail.to = [{ email: to }];
    sendSmtpEmail.sender = { email: 'elitenursingcbt@gmail.com', name: 'ELITE Nursing CBT Support' };
    sendSmtpEmail.subject = `Response to your message - ELITE Nursing CBT`;
    sendSmtpEmail.textContent = textContent;
    sendSmtpEmail.htmlContent = htmlContent;
    
    await apiInstance.sendTransacEmail(sendSmtpEmail);
    console.log(`✅ Reply sent to ${to}`);
    res.json({ success: true, message: 'Reply sent successfully' });
  } catch (error) {
    console.error('Reply error:', error);
    res.status(500).json({ error: 'Failed to send reply' });
  }
});

// Admin: Set user premium plan with expiry
app.post('/api/admin/set-premium-plan', isAdmin, async (req, res) => {
  try {
    const { userId, planType } = req.body;
    if (!userId || !planType) return res.status(400).json({ error: 'Missing userId or planType' });
    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ error: 'User not found' });

    // If planType is 'none', remove premium
    if (planType === 'none') {
      user.isPremium = false;
      user.premiumPlan = null;
      user.premiumExpiry = null;
      await user.save();
      return res.json({ success: true, message: 'Premium removed' });
    }

    const validPlans = ['daily', 'monthly', 'yearly'];
    if (!validPlans.includes(planType)) {
      return res.status(400).json({ error: 'Invalid plan type' });
    }

    // Set expiry based on plan
    let expiryDate = new Date();
    switch(planType) {
      case 'daily': expiryDate.setDate(expiryDate.getDate() + 1); break;
      case 'monthly': expiryDate.setMonth(expiryDate.getMonth() + 1); break;
      case 'yearly': expiryDate.setFullYear(expiryDate.getFullYear() + 1); break;
    }

    user.isPremium = true;
    user.premiumPlan = planType;
    user.premiumExpiry = expiryDate;
    await user.save();

    // Return updated user (excluding password)
    const updatedUser = user.toObject();
    delete updatedUser.password;

    res.json({ 
      success: true, 
      message: `Premium ${planType} plan applied until ${expiryDate.toISOString()}`,
      user: updatedUser
    });
  } catch (error) {
    console.error('Set premium plan error:', error);
    res.status(500).json({ error: error.message });
  }
});

// ============ ANNOUNCEMENT ROUTES ============

// Get active announcement (public)
app.get('/api/announcement', async (req, res) => {
  try {
    const announcement = await Announcement.findOne({ active: true });
    if (!announcement) {
      return res.json({ success: false, message: 'No active announcement' });
    }
    res.json({ success: true, announcement });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch announcement' });
  }
});

// Admin: Create or update announcement
app.post('/api/admin/announcement', isAdmin, async (req, res) => {
  try {
    const { message, buttonText, buttonLink, active } = req.body;
    if (!message) return res.status(400).json({ error: 'Message is required' });

    // Find existing announcement or create new
    let announcement = await Announcement.findOne();
    if (announcement) {
      // Update existing
      announcement.message = message;
      announcement.buttonText = buttonText || 'Learn More';
      announcement.buttonLink = buttonLink || '/get-premium';
      announcement.active = active !== undefined ? active : true;
      announcement.version += 1; // increment version so it reappears for users
      announcement.updatedAt = new Date();
    } else {
      // Create new
      announcement = new Announcement({
        message,
        buttonText: buttonText || 'Learn More',
        buttonLink: buttonLink || '/get-premium',
        active: active !== undefined ? active : true,
        version: 1
      });
    }
    await announcement.save();
    res.json({ success: true, announcement });
  } catch (error) {
    console.error('Announcement save error:', error);
    res.status(500).json({ error: 'Failed to save announcement' });
  }
});

// Admin: Deactivate announcement (set active: false)
app.delete('/api/admin/announcement', isAdmin, async (req, res) => {
  try {
    const announcement = await Announcement.findOne();
    if (!announcement) {
      return res.status(404).json({ error: 'No announcement found' });
    }
    announcement.active = false;
    announcement.version += 1; // version bump so banner won't show again (since it's inactive)
    await announcement.save();
    res.json({ success: true, message: 'Announcement deactivated' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to deactivate announcement' });
  }
});

// Admin: Get current announcement (for preview in admin panel)
app.get('/api/admin/announcement', isAdmin, async (req, res) => {
  try {
    const announcement = await Announcement.findOne();
    res.json({ success: true, announcement });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch announcement' });
  }
});

// ============ CONTACT ROUTE ============
app.post('/api/contact', async (req, res) => {
  try {
    const { name, email, message } = req.body;
    const contact = new Contact({ name, email, message });
    await contact.save();
    
    // Send email notification to admin
    const htmlContent = getContactEmailTemplate(name, email, message);
    const sendSmtpEmail = new SibApiV3Sdk.SendSmtpEmail();
    sendSmtpEmail.to = [{ email: 'elitenursingcbt@gmail.com' }];
    sendSmtpEmail.sender = { email: 'elitenursingcbt@gmail.com', name: 'ELITE Nursing CBT' };
    sendSmtpEmail.subject = `New Contact Message from ${name}`;
    sendSmtpEmail.textContent = `From: ${name} (${email})\n\nMessage: ${message}`;
    sendSmtpEmail.htmlContent = htmlContent;
    await apiInstance.sendTransacEmail(sendSmtpEmail);
    
    res.json({ success: true });
  } catch (error) {
    console.error('Contact error:', error);
    res.status(500).json({ error: 'Failed to send message' });
  }
});

// ============ VERIFICATION ROUTES ============
app.post('/api/send-verification', async (req, res) => {
  try {
    const { email, name } = req.body;
    const existingUser = await User.findOne({ email });
    if (existingUser && existingUser.isVerified) {
      return res.status(400).json({ error: 'Email already registered' });
    }
    const otp = generateOTP();
    otpStore.set(`verify_${email}`, { otp, expires: Date.now() + 10 * 60000, name });
    await sendEmail(email, name || 'User', otp, 'verification');
    res.json({ success: true, message: 'Verification code sent' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to send code' });
  }
});

app.post('/api/verify-email', async (req, res) => {
  try {
    const { email, otp } = req.body;
    console.log(`Verifying OTP for email: ${email}, stored:`, otpStore.get(`verify_${email}`));
    const stored = otpStore.get(`verify_${email}`);
    if (!stored) return res.status(400).json({ error: 'No code found' });
    if (Date.now() > stored.expires) return res.status(400).json({ error: 'Code expired' });
    if (stored.otp !== otp) return res.status(400).json({ error: 'Invalid code' });
    otpStore.set(`verified_${email}`, { verified: true, name: stored.name });
    otpStore.delete(`verify_${email}`);
    res.json({ success: true, message: 'Email verified' });
  } catch (error) {
    console.error('Verification error:', error);
    res.status(500).json({ error: 'Verification failed' });
  }
});

// ============ FORGOT PASSWORD ============
app.post('/api/forgot-password', async (req, res) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ error: 'No account found' });
    const otp = generateOTP();
    otpStore.set(`reset_${email}`, { otp, expires: Date.now() + 10 * 60000, name: user.name });
    await sendEmail(email, user.name || 'User', otp, 'password-reset');
    res.json({ success: true, message: 'Reset code sent' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to send code' });
  }
});

app.post('/api/reset-password', async (req, res) => {
  try {
    const { email, otp, newPassword } = req.body;
    const stored = otpStore.get(`reset_${email}`);
    if (!stored) return res.status(400).json({ error: 'No code found' });
    if (Date.now() > stored.expires) return res.status(400).json({ error: 'Code expired' });
    if (stored.otp !== otp) return res.status(400).json({ error: 'Invalid code' });
    if (newPassword.length < 6) return res.status(400).json({ error: 'Password too short' });
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await User.findOneAndUpdate({ email }, { password: hashedPassword });
    otpStore.delete(`reset_${email}`);
    res.json({ success: true, message: 'Password reset successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to reset password' });
  }
});

// ============ FORCE LOGOUT ROUTE ============
app.post('/api/force-logout', async (req, res) => {
  try {
    const { email } = req.body;
    await User.findOneAndUpdate({ email }, { currentSessionToken: null });
    console.log(`✅ Force logged out from all devices for: ${email}`);
    res.json({ success: true, message: 'Logged out from all other devices' });
  } catch (error) {
    console.error('Force logout error:', error);
    res.status(500).json({ error: 'Failed to force logout' });
  }
});

// ============ AUTH ROUTES ============
app.post('/api/register', async (req, res) => {
  try {
    const { name, email, password, marketingConsent } = req.body;  
    const verifiedData = otpStore.get(`verified_${email}`);
    if (!verifiedData || !verifiedData.verified) {
      return res.status(400).json({ error: 'Please verify your email first' });
    }
    const existingUser = await User.findOne({ email });
    if (existingUser && existingUser.isVerified) {
      otpStore.delete(`verified_${email}`);
      return res.status(400).json({ error: 'User already exists' });
    }
    const hashedPassword = await bcrypt.hash(password, 10);
    if (existingUser && !existingUser.isVerified) {
      existingUser.name = name || verifiedData.name;
      existingUser.password = hashedPassword;
      existingUser.isVerified = true;
      existingUser.marketingConsent = marketingConsent || false;  
      const sessionToken = generateSessionToken();
      existingUser.currentSessionToken = sessionToken;
      existingUser.lastLoginAt = new Date();
      await existingUser.save();
      const token = jwt.sign({ userId: existingUser._id, sessionToken }, process.env.JWT_SECRET || 'elite_secret_key_2024');
      otpStore.delete(`verified_${email}`);
      return res.json({ success: true, token, user: { id: existingUser._id, name: existingUser.name, email, isPremium: existingUser.isPremium, marketingConsent: existingUser.marketingConsent } });
    }
    const sessionToken = generateSessionToken();
    const user = new User({ 
      name: name || verifiedData.name, 
      email, 
      password: hashedPassword, 
      isVerified: true,
      currentSessionToken: sessionToken,
      lastLoginAt: new Date(),
      marketingConsent: marketingConsent || false  
    });
    await user.save();
    otpStore.delete(`verified_${email}`);
    const token = jwt.sign({ userId: user._id, sessionToken }, process.env.JWT_SECRET || 'elite_secret_key_2024');
    res.json({ success: true, token, user: { id: user._id, name: user.name, email, isPremium: user.isPremium, marketingConsent: user.marketingConsent } });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

app.post('/api/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ error: 'User not found' });
    if (!user.isVerified) return res.status(400).json({ error: 'Email not verified' });
    const valid = await bcrypt.compare(password, user.password);
    if (!valid) return res.status(400).json({ error: 'Invalid password' });
    
    // Check and update premium status before login response
    const premiumStatus = await checkAndUpdatePremium(user);
    
    if (user.currentSessionToken) {
      return res.status(401).json({ error: 'You are already logged in on another device. Please log out from that device first.' });
    }
    
    const sessionToken = generateSessionToken();
    user.currentSessionToken = sessionToken;
    user.lastLoginAt = new Date();
    await user.save();
    
    const token = jwt.sign({ userId: user._id, sessionToken }, process.env.JWT_SECRET || 'elite_secret_key_2024');
    res.json({ 
      token, 
      user: { 
        id: user._id, 
        name: user.name, 
        email, 
        isPremium: premiumStatus.isPremium   // <-- updated
      } 
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Logout endpoint - clears session token
app.post('/api/logout', async (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) return res.status(200).json({ success: true });
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'elite_secret_key_2024');
    await User.findByIdAndUpdate(decoded.userId, { currentSessionToken: null });
    res.json({ success: true });
  } catch (error) {
    res.status(200).json({ success: true });
  }
});

// Verify session endpoint (called on each page load)
app.get('/api/verify-session', async (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) return res.status(401).json({ error: 'No token' });
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'elite_secret_key_2024');
    const user = await User.findById(decoded.userId);
    if (!user) return res.status(401).json({ error: 'User not found' });
    if (user.currentSessionToken !== decoded.sessionToken) {
      return res.status(401).json({ error: 'Session expired. You have been logged out from another device.' });
    }
    
    // Check and update premium status before returning
    const premiumStatus = await checkAndUpdatePremium(user);
    
    res.json({ 
      valid: true, 
      user: { 
        id: user._id, 
        name: user.name, 
        email: user.email, 
        isPremium: premiumStatus.isPremium 
      } 
    });
  } catch (error) {
    res.status(401).json({ error: 'Invalid token' });
  }
});

app.get('/api/user/profile', authenticate, async (req, res) => {
  // Check and update premium status
  const premiumStatus = await checkAndUpdatePremium(req.user);
  res.json({
    id: req.user._id,
    name: req.user.name,
    isPremium: premiumStatus.isPremium,
    premiumPlan: premiumStatus.plan,
    premiumExpiry: premiumStatus.expiry,
    email: req.user.email,
    isVerified: req.user.isVerified
  });
});

app.post('/api/check-exam-access', authenticate, async (req, res) => {
  const { examId, sectionNumber } = req.body;
  if (req.user.isPremium) return res.json({ hasAccess: true });
  const hasPurchased = req.user.purchasedExams.some(p => p.examId === examId && p.sectionNumber === sectionNumber);
  res.json({ hasAccess: hasPurchased });
});

// ============ QUIZ ROUTES ============
app.get('/api/quizzes', authenticate, async (req, res) => {
  try {
    const quizzes = await Quiz.find();
    res.json(quizzes);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/quizzes/:quizId', authenticate, async (req, res) => {
  try {
    const quiz = await Quiz.findById(req.params.quizId);
    if (!quiz) return res.status(404).json({ error: 'Quiz not found' });
    res.json(quiz);
  } catch (error) {
    res.status(404).json({ error: 'Quiz not found' });
  }
});

app.post('/api/quizzes/:quizId/submit', authenticate, async (req, res) => {
  try {
    const quiz = await Quiz.findById(req.params.quizId);
    if (!quiz) return res.status(404).json({ error: 'Quiz not found' });
    const { answers } = req.body;
    let score = 0, total = 0;
    quiz.questions.forEach((q, i) => {
      total += q.points || 1;
      if (answers[i] === q.correctAnswer) score += q.points || 1;
    });
    const percentage = (score / total) * 100;
    const passed = percentage >= 70;

    // ==== SAVE QUIZ RESULT TO USER ====
    const user = await User.findById(req.user._id);
    if (user) {
      user.quizResults.push({
        quizId: req.params.quizId,
        score: score,
        total: total,
        percentage: percentage,
        date: new Date()
      });
      await user.save();
    }

    // ==== MARKETING EMAIL TRIGGER ====
    if (user && !user.isPremium && user.marketingConsent) {
      const freeExamsTaken = user.quizResults.length || 0;
      const lastEmailDate = user.lastMarketingEmailSent || new Date(0);
      const daysSinceLast = (Date.now() - lastEmailDate.getTime()) / (1000 * 60 * 60 * 24);

      // Trigger after 3 free exams, but only if at least 7 days since last email
      if (freeExamsTaken >= 3 && daysSinceLast > 7) {
        // Send asynchronously – don't block the response
        sendMarketingEmail(user.email, user.name, 'upgrade')
          .then(sent => {
            if (sent) {
              console.log(`✅ Upgrade email sent to ${user.email} after ${freeExamsTaken} free exams`);
            }
          })
          .catch(err => console.error('Async email error:', err));

        user.lastMarketingEmailSent = new Date();
        await user.save();
      }
    }

    res.json({ score, total, percentage, passed });

  } catch (error) {
    console.error('Submit error:', error);
    res.status(400).json({ error: error.message });
  }
});

// Get current active weekly quiz (respects publish status and dates)
app.get('/api/weekly-quiz/current', authenticate, async (req, res) => {
  try {
    const today = new Date();
    
    // Find the active quiz: must be published (isActive: true) and within date range
    const quiz = await WeeklyQuiz.findOne({ 
      isActive: true,
      $or: [
        { startDate: { $lte: today } },
        { startDate: null }
      ],
      $or: [
        { endDate: { $gte: today } },
        { endDate: null }
      ]
    }).sort({ weekNumber: -1 }); // Get the most recent active quiz
    
    if (!quiz) {
      return res.json({ success: false, message: 'No active weekly quiz available right now.' });
    }

    // Check if user already attempted
    const existingAttempt = await WeeklyQuizAttempt.findOne({
      userId: req.user._id,
      weeklyQuizId: quiz._id
    });

    let quizData = quiz.toObject();
    if (existingAttempt) {
      quizData.questions = quizData.questions.map(q => ({
        ...q,
        correctAnswer: undefined
      }));
      quizData.alreadyAttempted = true;
      quizData.attemptScore = existingAttempt.score;
      quizData.attemptPercentage = existingAttempt.percentage;
    } else {
      quizData.alreadyAttempted = false;
    }

    res.json({ 
      success: true, 
      quiz: quizData,
      alreadyAttempted: !!existingAttempt,
      isPremium: quiz.isPremium
    });
  } catch (error) {
    console.error('Error fetching weekly quiz:', error);
    res.status(500).json({ error: 'Failed to fetch weekly quiz' });
  }
});

// Submit weekly quiz
app.post('/api/weekly-quiz/submit', authenticate, async (req, res) => {
  try {
    const { quizId, answers, timeSpent } = req.body;
    
    if (!quizId) {
      return res.status(400).json({ error: 'Quiz ID required' });
    }

    // Check if user already attempted
    const existingAttempt = await WeeklyQuizAttempt.findOne({
      userId: req.user._id,
      weeklyQuizId: quizId
    });

    if (existingAttempt) {
      return res.status(400).json({ error: 'You have already attempted this weekly quiz.' });
    }

    const quiz = await WeeklyQuiz.findById(quizId);
    if (!quiz) {
      return res.status(404).json({ error: 'Quiz not found' });
    }

    // Check if quiz is still active and within date range
    const now = new Date();
    if (!quiz.isActive) {
      return res.status(400).json({ error: 'This quiz is no longer available.' });
    }
    if (quiz.startDate && quiz.startDate > now) {
      return res.status(400).json({ error: 'This quiz has not started yet.' });
    }
    if (quiz.endDate && quiz.endDate < now) {
      return res.status(400).json({ error: 'This quiz has already expired.' });
    }

    // Calculate score
    let score = 0;
    let total = 0;
    quiz.questions.forEach((q, index) => {
      total += q.points || 1;
      if (answers[index] !== undefined && answers[index] === q.correctAnswer) {
        score += q.points || 1;
      }
    });

    const percentage = ((score / total) * 100);
    const passed = percentage >= (quiz.passingScore || 70);

    // Save attempt
    const attempt = new WeeklyQuizAttempt({
      userId: req.user._id,
      weeklyQuizId: quizId,
      answers: answers,
      score: score,
      total: total,
      percentage: percentage,
      passed: passed,
      completedAt: new Date(),
      timeSpent: timeSpent || 0
    });
    await attempt.save();

    res.json({ 
      success: true, 
      score, 
      total, 
      percentage: percentage.toFixed(1),
      passed
    });
  } catch (error) {
    console.error('Error submitting weekly quiz:', error);
    res.status(500).json({ error: 'Failed to submit weekly quiz' });
  }
});

// Get user's weekly quiz history
app.get('/api/weekly-quiz/history', authenticate, async (req, res) => {
  try {
    const attempts = await WeeklyQuizAttempt.find({ userId: req.user._id })
      .sort({ completedAt: -1 })
      .populate('weeklyQuizId', 'title weekNumber');

    res.json({ success: true, attempts });
  } catch (error) {
    console.error('Error fetching weekly quiz history:', error);
    res.status(500).json({ error: 'Failed to fetch history' });
  }
});

// Admin: Create weekly quiz (with save/publish)
app.post('/api/admin/weekly-quiz', isAdmin, async (req, res) => {
  try {
    const { 
      title, description, instructions, weekNumber, questions, 
      passingScore, timeLimit, startDate, endDate, 
      isActive, isPremium 
    } = req.body;
    
    const quiz = new WeeklyQuiz({
      title,
      description,
      instructions: instructions || '',
      weekNumber,
      questions,
      passingScore: passingScore || 70,
      timeLimit: timeLimit || 20,
      startDate: startDate ? new Date(startDate) : null,
      endDate: endDate ? new Date(endDate) : null,
      isActive: isActive || false,
      isPremium: isPremium || false,
      publishedAt: isActive ? new Date() : null
    });
    await quiz.save();

    res.json({ success: true, quiz });
  } catch (error) {
    console.error('Error creating weekly quiz:', error);
    res.status(500).json({ error: 'Failed to create quiz' });
  }
});

// Admin: Toggle publish status (publish/unpublish)
app.post('/api/admin/weekly-quiz/:id/toggle-publish', isAdmin, async (req, res) => {
  try {
    const { isActive } = req.body;
    const quiz = await WeeklyQuiz.findById(req.params.id);
    if (!quiz) return res.status(404).json({ error: 'Quiz not found' });
    
    quiz.isActive = isActive;
    quiz.publishedAt = isActive ? new Date() : null;
    await quiz.save();
    
    res.json({ success: true, quiz });
  } catch (error) {
    res.status(500).json({ error: 'Failed to toggle publish status' });
  }
});

// Admin: Toggle premium status
app.post('/api/admin/weekly-quiz/:id/toggle-premium', isAdmin, async (req, res) => {
  try {
    const { isPremium } = req.body;
    const quiz = await WeeklyQuiz.findById(req.params.id);
    if (!quiz) return res.status(404).json({ error: 'Quiz not found' });
    
    quiz.isPremium = isPremium;
    await quiz.save();
    
    res.json({ success: true, quiz });
  } catch (error) {
    res.status(500).json({ error: 'Failed to toggle premium status' });
  }
});

// Admin: Update weekly quiz
app.put('/api/admin/weekly-quiz/:id', isAdmin, async (req, res) => {
  try {
    const updateData = { ...req.body };
    
    // If the quiz is being published (isActive set to true), set publishedAt
    if (updateData.isActive === true) {
      updateData.publishedAt = new Date();
    }
    // If unpublishing, we keep publishedAt as is (for history)
    
    const quiz = await WeeklyQuiz.findByIdAndUpdate(req.params.id, updateData, { new: true });
    if (!quiz) return res.status(404).json({ error: 'Quiz not found' });
    res.json({ success: true, quiz });
  } catch (error) {
    console.error('Update quiz error:', error);
    res.status(500).json({ error: 'Failed to update quiz' });
  }
});

// Admin: Delete weekly quiz
app.delete('/api/admin/weekly-quiz/:id', isAdmin, async (req, res) => {
  try {
    await WeeklyQuiz.findByIdAndDelete(req.params.id);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete quiz' });
  }
});

// Admin: Get all weekly quizzes
app.get('/api/admin/weekly-quizzes', isAdmin, async (req, res) => {
  try {
    const quizzes = await WeeklyQuiz.find().sort({ createdAt: -1 });
    res.json(quizzes);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch quizzes' });
  }
});

// Admin: Get results for a weekly quiz
app.get('/api/admin/weekly-quiz/:id/results', isAdmin, async (req, res) => {
  try {
    const attempts = await WeeklyQuizAttempt.find({ weeklyQuizId: req.params.id })
      .populate('userId', 'name email')
      .sort({ score: -1 });
    res.json(attempts);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch results' });
  }
});

// Get leaderboard for a weekly quiz (use 'current' for active quiz)
app.get('/api/weekly-quiz/:quizId/leaderboard', authenticate, async (req, res) => {
  try {
    const { quizId } = req.params;
    let query = {};
    if (quizId === 'current') {
      const activeQuiz = await WeeklyQuiz.findOne({ 
        isActive: true, 
        startDate: { $lte: new Date() }, 
        $or: [{ endDate: { $gte: new Date() } }, { endDate: null }] 
      });
      if (!activeQuiz) return res.status(404).json({ error: 'No active quiz' });
      query = { weeklyQuizId: activeQuiz._id };
    } else {
      query = { weeklyQuizId: quizId };
    }
    const attempts = await WeeklyQuizAttempt.find(query)
      .populate('userId', 'name email')
      .sort({ score: -1, percentage: -1 });
    res.json({ success: true, attempts });
  } catch (error) {
    console.error('Leaderboard error:', error);
    res.status(500).json({ error: 'Failed to fetch leaderboard' });
  }
});

// Send marketing/promotional email
const sendMarketingEmail = async (to, name, templateType, customSubject = null, customMessage = null) => {
  try {
    const templates = {
      upgrade: {
        subject: 'Upgrade to Premium – Unlock All Exams! 🚀',
        html: `<p>Hi <strong>${name}</strong>,</p>
               <p>You've been crushing it with our free exams – great job! 🎉</p>
               <p>Imagine what you could achieve with <strong>full, unlimited access</strong> to all our premium content.</p>
               <p><strong>Upgrade to Premium today and get:</strong></p>
               <ul>
                 <li>✅ Unlimited access to all <strong>20,000+ questions</strong></li>
                 <li>✅ Retake any exam as many times as you want</li>
                 <li>✅ Weekly premium quizzes with leaderboard</li>
                 <li>✅ Detailed answer explanations</li>
                 <li>✅ And much more!</li>
               </ul>
               <div style="text-align:center;margin:30px 0;">
                 <a href="https://elite-nursing-cbt.vercel.app/get-premium" style="background:#ff9800;color:white;padding:14px 32px;text-decoration:none;border-radius:50px;font-weight:bold;font-size:16px;">⭐ Upgrade Now</a>
               </div>
               <p>Don't stop now – unlock your full potential!</p>
               <p>Best regards,<br/>ELITE Nursing CBT Team</p>`
      },
      reminder: {
        subject: 'Ready for More? 🎯 Unlock Premium Exams',
        html: `<p>Hi <strong>${name}</strong>,</p>
               <p>You've already shown great dedication by using ELITE Nursing CBT.</p>
               <p>With <strong>Premium access</strong>, you'll never have to worry about exam limits again. Tackle every topic, master every subject.</p>
               <p><strong>Here's what you're missing:</strong></p>
               <ul>
                 <li>✅ Unlimited exam attempts</li>
                 <li>✅ All premium categories unlocked</li>
                 <li>✅ Weekly premium quizzes</li>
                 <li>✅ Leaderboard rankings</li>
               </ul>
               <div style="text-align:center;margin:30px 0;">
                 <a href="https://elite-nursing-cbt.vercel.app/get-premium" style="background:#ff9800;color:white;padding:14px 32px;text-decoration:none;border-radius:50px;font-weight:bold;font-size:16px;">⭐ See Premium Plans</a>
               </div>
               <p>Your success is our mission!</p>
               <p>Best regards,<br/>ELITE Nursing CBT Team</p>`
      },
      winback: {
        subject: 'We Miss You! Come Back to ELITE Nursing CBT 💙',
        html: `<p>Hi <strong>${name}</strong>,</p>
               <p>It's been a while since you last visited ELITE Nursing CBT.</p>
               <p>We've added new questions, improved our platform, and there's so much more waiting for you!</p>
               <p><strong>Don't miss out on:</strong></p>
               <ul>
                 <li>✅ New 5,000+ practice questions</li>
                 <li>✅ Weekly premium quizzes</li>
                 <li>✅ Improved user experience</li>
                 <li>✅ And much more!</li>
               </ul>
               <div style="text-align:center;margin:30px 0;">
                 <a href="https://elite-nursing-cbt.vercel.app" style="background:#1e3c72;color:white;padding:14px 32px;text-decoration:none;border-radius:50px;font-weight:bold;font-size:16px;">📚 Start Studying Now</a>
               </div>
               <p>We can't wait to see you again!</p>
               <p>Best regards,<br/>ELITE Nursing CBT Team</p>`
      }
    };

    const template = templates[templateType] || templates.upgrade;
    const subject = customSubject || template.subject;

    let htmlContent = template.html;
    if (customMessage) {
      // If admin provides a custom message, use it with the standard CTA
      htmlContent = `<p>Hi ${name},</p>
                     <p>${customMessage}</p>
                     <div style="text-align:center;margin:30px 0;">
                       <a href="https://elite-nursing-cbt.vercel.app/get-premium" style="background:#ff9800;color:white;padding:14px 32px;text-decoration:none;border-radius:50px;font-weight:bold;font-size:16px;">⭐ Upgrade Now</a>
                     </div>
                     <p>Best regards,<br/>ELITE Nursing CBT Team</p>`;
    }

    const sendSmtpEmail = new SibApiV3Sdk.SendSmtpEmail();
    sendSmtpEmail.to = [{ email: to }];
    sendSmtpEmail.sender = { email: 'elitenursingcbt@gmail.com', name: 'ELITE Nursing CBT' };
    sendSmtpEmail.subject = subject;
    sendSmtpEmail.htmlContent = htmlContent;
    sendSmtpEmail.textContent = `Hi ${name}, upgrade to Premium for full access to all exams. Visit https://elite-nursing-cbt.vercel.app/get-premium`;

    await apiInstance.sendTransacEmail(sendSmtpEmail);
    console.log(`✅ Marketing email sent to ${to}`);
    return true;
  } catch (error) {
    console.error('❌ Marketing email failed:', error.response?.body || error.message);
    return false;
  }
};

// ============ PAYMENT ROUTES - USING TRANSACTION ID ONLY ============

// Initialize payment
app.post('/api/initialize-payment', async (req, res) => {
  try {
    const { email, amount, userId, planType, examId, examTitle, sectionNumber, redirect_url } = req.body;
    
    if (!userId) {
      console.error('❌ Payment initialization failed: userId is missing');
      return res.status(400).json({ error: 'User ID is required' });
    }
    
    const tx_ref = `ELITE-${Date.now()}-${userId}-${Math.random().toString(36).substring(2, 8)}`;
    console.log(`💰 INITIALIZING PAYMENT: ${tx_ref} for user ${userId}, amount: ${amount}`);
    
    const user = await User.findById(userId);
    if (!user) {
      // User deleted – return 401 with custom message
      return res.status(401).json({ error: 'Your account has been deleted. Please log out and contact support.' });
    }
    
    // Use provided redirect_url or fallback to default
    const finalRedirectUrl = redirect_url || `https://elite-nursing-cbt.vercel.app/payment-return?reference=${tx_ref}`;
    
    // Initialize payment with Flutterwave
    const response = await axios.post('https://api.flutterwave.com/v3/payments', {
      tx_ref,
      amount,
      currency: "NGN",
      redirect_url: finalRedirectUrl,
      customer: { email, name: user.name || email },
      customizations: {
        title: "ELITE Nursing CBT",
        description: planType === 'single' ? `Exam ${sectionNumber} Access` : "Complete Premium Package"
      }
    }, {
      headers: { Authorization: `Bearer ${process.env.FLW_SECRET_KEY}`, 'Content-Type': 'application/json' }
    });
    
    const flutterwaveLink = response.data.data.link;
    const flutterwaveId = response.data.data.id;
    console.log(`✅ Payment initialized, Flutterwave ID: ${flutterwaveId}`);
    
    // Store transaction with both tx_ref and flutterwaveId
    user.transactions.push({
      reference: tx_ref,
      flutterwaveId: flutterwaveId,
      amount,
      status: 'pending',
      planType: planType || 'premium',
      examId: examId || null,
      examTitle: examTitle || null,
      sectionNumber: sectionNumber || null,
      date: new Date()
    });
    await user.save();
    
    res.json({ authorization_url: flutterwaveLink, reference: tx_ref, flutterwaveId });
    
  } catch (error) {
    console.error('❌ Payment initialization error:', error.response?.data || error.message);
    res.status(500).json({ error: 'Payment initialization failed' });
  }
});

// Payment verification endpoint - uses transactionId (numeric ID)
app.post('/api/verify-payment', async (req, res) => {
  try {
    const { reference, transactionId, userId } = req.body;
    
    console.log(`🔍 VERIFYING - Reference: ${reference}, TransactionId: ${transactionId}, UserId: ${userId}`);
    
    if ((!reference && !transactionId) || !userId) {
      return res.status(400).json({ success: false, error: 'Missing reference or userId' });
    }
    
    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ success: false, error: 'User not found' });
    if (user.isPremium) {
      console.log(`✅ User already premium`);
      return res.json({ success: true, isPremium: true });
    }
    
    // Find transaction by reference
    const transaction = user.transactions.find(t => t.reference === reference);
    if (!transaction) {
      console.log(`Transaction not found for reference: ${reference}`);
      return res.status(404).json({ success: false, error: 'Transaction not found' });
    }
    
    // Use the provided transactionId (numeric) or fallback to stored flutterwaveId
    const verifyId = transactionId || transaction.flutterwaveId;
    if (!verifyId) {
      return res.json({ success: false, pending: true, message: 'No transaction ID available' });
    }
    
    console.log(`Verifying with Flutterwave ID: ${verifyId}`);
    const response = await axios.get(`https://api.flutterwave.com/v3/transactions/${verifyId}/verify`, {
      headers: { Authorization: `Bearer ${process.env.FLW_SECRET_KEY}` },
      timeout: 30000
    });
    
    const txData = response.data.data;
    console.log(`📊 Flutterwave status: ${txData?.status}, amount: ${txData?.amount}`);
    
    if (txData?.status === 'successful') {
      // Determine plan and expiry
      const plan = transaction.planType || 'monthly'; // fallback to monthly if not set
      let expiryDate = new Date();
      switch(plan) {
        case 'daily':
          expiryDate.setDate(expiryDate.getDate() + 1);
          break;
        case 'monthly':
          expiryDate.setMonth(expiryDate.getMonth() + 1);
          break;
        case 'yearly':
          expiryDate.setFullYear(expiryDate.getFullYear() + 1);
          break;
        default:
          // For legacy lifetime or unknown plans, set to 1 year from now
          expiryDate.setFullYear(expiryDate.getFullYear() + 1);
      }
      
      user.isPremium = true;
      user.premiumPlan = plan;
      user.premiumExpiry = expiryDate;
      user.purchaseDate = new Date();
      transaction.status = 'completed';
      transaction.flutterwaveId = txData.id;
      await user.save();
      
      console.log(`✅✅ PREMIUM ACTIVATED for: ${user.email} (${plan}) until ${expiryDate} ✅✅`);
      return res.json({ 
        success: true, 
        isPremium: true, 
        plan: plan, 
        expiry: expiryDate 
      });
    } else if (txData?.status === 'pending') {
      return res.json({ success: false, pending: true, message: 'Payment still processing' });
    } else {
      return res.json({ success: false, error: `Payment status: ${txData?.status}` });
    }
    
  } catch (error) {
    console.error('Verification error:', error.response?.data || error.message);
    res.status(200).json({ success: false, error: 'Verification failed. Contact support.' });
  }
});


// Register device token for push notifications
app.post('/api/register-token', async (req, res) => {
  const { token, userId } = req.body;
  if (!token || !userId) return res.status(400).json({ error: 'Missing token or userId' });
  try {
    // Check if user still exists
    const user = await User.findById(userId);
    if (!user) {
      return res.status(401).json({ error: 'Your account has been deleted. Please log out and contact support.' });
    }
    await User.findByIdAndUpdate(userId, { $addToSet: { deviceTokens: token } });
    console.log(`Token registered for user ${userId}`);
    res.json({ success: true });
  } catch (error) {
    console.error('Error registering token:', error);
    res.status(500).json({ error: 'Failed to register token' });
  }
});

// Admin: Send notification to all users
app.post('/api/admin/send-notification', isAdmin, async (req, res) => {
  const { title, message } = req.body;

  if (!title || !message) {
    return res.status(400).json({ error: 'Missing title or message' });
  }

  try {
    const users = await User.find({ deviceTokens: { $exists: true, $ne: [] } });
    const tokens = users.flatMap(user => user.deviceTokens);

    if (tokens.length === 0) {
      return res.status(400).json({ error: 'No registered devices found' });
    }

    const response = await admin.messaging().sendEachForMulticast({
      tokens: tokens,
      notification: { title, body: message }
    });

    console.log(`Notification sent to ${response.successCount} devices.`);
    if (response.failureCount > 0) {
      console.error('Failed tokens:', response.responses);
    }

    res.json({ success: true, successCount: response.successCount, failureCount: response.failureCount });
  } catch (error) {
    console.error('Error sending notification:', error);
    res.status(500).json({ error: 'Failed to send notifications' });
  }
});

// Admin: Generate verification code for ANY email (bypass email)
app.post('/api/admin/generate-verification-code', isAdmin, async (req, res) => {
  const { email } = req.body;
  if (!email) return res.status(400).json({ error: 'Email required' });

  // No user existence check – can generate for any email
  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  // Overwrite any previous OTP for this email (case-sensitive key)
  otpStore.set(`verify_${email}`, { otp, expires: Date.now() + 10 * 60000 });

  console.log(`Admin generated OTP for ${email}: ${otp}`);
  res.json({ otp, message: 'Verification code generated successfully' });
});

// Admin: Generate password reset code (bypass email)
app.post('/api/admin/generate-reset-code', isAdmin, async (req, res) => {
  const { email } = req.body;
  if (!email) return res.status(400).json({ error: 'Email required' });

  // Optionally check if user exists (recommended for password reset)
  const user = await User.findOne({ email });
  if (!user) return res.status(404).json({ error: 'User not found' });

  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  // Store with reset_ prefix (same as forgot-password uses)
  otpStore.set(`reset_${email}`, { otp, expires: Date.now() + 10 * 60000, name: user.name });

  console.log(`Admin generated reset OTP for ${email}: ${otp}`);
  res.json({ otp, message: 'Reset code generated successfully' });
});

// Admin: Broadcast email to all free users
app.post('/api/admin/broadcast-email', isAdmin, async (req, res) => {
  const { subject, message, templateType } = req.body;

  try {
    const freeUsers = await User.find({
      isPremium: false,
      isVerified: true,
      marketingConsent: true  // Only send to users who opted in
    });

    if (freeUsers.length === 0) {
      return res.json({ success: true, sent: 0, message: 'No eligible free users found.' });
    }

    let successCount = 0;
    const failures = [];

    for (const user of freeUsers) {
      try {
        const sent = await sendMarketingEmail(
          user.email,
          user.name,
          templateType || 'upgrade',
          subject || null,
          message || null
        );
        if (sent) {
          successCount++;
          user.lastMarketingEmailSent = new Date();
          await user.save();
        }
      } catch (err) {
        failures.push(user.email);
      }
    }

    res.json({
      success: true,
      sent: successCount,
      total: freeUsers.length,
      failures: failures,
      message: `Sent to ${successCount} out of ${freeUsers.length} users.`
    });
  } catch (error) {
    console.error('Broadcast error:', error);
    res.status(500).json({ error: 'Failed to send broadcast' });
  }
});

// Update user profile (name)
app.put('/api/user/profile', authenticate, async (req, res) => {
  try {
    const { name } = req.body;
    if (!name || name.trim().length === 0) {
      return res.status(400).json({ error: 'Name cannot be empty' });
    }
    req.user.name = name.trim();
    await req.user.save();
    // Return updated user (excluding password)
    const updatedUser = req.user.toObject();
    delete updatedUser.password;
    res.json(updatedUser);
  } catch (error) {
    console.error('Profile update error:', error);
    res.status(500).json({ error: 'Failed to update profile' });
  }
});

// ============ HEALTH CHECK ============
app.get('/', (req, res) => {
  res.send('ELITE NURSING & MIDWIFERY CBT API is Running!');
});

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString(), mongodb: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected' });
});

// ============ START SERVER ============
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📍 http://localhost:${PORT}`);
  console.log(`📚 MongoDB: ${mongoose.connection.readyState === 1 ? 'Connected' : 'Disconnected'}`);
});