# RLS 무한 재귀 최종 해결 방법

## 문제 원인

`clubs`와 `club_members` 테이블의 RLS 정책이 서로를 조회하면서 순환 참조가 발생합니다:
- `clubs` SELECT 정책 → `club_members` 조회
- `club_members` SELECT 정책 → `clubs` 조회 (소유자 확인)
- 무한 반복!

## 최종 해결책

**핵심**: `club_members`의 SELECT 정책에서 `clubs`를 조회하지 않고, `user_id`만 확인하도록 변경합니다.

## 적용 방법

Supabase Dashboard → **SQL Editor**에서 다음 SQL을 **순서대로** 실행하세요:

### 1단계: 기존 정책 모두 삭제

```sql
-- clubs 정책 삭제
DROP POLICY IF EXISTS "Users can view clubs they belong to" ON clubs;

-- club_members 정책 삭제
DROP POLICY IF EXISTS "Users can view club members of their clubs" ON club_members;
DROP POLICY IF EXISTS "Club owners can add members" ON club_members;
DROP POLICY IF EXISTS "Club owners and admins can update member roles" ON club_members;
DROP POLICY IF EXISTS "Club owners can remove members" ON club_members;
```

### 2단계: 수정된 정책 생성

```sql
-- ============================================
-- clubs 정책: 소유자 확인 + 멤버 확인
-- ============================================
CREATE POLICY "Users can view clubs they belong to"
    ON clubs FOR SELECT
    USING (
        -- 소유자인 경우 직접 확인 (재귀 없음)
        owner_id = auth.uid() OR
        -- 멤버인 경우: club_members를 조회
        -- club_members의 정책이 user_id만 확인하므로 재귀 없음
        EXISTS (
            SELECT 1 FROM club_members
            WHERE club_members.club_id = clubs.id
            AND club_members.user_id = auth.uid()
        )
    );

-- ============================================
-- club_members 정책: user_id만 확인 (clubs 조회 제거!)
-- ============================================
-- SELECT: 자기 자신의 멤버십만 확인 (재귀 없음)
CREATE POLICY "Users can view club members of their clubs"
    ON club_members FOR SELECT
    USING (
        -- 자기 자신이 멤버인 경우만 조회 가능
        -- clubs를 조회하지 않으므로 재귀 없음
        user_id = auth.uid()
    );

-- INSERT: 클럽 소유자만 추가 가능
CREATE POLICY "Club owners can add members"
    ON club_members FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM clubs
            WHERE clubs.id = club_members.club_id
            AND clubs.owner_id = auth.uid()
        )
    );

-- UPDATE: 클럽 소유자만 수정 가능
CREATE POLICY "Club owners and admins can update member roles"
    ON club_members FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM clubs
            WHERE clubs.id = club_members.club_id
            AND clubs.owner_id = auth.uid()
        )
    );

-- DELETE: 클럽 소유자만 삭제 가능
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

## 핵심 변경사항

**변경 전**:
- `club_members` SELECT 정책이 `clubs`를 조회 → 순환 참조 발생

**변경 후**:
- `club_members` SELECT 정책이 `user_id = auth.uid()`만 확인 → 재귀 없음
- 소유자가 다른 멤버를 보려면 `clubs` SELECT 정책을 통해 확인

## 확인 방법

1. SQL 실행 후 성공 메시지 확인
2. 새 클럽 생성 시도
3. 클럽 목록 조회 시도
4. 클럽 멤버 목록 조회 시도
5. 에러 없이 작동하는지 확인

## 참고

- `club_members` SELECT 정책이 `user_id`만 확인하므로, 사용자는 자신의 멤버십만 볼 수 있습니다.
- 소유자가 모든 멤버를 보려면 `clubs` 테이블을 통해 확인할 수 있습니다 (소유자는 `owner_id`로 직접 확인되므로 재귀 없음).





