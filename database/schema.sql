-- ============================================================
-- SmartEduLearn — PostgreSQL Schema
-- ============================================================

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================================
-- ENUMS
-- ============================================================
CREATE TYPE user_role AS ENUM ('learner', 'tutor', 'admin');
CREATE TYPE verification_status AS ENUM ('pending', 'approved', 'rejected');
CREATE TYPE doc_type AS ENUM ('certificate', 'resume', 'id_proof');
CREATE TYPE content_type AS ENUM ('video', 'pdf', 'text', 'quiz', 'coding');
CREATE TYPE difficulty AS ENUM ('beginner', 'intermediate', 'advanced');
CREATE TYPE course_creator AS ENUM ('ai', 'tutor');
CREATE TYPE session_status AS ENUM ('pending', 'confirmed', 'completed', 'cancelled');
CREATE TYPE payment_status AS ENUM ('pending', 'completed', 'failed', 'refunded');
CREATE TYPE subscription_plan AS ENUM ('free', 'pro', 'enterprise');
CREATE TYPE subscription_status AS ENUM ('active', 'cancelled', 'expired');
CREATE TYPE review_target AS ENUM ('course', 'tutor');
CREATE TYPE quiz_type AS ENUM ('mcq', 'case_based', 'coding');
CREATE TYPE question_type AS ENUM ('mcq', 'true_false', 'short_answer', 'code');
CREATE TYPE badge_type AS ENUM ('streak', 'completion', 'quiz', 'level', 'special');
CREATE TYPE ticket_status AS ENUM ('open', 'in_progress', 'resolved', 'closed');
CREATE TYPE ticket_priority AS ENUM ('low', 'medium', 'high', 'critical');

