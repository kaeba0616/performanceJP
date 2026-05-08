-- 007_rls.sql
-- Enable Row Level Security on all remaining public tables.
--
-- 보안 모델:
--   - anon key는 브라우저에 노출됨 (NEXT_PUBLIC_SUPABASE_ANON_KEY).
--   - 따라서 anon 권한으로 가능한 모든 행위를 RLS 정책으로 명시적으로 제한한다.
--   - 서버 라우트(/api/submissions, /api/subscribe, /api/verify, /api/admin/*)는
--     service_role 키를 사용하므로 RLS를 우회한다 → 정책에 영향받지 않는다.
--
-- 분류:
--   1) 공개 콘텐츠 (artists, performances, source_listings)
--      → anon SELECT 허용, write는 service_role만.
--   2) 사용자 제출/구독/알림 (submissions, subscribers, subscriptions, notifications_log)
--      → anon SELECT/INSERT/UPDATE/DELETE 모두 차단. 서버 API 경유 필수.
--
-- 참고: 006_add_profiles_and_attendances.sql 에서 profiles, user_attendances는 이미 RLS 적용됨.

-- ─────────────────────────────────────────────────────────────
-- 1. 공개 콘텐츠: anon이 읽을 수 있어야 함 (홈, 검색, 캘린더 등)
-- ─────────────────────────────────────────────────────────────

-- artists
ALTER TABLE artists ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS artists_select_all ON artists;
CREATE POLICY artists_select_all ON artists
  FOR SELECT USING (true);

-- performances
ALTER TABLE performances ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS performances_select_all ON performances;
CREATE POLICY performances_select_all ON performances
  FOR SELECT USING (true);

-- source_listings (티켓 링크)
ALTER TABLE source_listings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS source_listings_select_all ON source_listings;
CREATE POLICY source_listings_select_all ON source_listings
  FOR SELECT USING (true);

-- ─────────────────────────────────────────────────────────────
-- 2. 서버 전용 테이블: anon은 어떤 행위도 불가
--    (RLS enabled + 정책 없음 = anon/authenticated 전부 거부, service_role만 통과)
-- ─────────────────────────────────────────────────────────────

ALTER TABLE submissions       ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscribers       ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscriptions     ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications_log ENABLE ROW LEVEL SECURITY;

-- ─────────────────────────────────────────────────────────────
-- 검증용 쿼리 (마이그레이션 후 실행해 확인)
-- ─────────────────────────────────────────────────────────────
-- SELECT schemaname, tablename, rowsecurity
-- FROM pg_tables
-- WHERE schemaname = 'public'
-- ORDER BY tablename;
--
-- 모든 row의 rowsecurity 가 true 여야 한다.
