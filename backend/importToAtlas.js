const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');

// Your MongoDB Atlas connection string
const MONGODB_URI = 'mongodb+srv://anaduphilip090_db_user:vpPyvn5OLz9QRrlc@cluster0.jrviuka.mongodb.net/quizapp?retryWrites=true&w=majority';

mongoose.connect(MONGODB_URI)
  .then(() => console.log('Connected to MongoDB Atlas'))
  .catch(err => console.log('Error:', err));

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

// Sample nursing questions (add more as needed)
const sampleQuizzes = [
  {
    title: "Cardiovascular Nursing - Set 1",
    description: "Test your knowledge in Cardiovascular Nursing. Contains 20 multiple choice questions.",
    isPremium: false,
    questions: [
      {
        questionText: "The pain of angina pectoris is produced primarily by?",
        options: ["Vasoconstriction", "Movement of thromboemboli", "Myocardial ischemia", "The presence of atheromas"],
        correctAnswer: 2,
        points: 1
      },
      {
        questionText: "The myocardium is composed of specialized cells known as?",
        options: ["Lymphocyte", "Mycocyte", "Myocyte", "Actirocyte"],
        correctAnswer: 1,
        points: 1
      },
      {
        questionText: "Exchange of gases and food nutrient take place in the?",
        options: ["Arteries", "Veins", "Arterioles", "Capillaries"],
        correctAnswer: 3,
        points: 1
      },
      {
        questionText: "Which of the following has the thickest wall?",
        options: ["Right ventricle", "Left ventricle", "Right atrium", "Left atrium"],
        correctAnswer: 1,
        points: 1
      },
      {
        questionText: "Which of the following is the most common symptom of myocardial infarction?",
        options: ["Chest pain", "Dyspnea", "Edema", "Palpitations"],
        correctAnswer: 0,
        points: 1
      }
    ]
  },
  {
    title: "Fundamentals of Nursing - Set 1",
    description: "Test your knowledge in Fundamentals of Nursing. Contains 20 multiple choice questions.",
    isPremium: false,
    questions: [
      {
        questionText: "What is the first step in the nursing process?",
        options: ["Implementation", "Evaluation", "Assessment", "Planning"],
        correctAnswer: 2,
        points: 1
      },
      {
        questionText: "Which of the following is the correct order of the nursing process?",
        options: ["Assessment, Planning, Implementation, Evaluation", "Planning, Assessment, Implementation, Evaluation", "Assessment, Implementation, Planning, Evaluation", "Planning, Implementation, Assessment, Evaluation"],
        correctAnswer: 0,
        points: 1
      },
      {
        questionText: "What does ADPIE stand for?",
        options: ["Assessment, Diagnosis, Planning, Implementation, Evaluation", "Analysis, Diagnosis, Planning, Implementation, Evaluation", "Assessment, Data, Planning, Implementation, Evaluation", "Assessment, Diagnosis, Procedure, Implementation, Evaluation"],
        correctAnswer: 0,
        points: 1
      },
      {
        questionText: "Which of the following is a subjective data?",
        options: ["Blood pressure reading", "Patient's complaint of pain", "Temperature reading", "Lab results"],
        correctAnswer: 1,
        points: 1
      },
      {
        questionText: "What is the normal adult respiratory rate?",
        options: ["8-12 breaths/min", "12-20 breaths/min", "20-28 breaths/min", "28-36 breaths/min"],
        correctAnswer: 1,
        points: 1
      }
    ]
  },
  {
    title: "Pharmacology - Set 1",
    description: "Test your knowledge in Pharmacology. Contains 20 multiple choice questions.",
    isPremium: false,
    questions: [
      {
        questionText: "What does the abbreviation 'PO' mean?",
        options: ["By mouth", "Intravenous", "Intramuscular", "Subcutaneous"],
        correctAnswer: 0,
        points: 1
      },
      {
        questionText: "Which route of administration has the fastest onset of action?",
        options: ["Oral", "Intravenous", "Intramuscular", "Subcutaneous"],
        correctAnswer: 1,
        points: 1
      },
      {
        questionText: "What is the antidote for Warfarin?",
        options: ["Naloxone", "Flumazenil", "Vitamin K", "Activated charcoal"],
        correctAnswer: 2,
        points: 1
      },
      {
        questionText: "Which class of medication is used to treat high blood pressure?",
        options: ["Antibiotics", "Antihypertensives", "Antifungals", "Antivirals"],
        correctAnswer: 1,
        points: 1
      },
      {
        questionText: "What does 'PRN' mean in medication administration?",
        options: ["As needed", "Three times daily", "Before meals", "After meals"],
        correctAnswer: 0,
        points: 1
      }
    ]
  }
];

async function importData() {
  try {
    // Clear existing quizzes
    await Quiz.deleteMany({});
    console.log('Cleared existing quizzes');
    
    // Insert sample quizzes
    await Quiz.insertMany(sampleQuizzes);
    console.log(`✅ Added ${sampleQuizzes.length} quizzes successfully!`);
    
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

importData();