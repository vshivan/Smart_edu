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
app.use('/ai',             authenticate, aiRoutes);   // all AI routes require auth
app.use('/quizzes',        quizRoutes);
app.use('/gamification',   gamificationRoutes);
app.use('/tutors',         tutorRoutes);
app.use('/payments',       paymentRoutes);
app.use('/notifications',  notificationRoutes);
app.use('/admin',          adminRoutes);

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

// ─── START SERVER ────────────────────────────────────────────────────────────
httpServer.listen(PORT, () => {
  logger.info(`🚀 SmartEduLearn Server running on port ${PORT}`);
  logger.info(`📊 Environment: ${process.env.NODE_ENV || 'development'}`);
});

module.exports = { app, io };
