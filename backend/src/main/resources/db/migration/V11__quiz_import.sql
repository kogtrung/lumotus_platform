-- V9: Quiz import from CSV — no deck required
-- ============================================================

-- 1. quiz_type: distinguishes source of quiz questions
ALTER TABLE quizzes ADD COLUMN quiz_type VARCHAR(20) NOT NULL DEFAULT 'GENERATED';
COMMENT ON COLUMN quizzes.quiz_type IS 'GENERATED=user-created from deck, IMPORTED=admin-uploaded from CSV';

-- 2. deck_id: make nullable (IMPORTED quizzes have no deck)
ALTER TABLE quizzes ALTER COLUMN deck_id DROP NOT NULL;

-- 3. is_immutable: IMPORTED quizzes cannot be edited or deleted by owner
ALTER TABLE quizzes ADD COLUMN is_immutable BOOLEAN NOT NULL DEFAULT FALSE;
COMMENT ON COLUMN quizzes.is_immutable IS 'True = quiz cannot be edited or deleted by owner';

-- 4. Normalize existing quizzes
UPDATE quizzes SET quiz_type = 'GENERATED', is_immutable = FALSE;

-- 5. Indexes for IMPORTED quiz listing
CREATE INDEX IF NOT EXISTS idx_quizzes_type ON quizzes(quiz_type);
CREATE INDEX IF NOT EXISTS idx_quizzes_type_status ON quizzes(quiz_type, status) WHERE quiz_type = 'IMPORTED';
