-- V29: Add requested_topic column to decks
-- Stores user's topic suggestion when submitting for approval

ALTER TABLE decks
ADD COLUMN requested_topic VARCHAR(200);

COMMENT ON COLUMN decks.requested_topic IS 'User-submitted topic suggestion when requesting approval';
