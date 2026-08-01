-- 026_rehearsals.sql
-- 연습 일정 + 단원 참석. PRD F6 / SPEC §12. (Q2=a 일정게시+참석체크, Q3=a 본인 체크)
--
-- 권한:
--   - rehearsals: 소속 org 멤버만 SELECT. 쓰기(생성·수정·삭제)는 service_role(staff 서버 API).
--   - rehearsal_attendances: 같은 org 멤버가 SELECT(참석 현황 열람).
--       쓰기는 service_role 서버 API가 세션 유저 = 본인(user_id)임을 검증 후 upsert
--       (Phase 1 "쓰기=service_role" 패턴 유지 — 본인 검증은 라우트에서).

CREATE TABLE IF NOT EXISTS rehearsals (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id         uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  performance_id uuid REFERENCES performances(id) ON DELETE SET NULL,
  title          text NOT NULL,
  starts_at      timestamptz NOT NULL,      -- KST
  ends_at        timestamptz,
  location       text,
  target_parts   text,
  created_by     uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at     timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_rehearsals_org ON rehearsals(org_id, starts_at);

CREATE TABLE IF NOT EXISTS rehearsal_attendances (
  rehearsal_id uuid NOT NULL REFERENCES rehearsals(id) ON DELETE CASCADE,
  user_id      uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  status       text NOT NULL CHECK (status IN ('going', 'not', 'maybe')),
  updated_at   timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (rehearsal_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_rehearsal_attendances_user ON rehearsal_attendances(user_id);

-- ─────────────────────────────────────────────────────────────
-- RLS
-- ─────────────────────────────────────────────────────────────
ALTER TABLE rehearsals            ENABLE ROW LEVEL SECURITY;
ALTER TABLE rehearsal_attendances ENABLE ROW LEVEL SECURITY;

-- rehearsals: 소속 멤버만 열람. 쓰기는 service_role.
DROP POLICY IF EXISTS rehearsals_select_member ON rehearsals;
CREATE POLICY rehearsals_select_member ON rehearsals
  FOR SELECT USING (is_org_member(org_id));

-- rehearsal_attendances: 같은 org 멤버면 참석 현황 SELECT. 쓰기는 service_role.
DROP POLICY IF EXISTS rehearsal_attendances_select_member ON rehearsal_attendances;
CREATE POLICY rehearsal_attendances_select_member ON rehearsal_attendances
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM rehearsals r
      WHERE r.id = rehearsal_attendances.rehearsal_id
        AND is_org_member(r.org_id)
    )
  );
