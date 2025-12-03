# Supabase 설정 가이드

## 1. Supabase 프로젝트 생성

1. [Supabase](https://supabase.com) 가입
2. "New Project" 클릭
3. 프로젝트 이름: `tennis-club-schedule`
4. Database Password 설정 (저장 필수!)
5. Region: Northeast Asia (Seoul) 선택
6. Free Tier 선택

## 2. 데이터베이스 스키마 적용

### SQL Editor 사용

1. Supabase Dashboard → SQL Editor
2. "New Query" 클릭
3. `schema.sql` 파일 내용을 복사하여 붙여넣기
4. "Run" 버튼 클릭

또는 Supabase CLI 사용:

```bash
# Supabase CLI 설치
npm install -g supabase

# 로그인
supabase login

# 프로젝트 연결
supabase link --project-ref your-project-ref

# 마이그레이션 실행
supabase db push
```

## 3. 환경 변수 설정

### Supabase Dashboard에서 API 키 가져오기

1. Supabase Dashboard → Settings → API
2. Project URL 복사
3. `anon` `public` key 복사

### Frontend 환경 변수 설정

```bash
cd frontend
cp .env.example .env
```

`.env` 파일에 다음 내용 추가:

```
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

## 4. Row Level Security (RLS) 설정 (선택사항)

현재는 개발 편의를 위해 RLS를 비활성화했지만, 운영 시 활성화 권장:

```sql
-- members 테이블 RLS 활성화
ALTER TABLE members ENABLE ROW LEVEL SECURITY;

-- 모든 사용자가 읽기 가능
CREATE POLICY "Enable read access for all users" ON members
  FOR SELECT USING (true);

-- 인증된 사용자만 삽입/수정/삭제 가능 (추후 Auth 구현 시)
CREATE POLICY "Enable insert for authenticated users only" ON members
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');
```

## 5. 테이블 확인

Supabase Dashboard → Table Editor에서 다음 테이블 확인:
- members
- schedules
- attendances
- matches
- constraints

## 6. 샘플 데이터 확인

`schema.sql`에 포함된 샘플 회원 데이터가 `members` 테이블에 있는지 확인하세요.

## 7. API 테스트

Frontend에서 Supabase 연결 테스트:

```typescript
import { supabase } from './lib/supabase';

const { data, error } = await supabase
  .from('members')
  .select('*');

console.log(data);
```

## 트러블슈팅

### 연결 오류
- `.env` 파일의 URL과 Key가 정확한지 확인
- 개발 서버 재시작 필요 (`npm run dev`)

### RLS 에러
- 개발 단계에서는 RLS를 비활성화하거나
- Supabase Dashboard → Authentication → Policies에서 정책 확인

### CORS 에러
- Supabase는 자동으로 CORS를 처리하므로 별도 설정 불필요
- 만약 발생 시 Supabase Dashboard → Settings → API → CORS 확인
