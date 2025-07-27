# Firebase 기반 알림 소리 시스템 가이드

## 📋 개요

Firebase를 활용한 중앙 집중식 알림 소리 시스템이 구현되었습니다. 이 시스템은 사용자별 개인화된 알림 소리 설정을 제공하며, 여러 기기에서 실시간으로 동기화됩니다.

## 🚀 주요 기능

### ✅ **중앙 집중식 관리**
- Firebase Firestore에 사용자별 설정 저장
- Firebase Storage에 알림 소리 파일 저장
- 실시간 설정 동기화

### ✅ **사용자별 개인화**
- 각 사용자마다 독립적인 알림 소리 설정
- 볼륨, 활성화 여부, 선택된 소리 개별 관리
- 여러 기기에서 설정 동기화

### ✅ **실시간 알림**
- 채팅 메시지 시 알림 소리
- 일정 등록/수정 시 알림 소리
- 타입별 차별화된 알림 소리

## 🏗️ 시스템 구조

### **Firebase Firestore 컬렉션**
```
user_sound_settings/
├── {userId}/
    ├── enabled: boolean
    ├── volume: number (0-1)
    ├── selectedSound: string
    └── lastUpdated: timestamp
```

### **Firebase Storage 구조**
```
notification-sounds/
├── kakao.mp3
├── default.mp3
├── gentle.mp3
├── warning.mp3
├── chat.mp3
└── schedule.mp3
```

### **Firebase Functions**
- `getNotificationSounds`: 알림 소리 파일 목록 조회
- `getUserSoundSettings`: 사용자 설정 조회
- `saveUserSoundSettings`: 사용자 설정 저장
- `uploadNotificationSound`: 관리자용 소리 파일 업로드

## 🔧 설정 방법

### **1. Firebase Functions 배포**
```bash
cd functions
npm install
firebase deploy --only functions
```

### **2. 알림 소리 파일 업로드**
```bash
# 기본 알림 소리 파일들을 sounds/ 폴더에 준비
node upload-sounds.js
```

### **3. 클라이언트 설정**
- 알림 소리 설정 모달에서 설정 변경
- 실시간으로 Firebase와 동기화

## 📱 사용자 인터페이스

### **알림 소리 설정 모달**
- 우측 상단 알림 아이콘 → "소리 설정" 버튼
- 알림 소리 활성화/비활성화
- 볼륨 조절 (0-100%)
- 사용 가능한 알림 소리 선택
- ▶️ 버튼으로 미리 듣기
- 🔄 버튼으로 설정 새로고침

### **자동 알림 소리**
- **채팅 메시지**: 새로운 메시지 시 자동 재생
- **일정 관리**: 등록/수정 시 자동 재생
- **설정 동기화**: 여러 기기에서 실시간 동기화

## 🎵 알림 소리 타입

### **기본 제공 소리**
1. **카카오톡** - 카카오톡 스타일 알림소리
2. **기본 알림** - 기본 알림소리
3. **부드러운 알림** - 부드러운 알림소리
4. **경고 알림** - 경고 알림소리
5. **채팅 알림** - 채팅 전용 알림소리
6. **일정 알림** - 일정 등록/수정 알림소리

### **타입별 사용**
- **채팅 알림**: 스케줄 채팅, 전체 사용자 채팅
- **일정 알림**: 일정 등록, 수정, 삭제
- **기타 알림**: 선택한 소리로 재생

## 🔄 실시간 동기화

### **설정 동기화**
- 사용자가 설정을 변경하면 즉시 Firebase에 저장
- 다른 기기에서 로그인 시 설정 자동 동기화
- 오프라인 상태에서도 로컬 설정 유지

### **알림 소리 동기화**
- 새로운 알림 소리 파일 업로드 시 자동 감지
- 사용 가능한 소리 목록 실시간 업데이트
- 캐시된 오디오 파일 자동 관리

## 🛠️ 개발자 가이드

### **새로운 알림 소리 추가**
1. Firebase Storage에 MP3 파일 업로드
2. `notification-sounds/` 폴더에 저장
3. 파일명을 소리 이름으로 설정 (예: `custom.mp3`)
4. 클라이언트에서 자동으로 감지됨

### **사용자별 설정 관리**
```typescript
// 설정 조회
const settings = await getUserSoundSettingsFromFirebase(userId);

// 설정 저장
await saveUserSoundSettingsToFirebase(userId, newSettings);

// 알림 소리 재생
const player = getNotificationSoundPlayer(userId);
await player.playNotificationSound('chat');
```

### **Firebase Functions 확장**
```javascript
// 새로운 알림 소리 타입 추가
exports.playCustomNotification = functions.https.onRequest(async (req, res) => {
  // 커스텀 알림 소리 재생 로직
});
```

## 🔒 보안 및 권한

### **사용자 권한**
- 각 사용자는 자신의 설정만 수정 가능
- 관리자는 모든 사용자 설정 조회 가능
- 알림 소리 파일은 공개 접근 가능

### **데이터 보호**
- 사용자 설정은 개인정보로 분류
- Firebase Security Rules로 접근 제어
- 설정 변경 이력 추적 가능

## 📊 모니터링 및 분석

### **사용 통계**
- 알림 소리 사용 빈도
- 사용자별 선호 소리
- 설정 변경 패턴

### **성능 모니터링**
- 오디오 파일 로딩 시간
- 캐시 히트율
- 네트워크 사용량

## 🚨 문제 해결

### **알림 소리가 재생되지 않는 경우**
1. 브라우저 알림 권한 확인
2. 볼륨 설정 확인
3. 알림 소리 활성화 여부 확인
4. 네트워크 연결 상태 확인

### **설정이 동기화되지 않는 경우**
1. Firebase 연결 상태 확인
2. 사용자 인증 상태 확인
3. 새로고침 버튼 클릭
4. 브라우저 캐시 삭제

### **새로운 소리가 표시되지 않는 경우**
1. Firebase Storage 업로드 확인
2. 파일 권한 설정 확인
3. 새로고침 버튼 클릭
4. 브라우저 새로고침

## 🔮 향후 개선 사항

### **예정된 기능**
- 사용자 커스텀 알림 소리 업로드
- 알림 소리 스케줄링
- 진동 패턴 설정
- 알림 소리 통계 대시보드

### **성능 최적화**
- 오디오 파일 압축
- CDN 캐싱 최적화
- 오프라인 재생 지원
- 배터리 사용량 최적화

---

## 📞 지원

문제가 발생하거나 추가 기능이 필요한 경우 개발팀에 문의해주세요. 