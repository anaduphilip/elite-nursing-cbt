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

// ----- SIMPLER CLEAN-UP: remove <think> tags, then extract bullets -----
const cleanResponse = (text) => {
  if (!text) return '';

  // 1. Remove <think> ... </think>
  let cleaned = text.replace(/<think>[\s\S]*?<\/think>/g, '');

  // 2. Split into lines and filter out empty ones
  const lines = cleaned.split('\n').map(l => l.trim()).filter(l => l);

  // 3. Look for lines that start with a number and a dot (e.g., "1.")
  const bulletLines = lines.filter(l => /^\d\./.test(l));

  // 4. If we have at least 3 bullet lines, join them and return
  if (bulletLines.length >= 3) {
    return bulletLines.slice(0, 5).join('\n');
  }

  // 5. If no numbered bullets, try to find lines with dashes or asterisks
  const dashBullets = lines.filter(l => /^[•\-*]\s/.test(l));
  if (dashBullets.length >= 3) {
    return dashBullets.slice(0, 5).join('\n');
  }

  // 6. If still nothing, take the last 5 non‑empty lines as a fallback
  if (lines.length > 0) {
    return lines.slice(-5).join('\n');
  }

  // 7. Fallback
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

    // ----- EXTREMELY DIRECT PROMPT – FORCE NUMBERED BULLETS -----
    const prompt = `Question: ${questionText}
Options:
A: ${options[0]}
B: ${options[1]}
C: ${options[2]}
D: ${options[3]}
Correct Answer: ${correctLetter}
User's Answer: ${userLetter}

Output ONLY these 5 numbered bullet points (start each with 1., 2., 3., 4., 5.). No extra text. No reasoning.
1. Why correct answer is right:
2. Why A is wrong:
3. Why B is wrong:
4. Why D is wrong:
5. Study tip:`;

    // Very low temperature, short token limit
    const rawExplanation = await callAIModels(prompt, 160, 0.1);

    // Clean and extract bullets
    const finalExplanation = cleanResponse(rawExplanation);

    // If still empty, use a generic template (but this should rarely happen)
    if (!finalExplanation || finalExplanation === 'Explanation not available. Please try again.') {
      // Attempt one more time with an even shorter fallback prompt
      const fallbackPrompt = `Correct: ${correctLetter}. Explain in 5 numbered bullets (1. 2. 3. 4. 5.) why correct and why others wrong.`;
      const fallbackRaw = await callAIModels(fallbackPrompt, 120, 0.1);
      const fallbackCleaned = cleanResponse(fallbackRaw);
      if (fallbackCleaned && fallbackCleaned !== 'Explanation not available. Please try again.') {
        return res.json({
          success: true,
          explanation: fallbackCleaned,
          remaining: limitCheck.remaining - 1,
          isPremium: req.user.isPremium
        });
      }
      // Ultimate fallback
      return res.json({
        success: true,
        explanation: '1. Correct answer is right.\n2. A is wrong.\n3. B is wrong.\n4. D is wrong.\n5. Study tip: Review key concepts.',
        remaining: limitCheck.remaining - 1,
        isPremium: req.user.isPremium
      });
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