-- 018_fix_kst_timestamp_backfill.sql
--
-- 배경: 어드민 폼의 datetime-local 입력(TZ 없음)을 그대로 timestamptz에 넣어왔다.
-- Supabase 기본 세션 TZ가 UTC라서, 사용자가 "KST 20:00" 의도로 넣은 값이
-- "UTC 20:00"(= KST 익일 05:00)로 저장됐다.
-- 앱 코드는 이제 입력값에 +09:00을 명시적으로 붙여 저장하지만, 기존 행은
-- 9시간 앞으로 당겨야 의도한 시각과 일치한다.
--
-- ⚠️  ONE-SHOT. 두 번 실행하면 9시간이 두 번 빠진다. 한 번만 실행할 것.
--     안전을 위해 트랜잭션으로 감싸고, 실행 전 백업/스냅샷 권장.

BEGIN;

UPDATE performances
SET    ticket_open_at = ticket_open_at - INTERVAL '9 hours'
WHERE  ticket_open_at IS NOT NULL;

UPDATE performances
SET    presale_open_at = presale_open_at - INTERVAL '9 hours'
WHERE  presale_open_at IS NOT NULL;

UPDATE submissions
SET    ticket_open_at = ticket_open_at - INTERVAL '9 hours'
WHERE  ticket_open_at IS NOT NULL;

UPDATE submissions
SET    presale_open_at = presale_open_at - INTERVAL '9 hours'
WHERE  presale_open_at IS NOT NULL;

COMMIT;
