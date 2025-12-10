# 개인별 경기 수 설정 기능 추가 플랜

## 📋 목표
참석자별로 원하는 경기 수(3경기, 4경기 등)를 지정할 수 있는 기능 추가

---

## 🎯 문제 정의

### 현재 상황
- 스케줄 생성 알고리즘이 자동으로 경기를 배정
- 참석자 수와 경기 수에 따라 자동으로 분배됨
- 결과적으로 어떤 사람은 3경기, 어떤 사람은 4경기를 하게 됨
- **사용자가 특정 회원의 경기 수를 제어할 수 없음**

### 사용자 니즈
- 특정 회원은 3경기만 하고 싶음 (피곤하거나 시간이 없는 경우)
- 특정 회원은 5경기를 하고 싶음 (더 많이 뛰고 싶은 경우)
- 특정 회원은 정확히 4경기를 원함 (공평하게)

### 예시 시나리오
```
참석자: 13명, 총 6경기
기본 배정: 각 경기당 8명 (코트 2개 × 4명)

현재 (자동):
- 황정윤: 4경기
- 김린: 3경기
- 윤나라: 4경기
- 박한영: 3경기

희망 (사용자 설정):
- 황정윤: 5경기 (더 많이 뛰고 싶음)
- 김린: 2경기 (오늘 컨디션이 안 좋음)
- 윤나라: 4경기 (기본값)
- 박한영: 3경기 (시간이 없어서 일찍 가야 함)
```

---

## 🎨 UX 디자인 제안

### Option 1: 제약조건 패널에 추가 (✅ 권장)

**위치:** `ConstraintPanel.tsx` 내부에 새로운 섹션 추가

**장점:**
- ✅ 기존 제약조건과 개념적으로 유사 (특정 회원에 대한 특별 규칙)
- ✅ 이미 펼치기/접기 UI가 있어서 공간 절약
- ✅ 개발자와 사용자 모두에게 논리적으로 자연스러움
- ✅ 추가 네비게이션 없이 한 화면에서 모든 설정 가능

**단점:**
- ⚠️ 제약조건 패널이 너무 길어질 수 있음

**UI 설계:**

```
┌────────────────────────────────────────────┐
│ 🎯 제약조건 설정 (선택사항)                │
│ [▼ 펼치기]                                 │
└────────────────────────────────────────────┘

(펼쳤을 때)
┌────────────────────────────────────────────┐
│ 🎯 제약조건 설정 (선택사항)                │
│ [▲ 접기]                                   │
│                                            │
│ ┌─ 1. 개인별 경기 수 설정 ──────────────┐ │
│ │                                        │ │
│ │ [회원 선택 ▼] [경기 수 ▼]  [추가]     │ │
│ │                                        │ │
│ │ 설정된 회원:                            │ │
│ │ • 황정윤: 5경기 [삭제]                 │ │
│ │ • 김린: 2경기 [삭제]                   │ │
│ │ • 박한영: 3경기 [삭제]                 │ │
│ │                                        │ │
│ │ 💡 나머지 회원은 자동으로 균등 배분됩니다 │ │
│ └────────────────────────────────────────┘ │
│                                            │
│ ┌─ 2. 마지막 경기 제외 ──────────────────┐ │
│ │ [회원 체크박스들...]                    │ │
│ └────────────────────────────────────────┘ │
│                                            │
│ ┌─ 3. 파트너 페어 지정 ──────────────────┐ │
│ │ ...                                     │ │
│ └────────────────────────────────────────┘ │
│                                            │
│ ┌─ 4. 특정 경기 제외 ────────────────────┐ │
│ │ ...                                     │ │
│ └────────────────────────────────────────┘ │
└────────────────────────────────────────────┘
```

---

### Option 2: 참석자 선택 UI에 인라인 추가

**위치:** `AttendeeSelector.tsx` 각 회원 체크박스 옆에 경기 수 입력

**장점:**
- ✅ 참석 여부와 경기 수를 한 곳에서 설정
- ✅ 직관적 (회원 선택하면서 바로 경기 수 설정)

**단점:**
- ⚠️ UI가 복잡해짐 (체크박스 + 성별 + 경기 수 선택)
- ⚠️ 모바일에서 레이아웃 문제
- ⚠️ 선택하지 않은 회원에게도 경기 수 입력 UI가 보임 (혼란)

