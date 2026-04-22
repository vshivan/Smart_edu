require('dotenv').config();
const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const { createProxyMiddleware } = require('http-proxy-middleware');
const rateLimit = require('express-rate-limit');
const { createServer } = require('http');
const { Server } = require('socket.io');
const jwt = require('jsonwebtoken');
const logger = require('../../shared/utils/logger');

const app = express();
const httpServer = createServer(app);
const PORT = process.env.API_GATEWAY_PORT || 3000;

// ─── SECURITY ────────────────────────────────────────────────────────────────
app.use(helmet());
app.use(cors({
  origin: process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:5173'],
  credentials: true,
}));

// ─── RATE LIMITING ───────────────────────────────────────────────────────────
const limiter = rateLimit({ windowMs: 60_000, max: 100, standardHeaders: true, legacyHeaders: false });
const authLimiter = rateLimit({ windowMs: 60_000, max: 10, standardHeaders: true, legacyHeaders: false });
app.use('/auth', authLimiter);
app.use(limiter);

// ─── HEALTH ──────────────────────────────────────────────────────────────────
app.get('/health', (_, res) => res.json({ status: 'ok', service: 'api-gateway', timestamp: new Date() }));

// ─── SERVICE URLS ────────────────────────────────────────────────────────────
const SERVICES = {
  auth:           process.env.AUTH_SERVICE_URL           || 'http://localhost:3001',
  users:          process.env.USER_SERVICE_URL           || 'http://localhost:3002',
  courses:        process.env.COURSE_SERVICE_URL         || 'http://localhost:3003',
  ai:             process.env.AI_SERVICE_URL             || 'http://localhost:3004',
  quizzes:        process.env.QUIZ_SERVICE_URL           || 'http://localhost:3005',
  gamification:   process.env.GAMIFICATION_SERVICE_URL   || 'http://localhost:3006',
  tutors:         process.env.TUTOR_SERVICE_URL          || 'http://localhost:3007',
  payments:       process.env.PAYMENT_SERVICE_URL        || 'http://localhost:3008',
  analytics:      process.env.ANALYTICS_SERVICE_URL      || 'http://localhost:3009',
  notifications:  process.env.NOTIFICATION_SERVICE_URL   || 'http://localhost:3010',
  admin:          process.env.ADMIN_SERVICE_URL          || 'http://localhost:3011',
};

const proxy = (target) => createProxyMiddleware({
  target,
  changeOrigin: true,
  on: {
    error: (err, req, res) => {
      logger.error(`Proxy error → ${target}: ${err.message}`);
      res.status(502).json({ status: 'error', message: 'Service temporarily unavailable' });
    },
  },
});

// ─── ROUTE PROXIES ───────────────────────────────────────────────────────────
app.use('/auth',          proxy(SERVICES.auth));
app.use('/users',         proxy(SERVICES.users));
app.use('/courses',       proxy(SERVICES.courses));
app.use('/ai',            proxy(SERVICES.ai));
app.use('/quizzes',       proxy(SERVICES.quizzes));
app.use('/gamification',  proxy(SERVICES.gamification));
app.use('/tutors',        proxy(SERVICES.tutors));
app.use('/payments',      proxy(SERVICES.payments));
app.use('/analytics',     proxy(SERVICES.analytics));
app.use('/notifications', proxy(SERVICES.notifications));
app.use('/admin',         proxy(SERVICES.admin));

// ─── SOCKET.IO ───────────────────────────────────────────────────────────────
const io = new Server(httpServer, {
  cors: { origin: process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:5173'], credentials: true },
});

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
    io.to(`chat:${sessionId}`).emit('chat:message', { userId, message, timestamp: new Date() });
  });

  // Leaderboard updates
  socket.on('leaderboard:subscribe', () => socket.join('leaderboard'));

  socket.on('disconnect', () => logger.info(`Socket disconnected: ${userId}`));
});

// Expose io for internal use
app.set('io', io);

// ─── START ───────────────────────────────────────────────────────────────────
httpServer.listen(PORT, () => logger.info(`API Gateway → port ${PORT}`));
module.exports = { app, io };
