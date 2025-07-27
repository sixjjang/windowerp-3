import React, { useState, useContext } from 'react';
import {
  Drawer,
  Box,
  Typography,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  IconButton,
  Badge,
  Chip,
  Divider,
  Button,
  Tooltip,
  Avatar,
  useTheme,
  useMediaQuery,
} from '@mui/material';
import {
  Notifications as NotificationsIcon,
  Schedule as ScheduleIcon,
  Note as NoteIcon,
  SystemUpdate as SystemIcon,
  LocalShipping as DeliveryIcon,
  Description as EstimateIcon,
  Chat as ChatIcon,
  Close as CloseIcon,
  CheckCircle as CheckCircleIcon,
  Delete as DeleteIcon,
  ClearAll as ClearAllIcon,
  Settings as SettingsIcon,
  VolumeUp as VolumeIcon,
} from '@mui/icons-material';
import { useNotificationStore, Notification } from '../utils/notificationStore';
import { UserContext } from './Layout';
import { useNavigate } from 'react-router-dom';
import SoundSettingsModal from './SoundSettingsModal';

interface NotificationPanelProps {
  open: boolean;
  onClose: () => void;
}

const NotificationPanel: React.FC<NotificationPanelProps> = ({
  open,
  onClose,
}) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const navigate = useNavigate();
  const { nickname } = useContext(UserContext);

  const {
    notifications,
    unreadCount,
    markAsRead,
    markAllAsRead,
    removeNotification,
    clearAll,
  } = useNotificationStore();

  const [filter, setFilter] = useState<'all' | 'unread'>('all');
  const [soundSettingsOpen, setSoundSettingsOpen] = useState(false);

  const getNotificationIcon = (type: Notification['type']) => {
    switch (type) {
      case 'schedule':
        return <ScheduleIcon sx={{ color: '#40c4ff' }} />;
      case 'memo':
        return <NoteIcon sx={{ color: '#4caf50' }} />;
      case 'system':
        return <SystemIcon sx={{ color: '#ff9800' }} />;
      case 'delivery':
        return <DeliveryIcon sx={{ color: '#f44336' }} />;
      case 'estimate':
        return <EstimateIcon sx={{ color: '#9c27b0' }} />;
      case 'chat':
        return <ChatIcon sx={{ color: '#2196f3' }} />;
      default:
        return <NotificationsIcon />;
    }
  };

  const getPriorityColor = (priority: Notification['priority']) => {
    switch (priority) {
      case 'high':
        return '#f44336';
      case 'medium':
        return '#ff9800';
      case 'low':
        return '#4caf50';
      default:
        return '#757575';
    }
  };

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInMinutes = Math.floor(
      (now.getTime() - date.getTime()) / (1000 * 60)
    );

    if (diffInMinutes < 1) return '방금 전';
    if (diffInMinutes < 60) return `${diffInMinutes}분 전`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}시간 전`;
    return date.toLocaleDateString('ko-KR');
  };

  const handleNotificationClick = (notification: Notification) => {
    if (!notification.isRead) {
      markAsRead(notification.id);
    }

    if (notification.actionUrl) {
      navigate(notification.actionUrl);
      onClose();
    }
  };

  const filteredNotifications = notifications.filter(notification => {
    if (filter === 'unread') return !notification.isRead;
    return true;
  });

  const drawerWidth = isMobile ? '100%' : 400;

  return (
    <Drawer
      anchor="right"
      open={open}
      onClose={onClose}
      sx={{
        '& .MuiDrawer-paper': {
          width: drawerWidth,
          background: 'linear-gradient(135deg, #1A1A1A 0%, #2D2D2D 100%)',
          borderLeft: '1px solid rgba(255, 107, 157, 0.2)',
          boxShadow: '-4px 0 20px rgba(255, 107, 157, 0.1)',
        },
      }}
    >
      <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
        {/* 헤더 */}
        <Box
          sx={{
            p: 2,
            borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
            background: 'rgba(255, 107, 157, 0.05)',
          }}
        >
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              mb: 2,
            }}
          >
            <Typography variant="h6" sx={{ color: '#e0e6ed', fontWeight: 600 }}>
              알림
            </Typography>
            <IconButton
              onClick={onClose}
              sx={{ color: 'rgba(255, 255, 255, 0.7)' }}
            >
              <CloseIcon />
            </IconButton>
          </Box>

          <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
            <Chip
              label={`전체 ${notifications.length}`}
              size="small"
              variant={filter === 'all' ? 'filled' : 'outlined'}
              onClick={() => setFilter('all')}
              sx={{
                color: filter === 'all' ? '#fff' : 'rgba(255, 255, 255, 0.7)',
                backgroundColor:
                  filter === 'all' ? 'rgba(255, 107, 157, 0.2)' : 'transparent',
                borderColor: 'rgba(255, 107, 157, 0.3)',
              }}
            />
            <Chip
              label={`읽지 않음 ${unreadCount}`}
              size="small"
              variant={filter === 'unread' ? 'filled' : 'outlined'}
              onClick={() => setFilter('unread')}
              sx={{
                color:
                  filter === 'unread' ? '#fff' : 'rgba(255, 255, 255, 0.7)',
                backgroundColor:
                  filter === 'unread'
                    ? 'rgba(255, 107, 157, 0.2)'
                    : 'transparent',
                borderColor: 'rgba(255, 107, 157, 0.3)',
              }}
            />
          </Box>

          <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
            <Button
              size="small"
              startIcon={<CheckCircleIcon />}
              onClick={markAllAsRead}
              sx={{
                color: 'rgba(255, 255, 255, 0.8)',
                borderColor: 'rgba(255, 255, 255, 0.2)',
                '&:hover': {
                  borderColor: 'rgba(255, 107, 157, 0.5)',
                  color: '#FF6B9D',
                },
              }}
              variant="outlined"
            >
              모두 읽음
            </Button>
            <Button
              size="small"
              startIcon={<ClearAllIcon />}
              onClick={clearAll}
              sx={{
                color: 'rgba(255, 255, 255, 0.8)',
                borderColor: 'rgba(255, 255, 255, 0.2)',
                '&:hover': {
                  borderColor: 'rgba(255, 107, 157, 0.5)',
                  color: '#FF6B9D',
                },
              }}
              variant="outlined"
            >
              모두 삭제
            </Button>
            <Button
              size="small"
              startIcon={<VolumeIcon />}
              onClick={() => setSoundSettingsOpen(true)}
              sx={{
                color: 'rgba(255, 255, 255, 0.8)',
                borderColor: 'rgba(255, 107, 157, 0.3)',
                background: 'rgba(255, 107, 157, 0.1)',
                '&:hover': {
                  borderColor: 'rgba(255, 107, 157, 0.5)',
                  background: 'rgba(255, 107, 157, 0.2)',
                  color: '#FF6B9D',
                },
              }}
              variant="outlined"
            >
              소리 설정
            </Button>
          </Box>
        </Box>

        {/* 알림 목록 */}
        <Box sx={{ flex: 1, overflow: 'auto' }}>
          {filteredNotifications.length === 0 ? (
            <Box
              sx={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                height: '100%',
                color: 'rgba(255, 255, 255, 0.5)',
                p: 3,
              }}
            >
              <NotificationsIcon sx={{ fontSize: 48, mb: 2, opacity: 0.5 }} />
              <Typography variant="body1" sx={{ textAlign: 'center' }}>
                {filter === 'unread'
                  ? '읽지 않은 알림이 없습니다.'
                  : '알림이 없습니다.'}
              </Typography>
            </Box>
          ) : (
            <List sx={{ p: 0 }}>
              {filteredNotifications.map((notification, index) => (
                <React.Fragment key={notification.id}>
                  <ListItem
                    sx={{
                      background: notification.isRead
                        ? 'transparent'
                        : 'rgba(255, 107, 157, 0.05)',
                      borderLeft: notification.isRead
                        ? 'none'
                        : '3px solid #FF6B9D',
                      cursor: 'pointer',
                      '&:hover': {
                        background: 'rgba(255, 255, 255, 0.05)',
                      },
                    }}
                    onClick={() => handleNotificationClick(notification)}
                  >
                    <ListItemIcon sx={{ minWidth: 40 }}>
                      {getNotificationIcon(notification.type)}
                    </ListItemIcon>

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
                          <Typography
                            component="span"
                            variant="body2"
                            sx={{
                              fontWeight: notification.isRead ? 400 : 600,
                              color: '#e0e6ed',
                              flex: 1,
                            }}
                          >
                            {notification.title}
                          </Typography>
                          <Chip
                            label={notification.priority}
                            size="small"
                            sx={{
                              backgroundColor: getPriorityColor(
                                notification.priority
                              ),
                              color: '#fff',
                              fontSize: '0.7rem',
                              height: 20,
                            }}
                          />
                        </Box>
                      }
                      secondary={
                        <Box component="span">
                          <Typography
                            component="span"
                            variant="body2"
                            sx={{
                              color: 'rgba(255, 255, 255, 0.7)',
                              mb: 1,
                              lineHeight: 1.4,
                            }}
                          >
                            {notification.message}
                          </Typography>

                          <Box
                            component="span"
                            sx={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: 2,
                            }}
                          >
                            <Box
                              component="span"
                              sx={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: 1,
                              }}
                            >
                              <Avatar
                                sx={{
                                  width: 20,
                                  height: 20,
                                  fontSize: '0.7rem',
                                  background:
                                    'linear-gradient(135deg, #FF6B9D 0%, #FF4757 100%)',
                                }}
                              >
                                {notification.sender[0]}
                              </Avatar>
                              <Typography
                                component="span"
                                variant="caption"
                                sx={{ color: 'rgba(255, 255, 255, 0.6)' }}
                              >
                                {notification.sender}
                              </Typography>
                            </Box>

                            <Typography
                              component="span"
                              variant="caption"
                              sx={{ color: 'rgba(255, 255, 255, 0.5)' }}
                            >
                              {formatTime(notification.timestamp)}
                            </Typography>
                          </Box>
                        </Box>
                      }
                    />

                    <IconButton
                      size="small"
                      onClick={e => {
                        e.stopPropagation();
                        removeNotification(notification.id);
                      }}
                      sx={{
                        color: 'rgba(255, 255, 255, 0.5)',
                        '&:hover': {
                          color: '#f44336',
                        },
                      }}
                    >
                      <DeleteIcon fontSize="small" />
                    </IconButton>
                  </ListItem>

                  {index < filteredNotifications.length - 1 && (
                    <Divider sx={{ background: 'rgba(255, 255, 255, 0.1)' }} />
                  )}
                </React.Fragment>
              ))}
            </List>
          )}
        </Box>
      </Box>
      
      {/* 알림 소리 설정 모달 */}
      <SoundSettingsModal
        open={soundSettingsOpen}
        onClose={() => setSoundSettingsOpen(false)}
      />
    </Drawer>
  );
};

export default NotificationPanel;
