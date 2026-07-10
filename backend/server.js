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
const OpenAI = require('openai');
const cron = require('node-cron'); // 👈 NEW for reminders

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
  lastMarketingEmailSent: { type: Date, default: null },
  // ============ NEW: Applied coupons ============
  appliedCoupons: [{
    code: String,
    discountAmount: Number,
    appliedAt: { type: Date, default: Date.now }
  }],
  // ============ NEW: AI Explanations ============
  dailyExplanations: { type: Number, default: 0 },
  lastExplanationReset: { type: Date, default: null },
  // ============ NEW: Reminder tracking ============
  lastReminderSent: { type: String, default: null },
  notifiedExpired: { type: Boolean, default: false },
  // ============ NEW: Study Plan ============
  lastStudyPlanGenerated: { type: Date, default: null },
  studyPlan: {
    generatedAt: { type: Date, default: null },
    questions: [{
      questionText: { type: String },
      options: [{ type: String }],
      correctAnswer: { type: Number },
      quizId: { type: mongoose.Schema.Types.ObjectId, ref: 'Quiz' },
      userAnswer: { type: Number, default: null }
    }],
    completed: { type: Boolean, default: false },
    score: { type: Number, default: null },
    total: { type: Number, default: 0 }
  }
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
  instructions: { type: String, default: '' },
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

// ============ NEW SCHEMAS ============

// 1. System Settings / Config
const ConfigSchema = new mongoose.Schema({
  // ===== EXISTING FIELDS =====
  premiumDailyPrice: { type: Number, default: 500 },
  premiumMonthlyPrice: { type: Number, default: 2000 },
  premiumYearlyPrice: { type: Number, default: 10000 },
  freeExamLimit: { type: Number, default: 1 },
  defaultPassingScore: { type: Number, default: 70 },
  maintenanceMode: { type: Boolean, default: false },
  maintenanceMessage: { type: String, default: 'We are currently performing maintenance. Please check back soon.' },
  appName: { type: String, default: 'ELITE Nursing & Midwifery CBT' },
  appLogo: { type: String, default: '' },
  contactEmail: { type: String, default: 'elitenursingcbt@gmail.com' },
  contactPhone: { type: String, default: '09063908476' },
  defaultTimeLimit: { type: Number, default: 20 },
  showWeeklyQuiz: { type: Boolean, default: true },
  showLeaderboard: { type: Boolean, default: true },
  updatedAt: { type: Date, default: Date.now },

});

const Config = mongoose.model('Config', ConfigSchema);

// 2. Category
const CategorySchema = new mongoose.Schema({
  name: { type: String, required: true },
  slug: { type: String, required: true, unique: true },
  icon: { type: String, default: '📚' },
  description: { type: String, default: '' },
  order: { type: Number, default: 0 },
  active: { type: Boolean, default: true },
  createdAt: { type: Date, default: Date.now }
});

const Category = mongoose.model('Category', CategorySchema);

// 3. Coupon
const CouponSchema = new mongoose.Schema({
  code: { type: String, required: true, unique: true, uppercase: true },
  discountType: { type: String, enum: ['percentage', 'fixed'], default: 'percentage' },
  discountValue: { type: Number, required: true },
  planType: { type: String, enum: ['daily', 'monthly', 'yearly', 'all'], default: 'all' },
  minPurchase: { type: Number, default: 0 },
  maxDiscount: { type: Number, default: null },
  expiryDate: { type: Date, required: true },
  usageLimit: { type: Number, default: 1 },
  usedCount: { type: Number, default: 0 },
  active: { type: Boolean, default: true },
  description: { type: String, default: '' },
  createdAt: { type: Date, default: Date.now }
});

const Coupon = mongoose.model('Coupon', CouponSchema);

// 4. FAQ
const FAQSchema = new mongoose.Schema({
  question: { type: String, required: true },
  answer: { type: String, required: true },
  category: { type: String, default: 'General' },
  order: { type: Number, default: 0 },
  active: { type: Boolean, default: true },
  createdAt: { type: Date, default: Date.now }
});

const FAQ = mongoose.model('FAQ', FAQSchema);

// ============ END NEW SCHEMAS ============

const User = mongoose.model('User', UserSchema);
const Quiz = mongoose.model('Quiz', QuizSchema);
const Contact = mongoose.model('Contact', ContactSchema);

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

    if (!decoded.sessionToken || user.currentSessionToken !== decoded.sessionToken) {
      return res.status(401).json({ error: 'Session expired. You have been logged out from another device.' });
    }

    req.user = user;
    next();
  } catch (error) {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
};

// ============ NEW: AI EXPLANATIONS WITH RELAYFREELLM ============

// Initialize the client pointing to your own RelayFreeLLM gateway
const aiClient = new OpenAI({
  apiKey: 'dummy', // The gateway doesn't require a real key
  baseURL: 'https://relay-free-llm.onrender.com/v1',
  timeout: 60000,
  maxRetries: 2
});

// Helper: Check user's daily limit (free users get 10/day)
const checkUserExplanationLimit = async (user) => {
  if (user.isPremium) return { allowed: true, remaining: Infinity };

  const today = new Date().toDateString();
  const lastReset = user.lastExplanationReset ? new Date(user.lastExplanationReset).toDateString() : null;
  
  if (lastReset !== today) {
    user.dailyExplanations = 0;
    user.lastExplanationReset = new Date();
    await user.save();
  }
  
  const limit = 10;
  const used = user.dailyExplanations || 0;
  const remaining = Math.max(0, limit - used);
  return { allowed: remaining > 0, remaining };
};

// Generate AI explanation
app.post('/api/explain-question', authenticate, async (req, res) => {
  try {
    const { questionText, options, correctAnswer, userAnswer } = req.body;
    
    if (!questionText || !options || options.length !== 4) {
      return res.status(400).json({ error: 'Invalid question data' });
    }
    
    // Check user limit
    const limitCheck = await checkUserExplanationLimit(req.user);
    if (!limitCheck.allowed) {
      return res.status(403).json({
        error: 'Daily explanation limit reached (10/day for free users). Upgrade to Premium for unlimited!',
        limitReached: true,
        remaining: 0
      });
    }
    
    const correctLetter = String.fromCharCode(65 + correctAnswer);
    const userLetter = userAnswer !== undefined ? String.fromCharCode(65 + userAnswer) : 'Not answered';
    
    const prompt = `You are a nursing educator. Provide a helpful, educational explanation for the following multiple-choice question.

Question: ${questionText}
Options:
A: ${options[0]}
B: ${options[1]}
C: ${options[2]}
D: ${options[3]}
Correct Answer: ${correctLetter}
User's Answer: ${userLetter}

Please provide:
1. Why the correct answer is right (1-2 sentences)
2. Why each wrong answer is wrong (1 sentence each)
3. One brief study tip for this topic

Keep explanations concise and educational. Use bullet points.`;

    const response = await aiClient.chat.completions.create({
      model: 'gemini-2.0-flash',
      messages: [
        { role: 'system', content: 'You are a helpful nursing educator.' },
        { role: 'user', content: prompt }
      ],
      max_tokens: 400,
      temperature: 0.7
    });
    
    const explanation = response.choices[0].message.content;
    
    // Increment user's daily count (if not premium)
    if (!req.user.isPremium) {
      req.user.dailyExplanations = (req.user.dailyExplanations || 0) + 1;
      await req.user.save();
    }
    
    res.json({
      success: true,
      explanation: explanation,
      remaining: limitCheck.remaining - 1,
      isPremium: req.user.isPremium
    });
    
  } catch (error) {
    console.error('AI explanation error:', error);
    res.status(500).json({
      error: 'Failed to generate AI explanation. Please try again later.',
      fallback: true
    });
  }
});

