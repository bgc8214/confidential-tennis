# 데이터베이스 마이그레이션 가이드

## 멀티 클럽 지원으로의 마이그레이션

기존 단일 클럽 시스템에서 멀티 클럽 지원 시스템으로 마이그레이션하는 방법입니다.

---

## ⚠️ 중요: 기존 데이터 백업

마이그레이션 전에 **반드시 기존 데이터를 백업**하세요!

```sql
-- 기존 데이터 백업
CREATE TABLE members_backup AS SELECT * FROM members;
CREATE TABLE schedules_backup AS SELECT * FROM schedules;
CREATE TABLE attendances_backup AS SELECT * FROM attendances;
CREATE TABLE matches_backup AS SELECT * FROM matches;
CREATE TABLE constraints_backup AS SELECT * FROM constraints;
```

---

## 마이그레이션 방법

### 방법 1: 새로 시작 (권장 - 개발 초기 단계)

기존 데이터가 중요하지 않다면, 새로 시작하는 것이 가장 깔끔합니다.

1. Supabase Dashboard에서 기존 테이블 삭제
2. `schema_multiclub.sql` 실행
3. 새로 시작

### 방법 2: 데이터 마이그레이션 (기존 데이터 보존 필요 시)

기존 데이터를 보존하면서 마이그레이션하는 방법입니다.

#### 1단계: 새 테이블 생성

```sql
-- schema_multiclub.sql 실행
-- (기존 테이블과 충돌하지 않도록 IF NOT EXISTS 사용)
```

#### 2단계: 기본 클럽 생성

```sql
-- 임시로 기본 클럽 생성 (owner_id는 나중에 실제 사용자로 변경)
-- 이 단계는 Supabase Auth가 설정된 후에 실행해야 함
INSERT INTO clubs (name, description, code, owner_id)
VALUES (
  '기본 클럽',
  '기존 데이터를 위한 기본 클럽',
  upper(substring(md5(random()::text) from 1 for 8)),
  (SELECT id FROM auth.users LIMIT 1) -- 첫 번째 사용자 또는 관리자 ID
)
RETURNING id;
```

#### 3단계: 기존 데이터 마이그레이션

```sql
-- 기본 클럽 ID를 변수에 저장 (실제 값으로 변경 필요)
-- 예: 기본 클럽 ID가 1이라고 가정

-- Members 마이그레이션
UPDATE members 
SET club_id = 1 -- 기본 클럽 ID
WHERE club_id IS NULL;

-- Schedules 마이그레이션
UPDATE schedules 
SET club_id = 1 -- 기본 클럽 ID
WHERE club_id IS NULL;

-- 기타 테이블도 동일하게 마이그레이션
```

---

## 새 프로젝트 설정 (처음부터 시작)

### 1. Supabase 프로젝트 생성

1. [Supabase Dashboard](https://supabase.com) 접속
2. "New Project" 클릭
3. 프로젝트 정보 입력:
   - Name: `tennis-club-scheduler`
   - Database Password: 안전한 비밀번호 생성
   - Region: Northeast Asia (Seoul)

### 2. Authentication 설정

1. 좌측 메뉴에서 **Authentication** 클릭
2. **Providers** 탭에서 사용할 인증 방법 활성화:
   - Email: 활성화 (기본)
   - Google: 선택사항
   - 기타 소셜 로그인: 선택사항

### 3. 데이터베이스 스키마 적용

1. 좌측 메뉴에서 **SQL Editor** 클릭
2. "New Query" 클릭
3. `database/schema_multiclub.sql` 파일 내용을 복사하여 붙여넣기
4. **Run** 버튼 클릭
5. 성공 메시지 확인

### 4. 테이블 확인

Supabase Dashboard → **Table Editor**에서 다음 테이블들이 생성되었는지 확인:

- ✅ `user_profiles`
- ✅ `clubs`
- ✅ `club_members`
- ✅ `members`
- ✅ `schedules`
- ✅ `attendances`
- ✅ `matches`
- ✅ `constraints`

### 5. RLS 정책 확인

Supabase Dashboard → **Authentication** → **Policies**에서 각 테이블의 RLS 정책이 활성화되었는지 확인

---

## 테스트 데이터 생성

### 1. 테스트 사용자 생성 (Supabase Auth)

Supabase Dashboard → **Authentication** → **Users** → **Add User**에서 테스트 사용자 생성

또는 앱에서 회원가입 기능 사용

### 2. User Profile 생성

```sql
-- 테스트 사용자 ID로 변경 필요
INSERT INTO user_profiles (id, email, full_name)
VALUES (
  '사용자-UUID-여기에',
  'test@example.com',
  '테스트 사용자'
);
```

### 3. 테스트 클럽 생성

```sql
-- 테스트 사용자 ID로 변경 필요
INSERT INTO clubs (name, description, code, owner_id, settings)
VALUES (
  '서울 테니스 클럽',
  '테스트용 클럽',
  upper(substring(md5(random()::text) from 1 for 8)),
  '사용자-UUID-여기에',
  '{"default_start_time": "10:00", "default_end_time": "13:00", "court_count": 2}'::jsonb
)
RETURNING id, code;
```

### 4. 테스트 회원 추가

```sql
-- 위에서 생성한 클럽 ID로 변경 필요
INSERT INTO members (club_id, name, phone, email, skill_level)
VALUES
  (1, '홍길동', '010-1234-5678', 'hong@example.com', 'intermediate'),
  (1, '김철수', '010-2345-6789', 'kim@example.com', 'advanced'),
  (1, '이영희', '010-3456-7890', 'lee@example.com', 'beginner');
```

---

## 환경 변수 설정

`frontend/.env` 파일에 Supabase 정보 추가:

```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

---

## 다음 단계

1. ✅ 데이터베이스 스키마 적용 완료
2. ⏭️ Supabase Auth 설정 확인
3. ⏭️ 인증 UI 구현 (로그인/회원가입)
4. ⏭️ 클럽 관리 UI 구현
5. ⏭️ 기존 기능을 클럽별로 동작하도록 수정

---

## 트러블슈팅

### RLS 정책 오류

RLS 정책이 너무 엄격하면 데이터 접근이 안 될 수 있습니다. 개발 중에는 임시로 RLS를 비활성화할 수 있습니다:

```sql
-- 개발 중에만 사용 (프로덕션에서는 절대 사용하지 말 것!)
ALTER TABLE members DISABLE ROW LEVEL SECURITY;
```

### 클럽 코드 중복

클럽 코드가 중복되면 UNIQUE 제약조건 위반이 발생합니다. 자동 생성 함수를 사용하거나 충분히 긴 코드를 생성하세요.

### 외래 키 제약조건 오류

기존 데이터를 마이그레이션할 때 외래 키 제약조건 오류가 발생할 수 있습니다. 순서대로 마이그레이션하세요:

1. clubs
2. club_members
3. members
4. schedules
5. attendances
6. matches
7. constraints


