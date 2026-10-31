const nodemailer = require('nodemailer');
const env = require('../config/env');

let transporter = null;

if (env.SMTP_HOST) {
  transporter = nodemailer.createTransport({
    host: env.SMTP_HOST,
    port: env.SMTP_PORT,
    secure: env.SMTP_PORT === 465,
    auth: env.SMTP_USER
      ? {
          user: env.SMTP_USER,
          pass: env.SMTP_PASS,
        }
      : undefined,
  });
}

/**
 * Sends an email, or logs to console if SMTP_HOST is not configured
 * @param {{ to: string, subject: string, html: string, text?: string }} options
 */
const sendMail = async ({ to, subject, html, text }) => {
  if (!env.SMTP_HOST || !transporter) {
    console.log('[DEV MAILER] SMTP_HOST not set. Email logged to console:');
    console.log(`To: ${to}`);
    console.log(`Subject: ${subject}`);
    console.log(`Body: ${html || text}`);
    return { messageId: 'dev-console-mode', accepted: [to] };
  }

  const mailOptions = {
    from: env.MAIL_FROM,
    to,
    subject,
    html,
    text,
  };

  return transporter.sendMail(mailOptions);
};

module.exports = {
  sendMail,
};
