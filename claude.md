# Claude Code 개발 가이드: 테니스 동아리 스케줄 관리 시스템

## 프로젝트 개요

이 프로젝트는 테니스 동아리의 매주 토요일 경기 스케줄을 자동으로 생성하고 관리하는 웹 애플리케이션입니다.

## 기술 스택

### Frontend
- **Framework**: React 19 + TypeScript
- **Build Tool**: Vite
- **Styling**: Tailwind CSS 3.x + shadcn/ui
- **UI Components**: shadcn/ui (Radix UI 기반)
- **Icons**: lucide-react
- **State Management**: React Context API (추후 필요시 Zustand)
- **HTTP Client**: Supabase Client SDK

### Backend (BaaS)
- **Platform**: Supabase
- **Database**: PostgreSQL (Supabase 관리)
- **API**: Supabase Auto-generated REST API
- **Authentication**: Supabase Auth (Phase 2)
- **Real-time**: Supabase Realtime (선택사항)

### Development Tools
- **Package Manager**: npm
- **Version Control**: Git
- **Code Quality**: ESLint, Prettier

## 프로젝트 구조

```
confidential-tennis/
├── frontend/              # React 프론트엔드 (메인 애플리케이션)
│   ├── src/
│   │   ├── components/   # 재사용 가능한 컴포넌트
│   │   │   └── ui/       # shadcn/ui 컴포넌트
│   │   ├── pages/        # 페이지 컴포넌트
│   │   ├── hooks/        # 커스텀 훅
│   │   ├── services/     # Supabase API 호출 함수
│   │   ├── lib/          # 라이브러리 설정 (supabase client 등)
│   │   ├── types/        # TypeScript 타입 정의
│   │   ├── utils/        # 유틸리티 함수
│   │   └── App.tsx       # 메인 앱 컴포넌트
│   ├── public/           # 정적 파일
│   ├── .env.example      # 환경 변수 예시
│   └── package.json
│
├── supabase/             # Supabase 관련 (선택사항)
│   ├── migrations/       # 데이터베이스 마이그레이션
│   └── functions/        # Edge Functions (필요시)
│
├── docs/                 # 문서
├── prd.md               # 프로젝트 요구사항 문서
└── CLAUDE.md            # 이 문서
```

## 개발 단계별 가이드

### Phase 1: MVP (4주)

#### Week 1: 회원 관리 + DB 설계
**목표**: 회원 CRUD 기능 구현 (Supabase)

**Supabase Tasks**:
```sql
-- Supabase Dashboard에서 테이블 생성
-- members 테이블 생성 및 RLS(Row Level Security) 설정
CREATE TABLE members (
  id BIGSERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  phone TEXT,
  email TEXT,
  skill_level TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

**Frontend Tasks**:
```typescript
// frontend/src/lib/supabase.ts
// Supabase 클라이언트 초기화

// frontend/src/services/memberService.ts
// Supabase API 호출 함수들
// - getAll(), getById(), create(), update(), delete()

// frontend/src/pages/MemberManagement.tsx
// 회원 목록, 추가, 수정, 삭제 UI (shadcn/ui 사용)

