-- ============================================
-- 현재 적용된 모든 RLS 정책 확인
-- ============================================
-- 이 쿼리를 Supabase SQL Editor에서 실행하여 결과를 확인하세요

-- 1. club_members 테이블의 모든 정책 확인
SELECT
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies
WHERE tablename = 'club_members'
ORDER BY cmd, policyname;

-- 2. clubs 테이블의 모든 정책 확인
SELECT
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies
WHERE tablename = 'clubs'
ORDER BY cmd, policyname;

-- 3. user_profiles 테이블의 모든 정책 확인
SELECT
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies
WHERE tablename = 'user_profiles'
ORDER BY cmd, policyname;
