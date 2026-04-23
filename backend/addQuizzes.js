const mongoose = require('mongoose');

mongoose.connect('mongodb://localhost:27017/quizapp');

// Quiz Schema
const QuizSchema = new mongoose.Schema({
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

const Quiz = mongoose.model('Quiz', QuizSchema);

// Nursing subjects
const nursingTopics = [
  'Fundamentals of Nursing',
  'Anatomy & Physiology',
  'Pharmacology',
  'Medical-Surgical Nursing',
  'Maternal & Child Health',
  'Mental Health Nursing',
  'Community Health Nursing',
  'Nursing Research',
  'Nursing Leadership',
  'Emergency Nursing'
];

// Generate questions
const generateQuestion = (topic, num) => ({
  questionText: `${topic} Question ${num}: The nurse understands that proper nursing care includes which of the following?`,
  options: [
    'Assess patient before intervention',
    'Document all findings',
    'Evaluate patient response',
    'Implement care plan'
  ],
  correctAnswer: 0,
  points: 1
});

// Create quizzes
async function addQuizzes() {
  try {
    // Clear existing
    await Quiz.deleteMany({});
    console.log('Cleared existing quizzes');
    
    const allQuizzes = [];
    
    for (let topicIndex = 0; topicIndex < nursingTopics.length; topicIndex++) {
      const topic = nursingTopics[topicIndex];
      
      for (let quizNum = 1; quizNum <= 10; quizNum++) {
        const questions = [];
        
        for (let qNum = 1; qNum <= 20; qNum++) {
          questions.push(generateQuestion(topic, qNum));
        }
        
        allQuizzes.push({
          title: `${topic} - Set ${quizNum}`,
          description: `Test your knowledge in ${topic}. Contains 20 multiple choice questions.`,
          questions: questions,
          isPremium: quizNum > 8
        });
      }
    }
    
    await Quiz.insertMany(allQuizzes);
    console.log(`✅ Added ${allQuizzes.length} quizzes successfully!`);
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

addQuizzes();