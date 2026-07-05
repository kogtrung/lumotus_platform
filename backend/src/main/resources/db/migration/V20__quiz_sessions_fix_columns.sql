-- Quiz System Refactor: Fix missing columns from V19
-- V19 already ran but was missing skipped_answers column

-- Add skipped_answers column to quiz_attempts
ALTER TABLE quiz_attempts ADD COLUMN IF NOT EXISTS skipped_answers INT NOT NULL DEFAULT 0;

-- Backfill skipped_answers = 0 for existing records
UPDATE quiz_attempts SET skipped_answers = 0 WHERE skipped_answers IS NULL;
