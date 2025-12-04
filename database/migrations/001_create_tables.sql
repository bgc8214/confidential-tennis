-- ============================================
-- 마이그레이션 1: 테이블 생성
-- ============================================

-- 1. User Profiles
CREATE TABLE IF NOT EXISTS user_profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT,
  full_name TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Clubs
CREATE TABLE IF NOT EXISTS clubs (
  id BIGSERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  code TEXT UNIQUE NOT NULL,
  logo_url TEXT,
  owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  settings JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Club Members
CREATE TABLE IF NOT EXISTS club_members (
  id BIGSERIAL PRIMARY KEY,
  club_id BIGINT NOT NULL REFERENCES clubs(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'member' CHECK (role IN ('owner', 'admin', 'member')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(club_id, user_id)
);

-- 4. Members (클럽별 회원 정보)
CREATE TABLE IF NOT EXISTS members (
  id BIGSERIAL PRIMARY KEY,
  club_id BIGINT NOT NULL REFERENCES clubs(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  phone TEXT,
  email TEXT,
  skill_level TEXT CHECK (skill_level IN ('beginner', 'intermediate', 'advanced')),
  gender TEXT CHECK (gender IN ('male', 'female')), -- 성별 (남/여)
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Schedules
CREATE TABLE IF NOT EXISTS schedules (
  id BIGSERIAL PRIMARY KEY,
  club_id BIGINT NOT NULL REFERENCES clubs(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  start_time TIME DEFAULT '10:00',
  end_time TIME DEFAULT '13:00',
  match_type TEXT DEFAULT 'mixed' CHECK (match_type IN ('mixed', 'mens', 'womens')), -- 경기 타입: 혼복/남복/여복
  status TEXT DEFAULT 'planned' CHECK (status IN ('planned', 'in_progress', 'completed', 'cancelled')),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(club_id, date)
);

-- 6. Attendances
CREATE TABLE IF NOT EXISTS attendances (
  id BIGSERIAL PRIMARY KEY,
  schedule_id BIGINT NOT NULL REFERENCES schedules(id) ON DELETE CASCADE,
  member_id BIGINT REFERENCES members(id) ON DELETE SET NULL,
  guest_name TEXT,
  is_guest BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT check_member_or_guest CHECK (
    (is_guest = false AND member_id IS NOT NULL AND guest_name IS NULL) OR
    (is_guest = true AND member_id IS NULL AND guest_name IS NOT NULL)
  )
);

-- 7. Matches
CREATE TABLE IF NOT EXISTS matches (
  id BIGSERIAL PRIMARY KEY,
  schedule_id BIGINT NOT NULL REFERENCES schedules(id) ON DELETE CASCADE,
  match_number INTEGER NOT NULL CHECK (match_number BETWEEN 1 AND 6),
  court TEXT NOT NULL CHECK (court IN ('A', 'B')),
  start_time TIME,
  player1_id BIGINT REFERENCES attendances(id),
  player2_id BIGINT REFERENCES attendances(id),
  player3_id BIGINT REFERENCES attendances(id),
  player4_id BIGINT REFERENCES attendances(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT unique_match_per_schedule UNIQUE (schedule_id, match_number, court)
);

-- 8. Constraints
CREATE TABLE IF NOT EXISTS constraints (
  id BIGSERIAL PRIMARY KEY,
  schedule_id BIGINT NOT NULL REFERENCES schedules(id) ON DELETE CASCADE,
  constraint_type TEXT NOT NULL CHECK (constraint_type IN ('exclude_last_match', 'partner_pair', 'exclude_match')),
  member_id_1 BIGINT REFERENCES members(id) ON DELETE CASCADE,
  member_id_2 BIGINT REFERENCES members(id) ON DELETE SET NULL,
  match_number INTEGER CHECK (match_number BETWEEN 1 AND 6),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT check_constraint_type_requirements CHECK (
    (constraint_type = 'exclude_last_match' AND member_id_1 IS NOT NULL AND member_id_2 IS NULL AND match_number IS NULL) OR
    (constraint_type = 'partner_pair' AND member_id_1 IS NOT NULL AND member_id_2 IS NOT NULL AND match_number IS NULL) OR
    (constraint_type = 'exclude_match' AND member_id_1 IS NOT NULL AND match_number IS NOT NULL)
  )
);

