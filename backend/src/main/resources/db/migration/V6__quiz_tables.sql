-- Recreate quiz tables with correct schema (quiz_id FK)
-- Old V6 created tables with deck_id instead of quiz_id, causing failures
-- This migration drops and recreates with correct schema

-- Drop old tables in correct order
DROP TABLE IF EXISTS quiz_answers;
DROP TABLE IF EXISTS quiz_attempts;
DROP TABLE IF EXISTS quiz_questions;
DROP TABLE IF EXISTS quizzes;

-- ============================================================
-- 1. quizzes
-- ============================================================
CREATE TABLE quizzes (
    id                 UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title              VARCHAR(200) NOT NULL,
    description        TEXT,
    cover_image_url    TEXT,
    deck_id            UUID NOT NULL REFERENCES decks(id),
    owner_id           UUID NOT NULL REFERENCES users(id),
    owner_type         VARCHAR(20) NOT NULL CHECK (owner_type IN ('USER', 'ADMIN')),
    is_public          BOOLEAN NOT NULL DEFAULT FALSE,
    time_limit_seconds INT,
    question_count     INT NOT NULL DEFAULT 10,
    attempt_count      INT NOT NULL DEFAULT 0,
    avg_score          DOUBLE PRECISION,
    created_at         TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at         TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_quizzes_deck   ON quizzes(deck_id);
CREATE INDEX idx_quizzes_owner  ON quizzes(owner_id);
CREATE INDEX idx_quizzes_public ON quizzes(is_public, created_at DESC) WHERE is_public = TRUE;

-- ============================================================
-- 2. quiz_questions
-- ============================================================
CREATE TABLE quiz_questions (
    id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    quiz_id        UUID NOT NULL REFERENCES quizzes(id) ON DELETE CASCADE,
    card_id        UUID REFERENCES cards(id),
    question_type  VARCHAR(30) NOT NULL DEFAULT 'MULTIPLE_CHOICE'
                      CHECK (question_type IN ('MULTIPLE_CHOICE', 'TRUE_FALSE', 'FILL_IN')),
    question_text  TEXT NOT NULL,
    correct_answer TEXT NOT NULL,
    options        JSONB,
    sort_order     INT NOT NULL DEFAULT 0,
    created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_quiz_questions_quiz ON quiz_questions(quiz_id);

-- ============================================================
-- 3. quiz_attempts
-- ============================================================
CREATE TABLE quiz_attempts (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id             UUID NOT NULL REFERENCES users(id),
    quiz_id             UUID NOT NULL REFERENCES quizzes(id),
    score               DOUBLE PRECISION NOT NULL DEFAULT 0,
    total_questions     INT NOT NULL DEFAULT 0,
    correct_answers     INT NOT NULL DEFAULT 0,
    xp_earned           INT NOT NULL DEFAULT 0,
    time_taken_seconds  INT,
    started_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    finished_at         TIMESTAMPTZ,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_quiz_attempts_user  ON quiz_attempts(user_id, started_at DESC);
CREATE INDEX idx_quiz_attempts_quiz ON quiz_attempts(quiz_id);

-- ============================================================
-- 4. quiz_answers
-- ============================================================
CREATE TABLE quiz_answers (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    attempt_id      UUID NOT NULL REFERENCES quiz_attempts(id) ON DELETE CASCADE,
    question_id     UUID NOT NULL REFERENCES quiz_questions(id),
    selected_answer TEXT,
    is_correct      BOOLEAN NOT NULL DEFAULT FALSE,
    answered_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_quiz_answers_attempt  ON quiz_answers(attempt_id);
CREATE INDEX idx_quiz_answers_question ON quiz_answers(question_id);

-- ============================================================
-- Triggers: updated_at
-- ============================================================
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = NOW(); RETURN NEW; END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER quizzes_updated_at       BEFORE UPDATE ON quizzes         FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER quiz_questions_updated_at BEFORE UPDATE ON quiz_questions FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER quiz_attempts_updated_at BEFORE UPDATE ON quiz_attempts FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER quiz_answers_updated_at  BEFORE UPDATE ON quiz_answers  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
