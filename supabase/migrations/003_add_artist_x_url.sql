-- 003_add_artist_x_url.sql
-- Add X (Twitter) URL column to artists table

ALTER TABLE artists ADD COLUMN x_url text;
