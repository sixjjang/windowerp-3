// 웹 푸시 알림 서비스 워커
// 푸시 알림을 처리합니다.

// 서비스 워커 설치
self.addEventListener('install', (event) => {
  console.log('FCM 서비스 워커 설치됨');
  self.skipWaiting();
});

// 서비스 워커 활성화
self.addEventListener('activate', (event) => {
  console.log('FCM 서비스 워커 활성화됨');
  event.waitUntil(self.clients.claim());
});

// 푸시 알림 수신
self.addEventListener('push', (event) => {
  console.log('일반 푸시 알림 수신:', event);
  
  if (event.data) {
    const data = event.data.json();
    console.log('푸시 알림 데이터:', data);
    
    const options = {
      body: data.notification?.body || '새로운 메시지가 도착했습니다.',
      icon: '/logo192.png',
      badge: '/logo192.png',
      vibrate: [200, 100, 200],
      data: data.data || {},
      actions: [
        {
          action: 'open',
          title: '열기',
          icon: '/logo192.png'
        },
        {
          action: 'close',
          title: '닫기',
          icon: '/logo192.png'
        }
      ],
      requireInteraction: true,
      tag: 'chat-notification'
    };
    
    event.waitUntil(
      self.registration.showNotification(
        data.notification?.title || '윈도우 ERP',
        options
      )
    );
  }
});

// 알림 클릭 처리
self.addEventListener('notificationclick', (event) => {
  console.log('알림 클릭됨:', event);
  
  event.notification.close();
  
  if (event.action === 'open') {
    // 채팅 페이지로 이동
    event.waitUntil(
      self.clients.openWindow('/dashboard')
    );
  }
});

// 백그라운드 동기화 (선택사항)
self.addEventListener('sync', (event) => {
  console.log('백그라운드 동기화:', event);
  
  if (event.tag === 'chat-sync') {
    event.waitUntil(
      // 채팅 데이터 동기화 로직
      console.log('채팅 데이터 동기화 중...')
    );
  }
});

// 메시지 처리 (메인 스레드와 통신)
self.addEventListener('message', (event) => {
  console.log('서비스 워커 메시지 수신:', event.data);
  
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
}); 