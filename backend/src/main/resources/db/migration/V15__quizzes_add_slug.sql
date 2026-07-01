-- Quiz slug: URL-friendly ref thay UUID (tương tự decks.slug theo spec.md §2.2)
-- Backward compatible: BE vẫn nhận UUID cũ trong path

ALTER TABLE quizzes ADD COLUMN slug VARCHAR(120);

-- Backfill: slugify title + hậu tố id ngắn (đảm bảo unique)
UPDATE quizzes q
SET slug = trim(both '-' from regexp_replace(lower(coalesce(trim(title), 'quiz')), '[^a-z0-9]+', '-', 'g'))
    || '-'
    || substr(replace(q.id::text, '-', ''), 1, 6)
WHERE slug IS NULL;

UPDATE quizzes SET slug = 'quiz-' || substr(replace(id::text, '-', ''), 1, 8)
WHERE slug IS NULL OR slug = '';

ALTER TABLE quizzes ALTER COLUMN slug SET NOT NULL;

-- Index cho lookup nhanh theo slug
CREATE INDEX idx_quizzes_slug ON quizzes(slug);
