-- 014_song_submissions.sql
-- 사용자 제보: 셋리스트(공연 단위) + 대표곡(아티스트 단위)
--
-- 한 테이블에 kind 컬럼으로 분기.
--   kind='setlist'    → performance_id 필수, artist_id NULL
--   kind='hit_songs'  → artist_id 필수, performance_id NULL
--
-- songs: jsonb 배열, 각 항목은 { title, youtube_url } (admin SongEditor와 동일 형식)

CREATE TABLE song_submissions (
  id                uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  kind              text        NOT NULL CHECK (kind IN ('setlist','hit_songs')),

  performance_id    uuid        REFERENCES performances(id) ON DELETE CASCADE,
  artist_id         uuid        REFERENCES artists(id)      ON DELETE CASCADE,

  submitter_email   text        NOT NULL,
  submitter_name    text,
  submitter_note    text,
  submitter_ip      inet,

  songs             jsonb       NOT NULL,

  status            text        NOT NULL DEFAULT 'pending'
                                  CHECK (status IN ('pending','approved','rejected')),
  admin_note        text,
  rejection_reason  text,

  created_at        timestamptz NOT NULL DEFAULT now(),
  reviewed_at       timestamptz,

  CONSTRAINT song_submissions_kind_target CHECK (
    (kind = 'setlist'   AND performance_id IS NOT NULL AND artist_id IS NULL) OR
    (kind = 'hit_songs' AND artist_id IS NOT NULL      AND performance_id IS NULL)
  )
);

CREATE INDEX idx_song_submissions_status      ON song_submissions(status);
CREATE INDEX idx_song_submissions_created     ON song_submissions(created_at DESC);
CREATE INDEX idx_song_submissions_performance ON song_submissions(performance_id) WHERE performance_id IS NOT NULL;
CREATE INDEX idx_song_submissions_artist      ON song_submissions(artist_id)      WHERE artist_id IS NOT NULL;
CREATE INDEX idx_song_submissions_email       ON song_submissions(submitter_email);
CREATE INDEX idx_song_submissions_ip_created  ON song_submissions(submitter_ip, created_at DESC);

-- RLS: anon 접근 차단. 모든 read/write는 서버(service_role)를 통해서만.
ALTER TABLE song_submissions ENABLE ROW LEVEL SECURITY;
