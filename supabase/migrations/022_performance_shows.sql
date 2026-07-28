-- 022_performance_shows.sql
-- 회차(공연 시간) + 정원. 예약 잔여석 집계를 위해 정규 테이블로 승격.
-- PRD F3.2 / SPEC §4 `022_show_time_capacity.sql`.
--
-- 병행 사용 노트:
--   - 기존 performances.show_times(jsonb) 는 내한공연용으로 그대로 유지한다.
--   - org 공연(예약을 받는 공연)은 performance_shows 를 사용한다.
--   - starts_at 은 KST 기준(기존 kst 유틸/컨벤션 준수)으로 저장한다.

CREATE TABLE IF NOT EXISTS performance_shows (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  performance_id uuid NOT NULL REFERENCES performances(id) ON DELETE CASCADE,
  starts_at      timestamptz NOT NULL,
  capacity       int CHECK (capacity IS NULL OR capacity >= 0),  -- NULL = 무제한
  label          text,                                            -- 예: '1회차', '토요일 저녁'
  created_at     timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_performance_shows_perf ON performance_shows(performance_id, starts_at);

-- ─────────────────────────────────────────────────────────────
-- RLS: 회차는 소속 공연의 공개 범위를 따른다.
--   쓰기는 service_role(서버 API) 만 → 정책 없음.
-- ─────────────────────────────────────────────────────────────
ALTER TABLE performance_shows ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS performance_shows_select ON performance_shows;
CREATE POLICY performance_shows_select ON performance_shows
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM performances p
      WHERE p.id = performance_shows.performance_id
        AND (p.visibility <> 'private' OR is_org_member(p.org_id))
    )
  );
