/**
 * Notification Routes — Nodemailer + Gmail
 *
 * Why Nodemailer + Gmail instead of Resend:
 *  - Completely free, no signup required
 *  - Works with any Gmail account
 *  - 500 emails/day on free Gmail
 *
 * Setup (2 minutes):
 *  1. Go to myaccount.google.com → Security → 2-Step Verification → ON
 *  2. myaccount.google.com → Security → App Passwords
 *  3. Select "Mail" + "Other" → Generate → copy 16-char password
 *  4. Set in .env:
 *       GMAIL_USER=your@gmail.com
 *       GMAIL_APP_PASSWORD=xxxx xxxx xxxx xxxx
 *
 * If no Gmail keys set → emails are logged to console (dev mode)
 */
const router       = require('express').Router();
const nodemailer   = require('nodemailer');
const { authenticate, authorize } = require('../middleware/auth');
const { sendSuccess } = require('../utils/response');
const { pool }     = require('../config/db');
const logger       = require('../utils/logger');

// ── Nodemailer transporter ────────────────────────────────────────────────────
let transporter;

const getTransporter = () => {
  if (transporter) return transporter;

  const gmailUser = process.env.GMAIL_USER;
  const gmailPass = process.env.GMAIL_APP_PASSWORD;

  if (gmailUser && gmailPass) {
    // Production: real Gmail sending
    transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: { user: gmailUser, pass: gmailPass },
    });
    logger.info(`📧 Email: Gmail (${gmailUser})`);
  } else {
    // Dev/test: log emails to console instead of sending
    transporter = nodemailer.createTransport({ jsonTransport: true });
    logger.warn('📧 Email: No GMAIL_USER set — emails will be logged to console only');
  }

  return transporter;
};

// ── Email helper ──────────────────────────────────────────────────────────────
const sendEmail = async ({ to, subject, html }) => {
  try {
    const t    = getTransporter();
    const from = process.env.GMAIL_USER
      ? `SmartEduLearn <${process.env.GMAIL_USER}>`
      : 'SmartEduLearn <noreply@smartedulear.com>';

    const info = await t.sendMail({ from, to, subject, html });

    if (process.env.GMAIL_USER) {
      logger.info(`✅ Email sent: "${subject}" → ${to}`);
    } else {
      // jsonTransport logs the email as JSON — useful for dev
      logger.info(`📧 [DEV EMAIL] To: ${to} | Subject: ${subject}`);
      logger.debug('Email body:', JSON.parse(info.message).text || subject);
    }
  } catch (e) {
    logger.warn(`⚠ Email failed: ${e.message}`);
    // Never throw — email failure should not break the main flow
  }
};

// ── Email template ────────────────────────────────────────────────────────────
const emailTemplate = (title, message, ctaText = null, ctaUrl = null) => `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
</head>
<body style="margin:0;padding:0;background:#f8fafc;font-family:Inter,system-ui,sans-serif;">
  <div style="max-width:560px;margin:40px auto;background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 6px rgba(0,0,0,0.07);">
    <div style="background:linear-gradient(135deg,#4f46e5,#6366f1);padding:32px 40px;text-align:center;">
      <h1 style="margin:0;color:#ffffff;font-size:22px;font-weight:700;">SmartEduLearn</h1>
      <p style="margin:6px 0 0;color:#c7d2fe;font-size:13px;">Your AI-Powered Learning Platform</p>
    </div>
    <div style="padding:36px 40px;">
      <h2 style="margin:0 0 12px;color:#0f172a;font-size:18px;font-weight:600;">${title}</h2>
      <p style="margin:0 0 24px;color:#475569;font-size:14px;line-height:1.7;">${message}</p>
      ${ctaText && ctaUrl ? `
      <div style="text-align:center;margin:28px 0;">
        <a href="${ctaUrl}" style="display:inline-block;background:#4f46e5;color:#ffffff;text-decoration:none;padding:12px 28px;border-radius:10px;font-size:14px;font-weight:600;">
          ${ctaText}
        </a>
      </div>` : ''}
    </div>
    <div style="padding:20px 40px;background:#f8fafc;border-top:1px solid #e2e8f0;text-align:center;">
      <p style="margin:0;color:#94a3b8;font-size:12px;">
        © 2026 SmartEduLearn ·
        <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}" style="color:#6366f1;text-decoration:none;">Visit Platform</a>
      </p>
    </div>
  </div>
</body>
</html>`;

