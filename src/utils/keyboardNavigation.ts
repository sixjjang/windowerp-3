import React from 'react';

// 키보드 네비게이션 타입 정의
export interface KeyboardNavigationConfig {
  currentIndex: number;
  totalFields: number;
  onNavigate: (direction: 'next' | 'prev' | 'up' | 'down') => void;
  preserveValue?: boolean;
}

// 키보드 이벤트 핸들러 생성
export const createKeyboardNavigationHandler = (
  config: KeyboardNavigationConfig
) => {
  return (event: any) => {
    try {
      const { key } = event;
      
      // Tab 키 처리
      if (key === 'Tab') {
        event.preventDefault();
        if (event.shiftKey) {
          // Shift + Tab: 이전 필드로 이동
          config.onNavigate('prev');
        } else {
          // Tab: 다음 필드로 이동
          config.onNavigate('next');
        }
        return;
      }
      
      // Arrow 키 처리
      if (key === 'ArrowDown') {
        event.preventDefault();
        config.onNavigate('down');
        return;
      }
      
      if (key === 'ArrowUp') {
        event.preventDefault();
        config.onNavigate('up');
        return;
      }
      
      // Enter 키 처리 (선택적)
      if (key === 'Enter') {
        event.preventDefault();
        config.onNavigate('next');
        return;
      }
      
    } catch (error) {
      console.error('키보드 네비게이션 에러:', error);
      // 에러 발생 시 기본 동작 허용
    }
  };
};

// 필드 배열에서 다음/이전 인덱스 계산
export const getNextFieldIndex = (
  currentIndex: number, 
  totalFields: number, 
  direction: 'next' | 'prev' | 'up' | 'down'
): number => {
  try {
    switch (direction) {
      case 'next':
        return (currentIndex + 1) % totalFields;
      case 'prev':
        return currentIndex === 0 ? totalFields - 1 : currentIndex - 1;
      case 'down':
        // 아래로 이동 (다음 행으로)
        return (currentIndex + 1) % totalFields;
      case 'up':
        // 위로 이동 (이전 행으로)
        return currentIndex === 0 ? totalFields - 1 : currentIndex - 1;
      default:
        return currentIndex;
    }
  } catch (error) {
    console.error('필드 인덱스 계산 에러:', error);
    return currentIndex;
  }
};

// 필드 포커스 유틸리티
export const focusField = (fieldRef: React.RefObject<HTMLInputElement | HTMLTextAreaElement | null>) => {
  try {
    if (fieldRef.current) {
      fieldRef.current.focus();
      // 텍스트 선택 (선택적)
      if ('select' in fieldRef.current && fieldRef.current.select) {
        fieldRef.current.select();
      }
    }
  } catch (error) {
    console.error('필드 포커스 에러:', error);
  }
};

// 필드 값 보존 유틸리티
export const preserveFieldValue = (
  fieldRef: React.RefObject<HTMLInputElement | HTMLTextAreaElement>,
  value: string
) => {
  try {
    if (fieldRef.current && value !== undefined) {
      fieldRef.current.value = value;
    }
  } catch (error) {
    console.error('필드 값 보존 에러:', error);
  }
};
