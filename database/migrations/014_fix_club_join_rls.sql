-- ============================================
-- 마이그레이션 14: 클럽 가입을 위한 RLS 정책 수정
-- ============================================
-- 문제: 현재 clubs 테이블의 SELECT 정책이 이미 멤버인 사람만 조회 가능하도록 되어있어
--      클럽 코드로 가입하려는 사람이 클럽을 조회할 수 없음
-- 해결: 인증된 사용자가 클럽 코드로 클럽을 조회할 수 있도록 정책 추가

-- 기존 정책 삭제 후 새로 생성
DROP POLICY IF EXISTS "Authenticated users can view clubs by code for joining" ON clubs;

-- 인증된 사용자가 클럽 코드로 클럽 조회 가능 (가입 목적)
CREATE POLICY "Authenticated users can view clubs by code for joining"
    ON clubs FOR SELECT
    USING (auth.uid() IS NOT NULL);

-- 클럽 멤버 테이블에도 자신이 가입하는 레코드는 생성 가능하도록
-- 무한 재귀를 피하기 위해 간단한 정책 사용
-- 주의: 이 정책은 마이그레이션 015에서 완전히 재작성됩니다.
DROP POLICY IF EXISTS "Club owners can add members" ON club_members;
DROP POLICY IF EXISTS "Users can join clubs and admins can add members" ON club_members;

CREATE POLICY "Users can join clubs and admins can add members"
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
            )
        )
        OR
        -- 또는 owner 역할로 추가하는 경우 (클럽 생성 시)
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