// Get remaining explanations for today
app.get('/api/explanation-remaining', authenticate, async (req, res) => {
  if (req.user.isPremium) {
    return res.json({ remaining: Infinity, isPremium: true });
  }
  
  const today = new Date().toDateString();
  const lastReset = req.user.lastExplanationReset ? new Date(req.user.lastExplanationReset).toDateString() : null;
  
  if (lastReset !== today) {
    req.user.dailyExplanations = 0;
    req.user.lastExplanationReset = new Date();
    await req.user.save();
  }
  
  const limit = 10;
  const used = req.user.dailyExplanations || 0;
  const remaining = Math.max(0, limit - used);
  res.json({ remaining, isPremium: false });
});

// ============ END AI EXPLANATIONS ============

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

    if (planType === 'none') {
      console.log(`🛠️ Removing premium for user: ${user.email} (${userId})`);
      
      // Use updateOne for consistency and to get modifiedCount
      const result = await User.updateOne(
        { _id: userId },
        {
          $set: {
            isPremium: false,
            premiumPlan: null,
            premiumExpiry: null
          }
        }
      );
      
      console.log('📊 Removal result:', result);
      
      if (result.modifiedCount === 0) {
        console.log('⚠️ No document modified – maybe already removed.');
      } else {
        console.log(`✅ Premium removed for ${user.email}`);
      }
      
      // Fetch the updated user to return
      const updatedUser = await User.findById(userId);
      return res.json({
        success: true,
        message: 'Premium removed',
        user: updatedUser
      });
    }

    const validPlans = ['daily', 'monthly', 'yearly'];
    if (!validPlans.includes(planType)) {
      return res.status(400).json({ error: 'Invalid plan type' });
    }

    // For adding plans, use the same extension logic
    let expiryDate = user.premiumExpiry && user.premiumExpiry > new Date() ? user.premiumExpiry : new Date();
    switch(planType) {
      case 'daily': expiryDate.setDate(expiryDate.getDate() + 1); break;
      case 'monthly': expiryDate.setMonth(expiryDate.getMonth() + 1); break;
      case 'yearly': expiryDate.setFullYear(expiryDate.getFullYear() + 1); break;
    }

    // Use updateOne for adding as well
    const result = await User.updateOne(
      { _id: userId },
      {
        $set: {
          isPremium: true,
          premiumPlan: planType,
          premiumExpiry: expiryDate,
          purchaseDate: new Date()
        }
      }
    );
    
    console.log('📊 Add plan result:', result);
    
    const updatedUser = await User.findById(userId);
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

