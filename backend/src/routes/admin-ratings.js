// src/routes/admin-ratings.js
const express = require('express');
const { Rating, FeedbackReply, FeedbackReaction, Config, User } = require('../models');
const { isAdmin, authenticate } = require('../middleware');

const router = express.Router();

// ===== ADMIN ROUTES =====

// GET /api/admin/ratings – Get all ratings (with filters)
router.get('/', isAdmin, async (req, res) => {
  try {
    const { page = 1, limit = 20, stars, isFake, isDeleted } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const filter = {};
    if (stars) filter.stars = parseInt(stars);
    if (isFake !== undefined) filter.isFake = isFake === 'true';
    if (isDeleted !== undefined) filter.isDeleted = isDeleted === 'true';

    const ratings = await Rating.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .populate('userId', 'name email');

    const total = await Rating.countDocuments(filter);

    res.json({
      success: true,
      ratings,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    console.error('Fetch ratings error:', error);
    res.status(500).json({ error: 'Failed to fetch ratings.' });
  }
});

// GET /api/admin/ratings/:id – Get single rating with replies
router.get('/:id', isAdmin, async (req, res) => {
  try {
    const rating = await Rating.findById(req.params.id)
      .populate('userId', 'name email');

    if (!rating) {
      return res.status(404).json({ error: 'Rating not found.' });
    }

    const replies = await FeedbackReply.find({
      feedbackId: rating._id,
      isDeleted: false
    })
    .sort({ createdAt: 1 })
    .populate('adminId', 'name email');

    const reactions = await FeedbackReaction.find({
      feedbackId: rating._id
    })
    .populate('userId', 'name');

    res.json({
      success: true,
      rating,
      replies,
      reactions
    });
  } catch (error) {
    console.error('Fetch rating error:', error);
    res.status(500).json({ error: 'Failed to fetch rating.' });
  }
});

// POST /api/admin/ratings – Create fake rating (for marketing)
router.post('/', isAdmin, async (req, res) => {
  try {
    const { stars, feedback, name, isFake = true } = req.body;

    if (!stars || stars < 1 || stars > 5) {
      return res.status(400).json({ error: 'Valid stars (1-5) are required.' });
    }

    const rating = new Rating({
      userId: null,
      stars,
      feedback: feedback || '',
      name: name || 'Happy User',
      isFake: true,
      isDeleted: false,
      createdAt: new Date(),
      updatedAt: new Date()
    });

    await rating.save();

    res.json({
      success: true,
      message: 'Rating created successfully.',
      rating
    });
  } catch (error) {
    console.error('Create fake rating error:', error);
    res.status(500).json({ error: 'Failed to create rating.' });
  }
});

// POST /api/admin/ratings/bulk – Create multiple fake ratings
router.post('/bulk', isAdmin, async (req, res) => {
  try {
    const { count, stars, namePrefix = 'User', feedback } = req.body;

    if (!count || count < 1 || count > 10000) {
      return res.status(400).json({ error: 'Count must be between 1 and 10000.' });
    }

    if (!stars || stars < 1 || stars > 5) {
      return res.status(400).json({ error: 'Valid stars (1-5) are required.' });
    }

    const ratings = [];
    const now = new Date();

    for (let i = 0; i < count; i++) {
      ratings.push({
        userId: null,
        stars,
        feedback: feedback || '',
        name: `${namePrefix} ${i + 1}`,
        isFake: true,
        isDeleted: false,
        createdAt: new Date(now.getTime() - Math.random() * 30 * 24 * 60 * 60 * 1000), // Random date in last 30 days
        updatedAt: now
      });
    }

    await Rating.insertMany(ratings);

    res.json({
      success: true,
      message: `${count} fake ratings created successfully.`,
      count
    });
  } catch (error) {
    console.error('Bulk fake ratings error:', error);
    res.status(500).json({ error: 'Failed to create bulk ratings.' });
  }
});

// PUT /api/admin/ratings/:id – Update rating
router.put('/:id', isAdmin, async (req, res) => {
  try {
    const { stars, feedback, name, isDeleted } = req.body;
    const rating = await Rating.findById(req.params.id);

    if (!rating) {
      return res.status(404).json({ error: 'Rating not found.' });
    }

    if (stars !== undefined) rating.stars = stars;
    if (feedback !== undefined) rating.feedback = feedback;
    if (name !== undefined) rating.name = name;
    if (isDeleted !== undefined) {
      rating.isDeleted = isDeleted;
      rating.deletedAt = isDeleted ? new Date() : null;
    }
    rating.updatedAt = new Date();

    await rating.save();

    res.json({
      success: true,
      message: 'Rating updated successfully.',
      rating
    });
  } catch (error) {
    console.error('Update rating error:', error);
    res.status(500).json({ error: 'Failed to update rating.' });
  }
});

// DELETE /api/admin/ratings/:id – Soft delete rating
router.delete('/:id', isAdmin, async (req, res) => {
  try {
    const rating = await Rating.findById(req.params.id);

    if (!rating) {
      return res.status(404).json({ error: 'Rating not found.' });
    }

    rating.isDeleted = true;
    rating.deletedAt = new Date();
    await rating.save();

    // Also soft delete all replies
    await FeedbackReply.updateMany(
      { feedbackId: rating._id },
      { isDeleted: true, deletedAt: new Date() }
    );

    res.json({
      success: true,
      message: 'Rating and associated replies deleted successfully.'
    });
  } catch (error) {
    console.error('Delete rating error:', error);
    res.status(500).json({ error: 'Failed to delete rating.' });
  }
});

// POST /api/admin/ratings/:id/reply – Add admin reply
router.post('/:id/reply', isAdmin, async (req, res) => {
  try {
    const { replyText } = req.body;
    const { id } = req.params;

    if (!replyText || replyText.trim().length === 0) {
      return res.status(400).json({ error: 'Reply text is required.' });
    }

    const rating = await Rating.findById(id);
    if (!rating || rating.isDeleted) {
      return res.status(404).json({ error: 'Rating not found.' });
    }

    const reply = new FeedbackReply({
      feedbackId: id,
      adminId: req.userId,
      replyText: replyText.trim(),
      isDeleted: false,
      createdAt: new Date(),
      updatedAt: new Date()
    });

    await reply.save();

    const populatedReply = await FeedbackReply.findById(reply._id)
      .populate('adminId', 'name email');

    res.json({
      success: true,
      message: 'Reply added successfully.',
      reply: populatedReply
    });
  } catch (error) {
    console.error('Reply error:', error);
    res.status(500).json({ error: 'Failed to add reply.' });
  }
});

// PUT /api/admin/ratings/:id/reply/:replyId – Edit admin reply
router.put('/:id/reply/:replyId', isAdmin, async (req, res) => {
  try {
    const { replyText } = req.body;
    const { id, replyId } = req.params;

    if (!replyText || replyText.trim().length === 0) {
      return res.status(400).json({ error: 'Reply text is required.' });
    }

    const reply = await FeedbackReply.findOne({
      _id: replyId,
      feedbackId: id,
      isDeleted: false
    });

    if (!reply) {
      return res.status(404).json({ error: 'Reply not found.' });
    }

    reply.replyText = replyText.trim();
    reply.updatedAt = new Date();
    await reply.save();

    res.json({
      success: true,
      message: 'Reply updated successfully.',
      reply
    });
  } catch (error) {
    console.error('Edit reply error:', error);
    res.status(500).json({ error: 'Failed to update reply.' });
  }
});

// DELETE /api/admin/ratings/:id/reply/:replyId – Delete reply
router.delete('/:id/reply/:replyId', isAdmin, async (req, res) => {
  try {
    const { id, replyId } = req.params;

    const reply = await FeedbackReply.findOne({
      _id: replyId,
      feedbackId: id
    });

    if (!reply) {
      return res.status(404).json({ error: 'Reply not found.' });
    }

    reply.isDeleted = true;
    reply.deletedAt = new Date();
    await reply.save();

    res.json({
      success: true,
      message: 'Reply deleted successfully.'
    });
  } catch (error) {
    console.error('Delete reply error:', error);
    res.status(500).json({ error: 'Failed to delete reply.' });
  }
});

// PUT /api/admin/settings/rating – Update rating settings
router.put('/settings', isAdmin, async (req, res) => {
  try {
    const { ratingSettings } = req.body;
    let config = await Config.findOne();
    if (!config) {
      config = new Config();
    }

    config.ratingSettings = {
      showRatingModal: ratingSettings?.showRatingModal !== undefined ? ratingSettings.showRatingModal : true,
      modalFrequency: ratingSettings?.modalFrequency || 'afterExam',
      minExamsBeforePrompt: ratingSettings?.minExamsBeforePrompt || 3,
      customMessage: ratingSettings?.customMessage || 'We value your feedback! Please rate your experience.',
      fakeRatingsCount: ratingSettings?.fakeRatingsCount || 0,
      fakeRatingsDistribution: ratingSettings?.fakeRatingsDistribution || { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 }
    };

    config.updatedAt = new Date();
    await config.save();

    res.json({
      success: true,
      message: 'Rating settings updated successfully.',
      settings: config.ratingSettings
    });
  } catch (error) {
    console.error('Update rating settings error:', error);
    res.status(500).json({ error: 'Failed to update settings.' });
  }
});

// GET /api/admin/settings/rating – Get rating settings
router.get('/settings', isAdmin, async (req, res) => {
  try {
    const config = await Config.findOne();
    const settings = config?.ratingSettings || {
      showRatingModal: true,
      modalFrequency: 'afterExam',
      minExamsBeforePrompt: 3,
      customMessage: 'We value your feedback! Please rate your experience.',
      fakeRatingsCount: 0,
      fakeRatingsDistribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 }
    };

    res.json({
      success: true,
      settings
    });
  } catch (error) {
    console.error('Fetch rating settings error:', error);
    res.status(500).json({ error: 'Failed to fetch settings.' });
  }
});

// DELETE /api/admin/ratings/reactions/:reactionId – Remove any reaction (admin)
router.delete('/reactions/:reactionId', isAdmin, async (req, res) => {
  try {
    const reaction = await FeedbackReaction.findById(req.params.reactionId);
    if (!reaction) {
      return res.status(404).json({ error: 'Reaction not found.' });
    }

    await FeedbackReaction.findByIdAndDelete(req.params.reactionId);

    res.json({
      success: true,
      message: 'Reaction removed successfully.'
    });
  } catch (error) {
    console.error('Admin remove reaction error:', error);
    res.status(500).json({ error: 'Failed to remove reaction.' });
  }
});

module.exports = router;