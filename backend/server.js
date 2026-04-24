const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
require('dotenv').config();

const app = express();

// CORS configuration
app.use(cors({
  origin: [
    'https://elite-nursing-cbt.vercel.app',
    'http://localhost:5173',
    'https://elite-nursing-cbt.onrender.com'
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json());

// MongoDB connection
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/quizapp';
mongoose.connect(MONGODB_URI)
  .then(() => console.log('MongoDB connected successfully'))
  .catch(err => console.log('MongoDB connection error:', err));

// User Schema
const UserSchema = new mongoose.Schema({
  email: { type: String, unique: true, required: true },
  password: { type: String, required: true },
  isPremium: { type: Boolean, default: false },
  purchaseDate: Date,
  paymentRequests: [{
    amount: Number,
    reference: String,
    bank: String,
    accountNumber: String,
    status: { type: String, default: 'pending' },
    date: { type: Date, default: Date.now }
  }],
  quizResults: [{
    quizId: mongoose.Schema.Types.ObjectId,
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
  questions: [{
    questionText: String,
    options: [String],
    correctAnswer: Number,
    points: { type: Number, default: 1 }
  }],
  passingScore: { type: Number, default: 70 },
  isPremium: { type: Boolean, default: false },
  createdBy: mongoose.Schema.Types.ObjectId,
  createdAt: { type: Date, default: Date.now }
});

const User = mongoose.model('User', UserSchema);
const Quiz = mongoose.model('Quiz', QuizSchema);

// ============ AUTH ROUTES ============

// Register
app.post('/api/register', async (req, res) => {
  console.log('Register request received:', req.body);
  try {
    const { email, password } = req.body;
    
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ error: 'User already exists' });
    }
    
    const hashedPassword = await bcrypt.hash(password, 10);
    const user = new User({ email, password: hashedPassword });
    await user.save();
    
    const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET || 'elite_secret_key_2024');
    res.json({ 
      token, 
      user: { id: user._id, email: user.email, isPremium: user.isPremium } 
    });
  } catch (error) {
    console.error('Register error:', error);
    res.status(400).json({ error: error.message });
  }
});

// Login
app.post('/api/login', async (req, res) => {
  console.log('Login request received:', req.body);
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ error: 'User not found' });
    }
    const valid = await bcrypt.compare(password, user.password);
    if (!valid) {
      return res.status(400).json({ error: 'Invalid password' });
    }
    const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET || 'elite_secret_key_2024');
    res.json({ 
      token, 
      user: { id: user._id, email: user.email, isPremium: user.isPremium } 
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(400).json({ error: error.message });
  }
});

// Get user profile
app.get('/api/user/profile', async (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) return res.status(401).json({ error: 'No token' });
    
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'elite_secret_key_2024');
    const user = await User.findById(decoded.userId);
    
    res.json({
      isPremium: user.isPremium,
      email: user.email
    });
  } catch (error) {
    res.status(401).json({ error: 'Invalid token' });
  }
});

// ============ PAYMENT REQUEST ROUTES (Bank Transfer) ============

// Submit payment request
app.post('/api/payment-request', async (req, res) => {
  try {
    const { userId, email, amount, reference, bank, accountNumber, examTitle, sectionNumber } = req.body;
    
    console.log('========================================');
    console.log('🔔 NEW PREMIUM PAYMENT REQUEST 🔔');
    console.log('========================================');
    console.log('User ID:', userId);
    console.log('Email:', email);
    console.log('Amount:', amount);
    console.log('Reference:', reference);
    console.log('Bank:', bank);
    console.log('Account Number:', accountNumber);
    console.log('Exam:', examTitle, 'Section:', sectionNumber);
    console.log('========================================');
    
    // Save payment request to user's record
    await User.findByIdAndUpdate(userId, {
      $push: {
        paymentRequests: {
          amount: amount,
          reference: reference,
          bank: bank,
          accountNumber: accountNumber,
          status: 'pending',
          date: new Date()
        }
      }
    });
    
    res.json({ success: true, message: 'Payment request submitted successfully' });
  } catch (error) {
    console.error('Payment request error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get payment requests (for admin - you can add authentication later)
app.get('/api/payment-requests', async (req, res) => {
  try {
    const users = await User.find({ 'paymentRequests.0': { $exists: true } })
      .select('email paymentRequests');
    
    const allRequests = [];
    users.forEach(user => {
      user.paymentRequests.forEach(request => {
        allRequests.push({
          userId: user._id,
          email: user.email,
          ...request.toObject()
        });
      });
    });
    
    // Sort by date, newest first
    allRequests.sort((a, b) => b.date - a.date);
    
    res.json(allRequests);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Approve payment and upgrade user
app.post('/api/admin/approve-payment', async (req, res) => {
  try {
    const { userId, paymentRequestId } = req.body;
    
    // Update payment request status
    await User.updateOne(
      { _id: userId, 'paymentRequests._id': paymentRequestId },
      { $set: { 'paymentRequests.$.status': 'approved' } }
    );
    
    // Upgrade user to premium
    await User.findByIdAndUpdate(userId, { 
      isPremium: true,
      purchaseDate: new Date()
    });
    
    console.log(`✅ User ${userId} upgraded to premium!`);
    res.json({ success: true, message: 'User upgraded to premium' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ============ QUIZ ROUTES ============

// Get all quizzes
app.get('/api/quizzes', async (req, res) => {
  try {
    const quizzes = await Quiz.find();
    res.json(quizzes);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get single quiz
app.get('/api/quizzes/:quizId', async (req, res) => {
  try {
    const quiz = await Quiz.findById(req.params.quizId);
    if (!quiz) {
      return res.status(404).json({ error: 'Quiz not found' });
    }
    res.json(quiz);
  } catch (error) {
    console.error('Error fetching quiz:', error);
    res.status(404).json({ error: 'Quiz not found' });
  }
});

// Create quiz
app.post('/api/quizzes', async (req, res) => {
  console.log('Create quiz request received:', req.body.title);
  try {
    const quiz = new Quiz(req.body);
    await quiz.save();
    res.json(quiz);
  } catch (error) {
    console.error('Create quiz error:', error);
    res.status(400).json({ error: error.message });
  }
});

// Submit quiz answers
app.post('/api/quizzes/:quizId/submit', async (req, res) => {
  try {
    const quiz = await Quiz.findById(req.params.quizId);
    if (!quiz) {
      return res.status(404).json({ error: 'Quiz not found' });
    }
    
    const { answers } = req.body;
    let score = 0;
    let totalPoints = 0;
    
    quiz.questions.forEach((question, index) => {
      totalPoints += question.points || 1;
      if (answers[index] === question.correctAnswer) {
        score += question.points || 1;
      }
    });
    
    const percentage = (score / totalPoints) * 100;
    const passed = percentage >= (quiz.passingScore || 70);
    
    res.json({ score, total: totalPoints, percentage, passed });
  } catch (error) {
    console.error('Submit error:', error);
    res.status(400).json({ error: error.message });
  }
});

// ============ TEST ROUTE ============
app.get('/', (req, res) => {
  res.send('ELITE NURSING & MIDWIFERY CBT API is Running!');
});

// ============ START SERVER ============
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`http://localhost:${PORT}`);
});