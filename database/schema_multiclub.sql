-- ============================================
-- 테니스 동아리 스케줄 관리 시스템
-- 멀티 클럽 지원 데이터베이스 스키마
-- ============================================

-- ============================================
-- 1. User Profiles (사용자 프로필)
-- auth.users와 연결되는 프로필 정보
-- ============================================
CREATE TABLE IF NOT EXISTS user_profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT,
  full_name TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- 2. Clubs (클럽)
-- ============================================
CREATE TABLE IF NOT EXISTS clubs (
  id BIGSERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  code TEXT UNIQUE NOT NULL, -- 초대 코드 (UUID 형식)
  logo_url TEXT,
  owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  settings JSONB DEFAULT '{}', -- 클럽별 설정 (기본 경기 시간, 코트 수 등)
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_clubs_code ON clubs(code);
CREATE INDEX IF NOT EXISTS idx_clubs_owner_id ON clubs(owner_id);

-- ============================================
-- 3. Club Members (클럽 회원 관계)
-- 사용자가 어떤 클럽에 속해있는지, 어떤 역할인지
-- ============================================
CREATE TABLE IF NOT EXISTS club_members (
  id BIGSERIAL PRIMARY KEY,
  club_id BIGINT NOT NULL REFERENCES clubs(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'member' CHECK (role IN ('owner', 'admin', 'member')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(club_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_club_members_club_id ON club_members(club_id);
CREATE INDEX IF NOT EXISTS idx_club_members_user_id ON club_members(user_id);

-- ============================================
-- 4. Members (클럽별 회원 정보)
-- 각 클럽의 테니스 회원 정보
-- ============================================
CREATE TABLE IF NOT EXISTS members (
  id BIGSERIAL PRIMARY KEY,
  club_id BIGINT NOT NULL REFERENCES clubs(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL, -- 로그인한 사용자인 경우
  name TEXT NOT NULL,
  phone TEXT,
  email TEXT,
  skill_level TEXT CHECK (skill_level IN ('beginner', 'intermediate', 'advanced')),
  gender TEXT CHECK (gender IN ('male', 'female')), -- 성별 (남/여)
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_members_club_id ON members(club_id);
CREATE INDEX IF NOT EXISTS idx_members_user_id ON members(user_id);
CREATE INDEX IF NOT EXISTS idx_members_club_active ON members(club_id, is_active) WHERE is_active = true;

-- ============================================
-- 5. Schedules (스케줄)
-- ============================================
CREATE TABLE IF NOT EXISTS schedules (
  id BIGSERIAL PRIMARY KEY,
  club_id BIGINT NOT NULL REFERENCES clubs(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  start_time TIME DEFAULT '10:00',
  end_time TIME DEFAULT '13:00',
  match_type TEXT DEFAULT 'mixed' CHECK (match_type IN ('mixed', 'mens', 'womens')), -- 경기 타입: 혼복/남복/여복
  status TEXT DEFAULT 'planned' CHECK (status IN ('planned', 'in_progress', 'completed', 'cancelled')),
  notes TEXT,
  public_link TEXT UNIQUE, -- 공개 링크 (비로그인 사용자 접근용)
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(club_id, date) -- 클럽별로 같은 날짜에 하나의 스케줄만
);

CREATE INDEX IF NOT EXISTS idx_schedules_club_id ON schedules(club_id);
CREATE INDEX IF NOT EXISTS idx_schedules_date ON schedules(date);
CREATE INDEX IF NOT EXISTS idx_schedules_club_date ON schedules(club_id, date);

-- ============================================
-- 6. Attendances (참석)
-- ============================================
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

CREATE INDEX IF NOT EXISTS idx_attendances_schedule_id ON attendances(schedule_id);
CREATE INDEX IF NOT EXISTS idx_attendances_member_id ON attendances(member_id);

-- ============================================
-- 7. Matches (경기)
-- ============================================
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

CREATE INDEX IF NOT EXISTS idx_matches_schedule_id ON matches(schedule_id);

-- ============================================
-- 8. Constraints (제약조건)
-- ============================================
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

CREATE INDEX IF NOT EXISTS idx_constraints_schedule_id ON constraints(schedule_id);

-- ============================================
-- 9. Functions (함수)
-- ============================================

-- updated_at 자동 업데이트 함수
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 클럽 코드 자동 생성 함수 (UUID 기반)
CREATE OR REPLACE FUNCTION generate_club_code()
RETURNS TEXT AS $$
BEGIN
    RETURN upper(substring(md5(random()::text || clock_timestamp()::text) from 1 for 8));
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- 10. Triggers (트리거)
-- ============================================

-- updated_at 자동 업데이트 트리거
CREATE TRIGGER update_user_profiles_updated_at
    BEFORE UPDATE ON user_profiles
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_clubs_updated_at
    BEFORE UPDATE ON clubs
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_members_updated_at
    BEFORE UPDATE ON members
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_schedules_updated_at
    BEFORE UPDATE ON schedules
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_matches_updated_at
    BEFORE UPDATE ON matches
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- 클럽 생성 시 소유자를 club_members에 자동 추가
CREATE OR REPLACE FUNCTION auto_add_club_owner()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO club_members (club_id, user_id, role)
    VALUES (NEW.id, NEW.owner_id, 'owner')
    ON CONFLICT (club_id, user_id) DO NOTHING;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER add_club_owner_on_create
    AFTER INSERT ON clubs
    FOR EACH ROW
    EXECUTE FUNCTION auto_add_club_owner();

-- ============================================
-- 11. Row Level Security (RLS) 정책
-- ============================================

-- RLS 활성화
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE clubs ENABLE ROW LEVEL SECURITY;
ALTER TABLE club_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE members ENABLE ROW LEVEL SECURITY;
ALTER TABLE schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE attendances ENABLE ROW LEVEL SECURITY;
ALTER TABLE matches ENABLE ROW LEVEL SECURITY;
ALTER TABLE constraints ENABLE ROW LEVEL SECURITY;

-- User Profiles 정책
CREATE POLICY "Users can view their own profile"
    ON user_profiles FOR SELECT
    USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
    ON user_profiles FOR UPDATE
    USING (auth.uid() = id);

CREATE POLICY "Users can insert their own profile"
    ON user_profiles FOR INSERT
    WITH CHECK (auth.uid() = id);

-- Clubs 정책
-- 주의: 순환 참조 방지를 위해 소유자는 owner_id로 직접 확인
CREATE POLICY "Users can view clubs they belong to"
    ON clubs FOR SELECT
    USING (
        -- 소유자인 경우 직접 확인 (재귀 없음)
        owner_id = auth.uid() OR
        -- 멤버인 경우 club_members 조회
        -- club_members의 SELECT 정책이 user_id = auth.uid()를 먼저 확인하므로 재귀 방지됨
        EXISTS (
            SELECT 1 FROM club_members
            WHERE club_members.club_id = clubs.id
            AND club_members.user_id = auth.uid()
        )
    );

CREATE POLICY "Authenticated users can create clubs"
    ON clubs FOR INSERT
    WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "Owners can update their clubs"
    ON clubs FOR UPDATE
    USING (owner_id = auth.uid());

CREATE POLICY "Owners can delete their clubs"
    ON clubs FOR DELETE
    USING (owner_id = auth.uid());

-- Club Members 정책
-- 주의: 순환 참조 방지를 위해 주의 깊게 설계
-- clubs SELECT 정책이 club_members를 조회하고,
-- club_members SELECT 정책이 다시 clubs를 조회하면 무한 재귀 발생

-- SELECT: 자기 자신의 멤버십 또는 소유자인 경우만 조회 가능
-- clubs를 조회하지만, clubs의 정책이 owner_id를 먼저 확인하므로 재귀 방지
CREATE POLICY "Users can view club members of their clubs"
    ON club_members FOR SELECT
    USING (
        -- 자기 자신이 멤버인 경우 (재귀 없음)
        user_id = auth.uid() OR
        -- 클럽 소유자인 경우 (clubs.owner_id로 직접 확인, 재귀 없음)
        EXISTS (
            SELECT 1 FROM clubs
            WHERE clubs.id = club_members.club_id
            AND clubs.owner_id = auth.uid()
        )
    );

-- INSERT: 클럽 소유자만 멤버 추가 가능 (clubs 테이블 직접 조회)
CREATE POLICY "Club owners can add members"
    ON club_members FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM clubs
            WHERE clubs.id = club_members.club_id
            AND clubs.owner_id = auth.uid()
        )
    );

-- UPDATE: 클럽 소유자만 역할 변경 가능
CREATE POLICY "Club owners and admins can update member roles"
    ON club_members FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM clubs
            WHERE clubs.id = club_members.club_id
            AND clubs.owner_id = auth.uid()
        )
    );

-- DELETE: 클럽 소유자만 멤버 제거 가능
CREATE POLICY "Club owners can remove members"
    ON club_members FOR DELETE
    USING (
        EXISTS (
            SELECT 1 FROM clubs
            WHERE clubs.id = club_members.club_id
            AND clubs.owner_id = auth.uid()
        )
    );

-- Members 정책
CREATE POLICY "Club members can view members of their clubs"
    ON members FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM club_members
            WHERE club_members.club_id = members.club_id
            AND club_members.user_id = auth.uid()
        )
    );

CREATE POLICY "Club admins can insert members"
    ON members FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM club_members
            WHERE club_members.club_id = members.club_id
            AND club_members.user_id = auth.uid()
            AND club_members.role IN ('owner', 'admin')
        )
    );

