-- ============================================
-- 마이그레이션 19: clubs SELECT 정책 완전 수정
-- ============================================
-- 문제: INSERT 후 .select()에서 club:clubs(*) 조회 시 재귀 발생
-- 원인: clubs SELECT 정책이 여전히 club_members를 조회하려고 시도
-- 해결: 모든 clubs SELECT 정책을 삭제하고 단순한 정책 하나만 생성

-- ============================================
-- 1단계: 모든 기존 clubs SELECT 정책 삭제
-- ============================================
DROP POLICY IF EXISTS "Users can view clubs they belong to" ON clubs;
DROP POLICY IF EXISTS "Authenticated users can view clubs by code for joining" ON clubs;
DROP POLICY IF EXISTS "Users can view clubs" ON clubs;

-- ============================================
-- 2단계: 단순한 SELECT 정책 생성
-- ============================================
-- 인증된 사용자는 모든 클럽 조회 가능
-- club_members를 조회하지 않으므로 재귀 없음
CREATE POLICY "Authenticated users can view all clubs"
    ON clubs FOR SELECT
    TO authenticated
    USING (true);

-- ============================================
-- 3단계: club_members SELECT 정책 확인
-- ============================================
-- club_members SELECT 정책이 user_id만 확인하도록 되어 있는지 확인
-- (마이그레이션 017에서 이미 수정됨)

