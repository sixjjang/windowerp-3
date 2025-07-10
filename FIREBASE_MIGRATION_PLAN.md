# 🔥 Firebase 전체 스택 ERP 마이그레이션 계획

## 📋 현재 상황 분석

### 문제점
- NAS 서버 충돌로 인한 안정성 문제
- 외부 접근 제한 (포트, 방화벽 등)
- 단일 서버 의존성 (NAS 장애 시 전체 서비스 중단)
- 확장성 제한

### 해결 방안
- **Firebase Hosting**: 프론트엔드 (이미 완료)
- **Firebase Functions**: 백엔드 API
- **Firestore**: 데이터베이스
- **Firebase Storage**: 파일 저장소
- **Firebase Authentication**: 사용자 인증
- **Firebase Realtime Database**: 실시간 기능

## 🚀 마이그레이션 단계별 계획

### 1단계: Firebase 프로젝트 설정 (1-2일)

#### 1.1 Firebase 프로젝트 생성
```bash
# Firebase CLI 설치
npm install -g firebase-tools

# 로그인
firebase login

# 프로젝트 초기화
firebase init
```

#### 1.2 Firebase 서비스 활성화
- [ ] **Firebase Hosting** (이미 완료)
- [ ] **Firebase Functions** (새로 추가)
- [ ] **Firestore Database** (새로 추가)
- [ ] **Firebase Storage** (새로 추가)
- [ ] **Firebase Authentication** (새로 추가)
- [ ] **Firebase Realtime Database** (새로 추가)

### 2단계: 데이터베이스 마이그레이션 (2-3일)

#### 2.1 Firestore 스키마 설계
```javascript
// 사용자 컬렉션
users: {
  userId: {
    username: string,
    name: string,
    role: 'admin' | 'staff' | 'user',
    email: string,
    phone: string,
    profileImage: string,
    isApproved: boolean,
    createdAt: timestamp,
    updatedAt: timestamp
  }
}

// 일정 컬렉션
schedules: {
  scheduleId: {
    title: string,
    date: string,
    time: string,
    type: string,
    description: string,
    customerName: string,
    address: string,
    contact: string,
    priority: '낮음' | '보통' | '높음',
    status: '예정' | '진행중' | '완료' | '취소',
    createdBy: string,
    createdAt: timestamp,
    updatedAt: timestamp
  }
}

// 견적서 컬렉션
estimates: {
  estimateId: {
    estimateNo: string,
    customerName: string,
    projectName: string,
    totalAmount: number,
    products: array,
    status: string,
    createdAt: timestamp,
    updatedAt: timestamp
  }
}

// 계약 컬렉션
contracts: {
  contractId: {
    contractNo: string,
    estimateNo: string,
    customerName: string,
    amount: number,
    status: string,
    createdAt: timestamp,
    updatedAt: timestamp
  }
}

// 배송 컬렉션
deliveries: {
  deliveryId: {
    deliveryNo: string,
    contractNo: string,
    customerName: string,
    items: array,
    status: string,
    createdAt: timestamp,
    updatedAt: timestamp
  }
}

// 고객 컬렉션
customers: {
  customerId: {
    name: string,
    contact: string,
    address: string,
    email: string,
    createdAt: timestamp,
    updatedAt: timestamp
  }
}

// 제품 컬렉션
products: {
  productId: {
    name: string,
    category: string,
    price: number,
    options: array,
    createdAt: timestamp,
    updatedAt: timestamp
  }
}

// 과거자료 컬렉션
historicalData: {
  fileId: {
    filename: string,
    originalName: string,
    type: string,
    year: number,
    fileSize: number,
    storagePath: string,
    uploadedBy: string,
    createdAt: timestamp
  }
}
```

#### 2.2 데이터 마이그레이션 스크립트
```javascript
// backend/migrate-to-firestore.js
const admin = require('firebase-admin');
const sqlite3 = require('sqlite3').verbose();

// Firestore 초기화
const serviceAccount = require('./firebase-service-account.json');
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

// SQLite 데이터 읽기 및 Firestore로 마이그레이션
async function migrateData() {
  // 사용자 데이터 마이그레이션
  // 일정 데이터 마이그레이션
  // 견적서 데이터 마이그레이션
  // 기타 데이터 마이그레이션
}
```

### 3단계: Firebase Functions 개발 (3-4일)

#### 3.1 API 엔드포인트 마이그레이션
```javascript
// functions/index.js
const functions = require('firebase-functions');
const admin = require('firebase-admin');
admin.initializeApp();

const db = admin.firestore();

// 사용자 인증 API
exports.login = functions.https.onCall(async (data, context) => {
  // 로그인 로직
});

exports.register = functions.https.onCall(async (data, context) => {
  // 회원가입 로직
});

// 일정 관리 API
exports.getSchedules = functions.https.onCall(async (data, context) => {
  // 일정 조회 로직
});

exports.createSchedule = functions.https.onCall(async (data, context) => {
  // 일정 생성 로직
});

// 견적서 관리 API
exports.getEstimates = functions.https.onCall(async (data, context) => {
  // 견적서 조회 로직
});

// 파일 업로드 API
exports.uploadFile = functions.https.onCall(async (data, context) => {
  // 파일 업로드 로직
});
```

