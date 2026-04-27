const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');
const mammoth = require('mammoth');

// Connect to local MongoDB
mongoose.connect('mongodb://localhost:27017/quizapp');

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

function extractAllQuestionsAndAnswers(content) {
  const questions = [];
  
  // First, extract ALL answers from the ANSWER KEY section
  const answers = {};
  const answerKeyMatch = content.match(/ANSWER KEY\s*\n([\s\S]*?)$/i);
  if (answerKeyMatch) {
    const answerLines = answerKeyMatch[1].split('\n');
    for (const line of answerLines) {
      const ansMatch = line.match(/^Q?(\d+)\.?\s*([A-Da-d])/i);
      if (ansMatch) {
        const qNum = parseInt(ansMatch[1]);
        const answer = ansMatch[2].toUpperCase();
        answers[qNum] = answer;
      }
    }
  }
  
  // Get content before answer key
  const contentBeforeAnswerKey = content.split(/ANSWER KEY/i)[0];
  
  // Find all questions using regex
  const questionPattern = /Q(\d+)\.\s+([^Q]+?)(?=Q\d+\.|\nANSWER KEY|$)/gi;
  let match;
  
  while ((match = questionPattern.exec(contentBeforeAnswerKey)) !== null) {
    const qNum = parseInt(match[1]);
    let fullText = match[2].trim();
    
    // Extract options - looking for (a), (b), (c), (d) patterns
    const options = [];
    const optionPattern = /\(([a-d])\)\s*([^(]+?)(?=\s*\([a-d]\)|$)/gi;
    let optMatch;
    let tempText = fullText;
    
    while ((optMatch = optionPattern.exec(tempText)) !== null) {
      options.push(optMatch[2].trim());
    }
    
    // If options not found with parentheses, try without parentheses (a. option)
    if (options.length !== 4) {
      options.length = 0;
      const altPattern = /([a-d])\.\s*([^a-d]+?)(?=\s*[a-d]\.|$)/gi;
      while ((optMatch = altPattern.exec(fullText)) !== null) {
        options.push(optMatch[2].trim());
      }
    }
    
    // Try pattern with space after letter "a option"
    if (options.length !== 4) {
      options.length = 0;
      const spacePattern = /([a-d])\s+([^a-d]+?)(?=\s*[a-d]\s|\$)/gi;
      while ((optMatch = spacePattern.exec(fullText)) !== null) {
        options.push(optMatch[2].trim());
      }
    }
    
    // Clean question text - remove all option patterns
    let questionText = fullText;
    questionText = questionText.replace(/\s*\([a-d]\)[^\(]*/gi, '');
    questionText = questionText.replace(/\s*[a-d]\.\s*[^a-d\.]*/gi, '');
    questionText = questionText.replace(/\s*[a-d]\s+[^a-d\s]*/gi, '');
    questionText = questionText.trim();
    
    // Clean up the question text
    questionText = questionText.replace(/\s+/g, ' ').trim();
    if (questionText && !questionText.endsWith('?') && !questionText.endsWith('.')) {
      questionText += '?';
    }
    
    // Get correct answer
    let correctAnswer = 0;
    if (answers[qNum]) {
      correctAnswer = answers[qNum].charCodeAt(0) - 65;
    }
    
    if (options.length === 4 && questionText && questionText.length > 5) {
      questions.push({
        number: qNum,
        text: questionText,
        options: options,
        correctAnswer: correctAnswer
      });
    }
  }
  
  // Sort by question number
  questions.sort((a, b) => a.number - b.number);
  
  return questions;
}

function getTitleFromFilename(filename) {
  if (filename.startsWith('~$')) return null;
  let title = filename.replace(/\.docx$/i, '');
  title = title.replace(/^Batch_\d+_/i, '');
  title = title.replace(/_/g, ' ');
  title = title.trim();
  return title;
}

async function importDentalNursing() {
  try {
    console.log('🚀 Starting Dental Nursing import...\n');

    const dentalPath = 'C:\\Users\\user\\Desktop\\questions\\dental-nursing';

    // Check if folder exists
    if (!fs.existsSync(dentalPath)) {
      console.log(`❌ Folder not found: ${dentalPath}`);
      console.log('Please create the folder and add your dental nursing Word documents.');
      process.exit(1);
    }

    // Get all Word documents
    const files = fs.readdirSync(dentalPath);
    const docxFiles = files.filter(f => {
      return f.toLowerCase().endsWith('.docx') && !f.startsWith('~$');
    });

    console.log(`📁 Found ${docxFiles.length} Word documents in dental-nursing folder\n`);

    if (docxFiles.length === 0) {
      console.log('⚠️ No .docx files found in the folder.');
      process.exit(1);
    }

    let totalImported = 0;
    let totalQuestions = 0;

    for (const file of docxFiles) {
      const filePath = path.join(dentalPath, file);
      const title = getTitleFromFilename(file);
      
      if (!title) continue;

      console.log(`📖 Processing: ${title}`);

      try {
        const result = await mammoth.extractRawText({ path: filePath });
        const questions = extractAllQuestionsAndAnswers(result.value);

        console.log(`   Extracted ${questions.length} questions`);

        if (questions.length > 0) {
          const quizQuestions = questions.map(q => ({
            questionText: q.text,
            options: q.options,
            correctAnswer: q.correctAnswer,
            points: 1
          }));

          // Check if quiz already exists
          const existingQuiz = await Quiz.findOne({ title: title, category: 'dental-nursing' });

          if (existingQuiz) {
            await Quiz.findOneAndUpdate(
              { title: title, category: 'dental-nursing' },
              {
                $set: {
                  questions: quizQuestions,
                  description: `${title} - ${questions.length} practice questions for dental nursing`,
                  category: 'dental-nursing'
                }
              }
            );
            console.log(`   ✅ Updated: ${questions.length} questions`);
          } else {
            const quiz = new Quiz({
              title: title,
              description: `${title} - ${questions.length} practice questions for dental nursing`,
              category: 'dental-nursing',
              questions: quizQuestions,
              isPremium: false
            });
            await quiz.save();
            console.log(`   ✅ Created new: ${questions.length} questions`);
          }

          totalImported++;
          totalQuestions += questions.length;
        } else {
          console.log(`   ⚠️ No questions found in ${title}`);
          console.log(`   💡 Check if the document has questions in format: Q1. question (a) option (b) option (c) option (d) option`);
        }
      } catch (err) {
        console.log(`   ❌ Error processing file: ${err.message}`);
      }
    }

    console.log(`\n✅ DENTAL NURSING IMPORT COMPLETED!`);
    console.log(`   📊 Imported/Updated: ${totalImported} quizzes`);
    console.log(`   📝 Total questions: ${totalQuestions}`);

    // Show summary of all dental quizzes in database
    const dentalQuizzes = await Quiz.find({ category: 'dental-nursing' });
    console.log(`\n📋 Dental Nursing Quizzes in Database:`);
    dentalQuizzes.forEach((quiz, i) => {
      console.log(`   ${i + 1}. ${quiz.title}: ${quiz.questions.length} questions`);
    });

    console.log(`\n💡 Next step: Run 'node syncToAtlas.js' to update your live app`);

    process.exit(0);

  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

importDentalNursing();