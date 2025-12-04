-- ============================================
-- 마이그레이션 12: clubs RLS 정책 무한 재귀 수정
-- ============================================

-- 기존 정책 삭제
DROP POLICY IF EXISTS "Users can view clubs they belong to" ON clubs;

-- 수정된 정책 생성
-- 소유자인 경우 owner_id로 직접 확인하고,
-- 멤버인 경우 club_members를 조회하되, club_members의 정책이 user_id를 직접 확인하므로 재귀 방지
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


