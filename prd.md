# PRD: 테니스 동아리 경기 스케줄 관리 시스템 (멀티 클럽 지원)

## 1. 프로젝트 개요

### 1.1 배경 및 목적
테니스 동아리를 운영하면서 매주 토요일 정기 경기의 복식 스케줄을 수동으로 작성하고 관리하는 것은 시간이 많이 소요되고 실수가 발생하기 쉽습니다. 본 시스템은 **여러 테니스 동아리를 지원**하며, 각 동아리별로 참석 인원 관리, 자동 스케줄 생성, 실시간 변경사항 반영을 통해 동아리 운영의 효율성을 높이고자 합니다.

### 1.2 목표
- **멀티 클럽 지원**: 여러 테니스 동아리를 하나의 플랫폼에서 관리
- 매주 토요일 경기 스케줄을 효율적으로 생성 및 관리
- 동아리원들의 참석 여부를 손쉽게 파악
- 경기 당일 실시간 스케줄 변경 지원
- 과거 경기 기록 보관 및 조회
- 클럽별 독립적인 데이터 관리 및 권한 분리

### 1.3 타겟 유저
- **Primary**: 동아리 운영자 (관리자) - 여러 동아리를 운영하거나 하나의 동아리를 관리
- **Secondary**: 동아리 회원들 - 자신이 속한 동아리의 스케줄 확인
- **Tertiary**: 여러 동아리에 속한 회원들 - 각 동아리별 스케줄 관리

---

## 2. 핵심 기능 요구사항

### 2.0 클럽 관리 (신규 추가)
**Priority: P0 (필수)**

#### 기능 설명
- 여러 테니스 동아리를 생성하고 관리
- 사용자는 여러 클럽에 가입 가능
- 클럽별 독립적인 회원, 스케줄, 기록 관리

#### 세부 요구사항
- **클럽 생성**:
  - 클럽 이름, 설명, 로고 이미지 (선택)
  - 클럽 코드 생성 (초대용)
  - 클럽 설정 (기본 경기 시간, 코트 수 등)
- **클럽 선택/전환**:
  - 사용자가 속한 클럽 목록 표시
  - 클럽 선택 시 해당 클럽의 데이터만 표시
  - 헤더에 현재 선택된 클럽 표시
- **클럽 초대**:
  - 클럽 코드로 회원 초대
  - 이메일/링크로 초대장 발송
- **클럽 설정**:
  - 클럽 정보 수정
  - 관리자 권한 부여/해제
  - 클럽 삭제 (관리자만)

---

### 2.1 사용자 인증 및 권한 관리 (신규 추가)
**Priority: P0 (필수)**

#### 기능 설명
- Supabase Auth를 통한 사용자 인증
- 클럽별 역할 및 권한 관리

#### 세부 요구사항
- **회원가입/로그인**:
  - 이메일/비밀번호 인증
  - 소셜 로그인 (구글, 카카오 - 선택사항)
- **클럽별 역할**:
  - **소유자 (Owner)**: 클럽 생성자, 모든 권한
  - **관리자 (Admin)**: 회원 관리, 스케줄 생성/수정
  - **회원 (Member)**: 스케줄 조회, 자신의 참석 신청
- **권한 분리**:
  - 클럽별 데이터 격리 (RLS 정책)
  - 자신이 속한 클럽의 데이터만 접근 가능

---

### 2.2 동아리원 관리
**Priority: P0 (필수)**

#### 기능 설명
- **클럽별** 동아리 정회원 명단 관리
- 회원별 프로필 정보 (이름, 연락처, 레벨, 성별 등)

#### 세부 요구사항
- 회원 등록/수정/삭제 기능 (관리자만)
- 회원 목록 조회 (클럽별 필터링)
- 회원별 참석 이력 확인
- 회원이 여러 클럽에 속한 경우, 각 클럽별로 독립적인 정보 관리
- **성별 정보 관리**:
  - 회원 등록 시 성별 선택 (남/여)
  - 가입 시에는 성별 정보 불필요 (추후 관리자가 추가)
  - 성별 정보는 경기 타입 설정 시 활용

---

