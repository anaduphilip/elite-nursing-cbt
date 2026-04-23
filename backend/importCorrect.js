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

function parseQuestionLine(line) {
  // Remove the Q#. prefix
  let text = line.replace(/^Q\d+\.\s*/, '');
  
  // Extract options using regex
  const optionPattern = /\(([a-d])\)\s*([^(]+?)(?=\s*\([a-d]\)|$)/gi;
  const options = [];
  let match;
  
  // Find all options
  while ((match = optionPattern.exec(text)) !== null) {
    options.push(match[2].trim());
  }
  
  // Remove the options part from question text
  let questionText = text;
  questionText = questionText.replace(/\s*\(a\)[^\(]*/, '');
  questionText = questionText.replace(/\s*\(b\)[^\(]*/, '');
  questionText = questionText.replace(/\s*\(c\)[^\(]*/, '');
  questionText = questionText.replace(/\s*\(d\)[^\(]*/, '');
  questionText = questionText.trim();
  
  return {
    text: questionText,
    options: options
  };
}

function parseAnswerKey(content) {
  const answers = {};
  // Look for patterns like "Q1. C" or "Q1. C" or "Q1 C"
  const lines = content.split('\n');
  for (const line of lines) {
    // Match patterns like: Q1. C, Q1. C, Q1 C
    const match = line.match(/Q(\d+)[\.\s]+([A-D])/i);
    if (match) {
      const qNum = parseInt(match[1]);
      const answer = match[2].toUpperCase();
      answers[qNum] = answer;
    }
  }
  return answers;
}

async function importFromWordDoc(filePath, subjectName) {
  console.log(`\n📖 Reading: ${subjectName}`);
  
  try {
    const result = await mammoth.extractRawText({ path: filePath });
    const text = result.value;
    
    const lines = text.split('\n');
    const questions = [];
    let answers = {};
    
    // First pass: extract questions
    for (const line of lines) {
      const trimmedLine = line.trim();
      if (trimmedLine.match(/^Q\d+\./i)) {
        const parsed = parseQuestionLine(trimmedLine);
        if (parsed.options.length === 4 && parsed.text) {
          questions.push({
            text: parsed.text,
            options: parsed.options,
            correctAnswer: null
          });
        }
      }
    }
    
    // Second pass: extract answer key (at the end of document)
    answers = parseAnswerKey(text);
    
    // Assign correct answers
    for (let i = 0; i < questions.length; i++) {
      const qNum = i + 1;
      if (answers[qNum]) {
        const answerLetter = answers[qNum];
        questions[i].correctAnswer = answerLetter.charCodeAt(0) - 65; // A=0, B=1, C=2, D=3
      }
    }
    
    // Filter questions that have answers
    const validQuestions = questions.filter(q => q.correctAnswer !== null);
    
    console.log(`   Found ${validQuestions.length} valid questions out of ${questions.length}`);
    
    if (validQuestions.length === 0) {
      console.log(`   ⚠️ No questions parsed.`);
      return;
    }
    
    // Convert to quiz format
    const quizQuestions = validQuestions.map(q => ({
      questionText: q.text,
      options: q.options,
      correctAnswer: q.correctAnswer,
      points: 1
    }));
    
    // Create quiz
    const quiz = new Quiz({
      title: subjectName,
      description: `${subjectName} - ${validQuestions.length} practice questions for nursing exams`,
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
    console.log('🚀 Starting import of nursing questions...\n');
    
    const questionsFolder = 'C:\\Users\\user\\Desktop\\questions';
    const files = fs.readdirSync(questionsFolder);
    const docxFiles = files.filter(f => f.toLowerCase().endsWith('.docx'));
    
    console.log(`📁 Found ${docxFiles.length} Word documents\n`);
    
    // Clear existing quizzes
    await Quiz.deleteMany({});
    console.log('🗑️ Cleared existing quizzes\n');
    
    let totalQuestions = 0;
    
    for (const file of docxFiles) {
      const fullPath = path.join(questionsFolder, file);
      // Clean up subject name
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