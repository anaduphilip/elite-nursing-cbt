const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');
const mammoth = require('mammoth');

mongoose.connect('mongodb://localhost:27017/quizapp');

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

async function importFromWordDoc(filePath, subjectName) {
  console.log(`\n📖 Reading: ${subjectName}`);
  
  try {
    const result = await mammoth.extractRawText({ path: filePath });
    const text = result.value;
    
    const lines = text.split('\n');
    const questions = [];
    let currentQuestion = null;
    let answers = {};
    
    for (let i = 0; i < lines.length; i++) {
      let line = lines[i].trim();
      
      const qMatch = line.match(/^Q(\d+)\./i);
      if (qMatch) {
        if (currentQuestion && currentQuestion.options.length === 4) {
          questions.push(currentQuestion);
        }
        
        const qNum = parseInt(qMatch[1]);
        const questionText = line.replace(/^Q\d+\.\s*/i, '').trim();
        
        currentQuestion = {
          number: qNum,
          text: questionText,
          options: [],
          correctAnswer: null
        };
      }
      else if (currentQuestion && line.match(/^\([a-d]\)/i)) {
        const optMatch = line.match(/^\([a-d]\)\s*(.*)/i);
        if (optMatch) {
          currentQuestion.options.push(optMatch[1].trim());
        }
      }
      else if (line.match(/^Q\d+\.\s*[A-D]/i)) {
        const ansMatch = line.match(/^Q(\d+)\.\s*([A-D])/i);
        if (ansMatch) {
          const qNum = parseInt(ansMatch[1]);
          const answer = ansMatch[2];
          answers[qNum] = answer;
        }
      }
    }
    
    if (currentQuestion && currentQuestion.options.length === 4) {
      questions.push(currentQuestion);
    }
    
    for (let q of questions) {
      if (answers[q.number]) {
        const answerLetter = answers[q.number];
        q.correctAnswer = answerLetter.charCodeAt(0) - 65;
      }
    }
    
    const validQuestions = questions.filter(q => q.options.length === 4 && q.correctAnswer !== null);
    
    console.log(`   Found ${validQuestions.length} valid questions`);
    
    if (validQuestions.length === 0) {
      console.log(`   ⚠️ No questions parsed.`);
      return;
    }
    
    const quizQuestions = validQuestions.map(q => ({
      questionText: q.text,
      options: q.options,
      correctAnswer: q.correctAnswer,
      points: 1
    }));
    
    const quiz = new Quiz({
      title: subjectName,
      description: `${subjectName} - ${validQuestions.length} practice questions`,
      questions: quizQuestions,
      isPremium: false
    });
    
    await quiz.save();
    console.log(`   ✅ Created quiz with ${validQuestions.length} questions`);
    
  } catch (error) {
    console.log(`   ❌ Error: ${error.message}`);
  }
}

async function importAll() {
  try {
    console.log('🚀 Starting import...\n');
    
    const questionsFolder = 'C:\\Users\\user\\Desktop\\questions';
    const files = fs.readdirSync(questionsFolder);
    const docxFiles = files.filter(f => f.toLowerCase().endsWith('.docx'));
    
    console.log(`📁 Found ${docxFiles.length} Word documents\n`);
    
    await Quiz.deleteMany({});
    console.log('🗑️ Cleared existing quizzes\n');
    
    for (const file of docxFiles) {
      const fullPath = path.join(questionsFolder, file);
      let subjectName = file.replace(/\.docx$/i, '');
      subjectName = subjectName.replace(/^1-\d+\s*/i, '');
      subjectName = subjectName.replace(/^101-\d+\s*/i, '');
      subjectName = subjectName.replace(/^201-\d+\s*/i, '');
      subjectName = subjectName.replace(/^RICHARD\s*/i, '');
      subjectName = subjectName.replace(/\s*\(RICHARD\)\s*$/i, '');
      subjectName = subjectName.trim();
      
      await importFromWordDoc(fullPath, subjectName);
    }
    
    const totalQuizzes = await Quiz.countDocuments();
    console.log(`\n✅ IMPORT COMPLETED! Created ${totalQuizzes} quizzes`);
    process.exit(0);
    
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

importAll();