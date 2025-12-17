-- ============================================
-- 마이그레이션 3: 함수 생성
-- ============================================

-- updated_at 자동 업데이트 함수
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 클럽 코드 자동 생성 함수
CREATE OR REPLACE FUNCTION generate_club_code()
RETURNS TEXT AS $$
BEGIN
    RETURN upper(substring(md5(random()::text || clock_timestamp()::text) from 1 for 8));
END;
$$ LANGUAGE plpgsql;

-- 클럽 생성 시 소유자를 club_members에 자동 추가하는 함수
CREATE OR REPLACE FUNCTION auto_add_club_owner()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO club_members (club_id, user_id, role)
    VALUES (NEW.id, NEW.owner_id, 'owner')
    ON CONFLICT (club_id, user_id) DO NOTHING;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;





