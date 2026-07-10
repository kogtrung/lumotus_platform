-- V28__cascade_delete_deck.sql
-- Add ON DELETE CASCADE to all deck-related foreign keys.
-- After this, FK constraints will auto-cascade deletes to child rows,
-- making hardDeleteDeck simpler and safer in the future.
-- Note: existing data is unaffected.

-- cards.deck_id
ALTER TABLE cards DROP CONSTRAINT IF EXISTS cards_deck_id_fkey;
ALTER TABLE cards ADD CONSTRAINT cards_deck_id_fkey
    FOREIGN KEY (deck_id) REFERENCES decks(id) ON DELETE CASCADE;

-- user_card_review.deck_id
ALTER TABLE user_card_review DROP CONSTRAINT IF EXISTS user_card_review_deck_id_fkey;
ALTER TABLE user_card_review ADD CONSTRAINT user_card_review_deck_id_fkey
    FOREIGN KEY (deck_id) REFERENCES decks(id) ON DELETE CASCADE;

-- user_deck_progress.deck_id
ALTER TABLE user_deck_progress DROP CONSTRAINT IF EXISTS user_deck_progress_deck_id_fkey;
ALTER TABLE user_deck_progress ADD CONSTRAINT user_deck_progress_deck_id_fkey
    FOREIGN KEY (deck_id) REFERENCES decks(id) ON DELETE CASCADE;

-- deck_topics.deck_id
ALTER TABLE deck_topics DROP CONSTRAINT IF EXISTS deck_topics_deck_id_fkey;
ALTER TABLE deck_topics ADD CONSTRAINT deck_topics_deck_id_fkey
    FOREIGN KEY (deck_id) REFERENCES decks(id) ON DELETE CASCADE;

-- deck_tags.deck_id
ALTER TABLE deck_tags DROP CONSTRAINT IF EXISTS deck_tags_deck_id_fkey;
ALTER TABLE deck_tags ADD CONSTRAINT deck_tags_deck_id_fkey
    FOREIGN KEY (deck_id) REFERENCES decks(id) ON DELETE CASCADE;

-- deck_moderation_logs.deck_id
ALTER TABLE deck_moderation_logs DROP CONSTRAINT IF EXISTS deck_moderation_logs_deck_id_fkey;
ALTER TABLE deck_moderation_logs ADD CONSTRAINT deck_moderation_logs_deck_id_fkey
    FOREIGN KEY (deck_id) REFERENCES decks(id) ON DELETE CASCADE;
