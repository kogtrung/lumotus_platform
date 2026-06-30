-- V12: Quiz DRAFT status for user-created quizzes
-- ============================================================

-- 1. Extend check constraint to include DRAFT
ALTER TABLE quizzes DROP CONSTRAINT quizzes_status_check;
ALTER TABLE quizzes ADD CONSTRAINT quizzes_status_check
    CHECK (status IN ('DRAFT', 'PENDING', 'APPROVED', 'REJECTED'));

-- 2. Existing PENDING quizzes → DRAFT (not yet submitted for review)
UPDATE quizzes SET status = 'DRAFT' WHERE status = 'PENDING';
