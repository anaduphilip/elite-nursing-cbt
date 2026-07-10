// fixAnswerKeyInOptions.js
// Run: node fixAnswerKeyInOptions.js
// This script removes "Answer Key" text appended to the end of options during Word document import.

const dns = require('dns');
dns.setServers(['8.8.8.8', '8.8.4.4']);   // Force Google DNS for SRV resolution

const mongoose = require('mongoose');
require('dotenv').config();

// With your Atlas URI (the one you use in your backend's .env):
const MONGODB_URI = 'mongodb+srv://anaduphilip090_db_user:vpPyvn5OLz9QRrlc@cluster0.jrviuka.mongodb.net/quizzapp?retryWrites=true&w=majority';

// Fallback: If you still have DNS issues, uncomment the line below and comment out the SRV URI above.
// const MONGODB_URI = 'mongodb://anaduphilip090_db_user:vpPyvn5OLz9QRrlc@cluster0-shard-00-00.jrviuka.mongodb.net:27017,cluster0-shard-00-01.jrviuka.mongodb.net:27017,cluster0-shard-00-02.jrviuka.mongodb.net:27017/quizzapp?ssl=true&replicaSet=atlas-xxxxxx&authSource=admin&retryWrites=true&w=majority';

// Quiz Schema
const QuizSchema = new mongoose.Schema({
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

const Quiz = mongoose.model('Quiz', QuizSchema);

async function fixOptions() {
  try {
    await mongoose.connect(MONGODB_URI, {
      serverSelectionTimeoutMS: 30000,
      connectTimeoutMS: 30000
    });
    console.log('✅ Connected to MongoDB\n');
    
    const quizzes = await Quiz.find();
    console.log(`📚 Found ${quizzes.length} quizzes\n`);
    
    let totalFixedQuestions = 0;
    let totalFixedQuizzes = 0;
    
    for (const quiz of quizzes) {
      let quizModified = false;
      
      for (const question of quiz.questions) {
        if (!question.options || question.options.length === 0) continue;
        
        const newOptions = question.options.map((opt, index) => {
          // Check if option ends with "Answer Key" (case insensitive)
          const trimmed = opt.trim();
          const pattern = /\s*Answer Key$/i;
          
          if (pattern.test(trimmed)) {
            const cleaned = trimmed.replace(pattern, '').trim();
            console.log(`\n📝 Fixed in: "${quiz.title}"`);
            console.log(`   Question: ${question.questionText.substring(0, 60)}...`);
            console.log(`   Option ${String.fromCharCode(65 + index)}: "${trimmed}"`);
            console.log(`   → Cleaned to: "${cleaned}"`);
            quizModified = true;
            totalFixedQuestions++;
            return cleaned;
          }
          return opt;
        });
        
        if (quizModified) {
          question.options = newOptions;
        }
      }
      
      if (quizModified) {
        await quiz.save();
        totalFixedQuizzes++;
        console.log(`\n✅ Saved quiz: "${quiz.title}"`);
        console.log('─'.repeat(60));
      }
    }
    
    console.log('\n' + '='.repeat(60));
    console.log('✅ COMPLETED!');
    console.log('='.repeat(60));
    console.log(`📊 Fixed ${totalFixedQuestions} questions across ${totalFixedQuizzes} quizzes`);
    
    if (totalFixedQuestions === 0) {
      console.log('💡 No issues found. All options are clean.');
    }
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

// Run the script
fixOptions();