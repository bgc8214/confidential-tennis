-- ============================================
-- 마이그레이션 9: 기존 데이터 마이그레이션 (기존 테이블이 있는 경우)
-- 기존 데이터를 보존하면서 멀티 클럽 구조로 마이그레이션
-- ============================================

-- 주의: 이 마이그레이션은 기존 테이블이 있고 데이터를 보존해야 할 때만 사용하세요
-- 새로 시작하는 경우에는 000_drop_existing_tables.sql을 먼저 실행하세요

-- 1. 기본 클럽 생성 (기존 데이터를 위한)
-- 먼저 auth.users에 사용자가 있어야 합니다
DO $$
DECLARE
  default_owner_id UUID;
  default_club_id BIGINT;
BEGIN
  -- 첫 번째 사용자를 기본 클럽 소유자로 설정
  SELECT id INTO default_owner_id FROM auth.users LIMIT 1;
  
  -- 사용자가 없으면 기본 UUID 사용 (나중에 실제 사용자로 변경 필요)
  IF default_owner_id IS NULL THEN
    -- 임시로 UUID 생성 (실제로는 사용자가 생성된 후 실행해야 함)
    RAISE NOTICE 'Warning: No users found. Please create a user first or update owner_id manually.';
    -- 기본 클럽은 나중에 수동으로 생성하거나 사용자 생성 후 실행
    RETURN;
  END IF;
  
  -- 기본 클럽 생성
  INSERT INTO clubs (name, description, code, owner_id)
  VALUES (
    '기본 클럽',
    '기존 데이터를 위한 기본 클럽',
    upper(substring(md5(random()::text || clock_timestamp()::text) from 1 for 8)),
    default_owner_id
  )
  ON CONFLICT DO NOTHING
  RETURNING id INTO default_club_id;
  
  -- 2. 기존 members 테이블에 club_id 추가
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'members' AND table_schema = 'public') THEN
    -- club_id 컬럼이 없으면 추가
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'members' AND column_name = 'club_id') THEN
      ALTER TABLE members ADD COLUMN club_id BIGINT;
      
      -- 기본 클럽 ID로 업데이트
      UPDATE members SET club_id = default_club_id WHERE club_id IS NULL;
      
      -- NOT NULL 제약조건 추가
      ALTER TABLE members ALTER COLUMN club_id SET NOT NULL;
      
      -- 외래 키 제약조건 추가
      ALTER TABLE members ADD CONSTRAINT fk_members_club_id 
        FOREIGN KEY (club_id) REFERENCES clubs(id) ON DELETE CASCADE;
    END IF;
    
    -- gender 컬럼 추가
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'members' AND column_name = 'gender') THEN
      ALTER TABLE members ADD COLUMN gender TEXT CHECK (gender IN ('male', 'female'));
    END IF;
  END IF;
  
  -- 3. 기존 schedules 테이블에 club_id 추가
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'schedules' AND table_schema = 'public') THEN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'schedules' AND column_name = 'club_id') THEN
      ALTER TABLE schedules ADD COLUMN club_id BIGINT;
      
      -- 기본 클럽 ID로 업데이트
      UPDATE schedules SET club_id = default_club_id WHERE club_id IS NULL;
      
      -- NOT NULL 제약조건 추가
      ALTER TABLE schedules ALTER COLUMN club_id SET NOT NULL;
      
      -- 외래 키 제약조건 추가
      ALTER TABLE schedules ADD CONSTRAINT fk_schedules_club_id 
        FOREIGN KEY (club_id) REFERENCES clubs(id) ON DELETE CASCADE;
      
      -- UNIQUE 제약조건 수정 (club_id 포함)
      ALTER TABLE schedules DROP CONSTRAINT IF EXISTS schedules_date_key;
      ALTER TABLE schedules ADD CONSTRAINT schedules_club_date_unique UNIQUE (club_id, date);
    END IF;
    
    -- match_type 컬럼 추가
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'schedules' AND column_name = 'match_type') THEN
      ALTER TABLE schedules ADD COLUMN match_type TEXT DEFAULT 'mixed' CHECK (match_type IN ('mixed', 'mens', 'womens'));
      UPDATE schedules SET match_type = 'mixed' WHERE match_type IS NULL;
    END IF;
  END IF;
  
END $$;



