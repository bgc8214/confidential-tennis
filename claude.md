# Claude Code 개발 가이드: 테니스 동아리 스케줄 관리 시스템

## 프로젝트 개요

이 프로젝트는 테니스 동아리의 매주 토요일 경기 스케줄을 자동으로 생성하고 관리하는 웹 애플리케이션입니다.

## 기술 스택

### Frontend
- **Framework**: React 18 + TypeScript
- **Build Tool**: Vite
- **Styling**: Tailwind CSS
- **State Management**: React Context API (추후 필요시 Zustand)
- **HTTP Client**: Axios

### Backend
- **Runtime**: Node.js
- **Framework**: Express.js + TypeScript
- **Database**: PostgreSQL
- **ORM**: pg (node-postgres)
- **Authentication**: JWT (Phase 2)

### Development Tools
- **Package Manager**: npm
- **Version Control**: Git
- **Code Quality**: ESLint, Prettier

## 프로젝트 구조

```
confidential-tennis/
├── frontend/              # React 프론트엔드
│   ├── src/
│   │   ├── components/   # 재사용 가능한 컴포넌트
│   │   ├── pages/        # 페이지 컴포넌트
│   │   ├── hooks/        # 커스텀 훅
│   │   ├── services/     # API 호출 함수
│   │   ├── types/        # TypeScript 타입 정의
│   │   ├── utils/        # 유틸리티 함수
│   │   └── App.tsx       # 메인 앱 컴포넌트
│   ├── public/           # 정적 파일
│   └── package.json
│
├── backend/              # Express 백엔드
│   ├── src/
│   │   ├── config/       # 설정 파일
│   │   ├── controllers/  # 라우트 핸들러
│   │   ├── models/       # 데이터베이스 모델
│   │   ├── routes/       # API 라우트
│   │   ├── services/     # 비즈니스 로직
│   │   ├── types/        # TypeScript 타입
│   │   ├── utils/        # 유틸리티 함수
│   │   └── index.ts      # 서버 엔트리포인트
│   ├── .env.example      # 환경 변수 예시
│   └── package.json
│
├── database/             # 데이터베이스 관련
│   ├── schema.sql        # 데이터베이스 스키마
│   └── README.md         # DB 설정 가이드
│
├── docs/                 # 문서
├── prd.md               # 프로젝트 요구사항 문서
└── claude.md            # 이 문서
```

## 개발 단계별 가이드

### Phase 1: MVP (4주)

#### Week 1: 회원 관리 + DB 설계
**목표**: 회원 CRUD API 및 UI 구현

**Backend Tasks**:
```typescript
// backend/src/models/member.ts
// Member 모델 정의 및 CRUD 함수

// backend/src/controllers/memberController.ts
// GET /api/members - 전체 회원 조회
// GET /api/members/:id - 특정 회원 조회
// POST /api/members - 회원 등록
// PUT /api/members/:id - 회원 수정
// DELETE /api/members/:id - 회원 삭제
```

**Frontend Tasks**:
```typescript
// frontend/src/pages/MemberManagement.tsx
// 회원 목록, 추가, 수정, 삭제 UI

// frontend/src/components/MemberForm.tsx
// 회원 등록/수정 폼 컴포넌트

// frontend/src/services/memberService.ts
// API 호출 함수들
```

#### Week 2: 참석자 선택 UI
**목표**: 매주 참석자 선택 및 게스트 추가 기능

**Backend Tasks**:
```typescript
// backend/src/controllers/scheduleController.ts
// POST /api/schedules - 스케줄 생성
// GET /api/schedules/:date - 특정 날짜 스케줄 조회

// backend/src/controllers/attendanceController.ts
// POST /api/attendances - 참석자 등록 (벌크)
// GET /api/attendances/:scheduleId - 특정 스케줄 참석자 조회
```

**Frontend Tasks**:
```typescript
// frontend/src/pages/ScheduleCreation.tsx
// 날짜 선택, 회원 체크박스, 게스트 추가

// frontend/src/components/AttendeeSelector.tsx
// 참석자 선택 컴포넌트

// frontend/src/components/GuestInput.tsx
// 게스트 추가 인풋
```

#### Week 3: 스케줄 생성 알고리즘
**목표**: 참석자 기반 6경기 자동 배정 로직

**Backend Tasks**:
```typescript
// backend/src/services/scheduleGeneratorService.ts
/**
 * 스케줄 생성 알고리즘 핵심 로직
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

// backend/src/controllers/matchController.ts
// POST /api/matches/generate - 스케줄 자동 생성
// PUT /api/matches/:id - 경기 수정
```

**Frontend Tasks**:
```typescript
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
**Backend Tasks**:
```typescript
// backend/src/controllers/constraintController.ts
// POST /api/constraints - 제약조건 추가
// DELETE /api/constraints/:id - 제약조건 삭제

