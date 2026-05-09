-- 010_performance_artists.sql
-- 공연-아티스트 N:M 정규화 + 공연 type 분류 (solo / festival)
--
-- 모델:
--   performances.type = 'solo'     → 단독 공연. artist_id 필수 (대표 아티스트).
--   performances.type = 'festival' → 페스티벌. artist_id 선택 (대표 헤드라이너 또는 NULL).
--   performance_artists  →  공연의 모든 출연자 (라인업).
--
--   카드/리스트 표시: artist_id 있으면 그 아티스트 이름, 없으면 공연 제목만.
--   디테일 페이지: junction에서 라인업 전체 노출.
--   아티스트 프로필: junction을 통해 페스티벌 출연도 함께 노출.

-- ─────────────────────────────────────────────────────────────
-- 1) Junction
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS performance_artists (
  performance_id uuid NOT NULL REFERENCES performances(id) ON DELETE CASCADE,
  artist_id      uuid NOT NULL REFERENCES artists(id)      ON DELETE CASCADE,
  display_order  int  NOT NULL DEFAULT 1,
  created_at     timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (performance_id, artist_id)
);

CREATE INDEX IF NOT EXISTS idx_performance_artists_artist
  ON performance_artists (artist_id);
CREATE INDEX IF NOT EXISTS idx_performance_artists_perf_order
  ON performance_artists (performance_id, display_order);

-- RLS — 공개 읽기 (artists/performances와 동일 정책)
ALTER TABLE performance_artists ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS performance_artists_select_all ON performance_artists;
CREATE POLICY performance_artists_select_all ON performance_artists
  FOR SELECT USING (true);

-- ─────────────────────────────────────────────────────────────
-- 2) performances.type
-- ─────────────────────────────────────────────────────────────
ALTER TABLE performances
  ADD COLUMN IF NOT EXISTS type text NOT NULL DEFAULT 'solo';

ALTER TABLE performances
  DROP CONSTRAINT IF EXISTS performances_type_check;

ALTER TABLE performances
  ADD CONSTRAINT performances_type_check
  CHECK (type IN ('solo', 'festival'));

-- solo는 artist_id 필수, festival은 NULL 허용
ALTER TABLE performances
  DROP CONSTRAINT IF EXISTS performances_solo_requires_artist;

ALTER TABLE performances
  ADD CONSTRAINT performances_solo_requires_artist
  CHECK (
    (type = 'solo' AND artist_id IS NOT NULL)
    OR (type = 'festival')
  );

-- ─────────────────────────────────────────────────────────────
-- 3) Backfill — 기존 rows의 artist_id를 junction에 동기화
--    (현재 데이터 0개라 NOOP. 향후 안전장치)
-- ─────────────────────────────────────────────────────────────
INSERT INTO performance_artists (performance_id, artist_id, display_order)
SELECT id, artist_id, 1
FROM performances
WHERE artist_id IS NOT NULL
ON CONFLICT DO NOTHING;
