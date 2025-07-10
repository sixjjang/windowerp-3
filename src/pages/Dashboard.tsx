import React, { useEffect, useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Grid,
  Paper,
  Typography,
  List,
  ListItem,
  ListItemText,
  Chip,
  Box,
  TextField,
  Button,
  IconButton,
  Tooltip,
  Card,
  CardContent,
  Avatar,
  Collapse,
  Fab,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Menu,
  MenuItem,
} from '@mui/material';
import ScheduleDetailModal from '../components/ScheduleDetailModal';
import {
  Save as SaveIcon,
  Edit as EditIcon,
  ContentCopy as ContentCopyIcon,
  Launch as LaunchIcon,
  Schedule as ScheduleIcon,
  Phone as PhoneIcon,
  Link as LinkIcon,
  Business as BusinessIcon,
  Star as StarIcon,
  Favorite as FavoriteIcon,
  LocalFlorist as LocalFloristIcon,
  Close as CloseIcon,
  Chat as ChatIcon,
  Group as GroupIcon,
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
  Send as SendIcon,
  Home as HomeIcon,
  Email as EmailIcon,
  LocationOn as LocationOnIcon,
  AccountBalance as AccountBalanceIcon,
  ShoppingCart as ShoppingCartIcon,
  Info as InfoIcon,
  Help as HelpIcon,
  Settings as SettingsIcon,
  Person as PersonIcon,
  Add as AddIcon,
  Delete as DeleteIcon,
} from '@mui/icons-material';
import { UserContext } from '../components/Layout';
import { API_BASE } from '../utils/auth';

// ScheduleEvent 타입 정의 (Schedule.tsx와 동일하게 최소 필드만)
interface ScheduleEvent {
  id: string;
  title: string;
  date: string;
  time: string;
  type: string;
  description?: string;
  customerName?: string;
  address?: string;
  contact?: string;
  priority: string;
  status: string;
  color?: string;
}

interface CallMemo {
  id: string;
  content: string;
  createdAt: string;
}

interface Contract {
  id: string;
  customerName: string;
  status: string;
  vendorName?: string;
  vendorId?: string;
  orders?: any[];
}

const CALL_MEMO_KEY = 'callMemos';

// 아이콘 선택 옵션
const iconOptions = [
  { value: 'LinkIcon', icon: <LinkIcon />, label: '링크' },
  { value: 'StarIcon', icon: <StarIcon />, label: '별' },
  { value: 'FavoriteIcon', icon: <FavoriteIcon />, label: '하트' },
  { value: 'LocalFloristIcon', icon: <LocalFloristIcon />, label: '꽃' },
  { value: 'BusinessIcon', icon: <BusinessIcon />, label: '비즈니스' },
  { value: 'HomeIcon', icon: <HomeIcon />, label: '홈' },
  { value: 'PhoneIcon', icon: <PhoneIcon />, label: '전화' },
  { value: 'EmailIcon', icon: <EmailIcon />, label: '이메일' },
  { value: 'LocationOnIcon', icon: <LocationOnIcon />, label: '위치' },
  { value: 'AccountBalanceIcon', icon: <AccountBalanceIcon />, label: '은행' },
  { value: 'ShoppingCartIcon', icon: <ShoppingCartIcon />, label: '쇼핑' },
  { value: 'InfoIcon', icon: <InfoIcon />, label: '정보' },
  { value: 'HelpIcon', icon: <HelpIcon />, label: '도움말' },
  { value: 'SettingsIcon', icon: <SettingsIcon />, label: '설정' },
  { value: 'PersonIcon', icon: <PersonIcon />, label: '사용자' },
  { value: 'GroupIcon', icon: <GroupIcon />, label: '그룹' },
];

// 아이콘 맵 정의
const iconMap: { [key: string]: React.ReactElement } = {
  LinkIcon: <LinkIcon />,
  StarIcon: <StarIcon />,
  FavoriteIcon: <FavoriteIcon />,
  LocalFloristIcon: <LocalFloristIcon />,
  BusinessIcon: <BusinessIcon />,
  HomeIcon: <HomeIcon />,
  PhoneIcon: <PhoneIcon />,
  EmailIcon: <EmailIcon />,
  LocationOnIcon: <LocationOnIcon />,
  AccountBalanceIcon: <AccountBalanceIcon />,
  ShoppingCartIcon: <ShoppingCartIcon />,
  InfoIcon: <InfoIcon />,
  HelpIcon: <HelpIcon />,
  SettingsIcon: <SettingsIcon />,
  PersonIcon: <PersonIcon />,
  GroupIcon: <GroupIcon />,
};

// 아이콘 문자열을 실제 아이콘 컴포넌트로 변환하는 함수
const getIconComponent = (iconName: string) => {
  return iconMap[iconName] || <LinkIcon />;
};

const defaultQuickLinks = {
  naverBlog: {
    label: '네이버블로그',
    url: 'https://blog.naver.com/windowgallery',
    value: 'https://blog.naver.com/windowgallery',
    icon: <StarIcon />,
  },
  instagram: {
    label: '인스타그램',
    url: 'https://instagram.com/windowgallery',
    value: 'https://instagram.com/windowgallery',
    icon: <FavoriteIcon />,
  },
  youtube: {
    label: '유튜브',
    url: 'https://youtube.com/@windowgallery',
    value: 'https://youtube.com/@windowgallery',
    icon: <LocalFloristIcon />,
  },
  address: {
    label: '주소안내',
    url: '',
    value: '서울시 강남구 테헤란로 123',
    icon: <BusinessIcon />,
  },
  map: {
    label: '지도안내',
    url: 'https://maps.google.com/?q=서울시+강남구+테헤란로+123',
    value: 'https://maps.google.com/?q=서울시+강남구+테헤란로+123',
    icon: <LinkIcon />,
  },
  account1: {
    label: '기업은행',
    url: '',
    value: '302-054926-01-012 (예금주: 윈도우갤러리/박건식)',
    icon: <BusinessIcon />,
  },
  account2: {
    label: '계좌2',
    url: '',
    value: '',
    icon: <BusinessIcon />,
  },
  account3: {
    label: '계좌3',
    url: '',
    value: '',
    icon: <BusinessIcon />,
  },
};