**UI 설계:**

```
┌────────────────────────────────────────────┐
│ 👥 참석 회원 선택                          │
│                                            │
│ [☑] 황정윤 (남) [경기 수: 5▼]             │
│ [☑] 김혜림 (여) [경기 수: 자동▼]          │
│ [☐] 문천웅 (남) [경기 수: 자동▼]          │
│ [☑] 김린 (남) [경기 수: 2▼]               │
└────────────────────────────────────────────┘
```

---

### Option 3: 고급 설정 탭으로 분리

**위치:** AdvancedScheduleSettings 내부 또는 별도 탭

**장점:**
- ✅ 깔끔한 UI (고급 사용자만 사용)
- ✅ 확장성 좋음 (향후 더 많은 고급 기능 추가 가능)

**단점:**
- ⚠️ 추가 클릭 필요
- ⚠️ 사용자가 기능을 찾기 어려울 수 있음

---

## ✅ 최종 권장: Option 1 (제약조건 패널에 추가)

**이유:**
1. 개념적으로 "제약조건"과 유사 (특정 회원에 대한 특별 규칙)
2. 한 화면에서 모든 설정 가능 (UX 일관성)
3. 이미 펼치기/접기 UI가 있어서 공간 효율적
4. 기존 제약조건(마지막 경기 제외, 파트너 페어)과 논리적으로 연관됨

---

## 🛠️ 구현 계획

### 1단계: 데이터 구조 설계

#### 1.1 새로운 제약조건 타입 추가

**파일:** `frontend/src/types/index.ts`

```typescript
// 기존 ConstraintData에 새 필드 추가
export interface ConstraintData {
  excludeLastMatch: number[];
  partnerPairs: [number, number][];
  excludeMatches: { memberId: number; matchNumber: number }[];

  // 🆕 추가
  matchCounts?: { memberId: number; count: number }[];
}
```

#### 1.2 데이터베이스 스키마 (이미 유연함)

현재 `constraints` 테이블은 이미 유연한 구조:
```sql
-- constraint_type에 새로운 값 'match_count' 추가
-- member_id_1: 회원 ID
-- match_number: 경기 수 (1-10)
INSERT INTO constraints (schedule_id, constraint_type, member_id_1, match_number)
VALUES (123, 'match_count', 456, 5);
-- 의미: 회원 456은 5경기만 참여
```

---

### 2단계: UI 컴포넌트 수정

#### 2.1 ConstraintPanel 수정

**파일:** `frontend/src/components/ConstraintPanel.tsx`

**변경사항:**
1. 새로운 섹션 추가: "개인별 경기 수 설정"
2. UI 요소:
   - 회원 선택 드롭다운 (참석자 중에서만)
   - 경기 수 선택 드롭다운 (1 ~ totalMatches)
   - "추가" 버튼
   - 설정된 회원 목록 (삭제 가능)

**예시 코드 구조:**
```typescript
const [matchCounts, setMatchCounts] = useState<{ memberId: number; count: number }[]>([]);
const [selectedMemberForCount, setSelectedMemberForCount] = useState<number | null>(null);
const [selectedCount, setSelectedCount] = useState<number>(4); // 기본값

const handleAddMatchCount = () => {
  if (!selectedMemberForCount || selectedCount < 1) return;

  // 중복 체크
  if (matchCounts.some(mc => mc.memberId === selectedMemberForCount)) {
    alert('이미 설정된 회원입니다.');
    return;
  }

  setMatchCounts([...matchCounts, { memberId: selectedMemberForCount, count: selectedCount }]);
  setSelectedMemberForCount(null);
};

const handleRemoveMatchCount = (memberId: number) => {
  setMatchCounts(matchCounts.filter(mc => mc.memberId !== memberId));
};
```

