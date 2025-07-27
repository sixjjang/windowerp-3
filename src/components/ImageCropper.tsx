import React, { useState, useRef, useCallback } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  Slider,
  IconButton,
  Tooltip,
} from '@mui/material';
import {
  ZoomIn,
  ZoomOut,
  RotateLeft,
  RotateRight,
  Crop,
  Check,
  Close,
} from '@mui/icons-material';

interface ImageCropperProps {
  open: boolean;
  onClose: () => void;
  imageFile: File | null;
  onCropComplete: (croppedImageBlob: Blob) => void;
  aspectRatio?: number;
  maxWidth?: number;
  maxHeight?: number;
  quality?: number;
}

interface CropArea {
  x: number;
  y: number;
  width: number;
  height: number;
}

const ImageCropper: React.FC<ImageCropperProps> = ({
  open,
  onClose,
  imageFile,
  onCropComplete,
  aspectRatio = 1,
  maxWidth = 800,
  maxHeight = 800,
  quality = 0.8,
}) => {
  const [imageSrc, setImageSrc] = useState<string>('');
  const [cropArea, setCropArea] = useState<CropArea>({ x: 0, y: 0, width: 0, height: 0 });
  const [scale, setScale] = useState<number>(1);
  const [rotation, setRotation] = useState<number>(0);
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [dragStart, setDragStart] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [imageSize, setImageSize] = useState<{ width: number; height: number }>({ width: 0, height: 0 });
  
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // 이미지 로드
  React.useEffect(() => {
    if (imageFile) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          setImageSize({ width: img.width, height: img.height });
          setImageSrc(e.target?.result as string);
          
          // 초기 크롭 영역 설정
          const containerWidth = containerRef.current?.clientWidth || 400;
          const containerHeight = containerRef.current?.clientHeight || 400;
          const displayWidth = Math.min(containerWidth, img.width);
          const displayHeight = Math.min(containerHeight, img.height);
          
          const cropSize = Math.min(displayWidth, displayHeight);
          setCropArea({
            x: (displayWidth - cropSize) / 2,
            y: (displayHeight - cropSize) / 2,
            width: cropSize,
            height: cropSize,
          });
        };
        img.src = e.target?.result as string;
      };
      reader.readAsDataURL(imageFile);
    }
  }, [imageFile]);

  // 이미지 렌더링
  const renderImage = useCallback(() => {
    if (!canvasRef.current || !imageSrc) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const img = new Image();
    img.onload = () => {
      // 캔버스 크기 설정
      canvas.width = imageSize.width;
      canvas.height = imageSize.height;

      // 변환 적용
      ctx.save();
      ctx.translate(canvas.width / 2, canvas.height / 2);
      ctx.rotate((rotation * Math.PI) / 180);
      ctx.scale(scale, scale);
      ctx.drawImage(img, -img.width / 2, -img.height / 2);
      ctx.restore();
    };
    img.src = imageSrc;
  }, [imageSrc, scale, rotation, imageSize]);

  React.useEffect(() => {
    renderImage();
  }, [renderImage]);

  // 마우스 이벤트 핸들러
  const handleMouseDown = (e: React.MouseEvent) => {
    if (!containerRef.current) return;
    
    const rect = containerRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    setIsDragging(true);
    setDragStart({ x, y });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging || !containerRef.current) return;
    
    const rect = containerRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    const deltaX = x - dragStart.x;
    const deltaY = y - dragStart.y;
    
    setCropArea(prev => ({
      ...prev,
      x: Math.max(0, Math.min(prev.x + deltaX, imageSize.width - prev.width)),
      y: Math.max(0, Math.min(prev.y + deltaY, imageSize.height - prev.height)),
    }));
    
    setDragStart({ x, y });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  // 크롭 실행
  const handleCrop = () => {
    if (!canvasRef.current) return;

    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // 크롭된 영역의 크기 계산
    const cropWidth = cropArea.width * scale;
    const cropHeight = cropArea.height * scale;
    
    canvas.width = cropWidth;
    canvas.height = cropHeight;

    // 크롭된 영역 그리기
    ctx.drawImage(
      canvasRef.current,
      cropArea.x * scale,
      cropArea.y * scale,
      cropWidth,
      cropHeight,
      0,
      0,
      cropWidth,
      cropHeight
    );

    // Blob으로 변환
    canvas.toBlob(
      (blob) => {
        if (blob) {
          onCropComplete(blob);
          onClose();
        }
      },
      'image/jpeg',
      quality
    );
  };

  // 줌 조절
  const handleZoomChange = (event: Event, newValue: number | number[]) => {
    setScale(newValue as number);
  };

  // 회전 조절
  const handleRotate = (direction: 'left' | 'right') => {
    setRotation(prev => prev + (direction === 'left' ? -90 : 90));
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="lg"
      fullWidth
      PaperProps={{
        sx: {
          background: 'rgba(45, 45, 45, 0.95)',
          backdropFilter: 'blur(20px)',
          border: '1px solid rgba(255, 107, 157, 0.2)',
          borderRadius: '20px',
          boxShadow: '0 12px 40px rgba(255, 107, 157, 0.25)',
        },
      }}
    >
      <DialogTitle sx={{ color: 'white', borderBottom: '1px solid rgba(255, 107, 157, 0.2)' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Crop sx={{ color: '#FF6B9D' }} />
          이미지 편집
        </Box>
      </DialogTitle>
      
      <DialogContent sx={{ color: 'white', pt: 3 }}>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          {/* 컨트롤 패널 */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'wrap' }}>
            <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.7)' }}>
              줌:
            </Typography>
            <Slider
              value={scale}
              onChange={handleZoomChange}
              min={0.1}
              max={3}
              step={0.1}
              sx={{
                width: 120,
                '& .MuiSlider-track': { backgroundColor: '#FF6B9D' },
                '& .MuiSlider-thumb': { backgroundColor: '#FF6B9D' },
              }}
            />
            <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.7)' }}>
              {Math.round(scale * 100)}%
            </Typography>
            
            <Tooltip title="왼쪽으로 회전">
              <IconButton onClick={() => handleRotate('left')} sx={{ color: '#FF6B9D' }}>
                <RotateLeft />
              </IconButton>
            </Tooltip>
            
            <Tooltip title="오른쪽으로 회전">
              <IconButton onClick={() => handleRotate('right')} sx={{ color: '#FF6B9D' }}>
                <RotateRight />
              </IconButton>
            </Tooltip>
          </Box>

          {/* 이미지 편집 영역 */}
          <Box
            ref={containerRef}
            sx={{
              position: 'relative',
              width: '100%',
              height: 400,
              border: '2px solid rgba(255, 107, 157, 0.3)',
              borderRadius: '10px',
              overflow: 'hidden',
              cursor: isDragging ? 'grabbing' : 'grab',
            }}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
          >
            <canvas
              ref={canvasRef}
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                height: '100%',
                objectFit: 'contain',
              }}
            />
            
            {/* 크롭 영역 표시 */}
            <Box
              sx={{
                position: 'absolute',
                left: cropArea.x,
                top: cropArea.y,
                width: cropArea.width,
                height: cropArea.height,
                border: '2px solid #FF6B9D',
                backgroundColor: 'rgba(255, 107, 157, 0.1)',
                cursor: 'move',
              }}
            />
          </Box>

          <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.7)', textAlign: 'center' }}>
            이미지를 드래그하여 원하는 영역을 선택하세요
          </Typography>
        </Box>
      </DialogContent>

      <DialogActions sx={{ borderTop: '1px solid rgba(255, 107, 157, 0.2)', p: 2 }}>
        <Button
          onClick={onClose}
          sx={{ color: 'rgba(255, 255, 255, 0.7)' }}
          startIcon={<Close />}
        >
          취소
        </Button>
        <Button
          onClick={handleCrop}
          variant="contained"
          sx={{
            backgroundColor: '#FF6B9D',
            '&:hover': { backgroundColor: '#E55A8A' },
          }}
          startIcon={<Check />}
        >
          적용
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default ImageCropper; 