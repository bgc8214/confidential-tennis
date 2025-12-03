# 아키텍처 문서

## 시스템 구조 변경

### v0.1.0 → v0.2.0: Supabase 전환

기존 3-tier 아키텍처에서 Supabase BaaS(Backend as a Service)로 전환했습니다.

### 변경 전 (v0.1.0)
```
Frontend (React) → Backend (Express) → Database (PostgreSQL)
```

### 변경 후 (v0.2.0)
```
Frontend (React) → Supabase (PostgreSQL + REST API)
```

## 변경 이유

1. **개발 속도**: 백엔드 API 개발 없이 Supabase가 자동으로 REST API 제공
2. **배포 간소화**: 프론트엔드만 배포하면 되므로 운영 부담 감소
3. **비용 절감**: Supabase 무료 플랜으로 동아리 규모 충분
4. **보안**: Supabase의 RLS(Row Level Security)로 권한 관리 가능

## 핵심 컴포넌트

### 1. Supabase Client ([frontend/src/lib/supabase.ts](frontend/src/lib/supabase.ts))
```typescript
import { createClient } from '@supabase/supabase-js';

export const supabase = createClient(url, anonKey);
```

### 2. Service Layer
비즈니스 로직과 데이터 접근을 분리하여 코드 재사용성 향상

- **memberService**: 회원 CRUD
- **scheduleService**: 스케줄, 참석자, 경기 관리

### 3. Schedule Generation Algorithm ([frontend/src/utils/scheduleGenerator.ts](frontend/src/utils/scheduleGenerator.ts))
프론트엔드에서 실행되는 스케줄 자동 생성 알고리즘

**입력**:
- 참석자 목록 (Attendance[])
- 제약조건 (Constraint[])
- 시작 시간 (string)

**출력**:
- 6경기 × 2코트 = 12개 매치
- 각 매치당 4명 (2 vs 2)

**알고리즘 특징**:
- 참여 횟수 균등 분배
- 제약조건 반영 (마지막 경기 제외, 파트너 지정, 특정 경기 제외)
- 연속 경기 최소화

## 데이터베이스 스키마

### 주요 테이블

1. **members**: 동아리 회원
2. **schedules**: 경기 일정
3. **attendances**: 참석자 (회원 + 게스트)
4. **matches**: 개별 경기 (6경기 × 2코트)
5. **constraints**: 스케줄 생성 제약조건

### 관계도
```
schedules (1) → (N) attendances
schedules (1) → (N) matches
schedules (1) → (N) constraints

attendances (1) ← (1) matches.player1_id
attendances (1) ← (1) matches.player2_id
attendances (1) ← (1) matches.player3_id
attendances (1) ← (1) matches.player4_id

members (1) → (N) attendances (nullable for guests)
```

## 데이터 흐름

### 스케줄 생성 플로우

1. **사용자 입력**
   - 날짜 선택
   - 참석자 선택 (회원 + 게스트)
   - 제약조건 설정 (선택사항)

2. **프론트엔드 처리**
   ```typescript
   // 1. 스케줄 생성
   const schedule = await scheduleService.create({ date, start_time, end_time });

   // 2. 참석자 등록
   const attendances = await scheduleService.addAttendances(schedule.id, attendeeData);

   // 3. 제약조건 등록
   await scheduleService.addConstraint(constraintData);

   // 4. 스케줄 알고리즘 실행 (클라이언트)
   const matches = generateSchedule({ attendees: attendances, constraints, startTime });

   // 5. 경기 저장
   const dbMatches = convertMatchesToDbFormat(matches, schedule.id);
   await scheduleService.addMatches(dbMatches);
   ```

3. **Supabase 저장**
   - Supabase가 자동으로 관계 유지 및 트랜잭션 처리

### 스케줄 조회 플로우

```typescript
// 1. 스케줄 조회
const schedule = await scheduleService.getByDate(date);

// 2. 참석자 조회 (JOIN)
const attendances = await scheduleService.getAttendances(schedule.id);

// 3. 경기 목록 조회 (JOIN with attendances)
const matches = await scheduleService.getMatches(schedule.id);

// 4. UI 렌더링
```

## 보안 고려사항

### 현재 (개발 단계)
- RLS(Row Level Security) 비활성화
- anon key로 모든 데이터 접근 가능

### 추후 (운영 단계)
- RLS 활성화
- 정책 설정:
  ```sql
  -- 모든 사용자 읽기 가능
  CREATE POLICY "Public read" ON members FOR SELECT USING (true);

  -- 인증된 사용자만 쓰기 가능
  CREATE POLICY "Authenticated write" ON members
    FOR ALL USING (auth.role() = 'authenticated');
  ```

## 성능 최적화

### 1. 인덱스
- `schedules.date`: 날짜별 조회
- `attendances.schedule_id`: 스케줄별 참석자
- `matches.schedule_id`: 스케줄별 경기

### 2. 쿼리 최적화
```typescript
// JOIN을 활용한 단일 쿼리
const matches = await supabase
  .from('matches')
  .select(`
    *,
    player1:attendances!player1_id(*, member:members(*)),
    player2:attendances!player2_id(*, member:members(*)),
    player3:attendances!player3_id(*, member:members(*)),
    player4:attendances!player4_id(*, member:members(*))
  `)
  .eq('schedule_id', scheduleId);
```

### 3. 캐싱 전략 (추후 구현)
- React Query로 서버 상태 캐싱
- 낙관적 업데이트로 UX 개선

## 확장 가능성

### 단기 확장
- Authentication 추가 (Supabase Auth)
- 실시간 동기화 (Supabase Realtime)
- 파일 업로드 (프로필 사진 등)

### 장기 확장
- 여러 동아리 지원 (Multi-tenancy)
- 모바일 앱 (React Native + 동일한 Supabase)
- 알림 시스템 (이메일, 푸시)

## 배포 전략

### Development
```
Frontend: localhost:5173
Supabase: Development project
```

### Production
```
Frontend: Vercel (vercel.com)
Supabase: Production project (supabase.com)
```

### CI/CD
```
GitHub → Vercel (자동 배포)
Supabase 마이그레이션: 수동 또는 CLI
```

## 모니터링

### Supabase Dashboard
- Database 사용량
- API 호출 수
- 에러 로그

### Vercel Analytics
- 페이지 성능
- 사용자 통계

---

**최종 업데이트**: 2024-12-03
**버전**: v0.2.0
