-- 025_recruitments.sql
-- 단원 모집 공고 + 지원서. PRD F5 / SPEC §12.
--
-- 권한(Phase 1과 동일): 쓰기는 service_role 서버 API, RLS는 읽기만 통제.
--   - recruitments: 공개(is_public AND open)이거나 소속 멤버면 SELECT.
--   - applications: 무인증 지원(anon)은 서버 API가 처리 → 클라이언트 정책 없음.
--                   staff 는 자기 org 지원자 목록 SELECT 가능(세션 접근 대비).

CREATE TABLE IF NOT EXISTS recruitments (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id      uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  title       text NOT NULL,
  description text,
  parts       text,                        -- 모집 파트(자유 텍스트)
  headcount   int CHECK (headcount IS NULL OR headcount >= 0),
  deadline    date,
  status      text NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'closed')),
  is_public   boolean NOT NULL DEFAULT true,
  created_by  uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_recruitments_org ON recruitments(org_id, created_at DESC);

CREATE TABLE IF NOT EXISTS applications (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  recruitment_id uuid NOT NULL REFERENCES recruitments(id) ON DELETE CASCADE,
  name           text NOT NULL,
  phone          text,
  email          text,
  part           text,
  intro          text,
  attachment_url text,
  status         text NOT NULL DEFAULT 'submitted'
                 CHECK (status IN ('submitted', 'screening', 'audition', 'passed', 'rejected')),
  admin_note     text,
  submitter_ip   inet,
  created_at     timestamptz NOT NULL DEFAULT now(),
  reviewed_at    timestamptz
);

CREATE INDEX IF NOT EXISTS idx_applications_recruitment ON applications(recruitment_id, status);

-- updated_at 트리거 (recruitments)
DROP TRIGGER IF EXISTS recruitments_touch ON recruitments;
CREATE TRIGGER recruitments_touch
  BEFORE UPDATE ON recruitments
  FOR EACH ROW EXECUTE FUNCTION touch_updated_at();

-- ─────────────────────────────────────────────────────────────
-- RLS
-- ─────────────────────────────────────────────────────────────
ALTER TABLE recruitments ENABLE ROW LEVEL SECURITY;
ALTER TABLE applications ENABLE ROW LEVEL SECURITY;

-- recruitments: 공개(모집중) 또는 소속 멤버만 열람. 쓰기는 service_role.
DROP POLICY IF EXISTS recruitments_select ON recruitments;
CREATE POLICY recruitments_select ON recruitments
  FOR SELECT USING (
    (is_public AND status = 'open')
    OR is_org_member(org_id)
  );

-- applications: staff 만 SELECT(자기 org). INSERT/UPDATE 는 service_role(서버 API).
DROP POLICY IF EXISTS applications_select_staff ON applications;
CREATE POLICY applications_select_staff ON applications
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM recruitments r
      WHERE r.id = applications.recruitment_id
        AND is_org_staff(r.org_id)
    )
  );
