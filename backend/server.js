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

const app = express();

// ============ CORS CONFIGURATION ============
const allowedOrigins = [
  'https://elite-nursing-cbt.vercel.app',
  'http://localhost:5173',
  'http://localhost:5000',
  'https://elite-nursing-backend.onrender.com'
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
  }]
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

const User = mongoose.model('User', UserSchema);
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
    sendSmtpEmail.sender = { email: 'anaduphilip2000@gmail.com', name: 'ELITE Nursing CBT' };
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
    if (user.email !== 'anaduphilip2000@gmail.com') {
      return res.status(403).json({ error: 'Admin access only' });
    }
    req.userId = decoded.userId;
    next();
  } catch (error) {
    res.status(401).json({ error: 'Invalid token' });
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

app.post('/api/admin/toggle-premium', isAdmin, async (req, res) => {
  try {
    const { userId, isPremium } = req.body;
    await User.findByIdAndUpdate(userId, { isPremium });
    res.json({ success: true });
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
    sendSmtpEmail.sender = { email: 'anaduphilip2000@gmail.com', name: 'ELITE Nursing CBT Support' };
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

// ============ CONTACT ROUTE ============
app.post('/api/contact', async (req, res) => {
  try {
    const { name, email, message } = req.body;
    const contact = new Contact({ name, email, message });
    await contact.save();
    
    // Send email notification to admin
    const htmlContent = getContactEmailTemplate(name, email, message);
    const sendSmtpEmail = new SibApiV3Sdk.SendSmtpEmail();
    sendSmtpEmail.to = [{ email: 'anaduphilip2000@gmail.com' }];
    sendSmtpEmail.sender = { email: 'anaduphilip2000@gmail.com', name: 'ELITE Nursing CBT' };
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
    const stored = otpStore.get(`verify_${email}`);
    if (!stored) return res.status(400).json({ error: 'No code found' });
    if (Date.now() > stored.expires) return res.status(400).json({ error: 'Code expired' });
    if (stored.otp !== otp) return res.status(400).json({ error: 'Invalid code' });
    otpStore.set(`verified_${email}`, { verified: true, name: stored.name });
    otpStore.delete(`verify_${email}`);
    res.json({ success: true, message: 'Email verified' });
  } catch (error) {
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
    const { name, email, password } = req.body;
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
      const sessionToken = generateSessionToken();
      existingUser.currentSessionToken = sessionToken;
      existingUser.lastLoginAt = new Date();
      await existingUser.save();
      const token = jwt.sign({ userId: existingUser._id, sessionToken }, process.env.JWT_SECRET || 'elite_secret_key_2024');
      otpStore.delete(`verified_${email}`);
      return res.json({ success: true, token, user: { id: existingUser._id, name: existingUser.name, email, isPremium: existingUser.isPremium } });
    }
    const sessionToken = generateSessionToken();
    const user = new User({ 
      name: name || verifiedData.name, 
      email, 
      password: hashedPassword, 
      isVerified: true,
      currentSessionToken: sessionToken,
      lastLoginAt: new Date()
    });
    await user.save();
    otpStore.delete(`verified_${email}`);
    const token = jwt.sign({ userId: user._id, sessionToken }, process.env.JWT_SECRET || 'elite_secret_key_2024');
    res.json({ success: true, token, user: { id: user._id, name: user.name, email, isPremium: user.isPremium } });
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
    
    // Check if user is already logged in on another device
    if (user.currentSessionToken) {
      return res.status(401).json({ error: 'You are already logged in on another device. Please log out from that device first.' });
    }
    
    const sessionToken = generateSessionToken();
    user.currentSessionToken = sessionToken;
    user.lastLoginAt = new Date();
    await user.save();
    
    const token = jwt.sign({ userId: user._id, sessionToken }, process.env.JWT_SECRET || 'elite_secret_key_2024');
    res.json({ token, user: { id: user._id, name: user.name, email, isPremium: user.isPremium } });
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
    res.json({ valid: true, user: { id: user._id, name: user.name, email: user.email, isPremium: user.isPremium } });
  } catch (error) {
    res.status(401).json({ error: 'Invalid token' });
  }
});

app.get('/api/user/profile', async (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) return res.status(401).json({ error: 'No token' });
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'elite_secret_key_2024');
    const user = await User.findById(decoded.userId);
    res.json({ id: user._id, name: user.name, isPremium: user.isPremium, email: user.email, isVerified: user.isVerified });
  } catch (error) {
    res.status(401).json({ error: 'Invalid token' });
  }
});

