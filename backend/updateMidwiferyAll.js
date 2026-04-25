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

async function updateAllMidwiferyQuizzes() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to Local MongoDB\n');
    
    const midwiferyPath = 'C:\\Users\\user\\Desktop\\questions\\midwifery';
    
    if (!fs.existsSync(midwiferyPath)) {
      console.log(`❌ Folder not found: ${midwiferyPath}`);
      process.exit(1);
    }
    
    const files = fs.readdirSync(midwiferyPath);
    const docxFiles = files.filter(f => f.toLowerCase().endsWith('.docx'));
    
    console.log(`📁 Found ${docxFiles.length} midwifery documents\n`);
    console.log('🔄 Updating all Midwifery quizzes...\n');
    
    let updatedCount = 0;
    let totalQuestions = 0;
    
    for (const file of docxFiles) {
      const filePath = path.join(midwiferyPath, file);
      const title = getTitleFromFilename(file);
      
      console.log(`📖 Processing: ${title}`);
      const questions = await extractQuestions(filePath);
      
      if (questions.length > 0) {
        const quizQuestions = questions.map(q => ({
          questionText: q.text,
          options: q.options,
          correctAnswer: q.correctAnswer,
          points: 1
        }));
        
        const result = await Quiz.findOneAndUpdate(
          { title: title, category: 'midwifery' },
          { 
            $set: { 
              questions: quizQuestions,
              description: `${title} - ${questions.length} practice questions for midwifery`,
              category: 'midwifery'
            }
          },
          { new: true, upsert: true }
        );
        
        updatedCount++;
        totalQuestions += questions.length;
        console.log(`   ✅ Updated: ${questions.length} questions`);
      } else {
        console.log(`   ⚠️ No questions found`);
      }
    }
    
    console.log(`\n✅ UPDATE COMPLETED!`);
    console.log(`   📊 Updated ${updatedCount} quizzes`);
    console.log(`   📝 Total questions: ${totalQuestions}`);
    console.log(`\n💡 Next step: Run the sync command to update Atlas`);
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

updateAllMidwiferyQuizzes();