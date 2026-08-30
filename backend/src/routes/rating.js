// src/routes/rating.js
const express = require('express');
const { Rating, FeedbackReply, FeedbackReaction, Config, User } = require('../models');
const { authenticate } = require('../middleware');

const router = express.Router();

// ===== USER ROUTES =====

// POST /api/ratings – Submit a rating
router.post('/', authenticate, async (req, res) => {
  try {
    const { stars, feedback, name } = req.body;
    
    if (!stars || stars < 1 || stars > 5) {
      return res.status(400).json({ error: 'Please provide a valid star rating (1-5).' });
    }

    // Check if user already rated (prevent duplicates)
    const existing = await Rating.findOne({
      userId: req.user._id,
      isDeleted: false
    });

    if (existing) {
      // Update existing rating instead of creating duplicate
      existing.stars = stars;
      existing.feedback = feedback || existing.feedback;
      existing.name = name || existing.name;
      existing.updatedAt = new Date();
      await existing.save();

      return res.json({
        success: true,
        message: 'Rating updated successfully.',
        rating: existing
      });
    }

    const rating = new Rating({
      userId: req.user._id,
      stars,
      feedback: feedback || '',
      name: name || req.user.name || 'Anonymous User',
      isFake: false,
      isDeleted: false,
      createdAt: new Date(),
      updatedAt: new Date()
    });

    await rating.save();

    res.json({
      success: true,
      message: 'Rating submitted successfully! Thank you for your feedback.',
      rating
    });
  } catch (error) {
    console.error('Rating submission error:', error);
    res.status(500).json({ error: 'Failed to submit rating.' });
  }
});

// GET /api/ratings/check – Check if user should see rating prompt
router.get('/check', authenticate, async (req, res) => {
  try {
    const config = await Config.findOne();
    const settings = config?.ratingSettings || {
      showRatingModal: true,
      modalFrequency: 'afterExam',
      minExamsBeforePrompt: 3
    };

    // Check if user already rated
    const hasRated = await Rating.findOne({
      userId: req.user._id,
      isDeleted: false
    });

    // Count user's exam completions
    const examCount = req.user.quizResults?.length || 0;

    let shouldShow = false;

    if (settings.showRatingModal !== false) {
      if (settings.modalFrequency === 'always') {
        shouldShow = true;
      } else if (settings.modalFrequency === 'once') {
        shouldShow = !hasRated;
      } else if (settings.modalFrequency === 'afterExam') {
        const minExams = settings.minExamsBeforePrompt || 3;
        shouldShow = !hasRated && examCount >= minExams;
      } else if (settings.modalFrequency === 'weekly') {
        // Simple weekly check – if user hasn't rated and it's been more than 7 days
        // For simplicity, we'll just check if they haven't rated
        shouldShow = !hasRated;
      }
    }

    res.json({
      shouldShow,
      hasRated: !!hasRated,
      examCount,
      settings,
      message: shouldShow ? 'We value your feedback!' : 'Thank you for being part of our community!'
    });
  } catch (error) {
    console.error('Rating check error:', error);
    res.status(500).json({ error: 'Failed to check rating status.' });
  }
});

// GET /api/ratings/latest – Get latest 5 feedbacks (real + fake)
router.get('/latest', async (req, res) => {
  try {
    // Get only ratings with feedback text (non-empty)
    const ratings = await Rating.find({
      isDeleted: false,
      feedback: { $ne: '' }
    })
    .sort({ createdAt: -1 })
    .limit(5)
    .select('stars feedback name createdAt isFake userId');

    // Get replies for each rating
    const ratingsWithReplies = await Promise.all(
      ratings.map(async (rating) => {
        const replies = await FeedbackReply.find({
          feedbackId: rating._id,
          isDeleted: false
        })
        .sort({ createdAt: 1 })
        .populate('adminId', 'name email')
        .lean();

        // Get reactions for this feedback
        const reactions = await FeedbackReaction.find({
          feedbackId: rating._id,
          replyId: null // reactions on the feedback itself
        })
        .populate('userId', 'name')
        .lean();

        // Get reactions for each reply
        const repliesWithReactions = await Promise.all(
          replies.map(async (reply) => {
            const replyReactions = await FeedbackReaction.find({
              feedbackId: rating._id,
              replyId: reply._id
            })
            .populate('userId', 'name')
            .lean();

            return {
              ...reply,
              reactions: replyReactions
            };
          })
        );

        return {
          ...rating.toObject(),
          replies: repliesWithReactions,
          reactions: reactions
        };
      })
    );

    res.json({
      success: true,
      count: ratingsWithReplies.length,
      ratings: ratingsWithReplies
    });
  } catch (error) {
    console.error('Fetch latest feedback error:', error);
    res.status(500).json({ error: 'Failed to fetch feedback.' });
  }
});

