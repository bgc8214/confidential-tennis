# 멀티 클럽 지원 데이터베이스 스키마

## 개요

이 스키마는 여러 테니스 클럽을 지원하는 멀티 테넌트 구조입니다.

---

## 주요 변경사항

### 기존 시스템 (단일 클럽)
- 모든 데이터가 하나의 클럽을 가정
- 클럽 구분 없음
- 인증 없음

### 새로운 시스템 (멀티 클럽)
- ✅ Supabase Auth 통합
- ✅ 클럽별 데이터 격리
- ✅ 사용자-클럽 관계 관리
- ✅ 역할 기반 권한 관리 (Owner/Admin/Member)
- ✅ Row Level Security (RLS) 정책

---

## 테이블 구조

### 1. user_profiles
사용자 프로필 정보 (auth.users와 연결)

**주요 필드**:
- `id`: UUID (auth.users.id와 동일)
- `email`: 이메일
- `full_name`: 이름
- `avatar_url`: 프로필 이미지

### 2. clubs
테니스 클럽 정보

**주요 필드**:
- `id`: 클럽 고유 ID
- `name`: 클럽 이름
- `code`: 초대 코드 (8자리 대문자)
- `owner_id`: 소유자 UUID (auth.users.id)
- `settings`: JSONB (클럽별 설정)

### 3. club_members
사용자-클럽 관계 및 역할

**주요 필드**:
- `club_id`: 클럽 ID
- `user_id`: 사용자 UUID (auth.users.id)
- `role`: 역할 (owner/admin/member)

**제약조건**:
- `(club_id, user_id)` UNIQUE: 한 사용자는 한 클럽에 한 번만 가입 가능

### 4. members
클럽별 테니스 회원 정보

**주요 필드**:
- `club_id`: 클럽 ID (필수)
- `user_id`: 사용자 UUID (선택 - 로그인한 사용자인 경우)
- `name`, `phone`, `email`, `skill_level`: 회원 정보

**특징**:
- 같은 사용자가 여러 클럽에 속할 수 있음
- 각 클럽별로 독립적인 회원 정보 관리

### 5. schedules
경기 스케줄 (클럽별)

**주요 필드**:
- `club_id`: 클럽 ID (필수)
- `date`: 경기 날짜
- `start_time`, `end_time`: 경기 시간

**제약조건**:
- `(club_id, date)` UNIQUE: 클럽별로 같은 날짜에 하나의 스케줄만

### 6. attendances
참석자 정보

**주요 필드**:
- `schedule_id`: 스케줄 ID
- `member_id`: 회원 ID (정회원인 경우)
- `guest_name`: 게스트 이름 (게스트인 경우)
- `is_guest`: 게스트 여부

### 7. matches
경기 배정 정보

**주요 필드**:
- `schedule_id`: 스케줄 ID
- `match_number`: 경기 번호 (1-6)
- `court`: 코트 (A/B)
- `player1_id` ~ `player4_id`: 선수 ID (attendances.id)

### 8. constraints
스케줄 생성 제약조건

**주요 필드**:
- `schedule_id`: 스케줄 ID
- `constraint_type`: 제약조건 타입
- `member_id_1`, `member_id_2`: 관련 회원
- `match_number`: 경기 번호 (해당되는 경우)

---

## 권한 관리

### 역할 (Role)

1. **Owner (소유자)**
   - 클럽 생성자
   - 모든 권한 (클럽 삭제 포함)
   - 관리자 임명 가능

2. **Admin (관리자)**
   - 회원 관리
   - 스케줄 생성/수정
   - 제약조건 설정

3. **Member (회원)**
   - 스케줄 조회
   - 자신의 참석 신청 (추후 구현)

### RLS 정책 요약

- **조회 (SELECT)**: 클럽 회원이면 가능
- **생성/수정/삭제**: Owner 또는 Admin만 가능
- **클럽 삭제**: Owner만 가능

---

## 사용 예시

### 클럽 생성

```sql
-- 1. 사용자 회원가입 (Supabase Auth)
-- 2. user_profiles 생성
INSERT INTO user_profiles (id, email, full_name)
VALUES (auth.uid(), 'user@example.com', '홍길동');

-- 3. 클럽 생성
INSERT INTO clubs (name, description, code, owner_id)
VALUES (
  '서울 테니스 클럽',
  '서울 지역 테니스 동아리',
  upper(substring(md5(random()::text) from 1 for 8)),
  auth.uid()
)
RETURNING id, code;
-- club_members에 owner로 자동 추가됨 (트리거)
```

### 클럽 가입

```sql
-- 클럽 코드로 가입
INSERT INTO club_members (club_id, user_id, role)
SELECT id, auth.uid(), 'member'
FROM clubs
WHERE code = 'ABC12345';
```

### 클럽별 데이터 조회

```sql
-- 현재 사용자가 속한 클럽의 회원 목록
SELECT m.*
FROM members m
JOIN club_members cm ON cm.club_id = m.club_id
WHERE cm.user_id = auth.uid()
AND m.club_id = 1; -- 현재 선택된 클럽 ID
```

---

## 인덱스

성능 최적화를 위한 인덱스:

- `clubs`: `code`, `owner_id`
- `club_members`: `club_id`, `user_id`
- `members`: `club_id`, `user_id`, `(club_id, is_active)`
- `schedules`: `club_id`, `date`, `(club_id, date)`
- `attendances`: `schedule_id`, `member_id`
- `matches`: `schedule_id`
- `constraints`: `schedule_id`

---

## 트리거

### 자동 업데이트 트리거
- `updated_at` 필드를 자동으로 업데이트

### 클럽 소유자 자동 추가
- 클럽 생성 시 소유자를 `club_members`에 자동으로 추가

---

## 다음 단계

1. ✅ 데이터베이스 스키마 완료
2. ⏭️ Supabase Auth 설정
3. ⏭️ 인증 UI 구현
4. ⏭️ 클럽 관리 UI 구현
5. ⏭️ 기존 기능을 클럽별로 동작하도록 수정





