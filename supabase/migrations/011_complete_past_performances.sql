-- 011_complete_past_performances.sql
-- 공연 일자가 지난 공연의 status를 자동으로 'completed'로 설정.
--
-- 기준 일자: COALESCE(end_date, start_date)
-- 비교 기준: KST(Asia/Seoul) 오늘 00:00
-- 기준 일자 < KST 오늘 → status = 'completed'
--
-- 1) 트리거: INSERT/UPDATE 시 자동 적용 (admin이 과거 날짜로 저장해도 보정)
-- 2) 백필: 이미 지난 공연 일괄 반영 (배포 직후 1회)
--
-- 매일 자정 자동 반영은 admin 목록 API에서 가벼운 UPDATE로 처리 (cron 불요).

CREATE OR REPLACE FUNCTION set_completed_if_past()
RETURNS trigger AS $$
BEGIN
  IF COALESCE(NEW.end_date, NEW.start_date) < (now() AT TIME ZONE 'Asia/Seoul')::date
     AND NEW.status IS DISTINCT FROM 'completed' THEN
    NEW.status := 'completed';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS performances_set_completed_if_past ON performances;
CREATE TRIGGER performances_set_completed_if_past
  BEFORE INSERT OR UPDATE ON performances
  FOR EACH ROW
  EXECUTE FUNCTION set_completed_if_past();

UPDATE performances
SET status = 'completed'
WHERE COALESCE(end_date, start_date) < (now() AT TIME ZONE 'Asia/Seoul')::date
  AND status IS DISTINCT FROM 'completed';