// backend/src/services/scheduleGeneratorService.ts 업데이트
// 제약조건 반영 로직:
// 1. exclude_last_match: 특정 회원 6번째 경기 제외
// 2. partner_pair: 특정 두 명 항상 같은 팀
// 3. exclude_match: 특정 회원 특정 경기 제외
```

**Frontend Tasks**:
```typescript
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
**Backend Tasks**:
```typescript
// backend/src/controllers/historyController.ts
// GET /api/schedules?month=2024-12 - 월별 스케줄 목록
// GET /api/members/:id/stats - 회원별 참석 통계
```

**Frontend Tasks**:
```typescript
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

### 2. 데이터베이스 최적화

**인덱스 활용**:
- `schedules.date`: 날짜별 조회 빈번
- `attendances.schedule_id`: 스케줄별 참석자 조회
- `matches.schedule_id`: 스케줄별 경기 조회

**트랜잭션 처리**:
```typescript
// 스케줄 생성 시 트랜잭션으로 묶기
async function createScheduleWithMatches(scheduleData, matches) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const schedule = await client.query('INSERT INTO schedules...');
    for (const match of matches) {
      await client.query('INSERT INTO matches...');
    }
    await client.query('COMMIT');
  } catch (e) {
    await client.query('ROLLBACK');
    throw e;
  } finally {
    client.release();
  }
}
```

### 3. 에러 처리

**Backend**:
```typescript
// 공통 에러 핸들러 미들웨어
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(err.status || 500).json({
    error: err.message || 'Internal Server Error'
  });
});
```

**Frontend**:
```typescript
// 에러 바운더리 컴포넌트
// API 호출 실패 시 사용자 친화적 메시지
```

### 4. 성능 최적화

**Frontend**:
- React.memo로 불필요한 리렌더링 방지
- useMemo, useCallback 활용
- 이미지 최적화 (있는 경우)

**Backend**:
- 데이터베이스 쿼리 최적화 (JOIN 최소화)
- 응답 캐싱 (추후 Redis 도입 고려)

## API 엔드포인트 설계

### Members
```
GET    /api/members           # 전체 회원 조회
GET    /api/members/:id       # 특정 회원 조회
POST   /api/members           # 회원 등록
PUT    /api/members/:id       # 회원 수정
DELETE /api/members/:id       # 회원 삭제
GET    /api/members/:id/stats # 회원 통계
```

### Schedules
```
GET    /api/schedules              # 스케줄 목록 (쿼리: ?month=2024-12)
GET    /api/schedules/:id          # 특정 스케줄 조회
POST   /api/schedules              # 스케줄 생성
PUT    /api/schedules/:id          # 스케줄 수정
DELETE /api/schedules/:id          # 스케줄 삭제
GET    /api/schedules/:date/detail # 날짜별 상세 스케줄
```

### Attendances
```
POST   /api/attendances            # 참석자 등록 (벌크)
GET    /api/attendances/:scheduleId # 스케줄별 참석자 조회
DELETE /api/attendances/:id        # 참석자 삭제
```

### Matches
```
POST   /api/matches/generate       # 스케줄 자동 생성
GET    /api/matches/:scheduleId    # 스케줄별 경기 조회
PUT    /api/matches/:id            # 경기 수정
DELETE /api/matches/:id            # 경기 삭제
```

### Constraints
```
POST   /api/constraints            # 제약조건 추가
GET    /api/constraints/:scheduleId # 스케줄별 제약조건 조회
DELETE /api/constraints/:id        # 제약조건 삭제
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

### Frontend (Vercel)
```bash
cd frontend
npm run build
vercel deploy --prod
```

### Backend (Railway)
```bash
cd backend
railway login
railway init
railway up
```

### Database (Railway PostgreSQL)
```bash
railway add postgres
railway run psql -f database/schema.sql
```

## 트러블슈팅

### 자주 발생하는 문제

1. **CORS 에러**
   - backend/src/index.ts에서 cors 설정 확인
   - 프론트엔드 URL을 허용 목록에 추가

2. **데이터베이스 연결 실패**
   - .env 파일의 DATABASE_URL 확인
   - PostgreSQL 서비스 실행 상태 확인

3. **타입 에러**
   - TypeScript 타입 정의 파일 확인
   - npm run build로 타입 체크

## 추후 개발 아이디어

- 회원 자체 참석 신청 기능
- 푸시 알림 (PWA)
- 경기 결과 기록 및 통계
- 동아리 랭킹 시스템
- 날씨 API 연동
- 경기장 예약 연동

## 참고 자료

- [Express.js 공식 문서](https://expressjs.com/)
- [React 공식 문서](https://react.dev/)
- [PostgreSQL 문서](https://www.postgresql.org/docs/)
- [Tailwind CSS 문서](https://tailwindcss.com/docs)

---

**문서 작성일**: 2024-12-03
**최종 수정일**: 2024-12-03
**작성자**: Claude Code Assistant
