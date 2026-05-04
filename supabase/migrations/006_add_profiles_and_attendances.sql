-- 사용자 프로필 + 공연 출석 스탬프
-- PR 1 마이그레이션: profiles, user_attendances + RLS + 트리거

CREATE EXTENSION IF NOT EXISTS citext;

-- ─────────────────────────────────────────────────────────────
-- profiles
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS profiles (
  id            uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  handle        citext UNIQUE,
  display_name  text,
  avatar_url    text,
  bio           text,
  is_public     boolean NOT NULL DEFAULT true,
  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT handle_format CHECK (
    handle IS NULL OR handle ~ '^[a-z0-9_]{3,20}$'
  )
);

-- ─────────────────────────────────────────────────────────────
-- user_attendances (공연 출석 스탬프)
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS user_attendances (
  user_id        uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  performance_id uuid NOT NULL REFERENCES performances(id) ON DELETE CASCADE,
  attended_at    timestamptz NOT NULL DEFAULT now(),
  note           text,
  created_at     timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, performance_id)
);

CREATE INDEX IF NOT EXISTS idx_attendances_user
  ON user_attendances (user_id, attended_at DESC);
CREATE INDEX IF NOT EXISTS idx_attendances_perf
  ON user_attendances (performance_id);

-- ─────────────────────────────────────────────────────────────
-- updated_at 트리거 (profiles)
-- ─────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION touch_updated_at()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS profiles_touch ON profiles;
CREATE TRIGGER profiles_touch
  BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION touch_updated_at();

-- ─────────────────────────────────────────────────────────────
-- auth.users INSERT 시 profiles 빈 행 자동 생성
-- ─────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  INSERT INTO profiles (id) VALUES (NEW.id) ON CONFLICT DO NOTHING;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- ─────────────────────────────────────────────────────────────
-- RLS: profiles
-- ─────────────────────────────────────────────────────────────
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS profiles_select_all ON profiles;
CREATE POLICY profiles_select_all ON profiles
  FOR SELECT USING (true);

DROP POLICY IF EXISTS profiles_insert_own ON profiles;
CREATE POLICY profiles_insert_own ON profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS profiles_update_own ON profiles;
CREATE POLICY profiles_update_own ON profiles
  FOR UPDATE USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS profiles_delete_own ON profiles;
CREATE POLICY profiles_delete_own ON profiles
  FOR DELETE USING (auth.uid() = id);

-- ─────────────────────────────────────────────────────────────
-- RLS: user_attendances
-- ─────────────────────────────────────────────────────────────
ALTER TABLE user_attendances ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS att_select_public ON user_attendances;
CREATE POLICY att_select_public ON user_attendances
  FOR SELECT USING (
    auth.uid() = user_id
    OR EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = user_attendances.user_id AND p.is_public = true
    )
  );

DROP POLICY IF EXISTS att_insert_own ON user_attendances;
CREATE POLICY att_insert_own ON user_attendances
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS att_delete_own ON user_attendances;
CREATE POLICY att_delete_own ON user_attendances
  FOR DELETE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS att_update_own ON user_attendances;
CREATE POLICY att_update_own ON user_attendances
  FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
