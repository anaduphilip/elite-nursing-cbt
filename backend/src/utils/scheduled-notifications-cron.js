// src/utils/scheduled-notifications-cron.js
const cron = require('node-cron');
const { ScheduledNotification, User } = require('../models');
const admin = require('firebase-admin');

const processScheduledNotifications = async () => {
  console.log('⏰ Checking for scheduled notifications...');
  
  const now = new Date();
  const oneMinuteAgo = new Date(now - 60000);

  const dueNotifications = await ScheduledNotification.find({
    scheduledFor: { $lte: now },
    status: 'pending',
    $or: [
      { lastSentAt: null },
      { lastSentAt: { $lt: oneMinuteAgo } }
    ]
  });

  for (const notification of dueNotifications) {
    try {
      // Build user query
      let userQuery = { deviceTokens: { $exists: true, $ne: [] } };
      if (notification.targetAudience === 'premium') {
        userQuery.isPremium = true;
      } else if (notification.targetAudience === 'free') {
        userQuery.isPremium = false;
      } else if (notification.targetAudience === 'inactive') {
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
        userQuery.lastLoginAt = { $lt: sevenDaysAgo };
      }

      const users = await User.find(userQuery);
      const tokens = users.flatMap(user => user.deviceTokens);

      let successCount = 0;
      let failureCount = 0;

      if (tokens.length > 0) {
        const response = await admin.messaging().sendEachForMulticast({
          tokens: tokens,
          notification: {
            title: notification.title,
            body: notification.message
          }
        });
        successCount = response.successCount || 0;
        failureCount = response.failureCount || 0;

        console.log(`✅ Scheduled notification sent: ${notification.title}`);
        console.log(`   Success: ${successCount}, Failures: ${failureCount}`);
      } else {
        console.log(`⚠️ No device tokens for notification: ${notification.title}`);
        failureCount = 0;
        successCount = 0;
      }

      // Handle daily repeat
      if (notification.repeatType === 'daily') {
        const nextDate = new Date(notification.scheduledFor);
        nextDate.setDate(nextDate.getDate() + 1);
        
        notification.scheduledFor = nextDate;
        notification.status = 'pending';
        notification.sentAt = null;
        notification.lastSentAt = new Date();
        notification.sentCount = (notification.sentCount || 0) + 1;
        notification.successCount = successCount;
        notification.failureCount = failureCount;
        
        await notification.save();
        console.log(`🔄 Daily notification rescheduled to ${nextDate.toISOString()}`);
        console.log(`   Total sends: ${notification.sentCount}`);
      } else {
        // Once-off notification
        notification.status = 'sent';
        notification.sentAt = new Date();
        notification.lastSentAt = new Date();
        notification.successCount = successCount;
        notification.failureCount = failureCount;
        await notification.save();
      }

    } catch (error) {
      console.error(`❌ Failed to send scheduled notification: ${error.message}`);
    }
  }
};

// Run every minute
const startScheduledNotificationsCron = () => {
  cron.schedule('0 * * * *', processScheduledNotifications);
  console.log('🕐 Scheduled notifications cron started (runs every hour)');
};

module.exports = {
  processScheduledNotifications,
  startScheduledNotificationsCron
};