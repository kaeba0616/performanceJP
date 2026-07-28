-- 020_organizations.sql
-- 사설 공연 운영 도구 — 단체(organization) + 역할(org_members) + 초대(org_invites).
-- PRD F1 / SPEC §4 `020_organizations.sql` 참조.
--
-- 권한 모델 (SPEC §8 확정):
--   - 모든 org "쓰기"(단체/멤버/공연/공지/예약관리 변경)는 서버 API(service_role)가
--     수행하며 RLS를 우회한다. 서버 라우트에서 requireOrgStaff()로 권한을 검사한다.
--   - RLS는 클라이언트(anon/authenticated) "읽기(SELECT)"만 통제한다.
--   - is_org_staff()/is_org_member() 헬퍼는 RLS SELECT 정책과 향후 세션 기반 접근에 사용.
--     SECURITY DEFINER 이므로 org_members RLS를 우회 → 정책 내 재귀를 방지한다.

CREATE EXTENSION IF NOT EXISTS citext;

-- ─────────────────────────────────────────────────────────────
-- organizations (단체)
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS organizations (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  handle      citext UNIQUE NOT NULL CHECK (handle ~ '^[a-z0-9_]{3,20}$'),
  name        text NOT NULL,
  description text,
  logo_url    text,
  contact     text,                                 -- 공개 문의 채널(이메일/인스타 등)
  is_verified boolean NOT NULL DEFAULT false,        -- 서비스 관리자 인증 배지 (A5: 승인제 아님)
  -- 감사용 필드(소유권은 org_members.role='owner' 로 추적). 계정 삭제 대비 nullable +
  -- ON DELETE SET NULL (NOT NULL 이면 SET NULL 이 제약을 위반해 유저 삭제가 실패한다).
  created_by  uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_organizations_created_by ON organizations(created_by);

-- ─────────────────────────────────────────────────────────────
-- org_role ENUM
-- ─────────────────────────────────────────────────────────────
DO $$ BEGIN
  CREATE TYPE org_role AS ENUM ('owner', 'staff', 'member');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- ─────────────────────────────────────────────────────────────
-- org_members (단체 소속 + 역할)
--   owner  : 단체 소유자(생성자). 멤버/역할 관리 가능.
--   staff  : 운영진. 공연/예약/공지 관리 가능.
--   member : 단원. 열람 + 연습 참석 등.
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS org_members (
  org_id    uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  user_id   uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role      org_role NOT NULL DEFAULT 'member',
  joined_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (org_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_org_members_user ON org_members(user_id);

-- ─────────────────────────────────────────────────────────────
-- org_invites (초대 코드 — 링크로 단원/운영진 추가)
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS org_invites (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id     uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  code       text NOT NULL UNIQUE DEFAULT gen_random_uuid()::text,
  role       org_role NOT NULL DEFAULT 'member',
  expires_at timestamptz,
  used_at    timestamptz,
  used_by    uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_org_invites_org ON org_invites(org_id);

-- ─────────────────────────────────────────────────────────────
-- updated_at 트리거 (organizations) — 006의 touch_updated_at() 재사용
-- ─────────────────────────────────────────────────────────────
DROP TRIGGER IF EXISTS organizations_touch ON organizations;
CREATE TRIGGER organizations_touch
  BEFORE UPDATE ON organizations
  FOR EACH ROW EXECUTE FUNCTION touch_updated_at();

-- ─────────────────────────────────────────────────────────────
-- 권한 판정 헬퍼 (RLS 전반에서 사용, SECURITY DEFINER 로 재귀 방지)
-- ─────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION is_org_staff(p_org uuid)
RETURNS boolean
LANGUAGE sql SECURITY DEFINER STABLE
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM org_members m
    WHERE m.org_id = p_org
      AND m.user_id = auth.uid()
      AND m.role IN ('owner', 'staff')
  );
$$;

CREATE OR REPLACE FUNCTION is_org_member(p_org uuid)
RETURNS boolean
LANGUAGE sql SECURITY DEFINER STABLE
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM org_members m
    WHERE m.org_id = p_org
      AND m.user_id = auth.uid()
  );
$$;

-- ─────────────────────────────────────────────────────────────
-- RLS
--   쓰기는 전부 service_role(서버 API) → 정책 없음 = anon/authenticated 거부.
--   읽기만 아래 정책으로 허용.
-- ─────────────────────────────────────────────────────────────
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE org_members   ENABLE ROW LEVEL SECURITY;
ALTER TABLE org_invites   ENABLE ROW LEVEL SECURITY;

-- organizations: 공개 프로필이므로 누구나 SELECT
DROP POLICY IF EXISTS organizations_select_all ON organizations;
CREATE POLICY organizations_select_all ON organizations
  FOR SELECT USING (true);

-- org_members: 같은 단체 소속만 멤버 목록 열람
DROP POLICY IF EXISTS org_members_select_own_org ON org_members;
CREATE POLICY org_members_select_own_org ON org_members
  FOR SELECT USING (is_org_member(org_id));

-- org_invites: 코드는 공개되면 안 됨 → 정책 없음(서버 service_role 만 접근).
--              (RLS enabled + 정책 없음 = 클라이언트 전면 거부)
