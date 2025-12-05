-- 모든 테이블의 RLS 정책 확인
SELECT
    tablename,
    policyname,
    cmd,
    qual,
    with_check
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename, cmd, policyname;
