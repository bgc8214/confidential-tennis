-- Migration: Add 'match_count' constraint type
-- Description: 개인별 경기 수 설정 기능을 위한 제약조건 타입 추가

-- 1. 기존 제약조건 타입 체크 제거
ALTER TABLE constraints DROP CONSTRAINT IF EXISTS constraints_constraint_type_check;
ALTER TABLE constraints DROP CONSTRAINT IF EXISTS check_constraint_type_requirements;

-- 2. 새로운 제약조건 타입 체크 추가 ('match_count' 포함)
ALTER TABLE constraints ADD CONSTRAINT constraints_constraint_type_check
  CHECK (constraint_type IN ('exclude_last_match', 'partner_pair', 'exclude_match', 'match_count'));

-- 3. 제약조건 타입별 요구사항 체크 추가 ('match_count' 포함)
ALTER TABLE constraints ADD CONSTRAINT check_constraint_type_requirements CHECK (
  (constraint_type = 'exclude_last_match' AND member_id_1 IS NOT NULL AND member_id_2 IS NULL AND match_number IS NULL) OR
  (constraint_type = 'partner_pair' AND member_id_1 IS NOT NULL AND member_id_2 IS NOT NULL AND match_number IS NULL) OR
  (constraint_type = 'exclude_match' AND member_id_1 IS NOT NULL AND match_number IS NOT NULL) OR
  (constraint_type = 'match_count' AND member_id_1 IS NOT NULL AND member_id_2 IS NULL AND match_number IS NOT NULL)
);

-- 설명:
-- - exclude_last_match: member_id_1만 필요, match_number는 NULL
-- - partner_pair: member_id_1, member_id_2 필요, match_number는 NULL
-- - exclude_match: member_id_1, match_number 필요
-- - match_count: member_id_1, match_number(경기 수) 필요, member_id_2는 NULL
