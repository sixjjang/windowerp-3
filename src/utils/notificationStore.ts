import { create } from 'zustand';
import { ref, onValue, push, off } from 'firebase/database';
import { realtimeDb } from '../firebase/config';

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

// Firebase Realtime Database 관련 변수들
let notificationListener: (() => void) | null = null;

// Firebase Realtime Database 연결 함수
export const connectNotificationWebSocket = (userId: string) => {
  if (!userId) {
    console.log('사용자 ID가 없어 알림 연결을 시도하지 않습니다.');
    return;
  }

  // 기존 리스너 제거
  if (notificationListener) {
    notificationListener();
    notificationListener = null;
  }

  try {
    // 사용자별 알림 경로
    const notificationsRef = ref(realtimeDb, `notifications/${userId}`);
    
    // 실시간 알림 리스너 설정
    notificationListener = onValue(notificationsRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        // 새로운 알림이 추가되면 처리
        Object.keys(data).forEach(key => {
          const notification = data[key];
          if (notification && !notification.isRead) {
            useNotificationStore.getState().addNotification(notification);
          }
        });
      }
    }, (error) => {
      console.log('Firebase Realtime Database 연결 오류 (무시됨):', error);
    });

    console.log('Firebase Realtime Database 알림 연결됨');
  } catch (error) {
    console.log('Firebase Realtime Database 연결 실패 (무시됨):', error);
  }
};

// Firebase Realtime Database로 알림 전송 함수들
export const sendNotificationWS = async (targetUserId: string, notification: any) => {
  try {
    const notificationRef = ref(realtimeDb, `notifications/${targetUserId}`);
    await push(notificationRef, {
      ...notification,
      timestamp: new Date().toISOString(),
      isRead: false
    });
  } catch (error) {
    console.log('Firebase Realtime Database 알림 전송 실패:', error);
  }
};

export const broadcastNotificationWS = async (notification: any) => {
  try {
    const broadcastRef = ref(realtimeDb, 'broadcast_notifications');
    await push(broadcastRef, {
      ...notification,
      timestamp: new Date().toISOString(),
      isRead: false
    });
  } catch (error) {
    console.log('Firebase Realtime Database 브로드캐스트 실패:', error);
  }
};

export const notifyStaffWS = async (notification: any) => {
  try {
    const staffRef = ref(realtimeDb, 'staff_notifications');
    await push(staffRef, {
      ...notification,
      timestamp: new Date().toISOString(),
      isRead: false
    });
  } catch (error) {
    console.log('Firebase Realtime Database 직원 알림 실패:', error);
  }
};

// Firebase Realtime Database 연결 해제
export const disconnectNotificationWebSocket = () => {
  if (notificationListener) {
    notificationListener();
    notificationListener = null;
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

// 알림 변경 시 localStorage에 저장 (초기화 후에 설정)
setTimeout(() => {
  useNotificationStore.subscribe(state => {
    try {
      localStorage.setItem('notifications', JSON.stringify(state.notifications));
    } catch (error) {
      console.error('알림 저장 오류:', error);
    }
  });
}, 0);
