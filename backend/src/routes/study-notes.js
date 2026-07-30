// src/routes/study-notes.js
const express = require('express');
const { StudyNote } = require('../models');
const { authenticate, isAdmin } = require('../middleware');
const { callAIModels } = require('../utils');

const router = express.Router();

// Get active study notes (filtered by premium)
router.get('/', authenticate, async (req, res) => {
  try {
    const query = { active: true };
    let notes = await StudyNote.find(query).sort({ order: 1, createdAt: -1 });
    if (!req.user.isPremium) {
      notes = notes.filter(note => !note.isPremium);
    }
    const readIds = req.user.readStudyNotes.map(id => id.toString());
    const notesWithReadStatus = notes.map(note => ({
      ...note.toObject(),
      isRead: readIds.includes(note._id.toString())
    }));
    res.json({ success: true, notes: notesWithReadStatus });
  } catch (error) {
    console.error('Fetch study notes error:', error);
    res.status(500).json({ error: 'Failed to fetch study notes' });
  }
});

// Mark a study note as read
router.post('/:noteId/read', authenticate, async (req, res) => {
  try {
    const { noteId } = req.params;
    const user = req.user;
    const note = await StudyNote.findById(noteId);
    if (!note) return res.status(404).json({ error: 'Note not found' });
    if (!user.readStudyNotes) user.readStudyNotes = [];
    if (!user.readStudyNotes.includes(noteId)) {
      user.readStudyNotes.push(noteId);
      await user.save();
    }
    res.json({ success: true, message: 'Note marked as read' });
  } catch (error) {
    console.error('Mark note as read error:', error);
    res.status(500).json({ error: 'Failed to mark note as read' });
  }
});

// Ask AI about a study note
router.post('/:noteId/ask', authenticate, async (req, res) => {
  try {
    const { noteId } = req.params;
    const { question } = req.body;
    if (!question || question.trim().length === 0) {
      return res.status(400).json({ error: 'Question is required' });
    }
    const note = await StudyNote.findById(noteId);
    if (!note) return res.status(404).json({ error: 'Note not found' });
    if (note.isPremium && !req.user.isPremium) {
      return res.status(403).json({ error: 'This note is premium content. Upgrade to access.' });
    }
    const prompt = `You are a helpful nursing educator. A user has read the following study note and has a question about it.

STUDY NOTE:
Title: ${note.title}
Category: ${note.category}
Content:
${note.content}

USER'S QUESTION:
${question}

Please provide a clear, educational answer that helps the user understand the topic better. If the question is not directly covered in the note, use your nursing knowledge to provide the best possible answer.`;

    const answer = await callAIModels(prompt, 500, 0.7);
    res.json({ success: true, answer });
  } catch (error) {
    console.error('Study note AI error:', error);
    res.status(500).json({ error: 'Failed to get AI response. Please try again.' });
  }
});

module.exports = router;