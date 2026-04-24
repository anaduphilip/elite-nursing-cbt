const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');
const mammoth = require('mammoth');

// MongoDB Atlas connection
const MONGODB_URI = 'mongodb+srv://anaduphilip090_db_user:vpPyvn5OLz9QRrlc@cluster0.jrviuka.mongodb.net/quizzapp?retryWrites=true&w=majority';

// Quiz Schema
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

// Function to extract questions from Word document
async function extractQuestions(filePath) {
  const result = await mammoth.extractRawText({ path: filePath });
  const text = result.value;
  const questions = [];
  const lines = text.split('\n');
  
  let currentQuestion = null;
  let answers = {};
  
  for (const line of lines) {
    const trimmed = line.trim();
    
    // Match question like Q1., Q2.
    const qMatch = trimmed.match(/^Q(\d+)\./i);
    if (qMatch) {
      if (currentQuestion && currentQuestion.options.length === 4) {
        questions.push(currentQuestion);
      }
      const qNum = parseInt(qMatch[1]);
      const questionText = trimmed.replace(/^Q\d+\.\s*/i, '').trim();
      currentQuestion = { number: qNum, text: questionText, options: [], correctAnswer: null };
    }
    // Match options (a), (b), (c), (d)
    else if (currentQuestion && trimmed.match(/^\([a-d]\)/i)) {
      const optMatch = trimmed.match(/^\([a-d]\)\s*(.*)/i);
      if (optMatch) {
        currentQuestion.options.push(optMatch[1].trim());
      }
    }
    // Match answer key at the end
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
  
  // Assign correct answers
  for (const q of questions) {
    if (answers[q.number]) {
      q.correctAnswer = answers[q.number].charCodeAt(0) - 65;
    }
  }
  
  return questions.filter(q => q.correctAnswer !== null);
}

async function importAllQuizzes() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB Atlas');
    
    // Clear existing quizzes (optional - comment out if you want to keep existing)
    // await Quiz.deleteMany({});
    // console.log('Cleared existing quizzes');
    
    const questionsFolder = 'C:\\Users\\user\\Desktop\\SET OF RICHARD QUESTIONS';
    const files = fs.readdirSync(questionsFolder);
    const docxFiles = files.filter(f => f.toLowerCase().endsWith('.docx'));
    
    console.log(`Found ${docxFiles.length} Word documents`);
    
    for (const file of docxFiles) {
      const filePath = path.join(questionsFolder, file);
      let subjectName = file.replace(/\.docx$/i, '');
      subjectName = subjectName.replace(/^\d+-\d+\s*/i, '');
      subjectName = subjectName.replace(/^RICHARD\s*/i, '');
      subjectName = subjectName.replace(/\s*\(RICHARD\)\s*$/i, '');
      subjectName = subjectName.trim();
      
      console.log(`Processing: ${subjectName}`);
      const questions = await extractQuestions(filePath);
      
      if (questions.length > 0) {
        const quizQuestions = questions.map(q => ({
          questionText: q.text,
          options: q.options,
          correctAnswer: q.correctAnswer,
          points: 1
        }));
        
        const quiz = new Quiz({
          title: subjectName,
          description: `${subjectName} - ${questions.length} practice questions`,
          questions: quizQuestions,
          isPremium: false
        });
        
        await quiz.save();
        console.log(`  ✅ Imported ${questions.length} questions for ${subjectName}`);
      } else {
        console.log(`  ⚠️ No questions found in ${subjectName}`);
      }
    }
    
    const count = await Quiz.countDocuments();
    console.log(`\n✅ Import completed! Total quizzes: ${count}`);
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

importAllQuizzes();