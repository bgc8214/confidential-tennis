-- Add gender column to members table
ALTER TABLE members
ADD COLUMN gender VARCHAR(10) CHECK (gender IN ('male', 'female'));

-- Add gender column to attendances table (for guests)
ALTER TABLE attendances
ADD COLUMN gender VARCHAR(10) CHECK (gender IN ('male', 'female'));

-- Update existing members to have default gender (optional, can be set manually)
-- You can run this separately if needed
-- UPDATE members SET gender = 'male' WHERE gender IS NULL;

COMMENT ON COLUMN members.gender IS '성별: male(남자), female(여자)';
COMMENT ON COLUMN attendances.gender IS '게스트 성별: male(남자), female(여자) - 게스트인 경우에만 사용';
