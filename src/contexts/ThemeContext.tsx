import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { createTheme, Theme } from '@mui/material/styles';
import { windowGalleryTheme } from '../theme/theme';

// 색상 팔레트 정의
export const colorPalettes = {
  default: {
    name: '기본',
    dark: {
      primary: '#1976d2',
      secondary: '#dc004e',
      background: '#0a0a0a',
      surface: '#1a1a1a',
      text: '#ffffff',
      textSecondary: '#b3b3b3'
    },
    light: {
      primary: '#1976d2',
      secondary: '#dc004e',
      background: '#ffffff',
      surface: '#f5f5f5',
      text: '#000000',
      textSecondary: '#666666'
    }
  },
  ocean: {
    name: '오션',
    dark: {
      primary: '#006064',
      secondary: '#00bcd4',
      background: '#0d1117',
      surface: '#161b22',
      text: '#ffffff',
      textSecondary: '#b3b3b3'
    },
    light: {
      primary: '#006064',
      secondary: '#00bcd4',
      background: '#f0f8ff',
      surface: '#ffffff',
      text: '#000000',
      textSecondary: '#666666'
    }
  },
  sunset: {
    name: '선셋',
    dark: {
      primary: '#ff6b35',
      secondary: '#f7931e',
      background: '#1a1a1a',
      surface: '#2d2d2d',
      text: '#ffffff',
      textSecondary: '#b3b3b3'
    },
    light: {
      primary: '#ff6b35',
      secondary: '#f7931e',
      background: '#fff8f0',
      surface: '#ffffff',
      text: '#000000',
      textSecondary: '#666666'
    }
  },
  forest: {
    name: '포레스트',
    dark: {
      primary: '#2e7d32',
      secondary: '#4caf50',
      background: '#0f1419',
      surface: '#1a1f2e',
      text: '#ffffff',
      textSecondary: '#b3b3b3'
    },
    light: {
      primary: '#2e7d32',
      secondary: '#4caf50',
      background: '#f0f8f0',
      surface: '#ffffff',
      text: '#000000',
      textSecondary: '#666666'
    }
  },
  lavender: {
    name: '라벤더',
    dark: {
      primary: '#6a1b9a',
      secondary: '#ab47bc',
      background: '#1a1a2e',
      surface: '#16213e',
      text: '#ffffff',
      textSecondary: '#b3b3b3'
    },
    light: {
      primary: '#6a1b9a',
      secondary: '#ab47bc',
      background: '#f8f0ff',
      surface: '#ffffff',
      text: '#000000',
      textSecondary: '#666666'
    }
  }
};