// GET /api/ratings/stats – Get aggregated stats
router.get('/stats', async (req, res) => {
  try {
    const config = await Config.findOne();
    const fakeCounts = config?.ratingSettings?.fakeRatingsDistribution || { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    const totalFake = Object.values(fakeCounts).reduce((a, b) => a + b, 0);

    // Get real ratings stats
    const realRatings = await Rating.find({ isDeleted: false, isFake: false });
    const totalReal = realRatings.length;

    // Calculate real distribution
    const realDistribution = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    let realSum = 0;
    realRatings.forEach(r => {
      realDistribution[r.stars]++;
      realSum += r.stars;
    });

    // Combine real + fake
    const totalDistribution = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    let totalSum = 0;
    let totalCount = 0;

    for (let i = 1; i <= 5; i++) {
      totalDistribution[i] = (realDistribution[i] || 0) + (fakeCounts[i] || 0);
      totalCount += totalDistribution[i];
      totalSum += totalDistribution[i] * i;
    }

    const average = totalCount > 0 ? (totalSum / totalCount) : 0;

    res.json({
      success: true,
      stats: {
        total: totalCount,
        average: Math.round(average * 10) / 10,
        distribution: totalDistribution,
        realCount: totalReal,
        fakeCount: totalFake
      }
    });
  } catch (error) {
    console.error('Rating stats error:', error);
    res.status(500).json({ error: 'Failed to fetch rating stats.' });
  }
});

// POST /api/ratings/:id/reactions – Add/change reaction to feedback
router.post('/:id/reactions', authenticate, async (req, res) => {
  try {
    const { id } = req.params;
    const { emoji, replyId } = req.body;

    // Validate emoji
    const validEmojis = ['👍', '❤️', '👏', '😊', '🔥', '💯', '🌟', '🙌'];
    if (!validEmojis.includes(emoji)) {
      return res.status(400).json({ error: 'Invalid emoji.' });
    }

    // Check if feedback exists
    const rating = await Rating.findById(id);
    if (!rating || rating.isDeleted) {
      return res.status(404).json({ error: 'Feedback not found.' });
    }

    // If replyId is provided, check if reply exists
    if (replyId) {
      const reply = await FeedbackReply.findOne({
        _id: replyId,
        feedbackId: id,
        isDeleted: false
      });
      if (!reply) {
        return res.status(404).json({ error: 'Reply not found.' });
      }
    }

    // Find existing reaction by this user on this feedback/reply
    const existingReaction = await FeedbackReaction.findOne({
      feedbackId: id,
      replyId: replyId || null,
      userId: req.user._id
    });

    if (existingReaction) {
      if (existingReaction.emoji === emoji) {
        // Same emoji – remove it (toggle off)
        await FeedbackReaction.findByIdAndDelete(existingReaction._id);
        return res.json({
          success: true,
          message: 'Reaction removed.',
          action: 'removed'
        });
      } else {
        // Different emoji – update it
        existingReaction.emoji = emoji;
        existingReaction.updatedAt = new Date();
        await existingReaction.save();
        return res.json({
          success: true,
          message: 'Reaction updated.',
          action: 'updated',
          reaction: existingReaction
        });
      }
    } else {
      // New reaction
      const reaction = new FeedbackReaction({
        feedbackId: id,
        replyId: replyId || null,
        userId: req.user._id,
        emoji: emoji,
        createdAt: new Date()
      });
      await reaction.save();
      return res.json({
        success: true,
        message: 'Reaction added.',
        action: 'added',
        reaction
      });
    }
  } catch (error) {
    console.error('Reaction error:', error);
    res.status(500).json({ error: 'Failed to process reaction.' });
  }
});

// DELETE /api/ratings/:id/reactions – Remove user's reaction
router.delete('/:id/reactions', authenticate, async (req, res) => {
  try {
    const { id } = req.params;
    const { replyId } = req.body;

    const result = await FeedbackReaction.findOneAndDelete({
      feedbackId: id,
      replyId: replyId || null,
      userId: req.user._id
    });

    if (!result) {
      return res.status(404).json({ error: 'Reaction not found.' });
    }

    res.json({
      success: true,
      message: 'Reaction removed successfully.'
    });
  } catch (error) {
    console.error('Reaction removal error:', error);
    res.status(500).json({ error: 'Failed to remove reaction.' });
  }
});

module.exports = router;