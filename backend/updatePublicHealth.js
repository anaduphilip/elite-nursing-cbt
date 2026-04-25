const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');
const mammoth = require('mammoth');

const MONGODB_URI = 'mongodb://localhost:27017/quizapp';

const quizSchema = new mongoose.Schema({
  title: String,
  description: String,
  category: String,
  questions: [{
    questionText: String,
    options: [String],
    correctAnswer: Number,
    points: Number
  }],
  isPremium: Boolean
});

const Quiz = mongoose.model('Quiz', quizSchema);

async function extractQuestions(filePath) {
  const result = await mammoth.extractRawText({ path: filePath });
  const text = result.value;
  const questions = [];
  const answers = {};
  
  // Extract all answers (handles both Q1: a and Q1. a formats)
  const answerPattern = /Q(\d+)[\.\s:]*\s*([a-d])/gi;
  let match;
  while ((match = answerPattern.exec(text)) !== null) {
    const qNum = parseInt(match[1]);
    const answer = match[2].toUpperCase();
    answers[qNum] = answer;
  }
  
  // Extract questions - look for Q1., Q2., etc. up to Q250
  // The questions are in a continuous block
  const questionPattern = /Q(\d+)\.\s*([^Q]+?)(?=Q\d+\.|$)/gi;
  let qMatch;
  while ((qMatch = questionPattern.exec(text)) !== null) {
    const qNum = parseInt(qMatch[1]);
    let fullText = qMatch[2].trim();
    
    // Extract options from the question text
    const options = [];
    const optPattern = /\(([a-d])\)\s*([^(]+?)(?=\s*\([a-d]\)|$)/gi;
    let optMatch;
    while ((optMatch = optPattern.exec(fullText)) !== null) {
      options.push(optMatch[2].trim());
    }
    
    // Clean question text by removing options
    let questionText = fullText;
    questionText = questionText.replace(/\s*\(a\)[^\(]*/, '');
    questionText = questionText.replace(/\s*\(b\)[^\(]*/, '');
    questionText = questionText.replace(/\s*\(c\)[^\(]*/, '');
    questionText = questionText.replace(/\s*\(d\)[^\(]*/, '');
    questionText = questionText.trim();
    
    // Only add if we have 4 options and an answer
    if (options.length === 4 && answers[qNum]) {
      questions.push({
        number: qNum,
        text: questionText,
        options: options,
        correctAnswer: answers[qNum].charCodeAt(0) - 65
      });
    }
  }
  
  return questions;
}

function getTitleFromFilename(filename) {
  let title = filename.replace(/\.docx$/i, '');
  title = title.replace(/^Batch_\d+_/i, '');
  title = title.replace(/_/g, ' ');
  title = title.trim();
  return title;
}

async function updatePublicHealthQuizzes() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to Local MongoDB\n');
    
    const publicHealthPath = 'C:\\Users\\user\\Desktop\\questions\\public-health';
    
    if (!fs.existsSync(publicHealthPath)) {
      console.log(`❌ Folder not found: ${publicHealthPath}`);
      process.exit(1);
    }
    
    const items = fs.readdirSync(publicHealthPath);
    const docxFiles = [];
    for (const item of items) {
      const fullPath = path.join(publicHealthPath, item);
      const stat = fs.statSync(fullPath);
      if (stat.isFile() && item.toLowerCase().endsWith('.docx')) {
        docxFiles.push(fullPath);
      }
    }
    
    console.log(`📁 Found ${docxFiles.length} Word documents in public-health folder\n`);
    console.log('🔄 Importing Public Health quizzes (each should have 250 questions)...\n');
    
    let totalImported = 0;
    let totalQuestions = 0;
    
    for (const filePath of docxFiles) {
      const fileName = path.basename(filePath);
      let title = getTitleFromFilename(fileName);
      
      console.log(`📖 Processing: ${title}`);
      const questions = await extractQuestions(filePath);
      
      console.log(`   Extracted ${questions.length} questions (expected 250)`);
      
      if (questions.length > 0) {
        const quizQuestions = questions.map(q => ({
          questionText: q.text,
          options: q.options,
          correctAnswer: q.correctAnswer,
          points: 1
        }));
        
        // Delete existing quiz first to replace completely
        await Quiz.deleteOne({ title: title, category: 'public-health' });
        
        const newQuiz = new Quiz({
          title: title,
          description: `${title} - ${questions.length} practice questions for public health`,
          category: 'public-health',
          questions: quizQuestions,
          isPremium: false
        });
        await newQuiz.save();
        
        totalImported++;
        totalQuestions += questions.length;
        console.log(`   ✅ Imported ${questions.length} questions`);
      } else {
        console.log(`   ⚠️ No questions found in ${title}`);
      }
    }
    
    console.log(`\n✅ PUBLIC HEALTH IMPORT COMPLETED!`);
    console.log(`   📊 Imported ${totalImported} quizzes`);
    console.log(`   📝 Total questions: ${totalQuestions}`);
    console.log(`   💡 Expected: 20 × 250 = 5,000 questions`);
    
    if (totalQuestions < 5000) {
      console.log(`   ⚠️ Note: Only ${totalQuestions} questions were extracted.`);
      console.log(`      Some questions may have formatting issues.`);
    }
    
    console.log(`\n💡 Next step: Run 'node syncToAtlas.js' to update your live app`);
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

updatePublicHealthQuizzes();