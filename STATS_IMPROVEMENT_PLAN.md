# 통계 기능 개선 플랜

## 현재 문제점

### 1. ClubContext 미사용
- `memberService.getAll()` 호출 시 `clubId` 전달 안 함
- 멀티 클럽 환경에서 모든 클럽 데이터가 섞임

### 2. 성능 문제
- 12개월 × 각 스케줄 × 각 회원 = 수천 번의 API 호출
- 페이지 로딩이 매우 느림 (10초 이상 가능)

### 3. 데이터 구조 문제
- 실시간 계산 방식으로 매번 전체 데이터 조회
- 캐싱이나 집계 테이블 없음

## 개선 방안

### Phase 1: 급한 버그 수정 (30분)
**목표**: ClubContext 연동 및 기본 동작 확보

#### 1.1 ClubContext 적용
```typescript
// MemberStats.tsx
const { currentClub } = useClub();

// 회원 목록 조회
const membersData = await memberService.getAll(currentClub.id);

// 스케줄 조회
const monthSchedules = await scheduleService.getByMonth(
  currentClub.id,
  selectedYear,
  month
);
```

#### 1.2 클럽 선택 가드 추가
```typescript
if (!currentClub) {
  return <div>클럽을 먼저 선택해주세요.</div>;
}
```

### Phase 2: 성능 최적화 (1-2시간)
**목표**: API 호출 횟수 90% 감소

#### 2.1 Supabase 집계 쿼리 활용
현재 방식 대신 SQL 집계 사용:

```sql
-- 회원별 참석 횟수
SELECT
  m.id,
  m.name,
  COUNT(DISTINCT a.schedule_id) as attendance_count
FROM members m
LEFT JOIN attendances a ON a.member_id = m.id
LEFT JOIN schedules s ON s.id = a.schedule_id
WHERE m.club_id = ?
  AND EXTRACT(YEAR FROM s.date) = ?
GROUP BY m.id, m.name;

-- 회원별 경기 참여 횟수
SELECT
  player_id,
  COUNT(*) as match_count
FROM (
  SELECT player1_id as player_id FROM matches WHERE schedule_id IN (...)
  UNION ALL
  SELECT player2_id FROM matches WHERE schedule_id IN (...)
  UNION ALL
  SELECT player3_id FROM matches WHERE schedule_id IN (...)
  UNION ALL
  SELECT player4_id FROM matches WHERE schedule_id IN (...)
) as all_players
WHERE player_id IS NOT NULL
GROUP BY player_id;
```

#### 2.2 서비스 메서드 추가
```typescript
// memberService.ts
async getMemberStatistics(clubId: number, year: number) {
  // RPC 또는 복잡한 쿼리 호출
  // 한 번의 API 호출로 모든 통계 반환
}
```

### Phase 3: 고급 통계 기능 (2-3시간)
**목표**: 더 유용한 인사이트 제공

#### 3.1 추가 통계 항목
- **월별 참석 추이**: 그래프로 시각화
- **파트너 조합 분석**: 누구와 가장 많이 경기했는지
- **코트별 경기 횟수**: A코트 vs B코트
- **경기 타입별 통계**: 혼복/남복/여복
- **최근 참석 여부**: 마지막 3회 참석/불참 표시

#### 3.2 필터링 옵션
- 기간 선택: 연도 → 월 단위 또는 기간 범위
- 정렬 옵션: 참석률, 경기 수, 이름
- 검색: 특정 회원 찾기

#### 3.3 시각화 개선
```typescript
// Chart.js 또는 Recharts 사용
- 참석률 추이 그래프
- 회원별 경기 수 바 차트
- 파트너 네트워크 다이어그램 (선택사항)
```

### Phase 4: 데이터베이스 최적화 (선택사항)
**목표**: 대규모 데이터에서도 빠른 조회

#### 4.1 집계 테이블 생성
```sql
CREATE TABLE member_statistics (
  id BIGSERIAL PRIMARY KEY,
  club_id BIGINT REFERENCES clubs(id),
  member_id BIGINT REFERENCES members(id),
  year INTEGER,
  month INTEGER,
  attendance_count INTEGER,
  match_count INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(club_id, member_id, year, month)
);
```

#### 4.2 트리거 또는 배치 작업
- 스케줄 생성/수정 시 자동 업데이트
- 또는 매일 자정 집계 테이블 갱신

## 우선순위

### 🔥 긴급 (지금 당장)
- [ ] Phase 1: ClubContext 연동
- [ ] 클럽 선택 가드

### ⚡ 중요 (이번 주)
- [ ] Phase 2: 성능 최적화
- [ ] Supabase RPC 또는 복잡한 쿼리 작성

### 📈 개선 (여유 있을 때)
- [ ] Phase 3: 고급 통계 기능
- [ ] 시각화 라이브러리 추가

### 🚀 최적화 (나중에)
- [ ] Phase 4: 집계 테이블
- [ ] 캐싱 레이어

## 예상 소요 시간

- **Phase 1**: 30분
- **Phase 2**: 1-2시간
- **Phase 3**: 2-3시간
- **Phase 4**: 4-6시간

**총 예상 시간**: 7.5-11.5시간

## 다음 단계

1. Phase 1부터 시작
2. 테스트 후 Phase 2 진행
3. 사용자 피드백 받은 후 Phase 3, 4 결정
