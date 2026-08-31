// src/routes/admin-ratings.js
const express = require('express');
const { Rating, FeedbackReply, FeedbackReaction, Config, User } = require('../models');
const { isAdmin } = require('../middleware');

const router = express.Router();

router.get('/settings', isAdmin, async (req, res) => {
  try {
    let config = await Config.findOne();
    if (!config) {
      config = new Config();
      await config.save();
    }
    const settings = {
      showRatingModal: config.ratingSettings?.showRatingModal ?? true,
      modalFrequency: config.ratingSettings?.modalFrequency || 'afterExam',
      minExamsBeforePrompt: config.ratingSettings?.minExamsBeforePrompt || 3,
      customMessage: config.ratingSettings?.customMessage || 'We value your feedback! Please rate your experience.',
      showFeedbackList: config.ratingSettings?.showFeedbackList ?? true,
      feedbackListLimit: config.ratingSettings?.feedbackListLimit || 5,
      showSeeAllLink: config.ratingSettings?.showSeeAllLink ?? true,
      showRatingOnHome: config.ratingSettings?.showRatingOnHome ?? true,
      showRatingOnAbout: config.ratingSettings?.showRatingOnAbout ?? true,
      enableMarketingReactions: config.ratingSettings?.enableMarketingReactions ?? true,
      allowedReactionEmojis: config.ratingSettings?.allowedReactionEmojis || '👍,❤️,👏,😊,🔥,💯,🌟,🙌',
      MarketingRatingsCount: config.ratingSettings?.MarketingRatingsCount || 0,
      MarketingRatingsDistribution: config.ratingSettings?.MarketingRatingsDistribution || { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 }
    };
    res.json({ success: true, settings });
  } catch (error) {
    console.error('Fetch rating settings error:', error);
    res.status(500).json({ error: 'Failed to fetch rating settings.' });
  }
});

