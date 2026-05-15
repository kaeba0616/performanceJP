-- 013_artist_memberships.sql
-- 아티스트 ↔ 아티스트 멤버십 (그룹/멤버 관계)
--
-- 모델:
--   멤버도 artists의 row. 솔로 활동과 멤버를 같은 엔티티로 통일.
--   같은 사람이 여러 그룹에 속할 수 있음 (예: 유닛, 사이드 프로젝트).
--
--   artist_memberships.group_id  → 그룹 아티스트
--   artist_memberships.member_id → 멤버 아티스트
--   display_order: 그룹 프로필에 표시될 멤버 순서.

CREATE TABLE IF NOT EXISTS artist_memberships (
  group_id      uuid NOT NULL REFERENCES artists(id) ON DELETE CASCADE,
  member_id     uuid NOT NULL REFERENCES artists(id) ON DELETE CASCADE,
  display_order int  NOT NULL DEFAULT 1,
  created_at    timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (group_id, member_id),
  CHECK (group_id <> member_id)
);

CREATE INDEX IF NOT EXISTS idx_artist_memberships_group
  ON artist_memberships (group_id, display_order);
CREATE INDEX IF NOT EXISTS idx_artist_memberships_member
  ON artist_memberships (member_id);

-- RLS — 공개 읽기 (artists/performance_artists와 동일 정책)
ALTER TABLE artist_memberships ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS artist_memberships_select_all ON artist_memberships;
CREATE POLICY artist_memberships_select_all ON artist_memberships
  FOR SELECT USING (true);