### 2.3 주간 참석 관리
**Priority: P0 (필수)**

#### 기능 설명
매주 토요일 경기에 대한 참석/불참 관리 (클럽별)

#### 세부 요구사항
- **참석자 선택**: 
  - 해당 클럽의 동아리원 목록에서 체크박스로 참석자 선택
  - 참석 인원수 실시간 표시
- **게스트 추가**:
  - 임시 게스트 이름 입력 및 추가
  - 게스트는 해당 주차에만 유효
- **참석 현황 저장**: 날짜별로 참석 정보 저장 (클럽별)

---

### 2.4 경기 스케줄 자동 생성
**Priority: P0 (필수)**

#### 기능 설명
참석 인원을 기반으로 6경기 복식 스케줄 자동 생성 (클럽별)

#### 세부 요구사항

**경기 타입 설정**:
- **혼복 (Mixed)**: 남녀 혼합 경기 (기본값)
- **남복 (Men's Doubles)**: 남자만 참여하는 경기
- **여복 (Women's Doubles)**: 여자만 참여하는 경기
- 경기 타입에 따라 참석자 필터링 및 배정 로직 적용

**기본 스케줄 생성 로직**:
- 총 6경기 (각 경기당 4명: 2 vs 2)
- 2개 코트 동시 진행
- 참석 인원에 따라 경기 배정 최적화
- 가능한 한 모든 참석자가 고르게 경기에 참여
- **경기 타입별 배정 규칙**:
  - **혼복**: 성별 제한 없음, 모든 참석자 배정 가능
  - **남복**: 남자 회원만 배정, 여자 회원은 제외
  - **여복**: 여자 회원만 배정, 남자 회원은 제외
- **성별 정보 활용**:
  - 회원 등록 시 성별 정보 입력 (가입 시 불필요, 추후 관리자가 추가)
  - 경기 타입에 따라 자동으로 적합한 참석자만 필터링
  - 게스트는 성별 정보 없이 추가 가능 (혼복 경기에서만 배정)

**제약조건 설정 기능** (Priority: P1):
- ✅ **특정 회원 마지막 경기 제외**: 
  - 조기 퇴장이 필요한 회원 선택
  - 해당 회원은 마지막(6번째) 경기에 배정되지 않음
- ✅ **파트너 지정**:
  - 특정 두 명을 같은 팀으로 고정
  - 선택한 페어는 모든 경기에서 함께 팀 구성
- ✅ **특정 경기 제외**:
  - 특정 회원이 특정 경기 번호에 참여하지 않도록 설정

**스케줄 생성 UI**:
- "스케줄 자동 생성" 버튼
- 생성 전 제약조건 설정 모달/패널
- 생성 후 결과 미리보기

---

### 2.5 경기 스케줄 표시
**Priority: P0 (필수)**

#### 기능 설명
생성된 경기 스케줄을 명확하게 표시 (클럽별)

#### 세부 요구사항

**스케줄 뷰 구성**:
```
[클럽명] 테니스 동아리
[경기 1] 10:00-10:30
코트 A: 홍길동, 김철수 vs 이영희, 박민수
코트 B: 정다은, 최민지 vs 강호동, 유재석

[경기 2] 10:30-11:00
...
```

- 각 경기별 시간 표시 (30분 단위)
- 코트별 팀 구성 명확히 표시
- 현재 진행 중인 경기 하이라이트
- 대기 중인 선수 표시

---

### 2.6 실시간 스케줄 수정
**Priority: P0 (필수)**

#### 기능 설명
경기 당일 갑작스러운 인원 변동에 대응 (클럽별)

#### 세부 요구사항

**수정 가능 항목**:
- 개별 경기의 선수 교체
  - 드래그 앤 드롭으로 선수 위치 변경
  - 또는 선수 클릭 → 다른 선수 선택으로 교체
- 급한 불참자 처리
  - 불참자 제외 후 나머지 인원으로 재배정
  - 또는 대기 인원/게스트로 교체

**수정 UI**:
- 각 선수 카드에 편집 버튼
- 변경사항 즉시 반영
- 변경 이력 기록 (선택사항 - P2)

---

### 2.7 경기 기록 관리
**Priority: P0 (필수)**

#### 기능 설명
매주 경기 스케줄을 저장하고 조회 (클럽별)

#### 세부 요구사항
- **저장**: 
  - 날짜별 스케줄 자동 저장
  - 참석자 명단 포함
- **조회**:
  - 캘린더 뷰로 과거 경기 날짜 선택
  - 선택한 날짜의 스케줄 상세 보기
  - 월별/연도별 경기 이력 확인
  - 클럽별로 독립적인 기록 관리

---

## 3. 사용자 스토리

### 3.0 클럽 관리자 (신규)

**US-0-1: 클럽 생성**
```
As a 테니스 동아리 운영자
I want to 새로운 클럽을 생성하고 싶다
So that 우리 동아리의 스케줄을 독립적으로 관리할 수 있다
```

**수락 기준**:
- [ ] 클럽 이름, 설명을 입력하여 클럽을 생성할 수 있다
- [ ] 클럽 코드가 자동으로 생성된다
- [ ] 생성한 클럽이 내 클럽 목록에 표시된다
- [ ] 생성한 클럽으로 즉시 전환된다

---

**US-0-2: 클럽 초대**
```
As a 클럽 관리자
I want to 클럽 코드로 회원을 초대하고 싶다
So that 동아리원들이 쉽게 가입할 수 있다
```

**수락 기준**:
- [ ] 클럽 코드를 복사하여 공유할 수 있다
- [ ] 클럽 코드로 가입한 회원이 자동으로 클럽에 추가된다
- [ ] 초대 링크를 생성하여 공유할 수 있다

---

**US-0-3: 클럽 전환**
```
As a 여러 클럽에 속한 사용자
I want to 클럽을 쉽게 전환하고 싶다
So that 각 클럽의 스케줄을 독립적으로 관리할 수 있다
```

**수락 기준**:
- [ ] 헤더에서 현재 클럽을 확인할 수 있다
- [ ] 클럽 선택 드롭다운으로 다른 클럽으로 전환할 수 있다
- [ ] 클럽 전환 시 해당 클럽의 데이터만 표시된다

---

### 3.1 관리자 (동아리 운영자)

**US-1: 주간 스케줄 준비**
```
As a 동아리 운영자
I want to 매주 참석자를 선택하고 스케줄을 자동 생성하고 싶다
So that 수동으로 배정하는 시간을 줄이고 공평한 경기 배정을 할 수 있다
```

**수락 기준**:
- [ ] 현재 선택된 클럽의 동아리원 목록에서 참석자를 선택할 수 있다
- [ ] 게스트를 추가할 수 있다
- [ ] 제약조건(마지막 경기 제외, 파트너 지정)을 설정할 수 있다
- [ ] "스케줄 생성" 버튼 클릭으로 6경기 스케줄이 자동 생성된다
- [ ] 생성된 스케줄이 명확하게 표시된다

---

**US-2: 경기 당일 스케줄 변경**
```
As a 동아리 운영자
I want to 경기 당일 갑작스러운 인원 변동을 즉시 반영하고 싶다
So that 경기가 원활하게 진행될 수 있다
```

**수락 기준**:
- [ ] 개별 경기의 선수를 쉽게 교체할 수 있다
- [ ] 변경사항이 즉시 화면에 반영된다
- [ ] 변경된 스케줄이 저장된다

---

**US-3: 과거 경기 기록 조회**
```
As a 동아리 운영자
I want to 지난 주차들의 경기 스케줄을 확인하고 싶다
So that 누가 얼마나 참석했는지, 어떤 조합으로 경기했는지 참고할 수 있다
```

**수락 기준**:
- [ ] 현재 선택된 클럽의 캘린더에서 날짜를 선택할 수 있다
- [ ] 선택한 날짜의 스케줄이 표시된다
- [ ] 참석자 명단을 확인할 수 있다

---

### 3.2 동아리 회원

**US-4: 경기 스케줄 확인**
```
As a 동아리 회원
I want to 이번 주 토요일 내 경기 일정을 확인하고 싶다
So that 언제 어느 코트에서 누구와 경기하는지 알 수 있다
```

**수락 기준**:
- [ ] 로그인 후 자신이 속한 클럽의 스케줄을 볼 수 있다
- [ ] 내 이름이 포함된 경기가 강조 표시된다
- [ ] 각 경기의 시간과 코트 정보가 명확하다

---

**US-5: 여러 클럽 관리**
```
As a 여러 동아리에 속한 회원
I want to 각 클럽의 스케줄을 독립적으로 확인하고 싶다
So that 혼동 없이 각 동아리의 일정을 관리할 수 있다
```

**수락 기준**:
- [ ] 내가 속한 모든 클럽 목록을 확인할 수 있다
- [ ] 클럽을 선택하면 해당 클럽의 데이터만 표시된다
- [ ] 각 클럽의 회원 정보와 스케줄이 독립적으로 관리된다

---

## 4. 화면 구성 (Wireframe 개념)

### 4.0 클럽 선택 화면 (신규)
```
┌─────────────────────────────────────────┐
│  테니스 동아리 스케줄 관리              │
├─────────────────────────────────────────┤
│  [홍길동님] ▼                           │
│  현재 클럽: 서울 테니스 클럽             │
│                                          │
│  내 클럽 목록:                           │
│  • 서울 테니스 클럽 (관리자)             │
│  • 부산 테니스 동아리 (회원)             │
│                                          │
│  [+ 새 클럽 만들기]                      │
│  [클럽 코드로 가입하기]                  │
└─────────────────────────────────────────┘
```

### 4.1 메인 대시보드
```
┌─────────────────────────────────────────┐
│  [서울 테니스 클럽] ▼                   │
│  [회원 관리] [새 스케줄] [기록 보기]   │
├─────────────────────────────────────────┤
│                                          │
│  📅 2024년 12월 7일 토요일              │
│                                          │
│  ▼ 경기 타입 선택                        │
│  ○ 혼복  ○ 남복  ○ 여복                │
│                                          │
│  ▼ 참석자 선택 (8명)                    │
│  ☑ 홍길동(남)  ☑ 김철수(남)  ☑ 이영희(여)│
│  ☑ 박민수(남)  ☑ 정다은(여)  ☐ 최민지(여)│
│                                          │
│  [+ 게스트 추가]                         │
│                                          │
│  ▼ 제약조건 설정                         │
│  • 마지막 경기 제외: [홍길동 선택]      │
│  • 파트너 지정: [김철수-이영희]         │
│                                          │
│  [스케줄 자동 생성]                      │
│                                          │
└─────────────────────────────────────────┘
```

### 4.2 스케줄 뷰
```
┌─────────────────────────────────────────┐
│  [서울 테니스 클럽]                     │
│  2024년 12월 7일 경기 스케줄            │
├─────────────────────────────────────────┤
│                                          │
│  [경기 1] 10:00-10:30                   │
│  ┌──────────┐  ┌──────────┐            │
│  │ 코트 A   │  │ 코트 B   │            │
│  │ 홍길동    │  │ 정다은    │            │
│  │ 김철수    │  │ 최민지    │            │
│  │   vs     │  │   vs     │            │
│  │ 이영희    │  │ 강호동    │            │
│  │ 박민수    │  │ 유재석    │            │
│  └─[편집]───┘  └─[편집]───┘            │
│                                          │
│  [경기 2] 10:30-11:00                   │
│  ...                                     │
│                                          │
│  [저장] [수정] [공유]                    │
└─────────────────────────────────────────┘
```

### 4.3 기록 보기
```
┌─────────────────────────────────────────┐
│  [서울 테니스 클럽]                     │
│  경기 기록                               │
├─────────────────────────────────────────┤
│                                          │
│  📅 [2024년 12월]                       │
│                                          │
│  • 12/07 토요일 - 참석 8명               │
│  • 11/30 토요일 - 참석 10명              │
│  • 11/23 토요일 - 참석 7명               │
│                                          │
│  [날짜 선택하여 상세보기]                │
│                                          │
└─────────────────────────────────────────┘
```

---

## 5. 기술 요구사항

### 5.1 시스템 아키텍처
- **Frontend**: 반응형 웹 (모바일 최적화)
- **Backend**: Supabase (BaaS - Backend as a Service)
- **Database**: PostgreSQL (Supabase 관리)
- **Authentication**: Supabase Auth (필수)

### 5.2 주요 기술 스택
**Frontend**:
- React 18 + TypeScript
- Vite (빌드 도구)
- Tailwind CSS 3.x (스타일링)
- shadcn/ui (UI 컴포넌트 라이브러리)
- lucide-react (아이콘)
- @dnd-kit (드래그 앤 드롭)

**Backend (BaaS)**:
- Supabase
  - PostgreSQL 데이터베이스
  - 자동 생성된 REST API
  - **Supabase Auth (인증 - 필수)**
  - Row Level Security (RLS) 정책으로 클럽별 데이터 격리
  - Supabase Realtime (선택사항)

**Deployment**:
- Vercel (Frontend)
- Supabase Cloud (Backend & Database)

### 5.3 성능 요구사항
- 스케줄 생성 시간: 3초 이내
- 페이지 로딩: 2초 이내
- 실시간 수정 반영: 1초 이내
- 클럽 전환 시간: 1초 이내

---

## 6. 데이터 모델 (Supabase PostgreSQL)

### 6.1 주요 엔티티

**Users (사용자) - Supabase Auth**
- Supabase Auth의 `auth.users` 테이블 사용
- 추가 프로필 정보는 `user_profiles` 테이블에 저장

**User Profiles (사용자 프로필)**
```sql
CREATE TABLE user_profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT,
  full_name TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

**Clubs (클럽)**
```sql
CREATE TABLE clubs (
  id BIGSERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  code TEXT UNIQUE NOT NULL, -- 초대 코드
  logo_url TEXT,
  owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  settings JSONB DEFAULT '{}', -- 클럽별 설정 (기본 경기 시간, 코트 수 등)
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_clubs_code ON clubs(code);
CREATE INDEX idx_clubs_owner_id ON clubs(owner_id);
```

**Club Members (클럽 회원 관계)**
```sql
CREATE TABLE club_members (
  id BIGSERIAL PRIMARY KEY,
  club_id BIGINT NOT NULL REFERENCES clubs(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'member' CHECK (role IN ('owner', 'admin', 'member')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(club_id, user_id)
);

CREATE INDEX idx_club_members_club_id ON club_members(club_id);
CREATE INDEX idx_club_members_user_id ON club_members(user_id);
```

**Members (회원) - 클럽별 회원 정보**
```sql
CREATE TABLE members (
  id BIGSERIAL PRIMARY KEY,
  club_id BIGINT NOT NULL REFERENCES clubs(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL, -- 로그인한 사용자인 경우
  name TEXT NOT NULL,
  phone TEXT,
  email TEXT,
  skill_level TEXT CHECK (skill_level IN ('beginner', 'intermediate', 'advanced')),
  gender TEXT CHECK (gender IN ('male', 'female')), -- 성별 (남/여)
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

CREATE INDEX idx_members_club_id ON members(club_id);
CREATE INDEX idx_members_user_id ON members(user_id);
```

**Schedules (스케줄)**
```sql
CREATE TABLE schedules (
  id BIGSERIAL PRIMARY KEY,
  club_id BIGINT NOT NULL REFERENCES clubs(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  start_time TIME,
  end_time TIME,
  match_type TEXT DEFAULT 'mixed' CHECK (match_type IN ('mixed', 'mens', 'womens')), -- 경기 타입: 혼복/남복/여복
  status TEXT DEFAULT 'planned',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(club_id, date) -- 클럽별로 같은 날짜에 하나의 스케줄만
);
```

CREATE INDEX idx_schedules_club_id ON schedules(club_id);
CREATE INDEX idx_schedules_date ON schedules(date);
CREATE INDEX idx_schedules_club_date ON schedules(club_id, date);
```

**Attendances (참석)**
```sql
CREATE TABLE attendances (
  id BIGSERIAL PRIMARY KEY,
  schedule_id BIGINT NOT NULL REFERENCES schedules(id) ON DELETE CASCADE,
  member_id BIGINT REFERENCES members(id) ON DELETE SET NULL,
  guest_name TEXT,
  is_guest BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_attendances_schedule_id ON attendances(schedule_id);
CREATE INDEX idx_attendances_member_id ON attendances(member_id);
```

**Matches (경기)**
```sql
CREATE TABLE matches (
  id BIGSERIAL PRIMARY KEY,
  schedule_id BIGINT NOT NULL REFERENCES schedules(id) ON DELETE CASCADE,
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

CREATE INDEX idx_matches_schedule_id ON matches(schedule_id);
```

**Constraints (제약조건)**
```sql
CREATE TABLE constraints (
  id BIGSERIAL PRIMARY KEY,
  schedule_id BIGINT NOT NULL REFERENCES schedules(id) ON DELETE CASCADE,
  constraint_type TEXT NOT NULL,
  member_id_1 BIGINT REFERENCES members(id) ON DELETE CASCADE,
  member_id_2 BIGINT REFERENCES members(id) ON DELETE SET NULL,
  match_number INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_constraints_schedule_id ON constraints(schedule_id);
```

### 6.2 Row Level Security (RLS) 정책

**클럽별 데이터 격리**:
```sql
-- Clubs: 소유자만 수정 가능, 회원은 조회만
CREATE POLICY "Users can view clubs they belong to"
  ON clubs FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM club_members
      WHERE club_members.club_id = clubs.id
      AND club_members.user_id = auth.uid()
    )
  );

CREATE POLICY "Owners can update their clubs"
  ON clubs FOR UPDATE
  USING (owner_id = auth.uid());

-- Members: 클럽 회원만 접근 가능
CREATE POLICY "Club members can manage members"
  ON members FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM club_members
      WHERE club_members.club_id = members.club_id
      AND club_members.user_id = auth.uid()
    )
  );

-- Schedules: 클럽 회원만 접근 가능
CREATE POLICY "Club members can manage schedules"
  ON schedules FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM club_members
      WHERE club_members.club_id = schedules.club_id
      AND club_members.user_id = auth.uid()
    )
  );
```

---

## 7. 개발 우선순위

### Phase 0: 멀티 클럽 기반 구축 (신규 - 2주)
- [ ] Supabase Auth 설정
- [ ] 클럽 테이블 및 관계 테이블 생성
- [ ] RLS 정책 설정
- [ ] 클럽 생성/선택 UI
- [ ] 클럽 초대 기능

### Phase 1 (MVP - 4주)
- [ ] 회원 관리 (CRUD) - 클럽별
- [ ] 참석자 선택 UI - 클럽별
- [ ] 기본 스케줄 자동 생성 알고리즘
- [ ] 스케줄 표시 화면 - 클럽별
- [ ] 스케줄 저장 및 조회 - 클럽별

### Phase 2 (2주)
- [ ] 제약조건 설정 기능
- [ ] 게스트 추가 기능
- [ ] 실시간 스케줄 수정 (드래그 앤 드롭)

### Phase 3 (2주)
- [ ] 캘린더 뷰로 기록 조회
- [ ] 회원별 참석 통계
- [ ] 모바일 최적화
- [ ] 공유 기능 (카카오톡/링크)

### Phase 4 (선택 - 추후 개발)
- [ ] 회원 자체 참석 신청 기능
- [ ] 푸시 알림
- [ ] 경기 결과 기록
- [ ] 동아리 랭킹 시스템

---

## 8. 비기능적 요구사항

### 8.1 사용성
- 모바일 환경에서 한 손으로 조작 가능
- 3번의 클릭 이내에 모든 주요 기능 접근
- 직관적인 UI (설명 없이 사용 가능)
- 클럽 전환이 쉬워야 함

### 8.2 보안
- Supabase Auth를 통한 사용자 인증
- 클럽별 데이터 격리 (RLS 정책)
- 관리자와 회원 권한 분리
- 개인정보 암호화 저장
- 클럽 코드는 충분히 복잡하게 생성 (UUID 기반)

### 8.3 확장성
- 여러 동아리를 운영할 수 있도록 설계됨
- 다른 요일/시간대 추가 가능
- 클럽별 독립적인 설정 가능

---

## 9. 성공 지표

### 9.1 정량적 지표
- 스케줄 생성 시간 50% 단축
- 경기 당일 변경 시간 70% 단축
- 회원들의 스케줄 확인율 80% 이상
- 클럽 전환 시간 1초 이내

### 9.2 정성적 지표
- 운영자의 관리 편의성 만족도
- 회원들의 정보 접근성 만족도
- 경기 진행의 원활함
- 여러 클럽 관리의 편의성

---

## 10. 리스크 및 고려사항

### 10.1 기술적 리스크
- **스케줄 알고리즘 복잡도**: 제약조건이 많을 경우 최적 배정이 어려울 수 있음
  - **완화방안**: 단계적으로 제약조건 추가, 수동 조정 기능 제공
- **RLS 정책 복잡도**: 클럽별 데이터 격리 정책이 복잡할 수 있음
  - **완화방안**: 단계적으로 정책 추가, 충분한 테스트

### 10.2 사용자 리스크
- **동아리원의 디지털 리터러시**: 일부 회원이 시스템 사용에 어려움을 느낄 수 있음
  - **완화방안**: 최대한 단순한 UI, 카카오톡 공유 기능으로 접근성 향상
- **클럽 코드 관리**: 클럽 코드를 잃어버릴 수 있음
  - **완화방안**: 클럽 관리자에게 코드 재생성 기능 제공

### 10.3 운영 리스크
- **인터넷 연결 불안정**: 실외 테니스장에서 네트워크 문제 발생 가능
  - **완화방안**: 오프라인 모드 지원 (PWA)
- **클럽 데이터 혼동**: 여러 클럽을 관리할 때 실수로 다른 클럽의 데이터를 수정할 수 있음
  - **완화방안**: 명확한 클럽 표시, 확인 다이얼로그

---

## 11. 다음 단계

1. **PRD 리뷰 및 피드백** (1주)
   - 동아리 운영자와 주요 회원들의 의견 수렴
   - 요구사항 우선순위 재조정

2. **기술 스택 확정 및 환경 설정** (1주)
   - 개발 환경 구축
   - Supabase Auth 설정
   - Git 저장소 설정

3. **Phase 0 개발 시작** (2주)
   - 멀티 클럽 기반 구축
   - 인증 시스템 구현
   - 클럽 관리 기능

4. **Phase 1 개발 시작** (4주)
   - 스프린트 1: 회원 관리 + DB 설계
   - 스프린트 2: 스케줄 생성 알고리즘
   - 스프린트 3: UI 구현
   - 스프린트 4: 통합 테스트

---

## 부록

### A. 용어 정의
- **클럽**: 하나의 테니스 동아리 단위
- **정회원**: 클럽에 정식으로 등록된 회원
- **게스트**: 일회성으로 참여하는 외부 인원
- **제약조건**: 스케줄 생성 시 반영되어야 하는 특별 요구사항
- **복식**: 2명 vs 2명으로 진행되는 테니스 경기 형식
- **클럽 코드**: 클럽 초대를 위한 고유 코드
- **혼복 (Mixed Doubles)**: 남녀 혼합 복식 경기
- **남복 (Men's Doubles)**: 남자만 참여하는 복식 경기
- **여복 (Women's Doubles)**: 여자만 참여하는 복식 경기
- **혼복 (Mixed Doubles)**: 남녀 혼합 복식 경기
- **남복 (Men's Doubles)**: 남자만 참여하는 복식 경기
- **여복 (Women's Doubles)**: 여자만 참여하는 복식 경기

### B. 참고 자료
- 테니스 복식 룰 및 경기 시간 가이드
- 유사 스케줄 관리 앱 벤치마킹 (Doodle, 배드민턴 스케줄러 등)
- Supabase Auth 문서
- Supabase RLS 정책 가이드

---

**문서 버전**: v2.0 (멀티 클럽 지원)  
**작성일**: 2024-12-03  
**최종 수정일**: 2024-12-04  
**작성자**: PM  
**검토 필요**: 동아리 운영자 피드백
