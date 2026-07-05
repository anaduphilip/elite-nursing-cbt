const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');
const mammoth = require('mammoth');

// ========== CONFIGURATION ==========
const MONGODB_URI = 'mongodb://localhost:27017/quizapp';
const BASE_FOLDER = 'C:\\Users\\user\\Desktop\\questions\\General Nursing';
const CATEGORY = 'general-nursing';

// ========== Mongoose Schema ==========
const quizSchema = new mongoose.Schema({
  title: String,
  description: String,
  category: String,
  topic: String,
  questions: [{
    questionText: String,
    options: [String],
    correctAnswer: Number,
    points: Number
  }],
  isPremium: Boolean
});

const Quiz = mongoose.model('Quiz', quizSchema);

// ========== Extract starting number from filename ==========
function getStartNumber(filename) {
  const match = filename.match(/Questions?\s*(\d+)\s*(?:to|-)\s*\d+/i);
  if (match) return parseInt(match[1], 10);
  return Infinity;
}

// ========== Robust option extraction ==========
function extractOptions(text) {
  // Try (a) ... (b) ... (c) ... (d) ...
  const markers = ['(a)', '(b)', '(c)', '(d)'];
  let positions = [];
  for (const marker of markers) {
    const idx = text.indexOf(marker);
    if (idx !== -1) positions.push({ marker, index: idx });
  }
  if (positions.length === 4) {
    positions.sort((a, b) => a.index - b.index);
    const options = [];
    for (let i = 0; i < positions.length; i++) {
      const start = positions[i].index + positions[i].marker.length;
      const end = i < positions.length - 1 ? positions[i+1].index : text.length;
      let opt = text.substring(start, end).trim();
      // Remove trailing spaces and any extra closing parenthesis that might belong to the next marker
      opt = opt.replace(/\s*\)?\s*$/, '').trim();
      options.push(opt);
    }
    // Remove the option part from the question text
    const firstMarkerIndex = positions[0].index;
    const questionText = text.substring(0, firstMarkerIndex).trim();
    return { options, questionText };
  }

  // Try a. b. c. d.
  const altMarkers = ['a.', 'b.', 'c.', 'd.'];
  positions = [];
  for (const marker of altMarkers) {
    const idx = text.indexOf(marker);
    if (idx !== -1) positions.push({ marker, index: idx });
  }
  if (positions.length === 4) {
    positions.sort((a, b) => a.index - b.index);
    const options = [];
    for (let i = 0; i < positions.length; i++) {
      const start = positions[i].index + positions[i].marker.length;
      const end = i < positions.length - 1 ? positions[i+1].index : text.length;
      let opt = text.substring(start, end).trim();
      opt = opt.replace(/\s*$/,'').trim();
      options.push(opt);
    }
    const firstMarkerIndex = positions[0].index;
    const questionText = text.substring(0, firstMarkerIndex).trim();
    return { options, questionText };
  }

  // If we can't find 4 options, return empty
  return { options: [], questionText: text };
}

