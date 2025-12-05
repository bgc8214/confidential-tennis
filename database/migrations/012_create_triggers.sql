-- ============================================
-- 마이그레이션 4: 트리거 생성
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

-- 클럽 생성 시 소유자 자동 추가 트리거
CREATE TRIGGER add_club_owner_on_create
    AFTER INSERT ON clubs
    FOR EACH ROW
    EXECUTE FUNCTION auto_add_club_owner();


