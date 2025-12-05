-- ============================================
-- 마이그레이션 17: 모든 RLS 정책 무한 재귀 완전 수정
-- ============================================
-- 문제 분석:
-- 1. clubs SELECT 정책이 club_members를 조회
-- 2. members, schedules 등 다른 테이블 정책도 club_members를 조회
-- 3. club_members SELECT 정책이 실행될 때 재귀 발생 가능
-- 해결: 모든 정책을 재귀 없이 수정

-- ============================================
-- 1단계: clubs 테이블 정책 수정
-- ============================================
DROP POLICY IF EXISTS "Users can view clubs they belong to" ON clubs;
DROP POLICY IF EXISTS "Authenticated users can view clubs by code for joining" ON clubs;
DROP POLICY IF EXISTS "Users can view clubs" ON clubs;

-- 인증된 사용자는 모든 클럽 조회 가능 (club_members 조회 없음)
CREATE POLICY "Users can view clubs"
    ON clubs FOR SELECT
    USING (auth.uid() IS NOT NULL);

-- ============================================
-- 2단계: club_members 테이블 정책 수정
-- ============================================
-- 모든 기존 정책 삭제
DROP POLICY IF EXISTS "Users can view club members of their clubs" ON club_members;
DROP POLICY IF EXISTS "Club owners can add members" ON club_members;
DROP POLICY IF EXISTS "Users can join clubs and admins can add members" ON club_members;
DROP POLICY IF EXISTS "Users can join clubs and owners can add members" ON club_members;
DROP POLICY IF EXISTS "Club owners and admins can update member roles" ON club_members;
DROP POLICY IF EXISTS "Club owners can update member roles" ON club_members;
DROP POLICY IF EXISTS "Club owners can remove members" ON club_members;
DROP POLICY IF EXISTS "Super admins can view all club members" ON club_members;
DROP POLICY IF EXISTS "Super admins can update all club members" ON club_members;

-- SELECT: 자기 자신의 멤버십만 확인 (완전히 재귀 없음)
CREATE POLICY "Users can view club members of their clubs"
    ON club_members FOR SELECT
    USING (user_id = auth.uid());

-- INSERT: 클럽 코드로 가입 + 소유자가 추가
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

-- UPDATE: 클럽 소유자만 역할 변경 가능
CREATE POLICY "Club owners can update member roles"
    ON club_members FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM clubs
            WHERE clubs.id = club_members.club_id
            AND clubs.owner_id = auth.uid()
        )
    );

-- DELETE: 클럽 소유자만 멤버 제거 가능
CREATE POLICY "Club owners can remove members"
    ON club_members FOR DELETE
    USING (
        EXISTS (
            SELECT 1 FROM clubs
            WHERE clubs.id = club_members.club_id
            AND clubs.owner_id = auth.uid()
        )
    );

-- 슈퍼 어드민 정책 (재귀 없이 수정)
CREATE POLICY "Super admins can view all club members"
    ON club_members FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM user_profiles
            WHERE user_profiles.id = auth.uid()
            AND user_profiles.is_super_admin = true
        )
    );

CREATE POLICY "Super admins can update all club members"
    ON club_members FOR UPDATE
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM user_profiles
            WHERE user_profiles.id = auth.uid()
            AND user_profiles.is_super_admin = true
        )
    );

-- ============================================
-- 완료: 모든 정책이 재귀 없이 수정됨
-- ============================================
-- members, schedules 등 다른 테이블의 정책들이 club_members를 조회하지만,
-- club_members의 SELECT 정책이 user_id = auth.uid()만 확인하므로 재귀 없음
-- 
-- 재귀 경로 분석:
-- 1. clubs SELECT → club_members 조회 → club_members SELECT (user_id만 확인) → 재귀 없음 ✓
-- 2. members SELECT → club_members 조회 → club_members SELECT (user_id만 확인) → 재귀 없음 ✓
-- 3. schedules SELECT → club_members 조회 → club_members SELECT (user_id만 확인) → 재귀 없음 ✓
--
-- 핵심: club_members SELECT 정책이 다른 테이블을 조회하지 않고 user_id만 확인하므로
--       어떤 경로로 접근하든 재귀가 발생하지 않음

