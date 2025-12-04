# 테니스 동아리 스케줄 관리 시스템 - 개발 플랜

**작성일**: 2024-12-04
**최종 수정일**: 2024-12-05
**현재 상태**: ✅ **멀티 클럽 MVP + 공개 기능 완료!**
**아키텍처**: Frontend (React 18 + TypeScript) + Supabase + PWA

---

## 🎉 Phase 1 MVP 완료! ✅

### 1. 프로젝트 초기 설정
- [x] React 19 + TypeScript + Vite 프로젝트 생성
- [x] Tailwind CSS 3.x 설정
- [x] shadcn/ui 설치 및 설정
- [x] Supabase 클라이언트 설정
- [x] 라우팅 설정 (react-router-dom)
- [x] 기본 레이아웃 구성 (Layout.tsx)
- [x] 홈페이지 디자인 완성 (Home.tsx)

### 2. Supabase 데이터베이스
- [x] members 테이블 생성
- [x] schedules 테이블 생성
- [x] attendances 테이블 생성
- [x] matches 테이블 생성
- [x] constraints 테이블 생성 (Phase 2 준비 완료)

### 3. 서비스 레이어 (Backend API)
- [x] memberService.ts 구현 (CRUD 완료)
- [x] scheduleService.ts 구현 (스케줄, 참석자, 경기 CRUD)
- [x] attendanceService.ts 구현

### 4. 핵심 기능 구현
- [x] 회원 관리 페이지 (MemberManagement.tsx)
- [x] 스케줄 생성 페이지 (ScheduleCreation.tsx)
- [x] 참석자 선택 컴포넌트 (AttendeeSelector.tsx)
- [x] 게스트 추가 컴포넌트 (GuestInput.tsx)
- [x] 스케줄 생성 알고리즘 (scheduleGenerator.ts)
  - 6경기, 2코트, 4명씩 자동 배정
  - 균등 분배 로직
  - 제약조건 지원 (마지막 경기 제외, 파트너 페어, 특정 경기 제외)
- [x] 경기 스케줄 표시 및 편집 (ScheduleGenerator.tsx)
- [x] 드래그 앤 드롭 선수 교체 (DraggableMatchCard.tsx)
- [x] 스케줄 기록 조회 (ScheduleHistory.tsx)

---

## 🎯 Phase 1 완료: 지금 사용 가능한 기능들!

애플리케이션이 **http://localhost:5174**에서 실행 중입니다!

### 1. 회원 관리 (/members)
- ✅ 회원 등록, 수정, 삭제
- ✅ shadcn/ui Table 컴포넌트로 깔끔한 UI
- ✅ 회원별 상태 관리 (활성/비활성)
- ✅ 검색 및 필터링

### 2. 새 스케줄 만들기 (/schedule/new)
- ✅ 날짜 선택
- ✅ 회원 체크박스로 참석자 선택
- ✅ 게스트 추가 기능
- ✅ 참석자 8-12명 제한

### 3. 스케줄 자동 생성 (/schedule/:id/generate)
- ✅ 6경기 자동 배정 (30분씩)
- ✅ 2코트(A, B) 동시 진행
- ✅ 균등 분배 알고리즘
- ✅ 드래그 앤 드롭으로 선수 교체
- ✅ 스케줄 재생성 버튼
- ✅ 제약조건 지원 (알고리즘에 이미 구현됨!)
  - 마지막 경기 제외
  - 파트너 페어 지정
  - 특정 경기 제외

### 4. 기록 보기 (/history)
- ✅ 월별 스케줄 조회
- ✅ 년도/월 선택 필터
- ✅ 경기 상태 표시 (예정/완료/취소)
- ✅ 통계 요약 (총 경기 수, 완료, 예정)

---

## 📝 Phase 1 완료 체크리스트

### ✅ Step 1: 회원 관리 완성
- [x] MemberManagement.tsx (shadcn/ui Table)
- [x] memberService.ts (CRUD)

### ✅ Step 2: 참석자 선택 UI
- [x] schedules, attendances 테이블 생성
- [x] scheduleService.ts, attendanceService.ts
- [x] ScheduleCreation.tsx
- [x] AttendeeSelector.tsx, GuestInput.tsx

### ✅ Step 3: 스케줄 자동 생성 알고리즘
- [x] matches 테이블 생성
- [x] scheduleGenerator.ts (핵심 알고리즘)
- [x] 제약조건 지원 (마지막 경기 제외, 파트너 페어, 특정 경기 제외)
- [x] 균등 분배 및 연속 경기 최소화 로직

### ✅ Step 4: 경기 스케줄 표시 및 수정
- [x] ScheduleGenerator.tsx
- [x] DraggableMatchCard.tsx
- [x] @dnd-kit을 이용한 드래그 앤 드롭
- [x] 스케줄 재생성 기능

### ✅ Step 5: 스케줄 기록 조회
- [x] ScheduleHistory.tsx
- [x] 월별 필터링
- [x] 통계 표시

