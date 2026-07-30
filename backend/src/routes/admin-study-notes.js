// src/routes/admin-study-notes.js
const express = require('express');
const { StudyNote } = require('../models');
const { isAdmin } = require('../middleware');

const router = express.Router();

// Get all study notes
router.get('/', isAdmin, async (req, res) => {
  try {
    const notes = await StudyNote.find().sort({ order: 1, createdAt: -1 });
    res.json({ success: true, notes });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch study notes' });
  }
});

// Create study note
router.post('/', isAdmin, async (req, res) => {
  try {
    const { title, description, content, category, order, active, isPremium, estimatedReadTime } = req.body;
    if (!title || !content) {
      return res.status(400).json({ error: 'Title and content are required' });
    }
    const note = new StudyNote({
      title,
      description: description || '',
      content,
      category: category || 'General',
      order: order || 0,
      active: active !== undefined ? active : true,
      isPremium: isPremium || false,
      estimatedReadTime: estimatedReadTime || 5
    });
    await note.save();
    res.json({ success: true, note });
  } catch (error) {
    console.error('Create study note error:', error);
    res.status(500).json({ error: 'Failed to create study note' });
  }
});

// Update study note
router.put('/:id', isAdmin, async (req, res) => {
  try {
    const { title, description, content, category, order, active, isPremium, estimatedReadTime } = req.body;
    const note = await StudyNote.findById(req.params.id);
    if (!note) return res.status(404).json({ error: 'Note not found' });
    if (title) note.title = title;
    if (description !== undefined) note.description = description;
    if (content) note.content = content;
    if (category) note.category = category;
    if (order !== undefined) note.order = order;
    if (active !== undefined) note.active = active;
    if (isPremium !== undefined) note.isPremium = isPremium;
    if (estimatedReadTime !== undefined) note.estimatedReadTime = estimatedReadTime;
    note.updatedAt = new Date();
    await note.save();
    res.json({ success: true, note });
  } catch (error) {
    console.error('Update study note error:', error);
    res.status(500).json({ error: 'Failed to update study note' });
  }
});

// Delete study note
router.delete('/:id', isAdmin, async (req, res) => {
  try {
    const note = await StudyNote.findByIdAndDelete(req.params.id);
    if (!note) return res.status(404).json({ error: 'Note not found' });
    res.json({ success: true, message: 'Note deleted' });
  } catch (error) {
    console.error('Delete study note error:', error);
    res.status(500).json({ error: 'Failed to delete study note' });
  }
});

module.exports = router;