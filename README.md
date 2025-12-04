# 테니스 동아리 경기 스케줄 관리 시스템

매주 토요일 테니스 동아리 경기의 복식 스케줄을 자동으로 생성하고 관리하는 웹 애플리케이션입니다.

## 주요 기능

- 동아리 회원 관리
- 주간 참석자 선택 및 게스트 추가
- 6경기 복식 스케줄 자동 생성
- 제약조건 설정 (마지막 경기 제외, 파트너 지정 등)
- 실시간 스케줄 수정
- 과거 경기 기록 조회

## 기술 스택

### Frontend
- React 18 + TypeScript
- Vite
- Tailwind CSS
- Supabase Client

### Backend
- Supabase (PostgreSQL + REST API)

### 배포
- Frontend: GitHub Pages (https://bgc8214.github.io/confidential-tennis/)
- Backend/DB: Supabase (무료)

## 프로젝트 구조

```
confidential-tennis/
├── frontend/           # React 프론트엔드
│   ├── src/
│   │   ├── lib/       # Supabase 클라이언트
│   │   ├── services/  # API 서비스 레이어
│   │   ├── utils/     # 스케줄 생성 알고리즘
│   │   ├── types/     # TypeScript 타입
│   │   ├── components/# React 컴포넌트
│   │   └── pages/     # 페이지 컴포넌트
├── database/          # DB 스키마 및 설정
├── prd.md            # 프로젝트 요구사항 문서
└── claude.md         # 개발 가이드
```

## 설치 및 실행

### 1. Supabase 프로젝트 설정

1. [Supabase](https://supabase.com) 가입
2. 새 프로젝트 생성 (`tennis-club-schedule`)
3. SQL Editor에서 `database/schema.sql` 실행
4. Settings → API에서 URL과 anon key 복사

자세한 설명은 [database/supabase-setup.md](database/supabase-setup.md)를 참고하세요.

### 2. 프론트엔드 설정

```bash
cd frontend

# 의존성 설치
npm install

# 환경 변수 설정
cp .env.example .env
# .env 파일에 Supabase URL과 Key 입력

# 개발 서버 실행
npm run dev
```

프론트엔드는 기본적으로 `http://localhost:5173`에서 실행됩니다.

## 개발 가이드

상세한 개발 가이드는 [claude.md](claude.md)를 참고하세요.

### 개발 단계

#### Phase 1 (MVP - 4주)
- [x] 프로젝트 초기 설정
- [x] Supabase 전환
- [x] 스케줄 생성 알고리즘 구현
- [ ] 회원 관리 UI
- [ ] 참석자 선택 UI
- [ ] 스케줄 표시 화면
- [ ] 스케줄 저장 및 조회

#### Phase 2 (2주)
- [ ] 제약조건 설정 기능
- [ ] 게스트 추가 기능
- [ ] 실시간 스케줄 수정 (드래그 앤 드롭)

#### Phase 3 (2주)
- [ ] 캘린더 뷰로 기록 조회
- [ ] 회원별 참석 통계
- [ ] 모바일 최적화
- [ ] 공유 기능 (카카오톡/링크)

## 주요 서비스 레이어

### Member Service
```typescript
import { memberService } from './services/memberService';

// 전체 회원 조회
const members = await memberService.getAll();

// 회원 등록
const newMember = await memberService.create({
  name: '홍길동',
  phone: '010-1234-5678',
  is_active: true
});
```

### Schedule Service
```typescript
import { scheduleService } from './services/scheduleService';

// 스케줄 생성
const schedule = await scheduleService.create({
  date: '2024-12-07',
  start_time: '10:00',
  end_time: '13:00',
  status: 'planned'
});

// 참석자 등록
await scheduleService.addAttendances(schedule.id, [
  { member_id: 1, is_guest: false },
  { guest_name: '김게스트', is_guest: true }
]);
```

### Schedule Generation
```typescript
import { generateSchedule, convertMatchesToDbFormat } from './utils/scheduleGenerator';

// 스케줄 자동 생성
const generatedMatches = generateSchedule({
  attendees,
  constraints,
  startTime: '10:00'
});

// DB 형식으로 변환 후 저장
const dbMatches = convertMatchesToDbFormat(generatedMatches, scheduleId);
await scheduleService.addMatches(dbMatches);
```

## 테스트

```bash
cd frontend
npm test
```

## 배포

### Frontend (GitHub Pages)

이 프로젝트는 GitHub Actions를 통해 자동으로 배포됩니다.

1. **GitHub Secrets 설정** (Settings → Secrets and variables → Actions):
   - `VITE_SUPABASE_URL`: Supabase 프로젝트 URL
   - `VITE_SUPABASE_ANON_KEY`: Supabase anon key

2. **자동 배포**:
   - `main` 브랜치에 푸시하면 자동으로 빌드 및 배포됩니다
   - GitHub Actions 워크플로우: `.github/workflows/deploy.yml`

3. **GitHub Pages 설정** (Settings → Pages):
   - Source: GitHub Actions

**배포 URL**: https://bgc8214.github.io/confidential-tennis/

### 수동 배포 (로컬)
```bash
cd frontend
npm run build
# dist 폴더를 직접 배포 서버에 업로드
```

### Supabase 설정
- Supabase Dashboard에서 Production 환경 확인
- RLS(Row Level Security) 정책 설정 (선택사항)
- 환경 변수 확인 및 업데이트

## 기여 방법

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 라이선스

이 프로젝트는 개인 프로젝트로, 상업적 사용을 금지합니다.

## 연락처

문의사항이 있으시면 이슈를 등록해 주세요.

---

**프로젝트 시작일**: 2024-12-03
**현재 버전**: v0.2.0 (Supabase 전환 완료)
**아키텍처**: Frontend-only with Supabase
