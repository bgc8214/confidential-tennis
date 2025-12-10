# Clubs RLS 무한 재귀 문제 수정 가이드

## 문제 설명

`clubs` 테이블의 RLS 정책에서 무한 재귀가 발생했습니다.

**원인**: 
- `clubs` 테이블의 SELECT 정책이 `club_members`를 조회
- `club_members`의 SELECT 정책이 다시 `clubs`를 조회하려고 함
- 이 과정이 무한 반복됨

## 해결 방법

`clubs` 테이블의 SELECT 정책을 수정하여:
1. **소유자인 경우**: `owner_id = auth.uid()`로 직접 확인 (재귀 없음)
2. **멤버인 경우**: `club_members`를 조회하되, `club_members`의 정책이 `user_id = auth.uid()`를 먼저 확인하므로 재귀 방지

## 적용 방법

Supabase Dashboard → **SQL Editor**에서 다음 SQL을 실행하세요:

```sql
-- ============================================
-- 마이그레이션 12: clubs RLS 정책 무한 재귀 수정
-- ============================================

-- 기존 정책 삭제
DROP POLICY IF EXISTS "Users can view clubs they belong to" ON clubs;

-- 수정된 정책 생성
CREATE POLICY "Users can view clubs they belong to"
    ON clubs FOR SELECT
    USING (
        -- 소유자인 경우 직접 확인 (재귀 없음)
        owner_id = auth.uid() OR
        -- 멤버인 경우 club_members 조회
        -- club_members의 SELECT 정책이 user_id = auth.uid()를 먼저 확인하므로 재귀 방지됨
        EXISTS (
            SELECT 1 FROM club_members
            WHERE club_members.club_id = clubs.id
            AND club_members.user_id = auth.uid()
        )
    );
```

## 확인 방법

1. SQL 실행 후 성공 메시지 확인
2. 새 클럽 생성 시도
3. 클럽 목록 조회 시도
4. 에러 없이 작동하는지 확인

## 참고

- `club_members`의 SELECT 정책이 `user_id = auth.uid()`를 먼저 확인하므로, 이 경우 재귀 없이 바로 통과합니다.
- 소유자는 `owner_id`로 직접 확인하므로 재귀가 발생하지 않습니다.



