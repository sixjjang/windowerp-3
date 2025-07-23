import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  Tabs,
  Tab,
  TextField,
  Button,
  Typography,
  Alert,
  CircularProgress,
  Avatar,
  IconButton,
} from '@mui/material';
import { PhotoCamera, Delete } from '@mui/icons-material';
import { API_BASE } from '../utils/auth';

export default function LoginPage() {
  const [tab, setTab] = useState(0); // 0: 로그인, 1: 회원가입
  const [loginId, setLoginId] = useState('');
  const [loginPw, setLoginPw] = useState('');
  const [loginError, setLoginError] = useState('');
  const [loginLoading, setLoginLoading] = useState(false);

  // 이미 로그인된 상태인지 확인
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      // 토큰 유효성 검증
      fetch(`${API_BASE}/me`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })
        .then(response => {
          if (response.ok) {
            // 유효한 토큰이면 대시보드로 리다이렉트
            window.location.href = '/';
          } else {
            // 유효하지 않은 토큰이면 제거
            localStorage.removeItem('token');
          }
        })
        .catch(() => {
          // 오류 발생 시 토큰 제거
          localStorage.removeItem('token');
        });
    }
  }, []);

  const [regId, setRegId] = useState('');
  const [regPw, setRegPw] = useState('');
  const [regName, setRegName] = useState('');
  const [regProfileImage, setRegProfileImage] = useState<File | null>(null);
  const [regProfilePreview, setRegProfilePreview] = useState<string>('');
  const [regError, setRegError] = useState('');
  const [regSuccess, setRegSuccess] = useState('');
  const [regLoading, setRegLoading] = useState(false);

  // 프로필 사진 선택 핸들러
  const handleProfileImageChange = (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];
    if (file) {
      setRegProfileImage(file);
      const reader = new FileReader();
      reader.onload = e => {
        setRegProfilePreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  // 프로필 사진 삭제 핸들러
  const handleProfileImageDelete = () => {
    setRegProfileImage(null);
    setRegProfilePreview('');
  };

  // 로그인 핸들러
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');
    setLoginLoading(true);
    try {
      const res = await fetch(`${API_BASE}/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: loginId, password: loginPw }),
      });
      if (!res.ok) {
        const msg = await res.text();
        setLoginError(msg);
        setLoginLoading(false);
        return;
      }
      const data = await res.json();
      localStorage.setItem('token', data.token);
      window.location.href = '/';
    } catch (err) {
      setLoginError('서버 오류');
    } finally {
      setLoginLoading(false);
    }
  };

  // 회원가입 핸들러
  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setRegError('');
    setRegSuccess('');
    setRegLoading(true);
    try {
      const res = await fetch(`${API_BASE}/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username: regId,
          password: regPw,
          name: regName,
        }),
      });
      if (!res.ok) {
        const msg = await res.text();
        setRegError(msg);
        setRegLoading(false);
        return;
      }
      setRegSuccess(
        '가입 신청이 완료되었습니다. 관리자의 승인 후 이용 가능합니다.'
      );
      setRegId('');
      setRegPw('');
      setRegName('');
      setRegProfileImage(null);
      setRegProfilePreview('');
    } catch (err) {
      setRegError('서버 오류');
    } finally {
      setRegLoading(false);
    }
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'var(--background-color)',
      }}
    >
      <Card
        sx={{
          minWidth: 340,
          maxWidth: 400,
          p: 3,
          boxShadow: 6,
          borderRadius: 3,
          background: 'var(--surface-color)',
        }}
      >
        <Tabs
          value={tab}
          onChange={(_, v) => setTab(v)}
          variant="fullWidth"
          sx={{ mb: 2 }}
        >
          <Tab label="로그인" />
          <Tab label="회원가입" />
        </Tabs>
        {tab === 0 && (
          <form onSubmit={handleLogin}>
            <TextField
              label="아이디"
              value={loginId}
              onChange={e => setLoginId(e.target.value)}
              fullWidth
              margin="normal"
              autoFocus
              autoComplete="username"
            />
            <TextField
              label="비밀번호"
              value={loginPw}
              onChange={e => setLoginPw(e.target.value)}
              type="password"
              fullWidth
              margin="normal"
              autoComplete="current-password"
            />
            {loginError && (
              <Alert severity="error" sx={{ mt: 1 }}>
                {loginError}
              </Alert>
            )}
            <Button
              type="submit"
              variant="contained"
              color="primary"
              fullWidth
              sx={{ mt: 2 }}
              disabled={loginLoading}
            >
              {loginLoading ? <CircularProgress size={20} /> : '로그인'}
            </Button>
            <Box
              sx={{ mt: 2, textAlign: 'center', color: '#aaa', fontSize: 13 }}
            >
              <div>
                최초 관리자: <b>admin / admin</b>
              </div>
            </Box>
          </form>
        )}
        {tab === 1 && (
          <form onSubmit={handleRegister}>
            <TextField
              label="아이디"
              value={regId}
              onChange={e => setRegId(e.target.value)}
              fullWidth
              margin="normal"
              autoComplete="username"
            />
            <TextField
              label="비밀번호"
              value={regPw}
              onChange={e => setRegPw(e.target.value)}
              type="password"
              fullWidth
              margin="normal"
              autoComplete="new-password"
            />
            <TextField
              label="닉네임"
              value={regName}
              onChange={e => setRegName(e.target.value)}
              fullWidth
              margin="normal"
            />
            <Avatar
              alt="Profile Image"
              src={regProfilePreview}
              sx={{ width: 100, height: 100, margin: 'auto', mb: 2 }}
            />
            <IconButton
              color="primary"
              onClick={() =>
                document.getElementById('profile-image-upload')?.click()
              }
            >
              <PhotoCamera />
            </IconButton>
            <input
              id="profile-image-upload"
              type="file"
              accept="image/*"
              style={{ display: 'none' }}
              onChange={handleProfileImageChange}
            />
            <IconButton color="primary" onClick={handleProfileImageDelete}>
              <Delete />
            </IconButton>
            {regError && (
              <Alert severity="error" sx={{ mt: 1 }}>
                {regError}
              </Alert>
            )}
            {regSuccess && (
              <Alert severity="success" sx={{ mt: 1 }}>
                {regSuccess}
              </Alert>
            )}
            <Button
              type="submit"
              variant="contained"
              color="primary"
              fullWidth
              sx={{ mt: 2 }}
              disabled={regLoading}
            >
              {regLoading ? <CircularProgress size={20} /> : '가입 신청'}
            </Button>
            <Box
              sx={{ mt: 2, textAlign: 'center', color: '#aaa', fontSize: 13 }}
            >
              <div>가입 신청 후 관리자의 승인 시 이용 가능합니다.</div>
            </Box>
          </form>
        )}
      </Card>
    </Box>
  );
}