// ========== Extract questions from a document ==========
async function extractQuestionsFromDocx(filePath) {
  const result = await mammoth.extractRawText({ path: filePath });
  let text = result.value;
  // Remove ** and normalize
  text = text.replace(/\*\*/g, '').replace(/\*/g, '');
  text = text.replace(/\r/g, '');
  const lines = text.split('\n').map(l => l.trim()).filter(l => l.length > 0);

  // ---------- Extract Answer Key ----------
  const answers = {};
  let inAnswerKey = false;
  for (const line of lines) {
    if (/^Answer\s+Key/i.test(line)) {
      inAnswerKey = true;
      continue;
    }
    if (inAnswerKey) {
      const m = line.match(/^Q(\d+)\s*[.:]\s*\(?([A-Da-d])\)?/i);
      if (m) {
        answers[parseInt(m[1])] = m[2].toUpperCase();
      }
    }
  }
  // Fallback: scan all lines
  if (Object.keys(answers).length === 0) {
    for (const line of lines) {
      const m = line.match(/^Q(\d+)\s*[.:]\s*\(?([A-Da-d])\)?/i);
      if (m) {
        answers[parseInt(m[1])] = m[2].toUpperCase();
      }
    }
  }

  // ---------- Extract questions (line by line) ----------
  const questions = [];
  let currentNumber = null;
  let currentBlock = '';

  for (const line of lines) {
    // Check if this line starts a new question
    const qMatch = line.match(/^Q(\d+)\s*[.:]\s*/i);
    if (qMatch) {
      // Save previous question if any
      if (currentNumber !== null && currentBlock.trim().length > 0) {
        const { options, questionText } = extractOptions(currentBlock);
        if (options.length === 4 && answers[currentNumber]) {
          const correctIndex = answers[currentNumber].charCodeAt(0) - 65;
          if (correctIndex >= 0 && correctIndex < 4) {
            questions.push({
              number: currentNumber,
              text: questionText || `Question ${currentNumber}`,
              options: options,
              correctAnswer: correctIndex
            });
          }
        }
      }
      // Start new question
      currentNumber = parseInt(qMatch[1]);
      const rest = line.substring(qMatch[0].length);
      currentBlock = rest;
    } else {
      // Append line to current block (if we are inside a question)
      if (currentNumber !== null) {
        currentBlock += ' ' + line;
      }
    }
  }
  // Save the last question
  if (currentNumber !== null && currentBlock.trim().length > 0) {
    const { options, questionText } = extractOptions(currentBlock);
    if (options.length === 4 && answers[currentNumber]) {
      const correctIndex = answers[currentNumber].charCodeAt(0) - 65;
      if (correctIndex >= 0 && correctIndex < 4) {
        questions.push({
          number: currentNumber,
          text: questionText || `Question ${currentNumber}`,
          options: options,
          correctAnswer: correctIndex
        });
      }
    }
  }

  // Log missing numbers
  const answerKeys = Object.keys(answers).map(Number).sort((a, b) => a - b);
  const extractedNumbers = questions.map(q => q.number);
  const missingNumbers = answerKeys.filter(num => !extractedNumbers.includes(num));
  if (missingNumbers.length > 0) {
    console.log(`   ❌ Missing: [${missingNumbers.join(', ')}]`);
  }

  console.log(`   Extracted ${questions.length} questions from ${answerKeys.length} answer keys`);
  return questions;
}

// ========== Recursive import ==========
async function main() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    await Quiz.deleteMany({ category: CATEGORY });
    console.log(`🗑️ Deleted existing quizzes for category: ${CATEGORY}\n`);

    const files = [];
    function walk(dir, currentTopic) {
      if (!fs.existsSync(dir)) return;
      const items = fs.readdirSync(dir, { withFileTypes: true });
      for (const item of items) {
        const fullPath = path.join(dir, item.name);
        if (item.isDirectory()) {
          walk(fullPath, item.name);
        } else if (item.isFile() && item.name.toLowerCase().endsWith('.docx')) {
          const topic = currentTopic || 'General';
          const startNum = getStartNumber(item.name);
          files.push({ fullPath, topic, filename: item.name, startNum });
        }
      }
    }
    walk(BASE_FOLDER, null);

    if (files.length === 0) {
      console.log('⚠️ No .docx files found in', BASE_FOLDER);
      process.exit(0);
    }

    console.log(`📁 Found ${files.length} .docx files\n`);

    const grouped = new Map();
    for (const file of files) {
      if (!grouped.has(file.topic)) grouped.set(file.topic, []);
      grouped.get(file.topic).push(file);
    }

    let totalImported = 0;

    for (const [topic, fileList] of grouped.entries()) {
      fileList.sort((a, b) => a.startNum - b.startNum);
      console.log(`\n📁 Topic: ${topic} (${fileList.length} files)`);

      for (let idx = 0; idx < fileList.length; idx++) {
        const file = fileList[idx];
        const isPremium = idx !== 0;
        const title = file.filename.replace(/\.docx$/i, '');
        console.log(`   📖 ${title} (${isPremium ? 'Premium' : 'Free'})`);

        const questions = await extractQuestionsFromDocx(file.fullPath);

        if (questions.length === 0) {
          console.log(`      ⚠️ No valid questions, skipping.`);
          continue;
        }

        const quizQuestions = questions.map(q => ({
          questionText: q.text,
          options: q.options,
          correctAnswer: q.correctAnswer,
          points: 1
        }));

        await Quiz.create({
          title: title,
          description: `${title} - ${questions.length} practice questions`,
          category: CATEGORY,
          topic: topic,
          questions: quizQuestions,
          isPremium: isPremium
        });

        totalImported++;
        console.log(`      ✅ Imported ${questions.length} questions`);
      }
    }

    const total = await Quiz.countDocuments({ category: CATEGORY });
    console.log(`\n✅ Import completed! Total quizzes for ${CATEGORY}: ${total}`);
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

main();