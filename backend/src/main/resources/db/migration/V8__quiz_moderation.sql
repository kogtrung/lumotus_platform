-- Quiz moderation: add status column
ALTER TABLE quizzes ADD COLUMN status VARCHAR(20) NOT NULL DEFAULT 'PENDING';

-- PENDING: user-created, awaiting admin approval
-- APPROVED: visible in public explore page
-- REJECTED: admin rejected

-- Existing quizzes: approve all (they were public)
UPDATE quizzes SET status = 'APPROVED';

-- Index for listing by status
CREATE INDEX IF NOT EXISTS idx_quizzes_status ON quizzes(status, created_at DESC);

-- Index for leaderboard queries
CREATE INDEX IF NOT EXISTS idx_quiz_attempts_score ON quiz_attempts(quiz_id, score DESC);

-- Add owner_username for display
ALTER TABLE quizzes ADD COLUMN owner_username VARCHAR(100);

COMMENT ON COLUMN quizzes.status IS 'PENDING=awaiting approval, APPROVED=visible in explore, REJECTED=rejected by admin';
