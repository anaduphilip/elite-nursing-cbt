// src/routes/admin-dashboard.js
const express = require('express');
const { User, Quiz, WeeklyQuizAttempt } = require('../models');
const { isAdmin } = require('../middleware');

const router = express.Router();

router.get('/', isAdmin, async (req, res) => {
  try {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const totalUsers = await User.countDocuments({ isVerified: true });
    const premiumUsers = await User.countDocuments({ isPremium: true, premiumExpiry: { $gt: now } });
    const newToday = await User.countDocuments({ createdAt: { $gte: today } });
    const newThisMonth = await User.countDocuments({ createdAt: { $gte: startOfMonth } });

    const transactions = await User.aggregate([
      { $unwind: '$transactions' },
      { $match: { 'transactions.status': 'completed' } },
      { $group: { _id: null, totalRevenue: { $sum: '$transactions.amount' }, totalTransactions: { $sum: 1 } } }
    ]);

    const quizCompletions = await User.aggregate([
      { $unwind: '$quizResults' },
      { $count: 'total' }
    ]);

    const weeklyAttempts = await WeeklyQuizAttempt.countDocuments();

    const popularCategories = await Quiz.aggregate([
      { $group: { _id: '$category', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 5 }
    ]);

    const recentUsers = await User.find().select('name email createdAt isPremium').sort({ createdAt: -1 }).limit(10);
    const recentTransactions = await User.aggregate([
      { $unwind: '$transactions' },
      { $match: { 'transactions.status': 'completed' } },
      { $sort: { 'transactions.date': -1 } },
      { $limit: 10 },
      { $project: { user: '$name', email: '$email', amount: '$transactions.amount', planType: '$transactions.planType', date: '$transactions.date' } }
    ]);

    res.json({
      success: true,
      dashboard: {
        users: { total: totalUsers, premium: premiumUsers, free: totalUsers - premiumUsers, newToday, newThisMonth },
        revenue: { total: transactions[0]?.totalRevenue || 0, totalTransactions: transactions[0]?.totalTransactions || 0 },
        quizzes: { completions: quizCompletions[0]?.total || 0, weeklyAttempts: weeklyAttempts || 0 },
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

module.exports = router;