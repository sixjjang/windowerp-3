import { auth } from '../firebase/config';
import { signInWithCustomToken, onAuthStateChanged, User } from 'firebase/auth';

// Firebase Functions API 기본 URL
export const API_BASE = 'https://us-central1-windowerp-3.cloudfunctions.net';

// JWT 토큰을 헤더에 포함하는 함수
export const getAuthHeaders = () => {
  const token = localStorage.getItem('token');
  return {
    'Content-Type': 'application/json',
    'Authorization': token ? `Bearer ${token}` : '',
  };
};

// Firebase Auth 상태 확인 및 강제 로그인
export const ensureFirebaseAuth = async () => {
  try {
    // 현재 Firebase Auth 상태 확인
    const currentUser = auth.currentUser;
    console.log('현재 Firebase Auth 상태:', {
      isAuthenticated: !!currentUser,
      userId: currentUser?.uid,
      email: currentUser?.email
    });

    if (currentUser) {
      console.log('Firebase Auth 이미 로그인됨');
      return currentUser;
    }

    // JWT 토큰이 있는지 확인
    const token = localStorage.getItem('token');
    if (!token) {
      console.log('JWT 토큰이 없어 Firebase Auth 로그인 불가');
      return null;
    }

    console.log('Firebase Auth 로그인 시도 중...');
    
    // 먼저 Firebase Auth 사용자 존재 여부 확인 및 생성
    try {
      const ensureUserResponse = await fetch(`${API_BASE}/ensureFirebaseUser`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (ensureUserResponse.ok) {
        const result = await ensureUserResponse.json();
        console.log('Firebase Auth 사용자 확인/생성 결과:', result);
      } else {
        console.warn('Firebase Auth 사용자 확인/생성 실패:', ensureUserResponse.status);
      }
    } catch (error) {
      console.warn('Firebase Auth 사용자 확인/생성 중 오류:', error);
    }
    
    // JWT 토큰을 Firebase Auth에서 사용할 수 있도록 변환
    const customTokenResponse = await fetch(`${API_BASE}/getCustomToken`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      }
    });
    
    if (!customTokenResponse.ok) {
      console.error('Custom Token 요청 실패:', customTokenResponse.status);
      return null;
    }

    const { customToken } = await customTokenResponse.json();
    console.log('Custom Token 획득 성공');
    
    // Firebase Auth에 로그인
    const userCredential = await signInWithCustomToken(auth, customToken);
    console.log('Firebase Auth 로그인 성공:', userCredential.user.uid);
    
    return userCredential.user;
  } catch (error) {
    console.error('Firebase Auth 로그인 실패:', error);
    return null;
  }
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
    
    // Firebase Auth에 JWT 토큰으로 로그인
    try {
      // JWT 토큰을 Firebase Auth에서 사용할 수 있도록 변환
      const customTokenResponse = await fetch(`${API_BASE}/getCustomToken`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${data.token}`
        }
      });
      
      if (customTokenResponse.ok) {
        const { customToken } = await customTokenResponse.json();
        await signInWithCustomToken(auth, customToken);
        console.log('Firebase Auth 로그인 성공');
      }
    } catch (firebaseAuthError) {
      console.warn('Firebase Auth 로그인 실패 (Firestore 접근에 영향):', firebaseAuthError);
      // Firebase Auth 로그인이 실패해도 Functions API는 계속 사용 가능
    }
    
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
  auth.signOut();
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

// Firebase Auth 상태 모니터링
export const onAuthStateChange = (callback: (user: User | null) => void) => {
  return onAuthStateChanged(auth, callback);
};

// 현재 Firebase Auth 사용자 가져오기
export const getCurrentFirebaseUser = () => {
  return auth.currentUser;
};
