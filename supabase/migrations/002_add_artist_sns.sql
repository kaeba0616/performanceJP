-- 002_add_artist_sns.sql
-- Add SNS columns to artists table

ALTER TABLE artists ADD COLUMN instagram_url text;
ALTER TABLE artists ADD COLUMN youtube_url text;
