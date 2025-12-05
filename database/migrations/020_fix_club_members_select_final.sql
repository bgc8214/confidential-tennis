-- ============================================
-- 마이그레이션 20: club_members SELECT 정책 최종 수정
-- ============================================
-- 문제: club_members에 SELECT 정책이 2개 존재하여 재귀 발생
-- 해결: 하나의 정책으로 통합 (OR 조건 사용)

-- ============================================
-- 1단계: 모든 기존 club_members SELECT 정책 삭제
-- ============================================
DROP POLICY IF EXISTS "Users can view club members of their clubs" ON club_members;
DROP POLICY IF EXISTS "Super admins can view all club members" ON club_members;

-- ============================================
-- 2단계: 통합된 SELECT 정책 생성
-- ============================================
-- 일반 사용자와 슈퍼어드민을 하나의 정책으로 통합
CREATE POLICY "Users and admins can view club members"
    ON club_members FOR SELECT
    TO authenticated
    USING (
        -- 자기 자신의 멤버십은 항상 조회 가능
        user_id = auth.uid()
        OR
        -- 슈퍼어드민은 모든 멤버십 조회 가능
        EXISTS (
            SELECT 1 FROM user_profiles
            WHERE user_profiles.id = auth.uid()
            AND user_profiles.is_super_admin = true
        )
    );
