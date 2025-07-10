import React, { useState, useEffect, useRef } from 'react';
import {
  Box,
  Typography,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  IconButton,
  Chip,
  Paper,
  Input,
  Alert,
  Snackbar,
  TableContainer,
  FormControl,
  Select,
  MenuItem,
} from '@mui/material';
import {
  Search as SearchIcon,
  Delete as DeleteIcon,
  Visibility as ViewIcon,
  NavigateNext as NextIcon,
  NavigateBefore as PrevIcon,
  Close as CloseIcon,
  ArrowBack as ArrowBackIcon,
} from '@mui/icons-material';

const API_BASE = process.env.REACT_APP_API_BASE || 'http://localhost:4000';

interface HistoricalDocument {
  id: number;
  filename: string;
  originalName: string;
  fileSize: number;
  uploadDate: string;
}

interface SearchResult {
  id: number;
  filename: string;
  totalMatches: number;
  highlights: Array<{
    sheet: string;
    cell: string;
    value: string;
  }>;
  sheets: string[];
}

interface DocumentData {
  id: number;
  filename: string;
  fileSize: number;
  uploadDate: string;
  data: Array<{
    sheet: string;
    cell: string;
    value: string;
  }>;
  merges?: {
    [sheetName: string]: Array<{
      s: { r: number; c: number };
      e: { r: number; c: number };
    }>;
  };
  sheets: string[];
}

interface HistoricalDocumentsProps {
  open?: boolean;
  onClose?: () => void;
}

