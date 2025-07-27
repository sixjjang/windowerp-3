// 채팅 알림 유틸리티 함수들

// 현재 활성화된 채팅창 추적
let activeChatWindows: Set<string> = new Set();

// 현재 사용자 정보
let currentUserId: string | null = null;
let currentUserName: string | null = null;

// 현재 사용자 정보 설정
export const setCurrentUser = (userId: string, userName: string) => {
  currentUserId = userId;
  currentUserName = userName;
};

// 활성 채팅창 등록
export const registerActiveChat = (chatId: string) => {
  activeChatWindows.add(chatId);
  console.log(`📱 활성 채팅창 등록: ${chatId}`);
};

// 활성 채팅창 해제
export const unregisterActiveChat = (chatId: string) => {
  activeChatWindows.delete(chatId);
  console.log(`📱 활성 채팅창 해제: ${chatId}`);
};

// 특정 채팅창이 활성화되어 있는지 확인
export const isChatActive = (chatId: string): boolean => {
  return activeChatWindows.has(chatId);
};

// 메시지 발신자인지 확인
export const isMessageSender = (senderId: string, senderName: string): boolean => {
  return currentUserId === senderId || currentUserName === senderName;
};

// 채팅 알림이 필요한지 확인
export const shouldPlayChatNotification = (
  senderId: string, 
  senderName: string, 
  chatId: string
): boolean => {
  // 1. 메시지 발신자인 경우 알림 제외
  if (isMessageSender(senderId, senderName)) {
    console.log(`🔇 발신자 알림 제외: ${senderName} (${senderId})`);
    return false;
  }

  // 2. 해당 채팅창이 활성화되어 있는 경우 알림 제외
  if (isChatActive(chatId)) {
    console.log(`🔇 활성 채팅창 알림 제외: ${chatId}`);
    return false;
  }

  // 3. 알림 재생 필요
  console.log(`🔔 채팅 알림 재생: ${senderName}의 메시지 (${chatId})`);
  return true;
};

// 전체 사용자 채팅 알림 확인
export const shouldPlayGlobalChatNotification = (
  senderId: string, 
  senderName: string
): boolean => {
  // 1. 메시지 발신자인 경우 알림 제외
  if (isMessageSender(senderId, senderName)) {
    console.log(`🔇 전체 채팅 발신자 알림 제외: ${senderName} (${senderId})`);
    return false;
  }

  // 2. 대시보드가 활성화되어 있는지 확인 (전체 채팅창)
  if (isChatActive('global-chat')) {
    console.log(`🔇 활성 대시보드 알림 제외`);
    return false;
  }

  // 3. 알림 재생 필요
  console.log(`🔔 전체 채팅 알림 재생: ${senderName}의 메시지`);
  return true;
};

// 스케줄 채팅 알림 확인
export const shouldPlayScheduleChatNotification = (
  senderId: string, 
  senderName: string, 
  eventId: string
): boolean => {
  // 1. 메시지 발신자인 경우 알림 제외
  if (isMessageSender(senderId, senderName)) {
    console.log(`🔇 스케줄 채팅 발신자 알림 제외: ${senderName} (${senderId})`);
    return false;
  }

  // 2. 해당 스케줄 채팅창이 활성화되어 있는 경우 알림 제외
  if (isChatActive(`schedule-${eventId}`)) {
    console.log(`🔇 활성 스케줄 채팅창 알림 제외: ${eventId}`);
    return false;
  }

  // 3. 알림 재생 필요
  console.log(`🔔 스케줄 채팅 알림 재생: ${senderName}의 메시지 (이벤트: ${eventId})`);
  return true;
};

// 현재 활성 채팅창 목록 반환 (디버깅용)
export const getActiveChats = (): string[] => {
  return Array.from(activeChatWindows);
};

// 모든 활성 채팅창 초기화
export const clearActiveChats = () => {
  activeChatWindows.clear();
  console.log('📱 모든 활성 채팅창 초기화');
}; 