-- ============================================================
-- USERS
-- ============================================================
CREATE TABLE users (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email           VARCHAR(255) UNIQUE NOT NULL,
  password_hash   VARCHAR(255),
  google_id       VARCHAR(255) UNIQUE,
  role            user_role NOT NULL DEFAULT 'learner',
  first_name      VARCHAR(100) NOT NULL,
  last_name       VARCHAR(100) NOT NULL,
  avatar_url      TEXT,
  is_active       BOOLEAN DEFAULT true,   -- users active immediately; email verify optional
  is_verified     BOOLEAN DEFAULT false,  -- email verification status (separate from active)
  is_banned       BOOLEAN DEFAULT false,
  ban_reason      TEXT,
  banned_at       TIMESTAMPTZ,
  banned_by       UUID,
  last_login_at   TIMESTAMPTZ,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_users_google_id ON users(google_id);

-- ============================================================
-- LEARNER PROFILES
-- ============================================================
CREATE TABLE learner_profiles (
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

-- ============================================================
-- TUTOR PROFILES
-- ============================================================
CREATE TABLE tutor_profiles (
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
  verified_by         UUID REFERENCES users(id),
  rejection_reason    TEXT,
  created_at          TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_tutor_verification ON tutor_profiles(verification_status);
CREATE INDEX idx_tutor_available ON tutor_profiles(is_available);

-- ============================================================
-- TUTOR DOCUMENTS
-- ============================================================
CREATE TABLE tutor_documents (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tutor_id    UUID REFERENCES tutor_profiles(id) ON DELETE CASCADE,
  doc_type    doc_type NOT NULL,
  file_url    TEXT NOT NULL,
  file_name   VARCHAR(255),
  status      verification_status DEFAULT 'pending',
  reviewed_by UUID REFERENCES users(id),
  reviewed_at TIMESTAMPTZ,
  notes       TEXT,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- COURSES
-- ============================================================
CREATE TABLE courses (
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

CREATE INDEX idx_courses_subject ON courses(subject);
CREATE INDEX idx_courses_published ON courses(is_published);
CREATE INDEX idx_courses_creator ON courses(creator_id);
CREATE INDEX idx_courses_tags ON courses USING GIN(tags);

-- ============================================================
-- COURSE MODULES
-- ============================================================
CREATE TABLE course_modules (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id    UUID REFERENCES courses(id) ON DELETE CASCADE,
  title        VARCHAR(255) NOT NULL,
  description  TEXT,
  order_index  INTEGER NOT NULL,
  is_locked    BOOLEAN DEFAULT true,
  unlock_xp    INTEGER DEFAULT 0,
  created_at   TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_modules_course ON course_modules(course_id);

-- ============================================================
-- COURSE LESSONS
-- ============================================================
CREATE TABLE course_lessons (
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

CREATE INDEX idx_lessons_module ON course_lessons(module_id);

-- ============================================================
-- ENROLLMENTS
-- ============================================================
CREATE TABLE enrollments (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  learner_id      UUID REFERENCES users(id),
  course_id       UUID REFERENCES courses(id),
  enrolled_at     TIMESTAMPTZ DEFAULT NOW(),
  completed_at    TIMESTAMPTZ,
  progress_pct    DECIMAL(5,2) DEFAULT 0,
  last_lesson_id  UUID REFERENCES course_lessons(id),
  UNIQUE(learner_id, course_id)
);

CREATE INDEX idx_enrollments_learner ON enrollments(learner_id);
CREATE INDEX idx_enrollments_course ON enrollments(course_id);

-- ============================================================
-- LESSON PROGRESS
-- ============================================================
CREATE TABLE lesson_progress (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  learner_id    UUID REFERENCES users(id),
  lesson_id     UUID REFERENCES course_lessons(id),
  completed     BOOLEAN DEFAULT false,
  time_spent_s  INTEGER DEFAULT 0,
  completed_at  TIMESTAMPTZ,
  UNIQUE(learner_id, lesson_id)
);

-- ============================================================
-- QUIZZES
-- ============================================================
CREATE TABLE quizzes (
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

-- ============================================================
-- QUIZ QUESTIONS
-- ============================================================
CREATE TABLE quiz_questions (
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

-- ============================================================
-- QUIZ ATTEMPTS
-- ============================================================
CREATE TABLE quiz_attempts (
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

CREATE INDEX idx_attempts_learner_quiz ON quiz_attempts(learner_id, quiz_id);

-- ============================================================
-- BADGES
-- ============================================================
CREATE TABLE badges (
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

-- ============================================================
-- USER BADGES
-- ============================================================
CREATE TABLE user_badges (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID REFERENCES users(id),
  badge_id   UUID REFERENCES badges(id),
  earned_at  TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, badge_id)
);

CREATE INDEX idx_user_badges ON user_badges(user_id);

-- ============================================================
-- TUTOR AVAILABILITY SLOTS
-- ============================================================
CREATE TABLE tutor_slots (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tutor_id     UUID REFERENCES tutor_profiles(id) ON DELETE CASCADE,
  slot_start   TIMESTAMPTZ NOT NULL,
  slot_end     TIMESTAMPTZ NOT NULL,
  is_booked    BOOLEAN DEFAULT false,
  created_at   TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_slots_tutor ON tutor_slots(tutor_id, slot_start);

-- ============================================================
-- TUTOR SESSIONS (BOOKINGS)
-- ============================================================
CREATE TABLE tutor_sessions (
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
  cancelled_by    UUID REFERENCES users(id),
  cancel_reason   TEXT,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_sessions_tutor ON tutor_sessions(tutor_id);
CREATE INDEX idx_sessions_learner ON tutor_sessions(learner_id);

-- ============================================================
-- PAYMENTS
-- ============================================================
CREATE TABLE payments (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id           UUID REFERENCES users(id),
  reference_type    VARCHAR(50),
  reference_id      UUID,
  amount            DECIMAL(10,2) NOT NULL,
  currency          VARCHAR(3) DEFAULT 'USD',
  status            payment_status DEFAULT 'pending',
  stripe_payment_id TEXT,
  stripe_session_id TEXT,
  metadata          JSONB,
  created_at        TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_payments_user ON payments(user_id);
CREATE INDEX idx_payments_status ON payments(status);

-- ============================================================
-- SUBSCRIPTIONS
-- ============================================================
CREATE TABLE subscriptions (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID REFERENCES users(id),
  plan            subscription_plan DEFAULT 'free',
  status          subscription_status DEFAULT 'active',
  stripe_sub_id   TEXT,
  stripe_cust_id  TEXT,
  started_at      TIMESTAMPTZ DEFAULT NOW(),
  expires_at      TIMESTAMPTZ,
  cancelled_at    TIMESTAMPTZ,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- REVIEWS
-- ============================================================
CREATE TABLE reviews (
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

CREATE INDEX idx_reviews_target ON reviews(target_type, target_id);

-- ============================================================
-- CERTIFICATES
-- ============================================================
CREATE TABLE certificates (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  learner_id   UUID REFERENCES users(id),
  course_id    UUID REFERENCES courses(id),
  issued_at    TIMESTAMPTZ DEFAULT NOW(),
  cert_url     TEXT,
  cert_hash    VARCHAR(64) UNIQUE,
  UNIQUE(learner_id, course_id)
);

-- ============================================================
-- NOTIFICATIONS
-- ============================================================
CREATE TABLE notifications (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID REFERENCES users(id),
  type        VARCHAR(50) NOT NULL,
  title       VARCHAR(255) NOT NULL,
  message     TEXT,
  is_read     BOOLEAN DEFAULT false,
  metadata    JSONB,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_notifications_user ON notifications(user_id, is_read);

-- ============================================================
-- ADMIN AUDIT LOG
-- ============================================================
CREATE TABLE admin_audit_log (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id     UUID REFERENCES users(id),
  action       VARCHAR(100) NOT NULL,
  target_type  VARCHAR(50),
  target_id    UUID,
  details      JSONB,
  ip_address   INET,
  created_at   TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_audit_admin ON admin_audit_log(admin_id);
CREATE INDEX idx_audit_created ON admin_audit_log(created_at DESC);

-- ============================================================
-- PLATFORM SETTINGS
-- ============================================================
CREATE TABLE platform_settings (
  key         VARCHAR(100) PRIMARY KEY,
  value       JSONB NOT NULL,
  description TEXT,
  updated_by  UUID REFERENCES users(id),
  updated_at  TIMESTAMPTZ DEFAULT NOW()
);

-- Seed default settings
INSERT INTO platform_settings (key, value, description) VALUES
  ('platform_fee_percent', '20', 'Commission % taken from tutor sessions'),
  ('ai_model', '"gpt-4o"', 'OpenAI model for course/quiz generation'),
  ('max_quiz_attempts', '3', 'Max quiz retry attempts'),
  ('streak_grace_hours', '26', 'Hours after midnight before streak resets'),
  ('maintenance_mode', 'false', 'Put platform in maintenance mode');

-- ============================================================
-- SEED BADGES
-- ============================================================
INSERT INTO badges (name, description, icon_url, badge_type, criteria, xp_value) VALUES
  ('First Step', 'Complete your first lesson', '/badges/first-step.svg', 'completion', '{"lessons_completed": 1}', 50),
  ('Quiz Master', 'Score 100% on any quiz', '/badges/quiz-master.svg', 'quiz', '{"perfect_score": true}', 100),
  ('Week Warrior', '7-day learning streak', '/badges/week-warrior.svg', 'streak', '{"streak_days": 7}', 150),
  ('Month Champion', '30-day learning streak', '/badges/month-champion.svg', 'streak', '{"streak_days": 30}', 500),
  ('Course Completer', 'Complete your first course', '/badges/course-complete.svg', 'completion', '{"courses_completed": 1}', 300),
  ('Scholar', 'Reach Level 4', '/badges/scholar.svg', 'level', '{"level": 4}', 200),
  ('Master', 'Reach Level 6', '/badges/master.svg', 'level', '{"level": 6}', 400),
  ('Legend', 'Reach Level 8', '/badges/legend.svg', 'level', '{"level": 8}', 800);

-- ============================================================
-- CHAT SESSIONS (replaces MongoDB ChatSession model)
-- Stores AI tutor conversation history in PostgreSQL
-- ============================================================
CREATE TABLE IF NOT EXISTS chat_sessions (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  learner_id      UUID NOT NULL,
  course_id       UUID,
  messages        JSONB NOT NULL DEFAULT '[]',
  context_summary TEXT DEFAULT '',
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_chat_sessions_learner ON chat_sessions(learner_id);
CREATE INDEX IF NOT EXISTS idx_chat_sessions_course  ON chat_sessions(course_id);

-- ============================================================
-- PASSWORD RESET TOKENS
-- ============================================================
CREATE TABLE IF NOT EXISTS password_reset_tokens (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token_hash VARCHAR(64) NOT NULL UNIQUE,
  expires_at TIMESTAMPTZ NOT NULL,
  used_at    TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_prt_token_hash ON password_reset_tokens(token_hash);
CREATE INDEX IF NOT EXISTS idx_prt_user       ON password_reset_tokens(user_id);
