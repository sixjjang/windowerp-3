import React, { ReactNode } from 'react';
import { Box, Typography, Alert } from '@mui/material';

interface PermissionGuardProps {
  children: ReactNode;
  requiredRoles: string[];
  fallback?: ReactNode;
}

// 페이지별 권한 설정
export const PAGE_PERMISSIONS = {
  // 관리자 전용 페이지
  adminOnly: ['admin'],
  // 관리자 + 직원 접근 가능
  adminStaff: ['admin', 'staff'],
  // 모든 사용자 접근 가능
  allUsers: ['admin', 'staff', 'guest'],
  // 직원 + 손님 접근 가능
  staffGuest: ['staff', 'guest'],
};

const PermissionGuard: React.FC<PermissionGuardProps> = ({
  children,
  requiredRoles,
  fallback,
}) => {
  // 현재 사용자 정보 가져오기
  const getCurrentUser = () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return null;

      // JWT 토큰에서 사용자 정보 추출 (간단한 방법)
      const payload = JSON.parse(atob(token.split('.')[1]));
      return {
        id: payload.id,
        username: payload.username,
        role: payload.role,
        name: payload.name,
      };
    } catch (error) {
      console.error('토큰 파싱 오류:', error);
      return null;
    }
  };

  const currentUser = getCurrentUser();

  // 사용자가 로그인하지 않았거나 권한이 없는 경우
  if (!currentUser || !requiredRoles.includes(currentUser.role)) {
    if (fallback) {
      return <>{fallback}</>;
    }

    return (
      <Box sx={{ p: 3, textAlign: 'center' }}>
        <Alert severity="error" sx={{ mb: 2 }}>
          접근 권한이 없습니다.
        </Alert>
        <Typography variant="body2" color="text.secondary">
          현재 역할: {currentUser?.role || '로그인 필요'}
          <br />
          필요한 역할: {requiredRoles.join(', ')}
        </Typography>
      </Box>
    );
  }

  return <>{children}</>;
};

export default PermissionGuard;
