import React, { useState, useEffect, useMemo, useRef } from 'react';
import { API_BASE } from '../../utils/auth';
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
import { db } from '../../firebase/config';
import { collection, addDoc, serverTimestamp, query, collection as fsCollection, where, getDocs, orderBy } from 'firebase/firestore';

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

  // 준비된 파일 목록
  const [preparedFiles, setPreparedFiles] = useState<Array<{
    file: File;
    type: string;
    year: number;
    sheetName: string;
    description: string;
  }>>([]);

  // localStorage에 준비된 파일 정보 저장 (무한 루프 방지)
  useEffect(() => {
    const saveFiles = async () => {
      if (preparedFiles.length > 0) {
        try {
          // 메타데이터만 저장 (파일 크기가 클 수 있으므로)
          const fileInfo = preparedFiles.map(f => ({
            name: f.file.name,
            type: f.type,
            year: f.year,
            sheetName: f.sheetName,
            description: f.description,
            size: f.file.size,
            lastModified: f.file.lastModified
          }));
          localStorage.setItem('preparedFiles', JSON.stringify(fileInfo));
        } catch (error) {
          console.error('파일 저장 실패:', error);
        }
      } else {
        localStorage.removeItem('preparedFiles');
      }
    };
    
    // 디바운스로 저장 빈도 제한
    const timeoutId = setTimeout(saveFiles, 1000);
    return () => clearTimeout(timeoutId);
  }, [preparedFiles]);

  // 페이지 로드 시 저장된 파일 정보 확인 (실제 파일은 복원 불가)
  useEffect(() => {
    const saved = localStorage.getItem('preparedFiles');
    if (saved) {
      try {
        const files = JSON.parse(saved);
        if (files.length > 0) {
          alert(`이전에 준비된 ${files.length}개 파일이 있었습니다. 새로고침으로 인해 파일이 초기화되었습니다. 파일을 다시 업로드해주세요.`);
          localStorage.removeItem('preparedFiles');
        }
      } catch (error) {
        console.error('저장된 파일 정보 로드 실패:', error);
        localStorage.removeItem('preparedFiles');
      }
    }
  }, []);

  const years = Array.from(
    { length: 10 },
    (_, i) => new Date().getFullYear() - i
  );


  // 가상화 설정
  const ROW_HEIGHT = 32;
  const VISIBLE_ROWS = 30; // 화면에 보이는 행 수
  const BUFFER_ROWS = 5; // 버퍼 행 수

  useEffect(() => {
    loadRecords();
  }, [selectedType, selectedYear]);

  const loadRecords = async () => {
    try {
      // Firestore에서 직접 historical-data 쿼리 (임시로 정렬 제거)
      const q = query(
        fsCollection(db, 'historical-data'),
        where('type', '==', selectedType),
        where('year', '==', selectedYear)
        // orderBy('uploadDate', 'desc') // 인덱스 생성 완료 후 다시 활성화
      );
      
      // 🔄 인덱스 생성 완료 후 사용할 원래 쿼리:
      // const q = query(
      //   fsCollection(db, 'historical-data'),
      //   where('type', '==', selectedType),
      //   where('year', '==', selectedYear),
      //   orderBy('uploadDate', 'desc')
      // );
      
      const snapshot = await getDocs(q);
      const data = snapshot.docs.map(doc => {
        const d = doc.data();
        return {
          id: doc.id,
          type: d.type || 'delivery',
          year: d.year || 0,
          filename: d.filename || '',
          originalName: d.originalName || '',
          uploadDate: d.uploadDate ? (d.uploadDate.toDate ? d.uploadDate.toDate().toISOString() : d.uploadDate) : '',
          fileSize: d.fileSize || 0,
          previewData: d.previewData,
          merges: d.merges,
        };
      });
      
      // 클라이언트에서 정렬 (임시 해결책)
      data.sort((a, b) => {
        const dateA = new Date(a.uploadDate);
        const dateB = new Date(b.uploadDate);
        return dateB.getTime() - dateA.getTime(); // 최신순 정렬
      });
      
      // 🔄 인덱스 생성 완료 후 제거할 클라이언트 정렬 코드
      
      setRecords(data);
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
      // 1단계: 로컬에서 시트별 파일 생성
      const newPreparedFiles: Array<{
        file: File;
        type: string;
        year: number;
        sheetName: string;
        description: string;
      }> = [];
      
      for (const sheetName of selectedSheets) {
        try {
          const sheetDataArray = sheetData[sheetName];
          if (!sheetDataArray || sheetDataArray.length === 0) {
            console.warn(`시트 ${sheetName}의 데이터가 없습니다.`);
            continue;
          }

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
          
          // 준비된 파일 목록에 추가
          newPreparedFiles.push({
            file: sheetFile,
            type: selectedType,
            year: selectedYear,
            sheetName: sheetName,
            description: `${selectedFile.name} - ${sheetName}`
          });
          
        } catch (error) {
          console.error(`시트 ${sheetName} 처리 실패:`, error);
        }
      }
      
      // 2단계: 준비된 파일들을 기존 목록에 추가
      setPreparedFiles(prev => [...prev, ...newPreparedFiles]);
      
      // 3단계: 다이얼로그 닫기
      setSheetSelectionDialog(false);
      setSelectedFile(null);
      setAvailableSheets([]);
      setSelectedSheets([]);
      setSheetData({});
      
      alert(`${newPreparedFiles.length}개 파일이 준비되었습니다. 서버 업로드 버튼을 눌러 Firebase에 업로드하세요.`);
      
    } catch (error) {
      console.error('파일 준비 실패:', error);
      alert('파일 준비 중 오류가 발생했습니다.');
    } finally {
      setUploading(false);
    }
  };

  // 준비된 파일 미리보기
  const handlePreparedFilePreview = async (fileInfo: {
    file: File;
    type: string;
    year: number;
    sheetName: string;
    description: string;
  }) => {
    try {
      const arrayBuffer = await fileInfo.file.arrayBuffer();
      const workbook = XLSX.read(arrayBuffer, { type: 'array' });
      const worksheet = workbook.Sheets[fileInfo.sheetName];
      
      if (!worksheet) {
        alert('시트를 찾을 수 없습니다.');
        return;
      }

      // 빈 셀 포함하여 데이터 추출
      const range = XLSX.utils.decode_range(worksheet['!ref'] || 'A1');
      const data: string[][] = [];
      
      for (let row = range.s.r; row <= range.e.r; row++) {
        const rowData: string[] = [];
        for (let col = range.s.c; col <= range.e.c; col++) {
          const cellAddress = XLSX.utils.encode_cell({ r: row, c: col });
          const cell = worksheet[cellAddress];
          rowData.push(cell ? cell.v?.toString() || '' : '');
        }
        data.push(rowData);
      }

      // 미리보기용 레코드 생성
      const previewRecord: HistoricalRecord = {
        id: 'preview',
        type: fileInfo.type as 'delivery' | 'estimate',
        year: fileInfo.year,
        filename: fileInfo.file.name,
        originalName: fileInfo.file.name,
        uploadDate: new Date().toISOString(),
        fileSize: fileInfo.file.size,
        previewData: data,
        merges: worksheet['!merges'] || []
      };

      setSelectedRecord(previewRecord);
      setPreviewDialog(true);
      
    } catch (error) {
      console.error('미리보기 실패:', error);
      alert('미리보기를 불러올 수 없습니다.');
    }
  };

  // 서버 업로드 함수 (미리보기 데이터 방식)
  const handleServerUpload = async () => {
    if (preparedFiles.length === 0) return;

    setUploading(true);
    let successCount = 0;
    let errorCount = 0;

    try {
      const token = localStorage.getItem('token');
      
      // 개별 파일 업로드
      for (const fileInfo of preparedFiles) {
        try {
          console.log(`업로드 시작: ${fileInfo.file.name}`);
          
          // Excel 파일을 읽어서 미리보기 데이터 추출
          console.log('Excel 파일을 읽어서 미리보기 데이터 추출 중...');
          
          const arrayBuffer = await fileInfo.file.arrayBuffer();
          const workbook = XLSX.read(arrayBuffer, { type: 'array' });
          const worksheet = workbook.Sheets[fileInfo.sheetName];
          
          if (!worksheet) {
            throw new Error('시트를 찾을 수 없습니다.');
          }

          // 빈 셀 포함하여 데이터 추출 (미리보기와 동일한 방식)
          const range = XLSX.utils.decode_range(worksheet['!ref'] || 'A1');
          const data: string[][] = [];
          
          for (let row = range.s.r; row <= range.e.r; row++) {
            const rowData: string[] = [];
            for (let col = range.s.c; col <= range.e.c; col++) {
              const cellAddress = XLSX.utils.encode_cell({ r: row, c: col });
              const cell = worksheet[cellAddress];
              rowData.push(cell ? cell.v?.toString() || '' : '');
            }
            data.push(rowData);
          }

          console.log('미리보기 데이터 추출 완료, 행 수:', data.length);

          // 미리보기 데이터로 업로드
          const uploadData = {
            fileName: fileInfo.file.name,
            previewData: data,
            merges: worksheet['!merges'] || [],
            fileType: fileInfo.file.type,
            fileSize: fileInfo.file.size,
            type: fileInfo.type,
            year: fileInfo.year,
            sheetName: fileInfo.sheetName || 'Sheet1',
            description: fileInfo.description || ''
          };

          // 업로드 요청
          console.log('업로드 데이터:', {
            fileName: uploadData.fileName,
            fileSize: uploadData.fileSize,
            fileType: uploadData.fileType,
            type: uploadData.type,
            year: uploadData.year,
            sheetName: uploadData.sheetName,
            description: uploadData.description,
            dataRows: uploadData.previewData.length
          });

          const response = await fetch(`${API_BASE}/historicalDataUpload`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify(uploadData),
          });

          if (!response.ok) {
            const errorText = await response.text();
            console.error(`업로드 실패: ${errorText}`);
            throw new Error(errorText || `HTTP ${response.status}`);
          }

          const result = await response.json();
          console.log(`${fileInfo.file.name} 업로드 성공`);
          successCount++;
          
        } catch (error) {
          console.error(`${fileInfo.file.name} 업로드 실패:`, error);
          errorCount++;
        }
      }
      
      // 성공한 파일들 제거
      if (successCount > 0) {
        setPreparedFiles([]);
        loadRecords();
      }
      
      if (errorCount === 0) {
        alert(`${successCount}개 파일이 성공적으로 업로드되었습니다.`);
      } else {
        alert(`업로드 완료: ${successCount}개 성공, ${errorCount}개 실패`);
      }
      
    } catch (error) {
      console.error('서버 업로드 실패:', error);
      alert('서버 업로드 중 오류가 발생했습니다.');
    } finally {
      setUploading(false);
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
        `${API_BASE}/historicalDataSearch?type=${selectedType}&year=${searchYear}&keyword=${encodeURIComponent(searchKeyword)}`
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
        `${API_BASE}/historicalDataGlobalSearch?keyword=${encodeURIComponent(globalSearch)}`
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
        `${API_BASE}/historicalDataPreview?id=${record.id}`
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
      alert('미리보기를 불러올 수 없습니다.');
    }
  };

  const handleDelete = async (record: HistoricalRecord) => {
    if (!window.confirm('정말 삭제하시겠습니까?')) return;

    try {
      await fetch(`${API_BASE}/historicalDataDelete?id=${record.id}`, {
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

  // 숫자 포맷팅 함수 (순수 숫자만 포맷팅)
  const formatNumber = (content: string): string => {
    if (!content || content.trim() === '') return content;
    
    // 순수 숫자인지 확인 (소수점, 음수 부호 포함)
    const numericRegex = /^-?\d+(\.\d+)?$/;
    if (numericRegex.test(content.trim())) {
      const num = parseFloat(content);
      return num.toLocaleString();
    }
    
    return content;
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

              const response = await fetch(`${API_BASE}/historicalDataUpdate/${editingRecord.id}`, {
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

  // Storage 파일 미리보기/다운로드
  const handlePreviewFile = async (filename: string) => {
    try {
      // Firebase Functions를 통해 파일 URL 가져오기
      const response = await fetch(`${API_BASE}/historicalDataDownload?filename=${encodeURIComponent(filename)}`);
      if (!response.ok) {
        throw new Error('파일을 불러올 수 없습니다.');
      }
      const data = await response.json();
      window.open(data.downloadUrl, '_blank');
    } catch (e) {
      alert('파일을 불러올 수 없습니다.');
    }
  };

  return (
    <Box
      sx={{
        height: '100vh',
        display: 'flex',
        flexDirection: 'column',
        backgroundColor: 'var(--background-color)',
      }}
    >
      {/* 헤더 */}
      <Box
        sx={{
          p: 2,
          backgroundColor: 'var(--surface-color)',
          borderBottom: '1px solid var(--border-color)',
        }}
      >
        <Typography
          variant="h5"
          sx={{ color: 'var(--text-color)', fontWeight: 'bold', mb: 2 }}
        >
          📊 과거자료 관리
        </Typography>

        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} md={3}>
            <FormControl fullWidth size="small">
              <InputLabel id="type-label" sx={{ color: 'var(--text-secondary-color)' }}>
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
                  color: 'var(--text-color)',
                  backgroundColor: 'var(--background-color)',
                  '& .MuiOutlinedInput-notchedOutline': {
                    borderColor: 'var(--border-color)',
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
              <InputLabel id="year-label" sx={{ color: 'var(--text-secondary-color)' }}>
                년도
              </InputLabel>
              <Select
                labelId="year-label"
                id="year-select"
                name="year"
                value={selectedYear}
                onChange={e => setSelectedYear(Number(e.target.value))}
                sx={{
                  color: 'var(--text-color)',
                  backgroundColor: 'var(--background-color)',
                  '& .MuiOutlinedInput-notchedOutline': {
                    borderColor: 'var(--border-color)',
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
                color: 'var(--primary-color)',
                borderColor: 'var(--primary-color)',
                backgroundColor: 'var(--background-color)',
                '&:hover': {
                  borderColor: 'var(--hover-color)',
                  backgroundColor: 'var(--hover-color)',
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

          <Grid item xs={12} md={2}>
            <Chip
              label={`${records.length}개 파일`}
              color="primary"
              variant="outlined"
              sx={{ borderColor: 'var(--primary-color)', color: 'var(--primary-color)' }}
            />
          </Grid>

          <Grid item xs={12} md={2}>
            <Chip
              label={`${preparedFiles.length}개 준비됨`}
              color="secondary"
              variant="outlined"
              sx={{ borderColor: 'var(--secondary-color)', color: 'var(--secondary-color)' }}
            />
          </Grid>
        </Grid>
      </Box>

      {/* 준비된 파일 목록 */}
      {preparedFiles.length > 0 && (
        <Box
          sx={{
            p: 2,
            backgroundColor: 'var(--surface-color)',
            borderBottom: '1px solid var(--border-color)',
          }}
        >
          <Typography
            variant="h6"
            sx={{ color: 'var(--text-color)', fontWeight: 'bold', mb: 2 }}
          >
            📁 준비된 파일 목록 ({preparedFiles.length}개)
          </Typography>
          
          <Box sx={{ mb: 2 }}>
            <Button
              variant="contained"
              onClick={handleServerUpload}
              disabled={uploading}
              sx={{
                backgroundColor: 'var(--success-color)',
                '&:hover': { backgroundColor: 'var(--success-hover-color)' },
                mr: 2
              }}
            >
              {uploading ? '업로드 중...' : '서버에 업로드'}
            </Button>
            
            <Button
              variant="outlined"
              onClick={() => setPreparedFiles([])}
              disabled={uploading}
              sx={{
                color: 'var(--error-color)',
                borderColor: 'var(--error-color)',
                '&:hover': {
                  borderColor: 'var(--error-hover-color)',
                  backgroundColor: 'var(--error-hover-color)',
                }
              }}
            >
              전체 삭제
            </Button>
          </Box>

          <Grid container spacing={2}>
            {preparedFiles.map((fileInfo, index) => (
              <Grid item xs={12} md={6} lg={4} key={index}>
                <Box
                  sx={{
                    p: 2,
                    border: '1px solid var(--border-color)',
                    borderRadius: 1,
                    backgroundColor: 'var(--background-color)',
                  }}
                >
                  <Typography
                    variant="subtitle2"
                    sx={{ color: 'var(--text-color)', fontWeight: 'bold', mb: 1 }}
                  >
                    {fileInfo.file.name}
                  </Typography>
                  
                  <Typography variant="body2" sx={{ color: 'var(--text-secondary-color)', mb: 1 }}>
                    유형: {fileInfo.type === 'delivery' ? '납품관리' : '견적관리'}
                  </Typography>
                  
                  <Typography variant="body2" sx={{ color: 'var(--text-secondary-color)', mb: 1 }}>
                    년도: {fileInfo.year}년
                  </Typography>
                  
                  <Typography variant="body2" sx={{ color: 'var(--text-secondary-color)', mb: 1 }}>
                    시트명: {fileInfo.sheetName}
                  </Typography>
                  
                  <Typography variant="body2" sx={{ color: 'var(--text-secondary-color)', mb: 1 }}>
                    크기: {(fileInfo.file.size / 1024).toFixed(1)} KB
                  </Typography>
                  
                  <Box sx={{ display: 'flex', gap: 1 }}>
                    <Button
                      size="small"
                      onClick={() => handlePreparedFilePreview(fileInfo)}
                      sx={{ 
                        color: 'var(--primary-color)',
                        borderColor: 'var(--primary-color)',
                        '&:hover': {
                          borderColor: 'var(--hover-color)',
                          backgroundColor: 'var(--hover-color)',
                        }
                      }}
                      variant="outlined"
                    >
                      미리보기
                    </Button>
                    
                    <Button
                      size="small"
                      onClick={() => {
                        setPreparedFiles(prev => prev.filter((_, i) => i !== index));
                      }}
                      sx={{ color: 'var(--error-color)' }}
                    >
                      삭제
                    </Button>
                  </Box>
                </Box>
              </Grid>
            ))}
          </Grid>
        </Box>
      )}

      {/* 검색 영역 */}
      <Box
        sx={{
          p: 2,
          backgroundColor: 'var(--surface-color)',
          borderBottom: '1px solid var(--border-color)',
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
                    color: 'var(--text-color)',
                    backgroundColor: 'var(--background-color)',
                    '& .MuiOutlinedInput-notchedOutline': {
                      borderColor: 'var(--border-color)',
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
                    color: 'var(--text-color)',
                    backgroundColor: 'var(--background-color)',
                    '& fieldset': { borderColor: 'var(--border-color)' },
                  },
                }}
              />
              <Button
                variant="contained"
                size="small"
                onClick={handleYearSearch}
                sx={{ backgroundColor: 'var(--primary-color)' }}
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
                sx={{ backgroundColor: 'var(--primary-color)' }}
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
              sx={{ color: 'var(--text-secondary-color)', borderColor: 'var(--border-color)' }}
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
          sx={{ backgroundColor: 'var(--background-color)', borderRadius: 2 }}
        >
          <Table>
            <TableHead>
              <TableRow sx={{ backgroundColor: 'var(--surface-color)' }}>
                <TableCell sx={{ color: 'var(--text-color)', fontWeight: 'bold' }}>
                  파일명
                </TableCell>
                <TableCell sx={{ color: 'var(--text-color)', fontWeight: 'bold' }}>
                  유형
                </TableCell>
                <TableCell sx={{ color: 'var(--text-color)', fontWeight: 'bold' }}>
                  년도
                </TableCell>
                <TableCell sx={{ color: 'var(--text-color)', fontWeight: 'bold' }}>
                  크기
                </TableCell>
                <TableCell sx={{ color: 'var(--text-color)', fontWeight: 'bold' }}>
                  업로드일
                </TableCell>
                <TableCell sx={{ color: 'var(--text-color)', fontWeight: 'bold' }}>
                  작업
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {records.map(record => (
                <TableRow
                  key={record.id}
                  sx={{
                    '&:hover': { backgroundColor: 'var(--hover-color)' },
                  }}
                >
                  <TableCell sx={{ color: 'var(--text-color)' }}>
                    <Button onClick={() => handlePreviewFile(record.filename)} size="small" color="info" variant="outlined">
                      {record.originalName}
                    </Button>
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
                  <TableCell sx={{ color: 'var(--text-color)' }}>
                    {record.year}년
                  </TableCell>
                  <TableCell sx={{ color: 'var(--text-color)' }}>
                    {(record.fileSize / 1024).toFixed(1)} KB
                  </TableCell>
                  <TableCell sx={{ color: 'var(--text-color)' }}>
                    {new Date(record.uploadDate).toLocaleDateString()}
                  </TableCell>
                  <TableCell>
                    <Box sx={{ display: 'flex', gap: 1 }}>
                      <IconButton
                        size="small"
                        onClick={() => handlePreview(record)}
                        sx={{ color: 'var(--primary-color)' }}
                        title="미리보기"
                      >
                        <ViewIcon />
                      </IconButton>
                      <IconButton
                        size="small"
                        onClick={() => handleEdit(record)}
                        sx={{ color: 'var(--primary-color)' }}
                        title="수정"
                      >
                        <EditIcon />
                      </IconButton>
                      <IconButton
                        size="small"
                        onClick={() => handleDelete(record)}
                        sx={{ color: 'var(--primary-color)' }}
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
          <Box sx={{ textAlign: 'center', py: 8, color: 'var(--text-secondary-color)' }}>
            <Typography variant="h6" sx={{ color: 'var(--text-color)' }}>파일이 없습니다</Typography>
            <Typography variant="body2" sx={{ color: 'var(--text-secondary-color)' }}>엑셀 파일을 업로드해주세요</Typography>
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
              overflowX: 'scroll', // 항상 가로 스크롤 표시
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
                                const cellContent = formatNumber(cell || '');
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
