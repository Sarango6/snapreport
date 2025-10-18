const nodemailer = require('nodemailer');
const twilio = require('twilio');

// Nodemailer transporter (use .env config) - example using Gmail SMTP
const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST || 'smtp.gmail.com',
  port: process.env.EMAIL_PORT || 587,
  secure: false,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

// Twilio client (requires account)
let twClient = null;
if (process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN) {
  twClient = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
}

async function sendEmail(to, subject, text, html) {
  try {
    const info = await transporter.sendMail({ from: process.env.EMAIL_USER, to, subject, text, html });
    return info;
  } catch (err) {
    console.error('Email error', err);
    return null;
  }
}

async function sendSMS(to, body) {
  if (!twClient) { console.warn('Twilio not configured'); return null; }
  try {
    const msg = await twClient.messages.create({ body, from: process.env.TWILIO_PHONE_NUMBER, to });
    return msg;
  } catch (err) { console.error('SMS error', err); return null; }
}

module.exports = { sendEmail, sendSMS };
