-- ============================================
-- 마이그레이션 10: 공개 스케줄 링크 추가
-- ============================================

-- schedules 테이블에 public_link 필드 추가
ALTER TABLE schedules
ADD COLUMN IF NOT EXISTS public_link TEXT UNIQUE;

-- public_link 인덱스 생성 (조회 성능 향상)
CREATE INDEX IF NOT EXISTS idx_schedules_public_link ON schedules(public_link) WHERE public_link IS NOT NULL;

-- 공개 링크 생성 함수 (UUID 기반)
CREATE OR REPLACE FUNCTION generate_public_link()
RETURNS TEXT AS $$
BEGIN
  RETURN upper(substring(md5(random()::text || clock_timestamp()::text) from 1 for 16));
END;
$$ LANGUAGE plpgsql;

-- 공개 링크가 있는 스케줄은 누구나 조회 가능 (비로그인 사용자 포함)
-- 주의: 이 정책은 기존 정책과 함께 작동합니다 (OR 조건)
CREATE POLICY "Anyone can view public schedules"
    ON schedules FOR SELECT
    USING (public_link IS NOT NULL);

