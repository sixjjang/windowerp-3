import React, { useState, useEffect, useMemo, useRef, useContext } from 'react';
import {
  Grid,
  Paper,
  Typography,
  Box,
  Button,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
  Chip,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Tabs,
  Tab,
  Alert,
  Snackbar,
  Switch,
  FormControlLabel,
  Checkbox,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Stepper,
  Step,
  StepLabel,
  Card,
  CardContent,
  Avatar,
  Badge,
  Tooltip,
  Fab,
  SpeedDial,
  SpeedDialAction,
  SpeedDialIcon,
  Divider,
  ListItemAvatar,
  InputAdornment,
  Collapse,
  useTheme,
  useMediaQuery,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  Stack,
} from '@mui/material';
import {
  ScheduleEvent,
  ScheduleComment,
  ScheduleNotification,
  ScheduleShare,
  ScheduleStats,
  ScheduleType,
  YearlyEvent,
  TabPanelProps,
} from '../../types/schedule';
import {
  KOREAN_HOLIDAYS,
  lunarToSolar,
  solarToLunar,
  extractBuildingInfo,
  generateAutoTitle,
} from '../../utils/scheduleUtils';
import TabPanel from '../../components/schedule/TabPanel';
import { UserContext } from '../../components/Layout';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Event as EventIcon,
  Build as BuildIcon,
  Support as SupportIcon,
  Business as BusinessIcon,
  Today as TodayIcon,
  ViewWeek as ViewWeekIcon,
  ViewModule as ViewModuleIcon,
  ChevronLeft as ChevronLeftIcon,
  ChevronRight as ChevronRightIcon,
  Close as CloseIcon,
  ArrowBack as ArrowBackIcon,
  LocationOn as LocationIcon,
  Phone as PhoneIcon,
  Person as PersonIcon,
  CalendarMonth as CalendarMonthIcon,
  ExpandMore as ExpandMoreIcon,
  Repeat as RepeatIcon,
  DateRange as DateRangeIcon,
  FilterList as FilterIcon,
  Notifications as NotificationsIcon,
  Share as ShareIcon,
  Chat as ChatIcon,
  EmojiEmotions as EmojiIcon,
  AttachFile as AttachFileIcon,
  Send as SendIcon,
  DragIndicator as DragIcon,
  Settings as SettingsIcon,
  Palette as PaletteIcon,
  Visibility as VisibilityIcon,
  VisibilityOff as VisibilityOffIcon,
  MoreVert as MoreVertIcon,
  Refresh as RefreshIcon,
  Analytics as AnalyticsIcon,
  Group as GroupIcon,
  Schedule as ScheduleIcon,
  Alarm as AlarmIcon,
  CheckCircle as CheckCircleIcon,
  Warning as WarningIcon,
  Info as InfoIcon,
  Error as ErrorIcon,
  Notes as NotesIcon,
  Category as CategoryIcon,
  Search as SearchIcon,
  Lock as LockIcon,
  Sync as SyncIcon,
} from '@mui/icons-material';
import { useDeliveryStore } from '../../utils/deliveryStore';
import MeasurementForm, {
  MeasurementRowData,
} from '../../components/MeasurementForm';
import { DragDropContext } from 'react-beautiful-dnd';
import { API_BASE } from '../../utils/auth';
import axios from 'axios';

import { useNotificationStore } from '../../utils/notificationStore';
import Popover from '@mui/material/Popover';
import InsertEmoticonIcon from '@mui/icons-material/InsertEmoticon';
import TimeTreeIntegration from '../../components/TimeTreeIntegration';
import { getTimeTreeSettings, syncWithTimeTree } from '../../utils/timetreeUtils';
import { playScheduleNotification, playChatNotification, initializeAudioOnUserInteraction } from '../../utils/soundUtils';
import { 
  setCurrentUser as setChatCurrentUser, 
  registerActiveChat, 
  unregisterActiveChat, 
  shouldPlayScheduleChatNotification 
} from '../../utils/chatNotificationUtils';

// Firestore 실시간 채팅을 위한 import 추가
import { db } from '../../firebase/config';
import { 
  collection, 
  doc, 
  addDoc, 
  onSnapshot, 
  orderBy, 
  query, 
  serverTimestamp,
  deleteDoc,
  updateDoc
} from 'firebase/firestore';
import { fcmService } from '../../utils/firebaseDataService';

// 메모 인터페이스 추가

// 카테고리 관리 인터페이스 추가

// 프로필 이미지 URL 검증 함수
const isValidProfileImageUrl = (url: string): boolean => {
  return Boolean(url && (
    url.startsWith('data:') ||
    url.startsWith('https://storage.googleapis.com/') ||
    url.startsWith('https://firebasestorage.googleapis.com/')
  ));
};