app.post('/api/check-exam-access', async (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) return res.status(401).json({ error: 'No token' });
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'elite_secret_key_2024');
    const user = await User.findById(decoded.userId);
    const { examId, sectionNumber } = req.body;
    if (user.isPremium) return res.json({ hasAccess: true });
    const hasPurchased = user.purchasedExams.some(p => p.examId === examId && p.sectionNumber === sectionNumber);
    res.json({ hasAccess: hasPurchased });
  } catch (error) {
    res.status(401).json({ error: 'Invalid token' });
  }
});

// ============ QUIZ ROUTES ============
app.get('/api/quizzes', async (req, res) => {
  try {
    const quizzes = await Quiz.find();
    res.json(quizzes);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/quizzes/:quizId', async (req, res) => {
  try {
    const quiz = await Quiz.findById(req.params.quizId);
    if (!quiz) return res.status(404).json({ error: 'Quiz not found' });
    res.json(quiz);
  } catch (error) {
    res.status(404).json({ error: 'Quiz not found' });
  }
});

app.post('/api/quizzes/:quizId/submit', async (req, res) => {
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
    res.json({ score, total, percentage, passed: percentage >= 70 });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// ============ PAYMENT ROUTES - FIXED FLUTTERWAVE INTEGRATION ============
app.post('/api/initialize-payment', async (req, res) => {
  try {
    const { email, amount, userId, planType, examId, examTitle, sectionNumber } = req.body;
    
    if (!userId) {
      console.error('❌ Payment initialization failed: userId is missing');
      return res.status(400).json({ error: 'User ID is required' });
    }
    
    // Generate unique reference
    const tx_ref = `ELITE-${Date.now()}-${userId}-${crypto.randomBytes(4).toString('hex')}`;
    
    console.log(`💰 INITIALIZING PAYMENT: ${tx_ref} for user ${userId}, amount: ${amount}`);
    
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    // Store transaction BEFORE payment
    user.transactions.push({
      reference: tx_ref,
      amount: amount,
      status: 'pending',
      planType: planType || 'premium',
      examId: examId || null,
      examTitle: examTitle || null,
      sectionNumber: sectionNumber || null,
      date: new Date()
    });
    await user.save();
    
    // Initialize payment with Flutterwave
    const response = await axios.post('https://api.flutterwave.com/v3/payments', {
      tx_ref: tx_ref,
      amount: amount,
      currency: "NGN",
      redirect_url: `https://elite-nursing-cbt.vercel.app/payment-return`,
      customer: { 
        email: email, 
        name: user.name || email 
      },
      customizations: { 
        title: "ELITE Nursing CBT", 
        description: planType === 'single' ? `Exam ${sectionNumber} Access` : "Complete Premium Package",
        logo: "https://elite-nursing-cbt.vercel.app/logo.png"
      }
    }, {
      headers: { 
        Authorization: `Bearer ${process.env.FLW_SECRET_KEY}`, 
        'Content-Type': 'application/json' 
      }
    });
    
    console.log(`✅ Payment initialized successfully, redirect URL: ${response.data.data.link}`);
    
    // Store the reference in a separate collection or return it
    res.json({ 
      authorization_url: response.data.data.link, 
      reference: tx_ref 
    });
    
  } catch (error) {
    console.error('❌ Payment initialization error:', error.response?.data || error.message);
    res.status(500).json({ error: 'Payment initialization failed: ' + (error.response?.data?.message || error.message) });
  }
});

// FIXED: Payment verification endpoint - Direct Flutterwave verification
app.post('/api/verify-payment', async (req, res) => {
  try {
    const { reference, userId } = req.body;
    
    console.log(`🔍 VERIFYING PAYMENT - Reference: ${reference}, UserId: ${userId}`);
    
    if (!reference || !userId) {
      console.log(`Missing reference or userId`);
      return res.status(400).json({ success: false, error: 'Missing reference or userId' });
    }
    
    const user = await User.findById(userId);
    if (!user) {
      console.log(`User not found: ${userId}`);
      return res.status(404).json({ success: false, error: 'User not found' });
    }
    
    // If user is already premium, return success immediately
    if (user.isPremium) {
      console.log(`✅ User ${user.email} is already premium`);
      return res.json({ success: true, isPremium: true, message: 'Already premium' });
    }
    
    // Find the transaction
    const transaction = user.transactions.find(t => t.reference === reference);
    if (!transaction) {
      console.log(`Transaction not found for reference: ${reference}`);
      return res.status(404).json({ success: false, error: 'Transaction not found' });
    }
    
    // Verify with Flutterwave
    console.log(`Calling Flutterwave API for verification...`);
    const response = await axios.get(`https://api.flutterwave.com/v3/transactions/${reference}/verify`, {
      headers: { Authorization: `Bearer ${process.env.FLW_SECRET_KEY}` }
    });
    
    const transactionData = response.data.data;
    console.log(`📊 FLUTTERWAVE RESPONSE - Status: ${transactionData?.status}, Amount: ${transactionData?.amount}`);
    
    if (transactionData?.status === 'successful') {
      // Update user to premium
      user.isPremium = true;
      user.purchaseDate = new Date();
      transaction.status = 'completed';
      await user.save();
      
      console.log(`✅✅✅ PREMIUM ACTIVATED for user: ${user.email} (Amount: ₦${transactionData?.amount}) ✅✅✅`);
      return res.json({ success: true, isPremium: true, message: 'Premium activated successfully' });
      
    } else if (transactionData?.status === 'pending') {
      console.log(`⏰ Payment still pending for reference: ${reference}`);
      return res.json({ success: false, pending: true, message: 'Payment is still processing. Please check back in a few minutes.' });
      
    } else {
      console.log(`❌ Payment verification failed - Status: ${transactionData?.status}`);
      return res.json({ success: false, error: `Payment not successful. Status: ${transactionData?.status}. Please try again.` });
    }
    
  } catch (error) {
    console.error('❌ Payment verification error:', error.response?.data || error.message);
    // Check if transaction exists in Flutterwave but we couldn't verify
    if (error.response?.data?.message?.includes('No transaction was found')) {
      return res.status(200).json({ success: false, pending: true, message: 'Transaction not found yet. Please wait a few moments and try again.' });
    }
    res.status(200).json({ success: false, error: 'Verification failed: ' + (error.response?.data?.message || error.message) });
  }
});

// Check payment status manually (for users to retry)
app.post('/api/check-payment-status', async (req, res) => {
  try {
    const { reference, userId } = req.body;
    
    const user = await User.findById(userId);
    if (!user) {
      return res.json({ success: false, error: 'User not found' });
    }
    
    const transaction = user.transactions.find(t => t.reference === reference);
    if (!transaction) {
      return res.json({ success: false, error: 'Transaction not found' });
    }
    
    if (transaction.status === 'completed' || user.isPremium) {
      return res.json({ success: true, isPremium: true });
    }
    
    // Verify with Flutterwave again
    const response = await axios.get(`https://api.flutterwave.com/v3/transactions/${reference}/verify`, {
      headers: { Authorization: `Bearer ${process.env.FLW_SECRET_KEY}` }
    });
    
    const transactionData = response.data.data;
    
    if (transactionData?.status === 'successful') {
      user.isPremium = true;
      transaction.status = 'completed';
      await user.save();
      return res.json({ success: true, isPremium: true });
    }
    
    return res.json({ success: false, status: transactionData?.status });
    
  } catch (error) {
    console.error('Check payment error:', error);
    res.json({ success: false, error: error.message });
  }
});

// Admin manual premium activation
app.post('/api/admin/activate-premium', isAdmin, async (req, res) => {
  try {
    const { email } = req.body;
    const user = await User.findOneAndUpdate({ email }, { isPremium: true, purchaseDate: new Date() }, { new: true });
    if (!user) return res.status(404).json({ error: 'User not found' });
    console.log(`✅ Admin manually activated premium for: ${email}`);
    res.json({ success: true, message: `Premium activated for ${email}` });
  } catch (error) {
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