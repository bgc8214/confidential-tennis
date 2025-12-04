# 유연한 경기 설정 기능 가이드

## 개요

이 가이드는 테니스 동아리 스케줄 관리 시스템에 추가된 유연한 경기 설정 기능에 대한 설명입니다.

## 새로운 기능

### 1. 총 경기 수 설정
- **기존**: 고정 6경기
- **신규**: 1-10경기 사이에서 자유롭게 선택 가능
- 사용 사례: 짧은 모임은 3경기, 긴 모임은 8경기 등

### 2. 코트 수 설정
- **기존**: 고정 2코트 (A, B)
- **신규**: 1-10코트 사이에서 자유롭게 선택 가능 (A, B, C, ...)
- 사용 사례: 작은 모임은 1코트, 큰 대회는 4코트 등
- 코트 레이블: A, B, C, D, E, F, G, H, I, J

### 3. 코트 예약 시간 설정
- **기존**: 고정 3시간 (6경기 × 30분)
- **신규**: 1-4시간 사이에서 자유롭게 선택 가능
- 경기당 시간은 자동 계산: (총 예약 시간) ÷ (경기 수)
- 사용 사례:
  - 2시간 예약, 4경기 → 경기당 30분
  - 3시간 예약, 6경기 → 경기당 30분
  - 2.5시간 예약, 5경기 → 경기당 30분

### 4. 경기별 타입 설정 (고급 기능)
- **기존**: 전체 경기에 하나의 타입 (혼복/남복/여복)
- **신규**: 각 경기마다 다른 타입 설정 가능
- 사용 사례:
  - 1-2경기: 혼복
  - 3-6경기: 남복
  - 또는 특정 경기만 여복으로 설정

## 데이터베이스 변경사항

### schedules 테이블에 추가된 컬럼
```sql
total_matches INTEGER DEFAULT 6 CHECK (total_matches BETWEEN 1 AND 10)
match_duration INTEGER DEFAULT 30 CHECK (match_duration BETWEEN 10 AND 120)
court_count INTEGER DEFAULT 2 CHECK (court_count BETWEEN 1 AND 10)
```

### matches 테이블에 추가된 컬럼
```sql
match_type TEXT DEFAULT 'mixed' CHECK (match_type IN ('mixed', 'mens', 'womens'))
```

### 제약조건 업데이트
- `matches.match_number`: 1-6 → 1-10
- `constraints.match_number`: 1-6 → 1-10

## 마이그레이션 방법

### Supabase를 사용하는 경우

1. Supabase Dashboard의 SQL Editor로 이동
2. `database/migrations/add_flexible_match_settings.sql` 파일 내용을 복사
3. SQL Editor에 붙여넣기
4. Run 버튼 클릭

### 로컬 PostgreSQL을 사용하는 경우

```bash
psql -U your_username -d your_database -f database/migrations/add_flexible_match_settings.sql
```

## UI 변경사항

### 1. 스케줄 생성 페이지
- **새로운 컴포넌트**: `AdvancedScheduleSettings`
- **위치**: 날짜/시간 선택 섹션 아래
- **기능**:
  - **코트 예약 시간 선택** (1-4시간): 먼저 선택
  - **총 경기 수 선택** (1-10): 두 번째 선택
  - **경기당 시간 자동 계산**: (예약 시간) ÷ (경기 수)
  - **코트 수 선택** (1-10)
  - "고급 설정 열기" 버튼으로 경기별 타입 설정 패널 표시

**사용 흐름**:
1. 코트를 몇 시간 예약했는지 선택 (예: 3시간)
2. 몇 경기를 할지 선택 (예: 6경기)
3. 자동 계산: 경기당 30분
4. 코트 수 선택 (예: 2코트)

### 2. 고급 설정 패널
- 각 경기별로 타입 선택 (혼복/남복/여복)
- 빠른 설정 버튼:
  - "전체 혼복"
  - "전체 남복"
  - "전체 여복"
- 경기 타입 분포 통계 표시

### 3. 경기 카드 (MatchCard, DraggableMatchCard)
- 경기 타입 배지 추가
  - 혼복: 🎾 보라색
  - 남복: 👨‍🦱 파란색
  - 여복: 👩‍🦱 분홍색

## 코드 변경사항

### 1. TypeScript 타입 업데이트

