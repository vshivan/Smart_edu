-- Migration 003: Password reset tokens table
-- Safe to run multiple times (IF NOT EXISTS)

CREATE TABLE IF NOT EXISTS password_reset_tokens (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token_hash VARCHAR(64) NOT NULL UNIQUE,  -- SHA-256 of the raw token
  expires_at TIMESTAMPTZ NOT NULL,
  used_at    TIMESTAMPTZ,                  -- NULL = not yet used
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_prt_token_hash ON password_reset_tokens(token_hash);
CREATE INDEX IF NOT EXISTS idx_prt_user       ON password_reset_tokens(user_id);
