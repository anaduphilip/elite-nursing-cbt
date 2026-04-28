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
  'http://localhost:5000'
];

app.use(cors({
  origin: function(origin, callback) {
    // Allow requests with no origin (like mobile apps or curl)
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

// Handle preflight requests
app.options('*', cors());

app.use(express.json());

// Configure Brevo
const defaultClient = SibApiV3Sdk.ApiClient.instance;
const apiKey = defaultClient.authentications['api-key'];
apiKey.apiKey = process.env.BREVO_API_KEY;

const apiInstance = new SibApiV3Sdk.TransactionalEmailsApi();

// MongoDB connection
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb+srv://anaduphilip090_db_user:vpPyvn5OLz9QRrlc@cluster0.jrviuka.mongodb.net/quizzapp';
mongoose.connect(MONGODB_URI)
  .then(() => console.log('MongoDB connected successfully'))
  .catch(err => console.log('MongoDB connection error:', err));

// OTP Store (in production, use Redis or a database)
const otpStore = new Map();

// User Schema with isVerified field
const UserSchema = new mongoose.Schema({
  email: { type: String, unique: true, required: true },
  password: { type: String, required: true },
  isPremium: { type: Boolean, default: false },
  isVerified: { type: Boolean, default: false },
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

const User = mongoose.model('User', UserSchema);
const Quiz = mongoose.model('Quiz', QuizSchema);

// Helper function to generate OTP
const generateOTP = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

// Send email function using Brevo
const sendEmail = async (to, subject, textMessage) => {
  try {
    const sendSmtpEmail = new SibApiV3Sdk.SendSmtpEmail();
    sendSmtpEmail.to = [{ email: to }];
    sendSmtpEmail.sender = { email: 'anaduphilip2000@gmail.com', name: 'ELITE Nursing CBT' };
    sendSmtpEmail.subject = subject;
    sendSmtpEmail.textContent = textMessage;
    sendSmtpEmail.htmlContent = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 10px;">
        <div style="text-align: center;">
          <h1 style="color: #1e3c72;">ELITE Nursing & Midwifery CBT</h1>
        </div>
        <div style="padding: 20px;">
          <p>Hello,</p>
          <p>${textMessage}</p>
          <p style="margin-top: 20px;">Best regards,<br/>ELITE Nursing CBT Team</p>
        </div>
        <div style="text-align: center; padding-top: 20px; font-size: 12px; color: #999;">
          <p>© 2024 ELITE Nursing & Midwifery CBT. All rights reserved.</p>
        </div>
      </div>
    `;
    
    const response = await apiInstance.sendTransacEmail(sendSmtpEmail);
    console.log('✅ Email sent successfully');
    return true;
  } catch (error) {
    console.error('❌ Email sending failed:', error.response?.body || error.message);
    return false;
  }
};

// ============ EMAIL VERIFICATION ROUTES ============

// Send verification OTP
app.post('/api/send-verification', async (req, res) => {
  try {
    const { email } = req.body;
    
    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser && existingUser.isVerified) {
      return res.status(400).json({ error: 'Email already registered and verified' });
    }
    
    const otp = generateOTP();
    const expires = Date.now() + 10 * 60 * 1000; // 10 minutes expiry
    
    otpStore.set(`verify_${email}`, { otp, expires });
    
    // Send email
    const message = `Your ELITE Nursing & Midwifery CBT verification code is: ${otp}\n\nThis code expires in 10 minutes.\n\nIf you didn't request this, please ignore this email.`;
    await sendEmail(email, 'Verify Your Email - ELITE Nursing CBT', message);
    
    console.log(`Verification OTP for ${email}: ${otp}`);
    
    res.json({ success: true, message: 'Verification code sent to your email' });
  } catch (error) {
    console.error('Send verification error:', error);
    res.status(500).json({ error: 'Failed to send verification code' });
  }
});

// Verify email OTP
app.post('/api/verify-email', async (req, res) => {
  try {
    const { email, otp } = req.body;
    const stored = otpStore.get(`verify_${email}`);
    
    if (!stored) {
      return res.status(400).json({ error: 'No verification code found. Please request a new one.' });
    }
    
    if (Date.now() > stored.expires) {
      otpStore.delete(`verify_${email}`);
      return res.status(400).json({ error: 'Verification code has expired. Please request a new one.' });
    }
    
    if (stored.otp !== otp) {
      return res.status(400).json({ error: 'Invalid verification code' });
    }
    
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      await User.findOneAndUpdate({ email }, { isVerified: true });
    }
    
    otpStore.delete(`verify_${email}`);
    
    res.json({ success: true, message: 'Email verified successfully! You can now complete registration.' });
  } catch (error) {
    console.error('Verify email error:', error);
    res.status(500).json({ error: 'Verification failed' });
  }
});

// ============ FORGOT PASSWORD ROUTES ============

// Send password reset OTP
app.post('/api/forgot-password', async (req, res) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email });
    
    if (!user) {
      return res.status(404).json({ error: 'No account found with this email' });
    }
    
    const otp = generateOTP();
    const expires = Date.now() + 10 * 60 * 1000;
    
    otpStore.set(`reset_${email}`, { otp, expires });
    
    const message = `Your ELITE Nursing & Midwifery CBT password reset code is: ${otp}\n\nThis code expires in 10 minutes.\n\nIf you didn't request this, please ignore this email.`;
    await sendEmail(email, 'Reset Your Password - ELITE Nursing CBT', message);
    
    console.log(`Password reset OTP for ${email}: ${otp}`);
    
    res.json({ success: true, message: 'Password reset code sent to your email' });
  } catch (error) {
    console.error('Forgot password error:', error);
    res.status(500).json({ error: 'Failed to send reset code' });
  }
});

