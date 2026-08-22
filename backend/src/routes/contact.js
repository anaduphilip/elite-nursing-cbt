// src/routes/contact.js
const express = require('express');
const jwt = require('jsonwebtoken');
const { Contact, User } = require('../models');
const { getContactEmailTemplate } = require('../utils');
const SibApiV3Sdk = require('sib-api-v3-sdk');

const router = express.Router();

router.post('/', async (req, res) => {
  try {
    const { name, email, message } = req.body;

    // Optional authentication – extract userId if token is valid
    let userId = null;
    try {
      const authHeader = req.headers.authorization;
      if (authHeader && authHeader.startsWith('Bearer ')) {
        const token = authHeader.split(' ')[1];
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'elite_secret_key_2024');
        const user = await User.findById(decoded.userId).select('_id');
        if (user) userId = user._id;
      }
    } catch (e) {
      // silently ignore
    }

    // Normalise email to lowercase for consistent matching
    const contact = new Contact({
      userId,
      name: name.trim(),
      email: email.trim().toLowerCase(),
      message: message.trim()
    });
    await contact.save();

    // Send email to admin (unchanged)
    const htmlContent = getContactEmailTemplate(name, email, message);
    const sendSmtpEmail = new SibApiV3Sdk.SendSmtpEmail();
    sendSmtpEmail.to = [{ email: 'elitenursingcbt@gmail.com' }];
    sendSmtpEmail.sender = { email: 'elitenursingcbt@gmail.com', name: 'ELITE Nursing CBT' };
    sendSmtpEmail.subject = `New Contact Message from ${name}`;
    sendSmtpEmail.textContent = `From: ${name} (${email})\n\nMessage: ${message}`;
    sendSmtpEmail.htmlContent = htmlContent;
    await new SibApiV3Sdk.TransactionalEmailsApi().sendTransacEmail(sendSmtpEmail);

    res.json({ success: true });
  } catch (error) {
    console.error('Contact error:', error);
    res.status(500).json({ error: 'Failed to send message' });
  }
});

module.exports = router;