// Admin: Manually add premium time to a user
app.post('/api/admin/add-premium-time', isAdmin, async (req, res) => {
  try {
    const { userId, planType, customDays, customHours } = req.body;
    if (!userId) return res.status(400).json({ error: 'User ID is required' });

    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ error: 'User not found' });

    console.log(`🛠️ Before adjustment: ${user.email} expiry = ${user.premiumExpiry}`);

    const now = new Date();
    let expiry = user.premiumExpiry && user.premiumExpiry > now ? user.premiumExpiry : now;

    if (planType) {
      switch (planType) {
        case 'daily': expiry.setDate(expiry.getDate() + 1); break;
        case 'monthly': expiry.setMonth(expiry.getMonth() + 1); break;
        case 'yearly': expiry.setFullYear(expiry.getFullYear() + 1); break;
        default: return res.status(400).json({ error: 'Invalid plan type' });
      }
    } else if (customDays || customHours) {
      if (customDays) expiry.setDate(expiry.getDate() + parseInt(customDays));
      if (customHours) expiry.setHours(expiry.getHours() + parseInt(customHours));
    } else {
      return res.status(400).json({ error: 'Must provide planType or custom days/hours' });
    }

    // Update using updateOne
    const result = await User.updateOne(
      { _id: userId },
      {
        $set: {
          isPremium: true,
          premiumExpiry: expiry,
          premiumPlan: planType || user.premiumPlan
        }
      }
    );

    console.log('📊 Update result:', result);

    if (result.matchedCount === 0) {
      return res.status(404).json({ error: 'User not found (update match failed)' });
    }

    const updatedUser = await User.findById(userId);
    res.json({
      success: true,
      message: `Premium extended until ${expiry.toISOString()}`,
      newExpiry: expiry,
      user: updatedUser,
      result: result
    });
  } catch (error) {
    console.error('Manual premium adjustment error:', error);
    res.status(500).json({ error: 'Failed to adjust premium' });
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

    let announcement = await Announcement.findOne();
    if (announcement) {
      announcement.message = message;
      announcement.buttonText = buttonText || 'Learn More';
      announcement.buttonLink = buttonLink || '/get-premium';
      announcement.active = active !== undefined ? active : true;
      announcement.version += 1;
      announcement.updatedAt = new Date();
    } else {
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

// Admin: Deactivate announcement
app.delete('/api/admin/announcement', isAdmin, async (req, res) => {
  try {
    const announcement = await Announcement.findOne();
    if (!announcement) {
      return res.status(404).json({ error: 'No announcement found' });
    }
    announcement.active = false;
    announcement.version += 1;
    await announcement.save();
    res.json({ success: true, message: 'Announcement deactivated' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to deactivate announcement' });
  }
});

// Admin: Get current announcement
app.get('/api/admin/announcement', isAdmin, async (req, res) => {
  try {
    const announcement = await Announcement.findOne();
    res.json({ success: true, announcement });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch announcement' });
  }
});

// ============ ADMIN QUESTION MANAGEMENT ============

// Get all quizzes (admin only, for listing)
app.get('/api/admin/quizzes', isAdmin, async (req, res) => {
  try {
    const quizzes = await Quiz.find().select('title category _id');
    res.json({ success: true, quizzes });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch quizzes' });
  }
});

// Get questions for a specific quiz (admin only)
app.get('/api/admin/quizzes/:quizId/questions', isAdmin, async (req, res) => {
  try {
    const quiz = await Quiz.findById(req.params.quizId);
    if (!quiz) return res.status(404).json({ error: 'Quiz not found' });
    res.json({ success: true, questions: quiz.questions });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch questions' });
  }
});

// Add a new question to a quiz (admin only)
app.post('/api/admin/quizzes/:quizId/questions', isAdmin, async (req, res) => {
  try {
    const { questionText, options, correctAnswer, points } = req.body;
    if (!questionText || !options || options.length !== 4 || correctAnswer === undefined) {
      return res.status(400).json({ error: 'Missing required fields' });
    }
    const quiz = await Quiz.findById(req.params.quizId);
    if (!quiz) return res.status(404).json({ error: 'Quiz not found' });
    quiz.questions.push({ questionText, options, correctAnswer, points: points || 1 });
    await quiz.save();
    res.json({ success: true, question: quiz.questions[quiz.questions.length - 1] });
  } catch (error) {
    console.error('Add question error:', error);
    res.status(500).json({ error: 'Failed to add question' });
  }
});

// Update a question (admin only) – use sub-document _id
app.put('/api/admin/quizzes/:quizId/questions/:questionId', isAdmin, async (req, res) => {
  try {
    const { questionText, options, correctAnswer, points } = req.body;
    const quiz = await Quiz.findById(req.params.quizId);
    if (!quiz) return res.status(404).json({ error: 'Quiz not found' });
    const question = quiz.questions.id(req.params.questionId);
    if (!question) return res.status(404).json({ error: 'Question not found' });
    if (questionText !== undefined) question.questionText = questionText;
    if (options !== undefined) question.options = options;
    if (correctAnswer !== undefined) question.correctAnswer = correctAnswer;
    if (points !== undefined) question.points = points;
    await quiz.save();
    res.json({ success: true, question });
  } catch (error) {
    console.error('Update question error:', error);
    res.status(500).json({ error: 'Failed to update question' });
  }
});

// Delete a question (admin only)
app.delete('/api/admin/quizzes/:quizId/questions/:questionId', isAdmin, async (req, res) => {
  try {
    const quiz = await Quiz.findById(req.params.quizId);
    if (!quiz) return res.status(404).json({ error: 'Quiz not found' });
    const question = quiz.questions.id(req.params.questionId);
    if (!question) return res.status(404).json({ error: 'Question not found' });
    quiz.questions.pull(req.params.questionId);
    await quiz.save();
    res.json({ success: true, message: 'Question deleted' });
  } catch (error) {
    console.error('Delete question error:', error);
    res.status(500).json({ error: 'Failed to delete question' });
  }
});

// ============ CONTACT ROUTE ============
app.post('/api/contact', async (req, res) => {
  try {
    const { name, email, message } = req.body;
    const contact = new Contact({ name, email, message });
    await contact.save();

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
        isPremium: premiumStatus.isPremium
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
  const premiumStatus = await checkAndUpdatePremium(req.user);
  res.json({
    id: req.user._id,
    name: req.user.name,
    isPremium: premiumStatus.isPremium,
    premiumPlan: premiumStatus.plan,
    premiumExpiry: premiumStatus.expiry,
    email: req.user.email,
    isVerified: req.user.isVerified,
    marketingConsent: req.user.marketingConsent
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
    console.log('📝 Quiz submission started for user:', req.user?._id);

    const quiz = await Quiz.findById(req.params.quizId);
    if (!quiz) {
      console.log('❌ Quiz not found:', req.params.quizId);
      return res.status(404).json({ error: 'Quiz not found' });
    }

    const { answers } = req.body;
    let score = 0, total = 0;
    quiz.questions.forEach((q, i) => {
      total += q.points || 1;
      if (answers[i] === q.correctAnswer) score += q.points || 1;
    });
    const percentage = (score / total) * 100;
    const passed = percentage >= 70;

    console.log(`📊 Score: ${score}/${total} (${percentage}%)`);

    // ===== SAVE QUIZ RESULT =====
    const user = await User.findById(req.user._id);
    console.log('🔍 User found:', user?.email);

    if (user) {
      const resultEntry = {
        quizId: req.params.quizId,
        score: score,
        total: total,
        percentage: percentage,
        date: new Date()
      };
      console.log('📝 Pushing result:', resultEntry);
      user.quizResults.push(resultEntry);

      console.log(`📊 Before save: ${user.quizResults.length} results`);
      await user.save();
      console.log(`✅ After save: ${user.quizResults.length} results`);

      // Verify by fetching again
      const refreshed = await User.findById(req.user._id);
      console.log(`✅ Verified: ${refreshed.quizResults.length} results in DB`);
    } else {
      console.log('❌ User NOT found!');
    }

    // ===== MARKETING EMAIL TRIGGER =====
    if (user && !user.isPremium && user.marketingConsent) {
      const freeExamsTaken = user.quizResults.length || 0;
      const lastEmailDate = user.lastMarketingEmailSent || new Date(0);
      const daysSinceLast = (Date.now() - lastEmailDate.getTime()) / (1000 * 60 * 60 * 24);

      if (freeExamsTaken >= 3 && daysSinceLast > 7) {
        console.log(`📧 Sending marketing email to ${user.email} (${freeExamsTaken} exams)`);
        sendMarketingEmail(user.email, user.name, 'upgrade')
          .then(sent => {
            if (sent) {
              console.log(`✅ Upgrade email sent to ${user.email}`);
            }
          })
          .catch(err => console.error('Async email error:', err));

        user.lastMarketingEmailSent = new Date();
        await user.save();
      }
    }

    res.json({ score, total, percentage, passed });

  } catch (error) {
    console.error('❌ Submit error:', error);
    res.status(400).json({ error: error.message });
  }
});

// ============ PREMIUM EXAM SUBMISSION ============
app.post('/api/premium-exam/submit', authenticate, async (req, res) => {
  try {
    const { category, topic, examId, answers, score, total, percentage } = req.body;

    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Create a unique quizId for the premium exam
    const quizId = `premium-${category}-${topic}-${examId}`;

    user.quizResults.push({
      quizId: quizId,
      score: score,
      total: total,
      percentage: percentage,
      date: new Date()
    });

    await user.save();

    console.log(`✅ Premium exam result saved for ${user.email}: ${score}/${total}`);

    res.json({ success: true, message: 'Premium exam result saved' });
  } catch (error) {
    console.error('❌ Premium exam submission error:', error);
    res.status(500).json({ error: 'Failed to save premium exam result' });
  }
});

// ============ WEEKLY QUIZ ROUTES ============
app.get('/api/weekly-quiz/current', authenticate, async (req, res) => {
  try {
    const today = new Date();

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
    }).sort({ weekNumber: -1 });

    if (!quiz) {
      return res.json({ success: false, message: 'No active weekly quiz available right now.' });
    }

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

app.post('/api/weekly-quiz/submit', authenticate, async (req, res) => {
  try {
    const { quizId, answers, timeSpent } = req.body;

    if (!quizId) {
      return res.status(400).json({ error: 'Quiz ID required' });
    }

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

// ============ ADMIN WEEKLY QUIZ ROUTES ============
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

app.put('/api/admin/weekly-quiz/:id', isAdmin, async (req, res) => {
  try {
    const updateData = { ...req.body };

    if (updateData.isActive === true) {
      updateData.publishedAt = new Date();
    }

    const quiz = await WeeklyQuiz.findByIdAndUpdate(req.params.id, updateData, { new: true });
    if (!quiz) return res.status(404).json({ error: 'Quiz not found' });
    res.json({ success: true, quiz });
  } catch (error) {
    console.error('Update quiz error:', error);
    res.status(500).json({ error: 'Failed to update quiz' });
  }
});

app.delete('/api/admin/weekly-quiz/:id', isAdmin, async (req, res) => {
  try {
    await WeeklyQuiz.findByIdAndDelete(req.params.id);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete quiz' });
  }
});

app.get('/api/admin/weekly-quizzes', isAdmin, async (req, res) => {
  try {
    const quizzes = await WeeklyQuiz.find().sort({ createdAt: -1 });
    res.json(quizzes);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch quizzes' });
  }
});

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

// ============ REMINDER EMAIL FUNCTION ============
const sendReminderEmail = async (to, name, plan, daysLeft, hoursLeft) => {
  let message = '';
  let subject = '⏰ Premium Plan Reminder';
  if (hoursLeft !== undefined && hoursLeft <= 24) {
    message = `Your ${plan} plan expires in ${Math.ceil(hoursLeft)} hours. Renew now to keep access!`;
  } else if (daysLeft !== undefined) {
    message = `Your ${plan} plan expires in ${Math.ceil(daysLeft)} days. Renew now to keep access!`;
  } else {
    subject = '⏰ Your Premium Plan Has Expired';
    message = `Your ${plan} plan has expired. Renew now to regain access!`;
  }
  const html = `<p>Hi ${name},</p><p>${message}</p>
    <div style="text-align:center;margin:20px 0;">
      <a href="https://elite-nursing-cbt.vercel.app/get-premium" style="background:#ff9800;color:white;padding:12px 24px;text-decoration:none;border-radius:30px;">Renew Now →</a>
    </div>
    <p>Best regards,<br/>ELITE Nursing CBT Team</p>`;
  try {
    const sendSmtpEmail = new SibApiV3Sdk.SendSmtpEmail();
    sendSmtpEmail.to = [{ email: to }];
    sendSmtpEmail.sender = { email: 'elitenursingcbt@gmail.com', name: 'ELITE Nursing CBT' };
    sendSmtpEmail.subject = subject;
    sendSmtpEmail.htmlContent = html;
    sendSmtpEmail.textContent = `${message}`;
    await apiInstance.sendTransacEmail(sendSmtpEmail);
    console.log(`✅ Reminder email sent to ${to}`);
    return true;
  } catch (error) {
    console.error('❌ Reminder email failed:', error);
    return false;
  }
};

// ============ ADMIN: BROADCAST EMAIL ============
app.post('/api/admin/broadcast-email', isAdmin, async (req, res) => {
  const { subject, message, templateType } = req.body;

  try {
    const freeUsers = await User.find({
      isPremium: false,
      isVerified: true,
      marketingConsent: true
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

// ============ PAYMENT ROUTES ============
app.post('/api/initialize-payment', async (req, res) => {
  try {
    const { email, amount, userId, planType, examId, examTitle, sectionNumber, redirect_url, couponCode } = req.body;

    if (!userId) {
      console.error('❌ Payment initialization failed: userId is missing');
      return res.status(400).json({ error: 'User ID is required' });
    }

    // ===== COUPON VALIDATION =====
    let finalAmount = amount;
    let appliedCoupon = null;
    let discountAmount = 0;

    if (couponCode) {
      const coupon = await Coupon.findOne({
        code: couponCode.toUpperCase(),
        active: true,
        expiryDate: { $gt: new Date() }
      });

      if (coupon && coupon.usedCount < coupon.usageLimit) {
        const user = await User.findById(userId);
        const alreadyUsed = user.appliedCoupons.some(c => c.code === coupon.code);
        if (!alreadyUsed) {
          if (coupon.discountType === 'percentage') {
            discountAmount = (amount * coupon.discountValue) / 100;
            if (coupon.maxDiscount && discountAmount > coupon.maxDiscount) {
              discountAmount = coupon.maxDiscount;
            }
          } else {
            discountAmount = coupon.discountValue;
          }
          finalAmount = Math.max(0, amount - discountAmount);
          appliedCoupon = coupon;
        }
      }
    }

    const tx_ref = `ELITE-${Date.now()}-${userId}-${Math.random().toString(36).substring(2, 8)}`;
    console.log(`💰 INITIALIZING PAYMENT: ${tx_ref} for user ${userId}, original: ${amount}, final: ${finalAmount}`);

    const user = await User.findById(userId);
    if (!user) {
      return res.status(401).json({ error: 'Your account has been deleted. Please log out and contact support.' });
    }

    // Store coupon info if applied (NEW)
    if (appliedCoupon) {
      appliedCoupon.usedCount += 1;
      await appliedCoupon.save();
      user.appliedCoupons.push({
        code: appliedCoupon.code,
        discountAmount: discountAmount,
        appliedAt: new Date()
      });
    }

    const finalRedirectUrl = redirect_url || `https://elite-nursing-cbt.vercel.app/payment-return?reference=${tx_ref}`;

    const response = await axios.post('https://api.flutterwave.com/v3/payments', {
      tx_ref,
      amount: finalAmount,
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

    user.transactions.push({
      reference: tx_ref,
      flutterwaveId: flutterwaveId,
      amount: finalAmount,
      originalAmount: amount,
      discountAmount: discountAmount,
      couponCode: appliedCoupon?.code || null,
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

app.post('/api/verify-payment', async (req, res) => {
  try {
    const { reference, transactionId, userId } = req.body;

    console.log(`🔍 VERIFYING - Reference: ${reference}, TransactionId: ${transactionId}, UserId: ${userId}`);

    if ((!reference && !transactionId) || !userId) {
      return res.status(400).json({ success: false, error: 'Missing reference or userId' });
    }

    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ success: false, error: 'User not found' });

    console.log(`🧑‍💻 User: ${user.email}, isPremium: ${user.isPremium}, current premiumExpiry: ${user.premiumExpiry}`);

    // Find the transaction index
    const transactionIndex = user.transactions.findIndex(t => t.reference === reference);
    if (transactionIndex === -1) {
      console.log(`Transaction not found for reference: ${reference}`);
      return res.status(404).json({ success: false, error: 'Transaction not found' });
    }
    const transaction = user.transactions[transactionIndex];

    // 👇 If transaction already completed, return current state without re-processing
    if (transaction.status === 'completed') {
      console.log(`⚠️ Transaction ${reference} already processed. Returning current state.`);
      return res.json({
        success: true,
        isPremium: user.isPremium,
        plan: user.premiumPlan,
        expiry: user.premiumExpiry,
        alreadyProcessed: true
      });
    }

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
      const plan = transaction.planType || 'monthly';
      console.log(`📦 Plan from transaction: ${plan}`);

      const now = new Date();
      console.log(`🕐 Now: ${now.toISOString()}`);

      // Determine starting expiry
      let expiry;
      if (!user.isPremium) {
        console.log(`ℹ️ User is not premium – starting fresh from now.`);
        expiry = new Date(now);
      } else {
        // User is premium – extend from existing expiry if it's in the future
        expiry = (user.premiumExpiry && user.premiumExpiry > now)
          ? new Date(user.premiumExpiry)
          : new Date(now);
        console.log(`ℹ️ User is premium – starting from existing expiry: ${expiry.toISOString()}`);
      }

      console.log(`📆 Starting expiry (before adding plan): ${expiry.toISOString()}`);

      // Add the plan duration
      switch (plan) {
        case 'daily': expiry.setDate(expiry.getDate() + 1); break;
        case 'monthly': expiry.setMonth(expiry.getMonth() + 1); break;
        case 'yearly': expiry.setFullYear(expiry.getFullYear() + 1); break;
        default: expiry.setFullYear(expiry.getFullYear() + 1);
      }

      console.log(`📆 Final expiry (after adding ${plan}): ${expiry.toISOString()}`);

      // Update user fields and transaction status directly
      user.isPremium = true;
      user.premiumPlan = plan;
      user.premiumExpiry = expiry;
      user.purchaseDate = new Date();
      user.transactions[transactionIndex].status = 'completed';
      user.transactions[transactionIndex].flutterwaveId = txData.id;

      await user.save();

      console.log(`✅ User ${user.email} premium extended to ${expiry.toISOString()}`);

      return res.json({
        success: true,
        isPremium: true,
        plan: plan,
        expiry: expiry,
        user: user
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

// ============ PUSH NOTIFICATIONS ============
app.post('/api/register-token', async (req, res) => {
  const { token, userId } = req.body;
  if (!token || !userId) return res.status(400).json({ error: 'Missing token or userId' });
  try {
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

// ============ ADMIN: GENERATE OTP / RESET CODE ============
app.post('/api/admin/generate-verification-code', isAdmin, async (req, res) => {
  const { email } = req.body;
  if (!email) return res.status(400).json({ error: 'Email required' });

  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  otpStore.set(`verify_${email}`, { otp, expires: Date.now() + 10 * 60000 });

  console.log(`Admin generated OTP for ${email}: ${otp}`);
  res.json({ otp, message: 'Verification code generated successfully' });
});

app.post('/api/admin/generate-reset-code', isAdmin, async (req, res) => {
  const { email } = req.body;
  if (!email) return res.status(400).json({ error: 'Email required' });

  const user = await User.findOne({ email });
  if (!user) return res.status(404).json({ error: 'User not found' });

  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  otpStore.set(`reset_${email}`, { otp, expires: Date.now() + 10 * 60000, name: user.name });

  console.log(`Admin generated reset OTP for ${email}: ${otp}`);
  res.json({ otp, message: 'Reset code generated successfully' });
});

// ============ UPDATE USER PROFILE ============
app.put('/api/user/profile', authenticate, async (req, res) => {
  try {
    const { name } = req.body;
    if (!name || name.trim().length === 0) {
      return res.status(400).json({ error: 'Name cannot be empty' });
    }
    req.user.name = name.trim();
    await req.user.save();
    const updatedUser = req.user.toObject();
    delete updatedUser.password;
    res.json(updatedUser);
  } catch (error) {
    console.error('Profile update error:', error);
    res.status(500).json({ error: 'Failed to update profile' });
  }
});

// =============================================
// ============ NEW ROUTES =====================
// =============================================

// ============ 1. SYSTEM SETTINGS (CONFIG) ROUTES ============

// Get public config (limited fields for public use)
app.get('/api/config', async (req, res) => {
  try {
    let config = await Config.findOne();
    if (!config) {
      config = new Config();
      await config.save();
    }
    res.json({
      success: true,
      config: {
        appName: config.appName,
        freeExamLimit: config.freeExamLimit,
        defaultPassingScore: config.defaultPassingScore,
        showWeeklyQuiz: config.showWeeklyQuiz,
        showLeaderboard: config.showLeaderboard,
        maintenanceMode: config.maintenanceMode,
        maintenanceMessage: config.maintenanceMessage
      }
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch config' });
  }
});

// Admin: Get full config
app.get('/api/admin/config', isAdmin, async (req, res) => {
  try {
    let config = await Config.findOne();
    if (!config) {
      config = new Config();
      await config.save();
    }
    res.json({ success: true, config });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch config' });
  }
});

// Admin: Update config
app.put('/api/admin/config', isAdmin, async (req, res) => {
  try {
    let config = await Config.findOne();
    if (!config) {
      config = new Config();
    }

    const allowedFields = [
      'premiumDailyPrice', 'premiumMonthlyPrice', 'premiumYearlyPrice',
      'freeExamLimit', 'defaultPassingScore', 'maintenanceMode',
      'maintenanceMessage', 'appName', 'appLogo', 'contactEmail',
      'contactPhone', 'defaultTimeLimit', 'showWeeklyQuiz', 'showLeaderboard'
    ];

    for (const field of allowedFields) {
      if (req.body[field] !== undefined) {
        config[field] = req.body[field];
      }
    }

    config.updatedAt = new Date();
    await config.save();

    res.json({ success: true, config });
  } catch (error) {
    console.error('Config update error:', error);
    res.status(500).json({ error: 'Failed to update config' });
  }
});

// ============ 2. CATEGORY ROUTES ============

// Get all active categories (public)
app.get('/api/categories', async (req, res) => {
  try {
    const categories = await Category.find({ active: true }).sort({ order: 1 });
    res.json({ success: true, categories });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch categories' });
  }
});

// Admin: Get all categories (including inactive)
app.get('/api/admin/categories', isAdmin, async (req, res) => {
  try {
    const categories = await Category.find().sort({ order: 1 });
    res.json({ success: true, categories });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch categories' });
  }
});

// Admin: Create category
app.post('/api/admin/categories', isAdmin, async (req, res) => {
  try {
    const { name, icon, description, order, active } = req.body;
    if (!name) return res.status(400).json({ error: 'Name is required' });

    const slug = name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');

    const existing = await Category.findOne({ slug });
    if (existing) return res.status(400).json({ error: 'Category with this slug already exists' });

    const category = new Category({
      name,
      slug,
      icon: icon || '📚',
      description: description || '',
      order: order || 0,
      active: active !== undefined ? active : true
    });

    await category.save();
    res.json({ success: true, category });
  } catch (error) {
    console.error('Category create error:', error);
    res.status(500).json({ error: 'Failed to create category' });
  }
});

// Admin: Update category
app.put('/api/admin/categories/:id', isAdmin, async (req, res) => {
  try {
    const { name, icon, description, order, active } = req.body;
    const category = await Category.findById(req.params.id);
    if (!category) return res.status(404).json({ error: 'Category not found' });

    if (name) {
      category.name = name;
      category.slug = name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
    }
    if (icon !== undefined) category.icon = icon;
    if (description !== undefined) category.description = description;
    if (order !== undefined) category.order = order;
    if (active !== undefined) category.active = active;

    await category.save();
    res.json({ success: true, category });
  } catch (error) {
    console.error('Category update error:', error);
    res.status(500).json({ error: 'Failed to update category' });
  }
});

// Admin: Delete category (soft delete – set active: false)
app.delete('/api/admin/categories/:id', isAdmin, async (req, res) => {
  try {
    const category = await Category.findById(req.params.id);
    if (!category) return res.status(404).json({ error: 'Category not found' });
    category.active = false;
    await category.save();
    res.json({ success: true, message: 'Category deactivated' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete category' });
  }
});

// Admin: Hard delete category (use with caution)
app.delete('/api/admin/categories/:id/permanent', isAdmin, async (req, res) => {
  try {
    await Category.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: 'Category permanently deleted' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete category' });
  }
});

// ============ 3. COUPON ROUTES ============ (with planType support)

// Validate coupon (public, for checkout)
app.post('/api/validate-coupon', authenticate, async (req, res) => {
  try {
    const { code, amount, planType } = req.body; // 👈 added planType
    if (!code) return res.status(400).json({ error: 'Coupon code is required' });
    if (!planType) return res.status(400).json({ error: 'Plan type is required' });

    const coupon = await Coupon.findOne({
      code: code.toUpperCase(),
      active: true,
      expiryDate: { $gt: new Date() }
    });

    if (!coupon) {
      return res.json({ success: false, error: 'Invalid or expired coupon code' });
    }

    // 👇 NEW: Check plan-specific validity
    if (coupon.planType !== 'all' && coupon.planType !== planType) {
      return res.json({
        success: false,
        error: `This coupon is valid for ${coupon.planType} plan only.`
      });
    }

    if (coupon.usedCount >= coupon.usageLimit) {
      return res.json({ success: false, error: 'Coupon has reached its usage limit' });
    }

    const user = await User.findById(req.user._id);
    const alreadyUsed = user.appliedCoupons.some(c => c.code === coupon.code);
    if (alreadyUsed) {
      return res.json({ success: false, error: 'You have already used this coupon' });
    }

    let discountAmount = 0;
    let finalAmount = amount;

    if (coupon.discountType === 'percentage') {
      discountAmount = (amount * coupon.discountValue) / 100;
      if (coupon.maxDiscount && discountAmount > coupon.maxDiscount) {
        discountAmount = coupon.maxDiscount;
      }
    } else {
      discountAmount = coupon.discountValue;
    }

    finalAmount = Math.max(0, amount - discountAmount);

    res.json({
      success: true,
      coupon: {
        code: coupon.code,
        discountType: coupon.discountType,
        discountValue: coupon.discountValue,
        discountAmount: Math.round(discountAmount * 100) / 100,
        finalAmount: Math.round(finalAmount * 100) / 100,
        planType: coupon.planType // optional, for frontend
      }
    });
  } catch (error) {
    console.error('Coupon validation error:', error);
    res.status(500).json({ error: 'Failed to validate coupon' });
  }
});

// Admin: Get all coupons
app.get('/api/admin/coupons', isAdmin, async (req, res) => {
  try {
    const coupons = await Coupon.find().sort({ createdAt: -1 });
    res.json({ success: true, coupons });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch coupons' });
  }
});

// Admin: Create coupon
app.post('/api/admin/coupons', isAdmin, async (req, res) => {
  try {
    const { code, discountType, discountValue, planType, minPurchase, maxDiscount, expiryDate, usageLimit, active, description } = req.body;

    if (!code || !discountValue || !expiryDate) {
      return res.status(400).json({ error: 'Code, discount value, and expiry date are required' });
    }

    const existing = await Coupon.findOne({ code: code.toUpperCase() });
    if (existing) return res.status(400).json({ error: 'Coupon code already exists' });

    const coupon = new Coupon({
      code: code.toUpperCase(),
      discountType: discountType || 'percentage',
      discountValue,
      planType: planType || 'all', // 👈 NEW
      minPurchase: minPurchase || 0,
      maxDiscount: maxDiscount || null,
      expiryDate: new Date(expiryDate),
      usageLimit: usageLimit || 1,
      active: active !== undefined ? active : true,
      description: description || ''
    });

    await coupon.save();
    res.json({ success: true, coupon });
  } catch (error) {
    console.error('Coupon create error:', error);
    res.status(500).json({ error: 'Failed to create coupon' });
  }
});

// Admin: Update coupon
app.put('/api/admin/coupons/:id', isAdmin, async (req, res) => {
  try {
    const coupon = await Coupon.findById(req.params.id);
    if (!coupon) return res.status(404).json({ error: 'Coupon not found' });

    const { code, discountType, discountValue, planType, minPurchase, maxDiscount, expiryDate, usageLimit, active, description } = req.body;

    if (code && code !== coupon.code) {
      const existing = await Coupon.findOne({ code: code.toUpperCase() });
      if (existing) return res.status(400).json({ error: 'Coupon code already exists' });
      coupon.code = code.toUpperCase();
    }
    if (discountType) coupon.discountType = discountType;
    if (discountValue !== undefined) coupon.discountValue = discountValue;
    if (planType) coupon.planType = planType; // 👈 NEW
    if (minPurchase !== undefined) coupon.minPurchase = minPurchase;
    if (maxDiscount !== undefined) coupon.maxDiscount = maxDiscount;
    if (expiryDate) coupon.expiryDate = new Date(expiryDate);
    if (usageLimit !== undefined) coupon.usageLimit = usageLimit;
    if (active !== undefined) coupon.active = active;
    if (description !== undefined) coupon.description = description;

    await coupon.save();
    res.json({ success: true, coupon });
  } catch (error) {
    console.error('Coupon update error:', error);
    res.status(500).json({ error: 'Failed to update coupon' });
  }
});

// Admin: Delete coupon
app.delete('/api/admin/coupons/:id', isAdmin, async (req, res) => {
  try {
    await Coupon.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: 'Coupon deleted' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete coupon' });
  }
});

// ============ 4. FAQ ROUTES ============

// Get all active FAQs (public)
app.get('/api/faqs', async (req, res) => {
  try {
    const faqs = await FAQ.find({ active: true }).sort({ order: 1 });
    res.json({ success: true, faqs });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch FAQs' });
  }
});

// Admin: Get all FAQs
app.get('/api/admin/faqs', isAdmin, async (req, res) => {
  try {
    const faqs = await FAQ.find().sort({ order: 1 });
    res.json({ success: true, faqs });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch FAQs' });
  }
});

// Admin: Create FAQ
app.post('/api/admin/faqs', isAdmin, async (req, res) => {
  try {
    const { question, answer, category, order, active } = req.body;
    if (!question || !answer) {
      return res.status(400).json({ error: 'Question and answer are required' });
    }

    const faq = new FAQ({
      question,
      answer,
      category: category || 'General',
      order: order || 0,
      active: active !== undefined ? active : true
    });

    await faq.save();
    res.json({ success: true, faq });
  } catch (error) {
    console.error('FAQ create error:', error);
    res.status(500).json({ error: 'Failed to create FAQ' });
  }
});

// Admin: Update FAQ
app.put('/api/admin/faqs/:id', isAdmin, async (req, res) => {
  try {
    const faq = await FAQ.findById(req.params.id);
    if (!faq) return res.status(404).json({ error: 'FAQ not found' });

    const { question, answer, category, order, active } = req.body;

    if (question) faq.question = question;
    if (answer) faq.answer = answer;
    if (category) faq.category = category;
    if (order !== undefined) faq.order = order;
    if (active !== undefined) faq.active = active;

    await faq.save();
    res.json({ success: true, faq });
  } catch (error) {
    console.error('FAQ update error:', error);
    res.status(500).json({ error: 'Failed to update FAQ' });
  }
});

// Admin: Delete FAQ
app.delete('/api/admin/faqs/:id', isAdmin, async (req, res) => {
  try {
    await FAQ.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: 'FAQ deleted' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete FAQ' });
  }
});

// ============ 5. ADMIN DASHBOARD / ANALYTICS ============

app.get('/api/admin/dashboard', isAdmin, async (req, res) => {
  try {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    // User counts
    const totalUsers = await User.countDocuments({ isVerified: true });
    const premiumUsers = await User.countDocuments({ isPremium: true, premiumExpiry: { $gt: now } });
    const newToday = await User.countDocuments({ createdAt: { $gte: today } });
    const newThisMonth = await User.countDocuments({ createdAt: { $gte: startOfMonth } });

    // Revenue (from transactions)
    const transactions = await User.aggregate([
      { $unwind: '$transactions' },
      { $match: { 'transactions.status': 'completed' } },
      { $group: {
        _id: null,
        totalRevenue: { $sum: '$transactions.amount' },
        totalTransactions: { $sum: 1 }
      }}
    ]);

    // Quiz completions
    const quizCompletions = await User.aggregate([
      { $unwind: '$quizResults' },
      { $count: 'total' }
    ]);

    // Weekly quiz attempts
    const weeklyAttempts = await WeeklyQuizAttempt.countDocuments();

    // Popular categories (from quizzes)
    const popularCategories = await Quiz.aggregate([
      { $group: { _id: '$category', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 5 }
    ]);

    // Recent users
    const recentUsers = await User.find()
      .select('name email createdAt isPremium')
      .sort({ createdAt: -1 })
      .limit(10);

    // Recent transactions
    const recentTransactions = await User.aggregate([
      { $unwind: '$transactions' },
      { $match: { 'transactions.status': 'completed' } },
      { $sort: { 'transactions.date': -1 } },
      { $limit: 10 },
      { $project: {
        user: '$name',
        email: '$email',
        amount: '$transactions.amount',
        planType: '$transactions.planType',
        date: '$transactions.date'
      }}
    ]);

    res.json({
      success: true,
      dashboard: {
        users: {
          total: totalUsers,
          premium: premiumUsers,
          free: totalUsers - premiumUsers,
          newToday,
          newThisMonth
        },
        revenue: {
          total: transactions[0]?.totalRevenue || 0,
          totalTransactions: transactions[0]?.totalTransactions || 0
        },
        quizzes: {
          completions: quizCompletions[0]?.total || 0,
          weeklyAttempts: weeklyAttempts || 0
        },
        popularCategories: popularCategories || [],
        recentUsers: recentUsers || [],
        recentTransactions: recentTransactions || []
      }
    });
  } catch (error) {
    console.error('Dashboard error:', error);
    res.status(500).json({ error: 'Failed to fetch dashboard data' });
  }
});

// =============================================
// ============ END NEW ROUTES =================
// =============================================

// ============ CRON JOB FOR PREMIUM REMINDERS ============
cron.schedule('0 * * * *', async () => {
  console.log('⏰ Checking premium reminders...');
  const now = new Date();
  const users = await User.find({ isPremium: true, premiumExpiry: { $gt: now } });

  for (const user of users) {
    const diffMs = user.premiumExpiry - now;
    const diffHours = diffMs / (1000 * 60 * 60);
    const diffDays = diffHours / 24;
    const plan = user.premiumPlan || 'monthly';
    let shouldNotify = false;
    let daysLeft = null, hoursLeft = null;

    if (plan === 'daily' && diffHours <= 2) {
      shouldNotify = true;
      hoursLeft = Math.ceil(diffHours);
    } else if (plan === 'monthly') {
      if (diffDays <= 3 && diffDays > 2.9) { shouldNotify = true; daysLeft = 3; }
      else if (diffHours <= 24 && diffHours > 23) { shouldNotify = true; hoursLeft = 24; }
    } else if (plan === 'yearly') {
      if (diffDays <= 180 && diffDays > 179.9) { shouldNotify = true; daysLeft = 180; }
      else if (diffDays <= 30 && diffDays > 29.9) { shouldNotify = true; daysLeft = 30; }
      else if (diffDays <= 3 && diffDays > 2.9) { shouldNotify = true; daysLeft = 3; }
      else if (diffHours <= 24 && diffHours > 23) { shouldNotify = true; hoursLeft = 24; }
    }

    if (shouldNotify) {
      const lastReminder = user.lastReminderSent || null;
      const thresholdKey = `${plan}-${daysLeft || hoursLeft}`;
      if (lastReminder !== thresholdKey) {
        await sendReminderEmail(user.email, user.name, plan, daysLeft, hoursLeft);
        user.lastReminderSent = thresholdKey;
        await user.save();
      }
    }
  }

  // Notify expired users (if not already notified)
  const expiredUsers = await User.find({
    isPremium: true,
    premiumExpiry: { $lt: now },
    notifiedExpired: { $ne: true }
  });
  for (const user of expiredUsers) {
    await sendReminderEmail(user.email, user.name, user.premiumPlan || 'premium', null, null);
    user.notifiedExpired = true;
    await user.save();
  }
});

// ============ STUDY PLAN ROUTES ============

// Helper: Get user's average score per quiz
const getUserQuizAverages = async (userId) => {
  const user = await User.findById(userId).populate('quizResults.quizId');
  if (!user) return {};

  const quizScores = {};
  for (const result of user.quizResults) {
    const quizId = result.quizId?.toString();
    if (!quizId) continue;
    if (!quizScores[quizId]) {
      quizScores[quizId] = { scores: [], total: 0, count: 0 };
    }
    quizScores[quizId].scores.push(result.percentage);
    quizScores[quizId].total += result.percentage;
    quizScores[quizId].count++;
  }
  // Compute averages
  const averages = {};
  for (const [quizId, data] of Object.entries(quizScores)) {
    averages[quizId] = data.total / data.count;
  }
  return averages;
};

// GET /api/study-plan/status - Check if user can generate a new plan
app.get('/api/study-plan/status', authenticate, async (req, res) => {
  try {
    const user = req.user;
    const isPremium = user.isPremium;
    const lastGenerated = user.lastStudyPlanGenerated;

    let canGenerate = true;
    let message = 'You can generate a new study plan.';

    if (!isPremium && lastGenerated) {
      const oneWeek = 7 * 24 * 60 * 60 * 1000;
      const diff = Date.now() - lastGenerated.getTime();
      if (diff < oneWeek) {
        const remaining = oneWeek - diff;
        const days = Math.floor(remaining / (24 * 60 * 60 * 1000));
        const hours = Math.floor((remaining % (24 * 60 * 60 * 1000)) / (60 * 60 * 1000));
        canGenerate = false;
        message = `Free users can generate one plan per week. You can generate again in ${days}d ${hours}h.`;
      }
    }

    res.json({ canGenerate, message, isPremium, hasPlan: !!user.studyPlan?.questions?.length });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/study-plan/current - Get the current study plan
app.get('/api/study-plan/current', authenticate, async (req, res) => {
  try {
    const user = req.user;
    if (!user.studyPlan || !user.studyPlan.questions.length) {
      return res.json({ success: true, plan: null });
    }
    // If the plan is completed, still return it for history view
    res.json({ success: true, plan: user.studyPlan });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/study-plan/generate - Generate a new study plan
app.post('/api/study-plan/generate', authenticate, async (req, res) => {
  try {
    const user = req.user;
    const isPremium = user.isPremium;

    // Check if allowed
    const lastGenerated = user.lastStudyPlanGenerated;
    if (!isPremium && lastGenerated) {
      const oneWeek = 7 * 24 * 60 * 60 * 1000;
      const diff = Date.now() - lastGenerated.getTime();
      if (diff < oneWeek) {
        return res.status(403).json({ error: 'Free users can generate one plan per week. Upgrade to Premium for unlimited.' });
      }
    }

    // Get user's quiz averages
    const averages = await getUserQuizAverages(user._id);
    if (Object.keys(averages).length === 0) {
      return res.status(400).json({ error: 'You haven\'t taken enough quizzes to generate a study plan. Take more exams first.' });
    }

    // Sort quizzes by average score (ascending)
    const sortedQuizzes = Object.entries(averages).sort((a, b) => a[1] - b[1]);

    // Select worst performing quizzes (bottom 3 or all if less)
    const weakQuizIds = sortedQuizzes.slice(0, Math.min(3, sortedQuizzes.length)).map(([id]) => id);

    // Fetch the quizzes and their questions
    const quizzes = await Quiz.find({ _id: { $in: weakQuizIds } });
    if (quizzes.length === 0) {
      return res.status(400).json({ error: 'No quizzes found for your weak areas.' });
    }

    // Determine number of questions per plan
    const totalQuestions = isPremium ? 25 : 10;
    const questionsPerQuiz = Math.floor(totalQuestions / quizzes.length);
    const extra = totalQuestions % quizzes.length;

    let selectedQuestions = [];
    for (let i = 0; i < quizzes.length; i++) {
      const quiz = quizzes[i];
      const qCount = questionsPerQuiz + (i < extra ? 1 : 0);
      // Shuffle and pick qCount questions
      const shuffled = quiz.questions.sort(() => 0.5 - Math.random());
      const picked = shuffled.slice(0, Math.min(qCount, shuffled.length));
      // Add quizId to each question
      picked.forEach(q => {
        selectedQuestions.push({
          ...q.toObject(),
          quizId: quiz._id,
          userAnswer: null
        });
      });
    }

    // If we still need more questions, fill from strong quizzes (random)
    if (selectedQuestions.length < totalQuestions) {
      const strongQuizIds = sortedQuizzes.slice(Math.min(3, sortedQuizzes.length)).map(([id]) => id);
      if (strongQuizIds.length) {
        const strongQuizzes = await Quiz.find({ _id: { $in: strongQuizIds } });
        const remaining = totalQuestions - selectedQuestions.length;
        const allQuestions = [];
        strongQuizzes.forEach(q => {
          q.questions.forEach(qq => {
            allQuestions.push({ ...qq.toObject(), quizId: q._id });
          });
        });
        const shuffledStrong = allQuestions.sort(() => 0.5 - Math.random());
        const pickedStrong = shuffledStrong.slice(0, remaining);
        selectedQuestions = selectedQuestions.concat(pickedStrong);
      }
    }

    // Store the plan in user document
    user.studyPlan = {
      generatedAt: new Date(),
      questions: selectedQuestions,
      completed: false,
      score: null,
      total: selectedQuestions.length
    };
    user.lastStudyPlanGenerated = new Date();
    await user.save();

    res.json({
      success: true,
      plan: user.studyPlan,
      message: `Study plan generated with ${selectedQuestions.length} questions.`
    });

  } catch (error) {
    console.error('Study plan generation error:', error);
    res.status(500).json({ error: error.message });
  }
});

// POST /api/study-plan/submit - Submit answers and get score
app.post('/api/study-plan/submit', authenticate, async (req, res) => {
  try {
    const user = req.user;
    const { answers } = req.body; // array of userAnswer per question index

    if (!user.studyPlan || !user.studyPlan.questions.length) {
      return res.status(400).json({ error: 'No active study plan.' });
    }
    if (user.studyPlan.completed) {
      return res.status(400).json({ error: 'This study plan has already been completed.' });
    }

    const plan = user.studyPlan;
    const questions = plan.questions;
    if (answers.length !== questions.length) {
      return res.status(400).json({ error: 'Please answer all questions.' });
    }

    let score = 0;
    for (let i = 0; i < questions.length; i++) {
      const q = questions[i];
      const userAns = answers[i];
      if (userAns === undefined || userAns === null) {
        return res.status(400).json({ error: 'Please answer all questions.' });
      }
      q.userAnswer = userAns;
      if (userAns === q.correctAnswer) {
        score++;
      }
    }

    plan.completed = true;
    plan.score = score;
    // Save the plan history? We'll overwrite the plan, but we can keep the old plan for review? We'll keep it as is.
    await user.save();

    res.json({
      success: true,
      score,
      total: questions.length,
      percentage: ((score / questions.length) * 100).toFixed(1),
      passed: score / questions.length >= 0.7
    });

  } catch (error) {
    console.error('Submit study plan error:', error);
    res.status(500).json({ error: error.message });
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