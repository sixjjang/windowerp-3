import React, { useState, useEffect, useRef } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  Box,
  Typography,
  IconButton,
  Select,
  MenuItem,
  TextField,
  Button,
  Input,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import FullscreenIcon from '@mui/icons-material/Fullscreen';
import FullscreenExitIcon from '@mui/icons-material/FullscreenExit';
import ZoomInIcon from '@mui/icons-material/ZoomIn';
import ZoomOutIcon from '@mui/icons-material/ZoomOut';

interface Props {
  open: boolean;
  onClose: () => void;
}

const years = Array.from(
  { length: 10 },
  (_, i) => new Date().getFullYear() - i
);
const API_BASE = 'https://us-central1-windowerp-3.cloudfunctions.net';

const HistoricalDocumentsModal: React.FC<Props> = ({ open, onClose }) => {
  const [selectedYear, setSelectedYear] = useState<number>(years[0]);
  const [search, setSearch] = useState('');
  const [fileList, setFileList] = useState<any[]>([]);
  const [selectedFile, setSelectedFile] = useState<any>(null);
  const [preview, setPreview] = useState<{
    data: string[][];
    merges: any[];
  } | null>(null);
  const [uploading, setUploading] = useState(false);
  const [searchResults, setSearchResults] = useState<
    { row: number; col: number; value: string }[]
  >([]);
  const [isFullscreen, setIsFullscreen] = useState(true); // 기본값을 true로 변경
  const [zoomLevel, setZoomLevel] = useState(1); // 줌 레벨 상태 추가
  const previewRef = useRef<HTMLDivElement>(null);

  // 연도별 파일 목록 불러오기
  useEffect(() => {
    if (!open) return;
    fetch(`${API_BASE}/historicalDataList?type=delivery&year=${selectedYear}`)
      .then(res => res.json())
      .then(list => {
        // 방어 코드: 항상 배열로 보장
        const safeList = Array.isArray(list) ? list : [];
        setFileList(safeList);
        if (safeList.length > 0) {
          setSelectedFile(safeList[0]);
        } else {
          setSelectedFile(null);
          setPreview(null);
        }
      })
      .catch(error => {
        console.error('파일 목록 로드 실패:', error);
        setFileList([]);
        setSelectedFile(null);
        setPreview(null);
      });
  }, [selectedYear, open]);

  // 파일 선택 시 미리보기 불러오기
  useEffect(() => {
    if (selectedFile) {
      fetch(`${API_BASE}/historicalDataPreview?id=${selectedFile.id}`)
        .then(res => res.json())
        .then(data => setPreview(data))
        .catch(error => {
          console.error('미리보기 로드 실패:', error);
          setPreview(null);
        });
    } else {
      setPreview(null);
    }
  }, [selectedFile]);

  // 업로드
  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    const formData = new FormData();
    formData.append('file', file);
    formData.append('type', 'delivery');
    formData.append('year', String(selectedYear));
    try {
      await fetch(`${API_BASE}/historicalDataUpload`, {
        method: 'POST',
        body: formData,
      });
      // 업로드 후 목록 갱신
      const res = await fetch(
        `${API_BASE}/historicalDataList?type=delivery&year=${selectedYear}`
      );
      const list = await res.json();
      const safeList = Array.isArray(list) ? list : [];
      setFileList(safeList);
      if (safeList.length > 0) setSelectedFile(safeList[0]);
    } catch (error) {
      console.error('업로드 실패:', error);
    } finally {
      setUploading(false);
    }
  };

  // 검색
  const handleSearch = async () => {
    if (!selectedFile || !search.trim()) return;
    try {
      const res = await fetch(
        `${API_BASE}/historicalDataSearch?type=delivery&year=${selectedYear}&keyword=${encodeURIComponent(search)}`
      );
      const data = await res.json();
      setSearchResults(data.results || []);
      // 첫 결과로 스크롤(후속 구현)
      if (data.results && data.results.length > 0 && previewRef.current) {
        const first = data.results[0];
        const el = previewRef.current.querySelector(
          `[data-row='${first.row}'][data-col='${first.col}']`
        );
        if (el)
          (el as HTMLElement).scrollIntoView({
            behavior: 'smooth',
            block: 'center',
          });
      }
    } catch (error) {
      console.error('검색 실패:', error);
      setSearchResults([]);
    }
  };

  // 병합셀 유틸
  function getMergeMap(merges: any[]) {
    const map = new Map<string, { colspan: number; rowspan: number }>();
    const skip = new Set<string>();
    if (!Array.isArray(merges)) return { map, skip };

    merges.forEach((m: any) => {
      map.set(`${m.s.r},${m.s.c}`, {
        colspan: m.e.c - m.s.c + 1,
        rowspan: m.e.r - m.s.r + 1,
      });
      for (let r = m.s.r; r <= m.e.r; r++) {
        for (let c = m.s.c; c <= m.e.c; c++) {
          if (!(r === m.s.r && c === m.s.c)) skip.add(`${r},${c}`);
        }
      }
    });
    return { map, skip };
  }

  // 핀치 줌 핸들러
  const handlePinchZoom = (event: React.WheelEvent) => {
    // 모바일에서만 작동하도록 체크
    if (event.ctrlKey || event.metaKey) {
      event.preventDefault();
      const delta = event.deltaY > 0 ? -0.1 : 0.1;
      const newZoom = Math.max(0.3, Math.min(3, zoomLevel + delta));
      setZoomLevel(newZoom);
    }
  };

  // 터치 이벤트 핸들러 (모바일 핀치 줌)
  const handleTouchStart = (event: React.TouchEvent) => {
    if (event.touches.length === 2) {
      const touch1 = event.touches[0];
      const touch2 = event.touches[1];
      const initialDistance = Math.hypot(
        touch1.clientX - touch2.clientX,
        touch1.clientY - touch2.clientY
      );
      
      const handleTouchMove = (moveEvent: TouchEvent) => {
        if (moveEvent.touches.length === 2) {
          const newTouch1 = moveEvent.touches[0];
          const newTouch2 = moveEvent.touches[1];
          const newDistance = Math.hypot(
            newTouch1.clientX - newTouch2.clientX,
            newTouch1.clientY - newTouch2.clientY
          );
          
          const scale = newDistance / initialDistance;
          const newZoom = Math.max(0.3, Math.min(3, zoomLevel * scale));
          setZoomLevel(newZoom);
        }
      };
      
      const handleTouchEnd = () => {
        document.removeEventListener('touchmove', handleTouchMove);
        document.removeEventListener('touchend', handleTouchEnd);
      };
      
      document.addEventListener('touchmove', handleTouchMove);
      document.addEventListener('touchend', handleTouchEnd);
    }
  };

  // 줌 인/아웃 핸들러
  const handleZoomIn = () => {
    const newZoom = Math.min(3, zoomLevel + 0.2);
    setZoomLevel(newZoom);
  };

  const handleZoomOut = () => {
    const newZoom = Math.max(0.3, zoomLevel - 0.2);
    setZoomLevel(newZoom);
  };

  const handleZoomReset = () => {
    setZoomLevel(1);
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth={isFullscreen ? false : "xl"}
      fullWidth={isFullscreen}
      fullScreen={isFullscreen}
      PaperProps={{
        sx: {
          width: isFullscreen ? '100vw' : '90vw',
          height: isFullscreen ? '100vh' : '90vh',
          maxWidth: isFullscreen ? 'none' : 'none',
          maxHeight: isFullscreen ? 'none' : 'none',
          p: 0,
          background: '#23272f',
        },
      }}
    >
      <DialogTitle
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          background: '#263040',
          color: '#fff',
          p: 2,
        }}
      >
        <Typography
          variant="subtitle1"
          sx={{ fontSize: '1.25rem', fontWeight: 'bold' }}
        >
          과거자료 보기
        </Typography>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <IconButton 
            onClick={handleZoomOut}
            sx={{ color: '#fff' }}
            title="줌 아웃"
            disabled={zoomLevel <= 0.3}
          >
            <ZoomOutIcon />
          </IconButton>
          <Typography
            variant="body2"
            sx={{ 
              color: '#fff', 
              fontSize: '0.875rem',
              minWidth: '60px',
              textAlign: 'center',
              cursor: 'pointer'
            }}
            onClick={handleZoomReset}
            title="줌 리셋"
          >
            {Math.round(zoomLevel * 100)}%
          </Typography>
          <IconButton 
            onClick={handleZoomIn}
            sx={{ color: '#fff' }}
            title="줌 인"
            disabled={zoomLevel >= 3}
          >
            <ZoomInIcon />
          </IconButton>
          <IconButton 
            onClick={() => setIsFullscreen(!isFullscreen)} 
            sx={{ color: '#fff' }}
            title={isFullscreen ? '전체보기 해제' : '전체보기'}
          >
            {isFullscreen ? <FullscreenExitIcon /> : <FullscreenIcon />}
          </IconButton>
          <IconButton onClick={onClose} sx={{ color: '#fff' }}>
            <CloseIcon />
          </IconButton>
        </Box>
      </DialogTitle>
      <DialogContent
        sx={{
          p: 3,
          height: isFullscreen ? 'calc(100vh - 64px)' : 'calc(90vh - 64px)',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        <Box sx={{ display: 'flex', gap: 2, mb: 3, alignItems: 'center' }}>
          <Select
            value={selectedYear}
            onChange={e => setSelectedYear(Number(e.target.value))}
            size="small"
            sx={{ minWidth: 120, background: '#222', color: '#fff' }}
          >
            {years.map(y => (
              <MenuItem key={y} value={y}>
                {y}년
              </MenuItem>
            ))}
          </Select>
          <Button
            variant="outlined"
            component="label"
            sx={{
              color: '#40c4ff',
              borderColor: '#40c4ff',
              background: '#181c23',
            }}
            disabled={uploading}
          >
            엑셀 업로드
            <Input
              type="file"
              inputProps={{ accept: '.xlsx,.xls' }}
              onChange={handleUpload}
              sx={{ display: 'none' }}
            />
          </Button>
          <TextField
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="검색어를 입력하세요"
            size="small"
            sx={{
              flex: 1,
              background: '#222',
              color: '#fff',
              input: { color: '#fff' },
            }}
            onKeyDown={e => {
              if (e.key === 'Enter') handleSearch();
            }}
          />
          <Button
            variant="contained"
            sx={{ background: '#40c4ff' }}
            onClick={handleSearch}
          >
            검색
          </Button>
        </Box>
        <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
          {/* 방어 코드: fileList가 배열인지 확인 */}
          {Array.isArray(fileList) &&
            fileList.map(f => (
              <Button
                key={f.id}
                variant={selectedFile?.id === f.id ? 'contained' : 'outlined'}
                size="small"
                sx={{
                  minWidth: 120,
                  background: selectedFile?.id === f.id ? '#40c4ff' : '#181c23',
                  color: selectedFile?.id === f.id ? '#fff' : '#b0b8c1',
                  borderColor: '#40c4ff',
                }}
                onClick={() => setSelectedFile(f)}
              >
                {f.originalName}
              </Button>
            ))}
        </Box>
        {/* 미리보기 */}
        <Box
          ref={previewRef}
          onWheel={handlePinchZoom}
          onTouchStart={handleTouchStart}
          sx={{
            flex: 1,
            background: '#181c23',
            borderRadius: 2,
            p: 1,
            overflow: 'auto',
            overflowX: 'scroll', // 가로 스크롤 항상 표시
            overflowY: 'scroll', // 세로 스크롤 항상 표시
            color: '#fff',
            fontSize: 13,
            transform: `scale(${zoomLevel})`,
            transformOrigin: 'top left',
            transition: 'transform 0.1s ease-out',
            // 스크롤바 스타일링
            '&::-webkit-scrollbar': {
              width: '12px',
              height: '12px',
            },
            '&::-webkit-scrollbar-track': {
              background: '#2a2a2a',
              borderRadius: '6px',
            },
            '&::-webkit-scrollbar-thumb': {
              background: '#555',
              borderRadius: '6px',
              '&:hover': {
                background: '#777',
              },
            },
            '&::-webkit-scrollbar-corner': {
              background: '#2a2a2a',
            },
          }}
        >
          {preview ? (
            <table style={{ borderCollapse: 'collapse', width: '100%' }}>
              <tbody>
                {Array.isArray(preview.data) &&
                  preview.data.map((row, r) => (
                    <tr key={r} style={{ height: 22 }}>
                      {Array.isArray(row) &&
                        row.map((cell, c) => {
                          const { map, skip } = getMergeMap(
                            preview.merges || []
                          );
                          if (skip.has(`${r},${c}`)) return null;
                          const merge = map.get(`${r},${c}`);
                          const isHighlight = searchResults.some(
                            res => res.row === r && res.col === c
                          );
                          return (
                            <td
                              key={c}
                              data-row={r}
                              data-col={c}
                              rowSpan={merge?.rowspan || 1}
                              colSpan={merge?.colspan || 1}
                              style={{
                                border: '1px solid #333',
                                padding: '0 6px',
                                minWidth: 40,
                                maxWidth: 180,
                                whiteSpace: 'nowrap',
                                background: isHighlight ? '#ffe082' : '#23272f',
                                color: isHighlight ? '#222' : '#fff',
                                fontSize: 13,
                                lineHeight: 1.1,
                                textAlign: 'left',
                                cursor: 'pointer',
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                              }}
                            >
                              {cell}
                            </td>
                          );
                        })}
                    </tr>
                  ))}
              </tbody>
            </table>
          ) : (
            <Typography
              variant="body2"
              sx={{ color: '#888', textAlign: 'center', mt: 10 }}
            >
              {Array.isArray(fileList) && fileList.length === 0
                ? '해당 연도에 업로드된 파일이 없습니다.'
                : '파일을 선택하면 미리보기가 표시됩니다.'}
            </Typography>
          )}
        </Box>
      </DialogContent>
    </Dialog>
  );
};

export default HistoricalDocumentsModal;
