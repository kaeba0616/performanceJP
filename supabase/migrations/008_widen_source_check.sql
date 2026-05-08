-- 008_widen_source_check.sql
-- source_listings.source CHECK 확장.
--
-- 배경:
--   src/lib/submissions/validate.ts inferSourceFromUrl()이
--   'ticketlink', 'other'를 반환하지만 기존 CHECK는 ('yes24','interpark','melon')만
--   허용. 결과적으로 제출 승인 시 source_listings INSERT가 silent fail.
--   (감사 P0)

ALTER TABLE source_listings DROP CONSTRAINT IF EXISTS source_listings_source_check;

ALTER TABLE source_listings
  ADD CONSTRAINT source_listings_source_check
  CHECK (source IN ('yes24', 'interpark', 'melon', 'ticketlink', 'other'));