const Schedule: React.FC = () => {
  const { deliveries } = useDeliveryStore();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const { nickname, profileImage } = useContext(UserContext);

  const { createScheduleNotification } = useNotificationStore();
  
  // 중복 처리 방지를 위한 ref
  const processedDeliveryIds = useRef<Set<string>>(new Set());
  
  // 채팅 자동 스크롤을 위한 ref
  const chatScrollRef = useRef<HTMLDivElement>(null);
  
  // 채팅 자동 스크롤 함수
  const scrollToBottom = () => {
    if (chatScrollRef.current) {
      chatScrollRef.current.scrollTop = chatScrollRef.current.scrollHeight;
    }
  };

  // 기본 상태 관리
  const [events, setEvents] = useState<ScheduleEvent[]>([]);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewMode, setViewMode] = useState(0); // 0: 월간, 1: 주간, 2: 일간
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [eventDialogOpen, setEventDialogOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState<ScheduleEvent | null>(null);
  const [snackbar, setSnackbar] = useState<{
    open: boolean;
    message: string;
    severity: 'success' | 'error' | 'warning' | 'info';
  }>({
    open: false,
    message: '',
    severity: 'success',
  });

  // 새로운 기능들을 위한 상태들

  const [draggedEvent, setDraggedEvent] = useState<ScheduleEvent | null>(null);

  const [chatDialogOpen, setChatDialogOpen] = useState(false);
  const [selectedEventForChat, setSelectedEventForChat] =
    useState<ScheduleEvent | null>(null);
  const [newComment, setNewComment] = useState('');
  const [commentAttachments, setCommentAttachments] = useState<File[]>([]);

  const [notifications, setNotifications] = useState<ScheduleNotification[]>(
    []
  );
  const [notificationSettings, setNotificationSettings] = useState({
    before1Day: true,
    before1Hour: true,
    onTime: true,
    after1Hour: false,
  });

  const [shareDialogOpen, setShareDialogOpen] = useState(false);
  const [selectedEventForShare, setSelectedEventForShare] =
    useState<ScheduleEvent | null>(null);

  const [stats, setStats] = useState<ScheduleStats>({
    totalEvents: 0,
    completedEvents: 0,
    pendingEvents: 0,
    cancelledEvents: 0,
    eventsByType: {},
    eventsByMonth: {},
    averageCompletionTime: 0,
  });

  // 타입 관리 상태
  const [scheduleTypes, setScheduleTypes] = useState<ScheduleType[]>(() => {
    const savedTypes = localStorage.getItem('scheduleTypes');
    if (savedTypes) {
      return JSON.parse(savedTypes);
    }
    return [
      {
        id: '1',
        name: '매장상담',
        color: '#1565c0',
        order: 1,
        isActive: true,
        icon: 'Business',
      },
      {
        id: '2',
        name: '실측',
        color: '#2e7d32',
        order: 2,
        isActive: true,
        icon: 'DateRange',
      },
      {
        id: '3',
        name: '시공',
        color: '#ef6c00',
        order: 3,
        isActive: true,
        icon: 'Build',
      },
      {
        id: '4',
        name: 'AS',
        color: '#c62828',
        order: 4,
        isActive: true,
        icon: 'Support',
      },
      {
        id: '5',
        name: '개인',
        color: '#6a1b9a',
        order: 5,
        isActive: true,
        icon: 'Person',
      },
      {
        id: '6',
        name: '병원',
        color: '#0277bd',
        order: 6,
        isActive: true,
        icon: 'Event',
      },
      {
        id: '7',
        name: '여행',
        color: '#388e3c',
        order: 7,
        isActive: true,
        icon: 'Event',
      },
      {
        id: '8',
        name: '기타',
        color: '#9e9e9e',
        order: 8,
        isActive: true,
        icon: 'Category',
      },
    ];
  });

  const [typeManagementOpen, setTypeManagementOpen] = useState(false);
  const [editingType, setEditingType] = useState<ScheduleType | null>(null);

  // 타입 설정이 변경될 때마다 localStorage에 저장
  useEffect(() => {
    localStorage.setItem('scheduleTypes', JSON.stringify(scheduleTypes));
  }, [scheduleTypes]);
  const [statsDialogOpen, setStatsDialogOpen] = useState(false);

  const [measurementDialogOpen, setMeasurementDialogOpen] = useState(false);
  const [currentMeasurementEvent, setCurrentMeasurementEvent] =
    useState<ScheduleEvent | null>(null);
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);
  const [selectedEvents, setSelectedEvents] = useState<ScheduleEvent[]>([]);
  const [yearlyEventDialogOpen, setYearlyEventDialogOpen] = useState(false);
  const [yearlyEvent, setYearlyEvent] = useState<YearlyEvent>({
    title: '',
    month: 1,
    day: 1,
    time: '09:00',
    description: '',
    isLunar: false,
    isYearly: true,
    priority: '보통',
  });
  const [activeStep, setActiveStep] = useState(0);
  const [newEvent, setNewEvent] = useState<
    Partial<ScheduleEvent> & { estimateNo?: string; endTime?: string }
  >(() => {
    // 타임존 문제 해결: 로컬 날짜 문자열 사용
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const dateStr = `${year}-${month}-${day}`;

    return {
      title: '',
      date: dateStr,
      time: '09:00',
      type: '매장상담',
      description: '',
      priority: '보통',
      status: '예정',
      isLunar: false,
      isYearly: false,
      startDate: dateStr,
      endDate: undefined, // 기간 설정이 아닌 경우 undefined
      endTime: '10:00', // 종료 시간 기본값
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      createdBy: 'current_user',
      estimateNo: '',
    };
  });

  // 기간 설정 여부를 별도로 관리
  const [isPeriodMode, setIsPeriodMode] = useState(false);

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [speedDialOpen, setSpeedDialOpen] = useState(false);

  // 사용자 정보 상태 (채팅 권한 체크 제거)
  const [currentUser, setCurrentUser] = useState<{ id: number; username: string; role: string } | null>(null);
  const [hasChatPermission, setHasChatPermission] = useState<boolean>(true); // 항상 허용
  const [permissionLoading, setPermissionLoading] = useState<boolean>(false); // 로딩 불필요

  // 통합 일정 모달 상태
  const [integratedEventDialogOpen, setIntegratedEventDialogOpen] = useState(false);
  const [selectedEventForEdit, setSelectedEventForEdit] = useState<ScheduleEvent | null>(null);
  const [integratedEventData, setIntegratedEventData] = useState<Partial<ScheduleEvent>>({});
  const [integratedEventComments, setIntegratedEventComments] = useState<ScheduleComment[]>([]);
  const [newIntegratedComment, setNewIntegratedComment] = useState('');
  const [integratedIsPeriodMode, setIntegratedIsPeriodMode] = useState(false);

  // 실시간 채팅 관련 상태 추가
  const [realTimeComments, setRealTimeComments] = useState<{ [eventId: string]: ScheduleComment[] }>({});
  const [commentUnsubscribers, setCommentUnsubscribers] = useState<{ [eventId: string]: () => void }>({});
  const [chatDataLoaded, setChatDataLoaded] = useState<{ [eventId: string]: boolean }>({});

  // 타임트리 연동 상태
  const [timeTreeDialogOpen, setTimeTreeDialogOpen] = useState(false);
  const [timeTreeSettings] = useState(getTimeTreeSettings());

  // 새로운 상태 추가
  const [emojiAnchorEl, setEmojiAnchorEl] = useState<null | HTMLElement>(null);

  // 1. state 추가
  const [integratedRepeatPattern, setIntegratedRepeatPattern] = useState<'none' | 'daily' | 'weekly' | 'monthly' | 'yearly'>('none');
  const [integratedRepeatEndDate, setIntegratedRepeatEndDate] = useState<string>('');

  // 사용자 이름 입력 모달 관련 상태 제거 - UserContext 사용
  
  // 사용자 이름 입력 모달 제거 - UserContext의 nickname 사용

  // 현재 사용자 정보 조회 (채팅 권한 체크 제거)
  const fetchCurrentUserAndPermissions = async () => {
    try {
      setPermissionLoading(true);
      const token = localStorage.getItem('token');
      
      if (!token) {
        console.warn('토큰이 없습니다.');
        setPermissionLoading(false);
        return;
      }

      // 현재 사용자 정보 조회
      const userResponse = await axios.get(`${API_BASE}/me`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (userResponse.data && userResponse.data.id) {
        setCurrentUser(userResponse.data);
        // 채팅 권한은 항상 허용
        setHasChatPermission(true);
        
        // chatNotificationUtils에 현재 사용자 정보 설정
        const userId = userResponse.data.id.toString();
        const userName = userResponse.data.username || userResponse.data.nickname || '사용자';
        setChatCurrentUser(userId, userName);
        console.log(`👤 스케줄 페이지 사용자 설정: ${userName} (${userId})`);
        console.log(`👤 chatNotificationUtils 사용자 설정 완료`);
      }
    } catch (error) {
      console.error('사용자 정보 조회 실패:', error);
    } finally {
      setPermissionLoading(false);
    }
  };

  // 닉네임 로드 함수
  const loadNickname = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        console.warn('토큰이 없어서 닉네임을 로드할 수 없습니다.');
        return;
      }

      const response = await fetch(`${API_BASE}/nickname`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        if (data.nickname && data.nickname.trim()) {
          console.log('서버에서 닉네임 로드:', data.nickname);
        } else {
          console.log('서버에 저장된 닉네임이 없습니다.');
        }
      } else {
        console.warn('닉네임 로드 실패:', response.status);
      }
    } catch (error) {
      console.error('닉네임 로드 오류:', error);
    }
  };



  // 스케줄 페이지 활성화/비활성화 관리
  useEffect(() => {
    registerActiveChat('schedule-page');
    console.log('📱 스케줄 페이지 활성화');
    
    return () => {
      unregisterActiveChat('schedule-page');
      console.log('📱 스케줄 페이지 비활성화');
    };
  }, []);

  // 컴포넌트 마운트 시 사용자 정보 조회
  useEffect(() => {
    fetchCurrentUserAndPermissions();
    loadNickname();
  }, []);

  // 사용자 상호작용 시 AudioContext 초기화
  useEffect(() => {
    const handleUserInteraction = () => {
      console.log('👆 사용자 상호작용 감지 - AudioContext 초기화');
      initializeAudioOnUserInteraction(currentUser?.id?.toString());
    };

    // 사용자 상호작용 이벤트 리스너 추가
    document.addEventListener('click', handleUserInteraction, { once: true });
    document.addEventListener('keydown', handleUserInteraction, { once: true });
    document.addEventListener('touchstart', handleUserInteraction, { once: true });

    return () => {
      document.removeEventListener('click', handleUserInteraction);
      document.removeEventListener('keydown', handleUserInteraction);
      document.removeEventListener('touchstart', handleUserInteraction);
    };
  }, [currentUser?.id]);

  // 알림소리 테스트 (개발용) - 사용자 상호작용 후에만 실행
  useEffect(() => {
    const testSound = () => {
      console.log('🔊 알림소리 테스트 시작...');
      try {
        playChatNotification(currentUser?.id?.toString() || 'current_user');
        console.log('✅ 알림소리 테스트 성공');
      } catch (error) {
        console.error('❌ 알림소리 테스트 실패:', error);
      }
    };

    // 5초 후에 테스트 실행 (사용자 상호작용 후)
    const timer = setTimeout(testSound, 5000);
    
    return () => clearTimeout(timer);
  }, [currentUser?.id]);

  // 스케줄 상세 모달 채팅창 활성/비활성 관리 (모든 일정 타입)
  useEffect(() => {
    if (chatDialogOpen && selectedEventForChat) {
      registerActiveChat(`schedule-${selectedEventForChat.id}`);
      console.log(`📱 스케줄 채팅창 활성화: schedule-${selectedEventForChat.id}`);
    } else if (selectedEventForChat) {
      unregisterActiveChat(`schedule-${selectedEventForChat.id}`);
      console.log(`📱 스케줄 채팅창 비활성화: schedule-${selectedEventForChat.id}`);
    }
    return () => {
      if (selectedEventForChat) {
        unregisterActiveChat(`schedule-${selectedEventForChat.id}`);
      }
    };
  }, [chatDialogOpen, selectedEventForChat]);

  // 통합 모달 채팅창 활성/비활성 관리 (모든 일정 타입)
  useEffect(() => {
    if (integratedEventDialogOpen && selectedEventForEdit) {
      registerActiveChat(`schedule-${selectedEventForEdit.id}`);
      console.log(`📱 통합 모달 채팅창 활성화: schedule-${selectedEventForEdit.id}`);
    } else if (selectedEventForEdit) {
      unregisterActiveChat(`schedule-${selectedEventForEdit.id}`);
      console.log(`📱 통합 모달 채팅창 비활성화: schedule-${selectedEventForEdit.id}`);
    }
    return () => {
      if (selectedEventForEdit) {
        unregisterActiveChat(`schedule-${selectedEventForEdit.id}`);
      }
    };
  }, [integratedEventDialogOpen, selectedEventForEdit]);

  // 실시간 댓글 구독 함수 (개선됨)
  const subscribeToComments = (eventId: string) => {
    // 이미 로드된 경우 스킵
    if (chatDataLoaded[eventId]) {
      return;
    }

    // 기존 구독이 있으면 해제
    if (commentUnsubscribers[eventId]) {
      commentUnsubscribers[eventId]();
    }

    console.log(`채팅 데이터 구독 시작: ${eventId}`);

    const commentsRef = collection(db, 'schedules', eventId, 'comments');
    const q = query(commentsRef, orderBy('timestamp', 'asc'));
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const comments: ScheduleComment[] = [];
      snapshot.forEach((doc) => {
        const data = doc.data();
        comments.push({
          id: doc.id,
          eventId: data.eventId,
          userId: data.userId,
          userName: data.userName,
          userAvatar: data.userAvatar,
          message: data.message,
          timestamp: data.timestamp?.toDate?.()?.toISOString() || data.timestamp,
          attachments: data.attachments || [],
          emoji: data.emoji,
        });
      });
      
      console.log(`채팅 데이터 업데이트: ${eventId}`, comments.length);
      
      // 새로운 댓글이 있는지 확인하고 알림 소리 재생
      const previousComments = realTimeComments[eventId] || [];
      if (comments.length > previousComments.length && previousComments.length > 0) {
        // 새로운 댓글들 확인
        const newComments = comments.slice(previousComments.length);
        
        newComments.forEach((newComment: ScheduleComment) => {
          console.log(`🔍 새 메시지 확인: ${newComment.userName} (${newComment.userId}) -> 이벤트: ${eventId}`);
          console.log(`🔍 현재 사용자: ${currentUser?.username} (${currentUser?.id})`);
          
          // 발신자가 아니고, 알림이 필요한 경우에만 알림 소리 재생
          if (shouldPlayScheduleChatNotification(
            newComment.userId || newComment.userName, 
            newComment.userName || '알 수 없는 사용자',
            eventId
          )) {
            try {
              const userId = currentUser?.id?.toString();
              console.log(`🔔 알림소리 재생 시도: userId=${userId}`);
              playChatNotification(userId || 'current_user');
              console.log(`🔔 스케줄 채팅 알림 재생: ${newComment.userName}의 메시지 (이벤트: ${eventId})`);
            } catch (error) {
              console.error('스케줄 채팅 알림 소리 재생 실패:', error);
            }
          } else {
            console.log(`🔇 알림소리 재생 제외: ${newComment.userName}의 메시지`);
          }
        });
      }
      
      setRealTimeComments(prev => ({
        ...prev,
        [eventId]: comments
      }));

      // 로드 완료 표시 (한 번만 실행되도록 최적화)
      setChatDataLoaded(prev => {
        if (prev[eventId]) return prev; // 이미 로드된 경우 스킵
        return {
          ...prev,
          [eventId]: true
        };
      });
    }, (error) => {
      console.error('댓글 구독 오류:', error);
      console.error('Firebase 인증 상태 확인 필요');
    });

    // 구독 해제 함수 저장
    setCommentUnsubscribers(prev => ({
      ...prev,
      [eventId]: unsubscribe
    }));
  };

  // 모든 일정의 채팅 데이터 자동 로딩 (Firebase에서 직접 로드)
  useEffect(() => {
    if (events.length > 0) {
      console.log('모든 일정의 채팅 데이터 로딩 시작:', events.length);
      
      // 모든 이벤트에 대해 Firestore 구독 시작
      events.forEach(event => {
        if (!chatDataLoaded[event.id]) {
          subscribeToComments(event.id);
        }
      });
    }
  }, [events]); // chatDataLoaded 의존성 제거 - 무한 루프 방지

  // 채팅 다이얼로그가 열릴 때 실시간 구독 시작 (기존 로직 유지)
  useEffect(() => {
    if (selectedEventForChat && !chatDataLoaded[selectedEventForChat.id]) {
      subscribeToComments(selectedEventForChat.id);
    }
  }, [selectedEventForChat?.id]); // chatDataLoaded 의존성 제거

  // 통합 모달이 열릴 때도 실시간 댓글 구독 시작 (기존 로직 유지)
  useEffect(() => {
    if (selectedEventForEdit && integratedEventDialogOpen && !chatDataLoaded[selectedEventForEdit.id]) {
      subscribeToComments(selectedEventForEdit.id);
    }
  }, [selectedEventForEdit?.id, integratedEventDialogOpen]); // chatDataLoaded 의존성 제거

  // 컴포넌트 언마운트 시 모든 구독 해제
  useEffect(() => {
    return () => {
      console.log('컴포넌트 언마운트 - 모든 채팅 구독 해제');
      Object.values(commentUnsubscribers).forEach(unsubscribe => {
        if (unsubscribe) unsubscribe();
      });
    };
  }, [commentUnsubscribers]);

  // 채팅 메시지가 변경될 때 자동 스크롤
  useEffect(() => {
    // 채팅 다이얼로그가 열려있을 때만 자동 스크롤
    if (selectedEventForChat && selectedEventForChat.comments) {
      // 약간의 지연을 두어 DOM 업데이트 후 스크롤
      setTimeout(() => {
        scrollToBottom();
      }, 100);
    }
  }, [selectedEventForChat?.comments]);

  // 통합 모달의 채팅 메시지가 변경될 때 자동 스크롤
  useEffect(() => {
    // 통합 모달이 열려있을 때만 자동 스크롤
    if (selectedEventForEdit && integratedEventDialogOpen && realTimeComments[selectedEventForEdit.id]) {
      // 약간의 지연을 두어 DOM 업데이트 후 스크롤
      setTimeout(() => {
        scrollToBottom();
      }, 100);
    }
  }, [realTimeComments, selectedEventForEdit?.id, integratedEventDialogOpen]);

  // 납품관리 메모 변경 시 스케줄 업데이트
  useEffect(() => {
    // 납품관리 메모가 변경될 때마다 스케줄의 description 업데이트
    const updateScheduleDescriptions = () => {
      setEvents(prevEvents =>
        prevEvents.map(event => {
          if (event.deliveryId) {
            const delivery = deliveries.find(d => d.id === event.deliveryId);
            if (delivery) {
              const memoText = delivery.memo ? `\n메모: ${delivery.memo}` : '';
              return {
                ...event,
                description: `주소: ${delivery.address}\n연락처: ${delivery.contact}\n할인후금액: ${delivery.finalAmount}\n현재입금액: ${delivery.paidAmount}\n잔액: ${delivery.remainingAmount}${memoText}`,
                updatedAt: new Date().toISOString(),
              };
            }
          }
          return event;
        })
      );
    };

    updateScheduleDescriptions();
  }, [deliveries]); // deliveries가 변경될 때마다 실행

  // 실측 다이얼로그가 열릴 때 Firebase 구독 시작 및 견적번호 자동 연결
  useEffect(() => {
    if (measurementDialogOpen && currentMeasurementEvent) {
      // Firebase 구독 시작
      if (!chatDataLoaded[currentMeasurementEvent.id]) {
        subscribeToComments(currentMeasurementEvent.id);
      }
      
      // 견적번호 자동 연결
      if (!currentMeasurementEvent.estimateNo) {
        const savedEstimates = JSON.parse(
          localStorage.getItem('saved_estimates') || '[]'
        );
        const recentEstimates = savedEstimates
          .filter(
            (est: any) =>
              est.status === '계약완료' ||
              est.status === '진행' ||
              est.status === 'signed'
          )
          .sort(
            (a: any, b: any) =>
              new Date(b.savedAt || b.estimateDate || 0).getTime() -
              new Date(a.savedAt || a.estimateDate || 0).getTime()
          );

        const latestEstimate = recentEstimates[0];
        if (latestEstimate) {
          const updatedEvent = {
            ...currentMeasurementEvent,
            estimateNo: latestEstimate.estimateNo,
            updatedAt: new Date().toISOString(),
          };
          setEvents(prev =>
            prev.map(event =>
              event.id === currentMeasurementEvent.id ? updatedEvent : event
            )
          );
          setCurrentMeasurementEvent(updatedEvent);
          console.log('견적번호 자동 연결:', latestEstimate.estimateNo);
        }
      }
    }
  }, [measurementDialogOpen, currentMeasurementEvent?.id]); // chatDataLoaded 의존성 제거

  // 사용자 이름 입력 관련 함수들 제거 - UserContext 사용

  // 스케줄 데이터 로드
  useEffect(() => {
    const loadSchedules = async () => {
      try {
        // 먼저 localStorage에서 데이터 로드 (빠른 로딩)
        const localSchedules = localStorage.getItem('schedules');
        if (localSchedules) {
          const localData = JSON.parse(localSchedules);
          setEvents(localData);
        }

        // 현재 날짜 기준으로 로드할 기간 설정 (전후 6개월씩, 총 13개월)
        const currentDate = new Date();
        const startDate = new Date(currentDate.getFullYear(), currentDate.getMonth() - 6, 1);
        const endDate = new Date(currentDate.getFullYear(), currentDate.getMonth() + 6, 0);
        
        const startDateStr = startDate.toISOString().split('T')[0];
        const endDateStr = endDate.toISOString().split('T')[0];

        console.log(`스케줄 로드 기간: ${startDateStr} ~ ${endDateStr}`);

        // Firebase Functions에서 기간별 데이터 로드
        const response = await fetch(`${API_BASE}/schedules?startDate=${startDateStr}&endDate=${endDateStr}`);
        console.log('스케줄 로드 응답 상태:', response.status);
        
        if (response.ok) {
          const serverData = await response.json();
          console.log('서버에서 받은 스케줄 데이터 개수:', serverData.length);
          
          // 서버 데이터를 그대로 사용 (실제 Firebase 문서 상태 반영)
          // ID가 일관되게 유지되도록 처리
          const processedData = serverData.map((event: any) => ({
            ...event,
            id: event.id || event.firestoreId || generateEventId()
          }));
          
          setEvents(processedData);
          localStorage.setItem('schedules', JSON.stringify(processedData));
        } else {
          console.error('스케줄 로드 실패:', response.statusText);
          // API 실패 시 localStorage 데이터 유지
          const localSchedules = localStorage.getItem('schedules');
          if (localSchedules) {
            const localData = JSON.parse(localSchedules);
            setEvents(localData);
          }
        }
      } catch (error) {
        console.error('스케줄 로드 오류:', error);
        // 에러 발생 시 localStorage 데이터 유지
      }
    };

    loadSchedules();
  }, []);

  // 음력 날짜를 양력으로 변환하는 함수


  // 1년 일정 등록 핸들러
  const handleYearlyEventSave = () => {
    if (!yearlyEvent.title) {
      setSnackbar({
        open: true,
        message: '제목을 입력해주세요.',
        severity: 'error',
      });
      return;
    }

    const currentYear = new Date().getFullYear();
    const eventsToAdd: ScheduleEvent[] = [];

    // 1년간의 일정 생성
    for (let year = currentYear; year <= currentYear + 10; year++) {
      let targetDate: Date;

      if (yearlyEvent.isLunar) {
        // 음력인 경우 양력으로 변환
        targetDate = lunarToSolar(year, yearlyEvent.month, yearlyEvent.day);
      } else {
        // 양력인 경우 그대로 사용
        targetDate = new Date(year, yearlyEvent.month - 1, yearlyEvent.day);
      }

      // 유효한 날짜인지 확인
      if (
        targetDate.getMonth() === yearlyEvent.month - 1 &&
        targetDate.getDate() === yearlyEvent.day
      ) {
        // 타임존 문제 해결: 로컬 날짜 문자열 사용
        const year = targetDate.getFullYear();
        const month = String(targetDate.getMonth() + 1).padStart(2, '0');
        const day = String(targetDate.getDate()).padStart(2, '0');
        const eventDate = `${year}-${month}-${day}`;

        const newEvent: ScheduleEvent = {
          id: generateEventId(`yearly-${year}-${yearlyEvent.month}-${yearlyEvent.day}`),
          title: yearlyEvent.title,
          date: eventDate,
          time: yearlyEvent.time,
          type: '개인',
          description: yearlyEvent.description,
          priority: yearlyEvent.priority,
          status: '예정',
          color: '#ff9800',
          isLunar: yearlyEvent.isLunar,
          isYearly: yearlyEvent.isYearly,
          originalDate: `${year}-${yearlyEvent.month.toString().padStart(2, '0')}-${yearlyEvent.day.toString().padStart(2, '0')}`,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          createdBy: 'current_user',
        };

        eventsToAdd.push(newEvent);
      }
    }

    // 기존 일정에 추가
    const updatedEvents = [...events, ...eventsToAdd];
    setEvents(updatedEvents);
    
    // localStorage 업데이트
    localStorage.setItem('schedules', JSON.stringify(updatedEvents));
    
    // 연간 일정 등록 알림 소리 재생
    try {
      playScheduleNotification(currentUser?.id?.toString() || 'current_user');
      console.log(`🔔 연간 일정 등록 알림 재생: ${eventsToAdd.length}개 일정 (${yearlyEvent.title})`);
    } catch (error) {
      console.error('연간 일정 등록 알림 소리 재생 실패:', error);
    }
    
    setSnackbar({
      open: true,
      message: `${eventsToAdd.length}개의 일정이 등록되었습니다.`,
      severity: 'success',
    });

    // 다이얼로그 닫기 및 상태 초기화
    setYearlyEventDialogOpen(false);
    setYearlyEvent({
      title: '',
      month: 1,
      day: 1,
      time: '09:00',
      description: '',
      isLunar: false,
      isYearly: true,
      priority: '보통',
    });
    setActiveStep(0);
  };

  // 스텝 변경 핸들러
  const handleNext = () => {
    handleDateChange('next');
  };

  const handleBack = () => {
    handleDateChange('prev');
  };

  // 납품건에서 시공 일정 자동 생성
  useEffect(() => {
    // 이미 처리된 delivery ID들 필터링
    const newDeliveries = deliveries.filter(delivery => 
      delivery.constructionDate && !processedDeliveryIds.current.has(delivery.id)
    );
    
    // 새로운 delivery ID들을 processedDeliveryIds에 추가
    newDeliveries.forEach(delivery => {
      processedDeliveryIds.current.add(delivery.id);
    });
    
    const deliveryEvents: ScheduleEvent[] = newDeliveries
      .map(delivery => {
        // 계약서에서 시공일자 우선 확인 (데이터 일관성 유지)
        let constructionDate = delivery.constructionDate;
        let constructionTime = delivery.constructionTime;

        try {
          const contracts = JSON.parse(
            localStorage.getItem('contracts') || '[]'
          );
          const contract = contracts.find(
            (c: any) =>
              c.customerName === delivery.customerName &&
              c.projectName === delivery.projectName
          );

          if (contract && contract.constructionDate) {
            const contractDateTime = new Date(contract.constructionDate);
            const year = contractDateTime.getFullYear();
            const month = String(contractDateTime.getMonth() + 1).padStart(
              2,
              '0'
            );
            const day = String(contractDateTime.getDate()).padStart(2, '0');
            const hours = String(contractDateTime.getHours()).padStart(2, '0');
            const minutes = String(contractDateTime.getMinutes()).padStart(
              2,
              '0'
            );

            constructionDate = `${year}-${month}-${day}`;
            constructionTime = `${hours}:${minutes}`;
          }
        } catch (error) {
          console.error('계약서 확인 중 오류:', error);
        }

        return {
          id: `delivery-${delivery.id}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          title: `${delivery.customerName} - ${delivery.projectName}`,
          date: constructionDate,
          time: constructionTime,
          type: '시공' as const,
          description: `시공/납품: ${delivery.constructionType}`,
          customerName: delivery.customerName,
          address: delivery.address,
          contact: delivery.contact,
          deliveryId: delivery.id,
          color: getTypeColor('시공'),
          priority: '높음' as const,
          status: '예정' as const,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          createdBy: 'system',
        };
      });

        // AS 일정 자동 생성 (이미 처리된 AS ID들 필터링)
    const processedAsIds = new Set<string>();
    const asEvents: ScheduleEvent[] = deliveries.flatMap(
      delivery =>
        delivery.asRecords
          ?.filter(as => as.visitDate && !processedAsIds.has(as.id))
          .map(as => {
            processedAsIds.add(as.id);
            const visitDateTime = new Date(as.visitDate!);
            const year = visitDateTime.getFullYear();
            const month = String(visitDateTime.getMonth() + 1).padStart(2, '0');
            const day = String(visitDateTime.getDate()).padStart(2, '0');
            const hours = String(visitDateTime.getHours()).padStart(2, '0');
            const minutes = String(visitDateTime.getMinutes()).padStart(2, '0');

            const visitDate = `${year}-${month}-${day}`;
            const visitTime = `${hours}:${minutes}`;

            return {
              id: `as-${as.id}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
              title: `${delivery.customerName} - AS`,
              date: visitDate,
              time: visitTime,
              type: 'AS' as const,
              description: as.issue,
              customerName: delivery.customerName,
              address: delivery.address,
              contact: delivery.contact,
              deliveryId: delivery.id,
              asId: as.id,
              color: getTypeColor('AS'),
              priority: as.status === '접수' ? '높음' : ('보통' as const),
              status:
                as.status === '완료'
                  ? '완료'
                  : as.status === '처리중'
                    ? '진행중'
                    : ('예정' as const),
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
              createdBy: 'system',
            };
          }) || []
    );

    // 기존 이벤트에서 delivery와 as 이벤트 ID들을 수집
    const existingDeliveryIds = new Set(
      events
        .filter(event => event.id.startsWith('delivery-') || event.id.startsWith('as-'))
        .map(event => event.id)
    );
    
    // 중복되지 않는 이벤트만 필터링
    const uniqueDeliveryEvents = deliveryEvents.filter(
      event => !existingDeliveryIds.has(event.id)
    );
    const uniqueAsEvents = asEvents.filter(
      event => !existingDeliveryIds.has(event.id)
    );
    
    // 기존 수동 이벤트 + 새로운 고유한 delivery/as 이벤트들
    const existingManualEvents = events.filter(
      event => !event.id.startsWith('delivery-') && !event.id.startsWith('as-')
    );
    
    // 최종 이벤트 배열 생성 (중복 제거)
    const finalEvents = [...existingManualEvents, ...uniqueDeliveryEvents, ...uniqueAsEvents];
    
    // 추가 중복 제거 (같은 ID를 가진 이벤트가 여러 개 있는 경우)
    const uniqueEvents = finalEvents.filter((event, index, self) => 
      index === self.findIndex(e => e.id === event.id)
    );
    
    setEvents(uniqueEvents);
  }, [deliveries]);

  // 현재 월의 날짜들 계산
  const currentMonthDates = useMemo(() => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const startDate = new Date(firstDay);
    startDate.setDate(startDate.getDate() - firstDay.getDay());

    const dates = [];
    const current = new Date(startDate);

    while (current <= lastDay || current.getDay() !== 0) {
      dates.push(new Date(current));
      current.setDate(current.getDate() + 1);
    }

    return dates;
  }, [currentDate]);

  // 필터링된 이벤트들 가져오기
  const getFilteredEvents = () => {
    let filtered = events;
    if (activeType !== 'all') {
      filtered = filtered.filter(event => event.type === activeType);
    }
    if (searchText && searchText.trim()) {
      const lower = searchText.trim().toLowerCase();
      filtered = filtered.filter(
        event =>
          (event.title || '').toLowerCase().includes(lower) ||
          (event.customerName || '').toLowerCase().includes(lower) ||
          (event.contact || '').toLowerCase().includes(lower) ||
          (event.address || '').toLowerCase().includes(lower) ||
          (event.description || '').toLowerCase().includes(lower) ||
          event.comments?.some(c =>
            c && c.message && (c.message || '').toLowerCase().includes(lower)
          )
      );
    }
    return filtered;
  };

  // 특정 날짜의 이벤트들 (필터링 적용)
  const getEventsForDateLocal = (date: Date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const dateStr = `${year}-${month}-${day}`;
    return getFilteredEvents().filter(event => {
      if (event.startDate && event.endDate) {
        // 시작일과 종료일이 같은 경우는 정확히 그 날짜에만 표시
        if (event.startDate === event.endDate) {
          return event.startDate === dateStr;
        }
        // 시작일과 종료일이 다른 경우는 범위 검사
        return event.startDate <= dateStr && dateStr <= event.endDate;
      }
      return event.date === dateStr;
    });
  };

  // 이벤트 타입별 색상 (카테고리 우선)
  const getEventColor = (type: string) => {
    return getTypeColor(type);
  };

  // 날짜 클릭 핸들러
  const handleDateClick = (date: Date) => {
    setSelectedDate(date);
    const eventsForDate = getEventsForDateLocal(date);
    if (eventsForDate.length > 0) {
      setSelectedEvents(eventsForDate);
      setDetailDialogOpen(true);
    } else {
      // 해당 날짜에 일정이 없으면 새 일정 생성 다이얼로그 열기
      // 타임존 문제 해결: 로컬 날짜 문자열 사용
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      const dateStr = `${year}-${month}-${day}`;

      setNewEvent(() => {
        // 클릭한 날짜를 사용
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        const dateStr = `${year}-${month}-${day}`;

        return {
          title: '',
          date: dateStr,
          time: '09:00',
          type: '매장상담',
          description: '',
          priority: '보통',
          status: '예정',
          isLunar: false,
          isYearly: false,
          startDate: dateStr,
          endDate: dateStr,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          createdBy: 'current_user',
          estimateNo: '',
        };
      });
      setIsPeriodMode(false);
      setEventDialogOpen(true);
    }
  };

  // 일정 클릭 핸들러 (개별 일정 클릭 시)
  const handleEventClick = (event: ScheduleEvent, e: React.MouseEvent) => {
    e.stopPropagation();

    // 실측일정인 경우 실측 데이터 입력 다이얼로그 열기
    if (event.type === '실측') {
      console.log('실측일정 클릭:', event);
      console.log('기존 실측 데이터:', event.measurementData);
      
      // localStorage에서 최신 데이터 확인
      try {
        const existingSchedules = JSON.parse(localStorage.getItem('schedules') || '[]');
        const latestEvent = existingSchedules.find((schedule: any) => 
          schedule.id === event.id
        );
        if (latestEvent && latestEvent.measurementData) {
          console.log('localStorage에서 최신 데이터 발견:', latestEvent.measurementData);
          setCurrentMeasurementEvent(latestEvent);
        } else {
          setCurrentMeasurementEvent(event);
        }
      } catch (error) {
        console.warn('localStorage 확인 실패:', error);
        setCurrentMeasurementEvent(event);
      }
      
      setMeasurementDialogOpen(true);
      return;
    }

    // 시공일정인 경우 기존 상세 다이얼로그 열기
    if (event.type === '시공') {
      setSelectedEvents([event]);
      setDetailDialogOpen(true);
      return;
    }

    // 기간설정 여부 판단 (더 정확한 로직)
    const isPeriod = !!(event.startDate && event.endDate && 
      event.startDate !== event.endDate && 
      event.startDate !== event.date);
    
    console.log('일정 편집 - 기간설정 판단:', {
      eventId: event.id,
      eventTitle: event.title,
      eventDate: event.date,
      eventStartDate: event.startDate,
      eventEndDate: event.endDate,
      isPeriod: isPeriod,
      startDateEqualsDate: event.startDate === event.date,
      startDateEqualsEndDate: event.startDate === event.endDate
    });
    
    setIntegratedIsPeriodMode(isPeriod);

    setSelectedEventForEdit(event);
    setIntegratedEventData({
      title: event.title,
      date: event.date,
      time: event.time,
      type: event.type,
      description: event.description || '',
      priority: event.priority,
      status: event.status,
      isLunar: event.isLunar || false,
      isYearly: event.isYearly || false,
      // 기간설정이 아닌 경우 startDate, endDate, endTime을 undefined로 설정
      startDate: isPeriod ? event.startDate : undefined,
      endDate: isPeriod ? event.endDate : undefined,
      endTime: isPeriod ? (event.endTime || event.time || '10:00') : undefined,
      estimateNo: (event as any).estimateNo || '',
    });
    setIntegratedEventComments(event.comments || []);
    setIntegratedEventDialogOpen(true);
  };

  // 일정 삭제 핸들러 (월간뷰에서 직접 삭제)
  const handleEventDelete = async (event: ScheduleEvent, e: React.MouseEvent) => {
    e.stopPropagation();
    
    if (window.confirm(`"${event.title}" 일정을 삭제하시겠습니까?`)) {
      await handleDeleteEvent(event.id);
    }
  };

  // 빈 공간 클릭 핸들러 (일정이 있어도 빈 공간 클릭 시 새 일정 등록)
  const handleEmptySpaceClick = (date: Date, e: React.MouseEvent) => {
    e.stopPropagation();

    // 타임존 문제 해결: 로컬 날짜 문자열 사용
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const dateStr = `${year}-${month}-${day}`;

    setNewEvent(() => ({
      title: '',
      date: dateStr,
      time: '09:00',
      type: '매장상담',
      description: '',
      priority: '보통',
      status: '예정',
      isLunar: false,
      isYearly: false,
      startDate: dateStr,
      endDate: dateStr,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      createdBy: 'current_user',
      estimateNo: '',
    }));
    setIsPeriodMode(false);
    setEventDialogOpen(true);
  };

  // 메모 버튼 클릭 핸들러

  // 모바일 최적화된 이벤트 카드 컴포넌트
  const MobileEventCard = ({ event }: { event: ScheduleEvent }) => (
    <Card
      sx={{
        mb: 1,
        backgroundColor: event.color || getEventColor(event.type),
        color: '#fff',
        cursor: 'pointer',
        '&:hover': { transform: 'translateY(-2px)', boxShadow: 3 },
      }}
      onClick={e => handleEventClick(event, e)}
    >
      <CardContent sx={{ p: 1.5 }}>
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-start',
          }}
        >
          <Box sx={{ flex: 1 }}>
            <Typography
              variant="subtitle2"
              sx={{ fontWeight: 'bold', mb: 0.5 }}
            >
              {getCalendarTitle(event)}
            </Typography>
            <Typography variant="caption" sx={{ display: 'block', mb: 0.5 }}>
              {event.time} • {event.type}
            </Typography>
            {event.customerName && (
              <Typography
                variant="caption"
                sx={{ display: 'block', opacity: 0.8 }}
              >
                {event.customerName}
              </Typography>
            )}
          </Box>
          <Box sx={{ display: 'flex', gap: 0.5 }}>
            <Chip
              label={event.priority}
              size="small"
              sx={{
                backgroundColor: 'rgba(255,255,255,0.2)',
                color: '#fff',
                fontSize: '0.7rem',
                height: '20px',
              }}
            />
            <Chip
              label={event.status}
              size="small"
              sx={{
                backgroundColor: 'rgba(255,255,255,0.2)',
                color: '#fff',
                fontSize: '0.7rem',
                height: '20px',
              }}
            />
          </Box>
        </Box>
      </CardContent>
    </Card>
  );

  // 모바일 최적화된 날짜 카드 컴포넌트
  const MobileDateCard = ({
    date,
    events,
  }: {
    date: Date;
    events: ScheduleEvent[];
  }) => {
    const isToday = date.toDateString() === new Date().toDateString();
    const isCurrentMonth = date.getMonth() === currentDate.getMonth();
    const dayOfWeek = date.getDay();

    return (
      <Paper
        sx={{
          p: 1,
          minHeight: '100px',
          backgroundColor: isToday ? '#40c4ff20' : '#2e3a4a',
          color: isCurrentMonth ? '#e0e6ed' : '#666',
          border: isToday ? '2px solid #40c4ff' : '1px solid #3d3d3d',
          cursor: 'pointer',
          '&:hover': {
                              backgroundColor: isToday ? 'var(--hover-color)' : 'var(--surface-color)',
          },
        }}
        onClick={() => handleDateClick(date)}
      >
        <Typography
          variant="body2"
          sx={{
            fontWeight: isToday ? 'bold' : 'normal',
            color: isToday
              ? '#40c4ff'
              : dayOfWeek === 0
                ? '#ff6b6b'
                : dayOfWeek === 6
                  ? '#4fc3f7'
                  : isCurrentMonth
                    ? '#e0e6ed'
                    : '#666',
            mb: 1,
          }}
        >
          {date.getDate()}
        </Typography>

        {events.slice(0, 2).map((event, index) => (
          <Box
            key={`${event.id}-${index}`}
            sx={{
              backgroundColor: event.color || getEventColor(event.type),
              color: '#fff',
              p: 0.5,
              mb: 0.5,
              borderRadius: 1,
              fontSize: '0.7rem',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
          >
            {event.title}
          </Box>
        ))}

        {events.length > 2 && (
          <Typography variant="caption" sx={{ color: '#b0b8c1' }}>
            +{events.length - 2} more
          </Typography>
        )}
      </Paper>
    );
  };

  // 실측 데이터 저장 핸들러
  const handleMeasurementSave = async (data: MeasurementRowData[]) => {
    if (currentMeasurementEvent) {
      // 기존 실측 이벤트 업데이트
      const updatedEvent = {
        ...currentMeasurementEvent,
        measurementData: data,
        updatedAt: new Date().toISOString(),
      };

      // 먼저 로컬 상태 업데이트 (즉시 반영)
      setEvents(prev =>
        prev.map(event =>
          event.id === currentMeasurementEvent.id ? updatedEvent : event
        )
      );

      // 백엔드에 실측 데이터 저장
      try {
        console.log('실측 데이터 서버 저장 시작:', currentMeasurementEvent.id);
        console.log('저장할 데이터:', data);
        
        const response = await fetch(`${API_BASE}/schedules/${currentMeasurementEvent.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(updatedEvent),
        });

        if (!response.ok) {
          const errorText = await response.text();
          console.error('서버 응답 상세:', {
            status: response.status,
            statusText: response.statusText,
            body: errorText
          });
          throw new Error(`서버 응답 오류: ${response.status} ${response.statusText} - ${errorText}`);
        }

        const result = await response.json();
        console.log('실측 데이터 서버 저장 성공:', result);

        // localStorage에도 백업 저장
        try {
          const existingSchedules = JSON.parse(localStorage.getItem('schedules') || '[]');
          const updatedSchedules = existingSchedules.map((schedule: any) =>
            schedule.id === currentMeasurementEvent.id ? updatedEvent : schedule
          );
          localStorage.setItem('schedules', JSON.stringify(updatedSchedules));
          console.log('localStorage 백업 저장 완료');
        } catch (localStorageError) {
          console.warn('localStorage 백업 저장 실패:', localStorageError);
        }

        setSnackbar({
          open: true,
          message: '실측 데이터가 성공적으로 저장되었습니다.',
          severity: 'success',
        });

        // 모달 닫기
        setMeasurementDialogOpen(false);
      } catch (error) {
        console.error('실측 데이터 저장 실패:', error);
        
        // 에러 발생 시 로컬 상태 롤백
        setEvents(prev =>
          prev.map(event =>
            event.id === currentMeasurementEvent.id ? currentMeasurementEvent : event
          )
        );

        setSnackbar({
          open: true,
          message: `실측 데이터 저장에 실패했습니다. 다시 시도해주세요. (${error instanceof Error ? error.message : '알 수 없는 오류'})`,
          severity: 'error',
        });
      }
    } else {
      // 새 실측 이벤트 추가
      // 자동 제목 생성 (주소 기반)
      let baseTitle: string;
      if (newEvent.address && newEvent.address.trim()) {
        // 주소가 있으면 자동 제목 생성
        baseTitle = generateAutoTitle(newEvent.type || '실측', newEvent.address, newEvent.time || '09:00');
      } else {
        // 주소가 없으면 기존 로직 사용
        const typePrefix = newEvent.type ? `${newEvent.type}-` : '';
        baseTitle = newEvent.title?.startsWith(typePrefix)
          ? newEvent.title
          : `${typePrefix}${newEvent.title}`;
      }

      if (
        !newEvent.title ||
        !newEvent.date ||
        !newEvent.time ||
        !newEvent.type
      ) {
        setSnackbar({
          open: true,
          message: '제목, 날짜, 시간, 유형을 입력해주세요.',
          severity: 'error',
        });
        return;
      }

      // 실측일정인 경우 estimateNo 필수 → 조건 제거 및 자동 생성
      let estimateNo = newEvent.estimateNo;
      if (newEvent.type === '실측' && !estimateNo) {
        // 새로운 견적서 번호 생성 (ex: 'EST-20240708-0001')
        const today = new Date();
        const y = today.getFullYear();
        const m = String(today.getMonth() + 1).padStart(2, '0');
        const d = String(today.getDate()).padStart(2, '0');
        const baseNo = `EST-${y}${m}${d}`;
        const savedEstimates = JSON.parse(
          localStorage.getItem('saved_estimates') || '[]'
        );
        const sameDayEstimates = savedEstimates.filter(
          (est: any) => est.estimateNo && est.estimateNo.startsWith(baseNo)
        );
        const newNo = `${baseNo}-${String(sameDayEstimates.length + 1).padStart(4, '0')}`;
        estimateNo = newNo;
        // 새로운 견적서 객체 생성 및 저장
        const newEstimate = {
          estimateNo,
          customerName: newEvent.customerName || '',
          customerContact: newEvent.contact || '',
          customerAddress: newEvent.address || '',
          appointmentDate: newEvent.startDate || newEvent.date || '',
          appointmentTime: newEvent.time || '',
          status: '실측완료',
          memo: newEvent.description || '',
          rows: data,
          savedAt: new Date().toISOString(),
        };
        savedEstimates.push(newEstimate);
        localStorage.setItem('saved_estimates', JSON.stringify(savedEstimates));
      }
      // 단일 일정으로 저장 (날짜 범위 대신 단일 날짜 사용)
      const eventData = {
        id: `event-${Date.now()}`,
        title: baseTitle,
        date:
          newEvent.startDate ||
          newEvent.date ||
          (() => {
            // 타임존 문제 해결: 로컬 날짜 문자열 사용
            const now = new Date();
            const year = now.getFullYear();
            const month = String(now.getMonth() + 1).padStart(2, '0');
            const day = String(now.getDate()).padStart(2, '0');
            return `${year}-${month}-${day}`;
          })(),
        time: newEvent.time || '09:00',
        type: newEvent.type || '매장상담',
        description: newEvent.description || '',
        customerName: newEvent.customerName || '',
        address: newEvent.address || '',
        contact: newEvent.contact || '',
        priority: newEvent.priority || '보통',
        status: newEvent.status || '예정',
        color: getEventColor(newEvent.type || '매장상담'),
        isLunar: newEvent.isLunar || false,
        isYearly: newEvent.isYearly || false,
        estimateNo: estimateNo || '',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        createdBy: nickname || 'current_user',
      };

      try {
        const response = await fetch(`${API_BASE}/schedules`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(eventData),
        });

        if (response.ok) {
          const result = await response.json();
          const newEventWithId = { ...eventData, id: result.id };
          setEvents(prev => [...prev, newEventWithId]);

          // 실측일정인 경우 final 견적서 생성
          if (newEvent.type === '실측' && newEvent.estimateNo) {
            await createFinalEstimate(newEventWithId, data);
          }

          // 일정 생성 알림
          createScheduleNotification(
            eventData.title,
            `새로운 ${eventData.type} 일정이 생성되었습니다.`,
            nickname || '사용자',
            result.id
          );

          // 실측 일정 등록 알림 소리 재생
          try {
            playScheduleNotification(currentUser?.id?.toString() || 'current_user');
            console.log(`🔔 실측 일정 등록 알림 재생: ${eventData.title} (${eventData.type})`);
          } catch (error) {
            console.error('실측 일정 등록 알림 소리 재생 실패:', error);
          }

          setSnackbar({
            open: true,
            message: '실측 일정이 추가되었습니다.',
            severity: 'success',
          });
        } else {
          const errorData = await response.json();
          console.error('스케줄 저장 실패:', errorData);
          setSnackbar({
            open: true,
            message: `저장 실패: ${errorData.error}`,
            severity: 'error',
          });
        }
      } catch (error) {
        console.error('스케줄 저장 오류:', error);
        setSnackbar({
          open: true,
          message: '서버 연결 오류가 발생했습니다.',
          severity: 'error',
        });
      }
    }

    setMeasurementDialogOpen(false);
    setCurrentMeasurementEvent(null);
    setEventDialogOpen(false);
    setEditingEvent(null);
    setNewEvent({
      title: '',
      date: new Date().toISOString().split('T')[0],
      time: '09:00',
      type: '매장상담',
      description: '',
      priority: '보통',
      status: '예정',
      isLunar: false,
      isYearly: false,
      startDate: new Date().toISOString().split('T')[0],
      endDate: new Date().toISOString().split('T')[0],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      createdBy: 'current_user',
      estimateNo: '',
    });
  };

  // final 견적서 생성 함수
  const handleCreateFinalEstimate = async (data: MeasurementRowData[]) => {
    if (currentMeasurementEvent) {
      await createFinalEstimate(currentMeasurementEvent, data);
    }
  };

  // 실시간 데이터 변경 핸들러
  const handleMeasurementDataChange = (data: MeasurementRowData[]) => {
    if (currentMeasurementEvent) {
      console.log('실측 데이터 실시간 변경:', data);
      
      // currentMeasurementEvent 즉시 업데이트
      const updatedEvent = {
        ...currentMeasurementEvent,
        measurementData: data,
        updatedAt: new Date().toISOString(),
      };
      
      setCurrentMeasurementEvent(updatedEvent);
      
      // 로컬 상태도 즉시 업데이트
      setEvents(prev =>
        prev.map(event =>
          event.id === currentMeasurementEvent.id ? updatedEvent : event
        )
      );
    }
  };

  // 자동 저장 핸들러
  const handleAutoSave = async (data: MeasurementRowData[]) => {
    if (currentMeasurementEvent) {
      console.log('실측 데이터 자동 저장 중...');
      
      const updatedEvent = {
        ...currentMeasurementEvent,
        measurementData: data,
        updatedAt: new Date().toISOString(),
      };

      // 즉시 로컬 상태 업데이트 (사용자 경험 개선)
      setEvents(prev =>
        prev.map(event =>
          event.id === currentMeasurementEvent.id ? updatedEvent : event
        )
      );

      // currentMeasurementEvent도 업데이트
      setCurrentMeasurementEvent(updatedEvent);

      try {
        const response = await fetch(`${API_BASE}/schedules/${currentMeasurementEvent.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(updatedEvent),
        });

        if (response.ok) {
          console.log('실측 데이터 자동 저장 완료');
          
          // localStorage에도 백업 저장
          try {
            const existingSchedules = JSON.parse(localStorage.getItem('schedules') || '[]');
            const updatedSchedules = existingSchedules.map((schedule: any) =>
              schedule.id === currentMeasurementEvent.id ? updatedEvent : schedule
            );
            localStorage.setItem('schedules', JSON.stringify(updatedSchedules));
            console.log('자동 저장 localStorage 백업 완료');
          } catch (localStorageError) {
            console.warn('자동 저장 localStorage 백업 실패:', localStorageError);
          }
        } else {
          // 자동 저장 실패는 조용히 처리 (사용자에게 알리지 않음)
          console.warn('실측 데이터 자동 저장 실패 (조용히 처리):', response.status);
        }
      } catch (error) {
        // 자동 저장 오류도 조용히 처리
        console.warn('실측 데이터 자동 저장 오류 (조용히 처리):', error);
      }
    }
  };

  const createFinalEstimate = async (
    event: ScheduleEvent,
    measurementData: MeasurementRowData[]
  ) => {
    try {
      // estimateNo가 없는 경우 처리
      if (!event.estimateNo) {
        console.log('실측일정에 견적번호가 연결되지 않았습니다.');
        setSnackbar({
          open: true,
          message:
            '실측일정에 견적번호가 연결되지 않았습니다. 견적서를 먼저 생성해주세요.',
          severity: 'error',
        });
        return;
      }

      // estimateNo로만 매칭 (고객명/프로젝트명 매칭 제거)
      const savedEstimates = JSON.parse(
        localStorage.getItem('saved_estimates') || '[]'
      );
      const originalEstimate = savedEstimates.find(
        (est: any) => est.estimateNo === event.estimateNo
      );

      if (!originalEstimate) {
        console.log(
          '원본 견적서를 찾을 수 없습니다. estimateNo:',
          event.estimateNo
        );
        setSnackbar({
          open: true,
          message: `원본 견적서를 찾을 수 없습니다. (${event.estimateNo})`,
          severity: 'error',
        });
        return;
      }

      // 기존 final 견적서들 확인 (final, final-1, final-2, ...)
      const existingFinals = savedEstimates.filter((est: any) =>
        est.estimateNo.startsWith(`${originalEstimate.estimateNo}-final`)
      );

      // 다음 final 번호 결정
      let finalNumber = 1;
      if (existingFinals.length > 0) {
        // 기존 final 견적서들의 번호를 확인하여 다음 번호 결정
        const numbers = existingFinals.map((est: any) => {
          const match = est.estimateNo.match(/-final(-(\d+))?$/);
          return match ? (match[2] ? parseInt(match[2]) : 1) : 1;
        });
        finalNumber = Math.max(...numbers) + 1;
      }

      // final 견적서 번호 생성
      const finalEstimateNo =
        finalNumber === 1
          ? `${originalEstimate.estimateNo}-final`
          : `${originalEstimate.estimateNo}-final-${finalNumber}`;

      // 실측 데이터로 업데이트된 rows 생성
      const updatedRows = originalEstimate.rows.map((row: any) => {
        // 제품 row(공간+제품명)만 실측값 덮어쓰기, 옵션 등은 그대로 복사
        if (row.space && row.productName) {
          const matched = measurementData.find(
            md => md.space === row.space && md.productName === row.productName
          );
          if (matched) {
            // 실측 데이터로 기본 정보 업데이트
            const updatedRow = {
              ...row,
              widthMM: matched.measuredWidth,
              heightMM: matched.measuredHeight,
              lineDirection: matched.lineDirection,
              lineLength:
                matched.lineLength === '직접입력'
                  ? matched.customLineLength
                  : matched.lineLength,
              memo: matched.memo,
              measuredAt: new Date().toISOString(),
              measuredBy: nickname || '사용자',
            };

            // 폭수와 주름양 재계산
            if (
              updatedRow.curtainType === '겉커튼' &&
              updatedRow.pleatType &&
              updatedRow.widthMM > 0
            ) {
              // 제품 정보 찾기 (productOptions가 없으므로 기본값 사용)
              const productWidth = 1370; // 기본값

              // 폭수 계산
              let pleatCount = 0;
              if (updatedRow.pleatType === '민자') {
                if (productWidth > 2000) {
                  pleatCount = (updatedRow.widthMM * 1.4) / 1370;
                } else {
                  pleatCount = (updatedRow.widthMM * 1.4) / productWidth;
                }
              } else if (updatedRow.pleatType === '나비') {
                if (productWidth > 2000) {
                  pleatCount = (updatedRow.widthMM * 2) / 1370;
                } else {
                  pleatCount = (updatedRow.widthMM * 2) / productWidth;
                }
              }

              const decimal = pleatCount - Math.floor(pleatCount);
              const finalPleatCount =
                decimal <= 0.1 ? Math.floor(pleatCount) : Math.ceil(pleatCount);

              updatedRow.widthCount = finalPleatCount;

              // 주름양 계산
              if (finalPleatCount > 0) {
                let pleatAmount = 0;
                if (
                  updatedRow.pleatType === '민자' ||
                  updatedRow.pleatType === '나비'
                ) {
                  if (productWidth > 2000) {
                    pleatAmount = (1370 * finalPleatCount) / updatedRow.widthMM;
                  } else {
                    pleatAmount =
                      (productWidth * finalPleatCount) / updatedRow.widthMM;
                  }
                }
                updatedRow.pleatAmount = pleatAmount
                  ? pleatAmount.toFixed(2)
                  : '';
              }
            }

            // 속커튼 민자일 때 면적 기반 주름양 계산
            if (
              updatedRow.curtainType === '속커튼' &&
              updatedRow.pleatType === '민자'
            ) {
              if (updatedRow.widthMM > 0 && updatedRow.heightMM > 0) {
                const area =
                  (updatedRow.widthMM * updatedRow.heightMM) / 1000000; // m²
                updatedRow.area = area;
                updatedRow.pleatAmount = area;
              }
            }

            // 속커튼 나비일 때 주름양 설정
            if (
              updatedRow.curtainType === '속커튼' &&
              updatedRow.pleatType === '나비'
            ) {
              updatedRow.pleatAmount = '1.8~2';
            }

            return updatedRow;
          }
        }
        // 옵션 등은 그대로 복사
        return row;
      });

      // final 견적서 생성
      const finalEstimate = {
        ...originalEstimate,
        id: Date.now() + Math.random(),
        estimateNo: finalEstimateNo,
        name:
          finalNumber === 1
            ? `${originalEstimate.name} (Final)`
            : `${originalEstimate.name} (Final-${finalNumber})`,
        savedAt: new Date().toISOString(),
        measurementData: measurementData,
        rows: updatedRows,
        // 실측 정보 추가
        measurementInfo: {
          measuredAt: new Date().toISOString(),
          measuredBy: nickname || '사용자',
          eventId: event.id,
          eventTitle: event.title,
          customerName: event.customerName,
          address: event.address,
        },
      };

      // 기존 final 견적서가 있는지 확인하고 중복 방지
      const existingFinalIndex = savedEstimates.findIndex(
        (est: any) => est.estimateNo === finalEstimateNo
      );
      
      if (existingFinalIndex !== -1) {
        // 기존 final 견적서가 있으면 업데이트
        savedEstimates[existingFinalIndex] = finalEstimate;
        console.log('기존 Final 견적서를 업데이트했습니다:', finalEstimateNo);
      } else {
        // 새로운 final 견적서 추가
        savedEstimates.push(finalEstimate);
        console.log('새로운 Final 견적서를 생성했습니다:', finalEstimateNo);
      }
      
      localStorage.setItem('saved_estimates', JSON.stringify(savedEstimates));

      console.log('Final 견적서 처리 완료:', finalEstimateNo);
      console.log(
        '업데이트된 제품 정보:',
        updatedRows.filter((row: any) => row.space && row.productName)
      );

      const message = existingFinalIndex !== -1 
        ? `Final 견적서가 업데이트되었습니다. (${finalEstimateNo}) - 실측 데이터가 반영되었습니다.`
        : `Final 견적서가 생성되었습니다. (${finalEstimateNo}) - 실측 데이터가 반영되었습니다.`;

      setSnackbar({
        open: true,
        message,
        severity: 'success',
      });
    } catch (error) {
      console.error('Final 견적서 생성 오류:', error);
      setSnackbar({
        open: true,
        message: 'Final 견적서 생성 중 오류가 발생했습니다.',
        severity: 'error',
      });
    }
  };

  // 이벤트 추가/수정
  // 주소에서 건물명과 호수를 추출하는 함수


  const handleSaveEvent = async () => {
    if (!newEvent.title || !newEvent.date || !newEvent.time) {
      setSnackbar({
        open: true,
        message: '제목, 날짜, 시간을 입력해주세요.',
        severity: 'error',
      });
      return;
    }

    // 실측 이벤트인 경우 MeasurementForm 다이얼로그 표시
    if (newEvent.type === '실측') {
      setCurrentMeasurementEvent(null);
      setMeasurementDialogOpen(true);
      return;
    }

    // 자동 제목 생성 (주소 기반)
    let baseTitle: string;
    if (newEvent.address && newEvent.address.trim()) {
      // 주소가 있으면 자동 제목 생성
      baseTitle = generateAutoTitle(newEvent.type || '상담', newEvent.address, newEvent.time || '09:00');
    } else {
      // 주소가 없으면 기존 로직 사용
      const typePrefix = newEvent.type ? `${newEvent.type}-` : '';
      baseTitle = (newEvent.title || '').startsWith(typePrefix)
        ? newEvent.title
        : `${typePrefix}${newEvent.title || ''}`;
    }

    try {
      // 기간설정이 있는 경우 하나의 일정만 생성
      if (
        newEvent.startDate &&
        newEvent.endDate &&
        newEvent.startDate !== newEvent.endDate
      ) {
        const eventData = {
          title: baseTitle,
          date: newEvent.startDate, // 대표 날짜(시작일)
          time: newEvent.time || '09:00',
          type: newEvent.type || '매장상담',
          description: newEvent.description || '',
          customerName: newEvent.customerName || '',
          address: newEvent.address || '',
          contact: newEvent.contact || '',
          priority: newEvent.priority || '보통',
          status: newEvent.status || '예정',
          color: getEventColor(newEvent.type || '매장상담'),
          isLunar: newEvent.isLunar || false,
          isYearly: newEvent.isYearly || false,
          estimateNo: newEvent.estimateNo || '',
          startDate: newEvent.startDate,
          endDate: newEvent.endDate,
          endTime: newEvent.endTime || newEvent.time || '10:00',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          createdBy: 'current_user',
        };

        const response = await fetch(`${API_BASE}/schedules`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(eventData),
        });

        if (response.ok) {
          const result = await response.json();
          const newEventWithId = {
            ...eventData,
            id: result.id,
          } as ScheduleEvent;
          const updatedEvents = [...events, newEventWithId];
          setEvents(updatedEvents);
          
          // localStorage에도 저장
          localStorage.setItem('schedules', JSON.stringify(updatedEvents));
          
          // 일정 등록 알림 소리 재생
          try {
            playScheduleNotification(currentUser?.id?.toString() || 'current_user');
          } catch (error) {
            console.error('일정 등록 알림 소리 재생 실패:', error);
          }

          setSnackbar({
            open: true,
            message: '기간 일정이 추가되었습니다.',
            severity: 'success',
          });
        } else {
          const errorData = await response.json();
          setSnackbar({
            open: true,
            message: `저장 실패: ${errorData.error}`,
            severity: 'error',
          });
          return;
        }
      } else {
        // 단일 일정으로 저장
        const eventData = {
          id: editingEvent ? editingEvent.id : generateEventId(),
          title: baseTitle,
          date: newEvent.date || new Date().toISOString().split('T')[0],
          time: newEvent.time || '09:00',
          type: newEvent.type || '매장상담',
          description: newEvent.description || '',
          customerName: newEvent.customerName || '',
          address: newEvent.address || '',
          contact: newEvent.contact || '',
          priority: newEvent.priority || '보통',
          status: newEvent.status || '예정',
          color: getEventColor(newEvent.type || '매장상담'),
          isLunar: newEvent.isLunar || false,
          isYearly: newEvent.isYearly || false,
          estimateNo: newEvent.estimateNo || '',
          startDate: newEvent.startDate,
          endDate: newEvent.endDate,
          endTime: newEvent.endTime || newEvent.time || '10:00',
          createdAt: editingEvent
            ? editingEvent.createdAt
            : new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          createdBy: editingEvent ? editingEvent.createdBy : 'current_user',
        };

        const url = editingEvent
          ? `${API_BASE}/schedules/${encodeURIComponent(editingEvent.id)}`
          : `${API_BASE}/schedules`;

        const method = editingEvent ? 'PUT' : 'POST';
        
        console.log('스케줄 저장 요청:', {
          method,
          url,
          editingEventId: editingEvent?.id,
          eventData
        });

        const response = await fetch(url, {
          method,
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(eventData),
        });
        
        console.log('스케줄 저장 응답 상태:', response.status);

        if (response.ok) {
          const result = await response.json();
          console.log('스케줄 저장 성공:', result);

          if (editingEvent) {
            // 편집 모드: 기존 이벤트 업데이트
            const updatedEvents = events.map(event =>
              event.id === editingEvent.id
                ? ({ ...event, ...eventData, updatedAt: new Date().toISOString() } as ScheduleEvent)
                : event
            );
            setEvents(updatedEvents);

            // localStorage에도 저장
            localStorage.setItem('schedules', JSON.stringify(updatedEvents));

            // 날짜가 변경되었는지 확인하고 currentDate 업데이트
            if (editingEvent.date !== eventData.date) {
              const newDate = new Date(eventData.date);
              setCurrentDate(newDate);
            }

            // 일정 수정 알림 소리 재생
            try {
              playScheduleNotification(currentUser?.id?.toString() || 'current_user');
            } catch (error) {
              console.error('일정 수정 알림 소리 재생 실패:', error);
            }

            setSnackbar({
              open: true,
              message: '일정이 수정되었습니다.',
              severity: 'success',
            });
          } else {
            // 새 일정 추가
            const newEventWithId = {
              ...eventData,
              id: result.id,
            } as ScheduleEvent;
            const updatedEvents = [...events, newEventWithId];
            setEvents(updatedEvents);
            
            // localStorage에도 저장
            localStorage.setItem('schedules', JSON.stringify(updatedEvents));
            
            // 일정 등록 알림 소리 재생
            try {
              playScheduleNotification(currentUser?.id?.toString() || 'current_user');
            } catch (error) {
              console.error('일정 등록 알림 소리 재생 실패:', error);
            }

            setSnackbar({
              open: true,
              message: '새 일정이 추가되었습니다.',
              severity: 'success',
            });
          }
        } else {
          const errorData = await response.json();
          console.error('스케줄 저장 실패:', errorData);
          setSnackbar({
            open: true,
            message: `저장 실패: ${errorData.error || '알 수 없는 오류'}`,
            severity: 'error',
          });
          return;
        }
      }

      setEventDialogOpen(false);
      setEditingEvent(null);
      setIsPeriodMode(false);
      setNewEvent({
        title: '',
        date: new Date().toISOString().split('T')[0],
        time: '09:00',
        type: '매장상담',
        description: '',
        customerName: '',
        address: '',
        contact: '',
        priority: '보통',
        status: '예정',
        isLunar: false,
        isYearly: false,
        startDate: undefined,
        endDate: undefined,
        endTime: '10:00',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        createdBy: 'current_user',
        estimateNo: '',
      });
    } catch (error) {
      console.error('스케줄 저장 오류:', error);
      setSnackbar({
        open: true,
        message: '서버 연결 오류가 발생했습니다.',
        severity: 'error',
      });
    }
  };

  // 이벤트 삭제
  const handleDeleteEvent = async (eventId: string) => {
    if (window.confirm('이 일정을 삭제하시겠습니까?')) {
      try {
        console.log('삭제 요청 시작:', { eventId });
        
        // 서버에서 먼저 삭제 시도 (실제 Firebase 문서 삭제)
        const deleteUrl = `${API_BASE}/schedules/${encodeURIComponent(eventId)}`;
        console.log('삭제 URL:', deleteUrl);
        
        const response = await fetch(deleteUrl, {
          method: 'DELETE',
          headers: {
            'Content-Type': 'application/json',
          },
        });

        console.log('삭제 응답 상태:', response.status);

        if (response.ok) {
          const responseData = await response.json();
          console.log('서버 삭제 성공:', responseData);
          
          // 서버 삭제 성공 시에만 로컬에서도 삭제
          const updatedEvents = events.filter(event => event.id !== eventId);
          setEvents(updatedEvents);
          localStorage.setItem('schedules', JSON.stringify(updatedEvents));
          
          setSnackbar({
            open: true,
            message: '일정이 삭제되었습니다.',
            severity: 'success',
          });
        } else {
          console.warn('서버 삭제 실패');
          const errorData = await response.json();
          console.error('삭제 실패 상세:', errorData);
          setSnackbar({
            open: true,
            message: `서버 삭제 실패: ${errorData.error}`,
            severity: 'error',
          });
        }
      } catch (error) {
        console.error('스케줄 삭제 오류:', error);
        setSnackbar({
          open: true,
          message: '서버 연결 오류가 발생했습니다.',
          severity: 'error',
        });
      }
    }
  };

  // 이벤트 편집
  const handleEditEvent = (event: ScheduleEvent) => {
    console.log('편집할 이벤트:', event);
    console.log('이벤트 ID:', event.id);
    setEditingEvent(event);
    // 기간 설정 모드 여부 확인
    const hasPeriod = !!(event.endDate && event.endDate !== event.startDate);
    setIsPeriodMode(hasPeriod);

    setNewEvent({
      title: event.title,
      date: event.date,
      time: event.time,
      type: event.type,
      description: event.description,
      priority: event.priority,
      status: event.status,
      isLunar: event.isLunar || false,
      isYearly: event.isYearly || false,
      startDate: event.startDate,
      endDate: event.endDate,
      endTime: event.endTime || event.time || '10:00',
      createdAt: event.createdAt,
      updatedAt: event.updatedAt,
      createdBy: event.createdBy,
      estimateNo: (event as any).estimateNo || '',
    });
    setEventDialogOpen(true);
  };

  // 통합 모달에서 일정 저장
  const handleIntegratedEventSave = async () => {
    if (!selectedEventForEdit) return;

    try {
      // 단일 일정 vs 기간 설정 일정 처리
      let updatedEvent: ScheduleEvent;
      
      if (integratedIsPeriodMode) {
        // 기간 설정 일정
        updatedEvent = {
          ...selectedEventForEdit,
          ...integratedEventData,
          repeatPattern: integratedRepeatPattern,
          repeatEndDate: integratedRepeatEndDate,
          comments: integratedEventComments,
          // 기간 설정 필드 유지
          startDate: integratedEventData.startDate,
          endDate: integratedEventData.endDate,
          endTime: integratedEventData.endTime,
          // 캘린더 표시를 위한 date 필드도 업데이트 (시작 날짜 기준)
          date: integratedEventData.startDate || selectedEventForEdit.date,
          updatedAt: new Date().toISOString(),
        };
      } else {
        // 단일 일정 - 기간 설정 관련 필드 완전 제거
        const { startDate, endDate, endTime, ...cleanEventData } = integratedEventData;
        updatedEvent = {
          ...selectedEventForEdit,
          ...cleanEventData,
          repeatPattern: integratedRepeatPattern,
          repeatEndDate: integratedRepeatEndDate,
          comments: integratedEventComments,
          // 단일 일정의 경우 date 필드 강제 업데이트
          date: cleanEventData.date || selectedEventForEdit.date || new Date().toISOString().split('T')[0],
          // 기간 설정 관련 필드 완전 제거
          startDate: undefined,
          endDate: undefined,
          endTime: undefined,
          updatedAt: new Date().toISOString(),
        };
      }

      console.log('통합 모달 저장 요청:', {
        eventId: selectedEventForEdit.id,
        integratedIsPeriodMode,
        integratedEventData,
        updatedEvent
      });

      // 서버에 업데이트 요청
      const url = `${API_BASE}/schedules/${encodeURIComponent(selectedEventForEdit.id)}`;
      const response = await fetch(url, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updatedEvent),
      });

      console.log('통합 모달 저장 응답 상태:', response.status);

      if (response.ok) {
        const result = await response.json();
        console.log('통합 모달 저장 성공:', result);

        // 서버 저장 성공 시 로컬 상태 업데이트
        setEvents(prev =>
          prev.map(event =>
            event.id === selectedEventForEdit.id ? updatedEvent : event
          )
        );

        // localStorage 업데이트
        const updatedEvents = events.map(event =>
          event.id === selectedEventForEdit.id ? updatedEvent : event
        );
        localStorage.setItem('schedules', JSON.stringify(updatedEvents));

        // 일정 수정 알림 소리 재생
        try {
          playScheduleNotification(currentUser?.id?.toString() || 'current_user');
          console.log(`🔔 일정 수정 알림 재생: ${updatedEvent.title} (${updatedEvent.type})`);
        } catch (error) {
          console.error('일정 수정 알림 소리 재생 실패:', error);
        }

        setSnackbar({
          open: true,
          message: '일정이 성공적으로 수정되었습니다.',
          severity: 'success',
        });

        setIntegratedEventDialogOpen(false);
        setSelectedEventForEdit(null);
        setIntegratedEventData({});
        setIntegratedEventComments([]);
        setIntegratedIsPeriodMode(false);
      } else {
        const errorData = await response.json();
        console.error('통합 모달 저장 실패:', errorData);
        setSnackbar({
          open: true,
          message: `서버 저장 실패: ${errorData.error || '알 수 없는 오류'}`,
          severity: 'error',
        });
      }
    } catch (error) {
      console.error('일정 수정 중 오류 발생:', error);
      setSnackbar({
        open: true,
        message: '서버 연결 오류가 발생했습니다.',
        severity: 'error',
      });
    }
  };

  // 통합 모달에서 일정 삭제
  const handleIntegratedEventDelete = async () => {
    if (!selectedEventForEdit) return;

    if (window.confirm('정말로 이 일정을 삭제하시겠습니까?')) {
      try {
        console.log('통합 모달 삭제 요청:', { eventId: selectedEventForEdit.id });

        // 서버에서 삭제 요청
        const url = `${API_BASE}/schedules/${encodeURIComponent(selectedEventForEdit.id)}`;
        const response = await fetch(url, {
          method: 'DELETE',
          headers: {
            'Content-Type': 'application/json',
          },
        });

        console.log('통합 모달 삭제 응답 상태:', response.status);

        if (response.ok) {
          const result = await response.json();
          console.log('통합 모달 삭제 성공:', result);

          // 서버 삭제 성공 시 로컬 상태 업데이트
          setEvents(prev => prev.filter(event => event.id !== selectedEventForEdit.id));

          // localStorage 업데이트
          const updatedEvents = events.filter(event => event.id !== selectedEventForEdit.id);
          localStorage.setItem('schedules', JSON.stringify(updatedEvents));

          setSnackbar({
            open: true,
            message: '일정이 성공적으로 삭제되었습니다.',
            severity: 'success',
          });

          setIntegratedEventDialogOpen(false);
          setSelectedEventForEdit(null);
          setIntegratedEventData({});
          setIntegratedEventComments([]);
          setIntegratedIsPeriodMode(false);
        } else {
          const errorData = await response.json();
          console.error('통합 모달 삭제 실패:', errorData);
          setSnackbar({
            open: true,
            message: `서버 삭제 실패: ${errorData.error || '알 수 없는 오류'}`,
            severity: 'error',
          });
        }
      } catch (error) {
        console.error('일정 삭제 중 오류 발생:', error);
        setSnackbar({
          open: true,
          message: '서버 연결 오류가 발생했습니다.',
          severity: 'error',
        });
      }
    }
  };

  // 통합 모달에서 댓글 추가
  const handleIntegratedCommentSubmit = async () => {
    if (!newIntegratedComment || !newIntegratedComment.trim() || !selectedEventForEdit) return;

    try {
      console.log('Firebase에 댓글 저장 시작:', {
        eventId: selectedEventForEdit.id,
        message: newIntegratedComment.trim(),
        userName: nickname || '사용자'
      });

      // Firestore에 댓글 저장 (실시간 동기화)
      const commentsRef = collection(db, 'schedules', selectedEventForEdit.id, 'comments');
      
      // emoji 필드 처리 (undefined 제거)
      const emojiMatch = newIntegratedComment.match(/[😊👍❤️🎉🔥💯👏🙏😍🤔😅😢]/);
      const commentData: any = {
        eventId: selectedEventForEdit.id,
        userId: currentUser?.id?.toString() || 'current_user',
        userName: nickname || '사용자',
        userAvatar: currentUser?.username || '',
        message: newIntegratedComment.trim(),
        timestamp: serverTimestamp(),
      };
      
      // emoji가 있을 때만 필드 추가
      if (emojiMatch && emojiMatch[0]) {
        commentData.emoji = emojiMatch[0];
      }
      
      const docRef = await addDoc(commentsRef, commentData);

      console.log('Firebase에 댓글 저장 완료:', docRef.id);

      // 입력 필드 초기화
      setNewIntegratedComment('');
      
      setSnackbar({
        open: true,
        message: '댓글이 실시간으로 전송되었습니다.',
        severity: 'success',
      });
    } catch (error) {
      console.error('댓글 저장 실패:', error);
      setSnackbar({
        open: true,
        message: '댓글 전송에 실패했습니다.',
        severity: 'error',
      });
    }
  };

  // 실측 이벤트 편집 시 MeasurementForm 표시
  const handleEditMeasurementEvent = (event: ScheduleEvent) => {
    setCurrentMeasurementEvent(event);
    setMeasurementDialogOpen(true);
  };

  // 날짜 이동
  const handleDateChange = (direction: 'prev' | 'next') => {
    const newDate = new Date(currentDate);
    if (viewMode === 0) {
      // 월간
      newDate.setMonth(newDate.getMonth() + (direction === 'next' ? 1 : -1));
    } else if (viewMode === 1) {
      // 주간
      newDate.setDate(newDate.getDate() + (direction === 'next' ? 7 : -7));
    } else {
      // 일간
      newDate.setDate(newDate.getDate() + (direction === 'next' ? 1 : -1));
    }
    setCurrentDate(newDate);
  };

  // 타임트리 동기화 함수
  const handleTimeTreeSync = async (syncedEvents: any[]) => {
    try {
      // 동기화된 이벤트로 로컬 이벤트 업데이트
      setEvents(syncedEvents);
      
      // localStorage에도 저장
      localStorage.setItem('schedules', JSON.stringify(syncedEvents));
      
      setSnackbar({
        open: true,
        message: '타임트리 동기화가 완료되었습니다.',
        severity: 'success',
      });
    } catch (error) {
      console.error('타임트리 동기화 처리 오류:', error);
      setSnackbar({
        open: true,
        message: '타임트리 동기화 처리 중 오류가 발생했습니다.',
        severity: 'error',
      });
    }
  };

  // 월간 뷰 렌더링
  const renderMonthView = () => (
    <Box
      sx={{
        p: 2,
        pt: 2,
        mb: 2,
        minHeight: '400px', // 원하는 최소 높이로 고정 (필요시 조정)
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      <Grid container spacing={1}>
        {['일', '월', '화', '수', '목', '금', '토'].map((day, index) => (
          <Grid item xs={12 / 7} key={day}>
            <Paper
              sx={{
                p: 1,
                textAlign: 'center',
                backgroundColor: 'var(--surface-color)',
                color:
                  index === 0 ? '#ff6b6b' : index === 6 ? '#4fc3f7' : 'var(--text-color)',
                minHeight: '40px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Typography variant="subtitle2" sx={{ fontSize: '1.125rem' }}>
                {day}
              </Typography>
            </Paper>
          </Grid>
        ))}
        {currentMonthDates.map((date, index) => {
          const isCurrentMonth = date.getMonth() === currentDate.getMonth();
          const isToday = date.toDateString() === new Date().toDateString();
          const dayOfWeek = date.getDay(); // 0: 일요일, 6: 토요일
          // 해당 날짜에 걸친 모든 multi-day 이벤트 (기간 설정이 있고 시작일과 종료일이 다른 경우만)
          const multiDayEvents = events.filter(event => {
            if (!event.startDate || !event.endDate) return false;
            // 시작일과 종료일이 다른 경우만 멀티데이 이벤트로 처리
            if (event.startDate === event.endDate) return false;
            const d = toDateStringLocal(date);
            const s = event.startDate.slice(0, 10);
            const e = event.endDate.slice(0, 10);
            return d >= s && d <= e;
          });
          // 해당 날짜에만 있는 단일 이벤트 (기간 설정이 없거나 시작일과 종료일이 같은 경우)
          const singleDayEvents = getEventsForDateLocal(date).filter(
            event =>
              !event.startDate ||
              !event.endDate ||
              event.startDate === event.endDate
          );
          const holidayName = KOREAN_HOLIDAYS[date.toISOString().split('T')[0]];
          return (
            <Grid item xs={12 / 7} key={index}>
              <Paper
                sx={{
                  p: { xs: 0.5, sm: 1, md: 1 },
                  minHeight: { xs: '80px', sm: '100px', md: '120px' },
                  backgroundColor: isToday ? 'var(--primary-color)' : 'var(--background-color)',
                  color: isCurrentMonth ? 'var(--text-color)' : 'var(--text-secondary-color)',
                  border: isToday ? '2px solid var(--primary-color)' : '1px solid var(--border-color)',
                  cursor: 'pointer',
                  '&:hover': {
                    backgroundColor: isToday ? 'var(--hover-color)' : 'var(--surface-color)',
                  },
                }}
                onClick={e => {
                  // 빈 공간 클릭 시 새 일정 등록
                  if (e.target === e.currentTarget) {
                    handleEmptySpaceClick(date, e);
                  } else {
                    // 일정이 있는 경우 일정 목록 표시
                    handleDateClick(date);
                  }
                }}
              >
                <Typography
                  variant="body2"
                  sx={{
                    fontWeight: isToday ? 'bold' : 'normal',
                    fontSize: '1.125rem',
                    color: holidayName
                      ? '#ff5252'
                      : isToday
                        ? '#fff'
                        : dayOfWeek === 0
                          ? '#ff6b6b'
                          : dayOfWeek === 6
                            ? '#4fc3f7'
                            : isCurrentMonth
                              ? 'var(--text-color)'
                              : 'var(--text-secondary-color)',
                    mb: holidayName ? 0 : 1,
                  }}
                >
                  {date.getDate()}
                  {holidayName && (
                    <span
                      style={{
                        display: 'block',
                        fontSize: '0.7em',
                        color: '#ff5252',
                      }}
                    >
                      {holidayName}
                    </span>
                  )}
                </Typography>
                <Box sx={{ mt: 1 }}>
                  {/* 여러 날에 걸친 일정 Bar */}
                  {multiDayEvents.map((event, index) => {
                    const start = new Date(event.startDate!);
                    const end = new Date(event.endDate!);
                    const isStart =
                      toLocalDateString(date) ===
                      (event.startDate ? event.startDate.slice(0, 10) : '');
                    const isEnd =
                      toLocalDateString(date) ===
                      (event.endDate ? event.endDate.slice(0, 10) : '');
                    const isMiddle = !isStart && !isEnd;

                    return (
                      <Box
                        key={`${event.id}-${index}`}
                        sx={{
                          position: 'relative',
                          width: '100%',
                          height: 28, // 일반 일정과 동일한 높이
                          mb: 0.5,
                          backgroundColor:
                            event.color || getEventColor(event.type),
                          color: 'white',
                          borderRadius:
                            isStart && isEnd
                              ? '14px'
                              : isStart
                                ? '14px 0 0 14px'
                                : isEnd
                                  ? '0 14px 14px 0'
                                  : 0,
                          px: 1,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          fontSize: '1rem',
                          cursor: 'pointer',
                          opacity: 0.95,
                          overflow: 'hidden',
                          whiteSpace: 'nowrap',
                          textOverflow: 'ellipsis',
                          '&:hover': { opacity: 0.8 },
                          // 연결 라인 추가
                          ...(isMiddle && {
                            '&::before': {
                              content: '""',
                              position: 'absolute',
                              left: '-4px',
                              top: '50%',
                              transform: 'translateY(-50%)',
                              width: '8px',
                              height: '2px',
                              backgroundColor:
                                event.color || getEventColor(event.type),
                              zIndex: 1,
                            },
                            '&::after': {
                              content: '""',
                              position: 'absolute',
                              right: '-4px',
                              top: '50%',
                              transform: 'translateY(-50%)',
                              width: '8px',
                              height: '2px',
                              backgroundColor:
                                event.color || getEventColor(event.type),
                              zIndex: 1,
                            },
                          }),
                          // 시작일과 종료일에 원형 표시
                          ...(isStart && {
                            '&::before': {
                              content: '""',
                              position: 'absolute',
                              left: '-2px',
                              top: '50%',
                              transform: 'translateY(-50%)',
                              width: '4px',
                              height: '4px',
                              borderRadius: '50%',
                              backgroundColor:
                                event.color || getEventColor(event.type),
                              border: '2px solid white',
                              zIndex: 2,
                            },
                          }),
                          ...(isEnd && {
                            '&::after': {
                              content: '""',
                              position: 'absolute',
                              right: '-2px',
                              top: '50%',
                              transform: 'translateY(-50%)',
                              width: '4px',
                              height: '4px',
                              borderRadius: '50%',
                              backgroundColor:
                                event.color || getEventColor(event.type),
                              border: '2px solid white',
                              zIndex: 2,
                            },
                          }),
                        }}
                      >
                        <Box
                          onClick={e => {
                            e.stopPropagation();
                            handleEventClick(event, e);
                          }}
                          sx={{
                            flex: 1,
                            overflow: 'hidden',
                            whiteSpace: 'nowrap',
                            textOverflow: 'ellipsis',
                            maxWidth: '100%',
                            minWidth: 0,
                          }}
                        >
                          {getCalendarTitle(event)}
                        </Box>
                        <IconButton
                          size="small"
                          onClick={e => handleEventDelete(event, e)}
                          sx={{
                            color: 'white',
                            p: 0.2,
                            minWidth: 'auto',
                            '&:hover': {
                              backgroundColor: 'rgba(255, 255, 255, 0.2)',
                            },
                          }}
                        >
                          <DeleteIcon sx={{ fontSize: '0.8rem' }} />
                        </IconButton>

                      </Box>
                    );
                  })}
                  {/* 단일 일정은 기존 Chip 방식 - 멀티데이 이벤트가 아닌 것만 표시 */}
                  {singleDayEvents
                    .filter(
                      event =>
                        !event.startDate ||
                        !event.endDate ||
                        event.startDate === event.endDate
                    )
                    .slice(0, 3)
                    .map((event, index) => (
                      <Box
                        key={`${event.id}-${index}`}
                        sx={{
                          display: 'flex',
                          alignItems: 'center',
                          mb: 0.5,
                          backgroundColor:
                            event.color || getEventColor(event.type),
                          borderRadius: 1,
                          p: 0.5,
                          cursor: 'pointer',
                          '&:hover': {
                            opacity: 0.8,
                          },
                        }}
                      >
                        <Chip
                          label={
                            <span
                              style={{
                                whiteSpace: 'normal',
                                wordBreak: 'break-all',
                                display: 'block',
                                textAlign: 'left',
                              }}
                            >
                              {getCalendarTitle(event)}
                            </span>
                          }
                          size="small"
                          onClick={e => {
                            e.stopPropagation();
                            handleEventClick(event, e);
                          }}
                          sx={{
                            fontSize: '0.9rem',
                            height: 'auto',
                            backgroundColor: 'transparent',
                            color: 'white',
                            maxWidth: '100%',
                            cursor: 'pointer',
                            flex: 1,
                            '& .MuiChip-label': {
                              whiteSpace: 'normal',
                              wordBreak: 'break-all',
                              display: 'block',
                              textAlign: 'left',
                              padding: 0,
                            },
                          }}
                        />
                        <IconButton
                          size="small"
                          onClick={e => handleEventDelete(event, e)}
                          sx={{
                            color: 'white',
                            p: 0.2,
                            minWidth: 'auto',
                            ml: 0.5,
                            '&:hover': {
                              backgroundColor: 'rgba(255, 255, 255, 0.2)',
                            },
                          }}
                        >
                          <DeleteIcon sx={{ fontSize: '0.8rem' }} />
                        </IconButton>

                      </Box>
                    ))}
                  {singleDayEvents.length > 3 && (
                    <Typography
                      variant="caption"
                      sx={{
                        color: '#b0b8c1',
                        cursor: 'pointer',
                        textDecoration: 'underline',
                      }}
                      onClick={e => {
                        e.stopPropagation();
                        setSelectedDate(date);
                        setSelectedEvents(singleDayEvents);
                        setDetailDialogOpen(true);
                      }}
                    >
                      +{singleDayEvents.length - 3}개 더
                    </Typography>
                  )}
                </Box>
              </Paper>
            </Grid>
          );
        })}
      </Grid>
    </Box>
  );

  // 주간 뷰 렌더링
  const renderWeekView = () => (
    <Box sx={{ p: { xs: 0.5, sm: 1, md: 2 } }}>
      <Grid container spacing={{ xs: 0.5, sm: 1, md: 1 }}>
        {['일', '월', '화', '수', '목', '금', '토'].map((day, index) => {
          const date = new Date(currentDate);
          date.setDate(date.getDate() - date.getDay() + index);
          const dayEvents = getEventsForDateLocal(date);
          const isToday = date.toDateString() === new Date().toDateString();

          return (
            <Grid item xs={12 / 7} key={day}>
              <Paper
                sx={{
                  p: { xs: 0.5, sm: 1, md: 1 },
                  minHeight: { xs: '150px', sm: '180px', md: '200px' },
                  backgroundColor: isToday ? 'var(--primary-color)' : 'var(--background-color)',
                  border: isToday ? '2px solid var(--primary-color)' : '1px solid var(--border-color)',
                  cursor: 'pointer',
                }}
                onClick={() => handleDateClick(date)}
              >
                <Box
                  sx={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    mb: 1,
                  }}
                >
                  <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
                    <Typography
                      variant="subtitle2"
                      sx={{
                        color: isToday
                          ? '#40c4ff'
                          : index === 0
                            ? '#ff6b6b'
                            : index === 6
                              ? '#4fc3f7'
                              : '#e0e6ed',
                        fontWeight: isToday ? 'bold' : 'normal',
                        fontSize: { xs: '0.9rem', sm: '1.075rem', md: '1.2rem' },
                      }}
                    >
                      {day}
                    </Typography>
                    <Typography
                      variant="caption"
                      sx={{
                        color: isToday
                          ? '#40c4ff'
                          : index === 0
                            ? '#ff6b6b'
                            : index === 6
                              ? '#4fc3f7'
                              : '#b0b8c1',
                        fontSize: { xs: '0.8rem', sm: '0.95rem', md: '1.075rem' },
                      }}
                    >
                      {date.getDate()}
                    </Typography>
                  </Box>
                  <IconButton
                    size="small"
                    onClick={e => {
                      e.stopPropagation();
                      setNewEvent({
                        id: '',
                        title: '',
                        date: date.toISOString().split('T')[0],
                        time: '09:00',
                        type: '개인',
                        description: '',
                        customerName: '',
                        address: '',
                        contact: '',
                        priority: '보통',
                        status: '예정',
                        color: '',
                        createdAt: new Date().toISOString(),
                        updatedAt: new Date().toISOString(),
                        createdBy: 'current_user',
                      });
                      setIsPeriodMode(false);
                      setEventDialogOpen(true);
                    }}
                    sx={{
                      color: isToday ? '#40c4ff' : '#b0b8c1',
                      '&:hover': {
                        backgroundColor: 'rgba(64, 196, 255, 0.1)',
                        color: '#40c4ff',
                      },
                    }}
                  >
                    <AddIcon fontSize="small" />
                  </IconButton>
                </Box>
                <Box sx={{ mt: 1 }}>
                  {/* 기간 일정과 단일 일정 분리 */}
                  {(() => {
                    const multiDayEvents = dayEvents.filter(event => {
                      if (!event.startDate || !event.endDate) return false;
                      if (event.startDate === event.endDate) return false;
                      const d = toLocalDateString(date);
                      const s = event.startDate.slice(0, 10);
                      const e = event.endDate.slice(0, 10);
                      return d >= s && d <= e;
                    });

                    const singleDayEvents = dayEvents.filter(
                      event =>
                        !event.startDate ||
                        !event.endDate ||
                        event.startDate === event.endDate
                    );

                    return (
                      <>
                        {/* 기간 일정 표시 */}
                        {multiDayEvents.map((event, index) => {
                          const isStart =
                            toLocalDateString(date) ===
                            (event.startDate
                              ? event.startDate.slice(0, 10)
                              : '');
                          const isEnd =
                            toLocalDateString(date) ===
                            (event.endDate ? event.endDate.slice(0, 10) : '');
                          const isMiddle = !isStart && !isEnd;

                          return (
                            <Box
                              key={`${event.id}-${index}`}
                              onClick={e => {
                                e.stopPropagation();
                                handleEventClick(event, e);
                              }}
                              sx={{
                                position: 'relative',
                                p: 0.5,
                                mb: 0.5,
                                backgroundColor:
                                  event.color || getEventColor(event.type),
                                borderRadius:
                                  isStart && isEnd
                                    ? '14px'
                                    : isStart
                                      ? '14px 0 0 14px'
                                      : isEnd
                                        ? '0 14px 14px 0'
                                        : 0,
                                fontSize: {
                                  xs: '0.8rem',
                                  sm: '0.85rem',
                                  md: '0.9rem',
                                },
                                color: 'white',
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'space-between',
                                '&:hover': { opacity: 0.8 },
                                // 연결 라인 추가
                                ...(isMiddle && {
                                  '&::before': {
                                    content: '""',
                                    position: 'absolute',
                                    left: '-4px',
                                    top: '50%',
                                    transform: 'translateY(-50%)',
                                    width: '8px',
                                    height: '2px',
                                    backgroundColor:
                                      event.color || getEventColor(event.type),
                                    zIndex: 1,
                                  },
                                  '&::after': {
                                    content: '""',
                                    position: 'absolute',
                                    right: '-4px',
                                    top: '50%',
                                    transform: 'translateY(-50%)',
                                    width: '8px',
                                    height: '2px',
                                    backgroundColor:
                                      event.color || getEventColor(event.type),
                                    zIndex: 1,
                                  },
                                }),
                                // 시작일과 종료일에 원형 표시
                                ...(isStart && {
                                  '&::before': {
                                    content: '""',
                                    position: 'absolute',
                                    left: '-2px',
                                    top: '50%',
                                    transform: 'translateY(-50%)',
                                    width: '4px',
                                    height: '4px',
                                    borderRadius: '50%',
                                    backgroundColor:
                                      event.color || getEventColor(event.type),
                                    border: '2px solid white',
                                    zIndex: 2,
                                  },
                                }),
                                ...(isEnd && {
                                  '&::after': {
                                    content: '""',
                                    position: 'absolute',
                                    right: '-2px',
                                    top: '50%',
                                    transform: 'translateY(-50%)',
                                    width: '4px',
                                    height: '4px',
                                    borderRadius: '50%',
                                    backgroundColor:
                                      event.color || getEventColor(event.type),
                                    border: '2px solid white',
                                    zIndex: 2,
                                  },
                                }),
                              }}
                            >
                              <span
                                style={{
                                  flex: 1,
                                  overflow: 'hidden',
                                  textOverflow: 'ellipsis',
                                  whiteSpace: 'nowrap',
                                }}
                              >
                                {event.type === '개인'
                                  ? getCalendarTitle(event)
                                  : `${event.time} ${getCalendarTitle(event)}`}
                              </span>

                            </Box>
                          );
                        })}

                        {/* 단일 일정 표시 */}
                        {singleDayEvents.map((event, index) => (
                          <Box
                            key={`${event.id}-${index}`}
                            onClick={e => {
                              e.stopPropagation();
                              handleEventClick(event, e);
                            }}
                            sx={{
                              p: 0.5,
                              mb: 0.5,
                              backgroundColor:
                                event.color || getEventColor(event.type),
                              borderRadius: 1,
                              fontSize: '0.9rem',
                              color: 'white',
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'space-between',
                              '&:hover': {
                                opacity: 0.8,
                              },
                            }}
                          >
                            {/* 시간+타이틀 표시: 개인일정은 중복 방지 */}
                            {event.type === '개인' ? (
                              <span>{getCalendarTitle(event)}</span>
                            ) : (
                              <span>
                                {event.time} {getCalendarTitle(event)}
                              </span>
                            )}

                          </Box>
                        ))}
                      </>
                    );
                  })()}
                </Box>
              </Paper>
            </Grid>
          );
        })}
      </Grid>
    </Box>
  );

  // 일간 뷰 렌더링
  const renderDayView = () => {
            const dayEvents = getEventsForDateLocal(currentDate);
    const isToday = currentDate.toDateString() === new Date().toDateString();
    const dayOfWeek = currentDate.getDay(); // 0: 일요일, 6: 토요일

    return (
      <Box sx={{ p: { xs: 0.5, sm: 1, md: 2 } }}>
        <Typography
          variant="h6"
          sx={{
            mb: 2,
            color: isToday
              ? '#40c4ff'
              : dayOfWeek === 0
                ? '#ff6b6b'
                : dayOfWeek === 6
                  ? '#4fc3f7'
                  : '#e0e6ed',
            fontWeight: isToday ? 'bold' : 'normal',
            fontSize: { xs: '1rem', sm: '1.25rem', md: '1.5rem' },
          }}
        >
          {currentDate.toLocaleDateString('ko-KR', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            weekday: 'long',
            timeZone: 'Asia/Seoul',
          })}
        </Typography>
        <List>
          {dayEvents.length > 0 ? (
            dayEvents.map((event, index) => (
              <ListItem
                key={`${event.id}-${index}`}
                sx={{
                  mb: 1,
                  backgroundColor: 'var(--surface-color)',
                  borderRadius: 1,
                  border: `2px solid ${event.color || getEventColor(event.type)}`,
                }}
              >
                <ListItemIcon>
                  {event.type === '시공' && (
                    <BuildIcon
                      sx={{ color: event.color || getEventColor(event.type) }}
                    />
                  )}
                  {event.type === 'AS' && (
                    <SupportIcon
                      sx={{ color: event.color || getEventColor(event.type) }}
                    />
                  )}
                  {event.type === '실측' && (
                    <DateRangeIcon
                      sx={{ color: event.color || getEventColor(event.type) }}
                    />
                  )}
                  {event.type === '매장상담' && (
                    <BusinessIcon
                      sx={{ color: event.color || getEventColor(event.type) }}
                    />
                  )}
                  {event.type === '개인' && (
                    <PersonIcon
                      sx={{ color: event.color || getEventColor(event.type) }}
                    />
                  )}
                  {event.type === '병원' && (
                    <EventIcon
                      sx={{ color: event.color || getEventColor(event.type) }}
                    />
                  )}
                  {event.type === '여행' && (
                    <EventIcon
                      sx={{ color: event.color || getEventColor(event.type) }}
                    />
                  )}
                </ListItemIcon>
                <ListItemText
                  primary={
                    <Box display="flex" alignItems="center" gap={1}>
                      <Typography variant="subtitle1">
                        {getCalendarTitle(event)}
                      </Typography>
                      <Chip
                        label={event.type}
                        size="small"
                        sx={{
                          backgroundColor:
                            event.color || getEventColor(event.type),
                        }}
                      />
                      <Chip
                        label={event.priority}
                        size="small"
                        color={
                          event.priority === '높음'
                            ? 'error'
                            : event.priority === '보통'
                              ? 'warning'
                              : 'default'
                        }
                      />
                    </Box>
                  }
                  secondary={
                    <Box>
                      <Typography variant="body2" sx={{ mb: 1 }}>
                        {event.date} {event.time} | {event.type}
                        {(event.type === '실측' || event.type === '시공') && (
                          <>
                            {' / '}
                            {event.type === '실측'
                              ? '실측 주소: '
                              : '시공 주소: '}
                            {event.address}
                            {' / '}
                            {event.type === '실측'
                              ? '실측 시간: '
                              : '시공 시간: '}
                            {event.time}
                          </>
                        )}
                      </Typography>
                      <Typography variant="body2" sx={{ color: '#b0b8c1' }}>
                        {/* 상세 정보 표시 */}
                        {event.description &&
                          (event.type === '시공' && event.deliveryId ? (
                            (() => {
                              const delivery = deliveries.find(
                                d => d.id === event.deliveryId
                              );
                              if (!delivery)
                                return (
                                  <Typography color="error">
                                    납품관리 데이터를 찾을 수 없습니다.
                                  </Typography>
                                );
                              return (
                                <Box>
                                  {/* 제품상세정보 표 */}
                                  <Box sx={{ mb: 3 }}>
                                    <Typography
                                      variant="subtitle2"
                                      sx={{
                                        mb: 2,
                                        color: '#40c4ff',
                                        fontWeight: 'bold',
                                      }}
                                    >
                                      📋 제품상세정보
                                    </Typography>
                                    <Box sx={{ overflowX: 'auto' }}>
                                      <Table
                                        size="small"
                                        sx={{
                                          backgroundColor: '#1e2634',
                                          borderRadius: 1,
                                        }}
                                      >
                                        <TableHead>
                                          <TableRow>
                                            <TableCell
                                              sx={{
                                                color: '#40c4ff',
                                                fontWeight: 'bold',
                                                borderColor: '#2e3a4a',
                                                fontSize: '0.8rem',
                                              }}
                                            >
                                              거래처
                                            </TableCell>
                                            <TableCell
                                              sx={{
                                                color: '#40c4ff',
                                                fontWeight: 'bold',
                                                borderColor: '#2e3a4a',
                                                fontSize: '0.8rem',
                                              }}
                                            >
                                              공간
                                            </TableCell>
                                            <TableCell
                                              sx={{
                                                color: '#40c4ff',
                                                fontWeight: 'bold',
                                                borderColor: '#2e3a4a',
                                                fontSize: '0.8rem',
                                              }}
                                            >
                                              제품코드
                                            </TableCell>
                                            <TableCell
                                              sx={{
                                                color: '#40c4ff',
                                                fontWeight: 'bold',
                                                borderColor: '#2e3a4a',
                                                fontSize: '0.8rem',
                                              }}
                                            >
                                              제작사이즈
                                            </TableCell>
                                            <TableCell
                                              sx={{
                                                color: '#40c4ff',
                                                fontWeight: 'bold',
                                                borderColor: '#2e3a4a',
                                                fontSize: '0.8rem',
                                              }}
                                            >
                                              줄방향
                                            </TableCell>
                                            <TableCell
                                              sx={{
                                                color: '#40c4ff',
                                                fontWeight: 'bold',
                                                borderColor: '#2e3a4a',
                                                fontSize: '0.8rem',
                                              }}
                                            >
                                              줄길이
                                            </TableCell>
                                            <TableCell
                                              sx={{
                                                color: '#40c4ff',
                                                fontWeight: 'bold',
                                                borderColor: '#2e3a4a',
                                                fontSize: '0.8rem',
                                              }}
                                            >
                                              주름양
                                            </TableCell>
                                            <TableCell
                                              sx={{
                                                color: '#40c4ff',
                                                fontWeight: 'bold',
                                                borderColor: '#2e3a4a',
                                                fontSize: '0.8rem',
                                              }}
                                            >
                                              폭수
                                            </TableCell>
                                          </TableRow>
                                        </TableHead>
                                        <TableBody>
                                          {delivery.items &&
                                          delivery.items.length > 0 ? (
                                            delivery.items.map((item, idx) => (
                                              <TableRow key={idx}>
                                                <TableCell
                                                  sx={{
                                                    color: '#e0e6ed',
                                                    borderColor: '#2e3a4a',
                                                    fontSize: '0.8rem',
                                                  }}
                                                >
                                                  {delivery.customerName || '-'}
                                                </TableCell>
                                                <TableCell
                                                  sx={{
                                                    color: '#e0e6ed',
                                                    borderColor: '#2e3a4a',
                                                    fontSize: '0.8rem',
                                                  }}
                                                >
                                                  {item.space || '-'}
                                                </TableCell>
                                                <TableCell
                                                  sx={{
                                                    color: '#e0e6ed',
                                                    borderColor: '#2e3a4a',
                                                    fontSize: '0.8rem',
                                                  }}
                                                >
                                                  {item.productCode || '-'}
                                                </TableCell>
                                                <TableCell
                                                  sx={{
                                                    color: '#e0e6ed',
                                                    borderColor: '#2e3a4a',
                                                    fontSize: '0.8rem',
                                                  }}
                                                >
                                                  {item.widthMM && item.heightMM
                                                    ? `${item.widthMM}×${item.heightMM}`
                                                    : '-'}
                                                </TableCell>
                                                <TableCell
                                                  sx={{
                                                    color: '#e0e6ed',
                                                    borderColor: '#2e3a4a',
                                                    fontSize: '0.8rem',
                                                  }}
                                                >
                                                  {item.lineDirection || '-'}
                                                </TableCell>
                                                <TableCell
                                                  sx={{
                                                    color: '#e0e6ed',
                                                    borderColor: '#2e3a4a',
                                                    fontSize: '0.8rem',
                                                  }}
                                                >
                                                  {item.lineLength || '-'}
                                                </TableCell>
                                                <TableCell
                                                  sx={{
                                                    color: '#e0e6ed',
                                                    borderColor: '#2e3a4a',
                                                    fontSize: '0.8rem',
                                                  }}
                                                >
                                                  {item.pleatAmount || '-'}
                                                </TableCell>
                                                <TableCell
                                                  sx={{
                                                    color: '#e0e6ed',
                                                    borderColor: '#2e3a4a',
                                                    fontSize: '0.8rem',
                                                  }}
                                                >
                                                  {item.widthCount || '-'}
                                                </TableCell>
                                              </TableRow>
                                            ))
                                          ) : (
                                            <TableRow>
                                              <TableCell
                                                colSpan={8}
                                                align="center"
                                              >
                                                제품 정보가 없습니다.
                                              </TableCell>
                                            </TableRow>
                                          )}
                                        </TableBody>
                                      </Table>
                                    </Box>
                                  </Box>
                                  {/* 레일정보 */}
                                  <Box sx={{ mb: 3 }}>
                                    <Typography
                                      variant="subtitle2"
                                      sx={{
                                        mb: 1,
                                        color: '#40c4ff',
                                        fontWeight: 'bold',
                                      }}
                                    >
                                      🚇 레일정보
                                    </Typography>
                                    {delivery.railItems &&
                                    delivery.railItems.length > 0 ? (
                                      <Table
                                        size="small"
                                        sx={{
                                          backgroundColor: '#1e2634',
                                          borderRadius: 1,
                                        }}
                                      >
                                        <TableHead>
                                          <TableRow>
                                            <TableCell
                                              sx={{
                                                color: '#ff9800',
                                                fontWeight: 'bold',
                                                fontSize: '0.875rem',
                                              }}
                                            >
                                              세부내용
                                            </TableCell>
                                            <TableCell
                                              sx={{
                                                color: '#ff9800',
                                                fontWeight: 'bold',
                                                fontSize: '0.875rem',
                                              }}
                                            >
                                              수량
                                            </TableCell>
                                            <TableCell
                                              sx={{
                                                color: '#ff9800',
                                                fontWeight: 'bold',
                                                fontSize: '0.875rem',
                                              }}
                                            >
                                              입고단가
                                            </TableCell>
                                            <TableCell
                                              sx={{
                                                color: '#ff9800',
                                                fontWeight: 'bold',
                                                fontSize: '0.875rem',
                                              }}
                                            >
                                              입고금액
                                            </TableCell>
                                          </TableRow>
                                        </TableHead>
                                        <TableBody>
                                          {delivery.railItems.map(
                                            (rail, idx) => (
                                              <TableRow key={idx}>
                                                <TableCell
                                                  sx={{
                                                    color: '#e0e6ed',
                                                    borderColor: '#2e3a4a',
                                                    fontSize: '0.8rem',
                                                  }}
                                                >
                                                  {rail.details || '-'}
                                                </TableCell>
                                                <TableCell
                                                  sx={{
                                                    color: '#e0e6ed',
                                                    borderColor: '#2e3a4a',
                                                    fontSize: '0.8rem',
                                                  }}
                                                >
                                                  {rail.quantity
                                                    ? `${rail.quantity} EA`
                                                    : '-'}
                                                </TableCell>
                                                <TableCell
                                                  sx={{
                                                    color: '#e0e6ed',
                                                    borderColor: '#2e3a4a',
                                                    fontSize: '0.8rem',
                                                  }}
                                                >
                                                  {rail.unitPrice
                                                    ? `${rail.unitPrice.toLocaleString()}원`
                                                    : '-'}
                                                </TableCell>
                                                <TableCell
                                                  sx={{
                                                    color: '#e0e6ed',
                                                    borderColor: '#2e3a4a',
                                                    fontSize: '0.8rem',
                                                  }}
                                                >
                                                  {rail.totalPrice
                                                    ? `${rail.totalPrice.toLocaleString()}원`
                                                    : '-'}
                                                </TableCell>
                                              </TableRow>
                                            )
                                          )}
                                        </TableBody>
                                      </Table>
                                    ) : (
                                      <Typography
                                        variant="body2"
                                        sx={{ color: '#b0b8c1' }}
                                      >
                                        레일 정보가 없습니다.
                                      </Typography>
                                    )}
                                  </Box>
                                  {/* 금액정보 */}
                                  <Box sx={{ mb: 3 }}>
                                    <Typography
                                      variant="subtitle2"
                                      sx={{
                                        mb: 1,
                                        color: '#40c4ff',
                                        fontWeight: 'bold',
                                      }}
                                    >
                                      💰 금액정보
                                    </Typography>
                                    <Typography
                                      variant="body2"
                                      sx={{
                                        color: '#b0b8c1',
                                        whiteSpace: 'pre-wrap',
                                        p: 2,
                                        backgroundColor: '#1e2634',
                                        borderRadius: 1,
                                      }}
                                    >
                                      할인후금액:{' '}
                                      {(
                                        delivery.finalAmount || 0
                                      ).toLocaleString()}
                                      원{`\n`}
                                      현재입금액:{' '}
                                      {(
                                        delivery.paidAmount || 0
                                      ).toLocaleString()}
                                      원{`\n`}
                                      잔액:{' '}
                                      {(
                                        delivery.remainingAmount || 0
                                      ).toLocaleString()}
                                      원
                                    </Typography>
                                  </Box>
                                </Box>
                              );
                            })()
                          ) : (
                            <Typography variant="body2" sx={{ mb: 1 }}>
                              {event.description}
                            </Typography>
                          ))}
                      </Typography>
                      {event.customerName && (
                        <Typography variant="caption" sx={{ color: '#b0b8c1' }}>
                          고객: {event.customerName} | 연락처: {event.contact}
                        </Typography>
                      )}
                    </Box>
                  }
                />
                <Box>
                  <IconButton
                    size="small"
                    onClick={() => handleEditEvent(event)}
                  >
                    <EditIcon />
                  </IconButton>
                  <IconButton
                    size="small"
                    onClick={() => handleDeleteEvent(event.id)}
                  >
                    <DeleteIcon />
                  </IconButton>
                </Box>
              </ListItem>
            ))
          ) : (
            <Typography
              variant="body1"
              sx={{ textAlign: 'center', color: '#b0b8c1', py: 4 }}
            >
              이 날의 일정이 없습니다.
            </Typography>
          )}
        </List>
      </Box>
    );
  };

  // 새로운 기능들을 위한 핸들러들

  // 채팅/댓글
  const handleCommentSubmit = async () => {
    if (!newComment || !newComment.trim() || !selectedEventForChat) return;
    
    // 채팅 권한 체크
    if (!hasChatPermission) {
      setSnackbar({
        open: true,
        message: '채팅 권한이 없습니다. 관리자에게 문의하세요.',
        severity: 'error',
      });
      return;
    }

    try {
      console.log('스케줄 채팅 메시지 전송 시작 (푸시 알림 포함):', {
        eventId: selectedEventForChat.id,
        message: newComment.trim(),
        userName: nickname || '사용자'
      });

      // 푸시 알림이 포함된 스케줄 채팅 메시지 전송
      await fcmService.sendScheduleChatMessageWithNotification(
        nickname || '사용자',
        newComment.trim(),
        currentUser?.id?.toString() || 'current_user',
        selectedEventForChat.id,
        selectedEventForChat.title
      );

      // 입력 필드 초기화
      setNewComment('');
      setCommentAttachments([]);
      
      setSnackbar({
        open: true,
        message: '댓글이 실시간으로 전송되었습니다. (푸시 알림 포함)',
        severity: 'success',
      });
    } catch (error) {
      console.error('댓글 저장 실패:', error);
      setSnackbar({
        open: true,
        message: '댓글 전송에 실패했습니다.',
        severity: 'error',
      });
    }
  };

  const handleFileUpload = (files: FileList) => {
    setCommentAttachments(prev => [...prev, ...Array.from(files)]);
  };

  // 알림 관리
  const handleNotificationToggle = (eventId: string, type: string) => {
    const updatedEvents = events.map(event => {
      if (event.id === eventId) {
        const notifications = event.notifications || [];
        const existingIndex = notifications.findIndex(n => n.type === type);

        if (existingIndex >= 0) {
          notifications[existingIndex].isEnabled =
            !notifications[existingIndex].isEnabled;
        } else {
          notifications.push({
            id: Date.now().toString(),
            eventId,
            type: type as any,
            isEnabled: true,
            message: `일정 알림: ${event.title}`,
          });
        }

        return {
          ...event,
          notifications,
          updatedAt: new Date().toISOString(),
        };
      }
      return event;
    });
    
    setEvents(updatedEvents);
    
    // localStorage 업데이트
    localStorage.setItem('schedules', JSON.stringify(updatedEvents));
  };

  // 공유 기능
  const handleShareEvent = (event: ScheduleEvent) => {
    setSelectedEventForShare(event);
    setShareDialogOpen(true);
  };

  const handleShareSubmit = (sharedWith: string[], permissions: string) => {
    if (!selectedEventForShare) return;

    const share: ScheduleShare = {
      id: Date.now().toString(),
      eventId: selectedEventForShare.id,
      sharedWith,
      permissions: permissions as any,
      sharedAt: new Date().toISOString(),
    };

    const updatedEvents = events.map(event =>
      event.id === selectedEventForShare.id
        ? {
            ...event,
            shares: [...(event.shares || []), share],
            updatedAt: new Date().toISOString(),
          }
        : event
    );
    setEvents(updatedEvents);
    
    // localStorage 업데이트
    localStorage.setItem('schedules', JSON.stringify(updatedEvents));

    setShareDialogOpen(false);
    setSelectedEventForShare(null);
    setSnackbar({
      open: true,
      message: '일정이 공유되었습니다.',
      severity: 'success',
    });
  };

  // 통계 계산
  const calculateStats = () => {
    const totalEvents = events.length;
    const completedEvents = events.filter(e => e.status === '완료').length;
    const pendingEvents = events.filter(e => e.status === '예정').length;
    const cancelledEvents = events.filter(e => e.status === '취소').length;

    const eventsByType = events.reduce(
      (acc, event) => {
        acc[event.type] = (acc[event.type] || 0) + 1;
        return acc;
      },
      {} as { [key: string]: number }
    );

    const eventsByMonth = events.reduce(
      (acc, event) => {
        const month = new Date(event.date).toISOString().slice(0, 7);
        acc[month] = (acc[month] || 0) + 1;
        return acc;
      },
      {} as { [key: string]: number }
    );

    const completedEventsWithDuration = events.filter(
      e => e.status === '완료' && e.createdAt && e.updatedAt
    );

    const averageCompletionTime =
      completedEventsWithDuration.length > 0
        ? completedEventsWithDuration.reduce((sum, event) => {
            const created = new Date(event.createdAt).getTime();
            const updated = new Date(event.updatedAt).getTime();
            return sum + (updated - created);
          }, 0) /
          completedEventsWithDuration.length /
          (1000 * 60 * 60 * 24) // 일 단위
        : 0;

    setStats({
      totalEvents,
      completedEvents,
      pendingEvents,
      cancelledEvents,
      eventsByType,
      eventsByMonth,
      averageCompletionTime,
    });
  };

  // 통계 다이얼로그 열기
  const handleStatsOpen = () => {
    calculateStats();
    setStatsDialogOpen(true);
  };

  // 반복 일정 생성
  const handleRepeatEvent = (
    event: ScheduleEvent,
    pattern: string,
    endDate: string
  ) => {
    const start = new Date(event.date);
    const end = new Date(endDate);
    const eventsToAdd: ScheduleEvent[] = [];

    let current = new Date(start);
    while (current <= end) {
      if (current.getTime() !== start.getTime()) {
        // 원본 일정 제외
        const newEvent: ScheduleEvent = {
          ...event,
          id: `repeat-${event.id}-${current.getTime()}`,
          date: current.toISOString().split('T')[0],
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          createdBy: nickname || 'current_user',
        };
        eventsToAdd.push(newEvent);
      }

      // 다음 날짜 계산
      switch (pattern) {
        case 'daily':
          current.setDate(current.getDate() + 1);
          break;
        case 'weekly':
          current.setDate(current.getDate() + 7);
          break;
        case 'monthly':
          current.setMonth(current.getMonth() + 1);
          break;
        case 'yearly':
          current.setFullYear(current.getFullYear() + 1);
          break;
      }
    }

    setEvents(prev => [...prev, ...eventsToAdd]);
    setSnackbar({
      open: true,
      message: `${eventsToAdd.length}개의 반복 일정이 생성되었습니다.`,
      severity: 'success',
    });
  };

  // 1. saved_estimates 불러오기
  const savedEstimates = useMemo(() => {
    try {
      return JSON.parse(localStorage.getItem('saved_estimates') || '[]');
    } catch {
      return [];
    }
  }, []);

  // 채팅 메시지 전송 시 userName 사용
  const handleSendMessage = () => {
    // UserContext의 nickname 사용 - 모달 제거
    handleCommentSubmit();
  };

  // 메모 관련 핸들러

  // 상세 정보를 표 형태로 파싱하는 함수
  const parseDetailedDescription = (description: string) => {
    if (!description || typeof description !== 'string') return null;

    const lines = description.split('\n');
    const sections: {
      title: string;
      content: string;
      type: 'basic' | 'table';
    }[] = [];
    let currentSection: {
      title: string;
      content: string;
      type: 'basic' | 'table';
    } = { title: '', content: '', type: 'basic' };

    lines.forEach(line => {
      if (!line) return;
      
      if (
        line.includes('📍') ||
        line.includes('💰') ||
        line.includes('📋') ||
        line.includes('🚇')
      ) {
        // 새로운 섹션 시작
        if (currentSection.title) {
          sections.push({ ...currentSection });
        }
        currentSection = {
          title: line.trim(),
          content: '',
          type: line.includes('📋') || line.includes('🚇') ? 'table' : 'basic',
        };
      } else if (line.trim() && currentSection.title) {
        currentSection.content += line + '\n';
      }
    });

    if (currentSection.title) {
      sections.push(currentSection);
    }

    return sections;
  };

  // 표 형태의 텍스트를 파싱하는 함수
  const parseTableContent = (content: string) => {
    if (!content || typeof content !== 'string') return null;
    
    const lines = content.split('\n').filter(line => line && line.trim());
    const tableLines = lines.filter(line => line && line.includes('│'));

    if (tableLines.length === 0) return null;

    // 헤더 추출 (두 번째 줄)
    const headerLine = tableLines[1];
    if (!headerLine) return null;
    
    const headers = headerLine
      .split('│')
      .slice(1, -1)
      .map(h => h && h.trim());

    // 데이터 행들 추출
    const dataRows = tableLines.slice(3, -1).map(line => {
      if (!line) return [];
      const cells = line
        .split('│')
        .slice(1, -1)
        .map(cell => cell && cell.trim());
      return cells;
    });

    return { headers, dataRows };
  };

  // selectedEvents를 events에서 동기화
  useEffect(() => {
    if (detailDialogOpen && selectedEvents.length > 0) {
      setSelectedEvents(
        selectedEvents.map(se => events.find(e => e.id === se.id) || se)
      );
    }
  }, [events, detailDialogOpen]);

  // 주소에서 네비게이션 주소 추출 함수
  const extractNavigationAddress = (address: string) => {
    if (!address || typeof address !== 'string') return '';
    // 1. 아파트/오피스텔/빌라/타워 등 키워드
    const aptRegex =
      /(\S+아파트|\S+오피스텔|\S+빌라|\S+타워|힐스테이트|센트럴|삼성|현대|롯데)[\s\S]*?(\d{1,3}동)?\s?(\d{1,4}호)?/;
    const match = address.match(aptRegex);
    if (match) {
      let result = match[1] || '';
      if (match[2] && match[3]) {
        result +=
          ' ' + (match[2] ? match[2].replace('동', '') : '') + '-' + (match[3] ? match[3].replace('호', '') : '');
      } else if (match[2]) {
        result += ' ' + match[2];
      } else if (match[3]) {
        result += ' ' + match[3];
      }
      return result.trim();
    }
    // 2. 동/번지
    const dongBunji = address.match(/([가-힣]+동)\s?(\d{1,5}(-\d{1,5})?번지?)/);
    if (dongBunji) {
      return (dongBunji[1] || '') + ' ' + (dongBunji[2] || '');
    }
    // 3. 기타: 마지막 2~3개 토큰
    const tokens = address.trim().split(/\s+/);
    if (tokens.length <= 2) return address;
    return tokens.slice(-3).join(' ');
  };

  // 가장 명확하게 찾을 수 있는 주소 정보만 추출 (동호수 패턴 보완)
  const extractBestAddress = (address: string) => {
    if (!address || typeof address !== 'string') return '';
    // 1. 아파트/오피스텔/빌라/타워/건물명 + 동/호수 (붙어있는 패턴 포함)
    const aptRegex =
      /( -|[가-힣]+)(아파트|오피스텔|빌라|타워|테라스|캐슬|팰리스|센트럴|아이파크|자이|푸르지오|더샵|래미안|이편한세상|SKVIEW|롯데캐슬|포레나|데시앙|해링턴플레이스)[\s-]*((\d{1,3})동)?[\s-]*(\d{1,4})호?/;
    const match = address.match(aptRegex);
    if (match) {
      let result = (match[1] || '') + (match[2] || '');
      if (match[4]) result += ` ${match[4]}동`;
      if (match[5]) result += `${match[5]}호`;
      return result.trim();
    }
    // 2. 동/번지
    const dongBunji = address.match(
      /([가-힣]+동)[\s-]?(\d{1,5}(-\d{1,5})?번지?)/
    );
    if (dongBunji) {
      return `${dongBunji[1] || ''} ${dongBunji[2] || ''}`;
    }
    // 3. 그 외: 전체 주소
    return address.trim();
  };

  // 달력 표시용 제목 생성 (타입-가장 명확한 주소-시간)
  const getCalendarTitle = (event: ScheduleEvent) => {
    // type이 없으면 기본값 사용
    return event.title || event.type || '일정';
  };

  // 상세 주소 추출 함수 (동호수, 번지수 등 포함)
  const extractDetailedAddress = (address: string) => {
    if (!address || typeof address !== 'string') return '';

    // 1. 아파트/오피스텔/빌라/타워 등 키워드 + 동호수
    const aptRegex =
      /(\S+아파트|\S+오피스텔|\S+빌라|\S+타워|힐스테이트|센트럴|삼성|현대|롯데|푸르지오|더샵|아이파크|자이|래미안|이편한세상|SKVIEW|롯데캐슬|포레나|데시앙|해링턴플레이스)[\s\S]*?(\d{1,3}동)?\s?(\d{1,4}호)?/;
    const match = address.match(aptRegex);
    if (match) {
      let result = match[1] || '';
      if (match[2] && match[3]) {
        result += ` ${(match[2] ? match[2].replace('동', '') : '')}동-${(match[3] ? match[3].replace('호', '') : '')}호`;
      } else if (match[2]) {
        result += ` ${match[2]}`;
      } else if (match[3]) {
        result += ` ${match[3]}`;
      }
      return result.trim();
    }

    // 2. 동/번지
    const dongBunji = address.match(/([가-힣]+동)\s?(\d{1,5}(-\d{1,5})?번지?)/);
    if (dongBunji) {
      return `${dongBunji[1] || ''} ${dongBunji[2] || ''}`;
    }

    // 3. 일반 주소에서 마지막 3-4개 토큰 (더 많은 정보 포함)
    const tokens = address.trim().split(/\s+/);
    if (tokens.length <= 3) return address;
    return tokens.slice(-4).join(' '); // 마지막 4개 토큰으로 증가
  };

  // 타입별 색상 정의 (동적 관리)
  const getTypeColor = (type: string) => {
    const scheduleType = scheduleTypes.find(t => t.name === type);
    return scheduleType?.color || '#1565c0';
  };

  // 활성화된 타입 목록 가져오기
  const getActiveTypes = () => {
    return scheduleTypes
      .filter(type => type.isActive)
      .sort((a, b) => a.order - b.order);
  };

  // 타입 기반 필터 상태
  const [activeType, setActiveType] = useState<string>('all');

  const handleDragEnd = () => {};

  // 이모티콘 열기 핸들러
  const handleEmojiOpen = () => {
    // 이모티콘 선택 기능 구현 (필요시)
  };

  const [searchText, setSearchText] = useState('');

  // 날짜를 로컬 기준 YYYY-MM-DD 문자열로 변환하는 함수
  function toDateStringLocal(date: Date) {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }

  // 날짜를 YYYY-MM-DD 로컬 문자열로 변환하는 함수
  function toLocalDateString(date: Date) {
    return (
      date.getFullYear() +
      '-' +
      String(date.getMonth() + 1).padStart(2, '0') +
      '-' +
      String(date.getDate()).padStart(2, '0')
    );
  }

  // 일관된 ID 생성 함수 (Firestore 문서 ID 규칙 준수)
  const generateEventId = (prefix: string = 'event') => {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substr(2, 9);
    // Firestore 문서 ID 규칙: /, ., .., * 제외, 1-1500자
    // 하이픈(-)은 허용되므로 기존 형식 유지
    return `${prefix}-${timestamp}-${random}`;
  };

  return (
    <DragDropContext onDragEnd={handleDragEnd}>
      <Box
        sx={{
          height: '100vh',
          display: 'flex',
          flexDirection: 'column',
          backgroundColor: 'var(--background-color)',
          color: 'var(--text-color)',
          overflow: 'hidden',
        }}
      >
        {/* 헤더 */}
        <Box
          sx={{
            p: { xs: 1, sm: 2 },
            borderBottom: 1,
            borderColor: 'var(--border-color)',
            backgroundColor: 'var(--surface-color)',
            position: 'sticky',
            top: 0,
            zIndex: 1000,
            height: { xs: '60px', sm: '72px', md: '80px' },
            overflow: 'hidden',
          }}
        >
          <Box
            display="flex"
            justifyContent="space-between"
            alignItems="center"
            gap={1}
          >
            <Typography
              variant={isMobile ? 'h6' : 'h4'}
              sx={{
                fontWeight: 'bold',
                display: { xs: 'none', md: 'block' },
                color: 'var(--text-secondary-color)',
              }}
            >
              📅 스케줄
            </Typography>

            {/* 검색창만 표시 */}
            <Box display="flex" gap={1} alignItems="center">
              <TextField
                size="small"
                placeholder="검색: 제목, 고객명, 연락처, 주소, 프로젝트명, 채팅내용"
                value={searchText}
                onChange={e => setSearchText(e.target.value)}
                sx={{
                  minWidth: { xs: 80, sm: 120, md: 220 },
                  maxWidth: { xs: 100, sm: 150, md: 300 },
                  background: 'var(--background-color)',
                  borderRadius: 1,
                  input: { color: 'var(--text-color)' },
                  display: { xs: 'block', sm: 'block', md: 'block' },
                  '& .MuiInputBase-root': {
                    fontSize: { xs: '0.65rem', sm: '0.7rem', md: '0.875rem' },
                  },
                }}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon
                        sx={{
                          color: 'var(--primary-color)',
                          fontSize: { xs: '0.9rem', sm: '1rem', md: '1.2rem' },
                        }}
                      />
                    </InputAdornment>
                  ),
                }}
              />
            </Box>

            {/* 오른쪽 버튼들 */}
            <Box display="flex" gap={1} alignItems="center">
              <Button
                variant="outlined"
                color="primary"
                startIcon={<AnalyticsIcon />}
                onClick={handleStatsOpen}
                sx={{
                  borderColor: 'var(--primary-color)',
                  color: 'var(--primary-color)',
                  fontSize: { xs: '0.65rem', sm: '0.75rem', md: '0.875rem' },
                  px: { xs: 0.5, sm: 1, md: 2 },
                  py: { xs: 0.25, sm: 0.5, md: 1 },
                  minWidth: { xs: 'auto', sm: 'auto' },
                  '& .MuiButton-startIcon': {
                    marginRight: { xs: 0.5, sm: 1 },
                  },
                  display: { xs: 'none', sm: 'inline-flex' },
                }}
              >
                통계
              </Button>
              <Button
                variant="outlined"
                color="primary"
                startIcon={<CalendarMonthIcon />}
                onClick={() => setYearlyEventDialogOpen(true)}
                sx={{
                  borderColor: 'var(--primary-color)',
                  color: 'var(--primary-color)',
                  fontSize: { xs: '0.65rem', sm: '0.75rem', md: '0.875rem' },
                  px: { xs: 0.5, sm: 1, md: 2 },
                  py: { xs: 0.25, sm: 0.5, md: 1 },
                  minWidth: { xs: 'auto', sm: 'auto' },
                  '& .MuiButton-startIcon': {
                    marginRight: { xs: 0.5, sm: 1 },
                  },
                  display: { xs: 'none', sm: 'inline-flex' },
                }}
              >
                1년 일정
              </Button>
              <Button
                variant="outlined"
                color="primary"
                startIcon={<CategoryIcon />}
                onClick={() => setTypeManagementOpen(true)}
                sx={{
                  borderColor: 'var(--primary-color)',
                  color: 'var(--primary-color)',
                  fontSize: { xs: '0.65rem', sm: '0.75rem', md: '0.875rem' },
                  px: { xs: 0.5, sm: 1, md: 2 },
                  py: { xs: 0.25, sm: 0.5, md: 1 },
                  minWidth: { xs: 'auto', sm: 'auto' },
                  '& .MuiButton-startIcon': {
                    marginRight: { xs: 0.5, sm: 1 },
                  },
                  display: { xs: 'none', sm: 'inline-flex' },
                }}
              >
                타입 관리
              </Button>
              <Button
                variant="outlined"
                color="primary"
                startIcon={<SyncIcon />}
                onClick={() => setTimeTreeDialogOpen(true)}
                sx={{
                  borderColor: 'var(--primary-color)',
                  color: 'var(--primary-color)',
                  fontSize: { xs: '0.65rem', sm: '0.75rem', md: '0.875rem' },
                  px: { xs: 0.5, sm: 1, md: 2 },
                  py: { xs: 0.25, sm: 0.5, md: 1 },
                  minWidth: { xs: 'auto', sm: 'auto' },
                  '& .MuiButton-startIcon': {
                    marginRight: { xs: 0.5, sm: 1 },
                  },
                  display: { xs: 'none', sm: 'inline-flex' },
                }}
              >
                타임트리 연동
              </Button>
            </Box>
          </Box>
        </Box>

        {/* 필터 칩들 */}
        <Box
          sx={{
            p: { xs: 1, sm: 2 },
            backgroundColor: 'var(--surface-color)',
            borderBottom: 1,
            borderColor: 'var(--border-color)',
            height: { xs: '48px', sm: '56px', md: '64px' },
            display: { xs: 'none', md: 'block' },
            overflow: 'hidden',
          }}
        >
          <Box display="flex" gap={1} flexWrap="wrap">
            <Chip
              label="전체"
              onClick={() => setActiveType('all')}
              sx={{
                backgroundColor:
                  activeType === 'all' ? 'var(--primary-color)' : 'transparent',
                color: activeType === 'all' ? '#fff' : 'var(--text-secondary-color)',
                border: '1.5px solid var(--primary-color)',
                fontWeight: 'bold',
                px: 2,
              }}
            />
            {getActiveTypes().map(type => (
              <Chip
                key={type.id}
                label={type.name}
                onClick={() => setActiveType(type.name)}
                sx={{
                  backgroundColor:
                    activeType === type.name
                      ? getTypeColor(type.name)
                      : 'transparent',
                  color:
                    activeType === type.name ? '#fff' : getTypeColor(type.name),
                  border: `1.5px solid ${getTypeColor(type.name)}`,
                  fontWeight: 'bold',
                  px: 2,
                }}
              />
            ))}
          </Box>
        </Box>

        {/* 주요 컨텐츠 영역 */}
        <Box sx={{ flex: 1, p: { xs: 1, sm: 2 } }}>
          {/* 달력 상단: 이전/다음/오늘 버튼 + 날짜/뷰모드 표시 */}
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              mb: 2,
              gap: 2,
              flexWrap: 'wrap',
            }}
          >
            <Button
              variant="outlined"
              size="small"
              startIcon={<ChevronLeftIcon />}
              onClick={handleBack}
              sx={{ borderColor: 'var(--primary-color)', color: 'var(--primary-color)' }}
            >
              {viewMode === 0 ? '전달' : viewMode === 1 ? '전주' : '전날'}
            </Button>
            <Button
              variant="outlined"
              size="small"
              onClick={() => setCurrentDate(new Date())}
              sx={{ borderColor: 'var(--primary-color)', color: 'var(--primary-color)' }}
            >
              오늘
            </Button>
            <Button
              variant="outlined"
              size="small"
              endIcon={<ChevronRightIcon />}
              onClick={handleNext}
              sx={{ borderColor: 'var(--primary-color)', color: 'var(--primary-color)' }}
            >
              {viewMode === 0 ? '다음달' : viewMode === 1 ? '다음주' : '다음날'}
            </Button>
            <Typography
              variant="h6"
              sx={{
                ml: 2,
                flex: 1,
                color: 'var(--text-color)',
                fontWeight: 'bold',
                fontSize: { xs: 18, sm: 22 },
              }}
            >
              {viewMode === 0 &&
                `${currentDate.getFullYear()}년 ${currentDate.getMonth() + 1}월 (월간)`}
              {viewMode === 1 &&
                `${currentDate.getFullYear()}년 ${currentDate.getMonth() + 1}월 ${currentDate.getDate()}일 (주간)`}
              {viewMode === 2 &&
                `${currentDate.getFullYear()}년 ${currentDate.getMonth() + 1}월 ${currentDate.getDate()}일 (일간)`}
            </Typography>
          </Box>

          {/* 뷰 선택 탭 */}
          <Box sx={{ mb: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'wrap' }}>
              <Tabs
                value={viewMode}
                onChange={(e, newValue) => setViewMode(newValue)}
                sx={{
                  '& .MuiTab-root': {
                    color: 'var(--text-color)',
                    fontSize: { xs: '1rem', sm: '1.1rem' },
                    fontWeight: 'bold',
                    '&.Mui-selected': { color: 'var(--primary-color)' },
                  },
                  '& .MuiTabs-indicator': { backgroundColor: 'var(--primary-color)' },
                }}
              >
                <Tab label="월간" />
                <Tab label="주간" />
                <Tab label="일간" />
              </Tabs>
              
              {/* 새일정 버튼 - 일간 뷰에서는 우측에 배치 */}
              <Box sx={{ 
                display: 'flex', 
                alignItems: 'center',
                ml: { xs: 'auto', sm: 'auto', md: viewMode === 2 ? 'auto' : 0 }
              }}>
                <Button
                  variant="contained"
                  color="primary"
                  startIcon={<AddIcon />}
                  onClick={() => {
                    setIsPeriodMode(false);
                    setEventDialogOpen(true);
                  }}
                  sx={{
                    backgroundColor: 'var(--primary-color)',
                    fontSize: { xs: '0.75rem', sm: '0.875rem', md: '0.875rem' },
                    px: { xs: 1, sm: 1.5, md: 2 },
                    py: { xs: 0.5, sm: 0.75, md: 1 },
                    minWidth: { xs: 'auto', sm: 'auto' },
                    display: 'inline-flex',
                    '& .MuiButton-startIcon': {
                      marginRight: { xs: 0.5, sm: 0.75, md: 1 },
                    },
                  }}
                >
                  새 일정
                </Button>
              </Box>
            </Box>
          </Box>

          {/* 스케줄 뷰 */}
          {viewMode === 0 && renderMonthView()}
          {viewMode === 1 && renderWeekView()}
          {viewMode === 2 && renderDayView()}
        </Box>

        {/* 일정 추가/편집 다이얼로그 */}
        <Dialog
          open={eventDialogOpen}
          onClose={() => setEventDialogOpen(false)}
          maxWidth="md"
          fullWidth
          fullScreen={isMobile}
          PaperProps={{
            sx: {
              background: '#1e2634',
              color: '#e0e6ed',
              borderRadius: { xs: 0, md: 3 },
              boxShadow: '0 20px 60px rgba(64, 196, 255, 0.2)',
              border: '1px solid #2e3a4a',
              maxHeight: { xs: '100vh', md: '95vh' },
              overflow: 'hidden',
              display: 'flex',
              flexDirection: 'column',
              width: { xs: '100vw', md: '70vw' },
              m: 0,
            },
          }}
        >
          <DialogTitle
            sx={{
              background: 'linear-gradient(135deg, #1e2634 0%, #2e3a4a 100%)',
              color: '#40c4ff',
              fontWeight: 'bold',
              fontSize: { xs: '1.1rem', sm: '1.3rem' },
              textAlign: 'center',
              borderBottom: '2px solid #2e3a4a',
              py: { xs: 2, sm: 2.5 },
              px: { xs: 2, sm: 3 },
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 1,
              position: 'relative',
            }}
          >
            {isMobile && (
              <IconButton
                onClick={() => setEventDialogOpen(false)}
                sx={{
                  position: 'absolute',
                  left: 8,
                  color: '#40c4ff',
                  '&:hover': { backgroundColor: 'rgba(64, 196, 255, 0.1)' },
                }}
              >
                <ArrowBackIcon />
              </IconButton>
            )}
            <EventIcon sx={{ fontSize: { xs: 20, sm: 24 } }} />새 일정 등록
          </DialogTitle>
          <DialogContent
            sx={{
              pt: { xs: 3, sm: 4 }, // padding-top을 더 크게
              pb: 0,
              px: { xs: 2, sm: 3 },
              flex: 1,
              overflowY: 'auto',
            }}
          >
            <Grid container spacing={2}>
              {/* 제목 필드 */}
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="제목"
                  value={newEvent.title}
                  onChange={e =>
                    setNewEvent(prev => ({ ...prev, title: e.target.value }))
                  }
                  placeholder="일정 제목을 입력하세요"
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <EventIcon sx={{ fontSize: 18, color: '#40c4ff' }} />
                      </InputAdornment>
                    ),
                    sx: {
                      borderRadius: 2,
                      background: '#232a36',
                      border: '1px solid #2e3a4a',
                      color: '#e0e6ed',
                    },
                  }}
                  sx={{ mb: 2, mt: { xs: 1, sm: 2 } }} // 위쪽 margin 추가
                />
              </Grid>

              {/* 일정 기간 설정 */}
              <Grid item xs={12}>
                <Box sx={{ mb: 2 }}>
                  <FormControlLabel
                    control={
                      <Checkbox
                        checked={isPeriodMode}
                        onChange={e => {
                          const checked = e.target.checked;
                          setIsPeriodMode(checked);

                          if (checked) {
                            // 기간 설정 활성화
                            setNewEvent(prev => ({
                              ...prev,
                              endDate: prev.startDate || prev.date,
                            }));
                          } else {
                            // 기간 설정 비활성화
                            setNewEvent(prev => ({
                              ...prev,
                              endDate: undefined,
                            }));
                          }
                        }}
                        sx={{
                          color: '#40c4ff',
                          '&.Mui-checked': { color: '#40c4ff' },
                        }}
                      />
                    }
                    label={
                      <Typography
                        sx={{
                          color: '#e0e6ed',
                          fontWeight: 500,
                          fontSize: '0.95rem',
                        }}
                      >
                        📅 기간 설정 (시작일~종료일)
                      </Typography>
                    }
                  />
                </Box>

                <Stack
                  direction={{ xs: 'column', sm: 'row' }}
                  spacing={2}
                  alignItems="flex-start"
                >
                  {/* 시작일/일자 */}
                  <Box sx={{ flex: 1 }}>
                    <TextField
                      fullWidth
                      label={isPeriodMode ? '시작일' : '일자'}
                      type="date"
                      value={newEvent.startDate || newEvent.date}
                      onChange={e =>
                        setNewEvent(prev => ({
                          ...prev,
                          startDate: e.target.value,
                          date: e.target.value,
                          // 기간 설정이 아닌 경우 종료일도 동일하게 설정
                          ...(isPeriodMode ? {} : { endDate: e.target.value }),
                        }))
                      }
                      InputLabelProps={{ shrink: true }}
                      InputProps={{
                        sx: {
                          borderRadius: 2,
                          background: '#232a36',
                          border: '1px solid #2e3a4a',
                          color: '#e0e6ed',
                        },
                        onClick: (e) => {
                          const input = e.currentTarget.querySelector('input');
                          if (input) {
                            if (input.showPicker) {
                              input.showPicker();
                            } else {
                              input.click();
                            }
                          }
                        },
                      }}
                      sx={{
                        '& .MuiInputBase-root': {
                          cursor: 'pointer',
                        },
                      }}
                    />
                    <TextField
                      fullWidth
                      label="시작 시간"
                      type="time"
                      value={newEvent.time}
                      onChange={e =>
                        setNewEvent(prev => ({ ...prev, time: e.target.value }))
                      }
                      InputLabelProps={{ shrink: true }}
                      InputProps={{
                        sx: {
                          borderRadius: 2,
                          background: '#232a36',
                          border: '1px solid #2e3a4a',
                          color: '#e0e6ed',
                          mt: 1,
                        },
                        onClick: (e) => {
                          const input = e.currentTarget.querySelector('input');
                          if (input) {
                            if (input.showPicker) {
                              input.showPicker();
                            } else {
                              input.click();
                            }
                          }
                        },
                      }}
                      sx={{
                        '& .MuiInputBase-root': {
                          cursor: 'pointer',
                        },
                      }}
                    />
                  </Box>

                  {/* 기간 설정 시에만 표시되는 구분선과 종료일 */}
                  {isPeriodMode && (
                    <>
                      <Box
                        sx={{
                          color: '#40c4ff',
                          fontWeight: 600,
                          px: 2,
                          py: 1,
                          display: 'flex',
                          alignItems: 'center',
                          fontSize: '1.2rem',
                        }}
                      >
                        →
                      </Box>
                      <Box sx={{ flex: 1 }}>
                        <TextField
                          fullWidth
                          label="종료일"
                          type="date"
                          value={newEvent.endDate}
                          onChange={e =>
                            setNewEvent(prev => ({
                              ...prev,
                              endDate: e.target.value,
                            }))
                          }
                          InputLabelProps={{ shrink: true }}
                          InputProps={{
                            sx: {
                              borderRadius: 2,
                              background: '#232a36',
                              border: '1px solid #2e3a4a',
                              color: '#e0e6ed',
                            },
                            onClick: (e) => {
                              const input = e.currentTarget.querySelector('input');
                              if (input) {
                                if (input.showPicker) {
                                  input.showPicker();
                                } else {
                                  input.click();
                                }
                              }
                            },
                          }}
                          sx={{
                            '& .MuiInputBase-root': {
                              cursor: 'pointer',
                            },
                          }}
                        />
                        <TextField
                          fullWidth
                          label="종료 시간"
                          type="time"
                          value={newEvent.endTime || newEvent.time}
                          onChange={e =>
                            setNewEvent(prev => ({
                              ...prev,
                              endTime: e.target.value,
                            }))
                          }
                          InputLabelProps={{ shrink: true }}
                          InputProps={{
                            sx: {
                              borderRadius: 2,
                              background: '#232a36',
                              border: '1px solid #2e3a4a',
                              color: '#e0e6ed',
                              mt: 1,
                            },
                            onClick: (e) => {
                              const input = e.currentTarget.querySelector('input');
                              if (input) {
                                if (input.showPicker) {
                                  input.showPicker();
                                } else {
                                  input.click();
                                }
                              }
                            },
                          }}
                          sx={{
                            '& .MuiInputBase-root': {
                              cursor: 'pointer',
                            },
                          }}
                        />
                      </Box>
                    </>
                  )}
                </Stack>
              </Grid>

              {/* 타입/반복 한 행에 표시 */}
              <Grid item xs={12}>
                <Stack
                  direction={{ xs: 'column', sm: 'row' }}
                  spacing={2}
                  alignItems="center"
                >
                  <FormControl fullWidth>
                    <InputLabel
                      sx={{
                        color: '#b0b8c1',
                        fontWeight: '500',
                        fontSize: '0.9rem',
                      }}
                    >
                      타입
                    </InputLabel>
                    <Select
                      value={newEvent.type || '매장상담'}
                      onChange={e => {
                        const newType = e.target.value as string;
                        setNewEvent(prev => {
                          // 실측이나 시공이 아닌 타입으로 변경되면 고객 정보 초기화
                          const shouldClearCustomerInfo = ![
                            '실측',
                            '시공',
                          ].includes(newType);
                          return {
                            ...prev,
                            type: newType,
                            ...(shouldClearCustomerInfo && {
                              customerName: '',
                              contact: '',
                              address: '',
                            }),
                          };
                        });
                      }}
                      label="타입"
                      sx={{
                        borderRadius: 2,
                        background: '#232a36',
                        border: '1px solid #2e3a4a',
                        color: '#e0e6ed',
                      }}
                    >
                      {getActiveTypes().map(type => (
                        <MenuItem
                          key={type.id}
                          value={type.name}
                          sx={{ color: '#fff', fontWeight: 500 }}
                        >
                          <Box display="flex" alignItems="center" gap={1.5}>
                            <Box
                              sx={{
                                width: 20,
                                height: 20,
                                borderRadius: '50%',
                                backgroundColor: type.color,
                                border: '2px solid #fff',
                              }}
                            />
                            <Typography
                              sx={{
                                fontWeight: '500',
                                color: '#fff',
                                fontSize: '0.9rem',
                              }}
                            >
                              {type.name}
                            </Typography>
                          </Box>
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                  <FormControl fullWidth>
                    <InputLabel
                      sx={{
                        color: '#b0b8c1',
                        fontWeight: '500',
                        fontSize: '0.9rem',
                      }}
                    >
                      반복
                    </InputLabel>
                    <Select
                      value={newEvent.repeatPattern || 'none'}
                      onChange={e =>
                        setNewEvent(prev => ({
                          ...prev,
                          repeatPattern: e.target.value as any,
                        }))
                      }
                      label="반복"
                      sx={{
                        borderRadius: 2,
                        background: '#232a36',
                        border: '1px solid #2e3a4a',
                        color: '#e0e6ed',
                      }}
                    >
                      <MenuItem value="none">반복 없음</MenuItem>
                      <MenuItem value="daily">매일</MenuItem>
                      <MenuItem value="weekly">매주</MenuItem>
                      <MenuItem value="monthly">매월</MenuItem>
                      <MenuItem value="yearly">매년</MenuItem>
                    </Select>
                  </FormControl>
                </Stack>
              </Grid>

              {/* 고객명/연락처/주소 - 실측, 시공일 때만 표시 */}
              {(newEvent.type === '실측' || newEvent.type === '시공') && (
                <>
                  <Grid item xs={12}>
                    <Stack
                      direction={{ xs: 'column', sm: 'row' }}
                      spacing={2}
                      alignItems="center"
                    >
                      <TextField
                        fullWidth
                        label="고객명"
                        value={newEvent.customerName || ''}
                        onChange={e =>
                          setNewEvent(prev => ({
                            ...prev,
                            customerName: e.target.value,
                          }))
                        }
                        placeholder="고객명을 입력하세요"
                        InputProps={{
                          sx: {
                            borderRadius: 2,
                            background: '#232a36',
                            border: '1px solid #2e3a4a',
                            color: '#e0e6ed',
                          },
                        }}
                      />
                      <TextField
                        fullWidth
                        label="연락처"
                        value={newEvent.contact || ''}
                        onChange={e =>
                          setNewEvent(prev => ({
                            ...prev,
                            contact: e.target.value,
                          }))
                        }
                        placeholder="연락처를 입력하세요"
                        InputProps={{
                          sx: {
                            borderRadius: 2,
                            background: '#232a36',
                            border: '1px solid #2e3a4a',
                            color: '#e0e6ed',
                          },
                        }}
                      />
                    </Stack>
                  </Grid>

                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      label="주소"
                      value={newEvent.address || ''}
                      onChange={e =>
                        setNewEvent(prev => ({
                          ...prev,
                          address: e.target.value,
                        }))
                      }
                      placeholder="주소를 입력하세요"
                      InputProps={{
                        sx: {
                          borderRadius: 2,
                          background: '#232a36',
                          border: '1px solid #2e3a4a',
                          color: '#e0e6ed',
                        },
                      }}
                    />
                  </Grid>
                </>
              )}
              {/* 메모(설명) 입력란 복원 */}
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="메모"
                  value={newEvent.description || ''}
                  onChange={e =>
                    setNewEvent(prev => ({
                      ...prev,
                      description: e.target.value,
                    }))
                  }
                  placeholder="메모를 입력하세요"
                  multiline
                  minRows={2}
                  maxRows={5}
                  InputProps={{
                    sx: {
                      borderRadius: 2,
                      background: '#232a36',
                      border: '1px solid #2e3a4a',
                      color: '#e0e6ed',
                    },
                  }}
                />
              </Grid>

              {/* 첨부파일 등 추가 옵션이 있다면 여기에 배치 */}
              {/* ... */}
            </Grid>
          </DialogContent>

          {/* ERP 스타일 하단 버튼 */}
          <DialogActions
            sx={{
              background: '#1e2634',
              borderTop: '1px solid #2e3a4a',
              p: 2.5,
              justifyContent: 'space-between',
              gap: 2,
            }}
          >
            <Button
              onClick={() => setEventDialogOpen(false)}
              variant="outlined"
              sx={{
                color: '#b0b8c1',
                borderColor: '#2e3a4a',
                fontWeight: '500',
                px: 3,
                py: 1,
                '&:hover': {
                  borderColor: '#40c4ff',
                  color: '#40c4ff',
                  backgroundColor: 'rgba(64, 196, 255, 0.05)',
                  transition: 'all 0.3s ease',
                },
              }}
            >
              취소
            </Button>
            <Button
              onClick={handleSaveEvent}
              variant="contained"
              sx={{
                backgroundColor: '#40c4ff',
                color: '#fff',
                fontWeight: '500',
                px: 4,
                py: 1,
                boxShadow: '0 4px 12px rgba(64, 196, 255, 0.3)',
                '&:hover': {
                  backgroundColor: '#2196f3',
                  boxShadow: '0 6px 16px rgba(64, 196, 255, 0.4)',
                  transform: 'translateY(-1px)',
                  transition: 'all 0.3s ease',
                },
              }}
            >
              저장
            </Button>
          </DialogActions>
        </Dialog>

        {/* 1년 일정 다이얼로그 */}
        <Dialog
          open={yearlyEventDialogOpen}
          onClose={() => setYearlyEventDialogOpen(false)}
          maxWidth="md"
          fullWidth
          fullScreen={isMobile}
          PaperProps={{
            sx: {
              backgroundColor: '#232a36',
              color: '#e0e6ed',
              borderRadius: { xs: 0, md: 3 },
              boxShadow: '0 20px 60px rgba(64, 196, 255, 0.2)',
              border: '1px solid #2e3a4a',
              maxHeight: { xs: '100vh', md: '95vh' },
              overflow: 'hidden',
              display: 'flex',
              flexDirection: 'column',
              width: { xs: '100vw', md: '70vw' },
              m: 0,
            },
          }}
        >
          <DialogTitle 
            sx={{ 
              borderBottom: 1, 
              borderColor: '#2e3a4a',
              background: 'linear-gradient(135deg, #1e2634 0%, #2e3a4a 100%)',
              color: '#40c4ff',
              fontWeight: 'bold',
              fontSize: { xs: '1.1rem', sm: '1.3rem' },
              textAlign: 'center',
              py: { xs: 2, sm: 2.5 },
              px: { xs: 2, sm: 3 },
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 1,
              position: 'relative',
            }}
          >
            {isMobile && (
              <IconButton
                onClick={() => setYearlyEventDialogOpen(false)}
                sx={{
                  position: 'absolute',
                  left: 8,
                  color: '#40c4ff',
                  '&:hover': { backgroundColor: 'rgba(64, 196, 255, 0.1)' },
                }}
              >
                <ArrowBackIcon />
              </IconButton>
            )}
            📅 1년 일정 관리
          </DialogTitle>
          <DialogContent sx={{ 
            pt: { xs: 3, sm: 2 }, 
            pb: 0,
            px: { xs: 2, sm: 3 },
            flex: 1,
            overflowY: 'auto',
          }}>
            <Grid container spacing={{ xs: 2, sm: 2 }}>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="제목"
                  value={yearlyEvent.title}
                  onChange={e =>
                    setYearlyEvent(prev => ({ ...prev, title: e.target.value }))
                  }
                  sx={{ 
                    mb: 2,
                    '& .MuiInputBase-root': {
                      height: { xs: 56, sm: 48 },
                      fontSize: { xs: '1rem', sm: '0.875rem' },
                    },
                  }}
                  InputLabelProps={{ 
                    shrink: true,
                    sx: { fontSize: { xs: '1rem', sm: '0.875rem' } }
                  }}
                />
              </Grid>
              <Grid item xs={12} sm={3}>
                <TextField
                  fullWidth
                  label="월"
                  type="number"
                  value={yearlyEvent.month}
                  onChange={e =>
                    setYearlyEvent(prev => ({
                      ...prev,
                      month: parseInt(e.target.value),
                    }))
                  }
                  inputProps={{ min: 1, max: 12 }}
                  sx={{ 
                    mb: 2,
                    '& .MuiInputBase-root': {
                      height: { xs: 56, sm: 48 },
                      fontSize: { xs: '1rem', sm: '0.875rem' },
                    },
                  }}
                  InputLabelProps={{ 
                    shrink: true,
                    sx: { fontSize: { xs: '1rem', sm: '0.875rem' } }
                  }}
                />
              </Grid>
              <Grid item xs={12} sm={3}>
                <TextField
                  fullWidth
                  label="일"
                  type="number"
                  value={yearlyEvent.day}
                  onChange={e =>
                    setYearlyEvent(prev => ({
                      ...prev,
                      day: parseInt(e.target.value),
                    }))
                  }
                  inputProps={{ min: 1, max: 31 }}
                  sx={{ 
                    mb: 2,
                    '& .MuiInputBase-root': {
                      height: { xs: 56, sm: 48 },
                      fontSize: { xs: '1rem', sm: '0.875rem' },
                    },
                  }}
                  InputLabelProps={{ 
                    shrink: true,
                    sx: { fontSize: { xs: '1rem', sm: '0.875rem' } }
                  }}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="시간"
                  type="time"
                  value={yearlyEvent.time}
                  onChange={e =>
                    setYearlyEvent(prev => ({ ...prev, time: e.target.value }))
                  }
                  InputLabelProps={{ 
                    shrink: true,
                    sx: { fontSize: { xs: '1rem', sm: '0.875rem' } }
                  }}
                  sx={{ 
                    mb: 2,
                    '& .MuiInputBase-root': {
                      height: { xs: 56, sm: 48 },
                      fontSize: { xs: '1rem', sm: '0.875rem' },
                    },
                  }}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth sx={{ 
                  mb: 2,
                  '& .MuiInputBase-root': {
                    height: { xs: 56, sm: 48 },
                    fontSize: { xs: '1rem', sm: '0.875rem' },
                  },
                }}>
                  <InputLabel sx={{ fontSize: { xs: '1rem', sm: '0.875rem' } }}>우선순위</InputLabel>
                  <Select
                    value={yearlyEvent.priority}
                    onChange={e =>
                      setYearlyEvent(prev => ({
                        ...prev,
                        priority: e.target.value as any,
                      }))
                    }
                    label="우선순위"
                  >
                    <MenuItem value="낮음">낮음</MenuItem>
                    <MenuItem value="보통">보통</MenuItem>
                    <MenuItem value="높음">높음</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12}>
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={yearlyEvent.isLunar}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                        setYearlyEvent(prev => ({
                          ...prev,
                          isLunar: e.target.checked,
                        }))
                      }
                      sx={{
                        '& .MuiSvgIcon-root': {
                          fontSize: { xs: 24, sm: 20 },
                        },
                      }}
                    />
                  }
                  label={
                    <Typography sx={{ 
                      fontSize: { xs: '1rem', sm: '0.875rem' },
                      color: '#e0e6ed',
                    }}>
                      음력
                    </Typography>
                  }
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="설명"
                  multiline
                  rows={isMobile ? 4 : 3}
                  value={yearlyEvent.description || ''}
                  onChange={e =>
                    setYearlyEvent(prev => ({
                      ...prev,
                      description: e.target.value,
                    }))
                  }
                  sx={{ 
                    mb: 2,
                    '& .MuiInputBase-root': {
                      fontSize: { xs: '1rem', sm: '0.875rem' },
                    },
                  }}
                  InputLabelProps={{ 
                    shrink: true,
                    sx: { fontSize: { xs: '1rem', sm: '0.875rem' } }
                  }}
                />
              </Grid>
            </Grid>
          </DialogContent>
          <DialogActions sx={{ 
            borderTop: 1, 
            borderColor: '#2e3a4a', 
            p: { xs: 2, sm: 2 },
            gap: { xs: 1, sm: 1 },
            flexDirection: { xs: 'column', sm: 'row' },
            '& .MuiButton-root': {
              minWidth: { xs: '100%', sm: 'auto' },
              height: { xs: 48, sm: 36 },
              fontSize: { xs: '1rem', sm: '0.875rem' },
              fontWeight: 500,
            },
          }}>
            <Button
              onClick={() => setYearlyEventDialogOpen(false)}
              sx={{ 
                color: '#e0e6ed',
                border: '1px solid #2e3a4a',
                '&:hover': {
                  backgroundColor: 'rgba(224, 230, 237, 0.1)',
                },
              }}
            >
              취소
            </Button>
            <Button
              onClick={handleYearlyEventSave}
              variant="contained"
              sx={{ 
                backgroundColor: '#40c4ff',
                '&:hover': {
                  backgroundColor: '#2196f3',
                  boxShadow: '0 6px 16px rgba(64, 196, 255, 0.4)',
                  transform: 'translateY(-1px)',
                  transition: 'all 0.3s ease',
                },
              }}
            >
              저장
            </Button>
          </DialogActions>
        </Dialog>

        {/* 필터 관리 다이얼로그 - 삭제됨 */}
        {/* 
        <Dialog
          open={filterDialogOpen}
          onClose={() => setFilterDialogOpen(false)}
          maxWidth="md"
          fullWidth
          PaperProps={{
            sx: {
              backgroundColor: '#232a36',
              color: '#e0e6ed'
            }
          }}
        >
          <DialogTitle sx={{ borderBottom: 1, borderColor: '#2e3a4a' }}>
            필터 관리
          </DialogTitle>
          <DialogContent sx={{ pt: 2 }}>
            <Box sx={{ mb: 2 }}>
              <Typography variant="h6" sx={{ mb: 1 }}>기본 필터</Typography>
              {filters.filter(f => f.isDefault).map((filter) => (
                <Chip
                  key={filter.id}
                  label={filter.name}
                  sx={{
                    backgroundColor: activeFilters.includes(filter.id) ? filter.color : 'transparent',
                    color: activeFilters.includes(filter.id) ? '#fff' : filter.color,
                    border: `1px solid ${filter.color}`,
                    m: 0.5
                  }}
                />
              ))}
            </Box>
            <Box>
              <Typography variant="h6" sx={{ mb: 1 }}>사용자 필터</Typography>
              {filters.filter(f => !f.isDefault).map((filter) => (
                <Box key={filter.id} sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                  <Chip
                    label={filter.name}
                    sx={{
                      backgroundColor: activeFilters.includes(filter.id) ? filter.color : 'transparent',
                      color: activeFilters.includes(filter.id) ? '#fff' : filter.color,
                      border: `1px solid ${filter.color}`,
                      mr: 1
                    }}
                  />
                  <IconButton
                    size="small"
                    onClick={() => handleFilterDelete(filter.id)}
                    sx={{ color: '#ff6b6b' }}
                  >
                    <DeleteIcon />
                  </IconButton>
                </Box>
              ))}
            </Box>
          </DialogContent>
          <DialogActions sx={{ borderTop: 1, borderColor: '#2e3a4a', p: 2 }}>
            <Button onClick={() => setFilterDialogOpen(false)} sx={{ color: '#e0e6ed' }}>
              닫기
            </Button>
          </DialogActions>
        </Dialog>

        {/* 통계 다이얼로그 */}
        <Dialog
          open={statsDialogOpen}
          onClose={() => setStatsDialogOpen(false)}
          maxWidth="md"
          fullWidth
          PaperProps={{
            sx: {
              backgroundColor: '#232a36',
              color: '#e0e6ed',
            },
          }}
        >
          <DialogTitle sx={{ borderBottom: 1, borderColor: '#2e3a4a' }}>
            스케줄 통계
          </DialogTitle>
          <DialogContent sx={{ pt: 2 }}>
            <Grid container spacing={2}>
              <Grid item xs={6} sm={3}>
                <Box
                  sx={{
                    textAlign: 'center',
                    p: 2,
                    border: 1,
                    borderColor: '#2e3a4a',
                    borderRadius: 1,
                  }}
                >
                  <Typography variant="h4" sx={{ color: '#40c4ff' }}>
                    {stats.totalEvents}
                  </Typography>
                  <Typography variant="body2">전체 일정</Typography>
                </Box>
              </Grid>
              <Grid item xs={6} sm={3}>
                <Box
                  sx={{
                    textAlign: 'center',
                    p: 2,
                    border: 1,
                    borderColor: '#2e3a4a',
                    borderRadius: 1,
                  }}
                >
                  <Typography variant="h4" sx={{ color: '#4caf50' }}>
                    {stats.completedEvents}
                  </Typography>
                  <Typography variant="body2">완료</Typography>
                </Box>
              </Grid>
              <Grid item xs={6} sm={3}>
                <Box
                  sx={{
                    textAlign: 'center',
                    p: 2,
                    border: 1,
                    borderColor: '#2e3a4a',
                    borderRadius: 1,
                  }}
                >
                  <Typography variant="h4" sx={{ color: '#ff9800' }}>
                    {stats.pendingEvents}
                  </Typography>
                  <Typography variant="body2">예정</Typography>
                </Box>
              </Grid>
              <Grid item xs={6} sm={3}>
                <Box
                  sx={{
                    textAlign: 'center',
                    p: 2,
                    border: 1,
                    borderColor: '#2e3a4a',
                    borderRadius: 1,
                  }}
                >
                  <Typography variant="h4" sx={{ color: '#f44336' }}>
                    {stats.cancelledEvents}
                  </Typography>
                  <Typography variant="body2">취소</Typography>
                </Box>
              </Grid>
            </Grid>
          </DialogContent>
          <DialogActions sx={{ borderTop: 1, borderColor: '#2e3a4a', p: 2 }}>
            <Button
              onClick={() => setStatsDialogOpen(false)}
              sx={{ color: '#e0e6ed' }}
            >
              닫기
            </Button>
          </DialogActions>
        </Dialog>

        {/* 스낵바 */}
        <Snackbar
          open={snackbar.open}
          autoHideDuration={6000}
          onClose={() => setSnackbar({ ...snackbar, open: false })}
        >
          <Alert
            onClose={() => setSnackbar({ ...snackbar, open: false })}
            severity={snackbar.severity}
            sx={{ width: '100%' }}
          >
            {snackbar.message}
          </Alert>
        </Snackbar>

        {/* 일정 목록/상세 다이얼로그 */}
        <Dialog
          open={detailDialogOpen}
          onClose={() => setDetailDialogOpen(false)}
          maxWidth="md"
          fullWidth
          fullScreen={isMobile}
          PaperProps={{
            sx: {
              backgroundColor: '#232a36',
              color: '#e0e6ed',
              borderRadius: { xs: 0, md: 3 },
              boxShadow: '0 20px 60px rgba(64, 196, 255, 0.2)',
              border: '1px solid #2e3a4a',
              maxHeight: { xs: '100vh', md: '95vh' },
              overflow: 'hidden',
              display: 'flex',
              flexDirection: 'column',
              width: { xs: '100vw', md: '70vw' },
              m: 0,
            },
          }}
        >
          <DialogTitle
            sx={{
              borderBottom: 1,
              borderColor: '#2e3a4a',
              display: 'flex',
              alignItems: 'center',
              gap: 2,
              background: 'linear-gradient(135deg, #1e2634 0%, #2e3a4a 100%)',
              color: '#40c4ff',
              fontWeight: 'bold',
              fontSize: { xs: '1.1rem', sm: '1.3rem' },
              textAlign: 'center',
              py: { xs: 2, sm: 2.5 },
              px: { xs: 2, sm: 3 },
              position: 'relative',
              justifyContent: 'center',
            }}
          >
            {isMobile && (
              <IconButton
                onClick={() => setDetailDialogOpen(false)}
                sx={{
                  position: 'absolute',
                  left: 8,
                  color: '#40c4ff',
                  '&:hover': { backgroundColor: 'rgba(64, 196, 255, 0.1)' },
                }}
              >
                <ArrowBackIcon />
              </IconButton>
            )}
            {selectedEvents.length === 1 ? (
              <>
                {!isMobile && (
                  <IconButton
                    onClick={() => {
                      // 일정 목록으로 돌아가기
                      const eventsForDate = selectedDate
                        ? getEventsForDateLocal(selectedDate)
                        : [];
                      setSelectedEvents(eventsForDate);
                    }}
                    sx={{
                      color: '#40c4ff',
                      '&:hover': { backgroundColor: 'rgba(64, 196, 255, 0.1)' },
                    }}
                  >
                    <ChevronLeftIcon />
                  </IconButton>
                )}
                <Typography variant="h6" sx={{ flex: 1 }}>
                  {selectedEvents[0].title}
                </Typography>
              </>
            ) : (
              <Typography variant="h6" sx={{ flex: 1 }}>
                {selectedDate
                  ? `${selectedDate.getFullYear()}년 ${selectedDate.getMonth() + 1}월 ${selectedDate.getDate()}일 일정`
                  : '일정 목록'}
              </Typography>
            )}
          </DialogTitle>
          <DialogContent
            sx={{
              pt: { xs: 3, sm: 2 },
              pb: 0,
              px: { xs: 2, sm: 3 },
              flex: 1,
              overflowY: 'auto',
            }}
          >
            {selectedEvents.length > 1 ? (
              <Box>
                <Typography
                  variant="subtitle1"
                  sx={{ mb: 2, color: '#40c4ff' }}
                >
                  총 {selectedEvents.length}개의 일정이 있습니다. 확인할 일정을
                  선택하세요.
                </Typography>
                <List>
                  {selectedEvents.map((event, idx) => (
                    <ListItem
                      key={event.id}
                      sx={{
                        mb: 1,
                        backgroundColor: '#1e2634',
                        borderRadius: 1,
                        border: `2px solid ${event.color || getEventColor(event.type)}`,
                        cursor: 'pointer',
                        '&:hover': {
                          backgroundColor: '#2e3a4a',
                        },
                      }}
                      onClick={() => {
                        setSelectedEvents([event]);
                      }}
                    >
                      <ListItemIcon>
                        {event.type === '시공' && (
                          <BuildIcon
                            sx={{
                              color: event.color || getEventColor(event.type),
                            }}
                          />
                        )}
                        {event.type === 'AS' && (
                          <SupportIcon
                            sx={{
                              color: event.color || getEventColor(event.type),
                            }}
                          />
                        )}
                        {event.type === '실측' && (
                          <DateRangeIcon
                            sx={{
                              color: event.color || getEventColor(event.type),
                            }}
                          />
                        )}
                        {event.type === '매장상담' && (
                          <BusinessIcon
                            sx={{
                              color: event.color || getEventColor(event.type),
                            }}
                          />
                        )}
                        {event.type === '개인' && (
                          <PersonIcon
                            sx={{
                              color: event.color || getEventColor(event.type),
                            }}
                          />
                        )}
                        {event.type === '병원' && (
                          <EventIcon
                            sx={{
                              color: event.color || getEventColor(event.type),
                            }}
                          />
                        )}
                        {event.type === '여행' && (
                          <EventIcon
                            sx={{
                              color: event.color || getEventColor(event.type),
                            }}
                          />
                        )}
                      </ListItemIcon>
                      <ListItemText
                        primary={
                          <Box display="flex" alignItems="center" gap={1}>
                            <Typography variant="subtitle1">
                              {event.title}
                            </Typography>
                            <Chip
                              label={event.type}
                              size="small"
                              sx={{
                                backgroundColor:
                                  event.color || getEventColor(event.type),
                              }}
                            />
                            <Chip
                              label={event.priority}
                              size="small"
                              color={
                                event.priority === '높음'
                                  ? 'error'
                                  : event.priority === '보통'
                                    ? 'warning'
                                    : 'default'
                              }
                            />
                          </Box>
                        }
                        secondary={
                          <Typography variant="body2" sx={{ color: '#b0b8c1' }}>
                            {event.time} | {event.customerName || '고객명 없음'}
                          </Typography>
                        }
                      />
                      <Box>
                        <IconButton
                          size="small"
                          onClick={e => {
                            e.stopPropagation();
                            handleEditEvent(event);
                          }}
                        >
                          <EditIcon />
                        </IconButton>
                        <IconButton
                          size="small"
                          onClick={e => {
                            e.stopPropagation();
                            handleDeleteEvent(event.id);
                          }}
                        >
                          <DeleteIcon />
                        </IconButton>
                      </Box>
                    </ListItem>
                  ))}
                </List>
              </Box>
            ) : selectedEvents.length === 1 ? (
              <Box>
                {selectedEvents.map((scheduleEvent, idx) => (
                  <Box key={`${scheduleEvent.id}-${idx}`} sx={{ mb: 3, p: 2, backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 1 }}>
                    <Typography
                      variant="subtitle2"
                      sx={{ color: '#40c4ff', mb: 1 }}
                    >
                      {scheduleEvent.title}
                    </Typography>
                    {/* 날짜 변경 입력란 */}
                    <TextField
                      label="일정 날짜 변경"
                      type="date"
                      value={scheduleEvent.date}
                      onChange={e => {
                        const newDate = e.target.value;
                        const updatedEvent = {
                          ...scheduleEvent,
                          date: newDate,
                          updatedAt: new Date().toISOString(),
                        };
                        setEvents(prev =>
                          prev.map(ev =>
                            ev.id === scheduleEvent.id ? updatedEvent : ev
                          )
                        );
                        const updatedEvents = events.map(ev =>
                          ev.id === scheduleEvent.id ? updatedEvent : ev
                        );
                        localStorage.setItem(
                          'schedules',
                          JSON.stringify(updatedEvents)
                        );
                      }}
                      sx={{ mb: 2, background: '#232a36', borderRadius: 1 }}
                      InputLabelProps={{ shrink: true }}
                      fullWidth
                    />

                    {scheduleEvent.type === '시공' &&
                    scheduleEvent.deliveryId ? (
                      (() => {
                        const delivery = deliveries.find(
                          d => d.id === scheduleEvent.deliveryId
                        );
                        if (!delivery)
                          return (
                            <Typography color="error">
                              납품관리 데이터를 찾을 수 없습니다.
                            </Typography>
                          );
                        return (
                          <Box>
                            {/* 1. 고객정보 */}
                            <Box sx={{ mb: 3 }}>
                              <Typography
                                variant="subtitle2"
                                sx={{
                                  mb: 2,
                                  color: '#40c4ff',
                                  fontWeight: 'bold',
                                }}
                              >
                                👤 고객정보
                              </Typography>
                              <Box
                                sx={{
                                  p: 2,
                                  backgroundColor: '#1e2634',
                                  borderRadius: 1,
                                }}
                              >
                                <Typography
                                  variant="body2"
                                  sx={{ color: '#b0b8c1', mb: 1 }}
                                >
                                  <strong>고객명:</strong>{' '}
                                  {delivery.customerName}
                                </Typography>
                                <Typography
                                  variant="body2"
                                  sx={{ color: '#b0b8c1', mb: 1 }}
                                >
                                  <strong>연락처:</strong>
                                  <a
                                    href={`tel:${delivery.contact?.replace(/[^\d]/g, '')}`}
                                    style={{
                                      color: '#40c4ff',
                                      textDecoration: 'none',
                                      marginLeft: '8px',
                                    }}
                                  >
                                    {delivery.contact}
                                  </a>
                                </Typography>
                                <Typography
                                  variant="body2"
                                  sx={{ color: '#b0b8c1' }}
                                >
                                  <strong>주소:</strong> {delivery.address}
                                </Typography>
                              </Box>
                            </Box>
                            {/* 2. 제품상세정보 표 */}
                            {delivery.items && delivery.items.length > 0 && (
                              <Box sx={{ mb: 3 }}>
                                <Typography
                                  variant="subtitle2"
                                  sx={{
                                    mb: 2,
                                    color: '#40c4ff',
                                    fontWeight: 'bold',
                                  }}
                                >
                                  📋 제품상세정보
                                </Typography>
                                <Box sx={{ overflowX: 'auto' }}>
                                  <Paper
                                    sx={{
                                      backgroundColor: '#1e2634',
                                      borderRadius: 1,
                                    }}
                                  >
                                    <Table size="small">
                                      <TableHead>
                                        <TableRow>
                                          <TableCell
                                            sx={{
                                              color: '#40c4ff',
                                              fontWeight: 'bold',
                                              fontSize: '0.8rem',
                                            }}
                                          >
                                            거래처
                                          </TableCell>
                                          <TableCell
                                            sx={{
                                              color: '#40c4ff',
                                              fontWeight: 'bold',
                                              fontSize: '0.8rem',
                                            }}
                                          >
                                            공간
                                          </TableCell>
                                          <TableCell
                                            sx={{
                                              color: '#40c4ff',
                                              fontWeight: 'bold',
                                              fontSize: '0.8rem',
                                            }}
                                          >
                                            제품코드
                                          </TableCell>
                                          <TableCell
                                            sx={{
                                              color: '#40c4ff',
                                              fontWeight: 'bold',
                                              fontSize: '0.8rem',
                                            }}
                                          >
                                            제작사이즈
                                          </TableCell>
                                          <TableCell
                                            sx={{
                                              color: '#40c4ff',
                                              fontWeight: 'bold',
                                              fontSize: '0.8rem',
                                            }}
                                          >
                                            줄방향
                                          </TableCell>
                                          <TableCell
                                            sx={{
                                              color: '#40c4ff',
                                              fontWeight: 'bold',
                                              fontSize: '0.8rem',
                                            }}
                                          >
                                            줄길이
                                          </TableCell>
                                          <TableCell
                                            sx={{
                                              color: '#40c4ff',
                                              fontWeight: 'bold',
                                              fontSize: '0.8rem',
                                            }}
                                          >
                                            주름양
                                          </TableCell>
                                          <TableCell
                                            sx={{
                                              color: '#40c4ff',
                                              fontWeight: 'bold',
                                              fontSize: '0.8rem',
                                            }}
                                          >
                                            폭수
                                          </TableCell>
                                        </TableRow>
                                      </TableHead>
                                      <TableBody>
                                        {delivery.items.map(
                                          (item: any, idx: number) => (
                                            <TableRow key={idx}>
                                              <TableCell
                                                sx={{
                                                  color: '#b0b8c1',
                                                  fontSize: '0.8rem',
                                                }}
                                              >
                                                {item.vendor || '-'}
                                              </TableCell>
                                              <TableCell
                                                sx={{
                                                  color: '#b0b8c1',
                                                  fontSize: '0.8rem',
                                                }}
                                              >
                                                {item.space || '-'}
                                              </TableCell>
                                              <TableCell
                                                sx={{
                                                  color: '#b0b8c1',
                                                  fontSize: '0.8rem',
                                                }}
                                              >
                                                {item.productCode || '-'}
                                              </TableCell>
                                              <TableCell
                                                sx={{
                                                  color: '#b0b8c1',
                                                  fontSize: '0.8rem',
                                                }}
                                              >
                                                {(item.widthMM ||
                                                  item.width ||
                                                  '-') +
                                                  '*' +
                                                  (item.heightMM ||
                                                    item.height ||
                                                    '-')}
                                              </TableCell>
                                              <TableCell
                                                sx={{
                                                  color: '#b0b8c1',
                                                  fontSize: '0.8rem',
                                                }}
                                              >
                                                {item.lineDirection || '-'}
                                              </TableCell>
                                              <TableCell
                                                sx={{
                                                  color: '#b0b8c1',
                                                  fontSize: '0.8rem',
                                                }}
                                              >
                                                {item.lineLength || '-'}
                                              </TableCell>
                                              <TableCell
                                                sx={{
                                                  color: '#b0b8c1',
                                                  fontSize: '0.8rem',
                                                }}
                                              >
                                                {item.pleatAmount || '-'}
                                              </TableCell>
                                              <TableCell
                                                sx={{
                                                  color: '#b0b8c1',
                                                  fontSize: '0.8rem',
                                                }}
                                              >
                                                {item.widthCount || '-'}
                                              </TableCell>
                                            </TableRow>
                                          )
                                        )}
                                      </TableBody>
                                    </Table>
                                  </Paper>
                                </Box>
                              </Box>
                            )}
                            {/* 3. 레일정보 */}
                            {delivery.railItems &&
                              delivery.railItems.length > 0 && (
                                <Box sx={{ mb: 3 }}>
                                  <Typography
                                    variant="subtitle2"
                                    sx={{
                                      mb: 2,
                                      color: '#40c4ff',
                                      fontWeight: 'bold',
                                    }}
                                  >
                                    🚇 레일정보
                                  </Typography>
                                  <Box
                                    sx={{
                                      p: 2,
                                      backgroundColor: '#1e2634',
                                      borderRadius: 1,
                                    }}
                                  >
                                    {delivery.railItems.map(
                                      (railItem: any, idx: number) => {
                                        const details =
                                          railItem.specification ||
                                          railItem.details ||
                                          '';
                                        const pattern = /(\d+)자\s*(\d+)개/g;
                                        let result: string[] = [];
                                        let match;
                                        while (
                                          (match = pattern.exec(details)) !==
                                          null
                                        ) {
                                          result.push(
                                            `${match[1]}자 ${match[2]}개`
                                          );
                                        }
                                        if (result.length === 0) {
                                          const pattern2 = /(\d+)자/g;
                                          let match2;
                                          while (
                                            (match2 =
                                              pattern2.exec(details)) !== null
                                          ) {
                                            result.push(`${match2[1]}자 1개`);
                                          }
                                        }
                                        return (
                                          <Typography
                                            key={idx}
                                            variant="body2"
                                            sx={{
                                              color: '#b0b8c1',
                                              mb:
                                                idx <
                                                (delivery.railItems?.length ??
                                                  0) -
                                                  1
                                                  ? 1
                                                  : 0,
                                            }}
                                          >
                                            {result.join(', ')}
                                          </Typography>
                                        );
                                      }
                                    )}
                                  </Box>
                                </Box>
                              )}
                            {/* 4. 금액정보 */}
                            <Box sx={{ mb: 3 }}>
                              <Typography
                                variant="subtitle2"
                                sx={{
                                  mb: 2,
                                  color: '#40c4ff',
                                  fontWeight: 'bold',
                                }}
                              >
                                💰 금액정보
                              </Typography>
                              <Box
                                sx={{
                                  p: 2,
                                  backgroundColor: '#1e2634',
                                  borderRadius: 1,
                                }}
                              >
                                <Typography
                                  variant="body2"
                                  sx={{ color: '#b0b8c1', mb: 1 }}
                                >
                                  <strong>할인후금액:</strong>{' '}
                                  {(delivery.finalAmount || 0).toLocaleString()}
                                  원
                                </Typography>
                                <Typography
                                  variant="body2"
                                  sx={{ color: '#b0b8c1', mb: 1 }}
                                >
                                  <strong>현재입금액:</strong>{' '}
                                  {(delivery.paidAmount || 0).toLocaleString()}
                                  원
                                </Typography>
                                <Typography
                                  variant="body2"
                                  sx={{ color: '#b0b8c1' }}
                                >
                                  <strong>잔액:</strong>{' '}
                                  {(
                                    delivery.remainingAmount || 0
                                  ).toLocaleString()}
                                  원
                                </Typography>
                              </Box>
                            </Box>
                            {/* 메모 정보 */}
                            {delivery.memo && (
                              <Box sx={{ mb: 3 }}>
                                <Typography
                                  variant="subtitle2"
                                  sx={{
                                    mb: 2,
                                    color: '#40c4ff',
                                    fontWeight: 'bold',
                                  }}
                                >
                                  📝 메모
                                </Typography>
                                <Box
                                  sx={{
                                    p: 2,
                                    backgroundColor: '#1e2634',
                                    borderRadius: 1,
                                  }}
                                >
                                  <Typography
                                    variant="body2"
                                    sx={{ color: '#b0b8c1' }}
                                  >
                                    {delivery.memo}
                                  </Typography>
                                </Box>
                              </Box>
                            )}
                          </Box>
                        );
                      })()
                    ) : (
                      <>
                        {scheduleEvent.description && (
                          <Typography
                            variant="body2"
                            sx={{
                              color: '#b0b8c1',
                              whiteSpace: 'pre-wrap',
                              p: 2,
                              backgroundColor: '#1e2634',
                              borderRadius: 1,
                              mb: 3,
                            }}
                          >
                            {scheduleEvent.description}
                          </Typography>
                        )}
                        {/* 채팅창 추가 (실측, 시공 제외) */}
                        {scheduleEvent.type !== '실측' &&
                          scheduleEvent.type !== '시공' && (
                            <Box
                              sx={{
                                mt: 3,
                                p: 2,
                                backgroundColor: '#1e2634',
                                borderRadius: 2,
                                border: '1px solid #2e3a4a',
                                maxHeight: 500,
                                overflowY: 'auto',
                              }}
                            >
                              <Typography
                                variant="h6"
                                sx={{ mb: 2, color: '#40c4ff' }}
                              >
                                {scheduleEvent.type} 채팅
                              </Typography>
                              {/* 메시지 목록 */}
                              <Box
                                ref={chatScrollRef}
                                sx={{
                                  maxHeight: { xs: 300, sm: 350 },
                                  overflowY: 'auto',
                                  mb: 2,
                                  scrollBehavior: 'smooth',
                                }}
                              >
                                {scheduleEvent.comments &&
                                scheduleEvent.comments.length > 0 ? (
                                  scheduleEvent.comments.map((comment: any, idx: number) => {
                                    const isMine = comment.userName === nickname;
                                    return (
                                      <Box key={comment.id} sx={{
                                        display: 'flex',
                                        flexDirection: isMine ? 'row-reverse' : 'row',
                                        alignItems: 'flex-start',
                                        mb: 1.5,
                                        gap: 1,
                                      }}>
                                        {/* 아바타 */}
                                        <Avatar
                                          src={isMine && isValidProfileImageUrl(profileImage) ? profileImage : undefined}
                                          sx={{
                                            width: 32,
                                            height: 32,
                                            fontSize: '0.875rem',
                                            bgcolor: isMine ? '#40c4ff' : '#666',
                                            color: '#fff',
                                          }}
                                        >
                                          {isMine ? (isValidProfileImageUrl(profileImage) ? '' : nickname?.charAt(0)?.toUpperCase()) : comment.userName?.charAt(0)?.toUpperCase()}
                                        </Avatar>
                                        
                                        {/* 메시지 컨테이너 */}
                                        <Box sx={{
                                          display: 'flex',
                                          flexDirection: 'column',
                                          alignItems: isMine ? 'flex-end' : 'flex-start',
                                          maxWidth: '70%',
                                        }}>
                                          {/* 사용자 이름 */}
                                          <Typography variant="caption" sx={{
                                            color: '#b0b8c1',
                                            mb: 0.5,
                                            fontSize: '0.75rem',
                                            fontWeight: 500,
                                          }}>
                                            {comment.userName}
                                          </Typography>
                                          
                                          {/* 메시지 버블 */}
                                          <Box sx={{
                                            background: isMine ? '#1a2733' : '#10171e',
                                            color: isMine ? '#fff' : '#e0e6ed',
                                            borderRadius: 3,
                                            boxShadow: '0 2px 8px 0 rgba(0,0,0,0.10)',
                                            px: 1.5, py: 0.7,
                                            fontSize: '1.05rem',
                                            lineHeight: 1.3,
                                            minHeight: '2.1em',
                                            display: 'flex', alignItems: 'center',
                                            wordBreak: 'break-word',
                                          }}>
                                            <Typography variant="body2" sx={{ p: 0, m: 0, fontSize: 'inherit', lineHeight: 'inherit' }}>
                                              {comment.message}
                                            </Typography>
                                          </Box>
                                          
                                          {/* 시간 */}
                                          <Typography variant="caption" sx={{
                                            color: '#b0b8c1',
                                            mt: 0.3,
                                            textAlign: isMine ? 'right' : 'left',
                                            px: 0.5,
                                            fontSize: '0.7rem',
                                          }}>
                                            {new Date(comment.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                          </Typography>
                                        </Box>
                                      </Box>
                                    );
                                  })
                                ) : (
                                  <Typography
                                    variant="body2"
                                    sx={{
                                      color: '#b0b8c1',
                                      textAlign: 'center',
                                      py: 4,
                                    }}
                                  >
                                    아직 메시지가 없습니다.
                                  </Typography>
                                )}
                              </Box>
                              {/* 메시지 입력 */}
                              <Box
                                sx={{
                                  p: 2,
                                  backgroundColor: '#232a36',
                                  borderRadius: 1,
                                }}
                              >
                                <Box
                                  sx={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: 1,
                                  }}
                                >
                                  {/* 이모티콘 버튼 (Popover) */}
                                  <IconButton
                                    onClick={e =>
                                      setEmojiAnchorEl(e.currentTarget)
                                    }
                                    sx={{
                                      color: '#e0e6ed',
                                      fontSize: '1.2rem',
                                      p: 0.5,
                                    }}
                                  >
                                    <span role="img" aria-label="emoji">
                                      😊
                                    </span>
                                  </IconButton>
                                  {/* 파일/사진 첨부 버튼 */}
                                  <IconButton
                                    onClick={() => {
                                      const input =
                                        document.createElement('input');
                                      input.type = 'file';
                                      input.multiple = true;
                                      input.accept =
                                        'image/*,.pdf,.doc,.docx,.xls,.xlsx';
                                      input.onchange = e => {
                                        const files = (
                                          e.target as HTMLInputElement
                                        ).files;
                                        if (files) {
                                          setCommentAttachments(prev => [
                                            ...prev,
                                            ...Array.from(files),
                                          ]);
                                        }
                                      };
                                      input.click();
                                    }}
                                    sx={{
                                      color: '#e0e6ed',
                                      fontSize: '1.2rem',
                                      p: 0.5,
                                    }}
                                  >
                                    <AttachFileIcon
                                      sx={{ fontSize: '1.2rem' }}
                                    />
                                  </IconButton>
                                  <Popover
                                    open={Boolean(emojiAnchorEl)}
                                    anchorEl={emojiAnchorEl}
                                    onClose={() => setEmojiAnchorEl(null)}
                                    anchorOrigin={{
                                      vertical: 'top',
                                      horizontal: 'left',
                                    }}
                                    transformOrigin={{
                                      vertical: 'bottom',
                                      horizontal: 'left',
                                    }}
                                  >
                                    <Box
                                      sx={{
                                        display: 'flex',
                                        flexWrap: 'wrap',
                                        p: 1,
                                        maxWidth: 240,
                                      }}
                                    >
                                      {[
                                        '😊',
                                        '👍',
                                        '❤️',
                                        '🎉',
                                        '🔥',
                                        '💯',
                                        '👏',
                                        '🙏',
                                        '😍',
                                        '🤔',
                                        '😅',
                                        '😢',
                                      ].map(emoji => (
                                        <IconButton
                                          key={emoji}
                                          onClick={() => {
                                            setNewComment(prev => prev + emoji);
                                            setEmojiAnchorEl(null);
                                          }}
                                          sx={{
                                            fontSize: '1.5rem',
                                            color: '#232a36',
                                          }}
                                        >
                                          {emoji}
                                        </IconButton>
                                      ))}
                                    </Box>
                                  </Popover>
                                  {/* 메시지 입력란 */}
                                  <TextField
                                    fullWidth
                                    multiline
                                    rows={1}
                                    placeholder="메시지를 입력하세요..."
                                    value={newComment}
                                    onChange={e =>
                                      setNewComment(e.target.value)
                                    }
                                    InputProps={{
                                      sx: {
                                        py: 0.5, // 높이 더 낮게
                                        fontSize: { xs: '0.92rem', sm: '1rem' },
                                        minHeight: 32,
                                      },
                                      endAdornment: commentAttachments.length >
                                        0 && (
                                        <Box
                                          sx={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: 0.5,
                                            mr: 1,
                                          }}
                                        >
                                          <Typography
                                            variant="caption"
                                            sx={{ color: '#40c4ff' }}
                                          >
                                            {commentAttachments.length}개 첨부
                                          </Typography>
                                          <IconButton
                                            size="small"
                                            onClick={() =>
                                              setCommentAttachments([])
                                            }
                                            sx={{ color: '#ff6b6b', p: 0.5 }}
                                          >
                                            <CloseIcon
                                              sx={{ fontSize: '0.8rem' }}
                                            />
                                          </IconButton>
                                        </Box>
                                      ),
                                    }}
                                    onKeyPress={e => {
                                      if (e.key === 'Enter' && !e.shiftKey) {
                                        e.preventDefault();
                                        if (
                                          newComment.trim() ||
                                          commentAttachments.length > 0
                                        ) {
                                          if (!scheduleEvent) {
                                            setSnackbar({
                                              open: true,
                                              message:
                                                '일정 정보를 찾을 수 없습니다.',
                                              severity: 'error',
                                            });
                                            return;
                                          }
                                          const comment: ScheduleComment = {
                                            id: Date.now().toString(),
                                            eventId: scheduleEvent.id,
                                            userId: 'current_user',
                                            userName: nickname || '사용자',
                                            message: newComment,
                                            timestamp: new Date().toISOString(),
                                            attachments: commentAttachments.map(
                                              file => URL.createObjectURL(file)
                                            ),
                                            emoji:
                                              newComment.match(
                                                /[😊👍❤️🎉🔥👏🙏😍🤔😅😢]/
                                              )?.[0] || undefined,
                                          };
                                          console.log(
                                            '일반 일정 채팅 메시지 전송:',
                                            {
                                              eventId: scheduleEvent.id,
                                              eventTitle: scheduleEvent.title,
                                              message: newComment,
                                              comment,
                                            }
                                          );
                                          setEvents(prev => {
                                            const updatedEvents = prev.map(e =>
                                              e.id === scheduleEvent.id
                                                ? {
                                                    ...e,
                                                    comments: [
                                                      ...(e.comments || []),
                                                      comment,
                                                    ],
                                                    updatedAt:
                                                      new Date().toISOString(),
                                                  }
                                                : e
                                            );
                                            // 실측 다이얼로그의 currentMeasurementEvent도 동기화
                                            const updatedCurrent =
                                              updatedEvents.find(
                                                e =>
                                                  e.id ===
                                                  currentMeasurementEvent?.id
                                              );
                                            if (updatedCurrent)
                                              setCurrentMeasurementEvent(
                                                updatedCurrent
                                              );
                                            localStorage.setItem(
                                              'schedules',
                                              JSON.stringify(updatedEvents)
                                            );
                                            return updatedEvents;
                                          });
                                          setNewComment('');
                                          setCommentAttachments([]);
                                          setSnackbar({
                                            open: true,
                                            message: '메시지가 전송되었습니다.',
                                            severity: 'success',
                                          });
                                        }
                                      }
                                    }}
                                    sx={{
                                      '& .MuiOutlinedInput-root': {
                                        backgroundColor: '#2e3a4a',
                                        color: '#e0e6ed',
                                        '& fieldset': {
                                          borderColor: '#3d3d3d',
                                        },
                                        '&:hover fieldset': {
                                          borderColor: '#40c4ff',
                                        },
                                        '&.Mui-focused fieldset': {
                                          borderColor: '#40c4ff',
                                        },
                                      },
                                      '& .MuiInputBase-input': {
                                        color: '#e0e6ed',
                                        py: 0.5,
                                        fontSize: { xs: '0.92rem', sm: '1rem' },
                                      },
                                    }}
                                  />
                                  {/* 전송 버튼 */}
                                  <IconButton
                                    onClick={() => {
                                      if (
                                        newComment.trim() ||
                                        commentAttachments.length > 0
                                      ) {
                                        if (!scheduleEvent) {
                                          setSnackbar({
                                            open: true,
                                            message:
                                              '일정 정보를 찾을 수 없습니다.',
                                            severity: 'error',
                                          });
                                          return;
                                        }
                                        const comment: ScheduleComment = {
                                          id: Date.now().toString(),
                                          eventId: scheduleEvent.id,
                                          userId: 'current_user',
                                          userName: nickname || '사용자',
                                          message: newComment,
                                          timestamp: new Date().toISOString(),
                                          attachments: commentAttachments.map(
                                            file => URL.createObjectURL(file)
                                          ),
                                          emoji:
                                            newComment.match(
                                              /[😊👍❤️🎉🔥👏🙏😍🤔😅😢]/
                                            )?.[0] || undefined,
                                        };
                                        console.log(
                                          '일반 일정 채팅 메시지 전송 (버튼):',
                                          {
                                            eventId: scheduleEvent.id,
                                            eventTitle: scheduleEvent.title,
                                            message: newComment,
                                            comment,
                                          }
                                        );
                                        setEvents(prev => {
                                          const updatedEvents = prev.map(e =>
                                            e.id === scheduleEvent.id
                                              ? {
                                                  ...e,
                                                  comments: [
                                                    ...(e.comments || []),
                                                    comment,
                                                  ],
                                                  updatedAt:
                                                    new Date().toISOString(),
                                                }
                                              : e
                                          );
                                          localStorage.setItem(
                                            'schedules',
                                            JSON.stringify(updatedEvents)
                                          );
                                          return updatedEvents;
                                        });
                                        setNewComment('');
                                        setCommentAttachments([]);
                                        setSnackbar({
                                          open: true,
                                          message: '메시지가 전송되었습니다.',
                                          severity: 'success',
                                        });
                                      }
                                    }}
                                    disabled={
                                      !newComment.trim() &&
                                      commentAttachments.length === 0
                                    }
                                    sx={{
                                      backgroundColor: '#006241',
                                      color: 'white',
                                      width: 35,
                                      height: 35,
                                      minWidth: 35,
                                      minHeight: 35,
                                      boxShadow: '0 2px 8px 0 rgba(0,0,0,0.10)',
                                      '&:hover': { backgroundColor: '#004d33' },
                                      '&:disabled': {
                                        backgroundColor: '#bdbdbd',
                                        color: '#fff',
                                      },
                                      transition: 'background 0.2s',
                                      ml: 0.5,
                                    }}
                                  >
                                    <SendIcon sx={{ fontSize: 22 }} />
                                  </IconButton>
                                </Box>
                              </Box>
                            </Box>
                          )}
                      </>
                    )}
                  </Box>
                ))}
              </Box>
            ) : null}
          </DialogContent>
          <DialogActions sx={{ borderTop: 1, borderColor: '#2e3a4a', p: 2 }}>
            <Button
              onClick={() => setDetailDialogOpen(false)}
              sx={{ color: '#e0e6ed' }}
            >
              닫기
            </Button>
          </DialogActions>
        </Dialog>

        {/* 실측 데이터 입력 다이얼로그 */}
        <Dialog
          open={measurementDialogOpen}
          onClose={() => setMeasurementDialogOpen(false)}
          maxWidth="md"
          fullWidth
          fullScreen={isMobile}
          PaperProps={{
            sx: {
              backgroundColor: '#232a36',
              color: '#e0e6ed',
              borderRadius: { xs: 0, md: 3 },
              boxShadow: '0 20px 60px rgba(64, 196, 255, 0.2)',
              border: '1px solid #2e3a4a',
              maxHeight: { xs: '100vh', md: '95vh' },
              overflow: 'hidden',
              display: 'flex',
              flexDirection: 'column',
              width: { xs: '100vw', md: '70vw' },
              m: 0,
            },
          }}
          inert={measurementDialogOpen ? undefined : true}
        >
          <DialogTitle 
            sx={{ 
              borderBottom: 1, 
              borderColor: '#2e3a4a',
              background: 'linear-gradient(135deg, #1e2634 0%, #2e3a4a 100%)',
              color: '#40c4ff',
              fontWeight: 'bold',
              fontSize: { xs: '1.1rem', sm: '1.3rem' },
              textAlign: 'center',
              py: { xs: 2, sm: 2.5 },
              px: { xs: 2, sm: 3 },
              position: 'relative',
              justifyContent: 'center',
            }}
          >
            {isMobile && (
              <IconButton
                onClick={() => setMeasurementDialogOpen(false)}
                sx={{
                  position: 'absolute',
                  left: 8,
                  color: '#40c4ff',
                  '&:hover': { backgroundColor: 'rgba(64, 196, 255, 0.1)' },
                }}
              >
                <ArrowBackIcon />
              </IconButton>
            )}
            📏 실측 데이터 입력
            {currentMeasurementEvent && (
              <Typography 
                variant="body2" 
                sx={{ 
                  mt: 1, 
                  color: '#b0b8c1',
                  fontSize: { xs: '0.9rem', sm: '0.875rem' },
                }}
              >
                {currentMeasurementEvent.title} -{' '}
                {currentMeasurementEvent.customerName}
              </Typography>
            )}
          </DialogTitle>
          <DialogContent
            sx={{
              pt: { xs: 3, sm: 2 },
              pb: 0,
              px: { xs: 2, sm: 3 },
              flex: 1,
              overflowY: 'auto',
            }}
          >
            {/* 견적 rows 자동 추출: 계약완료, 고객명/전화번호/프로젝트명/주소 중 하나라도 일치, 가장 최근 것 우선 */}
            {(() => {
              let estimateRows: Array<{
                space: string;
                productName: string;
                widthMM: number | string;
                heightMM: number | string;
              }> = [];
              let initialData: MeasurementRowData[] | undefined = undefined;
              let estimateInfo: any = undefined;

              if (currentMeasurementEvent) {
                const savedEstimates = JSON.parse(
                  localStorage.getItem('saved_estimates') || '[]'
                );

                // 1. 먼저 currentMeasurementEvent.estimateNo로 매칭 시도
                let matchedEstimate: any = null;
                if (currentMeasurementEvent.estimateNo) {
                  matchedEstimate = savedEstimates.find(
                    (est: any) =>
                      est.estimateNo === currentMeasurementEvent.estimateNo
                  );
                }

                // 2. estimateNo가 없거나 매칭되지 않으면, 가장 최근 견적서 사용
                if (!matchedEstimate) {
                  const recentEstimates = savedEstimates
                    .filter(
                      (est: any) =>
                        est.status === '계약완료' ||
                        est.status === '진행' ||
                        est.status === 'signed'
                    )
                    .sort(
                      (a: any, b: any) =>
                        new Date(b.savedAt || b.estimateDate || 0).getTime() -
                        new Date(a.savedAt || a.estimateDate || 0).getTime()
                    );
                  matchedEstimate = recentEstimates[0];
                }

                if (matchedEstimate && matchedEstimate.rows) {
                  // 옵션이 아닌(공간, 제품명 있는) row만 추출
                  estimateRows = matchedEstimate.rows
                    .filter((row: any) => row.space && row.productName)
                    .map((row: any) => ({
                      // 직접입력인 경우 spaceCustom 값 사용, 아니면 space 값 사용
                      space: row.space === '직접입력' && row.spaceCustom ? row.spaceCustom : row.space,
                      productName: row.productName,
                      widthMM: row.widthMM,
                      heightMM: row.heightMM,
                    }));

                  // 계약 데이터에서 추가 정보 가져오기
                  const contracts = JSON.parse(
                    localStorage.getItem('contracts') || '[]'
                  );
                  const relatedContract = contracts.find(
                    (contract: any) =>
                      contract.estimateNo === matchedEstimate.estimateNo
                  );

                  // 견적서 정보 구성
                  const totalAmount =
                    matchedEstimate.rows?.reduce(
                      (sum: number, row: any) => sum + (row.totalPrice || 0),
                      0
                    ) || 0;
                  const discountAmount = matchedEstimate.discountAmount || 0;
                  const finalAmount = totalAmount - discountAmount;
                  const contractAmount =
                    relatedContract?.depositAmount ||
                    matchedEstimate.contractAmount ||
                    0;

                  estimateInfo = {
                    estimateNo: matchedEstimate.estimateNo,
                    customerName: matchedEstimate.customerName,
                    customerContact:
                      matchedEstimate.contact ||
                      matchedEstimate.customerContact ||
                      '-',
                    customerAddress:
                      matchedEstimate.address ||
                      matchedEstimate.customerAddress ||
                      '-',
                    appointmentDate: currentMeasurementEvent.date,
                    appointmentTime: currentMeasurementEvent.time,
                    constructionDate:
                      relatedContract?.constructionDate ||
                      matchedEstimate.constructionDate ||
                      '-',
                    totalAmount,
                    discountAmount,
                    finalAmount,
                    contractAmount,
                    projectName:
                      matchedEstimate.projectName ||
                      matchedEstimate.name ||
                      '-',
                    projectType: matchedEstimate.type || '-',
                    memo: relatedContract?.memo || matchedEstimate.memo || '-',
                  };

                  // currentMeasurementEvent에 estimateNo가 없으면 설정
                  if (!currentMeasurementEvent.estimateNo) {
                    const updatedEvent = {
                      ...currentMeasurementEvent,
                      estimateNo: matchedEstimate.estimateNo,
                      updatedAt: new Date().toISOString(),
                    };
                    // setEvents 호출 제거 - 무한 렌더링 방지
                    console.log(
                      '견적번호 자동 연결:',
                      matchedEstimate.estimateNo
                    );
                  }
                }

                // 디버깅용 로그 유지
                console.log(
                  '실측 다이얼로그 - currentMeasurementEvent.estimateNo:',
                  currentMeasurementEvent.estimateNo
                );
                console.log(
                  '실측 다이얼로그 - 매칭된 견적서:',
                  matchedEstimate
                );
                console.log(
                  '실측 다이얼로그 - 매칭된 견적서 rows:',
                  matchedEstimate?.rows
                );
                console.log('실측 다이얼로그 - estimateRows:', estimateRows);
                
                // 기존 실측 데이터 로드 (우선순위: currentMeasurementEvent > localStorage)
                if (Array.isArray(currentMeasurementEvent.measurementData) && currentMeasurementEvent.measurementData.length > 0) {
                  initialData = currentMeasurementEvent.measurementData;
                  console.log('기존 실측 데이터 로드됨:', initialData);
                } else {
                  // localStorage에서 백업 데이터 확인
                  try {
                    const existingSchedules = JSON.parse(localStorage.getItem('schedules') || '[]');
                    const backupEvent = existingSchedules.find((schedule: any) => 
                      schedule.id === currentMeasurementEvent.id
                    );
                    if (backupEvent && Array.isArray(backupEvent.measurementData) && backupEvent.measurementData.length > 0) {
                      initialData = backupEvent.measurementData;
                      console.log('localStorage에서 실측 데이터 복구됨:', initialData);
                    }
                  } catch (error) {
                    console.warn('localStorage 백업 데이터 확인 실패:', error);
                  }
                }
              }
              return (
                <>
                  <MeasurementForm
                    estimateRows={estimateRows}
                    initialData={initialData}
                    onSave={handleMeasurementSave}
                    onCancel={() => {
                      // 실시간으로 저장되고 있으므로 별도 저장 불필요
                      console.log('실측 데이터 모달 닫기');
                      setMeasurementDialogOpen(false);
                    }}
                    onCreateFinalEstimate={handleCreateFinalEstimate}
                    onAutoSave={handleAutoSave}
                    onDataChange={handleMeasurementDataChange}
                    estimateInfo={estimateInfo}
                  />
                  {/* 실측 채팅창 추가 - MeasurementForm 버튼들 위에 배치 */}
                  <Box
                    sx={{
                      mt: 2,
                      mb: 2,
                      p: 2,
                      backgroundColor: '#1e2634',
                      borderRadius: 2,
                      border: '1px solid #2e3a4a',
                      maxHeight: 300,
                      overflowY: 'auto',
                    }}
                  >
                    <Typography variant="h6" sx={{ mb: 2, color: '#40c4ff' }}>
                      실측 채팅 - {currentMeasurementEvent?.title}
                    </Typography>
                    {(() => {
                      console.log('실측 채팅 렌더링:', {
                        eventId: currentMeasurementEvent?.id,
                        eventTitle: currentMeasurementEvent?.title,
                        commentsCount:
                          currentMeasurementEvent?.comments?.length || 0,
                      });
                      return null;
                    })()}

                    {/* 메시지 목록 */}
                    <Box
                      sx={{
                        maxHeight: { xs: 200, sm: 250 },
                        overflowY: 'auto',
                        mb: 2,
                      }}
                    >
                      {currentMeasurementEvent &&
                      realTimeComments[currentMeasurementEvent.id] &&
                      realTimeComments[currentMeasurementEvent.id].length > 0 ? (
                        realTimeComments[currentMeasurementEvent.id].map((comment: ScheduleComment, idx: number) => {
                          const isMine = comment.userName === nickname;
                          return (
                            <Box key={comment.id} sx={{
                              display: 'flex',
                              flexDirection: 'column',
                              alignItems: isMine ? 'flex-end' : 'flex-start',
                              mb: 1.2,
                            }}>
                                                        {/* 사용자 이름 표시 */}
                          <Box sx={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 0.5,
                            mb: 0.5,
                            justifyContent: isMine ? 'flex-end' : 'flex-start',
                            px: 0.5,
                          }}>
                            <Box sx={{
                              width: 16,
                              height: 16,
                              borderRadius: '50%',
                              backgroundColor: isMine ? '#40c4ff' : '#ff9800',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              fontSize: '0.6rem',
                              color: '#fff',
                              fontWeight: 'bold',
                            }}>
                              {(comment.userName || '알').charAt(0).toUpperCase()}
                            </Box>
                            <Typography variant="caption" sx={{
                              color: isMine ? '#40c4ff' : '#ff9800',
                              fontSize: '0.75rem',
                              fontWeight: 'bold',
                            }}>
                              {comment.userName || '알 수 없음'}
                            </Typography>
                          </Box>
                              <Box sx={{
                                maxWidth: '80%',
                                backgroundColor: isMine ? '#002915' : '#1e2633',
                                color: isMine ? '#fff' : '#e0e6ed',
                                borderRadius: 3,
                                boxShadow: '0 2px 8px 0 rgba(0,0,0,0.10)',
                                px: 1, py: 0.4,
                                alignSelf: isMine ? 'flex-end' : 'flex-start',
                                fontSize: '1rem',
                                lineHeight: 1.2,
                                minHeight: '1.8em',
                                display: 'flex', alignItems: 'center',
                              }}>
                                <Typography variant="body2" sx={{ p: 0, m: 0, fontSize: 'inherit', lineHeight: 'inherit', wordBreak: 'break-word' }}>
                                  {comment.message}
                                </Typography>
                              </Box>
                              <Typography variant="caption" sx={{
                                color: '#b0b8c1',
                                mt: 0.3,
                                textAlign: isMine ? 'right' : 'left',
                                px: 0.5,
                                fontSize: '0.7rem',
                              }}>
                                {new Date(comment.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              </Typography>
                            </Box>
                          );
                        })
                      ) : (
                        <Typography
                          variant="body2"
                          sx={{ color: '#b0b8c1', textAlign: 'center', py: 4 }}
                        >
                          아직 메시지가 없습니다.
                        </Typography>
                      )}
                    </Box>
                    {/* 메시지 입력 */}
                    <Box
                      sx={{ p: 2, backgroundColor: '#232a36', borderRadius: 1 }}
                    >
                      <Box
                        sx={{ display: 'flex', alignItems: 'center', gap: 1 }}
                      >
                        {/* 이모티콘 버튼 (Popover) */}
                        <IconButton
                          onClick={e => setEmojiAnchorEl(e.currentTarget)}
                          sx={{ color: '#e0e6ed', fontSize: '1.2rem', p: 0.5 }}
                        >
                          <span role="img" aria-label="emoji">
                            😊
                          </span>
                        </IconButton>
                        {/* 파일/사진 첨부 버튼 */}
                        <IconButton
                          onClick={() => {
                            const input = document.createElement('input');
                            input.type = 'file';
                            input.multiple = true;
                            input.accept = 'image/*,.pdf,.doc,.docx,.xls,.xlsx';
                            input.onchange = e => {
                              const files = (e.target as HTMLInputElement)
                                .files;
                              if (files) {
                                setCommentAttachments(prev => [
                                  ...prev,
                                  ...Array.from(files),
                                ]);
                              }
                            };
                            input.click();
                          }}
                          sx={{ color: '#e0e6ed', fontSize: '1.2rem', p: 0.5 }}
                        >
                          <AttachFileIcon sx={{ fontSize: '1.2rem' }} />
                        </IconButton>
                        <Popover
                          open={Boolean(emojiAnchorEl)}
                          anchorEl={emojiAnchorEl}
                          onClose={() => setEmojiAnchorEl(null)}
                          anchorOrigin={{ vertical: 'top', horizontal: 'left' }}
                          transformOrigin={{
                            vertical: 'bottom',
                            horizontal: 'left',
                          }}
                        >
                          <Box
                            sx={{
                              display: 'flex',
                              flexWrap: 'wrap',
                              p: 1,
                              maxWidth: 240,
                            }}
                          >
                            {[
                              '😊',
                              '👍',
                              '❤️',
                              '🎉',
                              '🔥',
                              '💯',
                              '👏',
                              '🙏',
                              '😍',
                              '🤔',
                              '😅',
                              '😢',
                            ].map(emoji => (
                              <IconButton
                                key={emoji}
                                onClick={() => {
                                  setNewComment(prev => prev + emoji);
                                  setEmojiAnchorEl(null);
                                }}
                                sx={{ fontSize: '1.5rem', color: '#232a36' }}
                              >
                                {emoji}
                              </IconButton>
                            ))}
                          </Box>
                        </Popover>
                        {/* 메시지 입력란 */}
                        <TextField
                          fullWidth
                          multiline
                          rows={1}
                          placeholder="메시지를 입력하세요..."
                          value={newComment}
                          onChange={e => setNewComment(e.target.value)}
                          InputProps={{
                            sx: {
                              py: 0.3, // 높이 더 낮게
                              fontSize: { xs: '0.85rem', sm: '0.9rem' },
                              minHeight: 28,
                            },
                            endAdornment: commentAttachments.length > 0 && (
                              <Box
                                sx={{
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: 0.5,
                                  mr: 1,
                                }}
                              >
                                <Typography
                                  variant="caption"
                                  sx={{ color: '#40c4ff' }}
                                >
                                  {commentAttachments.length}개 첨부
                                </Typography>
                                <IconButton
                                  size="small"
                                  onClick={() => setCommentAttachments([])}
                                  sx={{ color: '#ff6b6b', p: 0.5 }}
                                >
                                  <CloseIcon sx={{ fontSize: '0.8rem' }} />
                                </IconButton>
                              </Box>
                            ),
                          }}
                          onKeyPress={async e => {
                            if (e.key === 'Enter' && !e.shiftKey) {
                              e.preventDefault();
                              if (
                                newComment.trim() ||
                                commentAttachments.length > 0
                              ) {
                                if (!currentMeasurementEvent) {
                                  setSnackbar({
                                    open: true,
                                    message: '일정 정보를 찾을 수 없습니다.',
                                    severity: 'error',
                                  });
                                  return;
                                }
                                                              // Firebase Firestore에 실측 채팅 메시지 저장
                              try {
                                console.log('Firebase에 실측 채팅 메시지 저장 시작:', {
                                  eventId: currentMeasurementEvent.id,
                                  message: newComment.trim(),
                                  userName: nickname || '사용자'
                                });

                                const commentsRef = collection(db, 'schedules', currentMeasurementEvent.id, 'comments');
                                
                                // emoji 필드 처리 (undefined 제거)
                                const emojiMatch = newComment.match(/[😊👍❤️🎉🔥💯👏🙏😍🤔😅😢]/);
                                const commentData: any = {
                                  eventId: currentMeasurementEvent.id,
                                  userId: 'current_user',
                                  userName: nickname || '사용자',
                                  userAvatar: '',
                                  message: newComment.trim(),
                                  timestamp: serverTimestamp(),
                                  attachments: commentAttachments.map(file => URL.createObjectURL(file)),
                                };
                                
                                // emoji가 있을 때만 필드 추가
                                if (emojiMatch && emojiMatch[0]) {
                                  commentData.emoji = emojiMatch[0];
                                }
                                
                                const docRef = await addDoc(commentsRef, commentData);

                                console.log('Firebase에 실측 채팅 메시지 저장 완료:', docRef.id);
                              } catch (error) {
                                console.error('실측 채팅 메시지 저장 실패:', error);
                                setSnackbar({
                                  open: true,
                                  message: '메시지 전송에 실패했습니다.',
                                  severity: 'error',
                                });
                                return;
                              }
                                setNewComment('');
                                setCommentAttachments([]);
                                setSnackbar({
                                  open: true,
                                  message: '메시지가 전송되었습니다.',
                                  severity: 'success',
                                });
                              }
                            }
                          }}
                          sx={{
                            '& .MuiOutlinedInput-root': {
                              backgroundColor: '#2e3a4a',
                              color: '#e0e6ed',
                              '& fieldset': { borderColor: '#3d3d3d' },
                              '&:hover fieldset': { borderColor: '#40c4ff' },
                              '&.Mui-focused fieldset': {
                                borderColor: '#40c4ff',
                              },
                            },
                            '& .MuiInputBase-input': {
                              color: '#e0e6ed',
                              py: 0.5,
                              fontSize: { xs: '0.92rem', sm: '1rem' },
                            },
                          }}
                        />
                        {/* 전송 버튼 */}
                        <IconButton
                          onClick={async () => {
                            if (
                              newComment.trim() ||
                              commentAttachments.length > 0
                            ) {
                              if (!currentMeasurementEvent) {
                                setSnackbar({
                                  open: true,
                                  message: '일정 정보를 찾을 수 없습니다.',
                                  severity: 'error',
                                });
                                return;
                              }

                              // 현재 일정이 실제로 존재하는지 확인
                              const existingEvent = events.find(
                                e => e.id === currentMeasurementEvent.id
                              );
                              if (!existingEvent) {
                                console.error(
                                  '실측 채팅: 일정을 찾을 수 없음:',
                                  currentMeasurementEvent.id
                                );
                                setSnackbar({
                                  open: true,
                                  message: '일정을 찾을 수 없습니다.',
                                  severity: 'error',
                                });
                                return;
                              }

                              // Firebase Firestore에 실측 채팅 메시지 저장
                              try {
                                console.log('Firebase에 실측 채팅 메시지 저장 시작 (버튼):', {
                                  eventId: currentMeasurementEvent.id,
                                  message: newComment.trim(),
                                  userName: nickname || '사용자'
                                });

                                const commentsRef = collection(db, 'schedules', currentMeasurementEvent.id, 'comments');
                                
                                // emoji 필드 처리 (undefined 제거)
                                const emojiMatch = newComment.match(/[😊👍❤️🎉🔥💯👏🙏😍🤔😅😢]/);
                                const commentData: any = {
                                  eventId: currentMeasurementEvent.id,
                                  userId: 'current_user',
                                  userName: nickname || '사용자',
                                  userAvatar: '',
                                  message: newComment.trim(),
                                  timestamp: serverTimestamp(),
                                  attachments: commentAttachments.map(file => URL.createObjectURL(file)),
                                };
                                
                                // emoji가 있을 때만 필드 추가
                                if (emojiMatch && emojiMatch[0]) {
                                  commentData.emoji = emojiMatch[0];
                                }
                                
                                const docRef = await addDoc(commentsRef, commentData);

                                console.log('Firebase에 실측 채팅 메시지 저장 완료 (버튼):', docRef.id);
                              } catch (error) {
                                console.error('실측 채팅 메시지 저장 실패 (버튼):', error);
                                setSnackbar({
                                  open: true,
                                  message: '메시지 전송에 실패했습니다.',
                                  severity: 'error',
                                });
                                return;
                              }
                              setNewComment('');
                              setCommentAttachments([]);
                              setSnackbar({
                                open: true,
                                message: '메시지가 전송되었습니다.',
                                severity: 'success',
                              });
                            }
                          }}
                          disabled={
                            !newComment.trim() &&
                            commentAttachments.length === 0
                          }
                          sx={{
                            backgroundColor: '#006241',
                            color: 'white',
                            width: 32,
                            height: 32,
                            minWidth: 32,
                            minHeight: 32,
                            boxShadow: '0 2px 8px 0 rgba(0,0,0,0.10)',
                            '&:hover': { backgroundColor: '#004d33' },
                            '&:disabled': {
                              backgroundColor: '#bdbdbd',
                              color: '#fff',
                            },
                            transition: 'background 0.2s',
                            ml: 0.5,
                          }}
                        >
                          <SendIcon sx={{ fontSize: 22 }} />
                        </IconButton>
                      </Box>
                    </Box>
                  </Box>
                  
                  {/* 실측 데이터 모달 버튼들 */}
                  <Box
                    sx={{ 
                      mt: 2, 
                      display: 'flex', 
                      justifyContent: 'flex-end', 
                      gap: 1,
                      pt: 2,
                      borderTop: '1px solid #2e3a4a'
                    }}
                  >
                    <Button 
                      onClick={() => {
                        console.log('실측 데이터 모달 닫기');
                        setMeasurementDialogOpen(false);
                      }} 
                      variant="outlined" 
                      color="inherit"
                      sx={{ color: '#e0e6ed', borderColor: '#2e3a4a' }}
                    >
                      취소
                    </Button>
                    <Button 
                      onClick={() => handleMeasurementSave([])} 
                      variant="contained" 
                      color="primary"
                      sx={{ backgroundColor: '#FF6B9D' }}
                    >
                      저장
                    </Button>
                    {estimateInfo && (
                      <Button 
                        onClick={() => handleCreateFinalEstimate([])}
                        variant="contained" 
                        color="secondary"
                        sx={{ 
                          backgroundColor: '#ff9800',
                          '&:hover': { backgroundColor: '#f57c00' }
                        }}
                      >
                        Final견적서 만들기
                      </Button>
                    )}
                  </Box>
                </>
              );
            })()}
          </DialogContent>
        </Dialog>

        {/* 사용자 이름 입력 모달 제거 - UserContext의 nickname 사용 */}

        {/* 타입 관리 다이얼로그 */}
        <Dialog
          open={typeManagementOpen}
          onClose={() => setTypeManagementOpen(false)}
          maxWidth="md"
          fullWidth
          PaperProps={{
            sx: {
              backgroundColor: '#232a36',
              color: '#e0e6ed',
            },
          }}
        >
          <DialogTitle sx={{ borderBottom: 1, borderColor: '#2e3a4a' }}>
            <Box
              display="flex"
              justifyContent="space-between"
              alignItems="center"
            >
              <Typography variant="h6">일정 타입 관리</Typography>
              <Button
                variant="contained"
                startIcon={<AddIcon />}
                onClick={() => {
                  setEditingType({
                    id: Date.now().toString(),
                    name: '',
                    color: '#1565c0',
                    order: scheduleTypes.length + 1,
                    isActive: true,
                    icon: 'Category',
                  });
                }}
                sx={{ backgroundColor: '#40c4ff' }}
              >
                새 타입 추가
              </Button>
            </Box>
          </DialogTitle>
          <DialogContent sx={{ pt: 2 }}>
            <Box sx={{ mb: 3 }}>
              <Typography variant="body2" sx={{ color: '#b0b8c1', mb: 2 }}>
                일정 타입의 제목, 색상, 순서를 관리할 수 있습니다. 드래그하여
                순서를 변경할 수 있습니다.
              </Typography>
            </Box>

            {/* 타입 목록 */}
            <Box>
              {scheduleTypes
                .sort((a, b) => a.order - b.order)
                .map((type, index) => (
                  <Paper
                    key={type.id}
                    sx={{
                      p: 2,
                      mb: 1,
                      backgroundColor: '#1e2634',
                      border: '1px solid #2e3a4a',
                      borderRadius: 1,
                      display: 'flex',
                      alignItems: 'center',
                      gap: 2,
                    }}
                  >
                    {/* 순서 표시 */}
                    <Box
                      sx={{
                        width: 30,
                        height: 30,
                        borderRadius: '50%',
                        backgroundColor: type.color,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: 'white',
                        fontWeight: 'bold',
                        fontSize: '0.8rem',
                      }}
                    >
                      {type.order}
                    </Box>

                    {/* 색상 미리보기 */}
                    <Box
                      sx={{
                        width: 20,
                        height: 20,
                        borderRadius: '50%',
                        backgroundColor: type.color,
                        border: '2px solid #fff',
                      }}
                    />

                    {/* 타입 정보 */}
                    <Box sx={{ flex: 1 }}>
                      <Typography
                        variant="subtitle1"
                        sx={{ color: type.isActive ? '#e0e6ed' : '#666' }}
                      >
                        {type.name}
                      </Typography>
                      <Typography variant="caption" sx={{ color: '#b0b8c1' }}>
                        색상: {type.color}
                      </Typography>
                    </Box>

                    {/* 활성화 토글 */}
                    <Switch
                      checked={type.isActive}
                      onChange={e => {
                        setScheduleTypes(prev =>
                          prev.map(t =>
                            t.id === type.id
                              ? { ...t, isActive: e.target.checked }
                              : t
                          )
                        );
                      }}
                      sx={{
                        '& .MuiSwitch-switchBase.Mui-checked': {
                          color: type.color,
                        },
                        '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track':
                          {
                            backgroundColor: type.color,
                          },
                      }}
                    />

                    {/* 액션 버튼들 */}
                    <Box sx={{ display: 'flex', gap: 1 }}>
                      <IconButton
                        size="small"
                        onClick={() => setEditingType(type)}
                        sx={{ color: '#40c4ff' }}
                      >
                        <EditIcon />
                      </IconButton>
                      <IconButton
                        size="small"
                        onClick={() => {
                          if (
                            window.confirm(
                              `"${type.name}" 타입을 삭제하시겠습니까?`
                            )
                          ) {
                            setScheduleTypes(prev =>
                              prev.filter(t => t.id !== type.id)
                            );
                          }
                        }}
                        sx={{ color: '#ff6b6b' }}
                      >
                        <DeleteIcon />
                      </IconButton>
                    </Box>
                  </Paper>
                ))}
            </Box>
          </DialogContent>
        </Dialog>

        {/* 타입 편집 다이얼로그 */}
        <Dialog
          open={!!editingType}
          onClose={() => setEditingType(null)}
          maxWidth="sm"
          fullWidth
          PaperProps={{
            sx: {
              backgroundColor: '#232a36',
              color: '#e0e6ed',
            },
          }}
        >
          <DialogTitle sx={{ borderBottom: 1, borderColor: '#2e3a4a' }}>
            {editingType?.id && scheduleTypes.find(t => t.id === editingType.id)
              ? '타입 수정'
              : '새 타입 추가'}
          </DialogTitle>
          <DialogContent sx={{ pt: 2 }}>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              {/* 타입명 */}
              <TextField
                fullWidth
                label="타입명"
                value={editingType?.name || ''}
                onChange={e =>
                  setEditingType(prev =>
                    prev ? { ...prev, name: e.target.value } : null
                  )
                }
                sx={{
                  '& .MuiInputLabel-root': { color: '#b0b8c1' },
                  '& .MuiOutlinedInput-root': {
                    '& fieldset': { borderColor: '#2e3a4a' },
                    '&:hover fieldset': { borderColor: '#40c4ff' },
                    '&.Mui-focused fieldset': { borderColor: '#40c4ff' },
                  },
                  '& .MuiInputBase-input': { color: '#e0e6ed' },
                }}
              />

              {/* 색상 선택 */}
              <Box>
                <Typography
                  variant="subtitle2"
                  sx={{ mb: 1, color: '#b0b8c1' }}
                >
                  색상 선택
                </Typography>
                <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                  {[
                    '#1565c0',
                    '#2e7d32',
                    '#ef6c00',
                    '#c62828',
                    '#6a1b9a',
                    '#0277bd',
                    '#388e3c',
                    '#9e9e9e',
                    '#e91e63',
                    '#ff9800',
                    '#4caf50',
                    '#2196f3',
                  ].map(color => (
                    <Box
                      key={color}
                      onClick={() =>
                        setEditingType(prev =>
                          prev ? { ...prev, color } : null
                        )
                      }
                      sx={{
                        width: 40,
                        height: 40,
                        borderRadius: '50%',
                        backgroundColor: color,
                        cursor: 'pointer',
                        border:
                          editingType?.color === color
                            ? '3px solid #fff'
                            : '2px solid #2e3a4a',
                        '&:hover': {
                          border: '3px solid #fff',
                          transform: 'scale(1.1)',
                        },
                      }}
                    />
                  ))}
                </Box>
              </Box>

              {/* 순서 */}
              <TextField
                fullWidth
                label="순서"
                type="number"
                value={editingType?.order || 1}
                onChange={e =>
                  setEditingType(prev =>
                    prev
                      ? { ...prev, order: parseInt(e.target.value) || 1 }
                      : null
                  )
                }
                sx={{
                  '& .MuiInputLabel-root': { color: '#b0b8c1' },
                  '& .MuiOutlinedInput-root': {
                    '& fieldset': { borderColor: '#2e3a4a' },
                    '&:hover fieldset': { borderColor: '#40c4ff' },
                    '&.Mui-focused fieldset': { borderColor: '#40c4ff' },
                  },
                  '& .MuiInputBase-input': { color: '#e0e6ed' },
                }}
              />
            </Box>
          </DialogContent>
          <DialogActions sx={{ borderTop: 1, borderColor: '#2e3a4a', p: 2 }}>
            <Button
              onClick={() => setEditingType(null)}
              sx={{ color: '#b0b8c1' }}
            >
              취소
            </Button>
            <Button
              onClick={() => {
                if (editingType && editingType.name.trim()) {
                  setScheduleTypes(prev => {
                    const existingIndex = prev.findIndex(
                      t => t.id === editingType.id
                    );
                    if (existingIndex >= 0) {
                      // 수정
                      return prev.map(t =>
                        t.id === editingType.id ? editingType : t
                      );
                    } else {
                      // 추가
                      return [...prev, editingType];
                    }
                  });
                  setEditingType(null);
                  setSnackbar({
                    open: true,
                    message: '타입이 저장되었습니다.',
                    severity: 'success',
                  });
                } else {
                  setSnackbar({
                    open: true,
                    message: '타입명을 입력해주세요.',
                    severity: 'error',
                  });
                }
              }}
              variant="contained"
              sx={{ backgroundColor: '#40c4ff' }}
            >
              저장
            </Button>
          </DialogActions>
        </Dialog>

        {/* 실측 타입 선택 시 견적서 선택 드롭다운 */}
        {newEvent.type === '실측' && (
          <Grid item xs={12}>
            <FormControl fullWidth sx={{ mt: 2 }}>
              <InputLabel>견적서 선택</InputLabel>
              <Select
                value={newEvent.estimateNo || ''}
                onChange={e =>
                  setNewEvent(prev => ({ ...prev, estimateNo: e.target.value }))
                }
                label="견적서 선택"
              >
                {savedEstimates
                  .filter(
                    (est: any) =>
                      est.status === '계약완료' ||
                      est.status === '진행' ||
                      est.status === 'signed'
                  )
                  .map((est: any) => (
                    <MenuItem key={est.estimateNo} value={est.estimateNo}>
                      {est.estimateNo} - {est.customerName}
                    </MenuItem>
                  ))}
              </Select>
            </FormControl>
          </Grid>
        )}

        {/* 통합 일정 모달 */}
        <Dialog
          open={integratedEventDialogOpen}
          onClose={() => setIntegratedEventDialogOpen(false)}
          maxWidth="md"
          fullWidth
          fullScreen={isMobile}
          PaperProps={{
            sx: {
              backgroundColor: '#232a36',
              color: '#e0e6ed',
              maxHeight: { xs: '95vh', md: '80vh' },
              width: { xs: '100vw', md: '70vw' },
              m: 0,
              borderRadius: { xs: 0, md: 3 },
              display: 'flex', flexDirection: 'column',
            },
          }}
        >
          <DialogTitle sx={{ 
            borderBottom: 1, 
            borderColor: '#2e3a4a',
            display: 'flex',
            alignItems: 'center',
            gap: 1,
            fontSize: isMobile ? '1.2rem' : '1.25rem',
            pb: isMobile ? 1 : 2
          }}>
            {isMobile && (
              <IconButton
                edge="start"
                color="inherit"
                onClick={() => setIntegratedEventDialogOpen(false)}
                aria-label="close"
                sx={{ mr: 1, color: '#b0b8c1' }}
              >
                <ArrowBackIcon />
              </IconButton>
            )}
            <Box sx={{ 
              display: 'flex', 
              justifyContent: 'space-between', 
              alignItems: 'center',
              width: '100%'
            }}>
              <Typography variant="h6" sx={{ fontSize: isMobile ? '1.1rem' : '1.25rem' }}>
                일정 상세보기 및 수정
              </Typography>
              <Box sx={{ display: 'flex', gap: 1 }}>
                <IconButton
                  onClick={handleIntegratedEventDelete}
                  sx={{ 
                    color: '#ff6b6b',
                    minWidth: isMobile ? '48px' : 'auto'
                  }}
                  title="일정 삭제"
                >
                  <DeleteIcon />
                </IconButton>
                {!isMobile && (
                  <IconButton
                    onClick={() => setIntegratedEventDialogOpen(false)}
                    sx={{ color: '#b0b8c1' }}
                  >
                    <CloseIcon />
                  </IconButton>
                )}
              </Box>
            </Box>
          </DialogTitle>
          <DialogContent sx={{ pt: 2, pb: 0 }}>
            <Box sx={{
              display: 'flex',
              alignItems: 'stretch',
              gap: 3,
              width: '100%',
              height: 'auto',
              maxHeight: { xs: '90vh', md: '70vh' },
              overflow: 'visible',
              '@media (max-width: 768px)': {
                flexDirection: 'column',
                gap: 2
              }
            }}>
              {/* 왼쪽: 일정 정보 */}
              <Box sx={{
                flex: 1,
                display: 'flex',
                flexDirection: 'column',
                gap: 2,
                height: 'auto',
                p: 2,
                backgroundColor: '#1e2633',
                borderRadius: 1,
                border: 1,
                borderColor: '#2e3a4a'
              }}>
                <Typography variant="h6" sx={{ color: '#40c4ff', mb: 1, borderBottom: 1, borderColor: '#2e3a4a', pb: 1 }}>
                  일정 정보
                </Typography>
                
                {/* 제목 */}
                <TextField
                  fullWidth
                  label="제목"
                  value={integratedEventData.title || ''}
                  onChange={(e) => setIntegratedEventData(prev => ({ ...prev, title: e.target.value }))}
                  sx={{
                    '& .MuiInputLabel-root': { color: '#b0b8c1' },
                    '& .MuiOutlinedInput-root': {
                      '& fieldset': { borderColor: '#2e3a4a' },
                      '&:hover fieldset': { borderColor: '#40c4ff' },
                      '&.Mui-focused fieldset': { borderColor: '#40c4ff' },
                    },
                    '& .MuiInputBase-input': { color: '#e0e6ed' },
                  }}
                />

                {/* 기간 설정 체크박스 */}
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={integratedIsPeriodMode}
                      onChange={(e) => {
                        const isChecked = e.target.checked;
                        setIntegratedIsPeriodMode(isChecked);
                        
                        // 기간설정 해제 시 기간 관련 필드 제거
                        if (!isChecked) {
                          setIntegratedEventData(prev => {
                            const { startDate, endDate, endTime, ...rest } = prev;
                            return rest;
                          });
                        } else {
                          // 기간설정 체크 시 종료날짜를 시작날짜와 동일하게 설정
                          setIntegratedEventData(prev => ({
                            ...prev,
                            endDate: prev.date || prev.startDate || '',
                            endTime: prev.time || ''
                          }));
                        }
                      }}
                      sx={{
                        color: '#40c4ff',
                        '&.Mui-checked': { color: '#40c4ff' },
                      }}
                    />
                  }
                  label="기간 설정"
                  sx={{ color: '#b0b8c1' }}
                />

                {/* 날짜와 시간 */}
                <Box sx={{ display: 'flex', gap: 2 }}>
                  <TextField
                    fullWidth
                    label="시작 날짜"
                    type="date"
                    value={integratedEventData.date || ''}
                    onChange={(e) => setIntegratedEventData(prev => ({ ...prev, date: e.target.value }))}
                    InputProps={{
                      onClick: (e) => {
                        const input = e.currentTarget.querySelector('input');
                        if (input) {
                          if (input.showPicker) {
                            input.showPicker();
                          } else {
                            input.click();
                          }
                        }
                      },
                    }}
                    sx={{
                      '& .MuiInputLabel-root': { color: '#b0b8c1' },
                      '& .MuiOutlinedInput-root': {
                        '& fieldset': { borderColor: '#2e3a4a' },
                        '&:hover fieldset': { borderColor: '#40c4ff' },
                        '&.Mui-focused fieldset': { borderColor: '#40c4ff' },
                        cursor: 'pointer',
                      },
                      '& .MuiInputBase-input': { color: '#e0e6ed' },
                    }}
                  />
                  <TextField
                    fullWidth
                    label="시작 시간"
                    type="time"
                    value={integratedEventData.time || ''}
                    onChange={(e) => setIntegratedEventData(prev => ({ ...prev, time: e.target.value }))}
                    InputProps={{
                      onClick: (e) => {
                        const input = e.currentTarget.querySelector('input');
                        if (input) {
                          if (input.showPicker) {
                            input.showPicker();
                          } else {
                            input.click();
                          }
                        }
                      },
                    }}
                    sx={{
                      '& .MuiInputLabel-root': { color: '#b0b8c1' },
                      '& .MuiOutlinedInput-root': {
                        '& fieldset': { borderColor: '#2e3a4a' },
                        '&:hover fieldset': { borderColor: '#40c4ff' },
                        '&.Mui-focused fieldset': { borderColor: '#40c4ff' },
                        cursor: 'pointer',
                      },
                      '& .MuiInputBase-input': { color: '#e0e6ed' },
                    }}
                  />
                </Box>

                {/* 종료 날짜와 시간 (기간 설정 시에만 표시) */}
                {integratedIsPeriodMode && (
                  <Box sx={{ display: 'flex', gap: 2 }}>
                    <TextField
                      fullWidth
                      label="종료 날짜"
                      type="date"
                      value={integratedEventData.endDate || integratedEventData.date || ''}
                      onChange={(e) => setIntegratedEventData(prev => ({ ...prev, endDate: e.target.value }))}
                      InputProps={{
                        onClick: (e) => {
                          const input = e.currentTarget.querySelector('input');
                          if (input) {
                            if (input.showPicker) {
                              input.showPicker();
                            } else {
                              input.click();
                            }
                          }
                        },
                      }}
                      sx={{
                        '& .MuiInputLabel-root': { color: '#b0b8c1' },
                        '& .MuiOutlinedInput-root': {
                          '& fieldset': { borderColor: '#2e3a4a' },
                          '&:hover fieldset': { borderColor: '#40c4ff' },
                          '&.Mui-focused fieldset': { borderColor: '#40c4ff' },
                          cursor: 'pointer',
                        },
                        '& .MuiInputBase-input': { color: '#e0e6ed' },
                      }}
                    />
                    <TextField
                      fullWidth
                      label="종료 시간"
                      type="time"
                      value={integratedEventData.endTime || integratedEventData.time || ''}
                      onChange={(e) => setIntegratedEventData(prev => ({ ...prev, endTime: e.target.value }))}
                      InputProps={{
                        onClick: (e) => {
                          const input = e.currentTarget.querySelector('input');
                          if (input) {
                            if (input.showPicker) {
                              input.showPicker();
                            } else {
                              input.click();
                            }
                          }
                        },
                      }}
                      sx={{
                        '& .MuiInputLabel-root': { color: '#b0b8c1' },
                        '& .MuiOutlinedInput-root': {
                          '& fieldset': { borderColor: '#2e3a4a' },
                          '&:hover fieldset': { borderColor: '#40c4ff' },
                          '&.Mui-focused fieldset': { borderColor: '#40c4ff' },
                          cursor: 'pointer',
                        },
                        '& .MuiInputBase-input': { color: '#e0e6ed' },
                      }}
                    />
                  </Box>
                )}

                {/* 타입과 우선순위 */}
                <Box sx={{ display: 'flex', gap: 2 }}>
                  <FormControl fullWidth>
                    <InputLabel sx={{ color: '#b0b8c1' }}>타입</InputLabel>
                    <Select
                      value={integratedEventData.type || ''}
                      onChange={(e) => setIntegratedEventData(prev => ({ ...prev, type: e.target.value }))}
                      label="타입"
                      sx={{
                        color: '#e0e6ed',
                        '& .MuiOutlinedInput-notchedOutline': { borderColor: '#2e3a4a' },
                        '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: '#40c4ff' },
                        '&.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: '#40c4ff' },
                      }}
                    >
                      {scheduleTypes.filter(type => type.isActive).map((type) => (
                        <MenuItem key={type.id} value={type.name}>
                          <Box display="flex" alignItems="center" gap={1.5}>
                            <Box
                              sx={{
                                width: 20,
                                height: 20,
                                borderRadius: '50%',
                                backgroundColor: type.color,
                                border: '2px solid #fff',
                              }}
                            />
                            <Typography sx={{ fontWeight: '500', color: '#fff', fontSize: '0.9rem' }}>
                              {type.name}
                            </Typography>
                          </Box>
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                  <FormControl fullWidth>
                    <InputLabel sx={{ color: '#b0b8c1' }}>반복</InputLabel>
                    <Select
                      value={integratedRepeatPattern}
                      onChange={(e) => setIntegratedRepeatPattern(e.target.value as 'none' | 'daily' | 'weekly' | 'monthly' | 'yearly')}
                      label="반복"
                      sx={{
                        color: '#e0e6ed',
                        '& .MuiOutlinedInput-notchedOutline': { borderColor: '#2e3a4a' },
                        '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: '#40c4ff' },
                        '&.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: '#40c4ff' },
                      }}
                    >
                      <MenuItem value="none">반복 없음</MenuItem>
                      <MenuItem value="daily">매일</MenuItem>
                      <MenuItem value="weekly">매주</MenuItem>
                      <MenuItem value="monthly">매월</MenuItem>
                      <MenuItem value="yearly">매년</MenuItem>
                    </Select>
                  </FormControl>
                </Box>

                {/* 메모 */}
                <TextField
                  fullWidth
                  label="메모"
                  value={integratedEventData.description || ''}
                  onChange={(e) => setIntegratedEventData(prev => ({ ...prev, description: e.target.value }))}
                  multiline
                  rows={4}
                  sx={{
                    '& .MuiInputLabel-root': { color: '#b0b8c1' },
                    '& .MuiOutlinedInput-root': {
                      '& fieldset': { borderColor: '#2e3a4a' },
                      '&:hover fieldset': { borderColor: '#40c4ff' },
                      '&.Mui-focused fieldset': { borderColor: '#40c4ff' },
                    },
                    '& .MuiInputBase-input': { color: '#e0e6ed' },
                  }}
                />
              </Box>

              {/* 오른쪽: 채팅/댓글 */}
              <Box sx={{
                flex: 1,
                display: 'flex',
                flexDirection: 'column',
                height: '100%',
                p: 0,
                background: 'none',
              }}>
                {/* 채팅 헤더 */}
                <Box sx={{
                  px: 3, pt: 2, pb: 1,
                  background: '#232a36',
                  borderTopLeftRadius: 16,
                  borderTopRightRadius: 16,
                  border: 1,
                  borderBottom: 0,
                  borderColor: '#2e3a4a',
                }}>
                  <Typography variant="subtitle1" sx={{ color: '#40c4ff', fontWeight: 700 }}>
                    채팅/댓글
                  </Typography>
                </Box>
                
                {/* 권한 체크 - 권한이 없으면 전체 채팅창 숨김 */}
                {!hasChatPermission ? (
                  <Box sx={{
                    flex: 1,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    background: '#232a36',
                    borderLeft: 1, borderRight: 1,
                    borderColor: '#2e3a4a',
                  }}>
                    <Box sx={{ textAlign: 'center', p: 3 }}>
                      <LockIcon sx={{ fontSize: 48, color: '#b0b8c1', mb: 2 }} />
                      <Typography variant="h6" sx={{ color: '#b0b8c1', mb: 1 }}>
                        채팅 권한이 없습니다
                      </Typography>
                      <Typography variant="body2" sx={{ color: '#8a9299' }}>
                        관리자에게 채팅 권한을 요청하세요
                      </Typography>
                    </Box>
                  </Box>
                ) : (
                  <>
                {/* 채팅 목록 */}
                <Box
                  ref={chatScrollRef}
                  sx={{
                    flex: 1,
                    overflowY: 'auto',
                    background: '#232a36',
                    px: 3, py: 2,
                    borderLeft: 1, borderRight: 1,
                    borderColor: '#2e3a4a',
                    display: 'flex', flexDirection: 'column',
                    gap: 2,
                    scrollBehavior: 'smooth',
                  }}
                >
                  {(realTimeComments[selectedEventForEdit?.id || ''] || []).length === 0 ? (
                    <Typography variant="body2" sx={{ color: '#b0b8c1', textAlign: 'center', mt: 4 }}>
                      아직 댓글이 없습니다.
                    </Typography>
                  ) : (
                    (realTimeComments[selectedEventForEdit?.id || ''] || []).map((comment: ScheduleComment) => {
                      // 안전한 체크 추가
                      if (!comment || !comment.userName || !comment.message || !comment.timestamp) {
                        return null;
                      }
                      
                      const isMine = comment.userName === nickname;
                      return (
                        <Box key={comment.id} sx={{
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: isMine ? 'flex-end' : 'flex-start',
                          mb: 2,
                        }}>
                          {/* 사용자 이름 표시 */}
                          <Box sx={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 0.5,
                            mb: 0.5,
                            justifyContent: isMine ? 'flex-end' : 'flex-start',
                            px: 0.5,
                          }}>
                            <Box sx={{
                              width: 16,
                              height: 16,
                              borderRadius: '50%',
                              backgroundColor: isMine ? '#40c4ff' : '#ff9800',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              fontSize: '0.6rem',
                              color: '#fff',
                              fontWeight: 'bold',
                            }}>
                              {(comment.userName || '알').charAt(0).toUpperCase()}
                            </Box>
                            <Typography variant="caption" sx={{
                              color: isMine ? '#40c4ff' : '#ff9800',
                              fontSize: '0.75rem',
                              fontWeight: 'bold',
                            }}>
                              {comment.userName || '알 수 없음'}
                            </Typography>
                          </Box>
                          <Box sx={{
                            maxWidth: '80%',
                            backgroundColor: isMine ? '#0d4a5c' : '#1e2633',
                            color: isMine ? '#fff' : '#e0e6ed',
                            borderRadius: 3,
                            boxShadow: '0 2px 8px 0 rgba(0,0,0,0.10)',
                            px: 2, py: 1.5,
                            alignSelf: isMine ? 'flex-end' : 'flex-start',
                          }}>
                            <Typography variant="body2" sx={{ lineHeight: 1.7, wordBreak: 'break-word', fontSize: '1rem' }}>
                              {comment.message}
                            </Typography>
                          </Box>
                          <Typography variant="caption" sx={{
                            color: '#b0b8c1',
                            mt: 0.5,
                            textAlign: isMine ? 'right' : 'left',
                            px: 0.5,
                            fontSize: '0.7rem',
                          }}>
                            {new Date(comment.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </Typography>
                        </Box>
                      );
                    })
                  )}
                </Box>
                {/* 입력창 */}
                <Box sx={{
                  background: '#232a36',
                  borderBottomLeftRadius: 16,
                  borderBottomRightRadius: 16,
                  border: 1,
                  borderTop: 0,
                  borderColor: '#2e3a4a',
                  px: 2, py: 1.5,
                  display: 'flex', alignItems: 'center', gap: 1,
                }}>
                  <IconButton size="small" sx={{ color: '#b0b8c1' }}>
                    <InsertEmoticonIcon fontSize="small" />
                  </IconButton>
                  <IconButton size="small" sx={{ color: '#b0b8c1' }}>
                    <AttachFileIcon fontSize="small" />
                  </IconButton>
                  <TextField
                    fullWidth
                    placeholder="메시지를 입력하세요..."
                    value={newIntegratedComment}
                    onChange={(e) => setNewIntegratedComment(e.target.value)}
                    onKeyPress={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        handleIntegratedCommentSubmit();
                      }
                    }}
                    multiline
                    rows={1}
                    sx={{
                      mx: 1,
                      '& .MuiOutlinedInput-root': {
                        backgroundColor: '#232a36',
                        borderRadius: 2,
                        '& fieldset': { borderColor: '#2e3a4a' },
                        '&:hover fieldset': { borderColor: '#40c4ff' },
                        '&.Mui-focused fieldset': { borderColor: '#40c4ff' },
                      },
                      '& .MuiInputBase-input': { color: '#e0e6ed', fontSize: '1rem' },
                    }}
                  />
                  <IconButton
                    color="primary"
                    onClick={handleIntegratedCommentSubmit}
                    disabled={!newIntegratedComment.trim()}
                    sx={{ backgroundColor: '#40c4ff', color: '#fff', ml: 1, '&:hover': { backgroundColor: '#33a3cc' }, borderRadius: 2 }}
                  >
                    <SendIcon />
                  </IconButton>
                </Box>
                  </>
                )}
              </Box>
            </Box>
          </DialogContent>
          {!isMobile && (
            <DialogActions sx={{ 
              borderTop: 1, 
              borderColor: '#2e3a4a', 
              p: 2,
              backgroundColor: '#1e2633'
            }}>
              <Button
                onClick={() => setIntegratedEventDialogOpen(false)}
                sx={{ 
                  color: '#b0b8c1',
                  '&:hover': {
                    backgroundColor: '#2e3a4a'
                  }
                }}
              >
                취소
              </Button>
              <Button
                onClick={handleIntegratedEventSave}
                variant="contained"
                sx={{ 
                  backgroundColor: '#40c4ff',
                  '&:hover': {
                    backgroundColor: '#33a3cc'
                  }
                }}
              >
                저장
              </Button>
            </DialogActions>
          )}
          {isMobile && (
            <Box sx={{ 
              p: 2, 
              display: 'flex', 
              gap: 1, 
              justifyContent: 'center',
              borderTop: 1, 
              borderColor: '#2e3a4a', 
              backgroundColor: '#1e2633'
            }}>
              <Button
                onClick={() => setIntegratedEventDialogOpen(false)}
                variant="outlined"
                sx={{ 
                  color: '#b0b8c1',
                  borderColor: '#2e3a4a',
                  minHeight: '48px',
                  fontSize: '1rem',
                  px: 3,
                  '&:hover': {
                    backgroundColor: '#2e3a4a',
                    borderColor: '#40c4ff'
                  }
                }}
              >
                취소
              </Button>
              <Button
                onClick={handleIntegratedEventSave}
                variant="contained"
                sx={{ 
                  backgroundColor: '#40c4ff',
                  minHeight: '48px',
                  fontSize: '1rem',
                  px: 3,
                  '&:hover': {
                    backgroundColor: '#33a3cc'
                  }
                }}
              >
                저장
              </Button>
            </Box>
          )}
        </Dialog>



        {/* 타임트리 연동 다이얼로그 */}
        <TimeTreeIntegration
          open={timeTreeDialogOpen}
          onClose={() => setTimeTreeDialogOpen(false)}
          onSync={handleTimeTreeSync}
          currentEvents={events}
        />
      </Box>
    </DragDropContext>
  );
};

export default Schedule;
