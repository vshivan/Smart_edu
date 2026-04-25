const nodemailer = require('nodemailer');
const logger = require('../utils/logger');

// ─── Transport ───────────────────────────────────────────────────────────────
// Uses Gmail + App Password (configured in .env).
// Falls back to console logging in dev when credentials are missing —
// so the app never crashes just because email isn't configured.

let transporter;

const getTransporter = () => {
  if (transporter) return transporter;

  if (process.env.GMAIL_USER && process.env.GMAIL_APP_PASSWORD) {
    transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.GMAIL_USER,
        pass: process.env.GMAIL_APP_PASSWORD,
      },
    });
    logger.info('Email: Gmail transport configured');
  } else {
    // Dev fallback — log emails to console instead of sending
    transporter = nodemailer.createTransport({ jsonTransport: true });
    logger.warn('Email: GMAIL_USER/GMAIL_APP_PASSWORD not set — emails will be logged to console only');
  }

  return transporter;
};

/**
 * Send an email. Logs to console if transport is not configured.
 */
const sendMail = async ({ to, subject, html, text }) => {
  const t = getTransporter();
  const from = process.env.GMAIL_USER
    ? `"SmartEduLearn" <${process.env.GMAIL_USER}>`
    : '"SmartEduLearn" <noreply@smartedulear.com>';

  try {
    const info = await t.sendMail({ from, to, subject, html, text });

    if (!process.env.GMAIL_USER) {
      // jsonTransport — log the email content so devs can see it
      logger.info(`[DEV EMAIL] To: ${to} | Subject: ${subject}`);
      logger.info(`[DEV EMAIL] Body: ${text || subject}`);
    } else {
      logger.info(`Email sent to ${to}: ${info.messageId}`);
    }

    return info;
  } catch (err) {
    // Email failure is non-fatal — log and continue
    logger.error(`Email send failed to ${to}:`, err.message);
    throw err;
  }
};

// ─── Email Templates ─────────────────────────────────────────────────────────

/**
 * Send password reset email with a secure link.
 * @param {string} to - recipient email
 * @param {string} firstName - recipient first name
 * @param {string} resetToken - raw (unhashed) reset token
 */
const sendPasswordResetEmail = async (to, firstName, resetToken) => {
  const resetUrl = `${process.env.FRONTEND_URL}/reset-password?token=${resetToken}`;
  const expiryMinutes = 15;

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Reset Your Password</title>
</head>
<body style="margin:0;padding:0;background:#0f0f1a;font-family:Inter,system-ui,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#0f0f1a;padding:40px 20px;">
    <tr>
      <td align="center">
        <table width="560" cellpadding="0" cellspacing="0" style="background:#1a1a2e;border-radius:16px;border:1px solid #2a2a3e;overflow:hidden;">

          <!-- Header -->
          <tr>
            <td style="background:linear-gradient(135deg,#4f46e5,#7c3aed);padding:32px;text-align:center;">
              <h1 style="margin:0;color:#fff;font-size:24px;font-weight:700;">🎓 SmartEduLearn</h1>
              <p style="margin:8px 0 0;color:rgba(255,255,255,0.8);font-size:14px;">AI-Powered Learning Platform</p>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding:40px 32px;">
              <h2 style="margin:0 0 16px;color:#fff;font-size:20px;">Reset Your Password</h2>
              <p style="margin:0 0 24px;color:#94a3b8;font-size:15px;line-height:1.6;">
                Hi ${firstName}, we received a request to reset your password.
                Click the button below to choose a new one.
              </p>

              <!-- CTA Button -->
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td align="center" style="padding:8px 0 32px;">
                    <a href="${resetUrl}"
                       style="display:inline-block;background:#4f46e5;color:#fff;text-decoration:none;
                              font-size:15px;font-weight:600;padding:14px 32px;border-radius:10px;">
                      Reset Password
                    </a>
                  </td>
                </tr>
              </table>

              <p style="margin:0 0 8px;color:#64748b;font-size:13px;">
                This link expires in <strong style="color:#94a3b8;">${expiryMinutes} minutes</strong>.
              </p>
              <p style="margin:0 0 24px;color:#64748b;font-size:13px;">
                If you didn't request this, you can safely ignore this email — your password won't change.
              </p>

              <!-- Fallback link -->
              <div style="background:#0f0f1a;border-radius:8px;padding:16px;word-break:break-all;">
                <p style="margin:0 0 6px;color:#64748b;font-size:12px;">Or copy this link into your browser:</p>
                <a href="${resetUrl}" style="color:#818cf8;font-size:12px;">${resetUrl}</a>
              </div>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding:24px 32px;border-top:1px solid #2a2a3e;text-align:center;">
              <p style="margin:0;color:#475569;font-size:12px;">
                © ${new Date().getFullYear()} SmartEduLearn. All rights reserved.
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

  const text = `Hi ${firstName},\n\nReset your SmartEduLearn password here:\n${resetUrl}\n\nThis link expires in ${expiryMinutes} minutes.\n\nIf you didn't request this, ignore this email.`;

  return sendMail({ to, subject: 'Reset your SmartEduLearn password', html, text });
};

/**
 * Send welcome email after registration.
 */
const sendWelcomeEmail = async (to, firstName) => {
  const loginUrl = `${process.env.FRONTEND_URL}/login`;

  const html = `
<!DOCTYPE html>
<html>
<body style="margin:0;padding:0;background:#0f0f1a;font-family:Inter,system-ui,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#0f0f1a;padding:40px 20px;">
    <tr>
      <td align="center">
        <table width="560" cellpadding="0" cellspacing="0" style="background:#1a1a2e;border-radius:16px;border:1px solid #2a2a3e;overflow:hidden;">
          <tr>
            <td style="background:linear-gradient(135deg,#4f46e5,#7c3aed);padding:32px;text-align:center;">
              <h1 style="margin:0;color:#fff;font-size:24px;font-weight:700;">🎓 SmartEduLearn</h1>
            </td>
          </tr>
          <tr>
            <td style="padding:40px 32px;">
              <h2 style="margin:0 0 16px;color:#fff;font-size:20px;">Welcome, ${firstName}! 🚀</h2>
              <p style="margin:0 0 24px;color:#94a3b8;font-size:15px;line-height:1.6;">
                Your account is ready. Start generating AI-powered courses, earn XP, and level up your skills.
              </p>
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td align="center">
                    <a href="${loginUrl}"
                       style="display:inline-block;background:#4f46e5;color:#fff;text-decoration:none;
                              font-size:15px;font-weight:600;padding:14px 32px;border-radius:10px;">
                      Start Learning
                    </a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <tr>
            <td style="padding:24px 32px;border-top:1px solid #2a2a3e;text-align:center;">
              <p style="margin:0;color:#475569;font-size:12px;">© ${new Date().getFullYear()} SmartEduLearn</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

  const text = `Welcome to SmartEduLearn, ${firstName}!\n\nStart learning: ${loginUrl}`;

  return sendMail({ to, subject: `Welcome to SmartEduLearn, ${firstName}!`, html, text });
};

module.exports = { sendMail, sendPasswordResetEmail, sendWelcomeEmail };
