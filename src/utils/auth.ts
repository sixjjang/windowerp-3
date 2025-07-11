// Firebase Functions API 기본 URL
export const API_BASE = 'https://us-central1-windowerp-3.cloudfunctions.net';

// 인증 헤더 생성 함수
export const getAuthHeaders = () => {
  const token = localStorage.getItem('token');
  return {
    'Content-Type': 'application/json',
    ...(token && { Authorization: `Bearer ${token}` }),
  };
};

// 로그인 함수
export const login = async (username: string, password: string) => {
  try {
    const response = await fetch(`${API_BASE}/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ username, password }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || '로그인에 실패했습니다.');
    }

    const data = await response.json();
    localStorage.setItem('token', data.token);
    return data;
  } catch (error) {
    console.error('로그인 오류:', error);
    throw error;
  }
};

// 로그아웃 함수
export const logout = () => {
  localStorage.removeItem('token');
  localStorage.removeItem('user');
};

// 사용자 정보 조회 함수
export const getCurrentUser = async () => {
  try {
    const token = localStorage.getItem('token');
    if (!token) {
      throw new Error('토큰이 없습니다.');
    }

    const response = await fetch(`${API_BASE}/me`, {
      headers: getAuthHeaders(),
    });

    if (!response.ok) {
      throw new Error('사용자 정보 조회에 실패했습니다.');
    }

    return await response.json();
  } catch (error) {
    console.error('사용자 정보 조회 오류:', error);
    throw error;
  }
};

// 토큰 유효성 검사
export const isTokenValid = () => {
  const token = localStorage.getItem('token');
  if (!token) return false;

  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    const currentTime = Date.now() / 1000;
    return payload.exp > currentTime;
  } catch (error) {
    return false;
  }
};
