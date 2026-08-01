-- 027_performance_promo_content.sql
-- org 공연 홍보 콘텐츠 강화. PRD F7 / SPEC §12.
--   gallery       : [{url, caption}]           이미지 갤러리
--   cast_members  : [{name, role, photo_url, bio}]  출연진 프로필(J-pop artists와 무관)
--   video_url     : 대표 YouTube URL
--
-- 편집은 기존 PATCH /api/performances/:id (service_role, staff) 확장으로 처리.
-- 공개 노출 RLS는 기존 performances_select_public 그대로 적용(추가 정책 불필요).

ALTER TABLE performances
  ADD COLUMN IF NOT EXISTS gallery      jsonb,
  ADD COLUMN IF NOT EXISTS cast_members jsonb,
  ADD COLUMN IF NOT EXISTS video_url    text;
