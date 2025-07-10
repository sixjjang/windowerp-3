# 🚀 ERP 실전 운영 체크리스트

## 📋 사전 준비사항

### 1. 시놀로지 NAS 설정
- [ ] DDNS 설정 (no-ip, dyndns 등)
- [ ] 포트 포워딩 설정 (4000, 4001)
- [ ] SSL 인증서 적용
- [ ] 방화벽 설정 확인

### 2. 백엔드 서버 설정
- [ ] PM2 프로세스 관리 설정
- [ ] 환경변수 설정 (.env.production)
- [ ] 로그 파일 설정
- [ ] 데이터베이스 백업 설정

### 3. 프론트엔드 설정
- [ ] Firebase Hosting 배포 확인
- [ ] 환경변수 설정 (REACT_APP_API_BASE, REACT_APP_WS_BASE)
- [ ] CORS 설정 확인

## 🔧 즉시 실행 가능한 설정

### 1. 시놀로지 NAS에서 실행
```bash
# 백엔드 서버 시작
cd backend
npm install
pm2 start ecosystem.config.js --env production

# 상태 확인
pm2 status
pm2 logs windowerp-backend
```

### 2. 환경변수 설정
```bash
# .env.production 파일 생성
NODE_ENV=production
PORT=4000
JWT_SECRET=your-super-secure-jwt-secret-key-here
DATABASE_PATH=./database.db
ALLOWED_ORIGINS=https://windowerp-3.firebaseapp.com,https://windowerp-3.web.app
```

### 3. 프론트엔드 환경변수
```bash
# .env.production 파일 생성
REACT_APP_API_BASE=https://your-domain.com:4000
REACT_APP_WS_BASE=wss://your-domain.com:4001
```

## 🧪 테스트 체크리스트

### 1. 기본 기능 테스트
- [ ] 로그인/로그아웃
- [ ] 일정 관리 (생성, 수정, 삭제)
- [ ] 견적서 관리
- [ ] 고객 관리
- [ ] 파일 업로드/다운로드

### 2. 실시간 기능 테스트
- [ ] WebSocket 연결 확인
- [ ] 실시간 알림 기능
- [ ] 다중 사용자 동시 접속

### 3. 성능 테스트
- [ ] 동시 접속자 테스트
- [ ] 대용량 데이터 처리
- [ ] 파일 업로드 속도

## 🔒 보안 체크리스트

### 1. 인증/인가
- [ ] JWT 토큰 보안
- [ ] 사용자 권한 관리
- [ ] 세션 관리

### 2. 데이터 보안
- [ ] 데이터베이스 백업
- [ ] 파일 저장소 보안
- [ ] API 엔드포인트 보안

## 📊 모니터링 체크리스트

### 1. 서버 모니터링
- [ ] CPU/메모리 사용량
- [ ] 디스크 사용량
- [ ] 네트워크 트래픽

### 2. 애플리케이션 모니터링
- [ ] 에러 로그 모니터링
- [ ] 성능 지표 수집
- [ ] 사용자 활동 로그

## 🚨 문제 해결 가이드

### 1. WebSocket 연결 실패
```bash
# 포트 확인
netstat -tulpn | grep 4001

# 방화벽 설정 확인
sudo ufw status
```

### 2. API 연결 실패
```bash
# 서버 상태 확인
pm2 status
pm2 logs windowerp-backend

# 포트 확인
netstat -tulpn | grep 4000
```

### 3. 데이터베이스 오류
```bash
# 데이터베이스 파일 확인
ls -la database.db*

# 백업 복원
cp database.db.backup database.db
```

## 🔄 백업/복구 계획

### 1. 자동 백업 설정
```bash
# crontab에 백업 스크립트 추가
0 2 * * * /path/to/backup-script.sh
```

### 2. 수동 백업
```bash
# 데이터베이스 백업
cp database.db database.db.backup.$(date +%Y%m%d_%H%M%S)

# 업로드 파일 백업
tar -czf uploads-backup-$(date +%Y%m%d_%H%M%S).tar.gz uploads/
```

## 📈 확장 계획

### 1. 단기 (1-3개월)
- [ ] Firebase Functions로 백엔드 마이그레이션
- [ ] Firestore 데이터베이스 도입
- [ ] Firebase Storage 파일 저장소 도입

### 2. 중기 (3-6개월)
- [ ] 실시간 알림 시스템 개선
- [ ] 모바일 앱 개발
- [ ] API 성능 최적화

### 3. 장기 (6개월 이상)
- [ ] 마이크로서비스 아키텍처 도입
- [ ] AI/ML 기능 추가
- [ ] 외부 시스템 연동 