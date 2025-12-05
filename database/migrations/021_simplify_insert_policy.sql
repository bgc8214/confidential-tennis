-- ============================================
-- 마이그레이션 21: club_members INSERT 정책 단순화
-- ============================================
-- 문제: INSERT 정책의 WITH CHECK에서 club_members 컬럼 참조 시 재귀 발생
-- 해결: 최대한 단순한 정책으로 변경, 클럽 검증은 애플리케이션에서 수행

-- ============================================
-- 1단계: 기존 INSERT 정책 모두 삭제
-- ============================================
DROP POLICY IF EXISTS "Users can join clubs and owners can add members" ON club_members;
DROP POLICY IF EXISTS "Users can join clubs and admins can add members" ON club_members;
DROP POLICY IF EXISTS "Club owners can add members" ON club_members;

-- ============================================
-- 2단계: 매우 단순한 INSERT 정책 생성
-- ============================================
-- 인증된 사용자는 자기 자신을 club_members에 추가 가능
-- 클럽 코드 검증, owner 검증 등은 모두 애플리케이션 레벨에서 수행
CREATE POLICY "Authenticated users can insert themselves as members"
    ON club_members FOR INSERT
    TO authenticated
    WITH CHECK (
        -- 자기 자신의 user_id로만 INSERT 가능
        auth.uid() = user_id
    );

-- ============================================
-- 설명
-- ============================================
-- 이 정책은 매우 간단하지만 안전합니다:
-- 1. 사용자는 자기 자신만 club_members에 추가할 수 있음
-- 2. 다른 사용자를 추가할 수 없음 (보안 유지)
-- 3. 클럽 코드 검증은 애플리케이션에서 이미 수행됨
-- 4. 클럽이 존재하는지는 foreign key constraint가 보장
-- 5. 재귀 없음!
