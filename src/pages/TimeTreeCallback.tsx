import React, { useEffect, useState } from 'react';
import { Box, Typography, CircularProgress, Alert, Button } from '@mui/material';
import { CheckCircle as CheckCircleIcon, Error as ErrorIcon } from '@mui/icons-material';
import { timeTreeAPI } from '../utils/timetreeUtils';

const TimeTreeCallback: React.FC = () => {
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('');

  useEffect(() => {
    handleCallback();
  }, []);

  const handleCallback = async () => {
    try {
      const urlParams = new URLSearchParams(window.location.search);
      const code = urlParams.get('code');
      const error = urlParams.get('error');

      if (error) {
        setStatus('error');
        setMessage(`인증 오류: ${error}`);
        return;
      }

      if (!code) {
        setStatus('error');
        setMessage('인증 코드가 없습니다.');
        return;
      }

      // 인증 코드로 액세스 토큰 교환
      const response = await fetch('https://timetreeapis.com/oauth/token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          grant_type: 'authorization_code',
          code: code,
          client_id: process.env.REACT_APP_TIMETREE_CLIENT_ID || '',
          client_secret: process.env.REACT_APP_TIMETREE_CLIENT_SECRET || '',
          redirect_uri: `${window.location.origin}/timetree-callback`,
        }),
      });

      if (response.ok) {
        const authData = await response.json();
        
        // 토큰 저장
        localStorage.setItem('timetree_auth', JSON.stringify({
          access_token: authData.access_token,
          refresh_token: authData.refresh_token,
          expires_at: Date.now() + (authData.expires_in * 1000),
        }));

        setStatus('success');
        setMessage('타임트리 인증이 완료되었습니다. 이 창을 닫고 스케줄 페이지로 돌아가세요.');
        
        // 3초 후 자동으로 창 닫기
        setTimeout(() => {
          window.close();
        }, 3000);
      } else {
        const errorData = await response.json();
        setStatus('error');
        setMessage(`토큰 교환 실패: ${errorData.error || '알 수 없는 오류'}`);
      }
    } catch (error) {
      console.error('타임트리 콜백 처리 오류:', error);
      setStatus('error');
      setMessage(`처리 오류: ${error instanceof Error ? error.message : '알 수 없는 오류'}`);
    }
  };

  const handleClose = () => {
    window.close();
  };

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh',
        p: 3,
        textAlign: 'center',
      }}
    >
      {status === 'loading' && (
        <>
          <CircularProgress size={60} sx={{ mb: 2 }} />
          <Typography variant="h6" gutterBottom>
            타임트리 인증 처리 중...
          </Typography>
          <Typography variant="body2" color="text.secondary">
            잠시만 기다려주세요.
          </Typography>
        </>
      )}

      {status === 'success' && (
        <>
          <CheckCircleIcon sx={{ fontSize: 60, color: 'success.main', mb: 2 }} />
          <Typography variant="h6" gutterBottom color="success.main">
            인증 완료!
          </Typography>
          <Typography variant="body2" sx={{ mb: 3 }}>
            {message}
          </Typography>
          <Button variant="contained" onClick={handleClose}>
            창 닫기
          </Button>
        </>
      )}

      {status === 'error' && (
        <>
          <ErrorIcon sx={{ fontSize: 60, color: 'error.main', mb: 2 }} />
          <Typography variant="h6" gutterBottom color="error.main">
            인증 실패
          </Typography>
          <Alert severity="error" sx={{ mb: 3, maxWidth: 400 }}>
            {message}
          </Alert>
          <Button variant="contained" onClick={handleClose}>
            창 닫기
          </Button>
        </>
      )}
    </Box>
  );
};

export default TimeTreeCallback; 