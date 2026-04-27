const mongoose = require('mongoose');

const MONGODB_URI = 'mongodb://localhost:27017/quizapp';

const quizSchema = new mongoose.Schema({
  title: String,
  category: String,
  questions: Array
}, { strict: false });

const Quiz = mongoose.model('Quiz', quizSchema);

async function fixAllCategories() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    // Get ALL quizzes
    const allQuizzes = await Quiz.find();
    console.log(`📚 Total quizzes found: ${allQuizzes.length}\n`);

    let generalNursing = 0;
    let midwifery = 0;
    let publicHealth = 0;
    let fixed = 0;

    for (const quiz of allQuizzes) {
      const title = quiz.title.toLowerCase();
      let newCategory = null;

      // Check if it's MIDWIFERY (from midwifery folder)
      if (title.includes('midwifery') || 
          title.includes('obstetric') || 
          title.includes('maternal') ||
          title.includes('labour') ||
          title.includes('delivery') ||
          title.includes('antenatal') ||
          title.includes('postnatal')) {
        newCategory = 'midwifery';
        midwifery++;
      }
      // Check if it's PUBLIC HEALTH
      else if (title.includes('public') || 
               title.includes('health') || 
               title.includes('community') ||
               title.includes('epidemiology')) {
        newCategory = 'public-health';
        publicHealth++;
      }
      // Default to GENERAL NURSING
      else {
        newCategory = 'general-nursing';
        generalNursing++;
      }

      // Update if category is missing or wrong
      if (quiz.category !== newCategory) {
        quiz.category = newCategory;
        await quiz.save();
        fixed++;
        console.log(`   Fixed: ${quiz.title.substring(0, 50)} → ${newCategory}`);
      }
    }

    console.log(`\n✅ FIX COMPLETED!`);
    console.log(`   📊 Fixed: ${fixed} quizzes`);
    console.log(`\n📋 FINAL CATEGORY COUNTS:`);
    console.log(`   🩺 General Nursing: ${generalNursing}`);
    console.log(`   🤰 Midwifery: ${midwifery}`);
    console.log(`   🌍 Public Health: ${publicHealth}`);

    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

fixAllCategories();