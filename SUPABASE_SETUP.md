# Supabase 데이터베이스 설정 가이드

## 1. Supabase 프로젝트 생성

1. [Supabase Dashboard](https://supabase.com)에 접속
2. "New Project" 클릭
3. 프로젝트 정보 입력:
   - Name: `tennis-club-scheduler`
   - Database Password: 안전한 비밀번호 생성 (저장 필수!)
   - Region: Northeast Asia (Seoul) 선택
4. "Create new project" 클릭

## 2. 데이터베이스 테이블 생성

프로젝트가 생성되면 좌측 메뉴에서 **SQL Editor**로 이동하여 아래 SQL 스크립트를 실행하세요.

### 전체 SQL 스크립트

```sql
-- ============================================
-- 테니스 동아리 스케줄 관리 시스템
-- 데이터베이스 스키마
-- ============================================

-- 1. Members 테이블 (이미 존재할 수 있음)
CREATE TABLE IF NOT EXISTS members (
  id BIGSERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  phone TEXT,
  email TEXT,
  skill_level TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Schedules 테이블
CREATE TABLE IF NOT EXISTS schedules (
  id BIGSERIAL PRIMARY KEY,
  date DATE NOT NULL,
  start_time TIME DEFAULT '10:00',
  end_time TIME DEFAULT '13:00',
  status TEXT DEFAULT 'planned',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Attendances 테이블
CREATE TABLE IF NOT EXISTS attendances (
  id BIGSERIAL PRIMARY KEY,
  schedule_id BIGINT REFERENCES schedules(id) ON DELETE CASCADE,
  member_id BIGINT REFERENCES members(id) ON DELETE SET NULL,
  guest_name TEXT,
  is_guest BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Matches 테이블
CREATE TABLE IF NOT EXISTS matches (
  id BIGSERIAL PRIMARY KEY,
  schedule_id BIGINT REFERENCES schedules(id) ON DELETE CASCADE,
  match_number INTEGER NOT NULL,
  court TEXT NOT NULL,
  start_time TIME,
  player1_id BIGINT,
  player2_id BIGINT,
  player3_id BIGINT,
  player4_id BIGINT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Constraints 테이블 (Phase 2)
CREATE TABLE IF NOT EXISTS constraints (
  id BIGSERIAL PRIMARY KEY,
  schedule_id BIGINT REFERENCES schedules(id) ON DELETE CASCADE,
  constraint_type TEXT NOT NULL,
  member_id_1 BIGINT REFERENCES members(id) ON DELETE CASCADE,
  member_id_2 BIGINT REFERENCES members(id) ON DELETE SET NULL,
  match_number INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- 인덱스 생성 (성능 최적화)
-- ============================================

CREATE INDEX IF NOT EXISTS idx_schedules_date ON schedules(date);
CREATE INDEX IF NOT EXISTS idx_attendances_schedule_id ON attendances(schedule_id);
CREATE INDEX IF NOT EXISTS idx_matches_schedule_id ON matches(schedule_id);

-- ============================================
-- RLS(Row Level Security) 비활성화 (개발 중)
-- 프로덕션에서는 적절한 RLS 정책 설정 필요
-- ============================================

ALTER TABLE members DISABLE ROW LEVEL SECURITY;
ALTER TABLE schedules DISABLE ROW LEVEL SECURITY;
ALTER TABLE attendances DISABLE ROW LEVEL SECURITY;
ALTER TABLE matches DISABLE ROW LEVEL SECURITY;
ALTER TABLE constraints DISABLE ROW LEVEL SECURITY;

-- ============================================
-- 테이블 코멘트
-- ============================================

COMMENT ON TABLE members IS '동아리 회원 정보';
COMMENT ON TABLE schedules IS '경기 스케줄 정보';
COMMENT ON TABLE attendances IS '스케줄별 참석자 정보';
COMMENT ON TABLE matches IS '경기 배정 정보 (6경기, 2코트)';
COMMENT ON TABLE constraints IS '스케줄 생성 제약조건';
```

## 3. 테스트 데이터 삽입 (선택사항)

테스트를 위해 샘플 회원 데이터를 삽입할 수 있습니다:

```sql
-- 샘플 회원 데이터
INSERT INTO members (name, phone, email, skill_level, is_active) VALUES
  ('강호동', '010-7890-1234', 'kang@example.com', '중급', true),
  ('김철수', '010-2345-6789', 'kim@example.com', '상급', true),
  ('박민수', '010-4567-8901', 'park@example.com', '중급', true),
  ('유재석', '010-8901-2345', 'yoo@example.com', '상급', true),
  ('이영희', '010-3456-7890', 'lee@example.com', '초급', true),
  ('정다은', '010-5678-9012', 'jung@example.com', '상급', true),
  ('최민지', '010-6789-0123', 'choi@example.com', '초급', true),
  ('홍길동', '010-1234-5678', 'hong@example.com', '중급', true)
ON CONFLICT DO NOTHING;
```

## 4. 구글 OAuth 설정 (선택사항)

구글 계정으로 로그인/회원가입 기능을 사용하려면 다음 설정이 필요합니다:

### 4.1 Google Cloud Console 설정

1. [Google Cloud Console](https://console.cloud.google.com) 접속
2. 새 프로젝트 생성 또는 기존 프로젝트 선택
3. **API 및 서비스** → **사용자 인증 정보** 이동
4. **사용자 인증 정보 만들기** → **OAuth 클라이언트 ID** 선택
5. 애플리케이션 유형: **웹 애플리케이션** 선택
6. 승인된 리디렉션 URI 추가:
   ```
   https://your-project-ref.supabase.co/auth/v1/callback
   ```
   (your-project-ref는 Supabase 프로젝트 참조 ID)
7. **클라이언트 ID**와 **클라이언트 보안 비밀번호** 복사

### 4.2 Supabase에서 구글 OAuth 활성화

1. Supabase Dashboard → **Authentication** → **Sign In / Providers** 이동
2. **Google** 찾아서 활성화 (토글 스위치 켜기)
3. 위에서 복사한 **Client ID**와 **Client Secret** 입력:
   - **Client ID (for OAuth)**: `your-google-client-id.apps.googleusercontent.com`
   - **Client Secret (for OAuth)**: `your-google-client-secret`
4. **Save** 클릭

**참고**: 
- "Sign In / Providers" 메뉴에서 모든 OAuth 제공자(Google, GitHub, 카카오 등)를 관리할 수 있습니다.
- Google 외에 다른 소셜 로그인도 같은 방식으로 추가할 수 있습니다.

### 4.3 리디렉션 URL 확인

Supabase Dashboard → **Authentication** → **URL Configuration**에서:
- **Redirect URLs**에 다음이 포함되어 있는지 확인:
  ```
  http://localhost:5173/auth/callback
  https://your-domain.com/auth/callback
  ```
- 개발 환경에서는 `http://localhost:5173/auth/callback`이 기본적으로 포함되어 있습니다.
- 프로덕션 배포 시 실제 도메인을 추가해야 합니다.

## 5. API 키 확인

1. 좌측 메뉴에서 **Settings** → **API** 클릭
2. 다음 정보를 복사:
   - **Project URL**: `https://xxxxx.supabase.co`
   - **anon public key**: `eyJhbGciOiJIUzI1...`

## 5. Frontend 환경 변수 설정

`frontend/.env` 파일을 생성하고 위에서 복사한 정보를 입력:

```bash
VITE_SUPABASE_URL=https://xxxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1...
```

## 6. 연결 테스트

1. 개발 서버 재시작:
   ```bash
   cd frontend
   npm run dev
   ```

2. 브라우저에서 `http://localhost:5173/members` 접속

3. "회원 추가" 버튼을 클릭하여 회원을 추가해보기

4. 회원이 정상적으로 추가되면 설정 완료!

## 7. 문제 해결

### 연결 실패 시

1. `.env` 파일이 `frontend/` 폴더에 있는지 확인
2. 환경 변수 이름이 정확한지 확인 (`VITE_` 접두사 필수)
3. Supabase URL과 Key가 올바른지 확인
4. 개발 서버를 재시작

### 테이블 생성 실패 시

1. SQL Editor에서 에러 메시지 확인
2. 각 테이블을 개별적으로 생성 시도
3. Supabase Dashboard의 Table Editor에서 테이블 확인

### RLS 정책 오류 시

개발 중에는 RLS를 비활성화했지만, 문제가 계속되면:

```sql
ALTER TABLE members DISABLE ROW LEVEL SECURITY;
ALTER TABLE schedules DISABLE ROW LEVEL SECURITY;
ALTER TABLE attendances DISABLE ROW LEVEL SECURITY;
ALTER TABLE matches DISABLE ROW LEVEL SECURITY;
```

## 다음 단계

데이터베이스 설정이 완료되면:

1. ✅ 회원 관리 페이지에서 회원 등록
2. ✅ 새 스케줄 만들기로 경기 일정 생성
3. ✅ 참석자 선택 및 스케줄 자동 생성
4. ✅ 생성된 경기 스케줄 확인 및 수정

---

**참고**: 프로덕션 배포 시에는 반드시 RLS(Row Level Security) 정책을 설정하여 데이터 보안을 강화하세요.
