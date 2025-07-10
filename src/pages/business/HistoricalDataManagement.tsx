import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  Box,
  Typography,
  Grid,
  Button,
  TextField,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  Select,
  MenuItem,
  Chip,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Input,
  FormControl,
  InputLabel,
  CircularProgress,
  List,
  ListItem,
  ListItemText,
  ListItemButton,
  DialogActions,
} from '@mui/material';
import {
  Upload as UploadIcon,
  Search as SearchIcon,
  Clear as ClearIcon,
  Visibility as ViewIcon,
  Delete as DeleteIcon,
  ZoomOutMap as FullscreenIcon,
  FilterNone as SimpleViewIcon,
  Edit as EditIcon,
} from '@mui/icons-material';
import * as XLSX from 'xlsx';

interface HistoricalRecord {
  id: string;
  type: 'delivery' | 'estimate';
  year: number;
  filename: string;
  originalName: string;
  uploadDate: string;
  fileSize: number;
  previewData?: string[][];
  merges?: any[];
}

const HistoricalDataManagement: React.FC = () => {
  const [selectedType, setSelectedType] = useState<'delivery' | 'estimate'>(
    'delivery'
  );
  const [selectedYear, setSelectedYear] = useState<number>(
    new Date().getFullYear()
  );
  const [records, setRecords] = useState<HistoricalRecord[]>([]);
  const [searchKeyword, setSearchKeyword] = useState('');
  const [searchYear, setSearchYear] = useState<number | ''>('');
  const [uploading, setUploading] = useState(false);
  const [previewDialog, setPreviewDialog] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState<HistoricalRecord | null>(
    null
  );
  const [globalSearch, setGlobalSearch] = useState('');
  const [fullView, setFullView] = useState(false);
  const [previewSearchKeyword, setPreviewSearchKeyword] = useState('');
  const [searchResults, setSearchResults] = useState<
    Array<{ row: number; col: number; content: string }>
  >([]);
  const [currentSearchIndex, setCurrentSearchIndex] = useState(0);
  const [highlightedCell, setHighlightedCell] = useState<{
    row: number;
    col: number;
  } | null>(null);
  const [scrollTop, setScrollTop] = useState(0);
  const [sheetSelectionDialog, setSheetSelectionDialog] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [availableSheets, setAvailableSheets] = useState<string[]>([]);
  const [selectedSheets, setSelectedSheets] = useState<string[]>([]);
  const [sheetData, setSheetData] = useState<{ [sheetName: string]: any[][] }>({});
  const [editDialog, setEditDialog] = useState(false);
  const [editingRecord, setEditingRecord] = useState<HistoricalRecord | null>(null);
  const [editFileName, setEditFileName] = useState('');
  const [editYear, setEditYear] = useState(selectedYear);

  const years = Array.from(
    { length: 10 },
    (_, i) => new Date().getFullYear() - i
  );
  const API_BASE =
    process.env.NODE_ENV === 'development'
      ? 'http://localhost:4000'
      : process.env.REACT_APP_API_BASE || 'http://sixjjang.synology.me:4000';

  // 가상화 설정
  const ROW_HEIGHT = 32;
  const VISIBLE_ROWS = 30; // 화면에 보이는 행 수
  const BUFFER_ROWS = 5; // 버퍼 행 수

  useEffect(() => {
    loadRecords();
  }, [selectedType, selectedYear]);

  const loadRecords = async () => {
    try {
      const response = await fetch(
        `${API_BASE}/historical-data/list?type=${selectedType}&year=${selectedYear}`
      );
      const data = await response.json();
      setRecords(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('파일 목록 로드 실패:', error);
      setRecords([]);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // 파일 확장자 검증
    const fileExtension = file.name.split('.').pop()?.toLowerCase();
    if (!['xlsx', 'xls'].includes(fileExtension || '')) {
      alert('엑셀 파일(.xlsx, .xls)만 업로드 가능합니다.');
      return;
    }

    setSelectedFile(file);
    
    // 엑셀 파일에서 시트 목록 읽기
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const data = event.target?.result;
        if (!data) return;
        
        const workbook = XLSX.read(data, { type: 'binary' });
        const sheetNames = workbook.SheetNames;
        
        if (sheetNames.length === 0) {
          alert('엑셀 파일에 시트가 없습니다.');
          return;
        }
        
        // 시트별 데이터 미리 읽기
        const sheetDataMap: { [sheetName: string]: any[][] } = {};
        sheetNames.forEach(sheetName => {
          const worksheet = workbook.Sheets[sheetName];
          const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 }) as any[][];
          sheetDataMap[sheetName] = jsonData;
        });
        
        setAvailableSheets(sheetNames);
        setSheetData(sheetDataMap);
        setSelectedSheets([]); // 선택 초기화
        setSheetSelectionDialog(true);
        
      } catch (error) {
        console.error('엑셀 파일 읽기 실패:', error);
        alert('엑셀 파일을 읽을 수 없습니다.');
      }
    };
    
    reader.readAsBinaryString(file);
  };

  const handleSheetUpload = async () => {
    if (!selectedFile || selectedSheets.length === 0) return;

    setUploading(true);
    
    try {
      // 선택된 각 시트별로 업로드
      for (const sheetName of selectedSheets) {
        const sheetDataArray = sheetData[sheetName];
        if (!sheetDataArray || sheetDataArray.length === 0) continue;

        // 시트 데이터를 임시 엑셀 파일로 변환
        const workbook = XLSX.utils.book_new();
        const worksheet = XLSX.utils.aoa_to_sheet(sheetDataArray);
        XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);
        
        // 엑셀 파일을 Blob으로 변환
        const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
        const blob = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
        
        // 파일명에 시트명 포함
        const originalName = selectedFile.name;
        const nameWithoutExt = originalName.substring(0, originalName.lastIndexOf('.'));
        const ext = originalName.substring(originalName.lastIndexOf('.'));
        const newFileName = `${nameWithoutExt}_${sheetName}${ext}`;
        
        // File 객체 생성
        const sheetFile = new File([blob], newFileName, { type: blob.type });
        
        // 업로드
        const formData = new FormData();
        formData.append('file', sheetFile);
        formData.append('type', selectedType);
        formData.append('year', String(selectedYear));
        formData.append('sheetName', sheetName); // 시트명 정보 추가
        
        await fetch(`${API_BASE}/historical-data/upload`, {
          method: 'POST',
          body: formData,
        });
      }
      
      // 업로드 완료 후 목록 갱신
      loadRecords();
      alert(`${selectedSheets.length}개 시트가 성공적으로 업로드되었습니다.`);
      
    } catch (error) {
      console.error('업로드 실패:', error);
      alert('업로드 중 오류가 발생했습니다.');
    } finally {
      setUploading(false);
      setSheetSelectionDialog(false);
      setSelectedFile(null);
      setAvailableSheets([]);
      setSelectedSheets([]);
      setSheetData({});
    }
  };

  const handleSheetToggle = (sheetName: string) => {
    setSelectedSheets(prev => 
      prev.includes(sheetName) 
        ? prev.filter(name => name !== sheetName)
        : [...prev, sheetName]
    );
  };

  const handleSelectAll = () => {
    setSelectedSheets(availableSheets);
  };

  const handleDeselectAll = () => {
    setSelectedSheets([]);
  };

  const getSheetInfo = (sheetName: string) => {
    const data = sheetData[sheetName];
    if (!data) return { rows: 0, cols: 0 };
    
    const rows = data.length;
    const cols = data.length > 0 ? data[0].length : 0;
    return { rows, cols };
  };

  const handleYearSearch = async () => {
    if (!searchYear || !searchKeyword.trim()) return;

    try {
      const response = await fetch(
        `${API_BASE}/historical-data/search?type=${selectedType}&year=${searchYear}&keyword=${encodeURIComponent(searchKeyword)}`
      );
      const data = await response.json();
      setRecords(data.results || []);
    } catch (error) {
      console.error('검색 실패:', error);
    }
  };

  const handleGlobalSearch = async () => {
    if (!globalSearch.trim()) return;

    try {
      const response = await fetch(
        `${API_BASE}/historical-data/global-search?keyword=${encodeURIComponent(globalSearch)}`
      );
      const data = await response.json();
      setRecords(data.results || []);
    } catch (error) {
      console.error('전체 검색 실패:', error);
    }
  };

  const handlePreview = async (record: HistoricalRecord) => {
    try {
      const response = await fetch(
        `${API_BASE}/historical-data/${record.id}/preview`
      );
      const data = await response.json();
      setSelectedRecord({
        ...record,
        previewData: data.data,
        merges: data.merges,
      });
      setPreviewDialog(true);
    } catch (error) {
      console.error('미리보기 로드 실패:', error);
    }
  };

  const handleDelete = async (record: HistoricalRecord) => {
    if (!window.confirm('정말 삭제하시겠습니까?')) return;

    try {
      await fetch(`${API_BASE}/historical-data/${record.id}`, {
        method: 'DELETE',
      });
      loadRecords();
    } catch (error) {
      console.error('삭제 실패:', error);
    }
  };

  // 가상화된 데이터 계산
  const getVirtualizedData = () => {
    if (!selectedRecord?.previewData) {
      return {
        data: [],
        startIndex: 0,
        endIndex: 0,
        totalHeight: 0,
      };
    }

    const data = fullView
      ? selectedRecord.previewData
      : selectedRecord.previewData.slice(0, 100);
    const startIndex = Math.max(
      0,
      Math.floor(scrollTop / ROW_HEIGHT) - BUFFER_ROWS
    );
    const endIndex = Math.min(
      data.length,
      startIndex + VISIBLE_ROWS + BUFFER_ROWS * 2
    );

    return {
      data: data.slice(startIndex, endIndex),
      startIndex,
      endIndex,
      totalHeight: data.length * ROW_HEIGHT,
    };
  };

  // 스크롤 핸들러
  const handleScroll = (event: React.UIEvent<HTMLDivElement>) => {
    setScrollTop(event.currentTarget.scrollTop);
  };

  // 셀 내용 길이에 따른 표시 방식 결정
  const getCellDisplayStyle = (
    content: string,
    isFullView: boolean,
    isHighlighted: boolean = false
  ) => {
    return {
      border: '1px solid #444',
      padding: isFullView ? '4px 10px' : '6px 16px',
      color: '#e0e6ed',
      background: isHighlighted ? 'rgba(255, 193, 7, 0.3)' : 'none',
      textAlign: 'left' as const,
      whiteSpace: 'nowrap' as const, // 한 줄로 표시
      overflow: 'hidden',
      textOverflow: 'ellipsis',
      fontFamily: 'monospace',
      fontSize: isFullView ? '0.85rem' : '1rem',
      lineHeight: 1.2,
      verticalAlign: 'top' as const,
      wordBreak: 'keep-all' as const,
      display: 'inline-block',
      margin: '0',
      boxSizing: 'border-box' as const,
      position: 'relative' as const,
      width: 'auto', // 자동 너비
      flex: '0 1 auto', // flex-basis: auto, 내용에 따라 늘어남
    };
  };

  // 미리보기 내 검색 기능
  const handlePreviewSearch = () => {
    if (!previewSearchKeyword.trim() || !selectedRecord?.previewData) {
      setSearchResults([]);
      setCurrentSearchIndex(0);
      setHighlightedCell(null);
      return;
    }

    const results: Array<{ row: number; col: number; content: string }> = [];
    const keyword = previewSearchKeyword.toLowerCase();

    selectedRecord.previewData.forEach((row, rowIndex) => {
      row.forEach((cell, colIndex) => {
        if (cell && cell.toLowerCase().includes(keyword)) {
          results.push({ row: rowIndex, col: colIndex, content: cell });
        }
      });
    });

    setSearchResults(results);
    setCurrentSearchIndex(0);
    if (results.length > 0) {
      setHighlightedCell({ row: results[0].row, col: results[0].col });
    } else {
      setHighlightedCell(null);
    }
  };

  // 검색어 변경 시 자동 검색
  useEffect(() => {
    if (previewSearchKeyword.trim()) {
      handlePreviewSearch();
    } else {
      setSearchResults([]);
      setCurrentSearchIndex(0);
      setHighlightedCell(null);
    }
  }, [previewSearchKeyword]);

  // 다음 검색 결과로 이동
  const goToNextResult = () => {
    if (searchResults.length === 0) return;
    const nextIndex = (currentSearchIndex + 1) % searchResults.length;
    setCurrentSearchIndex(nextIndex);
    setHighlightedCell({
      row: searchResults[nextIndex].row,
      col: searchResults[nextIndex].col,
    });
  };

  // 이전 검색 결과로 이동
  const goToPrevResult = () => {
    if (searchResults.length === 0) return;
    const prevIndex =
      currentSearchIndex === 0
        ? searchResults.length - 1
        : currentSearchIndex - 1;
    setCurrentSearchIndex(prevIndex);
    setHighlightedCell({
      row: searchResults[prevIndex].row,
      col: searchResults[prevIndex].col,
    });
  };

  // 검색 결과로 스크롤 이동
  const scrollToResult = (row: number) => {
    // 가상화를 고려한 스크롤 위치 계산
    const targetScrollTop = row * ROW_HEIGHT;
    const container = document.querySelector(
      '[data-scroll-container]'
    ) as HTMLElement;
    if (container) {
      container.scrollTo({
        top: targetScrollTop - 100, // 약간 위쪽에 위치하도록 조정
        behavior: 'smooth',
      });
    }
  };

  // 검색 결과 변경 시 스크롤
  useEffect(() => {
    if (highlightedCell) {
      // 약간의 지연을 두어 가상화가 업데이트된 후 스크롤
      setTimeout(() => {
        scrollToResult(highlightedCell.row);
      }, 100);
    }
  }, [highlightedCell]);

  // 열별 최대 글자수 기준으로 가로폭 계산
  const getColumnWidths = (
    data: string[][],
    baseWidth = 10,
    min = 60,
    max = 180
  ) => {
    if (!data || data.length === 0) return [];
    const colCount = Math.max(...data.map(row => row.length));
    const colWidths = Array(colCount).fill(min);
    for (let c = 0; c < colCount; c++) {
      let maxLen = 0;
      for (let r = 0; r < data.length; r++) {
        const cell = data[r][c] || '';
        maxLen = Math.max(maxLen, cell.length);
      }
      colWidths[c] = Math.min(Math.max(baseWidth * maxLen, min), max);
    }
    return colWidths;
  };

  // === 파일 정보 수정 함수 ===
  const handleEdit = (record: HistoricalRecord) => {
    setEditingRecord(record);
    setEditFileName(record.originalName);
    setEditYear(record.year);
    setEditDialog(true);
  };

  const handleEditSave = async () => {
    if (!editingRecord || !editFileName.trim()) return;

    try {
      console.log('수정 요청:', {
        id: editingRecord.id,
        originalName: editFileName.trim(),
        year: editYear,
      });

      const response = await fetch(`${API_BASE}/historical-data/${editingRecord.id}/update`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          originalName: editFileName.trim(),
          year: editYear,
        }),
      });

      console.log('응답 상태:', response.status);
      
      if (response.ok) {
        const result = await response.json();
        console.log('수정 성공:', result);
        
        // 목록 갱신
        loadRecords();
        setEditDialog(false);
        setEditingRecord(null);
        setEditFileName('');
        setEditYear(selectedYear);
        alert('파일 정보가 수정되었습니다.');
      } else {
        const errorData = await response.json().catch(() => ({}));
        console.error('서버 오류:', errorData);
        throw new Error(`수정 실패: ${response.status} - ${errorData.error || '알 수 없는 오류'}`);
      }
    } catch (error) {
      console.error('파일 수정 실패:', error);
      alert(`파일 수정 중 오류가 발생했습니다: ${error instanceof Error ? error.message : '알 수 없는 오류'}`);
    }
  };

  const handleEditCancel = () => {
    setEditDialog(false);
    setEditingRecord(null);
    setEditFileName('');
    setEditYear(selectedYear);
  };

  return (
    <Box
      sx={{
        height: '100vh',
        display: 'flex',
        flexDirection: 'column',
        backgroundColor: '#1a1a1a',
      }}
    >
      {/* 헤더 */}
      <Box
        sx={{
          p: 2,
          backgroundColor: '#263040',
          borderBottom: '1px solid rgba(255,255,255,0.1)',
        }}
      >
        <Typography
          variant="h5"
          sx={{ color: '#e0e6ed', fontWeight: 'bold', mb: 2 }}
        >
          📊 과거자료 관리
        </Typography>

        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} md={3}>
            <FormControl fullWidth size="small">
              <InputLabel id="type-label" sx={{ color: '#b0b8c1' }}>
                자료 유형
              </InputLabel>
              <Select
                labelId="type-label"
                id="type-select"
                name="type"
                value={selectedType}
                onChange={e =>
                  setSelectedType(e.target.value as 'delivery' | 'estimate')
                }
                sx={{
                  color: '#e0e6ed',
                  backgroundColor: 'rgba(255,255,255,0.05)',
                  '& .MuiOutlinedInput-notchedOutline': {
                    borderColor: 'rgba(255,255,255,0.2)',
                  },
                }}
              >
                <MenuItem value="delivery">납품관리</MenuItem>
                <MenuItem value="estimate">견적관리</MenuItem>
              </Select>
            </FormControl>
          </Grid>

          <Grid item xs={12} md={2}>
            <FormControl fullWidth size="small">
              <InputLabel id="year-label" sx={{ color: '#b0b8c1' }}>
                년도
              </InputLabel>
              <Select
                labelId="year-label"
                id="year-select"
                name="year"
                value={selectedYear}
                onChange={e => setSelectedYear(Number(e.target.value))}
                sx={{
                  color: '#e0e6ed',
                  backgroundColor: 'rgba(255,255,255,0.05)',
                  '& .MuiOutlinedInput-notchedOutline': {
                    borderColor: 'rgba(255,255,255,0.2)',
                  },
                }}
              >
                {years.map(year => (
                  <MenuItem key={year} value={year}>
                    {year}년
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>

          <Grid item xs={12} md={3}>
            <Button
              variant="outlined"
              component="label"
              startIcon={
                uploading ? (
                  <CircularProgress size={16} sx={{ color: '#40c4ff' }} />
                ) : (
                  <UploadIcon />
                )
              }
              disabled={uploading}
              sx={{
                color: '#40c4ff',
                borderColor: '#40c4ff',
                backgroundColor: 'rgba(64, 196, 255, 0.1)',
                '&:hover': {
                  borderColor: '#2196f3',
                  backgroundColor: 'rgba(64, 196, 255, 0.2)',
                },
              }}
            >
              {uploading ? '업로드 중...' : '엑셀 파일 업로드'}
              <Input
                type="file"
                inputProps={{ accept: '.xlsx,.xls' }}
                onChange={handleFileSelect}
                sx={{ display: 'none' }}
              />
            </Button>
          </Grid>

          <Grid item xs={12} md={4}>
            <Chip
              label={`${records.length}개 파일`}
              color="primary"
              variant="outlined"
              sx={{ borderColor: '#40c4ff', color: '#40c4ff' }}
            />
          </Grid>
        </Grid>
      </Box>

      {/* 검색 영역 */}
      <Box
        sx={{
          p: 2,
          backgroundColor: '#2d2d2d',
          borderBottom: '1px solid rgba(255,255,255,0.1)',
        }}
      >
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} md={4}>
            <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
              <FormControl size="small" sx={{ minWidth: 100 }}>
                <Select
                  value={searchYear}
                  onChange={e => setSearchYear(Number(e.target.value))}
                  displayEmpty
                  sx={{
                    color: '#e0e6ed',
                    backgroundColor: 'rgba(255,255,255,0.05)',
                    '& .MuiOutlinedInput-notchedOutline': {
                      borderColor: 'rgba(255,255,255,0.2)',
                    },
                  }}
                >
                  <MenuItem value="">전체</MenuItem>
                  {years.map(year => (
                    <MenuItem key={year} value={year}>
                      {year}년
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
              <TextField
                id="search-keyword"
                name="searchKeyword"
                size="small"
                placeholder="검색어 입력"
                value={searchKeyword}
                onChange={e => setSearchKeyword(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleYearSearch()}
                sx={{
                  flex: 1,
                  '& .MuiOutlinedInput-root': {
                    color: '#e0e6ed',
                    backgroundColor: 'rgba(255,255,255,0.05)',
                    '& fieldset': { borderColor: 'rgba(255,255,255,0.2)' },
                  },
                }}
              />
              <Button
                variant="contained"
                size="small"
                onClick={handleYearSearch}
                sx={{ backgroundColor: '#40c4ff' }}
              >
                검색
              </Button>
            </Box>
          </Grid>

          <Grid item xs={12} md={6}>
            <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
              <TextField
                id="global-search"
                name="globalSearch"
                size="small"
                placeholder="전체 자료에서 검색 (납품관리 + 견적관리)"
                value={globalSearch}
                onChange={e => setGlobalSearch(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleGlobalSearch()}
                sx={{
                  flex: 1,
                  '& .MuiOutlinedInput-root': {
                    color: '#e0e6ed',
                    backgroundColor: 'rgba(255,255,255,0.05)',
                    '& fieldset': { borderColor: 'rgba(255,255,255,0.2)' },
                  },
                }}
              />
              <Button
                variant="contained"
                size="small"
                onClick={handleGlobalSearch}
                sx={{ backgroundColor: '#ff9800' }}
              >
                전체검색
              </Button>
            </Box>
          </Grid>

          <Grid item xs={12} md={2}>
            <Button
              variant="outlined"
              size="small"
              onClick={loadRecords}
              sx={{ color: '#b0b8c1', borderColor: 'rgba(255,255,255,0.2)' }}
            >
              초기화
            </Button>
          </Grid>
        </Grid>
      </Box>

      {/* 파일 목록 */}
      <Box sx={{ flex: 1, overflowY: 'auto', p: 2 }}>
        <TableContainer
          component={Paper}
          sx={{ backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 2 }}
        >
          <Table>
            <TableHead>
              <TableRow sx={{ backgroundColor: 'rgba(0,0,0,0.3)' }}>
                <TableCell sx={{ color: '#e0e6ed', fontWeight: 'bold' }}>
                  파일명
                </TableCell>
                <TableCell sx={{ color: '#e0e6ed', fontWeight: 'bold' }}>
                  유형
                </TableCell>
                <TableCell sx={{ color: '#e0e6ed', fontWeight: 'bold' }}>
                  년도
                </TableCell>
                <TableCell sx={{ color: '#e0e6ed', fontWeight: 'bold' }}>
                  크기
                </TableCell>
                <TableCell sx={{ color: '#e0e6ed', fontWeight: 'bold' }}>
                  업로드일
                </TableCell>
                <TableCell sx={{ color: '#e0e6ed', fontWeight: 'bold' }}>
                  작업
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {records.map(record => (
                <TableRow
                  key={record.id}
                  sx={{
                    '&:hover': { backgroundColor: 'rgba(255,255,255,0.05)' },
                  }}
                >
                  <TableCell sx={{ color: '#e0e6ed' }}>
                    {record.originalName}
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={
                        record.type === 'delivery' ? '납품관리' : '견적관리'
                      }
                      size="small"
                      color={
                        record.type === 'delivery' ? 'primary' : 'secondary'
                      }
                      sx={{ fontSize: '0.75rem' }}
                    />
                  </TableCell>
                  <TableCell sx={{ color: '#e0e6ed' }}>
                    {record.year}년
                  </TableCell>
                  <TableCell sx={{ color: '#e0e6ed' }}>
                    {(record.fileSize / 1024).toFixed(1)} KB
                  </TableCell>
                  <TableCell sx={{ color: '#e0e6ed' }}>
                    {new Date(record.uploadDate).toLocaleDateString()}
                  </TableCell>
                  <TableCell>
                    <Box sx={{ display: 'flex', gap: 1 }}>
                      <IconButton
                        size="small"
                        onClick={() => handlePreview(record)}
                        sx={{ color: '#40c4ff' }}
                        title="미리보기"
                      >
                        <ViewIcon />
                      </IconButton>
                      <IconButton
                        size="small"
                        onClick={() => handleEdit(record)}
                        sx={{ color: '#ffc107' }}
                        title="수정"
                      >
                        <EditIcon />
                      </IconButton>
                      <IconButton
                        size="small"
                        onClick={() => handleDelete(record)}
                        sx={{ color: '#ff6b6b' }}
                        title="삭제"
                      >
                        <DeleteIcon />
                      </IconButton>
                    </Box>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>

        {records.length === 0 && (
          <Box sx={{ textAlign: 'center', py: 8, color: '#b0b8c1' }}>
            <Typography variant="h6">파일이 없습니다</Typography>
            <Typography variant="body2">엑셀 파일을 업로드해주세요</Typography>
          </Box>
        )}
      </Box>

      {/* 미리보기 다이얼로그 */}
      <Dialog
        open={previewDialog}
        onClose={() => setPreviewDialog(false)}
        maxWidth={false}
        fullWidth
        PaperProps={{
          sx: {
            backgroundColor: '#23272f',
            color: '#e0e6ed',
            maxHeight: '95vh',
            width: '95vw',
            maxWidth: '95vw',
          },
        }}
      >
        <DialogTitle sx={{ borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
          <Box
            sx={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}
          >
            <Typography variant="h6">
              {selectedRecord?.originalName} - 미리보기
            </Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <IconButton
                onClick={() => setFullView(v => !v)}
                sx={{ color: '#e0e6ed' }}
                title={fullView ? '간단보기' : '전체보기'}
              >
                {fullView ? <SimpleViewIcon /> : <FullscreenIcon />}
              </IconButton>
              <IconButton
                onClick={() => setPreviewDialog(false)}
                sx={{ color: '#e0e6ed' }}
              >
                <ClearIcon />
              </IconButton>
            </Box>
          </Box>
        </DialogTitle>
        <DialogContent sx={{ p: 0 }}>
          {/* 검색 UI */}
          <Box sx={{ p: 2, backgroundColor: '#181c23', borderRadius: 1, m: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
              <TextField
                size="small"
                placeholder="검색어 입력..."
                value={previewSearchKeyword}
                onChange={e => setPreviewSearchKeyword(e.target.value)}
                sx={{
                  flex: 1,
                  '& .MuiOutlinedInput-root': {
                    color: '#e0e6ed',
                    backgroundColor: 'rgba(255,255,255,0.05)',
                    '& fieldset': { borderColor: 'rgba(255,255,255,0.2)' },
                  },
                }}
              />
              {searchResults.length > 0 && (
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Typography variant="caption" sx={{ color: '#b0b8c1' }}>
                    {currentSearchIndex + 1} / {searchResults.length}
                  </Typography>
                  <IconButton
                    size="small"
                    onClick={goToPrevResult}
                    sx={{ color: '#40c4ff' }}
                  >
                    ←
                  </IconButton>
                  <IconButton
                    size="small"
                    onClick={goToNextResult}
                    sx={{ color: '#40c4ff' }}
                  >
                    →
                  </IconButton>
                </Box>
              )}
              {previewSearchKeyword && searchResults.length === 0 && (
                <Typography variant="caption" sx={{ color: '#ff6b6b' }}>
                  검색 결과 없음
                </Typography>
              )}
            </Box>
            <Typography variant="body2" sx={{ color: '#b0b8c1', mb: 1 }}>
              {fullView ? '전체보기 (최적화됨)' : '간단보기 (처음 100행)'}
            </Typography>
            {selectedRecord?.previewData && (
              <Typography variant="caption" sx={{ color: '#8a8a8a' }}>
                총 {selectedRecord.previewData.length}행,{' '}
                {selectedRecord.previewData[0]?.length || 0}열
                {searchResults.length > 0 &&
                  ` • 검색결과: ${searchResults.length}개`}
              </Typography>
            )}
          </Box>
          <Box
            sx={{
              p: 2,
              maxHeight: '70vh',
              overflow: 'auto',
              overflowX: 'auto', // 가로 스크롤 허용
              '&::-webkit-scrollbar': {
                width: '8px',
                height: '8px',
              },
              '&::-webkit-scrollbar-track': {
                background: 'rgba(255,255,255,0.1)',
                borderRadius: '4px',
              },
              '&::-webkit-scrollbar-thumb': {
                background: 'rgba(255,255,255,0.3)',
                borderRadius: '4px',
                '&:hover': {
                  background: 'rgba(255,255,255,0.5)',
                },
              },
            }}
            onScroll={handleScroll}
            data-scroll-container
          >
            {selectedRecord?.previewData ? (
              <Box sx={{ overflowX: 'auto', background: 'none' }}>
                <div
                  style={{
                    position: 'relative',
                    height: `${getVirtualizedData().totalHeight}px`,
                    fontFamily: 'monospace',
                    fontSize: fullView ? '0.85rem' : '1rem',
                  }}
                >
                  <div
                    style={{
                      position: 'absolute',
                      top: `${getVirtualizedData().startIndex * ROW_HEIGHT}px`,
                      left: 0,
                      right: 0,
                    }}
                  >
                    {(() => {
                      const merges = selectedRecord.merges || [];
                      const mergeMap: Record<
                        string,
                        { colSpan: number; rowSpan: number; skip: boolean }
                      > = {};

                      // 셀 병합 정보 처리 - 정확한 인식
                      merges.forEach((merge: any) => {
                        for (let r = merge.s.r; r <= merge.e.r; r++) {
                          for (let c = merge.s.c; c <= merge.e.c; c++) {
                            const key = `${r},${c}`;
                            if (r === merge.s.r && c === merge.s.c) {
                              // 병합된 셀의 시작점
                              mergeMap[key] = {
                                colSpan: merge.e.c - merge.s.c + 1,
                                rowSpan: merge.e.r - merge.s.r + 1,
                                skip: false,
                              };
                            } else {
                              // 병합된 셀의 나머지 부분은 건너뛰기
                              mergeMap[key] = {
                                colSpan: 1,
                                rowSpan: 1,
                                skip: true,
                              };
                            }
                          }
                        }
                      });

                      // 열별 최대 글자수 기준 가로폭 계산
                      const virtualData = getVirtualizedData();
                      const allRows = fullView
                        ? selectedRecord.previewData
                        : selectedRecord.previewData.slice(0, 100);
                      const colWidths = getColumnWidths(allRows);

                      return virtualData.data.map(
                        (row: string[], virtualIndex: number) => {
                          const actualRowIndex =
                            virtualData.startIndex + virtualIndex;

                          return (
                            <div
                              key={actualRowIndex}
                              style={{
                                display: 'flex',
                                borderBottom: '1px solid #444',
                                height: `${ROW_HEIGHT}px`,
                                alignItems: 'stretch',
                              }}
                            >
                              {row.map((cell: string, colIndex: number) => {
                                const key = `${actualRowIndex},${colIndex}`;
                                const merge = mergeMap[key];
                                if (merge && merge.skip) return null;
                                const cellContent = cell || '';
                                const isHighlighted =
                                  highlightedCell?.row === actualRowIndex &&
                                  highlightedCell?.col === colIndex;
                                // 병합 셀은 colSpan만큼 너비 합산
                                let width = colWidths[colIndex] || 100;
                                if (merge?.colSpan && merge.colSpan > 1) {
                                  for (let i = 1; i < merge.colSpan; i++) {
                                    width += colWidths[colIndex + i] || 100;
                                  }
                                }
                                const cellStyle = {
                                  border: '1px solid #444',
                                  padding: fullView ? '4px 10px' : '6px 16px',
                                  color: '#e0e6ed',
                                  background: isHighlighted
                                    ? 'rgba(255, 193, 7, 0.3)'
                                    : 'none',
                                  textAlign: 'left' as const,
                                  whiteSpace: 'nowrap' as const,
                                  overflow: 'hidden',
                                  textOverflow: 'ellipsis',
                                  fontFamily: 'monospace',
                                  fontSize: fullView ? '0.85rem' : '1rem',
                                  lineHeight: 1.2,
                                  verticalAlign: 'top' as const,
                                  wordBreak: 'keep-all' as const,
                                  display: 'inline-block',
                                  margin: '0',
                                  boxSizing: 'border-box' as const,
                                  position: 'relative' as const,
                                  width,
                                  minWidth: width,
                                  maxWidth: width,
                                  flex: `0 0 ${width}px`,
                                  borderRight:
                                    colIndex === row.length - 1
                                      ? 'none'
                                      : '1px solid #444',
                                  borderBottom: 'none',
                                  alignItems: 'flex-start',
                                  justifyContent: 'flex-start',
                                  minHeight: `${merge?.rowSpan ? merge.rowSpan * ROW_HEIGHT : ROW_HEIGHT}px`,
                                  height: merge?.rowSpan
                                    ? `${merge.rowSpan * ROW_HEIGHT}px`
                                    : 'auto',
                                };
                                return (
                                  <div
                                    key={colIndex}
                                    id={`cell-${actualRowIndex}-${colIndex}`}
                                    style={cellStyle}
                                    title={cellContent}
                                  >
                                    <span
                                      style={{
                                        width: '100%',
                                        whiteSpace: 'nowrap',
                                        overflow: 'hidden',
                                        textOverflow: 'ellipsis',
                                        display: 'block',
                                        padding: '2px 0',
                                        lineHeight: '1.2',
                                      }}
                                    >
                                      {cellContent}
                                    </span>
                                  </div>
                                );
                              })}
                            </div>
                          );
                        }
                      );
                    })()}
                  </div>
                </div>
              </Box>
            ) : (
              <Typography sx={{ color: '#b0b8c1', textAlign: 'center', py: 4 }}>
                미리보기 데이터를 불러오는 중...
              </Typography>
            )}
          </Box>
        </DialogContent>
      </Dialog>

      {/* === 시트 선택 다이얼로그 === */}
      <Dialog 
        open={sheetSelectionDialog} 
        onClose={() => setSheetSelectionDialog(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          업로드할 시트 선택
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            엑셀 파일에서 업로드할 시트를 선택하세요. 시트명이 자료명으로 사용됩니다.
          </Typography>
        </DialogTitle>
        <DialogContent>
          <Box sx={{ mb: 2, display: 'flex', gap: 1 }}>
            <Button size="small" onClick={handleSelectAll}>
              전체 선택
            </Button>
            <Button size="small" onClick={handleDeselectAll}>
              전체 해제
            </Button>
            <Chip 
              label={`${selectedSheets.length}/${availableSheets.length} 선택됨`}
              color="primary"
              variant="outlined"
            />
          </Box>
          
          <List sx={{ maxHeight: 400, overflow: 'auto' }}>
            {availableSheets.map((sheetName) => {
              const info = getSheetInfo(sheetName);
              const isSelected = selectedSheets.includes(sheetName);
              
              return (
                <ListItem key={sheetName} disablePadding>
                  <ListItemButton
                    selected={isSelected}
                    onClick={() => handleSheetToggle(sheetName)}
                    sx={{
                      border: '1px solid #ddd',
                      borderRadius: 1,
                      mb: 1,
                      '&.Mui-selected': {
                        backgroundColor: 'rgba(64, 196, 255, 0.1)',
                        borderColor: '#40c4ff',
                      }
                    }}
                  >
                    <ListItemText
                      primary={
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Typography variant="subtitle1" fontWeight="bold">
                            {sheetName}
                          </Typography>
                          <Chip 
                            label={`${info.rows}행 × ${info.cols}열`}
                            size="small"
                            variant="outlined"
                          />
                        </Box>
                      }
                      secondary={
                        <Typography variant="body2" color="text.secondary">
                          자료명: {sheetName}
                        </Typography>
                      }
                    />
                  </ListItemButton>
                </ListItem>
              );
            })}
          </List>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setSheetSelectionDialog(false)}>
            취소
          </Button>
          <Button 
            onClick={handleSheetUpload}
            disabled={selectedSheets.length === 0 || uploading}
            variant="contained"
            sx={{ backgroundColor: '#40c4ff' }}
          >
            {uploading ? '업로드 중...' : `${selectedSheets.length}개 시트 업로드`}
          </Button>
        </DialogActions>
      </Dialog>

      {/* === 파일 정보 수정 다이얼로그 === */}
      <Dialog 
        open={editDialog} 
        onClose={handleEditCancel}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          파일 정보 수정
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            파일명과 년도를 수정할 수 있습니다.
          </Typography>
        </DialogTitle>
        <DialogContent>
          <Box sx={{ mt: 2, display: 'flex', flexDirection: 'column', gap: 2 }}>
            <TextField
              label="파일명"
              value={editFileName}
              onChange={(e) => setEditFileName(e.target.value)}
              fullWidth
              size="small"
              sx={{
                '& .MuiOutlinedInput-root': {
                  color: '#e0e6ed',
                  backgroundColor: 'rgba(255,255,255,0.05)',
                  '& fieldset': { borderColor: 'rgba(255,255,255,0.2)' },
                },
                '& .MuiInputLabel-root': {
                  color: '#b0b8c1',
                },
              }}
            />
            
            <FormControl fullWidth size="small">
              <InputLabel sx={{ color: '#b0b8c1' }}>년도</InputLabel>
              <Select
                value={editYear}
                onChange={(e) => setEditYear(Number(e.target.value))}
                sx={{
                  color: '#e0e6ed',
                  backgroundColor: 'rgba(255,255,255,0.05)',
                  '& .MuiOutlinedInput-notchedOutline': {
                    borderColor: 'rgba(255,255,255,0.2)',
                  },
                }}
              >
                {years.map(year => (
                  <MenuItem key={year} value={year}>
                    {year}년
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            {editingRecord && (
              <Box sx={{ mt: 1, p: 2, backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 1 }}>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                  현재 정보:
                </Typography>
                <Typography variant="body2" color="#e0e6ed">
                  파일명: {editingRecord.originalName}
                </Typography>
                <Typography variant="body2" color="#e0e6ed">
                  년도: {editingRecord.year}년
                </Typography>
                <Typography variant="body2" color="#e0e6ed">
                  유형: {editingRecord.type === 'delivery' ? '납품관리' : '견적관리'}
                </Typography>
              </Box>
            )}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleEditCancel} sx={{ color: '#b0b8c1' }}>
            취소
          </Button>
          <Button 
            onClick={handleEditSave}
            disabled={!editFileName.trim()}
            variant="contained"
            sx={{ backgroundColor: '#40c4ff' }}
          >
            수정
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default HistoricalDataManagement;
