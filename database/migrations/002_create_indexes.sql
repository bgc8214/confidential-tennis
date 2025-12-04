-- ============================================
-- 마이그레이션 2: 인덱스 생성
-- ============================================

CREATE INDEX IF NOT EXISTS idx_clubs_code ON clubs(code);
CREATE INDEX IF NOT EXISTS idx_clubs_owner_id ON clubs(owner_id);

CREATE INDEX IF NOT EXISTS idx_club_members_club_id ON club_members(club_id);
CREATE INDEX IF NOT EXISTS idx_club_members_user_id ON club_members(user_id);

CREATE INDEX IF NOT EXISTS idx_members_club_id ON members(club_id);
CREATE INDEX IF NOT EXISTS idx_members_user_id ON members(user_id);
CREATE INDEX IF NOT EXISTS idx_members_club_active ON members(club_id, is_active) WHERE is_active = true;

CREATE INDEX IF NOT EXISTS idx_schedules_club_id ON schedules(club_id);
CREATE INDEX IF NOT EXISTS idx_schedules_date ON schedules(date);
CREATE INDEX IF NOT EXISTS idx_schedules_club_date ON schedules(club_id, date);

CREATE INDEX IF NOT EXISTS idx_attendances_schedule_id ON attendances(schedule_id);
CREATE INDEX IF NOT EXISTS idx_attendances_member_id ON attendances(member_id);

CREATE INDEX IF NOT EXISTS idx_matches_schedule_id ON matches(schedule_id);

CREATE INDEX IF NOT EXISTS idx_constraints_schedule_id ON constraints(schedule_id);