**UI 렌더링:**
```tsx
<div className="space-y-4 p-4 border rounded-lg">
  <h3 className="font-semibold">1. 개인별 경기 수 설정</h3>

  <div className="flex gap-2">
    <Select value={selectedMemberForCount} onChange={setSelectedMemberForCount}>
      <option value="">회원 선택</option>
      {attendees.map(a => (
        <option key={a.id} value={a.id}>{getMemberName(a)}</option>
      ))}
    </Select>

    <Select value={selectedCount} onChange={setSelectedCount}>
      {Array.from({ length: totalMatches }, (_, i) => i + 1).map(num => (
        <option key={num} value={num}>{num}경기</option>
      ))}
    </Select>

    <Button onClick={handleAddMatchCount}>추가</Button>
  </div>

  {matchCounts.length > 0 && (
    <div className="space-y-2">
      <p className="text-sm text-gray-600">설정된 회원:</p>
      {matchCounts.map(mc => {
        const member = attendees.find(a => a.id === mc.memberId);
        return (
          <div key={mc.memberId} className="flex items-center justify-between p-2 bg-gray-50 rounded">
            <span>• {getMemberName(member)}: {mc.count}경기</span>
            <Button variant="ghost" size="sm" onClick={() => handleRemoveMatchCount(mc.memberId)}>
              삭제
            </Button>
          </div>
        );
      })}
    </div>
  )}

  <p className="text-sm text-blue-600">
    💡 나머지 회원은 자동으로 균등하게 배분됩니다
  </p>
</div>
```

#### 2.2 ScheduleCreation 수정

**파일:** `frontend/src/pages/ScheduleCreation.tsx`

**변경사항:**
1. `ConstraintPanel`에 `totalMatches` prop 전달
2. `handleSubmit`에서 `matchCounts` 제약조건 저장

```typescript
// ConstraintPanel에 prop 추가
<ConstraintPanel
  attendees={attendees}
  constraints={constraints}
  onConstraintsChange={setConstraints}
  totalMatches={settings.matchCount} // 🆕 추가
/>

// handleSubmit에서 저장
for (const mc of constraints.matchCounts || []) {
  await scheduleService.addConstraint(schedule.id, {
    constraint_type: 'match_count',
    member_id_1: mc.memberId,
    match_number: mc.count
  });
}
```

---

### 3단계: 스케줄 생성 알고리즘 수정

#### 3.1 generateSchedule 함수 수정

**파일:** `frontend/src/utils/scheduleGenerator.ts`

**변경사항:**
1. `matchCounts` 제약조건을 입력으로 받음
2. 알고리즘에서 각 회원의 목표 경기 수를 추적
3. 회원 선택 시 목표 경기 수를 고려

**핵심 로직:**

```typescript
// 각 회원의 목표 경기 수 설정
const targetMatchCounts = new Map<number, number>();
constraints.matchCounts?.forEach(mc => {
  targetMatchCounts.set(mc.memberId, mc.count);
});

// 회원별 현재 경기 수 추적
const currentMatchCounts = new Map<number, number>();
attendees.forEach(a => {
  currentMatchCounts.set(a.id, 0);
});

// 경기 배정 시 우선순위 결정
function selectPlayer(availablePlayers: Attendance[]): Attendance | null {
  // 1순위: 목표 경기 수에 못 미친 회원
  const underTarget = availablePlayers.filter(p => {
    const target = targetMatchCounts.get(p.id);
    const current = currentMatchCounts.get(p.id) || 0;
    return target !== undefined && current < target;
  });

  if (underTarget.length > 0) {
    // 그 중에서도 가장 경기 수가 적은 사람 선택
    return underTarget.reduce((min, p) => {
      const minCount = currentMatchCounts.get(min.id) || 0;
      const pCount = currentMatchCounts.get(p.id) || 0;
      return pCount < minCount ? p : min;
    });
  }

  // 2순위: 목표가 설정되지 않은 회원 중 경기 수가 적은 사람
  const noTarget = availablePlayers.filter(p => !targetMatchCounts.has(p.id));
  if (noTarget.length > 0) {
    return noTarget.reduce((min, p) => {
      const minCount = currentMatchCounts.get(min.id) || 0;
      const pCount = currentMatchCounts.get(p.id) || 0;
      return pCount < minCount ? p : min;
    });
  }

  // 3순위: 목표를 초과했지만 어쩔 수 없는 경우
  return availablePlayers[0] || null;
}

// 경기 배정 후 카운트 증가
function assignPlayerToMatch(player: Attendance) {
  const current = currentMatchCounts.get(player.id) || 0;
  currentMatchCounts.set(player.id, current + 1);
}
```

