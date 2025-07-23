import React, { useState, createContext, useEffect } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import {
  Box,
  Drawer,
  AppBar,
  Toolbar,
  List,
  Typography,
  Divider,
  IconButton,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Avatar,
  Menu,
  MenuItem,
  Chip,
  Badge,
  Tooltip,
  useTheme,
  useMediaQuery,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Alert,
  Button,
} from '@mui/material';
import {
  Menu as MenuIcon,
  Dashboard as DashboardIcon,
  Assessment as AssessmentIcon,
  Business as BusinessIcon,
  People as PeopleIcon,
  Inventory as InventoryIcon,
  Settings as SettingsIcon,
  AccountCircle as AccountCircleIcon,
  Notifications as NotificationsIcon,
  Logout as LogoutIcon,
  ChevronLeft as ChevronLeftIcon,
  ChevronRight as ChevronRightIcon,
  ArrowBack as ArrowBackIcon,
  Home as HomeIcon,
  Description as DescriptionIcon,
  LocalShipping as LocalShippingIcon,
  Schedule as ScheduleIcon,
  Straighten as StraightenIcon,
  History as HistoryIcon,
  Store as StoreIcon,
  Calculate as CalculateIcon,
  Receipt as ReceiptIcon,
  BarChart as BarChartIcon,
  LocalFlorist as LocalFloristIcon,
  Star as StarIcon,
  Favorite as FavoriteIcon,
  ViewInAr as ViewInArIcon,
  PhotoCamera as PhotoCameraIcon,
  Delete as DeleteIcon,
  Close as CloseIcon,
  Lock as LockIcon,
  Person as PersonIcon,
  Palette as PaletteIcon,
} from '@mui/icons-material';
import { styled } from '@mui/material/styles';
import NotificationPanel from './NotificationPanel';
import ThemeSettings from './ThemeSettings';
import {
  useNotificationStore,
  initializeNotificationStore,
  requestNotificationPermission,
} from '../utils/notificationStore';
import { API_BASE } from '../utils/auth';

// 커스텀 스타일드 컴포넌트
const StyledDrawer = styled(Drawer)(({ theme }) => ({
  '& .MuiDrawer-paper': {
    width: 280,
    background: theme.palette.mode === 'dark' 
      ? 'linear-gradient(180deg, #1A1A1A 0%, #2D2D2D 100%)'
      : 'linear-gradient(180deg, #FFFFFF 0%, #F8F9FA 100%)',
    borderRight: `1px solid ${theme.palette.mode === 'dark' 
      ? `${theme.palette.primary.main}20` 
      : `${theme.palette.primary.main}10`}`,
    backdropFilter: 'blur(10px)',
    boxShadow: theme.palette.mode === 'dark'
      ? `4px 0 20px ${theme.palette.primary.main}15`
      : '4px 0 20px rgba(0, 0, 0, 0.1)',
    position: 'relative',
  },
}));

const StyledAppBar = styled(AppBar)(({ theme }) => ({
  background: theme.palette.mode === 'dark'
    ? 'linear-gradient(90deg, #1A1A1A 0%, #2D2D2D 100%)'
    : 'linear-gradient(90deg, #FFFFFF 0%, #F8F9FA 100%)',
  backdropFilter: 'blur(10px)',
  borderBottom: `1px solid ${theme.palette.mode === 'dark'
    ? `${theme.palette.primary.main}20`
    : `${theme.palette.primary.main}10`}`,
  boxShadow: theme.palette.mode === 'dark'
    ? `0 2px 20px ${theme.palette.primary.main}15`
    : '0 2px 20px rgba(0, 0, 0, 0.1)',
  position: 'relative',
  '& .MuiToolbar-root': {
    color: theme.palette.mode === 'dark' ? '#FFFFFF' : '#000000',
  },
}));

const StyledListItemButton = styled(ListItemButton)(({ theme }) => {
  // 현재 테마의 primary와 secondary 색상 가져오기
  const primaryColor = theme.palette.primary.main;
  const secondaryColor = theme.palette.secondary.main;
  
  return {
    margin: '0 1px',
    minHeight: 22,
    borderRadius: 12,
    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
    color: theme.palette.mode === 'dark' ? '#FFFFFF' : '#000000',
    '&:hover': {
      background: theme.palette.mode === 'dark' 
        ? `${primaryColor}15` 
        : `${primaryColor}10`,
      transform: 'translateX(8px)',
      boxShadow: theme.palette.mode === 'dark'
        ? `0 4px 20px ${primaryColor}20`
        : `0 4px 20px ${primaryColor}15`,
    },
    '&.Mui-selected': {
      background: `linear-gradient(135deg, ${primaryColor} 0%, ${secondaryColor} 100%)`,
      color: 'white',
      boxShadow: theme.palette.mode === 'dark'
        ? `0 4px 20px ${primaryColor}30`
        : `0 4px 20px ${primaryColor}25`,
      '&:hover': {
        background: `linear-gradient(135deg, ${secondaryColor} 0%, ${primaryColor} 100%)`,
      },
    },
  };
});

const StyledListItemIcon = styled(ListItemIcon)(({ theme }) => ({
  minWidth: 40,
  color: 'inherit',
  '& .MuiSvgIcon-root': {
    fontSize: '1.5rem',
    filter: 'drop-shadow(0 2px 4px rgba(255, 255, 255, 0.2))',
  },
}));

const LogoContainer = styled(Box)(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  padding: '24px 20px',
  marginBottom: '20px',
  color: 'var(--text-color)',
  position: 'relative',
  '&::after': {
    content: '""',
    position: 'absolute',
    bottom: 0,
    left: '20px',
    right: '20px',
    height: '1px',
    background: 'linear-gradient(90deg, transparent 0%, var(--border-color) 50%, transparent 100%)',
    opacity: 0.6,
  },
}));

const MenuSection = styled(Box)(({ theme }) => ({
  marginBottom: '24px',
  '& .MuiTypography-root': {
    padding: '8px 16px',
    fontSize: '0.8125rem',
    fontWeight: 600,
    color: theme.palette.mode === 'dark' 
      ? 'rgba(255, 255, 255, 0.7)' 
      : 'rgba(0, 0, 0, 0.6)',
    textTransform: 'uppercase',
    letterSpacing: '1px',
  },
}));

const FloatingDecoration = styled(Box)(({ theme }) => ({
  position: 'absolute',
  width: '60px',
  height: '60px',
  background:
    'linear-gradient(135deg, var(--hover-color) 0%, var(--border-color) 100%)',
  borderRadius: '50%',
  backdropFilter: 'blur(10px)',
  border: '1px solid var(--border-color)',
  animation: 'float 6s ease-in-out infinite',
  '&:nth-of-type(1)': {
    top: '20%',
    left: '10%',
    animationDelay: '0s',
  },
  '&:nth-of-type(2)': {
    top: '60%',
    right: '10%',
    animationDelay: '2s',
  },
  '&:nth-of-type(3)': {
    bottom: '20%',
    left: '20%',
    animationDelay: '4s',
  },
}));

