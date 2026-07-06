-- V16: Fix user_card_review.last_rating type (VARCHAR -> SMALLINT)
-- First update any non-numeric values to a default
UPDATE user_card_review SET last_rating = '3' WHERE last_rating = 'GOOD';
UPDATE user_card_review SET last_rating = '3' WHERE last_rating NOT SIMILAR TO '[0-9]+';
-- Then alter the type
ALTER TABLE user_card_review ALTER COLUMN last_rating TYPE SMALLINT USING last_rating::SMALLINT;
