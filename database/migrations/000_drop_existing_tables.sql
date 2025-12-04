-- ============================================
-- 마이그레이션 0: 기존 테이블 삭제 (선택사항)
-- 기존 데이터가 중요하지 않다면 실행하세요
-- ============================================

-- 외래 키 제약조건 때문에 역순으로 삭제
DROP TABLE IF EXISTS constraints CASCADE;
DROP TABLE IF EXISTS matches CASCADE;
DROP TABLE IF EXISTS attendances CASCADE;
DROP TABLE IF EXISTS schedules CASCADE;
DROP TABLE IF EXISTS members CASCADE;
DROP TABLE IF EXISTS club_members CASCADE;
DROP TABLE IF EXISTS clubs CASCADE;
DROP TABLE IF EXISTS user_profiles CASCADE;

-- 함수도 삭제 (선택사항)
DROP FUNCTION IF EXISTS update_updated_at_column() CASCADE;
DROP FUNCTION IF EXISTS generate_club_code() CASCADE;
DROP FUNCTION IF EXISTS auto_add_club_owner() CASCADE;


