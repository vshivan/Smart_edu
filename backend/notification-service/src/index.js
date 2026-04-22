require('dotenv').config();
const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const nodemailer = require('nodemailer');
const { Pool } = require('pg');
const { authenticate, authorize } = require('../../shared/middleware/auth');
const { sendSuccess } = require('../../shared/utils/response');
const { errorHandler, notFound } = require('../../shared/middleware/errorHandler');
const logger = require('../../shared/utils/logger');

const app = express();
const PORT = process.env.NOTIFICATION_SERVICE_PORT || 3010;
const pool = new Pool({ connectionString: process.env.DATABASE_URL });

const mailer = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: parseInt(process.env.SMTP_PORT) || 587,
  auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
});

app.use(helmet());
app.use(cors({ origin: process.env.ALLOWED_ORIGINS?.split(','), credentials: true }));
app.use(express.json());

app.get('/health', (_, res) => res.json({ status: 'ok', service: 'notification-service' }));

// Get my notifications
app.get('/notifications', authenticate, async (req, res, next) => {
  try {
    const { rows } = await pool.query(
      'SELECT * FROM notifications WHERE user_id = $1 ORDER BY created_at DESC LIMIT 50',
      [req.user.id]
    );
    sendSuccess(res, rows);
  } catch(e) { next(e); }
});

// Mark read
app.put('/notifications/:id/read', authenticate, async (req, res, next) => {
  try {
    await pool.query('UPDATE notifications SET is_read = true WHERE id = $1 AND user_id = $2', [req.params.id, req.user.id]);
    sendSuccess(res, null, 'Marked as read');
  } catch(e) { next(e); }
});

// Mark all read
app.put('/notifications/read-all', authenticate, async (req, res, next) => {
  try {
    await pool.query('UPDATE notifications SET is_read = true WHERE user_id = $1', [req.user.id]);
    sendSuccess(res, null, 'All marked as read');
  } catch(e) { next(e); }
});

// Internal: create notification (called by other services)
app.post('/notifications/internal/create', async (req, res, next) => {
  try {
    const { user_id, type, title, message, metadata, send_email, email } = req.body;
    const { rows } = await pool.query(
      'INSERT INTO notifications (user_id, type, title, message, metadata) VALUES ($1,$2,$3,$4,$5) RETURNING *',
      [user_id, type, title, message, JSON.stringify(metadata || {})]
    );

    if (send_email && email) {
      await mailer.sendMail({
        from: `"SmartEduLearn" <${process.env.SMTP_FROM}>`,
        to: email,
        subject: title,
        html: `<div style="font-family:sans-serif;max-width:600px;margin:auto">
          <h2 style="color:#6366f1">${title}</h2>
          <p>${message}</p>
          <hr/>
          <small>SmartEduLearn — Your AI Learning Companion</small>
        </div>`,
      }).catch((e) => logger.warn('Email send failed', e));
    }

    sendSuccess(res, rows[0]);
  } catch(e) { next(e); }
});

// Admin broadcast
app.post('/notifications/broadcast', authenticate, authorize('admin'), async (req, res, next) => {
  try {
    const { title, message, role } = req.body;
    const condition = role ? 'WHERE role = $3' : '';
    const params = role ? [title, message, role] : [title, message];

    await pool.query(
      `INSERT INTO notifications (user_id, type, title, message)
       SELECT id, 'announcement', $1, $2 FROM users ${condition}`,
      params
    );
    sendSuccess(res, null, 'Broadcast sent');
  } catch(e) { next(e); }
});

app.use(notFound);
app.use(errorHandler);

app.listen(PORT, () => logger.info(`Notification service → port ${PORT}`));
module.exports = app;
