-- ============================================
-- Super Admin 및 권한 관리 기능 추가
-- ============================================

-- 1. user_profiles 테이블에 is_super_admin 컬럼 추가
ALTER TABLE user_profiles
ADD COLUMN IF NOT EXISTS is_super_admin BOOLEAN DEFAULT false;

-- 2. bgc8214@gmail.com을 슈퍼 어드민으로 설정
UPDATE user_profiles
SET is_super_admin = true
WHERE email = 'bgc8214@gmail.com';

-- 3. 인덱스 추가 (성능 최적화)
CREATE INDEX IF NOT EXISTS idx_user_profiles_super_admin
ON user_profiles(is_super_admin)
WHERE is_super_admin = true;

-- 4. club_members 테이블에 인덱스 추가 (권한 조회 최적화)
CREATE INDEX IF NOT EXISTS idx_club_members_role
ON club_members(club_id, role);

-- ============================================
-- RLS 정책 업데이트 (슈퍼 어드민 권한)
-- ============================================

-- 슈퍼 어드민은 모든 클럽 조회 가능
CREATE POLICY "Super admins can view all clubs" ON clubs
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM user_profiles
    WHERE user_profiles.id = auth.uid()
    AND user_profiles.is_super_admin = true
  )
);

-- 슈퍼 어드민은 모든 클럽 멤버 조회 가능
CREATE POLICY "Super admins can view all club members" ON club_members
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM user_profiles
    WHERE user_profiles.id = auth.uid()
    AND user_profiles.is_super_admin = true
  )
);

-- 슈퍼 어드민은 모든 클럽 멤버 수정 가능
CREATE POLICY "Super admins can update all club members" ON club_members
FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM user_profiles
    WHERE user_profiles.id = auth.uid()
    AND user_profiles.is_super_admin = true
  )
);

-- ============================================
-- 헬퍼 함수: 현재 사용자가 슈퍼 어드민인지 확인
-- ============================================
CREATE OR REPLACE FUNCTION is_super_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM user_profiles
    WHERE id = auth.uid()
    AND is_super_admin = true
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- 헬퍼 함수: 클럽 내 사용자 권한 확인
-- ============================================
CREATE OR REPLACE FUNCTION get_user_role_in_club(club_id_param BIGINT)
RETURNS TEXT AS $$
DECLARE
  user_role TEXT;
BEGIN
  SELECT role INTO user_role
  FROM club_members
  WHERE club_id = club_id_param
  AND user_id = auth.uid();

  RETURN user_role;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
