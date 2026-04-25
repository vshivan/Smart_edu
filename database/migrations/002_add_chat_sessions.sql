-- Migration 002: Add chat_sessions table (replaces MongoDB ChatSession)
-- Safe to run multiple times (IF NOT EXISTS)

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
