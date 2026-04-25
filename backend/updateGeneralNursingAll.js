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
  let answers = {};
  let inAnswerKey = false;
  
  for (let i = 0; i < lines.length; i++) {
    const trimmed = lines[i].trim();
    
    if (trimmed.toUpperCase() === 'ANSWER KEY') {
      inAnswerKey = true;
      continue;
    }
    
    if (inAnswerKey) {
      const ansMatch = trimmed.match(/^Q(\d+)\.\s*([A-D])/i);
      if (ansMatch) {
        answers[parseInt(ansMatch[1])] = ansMatch[2];
      }
      continue;
    }
    
    const qMatch = trimmed.match(/^Q(\d+)\.\s*(.*)/i);
    if (qMatch) {
      const qNum = parseInt(qMatch[1]);
      let fullText = qMatch[2];
      
      const options = [];
      const optionPattern = /\(([a-d])\)\s*([^(]+?)(?=\s*\([a-d]\)|$)/gi;
      let match;
      let tempText = fullText;
      
      while ((match = optionPattern.exec(tempText)) !== null) {
        options.push(match[2].trim());
      }
      
      let questionText = fullText;
      questionText = questionText.replace(/\s*\(a\)[^\(]*/, '');
      questionText = questionText.replace(/\s*\(b\)[^\(]*/, '');
      questionText = questionText.replace(/\s*\(c\)[^\(]*/, '');
      questionText = questionText.replace(/\s*\(d\)[^\(]*/, '');
      questionText = questionText.trim();
      
      if (options.length === 4 && questionText) {
        questions.push({
          number: qNum,
          text: questionText,
          options: options,
          correctAnswer: answers[qNum] ? answers[qNum].charCodeAt(0) - 65 : null
        });
      }
    }
  }
  
  return questions.filter(q => q.correctAnswer !== null);
}

function getTitleFromFilename(filename) {
  let title = filename.replace(/\.docx$/i, '');
  title = title.replace(/^\d+-\d+\s*/i, '');
  title = title.replace(/^RICHARD\s*/i, '');
  title = title.replace(/\s*\(RICHARD\)\s*$/i, '');
  title = title.trim();
  return title;
}

async function updateAllGeneralNursingQuizzes() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to Local MongoDB\n');
    
    const generalPath = 'C:\\Users\\user\\Desktop\\questions';
    
    if (!fs.existsSync(generalPath)) {
      console.log(`❌ Folder not found: ${generalPath}`);
      process.exit(1);
    }
    
    // Read ONLY files in the main folder (not subfolders)
    const items = fs.readdirSync(generalPath);
    
    // Filter: ONLY .docx files that are files (not directories)
    const docxFiles = [];
    for (const item of items) {
      const fullPath = path.join(generalPath, item);
      const stat = fs.statSync(fullPath);
      // Only take files that end with .docx and are not directories
      if (stat.isFile() && item.toLowerCase().endsWith('.docx')) {
        docxFiles.push(fullPath);
      }
    }
    
    console.log(`📁 Found ${docxFiles.length} Word documents in main folder\n`);
    console.log('🔄 Updating all General Nursing quizzes...\n');
    
    let updatedCount = 0;
    let totalQuestions = 0;
    
    for (const filePath of docxFiles) {
      const fileName = path.basename(filePath);
      let title = getTitleFromFilename(fileName);
      
      console.log(`📖 Processing: ${title}`);
      const questions = await extractQuestions(filePath);
      
      if (questions.length > 0) {
        const quizQuestions = questions.map(q => ({
          questionText: q.text,
          options: q.options,
          correctAnswer: q.correctAnswer,
          points: 1
        }));
        
        // Check if quiz exists
        const existingQuiz = await Quiz.findOne({ title: title });
        
        if (existingQuiz) {
          await Quiz.findOneAndUpdate(
            { title: title },
            { 
              $set: { 
                questions: quizQuestions,
                description: `${title} - ${questions.length} practice questions`,
                category: 'general-nursing'
              }
            }
          );
          updatedCount++;
          totalQuestions += questions.length;
          console.log(`   ✅ Updated: ${questions.length} questions`);
        } else {
          // Create new quiz
          const newQuiz = new Quiz({
            title: title,
            description: `${title} - ${questions.length} practice questions for nursing`,
            category: 'general-nursing',
            questions: quizQuestions,
            isPremium: false
          });
          await newQuiz.save();
          updatedCount++;
          totalQuestions += questions.length;
          console.log(`   ✅ Created new: ${questions.length} questions`);
        }
      } else {
        console.log(`   ⚠️ No questions found in ${title}`);
      }
    }
    
    console.log(`\n✅ UPDATE COMPLETED!`);
    console.log(`   📊 Updated/Created ${updatedCount} quizzes`);
    console.log(`   📝 Total questions: ${totalQuestions}`);
    console.log(`\n💡 Next step: Run 'node syncToAtlas.js' to update your live app`);
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

updateAllGeneralNursingQuizzes();