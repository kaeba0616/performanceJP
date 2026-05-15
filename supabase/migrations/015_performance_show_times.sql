-- 015_performance_show_times.sql
-- 공연 회차(공연일 + 시작 시간) 목록을 jsonb 배열로 저장.
--
-- 예) [
--   { "datetime": "2026-05-16T18:00" },
--   { "datetime": "2026-05-17T18:00" }
-- ]
--
-- datetime은 KST 로컬 시각으로 해석 (timezone 없음).
-- start_date / end_date는 기존대로 유지 (카드/캘린더 범위 표시용).
-- show_times가 비어있으면 detail 페이지에서 기존 범위 형식으로 폴백.

ALTER TABLE performances
  ADD COLUMN IF NOT EXISTS show_times jsonb;
