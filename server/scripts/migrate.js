/**
 * Database Migration Script
 *
 * On a fresh database: runs the full schema.sql
 * On an existing database: runs any pending migration files from
 *   database/migrations/ that haven't been applied yet.
 *
 * Usage:
 *   node scripts/migrate.js        (or: npm run db:migrate)
 *
 * Called automatically on Render via: npm run start:migrate
 */

require('dotenv').config();
const { Pool } = require('pg');
const fs   = require('fs');
const path = require('path');

// ─── Resolve paths (works locally and on Render) ─────────────────────────────
const rootDir = path.resolve(__dirname, '../..');

const SCHEMA_PATHS = [
  path.join(rootDir, 'database/schema.sql'),
  path.join(__dirname, '../database/schema.sql'),
  path.join(process.cwd(), 'database/schema.sql'),
];

const MIGRATIONS_DIRS = [
  path.join(rootDir, 'database/migrations'),
  path.join(__dirname, '../database/migrations'),
  path.join(process.cwd(), 'database/migrations'),
];

const findFile = (paths) => paths.find((p) => fs.existsSync(p));

// ─── Main ─────────────────────────────────────────────────────────────────────
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

  const client = await pool.connect();

  try {
    // ── Check if this is a fresh database ──────────────────────────────────
    const { rows } = await client.query(`
      SELECT COUNT(*) AS count
      FROM information_schema.tables
      WHERE table_schema = 'public' AND table_name = 'users'
    `);
    const isFresh = parseInt(rows[0].count) === 0;

    if (isFresh) {
      // ── Fresh DB: run full schema ─────────────────────────────────────────
      const schemaPath = findFile(SCHEMA_PATHS);
      if (!schemaPath) {
        console.error('❌ schema.sql not found. Searched:', SCHEMA_PATHS);
        process.exit(1);
      }
      console.log(`🔄 Fresh database — running full schema from: ${schemaPath}`);
      const sql = fs.readFileSync(schemaPath, 'utf8');
      await client.query('BEGIN');
      await client.query(sql);
      await client.query('COMMIT');
      console.log('✅ Full schema applied');
    } else {
      // ── Existing DB: run incremental migrations ───────────────────────────
      console.log('✅ Database exists — checking for pending migrations...');

      // Ensure migrations tracking table exists
      await client.query(`
        CREATE TABLE IF NOT EXISTS schema_migrations (
          filename   VARCHAR(255) PRIMARY KEY,
          applied_at TIMESTAMPTZ DEFAULT NOW()
        )
      `);

      const migrationsDir = findFile(MIGRATIONS_DIRS);
      if (!migrationsDir) {
        console.log('ℹ No migrations directory found — skipping');
        return;
      }

      // Get all .sql files sorted by name (001_, 002_, etc.)
      const files = fs.readdirSync(migrationsDir)
        .filter((f) => f.endsWith('.sql'))
        .sort();

      // Get already-applied migrations
      const { rows: applied } = await client.query(
        'SELECT filename FROM schema_migrations'
      );
      const appliedSet = new Set(applied.map((r) => r.filename));

      const pending = files.filter((f) => !appliedSet.has(f));

      if (pending.length === 0) {
        console.log('✅ All migrations already applied — nothing to do');
        return;
      }

      for (const file of pending) {
        const filePath = path.join(migrationsDir, file);
        const sql = fs.readFileSync(filePath, 'utf8');
        console.log(`🔄 Applying migration: ${file}`);
        await client.query('BEGIN');
        await client.query(sql);
        await client.query(
          'INSERT INTO schema_migrations (filename) VALUES ($1)',
          [file]
        );
        await client.query('COMMIT');
        console.log(`✅ Applied: ${file}`);
      }
    }
  } catch (err) {
    await client.query('ROLLBACK').catch(() => {});
    console.error('❌ Migration failed:', err.message);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

migrate();
