import React, { useEffect, useState } from 'react';
import { Box, Typography, Button, CircularProgress } from '@mui/material';
import { fcmService } from '../utils/firebaseDataService';

interface FCMTokenManagerProps {
  userId: string;
  onTokenSaved?: (token: string) => void;
  onTokenError?: (error: string) => void;
}

const FCMTokenManager: React.FC<FCMTokenManagerProps> = ({ 
  userId, 
  onTokenSaved, 
  onTokenError 
}) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // 알림 권한 요청 및 설정
  const requestNotificationPermission = async () => {
    if (!userId) {
      setError('사용자 ID가 필요합니다.');
      return;
    }

    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      // 브라우저가 알림을 지원하는지 확인
      if (!('Notification' in window)) {
        throw new Error('이 브라우저는 알림을 지원하지 않습니다.');
      }

      // 알림 권한 요청
      const permission = await Notification.requestPermission();
      console.log('알림 권한 상태:', permission);
      
      if (permission !== 'granted') {
        throw new Error('알림 권한이 거부되었습니다.');
      }

      // 간단한 토큰 생성 (사용자 ID 기반)
      const fcmToken = `web_${userId}_${Date.now()}`;
      
      // 토큰을 서버에 저장
      await fcmService.saveFCMToken(userId, fcmToken, 'web');
      
      setSuccess('알림이 성공적으로 설정되었습니다.');
      onTokenSaved?.(fcmToken);
      
      console.log('알림 토큰 저장 완료:', fcmToken);
      
      // 테스트 알림 발송
      if (Notification.permission === 'granted') {
        new Notification('윈도우 ERP', {
          body: '알림 설정이 완료되었습니다!',
          icon: '/logo192.png',
          badge: '/logo192.png',
          requireInteraction: true,
          tag: 'notification-test'
        });
      }
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '알 수 없는 오류가 발생했습니다.';
      setError(errorMessage);
      onTokenError?.(errorMessage);
      console.error('알림 설정 실패:', error);
    } finally {
      setLoading(false);
    }
  };

  // 컴포넌트 마운트 시 자동으로 알림 권한 요청
  useEffect(() => {
    if (userId) {
      requestNotificationPermission();
    }
  }, [userId]);

  return (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
      {loading && (
        <CircularProgress size={16} sx={{ color: '#fff' }} />
      )}
      
      {error && (
        <Typography sx={{ fontSize: 10, color: '#ff6b6b' }}>
          알림 오류
        </Typography>
      )}
      
      {success && (
        <Typography sx={{ fontSize: 10, color: '#4caf50' }}>
          알림 설정됨
        </Typography>
      )}
      
      <Button 
        size="small"
        variant="outlined" 
        onClick={requestNotificationPermission}
        disabled={loading}
        sx={{ 
          color: '#fff', 
          borderColor: '#fff',
          fontSize: 10,
          minWidth: 'auto',
          px: 1,
          py: 0.5
        }}
      >
        알림 설정
      </Button>
    </Box>
  );
};

export default FCMTokenManager; 