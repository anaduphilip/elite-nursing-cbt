// src/utils/email.js
const SibApiV3Sdk = require('sib-api-v3-sdk');
const axios = require('axios');

const defaultClient = SibApiV3Sdk.ApiClient.instance;
const apiKey = defaultClient.authentications['api-key'];
apiKey.apiKey = process.env.BREVO_API_KEY;

const apiInstance = new SibApiV3Sdk.TransactionalEmailsApi();

const getEmailTemplate = (name, otp, type) => {
  const year = new Date().getFullYear();

  const emailContent = type === 'verification'
    ? {
        title: 'Verify Your Email Address',
        message: `Thank you for choosing ELITE Nursing & Midwifery CBT. Please use the verification code below to complete your registration.`,
        note: 'This code will expire in 10 minutes.'
      }
    : {
        title: 'Reset Your Password',
        message: `We received a request to reset your password. Use the verification code below to create a new password.`,
        note: 'If you did not request this, please ignore this email.'
      };

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${emailContent.title} - ELITE Nursing CBT</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #f0f7f4; }
    .container { max-width: 550px; margin: 0 auto; padding: 20px; }
    .email-card { background-color: #ffffff; border-radius: 20px; overflow: hidden; box-shadow: 0 10px 35px rgba(0,0,0,0.1); }
    .header { background: linear-gradient(135deg, #1e3c72 0%, #2a5298 100%); padding: 30px 20px; text-align: center; }
    .header h1 { color: #ffffff; font-size: 22px; margin: 0; }
    .header p { color: rgba(255,255,255,0.9); font-size: 12px; margin: 8px 0 0; }
    .content { padding: 30px 25px; }
    .greeting { font-size: 18px; font-weight: 600; color: #1e3c72; margin-bottom: 15px; }
    .message { color: #4a5568; font-size: 15px; line-height: 1.6; margin-bottom: 25px; }
    .code-container { background: linear-gradient(135deg, #f0f7f4 0%, #e8f0ea 100%); border-radius: 16px; padding: 25px 20px; text-align: center; margin: 25px 0; }
    .code { font-size: 42px; font-weight: 800; letter-spacing: 12px; color: #1e3c72; font-family: monospace; background: white; display: inline-block; padding: 12px 20px; border-radius: 12px; }
    .expiry-note { font-size: 12px; color: #8b9a8b; margin-top: 12px; }
    .footer { background-color: #f8f9fa; padding: 20px 25px; text-align: center; border-top: 1px solid #e2e8f0; }
    .footer p { color: #94a3b8; font-size: 11px; margin: 5px 0; }
    @media (max-width: 480px) { .code { font-size: 28px; letter-spacing: 8px; padding: 10px 15px; } }
  </style>
</head>
<body>
  <div class="container">
    <div class="email-card">
      <div class="header">
        <h1>ELITE NURSING & MIDWIFERY CBT</h1>
        <p>Computer Based Testing Platform</p>
      </div>
      <div class="content">
        <div class="greeting">Dear ${name || 'Valued User'},</div>
        <div class="message">${emailContent.message}</div>
        <div class="code-container">
          <div class="code">${otp}</div>
          <div class="expiry-note">⏰ ${emailContent.note}</div>
        </div>
        <div class="message" style="font-size: 13px;">If you didn't request this, please ignore this email.</div>
      </div>
      <div class="footer">
        <p>© ${year} ELITE Nursing & Midwifery CBT. All rights reserved.</p>
        <p>Empowering nursing and midwifery excellence.</p>
      </div>
    </div>
  </div>
</body>
</html>`;
};

const getMarketingEmailTemplate = (name, templateType, customMessage = null) => {
  const year = new Date().getFullYear();

  let subject = '';
  let body = '';
  let buttonText = '';
  let buttonLink = 'https://elite-nursing-cbt.vercel.app/get-premium';

  switch (templateType) {
    case 'upgrade':
      subject = 'Upgrade to Premium – Unlock All Exams! 🚀';
      body = `
        <p>You've been crushing it with our free exams – great job! 🎉</p>
        <p>Imagine what you could achieve with <strong>full, unlimited access</strong> to all our premium content.</p>
        <p><strong>Upgrade to Premium today and get:</strong></p>
        <ul>
          <li>✅ Unlimited access to all <strong>30,000+ questions</strong></li>
          <li>✅ Retake any exam as many times as you want</li>
          <li>✅ Weekly premium quizzes with leaderboard</li>
          <li>✅ Detailed answer explanations</li>
          <li>✅ And much more!</li>
        </ul>
        <div style="text-align:center;margin:30px 0;">
          <a href="${buttonLink}" style="background:#ff9800;color:white;padding:14px 32px;text-decoration:none;border-radius:50px;font-weight:bold;font-size:16px;">⭐ Upgrade Now</a>
        </div>
        <p>Don't stop now – unlock your full potential!</p>
      `;
      break;

    case 'reminder':
      subject = 'Ready for More? 🎯 Unlock Premium Exams';
      body = `
        <p>You've already shown great dedication by using ELITE Nursing CBT.</p>
        <p>With <strong>Premium access</strong>, you'll never have to worry about exam limits again. Tackle every topic, master every subject.</p>
        <p><strong>Here's what you're missing:</strong></p>
        <ul>
          <li>✅ Unlimited exam attempts</li>
          <li>✅ All premium categories unlocked</li>
          <li>✅ Weekly premium quizzes</li>
          <li>✅ Leaderboard rankings</li>
        </ul>
        <div style="text-align:center;margin:30px 0;">
          <a href="${buttonLink}" style="background:#ff9800;color:white;padding:14px 32px;text-decoration:none;border-radius:50px;font-weight:bold;font-size:16px;">⭐ See Premium Plans</a>
        </div>
        <p>Your success is our mission!</p>
      `;
      break;

    case 'winback':
      subject = 'We Miss You! Come Back to ELITE Nursing CBT 💙';
      body = `
        <p>It's been a while since you last visited ELITE Nursing CBT.</p>
        <p>We've added new questions, improved our platform, and there's so much more waiting for you!</p>
        <p><strong>Don't miss out on:</strong></p>
        <ul>
          <li>✅ New 5,000+ practice questions</li>
          <li>✅ Weekly premium quizzes</li>
          <li>✅ Improved user experience</li>
          <li>✅ And much more!</li>
        </ul>
        <div style="text-align:center;margin:30px 0;">
          <a href="https://elite-nursing-cbt.vercel.app" style="background:#1e3c72;color:white;padding:14px 32px;text-decoration:none;border-radius:50px;font-weight:bold;font-size:16px;">📚 Start Studying Now</a>
        </div>
        <p>We can't wait to see you again!</p>
      `;
      break;

    default:
      subject = 'Special Offer from ELITE Nursing CBT';
      body = `
        <p>${customMessage || 'Check out our latest updates and premium features!'}</p>
        <div style="text-align:center;margin:30px 0;">
          <a href="${buttonLink}" style="background:#ff9800;color:white;padding:14px 32px;text-decoration:none;border-radius:50px;font-weight:bold;font-size:16px;">⭐ Learn More</a>
        </div>
      `;
  }

  if (customMessage) {
    body = `
      <p>${customMessage}</p>
      <div style="text-align:center;margin:30px 0;">
        <a href="${buttonLink}" style="background:#ff9800;color:white;padding:14px 32px;text-decoration:none;border-radius:50px;font-weight:bold;font-size:16px;">⭐ Upgrade Now</a>
      </div>
    `;
  }

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${subject} - ELITE Nursing CBT</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #f0f7f4; }
    .container { max-width: 550px; margin: 0 auto; padding: 20px; }
    .email-card { background-color: #ffffff; border-radius: 20px; overflow: hidden; box-shadow: 0 10px 35px rgba(0,0,0,0.1); }
    .header { background: linear-gradient(135deg, #1e3c72 0%, #2a5298 100%); padding: 30px 20px; text-align: center; }
    .header h1 { color: #ffffff; font-size: 22px; margin: 0; }
    .header p { color: rgba(255,255,255,0.9); font-size: 12px; margin: 8px 0 0; }
    .content { padding: 30px 25px; }
    .greeting { font-size: 18px; font-weight: 600; color: #1e3c72; margin-bottom: 15px; }
    .message { color: #4a5568; font-size: 15px; line-height: 1.7; margin-bottom: 25px; }
    ul { padding-left: 20px; margin: 10px 0; }
    li { margin-bottom: 6px; }
    .footer { background-color: #f8f9fa; padding: 20px 25px; text-align: center; border-top: 1px solid #e2e8f0; }
    .footer p { color: #94a3b8; font-size: 11px; margin: 5px 0; }
  </style>
</head>
<body>
  <div class="container">
    <div class="email-card">
      <div class="header">
        <h1>ELITE NURSING & MIDWIFERY CBT</h1>
        <p>Computer Based Testing Platform</p>
      </div>
      <div class="content">
        <div class="greeting">Dear ${name || 'Valued User'},</div>
        <div class="message">${body}</div>
        <p style="color: #4a5568; font-size: 15px;">Best regards,<br/>ELITE Nursing CBT Team</p>
      </div>
      <div class="footer">
        <p>© ${year} ELITE Nursing & Midwifery CBT. All rights reserved.</p>
        <p>Empowering nursing and midwifery excellence.</p>
      </div>
    </div>
  </div>
</body>
</html>`;
};

const getReminderEmailTemplate = (name, plan, daysLeft, hoursLeft) => {
  const year = new Date().getFullYear();

  let message = '';
  let subject = '⏰ Premium Plan Reminder';
  let urgency = '';

  if (hoursLeft !== undefined && hoursLeft <= 24) {
    message = `Your ${plan} plan expires in <strong>${Math.ceil(hoursLeft)} hours</strong>. Renew now to keep access!`;
    urgency = 'urgent';
  } else if (daysLeft !== undefined && daysLeft <= 3) {
    message = `Your ${plan} plan expires in <strong>${Math.ceil(daysLeft)} days</strong>. Renew now to keep access!`;
    urgency = 'warning';
  } else if (daysLeft !== undefined) {
    message = `Your ${plan} plan expires in <strong>${Math.ceil(daysLeft)} days</strong>. Don't lose access – renew today!`;
    urgency = 'info';
  } else {
    subject = '⏰ Your Premium Plan Has Expired';
    message = `Your ${plan} plan has expired. <strong>Renew now to regain full access</strong> to all premium content!`;
    urgency = 'critical';
  }

  const buttonColor = urgency === 'critical' ? '#dc3545' : '#ff9800';

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${subject} - ELITE Nursing CBT</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #f0f7f4; }
    .container { max-width: 550px; margin: 0 auto; padding: 20px; }
    .email-card { background-color: #ffffff; border-radius: 20px; overflow: hidden; box-shadow: 0 10px 35px rgba(0,0,0,0.1); }
    .header { background: linear-gradient(135deg, #1e3c72 0%, #2a5298 100%); padding: 30px 20px; text-align: center; }
    .header h1 { color: #ffffff; font-size: 22px; margin: 0; }
    .header p { color: rgba(255,255,255,0.9); font-size: 12px; margin: 8px 0 0; }
    .content { padding: 30px 25px; }
    .greeting { font-size: 18px; font-weight: 600; color: #1e3c72; margin-bottom: 15px; }
    .reminder-box { background: #fff3cd; border-left: 6px solid #ffc107; padding: 16px 20px; border-radius: 8px; margin: 20px 0; }
    .reminder-box p { margin: 0; color: #856404; }
    .footer { background-color: #f8f9fa; padding: 20px 25px; text-align: center; border-top: 1px solid #e2e8f0; }
    .footer p { color: #94a3b8; font-size: 11px; margin: 5px 0; }
    .btn { display: inline-block; padding: 14px 32px; text-decoration: none; border-radius: 50px; font-weight: bold; font-size: 16px; color: white; background: ${buttonColor}; }
  </style>
</head>
<body>
  <div class="container">
    <div class="email-card">
      <div class="header">
        <h1>ELITE NURSING & MIDWIFERY CBT</h1>
        <p>Computer Based Testing Platform</p>
      </div>
      <div class="content">
        <div class="greeting">Dear ${name || 'Valued User'},</div>
        <div class="reminder-box">
          <p style="font-weight:600;">⏰ Premium Plan Update</p>
          <p style="margin-top:6px;">${message}</p>
        </div>
        <p style="color: #4a5568; font-size: 15px; text-align:center; margin: 20px 0;">
          <a href="https://elite-nursing-cbt.vercel.app/get-premium" class="btn">Renew Now →</a>
        </p>
        <p style="color: #4a5568; font-size: 15px;">Best regards,<br/>ELITE Nursing CBT Team</p>
      </div>
      <div class="footer">
        <p>© ${year} ELITE Nursing & Midwifery CBT. All rights reserved.</p>
        <p>Empowering nursing and midwifery excellence.</p>
      </div>
    </div>
  </div>
</body>
</html>`;
};

const sendEmail = async (to, name, otp, type) => {
  try {
    const htmlContent = getEmailTemplate(name, otp, type);
    const textContent = type === 'verification'
      ? `Your verification code is: ${otp}\n\nThis code expires in 10 minutes.`
      : `Your password reset code is: ${otp}\n\nThis code expires in 10 minutes.`;

    const subject = type === 'verification'
      ? 'Verify Your Email - ELITE Nursing CBT'
      : 'Reset Your Password - ELITE Nursing CBT';

    const sendSmtpEmail = new SibApiV3Sdk.SendSmtpEmail();
    sendSmtpEmail.to = [{ email: to }];
    sendSmtpEmail.sender = { email: 'elitenursingcbt@gmail.com', name: 'ELITE Nursing CBT' };
    sendSmtpEmail.subject = subject;
    sendSmtpEmail.textContent = textContent;
    sendSmtpEmail.htmlContent = htmlContent;

    await apiInstance.sendTransacEmail(sendSmtpEmail);
    console.log('✅ Email sent to:', to);
    return true;
  } catch (error) {
    console.error('❌ Email failed:', error.response?.body || error.message);
    return false;
  }
};

const sendMarketingEmail = async (to, name, templateType, customSubject = null, customMessage = null) => {
  try {
    const htmlContent = getMarketingEmailTemplate(name, templateType, customMessage);
    const subject = customSubject || (() => {
      switch (templateType) {
        case 'upgrade': return 'Upgrade to Premium – Unlock All Exams! 🚀';
        case 'reminder': return 'Ready for More? 🎯 Unlock Premium Exams';
        case 'winback': return 'We Miss You! Come Back to ELITE Nursing CBT 💙';
        default: return 'Special Offer from ELITE Nursing CBT';
      }
    })();

    const textContent = `Hi ${name},\n\n${htmlContent.replace(/<[^>]+>/g, '').trim().slice(0, 500)}...`; // fallback

    const sendSmtpEmail = new SibApiV3Sdk.SendSmtpEmail();
    sendSmtpEmail.to = [{ email: to }];
    sendSmtpEmail.sender = { email: 'elitenursingcbt@gmail.com', name: 'ELITE Nursing CBT' };
    sendSmtpEmail.subject = subject;
    sendSmtpEmail.textContent = textContent;
    sendSmtpEmail.htmlContent = htmlContent;

    await apiInstance.sendTransacEmail(sendSmtpEmail);
    console.log(`✅ Marketing email sent to ${to}`);
    return true;
  } catch (error) {
    console.error('❌ Marketing email failed:', error.response?.body || error.message);
    return false;
  }
};

const sendReminderEmail = async (to, name, plan, daysLeft, hoursLeft) => {
  try {
    const htmlContent = getReminderEmailTemplate(name, plan, daysLeft, hoursLeft);
    const subject = (hoursLeft !== undefined && hoursLeft <= 24) ? '⏰ Your Premium Plan Expires Soon!' :
                    (daysLeft !== undefined && daysLeft <= 3) ? '⏰ Your Premium Plan Expires Soon!' :
                    '⏰ Premium Plan Reminder';

    const textContent = `Dear ${name},\n\nYour ${plan} plan is expiring soon. Renew now to keep access.\n\nVisit https://elite-nursing-cbt.vercel.app/get-premium`;

    const sendSmtpEmail = new SibApiV3Sdk.SendSmtpEmail();
    sendSmtpEmail.to = [{ email: to }];
    sendSmtpEmail.sender = { email: 'elitenursingcbt@gmail.com', name: 'ELITE Nursing CBT' };
    sendSmtpEmail.subject = subject;
    sendSmtpEmail.textContent = textContent;
    sendSmtpEmail.htmlContent = htmlContent;

    await apiInstance.sendTransacEmail(sendSmtpEmail);
    console.log(`✅ Reminder email sent to ${to}`);
    return true;
  } catch (error) {
    console.error('❌ Reminder email failed:', error);
    return false;
  }
};

const getContactEmailTemplate = (name, email, message) => {
  const year = new Date().getFullYear();
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>New Contact Message - ELITE Nursing CBT</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #f0f7f4; }
    .container { max-width: 550px; margin: 0 auto; padding: 20px; }
    .email-card { background-color: #ffffff; border-radius: 20px; overflow: hidden; box-shadow: 0 10px 35px rgba(0,0,0,0.1); }
    .header { background: linear-gradient(135deg, #1e3c72 0%, #2a5298 100%); padding: 30px 20px; text-align: center; }
    .header h1 { color: white; font-size: 22px; }
    .content { padding: 30px 25px; }
    .message-box { background: #f8f9fa; border-radius: 12px; padding: 20px; margin: 20px 0; border-left: 4px solid #1e3c72; }
    .footer { background-color: #f8f9fa; padding: 20px; text-align: center; border-top: 1px solid #e2e8f0; }
    .footer p { color: #94a3b8; font-size: 11px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="email-card">
      <div class="header">
        <h1>ELITE NURSING & MIDWIFERY CBT</h1>
        <p>Computer Based Testing Platform</p>
      </div>
      <div class="content">
        <h2>New Contact Message</h2>
        <p><strong>From:</strong> ${name} (${email})</p>
        <div class="message-box">
          <p><strong>Message:</strong></p>
          <p style="margin-top: 10px;">${message}</p>
        </div>
      </div>
      <div class="footer">
        <p>© ${year} ELITE Nursing & Midwifery CBT. All rights reserved.</p>
      </div>
    </div>
  </div>
</body>
</html>`;
};

const getReplyEmailTemplate = (name, originalMessage, reply) => {
  const year = new Date().getFullYear();
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Response to your message - ELITE Nursing CBT</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #f0f7f4; }
    .container { max-width: 550px; margin: 0 auto; padding: 20px; }
    .email-card { background-color: #ffffff; border-radius: 20px; overflow: hidden; box-shadow: 0 10px 35px rgba(0,0,0,0.1); }
    .header { background: linear-gradient(135deg, #1e3c72 0%, #2a5298 100%); padding: 30px 20px; text-align: center; }
    .header h1 { color: white; font-size: 22px; }
    .content { padding: 30px 25px; }
    .original-box { background: #f8f9fa; border-radius: 12px; padding: 15px; margin: 15px 0; border-left: 4px solid #6c757d; }
    .reply-box { background: #e8f5e9; border-radius: 12px; padding: 15px; margin: 15px 0; border-left: 4px solid #28a745; }
    .footer { background-color: #f8f9fa; padding: 20px; text-align: center; border-top: 1px solid #e2e8f0; }
    .footer p { color: #94a3b8; font-size: 11px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="email-card">
      <div class="header">
        <h1>ELITE NURSING & MIDWIFERY CBT</h1>
        <p>Computer Based Testing Platform</p>
      </div>
      <div class="content">
        <h2>Response to Your Message</h2>
        <p>Dear ${name},</p>
        <p>Thank you for reaching out to us. Here is our response:</p>
        <div class="reply-box">
          <p><strong>Our Response:</strong></p>
          <p style="margin-top: 10px;">${reply}</p>
        </div>
        <div class="original-box">
          <p><strong>Your Original Message:</strong></p>
          <p style="margin-top: 10px;">${originalMessage}</p>
        </div>
        <p>If you have any further questions, feel free to reach out again.</p>
        <p>Best regards,<br/>ELITE Nursing CBT Support Team</p>
      </div>
      <div class="footer">
        <p>© ${year} ELITE Nursing & Midwifery CBT. All rights reserved.</p>
      </div>
    </div>
  </div>
</body>
</html>`;
};

module.exports = {
  sendEmail,
  getContactEmailTemplate,
  getReplyEmailTemplate,
  sendMarketingEmail,
  sendReminderEmail
};