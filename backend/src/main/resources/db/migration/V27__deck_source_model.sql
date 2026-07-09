-- ============================================================
-- Lumotus V27: deck source model, community verification, XP multiplier
-- Ref: docs/spec.md §2.2 deck source types + verification workflow
-- ============================================================

-- 1. Add deck source/verification columns
ALTER TABLE decks
    ADD COLUMN IF NOT EXISTS source_type VARCHAR(20) NOT NULL DEFAULT 'PERSONAL';

ALTER TABLE decks
    ADD COLUMN IF NOT EXISTS xp_multiplier NUMERIC(3,2) NOT NULL DEFAULT 1.0;

ALTER TABLE decks
    ADD COLUMN IF NOT EXISTS verification_status VARCHAR(20);

ALTER TABLE decks
    ADD COLUMN IF NOT EXISTS verified_at TIMESTAMPTZ;

ALTER TABLE decks
    ADD COLUMN IF NOT EXISTS verified_by_id UUID REFERENCES users(id);

ALTER TABLE decks
    ADD COLUMN IF NOT EXISTS verification_note TEXT;

-- 2. Backfill legacy decks
-- OFFICIAL = ADMIN created
UPDATE decks
SET
    source_type = 'OFFICIAL',
    xp_multiplier = 1.0,
    is_public = TRUE,
    is_copyable = TRUE,
    verification_status = NULL
WHERE owner_type = 'ADMIN'
  AND deleted_at IS NULL;

-- COMMUNITY = public decks created by USER before V27
UPDATE decks
SET
    source_type = 'COMMUNITY',
    xp_multiplier = 1.0,
    verification_status = 'APPROVED'
WHERE owner_type = 'USER'
  AND is_public = TRUE
  AND deleted_at IS NULL
  AND source_deck_id IS NULL;

-- CLONE = copied from another deck
UPDATE decks
SET
    source_type = 'CLONE',
    xp_multiplier = 0.1,
    verification_status = NULL
WHERE source_deck_id IS NOT NULL
  AND deleted_at IS NULL;

-- PERSONAL = remaining private user decks
UPDATE decks
SET
    source_type = 'PERSONAL',
    xp_multiplier = 0.1,
    is_public = FALSE,
    verification_status = NULL
WHERE source_type = 'PERSONAL'
  AND deleted_at IS NULL;

-- 3. Indexes for source/approval workflows
CREATE INDEX IF NOT EXISTS idx_decks_source_type
    ON decks(source_type) WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_decks_verification
    ON decks(verification_status) WHERE deleted_at IS NULL AND verification_status IS NOT NULL;

-- 4. Moderation audit table
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
-- - Deck source types: PERSONAL, OFFICIAL, COMMUNITY, CLONE
-- - XP multiplier defaults: OFFICIAL=1.0, COMMUNITY=1.0, PERSONAL=0.1, CLONE=0.1
-- - Community deck flow:
--     PERSONAL -> submitForApproval() -> COMMUNITY + PENDING
--     ADMIN moderate -> APPROVED (is_public=TRUE) / REJECTED
--     APPROVED -> appears in Explore
-- - Streak still counts for PERSONAL/CLONE study activity
-- ============================================================
