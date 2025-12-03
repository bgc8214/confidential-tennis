# 🚀 빠른 시작 가이드

이 가이드를 따라 프로젝트를 로컬에서 실행하고 Supabase를 설정하세요.

## 1단계: Supabase 프로젝트 생성

### 1.1 회원가입
1. [Supabase](https://supabase.com) 접속
2. "Start your project" 클릭하여 회원가입
3. GitHub 계정으로 로그인 가능

### 1.2 새 프로젝트 생성
1. Dashboard에서 "New Project" 클릭
2. 프로젝트 정보 입력:
   - **Name**: `tennis-club-schedule`
   - **Database Password**: 안전한 비밀번호 설정 (저장 필수!)
   - **Region**: Northeast Asia (Seoul) 선택
   - **Pricing Plan**: Free 선택
3. "Create new project" 클릭 (생성까지 1-2분 소요)

### 1.3 데이터베이스 스키마 적용
1. 프로젝트가 생성되면 좌측 메뉴에서 **SQL Editor** 클릭
2. "New Query" 클릭
3. 프로젝트의 `database/schema.sql` 파일 내용을 복사하여 붙여넣기
4. 우측 하단의 **Run** 버튼 클릭
5. 성공 메시지 확인

### 1.4 API 키 복사
1. 좌측 메뉴에서 **Settings** → **API** 클릭
2. 다음 정보 복사:
   - **Project URL**: `https://xxxxx.supabase.co`
   - **anon public key**: `eyJhbG...` (긴 문자열)

## 2단계: 프론트엔드 설정

### 2.1 의존성 설치
```bash
cd frontend
npm install
```

### 2.2 환경 변수 설정
```bash
# .env 파일 수정
nano .env
# 또는
code .env
```

`.env` 파일에 Supabase 정보 입력:
```env
VITE_SUPABASE_URL=https://xxxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbG...여기에_실제_키_붙여넣기
```

### 2.3 개발 서버 실행
```bash
npm run dev
```

브라우저에서 `http://localhost:5173` 접속

## 3단계: 테스트

### 3.1 회원 추가 테스트
1. 좌측 네비게이션에서 **"회원 관리"** 클릭
2. **"+ 회원 추가"** 버튼 클릭
3. 회원 정보 입력 후 저장
4. Supabase Dashboard → **Table Editor** → **members** 테이블에서 데이터 확인

### 3.2 샘플 데이터 확인
`schema.sql`에 8명의 샘플 회원이 포함되어 있습니다:
- 홍길동, 김철수, 이영희, 박민수, 정다은, 최민지, 강호동, 유재석

## 트러블슈팅

### ❌ "Missing Supabase environment variables" 에러
**원인**: `.env` 파일이 없거나 환경 변수가 설정되지 않음

**해결**:
```bash
cd frontend
cp .env.example .env
# .env 파일을 열어 실제 Supabase URL과 Key 입력
npm run dev  # 서버 재시작 필수
```

### ❌ Supabase 연결 에러
**원인**: Supabase URL 또는 Key가 잘못됨

**해결**:
1. Supabase Dashboard → Settings → API에서 URL과 Key 재확인
2. `.env` 파일에 정확히 복사했는지 확인
3. 개발 서버 재시작 (`Ctrl+C` 후 `npm run dev`)

### ❌ 테이블이 없다는 에러
**원인**: 데이터베이스 스키마가 적용되지 않음

**해결**:
1. Supabase Dashboard → SQL Editor
2. `database/schema.sql` 내용 복사 후 실행
3. Supabase Dashboard → Table Editor에서 테이블 생성 확인

### ❌ RLS (Row Level Security) 에러
**원인**: 테이블에 RLS가 활성화되어 있음

**해결**:
개발 중에는 RLS를 비활성화하는 것이 편리합니다.

Supabase Dashboard → SQL Editor에서 실행:
```sql
ALTER TABLE members DISABLE ROW LEVEL SECURITY;
ALTER TABLE schedules DISABLE ROW LEVEL SECURITY;
ALTER TABLE attendances DISABLE ROW LEVEL SECURITY;
ALTER TABLE matches DISABLE ROW LEVEL SECURITY;
ALTER TABLE constraints DISABLE ROW LEVEL SECURITY;
```

## 다음 단계

✅ Supabase 설정 완료
✅ 회원 관리 기능 동작 확인

이제 다음 기능을 개발할 차례입니다:
- [ ] 스케줄 생성 UI
- [ ] 스케줄 표시 화면
- [ ] 기록 조회

---

**도움이 필요하신가요?**
- [Supabase 문서](https://supabase.com/docs)
- [프로젝트 이슈](https://github.com/bgc8214/confidential-tennis/issues)