router.put('/settings', isAdmin, async (req, res) => {
  try {
    const { ratingSettings } = req.body;
    let config = await Config.findOne();
    if (!config) {
      config = new Config();
    }
    config.ratingSettings = {
      ...config.ratingSettings,
      ...ratingSettings
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
    res.status(500).json({ error: 'Failed to update rating settings.' });
  }
});

router.get('/', isAdmin, async (req, res) => {
  try {
    const { page = 1, limit = 20, stars, isMarketing, isDeleted, search, sort } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const filter = {};
    if (stars) filter.stars = parseInt(stars);
    if (isMarketing !== undefined) filter.isMarketing = isMarketing === 'true';
    if (isDeleted !== undefined) filter.isDeleted = isDeleted === 'true';

    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { feedback: { $regex: search, $options: 'i' } }
      ];
    }

    let sortOption = { createdAt: -1 };
    if (sort === 'oldest') sortOption = { createdAt: 1 };
    else if (sort === 'highest') sortOption = { stars: -1 };
    else if (sort === 'lowest') sortOption = { stars: 1 };

    const ratings = await Rating.find(filter)
      .sort(sortOption)
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

router.post('/', isAdmin, async (req, res) => {
  try {
    const { stars, feedback, name, isMarketing = true } = req.body;
    if (!stars || stars < 1 || stars > 5) {
      return res.status(400).json({ error: 'Valid stars (1-5) are required.' });
    }

    const displayName = name && name.trim() ? name.trim() : 'Anonymous User';

    const rating = new Rating({
      userId: null,
      stars,
      feedback: feedback || '',
      name: displayName,
      isMarketing: true,
      isDeleted: false,
      createdAt: new Date(),
      updatedAt: new Date()
    });
    await rating.save();
    res.json({ success: true, message: 'Rating created successfully.', rating });
  } catch (error) {
    console.error('Create rating error:', error);
    res.status(500).json({ error: 'Failed to create rating.' });
  }
});

router.post('/bulk', isAdmin, async (req, res) => {
  try {
    const { count, stars, namePrefix = '', feedback } = req.body;
    if (!count || count < 1 || count > 10000) {
      return res.status(400).json({ error: 'Count must be between 1 and 10000.' });
    }
    if (!stars || stars < 1 || stars > 5) {
      return res.status(400).json({ error: 'Valid stars (1-5) are required.' });
    }

    const ratings = [];
    const now = new Date();
    const prefix = namePrefix && namePrefix.trim() ? namePrefix.trim() : null;

    for (let i = 0; i < count; i++) {
      const displayName = prefix ? `${prefix} ${i + 1}` : 'Anonymous User';
      ratings.push({
        userId: null,
        stars,
        feedback: feedback || '',
        name: displayName,
        isMarketing: true,
        isDeleted: false,
        createdAt: new Date(now.getTime() - Math.random() * 30 * 24 * 60 * 60 * 1000),
        updatedAt: now
      });
    }
    await Rating.insertMany(ratings);
    res.json({ success: true, message: `${count} marketing ratings created successfully.`, count });
  } catch (error) {
    console.error('Bulk marketing ratings error:', error);
    res.status(500).json({ error: 'Failed to create bulk ratings.' });
  }
});

router.delete('/bulk', isAdmin, async (req, res) => {
  try {
    const { ids, deleteAllMarketing } = req.body;

    if (deleteAllMarketing === true) {
      const result = await Rating.updateMany(
        { isMarketing: true, isDeleted: false },
        { isDeleted: true, deletedAt: new Date() }
      );
      const marketingRatings = await Rating.find({ isMarketing: true, isDeleted: true });
      const marketingIds = marketingRatings.map(r => r._id);
      if (marketingIds.length > 0) {
        await FeedbackReply.updateMany(
          { feedbackId: { $in: marketingIds }, isDeleted: false },
          { isDeleted: true, deletedAt: new Date() }
        );
      }
      return res.json({
        success: true,
        message: `Deleted ${result.modifiedCount} marketing ratings and their replies.`,
        deletedCount: result.modifiedCount
      });
    }

    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({ error: 'Please provide an array of rating IDs or set deleteAllMarketing: true.' });
    }

    const mongoose = require('mongoose');
    const validIds = ids.filter(id => mongoose.Types.ObjectId.isValid(id));
    if (validIds.length === 0) {
      return res.status(400).json({ error: 'No valid rating IDs provided.' });
    }

    const result = await Rating.updateMany(
      { _id: { $in: validIds }, isDeleted: false },
      { isDeleted: true, deletedAt: new Date() }
    );
    await FeedbackReply.updateMany(
      { feedbackId: { $in: validIds }, isDeleted: false },
      { isDeleted: true, deletedAt: new Date() }
    );

    res.json({
      success: true,
      message: `Deleted ${result.modifiedCount} ratings and their replies.`,
      deletedCount: result.modifiedCount
    });
  } catch (error) {
    console.error('Bulk delete error:', error);
    res.status(500).json({ error: 'Failed to delete ratings.' });
  }
});

router.put('/bulk/restore', isAdmin, async (req, res) => {
  try {
    const { ids, restoreAll } = req.body;

    if (restoreAll === true) {
      const result = await Rating.updateMany(
        { isDeleted: true },
        { isDeleted: false, deletedAt: null }
      );
      const restoredRatings = await Rating.find({ isDeleted: false });
      const restoredIds = restoredRatings.map(r => r._id);
      if (restoredIds.length > 0) {
        await FeedbackReply.updateMany(
          { feedbackId: { $in: restoredIds }, isDeleted: true },
          { isDeleted: false, deletedAt: null }
        );
      }
      return res.json({
        success: true,
        message: `Restored ${result.modifiedCount} ratings and their replies.`,
        restoredCount: result.modifiedCount
      });
    }

    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({ error: 'Please provide an array of rating IDs or set restoreAll: true.' });
    }

    const mongoose = require('mongoose');
    const validIds = ids.filter(id => mongoose.Types.ObjectId.isValid(id));
    if (validIds.length === 0) {
      return res.status(400).json({ error: 'No valid rating IDs provided.' });
    }

    const result = await Rating.updateMany(
      { _id: { $in: validIds }, isDeleted: true },
      { isDeleted: false, deletedAt: null }
    );
    await FeedbackReply.updateMany(
      { feedbackId: { $in: validIds }, isDeleted: true },
      { isDeleted: false, deletedAt: null }
    );

    res.json({
      success: true,
      message: `Restored ${result.modifiedCount} ratings and their replies.`,
      restoredCount: result.modifiedCount
    });
  } catch (error) {
    console.error('Bulk restore error:', error);
    res.status(500).json({ error: 'Failed to restore ratings.' });
  }
});

