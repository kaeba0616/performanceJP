-- 024_announcements.sql
-- 공지사항 + 발송 로그. PRD F4 / SPEC §4 `024_announcements.sql`.
--
-- 발송 모델:
--   - staff 가 공지를 작성(초안, sent_at IS NULL)하고, 서버 API 가 대상(audience)에게
--     이메일(Resend) + 웹푸시를 발송한 뒤 sent_at 을 채운다.
--   - audience:
--       'members'   → 해당 org 소속 단원(org_members) 중 이메일/푸시 대상
--       'reservers' → 해당 공연(performance_id) 예약자 중 이메일 보유자
--       'public'    → 단체/공연 페이지에 공개 게시 (개별 발송 없음)
--   - announcement_deliveries 로 (공지 × 대상 × 채널) 중복 발송을 방지한다.
--     (기존 notifications_log / web_push_log 와 동일한 dedup 패턴)

CREATE TABLE IF NOT EXISTS announcements (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id         uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  performance_id uuid REFERENCES performances(id) ON DELETE SET NULL,  -- 특정 공연 공지(선택)
  title          text NOT NULL,
  body           text NOT NULL,
  audience       text NOT NULL CHECK (audience IN ('members', 'reservers', 'public')),
  sent_at        timestamptz,                          -- NULL = 초안, 값 있으면 발송 완료
  created_by     uuid REFERENCES auth.users(id) ON DELETE SET NULL,  -- 감사용, nullable (ON DELETE SET NULL)
  created_at     timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_announcements_org  ON announcements(org_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_announcements_perf ON announcements(performance_id);

-- ─────────────────────────────────────────────────────────────
-- announcement_deliveries (발송 로그 — 채널별 dedup/감사)
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS announcement_deliveries (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  announcement_id uuid NOT NULL REFERENCES announcements(id) ON DELETE CASCADE,
  channel         text NOT NULL CHECK (channel IN ('email', 'push')),
  recipient       text NOT NULL,          -- 이메일 주소 또는 push endpoint 해시/식별자
  sent_at         timestamptz NOT NULL DEFAULT now(),
  UNIQUE (announcement_id, channel, recipient)
);

CREATE INDEX IF NOT EXISTS idx_announcement_deliveries_ann
  ON announcement_deliveries(announcement_id);

-- ─────────────────────────────────────────────────────────────
-- RLS
--   쓰기(작성/발송)는 service_role(서버 API) 만 → 정책 없음.
--   SELECT:
--     announcements          → audience='public' 은 누구나, 그 외 소속 org 멤버만.
--     announcement_deliveries→ 로그이므로 클라이언트 비공개(정책 없음, service_role 만).
-- ─────────────────────────────────────────────────────────────
ALTER TABLE announcements          ENABLE ROW LEVEL SECURITY;
ALTER TABLE announcement_deliveries ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS announcements_select ON announcements;
CREATE POLICY announcements_select ON announcements
  FOR SELECT USING (
    audience = 'public'
    OR is_org_member(org_id)
  );
