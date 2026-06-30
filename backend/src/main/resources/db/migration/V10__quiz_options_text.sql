-- Change quiz_questions.options from jsonb to TEXT
-- Hibernate maps String to TEXT, not jsonb automatically
ALTER TABLE quiz_questions ALTER COLUMN options TYPE TEXT;
