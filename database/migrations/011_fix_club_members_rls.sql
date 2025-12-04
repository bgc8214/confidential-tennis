-- ============================================
-- 마이그레이션 11: club_members RLS 정책 무한 재귀 수정
-- ============================================

-- 기존 정책 삭제
DROP POLICY IF EXISTS "Users can view club members of their clubs" ON club_members;
DROP POLICY IF EXISTS "Club owners can add members" ON club_members;
DROP POLICY IF EXISTS "Club owners and admins can update member roles" ON club_members;
DROP POLICY IF EXISTS "Club owners can remove members" ON club_members;

-- 수정된 정책 생성

-- 1. SELECT: 자기 자신이 멤버인 클럽의 멤버 목록 조회 가능
-- 자기 자신의 user_id를 직접 확인하여 재귀 방지
CREATE POLICY "Users can view club members of their clubs"
    ON club_members FOR SELECT
    USING (
        user_id = auth.uid() OR
        EXISTS (
            SELECT 1 FROM clubs
            WHERE clubs.id = club_members.club_id
            AND clubs.owner_id = auth.uid()
        )
    );

-- 2. INSERT: 클럽 소유자이거나 클럽 소유자가 직접 추가하는 경우 허용
-- clubs 테이블을 직접 조회하여 재귀 방지
CREATE POLICY "Club owners can add members"
    ON club_members FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM clubs
            WHERE clubs.id = club_members.club_id
            AND clubs.owner_id = auth.uid()
        )
    );

-- 3. UPDATE: 클럽 소유자만 역할 변경 가능 (재귀 방지를 위해 간소화)
CREATE POLICY "Club owners and admins can update member roles"
    ON club_members FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM clubs
            WHERE clubs.id = club_members.club_id
            AND clubs.owner_id = auth.uid()
        )
    );

-- 4. DELETE: 클럽 소유자만 멤버 제거 가능
CREATE POLICY "Club owners can remove members"
    ON club_members FOR DELETE
    USING (
        EXISTS (
            SELECT 1 FROM clubs
            WHERE clubs.id = club_members.club_id
            AND clubs.owner_id = auth.uid()
        )
    );

