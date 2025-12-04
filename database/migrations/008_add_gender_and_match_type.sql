-- ============================================
-- 마이그레이션 8: 성별 및 경기 타입 필드 추가
-- 기존 데이터베이스에 필드를 추가하는 마이그레이션
-- ============================================

-- Members 테이블에 gender 필드 추가
ALTER TABLE members 
ADD COLUMN IF NOT EXISTS gender TEXT CHECK (gender IN ('male', 'female'));

-- Schedules 테이블에 match_type 필드 추가
ALTER TABLE schedules 
ADD COLUMN IF NOT EXISTS match_type TEXT DEFAULT 'mixed' CHECK (match_type IN ('mixed', 'mens', 'womens'));

-- 기존 스케줄의 match_type을 기본값으로 설정
UPDATE schedules 
SET match_type = 'mixed' 
WHERE match_type IS NULL;


