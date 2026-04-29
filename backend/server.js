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

// MongoDB connection
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/quizzapp';
mongoose.connect(MONGODB_URI)
  .then(() => console.log('MongoDB connected successfully'))
  .catch(err => console.log('MongoDB connection error:', err));

// OTP Store
const otpStore = new Map();

// User Schema with name field
const UserSchema = new mongoose.Schema({
  name: { type: String, default: '' },
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

// Professional Email Template Function
const getEmailTemplate = (name, otp, type) => {
  const year = new Date().getFullYear();
  
  const emailContent = type === 'verification' 
    ? {
        title: 'Verify Your Email Address',
        message: `Thank you for choosing ELITE Nursing & Midwifery CBT. Please use the verification code below to complete your registration and start your journey toward nursing excellence.`,
        buttonText: 'Verify Email',
        note: 'This code will expire in 10 minutes for security purposes.'
      }
    : {
        title: 'Reset Your Password',
        message: `We received a request to reset your password for your ELITE Nursing & Midwifery CBT account. Use the verification code below to create a new password.`,
        buttonText: 'Reset Password',
        note: 'If you did not request a password reset, please ignore this email. Your password will remain unchanged.'
      };
  
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${emailContent.title} - ELITE Nursing CBT</title>
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      background-color: #f0f7f4;
      line-height: 1.5;
    }
    .container {
      max-width: 550px;
      margin: 0 auto;
      padding: 20px;
    }
    .email-card {
      background-color: #ffffff;
      border-radius: 20px;
      overflow: hidden;
      box-shadow: 0 10px 35px rgba(0, 0, 0, 0.1);
    }
    .header {
      background: linear-gradient(135deg, #1e3c72 0%, #2a5298 100%);
      padding: 30px 20px;
      text-align: center;
    }
    .header h1 {
      color: #ffffff;
      font-size: 22px;
      font-weight: bold;
      margin: 0;
      letter-spacing: 1px;
    }
    .header p {
      color: rgba(255, 255, 255, 0.9);
      font-size: 12px;
      margin: 8px 0 0;
    }
    .content {
      padding: 30px 25px;
    }
    .greeting {
      font-size: 18px;
      font-weight: 600;
      color: #1e3c72;
      margin-bottom: 15px;
    }
    .message {
      color: #4a5568;
      font-size: 15px;
      line-height: 1.6;
      margin-bottom: 25px;
    }
    .code-container {
      background: linear-gradient(135deg, #f0f7f4 0%, #e8f0ea 100%);
      border-radius: 16px;
      padding: 25px 20px;
      text-align: center;
      margin: 25px 0;
      border: 1px solid #d4e0d9;
    }
    .code-label {
      font-size: 13px;
      color: #5a6e5a;
      text-transform: uppercase;
      letter-spacing: 2px;
      margin-bottom: 10px;
    }
    .code {
      font-size: 42px;
      font-weight: 800;
      letter-spacing: 12px;
      color: #1e3c72;
      font-family: 'Courier New', monospace;
      background: white;
      display: inline-block;
      padding: 12px 20px;
      border-radius: 12px;
      box-shadow: 0 2px 8px rgba(0,0,0,0.05);
    }
    .expiry-note {
      font-size: 12px;
      color: #8b9a8b;
      margin-top: 12px;
    }
    .divider {
      height: 1px;
      background: linear-gradient(to right, transparent, #cbd5e0, transparent);
      margin: 25px 0;
    }
    .footer {
      background-color: #f8f9fa;
      padding: 20px 25px;
      text-align: center;
      border-top: 1px solid #e2e8f0;
    }
    .footer p {
      color: #94a3b8;
      font-size: 11px;
      margin: 5px 0;
    }
    .footer .copyright {
      margin-top: 10px;
      padding-top: 10px;
      border-top: 1px solid #e2e8f0;
    }
    @media (max-width: 480px) {
      .code {
        font-size: 28px;
        letter-spacing: 8px;
        padding: 10px 15px;
      }
      .content {
        padding: 20px;
      }
      .header h1 {
        font-size: 18px;
      }
    }
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
        <div class="message">
          ${emailContent.message}
        </div>
        <div class="code-container">
          <div class="code-label">Your Verification Code</div>
          <div class="code">${otp}</div>
          <div class="expiry-note">⏰ ${emailContent.note}</div>
        </div>
        <div class="message" style="font-size: 13px; margin-bottom: 0;">
          If you didn't request this, please ignore this email. Never share this code with anyone for security reasons.
        </div>
      </div>
      <div class="footer">
        <p>© ${year} ELITE Nursing & Midwifery CBT. All rights reserved.</p>
        <p>Empowering nursing and midwifery excellence through quality education.</p>
        <div class="copyright">
          <p>This is an automated message, please do not reply.</p>
        </div>
      </div>
    </div>
  </div>
</body>
</html>`;
};

// Send email function using Brevo with professional template
const sendEmail = async (to, name, otp, type) => {
  try {
    const htmlContent = getEmailTemplate(name, otp, type);
    const textContent = type === 'verification' 
      ? `Your ELITE Nursing & Midwifery CBT verification code is: ${otp}\n\nThis code expires in 10 minutes.\n\nIf you didn't request this, please ignore this email.`
      : `Your ELITE Nursing & Midwifery CBT password reset code is: ${otp}\n\nThis code expires in 10 minutes.\n\nIf you didn't request this, please ignore this email.`;
    
    const subject = type === 'verification' 
      ? 'Verify Your Email - ELITE Nursing & Midwifery CBT'
      : 'Reset Your Password - ELITE Nursing & Midwifery CBT';
    
    const sendSmtpEmail = new SibApiV3Sdk.SendSmtpEmail();
    sendSmtpEmail.to = [{ email: to }];
    sendSmtpEmail.sender = { email: 'anaduphilip2000@gmail.com', name: 'ELITE Nursing CBT' };
    sendSmtpEmail.subject = subject;
    sendSmtpEmail.textContent = textContent;
    sendSmtpEmail.htmlContent = htmlContent;
    
    const response = await apiInstance.sendTransacEmail(sendSmtpEmail);
    console.log('✅ Email sent successfully to:', to);
    return true;
  } catch (error) {
    console.error('❌ Email sending failed:', error.response?.body || error.message);
    return false;
  }
};

// ============ TEST ENVIRONMENT ENDPOINT ============
app.get('/api/test-env', (req, res) => {
  const uri = process.env.MONGODB_URI;
  const dbName = uri ? uri.split('/').pop()?.split('?')[0] : 'none';
  res.json({ 
    hasUri: !!uri, 
    uriStart: uri ? uri.substring(0, 30) + '...' : 'none',
    dbName: dbName,
    mongodbState: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected'
  });
});

// ============ EMAIL VERIFICATION ROUTES ============

// Send verification OTP
app.post('/api/send-verification', async (req, res) => {
  try {
    const { email, name } = req.body;
    
    const existingUser = await User.findOne({ email });
    if (existingUser && existingUser.isVerified) {
      return res.status(400).json({ error: 'Email already registered and verified' });
    }
    
    const otp = generateOTP();
    const expires = Date.now() + 10 * 60 * 1000;
    
    otpStore.set(`verify_${email}`, { otp, expires, name });
    
    await sendEmail(email, name || 'User', otp, 'verification');
    
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
    
    otpStore.set(`verified_${email}`, { verified: true, name: stored.name });
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
    
    otpStore.set(`reset_${email}`, { otp, expires, name: user.name || 'User' });
    
    await sendEmail(email, user.name || 'User', otp, 'password-reset');
    
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
      await existingUser.save();
      const token = jwt.sign({ userId: existingUser._id }, process.env.JWT_SECRET || 'elite_secret_key_2024');
      otpStore.delete(`verified_${email}`);
      return res.json({ success: true, token, user: { id: existingUser._id, name: existingUser.name, email: existingUser.email, isPremium: existingUser.isPremium } });
    }
    
    const user = new User({ 
      name: name || verifiedData.name, 
      email, 
      password: hashedPassword, 
      isVerified: true 
    });
    await user.save();
    
    otpStore.delete(`verified_${email}`);
    
    const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET || 'elite_secret_key_2024');
    res.json({ success: true, token, user: { id: user._id, name: user.name, email: user.email, isPremium: user.isPremium } });
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
    res.json({ token, user: { id: user._id, name: user.name, email: user.email, isPremium: user.isPremium } });
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
    
    otpStore.set(`verify_${email}`, { otp, expires, name: user?.name || 'User' });
    
    await sendEmail(email, user?.name || 'User', otp, 'verification');
    
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
      id: user._id,
      name: user.name,
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

// Check exam access
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