CREATE POLICY "Club admins can update members"
    ON members FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM club_members
            WHERE club_members.club_id = members.club_id
            AND club_members.user_id = auth.uid()
            AND club_members.role IN ('owner', 'admin')
        )
    );

CREATE POLICY "Club admins can delete members"
    ON members FOR DELETE
    USING (
        EXISTS (
            SELECT 1 FROM club_members
            WHERE club_members.club_id = members.club_id
            AND club_members.user_id = auth.uid()
            AND club_members.role IN ('owner', 'admin')
        )
    );

-- Schedules 정책
CREATE POLICY "Club members can view schedules of their clubs"
    ON schedules FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM club_members
            WHERE club_members.club_id = schedules.club_id
            AND club_members.user_id = auth.uid()
        )
    );

-- 공개 링크가 있는 스케줄은 누구나 조회 가능 (비로그인 사용자 포함)
CREATE POLICY "Anyone can view public schedules"
    ON schedules FOR SELECT
    USING (public_link IS NOT NULL);

CREATE POLICY "Club admins can manage schedules"
    ON schedules FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM club_members
            WHERE club_members.club_id = schedules.club_id
            AND club_members.user_id = auth.uid()
            AND club_members.role IN ('owner', 'admin')
        )
    );

-- Attendances 정책
CREATE POLICY "Club members can view attendances"
    ON attendances FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM schedules s
            JOIN club_members cm ON cm.club_id = s.club_id
            WHERE s.id = attendances.schedule_id
            AND cm.user_id = auth.uid()
        )
    );

