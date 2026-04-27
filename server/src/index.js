require('dotenv').config();
const express    = require('express');
const helmet     = require('helmet');
const cors       = require('cors');
const { createServer } = require('http');
const { Server } = require('socket.io');
const rateLimit  = require('express-rate-limit');
const passport   = require('passport');
const jwt        = require('jsonwebtoken');

const logger = require('./utils/logger');
const { errorHandler, notFound } = require('./middleware/errorHandler');
const { authenticate } = require('./middleware/auth');

// ─── Route modules ────────────────────────────────────────────────────────────
const authRoutes         = require('./routes/auth.routes');
const courseRoutes        = require('./routes/course.routes');
const aiRoutes            = require('./routes/ai.routes');
const quizRoutes          = require('./routes/quiz.routes');
const gamificationRoutes  = require('./routes/gamification.routes');
const tutorRoutes         = require('./routes/tutor.routes');
const paymentRoutes       = require('./routes/payment.routes');
const notificationRoutes  = require('./routes/notification.routes');
const adminRoutes         = require('./routes/admin.routes');
const userRoutes          = require('./routes/user.routes');

// ─── DB + Passport init ───────────────────────────────────────────────────────
require('./config/db');
require('./config/passport');

// ─── App setup ────────────────────────────────────────────────────────────────
const app        = express();
const httpServer = createServer(app);

// Render assigns PORT automatically; fallback to 10000 for Docker, 3000 for local
const PORT = process.env.PORT || 10000;

app.set('trust proxy', 1); // required behind Render/nginx

// ─── Security ─────────────────────────────────────────────────────────────────
app.use(helmet());
app.use(cors({
  origin: (origin, cb) => {
    const allowed = (process.env.ALLOWED_ORIGINS || 'http://localhost:5173')
      .split(',')
      .map(o => o.trim().replace(/\n/g, ''));
    if (!origin || allowed.includes(origin)) return cb(null, true);
    cb(new Error(`CORS: ${origin} not allowed`));
  },
  credentials: true,
}));

// ─── Rate limiting ────────────────────────────────────────────────────────────
app.use(rateLimit({
  windowMs: 60_000,
  max: process.env.NODE_ENV === 'test' ? 100000 : 100,
  standardHeaders: true,
  legacyHeaders: false,
}));
app.use('/auth', rateLimit({
  windowMs: 60_000,
  max: process.env.NODE_ENV === 'test' ? 100000 : 15,
  standardHeaders: true,
  legacyHeaders: false,
}));

// ─── Body parsing ─────────────────────────────────────────────────────────────
app.use(passport.initialize());
app.use('/payments/webhook', express.raw({ type: 'application/json' }));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// ─── Test / health routes (always respond — Render health check uses these) ───
app.get('/', (_, res) => res.json({
  message: 'SmartEduLearn API is running',
  version: '1.3',
  docs: '/health',
}));

app.get('/health', (_, res) => res.json({
  status: 'ok',
  service: 'smartedulear-unified',
  timestamp: new Date(),
  env: process.env.NODE_ENV || 'development',
}));

app.get('/api', (_, res) => res.json({
  message: 'API working',
  endpoints: ['/auth', '/courses', '/ai', '/quizzes', '/gamification', '/tutors', '/payments', '/notifications', '/admin', '/users'],
}));

// Debug — shows which optional env vars are configured (no secret values)
app.get('/debug/config', (_, res) => res.json({
  gemini:       !!process.env.GEMINI_API_KEY,
  google_oauth: !!process.env.GOOGLE_CLIENT_ID && !!process.env.GOOGLE_CLIENT_SECRET,
  callback_url: process.env.GOOGLE_CALLBACK_URL || 'NOT SET',
  frontend_url: process.env.FRONTEND_URL || 'NOT SET',
  allowed_origins: process.env.ALLOWED_ORIGINS || 'NOT SET',
  redis:        !!process.env.REDIS_URL,
  database:     !!process.env.DATABASE_URL,
}));

// Debug — test Gemini directly (no auth required)
app.get('/debug/gemini', async (_, res) => {
  try {
    const key = (process.env.GEMINI_API_KEY || '').trim();
    if (!key) return res.json({ ok: false, error: 'GEMINI_API_KEY not set' });

    const { GoogleGenerativeAI } = require('@google/generative-ai');
    const genAI = new GoogleGenerativeAI(key);
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
    const result = await model.generateContent('Say "Gemini is working" in JSON: {"status":"ok","message":"..."}');
    const text = result.response.text();
    res.json({ ok: true, response: text.slice(0, 200) });
  } catch (err) {
    res.json({ ok: false, error: err.message });
  }
});

// ─── Application routes ───────────────────────────────────────────────────────
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

// ─── Socket.io ────────────────────────────────────────────────────────────────
const io = new Server(httpServer, {
  cors: {
    origin: (process.env.ALLOWED_ORIGINS || 'http://localhost:5173').split(',').map(o => o.trim()),
    credentials: true,
  },
});

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
  const { id: userId } = socket.user;
  socket.join(`user:${userId}`);
  socket.on('chat:join',    (sid)          => socket.join(`chat:${sid}`));
  socket.on('chat:message', ({ sessionId, message }) =>
    io.to(`chat:${sessionId}`).emit('chat:message', { userId, message, timestamp: new Date() })
  );
  socket.on('disconnect', () => {});
});

