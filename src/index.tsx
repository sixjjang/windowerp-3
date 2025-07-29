import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App';

// PWA 설치 기능
let deferredPrompt: any;

window.addEventListener('beforeinstallprompt', (e) => {
  // 기본 설치 프롬프트 방지
  e.preventDefault();
  // 나중에 사용하기 위해 이벤트 저장
  deferredPrompt = e;
  
  // 설치 안내 표시
  const installPrompt = document.getElementById('pwa-install-prompt');
  if (installPrompt) {
    installPrompt.classList.add('show');
  }
});

// 설치 버튼 클릭 이벤트
document.addEventListener('DOMContentLoaded', () => {
  const installBtn = document.getElementById('pwa-install-btn');
  const dismissBtn = document.getElementById('pwa-dismiss-btn');
  const installPrompt = document.getElementById('pwa-install-prompt');

  if (installBtn) {
    installBtn.addEventListener('click', async () => {
      if (deferredPrompt) {
        // 설치 프롬프트 표시
        deferredPrompt.prompt();
        // 사용자 응답 대기
        const { outcome } = await deferredPrompt.userChoice;
        console.log(`사용자 선택: ${outcome}`);
        // 프롬프트 초기화
        deferredPrompt = null;
      }
      // 설치 안내 숨기기
      if (installPrompt) {
        installPrompt.classList.remove('show');
      }
    });
  }

  if (dismissBtn) {
    dismissBtn.addEventListener('click', () => {
      if (installPrompt) {
        installPrompt.classList.remove('show');
      }
    });
  }
});

// 앱이 이미 설치되었는지 확인
window.addEventListener('appinstalled', () => {
  console.log('PWA가 설치되었습니다');
  // 설치 안내 숨기기
  const installPrompt = document.getElementById('pwa-install-prompt');
  if (installPrompt) {
    installPrompt.classList.remove('show');
  }
});

// 서비스 워커 등록
if ('serviceWorker' in navigator && process.env.NODE_ENV === 'production') {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js', {
      scope: '/'
    })
      .then((registration) => {
        console.log('서비스 워커 등록 성공:', registration.scope);
        
        // 서비스 워커 업데이트 확인
        registration.addEventListener('updatefound', () => {
          const newWorker = registration.installing;
          if (newWorker) {
            newWorker.addEventListener('statechange', () => {
              if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                console.log('새로운 서비스 워커가 설치되었습니다');
              }
            });
          }
        });
      })
      .catch((error) => {
        console.warn('서비스 워커 등록 실패:', error);
      });
  });
} else {
  // 개발 환경에서는 기존 서비스 워커 제거
  if ('serviceWorker' in navigator && process.env.NODE_ENV === 'development') {
    navigator.serviceWorker.getRegistrations().then((registrations) => {
      for (const registration of registrations) {
        registration.unregister();
        console.log('개발 환경: 기존 서비스 워커 제거됨');
      }
    });
  }
  console.log('서비스 워커 등록 건너뜀 (개발 환경 또는 지원하지 않는 브라우저)');
}

const root = ReactDOM.createRoot(
  document.getElementById('root') as HTMLElement
);
root.render(
  <React.StrictMode>
    <BrowserRouter
      future={{
        v7_startTransition: true,
        v7_relativeSplatPath: true
      }}
    >
      <App />
    </BrowserRouter>
  </React.StrictMode>
);

