# 깨끗한 시작 가이드

기존 데이터가 중요하지 않다면, 기존 테이블을 삭제하고 새로 시작하는 것이 가장 깔끔합니다.

## 방법 1: 기존 테이블 삭제 후 새로 시작 (권장)

### 단계별 실행

1. **기존 테이블 삭제**
   ```sql
   -- database/migrations/000_drop_existing_tables.sql 실행
   ```

2. **전체 스키마 적용**
   ```sql
   -- database/schema_multiclub.sql 실행
   ```

또는 단계별로:

1. `000_drop_existing_tables.sql`
2. `001_create_tables.sql`
3. `002_create_indexes.sql`
4. `003_create_functions.sql`
5. `004_create_triggers.sql`
6. `005_enable_rls.sql`
7. `006_create_rls_policies.sql`
8. `007_add_comments.sql`

## 방법 2: 기존 데이터 보존 (데이터가 중요한 경우)

기존 데이터를 보존하면서 마이그레이션하려면:

1. **기본 클럽 생성 및 컬럼 추가**
   ```sql
   -- database/migrations/009_migrate_existing_data.sql 실행
   ```

2. **주의사항**:
   - 이 마이그레이션은 `auth.users`에 최소 1명의 사용자가 있어야 합니다
   - 사용자가 없으면 먼저 회원가입을 해야 합니다
   - 기본 클럽의 소유자는 첫 번째 사용자로 설정됩니다

## 추천 방법

**처음부터 시작하는 경우**: 방법 1 사용
- 기존 데이터가 중요하지 않음
- 깔끔하게 새 구조로 시작

**기존 데이터를 보존해야 하는 경우**: 방법 2 사용
- 기존 회원 정보나 스케줄 데이터가 중요함
- 단계적으로 마이그레이션





