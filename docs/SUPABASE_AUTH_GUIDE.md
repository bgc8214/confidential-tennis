# Supabase Auth 회원 관리 가이드

## 1. Supabase Auth란?

Supabase Auth는 **GoTrue**라는 오픈소스 인증 서버를 기반으로 한 완전 관리형 인증 시스템입니다.

### 주요 특징
- ✅ 이메일/비밀번호 인증
- ✅ 소셜 로그인 (Google, GitHub, 카카오 등)
- ✅ 매직 링크 (비밀번호 없는 로그인)
- ✅ JWT 토큰 기반 인증
- ✅ 자동 세션 관리
- ✅ Row Level Security (RLS)와 완벽 통합

---

## 2. Supabase Auth의 데이터 구조

### 2.1 auth.users 테이블 (자동 관리)

Supabase가 **자동으로 생성하고 관리**하는 테이블입니다. 개발자가 직접 수정할 수 없습니다.

```sql
-- 이 테이블은 Supabase가 자동으로 관리합니다
-- 직접 CREATE TABLE 할 필요 없음!

auth.users {
  id UUID PRIMARY KEY,              -- 사용자 고유 ID (UUID)
  email TEXT,                       -- 이메일 주소
  encrypted_password TEXT,          -- 암호화된 비밀번호
  email_confirmed_at TIMESTAMPTZ,   -- 이메일 확인 시간
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ,
  -- ... 기타 메타데이터
}
```

**중요**: 
- 이 테이블은 `auth` 스키마에 있습니다
- 직접 쿼리할 수 없고, Supabase Auth API를 통해서만 접근 가능
- `auth.uid()` 함수로 현재 로그인한 사용자 ID를 가져올 수 있음

---

## 3. 멀티 클럽 시스템에서의 구조

### 3.1 전체 데이터 구조

```
┌─────────────────────────────────────────┐
│  auth.users (Supabase 자동 관리)        │
│  - id (UUID)                            │
│  - email                                │
│  - encrypted_password                   │
└─────────────────────────────────────────┘
              │
              │ 참조
              ▼
┌─────────────────────────────────────────┐
│  user_profiles (우리가 만드는 테이블)   │
│  - id (UUID) → auth.users.id            │
│  - full_name                            │
│  - avatar_url                           │
└─────────────────────────────────────────┘
              │
              │ 참조
              ▼
┌─────────────────────────────────────────┐
│  club_members (사용자-클럽 관계)        │
│  - user_id (UUID) → auth.users.id      │
│  - club_id                              │
│  - role (owner/admin/member)            │
└─────────────────────────────────────────┘
              │
              │ 참조
              ▼
┌─────────────────────────────────────────┐
│  clubs (클럽 정보)                      │
│  - id                                   │
│  - name                                 │
│  - owner_id (UUID) → auth.users.id     │
└─────────────────────────────────────────┘
              │
              │ 참조
              ▼
┌─────────────────────────────────────────┐
│  members (클럽별 회원 정보)             │
│  - club_id                              │
│  - user_id (UUID) → auth.users.id      │
│  - name, phone, skill_level...          │
└─────────────────────────────────────────┘
```

### 3.2 테이블별 역할

#### 1. auth.users (Supabase 자동 관리)
- **역할**: 사용자 인증 정보만 저장
- **데이터**: 이메일, 비밀번호 해시, 이메일 확인 상태
- **접근**: Supabase Auth API를 통해서만

#### 2. user_profiles (우리가 만드는 테이블)
- **역할**: 사용자 프로필 정보 저장
- **데이터**: 이름, 아바타, 기타 프로필 정보
- **관계**: `id`가 `auth.users.id`를 참조

#### 3. clubs (클럽 정보)
- **역할**: 테니스 클럽 정보 저장
- **데이터**: 클럽 이름, 설명, 설정 등
- **관계**: `owner_id`가 `auth.users.id`를 참조

#### 4. club_members (사용자-클럽 관계)
- **역할**: 사용자가 어떤 클럽에 속해있는지, 어떤 역할인지 저장
- **데이터**: user_id, club_id, role (owner/admin/member)
- **관계**: `user_id`가 `auth.users.id`를 참조

