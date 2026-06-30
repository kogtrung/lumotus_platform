-- Make quiz_id nullable in quiz_attempts for quick-start quiz support
ALTER TABLE quiz_attempts ALTER COLUMN quiz_id DROP NOT NULL;