#### 3.2 실시간 기능 (Firebase Realtime Database)
```javascript
// 실시간 알림 시스템
exports.sendNotification = functions.https.onCall(async (data, context) => {
  const { targetUserId, notification } = data;
  
  // Realtime Database에 알림 저장
  await admin.database().ref(`notifications/${targetUserId}`).push({
    ...notification,
    timestamp: admin.database.ServerValue.TIMESTAMP
  });
});
```

### 4단계: 프론트엔드 수정 (2-3일)

#### 4.1 Firebase SDK 설정
```javascript
// src/firebase/config.js
import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import { getDatabase } from 'firebase/database';

const firebaseConfig = {
  // Firebase 설정
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);
export const realtimeDb = getDatabase(app);
```

#### 4.2 API 호출 수정
```javascript
// 기존: fetch(`${API_BASE}/schedules`)
// 변경: Firebase Functions 호출
import { getFunctions, httpsCallable } from 'firebase/functions';

const functions = getFunctions();
const getSchedules = httpsCallable(functions, 'getSchedules');
const createSchedule = httpsCallable(functions, 'createSchedule');
```

#### 4.3 실시간 기능 수정
```javascript
// 기존: WebSocket
// 변경: Firebase Realtime Database
import { ref, onValue, push } from 'firebase/database';

const notificationsRef = ref(realtimeDb, `notifications/${userId}`);
onValue(notificationsRef, (snapshot) => {
  // 실시간 알림 처리
});
```

### 5단계: 파일 저장소 마이그레이션 (1-2일)

#### 5.1 Firebase Storage 설정
```javascript
// 파일 업로드
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';

const uploadFile = async (file, path) => {
  const storageRef = ref(storage, path);
  const snapshot = await uploadBytes(storageRef, file);
  return await getDownloadURL(snapshot.ref);
};
```

#### 5.2 기존 파일 마이그레이션
```javascript
// NAS의 uploads 폴더 → Firebase Storage
async function migrateFiles() {
  // 기존 파일들을 Firebase Storage로 업로드
  // 파일 경로 정보를 Firestore에 저장
}
```

### 6단계: 테스트 및 최적화 (2-3일)

#### 6.1 기능 테스트
- [ ] 사용자 인증 (로그인/로그아웃)
- [ ] 일정 관리 (CRUD)
- [ ] 견적서 관리 (CRUD)
- [ ] 파일 업로드/다운로드
- [ ] 실시간 알림
- [ ] 다중 사용자 동시 접속

#### 6.2 성능 최적화
- [ ] Firestore 인덱스 설정
- [ ] 쿼리 최적화
- [ ] 캐싱 전략
- [ ] 오프라인 지원

## 📊 마이그레이션 일정

| 단계 | 기간 | 주요 작업 |
|------|------|-----------|
| 1단계 | 1-2일 | Firebase 프로젝트 설정 |
| 2단계 | 2-3일 | 데이터베이스 마이그레이션 |
| 3단계 | 3-4일 | Firebase Functions 개발 |
| 4단계 | 2-3일 | 프론트엔드 수정 |
| 5단계 | 1-2일 | 파일 저장소 마이그레이션 |
| 6단계 | 2-3일 | 테스트 및 최적화 |

**총 소요 기간: 11-17일**

## 🔧 기술적 고려사항

### 장점
- ✅ 완전한 클라우드 기반 (안정성)
- ✅ 자동 스케일링
- ✅ 글로벌 CDN
- ✅ 실시간 데이터베이스
- ✅ 강력한 보안
- ✅ 모니터링 및 로깅

### 주의사항
- ⚠️ Firestore 읽기/쓰기 비용
- ⚠️ Functions 실행 시간 제한
- ⚠️ Storage 저장 비용
- ⚠️ 초기 설정 복잡성

## 💰 비용 예상

### Firebase 무료 플랜 (월)
- Firestore: 1GB 저장, 50,000 읽기, 20,000 쓰기
- Functions: 125,000 호출
- Storage: 5GB 저장
- Hosting: 10GB 전송

### 유료 플랜 (필요시)
- Firestore: $0.18/GB 저장, $0.06/100,000 읽기
- Functions: $0.40/1,000,000 호출
- Storage: $0.026/GB 저장

## 🚨 롤백 계획

### 백업 전략
- [ ] 기존 NAS 데이터 완전 백업
- [ ] SQLite 데이터베이스 백업
- [ ] 업로드 파일 백업
- [ ] 환경 설정 백업

### 롤백 절차
1. Firebase 서비스 중단
2. 기존 NAS 서버 재시작
3. 백업 데이터 복원
4. 환경 변수 복원
5. 서비스 재개

## 📈 성공 지표

### 기술적 지표
- [ ] API 응답 시간 < 1초
- [ ] 실시간 알림 지연 < 500ms
- [ ] 파일 업로드 성공률 > 99%
- [ ] 시스템 가용성 > 99.9%

### 비즈니스 지표
- [ ] 사용자 만족도 향상
- [ ] 시스템 안정성 개선
- [ ] 운영 비용 절감
- [ ] 확장성 확보

## 🎯 다음 단계

1. **즉시 시작**: Firebase 프로젝트 설정
2. **1주차**: 데이터베이스 마이그레이션
3. **2주차**: Functions 개발
4. **3주차**: 프론트엔드 수정 및 테스트
5. **4주차**: 최적화 및 실전 배포

---

**이 계획대로 진행하면 NAS 서버 충돌 문제 없이 안정적이고 확장 가능한 ERP 시스템을 구축할 수 있습니다!** 