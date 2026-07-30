// src/utils/cron.js
const cron = require('node-cron');
const { User } = require('../models');
const { sendReminderEmail } = require('./email');

const startPremiumReminderCron = () => {
  cron.schedule('0 * * * *', async () => {
    console.log('⏰ Checking premium reminders...');
    const now = new Date();
    const users = await User.find({ isPremium: true, premiumExpiry: { $gt: now } });

    for (const user of users) {
      const diffMs = user.premiumExpiry - now;
      const diffHours = diffMs / (1000 * 60 * 60);
      const diffDays = diffHours / 24;
      const plan = user.premiumPlan || 'monthly';
      let shouldNotify = false;
      let daysLeft = null, hoursLeft = null;

      if (plan === 'daily' && diffHours <= 2) {
        shouldNotify = true;
        hoursLeft = Math.ceil(diffHours);
      } else if (plan === 'monthly') {
        if (diffDays <= 3 && diffDays > 2.9) { shouldNotify = true; daysLeft = 3; }
        else if (diffHours <= 24 && diffHours > 23) { shouldNotify = true; hoursLeft = 24; }
      } else if (plan === 'yearly') {
        if (diffDays <= 180 && diffDays > 179.9) { shouldNotify = true; daysLeft = 180; }
        else if (diffDays <= 30 && diffDays > 29.9) { shouldNotify = true; daysLeft = 30; }
        else if (diffDays <= 3 && diffDays > 2.9) { shouldNotify = true; daysLeft = 3; }
        else if (diffHours <= 24 && diffHours > 23) { shouldNotify = true; hoursLeft = 24; }
      }

      if (shouldNotify) {
        const lastReminder = user.lastReminderSent || null;
        const thresholdKey = `${plan}-${daysLeft || hoursLeft}`;
        if (lastReminder !== thresholdKey) {
          await sendReminderEmail(user.email, user.name, plan, daysLeft, hoursLeft);
          user.lastReminderSent = thresholdKey;
          await user.save();
        }
      }
    }

    const expiredUsers = await User.find({
      isPremium: true,
      premiumExpiry: { $lt: now },
      notifiedExpired: { $ne: true }
    });
    for (const user of expiredUsers) {
      await sendReminderEmail(user.email, user.name, user.premiumPlan || 'premium', null, null);
      user.notifiedExpired = true;
      await user.save();
    }
  });
};

module.exports = {
  startPremiumReminderCron
};