**유효성 검사:**
```typescript
// 제약조건 검증 (스케줄 생성 전)
function validateMatchCountConstraints(
  attendees: Attendance[],
  matchCounts: { memberId: number; count: number }[],
  totalMatches: number,
  courtCount: number
): { valid: boolean; error?: string } {
  const requiredPlayers = totalMatches * courtCount * 4;

  // 지정된 경기 수 합계
  const specifiedTotal = matchCounts.reduce((sum, mc) => sum + mc.count, 0);

  // 지정되지 않은 회원 수
  const unspecifiedCount = attendees.length - matchCounts.length;

  // 남은 자리
  const remainingSlots = requiredPlayers - specifiedTotal;

  // 남은 자리가 부족한 경우
  if (remainingSlots < 0) {
    return {
      valid: false,
      error: '지정한 경기 수의 합이 너무 많습니다. 총 필요한 자리는 ' + requiredPlayers + '개입니다.'
    };
  }

  // 남은 회원들에게 최소 1경기씩 배정할 수 없는 경우
  if (unspecifiedCount > 0 && remainingSlots < unspecifiedCount) {
    return {
      valid: false,
      error: '나머지 회원들에게 최소 1경기씩 배정할 수 없습니다.'
    };
  }

  return { valid: true };
}
```

---

### 4단계: 서비스 레이어 수정

#### 4.1 scheduleService.ts

**파일:** `frontend/src/services/scheduleService.ts`

**변경사항:**
1. `getConstraints` 함수에서 `match_count` 타입 처리
2. `addConstraint` 함수는 이미 유연하므로 수정 불필요

```typescript
// getConstraints 수정
async getConstraints(scheduleId: number): Promise<ConstraintData> {
  const { data, error } = await supabase
    .from('constraints')
    .select('*')
    .eq('schedule_id', scheduleId);

  if (error) throw error;

  const constraints: ConstraintData = {
    excludeLastMatch: [],
    partnerPairs: [],
    excludeMatches: [],
    matchCounts: [] // 🆕 추가
  };

  data?.forEach(constraint => {
    switch (constraint.constraint_type) {
      case 'exclude_last_match':
        if (constraint.member_id_1) {
          constraints.excludeLastMatch.push(constraint.member_id_1);
        }
        break;
      case 'partner_pair':
        if (constraint.member_id_1 && constraint.member_id_2) {
          constraints.partnerPairs.push([constraint.member_id_1, constraint.member_id_2]);
        }
        break;
      case 'exclude_match':
        if (constraint.member_id_1 && constraint.match_number) {
          constraints.excludeMatches.push({
            memberId: constraint.member_id_1,
            matchNumber: constraint.match_number
          });
        }
        break;
      case 'match_count': // 🆕 추가
        if (constraint.member_id_1 && constraint.match_number) {
          constraints.matchCounts!.push({
            memberId: constraint.member_id_1,
            count: constraint.match_number
          });
        }
        break;
    }
  });

  return constraints;
}
```

---

### 5단계: 통계 및 피드백

#### 5.1 경기 생성 결과 표시

**파일:** `frontend/src/pages/ScheduleGenerator.tsx`

**추가 기능:**
1. 각 회원별 목표 vs 실제 경기 수 비교 표시
2. 목표를 달성하지 못한 경우 경고 표시

```tsx
<div className="bg-blue-50 p-4 rounded-lg">
  <h3 className="font-semibold mb-2">경기 수 설정 결과</h3>

  {constraints.matchCounts?.map(mc => {
    const actual = getActualMatchCount(mc.memberId);
    const isAchieved = actual === mc.count;

    return (
      <div key={mc.memberId} className={`flex items-center justify-between p-2 rounded ${isAchieved ? 'bg-green-100' : 'bg-yellow-100'}`}>
        <span>{getMemberName(mc.memberId)}</span>
        <span>
          목표: {mc.count}경기 / 실제: {actual}경기
          {isAchieved ? ' ✅' : ' ⚠️'}
        </span>
      </div>
    );
  })}

  {constraints.matchCounts?.some(mc => getActualMatchCount(mc.memberId) !== mc.count) && (
    <p className="text-sm text-yellow-700 mt-2">
      ⚠️ 일부 회원의 목표 경기 수를 정확히 맞추지 못했습니다. "재생성" 버튼을 눌러 다시 시도해보세요.
    </p>
  )}
</div>
```

