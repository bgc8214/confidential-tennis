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

### Backend
- Node.js + Express + TypeScript
- PostgreSQL
- node-postgres (pg)

## 프로젝트 구조

```
confidential-tennis/
├── frontend/        # React 프론트엔드
├── backend/         # Express 백엔드
├── database/        # DB 스키마 및 설정
├── docs/           # 문서
├── prd.md          # 프로젝트 요구사항 문서
└── claude.md       # 개발 가이드
```

## 설치 및 실행

### 1. 데이터베이스 설정

PostgreSQL 설치:
```bash
# macOS
brew install postgresql@15
brew services start postgresql@15

# Ubuntu/Debian
sudo apt install postgresql postgresql-contrib
sudo systemctl start postgresql
```

데이터베이스 생성 및 스키마 적용:
```bash
# PostgreSQL 접속
psql postgres

# 데이터베이스 생성
CREATE DATABASE tennis_club;
\c tennis_club

# 스키마 적용
\i database/schema.sql
```

또는:
```bash
psql -U postgres -d tennis_club -f database/schema.sql
```

자세한 설명은 [database/README.md](database/README.md)를 참고하세요.

### 2. 백엔드 설정

```bash
cd backend

# 의존성 설치
npm install

# 환경 변수 설정
cp .env.example .env
# .env 파일을 열어 DATABASE_URL 등을 설정

# 개발 서버 실행
npm run dev
```

백엔드는 기본적으로 `http://localhost:3000`에서 실행됩니다.

### 3. 프론트엔드 설정

```bash
cd frontend

# 의존성 설치
npm install

# 개발 서버 실행
npm run dev
```

프론트엔드는 기본적으로 `http://localhost:5173`에서 실행됩니다.

## 개발 가이드

상세한 개발 가이드는 [claude.md](claude.md)를 참고하세요.

### 개발 단계

#### Phase 1 (MVP - 4주)
- [x] 프로젝트 초기 설정
- [ ] 회원 관리 (CRUD)
- [ ] 참석자 선택 UI
- [ ] 기본 스케줄 자동 생성 알고리즘
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

## API 엔드포인트

### Members
```
GET    /api/members           # 전체 회원 조회
GET    /api/members/:id       # 특정 회원 조회
POST   /api/members           # 회원 등록
PUT    /api/members/:id       # 회원 수정
DELETE /api/members/:id       # 회원 삭제
```

### Schedules
```
GET    /api/schedules              # 스케줄 목록
GET    /api/schedules/:id          # 특정 스케줄 조회
POST   /api/schedules              # 스케줄 생성
PUT    /api/schedules/:id          # 스케줄 수정
DELETE /api/schedules/:id          # 스케줄 삭제
```

### Matches
```
POST   /api/matches/generate       # 스케줄 자동 생성
GET    /api/matches/:scheduleId    # 스케줄별 경기 조회
PUT    /api/matches/:id            # 경기 수정
```

상세한 API 문서는 추후 추가 예정입니다.

## 테스트

```bash
# Backend
cd backend
npm test

# Frontend
cd frontend
npm test
```

## 배포

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
**현재 버전**: v0.1.0 (초기 설정 완료)
