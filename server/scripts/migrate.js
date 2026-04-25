/**
 * Database Migration Script
 * Runs the schema.sql against the connected Postgres database.
 * Wraps everything in a transaction — safe to run on a fresh DB.
 * On subsequent runs, skips gracefully if tables already exist.
 *
 * Usage:
 *   node scripts/migrate.js
 *   npm run db:migrate
 */

require('dotenv').config();
const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

// Look for schema relative to project root (works both locally and on Render)
const possiblePaths = [
  path.join(__dirname, '../../database/schema.sql'),
  path.join(__dirname, '../database/schema.sql'),
  path.join(process.cwd(), 'database/schema.sql'),
  path.join(process.cwd(), '../database/schema.sql'),
];

async function migrate() {
  if (!process.env.DATABASE_URL) {
    console.error('❌ DATABASE_URL not set');
    process.exit(1);
  }

  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
    connectionTimeoutMillis: 10000,
  });

  try {
    // Check if tables already exist
    const { rows } = await pool.query(`
      SELECT COUNT(*) as count FROM information_schema.tables
      WHERE table_schema = 'public' AND table_name = 'users'
    `);

    if (parseInt(rows[0].count) > 0) {
      console.log('✅ Database schema already exists — skipping migration');
      return;
    }

    // Find schema file
    const schemaPath = possiblePaths.find(p => fs.existsSync(p));
    if (!schemaPath) {
      console.error('❌ Schema file not found. Searched:', possiblePaths);
      process.exit(1);
    }

    console.log(`🔄 Running migration from: ${schemaPath}`);
    const sql = fs.readFileSync(schemaPath, 'utf8');

    // Run in a transaction so partial failures roll back cleanly
    await pool.query('BEGIN');
    await pool.query(sql);
    await pool.query('COMMIT');

    console.log('✅ Database migration complete');
  } catch (err) {
    await pool.query('ROLLBACK').catch(() => {});
    console.error('❌ Migration failed:', err.message);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

migrate();
