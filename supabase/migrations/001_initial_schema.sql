-- 001_initial_schema.sql
-- Initial database schema for performanceJP

-- =============================================================================
-- artists
-- =============================================================================
CREATE TABLE artists (
  id         uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  name_ko    text        NOT NULL,                -- 한국어 이름
  name_ja    text,                                 -- 日本語名
  name_en    text,                                 -- English name
  image_url  text,
  created_at timestamptz DEFAULT now()
);

-- =============================================================================
-- performances
-- =============================================================================
CREATE TABLE performances (
  id              uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  artist_id       uuid        REFERENCES artists(id),
  title           text        NOT NULL,
  venue           text,
  city            text        DEFAULT '서울',
  start_date      date        NOT NULL,
  end_date        date,
  ticket_open_at  timestamptz,
  presale_open_at timestamptz,
  price_info      text,
  status          text        DEFAULT 'upcoming'
                              CHECK (status IN ('upcoming', 'on_sale', 'sold_out', 'completed')),
  image_url       text,
  created_at      timestamptz DEFAULT now(),
  updated_at      timestamptz DEFAULT now()
);

-- =============================================================================
-- source_listings (raw crawled data)
-- =============================================================================
CREATE TABLE source_listings (
  id              uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  performance_id  uuid        REFERENCES performances(id) ON DELETE SET NULL,
  source          text        NOT NULL
                              CHECK (source IN ('yes24', 'interpark', 'melon')),
  source_url      text        NOT NULL UNIQUE,
  source_id       text,
  raw_title       text        NOT NULL,
  raw_data        jsonb,
  ticket_open_at  timestamptz,
  price_info      text,
  last_crawled_at timestamptz DEFAULT now(),
  created_at      timestamptz DEFAULT now()
);

-- =============================================================================
-- subscribers (no auth, email-only)
-- =============================================================================
CREATE TABLE subscribers (
  id                uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  email             text        NOT NULL UNIQUE,
  verified          boolean     DEFAULT false,
  verify_token      text,
  subscribed_at     timestamptz DEFAULT now(),
  unsubscribe_token text        NOT NULL DEFAULT gen_random_uuid()::text
);

-- =============================================================================
-- subscriptions
-- =============================================================================
CREATE TABLE subscriptions (
  id                    uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  subscriber_id         uuid        NOT NULL REFERENCES subscribers(id) ON DELETE CASCADE,
  type                  text        NOT NULL
                                    CHECK (type IN ('all', 'artist', 'performance')),
  target_id             uuid,       -- artist_id or performance_id; NULL when type = 'all'
  notify_ticket_open    boolean     DEFAULT true,
  notify_new_performance boolean    DEFAULT true,
  created_at            timestamptz DEFAULT now(),
  UNIQUE (subscriber_id, type, target_id)
);

-- =============================================================================
-- notifications_log
-- =============================================================================
CREATE TABLE notifications_log (
  id              uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  subscriber_id   uuid        NOT NULL REFERENCES subscribers(id) ON DELETE CASCADE,
  performance_id  uuid        NOT NULL REFERENCES performances(id),
  type            text        NOT NULL
                              CHECK (type IN ('ticket_open_reminder', 'new_performance')),
  sent_at         timestamptz DEFAULT now(),
  UNIQUE (subscriber_id, performance_id, type)
);

-- =============================================================================
-- Indexes
-- =============================================================================
CREATE INDEX idx_performances_start_date     ON performances(start_date);
CREATE INDEX idx_performances_ticket_open_at ON performances(ticket_open_at);
CREATE INDEX idx_performances_status         ON performances(status);
CREATE INDEX idx_source_listings_source_url  ON source_listings(source_url);
CREATE INDEX idx_subscriptions_type_target   ON subscriptions(type, target_id);
