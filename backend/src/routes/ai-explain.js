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

// ----- ROBUST EXTRACTION – grabs only numbered bullets and sanitises them -----
const cleanResponse = (text, questionText = '') => {
  if (!text) return '';

  // 1. Remove <think> tags (common in some models)
  let cleaned = text.replace(/<think>[\s\S]*?<\/think>/g, '');

  // 2. Split into lines and trim
  const lines = cleaned.split('\n').map(l => l.trim()).filter(l => l.length > 0);

  // 3. Look for lines that start with "1.", "2.", ..., "5."
  const numberedLines = lines.filter(l => /^[1-5]\.\s/.test(l));

  // 4. If we have at least 3 numbered bullets, return them (sanitized)
  if (numberedLines.length >= 3) {
    // Remove any leftover "Question:", "Options:", etc. that might have crept in
    const sanitized = numberedLines.slice(0, 5).map(line =>
      line.replace(/Question:|Options:|Correct Answer:|User's Answer:/gi, '').trim()
    );
    return sanitized.join('\n');
  }

  // 5. Fallback: try dash/asterisk bullets
  const dashLines = lines.filter(l => /^[•\-*]\s/.test(l));
  if (dashLines.length >= 3) {
    return dashLines.slice(0, 5).join('\n');
  }

  // 6. Fallback: pick lines that are not the question/options and look like sentences
  const filtered = lines.filter(l =>
    !/^Question:|^Options:|^Correct Answer:|^User's Answer:/i.test(l) &&
    !l.includes(questionText) &&
    l.length > 20
  );
  if (filtered.length >= 3) {
    return filtered.slice(-5).join('\n');
  }

  // 7. Ultimate fallback – take last 5 lines
  if (lines.length > 0) {
    return lines.slice(-5).join('\n');
  }

  return 'Explanation not available. Please try again.';
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

    // Pre‑compute the wrong option letters
    const optionLetters = ['A', 'B', 'C', 'D'];
    const wrongOptions = optionLetters.filter(l => l !== correctLetter);

    // ----- IMPROVED PROMPT – pre‑fill letters, ask for completions -----
    const prompt = `You are an AI tutor. Provide a short explanation for the question below. Your response must consist of exactly 5 numbered bullet points. Do not include any other text, the question, or the options.

Use these exact beginnings for each bullet:
1. The correct answer is ${correctLetter} because 
2. Option ${wrongOptions[0]} is wrong because 
3. Option ${wrongOptions[1]} is wrong because 
4. Option ${wrongOptions[2]} is wrong because 
5. Study tip: 

Complete each bullet with a concise reason or tip. Each bullet must be a complete sentence under 20 words.

Question: ${questionText}
Options:
A: ${options[0]}
B: ${options[1]}
C: ${options[2]}
D: ${options[3]}
Correct Answer: ${correctLetter}
User's Answer: ${userLetter}`;

    // Call the AI with a low temperature and frequency penalty to reduce repetition
    const rawExplanation = await callAIModels(prompt, 180, 0.15, { frequency_penalty: 0.5 });

    // Clean and extract only the bullet points
    let finalExplanation = cleanResponse(rawExplanation, questionText);

    // ----- If extraction failed, try a fallback prompt (simpler) -----
    if (!finalExplanation || finalExplanation === 'Explanation not available. Please try again.') {
      const fallbackPrompt = `Correct: ${correctLetter}. Explain in 5 bullets why correct and why each wrong option is wrong.`;
      const fallbackRaw = await callAIModels(fallbackPrompt, 140, 0.15);
      const fallbackCleaned = cleanResponse(fallbackRaw, questionText);
      if (fallbackCleaned && fallbackCleaned !== 'Explanation not available. Please try again.') {
        finalExplanation = fallbackCleaned;
      }
    }

    // ----- Ultimate fallback (should never happen) -----
    if (!finalExplanation || finalExplanation === 'Explanation not available. Please try again.') {
      const correctName = options[correctAnswer];
      const fallbackBullets = [
        `1. The correct answer is ${correctLetter} (${correctName}) because it is the most accurate choice.`,
        `2. Option ${wrongOptions[0]} is wrong because it does not match the correct physiological process.`,
        `3. Option ${wrongOptions[1]} is wrong because it describes a different mechanism.`,
        `4. Option ${wrongOptions[2]} is wrong because it is not the primary factor.`,
        `5. Study tip: Focus on understanding the underlying pathophysiology.`
      ];
      finalExplanation = fallbackBullets.join('\n');
    }

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