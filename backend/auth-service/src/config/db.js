const { Pool } = require('pg');
const logger = require('../../../shared/utils/logger');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

pool.on('error', (err) => logger.error('PostgreSQL pool error', err));

module.exports = pool;
