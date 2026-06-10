-- Deck copy lineage: gốc deck khi user copy từ Khám phá
ALTER TABLE decks
    ADD COLUMN source_deck_id UUID REFERENCES decks(id);

CREATE INDEX idx_decks_source_deck
    ON decks(source_deck_id)
    WHERE deleted_at IS NULL AND source_deck_id IS NOT NULL;
