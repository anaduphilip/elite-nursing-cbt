// backend/seedGamification.js
// Run with: node seedGamification.js

const mongoose = require('mongoose');
const dotenv = require('dotenv');
dotenv.config();

// Use your existing MongoDB URI (adjust if needed)
const MONGODB_URI = 'mongodb+srv://anaduphilip090_db_user:vpPyvn5OLz9QRrlc@cluster0.jrviuka.mongodb.net/quizzapp?retryWrites=true&w=majority';

mongoose.connect(MONGODB_URI)
  .then(() => console.log('✅ Connected to MongoDB'))
  .catch(err => { console.error('❌ Connection error:', err); process.exit(1); });

// ===== Schemas (must match your server) =====

// Badge Schema
const BadgeSchema = new mongoose.Schema({
  name: { type: String, required: true },
  icon: { type: String, default: '🏅' },
  description: { type: String, default: '' },
  requirementType: {
    type: String,
    enum: [
      'total_exams', 'category_exams', 'streak_days', 'perfect_score',
      'category_perfect', 'pass_rate', 'retake_improve', 'premium',
      'first_exam', 'unique_categories'
    ],
    required: true
  },
  targetCategory: { type: mongoose.Schema.Types.ObjectId, ref: 'Category', default: null },
  requirementValue: { type: Number, required: true },
  active: { type: Boolean, default: true },
  order: { type: Number, default: 0 },
  createdAt: { type: Date, default: Date.now }
});

const Badge = mongoose.model('Badge', BadgeSchema);

// Gamification Settings Schema
const SettingsSchema = new mongoose.Schema({
  enableStreaks: { type: Boolean, default: true },
  enableBadges: { type: Boolean, default: true },
  showBadgesOnHome: { type: Boolean, default: true },
  showStreakOnHome: { type: Boolean, default: true },
  streakResetHours: { type: Number, default: 24 },
  streakFreezeDays: { type: Number, default: 0 },
  updatedAt: { type: Date, default: Date.now }
});

const GamificationSettings = mongoose.model('GamificationSettings', SettingsSchema);

// ===== Default Badges (20 badges) =====

const defaultBadges = [
  // 🥉 Beginner Badges
  { name: 'First Exam', icon: '🎯', description: 'Complete your first exam', requirementType: 'first_exam', requirementValue: 1 },
  { name: 'Bronze Learner', icon: '🥉', description: 'Complete 10 exams', requirementType: 'total_exams', requirementValue: 10 },
  { name: 'Silver Scholar', icon: '🥈', description: 'Complete 50 exams', requirementType: 'total_exams', requirementValue: 50 },
  { name: 'Gold Master', icon: '🥇', description: 'Complete 100 exams', requirementType: 'total_exams', requirementValue: 100 },
  { name: 'Platinum Elite', icon: '💎', description: 'Complete 250 exams', requirementType: 'total_exams', requirementValue: 250 },

  // 📚 Category Badges (General Nursing)
  { name: 'Nursing Beginner', icon: '🩺', description: 'Complete 10 exams in General Nursing', requirementType: 'category_exams', targetCategory: null, requirementValue: 10 },
  { name: 'Nursing Expert', icon: '🩺', description: 'Complete 50 exams in General Nursing', requirementType: 'category_exams', targetCategory: null, requirementValue: 50 },

  // 📚 Category Badges (Midwifery)
  { name: 'Midwifery Beginner', icon: '🤰', description: 'Complete 10 exams in Midwifery', requirementType: 'category_exams', targetCategory: null, requirementValue: 10 },
  { name: 'Midwifery Expert', icon: '🤰', description: 'Complete 50 exams in Midwifery', requirementType: 'category_exams', targetCategory: null, requirementValue: 50 },

  // 📚 Category Badges (Public Health)
  { name: 'Public Health Beginner', icon: '🌍', description: 'Complete 10 exams in Public Health', requirementType: 'category_exams', targetCategory: null, requirementValue: 10 },
  { name: 'Public Health Expert', icon: '🌍', description: 'Complete 50 exams in Public Health', requirementType: 'category_exams', targetCategory: null, requirementValue: 50 },

  // 🎯 Performance Badges
  { name: 'Perfect Score', icon: '💯', description: 'Score 100% on any exam', requirementType: 'perfect_score', requirementValue: 1 },
  { name: 'Category Master', icon: '🏅', description: 'Score 100% in 3 different categories', requirementType: 'category_perfect', requirementValue: 3 },
  { name: 'High Achiever', icon: '📈', description: 'Maintain 80% pass rate over 20 exams', requirementType: 'pass_rate', requirementValue: 80 },
  { name: 'Comeback Kid', icon: '🔄', description: 'Improve your score by 10% on a retake', requirementType: 'retake_improve', requirementValue: 10 },

  // 🔥 Streak Badges
  { name: 'Streak 7', icon: '🔥', description: 'Study 7 days in a row', requirementType: 'streak_days', requirementValue: 7 },
  { name: 'Streak 30', icon: '🔥', description: 'Study 30 days in a row', requirementType: 'streak_days', requirementValue: 30 },
  { name: 'Streak 100', icon: '🔥', description: 'Study 100 days in a row', requirementType: 'streak_days', requirementValue: 100 },

  // ⭐ Premium & Special
  { name: 'Premium Member', icon: '⭐', description: 'Upgrade to Premium', requirementType: 'premium', requirementValue: 1 },
  { name: 'Category Explorer', icon: '🧭', description: 'Complete exams in 5 different categories', requirementType: 'unique_categories', requirementValue: 5 }
];

// ===== Seed function =====

async function seed() {
  try {
    console.log('🔄 Seeding gamification data...');

    // 1. Seed badges
    let created = 0, skipped = 0;
    for (const badgeData of defaultBadges) {
      const existing = await Badge.findOne({ name: badgeData.name });
      if (!existing) {
        await Badge.create(badgeData);
        console.log(`   ✅ Created: ${badgeData.name}`);
        created++;
      } else {
        console.log(`   ⏭️ Skipped (already exists): ${badgeData.name}`);
        skipped++;
      }
    }
    console.log(`✅ Badges: ${created} created, ${skipped} skipped.`);

    // 2. Seed gamification settings (if not exist)
    let settings = await GamificationSettings.findOne();
    if (!settings) {
      settings = new GamificationSettings({});
      await settings.save();
      console.log('✅ Created default gamification settings.');
    } else {
      console.log('⏭️ Gamification settings already exist.');
    }

    console.log('🎉 Seeding complete!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Seeding error:', error);
    process.exit(1);
  }
}

seed();