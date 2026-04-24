const mongoose = require('mongoose');

// Your MongoDB Atlas connection string
const MONGODB_URI = 'mongodb+srv://anaduphilip090_db_user:vpPyvn5OLz9QRrlc@cluster0.jrviuka.mongodb.net/quizapp?retryWrites=true&w=majority';

// Quiz Schema
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

// Sample nursing quizzes
const quizzes = [
  {
    title: "Cardiovascular Nursing - Set 1",
    description: "Test your knowledge in Cardiovascular Nursing (20 questions)",
    isPremium: false,
    questions: [
      { questionText: "The pain of angina pectoris is produced primarily by?", options: ["Vasoconstriction", "Movement of thromboemboli", "Myocardial ischemia", "The presence of atheromas"], correctAnswer: 2, points: 1 },
      { questionText: "The myocardium is composed of specialized cells known as?", options: ["Lymphocyte", "Mycocyte", "Myocyte", "Actirocyte"], correctAnswer: 1, points: 1 },
      { questionText: "Exchange of gases and food nutrient take place in the?", options: ["Arteries", "Veins", "Arterioles", "Capillaries"], correctAnswer: 3, points: 1 },
      { questionText: "Which of the following has the thickest wall?", options: ["Right ventricle", "Left ventricle", "Right atrium", "Left atrium"], correctAnswer: 1, points: 1 },
      { questionText: "Which of the following is the most common symptom of myocardial infarction?", options: ["Chest pain", "Dyspnea", "Edema", "Palpitations"], correctAnswer: 0, points: 1 }
    ]
  },
  {
    title: "Fundamentals of Nursing - Set 1",
    description: "Test your knowledge in Fundamentals of Nursing (20 questions)",
    isPremium: false,
    questions: [
      { questionText: "What is the first step in the nursing process?", options: ["Implementation", "Evaluation", "Assessment", "Planning"], correctAnswer: 2, points: 1 },
      { questionText: "What does ADPIE stand for?", options: ["Assessment, Diagnosis, Planning, Implementation, Evaluation", "Analysis, Diagnosis, Planning, Implementation, Evaluation", "Assessment, Data, Planning, Implementation, Evaluation", "Assessment, Diagnosis, Procedure, Implementation, Evaluation"], correctAnswer: 0, points: 1 },
      { questionText: "Which of the following is a subjective data?", options: ["Blood pressure reading", "Patient's complaint of pain", "Temperature reading", "Lab results"], correctAnswer: 1, points: 1 }
    ]
  }
];

async function importQuizzes() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB Atlas');
    
    // Clear existing quizzes
    await Quiz.deleteMany({});
    console.log('Cleared existing quizzes');
    
    // Insert new quizzes
    await Quiz.insertMany(quizzes);
    console.log(`✅ Added ${quizzes.length} quizzes successfully!`);
    
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

importQuizzes();