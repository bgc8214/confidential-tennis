-- ============================================
-- 마이그레이션 23: 트리거 함수를 SECURITY DEFINER로 변경
-- ============================================
-- 문제: auto_add_club_owner() 함수가 RLS 정책을 따르면서 재귀 발생
-- 해결: SECURITY DEFINER를 사용하여 RLS 우회

-- 기존 함수 삭제 후 재생성
DROP FUNCTION IF EXISTS auto_add_club_owner() CASCADE;

-- SECURITY DEFINER로 함수 재생성
-- 이 함수는 함수 소유자(postgres)의 권한으로 실행되어 RLS를 우회합니다
CREATE OR REPLACE FUNCTION auto_add_club_owner()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    -- RLS를 우회하여 직접 INSERT
    INSERT INTO club_members (club_id, user_id, role)
    VALUES (NEW.id, NEW.owner_id, 'owner')
    ON CONFLICT (club_id, user_id) DO NOTHING;
    RETURN NEW;
END;
$$;

-- 트리거 재생성
DROP TRIGGER IF EXISTS add_club_owner_on_create ON clubs;

CREATE TRIGGER add_club_owner_on_create
    AFTER INSERT ON clubs
    FOR EACH ROW
    EXECUTE FUNCTION auto_add_club_owner();

-- 함수 실행 권한 부여
GRANT EXECUTE ON FUNCTION auto_add_club_owner() TO authenticated;
