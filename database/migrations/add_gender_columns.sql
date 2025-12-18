-- members 테이블은 이미 gender 컬럼이 있으므로 건너뜀

-- Add gender column to attendances table (for guests)
ALTER TABLE attendances
ADD COLUMN IF NOT EXISTS gender VARCHAR(10) CHECK (gender IN ('male', 'female'));

COMMENT ON COLUMN attendances.gender IS '게스트 성별: male(남자), female(여자) - 게스트인 경우에만 사용';
