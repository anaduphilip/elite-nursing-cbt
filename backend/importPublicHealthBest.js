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

async function extractQuestionsAndAnswers(filePath) {
  const result = await mammoth.extractRawText({ path: filePath });
  const text = result.value;
  
  // Extract ALL answers from the entire text
  const answers = {};
  const answerPattern = /Q(\d+)[\.\s:]*\s*([a-d])/gi;
  let match;
  while ((match = answerPattern.exec(text)) !== null) {
    const qNum = parseInt(match[1]);
    const answer = match[2].toUpperCase();
    answers[qNum] = answer;
  }
  
  // Extract all questions
  const questions = [];
  // Split by Q number pattern
  const questionBlocks = text.split(/Q(\d+)\./);
  
  for (let i = 1; i < questionBlocks.length; i += 2) {
    const qNum = parseInt(questionBlocks[i]);
    let fullText = questionBlocks[i + 1]?.trim() || '';
    
    // Stop when we hit the answer key section
    if (fullText.toLowerCase().includes('answer key')) break;
    
    // Extract options
    const options = [];
    const optPattern = /\(([a-d])\)\s*([^(]+?)(?=\s*\([a-d]\)|$)/gi;
    let optMatch;
    while ((optMatch = optPattern.exec(fullText)) !== null) {
      options.push(optMatch[2].trim());
    }
    
    // Clean question text
    let questionText = fullText;
    questionText = questionText.replace(/\s*\(a\)[^\(]*/, '');
    questionText = questionText.replace(/\s*\(b\)[^\(]*/, '');
    questionText = questionText.replace(/\s*\(c\)[^\(]*/, '');
    questionText = questionText.replace(/\s*\(d\)[^\(]*/, '');
    questionText = questionText.trim();
    questionText = questionText.replace(/\\/g, '');
    questionText = questionText.replace(/\s+/g, ' ').trim();
    
    if (options.length === 4 && answers[qNum] && questionText) {
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

async function importPublicHealth() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to Local MongoDB\n');
    
    const publicHealthPath = 'C:\\Users\\user\\Desktop\\questions\\public-health';
    
    if (!fs.existsSync(publicHealthPath)) {
      console.log(`❌ Folder not found: ${publicHealthPath}`);
      process.exit(1);
    }
    
    const files = fs.readdirSync(publicHealthPath);
    const docxFiles = files.filter(f => f.toLowerCase().endsWith('.docx'));
    
    console.log(`📁 Found ${docxFiles.length} Word documents\n`);
    
    let totalQuestionsAll = 0;
    
    for (const file of docxFiles) {
      const filePath = path.join(publicHealthPath, file);
      const title = getTitleFromFilename(file);
      
      console.log(`📖 Processing: ${title}`);
      const questions = await extractQuestionsAndAnswers(filePath);
      
      console.log(`   Extracted ${questions.length} questions (expected 250)`);
      
      if (questions.length > 0) {
        const quizQuestions = questions.map(q => ({
          questionText: q.text,
          options: q.options,
          correctAnswer: q.correctAnswer,
          points: 1
        }));
        
        await Quiz.deleteOne({ title: title, category: 'public-health' });
        
        const quiz = new Quiz({
          title: title,
          description: `${title} - ${questions.length} practice questions for public health`,
          category: 'public-health',
          questions: quizQuestions,
          isPremium: false
        });
        
        await quiz.save();
        totalQuestionsAll += questions.length;
        console.log(`   ✅ Saved ${questions.length} questions`);
      } else {
        console.log(`   ⚠️ No questions extracted`);
      }
      console.log('');
    }
    
    const quizCount = await Quiz.countDocuments({ category: 'public-health' });
    console.log(`✅ PUBLIC HEALTH IMPORT COMPLETED!`);
    console.log(`   📊 Quizzes: ${quizCount}`);
    console.log(`   📝 Total questions: ${totalQuestionsAll}`);
    console.log(`   🎯 Expected: 20 × 250 = 5,000 questions`);
    
    if (totalQuestionsAll < 5000) {
      console.log(`   ⚠️ Missing: ${5000 - totalQuestionsAll} questions`);
    }
    
    console.log(`\n💡 Next step: Run 'node syncToAtlas.js' to update your live app`);
    
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

importPublicHealth();