interface ThemeContextType {
  currentTheme: Theme;
  selectedPalette: string;
  isDarkMode: boolean;
  applyTheme: (paletteName: string, darkMode: boolean) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

interface ThemeProviderProps {
  children: ReactNode;
}

export const ThemeProvider: React.FC<ThemeProviderProps> = ({ children }) => {
  const [selectedPalette, setSelectedPalette] = useState('default');
  const [isDarkMode, setIsDarkMode] = useState(true);
  const [currentTheme, setCurrentTheme] = useState(windowGalleryTheme);

  // 테마 생성 함수
  const createDynamicTheme = (paletteName: string, darkMode: boolean): Theme => {
    const palette = colorPalettes[paletteName as keyof typeof colorPalettes];
    const colors = darkMode ? palette.dark : palette.light;

    return createTheme({
      ...windowGalleryTheme,
      palette: {
        mode: darkMode ? 'dark' : 'light',
        primary: {
          main: colors.primary,
          light: colors.primary,
          dark: colors.primary,
          contrastText: '#FFFFFF',
        },
        secondary: {
          main: colors.secondary,
          light: colors.secondary,
          dark: colors.secondary,
          contrastText: '#FFFFFF',
        },
        background: {
          default: colors.background,
          paper: colors.surface,
        },
        text: {
          primary: colors.text,
          secondary: colors.textSecondary,
        },
        divider: 'rgba(255, 255, 255, 0.1)',
      },
      components: {
        MuiButton: {
          styleOverrides: {
            root: {
              borderRadius: 12,
              padding: '12px 24px',
              fontWeight: 600,
              textTransform: 'none',
              transition: 'all 0.3s ease',
              '&:hover': {
                transform: 'translateY(-2px)',
              },
            },
            contained: {
              background: `linear-gradient(135deg, ${colors.primary} 0%, ${colors.secondary} 100%)`,
              '&:hover': {
                background: `linear-gradient(135deg, ${colors.secondary} 0%, ${colors.primary} 100%)`,
              },
            },
            outlined: {
              borderColor: colors.primary,
              color: colors.primary,
              '&:hover': {
                backgroundColor: colors.primary,
                color: '#FFFFFF',
              },
            },
          },
        },
        MuiCard: {
          styleOverrides: {
            root: {
              background: colors.surface,
              borderRadius: 20,
              border: `1px solid ${colors.primary}20`,
              backdropFilter: 'blur(10px)',
            },
          },
        },
        MuiPaper: {
          styleOverrides: {
            root: {
              background: colors.surface,
              borderRadius: 16,
            },
          },
        },
        MuiTextField: {
          styleOverrides: {
            root: {
              '& .MuiOutlinedInput-root': {
                borderRadius: 12,
                backgroundColor: colors.background,
                '& fieldset': {
                  borderColor: `${colors.primary}30`,
                },
                '&:hover fieldset': {
                  borderColor: colors.primary,
                },
                '&.Mui-focused fieldset': {
                  borderColor: colors.primary,
                },
              },
              '& .MuiInputLabel-root': {
                color: colors.textSecondary,
                '&.Mui-focused': {
                  color: colors.primary,
                },
              },
              '& .MuiInputBase-input': {
                color: colors.text,
              },
            },
          },
        },
        MuiChip: {
          styleOverrides: {
            root: {
              borderRadius: 20,
              fontWeight: 600,
              '&.MuiChip-colorPrimary': {
                background: `linear-gradient(135deg, ${colors.primary} 0%, ${colors.secondary} 100%)`,
                color: '#FFFFFF',
              },
              '&.MuiChip-colorSecondary': {
                background: `linear-gradient(135deg, ${colors.secondary} 0%, ${colors.primary} 100%)`,
                color: '#FFFFFF',
              },
            },
          },
        },
        MuiTabs: {
          styleOverrides: {
            root: {
              '& .MuiTabs-indicator': {
                background: `linear-gradient(135deg, ${colors.primary} 0%, ${colors.secondary} 100%)`,
                height: 3,
                borderRadius: 2,
              },
            },
          },
        },
        MuiTab: {
          styleOverrides: {
            root: {
              color: colors.textSecondary,
              fontWeight: 600,
              '&.Mui-selected': {
                color: colors.primary,
              },
            },
          },
        },
        MuiAppBar: {
          styleOverrides: {
            root: {
              background: `linear-gradient(90deg, ${colors.surface} 0%, ${colors.background} 100%)`,
              backdropFilter: 'blur(10px)',
              borderBottom: `1px solid ${colors.primary}20`,
            },
          },
        },
        MuiDrawer: {
          styleOverrides: {
            paper: {
              background: colors.surface,
              borderRight: `1px solid ${colors.primary}20`,
              backdropFilter: 'blur(10px)',
            },
          },
        },
        MuiContainer: {
          styleOverrides: {
            root: {
              background: colors.background,
            },
          },
        },
        MuiAvatar: {
          styleOverrides: {
            root: {
              background: `linear-gradient(135deg, ${colors.primary} 0%, ${colors.secondary} 100%)`,
            },
          },
        },
        MuiListItem: {
          styleOverrides: {
            root: {
              '&:hover': {
                backgroundColor: `${colors.primary}10`,
              },
            },
          },
        },
        MuiListItemText: {
          styleOverrides: {
            primary: {
              color: colors.text,
            },
            secondary: {
              color: colors.textSecondary,
            },
          },
        },
      },
    });
  };

  // 테마 적용 함수
  const applyTheme = (paletteName: string, darkMode: boolean) => {
    const palette = colorPalettes[paletteName as keyof typeof colorPalettes];
    const colors = darkMode ? palette.dark : palette.light;

    // data-theme 속성 설정 (CSS 변수 선택자용)
    document.documentElement.setAttribute('data-theme', darkMode ? 'dark' : 'light');

    // CSS 변수 적용 (강화)
    document.documentElement.style.setProperty('--primary-color', colors.primary);
    document.documentElement.style.setProperty('--secondary-color', colors.secondary);
    document.documentElement.style.setProperty('--background-color', colors.background);
    document.documentElement.style.setProperty('--surface-color', colors.surface);
    document.documentElement.style.setProperty('--text-color', colors.text);
    document.documentElement.style.setProperty('--text-secondary-color', colors.textSecondary);

    // 추가 CSS 변수들
    document.documentElement.style.setProperty('--gradient-primary', `linear-gradient(135deg, ${colors.primary} 0%, ${colors.secondary} 100%)`);
    document.documentElement.style.setProperty('--gradient-secondary', `linear-gradient(135deg, ${colors.secondary} 0%, ${colors.primary} 100%)`);
    document.documentElement.style.setProperty('--border-color', `${colors.primary}20`);
    document.documentElement.style.setProperty('--hover-color', `${colors.primary}15`); // 더 진한 hover 효과
    document.documentElement.style.setProperty('--hover-color-strong', `${colors.primary}35`); // 더 강한 hover 효과
    document.documentElement.style.setProperty('--hover-color-subtle', `${colors.primary}10`); // 더 미묘한 hover 효과

    // Material-UI 테마 업데이트
    const newTheme = createDynamicTheme(paletteName, darkMode);
    setCurrentTheme(newTheme);

    // 상태 업데이트
    setSelectedPalette(paletteName);
    setIsDarkMode(darkMode);

    // 설정 저장
    const themeSettings = {
      palette: paletteName,
      isDarkMode: darkMode,
      colors: colors
    };
    localStorage.setItem('themeSettings', JSON.stringify(themeSettings));

    // 강제 리렌더링을 위한 이벤트 발생
    window.dispatchEvent(new CustomEvent('themeChanged', { detail: { paletteName, darkMode } }));

    console.log('테마 적용 완료:', paletteName, darkMode ? '다크' : '라이트', '색상:', colors.primary);
  };

  // 초기 테마 로드
  useEffect(() => {
    const savedTheme = localStorage.getItem('themeSettings');
    if (savedTheme) {
      try {
        const themeSettings = JSON.parse(savedTheme);
        applyTheme(themeSettings.palette || 'default', themeSettings.isDarkMode !== false);
      } catch (error) {
        console.error('테마 로드 오류:', error);
        applyTheme('default', true);
      }
    } else {
      applyTheme('default', true);
    }
  }, []);

  const value: ThemeContextType = {
    currentTheme,
    selectedPalette,
    isDarkMode,
    applyTheme,
  };

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
}; 