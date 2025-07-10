# 🚀 Firebase ERP 마이그레이션 빠른 시작 가이드

## ⚡ 즉시 실행 가능한 단계

### 1단계: Firebase CLI 설치 및 로그인 (5분)

```bash
# Firebase CLI 설치
npm install -g firebase-tools

# 로그인
firebase login

# 프로젝트 확인
firebase projects:list
```

### 2단계: Firebase 프로젝트 초기화 (10분)

```bash
# 프로젝트 루트에서 실행
firebase init

# 선택할 서비스들:
# ✅ Hosting (이미 설정됨)
# ✅ Functions (새로 추가)
# ✅ Firestore (새로 추가)
# ✅ Storage (새로 추가)
# ✅ Authentication (새로 추가)
# ✅ Realtime Database (새로 추가)
```

### 3단계: Firebase 콘솔에서 서비스 활성화 (15분)

1. **Firebase 콘솔 접속**: https://console.firebase.google.com
2. **프로젝트 선택**: windowerp-3
3. **서비스 활성화**:
   - **Firestore Database** → 테스트 모드로 시작
   - **Storage** → 테스트 모드로 시작
   - **Authentication** → 이메일/비밀번호 활성화
   - **Realtime Database** → 테스트 모드로 시작

### 4단계: Functions 디렉토리 생성 (5분)

```bash
# functions 디렉토리가 없다면 생성
mkdir functions
cd functions

# package.json 생성
npm init -y

# Firebase Functions 의존성 설치
npm install firebase-functions firebase-admin
```

### 5단계: 기본 Functions 코드 작성 (10분)

```javascript
// functions/index.js
const functions = require('firebase-functions');
const admin = require('firebase-admin');
admin.initializeApp();

const db = admin.firestore();

// 테스트용 함수
exports.helloWorld = functions.https.onCall((data, context) => {
  return {
    message: 'Firebase Functions가 정상 작동합니다!',
    timestamp: new Date().toISOString()
  };
});

// 사용자 인증 함수
exports.login = functions.https.onCall(async (data, context) => {
  const { username, password } = data;
  
  try {
    // Firestore에서 사용자 조회
    const usersRef = db.collection('users');
    const snapshot = await usersRef.where('username', '==', username).get();
    
    if (snapshot.empty) {
      throw new functions.https.HttpsError('not-found', '사용자를 찾을 수 없습니다.');
    }
    
    const userDoc = snapshot.docs[0];
    const userData = userDoc.data();
    
    // 비밀번호 검증 (bcrypt 사용)
    const bcrypt = require('bcrypt');
    const isValidPassword = await bcrypt.compare(password, userData.password);
    
    if (!isValidPassword) {
      throw new functions.https.HttpsError('unauthenticated', '비밀번호가 올바르지 않습니다.');
    }
    
    // JWT 토큰 생성
    const jwt = require('jsonwebtoken');
    const token = jwt.sign(
      { 
        uid: userDoc.id, 
        username: userData.username, 
        role: userData.role 
      },
      functions.config().jwt.secret || 'your-jwt-secret',
      { expiresIn: '24h' }
    );
    
    return {
      token,
      user: {
        id: userDoc.id,
        username: userData.username,
        name: userData.name,
        role: userData.role
      }
    };
  } catch (error) {
    throw new functions.https.HttpsError('internal', error.message);
  }
});
```

### 6단계: Functions 배포 (5분)

```bash
# functions 디렉토리에서
npm install bcrypt jsonwebtoken

# 배포
firebase deploy --only functions
```

### 7단계: 프론트엔드 Firebase SDK 설정 (10분)

```bash
# Firebase SDK 설치
npm install firebase
```

```javascript
// src/firebase/config.js
import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import { getDatabase } from 'firebase/database';
import { getFunctions } from 'firebase/functions';

const firebaseConfig = {
  apiKey: "your-api-key",
  authDomain: "windowerp-3.firebaseapp.com",
  projectId: "windowerp-3",
  storageBucket: "windowerp-3.appspot.com",
  messagingSenderId: "your-sender-id",
  appId: "your-app-id"
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);
export const realtimeDb = getDatabase(app);
export const functions = getFunctions(app);
```

### 8단계: 테스트 (5분)

```bash
# 로컬 테스트
firebase emulators:start

# 브라우저에서 http://localhost:4000 접속
# Firebase Emulator UI 확인
```

## 🔧 환경 변수 설정

### Firebase Functions 환경 변수

```bash
# JWT 시크릿 설정
firebase functions:config:set jwt.secret="your-super-secure-jwt-secret"

# 기타 설정
firebase functions:config:set app.environment="production"
```

### 프론트엔드 환경 변수

```bash
# .env 파일 생성
REACT_APP_FIREBASE_API_KEY=your-api-key
REACT_APP_FIREBASE_AUTH_DOMAIN=windowerp-3.firebaseapp.com
REACT_APP_FIREBASE_PROJECT_ID=windowerp-3
REACT_APP_FIREBASE_STORAGE_BUCKET=windowerp-3.appspot.com
REACT_APP_FIREBASE_MESSAGING_SENDER_ID=your-sender-id
REACT_APP_FIREBASE_APP_ID=your-app-id
```

## 📊 마이그레이션 체크리스트

### 기본 설정
- [ ] Firebase CLI 설치 및 로그인
- [ ] 프로젝트 초기화 (firebase init)
- [ ] 서비스 활성화 (콘솔)
- [ ] 보안 규칙 설정
- [ ] Functions 기본 코드 작성
- [ ] 프론트엔드 SDK 설정

### 기능별 마이그레이션
- [ ] 사용자 인증 (JWT → Firebase Auth)
- [ ] 데이터베이스 (SQLite → Firestore)
- [ ] 파일 저장 (로컬 → Firebase Storage)
- [ ] 실시간 기능 (WebSocket → Realtime Database)
- [ ] API 엔드포인트 (Express → Functions)

### 테스트
- [ ] 로컬 에뮬레이터 테스트
- [ ] 기본 기능 테스트
- [ ] 실시간 기능 테스트
- [ ] 파일 업로드 테스트

## 🚨 주의사항

### 비용 관리
- Firebase 무료 플랜 한도 확인
- 사용량 모니터링 설정
- 비용 알림 설정

### 보안
- 보안 규칙 테스트
- 인증 로직 검증
- 파일 업로드 제한 확인

### 성능
- Firestore 인덱스 설정
- 쿼리 최적화
- 캐싱 전략

## 🎯 다음 단계

1. **기본 설정 완료 후**: 데이터 마이그레이션 스크립트 작성
2. **Functions 개발**: 기존 API 엔드포인트를 Functions로 변환
3. **프론트엔드 수정**: API 호출을 Firebase SDK로 변경
4. **테스트 및 최적화**: 성능 및 보안 검증

---

**이 가이드를 따라하면 1시간 내에 Firebase 기반 ERP 시스템의 기본 구조를 구축할 수 있습니다!** 