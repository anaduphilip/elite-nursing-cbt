const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');
const mammoth = require('mammoth');

// ========== CONFIGURATION – CHANGE FOR EACH CATEGORY ==========
const MONGODB_URI = 'mongodb://localhost:27017/quizapp';
const BASE_FOLDER = 'C:\\Users\\user\\Desktop\\questions\\midwifery';
const CATEGORY = 'midwifery';
// =============================================================

// Mongoose Schema (must match your existing schema)
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

// Extract starting number from filename (e.g., "Questions 1 to 20" -> 1)
function getStartNumber(filename) {
  const match = filename.match(/Questions\s+(\d+)\s+to\s+\d+/i);
  if (match) return parseInt(match[1], 10);
  return Infinity;
}

// Extract questions from a .docx file (same as before)
async function extractQuestionsFromDocx(filePath) {
  const result = await mammoth.extractRawText({ path: filePath });
  const text = result.value;
  const questions = [];
  const answers = {};
  const lines = text.split('\n');

  let inAnswerKey = false;
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (line.match(/^ANSWER\s+KEY/i)) {
      inAnswerKey = true;
      continue;
    }
    if (inAnswerKey) {
      const match = line.match(/^Q(\d+)\.\s*([A-Da-d])/i);
      if (match) {
        const qNum = parseInt(match[1]);
        const answer = match[2].toUpperCase();
        answers[qNum] = answer;
      }
    }
  }
  // Fallback if no ANSWER KEY section
  if (Object.keys(answers).length === 0) {
    for (let i = lines.length - 1; i >= 0; i--) {
      const line = lines[i].trim();
      const match = line.match(/^Q(\d+)\.\s*([A-Da-d])/i);
      if (match) {
        const qNum = parseInt(match[1]);
        const answer = match[2].toUpperCase();
        answers[qNum] = answer;
      } else if (line.length > 0 && !match) break;
    }
  }

  let currentQuestion = null;
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    const qMatch = line.match(/^\*?Q(\d+)\.\s*(.*)/i);
    if (qMatch) {
      if (currentQuestion && currentQuestion.options.length === 4 && currentQuestion.number) {
        if (answers[currentQuestion.number]) {
          currentQuestion.correctAnswer = answers[currentQuestion.number].charCodeAt(0) - 65;
          questions.push(currentQuestion);
        }
      }
      const qNum = parseInt(qMatch[1]);
      const rest = qMatch[2];
      const optionPattern = /\(([a-d])\)\s*([^(]+?)(?=\s*\([a-d]\)|$)/gi;
      const options = [];
      let optMatch;
      while ((optMatch = optionPattern.exec(rest)) !== null) {
        options.push(optMatch[2].trim());
      }
      let questionText = rest.replace(/\s*\([a-d]\)[^(]*/g, '').trim();
      currentQuestion = {
        number: qNum,
        text: questionText,
        options: options,
        correctAnswer: null
      };
    } else if (currentQuestion && line && !line.match(/^\([a-d]\)/i) && !line.match(/^Q\d+\./i)) {
      currentQuestion.text += ' ' + line;
    }
  }
  if (currentQuestion && currentQuestion.options.length === 4 && currentQuestion.number) {
    if (answers[currentQuestion.number]) {
      currentQuestion.correctAnswer = answers[currentQuestion.number].charCodeAt(0) - 65;
      questions.push(currentQuestion);
    }
  }
  return questions.filter(q => q.correctAnswer !== null && q.options.length === 4);
}

async function addQuizzes() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    // Collect all .docx files recursively, ignoring temporary ~$ files
    const files = [];
    function walk(dir, currentTopic) {
      const items = fs.readdirSync(dir, { withFileTypes: true });
      for (const item of items) {
        const fullPath = path.join(dir, item.name);
        if (item.isDirectory()) {
          walk(fullPath, item.name);
        } else if (item.isFile() && item.name.toLowerCase().endsWith('.docx') && !item.name.startsWith('~$')) {
          let topic = currentTopic;
          if (!topic) topic = 'General';
          const startNum = getStartNumber(item.name);
          files.push({ fullPath, topic, filename: item.name, startNum });
        }
      }
    }
    walk(BASE_FOLDER, null);

    // Group by topic
    const grouped = new Map();
    for (const file of files) {
      if (!grouped.has(file.topic)) grouped.set(file.topic, []);
      grouped.get(file.topic).push(file);
    }

    let addedCount = 0;
    let skippedCount = 0;

    for (const [topic, fileList] of grouped.entries()) {
      // Sort new files by start number
      fileList.sort((a, b) => a.startNum - b.startNum);

      // Fetch existing quizzes for this topic (only titles and isPremium)
      const existingQuizzes = await Quiz.find({ category: CATEGORY, topic: topic }).select('title isPremium startNum');
      // We need to know if any existing quiz exists – we'll also compute max start number
      let existingMaxStart = -1;
      const existingTitles = new Set();
      for (const q of existingQuizzes) {
        existingTitles.add(q.title);
        const start = getStartNumber(q.title);
        if (start !== Infinity && start > existingMaxStart) existingMaxStart = start;
      }
      const hasExisting = existingQuizzes.length > 0;

      console.log(`\n📁 Topic: ${topic} – ${existingQuizzes.length} existing quizzes.`);

      // Determine which new files to add (skip if title already exists)
      const newFiles = fileList.filter(f => !existingTitles.has(f.filename.replace(/\.docx$/i, '')));
      if (newFiles.length === 0) {
        console.log(`   No new files to add for this topic.`);
        continue;
      }

      // If there are existing quizzes, all new quizzes become premium.
      // If the topic is empty, the first new quiz becomes free, the rest premium.
      for (let idx = 0; idx < newFiles.length; idx++) {
        const file = newFiles[idx];
        const title = file.filename.replace(/\.docx$/i, '');
        const isPremium = hasExisting || idx > 0; // existing exist OR not the first new file → premium

        console.log(`   📖 Adding: ${title} (${isPremium ? 'Premium' : 'Free'})`);

        // Optional: Warn if the new file's start number is lower than existing max
        if (hasExisting && file.startNum <= existingMaxStart) {
          console.warn(`      ⚠️ Warning: "${title}" has start number ${file.startNum}, but existing quizzes go up to ${existingMaxStart}. This may break the intended order.`);
        }

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
        addedCount++;
        console.log(`      ✅ Added ${questions.length} questions`);
      }
    }

    console.log(`\n✅ Import completed!`);
    console.log(`   📊 Added: ${addedCount} new quizzes`);
    console.log(`   ⏭️ Skipped (already exist): ${skippedCount}`);
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

addQuizzes();