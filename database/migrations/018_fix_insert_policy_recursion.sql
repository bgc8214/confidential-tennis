-- ============================================
-- 마이그레이션 18: INSERT 정책 무한 재귀 완전 수정
-- ============================================
-- 문제: INSERT 정책의 WITH CHECK 절에서 clubs를 조회할 때 재귀 발생
-- 원인: clubs SELECT 정책이 실행되면서 다시 club_members를 조회하려고 시도
-- 해결: SECURITY DEFINER 함수를 사용하여 RLS를 우회

-- ============================================
-- 1단계: 보안 함수 생성 (RLS 우회)
-- ============================================
-- 이 함수는 RLS를 우회하여 직접 clubs 테이블을 조회합니다.
-- SECURITY DEFINER를 사용하면 함수 소유자의 권한으로 실행됩니다.
CREATE OR REPLACE FUNCTION check_club_owner(club_id_param BIGINT, user_id_param UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    -- RLS를 우회하여 직접 clubs 테이블 조회
    RETURN EXISTS (
        SELECT 1 FROM clubs
        WHERE clubs.id = club_id_param
        AND clubs.owner_id = user_id_param
    );
END;
$$;

-- 함수에 대한 권한 부여
GRANT EXECUTE ON FUNCTION check_club_owner(BIGINT, UUID) TO authenticated;

-- ============================================
-- 2단계: INSERT 정책 재작성
-- ============================================
DROP POLICY IF EXISTS "Users can join clubs and owners can add members" ON club_members;
DROP POLICY IF EXISTS "Users can join clubs and admins can add members" ON club_members;
DROP POLICY IF EXISTS "Club owners can add members" ON club_members;

CREATE POLICY "Users can join clubs and owners can add members"
    ON club_members FOR INSERT
    WITH CHECK (
        -- 자기 자신을 member 역할로 추가하는 경우 (클럽 코드로 가입)
        -- 클럽 코드 검증은 애플리케이션 레벨에서 이미 완료됨
        (
            auth.uid() = user_id 
            AND role = 'member'
        )
        OR
        -- 클럽 소유자가 다른 사용자를 추가하는 경우 (보안 함수 사용)
        (
            check_club_owner(club_members.club_id, auth.uid())
        )
        OR
        -- 클럽 생성 시 소유자 자신을 owner로 추가 (보안 함수 사용)
        (
            auth.uid() = user_id 
            AND role = 'owner'
            AND check_club_owner(club_members.club_id, auth.uid())
        )
    );

