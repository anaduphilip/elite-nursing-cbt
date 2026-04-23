const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');
const mammoth = require('mammoth');

mongoose.connect('mongodb://localhost:27017/quizapp');

// Schemas
const SubjectSchema = new mongoose.Schema({
  name: String,
  description: String,
  totalQuestions: Number,
  isPremium: { type: Boolean, default: false }
});

const QuestionSchema = new mongoose.Schema({
  subjectId: mongoose.Schema.Types.ObjectId,
  text: String,
  options: [String],
  correctAnswer: Number,
  explanation: String
});

const Subject = mongoose.model('Subject', SubjectSchema);
const Question = mongoose.model('Question', QuestionSchema);

// Function to extract questions from Word document text
function extractQuestionsAndAnswers(text) {
  const questions = [];
  
  // Split by Q1., Q2., etc.
  const lines = text.split('\n');
  let currentQuestion = null;
  
  for (let i = 0; i < lines.length; i++) {
    let line = lines[i].trim();
    
    // Check if line starts with Q number
    const qMatch = line.match(/^Q(\d+)\./i);
    if (qMatch) {
      // Save previous question
      if (currentQuestion && currentQuestion.options.length === 4) {
        questions.push(currentQuestion);
      }
      
      // Start new question
      currentQuestion = {
        number: parseInt(qMatch[1]),
        text: line.replace(/^Q\d+\.\s*/, '').trim(),
        options: [],
        correctAnswer: null
      };
    }
    // Check for options (a), (b), (c), (d)
    else if (currentQuestion && line.match(/^\([a-d]\)/i)) {
      const optionMatch = line.match(/^\([a-d]\)\s*(.*)/i);
      if (optionMatch) {
        currentQuestion.options.push(optionMatch[1].trim());
      }
    }
    // Check for answer key section
    else if (line.match(/^Q\d+\.\s*[A-D]/i)) {
      const answerMatch = line.match(/^Q(\d+)\.\s*([A-D])/i);
      if (answerMatch) {
        const qNum = parseInt(answerMatch[1]);
        const answer = answerMatch[2];
        // Find the question and add correct answer
        for (let q of questions) {
          if (q.number === qNum) {
            q.correctAnswer = answer.charCodeAt(0) - 65; // A=0, B=1, C=2, D=3
            break;
          }
        }
      }
    }
  }
  
  // Add last question
  if (currentQuestion && currentQuestion.options.length === 4) {
    questions.push(currentQuestion);
  }
  
  return questions.filter(q => q.options.length === 4 && q.correctAnswer !== null);
}

// Function to read and import a Word document
async function importWordDocument(filePath, subjectName) {
  console.log(`\n📖 Reading: ${subjectName}`);
  
  try {
    // Read the Word document
    const result = await mammoth.extractRawText({ path: filePath });
    const text = result.value;
    
    // Extract questions
    const questions = extractQuestionsAndAnswers(text);
    console.log(`   Found ${questions.length} questions`);
    
    if (questions.length === 0) {
      console.log(`   ⚠️ No questions found. Check the format.`);
      return;
    }
    
    // Find or create subject
    let subject = await Subject.findOne({ name: subjectName });
    if (!subject) {
      subject = new Subject({
        name: subjectName,
        description: `${subjectName} practice questions for nursing exams`,
        totalQuestions: questions.length,
        isPremium: false
      });
      await subject.save();
      console.log(`   ✅ Created subject: ${subjectName}`);
    } else {
      // Delete existing questions
      await Question.deleteMany({ subjectId: subject._id });
      console.log(`   🔄 Replacing existing questions`);
    }
    
    // Add questions to database
    let added = 0;
    for (const q of questions) {
      const question = new Question({
        subjectId: subject._id,
        text: q.text,
        options: q.options,
        correctAnswer: q.correctAnswer,
        explanation: `The correct answer is ${String.fromCharCode(65 + q.correctAnswer)}.`
      });
      await question.save();
      added++;
    }
    
    // Update subject question count
    subject.totalQuestions = added;
    await subject.save();
    
    console.log(`   ✅ Added ${added} questions to ${subjectName}`);
    
  } catch (error) {
    console.log(`   ❌ Error: ${error.message}`);
  }
}

// Main function to import all documents
async function importAllDocuments() {
  try {
    console.log('🚀 Starting import of all nursing questions...\n');
    
    // YOUR QUESTIONS FOLDER PATH
     const questionsFolder = 'C:\\Users\\user\\Desktop\\questions';
    
    // Check if folder exists
    if (!fs.existsSync(questionsFolder)) {
      console.log(`❌ Folder not found: ${questionsFolder}`);
      console.log(`   Please update the path to your questions folder.`);
      process.exit(1);
    }
    
    // Get all .doc and .docx files
    const files = fs.readdirSync(questionsFolder);
    const docFiles = files.filter(file => file.endsWith('.doc') || file.endsWith('.docx'));
    
    console.log(`📁 Found ${docFiles.length} Word documents\n`);
    
    for (const file of docFiles) {
      const fullPath = path.join(questionsFolder, file);
      // Extract subject name from filename (remove "RICHARD " prefix and extension)
      let subjectName = file.replace(/\.docx?$/, '');
      subjectName = subjectName.replace(/^RICHARD\s+/i, '');
      subjectName = subjectName.replace(/\s*\(RICHARD\)\s*$/i, '');
      
      await importWordDocument(fullPath, subjectName);
    }
    
    console.log('\n✅ ALL IMPORTS COMPLETED!');
    
    // Show summary
    const subjects = await Subject.find();
    console.log('\n📊 SUMMARY:');
    for (const subject of subjects) {
      const count = await Question.countDocuments({ subjectId: subject._id });
      console.log(`   - ${subject.name}: ${count} questions`);
    }
    
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

importAllDocuments();node importWordDocs.js