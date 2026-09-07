// src/routes/ai-explain.js
const express = require('express');
const { authenticate } = require('../middleware');
const { callAIModels } = require('../utils');

const router = express.Router();

// Helper: Check user's daily limit (free users get 10/day)
const checkUserExplanationLimit = async (user) => {
  if (user.isPremium) return { allowed: true, remaining: Infinity };
  const today = new Date().toDateString();
  const lastReset = user.lastExplanationReset ? new Date(user.lastExplanationReset).toDateString() : null;
  if (lastReset !== today) {
    user.dailyExplanations = 0;
    user.lastExplanationReset = new Date();
    await user.save();
  }
  const limit = 10;
  const used = user.dailyExplanations || 0;
  const remaining = Math.max(0, limit - used);
  return { allowed: remaining > 0, remaining };
};

// ----- EXTREMELY AGGRESSIVE CLEAN‑UP -----
const cleanResponse = (text) => {
  if (!text) return '';

  // 1. Remove <think> ... </think> (including tags)
  let cleaned = text.replace(/<think>[\s\S]*?<\/think>/g, '');

  // 2. Remove common thinking / reasoning phrases (with flexible matching)
  const thinkingPatterns = [
    /^Here'?s a thinking process/i,
    /^Analyze User Input/i,
    /^Deconstruct the Question/i,
    /^Role:/i,
    /^Task:/i,
    /^Constraints:/i,
    /^The user/i,
    /^We need to/i,
    /^Let's/i,
    /^I think/i,
    /^My reasoning/i,
    /^This is a thinking process/i,
    /^Step by step/i,
    /^Let me think/i,
    /^To solve this/i,
    /^First,?/i,
    /^Second,?/i,
    /^Third,?/i,
    /^Finally,?/i,
  ];
  for (const pattern of thinkingPatterns) {
    cleaned = cleaned.replace(pattern, '');
  }

  // 3. Remove any leading lines that don't start with a bullet (1., •, -, *, etc.)
  const lines = cleaned.split('\n');
  const bulletLineIndex = lines.findIndex(line => /^\s*(\d\.|•|-|\*)\s/.test(line));
  if (bulletLineIndex !== -1) {
    cleaned = lines.slice(bulletLineIndex).join('\n');
  } else {
    // If no bullet found, keep only the last 5 lines (safety)
    const lastLines = lines.slice(-5);
    cleaned = lastLines.join('\n');
  }

  // 4. Remove extra blank lines and trim
  cleaned = cleaned.replace(/\n{3,}/g, '\n\n').trim();

  // 5. If the cleaned text is empty, return a fallback
  return cleaned || 'Explanation not available. Please try again.';
};

// Generate AI explanation
router.post('/', authenticate, async (req, res) => {
  try {
    const { questionText, options, correctAnswer, userAnswer } = req.body;
    if (!questionText || !options || options.length !== 4) {
      return res.status(400).json({ error: 'Invalid question data' });
    }

    const limitCheck = await checkUserExplanationLimit(req.user);
    if (!limitCheck.allowed) {
      return res.status(403).json({
        error: 'Daily explanation limit reached (10/day for free users). Upgrade to Premium for unlimited!',
        limitReached: true,
        remaining: 0
      });
    }

    const correctLetter = String.fromCharCode(65 + correctAnswer);
    const userLetter = userAnswer !== undefined ? String.fromCharCode(65 + userAnswer) : 'Not answered';

    // ----- SYSTEM + USER PROMPTS – STRICTEST FORMAT -----
    const systemPrompt = `You are a nursing educator. Output ONLY the following 5 bullet points, with NO extra text, NO reasoning, and NO analysis. Do NOT include any thinking process. Do NOT use <think> tags. Each bullet must be one sentence (max 15 words). Total response under 150 words.`;

    const userPrompt = `Question: ${questionText}
Options:
A: ${options[0]}
B: ${options[1]}
C: ${options[2]}
D: ${options[3]}
Correct Answer: ${correctLetter}
User's Answer: ${userLetter}

Provide:
1. Why the correct answer is right
2. Why A is wrong
3. Why B is wrong
4. Why D is wrong
5. One brief study tip`;

    // Combine system and user messages (our callAIModels expects a single prompt, so we'll merge them)
    const fullPrompt = `${systemPrompt}\n\n${userPrompt}`;

    // Use very low temperature and strict token limit
    const rawExplanation = await callAIModels(fullPrompt, 160, 0.1);

    // ----- Clean response aggressively -----
    const finalExplanation = cleanResponse(rawExplanation);

    // Increment user's daily count (if not premium)
    if (!req.user.isPremium) {
      req.user.dailyExplanations = (req.user.dailyExplanations || 0) + 1;
      await req.user.save();
    }

    res.json({
      success: true,
      explanation: finalExplanation,
      remaining: limitCheck.remaining - 1,
      isPremium: req.user.isPremium
    });
  } catch (error) {
    console.error('AI explanation error:', error);
    res.status(500).json({ error: 'Failed to generate AI explanation. Please try again later.' });
  }
});

// Get remaining explanations for today
router.get('/remaining', authenticate, async (req, res) => {
  if (req.user.isPremium) {
    return res.json({ remaining: Infinity, isPremium: true });
  }
  const today = new Date().toDateString();
  const lastReset = req.user.lastExplanationReset ? new Date(req.user.lastExplanationReset).toDateString() : null;
  if (lastReset !== today) {
    req.user.dailyExplanations = 0;
    req.user.lastExplanationReset = new Date();
    await req.user.save();
  }
  const limit = 10;
  const used = req.user.dailyExplanations || 0;
  const remaining = Math.max(0, limit - used);
  res.json({ remaining, isPremium: false });
});

module.exports = router;