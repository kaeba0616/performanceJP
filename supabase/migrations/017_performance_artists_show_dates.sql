-- 017_performance_artists_show_dates.sql
-- 페스티벌 등에서 아티스트별 출연일이 다를 경우를 위해
-- performance_artists에 show_dates date[] 추가.
--
-- NULL 또는 빈 배열  → 모든 일자 출연 (기본 / 단독 공연)
-- 값이 있으면        → 해당 일자에만 출연
--
-- 비교 기준은 KST 로컬 날짜 (DB의 date 타입). start_date ~ end_date 범위 내에서 선택.

ALTER TABLE performance_artists
  ADD COLUMN IF NOT EXISTS show_dates date[];

-- date[] 배열에 GIN 인덱스 (선택적, 아티스트 프로필에서 '특정 일자에 출연' 쿼리할 때 유용)
CREATE INDEX IF NOT EXISTS idx_performance_artists_show_dates
  ON performance_artists USING GIN (show_dates);