---

## 📊 예상 효과

### 사용자 경험 개선
1. ✅ 개인의 상황에 맞춘 맞춤형 스케줄 생성
2. ✅ 체력, 시간, 선호도를 반영할 수 있음
3. ✅ 더 공평한 경기 배정 (원하는 만큼만 배정)

### 유연성 향상
1. ✅ 특정 회원이 일찍 가야 하는 경우 → 3경기만 설정
2. ✅ 특정 회원이 더 많이 뛰고 싶은 경우 → 5-6경기 설정
3. ✅ VIP 회원이나 초보자에 대한 특별 배려 가능

---

## 🚀 구현 우선순위

### Phase 1: MVP (필수)
1. ✅ ConstraintPanel UI 추가
2. ✅ 데이터베이스 저장/조회
3. ✅ 기본 알고리즘 수정 (목표 경기 수 고려)

### Phase 2: 개선 (권장)
1. ✅ 유효성 검사 (불가능한 조합 방지)
2. ✅ 결과 피드백 (목표 달성 여부 표시)
3. ✅ 자동 제안 (참석자 수에 따른 권장 경기 수)

### Phase 3: 고급 (선택)
1. 🔮 머신러닝 기반 최적 배정
2. 🔮 과거 경기 통계 기반 자동 추천
3. 🔮 모바일 앱에서 회원이 직접 설정

---

## 🎯 테스트 시나리오

### 시나리오 1: 기본 사용
```
참석자: 13명, 6경기, 코트 2개
설정:
- 황정윤: 5경기
- 김린: 2경기
- 나머지: 자동

예상 결과:
- 황정윤: 5경기 출전
- 김린: 2경기만 출전
- 나머지 11명: 3-4경기 균등 배분
```

### 시나리오 2: 극단적인 경우
```
참석자: 10명, 6경기, 코트 2개
설정:
- 회원A: 1경기
- 회원B: 1경기
- 나머지: 자동

예상 결과:
- 회원A, B: 각 1경기
- 나머지 8명: 5-6경기 (더 많이 뛰게 됨)
- 유효성 검사 통과 (총 48자리, 2 + 46 = 48)
```

### 시나리오 3: 불가능한 경우
```
참석자: 8명, 6경기, 코트 2개
설정:
- 회원A: 2경기
- 회원B: 2경기
- 회원C: 2경기
- 회원D: 2경기
- 나머지 4명: 자동

계산:
- 필요 자리: 6 × 2 × 4 = 48
- 지정된 자리: 4 × 2 = 8
- 남은 자리: 48 - 8 = 40
- 남은 회원: 4명
- 회원당 평균: 40 ÷ 4 = 10경기 (너무 많음!)

결과:
- ⚠️ 유효성 검사 실패
- 에러 메시지: "나머지 회원들에게 배정할 경기가 너무 많습니다."
```

---

## 🔍 주의사항

### 알고리즘 한계
1. 목표 경기 수를 **정확히** 맞추는 것은 어려울 수 있음
2. 제약조건이 많을수록 완벽한 배정이 어려움
3. "최선을 다하되, 100% 보장은 어려움"을 사용자에게 안내

### 사용자 교육
1. 설정 화면에 간단한 가이드 추가
2. "💡 팁: 너무 많은 제약조건은 최적 배정을 어렵게 합니다"
3. 재생성 버튼으로 여러 번 시도 가능하다는 안내

### 성능
1. 알고리즘 복잡도 증가 → 생성 시간 증가 가능
2. 백트래킹이나 최적화 알고리즘 필요할 수 있음
3. 최악의 경우 "배정 불가능" 에러 처리

---

## 📝 다음 단계

1. ✅ 이 플랜 리뷰 및 승인
2. 🔨 ConstraintPanel UI 구현
3. 🧪 알고리즘 테스트
4. 🚀 배포 및 사용자 피드백 수집

---

**작성일:** 2024-12-08
**작성자:** Claude Code Assistant
