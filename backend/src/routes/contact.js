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

    let userId = null;
    try {
      const authHeader = req.headers.authorization;
      if (authHeader && authHeader.startsWith('Bearer ')) {
        const token = authHeader.split(' ')[1];
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'elite_secret_key_2024');
        const user = await User.findById(decoded.userId).select('_id');
        if (user) userId = user._id;
      }
    } catch (tokenError) {
    }

    const contact = new Contact({
      userId,
      name,
      email,
      message
    });
    await contact.save();

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