// ── GET /notifications ────────────────────────────────────────────────────────
router.get('/', authenticate, async (req, res, next) => {
  try {
    const { rows } = await pool.query(
      'SELECT * FROM notifications WHERE user_id = $1 ORDER BY created_at DESC LIMIT 50',
      [req.user.id]
    );
    sendSuccess(res, rows);
  } catch (e) { next(e); }
});

// ── PUT /notifications/:id/read ───────────────────────────────────────────────
router.put('/:id/read', authenticate, async (req, res, next) => {
  try {
    await pool.query(
      'UPDATE notifications SET is_read = true WHERE id = $1 AND user_id = $2',
      [req.params.id, req.user.id]
    );
    sendSuccess(res, null, 'Marked as read');
  } catch (e) { next(e); }
});

// ── PUT /notifications/read-all ───────────────────────────────────────────────
router.put('/read-all', authenticate, async (req, res, next) => {
  try {
    await pool.query('UPDATE notifications SET is_read = true WHERE user_id = $1', [req.user.id]);
    sendSuccess(res, null, 'All marked as read');
  } catch (e) { next(e); }
});

// ── POST /notifications/internal/create ──────────────────────────────────────
router.post('/internal/create', async (req, res, next) => {
  try {
    const { user_id, type, title, message, metadata, send_email, email, cta_text, cta_url } = req.body;

    const { rows } = await pool.query(
      'INSERT INTO notifications (user_id, type, title, message, metadata) VALUES ($1,$2,$3,$4,$5) RETURNING *',
      [user_id, type, title, message, JSON.stringify(metadata || {})]
    );

    if (send_email && email) {
      await sendEmail({ to: email, subject: title, html: emailTemplate(title, message, cta_text, cta_url) });
    }

    sendSuccess(res, rows[0]);
  } catch (e) { next(e); }
});

// ── POST /notifications/send-email ───────────────────────────────────────────
router.post('/send-email', authenticate, authorize('admin'), async (req, res, next) => {
  try {
    const { to, subject, message, cta_text, cta_url } = req.body;
    if (!to || !subject || !message) throw new Error('to, subject, message are required');
    await sendEmail({ to, subject, html: emailTemplate(subject, message, cta_text, cta_url) });
    sendSuccess(res, null, 'Email sent');
  } catch (e) { next(e); }
});

// ── POST /notifications/broadcast ────────────────────────────────────────────
router.post('/broadcast', authenticate, authorize('admin'), async (req, res, next) => {
  try {
    const { title, message, role, send_email: sendEmails } = req.body;
    const condition = role ? 'WHERE role = $3' : '';
    const params    = role ? [title, message, role] : [title, message];

    await pool.query(
      `INSERT INTO notifications (user_id, type, title, message)
       SELECT id, 'announcement', $1, $2 FROM users ${condition}`,
      params
    );

    if (sendEmails) {
      const emailCondition = role ? 'WHERE role = $1' : '';
      const emailParams    = role ? [role] : [];
      const { rows: users } = await pool.query(
        `SELECT email, first_name FROM users ${emailCondition} LIMIT 500`,
        emailParams
      );
      for (const u of users) {
        await sendEmail({ to: u.email, subject: title, html: emailTemplate(title, message) });
        await new Promise(r => setTimeout(r, 100));  // rate limit: 10/sec
      }
    }

    sendSuccess(res, null, `Broadcast sent${sendEmails ? ' with emails' : ''}`);
  } catch (e) { next(e); }
});

// Export sendEmail for use in other routes
module.exports = router;
module.exports.sendEmail = sendEmail;
module.exports.emailTemplate = emailTemplate;
