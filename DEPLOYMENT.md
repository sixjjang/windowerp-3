# WindowERP NAS 배포 가이드

## 1. 시놀로지 NAS 준비사항

### 필수 패키지 설치
- Node.js (최신 LTS 버전)
- PM2 (프로세스 관리자)

### SSH 접속 후 패키지 설치
```bash
# Node.js 설치 (시놀로지 패키지 센터에서)
# 또는 SSH로 직접 설치
curl -fsSL https://deb.nodesource.com/setup_lts.x | sudo -E bash -
sudo apt-get install -y nodejs

# PM2 설치
npm install -g pm2
```

## 2. 프로젝트 배포

### 2.1 프로젝트 업로드
```bash
# NAS의 원하는 디렉토리에 프로젝트 업로드
# 예: /volume1/web/windowerp
cd /volume1/web/windowerp
```

### 2.2 백엔드 설정
```bash
cd backend
npm install

# 환경 변수 설정
cp .env.example .env
# .env 파일 편집하여 실제 값 설정
```

### 2.3 환경 변수 설정 (.env)
```env
NODE_ENV=production
PORT=4000
DATABASE_PATH=/volume1/web/windowerp/backend/database.db
JWT_SECRET=your-very-secure-jwt-secret-key-here
```

### 2.4 PM2로 서버 시작
```bash
# PM2 설정 파일 수정 (ecosystem.config.js)
# JWT_SECRET을 실제 값으로 변경

# 서버 시작
pm2 start ecosystem.config.js --env production

# 서버 상태 확인
pm2 status

# 로그 확인
pm2 logs windowerp-backend
```

## 3. 프론트엔드 빌드 및 배포

### 3.1 환경 변수 설정
```bash
cd ../
# .env 파일 생성
echo "REACT_APP_API_URL=http://your-nas-ip:4000" > .env
```

### 3.2 빌드
```bash
npm install
npm run build
```

### 3.3 웹 서버 설정
- 시놀로지 Web Station 활성화
- 가상 호스트 설정
  - 포트: 80 (또는 원하는 포트)
  - 문서 루트: `/volume1/web/windowerp/build`
  - 백엔드 프록시: `/api` → `http://localhost:4000`

## 4. 방화벽 및 보안 설정

### 4.1 포트 설정
- 80: HTTP (웹 서버)
- 4000: 백엔드 API (내부 접근만)
- 22: SSH (필요시)

### 4.2 HTTPS 설정 (권장)
- Let's Encrypt 인증서 발급
- Web Station에서 HTTPS 활성화

## 5. 서비스 관리

### 5.1 PM2 명령어
```bash
# 서버 재시작
pm2 restart windowerp-backend

# 서버 중지
pm2 stop windowerp-backend

# 서버 시작
pm2 start windowerp-backend

# 로그 확인
pm2 logs windowerp-backend

# 모니터링
pm2 monit
```

### 5.2 자동 시작 설정
```bash
# PM2 시작 스크립트 생성
pm2 startup

# 현재 프로세스 저장
pm2 save
```

## 6. 백업 및 유지보수

### 6.1 데이터베이스 백업
```bash
# SQLite 데이터베이스 백업
cp /volume1/web/windowerp/backend/database.db /volume1/backup/windowerp_$(date +%Y%m%d).db
```

### 6.2 로그 관리
```bash
# 로그 로테이션 설정
pm2 install pm2-logrotate
```

## 7. 문제 해결

### 7.1 서버가 시작되지 않는 경우
```bash
# 로그 확인
pm2 logs windowerp-backend

# 수동으로 서버 시작하여 오류 확인
cd backend
node index.js
```

### 7.2 데이터베이스 오류
```bash
# 데이터베이스 파일 권한 확인
ls -la database.db

# 권한 수정
chmod 644 database.db
```

### 7.3 포트 충돌
```bash
# 포트 사용 확인
netstat -tulpn | grep :4000

# 다른 포트로 변경
# ecosystem.config.js에서 PORT 수정
```

## 8. 업데이트 방법

### 8.1 백엔드 업데이트
```bash
cd /volume1/web/windowerp/backend
git pull  # 또는 새 파일 업로드
npm install
pm2 restart windowerp-backend
```

### 8.2 프론트엔드 업데이트
```bash
cd /volume1/web/windowerp
git pull  # 또는 새 파일 업로드
npm install
npm run build
# Web Station에서 새 빌드 파일 사용
``` 