// frontend/src/components/MemberForm.tsx
// 회원 등록/수정 폼 컴포넌트
```

#### Week 2: 참석자 선택 UI
**목표**: 매주 참석자 선택 및 게스트 추가 기능

**Supabase Tasks**:
```sql
-- schedules 테이블 생성
CREATE TABLE schedules (
  id BIGSERIAL PRIMARY KEY,
  date DATE NOT NULL,
  start_time TIME,
  end_time TIME,
  status TEXT DEFAULT 'planned',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- attendances 테이블 생성
CREATE TABLE attendances (
  id BIGSERIAL PRIMARY KEY,
  schedule_id BIGINT REFERENCES schedules(id) ON DELETE CASCADE,
  member_id BIGINT REFERENCES members(id) ON DELETE SET NULL,
  guest_name TEXT,
  is_guest BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

**Frontend Tasks**:
```typescript
// frontend/src/services/scheduleService.ts
// Supabase를 통한 스케줄 생성 및 조회

// frontend/src/services/attendanceService.ts
// 참석자 등록 (벌크 insert)

// frontend/src/pages/ScheduleCreation.tsx
// 날짜 선택, 회원 체크박스, 게스트 추가

// frontend/src/components/AttendeeSelector.tsx
// 참석자 선택 컴포넌트

// frontend/src/components/GuestInput.tsx
// 게스트 추가 인풋
```

#### Week 3: 스케줄 생성 알고리즘
**목표**: 참석자 기반 6경기 자동 배정 로직

**Supabase Tasks**:
```sql
-- matches 테이블 생성
CREATE TABLE matches (
  id BIGSERIAL PRIMARY KEY,
  schedule_id BIGINT REFERENCES schedules(id) ON DELETE CASCADE,
  match_number INTEGER NOT NULL,
  court TEXT NOT NULL, -- 'A' or 'B'
  start_time TIME,
  player1_id BIGINT,
  player2_id BIGINT,
  player3_id BIGINT,
  player4_id BIGINT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

**Frontend Tasks**:
```typescript
// frontend/src/utils/scheduleGenerator.ts
/**
 * 스케줄 생성 알고리즘 핵심 로직 (클라이언트 사이드)
 *
 * 입력: 참석자 목록 (8-12명)
 * 출력: 6경기 배정 (각 경기당 4명, 2코트)
 *
 * 알고리즘 고려사항:
 * 1. 모든 참석자가 최대한 균등하게 경기 참여
 * 2. 연속된 경기 참여 최소화 (휴식 시간 보장)
 * 3. 제약조건 반영 (Phase 2에서 추가)
 */
function generateSchedule(attendees: Attendee[], constraints?: Constraint[]): Match[]

// frontend/src/services/matchService.ts
// 생성된 경기 데이터를 Supabase에 저장

// frontend/src/components/ScheduleGenerator.tsx
// "스케줄 생성" 버튼 및 로딩 상태

// frontend/src/pages/ScheduleView.tsx
// 생성된 스케줄 미리보기
```

#### Week 4: 스케줄 표시 및 저장
**목표**: 스케줄 UI 완성 및 DB 저장

**Frontend Tasks**:
```typescript
// frontend/src/components/MatchCard.tsx
// 개별 경기 카드 컴포넌트
// [경기 1] 10:00-10:30
// 코트 A: 홍길동, 김철수 vs 이영희, 박민수
// 코트 B: ...

// frontend/src/components/ScheduleTimeline.tsx
// 전체 6경기 타임라인 뷰

// frontend/src/pages/ScheduleView.tsx
// 저장, 수정, 공유 버튼
```

### Phase 2: 고급 기능 (2주)

#### Week 5: 제약조건 설정
**Supabase Tasks**:
```sql
-- constraints 테이블 생성
CREATE TABLE constraints (
  id BIGSERIAL PRIMARY KEY,
  schedule_id BIGINT REFERENCES schedules(id) ON DELETE CASCADE,
  constraint_type TEXT NOT NULL, -- 'exclude_last_match', 'partner_pair', 'exclude_match'
  member_id_1 BIGINT REFERENCES members(id) ON DELETE CASCADE,
  member_id_2 BIGINT REFERENCES members(id) ON DELETE SET NULL,
  match_number INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

**Frontend Tasks**:
```typescript
// frontend/src/services/constraintService.ts
// Supabase를 통한 제약조건 CRUD

// frontend/src/utils/scheduleGenerator.ts 업데이트
// 제약조건 반영 로직:
// 1. exclude_last_match: 특정 회원 6번째 경기 제외
// 2. partner_pair: 특정 두 명 항상 같은 팀
// 3. exclude_match: 특정 회원 특정 경기 제외

// frontend/src/components/ConstraintPanel.tsx
// 제약조건 설정 UI
// - 마지막 경기 제외 회원 선택
// - 파트너 페어 선택
// - 특정 경기 제외 설정
```

#### Week 6: 실시간 스케줄 수정
**Frontend Tasks**:
```typescript
// frontend/src/components/EditableMatchCard.tsx
// 드래그 앤 드롭으로 선수 교체
// React DnD 라이브러리 활용

// frontend/src/hooks/useScheduleEditor.ts
// 스케줄 편집 로직 훅
```

### Phase 3: 사용자 경험 개선 (2주)

#### Week 7: 기록 조회 및 통계
**Frontend Tasks**:
```typescript
// frontend/src/services/scheduleService.ts
// Supabase를 통한 월별 스케줄 조회 (.eq(), .gte(), .lte() 활용)

// frontend/src/services/memberService.ts
// 회원별 참석 통계 (Supabase aggregation 활용)

// frontend/src/pages/ScheduleHistory.tsx
// 캘린더 뷰로 과거 경기 조회

// frontend/src/components/MemberStats.tsx
// 회원별 참석률, 경기 횟수 등
```

#### Week 8: 모바일 최적화 및 공유
**Frontend Tasks**:
- Tailwind 반응형 클래스 적용
- 터치 제스처 지원
- 카카오톡 공유 API 연동

## 개발 시 중요 고려사항

### 1. 스케줄 생성 알고리즘

**핵심 로직 설계**:
```typescript
interface Attendee {
  id: number;
  name: string;
  isGuest: boolean;
}

interface Match {
  matchNumber: number; // 1-6
  court: 'A' | 'B';
  startTime: string;
  team1: [Attendee, Attendee];
  team2: [Attendee, Attendee];
}

function generateSchedule(attendees: Attendee[]): Match[] {
  // 1. 참석 인원에 따라 경기 배정
  //    - 8명: 각 경기 4명, 2명 대기
  //    - 10명: 각 경기 4명, 대기 순환
  //    - 12명: 각 경기 4명, 대기 순환

  // 2. 공평성 보장
  //    - 각 선수의 경기 횟수 추적
  //    - 휴식 시간 보장 (연속 경기 최소화)

  // 3. 무작위성 추가
  //    - 매번 다른 조합 생성

  return matches;
}
```

### 2. 데이터베이스 최적화 (Supabase)

**인덱스 설정** (Supabase Dashboard 또는 SQL Editor):
```sql
-- 날짜별 조회 최적화
CREATE INDEX idx_schedules_date ON schedules(date);

-- 스케줄별 참석자 조회 최적화
CREATE INDEX idx_attendances_schedule_id ON attendances(schedule_id);

-- 스케줄별 경기 조회 최적화
CREATE INDEX idx_matches_schedule_id ON matches(schedule_id);
```

**복합 작업 처리**:
```typescript
// Supabase는 자동으로 트랜잭션 관리
// 여러 테이블에 데이터를 삽입할 때는 순차적으로 처리
async function createScheduleWithMatches(scheduleData, matches) {
  // 1. 스케줄 생성
  const { data: schedule, error: scheduleError } = await supabase
    .from('schedules')
    .insert([scheduleData])
    .select()
    .single();

  if (scheduleError) throw scheduleError;

  // 2. 경기 데이터에 schedule_id 추가
  const matchesWithScheduleId = matches.map(match => ({
    ...match,
    schedule_id: schedule.id
  }));

  // 3. 벌크 삽입
  const { error: matchesError } = await supabase
    .from('matches')
    .insert(matchesWithScheduleId);

  if (matchesError) throw matchesError;

  return schedule;
}
```

### 3. 에러 처리

**Frontend (Supabase 에러 처리)**:
```typescript
// Supabase API 호출 시 에러 처리
async function getMember(id: number) {
  const { data, error } = await supabase
    .from('members')
    .select('*')
    .eq('id', id)
    .single();

  if (error) {
    console.error('Supabase error:', error);
    throw new Error(error.message);
  }

  return data;
}

// React 컴포넌트에서 에러 핸들링
try {
  const member = await getMember(123);
} catch (error) {
  toast.error('회원 정보를 불러오는데 실패했습니다.');
}

// 에러 바운더리 컴포넌트
// 전역 에러 처리
```

### 4. 성능 최적화

**Frontend**:
- React.memo로 불필요한 리렌더링 방지
- useMemo, useCallback 활용
- 이미지 최적화 (있는 경우)
- Supabase 쿼리 최적화 (필요한 컬럼만 select)

**Supabase**:
- 인덱스 활용으로 쿼리 속도 향상
- RLS(Row Level Security) 정책 최적화
- Supabase Realtime은 필요한 경우에만 사용
- 복잡한 조인 대신 여러 번의 간단한 쿼리 고려

## Supabase 데이터 접근 패턴

Supabase는 자동으로 REST API를 생성하므로, 클라이언트에서 직접 데이터베이스에 접근합니다.

### Members (frontend/src/services/memberService.ts)
```typescript
// 전체 회원 조회
supabase.from('members').select('*').eq('is_active', true)

// 특정 회원 조회
supabase.from('members').select('*').eq('id', id).single()

// 회원 등록
supabase.from('members').insert([memberData])

// 회원 수정
supabase.from('members').update(memberData).eq('id', id)

// 회원 삭제 (소프트 삭제)
supabase.from('members').update({ is_active: false }).eq('id', id)

// 회원 통계 (참석 횟수 등)
supabase.from('attendances').select('id').eq('member_id', id)
```

### Schedules (frontend/src/services/scheduleService.ts)
```typescript
// 스케줄 목록 (월별)
supabase.from('schedules').select('*')
  .gte('date', '2024-12-01')
  .lte('date', '2024-12-31')

// 특정 스케줄 조회 (참석자 포함)
supabase.from('schedules').select(`
  *,
  attendances (
    id,
    member_id,
    guest_name,
    is_guest,
    members (name)
  )
`).eq('id', scheduleId).single()

// 스케줄 생성
supabase.from('schedules').insert([scheduleData])

// 스케줄 수정
supabase.from('schedules').update(scheduleData).eq('id', id)

// 스케줄 삭제
supabase.from('schedules').delete().eq('id', id)
```

### Attendances (frontend/src/services/attendanceService.ts)
```typescript
// 참석자 등록 (벌크)
supabase.from('attendances').insert(attendancesData)

// 스케줄별 참석자 조회
supabase.from('attendances').select('*, members(*)').eq('schedule_id', scheduleId)

// 참석자 삭제
supabase.from('attendances').delete().eq('id', id)
```

### Matches (frontend/src/services/matchService.ts)
```typescript
// 경기 데이터 저장 (벌크)
supabase.from('matches').insert(matchesData)

// 스케줄별 경기 조회
supabase.from('matches').select('*').eq('schedule_id', scheduleId)

// 경기 수정
supabase.from('matches').update(matchData).eq('id', id)

// 경기 삭제
supabase.from('matches').delete().eq('id', id)
```

### Constraints (frontend/src/services/constraintService.ts)
```typescript
// 제약조건 추가
supabase.from('constraints').insert([constraintData])

// 스케줄별 제약조건 조회
supabase.from('constraints').select('*').eq('schedule_id', scheduleId)

// 제약조건 삭제
supabase.from('constraints').delete().eq('id', id)
```

## 테스트 시나리오

### 시나리오 1: 기본 스케줄 생성
1. 회원 8명 등록
2. 날짜 선택 (2024-12-07)
3. 8명 체크 선택
4. "스케줄 생성" 클릭
5. 6경기 자동 배정 확인
6. 저장

### 시나리오 2: 제약조건 적용
1. 참석자 10명 선택
2. "홍길동" 마지막 경기 제외 설정
3. "김철수-이영희" 파트너 지정
4. "스케줄 생성" 클릭
5. 제약조건 반영 확인

### 시나리오 3: 실시간 수정
1. 생성된 스케줄 열기
2. 경기 1의 "홍길동" 클릭
3. "박민수"로 교체
4. 변경사항 저장
5. 새로고침 후 변경사항 유지 확인

## 배포 가이드

### Supabase 프로젝트 설정
1. [Supabase Dashboard](https://supabase.com)에서 새 프로젝트 생성
2. SQL Editor에서 테이블 생성 스크립트 실행
3. RLS(Row Level Security) 정책 설정 (필요시)
4. API URL 및 anon key 확인

### Frontend 환경 변수 설정
```bash
# frontend/.env
VITE_SUPABASE_URL=your-supabase-url
VITE_SUPABASE_ANON_KEY=your-supabase-anon-key
```

### Frontend (Vercel)
```bash
cd frontend
npm run build
vercel deploy --prod
```

Vercel 대시보드에서 환경 변수 설정:
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`

## 트러블슈팅

### 자주 발생하는 문제

1. **Supabase 연결 실패**
   - .env 파일의 `VITE_SUPABASE_URL` 및 `VITE_SUPABASE_ANON_KEY` 확인
   - Supabase 프로젝트가 활성화되어 있는지 확인
   - 브라우저 콘솔에서 네트워크 요청 확인

2. **RLS(Row Level Security) 정책 오류**
   - Supabase Dashboard에서 테이블의 RLS 정책 확인
   - 개발 중에는 RLS를 비활성화하거나 모든 접근 허용 정책 설정
   - 프로덕션에서는 적절한 RLS 정책 적용

3. **타입 에러**
   - Supabase에서 생성된 타입 정의 파일 확인 (`database.types.ts`)
   - TypeScript 타입 정의 파일 확인
   - npm run build로 타입 체크

4. **CORS 에러**
   - Supabase는 기본적으로 CORS를 허용하지만, 문제가 있다면 Supabase Dashboard의 API 설정 확인

## 추후 개발 아이디어

- 회원 자체 참석 신청 기능
- 푸시 알림 (PWA)
- 경기 결과 기록 및 통계
- 동아리 랭킹 시스템
- 날씨 API 연동
- 경기장 예약 연동

## 참고 자료

- [Supabase 공식 문서](https://supabase.com/docs)
- [Supabase JavaScript Client](https://supabase.com/docs/reference/javascript/introduction)
- [React 공식 문서](https://react.dev/)
- [Tailwind CSS 문서](https://tailwindcss.com/docs)
- [shadcn/ui 문서](https://ui.shadcn.com/)
- [lucide-react 아이콘](https://lucide.dev/)

---

**문서 작성일**: 2024-12-03
**최종 수정일**: 2024-12-04
**작성자**: Claude Code Assistant
