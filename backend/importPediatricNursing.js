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
      // Match patterns like "Q1. b", "Q1. B", "1. a", "Q1 b", "Q1.b", "1.a"
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
  
  // Method 1: Split by Q number pattern
  const qPattern = /Q(\d+)\.\s+/gi;
  let match;
  let lastIndex = 0;
  const questionSegments = [];
  
  // Find all question starting positions
  while ((match = qPattern.exec(contentBeforeAnswerKey)) !== null) {
    const qNum = parseInt(match[1]);
    const startPos = match.index;
    
    if (lastIndex > 0) {
      const previousStart = lastIndex;
      const previousQNum = parseInt(contentBeforeAnswerKey.match(/Q(\d+)\.\s+/)?.[1]);
      questionSegments.push({
        qNum: previousQNum,
        text: contentBeforeAnswerKey.substring(previousStart, startPos).trim()
      });
    }
    lastIndex = startPos;
  }
  
  // Add the last question segment
  if (lastIndex > 0) {
    const lastQMatch = contentBeforeAnswerKey.match(/Q(\d+)\.\s+/g);
    const lastQNum = lastQMatch ? parseInt(lastQMatch[lastQMatch.length - 1].match(/\d+/)[0]) : null;
    questionSegments.push({
      qNum: lastQNum,
      text: contentBeforeAnswerKey.substring(lastIndex).trim()
    });
  }
  
  // If segmentation didn't work well, try alternative method
  if (questionSegments.length === 0) {
    // Alternative: Split by newlines and look for Q patterns
    const lines = contentBeforeAnswerKey.split('\n');
    let currentQuestion = null;
    
    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed) continue;
      
      const qMatch = trimmed.match(/^Q(\d+)\.\s+(.+)/i);
      if (qMatch) {
        if (currentQuestion) {
          questionSegments.push(currentQuestion);
        }
        currentQuestion = {
          qNum: parseInt(qMatch[1]),
          text: qMatch[2]
        };
      } else if (currentQuestion) {
        currentQuestion.text += ' ' + trimmed;
      }
    }
    if (currentQuestion) {
      questionSegments.push(currentQuestion);
    }
  }
  
  // Process each question segment
  for (const segment of questionSegments) {
    const qNum = segment.qNum;
    let fullText = segment.text;
    
    // Extract options - look for (a), (b), (c), (d) patterns
    const options = [];
    
    // Try pattern with parentheses (a) option
    let optPattern = /\(([a-d])\)\s*([^\(]+?)(?=\s*\([a-d]\)|$)/gi;
    let optMatch;
    let tempText = fullText;
    
    while ((optMatch = optPattern.exec(tempText)) !== null) {
      const optionText = optMatch[2].trim();
      // Clean up option text - remove trailing newlines and extra spaces
      const cleanOption = optionText.replace(/\s+/g, ' ').trim();
      if (cleanOption && options.length < 4) {
        options.push(cleanOption);
      }
    }
    
    // If parentheses pattern didn't work, try without parentheses (a. option)
    if (options.length !== 4) {
      options.length = 0;
      const altPattern = /([a-d])\.\s*([^a-d]+?)(?=\s*[a-d]\.|$)/gi;
      while ((optMatch = altPattern.exec(fullText)) !== null) {
        const optionText = optMatch[2].trim();
        const cleanOption = optionText.replace(/\s+/g, ' ').trim();
        if (cleanOption && options.length < 4) {
          options.push(cleanOption);
        }
      }
    }
    
    // Try pattern with space after letter "a option"
    if (options.length !== 4) {
      options.length = 0;
      const spacePattern = /([a-d])\s+([^a-d]+?)(?=\s*[a-d]\s|\$)/gi;
      while ((optMatch = spacePattern.exec(fullText)) !== null) {
        const optionText = optMatch[2].trim();
        const cleanOption = optionText.replace(/\s+/g, ' ').trim();
        if (cleanOption && options.length < 4) {
          options.push(cleanOption);
        }
      }
    }
    
    // Clean question text - remove all option patterns
    let questionText = fullText;
    // Remove (a) option patterns
    questionText = questionText.replace(/\s*\([a-d]\)[^\(]*/gi, '');
    // Remove a. option patterns
    questionText = questionText.replace(/\s*[a-d]\.\s*[^a-d\.]*/gi, '');
    // Remove a option patterns
    questionText = questionText.replace(/\s*[a-d]\s+[^a-d\s]*/gi, '');
    questionText = questionText.trim();
    
    // Clean up the question text
    questionText = questionText.replace(/\s+/g, ' ').trim();
    if (questionText && !questionText.endsWith('?') && !questionText.endsWith('.')) {
      questionText += '?';
    }
    
    // Get correct answer
    let correctAnswer = 0; // default to A
    if (answers[qNum]) {
      correctAnswer = answers[qNum].charCodeAt(0) - 65;
    }
    
    // Only add if we have valid options (4 options)
    if (options.length === 4 && questionText && questionText.length > 10) {
      questions.push({
        number: qNum,
        text: questionText,
        options: options,
        correctAnswer: correctAnswer
      });
    } else if (options.length === 4) {
      // Still add even if question text is short
      questions.push({
        number: qNum,
        text: questionText || `Question ${qNum}`,
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

async function importPediatricNursing() {
  try {
    console.log('🚀 Starting Pediatric Nursing import (target: 5000 questions)...\n');

    const pediatricPath = 'C:\\Users\\user\\Desktop\\questions\\pediatric-nursing';

    if (!fs.existsSync(pediatricPath)) {
      console.log(`❌ Folder not found: ${pediatricPath}`);
      process.exit(1);
    }

    const files = fs.readdirSync(pediatricPath);
    const docxFiles = files.filter(f => {
      return f.toLowerCase().endsWith('.docx') && !f.startsWith('~$');
    });

    console.log(`📁 Found ${docxFiles.length} Word documents in pediatric-nursing folder\n`);

    let totalImported = 0;
    let totalQuestions = 0;
    const expectedPerFile = 250; // Each file should have 250 questions

    for (const file of docxFiles) {
      const filePath = path.join(pediatricPath, file);
      const title = getTitleFromFilename(file);
      
      if (!title) continue;

      console.log(`📖 Processing: ${title}`);

      try {
        const result = await mammoth.extractRawText({ path: filePath });
        const questions = extractAllQuestionsAndAnswers(result.value);

        console.log(`   Extracted ${questions.length} / ${expectedPerFile} questions`);

        if (questions.length > 0) {
          const quizQuestions = questions.map(q => ({
            questionText: q.text,
            options: q.options,
            correctAnswer: q.correctAnswer,
            points: 1
          }));

          const existingQuiz = await Quiz.findOne({ title: title, category: 'pediatric-nursing' });

          if (existingQuiz) {
            await Quiz.findOneAndUpdate(
              { title: title, category: 'pediatric-nursing' },
              {
                $set: {
                  questions: quizQuestions,
                  description: `${title} - ${questions.length} practice questions for pediatric nursing`,
                  category: 'pediatric-nursing'
                }
              }
            );
            console.log(`   ✅ Updated: ${questions.length} questions`);
          } else {
            const quiz = new Quiz({
              title: title,
              description: `${title} - ${questions.length} practice questions for pediatric nursing`,
              category: 'pediatric-nursing',
              questions: quizQuestions,
              isPremium: false
            });
            await quiz.save();
            console.log(`   ✅ Created new: ${questions.length} questions`);
          }

          totalImported++;
          totalQuestions += questions.length;
          
          if (questions.length < expectedPerFile) {
            console.log(`   ⚠️ Missing ${expectedPerFile - questions.length} questions from this file`);
          }
        } else {
          console.log(`   ⚠️ No questions found in ${title}`);
        }
      } catch (err) {
        console.log(`   ❌ Error processing file: ${err.message}`);
      }
    }

    console.log(`\n✅ PEDIATRIC NURSING IMPORT COMPLETED!`);
    console.log(`   📊 Imported/Updated: ${totalImported} quizzes`);
    console.log(`   📝 Total questions: ${totalQuestions}`);
    console.log(`   🎯 Target: 5000 questions`);
    console.log(`   📉 Missing: ${5000 - totalQuestions} questions`);

    // Show summary
    const pediatricQuizzes = await Quiz.find({ category: 'pediatric-nursing' });
    console.log(`\n📋 Pediatric Nursing Quizzes in Database:`);
    pediatricQuizzes.forEach((quiz, i) => {
      console.log(`   ${i + 1}. ${quiz.title}: ${quiz.questions.length} questions`);
    });

    console.log(`\n💡 Next step: Run 'node syncToAtlas.js' to update your live app`);

    process.exit(0);

  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

importPediatricNursing();