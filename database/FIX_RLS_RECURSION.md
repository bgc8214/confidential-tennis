# RLS 무한 재귀 문제 수정 가이드

## 문제 설명

`club_members` 테이블의 RLS 정책에서 무한 재귀가 발생했습니다.

**원인**: 
- `club_members` 테이블의 INSERT 정책이 자기 자신(`club_members`)을 조회하려고 함
- 새 클럽 생성 시 `club_members`에 소유자를 추가하려 할 때 정책 체크를 위해 `club_members`를 조회
- 이 과정이 무한 반복됨

## 해결 방법

`club_members` 테이블의 RLS 정책을 수정하여:
1. **INSERT 정책**: `clubs` 테이블을 직접 조회하여 소유자 확인
2. **SELECT 정책**: 자기 자신의 `user_id`를 직접 확인하거나 `clubs` 테이블 조회
3. **UPDATE/DELETE 정책**: `clubs` 테이블을 직접 조회

## 적용 방법

Supabase Dashboard → **SQL Editor**에서 다음 SQL을 실행하세요:

```sql
-- ============================================
-- 마이그레이션 11: club_members RLS 정책 무한 재귀 수정
-- ============================================

-- 기존 정책 삭제
DROP POLICY IF EXISTS "Users can view club members of their clubs" ON club_members;
DROP POLICY IF EXISTS "Club owners can add members" ON club_members;
DROP POLICY IF EXISTS "Club owners and admins can update member roles" ON club_members;
DROP POLICY IF EXISTS "Club owners can remove members" ON club_members;

-- 수정된 정책 생성

-- 1. SELECT: 자기 자신이 멤버인 클럽의 멤버 목록 조회 가능
CREATE POLICY "Users can view club members of their clubs"
    ON club_members FOR SELECT
    USING (
        user_id = auth.uid() OR
        EXISTS (
            SELECT 1 FROM clubs
            WHERE clubs.id = club_members.club_id
            AND clubs.owner_id = auth.uid()
        )
    );

-- 2. INSERT: 클럽 소유자만 멤버 추가 가능
CREATE POLICY "Club owners can add members"
    ON club_members FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM clubs
            WHERE clubs.id = club_members.club_id
            AND clubs.owner_id = auth.uid()
        )
    );

-- 3. UPDATE: 클럽 소유자만 역할 변경 가능
CREATE POLICY "Club owners and admins can update member roles"
    ON club_members FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM clubs
            WHERE clubs.id = club_members.club_id
            AND clubs.owner_id = auth.uid()
        )
    );

-- 4. DELETE: 클럽 소유자만 멤버 제거 가능
CREATE POLICY "Club owners can remove members"
    ON club_members FOR DELETE
    USING (
        EXISTS (
            SELECT 1 FROM clubs
            WHERE clubs.id = club_members.club_id
            AND clubs.owner_id = auth.uid()
        )
    );
```

## 확인 방법

1. SQL 실행 후 성공 메시지 확인
2. 새 클럽 생성 시도
3. 에러 없이 클럽이 생성되는지 확인

## 참고

- `clubs` 테이블의 `owner_id`는 클럽 생성 시 자동으로 설정되므로, INSERT 정책에서 이를 확인하면 재귀 없이 소유자를 확인할 수 있습니다.
- `auto_add_club_owner()` 트리거가 클럽 생성 시 자동으로 `club_members`에 소유자를 추가하므로, 이 트리거가 실행될 때 INSERT 정책이 통과해야 합니다.





