-- ============================================================
-- Lumotus V26: revert V25 deck source model / verification
-- Removes V25 columns, indexes, and deck_moderation_logs table.
-- ============================================================

-- Indexes
DROP INDEX IF EXISTS idx_decks_original;
DROP INDEX IF EXISTS idx_decks_xp_enabled;
DROP INDEX IF EXISTS idx_decks_verification;
DROP INDEX IF EXISTS idx_decks_source_type;
DROP INDEX IF EXISTS idx_deck_moderation_moderator;
DROP INDEX IF EXISTS idx_deck_moderation_deck;

-- Table
DROP TABLE IF EXISTS deck_moderation_logs;

-- Columns
ALTER TABLE decks DROP COLUMN IF EXISTS original_deck_id;
ALTER TABLE decks DROP COLUMN IF EXISTS xp_enabled;
ALTER TABLE decks DROP COLUMN IF EXISTS verification_note;
ALTER TABLE decks DROP COLUMN IF EXISTS verified_by_id;
ALTER TABLE decks DROP COLUMN IF EXISTS verified_at;
ALTER TABLE decks DROP COLUMN IF EXISTS verification_status;
ALTER TABLE decks DROP COLUMN IF EXISTS source_type;