router.delete('/bulk/permanent', isAdmin, async (req, res) => {
  try {
    const { ids, deleteAllDeleted } = req.body;

    if (deleteAllDeleted === true) {
      const deletedRatings = await Rating.find({ isDeleted: true });
      const deletedIds = deletedRatings.map(r => r._id);
      if (deletedIds.length > 0) {
        await FeedbackReply.deleteMany({ feedbackId: { $in: deletedIds } });
        await FeedbackReaction.deleteMany({ feedbackId: { $in: deletedIds } });
      }
      const result = await Rating.deleteMany({ isDeleted: true });
      return res.json({
        success: true,
        message: `Permanently deleted ${result.deletedCount} ratings and their replies.`,
        deletedCount: result.deletedCount
      });
    }

    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({ error: 'Please provide an array of rating IDs or set deleteAllDeleted: true.' });
    }

    const mongoose = require('mongoose');
    const validIds = ids.filter(id => mongoose.Types.ObjectId.isValid(id));
    if (validIds.length === 0) {
      return res.status(400).json({ error: 'No valid rating IDs provided.' });
    }

    await FeedbackReply.deleteMany({ feedbackId: { $in: validIds } });
    await FeedbackReaction.deleteMany({ feedbackId: { $in: validIds } });

    const result = await Rating.deleteMany({ _id: { $in: validIds }, isDeleted: true });

    res.json({
      success: true,
      message: `Permanently deleted ${result.deletedCount} ratings and their replies.`,
      deletedCount: result.deletedCount
    });
  } catch (error) {
    console.error('Bulk permanent delete error:', error);
    res.status(500).json({ error: 'Failed to permanently delete ratings.' });
  }
});

router.delete('/reactions/:reactionId', isAdmin, async (req, res) => {
  try {
    const reaction = await FeedbackReaction.findById(req.params.reactionId);
    if (!reaction) {
      return res.status(404).json({ error: 'Reaction not found.' });
    }
    await FeedbackReaction.findByIdAndDelete(req.params.reactionId);
    res.json({ success: true, message: 'Reaction removed successfully.' });
  } catch (error) {
    console.error('Admin remove reaction error:', error);
    res.status(500).json({ error: 'Failed to remove reaction.' });
  }
});

router.post('/:id/reactions', isAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { emoji, count, replyId } = req.body;

    if (!emoji) {
      return res.status(400).json({ error: 'Emoji is required.' });
    }
    if (!count || count < 1) {
      return res.status(400).json({ error: 'Count must be at least 1.' });
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

    const existing = await FeedbackReaction.findOne({
      feedbackId: id,
      replyId: replyId || null,
      emoji: emoji,
      isMarketing: true
    });

    if (existing) {
      existing.count = count;
      existing.updatedAt = new Date();
      await existing.save();
      return res.json({
        success: true,
        message: 'Reaction count updated.',
        reaction: existing
      });
    }

    const reaction = new FeedbackReaction({
      feedbackId: id,
      replyId: replyId || null,
      userId: null,
      emoji: emoji,
      count: count,
      isMarketing: true,
      createdAt: new Date(),
      updatedAt: new Date()
    });
    await reaction.save();

    res.json({
      success: true,
      message: 'Reaction added successfully.',
      reaction
    });
  } catch (error) {
    console.error('Add marketing reaction error:', error);
    res.status(500).json({ error: 'Failed to add reaction.' });
  }
});

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
    }).sort({ createdAt: 1 }).populate('adminId', 'name email');
    const reactions = await FeedbackReaction.find({
      feedbackId: rating._id
    }).populate('userId', 'name');
    res.json({ success: true, rating, replies, reactions });
  } catch (error) {
    console.error('Fetch rating error:', error);
    res.status(500).json({ error: 'Failed to fetch rating.' });
  }
});

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
    res.json({ success: true, message: 'Rating updated successfully.', rating });
  } catch (error) {
    console.error('Update rating error:', error);
    res.status(500).json({ error: 'Failed to update rating.' });
  }
});

router.delete('/:id', isAdmin, async (req, res) => {
  try {
    const rating = await Rating.findById(req.params.id);
    if (!rating) {
      return res.status(404).json({ error: 'Rating not found.' });
    }
    rating.isDeleted = true;
    rating.deletedAt = new Date();
    await rating.save();
    await FeedbackReply.updateMany(
      { feedbackId: rating._id },
      { isDeleted: true, deletedAt: new Date() }
    );
    res.json({ success: true, message: 'Rating and associated replies deleted successfully.' });
  } catch (error) {
    console.error('Delete rating error:', error);
    res.status(500).json({ error: 'Failed to delete rating.' });
  }
});

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
    res.json({ success: true, message: 'Reply added successfully.', reply: populatedReply });
  } catch (error) {
    console.error('Reply error:', error);
    res.status(500).json({ error: 'Failed to add reply.' });
  }
});

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
    res.json({ success: true, message: 'Reply updated successfully.', reply });
  } catch (error) {
    console.error('Edit reply error:', error);
    res.status(500).json({ error: 'Failed to update reply.' });
  }
});

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
    res.json({ success: true, message: 'Reply deleted successfully.' });
  } catch (error) {
    console.error('Delete reply error:', error);
    res.status(500).json({ error: 'Failed to delete reply.' });
  }
});

module.exports = router;