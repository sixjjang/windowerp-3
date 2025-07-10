import { createTheme } from '@mui/material/styles';

// 윈도우갤러리 ERP 전용 컬러 팔레트
const colors = {
  // 메인 컬러
  primary: {
    main: '#FF6B9D', // 핑크
    light: '#FFB3D1',
    dark: '#E91E63',
    contrastText: '#FFFFFF',
  },
  secondary: {
    main: '#FF4757', // 레드
    light: '#FF6B7A',
    dark: '#C44569',
    contrastText: '#FFFFFF',
  },
  // 배경 컬러
  background: {
    default: '#1A1A1A', // 다크 블랙
    paper: '#2D2D2D',
    card: '#3A3A3A',
    sidebar: '#2A2A2A',
    header: '#2A2A2A',
  },
  // 텍스트 컬러
  text: {
    primary: '#FFFFFF',
    secondary: '#E0E0E0',
    disabled: '#9E9E9E',
    hint: '#BDBDBD',
  },
  // 액센트 컬러
  accent: {
    pink: '#FF6B9D',
    red: '#FF4757',
    coral: '#FF7F50',
    rose: '#FF1493',
    lavender: '#E6E6FA',
    mint: '#98FF98',
  },
  // 그라데이션
  gradients: {
    primary: 'linear-gradient(135deg, #FF6B9D 0%, #FF4757 100%)',
    secondary: 'linear-gradient(135deg, #FFB3D1 0%, #FF6B7A 100%)',
    background: 'linear-gradient(135deg, #1A1A1A 0%, #2D2D2D 100%)',
    card: 'linear-gradient(135deg, #3A3A3A 0%, #4A4A4A 100%)',
  },
  // 그림자
  shadows: {
    soft: '0 4px 20px rgba(255, 107, 157, 0.15)',
    medium: '0 8px 30px rgba(255, 107, 157, 0.25)',
    strong: '0 12px 40px rgba(255, 107, 157, 0.35)',
  },
};

// 윈도우갤러리 ERP 테마
export const windowGalleryTheme = createTheme({
  palette: {
    mode: 'dark',
    primary: colors.primary,
    secondary: colors.secondary,
    background: colors.background,
    text: colors.text,
    divider: 'rgba(255, 255, 255, 0.1)',
  },
  typography: {
    fontFamily:
      '"Pretendard", "Noto Sans KR", "Roboto", "Helvetica", "Arial", sans-serif',
    h1: {
      fontSize: '2.5rem',
      fontWeight: 700,
      background: colors.gradients.primary,
      WebkitBackgroundClip: 'text',
      WebkitTextFillColor: 'transparent',
      backgroundClip: 'text',
    },
    h2: {
      fontSize: '2rem',
      fontWeight: 600,
      color: colors.text.primary,
    },
    h3: {
      fontSize: '1.75rem',
      fontWeight: 600,
      color: colors.text.primary,
    },
    h4: {
      fontSize: '1.5rem',
      fontWeight: 600,
      color: colors.text.primary,
    },
    h5: {
      fontSize: '1.25rem',
      fontWeight: 600,
      color: colors.text.primary,
    },
    h6: {
      fontSize: '1rem',
      fontWeight: 600,
      color: colors.text.primary,
    },
    body1: {
      fontSize: '1rem',
      color: colors.text.primary,
    },
    body2: {
      fontSize: '0.875rem',
      color: colors.text.secondary,
    },
    button: {
      fontSize: '0.875rem',
      fontWeight: 600,
      textTransform: 'none',
    },
  },
  shape: {
    borderRadius: 16,
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 12,
          padding: '12px 24px',
          fontWeight: 600,
          textTransform: 'none',
          boxShadow: colors.shadows.soft,
          transition: 'all 0.3s ease',
          '&:hover': {
            transform: 'translateY(-2px)',
            boxShadow: colors.shadows.medium,
          },
        },
        contained: {
          background: colors.gradients.primary,
          '&:hover': {
            background: colors.gradients.secondary,
          },
        },
        outlined: {
          borderColor: colors.primary.main,
          color: colors.primary.main,
          '&:hover': {
            backgroundColor: colors.primary.main,
            color: colors.primary.contrastText,
          },
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          background: colors.gradients.card,
          borderRadius: 20,
          boxShadow: colors.shadows.soft,
          border: '1px solid rgba(255, 107, 157, 0.1)',
          backdropFilter: 'blur(10px)',
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          background: colors.background.paper,
          borderRadius: 16,
          boxShadow: colors.shadows.soft,
        },
      },
    },
    MuiTextField: {
      styleOverrides: {
        root: {
          '& .MuiOutlinedInput-root': {
            borderRadius: 12,
            backgroundColor: colors.background.card,
            '& fieldset': {
              borderColor: 'rgba(255, 107, 157, 0.3)',
            },
            '&:hover fieldset': {
              borderColor: colors.primary.main,
            },
            '&.Mui-focused fieldset': {
              borderColor: colors.primary.main,
            },
          },
          '& .MuiInputLabel-root': {
            color: colors.text.secondary,
            '&.Mui-focused': {
              color: colors.primary.main,
            },
          },
          '& .MuiInputBase-input': {
            color: colors.text.primary,
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
            background: colors.gradients.primary,
            color: colors.primary.contrastText,
          },
          '&.MuiChip-colorSecondary': {
            background: colors.gradients.secondary,
            color: colors.secondary.contrastText,
          },
        },
      },
    },
    MuiTabs: {
      styleOverrides: {
        root: {
          '& .MuiTabs-indicator': {
            background: colors.gradients.primary,
            height: 3,
            borderRadius: 2,
          },
        },
      },
    },
    MuiTab: {
      styleOverrides: {
        root: {
          color: colors.text.secondary,
          fontWeight: 600,
          '&.Mui-selected': {
            color: colors.primary.main,
          },
        },
      },
    },
    MuiIconButton: {
      styleOverrides: {
        root: {
          borderRadius: 12,
          transition: 'all 0.3s ease',
          '&:hover': {
            transform: 'scale(1.1)',
            backgroundColor: 'rgba(255, 107, 157, 0.1)',
          },
        },
      },
    },
    MuiSnackbar: {
      styleOverrides: {
        root: {
          '& .MuiAlert-root': {
            borderRadius: 12,
            fontWeight: 600,
          },
        },
      },
    },
  },
});

// 커스텀 스타일 유틸리티
export const customStyles = {
  // 그라데이션 텍스트
  gradientText: {
    background: colors.gradients.primary,
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
    backgroundClip: 'text',
  },
  // 글래스모피즘 효과
  glassmorphism: {
    background: 'rgba(255, 255, 255, 0.05)',
    backdropFilter: 'blur(10px)',
    border: '1px solid rgba(255, 255, 255, 0.1)',
  },
  // 부드러운 애니메이션
  smoothTransition: {
    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
  },
  // 호버 효과
  hoverEffect: {
    '&:hover': {
      transform: 'translateY(-4px)',
      boxShadow: colors.shadows.medium,
    },
  },
  // 귀여운 아이콘 스타일
  cuteIcon: {
    color: colors.primary.main,
    fontSize: '1.5rem',
    filter: 'drop-shadow(0 2px 4px rgba(255, 107, 157, 0.3))',
  },
};

export default windowGalleryTheme;
