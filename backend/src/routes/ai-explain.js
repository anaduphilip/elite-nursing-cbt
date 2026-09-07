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

// ----- ULTRA-AGGRESSIVE CLEAN-UP -----
const cleanResponse = (text) => {
  if (!text) return '';

  // 1. Remove <think> ... </think>
  let cleaned = text.replace(/<think>[\s\S]*?<\/think>/g, '');

  // 2. Remove any lines that look like thinking/reasoning
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
    /^User's Answer/i,
    /^Correct Answer/i,
    /^Options:/i,
    /^Question:/i,
    /^Question context/i,
  ];
  for (const pattern of thinkingPatterns) {
    cleaned = cleaned.replace(pattern, '');
  }

  // 3. Find the first bullet point and discard everything before it
  const lines = cleaned.split('\n');
  const bulletIndex = lines.findIndex(line => /^\s*(\d\.|•|-|\*)\s/.test(line));
  if (bulletIndex !== -1) {
    cleaned = lines.slice(bulletIndex).join('\n');
  } else {
    // If no bullet found, take the last 5 non‑empty lines
    const nonEmpty = lines.filter(l => l.trim());
    const lastFive = nonEmpty.slice(-5);
    cleaned = lastFive.join('\n');
  }

  // 4. Remove extra blank lines and trim
  cleaned = cleaned.replace(/\n{3,}/g, '\n\n').trim();

  // 5. If still contains "think" or "reasoning" (case‑insensitive), return fallback
  const forbiddenWords = /\b(think|reasoning|analysis|process)\b/i;
  if (forbiddenWords.test(cleaned)) {
    return 'Explanation not available. Please try again.';
  }

  // 6. If too long (> 200 words), truncate to 5 bullets
  const wordCount = cleaned.split(/\s+/).length;
  if (wordCount > 200) {
    const bulletLines = cleaned.split('\n').filter(l => /^\s*(\d\.|•|-|\*)\s/.test(l));
    if (bulletLines.length >= 5) {
      cleaned = bulletLines.slice(0, 5).join('\n');
    }
  }

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

    // ----- EXTREMELY STRICT DIRECT PROMPT (no system prompt) -----
    const prompt = `Question: ${questionText}
Options:
A: ${options[0]}
B: ${options[1]}
C: ${options[2]}
D: ${options[3]}
Correct Answer: ${correctLetter}
User's Answer: ${userLetter}

Provide ONLY these 5 bullet points. NO extra text, NO reasoning, NO thinking. Each bullet = one sentence (max 15 words). Total under 150 words.
1. Why correct answer is right:
2. Why A is wrong:
3. Why B is wrong:
4. Why D is wrong:
5. Study tip:`;

    // Minimum possible tokens, lowest temperature
    const rawExplanation = await callAIModels(prompt, 150, 0.05);

    // Clean and validate
    let finalExplanation = cleanResponse(rawExplanation);

    // If still looks like thinking, try with an even shorter prompt (fallback)
    if (!finalExplanation || finalExplanation.includes('think') || finalExplanation.includes('reasoning')) {
      const fallbackPrompt = `Question: ${questionText} Correct: ${correctLetter}. Explain in 5 bullets (max 15 words each): 1. Correct answer 2. A wrong 3. B wrong 4. D wrong 5. Tip.`;
      const fallbackRaw = await callAIModels(fallbackPrompt, 120, 0.05);
      finalExplanation = cleanResponse(fallbackRaw);
    }

    // Final check: if still empty or too long, use generic fallback
    if (!finalExplanation || finalExplanation.split(/\s+/).length > 200) {
      finalExplanation = '1. Correct answer is right.\n2. A is wrong.\n3. B is wrong.\n4. D is wrong.\n5. Study tip: Review key concepts.';
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