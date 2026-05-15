-- 012_sync_status_with_date.sql
-- 011의 트리거를 양방향으로 확장.
--
-- 규칙:
--   기준일 = COALESCE(end_date, start_date), 비교는 KST 오늘.
--   기준일 < 오늘  AND  status != 'completed'  →  status = 'completed'
--   기준일 >= 오늘 AND  status  = 'completed'  →  status = 'on_sale'
--   그 외(sold_out, upcoming 등 수동 선택)은 보존.
--
-- 011에서 만든 set_completed_if_past 트리거/함수는 제거하고 이름 변경.

DROP TRIGGER IF EXISTS performances_set_completed_if_past ON performances;
DROP FUNCTION IF EXISTS set_completed_if_past();

CREATE OR REPLACE FUNCTION sync_performance_status_with_date()
RETURNS trigger AS $$
DECLARE
  today_kst date := (now() AT TIME ZONE 'Asia/Seoul')::date;
  ref_date  date := COALESCE(NEW.end_date, NEW.start_date);
BEGIN
  IF ref_date < today_kst THEN
    IF NEW.status IS DISTINCT FROM 'completed' THEN
      NEW.status := 'completed';
    END IF;
  ELSIF NEW.status = 'completed' THEN
    NEW.status := 'on_sale';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS performances_sync_status_with_date ON performances;
CREATE TRIGGER performances_sync_status_with_date
  BEFORE INSERT OR UPDATE ON performances
  FOR EACH ROW
  EXECUTE FUNCTION sync_performance_status_with_date();

-- 백필: 일정이 미래로 미뤄진 채 'completed'로 남아있는 row 보정
UPDATE performances
SET status = 'on_sale'
WHERE status = 'completed'
  AND COALESCE(end_date, start_date) >= (now() AT TIME ZONE 'Asia/Seoul')::date;