// Reset password with OTP
app.post('/api/reset-password', async (req, res) => {
  try {
    const { email, otp, newPassword } = req.body;
    const stored = otpStore.get(`reset_${email}`);
    
    if (!stored) {
      return res.status(400).json({ error: 'No reset code found. Please request a new one.' });
    }
    
    if (Date.now() > stored.expires) {
      otpStore.delete(`reset_${email}`);
      return res.status(400).json({ error: 'Reset code has expired. Please request a new one.' });
    }
    
    if (stored.otp !== otp) {
      return res.status(400).json({ error: 'Invalid reset code' });
    }
    
    if (newPassword.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters' });
    }
    
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await User.findOneAndUpdate({ email }, { password: hashedPassword });
    
    otpStore.delete(`reset_${email}`);
    
    res.json({ success: true, message: 'Password reset successfully! You can now login.' });
  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json({ error: 'Failed to reset password' });
  }
});

// ============ AUTH ROUTES ============

// Register
app.post('/api/register', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    const existingUser = await User.findOne({ email });
    if (existingUser && existingUser.isVerified) {
      return res.status(400).json({ error: 'User already exists and is verified' });
    }
    
    const hashedPassword = await bcrypt.hash(password, 10);
    
    if (existingUser && !existingUser.isVerified) {
      existingUser.password = hashedPassword;
      existingUser.isVerified = true;
      await existingUser.save();
      const token = jwt.sign({ userId: existingUser._id }, process.env.JWT_SECRET || 'elite_secret_key_2024');
      return res.json({ success: true, token, user: { id: existingUser._id, email: existingUser.email, isPremium: existingUser.isPremium } });
    }
    
    const user = new User({ email, password: hashedPassword, isVerified: true });
    await user.save();
    
    const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET || 'elite_secret_key_2024');
    res.json({ success: true, token, user: { id: user._id, email: user.email, isPremium: user.isPremium } });
  } catch (error) {
    console.error('Register error:', error);
    res.status(400).json({ error: error.message });
  }
});

// Login
app.post('/api/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    
    if (!user) {
      return res.status(400).json({ error: 'User not found' });
    }
    
    if (!user.isVerified) {
      return res.status(400).json({ error: 'Email not verified. Please verify your email first.' });
    }
    
    const valid = await bcrypt.compare(password, user.password);
    if (!valid) {
      return res.status(400).json({ error: 'Invalid password' });
    }
    
    const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET || 'elite_secret_key_2024');
    res.json({ token, user: { id: user._id, email: user.email, isPremium: user.isPremium } });
  } catch (error) {
    console.error('Login error:', error);
    res.status(400).json({ error: error.message });
  }
});

// Resend verification code
app.post('/api/resend-verification', async (req, res) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email });
    
    if (user && user.isVerified) {
      return res.status(400).json({ error: 'Email already verified' });
    }
    
    const otp = generateOTP();
    const expires = Date.now() + 10 * 60 * 1000;
    
    otpStore.set(`verify_${email}`, { otp, expires });
    
    const message = `Your ELITE Nursing & Midwifery CBT verification code is: ${otp}\n\nThis code expires in 10 minutes.`;
    await sendEmail(email, 'Verify Your Email - ELITE Nursing CBT', message);
    
    console.log(`Resent verification OTP for ${email}: ${otp}`);
    
    res.json({ success: true, message: 'Verification code resent to your email' });
  } catch (error) {
    console.error('Resend verification error:', error);
    res.status(500).json({ error: 'Failed to resend verification code' });
  }
});

