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
  // If SMTP is not fully configured (no host or no credentials when host is set), log to console
  if (!env.SMTP_HOST || !transporter || !env.SMTP_USER || !env.SMTP_PASS) {
    console.log('[DEV MAILER] Email logged to console:');
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

  try {
    return await transporter.sendMail(mailOptions);
  } catch (err) {
    console.warn(`[Mailer] Failed to send email via SMTP (${err.message}). Logging to console:`);
    console.log(`To: ${to}`);
    console.log(`Subject: ${subject}`);
    console.log(`Body: ${html || text}`);
    return { messageId: 'dev-fallback-mode', accepted: [to] };
  }
};

module.exports = {
  sendMail,
};

