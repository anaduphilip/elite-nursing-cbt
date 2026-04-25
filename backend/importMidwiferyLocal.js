const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');
const mammoth = require('mammoth');

// Use LOCAL MongoDB
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

async function importMidwifery() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to Local MongoDB');
    
    const midwiferyPath = 'C:\\Users\\user\\Desktop\\questions\\midwifery';
    
    if (!fs.existsSync(midwiferyPath)) {
      console.log(`Folder not found: ${midwiferyPath}`);
      console.log('Please create the folder and add your midwifery Word documents.');
      process.exit(1);
    }
    
    const files = fs.readdirSync(midwiferyPath);
    const docxFiles = files.filter(f => f.toLowerCase().endsWith('.docx'));
    
    console.log(`Found ${docxFiles.length} midwifery documents`);
    
    let totalImported = 0;
    
    for (const file of docxFiles) {
      const filePath = path.join(midwiferyPath, file);
      let title = file.replace(/\.docx$/i, '');
      title = title.replace(/^\d+-\d+\s*/i, '');
      title = title.replace(/^RICHARD\s*/i, '');
      title = title.trim();
      
      console.log(`Processing: ${title}`);
      const questions = await extractQuestions(filePath);
      
      if (questions.length > 0) {
        const existing = await Quiz.findOne({ title: title, category: 'midwifery' });
        if (!existing) {
          const quizQuestions = questions.map(q => ({
            questionText: q.text,
            options: q.options,
            correctAnswer: q.correctAnswer,
            points: 1
          }));
          
          const quiz = new Quiz({
            title: title,
            description: `${title} - ${questions.length} practice questions for midwifery`,
            category: 'midwifery',
            questions: quizQuestions,
            isPremium: false
          });
          
          await quiz.save();
          totalImported++;
          console.log(`  ✅ Imported ${questions.length} questions`);
        } else {
          console.log(`  ⏭️ Skipping (already exists)`);
        }
      } else {
        console.log(`  ⚠️ No questions found in ${title}`);
      }
    }
    
    const count = await Quiz.countDocuments({ category: 'midwifery' });
    console.log(`\n✅ Import completed! Total midwifery quizzes: ${count}`);
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

importMidwifery();