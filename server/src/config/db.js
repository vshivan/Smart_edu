const { Pool } = require('pg');
const logger = require('../utils/logger');

// ─── PostgreSQL (Neon or local) ───────────────────────────────────────────────
// Neon requires SSL. Local dev works without it.
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  max: 10,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 5000,
  ssl: process.env.NODE_ENV === 'production'
    ? { rejectUnauthorized: false }
    : false,
});

pool.on('error', (err) => logger.error('PostgreSQL pool error', err));

pool.connect()
  .then((client) => { client.release(); logger.info('✅ PostgreSQL connected'); })
  .catch((err)   => logger.error('❌ PostgreSQL connection failed', err));

module.exports = { pool };