const Dashboard: React.FC = () => {
  const { nickname } = useContext(UserContext);
  const navigate = useNavigate();
  const [todayEvents, setTodayEvents] = useState<ScheduleEvent[]>([]);
  const [callMemo, setCallMemo] = useState('');
  const [callMemos, setCallMemos] = useState<CallMemo[]>([]);
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [editMode, setEditMode] = useState(false);
  const [quickLinks, setQuickLinks] = useState(defaultQuickLinks);
  const [editLinks, setEditLinks] = useState<any>(quickLinks);
  const [quickLinksOpen, setQuickLinksOpen] = useState(false);
  const [chatOpen, setChatOpen] = useState(false);
  const [chatInput, setChatInput] = useState('');
  const [chatMessages, setChatMessages] = useState([
    {
      id: 1,
      user: '관리자',
      text: '안녕하세요! 무엇을 도와드릴까요? 😊',
      time: '12:00',
    },
    {
      id: 2,
      user: nickname || '나',
      text: '채팅 테스트 메시지입니다.',
      time: '12:01',
    },
  ]);
  const [selectedEvent, setSelectedEvent] = useState<ScheduleEvent | null>(null);
  const [scheduleModalOpen, setScheduleModalOpen] = useState(false);
  const [scheduleExpanded, setScheduleExpanded] = useState(true);
  const [activeChats, setActiveChats] = useState<{ [key: string]: boolean }>({});
  const [chatTargetMessages, setChatTargetMessages] = useState<{ [key: string]: any[] }>({});
  const [selectedScheduleChat, setSelectedScheduleChat] = useState<{ title: string; messages: any[] } | null>(null);
  const [scheduleChatModalOpen, setScheduleChatModalOpen] = useState(false);
  const [selectedScheduleDetail, setSelectedScheduleDetail] = useState<any>(null);
  const [scheduleDetailModalOpen, setScheduleDetailModalOpen] = useState(false);
  const [newScheduleComment, setNewScheduleComment] = useState('');
  const [chatScrollRef, setChatScrollRef] = useState<HTMLDivElement | null>(null);
  const [contextMenu, setContextMenu] = useState<{
    mouseX: number;
    mouseY: number;
    scheduleTitle: string;
  } | null>(null);
  const [unreadChats, setUnreadChats] = useState<{ [key: string]: boolean }>({});
  const [quickLinkDialogOpen, setQuickLinkDialogOpen] = useState(false);
  const [editingQuickLink, setEditingQuickLink] = useState<{ key: string; link: any } | null>(null);
  const [newQuickLink, setNewQuickLink] = useState({
    label: '',
    url: '',
    value: '',
    icon: 'LinkIcon'
  });

  // 전화 메모 불러오기
  useEffect(() => {
    try {
      const saved = localStorage.getItem(CALL_MEMO_KEY);
      if (saved) setCallMemos(JSON.parse(saved));
    } catch { }
  }, []);

  // 스케줄 데이터 fetch
  useEffect(() => {
    const fetchTodayEvents = async () => {
      try {
        const response = await fetch(`${API_BASE}/schedules`);
        if (response.ok) {
          const data: ScheduleEvent[] = await response.json();
          setTodayEvents(
            data
              .filter(ev => ev.date === new Date().toISOString().split('T')[0])
              .sort((a, b) => (a.time || '').localeCompare(b.time || ''))
          );
        }
      } catch (e) {
        setTodayEvents([]);
      }
    };
    fetchTodayEvents();
  }, []);

  // 스케줄 채팅 메시지와 활성채팅 동기화
  useEffect(() => {
    const syncScheduleChats = () => {
      try {
        // localStorage에서 스케줄 데이터 가져오기
        const schedulesData = localStorage.getItem('schedules');
        console.log('Dashboard: localStorage schedules 데이터 확인:', schedulesData ? '있음' : '없음');
        console.log('Dashboard: 현재 activeChats 상태:', activeChats);

        if (schedulesData) {
          const schedules = JSON.parse(schedulesData);
          console.log('Dashboard: 파싱된 스케줄 데이터:', schedules.length, '개');

          // 최근 3일 내의 스케줄 중 채팅이 있는 것들을 필터링
          const today = new Date();
          const threeDaysAgo = new Date(today.getTime() - 3 * 24 * 60 * 60 * 1000);

          console.log('Dashboard: 오늘 날짜:', today.toISOString().split('T')[0]);
          console.log('Dashboard: 3일 전 날짜:', threeDaysAgo.toISOString().split('T')[0]);

          // 모든 스케줄의 날짜와 댓글 정보 확인
          console.log('Dashboard: 모든 스케줄 정보:');
          schedules.forEach((schedule: any, index: number) => {
            console.log(`  ${index + 1}. ${schedule.title} - 날짜: ${schedule.date}, 댓글: ${schedule.comments?.length || 0}개`);
          });

          // 채팅이 있는 모든 스케줄을 최근 댓글 시간순으로 정렬
          const schedulesWithChats = schedules.filter((schedule: any) =>
            schedule.comments && schedule.comments.length > 0
          );

          // 최근 댓글 시간순으로 정렬 (최신순)
          const recentSchedules = schedulesWithChats.sort((a: any, b: any) => {
            const aLatestComment = a.comments[a.comments.length - 1];
            const bLatestComment = b.comments[b.comments.length - 1];
            const aTime = new Date(aLatestComment.timestamp).getTime();
            const bTime = new Date(bLatestComment.timestamp).getTime();
            return bTime - aTime; // 최신순 정렬
          });

          // 3일 내의 채팅만 활성채팅 알림에 표시 (실제 채팅 데이터는 영구 보존)
          const activeSchedules = recentSchedules.filter((schedule: any) => {
            const latestComment = schedule.comments[schedule.comments.length - 1];
            return new Date(latestComment.timestamp) > threeDaysAgo;
          });

          // 3일이 지난 채팅 알림만 활성채팅에서 제거 (실제 채팅 데이터는 보존)
          const oldChatKeys = Object.keys(activeChats).filter(key => {
            if (!key.startsWith('스케줄-')) return false;
            const scheduleTitle = key.replace('스케줄-', '');
            const schedule = schedules.find((s: any) => s.title === scheduleTitle);
            if (!schedule || !schedule.comments || schedule.comments.length === 0) return false;

            const latestComment = schedule.comments[schedule.comments.length - 1];
            return new Date(latestComment.timestamp) <= threeDaysAgo;
          });

          if (oldChatKeys.length > 0) {
            console.log('Dashboard: 3일이 지난 채팅 알림 비활성화 (채팅 데이터는 보존):', oldChatKeys);

            // 활성채팅 알림만 제거 (실제 채팅 데이터는 localStorage에 영구 보존)
            setActiveChats(prev => {
              const newState = { ...prev };
              oldChatKeys.forEach(key => {
                delete newState[key];
              });
              return newState;
            });

            // 읽지 않은 상태도 함께 제거
            setUnreadChats(prev => {
              const newState = { ...prev };
              oldChatKeys.forEach(key => {
                delete newState[key];
              });
              return newState;
            });

            // 대시보드의 채팅 메시지 캐시만 제거 (실제 데이터는 localStorage에 보존)
            setChatTargetMessages(prev => {
              const newState = { ...prev };
              oldChatKeys.forEach(key => {
                delete newState[key];
              });
              return newState;
            });
          }

          console.log('Dashboard: 채팅이 있는 스케줄 (최신순):', recentSchedules.length, '개');
          console.log('Dashboard: 3일 내 활성채팅 알림 대상:', activeSchedules.length, '개');

          // 각 활성 스케줄의 채팅을 활성채팅에 반영
          activeSchedules.forEach((schedule: any) => {
            const chatKey = `스케줄-${schedule.title}`;
            console.log('Dashboard: 스케줄 채팅 키:', chatKey, '채팅 개수:', schedule.comments.length);
            console.log('Dashboard: 현재 activeChats에 해당 키가 있는지:', !!activeChats[chatKey]);

            // 해당 스케줄이 활성채팅에 없으면 추가
            if (!activeChats[chatKey]) {
              console.log('Dashboard: 새로운 스케줄 채팅 활성화:', chatKey);
              setActiveChats(prev => {
                const newState = { ...prev, [chatKey]: true };
                console.log('Dashboard: activeChats 상태 업데이트:', newState);
                return newState;
              });
            }

            // 스케줄의 댓글을 활성채팅 메시지로 변환
            const chatMessages = schedule.comments.map((comment: any) => ({
              id: comment.id,
              user: comment.userName || '사용자',
              text: comment.message,
              time: new Date(comment.timestamp).toLocaleTimeString([], {
                hour: '2-digit',
                minute: '2-digit',
              }),
            }));

            // 기존 메시지와 비교하여 새로운 메시지만 추가
            setChatTargetMessages(prev => {
              const existingMessages = prev[chatKey] || [];
              const newMessages = chatMessages.filter((msg: any) =>
                !existingMessages.some((existing: any) => existing.id === msg.id)
              );

              if (newMessages.length > 0) {
                console.log('Dashboard: 새로운 메시지 추가:', chatKey, newMessages.length, '개');
                // 새로운 메시지가 있으면 읽지 않은 상태로 표시
                setUnreadChats(prev => ({ ...prev, [chatKey]: true }));
                return {
                  ...prev,
                  [chatKey]: [...existingMessages, ...newMessages],
                };
              }
              return prev;
            });
          });
        }
      } catch (error) {
        console.error('스케줄 채팅 동기화 오류:', error);
      }
    };

    // 스케줄 채팅 업데이트 이벤트 리스너
    const handleScheduleChatUpdate = (event: CustomEvent) => {
      console.log('Dashboard: 스케줄 채팅 업데이트 이벤트 수신:', event.detail);
      const { scheduleId, scheduleTitle, comment, updatedEvents } = event.detail;
      const chatKey = `스케줄-${scheduleTitle}`;

      console.log('Dashboard: 이벤트에서 받은 채팅 키:', chatKey);

      // 해당 스케줄이 활성채팅에 없으면 추가
      if (!activeChats[chatKey]) {
        console.log('Dashboard: 이벤트로 새로운 스케줄 채팅 활성화:', chatKey);
        setActiveChats(prev => ({ ...prev, [chatKey]: true }));
      }

      // 새로운 메시지를 활성채팅에 추가
      const newMessage = {
        id: comment.id,
        user: comment.userName || '사용자',
        text: comment.message,
        time: new Date(comment.timestamp).toLocaleTimeString([], {
          hour: '2-digit',
          minute: '2-digit',
        }),
      };

      setChatTargetMessages(prev => {
        const existingMessages = prev[chatKey] || [];
        // 중복 메시지 방지
        if (!existingMessages.some((msg: any) => msg.id === newMessage.id)) {
          console.log('Dashboard: 이벤트로 새로운 메시지 추가:', chatKey, newMessage.text);
          // 새로운 메시지가 추가되면 읽지 않은 상태로 표시
          setUnreadChats(prev => ({ ...prev, [chatKey]: true }));
          return {
            ...prev,
            [chatKey]: [...existingMessages, newMessage],
          };
        }
        return prev;
      });
    };

    // 초기 동기화
    syncScheduleChats();

    // 커스텀 이벤트 리스너 등록
    window.addEventListener('scheduleChatUpdated', handleScheduleChatUpdate as EventListener);

    // 주기적으로 동기화 (5초마다)
    const interval = setInterval(syncScheduleChats, 5000);

    return () => {
      clearInterval(interval);
      window.removeEventListener('scheduleChatUpdated', handleScheduleChatUpdate as EventListener);
    };
  }, []); // 의존성 배열을 비워서 무한 루프 방지

  // 모달이 열릴 때 채팅 스크롤을 맨 아래로 이동
  useEffect(() => {
    if (scheduleDetailModalOpen && chatScrollRef) {
      setTimeout(() => {
        chatScrollRef.scrollTop = chatScrollRef.scrollHeight;
      }, 100);
    }
  }, [scheduleDetailModalOpen, chatScrollRef]);

  // 채팅 메시지가 업데이트될 때 스크롤을 맨 아래로 이동
  useEffect(() => {
    if (scheduleDetailModalOpen && chatScrollRef && selectedScheduleChat?.messages) {
      setTimeout(() => {
        chatScrollRef.scrollTop = chatScrollRef.scrollHeight;
      }, 50);
    }
  }, [selectedScheduleChat?.messages, scheduleDetailModalOpen, chatScrollRef]);

  useEffect(() => {
    try {
      const saved = localStorage.getItem('contracts');
      if (saved) setContracts(JSON.parse(saved));
    } catch { }
  }, []);

  // 진행중 계약만 필터링
  const ongoingContracts = contracts.filter(
    c => c.status === 'signed' || c.status === 'in_progress'
  );

  // 진행중 계약 중 '발주처 분리 안된' 항목만 필터링
  const unassignedContracts = contracts.filter(
    c => !c.vendorName && !c.vendorId && (!c.orders || c.orders.length === 0)
  );

  // 메모 저장
  const handleSaveMemo = () => {
    if (!callMemo.trim()) return;
    const newMemo: CallMemo = {
      id: `memo-${Date.now()}`,
      content: callMemo,
      createdAt: new Date().toLocaleString(),
    };
    const updated = [newMemo, ...callMemos].slice(0, 10); // 최근 10개만
    setCallMemos(updated);
    localStorage.setItem(CALL_MEMO_KEY, JSON.stringify(updated));
    setCallMemo('');
  };

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  const handleSaveLinks = () => {
    setQuickLinks(editLinks);
    setEditMode(false);
  };

  // 빠른링크 추가/편집 다이얼로그 열기
  const handleAddQuickLink = () => {
    setEditingQuickLink(null);
    setNewQuickLink({
      label: '',
      url: '',
      value: '',
      icon: 'LinkIcon'
    });
    setQuickLinkDialogOpen(true);
  };

  // 빠른링크 편집
  const handleEditQuickLink = (key: string, link: any) => {
    setEditingQuickLink({ key, link });

    // 기존 아이콘을 문자열로 변환 (간단한 방식으로 처리)
    let iconString = 'LinkIcon';
    if (link.icon && link.icon.type) {
      const iconType = (link.icon.type as any).name || '';
      if (iconType) {
        // 아이콘 타입에 따라 매핑
        const iconMapping: { [key: string]: string } = {
          'Star': 'StarIcon',
          'Favorite': 'FavoriteIcon',
          'LocalFlorist': 'LocalFloristIcon',
          'Business': 'BusinessIcon',
          'Link': 'LinkIcon',
          'Home': 'HomeIcon',
          'Phone': 'PhoneIcon',
          'Email': 'EmailIcon',
          'LocationOn': 'LocationOnIcon',
          'AccountBalance': 'AccountBalanceIcon',
          'ShoppingCart': 'ShoppingCartIcon',
          'Info': 'InfoIcon',
          'Help': 'HelpIcon',
          'Settings': 'SettingsIcon',
          'Person': 'PersonIcon',
          'Group': 'GroupIcon',
        };
        iconString = iconMapping[iconType] || 'LinkIcon';
      }
    }

    setNewQuickLink({
      label: link.label,
      url: link.url || '',
      value: link.value || link.url || '',
      icon: iconString
    });
    setQuickLinkDialogOpen(true);
  };

  // 빠른링크 삭제
  const handleDeleteQuickLink = (key: string) => {
    if (window.confirm('정말로 이 항목을 삭제하시겠습니까?')) {
      const updatedLinks = { ...editLinks };
      delete updatedLinks[key];
      setEditLinks(updatedLinks);
    }
  };

  // 빠른링크 저장
  const handleSaveQuickLink = () => {
    if (!newQuickLink.label.trim()) {
      alert('제목을 입력해주세요.');
      return;
    }

    const iconComponent = getIconComponent(newQuickLink.icon);
    const linkData = {
      label: newQuickLink.label.trim(),
      url: newQuickLink.url.trim(),
      value: newQuickLink.value.trim() || newQuickLink.url.trim(),
      icon: iconComponent,
    };

    if (editingQuickLink) {
      // 편집 모드
      const updatedLinks = { ...editLinks };
      updatedLinks[editingQuickLink.key] = linkData;
      setEditLinks(updatedLinks);
    } else {
      // 추가 모드
      const newKey = `custom_${Date.now()}`;
      const updatedLinks = { ...editLinks, [newKey]: linkData };
      setEditLinks(updatedLinks);
    }

    setQuickLinkDialogOpen(false);
    setEditingQuickLink(null);
    setNewQuickLink({
      label: '',
      url: '',
      value: '',
      icon: 'LinkIcon'
    });
  };



  const handleSendChat = () => {
    if (!chatInput.trim()) return;
    setChatMessages([
      ...chatMessages,
      {
        id: Date.now(),
        user: nickname || '나',
        text: chatInput,
        time: new Date().toLocaleTimeString([], {
          hour: '2-digit',
          minute: '2-digit',
        }),
      },
    ]);
    setChatInput('');
  };

  const handleScheduleClick = (event: ScheduleEvent) => {
    setSelectedEvent(event);
    setScheduleModalOpen(true);
  };

  const handleCloseScheduleModal = () => {
    setScheduleModalOpen(false);
    setSelectedEvent(null);
  };

  // 참여자 더미 데이터 → 현재 로그인 닉네임 반영
  const chatParticipants = [
    { name: '관리자', color: '#FF4757' },
    { name: nickname || '나', color: '#FF6B9D' },
  ];

  const handleScheduleChatClick = (chatKey: string) => {
    const scheduleTitle = chatKey.replace('스케줄-', '');
    const messages = chatTargetMessages[chatKey] || [];

    // localStorage에서 스케줄 상세 정보 가져오기
    const schedulesData = localStorage.getItem('schedules');
    if (schedulesData) {
      const schedules = JSON.parse(schedulesData);
      const scheduleDetail = schedules.find((s: any) => s.title === scheduleTitle);

      if (scheduleDetail) {
        setSelectedScheduleDetail(scheduleDetail);
        setSelectedScheduleChat({ title: scheduleTitle, messages });
        setScheduleDetailModalOpen(true);
      }
    }
  };

  const handleCloseScheduleChatModal = () => {
    setScheduleChatModalOpen(false);
    setSelectedScheduleChat(null);
  };

  const handleCloseScheduleDetailModal = () => {
    setScheduleDetailModalOpen(false);
    setSelectedScheduleDetail(null);
    setSelectedScheduleChat(null);
    setNewScheduleComment('');
  };

  const handleScheduleCommentSubmit = () => {
    if (!newScheduleComment.trim() || !selectedScheduleDetail) return;

    const comment = {
      id: Date.now().toString(),
      eventId: selectedScheduleDetail.id,
      userId: 'current_user',
      userName: nickname || '사용자',
      message: newScheduleComment,
      timestamp: new Date().toISOString(),
    };

    // localStorage의 스케줄 데이터 업데이트
    const schedulesData = localStorage.getItem('schedules');
    if (schedulesData) {
      const schedules = JSON.parse(schedulesData);
      const updatedSchedules = schedules.map((schedule: any) => {
        if (schedule.id === selectedScheduleDetail.id) {
          return {
            ...schedule,
            comments: [...(schedule.comments || []), comment],
            updatedAt: new Date().toISOString(),
          };
        }
        return schedule;
      });

      localStorage.setItem('schedules', JSON.stringify(updatedSchedules));

      // 활성채팅 메시지 업데이트
      const chatKey = `스케줄-${selectedScheduleDetail.title}`;
      const newMessage = {
        id: comment.id,
        user: comment.userName,
        text: comment.message,
        time: new Date(comment.timestamp).toLocaleTimeString([], {
          hour: '2-digit',
          minute: '2-digit',
        }),
      };

      setChatTargetMessages(prev => ({
        ...prev,
        [chatKey]: [...(prev[chatKey] || []), newMessage],
      }));

      // 선택된 스케줄 상세 정보 업데이트
      setSelectedScheduleDetail((prev: any) => prev ? {
        ...prev,
        comments: [...(prev.comments || []), comment],
      } : null);

      // 선택된 채팅 메시지 업데이트
      setSelectedScheduleChat(prev => prev ? {
        ...prev,
        messages: [...prev.messages, newMessage],
      } : null);

      // 커스텀 이벤트 발생
      const scheduleChatUpdateEvent = new CustomEvent('scheduleChatUpdated', {
        detail: {
          scheduleId: selectedScheduleDetail.id,
          scheduleTitle: selectedScheduleDetail.title,
          comment: comment,
          updatedEvents: updatedSchedules
        }
      });

      window.dispatchEvent(scheduleChatUpdateEvent);
    }

    setNewScheduleComment('');

    // 채팅 스크롤을 맨 아래로 이동
    setTimeout(() => {
      if (chatScrollRef) {
        chatScrollRef.scrollTop = chatScrollRef.scrollHeight;
      }
    }, 100);
  };

  const handleScheduleChatContextMenu = (event: React.MouseEvent, scheduleTitle: string) => {
    event.preventDefault();
    setContextMenu({
      mouseX: event.clientX + 2,
      mouseY: event.clientY - 6,
      scheduleTitle,
    });
  };

  const handleContextMenuClose = () => {
    setContextMenu(null);
  };

  const handleViewSchedule = (scheduleTitle: string) => {
    console.log('Dashboard: handleViewSchedule 호출됨, scheduleTitle:', scheduleTitle);

    // localStorage에 스케줄 정보 저장 (스케줄 페이지에서 사용)
    const schedulesData = localStorage.getItem('schedules');
    console.log('Dashboard: localStorage schedules 데이터:', schedulesData ? '있음' : '없음');

    if (schedulesData) {
      const schedules = JSON.parse(schedulesData);
      console.log('Dashboard: 파싱된 스케줄 개수:', schedules.length);

      const schedule = schedules.find((s: any) => s.title === scheduleTitle);
      console.log('Dashboard: 찾은 스케줄:', schedule);

      if (schedule) {
        localStorage.setItem('selectedScheduleForView', JSON.stringify(schedule));
        console.log('Dashboard: localStorage에 선택된 스케줄 저장됨');
        console.log('Dashboard: 스케줄 페이지로 이동 시도:', schedule.title);

        // React Router를 사용하여 스케줄 페이지로 이동
        navigate('/schedule');
        console.log('Dashboard: navigate 호출 완료');
      } else {
        console.log('Dashboard: 해당 제목의 스케줄을 찾을 수 없음:', scheduleTitle);
      }
    } else {
      console.log('Dashboard: localStorage에 schedules 데이터가 없음');
    }
    handleContextMenuClose();
  };

  return (
    <Box sx={{ p: 3, position: 'relative', minHeight: '100vh' }}>
      {/* 헤더 */}
      <Box sx={{ mb: 4, textAlign: 'center' }}>
        <Typography
          variant="h3"
          sx={{
            fontWeight: 800,
            background: 'linear-gradient(135deg, #FF6B9D 0%, #FF4757 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
            mb: 1,
          }}
        >
          윈도우갤러리 대시보드
        </Typography>
        <Typography
          variant="h6"
          sx={{
            color: 'rgba(255, 255, 255, 0.7)',
            fontWeight: 500,
          }}
        >
          오늘도 즐거운 하루 되세요! 🌸
        </Typography>
      </Box>

      {/* 상단 카드 영역 */}
      <Grid container spacing={3} sx={{ mb: 2 }}>
        <Grid item xs={12} md={6}>
          <Card
            sx={{
              background: '#23232a',
              borderRadius: 4,
              boxShadow: '0 4px 24px rgba(255, 107, 157, 0.10)',
              border: '1px solid rgba(255, 107, 157, 0.15)',
              color: 'white',
            }}
          >
            <CardContent
              sx={{
                p: 3,
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <Avatar
                  sx={{
                    background:
                      'linear-gradient(135deg, #FF6B9D 0%, #FF4757 100%)',
                    mr: 2,
                    width: 40,
                    height: 40,
                    cursor: 'pointer',
                    transition: 'transform 0.2s ease-in-out',
                    '&:hover': {
                      transform: 'scale(1.05)',
                    },
                  }}
                  onClick={() => setScheduleExpanded(!scheduleExpanded)}
                >
                  <ScheduleIcon />
                </Avatar>
                <Typography
                  variant="h6"
                  sx={{
                    fontWeight: 700,
                    color: 'white',
                    flex: 1,
                  }}
                >
                  오늘의 스케줄
                </Typography>
                <IconButton
                  onClick={() => setScheduleExpanded(!scheduleExpanded)}
                  sx={{
                    color: 'rgba(255, 255, 255, 0.7)',
                    '&:hover': {
                      color: '#FF6B9D',
                      backgroundColor: 'rgba(255, 107, 157, 0.1)',
                    },
                    transition: 'all 0.2s ease-in-out',
                    transform: scheduleExpanded ? 'rotate(0deg)' : 'rotate(180deg)',
                  }}
                >
                  <ExpandMoreIcon />
                </IconButton>
              </Box>

              <Collapse in={scheduleExpanded} timeout="auto" unmountOnExit>
                <Box sx={{ flex: 1, overflow: 'auto' }}>
                  {todayEvents.length === 0 ? (
                    <Box sx={{ textAlign: 'center', py: 4 }}>
                      <LocalFloristIcon
                        sx={{
                          fontSize: 48,
                          color: 'rgba(255, 107, 157, 0.5)',
                          mb: 2,
                        }}
                      />
                      <Typography color="rgba(255, 255, 255, 0.6)">
                        오늘 등록된 일정이 없습니다.
                      </Typography>
                    </Box>
                  ) : (
                    <List dense>
                      {todayEvents.map(ev => (
                        <ListItem
                          key={ev.id}
                          onClick={() => handleScheduleClick(ev)}
                          sx={{
                            py: 1,
                            mb: 1,
                            background: 'rgba(255, 255, 255, 0.05)',
                            borderRadius: 2,
                            border: '1px solid rgba(255, 107, 157, 0.1)',
                            cursor: 'pointer',
                            transition: 'all 0.2s ease-in-out',
                            '&:hover': {
                              background: 'rgba(255, 107, 157, 0.1)',
                              border: '1px solid rgba(255, 107, 157, 0.3)',
                              transform: 'translateY(-1px)',
                            },
                          }}
                        >
                          <ListItemText
                            primary={
                              <Box
                                component="span"
                                sx={{
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: 1,
                                  mb: 0.5,
                                }}
                              >
                                <Chip
                                  label={ev.type}
                                  size="small"
                                  sx={{
                                    background:
                                      ev.color ||
                                      'linear-gradient(135deg, #FF6B9D 0%, #FF4757 100%)',
                                    color: 'white',
                                    fontWeight: 600,
                                  }}
                                />
                                <Typography
                                  component="span"
                                  sx={{ fontWeight: 600, color: 'white' }}
                                >
                                  {ev.time}
                                </Typography>
                              </Box>
                            }
                            secondary={
                              <Box component="span">
                                <Tooltip title="클릭하여 상세보기" arrow>
                                  <Typography
                                    component="span"
                                    sx={{
                                      color: 'rgba(255, 255, 255, 0.9)',
                                      fontWeight: 500,
                                      textDecoration: 'underline',
                                      textDecorationColor: 'rgba(255, 107, 157, 0.5)',
                                      '&:hover': {
                                        color: '#FF6B9D',
                                        textDecorationColor: '#FF6B9D',
                                      },
                                    }}
                                  >
                                    {ev.title}
                                  </Typography>
                                </Tooltip>
                                {ev.customerName && (
                                  <Typography
                                    component="span"
                                    sx={{
                                      color: 'rgba(255, 107, 157, 0.8)',
                                      fontSize: '0.875rem',
                                    }}
                                  >
                                    {ev.customerName}
                                  </Typography>
                                )}
                                {ev.description && (
                                  <Typography
                                    component="span"
                                    sx={{
                                      color: 'rgba(255, 255, 255, 0.6)',
                                      fontSize: '0.875rem',
                                      mt: 0.5,
                                    }}
                                  >
                                    {ev.description}
                                  </Typography>
                                )}
                              </Box>
                            }
                          />
                        </ListItem>
                      ))}
                    </List>
                  )}
                </Box>
              </Collapse>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={6}>
          <Card
            sx={{
              background: '#23232a',
              borderRadius: 4,
              boxShadow: '0 4px 24px rgba(255, 107, 157, 0.10)',
              border: '1px solid rgba(255, 107, 157, 0.15)',
              color: 'white',
            }}
          >
            <CardContent sx={{ p: 3 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <Avatar
                  sx={{
                    background:
                      'linear-gradient(135deg, #FF6B9D 0%, #FF4757 100%)',
                    mr: 2,
                    width: 40,
                    height: 40,
                  }}
                >
                  <PhoneIcon />
                </Avatar>
                <Typography
                  variant="h6"
                  sx={{
                    fontWeight: 700,
                    color: 'white',
                  }}
                >
                  전화통화 메모
                </Typography>
              </Box>

              <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
                <TextField
                  fullWidth
                  size="small"
                  placeholder="통화 내용을 입력하세요"
                  value={callMemo}
                  onChange={e => setCallMemo(e.target.value)}
                  onKeyDown={e => {
                    if (e.key === 'Enter') handleSaveMemo();
                  }}
                  multiline
                  minRows={1}
                  maxRows={3}
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      borderRadius: 2,
                      background: 'rgba(255, 255, 255, 0.05)',
                      '& fieldset': {
                        borderColor: 'rgba(255, 107, 157, 0.3)',
                      },
                      '&:hover fieldset': {
                        borderColor: '#FF6B9D',
                      },
                      '&.Mui-focused fieldset': {
                        borderColor: '#FF6B9D',
                      },
                    },
                    '& .MuiInputBase-input': {
                      color: 'white',
                    },
                  }}
                />
                <Button
                  variant="contained"
                  onClick={handleSaveMemo}
                  sx={{
                    minWidth: 80,
                    background:
                      'linear-gradient(135deg, #FF6B9D 0%, #FF4757 100%)',
                    borderRadius: 2,
                    '&:hover': {
                      background:
                        'linear-gradient(135deg, #FFB3D1 0%, #FF6B7A 100%)',
                    },
                  }}
                >
                  저장
                </Button>
              </Box>

              <Box sx={{ flex: 1, overflow: 'auto' }}>
                {callMemos.length === 0 ? (
                  <Box sx={{ textAlign: 'center', py: 4 }}>
                    <FavoriteIcon
                      sx={{
                        fontSize: 48,
                        color: 'rgba(255, 107, 157, 0.5)',
                        mb: 2,
                      }}
                    />
                    <Typography color="rgba(255, 255, 255, 0.6)">
                      최근 메모 없음
                    </Typography>
                  </Box>
                ) : (
                  <List dense sx={{ maxHeight: 220, overflowY: 'auto', pr: 1 }}>
                    {callMemos.map(memo => (
                      <ListItem
                        key={memo.id}
                        sx={{
                          mb: 1,
                          background: 'rgba(255, 255, 255, 0.05)',
                          borderRadius: 2,
                          border: '1px solid rgba(255, 107, 157, 0.1)',
                        }}
                      >
                        <ListItemText
                          primary={memo.content}
                          secondary={memo.createdAt}
                          primaryTypographyProps={{
                            sx: { color: 'white', fontWeight: 500 }
                          }}
                          secondaryTypographyProps={{
                            sx: {
                              color: 'rgba(255, 255, 255, 0.5)',
                              fontSize: '0.75rem',
                            }
                          }}
                        />
                      </ListItem>
                    ))}
                  </List>
                )}
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* 하단 2분할 영역 */}
      <Grid container spacing={3}>
        <Grid item xs={12} md={6} sx={{ position: 'relative' }}>
          {/* 좌측: 링크/정보공유 */}
          <Collapse in={quickLinksOpen}>
            <Card
              sx={{
                background: '#23232a',
                borderRadius: 4,
                boxShadow: '0 4px 24px rgba(255, 107, 157, 0.10)',
                border: '1px solid rgba(255, 107, 157, 0.15)',
                color: 'white',
              }}
            >
              <CardContent sx={{ p: 3 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                  <Avatar
                    sx={{
                      background:
                        'linear-gradient(135deg, #FF6B9D 0%, #FF4757 100%)',
                      mr: 2,
                      width: 40,
                      height: 40,
                    }}
                  >
                    <LinkIcon />
                  </Avatar>
                  <Typography
                    variant="h6"
                    sx={{
                      flexGrow: 1,
                      fontWeight: 700,
                      color: 'white',
                    }}
                  >
                    빠른링크/정보공유
                  </Typography>
                  <Tooltip title="닫기">
                    <IconButton
                      onClick={() => setQuickLinksOpen(false)}
                      sx={{ color: '#FF6B9D', ml: 1 }}
                    >
                      <CloseIcon />
                    </IconButton>
                  </Tooltip>
                  {editMode ? (
                    <>
                      <Tooltip title="항목 추가">
                        <IconButton
                          onClick={handleAddQuickLink}
                          sx={{
                            color: '#4CAF50',
                            '&:hover': {
                              background: 'rgba(76, 175, 80, 0.1)',
                            },
                          }}
                        >
                          <AddIcon />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="저장">
                        <IconButton
                          onClick={handleSaveLinks}
                          sx={{
                            color: '#FF6B9D',
                            '&:hover': {
                              background: 'rgba(255, 107, 157, 0.1)',
                            },
                          }}
                        >
                          <SaveIcon />
                        </IconButton>
                      </Tooltip>
                    </>
                  ) : (
                    <Button
                      variant="outlined"
                      size="small"
                      startIcon={<EditIcon />}
                      onClick={() => {
                        setEditLinks(quickLinks);
                        setEditMode(true);
                      }}
                      sx={{
                        borderColor: '#FF6B9D',
                        color: '#FF6B9D',
                        borderRadius: 2,
                        '&:hover': {
                          borderColor: '#FFB3D1',
                          background: 'rgba(255, 107, 157, 0.1)',
                        },
                      }}
                    >
                      수정
                    </Button>
                  )}
                </Box>

                <Grid container spacing={2}>
                  {Object.entries(quickLinks).map(([key, link]) => (
                    <Grid item xs={12} sm={6} md={4} key={key}>
                      <Box
                        sx={{
                          p: 2,
                          background: 'rgba(255, 255, 255, 0.05)',
                          borderRadius: 2,
                          border: '1px solid rgba(255, 107, 157, 0.1)',
                          transition: 'all 0.3s ease',
                          '&:hover': {
                            background: 'rgba(255, 107, 157, 0.1)',
                            transform: 'translateY(-2px)',
                          },
                        }}
                      >
                        <Box
                          sx={{ display: 'flex', alignItems: 'center', mb: 1 }}
                        >
                          <Box sx={{ color: '#FF6B9D', mr: 1 }}>
                            {editMode && typeof link.icon === 'string'
                              ? getIconComponent(link.icon)
                              : link.icon}
                          </Box>
                          <Typography
                            sx={{
                              color: 'white',
                              fontWeight: 600,
                              fontSize: '0.875rem',
                            }}
                          >
                            {link.label}
                          </Typography>
                        </Box>

                        {editMode ? (
                          <TextField
                            size="small"
                            value={
                              editLinks[key as keyof typeof editLinks].value
                            }
                            onChange={e => {
                              const newLinks = { ...editLinks };
                              const newValue = e.target.value;
                              if (link.url !== undefined) {
                                newLinks[key as keyof typeof editLinks] = {
                                  ...link,
                                  value: newValue,
                                  url: newValue,
                                };
                              } else {
                                newLinks[key as keyof typeof editLinks] = {
                                  ...link,
                                  value: newValue,
                                };
                              }
                              setEditLinks(newLinks);
                            }}
                            sx={{
                              width: '100%',
                              '& .MuiOutlinedInput-root': {
                                borderRadius: 1,
                                background: 'rgba(255, 255, 255, 0.05)',
                                '& fieldset': {
                                  borderColor: 'rgba(255, 107, 157, 0.3)',
                                },
                              },
                              '& .MuiInputBase-input': {
                                color: 'white',
                                fontSize: '0.875rem',
                              },
                            }}
                          />
                        ) : (
                          <Typography
                            sx={{
                              color: 'rgba(255, 255, 255, 0.7)',
                              fontSize: '0.875rem',
                              mb: 1,
                              whiteSpace: 'pre-line',
                              wordBreak: 'break-all',
                            }}
                          >
                            {link.url || link.value}
                          </Typography>
                        )}

                        <Box sx={{ display: 'flex', gap: 0.5 }}>
                          <Tooltip title="복사">
                            <IconButton
                              size="small"
                              onClick={() => handleCopy(link.url || link.value)}
                              sx={{
                                color: 'rgba(255, 255, 255, 0.6)',
                                '&:hover': {
                                  color: '#FF6B9D',
                                  background: 'rgba(255, 107, 157, 0.1)',
                                },
                              }}
                            >
                              <ContentCopyIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                          {link.url && link.url.trim() !== '' && (
                            <Tooltip title="링크 열기">
                              <IconButton
                                size="small"
                                onClick={() => window.open(link.url, '_blank')}
                                sx={{
                                  color: 'rgba(255, 255, 255, 0.6)',
                                  '&:hover': {
                                    color: '#FF6B9D',
                                    background: 'rgba(255, 107, 157, 0.1)',
                                  },
                                }}
                              >
                                <LaunchIcon fontSize="small" />
                              </IconButton>
                            </Tooltip>
                          )}
                          {editMode && (
                            <>
                              <Tooltip title="편집">
                                <IconButton
                                  size="small"
                                  onClick={() => handleEditQuickLink(key, link)}
                                  sx={{
                                    color: 'rgba(255, 255, 255, 0.6)',
                                    '&:hover': {
                                      color: '#2196F3',
                                      background: 'rgba(33, 150, 243, 0.1)',
                                    },
                                  }}
                                >
                                  <EditIcon fontSize="small" />
                                </IconButton>
                              </Tooltip>
                              <Tooltip title="삭제">
                                <IconButton
                                  size="small"
                                  onClick={() => handleDeleteQuickLink(key)}
                                  sx={{
                                    color: 'rgba(255, 255, 255, 0.6)',
                                    '&:hover': {
                                      color: '#f44336',
                                      background: 'rgba(244, 67, 54, 0.1)',
                                    },
                                  }}
                                >
                                  <DeleteIcon fontSize="small" />
                                </IconButton>
                              </Tooltip>
                            </>
                          )}

                        </Box>
                      </Box>
                    </Grid>
                  ))}
                </Grid>
              </CardContent>
            </Card>
          </Collapse>
          {/* 플로팅 열기 버튼 */}
          {!quickLinksOpen && (
            <Fab
              variant="extended"
              color="secondary"
              onClick={() => setQuickLinksOpen(true)}
              sx={{
                position: 'absolute',
                left: 0,
                bottom: -56,
                zIndex: 10,
                background: 'linear-gradient(135deg, #FF6B9D 0%, #FF4757 100%)',
                color: 'white',
                fontWeight: 700,
                boxShadow: '0 4px 16px rgba(255, 107, 157, 0.15)',
                '&:hover': {
                  background:
                    'linear-gradient(135deg, #FFB3D1 0%, #FF6B7A 100%)',
                },
              }}
            >
              <LinkIcon sx={{ mr: 1 }} /> 빠른링크/정보공유 열기
            </Fab>
          )}
        </Grid>
        <Grid item xs={12} md={6}>
          {/* 우측: 활성 채팅 영역 */}
          <Card
            sx={{
              background: '#23232a',
              borderRadius: 4,
              boxShadow: '0 4px 24px rgba(255, 107, 157, 0.10)',
              border: '1px solid rgba(255, 107, 157, 0.15)',
              color: 'white',
              minHeight: 220,
            }}
          >
            <CardContent sx={{ p: 3 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <Avatar
                  sx={{
                    background:
                      'linear-gradient(135deg, #4CAF50 0%, #45a049 100%)',
                    mr: 2,
                    width: 40,
                    height: 40,
                  }}
                >
                  <ChatIcon />
                </Avatar>
                <Typography
                  variant="h6"
                  sx={{
                    fontWeight: 700,
                    color: 'white',
                  }}
                >
                  활성 채팅
                  {Object.keys(unreadChats).filter(key => unreadChats[key]).length > 0 && (
                    <Box
                      component="span"
                      sx={{
                        ml: 1,
                        px: 1,
                        py: 0.25,
                        borderRadius: 1,
                        background: '#FFC107',
                        color: '#000',
                        fontSize: '0.75rem',
                        fontWeight: 600,
                      }}
                    >
                      {Object.keys(unreadChats).filter(key => unreadChats[key]).length}
                    </Box>
                  )}
                </Typography>
              </Box>

              <Box sx={{ maxHeight: 300, overflowY: 'auto' }}>
                {/* 활성 채팅 목록 */}
                <List dense>
                  {/* 스케줄 채팅 표시 - 최근순으로 정렬하고 최근 10개만 */}
                  {Object.entries(activeChats)
                    .filter(([key, isActive]) => isActive && key.startsWith('스케줄-'))
                    .sort(([keyA], [keyB]) => {
                      // 최근 메시지 시간순으로 정렬
                      const messagesA = chatTargetMessages[keyA] || [];
                      const messagesB = chatTargetMessages[keyB] || [];
                      const lastMessageA = messagesA[messagesA.length - 1];
                      const lastMessageB = messagesB[messagesB.length - 1];

                      if (!lastMessageA && !lastMessageB) return 0;
                      if (!lastMessageA) return 1;
                      if (!lastMessageB) return -1;

                      // 메시지 ID로 시간 비교 (ID가 타임스탬프 기반)
                      return parseInt(lastMessageB.id) - parseInt(lastMessageA.id);
                    })
                    .slice(0, 10) // 최근 10개만 표시
                    .map(([key, isActive]) => {
                      const scheduleTitle = key.replace('스케줄-', '');
                      const messages = chatTargetMessages[key] || [];
                      const lastMessage = messages[messages.length - 1];
                      const isUnread = unreadChats[key];

                      // 스케줄 데이터에서 날짜 정보 가져오기
                      const schedulesData = localStorage.getItem('schedules');
                      let scheduleDate = '';
                      if (schedulesData) {
                        const schedules = JSON.parse(schedulesData);
                        const schedule = schedules.find((s: any) => s.title === scheduleTitle);
                        if (schedule) {
                          scheduleDate = new Date(schedule.date).toLocaleDateString('ko-KR', {
                            month: 'short',
                            day: 'numeric',
                          });
                        }
                      }

                      return (
                        <ListItem
                          key={key}
                          onClick={() => {
                            handleScheduleChatClick(key);
                            // 클릭 시 읽음 처리
                            setUnreadChats(prev => ({ ...prev, [key]: false }));
                          }}
                          onContextMenu={(e) => handleScheduleChatContextMenu(e, scheduleTitle)}
                          sx={{
                            py: 1,
                            mb: 1,
                            background: isUnread ? 'rgba(255, 193, 7, 0.2)' : 'rgba(255, 107, 157, 0.1)',
                            borderRadius: 2,
                            border: isUnread ? '1px solid rgba(255, 193, 7, 0.4)' : '1px solid rgba(255, 107, 157, 0.2)',
                            cursor: 'pointer',
                            transition: 'all 0.2s ease-in-out',
                            '&:hover': {
                              background: isUnread ? 'rgba(255, 193, 7, 0.3)' : 'rgba(255, 107, 157, 0.2)',
                              border: isUnread ? '1px solid rgba(255, 193, 7, 0.6)' : '1px solid rgba(255, 107, 157, 0.4)',
                            },
                          }}
                        >
                          <ListItemText
                            primary={
                              <Box component="span" sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                <Box component="span" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                  <Box component="span" sx={{ color: isUnread ? '#FFC107' : '#FF6B9D' }}>
                                    <ScheduleIcon />
                                  </Box>
                                  <Box component="span">
                                    <Typography
                                      component="span"
                                      sx={{
                                        fontWeight: 600,
                                        color: 'white',
                                        fontSize: '0.875rem',
                                      }}
                                    >
                                      {scheduleTitle}
                                    </Typography>
                                    {scheduleDate && (
                                      <Typography
                                        component="span"
                                        sx={{
                                          color: 'rgba(255, 255, 255, 0.6)',
                                          fontSize: '0.7rem',
                                          mt: 0.5,
                                        }}
                                      >
                                        {scheduleDate}
                                      </Typography>
                                    )}
                                  </Box>
                                </Box>
                                <Box component="span" sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                  {isUnread && (
                                    <Box
                                      component="span"
                                      sx={{
                                        width: 8,
                                        height: 8,
                                        borderRadius: '50%',
                                        background: '#FFC107',
                                        animation: 'pulse 2s infinite',
                                        '@keyframes pulse': {
                                          '0%': { opacity: 1 },
                                          '50%': { opacity: 0.5 },
                                          '100%': { opacity: 1 },
                                        },
                                      }}
                                    />
                                  )}
                                  <Box
                                    component="span"
                                    sx={{
                                      width: 8,
                                      height: 8,
                                      borderRadius: '50%',
                                      background: isUnread ? '#FFC107' : '#FF6B9D',
                                      animation: 'pulse 2s infinite',
                                      '@keyframes pulse': {
                                        '0%': { opacity: 1 },
                                        '50%': { opacity: 0.5 },
                                        '100%': { opacity: 1 },
                                      },
                                    }}
                                  />
                                  <IconButton
                                    size="small"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setActiveChats(prev => ({ ...prev, [key]: false }));
                                      setUnreadChats(prev => ({ ...prev, [key]: false }));
                                    }}
                                    sx={{
                                      color: '#f44336',
                                      '&:hover': {
                                        background: 'rgba(244, 67, 54, 0.1)',
                                      },
                                    }}
                                  >
                                    <CloseIcon fontSize="small" />
                                  </IconButton>
                                </Box>
                              </Box>
                            }
                            secondary={
                              <Box component="span" sx={{ mt: 1 }}>
                                <Typography
                                  component="span"
                                  sx={{
                                    color: 'rgba(255, 255, 255, 0.7)',
                                    fontSize: '0.75rem',
                                    mb: 0.5,
                                  }}
                                >
                                  최근 메시지: {lastMessage?.text || '대화 시작됨'}
                                </Typography>
                                <Typography
                                  component="span"
                                  sx={{
                                    color: isUnread ? 'rgba(255, 193, 7, 0.8)' : 'rgba(255, 107, 157, 0.8)',
                                    fontSize: '0.7rem',
                                  }}
                                >
                                  메시지 {messages.length || 1}개
                                  {isUnread && ' • 새 메시지'}
                                </Typography>
                              </Box>
                            }
                          />
                        </ListItem>
                      );
                    })}

                  {/* 활성 채팅이 없을 때 안내 메시지 */}
                  {Object.keys(activeChats).filter(key => activeChats[key]).length === 0 && (
                    <Box sx={{ textAlign: 'center', py: 4 }}>
                      <ChatIcon
                        sx={{
                          fontSize: 48,
                          color: 'rgba(76, 175, 80, 0.5)',
                          mb: 2,
                        }}
                      />
                      <Typography color="rgba(255, 255, 255, 0.6)">
                        현재 진행 중인 채팅이 없습니다.
                      </Typography>
                      <Typography
                        color="rgba(76, 175, 80, 0.8)"
                        sx={{ fontSize: '0.875rem', mt: 1 }}
                      >
                        스케줄 항목을 클릭하여 채팅을 시작하세요.
                      </Typography>
                    </Box>
                  )}
                </List>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* 스케줄 채팅 상세 모달 */}
      <Dialog
        open={scheduleChatModalOpen}
        onClose={handleCloseScheduleChatModal}
        maxWidth="md"
        fullWidth
        PaperProps={{
          sx: {
            backgroundColor: '#23232a',
            color: '#e0e6ed',
            borderRadius: 3,
          },
        }}
      >
        <DialogTitle
          sx={{
            background: 'linear-gradient(135deg, #FF6B9D 0%, #FF4757 100%)',
            color: 'white',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <ScheduleIcon />
            <Typography variant="h6" sx={{ fontWeight: 700 }}>
              {selectedScheduleChat?.title} - 채팅 내역
            </Typography>
          </Box>
          <IconButton
            onClick={handleCloseScheduleChatModal}
            sx={{ color: 'white' }}
          >
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent sx={{ p: 3 }}>
          <Box sx={{ maxHeight: 400, overflowY: 'auto' }}>
            {selectedScheduleChat?.messages && selectedScheduleChat.messages.length > 0 ? (
              selectedScheduleChat.messages.map((message, index) => (
                <Box
                  key={message.id || index}
                  sx={{
                    mb: 2,
                    p: 2,
                    background: 'rgba(255, 255, 255, 0.05)',
                    borderRadius: 2,
                    border: '1px solid rgba(255, 107, 157, 0.2)',
                  }}
                >
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
                    <Typography
                      sx={{
                        fontWeight: 600,
                        color: '#FF6B9D',
                        fontSize: '0.875rem',
                      }}
                    >
                      {message.user}
                    </Typography>
                    <Typography
                      sx={{
                        color: 'rgba(255, 255, 255, 0.6)',
                        fontSize: '0.75rem',
                      }}
                    >
                      {message.time}
                    </Typography>
                  </Box>
                  <Typography
                    sx={{
                      color: 'white',
                      fontSize: '0.875rem',
                      whiteSpace: 'pre-wrap',
                      wordBreak: 'break-word',
                    }}
                  >
                    {message.text}
                  </Typography>
                </Box>
              ))
            ) : (
              <Box sx={{ textAlign: 'center', py: 4 }}>
                <ChatIcon sx={{ fontSize: 48, color: 'rgba(255, 107, 157, 0.5)', mb: 2 }} />
                <Typography color="rgba(255, 255, 255, 0.6)">
                  아직 채팅 메시지가 없습니다.
                </Typography>
              </Box>
            )}
          </Box>
        </DialogContent>
      </Dialog>

      {/* 스케줄 상세내역 + 채팅 통합 모달 */}
      <Dialog
        open={scheduleDetailModalOpen}
        onClose={handleCloseScheduleDetailModal}
        maxWidth="lg"
        fullWidth
        PaperProps={{
          sx: {
            backgroundColor: '#23232a',
            color: '#e0e6ed',
            borderRadius: 3,
            maxHeight: '90vh',
          },
        }}
      >
        <DialogTitle
          sx={{
            background: 'linear-gradient(135deg, #FF6B9D 0%, #FF4757 100%)',
            color: 'white',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <ScheduleIcon />
            <Typography variant="h6" sx={{ fontWeight: 700 }}>
              {selectedScheduleDetail?.title} - 상세내역 & 채팅
            </Typography>
          </Box>
          <IconButton
            onClick={handleCloseScheduleDetailModal}
            sx={{ color: 'white' }}
          >
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent sx={{ p: 3 }}>
          <Grid container spacing={3}>
            {/* 왼쪽: 스케줄 상세내역 */}
            <Grid item xs={12} md={6}>
              <Card sx={{ backgroundColor: 'rgba(255, 255, 255, 0.05)', border: '1px solid rgba(255, 107, 157, 0.2)' }}>
                <CardContent>
                  <Typography variant="h6" sx={{ color: '#FF6B9D', fontWeight: 700, mb: 2 }}>
                    일정 정보
                  </Typography>

                  {selectedScheduleDetail && (
                    <Box>
                      <Box sx={{ mb: 2 }}>
                        <Typography sx={{ color: 'rgba(255, 255, 255, 0.8)', fontSize: '0.875rem', mb: 0.5 }}>
                          제목
                        </Typography>
                        <Typography sx={{ color: 'white', fontWeight: 600 }}>
                          {selectedScheduleDetail.title}
                        </Typography>
                      </Box>

                      <Box sx={{ mb: 2 }}>
                        <Typography sx={{ color: 'rgba(255, 255, 255, 0.8)', fontSize: '0.875rem', mb: 0.5 }}>
                          날짜 & 시간
                        </Typography>
                        <Typography sx={{ color: 'white' }}>
                          {new Date(selectedScheduleDetail.date).toLocaleDateString('ko-KR')} {selectedScheduleDetail.time}
                        </Typography>
                      </Box>

                      {selectedScheduleDetail.type && (
                        <Box sx={{ mb: 2 }}>
                          <Typography sx={{ color: 'rgba(255, 255, 255, 0.8)', fontSize: '0.875rem', mb: 0.5 }}>
                            유형
                          </Typography>
                          <Chip
                            label={selectedScheduleDetail.type}
                            size="small"
                            sx={{
                              background: selectedScheduleDetail.color || 'linear-gradient(135deg, #FF6B9D 0%, #FF4757 100%)',
                              color: 'white',
                              fontWeight: 600,
                            }}
                          />
                        </Box>
                      )}

                      {selectedScheduleDetail.customerName && (
                        <Box sx={{ mb: 2 }}>
                          <Typography sx={{ color: 'rgba(255, 255, 255, 0.8)', fontSize: '0.875rem', mb: 0.5 }}>
                            고객명
                          </Typography>
                          <Typography sx={{ color: 'white' }}>
                            {selectedScheduleDetail.customerName}
                          </Typography>
                        </Box>
                      )}

                      {selectedScheduleDetail.address && (
                        <Box sx={{ mb: 2 }}>
                          <Typography sx={{ color: 'rgba(255, 255, 255, 0.8)', fontSize: '0.875rem', mb: 0.5 }}>
                            주소
                          </Typography>
                          <Typography sx={{ color: 'white', fontSize: '0.875rem' }}>
                            {selectedScheduleDetail.address}
                          </Typography>
                        </Box>
                      )}

                      {selectedScheduleDetail.contact && (
                        <Box sx={{ mb: 2 }}>
                          <Typography sx={{ color: 'rgba(255, 255, 255, 0.8)', fontSize: '0.875rem', mb: 0.5 }}>
                            연락처
                          </Typography>
                          <Typography sx={{ color: 'white' }}>
                            {selectedScheduleDetail.contact}
                          </Typography>
                        </Box>
                      )}

                      {selectedScheduleDetail.description && (
                        <Box sx={{ mb: 2 }}>
                          <Typography sx={{ color: 'rgba(255, 255, 255, 0.8)', fontSize: '0.875rem', mb: 0.5 }}>
                            설명
                          </Typography>
                          <Typography sx={{ color: 'white', fontSize: '0.875rem', whiteSpace: 'pre-wrap' }}>
                            {selectedScheduleDetail.description}
                          </Typography>
                        </Box>
                      )}
                    </Box>
                  )}
                </CardContent>
              </Card>
            </Grid>

            {/* 오른쪽: 채팅 영역 */}
            <Grid item xs={12} md={6}>
              <Card sx={{ backgroundColor: 'rgba(255, 255, 255, 0.05)', border: '1px solid rgba(255, 107, 157, 0.2)', height: '100%' }}>
                <CardContent sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                  <Typography variant="h6" sx={{ color: '#FF6B9D', fontWeight: 700, mb: 2 }}>
                    채팅 ({selectedScheduleChat?.messages?.length || 0}개)
                  </Typography>

                  {/* 채팅 메시지 영역 */}
                  <Box
                    ref={setChatScrollRef}
                    sx={{ flex: 1, overflowY: 'auto', mb: 2, maxHeight: 300 }}
                  >
                    {selectedScheduleChat?.messages && selectedScheduleChat.messages.length > 0 ? (
                      selectedScheduleChat.messages.map((message, index) => (
                        <Box
                          key={message.id || index}
                          sx={{
                            mb: 2,
                            p: 2,
                            background: 'rgba(255, 255, 255, 0.05)',
                            borderRadius: 2,
                            border: '1px solid rgba(255, 107, 157, 0.2)',
                          }}
                        >
                          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
                            <Typography
                              sx={{
                                fontWeight: 600,
                                color: '#FF6B9D',
                                fontSize: '0.875rem',
                              }}
                            >
                              {message.user}
                            </Typography>
                            <Typography
                              sx={{
                                color: 'rgba(255, 255, 255, 0.6)',
                                fontSize: '0.75rem',
                              }}
                            >
                              {message.time}
                            </Typography>
                          </Box>
                          <Typography
                            sx={{
                              color: 'white',
                              fontSize: '0.875rem',
                              whiteSpace: 'pre-wrap',
                              wordBreak: 'break-word',
                            }}
                          >
                            {message.text}
                          </Typography>
                        </Box>
                      ))
                    ) : (
                      <Box sx={{ textAlign: 'center', py: 4 }}>
                        <ChatIcon sx={{ fontSize: 48, color: 'rgba(255, 107, 157, 0.5)', mb: 2 }} />
                        <Typography color="rgba(255, 255, 255, 0.6)">
                          아직 채팅 메시지가 없습니다.
                        </Typography>
                      </Box>
                    )}
                  </Box>

                  {/* 채팅 입력 영역 */}
                  <Box sx={{ display: 'flex', gap: 1 }}>
                    <TextField
                      fullWidth
                      size="small"
                      placeholder="메시지를 입력하세요..."
                      value={newScheduleComment}
                      onChange={(e) => setNewScheduleComment(e.target.value)}
                      onKeyPress={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                          e.preventDefault();
                          handleScheduleCommentSubmit();
                        }
                      }}
                      sx={{
                        '& .MuiOutlinedInput-root': {
                          color: 'white',
                          backgroundColor: 'rgba(255, 255, 255, 0.05)',
                          '& fieldset': {
                            borderColor: 'rgba(255, 107, 157, 0.3)',
                          },
                          '&:hover fieldset': {
                            borderColor: 'rgba(255, 107, 157, 0.5)',
                          },
                          '&.Mui-focused fieldset': {
                            borderColor: '#FF6B9D',
                          },
                        },
                        '& .MuiInputLabel-root': {
                          color: 'rgba(255, 255, 255, 0.7)',
                        },
                        '& .MuiInputBase-input::placeholder': {
                          color: 'rgba(255, 255, 255, 0.5)',
                          opacity: 1,
                        },
                      }}
                    />
                    <IconButton
                      onClick={handleScheduleCommentSubmit}
                      disabled={!newScheduleComment.trim()}
                      sx={{
                        color: '#FF6B9D',
                        backgroundColor: 'rgba(255, 107, 157, 0.1)',
                        '&:hover': {
                          backgroundColor: 'rgba(255, 107, 157, 0.2)',
                        },
                        '&.Mui-disabled': {
                          color: 'rgba(255, 255, 255, 0.3)',
                          backgroundColor: 'rgba(255, 255, 255, 0.05)',
                        },
                      }}
                    >
                      <SendIcon />
                    </IconButton>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </DialogContent>
      </Dialog>

      {/* 우클릭 컨텍스트 메뉴 */}
      <Menu
        open={contextMenu !== null}
        onClose={handleContextMenuClose}
        anchorReference="anchorPosition"
        anchorPosition={
          contextMenu !== null
            ? { top: contextMenu.mouseY, left: contextMenu.mouseX }
            : undefined
        }
        PaperProps={{
          sx: {
            backgroundColor: '#23232a',
            color: '#e0e6ed',
            borderRadius: 2,
            border: '1px solid rgba(255, 107, 157, 0.3)',
            boxShadow: '0 4px 20px rgba(0, 0, 0, 0.3)',
            '& .MuiMenuItem-root': {
              color: '#e0e6ed',
              '&:hover': {
                backgroundColor: 'rgba(255, 107, 157, 0.1)',
              },
            },
          },
        }}
      >
        <MenuItem onClick={() => contextMenu && handleViewSchedule(contextMenu.scheduleTitle)}>
          <ScheduleIcon sx={{ mr: 1, fontSize: 20, color: '#FF6B9D' }} />
          스케줄 일정보기
        </MenuItem>
      </Menu>

      {/* 우측 하단 채팅 플로팅 버튼 */}
      {!chatOpen && (
        <Fab
          variant="extended"
          color="secondary"
          onClick={() => setChatOpen(true)}
          sx={{
            position: 'fixed',
            right: { xs: 16, md: 32 },
            bottom: { xs: 16, md: 32 },
            zIndex: 1200,
            background: 'linear-gradient(135deg, #FF6B9D 0%, #FF4757 100%)',
            color: 'white',
            fontWeight: 700,
            boxShadow: '0 4px 16px rgba(255, 107, 157, 0.15)',
            '&:hover': {
              background: 'linear-gradient(135deg, #FFB3D1 0%, #FF6B7A 100%)',
            },
          }}
        >
          <ChatIcon sx={{ mr: 1 }} /> 채팅 열기
        </Fab>
      )}

      {/* 우측 하단 채팅창 */}
      <Collapse in={chatOpen} unmountOnExit>
        <Box
          sx={{
            position: 'fixed',
            right: { xs: 8, md: 32 },
            bottom: { xs: 8, md: 32 },
            zIndex: 1300,
            width: { xs: '90vw', sm: 340 },
            maxWidth: 400,
            boxShadow: '0 8px 32px rgba(255, 107, 157, 0.18)',
            borderRadius: 4,
            background: '#23232a',
            color: 'white',
            border: '2px solid #FF6B9D',
            display: 'flex',
            flexDirection: 'column',
            minHeight: 320,
            maxHeight: '60vh',
          }}
        >
          {/* 채팅창 헤더 */}
          <Box
            sx={{
              background: 'linear-gradient(90deg, #FF6B9D 0%, #FF4757 100%)',
              color: '#fff',
              borderRadius: '4px 4px 0 0',
              px: 2,
              pt: 1,
              pb: 1,
              fontWeight: 700,
              fontSize: '1rem',
              boxShadow: '0 2px 8px rgba(255, 107, 157, 0.10)',
              minHeight: 44,
              display: 'flex',
              flexDirection: 'column',
            }}
          >
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                mb: 0.5,
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <GroupIcon sx={{ fontSize: 18, mr: 0.5 }} />
                <span>직원간 대화 공간</span>
              </Box>
              <IconButton
                onClick={() => setChatOpen(false)}
                sx={{ color: '#fff', p: 0.5 }}
              >
                <CloseIcon fontSize="small" />
              </IconButton>
            </Box>
            {/* 참여자 표시 */}
            <Box
              sx={{ display: 'flex', alignItems: 'center', gap: 1, ml: 0.5 }}
            >
              {chatParticipants.map((p, i) => (
                <Box
                  key={p.name}
                  sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}
                >
                  <Avatar
                    sx={{
                      width: 22,
                      height: 22,
                      bgcolor: p.color,
                      fontSize: 13,
                    }}
                  >
                    {p.name[0]}
                  </Avatar>
                  <Typography
                    sx={{ fontSize: 12, color: '#fff', opacity: 0.8 }}
                  >
                    {p.name}
                  </Typography>
                  {i < chatParticipants.length - 1 && (
                    <span style={{ color: '#fff', opacity: 0.5 }}>|</span>
                  )}
                </Box>
              ))}
            </Box>
          </Box>

          {/* 채팅 메시지 리스트 */}
          <Box
            sx={{
              flex: 1,
              overflowY: 'auto',
              p: 1.2,
              background: 'rgba(255,255,255,0.02)',
            }}
          >
            {chatMessages.map(msg => (
              <Box
                key={msg.id}
                sx={{
                  mb: 1.2,
                  display: 'flex',
                  flexDirection: msg.user === nickname ? 'row-reverse' : 'row',
                  alignItems: 'flex-end',
                }}
              >
                <Avatar
                  sx={{
                    width: 24,
                    height: 24,
                    bgcolor: msg.user === nickname ? '#FF6B9D' : '#FF4757',
                    fontSize: 13,
                    ml: msg.user === nickname ? 1 : 0,
                    mr: msg.user === nickname ? 0 : 1,
                  }}
                >
                  {msg.user[0]}
                </Avatar>
                <Box
                  sx={{
                    maxWidth: 200,
                    p: 1,
                    borderRadius: 2,
                    background:
                      msg.user === nickname
                        ? 'linear-gradient(135deg, #FF6B9D 0%, #FF4757 100%)'
                        : 'rgba(255,255,255,0.08)',
                    color: '#fff',
                    fontSize: 14,
                    boxShadow:
                      msg.user === nickname
                        ? '0 2px 8px rgba(255,107,157,0.10)'
                        : 'none',
                    ml: msg.user === nickname ? 0 : 1,
                    mr: msg.user === nickname ? 1 : 0,
                  }}
                >
                  <Typography sx={{ fontWeight: 500 }}>{msg.text}</Typography>
                  <Typography
                    sx={{
                      fontSize: 10,
                      color: 'rgba(255,255,255,0.5)',
                      mt: 0.5,
                      textAlign: 'right',
                    }}
                  >
                    {msg.time}
                  </Typography>
                </Box>
              </Box>
            ))}
          </Box>
          {/* 채팅 입력창 */}
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              p: 1,
              borderTop: '1.5px solid #FF6B9D',
              background: 'rgba(255,255,255,0.03)',
            }}
          >
            <TextField
              fullWidth
              size="small"
              placeholder="메시지를 입력하세요..."
              value={chatInput}
              onChange={e => setChatInput(e.target.value)}
              onKeyDown={e => {
                if (e.key === 'Enter') handleSendChat();
              }}
              sx={{
                mr: 1,
                '& .MuiOutlinedInput-root': {
                  borderRadius: 2,
                  background: 'rgba(255,255,255,0.05)',
                  color: '#fff',
                  '& fieldset': {
                    borderColor: '#FF6B9D',
                  },
                  '&:hover fieldset': {
                    borderColor: '#FFB3D1',
                  },
                  '&.Mui-focused fieldset': {
                    borderColor: '#FF6B9D',
                  },
                },
                '& .MuiInputBase-input': {
                  color: '#fff',
                },
              }}
            />
            <Button
              variant="contained"
              onClick={handleSendChat}
              sx={{
                background: 'linear-gradient(135deg, #FF6B9D 0%, #FF4757 100%)',
                color: '#fff',
                fontWeight: 700,
                borderRadius: 2,
                minWidth: 48,
                ml: 1,
                px: 1.5,
                py: 0.5,
                fontSize: 14,
                '&:hover': {
                  background:
                    'linear-gradient(135deg, #FFB3D1 0%, #FF6B7A 100%)',
                },
              }}
            >
              전송
            </Button>
          </Box>
        </Box>
      </Collapse>

      {/* 스케줄 상세 모달 */}
      <ScheduleDetailModal
        open={scheduleModalOpen}
        onClose={handleCloseScheduleModal}
        event={selectedEvent}
      />

      {/* 빠른링크 추가/편집 다이얼로그 */}
      <Dialog
        open={quickLinkDialogOpen}
        onClose={() => setQuickLinkDialogOpen(false)}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: {
            backgroundColor: '#23232a',
            color: '#e0e6ed',
            borderRadius: 3,
          },
        }}
      >
        <DialogTitle
          sx={{
            background: 'linear-gradient(135deg, #FF6B9D 0%, #FF4757 100%)',
            color: 'white',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <Typography variant="h6" sx={{ fontWeight: 700 }}>
            {editingQuickLink ? '빠른링크 편집' : '빠른링크 추가'}
          </Typography>
          <IconButton
            onClick={() => setQuickLinkDialogOpen(false)}
            sx={{ color: 'white' }}
          >
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent sx={{ p: 3 }}>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            {/* 제목 입력 */}
            <TextField
              label="제목"
              value={newQuickLink.label}
              onChange={(e) => setNewQuickLink(prev => ({ ...prev, label: e.target.value }))}
              fullWidth
              sx={{
                '& .MuiOutlinedInput-root': {
                  color: 'white',
                  '& fieldset': {
                    borderColor: 'rgba(255, 107, 157, 0.3)',
                  },
                  '&:hover fieldset': {
                    borderColor: 'rgba(255, 107, 157, 0.5)',
                  },
                  '&.Mui-focused fieldset': {
                    borderColor: '#FF6B9D',
                  },
                },
                '& .MuiInputLabel-root': {
                  color: 'rgba(255, 255, 255, 0.7)',
                },
              }}
            />

            {/* URL 입력 */}
            <TextField
              label="URL (선택사항)"
              value={newQuickLink.url}
              onChange={(e) => setNewQuickLink(prev => ({ ...prev, url: e.target.value }))}
              fullWidth
              sx={{
                '& .MuiOutlinedInput-root': {
                  color: 'white',
                  '& fieldset': {
                    borderColor: 'rgba(255, 107, 157, 0.3)',
                  },
                  '&:hover fieldset': {
                    borderColor: 'rgba(255, 107, 157, 0.5)',
                  },
                  '&.Mui-focused fieldset': {
                    borderColor: '#FF6B9D',
                  },
                },
                '& .MuiInputLabel-root': {
                  color: 'rgba(255, 255, 255, 0.7)',
                },
              }}
            />

            {/* 내용 입력 */}
            <TextField
              label="내용"
              value={newQuickLink.value}
              onChange={(e) => setNewQuickLink(prev => ({ ...prev, value: e.target.value }))}
              fullWidth
              multiline
              rows={3}
              sx={{
                '& .MuiOutlinedInput-root': {
                  color: 'white',
                  '& fieldset': {
                    borderColor: 'rgba(255, 107, 157, 0.3)',
                  },
                  '&:hover fieldset': {
                    borderColor: 'rgba(255, 107, 157, 0.5)',
                  },
                  '&.Mui-focused fieldset': {
                    borderColor: '#FF6B9D',
                  },
                },
                '& .MuiInputLabel-root': {
                  color: 'rgba(255, 255, 255, 0.7)',
                },
              }}
            />

            {/* 아이콘 선택 */}
            <Box>
              <Typography sx={{ color: 'white', mb: 1, fontWeight: 600 }}>
                아이콘 선택
              </Typography>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                {iconOptions.map((option) => (
                  <Tooltip key={option.value} title={option.label}>
                    <IconButton
                      onClick={() => setNewQuickLink(prev => ({ ...prev, icon: option.value }))}
                      sx={{
                        border: newQuickLink.icon === option.value ? '2px solid #FF6B9D' : '2px solid transparent',
                        color: newQuickLink.icon === option.value ? '#FF6B9D' : 'rgba(255, 255, 255, 0.7)',
                        '&:hover': {
                          background: 'rgba(255, 107, 157, 0.1)',
                          color: '#FF6B9D',
                        },
                      }}
                    >
                      {option.icon}
                    </IconButton>
                  </Tooltip>
                ))}
              </Box>
            </Box>
          </Box>
        </DialogContent>
        <DialogActions sx={{ p: 3, pt: 0 }}>
          <Button
            onClick={() => setQuickLinkDialogOpen(false)}
            sx={{
              color: 'rgba(255, 255, 255, 0.7)',
              '&:hover': {
                background: 'rgba(255, 255, 255, 0.1)',
              },
            }}
          >
            취소
          </Button>
          <Button
            onClick={handleSaveQuickLink}
            variant="contained"
            sx={{
              background: 'linear-gradient(135deg, #FF6B9D 0%, #FF4757 100%)',
              color: 'white',
              fontWeight: 700,
              '&:hover': {
                background: 'linear-gradient(135deg, #FFB3D1 0%, #FF6B7A 100%)',
              },
            }}
          >
            {editingQuickLink ? '수정' : '추가'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Dashboard;
