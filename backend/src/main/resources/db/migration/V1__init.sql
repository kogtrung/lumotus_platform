-- Lumotus V1: full schema, indexes, FTS, trigger total_cards
-- Ref: docs/spec.md §2.2–2.3

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ── users ────────────────────────────────────────────────────
CREATE TABLE users (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    username        VARCHAR(50)  NOT NULL UNIQUE,
    email           VARCHAR(255) NOT NULL UNIQUE,
    password_hash   VARCHAR(255) NOT NULL,
    avatar_url      TEXT,
    role            VARCHAR(20)  NOT NULL DEFAULT 'USER',
    xp              INT          NOT NULL DEFAULT 0,
    streak          INT          NOT NULL DEFAULT 0,
    last_study_date DATE,
    is_active       BOOLEAN      NOT NULL DEFAULT TRUE,
    created_at      TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

-- ── topics ───────────────────────────────────────────────────
CREATE TABLE topics (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name        VARCHAR(100) NOT NULL UNIQUE,
    slug        VARCHAR(120) NOT NULL UNIQUE,
    description TEXT,
    icon        VARCHAR(100),
    color_hex   CHAR(7),
    sort_order  INT          NOT NULL DEFAULT 0,
    created_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

-- ── decks ────────────────────────────────────────────────────
CREATE TABLE decks (
    id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title             VARCHAR(200) NOT NULL,
    description       TEXT,
    cover_image_url   TEXT,
    owner_id          UUID         NOT NULL REFERENCES users(id),
    owner_type        VARCHAR(20)  NOT NULL,
    is_public         BOOLEAN      NOT NULL DEFAULT FALSE,
    is_copyable       BOOLEAN      NOT NULL DEFAULT TRUE,
    language_front    VARCHAR(10)  NOT NULL DEFAULT 'en',
    language_back     VARCHAR(10)  NOT NULL DEFAULT 'vi',
    generated_by_ai   BOOLEAN      NOT NULL DEFAULT FALSE,
    generation_prompt TEXT,
    view_count        INT          NOT NULL DEFAULT 0,
    copy_count        INT          NOT NULL DEFAULT 0,
    search_vector     TSVECTOR GENERATED ALWAYS AS (
        setweight(to_tsvector('simple', coalesce(title, '')), 'A') ||
        setweight(to_tsvector('simple', coalesce(description, '')), 'B')
    ) STORED,
    deleted_at        TIMESTAMPTZ,
    created_at        TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    updated_at        TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

-- ── deck_topics ──────────────────────────────────────────────
CREATE TABLE deck_topics (
    deck_id     UUID        NOT NULL REFERENCES decks(id),
    topic_id    UUID        NOT NULL REFERENCES topics(id),
    assigned_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    PRIMARY KEY (deck_id, topic_id)
);

-- ── deck_tags ────────────────────────────────────────────────
CREATE TABLE deck_tags (
    deck_id    UUID        NOT NULL REFERENCES decks(id),
    user_id    UUID        NOT NULL REFERENCES users(id),
    tag_name   VARCHAR(50) NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    PRIMARY KEY (deck_id, user_id, tag_name)
);

-- ── cards ────────────────────────────────────────────────────
CREATE TABLE cards (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    deck_id         UUID         NOT NULL REFERENCES decks(id),
    front           TEXT         NOT NULL,
    back            TEXT         NOT NULL,
    phonetic        VARCHAR(200),
    part_of_speech  VARCHAR(50),
    hint            TEXT,
    example         TEXT,
    image_url       TEXT,
    icon            VARCHAR(100),
    audio_url       TEXT,
    difficulty      VARCHAR(20),
    sort_order      INT          NOT NULL DEFAULT 0,
    search_vector   TSVECTOR GENERATED ALWAYS AS (
        setweight(to_tsvector('simple', coalesce(front, '')), 'A') ||
        setweight(to_tsvector('simple', coalesce(back, '')), 'B')
    ) STORED,
    deleted_at      TIMESTAMPTZ,
    created_at      TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

-- ── user_card_review ─────────────────────────────────────────
CREATE TABLE user_card_review (
    user_id        UUID        NOT NULL REFERENCES users(id),
    card_id        UUID        NOT NULL REFERENCES cards(id),
    deck_id        UUID        NOT NULL REFERENCES decks(id),
    ease_factor    REAL        NOT NULL DEFAULT 2.5,
    interval_days  INT         NOT NULL DEFAULT 0,
    repetitions    INT         NOT NULL DEFAULT 0,
    next_review_at TIMESTAMPTZ NOT NULL,
    last_rating    VARCHAR(20),
    is_starred     BOOLEAN     NOT NULL DEFAULT FALSE,
    updated_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    PRIMARY KEY (user_id, card_id)
);

-- ── user_deck_progress ───────────────────────────────────────
CREATE TABLE user_deck_progress (
    user_id         UUID        NOT NULL REFERENCES users(id),
    deck_id         UUID        NOT NULL REFERENCES decks(id),
    total_cards     INT         NOT NULL,
    learned_cards   INT         NOT NULL DEFAULT 0,
    mastered_cards  INT         NOT NULL DEFAULT 0,
    last_studied_at TIMESTAMPTZ,
    is_copied_from  UUID        REFERENCES decks(id),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    PRIMARY KEY (user_id, deck_id)
);

-- ── quiz_questions ───────────────────────────────────────────
CREATE TABLE quiz_questions (
    id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    deck_id        UUID         NOT NULL REFERENCES decks(id),
    card_id        UUID         REFERENCES cards(id),
    question_type  VARCHAR(30)  NOT NULL,
    question_text  TEXT         NOT NULL,
    correct_answer TEXT         NOT NULL,
    options        JSONB,
    created_at     TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    updated_at     TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

-- ── quiz_attempts ────────────────────────────────────────────
CREATE TABLE quiz_attempts (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id             UUID         NOT NULL REFERENCES users(id),
    deck_id             UUID         NOT NULL REFERENCES decks(id),
    score               REAL,
    total_questions     INT          NOT NULL,
    correct_answers     INT          NOT NULL DEFAULT 0,
    xp_earned           INT          NOT NULL DEFAULT 0,
    time_taken_seconds  INT,
    started_at          TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    finished_at         TIMESTAMPTZ,
    created_at          TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

-- ── quiz_answers ─────────────────────────────────────────────
CREATE TABLE quiz_answers (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    attempt_id      UUID        NOT NULL REFERENCES quiz_attempts(id),
    question_id     UUID        NOT NULL REFERENCES quiz_questions(id),
    selected_answer TEXT,
    is_correct      BOOLEAN     NOT NULL,
    answered_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── daily_activity ───────────────────────────────────────────
CREATE TABLE daily_activity (
    user_id        UUID NOT NULL REFERENCES users(id),
    activity_date  DATE NOT NULL,
    cards_reviewed INT  NOT NULL DEFAULT 0,
    quiz_taken     INT  NOT NULL DEFAULT 0,
    xp_earned      INT  NOT NULL DEFAULT 0,
    study_minutes  INT  NOT NULL DEFAULT 0,
    PRIMARY KEY (user_id, activity_date)
);

-- ── async_jobs ───────────────────────────────────────────────
CREATE TABLE async_jobs (
    id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    type       VARCHAR(30) NOT NULL,
    status     VARCHAR(30) NOT NULL,
    user_id    UUID        NOT NULL REFERENCES users(id),
    result     JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── Indexes ──────────────────────────────────────────────────
CREATE INDEX idx_decks_owner ON decks(owner_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_decks_public ON decks(is_public, created_at DESC) WHERE deleted_at IS NULL;
CREATE INDEX idx_deck_topics_topic ON deck_topics(topic_id, deck_id);
CREATE INDEX idx_deck_tags_user ON deck_tags(user_id, deck_id);

CREATE INDEX idx_cards_deck_id ON cards(deck_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_cards_deck_sort ON cards(deck_id, sort_order) WHERE deleted_at IS NULL;

CREATE INDEX idx_ucr_user_due ON user_card_review(user_id, next_review_at);
CREATE INDEX idx_ucr_user_deck_due ON user_card_review(user_id, deck_id, next_review_at);
CREATE INDEX idx_ucr_user_starred ON user_card_review(user_id) WHERE is_starred = TRUE;

CREATE INDEX idx_udp_user_studied ON user_deck_progress(user_id, last_studied_at DESC NULLS LAST);

CREATE INDEX idx_users_xp_leaderboard ON users(xp DESC, id) WHERE is_active = TRUE;
CREATE INDEX idx_users_last_study ON users(last_study_date) WHERE is_active = TRUE;

CREATE INDEX idx_daily_activity_user_date ON daily_activity(user_id, activity_date DESC);

CREATE INDEX idx_quiz_questions_deck ON quiz_questions(deck_id);
CREATE INDEX idx_quiz_attempts_user ON quiz_attempts(user_id, started_at DESC);
CREATE INDEX idx_quiz_attempts_deck ON quiz_attempts(deck_id);
CREATE INDEX idx_quiz_answers_attempt ON quiz_answers(attempt_id);

CREATE INDEX idx_async_jobs_user_status ON async_jobs(user_id, status, created_at DESC);

CREATE INDEX idx_decks_fts ON decks USING gin(search_vector);
CREATE INDEX idx_cards_fts ON cards USING gin(search_vector);

-- ── Trigger: sync user_deck_progress.total_cards ─────────────
CREATE OR REPLACE FUNCTION sync_deck_total_cards()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE user_deck_progress
    SET total_cards = total_cards + 1, updated_at = NOW()
    WHERE deck_id = NEW.deck_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE user_deck_progress
    SET total_cards = GREATEST(total_cards - 1, 0), updated_at = NOW()
    WHERE deck_id = OLD.deck_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_cards_sync_total
  AFTER INSERT OR DELETE ON cards
  FOR EACH ROW EXECUTE FUNCTION sync_deck_total_cards();
