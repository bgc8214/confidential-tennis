-- ============================================
-- 경기별/코트별 타입 설정 마이그레이션
-- match_types: 경기별 타입 배열 (JSONB)
-- court_types: 코트별 타입 배열 (JSONB, 선택사항)
-- ============================================

-- 1. schedules 테이블에 match_types, court_types 컬럼 추가
ALTER TABLE schedules
  ADD COLUMN IF NOT EXISTS match_types JSONB,
  ADD COLUMN IF NOT EXISTS court_types JSONB;

-- 2. 기존 데이터 마이그레이션: match_type을 match_types 배열로 변환
UPDATE schedules
SET match_types = jsonb_build_array(match_type)
WHERE match_types IS NULL AND match_type IS NOT NULL;

-- 3. 인덱스 추가 (JSONB 쿼리 최적화)
CREATE INDEX IF NOT EXISTS idx_schedules_match_types ON schedules USING GIN (match_types);
CREATE INDEX IF NOT EXISTS idx_schedules_court_types ON schedules USING GIN (court_types);

-- 4. 코멘트 추가
COMMENT ON COLUMN schedules.match_types IS '경기별 타입 배열: ["mixed", "mens", "womens", ...] (JSONB)';
COMMENT ON COLUMN schedules.court_types IS '코트별 타입 배열: ["mixed", "mens", "womens", ...] (JSONB, 선택사항)';




