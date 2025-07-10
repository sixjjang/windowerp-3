# 🚀 GitHub & Firebase 배포 가이드

이 가이드는 Windowerp-3 프로젝트를 GitHub에 업로드하고 Firebase 호스팅을 통해 배포하는 방법을 설명합니다.

## 📋 사전 준비사항

### 1. GitHub 계정 및 저장소
- GitHub 계정이 필요합니다
- 새로운 저장소를 생성하세요

### 2. Firebase 계정 및 프로젝트
- Firebase 계정이 필요합니다
- Firebase 콘솔에서 새 프로젝트를 생성하세요

### 3. Node.js 및 npm
- Node.js 16 이상이 설치되어 있어야 합니다

## 🔧 1단계: GitHub 저장소 설정

### 1.1 GitHub에서 새 저장소 생성
1. GitHub.com에 로그인
2. "New repository" 클릭
3. 저장소 이름: `windowerp-3`
4. Public 또는 Private 선택
5. README, .gitignore, license는 체크하지 않음 (이미 있음)
6. "Create repository" 클릭

### 1.2 로컬 Git 저장소 초기화
```bash
# 프로젝트 디렉토리에서
git init
git add .
git commit -m "Initial commit: Windowerp-3 ERP system"
```

### 1.3 GitHub 저장소 연결
```bash
git remote add origin https://github.com/YOUR_USERNAME/windowerp-3.git
git branch -M main
git push -u origin main
```

## 🔥 2단계: Firebase 프로젝트 설정

### 2.1 Firebase CLI 설치
```bash
npm install -g firebase-tools
```

### 2.2 Firebase 로그인
```bash
firebase login
```

### 2.3 Firebase 프로젝트 초기화
```bash
firebase init hosting
```

초기화 과정에서 다음을 선택하세요:
- **프로젝트 선택**: Firebase 콘솔에서 생성한 프로젝트 선택
- **Public directory**: `build` (React 빌드 폴더)
- **Single-page app**: `Yes` (React Router 사용)
- **Overwrite index.html**: `No` (기존 파일 유지)

### 2.4 .firebaserc 파일 업데이트
생성된 `.firebaserc` 파일에서 프로젝트 ID를 확인하고 필요시 수정:
```json
{
  "projects": {
    "default": "your-actual-firebase-project-id"
  }
}
```

## 🏗️ 3단계: 프로덕션 빌드 및 배포

### 3.1 프로덕션 빌드
```bash
npm run build
```

### 3.2 Firebase 배포
```bash
firebase deploy
```

또는 npm 스크립트 사용:
```bash
npm run deploy
```

## 🔄 4단계: 자동화된 배포 설정 (선택사항)

### 4.1 GitHub Actions 설정
`.github/workflows/deploy.yml` 파일 생성:

```yaml
name: Deploy to Firebase

on:
  push:
    branches: [ main ]

jobs:
  build_and_deploy:
    runs-on: ubuntu-latest
    
    steps:
    - uses: actions/checkout@v3
    
    - name: Setup Node.js
      uses: actions/setup-node@v3
      with:
        node-version: '18'
        cache: 'npm'
    
    - name: Install dependencies
      run: npm ci
    
    - name: Build
      run: npm run build
    
    - name: Deploy to Firebase
      uses: FirebaseExtended/action-hosting-deploy@v0
      with:
        repoToken: '${{ secrets.GITHUB_TOKEN }}'
        firebaseServiceAccount: '${{ secrets.FIREBASE_SERVICE_ACCOUNT }}'
        channelId: live
        projectId: your-firebase-project-id
```

## 🌐 5단계: 백엔드 배포 고려사항

### 5.1 백엔드 호스팅 옵션
현재 백엔드는 로컬에서 실행되므로, 프로덕션 환경에서는 다음 중 하나를 선택해야 합니다:

1. **Heroku** - 간단한 배포
2. **Railway** - 무료 티어 제공
3. **Render** - 무료 티어 제공
4. **Vercel** - 서버리스 함수
5. **Firebase Functions** - 서버리스 함수

### 5.2 환경 변수 설정
프로덕션 환경에서 필요한 환경 변수:
```env
JWT_SECRET=your_secure_jwt_secret
NODE_ENV=production
PORT=3000
DATABASE_URL=your_database_url
```

## 🔧 6단계: 도메인 설정 (선택사항)

### 6.1 커스텀 도메인 연결
1. Firebase 콘솔 → Hosting → Custom domains
2. "Add custom domain" 클릭
3. 도메인 입력 및 DNS 설정

### 6.2 SSL 인증서
Firebase는 자동으로 SSL 인증서를 제공합니다.

## 🚨 주의사항

### 보안 고려사항
1. **환경 변수**: 민감한 정보는 환경 변수로 관리
2. **API 키**: 클라이언트 사이드에 노출되지 않도록 주의
3. **데이터베이스**: 프로덕션용 데이터베이스 사용

### 성능 최적화
1. **이미지 최적화**: WebP 형식 사용
2. **코드 분할**: React.lazy() 사용
3. **캐싱**: 적절한 캐시 헤더 설정

## 🔍 문제 해결

### 일반적인 문제들

#### 1. 빌드 실패
```bash
# 의존성 재설치
rm -rf node_modules package-lock.json
npm install
```

#### 2. Firebase 배포 실패
```bash
# Firebase 캐시 클리어
firebase logout
firebase login
firebase use --clear
firebase use your-project-id
```

#### 3. CORS 오류
백엔드에서 CORS 설정 확인:
```javascript
app.use(cors({
  origin: ['https://your-firebase-app.web.app', 'http://localhost:3000'],
  credentials: true
}));
```

## 📞 지원

문제가 발생하면:
1. Firebase 콘솔의 로그 확인
2. GitHub Actions 로그 확인
3. 브라우저 개발자 도구 콘솔 확인

## 🔄 업데이트 배포

코드 변경 후 배포:
```bash
git add .
git commit -m "Update description"
git push origin main
# GitHub Actions가 자동으로 배포하거나
npm run deploy
``` 