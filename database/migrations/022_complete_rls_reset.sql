-- ============================================
-- 마이그레이션 22: RLS 정책 완전 재설정 (재귀 없는 설계)
-- ============================================
-- 모든 정책을 삭제하고 재귀 없는 단순한 정책으로 재구성

-- ============================================
-- STEP 1: 모든 기존 정책 완전 삭제
-- ============================================

-- user_profiles 정책 삭제
DROP POLICY IF EXISTS "Users can view their own profile" ON user_profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON user_profiles;
DROP POLICY IF EXISTS "Users can insert their own profile" ON user_profiles;

-- clubs 정책 삭제
DROP POLICY IF EXISTS "Users can view clubs they belong to" ON clubs;
DROP POLICY IF EXISTS "Authenticated users can view clubs by code for joining" ON clubs;
DROP POLICY IF EXISTS "Users can view clubs" ON clubs;
DROP POLICY IF EXISTS "Authenticated users can view all clubs" ON clubs;
DROP POLICY IF EXISTS "Authenticated users can create clubs" ON clubs;
DROP POLICY IF EXISTS "Owners can update their clubs" ON clubs;
DROP POLICY IF EXISTS "Owners can delete their clubs" ON clubs;

-- club_members 정책 삭제 (모든 가능한 이름)
DROP POLICY IF EXISTS "Users can view club members of their clubs" ON club_members;
DROP POLICY IF EXISTS "Super admins can view all club members" ON club_members;
DROP POLICY IF EXISTS "Users and admins can view club members" ON club_members;
DROP POLICY IF EXISTS "Club owners can add members" ON club_members;
DROP POLICY IF EXISTS "Users can join clubs and admins can add members" ON club_members;
DROP POLICY IF EXISTS "Users can join clubs and owners can add members" ON club_members;
DROP POLICY IF EXISTS "Authenticated users can insert themselves as members" ON club_members;
DROP POLICY IF EXISTS "Club owners and admins can update member roles" ON club_members;
DROP POLICY IF EXISTS "Club owners can update member roles" ON club_members;
DROP POLICY IF EXISTS "Super admins can update all club members" ON club_members;
DROP POLICY IF EXISTS "Club owners can remove members" ON club_members;

-- ============================================
-- STEP 2: user_profiles 정책 (재귀 없음)
-- ============================================
-- 단순히 자기 자신만 조회/수정 가능

CREATE POLICY "user_profiles_select"
    ON user_profiles FOR SELECT
    TO authenticated
    USING (auth.uid() = id);

CREATE POLICY "user_profiles_update"
    ON user_profiles FOR UPDATE
    TO authenticated
    USING (auth.uid() = id);

CREATE POLICY "user_profiles_insert"
    ON user_profiles FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() = id);

-- ============================================
-- STEP 3: clubs 정책 (재귀 없음)
-- ============================================
-- 인증된 사용자는 모든 클럽 조회 가능 (클럽 코드로 가입하기 위해)
-- 다른 테이블을 참조하지 않으므로 재귀 없음

CREATE POLICY "clubs_select"
    ON clubs FOR SELECT
    TO authenticated
    USING (true);

CREATE POLICY "clubs_insert"
    ON clubs FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "clubs_update"
    ON clubs FOR UPDATE
    TO authenticated
    USING (owner_id = auth.uid());

CREATE POLICY "clubs_delete"
    ON clubs FOR DELETE
    TO authenticated
    USING (owner_id = auth.uid());

-- ============================================
-- STEP 4: club_members 정책 (재귀 없음)
-- ============================================

-- SELECT: 자기 자신의 멤버십 또는 슈퍼어드민이면 모든 멤버십 조회 가능
-- user_profiles를 조회하지만, user_profiles SELECT 정책이 단순하므로 재귀 없음
CREATE POLICY "club_members_select"
    ON club_members FOR SELECT
    TO authenticated
    USING (
        user_id = auth.uid()
        OR
        EXISTS (
            SELECT 1 FROM user_profiles
            WHERE user_profiles.id = auth.uid()
            AND user_profiles.is_super_admin = true
        )
    );

-- INSERT: 자기 자신만 추가 가능
-- clubs나 다른 테이블을 조회하지 않음 (재귀 없음)
-- 클럽 존재 여부는 foreign key constraint가 보장
-- 클럽 코드 검증은 애플리케이션에서 수행
CREATE POLICY "club_members_insert"
    ON club_members FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() = user_id);

-- UPDATE: 클럽 소유자 또는 슈퍼어드민만 역할 변경 가능
-- clubs를 조회하지만 clubs SELECT가 단순하므로 재귀 없음
CREATE POLICY "club_members_update"
    ON club_members FOR UPDATE
    TO authenticated
    USING (
        -- 클럽 소유자인 경우
        EXISTS (
            SELECT 1 FROM clubs
            WHERE clubs.id = club_members.club_id
            AND clubs.owner_id = auth.uid()
        )
        OR
        -- 슈퍼어드민인 경우
        EXISTS (
            SELECT 1 FROM user_profiles
            WHERE user_profiles.id = auth.uid()
            AND user_profiles.is_super_admin = true
        )
    );

-- DELETE: 클럽 소유자만 멤버 제거 가능
CREATE POLICY "club_members_delete"
    ON club_members FOR DELETE
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM clubs
            WHERE clubs.id = club_members.club_id
            AND clubs.owner_id = auth.uid()
        )
    );

-- ============================================
-- STEP 5: 재귀 경로 분석
-- ============================================
--
-- 1. club_members INSERT:
--    WITH CHECK (auth.uid() = user_id)
--    → 다른 테이블 조회 없음 → 재귀 없음 ✓
--
-- 2. club_members SELECT:
--    USING (user_id = auth.uid() OR EXISTS (SELECT FROM user_profiles ...))
--    → user_profiles SELECT 실행
--    → user_profiles SELECT: USING (auth.uid() = id)
--    → 다른 테이블 조회 없음 → 재귀 없음 ✓
--
-- 3. club_members UPDATE:
--    USING (EXISTS (SELECT FROM clubs ...) OR EXISTS (SELECT FROM user_profiles ...))
--    → clubs SELECT 실행: USING (true) → 재귀 없음 ✓
--    → user_profiles SELECT 실행: USING (auth.uid() = id) → 재귀 없음 ✓
--
-- 4. clubs SELECT:
--    USING (true)
--    → 다른 테이블 조회 없음 → 재귀 없음 ✓
--
-- 결론: 모든 경로에서 재귀 없음!
