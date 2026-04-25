const { Pool } = require('pg');
const logger = require('../utils/logger');

// ─── PostgreSQL ───────────────────────────────────────────────────────────────
// Neon URLs contain ?sslmode=require which conflicts with the ssl:{} config object.
// We strip the sslmode param and handle SSL ourselves so both Neon and local work.

const rawUrl = process.env.DATABASE_URL || '';

// Remove sslmode query param to avoid the pg driver conflict
const connectionString = rawUrl.replace(/[?&]sslmode=[^&]*/g, '').replace(/\?$/, '');

// Enable SSL for Neon or any cloud URL; disable for plain localhost
const needsSSL = rawUrl.includes('neon.tech')
  || rawUrl.includes('sslmode=require')
  || process.env.NODE_ENV === 'production';

const pool = new Pool({
  connectionString,
  max: 10,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 10000,
  ssl: needsSSL ? { rejectUnauthorized: false } : false,
});

pool.on('error', (err) => logger.error('PostgreSQL pool error', err));

pool.connect()
  .then((client) => { client.release(); logger.info('✅ PostgreSQL connected'); })
  .catch((err)   => logger.error('❌ PostgreSQL connection failed', err.message));

module.exports = { pool };
