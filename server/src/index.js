require('dotenv').config();
const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const { createServer } = require('http');
const { Server } = require('socket.io');
const rateLimit = require('express-rate-limit');
const passport = require('passport');

const logger = require('./utils/logger');
const { errorHandler, notFound } = require('./middleware/errorHandler');

// Import route modules
const authRoutes = require('./routes/auth.routes');
const courseRoutes = require('./routes/course.routes');
const aiRoutes = require('./routes/ai.routes');
const quizRoutes = require('./routes/quiz.routes');
const gamificationRoutes = require('./routes/gamification.routes');
const tutorRoutes = require('./routes/tutor.routes');
const paymentRoutes = require('./routes/payment.routes');
const notificationRoutes = require('./routes/notification.routes');
const adminRoutes = require('./routes/admin.routes');
const userRoutes = require('./routes/user.routes');
const { authenticate } = require('./middleware/auth');

// Initialize DB connection (PostgreSQL only — MongoDB removed)
require('./config/db');

// Initialize passport (Google OAuth)
require('./config/passport');

const app = express();
const httpServer = createServer(app);
const PORT = process.env.PORT || 3000;

// ─── TRUST PROXY (required when behind nginx) ─────────────────────────────
// Allows express-rate-limit and req.ip to work correctly behind nginx
app.set('trust proxy', 1);

// ─── SECURITY ────────────────────────────────────────────────────────────────
app.use(helmet());
app.use(cors({
  origin: process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:5173'],
  credentials: true,
}));

// ─── RATE LIMITING ───────────────────────────────────────────────────────────
const limiter = rateLimit({ 
  windowMs: 60_000, 
  max: process.env.NODE_ENV === 'test' ? 10000 : 100, 
  standardHeaders: true, 
  legacyHeaders: false 
});
const authLimiter = rateLimit({ 
  windowMs: 60_000, 
  max: process.env.NODE_ENV === 'test' ? 10000 : 10, 
  standardHeaders: true, 
  legacyHeaders: false 
});

app.use(limiter);
app.use('/auth', authLimiter);

// ─── MIDDLEWARE ──────────────────────────────────────────────────────────────
app.use(passport.initialize());

// Raw body for Razorpay webhook (signature verification needs raw body)
app.use('/payments/webhook', express.raw({ type: 'application/json' }));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// ─── HEALTH CHECK ────────────────────────────────────────────────────────────
app.get('/health', (_, res) => res.json({ 
  status: 'ok', 
  service: 'smartedulear-unified', 
  timestamp: new Date() 
}));

// ─── ROUTES ──────────────────────────────────────────────────────────────────
app.use('/auth',           authRoutes);
app.use('/courses',        courseRoutes);
app.use('/ai',             authenticate, aiRoutes);
app.use('/quizzes',        quizRoutes);
app.use('/gamification',   gamificationRoutes);
app.use('/tutors',         tutorRoutes);
app.use('/payments',       paymentRoutes);
app.use('/notifications',  notificationRoutes);
app.use('/admin',          adminRoutes);
app.use('/users',          userRoutes);

// ─── SOCKET.IO ───────────────────────────────────────────────────────────────
const io = new Server(httpServer, {
  cors: { 
    origin: process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:5173'], 
    credentials: true 
  },
});

const jwt = require('jsonwebtoken');

// Auth middleware for sockets
io.use((socket, next) => {
  const token = socket.handshake.auth?.token;
  if (!token) return next(new Error('Authentication required'));
  try {
    socket.user = jwt.verify(token, process.env.JWT_SECRET);
    next();
  } catch {
    next(new Error('Invalid token'));
  }
});

io.on('connection', (socket) => {
  const { id: userId, role } = socket.user;
  logger.info(`Socket connected: ${userId} (${role})`);

  socket.join(`user:${userId}`);

  // Real-time chat
  socket.on('chat:join', (sessionId) => socket.join(`chat:${sessionId}`));
  socket.on('chat:message', ({ sessionId, message }) => {
    io.to(`chat:${sessionId}`).emit('chat:message', { 
      userId, 
      message, 
      timestamp: new Date() 
    });
  });

  // Leaderboard updates
  socket.on('leaderboard:subscribe', () => socket.join('leaderboard'));

  socket.on('disconnect', () => logger.info(`Socket disconnected: ${userId}`));
});

// Expose io for internal use
app.set('io', io);

// ─── ERROR HANDLERS ──────────────────────────────────────────────────────────
app.use(notFound);
app.use(errorHandler);

