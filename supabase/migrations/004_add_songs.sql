-- 004_add_songs.sql
-- Add hit songs (per-artist) and setlist (per-performance) as JSONB arrays.
-- Each element: { title: string, youtube_url?: string | null }

ALTER TABLE artists ADD COLUMN hit_songs jsonb;
ALTER TABLE performances ADD COLUMN setlist jsonb;
