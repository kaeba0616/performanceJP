-- 019_web_push_subscriptions.sql
--
-- 웹 푸시 구독을 저장. 한 명의 구독자(subscribers)가 여러 기기에서 푸시를
-- 받을 수 있으므로 1:N 관계.  subscriber_id는 NULL 허용 — 이메일 없이 푸시만
-- 받고 싶은 익명 사용자도 지원한다.

CREATE TABLE web_push_subscriptions (
  id              uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  subscriber_id   uuid        REFERENCES subscribers(id) ON DELETE CASCADE,
  endpoint        text        NOT NULL UNIQUE,
  p256dh          text        NOT NULL,
  auth            text        NOT NULL,
  user_agent      text,
  created_at      timestamptz NOT NULL DEFAULT now(),
  last_used_at    timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_web_push_subscriptions_subscriber
  ON web_push_subscriptions(subscriber_id);

-- 푸시 전송 로그. 동일 이벤트(performance × type)에 대한 중복 발송을 막는다.
-- 이메일 쪽 notifications_log와 구분.
CREATE TABLE web_push_log (
  id                       uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  web_push_subscription_id uuid        NOT NULL REFERENCES web_push_subscriptions(id) ON DELETE CASCADE,
  performance_id           uuid        REFERENCES performances(id) ON DELETE CASCADE,
  type                     text        NOT NULL
                                       CHECK (type IN ('ticket_open_reminder', 'new_performance', 'test')),
  sent_at                  timestamptz NOT NULL DEFAULT now(),
  UNIQUE (web_push_subscription_id, performance_id, type)
);

CREATE INDEX idx_web_push_log_performance
  ON web_push_log(performance_id);

-- RLS: 클라이언트는 자신의 endpoint로 INSERT만 가능. 서버(service role)가 모든 작업 수행.
ALTER TABLE web_push_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE web_push_log ENABLE ROW LEVEL SECURITY;

-- 익명 사용자도 구독 가능하도록 anon에 INSERT 허용. 다른 작업은 service role만.
CREATE POLICY "anyone can subscribe"
  ON web_push_subscriptions FOR INSERT
  WITH CHECK (true);

CREATE POLICY "anyone can unsubscribe by endpoint"
  ON web_push_subscriptions FOR DELETE
  USING (true);
