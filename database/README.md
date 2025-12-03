# Database Setup

## PostgreSQL 설치

### macOS
```bash
brew install postgresql@15
brew services start postgresql@15
```

### Ubuntu/Debian
```bash
sudo apt update
sudo apt install postgresql postgresql-contrib
sudo systemctl start postgresql
```

## 데이터베이스 생성 및 스키마 적용

```bash
# PostgreSQL 접속
psql postgres

# 데이터베이스 생성
CREATE DATABASE tennis_club;

# 사용자 생성 (선택사항)
CREATE USER tennis_admin WITH PASSWORD 'your_password';
GRANT ALL PRIVILEGES ON DATABASE tennis_club TO tennis_admin;

# 데이터베이스 선택
\c tennis_club

# 스키마 적용
\i schema.sql
```

또는 터미널에서 직접:
```bash
psql -U postgres -d tennis_club -f schema.sql
```

## 환경 변수 설정

backend/.env 파일에 다음 내용 추가:
```
DATABASE_URL=postgresql://username:password@localhost:5432/tennis_club
```

## 테이블 구조 확인

```bash
psql -U postgres -d tennis_club

\dt              # 테이블 목록
\d members       # members 테이블 구조
\d schedules     # schedules 테이블 구조
```
