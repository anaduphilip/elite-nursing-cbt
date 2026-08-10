// src/utils/scheduled-notifications-cron.js
const cron = require('node-cron');
const { ScheduledNotification, User } = require('../models');
const admin = require('firebase-admin');

const processScheduledNotifications = async () => {
  console.log('⏰ Checking for scheduled notifications...');
  
  const now = new Date();
  const dueNotifications = await ScheduledNotification.find({
    scheduledFor: { $lte: now },
    status: 'pending'
  });

  for (const notification of dueNotifications) {
    try {
      // Build user query based on targetAudience
      let userQuery = { deviceTokens: { $exists: true, $ne: [] } };
      
      if (notification.targetAudience === 'premium') {
        userQuery.isPremium = true;
      } else if (notification.targetAudience === 'free') {
        userQuery.isPremium = false;
      } else if (notification.targetAudience === 'inactive') {
        // Users who haven't logged in for 7+ days
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
        userQuery.lastLoginAt = { $lt: sevenDaysAgo };
      }
      // 'all' – no additional filters

      const users = await User.find(userQuery);
      const tokens = users.flatMap(user => user.deviceTokens);

      if (tokens.length > 0) {
        const response = await admin.messaging().sendEachForMulticast({
          tokens: tokens,
          notification: {
            title: notification.title,
            body: notification.message
          }
        });
        console.log(`✅ Scheduled notification sent: ${notification.title}`);
        console.log(`   Success: ${response.successCount}, Failures: ${response.failureCount}`);
      } else {
        console.log(`⚠️ No device tokens for notification: ${notification.title}`);
      }

      notification.status = 'sent';
      notification.sentAt = new Date();
      await notification.save();

    } catch (error) {
      console.error(`❌ Failed to send scheduled notification: ${error.message}`);
    }
  }
};

// Run every minute
const startScheduledNotificationsCron = () => {
  cron.schedule('* * * * *', processScheduledNotifications);
  console.log('🕐 Scheduled notifications cron started (runs every minute)');
};

module.exports = {
  processScheduledNotifications,
  startScheduledNotificationsCron
};