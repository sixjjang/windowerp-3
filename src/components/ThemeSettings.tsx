import React from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
  Tooltip
} from '@mui/material';
import { Palette, Brightness4, Brightness7 } from '@mui/icons-material';
import { useTheme, colorPalettes } from '../contexts/ThemeContext';

interface ThemeSettingsProps {
  open: boolean;
  onClose: () => void;
}

const ThemeSettings: React.FC<ThemeSettingsProps> = ({ open, onClose }) => {
  const { selectedPalette, isDarkMode, applyTheme } = useTheme();

  // 팔레트 선택 핸들러
  const handlePaletteSelect = (paletteName: string) => {
    applyTheme(paletteName, isDarkMode);
  };

  // 다크/라이트 모드 토글 핸들러
  const handleModeToggle = () => {
    const newMode = !isDarkMode;
    applyTheme(selectedPalette, newMode);
  };

  // 팔레트 미리보기 카드
  const PaletteCard = ({ paletteName, palette }: { paletteName: string; palette: any }) => {
    const isSelected = selectedPalette === paletteName;
    const currentTheme = isDarkMode ? palette.dark : palette.light;

    return (
      <Card
        sx={{
          cursor: 'pointer',
          border: isSelected ? 2 : 1,
          borderColor: isSelected ? 'primary.main' : 'var(--border-color)',
          backgroundColor: 'var(--background-color)',
          transition: 'all 0.3s ease',
          '&:hover': {
            transform: 'translateY(-2px)',
            boxShadow: 3,
            backgroundColor: 'var(--hover-color)'
          }
        }}
        onClick={() => handlePaletteSelect(paletteName)}
      >
        <CardContent sx={{ p: 2 }}>
          <Typography variant="h6" gutterBottom sx={{ color: 'var(--text-color)' }}>
            {palette.name}
          </Typography>
          <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
            <Box
              sx={{
                width: 20,
                height: 20,
                borderRadius: '50%',
                backgroundColor: currentTheme.primary,
                border: '1px solid var(--border-color)'
              }}
            />
            <Box
              sx={{
                width: 20,
                height: 20,
                borderRadius: '50%',
                backgroundColor: currentTheme.secondary,
                border: '1px solid var(--border-color)'
              }}
            />
          </Box>
          <Box
            sx={{
              height: 60,
              borderRadius: 1,
              background: `linear-gradient(45deg, ${currentTheme.primary}, ${currentTheme.secondary})`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'white',
              fontSize: '0.8rem'
            }}
          >
            {isDarkMode ? '다크 모드' : '라이트 모드'}
          </Box>
        </CardContent>
      </Card>
    );
  };

  return (
    <Dialog 
      open={open} 
      onClose={onClose} 
      maxWidth="md" 
      fullWidth
      PaperProps={{
        sx: {
          backgroundColor: 'var(--background-color)',
          color: 'var(--text-color)'
        }
      }}
    >
      <DialogTitle sx={{ color: 'var(--text-color)' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Palette />
          테마 설정
        </Box>
      </DialogTitle>
      <DialogContent>
        <Box sx={{ mb: 3 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
            <Typography variant="h6" sx={{ color: 'var(--text-color)' }}>색상 팔레트</Typography>
            <Tooltip title={isDarkMode ? '라이트 모드로 전환' : '다크 모드로 전환'}>
              <IconButton onClick={handleModeToggle} color="primary">
                {isDarkMode ? <Brightness7 /> : <Brightness4 />}
              </IconButton>
            </Tooltip>
          </Box>
          <Grid container spacing={2}>
            {Object.entries(colorPalettes).map(([key, palette]) => (
              <Grid item xs={12} sm={6} md={4} key={key}>
                <PaletteCard paletteName={key} palette={palette} />
              </Grid>
            ))}
          </Grid>
        </Box>
        
        <Box sx={{ 
          mt: 3, 
          p: 2, 
          backgroundColor: 'var(--surface-color)', 
          borderRadius: 1,
          border: '1px solid var(--border-color)'
        }}>
          <Typography variant="body2" sx={{ color: 'var(--text-secondary-color)' }}>
            💡 팁: 색상 팔레트를 선택하고 다크/라이트 모드를 전환해보세요!
          </Typography>
        </Box>
      </DialogContent>
      <DialogActions>
        <Button 
          onClick={onClose}
          sx={{ 
            color: 'var(--text-color)',
            '&:hover': {
              backgroundColor: 'var(--hover-color)'
            }
          }}
        >
          닫기
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default ThemeSettings; 