#### 5. members (클럽별 회원 정보)
- **역할**: 각 클럽의 테니스 회원 정보 저장
- **데이터**: 이름, 전화번호, 실력 레벨 등
- **관계**: 
  - `club_id`로 클럽 참조
  - `user_id`로 로그인한 사용자 참조 (선택사항)

---

## 4. 인증 플로우

### 4.1 회원가입 플로우

```
사용자 입력
  ↓
[이메일, 비밀번호 입력]
  ↓
supabase.auth.signUp({
  email: 'user@example.com',
  password: 'password123'
})
  ↓
Supabase Auth가 처리:
  1. 비밀번호 해시화
  2. auth.users 테이블에 사용자 생성
  3. 이메일 확인 링크 발송 (설정 시)
  4. JWT 토큰 발급
  ↓
우리 앱에서 처리:
  1. user_profiles 테이블에 프로필 생성
  2. 첫 클럽 생성 또는 클럽 코드로 가입
```

### 4.2 로그인 플로우

```
사용자 입력
  ↓
[이메일, 비밀번호 입력]
  ↓
supabase.auth.signInWithPassword({
  email: 'user@example.com',
  password: 'password123'
})
  ↓
Supabase Auth가 처리:
  1. 비밀번호 검증
  2. JWT 토큰 발급
  3. 세션 생성
  ↓
우리 앱에서 처리:
  1. 현재 사용자 정보 가져오기: supabase.auth.getUser()
  2. 사용자가 속한 클럽 목록 조회
  3. 기본 클럽 선택 또는 클럽 선택 화면 표시
```

### 4.3 클럽별 데이터 접근 플로우

```
사용자가 클럽 선택
  ↓
현재 사용자 ID 확인: auth.uid()
  ↓
club_members 테이블에서 확인:
  - 이 사용자가 선택한 클럽에 속해있는지?
  - 어떤 역할인지? (owner/admin/member)
  ↓
RLS 정책으로 데이터 접근 제어:
  - members 테이블: club_id로 필터링
  - schedules 테이블: club_id로 필터링
  - 자신이 속한 클럽의 데이터만 접근 가능
```

---

## 5. 코드 예시

### 5.1 회원가입

```typescript
import { supabase } from './lib/supabase';

// 1. Supabase Auth로 사용자 생성
const { data: authData, error: authError } = await supabase.auth.signUp({
  email: 'user@example.com',
  password: 'password123',
});

if (authError) {
  console.error('회원가입 실패:', authError);
  return;
}

// 2. user_profiles 테이블에 프로필 생성
const { error: profileError } = await supabase
  .from('user_profiles')
  .insert({
    id: authData.user!.id, // auth.users.id와 동일
    email: authData.user!.email,
    full_name: '홍길동',
  });

if (profileError) {
  console.error('프로필 생성 실패:', profileError);
}
```

### 5.2 로그인

```typescript
import { supabase } from './lib/supabase';

const { data, error } = await supabase.auth.signInWithPassword({
  email: 'user@example.com',
  password: 'password123',
});

if (error) {
  console.error('로그인 실패:', error);
  return;
}

// 로그인 성공
console.log('로그인한 사용자:', data.user);
```

### 5.3 현재 사용자 확인

```typescript
import { supabase } from './lib/supabase';

// 현재 로그인한 사용자 가져오기
const { data: { user } } = await supabase.auth.getUser();

if (user) {
  console.log('현재 사용자 ID:', user.id);
  console.log('이메일:', user.email);
} else {
  console.log('로그인하지 않음');
}
```

### 5.4 클럽별 데이터 조회 (RLS 사용)

```typescript
import { supabase } from './lib/supabase';

// 현재 선택된 클럽의 회원 목록 조회
// RLS 정책이 자동으로 필터링해줌
const { data: members, error } = await supabase
  .from('members')
  .select('*')
  .eq('club_id', currentClubId); // 현재 선택된 클럽 ID

// RLS 정책이 자동으로:
// 1. auth.uid()로 현재 사용자 확인
// 2. club_members 테이블에서 이 사용자가 이 클럽에 속해있는지 확인
// 3. 속해있으면 데이터 반환, 아니면 빈 배열 반환
```

