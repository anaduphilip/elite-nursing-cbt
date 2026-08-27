// src/utils/ai-providers.js
const axios = require('axios');

// AI Provider configurations
const aiProviders = [];

// 1. Mistral (primary – confirmed working)
if (process.env.MISTRAL_API_KEY) {
  aiProviders.push({
    name: 'mistral',
    url: 'https://api.mistral.ai/v1/chat/completions',
    headers: { 'Authorization': `Bearer ${process.env.MISTRAL_API_KEY}` },
    model: 'mistral-small-latest',
    format: 'openai'
  });
}

// 2. Groq – Qwen 3.6 (confirmed working)
if (process.env.GROQ_API_KEY) {
  aiProviders.push({
    name: 'groq-qwen3.6',
    url: 'https://api.groq.com/openai/v1/chat/completions',
    headers: { 'Authorization': `Bearer ${process.env.GROQ_API_KEY}` },
    model: 'qwen/qwen3.6-27b',
    format: 'openai'
  });
}

// 3. Groq – Qwen 3.8 (confirmed working)
if (process.env.GROQ_API_KEY) {
  aiProviders.push({
    name: 'groq-qwen3.8',
    url: 'https://api.groq.com/openai/v1/chat/completions',
    headers: { 'Authorization': `Bearer ${process.env.GROQ_API_KEY}` },
    model: 'qwen/qwen3.8-27b',
    format: 'openai'
  });
}

// 4. NVIDIA (secondary – confirmed working)
if (process.env.NVIDIA_API_KEY) {
  aiProviders.push({
    name: 'nvidia',
    url: 'https://integrate.api.nvidia.com/v1/chat/completions',
    headers: { 'Authorization': `Bearer ${process.env.NVIDIA_API_KEY}` },
    model: 'meta/llama-3.1-70b-instruct',
    format: 'openai'
  });
}

// 5. Gemini (quota issues – may work later)
if (process.env.GEMINI_API_KEY) {
  aiProviders.push({
    name: 'gemini',
    url: `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${process.env.GEMINI_API_KEY}`,
    format: 'gemini'
  });
}

// 6. DeepSeek (insufficient balance – last resort)
if (process.env.DEEPSEEK_API_KEY) {
  aiProviders.push({
    name: 'deepseek',
    url: 'https://api.deepseek.com/v1/chat/completions',
    headers: { 'Authorization': `Bearer ${process.env.DEEPSEEK_API_KEY}` },
    model: 'deepseek-chat',
    format: 'openai'
  });
}

// Helper: Normalize Gemini response to OpenAI format
function normalizeResponse(provider, raw) {
  if (provider.format === 'gemini') {
    const candidates = raw.candidates || [];
    if (candidates.length > 0) {
      const text = candidates[0].content?.parts?.[0]?.text || '';
      return { choices: [{ message: { content: text }, index: 0, finish_reason: 'stop' }] };
    }
    return { choices: [] };
  }
  return raw;
}

// Main function to call providers in order
async function callAIModels(prompt, maxTokens = 400, temperature = 0.7) {
  const messages = [
    { role: 'system', content: 'You are a helpful nursing educator.' },
    { role: 'user', content: prompt }
  ];

  for (const provider of aiProviders) {
    try {
      console.log(`🔄 Attempting AI provider: ${provider.name}`);
      const headers = { 'Content-Type': 'application/json' };
      if (provider.headers) Object.assign(headers, provider.headers);

      let payload;
      if (provider.format === 'gemini') {
        const userContent = messages.find(m => m.role === 'user')?.content || '';
        payload = {
          contents: [{ parts: [{ text: userContent }] }],
          generationConfig: {
            maxOutputTokens: maxTokens,
            temperature: temperature
          }
        };
      } else {
        payload = {
          model: provider.model,
          messages: messages,
          max_tokens: maxTokens,
          temperature: temperature
        };
      }

      const response = await axios.post(provider.url, payload, {
        headers: headers,
        timeout: 60000
      });

      if (response.status === 200) {
        const raw = response.data;
        if (raw.error) {
          console.log(`Provider ${provider.name} returned error in body: ${raw.error.message || JSON.stringify(raw.error)}`);
          continue;
        }
        const normalized = normalizeResponse(provider, raw);
        if (normalized.choices && normalized.choices.length > 0) {
          const content = normalized.choices[0].message?.content;
          if (content) {
            console.log(`✅ Provider ${provider.name} succeeded`);
            return content;
          } else {
            console.log(`Provider ${provider.name} returned empty content`);
            continue;
          }
        } else {
          console.log(`Provider ${provider.name} invalid response:`, raw);
          continue;
        }
      } else {
        console.log(`Provider ${provider.name} failed with status ${response.status}: ${response.data?.error?.message || response.statusText}`);
      }
    } catch (err) {
      console.log(`Provider ${provider.name} error:`, err.message);
      continue;
    }
  }

  throw new Error('All AI providers failed. Please try again later.');
}

module.exports = {
  aiProviders,
  callAIModels
};