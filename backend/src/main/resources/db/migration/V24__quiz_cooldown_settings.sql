-- Quiz Cooldown Settings
-- Stores global and per-quiz/user cooldown configuration

CREATE TABLE quiz_cooldown_settings (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    enabled         BOOLEAN NOT NULL DEFAULT TRUE,
    min_seconds_between_attempts INT NOT NULL DEFAULT 600,  -- 10 minutes
    max_attempts_per_quiz_per_day INT NOT NULL DEFAULT 5,
    max_total_attempts_per_day    INT NOT NULL DEFAULT 20,
    max_total_attempts_per_week   INT NOT NULL DEFAULT 50,
    bypass_user_id  UUID,
    bypass_quiz_id  UUID,
    bypass_expires_at TIMESTAMPTZ,
    bypass_reason   TEXT,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Single row pattern: app-wide settings in one record
INSERT INTO quiz_cooldown_settings (id, enabled, min_seconds_between_attempts,
    max_attempts_per_quiz_per_day, max_total_attempts_per_day, max_total_attempts_per_week)
VALUES (
    '00000000-0000-0000-0000-000000000001',
    TRUE,
    600,   -- 10 minutes
    5,     -- max 5 attempts per quiz per day
    20,    -- max 20 total attempts per day
    50     -- max 50 total attempts per week
);

-- Simple indexes for bypass lookups (no partial predicate with NOW())
CREATE INDEX idx_qcs_bypass_user ON quiz_cooldown_settings(bypass_user_id)
    WHERE bypass_user_id IS NOT NULL;
CREATE INDEX idx_qcs_bypass_quiz ON quiz_cooldown_settings(bypass_quiz_id)
    WHERE bypass_quiz_id IS NOT NULL;

-- Trigger to auto-update updated_at
CREATE OR REPLACE FUNCTION update_quiz_cooldown_settings_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_quiz_cooldown_settings_updated
    BEFORE UPDATE ON quiz_cooldown_settings
    FOR EACH ROW EXECUTE FUNCTION update_quiz_cooldown_settings_timestamp();
