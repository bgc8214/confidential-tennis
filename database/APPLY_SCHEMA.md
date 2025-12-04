# Supabase 스키마 적용 가이드

Supabase 연결 문제로 자동 적용이 어려워, 수동으로 적용하는 방법을 안내합니다.

## 적용 방법

### 방법 1: 전체 스키마 한 번에 적용 (권장)

1. Supabase Dashboard 접속
2. 좌측 메뉴에서 **SQL Editor** 클릭
3. **New Query** 클릭
4. `database/schema_multiclub.sql` 파일의 전체 내용을 복사하여 붙여넣기
5. **Run** 버튼 클릭
6. 성공 메시지 확인

### 방법 2: 단계별 적용 (문제 발생 시)

순서대로 각 마이그레이션 파일을 실행하세요:

1. **001_create_tables.sql** - 테이블 생성 (성별, 경기 타입 포함)
2. **002_create_indexes.sql** - 인덱스 생성
3. **003_create_functions.sql** - 함수 생성
4. **004_create_triggers.sql** - 트리거 생성
5. **005_enable_rls.sql** - RLS 활성화
6. **006_create_rls_policies.sql** - RLS 정책 생성
7. **007_add_comments.sql** - 코멘트 추가

**기존 데이터베이스에 필드 추가하는 경우**:
8. **008_add_gender_and_match_type.sql** - 성별 및 경기 타입 필드 추가

각 파일을 Supabase SQL Editor에서 순서대로 실행하세요.

## 적용 후 확인

### 1. 테이블 확인

Supabase Dashboard → **Table Editor**에서 다음 테이블들이 생성되었는지 확인:

- ✅ `user_profiles`
- ✅ `clubs`
- ✅ `club_members`
- ✅ `members`
- ✅ `schedules`
- ✅ `attendances`
- ✅ `matches`
- ✅ `constraints`

### 2. RLS 정책 확인

Supabase Dashboard → **Authentication** → **Policies**에서 각 테이블의 RLS 정책이 생성되었는지 확인

### 3. 함수 확인

Supabase Dashboard → **Database** → **Functions**에서 다음 함수들이 생성되었는지 확인:

- ✅ `update_updated_at_column()`
- ✅ `generate_club_code()`
- ✅ `auto_add_club_owner()`

## 문제 해결

### 오류: "relation already exists"

기존 테이블이 있는 경우:
- `IF NOT EXISTS`를 사용했으므로 무시해도 됩니다
- 또는 기존 테이블을 삭제 후 다시 실행

### 오류: "permission denied"

RLS 정책이 너무 엄격한 경우:
- 개발 중에는 임시로 RLS를 비활성화할 수 있습니다:
```sql
ALTER TABLE members DISABLE ROW LEVEL SECURITY;
```
- **주의**: 프로덕션에서는 절대 사용하지 마세요!

### 오류: "foreign key constraint"

외래 키 제약조건 오류가 발생하면:
- 테이블 생성 순서를 확인하세요
- `auth.users` 테이블이 존재하는지 확인하세요 (Supabase Auth가 자동 생성)

## 다음 단계

스키마 적용이 완료되면:

1. ✅ Supabase Auth 설정 확인
2. ⏭️ 인증 UI 구현
3. ⏭️ 클럽 관리 UI 구현

