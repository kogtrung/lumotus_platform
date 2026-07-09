-- ============================================================
-- Lumotus V25: deck source model, community verification, SRS XP
-- Ref: docs/spec.md §2.2 deck source types + verification workflow
-- ============================================================

-- 1. Replace owner_type with source_type
-- OFFICIAL = Admin tạo, 100% XP + Streak
-- PERSONAL = User tạo, private, không XP
-- COMMUNITY = User publish lên explore, cần verified để nhận XP

ALTER TABLE decks
    ADD COLUMN IF NOT EXISTS source_type VARCHAR(20) NOT NULL DEFAULT 'PERSONAL';

ALTER TABLE decks
    ADD COLUMN IF NOT EXISTS verification_status VARCHAR(20);

ALTER TABLE decks
    ADD COLUMN IF NOT EXISTS verified_at TIMESTAMPTZ;

ALTER TABLE decks
    ADD COLUMN IF NOT EXISTS verified_by_id UUID REFERENCES users(id);

ALTER TABLE decks
    ADD COLUMN IF NOT EXISTS verification_note TEXT;

ALTER TABLE decks
    ADD COLUMN IF NOT EXISTS xp_enabled BOOLEAN NOT NULL DEFAULT FALSE;

ALTER TABLE decks
    ADD COLUMN IF NOT EXISTS original_deck_id UUID REFERENCES decks(id);

-- Migrate legacy owner_type data
UPDATE decks
SET source_type = CASE
    WHEN owner_type = 'ADMIN' THEN 'OFFICIAL'
    ELSE 'PERSONAL'
END
WHERE source_type = 'PERSONAL';

-- Legacy owner_type no longer needed; keep column for compatibility or drop
-- We keep it to avoid touching existing app code that may still read it
-- New code should use source_type

-- 2. Verification statuses for community decks
-- PENDING = user đã submit chờ admin duyệt
-- VERIFIED = admin đã duyệt, deck được cấp XP
-- REJECTED = admin từ chối

-- 3. Indexes for new workflows
CREATE INDEX IF NOT EXISTS idx_decks_source_type
    ON decks(source_type) WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_decks_verification
    ON decks(verification_status, source_type)
    WHERE deleted_at IS NULL AND source_type = 'COMMUNITY';

CREATE INDEX IF NOT EXISTS idx_decks_xp_enabled
    ON decks(xp_enabled)
    WHERE deleted_at IS NULL AND xp_enabled = TRUE;

CREATE INDEX IF NOT EXISTS idx_decks_original
    ON decks(original_deck_id)
    WHERE deleted_at IS NULL AND original_deck_id IS NOT NULL;

-- 4. Backfill: Official decks get full XP + streak + public
UPDATE decks
SET
    is_public = TRUE,
    is_copyable = TRUE,
    xp_enabled = TRUE,
    verification_status = NULL
WHERE source_type = 'OFFICIAL';

-- 5. Community deck moderation audit table
CREATE TABLE IF NOT EXISTS deck_moderation_logs (
    id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    deck_id        UUID NOT NULL REFERENCES decks(id),
    moderator_id   UUID NOT NULL REFERENCES users(id),
    action         VARCHAR(20) NOT NULL, -- APPROVE / REJECT
    note           TEXT,
    created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_deck_moderation_deck
    ON deck_moderation_logs(deck_id);

CREATE INDEX IF NOT EXISTS idx_deck_moderation_moderator
    ON deck_moderation_logs(moderator_id);

-- ============================================================
-- Notes for app layer:
-- - XP is only awarded when deck.xp_enabled = TRUE
-- - Streak still counts for PERSONAL deck study activity
-- - COMMUNITY deck flow:
--     PERSONAL -> publish() -> COMMUNITY + PENDING
--     ADMIN moderate -> VERIFIED/REJECTED
--     VERIFIED -> xp_enabled = TRUE, is_public = TRUE
-- - Clone/fork copies original_deck_id lineage
-- ============================================================
