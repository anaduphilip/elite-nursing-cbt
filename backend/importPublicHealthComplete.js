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

async function extractAllQuestions(filePath) {
  const result = await mammoth.extractRawText({ path: filePath });
  const text = result.value;
  const questions = [];
  
  // Extract ALL answers first
  const answers = {};
  const answerPattern = /Q(\d+)[\.\s:]*\s*([a-d])/gi;
  let match;
  while ((match = answerPattern.exec(text)) !== null) {
    const qNum = parseInt(match[1]);
    const answer = match[2].toUpperCase();
    answers[qNum] = answer;
  }
  
  // Split by question numbers (handles any Q number)
  // Use a more flexible pattern
  const questionPattern = /Q(\d+)\.\s*([^Q]+?)(?=Q\d+\.|ANSWER KEY|$)/gi;
  let qMatch;
  while ((qMatch = questionPattern.exec(text)) !== null) {
    const qNum = parseInt(qMatch[1]);
    let fullText = qMatch[2].trim();
    
    // Skip if we've hit the answer key section
    if (fullText.toLowerCase().startsWith('answer key')) continue;
    
    // Extract options - handle both formats: (a) text (b) text OR a. text b. text
    const options = [];
    
    // Try standard format (a) text (b) text
    let optPattern = /\(([a-d])\)\s*([^(]+?)(?=\s*\([a-d]\)|$)/gi;
    let optMatch;
    while ((optMatch = optPattern.exec(fullText)) !== null) {
      options.push(optMatch[2].trim());
    }
    
    // If standard format didn't work, try alternate format: a. text b. text
    if (options.length !== 4) {
      options.length = 0;
      optPattern = /([a-d])\.\s*([^a-d]+?)(?=\s*[a-d]\.|$)/gi;
      while ((optMatch = optPattern.exec(fullText)) !== null) {
        options.push(optMatch[2].trim());
      }
    }
    
    // Clean question text
    let questionText = fullText;
    questionText = questionText.replace(/\s*\(a\)[^\(]*/, '');
    questionText = questionText.replace(/\s*\(b\)[^\(]*/, '');
    questionText = questionText.replace(/\s*\(c\)[^\(]*/, '');
    questionText = questionText.replace(/\s*\(d\)[^\(]*/, '');
    questionText = questionText.replace(/\s*a\.[^a-zA-Z]*/, '');
    questionText = questionText.replace(/\s*b\.[^a-zA-Z]*/, '');
    questionText = questionText.replace(/\s*c\.[^a-zA-Z]*/, '');
    questionText = questionText.replace(/\s*d\.[^a-zA-Z]*/, '');
    questionText = questionText.trim();
    
    // Clean up any leftover artifacts
    questionText = questionText.replace(/\\/g, '');
    questionText = questionText.replace(/\s+/g, ' ').trim();
    
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

async function importAllPublicHealth() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to Local MongoDB\n');
    
    const publicHealthPath = 'C:\\Users\\user\\Desktop\\questions\\public-health';
    
    if (!fs.existsSync(publicHealthPath)) {
      console.log(`❌ Folder not found: ${publicHealthPath}`);
      process.exit(1);
    }
    
    const files = fs.readdirSync(publicHealthPath);
    const docxFiles = files.filter(f => f.toLowerCase().endsWith('.docx')).sort();
    
    console.log(`📁 Found ${docxFiles.length} Word documents\n`);
    
    let totalQuestionsAll = 0;
    
    for (const file of docxFiles) {
      const filePath = path.join(publicHealthPath, file);
      const title = getTitleFromFilename(file);
      
      console.log(`📖 Processing: ${title}`);
      const questions = await extractAllQuestions(filePath);
      
      console.log(`   Extracted ${questions.length} questions`);
      
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
        console.log(`   ✅ Saved ${questions.length} questions\n`);
      } else {
        console.log(`   ⚠️ No questions extracted\n`);
      }
    }
    
    const quizCount = await Quiz.countDocuments({ category: 'public-health' });
    console.log(`✅ PUBLIC HEALTH IMPORT COMPLETED!`);
    console.log(`   📊 Quizzes: ${quizCount}`);
    console.log(`   📝 Total questions: ${totalQuestionsAll}`);
    console.log(`   🎯 Target: 5,000 questions`);
    
    if (totalQuestionsAll < 5000) {
      console.log(`   ⚠️ Missing: ${5000 - totalQuestionsAll} questions`);
      console.log(`   💡 The missing questions likely have formatting issues.`);
      console.log(`   They can be added manually later via MongoDB Compass.`);
    }
    
    console.log(`\n💡 Next step: Run 'node syncToAtlas.js' to update your live app`);
    
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

importAllPublicHealth();