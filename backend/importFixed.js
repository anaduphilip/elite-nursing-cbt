const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');
const mammoth = require('mammoth');

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

function extractQuestionsAndAnswers(content) {
  const questions = [];
  const answers = {};

  const lines = content.split('\n');
  let inAnswerKey = false;

  for (const line of lines) {
    const trimmedLine = line.trim();

    if (trimmedLine.toUpperCase() === 'ANSWER KEY') {
      inAnswerKey = true;
      continue;
    }

    if (inAnswerKey) {
      const answerMatch = trimmedLine.match(/^Q(\d+)\.\s*([A-D])/i);
      if (answerMatch) {
        const qNum = parseInt(answerMatch[1]);
        const answer = answerMatch[2].toUpperCase();
        answers[qNum] = answer;
      }
      continue;
    }

    if (trimmedLine.match(/^Q(\d+)\./i)) {
      const qMatch = trimmedLine.match(/^Q(\d+)\.\s*(.*)/i);
      if (qMatch) {
        const qNum = parseInt(qMatch[1]);
        let text = qMatch[2];

        const options = [];
        const optionPattern = /\(([a-d])\)\s*([^(]+?)(?=\s*\([a-d]\)|$)/gi;
        let match;

        while ((match = optionPattern.exec(text)) !== null) {
          options.push(match[2].trim());
        }

        let questionText = text;
        questionText = questionText.replace(/\s*\(a\)[^\(]*/, '');
        questionText = questionText.replace(/\s*\(b\)[^\(]*/, '');
        questionText = questionText.replace(/\s*\(c\)[^\(]*/, '');
        questionText = questionText.replace(/\s*\(d\)[^\(]*/, '');
        questionText = questionText.trim();
        questionText = questionText.replace(/\?$/, '?');

        if (options.length === 4 && questionText) {
          questions.push({
            number: qNum,
            text: questionText,
            options: options,
            correctAnswer: null
          });
        }
      }
    }
  }

  for (const q of questions) {
    if (answers[q.number]) {
      const answerLetter = answers[q.number];
      q.correctAnswer = answerLetter.charCodeAt(0) - 65;
    }
  }

  return questions.filter(q => q.correctAnswer !== null);
}

async function importAllFiles() {
  try {
    console.log('🚀 Starting fixed import...\n');

    const questionsFolder = 'C:\\Users\\user\\Desktop\\questions';
    const files = fs.readdirSync(questionsFolder);
    
    // Only get .docx files (ignore subfolders)
    const docxFiles = files.filter(f => {
      const fullPath = path.join(questionsFolder, f);
      const isDirectory = fs.statSync(fullPath).isDirectory();
      return !isDirectory && f.toLowerCase().endsWith('.docx');
    });

    console.log(`📁 Found ${docxFiles.length} Word documents\n`);

    // Group by subject
    const subjectGroups = {};

    for (const file of docxFiles) {
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

    // Clear existing quizzes
    await Quiz.deleteMany({});
    console.log('🗑️ Cleared existing quizzes\n');

    for (const [subjectName, subjectFiles] of Object.entries(subjectGroups)) {
      console.log(`\n📚 Processing: ${subjectName} (${subjectFiles.length} files)`);

      let allQuestions = [];

      for (const file of subjectFiles) {
        const filePath = path.join(questionsFolder, file);
        console.log(`   📖 Reading: ${file}`);

        const result = await mammoth.extractRawText({ path: filePath });
        const questions = extractQuestionsAndAnswers(result.value);

        console.log(`      ✅ Extracted ${questions.length} questions with answers`);
        allQuestions = allQuestions.concat(questions);
      }

      // Remove duplicates by question text
      const uniqueQuestions = [];
      const seenTexts = new Set();

      for (const q of allQuestions) {
        if (!seenTexts.has(q.text)) {
          seenTexts.add(q.text);
          uniqueQuestions.push(q);
        }
      }

      console.log(`   📊 Total unique questions: ${uniqueQuestions.length}`);

      if (uniqueQuestions.length > 0) {
        const quizQuestions = uniqueQuestions.map(q => ({
          questionText: q.text,
          options: q.options,
          correctAnswer: q.correctAnswer,
          points: 1
        }));

        // FORCE all quizzes to be GENERAL NURSING
        const quiz = new Quiz({
          title: subjectName,
          description: `${subjectName} - ${uniqueQuestions.length} practice questions`,
          category: 'general-nursing',
          questions: quizQuestions,
          isPremium: false
        });

        await quiz.save();
        console.log(`   ✅ Saved quiz with ${uniqueQuestions.length} questions (Category: general-nursing)`);
      }
    }

    const totalQuizzes = await Quiz.countDocuments();
    console.log(`\n✅ IMPORT COMPLETED! Created ${totalQuizzes} quizzes`);

    // Show summary
    const allQuizzes = await Quiz.find();
    console.log('\n📊 FINAL SUMMARY:');
    for (const quiz of allQuizzes) {
      console.log(`   - ${quiz.title}: ${quiz.questions.length} questions [${quiz.category}]`);
    }

    console.log(`\n📊 TOTAL GENERAL NURSING QUIZZES: ${totalQuizzes}`);

    process.exit(0);

  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

importAllFiles();