app.set('io', io);

// ─── Error handlers ───────────────────────────────────────────────────────────
app.use(notFound);
app.use(errorHandler);

// ─── Inline migrations (idempotent, never crash the server) ──────────────────
async function runMigrations() {
  try {
    const { pool } = require('./config/db');

    await pool.query(`
      CREATE TABLE IF NOT EXISTS schema_migrations (
        filename   VARCHAR(255) PRIMARY KEY,
        applied_at TIMESTAMPTZ DEFAULT NOW()
      )
    `);

    const migrations = [
      {
        name: '001_rename_payment_columns',
        sql: `
          DO $$ BEGIN
            IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='payments' AND column_name='stripe_payment_id') THEN
              ALTER TABLE payments RENAME COLUMN stripe_payment_id TO cashfree_payment_id;
            END IF;
            IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='payments' AND column_name='stripe_session_id') THEN
              ALTER TABLE payments RENAME COLUMN stripe_session_id TO cashfree_order_id;
            END IF;
          END $$;
        `,
      },
      {
        name: '002_add_chat_sessions',
        sql: `
          CREATE TABLE IF NOT EXISTS chat_sessions (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            learner_id UUID NOT NULL, course_id UUID,
            messages JSONB NOT NULL DEFAULT '[]',
            context_summary TEXT DEFAULT '',
            created_at TIMESTAMPTZ DEFAULT NOW(), updated_at TIMESTAMPTZ DEFAULT NOW()
          );
          CREATE INDEX IF NOT EXISTS idx_chat_sessions_learner ON chat_sessions(learner_id);
        `,
      },
      {
        name: '003_add_password_reset_tokens',
        sql: `
          CREATE TABLE IF NOT EXISTS password_reset_tokens (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
            token_hash VARCHAR(64) NOT NULL UNIQUE,
            expires_at TIMESTAMPTZ NOT NULL, used_at TIMESTAMPTZ,
            created_at TIMESTAMPTZ DEFAULT NOW()
          );
          CREATE INDEX IF NOT EXISTS idx_prt_token_hash ON password_reset_tokens(token_hash);
        `,
      },
      {
        name: '004_fix_is_active_default',
        sql: `
          ALTER TABLE users ALTER COLUMN is_active SET DEFAULT true;
          UPDATE users SET is_active = true WHERE is_active = false AND is_banned = false;
        `,
      },
      {
        name: '005_add_notes_to_lesson_progress',
        sql: `ALTER TABLE lesson_progress ADD COLUMN IF NOT EXISTS notes TEXT DEFAULT '';`,
      },
    ];

    const { rows } = await pool.query('SELECT filename FROM schema_migrations');
    const done = new Set(rows.map(r => r.filename));

    for (const m of migrations) {
      if (done.has(m.name)) continue;
      try {
        await pool.query('BEGIN');
        await pool.query(m.sql);
        await pool.query('INSERT INTO schema_migrations (filename) VALUES ($1)', [m.name]);
        await pool.query('COMMIT');
        logger.info(`✅ Migration: ${m.name}`);
      } catch (err) {
        await pool.query('ROLLBACK').catch(() => {});
        logger.warn(`⚠ Migration skipped: ${m.name} — ${err.message}`);
        await pool.query(
          'INSERT INTO schema_migrations (filename) VALUES ($1) ON CONFLICT DO NOTHING',
          [m.name]
        );
      }
    }
    logger.info('✅ Migrations complete');
  } catch (err) {
    // NEVER crash the server due to migration failure
    logger.error('Migration error (non-fatal):', err.message);
  }
}

// ─── Start server ─────────────────────────────────────────────────────────────
httpServer.listen(PORT, '0.0.0.0', async () => {
  logger.info(`🚀 SmartEduLearn running on port ${PORT}`);
  logger.info(`📊 Environment: ${process.env.NODE_ENV || 'development'}`);
  logger.info(`🌐 CORS origins: ${process.env.ALLOWED_ORIGINS || 'http://localhost:5173'}`);

  // Run migrations after server is already listening (never blocks startup)
  await runMigrations();

  // Self-ping every 14 min to keep Render free tier awake
  if (process.env.NODE_ENV === 'production' && process.env.RENDER_EXTERNAL_URL) {
    const https = require('https');
    const url   = `${process.env.RENDER_EXTERNAL_URL}/health`;
    setInterval(() => {
      https.get(url, () => {}).on('error', () => {});
    }, 14 * 60 * 1000);
    logger.info(`🏓 Self-ping active → ${url}`);
  }
});

// Graceful shutdown — don't crash on SIGTERM (Render sends this on redeploy)
process.on('SIGTERM', () => {
  logger.info('SIGTERM received — shutting down gracefully');
  httpServer.close(() => {
    logger.info('Server closed');
    process.exit(0);
  });
});

process.on('uncaughtException',  (err) => logger.error('Uncaught exception:', err.message));
process.on('unhandledRejection', (err) => logger.error('Unhandled rejection:', err));

module.exports = { app, io };
