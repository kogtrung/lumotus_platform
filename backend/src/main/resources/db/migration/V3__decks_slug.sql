-- Deck slug: unique per owner (URL-friendly ref thay UUID)
-- Ref: docs/spec.md §2.2 decks.slug, §2.3 idx_decks_owner_slug

ALTER TABLE decks ADD COLUMN slug VARCHAR(120);

-- Backfill: slugify title + hậu tố id (đảm bảo unique per owner)
UPDATE decks d
SET slug = trim(both '-' from regexp_replace(lower(coalesce(trim(title), 'deck')), '[^a-z0-9]+', '-', 'g'))
    || '-'
    || substr(replace(d.id::text, '-', ''), 1, 6)
WHERE slug IS NULL;

UPDATE decks SET slug = 'deck-' || substr(replace(id::text, '-', ''), 1, 8)
WHERE slug IS NULL OR slug = '';

ALTER TABLE decks ALTER COLUMN slug SET NOT NULL;

CREATE UNIQUE INDEX idx_decks_owner_slug
    ON decks(owner_id, slug)
    WHERE deleted_at IS NULL;

CREATE INDEX idx_decks_public_slug
    ON decks(slug)
    WHERE deleted_at IS NULL AND is_public = TRUE;
