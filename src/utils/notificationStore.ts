import { create } from 'zustand';

export interface Notification {
  id: string;
  type: 'schedule' | 'memo' | 'system' | 'delivery' | 'estimate' | 'chat';
  title: string;
  message: string;
  sender: string; // 발신자 닉네임
  timestamp: string;
  isRead: boolean;
  priority: 'low' | 'medium' | 'high';
  actionUrl?: string; // 클릭 시 이동할 URL
  metadata?: {
    eventId?: string;
    deliveryId?: string;
    estimateId?: string;
    [key: string]: any;
  };
}

interface NotificationStore {
  notifications: Notification[];
  unreadCount: number;

  // 액션들
  addNotification: (
    notification: Omit<Notification, 'id' | 'timestamp' | 'isRead'>
  ) => void;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  removeNotification: (id: string) => void;
  clearAll: () => void;
  getUnreadCount: () => number;

  // 알림 생성 헬퍼 함수들
  createScheduleNotification: (
    eventTitle: string,
    message: string,
    sender: string,
    eventId?: string
  ) => void;
  createMemoNotification: (
    memoContent: string,
    sender: string,
    eventId?: string
  ) => void;
  createSystemNotification: (
    title: string,
    message: string,
    priority?: 'low' | 'medium' | 'high'
  ) => void;
  createDeliveryNotification: (
    customerName: string,
    action: string,
    sender: string,
    deliveryId?: string
  ) => void;
  createEstimateNotification: (
    estimateNo: string,
    action: string,
    sender: string,
    estimateId?: string
  ) => void;
  createChatNotification: (
    sender: string,
    message: string,
    eventId?: string
  ) => void;
}

// WebSocket 관련 변수들
let ws: WebSocket | null = null;
let reconnectAttempts = 0;
const MAX_RECONNECT_ATTEMPTS = 5;

const WS_BASE =
  process.env.NODE_ENV === 'development'
    ? 'ws://localhost:4001'
    : process.env.REACT_APP_WS_BASE || 'ws://sixjjang.synology.me:4001';

// WebSocket 연결 함수
export const connectNotificationWebSocket = (userId: string) => {
  if (ws && ws.readyState === WebSocket.OPEN) {
    console.log('WebSocket이 이미 연결되어 있습니다.');
    return;
  }

  // WebSocket 서버 주소 (NAS 환경에서는 실제 IP/도메인으로 변경)
  const wsUrl = WS_BASE;

  // WebSocket URL이 없으면 연결하지 않음
  if (!wsUrl) {
    console.log('WebSocket URL이 설정되지 않았습니다.');
    return;
  }

  try {
    ws = new WebSocket(wsUrl);

    ws.onopen = () => {
      console.log('WebSocket 연결됨');
      reconnectAttempts = 0;

      // 사용자 등록
      ws?.send(
        JSON.stringify({
          type: 'register',
          userId: userId,
        })
      );
    };

    ws.onmessage = event => {
      try {
        const data = JSON.parse(event.data);

        if (data.type === 'register_success') {
          console.log('WebSocket 등록 성공:', data.message);
          return;
        }

        // 알림 메시지 수신
        if (data.type && data.title && data.message) {
          useNotificationStore.getState().addNotification(data);
        }
      } catch (e) {
        console.error('WebSocket 메시지 파싱 오류:', e);
      }
    };

    ws.onclose = () => {
      console.log('WebSocket 연결 종료');
      ws = null;

      // 자동 재연결 (최대 5회)
      if (reconnectAttempts < MAX_RECONNECT_ATTEMPTS) {
        reconnectAttempts++;
        console.log(
          `WebSocket 재연결 시도 ${reconnectAttempts}/${MAX_RECONNECT_ATTEMPTS}`
        );
        setTimeout(() => {
          connectNotificationWebSocket(userId);
        }, 3000); // 3초 후 재연결
      }
    };

    ws.onerror = error => {
      console.log('WebSocket 연결 오류 (무시됨):', error);
    };
  } catch (error) {
    console.log('WebSocket 연결 실패 (무시됨):', error);
  }
};

// WebSocket으로 알림 전송 함수들
export const sendNotificationWS = (targetUserId: string, notification: any) => {
  if (ws && ws.readyState === WebSocket.OPEN) {
    ws.send(
      JSON.stringify({
        type: 'notify',
        targetUserId,
        notification,
      })
    );
  }
};

export const broadcastNotificationWS = (notification: any) => {
  if (ws && ws.readyState === WebSocket.OPEN) {
    ws.send(
      JSON.stringify({
        type: 'broadcast',
        notification,
      })
    );
  }
};

export const notifyStaffWS = (notification: any) => {
  if (ws && ws.readyState === WebSocket.OPEN) {
    ws.send(
      JSON.stringify({
        type: 'notify_staff',
        notification,
      })
    );
  }
};

// WebSocket 연결 해제
export const disconnectNotificationWebSocket = () => {
  if (ws) {
    ws.close();
    ws = null;
  }
};