### 5.5 로그아웃

```typescript
import { supabase } from './lib/supabase';

const { error } = await supabase.auth.signOut();

if (error) {
  console.error('로그아웃 실패:', error);
} else {
  console.log('로그아웃 성공');
}
```

---

## 6. Row Level Security (RLS) 정책 예시

### 6.1 클럽 회원만 접근 가능한 정책

```sql
-- members 테이블: 클럽 회원만 조회 가능
CREATE POLICY "Club members can view members"
  ON members FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM club_members
      WHERE club_members.club_id = members.club_id
      AND club_members.user_id = auth.uid() -- 현재 로그인한 사용자
    )
  );

-- members 테이블: 관리자만 수정 가능
CREATE POLICY "Admins can update members"
  ON members FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM club_members
      WHERE club_members.club_id = members.club_id
      AND club_members.user_id = auth.uid()
      AND club_members.role IN ('owner', 'admin')
    )
  );
```

### 6.2 클럽 소유자만 클럽 수정 가능

```sql
-- clubs 테이블: 소유자만 수정 가능
CREATE POLICY "Owners can update their clubs"
  ON clubs FOR UPDATE
  USING (owner_id = auth.uid());
```

---

## 7. 주요 차이점 정리

### 기존 시스템 (단일 클럽)
```
members 테이블
  - name, phone, email, skill_level
  - 클럽 정보 없음 (하나의 클럽만 가정)
```

### 새로운 시스템 (멀티 클럽)
```
auth.users (Supabase 자동 관리)
  ↓
user_profiles (사용자 프로필)
  ↓
club_members (사용자-클럽 관계)
  ↓
clubs (클럽 정보)
  ↓
members (클럽별 회원 정보)
  - club_id 필수
  - user_id 선택 (로그인한 사용자인 경우)
```

---

## 8. 실제 사용 시나리오

### 시나리오 1: 새 사용자가 첫 클럽 생성

1. 회원가입: `supabase.auth.signUp()`
2. user_profiles 생성
3. 클럽 생성: `clubs` 테이블에 INSERT
4. club_members에 owner로 추가
5. members 테이블에 자신을 회원으로 추가

### 시나리오 2: 기존 사용자가 새 클럽 가입

1. 클럽 코드 입력
2. club_members에 member로 추가
3. members 테이블에 자신을 회원으로 추가 (선택)

### 시나리오 3: 여러 클럽 관리

1. 사용자가 클럽 선택
2. 선택한 클럽의 데이터만 조회 (RLS가 자동 필터링)
3. 다른 클럽으로 전환 시 해당 클럽의 데이터만 표시

---

## 9. 주의사항

### ✅ 해야 할 것
- `auth.users`는 Supabase가 관리하므로 직접 수정하지 않음
- `user_profiles`를 별도로 만들어 프로필 정보 저장
- 모든 클럽 관련 테이블에 `club_id` 추가
- RLS 정책으로 클럽별 데이터 격리

### ❌ 하지 말아야 할 것
- `auth.users` 테이블을 직접 쿼리하지 않음
- 비밀번호를 직접 저장하지 않음 (Supabase Auth가 처리)
- 클럽 ID 없이 데이터를 조회하지 않음

---

## 10. 다음 단계

1. **데이터베이스 스키마 작성**: 멀티 클럽 구조로 테이블 생성
2. **RLS 정책 설정**: 클럽별 데이터 격리
3. **인증 UI 구현**: 로그인/회원가입 페이지
4. **클럽 관리 UI**: 클럽 생성/선택/초대 기능

---

**참고 문서**:
- [Supabase Auth 공식 문서](https://supabase.com/docs/guides/auth)
- [Row Level Security 가이드](https://supabase.com/docs/guides/auth/row-level-security)


