-- 016_performance_times.sql
-- 시작/종료 일자에 시간 정보를 분리 컬럼으로 추가.
--
-- start_date / end_date는 date 컬럼 그대로 유지 (캘린더/카드/필터/트리거 호환).
-- start_time / end_time은 선택 입력. 채워져 있으면 디테일 페이지에서
--   "2026년 5월 16일(토) 오후 6시"식 시간 포함 표시.
-- show_times(회차)와는 별개: 회차가 비어있고 start_time이 있으면 그걸 사용.

ALTER TABLE performances ADD COLUMN IF NOT EXISTS start_time time;
ALTER TABLE performances ADD COLUMN IF NOT EXISTS end_time   time;