export const useNotificationStore = create<NotificationStore>((set, get) => ({
  notifications: [],
  unreadCount: 0,

  addNotification: notification => {
    const newNotification: Notification = {
      ...notification,
      id: `notification_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date().toISOString(),
      isRead: false,
    };

    set(state => {
      const newNotifications = [newNotification, ...state.notifications];
      return {
        notifications: newNotifications,
        unreadCount: newNotifications.filter(n => !n.isRead).length,
      };
    });

    // 브라우저 알림 (사용자 권한 확인 후)
    if (Notification.permission === 'granted') {
      new Notification(notification.title, {
        body: notification.message,
        icon: '/logo192.png',
        tag: newNotification.id,
      });
    }
  },

  markAsRead: id => {
    set(state => {
      const updatedNotifications = state.notifications.map(n =>
        n.id === id ? { ...n, isRead: true } : n
      );
      return {
        notifications: updatedNotifications,
        unreadCount: updatedNotifications.filter(n => !n.isRead).length,
      };
    });
  },

  markAllAsRead: () => {
    set(state => ({
      notifications: state.notifications.map(n => ({ ...n, isRead: true })),
      unreadCount: 0,
    }));
  },

  removeNotification: id => {
    set(state => {
      const filteredNotifications = state.notifications.filter(
        n => n.id !== id
      );
      return {
        notifications: filteredNotifications,
        unreadCount: filteredNotifications.filter(n => !n.isRead).length,
      };
    });
  },

  clearAll: () => {
    set({ notifications: [], unreadCount: 0 });
  },

  getUnreadCount: () => {
    return get().notifications.filter(n => !n.isRead).length;
  },

  // 알림 생성 헬퍼 함수들
  createScheduleNotification: (eventTitle, message, sender, eventId) => {
    const notification = {
      type: 'schedule' as const,
      title: `📅 일정 알림: ${eventTitle}`,
      message,
      sender,
      priority: 'medium' as const,
      actionUrl: eventId
        ? `/business/schedule?event=${eventId}`
        : '/business/schedule',
      metadata: { eventId },
    };

    get().addNotification(notification);

    // WebSocket으로 직원들에게 알림 전송
    notifyStaffWS(notification);
  },

  createMemoNotification: (memoContent, sender, eventId) => {
    const notification = {
      type: 'memo' as const,
      title: `📝 메모 알림`,
      message: `${sender}님이 메모를 작성했습니다: ${memoContent.substring(0, 50)}${memoContent.length > 50 ? '...' : ''}`,
      sender,
      priority: 'low' as const,
      actionUrl: eventId
        ? `/business/schedule?event=${eventId}`
        : '/business/schedule',
      metadata: { eventId },
    };

    get().addNotification(notification);
    notifyStaffWS(notification);
  },

  createSystemNotification: (title, message, priority = 'medium') => {
    const notification = {
      type: 'system' as const,
      title: `🔔 ${title}`,
      message,
      sender: '시스템',
      priority,
    };

    get().addNotification(notification);
    broadcastNotificationWS(notification);
  },

  createDeliveryNotification: (customerName, action, sender, deliveryId) => {
    const notification = {
      type: 'delivery' as const,
      title: `🚚 납품 알림: ${customerName}`,
      message: `${sender}님이 ${action}했습니다.`,
      sender,
      priority: 'high' as const,
      actionUrl: deliveryId
        ? `/business/delivery?delivery=${deliveryId}`
        : '/business/delivery',
      metadata: { deliveryId },
    };

    get().addNotification(notification);
    notifyStaffWS(notification);
  },

  createEstimateNotification: (estimateNo, action, sender, estimateId) => {
    const notification = {
      type: 'estimate' as const,
      title: `📋 견적 알림: ${estimateNo}`,
      message: `${sender}님이 ${action}했습니다.`,
      sender,
      priority: 'medium' as const,
      actionUrl: estimateId
        ? `/business/estimate?estimate=${estimateId}`
        : '/business/estimate',
      metadata: { estimateId },
    };

    get().addNotification(notification);
    notifyStaffWS(notification);
  },

  createChatNotification: (sender, message, eventId) => {
    const notification = {
      type: 'chat' as const,
      title: `💬 채팅 알림`,
      message: `${sender}: ${message.substring(0, 50)}${message.length > 50 ? '...' : ''}`,
      sender,
      priority: 'low' as const,
      actionUrl: eventId
        ? `/business/schedule?event=${eventId}`
        : '/business/schedule',
      metadata: { eventId },
    };

    get().addNotification(notification);
    notifyStaffWS(notification);
  },
}));

// 브라우저 알림 권한 요청
export const requestNotificationPermission = async () => {
  if (Notification.permission === 'default') {
    const permission = await Notification.requestPermission();
    return permission === 'granted';
  }
  return Notification.permission === 'granted';
};

// 알림 스토어 초기화 (localStorage 연동)
export const initializeNotificationStore = () => {
  try {
    const savedNotifications = localStorage.getItem('notifications');
    if (savedNotifications) {
      const notifications = JSON.parse(savedNotifications);
      useNotificationStore.setState({
        notifications,
        unreadCount: notifications.filter((n: Notification) => !n.isRead)
          .length,
      });
    }
  } catch (error) {
    console.error('알림 스토어 초기화 오류:', error);
  }
};

// 알림 변경 시 localStorage에 저장
useNotificationStore.subscribe(state => {
  try {
    localStorage.setItem('notifications', JSON.stringify(state.notifications));
  } catch (error) {
    console.error('알림 저장 오류:', error);
  }
});