export default function HistoricalDocuments({
  open,
  onClose,
}: HistoricalDocumentsProps) {
  const [documents, setDocuments] = useState<HistoricalDocument[]>([]);
  const [searchKeyword, setSearchKeyword] = useState('');
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [selectedDocument, setSelectedDocument] = useState<DocumentData | null>(
    null
  );
  const [currentSheet, setCurrentSheet] = useState('');
  const [currentMatchIndex, setCurrentMatchIndex] = useState(0);
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [viewMode, setViewMode] = useState<'list' | 'document'>('list');
  const [loading, setLoading] = useState(false);
  const [snackbar, setSnackbar] = useState<{
    open: boolean;
    message: string;
    severity: 'success' | 'error';
  }>({ open: false, message: '', severity: 'success' });

  const [documentSearchKeyword, setDocumentSearchKeyword] = useState('');
  const [documentSearchResults, setDocumentSearchResults] = useState<
    { r: number; c: number }[]
  >([]);
  const [currentSearchResultIndex, setCurrentSearchResultIndex] = useState(-1);
  const tableContainerRef = useRef<HTMLDivElement>(null);

  // 문서 목록 로드
  const loadDocuments = async () => {
    try {
      const response = await fetch(`${API_BASE}/historical-documents`);
      if (!response.ok) throw new Error('문서 목록 로드 실패');
      const data = await response.json();
      setDocuments(data);
    } catch (error) {
      console.error('문서 목록 로드 오류:', error);
      setSnackbar({
        open: true,
        message: '문서 목록 로드에 실패했습니다.',
        severity: 'error',
      });
    }
  };

  useEffect(() => {
    if (open) {
      loadDocuments();
    } else {
      // 다이얼로그 닫힐 때 상태 초기화
      setViewMode('list');
      setSelectedDocument(null);
      setSearchKeyword('');
      setSearchResults([]);
    }
  }, [open]);

  useEffect(() => {
    // Reset search when document or sheet changes
    setDocumentSearchKeyword('');
    setDocumentSearchResults([]);
    setCurrentSearchResultIndex(-1);
  }, [selectedDocument, currentSheet]);

  // 파일 업로드
  const handleFileUpload = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    // ... 업로드 기능 전체 삭제 ...
  };

  // 검색
  const handleSearch = async () => {
    if (!searchKeyword.trim()) return;

    try {
      const response = await fetch(
        `${API_BASE}/historical-documents/search?keyword=${encodeURIComponent(searchKeyword)}`
      );
      if (!response.ok) throw new Error('검색 실패');
      const data = await response.json();
      setSearchResults(data.results);
    } catch (error) {
      console.error('검색 오류:', error);
      setSnackbar({
        open: true,
        message: '검색에 실패했습니다.',
        severity: 'error',
      });
    }
  };

  // 문서 상세 조회
  const handleViewDocument = async (id: number) => {
    try {
      const response = await fetch(`${API_BASE}/historical-documents/${id}`);
      if (!response.ok) throw new Error('문서 조회 실패');
      const data = await response.json();
      setSelectedDocument(data);
      setCurrentSheet(data.sheets[0] || '');
      setViewMode('document');
    } catch (error) {
      console.error('문서 조회 오류:', error);
      setSnackbar({
        open: true,
        message: '문서 조회에 실패했습니다.',
        severity: 'error',
      });
    }
  };

  // 문서 삭제
  const handleDeleteDocument = async (id: number) => {
    if (!window.confirm('정말 삭제하시겠습니까?')) return;

    try {
      const response = await fetch(`${API_BASE}/historical-documents/${id}`, {
        method: 'DELETE',
      });
      if (!response.ok) throw new Error('삭제 실패');

      setSnackbar({
        open: true,
        message: '문서가 삭제되었습니다.',
        severity: 'success',
      });
      loadDocuments();
    } catch (error) {
      console.error('삭제 오류:', error);
      setSnackbar({
        open: true,
        message: '삭제에 실패했습니다.',
        severity: 'error',
      });
    }
  };

  // 다음/이전 매치로 이동
  const navigateMatch = (direction: 'next' | 'prev') => {
    if (searchResults.length === 0) return;

    const currentResult = searchResults[0]; // 첫 번째 결과만 사용
    const totalMatches = currentResult.totalMatches;

    if (direction === 'next') {
      setCurrentMatchIndex(prev => (prev + 1) % totalMatches);
    } else {
      setCurrentMatchIndex(prev => (prev - 1 + totalMatches) % totalMatches);
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const encodeCol = (colIndex: number): string => {
    let res = '';
    let n = colIndex + 1;
    while (n > 0) {
      const rem = (n - 1) % 26;
      res = String.fromCharCode(65 + rem) + res;
      n = Math.floor((n - 1) / 26);
    }
    return res;
  };

  const decodeCell = (cellAddress: string): { r: number; c: number } => {
    const match = cellAddress.match(/^([A-Z]+)(\d+)$/);
    if (!match) return { r: 0, c: 0 };

    const colStr = match[1];
    const rowStr = match[2];

    let col = 0;
    for (let i = 0; i < colStr.length; i++) {
      col = col * 26 + (colStr.charCodeAt(i) - 65 + 1);
    }
    col -= 1; // 0-indexed

    const row = parseInt(rowStr, 10) - 1; // 0-indexed

    return { r: row, c: col };
  };

  const renderListView = () => (
    <Box sx={{ p: 2, minWidth: 900, minHeight: 600 }}>
      <Typography variant="h6" gutterBottom sx={{ mb: 2 }}>
        과거자료 관리
      </Typography>

      {/* 업로드 및 검색 영역 */}
      <Box sx={{ display: 'flex', gap: 2, mb: 2, alignItems: 'center' }}>
        <TextField
          placeholder="검색어를 입력하세요..."
          value={searchKeyword}
          onChange={e => setSearchKeyword(e.target.value)}
          onKeyPress={e => e.key === 'Enter' && handleSearch()}
          size="small"
          sx={{ flex: 1 }}
        />
        <Button
          variant="outlined"
          startIcon={<SearchIcon />}
          onClick={handleSearch}
        >
          검색
        </Button>
      </Box>

      {/* 검색 결과 */}
      {searchResults.length > 0 && (
        <Paper sx={{ p: 2, mb: 2 }}>
          <Typography variant="subtitle1" sx={{ mb: 1 }}>
            검색 결과: "{searchKeyword}" ({searchResults.length}개 문서)
          </Typography>
          {searchResults.map(result => (
            <Box
              key={result.id}
              sx={{
                mb: 1,
                p: 1,
                border: '1px solid rgba(0,0,0,0.1)',
                borderRadius: 1,
              }}
            >
              <Typography variant="body2">
                {result.filename} - {result.totalMatches}개 매치
              </Typography>
              <Box sx={{ display: 'flex', gap: 1, mt: 1 }}>
                <Button
                  size="small"
                  variant="outlined"
                  onClick={() => handleViewDocument(result.id)}
                  sx={{ fontSize: '0.7rem' }}
                >
                  보기
                </Button>
              </Box>
            </Box>
          ))}
        </Paper>
      )}

      {/* 문서 목록 */}
      <TableContainer component={Paper}>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>파일명</TableCell>
              <TableCell>크기</TableCell>
              <TableCell>업로드일</TableCell>
              <TableCell>관리</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {documents.map(doc => (
              <TableRow key={doc.id}>
                <TableCell>{doc.originalName}</TableCell>
                <TableCell>{formatFileSize(doc.fileSize)}</TableCell>
                <TableCell>
                  {new Date(doc.uploadDate).toLocaleDateString()}
                </TableCell>
                <TableCell>
                  <IconButton
                    size="small"
                    onClick={() => handleViewDocument(doc.id)}
                  >
                    <ViewIcon fontSize="small" />
                  </IconButton>
                  <IconButton
                    size="small"
                    onClick={() => handleDeleteDocument(doc.id)}
                  >
                    <DeleteIcon fontSize="small" />
                  </IconButton>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );

  const renderDocumentView = () => {
    if (!selectedDocument) return null;

    const dataForSheet = selectedDocument.data.filter(
      cell => cell.sheet === currentSheet
    );

    if (dataForSheet.length === 0) {
      return (
        <Box
          sx={{
            display: 'flex',
            flexDirection: 'column',
            height: 'calc(90vh - 64px)',
          }}
        >
          <DialogTitle
            sx={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              p: 2,
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <IconButton onClick={() => setViewMode('list')}>
                <ArrowBackIcon />
              </IconButton>
              <Typography variant="h6">{selectedDocument.filename}</Typography>
            </Box>
          </DialogTitle>
          <DialogContent>
            <Typography>현재 시트에 표시할 데이터가 없습니다.</Typography>
          </DialogContent>
        </Box>
      );
    }

    const cellMap = new Map<string, string>();
    const rowsWithData = new Set<number>();
    const colsWithData = new Set<number>();

    dataForSheet.forEach(cell => {
      const { r, c } = decodeCell(cell.cell);
      rowsWithData.add(r);
      colsWithData.add(c);
      cellMap.set(`${r},${c}`, cell.value);
    });

    const sortedRows = Array.from(rowsWithData)
      .sort((a, b) => a - b)
      .slice(0, 500);
    const sortedCols = Array.from(colsWithData)
      .sort((a, b) => a - b)
      .slice(0, 100);

    const sheetMerges = selectedDocument.merges?.[currentSheet] || [];
    const mergeInfo = new Map<string, { colspan: number; rowspan: number }>();
    const mergedCellsToSkip = new Set<string>();

    sheetMerges.forEach(merge => {
      const { s, e } = merge;
      mergeInfo.set(`${s.r},${s.c}`, {
        colspan: e.c - s.c + 1,
        rowspan: e.r - s.r + 1,
      });
      for (let r = s.r; r <= e.r; r++) {
        for (let c = s.c; c <= e.c; c++) {
          if (r === s.r && c === s.c) continue;
          mergedCellsToSkip.add(`${r},${c}`);
        }
      }
    });

    const grid = sortedRows.map(r =>
      sortedCols.map(c => cellMap.get(`${r},${c}`) || '')
    );

    const cellStyle = {
      padding: '4px 8px',
      fontSize: '0.8rem',
      verticalAlign: 'top',
      whiteSpace: 'nowrap',
      overflow: 'hidden',
      textOverflow: 'ellipsis',
      maxWidth: '200px',
    };

    const headerCellStyle = {
      ...cellStyle,
      backgroundColor: '#fafafa',
      fontWeight: 'bold',
      position: 'sticky',
      top: 0,
      zIndex: 2,
      borderBottom: '1px solid #e0e0e0',
    };

    const rowHeaderStyle = {
      ...cellStyle,
      position: 'sticky',
      left: 0,
      backgroundColor: '#fafafa',
      fontWeight: 'bold',
      zIndex: 1,
      borderRight: '1px solid #e0e0e0',
    };

    const scrollToSearchResult = (
      index: number,
      results: { r: number; c: number }[]
    ) => {
      const result = results[index];
      if (!result || !tableContainerRef.current) return;

      const cellId = `cell-${result.r}-${result.c}`;
      const cellElement = tableContainerRef.current.querySelector(`#${cellId}`);

      if (cellElement) {
        cellElement.scrollIntoView({
          behavior: 'smooth',
          block: 'center',
          inline: 'center',
        });
      }
    };

    const handleDocumentSearch = () => {
      if (!selectedDocument || !documentSearchKeyword) {
        setDocumentSearchResults([]);
        setCurrentSearchResultIndex(-1);
        return;
      }

      const dataForSheet = selectedDocument.data.filter(
        cell => cell.sheet === currentSheet
      );
      const results: { r: number; c: number }[] = [];

      dataForSheet.forEach(cell => {
        if (
          String(cell.value)
            .toLowerCase()
            .includes(documentSearchKeyword.toLowerCase())
        ) {
          const { r, c } = decodeCell(cell.cell);
          results.push({ r, c });
        }
      });

      setDocumentSearchResults(results);

      if (results.length > 0) {
        setCurrentSearchResultIndex(0);
        scrollToSearchResult(0, results);
      } else {
        setCurrentSearchResultIndex(-1);
        setSnackbar({
          open: true,
          message: '시트 내에서 검색 결과를 찾을 수 없습니다.',
          severity: 'error',
        });
      }
    };

    const navigateDocumentSearchResult = (direction: 'next' | 'prev') => {
      if (documentSearchResults.length === 0) return;

      const nextIndex =
        direction === 'next'
          ? (currentSearchResultIndex + 1) % documentSearchResults.length
          : (currentSearchResultIndex - 1 + documentSearchResults.length) %
            documentSearchResults.length;

      setCurrentSearchResultIndex(nextIndex);
      scrollToSearchResult(nextIndex, documentSearchResults);
    };

    return (
      <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
        <DialogTitle
          sx={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            p: 2,
            borderBottom: '1px solid #ddd',
            flexShrink: 0,
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <IconButton onClick={() => setViewMode('list')}>
              <ArrowBackIcon />
            </IconButton>
            <Typography variant="h6" noWrap>
              {selectedDocument.filename}
            </Typography>
          </Box>
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              gap: 1,
              flexGrow: 1,
              ml: 2,
              maxWidth: 600,
            }}
          >
            <TextField
              placeholder="시트 내에서 검색..."
              size="small"
              variant="outlined"
              value={documentSearchKeyword}
              onChange={e => setDocumentSearchKeyword(e.target.value)}
              onKeyPress={e => e.key === 'Enter' && handleDocumentSearch()}
              sx={{
                flex: 1,
                '& .MuiOutlinedInput-root': {
                  borderRadius: '20px',
                  backgroundColor: 'rgba(0,0,0,0.05)',
                  '& fieldset': { border: 'none' },
                },
              }}
            />
            <IconButton onClick={handleDocumentSearch} size="small">
              <SearchIcon />
            </IconButton>
            {documentSearchResults.length > 0 && (
              <>
                <IconButton
                  onClick={() => navigateDocumentSearchResult('prev')}
                  size="small"
                >
                  <PrevIcon />
                </IconButton>
                <Typography
                  variant="body2"
                  sx={{ color: 'text.secondary', whiteSpace: 'nowrap' }}
                >
                  {currentSearchResultIndex + 1} /{' '}
                  {documentSearchResults.length}
                </Typography>
                <IconButton
                  onClick={() => navigateDocumentSearchResult('next')}
                  size="small"
                >
                  <NextIcon />
                </IconButton>
              </>
            )}
          </Box>
          <FormControl size="small" sx={{ minWidth: 200, ml: 1 }}>
            <Select
              value={currentSheet}
              onChange={e => setCurrentSheet(e.target.value)}
            >
              {selectedDocument.sheets.map(sheetName => (
                <MenuItem key={sheetName} value={sheetName}>
                  {sheetName}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </DialogTitle>
        <DialogContent sx={{ p: 0, flex: 1, overflow: 'hidden' }}>
          <TableContainer
            ref={tableContainerRef}
            sx={{ height: '100%', overflow: 'auto' }}
          >
            <Table
              stickyHeader
              size="small"
              sx={{ tableLayout: 'auto', borderCollapse: 'collapse' }}
            >
              <TableHead>
                <TableRow>
                  <TableCell
                    sx={{
                      ...headerCellStyle,
                      left: 0,
                      zIndex: 3,
                      borderRight: '1px solid #e0e0e0',
                      borderBottom: '1px solid #e0e0e0',
                    }}
                  >
                    #
                  </TableCell>
                  {sortedCols.map(colIdx => (
                    <TableCell
                      key={colIdx}
                      sx={{
                        ...headerCellStyle,
                        borderBottom: '1px solid #e0e0e0',
                      }}
                    >
                      {encodeCol(colIdx)}
                    </TableCell>
                  ))}
                </TableRow>
              </TableHead>
              <TableBody>
                {grid.map((row, rowIdx) => (
                  <TableRow key={sortedRows[rowIdx]}>
                    <TableCell
                      sx={{
                        ...rowHeaderStyle,
                        borderRight: '1px solid #e0e0e0',
                      }}
                    >
                      {sortedRows[rowIdx] + 1}
                    </TableCell>
                    {row.map((cell, colIdx) => {
                      const r = sortedRows[rowIdx];
                      const c = sortedCols[colIdx];

                      const isSearchResult =
                        currentSearchResultIndex > -1 &&
                        documentSearchResults[currentSearchResultIndex]?.r ===
                          r &&
                        documentSearchResults[currentSearchResultIndex]?.c ===
                          c;

                      const span = mergeInfo.get(`${r},${c}`);
                      const currentCellStyle: any = { ...cellStyle };

                      if (isSearchResult) {
                        currentCellStyle.boxShadow = '0 0 0 2px #0d6efd inset';
                        currentCellStyle.borderRadius = '2px';
                      }

                      if (span) {
                        currentCellStyle.whiteSpace = 'normal';
                        currentCellStyle.wordBreak = 'break-word';
                        delete currentCellStyle.maxWidth;
                        delete currentCellStyle.overflow;
                        delete currentCellStyle.textOverflow;
                      }

                      return (
                        <TableCell
                          id={`cell-${r}-${c}`}
                          key={c}
                          colSpan={span?.colspan}
                          rowSpan={span?.rowspan}
                          sx={currentCellStyle}
                          title={cell}
                        >
                          {cell}
                        </TableCell>
                      );
                    })}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </DialogContent>
      </Box>
    );
  };

  const content = (
    <>
      {viewMode === 'list' ? renderListView() : renderDocumentView()}

      {/* 스낵바 */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={3000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
      >
        <Alert
          severity={snackbar.severity}
          onClose={() => setSnackbar({ ...snackbar, open: false })}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </>
  );

  if (typeof open === 'boolean') {
    return (
      <Dialog
        open={open}
        onClose={onClose}
        maxWidth="xl"
        fullWidth
        PaperProps={{ sx: { height: '90vh' } }}
      >
        {content}
      </Dialog>
    );
  }
  return content;
}
