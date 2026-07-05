-- Add optimistic-lock version column to quiz_attempts
-- Prevents race condition between submitQuiz and quitQuiz
ALTER TABLE quiz_attempts ADD COLUMN IF NOT EXISTS version BIGINT NOT NULL DEFAULT 0;
