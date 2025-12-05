-- ============================================
-- 마이그레이션 16: club_members RLS 정책 무한 재귀 최종 수정
-- ============================================
-- 문제: club_members SELECT 정책에서 clubs를 조회할 때 재귀 발생
-- 해결: club_members SELECT 정책에서 clubs 조회를 완전히 제거하고 user_id만 확인

-- 1. 기존 정책 모두 삭제
DROP POLICY IF EXISTS "Users can view club members of their clubs" ON club_members;
DROP POLICY IF EXISTS "Club owners can add members" ON club_members;
DROP POLICY IF EXISTS "Users can join clubs and admins can add members" ON club_members;
DROP POLICY IF EXISTS "Users can join clubs and owners can add members" ON club_members;
DROP POLICY IF EXISTS "Club owners and admins can update member roles" ON club_members;
DROP POLICY IF EXISTS "Club owners can update member roles" ON club_members;
DROP POLICY IF EXISTS "Club owners can remove members" ON club_members;

-- 2. club_members SELECT 정책: clubs 조회 완전 제거
-- 자기 자신의 멤버십만 확인 (재귀 없음)
CREATE POLICY "Users can view club members of their clubs"
    ON club_members FOR SELECT
    USING (
        -- 자기 자신의 멤버십만 확인 (재귀 없음)
        user_id = auth.uid()
    );

-- 3. INSERT 정책: 클럽 코드로 가입 + 소유자가 추가
-- clubs 테이블을 조회하지만, clubs의 SELECT 정책이 단순하므로 재귀 없음
CREATE POLICY "Users can join clubs and owners can add members"
    ON club_members FOR INSERT
    WITH CHECK (
        -- 자기 자신을 member 역할로 추가하는 경우 (클럽 코드로 가입)
        (
            auth.uid() = user_id 
            AND role = 'member'
            AND EXISTS (
                SELECT 1 FROM clubs
                WHERE clubs.id = club_members.club_id
            )
        )
        OR
        -- 클럽 소유자가 다른 사용자를 추가하는 경우
        (
            EXISTS (
                SELECT 1 FROM clubs
                WHERE clubs.id = club_members.club_id
                AND clubs.owner_id = auth.uid()
            )
        )
        OR
        -- 클럽 생성 시 소유자 자신을 owner로 추가
        (
            auth.uid() = user_id 
            AND role = 'owner'
            AND EXISTS (
                SELECT 1 FROM clubs
                WHERE clubs.id = club_members.club_id
                AND clubs.owner_id = auth.uid()
            )
        )
    );

-- 4. UPDATE 정책: 클럽 소유자만 역할 변경 가능
CREATE POLICY "Club owners can update member roles"
    ON club_members FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM clubs
            WHERE clubs.id = club_members.club_id
            AND clubs.owner_id = auth.uid()
        )
    );

-- 5. DELETE 정책: 클럽 소유자만 멤버 제거 가능
CREATE POLICY "Club owners can remove members"
    ON club_members FOR DELETE
    USING (
        EXISTS (
            SELECT 1 FROM clubs
            WHERE clubs.id = club_members.club_id
            AND clubs.owner_id = auth.uid()
        )
    );

