-- ============================================
-- 마이그레이션 15: club_members RLS 정책 무한 재귀 완전 수정
-- ============================================
-- 문제: club_members 테이블의 SELECT 정책이 자기 자신을 참조하여 무한 재귀 발생
-- 해결: 모든 정책을 재귀 없이 수정

-- 0. clubs 테이블의 SELECT 정책 확인 및 수정
-- 기존 정책이 club_members를 조회하면 재귀 발생 가능
-- 따라서 clubs SELECT 정책도 재귀 없이 수정 필요

-- 1. 기존 정책 모두 삭제
DROP POLICY IF EXISTS "Users can view club members of their clubs" ON club_members;
DROP POLICY IF EXISTS "Club owners can add members" ON club_members;
DROP POLICY IF EXISTS "Users can join clubs and admins can add members" ON club_members;
DROP POLICY IF EXISTS "Users can join clubs and owners can add members" ON club_members;
DROP POLICY IF EXISTS "Club owners and admins can update member roles" ON club_members;
DROP POLICY IF EXISTS "Club owners can update member roles" ON club_members;
DROP POLICY IF EXISTS "Club owners can remove members" ON club_members;

-- 2. clubs SELECT 정책 수정 (재귀 방지)
-- 기존 정책이 club_members를 조회하면 재귀 발생
-- 따라서 owner_id를 먼저 확인하고, 그 다음에만 club_members 조회
-- 마이그레이션 014에서 추가한 정책과 통합
DROP POLICY IF EXISTS "Users can view clubs they belong to" ON clubs;
DROP POLICY IF EXISTS "Authenticated users can view clubs by code for joining" ON clubs;

-- 통합된 정책: 인증된 사용자는 모든 클럽을 조회 가능 (가입 목적)
-- 하지만 멤버십 확인은 club_members를 조회하지 않고 직접 확인
CREATE POLICY "Users can view clubs"
    ON clubs FOR SELECT
    USING (
        -- 인증된 사용자는 모든 클럽 조회 가능 (클럽 코드로 가입하기 위해)
        auth.uid() IS NOT NULL
    );

-- 3. club_members SELECT 정책: 재귀 없이 수정
-- clubs 조회를 완전히 제거하고 user_id만 확인
CREATE POLICY "Users can view club members of their clubs"
    ON club_members FOR SELECT
    USING (
        -- 자기 자신의 멤버십만 확인 (재귀 없음)
        -- clubs를 조회하지 않으므로 완전히 재귀 없음
        user_id = auth.uid()
    );

-- 4. INSERT 정책: 클럽 코드로 가입 + 소유자가 추가
CREATE POLICY "Users can join clubs and owners can add members"
    ON club_members FOR INSERT
    WITH CHECK (
        -- 자기 자신을 member 역할로 추가하는 경우 (클럽 코드로 가입)
        -- clubs 테이블을 직접 조회하여 재귀 방지
        (
            auth.uid() = user_id 
            AND role = 'member'
            AND EXISTS (
                SELECT 1 FROM clubs
                WHERE clubs.id = club_members.club_id
                -- 클럽 코드 검증은 애플리케이션 레벨에서 수행
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

-- 5. UPDATE 정책: 클럽 소유자만 역할 변경 가능
CREATE POLICY "Club owners can update member roles"
    ON club_members FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM clubs
            WHERE clubs.id = club_members.club_id
            AND clubs.owner_id = auth.uid()
        )
    );

-- 6. DELETE 정책: 클럽 소유자만 멤버 제거 가능
CREATE POLICY "Club owners can remove members"
    ON club_members FOR DELETE
    USING (
        EXISTS (
            SELECT 1 FROM clubs
            WHERE clubs.id = club_members.club_id
            AND clubs.owner_id = auth.uid()
        )
    );
