import React, { useEffect, useState, useContext, useRef } from 'react';
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
  Image as ImageIcon,
  PhotoLibrary as PhotoLibraryIcon,
  Download as DownloadIcon,
  CloudUpload as CloudUploadIcon,
} from '@mui/icons-material';
import { UserContext } from '../components/Layout';
import { API_BASE } from '../utils/auth';
import { db } from '../firebase/config';
import { collection, addDoc, onSnapshot, query, orderBy, serverTimestamp, doc, updateDoc, getDocs, deleteDoc } from 'firebase/firestore';
import { storage } from '../firebase/config';
import { ref, uploadBytes, getDownloadURL, listAll } from 'firebase/storage';
import { userService } from '../utils/firebaseDataService';
import { ensureFirebaseAuth } from '../utils/auth';

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
  const { nickname, userId } = useContext(UserContext);
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
  const [chatMessages, setChatMessages] = useState<any[]>([]);
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
  const [users, setUsers] = useState<any[]>([]);
  const [onlineUsers, setOnlineUsers] = useState<string[]>([]);
  const chatScrollRef = useRef<HTMLDivElement>(null);
  
  // 채팅 자동 스크롤 함수
  const scrollToBottom = () => {
    if (chatScrollRef.current) {
      (chatScrollRef.current as HTMLDivElement).scrollTop = (chatScrollRef.current as HTMLDivElement).scrollHeight;
    }
  };

  // 사진 선택 핸들러
  const handleImageSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && file.type.startsWith('image/')) {
      setSelectedImage(file);
      const reader = new FileReader();
      reader.onload = (e) => {
        setImagePreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  // 사진 업로드 함수
  const handleImageUpload = async () => {
    if (!selectedImage) return;

    try {
      setUploadingImage(true);
      
      // Firebase Auth 확인 및 인증
      const firebaseUser = await ensureFirebaseAuth();
      if (!firebaseUser) {
        throw new Error('Firebase Auth 인증이 필요합니다. 다시 로그인해주세요.');
      }
      
      console.log('Firebase Auth 인증 완료:', firebaseUser.uid);
      
      const imageRef = ref(storage, `employeeChat/${Date.now()}_${selectedImage.name}`);
      const snapshot = await uploadBytes(imageRef, selectedImage);
      const downloadURL = await getDownloadURL(snapshot.ref);

      // Firebase에 이미지 메시지 저장
      await addDoc(collection(db, 'employeeChat'), {
        user: nickname || '사용자',
        text: '',
        imageUrl: downloadURL,
        imageName: selectedImage.name,
        timestamp: serverTimestamp(),
        userId: userId || 'current_user',
        messageType: 'image'
      });

      // 상태 초기화
      setSelectedImage(null);
      setImagePreview(null);
      setUploadingImage(false);
    } catch (error) {
      console.error('이미지 업로드 오류:', error);
      setUploadingImage(false);
      alert('이미지 업로드에 실패했습니다: ' + (error as Error).message);
    }
  };

  // 갤러리 열기 함수
  const handleOpenGallery = async () => {
    try {
      // Firebase Auth 확인 및 인증
      const firebaseUser = await ensureFirebaseAuth();
      if (!firebaseUser) {
        throw new Error('Firebase Auth 인증이 필요합니다. 다시 로그인해주세요.');
      }
      
      console.log('Firebase Auth 인증 완료 (갤러리):', firebaseUser.uid);
      
      const imagesRef = ref(storage, 'employeeChat');
      const result = await listAll(imagesRef);
      
      const imageUrls = await Promise.all(
        result.items.map(async (item) => {
          const url = await getDownloadURL(item);
          return {
            url,
            name: item.name,
            fullPath: item.fullPath
          };
        })
      );
      
      setChatImages(imageUrls);
      setGalleryModalOpen(true);
    } catch (error) {
      console.error('갤러리 로드 오류:', error);
      alert('갤러리를 불러오는데 실패했습니다: ' + (error as Error).message);
    }
  };

  // 이미지 다운로드 함수
  const handleImageDownload = (imageUrl: string, imageName: string) => {
    const link = document.createElement('a');
    link.href = imageUrl;
    link.download = imageName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // 선택된 이미지들 다운로드
  const handleSelectedImagesDownload = () => {
    selectedImagesForDownload.forEach((imageUrl) => {
      const link = document.createElement('a');
      link.href = imageUrl;
      link.download = `image_${Date.now()}.jpg`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    });
    setSelectedImagesForDownload([]);
  };
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
    icon: 'LinkIcon',
    customIcon: null as File | null
  });

  // 사진 관련 state
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [galleryModalOpen, setGalleryModalOpen] = useState(false);
  const [chatImages, setChatImages] = useState<any[]>([]);
  const [selectedImagesForDownload, setSelectedImagesForDownload] = useState<string[]>([]);

  // 전화 메모 불러오기
  useEffect(() => {
    try {
      const saved = localStorage.getItem(CALL_MEMO_KEY);
      if (saved) setCallMemos(JSON.parse(saved));
    } catch { }
  }, []);

  // Firebase에서 빠른링크 로드
  useEffect(() => {
    const loadQuickLinks = async () => {
      try {
        const quickLinksSnapshot = await getDocs(collection(db, 'quickLinks'));
        const links: any = {};
        
        quickLinksSnapshot.forEach((doc) => {
          const data = doc.data();
          links[doc.id] = {
            ...data,
            icon: getIconComponent(data.icon || 'LinkIcon'), // 아이콘 컴포넌트로 변환
          };
        });
        
        setQuickLinks(links);
        setEditLinks(links);
      } catch (error) {
        console.error('빠른링크 로드 오류:', error);
        // 에러 발생 시 기본값 사용
        setQuickLinks(defaultQuickLinks);
        setEditLinks(defaultQuickLinks);
      }
    };

    loadQuickLinks();
  }, []);

  // Firebase 전체 사용자 채팅 실시간 구독
  useEffect(() => {
    const unsubscribe = onSnapshot(
      query(collection(db, 'employeeChat'), orderBy('timestamp', 'asc')),
      (snapshot) => {
        const messages = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
          time: doc.data().timestamp?.toDate?.() 
            ? doc.data().timestamp.toDate().toLocaleTimeString('ko-KR', {
                hour: '2-digit',
                minute: '2-digit',
              })
            : new Date().toLocaleTimeString('ko-KR', {
                hour: '2-digit',
                minute: '2-digit',
              })
        }));
        setChatMessages(messages);
        
        // 온라인 사용자 목록 업데이트 (최근 5분 내 메시지 보낸 사용자)
        const recentUsers = new Set<string>();
        const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
        
        messages.forEach((msg: any) => {
          if (msg.timestamp && new Date(msg.timestamp) > fiveMinutesAgo) {
            recentUsers.add(msg.user);
          }
        });
        
        setOnlineUsers(Array.from(recentUsers));
      },
      (error) => {
        console.error('전체 사용자 채팅 구독 오류:', error);
      }
    );

    return () => unsubscribe();
  }, []);

  // 채팅 메시지가 변경될 때 자동 스크롤
  useEffect(() => {
    if (chatOpen && chatMessages.length > 0) {
      setTimeout(() => {
        scrollToBottom();
      }, 100);
    }
  }, [chatMessages, chatOpen]);

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
                const newState = { ...prev };
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
    if (scheduleDetailModalOpen && chatScrollRef.current) {
      setTimeout(() => {
        chatScrollRef.current!.scrollTop = chatScrollRef.current!.scrollHeight;
      }, 100);
    }
  }, [scheduleDetailModalOpen, chatScrollRef]);

  // 채팅 메시지가 업데이트될 때 스크롤을 맨 아래로 이동
  useEffect(() => {
    if (scheduleDetailModalOpen && chatScrollRef.current && selectedScheduleChat?.messages) {
      setTimeout(() => {
        chatScrollRef.current!.scrollTop = chatScrollRef.current!.scrollHeight;
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
      icon: 'LinkIcon',
      customIcon: null
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
      icon: iconString,
      customIcon: null
    });
    setQuickLinkDialogOpen(true);
  };

  // 빠른링크 삭제
  const handleDeleteQuickLink = async (key: string) => {
    if (window.confirm('정말로 이 항목을 삭제하시겠습니까?')) {
      try {
        // Firebase에서 삭제
        const quickLinkRef = doc(db, 'quickLinks', key);
        await deleteDoc(quickLinkRef);

        // 로컬 상태 업데이트
        const updatedLinks = { ...editLinks };
        delete updatedLinks[key];
        setEditLinks(updatedLinks);

        alert('빠른링크가 삭제되었습니다.');
      } catch (error) {
        console.error('빠른링크 삭제 오류:', error);
        alert('빠른링크 삭제에 실패했습니다. 다시 시도해주세요.');
      }
    }
  };

  // 아이콘 파일 선택 핸들러
  const handleIconFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setNewQuickLink(prev => ({ ...prev, customIcon: file }));
    }
  };

  // 빠른링크 저장
  const handleSaveQuickLink = async () => {
    if (!newQuickLink.label.trim()) {
      alert('제목을 입력해주세요.');
      return;
    }

    try {
      let iconUrl = '';
      
      // 커스텀 아이콘이 있는 경우 Firebase Storage에 업로드
      if (newQuickLink.customIcon) {
        const storageRef = ref(storage, `quickLinks/icons/${Date.now()}_${newQuickLink.customIcon.name}`);
        await uploadBytes(storageRef, newQuickLink.customIcon);
        iconUrl = await getDownloadURL(storageRef);
      }

      const linkData = {
        label: newQuickLink.label.trim(),
        url: newQuickLink.url.trim(),
        value: newQuickLink.value.trim() || newQuickLink.url.trim(),
        icon: newQuickLink.icon, // 기본 아이콘 이름
        customIconUrl: iconUrl, // 커스텀 아이콘 URL
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        userId: userId || 'current_user',
      };

      if (editingQuickLink) {
        // 편집 모드 - Firebase 업데이트
        const quickLinkRef = doc(db, 'quickLinks', editingQuickLink.key);
        await updateDoc(quickLinkRef, {
          ...linkData,
          updatedAt: serverTimestamp(),
        });

        // 로컬 상태 업데이트
        const updatedLinks = { ...editLinks };
        updatedLinks[editingQuickLink.key] = {
          ...linkData,
          icon: getIconComponent(newQuickLink.icon), // UI용 아이콘 컴포넌트
        };
        setEditLinks(updatedLinks);
      } else {
        // 추가 모드 - Firebase에 새 문서 추가
        const newQuickLinkRef = await addDoc(collection(db, 'quickLinks'), linkData);
        
        // 로컬 상태 업데이트
        const newKey = newQuickLinkRef.id;
        const updatedLinks = { ...editLinks, [newKey]: {
          ...linkData,
          icon: getIconComponent(newQuickLink.icon), // UI용 아이콘 컴포넌트
        }};
        setEditLinks(updatedLinks);
      }

      setQuickLinkDialogOpen(false);
      setEditingQuickLink(null);
              setNewQuickLink({
          label: '',
          url: '',
          value: '',
          icon: 'LinkIcon',
          customIcon: null
        });

      alert('빠른링크가 저장되었습니다.');
    } catch (error) {
      console.error('빠른링크 저장 오류:', error);
      alert('빠른링크 저장에 실패했습니다. 다시 시도해주세요.');
    }
  };



  const handleSendChat = async () => {
    if (!chatInput.trim()) return;

    try {
      // Firebase에 메시지 저장
      await addDoc(collection(db, 'employeeChat'), {
        user: nickname || '사용자',
        text: chatInput.trim(),
        timestamp: serverTimestamp(),
        userId: userId || 'current_user',
      });

      // 입력 필드 초기화
      setChatInput('');
    } catch (error) {
      console.error('채팅 메시지 저장 오류:', error);
      // 에러 발생 시 사용자에게 알림
      alert('메시지 전송에 실패했습니다. 다시 시도해주세요.');
    }
  };

  const handleScheduleClick = (event: ScheduleEvent) => {
    setSelectedEvent(event);
    setScheduleModalOpen(true);
  };

  const handleCloseScheduleModal = () => {
    setScheduleModalOpen(false);
    setSelectedEvent(null);
  };

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
      if (chatScrollRef.current) {
        chatScrollRef.current.scrollTop = chatScrollRef.current.scrollHeight;
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

  // 사용자 목록 가져오기
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const userList = await userService.getUsers();
        setUsers(userList);
        console.log('사용자 목록 로드 완료:', userList.length, '명');
      } catch (error) {
        console.error('사용자 목록 로드 실패:', error);
      }
    };
    fetchUsers();
  }, []);

  return (
    <Box sx={{ p: 3, position: 'relative', minHeight: '100vh' }}>
      {/* 헤더 */}
      <Box sx={{ mb: 4, textAlign: 'center' }}>
        <Typography
          variant="h3"
          sx={{
            fontWeight: 800,
            background: 'var(--gradient-primary)',
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
            color: 'var(--text-secondary-color)',
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
              background: 'var(--surface-color)',
              borderRadius: 4,
              boxShadow: '0 4px 24px var(--border-color)',
              border: '1px solid var(--border-color)',
              color: 'var(--text-color)',
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
                    color: 'var(--text-color)',
                    flex: 1,
                  }}
                >
                  오늘의 스케줄
                </Typography>
                <IconButton
                  onClick={() => setScheduleExpanded(!scheduleExpanded)}
                  sx={{
                    color: 'var(--text-secondary-color)',
                    '&:hover': {
                      color: 'var(--primary-color)',
                      backgroundColor: 'var(--hover-color)',
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
                      <Typography color="var(--text-secondary-color)">
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
                            background: 'var(--hover-color)',
                            borderRadius: 2,
                            border: '1px solid var(--border-color)',
                            cursor: 'pointer',
                            transition: 'all 0.2s ease-in-out',
                            '&:hover': {
                              background: 'var(--primary-color)',
                              border: '1px solid var(--primary-color)',
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
              background: 'var(--surface-color)',
              borderRadius: 4,
              boxShadow: '0 4px 24px var(--border-color)',
              border: '1px solid var(--border-color)',
              color: 'var(--text-color)',
            }}
          >
            <CardContent sx={{ p: 3 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <Avatar
                  sx={{
                    background: 'var(--gradient-primary)',
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
                    color: 'var(--text-color)',
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
                      background: 'var(--background-color)',
                      '& fieldset': {
                        borderColor: 'var(--border-color)',
                      },
                      '&:hover fieldset': {
                        borderColor: 'var(--primary-color)',
                      },
                      '&.Mui-focused fieldset': {
                        borderColor: 'var(--primary-color)',
                      },
                    },
                    '& .MuiInputBase-input': {
                      color: 'var(--text-color)',
                    },
                  }}
                />
                <Button
                  variant="contained"
                  onClick={handleSaveMemo}
                  sx={{
                    minWidth: 80,
                    background: 'var(--gradient-primary)',
                    borderRadius: 2,
                    '&:hover': {
                      background: 'var(--gradient-secondary)',
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
        <Grid item xs={12} md={6}>
          {/* 좌측: 빠른링크/정보공유 */}
          <Card
            sx={{
              background: 'var(--surface-color)',
              borderRadius: 4,
              boxShadow: '0 4px 24px var(--border-color)',
              border: '1px solid var(--border-color)',
              color: 'var(--text-color)',
            }}
          >
            <CardContent sx={{ p: 3 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <Avatar
                  sx={{
                    background: 'var(--gradient-primary)',
                    mr: 2,
                    width: 40,
                    height: 40,
                    cursor: 'pointer',
                    transition: 'transform 0.2s ease-in-out',
                    '&:hover': {
                      transform: 'scale(1.05)',
                    },
                  }}
                  onClick={() => setQuickLinksOpen(!quickLinksOpen)}
                >
                  <LinkIcon />
                </Avatar>
                <Typography
                  variant="h6"
                  sx={{
                    fontWeight: 700,
                    color: 'var(--text-color)',
                    flex: 1,
                  }}
                >
                  빠른링크/정보공유
                </Typography>
                <IconButton
                  onClick={() => setQuickLinksOpen(!quickLinksOpen)}
                  sx={{
                    color: 'var(--text-secondary-color)',
                    '&:hover': {
                      color: 'var(--primary-color)',
                      backgroundColor: 'var(--hover-color)',
                    },
                    transition: 'all 0.2s ease-in-out',
                    transform: quickLinksOpen ? 'rotate(0deg)' : 'rotate(180deg)',
                  }}
                >
                  <ExpandMoreIcon />
                </IconButton>
                <Tooltip title="빠른링크 추가">
                  <IconButton
                    onClick={handleAddQuickLink}
                    sx={{
                      color: 'var(--text-secondary-color)',
                      '&:hover': {
                        color: '#4CAF50',
                        backgroundColor: 'rgba(76, 175, 80, 0.1)',
                      },
                      transition: 'all 0.2s ease-in-out',
                    }}
                  >
                    <AddIcon />
                  </IconButton>
                </Tooltip>
              </Box>

              {/* 접힌 상태: 아이콘만 표시 */}
              {!quickLinksOpen && (
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, justifyContent: 'center', py: 2 }}>
                  {Object.entries(quickLinks).map(([key, link]: [string, any]) => (
                    <Tooltip key={key} title={link.label}>
                      <IconButton
                        onClick={() => {
                          if (link.url) {
                            window.open(link.url, '_blank');
                          } else {
                            handleCopy(link.value);
                          }
                        }}
                        sx={{
                          width: 48,
                          height: 48,
                          background: 'rgba(255, 107, 157, 0.1)',
                          border: '1px solid rgba(255, 107, 157, 0.2)',
                          color: 'var(--text-color)',
                          '&:hover': {
                            background: 'rgba(255, 107, 157, 0.2)',
                            borderColor: 'rgba(255, 107, 157, 0.4)',
                            transform: 'scale(1.05)',
                          },
                          transition: 'all 0.2s ease',
                        }}
                      >
                        {typeof link.icon === 'string' ? getIconComponent(link.icon) : link.icon}
                      </IconButton>
                    </Tooltip>
                  ))}
                </Box>
              )}

              {/* 펼쳐진 상태: 전체 링크 목록 */}
              <Collapse in={quickLinksOpen}>
                <Box sx={{ mt: 2 }}>

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
              </Box>
            </Collapse>
          </CardContent>
        </Card>
      </Grid>
        <Grid item xs={12} md={6}>
          {/* 우측: 활성 채팅 영역 */}
          <Card
            sx={{
              background: 'var(--surface-color)',
              borderRadius: 4,
              boxShadow: '0 4px 24px rgba(255, 107, 157, 0.10)',
              border: '1px solid var(--border-color)',
              color: 'var(--text-color)',
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
                    color: 'var(--text-color)',
                  }}
                >
                  스케줄별 채팅
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
                                        color: 'var(--text-color)',
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
                      <Typography color="var(--text-secondary-color)">
                        현재 진행 중인 채팅이 없습니다.
                      </Typography>
                      <Typography
                        color="var(--primary-color)"
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
            backgroundColor: 'var(--surface-color)',
            color: 'var(--text-color)',
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
                    background: 'var(--background-color)',
                    borderRadius: 2,
                    border: '1px solid var(--border-color)',
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
                        color: 'var(--text-secondary-color)',
                        fontSize: '0.75rem',
                      }}
                    >
                      {message.time}
                    </Typography>
                  </Box>
                  <Typography
                    sx={{
                      color: 'var(--text-color)',
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
                <ChatIcon sx={{ fontSize: 48, color: 'var(--primary-color)', mb: 2 }} />
                <Typography color="var(--text-secondary-color)">
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
            backgroundColor: 'var(--surface-color)',
            color: 'var(--text-color)',
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
              <Card sx={{ backgroundColor: 'var(--background-color)', border: '1px solid var(--border-color)' }}>
                <CardContent>
                  <Typography variant="h6" sx={{ color: '#FF6B9D', fontWeight: 700, mb: 2 }}>
                    일정 정보
                  </Typography>

                  {selectedScheduleDetail && (
                    <Box>
                      <Box sx={{ mb: 2 }}>
                        <Typography sx={{ color: 'var(--text-secondary-color)', fontSize: '0.875rem', mb: 0.5 }}>
                          제목
                        </Typography>
                        <Typography sx={{ color: 'var(--text-color)', fontWeight: 600 }}>
                          {selectedScheduleDetail.title}
                        </Typography>
                      </Box>

                      <Box sx={{ mb: 2 }}>
                        <Typography sx={{ color: 'var(--text-secondary-color)', fontSize: '0.875rem', mb: 0.5 }}>
                          날짜 & 시간
                        </Typography>
                        <Typography sx={{ color: 'var(--text-color)' }}>
                          {new Date(selectedScheduleDetail.date).toLocaleDateString('ko-KR')} {selectedScheduleDetail.time}
                        </Typography>
                      </Box>

                      {selectedScheduleDetail.type && (
                        <Box sx={{ mb: 2 }}>
                                                  <Typography sx={{ color: 'var(--text-secondary-color)', fontSize: '0.875rem', mb: 0.5 }}>
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
                                                  <Typography sx={{ color: 'var(--text-secondary-color)', fontSize: '0.875rem', mb: 0.5 }}>
                          고객명
                        </Typography>
                        <Typography sx={{ color: 'var(--text-color)' }}>
                          {selectedScheduleDetail.customerName}
                        </Typography>
                        </Box>
                      )}

                      {selectedScheduleDetail.address && (
                        <Box sx={{ mb: 2 }}>
                                                  <Typography sx={{ color: 'var(--text-secondary-color)', fontSize: '0.875rem', mb: 0.5 }}>
                          주소
                        </Typography>
                        <Typography sx={{ color: 'var(--text-color)', fontSize: '0.875rem' }}>
                          {selectedScheduleDetail.address}
                        </Typography>
                        </Box>
                      )}

                      {selectedScheduleDetail.contact && (
                        <Box sx={{ mb: 2 }}>
                                                  <Typography sx={{ color: 'var(--text-secondary-color)', fontSize: '0.875rem', mb: 0.5 }}>
                          연락처
                        </Typography>
                        <Typography sx={{ color: 'var(--text-color)' }}>
                          {selectedScheduleDetail.contact}
                        </Typography>
                      </Box>
                    )}

                      {selectedScheduleDetail.description && (
                        <Box sx={{ mb: 2 }}>
                          <Typography sx={{ color: 'var(--text-secondary-color)', fontSize: '0.875rem', mb: 0.5 }}>
                            설명
                          </Typography>
                          <Typography sx={{ color: 'var(--text-color)', fontSize: '0.875rem', whiteSpace: 'pre-wrap' }}>
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
              <Card sx={{ backgroundColor: 'var(--background-color)', border: '1px solid var(--border-color)', height: '100%' }}>
                <CardContent sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                  <Typography variant="h6" sx={{ color: '#FF6B9D', fontWeight: 700, mb: 2 }}>
                    채팅 ({selectedScheduleChat?.messages?.length || 0}개)
                  </Typography>

                  {/* 채팅 메시지 영역 */}
                  <Box
                    sx={{ flex: 1, overflowY: 'auto', mb: 2, maxHeight: 300 }}
                  >
                    {selectedScheduleChat?.messages && selectedScheduleChat.messages.length > 0 ? (
                      selectedScheduleChat.messages.map((message, index) => (
                        <Box
                          key={message.id || index}
                          sx={{
                            mb: 2,
                            p: 2,
                            background: 'var(--surface-color)',
                            borderRadius: 2,
                            border: '1px solid var(--border-color)',
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
                                color: 'var(--text-secondary-color)',
                                fontSize: '0.75rem',
                              }}
                            >
                              {message.time}
                            </Typography>
                          </Box>
                          <Typography
                            sx={{
                              color: 'var(--text-color)',
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
                        <ChatIcon sx={{ fontSize: 48, color: 'var(--primary-color)', mb: 2 }} />
                        <Typography color="var(--text-secondary-color)">
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
                          color: 'var(--text-color)',
                          backgroundColor: 'var(--background-color)',
                          '& fieldset': {
                            borderColor: 'var(--border-color)',
                          },
                          '&:hover fieldset': {
                            borderColor: 'var(--primary-color)',
                          },
                          '&.Mui-focused fieldset': {
                            borderColor: 'var(--primary-color)',
                          },
                        },
                        '& .MuiInputLabel-root': {
                          color: 'var(--text-secondary-color)',
                        },
                        '& .MuiInputBase-input::placeholder': {
                          color: 'var(--text-secondary-color)',
                          opacity: 1,
                        },
                      }}
                    />
                    <IconButton
                      onClick={handleScheduleCommentSubmit}
                      disabled={!newScheduleComment.trim()}
                      sx={{
                        color: 'var(--primary-color)',
                        backgroundColor: 'var(--hover-color)',
                        '&:hover': {
                          backgroundColor: 'var(--primary-color)',
                          color: 'white',
                        },
                        '&.Mui-disabled': {
                          color: 'var(--text-secondary-color)',
                          backgroundColor: 'var(--background-color)',
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
            backgroundColor: 'var(--surface-color)',
            color: 'var(--text-color)',
            borderRadius: 2,
            border: '1px solid var(--border-color)',
            boxShadow: '0 4px 20px rgba(0, 0, 0, 0.3)',
            '& .MuiMenuItem-root': {
              color: 'var(--text-color)',
              '&:hover': {
                backgroundColor: 'var(--hover-color)',
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
          <ChatIcon sx={{ mr: 1 }} /> 전체 채팅 열기
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
            width: { xs: '95vw', sm: 450 },
            maxWidth: 500,
            boxShadow: '0 8px 32px rgba(255, 107, 157, 0.18)',
            borderRadius: 4,
            background: '#23232a',
            color: 'white',
            border: '2px solid #FF6B9D',
            display: 'flex',
            flexDirection: 'column',
            minHeight: 400,
            maxHeight: '70vh',
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
                <span>전체 사용자 채팅 ({users.length}명)</span>
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
              sx={{ display: 'flex', alignItems: 'center', gap: 1, ml: 0.5, flexWrap: 'wrap' }}
            >
              <Typography sx={{ fontSize: 11, color: '#fff', opacity: 0.8, mr: 1 }}>
                참여자: {users.length}명 | 온라인: {onlineUsers.length}명
              </Typography>
              {users.slice(0, 5).map((user, i) => (
                <Box
                  key={user.id}
                  sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}
                >
                  <Avatar
                    sx={{
                      width: 20,
                      height: 20,
                      bgcolor: onlineUsers.includes(user.name || user.username) ? '#4CAF50' : '#666',
                      fontSize: 11,
                    }}
                  >
                    {(user.name || user.username || '?')[0]}
                  </Avatar>
                  <Typography
                    sx={{ fontSize: 10, color: '#fff', opacity: 0.8 }}
                  >
                    {user.name || user.username}
                  </Typography>
                  {i < Math.min(users.length, 5) - 1 && (
                    <span style={{ color: '#fff', opacity: 0.5 }}>|</span>
                  )}
                </Box>
              ))}
              {users.length > 5 && (
                <Typography sx={{ fontSize: 10, color: '#fff', opacity: 0.6 }}>
                  +{users.length - 5}명 더
                </Typography>
              )}
            </Box>
          </Box>

          {/* 채팅 메시지 리스트 */}
          <Box
            ref={chatScrollRef}
            sx={{
              flex: 1,
              overflowY: 'auto',
              p: 1.2,
              background: 'rgba(255,255,255,0.02)',
              scrollBehavior: 'smooth',
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
                  {msg.user?.charAt(0) || '?'}
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
                  {msg.imageUrl ? (
                    <Box sx={{ mb: 1 }}>
                      <img
                        src={msg.imageUrl}
                        alt="채팅 이미지"
                        style={{
                          maxWidth: '100%',
                          maxHeight: 200,
                          borderRadius: 8,
                          cursor: 'pointer'
                        }}
                        onClick={() => window.open(msg.imageUrl, '_blank')}
                      />
                    </Box>
                  ) : null}
                  {msg.text && (
                    <Typography sx={{ fontWeight: 500 }}>{msg.text}</Typography>
                  )}
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
          {/* 이미지 미리보기 */}
          {imagePreview && (
            <Box
              sx={{
                p: 1,
                borderTop: '1px solid #FF6B9D',
                background: 'rgba(255,255,255,0.05)',
                position: 'relative',
              }}
            >
              <Box sx={{ position: 'relative', display: 'inline-block' }}>
                <img
                  src={imagePreview}
                  alt="미리보기"
                  style={{
                    maxWidth: 150,
                    maxHeight: 150,
                    borderRadius: 8,
                  }}
                />
                <IconButton
                  size="small"
                  onClick={() => {
                    setSelectedImage(null);
                    setImagePreview(null);
                  }}
                  sx={{
                    position: 'absolute',
                    top: -8,
                    right: -8,
                    bgcolor: '#FF4757',
                    color: 'white',
                    '&:hover': { bgcolor: '#FF3742' },
                  }}
                >
                  <CloseIcon fontSize="small" />
                </IconButton>
              </Box>
            </Box>
          )}

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
            <input
              type="file"
              accept="image/*"
              onChange={handleImageSelect}
              style={{ display: 'none' }}
              id="image-input"
            />
            <label htmlFor="image-input">
              <IconButton
                component="span"
                sx={{
                  color: '#FF6B9D',
                  '&:hover': { bgcolor: 'rgba(255, 107, 157, 0.1)' },
                }}
              >
                <ImageIcon />
              </IconButton>
            </label>
            <IconButton
              onClick={handleOpenGallery}
              sx={{
                color: '#FF6B9D',
                '&:hover': { bgcolor: 'rgba(255, 107, 157, 0.1)' },
              }}
            >
              <PhotoLibraryIcon />
            </IconButton>
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
              onClick={selectedImage ? handleImageUpload : handleSendChat}
              disabled={uploadingImage || (!chatInput.trim() && !selectedImage)}
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
                '&:disabled': {
                  background: 'rgba(255,255,255,0.1)',
                  color: 'rgba(255,255,255,0.3)',
                },
              }}
            >
              {uploadingImage ? '업로드중...' : selectedImage ? '사진전송' : '전송'}
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

      {/* 갤러리 모달 */}
      <Dialog
        open={galleryModalOpen}
        onClose={() => setGalleryModalOpen(false)}
        maxWidth="lg"
        fullWidth
        PaperProps={{
          sx: {
            backgroundColor: '#23232a',
            color: '#e0e6ed',
            maxHeight: '90vh',
          },
        }}
      >
        <DialogTitle
          sx={{
            borderBottom: '1px solid #2e3a4a',
            backgroundColor: '#1a1f2e',
            color: '#40c4ff',
            fontWeight: 'bold',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <PhotoLibraryIcon />
            채팅 이미지 갤러리
          </Box>
          <Box sx={{ display: 'flex', gap: 1 }}>
            {selectedImagesForDownload.length > 0 && (
              <Button
                variant="contained"
                size="small"
                onClick={handleSelectedImagesDownload}
                startIcon={<DownloadIcon />}
                sx={{
                  background: 'linear-gradient(135deg, #FF6B9D 0%, #FF4757 100%)',
                  color: 'white',
                  '&:hover': {
                    background: 'linear-gradient(135deg, #FFB3D1 0%, #FF6B7A 100%)',
                  },
                }}
              >
                선택 다운로드 ({selectedImagesForDownload.length})
              </Button>
            )}
            <IconButton
              onClick={() => setGalleryModalOpen(false)}
              sx={{ color: '#b0b8c1' }}
            >
              <CloseIcon />
            </IconButton>
          </Box>
        </DialogTitle>
        <DialogContent sx={{ p: 3 }}>
          {chatImages.length > 0 ? (
            <Grid container spacing={2}>
              {chatImages.map((image, index) => (
                <Grid item xs={6} sm={4} md={3} key={index}>
                  <Box
                    sx={{
                      position: 'relative',
                      border: selectedImagesForDownload.includes(image.url) 
                        ? '3px solid #FF6B9D' 
                        : '1px solid #2e3a4a',
                      borderRadius: 2,
                      overflow: 'hidden',
                      cursor: 'pointer',
                      '&:hover': {
                        borderColor: '#FF6B9D',
                      },
                    }}
                    onClick={() => {
                      if (selectedImagesForDownload.includes(image.url)) {
                        setSelectedImagesForDownload(prev => 
                          prev.filter(url => url !== image.url)
                        );
                      } else {
                        setSelectedImagesForDownload(prev => [...prev, image.url]);
                      }
                    }}
                  >
                    <img
                      src={image.url}
                      alt={image.name}
                      style={{
                        width: '100%',
                        height: 150,
                        objectFit: 'cover',
                      }}
                    />
                    <Box
                      sx={{
                        position: 'absolute',
                        top: 8,
                        right: 8,
                        display: 'flex',
                        gap: 0.5,
                      }}
                    >
                      <IconButton
                        size="small"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleImageDownload(image.url, image.name);
                        }}
                        sx={{
                          bgcolor: 'rgba(0,0,0,0.7)',
                          color: 'white',
                          '&:hover': { bgcolor: 'rgba(0,0,0,0.9)' },
                        }}
                      >
                        <DownloadIcon fontSize="small" />
                      </IconButton>
                    </Box>
                    {selectedImagesForDownload.includes(image.url) && (
                      <Box
                        sx={{
                          position: 'absolute',
                          top: 8,
                          left: 8,
                          bgcolor: '#FF6B9D',
                          borderRadius: '50%',
                          width: 24,
                          height: 24,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                      >
                        <Typography sx={{ color: 'white', fontSize: 12 }}>✓</Typography>
                      </Box>
                    )}
                  </Box>
                </Grid>
              ))}
            </Grid>
          ) : (
            <Box sx={{ textAlign: 'center', py: 4 }}>
              <PhotoLibraryIcon sx={{ fontSize: 48, color: '#b0b8c1', mb: 2 }} />
              <Typography color="#b0b8c1">
                아직 업로드된 이미지가 없습니다.
              </Typography>
            </Box>
          )}
        </DialogContent>
      </Dialog>

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

            {/* 내용 입력 */}
            <TextField
              label="내용"
              value={newQuickLink.value}
              onChange={(e) => setNewQuickLink(prev => ({ ...prev, value: e.target.value }))}
              fullWidth
              multiline
              rows={3}
              placeholder="링크 설명이나 복사할 텍스트를 입력하세요"
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
              placeholder="https://example.com"
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
              <Typography variant="subtitle2" sx={{ color: 'white', mb: 1 }}>
                아이콘 선택
              </Typography>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 2 }}>
                {iconOptions.map((option) => (
                  <Tooltip key={option.value} title={option.label}>
                    <IconButton
                      onClick={() => setNewQuickLink(prev => ({ ...prev, icon: option.value }))}
                      sx={{
                        width: 48,
                        height: 48,
                        background: newQuickLink.icon === option.value 
                          ? 'rgba(255, 107, 157, 0.3)' 
                          : 'rgba(255, 255, 255, 0.1)',
                        border: newQuickLink.icon === option.value 
                          ? '2px solid #FF6B9D' 
                          : '1px solid rgba(255, 255, 255, 0.2)',
                        color: 'white',
                        '&:hover': {
                          background: 'rgba(255, 107, 157, 0.2)',
                          borderColor: '#FF6B9D',
                        },
                      }}
                    >
                      {option.icon}
                    </IconButton>
                  </Tooltip>
                ))}
              </Box>
            </Box>

            {/* 커스텀 아이콘 업로드 */}
            <Box>
              <Typography variant="subtitle2" sx={{ color: 'white', mb: 1 }}>
                커스텀 아이콘 업로드 (선택사항)
              </Typography>
              <input
                accept="image/*"
                style={{ display: 'none' }}
                id="icon-file-input"
                type="file"
                onChange={handleIconFileSelect}
              />
              <label htmlFor="icon-file-input">
                <Button
                  variant="outlined"
                  component="span"
                  startIcon={<CloudUploadIcon />}
                  sx={{
                    borderColor: 'rgba(255, 107, 157, 0.5)',
                    color: '#FF6B9D',
                    '&:hover': {
                      borderColor: '#FF6B9D',
                      background: 'rgba(255, 107, 157, 0.1)',
                    },
                  }}
                >
                  아이콘 이미지 업로드
                </Button>
              </label>
              {newQuickLink.customIcon && (
                <Box sx={{ mt: 1, display: 'flex', alignItems: 'center', gap: 1 }}>
                  <img
                    src={URL.createObjectURL(newQuickLink.customIcon)}
                    alt="Preview"
                    style={{ width: 32, height: 32, borderRadius: 4 }}
                  />
                  <Typography variant="body2" sx={{ color: 'white' }}>
                    {newQuickLink.customIcon.name}
                  </Typography>
                </Box>
              )}
            </Box>

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
