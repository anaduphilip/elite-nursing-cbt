const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const axios = require('axios');
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
  transactions: [{
    reference: String,
    amount: Number,
    status: String,
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

// ============ FLUTTERWAVE PAYMENT ROUTES (DIRECT API) ============

// Initialize payment
app.post('/api/initialize-payment', async (req, res) => {
  try {
    const { email, amount, userId } = req.body;
    
    const tx_ref = `ELITE-${Date.now()}-${userId}`;
    
    const response = await axios.post('https://api.flutterwave.com/v3/payments', {
      tx_ref: tx_ref,
      amount: amount,
      currency: "NGN",
      redirect_url: "https://elite-nursing-cbt.vercel.app/payment-callback",
      customer: {
        email: email,
        name: email
      },
      customizations: {
        title: "ELITE Nursing CBT Premium",
        description: "Lifetime access to all premium exams"
      }
    }, {
      headers: {
        Authorization: `Bearer ${process.env.FLW_SECRET_KEY}`,
        'Content-Type': 'application/json'
      }
    });
    
    // Save transaction reference to user
    await User.findByIdAndUpdate(userId, {
      $push: {
        transactions: {
          reference: tx_ref,
          amount: amount,
          status: 'pending',
          date: new Date()
        }
      }
    });
    
    res.json({ 
      authorization_url: response.data.data.link,
      reference: tx_ref
    });
  } catch (error) {
    console.error('Payment init error:', error.response?.data || error.message);
    res.status(500).json({ error: 'Payment initialization failed: ' + (error.response?.data?.message || error.message) });
  }
});

// Verify payment
app.post('/api/verify-payment', async (req, res) => {
  try {
    const { reference, userId } = req.body;
    
    const response = await axios.get(`https://api.flutterwave.com/v3/transactions/${reference}/verify`, {
      headers: {
        Authorization: `Bearer ${process.env.FLW_SECRET_KEY}`
      }
    });
    
    if (response.data.data.status === 'successful') {
      // Update user to premium
      await User.findByIdAndUpdate(userId, {
        isPremium: true,
        purchaseDate: new Date(),
        $set: { 'transactions.$[elem].status': 'completed' }
      }, {
        arrayFilters: [{ 'elem.reference': reference }]
      });
      
      res.json({ success: true, message: 'Payment verified! You are now premium.' });
    } else {
      res.json({ success: false, message: 'Payment verification failed' });
    }
  } catch (error) {
    console.error('Verification error:', error.response?.data || error.message);
    res.status(500).json({ error: 'Verification failed' });
  }
});

// Webhook for Flutterwave (optional - for automatic updates)
app.post('/api/webhook', async (req, res) => {
  try {
    const { event, data } = req.body;
    
    if (event === 'charge.completed' && data.status === 'successful') {
      const tx_ref = data.tx_ref;
      // Extract userId from tx_ref (format: ELITE-timestamp-userId)
      const userId = tx_ref.split('-')[2];
      
      await User.findByIdAndUpdate(userId, {
        isPremium: true,
        purchaseDate: new Date()
      });
      
      console.log(`✅ User ${userId} upgraded to premium via webhook!`);
    }
    
    res.sendStatus(200);
  } catch (error) {
    console.error('Webhook error:', error);
    res.sendStatus(500);
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