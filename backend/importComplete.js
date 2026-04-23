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
  let text = line.replace(/^Q\d+\.\s*/, '');
  
  // Extract options (a), (b), (c), (d)
  const options = [];
  const optionPattern = /\(([a-d])\)\s*([^(]+?)(?=\s*\([a-d]\)|$)/gi;
  let match;
  
  while ((match = optionPattern.exec(text)) !== null) {
    options.push(match[2].trim());
  }
  
  // Clean question text (remove options)
  let questionText = text;
  questionText = questionText.replace(/\s*\(a\)[^\(]*/, '');
  questionText = questionText.replace(/\s*\(b\)[^\(]*/, '');
  questionText = questionText.replace(/\s*\(c\)[^\(]*/, '');
  questionText = questionText.replace(/\s*\(d\)[^\(]*/, '');
  questionText = questionText.trim();
  
  return { text: questionText, options };
}

function extractAllQuestions(content) {
  const questions = [];
  const lines = content.split('\n');
  
  for (const line of lines) {
    const trimmedLine = line.trim();
    if (trimmedLine.match(/^Q\d+\./i)) {
      const parsed = parseQuestionLine(trimmedLine);
      if (parsed.options.length === 4 && parsed.text) {
        questions.push({
          number: questions.length + 1,
          text: parsed.text,
          options: parsed.options,
          correctAnswer: null
        });
      }
    }
  }
  
  return questions;
}

function extractAnswerKey(content) {
  const answers = {};
  const lines = content.split('\n');
  
  for (const line of lines) {
    // Match patterns like: "Q1. C", "Q1 C", "1. C", "1 C"
    let match = line.match(/Q?(\d+)[\.\s]+([A-D])/i);
    if (match) {
      const qNum = parseInt(match[1]);
      const answer = match[2].toUpperCase();
      answers[qNum] = answer;
    }
  }
  
  return answers;
}

async function importWordDocument(filePath, subjectName, fileNumber) {
  console.log(`\n📖 [${fileNumber}] ${subjectName}`);
  
  try {
    const result = await mammoth.extractRawText({ path: filePath });
    const content = result.value;
    
    // Extract questions
    const questions = extractAllQuestions(content);
    console.log(`   📝 Extracted ${questions.length} questions`);
    
    if (questions.length === 0) {
      console.log(`   ⚠️ No questions found`);
      return null;
    }
    
    // Extract answer key
    const answers = extractAnswerKey(content);
    console.log(`   🔑 Found ${Object.keys(answers).length} answers`);
    
    // Assign answers to questions
    for (let i = 0; i < questions.length; i++) {
      const qNum = i + 1;
      if (answers[qNum]) {
        const answerLetter = answers[qNum];
        questions[i].correctAnswer = answerLetter.charCodeAt(0) - 65;
      }
    }
    
    // Filter questions with answers
    const validQuestions = questions.filter(q => q.correctAnswer !== null);
    console.log(`   ✅ ${validQuestions.length} questions with answers`);
    
    if (validQuestions.length === 0) {
      return null;
    }
    
    // Convert to quiz format
    const quizQuestions = validQuestions.map(q => ({
      questionText: q.text,
      options: q.options,
      correctAnswer: q.correctAnswer,
      points: 1
    }));
    
    return {
      title: subjectName,
      description: `${subjectName} - ${validQuestions.length} practice questions for nursing exams`,
      questions: quizQuestions,
      isPremium: false
    };
    
  } catch (error) {
    console.log(`   ❌ Error: ${error.message}`);
    return null;
  }
}

async function importAll() {
  try {
    console.log('🚀 Starting complete import...\n');
    
    const questionsFolder = 'C:\\Users\\user\\Desktop\\questions';
    const files = fs.readdirSync(questionsFolder);
    const docxFiles = files.filter(f => f.toLowerCase().endsWith('.docx'));
    
    console.log(`📁 Found ${docxFiles.length} Word documents\n`);
    
    // Group files by subject (merge multiple files for same subject)
    const subjectGroups = {};
    
    for (const file of docxFiles) {
      // Extract base subject name
      let subjectName = file.replace(/\.docx$/i, '');
      subjectName = subjectName.replace(/^\d+-\d+\s*/i, '');
      subjectName = subjectName.replace(/^RICHARD\s*/i, '');
      subjectName = subjectName.replace(/\s*\(RICHARD\)\s*$/i, '');
      subjectName = subjectName.trim();
      
      if (!subjectGroups[subjectName]) {
        subjectGroups[subjectName] = [];
      }
      subjectGroups[subjectName].push(file);
    }
    
    console.log(`📂 Grouped into ${Object.keys(subjectGroups).length} subjects\n`);
    
    // Clear existing quizzes
    await Quiz.deleteMany({});
    console.log('🗑️ Cleared existing quizzes\n');
    
    let totalQuizzes = 0;
    
    for (const [subjectName, files] of Object.entries(subjectGroups)) {
      console.log(`\n📚 Processing: ${subjectName} (${files.length} files)`);
      
      let allQuestions = [];
      
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const filePath = path.join(questionsFolder, file);
        const result = await importWordDocument(filePath, subjectName, `${i+1}/${files.length}`);
        
        if (result && result.questions) {
          allQuestions = allQuestions.concat(result.questions);
        }
      }
      
      if (allQuestions.length > 0) {
        // Remove duplicates (by question text)
        const uniqueQuestions = [];
        const questionTexts = new Set();
        
        for (const q of allQuestions) {
          if (!questionTexts.has(q.questionText)) {
            questionTexts.add(q.questionText);
            uniqueQuestions.push(q);
          }
        }
        
        console.log(`   📊 Total unique questions: ${uniqueQuestions.length}`);
        
        const quiz = new Quiz({
          title: subjectName,
          description: `${subjectName} - ${uniqueQuestions.length} practice questions for nursing exams`,
          questions: uniqueQuestions,
          isPremium: false
        });
        
        await quiz.save();
        totalQuizzes++;
        console.log(`   ✅ Saved quiz with ${uniqueQuestions.length} questions`);
      } else {
        console.log(`   ⚠️ No questions imported for ${subjectName}`);
      }
    }
    
    console.log(`\n✅ IMPORT COMPLETED! Created ${totalQuizzes} quizzes with all questions combined`);
    
    // Show summary
    const allQuizzes = await Quiz.find();
    console.log('\n📊 FINAL SUMMARY:');
    for (const quiz of allQuizzes) {
      console.log(`   - ${quiz.title}: ${quiz.questions.length} questions`);
    }
    
    process.exit(0);
    
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

importAll();