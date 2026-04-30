// Force DNS resolution to use Google DNS
const dns = require('dns');
dns.setServers(['8.8.8.8', '8.8.4.4']);

const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const axios = require('axios');
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

// User Schema
const UserSchema = new mongoose.Schema({
  name: { type: String, default: '' },
  email: { type: String, unique: true, required: true },
  password: { type: String, required: true },
  isPremium: { type: Boolean, default: false },
  isVerified: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now },
  currentSessionToken: { type: String, default: null },
  lastLoginAt: { type: Date, default: null },
  flutterwaveRef: { type: String, default: null },
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

// Helper functions
const generateOTP = () => Math.floor(100000 + Math.random() * 900000).toString();
const generateSessionToken = () => Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);

// Email function
const sendEmail = async (to, name, otp, type) => {
  try {
    const subject = type === 'verification' ? 'Verify Your Email - ELITE Nursing CBT' : 'Reset Your Password - ELITE Nursing CBT';
    const textContent = type === 'verification' ? `Your verification code is: ${otp}` : `Your password reset code is: ${otp}`;
    const sendSmtpEmail = new SibApiV3Sdk.SendSmtpEmail();
    sendSmtpEmail.to = [{ email: to }];
    sendSmtpEmail.sender = { email: 'anaduphilip2000@gmail.com', name: 'ELITE Nursing CBT' };
    sendSmtpEmail.subject = subject;
    sendSmtpEmail.textContent = textContent;
    await apiInstance.sendTransacEmail(sendSmtpEmail);
    console.log('✅ Email sent to:', to);
    return true;
  } catch (error) {
    console.error('❌ Email failed:', error.response?.body || error.message);
    return false;
  }
};

// ============ ADMIN MIDDLEWARE ============
const isAdmin = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) return res.status(401).json({ error: 'Unauthorized' });
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'elite_secret_key_2024');
    const user = await User.findById(decoded.userId);
    if (user.email !== 'anaduphilip2000@gmail.com') return res.status(403).json({ error: 'Admin access only' });
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

app.post('/api/admin/reply-message', isAdmin, async (req, res) => {
  try {
    const { to, name, originalMessage, reply } = req.body;
    const sendSmtpEmail = new SibApiV3Sdk.SendSmtpEmail();
    sendSmtpEmail.to = [{ email: to }];
    sendSmtpEmail.sender = { email: 'anaduphilip2000@gmail.com', name: 'ELITE Nursing CBT Support' };
    sendSmtpEmail.subject = `Response to your message - ELITE Nursing CBT`;
    sendSmtpEmail.textContent = `Dear ${name},\n\nResponse: ${reply}\n\nOriginal: ${originalMessage}`;
    await apiInstance.sendTransacEmail(sendSmtpEmail);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Failed to send reply' });
  }
});

// ============ CONTACT ROUTE ============
app.post('/api/contact', async (req, res) => {
  try {
    const { name, email, message } = req.body;
    const contact = new Contact({ name, email, message });
    await contact.save();
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Failed to send message' });
  }
});

