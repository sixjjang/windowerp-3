# 알림 소리 파일

이 폴더에는 알림 소리로 사용할 MP3 파일들이 저장됩니다.

## 파일 목록
- kakao-notification.mp3: 카카오톡 스타일 알림소리
- default-notification.mp3: 기본 알림소리
- gentle-notification.mp3: 부드러운 알림소리
- warning-notification.mp3: 경고 알림소리
- chat-notification.mp3: 채팅 전용 알림소리
- schedule-notification.mp3: 일정 등록/수정 알림소리

## 사용법
1. 더미 파일들을 실제 MP3 파일로 교체하세요
2. 파일명은 위의 목록과 동일하게 유지하세요
3. 파일 크기는 1MB 이하로 권장합니다
4. 재생 시간은 3초 이하로 권장합니다

## 업로드
```bash
node upload-sounds.js
```

또는 Firebase Console에서 직접 업로드할 수 있습니다.
