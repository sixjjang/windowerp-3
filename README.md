# Windowerp-3

창문 ERP 시스템 - React 프론트엔드와 Node.js 백엔드로 구성된 풀스택 웹 애플리케이션

## 🚀 프로젝트 개요

Windowerp-3는 창문 제조 및 설치 업체를 위한 종합적인 ERP(Enterprise Resource Planning) 시스템입니다. 견적 관리, 계약 관리, 배송 관리, 스케줄링 등 다양한 비즈니스 기능을 제공합니다.

## 🛠️ 기술 스택

### Frontend
- **React 18** - 사용자 인터페이스
- **TypeScript** - 타입 안전성
- **Material-UI (MUI)** - UI 컴포넌트 라이브러리
- **React Router** - 클라이언트 사이드 라우팅
- **Zustand** - 상태 관리
- **Axios** - HTTP 클라이언트

### Backend
- **Node.js** - 서버 런타임
- **Express.js** - 웹 프레임워크
- **SQLite** - 데이터베이스
- **JWT** - 인증
- **WebSocket** - 실시간 통신
- **Multer** - 파일 업로드

## 📁 프로젝트 구조

```
windowerp-3/
├── src/                    # React 프론트엔드 소스
│   ├── components/         # 재사용 가능한 컴포넌트
│   ├── pages/             # 페이지 컴포넌트
│   ├── utils/             # 유틸리티 함수
│   └── theme/             # 테마 설정
├── backend/               # Node.js 백엔드
│   ├── index.js           # 메인 서버 파일
│   ├── ws-server.js       # WebSocket 서버
│   └── uploads/           # 업로드된 파일들
├── public/                # 정적 파일들
└── package.json           # 프로젝트 설정
```

## 🚀 설치 및 실행

### 필수 요구사항
- Node.js 16 이상
- npm 또는 yarn

### 1. 저장소 클론
```bash
git clone <repository-url>
cd windowerp-3
```

### 2. 프론트엔드 의존성 설치
```bash
npm install
```

### 3. 백엔드 의존성 설치
```bash
cd backend
npm install
cd ..
```

### 4. 개발 서버 실행

#### 프론트엔드 (포트 3000)
```bash
npm start
```

#### 백엔드 (포트 4000)
```bash
cd backend
npm run dev
```

## 🔧 빌드

### 프로덕션 빌드
```bash
npm run build
```

## 🌐 배포

### Firebase 호스팅 배포
1. Firebase CLI 설치
```bash
npm install -g firebase-tools
```

2. Firebase 로그인
```bash
firebase login
```

3. Firebase 프로젝트 초기화
```bash
firebase init hosting
```

4. 빌드 및 배포
```bash
npm run build
firebase deploy
```

## 📋 주요 기능

- **사용자 관리**: 관리자 및 일반 사용자 권한 관리
- **견적 관리**: 고객 견적 생성 및 관리
- **계약 관리**: 계약서 생성 및 서명
- **배송 관리**: 배송 일정 및 상태 추적
- **스케줄링**: 작업 일정 관리
- **제품 관리**: 제품 카탈로그 및 옵션 관리
- **통계 및 리포트**: 비즈니스 분석 및 보고서

## 🔐 환경 변수

백엔드에서 사용하는 환경 변수들을 `.env` 파일에 설정하세요:

```env
JWT_SECRET=your_jwt_secret
PORT=4000
NODE_ENV=production
```

## 📝 개발 노트

자세한 개발 정보는 `DEVELOPMENT_NOTES.md` 파일을 참조하세요.

## 🚨 주의사항

- 데이터베이스 파일(`*.db`)은 `.gitignore`에 포함되어 있습니다
- 업로드된 파일들은 `backend/uploads/` 디렉토리에 저장됩니다
- 프로덕션 배포 시 환경 변수를 적절히 설정하세요

## 📄 라이선스

이 프로젝트는 ISC 라이선스 하에 배포됩니다.

## 🤝 기여

프로젝트에 기여하고 싶으시다면 Pull Request를 보내주세요.

## 📞 지원

문제가 발생하거나 질문이 있으시면 이슈를 생성해주세요. 