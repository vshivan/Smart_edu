const { Pool } = require('pg');
const mongoose = require('mongoose');
const logger = require('../utils/logger');

// ─── PostgreSQL ───────────────────────────────────────────────────────────────
// Render managed Postgres requires SSL in production
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  max: 10,                      // Render free tier: 97 max connections
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 5000,
  ssl: process.env.NODE_ENV === 'production'
    ? { rejectUnauthorized: false }  // Render uses self-signed certs
    : false,
});

pool.on('error', (err) => logger.error('PostgreSQL pool error', err));

pool.connect()
  .then((client) => { client.release(); logger.info('✅ PostgreSQL connected'); })
  .catch((err)   => logger.error('❌ PostgreSQL connection failed', err));

// ─── MongoDB ─────────────────────────────────────────────────────────────────
// Supports both local MongoDB and MongoDB Atlas (mongodb+srv://)
if (process.env.MONGODB_URL) {
  mongoose
    .connect(process.env.MONGODB_URL, { dbName: 'smartedulear_ai' })
    .then(() => logger.info('✅ MongoDB connected'))
    .catch((err) => logger.error('❌ MongoDB connection failed', err));
} else {
  logger.warn('⚠ MONGODB_URL not set — AI chat history disabled');
}

module.exports = { pool, mongoose };
