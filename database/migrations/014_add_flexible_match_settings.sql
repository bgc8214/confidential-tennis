-- ============================================
-- 유연한 경기 설정 마이그레이션
-- 총 경기 시간, 경기 수, 경기별 매치 타입 설정
-- ============================================

-- 1. schedules 테이블에 경기 수, 경기당 시간, 코트 수 필드 추가
ALTER TABLE schedules
  ADD COLUMN IF NOT EXISTS total_matches INTEGER DEFAULT 6 CHECK (total_matches BETWEEN 1 AND 10),
  ADD COLUMN IF NOT EXISTS match_duration INTEGER DEFAULT 30 CHECK (match_duration BETWEEN 10 AND 120), -- 분 단위
  ADD COLUMN IF NOT EXISTS court_count INTEGER DEFAULT 2 CHECK (court_count BETWEEN 1 AND 10); -- 코트 수

-- 2. matches 테이블에 match_type 필드 추가 (경기별 타입 설정)
ALTER TABLE matches
  ADD COLUMN IF NOT EXISTS match_type TEXT DEFAULT 'mixed' CHECK (match_type IN ('mixed', 'mens', 'womens'));

-- 3. matches 테이블의 match_number CHECK 제약 조건 제거 및 재생성
ALTER TABLE matches DROP CONSTRAINT IF EXISTS matches_match_number_check;
ALTER TABLE matches ADD CONSTRAINT matches_match_number_check CHECK (match_number BETWEEN 1 AND 10);

-- 4. constraints 테이블의 match_number CHECK 제약 조건 제거 및 재생성
ALTER TABLE constraints DROP CONSTRAINT IF EXISTS constraints_match_number_check;
ALTER TABLE constraints ADD CONSTRAINT constraints_match_number_check CHECK (match_number BETWEEN 1 AND 10);

-- 5. 인덱스 추가
CREATE INDEX IF NOT EXISTS idx_matches_match_type ON matches(match_type);

-- 6. 기존 데이터 마이그레이션: matches 테이블의 match_type을 schedules의 match_type으로 설정
UPDATE matches m
SET match_type = s.match_type
FROM schedules s
WHERE m.schedule_id = s.id AND m.match_type IS NULL;

COMMENT ON COLUMN schedules.total_matches IS '총 경기 수 (1-10경기)';
COMMENT ON COLUMN schedules.match_duration IS '경기당 시간 (분 단위)';
COMMENT ON COLUMN schedules.court_count IS '코트 수 (1-10개)';
COMMENT ON COLUMN matches.match_type IS '경기별 타입: mixed(혼복), mens(남복), womens(여복)';
