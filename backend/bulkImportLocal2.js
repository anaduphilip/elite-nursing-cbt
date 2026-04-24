const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');
const mammoth = require('mammoth');

const MONGODB_URI = 'mongodb://localhost:27017/quizapp';

const quizSchema = new mongoose.Schema({
  title: String,
  description: String,
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
  const lines = text.split('\n');
  
  let currentQuestion = null;
  let answers = {};
  
  for (const line of lines) {
    const trimmed = line.trim();
    
    const qMatch = trimmed.match(/^Q(\d+)\./i);
    if (qMatch) {
      if (currentQuestion && currentQuestion.options.length === 4) {
        questions.push(currentQuestion);
      }
      const qNum = parseInt(qMatch[1]);
      const questionText = trimmed.replace(/^Q\d+\.\s*/i, '').trim();
      currentQuestion = { number: qNum, text: questionText, options: [], correctAnswer: null };
    }
    else if (currentQuestion && trimmed.match(/^\([a-d]\)/i)) {
      const optMatch = trimmed.match(/^\([a-d]\)\s*(.*)/i);
      if (optMatch) {
        currentQuestion.options.push(optMatch[1].trim());
      }
    }
    else if (trimmed.match(/^Q\d+\.\s*[A-D]/i)) {
      const ansMatch = trimmed.match(/^Q(\d+)\.\s*([A-D])/i);
      if (ansMatch) {
        answers[parseInt(ansMatch[1])] = ansMatch[2];
      }
    }
  }
  
  if (currentQuestion && currentQuestion.options.length === 4) {
    questions.push(currentQuestion);
  }
  
  for (const q of questions) {
    if (answers[q.number]) {
      q.correctAnswer = answers[q.number].charCodeAt(0) - 65;
    }
  }
  
  return questions.filter(q => q.correctAnswer !== null);
}

function getAllDocxFiles(dir) {
  let results = [];
  const items = fs.readdirSync(dir);
  
  for (const item of items) {
    const fullPath = path.join(dir, item);
    const stat = fs.statSync(fullPath);
    
    if (stat.isDirectory()) {
      results = results.concat(getAllDocxFiles(fullPath));
    } else if (item.toLowerCase().endsWith('.docx')) {
      results.push(fullPath);
    }
  }
  return results;
}

async function importAllQuizzes() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to Local MongoDB');
    
    const questionsFolder = 'C:\\Users\\user\\Desktop\\questions';
    const docxFiles = getAllDocxFiles(questionsFolder);
    
    console.log(`Found ${docxFiles.length} Word documents`);
    
    let totalImported = 0;
    
    for (const filePath of docxFiles) {
      const folderName = path.basename(path.dirname(filePath));
      let subjectName = folderName.replace(/^RICHARD\s*/i, '');
      subjectName = subjectName.replace(/\s*\(RICHARD\)\s*$/i, '');
      subjectName = subjectName.trim();
      
      console.log(`Processing: ${subjectName}`);
      const questions = await extractQuestions(filePath);
      
      if (questions.length > 0) {
        const existing = await Quiz.findOne({ title: subjectName });
        if (!existing) {
          const quizQuestions = questions.map(q => ({
            questionText: q.text,
            options: q.options,
            correctAnswer: q.correctAnswer,
            points: 1
          }));
          
          const quiz = new Quiz({
            title: subjectName,
            description: `${subjectName} - ${questions.length} practice questions for nursing exams`,
            questions: quizQuestions,
            isPremium: false
          });
          
          await quiz.save();
          totalImported++;
          console.log(`  ✅ Imported ${questions.length} questions`);
        } else {
          console.log(`  ⏭️ Skipping ${subjectName} (already exists)`);
        }
      } else {
        console.log(`  ⚠️ No questions found in ${subjectName}`);
      }
    }
    
    const count = await Quiz.countDocuments();
    console.log(`\n✅ Import completed! Imported ${totalImported} new quizzes. Total quizzes now: ${count}`);
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

importAllQuizzes();