// ─── INLINE MIGRATIONS (runs on every startup, safe/idempotent) ──────────────
// These run directly via the DB pool so no file system access needed.
// This is needed because in Docker mode, only server/ is in the container.
async function runInlineMigrations() {
  try {
    const { pool } = require('./config/db');

    // Ensure schema_migrations table exists
    await pool.query(`
      CREATE TABLE IF NOT EXISTS schema_migrations (
        filename   VARCHAR(255) PRIMARY KEY,
        applied_at TIMESTAMPTZ DEFAULT NOW()
      )
    `);

    const migrations = [
      {
        filename: '001_rename_payment_columns.sql',
        sql: `
          ALTER TABLE payments RENAME COLUMN stripe_payment_id TO cashfree_payment_id;
          ALTER TABLE payments RENAME COLUMN stripe_session_id  TO cashfree_order_id;
        `,
      },
      {
        filename: '002_add_chat_sessions.sql',
        sql: `
          CREATE TABLE IF NOT EXISTS chat_sessions (
            id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            learner_id      UUID NOT NULL,
            course_id       UUID,
            messages        JSONB NOT NULL DEFAULT '[]',
            context_summary TEXT DEFAULT '',
            created_at      TIMESTAMPTZ DEFAULT NOW(),
            updated_at      TIMESTAMPTZ DEFAULT NOW()
          );
          CREATE INDEX IF NOT EXISTS idx_chat_sessions_learner ON chat_sessions(learner_id);
          CREATE INDEX IF NOT EXISTS idx_chat_sessions_course  ON chat_sessions(course_id);
        `,
      },
      {
        filename: '003_add_password_reset_tokens.sql',
        sql: `
          CREATE TABLE IF NOT EXISTS password_reset_tokens (
            id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            user_id    UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
            token_hash VARCHAR(64) NOT NULL UNIQUE,
            expires_at TIMESTAMPTZ NOT NULL,
            used_at    TIMESTAMPTZ,
            created_at TIMESTAMPTZ DEFAULT NOW()
          );
          CREATE INDEX IF NOT EXISTS idx_prt_token_hash ON password_reset_tokens(token_hash);
          CREATE INDEX IF NOT EXISTS idx_prt_user       ON password_reset_tokens(user_id);
        `,
      },
      {
        filename: '004_fix_is_active_default.sql',
        sql: `
          ALTER TABLE users ALTER COLUMN is_active SET DEFAULT true;
          UPDATE users SET is_active = true WHERE is_active = false AND is_banned = false;
        `,
      },
    ];

    const { rows: applied } = await pool.query('SELECT filename FROM schema_migrations');
    const appliedSet = new Set(applied.map(r => r.filename));

    for (const m of migrations) {
      if (appliedSet.has(m.filename)) continue;
      try {
        await pool.query('BEGIN');
        await pool.query(m.sql);
        await pool.query('INSERT INTO schema_migrations (filename) VALUES ($1)', [m.filename]);
        await pool.query('COMMIT');
        logger.info(`✅ Migration applied: ${m.filename}`);
      } catch (err) {
        await pool.query('ROLLBACK');
        // Some migrations may fail if already applied (e.g. rename on renamed column) — skip
        logger.warn(`⚠ Migration skipped (already applied?): ${m.filename} — ${err.message}`);
        // Mark as applied so we don't retry
        await pool.query(
          'INSERT INTO schema_migrations (filename) VALUES ($1) ON CONFLICT DO NOTHING',
          [m.filename]
        );
      }
    }
  } catch (err) {
    logger.error('Inline migration error:', err.message);
  }
}

// ─── START SERVER ────────────────────────────────────────────────────────────
httpServer.listen(PORT, async () => {
  logger.info(`🚀 SmartEduLearn Server running on port ${PORT}`);
  logger.info(`📊 Environment: ${process.env.NODE_ENV || 'development'}`);

  // Run inline migrations after server starts
  await runInlineMigrations();

  // ── Self-ping to prevent Render free tier from sleeping ──────────────────
  if (process.env.NODE_ENV === 'production' && process.env.RENDER_EXTERNAL_URL) {
    const https = require('https');
    const pingUrl = `${process.env.RENDER_EXTERNAL_URL}/health`;
    setInterval(() => {
      https.get(pingUrl, (res) => {
        logger.info(`Self-ping: ${res.statusCode}`);
      }).on('error', (err) => {
        logger.warn(`Self-ping failed: ${err.message}`);
      });
    }, 14 * 60 * 1000);
    logger.info(`Self-ping active → ${pingUrl}`);
  }
});

module.exports = { app, io };
