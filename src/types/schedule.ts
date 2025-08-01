import { MeasurementRowData } from '../components/MeasurementForm';

// 스케줄 댓글 인터페이스
export interface ScheduleComment {
  id: string;
  eventId: string;
  userId: string;
  userName: string;
  userAvatar?: string;
  message: string;
  timestamp: string;
  attachments?: string[];
  emoji?: string;
}

// 스케줄 알림 인터페이스
export interface ScheduleNotification {
  id: string;
  eventId: string;
  type: 'before_1_day' | 'before_1_hour' | 'on_time' | 'after_1_hour';
  isEnabled: boolean;
  message: string;
}

// 스케줄 공유 인터페이스
export interface ScheduleShare {
  id: string;
  eventId: string;
  sharedWith: string[];
  permissions: 'view' | 'edit' | 'admin';
  sharedAt: string;
}

// 스케줄 통계 인터페이스
export interface ScheduleStats {
  totalEvents: number;
  completedEvents: number;
  pendingEvents: number;
  cancelledEvents: number;
  eventsByType: { [key: string]: number };
  eventsByMonth: { [key: string]: number };
  averageCompletionTime: number;
}

// 일정 타입 관리 인터페이스
export interface ScheduleType {
  id: string;
  name: string;
  color: string;
  order: number;
  isActive: boolean;
  icon?: string;
}

// 스케줄 이벤트 인터페이스
export interface ScheduleEvent {
  id: string;
  title: string;
  date: string;
  time: string;
  type: string;
  description?: string;
  customerName?: string;
  address?: string;
  contact?: string;
  deliveryId?: string;
  asId?: string;
  color?: string;
  priority: '낮음' | '보통' | '높음';
  status: '예정' | '진행중' | '완료' | '취소';
  isLunar?: boolean;
  isYearly?: boolean;
  originalDate?: string;
  startDate?: string;
  endDate?: string;
  endTime?: string; // 종료 시간 추가
  measurementData?: MeasurementRowData[];
  estimateNo?: string; // 견적번호 추가
  // 새로운 필드들
  comments?: ScheduleComment[];
  notifications?: ScheduleNotification[];
  shares?: ScheduleShare[];
  repeatPattern?: 'none' | 'daily' | 'weekly' | 'monthly' | 'yearly';
  repeatEndDate?: string;
  tags?: string[];
  attachments?: string[];
  createdAt: string;
  updatedAt: string;
  createdBy: string;
  assignedTo?: string[];
}

// 연간 이벤트 인터페이스
export interface YearlyEvent {
  title: string;
  month: number;
  day: number;
  time: string;
  description?: string;
  isLunar: boolean;
  isYearly: boolean;
  priority: '낮음' | '보통' | '높음';
}

// 탭 패널 인터페이스
export interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

// 건물 정보 인터페이스
export interface BuildingInfo {
  buildingName: string;
  unitInfo: string;
}

export interface EstimateRow {
  pleatMultiplier?: string;
  pleatCount?: number;
} 