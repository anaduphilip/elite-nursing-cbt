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

// ----- ROBUST EXTRACTION – keeps the full bullet content -----
const cleanResponse = (text) => {
  if (!text) return '';

  // 1. Remove <think> ... </think>
  let cleaned = text.replace(/<think>[\s\S]*?<\/think>/g, '');

  // 2. Split into lines and remove empty ones
  const lines = cleaned.split('\n').map(l => l.trim()).filter(l => l.length > 0);

  // 3. Look for lines starting with "1.", "2.", etc.
  const bulletLines = lines.filter(l => /^\d\./.test(l));

  // 4. If we have at least 3 numbered bullets, join them and return
  if (bulletLines.length >= 3) {
    return bulletLines.slice(0, 5).join('\n');
  }

  // 5. Try dash/asterisk bullets
  const dashLines = lines.filter(l => /^[•\-*]\s/.test(l));
  if (dashLines.length >= 3) {
    return dashLines.slice(0, 5).join('\n');
  }

  // 6. If we have lines that look like complete sentences (not question/options), take the last 5
  const sentenceLines = lines.filter(l => l.length > 20 && !/^Question:|^Options:|^Correct Answer:|^User's Answer:/i.test(l));
  if (sentenceLines.length >= 3) {
    return sentenceLines.slice(0, 5).join('\n');
  }

  // 7. Fallback: take the last 5 non‑empty lines
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

    // ----- EXPLICIT PROMPT – ask for full, clear explanations -----
    const prompt = `Question: ${questionText}
Options:
A: ${options[0]}
B: ${options[1]}
C: ${options[2]}
D: ${options[3]}
Correct Answer: ${correctLetter}
User's Answer: ${userLetter}

Provide a short, clear explanation in exactly 5 numbered bullet points (1. to 5.).
1. Start with: "The correct answer is [option letter] because [one clear reason]."
2. For each wrong option, explain why it is incorrect (e.g., "Option A is wrong because...").
3. End with a brief study tip.

Do NOT repeat the question or options. Do NOT include any extra text, reasoning, or analysis. 
Each bullet must be a complete sentence (under 20 words).`;

    const rawExplanation = await callAIModels(prompt, 180, 0.15);

    // Clean and extract the bullet points
    let finalExplanation = cleanResponse(rawExplanation);

    // ----- If extraction failed, try a fallback prompt -----
    if (!finalExplanation || finalExplanation === 'Explanation not available. Please try again.') {
      const fallbackPrompt = `Correct: ${correctLetter}. Explain in 5 bullets why correct and why each wrong option is wrong.`;
      const fallbackRaw = await callAIModels(fallbackPrompt, 140, 0.15);
      const fallbackCleaned = cleanResponse(fallbackRaw);
      if (fallbackCleaned && fallbackCleaned !== 'Explanation not available. Please try again.') {
        finalExplanation = fallbackCleaned;
      }
    }

    // ----- Ultimate fallback (should never happen) -----
    if (!finalExplanation || finalExplanation === 'Explanation not available. Please try again.') {
      const optionLabels = ['A', 'B', 'C', 'D'];
      const wrongOptions = optionLabels.filter(l => l !== correctLetter);
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