# 🔥 Firebase 서비스 활성화 가이드

## 📋 현재 상태

✅ **완료된 작업**
- Firebase CLI 설치 및 로그인
- 프로젝트 초기화 (firebase.json, firestore.rules, storage.rules)
- Functions 코드 작성 (functions/index.js)
- Firebase SDK 설치
- 에뮬레이터 설정

⚠️ **필요한 작업**
- Firebase 콘솔에서 서비스 활성화
- Blaze 플랜 업그레이드 (Functions 사용 시)
- 환경 변수 설정

## 🚀 Firebase 콘솔에서 서비스 활성화

### 1단계: Firebase 콘솔 접속
1. https://console.firebase.google.com 접속
2. **windowerp-3** 프로젝트 선택

### 2단계: Firestore Database 활성화
1. 왼쪽 메뉴에서 **Firestore Database** 클릭
2. **데이터베이스 만들기** 클릭
3. **테스트 모드에서 시작** 선택
4. **다음** 클릭
5. 위치 선택 (asia-northeast3 권장)
6. **완료** 클릭

### 3단계: Storage 활성화
1. 왼쪽 메뉴에서 **Storage** 클릭
2. **시작하기** 클릭
3. **테스트 모드에서 시작** 선택
4. **다음** 클릭
5. 위치 선택 (asia-northeast3 권장)
6. **완료** 클릭

### 4단계: Authentication 활성화
1. 왼쪽 메뉴에서 **Authentication** 클릭
2. **시작하기** 클릭
3. **로그인 방법** 탭에서 **이메일/비밀번호** 활성화
4. **저장** 클릭

### 5단계: Realtime Database 활성화
1. 왼쪽 메뉴에서 **Realtime Database** 클릭
2. **데이터베이스 만들기** 클릭
3. **테스트 모드에서 시작** 선택
4. 위치 선택 (asia-northeast3 권장)
5. **완료** 클릭

## 💳 Blaze 플랜 업그레이드 (Functions 사용 시)

### Functions 사용을 위한 업그레이드
1. Firebase 콘솔에서 **사용량 및 결제** 클릭
2. **Blaze 플랜으로 업그레이드** 클릭
3. 결제 정보 입력
4. **업그레이드** 클릭

### Blaze 플랜 장점
- ✅ Firebase Functions 사용 가능
- ✅ 무료 할당량: 월 125,000 호출
- ✅ 초과 시 $0.40/1,000,000 호출
- ✅ 언제든 Spark 플랜으로 다운그레이드 가능

## 🔧 환경 변수 설정

### .env.local 파일 생성
```bash
# 프로젝트 루트에 .env.local 파일 생성
REACT_APP_FIREBASE_API_KEY=your-api-key
REACT_APP_FIREBASE_AUTH_DOMAIN=windowerp-3.firebaseapp.com
REACT_APP_FIREBASE_PROJECT_ID=windowerp-3
REACT_APP_FIREBASE_STORAGE_BUCKET=windowerp-3.appspot.com
REACT_APP_FIREBASE_MESSAGING_SENDER_ID=796704494096
REACT_APP_FIREBASE_APP_ID=your-app-id
```

### Firebase 설정 값 찾기
1. Firebase 콘솔에서 **프로젝트 설정** 클릭
2. **일반** 탭에서 **웹 앱** 섹션 확인
3. 설정 값들을 복사하여 .env.local에 붙여넣기

## 🧪 테스트 방법

### 1. 로컬 에뮬레이터 테스트
```bash
# 에뮬레이터 시작
firebase emulators:start

# 브라우저에서 http://localhost:4000 접속
# Firebase Emulator UI 확인
```

### 2. Functions 테스트
```bash
# Functions만 배포 (Blaze 플랜 필요)
firebase deploy --only functions

# 또는 로컬에서 테스트
firebase emulators:start --only functions
```

### 3. 프론트엔드 테스트
```bash
# React 앱 시작
npm start

# 브라우저에서 http://localhost:3000 접속
```

## 📊 현재 구성

### 완성된 구조
```
windowerp-3/
├── firebase.json          ✅ Firebase 설정
├── firestore.rules        ✅ Firestore 보안 규칙
├── storage.rules          ✅ Storage 보안 규칙
├── firestore.indexes.json ✅ Firestore 인덱스
├── functions/             ✅ Firebase Functions
│   ├── package.json       ✅ 의존성 설정
│   └── index.js          ✅ Functions 코드
└── src/
    └── firebase/
        └── config.js      ✅ Firebase SDK 설정
```

### 주요 Functions
- ✅ 사용자 인증 (로그인/회원가입)
- ✅ 일정 관리 (CRUD)
- ✅ 견적서 관리 (CRUD)
- ✅ 실시간 알림
- ✅ 파일 업로드
- ✅ 관리자 기능

## 🎯 다음 단계

### 즉시 가능한 작업
1. **Firebase 콘솔에서 서비스 활성화**
2. **환경 변수 설정**
3. **로컬 에뮬레이터 테스트**

### Blaze 플랜 업그레이드 후
1. **Functions 배포**
2. **실제 Firebase 서비스 테스트**
3. **프론트엔드 연동**

### 완전한 마이그레이션
1. **기존 데이터 마이그레이션**
2. **프론트엔드 코드 수정**
3. **실전 배포**

---

**이 가이드를 따라하면 Firebase 기반 ERP 시스템의 기본 구조가 완성됩니다!** 