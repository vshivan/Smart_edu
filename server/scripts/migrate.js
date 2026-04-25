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

// ─── Resolve schema path ──────────────────────────────────────────────────────
// On Render: rootDir is /opt/render/project/src/server (rootDir of the service)
// Locally:   rootDir is D:\Smart_edu\server
// schema.sql is always one level up from server/ in the database/ folder
// We try multiple paths to handle both environments.

const SCHEMA_PATHS = [
  path.join(__dirname, '../../database/schema.sql'),   // local: server/scripts/../../database
  path.join(__dirname, '../database/schema.sql'),       // if scripts/ is at root
  path.join(process.cwd(), '../database/schema.sql'),   // Render: cwd=server, go up one
  path.join(process.cwd(), 'database/schema.sql'),      // fallback
];

const MIGRATIONS_DIRS = [
  path.join(__dirname, '../../database/migrations'),
  path.join(__dirname, '../database/migrations'),
  path.join(process.cwd(), '../database/migrations'),
  path.join(process.cwd(), 'database/migrations'),
];

const findFile  = (paths) => paths.find((p) => fs.existsSync(p));
const findDir   = (paths) => paths.find((p) => fs.existsSync(p));

// ─── Inline schema as fallback ────────────────────────────────────────────────
// If schema file can't be found (e.g. Render doesn't clone the full repo),
// we embed the critical CREATE TABLE statements directly.
const INLINE_SCHEMA = `
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

DO $$ BEGIN
  CREATE TYPE user_role AS ENUM ('learner', 'tutor', 'admin');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  CREATE TYPE verification_status AS ENUM ('pending', 'approved', 'rejected');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  CREATE TYPE doc_type AS ENUM ('certificate', 'resume', 'id_proof');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  CREATE TYPE content_type AS ENUM ('video', 'pdf', 'text', 'quiz', 'coding');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  CREATE TYPE difficulty AS ENUM ('beginner', 'intermediate', 'advanced');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  CREATE TYPE course_creator AS ENUM ('ai', 'tutor');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  CREATE TYPE session_status AS ENUM ('pending', 'confirmed', 'completed', 'cancelled');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  CREATE TYPE payment_status AS ENUM ('pending', 'completed', 'failed', 'refunded');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  CREATE TYPE subscription_plan AS ENUM ('free', 'pro', 'enterprise');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  CREATE TYPE subscription_status AS ENUM ('active', 'cancelled', 'expired');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  CREATE TYPE review_target AS ENUM ('course', 'tutor');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  CREATE TYPE quiz_type AS ENUM ('mcq', 'case_based', 'coding');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  CREATE TYPE question_type AS ENUM ('mcq', 'true_false', 'short_answer', 'code');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  CREATE TYPE badge_type AS ENUM ('streak', 'completion', 'quiz', 'level', 'special');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE TABLE IF NOT EXISTS users (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email           VARCHAR(255) UNIQUE NOT NULL,
  password_hash   VARCHAR(255),
  google_id       VARCHAR(255) UNIQUE,
  role            user_role NOT NULL DEFAULT 'learner',
  first_name      VARCHAR(100) NOT NULL,
  last_name       VARCHAR(100) NOT NULL,
  avatar_url      TEXT,
  is_active       BOOLEAN DEFAULT true,
  is_verified     BOOLEAN DEFAULT false,
  is_banned       BOOLEAN DEFAULT false,
  ban_reason      TEXT,
  banned_at       TIMESTAMPTZ,
  banned_by       UUID,
  last_login_at   TIMESTAMPTZ,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS learner_profiles (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  bio             TEXT,
  learning_goals  TEXT[],
  preferred_lang  VARCHAR(10) DEFAULT 'en',
  xp_total        INTEGER DEFAULT 0,
  level           INTEGER DEFAULT 1,
  streak_days     INTEGER DEFAULT 0,
  longest_streak  INTEGER DEFAULT 0,
  last_active_at  TIMESTAMPTZ,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS tutor_profiles (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id             UUID UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  bio                 TEXT,
  skills              TEXT[],
  experience_years    INTEGER DEFAULT 0,
  hourly_rate         DECIMAL(10,2) DEFAULT 0,
  rating              DECIMAL(3,2) DEFAULT 0,
  total_reviews       INTEGER DEFAULT 0,
  total_sessions      INTEGER DEFAULT 0,
  is_available        BOOLEAN DEFAULT false,
  verification_status verification_status DEFAULT 'pending',
  verified_at         TIMESTAMPTZ,
  verified_by         UUID,
  rejection_reason    TEXT,
  created_at          TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS tutor_documents (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tutor_id    UUID REFERENCES tutor_profiles(id) ON DELETE CASCADE,
  doc_type    doc_type NOT NULL,
  file_url    TEXT NOT NULL,
  file_name   VARCHAR(255),
  status      verification_status DEFAULT 'pending',
  reviewed_by UUID,
  reviewed_at TIMESTAMPTZ,
  notes       TEXT,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS courses (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title           VARCHAR(255) NOT NULL,
  description     TEXT,
  thumbnail_url   TEXT,
  creator_id      UUID REFERENCES users(id),
  creator_type    course_creator NOT NULL DEFAULT 'tutor',
  subject         VARCHAR(100),
  difficulty      difficulty DEFAULT 'beginner',
  estimated_hours DECIMAL(5,2),
  price           DECIMAL(10,2) DEFAULT 0,
  is_free         BOOLEAN DEFAULT true,
  is_published    BOOLEAN DEFAULT false,
  is_featured     BOOLEAN DEFAULT false,
  is_deleted      BOOLEAN DEFAULT false,
  tags            TEXT[],
  rating          DECIMAL(3,2) DEFAULT 0,
  total_reviews   INTEGER DEFAULT 0,
  total_enrolled  INTEGER DEFAULT 0,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS course_modules (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id    UUID REFERENCES courses(id) ON DELETE CASCADE,
  title        VARCHAR(255) NOT NULL,
  description  TEXT,
  order_index  INTEGER NOT NULL,
  is_locked    BOOLEAN DEFAULT true,
  unlock_xp    INTEGER DEFAULT 0,
  created_at   TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS course_lessons (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  module_id     UUID REFERENCES course_modules(id) ON DELETE CASCADE,
  title         VARCHAR(255) NOT NULL,
  content_type  content_type NOT NULL DEFAULT 'text',
  content_url   TEXT,
  content_text  TEXT,
  duration_min  INTEGER DEFAULT 0,
  order_index   INTEGER NOT NULL,
  xp_reward     INTEGER DEFAULT 10,
  is_preview    BOOLEAN DEFAULT false,
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS enrollments (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  learner_id      UUID REFERENCES users(id),
  course_id       UUID REFERENCES courses(id),
  enrolled_at     TIMESTAMPTZ DEFAULT NOW(),
  completed_at    TIMESTAMPTZ,
  progress_pct    DECIMAL(5,2) DEFAULT 0,
  last_lesson_id  UUID REFERENCES course_lessons(id),
  UNIQUE(learner_id, course_id)
);

CREATE TABLE IF NOT EXISTS lesson_progress (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  learner_id    UUID REFERENCES users(id),
  lesson_id     UUID REFERENCES course_lessons(id),
  completed     BOOLEAN DEFAULT false,
  time_spent_s  INTEGER DEFAULT 0,
  completed_at  TIMESTAMPTZ,
  UNIQUE(learner_id, lesson_id)
);

CREATE TABLE IF NOT EXISTS quizzes (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lesson_id     UUID REFERENCES course_lessons(id),
  course_id     UUID REFERENCES courses(id),
  title         VARCHAR(255),
  quiz_type     quiz_type DEFAULT 'mcq',
  time_limit_s  INTEGER,
  pass_score    INTEGER DEFAULT 70,
  max_attempts  INTEGER DEFAULT 3,
  xp_reward     INTEGER DEFAULT 50,
  xp_perfect    INTEGER DEFAULT 100,
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS quiz_questions (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  quiz_id         UUID REFERENCES quizzes(id) ON DELETE CASCADE,
  question_text   TEXT NOT NULL,
  question_type   question_type DEFAULT 'mcq',
  options         JSONB,
  correct_answer  TEXT NOT NULL,
  explanation     TEXT,
  order_index     INTEGER,
  points          INTEGER DEFAULT 10
);

CREATE TABLE IF NOT EXISTS quiz_attempts (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  quiz_id       UUID REFERENCES quizzes(id),
  learner_id    UUID REFERENCES users(id),
  score         INTEGER,
  max_score     INTEGER,
  passed        BOOLEAN,
  answers       JSONB,
  time_taken_s  INTEGER,
  xp_earned     INTEGER DEFAULT 0,
  attempt_num   INTEGER DEFAULT 1,
  attempted_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS badges (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name        VARCHAR(100) UNIQUE NOT NULL,
  description TEXT,
  icon_url    TEXT,
  badge_type  badge_type NOT NULL,
  criteria    JSONB NOT NULL,
  xp_value    INTEGER DEFAULT 0,
  is_active   BOOLEAN DEFAULT true,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS user_badges (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID REFERENCES users(id),
  badge_id   UUID REFERENCES badges(id),
  earned_at  TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, badge_id)
);

CREATE TABLE IF NOT EXISTS tutor_slots (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tutor_id     UUID REFERENCES tutor_profiles(id) ON DELETE CASCADE,
  slot_start   TIMESTAMPTZ NOT NULL,
  slot_end     TIMESTAMPTZ NOT NULL,
  is_booked    BOOLEAN DEFAULT false,
  created_at   TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS tutor_sessions (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tutor_id        UUID REFERENCES users(id),
  learner_id      UUID REFERENCES users(id),
  slot_id         UUID REFERENCES tutor_slots(id),
  subject         VARCHAR(255),
  scheduled_at    TIMESTAMPTZ NOT NULL,
  duration_min    INTEGER DEFAULT 60,
  status          session_status DEFAULT 'pending',
  meeting_url     TEXT,
  tutor_notes     TEXT,
  learner_notes   TEXT,
  amount          DECIMAL(10,2),
  platform_fee    DECIMAL(10,2),
  tutor_earnings  DECIMAL(10,2),
  cancelled_by    UUID,
  cancel_reason   TEXT,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS payments (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id           UUID REFERENCES users(id),
  reference_type    VARCHAR(50),
  reference_id      UUID,
  amount            DECIMAL(10,2) NOT NULL,
  currency          VARCHAR(3) DEFAULT 'INR',
  status            payment_status DEFAULT 'pending',
  cashfree_order_id TEXT,
  cashfree_payment_id TEXT,
  metadata          JSONB,
  created_at        TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS subscriptions (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID REFERENCES users(id),
  plan            subscription_plan DEFAULT 'free',
  status          subscription_status DEFAULT 'active',
  started_at      TIMESTAMPTZ DEFAULT NOW(),
  expires_at      TIMESTAMPTZ,
  cancelled_at    TIMESTAMPTZ,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS reviews (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reviewer_id  UUID REFERENCES users(id),
  target_type  review_target NOT NULL,
  target_id    UUID NOT NULL,
  rating       INTEGER CHECK (rating BETWEEN 1 AND 5),
  comment      TEXT,
  is_flagged   BOOLEAN DEFAULT false,
  created_at   TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(reviewer_id, target_type, target_id)
);

CREATE TABLE IF NOT EXISTS certificates (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  learner_id   UUID REFERENCES users(id),
  course_id    UUID REFERENCES courses(id),
  issued_at    TIMESTAMPTZ DEFAULT NOW(),
  cert_url     TEXT,
  cert_hash    VARCHAR(64) UNIQUE,
  UNIQUE(learner_id, course_id)
);

CREATE TABLE IF NOT EXISTS notifications (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID REFERENCES users(id),
  type        VARCHAR(50) NOT NULL,
  title       VARCHAR(255) NOT NULL,
  message     TEXT,
  is_read     BOOLEAN DEFAULT false,
  metadata    JSONB,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS admin_audit_log (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id     UUID REFERENCES users(id),
  action       VARCHAR(100) NOT NULL,
  target_type  VARCHAR(50),
  target_id    UUID,
  details      JSONB,
  ip_address   INET,
  created_at   TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS platform_settings (
  key         VARCHAR(100) PRIMARY KEY,
  value       JSONB NOT NULL,
  description TEXT,
  updated_by  UUID,
  updated_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS chat_sessions (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  learner_id      UUID NOT NULL,
  course_id       UUID,
  messages        JSONB NOT NULL DEFAULT '[]',
  context_summary TEXT DEFAULT '',
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS password_reset_tokens (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token_hash VARCHAR(64) NOT NULL UNIQUE,
  expires_at TIMESTAMPTZ NOT NULL,
  used_at    TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

INSERT INTO platform_settings (key, value, description) VALUES
  ('platform_fee_percent', '20', 'Commission % taken from tutor sessions'),
  ('ai_model', '"gemini-1.5-flash"', 'Gemini model for course/quiz generation'),
  ('max_quiz_attempts', '3', 'Max quiz retry attempts'),
  ('streak_grace_hours', '26', 'Hours after midnight before streak resets'),
  ('maintenance_mode', 'false', 'Put platform in maintenance mode')
ON CONFLICT (key) DO NOTHING;

INSERT INTO badges (name, description, badge_type, criteria, xp_value) VALUES
  ('First Step', 'Complete your first lesson', 'completion', '{"lessons_completed": 1}', 50),
  ('Quiz Master', 'Score 100% on any quiz', 'quiz', '{"perfect_score": true}', 100),
  ('Week Warrior', '7-day learning streak', 'streak', '{"streak_days": 7}', 150),
  ('Month Champion', '30-day learning streak', 'streak', '{"streak_days": 30}', 500),
  ('Course Completer', 'Complete your first course', 'completion', '{"courses_completed": 1}', 300),
  ('Scholar', 'Reach Level 4', 'level', '{"level": 4}', 200),
  ('Master', 'Reach Level 6', 'level', '{"level": 6}', 400),
  ('Legend', 'Reach Level 8', 'level', '{"level": 8}', 800)
ON CONFLICT (name) DO NOTHING;
`;

