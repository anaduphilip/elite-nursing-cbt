// src/utils/gamification.js
const { Config, Badge, Quiz, User } = require('../models');

// Helper: Check and update user streak
const updateUserStreak = async (user) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const config = await Config.findOne();
  const resetHours = config?.gamification?.streakResetHours || 24;
  
  if (!user.lastActivityDate) {
    user.streak = 1;
    user.lastActivityDate = today;
    await user.save();
    return { streak: 1, isNew: true };
  }
  
  const lastActivity = new Date(user.lastActivityDate);
  lastActivity.setHours(0, 0, 0, 0);
  
  const diffDays = Math.floor((today - lastActivity) / (1000 * 60 * 60 * 24));
  
  if (diffDays === 0) {
    return { streak: user.streak, isNew: false };
  } else if (diffDays === 1) {
    user.streak = (user.streak || 0) + 1;
    user.lastActivityDate = today;
    await user.save();
    return { streak: user.streak, isNew: true };
  } else if (diffDays < resetHours / 24) {
    return { streak: user.streak, isNew: false };
  } else {
    user.streak = 1;
    user.lastActivityDate = today;
    await user.save();
    return { streak: 1, isNew: true };
  }
};

// Helper: Check if user qualifies for a badge
const checkBadgeEligibility = async (user, badge) => {
  const { requirementType, targetCategory, targetQuizId, requirementValue } = badge;
  
  switch (requirementType) {
    case 'total_exams': {
      const count = user.quizResults.length;
      return count >= requirementValue;
    }
    case 'category_exams': {
      if (!targetCategory) return false;
      let count = 0;
      for (const result of user.quizResults) {
        const quiz = await Quiz.findById(result.quizId);
        if (quiz && quiz.category === targetCategory) {
          count++;
        }
      }
      return count >= requirementValue;
    }
    case 'streak_days': {
      return (user.streak || 0) >= requirementValue;
    }
    case 'perfect_score': {
      for (const result of user.quizResults) {
        if (result.percentage === 100) {
          return true;
        }
      }
      return false;
    }
    case 'category_perfect': {
      if (!targetCategory) return false;
      const categoryResults = [];
      for (const result of user.quizResults) {
        const quiz = await Quiz.findById(result.quizId);
        if (quiz && quiz.category === targetCategory && result.percentage === 100) {
          categoryResults.push(result);
        }
      }
      return categoryResults.length >= requirementValue;
    }
    case 'pass_rate': {
      if (user.quizResults.length === 0) return false;
      let passed = 0;
      for (const result of user.quizResults) {
        if (result.percentage >= 70) passed++;
      }
      const rate = (passed / user.quizResults.length) * 100;
      return rate >= requirementValue;
    }
    case 'retake_improve': {
      const quizMap = {};
      for (const result of user.quizResults) {
        const id = result.quizId.toString();
        if (!quizMap[id]) quizMap[id] = [];
        quizMap[id].push(result.percentage);
      }
      for (const [id, scores] of Object.entries(quizMap)) {
        if (scores.length >= 2) {
          const first = scores[0];
          const last = scores[scores.length - 1];
          if (last > first) return true;
        }
      }
      return false;
    }
    case 'premium': {
      return user.isPremium === true;
    }
    case 'first_exam': {
      return user.quizResults.length >= 1;
    }
    case 'total_passed': {
      let passed = 0;
      for (const result of user.quizResults) {
        if (result.percentage >= 70) passed++;
      }
      return passed >= requirementValue;
    }
    case 'total_failed': {
      let failed = 0;
      for (const result of user.quizResults) {
        if (result.percentage < 70) failed++;
      }
      return failed >= requirementValue;
    }
    case 'specific_exam': {
      if (!targetQuizId) return false;
      for (const result of user.quizResults) {
        if (result.quizId.toString() === targetQuizId.toString()) {
          return true;
        }
      }
      return false;
    }
    default:
      return false;
  }
};

// Helper: Award badges to user
const awardBadges = async (user) => {
  const config = await Config.findOne();
  if (!config?.gamification?.enabled) {
    return { awarded: [] };
  }
  
  const activeBadges = await Badge.find({ active: true }).sort({ order: 1 });
  const awarded = [];
  
  for (const badge of activeBadges) {
    if (badge.requirementType === 'streak_days') {
      const eligible = await checkBadgeEligibility(user, badge);
      if (eligible) {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        const alreadyAwardedToday = user.badges.some(b => {
          const bDate = new Date(b.earnedAt);
          bDate.setHours(0, 0, 0, 0);
          return bDate.getTime() === today.getTime() && 
                 b.badgeId.toString() === badge._id.toString();
        });
        
        if (!alreadyAwardedToday) {
          user.badges.push({
            badgeId: badge._id,
            earnedAt: new Date()
          });
          awarded.push(badge);
          console.log(`🏆 Streak badge awarded: ${badge.name} (once per day)`);
        } else {
          console.log(`⏭️ Streak badge already awarded today: ${badge.name}`);
        }
      }
      continue;
    }
    
    const alreadyHas = user.awardedBadgeIds && user.awardedBadgeIds.some(
      id => id.toString() === badge._id.toString()
    );
    if (alreadyHas) continue;
    
    const eligible = await checkBadgeEligibility(user, badge);
    if (eligible) {
      user.badges.push({
        badgeId: badge._id,
        earnedAt: new Date()
      });
      user.awardedBadgeIds.push(badge._id);
      awarded.push(badge);
    }
  }
  
  if (awarded.length > 0) {
    await user.save();
  }
  
  return { awarded };
};

// Helper: Check and award badges after any exam activity
const checkAndAwardBadges = async (userId) => {
  try {
    const user = await User.findById(userId);
    if (!user) return { awarded: [] };
    await updateUserStreak(user);
    const result = await awardBadges(user);
    return result;
  } catch (error) {
    console.error('Badge check error:', error);
    return { awarded: [], error: error.message };
  }
};

module.exports = {
  updateUserStreak,
  checkBadgeEligibility,
  awardBadges,
  checkAndAwardBadges
};