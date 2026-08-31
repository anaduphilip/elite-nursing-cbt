// src/routes/rating.js
const express = require('express');
const { Rating, FeedbackReply, FeedbackReaction, Config, User } = require('../models');
const { authenticate } = require('../middleware');

const router = express.Router();

router.post('/', authenticate, async (req, res) => {
  try {
    const { stars, feedback, name } = req.body;
    if (!stars || stars < 1 || stars > 5) {
      return res.status(400).json({ error: 'Please provide a valid star rating (1-5).' });
    }

    const existing = await Rating.findOne({
      userId: req.user._id,
      isDeleted: false
    });

    if (existing) {
      existing.stars = stars;
      existing.feedback = feedback || existing.feedback;
      existing.name = name || existing.name;
      existing.updatedAt = new Date();
      await existing.save();

      await User.findByIdAndUpdate(req.user._id, {
        lastRatingPromptDate: null,
        lastRatingPromptExamCount: 0
      });

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
      isMarketing: false,
      isDeleted: false,
      createdAt: new Date(),
      updatedAt: new Date()
    });

    await rating.save();

    await User.findByIdAndUpdate(req.user._id, {
      lastRatingPromptDate: null,
      lastRatingPromptExamCount: 0
    });

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

router.get('/check', authenticate, async (req, res) => {
  try {
    const config = await Config.findOne();
    const settings = config?.ratingSettings || {
      showRatingModal: true,
      modalFrequency: 'afterExam',
      minExamsBeforePrompt: 3
    };

    const user = req.user;
    const existingRating = await Rating.findOne({
      userId: user._id,
      isDeleted: false
    });
    const hasRated = !!existingRating;
    const userRating = existingRating ? existingRating.stars : null;
    const examCount = user.quizResults?.length || 0;
    const now = new Date();

    if (hasRated) {
      return res.json({
        shouldShow: false,
        hasRated: true,
        userRating,
        examCount,
        settings,
        message: 'Thank you for your feedback!'
      });
    }

    let lastPromptDate = user.lastRatingPromptDate || null;
    let lastPromptExamCount = user.lastRatingPromptExamCount || 0;

    let shouldShow = false;

    switch (settings.modalFrequency) {
      case 'always': {
        if (!lastPromptDate || (now - lastPromptDate) >= 24 * 60 * 60 * 1000) {
          shouldShow = true;
        }
        break;
      }

      case 'once': {
        if (!lastPromptDate) {
          shouldShow = true;
        }
        break;
      }

      case 'afterExam': {
        const minExams = settings.minExamsBeforePrompt || 3;
        if (examCount - lastPromptExamCount >= minExams) {
          shouldShow = true;
        }
        break;
      }

      case 'weekly': {
        if (!lastPromptDate || (now - lastPromptDate) >= 7 * 24 * 60 * 60 * 1000) {
          shouldShow = true;
        }
        break;
      }

      default:
        shouldShow = false;
    }

    if (shouldShow) {
      await User.findByIdAndUpdate(user._id, {
        lastRatingPromptDate: now,
        lastRatingPromptExamCount: examCount
      });
      req.user.lastRatingPromptDate = now;
      req.user.lastRatingPromptExamCount = examCount;
    }

    res.json({
      shouldShow,
      hasRated: false,
      userRating: null,
      examCount,
      settings,
      message: shouldShow ? 'We value your feedback!' : 'Thank you for being part of our community!'
    });
  } catch (error) {
    console.error('Rating check error:', error);
    res.status(500).json({ error: 'Failed to check rating status.' });
  }
});

router.get('/latest', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 5;

    const ratings = await Rating.find({
      isDeleted: false,
      feedback: { $ne: '' }
    })
    .sort({ createdAt: -1 })
    .limit(limit)
    .select('stars feedback name createdAt isMarketing userId');

    const ratingsWithReplies = await Promise.all(
      ratings.map(async (rating) => {
        const replies = await FeedbackReply.find({
          feedbackId: rating._id,
          isDeleted: false
        })
        .sort({ createdAt: 1 })
        .populate('adminId', 'name email')
        .lean();

        const reactions = await FeedbackReaction.find({
          feedbackId: rating._id,
          replyId: null
        })
        .populate('userId', 'name')
        .lean();

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

router.get('/stats', async (req, res) => {
  try {
    const allRatings = await Rating.find({ isDeleted: false });

    const distribution = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    let totalSum = 0;

    allRatings.forEach(r => {
      distribution[r.stars]++;
      totalSum += r.stars;
    });

    const totalCount = allRatings.length;
    const average = totalCount > 0 ? (totalSum / totalCount) : 0;
    const realCount = allRatings.filter(r => !r.isMarketing).length;
    const marketingCount = allRatings.filter(r => r.isMarketing).length;

    res.json({
      success: true,
      stats: {
        total: totalCount,
        average: Math.round(average * 10) / 10,
        distribution: distribution,
        realCount: realCount,
        marketingCount: marketingCount
      }
    });
  } catch (error) {
    console.error('Rating stats error:', error);
    res.status(500).json({ error: 'Failed to fetch rating stats.' });
  }
});

router.post('/:id/reactions', authenticate, async (req, res) => {
  try {
    const { id } = req.params;
    const { emoji, replyId } = req.body;

    const validEmojis = ['👍', '❤️', '👏', '😊', '🔥', '💯', '🌟', '🙌'];
    if (!validEmojis.includes(emoji)) {
      return res.status(400).json({ error: 'Invalid emoji.' });
    }

    const rating = await Rating.findById(id);
    if (!rating || rating.isDeleted) {
      return res.status(404).json({ error: 'Feedback not found.' });
    }

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

    const existingReaction = await FeedbackReaction.findOne({
      feedbackId: id,
      replyId: replyId || null,
      userId: req.user._id
    });

    if (existingReaction) {
      if (existingReaction.emoji === emoji) {
        await FeedbackReaction.findByIdAndDelete(existingReaction._id);
        return res.json({
          success: true,
          message: 'Reaction removed.',
          action: 'removed'
        });
      } else {
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