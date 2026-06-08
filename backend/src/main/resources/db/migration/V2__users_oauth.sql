-- Google OAuth: oauth_provider + oauth_subject on users
-- Ref: docs/spec.md §2.2 users

ALTER TABLE users
    ADD COLUMN oauth_provider VARCHAR(20),
    ADD COLUMN oauth_subject VARCHAR(255);

CREATE UNIQUE INDEX idx_users_oauth_provider_subject
    ON users(oauth_provider, oauth_subject)
    WHERE oauth_provider IS NOT NULL;
