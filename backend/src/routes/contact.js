// src/routes/contact.js
const express = require('express');
const { Contact } = require('../models');
const { getContactEmailTemplate, sendMarketingEmail } = require('../utils');
const SibApiV3Sdk = require('sib-api-v3-sdk');

const router = express.Router();

router.post('/', async (req, res) => {
  try {
    const { name, email, message } = req.body;
    const contact = new Contact({ name, email, message });
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