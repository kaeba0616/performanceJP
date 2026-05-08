-- 009_cascade_source_listings.sql
-- source_listings.performance_id FK 정책 변경.
--
-- 배경:
--   기존: ON DELETE SET NULL (크롤러가 listing을 미리 수집한 뒤 매칭하는 시나리오 가정)
--   현재: 크롤러 코드는 dead code로 제거됨. 모든 listing은 admin이 perf와 함께 입력.
--   문제: 공연 삭제 시 listing이 orphan(performance_id=NULL)으로 남고
--         source_url UNIQUE 위반으로 같은 URL 재입력 불가.
--
-- 변경:
--   1) FK를 ON DELETE CASCADE로 → 공연 삭제 시 연결된 listing도 자동 삭제
--   2) performance_id를 NOT NULL로 → orphan 자체를 막음
--
-- 사전 조건: orphan listing이 0개여야 함 (스모크 테스트로 확인 후 적용).

-- 만일을 대비해 잔여 orphan 정리
DELETE FROM source_listings WHERE performance_id IS NULL;

ALTER TABLE source_listings
  DROP CONSTRAINT IF EXISTS source_listings_performance_id_fkey;

ALTER TABLE source_listings
  ALTER COLUMN performance_id SET NOT NULL;

ALTER TABLE source_listings
  ADD CONSTRAINT source_listings_performance_id_fkey
  FOREIGN KEY (performance_id)
  REFERENCES performances(id)
  ON DELETE CASCADE;
