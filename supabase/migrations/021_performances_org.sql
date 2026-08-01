-- 021_performances_org.sql
-- performances 를 단체(org) 소유·홍보용으로 확장. PRD F2 / SPEC §4 `021_performances_org.sql`.
--
-- 설계 노트:
--   - org_id NULL  → 기존 크롤링/관리자 공연(origin='crawled'|'admin'). 기존 동작 보존.
--   - origin       → 데이터 출처 구분(R5). 기존 행은 DEFAULT 'crawled'.
--   - visibility   → 공개 범위(A3). 발행 전 초안은 'private' 로 두고, 발행 시 'public'/'unlisted'.
--                    ('draft' 를 status 에 넣지 않는 이유: 012 status-sync 트리거가 날짜 기준으로
--                     status 를 on_sale/completed 로 덮어써 초안 상태를 유지할 수 없기 때문.)
--   - summary      → 홍보용 소개(마크다운 허용).
--   - poster_url   → image_url(가로 썸네일)과 별개의 세로 포스터.

ALTER TABLE performances
  ADD COLUMN IF NOT EXISTS org_id     uuid REFERENCES organizations(id) ON DELETE CASCADE,
  ADD COLUMN IF NOT EXISTS origin     text NOT NULL DEFAULT 'crawled',
  ADD COLUMN IF NOT EXISTS visibility text NOT NULL DEFAULT 'public',
  ADD COLUMN IF NOT EXISTS summary    text,
  ADD COLUMN IF NOT EXISTS poster_url text;

-- CHECK 제약 (ADD COLUMN 의 인라인 CHECK 는 재실행 시 충돌하므로 분리해서 idempotent 처리)
DO $$ BEGIN
  ALTER TABLE performances
    ADD CONSTRAINT performances_origin_check
    CHECK (origin IN ('crawled', 'admin', 'org'));
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE performances
    ADD CONSTRAINT performances_visibility_check
    CHECK (visibility IN ('public', 'unlisted', 'private'));
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- org 공연은 반드시 org_id 를 가져야 하고, 비-org 공연은 가지면 안 됨.
DO $$ BEGIN
  ALTER TABLE performances
    ADD CONSTRAINT performances_org_origin_consistency
    CHECK (
      (origin = 'org' AND org_id IS NOT NULL)
      OR (origin <> 'org' AND org_id IS NULL)
    );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- org 공연은 J-pop artists 테이블을 참조하지 않으므로 solo→artist_id 필수 규칙에서 면제.
-- (010의 performances_solo_requires_artist 를 origin='org' 예외를 추가해 재정의.)
-- crawled/admin 공연은 기존 규칙(solo면 artist 필수, festival이면 NULL 허용) 그대로 유지.
ALTER TABLE performances DROP CONSTRAINT IF EXISTS performances_solo_requires_artist;
ALTER TABLE performances
  ADD CONSTRAINT performances_solo_requires_artist CHECK (
    origin = 'org'
    OR (type = 'solo' AND artist_id IS NOT NULL)
    OR (type = 'festival')
  );

CREATE INDEX IF NOT EXISTS idx_performances_org        ON performances(org_id);
CREATE INDEX IF NOT EXISTS idx_performances_visibility ON performances(visibility);

-- ─────────────────────────────────────────────────────────────
-- RLS 갱신: 기존 performances_select_all(USING true) 를 visibility 반영 정책으로 교체.
--   - public / unlisted : 누구나 SELECT (unlisted 는 목록 노출만 API 쿼리에서 제외).
--   - private           : 해당 org 소속만.
--   기존 크롤링/관리자 공연은 visibility='public' 이므로 계속 공개된다.
--   쓰기(INSERT/UPDATE/DELETE)는 여전히 service_role(서버 API) 만 → 정책 없음.
--
--   ⚠️ 중요: permissive SELECT 정책은 OR 로 합쳐진다. 아래 두 개 외에
--   운영 DB에 수동 생성된 `공개 읽기`(USING true) 정책이 존재해(마이그레이션 미기록 drift)
--   함께 제거하지 않으면 private 공연이 그대로 노출된다. → 여기서 반드시 드롭한다.
-- ─────────────────────────────────────────────────────────────
DROP POLICY IF EXISTS performances_select_all ON performances;
DROP POLICY IF EXISTS "공개 읽기" ON performances;
DROP POLICY IF EXISTS performances_select_public ON performances;
CREATE POLICY performances_select_public ON performances
  FOR SELECT USING (
    visibility <> 'private'
    OR is_org_member(org_id)
  );
