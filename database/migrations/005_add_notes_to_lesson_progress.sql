-- Migration 005: Add notes column to lesson_progress
ALTER TABLE lesson_progress ADD COLUMN IF NOT EXISTS notes TEXT DEFAULT '';
