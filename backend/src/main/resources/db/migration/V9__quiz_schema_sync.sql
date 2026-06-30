-- Sync quizzes table with JPA entity schema
-- Fix missing columns from V6__quiz_tables.sql

-- Add status column if not exists
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'quizzes' AND column_name = 'status') THEN
        ALTER TABLE quizzes ADD COLUMN status VARCHAR(20) NOT NULL DEFAULT 'PENDING';
    END IF;
END $$;

-- Add owner_username column if not exists
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'quizzes' AND column_name = 'owner_username') THEN
        ALTER TABLE quizzes ADD COLUMN owner_username VARCHAR(100);
    END IF;
END $$;

-- Add rejection_note column if not exists
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'quizzes' AND column_name = 'rejection_note') THEN
        ALTER TABLE quizzes ADD COLUMN rejection_note TEXT;
    END IF;
END $$;

-- Drop owner_type column if exists (moved to separate quiz_moderation or removed)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'quizzes' AND column_name = 'owner_type') THEN
        ALTER TABLE quizzes DROP COLUMN IF EXISTS owner_type;
    END IF;
END $$;

-- Update existing quizzes to have APPROVED status
UPDATE quizzes SET status = 'APPROVED' WHERE status IS NULL OR status = '';

-- Indexes
CREATE INDEX IF NOT EXISTS idx_quizzes_status ON quizzes(status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_quiz_attempts_score ON quiz_attempts(quiz_id, score DESC);

COMMENT ON COLUMN quizzes.status IS 'PENDING=awaiting approval, APPROVED=visible in explore, REJECTED=rejected by admin';
