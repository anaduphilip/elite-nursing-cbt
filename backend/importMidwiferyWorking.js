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
  const lines = text.split('\n');
  
  for (const line of lines) {
    const trimmed = line.trim();
    
    // Look for lines starting with Q1., Q2., etc.
    const qMatch = trimmed.match(/^Q(\d+)\.\s*(.*)/i);
    if (qMatch) {
      const fullText = qMatch[2];
      
      // Extract options using regex
      const options = [];
      const optionPattern = /\(([a-d])\)\s*([^(]+?)(?=\s*\([a-d]\)|$)/gi;
      let match;
      
      // Create a copy to extract options
      let tempText = fullText;
      while ((match = optionPattern.exec(tempText)) !== null) {
        options.push(match[2].trim());
      }
      
      // Clean question text (remove options)
      let questionText = fullText;
      questionText = questionText.replace(/\s*\(a\)[^\(]*/, '');
      questionText = questionText.replace(/\s*\(b\)[^\(]*/, '');
      questionText = questionText.replace(/\s*\(c\)[^\(]*/, '');
      questionText = questionText.replace(/\s*\(d\)[^\(]*/, '');
      questionText = questionText.trim();
      
      if (options.length === 4 && questionText) {
        questions.push({
          text: questionText,
          options: options,
          correctAnswer: 0 // Default, since no answer key. User will need to know correct answers.
        });
      }
    }
  }
  
  return questions;
}

async function importMidwifery() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to Local MongoDB');
    
    const midwiferyPath = 'C:\\Users\\user\\Desktop\\questions\\midwifery';
    
    if (!fs.existsSync(midwiferyPath)) {
      console.log(`Folder not found: ${midwiferyPath}`);
      process.exit(1);
    }
    
    const files = fs.readdirSync(midwiferyPath);
    const docxFiles = files.filter(f => f.toLowerCase().endsWith('.docx'));
    
    console.log(`Found ${docxFiles.length} midwifery documents`);
    
    let totalQuestions = 0;
    
    for (const file of docxFiles) {
      const filePath = path.join(midwiferyPath, file);
      let title = file.replace(/\.docx$/i, '');
      title = title.replace(/\s*\(RICHARD\)\s*$/i, '');
      title = title.trim();
      
      console.log(`\nProcessing: ${title}`);
      const questions = await extractQuestions(filePath);
      
      if (questions.length > 0) {
        const existing = await Quiz.findOne({ title: title, category: 'midwifery' });
        if (!existing) {
          const quiz = new Quiz({
            title: title,
            description: `${title} - ${questions.length} practice questions for midwifery`,
            category: 'midwifery',
            questions: questions,
            isPremium: false
          });
          
          await quiz.save();
          totalQuestions += questions.length;
          console.log(`  ✅ Imported ${questions.length} questions`);
        } else {
          console.log(`  ⏭️ Skipping (already exists)`);
        }
      } else {
        console.log(`  ⚠️ No questions found`);
      }
    }
    
    const count = await Quiz.countDocuments({ category: 'midwifery' });
    console.log(`\n✅ Import completed! Total midwifery quizzes: ${count}`);
    console.log(`✅ Total questions imported: ${totalQuestions}`);
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

importMidwifery();