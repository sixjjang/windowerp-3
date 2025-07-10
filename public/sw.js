// 서비스 워커 - PWA 기능을 위한 캐싱 및 오프라인 지원
const CACHE_NAME = 'windowerp-v1';
const urlsToCache = [
  '/',
  '/manifest.json',
  '/favicon.ico'
];

// 지원하지 않는 URL 스킴들
const UNSUPPORTED_SCHEMES = [
  'chrome-extension://',
  'chrome://',
  'moz-extension://',
  'safari-extension://',
  'data:',
  'blob:',
  'file:',
  'about:',
  'view-source:'
];

// 캐시하지 않을 도메인들
const EXCLUDED_DOMAINS = [
  'fonts.googleapis.com',
  'fonts.gstatic.com',
  'localhost',
  '127.0.0.1'
];

// URL이 캐시 가능한지 확인하는 함수
function isCacheable(request) {
  const url = request.url;
  
  // 지원하지 않는 스킴 체크
  for (const scheme of UNSUPPORTED_SCHEMES) {
    if (url.startsWith(scheme)) {
      return false;
    }
  }
  
  // 제외할 도메인 체크
  for (const domain of EXCLUDED_DOMAINS) {
    if (url.includes(domain)) {
      return false;
    }
  }
  
  // GET 요청만 캐시
  if (request.method !== 'GET') {
    return false;
  }
  
  return true;
}

// 서비스 워커 설치
self.addEventListener('install', (event) => {
  console.log('서비스 워커 설치 중...');
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('캐시가 열렸습니다');
        // 기본 페이지만 캐시
        return cache.addAll(urlsToCache).catch((error) => {
          console.warn('기본 캐싱 실패:', error);
          return Promise.resolve();
        });
      })
  );
});

// 서비스 워커 활성화
self.addEventListener('activate', (event) => {
  console.log('서비스 워커 활성화 중...');
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log('이전 캐시 삭제:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});

// 네트워크 요청 가로채기
self.addEventListener('fetch', (event) => {
  const request = event.request;
  
  // 캐시할 수 없는 요청은 네트워크로만 처리
  if (!isCacheable(request)) {
    event.respondWith(fetch(request));
    return;
  }
  
  // 개발 환경에서는 캐싱을 건너뛰고 네트워크 요청만 처리
  if (request.url.includes('localhost') || request.url.includes('127.0.0.1')) {
    event.respondWith(fetch(request));
    return;
  }
  
  event.respondWith(
    caches.match(request)
      .then((cachedResponse) => {
        // 캐시에서 찾으면 반환
        if (cachedResponse) {
          return cachedResponse;
        }
        
        // 캐시에 없으면 네트워크에서 가져오기
        return fetch(request)
          .then((response) => {
            // 유효한 응답이 아니면 그대로 반환
            if (!response || response.status !== 200 || response.type !== 'basic') {
              return response;
            }
            
            // 응답을 복제하여 캐시에 저장 (안전하게)
            const responseToCache = response.clone();
            caches.open(CACHE_NAME)
              .then((cache) => {
                // 다시 한번 캐시 가능한지 확인
                if (isCacheable(request)) {
                  return cache.put(request, responseToCache);
                }
              })
              .catch((error) => {
                console.warn('캐시 저장 실패:', error);
              });
            
            return response;
          })
          .catch((error) => {
            console.warn('네트워크 요청 실패:', error);
            // 오프라인 페이지나 기본 응답 반환
            return new Response('Network error', { 
              status: 503,
              statusText: 'Service Unavailable'
            });
          });
      })
  );
}); 