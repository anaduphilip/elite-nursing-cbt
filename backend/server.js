const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const axios = require('axios');
require('dotenv').config();

const app = express();

app.use(cors({
  origin: [
    'https://elite-nursing-cbt.vercel.app',
    'http://localhost:5173',
    'https://elite-nursing-cbt.onrender.com'
  ],
  credentials: true
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

// ============ AUTH ROUTES ============

app.post('/api/register', async (req, res) => {
  try {
    const { email, password } = req.body;
    const existingUser = await User.findOne({ email });
    if (existingUser) return res.status(400).json({ error: 'User already exists' });
    const hashedPassword = await bcrypt.hash(password, 10);
    const user = new User({ email, password: hashedPassword });
    await user.save();
    const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET || 'elite_secret_key_2024');
    res.json({ token, user: { id: user._id, email: user.email, isPremium: user.isPremium } });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

app.post('/api/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ error: 'User not found' });
    const valid = await bcrypt.compare(password, user.password);
    if (!valid) return res.status(400).json({ error: 'Invalid password' });
    const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET || 'elite_secret_key_2024');
    res.json({ token, user: { id: user._id, email: user.email, isPremium: user.isPremium } });
  } catch (error) {
    res.status(400).json({ error: error.message });
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
      purchasedExams: user.purchasedExams 
    });
  } catch (error) {
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
    
    // Premium users have access to everything
    if (user.isPremium) {
      return res.json({ hasAccess: true });
    }
    
    // Check if user bought this specific exam
    const hasPurchased = user.purchasedExams.some(
      p => p.examId === examId && p.sectionNumber === sectionNumber
    );
    
    res.json({ hasAccess: hasPurchased });
  } catch (error) {
    res.status(401).json({ error: 'Invalid token' });
  }
});

// ============ QUIZ ROUTES ============

app.get('/api/quizzes', async (req, res) => {
  try {
    const { category } = req.query;
    const filter = category ? { category } : {};
    const quizzes = await Quiz.find(filter);
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

app.post('/api/quizzes', async (req, res) => {
  try {
    const quiz = new Quiz(req.body);
    await quiz.save();
    res.json(quiz);
  } catch (error) {
    res.status(400).json({ error: error.message });
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
        // Unlock single exam
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
        // Unlock everything
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

app.get('/', (req, res) => {
  res.send('ELITE NURSING & MIDWIFERY CBT API is Running!');
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});