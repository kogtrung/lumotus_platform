-- Quiz System Refactor Phase 1: Quiz Sessions table
-- Manages active quiz sessions with Redis-backed answer storage
-- Ref: docs/flow-quiz.md §1-2

-- Quiz Sessions: tracks user quiz attempts with activity tracking
CREATE TABLE quiz_sessions (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    attempt_id      UUID        NOT NULL REFERENCES quiz_attempts(id) ON DELETE CASCADE,
    user_id         UUID        NOT NULL REFERENCES users(id),
    quiz_id         UUID        NOT NULL REFERENCES quizzes(id),
    status          VARCHAR(20) NOT NULL DEFAULT 'IN_PROGRESS',
    started_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    ended_at        TIMESTAMPTZ,
    last_activity   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for session lookups
CREATE INDEX idx_quiz_sessions_user ON quiz_sessions(user_id, status);
CREATE INDEX idx_quiz_sessions_attempt ON quiz_sessions(attempt_id);
CREATE INDEX idx_quiz_sessions_quiz ON quiz_sessions(quiz_id);

-- Add status column to quiz_attempts (for IN_PROGRESS/COMPLETED/ABANDONED)
ALTER TABLE quiz_attempts ADD COLUMN IF NOT EXISTS status VARCHAR(20) NOT NULL DEFAULT 'COMPLETED';

-- Add xp_base field to quizzes for configurable XP rewards
ALTER TABLE quizzes ADD COLUMN IF NOT EXISTS xp_base INT NOT NULL DEFAULT 10;
ALTER TABLE quizzes ADD COLUMN IF NOT EXISTS xp_bonus INT NOT NULL DEFAULT 20;

-- Backfill existing attempts to COMPLETED status
UPDATE quiz_attempts SET status = 'COMPLETED' WHERE finished_at IS NOT NULL;
UPDATE quiz_attempts SET status = 'IN_PROGRESS' WHERE finished_at IS NULL;

-- Add composite index for active session lookups
CREATE INDEX IF NOT EXISTS idx_quiz_attempts_user_status ON quiz_attempts(user_id, status);