```typescript
// frontend/src/types/index.ts

export interface Schedule {
  // ... 기존 필드
  total_matches: number; // 추가
  match_duration: number; // 추가
  court_count: number; // 추가
}

export interface Match {
  // ... 기존 필드
  match_type: 'mixed' | 'mens' | 'womens'; // 추가
}

export interface GeneratedMatch {
  // ... 기존 필드
  match_type: 'mixed' | 'mens' | 'womens'; // 추가
}

export interface MatchSettings {
  totalMatches: number;
  matchDuration: number;
  courtCount: number;
  matchTypes: ('mixed' | 'mens' | 'womens')[];
}
```

### 2. scheduleGenerator 업데이트

```typescript
// frontend/src/utils/scheduleGenerator.ts

interface GenerationOptions {
  attendees: Attendance[];
  constraints?: Constraint[];
  startTime: string;
  totalMatches?: number; // 추가
  matchDuration?: number; // 추가
  courtCount?: number; // 추가
  matchTypes?: ('mixed' | 'mens' | 'womens')[]; // 추가
  matchType?: 'mixed' | 'mens' | 'womens'; // 하위 호환성
}
```

- 경기별 타입에 따라 참석자 필터링
- 동적 경기 수 생성
- 동적 코트 수 지원 (A, B, C, ...)
- 동적 경기 시간 계산

### 3. 스케줄 생성 로직

```typescript
// ScheduleCreation.tsx
const schedule = await scheduleService.create(
  currentClub.id,
  {
    // ... 기존 필드
    total_matches: matchSettings.totalMatches,
    match_duration: matchSettings.matchDuration,
    court_count: matchSettings.courtCount,
    // match_type은 첫 번째 경기 타입으로 설정 (하위 호환성)
  },
  generatePublicLink
);
```

```typescript
// ScheduleGenerator.tsx
const generatedMatches = generateSchedule({
  attendees: attendanceData,
  constraints: constraintsData,
  startTime: scheduleData.start_time || '10:00',
  totalMatches: scheduleData.total_matches || 6,
  matchDuration: scheduleData.match_duration || 30,
  courtCount: scheduleData.court_count || 2,
  matchType: scheduleData.match_type || 'mixed'
});
```

## 하위 호환성

이 업데이트는 기존 스케줄과 완전히 호환됩니다:

- 기존 스케줄의 `total_matches`는 자동으로 6으로 설정
- 기존 스케줄의 `match_duration`은 자동으로 30으로 설정
- 기존 스케줄의 `court_count`는 자동으로 2로 설정
- 기존 경기의 `match_type`은 스케줄의 `match_type`으로 자동 설정

## 사용 예시

### 예시 1: 짧은 연습 세션 (1코트)
```
1. 코트 예약 시간: 1시간
2. 총 경기 수: 3경기
3. 자동 계산: 경기당 20분
4. 코트 수: 1코트 (A)
5. 모든 경기: 혼복
```

### 예시 2: 일반 토너먼트 (2코트)
```
1. 코트 예약 시간: 3시간
2. 총 경기 수: 6경기
3. 자동 계산: 경기당 30분
4. 코트 수: 2코트 (A, B)
5. 경기 1-2: 혼복, 경기 3-4: 남복, 경기 5-6: 여복
```

### 예시 3: 대규모 대회 (4코트)
```
1. 코트 예약 시간: 3시간
2. 총 경기 수: 9경기
3. 자동 계산: 경기당 20분
4. 코트 수: 4코트 (A, B, C, D)
5. 모든 경기: 혼복
6. 필요 인원: 최소 16명 (4코트 × 4명)
```

## 문제 해결

### Q: 마이그레이션 후 기존 스케줄이 제대로 표시되지 않습니다
A: 브라우저 캐시를 지우고 다시 시도해주세요. 또한 프론트엔드를 다시 빌드했는지 확인하세요.

### Q: 경기 타입별 참석자가 부족하다는 오류가 발생합니다
A: 각 경기 타입별로 최소 4명 이상의 참석자가 필요합니다. 예를 들어, 남복 경기를 설정하면 남성 회원이 최소 4명 이상 필요합니다.

### Q: 게스트는 경기 타입에 어떻게 포함되나요?
A: 게스트는 성별 정보가 없으므로 모든 타입의 경기에 포함될 수 있습니다.

## 향후 계획

- [ ] 경기별 코트 수 설정 (현재는 항상 2코트)
- [ ] 경기 간 휴식 시간 설정
- [ ] 프리셋 저장/불러오기 (자주 사용하는 설정 저장)
- [ ] 통계: 경기 타입별 참여 횟수 분석

---

**문서 작성일**: 2025-12-04
**버전**: 1.0.0
