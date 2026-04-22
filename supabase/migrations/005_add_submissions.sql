-- 005_add_submissions.sql
-- User-submitted performance data with admin approval workflow.
-- Submitters may reference an existing artist OR propose a new one;
-- on approval, admin decides whether to link to existing artist or create a new row.

CREATE TABLE submissions (
  id                       uuid        PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Submitter metadata
  submitter_email          text        NOT NULL,
  submitter_name           text,
  submitter_ip             inet,
  submitter_note           text,

  -- Artist: either existing reference OR proposed names
  artist_id                uuid        REFERENCES artists(id),
  proposed_artist_name_ko  text,
  proposed_artist_name_ja  text,
  proposed_artist_name_en  text,

  -- Performance fields (mirror performances table)
  title                    text        NOT NULL,
  venue                    text,
  city                     text        DEFAULT '서울',
  start_date               date        NOT NULL,
  end_date                 date,
  ticket_open_at           timestamptz,
  presale_open_at          timestamptz,
  price_info               text,
  image_url                text,
  source_url               text,

  -- Workflow state
  status                   text        NOT NULL DEFAULT 'pending'
                                        CHECK (status IN ('pending','approved','rejected')),
  admin_note               text,
  rejection_reason         text,

  -- Outcome tracking
  approved_performance_id  uuid        REFERENCES performances(id) ON DELETE SET NULL,
  created_artist_id        uuid        REFERENCES artists(id)      ON DELETE SET NULL,

  created_at               timestamptz DEFAULT now(),
  reviewed_at              timestamptz,

  CONSTRAINT artist_choice CHECK (
    artist_id IS NOT NULL OR proposed_artist_name_ko IS NOT NULL
  )
);

CREATE INDEX idx_submissions_status     ON submissions(status);
CREATE INDEX idx_submissions_created_at ON submissions(created_at DESC);
CREATE INDEX idx_submissions_email      ON submissions(submitter_email);
CREATE INDEX idx_submissions_ip_created ON submissions(submitter_ip, created_at DESC);
