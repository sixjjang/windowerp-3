# Firebase Storage CORS 설정 가이드

## 문제 상황
현재 Firebase Storage에서 알림 소리 파일을 다운로드할 때 CORS 정책 오류가 발생하고 있습니다:
```
Access to fetch at 'https://storage.googleapis.com/...' from origin 'http://localhost:3000' has been blocked by CORS policy
```

## 해결 방법

### 방법 1: Firebase Console을 통한 CORS 설정

1. **Firebase Console 접속**
   - https://console.firebase.google.com/ 접속
   - windowerp-3 프로젝트 선택

2. **Storage 설정**
   - 왼쪽 메뉴에서 "Storage" 클릭
   - "Rules" 탭 클릭

3. **CORS 설정 추가**
   - 현재 storage.rules 파일에 다음 내용이 있는지 확인:
   ```
   match /notification-sounds/{fileName} {
     allow read: if true;
     allow write: if isAuthenticated() && isAdmin();
   }
   ```

4. **Firebase CLI를 통한 CORS 설정**
   ```bash
   # Firebase CLI 설치 (아직 설치되지 않은 경우)
   npm install -g firebase-tools
   
   # 로그인
   firebase login
   
   # CORS 설정 적용
   firebase init storage
   ```

### 방법 2: 대안적 접근 방식

#### A. Firebase Functions를 통한 프록시
Firebase Storage에 직접 접근하는 대신, Firebase Functions를 통해 파일을 프록시하는 방법:

```javascript
// functions/index.js에 추가
exports.getNotificationSoundFile = functions.https.onRequest(async (req, res) => {
  const fileName = req.query.fileName;
  const bucket = admin.storage().bucket();
  
  try {
    const file = bucket.file(`notification-sounds/${fileName}`);
    const [exists] = await file.exists();
    
    if (!exists) {
      res.status(404).send('File not found');
      return;
    }
    
    const [metadata] = await file.getMetadata();
    res.set('Content-Type', metadata.contentType);
    res.set('Access-Control-Allow-Origin', '*');
    
    file.createReadStream().pipe(res);
  } catch (error) {
    res.status(500).send('Error downloading file');
  }
});
```

#### B. 로컬 파일 시스템 사용
개발 환경에서는 로컬 파일을 사용하고, 프로덕션에서만 Firebase Storage를 사용하는 방법:

```javascript
// soundUtils.ts 수정
const isDevelopment = process.env.NODE_ENV === 'development';

if (isDevelopment) {
  // 로컬 파일 사용
  audio.src = `/sounds/${fileName}`;
} else {
  // Firebase Storage 사용
  audio.src = firebaseUrl;
}
```

### 방법 3: 임시 해결책 - Fallback 시스템 강화

현재 구현된 fallback 시스템을 더 강화하여 CORS 오류가 발생해도 알림 소리가 재생되도록 개선:

```javascript
// soundUtils.ts의 playNotificationSound 메서드 개선
async playNotificationSound(soundKey: string): Promise<void> {
  try {
    // 1. Firebase Storage에서 재생 시도
    await this.loadAudio(soundKey);
  } catch (error) {
    console.warn('Firebase Storage 재생 실패, fallback 사용:', error);
    
    // 2. Fallback 소리 재생
    this.playFallbackSound();
  }
}
```

## 권장 해결 순서

1. **즉시**: Fallback 시스템 강화로 사용자 경험 개선
2. **단기**: Firebase Functions 프록시 구현
3. **장기**: Firebase Storage CORS 설정 완료

## 테스트 방법

1. 브라우저 개발자 도구에서 Network 탭 확인
2. 알림 소리 재생 시 CORS 오류 메시지 확인
3. Fallback 소리가 정상적으로 재생되는지 확인 