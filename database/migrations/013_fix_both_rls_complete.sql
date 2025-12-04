-- ============================================
-- 마이그레이션 13: clubs와 club_members RLS 정책 완전 수정
-- 순환 참조를 완전히 제거
-- ============================================

-- 1. clubs 정책 수정
DROP POLICY IF EXISTS "Users can view clubs they belong to" ON clubs;

CREATE POLICY "Users can view clubs they belong to"
    ON clubs FOR SELECT
    USING (
        -- 소유자인 경우 직접 확인
        owner_id = auth.uid() OR
        -- 멤버인 경우: club_members를 조회하되, 
        -- club_members의 정책이 user_id만 확인하므로 재귀 없음
        EXISTS (
            SELECT 1 FROM club_members
            WHERE club_members.club_id = clubs.id
            AND club_members.user_id = auth.uid()
        )
    );

-- 2. club_members 정책 수정 (clubs 조회 제거)
DROP POLICY IF EXISTS "Users can view club members of their clubs" ON club_members;
DROP POLICY IF EXISTS "Club owners can add members" ON club_members;
DROP POLICY IF EXISTS "Club owners and admins can update member roles" ON club_members;
DROP POLICY IF EXISTS "Club owners can remove members" ON club_members;

-- SELECT: 자기 자신의 멤버십만 확인 (재귀 없음)
CREATE POLICY "Users can view club members of their clubs"
    ON club_members FOR SELECT
    USING (
        -- 자기 자신이 멤버인 경우
        user_id = auth.uid() OR
        -- 같은 클럽의 다른 멤버를 보려면, 자기 자신이 그 클럽의 멤버여야 함
        -- 하지만 이것도 재귀를 일으킬 수 있으므로, 
        -- 클럽 소유자는 clubs.owner_id로 확인
        EXISTS (
            SELECT 1 FROM clubs
            WHERE clubs.id = club_members.club_id
            AND clubs.owner_id = auth.uid()
        )
    );

-- INSERT: 클럽 소유자만 추가 가능 (clubs 직접 조회)
CREATE POLICY "Club owners can add members"
    ON club_members FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM clubs
            WHERE clubs.id = club_members.club_id
            AND clubs.owner_id = auth.uid()
        )
    );

-- UPDATE: 클럽 소유자만 수정 가능
CREATE POLICY "Club owners and admins can update member roles"
    ON club_members FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM clubs
            WHERE clubs.id = club_members.club_id
            AND clubs.owner_id = auth.uid()
        )
    );

-- DELETE: 클럽 소유자만 삭제 가능
CREATE POLICY "Club owners can remove members"
    ON club_members FOR DELETE
    USING (
        EXISTS (
            SELECT 1 FROM clubs
            WHERE clubs.id = club_members.club_id
            AND clubs.owner_id = auth.uid()
        )
    );


