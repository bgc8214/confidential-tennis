# 공개 스케줄 링크 기능 - 데이터베이스 적용 가이드

## 적용할 SQL

Supabase Dashboard → **SQL Editor**에서 다음 SQL을 실행하세요:

```sql
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
```

## 적용 방법

1. Supabase Dashboard 접속
2. 좌측 메뉴에서 **SQL Editor** 클릭
3. **New Query** 클릭
4. 위의 SQL 코드를 복사하여 붙여넣기
5. **Run** 버튼 클릭
6. 성공 메시지 확인

## 확인 방법

적용이 완료되면:

1. **Table Editor** → `schedules` 테이블 확인
   - `public_link` 컬럼이 추가되었는지 확인

2. **SQL Editor**에서 테스트:
   ```sql
   -- 함수 테스트
   SELECT generate_public_link();
   ```

3. **Authentication** → **Policies**에서 확인
   - `schedules` 테이블에 "Anyone can view public schedules" 정책이 추가되었는지 확인

## 주의사항

- `IF NOT EXISTS`를 사용했으므로 이미 적용된 경우 에러 없이 스킵됩니다.
- 기존 스케줄 데이터에는 `public_link`가 `NULL`로 설정됩니다.
- 공개 링크는 스케줄 생성 시 또는 나중에 생성할 수 있습니다.