---

## 🧪 테스트 시나리오 (Phase 1 완료 확인)

### 시나리오 1: 회원 등록부터 스케줄 생성까지
1. ✅ http://localhost:5174/members에서 10명의 회원 등록
2. ✅ "새 스케줄 만들기" 클릭
3. ✅ 날짜 선택: 이번 주 토요일
4. ✅ 참석자 8명 선택
5. ✅ "스케줄 생성" 클릭
6. ✅ 6경기 자동 배정 확인
7. ✅ 드래그 앤 드롭으로 선수 교체
8. ✅ 저장 버튼 클릭
9. ✅ 기록 보기에서 저장된 스케줄 확인

---

## 🚀 다음 단계: Phase 2 (선택사항)

**Phase 2는 선택적 고급 기능입니다. MVP는 이미 완성되었습니다!**

### Phase 2-1: 제약조건 설정 UI (2일)
제약조건 로직은 이미 구현되어 있으며, UI만 추가하면 됩니다.

**필요한 작업**:
- [ ] ConstraintPanel.tsx 컴포넌트 작성
- [ ] ScheduleCreation.tsx에 제약조건 섹션 추가
- [ ] 제약조건 선택 UI:
  - 마지막 경기 제외 회원 선택 (드롭다운)
  - 파트너 페어 지정 (회원 2명 선택)
  - 특정 경기 제외 (회원 + 경기 번호 선택)

**파일**:
```
frontend/src/components/ConstraintPanel.tsx (신규)
frontend/src/pages/ScheduleCreation.tsx     (수정)
```

### Phase 2-2: 회원별 통계 (1일)
- [ ] MemberStats.tsx 컴포넌트
- [ ] 회원별 참석 횟수 조회
- [ ] 경기 참여 횟수
- [ ] 참석률 계산 및 그래프

### Phase 2-3: 스케줄 상세 페이지 (1일)
- [ ] ScheduleView.tsx 페이지
- [ ] 저장된 스케줄 조회 및 수정
- [ ] 경기 결과 기록 (선택사항)

---

## 📱 Phase 3: 사용자 경험 개선 ✅ 완료!

### 1. 모바일 최적화 ✅
- [x] 반응형 디자인 개선 (모든 페이지에 sm:, md: 브레이크포인트 적용)
- [x] 터치 제스처 지원 (PointerSensor distance 조정으로 모바일 반응성 향상)
- [x] 모바일 네비게이션 개선 (이미 Layout.tsx에 구현됨)

### 2. 공유 기능 ✅
- [x] 카카오톡 공유 API (ShareButton 컴포넌트에 구현)
- [x] 링크 복사 (ShareButton에 구현)
- [x] 스케줄 이미지 다운로드 (html2canvas 사용, ScheduleGenerator에 추가)

### 3. PWA 지원 ✅
- [x] Service Worker (vite-plugin-pwa로 자동 생성)
- [x] 오프라인 모드 (Workbox로 캐싱 전략 구현)
- [x] 홈 화면 추가 (manifest.json 설정 완료)

---

## 📊 프로젝트 진행 상태

| Phase | 상태 | 완료율 | 비고 |
|-------|------|--------|------|
| Phase 0: 멀티 클럽 기반 | ✅ 완료 | 100% | RLS 정책 수정 완료 |
| Phase 1: MVP | ✅ 완료 | 100% | 모든 핵심 기능 구현 완료 |
| Phase 2: 고급 기능 | 🔄 부분 완료 | 30% | 알고리즘 완료, UI 필요 |
| Phase 3: UX 개선 | ✅ 완료 | 100% | 모바일, 공유, PWA 완료 |
| 추가 기능 | ✅ 완료 | 100% | 공개 기능, OAuth 완료 |

---

## 🎯 현재 상태 요약

**✅ 완료된 것**:
- 멀티 클럽 지원 (클럽 생성, 가입, 전환)
- 인증 시스템 (이메일/비밀번호, 구글 OAuth)
- 회원 관리 (CRUD, 성별 정보, 실력 레벨)
- 스케줄 생성 및 자동 배정 (경기 타입별 필터링)
- 드래그 앤 드롭 선수 교체
- 스케줄 기록 조회
- 공개 스케줄 링크 기능
- 모바일 최적화
- 공유 기능 (카카오톡, 링크 복사, 이미지 다운로드)
- PWA 지원
- 제약조건 알고리즘 (UI 없이 백엔드 완료)

**🔄 다음에 할 수 있는 것**:
- 제약조건 설정 UI 추가 (우선순위 높음)
- 회원별 통계 페이지 개선
- 스케줄 상세 페이지 개선
- 캘린더 뷰로 기록 조회

**🚀 배포 가능 상태**: YES! MVP 완료로 즉시 사용 가능합니다.

---

**문서 버전**: v3.0 (멀티 클럽 + 공개 기능 완료)
**최종 수정일**: 2024-12-05
**상세 현황**: `PROJECT_STATUS.md` 참고
