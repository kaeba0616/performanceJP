-- 023_reservations.sql
-- 무료 예약(RSVP). PRD F3 / SPEC §4 `023_reservations.sql`.
--
-- 인증 모델 (A6):
--   - 관객은 로그인 없이 이름·연락처로 예약한다.
--   - 예약 생성은 서버 API(/api/performances/:id/reservations, service_role)가 수행한다.
--     · IP rate-limit(submitter_ip 기록) + 잔여석 검증(초과예약 방지)을 서버에서 처리.
--   - 취소는 cancel_token 소지자만(서버 API 경유).
--   따라서 클라이언트 직접 INSERT 정책은 두지 않는다(anon INSERT 금지).
--
-- 결제 여지 (A2, Phase 2):
--   price / payment_status 컬럼만 확보하고 지금은 사용하지 않는다.

CREATE TABLE IF NOT EXISTS reservations (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  performance_id uuid NOT NULL REFERENCES performances(id) ON DELETE CASCADE,
  show_id        uuid REFERENCES performance_shows(id) ON DELETE SET NULL,

  -- 예약자(무인증)
  name           text NOT NULL,
  phone          text,
  email          text,
  party_size     int  NOT NULL DEFAULT 1 CHECK (party_size >= 1),
  note           text,

  -- 상태
  status         text NOT NULL DEFAULT 'confirmed'
                 CHECK (status IN ('pending', 'confirmed', 'cancelled', 'no_show')),
  cancel_token   text NOT NULL DEFAULT gen_random_uuid()::text,

  -- 결제 여지 (Phase 2, 현재 미사용)
  price          int  CHECK (price IS NULL OR price >= 0),
  payment_status text NOT NULL DEFAULT 'none'
                 CHECK (payment_status IN ('none', 'pending', 'paid', 'refunded')),

  -- 스팸 방지
  submitter_ip   inet,

  created_at     timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_reservations_perf ON reservations(performance_id, status);
CREATE INDEX IF NOT EXISTS idx_reservations_show ON reservations(show_id);
CREATE UNIQUE INDEX IF NOT EXISTS idx_reservations_cancel_token ON reservations(cancel_token);

-- ─────────────────────────────────────────────────────────────
-- 잔여석 집계 뷰 (운영 편의 — service_role 로 조회).
--   confirmed/pending 예약의 party_size 합을 정원에서 뺀다.
--   capacity IS NULL → remaining NULL(무제한).
-- ─────────────────────────────────────────────────────────────
CREATE OR REPLACE VIEW show_availability AS
SELECT
  s.id                                            AS show_id,
  s.performance_id,
  s.capacity,
  COALESCE(SUM(r.party_size) FILTER (
    WHERE r.status IN ('confirmed', 'pending')
  ), 0)::int                                      AS reserved,
  CASE
    WHEN s.capacity IS NULL THEN NULL
    ELSE GREATEST(
      s.capacity - COALESCE(SUM(r.party_size) FILTER (
        WHERE r.status IN ('confirmed', 'pending')
      ), 0),
      0
    )::int
  END                                             AS remaining
FROM performance_shows s
LEFT JOIN reservations r ON r.show_id = s.id
GROUP BY s.id, s.performance_id, s.capacity;

-- ─────────────────────────────────────────────────────────────
-- RLS
--   INSERT/UPDATE/DELETE : service_role(서버 API) 만 → 정책 없음.
--   SELECT               : 소유 org 의 staff 만(운영진 명단 열람).
--     (관객 개인 예약 확인/취소는 cancel_token 으로 서버 API 를 통해 조회 → service_role.)
-- ─────────────────────────────────────────────────────────────
ALTER TABLE reservations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS reservations_select_staff ON reservations;
CREATE POLICY reservations_select_staff ON reservations
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM performances p
      WHERE p.id = reservations.performance_id
        AND is_org_staff(p.org_id)
    )
  );
