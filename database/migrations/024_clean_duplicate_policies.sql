-- ============================================
-- 마이그레이션 024: 중복 정책 제거 및 정리
-- ============================================

-- ============================================
-- STEP 1: club_members INSERT 정책 중복 제거
-- ============================================
-- 3개의 INSERT 정책이 있어서 충돌 발생
DROP POLICY IF EXISTS "Authenticated users can insert themselves as members" ON club_members;
DROP POLICY IF EXISTS "Users can join clubs" ON club_members;
DROP POLICY IF EXISTS "club_members_insert" ON club_members;

-- 하나의 단순한 INSERT 정책만 유지
CREATE POLICY "club_members_insert"
    ON club_members FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() = user_id);

-- ============================================
-- STEP 2: clubs SELECT 정책 중복 제거
-- ============================================
-- 2개의 SELECT 정책이 있음
DROP POLICY IF EXISTS "Super admins can view all clubs" ON clubs;
-- "clubs_select" 정책은 이미 USING (true)로 모든 사용자 허용하므로 유지

-- ============================================
-- STEP 3: 재귀 경로 확인
-- ============================================
--
-- club_members INSERT:
--   WITH CHECK (auth.uid() = user_id)
--   → 다른 테이블 참조 없음 → 재귀 없음 ✓
--
-- club_members SELECT:
--   USING (user_id = auth.uid() OR EXISTS (SELECT FROM user_profiles ...))
--   → user_profiles SELECT: USING (auth.uid() = id)
--   → 다른 테이블 참조 없음 → 재귀 없음 ✓
--
-- clubs SELECT:
--   USING (true)
--   → 다른 테이블 참조 없음 → 재귀 없음 ✓
--
-- 결론: 모든 재귀 경로 제거됨!
