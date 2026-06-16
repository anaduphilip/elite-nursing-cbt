const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');
const mammoth = require('mammoth');

// ========== CONFIGURATION ==========
const MONGODB_URI = 'mongodb://localhost:27017/quizapp';
const BASE_FOLDER = 'C:\\Users\\user\\Desktop\\questions\\midwifery';
const CATEGORY = 'midwifery';

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
  isPremium: Boolean          // will be set based on order
});

const Quiz = mongoose.model('Quiz', quizSchema);

// ========== Extract starting number from filename ==========
function getStartNumber(filename) {
  const match = filename.match(/Questions\s+(\d+)\s+to\s+\d+/i);
  if (match) return parseInt(match[1], 10);
  return Infinity; // fallback
}

// ========== Question Extraction (same as before) ==========
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

// ========== Recursive import with ordering and premium flag ==========
async function importFromFolder(folderPath) {
  if (!fs.existsSync(folderPath)) {
    console.log(`❌ Folder not found: ${folderPath}`);
    return;
  }

  const entries = fs.readdirSync(folderPath, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(folderPath, entry.name);
    if (entry.isDirectory()) {
      await importFromFolder(fullPath);
    } else if (entry.isFile() && entry.name.toLowerCase().endsWith('.docx')) {
      // Determine topic
      const relativePath = path.relative(BASE_FOLDER, fullPath);
      const pathParts = relativePath.split(path.sep);
      let topic = pathParts.length > 1 ? pathParts[0] : 'General';

      // We will collect all files in the same topic and folder level later.
      // But for now, we need to store them temporarily.
      // To handle ordering, we need to process after scanning all files.
      // We'll use a global map to accumulate all quizzes per topic.
      // Let's restructure: first collect all docx files, then process per topic.
      // Simpler: use a Map outside this function, but we'll refactor.
    }
  }
}

// Better approach: scan all files first, group by topic, then import.
async function main() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    // Delete existing quizzes for this category
    await Quiz.deleteMany({ category: CATEGORY });
    console.log(`🗑️ Deleted existing quizzes for category: ${CATEGORY}\n`);

    // Collect all .docx files with their full path, topic, and start number
    const files = [];
    function walk(dir, currentTopic) {
      const items = fs.readdirSync(dir, { withFileTypes: true });
      for (const item of items) {
        const fullPath = path.join(dir, item.name);
        if (item.isDirectory()) {
          walk(fullPath, item.name);
        } else if (item.isFile() && item.name.toLowerCase().endsWith('.docx')) {
          let topic = currentTopic;
          // If no topic (directly under BASE_FOLDER), set to 'General'
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

    // For each topic, sort by startNum and import
    for (const [topic, fileList] of grouped.entries()) {
      // Sort ascending by start number
      fileList.sort((a, b) => a.startNum - b.startNum);
      console.log(`\n📁 Topic: ${topic} (${fileList.length} files)`);

      for (let idx = 0; idx < fileList.length; idx++) {
        const file = fileList[idx];
        const isPremium = idx !== 0; // first is free, others premium
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