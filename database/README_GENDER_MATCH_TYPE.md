# 성별 및 경기 타입 기능 가이드

## 개요

회원의 성별 정보와 경기 타입(혼복/남복/여복) 기능이 추가되었습니다.

---

## 데이터베이스 변경사항

### 1. Members 테이블

**추가된 필드**:
- `gender`: TEXT, CHECK 제약조건 (`'male'` 또는 `'female'`)
  - NULL 허용 (기존 회원이나 게스트의 경우)

**사용 예시**:
```sql
-- 회원 등록 시 성별 정보 포함
INSERT INTO members (club_id, name, gender, skill_level)
VALUES (1, '홍길동', 'male', 'intermediate');

-- 성별 정보 없이 등록 (나중에 추가 가능)
INSERT INTO members (club_id, name, skill_level)
VALUES (1, '이영희', 'beginner');

-- 성별 정보 업데이트
UPDATE members 
SET gender = 'female' 
WHERE id = 2;
```

### 2. Schedules 테이블

**추가된 필드**:
- `match_type`: TEXT, 기본값 `'mixed'`, CHECK 제약조건
  - `'mixed'`: 혼복 (기본값)
  - `'mens'`: 남복
  - `'womens'`: 여복

**사용 예시**:
```sql
-- 혼복 경기 생성 (기본값)
INSERT INTO schedules (club_id, date, match_type)
VALUES (1, '2024-12-07', 'mixed');

-- 남복 경기 생성
INSERT INTO schedules (club_id, date, match_type)
VALUES (1, '2024-12-14', 'mens');

-- 여복 경기 생성
INSERT INTO schedules (club_id, date, match_type)
VALUES (1, '2024-12-21', 'womens');
```

---

## 경기 타입별 배정 로직

### 혼복 (Mixed)
- 성별 제한 없음
- 모든 참석자 배정 가능
- 게스트도 배정 가능

### 남복 (Men's Doubles)
- 남자 회원만 배정
- `gender = 'male'`인 회원만 선택
- 여자 회원은 자동으로 제외
- 게스트는 배정 불가 (성별 정보 없음)

### 여복 (Women's Doubles)
- 여자 회원만 배정
- `gender = 'female'`인 회원만 선택
- 남자 회원은 자동으로 제외
- 게스트는 배정 불가 (성별 정보 없음)

---

## 스케줄 생성 알고리즘 수정 필요사항

### 참석자 필터링 로직

```typescript
// 의사코드
function filterAttendeesByMatchType(attendees, matchType) {
  if (matchType === 'mixed') {
    return attendees; // 모든 참석자
  } else if (matchType === 'mens') {
    return attendees.filter(a => 
      a.is_guest || // 게스트는 제외
      (a.member && a.member.gender === 'male')
    );
  } else if (matchType === 'womens') {
    return attendees.filter(a => 
      a.is_guest || // 게스트는 제외
      (a.member && a.member.gender === 'female')
    );
  }
}
```

### 경기 배정 시 검증

```typescript
// 경기 배정 시 성별 검증
function validateMatchPlayers(players, matchType) {
  if (matchType === 'mens') {
    // 모든 선수가 남자인지 확인
    return players.every(p => 
      p.is_guest || 
      (p.member && p.member.gender === 'male')
    );
  } else if (matchType === 'womens') {
    // 모든 선수가 여자인지 확인
    return players.every(p => 
      p.is_guest || 
      (p.member && p.member.gender === 'female')
    );
  }
  return true; // 혼복은 검증 불필요
}
```

---

## UI 변경사항

### 회원 관리 페이지
- 회원 등록/수정 폼에 성별 선택 필드 추가
- 성별 필터링 옵션 (선택사항)

### 스케줄 생성 페이지
- 경기 타입 선택 라디오 버튼 추가
  - 혼복 / 남복 / 여복
- 참석자 선택 시 성별 표시
  - 예: "홍길동 (남)", "이영희 (여)"
- 경기 타입에 따라 자동으로 적합한 참석자만 표시

### 스케줄 표시 페이지
- 경기 타입 표시
  - 예: "혼복 경기", "남복 경기", "여복 경기"

---

## 마이그레이션

기존 데이터베이스에 필드를 추가하려면:

```sql
-- Members 테이블에 gender 필드 추가
ALTER TABLE members 
ADD COLUMN IF NOT EXISTS gender TEXT CHECK (gender IN ('male', 'female'));

-- Schedules 테이블에 match_type 필드 추가
ALTER TABLE schedules 
ADD COLUMN IF NOT EXISTS match_type TEXT DEFAULT 'mixed' CHECK (match_type IN ('mixed', 'mens', 'womens'));

-- 기존 스케줄의 match_type을 기본값으로 설정
UPDATE schedules 
SET match_type = 'mixed' 
WHERE match_type IS NULL;
```

또는 `database/migrations/008_add_gender_and_match_type.sql` 파일을 실행하세요.

---

## 주의사항

1. **게스트 처리**:
   - 게스트는 성별 정보가 없으므로 혼복 경기에서만 배정 가능
   - 남복/여복 경기에서는 게스트를 참석자 목록에서 제외하거나 경고 표시

2. **기존 데이터**:
   - 기존 회원의 성별 정보는 NULL일 수 있음
   - 성별 정보가 없는 회원은 혼복 경기에만 배정 가능

3. **검증 로직**:
   - 스케줄 생성 시 경기 타입과 참석자 성별이 일치하는지 검증 필요
   - 경기 타입 변경 시 기존 배정된 경기가 유효한지 확인 필요