// ─── Main ─────────────────────────────────────────────────────────────────────
async function migrate() {
  if (!process.env.DATABASE_URL) {
    console.error('❌ DATABASE_URL not set');
    process.exit(1);
  }

  const rawUrl = process.env.DATABASE_URL;
  const connectionString = rawUrl.replace(/[?&]sslmode=[^&]*/g, '').replace(/\?$/, '');
  const needsSSL = rawUrl.includes('neon.tech') || rawUrl.includes('sslmode=require') || process.env.NODE_ENV === 'production';

  const pool = new Pool({
    connectionString,
    ssl: needsSSL ? { rejectUnauthorized: false } : false,
    connectionTimeoutMillis: 15000,
  });

  const client = await pool.connect();

  try {
    // Check if users table exists
    const { rows } = await client.query(`
      SELECT COUNT(*) AS count FROM information_schema.tables
      WHERE table_schema = 'public' AND table_name = 'users'
    `);
    const isFresh = parseInt(rows[0].count) === 0;

    if (isFresh) {
      // Try to find schema file, fall back to inline schema
      const schemaPath = findFile(SCHEMA_PATHS);
      let sql;

      if (schemaPath) {
        console.log(`🔄 Fresh DB — running schema from: ${schemaPath}`);
        sql = fs.readFileSync(schemaPath, 'utf8');
      } else {
        console.log('🔄 Fresh DB — schema file not found, using inline schema');
        sql = INLINE_SCHEMA;
      }

      await client.query('BEGIN');
      await client.query(sql);
      await client.query('COMMIT');
      console.log('✅ Schema applied successfully');
    } else {
      console.log('✅ Database exists — checking for pending migrations...');

      await client.query(`
        CREATE TABLE IF NOT EXISTS schema_migrations (
          filename   VARCHAR(255) PRIMARY KEY,
          applied_at TIMESTAMPTZ DEFAULT NOW()
        )
      `);

      const migrationsDir = findDir(MIGRATIONS_DIRS);
      if (!migrationsDir) {
        console.log('ℹ No migrations directory found — skipping');
        return;
      }

      const files = fs.readdirSync(migrationsDir).filter((f) => f.endsWith('.sql')).sort();
      const { rows: applied } = await client.query('SELECT filename FROM schema_migrations');
      const appliedSet = new Set(applied.map((r) => r.filename));
      const pending = files.filter((f) => !appliedSet.has(f));

      if (pending.length === 0) {
        console.log('✅ All migrations up to date');
        return;
      }

      for (const file of pending) {
        const filePath = path.join(migrationsDir, file);
        const sql = fs.readFileSync(filePath, 'utf8');
        console.log(`🔄 Applying: ${file}`);
        await client.query('BEGIN');
        await client.query(sql);
        await client.query('INSERT INTO schema_migrations (filename) VALUES ($1)', [file]);
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
