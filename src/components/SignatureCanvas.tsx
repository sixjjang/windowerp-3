import React, { useRef, useEffect, useState } from 'react';
import { Box, Button, Paper } from '@mui/material';
import { Clear as ClearIcon, Save as SaveIcon } from '@mui/icons-material';

interface SignatureCanvasProps {
  onSave: (signatureData: string) => void;
  onClear: () => void;
}

const SignatureCanvas: React.FC<SignatureCanvasProps> = ({
  onSave,
  onClear,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [hasSignature, setHasSignature] = useState(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // 캔버스 설정
    ctx.strokeStyle = '#0091ea';
    ctx.lineWidth = 2;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    const handleMouseDown = (e: MouseEvent) => {
      setIsDrawing(true);
      const rect = canvas.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      ctx.beginPath();
      ctx.moveTo(x, y);
    };

    const handleMouseMove = (e: MouseEvent) => {
      if (!isDrawing) return;
      const rect = canvas.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      ctx.lineTo(x, y);
      ctx.stroke();
    };

    const handleMouseUp = () => {
      setIsDrawing(false);
      setHasSignature(true);
    };

    // 터치 이벤트 지원
    const handleTouchStart = (e: TouchEvent) => {
      e.preventDefault();
      setIsDrawing(true);
      const rect = canvas.getBoundingClientRect();
      const touch = e.touches[0];
      const x = touch.clientX - rect.left;
      const y = touch.clientY - rect.top;
      ctx.beginPath();
      ctx.moveTo(x, y);
    };

    const handleTouchMove = (e: TouchEvent) => {
      e.preventDefault();
      if (!isDrawing) return;
      const rect = canvas.getBoundingClientRect();
      const touch = e.touches[0];
      const x = touch.clientX - rect.left;
      const y = touch.clientY - rect.top;
      ctx.lineTo(x, y);
      ctx.stroke();
    };

    const handleTouchEnd = () => {
      setIsDrawing(false);
      setHasSignature(true);
    };

    // 이벤트 리스너 추가
    canvas.addEventListener('mousedown', handleMouseDown);
    canvas.addEventListener('mousemove', handleMouseMove);
    canvas.addEventListener('mouseup', handleMouseUp);
    canvas.addEventListener('mouseleave', handleMouseUp);

    canvas.addEventListener('touchstart', handleTouchStart);
    canvas.addEventListener('touchmove', handleTouchMove);
    canvas.addEventListener('touchend', handleTouchEnd);

    return () => {
      // 이벤트 리스너 제거
      canvas.removeEventListener('mousedown', handleMouseDown);
      canvas.removeEventListener('mousemove', handleMouseMove);
      canvas.removeEventListener('mouseup', handleMouseUp);
      canvas.removeEventListener('mouseleave', handleMouseUp);

      canvas.removeEventListener('touchstart', handleTouchStart);
      canvas.removeEventListener('touchmove', handleTouchMove);
      canvas.removeEventListener('touchend', handleTouchEnd);
    };
  }, [isDrawing]);

  const handleClear = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setHasSignature(false);
    onClear();
  };

  const handleSave = () => {
    const canvas = canvasRef.current;
    if (!canvas || !hasSignature) return;

    try {
      const signatureData = canvas.toDataURL('image/png');
      onSave(signatureData);
    } catch (error) {
      console.error('서명 저장 오류:', error);
    }
  };

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 2,
      }}
    >
      <Paper
        elevation={3}
        sx={{
          border: '2px dashed #2e3a4a',
          borderRadius: 1,
          backgroundColor: '#23272b',
        }}
      >
        <canvas
          ref={canvasRef}
          width={400}
          height={200}
          style={{
            cursor: 'crosshair',
            backgroundColor: '#23272b',
            borderRadius: '4px',
          }}
        />
      </Paper>

      <Box sx={{ display: 'flex', gap: 2 }}>
        <Button
          variant="outlined"
          startIcon={<ClearIcon />}
          onClick={handleClear}
          sx={{
            color: '#f44336',
            borderColor: '#f44336',
            '&:hover': { backgroundColor: '#1b5e20', borderColor: '#4caf50' },
          }}
        >
          지우기
        </Button>
        <Button
          variant="contained"
          startIcon={<SaveIcon />}
          onClick={handleSave}
          disabled={!hasSignature}
          sx={{
            backgroundColor: '#0091ea',
            color: '#fff',
            '&:hover': { backgroundColor: '#0064b7' },
            '&:disabled': { backgroundColor: '#666', color: '#999' },
          }}
        >
          서명 저장
        </Button>
      </Box>
    </Box>
  );
};

export default SignatureCanvas;