CREATE POLICY "Club admins can manage attendances"
    ON attendances FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM schedules s
            JOIN club_members cm ON cm.club_id = s.club_id
            WHERE s.id = attendances.schedule_id
            AND cm.user_id = auth.uid()
            AND cm.role IN ('owner', 'admin')
        )
    );

-- Matches 정책
CREATE POLICY "Club members can view matches"
    ON matches FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM schedules s
            JOIN club_members cm ON cm.club_id = s.club_id
            WHERE s.id = matches.schedule_id
            AND cm.user_id = auth.uid()
        )
    );

CREATE POLICY "Club admins can manage matches"
    ON matches FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM schedules s
            JOIN club_members cm ON cm.club_id = s.club_id
            WHERE s.id = matches.schedule_id
            AND cm.user_id = auth.uid()
            AND cm.role IN ('owner', 'admin')
        )
    );

-- Constraints 정책
CREATE POLICY "Club members can view constraints"
    ON constraints FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM schedules s
            JOIN club_members cm ON cm.club_id = s.club_id
            WHERE s.id = constraints.schedule_id
            AND cm.user_id = auth.uid()
        )
    );

CREATE POLICY "Club admins can manage constraints"
    ON constraints FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM schedules s
            JOIN club_members cm ON cm.club_id = s.club_id
            WHERE s.id = constraints.schedule_id
            AND cm.user_id = auth.uid()
            AND cm.role IN ('owner', 'admin')
        )
    );

-- ============================================
-- 12. 코멘트
-- ============================================
COMMENT ON TABLE user_profiles IS '사용자 프로필 정보 (auth.users와 연결)';
COMMENT ON TABLE clubs IS '테니스 클럽 정보';
COMMENT ON TABLE club_members IS '사용자-클럽 관계 및 역할';
COMMENT ON TABLE members IS '클럽별 테니스 회원 정보';
COMMENT ON TABLE schedules IS '경기 스케줄 정보 (클럽별)';
COMMENT ON TABLE attendances IS '스케줄별 참석자 정보';
COMMENT ON TABLE matches IS '경기 배정 정보 (6경기, 2코트)';
COMMENT ON TABLE constraints IS '스케줄 생성 제약조건';

