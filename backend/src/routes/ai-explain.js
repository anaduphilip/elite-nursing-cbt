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

// ----- STRONGER EXTRACTION – removes ALL meta/analysis lines -----
const cleanResponse = (text, questionText = '') => {
  if (!text) return '';

  // 1. Remove <think> tags
  let cleaned = text.replace(/<think>[\s\S]*?<\/think>/g, '');

  // 2. Split into lines and trim
  const lines = cleaned.split('\n').map(l => l.trim()).filter(l => l.length > 0);

  // 3. Remove lines that start with meta/analysis keywords
  const metaPatterns = [
    /^Analyze/i,
    /^Role:/i,
    /^Task:/i,
    /^Deconstruct/i,
    /^Here'?s/i,
    /^Let me think/i,
    /^I think/i,
    /^My reasoning/i,
    /^Step by step/i,
    /^First,/i,
    /^Second,/i,
    /^Third,/i,
    /^Finally,/i,
    /^We need to/i,
    /^The user/i,
    /^To solve/i,
  ];
  const filteredLines = lines.filter(line => {
    const trimmed = line.trim();
    // Keep if it's a bullet or a complete sentence, but only if it doesn't match meta patterns
    if (metaPatterns.some(p => p.test(trimmed))) return false;
    // Also remove lines that are the question/options
    if (/^Question:|^Options:|^Correct Answer:|^User's Answer:|^Requirements:/i.test(trimmed)) return false;
    return true;
  });

  // 4. Extract numbered bullets (1., 2., etc.)
  const numberedBullets = filteredLines.filter(l => /^[1-5]\.\s/.test(l));
  if (numberedBullets.length >= 3) {
    // Clean any leftover meta text from within bullets (just in case)
    const cleanedBullets = numberedBullets.slice(0, 5).map(line =>
      line.replace(/^(1\.|2\.|3\.|4\.|5\.)\s*/, '').trim()
    );
    // Re-add the numbers
    return cleanedBullets.map((text, i) => `${i+1}. ${text}`).join('\n');
  }

  // 5. If no numbered bullets, try dash/asterisk bullets
  const dashBullets = filteredLines.filter(l => /^[•\-*]\s/.test(l));
  if (dashBullets.length >= 3) {
    return dashBullets.slice(0, 5).join('\n');
  }

  // 6. If still nothing, take the last 5 non‑meta lines that are complete sentences
  const sentenceLines = filteredLines.filter(l => l.length > 20);
  if (sentenceLines.length >= 3) {
    return sentenceLines.slice(-5).join('\n');
  }

  // 7. Fallback
  return filteredLines.slice(-5).join('\n') || 'Explanation not available. Please try again.';
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

    // Pre‑compute wrong option letters
    const optionLetters = ['A', 'B', 'C', 'D'];
    const wrongOptions = optionLetters.filter(l => l !== correctLetter);

    // ----- SIMPLER, LESS RESTRICTIVE PROMPT (so the model doesn't cut off) -----
    const prompt = `Question: ${questionText}
Options:
A: ${options[0]}
B: ${options[1]}
C: ${options[2]}
D: ${options[3]}
Correct Answer: ${correctLetter}
User's Answer: ${userLetter}

Explain in 5 short bullet points (1. to 5.) why the correct answer is right and why each wrong option is wrong. End with a study tip. Keep it concise.`;

    // Increase token limit slightly to allow completion
    const rawExplanation = await callAIModels(prompt, 220, 0.2);

    // Clean and extract bullets
    let finalExplanation = cleanResponse(rawExplanation, questionText);

    // ----- If extraction failed, try a simpler fallback -----
    if (!finalExplanation || finalExplanation === 'Explanation not available. Please try again.') {
      const fallbackPrompt = `Correct: ${correctLetter}. Explain in 5 bullets.`;
      const fallbackRaw = await callAIModels(fallbackPrompt, 150, 0.15);
      const fallbackCleaned = cleanResponse(fallbackRaw, questionText);
      if (fallbackCleaned && fallbackCleaned !== 'Explanation not available. Please try again.') {
        finalExplanation = fallbackCleaned;
      }
    }

    // ----- Ultimate fallback (generic) -----
    if (!finalExplanation || finalExplanation === 'Explanation not available. Please try again.') {
      const correctName = options[correctAnswer];
      finalExplanation = [
        `1. The correct answer is ${correctLetter} (${correctName}) because it is the most accurate choice.`,
        `2. Option ${wrongOptions[0]} is wrong because it does not match the correct physiological process.`,
        `3. Option ${wrongOptions[1]} is wrong because it describes a different mechanism.`,
        `4. Option ${wrongOptions[2]} is wrong because it is not the primary factor.`,
        `5. Study tip: Focus on understanding the underlying pathophysiology.`
      ].join('\n');
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