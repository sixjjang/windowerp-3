#!/bin/bash

# 🚀 ERP 실전 운영 서버 시작 스크립트

echo "=== ERP 실전 운영 서버 시작 ==="
echo "시작 시간: $(date)"
echo ""

# 1. 환경변수 확인
if [ ! -f ".env.production" ]; then
    echo "❌ .env.production 파일이 없습니다."
    echo "다음 내용으로 .env.production 파일을 생성하세요:"
    echo ""
    echo "NODE_ENV=production"
    echo "PORT=4000"
    echo "JWT_SECRET=your-super-secure-jwt-secret-key-here"
    echo "DATABASE_PATH=./database.db"
    echo "ALLOWED_ORIGINS=https://windowerp-3.firebaseapp.com,https://windowerp-3.web.app"
    echo ""
    exit 1
fi

# 2. 백엔드 디렉토리로 이동
cd backend

# 3. 의존성 설치 확인
if [ ! -d "node_modules" ]; then
    echo "📦 의존성 설치 중..."
    npm install
fi

# 4. PM2 프로세스 중지 (이미 실행 중인 경우)
echo "🛑 기존 프로세스 중지 중..."
pm2 stop windowerp-backend 2>/dev/null || true
pm2 delete windowerp-backend 2>/dev/null || true

# 5. 로그 디렉토리 생성
mkdir -p logs

# 6. 서버 시작
echo "🚀 ERP 백엔드 서버 시작 중..."
pm2 start ecosystem.config.js --env production

# 7. 상태 확인
echo ""
echo "📊 서버 상태 확인:"
pm2 status

echo ""
echo "📋 로그 확인 명령어:"
echo "pm2 logs windowerp-backend"
echo "pm2 monit"

echo ""
echo "🌐 외부 접속 테스트:"
echo "API: http://your-domain.com:4000"
echo "WebSocket: ws://your-domain.com:4001"

echo ""
echo "✅ ERP 실전 운영 서버가 시작되었습니다!"
echo "Firebase Hosting: https://windowerp-3.firebaseapp.com" 