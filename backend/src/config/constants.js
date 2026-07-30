// src/config/constants.js
module.exports = {
  allowedOrigins: [
    'https://elite-nursing-cbt.vercel.app',
    'http://localhost:5173',
    'http://localhost:5000',
    'https://elite-nursing-backend.onrender.com',
    'https://localhost',
    'http://localhost',
    'capacitor://localhost',
    'http://capacitor://localhost'
  ],
  JWT_SECRET: process.env.JWT_SECRET || 'elite_secret_key_2024'
};