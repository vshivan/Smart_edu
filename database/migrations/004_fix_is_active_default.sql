-- Migration 004: Ensure is_active defaults to true and fix any false users
-- Safe to run multiple times

ALTER TABLE users ALTER COLUMN is_active SET DEFAULT true;

-- Activate any users who registered but got is_active=false (no email verify)
UPDATE users SET is_active = true WHERE is_active = false AND is_banned = false;
