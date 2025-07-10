# Windowerp-2 개발 노트

## 🛡️ 작업 원칙

### 안전 우선
- 수정 중 오류가 날 수 있지만 심각해질 수 있는 부분은 조심하자
- 한번 두번 검토하고 수정해가기, 정말 심각할 것 같은것은 3번 4번 5번도 더 검토하자자
- 오류가 생겨도 대응방안이 있다는 판단이 생길 때만 수정작업 시작
- "이건 도저히 감당 안될 상태가 될 수 있겠다" 싶으면 즉시 중단하고 보고

### 코드 품질
- 버그나 오류는 발생하는 즉시 제거
- 코딩이 깔끔해지는데 노력
- 작업 중단 시: 중단된 작업을 삭제하거나 이어가기 결정
- 예: 한번 설치하려던 파일이 있으면 다른 걸 설치할 때 기존 파일 제거

## 📅 작업 내역

### 2024-12-19
- 납품관리 검색 기능 수정 (완료)
- 프로젝트 정리 작업 (완료)
- Cursor AI 작업 원칙 설정 (완료)

## 🔄 닉네임 Context 연동 시스템

### 구조 개요
- **UserContext**: Layout에서 제공하는 전역 닉네임 상태
- **적용 범위**: Dashboard, Schedule 등 채팅/댓글 기능이 있는 페이지
- **우선순위**: Context nickname > 기존 userName > 기본값('나', '사용자')

### 사용법

#### 1. Context 사용하기
```typescript
import { useContext } from 'react';
import { UserContext } from '../components/Layout';

const MyComponent = () => {
  const { nickname } = useContext(UserContext);
  
  // 채팅 메시지 전송 시
  const handleSendMessage = () => {
    const message = {
      user: nickname || '나',
      text: messageText,
      time: new Date().toLocaleTimeString()
    };
  };
};
```

#### 2. 기존 코드와의 호환성
```typescript
// 기존 userName 상태가 있는 경우
const userName = '기존사용자명';
const displayName = nickname || userName || '사용자';

// 댓글/채팅에 적용
const comment = {
  userName: displayName,
  message: commentText,
  // ...
};
```

### 적용된 페이지
- ✅ **Dashboard**: 채팅 메시지, 참여자 목록
- ✅ **Schedule**: 댓글, 채팅, 메모 작성자
- 🔄 **확장 예정**: 알림, 활동 로그, 기타 커뮤니케이션 기능

### 테스트 체크리스트
- [ ] 로그인 후 닉네임이 Dashboard 채팅에 반영되는지
- [ ] 닉네임 변경 시 실시간으로 채팅/댓글에 반영되는지
- [ ] Schedule 페이지 댓글에 닉네임이 올바르게 표시되는지
- [ ] 기존 기능(메시지 전송, 댓글 작성 등)이 정상 동작하는지
- [ ] Schedule 메모 작성자에 닉네임이 반영되는지
- [ ] 일정 생성 시 작성자에 닉네임이 반영되는지
- [ ] 반복 일정 생성 시 작성자에 닉네임이 반영되는지

### 테스트 결과 (2024-12-19)
- ✅ **Dashboard**: 채팅 메시지, 참여자 목록에 닉네임 반영 완료
- ✅ **Schedule**: 댓글, 메모 작성자, 일정 생성자에 닉네임 반영 완료
- ✅ **Layout**: 알림 시스템 준비 완료 (향후 확장용)
- 🔄 **확장 예정**: 알림, 활동 로그, 기타 커뮤니케이션 기능

### 다음 단계 계획
1. **알림 시스템 구현**: 
   - 일정 알림, 메모 알림, 시스템 알림
   - 닉네임 기반 발신자 표시
   - 실시간 알림 기능

2. **활동 로그 시스템**:
   - 사용자별 작업 기록
   - 닉네임 기반 작업자 표시
   - 작업 이력 추적

3. **권한별 표시 개선**:
   - 관리자/직원/손님 구분 표시
   - 권한에 따른 UI 차별화

4. **프로필 시스템 확장**:
   - 아바타, 상태 메시지
   - 개인 설정 관리

## 기존 개발 노트 내용...

*간단하고 핵심적인 내용만 기록* 