// ============ AUTH ROUTES ============
app.post('/api/send-verification', async (req, res) => {
  try {
    const { email, name } = req.body;
    const existingUser = await User.findOne({ email });
    if (existingUser && existingUser.isVerified) return res.status(400).json({ error: 'Email already registered' });
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

app.post('/api/force-logout', async (req, res) => {
  try {
    const { email } = req.body;
    await User.findOneAndUpdate({ email }, { currentSessionToken: null });
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Failed to force logout' });
  }
});

app.post('/api/register', async (req, res) => {
  try {
    const { name, email, password } = req.body;
    const verifiedData = otpStore.get(`verified_${email}`);
    if (!verifiedData || !verifiedData.verified) return res.status(400).json({ error: 'Please verify your email first' });
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
    const user = new User({ name: name || verifiedData.name, email, password: hashedPassword, isVerified: true, currentSessionToken: sessionToken, lastLoginAt: new Date() });
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
    if (user.currentSessionToken) return res.status(401).json({ error: 'You are already logged in on another device. Please log out from that device first.' });
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

app.get('/api/verify-session', async (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) return res.status(401).json({ error: 'No token' });
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'elite_secret_key_2024');
    const user = await User.findById(decoded.userId);
    if (!user) return res.status(401).json({ error: 'User not found' });
    if (user.currentSessionToken !== decoded.sessionToken) return res.status(401).json({ error: 'Session expired. You have been logged out from another device.' });
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
    res.json({ id: user._id, name: user.name, isPremium: user.isPremium, email: user.email });
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

// ============ PAYMENT ROUTES - BACKEND REDIRECT ============
app.post('/api/initialize-payment', async (req, res) => {
  try {
    const { email, amount, userId, planType, examId, examTitle, sectionNumber } = req.body;
    
    if (!userId) {
      console.error('❌ Payment initialization failed: userId is missing');
      return res.status(400).json({ error: 'User ID is required' });
    }
    
    const tx_ref = `ELITE-${Date.now()}-${userId}-${Math.random().toString(36).substring(2, 8)}`;
    
    console.log(`💰 INITIALIZING PAYMENT: ${tx_ref} for user ${userId}, amount: ${amount}`);
    
    // Redirect to BACKEND callback, not frontend
    const response = await axios.post('https://api.flutterwave.com/v3/payments', {
      tx_ref: tx_ref,
      amount: amount,
      currency: "NGN",
      redirect_url: `https://elite-nursing-cbt.onrender.com/api/payment-callback`,
      customer: { email: email, name: email },
      customizations: { 
        title: "ELITE Nursing CBT", 
        description: planType === 'single' ? `Exam ${sectionNumber} Access` : "Complete Package"
      }
    }, {
      headers: { 
        Authorization: `Bearer ${process.env.FLW_SECRET_KEY}`, 
        'Content-Type': 'application/json' 
      }
    });
    
    // Store transaction reference
    await User.findByIdAndUpdate(userId, {
      $push: { 
        transactions: { 
          reference: tx_ref, 
          amount: amount, 
          status: 'pending', 
          planType: planType, 
          examId: examId, 
          examTitle: examTitle, 
          sectionNumber: sectionNumber, 
          date: new Date() 
        } 
      }
    });
    
    console.log(`✅ Payment initialized successfully`);
    
    res.json({ authorization_url: response.data.data.link, reference: tx_ref });
  } catch (error) {
    console.error('❌ Payment initialization error:', error.response?.data || error.message);
    res.status(500).json({ error: 'Payment initialization failed' });
  }
});

// BACKEND CALLBACK - This is where Flutterwave redirects AFTER payment
app.get('/api/payment-callback', async (req, res) => {
  try {
    const { transaction_id, tx_ref, status } = req.query;
    
    console.log(`📞 PAYMENT CALLBACK RECEIVED:`);
    console.log(`   Transaction ID: ${transaction_id}`);
    console.log(`   Reference: ${tx_ref}`);
    console.log(`   Status: ${status}`);
    
    if (!tx_ref) {
      console.log('❌ No transaction reference found');
      return res.redirect('https://elite-nursing-cbt.vercel.app/get-premium?payment=failed');
    }
    
    // Find the user by the transaction reference
    const user = await User.findOne({ 'transactions.reference': tx_ref });
    if (!user) {
      console.log(`❌ User not found for reference: ${tx_ref}`);
      return res.redirect('https://elite-nursing-cbt.vercel.app/get-premium?payment=failed');
    }
    
    // Find the transaction
    const transaction = user.transactions.find(t => t.reference === tx_ref);
    
    if (status === 'successful') {
      // Verify with Flutterwave to confirm
      const verifyResponse = await axios.get(`https://api.flutterwave.com/v3/transactions/${transaction_id}/verify`, {
        headers: { Authorization: `Bearer ${process.env.FLW_SECRET_KEY}` }
      });
      
      if (verifyResponse.data.data?.status === 'successful') {
        // Update user to premium
        user.isPremium = true;
        user.purchaseDate = new Date();
        if (transaction) {
          transaction.status = 'completed';
        }
        await user.save();
        
        console.log(`✅✅✅ PREMIUM ACTIVATED for user: ${user.email} via backend callback ✅✅✅`);
        
        // Redirect to frontend with success
        return res.redirect('https://elite-nursing-cbt.vercel.app/get-premium?payment=success');
      } else {
        console.log(`❌ Verification failed for transaction: ${transaction_id}`);
        return res.redirect('https://elite-nursing-cbt.vercel.app/get-premium?payment=failed');
      }
    } else {
      console.log(`❌ Payment status: ${status}`);
      return res.redirect('https://elite-nursing-cbt.vercel.app/get-premium?payment=failed');
    }
  } catch (error) {
    console.error('❌ Callback error:', error);
    return res.redirect('https://elite-nursing-cbt.vercel.app/get-premium?payment=error');
  }
});

// Simple verify endpoint for frontend to check status
app.get('/api/payment-status', async (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) return res.status(401).json({ error: 'No token' });
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'elite_secret_key_2024');
    const user = await User.findById(decoded.userId);
    
    if (!user) return res.status(404).json({ error: 'User not found' });
    
    res.json({ isPremium: user.isPremium });
  } catch (error) {
    res.status(401).json({ error: 'Invalid token' });
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
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// ============ START SERVER ============
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📍 http://localhost:${PORT}`);
});