app.get('/api/user/profile', async (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) return res.status(401).json({ error: 'No token' });
    
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'elite_secret_key_2024');
    const user = await User.findById(decoded.userId);
    
    res.json({ 
      isPremium: user.isPremium, 
      email: user.email,
      isVerified: user.isVerified,
      purchasedExams: user.purchasedExams 
    });
  } catch (error) {
    console.error('Profile error:', error);
    res.status(401).json({ error: 'Invalid token' });
  }
});

// Check if user can access an exam
app.post('/api/check-exam-access', async (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) return res.status(401).json({ error: 'No token' });
    
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'elite_secret_key_2024');
    const user = await User.findById(decoded.userId);
    const { examId, sectionNumber } = req.body;
    
    if (user.isPremium) {
      return res.json({ hasAccess: true });
    }
    
    const hasPurchased = user.purchasedExams.some(
      p => p.examId === examId && p.sectionNumber === sectionNumber
    );
    
    res.json({ hasAccess: hasPurchased });
  } catch (error) {
    console.error('Check exam access error:', error);
    res.status(401).json({ error: 'Invalid token' });
  }
});

// ============ QUIZ ROUTES ============

app.get('/api/quizzes', async (req, res) => {
  try {
    const quizzes = await Quiz.find();
    res.json(quizzes);
  } catch (error) {
    console.error('Get quizzes error:', error);
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/quizzes/:quizId', async (req, res) => {
  try {
    const quiz = await Quiz.findById(req.params.quizId);
    if (!quiz) return res.status(404).json({ error: 'Quiz not found' });
    res.json(quiz);
  } catch (error) {
    console.error('Get quiz error:', error);
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
    console.error('Submit quiz error:', error);
    res.status(400).json({ error: error.message });
  }
});

// ============ PAYMENT ROUTES ============

app.post('/api/initialize-payment', async (req, res) => {
  try {
    const { email, amount, userId, planType, examId, examTitle, sectionNumber } = req.body;
    const tx_ref = `ELITE-${Date.now()}-${userId}`;

    const response = await axios.post('https://api.flutterwave.com/v3/payments', {
      tx_ref: tx_ref,
      amount: amount,
      currency: "NGN",
      redirect_url: "https://elite-nursing-cbt.vercel.app/payment-callback",
      customer: { email: email, name: email },
      customizations: { title: "ELITE Nursing CBT", description: planType === 'single' ? `Exam ${sectionNumber} Access` : "Complete Package" }
    }, {
      headers: {
        Authorization: `Bearer ${process.env.FLW_SECRET_KEY}`,
        'Content-Type': 'application/json'
      }
    });

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

    res.json({ authorization_url: response.data.data.link, reference: tx_ref });
  } catch (error) {
    console.error('Payment error:', error.response?.data || error.message);
    res.status(500).json({ error: 'Payment initialization failed' });
  }
});

app.post('/api/verify-payment', async (req, res) => {
  try {
    const { reference, userId } = req.body;
    
    const response = await axios.get(`https://api.flutterwave.com/v3/transactions/${reference}/verify`, {
      headers: { Authorization: `Bearer ${process.env.FLW_SECRET_KEY}` }
    });

    if (response.data.data.status === 'successful') {
      const user = await User.findById(userId);
      const transaction = user.transactions.find(t => t.reference === reference);
      
      if (transaction && transaction.planType === 'single') {
        await User.findByIdAndUpdate(userId, {
          $push: {
            purchasedExams: {
              examId: transaction.examId,
              examTitle: transaction.examTitle,
              sectionNumber: transaction.sectionNumber,
              purchaseDate: new Date()
            }
          },
          $set: { 'transactions.$[elem].status': 'completed' }
        }, {
          arrayFilters: [{ 'elem.reference': reference }]
        });
      } else {
        await User.findByIdAndUpdate(userId, {
          isPremium: true,
          purchaseDate: new Date(),
          $set: { 'transactions.$[elem].status': 'completed' }
        }, {
          arrayFilters: [{ 'elem.reference': reference }]
        });
      }
      
      res.json({ success: true });
    } else {
      res.json({ success: false });
    }
  } catch (error) {
    console.error('Verification error:', error);
    res.status(500).json({ error: 'Verification failed' });
  }
});

// ============ HEALTH CHECK ============

app.get('/', (req, res) => {
  res.send('ELITE NURSING & MIDWIFERY CBT API is Running!');
});

app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    mongodb: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected'
  });
});

// ============ START SERVER ============

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📍 http://localhost:${PORT}`);
  console.log(`📚 MongoDB: ${mongoose.connection.readyState === 1 ? 'Connected' : 'Disconnected'}`);
});