// 메뉴 아이템 정의 (권한별 접근 제어)
const menuItems = [
  {
    section: '업무',
    items: [
      {
        text: '견적 관리',
        icon: <AssessmentIcon />,
        path: '/estimate',
        roles: ['admin', 'staff'],
      },
      {
        text: '계약 관리',
        icon: <DescriptionIcon />,
        path: '/contract',
        roles: ['admin', 'staff'],
      },
      {
        text: '주문 관리',
        icon: <BusinessIcon />,
        path: '/order',
        roles: ['admin', 'staff'],
      },
      {
        text: '납품 관리',
        icon: <LocalShippingIcon />,
        path: '/delivery',
        roles: ['admin', 'staff'],
      },
      {
        text: '스케줄',
        icon: <ScheduleIcon />,
        path: '/schedule',
        roles: ['admin', 'staff', 'guest'],
      },
      {
        text: '실측 데이터',
        icon: <StraightenIcon />,
        path: '/measurement',
        roles: ['admin', 'staff'],
      },
      {
        text: '과거자료조회',
        icon: <HistoryIcon />,
        path: '/historical',
        roles: ['admin', 'staff', 'guest'],
      },
      {
        text: '커튼 시뮬레이터',
        icon: <ViewInArIcon />,
        path: '/curtain-simulator',
        roles: ['admin', 'staff', 'guest'],
      },
    ],
  },
  {
    section: '관리',
    items: [
      {
        text: '고객 관리',
        icon: <PeopleIcon />,
        path: '/customers',
        roles: ['admin', 'staff'],
      },
      {
        text: '제품 관리',
        icon: <InventoryIcon />,
        path: '/products',
        roles: ['admin'],
      },
      {
        text: '옵션 관리',
        icon: <SettingsIcon />,
        path: '/options',
        roles: ['admin'],
      },
      {
        text: '공식 관리',
        icon: <CalculateIcon />,
        path: '/formulas',
        roles: ['admin'],
      },
      {
        text: '우리회사정보',
        icon: <StoreIcon />,
        path: '/company-info',
        roles: ['admin'],
      },
      {
        text: '거래처 관리',
        icon: <BusinessIcon />,
        path: '/vendors',
        roles: ['admin'],
      },
      {
        text: '회계 관리',
        icon: <ReceiptIcon />,
        path: '/accounting',
        roles: ['admin'],
      },
      {
        text: '통계',
        icon: <BarChartIcon />,
        path: '/statistics',
        roles: ['admin'],
      },
      {
        text: '세금계산서',
        icon: <ReceiptIcon />,
        path: '/tax-invoice',
        roles: ['admin'],
      },
      {
        text: '직원/사용자관리',
        icon: <PeopleIcon />,
        path: '/admin/users',
        roles: ['admin'],
      },

    ],
  },
];

// UserContext 정의
interface UserContextType {
  userId: string | undefined;
  setUserId: (id: string | undefined) => void;
  userRole: string;
  setUserRole: (role: string) => void;
  nickname: string;
  setNickname: (name: string) => void;
  profileImage: string;
  setProfileImage: (image: string) => void;
  refreshUserList: () => void;
}

export const UserContext = createContext<UserContextType>({
  userId: undefined,
  setUserId: () => {},
  userRole: 'guest',
  setUserRole: () => {},
  nickname: '',
  setNickname: () => {},
  profileImage: '',
  setProfileImage: () => {},
  refreshUserList: () => {},
});

// 유니코드 안전 base64 변환 함수
function toBase64Unicode(str: string) {
  return window.btoa(unescape(encodeURIComponent(str)));
}

