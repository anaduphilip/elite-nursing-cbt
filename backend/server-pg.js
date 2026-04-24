const express = require('express');
const { Pool } = require('pg');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const axios = require('axios');
require('dotenv').config();

const app = express();

app.use(cors({
  origin: ['https://elite-nursing-cbt.vercel.app', 'http://localhost:5173'],
  credentials: true
}));
app.use(express.json());

const pool = new Pool({
  connectionString: process.env.POSTGRES_URL,
  ssl: { rejectUnauthorized: false }
});

async function initDatabase() {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        email VARCHAR(255) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        is_premium BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT NOW()
      )
    `);
    await pool.query(`
      CREATE TABLE IF NOT EXISTS quizzes (
        id SERIAL PRIMARY KEY,
        title VARCHAR(255) NOT NULL,
        description TEXT,
        questions JSONB NOT NULL,
        is_premium BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT NOW()
      )
    `);
    console.log('Database tables ready');
    
    // Insert sample quizzes
    const result = await pool.query('SELECT COUNT(*) FROM quizzes');
    if (parseInt(result.rows[0].count) === 0) {
      const sampleQuizzes = [
        { title: "Cardiovascular Nursing - Set 1", description: "Test your knowledge in Cardiovascular Nursing", is_premium: false, questions: [
          { questionText: "The pain of angina pectoris is produced primarily by?", options: ["Vasoconstriction", "Movement of thromboemboli", "Myocardial ischemia", "The presence of atheromas"], correctAnswer: 2, points: 1 },
          { questionText: "Exchange of gases and food nutrient take place in the?", options: ["Arteries", "Veins", "Arterioles", "Capillaries"], correctAnswer: 3, points: 1 }
        ] }
      ];
      for (const quiz of sampleQuizzes) {
        await pool.query('INSERT INTO quizzes (title, description, questions, is_premium) VALUES ($1, $2, $3, $4)',
          [quiz.title, quiz.description, JSON.stringify(quiz.questions), quiz.is_premium]);
      }
      console.log('Sample quizzes imported');
    }
  } catch (err) {
    console.error('Database init error:', err);
  }
}
initDatabase();

app.post('/api/register', async (req, res) => {
  try {
    const { email, password } = req.body;
    const existing = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
    if (existing.rows.length > 0) return res.status(400).json({ error: 'User exists' });
    const hashed = await bcrypt.hash(password, 10);
    const result = await pool.query('INSERT INTO users (email, password) VALUES ($1, $2) RETURNING id, email, is_premium', [email, hashed]);
    const token = jwt.sign({ userId: result.rows[0].id }, process.env.JWT_SECRET || 'secret');
    res.json({ token, user: result.rows[0] });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

app.post('/api/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const result = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
    if (result.rows.length === 0) return res.status(400).json({ error: 'User not found' });
    const valid = await bcrypt.compare(password, result.rows[0].password);
    if (!valid) return res.status(400).json({ error: 'Invalid password' });
    const token = jwt.sign({ userId: result.rows[0].id }, process.env.JWT_SECRET || 'secret');
    res.json({ token, user: { id: result.rows[0].id, email: result.rows[0].email, isPremium: result.rows[0].is_premium } });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

app.get('/api/user/profile', async (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) return res.status(401).json({ error: 'No token' });
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret');
    const result = await pool.query('SELECT id, email, is_premium FROM users WHERE id = $1', [decoded.userId]);
    res.json({ isPremium: result.rows[0].is_premium, email: result.rows[0].email });
  } catch (error) {
    res.status(401).json({ error: 'Invalid token' });
  }
});

app.get('/api/quizzes', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM quizzes ORDER BY id');
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/quizzes/:quizId', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM quizzes WHERE id = $1', [req.params.quizId]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Quiz not found' });
    res.json(result.rows[0]);
  } catch (error) {
    res.status(404).json({ error: 'Quiz not found' });
  }
});

app.post('/api/quizzes/:quizId/submit', async (req, res) => {
  try {
    const quizResult = await pool.query('SELECT * FROM quizzes WHERE id = $1', [req.params.quizId]);
    if (quizResult.rows.length === 0) return res.status(404).json({ error: 'Quiz not found' });
    const questions = quizResult.rows[0].questions;
    const { answers } = req.body;
    let score = 0, total = 0;
    questions.forEach((q, i) => {
      total += q.points || 1;
      if (answers[i] === q.correctAnswer) score += q.points || 1;
    });
    const percentage = (score / total) * 100;
    res.json({ score, total, percentage, passed: percentage >= 70 });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

app.post('/api/initialize-payment', async (req, res) => {
  try {
    const { email, amount } = req.body;
    const response = await axios.post('https://api.paystack.co/transaction/initialize',
      { email, amount: amount * 100, currency: 'NGN', callback_url: 'https://elite-nursing-cbt.vercel.app/' },
      { headers: { Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`, 'Content-Type': 'application/json' } }
    );
    res.json({ authorization_url: response.data.data.authorization_url, reference: response.data.data.reference });
  } catch (error) {
    res.status(500).json({ error: 'Payment initialization failed' });
  }
});

app.post('/api/verify-payment', async (req, res) => {
  try {
    const { reference, userId } = req.body;
    const response = await axios.get(`https://api.paystack.co/transaction/verify/${reference}`, {
      headers: { Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}` }
    });
    if (response.data.data.status === 'success') {
      await pool.query('UPDATE users SET is_premium = true WHERE id = $1', [userId]);
      res.json({ success: true });
    } else {
      res.json({ success: false });
    }
  } catch (error) {
    res.status(500).json({ error: 'Verification failed' });
  }
});

app.get('/', (req, res) => {
  res.send('ELITE NURSING & MIDWIFERY CBT API is Running!');
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));