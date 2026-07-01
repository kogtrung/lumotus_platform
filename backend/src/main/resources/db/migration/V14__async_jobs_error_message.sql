-- V14__async_jobs_error_message.sql
-- Add error_message column to async_jobs table (missing since V1)

ALTER TABLE async_jobs ADD COLUMN IF NOT EXISTS error_message TEXT;