const Layout: React.FC = () => {
  const [drawerOpen, setDrawerOpen] = useState(true);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const navigate = useNavigate();
  const location = useLocation();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [nicknameDialogOpen, setNicknameDialogOpen] = useState(false);
  const [nicknameInput, setNicknameInput] = useState('');
  const [nicknameError, setNicknameError] = useState('');
  const [nicknameSuccess, setNicknameSuccess] = useState('');
  const [nicknameLoading, setNicknameLoading] = useState(false);
  const [notificationPanelOpen, setNotificationPanelOpen] = useState(false);
  const { unreadCount } = useNotificationStore();
  const [userId, setUserId] = useState<string | undefined>();
  const [userRole, setUserRole] = useState('guest');
  const [nickname, setNickname] = useState('');
  const [profileImage, setProfileImage] = useState('');
  const [profileImageFile, setProfileImageFile] = useState<File | null>(null);
  const [profileImagePreview, setProfileImagePreview] = useState<string>('');
  const [profileUploadLoading, setProfileUploadLoading] = useState(false);
  const [avatarSelectionModalOpen, setAvatarSelectionModalOpen] = useState(false);
  const [profileModalOpen, setProfileModalOpen] = useState(false);
  const [passwordChangeModalOpen, setPasswordChangeModalOpen] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [passwordSuccess, setPasswordSuccess] = useState('');
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [refreshUserListFn, setRefreshUserListFn] = useState<(() => void) | null>(null);
  const [themeSettingsOpen, setThemeSettingsOpen] = useState(false);

  // 기본 아바타 15종 정의
  const defaultAvatars = [
    { id: 'avatar1', emoji: '😀', color: '#FF6B9D' },
    { id: 'avatar2', emoji: '😎', color: '#4ECDC4' },
    { id: 'avatar3', emoji: '🤖', color: '#45B7D1' },
    { id: 'avatar4', emoji: '🐱', color: '#96CEB4' },
    { id: 'avatar5', emoji: '🦄', color: '#FFEAA7' },
    { id: 'avatar6', emoji: '🌟', color: '#DDA0DD' },
    { id: 'avatar7', emoji: '🎮', color: '#98D8C8' },
    { id: 'avatar8', emoji: '🎨', color: '#F7DC6F' },
    { id: 'avatar9', emoji: '🚀', color: '#BB8FCE' },
    { id: 'avatar10', emoji: '🎯', color: '#85C1E9' },
    { id: 'avatar11', emoji: '🌈', color: '#F8C471' },
    { id: 'avatar12', emoji: '🎪', color: '#E8DAEF' },
    { id: 'avatar13', emoji: '🎭', color: '#FADBD8' },
    { id: 'avatar14', emoji: '🎪', color: '#D5A6BD' },
    { id: 'avatar15', emoji: '🎨', color: '#A9CCE3' },
  ];

  // 현재 사용자 역할에 따라 메뉴 필터링
  const getFilteredMenuItems = () => {
    return menuItems
      .map(section => ({
        ...section,
        items: section.items.filter(
          item => !item.roles || item.roles.includes(userRole)
        ),
      }))
      .filter(section => section.items.length > 0);
  };

  const handleDrawerToggle = () => {
    setDrawerOpen(!drawerOpen);
  };

  const handleProfileMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    console.log('프로필 모달 열기');
    setProfileModalOpen(true);
  };

  const handleProfileMenuClose = () => {
    setAnchorEl(null);
  };

  const handleLogout = async () => {
    try {
      const token = localStorage.getItem('token');
      if (token) {
        // 서버에 로그아웃 요청 (선택사항)
        await fetch(`${API_BASE}/logout`, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }).catch(() => {
          // 서버 오류가 있어도 클라이언트에서는 로그아웃 처리
        });
      }
    } catch (error) {
      console.error('로그아웃 오류:', error);
    } finally {
      // 클라이언트 상태 정리
      localStorage.removeItem('token');
      setUserId(undefined);
      setUserRole('guest');
      setNickname('');
      setProfileImage('');
      navigate('/login');
    }
  };

  // 프로필 사진 선택 핸들러
  const handleProfileImageChange = (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];
    if (file) {
      setProfileImageFile(file);
      const reader = new FileReader();
      reader.onload = e => {
        setProfileImagePreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
      // 프로필 모달 닫기
      setProfileModalOpen(false);
    }
  };

  // 프로필 사진 업로드 핸들러
  const handleProfileImageUpload = async () => {
    if (!profileImageFile) return;

    setProfileUploadLoading(true);
    try {
      const token = localStorage.getItem('token');
      console.log('프로필 사진 업로드 시작:', profileImageFile.name);
      
      // 파일을 Base64로 변환
      const reader = new FileReader();
      reader.onload = async (e) => {
        try {
          const base64Data = e.target?.result as string;
          const imageType = profileImageFile.type;
          
          const response = await fetch(`${API_BASE}/uploadProfileImage`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({
              imageData: base64Data,
              imageType: imageType
            }),
          });

          console.log('업로드 응답 상태:', response.status);
          
          if (response.ok) {
            const data = await response.json();
            console.log('업로드 성공 응답:', data);
            setProfileImage(data.profileImage);
            setProfileImageFile(null);
            setProfileImagePreview('');
            // 성공 메시지 표시
            alert('프로필 사진이 성공적으로 업로드되었습니다.');
          } else {
            const errorText = await response.text();
            console.error('프로필 사진 업로드 실패:', response.status, errorText);
            alert('프로필 사진 업로드에 실패했습니다.');
          }
        } catch (error) {
          console.error('프로필 사진 업로드 오류:', error);
          alert('프로필 사진 업로드 중 오류가 발생했습니다.');
        } finally {
          setProfileUploadLoading(false);
        }
      };
      
      reader.readAsDataURL(profileImageFile);
      
    } catch (error) {
      console.error('프로필 사진 업로드 오류:', error);
      setProfileUploadLoading(false);
    }
  };

  // 아바타 선택 핸들러
  const handleAvatarSelect = (avatarId: string) => {
    const selectedAvatar = defaultAvatars.find(av => av.id === avatarId);
    if (selectedAvatar) {
      const svgString = `
        <svg width="100" height="100" xmlns="http://www.w3.org/2000/svg">
          <circle cx="50" cy="50" r="50" fill="${selectedAvatar.color}"/>
          <text x="50" y="60" font-size="40" text-anchor="middle" fill="white">${selectedAvatar.emoji}</text>
        </svg>
      `;
      const dataUrl = `data:image/svg+xml;base64,${toBase64Unicode(svgString)}`;
      setProfileImage(dataUrl);
      setAvatarSelectionModalOpen(false);
      alert('아바타가 변경되었습니다.');
    }
  };

  // 프로필 사진 삭제 핸들러
  const handleProfileImageDelete = async () => {
    setProfileUploadLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE}/deleteProfileImage`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        setProfileImage('');
        setProfileImageFile(null);
        setProfileImagePreview('');
        // 성공 메시지 표시
        alert('프로필 사진이 삭제되었습니다.');
      } else {
        console.error('프로필 사진 삭제 실패');
        alert('프로필 사진 삭제에 실패했습니다.');
      }
    } catch (error) {
      console.error('프로필 사진 삭제 오류:', error);
      alert('프로필 사진 삭제 중 오류가 발생했습니다.');
    } finally {
      setProfileUploadLoading(false);
    }
  };

  // 로그인 상태 확인 및 WebSocket 연결
  useEffect(() => {
    const checkAuthStatus = async () => {
      const token = localStorage.getItem('token');
      if (!token) {
        // 토큰이 없으면 로그인 페이지로 리다이렉트
        navigate('/login');
        return;
      }

      try {
        // 토큰 유효성 검증
        const response = await fetch(`${API_BASE}/me`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!response.ok) {
          // 토큰이 유효하지 않으면 제거하고 로그인 페이지로 리다이렉트
          localStorage.removeItem('token');
          navigate('/login');
          return;
        }

        const userData = await response.json();

        // JWT 토큰에서 사용자 정보 추출
        const payload = JSON.parse(atob(token.split('.')[1]));
        setUserId(userData.id || userData.username || payload.username || payload.id);
        setNickname(userData.name || userData.nickname || '사용자'); // 서버 응답에서 닉네임 사용
        setUserRole(userData.role || payload.role || 'guest');

        // 프로필 사진 정보 설정
        if (userData.profileImage) {
          setProfileImage(`${API_BASE}/profile/image/${userData.id || userData.username || payload.username || payload.id}`);
        }
      } catch (error) {
        console.error('인증 상태 확인 오류:', error);
        // 오류 발생 시 토큰 제거하고 로그인 페이지로 리다이렉트
        localStorage.removeItem('token');
        navigate('/login');
      }
    };

    checkAuthStatus();
  }, [navigate]);

  // WebSocket 연결
  useEffect(() => {
    // WebSocket 관련 코드 전체 제거
  }, []);

  // 알림 시스템 초기화
  useEffect(() => {
    initializeNotificationStore();
    requestNotificationPermission();
  }, []);

  // 테마 설정은 Context에서 관리하므로 제거

  // 닉네임 변경 핸들러
  const handleNicknameChange = async () => {
    setNicknameError('');
    setNicknameSuccess('');
    setNicknameLoading(true);
    
    const token = localStorage.getItem('token');
    if (!token) {
      setNicknameError('로그인이 필요합니다.');
      setNicknameLoading(false);
      return;
    }
    
    if (!nicknameInput.trim()) {
      setNicknameError('닉네임을 입력하세요.');
      setNicknameLoading(false);
      return;
    }
    
    try {
      console.log('닉네임 변경 요청:', nicknameInput);
      
      const res = await fetch(`${API_BASE}/nickname`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ nickname: nicknameInput.trim() }),
      });
      
      console.log('닉네임 변경 응답 상태:', res.status);
      
      if (!res.ok) {
        const errorText = await res.text();
        console.error('닉네임 변경 실패:', errorText);
        setNicknameError(errorText || '닉네임 변경에 실패했습니다.');
        setNicknameLoading(false);
        return;
      }
      
      const result = await res.json();
      console.log('닉네임 변경 성공:', result);
      
      // 닉네임 변경 성공 시 즉시 업데이트
      setNickname(nicknameInput.trim());
      setNicknameSuccess('닉네임이 변경되었습니다.');
      
      // 1초 후 다이얼로그 닫기
      setTimeout(() => {
        setNicknameDialogOpen(false);
        setNicknameSuccess('');
      }, 1000);
      
    } catch (error) {
      console.error('닉네임 변경 오류:', error);
      setNicknameError('서버 오류가 발생했습니다.');
    } finally {
      setNicknameLoading(false);
    }
  };

  // 비밀번호 변경 핸들러
  const handlePasswordChange = async () => {
    setPasswordError('');
    setPasswordSuccess('');
    setPasswordLoading(true);
    
    if (!currentPassword || !newPassword || !confirmPassword) {
      setPasswordError('모든 필드를 입력해주세요.');
      setPasswordLoading(false);
      return;
    }
    
    if (newPassword !== confirmPassword) {
      setPasswordError('새 비밀번호가 일치하지 않습니다.');
      setPasswordLoading(false);
      return;
    }
    
    if (newPassword.length < 6) {
      setPasswordError('새 비밀번호는 6자 이상이어야 합니다.');
      setPasswordLoading(false);
      return;
    }
    
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE}/changePassword`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          currentPassword,
          newPassword,
        }),
      });
      
      if (response.ok) {
        setPasswordSuccess('비밀번호가 성공적으로 변경되었습니다.');
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
        setTimeout(() => setPasswordChangeModalOpen(false), 1500);
      } else {
        const errorText = await response.text();
        setPasswordError(errorText || '비밀번호 변경에 실패했습니다.');
      }
    } catch (error) {
      setPasswordError('서버 오류가 발생했습니다.');
    } finally {
      setPasswordLoading(false);
    }
  };



  const handleNotificationClick = () => {
    setNotificationPanelOpen(true);
  };

  const handleThemeSettingsOpen = () => {
    setThemeSettingsOpen(true);
  };

  const handleThemeSettingsClose = () => {
    setThemeSettingsOpen(false);
  };

  const drawer = (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        height: '100vh',
        minHeight: 0,
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* 플로팅 장식 요소들 */}
      <FloatingDecoration />
      <FloatingDecoration />
      <FloatingDecoration />

      {/* 로고 섹션 */}
      <LogoContainer>
        <Box
          onClick={() => navigate('/dashboard')}
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: 1.5,
            cursor: 'pointer',
            transition: 'all 0.3s ease',
            '&:hover': {
              transform: 'translateY(-1px)',
              '& .logo-icon': {
                transform: 'scale(1.05) rotate(5deg)',
              },
              '& .logo-text': {
                transform: 'translateX(2px)',
              }
            },
            borderRadius: 3,
            p: 1,
          }}
        >
          {/* 심플한 아이콘 컨테이너 */}
          <Box
            className="logo-icon"
            sx={{
              width: 36,
              height: 36,
              background: (theme) => `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.secondary.main} 100%)`,
              borderRadius: '10px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: (theme) => `0 4px 15px ${theme.palette.primary.main}30`,
              transition: 'all 0.3s ease',
              position: 'relative',
              '&::before': {
                content: '""',
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                borderRadius: '10px',
                background: 'linear-gradient(135deg, rgba(255,255,255,0.1) 0%, transparent 100%)',
                pointerEvents: 'none',
              }
            }}
          >
            {/* 세련된 창문 아이콘 */}
            <Box
              sx={{
                width: 18,
                height: 18,
                position: 'relative',
                '&::before': {
                  content: '""',
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                  border: '2px solid white',
                  borderRadius: '3px',
                },
                '&::after': {
                  content: '""',
                  position: 'absolute',
                  top: '50%',
                  left: '50%',
                  transform: 'translate(-50%, -50%)',
                  width: '2px',
                  height: '10px',
                  background: 'white',
                  borderRadius: '1px',
                }
              }}
            >
              {/* 창문 내부 십자선 */}
              <Box
                sx={{
                  position: 'absolute',
                  top: '50%',
                  left: '50%',
                  transform: 'translate(-50%, -50%)',
                  width: '10px',
                  height: '2px',
                  background: 'white',
                  borderRadius: '1px',
                }}
              />
            </Box>
          </Box>
          
          {/* 텍스트 부분 */}
          <Box className="logo-text" sx={{ transition: 'transform 0.3s ease' }}>
            <Typography
              variant="h6"
              sx={{
                fontWeight: 700,
                color: (theme) => theme.palette.mode === 'dark' ? '#FFFFFF' : '#000000',
                fontSize: '1.1rem',
                letterSpacing: '-0.5px',
                lineHeight: 1.2,
              }}
            >
              윈도우갤러리
            </Typography>
            <Typography
              variant="caption"
              sx={{
                color: (theme) => theme.palette.mode === 'dark' 
                  ? 'rgba(255, 255, 255, 0.7)' 
                  : 'rgba(0, 0, 0, 0.6)',
                fontSize: '0.7rem',
                fontWeight: 500,
                letterSpacing: '0.5px',
                textTransform: 'uppercase',
              }}
            >
              Window Gallery
            </Typography>
          </Box>
        </Box>
      </LogoContainer>

      {/* 메뉴 섹션들 */}
      <Box
        sx={{
          flex: 1,
          minHeight: 0,
          overflowY: 'auto',
          display: 'flex',
          flexDirection: 'column',
          gap: 0.5,
          px: 1,
          pt: 1,
        }}
      >
        {getFilteredMenuItems().map((section, sectionIndex) => (
          <MenuSection key={sectionIndex}>
            <Typography variant="overline">{section.section}</Typography>
            <List>
              {section.items.map((item, itemIndex) => (
                <ListItem key={itemIndex} disablePadding>
                  <StyledListItemButton
                    selected={location.pathname === item.path}
                    onClick={() => navigate(item.path)}
                    sx={{
                      '& .MuiListItemText-primary': {
                        fontWeight: location.pathname === item.path ? 700 : 500,
                      },
                      minHeight: 40,
                    }}
                  >
                    <StyledListItemIcon>{item.icon}</StyledListItemIcon>
                    <ListItemText
                      primary={item.text}
                      sx={{
                        '& .MuiListItemText-primary': {
                          fontSize: 'calc(0.9rem + 1.5px)',
                        },
                      }}
                    />
                    {location.pathname === item.path && (
                      <StarIcon
                        sx={{
                          fontSize: '1rem',
                          color: 'rgba(255, 255, 255, 0.8)',
                          ml: 1,
                        }}
                      />
                    )}
                  </StyledListItemButton>
                </ListItem>
              ))}

            </List>
          </MenuSection>
        ))}
      </Box>

      {/* 하단 장식 */}
              <Box
          sx={{
            padding: '16px',
            textAlign: 'center',
            borderTop: (theme) => `1px solid ${theme.palette.mode === 'dark' 
              ? `${theme.palette.primary.main}20` 
              : `${theme.palette.primary.main}10`}`,
            background: (theme) => theme.palette.mode === 'dark'
              ? `${theme.palette.primary.main}05`
              : `${theme.palette.primary.main}03`,
          }}
        >
        <Typography
          variant="caption"
          sx={{
            color: (theme) => theme.palette.mode === 'dark'
              ? 'rgba(255, 255, 255, 0.6)'
              : 'rgba(0, 0, 0, 0.5)',
            fontSize: '0.75rem',
          }}
        >
          Made with ❤️ for Window Gallery
        </Typography>
      </Box>
    </Box>
  );

  return (
    <UserContext.Provider value={{
      userId,
      setUserId,
      userRole,
      setUserRole,
      nickname,
      setNickname,
      profileImage,
      setProfileImage,
      refreshUserList: () => {
        // 사용자 목록 새로고침 기능 제거됨
      },
    }}>
      <Box sx={{ display: 'flex', height: '100vh' }}>
        {/* 사이드바 */}
        <StyledDrawer
          variant={isMobile ? 'temporary' : 'persistent'}
          open={drawerOpen}
          onClose={handleDrawerToggle}
          ModalProps={{
            keepMounted: true, // 모바일에서 성능 향상을 위해
          }}
          sx={{
            ...(drawerOpen ? {} : { display: 'none' }),
          }}
        >
          {drawer}
        </StyledDrawer>

        {/* 메인 콘텐츠 */}
        <Box
          component="main"
          sx={{
            flexGrow: 1,
            display: 'flex',
            flexDirection: 'column',
            minHeight: '100vh',
            background: 'var(--background-color)',
            position: 'relative',
            width: drawerOpen ? undefined : '100%',
          }}
        >
          {/* 헤더 */}
          <StyledAppBar position="sticky" elevation={0}>
            <Toolbar sx={{ justifyContent: 'space-between' }}>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <IconButton
                  color="inherit"
                  aria-label="메뉴 열기"
                  onClick={handleDrawerToggle}
                  sx={{
                    mr: 2,
                    color: (theme) => theme.palette.mode === 'dark' ? '#FFFFFF' : '#000000',
                    '&:hover': {
                      color: (theme) => theme.palette.primary.main,
                      transform: 'scale(1.1)',
                    },
                  }}
                >
                  <MenuIcon />
                </IconButton>
                <Typography
                  variant="h6"
                  sx={{
                    fontWeight: 600,
                    color: (theme) => theme.palette.mode === 'dark' ? '#FFFFFF' : '#000000',
                    display: { xs: 'none', sm: 'block' },
                  }}
                >
                  {menuItems
                    .flatMap(section => section.items)
                    .find(item => item.path === location.pathname)?.text ||
                    '윈도우갤러리'}
                </Typography>
              </Box>

              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                {/* 테마 설정 */}
                <Tooltip title="테마 설정">
                  <IconButton
                    onClick={handleThemeSettingsOpen}
                    sx={{
                      color: (theme) => theme.palette.mode === 'dark' ? '#FFFFFF' : '#000000',
                      '&:hover': {
                        color: (theme) => theme.palette.primary.main,
                        transform: 'scale(1.1)',
                      },
                    }}
                  >
                    <PaletteIcon />
                  </IconButton>
                </Tooltip>

                {/* 알림 */}
                <Tooltip title="알림">
                  <IconButton
                    onClick={handleNotificationClick}
                    sx={{
                      color: (theme) => theme.palette.mode === 'dark' ? '#FFFFFF' : '#000000',
                      '&:hover': {
                        color: (theme) => theme.palette.primary.main,
                        transform: 'scale(1.1)',
                      },
                    }}
                  >
                    <Badge badgeContent={unreadCount} color="error">
                      <NotificationsIcon />
                    </Badge>
                  </IconButton>
                </Tooltip>

                {/* 사용자 프로필 */}
                <Tooltip title="프로필">
                  <IconButton
                    onClick={handleProfileMenuOpen}
                    sx={{
                      color: (theme) => theme.palette.mode === 'dark' ? '#FFFFFF' : '#000000',
                      cursor: 'pointer',
                      '&:hover': {
                        color: (theme) => theme.palette.primary.main,
                        transform: 'scale(1.1)',
                      },
                    }}
                  >
                    <Avatar
                      src={profileImage || undefined}
                      sx={{
                        width: 32,
                        height: 32,
                        background: profileImage
                          ? 'transparent'
                          : 'var(--gradient-primary)',
                        fontSize: '0.875rem',
                        fontWeight: 600,
                      }}
                    >
                      {!profileImage && (
                        <FavoriteIcon sx={{ fontSize: '1rem' }} />
                      )}
                    </Avatar>
                  </IconButton>
                </Tooltip>
              </Box>
            </Toolbar>
          </StyledAppBar>

          {/* 프로필 모달 */}
          <Dialog
            open={profileModalOpen}
            onClose={() => setProfileModalOpen(false)}
            maxWidth="sm"
            fullWidth
            PaperProps={{
              sx: {
                background: 'rgba(45, 45, 45, 0.95)',
                backdropFilter: 'blur(20px)',
                border: '1px solid rgba(255, 107, 157, 0.2)',
                borderRadius: '20px',
                boxShadow: '0 12px 40px rgba(255, 107, 157, 0.25)',
              },
            }}
          >
            <DialogTitle
              sx={{
                color: 'white',
                borderBottom: '1px solid rgba(255, 107, 157, 0.2)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: 2,
                pr: 2
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <PhotoCameraIcon sx={{ color: '#FF6B9D' }} />
                프로필 설정
              </Box>
              <IconButton
                aria-label="닫기"
                onClick={() => setProfileModalOpen(false)}
                sx={{
                  color: 'white',
                  ml: 1
                }}
                size="small"
              >
                <CloseIcon />
              </IconButton>
            </DialogTitle>
            <DialogContent sx={{ color: 'white', pt: 3 }}>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                {/* 프로필 사진 섹션 */}
                <Box sx={{ textAlign: 'center' }}>
                  <Box
                    onClick={() => setAvatarSelectionModalOpen(true)}
                    sx={{
                      cursor: 'pointer',
                      display: 'inline-block',
                      position: 'relative',
                      '&:hover': {
                        '& .avatar-overlay': {
                          opacity: 1,
                        },
                        transform: 'scale(1.05)',
                        transition: 'transform 0.2s ease',
                      },
                    }}
                  >
                    <Avatar
                      src={profileImage || undefined}
                      sx={{
                        width: 100,
                        height: 100,
                        margin: 'auto',
                        background: profileImage
                          ? 'transparent'
                          : 'linear-gradient(135deg, #FF6B9D 0%, #FF4757 100%)',
                        fontSize: '2rem',
                        fontWeight: 600,
                        border: '3px solid rgba(255, 107, 157, 0.3)',
                        transition: 'all 0.3s ease',
                      }}
                    >
                      {!profileImage && <FavoriteIcon sx={{ fontSize: '2rem' }} />}
                    </Avatar>
                    {/* 호버 오버레이 */}
                    <Box
                      className="avatar-overlay"
                      sx={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        borderRadius: '50%',
                        background: 'rgba(0, 0, 0, 0.6)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        opacity: 0,
                        transition: 'opacity 0.3s ease',
                        cursor: 'pointer',
                      }}
                    >
                      <PhotoCameraIcon sx={{ color: 'white', fontSize: '2rem' }} />
                    </Box>
                  </Box>
                  <Typography variant="h6" sx={{ mt: 2, color: 'white' }}>
                    {nickname || '사용자'}
                  </Typography>
                  <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.7)' }}>
                    {userRole === 'admin' ? '관리자' : userRole === 'staff' ? '직원' : '손님'}
                  </Typography>
                  <Typography variant="caption" sx={{ color: 'rgba(255, 255, 255, 0.5)', display: 'block', mt: 1 }}>
                    아바타를 클릭하여 사진을 변경하세요
                  </Typography>
                </Box>

                {/* 메뉴 옵션들 */}
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                  <Button
                    fullWidth
                    variant="outlined"
                    startIcon={<SettingsIcon />}
                    onClick={() => {
                      setNicknameInput(nickname);
                      setNicknameDialogOpen(true);
                      setProfileModalOpen(false);
                    }}
                    sx={{
                      color: '#FF6B9D',
                      borderColor: 'rgba(255, 107, 157, 0.3)',
                      '&:hover': {
                        borderColor: '#FF6B9D',
                        backgroundColor: 'rgba(255, 107, 157, 0.1)',
                      },
                      py: 1.5,
                    }}
                  >
                    닉네임 변경
                  </Button>
                  
                  <Button
                    fullWidth
                    variant="outlined"
                    startIcon={<LockIcon />}
                    onClick={() => {
                      setPasswordChangeModalOpen(true);
                      setProfileModalOpen(false);
                    }}
                    sx={{
                      color: '#4ECDC4',
                      borderColor: 'rgba(78, 205, 196, 0.3)',
                      '&:hover': {
                        borderColor: '#4ECDC4',
                        backgroundColor: 'rgba(78, 205, 196, 0.1)',
                      },
                      py: 1.5,
                    }}
                  >
                    비밀번호 변경
                  </Button>
                  

                  
                  <Button
                    fullWidth
                    variant="outlined"
                    startIcon={<PhotoCameraIcon />}
                    component="label"
                    sx={{
                      color: '#FF6B9D',
                      borderColor: 'rgba(255, 107, 157, 0.3)',
                      '&:hover': {
                        borderColor: '#FF6B9D',
                        backgroundColor: 'rgba(255, 107, 157, 0.1)',
                      },
                      py: 1.5,
                    }}
                  >
                    프로필 사진 업로드
                    <input
                      type="file"
                      accept="image/*"
                      style={{ display: 'none' }}
                      onChange={handleProfileImageChange}
                    />
                  </Button>
                  
                  {profileImage && (
                    <Button
                      fullWidth
                      variant="outlined"
                      startIcon={<DeleteIcon />}
                      onClick={() => {
                        handleProfileImageDelete();
                        setProfileModalOpen(false);
                      }}
                      disabled={profileUploadLoading}
                      sx={{
                        color: '#FF4757',
                        borderColor: 'rgba(255, 71, 87, 0.3)',
                        '&:hover': {
                          borderColor: '#FF4757',
                          backgroundColor: 'rgba(255, 71, 87, 0.1)',
                        },
                        py: 1.5,
                      }}
                    >
                      프로필 사진 삭제
                    </Button>
                  )}
                  
                  <Divider sx={{ background: 'rgba(255, 255, 255, 0.1)', my: 1 }} />
                  
                  <Button
                    fullWidth
                    variant="contained"
                    startIcon={<LogoutIcon />}
                    onClick={() => {
                      handleLogout();
                      setProfileModalOpen(false);
                    }}
                    sx={{
                      backgroundColor: '#FF4757',
                      '&:hover': {
                        backgroundColor: '#E63946',
                      },
                      py: 1.5,
                    }}
                  >
                    로그아웃
                  </Button>
                </Box>
              </Box>
            </DialogContent>
          </Dialog>

          {/* 닉네임 변경 다이얼로그 */}
          <Dialog
            open={nicknameDialogOpen}
            onClose={() => setNicknameDialogOpen(false)}
            fullScreen={isMobile}
          >
            <DialogTitle sx={{ 
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
                  onClick={() => setNicknameDialogOpen(false)}
                  aria-label="close"
                  sx={{ mr: 1 }}
                >
                  <ArrowBackIcon />
                </IconButton>
              )}
              닉네임 변경
            </DialogTitle>
            <DialogContent>
              <TextField
                label="새 닉네임"
                value={nicknameInput}
                onChange={e => setNicknameInput(e.target.value)}
                fullWidth
                autoFocus
                size={isMobile ? "medium" : "small"}
                sx={{ 
                  mt: isMobile ? 2 : 1,
                  '& .MuiInputBase-input': {
                    fontSize: isMobile ? '1rem' : '0.875rem',
                    padding: isMobile ? '12px 14px' : '8.5px 14px'
                  }
                }}
              />
              {nicknameError && (
                <Alert severity="error" sx={{ 
                  mt: isMobile ? 2 : 1,
                  fontSize: isMobile ? '0.9rem' : '0.875rem'
                }}>
                  {nicknameError}
                </Alert>
              )}
              {nicknameSuccess && (
                <Alert severity="success" sx={{ 
                  mt: isMobile ? 2 : 1,
                  fontSize: isMobile ? '0.9rem' : '0.875rem'
                }}>
                  {nicknameSuccess}
                </Alert>
              )}
            </DialogContent>
            {!isMobile && (
              <DialogActions>
                <Button
                  onClick={() => setNicknameDialogOpen(false)}
                  color="inherit"
                >
                  취소
                </Button>
                <Button
                  onClick={handleNicknameChange}
                  variant="contained"
                  disabled={nicknameLoading}
                >
                  {nicknameLoading ? '저장중...' : '저장'}
                </Button>
              </DialogActions>
            )}
            {isMobile && (
              <Box sx={{ p: 2, display: 'flex', gap: 1, justifyContent: 'center' }}>
                <Button
                  onClick={() => setNicknameDialogOpen(false)}
                  variant="outlined"
                  sx={{ 
                    minHeight: '48px',
                    fontSize: '1rem',
                    px: 3
                  }}
                >
                  취소
                </Button>
                <Button
                  onClick={handleNicknameChange}
                  variant="contained"
                  disabled={nicknameLoading}
                  sx={{ 
                    minHeight: '48px',
                    fontSize: '1rem',
                    px: 3
                  }}
                >
                  {nicknameLoading ? '저장중...' : '저장'}
                </Button>
              </Box>
            )}
          </Dialog>

          {/* 비밀번호 변경 다이얼로그 */}
          <Dialog
            open={passwordChangeModalOpen}
            onClose={() => setPasswordChangeModalOpen(false)}
            maxWidth="sm"
            fullWidth
            fullScreen={isMobile}
            PaperProps={{
              sx: {
                background: 'rgba(45, 45, 45, 0.95)',
                backdropFilter: 'blur(20px)',
                border: '1px solid rgba(78, 205, 196, 0.2)',
                borderRadius: isMobile ? 0 : '20px',
                boxShadow: '0 12px 40px rgba(78, 205, 196, 0.25)',
              },
            }}
          >
            <DialogTitle
              sx={{
                color: 'white',
                borderBottom: '1px solid rgba(78, 205, 196, 0.2)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: 2,
                pr: 2,
                fontSize: isMobile ? '1.2rem' : '1.25rem',
                pb: isMobile ? 1 : 2
              }}
            >
              {isMobile && (
                <IconButton
                  edge="start"
                  color="inherit"
                  onClick={() => setPasswordChangeModalOpen(false)}
                  aria-label="close"
                  sx={{ mr: 1, color: 'white' }}
                >
                  <ArrowBackIcon />
                </IconButton>
              )}
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <LockIcon sx={{ color: '#4ECDC4' }} />
                <Typography sx={{ fontSize: isMobile ? '1.1rem' : '1.25rem' }}>
                  비밀번호 변경
                </Typography>
              </Box>
              {!isMobile && (
                <IconButton
                  aria-label="닫기"
                  onClick={() => setPasswordChangeModalOpen(false)}
                  sx={{
                    color: 'white',
                    ml: 1
                  }}
                  size="small"
                >
                  <CloseIcon />
                </IconButton>
              )}
            </DialogTitle>
            <DialogContent sx={{ color: 'white', pt: isMobile ? 2 : 3 }}>
              <TextField
                label="현재 비밀번호"
                type="password"
                value={currentPassword}
                onChange={e => setCurrentPassword(e.target.value)}
                fullWidth
                autoFocus
                size={isMobile ? "medium" : "small"}
                sx={{ 
                  mb: isMobile ? 1.5 : 2,
                  '& .MuiInputBase-input': {
                    fontSize: isMobile ? '1rem' : '0.875rem',
                    padding: isMobile ? '12px 14px' : '8.5px 14px'
                  }
                }}
                InputProps={{
                  sx: { color: 'white' }
                }}
                InputLabelProps={{
                  sx: { color: 'rgba(255, 255, 255, 0.7)' }
                }}
              />
              <TextField
                label="새 비밀번호"
                type="password"
                value={newPassword}
                onChange={e => setNewPassword(e.target.value)}
                fullWidth
                size={isMobile ? "medium" : "small"}
                sx={{ 
                  mb: isMobile ? 1.5 : 2,
                  '& .MuiInputBase-input': {
                    fontSize: isMobile ? '1rem' : '0.875rem',
                    padding: isMobile ? '12px 14px' : '8.5px 14px'
                  }
                }}
                InputProps={{
                  sx: { color: 'white' }
                }}
                InputLabelProps={{
                  sx: { color: 'rgba(255, 255, 255, 0.7)' }
                }}
              />
              <TextField
                label="새 비밀번호 확인"
                type="password"
                value={confirmPassword}
                onChange={e => setConfirmPassword(e.target.value)}
                fullWidth
                size={isMobile ? "medium" : "small"}
                sx={{ 
                  mb: isMobile ? 1.5 : 2,
                  '& .MuiInputBase-input': {
                    fontSize: isMobile ? '1rem' : '0.875rem',
                    padding: isMobile ? '12px 14px' : '8.5px 14px'
                  }
                }}
                InputProps={{
                  sx: { color: 'white' }
                }}
                InputLabelProps={{
                  sx: { color: 'rgba(255, 255, 255, 0.7)' }
                }}
              />
              {passwordError && (
                <Alert severity="error" sx={{ 
                  mt: isMobile ? 1.5 : 1,
                  fontSize: isMobile ? '0.9rem' : '0.875rem'
                }}>
                  {passwordError}
                </Alert>
              )}
              {passwordSuccess && (
                <Alert severity="success" sx={{ 
                  mt: isMobile ? 1.5 : 1,
                  fontSize: isMobile ? '0.9rem' : '0.875rem'
                }}>
                  {passwordSuccess}
                </Alert>
              )}
            </DialogContent>
            {!isMobile && (
              <DialogActions sx={{ 
                borderTop: '1px solid rgba(78, 205, 196, 0.2)', 
                p: 2,
                backgroundColor: 'rgba(78, 205, 196, 0.05)'
              }}>
                <Button
                  onClick={() => setPasswordChangeModalOpen(false)}
                  sx={{ 
                    color: 'rgba(255, 255, 255, 0.7)',
                    '&:hover': {
                      backgroundColor: 'rgba(255, 255, 255, 0.1)'
                    }
                  }}
                >
                  취소
                </Button>
                <Button
                  onClick={handlePasswordChange}
                  variant="contained"
                  disabled={passwordLoading}
                  sx={{
                    backgroundColor: '#4ECDC4',
                    '&:hover': {
                      backgroundColor: '#45B7A8',
                    },
                    '&:disabled': {
                      backgroundColor: 'rgba(78, 205, 196, 0.3)',
                    }
                  }}
                >
                  {passwordLoading ? '변경중...' : '변경'}
                </Button>
              </DialogActions>
            )}
            {isMobile && (
              <Box sx={{ 
                p: 2, 
                display: 'flex', 
                gap: 1, 
                justifyContent: 'center',
                borderTop: '1px solid rgba(78, 205, 196, 0.2)',
                backgroundColor: 'rgba(78, 205, 196, 0.05)'
              }}>
                <Button
                  onClick={() => setPasswordChangeModalOpen(false)}
                  variant="outlined"
                  sx={{ 
                    color: 'rgba(255, 255, 255, 0.7)',
                    borderColor: 'rgba(255, 255, 255, 0.3)',
                    minHeight: '48px',
                    fontSize: '1rem',
                    px: 3,
                    '&:hover': {
                      backgroundColor: 'rgba(255, 255, 255, 0.1)',
                      borderColor: 'rgba(255, 255, 255, 0.5)'
                    }
                  }}
                >
                  취소
                </Button>
                <Button
                  onClick={handlePasswordChange}
                  variant="contained"
                  disabled={passwordLoading}
                  sx={{
                    backgroundColor: '#4ECDC4',
                    minHeight: '48px',
                    fontSize: '1rem',
                    px: 3,
                    '&:hover': {
                      backgroundColor: '#45B7A8',
                    },
                    '&:disabled': {
                      backgroundColor: 'rgba(78, 205, 196, 0.3)',
                    }
                  }}
                >
                  {passwordLoading ? '변경중...' : '변경'}
                </Button>
              </Box>
            )}
          </Dialog>

          {/* 아바타 선택 모달 */}
          <Dialog
            open={avatarSelectionModalOpen}
            onClose={() => setAvatarSelectionModalOpen(false)}
            maxWidth="md"
            fullWidth
            PaperProps={{
              sx: {
                background: 'rgba(45, 45, 45, 0.95)',
                backdropFilter: 'blur(20px)',
                border: '1px solid rgba(255, 107, 157, 0.2)',
                borderRadius: '20px',
                boxShadow: '0 12px 40px rgba(255, 107, 157, 0.25)',
              },
            }}
          >
            <DialogTitle sx={{ 
              color: 'white', 
              borderBottom: '1px solid rgba(255, 107, 157, 0.2)',
              display: 'flex',
              alignItems: 'center',
              gap: 2
            }}>
              <PhotoCameraIcon sx={{ color: '#FF6B9D' }} />
              아바타 선택
            </DialogTitle>
            <DialogContent sx={{ color: 'white', pt: 3 }}>
              {/* 업로드된 프로필 사진 섹션 */}
              {profileImage && profileImage.startsWith('http') && (
                <Box sx={{ mb: 4 }}>
                  <Typography variant="h6" sx={{ mb: 2, color: 'white' }}>
                    현재 프로필 사진
                  </Typography>
                  <Box sx={{ display: 'flex', justifyContent: 'center' }}>
                    <Avatar
                      src={profileImage}
                      sx={{ 
                        width: 80, 
                        height: 80, 
                        cursor: 'pointer',
                        border: '3px solid #FF6B9D',
                        '&:hover': {
                          transform: 'scale(1.1)',
                          transition: 'transform 0.2s ease',
                        }
                      }}
                      onClick={() => {
                        setAvatarSelectionModalOpen(false);
                      }}
                    />
                  </Box>
                  <Typography variant="body2" sx={{ textAlign: 'center', mt: 1, color: 'rgba(255, 255, 255, 0.7)' }}>
                    현재 업로드된 프로필 사진
                  </Typography>
                </Box>
              )}

              {/* 기본 아바타 섹션 */}
              <Box>
                <Typography variant="h6" sx={{ mb: 2, color: 'white' }}>
                  기본 아바타 선택 (클릭하여 선택)
                </Typography>
                <Box sx={{ 
                  display: 'grid', 
                  gridTemplateColumns: 'repeat(5, 1fr)', 
                  gap: 2,
                  maxHeight: '300px',
                  overflowY: 'auto'
                }}>
                  {defaultAvatars.map((avatar) => (
                    <Box
                      key={avatar.id}
                      onClick={() => handleAvatarSelect(avatar.id)}
                      sx={{
                        cursor: 'pointer',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        p: 1,
                        borderRadius: 2,
                        transition: 'all 0.2s ease',
                        '&:hover': {
                          backgroundColor: 'rgba(255, 107, 157, 0.1)',
                          transform: 'scale(1.05)',
                        }
                      }}
                    >
                      <Avatar
                        sx={{
                          width: 60,
                          height: 60,
                          backgroundColor: avatar.color,
                          fontSize: '1.5rem',
                          mb: 1,
                        }}
                      >
                        {avatar.emoji}
                      </Avatar>
                    </Box>
                  ))}
                </Box>
              </Box>

              {/* 업로드한 사진 선택 섹션 */}
              {profileImage && profileImage.startsWith('http') && (
                <Box sx={{ mt: 3, textAlign: 'center' }}>
                  <Typography variant="h6" sx={{ mb: 2, color: 'white' }}>
                    업로드한 사진 선택
                  </Typography>
                  <Box sx={{ display: 'flex', justifyContent: 'center' }}>
                    <Avatar
                      src={profileImage}
                      sx={{
                        width: 60,
                        height: 60,
                        cursor: 'pointer',
                        border: '3px solid #FF6B9D',
                        '&:hover': {
                          transform: 'scale(1.1)',
                          transition: 'transform 0.2s ease',
                        }
                      }}
                      onClick={() => {
                        setProfileImage(profileImage);
                        setAvatarSelectionModalOpen(false);
                        alert('업로드한 사진이 프로필로 적용되었습니다.');
                      }}
                    />
                  </Box>
                  <Typography variant="body2" sx={{ textAlign: 'center', mt: 1, color: 'rgba(255, 255, 255, 0.7)' }}>
                    클릭하여 업로드한 사진 적용
                  </Typography>
                </Box>
              )}
            </DialogContent>
            <DialogActions sx={{ 
              borderTop: '1px solid rgba(255, 107, 157, 0.2)', 
              p: 2,
              backgroundColor: 'rgba(255, 107, 157, 0.05)'
            }}>
              <Button
                onClick={() => setAvatarSelectionModalOpen(false)}
                sx={{ 
                  color: 'rgba(255, 255, 255, 0.7)',
                  '&:hover': {
                    backgroundColor: 'rgba(255, 255, 255, 0.1)'
                  }
                }}
              >
                취소
              </Button>
            </DialogActions>
          </Dialog>

          {/* 알림 패널 */}
          <NotificationPanel
            open={notificationPanelOpen}
            onClose={() => setNotificationPanelOpen(false)}
          />

          {/* 테마 설정 다이얼로그 */}
          <ThemeSettings
            open={themeSettingsOpen}
            onClose={handleThemeSettingsClose}
          />



          {/* 프로필 사진 업로드 다이얼로그 */}
          <Dialog
            open={Boolean(profileImageFile)}
            onClose={() => {
              setProfileImageFile(null);
              setProfileImagePreview('');
            }}
            maxWidth="sm"
            fullWidth
            PaperProps={{
              sx: {
                background: 'rgba(45, 45, 45, 0.95)',
                backdropFilter: 'blur(20px)',
                border: '1px solid rgba(255, 107, 157, 0.2)',
                borderRadius: '20px',
                boxShadow: '0 12px 40px rgba(255, 107, 157, 0.25)',
              },
            }}
          >
            <DialogTitle sx={{ 
              color: 'white', 
              borderBottom: '1px solid rgba(255, 107, 157, 0.2)',
              display: 'flex',
              alignItems: 'center',
              gap: 2
            }}>
              <PhotoCameraIcon sx={{ color: '#FF6B9D' }} />
              프로필 사진 업로드
            </DialogTitle>
            <DialogContent sx={{ color: 'white', pt: 3 }}>
              {profileImagePreview && (
                <Box sx={{ textAlign: 'center', mb: 3 }}>
                  <Typography variant="h6" sx={{ mb: 2, color: 'white' }}>
                    미리보기
                  </Typography>
                  <Avatar
                    src={profileImagePreview}
                    sx={{ 
                      width: 120, 
                      height: 120, 
                      margin: 'auto', 
                      mb: 2,
                      border: '3px solid rgba(255, 107, 157, 0.3)',
                    }}
                  />
                </Box>
              )}
              <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.7)', textAlign: 'center' }}>
                선택한 이미지가 프로필 사진으로 설정됩니다.
              </Typography>
            </DialogContent>
            <DialogActions sx={{ 
              borderTop: '1px solid rgba(255, 107, 157, 0.2)', 
              p: 2,
              backgroundColor: 'rgba(255, 107, 157, 0.05)'
            }}>
              <Button
                onClick={() => {
                  setProfileImageFile(null);
                  setProfileImagePreview('');
                }}
                sx={{ 
                  color: 'rgba(255, 255, 255, 0.7)',
                  '&:hover': {
                    backgroundColor: 'rgba(255, 255, 255, 0.1)'
                  }
                }}
              >
                취소
              </Button>
              <Button
                onClick={handleProfileImageUpload}
                variant="contained"
                disabled={profileUploadLoading}
                sx={{
                  backgroundColor: '#FF6B9D',
                  '&:hover': {
                    backgroundColor: '#E55A8A',
                  },
                  '&:disabled': {
                    backgroundColor: 'rgba(255, 107, 157, 0.3)',
                  }
                }}
              >
                {profileUploadLoading ? '업로드중...' : '업로드'}
              </Button>
            </DialogActions>
          </Dialog>

          {/* 메인 콘텐츠 영역 */}
          <Box
            sx={{
              flex: 1,
              p: 3,
              position: 'relative',
              zIndex: 1,
              overflow: 'auto',
            }}
          >
            <Outlet />
          </Box>
        </Box>
      </Box>
    </UserContext.Provider>
  );
};

export default Layout;
