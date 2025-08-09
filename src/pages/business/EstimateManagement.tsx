import React, { useState, ChangeEvent, useEffect, useContext, useMemo, useCallback, useRef } from 'react';
import useMediaQuery from '@mui/material/useMediaQuery';
import {
  Grid,
  Paper,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Button,
  TextField,
  Box,
  Tabs,
  Tab,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Checkbox,
  FormControlLabel,
  Menu,
  ButtonGroup,
  Tooltip,
  Chip,
  Snackbar,
  List,
  ListItem,
  ListItemText,
  Stepper,
  Step,
  StepLabel,
  FormGroup,
  Card,
  CardContent,
  Divider,
  Collapse,
} from '@mui/material';
import type { SelectChangeEvent } from '@mui/material/Select';
import {
  Add as AddIcon,
  Delete as DeleteIcon,
  ContentCopy as ContentCopyIcon,
  Print as PrintIcon,
  PictureAsPdf as PictureAsPdfIcon,
  Image as ImageIcon,
  TableChart as ExcelIcon,
  Share as ShareIcon,
  KeyboardArrowDown as ArrowDownIcon,
  Save as SaveIcon,
  Edit as EditIcon,
  KeyboardArrowUp as ArrowUpIcon,
  RestartAlt as ResetIcon,
  Search as SearchIcon,
  Close as CloseIcon,
  ArrowBack as ArrowBackIcon,
  PushPin as PushPinIcon,
  PushPinOutlined as PushPinOutlinedIcon,
  Settings as SettingsIcon,
  Description as DescriptionIcon,
  Assignment as AssignmentIcon,
  Chat as ChatIcon,
  FolderOpen as FolderOpenIcon,
  AttachMoney as AttachMoneyIcon,
  Build as BuildIcon,
  FilterList as FilterListIcon,
  EditNote as EditNoteIcon,
  SaveAlt as SaveAltIcon,
  ExpandLess as ExpandLessIcon,
  ExpandMore as ExpandMoreIcon,
} from '@mui/icons-material';
import { create } from 'zustand';
import { evaluate } from 'mathjs';
import Slide from '@mui/material/Slide';
import EstimateTemplate from '../../components/EstimateTemplate';
import Autocomplete from '@mui/material/Autocomplete';
import TemplateManager from '../../components/TemplateManager';
import { templateRoomToEstimateRow } from '../../utils/templateUtils';
import { EstimateTemplate as EstimateTemplateType, Estimate, EstimateRow, OptionItem, Installer, ASRequest, PaymentRecord } from '../../types';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';
import ContractCreateModal from '../../components/ContractCreateModal';
import ContractTemplate from '../../components/ContractTemplate';
import { findLastIndex } from 'lodash';
import { useNavigate } from 'react-router-dom';
import { useNotificationStore } from '../../utils/notificationStore';
import { UserContext } from '../../components/Layout';
import { estimateService, customerService, optionService } from '../../utils/firebaseDataService';
import { ensureFirebaseAuth, API_BASE } from '../../utils/auth';
import { createKeyboardNavigationHandler, getNextFieldIndex, focusField } from '../../utils/keyboardNavigation';

// 인쇄용 CSS 스타일
const printStyles = `
  @media print {
    body * {
      visibility: hidden;
    }
    .estimate-template, .estimate-template * {
      visibility: visible;
    }
    .estimate-template {
      position: absolute;
      left: 0;
      top: 0;
      width: 100%;
      height: 100%;
    }
    .no-print {
      display: none !important;
    }
    
    /* 발주서 프린트 스타일 */
    .purchase-order-a4-container {
      visibility: visible !important;
      position: relative !important;
      left: auto !important;
      top: auto !important;
      width: 100% !important;
      height: auto !important;
      margin: 0 !important;
      padding: 3mm !important;
      box-shadow: none !important;
      border-radius: 0 !important;
      page-break-after: always;
    }

    /* 모든 버튼과 UI 요소 완전 숨기기 */
    .MuiDialogActions-root,
    .MuiDialogTitle-root .MuiBox-root,
    .MuiDialogTitle-root button,
    .no-print,
    .MuiDialogTitle-root,
    .MuiDialogActions-root *,
    .MuiDialogTitle-root *,
    .MuiDialogTitle-root .MuiTypography-root,
    .MuiDialogTitle-root .MuiBox-root *,
    .MuiDialogActions-root .MuiButton-root,
    .MuiDialogActions-root .MuiIconButton-root,
    /* 추가 강화 규칙 */
    .MuiDialogTitle-root,
    .MuiDialogActions-root,
    .MuiDialogTitle-root > *,
    .MuiDialogActions-root > *,
    .MuiDialogTitle-root .MuiBox-root,
    .MuiDialogTitle-root .MuiBox-root > *,
    .MuiDialogActions-root .MuiBox-root,
    .MuiDialogActions-root .MuiBox-root > *,
    /* 모든 버튼 요소 */
    button,
    .MuiButton-root,
    .MuiIconButton-root,
    /* 모든 아이콘 */
    .MuiSvgIcon-root,
    /* 모든 툴팁 */
    .MuiTooltip-root,
    /* 모든 메뉴 */
    .MuiMenu-root {
      display: none !important;
      visibility: hidden !important;
      opacity: 0 !important;
      position: absolute !important;
      left: -9999px !important;
      top: -9999px !important;
      width: 0 !important;
      height: 0 !important;
      overflow: hidden !important;
      clip: rect(0, 0, 0, 0) !important;
      margin: 0 !important;
      padding: 0 !important;
      border: 0 !important;
    }

    /* 모달 배경 완전 제거 */
    .MuiDialog-root .MuiBackdrop-root {
      display: none !important;
      visibility: hidden !important;
    }

    /* 모달 컨테이너 스타일 */
    .MuiDialog-root .MuiDialog-container {
      background: white !important;
      box-shadow: none !important;
      padding: 0 !important;
      margin: 0 !important;
    }

    /* 모달 콘텐츠 영역 */
    .MuiDialog-root .MuiDialogContent-root {
      padding: 0 !important;
      margin: 0 !important;
      overflow: visible !important;
    }

    /* A4 페이지 설정 - 여백 최소화 */
    @page {
      size: A4;
      margin: 2mm;
    }

    /* 폰트 최적화 */
    * {
      -webkit-print-color-adjust: exact !important;
      color-adjust: exact !important;
    }

    /* 페이지 나누기 최적화 */
    .purchase-order-a4-container > * {
      page-break-inside: avoid;
    }

    /* 테이블 페이지 나누기 */
    .MuiTableContainer-root {
      page-break-inside: auto;
    }

    .MuiTableRow-root {
      page-break-inside: avoid;
      page-break-after: auto;
    }

    /* 헤더 영역 최적화 */
    .purchase-order-a4-container > div:first-child {
      margin-bottom: 2mm !important;
      padding-bottom: 1mm !important;
    }

    /* 발주서 컨테이너 내부의 버튼들만 제외하고 모든 UI 요소 숨기기 */
    .purchase-order-a4-container button,
    .purchase-order-a4-container .MuiButton-root,
    .purchase-order-a4-container .MuiIconButton-root,
    .purchase-order-a4-container .MuiSvgIcon-root {
      display: none !important;
      visibility: hidden !important;
      opacity: 0 !important;
    }

    /* 모달 전체에서 발주서 컨테이너만 보이도록 */
    .MuiDialog-root .MuiDialogContent-root > *:not(.purchase-order-a4-container) {
      display: none !important;
      visibility: hidden !important;
    }

    /* 모달 외부 요소들 완전 숨기기 */
    .MuiDialog-root .MuiDialogTitle-root,
    .MuiDialog-root .MuiDialogActions-root,
    .MuiDialog-root .MuiBackdrop-root {
      display: none !important;
      visibility: hidden !important;
      opacity: 0 !important;
    }

    /* no-print 클래스 강화 */
    .no-print,
    .no-print *,
    .no-print > * {
      display: none !important;
      visibility: hidden !important;
      opacity: 0 !important;
      position: absolute !important;
      left: -9999px !important;
      top: -9999px !important;
      width: 0 !important;
      height: 0 !important;
      overflow: hidden !important;
      clip: rect(0, 0, 0, 0) !important;
      margin: 0 !important;
      padding: 0 !important;
      border: 0 !important;
      pointer-events: none !important;
    }

    /* 모든 버튼과 인터랙티브 요소 완전 제거 */
    button:not(.purchase-order-a4-container button),
    .MuiButton-root:not(.purchase-order-a4-container .MuiButton-root),
    .MuiIconButton-root:not(.purchase-order-a4-container .MuiIconButton-root),
    .MuiSvgIcon-root:not(.purchase-order-a4-container .MuiSvgIcon-root) {
      display: none !important;
      visibility: hidden !important;
      opacity: 0 !important;
      position: absolute !important;
      left: -9999px !important;
      top: -9999px !important;
      width: 0 !important;
      height: 0 !important;
      overflow: hidden !important;
      clip: rect(0, 0, 0, 0) !important;
      margin: 0 !important;
      padding: 0 !important;
      border: 0 !important;
      pointer-events: none !important;
    }
  }
`;

interface FormulaMap {
  [productType: string]: {
    widthCount: string;
    pleatAmount: string;
  };
}

interface EstimateStore {
  estimates: Estimate[];
  activeTab: number;
  formulas: FormulaMap;
  setActiveTab: (idx: number) => void;
  addEstimate: () => void;
  removeEstimate: (idx: number) => void;
  updateEstimateRows: (idx: number, rows: EstimateRow[]) => void;
  setFormulas: (f: FormulaMap) => void;
  setEstimates: (estimates: Estimate[]) => void;
}

// 견적서 생성 시 견적번호 생성 함수
function generateEstimateNo(existingEstimates: Estimate[]): string {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  const dateStr = `${y}${m}${d}`;

  // saved_estimates에서도 오늘 날짜의 견적서 확인
  const savedEstimates = JSON.parse(
    localStorage.getItem('saved_estimates') || '[]'
  );
  const allEstimates = [...existingEstimates, ...savedEstimates];

  // 오늘 날짜의 견적서 중 가장 큰 일련번호 찾기
  const todayEstimates = allEstimates.filter(e =>
    e.estimateNo?.startsWith(`E${dateStr}`)
  );

  // 기본 일련번호와 수정본 일련번호를 모두 고려
  const allSequences: number[] = [];

  todayEstimates.forEach(e => {
    const parts = e.estimateNo.split('-');
    if (parts.length >= 2) {
      // 기본 일련번호 (예: E20250620-001)
      const baseSeq = Number(parts[1]);
      if (!isNaN(baseSeq)) {
        allSequences.push(baseSeq);
      }

      // 수정본 일련번호 (예: E20250620-001-01)
      if (parts.length >= 3) {
        const revisionSeq = Number(parts[2]);
        if (!isNaN(revisionSeq)) {
          allSequences.push(baseSeq);
        }
      }
    }
  });

  // 항상 가장 높은 번호 다음 번호로 발행 (빈 번호 무시)
  const maxSeq = allSequences.length > 0 ? Math.max(...allSequences) : 0;
  const nextSeq = String(maxSeq + 1).padStart(3, '0');
  return `E${dateStr}-${nextSeq}`;
}

// 수정번호 생성 함수
function generateRevisionNo(
  originalEstimateNo: string,
  existingEstimates: Estimate[]
): string {
  // 원본 견적번호에서 날짜 부분 추출 (예: E20250620-003)
  const baseEstimateNo = originalEstimateNo.split('-').slice(0, 2).join('-');

  // 같은 원본 견적번호를 가진 수정본들 찾기 (saved_estimates에서도 확인)
  const savedEstimates = JSON.parse(
    localStorage.getItem('saved_estimates') || '[]'
  );
  const allEstimates = [...existingEstimates, ...savedEstimates];

  const revisionEstimates = allEstimates.filter(
    e => e.estimateNo.startsWith(baseEstimateNo) && e.estimateNo.includes('-')
  );

  // 수정번호 찾기 (마지막 부분이 숫자인 경우)
  const revisionNumbers = revisionEstimates
    .map(e => {
      const parts = e.estimateNo.split('-');
      const lastPart = parts[parts.length - 1];
      return Number(lastPart);
    })
    .filter(num => !isNaN(num));

  // 항상 가장 높은 번호 다음 번호로 발행 (빈 번호 무시)
  const maxRevision =
    revisionNumbers.length > 0 ? Math.max(...revisionNumbers) : 0;
  const nextRevision = maxRevision + 1;

  return `${baseEstimateNo}-${String(nextRevision).padStart(2, '0')}`;
}

// 로컬 날짜 생성 함수
function getLocalDate() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

// 중복 데이터 정리 함수
function removeDuplicateEstimates(estimates: any[]): any[] {
  const uniqueEstimates = new Map();
  
  estimates.forEach(estimate => {
    const key = estimate.estimateNo;
    if (!uniqueEstimates.has(key)) {
      uniqueEstimates.set(key, estimate);
    } else {
      // 이미 존재하는 경우 더 최신 데이터로 업데이트
      const existing = uniqueEstimates.get(key);
      const existingDate = new Date(existing.savedAt || 0);
      const currentDate = new Date(estimate.savedAt || 0);
      
      if (currentDate > existingDate) {
        uniqueEstimates.set(key, estimate);
        console.log('중복 견적서 정리 - 더 최신 데이터로 교체:', key);
      }
    }
  });
  
  const cleanedEstimates = Array.from(uniqueEstimates.values());
  console.log(`중복 정리 완료: ${estimates.length}개 → ${cleanedEstimates.length}개`);
  
  return cleanedEstimates;
}

const useEstimateStore = create<EstimateStore>(set => ({
  estimates: [
    {
      id: 1, // 고정된 ID 사용으로 안정성 확보
      name: `견적서-${generateEstimateNo([])}`,
      estimateNo: generateEstimateNo([]),
      estimateDate: getLocalDate(), // 로컬 시간 기준으로 오늘 날짜 설정
      customerName: '',
      contact: '',
      emergencyContact: '',
      projectName: '',
      type: '',
      address: '',
      rows: [],
    },
  ],
  activeTab: 0,
  formulas: {
    '겉커튼-민자-2000이하': {
      widthCount: 'widthMM*1.4/productWidth',
      pleatAmount: 'productWidth*widthCount/widthMM',
    },
    '겉커튼-나비-2000이하': {
      widthCount: 'widthMM*2/productWidth',
      pleatAmount: 'productWidth*widthCount/widthMM',
    },
    '겉커튼-민자-2000이상': { 
      widthCount: 'widthMM*1.4/1370', 
      pleatAmount: '1370*widthCount/widthMM' 
    },
    '겉커튼-나비-2000이상': { 
      widthCount: 'widthMM*2/1370', 
      pleatAmount: '1370*widthCount/widthMM' 
    },
  },
  setActiveTab: idx => set({ activeTab: idx }),
  addEstimate: () =>
    set(state => {
      const estimateNo = generateEstimateNo(state.estimates);
      // 고유 ID 생성 (기존 ID 중 최대값 + 1)
      const maxId = state.estimates.length > 0 
        ? Math.max(...state.estimates.map(e => e.id)) 
        : 0;
      const newId = maxId + 1;
      return {
        estimates: [
          ...state.estimates,
          {
            id: newId,
            name: `견적서-${estimateNo}`,
            estimateNo,
            estimateDate: getLocalDate(), // 로컬 시간 기준으로 오늘 날짜 설정
            customerName: '',
            contact: '',
            emergencyContact: '',
            projectName: '',
            type: '',
            address: '',
            rows: [],
          },
        ],
        activeTab: state.estimates.length,
      };
    }),
  removeEstimate: idx =>
    set(state => {
      // 견적서가 1개만 남아있으면 삭제하지 않고 초기화
      if (state.estimates.length === 1) {
        const estimateNo = generateEstimateNo([]);
        return {
          estimates: [
            {
              id: 1, // 고정된 ID 사용으로 안정성 확보
              name: `견적서-${estimateNo}`,
              estimateNo,
              estimateDate: getLocalDate(),
              customerName: '',
              contact: '',
              emergencyContact: '',
              projectName: '',
              type: '',
              address: '',
              rows: [],
            },
          ],
          activeTab: 0,
        };
      }

      // 견적서가 2개 이상일 때는 기존 로직대로 삭제
      const newEstimates = state.estimates.filter((_, i) => i !== idx);
      return {
        estimates: newEstimates,
        activeTab: Math.max(0, idx - 1),
      };
    }),
  updateEstimateRows: (idx, rows) =>
    set(state => {
      const newEstimates = [...state.estimates];
      newEstimates[idx] = { ...newEstimates[idx], rows };
      return { estimates: newEstimates };
    }),
  setFormulas: f => set({ formulas: f }),
  setEstimates: estimates => set({ estimates }),
}));

// 공간 설정 모달 컴포넌트
const SpaceSettingsDialog: React.FC<{ open: boolean; onClose: () => void }> = ({
  open,
  onClose,
}) => {
  const isMobile = useMediaQuery('(max-width:600px)');
  const [spaceOptions, setSpaceOptions] = useState<string[]>(loadSpaceOptions());
  const [newSpace, setNewSpace] = useState('');
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [editingValue, setEditingValue] = useState('');

  const handleAddSpace = () => {
    if (newSpace.trim() && !spaceOptions.includes(newSpace.trim())) {
      const updatedOptions = [...spaceOptions, newSpace.trim()];
      setSpaceOptions(updatedOptions);
      saveSpaceOptions(updatedOptions);
      setNewSpace('');
    }
  };

  const handleDeleteSpace = (index: number) => {
    const spaceToDelete = spaceOptions[index];
    if (spaceToDelete === '직접입력') {
      alert('"직접입력" 옵션은 삭제할 수 없습니다.');
      return;
    }

    const updatedOptions = spaceOptions.filter((_, i) => i !== index);
    setSpaceOptions(updatedOptions);
    saveSpaceOptions(updatedOptions);
  };

  const handleStartEdit = (index: number, value: string) => {
    if (value === '직접입력') {
      alert('"직접입력" 옵션은 수정할 수 없습니다.');
      return;
    }
    setEditingIndex(index);
    setEditingValue(value);
  };

  const handleSaveEdit = () => {
    if (editingIndex !== null && editingValue.trim()) {
      const updatedOptions = [...spaceOptions];
      updatedOptions[editingIndex] = editingValue.trim();
      setSpaceOptions(updatedOptions);
      saveSpaceOptions(updatedOptions);
      setEditingIndex(null);
      setEditingValue('');
    }
  };

  const handleCancelEdit = () => {
    setEditingIndex(null);
    setEditingValue('');
  };

  const handleMoveUp = (index: number) => {
    if (index > 0) {
      const updatedOptions = [...spaceOptions];
      [updatedOptions[index], updatedOptions[index - 1]] = [updatedOptions[index - 1], updatedOptions[index]];
      setSpaceOptions(updatedOptions);
      saveSpaceOptions(updatedOptions);
    }
  };

  const handleMoveDown = (index: number) => {
    if (index < spaceOptions.length - 1) {
      const updatedOptions = [...spaceOptions];
      [updatedOptions[index], updatedOptions[index + 1]] = [updatedOptions[index + 1], updatedOptions[index]];
      setSpaceOptions(updatedOptions);
      saveSpaceOptions(updatedOptions);
    }
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      fullScreen={isMobile}
    >
      <DialogTitle sx={{
        display: 'flex',
        alignItems: 'center',
        gap: 1,
        fontSize: isMobile ? '1.2rem' : '1.25rem',
        pb: isMobile ? 1 : 2
      }}>
        {isMobile && (
          <IconButton
            edge="start"
            color="inherit"
            onClick={onClose}
            aria-label="close"
            sx={{ mr: 1 }}
          >
            <ArrowBackIcon />
          </IconButton>
        )}
        공간 설정
        <Typography variant="subtitle2" sx={{
          mt: isMobile ? 0.5 : 1,
          color: '#666',
          fontWeight: 'normal',
          fontSize: isMobile ? '0.9rem' : '0.875rem'
        }}>
          견적서에서 사용할 공간 옵션을 관리합니다.
        </Typography>
      </DialogTitle>
      <DialogContent>
        <Box sx={{ mb: isMobile ? 2 : 3 }}>
          <Typography variant="subtitle2" sx={{
            mb: isMobile ? 0.5 : 1,
            fontSize: isMobile ? '1rem' : '0.875rem'
          }}>
            새 공간 추가
          </Typography>
          <Box sx={{ display: 'flex', gap: isMobile ? 0.5 : 1, flexDirection: isMobile ? 'column' : 'row' }}>
            <TextField
              fullWidth
              size={isMobile ? "medium" : "small"}
              value={newSpace}
              onChange={(e) => setNewSpace(e.target.value)}
              placeholder="새 공간명 입력"
              onKeyPress={(e) => e.key === 'Enter' && handleAddSpace()}
              sx={{
                '& .MuiInputBase-input': {
                  fontSize: isMobile ? '1rem' : '0.875rem',
                  padding: isMobile ? '12px 14px' : '8.5px 14px'
                }
              }}
            />
            <Button
              variant="contained"
              onClick={handleAddSpace}
              disabled={!newSpace.trim() || spaceOptions.includes(newSpace.trim())}
              sx={{
                minHeight: isMobile ? '48px' : '40px',
                fontSize: isMobile ? '1rem' : '0.875rem',
                px: isMobile ? 3 : 2
              }}
            >
              추가
            </Button>
          </Box>
        </Box>

        <Box>
          <Typography variant="subtitle2" sx={{
            mb: isMobile ? 0.5 : 1,
            fontSize: isMobile ? '1rem' : '0.875rem'
          }}>
            공간 목록
          </Typography>
          <List sx={{
            maxHeight: isMobile ? '60vh' : 300,
            overflow: 'auto',
            '& .MuiListItem-root': {
              py: isMobile ? 1.5 : 1
            }
          }}>
            {spaceOptions.map((space, index) => (
              <ListItem
                key={index}
                sx={{
                  border: '1px solid #eee',
                  borderRadius: 1,
                  mb: isMobile ? 0.5 : 1,
                  backgroundColor: space === '직접입력' ? '#f5f5f5' : 'white',
                  minHeight: isMobile ? '60px' : 'auto'
                }}
              >
                <ListItemText
                  primary={
                    editingIndex === index ? (
                      <TextField
                        fullWidth
                        size="small"
                        value={editingValue}
                        onChange={(e) => setEditingValue(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && handleSaveEdit()}
                        autoFocus
                      />
                    ) : (
                      <Typography
                        sx={{
                          fontWeight: space === '직접입력' ? 'bold' : 'normal',
                          color: space === '직접입력' ? '#1976d2' : 'inherit',
                          fontSize: isMobile ? '1rem' : '0.875rem'
                        }}
                      >
                        {space}
                      </Typography>
                    )
                  }
                />
                <Box sx={{ display: 'flex', gap: isMobile ? 1 : 0.5 }}>
                  {editingIndex === index ? (
                    <>
                      <IconButton
                        size={isMobile ? "medium" : "small"}
                        onClick={handleSaveEdit}
                        color="primary"
                        sx={{ minWidth: isMobile ? '48px' : 'auto' }}
                      >
                        <SaveIcon />
                      </IconButton>
                      <IconButton
                        size={isMobile ? "medium" : "small"}
                        onClick={handleCancelEdit}
                        sx={{ minWidth: isMobile ? '48px' : 'auto' }}
                      >
                        <DeleteIcon />
                      </IconButton>
                    </>
                  ) : (
                    <>
                      <IconButton
                        size={isMobile ? "medium" : "small"}
                        onClick={() => handleStartEdit(index, space)}
                        disabled={space === '직접입력'}
                        sx={{ minWidth: isMobile ? '48px' : 'auto' }}
                      >
                        <EditIcon />
                      </IconButton>
                      <IconButton
                        size={isMobile ? "medium" : "small"}
                        onClick={() => handleDeleteSpace(index)}
                        disabled={space === '직접입력'}
                        sx={{ minWidth: isMobile ? '48px' : 'auto' }}
                      >
                        <DeleteIcon />
                      </IconButton>
                      <IconButton
                        size={isMobile ? "medium" : "small"}
                        onClick={() => handleMoveUp(index)}
                        disabled={index === 0}
                        sx={{ minWidth: isMobile ? '48px' : 'auto' }}
                      >
                        <ArrowUpIcon />
                      </IconButton>
                      <IconButton
                        size={isMobile ? "medium" : "small"}
                        onClick={() => handleMoveDown(index)}
                        disabled={index === spaceOptions.length - 1}
                        sx={{ minWidth: isMobile ? '48px' : 'auto' }}
                      >
                        <ArrowDownIcon />
                      </IconButton>
                    </>
                  )}
                </Box>
              </ListItem>
            ))}
          </List>
        </Box>
      </DialogContent>
      {!isMobile && (
        <DialogActions>
          <Button onClick={onClose}>닫기</Button>
        </DialogActions>
      )}
    </Dialog>
  );
};

const FormulaDialog: React.FC<{ open: boolean; onClose: () => void }> = ({
  open,
  onClose,
}) => {
  const isMobile = useMediaQuery('(max-width:600px)');
  const formulas = useEstimateStore(s => s.formulas);
  const setFormulas = useEstimateStore(s => s.setFormulas);
  const [local, setLocal] = useState<FormulaMap>(formulas);

  const handleChange = (
    type: string,
    key: 'widthCount' | 'pleatAmount',
    value: string
  ) => {
    setLocal(prev => ({ ...prev, [type]: { ...prev[type], [key]: value } }));
  };

  const handleSave = () => {
    setFormulas(local);
    onClose();
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      fullScreen={isMobile}
    >
      <DialogTitle sx={{
        display: 'flex',
        alignItems: 'center',
        gap: 1,
        fontSize: isMobile ? '1.2rem' : '1.25rem',
        pb: isMobile ? 1 : 2
      }}>
        {isMobile && (
          <IconButton
            edge="start"
            color="inherit"
            onClick={onClose}
            aria-label="close"
            sx={{ mr: 1 }}
          >
            <ArrowBackIcon />
          </IconButton>
        )}
        계산방식 관리
      </DialogTitle>
      <DialogContent>
        <Typography variant="body2" sx={{
          mb: isMobile ? 1.5 : 2,
          color: 'text.secondary',
          fontSize: isMobile ? '0.9rem' : '0.875rem',
          lineHeight: isMobile ? 1.6 : 1.5
        }}>
          폭수 계산공식(수식) 관리
          <br />
          사용 가능한 변수명: <b>widthMM</b> (가로 실측값), <b>productWidth</b>{' '}
          (제품 원단폭)
          <br />
          예시: <code>widthMM*1.4/productWidth</code>
        </Typography>
        {Object.keys(local).map(type => (
          <Box key={type} sx={{ mb: isMobile ? 1.5 : 2 }}>
            <Typography variant="subtitle1" sx={{
              fontSize: isMobile ? '1rem' : '1.25rem',
              mb: isMobile ? 0.5 : 1
            }}>
              {type}
            </Typography>
            <TextField
              label="폭수 수식"
              value={local[type].widthCount}
              onChange={(e: ChangeEvent<HTMLInputElement>) =>
                handleChange(type, 'widthCount', e.target.value)
              }
              fullWidth
              size={isMobile ? "medium" : "small"}
              sx={{
                mb: isMobile ? 0.5 : 1,
                '& .MuiInputBase-input': {
                  fontSize: isMobile ? '1rem' : '0.875rem',
                  padding: isMobile ? '12px 14px' : '8.5px 14px'
                }
              }}
            />
          </Box>
        ))}
      </DialogContent>
      {!isMobile && (
        <DialogActions>
          <Button onClick={onClose}>취소</Button>
          <Button onClick={handleSave} variant="contained">
            저장
          </Button>
        </DialogActions>
      )}
      {isMobile && (
        <Box sx={{ p: 2, display: 'flex', gap: 1, justifyContent: 'center' }}>
          <Button
            onClick={onClose}
            variant="outlined"
            sx={{
              minHeight: '48px',
              fontSize: '1rem',
              px: 3
            }}
          >
            취소
          </Button>
          <Button
            onClick={handleSave}
            variant="contained"
            sx={{
              minHeight: '48px',
              fontSize: '1rem',
              px: 3
            }}
          >
            저장
          </Button>
        </Box>
      )}
    </Dialog>
  );
};



  // 제품 목록 불러오기 함수
  function loadProducts() {
    try {
      const data = localStorage.getItem('productList');
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  }



// 공간 옵션을 localStorage에서 로드하는 함수
const loadSpaceOptions = (): string[] => {
  try {
    const saved = localStorage.getItem('spaceOptions');
    if (saved) {
      return JSON.parse(saved);
    }
  } catch (error) {
    console.error('공간 옵션 로드 실패:', error);
  }
  // 기본값 반환
  return [
    '거실',
    '안방',
    '드레스룸',
    '중간방',
    '끝방',
    '북방',
    '입구방',
    '주방',
    '주방베란다',
    '안방베란다',
    '거실베란다',
    '직접입력',
  ];
};

// 공간 옵션을 localStorage에 저장하는 함수
const saveSpaceOptions = (options: string[]) => {
  try {
    localStorage.setItem('spaceOptions', JSON.stringify(options));
  } catch (error) {
    console.error('공간 옵션 저장 실패:', error);
  }
};

const SPACE_OPTIONS = loadSpaceOptions();
const CURTAIN_TYPE_OPTIONS = ['겉커튼', '속커튼', '기타'];
const PLEAT_TYPE_OPTIONS = ['민자', '나비', '기타'];
const LINE_DIR_OPTIONS = ['좌', '우', '없음'];
const LINE_LEN_OPTIONS = [
  '90cm',
  '120cm',
  '150cm',
  '180cm',
  '210cm',
  '직접입력',
];

const calculatePleatCount = (
  width: number,
  productWidth: number,
  pleatType: string
): number => {
  let result: number;
  // 폭 값이 없으면 1370으로 간주
  const safeProductWidth = productWidth > 0 ? productWidth : 1370;
  const standardWidth = safeProductWidth > 2000 ? 1370 : safeProductWidth;

  if (pleatType === '민자') {
    result = (width * 1.4) / standardWidth;
  } else if (pleatType === '나비') {
    result = (width * 2) / standardWidth;
  } else {
    return 0;
  }

  // 소수점 첫째자리 기준으로 반올림
  const decimal = result - Math.floor(result);
  return decimal <= 0.1 ? Math.floor(result) : Math.ceil(result);
};

// 폭수 계산 함수 추가
const getPleatCount = (
  widthMM: number,
  productWidth: number,
  pleatType: string,
  curtainType: string
) => {
  if (curtainType !== '겉커튼') return '';
  // 폭 값이 없으면 1370으로 간주
  const safeProductWidth = productWidth > 0 ? productWidth : 1370;
  if (widthMM <= 0 || safeProductWidth <= 0) return '';

  let result = 0;
  if (pleatType === '민자') {
    // 겉커튼, 민자 폭수추천 공식: (실측가로 × 1.4) ÷ 제품폭
      result = (widthMM * 1.4) / safeProductWidth;
  } else if (pleatType === '나비') {
    // 겉커튼, 나비 폭수추천 공식: (실측가로 × 2) ÷ 제품폭
      result = (widthMM * 2) / safeProductWidth;
  } else {
    return '';
  }

  // Infinity나 NaN 체크
  if (!isFinite(result) || isNaN(result)) return '';

  const decimal = result - Math.floor(result);
  return decimal <= 0.1 ? Math.floor(result) : Math.ceil(result);
};

// 주름양 계산 함수 추가
// 겉커튼 주름양 계산 함수
const calculatePleatAmountForGgeotCurtain = (widthMM: number, pleatCount: number, productWidth?: number): string => {
  if (widthMM <= 0 || pleatCount <= 0) return '';
  
  // 주름양 계산 공식- 겉커튼: (제품폭 × 폭수) ÷ 실측가로
  // 제품폭이 없을때 1370으로 간주
  const safeProductWidth = productWidth && productWidth > 0 ? productWidth : 1370;
  const calculatedPleatAmount = (safeProductWidth * pleatCount) / widthMM;
  
  // Infinity나 NaN 체크
  if (!isFinite(calculatedPleatAmount) || isNaN(calculatedPleatAmount)) return '';
  
  // 소수점 둘째자리까지
  return calculatedPleatAmount.toFixed(2);
};

const getPleatAmount = (
  widthMM: number,
  productWidth: number,
  pleatType: string,
  curtainType: string,
  pleatCount: number
) => {
  // 속커튼 나비주름은 고정값
  if (curtainType === '속커튼' && pleatType === '나비') return '1.8~2';
  
  // 속커튼 민자는 면적 기반 계산
  if (curtainType === '속커튼' && pleatType === '민자') {
    // 이 경우 heightMM이 필요하므로 호출하는 곳에서 처리
    return '면적기반';
  }
  
  // 겉커튼 주름양 계산
  if (curtainType === '겉커튼' && pleatCount && pleatCount > 0) {
    if (widthMM <= 0 || productWidth <= 0) return '';

    let result = 0;
    if (pleatType === '민자' || pleatType === '나비') {
      // 제품폭이 2000mm 이상이면 1370mm 기준으로 계산
      const standardWidth = productWidth > 2000 ? 1370 : productWidth;
      result = (standardWidth * pleatCount) / widthMM;
    } else {
      return '';
    }

    // Infinity나 NaN 체크
    if (!isFinite(result) || isNaN(result)) return '';

    return result ? result.toFixed(2) : '';
  }
  
  return '';
};

// 면적 계산 함수 추가
const getArea = (
  productType: string,
  widthMM: number,
  heightMM: number,
  curtainType: string,
  pleatType: string,
  pleatAmount: string | number,
  pleatAmountCustom: string | undefined,
  productCode: string | undefined,
  productName: string | undefined,
  productOptions: any[]
) => {
  if (productType === '커튼' && pleatType === '민자') {
    // 주문관리와 동일한 방식: pleatMultiplier 사용
    let pleatMultiplier = 1.4; // 기본값
    if (typeof pleatAmount === 'string') {
      if (pleatAmount.endsWith('배')) {
        pleatMultiplier = Number(pleatAmount.replace('배', '')) || 1.4;
    } else {
        pleatMultiplier = Number(pleatAmount) || 1.4;
    }
    } else if (typeof pleatAmount === 'number') {
      pleatMultiplier = pleatAmount;
    }
    const area = (widthMM / 1000) * pleatMultiplier;
    return area > 0 ? (Math.ceil(area * 10) / 10).toFixed(1) : '';
  }
  if (curtainType === '속커튼' && pleatType === '나비') {
    const area = widthMM * 0.001;
    return area > 0 ? (Math.ceil(area * 10) / 10).toFixed(1) : '';
  }
  if (productType === '블라인드') {
    const area = widthMM * heightMM * 0.000001;
    // productOptions에서 해당 제품의 minOrderQty 찾기
    const product = productOptions.find(
      (p: any) => p.productCode === productCode || p.productName === productName
    );
    const minOrderQty = product ? Number(product.minOrderQty) || 0 : 0;
    if (minOrderQty > 0 && area < minOrderQty) {
      return minOrderQty.toString();
    }
    return area > 0 ? (Math.ceil(area * 10) / 10).toFixed(1) : '';
  }
  return '';
};

// 판매금액 계산 함수
const getTotalPrice = (row: any, area: number) => {
  // 헌터더글라스 제품: 판매단가 * 수량
  if (row.brand?.toLowerCase() === 'hunterdouglas') {
    return row.salePrice && row.quantity
      ? Math.round(row.salePrice * row.quantity)
      : '';
  }
  // 1. 겉커튼 민자, 나비: 제품등록 판매단가 * 폭수
  if (
    row.curtainType === '겉커튼' &&
    (row.pleatType === '민자' || row.pleatType === '나비')
  ) {
    return row.salePrice && row.widthCount
      ? Math.round(row.salePrice * row.widthCount)
      : '';
  }
  // 3. 속커튼 민자: 대폭민자단가 * 면적(m2)
  if (row.curtainType === '속커튼' && row.pleatType === '민자') {
    const areaNum = Number(area);
    let priceToUse = row.largePlainPrice;
    
    // 대폭민자단가가 없으면 판매단가의 63% 사용
    if (!priceToUse) {
      priceToUse = row.salePrice ? row.salePrice * 0.63 : 0;
    }
    
    return priceToUse && areaNum
      ? Math.round(priceToUse * areaNum)
      : '';
  }
  // 4. 속커튼 나비: 제품등록 판매단가 * 면적(m2)
  if (row.curtainType === '속커튼' && row.pleatType === '나비') {
    const areaNum = Number(area);
    return row.salePrice && areaNum ? Math.round(row.salePrice * areaNum) : '';
  }
  // 5. 블라인드: 제품등록 판매단가 * m2
  if (row.productType === '블라인드') {
    const areaNum = Number(area);
    return row.salePrice && areaNum ? Math.round(row.salePrice * areaNum) : '';
  }
  return row.totalPrice || '';
};

// 입고금액 계산 함수
const getPurchaseTotal = (row: any, area: number) => {
  if (row.brand?.toLowerCase() === 'hunterdouglas')
    return row.salePrice ? Math.round((row.salePrice * 0.6) / 1.1) : '';
  if (row.productType === '블라인드') {
    const areaNum = Number(area);
    return row.purchaseCost && areaNum
      ? Math.round(row.purchaseCost * areaNum)
      : '';
  }
  if (
    row.curtainType === '겉커튼' &&
    (row.pleatType === '민자' || row.pleatType === '나비')
  )
    return row.purchaseCost && row.widthCount
      ? Math.round(row.purchaseCost * row.widthCount)
      : '';
  // 속커튼-민자: 대폭민자원가 * 면적(m2)
  if (row.curtainType === '속커튼' && row.pleatType === '민자') {
    const areaNum = Number(area);
    let costToUse = row.largePlainCost;
    
    // 대폭민자원가가 없으면 입고원가의 63% 사용
    if (!costToUse) {
      costToUse = row.purchaseCost ? row.purchaseCost * 0.63 : 0;
    }
    
    return costToUse && areaNum
      ? Math.round(costToUse * areaNum)
      : '';
  }
  if (row.curtainType === '속커튼' && row.pleatType === '나비') {
    const areaNum = Number(area);
    return row.purchaseCost && areaNum
      ? Math.round(row.purchaseCost * areaNum)
      : '';
  }
  return row.purchaseCost || '';
};

interface FilterField {
  key: string;
  label: string;
  visible: boolean;
}

interface FilterState {
  [key: string]: boolean;
}

const FILTER_FIELDS: FilterField[] = [
  { key: 'vendor', label: '거래처', visible: true },
  { key: 'brand', label: '브랜드', visible: true },
  { key: 'productName', label: '제품명', visible: true },
  { key: 'space', label: '공간', visible: true },
  { key: 'productCode', label: '제품코드', visible: true },
  { key: 'productType', label: '제품종류', visible: true },
  { key: 'curtainType', label: '커튼종류', visible: true },
  { key: 'pleatType', label: '주름방식', visible: true },
  { key: 'width', label: '폭', visible: true },
  { key: 'details', label: '세부내용', visible: true },
  { key: 'widthMM', label: '가로(mm)', visible: true },
  { key: 'heightMM', label: '세로(mm)', visible: true },
  { key: 'area', label: '면적(㎡)', visible: true },
  { key: 'lineDir', label: '줄방향', visible: true },
  { key: 'lineLen', label: '줄길이', visible: true },
  { key: 'pleatAmount', label: '주름양', visible: true },
  { key: 'widthCount', label: '폭수', visible: true },
  { key: 'quantity', label: '수량', visible: true },
  { key: 'totalPrice', label: '판매금액', visible: true },
  { key: 'salePrice', label: '판매단가', visible: true },
  { key: 'cost', label: '입고금액', visible: true },
  { key: 'purchaseCost', label: '입고원가', visible: true },
  { key: 'margin', label: '마진', visible: true },
];

// 열 표시 기본값 (이미지에서 체크된 항목만 true)
const DEFAULT_COLUMN_VISIBILITY: { [key: string]: boolean } = {
  vendor: true,
  brand: false,
  productName: true,
  space: true,
  productCode: true,
  productType: false,
  curtainType: true,
  pleatType: true,
  width: false,
  details: true,
  widthMM: true,
  heightMM: true,
  area: true,
  lineDir: false,
  lineLen: false,
  pleatAmount: true,
  widthCount: true,
  quantity: true,
  totalPrice: true,
  salePrice: false,
  cost: false,
  purchaseCost: false,
  margin: false,
};

// Customer 타입 정의
// 계약 타입 정의
interface Contract {
  id: string;
  contractNo: string;
  estimateNo: string; // 견적서 번호 추가
  contractDate: string;
  customerName: string;
  customerContact: string;
  customerAddress: string;
  address?: string; // 주소 필드 추가 (기존 customerAddress와 별도)
  projectName: string;
  projectType: string;
  totalAmount: number;
  status: string;
  items: any[];
  createdAt: string;
  updatedAt: string;
}

interface Customer {
  id: number;
  name: string;
  address: string;
  tel: string;
  emergencyTel: string;
  visitPath: string;
  note: string;
  projects?: any[];
  createdAt?: string;
  updatedAt?: string;
}

// 주소를 발주명 형식으로 변환하는 함수
function convertAddressToPurchaseOrderName(address: string): string {
  if (!address || address.trim() === '') {
    return '';
  }

  const cleanAddress = address.trim();
  
  // 아파트 패턴: "아파트명-동호수" 또는 "아파트명 동호수"
  const apartmentPattern = /([가-힣a-zA-Z0-9\s]+아파트)\s*[-]?\s*(\d+동\s*\d+호)/;
  const apartmentMatch = cleanAddress.match(apartmentPattern);
  if (apartmentMatch) {
    return `${apartmentMatch[1].trim()}-${apartmentMatch[2].trim()}`;
  }

  // 오피스텔 패턴: "오피스텔명-호수" 또는 "오피스텔명 호수"
  const officetelPattern = /([가-힣a-zA-Z0-9\s]+오피스텔)\s*[-]?\s*(\d+호)/;
  const officetelMatch = cleanAddress.match(officetelPattern);
  if (officetelMatch) {
    return `${officetelMatch[1].trim()}-${officetelMatch[2].trim()}`;
  }

  // 빌라 패턴: "빌라명-호수" 또는 "빌라명 호수"
  const villaPattern = /([가-힣a-zA-Z0-9\s]+빌라)\s*[-]?\s*(\d+호)/;
  const villaMatch = cleanAddress.match(villaPattern);
  if (villaMatch) {
    return `${villaMatch[1].trim()}-${villaMatch[2].trim()}`;
  }

  // 빌딩 패턴: "빌딩명-호수" 또는 "빌딩명 호수"
  const buildingPattern = /([가-힣a-zA-Z0-9\s]+빌딩)\s*[-]?\s*(\d+호)/;
  const buildingMatch = cleanAddress.match(buildingPattern);
  if (buildingMatch) {
    return `${buildingMatch[1].trim()}-${buildingMatch[2].trim()}`;
  }

  // 동-번지 패턴: "동명-번지수"
  const dongPattern = /(\d+동)\s*[-]?\s*(\d+번지)/;
  const dongMatch = cleanAddress.match(dongPattern);
  if (dongMatch) {
    return `${dongMatch[1].trim()}-${dongMatch[2].trim()}`;
  }

  // 일반적인 주소에서 건물명과 호수 추출
  const generalPattern = /([가-힣a-zA-Z0-9\s]+)\s*[-]?\s*(\d+호)/;
  const generalMatch = cleanAddress.match(generalPattern);
  if (generalMatch) {
    return `${generalMatch[1].trim()}-${generalMatch[2].trim()}`;
  }

  // 패턴에 맞지 않는 경우 원본 주소 반환 (최대 20자로 제한)
  return cleanAddress.length > 20 ? cleanAddress.substring(0, 20) + '...' : cleanAddress;
}

const CUSTOMER_DB_KEY = 'customer_db';
const CUSTOMER_STORAGE_KEY = 'customerList';

async function getCustomerList() {
  try {
    console.log('Firebase에서 고객 데이터 로드 시작');
    const customers = await customerService.getCustomers();
          if (process.env.NODE_ENV === 'development') {
        console.log('Firebase에서 고객 데이터 로드 완료:', customers.length, '개');
      }
    return customers;
  } catch (error) {
    console.error('Firebase에서 고객 데이터 로드 실패:', error);
    // Firebase 실패 시 localStorage에서 로드 (fallback)
    try {
      const data = localStorage.getItem('customerList');
      const localCustomers = data ? JSON.parse(data) : [];
      console.log('localStorage에서 고객 데이터 로드 (fallback):', localCustomers.length, '개');
      return localCustomers;
    } catch (localError) {
      console.error('localStorage에서 고객 데이터 로드 실패:', localError);
      return [];
    }
  }
}

function loadCustomers() {
  try {
    const customerData = localStorage.getItem(CUSTOMER_STORAGE_KEY);
    return customerData ? JSON.parse(customerData) : [];
  } catch {
    return [];
  }
}



// 공간별 다크 테마 컬러 팔레트 (테이블 배경과 어울리게)
const SPACE_COLORS: { [space: string]: string } = {
  거실: '#1a2332', // 어두운 파란색
  안방: '#2a1a2a', // 어두운 분홍색
  드레스룸: '#1a2a1a', // 어두운 초록색
  중간방: '#2a2a1a', // 어두운 노란색
  끝방: '#2a2a2a', // 어두운 베이지색
  주방: '#2a1a1a', // 어두운 살구색
  기타: '#1a1a2a', // 어두운 라벤더색
  '': '#1a1a2a', // 기본 어두운 라벤더색
};
const SPACE_COLOR_LIST = Object.values(SPACE_COLORS);

// 계약목록 모달 컴포넌트
const ContractListModal: React.FC<{
  open: boolean;
  onClose: () => void;
  onSelectContract: (contract: Contract) => void;
}> = ({ open, onClose, onSelectContract }) => {
  const isMobile = useMediaQuery('(max-width:600px)');
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(false);

  // 계약 목록 로드
  const loadContracts = useCallback(async () => {
    setLoading(true);
    try {
      // 1. 모든 계약서 로드
      const savedContracts = JSON.parse(localStorage.getItem('contracts') || '[]');
      console.log('전체 계약서 개수:', savedContracts.length);
      
      // 2. 견적서 목록 로드
      const savedEstimates = JSON.parse(localStorage.getItem('saved_estimates') || '[]');
      console.log('전체 견적서 개수:', savedEstimates.length);
      
      // 3. 계약완료 견적서 필터링 (견적관리에서는 계약완료된 견적서만 표시)
      const completedEstimates = savedEstimates.filter((estimate: any) => {
        // 계약완료 상태 확인
        const hasContract = savedContracts.some((contract: any) => 
          contract.estimateNo === estimate.estimateNo
        );
        const isFinalEstimate = estimate.estimateNo.includes('-final');
        const isCompletedStatus = estimate.status === '계약완료';
        
        return hasContract || isFinalEstimate || isCompletedStatus;
      });
      
      console.log('계약완료 견적서 개수:', completedEstimates.length);
      
      // 4. 계약완료된 견적서에 해당하는 계약만 필터링
      const availableContracts = savedContracts.filter((contract: any) => {
        const isCompletedEstimate = completedEstimates.some((estimate: any) => 
          estimate.estimateNo === contract.estimateNo
        );
        
        return isCompletedEstimate;
      });
      
      console.log('사용 가능한 계약서 개수:', availableContracts.length);
      console.log('사용 가능한 계약서:', availableContracts.map((c: any) => ({
        contractNo: c.contractNo,
        estimateNo: c.estimateNo,
        customerName: c.customerName
      })));
      
      setContracts(availableContracts);
    } catch (error) {
      console.error('계약 목록 로드 실패:', error);
      setContracts([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (open) {
      loadContracts();
    }
  }, [open, loadContracts]);

  // 계약 검색 필터링
  const filteredContracts = contracts.filter(contract => {
    const search = searchTerm.toLowerCase();
    return (
      contract.contractNo?.toLowerCase().includes(search) ||
      contract.customerName?.toLowerCase().includes(search) ||
      contract.projectName?.toLowerCase().includes(search) ||
      ((contract as any).address || contract.customerAddress)?.toLowerCase().includes(search)
    );
  });

  const handleSelectContract = (contract: Contract) => {
    onSelectContract(contract);
    onClose();
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="lg"
      fullWidth
      fullScreen={isMobile}
    >
      <DialogTitle sx={{
        display: 'flex',
        alignItems: 'center',
        gap: 1,
        fontSize: isMobile ? '1.2rem' : '1.25rem',
        pb: isMobile ? 1 : 2,
        color: 'var(--text-color)',
        backgroundColor: 'var(--surface-color)'
      }}>
        {isMobile && (
          <IconButton
            edge="start"
            color="inherit"
            onClick={onClose}
            aria-label="close"
            sx={{ mr: 1, color: 'var(--text-color)' }}
          >
            <ArrowBackIcon />
          </IconButton>
        )}
        <AssignmentIcon sx={{ mr: 1, color: 'var(--text-color)' }} />
        <Typography variant="h6" sx={{ color: 'var(--text-color)', fontWeight: 'bold' }}>
          계약완료 견적서 목록
        </Typography>
        <Typography variant="subtitle2" sx={{
          mt: isMobile ? 0.5 : 1,
          color: 'var(--text-secondary-color)',
          fontWeight: 'normal',
          fontSize: isMobile ? '0.9rem' : '0.875rem'
        }}>
          계약이 완료된 견적서만 표시됩니다.
        </Typography>
      </DialogTitle>
      
      <DialogContent sx={{ backgroundColor: 'var(--surface-color)', color: 'var(--text-color)' }}>
        {/* 검색 필터 */}
        <Box sx={{ mb: 2 }}>
          <TextField
            fullWidth
            placeholder="계약번호, 고객명, 프로젝트명, 주소로 검색..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            size={isMobile ? "medium" : "small"}
            sx={{
              '& .MuiInputBase-input': {
                fontSize: isMobile ? '1rem' : '0.875rem',
                padding: isMobile ? '12px 14px' : '8.5px 14px',
                color: 'var(--text-color)'
              },
              '& .MuiInputBase-input::placeholder': {
                color: 'var(--text-secondary-color)'
              },
              '& .MuiOutlinedInput-root': {
                '& fieldset': { borderColor: 'var(--border-color)' },
                '&:hover fieldset': { borderColor: 'var(--hover-color)' },
                '&.Mui-focused fieldset': { borderColor: 'var(--primary-color)' }
              }
            }}
          />
        </Box>

        {/* 계약 목록 */}
        {loading ? (
          <Box sx={{ textAlign: 'center', py: 4 }}>
            <Typography sx={{ color: 'var(--text-color)' }}>계약 목록을 불러오는 중...</Typography>
          </Box>
        ) : filteredContracts.length > 0 ? (
          <TableContainer>
            <Table size={isMobile ? "small" : "medium"}>
              <TableHead>
                <TableRow>
                  <TableCell sx={{ color: 'var(--text-color)', backgroundColor: 'var(--surface-color)' }}>계약번호</TableCell>
                  <TableCell sx={{ color: 'var(--text-color)', backgroundColor: 'var(--surface-color)' }}>주소</TableCell>
                  <TableCell sx={{ color: 'var(--text-color)', backgroundColor: 'var(--surface-color)' }}>고객명</TableCell>
                  <TableCell sx={{ color: 'var(--text-color)', backgroundColor: 'var(--surface-color)' }}>계약일자</TableCell>
                  <TableCell sx={{ color: 'var(--text-color)', backgroundColor: 'var(--surface-color)' }}>계약금액</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredContracts.map((contract) => (
                  <TableRow 
                    key={contract.id}
                    hover
                    sx={{ cursor: 'pointer' }}
                    onClick={() => handleSelectContract(contract)}
                  >
                    <TableCell sx={{ color: 'var(--text-color)' }}>{contract.contractNo}</TableCell>
                    <TableCell sx={{ color: 'var(--text-color)' }}>{(contract as any).address || contract.customerAddress || '-'}</TableCell>
                    <TableCell sx={{ color: 'var(--text-color)' }}>{contract.customerName}</TableCell>
                    <TableCell sx={{ color: 'var(--text-color)' }}>{contract.contractDate}</TableCell>
                    <TableCell sx={{ color: 'var(--text-color)' }}>
                      {contract.totalAmount?.toLocaleString()}원
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        ) : (
          <Box sx={{ textAlign: 'center', py: 4 }}>
            <Typography sx={{ color: 'var(--text-secondary-color)', mb: 1 }}>
              {searchTerm ? '검색 결과가 없습니다.' : '계약완료된 견적서가 없습니다.'}
            </Typography>
            <Typography variant="body2" sx={{ color: 'var(--text-secondary-color)', fontSize: '0.875rem' }}>
              {searchTerm ? '' : '아직 계약이 완료되지 않은 견적서만 있습니다.'}
            </Typography>
          </Box>
        )}
      </DialogContent>
      
      {!isMobile && (
        <DialogActions sx={{ backgroundColor: 'var(--surface-color)', borderTop: '1px solid var(--border-color)' }}>
          <Button 
            onClick={onClose}
            sx={{ 
              color: 'var(--text-color)',
              '&:hover': { backgroundColor: 'var(--hover-color)' }
            }}
          >
            닫기
          </Button>
        </DialogActions>
      )}
    </Dialog>
  );
};

const EstimateManagement: React.FC = () => {
  // === UI 개선을 위한 선언 ===
  const isMobile = useMediaQuery('(max-width:600px)');

  // 그룹별 색상 배열 (라이트모드/다크모드 대응)
  const groupColors = [
    { 
      light: 'var(--surface-color)', 
      dark: 'var(--background-color)' 
    }, // 기본 그룹
    { 
      light: 'rgba(25, 118, 210, 0.1)', 
      dark: 'rgba(25, 118, 210, 0.2)' 
    }, // 블루 그룹
    { 
      light: 'rgba(156, 39, 176, 0.1)', 
      dark: 'rgba(156, 39, 176, 0.2)' 
    }, // 바이올렛 그룹
  ];

  // 견적 그룹화 함수
  const groupEstimatesByCustomer = (estimates: any[]) => {
    const groups: { [key: string]: any[] } = {};

    estimates.forEach(estimate => {
      const key = `${estimate.customerName || ''}-${estimate.contact || ''}-${estimate.address || ''}`;
      if (!groups[key]) {
        groups[key] = [];
      }
      groups[key].push(estimate);
    });

    // 각 그룹 내에서 최신 견적을 맨 위로 정렬
    Object.keys(groups).forEach(key => {
      groups[key].sort((a, b) => {
        const dateA = new Date(a.savedAt || a.estimateDate || 0);
        const dateB = new Date(b.savedAt || b.estimateDate || 0);
        return dateB.getTime() - dateA.getTime();
      });
    });

    return groups;
  };

  // 공간별 색상 함수
  function getSpaceColor(space: string, lightness = 1) {
    // 간결하고 깔끔한 한톤 색상으로 통일
    const unifiedColor = 'var(--surface-color)';
    
    // 옵션행의 경우 약간 다른 톤 사용
    if (lightness > 1) {
      return 'var(--background-color)';
    }
    
    return unifiedColor;
  }

  // 검색어 하이라이트 함수
  function highlightText(text: string, keyword: string) {
    if (!keyword) return text;
    const parts = text.split(new RegExp(`(${keyword})`, 'gi'));
    return (
      <>
        {parts.map((part, i) =>
          part.toLowerCase() === keyword.toLowerCase() ? (
            <span key={i} style={{ background: '#ffeb3b', color: '#222' }}>{part}</span>
          ) : (
            part
          )
        )}
      </>
    );
  }

  // 한글 조합 중인지 확인하는 함수
  const isKoreanComposing = (text: string): boolean => {
    // 한글 자음/모음만 있는 경우 (조합 중)
    const koreanConsonants = /[ㄱ-ㅎ]/;
    const koreanVowels = /[ㅏ-ㅣ]/;
    
    // 한글 자음이나 모음만 있는 경우 조합 중으로 판단
    if (koreanConsonants.test(text) || koreanVowels.test(text)) {
      // 완성된 한글이 있는지 확인
      const completedKorean = /[가-힣]/;
      return !completedKorean.test(text);
    }
    
    return false;
  };

  // 견적서 스토어에서 데이터 가져오기
  const {
    estimates,
    activeTab,
    setActiveTab,
    addEstimate,
    removeEstimate,
    updateEstimateRows,
    setEstimates,
  } = useEstimateStore();

  // 시공기사 목록 불러오기 함수
  function loadInstallers(): Installer[] {
    try {
      const data = localStorage.getItem('installerList');
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  }

  // 시공기사 추가 함수
  const handleAddInstaller = () => {
    try {
      const existingInstallers = loadInstallers();
      const newInstallerData = {
        id: Date.now(),
        ...newInstaller,
        createdAt: new Date().toISOString()
      };
      
      const updatedInstallers = [...existingInstallers, newInstallerData];
      localStorage.setItem('installerList', JSON.stringify(updatedInstallers));
      setInstallerList(updatedInstallers);
      
      // 거래처 관리에도 추가 (거래처관리-거래처 등록)
      const existingVendors = JSON.parse(localStorage.getItem('vendorList') || '[]');
      
      // 이미 존재하는 거래처인지 확인
      const existingVendor = existingVendors.find((vendor: any) => 
        vendor.name === newInstaller.vendorName && vendor.contact === newInstaller.vendorPhone
      );
      
      if (!existingVendor) {
        const newVendor = {
          id: Date.now(),
          name: newInstaller.vendorName,
          contact: newInstaller.vendorPhone,
          type: '시공업체',
          address: '',
          memo: `시공기사: ${newInstaller.installerName}, 전화번호: ${newInstaller.installerPhone}${newInstaller.vehicleNumber ? `, 차량번호: ${newInstaller.vehicleNumber}` : ''}${newInstaller.memo ? `, 메모: ${newInstaller.memo}` : ''}`,
          createdAt: new Date().toISOString()
        };
        
        const updatedVendors = [...existingVendors, newVendor];
        localStorage.setItem('vendorList', JSON.stringify(updatedVendors));
      }
      
      // 폼 초기화
      setNewInstaller({
        vendorName: '',
        vendorPhone: '',
        installerName: '',
        installerPhone: '',
        vehicleNumber: '',
        memo: ''
      });
      
      setInstallerModalOpen(false);
      setSnackbarMessage('시공기사가 추가되었습니다. 거래처관리에도 등록되었습니다.');
      setSnackbarOpen(true);
    } catch (error) {
      console.error('시공기사 추가 실패:', error);
      setSnackbarMessage('시공기사 추가에 실패했습니다.');
      setSnackbarOpen(true);
    }
  };

  // 연결된 옵션들의 세부내용 가져오기 함수
  const getConnectedOptionDetails = (rowData: any) => {
    const currentRows = estimates[activeTab]?.rows || [];
    const connectedOptions = currentRows.filter((row: any) => 
      row.type === 'option' && row.productId === rowData.id
    );
    
    if (connectedOptions.length === 0) return '';
    
    const optionDetails = connectedOptions.map((option: any) => {
      const optionName = option.productName || option.optionLabel || '';
      const quantity = option.quantity || 1;
      return quantity > 1 ? `${optionName} ${quantity}개` : optionName;
    });
    
    return optionDetails.join(', ');
  };

  // 공간명 생성 함수 (나누기 기능용)
  const generateSpaceNames = (baseSpaceName: string, count: number): string[] => {
    const spaceNames: string[] = [];
    
    for (let i = 1; i <= count; i++) {
      if (count === 1) {
        spaceNames.push(baseSpaceName);
      } else {
        spaceNames.push(`${baseSpaceName}-${i}`);
      }
    }
    
    return spaceNames;
  };

  // 제품 이동 함수들
  const moveProductUp = (productIndex: number) => {
    const currentRows = estimates[activeTab]?.rows || [];
    const productGroups = getProductGroups(currentRows);
    
    if (productIndex <= 0 || productIndex >= productGroups.length) return;
    
    const newRows: any[] = [];
    
    // 1. 현재 그룹 이전의 모든 그룹들을 먼저 추가
    for (let i = 0; i < productIndex - 1; i++) {
      const group = productGroups[i];
      const groupItems = currentRows.slice(group.startIndex, group.endIndex + 1);
      newRows.push(...groupItems);
    }
    
    // 2. 현재 그룹을 추가
    const currentGroup = productGroups[productIndex];
    const currentGroupItems = currentRows.slice(currentGroup.startIndex, currentGroup.endIndex + 1);
    newRows.push(...currentGroupItems);
    
    // 3. 이전 그룹을 추가
    const prevGroup = productGroups[productIndex - 1];
    const prevGroupItems = currentRows.slice(prevGroup.startIndex, prevGroup.endIndex + 1);
    newRows.push(...prevGroupItems);
    
    // 4. 나머지 그룹들을 추가
    for (let i = productIndex + 1; i < productGroups.length; i++) {
      const group = productGroups[i];
      const groupItems = currentRows.slice(group.startIndex, group.endIndex + 1);
      newRows.push(...groupItems);
    }
    
    updateEstimateRows(activeTab, newRows);
  };

  const moveProductDown = (productIndex: number) => {
    const currentRows = estimates[activeTab]?.rows || [];
    const productGroups = getProductGroups(currentRows);
    
    if (productIndex < 0 || productIndex >= productGroups.length - 1) return;
    
    const newRows: any[] = [];
    
    // 1. 현재 그룹 이전의 모든 그룹들을 먼저 추가
    for (let i = 0; i < productIndex; i++) {
      const group = productGroups[i];
      const groupItems = currentRows.slice(group.startIndex, group.endIndex + 1);
      newRows.push(...groupItems);
    }
    
    // 2. 다음 그룹을 추가
    const nextGroup = productGroups[productIndex + 1];
    const nextGroupItems = currentRows.slice(nextGroup.startIndex, nextGroup.endIndex + 1);
    newRows.push(...nextGroupItems);
    
    // 3. 현재 그룹을 추가
    const currentGroup = productGroups[productIndex];
    const currentGroupItems = currentRows.slice(currentGroup.startIndex, currentGroup.endIndex + 1);
    newRows.push(...currentGroupItems);
    
    // 4. 나머지 그룹들을 추가
    for (let i = productIndex + 2; i < productGroups.length; i++) {
      const group = productGroups[i];
      const groupItems = currentRows.slice(group.startIndex, group.endIndex + 1);
      newRows.push(...groupItems);
    }
    
    updateEstimateRows(activeTab, newRows);
  };

  // 제품 그룹을 찾는 함수 (제품 + 연결된 옵션들) - 강화된 버전
  const getProductGroups = (rows: any[]) => {
    const groups: Array<{ product: any; options: any[]; startIndex: number; endIndex: number }> = [];
    let currentGroup: { product: any; options: any[]; startIndex: number; endIndex: number } | null = null;
    
    rows.forEach((row, index) => {
      // row가 undefined이거나 null인 경우 건너뛰기
      if (!row) return;
      
      if (row.type === 'product') {
        // 이전 그룹이 있으면 저장
        if (currentGroup) {
          (currentGroup as any).endIndex = index - 1;
          groups.push(currentGroup);
        }
        
        // 새 그룹 시작
        currentGroup = {
          product: row,
          options: [],
          startIndex: index,
          endIndex: index
        };
      } else if (row.type === 'option' && currentGroup) {
        // productId로 정확한 연결 확인 (안전성 강화)
        if (row.productId === (currentGroup as any).product.id) {
          (currentGroup as any).options.push(row);
          (currentGroup as any).endIndex = index;
        } else {
          // productId가 없거나 다른 제품의 옵션인 경우 경고 로그 (개발 환경에서만)
          if (process.env.NODE_ENV === 'development') {
            console.warn('옵션이 제품과 연결되지 않음:', {
              optionId: row.id,
              optionName: row.optionName || row.optionLabel,
              expectedProductId: (currentGroup as any).product.id,
              actualProductId: row.productId
            });
          }
        }
      }
    });
    
    // 마지막 그룹 저장
    if (currentGroup) {
      groups.push(currentGroup);
    }
    
    return groups;
  };

  // 제품 번호 가져오기 함수
  const getProductNumber = (row: any) => {
    const currentRows = estimates[activeTab]?.rows || [];
    const productRows = currentRows.filter(r => r && r.type === 'product');
    const productIndex = productRows.findIndex(r => r && r.id === row.id);
    return productIndex >= 0 ? productIndex + 1 : null;
  };

  // 기존 옵션들의 productId 복구 함수 (데이터 무결성 보장)
  const repairOptionProductIds = (rows: any[]) => {
    const repairedRows = [...rows];
    let currentProductId: number | undefined = undefined;
    
    repairedRows.forEach((row, index) => {
      if (row.type === 'product') {
        currentProductId = row.id;
      } else if (row.type === 'option' && currentProductId !== undefined) {
        // productId가 없거나 잘못된 경우 복구
        if (!row.productId || row.productId !== currentProductId) {
          repairedRows[index] = {
            ...row,
            productId: currentProductId
          };
          if (process.env.NODE_ENV === 'development') {
            console.log('옵션 productId 복구:', {
              optionId: row.id,
              optionName: row.optionName || row.optionLabel,
              oldProductId: row.productId,
              newProductId: currentProductId
            });
          }
        }
      }
    });
    
    return repairedRows;
  };

  // 세부내용 실시간 업데이트 함수
  const updateDetailsInRealTime = (rowData: any) => {
    let baseDetails = '';
    
    // 커튼 제품의 경우 주름방식과 폭수만 포함
    if (rowData.productType === '커튼') {
      const pleatType = rowData.pleatType || '';
      const widthCount = rowData.widthCount;
      
      if (pleatType) {
        baseDetails = pleatType;
      }
      
      if (widthCount && widthCount !== 0 && widthCount !== '0' && widthCount !== '') {
        if (baseDetails) {
          baseDetails += `, ${widthCount}폭`;
        } else {
          baseDetails = `${widthCount}폭`;
        }
      }
    } else if (rowData.productType === '블라인드') {
      // 블라인드 제품의 경우 기존 세부내용을 사용하지 않음
      baseDetails = '';
    } else {
      // 기타 제품의 경우 기존 세부내용 사용
      baseDetails = rowData.details || '';
    }
    
    // 연결된 옵션들의 세부내용 추가
    const connectedOptionDetails = getConnectedOptionDetails(rowData);
    
    if (connectedOptionDetails) {
      if (baseDetails) {
        return `${baseDetails}, ${connectedOptionDetails}`;
      } else {
        return connectedOptionDetails;
      }
    }
    
    return baseDetails;
  };

  // 견적서 스토어 상태 변화 추적 (개발 환경에서만)
  // 주석 처리하여 반복 로그 방지
  // useEffect(() => {
  //   if (process.env.NODE_ENV === 'development') {
  //     console.log('견적서 스토어 상태 변화:', { 
  //       estimatesCount: estimates.length, 
  //       activeTab,
  //       estimates: estimates.map(e => ({ id: e.id, name: e.name }))
  //     });
  //   }
  // }, [estimates, activeTab]);

  // 디버깅: 견적서 스토어 상태 확인 (개발 환경에서만)
  // 주석 처리하여 반복 로그 방지
  // if (process.env.NODE_ENV === 'development') {
  //   console.log('견적서 스토어 상태:', { estimates, activeTab });
  //   console.log('현재 견적서:', estimates[activeTab]);
  //   console.log('현재 견적서 행 수:', estimates[activeTab]?.rows?.length);
  // }

  const formulas = useEstimateStore(s => s.formulas);
  const [productSearch, setProductSearch] = useState('');
  const [estimateSearch, setEstimateSearch] = useState('');
  const [estimateSearchTab, setEstimateSearchTab] = useState<
    'current' | 'saved'
  >('current');
  const [savedEstimateSearch, setSavedEstimateSearch] = useState('');
  const [showSavedEstimates, setShowSavedEstimates] = useState(true);
  const [productOptions, setProductOptions] = useState<any[]>([]);
  const [productDialogOpen, setProductDialogOpen] = useState(false);

  // 개선된 제품검색을 위한 상태들
  const [selectedProductCategories, setSelectedProductCategories] = useState<string[]>([]);
  const [selectedVendors, setSelectedVendors] = useState<string[]>([]);
  const [selectedBrands, setSelectedBrands] = useState<string[]>([]);
  const [productSearchText, setProductSearchText] = useState('');
  const [productSearchStep, setProductSearchStep] = useState<'vendor' | 'category' | 'brand' | 'search'>('vendor');

  // 드롭다운 옵션들
  const curtainTypeOptions = ['겉커튼', '속커튼'];
  const pleatTypeOptions = ['민자', '나비'];
  const lineDirectionOptions = ['좌', '우', '없음'];
  const lineLengthOptions = ['90cm', '120cm', '150cm', '180cm', '210cm', '직접입력'];

  // 빈 제품 행 추가 함수
  const handleAddEmptyProductRow = () => {
    const emptyProduct: EstimateRow = {
      id: Date.now(),
      type: 'product',
      vendor: '',
      brand: '',
      space: '',
      productType: '',
      curtainType: '',
      pleatType: '',
      productName: '',
      width: '',
      details: '',
      widthMM: 0,
      heightMM: 0,
      area: 0,
      lineDir: '',
      lineLen: '',
      pleatAmount: '',
      widthCount: 0,
      quantity: 0,
      totalPrice: 0,
      salePrice: 0,
      cost: 0,
      purchaseCost: 0,
      margin: 0,
      note: '',
      productCode: ''
    };
    
    const currentRows = estimates[activeTab]?.rows || [];
    const updatedRows = [...currentRows, emptyProduct];
    updateEstimateRows(activeTab, updatedRows);
    
    // 새 행으로 스크롤
    setTimeout(() => {
      const tableContainer = document.querySelector('.MuiTableContainer-root');
      if (tableContainer) {
        tableContainer.scrollTop = tableContainer.scrollHeight;
      }
    }, 100);
  };

  // 제품검색 개선을 위한 추가 상태들
  const [productSearchFilters, setProductSearchFilters] = useState({
    category: '',
    vendor: '',
    brand: '',
    searchText: ''
  });
  const [productSearchHistory, setProductSearchHistory] = useState<string[]>([]);
  const [pinnedSearchTerms, setPinnedSearchTerms] = useState<string[]>([]);
  const [isProductSearching, setIsProductSearching] = useState(false);
  const [productSearchError, setProductSearchError] = useState<string>('');
  const [productSearchResults, setProductSearchResults] = useState<any[]>([]);
  const [snackbarMessage, setSnackbarMessage] = useState<string>('');
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [productSelectionCounts, setProductSelectionCounts] = useState<{ [key: number]: number }>({});
  const [estimateDialogOpen, setEstimateDialogOpen] = useState(false);

  // 견적서 편집 모드 상태
  const [isEstimateEditMode, setIsEstimateEditMode] = useState(false);

  // 저장된 견적서 목록 표시항목 설정 상태
  const [savedEstimateColumnVisibility, setSavedEstimateColumnVisibility] = useState({
    address: true,
    customerName: true,
    contact: true,
    estimateNo: true,
    estimateDate: true,
    installationDate: true,
    totalAmount: true,
    discountedAmount: true,
    actions: true
  });

  // 모바일용 저장된 견적서 목록 표시항목 (주소, 연락처, 시공일자, 할인후금액, 액션만)
  const mobileSavedEstimateColumnVisibility = {
    address: true,
    customerName: false,
    contact: true,
    estimateNo: false,
    estimateDate: false,
    installationDate: true,
    totalAmount: false,
    discountedAmount: true,
    actions: true
  };
  const [savedEstimateColumnSettingsOpen, setSavedEstimateColumnSettingsOpen] = useState(false);

  // 시공기사 관련 상태
  const [installerModalOpen, setInstallerModalOpen] = useState(false);
  const [installerList, setInstallerList] = useState<any[]>([]);
  const [newInstaller, setNewInstaller] = useState({
    vendorName: '',
    vendorPhone: '',
    installerName: '',
    installerPhone: '',
    vehicleNumber: '',
    memo: ''
  });

  // AS접수 관련 상태
  const [asModalOpen, setAsModalOpen] = useState(false);
  const [selectedEstimateForAS, setSelectedEstimateForAS] = useState<any>(null);
  const [asRequest, setAsRequest] = useState<Partial<ASRequest>>({
    asRequestDate: getLocalDate(),
    selectedProducts: [],
    processingMethod: '거래처AS',
    problem: '',
    solution: '',
    cost: 0,
    memo: '',
    isCompleted: false
  });

  // AS상태 편집 모달 관련 상태
  const [asEditModalOpen, setAsEditModalOpen] = useState(false);
  const [selectedASRequest, setSelectedASRequest] = useState<ASRequest | null>(null);
  const [editingASRequest, setEditingASRequest] = useState<Partial<ASRequest>>({});

  // AS접수 출력 모달 관련 상태
  const [asPrintModalOpen, setAsPrintModalOpen] = useState(false);
  const [asPrintMenuAnchorEl, setAsPrintMenuAnchorEl] = useState<null | HTMLElement>(null);
  const [asPrintMenuOpen, setAsPrintMenuOpen] = useState(false);
  const [selectedASRequestForPrint, setSelectedASRequestForPrint] = useState<ASRequest | null>(null);

  // 발주서 출력 메뉴 관련 상태
  const [printMenuAnchorEl, setPrintMenuAnchorEl] = useState<null | HTMLElement>(null);
  const [printMenuOpen, setPrintMenuOpen] = useState(false);
  const [selectedVendorForPrint, setSelectedVendorForPrint] = useState<string>('');
  const [purchaseOrderPrintModalOpen, setPurchaseOrderPrintModalOpen] = useState(false);
  const [editablePurchaseOrderModalOpen, setEditablePurchaseOrderModalOpen] = useState(false);
  const [editablePurchaseOrderData, setEditablePurchaseOrderData] = useState<any[]>([]);
  const [editablePurchaseOrderVendor, setEditablePurchaseOrderVendor] = useState<string>('');
  
  // 발주서 납품 관련 상태
  const [deliveryMethod, setDeliveryMethod] = useState<string>('직접배송');
  const [deliveryDate, setDeliveryDate] = useState<string>(getLocalDate());
  const [additionalNotes, setAdditionalNotes] = useState<string>('');
  
  // 발주서 기본 정보 상태
  const [purchaseOrderName, setPurchaseOrderName] = useState<string>('');

  // 발주경로 설정 상태
  const [purchasePathSettings, setPurchasePathSettings] = useState<{[key: string]: {purchasePath: 'product' | 'option', excludeFromPurchase: boolean}}>({});

  // 수금내역 관련 상태
  const [paymentModalOpen, setPaymentModalOpen] = useState(false);
  const [selectedEstimateForPayment, setSelectedEstimateForPayment] = useState<any>(null);
  const [paymentRecord, setPaymentRecord] = useState<Partial<PaymentRecord>>({
    paymentDate: getLocalDate(),
    paymentMethod: '',
    amount: 0,
    remainingAmount: 0,
    refundAmount: 0,
    refundMethod: '',
    refundDate: getLocalDate(),
    refundMemo: ''
  });

  // AS접수 및 수금내역 데이터 (견적번호별 관리)
  const [asRequests, setAsRequests] = useState<{[estimateId: string]: ASRequest[]}>({});
  const [paymentRecords, setPaymentRecords] = useState<{[estimateId: string]: PaymentRecord[]}>({});

  // 견적서 우클릭 메뉴 상태
  const [estimateContextMenu, setEstimateContextMenu] = useState<{
    mouseX: number;
    mouseY: number;
    estimate: any;
    selectedRow?: any;
  } | null>(null);

  // 블라인드 나누기 관련 상태
  const [divideModalOpen, setDivideModalOpen] = useState(false);
  const [divideType, setDivideType] = useState<'split' | 'copy'>('split');
  const [divideCount, setDivideCount] = useState(2);
  const [selectedRowForDivide, setSelectedRowForDivide] = useState<any>(null);

  // 견적서 탭 컨텍스트 메뉴 상태
  const [tabContextMenu, setTabContextMenu] = useState<{
    mouseX: number;
    mouseY: number;
    estimateIndex: number;
  } | null>(null);

  // 계약 관련 상태
  const [contractListModalOpen, setContractListModalOpen] = useState(false);
  const [showEstimateTemplate, setShowEstimateTemplate] = useState(false);
  const [selectedContract, setSelectedContract] = useState<Contract | null>(null);
  const [optionDialogOpen, setOptionDialogOpen] = useState(false);
  const [optionTab, setOptionTab] = useState(0);
  const [optionSearch, setOptionSearch] = useState('');
  const [optionResults, setOptionResults] = useState<any[]>([]);
  const [optionSearchTab, setOptionSearchTab] = useState<number>(0);
  const [optionQuantity, setOptionQuantity] = useState<number>(1); // 시공 옵션 수량
  const [editRowIdx, setEditRowIdx] = useState<number | null>(null);
  const [editRow, setEditRow] = useState<any>(null);
  const [editOpen, setEditOpen] = useState(false);
  const [recommendedPleatCount, setRecommendedPleatCount] = useState<number>(0);
  const [recommendedPleatAmount, setRecommendedPleatAmount] = useState<string>('');
  const [userModifiedWidthCount, setUserModifiedWidthCount] = useState<boolean>(false);
  const [filterModalOpen, setFilterModalOpen] = useState(false);
  const [activeFilters, setActiveFilters] = useState<FilterState>(() => {
    try {
      const saved = localStorage.getItem('estimateActiveFilters');
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  });
  const [columnVisibility, setColumnVisibility] = useState<{ [key: string]: boolean }>(() => {
    try {
      // 기본값을 "현재 표시 중인 컬럼들"로 설정한다: FILTER_FIELDS의 visible을 모두 true로 둔 기존 방식 대신,
      // 사용자가 마지막으로 보던 상태가 있으면 그걸 사용하고, 없으면 현재 테이블 렌더 기준으로 모두 표시(true)로 시작
      const saved = localStorage.getItem('estimateColumnVisibility');
      if (saved) return JSON.parse(saved);
      
      // 저장된 기본값이 있으면 사용
      const savedDefault = localStorage.getItem('estimateListDisplayDefault');
      if (savedDefault) {
        try {
          return JSON.parse(savedDefault);
        } catch (e) {
          console.error('저장된 기본값 파싱 실패:', e);
        }
      }
      
      // 이미지 기준 기본 체크 세트 적용
      const initial: { [key: string]: boolean } = { ...DEFAULT_COLUMN_VISIBILITY };
      return initial;
    } catch {
      const initial: { [key: string]: boolean } = { ...DEFAULT_COLUMN_VISIBILITY };
      return initial;
    }
  });

  const [showDiscount, setShowDiscount] = useState(false);
  const [discountAmount, setDiscountAmount] = useState('');
  const [discountRate, setDiscountRate] = useState('');
  const [discountedTotalInput, setDiscountedTotalInput] = useState('');
  // 확정금액(VAT포함) 인풋 상태
  const [finalizedAmount, setFinalizedAmount] = useState('');
  const [outputAnchorEl, setOutputAnchorEl] = useState<null | HTMLElement>(
    null
  );
  const [selectedProductIdx, setSelectedProductIdx] = useState<number | null>(
    null
  );
  // 견적서 템플릿 표시 상태 (기존 변수와 중복 제거)
  // 1. 상태 추가
  const [periodMode, setPeriodMode] = useState<
    'all' | 'week' | 'month' | 'quarter' | 'half' | 'year'
  >('all');
  const [selectedYear, setSelectedYear] = useState<string>('');
  const [selectedQuarter, setSelectedQuarter] = useState<string>('1');
  const [selectedHalf, setSelectedHalf] = useState<string>('1');
  const [templateDialogOpen, setTemplateDialogOpen] = useState(false);
  const [customerListDialogOpen, setCustomerListDialogOpen] = useState(false);
  
  // 계약서 출력 관련 상태
  const contractPrintRef = useRef<HTMLDivElement>(null);
  const [contractTemplateOpen, setContractTemplateOpen] = useState(false);
  const [selectedContractForPrint, setSelectedContractForPrint] = useState<any>(null);
  const [contractPrintMenuAnchorEl, setContractPrintMenuAnchorEl] = useState<null | HTMLElement>(null);
  const [contractPrintMenuOpen, setContractPrintMenuOpen] = useState(false);
  const [selectedContractForPrintMenu, setSelectedContractForPrintMenu] = useState<any>(null);
  
  // 인필드 편집을 위한 상태 변수들
  const [editingCell, setEditingCell] = useState<{ rowIndex: number; field: string } | null>(null);
  const [editingValue, setEditingValue] = useState('');
  const [editingCustomValue, setEditingCustomValue] = useState('');
  
  // 드롭다운 메뉴 관련 상태 변수들
  const [rowContextMenu, setRowContextMenu] = useState<{
    mouseX: number;
    mouseY: number;
    rowIndex: number;
    row: any;
  } | null>(null);
  
  const [editingEstimateIdx, setEditingEstimateIdx] = useState<number | null>(
    null
  );
  const [editingEstimateName, setEditingEstimateName] = useState('');
  const [editingEstimateNo, setEditingEstimateNo] = useState('');
  const [estimateTabSettingsOpen, setEstimateTabSettingsOpen] = useState(false);
  const [estimateListSettingsOpen, setEstimateListSettingsOpen] =
    useState(false);
    useEffect(() => {
      try {
        localStorage.setItem('estimateColumnVisibility', JSON.stringify(columnVisibility));
      } catch (e) {
        console.error('컬럼 표시 설정 저장 실패:', e);
      }
    }, [columnVisibility]);
  // 공간 설정 모달 상태
  const [spaceSettingsOpen, setSpaceSettingsOpen] = useState(false);

  // 계약서 관련 상태
  const [contractEditModalOpen, setContractEditModalOpen] = useState(false);
  const [selectedContractForEdit, setSelectedContractForEdit] = useState<any>(null);

  // 고객리스트 검색 상태 추가
  const [customerSearch, setCustomerSearch] = useState('');

  // 옵션 정렬 관련 상태
  const [optionSortBy, setOptionSortBy] = useState<'vendor' | 'optionName' | 'salePrice'>(() => {
    try {
      return localStorage.getItem('optionSortBy') as 'vendor' | 'optionName' | 'salePrice' || 'vendor';
    } catch {
      return 'vendor';
    }
  });
  const [optionSortOrder, setOptionSortOrder] = useState<'asc' | 'desc'>(() => {
    try {
      return localStorage.getItem('optionSortOrder') as 'asc' | 'desc' || 'asc';
    } catch {
      return 'asc';
    }
  });
  const [optionSortKoreanFirst, setOptionSortKoreanFirst] = useState(() => {
    try {
      return localStorage.getItem('optionSortKoreanFirst') === 'true';
    } catch {
      return true;
    }
  });

  // 정렬 설정 변경 시 localStorage에 저장
  useEffect(() => {
    try {
      localStorage.setItem('optionSortBy', optionSortBy);
      localStorage.setItem('optionSortOrder', optionSortOrder);
      localStorage.setItem('optionSortKoreanFirst', optionSortKoreanFirst.toString());
    } catch (error) {
      console.error('정렬 설정 저장 실패:', error);
    }
  }, [optionSortBy, optionSortOrder, optionSortKoreanFirst]);

  // 인필드 편집을 위한 함수들
  const calculateInputWidth = (value: string, minWidth: number, maxWidth: number): number => {
    const baseWidth = value.length * 8 + 20; // 기본 폰트 크기 기준
    return Math.max(minWidth, Math.min(maxWidth, baseWidth));
  };

  const handleCellEdit = (rowIndex: number, field: string, value: string) => {
    const currentRows = [...estimates[activeTab].rows];
    if (currentRows[rowIndex]) {
      // 가로/세로 필드에 대해 수식 계산 적용
      if ((field === 'widthMM' || field === 'heightMM') && typeof value === 'string' && (value.includes('+') || value.includes('-') || value.includes('*') || value.includes('/'))) {
        const calculatedValue = calculateExpression(value);
        if (calculatedValue !== null) {
          console.log(`테이블 편집 수식 계산: ${value} = ${calculatedValue}`);
          value = calculatedValue.toString();
        }
      }
      
      const updatedRow = { ...currentRows[rowIndex], [field]: value };
      
      // 겉커튼 폭수 변경 시 주름양 재계산
      if (field === 'widthCount' && updatedRow.productType === '커튼' && updatedRow.curtainType === '겉커튼') {
        const widthCount = Number(value) || 0;
        const widthMM = Number(updatedRow.widthMM) || 0;
        
        if (widthCount > 0 && widthMM > 0) {
          // 제품 정보 찾기
          const product = productOptions.find(p => p.productCode === updatedRow.productCode);
          const productWidth = product ? Number(product.width) || 0 : 0;
          
          // 주름양 계산
          let calculatedPleatAmount = '';
          if (updatedRow.pleatType === '민자' || updatedRow.pleatType === '나비') {
            calculatedPleatAmount = calculatePleatAmountForGgeotCurtain(widthMM, widthCount, productWidth);
          } else {
            calculatedPleatAmount = getPleatAmount(widthMM, productWidth, updatedRow.pleatType, updatedRow.curtainType, widthCount);
          }
          
          updatedRow.pleatAmount = calculatedPleatAmount || '';
        }
      }
      
      // 세부내용 자동 업데이트 (주름방식, 폭수 등이 변경될 때)
      if (['curtainType', 'pleatType', 'widthCount', 'pleatAmount', 'pleatMultiplier'].includes(field)) {
        updatedRow.details = generateAutoDetails(updatedRow);
      }
      
      // 면적 변경 시 금액 재계산
      if (field === 'area') {
        // 블라인드 제품에서 면적을 직접 수정한 경우, 수동 입력 플래그 설정 및 숫자형으로 반영
        if (updatedRow.productType === '블라인드') {
          (updatedRow as any).isManualArea = true;
        }
        const areaNum = Number(String(value).replace(/,/g, '')) || 0;
        // area 필드를 숫자값으로 저장하여 이후 계산 및 표시 포맷 일관성 유지
        (updatedRow as any).area = areaNum;
        const quantity = Number(updatedRow.quantity) || 1;
        
        // 판매가 계산
        let basePrice = 0;
        if (updatedRow.salePrice && areaNum) {
          basePrice = Math.round(updatedRow.salePrice * areaNum);
        } else if (updatedRow.salePrice) {
          basePrice = updatedRow.salePrice;
        }
        updatedRow.totalPrice = basePrice * quantity;
        
        // 원가 계산
        let baseCost = 0;
        if (updatedRow.purchaseCost && areaNum) {
          baseCost = Math.round(updatedRow.purchaseCost * areaNum);
        } else if (updatedRow.purchaseCost) {
          baseCost = updatedRow.purchaseCost;
        }
        updatedRow.cost = baseCost * quantity;
        
        // 마진 계산
        updatedRow.margin = Math.round(updatedRow.totalPrice / 1.1 - updatedRow.cost);
      }
      // 블라인드에서 가로/세로가 변경되면 수동 면적 플래그 해제 (자동계산으로 복귀)
      if ((field === 'widthMM' || field === 'heightMM') && updatedRow.productType === '블라인드') {
        if ((updatedRow as any).isManualArea) {
          (updatedRow as any).isManualArea = false;
        }
      }
      
      currentRows[rowIndex] = updatedRow;
      updateEstimateRows(activeTab, currentRows);
    }
    setEditingCell(null);
    setEditingValue('');
    setEditingCustomValue('');
  };

  const handleCellCancel = () => {
    setEditingCell(null);
    setEditingValue('');
    setEditingCustomValue('');
  };

  // 옵션 정렬 함수
  const sortOptions = (options: any[]) => {
    return [...options].sort((a, b) => {
      let aVal: any;
      let bVal: any;

      switch (optionSortBy) {
        case 'vendor':
          aVal = a.vendor || '';
          bVal = b.vendor || '';
          break;
        case 'optionName':
          aVal = a.optionName || '';
          bVal = b.optionName || '';
          break;
        case 'salePrice':
          aVal = a.salePrice || 0;
          bVal = b.salePrice || 0;
          break;
        default:
          aVal = a.vendor || '';
          bVal = b.vendor || '';
      }

      // 숫자 정렬
      if (typeof aVal === 'number' && typeof bVal === 'number') {
        return optionSortOrder === 'asc' ? aVal - bVal : bVal - aVal;
      }

      // 문자열 정렬 (한글 우선 옵션이 켜져있고 vendor 정렬일 때만)
      if (typeof aVal === 'string' && typeof bVal === 'string' && optionSortBy === 'vendor' && optionSortKoreanFirst) {
        const isKoreanA = /[가-힣]/.test(aVal);
        const isKoreanB = /[가-힣]/.test(bVal);
        
        // 한글이 우선
        if (isKoreanA && !isKoreanB) return -1;
        if (!isKoreanA && isKoreanB) return 1;
        
        // 둘 다 한글이거나 둘 다 영문인 경우 사전순 정렬
        return optionSortOrder === 'asc' 
          ? aVal.localeCompare(bVal, 'ko') 
          : bVal.localeCompare(aVal, 'ko');
      }

      // 일반 문자열 정렬
      if (typeof aVal === 'string' && typeof bVal === 'string') {
        return optionSortOrder === 'asc' 
          ? aVal.localeCompare(bVal, 'ko') 
          : bVal.localeCompare(aVal, 'ko');
      }

      return 0;
    });
  };

  // 제품 선택/해제 핸들러
  const handleProductSelection = (productId: number) => {
    setSelectedProducts(prev => {
      const newSet = new Set(prev);
      if (newSet.has(productId)) {
        newSet.delete(productId);
      } else {
        newSet.add(productId);
      }
      return newSet;
    });
  };

  // 전체 선택/해제 핸들러
  const handleSelectAllProducts = () => {
    if (selectedProducts.size === productSearchResults.length) {
      setSelectedProducts(new Set());
    } else {
      setSelectedProducts(new Set(productSearchResults.map(p => p.id)));
    }
  };

  // 제품 선택 횟수 업데이트 함수
  const updateProductSelectionCount = (productId: number) => {
    setProductSelectionCounts(prev => {
      const newCounts = {
        ...prev,
        [productId]: (prev[productId] || 0) + 1
      };
      localStorage.setItem('productSelectionCounts', JSON.stringify(newCounts));
      return newCounts;
    });
  };

  // 선택된 제품들을 견적서에 일괄 추가
  const handleAddSelectedProducts = () => {
    if (selectedProducts.size === 0) {
      alert('추가할 제품을 선택해주세요.');
      return;
    }

    // 일괄변경 모드인 경우
    if (isBulkEditProductSelection) {
      if (selectedProducts.size !== 1) {
        alert('일괄변경을 위해서는 하나의 제품만 선택해주세요.');
        return;
      }

      const selectedProduct = productSearchResults.find(p => selectedProducts.has(p.id));
      if (!selectedProduct) {
        alert('선택된 제품을 찾을 수 없습니다.');
        return;
      }

      // 일괄변경 실행
      const currentRows = [...estimates[activeTab].rows];
      const updatedRows = currentRows.map((row, index) => {
        if (selectedRowsForBulkEdit.has(index) && row.type === 'product') {
          return {
            ...row,
            productName: selectedProduct.productName,
            productType: selectedProduct.category || row.productType,
            vendor: selectedProduct.vendorName || row.vendor,
            brand: selectedProduct.brand || row.brand,
            width: selectedProduct.width || row.width,
            details: selectedProduct.details || row.details,
            curtainType: selectedProduct.category === '커튼'
              ? selectedProduct.insideOutside === '속' ? '속커튼' : '겉커튼'
              : row.curtainType,
            pleatType: selectedProduct.category === '커튼'
              ? selectedProduct.insideOutside === '속' ? '나비' : '민자'
              : row.pleatType,
            pleatAmount: selectedProduct.category === '커튼' && 
              selectedProduct.insideOutside === '속' ? '1.8~2' : row.pleatAmount,
          };
        }
        return row;
      });

      updateEstimateRows(activeTab, updatedRows);
      
      // 일괄변경 완료 후 상태 초기화
      setIsBulkEditMode(false);
      setSelectedRowsForBulkEdit(new Set());
      setIsBulkEditProductSelection(false);
      setSelectedProducts(new Set());
      setProductDialogOpen(false);
      
      setSnackbar({
        open: true,
        message: `${selectedRowsForBulkEdit.size}개 제품이 "${selectedProduct.productName}"으로 변경되었습니다.`,
      });
      
      return;
    }

    // 일반 제품 추가 모드
    console.log('선택된 제품 ID들:', Array.from(selectedProducts));
    console.log('검색 결과 제품들:', productSearchResults.map(p => ({ id: p.id, name: p.productName })));

    const selectedProductList = productSearchResults.filter(p => selectedProducts.has(p.id));
    console.log('필터링된 선택 제품들:', selectedProductList.map(p => ({ id: p.id, name: p.productName })));

    // 선택된 제품들의 선택 횟수 업데이트
    selectedProductList.forEach(product => {
      updateProductSelectionCount(product.id);
    });

    const newRows: EstimateRow[] = selectedProductList.map(product => {
      const curtainType = product.category === '커튼'
        ? product.insideOutside === '속'
          ? '속커튼'
          : '겉커튼'
        : '';
      
      const pleatType = product.category === '커튼'
        ? product.insideOutside === '속'
          ? '나비'
          : '민자'
        : '';

      const newRow: EstimateRow = {
        id: Date.now() + Math.random(), // 고유 ID 생성
        type: 'product',
        vendor: product.vendorName || '',
        brand: product.brand || '',
        space: '',
        productType: product.category || '',
        curtainType: curtainType,
        pleatType: pleatType,
        productName: product.productName || '',
        width: product.width || '',
        details: product.details || '',
      widthMM: 0,
      heightMM: 0,
      area: 0,
      lineDir: '',
      lineLen: '',
      pleatAmount: product.category === '커튼' && 
        product.insideOutside === '속' ? '1.8~2' : '',
      widthCount: 0,
      quantity: 1,
      totalPrice: 0,
      salePrice: 0,
      cost: 0,
      purchaseCost: 0,
      margin: 0,
      options: [],
      note: '',
      productCode: product.productCode || '',
      largePlainPrice: product.largePlainPrice ?? 0,
      largePlainCost: product.largePlainCost ?? 0,
    };

    // 세부내용 자동입력 적용
    newRow.details = generateAutoDetails(newRow);

    return newRow;
  });

    updateEstimateRows(activeTab, [
      ...estimates[activeTab].rows,
      ...newRows,
    ]);

    setSelectedProducts(new Set()); // 선택 초기화
    // setProductDialogOpen(false); // 모달을 닫지 않음 - 여러 번 제품 추가 가능

    // 성공 메시지 (Snackbar로 표시)
    const message = `${selectedProductList.length}개의 제품이 견적서에 추가되었습니다.`;
    setSnackbarMessage(message);
    setSnackbarOpen(true);
  };

  // 공간 설정 모달 열기 핸들러
  const handleOpenSpaceSettings = () => {
    setSpaceOptions(loadSpaceOptions()); // 최신 공간 옵션 로드
    setSpaceSettingsOpen(true);
  };

  // 고객리스트 최신화 핸들러 추가
  const handleOpenCustomerList = async () => {
    try {
      const customers = await getCustomerList();
      setCustomerOptions(customers);
      setCustomerSearch(''); // 검색어 초기화
      setCustomerListDialogOpen(true);
    } catch (error) {
      console.error('고객리스트 로드 실패:', error);
      alert('고객리스트를 불러오는데 실패했습니다. 다시 시도해주세요.');
    }
  };

  // 계약 선택 핸들러
  const handleSelectContract = (contract: Contract) => {
    setSelectedContract(contract);
    
    console.log('=== 계약 선택 디버깅 ===');
    console.log('선택된 계약:', contract);
    console.log('계약의 estimateNo:', contract.estimateNo);
    
    // 계약과 연결된 견적서 찾기
    const savedEstimates = JSON.parse(localStorage.getItem('saved_estimates') || '[]');
    const linkedEstimate = savedEstimates.find((est: any) => est.estimateNo === contract.estimateNo);
    
    console.log('저장된 견적서 목록:', savedEstimates);
    console.log('계약과 연결된 견적서:', linkedEstimate);
    
    // 견적서 정보 업데이트
    const currentEstimate = estimates[activeTab];
    if (currentEstimate) {
      let updatedEstimate = {
        ...currentEstimate,
        customerName: contract.customerName || '',
        contact: contract.customerContact || '',
        address: contract.customerAddress || '',
        projectName: contract.projectName || '',
        type: contract.projectType || '',
        // 계약 정보 추가
        contractNo: contract.contractNo,
        estimateNo: contract.estimateNo, // 견적서 번호 추가
        estimateDate: getLocalDate(),
      };
    
      // 연결된 견적서가 있으면 견적서의 내용을 우선 사용
      if (linkedEstimate) {
        console.log('견적서 내용으로 견적서 업데이트:', linkedEstimate);
        updatedEstimate = {
          ...updatedEstimate,
          customerName: linkedEstimate.customerName || contract.customerName || '',
          contact: linkedEstimate.contact || contract.customerContact || '',
          address: linkedEstimate.address || contract.customerAddress || '',
          projectName: linkedEstimate.projectName || contract.projectName || '',
          type: linkedEstimate.type || contract.projectType || '',
          emergencyContact: linkedEstimate.emergencyContact || '',
          // 견적서의 rows를 견적서 rows로 변환
          rows: linkedEstimate.rows?.map((item: any, index: number) => {
            // 옵션 분류 로직 개선: type 필드 우선 확인, 키워드 기반 보조 분류
            const optionKeywords = ['레일', '시공', '액세서리', '부속', '부자재', '마감', '마감재', '마감재료', '형상가공', '반자동', '출장비', '커튼시공'];
            
            // 1. type 필드가 있으면 우선 사용
            let isOption = item.type === 'option';
            
            // 2. type 필드가 없거나 'product'인 경우 키워드 기반 분류
            if (!isOption && item.type !== 'product') {
              isOption = optionKeywords.some(keyword => 
                item.productName?.includes(keyword) || 
                item.productType?.includes(keyword) ||
                item.details?.includes(keyword) ||
                item.optionLabel?.includes(keyword)
              );
            }
            
            const convertedRow = {
              id: index + 1,
              type: isOption ? 'option' as const : 'product' as const,
              vendor: item.vendor || '',
              brand: item.brand || '',
              space: item.space || '',
              spaceCustom: item.spaceCustom || '',
              productCode: item.productCode || '',
              productType: item.productType || '',
              curtainType: item.curtainType || '',
              pleatType: item.pleatType || '',
              productName: item.productName || '',
              width: item.width || '',
              details: item.details || '',
              widthMM: item.widthMM || 0,
              heightMM: item.heightMM || 0,
              area: item.area || 0,
              lineDir: item.lineDir || '',
              lineLen: item.lineLen || 0,
              pleatAmount: item.pleatAmount || '',
              widthCount: item.widthCount || 0,
              quantity: item.quantity || 1,
              totalPrice: item.totalPrice || 0,
              salePrice: item.salePrice || 0,
              cost: item.cost || 0,
              purchaseCost: item.purchaseCost || 0,
              margin: item.margin || 0,
              note: item.note || '',
              productionWidth: item.productionWidth || 0,
              productionHeight: item.productionHeight || 0,
            };
            
            // 제품인 경우 세부내용 자동 계산 적용
            if (convertedRow.type === 'product') {
              convertedRow.details = updateDetailsInRealTime(convertedRow);
            }
            
            return convertedRow;
          }) || [],
        };
      } else {
        // 연결된 견적서가 없으면 계약의 아이템들을 사용
        console.log('계약 아이템으로 견적서 업데이트');
        updatedEstimate.rows = contract.items?.map((item: any, index: number) => {
          // 옵션으로 분류할 제품들 (레일, 시공, 기타 액세서리 등)
          const optionKeywords = ['레일', '시공', '액세서리', '부속', '부자재', '마감', '마감재', '마감재료'];
          const isOption = optionKeywords.some(keyword => 
            item.productName?.includes(keyword) || 
            item.productType?.includes(keyword) ||
            item.details?.includes(keyword)
          );
          
          const convertedRow = {
            id: index + 1,
            type: isOption ? 'option' as const : 'product' as const,
            vendor: item.vendor || '',
            brand: item.brand || '',
            space: item.space || '',
            productType: item.productType || '',
            curtainType: item.curtainType || '',
            pleatType: item.pleatType || '',
            productName: item.productName || '',
            width: item.width || '',
            details: item.details || '',
            widthMM: item.widthMM || 0,
            heightMM: item.heightMM || 0,
            area: item.area || 0,
            lineDir: item.lineDir || '',
            lineLen: item.lineLen || 0,
            pleatAmount: item.pleatAmount || '',
            widthCount: item.widthCount || 0,
            quantity: item.quantity || 1,
            totalPrice: item.totalPrice || 0,
            salePrice: item.salePrice || 0,
            cost: item.cost || 0,
            purchaseCost: item.purchaseCost || 0,
            margin: item.margin || 0,
            note: item.note || '',
          };
          
          // 제품인 경우 세부내용 자동 계산 적용
          if (convertedRow.type === 'product') {
            convertedRow.details = updateDetailsInRealTime(convertedRow);
          }
          
          return convertedRow;
        }) || [];
      }
      
      // 견적서 업데이트
      const updatedEstimates = [...estimates];
      updatedEstimates[activeTab] = updatedEstimate;
      setEstimates(updatedEstimates);
      setIsEstimateEditMode(true);
      
      console.log('=== 견적서 업데이트 완료 ===');
      console.log('업데이트된 견적서:', updatedEstimate);
      console.log('견적서에 설정된 estimateNo:', updatedEstimate.estimateNo);
      
      // 계약 목록 모달 닫기
      setContractListModalOpen(false);
      
      // 할인 설정 초기화 (계약서 불러오기 시)
      setDiscountAmount('');
      setDiscountRate('');
      setDiscountedTotalInput('');
      
      // 성공 메시지 표시
      if (linkedEstimate) {
        setSnackbarMessage(`계약과 연결된 견적서(${contract.estimateNo})의 내용이 견적서에 불러와졌습니다. 최종견적서 정보를 확인할 수 있습니다.`);
        setSnackbarOpen(true);
      } else {
        setSnackbarMessage(`계약 내용이 견적서에 불러와졌습니다. (견적번호: ${contract.estimateNo})`);
        setSnackbarOpen(true);
      }
    }
  };

  // Final 견적서 수정/생성을 위한 상태 추가
  const [estimateInfo, setEstimateInfo] = useState({
    name: '',
    estimateNo: '',
    estimateDate: '',
    customerName: '',
    contact: '',
    emergencyContact: '',
    projectName: '',
    type: '',
    address: '',
  });
  const [measurementData, setMeasurementData] = useState<any[]>([]);

  const navigate = useNavigate();
  const { createEstimateNotification } = useNotificationStore();
  const { nickname } = useContext(UserContext);

  // 디버깅을 위한 console.log 추가
  if (editRow) {
    console.log('editRow.vendor:', editRow.vendor);
  }

  // 공간 옵션 상태 (동적으로 로드)
  const [spaceOptions, setSpaceOptions] = useState<string[]>(loadSpaceOptions());

  // 제품검색 다중 선택을 위한 상태
  const [selectedProducts, setSelectedProducts] = useState<Set<number>>(new Set());

  // 견적서 탭 표시 설정
  const [estimateTabDisplay, setEstimateTabDisplay] = useState({
    showEstimateNo: true,
    showEstimateName: false, // 견적서명 표시 비활성화
    showCustomerName: false,
    showProjectName: false,
    showDate: false,
    separator: ' - ',
    maxLength: 20,
  });

  // 견적서 LIST 표시 설정
  const [estimateListDisplay, setEstimateListDisplay] = useState(() => {
    const saved = localStorage.getItem('estimateListDisplay');
    if (saved) return JSON.parse(saved);
    
    // 저장된 기본값이 있으면 사용, 없으면 하드코딩된 기본값 사용
    const savedDefault = localStorage.getItem('estimateListDisplayDefault');
    if (savedDefault) {
      try {
        return JSON.parse(savedDefault);
      } catch (e) {
        console.error('저장된 기본값 파싱 실패:', e);
      }
    }
    
    return {
      showEstimateNo: true,
      showEstimateDate: true,
      showSavedDate: true,
      showCustomerName: true,
      showContact: true,
      showProjectName: true,
      showType: false,
      showAddress: false,
      showProducts: true,
      showTotalAmount: true,
      showDiscountedAmount: false,
      showFinalizedAmount: false,
      showDiscountAmount: true,
      showDiscountRate: true,
      showMargin: true,
      showActions: true,
    };
  });

  // estimateListDisplay 변경 시 localStorage에 저장
  useEffect(() => {
    try {
      localStorage.setItem('estimateListDisplay', JSON.stringify(estimateListDisplay));
    } catch (e) {
      console.error('컬럼 표시 설정 저장 실패:', e);
    }
  }, [estimateListDisplay]);

  // 견적서 LIST 컬럼 순서 설정
  const [estimateListColumnOrder, setEstimateListColumnOrder] = useState(() => {
    const savedOrder = localStorage.getItem('estimateListColumnOrder');
    if (savedOrder) {
      return JSON.parse(savedOrder);
    }
    return [
      'estimateNo',
      'estimateDate',
      'savedDate',
      'customerName',
      'contact',
      'projectName',
      'products',
      'totalAmount',
      'discountedAmount',
      'finalizedAmount',
      'discountAmount',
      'discountRate',
      'margin',
      'actions',
      'address',
    ];
  });

  // 견적서 탭 표시 텍스트 생성 함수
  const generateEstimateTabText = (estimate: Estimate) => {
    const parts: string[] = [];

    if (estimateTabDisplay.showEstimateNo) {
      // final 견적서인 경우 특별한 표시
      const isFinal = estimate.estimateNo.includes('-final');
      parts.push(
        isFinal ? `${estimate.estimateNo} (Final)` : estimate.estimateNo
      );
    }

    if (estimateTabDisplay.showEstimateName) {
      parts.push(estimate.name);
    }

    if (estimateTabDisplay.showCustomerName && estimate.customerName) {
      parts.push(estimate.customerName);
    }

    if (estimateTabDisplay.showProjectName && estimate.projectName) {
      parts.push(estimate.projectName);
    }

    if (estimateTabDisplay.showDate && estimate.estimateDate) {
      parts.push(estimate.estimateDate);
    }

    let text = parts.join(estimateTabDisplay.separator);

    // 최대 길이 제한
    if (text.length > estimateTabDisplay.maxLength) {
      text = text.substring(0, estimateTabDisplay.maxLength) + '...';
    }

    return text || '견적서';
  };

  // final 견적서 여부 확인 함수
  const isFinalEstimate = (estimate: any) => {
    return estimate.estimateNo && estimate.estimateNo.includes('-final');
  };

  // 견적서 그룹 색상과 최신 여부를 반환하는 함수
  const getEstimateGroupInfo = (estimate: any, allEstimates: any[]) => {
    const groups = groupEstimatesByCustomer(allEstimates);
    const key = `${estimate.customerName || ''}-${estimate.contact || ''}-${estimate.address || ''}`;
    const group = groups[key];

    if (!group)
      return {
        colorIndex: 0,
        isLatest: false,
        isFinal: isFinalEstimate(estimate),
      };

    // 그룹의 색상 인덱스 결정 (그룹 키의 해시값 기반)
    const hash = key.split('').reduce((a, b) => {
      a = (a << 5) - a + b.charCodeAt(0);
      return a & a;
    }, 0);
    const colorIndex = Math.abs(hash) % groupColors.length;

    // 최신 견적 여부 확인
    const isLatest = group[0].id === estimate.id;
    const isFinal = isFinalEstimate(estimate);

    return { colorIndex, isLatest, isFinal };
  };

  // meta 상태 초기화
  const [meta, setMeta] = useState(() => {
    const est = estimates[activeTab];
    return {
      estimateNo: est.estimateNo,
      estimateDate: getLocalDate(), // 로컬 시간 기준으로 오늘 날짜 설정
      customerName: est.customerName || '',
      contact: est.contact || '',
      emergencyContact: est.emergencyContact || '',
      projectName: est.projectName || '',
      type: est.type || '',
      address: est.address || '',
    };
  });

    // activeTab이 변경될 때 meta 상태 업데이트
  useEffect(() => {
    // 주석 처리하여 반복 로그 방지
    // if (process.env.NODE_ENV === 'development') {
    //   console.log('=== meta 상태 업데이트 시작 ===');
    //   console.log('activeTab:', activeTab);
    //   console.log('estimates 길이:', estimates.length);
    // }

    if (estimates.length === 0) {
      // console.log('견적서 목록이 비어있어 meta 업데이트를 건너뜁니다.');
      return;
    }

    if (activeTab < 0 || activeTab >= estimates.length) {
      // if (process.env.NODE_ENV === 'development') {
      //   console.log('유효하지 않은 activeTab으로 meta 업데이트를 건너뜁니다.');
      // }
      return;
    }

    const est = estimates[activeTab];
    // console.log('현재 견적서:', est);

    if (est) {
      const newMeta = {
        estimateNo: est.estimateNo,
        estimateDate: est.estimateDate || getLocalDate(),
        customerName: est.customerName || '',
        contact: est.contact || '',
        emergencyContact: est.emergencyContact || '',
        projectName: est.projectName || '',
        type: est.type || '',
        address: est.address || '',
      };
      // console.log('새로운 meta 상태:', newMeta);
      setMeta(newMeta);
    } else {
      // console.log('견적서 정보가 없어 meta 업데이트를 건너뜁니다.');
    }
  }, [activeTab, estimates.length]); // estimates.length만 의존성으로 추가
  const [customerOptions, setCustomerOptions] = useState<any[]>([]);

  // 컴포넌트 마운트 시 고객 데이터 로드
  useEffect(() => {
    const loadCustomerData = async () => {
      try {
        const customers = await getCustomerList();
        setCustomerOptions(customers);
      } catch (error) {
        console.error('고객 데이터 로드 실패:', error);
      }
    };
    loadCustomerData();
  }, []);

  // 고객리스트 검색 필터링
  const filteredCustomerOptions = customerOptions.filter((customer: any) => {
    const searchTerm = customerSearch.trim().toLowerCase();
    if (!searchTerm) return true;

    return (
      customer.name?.toLowerCase().includes(searchTerm) ||
      customer.tel?.toLowerCase().includes(searchTerm) ||
      customer.emergencyTel?.toLowerCase().includes(searchTerm) ||
      customer.address?.toLowerCase().includes(searchTerm) ||
      customer.projects?.some(
        (project: any) =>
          project.projectName?.toLowerCase().includes(searchTerm) ||
          project.projectType?.toLowerCase().includes(searchTerm) ||
          project.address?.toLowerCase().includes(searchTerm)
      )
    );
  });

  // 옵션 타입 로드
  function loadOptionTypes() {
    try {
      const data = localStorage.getItem('erp_option_types');
      if (data) {
        const parsed = JSON.parse(data);
        if (Array.isArray(parsed)) {
          return parsed;
        }
      }
      // 기본값: 탭 순서: 커튼옵션, 블라인드옵션, 커튼전동, 블라인드전동, 헌터옵션, 시공옵션, 기타옵션
      return [
        '커튼옵션',
        '블라인드옵션',
        '커튼전동',
        '블라인드전동',
        '헌터옵션',
        '시공옵션',
        '기타옵션',
      ];
    } catch {
      return [
        '커튼옵션',
        '블라인드옵션',
        '커튼전동',
        '블라인드전동',
        '헌터옵션',
        '시공옵션',
        '기타옵션',
      ];
    }
  }

  const optionTypes = loadOptionTypes();
  const optionTypeMap = optionTypes.map((type: string) =>
    type.replace('옵션', '')
  );

  useEffect(() => {
    setProductOptions(loadProducts());
  }, []);

  // 단계별 제품 검색을 위한 데이터 추출
  const availableCategories = useMemo(() => {
    return Array.from(new Set(productOptions.map(p => p.category).filter(Boolean)));
  }, [productOptions]);

  const availableVendors = useMemo(() => {
    const filteredProducts = selectedProductCategories.length > 0
      ? productOptions.filter(p => selectedProductCategories.includes(p.category))
      : productOptions;
    return Array.from(new Set(filteredProducts.map(p => p.vendorName).filter(Boolean)));
  }, [productOptions, selectedProductCategories]);

  const availableBrands = useMemo(() => {
    const filteredProducts = productOptions.filter(p => {
      const categoryMatch = selectedProductCategories.length === 0 || selectedProductCategories.includes(p.category);
      const vendorMatch = selectedVendors.length === 0 || selectedVendors.includes(p.vendorName);
      return categoryMatch && vendorMatch;
    });
    return Array.from(new Set(filteredProducts.map(p => p.brand).filter(Boolean)));
  }, [productOptions, selectedProductCategories, selectedVendors]);

  // 프로젝트 실측정보에서 견적서 적용 데이터 처리
  useEffect(() => {
    console.log(
      '견적서 관리 페이지 로드됨 - applyToEstimate 데이터 확인 중...'
    );
    const applyToEstimateData = localStorage.getItem('applyToEstimate');
    console.log(
      'localStorage에서 가져온 applyToEstimate 데이터:',
      applyToEstimateData
    );

    if (applyToEstimateData) {
      try {
        const data = JSON.parse(applyToEstimateData);
        console.log('견적서에 적용할 데이터:', data);
        console.log('현재 견적서 상태:', estimates);
        if (process.env.NODE_ENV === 'development') {
      console.log('현재 활성 탭:', activeTab);
    }

        // 현재 견적서에 행 데이터 추가
        const currentEstimate = estimates[activeTab];
        console.log('현재 견적서:', currentEstimate);

        const newRows = [...currentEstimate.rows, ...data.rows];
        console.log('새로운 행 데이터:', newRows);

        // 견적서 정보 업데이트
        const updatedEstimate = {
          ...currentEstimate,
          rows: newRows,
          customerName: data.customerName || currentEstimate.customerName,
          projectName: data.projectName || currentEstimate.projectName,
          type: data.type || currentEstimate.type,
        };
        console.log('업데이트된 견적서:', updatedEstimate);

        // 견적서 업데이트
        const newEstimates = [...estimates];
        newEstimates[activeTab] = updatedEstimate;
        useEstimateStore.setState({ estimates: newEstimates });
        console.log('견적서 스토어 업데이트 완료');

        // meta 상태 업데이트
        setMeta(prevMeta => {
          const newMeta = {
            ...prevMeta,
            customerName: data.customerName || prevMeta.customerName,
            projectName: data.projectName || prevMeta.projectName,
            type: data.type || prevMeta.type,
          };
          console.log('새로운 meta 상태:', newMeta);
          return newMeta;
        });

        // localStorage에서 데이터 제거
        localStorage.removeItem('applyToEstimate');

        console.log(`${data.rows.length}개의 항목이 견적서에 적용되었습니다.`);
      } catch (error) {
        console.error('견적서 적용 데이터 처리 오류:', error);
        localStorage.removeItem('applyToEstimate');
      }
    } else {
      console.log('applyToEstimate 데이터가 없습니다.');
    }
  }, []); // 빈 의존성 배열로 한 번만 실행

  // 견적서 검색 필터링
  const filteredEstimates = estimates.filter(estimate => {
    const s = estimateSearch.trim().toLowerCase();
    if (!s) return true;
    return (
      estimate.name.toLowerCase().includes(s) ||
      estimate.rows.some(
        row =>
          row.productName?.toLowerCase().includes(s) ||
          row.details?.toLowerCase().includes(s) ||
          row.vendor?.toLowerCase().includes(s) ||
          row.brand?.toLowerCase().includes(s)
      )
    );
  });

  // 저장된 견적서 불러오기 (Firebase 전용)
  const loadSavedEstimates = async () => {
    try {
      console.log('Firebase에서 견적서 로드 시작');
      const firebaseEstimates = await estimateService.getEstimates();
      if (process.env.NODE_ENV === 'development') {
        console.log('Firebase에서 견적서 로드 완료:', firebaseEstimates.length, '개');
      }
      return firebaseEstimates;
    } catch (error) {
      console.error('Firebase에서 견적서 로드 오류:', error);
      return [];
    }
  };

  // 저장된 견적서 필터링
  const [savedEstimates, setSavedEstimates] = useState<any[]>([]);
  
  // Firebase 실시간 구독 + 옵션 데이터 로드
  useEffect(() => {
    console.log('=== Firebase 실시간 구독 시작 ===');
    const unsubscribe = estimateService.subscribeToEstimates((estimates: any[]) => {
      const cleaned = removeDuplicateEstimates(estimates);
      setSavedEstimates(cleaned);
    });

    // 옵션 데이터 1회 로드
    (async () => {
      try {
        const options = await loadOptionsFromFirebase();
        setOptionData(options);
        setOptionDataLoaded(true);
      } catch (error) {
        console.error('옵션 데이터 로드 실패:', error);
      }
    })();

    return () => {
      console.log('=== Firebase 실시간 구독 해제 ===');
      unsubscribe?.();
    };
  }, []);
  const filteredSavedEstimates = savedEstimates.filter((estimate: any) => {
    const s = estimateSearch.trim().toLowerCase();
    if (!s) return true;
    return (
      estimate.name.toLowerCase().includes(s) ||
      estimate.rows.some(
        (row: any) =>
          row.productName?.toLowerCase().includes(s) ||
          row.details?.toLowerCase().includes(s) ||
          row.vendor?.toLowerCase().includes(s) ||
          row.brand?.toLowerCase().includes(s)
      )
    );
  });

  // 하단 저장된 견적서 리스트 필터링
  const now = new Date();
  const filteredSavedEstimatesList = savedEstimates.filter((estimate: any) => {
    const s = savedEstimateSearch.trim().toLowerCase();
    if (
      s &&
      !(
        estimate.name.toLowerCase().includes(s) ||
        estimate.rows.some(
          (row: any) =>
            row.productName?.toLowerCase().includes(s) ||
            row.details?.toLowerCase().includes(s) ||
            row.vendor?.toLowerCase().includes(s) ||
            row.brand?.toLowerCase().includes(s)
        )
      )
    )
      return false;

    // 'all' 모드일 때는 모든 견적서 표시
    if (periodMode === 'all') return true;

    if (!estimate.savedAt) return true;
    const savedDate = new Date(estimate.savedAt);
    switch (periodMode) {
      case 'week': {
        const weekAgo = new Date(now);
        weekAgo.setDate(now.getDate() - 7);
        return savedDate >= weekAgo && savedDate <= now;
      }
      case 'month': {
        return (
          savedDate.getFullYear() === now.getFullYear() &&
          savedDate.getMonth() === now.getMonth()
        );
      }
      case 'quarter': {
        if (!selectedYear) return true;
        const year = parseInt(selectedYear, 10);
        const quarter = parseInt(selectedQuarter, 10);
        const startMonth = (quarter - 1) * 3;
        const endMonth = startMonth + 2;
        return (
          savedDate.getFullYear() === year &&
          savedDate.getMonth() >= startMonth &&
          savedDate.getMonth() <= endMonth
        );
      }
      case 'half': {
        if (!selectedYear) return true;
        const year = parseInt(selectedYear, 10);
        const half = parseInt(selectedHalf, 10);
        const startMonth = half === 1 ? 0 : 6;
        const endMonth = half === 1 ? 5 : 11;
        return (
          savedDate.getFullYear() === year &&
          savedDate.getMonth() >= startMonth &&
          savedDate.getMonth() <= endMonth
        );
      }
      case 'year': {
        if (!selectedYear) return true;
        const year = parseInt(selectedYear, 10);
        return savedDate.getFullYear() === year;
      }
      default:
        return true;
    }
  });

  // 디버깅 정보 출력 (개발 환경에서만)
  // 주석 처리하여 반복 로그 방지
  // if (process.env.NODE_ENV === 'development') {
  //   console.log('저장된 견적서:', savedEstimates.length, '개');
  //   console.log('필터링된 견적서:', filteredSavedEstimatesList.length, '개');
  //   console.log('현재 기간 모드:', periodMode);
  // }

  // 저장된 견적서 불러오기 핸들러
  const handleLoadSavedEstimate = (savedEstimate: any) => {
    // Final 견적서인지 확인
    const isFinalEstimate =
      savedEstimate.estimateNo && savedEstimate.estimateNo.includes('-final');

    let newEstimate;

    if (isFinalEstimate) {
      // Final 견적서인 경우 기존 견적번호와 이름 유지하되, 폭수와 주름양 재계산
      const updatedRows = savedEstimate.rows.map((row: any) => {
        // 제품 row에 대해서만 폭수와 주름양 재계산
        if (
          row.type === 'product' &&
          row.curtainType &&
          row.pleatType &&
          row.widthMM > 0
        ) {
          const updatedRow = { ...row };

          // 겉커튼일 때 폭수와 주름양 재계산
          if (updatedRow.curtainType === '겉커튼') {
            // 제품 정보 찾기
            const product = productOptions.find(
              (p: any) =>
                p.productCode === updatedRow.productCode ||
                p.productName === updatedRow.productName
            );
            const productWidth = product ? Number(product.width) || 0 : 0;

            // 폭수 계산
            const pleatCount = getPleatCount(
              updatedRow.widthMM,
              productWidth,
              updatedRow.pleatType,
              updatedRow.curtainType
            );
            
            updatedRow.widthCount = pleatCount || 0;

            // 주름양 계산
            if (pleatCount && pleatCount > 0) {
              const calculatedPleatAmount = getPleatAmount(
                updatedRow.widthMM,
                productWidth,
                updatedRow.pleatType,
                updatedRow.curtainType,
                pleatCount
              );
              updatedRow.pleatAmount = calculatedPleatAmount || '';
            }
          }

          // 속커튼 민자일 때 면적 기반 주름양 계산
          if (
            updatedRow.curtainType === '속커튼' &&
            updatedRow.pleatType === '민자'
          ) {
            if (updatedRow.widthMM > 0 && updatedRow.heightMM > 0) {
              const area = (updatedRow.widthMM * updatedRow.heightMM) / 1000000; // m²
              updatedRow.area = area;
              updatedRow.pleatAmount = area.toFixed(2);
            }
          }

          // 속커튼 나비일 때 주름양 설정
          if (
            updatedRow.curtainType === '속커튼' &&
            updatedRow.pleatType === '나비'
          ) {
            updatedRow.pleatAmount = '1.8~2';
          }

          return updatedRow;
        }
        return row;
      });

      newEstimate = {
        ...savedEstimate,
        id: Date.now(), // 새로운 ID 부여
        estimateNo: savedEstimate.estimateNo, // 기존 견적번호 유지
        name: savedEstimate.name, // 기존 이름 유지 (Final 표시 포함)
        estimateDate: savedEstimate.estimateDate, // 기존 견적일자 유지
        rows: updatedRows, // 재계산된 제품/옵션 정보
      };
    } else {
      // 일반 견적서인 경우 동일한 번호로 불러오기
      newEstimate = {
        ...savedEstimate,
        id: Date.now(), // 새로운 ID 부여
        estimateNo: savedEstimate.estimateNo, // 기존 견적번호 유지
        name: savedEstimate.name, // 기존 이름 유지
        estimateDate: savedEstimate.estimateDate, // 기존 견적일자 유지
        rows: [...savedEstimate.rows], // 제품/옵션 정보 복사
      };
    }

    // 현재 견적서에 제품이 있는지 확인
    const currentEstimate = estimates[activeTab];
    const hasCurrentProducts =
      currentEstimate.rows && currentEstimate.rows.length > 0;

    let newEstimates = [...estimates];
    let newActiveTab = activeTab;

    if (hasCurrentProducts) {
      // 현재 견적서에 제품이 있으면 새로운 탭 생성
      newEstimates.push(newEstimate);
      newActiveTab = newEstimates.length - 1;
      useEstimateStore.setState({
        estimates: newEstimates,
        activeTab: newActiveTab,
      });
    } else {
      // 현재 견적서가 비어있으면 현재 탭 사용
      newEstimates[activeTab] = newEstimate;
      useEstimateStore.setState({ estimates: newEstimates });
    }

    // meta 상태 업데이트 (고객 정보 자동 입력)
    setMeta({
      estimateNo: newEstimate.estimateNo,
      estimateDate: newEstimate.estimateDate,
      customerName: savedEstimate.customerName || '',
      contact: savedEstimate.contact || '',
      emergencyContact: savedEstimate.emergencyContact || '',
      projectName: savedEstimate.projectName || '',
      type: savedEstimate.type || '',
      address: savedEstimate.address || '',
    });

    // 확정금액 불러오기
    if (savedEstimate.finalizedAmount) {
      setFinalizedAmount(savedEstimate.finalizedAmount);
    } else {
      setFinalizedAmount(''); // 확정금액이 없으면 빈 값으로 초기화
    }

    // 할인 정보 불러오기
    if (savedEstimate.discountAmountInput) {
      setDiscountAmount(savedEstimate.discountAmountInput);
    } else {
      setDiscountAmount('');
    }
    
    if (savedEstimate.discountRateInput) {
      setDiscountRate(savedEstimate.discountRateInput);
    } else {
      setDiscountRate('');
    }
    
    if (savedEstimate.discountedTotalInput) {
      setDiscountedTotalInput(savedEstimate.discountedTotalInput);
    } else {
      setDiscountedTotalInput('');
    }

    setEstimateDialogOpen(false);

    if (isFinalEstimate) {
      if (hasCurrentProducts) {
        alert(
          `Final 견적서가 새로운 탭에서 불러와졌습니다.\n견적번호: ${newEstimate.estimateNo}\n실측 데이터가 반영된 최종 견적서입니다.\n폭수와 주름양이 실측 데이터로 재계산되었습니다.`
        );
      } else {
        alert(
          `Final 견적서가 불러와졌습니다.\n견적번호: ${newEstimate.estimateNo}\n실측 데이터가 반영된 최종 견적서입니다.\n폭수와 주름양이 실측 데이터로 재계산되었습니다.`
        );
      }
    } else {
      if (hasCurrentProducts) {
        alert(
          `저장된 견적서가 새로운 탭에서 불러와졌습니다.\n견적번호: ${newEstimate.estimateNo}`
        );
      } else {
        alert(
          `저장된 견적서가 불러와졌습니다.\n견적번호: ${newEstimate.estimateNo}`
        );
      }
    }
  };

  // 단계별 제품 검색 필터링
  const filteredProducts = productOptions.filter(p => {
    // 1단계: 제품종류 필터
    if (selectedProductCategories.length > 0 && !selectedProductCategories.includes(p.category)) {
      return false;
    }

    // 2단계: 거래처 필터
    if (selectedVendors.length > 0 && !selectedVendors.includes(p.vendorName)) {
      return false;
    }

    // 3단계: 브랜드 필터
    if (selectedBrands.length > 0 && !selectedBrands.includes(p.brand)) {
      return false;
    }

    // 4단계: 텍스트 검색
    const searchText = productSearchText.trim().toLowerCase();
    if (searchText) {
      return (
        p.vendorName?.toLowerCase().includes(searchText) ||
        p.brand?.toLowerCase().includes(searchText) ||
        p.category?.toLowerCase().includes(searchText) ||
        p.productName?.toLowerCase().includes(searchText) ||
        p.productCode?.toLowerCase().includes(searchText) ||
        p.details?.toLowerCase().includes(searchText)
      );
    }

    return true;
  });

  // 사용 가능한 옵션들 추출 (필터링된 제품들에서) - 기존 단순 검색용

  // 기존 단순 검색용 (하위 호환성)
  const simpleFilteredProducts = productOptions.filter(p => {
    const s = productSearch.trim().toLowerCase();
    if (!s) return true;
    return (
      p.vendorName?.toLowerCase().includes(s) ||
      p.brand?.toLowerCase().includes(s) ||
      p.category?.toLowerCase().includes(s) ||
      p.productName?.toLowerCase().includes(s)
    );
  });

  // 개선된 제품검색 함수들
  const performProductSearch = useMemo(() => {
    return (filters: typeof productSearchFilters) => {
      try {
        setIsProductSearching(true);
        setProductSearchError('');

        const results = productOptions.filter(p => {
          // 검색어가 있으면 검색어 기준으로 먼저 필터링
          if (filters.searchText) {
            const searchText = filters.searchText.toLowerCase();
            const matchesSearch = (
              p.vendorName?.toLowerCase().includes(searchText) ||
              p.brand?.toLowerCase().includes(searchText) ||
              p.category?.toLowerCase().includes(searchText) ||
              p.productName?.toLowerCase().includes(searchText) ||
              p.productCode?.toLowerCase().includes(searchText) ||
              p.details?.toLowerCase().includes(searchText)
            );

            // 검색어가 일치하지 않으면 제외
            if (!matchesSearch) {
              return false;
            }
          }

          // 카테고리 필터 (검색어가 있으면 추가 필터링, 없으면 필수 조건)
          if (filters.category && p.category !== filters.category) {
            return false;
          }

          // 거래처 필터 (검색어가 있으면 추가 필터링, 없으면 필수 조건)
          if (filters.vendor && p.vendorName !== filters.vendor) {
            return false;
          }

          // 브랜드 필터 (검색어가 있으면 추가 필터링, 없으면 필수 조건)
          if (filters.brand && p.brand !== filters.brand) {
            return false;
          }

          return true;
        });

        // 선택 횟수에 따라 정렬 (가장 많이 선택된 제품을 상위에)
        const sortedResults = results.sort((a, b) => {
          const countA = productSelectionCounts[a.id] || 0;
          const countB = productSelectionCounts[b.id] || 0;
          return countB - countA; // 내림차순 정렬 (많이 선택된 순)
        });

        setProductSearchResults(sortedResults);

        // 검색어 히스토리에 추가 (조건 강화)
        if (filters.searchText &&
          filters.searchText.trim().length >= 2 && // 최소 2자 이상
          !productSearchHistory.includes(filters.searchText) &&
          !pinnedSearchTerms.includes(filters.searchText) &&
          !isKoreanComposing(filters.searchText)) { // 한글 조합 중이 아닌 경우만
          const newHistory = [filters.searchText, ...productSearchHistory.slice(0, 9)];
          setProductSearchHistory(newHistory);
          localStorage.setItem('productSearchHistory', JSON.stringify(newHistory));
        }

        return results;
      } catch (error) {
        console.error('제품검색 중 오류 발생:', error);
        setProductSearchError('검색 중 오류가 발생했습니다. 다시 시도해주세요.');
        return [];
      } finally {
        setIsProductSearching(false);
      }
    };
  }, [productOptions, productSearchHistory]);

  // 검색 필터 변경 핸들러
  const handleProductSearchFilterChange = (filterType: keyof typeof productSearchFilters, value: string) => {
    let newFilters = { ...productSearchFilters, [filterType]: value };

    // 거래처가 변경되면 제품종류와 브랜드 필터 초기화
    if (filterType === 'vendor') {
      newFilters = {
        ...newFilters,
        category: '',
        brand: ''
      };

      // 거래처 선택 시 해당 거래처의 제품종류가 단일인 경우 자동 선택
      if (value) {
        const vendorProducts = productOptions.filter(p => p.vendorName === value);
        const uniqueCategories = Array.from(new Set(vendorProducts.map(p => p.category).filter(Boolean)));

        if (uniqueCategories.length === 1) {
          newFilters.category = uniqueCategories[0];
        }
      }
    }
    // 제품종류가 변경되면 브랜드 필터 초기화
    else if (filterType === 'category') {
      newFilters = {
        ...newFilters,
        brand: ''
      };
    }

    setProductSearchFilters(newFilters);

    // 검색 실행 후 선택된 제품들 중 현재 검색 결과에 존재하는 것들만 유지
    const results = performProductSearch(newFilters);
    const resultIds = new Set(results.map(p => p.id));
    setSelectedProducts(prev => {
      const newSelected = new Set<number>();
      prev.forEach(id => {
        if (resultIds.has(id)) {
          newSelected.add(id);
        }
      });
      return newSelected;
    });
  };

  // 검색어 변경 핸들러 (디바운싱 적용)
  const handleProductSearchTextChange = useMemo(() => {
    let timeoutId: NodeJS.Timeout;

    return (value: string) => {
      setProductSearchText(value);

      clearTimeout(timeoutId);

      // 디바운싱 시간을 늘려서 한글 조합이 완료된 후에만 검색 실행
      const delay = 500; // 500ms로 증가

      timeoutId = setTimeout(() => {
        const newFilters = { ...productSearchFilters, searchText: value };
        setProductSearchFilters(newFilters);

        // 검색 실행 후 선택된 제품들 중 현재 검색 결과에 존재하는 것들만 유지
        const results = performProductSearch(newFilters);
        const resultIds = new Set(results.map(p => p.id));
        setSelectedProducts(prev => {
          const newSelected = new Set<number>();
          prev.forEach(id => {
            if (resultIds.has(id)) {
              newSelected.add(id);
            }
          });
          return newSelected;
        });
      }, delay);
    };
  }, [productSearchFilters, performProductSearch]);

  // 검색 필터 초기화
  const handleProductSearchFilterReset = () => {
    const resetFilters = {
      category: '',
      vendor: '',
      brand: '',
      searchText: ''
    };
    setProductSearchFilters(resetFilters);
    setProductSearchText('');
    setProductSearchError('');

    // 필터 초기화 후 전체 제품을 선택 횟수에 따라 정렬하여 검색 결과로 설정
    const sortedProductOptions = productOptions.sort((a, b) => {
      const countA = productSelectionCounts[a.id] || 0;
      const countB = productSelectionCounts[b.id] || 0;
      return countB - countA; // 내림차순 정렬 (많이 선택된 순)
    });
    setProductSearchResults(sortedProductOptions);
  };

  // 검색 히스토리에서 검색어 선택
  const handleSearchHistorySelect = (searchTerm: string) => {
    const newFilters = { ...productSearchFilters, searchText: searchTerm };
    setProductSearchFilters(newFilters);
    setProductSearchText(searchTerm);

    // 검색 실행 후 선택된 제품들 중 현재 검색 결과에 존재하는 것들만 유지
    const results = performProductSearch(newFilters);
    const resultIds = new Set(results.map(p => p.id));
    setSelectedProducts(prev => {
      const newSelected = new Set<number>();
      prev.forEach(id => {
        if (resultIds.has(id)) {
          newSelected.add(id);
        }
      });
      return newSelected;
    });
  };

  // 검색어 삭제
  const handleDeleteSearchTerm = (searchTerm: string, isPinned: boolean = false) => {
    if (isPinned) {
      const newPinnedTerms = pinnedSearchTerms.filter(term => term !== searchTerm);
      setPinnedSearchTerms(newPinnedTerms);
      localStorage.setItem('pinnedSearchTerms', JSON.stringify(newPinnedTerms));
    } else {
      const newHistory = productSearchHistory.filter(term => term !== searchTerm);
      setProductSearchHistory(newHistory);
      localStorage.setItem('productSearchHistory', JSON.stringify(newHistory));
    }
  };

  // 검색어 고정/고정해제
  const handleTogglePinSearchTerm = (searchTerm: string) => {
    const isCurrentlyPinned = pinnedSearchTerms.includes(searchTerm);

    if (isCurrentlyPinned) {
      // 고정 해제
      const newPinnedTerms = pinnedSearchTerms.filter(term => term !== searchTerm);
      setPinnedSearchTerms(newPinnedTerms);
      localStorage.setItem('pinnedSearchTerms', JSON.stringify(newPinnedTerms));

      // 히스토리에 다시 추가 (맨 앞에)
      if (!productSearchHistory.includes(searchTerm)) {
        const newHistory = [searchTerm, ...productSearchHistory.slice(0, 9)];
        setProductSearchHistory(newHistory);
        localStorage.setItem('productSearchHistory', JSON.stringify(newHistory));
      }
    } else {
      // 고정
      const newPinnedTerms = [searchTerm, ...pinnedSearchTerms];
      setPinnedSearchTerms(newPinnedTerms);
      localStorage.setItem('pinnedSearchTerms', JSON.stringify(newPinnedTerms));

      // 히스토리에서 제거
      const newHistory = productSearchHistory.filter(term => term !== searchTerm);
      setProductSearchHistory(newHistory);
      localStorage.setItem('productSearchHistory', JSON.stringify(newHistory));
    }
  };

  // 검색 실행 함수
  const handleSearchSubmit = () => {
    if (productSearchText.trim()) {
      const searchTerm = productSearchText.trim();
      setProductSearchFilters(prev => ({ ...prev, searchText: searchTerm }));

      // 검색어 히스토리에 추가 (조건 강화)
      if (searchTerm.length >= 2 && 
          !productSearchHistory.includes(searchTerm) && 
          !pinnedSearchTerms.includes(searchTerm) &&
          !isKoreanComposing(searchTerm)) {
        const newHistory = [searchTerm, ...productSearchHistory.slice(0, 9)];
        setProductSearchHistory(newHistory);
        localStorage.setItem('productSearchHistory', JSON.stringify(newHistory));
      }
    }
  };

  // 엔터키 처리
  const handleSearchKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSearchSubmit();
    }
  };

  // 컴포넌트 마운트 시 검색 히스토리와 제품 선택 횟수 로드
  useEffect(() => {
    try {
      const savedHistory = localStorage.getItem('productSearchHistory');
      if (savedHistory) {
        setProductSearchHistory(JSON.parse(savedHistory));
      }

      const savedPinnedTerms = localStorage.getItem('pinnedSearchTerms');
      if (savedPinnedTerms) {
        setPinnedSearchTerms(JSON.parse(savedPinnedTerms));
      }

      const savedSelectionCounts = localStorage.getItem('productSelectionCounts');
      if (savedSelectionCounts) {
        setProductSelectionCounts(JSON.parse(savedSelectionCounts));
      }
    } catch (error) {
      console.error('데이터 로드 실패:', error);
    }
  }, []);

  // 제품검색 다이얼로그가 열릴 때 초기 검색 실행
  useEffect(() => {
    if (productDialogOpen) {
      // 다이얼로그가 열릴 때 현재 필터 상태에 맞는 제품을 검색 결과로 설정
      let filtered = productOptions;

      // 현재 필터 상태 적용
      if (productSearchFilters.vendor) {
        filtered = filtered.filter(p => p.vendorName === productSearchFilters.vendor);
      }
      if (productSearchFilters.category) {
        filtered = filtered.filter(p => p.category === productSearchFilters.category);
      }
      if (productSearchFilters.brand) {
        filtered = filtered.filter(p => p.brand === productSearchFilters.brand);
      }
      if (productSearchFilters.searchText) {
        const searchText = productSearchFilters.searchText.toLowerCase();
        filtered = filtered.filter(p =>
          p.vendorName?.toLowerCase().includes(searchText) ||
          p.brand?.toLowerCase().includes(searchText) ||
          p.category?.toLowerCase().includes(searchText) ||
          p.productName?.toLowerCase().includes(searchText) ||
          p.productCode?.toLowerCase().includes(searchText) ||
          p.details?.toLowerCase().includes(searchText)
        );
      }

      // 선택 횟수에 따라 정렬 (가장 많이 선택된 제품을 상위에)
      const sortedFiltered = filtered.sort((a, b) => {
        const countA = productSelectionCounts[a.id] || 0;
        const countB = productSelectionCounts[b.id] || 0;
        return countB - countA; // 내림차순 정렬 (많이 선택된 순)
      });

      setProductSearchResults(sortedFiltered);
      // 선택 상태 초기화
      setSelectedProducts(new Set());
    }
  }, [productDialogOpen, productOptions, productSearchFilters]);



  // 가로/세로 입력 핸들러
  const handleDimensionChange = (
    idx: number,
    field: 'widthMM' | 'heightMM',
    value: string
  ) => {
    const numValue = Number(value) || 0;
    const newRows = [...estimates[activeTab].rows];
    newRows[idx] = {
      ...newRows[idx],
      [field]: numValue,
      area:
        field === 'widthMM'
          ? (numValue * newRows[idx].heightMM) / 1000000
          : (newRows[idx].widthMM * numValue) / 1000000,
    };
    updateEstimateRows(activeTab, newRows);
  };

  // 라인방향/라인길이 핸들러
  const handleLineDirectionChange = (idx: number, value: string) => {
    const newRows = [...estimates[activeTab].rows];
    newRows[idx] = { ...newRows[idx], lineDirection: value };
    updateEstimateRows(activeTab, newRows);
  };
  const handleLineLengthChange = (idx: number, value: string) => {
    const newRows = [...estimates[activeTab].rows];
    newRows[idx] = {
      ...newRows[idx],
      lineLength: value,
      customLineLength:
        value === '직접입력' ? newRows[idx].customLineLength || '' : undefined,
    };
    updateEstimateRows(activeTab, newRows);
  };
  const handleCustomLineLengthChange = (idx: number, value: string) => {
    const newRows = [...estimates[activeTab].rows];
    newRows[idx] = { ...newRows[idx], customLineLength: value };
    updateEstimateRows(activeTab, newRows);
  };

  // Firebase에서 옵션을 불러오는 함수
  const loadOptionsFromFirebase = async () => {
    try {
      console.log('Firebase에서 옵션 데이터 로드 시작');
      const response = await fetch(`${API_BASE}/options`);
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      const options = await response.json();
      console.log('Firebase에서 로드된 옵션:', options);

      // 옵션 타입별로 분류
      const curtainOptions = options.filter((o: any) => o.optionType === '커튼옵션');
      const blindOptions = options.filter((o: any) => o.optionType === '블라인드옵션');
      const curtainMotorOptions = options.filter((o: any) => o.optionType === '커튼전동');
      const blindMotorOptions = options.filter((o: any) => o.optionType === '블라인드전동');
      const hunterOptions = options.filter((o: any) => o.optionType === '헌터옵션');
      const constructionOptions = options.filter((o: any) => o.optionType === '시공옵션');
      const etcOptions = options.filter((o: any) => o.optionType === '기타옵션');

      console.log('분류 결과:', {
        커튼옵션: curtainOptions.length,
        블라인드옵션: blindOptions.length,
        커튼전동: curtainMotorOptions.length,
        블라인드전동: blindMotorOptions.length,
        헌터옵션: hunterOptions.length,
        시공옵션: constructionOptions.length,
        기타옵션: etcOptions.length
      });

      return [
        curtainOptions,
        blindOptions,
        curtainMotorOptions,
        blindMotorOptions,
        hunterOptions,
        constructionOptions,
        etcOptions,
      ];
    } catch (error) {
      console.error('Firebase 옵션 로드 오류:', error);
      // Firebase 로드 실패 시 localStorage에서 로드 (fallback)
      return loadOptionsFromLocalStorage();
    }
  };

  // localStorage에서 옵션을 불러오는 함수 (fallback용)
  function loadOptionsFromLocalStorage() {
    try {
      const data = localStorage.getItem('erp_options');
      if (!data) return [[], [], [], [], [], [], []];
      const parsed = JSON.parse(data);

      // 2차원 배열인지 확인 (새로운 구조)
      if (
        Array.isArray(parsed) &&
        parsed.length > 0 &&
        Array.isArray(parsed[0])
      ) {
        return parsed;
      }

      // 1차원 배열인 경우 (기존 구조) - 옵션 타입별로 분류
      if (Array.isArray(parsed)) {
        console.log('localStorage 옵션 데이터 분류 중:', parsed.length, '개 옵션');

        const curtainOptions = parsed.filter((o: any) => o.optionType === '커튼');
        const blindOptions = parsed.filter((o: any) => o.optionType === '블라인드');
        const curtainMotorOptions = parsed.filter((o: any) => o.optionType === '커튼전동');
        const blindMotorOptions = parsed.filter((o: any) => o.optionType === '블라인드전동');
        const hunterOptions = parsed.filter((o: any) => o.optionType === '헌터');
        const constructionOptions = parsed.filter((o: any) => o.optionType === '시공');
        const etcOptions = parsed.filter((o: any) => o.optionType === '기타');

        console.log('localStorage 분류 결과:', {
          커튼: curtainOptions.length,
          블라인드: blindOptions.length,
          커튼전동: curtainMotorOptions.length,
          블라인드전동: blindMotorOptions.length,
          헌터: hunterOptions.length,
          시공: constructionOptions.length,
          기타: etcOptions.length
        });

        return [
          curtainOptions,
          blindOptions,
          curtainMotorOptions,
          blindMotorOptions,
          hunterOptions,
          constructionOptions,
          etcOptions,
        ];
      }

      return [[], [], [], [], [], [], []];
    } catch (error) {
      console.error('localStorage 옵션 로드 오류:', error);
      return [[], [], [], [], [], [], []];
    }
  }

  // 옵션 데이터 상태 추가
  const [optionData, setOptionData] = useState<any[][]>([]);
  const [optionDataLoaded, setOptionDataLoaded] = useState(false);

  // 옵션 로드 useEffect 제거 - 순차 로드로 통합됨

  function loadOptions() {
    return optionData;
  }

  const handleOptionSearch = (type: string) => {
    setOptionSearch('');
    const typeIndex = optionTypeMap.indexOf(type);
    setOptionSearchTab(typeIndex >= 0 ? typeIndex : 0);
    const all: any[] = loadOptions();
    const targetOptions = all[typeIndex >= 0 ? typeIndex : 0] || [];
    const sortedOptions = sortOptions(targetOptions);
    setOptionResults(sortedOptions);

    console.log(`옵션 탭 클릭: ${type}, 옵션 개수: ${sortedOptions.length}`);
  };

  const handleOptionSearchInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    setOptionSearch(e.target.value);
    const all: any[] = loadOptions();
    const arr = all[optionSearchTab] || [];
    const filteredOptions = arr.filter(
      (o: any) =>
        e.target.value === '' ||
        o.optionName?.toLowerCase().includes(e.target.value.toLowerCase()) ||
        o.details?.toLowerCase().includes(e.target.value.toLowerCase())
    );
    const sortedOptions = sortOptions(filteredOptions);
    setOptionResults(sortedOptions);
  };

  // 시공 옵션 수정을 위한 상태
  const [editOptionDialogOpen, setEditOptionDialogOpen] = useState(false);
  const [editingOption, setEditingOption] = useState<any>(null);
  const [editOptionQuantity, setEditOptionQuantity] = useState<number>(1);
  
  // 수량 수정 모달 상태
  const [quantityEditModalOpen, setQuantityEditModalOpen] = useState(false);
  const [editingQuantityRow, setEditingQuantityRow] = useState<any>(null);
  const [editingQuantityValue, setEditingQuantityValue] = useState<number>(1);
  const [editingQuantityOriginal, setEditingQuantityOriginal] = useState<number>(1);
  

  
  const [contextMenu, setContextMenu] = useState<{
    mouseX: number;
    mouseY: number;
    option: any;
  } | null>(null);

  // 자동 수량 계산 함수
  const calculateAutoQuantity = (optionName: string): number => {
    const currentRows = estimates[activeTab].rows;
    
    if (optionName?.includes('커튼시공') || optionName?.includes('커튼 시공')) {
      const curtainQuantity = currentRows
        .filter(row => row.type === 'product' && 
                      (row.productType?.includes('커튼') || 
                       row.productName?.includes('커튼') ||
                       row.curtainType?.includes('커튼')))
        .reduce((sum, row) => sum + (row.quantity || 1), 0);
      return curtainQuantity > 0 ? curtainQuantity : 1;
    }
    
    if (optionName?.includes('블라인드시공') || optionName?.includes('블라인드 시공')) {
      const blindQuantity = currentRows
        .filter(row => row.type === 'product' && 
                      (row.productType?.includes('블라인드') || 
                       row.productName?.includes('블라인드') ||
                       row.curtainType?.includes('블라인드')))
        .reduce((sum, row) => sum + (row.quantity || 1), 0);
      return blindQuantity > 0 ? blindQuantity : 1;
    }
    
    return 1;
  };

  const handleEditOption = (option: any) => {
    console.log('handleEditOption 호출됨:', option);
    setEditingOption(option);
    setEditOptionQuantity(option.quantity || 1);
    setEditOptionDialogOpen(true);
    console.log('수정 모달 상태:', { editingOption: option, editOptionQuantity: option.quantity || 1 });
  };

  const handleSaveEditOption = () => {
    if (!editingOption) return;

    // 수정된 옵션 정보로 견적서의 해당 옵션을 업데이트
    const currentRows = estimates[activeTab].rows;
    const updatedRows = currentRows.map(row => {
      if (row.type === 'option' && 
          (row.optionLabel === editingOption.optionName || row.productName === editingOption.optionName) && 
          row.vendor === editingOption.vendor) {
        console.log('시공 옵션 수정:', row.optionLabel, '수량:', editOptionQuantity);
        
        // 시공 옵션의 세부내용에 자동 계산 정보 추가
        let optionDetails = editingOption.details || '';
        
        if (editingOption.optionName?.includes('커튼시공') || 
            editingOption.optionName?.includes('커튼 시공')) {
          const curtainQuantity = currentRows
            .filter(r => r.type === 'product' && 
                        (r.productType?.includes('커튼') || 
                         r.productName?.includes('커튼') ||
                         r.curtainType?.includes('커튼')))
            .reduce((sum, r) => sum + (r.quantity || 1), 0);
          const autoCalcPattern = /\(커튼 \d+조\)/;
          if (!autoCalcPattern.test(optionDetails)) {
            optionDetails = `${editingOption.details || ''} (커튼 ${curtainQuantity}조)`;
          }
        }
        else if (editingOption.optionName?.includes('블라인드시공') || 
                 editingOption.optionName?.includes('블라인드 시공')) {
          const blindQuantity = currentRows
            .filter(r => r.type === 'product' && 
                        (r.productType?.includes('블라인드') || 
                         r.productName?.includes('블라인드') ||
                         r.curtainType?.includes('블라인드')))
            .reduce((sum, r) => sum + (r.quantity || 1), 0);
          const autoCalcPattern = /\(블라인드 \d+개\)/;
          if (!autoCalcPattern.test(optionDetails)) {
            optionDetails = `${editingOption.details || ''} (블라인드 ${blindQuantity}개)`;
          }
        }
        
        return {
          ...row,
          quantity: editOptionQuantity,
          details: optionDetails, // 자동 계산 정보가 포함된 세부내용
          totalPrice: (editingOption.salePrice || 0) * editOptionQuantity,
          cost: (editingOption.purchaseCost || 0) * editOptionQuantity,
          margin: ((editingOption.salePrice || 0) - (editingOption.purchaseCost || 0)) * editOptionQuantity,
        };
      }
      return row;
    });

    updateEstimateRows(activeTab, updatedRows);
    setEditOptionDialogOpen(false);
    setEditingOption(null);
    setEditOptionQuantity(1);
  };

  const handleCancelEditOption = () => {
    setEditOptionDialogOpen(false);
    setEditingOption(null);
    setEditOptionQuantity(1);
  };

  const handleContextMenu = (event: React.MouseEvent, option: any) => {
    event.preventDefault();
    console.log('우클릭 메뉴:', option.optionName);
    
    // 시공 옵션인 경우에만 우클릭 메뉴 표시
    if (optionTypeMap[optionSearchTab] === '시공옵션') {
      setContextMenu({
        mouseX: event.clientX + 2,
        mouseY: event.clientY - 6,
        option: option,
      });
    }
  };

  const handleCloseContextMenu = () => {
    setContextMenu(null);
  };

  // 수량 수정 모달 열기
  const handleOpenQuantityEditModal = (row: any) => {
    setEditingQuantityRow(row);
    setEditingQuantityValue(row.quantity || 1);
    setEditingQuantityOriginal(row.quantity || 1);
    setQuantityEditModalOpen(true);
  };

  // 수량 수정 모달 닫기
  const handleCloseQuantityEditModal = () => {
    setQuantityEditModalOpen(false);
    setEditingQuantityRow(null);
    setEditingQuantityValue(1);
    setEditingQuantityOriginal(1);
  };

  // 수량 수정 적용
  const handleApplyQuantityEdit = () => {
    if (!editingQuantityRow) return;

    const currentRows = estimates[activeTab].rows;
    const updatedRows = currentRows.map(row => {
      if (row.id === editingQuantityRow.id) {
        // 견적서 표시 형식 업데이트
        let updatedDetails = row.details || '';
        const optionName = row.optionLabel || row.productName || '';
        
        // 커튼시공/블라인드시공: 수량 업데이트
        if (optionName.includes('커튼시공') || optionName.includes('커튼 시공')) {
          // 기존 형식에서 수량만 변경
          updatedDetails = updatedDetails.replace(/커튼\s+\d+조/, `커튼 ${editingQuantityValue}조`);
        } else if (optionName.includes('블라인드시공') || optionName.includes('블라인드 시공')) {
          // 기존 형식에서 수량만 변경
          updatedDetails = updatedDetails.replace(/블라인드\s+\d+개/, `블라인드 ${editingQuantityValue}개`);
        }
        // 전동커튼시공: 괄호 안의 수량 업데이트
        else if (optionName.includes('전동커튼시공') || optionName.includes('전동커튼 시공')) {
          // 괄호 안의 수량 업데이트
          updatedDetails = updatedDetails.replace(/\(커튼\s+\d+조\)/, `(커튼 ${editingQuantityValue}조)`);
        }

        return {
          ...row,
          quantity: editingQuantityValue,
          totalPrice: (row.salePrice || 0) * editingQuantityValue,
          cost: (row.purchaseCost || 0) * editingQuantityValue,
          margin: ((row.salePrice || 0) - (row.purchaseCost || 0)) * editingQuantityValue,
          details: updatedDetails,
          isManualQuantity: true, // 수동 설정으로 변경
        };
      }
      return row;
    });

    updateEstimateRows(activeTab, updatedRows);
    handleCloseQuantityEditModal();
  };

  // 자동 계산으로 복원
  const handleRestoreAutoQuantity = () => {
    if (!editingQuantityRow) return;

    const currentRows = estimates[activeTab].rows;
    let autoQuantity = 1;

    // 옵션 타입별 자동 계산
    const optionName = editingQuantityRow.optionLabel || editingQuantityRow.productName || '';
    
    // 커튼시공 자동 계산
    if (optionName.includes('커튼시공') || optionName.includes('커튼 시공')) {
      const curtainQuantity = currentRows
        .filter(row => row.type === 'product' && 
                      (row.productType?.includes('커튼') || 
                       row.productName?.includes('커튼') ||
                       row.curtainType?.includes('커튼')))
        .reduce((sum, row) => sum + (row.quantity || 1), 0);
      autoQuantity = curtainQuantity > 0 ? curtainQuantity : 1;
    }
    // 블라인드시공 자동 계산
    else if (optionName.includes('블라인드시공') || optionName.includes('블라인드 시공')) {
      const blindQuantity = currentRows
        .filter(row => row.type === 'product' && 
                      (row.productType?.includes('블라인드') || 
                       row.productName?.includes('블라인드') ||
                       row.curtainType?.includes('블라인드')))
        .reduce((sum, row) => sum + (row.quantity || 1), 0);
      autoQuantity = blindQuantity > 0 ? blindQuantity : 1;
    }
    // 레일 옵션 자동 계산 (레일 개수별)
    else if (optionName.includes('레일') || editingQuantityRow.details?.includes('레일')) {
      // 레일 관련 제품 개수 계산
      const railQuantity = currentRows
        .filter(row => row.type === 'product' && 
                      (row.productType?.includes('레일') || 
                       row.productName?.includes('레일')))
        .reduce((sum, row) => sum + (row.quantity || 1), 0);
      autoQuantity = railQuantity > 0 ? railQuantity : 1;
    }
    // 전동 관련 옵션 (기본값 1)
    else if (optionName.includes('전동') || optionName.includes('모터')) {
      autoQuantity = 1; // 전동은 기본적으로 1개
    }
    // 기타 옵션 (기본값 1)
    else {
      autoQuantity = 1;
    }

    setEditingQuantityValue(autoQuantity);
    
    // 자동 계산된 수량으로 견적서 표시 형식 미리보기 업데이트
    if (editingQuantityRow) {
      const optionName = editingQuantityRow.optionLabel || editingQuantityRow.productName || '';
      let updatedDetails = editingQuantityRow.details || '';
      
      // 커튼시공/블라인드시공: 수량 업데이트
      if (optionName.includes('커튼시공') || optionName.includes('커튼 시공')) {
        updatedDetails = updatedDetails.replace(/커튼\s+\d+조/, `커튼 ${autoQuantity}조`);
      } else if (optionName.includes('블라인드시공') || optionName.includes('블라인드 시공')) {
        updatedDetails = updatedDetails.replace(/블라인드\s+\d+개/, `블라인드 ${autoQuantity}개`);
      }
      // 전동커튼시공: 괄호 안의 수량 업데이트
      else if (optionName.includes('전동커튼시공') || optionName.includes('전동커튼 시공')) {
        updatedDetails = updatedDetails.replace(/\(커튼\s+\d+조\)/, `(커튼 ${autoQuantity}조)`);
      }
      
      // 미리보기용으로 editingQuantityRow 업데이트
      setEditingQuantityRow({
        ...editingQuantityRow,
        details: updatedDetails
      });
    }
  };

  const handleEditFromContextMenu = () => {
    if (contextMenu) {
      handleEditOption(contextMenu.option);
      setContextMenu(null);
    }
  };

  // 시공 옵션인지 확인하는 함수
  const isConstructionOption = (row: any): boolean => {
    return row.type === 'option' && 
           (row.productType === '시공' || 
            row.productType === '시공옵션' ||
            row.optionLabel?.includes('시공') ||
            row.details?.includes('시공'));
  };

  // 견적서 테이블의 옵션 더블클릭 핸들러
  const handleEstimateOptionDoubleClick = (row: any, idx: number) => {
    console.log('견적서 옵션 더블클릭:', row);
    
    // 모든 옵션에 대해 수정 모달 열기
    console.log('옵션 더블클릭 - 수정 모달 열기');
    setEditingOption({
      optionName: row.optionLabel || row.productName,
      vendor: row.vendor,
      salePrice: row.salePrice,
      purchaseCost: row.purchaseCost,
      details: row.details,
      note: row.note
    });
    setEditOptionQuantity(row.quantity || 1);
    setEditOptionDialogOpen(true);
  };



  const handleAddOptionToEstimate = (selectedOption: any) => {
    if (!selectedOption) return;

    const currentRows = estimates[activeTab].rows;
    let insertIndex = currentRows.length; // 기본적으로 마지막에 추가

    // 제품이 선택된 경우 해당 제품의 옵션들 다음에 추가
    if (selectedProductIdx !== null) {
      const selectedProductId = currentRows[selectedProductIdx].id;
      insertIndex = selectedProductIdx + 1;
      
      // 선택된 제품의 옵션들만 건너뛰기 (productId로 정확한 연결 확인)
      while (
        insertIndex < currentRows.length &&
        currentRows[insertIndex].type === 'option' &&
        currentRows[insertIndex].productId === selectedProductId
      ) {
        insertIndex++;
      }
    }

    // 모든 옵션의 수량을 자동으로 계산
    let finalQuantity = 1;
    const optionName = selectedOption.optionName || '';
    
    // 커튼시공인 경우 커튼 제품의 수량 합계
    if (optionName.includes('커튼시공') || optionName.includes('커튼 시공')) {
      const curtainQuantity = currentRows
        .filter(row => row.type === 'product' && 
                      (row.productType?.includes('커튼') || 
                       row.productName?.includes('커튼') ||
                       row.curtainType?.includes('커튼')))
        .reduce((sum, row) => sum + (row.quantity || 1), 0);
      finalQuantity = curtainQuantity > 0 ? curtainQuantity : optionQuantity;
      console.log('커튼시공 자동 수량 설정:', curtainQuantity);
    }
    // 블라인드시공인 경우 블라인드 제품의 수량 합계
    else if (optionName.includes('블라인드시공') || optionName.includes('블라인드 시공')) {
      const blindQuantity = currentRows
        .filter(row => row.type === 'product' && 
                      (row.productType?.includes('블라인드') || 
                       row.productName?.includes('블라인드') ||
                       row.curtainType?.includes('블라인드')))
        .reduce((sum, row) => sum + (row.quantity || 1), 0);
      finalQuantity = blindQuantity > 0 ? blindQuantity : optionQuantity;
      console.log('블라인드시공 자동 수량 설정:', blindQuantity);
    }
    // 레일 관련 옵션인 경우 레일 제품의 수량 합계
    else if (optionName.includes('레일') || selectedOption.details?.includes('레일')) {
      const railQuantity = currentRows
        .filter(row => row.type === 'product' && 
                      (row.productType?.includes('레일') || 
                       row.productName?.includes('레일')))
        .reduce((sum, row) => sum + (row.quantity || 1), 0);
      finalQuantity = railQuantity > 0 ? railQuantity : optionQuantity;
      console.log('레일 옵션 자동 수량 설정:', railQuantity);
    }
    // 전동커튼시공 옵션은 기본값 1 (자동 계산 없음)
    else if (optionName.includes('전동커튼시공') || optionName.includes('전동커튼 시공')) {
      finalQuantity = 1;
      console.log('전동커튼시공 옵션 기본 수량 설정:', 1);
    }
    // 기타 전동 관련 옵션은 기본값 1
    else if (optionName.includes('전동') || optionName.includes('모터')) {
      finalQuantity = 1;
      console.log('전동 옵션 기본 수량 설정:', 1);
    }
    // 기타 옵션은 사용자 입력 수량 사용
    else {
      finalQuantity = optionQuantity;
      console.log('기타 옵션 수량 설정:', optionQuantity);
    }

    // 모든 옵션의 세부내용에 자동 계산 정보 추가
    let optionDetails = selectedOption.details || '';
    
    // 커튼시공 세부내용에 자동 계산 정보 추가
    if (optionName.includes('커튼시공') || optionName.includes('커튼 시공')) {
      const curtainQuantity = currentRows
        .filter(row => row.type === 'product' && 
                      (row.productType?.includes('커튼') || 
                       row.productName?.includes('커튼') ||
                       row.curtainType?.includes('커튼')))
        .reduce((sum, row) => sum + (row.quantity || 1), 0);
      const autoCalcPattern = /\(커튼 \d+조\)/;
      if (!autoCalcPattern.test(optionDetails)) {
        optionDetails = `${selectedOption.details || ''} (커튼 ${curtainQuantity}조)`;
      }
    }
    // 블라인드시공 세부내용에 자동 계산 정보 추가
    else if (optionName.includes('블라인드시공') || optionName.includes('블라인드 시공')) {
      const blindQuantity = currentRows
        .filter(row => row.type === 'product' && 
                      (row.productType?.includes('블라인드') || 
                       row.productName?.includes('블라인드') ||
                       row.curtainType?.includes('블라인드')))
        .reduce((sum, row) => sum + (row.quantity || 1), 0);
      const autoCalcPattern = /\(블라인드 \d+개\)/;
      if (!autoCalcPattern.test(optionDetails)) {
        optionDetails = `${selectedOption.details || ''} (블라인드 ${blindQuantity}개)`;
      }
    }
    // 레일 옵션 세부내용에 자동 계산 정보 추가
    else if (optionName.includes('레일') || selectedOption.details?.includes('레일')) {
      const railQuantity = currentRows
        .filter(row => row.type === 'product' && 
                      (row.productType?.includes('레일') || 
                       row.productName?.includes('레일')))
        .reduce((sum, row) => sum + (row.quantity || 1), 0);
      const autoCalcPattern = /\(레일 \d+개\)/;
      if (!autoCalcPattern.test(optionDetails)) {
        optionDetails = `${selectedOption.details || ''} (레일 ${railQuantity}개)`;
      }
    }
    // 전동커튼시공 옵션은 자동 계산 정보 추가하지 않음 (기본값 1)
    else if (optionName.includes('전동커튼시공') || optionName.includes('전동커튼 시공')) {
      // 전동커튼시공은 자동 계산하지 않고 기본값 1 사용
      console.log('전동커튼시공 옵션 - 자동 계산 정보 추가하지 않음');
    }

    const newOptionRow: EstimateRow = {
      id: Date.now(),
      type: 'option',
      productId: selectedProductIdx !== null ? currentRows[selectedProductIdx].id : undefined, // 제품과 연결하는 productId 추가
      vendor: selectedOption.vendor || '',
      brand: selectedOption.brand || '',
      productName: selectedOption.optionName,
      productType: selectedOption.optionType,
      salePrice: selectedOption.salePrice || 0,
      purchaseCost: selectedOption.purchaseCost || 0,
      note: selectedOption.note,
      details: optionDetails, // 자동 계산 정보가 포함된 세부내용
      quantity: finalQuantity, // 시공 옵션인 경우 사용자 입력 수량 사용
      totalPrice: (selectedOption.salePrice || 0) * finalQuantity, // 수량을 곱한 총 판매가
      cost: (selectedOption.purchaseCost || 0) * finalQuantity, // 수량을 곱한 총 원가
      optionLabel: selectedOption.optionName, // 옵션명을 optionLabel로 설정
      isManualQuantity: false, // 기본적으로 자동 계산
      // ... 나머지 필드 초기화
      space: '',
      curtainType: '',
      pleatType: '',
      width: '',
      widthMM: 0,
      heightMM: 0,
      area: 0,
      lineDir: '',
      lineLen: 0,
      pleatAmount: '',
      widthCount: 0,
      margin: ((selectedOption.salePrice || 0) - (selectedOption.purchaseCost || 0)) * finalQuantity,
    };

    const newRows = [...currentRows];
    // 찾은 위치에 옵션 추가
    newRows.splice(insertIndex, 0, newOptionRow);

    // productId 복구 적용
    const repairedRows = repairOptionProductIds(newRows);
    
    // 옵션 추가 후 해당 제품의 세부내용 자동 업데이트
    if (selectedProductIdx !== null) {
      const productRow = repairedRows[selectedProductIdx];
      if (productRow && productRow.type === 'product') {
        productRow.details = generateAutoDetails(productRow);
      }
    }
    
    updateEstimateRows(activeTab, repairedRows);
    setOptionDialogOpen(false);
  };

  useEffect(() => {
    if (optionDataLoaded) {
      const all: any[] = loadOptions();
      const arr = all[optionSearchTab] || [];
      const filteredOptions = arr.filter(
        (o: any) =>
          optionSearch === '' ||
          o.optionName?.toLowerCase().includes(optionSearch.toLowerCase()) ||
          o.details?.toLowerCase().includes(optionSearch.toLowerCase())
      );
      const sortedOptions = sortOptions(filteredOptions);
      setOptionResults(sortedOptions);
    }
    // eslint-disable-next-line
  }, [optionSearchTab, optionSearch, optionDialogOpen, optionDataLoaded, optionSortBy, optionSortOrder, optionSortKoreanFirst]);

  const handleCopyRow = (id: number) => {
    const rows = [...estimates[activeTab].rows];
    const idx = rows.findIndex(row => row.id === id);
    if (idx === -1) return;
    
    const originalRow = rows[idx];
    const copy = { ...originalRow, id: Date.now() };
    
    // 공간 정보에 자동 넘버링 추가
    const originalSpace = originalRow.space;
    const originalSpaceCustom = originalRow.spaceCustom;
    
    if (originalSpace === '직접입력' && originalSpaceCustom) {
      // 직접입력된 공간명에 넘버링 추가 (예: "창1" -> "창2")
      const baseName = originalSpaceCustom.replace(/\d+$/, ''); // 끝의 숫자 제거
      const existingNumbers = rows
        .filter(row => 
          row.space === '직접입력' && 
          row.spaceCustom && 
          row.spaceCustom.startsWith(baseName) &&
          row.spaceCustom !== originalSpaceCustom
        )
        .map(row => {
          const match = row.spaceCustom?.match(new RegExp(`^${baseName}(\\d+)$`));
          return match ? parseInt(match[1]) : 0;
        })
        .filter(num => num > 0);
      
      const nextNumber = existingNumbers.length > 0 ? Math.max(...existingNumbers) + 1 : 2;
      copy.spaceCustom = `${baseName}${nextNumber}`;
    } else if (originalSpace && originalSpace !== '직접입력') {
      // 일반 공간명에 넘버링 추가 (예: "거실" -> "거실2")
      // 기존 넘버링이 있는지 확인하고 기본 공간명 추출
      const baseSpaceName = originalSpace.replace(/\s*\d+$/, ''); // 끝의 공백과 숫자 제거
      
      const existingNumbers = rows
        .filter(row => 
          row.space && 
          row.space.startsWith(baseSpaceName) &&
          row.id !== originalRow.id
        )
        .map(row => {
          const match = row.space.match(new RegExp(`^${baseSpaceName}\\s*(\\d+)$`));
          return match ? parseInt(match[1]) : 0;
        })
        .filter(num => num > 0);
      
      const nextNumber = existingNumbers.length > 0 ? Math.max(...existingNumbers) + 1 : 2;
      copy.space = `${baseSpaceName} ${nextNumber}`;
    } else {
      // 공간이 비어있거나 없는 경우 기본 넘버링 (1, 2, 3...)
      const existingNumbers = rows
        .filter(row => 
          (!row.space || row.space === '') &&
          row.id !== originalRow.id
        )
        .map((_, index) => index + 1);
      
      const nextNumber = existingNumbers.length > 0 ? Math.max(...existingNumbers) + 1 : 1;
      copy.space = nextNumber.toString();
    }
    
    // 복사된 항목을 맨 뒤에 추가하여 순서대로 보이도록 함
    rows.push(copy);
    updateEstimateRows(activeTab, rows);
  };

  const handleRowClick = (idx: number) => {
    setEditRowIdx(idx);
    setEditRow({ ...estimates[activeTab].rows[idx] });
    setEditOpen(true);
    // 편집 모달이 열릴 때 사용자 수정 상태 초기화
    setUserModifiedWidthCount(false);
    setRecommendedPleatCount(0);
    setRecommendedPleatAmount('');
  };

  // 세부내용 전용 핸들러
  const handleDetailsChange = (value: string) => {
    setEditRow((prev: any) => ({ ...prev, details: value }));
  };

  // 수식 계산 함수
  const calculateExpression = (expression: string): number | null => {
    try {
      // 수식에서 숫자, 연산자(+,-,*,/,), 괄호만 허용
      const sanitizedExpression = expression.replace(/[^0-9+\-*/().]/g, '');
      
      // 빈 문자열이거나 숫자가 아닌 경우 null 반환
      if (!sanitizedExpression || /^[+\-*/().]+$/.test(sanitizedExpression)) {
        return null;
      }
      
      // 수식 계산
      const result = Function(`'use strict'; return (${sanitizedExpression})`)();
      
      // 숫자인지 확인하고 반환
      if (typeof result === 'number' && !isNaN(result) && isFinite(result)) {
        return Math.round(result); // 정수로 반올림
      }
      
      return null;
    } catch (error) {
      console.log('수식 계산 실패:', expression, error);
      return null;
    }
  };

  const handleEditChange = (field: string, value: any) => {
    // 가로, 세로 필드에 대해 수식 계산 적용
    if ((field === 'widthMM' || field === 'heightMM') && typeof value === 'string' && (value.includes('+') || value.includes('-') || value.includes('*') || value.includes('/'))) {
      const calculatedValue = calculateExpression(value);
      if (calculatedValue !== null) {
        console.log(`수식 계산: ${value} = ${calculatedValue}`);
        value = calculatedValue.toString();
      }
    }
    
    const newEditRow = { ...editRow, [field]: value };
    let productDataChanged = false;

    // 제품명이 변경되면 거래처를 포함한 모든 관련 데이터를 제품 DB에서 다시 불러옵니다.
    if (field === 'productName' || field === 'productCode') {
      // 제품이 변경되면 사용자 수정 상태 리셋
      setUserModifiedWidthCount(false);
      
      const product =
        field === 'productName'
          ? productOptions.find(p => p.productName === value)
          : productOptions.find(p => p.productCode === value);

      if (product) {
        newEditRow.vendor = product.vendorName || '';
        newEditRow.brand = product.brand || '';
        newEditRow.productCode = product.productCode || '';
        newEditRow.productName = product.productName || '';
        newEditRow.productType = product.category || '';
        newEditRow.salePrice = product.salePrice || 0;
        newEditRow.purchaseCost = product.purchaseCost || 0;
        newEditRow.largePlainPrice = product.largePlainPrice ?? 0;
        newEditRow.largePlainCost = product.largePlainCost ?? 0;
        newEditRow.width = product.width || '';
        newEditRow.details = product.details || '';

        // 제품명 기반 공간 자동 설정
        const productName = product.productName || '';
        if (productName.includes('중간방2')) {
          newEditRow.space = '중간방2';
        } else if (productName.includes('중간방')) {
          newEditRow.space = '중간방';
        } else if (productName.includes('거실')) {
          newEditRow.space = '거실';
        } else if (productName.includes('안방')) {
          newEditRow.space = '안방';
        } else if (productName.includes('드레스룸')) {
          newEditRow.space = '드레스룸';
        } else if (productName.includes('끝방')) {
          newEditRow.space = '끝방';
        } else if (productName.includes('주방')) {
          newEditRow.space = '주방';
        }
        // 기존 공간 정보가 있으면 유지
        else if (editRow.space) {
          newEditRow.space = editRow.space;
        }

        // 속커튼 초기값 설정
        if (product.category === '커튼') {
          if (product.insideOutside === '속') {
            newEditRow.curtainType = '속커튼';
            newEditRow.pleatType = '나비';
            newEditRow.pleatAmount = '1.8~2';
          } else {
            newEditRow.curtainType = '겉커튼';
            newEditRow.pleatType = '민자';
          }
          
          // 속커튼, 민자를 선택할 때 주름양배수를 1.4배로 기본 설정
          if (newEditRow.curtainType === '속커튼' && newEditRow.pleatType === '민자') {
            newEditRow.pleatMultiplier = '1.4배';
          }
        }

        productDataChanged = true;
      }
    }

    // 커튼종류나 주름방식이 변경될 때는 주름양 계산 후 세부내용 업데이트를 위해 플래그 설정
    if ((field === 'curtainType' || field === 'pleatType') && newEditRow.productType === '커튼') {
      // 커튼타입이 변경될 때 주름타입 자동 설정
      if (field === 'curtainType') {
        if (value === '속커튼') {
          newEditRow.pleatType = '나비';
          newEditRow.pleatAmount = '1.8~2';
        } else if (value === '겉커튼') {
          newEditRow.pleatType = '민자';
          newEditRow.pleatAmount = '';
        }
      }
      
      // 주름타입 변경 시 폭수를 추천폭수로 리셋하고 사용자 수정 상태도 리셋
      if (field === 'pleatType') {
        newEditRow.widthCount = 0; // 추천폭수 계산을 위해 0으로 리셋
        setUserModifiedWidthCount(false); // 사용자 수정 상태 리셋
        
        // 겉커튼일 때 즉시 추천폭수 계산
        if (newEditRow.curtainType === '겉커튼' && newEditRow.widthMM > 0) {
          const product = productOptions.find(p => p.productCode === newEditRow.productCode);
      const productWidth = product ? Number(product.width) || 0 : 0;

          if (value === '민자' || value === '나비') {
        const pleatCount = getPleatCount(
              Number(newEditRow.widthMM),
          productWidth,
              value,
              newEditRow.curtainType
            );
            const finalWidthCount = Number(pleatCount) || 0;
            newEditRow.widthCount = finalWidthCount;
            newEditRow.pleatCount = finalWidthCount;
            setRecommendedPleatCount(finalWidthCount);
        
                // 추천 주름양 계산
            if (finalWidthCount > 0) {
              const calculatedPleatAmount = calculatePleatAmountForGgeotCurtain(
                Number(newEditRow.widthMM), 
                finalWidthCount, 
                productWidth
              );
              setRecommendedPleatAmount(calculatedPleatAmount);
        } else {
          setRecommendedPleatAmount('');
            }
          }
        }
      }
      
      // 속커튼, 민자를 선택할 때 주름양배수를 1.4배로 기본 설정
      if (newEditRow.curtainType === '속커튼' && newEditRow.pleatType === '민자') {
        newEditRow.pleatMultiplier = '1.4배';
      }
    }

    // 가로 사이즈 변경 시에도 세부내용 업데이트 필요
    if (field === 'widthMM') {
      if (newEditRow.productType === '커튼') {
        // 가로값 변경 시 사용자 수정 상태 리셋 (겉커튼인 경우에만)
        if (newEditRow.curtainType === '겉커튼') {
          setUserModifiedWidthCount(false);
        }
      } else if (newEditRow.productType === '블라인드') {
        // 블라인드일 때 최소주문수량 적용
        const widthMM = Number(newEditRow.widthMM) || 0;
        const heightMM = Number(newEditRow.heightMM) || 0;
        if (widthMM > 0 && heightMM > 0) {
          let calculatedArea = (widthMM * heightMM) / 1000000 || 0;
          const product = productOptions.find(p => p.productCode === newEditRow.productCode);
          if (product && product.minOrderQty) {
            const minOrderQty = Number(product.minOrderQty) || 0;
            if (minOrderQty > 0 && calculatedArea < minOrderQty) {
              calculatedArea = minOrderQty;
            }
          }
          newEditRow.area = calculatedArea;
        }
      }
    }

    // 줄방향과 줄길이 처리 (블라인드 제품)
    if (field === 'lineDirection' || field === 'lineLength') {
      if (value === '없음' || value === '') {
        newEditRow[field] = '';
      }
    }

    // 세로값 변경 시 면적 계산만 수행 (폭수 계산 제외)
    if (field === 'heightMM') {
      const widthMM = Number(newEditRow.widthMM) || 0;
      const heightMM = Number(newEditRow.heightMM) || 0;
      const pleatTypeVal = newEditRow.pleatType;
      const curtainTypeVal = newEditRow.curtainType;

      // 블라인드일 때 최소주문수량 적용
      if (newEditRow.productType === '블라인드') {
        let calculatedArea = (widthMM * heightMM) / 1000000 || 0;
        const product = productOptions.find(p => p.productCode === newEditRow.productCode);
        if (product && product.minOrderQty) {
          const minOrderQty = Number(product.minOrderQty) || 0;
          if (minOrderQty > 0 && calculatedArea < minOrderQty) {
            calculatedArea = minOrderQty;
          }
        }
        newEditRow.area = calculatedArea;
      }
      // 속커튼 민자일 때는 면적 기반 주름양 계산
      else if (curtainTypeVal === '속커튼' && pleatTypeVal === '민자') {
        if (widthMM > 0 && heightMM > 0) {
          const area = (widthMM * heightMM) / 1000000; // m²
          newEditRow.area = area;
          newEditRow.pleatAmount = area.toFixed(2);
        }
      }
    }

    // 주름양 배수 변경 시 주름양 업데이트
    if (field === 'pleatMultiplier' && newEditRow.productType === '커튼' &&
        newEditRow.curtainType === '속커튼' && newEditRow.pleatType === '민자') {
      // 주름양 배수에 따른 주름양 계산
      const pleatMultiplier = Number(newEditRow.pleatMultiplier?.replace('배', '')) || 1.4;
      const widthMM = Number(newEditRow.widthMM) || 0;
      const area = (widthMM / 1000) * pleatMultiplier; // m² 단위 (견적서와 동일한 계산식)
      newEditRow.area = area;
      // 주름양에 숫자 값으로 저장 (예: 1.4배 → 1.4)
      newEditRow.pleatAmount = pleatMultiplier;
    }

    // 폭수 변경 시 주름양 재계산
    if (field === 'widthCount' && newEditRow.productType === '커튼' && newEditRow.curtainType === '겉커튼') {
      // 사용자가 폭수를 직접 수정했음을 표시 (값이 0이 아닌 경우에만)
      if (Number(value) > 0) {
      setUserModifiedWidthCount(true);
      }
      
      const product = productOptions.find(
        p => p.productCode === newEditRow.productCode
      );
      const widthMM = Number(newEditRow.widthMM) || 0;
      const pleatTypeVal = newEditRow.pleatType;
      const curtainTypeVal = newEditRow.curtainType;
      const productWidth = product ? Number(product.width) || 0 : 0;
      const pleatCount = Number(value) || 0;

      // 겉커튼일 때 주름양 자동 계산
      if (curtainTypeVal === '겉커튼' && pleatCount > 0 && widthMM > 0) {
        // 겉커튼 민자는 productWidth가 없어도 계산 가능
        if (pleatTypeVal === '민자') {
          // 겉커튼 민자는 가로 길이와 폭수를 고려한 주름양 계산
          const calculatedPleatAmount = calculatePleatAmountForGgeotCurtain(widthMM, pleatCount, productWidth);
          newEditRow.pleatAmount = calculatedPleatAmount;
        } else if (productWidth > 0) {
          // 겉커튼 나비/3주름은 productWidth가 필요
        const calculatedPleatAmount = getPleatAmount(
          widthMM,
          productWidth,
          pleatTypeVal,
          curtainTypeVal,
          pleatCount
        );
        newEditRow.pleatAmount = calculatedPleatAmount;
        } else {
          // 겉커튼 나비/3주름이지만 productWidth가 없는 경우 기본값 설정
          if (pleatTypeVal === '나비') {
            newEditRow.pleatAmount = '1.8~2';
          } else if (pleatTypeVal === '3주름') {
            newEditRow.pleatAmount = '2.5~3';
          }
        }
      }
    }

        // 주름양 계산 로직 통합
    if (['widthMM', 'productName', 'curtainType', 'pleatType', 'widthCount', 'pleatMultiplier'].includes(field) || productDataChanged) {
      // 가로값이나 주름타입이 변경되면 사용자 수정 상태 리셋 (widthCount 직접 수정 제외)
      if (field !== 'widthCount' && ['widthMM', 'curtainType', 'pleatType'].includes(field)) {
        setUserModifiedWidthCount(false);
        // 주름타입 변경 시 폭수를 추천폭수로 리셋
        if (field === 'pleatType') {
          newEditRow.widthCount = 0; // 추천폭수 계산을 위해 0으로 리셋
        }
      }
      
      const product = productOptions.find(
        p => p.productCode === newEditRow.productCode
      );
      const widthMM = Number(newEditRow.widthMM) || 0;
      const heightMM = Number(newEditRow.heightMM) || 0;
      const pleatTypeVal = newEditRow.pleatType;
      const curtainTypeVal = newEditRow.curtainType;
      const productWidth = product ? Number(product.width) || 0 : 0;

      // 속커튼 나비주름일 때
      if (curtainTypeVal === '속커튼' && pleatTypeVal === '나비') {
        if (widthMM > 0) {
          const area = widthMM / 1000; // m²
          newEditRow.area = area;
        newEditRow.pleatAmount = '1.8~2';
        newEditRow.widthCount = 0;
        newEditRow.pleatCount = 0;
        }
      }
      // 속커튼 민자일 때
      else if (curtainTypeVal === '속커튼' && pleatTypeVal === '민자') {
        if (widthMM > 0) {
          // 주름양 배수 가져오기 (기본값 1.4배)
          const pleatMultiplier = Number(newEditRow.pleatMultiplier?.replace('배', '')) || 1.4;
          const area = (widthMM / 1000) * pleatMultiplier; // m²
          newEditRow.area = area;
          // 주름양에 숫자 값으로 저장 (예: 1.4배 → 1.4)
          newEditRow.pleatAmount = pleatMultiplier;
        }
      }
      // 겉커튼일 때
      else if (curtainTypeVal === '겉커튼' && widthMM > 0) {
        // 사용자가 입력한 폭수 값이 있으면 그 값을 우선 사용
        const userInputWidthCount = Number(newEditRow.widthCount) || 0;
        let finalWidthCount = userInputWidthCount;

        // 사용자가 폭수를 입력하지 않았거나 주름타입이 변경된 경우 추천 폭수 계산
        if (userInputWidthCount === 0 || field === 'pleatType' || !userModifiedWidthCount) {
          let pleatCount: number | string = 0;
          
          // 겉커튼 민자/나비 모두 새로운 공식 사용
          if (pleatTypeVal === '민자' || pleatTypeVal === '나비') {
            pleatCount = getPleatCount(
            widthMM,
            productWidth,
            pleatTypeVal,
            curtainTypeVal
          );
          }
          
          finalWidthCount = Number(pleatCount) || 0;
          newEditRow.widthCount = finalWidthCount;
          newEditRow.pleatCount = finalWidthCount;
          
          // 추천폭수 상태 업데이트
          setRecommendedPleatCount(finalWidthCount);
          
          // 추천 주름양 계산
          if (finalWidthCount > 0) {
            let calculatedPleatAmount = '';
            if (pleatTypeVal === '민자' || pleatTypeVal === '나비') {
              calculatedPleatAmount = calculatePleatAmountForGgeotCurtain(widthMM, finalWidthCount, productWidth);
            }
            setRecommendedPleatAmount(calculatedPleatAmount);
          } else {
            setRecommendedPleatAmount('');
          }
          
          // 디버깅 로그
          console.log('주름타입 변경 - 추천폭수 계산:', {
            field,
            pleatTypeVal,
            widthMM,
            productWidth,
            pleatCount,
            finalWidthCount,
            userModifiedWidthCount
          });
        }

        // 주름양 계산
        if (finalWidthCount > 0) {
          let calculatedPleatAmount = '';
          if (pleatTypeVal === '민자' || pleatTypeVal === '나비') {
            calculatedPleatAmount = calculatePleatAmountForGgeotCurtain(widthMM, finalWidthCount, productWidth);
          }
          newEditRow.pleatAmount = calculatedPleatAmount;
        }
      }
    }

    // 블라인드 면적 계산 (가로/세로 변경 시)
    if (['widthMM', 'heightMM'].includes(field) && newEditRow.productType === '블라인드') {
      const widthMM = Number(newEditRow.widthMM) || 0;
      const heightMM = Number(newEditRow.heightMM) || 0;
      if (widthMM > 0 && heightMM > 0) {
        let calculatedArea = (widthMM * heightMM) / 1000000 || 0;
        const product = productOptions.find(p => p.productCode === newEditRow.productCode);
        if (product && product.minOrderQty) {
          const minOrderQty = Number(product.minOrderQty) || 0;
          if (minOrderQty > 0 && calculatedArea < minOrderQty) {
            calculatedArea = minOrderQty;
          }
        }
        newEditRow.area = calculatedArea;
      }
    }

    // 실시간 금액 계산 (견적서와 동일한 로직 적용)
    if (['salePrice', 'purchaseCost', 'quantity', 'widthCount', 'area', 'largePlainPrice', 'largePlainCost'].includes(field)) {
      // 면적 계산 (겉커튼은 면적 계산하지 않음)
      let calculatedArea = Number(newEditRow.area) || 0;

      // 블라인드에서 사용자가 면적을 직접 입력한 경우(field === 'area')에는 재계산으로 덮어쓰지 않음
      const isManualAreaForBlind = field === 'area' && newEditRow.productType === '블라인드';

      if (!isManualAreaForBlind) {
        if (newEditRow.productType === '커튼') {
          if (newEditRow.curtainType === '속커튼') {
            if (newEditRow.pleatType === '민자') {
              const pleatMultiplier = Number(newEditRow.pleatMultiplier?.replace('배', '')) || 1.4;
              calculatedArea = (newEditRow.widthMM / 1000) * pleatMultiplier || 0;
            } else if (newEditRow.pleatType === '나비') {
              calculatedArea = newEditRow.widthMM / 1000 || 0;
            }
          } else {
            // 겉커튼은 면적 계산하지 않음
            calculatedArea = 0;
          }
        } else {
          calculatedArea = (newEditRow.widthMM * newEditRow.heightMM) / 1000000 || 0;
        }
      } else {
        // 사용자 입력 면적에 최소 주문 면적(minOrderQty)이 있는 경우 보정
        const product = productOptions.find(p => p.productCode === newEditRow.productCode);
        if (product && product.minOrderQty) {
          const minOrderQty = Number(product.minOrderQty) || 0;
          if (minOrderQty > 0 && calculatedArea < minOrderQty) {
            calculatedArea = minOrderQty;
          }
        }
      }
      newEditRow.area = calculatedArea;

      // 판매금액 계산
      if (newEditRow.brand?.toLowerCase() === 'hunterdouglas') {
        newEditRow.totalPrice = newEditRow.salePrice && newEditRow.quantity
          ? Math.round(newEditRow.salePrice * newEditRow.quantity)
          : 0;
      } else if (newEditRow.productType === '커튼' && newEditRow.curtainType === '겉커튼' && 
                 (newEditRow.pleatType === '민자' || newEditRow.pleatType === '나비')) {
        const basePrice = newEditRow.salePrice && newEditRow.widthCount
          ? Math.round(newEditRow.salePrice * newEditRow.widthCount)
          : 0;
        newEditRow.totalPrice = basePrice && newEditRow.quantity
          ? Math.round(basePrice * newEditRow.quantity)
          : 0;
      } else if (newEditRow.productType === '커튼' && newEditRow.curtainType === '속커튼' && newEditRow.pleatType === '민자') {
        const areaNum = Number(calculatedArea);
        let priceToUse = newEditRow.largePlainPrice;
        if (!priceToUse) {
          priceToUse = newEditRow.salePrice ? newEditRow.salePrice * 0.63 : 0;
        }
        const basePrice = priceToUse && areaNum
          ? Math.round(priceToUse * areaNum)
          : 0;
        newEditRow.totalPrice = basePrice && newEditRow.quantity
          ? Math.round(basePrice * newEditRow.quantity)
          : 0;
      } else if (newEditRow.productType === '커튼' && newEditRow.curtainType === '속커튼' && newEditRow.pleatType === '나비') {
        const areaNum = Number(calculatedArea);
        const basePrice = newEditRow.salePrice && areaNum 
          ? Math.round(newEditRow.salePrice * areaNum) 
          : 0;
        newEditRow.totalPrice = basePrice && newEditRow.quantity
          ? Math.round(basePrice * newEditRow.quantity)
          : 0;
      } else if (newEditRow.productType === '블라인드') {
        const areaNum = Number(newEditRow.area);
        const basePrice = newEditRow.salePrice && areaNum 
          ? Math.round(newEditRow.salePrice * areaNum) 
          : 0;
        newEditRow.totalPrice = basePrice && newEditRow.quantity
          ? Math.round(basePrice * newEditRow.quantity)
          : 0;
      } else {
        newEditRow.totalPrice = newEditRow.salePrice && newEditRow.quantity
          ? Math.round(newEditRow.salePrice * newEditRow.quantity)
          : 0;
      }

      // 입고금액 계산
      if (newEditRow.brand?.toLowerCase() === 'hunterdouglas') {
        const baseCost = newEditRow.salePrice ? Math.round((newEditRow.salePrice * 0.6) / 1.1) : 0;
        newEditRow.cost = baseCost && newEditRow.quantity
          ? Math.round(baseCost * newEditRow.quantity)
          : 0;
      } else if (newEditRow.productType === '블라인드') {
        const areaNum = Number(newEditRow.area);
        const baseCost = newEditRow.purchaseCost && areaNum
          ? Math.round(newEditRow.purchaseCost * areaNum)
          : 0;
        newEditRow.cost = baseCost && newEditRow.quantity
          ? Math.round(baseCost * newEditRow.quantity)
          : 0;
      } else if (newEditRow.productType === '커튼' && newEditRow.curtainType === '겉커튼' && 
                 (newEditRow.pleatType === '민자' || newEditRow.pleatType === '나비')) {
        const baseCost = newEditRow.purchaseCost && newEditRow.widthCount
          ? Math.round(newEditRow.purchaseCost * newEditRow.widthCount)
          : 0;
        newEditRow.cost = baseCost && newEditRow.quantity
          ? Math.round(baseCost * newEditRow.quantity)
          : 0;
      } else if (newEditRow.productType === '커튼' && newEditRow.curtainType === '속커튼' && newEditRow.pleatType === '민자') {
        const areaNum = Number(calculatedArea);
        let costToUse = newEditRow.largePlainCost;
        if (!costToUse) {
          costToUse = newEditRow.purchaseCost ? newEditRow.purchaseCost * 0.63 : 0;
        }
        const baseCost = costToUse && areaNum
          ? Math.round(costToUse * areaNum)
          : 0;
        newEditRow.cost = baseCost && newEditRow.quantity
          ? Math.round(baseCost * newEditRow.quantity)
          : 0;
      } else if (newEditRow.productType === '커튼' && newEditRow.curtainType === '속커튼' && newEditRow.pleatType === '나비') {
        const areaNum = Number(calculatedArea);
        const baseCost = newEditRow.purchaseCost && areaNum
          ? Math.round(newEditRow.purchaseCost * areaNum)
          : 0;
        newEditRow.cost = baseCost && newEditRow.quantity
          ? Math.round(baseCost * newEditRow.quantity)
          : 0;
      } else {
        newEditRow.cost = newEditRow.purchaseCost && newEditRow.quantity
          ? Math.round(newEditRow.purchaseCost * newEditRow.quantity)
          : 0;
      }

      // 마진 계산
      newEditRow.margin = Math.round(newEditRow.totalPrice / 1.1 - newEditRow.cost);
    }

    // 세부내용 실시간 업데이트 (커튼 관련 필드 변경 시)
    if (['curtainType', 'pleatType', 'widthCount', 'pleatAmount', 'pleatMultiplier', 'widthMM', 'heightMM'].includes(field) && 
        newEditRow.productType === '커튼') {
      const updatedDetails = updateDetailsInRealTime(newEditRow);
      newEditRow.details = updatedDetails;
    }
    
    // 블라인드 제품의 경우 가로, 세로 사이즈 변경 시 면적 정보를 세부내용에 반영하지 않음
    // (사용자가 직접 입력할 수 있도록 자동입력 비활성화)
    if (['widthMM', 'heightMM'].includes(field) && newEditRow.productType === '블라인드') {
      // 블라인드 제품에서는 면적 자동입력을 하지 않음
      // 사용자가 필요시 직접 세부내용에 입력할 수 있도록 함
    }

    // 세부내용 자동 업데이트 (주름방식, 폭수 등이 변경될 때)
    if (['curtainType', 'pleatType', 'widthCount', 'pleatAmount', 'pleatMultiplier'].includes(field)) {
      newEditRow.details = generateAutoDetails(newEditRow);
    }

    // 상태 업데이트 (무한 루프 방지)
      setEditRow(newEditRow);
  };

  const handleEditSave = () => {
    if (editRowIdx === null) return;
    const newRows = [...estimates[activeTab].rows];

    // 1. 다이얼로그의 수정된 정보로 시작
    const updatedRow = { ...editRow };

    // 2. 핵심 값들이 유효한 숫자인지 확인
    updatedRow.widthMM = Number(updatedRow.widthMM) || 0;
    updatedRow.heightMM = Number(updatedRow.heightMM) || 0;
    updatedRow.quantity = Number(updatedRow.quantity) || 1;

    // 3. 제품 정보 찾기
    const product = productOptions.find(
      p =>
        p.productCode === updatedRow.productCode ||
        p.productName === updatedRow.productName
    );
    const productWidth = product ? Number(product.width) || 0 : 0;

    // 4. 제품 유형에 따른 계산 수행
    // 4-1. 겉커튼: 폭수, 주름양 계산
    if (
      updatedRow.productType === '커튼' &&
      updatedRow.curtainType === '겉커튼'
    ) {
      // 사용자가 임의로 입력한 폭수 값이 있으면 그 값을 우선 사용
      const userInputWidthCount = Number(updatedRow.widthCount) || 0;
      
      if (userInputWidthCount > 0) {
        // 사용자가 입력한 폭수 값을 사용
        updatedRow.widthCount = userInputWidthCount;
      } else {
        // 사용자가 입력하지 않았으면 추천 폭수 계산
        updatedRow.widthCount =
          getPleatCount(
            updatedRow.widthMM,
            productWidth,
            updatedRow.pleatType,
            updatedRow.curtainType
          ) || 0;
      }
      
      // 폭수가 있으면 주름양 계산
      if (updatedRow.widthCount > 0) {
        let calculatedPleatAmount = '';
        
        // 겉커튼 민자/나비는 새로운 계산 함수 사용
        if (updatedRow.pleatType === '민자' || updatedRow.pleatType === '나비') {
          calculatedPleatAmount = calculatePleatAmountForGgeotCurtain(
            updatedRow.widthMM, 
            updatedRow.widthCount, 
            productWidth
          );
        } else {
          // 기존 함수 사용
          calculatedPleatAmount = getPleatAmount(
            updatedRow.widthMM,
            productWidth,
            updatedRow.pleatType,
            updatedRow.curtainType,
            updatedRow.widthCount
          );
        }
        
        updatedRow.pleatAmount = calculatedPleatAmount || '';
      }
    }
    
    // 4-2. 속커튼: 주름양 계산
    if (
      updatedRow.productType === '커튼' &&
      updatedRow.curtainType === '속커튼'
    ) {
      if (updatedRow.pleatType === '나비') {
        updatedRow.pleatAmount = '1.8~2';
        updatedRow.widthCount = 0;
      } else if (updatedRow.pleatType === '민자') {
        // 속커튼 민자는 주름양 배수 값을 숫자로 저장
        const pleatMultiplier = Number(updatedRow.pleatMultiplier?.replace('배', '')) || 1.4;
        updatedRow.pleatAmount = pleatMultiplier;
      }
    }

    // 4-3. 면적 계산 (겉커튼은 면적 계산하지 않음)
    if (updatedRow.curtainType === '겉커튼') {
      updatedRow.area = 0;
    } else if (updatedRow.productType === '블라인드' && (updatedRow as any).isManualArea) {
      // 블라인드이면서 사용자가 면적을 수동으로 입력한 경우, 기존 면적 유지 (자동 계산 건너뜀)
    } else {
      updatedRow.area =
        Number(
          getArea(
            updatedRow.productType,
            updatedRow.widthMM,
            updatedRow.heightMM,
            updatedRow.curtainType,
            updatedRow.pleatType,
            updatedRow.pleatAmount,
            updatedRow.pleatAmountCustom,
            updatedRow.productCode,
            updatedRow.productName,
            productOptions
          )
        ) || 0;
    }

    // 5. 최종 금액 및 원가 계산
    updatedRow.totalPrice =
      Number(getTotalPrice(updatedRow, updatedRow.area)) || 0;
    updatedRow.cost =
      Number(getPurchaseTotal(updatedRow, updatedRow.area)) || 0;

    // 6. 마진 계산
    updatedRow.margin = Math.round(
      updatedRow.totalPrice / 1.1 - updatedRow.cost
    );

    // 7. 세부내용 자동 업데이트 (편집된 값으로 계산)
    const details: string[] = [];

    // 제품의 기본 정보 추가 (편집된 값 사용)
    if (updatedRow.productType === '커튼') {
      if (updatedRow.curtainType === '겉커튼') {
        if (updatedRow.widthCount) details.push(`${updatedRow.widthCount}폭`);
        if (updatedRow.pleatType) details.push(updatedRow.pleatType);
        if (updatedRow.pleatAmount) details.push(updatedRow.pleatAmount.toString());
      } else if (updatedRow.curtainType === '속커튼') {
        if (updatedRow.pleatType) details.push(updatedRow.pleatType);
        if (updatedRow.pleatAmount) details.push(updatedRow.pleatAmount.toString());
      }
    }

    // 연결된 옵션들 찾기 (productId로 연결된 옵션들)
    const connectedOptions = newRows.filter(r => 
      r.type === 'option' && r.productId === updatedRow.id
    );

    // 옵션 정보 추가 (레일 제외)
    connectedOptions.forEach(option => {
      const optionName = option.optionLabel || option.productName;
      if (optionName && optionName !== '레일') {
        details.push(optionName);
      }
    });

    updatedRow.details = details.join(', ');

    // 8. 최종적으로 업데이트된 행을 견적서에 반영
    newRows[editRowIdx] = updatedRow;
    updateEstimateRows(activeTab, newRows);

    // 8. 다이얼로그 닫기 및 상태 초기화
    setEditOpen(false);
    setEditRowIdx(null);
    setEditRow(null);
    setRecommendedPleatCount(0);
    setRecommendedPleatAmount('');
    setUserModifiedWidthCount(false);
  };

  const handleEditClose = () => {
    setEditOpen(false);
    setEditRowIdx(null);
    setEditRow(null);
    setRecommendedPleatCount(0);
    setRecommendedPleatAmount('');
    setUserModifiedWidthCount(false);
  };

  const handleFilterCheck = (key: string) => {
    setActiveFilters(f => ({ ...f, [key]: !f[key] }));
  };

  const handleFilterReset = () => {
    const reset: { [key: string]: boolean } = {};
    FILTER_FIELDS.forEach(field => {
      reset[field.key] = field.visible;
    });
    setColumnVisibility(reset);
    setFilterModalOpen(false);
  };

  const handleSaveAsDefault = () => {
    try {
      // 현재 체크된 항목들을 기본설정값으로 저장
      localStorage.setItem('estimateListDisplayDefault', JSON.stringify(columnVisibility));
      alert('현재 설정이 기본값으로 저장되었습니다.');
    } catch (e) {
      console.error('기본값 저장 실패:', e);
      alert('기본값 저장에 실패했습니다.');
    }
  };

  // Move getRowValue inside the component so it can access productOptions
  const getRowValue = (row: any, key: string) => {
    const numericKeys = [
      'totalPrice',
      'salePrice',
      'cost',
      'purchaseCost',
      'margin',
      'widthCount',
      'quantity',
      'area',
    ];

    // 겉커튼일 때 면적값을 빈값으로 표시
    if (key === 'area' && row.curtainType === '겉커튼') {
      return '';
    }
    
    // 면적값이 0일 때 빈값으로 표시
    if (key === 'area' && (!row.area || row.area === 0)) {
      return '';
    }

    // 가로, 세로 값에 천 단위 구분 쉼표 추가
    if (key === 'widthMM' || key === 'heightMM') {
      const value = row[key];
      if (typeof value === 'number' && value > 0) {
        return value.toLocaleString();
      }
      return value || '';
    }

    if (numericKeys.includes(key)) {
      const value = row[key];
      return typeof value === 'number' ? value.toLocaleString() : value;
    }

    // 줄방향 표시 (lineDirection 사용)
    if (key === 'lineDir') {
      return row.lineDirection || '';
    }

    // 공간명 표시 (직접입력 시 커스텀 값 우선)
    if (key === 'space') {
      if (row.space === '직접입력' && row.spaceCustom) {
        return row.spaceCustom;
      }
      return row.space;
    }

    // 주름양 표시 (0일 때 빈값으로 표시)
    if (key === 'pleatAmount') {
      const value = row[key];
      if (value === 0 || value === '0' || value === '') {
        return '';
      }
      return value;
    }

    // 줄길이 표시 (lineLength 사용, 직접입력인 경우 customLineLength 표시)
    if (key === 'lineLen') {
      if (row.lineLength === '직접입력') {
        return row.customLineLength || '';
      }
      return row.lineLength || '';
    }

    // 숫자 값들에 천 단위 구분자 추가
    const value = row[key];
    if (typeof value === 'number') {
      return value.toLocaleString();
    }

    return value;
  };

  // 필터링된 행
  const filteredRows = estimates[activeTab].rows.filter(row =>
    FILTER_FIELDS.every(f => {
      if (!activeFilters[f.key]) return true;
      const val = getRowValue(row, f.key);
      return val !== undefined && val !== null && val !== '';
    })
  );

  const handleColumnToggle = (key: string) => {
    setColumnVisibility(prev => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  // WINDOWSTORY 버튼 토글 핸들러 - 입고금액, 입고원가, 마진 항목 표시/숨김
  const handleToggleMarginColumns = () => {
    setColumnVisibility(prev => ({
      ...prev,
      cost: !prev.cost,
      purchaseCost: !prev.purchaseCost,
      margin: !prev.margin,
    }));
  };

  // 계약생성 모달 상태
  const [contractModalOpen, setContractModalOpen] = useState(false);
  // 현재 견적의 계약 카드 리스트
  const [contractsForCurrentEstimate, setContractsForCurrentEstimate] = useState<any[]>([]);
  // 계약서 저장 후 목록 갱신을 위한 트리거
  const [contractRefreshTrigger, setContractRefreshTrigger] = useState(0);
  // 계약서 카드 섹션 펼침/접힘 상태
  const [contractSectionExpanded, setContractSectionExpanded] = useState(false);

  // 탭 변경/견적 변경 시 현재 견적에 연결된 계약 카드 목록 갱신
  useEffect(() => {
    try {
      const currentEstimateNo = estimates[activeTab]?.estimateNo;
      if (!currentEstimateNo) {
        setContractsForCurrentEstimate([]);
        return;
      }
      const saved: any[] = JSON.parse(localStorage.getItem('contracts') || '[]');
      const list = saved.filter(c => c.estimateNo === currentEstimateNo);
      list.sort((a: any, b: any) => (b.id || 0) - (a.id || 0));
      setContractsForCurrentEstimate(list);
      console.log(`견적번호 ${currentEstimateNo}의 계약서 목록 갱신:`, list.length, '개');
    } catch (error) {
      console.error('계약서 목록 로드 실패:', error);
      setContractsForCurrentEstimate([]);
    }
  }, [activeTab, estimates, contractRefreshTrigger]);

  // 견적서 데이터가 변경될 때마다 계약서 목록도 갱신
  useEffect(() => {
    if (estimates && estimates.length > 0 && activeTab >= 0) {
      setContractRefreshTrigger(prev => prev + 1);
    }
  }, [estimates, activeTab]);

  // 견적서 탭 변경 시 계약서 목록 강제 갱신
  useEffect(() => {
    if (estimates && estimates.length > 0 && activeTab >= 0) {
      const currentEstimateNo = estimates[activeTab]?.estimateNo;
      if (currentEstimateNo) {
        try {
          const saved: any[] = JSON.parse(localStorage.getItem('contracts') || '[]');
          const list = saved.filter(c => c.estimateNo === currentEstimateNo);
          list.sort((a: any, b: any) => (b.id || 0) - (a.id || 0));
          setContractsForCurrentEstimate(list);
          console.log(`견적서 탭 변경 - 견적번호 ${currentEstimateNo}의 계약서 목록:`, list.length, '개');
          
          // 계약서가 있으면 자동으로 섹션 펼치기
          if (list.length > 0) {
            setContractSectionExpanded(true);
          }
        } catch (error) {
          console.error('견적서 탭 변경 시 계약서 목록 로드 실패:', error);
          setContractsForCurrentEstimate([]);
        }
      }
    }
  }, [activeTab, estimates]);


  // 세부내용 자동입력 함수
  const generateAutoDetails = (row: EstimateRow) => {
    const details: string[] = [];
    const currentRows = estimates[activeTab]?.rows || [];

    // 제품의 기본 정보 추가
    if (row.productType === '커튼') {
      if (row.curtainType === '겉커튼') {
        if (row.widthCount) details.push(`${row.widthCount}폭`);
        if (row.pleatType) details.push(row.pleatType);
        if (row.pleatAmount) details.push(row.pleatAmount.toString());
      } else if (row.curtainType === '속커튼') {
        if (row.pleatType) details.push(row.pleatType);
        if (row.pleatAmount) details.push(row.pleatAmount.toString());
      }
    } else if (row.productType === '블라인드') {
      // 블라인드는 기본 정보만 표시
    }

    // 연결된 옵션들 찾기 (productId로 연결된 옵션들)
    const connectedOptions = currentRows.filter(r => 
      r.type === 'option' && r.productId === row.id
    );

    // 옵션 정보 추가 (레일 제외)
    connectedOptions.forEach(option => {
      const optionName = option.optionLabel || option.productName;
      if (optionName && optionName !== '레일') {
        details.push(optionName);
      }
    });

    return details.join(', ');
  };

  // 옵션 금액 계산 함수 (getTotalConsumerAmount보다 먼저 선언)
  const getOptionAmount = (option: any, row: any) => {
    const optionType = option.note;
    const salePrice = Number(option.salePrice) || 0;
    const quantity = Number(option.quantity) || 1;

    // % 적용타입 처리
    if (optionType && optionType.includes('%')) {
      const percent = parseFloat(optionType.replace('%', ''));
      if (!isNaN(percent)) {
        // 제품의 판매금액에 퍼센트 적용
        const productTotalPrice = Number(row.totalPrice) || 0;
        return Math.round(productTotalPrice * (percent / 100));
      }
    }

    switch (optionType) {
      case '폭당':
        // 폭당: 단가 × 폭수
        const widthCount = Number(row.widthCount) || 0;
        return salePrice * widthCount * quantity;

      case 'm당':
        // m당: 단가 × 가로(mm) / 1000
        const widthMM = Number(row.widthMM) || 0;
        return salePrice * (widthMM / 1000) * quantity;

      case '추가':
        // 추가: 단가
        return salePrice * quantity;

      case '포함':
        // 포함: 0원
        return 0;

      case 'm2당':
        // m2당: 단가 × 면적(m²)
        const area = Number(row.area) || 0;
        return salePrice * area * quantity;

      default:
        return salePrice * quantity;
    }
  };

  // 옵션 입고금액 계산 함수 (getTotalConsumerAmount보다 먼저 선언)
  const getOptionPurchaseAmount = (option: any, row: any) => {
    const optionType = option.note;
    const purchaseCost = Number(option.purchaseCost) || 0;
    const quantity = Number(option.quantity) || 1;

    // % 적용타입 처리
    if (optionType && optionType.includes('%')) {
      const percent = parseFloat(optionType.replace('%', ''));
      if (!isNaN(percent)) {
        // 제품의 입고금액에 퍼센트 적용
        const productCost = Number(row.cost) || 0;
        return Math.round(productCost * (percent / 100));
      }
    }

    switch (optionType) {
      case '폭당':
        const widthCount = Number(row.widthCount) || 0;
        return purchaseCost * widthCount * quantity;
      case 'm당':
        const widthMM = Number(row.widthMM) || 0;
        return purchaseCost * (widthMM / 1000) * quantity;
      case '추가':
        return purchaseCost * quantity;
      case '포함':
        return 0;
      case 'm2당':
        const area = Number(row.area) || 0;
        return purchaseCost * area * quantity;
      default:
        return purchaseCost * quantity;
    }
  };

  // 소비자금액 계산 함수 (옵션 포함)
  function getTotalConsumerAmount(rows: EstimateRow[]) {
    let total = 0;
    for (const row of rows) {
      // 레일 옵션이 아닌 경우에만 판매금액에 포함
      if (row.type === 'product' || (row.type === 'option' && row.optionLabel !== '레일')) {
        total += row.totalPrice || 0;

        // 제품의 경우 추가 옵션도 계산
        if (row.type === 'product' && row.options && row.options.length > 0) {
          for (const opt of row.options) {
            total += getOptionAmount(opt, row);
          }
        }
      }
    }
    return total;
  }

  // 옵션 합계금액 계산 함수 추가
  function getOptionTotalAmount(rows: EstimateRow[]): number {
    return rows.reduce((totalSum, row) => {
      if (!row) return totalSum;
      if (row.type === 'product' && row.options && row.options.length > 0) {
        const rowOptionSum = row.options.reduce((optionSum, option) => {
          return optionSum + getOptionAmount(option, row);
        }, 0);
        return totalSum + rowOptionSum;
      }
      return totalSum;
    }, 0);
  }

  // 제품 합계금액 계산 (제품의 판매금액만 합산)
  const productTotalAmount = estimates[activeTab].rows.reduce((sum, row) => {
    if (!row) return sum;
    if (row.type === 'product') {
      // 이미 계산된 totalPrice를 사용 (중복 계산 방지)
      return sum + (row.totalPrice || 0);
    }
    return sum;
  }, 0);

  // 옵션 합계금액 계산 (옵션 행들의 판매금액 합산)
  const optionTotalAmount = estimates[activeTab].rows.reduce((sum, row) => {
    if (!row) return sum;
    if (row.type === 'option') {
      return sum + (row.totalPrice || 0);
    }
    return sum;
  }, 0);

  // 최종 합계금액 (제품 합계 + 옵션 합계)
  const sumTotalPrice = productTotalAmount + optionTotalAmount;

  // 전체 입고금액 계산 함수 추가
  const getTotalPurchaseAmount = (rows: EstimateRow[]) => {
    return rows.reduce((total, row) => {
      if (!row) return total;
      if (row.type === 'product') {
        // 이미 계산된 cost를 사용 (중복 계산 방지)
        total += row.cost || 0;

        // 제품의 추가 옵션 입고금액도 계산
        if (row.options && row.options.length > 0) {
          for (const opt of row.options) {
            total += getOptionPurchaseAmount(opt, row);
          }
        }
      } else if (row.type === 'option') {
        // 옵션 행의 입고금액 (레일 등)
        total += row.cost || 0;
      }
      return total;
    }, 0);
  };

  // 전체 입고금액 계산
  const totalPurchaseAmount = getTotalPurchaseAmount(estimates[activeTab].rows);

  // 마진 계산 (사용자 제안 방식)
  // 할인이 적용된 경우: 할인후금액/1.1 - 제품의 입고금액 - 옵션의 입고금액
  // 할인이 없는 경우: 소비자금액/1.1 - 제품의 입고금액 - 옵션의 입고금액
  const sumMargin = (() => {
    const discountAmountNumber = Number(discountAmount);
    const baseAmount =
      discountAmountNumber > 0
        ? sumTotalPrice - discountAmountNumber
        : sumTotalPrice;
    // 0으로 나누기 방지 및 음수 방지
    if (baseAmount <= 0) return 0;
    return Math.round(baseAmount / 1.1 - totalPurchaseAmount);
  })();

  // 할인후금액 입력 시 할인금액, 할인율 자동 계산
  const handleDiscountedTotalChange = (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const value = e.target.value.replace(/[^\d]/g, '');
    setDiscountedTotalInput(value);
    if (!value) return;
    const discounted = Number(value);
    if (!sumTotalPrice || discounted < 0) {
      setDiscountAmount('');
      setDiscountRate('');
      return;
    }
    const discountAmt = sumTotalPrice - discounted;
    setDiscountAmount(discountAmt.toString());
    // 0으로 나누기 방지
    setDiscountRate(
      sumTotalPrice > 0
        ? ((discountAmt / sumTotalPrice) * 100).toFixed(2)
        : '0.00'
    );
  };

  // 할인금액 입력 시 할인율, 할인후금액 자동 계산
  const handleDiscountAmountChange = (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const value = e.target.value.replace(/[^\d]/g, '');
    setDiscountAmount(value);
    // 0으로 나누기 방지
    if (sumTotalPrice > 0 && Number(value) > 0) {
      setDiscountRate(((Number(value) / sumTotalPrice) * 100).toFixed(2));
    } else {
      setDiscountRate('');
    }
  };
  // 할인율 입력 시 할인금액, 할인후금액 자동 계산
  const handleDiscountRateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/[^\d.]/g, '');
    setDiscountRate(value);
    // 0으로 나누기 방지
    if (sumTotalPrice > 0 && Number(value) > 0) {
      setDiscountAmount(
        Math.round((Number(value) / 100) * sumTotalPrice).toString()
      );
    } else {
      setDiscountAmount('');
    }
  };

  // HunterDouglas 버튼 토글
  const handleToggleDiscount = () => setShowDiscount(v => !v);

  // 할인 값이 존재하면 자동으로 할인 영역 표시 강제
  useEffect(() => {
    const hasAnyDiscount = Boolean(
      (discountAmount && Number(discountAmount) > 0) ||
      (discountRate && Number(discountRate) > 0) ||
      (discountedTotalInput && Number(discountedTotalInput) > 0)
    );
    if (hasAnyDiscount && !showDiscount) {
      setShowDiscount(true);
    }
  }, [discountAmount, discountRate, discountedTotalInput, showDiscount]);

  // 할인 후 금액 계산
  const discountAmountNumber = Number(discountAmount);
  const discountedTotal =
    discountAmountNumber > 0
      ? sumTotalPrice - discountAmountNumber
      : sumTotalPrice;

  const handleOutputClick = (event: React.MouseEvent<HTMLElement>) => {
    setOutputAnchorEl(event.currentTarget);
  };

  const handleOutputClose = () => {
    setOutputAnchorEl(null);
  };

  const handleOutputOption = async (option: string) => {
    handleOutputClose();

    if (option === 'print') {
      // 프린트의 경우 견적서 양식 모달을 먼저 열기
      setShowEstimateTemplate(true);
      return;
    }

    // 숨겨진 estimate-template 요소 찾기
    const captureElement = document.querySelector(
      '.estimate-template'
    ) as HTMLElement;
    if (!captureElement) {
      alert('견적서 템플릿을 찾을 수 없습니다.');
      return;
    }

    // 캡처 전에 요소를 임시로 보이게 만들기
    const originalVisibility = captureElement.style.visibility;
    const originalPosition = captureElement.style.position;
    const originalLeft = captureElement.style.left;
    const originalTop = captureElement.style.top;

    captureElement.style.visibility = 'visible';
    captureElement.style.position = 'absolute';
    captureElement.style.left = '0px';
    captureElement.style.top = '0px';
    captureElement.style.zIndex = '9999';

    try {
      const canvas = await html2canvas(captureElement, {
        scale: 1.5,
        backgroundColor: '#ffffff',
        useCORS: true,
        allowTaint: true,
      });

      switch (option) {
        case 'pdf': {
          const imgData = canvas.toDataURL('image/png');
          const pdf = new jsPDF('p', 'mm', 'a4');
          const pdfWidth = pdf.internal.pageSize.getWidth();
          const pdfHeight = pdf.internal.pageSize.getHeight();
          const canvasWidth = canvas.width;
          const canvasHeight = canvas.height;
          const ratio = canvasWidth / canvasHeight;
          const width = pdfWidth;
          const height = width / ratio;
          pdf.addImage(
            imgData,
            'PNG',
            0,
            0,
            width,
            height > pdfHeight ? pdfHeight : height
          );
          pdf.save(`${estimates[activeTab]?.estimateNo || 'estimate'}.pdf`);
          break;
        }
        case 'jpg': {
          const imgData = canvas.toDataURL('image/png');
          const link = document.createElement('a');
          link.href = imgData;
          link.download = `${estimates[activeTab]?.estimateNo || 'estimate'}.png`;
          link.click();
          break;
        }
        case 'share': {
          if (navigator.share) {
            canvas.toBlob(async blob => {
              if (blob) {
                try {
                  await navigator.share({
                    files: [
                      new File(
                        [blob],
                        `${estimates[activeTab]?.estimateNo || 'estimate'}.png`,
                        { type: 'image/png' }
                      ),
                    ],
                    title: '견적서 공유',
                    text: `견적서(${estimates[activeTab]?.estimateNo})를 확인하세요.`,
                  });
                } catch (error) {
                  alert('공유 실패: ' + error);
                }
              }
            }, 'image/png');
          } else {
            alert('공유하기가 지원되지 않는 브라우저입니다.');
          }
          break;
        }
        default:
          break;
      }
    } catch (error) {
      console.error('출력 오류:', error);
      alert('출력 중 오류가 발생했습니다: ' + error);
    } finally {
      // 원래 상태로 복원
      captureElement.style.visibility = originalVisibility;
      captureElement.style.position = originalPosition;
      captureElement.style.left = originalLeft;
      captureElement.style.top = originalTop;
      captureElement.style.zIndex = '';
    }
  };

  const handleProductRowClick = (idx: number) => {
    setSelectedProductIdx(selectedProductIdx === idx ? null : idx);
  };

  // 행 우클릭 메뉴 핸들러
  const handleRowContextMenu = (event: React.MouseEvent, rowIndex: number, row: any) => {
    event.preventDefault();
    console.log('행 우클릭 메뉴 호출됨');
    console.log('rowIndex:', rowIndex);
    console.log('row:', row);
    console.log('row.type:', row.type);
    
    setRowContextMenu({
      mouseX: event.clientX + 2,
      mouseY: event.clientY - 6,
      rowIndex: rowIndex,
      row: row,
    });
  };

  const handleCloseRowContextMenu = () => {
    setRowContextMenu(null);
  };

  // 행 우클릭 메뉴 액션 핸들러
  const handleRowContextMenuAction = (action: string) => {
    if (!rowContextMenu) return;

    const { rowIndex, row } = rowContextMenu;
    
    switch (action) {
      case 'edit':
        // 옵션인 경우 옵션 수정 모달 열기
        if (row.type === 'option') {
          handleEditOption(row);
        } else {
          // 제품인 경우 제품 정보 수정 모달 열기
          handleRowClick(rowIndex);
        }
        break;
      case 'productSearch':
        // 제품검색 모달 열기 (제품인 경우에만)
        console.log('productSearch 액션 호출됨');
        console.log('row.type:', row.type);
        console.log('rowIndex:', rowIndex);
        
        if (row.type === 'product') {
          console.log('제품 행이므로 selectedProductIdx 설정 및 제품검색 모달 열기');
          console.log('설정할 rowIndex:', rowIndex);
          setSelectedProductIdx(rowIndex);
          console.log('selectedProductIdx 설정 완료');
          setProductDialogOpen(true);
          console.log('제품검색 모달 열기 완료');
        }
        break;
      case 'addOption':
        // 옵션 추가 (제품인 경우에만)
        if (row.type === 'product') {
          setSelectedProductIdx(rowIndex);
          handleOpenOptionDialog();
        }
        break;
      case 'bulkEdit':
        // 일괄변경 (제품인 경우에만)
        if (row.type === 'product') {
          setSelectedProductIdx(rowIndex);
          handleBulkEditModeToggle();
        }
        break;
      case 'copy':
        handleCopyRow(rowIndex);
        break;
      case 'divideSplit':
        // 나누기(분할) - 블라인드 제품인 경우에만
        if (row.productType === '블라인드' && row.type === 'product') {
          setSelectedRowForDivide(row);
          setDivideType('split');
          setDivideModalOpen(true);
        }
        break;
      case 'divideCopy':
        // 나누기(복사) - 블라인드 제품인 경우에만
        if (row.productType === '블라인드' && row.type === 'product') {
          setSelectedRowForDivide(row);
          setDivideType('copy');
          setDivideModalOpen(true);
        }
        break;
      case 'delete':
        // 옵션인 경우 옵션 삭제, 제품인 경우 제품 삭제
        if (row.type === 'option') {
          // 옵션 삭제 로직
          const updatedRows = [...estimates[activeTab].rows];
          updatedRows.splice(rowIndex, 1);
          updateEstimateRows(activeTab, updatedRows);
        } else {
          // 제품 삭제 로직
          const updatedRows = [...estimates[activeTab].rows];
          updatedRows.splice(rowIndex, 1);
          updateEstimateRows(activeTab, updatedRows);
        }
        break;
    }
    
    setRowContextMenu(null);
  };

  // 블라인드 나누기 처리 함수
  const handleDivideBlind = () => {
    console.log('handleDivideBlind 호출됨');
    console.log('selectedRowForDivide:', selectedRowForDivide);
    
    if (!selectedRowForDivide) {
      console.log('selectedRowForDivide가 없음');
      return;
    }

    const originalRow = selectedRowForDivide;
    const currentEstimate = estimates[activeTab];
    const originalIndex = currentEstimate.rows.findIndex((r: any) => r.id === originalRow.id);
    
    console.log('originalRow:', originalRow);
    console.log('currentEstimate:', currentEstimate);
    console.log('originalIndex:', originalIndex);
    
    if (originalIndex === -1) {
      console.log('originalIndex를 찾을 수 없음');
      return;
    }

    // 공간명 생성
    const baseSpaceName = originalRow.space || '공간';
    const spaceNames = generateSpaceNames(baseSpaceName, divideCount);
    
    // 나눈 제품들 생성
    const dividedProducts: any[] = [];
    
    for (let i = 0; i < divideCount; i++) {
      const newProduct = { ...originalRow };
      newProduct.id = Date.now().toString() + Math.random().toString(36).substr(2, 9);
      newProduct.space = spaceNames[i];
      
      if (divideType === 'split') {
        // 분할: 가로 사이즈를 균등하게 나누기
        const originalWidth = Number(originalRow.widthMM) || 0;
        const dividedWidth = Math.round(originalWidth / divideCount);
        newProduct.widthMM = dividedWidth;
        
        // 면적 재계산
        const heightMM = Number(originalRow.heightMM) || 0;
        let calculatedArea = (dividedWidth * heightMM) / 1000000;
        
        // 블라인드일 때 최소주문수량 적용
        if (newProduct.productType === '블라인드') {
          const product = productOptions.find(
            (p: any) => p.productCode === newProduct.productCode || p.productName === newProduct.productName
          );
          if (product && product.minOrderQty) {
            const minOrderQty = Number(product.minOrderQty) || 0;
            if (minOrderQty > 0 && calculatedArea < minOrderQty) {
              calculatedArea = minOrderQty;
            }
          }
        }
        newProduct.area = calculatedArea;
        
        // 세부내용 업데이트
        newProduct.details = updateDetailsInRealTime(newProduct);
        
        // 판매가와 원가를 새로운 면적에 맞게 재계산
        const originalArea = Number(originalRow.area) || 0;
        const newArea = Number(newProduct.area) || 0;
        
        if (originalArea > 0 && newArea > 0) {
          const areaRatio = newArea / originalArea;
          
          // 판매가 재계산
          const originalSalePrice = Number(originalRow.salePrice) || 0;
          newProduct.salePrice = Math.round(originalSalePrice * areaRatio);
          
          // 원가 재계산
          const originalPurchaseCost = Number(originalRow.purchaseCost) || 0;
          newProduct.purchaseCost = Math.round(originalPurchaseCost * areaRatio);
          
          // 대형평면 판매가/원가 재계산 (있는 경우)
          if (originalRow.largePlainPrice) {
            const originalLargePlainPrice = Number(originalRow.largePlainPrice) || 0;
            newProduct.largePlainPrice = Math.round(originalLargePlainPrice * areaRatio);
          }
          if (originalRow.largePlainCost) {
            const originalLargePlainCost = Number(originalRow.largePlainCost) || 0;
            newProduct.largePlainCost = Math.round(originalLargePlainCost * areaRatio);
          }
        }
      }
      // copy 타입은 가로 사이즈 변경 없음
      
      // copy 타입의 경우에도 금액 재계산 (새로운 제품이므로)
      if (divideType === 'copy') {
        const originalArea = Number(originalRow.area) || 0;
        const newArea = Number(newProduct.area) || 0;
        
        if (originalArea > 0 && newArea > 0) {
          const areaRatio = newArea / originalArea;
          
          // 판매가 재계산
          const originalSalePrice = Number(originalRow.salePrice) || 0;
          newProduct.salePrice = Math.round(originalSalePrice * areaRatio);
          
          // 원가 재계산
          const originalPurchaseCost = Number(originalRow.purchaseCost) || 0;
          newProduct.purchaseCost = Math.round(originalPurchaseCost * areaRatio);
          
          // 대형평면 판매가/원가 재계산 (있는 경우)
          if (originalRow.largePlainPrice) {
            const originalLargePlainPrice = Number(originalRow.largePlainPrice) || 0;
            newProduct.largePlainPrice = Math.round(originalLargePlainPrice * areaRatio);
          }
          if (originalRow.largePlainCost) {
            const originalLargePlainCost = Number(originalRow.largePlainCost) || 0;
            newProduct.largePlainCost = Math.round(originalLargePlainCost * areaRatio);
          }
        }
      }
      
      dividedProducts.push(newProduct);
    }
    
    // 원본 제품 제거하고 나눈 제품들 삽입
    const newRows = [...currentEstimate.rows];
    newRows.splice(originalIndex, 1, ...dividedProducts);
    
    // 견적서 업데이트
    updateEstimateRows(activeTab, newRows);
    
    // 모달 닫기
    setDivideModalOpen(false);
    setRowContextMenu(null);
    setSelectedRowForDivide(null);
    
    // 성공 메시지
    const actionText = divideType === 'split' ? '분할' : '복사';
    setSnackbarMessage(`블라인드 제품이 ${divideCount}개로 ${actionText}되었습니다.`);
    setSnackbarOpen(true);
  };

  // 옵션 추가 다이얼로그 열기 (제품 선택 없이도 가능)
  const handleOpenOptionDialog = () => {
    // 제품이 선택된 경우 해당 제품에 맞는 옵션 타입으로 설정
    if (selectedProductIdx !== null) {
      const selectedProduct = estimates[activeTab].rows[selectedProductIdx];
      if (selectedProduct && selectedProduct.type === 'product') {
        // 제품 종류에 따라 해당하는 옵션 탭 설정
        const productType = selectedProduct.productType;
        let targetOptionType = '';

        switch (productType) {
          case '커튼':
            targetOptionType = '커튼';
            break;
          case '블라인드':
            targetOptionType = '블라인드';
            break;
          case '커튼전동':
            targetOptionType = '커튼전동';
            break;
          case '블라인드전동':
            targetOptionType = '블라인드전동';
            break;
          case '헌터':
            targetOptionType = '헌터';
            break;
          default:
            targetOptionType = '기타';
            break;
        }

        // 해당 옵션 타입의 인덱스 찾기
        const typeIndex = optionTypeMap.indexOf(targetOptionType);
        if (typeIndex >= 0) {
          setOptionSearchTab(typeIndex);
          setOptionSearch('');

          // 해당 타입의 옵션만 로드
          const all: any[] = loadOptions();
          const targetOptions = all[typeIndex] || [];
          const sortedOptions = sortOptions(targetOptions);
          setOptionResults(sortedOptions);

          console.log(`제품 종류: ${productType}, 표시할 옵션 타입: ${targetOptionType}, 옵션 개수: ${sortedOptions.length}`);
        } else {
          // 기본값으로 커튼 옵션 표시
          setOptionSearchTab(0);
          setOptionSearch('');
          const all: any[] = loadOptions();
          const sortedOptions = sortOptions(all[0] || []);
          setOptionResults(sortedOptions);
        }
      }
    } else {
      // 제품이 선택되지 않은 경우 시공옵션 탭을 기본으로 표시
      const constructionOptionIndex = optionTypeMap.indexOf('시공옵션');
      if (constructionOptionIndex >= 0) {
        setOptionSearchTab(constructionOptionIndex);
        setOptionSearch('');
        const all: any[] = loadOptions();
        const constructionOptions = all[constructionOptionIndex] || [];
        const sortedOptions = sortOptions(constructionOptions);
        setOptionResults(sortedOptions);
        console.log(`시공옵션 표시, 옵션 개수: ${sortedOptions.length}`);
      } else {
        // 시공옵션이 없으면 커튼 옵션 표시
        setOptionSearchTab(0);
        setOptionSearch('');
        const all: any[] = loadOptions();
        const sortedOptions = sortOptions(all[0] || []);
        setOptionResults(sortedOptions);
      }
    }

    // 수량 초기화
    setOptionQuantity(1);
    setOptionDialogOpen(true);
  };

  const handleDeleteOption = (productIdx: number, optionId: number) => {
    const updatedRows = [...estimates[activeTab].rows];
    const product = updatedRows[productIdx];

    if (product && product.options) {
      product.options = product.options.filter(opt => opt.id !== optionId);
      updatedRows[productIdx] = product;
      updateEstimateRows(activeTab, updatedRows);
    }
  };

  // 레일추가 핸들러 함수
  const handleAddRailOption = () => {
    // 1. 현재 견적서의 제품 행만 추출
    const rows = estimates[activeTab].rows;
    const productRows = rows.filter(row => row.type === 'product');
    if (productRows.length === 0) {
      alert('추가할 제품이 없습니다.');
      return;
    }

    // 2. 제품별로 필요한 레일 수를 공간별로 분류하여 계산
    const railSpaceMap: { [space: string]: { [length: number]: number } } = {};
    let totalRailCount = 0;

    productRows.forEach(row => {
      // 커튼만 적용 (블라인드 제외)
      if (row.productType === '커튼') {
        const widthMM = Number(row.widthMM) || 0;
        const space = row.space || '기타';

        if (widthMM > 0) {
          // 제품당 1개씩 추가
          totalRailCount += 1;

          // 레일 길이별로 분류 (제품 가로 길이 그대로 사용)
          const railLength = Math.ceil(widthMM / 293); // mm를 자 단위로 변환

          if (!railSpaceMap[space]) {
            railSpaceMap[space] = {};
          }
          railSpaceMap[space][railLength] =
            (railSpaceMap[space][railLength] || 0) + 1;
        }
      }
    });

    if (totalRailCount === 0) {
      alert('적용 가능한 제품(가로값 입력된 커튼)이 없습니다.');
      return;
    }

    // 3. 이미 견적서에 레일 옵션이 있으면 중복 추가 방지
    const alreadyExists = rows.some(
      row => row.type === 'option' && row.optionLabel === '레일'
    );
    if (alreadyExists) {
      alert('이미 레일 옵션이 추가되어 있습니다.');
      return;
    }

    // 4. 공간별 레일 정보 생성
    const detailsArr: string[] = [];
    let totalPurchaseCost = 0;

    Object.keys(railSpaceMap).forEach(space => {
      const lengthMap = railSpaceMap[space];
      Object.keys(lengthMap).forEach(lengthStr => {
        const length = Number(lengthStr);
        const count = lengthMap[length];
        detailsArr.push(`${space}: ${length}자 ${count}개`);

        // 입고금액 계산 (1자당 500원)
        const purchaseCostPerRail = length * 500;
        totalPurchaseCost += purchaseCostPerRail * count;
      });
    });

    // 5. 레일 옵션 한 줄로 추가
    const newOptionRow: EstimateRow = {
      id: Date.now(),
      type: 'option',
      productId: undefined, // 레일은 전체 견적서 옵션이므로 productId 없음
      vendor: '',
      brand: '',
      space: '',
      productType: '',
      curtainType: '',
      pleatType: '',
      productName: '',
      width: '',
      details: detailsArr.join(', '),
      widthMM: 0,
      heightMM: 0,
      area: 0,
      lineDir: '',
      lineLen: 0,
      pleatAmount: 0,
      widthCount: 0,
      quantity: totalRailCount,
      totalPrice: 0, // 판매금액 0원
      salePrice: 0, // 판매단가 0원
      cost: totalPurchaseCost, // 입고금액(합계)
      purchaseCost:
        totalRailCount > 0 ? Math.round(totalPurchaseCost / totalRailCount) : 0, // 평균 입고단가
      margin: 0 - totalPurchaseCost, // 마진 (판매금액 - 입고금액)
      note: '', // 추가된 note 속성
      optionLabel: '레일',
      largePlainCost: 0,
    };
    // 레일 옵션을 최하단에 추가
    const updatedRows = [...rows, newOptionRow];
    // productId 복구 적용
    const repairedRows = repairOptionProductIds(updatedRows);
    updateEstimateRows(activeTab, repairedRows);
    alert(
      `레일 옵션이 ${totalRailCount}개 추가되었습니다.\n${detailsArr.join(', ')}\n입고금액: ${totalPurchaseCost.toLocaleString()}원`
    );
  };

  // 계약서 관련 핸들러 함수들
  const handleContractPrint = (contract: any) => {
    setSelectedContractForPrint(contract);
    setContractTemplateOpen(true);
  };

  const handleContractPdfClick = async (contract: any) => {
    if (contractPrintRef.current) {
      try {
        const canvas = await html2canvas(contractPrintRef.current, {
          scale: 2,
          useCORS: true,
          allowTaint: true,
        });

        const imgData = canvas.toDataURL('image/png');
        const pdf = new jsPDF('p', 'mm', 'a4');
        const imgWidth = 210;
        const pageHeight = 295;
        const imgHeight = (canvas.height * imgWidth) / canvas.width;
        let heightLeft = imgHeight;

        let position = 0;

        pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;

        while (heightLeft >= 0) {
          position = heightLeft - imgHeight;
          pdf.addPage();
          pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
          heightLeft -= pageHeight;
        }

        pdf.save(`${contract.contractNo}.pdf`);
      } catch (error) {
        console.error('PDF 생성 오류:', error);
        alert('PDF 생성 중 오류가 발생했습니다.');
      }
    }
  };

  const handleContractJpgClick = async (contract: any) => {
    if (contractPrintRef.current) {
      try {
        const canvas = await html2canvas(contractPrintRef.current, {
          scale: 2,
          useCORS: true,
          allowTaint: true,
        });

        const link = document.createElement('a');
        link.download = `${contract.contractNo}.jpg`;
        link.href = canvas.toDataURL('image/jpeg', 0.8);
        link.click();
      } catch (error) {
        console.error('JPG 생성 오류:', error);
        alert('JPG 생성 중 오류가 발생했습니다.');
      }
    }
  };

  const handleContractShareClick = (contract: any) => {
    const shareData = {
      title: `계약서 - ${contract.contractNo}`,
      text: `${contract.customerName}님의 계약서입니다.`,
      url: window.location.href,
    };

    if (navigator.share) {
      navigator.share(shareData);
    } else {
      // 공유 API가 지원되지 않는 경우 클립보드에 복사
      const contractInfo = `
계약서 정보:
계약번호: ${contract.contractNo}
고객명: ${contract.customerName}
계약일자: ${contract.contractDate}
총금액: ${(contract.totalAmount || 0).toLocaleString()}원
      `.trim();

      navigator.clipboard
        .writeText(contractInfo)
        .then(() => {
          alert('계약 정보가 클립보드에 복사되었습니다.');
        })
        .catch(() => {
          alert('클립보드 복사에 실패했습니다.');
        });
    }
  };

  // 계약서 출력 메뉴 핸들러
  const handleContractPrintMenuClick = (event: React.MouseEvent<HTMLElement>, contract: any) => {
    setContractPrintMenuAnchorEl(event.currentTarget);
    setSelectedContractForPrintMenu(contract);
    setContractPrintMenuOpen(true);
  };

  const handleContractPrintMenuClose = () => {
    setContractPrintMenuAnchorEl(null);
    setContractPrintMenuOpen(false);
    setSelectedContractForPrintMenu(null);
  };

  const handleContractEdit = (contract: any) => {
    setSelectedContractForEdit(contract);
    setContractEditModalOpen(true);
  };

  const handleContractDelete = async (contract: any) => {
    if (window.confirm('정말로 이 계약서를 삭제하시겠습니까?')) {
      try {
        // localStorage에서 계약서 삭제
        const savedContracts = JSON.parse(localStorage.getItem('contracts') || '[]');
        const updatedContracts = savedContracts.filter((c: any) => c.id !== contract.id);
        localStorage.setItem('contracts', JSON.stringify(updatedContracts));
        
        // 현재 견적의 계약서 목록에서도 삭제
        setContractsForCurrentEstimate((prev: any[]) => 
          prev.filter((c: any) => c.id !== contract.id)
        );
        
        // 계약서 목록 갱신 트리거 업데이트
        setContractRefreshTrigger(prev => prev + 1);
        
        alert('계약서가 삭제되었습니다.');
      } catch (error) {
        console.error('계약서 삭제 실패:', error);
        alert('계약서 삭제 중 오류가 발생했습니다.');
      }
    }
  };

  // 로컬 Date → 'YYYY-MM-DDTHH:mm' (datetime-local용)
  const formatLocalDatetimeValue = (d: Date): string => {
    const pad = (n: number) => (n < 10 ? `0${n}` : `${n}`);
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
  };

  // 10분 단위로 반올림
  const roundToNearest10Minutes = (date: Date): Date => {
    const d = new Date(date.getTime());
    const minutes = d.getMinutes();
    const rounded = Math.round(minutes / 10) * 10;
    if (rounded === 60) {
      d.setHours(d.getHours() + 1, 0, 0, 0);
    } else {
      d.setMinutes(rounded, 0, 0);
    }
    return d;
  };

  // 기존 ISO 혹은 로컬 입력값에서 날짜 파트 추출 (로컬 기준)
  const extractLocalParts = (value?: string) => {
    if (!value) {
      const now = new Date();
      const h = now.getHours();
      const ampm: '오전' | '오후' = h < 12 ? '오전' : '오후';
      const hour12 = ((h + 11) % 12) + 1;
      const minute = Math.floor(now.getMinutes() / 10) * 10;
      return {
        date: formatLocalDatetimeValue(now).slice(0, 10),
        hour12: hour12.toString().padStart(2, '0'),
        minute: minute.toString().padStart(2, '0'),
        ampm,
      };
    }
    const d = new Date(value);
    const ampm: '오전' | '오후' = d.getHours() < 12 ? '오전' : '오후';
    const hour24 = d.getHours();
    const hour12 = ((hour24 + 11) % 12) + 1;
    const minute = d.getMinutes();
    return {
      date: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`,
      hour12: String(hour12).padStart(2, '0'),
      minute: String(Math.floor(minute / 10) * 10).padStart(2, '0'),
      ampm,
    };
  };

  const buildLocalValue = (
    base: string | undefined,
    overrides: Partial<{ date: string; hour12: string; minute: string; ampm: '오전' | '오후' }>
  ): string => {
    const parts = extractLocalParts(base);
    const p = { ...parts, ...overrides };
    let hour = parseInt(p.hour12 || '12', 10);
    if (p.ampm === '오후' && hour !== 12) hour += 12;
    if (p.ampm === '오전' && hour === 12) hour = 0;
    const minuteNum = parseInt(p.minute || '0', 10);
    const localStr = `${p.date}T${String(hour).padStart(2, '0')}:${String(minuteNum).padStart(2, '0')}`;
    return localStr;
  };

  // 계약서 날짜 변경 핸들러 (연/월/일/시/10분 단위)
  const handleContractDateChange = (contractId: number, field: 'measurementDate' | 'constructionDate', value: string) => {
    try {
      // 입력값을 Date로 변환(로컬 타임존 가정) 후 10분 단위 반올림
      const localDate = value ? new Date(value) : null;
      const roundedDate = localDate ? roundToNearest10Minutes(localDate) : null;
      const isoString = roundedDate ? roundedDate.toISOString() : '';

      // 현재 견적의 계약서 목록 업데이트
      setContractsForCurrentEstimate((prev: any[]) => 
        prev.map((c: any) => 
          c.id === contractId 
            ? { ...c, [field]: isoString }
            : c
        )
      );

      // localStorage에서도 업데이트
      const savedContracts = JSON.parse(localStorage.getItem('contracts') || '[]');
      const updatedContracts = savedContracts.map((c: any) => 
        c.id === contractId 
          ? { ...c, [field]: isoString, updatedAt: new Date().toISOString() }
          : c
      );
      localStorage.setItem('contracts', JSON.stringify(updatedContracts));

      // 주문관리의 고객정보에도 동기화 (해당 계약과 연결된 주문서가 있으면 업데이트)
      try {
        const orders = JSON.parse(localStorage.getItem('orders') || '[]');
        const contract = updatedContracts.find((c: any) => c.id === contractId);
        if (contract) {
          const updatedOrders = orders.map((o: any) => {
            if (o.contractId === contract.id) {
              if (field === 'measurementDate') {
                return { ...o, measurementDate: isoString };
              }
              if (field === 'constructionDate') {
                return { ...o, installationDate: isoString };
              }
            }
            return o;
          });
          localStorage.setItem('orders', JSON.stringify(updatedOrders));
        }
      } catch (syncErr) {
        console.warn('주문관리 동기화 실패(무시):', syncErr);
      }
    } catch (error) {
      console.error('계약서 날짜 변경 실패:', error);
      alert('날짜 변경 중 오류가 발생했습니다.');
    }
  };

  // 저장하기 핸들러 함수 - 현재 견적번호에 덮어씌워서 저장
  const handleSaveEstimate = async () => {
    try {
      const currentEstimate = estimates[activeTab];
      
      if (!currentEstimate || !currentEstimate.estimateNo) {
        alert('저장할 견적서가 없거나 견적번호가 없습니다.');
        return;
      }

      console.log('현재 견적서 저장 시작:', currentEstimate.estimateNo);

      // 소비자금액과 합계금액 계산
      const sumTotalPrice = currentEstimate.rows.reduce(
        (sum: number, row: any) => sum + (row.totalPrice || 0),
        0
      );
      const totalAmount = Math.round(sumTotalPrice);
      const discountAmountNumber = Number(
        String(discountAmount).replace(/[^\d]/g, '')
      );
      const discountedAmount =
        discountAmountNumber > 0
          ? totalAmount - discountAmountNumber
          : totalAmount;

      // 저장할 견적서 데이터 준비 (현재 견적번호 유지)
      const estimateToSave = {
        ...currentEstimate,
        savedAt: new Date().toISOString(),
        finalizedAmount: finalizedAmount, // 확정금액 저장
        totalAmount,
        discountAmount: discountAmountNumber,
        discountedAmount,
        margin: sumMargin,
        // 할인 정보 저장
        discountAmountInput: discountAmount,
        discountRateInput: discountRate,
        discountedTotalInput: discountedTotalInput,
        // 실측 정보 추가
        measurementRequired: currentEstimate.measurementRequired,
        measurementInfo: currentEstimate.measurementInfo
          ? {
            ...currentEstimate.measurementInfo,
            measuredAt:
              currentEstimate.measurementRequired === false
                ? new Date().toISOString()
                : undefined,
            measuredBy:
              currentEstimate.measurementRequired === false
                ? '사용자'
                : undefined,
            measurementMethod:
              currentEstimate.measurementRequired === false
                ? '실측없이진행'
                : '현장실측',
          }
          : {
            measuredAt:
              currentEstimate.measurementRequired === false
                ? new Date().toISOString()
                : undefined,
            measuredBy:
              currentEstimate.measurementRequired === false
                ? '사용자'
                : undefined,
            measurementMethod:
              currentEstimate.measurementRequired === false
                ? '실측없이진행'
                : '현장실측',
          },
      };

      // 기존 견적서 찾기 (견적번호로)
      const existingIndex = savedEstimates.findIndex(
        (est: any) => est.estimateNo === currentEstimate.estimateNo
      );

      if (existingIndex >= 0) {
        // 기존 견적서 업데이트
        savedEstimates[existingIndex] = estimateToSave;
        console.log('기존 견적서 업데이트:', currentEstimate.estimateNo);
      } else {
        // 새로운 견적서 추가
        savedEstimates.push(estimateToSave);
        console.log('새 견적서 저장:', currentEstimate.estimateNo);
      }

      // localStorage에 저장
      localStorage.setItem('saved_estimates', JSON.stringify(savedEstimates));
      console.log('localStorage 저장 완료:', currentEstimate.estimateNo);

      // Firebase에 업데이트/저장
      try {
        console.log('Firebase에 견적서 저장/업데이트 시작');
        
        // 견적번호 검증 후 Firebase 저장/업데이트
        let isUpdated = false;
        try {
          console.log('Firebase 견적서 존재 여부 확인 중...');
          
          // 견적번호로 기존 견적서 검색
          const existingEstimate = await estimateService.getEstimateByNumber(currentEstimate.estimateNo);
          
          if (existingEstimate) {
            // 기존 견적서가 있으면 업데이트 (문서 ID 문자열 사용)
            const targetId = (existingEstimate as any).firebaseId || existingEstimate.id;
            console.log('기존 견적서 발견, 업데이트 진행:', targetId);
            await estimateService.updateEstimate(String(targetId), estimateToSave);
            console.log('Firebase 견적서 업데이트 완료');
            isUpdated = true;

            // 상태 반영: 문서 ID 문자열 유지
            const firebaseId = String(targetId);
            if (existingIndex >= 0) {
              savedEstimates[existingIndex] = { ...savedEstimates[existingIndex], ...estimateToSave, id: firebaseId, firebaseId };
            } else {
              savedEstimates[savedEstimates.length - 1] = { ...estimateToSave, id: firebaseId, firebaseId } as any;
            }
          } else {
            // 기존 견적서가 없으면 새로 저장
            console.log('기존 견적서 없음, 새로 저장 진행');
            const savedEstimate = await estimateService.saveEstimate(estimateToSave);
            console.log('Firebase에 새로운 견적서 저장 완료:', savedEstimate);
            
            // 저장된 ID 반영
            if (savedEstimate) {
              const firebaseId = String(savedEstimate);
              if (existingIndex >= 0) {
                savedEstimates[existingIndex] = { ...savedEstimates[existingIndex], id: firebaseId, firebaseId };
              } else {
                savedEstimates[savedEstimates.length - 1] = { ...estimateToSave, id: firebaseId, firebaseId } as any;
              }
            }
          }
          
        } catch (error) {
          console.error('Firebase 저장/업데이트 실패:', error);
          throw error;
        }
        
        console.log('Firebase 저장/업데이트 완료:', currentEstimate.estimateNo);
        
        // 성공 메시지 개선
        const successMessage = isUpdated 
          ? `견적서가 업데이트되었습니다.\n견적번호: ${currentEstimate.estimateNo}`
          : `견적서가 새로 저장되었습니다.\n견적번호: ${currentEstimate.estimateNo}`;
        
        alert(successMessage);
      } catch (error) {
        console.error('Firebase 저장 실패:', error);
        // Firebase 저장 실패해도 localStorage는 성공했으므로 사용자에게 경고만 표시
        const errorMessage = (error as Error).message?.includes('견적서를 찾을 수 없습니다') 
          ? '견적서가 로컬에 저장되었지만 Firebase 동기화에 실패했습니다. (견적서 검색 실패)'
          : '견적서가 로컬에 저장되었지만 Firebase 동기화에 실패했습니다. 인터넷 연결을 확인해주세요.';
        
        setSnackbar({
          open: true,
          message: errorMessage,
          severity: 'warning',
        });
        alert(`견적서가 로컬에 저장되었습니다.\n견적번호: ${currentEstimate.estimateNo}\n\nFirebase 동기화 실패: ${(error as Error).message || '알 수 없는 오류'}`);
      }

    } catch (error) {
      console.error('견적서 저장 중 오류:', error);
      alert('견적서 저장 중 오류가 발생했습니다.');
    }
  };

  // 새이름저장 핸들러 함수
  const handleSaveAsNewEstimate = async () => {
    try {
      const currentEstimate = estimates[activeTab];
      
      if (!currentEstimate) {
        alert('저장할 견적서가 없습니다.');
        return;
      }

      // 새 견적번호 생성
      const newEstimateNo = generateEstimateNo(estimates);
      
      // 저장할 견적서 데이터 준비 (새 ID와 견적번호로)
      const estimateToSave = {
        ...currentEstimate,
        id: `estimate_${Date.now()}`,
        estimateNo: newEstimateNo,
        name: `견적서-${newEstimateNo}`,
        savedAt: new Date().toISOString(),
        savedDate: getLocalDate(),
        finalizedAmount: finalizedAmount, // 확정금액 저장
        // 할인 설정 저장
        discountAmount: discountAmount,
        discountRate: discountRate,
        // 할인후금액 계산하여 저장
        discountedAmount: discountAmountNumber > 0 ? discountedTotal : sumTotalPrice,
      };

      // 기존 저장된 견적서 목록에 추가
      const existingSavedEstimates = [...savedEstimates];
      existingSavedEstimates.push(estimateToSave);

      // localStorage에 저장
      localStorage.setItem('saved_estimates', JSON.stringify(existingSavedEstimates));
      
      // 상태 업데이트
      setSavedEstimates(existingSavedEstimates);

      // Firebase에도 자동 저장
      try {
        await estimateService.saveEstimate(estimateToSave);
        console.log('Firebase 새이름저장 완료:', newEstimateNo);
      } catch (error) {
        console.error('Firebase 새이름저장 실패:', error);
        setSnackbar({
          open: true,
          message: '견적서가 저장되었지만 Firebase 동기화에 실패했습니다. 인터넷 연결을 확인해주세요.',
        });
        return;
      }

      alert(`견적서가 새이름으로 저장되었습니다.\n견적번호: ${newEstimateNo}`);

      // 저장 후 견적서 입력 내용 초기화
      const newEstimate = {
        id: Date.now(),
        name: `견적서-${generateEstimateNo(estimates)}`,
        estimateNo: generateEstimateNo(estimates),
        estimateDate: getLocalDate(),
        customerName: '',
        contact: '',
        emergencyContact: '',
        projectName: '',
        type: '',
        address: '',
        rows: [],
      };

      // 현재 견적서를 새 견적서로 교체
      const newEstimates = [...estimates];
      newEstimates[activeTab] = newEstimate;
      useEstimateStore.setState({ estimates: newEstimates });

      // meta 상태도 초기화
      setMeta({
        estimateNo: generateEstimateNo(estimates),
        estimateDate: getLocalDate(),
        customerName: '',
        contact: '',
        emergencyContact: '',
        projectName: '',
        type: '',
        address: '',
      });

      // 할인 필드 초기화
      setDiscountAmount('');
      setDiscountRate('');
      setDiscountedTotalInput('');
      setFinalizedAmount(''); // 확정금액도 초기화

      console.log('견적서 새이름저장 및 초기화 완료');
    } catch (error) {
      console.error('견적서 새이름저장 중 오류:', error);
      alert('견적서 새이름저장 중 오류가 발생했습니다.');
    }
  };

  // 2. 저장된 견적서에서 연도 목록 추출
  const savedYearsSet = new Set(
    savedEstimates
      .map((e: any) => {
        const year = e.savedAt ? new Date(e.savedAt).getFullYear() : null;
        return typeof year === 'number' ? year : null;
      })
      .filter((v: unknown): v is number => typeof v === 'number')
  );
  const yearsArray: number[] = Array.from(savedYearsSet as Set<number>);
  const savedYears: number[] = yearsArray.sort((a, b) => b - a);

  // 연락처 입력 시 자동완성/자동입력
  const handleContactChange = (e: any, value: string) => {
    setMeta(prev => ({ ...prev, contact: value }));
    const found = customerOptions.find(c => c.contact === value);
    if (found) {
      setMeta(prev => ({
        ...prev,
        customerName: found.customerName,
        emergencyContact: found.emergencyContact,
        address: found.address,
      }));
    }
  };

  // meta 변경 시 견적서에도 반영
  useEffect(() => {
    const updated = { ...estimates[activeTab], ...meta };
    const newEstimates = [...estimates];
    newEstimates[activeTab] = updated;
    useEstimateStore.setState({ estimates: newEstimates });
  }, [meta, activeTab]);

  // 전화번호 입력 시 자동 저장 로직 제거 - 고객저장 버튼 클릭 시에만 저장

  // 견적서 정보 변경사항을 실시간으로 반영
  useEffect(() => {
    if (estimates[activeTab]) {
      updateEstimateInfo(activeTab, {
        estimateNo: meta.estimateNo,
        estimateDate: meta.estimateDate,
        customerName: meta.customerName,
        contact: meta.contact,
        emergencyContact: meta.emergencyContact,
        projectName: meta.projectName,
        type: meta.type,
        address: meta.address,
      });
    }
  }, [meta, activeTab]);

  // 견적서 탭 변경 시 할인 정보 업데이트
  useEffect(() => {
    if (estimates[activeTab]) {
      const currentEstimate = estimates[activeTab];
      
      // 할인 정보 업데이트
      if (currentEstimate.discountAmountInput) {
        setDiscountAmount(currentEstimate.discountAmountInput);
      } else {
        setDiscountAmount('');
      }
      
      if (currentEstimate.discountRateInput) {
        setDiscountRate(currentEstimate.discountRateInput);
      } else {
        setDiscountRate('');
      }
      
      if (currentEstimate.discountedTotalInput) {
        setDiscountedTotalInput(currentEstimate.discountedTotalInput);
      } else {
        setDiscountedTotalInput('');
      }
      
      // 확정금액 업데이트
      if (currentEstimate.finalizedAmount) {
        setFinalizedAmount(currentEstimate.finalizedAmount);
      } else {
        setFinalizedAmount('');
      }
    }
  }, [activeTab]);

  // 할인 정보 변경 시 견적서 상태에 반영 (무한 루프 방지를 위해 조건부 업데이트)
  useEffect(() => {
    if (estimates[activeTab]) {
      const currentEstimate = estimates[activeTab];
      
      // 현재 상태와 견적서 상태가 다를 때만 업데이트
      const needsUpdate = 
        currentEstimate.discountAmountInput !== discountAmount ||
        currentEstimate.discountRateInput !== discountRate ||
        currentEstimate.discountedTotalInput !== discountedTotalInput ||
        currentEstimate.finalizedAmount !== finalizedAmount;
      
      if (needsUpdate) {
        const updatedEstimate = {
          ...currentEstimate,
          discountAmountInput: discountAmount,
          discountRateInput: discountRate,
          discountedTotalInput: discountedTotalInput,
          finalizedAmount: finalizedAmount,
        };
        
        const newEstimates = [...estimates];
        newEstimates[activeTab] = updatedEstimate;
        useEstimateStore.setState({ estimates: newEstimates });
      }
    }
  }, [discountAmount, discountRate, discountedTotalInput, finalizedAmount, activeTab]);

  // 템플릿 선택 핸들러
  const handleTemplateSelect = (template: EstimateTemplateType) => {
    // 선택한 템플릿의 방들을 견적서 행으로 변환
    const newRows = template.rooms.map(room => templateRoomToEstimateRow(room));

    // 현재 견적서에 행 추가
    const currentEstimate = estimates[activeTab];
    const updatedEstimate = {
      ...currentEstimate,
      rows: [...currentEstimate.rows, ...newRows],
    };

    // 견적서 업데이트
    const newEstimates = [...estimates];
    newEstimates[activeTab] = updatedEstimate;
    useEstimateStore.setState({ estimates: newEstimates });

    // 다이얼로그 닫기
    setTemplateDialogOpen(false);
  };

  // 견적서 정보 업데이트 함수
  const updateEstimateInfo = (idx: number, updates: Partial<Estimate>) => {
    const newEstimates = [...estimates];
    newEstimates[idx] = { ...newEstimates[idx], ...updates };
    useEstimateStore.setState({ estimates: newEstimates });
  };

  // 견적일자 변경 시 견적번호 업데이트 함수
  const handleEstimateDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newDate = e.target.value;

    // 1. 견적일자 업데이트
    setMeta(prev => ({ ...prev, estimateDate: newDate }));

    // 2. 새 견적번호 생성을 위한 임시 견적 목록 생성
    const tempEstimates = estimates.map(est => ({
      ...est,
      estimateDate: est === estimates[activeTab] ? newDate : est.estimateDate,
    }));

    // 3. saved_estimates에서도 같은 날짜의 견적서 확인
    const savedEstimates = JSON.parse(
      localStorage.getItem('saved_estimates') || '[]'
    );
    const allEstimates = [...tempEstimates, ...savedEstimates];

    // 4. 새 견적번호 생성 (선택된 날짜 기준)
    const [year, month, day] = newDate.split('-');
    const dateStr = `${year}${month}${day}`;
    const todayEstimates = allEstimates.filter(e =>
      e.estimateNo?.startsWith(`E${dateStr}`)
    );

    // 기본 일련번호와 수정본 일련번호를 모두 고려
    const allSequences: number[] = [];
    todayEstimates.forEach(e => {
      const parts = e.estimateNo.split('-');
      if (parts.length >= 2) {
        // 기본 일련번호 (예: E20250620-001)
        const baseSeq = Number(parts[1]);
        if (!isNaN(baseSeq)) {
          allSequences.push(baseSeq);
        }
      }
    });

    // 항상 가장 높은 번호 다음 번호로 발행 (빈 번호 무시)
    const maxSeq = allSequences.length > 0 ? Math.max(...allSequences) : 0;
    const nextSeq = String(maxSeq + 1).padStart(3, '0');
    const newEstimateNo = `E${dateStr}-${nextSeq}`;

    // 5. 견적번호 업데이트
    setMeta(prev => ({ ...prev, estimateNo: newEstimateNo }));

    // 6. 견적서 이름도 업데이트
    const newEstimates = [...estimates];
    newEstimates[activeTab] = {
      ...newEstimates[activeTab],
      estimateDate: newDate,
      estimateNo: newEstimateNo,
      name: `견적서-${newEstimateNo}`, // '견적서명-' 에서 '견적서-'로 변경
    };
    useEstimateStore.setState({ estimates: newEstimates });
  };

  // 컴포넌트 마운트 시 오늘 날짜로 초기화
  useEffect(() => {
    const today = new Date().toISOString().split('T')[0];
    setMeta(prev => ({
      ...prev,
      estimateDate: today,
    }));

    // 견적서의 estimateDate도 오늘 날짜로 업데이트
    const newEstimates = [...estimates];
    newEstimates[activeTab] = {
      ...newEstimates[activeTab],
      estimateDate: today,
    };
    useEstimateStore.setState({ estimates: newEstimates });
  }, []);

  // 견적서 데이터가 변경될 때 meta 상태 동기화
  useEffect(() => {
    if (estimates[activeTab]) {
      const today = new Date().toISOString().split('T')[0];
      setMeta(prev => ({
        ...prev,
        estimateNo: estimates[activeTab].estimateNo,
        estimateDate: today, // 항상 오늘 날짜로 유지
        customerName: estimates[activeTab].customerName || '',
        contact: estimates[activeTab].contact || '',
        emergencyContact: estimates[activeTab].emergencyContact || '',
        projectName: estimates[activeTab].projectName || '',
        type: estimates[activeTab].type || '',
        address: estimates[activeTab].address || '',
      }));
    }
  }, [activeTab]); // estimates 의존성 제거

  // 자동 금액 재계산 useEffect
  useEffect(() => {
    const allRows = estimates[activeTab]?.rows;
    if (!allRows) return;

    let needsUpdate = false;
    let lastProduct: EstimateRow | null = null;

    const newRows = allRows.map(row => {
      let newRow = { ...row };

      if (row.type === 'product') {
        lastProduct = row;
        const area = Number(
          getArea(
            row.productType,
            Number(row.widthMM || 0),
            Number(row.heightMM || 0),
            row.curtainType || '',
            row.pleatType || '',
            row.pleatAmount,
            row.pleatAmountCustom,
            row.productCode,
            row.productName,
            productOptions
          )
        );

        const newTotalPrice = Number(getTotalPrice(row, area)) || 0;
        const newCost = Number(getPurchaseTotal(row, area)) || 0;
        const newMargin = Math.round(newTotalPrice / 1.1 - newCost);

        if (
          newRow.totalPrice !== newTotalPrice ||
          newRow.cost !== newCost ||
          newRow.area !== area ||
          newRow.margin !== newMargin
        ) {
          newRow.totalPrice = newTotalPrice;
          newRow.cost = newCost;
          newRow.area = area;
          newRow.margin = newMargin;
          needsUpdate = true;
        }
      } else if (row.type === 'option' && lastProduct) {
        const newTotalPrice = getOptionAmount(row, lastProduct);
        const newCost = getOptionPurchaseAmount(row, lastProduct);
        const newMargin = Math.round(newTotalPrice / 1.1 - newCost);

        if (
          newRow.totalPrice !== newTotalPrice ||
          newRow.cost !== newCost ||
          newRow.margin !== newMargin
        ) {
          newRow.totalPrice = newTotalPrice;
          newRow.cost = newCost;
          newRow.margin = newMargin;
          needsUpdate = true;
        }
      }
      return newRow;
    });

    if (needsUpdate) {
      updateEstimateRows(activeTab, newRows);
    }
  }, [estimates, activeTab, productOptions, updateEstimateRows]);

  const handleCreateContract = (estimateId: number) => {
    const estimate = estimates[estimateId];
    if (!estimate) return;

    // 계약서 생성 시 알림 (WebSocket으로 실시간 전송)
    createEstimateNotification(
      estimate.estimateNo,
      '계약서를 생성',
      nickname || '사용자',
      estimateId.toString()
    );

    // 계약관리 페이지에서 사용할 데이터 준비
    const totalAmount = getTotalConsumerAmount(estimate.rows);
    const estimateToProceed = {
      ...estimate,
      totalAmount: totalAmount,
      discountedAmount: estimate.discountedAmount ?? totalAmount,
      products: estimate.rows.map((r: any) => r.productName).join(', '),
    };

    // localStorage에 승인된 견적서 데이터 저장
    localStorage.setItem('approvedEstimate', JSON.stringify(estimateToProceed));

    // 계약관리 페이지로 이동
    navigate('/business/contract-management');
  };

  const handleProceedToContract = async (savedEstimate: any) => {
    console.log('진행버튼 클릭됨:', savedEstimate);
    
    try {
      // 계약 진행 시 알림 (WebSocket으로 실시간 전송)
      createEstimateNotification(
        savedEstimate.estimateNo,
        '계약 진행',
        nickname || '사용자',
        savedEstimate.id.toString()
      );

      // 계약관리 페이지에서 사용할 데이터 준비
      const totalAmount = getTotalConsumerAmount(savedEstimate.rows);
      const estimateToProceed = {
        ...savedEstimate,
        totalAmount: totalAmount,
        discountedAmount: savedEstimate.discountedAmount ?? totalAmount,
        products: savedEstimate.rows.map((r: any) => r.productName).join(', '),
        status: 'approved', // 승인 상태로 변경
        approvedAt: new Date().toISOString(),
        approvedBy: nickname || '사용자'
      };

      // Firebase 서버에 견적서 저장/업데이트
      console.log('Firebase 서버에 견적서 저장 시작');
      let firebaseId;
      
      if (savedEstimate.firebaseId) {
        // 기존 견적서 업데이트
        await estimateService.updateEstimate(savedEstimate.firebaseId, estimateToProceed);
        firebaseId = savedEstimate.firebaseId;
        console.log('기존 견적서 업데이트 완료:', firebaseId);
      } else {
        // 새 견적서 저장
        firebaseId = await estimateService.saveEstimate(estimateToProceed);
        console.log('새 견적서 저장 완료:', firebaseId);
      }

      // Firebase ID를 포함한 데이터로 업데이트
      const finalEstimateData = {
        ...estimateToProceed,
        firebaseId: firebaseId
      };

      // localStorage에 승인된 견적서 데이터 저장
      localStorage.setItem('approvedEstimate', JSON.stringify(finalEstimateData));

      // Firebase에 이미 저장되었으므로 localStorage 업데이트는 불필요
      // Firebase 실시간 구독을 통해 자동으로 업데이트됨
      console.log('🔥 Firebase에 승인된 견적서 저장 완료 - 실시간 동기화됨');

      console.log('계약관리로 이동 시작');
      // 계약관리 페이지로 이동
      navigate('/business/contract-management');
    } catch (error) {
      console.error('진행버튼 처리 중 오류:', error);
      alert('계약 진행 중 오류가 발생했습니다. 다시 시도해주세요.');
    }
  };

  const handleCancelContract = (estimate: any) => {
    // 계약 취소 시 알림 (WebSocket으로 실시간 전송)
    createEstimateNotification(
      estimate.estimateNo,
      '계약 취소',
      nickname || '사용자',
      estimate.id.toString()
    );

    if (window.confirm('계약 진행을 취소하시겠습니까?')) {
      // saved_estimates에서 해당 견적서 삭제
      const savedEstimates = JSON.parse(
        localStorage.getItem('saved_estimates') || '[]'
      );
      const updatedSavedEstimates = savedEstimates.filter(
        (e: any) => e.estimateNo !== estimate.estimateNo
      );
      localStorage.setItem(
        'saved_estimates',
        JSON.stringify(updatedSavedEstimates)
      );

      // contracts에서 해당 계약서 삭제
      const contracts = JSON.parse(localStorage.getItem('contracts') || '[]');
      const updatedContracts = contracts.filter(
        (c: any) => c.estimateNo !== estimate.estimateNo
      );
      localStorage.setItem('contracts', JSON.stringify(updatedContracts));

      // 발주서에서도 해당 계약 관련 발주서 삭제
      const orders = JSON.parse(localStorage.getItem('orders') || '[]');
      const contract = contracts.find(
        (c: any) => c.estimateNo === estimate.estimateNo
      );
      if (contract) {
        const updatedOrders = orders.filter(
          (o: any) => o.contractId !== contract.id
        );
        localStorage.setItem('orders', JSON.stringify(updatedOrders));
      }

      alert('계약 진행이 취소되었습니다.');
      window.location.reload(); // 페이지 새로고침
    }
  };

  const handleViewContract = (estimate: any) => {
    // 계약서 페이지로 이동
    const contracts = JSON.parse(localStorage.getItem('contracts') || '[]');
    const contract = contracts.find(
      (c: any) => c.estimateNo === estimate.estimateNo
    );

    if (contract) {
      // 계약서 데이터를 localStorage에 저장하고 계약관리로 이동
      localStorage.setItem('viewContract', JSON.stringify(contract));
      navigate('/business/contract-management');
    }
  };

  const handleViewOrder = (estimate: any) => {
    // 발주서 페이지로 이동
    const contracts = JSON.parse(localStorage.getItem('contracts') || '[]');
    const contract = contracts.find(
      (c: any) => c.estimateNo === estimate.estimateNo
    );

    if (contract) {
      const orders = JSON.parse(localStorage.getItem('orders') || '[]');
      const order = orders.find((o: any) => o.contractId === contract.id);

      if (order) {
        // 발주서 데이터를 localStorage에 저장하고 발주관리로 이동
        localStorage.setItem('viewOrder', JSON.stringify(order));
        navigate('/business/order');
      }
    }
  };

  // 견적서 상태 관리 함수들
  const getEstimateStatus = (estimate: any) => {
    try {
      // 계약서에서 해당 견적서의 상태 확인
      const contracts = JSON.parse(localStorage.getItem('contracts') || '[]');
      const contract = contracts.find(
        (c: any) => c.estimateNo === estimate.estimateNo
      );

      if (contract) {
        // 발주서에서 해당 계약의 상태 확인
        const orders = JSON.parse(localStorage.getItem('orders') || '[]');
        const order = orders.find((o: any) => o.contractId === contract.id);

        if (order) {
          if (order.status === '입고완료') return '납품완료';
          if (order.status === '발주완료') return '발주완료';
        }

        if (contract.status === 'signed') return '계약완료';
        if (contract.status === 'pending') return '계약진행중';
      }

      return '견적완료';
    } catch (error) {
      console.error('견적서 상태 확인 중 오류:', error);
      return '견적완료';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case '견적완료':
        return '#2196f3';
      case '계약진행중':
        return '#ff9800';
      case '계약완료':
        return '#4caf50';
      case '발주완료':
        return '#9c27b0';
      case '납품완료':
        return '#607d8b';
      case '취소':
        return '#f44336';
      default:
        return '#757575';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case '견적완료':
        return '견적완료';
      case '계약진행중':
        return '계약진행중';
      case '계약완료':
        return '계약완료';
      case '발주완료':
        return '발주완료';
      case '납품완료':
        return '납품완료';
      case '취소':
        return '취소';
      default:
        return '알 수 없음';
    }
  };

  const activeEstimate = estimates[activeTab];

  const handleCustomerInfoChange = (
    e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setMeta(prev => ({ ...prev, [name]: value }));
  };

  const [isTemplateManagerOpen, setTemplateManagerOpen] = useState(false);
  const [snackbar, setSnackbar] = useState<{ open: boolean; message: string; severity?: 'success' | 'error' | 'warning' | 'info' }>({
    open: false,
    message: '',
  });

  // 일괄 변경 모드 관련 상태
  const [isBulkEditMode, setIsBulkEditMode] = useState(false);
  const [selectedRowsForBulkEdit, setSelectedRowsForBulkEdit] = useState<Set<number>>(new Set());

  const [isBulkEditProductSelection, setIsBulkEditProductSelection] = useState(false);
  // 메모 상태 추가
  const [estimateMemos, setEstimateMemos] = useState<{ [key: string]: string }>(
    {}
  );

  // 일괄 변경 관련 함수들
  const handleBulkEditModeToggle = () => {
    setIsBulkEditMode(!isBulkEditMode);
    if (isBulkEditMode) {
      // 일괄 변경 모드 종료 시 선택 초기화
      setSelectedRowsForBulkEdit(new Set());
    }
  };

  const handleRowSelectionForBulkEdit = (rowIndex: number) => {
    if (!isBulkEditMode) return;
    
    setSelectedRowsForBulkEdit(prev => {
      const newSet = new Set(prev);
      if (newSet.has(rowIndex)) {
        newSet.delete(rowIndex);
      } else {
        newSet.add(rowIndex);
      }
      return newSet;
    });
  };

  const handleSelectAllRowsForBulkEdit = () => {
    if (!isBulkEditMode) return;
    
    const productRows = filteredRows
      .map((row, index) => ({ row, index }))
      .filter(({ row }) => row.type === 'product')
      .map(({ index }) => index);
    
    setSelectedRowsForBulkEdit(new Set(productRows));
  };



  const handleBulkEditProductSelection = () => {
    setIsBulkEditProductSelection(true);
    setProductDialogOpen(true);
  };



  const handleSaveCustomer = async () => {
    console.log('=== 고객정보 저장 시작 ===');
    console.log('현재 activeTab:', activeTab);
    console.log('현재 estimates 길이:', estimates.length);
    console.log('현재 estimates:', estimates);

    if (!estimates || estimates.length === 0) {
      console.log('견적서 목록이 비어있습니다.');
      setSnackbar({
        open: true,
        message: '견적서가 없습니다. 먼저 견적서를 생성해주세요.',
      });
      return;
    }

    if (activeTab < 0 || activeTab >= estimates.length) {
      console.log('유효하지 않은 activeTab:', activeTab);
      setSnackbar({
        open: true,
        message: '유효하지 않은 견적서입니다.',
      });
      return;
    }

    const activeEstimate = estimates[activeTab];
    if (!activeEstimate) {
      console.log('activeEstimate가 없습니다.');
      setSnackbar({
        open: true,
        message: '견적서 정보를 찾을 수 없습니다.',
      });
      return;
    }

    const {
      customerName,
      address,
      contact,
      emergencyContact,
      projectName,
      type,
    } = meta;

    console.log('고객정보 저장 시도:', { customerName, contact, address, projectName, type });
    console.log('현재 meta 상태:', meta);

    // 고객명과 연락처 중 하나라도 있어야 함
    const hasCustomerName = customerName && customerName.trim().length > 0;
    const hasContact = contact && contact.trim().length > 0;

    console.log('고객명 존재:', hasCustomerName, '연락처 존재:', hasContact);

    if (!hasCustomerName && !hasContact) {
      console.log('고객명과 연락처가 모두 비어있습니다.');
      setSnackbar({
        open: true,
        message: '고객명 또는 연락처를 입력해주세요.',
      });
      return;
    }

    try {
      console.log('Firebase에서 고객 목록 로드 시작');
      
      // Firebase에서 고객 목록 가져오기
      let customers = [];
      try {
        customers = await customerService.getCustomers();
        console.log('Firebase에서 고객 목록 로드 성공:', customers.length, '개');
      } catch (firebaseError) {
        console.error('Firebase 고객 목록 로드 실패:', firebaseError);
        
        // Firebase 실패 시 localStorage에서 로드
        console.log('localStorage에서 고객 목록 로드 시작');
        const customerData = localStorage.getItem('customerList');
        console.log('localStorage customerData:', customerData);

        if (customerData) {
          try {
            customers = JSON.parse(customerData);
            console.log('localStorage 고객 목록 파싱 성공:', customers.length, '개');
          } catch (parseError) {
            console.error('localStorage 고객 목록 파싱 실패:', parseError);
            customers = [];
          }
        } else {
          console.log('localStorage에 고객 목록이 없습니다. 새로 생성합니다.');
        }
      }

      // 프로젝트 정보 생성
      const newProject: any = {
        id: Date.now().toString(),
        projectName: projectName || '프로젝트명 없음',
        projectType: type || '기타',
        estimateNo: activeEstimate.estimateNo,
        estimateDate: activeEstimate.estimateDate,
        status: '견적',
        address: address, // 프로젝트별 주소 추가
        createdAt: new Date().toISOString(),
      };

      // 고객명으로 기존 고객 찾기 (연락처는 업데이트 가능)
      console.log('기존 고객 검색 시작');
      console.log('검색할 고객명:', customerName);
      console.log('검색할 연락처:', contact);

      const existingIndex = customers.findIndex((c: any) => {
        const nameMatch = c.name && customerName &&
          c.name.trim().toLowerCase() === customerName.trim().toLowerCase();
        
        console.log(`고객 ${c.name} (${c.tel}): 이름일치=${nameMatch}`);
        return nameMatch; // 이름만 일치하면 기존 고객으로 인식
      });

      console.log('기존 고객 검색 결과:', existingIndex > -1 ? '기존 고객 발견' : '새 고객');

      if (existingIndex > -1) {
        // 기존 고객 정보 업데이트
        const existingCustomer = customers[existingIndex];

        // 기존 프로젝트와 완전히 동일한(프로젝트명, 타입, 주소) 것이 있는지 체크
        const projectExists = existingCustomer.projects?.some(
          (p: any) =>
            p.projectName === newProject.projectName &&
            p.projectType === newProject.projectType &&
            p.address === newProject.address
        );

        if (!projectExists) {
          existingCustomer.projects = existingCustomer.projects || [];
          existingCustomer.projects.push(newProject);
        }

        // 고객 정보 업데이트 (연락처 정보도 업데이트)
        customers[existingIndex] = {
          ...existingCustomer,
          tel: contact, // 연락처 업데이트
          emergencyTel: emergencyContact,
          address: address, // 주소도 업데이트 (변경된 경우)
          visitPath: '견적서에서 등록',
          updatedAt: new Date().toISOString(),
        };

        setSnackbar({
          open: true,
          message: `기존 고객 정보가 업데이트되었습니다.${!projectExists ? ' 새 프로젝트가 추가되었습니다.' : ''}`,
        });
      } else {
        // 새 고객 추가
        const newCustomer: Customer = {
          id:
            customers.length > 0
              ? Math.max(...customers.map((c: any) => c.id)) + 1
              : 1,
          name: customerName,
          address: address,
          tel: contact,
          emergencyTel: emergencyContact,
          visitPath: '견적서에서 등록',
          note: '',
          projects: [newProject],
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };

        customers.push(newCustomer);
        setSnackbar({
          open: true,
          message:
            '새로운 고객 정보가 저장되었습니다. 프로젝트 정보도 함께 추가되었습니다.',
        });
      }

      // Firebase에 고객 데이터 저장
      try {
        console.log('Firebase에 고객 데이터 저장 시작');
        
        if (existingIndex > -1) {
          // 기존 고객 업데이트
          await customerService.updateCustomer(customers[existingIndex].id, customers[existingIndex]);
          console.log('Firebase에 기존 고객 업데이트 완료');
        } else {
          // 새 고객 저장
          const newCustomerId = await customerService.saveCustomer(customers[customers.length - 1]);
          console.log('Firebase에 새 고객 저장 완료, ID:', newCustomerId);
        }
        
        console.log('Firebase 고객 데이터 저장 완료');
        console.log('최종 고객 목록:', customers.length, '개 고객');
        
        // localStorage도 업데이트
        localStorage.setItem('customerList', JSON.stringify(customers));
        console.log('localStorage 고객 목록 업데이트 완료');
      } catch (error) {
        console.error('Firebase 고객 저장 실패:', error);
        setSnackbar({
          open: true,
          message: '고객 정보가 저장되었지만 Firebase 동기화에 실패했습니다.',
        });
      }

      // 견적서 정보도 함께 업데이트 (변경사항이 있을 때만)
      const currentEstimate = estimates[activeTab];
      const hasChanges =
        currentEstimate.customerName !== customerName ||
        currentEstimate.contact !== contact ||
        currentEstimate.emergencyContact !== emergencyContact ||
        currentEstimate.address !== address ||
        currentEstimate.projectName !== projectName ||
        currentEstimate.type !== type;

      if (hasChanges) {
        const updatedEstimates = [...estimates];
        updatedEstimates[activeTab] = {
          ...activeEstimate,
          customerName: customerName,
          contact: contact,
          emergencyContact: emergencyContact,
          address: address,
          projectName: projectName,
          type: type,
        };
        useEstimateStore.setState({ estimates: updatedEstimates });
        console.log('견적서 정보 업데이트 완료');
      } else {
        console.log('견적서 정보 변경사항 없음');
      }

    } catch (error) {
      console.error('=== 고객정보 저장 실패 ===');
      console.error('에러 타입:', typeof error);
      console.error('에러 메시지:', error);
      console.error('에러 스택:', error instanceof Error ? error.stack : '스택 없음');
      setSnackbar({
        open: true,
        message: `고객 정보 저장에 실패했습니다: ${error instanceof Error ? error.message : '알 수 없는 오류'}`
      });
    }
  };

  // 메모 로드
  useEffect(() => {
    const savedMemos = localStorage.getItem('estimateMemos');
    if (savedMemos) {
      setEstimateMemos(JSON.parse(savedMemos));
    }
  }, []);

  // 컬럼 순서 변경 핸들러
  const handleMoveColumnUp = (columnKey: string) => {
    const currentIndex = estimateListColumnOrder.indexOf(columnKey);
    if (currentIndex > 0) {
      const newOrder = [...estimateListColumnOrder];
      [newOrder[currentIndex], newOrder[currentIndex - 1]] = [
        newOrder[currentIndex - 1],
        newOrder[currentIndex],
      ];
      setEstimateListColumnOrder(newOrder);
      localStorage.setItem('estimateListColumnOrder', JSON.stringify(newOrder));
    }
  };

  const handleMoveColumnDown = (columnKey: string) => {
    const currentIndex = estimateListColumnOrder.indexOf(columnKey);
    if (currentIndex < estimateListColumnOrder.length - 1) {
      const newOrder = [...estimateListColumnOrder];
      [newOrder[currentIndex], newOrder[currentIndex + 1]] = [
        newOrder[currentIndex + 1],
        newOrder[currentIndex],
      ];
      setEstimateListColumnOrder(newOrder);
      localStorage.setItem('estimateListColumnOrder', JSON.stringify(newOrder));
    }
  };

  const handleResetColumnOrder = () => {
    const defaultOrder = [
      'estimateNo',
      'estimateDate',
      'savedDate',
      'customerName',
      'contact',
      'projectName',
      'products',
      'totalAmount',
      'discountedAmount',
      'finalizedAmount',
      'discountAmount',
      'discountRate',
      'margin',
      'actions',
      'address',
    ];
    setEstimateListColumnOrder(defaultOrder);
    localStorage.setItem(
      'estimateListColumnOrder',
      JSON.stringify(defaultOrder)
    );
  };

  // 컬럼 라벨 매핑 객체
  const columnLabels: { [key: string]: string } = {
    estimateNo: '견적번호',
    estimateDate: '견적일자',
    savedDate: '저장일',
    customerName: '고객명',
    contact: '연락처',
    projectName: '프로젝트명',
    type: '타입',
    address: '주소',
    products: '포함제품',
    totalAmount: '총금액',
    discountedAmount: '할인후금액',
    finalizedAmount: '확정금액',
    discountAmount: '할인금액',
    discountRate: '할인율(%)',
    margin: '마진',
    actions: '작업',
  };

  useEffect(() => {
    const savedOrder = localStorage.getItem('estimateListColumnOrder');
    if (savedOrder) {
      setEstimateListColumnOrder(JSON.parse(savedOrder));
    }
  }, []);

  // 견적서 초기화 핸들러
  const handleResetEstimate = (idx: number) => {
    const estimateNo = generateEstimateNo([]);
    const newEstimate = {
      id: Date.now(),
      name: `견적서-${estimateNo}`,
      estimateNo,
      estimateDate: getLocalDate(),
      customerName: '',
      contact: '',
      emergencyContact: '',
      projectName: '',
      type: '',
      address: '',
      rows: [],
    };
    const newEstimates = [...estimates];
    newEstimates[idx] = newEstimate;
    useEstimateStore.setState({ estimates: newEstimates });
    if (activeTab === idx) {
      setMeta({
        estimateNo,
        estimateDate: getLocalDate(),
        customerName: '',
        contact: '',
        emergencyContact: '',
        projectName: '',
        type: '',
        address: '',
      });
      
      // 할인 정보 초기화
      setDiscountAmount('');
      setDiscountRate('');
      setDiscountedTotalInput('');
      setFinalizedAmount('');
    }
  };

  const [selectedEstimateForPrint, setSelectedEstimateForPrint] =
    useState<Estimate | null>(null);

  const [railEditOpen, setRailEditOpen] = useState(false);
  const [railEditData, setRailEditData] = useState<{
    railItems: Array<{ space: string; length: number; count: number }>;
    rowIndex: number;
  } | null>(null);

  // 레일 수정 모달 핸들러
  const handleRailEdit = (rowIndex: number) => {
    const row = estimates[activeTab].rows[rowIndex];
    if (row.type === 'option' && row.optionLabel === '레일') {
      // 기존 레일 데이터 파싱
      const railItems: Array<{ space: string; length: number; count: number }> =
        [];

      // details에서 공간별 레일 정보 파싱
      const details = row.details || '';
      const railMatches = details.match(/([^:]+):\s*(\d+)자\s*(\d+)개/g);

      if (railMatches) {
        railMatches.forEach(match => {
          const parts = match.match(/([^:]+):\s*(\d+)자\s*(\d+)개/);
          if (parts) {
            railItems.push({
              space: parts[1].trim().replace(/^,+|,+$/g, ''), // 앞뒤 쉼표 제거
              length: Number(parts[2]),
              count: Number(parts[3]),
            });
          }
        });
      } else {
        // 기존 형식 (공간 정보 없음) 처리
        const oldMatches = details.match(/(\d+)자레일\s*(\d+)개/g);
        if (oldMatches) {
          oldMatches.forEach(match => {
            const parts = match.match(/(\d+)자레일\s*(\d+)개/);
            if (parts) {
              railItems.push({
                space: '기타',
                length: Number(parts[1]),
                count: Number(parts[2]),
              });
            }
          });
        }
      }

      setRailEditData({ railItems, rowIndex });
      setRailEditOpen(true);
    }
  };

  const handleRailEditSave = () => {
    if (!railEditData) return;

    const { railItems, rowIndex } = railEditData;
    const rows = [...estimates[activeTab].rows];
    const row = rows[rowIndex];

    // 새로운 details 생성
    const detailsArr = railItems
      .filter(item => item.space.trim() !== '')
      .map(item => `${item.space.trim()}: ${item.length}자 ${item.count}개`);
    const totalCount = railItems.reduce((sum, item) => sum + item.count, 0);

    // 입고금액 재계산
    let totalPurchaseCost = 0;
    railItems.forEach(item => {
      const purchaseCostPerRail = item.length * 500; // 1자당 500원
      totalPurchaseCost += purchaseCostPerRail * item.count;
    });

    // 레일 행 업데이트
    rows[rowIndex] = {
      ...row,
      details: detailsArr.join(', '),
      quantity: totalCount,
      cost: totalPurchaseCost,
      purchaseCost:
        totalCount > 0 ? Math.round(totalPurchaseCost / totalCount) : 0,
      margin: 0 - totalPurchaseCost,
    };

    updateEstimateRows(activeTab, rows);
    setRailEditOpen(false);
    setRailEditData(null);
  };

  const handleRailEditClose = () => {
    setRailEditOpen(false);
    setRailEditData(null);
  };

  const handleRailItemChange = (
    index: number,
    field: 'space' | 'length' | 'count',
    value: string | number
  ) => {
    if (!railEditData) return;

    const newRailItems = [...railEditData.railItems];
    newRailItems[index] = { ...newRailItems[index], [field]: value };
    setRailEditData({ ...railEditData, railItems: newRailItems });
  };

  const handleAddRailItem = () => {
    if (!railEditData) return;

    const newRailItems = [
      ...railEditData.railItems,
      { space: '', length: 0, count: 1 },
    ];
    setRailEditData({ ...railEditData, railItems: newRailItems });
  };

  const handleRemoveRailItem = (index: number) => {
    if (!railEditData) return;

    const newRailItems = railEditData.railItems.filter((_, i) => i !== index);
    setRailEditData({ ...railEditData, railItems: newRailItems });
  };



  // selectedProductIdx 변경 감지
  useEffect(() => {
    console.log('selectedProductIdx 변경됨:', selectedProductIdx);
  }, [selectedProductIdx]);

  // 제품 검색에서 제품 선택 시 해당 셀에 제품을 등록하는 핸들러
  const handleProductSelectForCell = (product: any) => {
    console.log('handleProductSelectForCell 호출됨');
    console.log('selectedProductIdx:', selectedProductIdx);
    console.log('product:', product);
    
    if (selectedProductIdx === null) {
      console.log('selectedProductIdx가 null이므로 함수 종료');
      return;
    }

    const currentRows = [...estimates[activeTab].rows];
    const targetRow = currentRows[selectedProductIdx];
    
    if (!targetRow || targetRow.type !== 'product') return;

    // 선택된 제품 정보로 해당 행 업데이트
    const updatedRow = {
      ...targetRow,
      vendor: product.vendorName || '',
      brand: product.brand || '',
      productCode: product.productCode || '',
      productName: product.productName || '',
      productType: product.category || '',
      salePrice: product.salePrice || 0,
      purchaseCost: product.purchaseCost || 0,
      largePlainPrice: product.largePlainPrice ?? 0,
      largePlainCost: product.largePlainCost ?? 0,
      width: product.width || '',
      details: product.details || '',
    };

    // 속커튼 초기값 설정
    if (product.category === '커튼') {
      if (product.insideOutside === '속') {
        updatedRow.curtainType = '속커튼';
        updatedRow.pleatType = '나비';
        updatedRow.pleatAmount = '1.8~2';
      } else {
        updatedRow.curtainType = '겉커튼';
        updatedRow.pleatType = '민자';
      }
    }

    // 가로/세로 값이 있으면 계산 실행
    const widthMM = Number(updatedRow.widthMM) || 0;
    const heightMM = Number(updatedRow.heightMM) || 0;
    const pleatTypeVal = updatedRow.pleatType;
    const curtainTypeVal = updatedRow.curtainType;
    const productWidth = product ? Number(product.width) || 0 : 0;

    // 속커튼 나비주름일 때 주름양을 1.8~2로 설정
    if (curtainTypeVal === '속커튼' && pleatTypeVal === '나비') {
      updatedRow.pleatAmount = '1.8~2';
      // 폭수/pleatCount를 0으로 명확히 세팅 (Infinity 방지)
      updatedRow.widthCount = 0;
      updatedRow.pleatCount = 0;
      // 단가/원가도 할당
      if (updatedRow.salePrice === targetRow.salePrice) {
        updatedRow.salePrice = product.salePrice ?? updatedRow.salePrice;
      }
      updatedRow.purchaseCost = product.purchaseCost ?? updatedRow.purchaseCost;
    } else if (curtainTypeVal === '속커튼' && pleatTypeVal === '민자') {
      // 속커튼 민자는 면적 기반 주름양 계산
      if (widthMM > 0 && heightMM > 0) {
        const area = (widthMM * heightMM) / 1000000; // m²
        updatedRow.area = area;
        updatedRow.pleatAmount = area.toFixed(2);
      }
    } else if (curtainTypeVal === '겉커튼' && widthMM > 0) {
        let pleatCount: number | '' = '';
        if (pleatTypeVal === '민자') {
          const safeProductWidth = productWidth || 1370;
          const formulaKey =
            safeProductWidth > 2000 ? '겉커튼-민자-2000이상' : '겉커튼-민자-2000이하';

          if (formulaKey && formulas[formulaKey]) {
            try {
              const rawResult = evaluate(formulas[formulaKey].widthCount, {
                widthMM,
                productWidth: safeProductWidth,
              });
              
              // Infinity나 NaN 체크
              if (!isFinite(rawResult) || isNaN(rawResult)) {
                pleatCount = '';
              } else {
                const decimal = rawResult - Math.floor(rawResult);
                pleatCount =
                  decimal <= 0.1 ? Math.floor(rawResult) : Math.ceil(rawResult);
              }
            } catch {
              pleatCount = '';
            }
          }
                } else if (pleatTypeVal === '나비') {
          const safeProductWidth = productWidth || 1370;
          const formulaKey =
            safeProductWidth > 2000 ? '겉커튼-나비-2000이상' : '겉커튼-나비-2000이하';

          if (formulaKey && formulas[formulaKey]) {
            try {
              const rawResult = evaluate(formulas[formulaKey].widthCount, {
                widthMM,
                productWidth: safeProductWidth,
              });
              
              // Infinity나 NaN 체크
              if (!isFinite(rawResult) || isNaN(rawResult)) {
                pleatCount = '';
              } else {
                const decimal = rawResult - Math.floor(rawResult);
                pleatCount =
                  decimal <= 0.1 ? Math.floor(rawResult) : Math.ceil(rawResult);
              }
            } catch {
              pleatCount = '';
            }
          }
        }

        updatedRow.widthCount = typeof pleatCount === 'number' ? pleatCount : 0;
        updatedRow.pleatCount = typeof pleatCount === 'number' ? pleatCount : 0;
    }

    // 행 업데이트
    currentRows[selectedProductIdx] = updatedRow;
    updateEstimateRows(activeTab, currentRows);
    
    // 제품검색 모달 닫기
    setProductDialogOpen(false);
    setSelectedProductIdx(null);
  };

  // 제품 검색에서 제품 선택 시 editRow에 반영하는 핸들러
  const handleProductSelectForEdit = (product: any) => {
    if (!editRow) return;

    const newEditRow = {
      ...editRow,
      vendor: product.vendorName || '',
      brand: product.brand || '',
      productCode: product.productCode || '',
      productName: product.productName || '',
      productType: product.category || '',
      salePrice: product.salePrice || 0,
      purchaseCost: product.purchaseCost || 0,
      largePlainPrice: product.largePlainPrice ?? 0,
      largePlainCost: product.largePlainCost ?? 0,
      width: product.width || '',
      details: product.details || '',
    };

    // 속커튼 초기값 설정
    if (product.category === '커튼') {
      if (product.insideOutside === '속') {
        newEditRow.curtainType = '속커튼';
        newEditRow.pleatType = '나비';
        newEditRow.pleatAmount = '1.8~2';
      } else {
        newEditRow.curtainType = '겉커튼';
        newEditRow.pleatType = '민자';
      }
    }

    // 가로/세로 값이 있으면 계산 실행
    const widthMM = Number(newEditRow.widthMM) || 0;
    const heightMM = Number(newEditRow.heightMM) || 0;
    const pleatTypeVal = newEditRow.pleatType;
    const curtainTypeVal = newEditRow.curtainType;
    const productWidth = product ? Number(product.width) || 0 : 0;

    // 속커튼 나비주름일 때 주름양을 1.8~2로 설정
    if (curtainTypeVal === '속커튼' && pleatTypeVal === '나비') {
      newEditRow.pleatAmount = '1.8~2';
      // 폭수/pleatCount를 0으로 명확히 세팅 (Infinity 방지)
      newEditRow.widthCount = 0;
      newEditRow.pleatCount = 0;
      // 단가/원가도 할당
      if (newEditRow.salePrice === editRow.salePrice) {
        newEditRow.salePrice = product.salePrice ?? newEditRow.salePrice;
      }
      newEditRow.purchaseCost = product.purchaseCost ?? newEditRow.purchaseCost;
    } else if (curtainTypeVal === '속커튼' && pleatTypeVal === '민자') {
      // 속커튼 민자는 면적 기반 주름양 계산
      if (widthMM > 0 && heightMM > 0) {
        const area = (widthMM * heightMM) / 1000000; // m²
        newEditRow.area = area;
        newEditRow.pleatAmount = area.toFixed(2);
      }
    } else if (curtainTypeVal === '겉커튼' && widthMM > 0) {
        let pleatCount: number | '' = '';
        if (pleatTypeVal === '민자') {
          const safeProductWidth = productWidth || 1370;
          const formulaKey =
            safeProductWidth > 2000 ? '겉커튼-민자-2000이상' : '겉커튼-민자-2000이하';

          if (formulaKey && formulas[formulaKey]) {
            try {
              const rawResult = evaluate(formulas[formulaKey].widthCount, {
                widthMM,
                productWidth: safeProductWidth,
              });
              
              // Infinity나 NaN 체크
              if (!isFinite(rawResult) || isNaN(rawResult)) {
                pleatCount = '';
              } else {
                const decimal = rawResult - Math.floor(rawResult);
                pleatCount =
                  decimal <= 0.1 ? Math.floor(rawResult) : Math.ceil(rawResult);
              }
            } catch {
              pleatCount = '';
            }
          }
                } else if (pleatTypeVal === '나비') {
          const safeProductWidth = productWidth || 1370;
          const formulaKey =
            safeProductWidth > 2000 ? '겉커튼-나비-2000이상' : '겉커튼-나비-2000이하';

          if (formulaKey && formulas[formulaKey]) {
            try {
              const rawResult = evaluate(formulas[formulaKey].widthCount, {
                widthMM,
                productWidth: safeProductWidth,
              });
              
              // Infinity나 NaN 체크
              if (!isFinite(rawResult) || isNaN(rawResult)) {
                pleatCount = '';
              } else {
                const decimal = rawResult - Math.floor(rawResult);
                pleatCount =
                  decimal <= 0.1 ? Math.floor(rawResult) : Math.ceil(rawResult);
              }
            } catch {
              pleatCount = '';
            }
          }
        }
      newEditRow.pleatCount = pleatCount;
      newEditRow.widthCount = pleatCount;
              setRecommendedPleatCount(pleatCount === '' ? 0 : pleatCount);
        
        // 추천 주름양 계산
        if (pleatCount && pleatCount > 0) {
          const calculatedPleatAmount = getPleatAmount(
            widthMM,
            productWidth,
            pleatTypeVal,
            curtainTypeVal,
            pleatCount
          );
          setRecommendedPleatAmount(calculatedPleatAmount || '');
        } else {
          setRecommendedPleatAmount('');
        }

      // 주름양 자동 계산
      if (pleatCount !== '' && pleatCount > 0) {
        const calculatedPleatAmount = getPleatAmount(
          widthMM,
          productWidth,
          pleatTypeVal,
          curtainTypeVal,
          pleatCount
        );
        newEditRow.pleatAmount = calculatedPleatAmount;
      }
    } else if (curtainTypeVal === '속커튼' && pleatTypeVal === '민자') {
      // 속커튼 민자는 면적 기반 주름양 계산
      if (widthMM > 0 && heightMM > 0) {
        const area = (widthMM * heightMM) / 1000000; // m²
        newEditRow.area = area;
        newEditRow.pleatAmount = area.toFixed(2);
      }
    } else if (product) {
      // 다른 커튼 타입으로 변경 시 원래 제품의 단가/원가로 복원
      if (newEditRow.salePrice === editRow.salePrice) {
        newEditRow.salePrice = product.salePrice ?? newEditRow.salePrice;
      }
      newEditRow.purchaseCost = product.purchaseCost ?? newEditRow.purchaseCost;
    }

    setEditRow(newEditRow);
    setProductDialogOpen(false);
  };

  // 기존 계약에 Final 견적서 업데이트하는 함수
  const handleUpdateExistingContract = (finalEstimate: any) => {
    try {
      // 기존 계약 목록에서 같은 기본 견적번호의 계약 찾기
      const contracts = JSON.parse(localStorage.getItem('contracts') || '[]');
      const baseEstimateNo =
        finalEstimate.estimateNo.split('-')[0] +
        '-' +
        finalEstimate.estimateNo.split('-')[1];

      const existingContract = contracts.find(
        (contract: any) =>
          contract.estimateNo.startsWith(baseEstimateNo) &&
          !contract.estimateNo.includes('-final')
      );

      if (!existingContract) {
        alert(
          '기존 계약을 찾을 수 없습니다.\n먼저 일반 견적서로 계약을 생성한 후 Final 견적서로 업데이트할 수 있습니다.'
        );
        return;
      }

      // 기존 계약 정보 확인
      const confirmUpdate = window.confirm(
        `기존 계약을 Final 견적서 내용으로 업데이트하시겠습니까?\n\n` +
        `기존 계약번호: ${existingContract.contractNo}\n` +
        `기존 견적번호: ${existingContract.estimateNo}\n` +
        `Final 견적번호: ${finalEstimate.estimateNo}\n\n` +
        `⚠️ 주의: 견적서는 그대로 보존되고, 계약서만 Final 견적서 내용으로 업데이트됩니다.\n` +
        `실측 전/후 견적서를 모두 확인할 수 있습니다.`
      );

      if (!confirmUpdate) return;

      // 기존 계약을 Final 견적서 내용으로 업데이트 (견적서는 건드리지 않음)
      const updatedContract = {
        ...existingContract,
        // 계약서에 적용될 견적 정보를 Final 견적서로 업데이트
        estimateNo: finalEstimate.estimateNo,
        totalAmount:
          finalEstimate.totalAmount ||
          getTotalConsumerAmount(finalEstimate.rows),
        discountedAmount:
          finalEstimate.discountedAmount ||
          finalEstimate.totalAmount ||
          getTotalConsumerAmount(finalEstimate.rows),
        rows: finalEstimate.rows, // Final 견적서의 상세 내역으로 계약서 업데이트
        updatedAt: new Date().toISOString(),
        measurementInfo: finalEstimate.measurementInfo,
        measurementData: finalEstimate.measurementData,
        // 계약서 업데이트 이력 추가
        contractUpdateHistory: [
          ...(existingContract.contractUpdateHistory || []),
          {
            updatedAt: new Date().toISOString(),
            fromEstimateNo: existingContract.estimateNo,
            toEstimateNo: finalEstimate.estimateNo,
            reason: '실측 후 Final 견적서로 계약서 업데이트'
          }
        ]
      };

      // 계약 목록 업데이트 (견적서는 건드리지 않음)
      const updatedContracts = contracts.map((contract: any) =>
        contract.id === existingContract.id ? updatedContract : contract
      );
      localStorage.setItem('contracts', JSON.stringify(updatedContracts));

      alert(
        `기존 계약이 성공적으로 업데이트되었습니다!\n\n` +
        `계약번호: ${existingContract.contractNo}\n` +
        `업데이트된 견적번호: ${finalEstimate.estimateNo}\n` +
        `✅ 견적서는 그대로 보존되어 실측 전/후 비교가 가능합니다.\n` +
        `✅ 계약서만 Final 견적서 내용으로 업데이트되었습니다.`
      );

      window.location.reload();
    } catch (error) {
      console.error('기존 계약 업데이트 중 오류:', error);
      alert('기존 계약 업데이트 중 오류가 발생했습니다.');
    }
  };

  // Final 견적서 수정 함수
  const handleEditFinalEstimate = (finalEstimate: any) => {
    try {
      // Final 견적서를 현재 작업 견적서로 불러오기
      setEstimates([finalEstimate]);
      setActiveTab(0);

      // 견적서 정보 설정
      setEstimateInfo({
        name: finalEstimate.name,
        estimateNo: finalEstimate.estimateNo,
        estimateDate: finalEstimate.estimateDate,
        customerName: finalEstimate.customerName,
        contact: finalEstimate.contact,
        emergencyContact: finalEstimate.emergencyContact,
        projectName: finalEstimate.projectName,
        type: finalEstimate.type,
        address: finalEstimate.address,
      });

      // 실측 데이터가 있으면 설정
      if (finalEstimate.measurementData) {
        setMeasurementData(finalEstimate.measurementData);
      }

      // 탭을 견적서 작성 탭으로 변경
      setActiveTab(0);

      alert(
        `Final 견적서가 수정 모드로 불러와졌습니다.\n\n` +
        `견적번호: ${finalEstimate.estimateNo}\n` +
        `수정 후 저장하면 새로운 Final 견적서가 생성됩니다.`
      );
    } catch (error) {
      console.error('Final 견적서 수정 중 오류:', error);
      alert('Final 견적서 수정 중 오류가 발생했습니다.');
    }
  };

  // 새 Final 견적서 생성 함수
  const handleAddNewFinalEstimate = (baseFinalEstimate: any) => {
    try {
      // 기본 견적번호 추출 (예: E20250620-001)
      const baseEstimateNo =
        baseFinalEstimate.estimateNo.split('-')[0] +
        '-' +
        baseFinalEstimate.estimateNo.split('-')[1];

      // 기존 Final 견적서들에서 다음 번호 계산
      const savedEstimates = JSON.parse(
        localStorage.getItem('saved_estimates') || '[]'
      );
      const finalEstimates = savedEstimates.filter((est: any) =>
        est.estimateNo.startsWith(baseEstimateNo + '-final')
      );

      // 다음 Final 번호 계산
      let nextFinalNumber = 1;
      if (finalEstimates.length > 0) {
        const maxNumber = Math.max(
          ...finalEstimates.map((est: any) => {
            const parts = est.estimateNo.split('-');
            if (parts.length >= 3) {
              const finalPart = parts[2];
              if (finalPart === 'final') return 1;
              return parseInt(finalPart) || 1;
            }
            return 1;
          })
        );
        nextFinalNumber = maxNumber + 1;
      }

      // 새로운 Final 견적번호 생성
      const newFinalNumber =
        nextFinalNumber === 1 ? 'final' : `final-${nextFinalNumber}`;
      const newEstimateNo = `${baseEstimateNo}-${newFinalNumber}`;

      // 새로운 Final 견적서 생성
      const newFinalEstimate = {
        ...baseFinalEstimate,
        id: Date.now(),
        estimateNo: newEstimateNo,
        savedAt: new Date().toISOString(),
      };

      // 견적서를 현재 작업 견적서로 불러오기
      setEstimates([newFinalEstimate]);
      setActiveTab(0);

      // 견적서 정보 설정
      setEstimateInfo({
        name: newFinalEstimate.name,
        estimateNo: newFinalEstimate.estimateNo,
        estimateDate: newFinalEstimate.estimateDate,
        customerName: newFinalEstimate.customerName,
        contact: newFinalEstimate.contact,
        emergencyContact: newFinalEstimate.emergencyContact,
        projectName: newFinalEstimate.projectName,
        type: newFinalEstimate.type,
        address: newFinalEstimate.address,
      });

      // 실측 데이터가 있다면 설정
      if (baseFinalEstimate.measurementData) {
        setMeasurementData(baseFinalEstimate.measurementData);
      }

      // 탭을 견적서 작성 탭으로 변경
      setActiveTab(0);

      alert(
        `새로운 Final 견적서가 생성되었습니다.\n\n` +
        `새 견적번호: ${newEstimateNo}\n` +
        `기존 Final 견적서를 기반으로 새로운 Final 견적서가 생성되었습니다.\n` +
        `실측 데이터를 수정하고 저장하세요.`
      );
    } catch (error) {
      console.error('새 Final 견적서 생성 중 오류:', error);
      alert('새 Final 견적서 생성 중 오류가 발생했습니다.');
    }
  };

  // 1. 상태 추가
  const [projectSelectDialogOpen, setProjectSelectDialogOpen] = useState(false);
  const [projectOptions, setProjectOptions] = useState<any[]>([]);

  // 키보드 네비게이션을 위한 ref들
  const estimateNoRef = useRef<HTMLInputElement>(null);
  const estimateDateRef = useRef<HTMLInputElement>(null);
  const customerNameRef = useRef<HTMLInputElement>(null);
  const contactRef = useRef<HTMLInputElement>(null);
  const emergencyContactRef = useRef<HTMLInputElement>(null);
  const projectNameRef = useRef<HTMLInputElement>(null);
  const typeRef = useRef<HTMLInputElement>(null);
  const addressRef = useRef<HTMLInputElement>(null);

  // 필드 ref 배열
  const fieldRefs = [
    estimateNoRef,
    estimateDateRef,
    customerNameRef,
    contactRef,
    emergencyContactRef,
    projectNameRef,
    typeRef,
    addressRef
  ];

  // 제품 정보 입력 필드를 위한 ref들
  const productSpaceRef = useRef<HTMLInputElement>(null);
  const productCodeRef = useRef<HTMLInputElement>(null);
  const productDetailsRef = useRef<HTMLInputElement>(null);
  const productWidthRef = useRef<HTMLInputElement>(null);
  const productHeightRef = useRef<HTMLInputElement>(null);
  const productAreaRef = useRef<HTMLInputElement>(null);
  const productLineDirRef = useRef<HTMLInputElement>(null);
  const productLineLenRef = useRef<HTMLInputElement>(null);
  const productWidthCountRef = useRef<HTMLInputElement>(null);
  const productQuantityRef = useRef<HTMLInputElement>(null);

  // 제품 정보 필드 ref 배열
  const productFieldRefs = [
    productSpaceRef,
    productCodeRef,
    productDetailsRef,
    productWidthRef,
    productHeightRef,
    productAreaRef,
    productLineDirRef,
    productLineLenRef,
    productWidthCountRef,
    productQuantityRef
  ];

  // 키보드 네비게이션 핸들러
  const handleKeyboardNavigation = (direction: 'next' | 'prev' | 'up' | 'down') => {
    try {
      const currentIndex = fieldRefs.findIndex(ref => ref.current === document.activeElement);
      if (currentIndex === -1) return;

      const nextIndex = getNextFieldIndex(currentIndex, fieldRefs.length, direction);
      const nextRef = fieldRefs[nextIndex];
      
      if (nextRef.current) {
        focusField(nextRef);
      }
    } catch (error) {
      console.error('키보드 네비게이션 에러:', error);
    }
  };

  // 제품 정보 키보드 네비게이션 핸들러
  const handleProductKeyboardNavigation = (direction: 'next' | 'prev' | 'up' | 'down') => {
    try {
      const currentIndex = productFieldRefs.findIndex(ref => ref.current === document.activeElement);
      if (currentIndex === -1) return;

      const nextIndex = getNextFieldIndex(currentIndex, productFieldRefs.length, direction);
      const nextRef = productFieldRefs[nextIndex];
      
      if (nextRef.current) {
        focusField(nextRef);
      }
    } catch (error) {
      console.error('제품 정보 키보드 네비게이션 에러:', error);
    }
  };

  // 테이블 셀 키보드 네비게이션 핸들러
  const handleTableCellKeyboardNavigation = (currentRowIndex: number, currentField: string, direction: 'next' | 'prev' | 'up' | 'down') => {
    try {
      const editableFields = ['space', 'productCode', 'details', 'widthMM', 'heightMM', 'lineDir', 'lineLen', 'widthCount', 'quantity'];
      const currentFieldIndex = editableFields.indexOf(currentField);
      
      if (currentFieldIndex === -1) return;

      let nextRowIndex = currentRowIndex;
      let nextFieldIndex = currentFieldIndex;
      let nextField = currentField;

      switch (direction) {
        case 'next':
          if (currentFieldIndex < editableFields.length - 1) {
            nextFieldIndex = currentFieldIndex + 1;
            nextField = editableFields[nextFieldIndex];
          } else {
            // 다음 행의 첫 번째 필드로 이동
            nextRowIndex = currentRowIndex + 1;
            nextFieldIndex = 0;
            nextField = editableFields[nextFieldIndex];
          }
          break;
        case 'prev':
          if (currentFieldIndex > 0) {
            nextFieldIndex = currentFieldIndex - 1;
            nextField = editableFields[nextFieldIndex];
          } else {
            // 이전 행의 마지막 필드로 이동
            nextRowIndex = currentRowIndex - 1;
            nextFieldIndex = editableFields.length - 1;
            nextField = editableFields[nextFieldIndex];
          }
          break;
        case 'down':
          nextRowIndex = currentRowIndex + 1;
          break;
        case 'up':
          nextRowIndex = currentRowIndex - 1;
          break;
      }

      // 행 범위 체크
      const currentRows = estimates[activeTab]?.rows || [];
      if (nextRowIndex >= 0 && nextRowIndex < currentRows.length) {
        // 현재 편집 완료
        if (editingCell) {
          handleCellEdit(editingCell.rowIndex, editingCell.field, editingValue);
        }
        
        // 다음 셀을 편집 모드로 설정
        const nextRow = currentRows[nextRowIndex];
        const nextValue = getRowValue(nextRow, nextField) || '';
        
        // 약간의 지연을 두어 현재 편집이 완료된 후 다음 편집 모드 진입
        setTimeout(() => {
          setEditingCell({ rowIndex: nextRowIndex, field: nextField });
          setEditingValue(nextValue);
        }, 10);
      }
    } catch (error) {
      console.error('테이블 셀 키보드 네비게이션 에러:', error);
    }
  };
  const [pendingCustomer, setPendingCustomer] = useState<any>(null);

  // 프로젝트 선택 다이얼로그 디버깅
  useEffect(() => {
    console.log('프로젝트 선택 다이얼로그 상태:', projectSelectDialogOpen);
    console.log('프로젝트 옵션:', projectOptions);
    console.log('대기 중인 고객:', pendingCustomer);
  }, [projectSelectDialogOpen, projectOptions, pendingCustomer]);

  return (
    <>
      <Box
        sx={{
          p: 2,
          mb: 2,
          background: 'var(--surface-color)',
          borderRadius: 1,
          display: 'flex',
          flexWrap: 'wrap',
          gap: 2,
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        {/* 좌측: 입력 필드들 */}
        <Box
          sx={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: 2,
            alignItems: 'center',
            flex: 1,
          }}
        >
          <TextField
            label="견적번호"
            value={meta.estimateNo || estimates[activeTab].estimateNo}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
              setMeta(prev => ({ ...prev, estimateNo: e.target.value }))
            }
            onKeyDown={createKeyboardNavigationHandler({
              currentIndex: 0,
              totalFields: fieldRefs.length,
              onNavigate: handleKeyboardNavigation
            })}
            inputRef={estimateNoRef}
            size="small"
            sx={{ 
              minWidth: 100,
              '& .MuiInputBase-root': {
                backgroundColor: 'var(--background-color)',
                border: '1px solid var(--border-color)',
                color: 'var(--text-color)',
                '&:hover': {
                  backgroundColor: 'var(--hover-color)',
                  borderColor: 'var(--primary-color)',
                },
                '&:focus-within': {
                  borderColor: 'var(--primary-color)',
                  boxShadow: '0 0 0 2px var(--border-color)',
                },
              },
              '& .MuiInputLabel-root': {
                color: 'var(--text-secondary-color)',
              },
            }}
            required
          />
          <TextField
            label="견적일자"
            type="date"
            value={meta.estimateDate}
            onChange={handleEstimateDateChange}
            onKeyDown={createKeyboardNavigationHandler({
              currentIndex: 1,
              totalFields: fieldRefs.length,
              onNavigate: handleKeyboardNavigation
            })}
            inputRef={estimateDateRef}
            InputLabelProps={{ shrink: true }}
            size="small"
            InputProps={{
              sx: {
                borderRadius: 2,
                background: 'var(--background-color)',
                border: '1px solid var(--border-color)',
                color: 'var(--text-color)',
                cursor: 'pointer',
                '&:hover': {
                  backgroundColor: 'var(--hover-color)',
                  borderColor: 'var(--primary-color)',
                },
                '&:focus': {
                  borderColor: 'var(--primary-color)',
                  boxShadow: '0 0 0 2px var(--border-color)',
                },
              },
              onClick: (e) => {
                const input = e.currentTarget.querySelector('input') as HTMLInputElement;
                if (input) {
                  if (input.showPicker) {
                    input.showPicker();
                  } else {
                    input.click();
                  }
                }
              },
            }}
            sx={{
              minWidth: 140,
              '& .MuiInputBase-root': {
                cursor: 'pointer',
              },
            }}
            required
          />
          <TextField
            label="고객명"
            value={meta.customerName}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
              console.log('고객명 입력:', e.target.value);
              setMeta(prev => ({ ...prev, customerName: e.target.value }));
            }}
            onKeyDown={createKeyboardNavigationHandler({
              currentIndex: 2,
              totalFields: fieldRefs.length,
              onNavigate: handleKeyboardNavigation
            })}
            inputRef={customerNameRef}
            size="small"
            sx={{ 
              minWidth: 200,
              '& .MuiInputBase-root': {
                backgroundColor: 'var(--background-color)',
                border: '1px solid var(--border-color)',
                color: 'var(--text-color)',
                '&:hover': {
                  backgroundColor: 'var(--hover-color)',
                  borderColor: 'var(--primary-color)',
                },
                '&:focus-within': {
                  borderColor: 'var(--primary-color)',
                  boxShadow: '0 0 0 2px var(--border-color)',
                },
              },
              '& .MuiInputLabel-root': {
                color: 'var(--text-secondary-color)',
              },
            }}
          />
          <Autocomplete
            freeSolo
            options={(customerOptions || [])
              .filter(c => c && c.contact && c.contact.trim()) // customerOptions가 존재하고, contact가 있고 비어있지 않은 것만 필터링
              .map(c => c.contact)
            }
            value={meta.contact}
            onChange={(e, value) => {
              setMeta(prev => ({ ...prev, contact: value || '' }));
              if (value) {
                const found = customerOptions.find(c => c.contact === value);
                if (found) {
                  setMeta(prev => ({
                    ...prev,
                    customerName: found.customerName,
                    emergencyContact: found.emergencyContact,
                    address: found.address,
                  }));
                }
              }
            }}
            onInputChange={(e, value) => {
              console.log('연락처 입력:', value);
              setMeta(prev => ({ ...prev, contact: value }));
            }}
            renderInput={params => (
              <TextField
                {...params}
                label="연락처"
                required
                size="small"
                onKeyDown={createKeyboardNavigationHandler({
                  currentIndex: 3,
                  totalFields: fieldRefs.length,
                  onNavigate: handleKeyboardNavigation
                })}
                inputRef={contactRef}
                sx={{ 
                  minWidth: 180,
                  '& .MuiInputBase-root': {
                    backgroundColor: 'var(--background-color)',
                    border: '1px solid var(--border-color)',
                    color: 'var(--text-color)',
                    '&:hover': {
                      backgroundColor: 'var(--hover-color)',
                      borderColor: 'var(--primary-color)',
                    },
                    '&:focus-within': {
                      borderColor: 'var(--primary-color)',
                      boxShadow: '0 0 0 2px var(--border-color)',
                    },
                  },
                  '& .MuiInputLabel-root': {
                    color: 'var(--text-secondary-color)',
                  },
                }}
              />
            )}
          />
          <TextField
            label="비상연락처"
            value={meta.emergencyContact}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
              setMeta(prev => ({ ...prev, emergencyContact: e.target.value }))
            }
            onKeyDown={createKeyboardNavigationHandler({
              currentIndex: 4,
              totalFields: fieldRefs.length,
              onNavigate: handleKeyboardNavigation
            })}
            inputRef={emergencyContactRef}
            size="small"
            sx={{ 
              minWidth: 60,
              '& .MuiInputBase-root': {
                backgroundColor: 'var(--background-color)',
                border: '1px solid var(--border-color)',
                color: 'var(--text-color)',
                '&:hover': {
                  backgroundColor: 'var(--hover-color)',
                  borderColor: 'var(--primary-color)',
                },
                '&:focus-within': {
                  borderColor: 'var(--primary-color)',
                  boxShadow: '0 0 0 2px var(--border-color)',
                },
              },
              '& .MuiInputLabel-root': {
                color: 'var(--text-secondary-color)',
              },
            }}
          />
          <TextField
            label="프로젝트명"
            value={meta.projectName}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
              setMeta(prev => ({ ...prev, projectName: e.target.value }))
            }
            onKeyDown={createKeyboardNavigationHandler({
              currentIndex: 5,
              totalFields: fieldRefs.length,
              onNavigate: handleKeyboardNavigation
            })}
            inputRef={projectNameRef}
            size="small"
            sx={{ 
              minWidth: 140,
              '& .MuiInputBase-root': {
                backgroundColor: 'var(--background-color)',
                border: '1px solid var(--border-color)',
                color: 'var(--text-color)',
                '&:hover': {
                  backgroundColor: 'var(--hover-color)',
                  borderColor: 'var(--primary-color)',
                },
                '&:focus-within': {
                  borderColor: 'var(--primary-color)',
                  boxShadow: '0 0 0 2px var(--border-color)',
                },
              },
              '& .MuiInputLabel-root': {
                color: 'var(--text-secondary-color)',
              },
            }}
          />
          <TextField
            label="타입"
            value={meta.type}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
              setMeta(prev => ({ ...prev, type: e.target.value }))
            }
            onKeyDown={createKeyboardNavigationHandler({
              currentIndex: 6,
              totalFields: fieldRefs.length,
              onNavigate: handleKeyboardNavigation
            })}
            inputRef={typeRef}
            size="small"
            sx={{ 
              minWidth: 30,
              '& .MuiInputBase-root': {
                backgroundColor: 'var(--background-color)',
                border: '1px solid var(--border-color)',
                color: 'var(--text-color)',
                '&:hover': {
                  backgroundColor: 'var(--hover-color)',
                  borderColor: 'var(--primary-color)',
                },
                '&:focus-within': {
                  borderColor: 'var(--primary-color)',
                  boxShadow: '0 0 0 2px var(--border-color)',
                },
              },
              '& .MuiInputLabel-root': {
                color: 'var(--text-secondary-color)',
              },
            }}
          />
          <TextField
            label="주소"
            value={meta.address}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
              setMeta(prev => ({ ...prev, address: e.target.value }))
            }
            onKeyDown={createKeyboardNavigationHandler({
              currentIndex: 7,
              totalFields: fieldRefs.length,
              onNavigate: handleKeyboardNavigation
            })}
            inputRef={addressRef}
            size="small"
            sx={{ 
              minWidth: 200, 
              flex: 1,
              '& .MuiInputBase-root': {
                backgroundColor: 'var(--background-color)',
                border: '1px solid var(--border-color)',
                color: 'var(--text-color)',
                '&:hover': {
                  backgroundColor: 'var(--hover-color)',
                  borderColor: 'var(--primary-color)',
                },
                '&:focus-within': {
                  borderColor: 'var(--primary-color)',
                  boxShadow: '0 0 0 2px var(--border-color)',
                },
              },
              '& .MuiInputLabel-root': {
                color: 'var(--text-secondary-color)',
              },
            }}
          />
        </Box>
        {/* 우측: 고객저장 버튼 */}
        <Button
          variant="contained"
          color="primary"
          size="medium"
          onClick={handleSaveCustomer}
          sx={{ height: 40, minWidth: 100, ml: 1, alignSelf: 'flex-start' }}
        >
          고객저장
        </Button>
        <Button
          variant="outlined"
          color="info"
          size="medium"
          onClick={handleOpenCustomerList}
          sx={{ height: 40, minWidth: 100, ml: 1, alignSelf: 'flex-start' }}
        >
          고객리스트
        </Button>
      </Box>
      {/* 견적서 탭 표시 설정 다이얼로그 */}
      <Dialog
        open={estimateTabSettingsOpen}
        onClose={() => setEstimateTabSettingsOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>견적서 탭 표시 설정</DialogTitle>
        <DialogContent>
          <Typography variant="body2" sx={{ mb: 2, color: 'text.secondary' }}>
            견적서 탭에 표시할 항목을 선택하세요
          </Typography>

          <FormControlLabel
            control={
              <Checkbox
                checked={estimateTabDisplay.showEstimateNo}
                onChange={e =>
                  setEstimateTabDisplay(prev => ({
                    ...prev,
                    showEstimateNo: e.target.checked,
                  }))
                }
              />
            }
            label="견적번호"
          />

          <FormControlLabel
            control={
              <Checkbox
                checked={estimateTabDisplay.showEstimateName}
                onChange={e =>
                  setEstimateTabDisplay(prev => ({
                    ...prev,
                    showEstimateName: e.target.checked,
                  }))
                }
              />
            }
            label="견적서명"
          />

          <FormControlLabel
            control={
              <Checkbox
                checked={estimateTabDisplay.showCustomerName}
                onChange={e =>
                  setEstimateTabDisplay(prev => ({
                    ...prev,
                    showCustomerName: e.target.checked,
                  }))
                }
              />
            }
            label="고객명"
          />

          <FormControlLabel
            control={
              <Checkbox
                checked={estimateTabDisplay.showProjectName}
                onChange={e =>
                  setEstimateTabDisplay(prev => ({
                    ...prev,
                    showProjectName: e.target.checked,
                  }))
                }
              />
            }
            label="프로젝트명"
          />

          <FormControlLabel
            control={
              <Checkbox
                checked={estimateTabDisplay.showDate}
                onChange={e =>
                  setEstimateTabDisplay(prev => ({
                    ...prev,
                    showDate: e.target.checked,
                  }))
                }
              />
            }
            label="견적일자"
          />

          <TextField
            label="구분자"
            value={estimateTabDisplay.separator}
            onChange={e =>
              setEstimateTabDisplay(prev => ({
                ...prev,
                separator: e.target.value,
              }))
            }
            size="small"
            sx={{ mt: 2, mb: 1 }}
          />

          <TextField
            label="최대 길이"
            type="number"
            value={estimateTabDisplay.maxLength}
            onChange={e =>
              setEstimateTabDisplay(prev => ({
                ...prev,
                maxLength: parseInt(e.target.value) || 20,
              }))
            }
            size="small"
            sx={{ mt: 1 }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEstimateTabSettingsOpen(false)}>
            취소
          </Button>
          <Button
            onClick={() => setEstimateTabSettingsOpen(false)}
            variant="contained"
          >
            저장
          </Button>
        </DialogActions>
      </Dialog>

      {/* 공간 설정 다이얼로그 */}
      <SpaceSettingsDialog
        open={spaceSettingsOpen}
        onClose={() => {
          setSpaceSettingsOpen(false);
          setSpaceOptions(loadSpaceOptions()); // 모달이 닫힐 때 공간 옵션 새로고침
        }}
      />

      {/* 견적서 LIST 표시 설정 다이얼로그 */}
      <Dialog
        open={estimateListSettingsOpen}
        onClose={() => setEstimateListSettingsOpen(false)}
        maxWidth="lg"
        fullWidth
      >
        <DialogTitle>견적서 LIST 표시 설정</DialogTitle>
        <DialogContent>
          <Typography variant="body2" sx={{ mb: 2, color: 'text.secondary' }}>
            견적서 LIST에 표시할 항목을 선택하고 순서를 조정하세요
          </Typography>
          {estimateListColumnOrder.map((columnKey: string, idx: number) => (
            <Box
              key={columnKey}
              sx={{ display: 'flex', alignItems: 'center', mb: 1 }}
            >
              <Checkbox
                checked={
                  estimateListDisplay[
                  `show${columnKey.charAt(0).toUpperCase() + columnKey.slice(1)}` as keyof typeof estimateListDisplay
                  ]
                }
                onChange={e =>
                  setEstimateListDisplay((prev: any) => ({
                    ...prev,
                    [`show${columnKey.charAt(0).toUpperCase() + columnKey.slice(1)}`]:
                      e.target.checked,
                  }))
                }
              />
              <span style={{ minWidth: 100 }}>{columnLabels[columnKey]}</span>
              <IconButton
                size="small"
                onClick={() => handleMoveColumnUp(columnKey)}
                disabled={idx === 0}
                sx={{ ml: 1 }}
              >
                <ArrowUpIcon fontSize="small" />
              </IconButton>
              <IconButton
                size="small"
                onClick={() => handleMoveColumnDown(columnKey)}
                disabled={idx === estimateListColumnOrder.length - 1}
              >
                <ArrowDownIcon fontSize="small" />
              </IconButton>
            </Box>
          ))}
          <Button
            variant="outlined"
            size="small"
            onClick={handleResetColumnOrder}
            sx={{ color: '#b0b8c1', borderColor: '#2e3a4a', mt: 2 }}
          >
            초기화
          </Button>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEstimateListSettingsOpen(false)}>
            취소
          </Button>
          <Button
            onClick={() => setEstimateListSettingsOpen(false)}
            variant="contained"
          >
            저장
          </Button>
        </DialogActions>
      </Dialog>

      {/* 견적서 검색 모달 */}
      <Dialog
        open={estimateDialogOpen}
        onClose={() => setEstimateDialogOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>견적서 검색</DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            label="견적서 검색"
            value={estimateSearch}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
              setEstimateSearch(e.target.value)
            }
            placeholder="견적서명, 제품명, 거래처, 브랜드 등으로 검색"
            sx={{ mb: 2 }}
          />

          {/* 탭 구분 */}
          <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 2 }}>
            <Tabs
              value={estimateSearchTab}
              onChange={(
                e: React.SyntheticEvent,
                newValue: 'current' | 'saved'
              ) => setEstimateSearchTab(newValue)}
            >
              <Tab
                label={`현재 견적서 (${filteredEstimates.length})`}
                value="current"
              />
              <Tab
                label={`저장된 견적서 (${filteredSavedEstimates.length})`}
                value="saved"
              />
            </Tabs>
          </Box>

          {/* 현재 견적서 탭 */}
          {estimateSearchTab === 'current' && (
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>견적서명</TableCell>
                    <TableCell>포함 제품</TableCell>
                    <TableCell>작업</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {filteredEstimates.map((estimate, idx) => (
                    <TableRow
                      key={`estimate-${estimate.id || 'no-id'}-${idx}`}
                      hover
                      sx={{ cursor: 'pointer' }}
                    >
                      <TableCell
                        onClick={() => {
                          setActiveTab(idx);
                          setEstimateDialogOpen(false);
                        }}
                      >
                        {estimate.name}
                      </TableCell>
                      <TableCell
                        onClick={() => {
                          setActiveTab(idx);
                          setEstimateDialogOpen(false);
                        }}
                      >
                        {estimate.rows
                          .map(row => row.productName)
                          .filter(Boolean)
                          .join(', ')}
                      </TableCell>
                      <TableCell>
                        <Button
                          size="small"
                          variant="outlined"
                          onClick={() => {
                            setActiveTab(idx);
                            setEstimateDialogOpen(false);
                          }}
                        >
                          선택
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}

          {/* 저장된 견적서 탭 */}
          {estimateSearchTab === 'saved' && (
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>견적서명</TableCell>
                    <TableCell>포함 제품</TableCell>
                    <TableCell>작업</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {filteredSavedEstimates.map((savedEstimate: any, index: number) => (
                    <TableRow
                                              key={`saved-estimate-${savedEstimate.id || 'no-id'}-${savedEstimate.estimateNo || 'no-estimate-no'}-${index}`}
                      hover
                      sx={{
                        cursor: 'pointer',
                        backgroundColor: 'var(--surface-color)',
                        '&:hover': { backgroundColor: 'var(--hover-color)' },
                      }}
                      onDoubleClick={() => {
                        const isFinal = savedEstimate.estimateNo && savedEstimate.estimateNo.includes('-final');
                        if (isFinal) {
                          handleEditFinalEstimate(savedEstimate);
                        } else {
                          handleLoadSavedEstimate(savedEstimate);
                        }
                      }}
                    >
                      <TableCell>{savedEstimate.name}</TableCell>
                      <TableCell>
                        {savedEstimate.rows
                          .map((row: any) => row.productName)
                          .filter(Boolean)
                          .join(', ')}
                      </TableCell>
                      <TableCell>
                        {savedEstimate.estimateNo && savedEstimate.estimateNo.includes('-final') ? (
                          <Button
                            size="small"
                            variant="outlined"
                            onClick={() => handleEditFinalEstimate(savedEstimate)}
                            sx={{
                              color: '#ff9800',
                              borderColor: '#ff9800',
                              '&:hover': {
                                backgroundColor: '#ff9800',
                                color: '#fff'
                              }
                            }}
                          >
                            수정
                          </Button>
                        ) : (
                          <Button
                            size="small"
                            variant="outlined"
                            onClick={() => handleLoadSavedEstimate(savedEstimate)}
                          >
                            불러오기
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEstimateDialogOpen(false)}>닫기</Button>
        </DialogActions>
      </Dialog>
      {/* 개선된 제품 검색 모달 */}
      <Dialog
        open={productDialogOpen}
        onClose={() => {
          setProductDialogOpen(false);
          setProductSearchText('');
          handleProductSearchFilterReset();
          // 일괄변경 모드 상태 초기화
          if (isBulkEditProductSelection) {
            setIsBulkEditProductSelection(false);
            setSelectedProducts(new Set());
          }
        }}
        maxWidth="lg"
        fullWidth
        fullScreen={isMobile}
        PaperProps={{ 
          sx: { 
            backgroundColor: 'var(--surface-color)', 
            color: 'var(--text-color)',
            '& .MuiDialogTitle-root': {
              backgroundColor: 'var(--surface-color)',
              color: 'var(--text-color)',
              borderBottom: '1px solid var(--border-color)'
            },
            '& .MuiDialogContent-root': {
              backgroundColor: 'var(--surface-color)',
              color: 'var(--text-color)'
            },
            '& .MuiDialogActions-root': {
              backgroundColor: 'var(--surface-color)',
              color: 'var(--text-color)',
              borderTop: '1px solid var(--border-color)'
            }
          } 
        }}
      >
        <DialogTitle sx={{
          display: 'flex',
          alignItems: 'center',
          gap: 1,
          fontSize: isMobile ? '1.2rem' : '1.25rem',
          pb: isMobile ? 1 : 2
        }}>
          {isMobile && (
            <IconButton
              edge="start"
              color="inherit"
              onClick={() => {
                setProductDialogOpen(false);
                setProductSearchText('');
                handleProductSearchFilterReset();
              }}
              aria-label="close"
              sx={{ mr: 1 }}
            >
              <ArrowBackIcon />
            </IconButton>
          )}
          <Box sx={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            width: '100%'
          }}>
            <Typography variant="h6" sx={{ fontSize: isMobile ? '1.1rem' : '1.25rem' }}>
              {isBulkEditProductSelection ? '일괄변경할 제품 선택' : '제품 검색'}
            </Typography>
            <Button
              size={isMobile ? "medium" : "small"}
              variant="outlined"
              onClick={handleProductSearchFilterReset}
              sx={{
                minWidth: isMobile ? 100 : 80,
                fontSize: isMobile ? '0.9rem' : '0.875rem'
              }}
            >
              필터 초기화
            </Button>
          </Box>
          <Typography variant="body2" color="text.secondary" sx={{
            mt: isMobile ? 0.5 : 1,
            fontSize: isMobile ? '0.9rem' : '0.875rem'
          }}>
            제품명, 제품코드, 세부내용으로 검색하세요
          </Typography>
        </DialogTitle>
        <DialogContent>
          {/* 검색 필터 영역 */}
          <Box sx={{ mb: isMobile ? 2 : 3 }}>
            <Grid container spacing={isMobile ? 1 : 2}>
              <Grid item xs={12} md={3}>
                <FormControl fullWidth size={isMobile ? "medium" : "small"}>
                  <InputLabel sx={{ 
                    fontSize: isMobile ? '1rem' : '0.875rem',
                    color: 'var(--text-secondary-color)'
                  }}>거래처</InputLabel>
                  <Select
                    value={productSearchFilters.vendor}
                    onChange={(e) => handleProductSearchFilterChange('vendor', e.target.value)}
                    label="거래처"
                    sx={{
                      backgroundColor: 'var(--background-color)',
                      '& .MuiSelect-select': {
                        fontSize: isMobile ? '1rem' : '0.875rem',
                        padding: isMobile ? '12px 14px' : '8.5px 14px',
                        color: 'var(--text-color)',
                      },
                      '& .MuiOutlinedInput-notchedOutline': {
                        borderColor: 'var(--border-color)',
                      },
                      '&:hover .MuiOutlinedInput-notchedOutline': {
                        borderColor: 'var(--primary-color)',
                      },
                      '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                        borderColor: 'var(--primary-color)',
                      },
                    }}
                  >
                    <MenuItem value="" sx={{ 
                      fontSize: isMobile ? '1rem' : '0.875rem',
                      color: 'var(--text-color)',
                      '&:hover': {
                        backgroundColor: 'var(--hover-color)',
                      },
                    }}>전체</MenuItem>
                    {Array.from(new Set(productOptions.map(p => p.vendorName).filter(Boolean))).map(vendor => (
                      <MenuItem key={vendor} value={vendor} sx={{ 
                        fontSize: isMobile ? '1rem' : '0.875rem',
                        color: 'var(--text-color)',
                        '&:hover': {
                          backgroundColor: 'var(--hover-color)',
                        },
                      }}>{vendor}</MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} md={3}>
                <FormControl fullWidth size={isMobile ? "medium" : "small"}>
                  <InputLabel sx={{ 
                    fontSize: isMobile ? '1rem' : '0.875rem',
                    color: 'var(--text-secondary-color)'
                  }}>제품종류</InputLabel>
                  <Select
                    value={productSearchFilters.category}
                    onChange={(e) => handleProductSearchFilterChange('category', e.target.value)}
                    label="제품종류"
                    sx={{
                      backgroundColor: 'var(--background-color)',
                      '& .MuiSelect-select': {
                        fontSize: isMobile ? '1rem' : '0.875rem',
                        padding: isMobile ? '12px 14px' : '8.5px 14px',
                        color: 'var(--text-color)',
                      },
                      '& .MuiOutlinedInput-notchedOutline': {
                        borderColor: 'var(--border-color)',
                      },
                      '&:hover .MuiOutlinedInput-notchedOutline': {
                        borderColor: 'var(--primary-color)',
                      },
                      '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                        borderColor: 'var(--primary-color)',
                      },
                    }}
                  >
                    <MenuItem value="" sx={{ 
                      fontSize: isMobile ? '1rem' : '0.875rem',
                      color: 'var(--text-color)',
                      '&:hover': {
                        backgroundColor: 'var(--hover-color)',
                      },
                    }}>전체</MenuItem>
                    {Array.from(new Set(
                      productOptions
                        .filter(p => !productSearchFilters.vendor || p.vendorName === productSearchFilters.vendor)
                        .map(p => p.category)
                        .filter(Boolean)
                    )).map(category => (
                      <MenuItem key={category} value={category} sx={{ 
                        fontSize: isMobile ? '1rem' : '0.875rem',
                        color: 'var(--text-color)',
                        '&:hover': {
                          backgroundColor: 'var(--hover-color)',
                        },
                      }}>{category}</MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} md={3}>
                <FormControl fullWidth size={isMobile ? "medium" : "small"}>
                  <InputLabel sx={{ 
                    fontSize: isMobile ? '1rem' : '0.875rem',
                    color: 'var(--text-secondary-color)'
                  }}>브랜드</InputLabel>
                  <Select
                    value={productSearchFilters.brand}
                    onChange={(e) => handleProductSearchFilterChange('brand', e.target.value)}
                    label="브랜드"
                    sx={{
                      backgroundColor: 'var(--background-color)',
                      '& .MuiSelect-select': {
                        fontSize: isMobile ? '1rem' : '0.875rem',
                        padding: isMobile ? '12px 14px' : '8.5px 14px',
                        color: 'var(--text-color)',
                      },
                      '& .MuiOutlinedInput-notchedOutline': {
                        borderColor: 'var(--border-color)',
                      },
                      '&:hover .MuiOutlinedInput-notchedOutline': {
                        borderColor: 'var(--primary-color)',
                      },
                      '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                        borderColor: 'var(--primary-color)',
                      },
                    }}
                  >
                    <MenuItem value="" sx={{ 
                      fontSize: isMobile ? '1rem' : '0.875rem',
                      color: 'var(--text-color)',
                      '&:hover': {
                        backgroundColor: 'var(--hover-color)',
                      },
                    }}>전체</MenuItem>
                    {Array.from(new Set(
                      productOptions
                        .filter(p => {
                          // 거래처 필터 적용
                          if (productSearchFilters.vendor && p.vendorName !== productSearchFilters.vendor) {
                            return false;
                          }
                          // 제품종류 필터 적용
                          if (productSearchFilters.category && p.category !== productSearchFilters.category) {
                            return false;
                          }
                          return true;
                        })
                        .map(p => p.brand)
                        .filter(Boolean)
                    )).map(brand => (
                      <MenuItem key={brand} value={brand} sx={{ 
                        fontSize: isMobile ? '1rem' : '0.875rem',
                        color: 'var(--text-color)',
                        '&:hover': {
                          backgroundColor: 'var(--hover-color)',
                        },
                      }}>{brand}</MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} md={3}>
                <TextField
                  fullWidth
                  size={isMobile ? "medium" : "small"}
                  label="검색어"
                  value={productSearchText}
                  onChange={(e) => handleProductSearchTextChange(e.target.value)}
                  onKeyPress={handleSearchKeyPress}
                  placeholder="제품명, 코드, 세부내용"
                  sx={{
                    backgroundColor: 'var(--background-color)',
                    '& .MuiInputBase-input': {
                      fontSize: isMobile ? '1rem' : '0.875rem',
                      padding: isMobile ? '12px 14px' : '8.5px 14px',
                      color: 'var(--text-color)',
                    },
                    '& .MuiInputLabel-root': {
                      color: 'var(--text-secondary-color)',
                    },
                    '& .MuiOutlinedInput-root': {
                      '& fieldset': {
                        borderColor: 'var(--border-color)',
                      },
                      '&:hover fieldset': {
                        borderColor: 'var(--primary-color)',
                      },
                      '&.Mui-focused fieldset': {
                        borderColor: 'var(--primary-color)',
                      },
                    },
                  }}
                  InputProps={{
                    endAdornment: (
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        {isProductSearching && (
                          <Typography variant="caption" sx={{ fontSize: isMobile ? '0.9rem' : '0.75rem' }}>
                            검색중...
                          </Typography>
                        )}
                        {productSearchText.trim() && !isProductSearching && (
                          <IconButton
                            size="small"
                            onClick={handleSearchSubmit}
                            sx={{
                              p: 0.5,
                              color: '#1976d2',
                              '&:hover': {
                                backgroundColor: '#e3f2fd'
                              }
                            }}
                            title="검색 실행"
                          >
                            <SearchIcon fontSize="small" />
                          </IconButton>
                        )}
                      </Box>
                    )
                  }}
                />
              </Grid>
            </Grid>
          </Box>

          {/* 고정된 검색어 */}
          {pinnedSearchTerms.length > 0 && (
            <Box sx={{ mb: 2 }}>
              <Typography variant="subtitle2" sx={{ mb: 1, color: '#d32f2f', fontWeight: 'bold', fontSize: '0.95rem' }}>
                📌 고정된 검색어:
              </Typography>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                {pinnedSearchTerms.map((term, index) => (
                  <Chip
                    key={`pinned-${index}`}
                    label={term}
                    size="small"
                    onClick={() => handleSearchHistorySelect(term)}
                    onDelete={() => handleDeleteSearchTerm(term, true)}
                    deleteIcon={
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                        <IconButton
                          size="small"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleTogglePinSearchTerm(term);
                          }}
                          sx={{ p: 0, color: '#fff' }}
                        >
                          <PushPinIcon fontSize="small" />
                        </IconButton>
                        <IconButton
                          size="small"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteSearchTerm(term, true);
                          }}
                          sx={{ p: 0, color: '#fff' }}
                        >
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      </Box>
                    }
                    sx={{
                      backgroundColor: '#e53935',
                      color: '#fff',
                      fontWeight: 'bold',
                      border: 'none',
                      boxShadow: 'none',
                      '& .MuiChip-deleteIcon': { color: '#fff' },
                      '&:hover': {
                        backgroundColor: '#b71c1c',
                        color: '#fff',
                        boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
                      }
                    }}
                  />
                ))}
              </Box>
            </Box>
          )}

          {/* 검색 히스토리 */}
          {productSearchHistory.length > 0 && (
            <Box sx={{ mb: 2 }}>
              <Typography variant="subtitle2" sx={{ mb: 1, color: '#1976d2', fontWeight: 'bold', fontSize: '0.95rem' }}>
                🔍 최근 검색어:
              </Typography>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                {productSearchHistory.slice(0, 30).map((term, index) => (
                  <Chip
                    key={`history-${index}`}
                    label={term}
                    size="small"
                    onClick={() => handleSearchHistorySelect(term)}
                    onDelete={() => handleDeleteSearchTerm(term, false)}
                    deleteIcon={
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                        <IconButton
                          size="small"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleTogglePinSearchTerm(term);
                          }}
                          sx={{ p: 0, color: '#fff' }}
                        >
                          <PushPinOutlinedIcon fontSize="small" />
                        </IconButton>
                        <IconButton
                          size="small"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteSearchTerm(term, false);
                          }}
                          sx={{ p: 0, color: '#fff' }}
                        >
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      </Box>
                    }
                    sx={{
                      backgroundColor: '#1e88e5',
                      color: '#fff',
                      fontWeight: 'bold',
                      border: 'none',
                      boxShadow: 'none',
                      '& .MuiChip-deleteIcon': { color: '#fff' },
                      '&:hover': {
                        backgroundColor: '#0d47a1',
                        color: '#fff',
                        boxShadow: '0 2px 4px rgba(0,0,0,0.15)'
                      }
                    }}
                  />
                ))}
              </Box>
            </Box>
          )}

          {/* 에러 메시지 */}
          {productSearchError && (
            <Box sx={{ mb: 2, p: 1, backgroundColor: '#ffebee', borderRadius: 1 }}>
              <Typography color="error" variant="body2">
                {productSearchError}
              </Typography>
            </Box>
          )}

          {/* 검색 결과 */}
          <Typography variant="h6" sx={{ mb: 1 }}>
            검색 결과 ({productSearchResults.length}개)
          </Typography>

          {productSearchFilters.category ? (
            productSearchResults.length === 0 ? (
              <Box sx={{ textAlign: 'center', py: 4 }}>
                <Typography color="text.secondary" variant="body1">
                  검색 결과가 없습니다.
                </Typography>
                <Typography variant="body2" sx={{ mt: 1, color: '#666' }}>
                  다른 검색어나 필터를 사용해보세요.
                </Typography>
              </Box>
            ) : (
              isMobile ? (
                // 모바일: 카드형 UI
                <Box>
                  {productSearchResults.map((product, idx) => (
                    <Box
                      key={product.id}
                      sx={{
                        border: '1px solid var(--border-color)',
                        borderRadius: 2,
                        p: 2,
                        mb: 1.5,
                        cursor: 'pointer',
                        transition: 'all 0.2s',
                        position: 'relative',
                        backgroundColor: 'var(--background-color)',
                        color: 'var(--text-color)',
                        '&:hover': {
                          boxShadow: 3,
                          background: 'var(--hover-color)',
                          borderColor: 'var(--primary-color)'
                        },
                      }}
                    >
                      {/* 체크박스 */}
                      <Box sx={{ position: 'absolute', top: 8, right: 8 }}>
                        <Checkbox
                          checked={selectedProducts.has(product.id)}
                          onChange={() => handleProductSelection(product.id)}
                          size="small"
                        />
                      </Box>

                      <Box
                        onClick={() => {
                          console.log('제품 선택 onClick 호출됨');
                          console.log('selectedProductIdx:', selectedProductIdx);
                          
                          if (selectedProductIdx !== null) {
                            // 우클릭 메뉴에서 제품검색을 통해 선택된 경우
                            console.log('selectedProductIdx가 null이 아니므로 handleProductSelectForCell 호출');
                            handleProductSelectForCell(product);
                          } else {
                            // 일반적인 제품 추가
                            console.log('일반적인 제품 추가 로직 실행');
                            const newRow: EstimateRow = {
                              id: Date.now(),
                              type: 'product',
                              vendor: product.vendorName || '',
                              brand: product.brand || '',
                              space: '',
                              productType: product.category || '',
                              curtainType:
                                product.category === '커튼'
                                  ? product.insideOutside === '속'
                                    ? '속커튼'
                                    : '겉커튼'
                                  : '',
                              pleatType:
                                product.category === '커튼'
                                  ? product.insideOutside === '속'
                                    ? '나비'
                                    : '민자'
                                  : '',
                              productName: product.productName || '',
                              width: product.width || '',
                              details: product.details || '',
                              widthMM: 0,
                              heightMM: 0,
                              area: 0,
                              lineDir: '',
                              lineLen: 0,
                              pleatAmount:
                                product.category === '커튼' &&
                                  product.insideOutside === '속'
                                  ? '1.8~2'
                                  : 0,
                              widthCount: 0,
                              quantity: 1,
                              totalPrice: product.salePrice || 0,
                              salePrice: product.salePrice || 0,
                              cost: product.purchaseCost || 0,
                              purchaseCost: product.purchaseCost || 0,
                              margin:
                                (product.salePrice || 0) -
                                (product.purchaseCost || 0),
                              note: '',
                              productCode: product.productCode || '',
                              largePlainPrice: product.largePlainPrice ?? 0,
                              largePlainCost: product.largePlainCost ?? 0,
                            };
                            updateEstimateRows(activeTab, [
                              ...estimates[activeTab].rows,
                              newRow,
                            ]);
                            setProductDialogOpen(false);
                          }
                        }}
                      >
                        <Box fontWeight="bold" fontSize={16} mb={0.5}>
                          {highlightText(product?.productName || '', productSearchText)}
                        </Box>
                        <Box fontSize={13} color="#666" mb={0.5}>
                          {highlightText(product?.details || '', productSearchText)}
                        </Box>
                        {product.note && (
                          <Box fontSize={12} color="#888" mb={0.5} fontStyle="italic">
                            비고: {product.note}
                          </Box>
                        )}
                        <Box display="flex" justifyContent="space-between" fontSize={13} color="#888">
                          <span>{product.brand}</span>
                          <span>{product.vendorName}</span>
                          <span style={{ fontWeight: 'bold', color: '#1976d2' }}>
                            {product.salePrice?.toLocaleString()}원
                          </span>
                        </Box>
                      </Box>
                    </Box>
                  ))}
                </Box>
              ) : (
                // 데스크탑: 테이블형 UI (컬럼 최소화, 말줄임, hover)
                <TableContainer sx={{ 
                  maxHeight: 400, 
                  overflow: 'auto',
                  backgroundColor: 'var(--surface-color)',
                  '& .MuiTable-root': {
                    backgroundColor: 'var(--surface-color)',
                  },
                  '& .MuiTableHead-root': {
                    backgroundColor: 'var(--surface-color)',
                  },
                  '& .MuiTableBody-root': {
                    backgroundColor: 'var(--surface-color)',
                  }
                }}>
                  <Table size="small" stickyHeader>
                    <TableHead>
                      <TableRow sx={{
                        backgroundColor: 'var(--surface-color)',
                        '& .MuiTableCell-root': {
                          backgroundColor: 'var(--surface-color)',
                          color: 'var(--text-color)',
                          borderBottom: '2px solid var(--border-color)',
                          fontWeight: 'bold'
                        }
                      }}>
                        <TableCell sx={{ 
                          minWidth: 50,
                          backgroundColor: 'var(--surface-color)',
                          color: 'var(--text-color)',
                          borderBottom: '2px solid var(--border-color)',
                          fontWeight: 'bold'
                        }}>
                          <Checkbox
                            checked={selectedProducts.size === productSearchResults.length && productSearchResults.length > 0}
                            indeterminate={selectedProducts.size > 0 && selectedProducts.size < productSearchResults.length}
                            onChange={handleSelectAllProducts}
                            size="small"
                          />
                        </TableCell>
                        <TableCell sx={{ 
                          minWidth: 80,
                          backgroundColor: 'var(--surface-color)',
                          color: 'var(--text-color)',
                          borderBottom: '2px solid var(--border-color)',
                          fontWeight: 'bold'
                        }}>거래처</TableCell>
                        <TableCell sx={{ 
                          minWidth: 80,
                          backgroundColor: 'var(--surface-color)',
                          color: 'var(--text-color)',
                          borderBottom: '2px solid var(--border-color)',
                          fontWeight: 'bold'
                        }}>브랜드</TableCell>
                        <TableCell sx={{ 
                          minWidth: 200,
                          backgroundColor: 'var(--surface-color)',
                          color: 'var(--text-color)',
                          borderBottom: '2px solid var(--border-color)',
                          fontWeight: 'bold'
                        }}>제품명</TableCell>
                        <TableCell sx={{ 
                          minWidth: 250,
                          backgroundColor: 'var(--surface-color)',
                          color: 'var(--text-color)',
                          borderBottom: '2px solid var(--border-color)',
                          fontWeight: 'bold'
                        }}>세부내용</TableCell>
                        <TableCell sx={{ 
                          minWidth: 150,
                          backgroundColor: 'var(--surface-color)',
                          color: 'var(--text-color)',
                          borderBottom: '2px solid var(--border-color)',
                          fontWeight: 'bold'
                        }}>비고</TableCell>
                        <TableCell align="right" sx={{ 
                          minWidth: 100,
                          backgroundColor: 'var(--surface-color)',
                          color: 'var(--text-color)',
                          borderBottom: '2px solid var(--border-color)',
                          fontWeight: 'bold'
                        }}>판매가</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {productSearchResults.map((product, idx) => (
                        <TableRow
                          key={product.id}
                          hover
                          sx={{
                            cursor: 'pointer',
                            transition: 'background 0.2s',
                            backgroundColor: 'var(--surface-color)',
                            color: 'var(--text-color)',
                            '&:hover': { 
                              background: 'var(--hover-color)',
                              color: 'var(--text-color)'
                            }
                          }}
                          onClick={() => {
                            if (editOpen) {
                              handleProductSelectForEdit(product);
                            } else {
                              const newRow: EstimateRow = {
                                id: Date.now(),
                                type: 'product',
                                vendor: product.vendorName || '',
                                brand: product.brand || '',
                                space: '',
                                productType: product.category || '',
                                curtainType:
                                  product.category === '커튼'
                                    ? product.insideOutside === '속'
                                      ? '속커튼'
                                      : '겉커튼'
                                    : '',
                                pleatType:
                                  product.category === '커튼'
                                    ? product.insideOutside === '속'
                                      ? '나비'
                                      : '민자'
                                    : '',
                                productName: product.productName || '',
                                width: product.width || '',
                                details: product.details || '',
                                widthMM: 0,
                                heightMM: 0,
                                area: 0,
                                lineDir: '',
                                lineLen: 0,
                                pleatAmount:
                                  product.category === '커튼' &&
                                    product.insideOutside === '속'
                                    ? '1.8~2'
                                    : 0,
                                widthCount: 0,
                                quantity: 1,
                                totalPrice: product.salePrice || 0,
                                salePrice: product.salePrice || 0,
                                cost: product.purchaseCost || 0,
                                purchaseCost: product.purchaseCost || 0,
                                margin:
                                  (product.salePrice || 0) -
                                  (product.purchaseCost || 0),
                                note: '',
                                productCode: product.productCode || '',
                                largePlainPrice: product.largePlainPrice ?? 0,
                                largePlainCost: product.largePlainCost ?? 0,
                              };
                              updateEstimateRows(activeTab, [
                                ...estimates[activeTab].rows,
                                newRow,
                              ]);
                              setProductDialogOpen(false);
                            }
                          }}
                        >
                          <TableCell sx={{ 
                            minWidth: 50,
                            backgroundColor: 'var(--surface-color)',
                            color: 'var(--text-color)',
                            borderBottom: '1px solid var(--border-color)'
                          }}>
                            <Checkbox
                              checked={selectedProducts.has(product.id)}
                              onChange={() => handleProductSelection(product.id)}
                              onClick={(e) => e.stopPropagation()} // 행 클릭 이벤트 방지
                              size="small"
                            />
                          </TableCell>
                          <TableCell sx={{
                            maxWidth: 80,
                            whiteSpace: 'nowrap',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            backgroundColor: 'var(--surface-color)',
                            color: 'var(--text-color)',
                            borderBottom: '1px solid var(--border-color)'
                          }}>
                            {product.vendorName}
                          </TableCell>
                          <TableCell sx={{
                            maxWidth: 80,
                            whiteSpace: 'nowrap',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            backgroundColor: 'var(--surface-color)',
                            color: 'var(--text-color)',
                            borderBottom: '1px solid var(--border-color)'
                          }}>
                            {product.brand}
                          </TableCell>
                          <TableCell sx={{
                            minWidth: 200,
                            maxWidth: 300,
                            wordBreak: 'break-word',
                            whiteSpace: 'normal',
                            backgroundColor: 'var(--surface-color)',
                            color: 'var(--text-color)',
                            borderBottom: '1px solid var(--border-color)'
                          }}>
                            {highlightText(product?.productName || '', productSearchText)}
                          </TableCell>
                          <TableCell sx={{
                            minWidth: 250,
                            maxWidth: 400,
                            wordBreak: 'break-word',
                            whiteSpace: 'normal',
                            backgroundColor: 'var(--surface-color)',
                            color: 'var(--text-color)',
                            borderBottom: '1px solid var(--border-color)'
                          }}>
                            {highlightText(product?.details || '', productSearchText)}
                          </TableCell>
                          <TableCell sx={{
                            minWidth: 150,
                            maxWidth: 200,
                            wordBreak: 'break-word',
                            whiteSpace: 'normal',
                            backgroundColor: 'var(--surface-color)',
                            color: 'var(--text-color)',
                            borderBottom: '1px solid var(--border-color)'
                          }}>
                            {product.note || '-'}
                          </TableCell>
                          <TableCell align="right" sx={{
                            minWidth: 100,
                            fontWeight: 'bold',
                            color: 'var(--primary-color)',
                            backgroundColor: 'var(--surface-color)',
                            borderBottom: '1px solid var(--border-color)'
                          }}>
                            {product.salePrice?.toLocaleString()}원
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              )
            )
          ) : (
            // 제품종류 미선택 시 안내 메시지
            <Box sx={{ textAlign: 'center', py: 4 }}>
              <Typography color="text.secondary" variant="body1" sx={{ color: 'var(--text-secondary-color)' }}>
                제품종류를 먼저 선택하세요.
              </Typography>
              <Typography variant="body2" sx={{ mt: 1, color: 'var(--text-secondary-color)' }}>
                제품종류를 선택하면 검색 결과가 표시됩니다.
              </Typography>
            </Box>
          )}
        </DialogContent>
        {!isMobile && (
          <DialogActions>
            {selectedProducts.size > 0 && (
              <Button
                variant="contained"
                color="primary"
                onClick={handleAddSelectedProducts}
                sx={{ mr: 1 }}
              >
                {isBulkEditProductSelection 
                  ? `선택된 제품으로 일괄변경 (${selectedProducts.size}개)`
                  : `선택된 제품 추가 후 계속 (${selectedProducts.size}개)`
                }
              </Button>
            )}
            <Button onClick={() => {
              setProductDialogOpen(false);
              setProductSearchText('');
              handleProductSearchFilterReset();
            }}>
              닫기
            </Button>
          </DialogActions>
        )}
        {isMobile && (
          <Box sx={{ p: 2, display: 'flex', gap: 1, justifyContent: 'center', flexDirection: 'column' }}>
            {selectedProducts.size > 0 && (
              <Button
                variant="contained"
                color="primary"
                onClick={handleAddSelectedProducts}
                sx={{
                  minHeight: '48px',
                  fontSize: '1rem',
                  px: 3
                }}
              >
                {isBulkEditProductSelection 
                  ? `선택된 제품으로 일괄변경 (${selectedProducts.size}개)`
                  : `선택된 제품 추가 후 계속 (${selectedProducts.size}개)`
                }
              </Button>
            )}
            <Button
              onClick={() => {
                setProductDialogOpen(false);
                setProductSearchText('');
                handleProductSearchFilterReset();
                // 일괄변경 모드 상태 초기화
                if (isBulkEditProductSelection) {
                  setIsBulkEditProductSelection(false);
                  setSelectedProducts(new Set());
                }
              }}
              variant="outlined"
              sx={{
                minHeight: '48px',
                fontSize: '1rem',
                px: 3
              }}
            >
              닫기
            </Button>
          </Box>
        )}
      </Dialog>
      {/* 옵션 추가 모달 */}
      <Dialog
        open={optionDialogOpen}
        onClose={() => setOptionDialogOpen(false)}
        maxWidth="md"
        fullWidth
        fullScreen={isMobile}
        PaperProps={{ 
          sx: { 
            backgroundColor: 'var(--surface-color)', 
            color: 'var(--text-color)',
            '& .MuiDialogTitle-root': {
              backgroundColor: 'var(--surface-color)',
              color: 'var(--text-color)',
              borderBottom: '1px solid var(--border-color)'
            },
            '& .MuiDialogContent-root': {
              backgroundColor: 'var(--surface-color)',
              color: 'var(--text-color)'
            },
            '& .MuiDialogActions-root': {
              backgroundColor: 'var(--surface-color)',
              color: 'var(--text-color)',
              borderTop: '1px solid var(--border-color)'
            }
          } 
        }}
      >
        <DialogTitle sx={{
          display: 'flex',
          alignItems: 'center',
          gap: 1,
          fontSize: isMobile ? '1.2rem' : '1.25rem',
          pb: isMobile ? 1 : 2,
          backgroundColor: 'var(--surface-color)',
          color: 'var(--text-color)',
          borderBottom: '1px solid var(--border-color)'
        }}>
          {isMobile && (
            <IconButton
              edge="start"
              color="inherit"
              onClick={() => setOptionDialogOpen(false)}
              aria-label="close"
              sx={{ mr: 1, color: 'var(--text-color)' }}
            >
              <ArrowBackIcon />
            </IconButton>
          )}
          <Box>
            <Typography variant="h6" sx={{ fontSize: isMobile ? '1.1rem' : '1.25rem', color: 'var(--text-color)' }}>
              옵션 추가
            </Typography>
            {selectedProductIdx !== null &&
              estimates[activeTab].rows[selectedProductIdx]?.type ===
              'product' && (
                <Typography
                  variant="subtitle2"
                  sx={{
                    mt: isMobile ? 0.5 : 1,
                    color: 'var(--text-color)',
                    opacity: 0.7,
                    fontWeight: 'normal',
                    fontSize: isMobile ? '0.9rem' : '0.875rem'
                  }}
                >
                  선택된 제품: {estimates[activeTab]?.rows[selectedProductIdx]?.productName || '알 수 없음'}
                  ({estimates[activeTab]?.rows[selectedProductIdx]?.productType || '알 수 없음'})
                </Typography>
              )}
          </Box>
        </DialogTitle>
        <DialogContent sx={{ backgroundColor: 'var(--surface-color)', color: 'var(--text-color)' }}>
          {selectedProductIdx !== null && (
            <Box sx={{ mb: 2, p: 2, bgcolor: 'var(--hover-color)', borderRadius: 1, border: '1px solid var(--border-color)' }}>
              <Typography variant="subtitle2" sx={{ color: 'var(--text-color)', mb: 1 }}>
                선택된 제품: {estimates[activeTab]?.rows[selectedProductIdx]?.productName || '알 수 없음'}
                ({estimates[activeTab]?.rows[selectedProductIdx]?.productType || '알 수 없음'})
              </Typography>
              <Typography variant="body2" sx={{ color: 'var(--text-color)', opacity: 0.7, fontSize: '0.875rem' }}>
                옵션이 선택된 제품 다음에 추가됩니다.
              </Typography>
            </Box>
          )}
          {selectedProductIdx === null && (
            <Box sx={{ mb: 2, p: 2, bgcolor: 'var(--warning-color)', borderRadius: 1, border: '1px solid var(--border-color)' }}>
              <Typography variant="subtitle2" sx={{ color: 'var(--text-color)', mb: 1, fontWeight: 'bold' }}>
                ⚠️ 제품을 먼저 선택해주세요
              </Typography>
              <Typography variant="body2" sx={{ color: 'var(--text-color)', opacity: 0.8, fontSize: '0.875rem' }}>
                옵션을 추가하려면 견적서에서 제품을 먼저 선택한 후 옵션추가 버튼을 클릭해주세요.
              </Typography>
            </Box>
                    )}
          <Box sx={{ borderBottom: 1, borderColor: 'var(--border-color)', mb: isMobile ? 1.5 : 2 }}>
            <Tabs
              value={optionSearchTab}
              onChange={(e: React.SyntheticEvent, newValue: number) => {
                if (selectedProductIdx === null) {
                  setSnackbarMessage('옵션을 추가하려면 먼저 제품을 선택해주세요.');
                  setSnackbarOpen(true);
                  return;
                }
                setOptionSearchTab(newValue);
                const selectedType = optionTypeMap[newValue];
                handleOptionSearch(selectedType);
              }}
              sx={{
                opacity: selectedProductIdx === null ? 0.5 : 1,
                pointerEvents: selectedProductIdx === null ? 'none' : 'auto',
                '& .MuiTab-root': {
                  fontSize: isMobile ? '0.9rem' : '0.875rem',
                  minHeight: isMobile ? '48px' : '48px',
                  color: 'var(--text-color)',
                  '&.Mui-selected': {
                    color: 'var(--primary-color)'
                  }
                },
                '& .MuiTabs-indicator': {
                  backgroundColor: 'var(--primary-color)'
                }
              }}
            >
              {optionTypeMap.map((type: string, index: number) => (
                <Tab key={type} label={type} />
              ))}
            </Tabs>
          </Box>
          
          {/* 시공 옵션 탭에서만 수량 입력 필드 표시 */}
          {optionTypeMap[optionSearchTab] === '시공옵션' && (
            <Box sx={{ mb: 2, p: 2, bgcolor: '#fff3e0', borderRadius: 1, border: '1px solid #ffb74d' }}>
              <Typography variant="subtitle2" sx={{ color: '#e65100', mb: 1, fontWeight: 'bold' }}>
                시공 옵션 수량 설정
              </Typography>
              <TextField
                label="수량"
                type="number"
                value={optionQuantity}
                onChange={(e) => setOptionQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                size="small"
                sx={{ width: 120 }}
                inputProps={{ min: 1 }}
                helperText="시공 옵션의 수량을 입력하세요 (커튼/블라인드시공은 자동 계산)"
              />
              <Typography variant="caption" sx={{ color: '#e65100', mt: 1, display: 'block', fontWeight: 'bold' }}>
                💡 우클릭으로 기존 시공 옵션의 수량을 수정할 수 있습니다.
              </Typography>
              <Typography variant="caption" sx={{ color: '#e65100', display: 'block', fontSize: '0.75rem' }}>
                (단일 클릭: 옵션 추가, 우클릭: 수량 수정)
              </Typography>
            </Box>
          )}
          
          {/* 정렬 설정 */}
          <Box sx={{ mb: 2, p: 2, bgcolor: 'var(--hover-color)', borderRadius: 1, border: '1px solid var(--border-color)' }}>
            <Typography variant="subtitle2" sx={{ color: 'var(--text-color)', mb: 1, fontWeight: 'bold' }}>
              정렬 설정
            </Typography>
            <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', alignItems: 'center' }}>
              <FormControl size="small" sx={{ minWidth: 120 }}>
                <InputLabel sx={{ color: 'var(--text-color)' }}>정렬 기준</InputLabel>
                <Select
                  value={optionSortBy}
                  onChange={(e) => setOptionSortBy(e.target.value as 'vendor' | 'optionName' | 'salePrice')}
                  label="정렬 기준"
                  sx={{
                    color: 'var(--text-color)',
                    '& .MuiOutlinedInput-notchedOutline': {
                      borderColor: 'var(--border-color)'
                    },
                    '&:hover .MuiOutlinedInput-notchedOutline': {
                      borderColor: 'var(--primary-color)'
                    },
                    '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                      borderColor: 'var(--primary-color)'
                    }
                  }}
                >
                  <MenuItem value="vendor">공급업체</MenuItem>
                  <MenuItem value="optionName">옵션명</MenuItem>
                  <MenuItem value="salePrice">판매가</MenuItem>
                </Select>
              </FormControl>
              
              <FormControl size="small" sx={{ minWidth: 100 }}>
                <InputLabel sx={{ color: 'var(--text-color)' }}>정렬 순서</InputLabel>
                <Select
                  value={optionSortOrder}
                  onChange={(e) => setOptionSortOrder(e.target.value as 'asc' | 'desc')}
                  label="정렬 순서"
                  sx={{
                    color: 'var(--text-color)',
                    '& .MuiOutlinedInput-notchedOutline': {
                      borderColor: 'var(--border-color)'
                    },
                    '&:hover .MuiOutlinedInput-notchedOutline': {
                      borderColor: 'var(--primary-color)'
                    },
                    '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                      borderColor: 'var(--primary-color)'
                    }
                  }}
                >
                  <MenuItem value="asc">오름차순</MenuItem>
                  <MenuItem value="desc">내림차순</MenuItem>
                </Select>
              </FormControl>
              
              {optionSortBy === 'vendor' && (
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={optionSortKoreanFirst}
                      onChange={(e) => setOptionSortKoreanFirst(e.target.checked)}
                      size="small"
                      sx={{
                        color: 'var(--primary-color)',
                        '&.Mui-checked': {
                          color: 'var(--primary-color)'
                        }
                      }}
                    />
                  }
                  label={
                    <Typography variant="caption" sx={{ fontSize: '0.75rem', color: 'var(--text-color)' }}>
                      한글 우선
                    </Typography>
                  }
                />
              )}
            </Box>
          </Box>

          <TextField
            fullWidth
            size={isMobile ? "medium" : "small"}
            label="옵션 검색"
            value={optionSearch}
            onChange={handleOptionSearchInput}
            placeholder="옵션명, 세부내용으로 검색"
            disabled={selectedProductIdx === null}
            sx={{
              mb: isMobile ? 1.5 : 2,
              '& .MuiInputBase-input': {
                fontSize: isMobile ? '1rem' : '0.875rem',
                padding: isMobile ? '12px 14px' : '8.5px 14px',
                color: 'var(--text-color)'
              },
              '& .MuiInputLabel-root': {
                color: 'var(--text-color)'
              },
              '& .MuiOutlinedInput-notchedOutline': {
                borderColor: 'var(--border-color)'
              },
              '&:hover .MuiOutlinedInput-notchedOutline': {
                borderColor: 'var(--primary-color)'
              },
              '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                borderColor: 'var(--primary-color)'
              }
            }}
          />
              <TableContainer sx={{ 
                backgroundColor: 'var(--surface-color)',
                opacity: selectedProductIdx === null ? 0.5 : 1,
                pointerEvents: selectedProductIdx === null ? 'none' : 'auto'
              }}>
                <Table size="small">
                  <TableHead>
                    <TableRow sx={{ backgroundColor: 'var(--hover-color)' }}>
                      <TableCell sx={{ color: 'var(--text-color)', fontWeight: 'bold' }}>공급업체</TableCell>
                      <TableCell sx={{ color: 'var(--text-color)', fontWeight: 'bold' }}>옵션명</TableCell>
                      <TableCell sx={{ color: 'var(--text-color)', fontWeight: 'bold' }}>판매가</TableCell>
                      <TableCell sx={{ color: 'var(--text-color)', fontWeight: 'bold' }}>원가</TableCell>
                      {optionTypeMap[optionSearchTab] === '시공옵션' && (
                        <TableCell sx={{ color: 'var(--text-color)', fontWeight: 'bold' }}>수량</TableCell>
                      )}
                      <TableCell sx={{ color: 'var(--text-color)', fontWeight: 'bold' }}>상세정보</TableCell>
                      <TableCell sx={{ color: 'var(--text-color)', fontWeight: 'bold' }}>적용타입</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {optionResults.map(option => (
                      <TableRow
                        key={option.id}
                        hover
                        onClick={(e) => {
                          if (selectedProductIdx === null) {
                            e.preventDefault();
                            setSnackbarMessage('옵션을 추가하려면 먼저 제품을 선택해주세요.');
                            setSnackbarOpen(true);
                            return;
                          }
                          console.log('클릭 이벤트 발생:', option.optionName);
                          handleAddOptionToEstimate(option);
                        }}
                        onContextMenu={(e) => handleContextMenu(e, option)}
                        sx={{
                          cursor: 'pointer',
                          color: 'var(--text-color)',
                          '&:hover': {
                            backgroundColor: optionTypeMap[optionSearchTab] === '시공옵션' ? 'var(--primary-color)' : 'var(--hover-color)',
                          }
                        }}
                      >
                        <TableCell sx={{ color: 'var(--text-color)' }}>{option.vendor}</TableCell>
                        <TableCell sx={{ color: 'var(--text-color)' }}>{option.optionName}</TableCell>
                        <TableCell sx={{ color: 'var(--text-color)' }}>
                          {option.salePrice?.toLocaleString()}
                        </TableCell>
                        <TableCell sx={{ color: 'var(--text-color)' }}>
                          {option.purchaseCost?.toLocaleString()}
                        </TableCell>
                        {optionTypeMap[optionSearchTab] === '시공옵션' && (
                          <TableCell>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                              <Typography variant="body2" sx={{ fontWeight: 'bold', color: 'var(--primary-color)' }}>
                                {option.optionName?.includes('커튼시공') || option.optionName?.includes('커튼 시공') 
                                  ? calculateAutoQuantity(option.optionName)
                                  : option.optionName?.includes('블라인드시공') || option.optionName?.includes('블라인드 시공')
                                  ? calculateAutoQuantity(option.optionName)
                                  : optionQuantity}
                              </Typography>
                              {(option.optionName?.includes('커튼시공') || option.optionName?.includes('커튼 시공') ||
                                option.optionName?.includes('블라인드시공') || option.optionName?.includes('블라인드 시공')) && (
                                <Typography variant="caption" sx={{ color: 'var(--text-color)', opacity: 0.7, fontSize: '0.7rem' }}>
                                  (자동)
                                </Typography>
                              )}
                            </Box>
                          </TableCell>
                        )}
                        <TableCell sx={{ color: 'var(--text-color)' }}>
                          <Tooltip
                            title={option.details || '세부내용 없음'}
                            placement="top"
                            arrow
                          >
                            <span>
                              {option.details ? 
                                (option.details.length > 20 ? 
                                  `${option.details.substring(0, 20)}...` : 
                                  option.details
                                ) : 
                                '세부내용 없음'
                              }
                            </span>
                          </Tooltip>
                        </TableCell>
                        <TableCell sx={{ color: 'var(--text-color)' }}>{option.note}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
        </DialogContent>
        <DialogActions sx={{ backgroundColor: 'var(--surface-color)', color: 'var(--text-color)', borderTop: '1px solid var(--border-color)' }}>
          <Button onClick={() => setOptionDialogOpen(false)} sx={{ color: 'var(--text-color)' }}>닫기</Button>
        </DialogActions>
      </Dialog>

      {/* 시공 옵션 수정 모달 */}
      <Dialog
        open={editOptionDialogOpen}
        onClose={handleCancelEditOption}
        maxWidth="sm"
        fullWidth
        PaperProps={{ sx: { backgroundColor: 'var(--surface-color)', color: 'var(--text-color)' } }}
      >
        <DialogTitle sx={{
          display: 'flex',
          alignItems: 'center',
          gap: 1,
          fontSize: isMobile ? '1.2rem' : '1.25rem',
          pb: isMobile ? 1 : 2,
          fontWeight: 'bold',
          backgroundColor: 'var(--primary-color)',
          color: 'white'
        }}>
          <Typography variant="h6" sx={{ fontSize: isMobile ? '1.1rem' : '1.25rem' }}>
            시공 옵션 수정
          </Typography>
        </DialogTitle>
        <DialogContent>
          {editingOption && (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
              <Box sx={{ 
                p: 2, 
                bgcolor: 'var(--surface-color)',
                borderRadius: 1, 
                border: '1px solid var(--border-color)',
                backgroundColor: 'var(--surface-color)'
              }}>
                <Typography variant="subtitle2" sx={{ 
                  color: 'var(--primary-color)', 
                  mb: 1, 
                  fontWeight: 'bold' 
                }}>
                  옵션 정보
                </Typography>
                <Typography variant="body2" sx={{ 
                  color: 'var(--text-color)', 
                  mb: 0.5 
                }}>
                  <strong>옵션명:</strong> {editingOption.optionName}
                </Typography>
                <Typography variant="body2" sx={{ 
                  color: 'var(--text-color)', 
                  mb: 0.5 
                }}>
                  <strong>공급업체:</strong> {editingOption.vendor}
                </Typography>
                <Typography variant="body2" sx={{ 
                  color: 'var(--text-color)', 
                  mb: 0.5 
                }}>
                  <strong>판매가:</strong> {editingOption.salePrice?.toLocaleString()}원
                </Typography>
                <Typography variant="body2" sx={{ 
                  color: 'var(--text-color)', 
                  mb: 0.5 
                }}>
                  <strong>원가:</strong> {editingOption.purchaseCost?.toLocaleString()}원
                </Typography>
              </Box>
              
              <Box sx={{ 
                p: 2, 
                bgcolor: 'var(--surface-color)',
                borderRadius: 1, 
                border: '1px solid var(--border-color)',
                backgroundColor: 'var(--surface-color)'
              }}>
                <Typography variant="subtitle2" sx={{ 
                  color: 'var(--primary-color)', 
                  mb: 1, 
                  fontWeight: 'bold' 
                }}>
                  수량 설정
                </Typography>
                <TextField
                  label="수량"
                  type="number"
                  value={editOptionQuantity}
                  onChange={(e) => setEditOptionQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                  size="small"
                  sx={{ 
                    width: 200,
                    '& .MuiInputBase-root': {
                      backgroundColor: 'var(--surface-color)',
                      color: 'var(--text-color)'
                    },
                    '& .MuiInputLabel-root': {
                      color: 'var(--text-color)'
                    },
                    '& .MuiFormHelperText-root': {
                      color: 'var(--text-color)'
                    }
                  }}
                  inputProps={{ min: 1 }}
                  helperText={`총 판매가: ${((editingOption.salePrice || 0) * editOptionQuantity).toLocaleString()}원`}
                />
              </Box>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCancelEditOption} sx={{ 
            color: 'var(--text-color)',
            '&:hover': {
              backgroundColor: 'var(--hover-color)'
            }
          }}>
            취소
          </Button>
          <Button onClick={handleSaveEditOption} variant="contained" sx={{ 
            backgroundColor: 'var(--primary-color)',
            '&:hover': {
              backgroundColor: 'var(--primary-color)',
              opacity: 0.8
            }
          }}>
            수정 완료
          </Button>
        </DialogActions>
      </Dialog>

      {/* 우클릭 컨텍스트 메뉴 */}
      <Menu
        open={contextMenu !== null}
        onClose={handleCloseContextMenu}
        anchorReference="anchorPosition"
        anchorPosition={
          contextMenu !== null
            ? { top: contextMenu.mouseY, left: contextMenu.mouseX }
            : undefined
        }
        PaperProps={{
          sx: {
            backgroundColor: 'var(--surface-color)',
            color: 'var(--text-color)',
            border: '1px solid var(--border-color)',
          }
        }}
      >
        <MenuItem onClick={handleEditFromContextMenu} sx={{ color: '#e65100', fontWeight: 'bold' }}>
          수량 수정
        </MenuItem>
      </Menu>

      {/* 수정 모달 */}
      {editOpen && editRow && (
        <Dialog
          open={editOpen}
          onClose={handleEditClose}
          maxWidth="md"
          PaperProps={{ 
            sx: { 
              backgroundColor: 'white', 
              color: 'var(--text-color)',
              width: '90%',
              maxWidth: '800px'
            } 
          }}
        >
          <DialogTitle sx={{
            display: 'flex',
            alignItems: 'center',
            gap: 1,
            fontSize: isMobile ? '1.2rem' : '1.25rem',
            pb: isMobile ? 1 : 2,
            fontWeight: 'bold',
            backgroundColor: 'var(--primary-color)',
            color: 'white'
          }}>
            <Typography variant="body1" component="span" sx={{ fontSize: isMobile ? '1.1rem' : '1.25rem' }}>
            제품 정보 수정
            </Typography>
          </DialogTitle>
          <DialogContent sx={{ mt: 2 }}>
            <Box
              sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}
            >
              <Grid container spacing={2}>
                <Grid item xs={12} md={4}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <TextField
                      label="제품명"
                      value={editRow?.productName || ''}
                      InputProps={{ readOnly: true }}
                      fullWidth
                      size="small"
                      sx={{
                        input: { color: '#bdbdbd' },
                        label: { color: 'var(--text-secondary-color)' },
                        '& .MuiOutlinedInput-root': {
                          '& fieldset': { borderColor: 'var(--border-color)' },
                          '&:hover fieldset': { borderColor: 'var(--primary-color)' },
                        },
                      }}
                    />
                    <Button
                      variant="outlined"
                      size="small"
                      onClick={() => setProductDialogOpen(true)}
                      sx={{
                        minWidth: 40,
                        height: 32,
                        border: '1px solid var(--border-color)',
                        color: 'var(--text-color)',
                        padding: '4px',
                        '&:hover': {
                          backgroundColor: 'var(--hover-color)',
                          borderColor: 'var(--primary-color)',
                        }
                      }}
                      title="제품검색"
                    >
                      <SearchIcon fontSize="small" />
                    </Button>
                  </Box>
                </Grid>
                <Grid item xs={12} md={4}>
                  <TextField
                    label="제품코드"
                    value={editRow?.productCode || ''}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      handleEditChange('productCode', e.target.value)
                    }
                    onKeyDown={createKeyboardNavigationHandler({
                      currentIndex: 1,
                      totalFields: productFieldRefs.length,
                      onNavigate: handleProductKeyboardNavigation
                    })}
                    inputRef={productCodeRef}
                    fullWidth
                    size="small"
                    sx={{
                      input: { color: 'var(--text-color)' },
                      label: { color: 'var(--text-secondary-color)' },
                      '& .MuiOutlinedInput-root': {
                        '& fieldset': { borderColor: 'var(--border-color)' },
                        '&:hover fieldset': { borderColor: 'var(--primary-color)' },
                      },
                    }}
                  />
                </Grid>
                <Grid item xs={12} md={4}>
                  <FormControl
                    fullWidth
                    size="small"
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        '& fieldset': { borderColor: 'var(--border-color)' },
                        '&:hover fieldset': { borderColor: 'var(--primary-color)' },
                      },
                    }}
                  >
                    <InputLabel sx={{ color: 'var(--text-secondary-color)' }}>공간</InputLabel>
                    <Select
                      label="공간"
                      value={editRow?.space || ''}
                      onChange={(e: SelectChangeEvent) =>
                        handleEditChange('space', e.target.value)
                      }
                      sx={{
                        color: 'var(--primary-color)',
                        fontWeight: 'bold',
                        '& .MuiSelect-icon': {
                          color: 'var(--primary-color)',
                        },
                      }}
                    >
                      {spaceOptions.map((space) => (
                        <MenuItem key={space} value={space} sx={{
                          color: 'var(--text-color)',
                          backgroundColor: 'var(--background-color)',
                          '&:hover': {
                            backgroundColor: 'var(--hover-color)',
                          },
                        }}>
                          {space}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
                {editRow?.space === '직접입력' && (
                  <Grid item xs={12} md={4}>
                    <TextField
                      label="공간 직접입력"
                      value={editRow?.spaceCustom || ''}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                        setEditRow((prev: any) => ({ ...prev, spaceCustom: e.target.value }));
                      }}
                      onKeyDown={createKeyboardNavigationHandler({
                        currentIndex: 0,
                        totalFields: productFieldRefs.length,
                        onNavigate: handleProductKeyboardNavigation
                      })}
                      inputRef={productSpaceRef}
                      fullWidth
                      size="small"
                      sx={{
                        input: { color: 'var(--text-color)' },
                        label: { color: 'var(--text-secondary-color)' },
                        '& .MuiOutlinedInput-root': {
                          '& fieldset': { borderColor: 'var(--border-color)' },
                          '&:hover fieldset': { borderColor: 'var(--primary-color)' },
                        },
                      }}
                    />
                  </Grid>
                )}
                <Grid item xs={12} md={4}>
                  <TextField
                    label="가로(mm)"
                    value={editRow.widthMM ? Number(editRow.widthMM).toLocaleString() : ''}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                      const value = e.target.value;
                      handleEditChange('widthMM', value);
                    }}
                    onKeyDown={createKeyboardNavigationHandler({
                      currentIndex: 3,
                      totalFields: productFieldRefs.length,
                      onNavigate: handleProductKeyboardNavigation
                    })}
                    inputRef={productWidthRef}
                    fullWidth
                    size="small"
                    sx={{
                      input: { color: 'var(--text-color)' },
                      label: { color: 'var(--text-secondary-color)' },
                      '& .MuiOutlinedInput-root': {
                        '& fieldset': { borderColor: 'var(--border-color)' },
                        '&:hover fieldset': { borderColor: 'var(--primary-color)' },
                      },
                    }}
                  />
                </Grid>
                <Grid item xs={12} md={4}>
                  <TextField
                    label="세로(mm)"
                    value={editRow.heightMM ? Number(editRow.heightMM).toLocaleString() : ''}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                      const value = e.target.value;
                      handleEditChange('heightMM', value);
                    }}
                    onKeyDown={createKeyboardNavigationHandler({
                      currentIndex: 4,
                      totalFields: productFieldRefs.length,
                      onNavigate: handleProductKeyboardNavigation
                    })}
                    inputRef={productHeightRef}
                    fullWidth
                    size="small"
                    sx={{
                      input: { color: 'var(--text-color)' },
                      label: { color: 'var(--text-secondary-color)' },
                      '& .MuiOutlinedInput-root': {
                        '& fieldset': { borderColor: 'var(--border-color)' },
                        '&:hover fieldset': { borderColor: 'var(--primary-color)' },
                      },
                    }}
                  />
                </Grid>
                <Grid item xs={12} md={4}>
                  <TextField
                    label="수량"
                    type="number"
                    value={editRow.quantity || ''}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      handleEditChange('quantity', e.target.value)
                    }
                    onKeyDown={createKeyboardNavigationHandler({
                      currentIndex: 9,
                      totalFields: productFieldRefs.length,
                      onNavigate: handleProductKeyboardNavigation
                    })}
                    inputRef={productQuantityRef}
                    fullWidth
                    size="small"
                    sx={{
                      input: { color: 'var(--text-color)' },
                      label: { color: 'var(--text-secondary-color)' },
                      '& .MuiOutlinedInput-root': {
                        '& fieldset': { borderColor: 'var(--border-color)' },
                        '&:hover fieldset': { borderColor: 'var(--primary-color)' },
                      },
                    }}
                  />
                </Grid>
                {/* 커튼타입, 주름타입, 폭수, 주름양, 주름양(직접입력), 판매단가, 입고원가, 대폭민자단가, 대폭민자원가: 블라인드일 때 숨김 */}
                {editRow.productType !== '블라인드' && (
                  <>
                    <Grid item xs={12} md={4}>
                      <FormControl
                        fullWidth
                        size="small"
                        sx={{
                          '& .MuiOutlinedInput-root': {
                            '& fieldset': { borderColor: 'var(--border-color)' },
                            '&:hover fieldset': { borderColor: 'var(--primary-color)' },
                          },
                        }}
                      >
                        <InputLabel sx={{ color: 'var(--text-secondary-color)' }}>커튼타입</InputLabel>
                        <Select
                          label="커튼타입"
                          value={editRow.curtainType || ''}
                          onChange={(e: SelectChangeEvent) =>
                            handleEditChange('curtainType', e.target.value)
                          }
                          sx={{
                            color: 'var(--primary-color)',
                            fontWeight: 'bold',
                            '& .MuiSelect-icon': {
                              color: 'var(--primary-color)',
                            },
                          }}
                        >
                          <MenuItem value="겉커튼" sx={{
                            color: 'var(--text-color)',
                            backgroundColor: 'var(--background-color)',
                            '&:hover': {
                              backgroundColor: 'var(--hover-color)',
                            },
                          }}>겉커튼</MenuItem>
                          <MenuItem value="속커튼" sx={{
                            color: 'var(--text-color)',
                            backgroundColor: 'var(--background-color)',
                            '&:hover': {
                              backgroundColor: 'var(--hover-color)',
                            },
                          }}>속커튼</MenuItem>
                          <MenuItem value="일반" sx={{
                            color: 'var(--text-color)',
                            backgroundColor: 'var(--background-color)',
                            '&:hover': {
                              backgroundColor: 'var(--hover-color)',
                            },
                          }}>일반</MenuItem>
                        </Select>
                      </FormControl>
                    </Grid>
                    <Grid item xs={12} md={4}>
                      <FormControl
                        fullWidth
                        size="small"
                        sx={{
                          '& .MuiOutlinedInput-root': {
                            '& fieldset': { borderColor: 'var(--border-color)' },
                            '&:hover fieldset': { borderColor: 'var(--primary-color)' },
                          },
                        }}
                      >
                        <InputLabel sx={{ color: 'var(--text-secondary-color)' }}>주름타입</InputLabel>
                        <Select
                          label="주름타입"
                          value={editRow.pleatType || ''}
                          onChange={(e: SelectChangeEvent) =>
                            handleEditChange('pleatType', e.target.value)
                          }
                          sx={{
                            color: 'var(--primary-color)',
                            fontWeight: 'bold',
                            '& .MuiSelect-icon': {
                              color: 'var(--primary-color)',
                            },
                          }}
                        >
                          <MenuItem value="민자" sx={{
                            color: 'var(--text-color)',
                            backgroundColor: 'var(--background-color)',
                            '&:hover': {
                              backgroundColor: 'var(--hover-color)',
                            },
                          }}>민자</MenuItem>
                          <MenuItem value="나비" sx={{
                            color: 'var(--text-color)',
                            backgroundColor: 'var(--background-color)',
                            '&:hover': {
                              backgroundColor: 'var(--hover-color)',
                            },
                          }}>나비</MenuItem>
                          <MenuItem value="3주름" sx={{
                            color: 'var(--text-color)',
                            backgroundColor: 'var(--background-color)',
                            '&:hover': {
                              backgroundColor: 'var(--hover-color)',
                            },
                          }}>3주름</MenuItem>
                        </Select>
                      </FormControl>
                    </Grid>
                    {editRow.curtainType !== '속커튼' && (
                    <Grid item xs={12} md={4}>
                      <TextField
                        label="폭수"
                        type="number"
                        value={editRow.widthCount || ''}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                          handleEditChange('widthCount', e.target.value)
                        }
                        onKeyDown={createKeyboardNavigationHandler({
                          currentIndex: 8,
                          totalFields: productFieldRefs.length,
                          onNavigate: handleProductKeyboardNavigation
                        })}
                        inputRef={productWidthCountRef}
                        fullWidth
                        size="small"
                        sx={{
                            input: { color: 'var(--text-color)' },
                            label: { color: 'var(--text-secondary-color)' },
                          '& .MuiOutlinedInput-root': {
                              '& fieldset': { borderColor: 'var(--border-color)' },
                              '&:hover fieldset': { borderColor: 'var(--primary-color)' },
                          },
                        }}
                      />
                    </Grid>
                    )}
                    <Grid item xs={12} md={4}>
                      {editRow.curtainType === '속커튼' &&
                        editRow.pleatType === '민자' ? (
                        <FormControl
                          fullWidth
                          size="small"
                          sx={{
                            '& .MuiOutlinedInput-root': {
                              '& fieldset': { borderColor: 'var(--border-color)' },
                              '&:hover fieldset': { borderColor: 'var(--primary-color)' },
                            },
                          }}
                        >
                          <InputLabel sx={{ color: 'var(--text-secondary-color)' }}>주름양 배수</InputLabel>
                          <Select
                            label="주름양 배수"
                            value={editRow.pleatMultiplier || '1.4배'}
                            onChange={(e: SelectChangeEvent) =>
                              handleEditChange('pleatMultiplier', e.target.value)
                            }
                            sx={{
                              color: 'var(--primary-color)',
                              fontWeight: 'bold',
                              '& .MuiSelect-icon': {
                                color: 'var(--primary-color)',
                              },
                            }}
                          >
                            <MenuItem value="1.1배" sx={{
                              color: 'var(--text-color)',
                              backgroundColor: 'var(--background-color)',
                              '&:hover': {
                                backgroundColor: 'var(--hover-color)',
                              },
                            }}>1.1배</MenuItem>
                            <MenuItem value="1.2배" sx={{
                              color: 'var(--text-color)',
                              backgroundColor: 'var(--background-color)',
                              '&:hover': {
                                backgroundColor: 'var(--hover-color)',
                              },
                            }}>1.2배</MenuItem>
                            <MenuItem value="1.3배" sx={{
                              color: 'var(--text-color)',
                              backgroundColor: 'var(--background-color)',
                              '&:hover': {
                                backgroundColor: 'var(--hover-color)',
                              },
                            }}>1.3배</MenuItem>
                            <MenuItem value="1.4배" sx={{
                              color: 'var(--text-color)',
                              backgroundColor: 'var(--background-color)',
                              '&:hover': {
                                backgroundColor: 'var(--hover-color)',
                              },
                            }}>1.4배</MenuItem>
                            <MenuItem value="1.5배" sx={{
                              color: 'var(--text-color)',
                              backgroundColor: 'var(--background-color)',
                              '&:hover': {
                                backgroundColor: 'var(--hover-color)',
                              },
                            }}>1.5배</MenuItem>
                            <MenuItem value="1.6배" sx={{
                              color: 'var(--text-color)',
                              backgroundColor: 'var(--background-color)',
                              '&:hover': {
                                backgroundColor: 'var(--hover-color)',
                              },
                            }}>1.6배</MenuItem>
                            <MenuItem value="1.7배" sx={{
                              color: 'var(--text-color)',
                              backgroundColor: 'var(--background-color)',
                              '&:hover': {
                                backgroundColor: 'var(--hover-color)',
                              },
                            }}>1.7배</MenuItem>
                            <MenuItem value="1.8배" sx={{
                              color: 'var(--text-color)',
                              backgroundColor: 'var(--background-color)',
                              '&:hover': {
                                backgroundColor: 'var(--hover-color)',
                              },
                            }}>1.8배</MenuItem>
                            <MenuItem value="1.9배" sx={{
                              color: 'var(--text-color)',
                              backgroundColor: 'var(--background-color)',
                              '&:hover': {
                                backgroundColor: 'var(--hover-color)',
                              },
                            }}>1.9배</MenuItem>
                            <MenuItem value="2.0배" sx={{
                              color: 'var(--text-color)',
                              backgroundColor: 'var(--background-color)',
                              '&:hover': {
                                backgroundColor: 'var(--hover-color)',
                              },
                            }}>2.0배</MenuItem>
                          </Select>
                        </FormControl>
                      ) : (
                        <TextField
                          label="주름양"
                          type="number"
                          value={
                            editRow.pleatAmount &&
                              Number(editRow.pleatAmount) !== 0
                              ? editRow.pleatAmount
                              : ''
                          }
                          onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                            handleEditChange('pleatAmount', e.target.value)
                          }
                          fullWidth
                          size="small"
                          sx={{
                            input: { color: 'var(--text-color)' },
                            label: { color: 'var(--text-secondary-color)' },
                            '& .MuiOutlinedInput-root': {
                              '& fieldset': { borderColor: 'var(--border-color)' },
                              '&:hover fieldset': { borderColor: 'var(--primary-color)' },
                            },
                          }}
                        />
                      )}
                    </Grid>
                    {editRow.curtainType !== '속커튼' && (
                    <Grid item xs={12} md={4}>
                      <TextField
                        label="주름양(직접입력)"
                        value={editRow.pleatAmountCustom || ''}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                          handleEditChange('pleatAmountCustom', e.target.value)
                        }
                        fullWidth
                        size="small"
                        sx={{
                            input: { color: 'var(--text-color)' },
                            label: { color: 'var(--text-secondary-color)' },
                          '& .MuiOutlinedInput-root': {
                              '& fieldset': { borderColor: 'var(--border-color)' },
                              '&:hover fieldset': { borderColor: 'var(--primary-color)' },
                          },
                        }}
                      />
                    </Grid>
                    )}
                    {/* 헌터더글라스 거래처일 때만 판매금액 입력 필드 표시 */}
                    {(editRow.vendor?.includes('헌터더글라스') ||
                      editRow.vendor
                        ?.toLowerCase()
                        .includes('hunterdouglas')) && (
                        <Grid item xs={12} md={4}>
                          <TextField
                            label="판매단가"
                            type="number"
                            value={editRow.salePrice || ''}
                            onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                              handleEditChange('salePrice', e.target.value)
                            }
                            fullWidth
                            size="small"
                            sx={{
                              input: { color: 'var(--text-color)' },
                              label: { color: 'var(--text-secondary-color)' },
                              '& .MuiOutlinedInput-root': {
                                '& fieldset': { borderColor: 'var(--border-color)' },
                                '&:hover fieldset': { borderColor: 'var(--primary-color)' },
                              },
                            }}
                          />
                        </Grid>
                      )}
                  </>
                )}
                {/* 블라인드일 때 줄방향과 줄길이 필드 추가 */}
                {editRow.productType === '블라인드' && (
                  <>
                    <Grid item xs={12} md={4}>
                      <FormControl
                        fullWidth
                        size="small"
                        sx={{
                          '& .MuiOutlinedInput-root': {
                            '& fieldset': { borderColor: 'var(--border-color)' },
                            '&:hover fieldset': { borderColor: 'var(--primary-color)' },
                          },
                        }}
                      >
                        <InputLabel sx={{ color: 'var(--text-secondary-color)' }}>줄방향</InputLabel>
                        <Select
                          label="줄방향"
                          value={editRow.lineDirection || ''}
                          onChange={(e: SelectChangeEvent) =>
                            handleEditChange('lineDirection', e.target.value)
                          }
                          sx={{
                            color: 'var(--primary-color)',
                            fontWeight: 'bold',
                            '& .MuiSelect-icon': {
                              color: 'var(--primary-color)',
                            },
                          }}
                        >
                          <MenuItem value="좌" sx={{
                            color: 'var(--text-color)',
                            backgroundColor: 'var(--background-color)',
                            '&:hover': {
                              backgroundColor: 'var(--hover-color)',
                            },
                          }}>좌</MenuItem>
                          <MenuItem value="우" sx={{
                            color: 'var(--text-color)',
                            backgroundColor: 'var(--background-color)',
                            '&:hover': {
                              backgroundColor: 'var(--hover-color)',
                            },
                          }}>우</MenuItem>
                          <MenuItem value="없음" sx={{
                            color: 'var(--text-color)',
                            backgroundColor: 'var(--background-color)',
                            '&:hover': {
                              backgroundColor: 'var(--hover-color)',
                            },
                          }}>없음</MenuItem>
                        </Select>
                      </FormControl>
                    </Grid>
                    <Grid item xs={12} md={4}>
                      <FormControl
                        fullWidth
                        size="small"
                        sx={{
                          '& .MuiOutlinedInput-root': {
                            '& fieldset': { borderColor: 'var(--border-color)' },
                            '&:hover fieldset': { borderColor: 'var(--primary-color)' },
                          },
                        }}
                      >
                        <InputLabel sx={{ color: 'var(--text-secondary-color)' }}>줄길이</InputLabel>
                        <Select
                          label="줄길이"
                          value={editRow.lineLength || ''}
                          onChange={(e: SelectChangeEvent) =>
                            handleEditChange('lineLength', e.target.value)
                          }
                          sx={{
                            color: 'var(--primary-color)',
                            fontWeight: 'bold',
                            '& .MuiSelect-icon': {
                              color: 'var(--primary-color)',
                            },
                          }}
                        >
                          <MenuItem value="90cm" sx={{
                            color: 'var(--text-color)',
                            backgroundColor: 'var(--background-color)',
                            '&:hover': {
                              backgroundColor: 'var(--hover-color)',
                            },
                          }}>90cm</MenuItem>
                          <MenuItem value="120cm" sx={{
                            color: 'var(--text-color)',
                            backgroundColor: 'var(--background-color)',
                            '&:hover': {
                              backgroundColor: 'var(--hover-color)',
                            },
                          }}>120cm</MenuItem>
                          <MenuItem value="150cm" sx={{
                            color: 'var(--text-color)',
                            backgroundColor: 'var(--background-color)',
                            '&:hover': {
                              backgroundColor: 'var(--hover-color)',
                            },
                          }}>150cm</MenuItem>
                          <MenuItem value="180cm" sx={{
                            color: 'var(--text-color)',
                            backgroundColor: 'var(--background-color)',
                            '&:hover': {
                              backgroundColor: 'var(--hover-color)',
                            },
                          }}>180cm</MenuItem>
                          <MenuItem value="210cm" sx={{
                            color: 'var(--text-color)',
                            backgroundColor: 'var(--background-color)',
                            '&:hover': {
                              backgroundColor: 'var(--hover-color)',
                            },
                          }}>210cm</MenuItem>
                          <MenuItem value="직접입력" sx={{
                            color: 'var(--text-color)',
                            backgroundColor: 'var(--background-color)',
                            '&:hover': {
                              backgroundColor: 'var(--hover-color)',
                            },
                          }}>직접입력</MenuItem>
                        </Select>
                      </FormControl>
                    </Grid>
                    {editRow.lineLength === '직접입력' && (
                      <Grid item xs={12} md={4}>
                        <TextField
                          label="줄길이 직접입력"
                          value={editRow.customLineLength || ''}
                          onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                            setEditRow((prev: any) => ({ ...prev, customLineLength: e.target.value }));
                          }}
                          fullWidth
                          size="small"
                          sx={{
                            input: { color: 'var(--text-color)' },
                            label: { color: 'var(--text-secondary-color)' },
                            '& .MuiOutlinedInput-root': {
                              '& fieldset': { borderColor: 'var(--border-color)' },
                              '&:hover fieldset': { borderColor: 'var(--primary-color)' },
                            },
                          }}
                        />
                      </Grid>
                    )}
                  </>
                )}
                <Grid item xs={12}>
                  <TextField
                    label="세부내용"
                    value={editRow.details || ''}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                      handleDetailsChange(e.target.value);
                    }}
                    onKeyDown={createKeyboardNavigationHandler({
                      currentIndex: 2,
                      totalFields: productFieldRefs.length,
                      onNavigate: handleProductKeyboardNavigation
                    })}
                    inputRef={productDetailsRef}
                    fullWidth
                    size="small"
                    multiline
                    rows={2}
                    sx={{
                      input: { color: 'var(--text-color)' },
                      label: { color: 'var(--text-secondary-color)' },
                      '& .MuiOutlinedInput-root': {
                        '& fieldset': { borderColor: 'var(--border-color)' },
                        '&:hover fieldset': { borderColor: 'var(--primary-color)' },
                      },
                    }}
                  />
                </Grid>
                {recommendedPleatCount > 0 && 
                  isFinite(recommendedPleatCount) &&
                  editRow.productType !== '블라인드' &&
                  !(editRow.curtainType === '속커튼' && editRow.pleatType === '민자') && (
                    <Grid item xs={12}>
                      <Box
                        sx={{
                          p: 2,
                          backgroundColor: 'var(--info-bg-color)',
                          borderRadius: 1,
                          border: '1px solid var(--info-color)',
                          color: 'var(--info-color)',
                        }}
                      >
                        <Typography
                          variant="subtitle2"
                          sx={{ fontWeight: 'bold', mb: 1 }}
                        >
                          추천 폭수: {recommendedPleatCount}폭
                        </Typography>
                        <Typography variant="body2" sx={{ color: 'var(--text-secondary-color)' }}>
                          가로 {editRow.widthMM}mm, 제품명 {editRow.productName}{' '}
                          기준으로 계산된 추천 폭수입니다.
                        </Typography>
                      </Box>
                    </Grid>
                  )}
                                {recommendedPleatAmount && 
                  !(editRow.curtainType === '속커튼' && editRow.pleatType === '민자') && (
                    <Grid item xs={12}>
                      <Box
                        sx={{
                          p: 2,
                          backgroundColor: 'var(--warning-bg-color)',
                          borderRadius: 1,
                          border: '1px solid var(--warning-color)',
                          color: 'var(--warning-color)',
                        }}
                      >
                        <Typography
                          variant="subtitle2"
                          sx={{ fontWeight: 'bold', mb: 1 }}
                        >
                          추천 주름양: {recommendedPleatAmount}배
                        </Typography>
                        <Typography variant="body2" sx={{ color: 'var(--text-secondary-color)' }}>
                          가로 {editRow.widthMM}mm, 제품명 {editRow.productName}, 폭수 {recommendedPleatCount}폭{' '}
                          기준으로 계산된 추천 주름양입니다.
                        </Typography>
                      </Box>
                    </Grid>
                  )}
              </Grid>
            </Box>
          </DialogContent>
          <DialogActions sx={{ 
            backgroundColor: 'var(--surface-color)', 
            padding: '16px 24px',
            borderTop: '1px solid var(--border-color)'
          }}>
            <Button 
              onClick={handleEditClose} 
              sx={{ 
                color: 'var(--text-secondary-color)',
                '&:hover': {
                  backgroundColor: 'var(--hover-color)',
                }
              }}
            >
              취소
            </Button>
            <Button
              onClick={handleEditSave}
              variant="contained"
              sx={{
                backgroundColor: 'var(--primary-color)',
                color: 'var(--on-primary-color)',
                '&:hover': { 
                  backgroundColor: 'var(--primary-color-dark)',
                },
              }}
            >
              저장
            </Button>
          </DialogActions>
        </Dialog>
      )}
      <Grid container spacing={2}>
        {/* 견적서 탭 */}
        <Grid item xs={12}>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 0, pb: 0 }}>
            <Tabs
              value={activeTab}
              onChange={(e: React.SyntheticEvent, v: number) => setActiveTab(v)}
              variant="scrollable"
              scrollButtons="auto"
              sx={{
                backgroundColor: 'var(--surface-color)',
                color: 'var(--text-color)',
                borderRadius: 1,
                flex: 1,
                '& .MuiTab-root': {
                  color: 'var(--text-color)',
                  '&.Mui-selected': {
                    color: 'var(--primary-color)',
                    fontWeight: 'bold',
                  },
                },
                '& .MuiTabs-indicator': {
                  backgroundColor: 'var(--primary-color)',
                },
              }}
            >
              {estimates.map((estimate, idx) => (
                <Tab
                  key={estimate.id}
                  label={generateEstimateTabText(estimate)}
                  sx={{ minWidth: 120 }}
                />
              ))}
              <Tab
                icon={<AddIcon />}
                aria-label="새 견적서"
                onClick={addEstimate}
                sx={{ minWidth: 48 }}
              />
            </Tabs>
            {/* 탭별 초기화/삭제 버튼: activeTab에만 노출 */}
            <Box sx={{ display: 'flex', alignItems: 'center', ml: 1 }}>
              <IconButton
                onClick={() => {
                  if (
                    window.confirm(
                      '이 견적서를 초기화하시겠습니까? 모든 입력 내용이 삭제됩니다.'
                    )
                  ) {
                    handleResetEstimate(activeTab);
                  }
                }}
                sx={{ color: 'var(--primary-color)' }}
                title="초기화"
              >
                <ResetIcon fontSize="small" />
              </IconButton>
              <IconButton
                onClick={() => {
                  if (estimates.length === 1) {
                    if (
                      window.confirm(
                        '견적서를 초기화하시겠습니까?\n모든 입력 내용이 삭제됩니다.'
                      )
                    ) {
                      removeEstimate(activeTab);
                    }
                  } else {
                    if (window.confirm('이 견적서를 삭제하시겠습니까?')) {
                      removeEstimate(activeTab);
                    }
                  }
                }}
                sx={{ color: '#ff6b6b', ml: 1 }}
                title="삭제"
              >
                <DeleteIcon fontSize="small" />
              </IconButton>
              <IconButton
                onClick={() => setEstimateTabSettingsOpen(true)}
                sx={{ ml: 1, color: 'var(--text-color)' }}
                title="견적서 탭 표시 설정"
              >
                <ArrowDownIcon />
              </IconButton>
              <IconButton
                onClick={handleOpenSpaceSettings}
                sx={{ ml: 1, color: 'var(--text-color)' }}
                title="공간 설정"
              >
                <EditIcon />
              </IconButton>
            </Box>
          </Box>
        </Grid>

        {/* 견적서 내용 */}
        <Grid item xs={12}>
          <Paper sx={{ p: 2, pt: 0, backgroundColor: 'var(--surface-color)' }}>
            {/* 일괄 변경 모드 컨트롤 */}
            <Box sx={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: 2, 
              mb: 2, 
              p: 1, 
              backgroundColor: isBulkEditMode ? 'rgba(255, 193, 7, 0.1)' : 'transparent',
              border: isBulkEditMode ? '1px solid #ffc107' : 'none',
              borderRadius: 1
            }}>
                {/* 저장하기 아이콘 제거 요청에 따라 삭제 */}
                {/* 새이름저장 아이콘 */}
                
                <Tooltip title="빈 제품 행 추가">
                  <IconButton
                    size="medium"
                    color="primary"
                    onClick={handleAddEmptyProductRow}
                    sx={{
                      '&:hover': {
                        backgroundColor: 'rgba(25, 118, 210, 0.1)',
                      }
                    }}
                  >
                    <AddIcon fontSize="medium" />
                  </IconButton>
                </Tooltip>
                <Button
                  variant="outlined"
                  size="small"
                  color="primary"
                  sx={{ minWidth: 120, fontSize: 13, py: 0.5, px: 1.5 }}
                  onClick={() => setProductDialogOpen(true)}
                >
                  제품 검색
                </Button>
                <Button
                  variant="outlined"
                  size="small"
                  color="secondary"
                  sx={{ minWidth: 80, fontSize: 13, py: 0.5, px: 1.5 }}
                  onClick={handleOpenOptionDialog}
                  title={(estimates[activeTab]?.rows || []).filter(row => row && row.type === 'product').length === 0 ? '제품을 먼저 선택해주세요' : '옵션 추가'}
                >
                  옵션추가
                </Button>
                <Button
                  variant="outlined"
                  size="small"
                  color="warning"
                  sx={{ minWidth: 80, fontSize: 13, py: 0.5, px: 1.5 }}
                  onClick={handleAddRailOption}
                >
                  레일추가
                </Button>
                <Button
                  variant="outlined"
                  size="small"
                  sx={{ 
                    minWidth: 40, 
                    height: 32, 
                    border: '1px solid var(--border-color)',
                    color: 'var(--text-color)',
                    padding: '4px',
                    '&:hover': {
                      backgroundColor: 'var(--hover-color)',
                      borderColor: 'var(--primary-color)',
                    }
                  }}
                  onClick={() => setFilterModalOpen(true)}
                  title="필터"
                >
                  <SettingsIcon fontSize="small" />
                </Button>
                <Button
                  variant="outlined"
                  size="small"
                  sx={{ 
                    minWidth: 40, 
                    height: 32, 
                    border: '1px solid var(--border-color)',
                    color: 'var(--text-color)',
                    padding: '4px',
                    '&:hover': {
                      backgroundColor: 'var(--hover-color)',
                      borderColor: 'var(--primary-color)',
                    }
                  }}
                  onClick={handleOutputClick}
                  title="출력하기"
                >
                  <PrintIcon fontSize="small" />
                </Button>
                <Button
                  variant={isBulkEditMode ? 'contained' : 'outlined'}
                  color={isBulkEditMode ? 'warning' : 'primary'}
                  size="small"
                  sx={{ 
                    minWidth: 40, 
                    height: 32,
                    padding: '4px',
                    ...(isBulkEditMode ? {
                      backgroundColor: 'var(--warning-color)',
                      color: '#fff',
                      '&:hover': {
                        backgroundColor: 'var(--warning-color-dark)',
                      }
                    } : {
                      border: '1px solid var(--border-color)',
                      color: 'var(--text-color)',
                      '&:hover': {
                        backgroundColor: 'var(--hover-color)',
                        borderColor: 'var(--primary-color)',
                      }
                    })
                  }}
                  onClick={handleBulkEditModeToggle}
                  title={isBulkEditMode ? '일괄 변경 모드 종료' : '일괄 변경 모드'}
                >
                  <EditNoteIcon fontSize="small" />
                </Button>
                <Button
                  variant="outlined"
                  size="small"
                  sx={{ 
                    minWidth: 40, 
                    height: 32, 
                    border: '1px solid var(--border-color)',
                    color: 'var(--text-color)',
                    padding: '4px',
                    '&:hover': {
                      backgroundColor: 'var(--hover-color)',
                      borderColor: 'var(--primary-color)',
                    }
                  }}
                  onClick={handleSaveEstimate}
                  title="저장하기"
                >
                  <SaveIcon fontSize="small" />
                </Button>
                {/* 새이름저장 아이콘: 저장하기 버튼 바로 옆 */}
                <Tooltip title="새이름저장">
                  <IconButton
                    size="small"
                    onClick={handleSaveAsNewEstimate}
                    sx={{ 
                      ml: 1,
                      color: 'var(--warning-color, #ed6c02)',
                      border: '1px solid var(--border-color)',
                      '&:hover': {
                        backgroundColor: 'rgba(237, 108, 2, 0.1)',
                        borderColor: 'var(--warning-color)',
                      },
                    }}
                  >
                    <Box sx={{ position: 'relative', display: 'inline-flex' }}>
                      <SaveIcon fontSize="small" />
                      <Typography
                        variant="caption"
                        sx={{
                          position: 'absolute',
                          top: '-2px',
                          right: '-2px',
                          fontSize: '0.6rem',
                          fontWeight: 'bold',
                          color: 'var(--warning-color, #ed6c02)',
                          backgroundColor: 'white',
                          borderRadius: '50%',
                          width: '12px',
                          height: '12px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          border: '1px solid var(--warning-color, #ed6c02)',
                        }}
                      >
                        N
                      </Typography>
                    </Box>
                  </IconButton>
                </Tooltip>
                
                {isBulkEditMode && (
                  <>
                    <Button
                      variant="outlined"
                      color="secondary"
                      onClick={handleSelectAllRowsForBulkEdit}
                      size="small"
                    >
                      전체 선택
                    </Button>
                    <Typography variant="body2" color="text.secondary">
                      선택된 행: {selectedRowsForBulkEdit.size}개
                    </Typography>
                    <Button
                      variant="contained"
                      color="success"
                      onClick={handleBulkEditProductSelection}
                      disabled={selectedRowsForBulkEdit.size === 0}
                      size="small"
                    >
                      제품 변경
                    </Button>
                  </>
                )}
              </Box>
            {(() => {
              return estimates[activeTab]?.rows.length > 0 ? (
                <TableContainer sx={{
                  backgroundColor: 'var(--surface-color)', 
                  borderRadius: 1,
                  // 테이블 전체 줄간격 줄이기
                  '& .MuiTable-root': {
                    borderCollapse: 'collapse',
                  },
                  '& .MuiTableRow-root': {
                    height: 'auto', // 자동 높이로 줄간격 최적화
                  },
                    '& .MuiTableCell-root': {
                    borderBottom: '1px solid rgba(224, 224, 224, 1)',
                    verticalAlign: 'middle',
                      borderColor: 'var(--border-color)',
                    }
                  }}>
                  <Table size="small">
                    <TableHead>
                      <TableRow sx={{
                        backgroundColor: 'var(--surface-color)', 
                        borderBottom: '2px solid var(--border-color)',
                        // 헤더 줄간격 줄이기
                        '& .MuiTableCell-root': {
                          padding: '6px 8px', // 헤더는 약간 더 여유있게
                          lineHeight: 1.2,
                          fontWeight: 'bold',
                        }
                      }}>
                        {isBulkEditMode && (
                          <TableCell sx={{ 
                            color: 'var(--text-color)', 
                            fontWeight: 'bold', 
                            width: 50, 
                            textShadow: '0 1px 2px rgba(0,0,0,0.1)'
                          }}>
                            <Checkbox
                              checked={selectedRowsForBulkEdit.size === filteredRows.filter(row => row.type === 'product').length}
                              indeterminate={selectedRowsForBulkEdit.size > 0 && selectedRowsForBulkEdit.size < filteredRows.filter(row => row.type === 'product').length}
                              onChange={handleSelectAllRowsForBulkEdit}
                              size="small"
                            />
                          </TableCell>
                        )}
                        <TableCell sx={{ 
                          color: 'var(--text-color)', 
                          fontWeight: 'bold', 
                          textShadow: '0 1px 2px rgba(0,0,0,0.1)'
                        }}>순번</TableCell>
                        {FILTER_FIELDS.map(
                          field =>
                            columnVisibility[field.key] && (
                              <TableCell key={field.key} sx={{ 
                                color: 'var(--text-color)', 
                                fontWeight: 'bold', 
                                textShadow: '0 1px 2px rgba(0,0,0,0.1)'
                              }}>
                                {field.label}
                              </TableCell>
                            )
                        )}
                        <TableCell sx={{ 
                          color: 'var(--text-color)', 
                          fontWeight: 'bold', 
                          textShadow: '0 1px 2px rgba(0,0,0,0.1)'
                        }}>작업</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody sx={{ 
                      color: 'var(--text-color)', 
                      backgroundColor: 'var(--background-color)'
                    }}>
                      {filteredRows.map((row, idx) => {
                        const isProduct = row.type === 'product';
                        const isRail = row.optionLabel === '레일';
                        const nonMonetaryFields = FILTER_FIELDS.filter(
                          f =>
                            ![
                              'totalPrice',
                              'salePrice',
                              'cost',
                              'purchaseCost',
                              'margin',
                            ].includes(f.key)
                        );
                        const monetaryFields = FILTER_FIELDS.filter(f =>
                          [
                            'totalPrice',
                            'salePrice',
                            'cost',
                            'purchaseCost',
                            'margin',
                          ].includes(f.key)
                        );
                        const visibleNonMonetaryCount =
                          nonMonetaryFields.filter(
                            f => columnVisibility[f.key]
                          ).length;

                        if (isProduct) {
                          return (
                            <TableRow
                              key={`product-${row.id || 'no-id'}-${idx}-${row.productName || 'unnamed'}-${row.space || 'no-space'}`}
                              sx={{
                                backgroundColor:
                                  selectedProductIdx === idx
                                    ? 'rgba(25, 118, 210, 0.23)' // 23% 투명도로 선택 색상
                                    : selectedRowsForBulkEdit.has(idx)
                                    ? 'rgba(255, 193, 7, 0.3)'
                                    : getSpaceColor(row.space),
                                fontSize: row && row.type === 'option' ? 'inherit' : 'calc(1em - 0.3px)', // 제품행만 0.3px 작게
                                cursor: 'pointer',
                                transition: 'background 0.2s',
                                // 줄간격 줄이기 위한 padding 설정
                                '& .MuiTableCell-root': {
                                  padding: '4px 8px', // 기존 기본값보다 줄임
                                  lineHeight: 1.2, // 줄간격 줄임
                                },
                                '&:hover': {
                                  backgroundColor: isBulkEditMode 
                                    ? 'rgba(255, 193, 7, 0.1)' 
                                    : 'rgba(25, 118, 210, 0.05)'
                                }
                              }}
                              onClick={() => {
                                if (isBulkEditMode) {
                                  handleRowSelectionForBulkEdit(idx);
                                } else {
                                  handleProductRowClick(idx);
                                }
                              }}
                              onDoubleClick={() => handleRowClick(idx)}
                              onContextMenu={(e) => {
                                e.preventDefault();
                                handleRowContextMenu(e, idx, row);
                              }}
                            >
                              {isBulkEditMode && (
                                <TableCell sx={{ width: 50 }}>
                                  <Checkbox
                                    checked={selectedRowsForBulkEdit.has(idx)}
                                    onChange={() => handleRowSelectionForBulkEdit(idx)}
                                    size="small"
                                    onClick={(e) => e.stopPropagation()}
                                  />
                                </TableCell>
                              )}
                              <TableCell
                                sx={{ 
                                  fontWeight: 'bold', 
                                  fontSize: 'calc(1em - 0.3px)', // 주문서와 동일한 크기
                                  color: 'var(--text-color)',
                                  textShadow: '0 1px 2px rgba(0,0,0,0.1)',
                                  textAlign: 'center'
                                }}
                              >
                                {(() => {
                                  const productNumber = getProductNumber(row);
                                  if (productNumber === null) return '';
                                  
                                  const productRows = estimates[activeTab]?.rows?.filter(r => r && r.type === 'product') || [];
                                  const canMoveUp = productNumber > 1;
                                  const canMoveDown = productNumber < productRows.length;
                                  
                                  console.log('productNumber:', productNumber, 'productRows.length:', productRows.length, 'canMoveDown:', canMoveDown);
                                  
                                  return (
                                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 0.5 }}>
                                      <IconButton
                                        size="small"
                                        onMouseDown={(e) => {
                                          e.preventDefault();
                                          e.stopPropagation();
                                          e.nativeEvent.stopImmediatePropagation();
                                          if (canMoveUp) {
                                            moveProductUp(productNumber - 1);
                                          }
                                        }}
                                        onClick={(e) => {
                                          e.preventDefault();
                                          e.stopPropagation();
                                          e.nativeEvent.stopImmediatePropagation();
                                          if (canMoveUp) {
                                            moveProductUp(productNumber - 1);
                                          }
                                        }}
                                        disabled={!canMoveUp}
                                        sx={{ 
                                          padding: '2px',
                                          color: canMoveUp ? 'var(--primary-color)' : 'var(--text-color)',
                                          opacity: canMoveUp ? 1 : 0.3,
                                          '&:active': {
                                            transform: 'scale(0.95)',
                                            transition: 'transform 0.1s'
                                          }
                                        }}
                                        title="위로 이동"
                                      >
                                        <ArrowUpIcon fontSize="small" />
                                      </IconButton>
                                      <Typography
                                        variant="body2"
                                        sx={{
                                          fontWeight: 'bold',
                                          minWidth: '20px',
                                          textAlign: 'center',
                                          color: 'var(--text-color)',
                                          textShadow: '0 1px 2px rgba(0,0,0,0.2)'
                                        }}
                                      >
                                        {productNumber}
                                      </Typography>
                                      <IconButton
                                        size="small"
                                        onMouseDown={(e) => {
                                          e.preventDefault();
                                          e.stopPropagation();
                                          e.nativeEvent.stopImmediatePropagation();
                                          if (canMoveDown) {
                                            moveProductDown(productNumber - 1);
                                          }
                                        }}
                                        onClick={(e) => {
                                          e.preventDefault();
                                          e.stopPropagation();
                                          e.nativeEvent.stopImmediatePropagation();
                                          if (canMoveDown) {
                                            moveProductDown(productNumber - 1);
                                          }
                                        }}
                                        disabled={!canMoveDown}
                                        sx={{ 
                                          padding: '2px',
                                          color: canMoveDown ? 'var(--primary-color)' : 'var(--text-color)',
                                          opacity: canMoveDown ? 1 : 0.3,
                                          '&:active': {
                                            transform: 'scale(0.95)',
                                            transition: 'transform 0.1s'
                                          }
                                        }}
                                        title="아래로 이동"
                                      >
                                        <ArrowDownIcon fontSize="small" />
                                      </IconButton>
                                    </Box>
                                  );
                                })()}
                              </TableCell>
                              {FILTER_FIELDS.map(
                                field =>
                                  columnVisibility[field.key] && (
                                    <TableCell
                                      key={field.key}
                                      sx={{ 
                                        fontSize: 'calc(1em - 0.3px)', // 주문서와 동일한 크기
                                        color: 'var(--text-color)',
                                        textShadow: '0 1px 2px rgba(0,0,0,0.1)',
                                        whiteSpace: 'nowrap', // 줄바꿈 방지
                                        overflow: 'hidden',
                                        textOverflow: 'ellipsis',
                                        cursor: (() => {
                                          const editableFields = ['space', 'productCode', 'details', 'widthMM', 'heightMM', 'curtainType', 'pleatType', 'lineDir', 'lineLen', 'widthCount', 'quantity', 'area'];
                                          return editableFields.includes(field.key) ? 'pointer' : 'default';
                                        })()
                                      }}
                                      onClick={() => {
                                        // 편집 가능한 필드만 인필드 편집 허용
                                        const editableFields = ['space', 'productCode', 'details', 'widthMM', 'heightMM', 'curtainType', 'pleatType', 'lineDir', 'lineLen', 'widthCount', 'quantity', 'area'];
                                        if (editableFields.includes(field.key) && !(editingCell && editingCell.rowIndex === idx && editingCell.field === field.key)) {
                                          setEditingCell({ rowIndex: idx, field: field.key });
                                          setEditingValue(getRowValue(row, field.key) || '');
                                        }
                                      }}
                                    >
                                      {editingCell?.rowIndex === idx && editingCell?.field === field.key ? (
                                        (() => {
                                          // 드롭다운이 필요한 필드들
                                          if (field.key === 'curtainType') {
                                            return (
                                              <TextField
                                                select
                                                value={editingValue}
                                                onChange={e => setEditingValue(e.target.value)}
                                                onBlur={() => handleCellEdit(idx, field.key, editingValue)}
                                                onKeyDown={e => {
                                                  if (e.key === 'Tab') {
                                                    e.preventDefault();
                                                    if (e.shiftKey) {
                                                      handleTableCellKeyboardNavigation(idx, field.key, 'prev');
                                                    } else {
                                                      handleTableCellKeyboardNavigation(idx, field.key, 'next');
                                                    }
                                                  } else if (e.key === 'ArrowDown') {
                                                    e.preventDefault();
                                                    handleTableCellKeyboardNavigation(idx, field.key, 'down');
                                                  } else if (e.key === 'ArrowUp') {
                                                    e.preventDefault();
                                                    handleTableCellKeyboardNavigation(idx, field.key, 'up');
                                                  } else if (e.key === 'Enter') {
                                                    e.preventDefault();
                                                    // 엔터 시 현재 값 저장 후 다음 셀로 이동
                                                    handleCellEdit(idx, field.key, editingValue);
                                                    handleTableCellKeyboardNavigation(idx, field.key, 'next');
                                                  } else if (e.key === 'Escape') {
                                                    handleCellCancel();
                                                  }
                                                }}
                                                size="small"
                                                autoFocus
                                                sx={{
                                                  '& .MuiInputBase-input': {
                                                    color: 'var(--text-color) !important',
                                                  },
                                                  '& .MuiSelect-select': {
                                                    color: 'var(--text-color) !important',
                                                  }
                                                }}
                                              >
                                                {curtainTypeOptions.map((option) => (
                                                  <MenuItem key={option} value={option} sx={{ color: 'var(--text-color) !important' }}>
                                                    {option}
                                                  </MenuItem>
                                                ))}
                                              </TextField>
                                            );
                                          } else if (field.key === 'pleatType') {
                                            return (
                                              <TextField
                                                select
                                                value={editingValue}
                                                onChange={e => setEditingValue(e.target.value)}
                                                onBlur={() => handleCellEdit(idx, field.key, editingValue)}
                                                onKeyDown={e => {
                                                  if (e.key === 'Tab') {
                                                    e.preventDefault();
                                                    if (e.shiftKey) {
                                                      handleTableCellKeyboardNavigation(idx, field.key, 'prev');
                                                    } else {
                                                      handleTableCellKeyboardNavigation(idx, field.key, 'next');
                                                    }
                                                  } else if (e.key === 'ArrowDown') {
                                                    e.preventDefault();
                                                    handleTableCellKeyboardNavigation(idx, field.key, 'down');
                                                  } else if (e.key === 'ArrowUp') {
                                                    e.preventDefault();
                                                    handleTableCellKeyboardNavigation(idx, field.key, 'up');
                                                  } else if (e.key === 'Enter') {
                                                    e.preventDefault();
                                                    handleTableCellKeyboardNavigation(idx, field.key, 'next');
                                                  } else if (e.key === 'Escape') {
                                                    handleCellCancel();
                                                  }
                                                }}
                                                size="small"
                                                autoFocus
                                                sx={{
                                                  '& .MuiInputBase-input': {
                                                    color: 'var(--text-color) !important',
                                                  },
                                                  '& .MuiSelect-select': {
                                                    color: 'var(--text-color) !important',
                                                  }
                                                }}
                                              >
                                                {pleatTypeOptions.map((option) => (
                                                  <MenuItem key={option} value={option} sx={{ color: 'var(--text-color) !important' }}>
                                                    {option}
                                                  </MenuItem>
                                                ))}
                                              </TextField>
                                            );
                                          } else if (field.key === 'lineDir') {
                                            return (
                                              <TextField
                                                select
                                                value={editingValue}
                                                onChange={e => setEditingValue(e.target.value)}
                                                onBlur={() => handleCellEdit(idx, field.key, editingValue)}
                                                onKeyDown={e => {
                                                  if (e.key === 'Tab') {
                                                    e.preventDefault();
                                                    if (e.shiftKey) {
                                                      handleTableCellKeyboardNavigation(idx, field.key, 'prev');
                                                    } else {
                                                      handleTableCellKeyboardNavigation(idx, field.key, 'next');
                                                    }
                                                  } else if (e.key === 'ArrowDown') {
                                                    e.preventDefault();
                                                    handleTableCellKeyboardNavigation(idx, field.key, 'down');
                                                  } else if (e.key === 'ArrowUp') {
                                                    e.preventDefault();
                                                    handleTableCellKeyboardNavigation(idx, field.key, 'up');
                                                  } else if (e.key === 'Enter') {
                                                    e.preventDefault();
                                                    handleTableCellKeyboardNavigation(idx, field.key, 'next');
                                                  } else if (e.key === 'Escape') {
                                                    handleCellCancel();
                                                  }
                                                }}
                                                size="small"
                                                autoFocus
                                                sx={{
                                                  '& .MuiInputBase-input': {
                                                    color: 'var(--text-color) !important',
                                                  },
                                                  '& .MuiSelect-select': {
                                                    color: 'var(--text-color) !important',
                                                  }
                                                }}
                                              >
                                                {lineDirectionOptions.map((option) => (
                                                  <MenuItem key={option} value={option} sx={{ color: 'var(--text-color) !important' }}>
                                                    {option}
                                                  </MenuItem>
                                                ))}
                                              </TextField>
                                            );
                                          } else if (field.key === 'lineLen') {
                                            return (
                                              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                                                <TextField
                                                  select
                                                  value={editingValue}
                                                  onChange={e => setEditingValue(e.target.value)}
                                                  onBlur={() => handleCellEdit(idx, field.key, editingValue)}
                                                  onKeyDown={e => {
                                                    if (e.key === 'Enter') handleCellEdit(idx, field.key, editingValue);
                                                    if (e.key === 'Escape') handleCellCancel();
                                                  }}
                                                  size="small"
                                                  autoFocus
                                                  sx={{
                                                    '& .MuiInputBase-input': {
                                                      color: 'var(--text-color) !important',
                                                    },
                                                    '& .MuiSelect-select': {
                                                      color: 'var(--text-color) !important',
                                                    }
                                                  }}
                                                >
                                                  {lineLengthOptions.map((option) => (
                                                    <MenuItem key={option} value={option} sx={{ color: 'var(--text-color) !important' }}>
                                                      {option}
                                                    </MenuItem>
                                                  ))}
                                                </TextField>
                                                {editingValue === '직접입력' && (
                                                  <TextField
                                                    value={editingCustomValue}
                                                    onChange={e => setEditingCustomValue(e.target.value)}
                                                    onBlur={() => {
                                                      const currentRows = estimates[activeTab]?.rows || [];
                                                      const updatedRows = [...currentRows];
                                                      if (updatedRows[idx]) {
                                                        updatedRows[idx] = { 
                                                          ...updatedRows[idx], 
                                                          lineLen: '직접입력',
                                                          customLineLength: editingCustomValue 
                                                        };
                                                        updateEstimateRows(activeTab, updatedRows);
                                                      }
                                                      setEditingCell(null);
                                                      setEditingValue('');
                                                      setEditingCustomValue('');
                                                    }}
                                                    onKeyDown={e => {
                                                      if (e.key === 'Enter') {
                                                        const currentRows = estimates[activeTab]?.rows || [];
                                                        const updatedRows = [...currentRows];
                                                        if (updatedRows[idx]) {
                                                          updatedRows[idx] = { 
                                                            ...updatedRows[idx], 
                                                            lineLen: '직접입력',
                                                            customLineLength: editingCustomValue 
                                                          };
                                                          updateEstimateRows(activeTab, updatedRows);
                                                        }
                                                        setEditingCell(null);
                                                        setEditingValue('');
                                                        setEditingCustomValue('');
                                                      }
                                                      if (e.key === 'Escape') {
                                                        setEditingCell(null);
                                                        setEditingValue('');
                                                        setEditingCustomValue('');
                                                      }
                                                    }}
                                                    size="small"
                                                    placeholder="직접 입력"
                                                  />
                                                )}
                                              </Box>
                                            );
                                          } else {
                                            return (
                                              <TextField
                                                value={editingValue}
                                                onChange={e => setEditingValue(e.target.value)}
                                                onBlur={() => handleCellEdit(idx, field.key, editingValue)}
                                                onKeyDown={e => {
                                                  if (e.key === 'Tab') {
                                                    e.preventDefault();
                                                    if (e.shiftKey) {
                                                      handleTableCellKeyboardNavigation(idx, field.key, 'prev');
                                                    } else {
                                                      handleTableCellKeyboardNavigation(idx, field.key, 'next');
                                                    }
                                                  } else if (e.key === 'ArrowDown') {
                                                    e.preventDefault();
                                                    handleTableCellKeyboardNavigation(idx, field.key, 'down');
                                                  } else if (e.key === 'ArrowUp') {
                                                    e.preventDefault();
                                                    handleTableCellKeyboardNavigation(idx, field.key, 'up');
                                                  } else if (e.key === 'Enter') {
                                                    e.preventDefault();
                                                    handleTableCellKeyboardNavigation(idx, field.key, 'next');
                                                  } else if (e.key === 'Escape') {
                                                    handleCellCancel();
                                                  }
                                                }}
                                                size="small"
                                                autoFocus
                                                inputProps={{
                                                  style: {
                                                    width: field.key === 'widthMM' || field.key === 'heightMM' ? 
                                                      `${calculateInputWidth(editingValue, 40, 80)}px` :
                                                      field.key === 'area' ? 
                                                        `${calculateInputWidth(editingValue, 25, 60)}px` :
                                                        field.key === 'lineDir' || field.key === 'lineLen' ? 
                                                          `${calculateInputWidth(editingValue, 30, 60)}px` :
                                                          field.key === 'widthCount' || field.key === 'quantity' ? 
                                                            `${calculateInputWidth(editingValue, 30, 60)}px` :
                                                            field.key === 'details' ?
                                                              `${calculateInputWidth(editingValue, 130, 230)}px` :
                                                              `${calculateInputWidth(editingValue, 50, 120)}px`,
                                                    minWidth: field.key === 'widthMM' || field.key === 'heightMM' ? '40px' :
                                                      field.key === 'area' ? '25px' :
                                                      field.key === 'lineDir' || field.key === 'lineLen' ? '30px' :
                                                      field.key === 'widthCount' || field.key === 'quantity' ? '30px' :
                                                      field.key === 'details' ? '80px' : '50px',
                                                    maxWidth: field.key === 'widthMM' || field.key === 'heightMM' ? '80px' :
                                                      field.key === 'area' ? '60px' :
                                                      field.key === 'lineDir' || field.key === 'lineLen' ? '60px' :
                                                      field.key === 'widthCount' || field.key === 'quantity' ? '60px' :
                                                      field.key === 'details' ? '200px' : '120px',
                                                    padding: '2px 4px',
                                                    fontSize: 'inherit'
                                                  }
                                                }}
                                                sx={{ 
                                                  minWidth: field.key === 'widthMM' || field.key === 'heightMM' ? '40px !important' :
                                                    field.key === 'area' ? '25px !important' :
                                                    field.key === 'lineDir' || field.key === 'lineLen' ? '30px !important' :
                                                    field.key === 'widthCount' || field.key === 'quantity' ? '30px !important' :
                                                    field.key === 'details' ? '130px !important' : '50px !important',
                                                  maxWidth: field.key === 'widthMM' || field.key === 'heightMM' ? '80px !important' :
                                                    field.key === 'area' ? '60px !important' :
                                                    field.key === 'lineDir' || field.key === 'lineLen' ? '60px !important' :
                                                    field.key === 'widthCount' || field.key === 'quantity' ? '60px !important' :
                                                    field.key === 'details' ? '230px !important' : '120px !important',
                                                  width: field.key === 'widthMM' || field.key === 'heightMM' ? 
                                                    `${calculateInputWidth(editingValue, 40, 80)}px !important` :
                                                    field.key === 'area' ? 
                                                      `${calculateInputWidth(editingValue, 25, 60)}px !important` :
                                                      field.key === 'lineDir' || field.key === 'lineLen' ? 
                                                        `${calculateInputWidth(editingValue, 30, 60)}px !important` :
                                                        field.key === 'widthCount' || field.key === 'quantity' ? 
                                                          `${calculateInputWidth(editingValue, 30, 60)}px !important` :
                                                          field.key === 'details' ?
                                                            `${calculateInputWidth(editingValue, 130, 230)}px !important` :
                                                            `${calculateInputWidth(editingValue, 50, 120)}px !important`,
                                                  fontSize: 'inherit',
                                                  '& .MuiInputBase-input': {
                                                    color: 'var(--text-color) !important',
                                                    padding: '2px 4px !important',
                                                    width: field.key === 'widthMM' || field.key === 'heightMM' ? 
                                                      `${calculateInputWidth(editingValue, 40, 80)}px !important` :
                                                      field.key === 'area' ? 
                                                        `${calculateInputWidth(editingValue, 25, 60)}px !important` :
                                                        field.key === 'lineDir' || field.key === 'lineLen' ? 
                                                          `${calculateInputWidth(editingValue, 30, 60)}px !important` :
                                                          field.key === 'widthCount' || field.key === 'quantity' ? 
                                                            `${calculateInputWidth(editingValue, 30, 60)}px !important` :
                                                            field.key === 'details' ?
                                                              `${calculateInputWidth(editingValue, 130, 230)}px !important` :
                                                              `${calculateInputWidth(editingValue, 50, 120)}px !important`
                                                  },
                                                  '& .MuiOutlinedInput-root': {
                                                    minWidth: field.key === 'widthMM' || field.key === 'heightMM' ? '40px !important' :
                                                      field.key === 'area' ? '25px !important' :
                                                      field.key === 'lineDir' || field.key === 'lineLen' ? '30px !important' :
                                                      field.key === 'widthCount' || field.key === 'quantity' ? '30px !important' :
                                                      field.key === 'details' ? '130px !important' : '50px !important',
                                                    maxWidth: field.key === 'widthMM' || field.key === 'heightMM' ? '80px !important' :
                                                      field.key === 'area' ? '60px !important' :
                                                      field.key === 'lineDir' || field.key === 'lineLen' ? '60px !important' :
                                                      field.key === 'widthCount' || field.key === 'quantity' ? '60px !important' :
                                                      field.key === 'details' ? '230px !important' : '120px !important',
                                                    width: field.key === 'widthMM' || field.key === 'heightMM' ? 
                                                      `${calculateInputWidth(editingValue, 40, 80)}px !important` :
                                                      field.key === 'area' ? 
                                                        `${calculateInputWidth(editingValue, 25, 60)}px !important` :
                                                        field.key === 'lineDir' || field.key === 'lineLen' ? 
                                                          `${calculateInputWidth(editingValue, 30, 60)}px !important` :
                                                          field.key === 'widthCount' || field.key === 'quantity' ? 
                                                            `${calculateInputWidth(editingValue, 30, 60)}px !important` :
                                                            field.key === 'details' ?
                                                              `${calculateInputWidth(editingValue, 130, 230)}px !important` :
                                                              `${calculateInputWidth(editingValue, 50, 120)}px !important`
                                                  }
                                                }}
                                                                                             />
                                             );
                                           }
                                         })()
                                       ) : (
                                         getRowValue(row, field.key)
                                       )}
                                    </TableCell>
                                  )
                              )}
                              <TableCell sx={{ whiteSpace: 'nowrap' }}>
                                <IconButton
                                  size="small"
                                  onClick={() => handleRowClick(idx)}
                                  title="수정"
                                  sx={{ color: '#2196f3' }}
                                >
                                  <EditIcon fontSize="small" />
                                </IconButton>
                                <IconButton
                                  size="small"
                                  onClick={() => handleCopyRow(row.id)}
                                  title="복사"
                                  sx={{ color: '#2196f3' }}
                                >
                                  <ContentCopyIcon fontSize="small" />
                                </IconButton>
                                <IconButton
                                  size="small"
                                  onClick={() => {
                                    if (
                                      window.confirm(
                                        '이 항목을 삭제하시겠습니까?'
                                      )
                                    ) {
                                      const newRows = estimates[
                                        activeTab
                                      ].rows.filter(r => r.id !== row.id);
                                      updateEstimateRows(activeTab, newRows);
                                    }
                                  }}
                                  title="삭제"
                                  sx={{ color: '#f44336' }}
                                >
                                  <DeleteIcon fontSize="small" />
                                </IconButton>
                              </TableCell>
                            </TableRow>
                          );
                        } else {
                          // 옵션행: 제품과 동일한 레벨에서 표시, 주문관리와 동일한 스타일
                          return (
                            <TableRow
                              key={`option-${row.id || 'no-id'}-${idx}-${row.optionLabel || 'no-label'}-${row.details || 'no-details'}`}
                              sx={{
                                fontSize: 'calc(1em - 0.3px)', // 제품과 동일한 크기
                                cursor: 'pointer',
                                // 줄간격 줄이기 위한 padding 설정
                                '& .MuiTableCell-root': {
                                  padding: '4px 8px', // 기존 기본값보다 줄임
                                  lineHeight: 1.2, // 줄간격 줄임
                                },
                                '&:hover': {
                                  backgroundColor: 'rgba(0, 0, 0, 0.04)',
                                }
                              }}
                                                              onContextMenu={(e) => {
                                  e.preventDefault();
                                  if (isRail) {
                                    handleRailEdit(idx);
                                  } else {
                                    handleOpenQuantityEditModal(row);
                                  }
                                }}
                              onDoubleClick={
                                isRail ? () => handleRailEdit(idx) : 
                                () => handleEstimateOptionDoubleClick(row, idx)
                              }
                            >
                              {isBulkEditMode && (
                                <TableCell sx={{ width: 50 }}>
                                  <Checkbox
                                    checked={selectedRowsForBulkEdit.has(idx)}
                                    onChange={() => handleRowSelectionForBulkEdit(idx)}
                                    size="small"
                                    onClick={(e) => e.stopPropagation()}
                                  />
                                </TableCell>
                              )}
                              <TableCell sx={{ 
                                fontSize: 'calc(1em - 0.3px)', // 제품과 동일한 크기
                                color: '#4caf50',
                                textAlign: 'center',
                                fontWeight: 'bold'
                              }}>
                                {/* 옵션 행은 순번 표시하지 않음 */}
                              </TableCell>
                              {FILTER_FIELDS.map(
                                field =>
                                  columnVisibility[field.key] && (
                                    <TableCell
                                      key={field.key}
                                    sx={{
                                        fontSize: 'calc(1em - 0.3px)', // 제품과 동일한 크기
                                        color: '#1976d2', // 모든 옵션 행을 블루로 통일
                                        textShadow: '0 1px 2px rgba(0,0,0,0.1)',
                                        whiteSpace: 'nowrap', // 줄바꿈 방지
                                        overflow: 'hidden',
                                        textOverflow: 'ellipsis',
                                        cursor: (() => {
                                          const editableFields = ['space', 'productCode', 'details', 'widthMM', 'heightMM', 'curtainType', 'pleatType', 'lineDir', 'lineLen', 'widthCount', 'quantity', 'area'];
                                          return editableFields.includes(field.key) ? 'pointer' : 'default';
                                        })()
                                      }}
                                      onClick={() => {
                                        // 편집 가능한 필드만 인필드 편집 허용
                                        const editableFields = ['space', 'productCode', 'details', 'widthMM', 'heightMM', 'curtainType', 'pleatType', 'lineDir', 'lineLen', 'widthCount', 'quantity', 'area'];
                                        if (editableFields.includes(field.key) && !(editingCell && editingCell.rowIndex === idx && editingCell.field === field.key)) {
                                          setEditingCell({ rowIndex: idx, field: field.key });
                                          setEditingValue(getRowValue(row, field.key) || '');
                                        }
                                      }}
                                    >
                                      {editingCell?.rowIndex === idx && editingCell?.field === field.key ? (
                                        (() => {
                                          // 드롭다운이 필요한 필드들
                                                                                     if (field.key === 'curtainType') {
                                             return (
                                               <TextField
                                                 select
                                                 value={editingValue}
                                                 onChange={e => setEditingValue(e.target.value)}
                                                 onBlur={() => handleCellEdit(idx, field.key, editingValue)}
                                                 onKeyDown={e => {
                                                   if (e.key === 'Enter') handleCellEdit(idx, field.key, editingValue);
                                                   if (e.key === 'Escape') handleCellCancel();
                                                 }}
                                                 size="small"
                                                 autoFocus
                                                 sx={{
                                                   '& .MuiInputBase-input': {
                                                     color: '#000000 !important',
                                                   },
                                                   '& .MuiSelect-select': {
                                                     color: '#000000 !important',
                                                   }
                                                 }}
                                               >
                                                 {curtainTypeOptions.map((option) => (
                                                   <MenuItem key={option} value={option} sx={{ color: '#000000 !important' }}>
                                                     {option}
                                                   </MenuItem>
                                                 ))}
                                               </TextField>
                                             );
                                          } else if (field.key === 'pleatType') {
                                            return (
                                              <TextField
                                                select
                                                value={editingValue}
                                                onChange={e => setEditingValue(e.target.value)}
                                                onBlur={() => handleCellEdit(idx, field.key, editingValue)}
                                                onKeyDown={e => {
                                                  if (e.key === 'Enter') handleCellEdit(idx, field.key, editingValue);
                                                  if (e.key === 'Escape') handleCellCancel();
                                                }}
                                                size="small"
                                                autoFocus
                                sx={{
                                                  '& .MuiInputBase-input': {
                                                    color: '#000000 !important',
                                                  },
                                                  '& .MuiSelect-select': {
                                                    color: '#000000 !important',
                                                  }
                                                }}
                                              >
                                                                                                 {pleatTypeOptions.map((option) => (
                                                   <MenuItem key={option} value={option} sx={{ color: '#000000 !important' }}>
                                                     {option}
                                                   </MenuItem>
                                                 ))}
                                              </TextField>
                                            );
                                          } else if (field.key === 'lineDir') {
                                            return (
                                              <TextField
                                                select
                                                value={editingValue}
                                                onChange={e => setEditingValue(e.target.value)}
                                                onBlur={() => handleCellEdit(idx, field.key, editingValue)}
                                                onKeyDown={e => {
                                                  if (e.key === 'Enter') handleCellEdit(idx, field.key, editingValue);
                                                  if (e.key === 'Escape') handleCellCancel();
                                                }}
                                                size="small"
                                                autoFocus
                                                sx={{
                                                  '& .MuiInputBase-input': {
                                                    color: '#000000 !important',
                                                  },
                                                  '& .MuiSelect-select': {
                                                    color: '#000000 !important',
                                                  }
                                                }}
                                              >
                                                                                                 {lineDirectionOptions.map((option) => (
                                                   <MenuItem key={option} value={option} sx={{ color: '#000000 !important' }}>
                                                     {option}
                                                   </MenuItem>
                                                 ))}
                                              </TextField>
                                            );
                                          } else if (field.key === 'lineLen') {
                                            return (
                                              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                                                <TextField
                                                  select
                                                  value={editingValue}
                                                  onChange={e => setEditingValue(e.target.value)}
                                                  onBlur={() => handleCellEdit(idx, field.key, editingValue)}
                                                  onKeyDown={e => {
                                                    if (e.key === 'Enter') handleCellEdit(idx, field.key, editingValue);
                                                    if (e.key === 'Escape') handleCellCancel();
                                                  }}
                                                  size="small"
                                                  autoFocus
                                      sx={{ 
                                                    '& .MuiInputBase-input': {
                                                      color: '#000000 !important',
                                                    },
                                                    '& .MuiSelect-select': {
                                                      color: '#000000 !important',
                                                    }
                                                  }}
                                                >
                                                                                                     {lineLengthOptions.map((option) => (
                                                     <MenuItem key={option} value={option} sx={{ color: '#000000 !important' }}>
                                                       {option}
                                                     </MenuItem>
                                                   ))}
                                                </TextField>
                                                {editingValue === '직접입력' && (
                                                  <TextField
                                                    value={editingCustomValue}
                                                    onChange={e => setEditingCustomValue(e.target.value)}
                                                    onBlur={() => {
                                                      const currentRows = estimates[activeTab]?.rows || [];
                                                      const updatedRows = [...currentRows];
                                                      if (updatedRows[idx]) {
                                                        updatedRows[idx] = { 
                                                          ...updatedRows[idx], 
                                                          lineLen: '직접입력',
                                                          customLineLength: editingCustomValue 
                                                        };
                                                        updateEstimateRows(activeTab, updatedRows);
                                                      }
                                                      setEditingCell(null);
                                                      setEditingValue('');
                                                      setEditingCustomValue('');
                                                    }}
                                                    onKeyDown={e => {
                                                      if (e.key === 'Enter') {
                                                        const currentRows = estimates[activeTab]?.rows || [];
                                                        const updatedRows = [...currentRows];
                                                        if (updatedRows[idx]) {
                                                          updatedRows[idx] = { 
                                                            ...updatedRows[idx], 
                                                            lineLen: '직접입력',
                                                            customLineLength: editingCustomValue 
                                                          };
                                                          updateEstimateRows(activeTab, updatedRows);
                                                        }
                                                        setEditingCell(null);
                                                        setEditingValue('');
                                                        setEditingCustomValue('');
                                                      }
                                                      if (e.key === 'Escape') {
                                                        setEditingCell(null);
                                                        setEditingValue('');
                                                        setEditingCustomValue('');
                                                      }
                                                    }}
                                                    size="small"
                                                    placeholder="직접 입력"
                                                  />
                                                )}
                                              </Box>
                                            );
                                          } else {
                                            return (
                                              <TextField
                                                value={editingValue}
                                                onChange={e => setEditingValue(e.target.value)}
                                                onBlur={() => handleCellEdit(idx, field.key, editingValue)}
                                                onKeyDown={e => {
                                                  if (e.key === 'Enter') handleCellEdit(idx, field.key, editingValue);
                                                  if (e.key === 'Escape') handleCellCancel();
                                                }}
                                                size="small"
                                                                                                 autoFocus
                                                 inputProps={{
                                                   style: {
                                                     width: field.key === 'widthMM' || field.key === 'heightMM' ? 
                                                       `${calculateInputWidth(editingValue, 40, 80)}px` :
                                                       field.key === 'area' ? 
                                                         `${calculateInputWidth(editingValue, 25, 60)}px` :
                                                         field.key === 'lineDir' || field.key === 'lineLen' ? 
                                                           `${calculateInputWidth(editingValue, 30, 60)}px` :
                                                           field.key === 'widthCount' || field.key === 'quantity' ? 
                                                             `${calculateInputWidth(editingValue, 30, 60)}px` :
                                                             field.key === 'details' ?
                                                               `${calculateInputWidth(editingValue, 80, 200)}px` :
                                                               `${calculateInputWidth(editingValue, 50, 120)}px`,
                                                     minWidth: field.key === 'widthMM' || field.key === 'heightMM' ? '40px' :
                                                       field.key === 'area' ? '25px' :
                                                       field.key === 'lineDir' || field.key === 'lineLen' ? '30px' :
                                                       field.key === 'widthCount' || field.key === 'quantity' ? '30px' :
                                                       field.key === 'details' ? '130px' : '50px',
                                                     maxWidth: field.key === 'widthMM' || field.key === 'heightMM' ? '80px' :
                                                       field.key === 'area' ? '60px' :
                                                       field.key === 'lineDir' || field.key === 'lineLen' ? '60px' :
                                                       field.key === 'widthCount' || field.key === 'quantity' ? '60px' :
                                                       field.key === 'details' ? '230px' : '120px',
                                                     padding: '2px 4px',
                                                     fontSize: 'inherit'
                                                   }
                                                 }}
                                                 sx={{ 
                                                   minWidth: field.key === 'widthMM' || field.key === 'heightMM' ? '40px !important' :
                                                     field.key === 'area' ? '25px !important' :
                                                     field.key === 'lineDir' || field.key === 'lineLen' ? '30px !important' :
                                                     field.key === 'widthCount' || field.key === 'quantity' ? '30px !important' :
                                                     field.key === 'details' ? '80px !important' : '50px !important',
                                                   maxWidth: field.key === 'widthMM' || field.key === 'heightMM' ? '80px !important' :
                                                     field.key === 'area' ? '60px !important' :
                                                     field.key === 'lineDir' || field.key === 'lineLen' ? '60px !important' :
                                                     field.key === 'widthCount' || field.key === 'quantity' ? '60px !important' :
                                                     field.key === 'details' ? '230px !important' : '120px !important',
                                                   width: field.key === 'widthMM' || field.key === 'heightMM' ? 
                                                     `${calculateInputWidth(editingValue, 40, 80)}px !important` :
                                                     field.key === 'area' ? 
                                                       `${calculateInputWidth(editingValue, 25, 60)}px !important` :
                                                       field.key === 'lineDir' || field.key === 'lineLen' ? 
                                                         `${calculateInputWidth(editingValue, 30, 60)}px !important` :
                                                         field.key === 'widthCount' || field.key === 'quantity' ? 
                                                           `${calculateInputWidth(editingValue, 30, 60)}px !important` :
                                                           field.key === 'details' ?
                                                             `${calculateInputWidth(editingValue, 80, 200)}px !important` :
                                                             `${calculateInputWidth(editingValue, 50, 120)}px !important`,
                                                   fontSize: 'inherit',
                                                   '& .MuiInputBase-input': {
                                                     color: '#000000 !important',
                                                     padding: '2px 4px !important',
                                                     width: field.key === 'widthMM' || field.key === 'heightMM' ? 
                                                       `${calculateInputWidth(editingValue, 40, 80)}px !important` :
                                                       field.key === 'area' ? 
                                                         `${calculateInputWidth(editingValue, 25, 60)}px !important` :
                                                         field.key === 'lineDir' || field.key === 'lineLen' ? 
                                                           `${calculateInputWidth(editingValue, 30, 60)}px !important` :
                                                           field.key === 'widthCount' || field.key === 'quantity' ? 
                                                             `${calculateInputWidth(editingValue, 30, 60)}px !important` :
                                                             field.key === 'details' ?
                                                               `${calculateInputWidth(editingValue, 130, 230)}px !important` :
                                                               `${calculateInputWidth(editingValue, 50, 120)}px !important`
                                                   },
                                                   '& .MuiOutlinedInput-root': {
                                                     minWidth: field.key === 'widthMM' || field.key === 'heightMM' ? '40px !important' :
                                                       field.key === 'area' ? '25px !important' :
                                                       field.key === 'lineDir' || field.key === 'lineLen' ? '30px !important' :
                                                       field.key === 'widthCount' || field.key === 'quantity' ? '30px !important' :
                                                       field.key === 'details' ? '130px !important' : '50px !important',
                                                     maxWidth: field.key === 'widthMM' || field.key === 'heightMM' ? '80px !important' :
                                                       field.key === 'area' ? '60px !important' :
                                                       field.key === 'lineDir' || field.key === 'lineLen' ? '60px !important' :
                                                       field.key === 'widthCount' || field.key === 'quantity' ? '60px !important' :
                                                       field.key === 'details' ? '230px !important' : '120px !important',
                                                     width: field.key === 'widthMM' || field.key === 'heightMM' ? 
                                                       `${calculateInputWidth(editingValue, 40, 80)}px !important` :
                                                       field.key === 'area' ? 
                                                         `${calculateInputWidth(editingValue, 25, 60)}px !important` :
                                                         field.key === 'lineDir' || field.key === 'lineLen' ? 
                                                           `${calculateInputWidth(editingValue, 30, 60)}px !important` :
                                                           field.key === 'widthCount' || field.key === 'quantity' ? 
                                                             `${calculateInputWidth(editingValue, 30, 60)}px !important` :
                                                             field.key === 'details' ?
                                                               `${calculateInputWidth(editingValue, 130, 230)}px !important` :
                                                               `${calculateInputWidth(editingValue, 50, 120)}px !important`
                                                   }
                                                 }}
                                               />
                                             );
                                           }
                                                                                   })()
                                        ) : (
                                        field.key === 'vendor' ? 
                                          (isRail ? '🚇 레일' : row.vendor) :
                                          field.key === 'space' ? 
                                            (isRail ? 'ㄴ레일' : 'ㄴ옵션') :
                                            getRowValue(row, field.key)
                                      )}
                                    </TableCell>
                                  )
                              )}
                              <TableCell sx={{ whiteSpace: 'nowrap' }}>
                                <IconButton
                                  size="small"
                                  onClick={() => {
                                    if (
                                      window.confirm(
                                        '이 항목을 삭제하시겠습니까?'
                                      )
                                    ) {
                                      const newRows = estimates[
                                        activeTab
                                      ].rows.filter(r => r.id !== row.id);
                                      updateEstimateRows(activeTab, newRows);
                                    }
                                  }}
                                  title={isRail ? '레일 삭제' : '옵션 삭제'}
                                  sx={{ color: isRail ? '#ff5722' : '#f44336' }}
                                >
                                  <DeleteIcon fontSize="small" />
                                </IconButton>
                              </TableCell>
                            </TableRow>
                          );
                        }
                      })}
                  {/* 합계 행 */}
                  <TableRow sx={{ backgroundColor: 'var(--hover-color)', fontWeight: 'bold' }}>
                    {isBulkEditMode && <TableCell sx={{ fontSize: 'calc(1em + 1px)', fontWeight: 'bold', color: 'var(--text-color)' }}></TableCell>}
                    <TableCell sx={{ fontSize: 'calc(1em + 1px)', fontWeight: 'bold', color: 'var(--text-color)' }}>합계</TableCell>
                    {FILTER_FIELDS.map(field => 
                      columnVisibility[field.key] && (
                        <TableCell key={field.key} sx={{ fontSize: 'calc(1em + 1px)', fontWeight: 'bold', color: 'var(--text-color)' }}>
                          {field.key === 'area' ? 
                            estimates[activeTab]?.rows?.reduce((sum, row) => {
                              // 겉커튼과 속커튼은 면적 계산에서 제외
                              if (row?.curtainType === '겉커튼' || row?.curtainType === '속커튼') {
                                return sum;
                              }
                              return sum + (Number(row?.area) || 0);
                            }, 0).toFixed(1) :
                            field.key === 'quantity' ? 
                              estimates[activeTab]?.rows?.reduce((sum, row) => sum + (Number(row?.quantity) || 0), 0) :
                            field.key === 'totalPrice' ? 
                              sumTotalPrice.toLocaleString() :
                            field.key === 'cost' ? 
                              estimates[activeTab]?.rows?.reduce((sum, row) => sum + (Number(row?.cost) || 0), 0).toLocaleString() :
                            field.key === 'margin' ? 
                              sumMargin.toLocaleString() :
                            ''
                          }
                        </TableCell>
                      )
                    )}
                    <TableCell sx={{ fontSize: 'calc(1em + 1px)', fontWeight: 'bold', color: 'var(--text-color)' }}></TableCell>
                  </TableRow>
                    </TableBody>
                  </Table>
                </TableContainer>
              ) : (
                <TableContainer sx={{
                  backgroundColor: 'var(--surface-color)', 
                  borderRadius: 1,
                  // 테이블 전체 줄간격 줄이기
                  '& .MuiTable-root': {
                    borderCollapse: 'collapse',
                  },
                  '& .MuiTableRow-root': {
                    height: 'auto', // 자동 높이로 줄간격 최적화
                  },
                  '& .MuiTableCell-root': {
                    borderBottom: '1px solid rgba(224, 224, 224, 1)',
                    verticalAlign: 'middle',
                    borderColor: 'var(--border-color)',
                  }
                }}>
                  <Table size="small">
                    <TableHead>
                      <TableRow sx={{
                        backgroundColor: 'var(--surface-color)', 
                        borderBottom: '2px solid var(--border-color)',
                        // 헤더 줄간격 줄이기
                        '& .MuiTableCell-root': {
                          padding: '6px 8px', // 헤더는 약간 더 여유있게
                          lineHeight: 1.2,
                          fontWeight: 'bold',
                        }
                      }}>
                        <TableCell sx={{ 
                          color: 'var(--text-color)', 
                          fontWeight: 'bold', 
                          textShadow: '0 1px 2px rgba(0,0,0,0.1)'
                        }}>순번</TableCell>
                        {FILTER_FIELDS.map(
                          field =>
                            columnVisibility[field.key] && (
                              <TableCell key={field.key} sx={{ 
                                color: 'var(--text-color)', 
                                fontWeight: 'bold', 
                                textShadow: '0 1px 2px rgba(0,0,0,0.1)'
                              }}>
                                {field.label}
                              </TableCell>
                            )
                        )}
                        <TableCell sx={{ 
                          color: 'var(--text-color)', 
                          fontWeight: 'bold', 
                          textShadow: '0 1px 2px rgba(0,0,0,0.1)'
                        }}>작업</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody sx={{ 
                      color: 'var(--text-color)', 
                      backgroundColor: 'var(--background-color)'
                    }}>
                      <TableRow>
                        <TableCell
                          colSpan={FILTER_FIELDS.length + 2}
                          align="center"
                          sx={{ 
                            color: '#666',
                            fontSize: 'calc(1em - 0.3px)', // 주문서와 동일한 크기
                            padding: '4px 8px', // 기존 기본값보다 줄임
                            lineHeight: 1.2, // 줄간격 줄임
                          }}
                        >
                          데이터가 없습니다
                        </TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>
                </TableContainer>
              );
            })()}

            <Box
              sx={{
                mt: 1,
                mb: 2,
                fontWeight: 'bold',
                fontSize: 16,
                display: 'flex',
                alignItems: 'center',
              }}
            >
              <span style={{ color: 'var(--text-color)', marginRight: 32 }}>
                소비자금액(VAT포함): {sumTotalPrice.toLocaleString()} 원
              </span>
              <Button
                variant="contained"
                size="small"
                sx={{
                  mx: 2,
                  backgroundColor: '#222',
                  color: '#ff9800',
                  '&:hover': { backgroundColor: '#333' },
                  fontWeight: 'bold',
                  boxShadow: 'none',
                  borderRadius: 1,
                  minWidth: 100,
                  paddingX: 2,
                }}
                onClick={handleToggleDiscount}
              >
                HunterDouglas
              </Button>
              {discountAmountNumber > 0 && (
                <span style={{ color: 'var(--text-color)', marginRight: 32 }}>
                  할인후금액(VAT포함): {discountedTotal?.toLocaleString()} 원
                </span>
              )}
              <Button
                variant="contained"
                size="small"
                sx={{
                  mx: 2,
                  backgroundColor: '#222',
                  color: '#ff9800',
                  '&:hover': { backgroundColor: '#333' },
                  fontWeight: 'bold',
                  boxShadow: 'none',
                  borderRadius: 1,
                  minWidth: 100,
                  paddingX: 2,
                }}
                onClick={handleToggleMarginColumns}
              >
                WINDOWSTORY
              </Button>

            </Box>
            {showDiscount && (
              <Box
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 2,
                  mb: 2,
                  ml: 2,
                }}
              >
                <span>할인금액:</span>
                <input
                  type="text"
                  value={
                    discountAmount
                      ? Number(discountAmount).toLocaleString()
                      : ''
                  }
                  onChange={handleDiscountAmountChange}
                  style={{ width: 100, marginRight: 16, fontSize: '15px' }}
                />
                <span>할인율(%):</span>
                <input
                  type="number"
                  value={discountRate}
                  onChange={handleDiscountRateChange}
                  style={{ width: 60, marginRight: 16 }}
                />
                <span>할인후금액:</span>
                <input
                  type="text"
                  value={
                    discountedTotalInput
                      ? Number(discountedTotalInput).toLocaleString()
                      : ''
                  }
                  onChange={handleDiscountedTotalChange}
                  style={{ width: 120, fontSize: '15px' }}
                />
              </Box>
            )}
            {/* 확정금액 + 계약생성 + 저장하기: 할인 영역 하단으로 이동 */}
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Typography sx={{ color: '#d32f2f', fontWeight: 'bold' }}>확정금액(VAT포함)</Typography>
                <input
                  type="text"
                  value={finalizedAmount ? Number(finalizedAmount).toLocaleString() : ''}
                  onChange={(e) => {
                    const raw = e.target.value.replace(/,/g, '');
                    if (/^\d*$/.test(raw)) setFinalizedAmount(raw);
                  }}
                  placeholder={(discountAmountNumber > 0 ? (discountedTotal || sumTotalPrice) : sumTotalPrice).toLocaleString()}
                  style={{ width: 140, fontSize: '15px', padding: '4px 8px', border: '1px solid var(--border-color)', borderRadius: 4, color: '#d32f2f', background: 'var(--surface-color)', fontWeight: 'bold' }}
                />
              </Box>
              <Button
                variant="contained"
                color="primary"
                onClick={() => setContractModalOpen(true)}
                sx={{ backgroundColor: 'var(--primary-color)', color: 'var(--text-color)' }}
              >
                계약생성
              </Button>
              <Tooltip title="견적서 저장">
                <IconButton
                  size="small"
                  onClick={handleSaveEstimate}
                  sx={{ 
                    color: 'var(--success-color, #2e7d32)',
                    border: '1px solid var(--border-color)',
                    backgroundColor: 'var(--surface-color)',
                    '&:hover': {
                      backgroundColor: 'rgba(46, 125, 50, 0.1)',
                      borderColor: 'var(--success-color)',
                    },
                  }}
                >
                  <SaveIcon fontSize="small" />
                </IconButton>
              </Tooltip>
            </Box>

            {/* 생성된 계약서 카드: 확정금액 바로 아래 */}
            
            {/* 계약서 카드 섹션 */}
            <Box sx={{ mt: 2, mb: 2 }}>
              <Box 
                sx={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'space-between',
                  cursor: 'pointer',
                  p: 1,
                  borderRadius: 1,
                  backgroundColor: 'var(--background-color)',
                  border: '1px solid var(--border-color)',
                  '&:hover': {
                    backgroundColor: 'var(--hover-color)',
                  }
                }}
                onClick={() => setContractSectionExpanded(!contractSectionExpanded)}
              >
                <Typography sx={{ fontWeight: 'bold', color: 'var(--text-color)' }}>
                  계약서 ({contractsForCurrentEstimate?.length || 0}개)
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  {contractsForCurrentEstimate && contractsForCurrentEstimate.length > 0 && (
                    <Typography sx={{ color: 'var(--primary-color)', fontSize: '0.9rem', fontWeight: 'bold' }}>
                      계약서 있음
                    </Typography>
                  )}
                  <IconButton size="small" sx={{ color: 'var(--text-color)' }}>
                    {contractSectionExpanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                  </IconButton>
                </Box>
              </Box>
              
              <Collapse in={contractSectionExpanded}>
                {contractsForCurrentEstimate && contractsForCurrentEstimate.length > 0 ? (
                <Grid container spacing={1}>
                  {contractsForCurrentEstimate.map((c: any) => (
                    <Grid item xs={12} md={6} lg={4} key={c.id}>
                      <Card variant="outlined" sx={{ backgroundColor: 'var(--surface-color)', borderColor: 'var(--border-color)', position: 'relative' }}>
                        {/* 우측 상단 아이콘들 */}
                        <Box sx={{ position: 'absolute', top: 8, right: 8, display: 'flex', gap: 0.5 }}>
                          <IconButton
                            size="small"
                            onClick={(event) => handleContractPrintMenuClick(event, c)}
                            sx={{
                              color: 'var(--primary-color)',
                              '&:hover': { backgroundColor: 'var(--hover-color)' },
                              width: 28,
                              height: 28,
                            }}
                            title="출력"
                          >
                            <PrintIcon fontSize="small" />
                          </IconButton>
                          <IconButton
                            size="small"
                            onClick={() => handleContractEdit(c)}
                            sx={{
                              color: 'var(--text-secondary-color)',
                              '&:hover': { backgroundColor: 'var(--hover-color)' },
                              width: 28,
                              height: 28,
                            }}
                            title="수정"
                          >
                            <EditIcon fontSize="small" />
                          </IconButton>
                          <IconButton
                            size="small"
                            onClick={() => handleContractDelete(c)}
                            sx={{
                              color: '#d32f2f',
                              '&:hover': { backgroundColor: 'var(--hover-color)' },
                              width: 28,
                              height: 28,
                            }}
                            title="삭제"
                          >
                            <DeleteIcon fontSize="small" />
                          </IconButton>
                        </Box>
                        <CardContent sx={{ color: 'var(--text-color)', pt: 4 }}>
                          <Typography variant="subtitle1" sx={{ fontWeight: 'bold', color: 'var(--text-color)', fontSize: '1.1rem' }}>{c.contractNo}</Typography>
                          <Typography variant="body2" sx={{ color: 'var(--text-color)', fontSize: '0.95rem' }}>견적번호: {c.estimateNo}</Typography>
                          <Typography variant="body2" sx={{ color: 'var(--text-color)', fontSize: '0.95rem' }}>고객명: {c.customerName}</Typography>
                          <Typography variant="body2" sx={{ color: 'var(--text-color)', fontSize: '0.95rem' }}>계약일자: {new Date(c.contractDate).toLocaleDateString()}</Typography>
                          <Typography variant="body2" sx={{ color: 'var(--text-color)', fontSize: '0.95rem' }}>할인후금액: {(c.discountedAmount || 0).toLocaleString()}원</Typography>
                          <Typography variant="body2" sx={{ color: 'var(--text-color)', fontSize: '0.95rem' }}>계약금: {(c.depositAmount || 0).toLocaleString()}원 / 잔금: {(c.remainingAmount || 0).toLocaleString()}원</Typography>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.5 }}>
                          <Typography variant="body2" sx={{ color: 'var(--text-color)', fontSize: '0.9rem', minWidth: '60px' }}>
                              실측일자:
                            </Typography>
                            {/* 커스텀 10분 단위 시간 선택 UI */}
                            <input
                              type="date"
                              value={c.measurementDate ? formatLocalDatetimeValue(new Date(c.measurementDate)).slice(0,10) : ''}
                              onChange={(e) => handleContractDateChange(c.id, 'measurementDate', buildLocalValue(c.measurementDate, { date: e.target.value }))}
                              style={{
                                fontSize: '0.9rem',
                                padding: '4px 8px',
                                border: '1px solid var(--border-color)',
                                borderRadius: 3,
                                background: 'var(--surface-color)',
                                color: 'var(--text-color)'
                              }}
                            />
                            <select
                              value={extractLocalParts(c.measurementDate || undefined).ampm}
                              onChange={(e) => handleContractDateChange(c.id, 'measurementDate', buildLocalValue(c.measurementDate, { ampm: e.target.value as any }))}
                              style={{
                                fontSize: '0.9rem',
                                padding: '4px 6px',
                                border: '1px solid var(--border-color)',
                                borderRadius: 3,
                                background: 'var(--surface-color)',
                                color: 'var(--text-color)',
                                marginLeft: 6
                              }}
                            >
                              <option value="오전">오전</option>
                              <option value="오후">오후</option>
                            </select>
                            <select
                              value={extractLocalParts(c.measurementDate || undefined).hour12}
                              onChange={(e) => handleContractDateChange(c.id, 'measurementDate', buildLocalValue(c.measurementDate, { hour12: e.target.value }))}
                              style={{
                                fontSize: '0.9rem',
                                padding: '4px 6px',
                                border: '1px solid var(--border-color)',
                                borderRadius: 3,
                                background: 'var(--surface-color)',
                                color: 'var(--text-color)',
                                marginLeft: 6
                              }}
                            >
                              {Array.from({ length: 12 }, (_, i) => String(i + 1).padStart(2, '0')).map(h => (
                                <option key={h} value={h}>{h}</option>
                              ))}
                            </select>
                            <select
                              value={extractLocalParts(c.measurementDate || undefined).minute}
                              onChange={(e) => handleContractDateChange(c.id, 'measurementDate', buildLocalValue(c.measurementDate, { minute: e.target.value }))}
                              style={{
                                fontSize: '0.9rem',
                                padding: '4px 6px',
                                border: '1px solid var(--border-color)',
                                borderRadius: 3,
                                background: 'var(--surface-color)',
                                color: 'var(--text-color)',
                                marginLeft: 6
                              }}
                            >
                              {['00','10','20','30','40','50'].map(m => (
                                <option key={m} value={m}>{m}</option>
                              ))}
                            </select>
                          </Box>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.5 }}>
                            <Typography variant="body2" sx={{ color: 'var(--text-color)', fontSize: '0.9rem', minWidth: '60px' }}>
                              시공일자:
                            </Typography>
                            <input
                              type="date"
                              value={c.constructionDate ? formatLocalDatetimeValue(new Date(c.constructionDate)).slice(0,10) : ''}
                              onChange={(e) => handleContractDateChange(c.id, 'constructionDate', buildLocalValue(c.constructionDate, { date: e.target.value }))}
                              style={{
                                fontSize: '0.9rem',
                                padding: '4px 8px',
                                border: '1px solid var(--border-color)',
                                borderRadius: 3,
                                background: 'var(--surface-color)',
                                color: 'var(--text-color)'
                              }}
                            />
                            <select
                              value={extractLocalParts(c.constructionDate || undefined).ampm}
                              onChange={(e) => handleContractDateChange(c.id, 'constructionDate', buildLocalValue(c.constructionDate, { ampm: e.target.value as any }))}
                              style={{
                                fontSize: '0.9rem',
                                padding: '4px 6px',
                                border: '1px solid var(--border-color)',
                                borderRadius: 3,
                                background: 'var(--surface-color)',
                                color: 'var(--text-color)',
                                marginLeft: 6
                              }}
                            >
                              <option value="오전">오전</option>
                              <option value="오후">오후</option>
                            </select>
                            <select
                              value={extractLocalParts(c.constructionDate || undefined).hour12}
                              onChange={(e) => handleContractDateChange(c.id, 'constructionDate', buildLocalValue(c.constructionDate, { hour12: e.target.value }))}
                              style={{
                                fontSize: '0.9rem',
                                padding: '4px 6px',
                                border: '1px solid var(--border-color)',
                                borderRadius: 3,
                                background: 'var(--surface-color)',
                                color: 'var(--text-color)',
                                marginLeft: 6
                              }}
                            >
                              {Array.from({ length: 12 }, (_, i) => String(i + 1).padStart(2, '0')).map(h => (
                                <option key={h} value={h}>{h}</option>
                              ))}
                            </select>
                            <select
                              value={extractLocalParts(c.constructionDate || undefined).minute}
                              onChange={(e) => handleContractDateChange(c.id, 'constructionDate', buildLocalValue(c.constructionDate, { minute: e.target.value }))}
                              style={{
                                fontSize: '0.9rem',
                                padding: '4px 6px',
                                border: '1px solid var(--border-color)',
                                borderRadius: 3,
                                background: 'var(--surface-color)',
                                color: 'var(--text-color)',
                                marginLeft: 6
                              }}
                            >
                              {['00','10','20','30','40','50'].map(m => (
                                <option key={m} value={m}>{m}</option>
                              ))}
                            </select>
                          </Box>
                        </CardContent>
                      </Card>
                    </Grid>
                  ))}
                </Grid>
              ) : (
                <Box sx={{ p: 2, textAlign: 'center', color: 'var(--text-secondary-color)' }}>
                  <Typography variant="body2">
                    이 견적서에 연결된 계약서가 없습니다.
                  </Typography>
                </Box>
              )}
              </Collapse>
            </Box>

            {/* 버튼들 */}
            <Box sx={{ display: 'flex', gap: 1, mt: 2, mb: 1 }}>



              <Menu
                anchorEl={outputAnchorEl}
                open={Boolean(outputAnchorEl)}
                onClose={handleOutputClose}
                anchorOrigin={{
                  vertical: 'bottom',
                  horizontal: 'left',
                }}
                transformOrigin={{
                  vertical: 'top',
                  horizontal: 'left',
                }}
                PaperProps={{
                  sx: {
                    backgroundColor: 'var(--surface-color)',
                    color: 'var(--text-color)',
                    border: '1px solid var(--border-color)',
                    boxShadow: '0 4px 20px rgba(0, 0, 0, 0.15)',
                    '& .MuiMenuItem-root': {
                      color: 'var(--text-color)',
                      '&:hover': {
                        backgroundColor: 'var(--hover-color)',
                      },
                    },
                  },
                }}
              >
                <MenuItem onClick={() => handleOutputOption('print')} sx={{ color: 'var(--text-color)' }}>
                  <PrintIcon sx={{ mr: 1, fontSize: 20 }} />
                  프린트
                </MenuItem>
                <MenuItem onClick={() => handleOutputOption('pdf')} sx={{ color: 'var(--text-color)' }}>
                  <PictureAsPdfIcon sx={{ mr: 1, fontSize: 20 }} />
                  PDF
                </MenuItem>
                <MenuItem onClick={() => handleOutputOption('jpg')} sx={{ color: 'var(--text-color)' }}>
                  <ImageIcon sx={{ mr: 1, fontSize: 20 }} />
                  JPG
                </MenuItem>
                <MenuItem onClick={() => handleOutputOption('share')} sx={{ color: 'var(--text-color)' }}>
                  <ShareIcon sx={{ mr: 1, fontSize: 20 }} />
                  공유
                </MenuItem>
              </Menu>
            </Box>
          </Paper>
        </Grid>

        {/* 필터 모달 */}
        <Dialog
          open={filterModalOpen}
          onClose={() => setFilterModalOpen(false)}
          maxWidth="md"
          fullWidth
          disableEnforceFocus
          disableAutoFocus
          sx={{
            '& .MuiDialog-paper': {
              backgroundColor: 'var(--surface-color)',
            },
          }}
        >
          <DialogTitle sx={{ color: 'var(--text-color)', backgroundColor: 'var(--surface-color)' }}>열 표시 설정</DialogTitle>
          <DialogContent sx={{ backgroundColor: 'var(--surface-color)' }}>
            <Grid container spacing={2}>
              {FILTER_FIELDS.map(f => (
                <Grid item xs={4} key={f.key}>
                  <FormControlLabel
                    control={
                      <Checkbox
                        checked={columnVisibility[f.key]}
                        onChange={() => handleColumnToggle(f.key)}
                        sx={{
                          color: 'var(--primary-color)',
                          '&.Mui-checked': {
                            color: 'var(--primary-color)',
                          },
                        }}
                      />
                    }
                    label={f.label}
                    sx={{
                      color: 'var(--text-color)',
                      '& .MuiFormControlLabel-label': {
                        color: 'var(--text-color)',
                      },
                    }}
                  />
                </Grid>
              ))}
            </Grid>
          </DialogContent>
          <DialogActions sx={{ backgroundColor: 'var(--surface-color)' }}>
            <Button 
              onClick={handleFilterReset}
              sx={{
                color: 'var(--text-color)',
                '&:hover': {
                  backgroundColor: 'var(--hover-color)',
                },
              }}
            >
              초기화
            </Button>
            <Button 
              onClick={handleSaveAsDefault}
              sx={{
                color: 'var(--text-color)',
                '&:hover': {
                  backgroundColor: 'var(--hover-color)',
                },
              }}
            >
              기본값으로 저장
            </Button>
            <Button
              variant="contained"
              onClick={() => setFilterModalOpen(false)}
              sx={{
                backgroundColor: 'var(--primary-color)',
                '&:hover': {
                  backgroundColor: 'var(--primary-hover-color)',
                },
              }}
            >
              적용
            </Button>
          </DialogActions>
        </Dialog>


      </Grid>

      {/* 견적서 양식 */}
      <EstimateTemplate
        estimate={selectedEstimateForPrint || estimates[activeTab]}
        onClose={() => {
          setShowEstimateTemplate(false);
          setSelectedEstimateForPrint(null);
        }}
        discountAmount={
          Number(
            (selectedEstimateForPrint as any)?.discountAmount ?? discountAmount
          ) || 0
        }
        open={showEstimateTemplate}
      />

      {/* 템플릿 매니저 */}
      <TemplateManager
        open={templateDialogOpen}
        onClose={() => setTemplateDialogOpen(false)}
        onTemplateSelect={handleTemplateSelect}
      />

      {/* 계약 생성 모달 - 견적서 페이지에서 독립적으로 표시 */}
      <ContractCreateModal
        open={contractModalOpen}
        onClose={() => setContractModalOpen(false)}
        estimate={{
          estimateNo: estimates[activeTab]?.estimateNo,
          estimateDate: estimates[activeTab]?.estimateDate,
          customerName: estimates[activeTab]?.customerName,
          contact: estimates[activeTab]?.contact,
          emergencyContact: estimates[activeTab]?.emergencyContact,
          projectName: estimates[activeTab]?.projectName,
          type: estimates[activeTab]?.type,
          address: estimates[activeTab]?.address,
          rows: estimates[activeTab]?.rows,
        }}
        totalAmount={sumTotalPrice}
        discountedAmount={Number(finalizedAmount || (discountAmountNumber > 0 ? (discountedTotal || sumTotalPrice) : sumTotalPrice))}
        onSaved={(contract: any) => {
          console.log('계약서 저장 완료:', contract);
          // 저장 직후 현재 견적의 계약 카드 목록을 갱신
          setContractsForCurrentEstimate((prev: any[]) => [contract, ...prev.filter((c: any) => c.id !== contract.id)]);
          // 계약서 목록 갱신 트리거 업데이트
          setContractRefreshTrigger(prev => prev + 1);
          // 계약서 섹션 자동 펼치기
          setContractSectionExpanded(true);
          // localStorage에서 최신 데이터 다시 로드
          setTimeout(() => {
            try {
              const currentEstimateNo = estimates[activeTab]?.estimateNo;
              if (currentEstimateNo) {
                const saved: any[] = JSON.parse(localStorage.getItem('contracts') || '[]');
                const list = saved.filter(c => c.estimateNo === currentEstimateNo);
                list.sort((a: any, b: any) => (b.id || 0) - (a.id || 0));
                setContractsForCurrentEstimate(list);
                console.log('계약서 저장 후 목록 재로드 완료:', list.length, '개');
              }
            } catch (error) {
              console.error('계약서 저장 후 목록 재로드 실패:', error);
            }
          }, 100);
        }}
      />

      {/* 계약서 수정 모달 */}
      <ContractCreateModal
        open={contractEditModalOpen}
        onClose={() => {
          setContractEditModalOpen(false);
          setSelectedContractForEdit(null);
        }}
        estimate={{
          estimateNo: selectedContractForEdit?.estimateNo,
          estimateDate: selectedContractForEdit?.estimateDate,
          customerName: selectedContractForEdit?.customerName,
          contact: selectedContractForEdit?.contact,
          emergencyContact: selectedContractForEdit?.emergencyContact,
          projectName: selectedContractForEdit?.projectName,
          type: selectedContractForEdit?.type,
          address: selectedContractForEdit?.address,
          rows: selectedContractForEdit?.rows,
        }}
        totalAmount={selectedContractForEdit?.totalAmount || 0}
        discountedAmount={selectedContractForEdit?.discountedAmount || 0}
        existingContract={selectedContractForEdit}
        isEditMode={true}
        onSaved={(updatedContract: any) => {
          console.log('계약서 수정 완료:', updatedContract);
          // 수정된 계약서로 목록 업데이트
          setContractsForCurrentEstimate((prev: any[]) => 
            prev.map((c: any) => c.id === updatedContract.id ? updatedContract : c)
          );
          // 계약서 목록 갱신 트리거 업데이트
          setContractRefreshTrigger(prev => prev + 1);
          // 계약서 섹션 자동 펼치기
          setContractSectionExpanded(true);
          // localStorage에서 최신 데이터 다시 로드
          setTimeout(() => {
            try {
              const currentEstimateNo = estimates[activeTab]?.estimateNo;
              if (currentEstimateNo) {
                const saved: any[] = JSON.parse(localStorage.getItem('contracts') || '[]');
                const list = saved.filter(c => c.estimateNo === currentEstimateNo);
                list.sort((a: any, b: any) => (b.id || 0) - (a.id || 0));
                setContractsForCurrentEstimate(list);
                console.log('계약서 수정 후 목록 재로드 완료:', list.length, '개');
              }
            } catch (error) {
              console.error('계약서 수정 후 목록 재로드 실패:', error);
            }
          }, 100);
          setContractEditModalOpen(false);
          setSelectedContractForEdit(null);
        }}
      />

      {/* 저장된 견적서 리스트 */}
      <Grid item xs={12}>
        <Paper sx={{ p: 2, backgroundColor: 'var(--surface-color)' }}>
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              mb: 2,
            }}
          >
            <Typography
              sx={{ fontWeight: 'bold', color: 'var(--text-color)', fontSize: '17px' }}
            >
              견적서 LIST
            </Typography>
            <Box sx={{ display: 'flex', gap: 1 }}>
              <Button
                variant="outlined"
                size="small"
                onClick={() => setEstimateListSettingsOpen(true)}
                sx={{
                  minWidth: 80,
                  fontSize: 13,
                  py: 0.5,
                  px: 1.5,
                  color: 'var(--text-secondary-color)',
                  borderColor: 'var(--border-color)',
                  '&:hover': {
                    backgroundColor: 'var(--hover-color)',
                    borderColor: 'var(--primary-color)',
                  },
                }}
              >
                표시설정
              </Button>
              <Button
                variant="outlined"
                size="small"
                onClick={() => setShowSavedEstimates(!showSavedEstimates)}
                sx={{
                  minWidth: 80,
                  fontSize: 13,
                  py: 0.5,
                  px: 1.5,
                  color: 'var(--text-secondary-color)',
                  borderColor: 'var(--border-color)',
                  '&:hover': {
                    backgroundColor: 'var(--hover-color)',
                    borderColor: 'var(--primary-color)',
                  },
                }}
              >
                {showSavedEstimates ? '숨기기' : '보기'}
              </Button>

            </Box>
          </Box>
          {showSavedEstimates && (
            <>
              <TextField
                fullWidth
                label="검색"
                value={savedEstimateSearch}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setSavedEstimateSearch(e.target.value)
                }
                placeholder="견적서명, 제품명, 거래처, 브랜드 등으로 검색"
                sx={{
                  mb: 2,
                  input: { color: 'var(--text-color)' },
                  label: { color: 'var(--text-secondary-color)' },
                  '& .MuiOutlinedInput-root': {
                    '& fieldset': { borderColor: 'var(--border-color)' },
                    '&:hover fieldset': { borderColor: 'var(--primary-color)' },
                    height: '40px', // 높이를 40px로 줄임
                    '& .MuiInputBase-input': {
                      padding: '8px 12px', // 패딩도 줄여서 더 컴팩트하게
                      fontSize: '14px', // 폰트 크기도 약간 줄임
                    },
                  },
                  '& .MuiInputLabel-root': {
                    fontSize: '14px', // 라벨 폰트 크기도 줄임
                    transform: 'translate(12px, 8px) scale(1)', // 라벨 위치 조정
                    '&.Mui-focused, &.MuiFormLabel-filled': {
                      transform: 'translate(12px, -6px) scale(0.75)', // 포커스/채워진 상태 위치 조정
                    },
                  },
                }}
                size="small"
                InputProps={{
                  endAdornment: (
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, height: '40px' }}>
                      <ButtonGroup variant="outlined" size="small" sx={{ height: '32px' }}>
                        <Button
                          onClick={() => setPeriodMode('all')}
                          sx={{
                            color: periodMode === 'all' ? 'var(--primary-color)' : 'var(--text-secondary-color)',
                            borderColor: 'var(--border-color)',
                            backgroundColor:
                              periodMode === 'all' ? 'var(--hover-color)' : 'inherit',
                            height: '32px',
                            fontSize: '12px',
                            px: 1,
                          }}
                        >
                          전체
                        </Button>
                        <Button
                          onClick={() => setPeriodMode('week')}
                          sx={{
                            color:
                              periodMode === 'week' ? 'var(--primary-color)' : 'var(--text-secondary-color)',
                            borderColor: 'var(--border-color)',
                            backgroundColor:
                              periodMode === 'week' ? 'var(--hover-color)' : 'inherit',
                            height: '32px',
                            fontSize: '12px',
                            px: 1,
                          }}
                        >
                          주간
                        </Button>
                        <Button
                          onClick={() => setPeriodMode('month')}
                          sx={{
                            color:
                              periodMode === 'month' ? 'var(--primary-color)' : 'var(--text-secondary-color)',
                            borderColor: 'var(--border-color)',
                            backgroundColor:
                              periodMode === 'month' ? 'var(--hover-color)' : 'inherit',
                            height: '32px',
                            fontSize: '12px',
                            px: 1,
                          }}
                        >
                          월간
                        </Button>
                        <Button
                          onClick={() => {
                            setPeriodMode('quarter');
                            if (!selectedYear && savedYears.length)
                              setSelectedYear(savedYears[0].toString());
                          }}
                          sx={{
                            color:
                              periodMode === 'quarter' ? 'var(--primary-color)' : 'var(--text-secondary-color)',
                            borderColor: 'var(--border-color)',
                            backgroundColor:
                              periodMode === 'quarter' ? 'var(--hover-color)' : 'inherit',
                            height: '32px',
                            fontSize: '12px',
                            px: 1,
                          }}
                        >
                          분기 ▼
                        </Button>
                        <Button
                          onClick={() => {
                            setPeriodMode('half');
                            if (!selectedYear && savedYears.length)
                              setSelectedYear(savedYears[0].toString());
                          }}
                          sx={{
                            color:
                              periodMode === 'half' ? 'var(--primary-color)' : 'var(--text-secondary-color)',
                            borderColor: 'var(--border-color)',
                            backgroundColor:
                              periodMode === 'half' ? 'var(--hover-color)' : 'inherit',
                            height: '32px',
                            fontSize: '12px',
                            px: 1,
                          }}
                        >
                          반기 ▼
                        </Button>
                        <Button
                          onClick={() => {
                            setPeriodMode('year');
                            if (!selectedYear && savedYears.length)
                              setSelectedYear(savedYears[0].toString());
                          }}
                          sx={{
                            color:
                              periodMode === 'year' ? 'var(--primary-color)' : 'var(--text-secondary-color)',
                            borderColor: 'var(--border-color)',
                            backgroundColor:
                              periodMode === 'year' ? 'var(--hover-color)' : 'inherit',
                            height: '32px',
                            fontSize: '12px',
                            px: 1,
                          }}
                        >
                          년도 ▼
                        </Button>
                      </ButtonGroup>
                      {/* 분기/반기/년도 드롭다운 */}
                      {periodMode === 'quarter' && (
                        <>
                          <Select
                            size="small"
                            value={selectedYear}
                            onChange={(e: SelectChangeEvent) =>
                              setSelectedYear(e.target.value)
                            }
                            sx={{
                              ml: 1,
                              color: '#e0e6ed',
                              minWidth: 80,
                              '.MuiOutlinedInput-notchedOutline': {
                                borderColor: '#2e3a4a',
                              },
                            }}
                          >
                            {savedYears.map((y: number) => (
                              <MenuItem key={y} value={y.toString()}>
                                {y}년
                              </MenuItem>
                            ))}
                          </Select>
                          <Select
                            size="small"
                            value={selectedQuarter}
                            onChange={(e: SelectChangeEvent) =>
                              setSelectedQuarter(e.target.value)
                            }
                            sx={{
                              ml: 1,
                              color: '#e0e6ed',
                              minWidth: 80,
                              '.MuiOutlinedInput-notchedOutline': {
                                borderColor: '#2e3a4a',
                              },
                            }}
                          >
                            <MenuItem value="1">1분기</MenuItem>
                            <MenuItem value="2">2분기</MenuItem>
                            <MenuItem value="3">3분기</MenuItem>
                            <MenuItem value="4">4분기</MenuItem>
                          </Select>
                        </>
                      )}
                      {periodMode === 'half' && (
                        <>
                          <Select
                            size="small"
                            value={selectedYear}
                            onChange={(e: SelectChangeEvent) =>
                              setSelectedYear(e.target.value)
                            }
                            sx={{
                              ml: 1,
                              color: '#e0e6ed',
                              minWidth: 80,
                              '.MuiOutlinedInput-notchedOutline': {
                                borderColor: '#2e3a4a',
                              },
                            }}
                          >
                            {savedYears.map((y: number) => (
                              <MenuItem key={y} value={y.toString()}>
                                {y}년
                              </MenuItem>
                            ))}
                          </Select>
                          <Select
                            size="small"
                            value={selectedHalf}
                            onChange={(e: SelectChangeEvent) =>
                              setSelectedHalf(e.target.value)
                            }
                            sx={{
                              ml: 1,
                              color: '#e0e6ed',
                              minWidth: 80,
                              '.MuiOutlinedInput-notchedOutline': {
                                borderColor: '#2e3a4a',
                              },
                            }}
                          >
                            <MenuItem value="1">전반기</MenuItem>
                            <MenuItem value="2">후반기</MenuItem>
                          </Select>
                        </>
                      )}
                      {periodMode === 'year' && (
                        <Select
                          size="small"
                          value={selectedYear}
                          onChange={(e: SelectChangeEvent) =>
                            setSelectedYear(e.target.value)
                          }
                          sx={{
                            ml: 1,
                            color: '#e0e6ed',
                            minWidth: 80,
                            '.MuiOutlinedInput-notchedOutline': {
                              borderColor: '#2e3a4a',
                            },
                          }}
                        >
                          {savedYears.map((y: number) => (
                            <MenuItem key={y} value={y.toString()}>
                              {y}년
                            </MenuItem>
                          ))}
                        </Select>
                      )}
                    </Box>
                  ),
                }}
              />
              <TableContainer
                sx={{ backgroundColor: 'var(--surface-color)', borderRadius: 1 }}
              >
                <Table size="small">
                  <TableHead>
                    <TableRow sx={{ backgroundColor: 'var(--background-color)' }}>
                      {estimateListDisplay.showAddress && (
                        <TableCell
                          sx={{ color: 'var(--text-secondary-color)', borderColor: 'var(--border-color)' }}
                        >
                          주소
                        </TableCell>
                      )}
                      {estimateListDisplay.showEstimateNo && (
                        <TableCell
                          sx={{ color: 'var(--text-secondary-color)', borderColor: 'var(--border-color)' }}
                        >
                          견적번호
                        </TableCell>
                      )}
                      {estimateListDisplay.showEstimateDate && (
                        <TableCell
                          sx={{ color: 'var(--text-secondary-color)', borderColor: 'var(--border-color)' }}
                        >
                          견적일자
                        </TableCell>
                      )}
                      {estimateListDisplay.showSavedDate && (
                        <TableCell
                          sx={{ color: 'var(--text-secondary-color)', borderColor: 'var(--border-color)' }}
                        >
                          저장일
                        </TableCell>
                      )}
                      {estimateListDisplay.showCustomerName && (
                        <TableCell
                          sx={{ color: 'var(--text-secondary-color)', borderColor: 'var(--border-color)' }}
                        >
                          고객명
                        </TableCell>
                      )}
                      {estimateListDisplay.showContact && (
                        <TableCell
                          sx={{ color: 'var(--text-secondary-color)', borderColor: 'var(--border-color)' }}
                        >
                          연락처
                        </TableCell>
                      )}
                      {estimateListDisplay.showProjectName && (
                        <TableCell
                          sx={{ color: 'var(--text-secondary-color)', borderColor: 'var(--border-color)' }}
                        >
                          프로젝트명
                        </TableCell>
                      )}
                      {estimateListDisplay.showProducts && (
                        <TableCell
                          sx={{ color: 'var(--text-secondary-color)', borderColor: 'var(--border-color)' }}
                        >
                          포함제품
                        </TableCell>
                      )}
                      {estimateListDisplay.showTotalAmount && (
                        <TableCell
                          sx={{ color: 'var(--text-secondary-color)', borderColor: 'var(--border-color)' }}
                        >
                          총금액
                        </TableCell>
                      )}
                      {estimateListDisplay.showDiscountedAmount && (
                        <TableCell
                          sx={{ color: 'var(--text-secondary-color)', borderColor: 'var(--border-color)' }}
                        >
                          할인후금액
                        </TableCell>
                      )}
                      {estimateListDisplay.showFinalizedAmount && (
                        <TableCell
                          sx={{ color: 'var(--text-secondary-color)', borderColor: 'var(--border-color)' }}
                        >
                          확정금액
                        </TableCell>
                      )}
                      {estimateListDisplay.showDiscountAmount && (
                        <TableCell
                          sx={{ color: 'var(--text-secondary-color)', borderColor: 'var(--border-color)' }}
                        >
                          할인금액
                        </TableCell>
                      )}
                      {estimateListDisplay.showDiscountRate && (
                        <TableCell
                          sx={{ color: 'var(--text-secondary-color)', borderColor: 'var(--border-color)' }}
                        >
                          할인율(%)
                        </TableCell>
                      )}
                      {estimateListDisplay.showMargin && (
                        <TableCell
                          sx={{ color: 'var(--text-secondary-color)', borderColor: 'var(--border-color)' }}
                        >
                          마진
                        </TableCell>
                      )}
                      {estimateListDisplay.showActions && (
                        <TableCell
                          sx={{ color: 'var(--text-secondary-color)', borderColor: 'var(--border-color)' }}
                        >
                          작업
                        </TableCell>
                      )}
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {filteredSavedEstimatesList.length > 0 ? (
                      filteredSavedEstimatesList.map((est: any, index: number) => {
                        const discountedAmount =
                          est.discountedAmount ??
                          est.totalAmount - est.discountAmount;
                        const status = getEstimateStatus(est);
                        // 견적서 ID, estimateNo, 인덱스를 사용하여 안정적인 키 생성
                        const key = `estimate-${est.id || 'no-id'}-${est.estimateNo || 'no-estimate-no'}-${index}`;

                        // 그룹 정보 가져오기
                        const { colorIndex, isLatest, isFinal } =
                          getEstimateGroupInfo(est, filteredSavedEstimatesList);
                        
                        // 발주완료 상태 확인
                        const isOrderCompleted = status === '발주완료' || status === '납품완료';
                        
                        // 계약완료 상태 확인 (해당 견적서로 생성된 계약서가 있는지 확인)
                        const hasContract = (() => {
                          try {
                            const contracts = JSON.parse(localStorage.getItem('contracts') || '[]');
                            return contracts.some((contract: any) => contract.estimateNo === est.estimateNo);
                          } catch {
                            return false;
                          }
                        })();
                        
                        // 배경색 결정: 발주완료 > Final > 일반 순서로 우선순위
                        let backgroundColor;
                        let specialStyle = {};
                        
                        if (isOrderCompleted) {
                          // 발주완료된 견적서는 초록색 배경
                          backgroundColor = '#4caf50';
                          specialStyle = {
                            backgroundColor: '#4caf50',
                            border: '2px solid #2e7d32',
                            '&:hover': {
                              backgroundColor: '#66bb6a',
                              border: '2px solid #388e3c',
                            },
                          };
                        } else if (isFinal) {
                          // Final 견적서는 일반 견적서와 동일한 배경색 사용
                          backgroundColor = 'var(--surface-color)';
                          specialStyle = {
                            backgroundColor: 'var(--surface-color)',
                            border: '2px solid var(--primary-color)',
                            '&:hover': {
                              backgroundColor: 'var(--hover-color)',
                              border: '2px solid var(--primary-color)',
                            },
                          };
                        } else {
                          // 일반 견적서는 기본 배경색
                          backgroundColor = 'var(--surface-color)';
                        }

                        return (
                          <TableRow
                            key={key}
                            hover
                            onDoubleClick={() => handleLoadSavedEstimate(est)}
                            sx={{
                              cursor: 'pointer',
                              backgroundColor: backgroundColor,
                              fontSize: 'calc(1em + 1px)', // 1px 크게
                              '&:hover': {
                                backgroundColor: isOrderCompleted
                                  ? '#66bb6a'
                                  : 'var(--hover-color)',
                                transition: 'background-color 0.2s ease',
                              },
                              ...specialStyle,
                            }}
                          >
                            {estimateListDisplay.showAddress && (
                              <TableCell
                                sx={{
                                  color: isOrderCompleted ? '#ffffff' : 'var(--text-color)',
                                  borderColor: 'var(--border-color)',
                                  fontSize: 'calc(1em + 1px)', // 1px 크게
                                  fontWeight: isOrderCompleted || isFinal ? 'bold' : 'normal',
                                  textShadow: isOrderCompleted ? 'none' : 'none',
                                  '&:hover': {
                                    color: isOrderCompleted ? '#ffffff' : 'var(--text-color)',
                                    textShadow: isOrderCompleted ? 'none' : 'none',
                                  },
                                }}
                              >
                                {est.address}
                                {hasContract && (
                                  <Chip
                                    label="계약완료"
                                    size="small"
                                    sx={{
                                      ml: 1,
                                      backgroundColor: '#ff9800',
                                      color: '#ffffff',
                                      fontSize: '0.7rem',
                                      height: '20px',
                                      fontWeight: 'bold',
                                    }}
                                  />
                                )}
                              </TableCell>
                            )}
                            {estimateListDisplay.showEstimateNo && (
                              <TableCell
                                sx={{
                                  color: isOrderCompleted ? '#ffffff' : 'var(--text-color)',
                                  borderColor: 'var(--border-color)',
                                  fontWeight: isOrderCompleted || isFinal ? 'bold' : 'bold',
                                  fontSize: 'calc(1em + 1px)', // 1px 크게
                                  textShadow: isOrderCompleted ? 'none' : 'none',
                                  '&:hover': {
                                    color: isOrderCompleted ? '#ffffff' : 'var(--text-color)',
                                    textShadow: isOrderCompleted ? 'none' : 'none',
                                  },
                                }}
                              >
                                {est.estimateNo}
                                {isOrderCompleted && (
                                  <Chip
                                    label="발주완료"
                                    size="small"
                                    sx={{
                                      ml: 1,
                                      backgroundColor: '#4caf50',
                                      color: '#ffffff',
                                      fontSize: '0.7rem',
                                      height: '20px',
                                      fontWeight: 'bold',
                                    }}
                                  />
                                )}
                                {isFinal && !isOrderCompleted && (
                                  <Chip
                                    label="Final"
                                    size="small"
                                    sx={{
                                      ml: 1,
                                      backgroundColor: 'var(--primary-color)',
                                      color: '#ffffff',
                                      fontSize: '0.7rem',
                                      height: '20px',
                                      fontWeight: 'bold',
                                    }}
                                  />
                                )}
                              </TableCell>
                            )}
                            {estimateListDisplay.showEstimateDate && (
                              <TableCell
                                sx={{
                                  color: isOrderCompleted ? '#ffffff' : 'var(--text-color)',
                                  borderColor: 'var(--border-color)',
                                  fontSize: 'calc(1em + 1px)', // 1px 크게
                                  fontWeight: isOrderCompleted || isFinal ? 'bold' : 'normal',
                                  textShadow: isOrderCompleted ? 'none' : 'none',
                                  '&:hover': {
                                    color: isOrderCompleted ? '#ffffff' : 'var(--text-color)',
                                    textShadow: isOrderCompleted ? 'none' : 'none',
                                  },
                                }}
                              >
                                {est.estimateDate}
                              </TableCell>
                            )}
                            {estimateListDisplay.showSavedDate && (
                              <TableCell
                                sx={{
                                  color: isOrderCompleted ? '#ffffff' : 'var(--text-color)',
                                  borderColor: 'var(--border-color)',
                                  fontSize: 'calc(1em + 1px)', // 1px 크게
                                  fontWeight: isOrderCompleted || isFinal ? 'bold' : 'normal',
                                  textShadow: isOrderCompleted ? 'none' : 'none',
                                  '&:hover': {
                                    color: isOrderCompleted ? '#ffffff' : 'var(--text-color)',
                                    textShadow: isOrderCompleted ? 'none' : 'none',
                                  },
                                }}
                              >
                                {est.savedAt
                                  ? new Date(est.savedAt).toLocaleString()
                                  : '-'}
                              </TableCell>
                            )}
                            {estimateListDisplay.showCustomerName && (
                              <TableCell
                                sx={{
                                  color: isOrderCompleted ? '#ffffff' : 'var(--text-color)',
                                  borderColor: 'var(--border-color)',
                                  fontSize: 'calc(1em + 1px)', // 1px 크게
                                  fontWeight: isOrderCompleted || isFinal ? 'bold' : 'normal',
                                  textShadow: isOrderCompleted ? 'none' : 'none',
                                  '&:hover': {
                                    color: isOrderCompleted ? '#ffffff' : 'var(--text-color)',
                                    textShadow: isOrderCompleted ? 'none' : 'none',
                                  },
                                }}
                              >
                                {est.customerName}
                              </TableCell>
                            )}
                            {estimateListDisplay.showContact && (
                              <TableCell
                                sx={{
                                  color: isOrderCompleted ? '#ffffff' : 'var(--text-color)',
                                  borderColor: 'var(--border-color)',
                                  fontSize: 'calc(1em + 1px)', // 1px 크게
                                  fontWeight: isOrderCompleted || isFinal ? 'bold' : 'normal',
                                  textShadow: isOrderCompleted ? 'none' : 'none',
                                  '&:hover': {
                                    color: isOrderCompleted ? '#ffffff' : 'var(--text-color)',
                                    textShadow: isOrderCompleted ? 'none' : 'none',
                                  },
                                }}
                              >
                                {est.contact}
                              </TableCell>
                            )}
                            {estimateListDisplay.showProjectName && (
                              <TableCell
                                sx={{
                                  color: isOrderCompleted ? '#ffffff' : 'var(--text-color)',
                                  borderColor: 'var(--border-color)',
                                  fontSize: 'calc(1em + 1px)', // 1px 크게
                                  fontWeight: isOrderCompleted || isFinal ? 'bold' : 'normal',
                                  textShadow: isOrderCompleted ? 'none' : 'none',
                                  '&:hover': {
                                    color: isOrderCompleted ? '#ffffff' : 'var(--text-color)',
                                    textShadow: isOrderCompleted ? 'none' : 'none',
                                  },
                                }}
                              >
                                {est.projectName}
                              </TableCell>
                            )}
                            {estimateListDisplay.showProducts && (
                              <TableCell
                                sx={{
                                  color: isOrderCompleted ? '#ffffff' : 'var(--text-color)',
                                  borderColor: 'var(--border-color)',
                                  fontSize: 'calc(1em + 1px)', // 1px 크게
                                  fontWeight: isOrderCompleted || isFinal ? 'bold' : 'normal',
                                  textShadow: isOrderCompleted ? 'none' : 'none',
                                  '&:hover': {
                                    color: isOrderCompleted ? '#ffffff' : 'var(--text-color)',
                                    textShadow: isOrderCompleted ? 'none' : 'none',
                                  },
                                }}
                              >
                                <Tooltip
                                  title={est.rows
                                    .map((r: any) => r.productName)
                                    .join(', ')}
                                >
                                  <span>
                                    {est.rows
                                      .map((r: any) => r.productName)
                                      .join(', ')
                                      .substring(0, 20)}
                                    {est.rows
                                      .map((r: any) => r.productName)
                                      .join(', ').length > 20 && '...'}
                                  </span>
                                </Tooltip>
                              </TableCell>
                            )}
                            {estimateListDisplay.showTotalAmount && (
                              <TableCell
                                sx={{
                                  color: isOrderCompleted ? '#ffffff' : 'var(--text-color)',
                                  borderColor: 'var(--border-color)',
                                  fontSize: 'calc(1em + 1px)', // 1px 크게
                                  fontWeight: isOrderCompleted || isFinal ? 'bold' : 'normal',
                                  textShadow: isOrderCompleted ? 'none' : 'none',
                                  '&:hover': {
                                    color: isOrderCompleted ? '#ffffff' : 'var(--text-color)',
                                    textShadow: isOrderCompleted ? 'none' : 'none',
                                  },
                                }}
                              >
                                {est.totalAmount?.toLocaleString()}원
                              </TableCell>
                            )}
                            {estimateListDisplay.showDiscountedAmount && (
                              <TableCell
                                sx={{
                                  color: isOrderCompleted ? '#ffffff' : 'var(--text-color)',
                                  borderColor: 'var(--border-color)',
                                  fontSize: 'calc(1em + 1px)', // 1px 크게
                                  fontWeight: isOrderCompleted || isFinal ? 'bold' : 'normal',
                                  textShadow: isOrderCompleted ? 'none' : 'none',
                                  '&:hover': {
                                    color: isOrderCompleted ? '#ffffff' : 'var(--text-color)',
                                    textShadow: isOrderCompleted ? 'none' : 'none',
                                  },
                                }}
                              >
                                {discountedAmount.toLocaleString()} 원
                              </TableCell>
                            )}
                            {estimateListDisplay.showFinalizedAmount && (
                              <TableCell
                                sx={{
                                  color: isOrderCompleted ? '#ffffff' : 'var(--text-color)',
                                  borderColor: 'var(--border-color)',
                                  fontSize: 'calc(1em + 1px)',
                                  fontWeight: isOrderCompleted || isFinal ? 'bold' : 'normal',
                                  textShadow: isOrderCompleted ? 'none' : 'none',
                                  '&:hover': {
                                    color: isOrderCompleted ? '#ffffff' : 'var(--text-color)',
                                    textShadow: isOrderCompleted ? 'none' : 'none',
                                  },
                                }}
                              >
                                {Number(est.finalizedAmount || 0) > 0
                                  ? Number(est.finalizedAmount || 0).toLocaleString() + ' 원'
                                  : '-'}
                              </TableCell>
                            )}
                            {estimateListDisplay.showDiscountAmount && (
                              <TableCell
                                sx={{
                                  color: isOrderCompleted ? '#ffffff' : 'var(--text-color)',
                                  borderColor: 'var(--border-color)',
                                  fontSize: 'calc(1em + 1px)', // 1px 크게
                                  fontWeight: isOrderCompleted || isFinal ? 'bold' : 'normal',
                                  textShadow: isOrderCompleted ? 'none' : 'none',
                                  '&:hover': {
                                    color: isOrderCompleted ? '#ffffff' : 'var(--text-color)',
                                    textShadow: isOrderCompleted ? 'none' : 'none',
                                  },
                                }}
                              >
                                {est.discountAmount?.toLocaleString()}원
                              </TableCell>
                            )}
                            {estimateListDisplay.showDiscountRate && (
                              <TableCell
                                sx={{
                                  color: isOrderCompleted ? '#ffffff' : isFinal ? '#ffffff' : '#000000',
                                  borderColor: 'var(--border-color)',
                                  fontSize: 'calc(1em + 1px)', // 1px 크게
                                  fontWeight: isOrderCompleted || isFinal ? 'bold' : 'normal',
                                  textShadow: isOrderCompleted || isFinal ? 'none' : 'none',
                                  '&:hover': {
                                    color: isOrderCompleted ? '#ffffff' : isFinal ? '#ffffff' : '#000000',
                                    textShadow: isOrderCompleted || isFinal ? 'none' : 'none',
                                  },
                                }}
                              >
                                {est.totalAmount > 0 && est.discountAmount > 0
                                  ? (
                                    (est.discountAmount / est.totalAmount) *
                                    100
                                  ).toFixed(1) + '%'
                                  : '0.0%'}
                              </TableCell>
                            )}
                            {estimateListDisplay.showMargin && (
                              <TableCell
                                sx={{
                                  color: isOrderCompleted ? '#ffffff' : isFinal ? '#ffffff' : '#000000',
                                  borderColor: 'var(--border-color)',
                                  fontSize: 'calc(1em + 1px)', // 1px 크게
                                  fontWeight: isOrderCompleted || isFinal ? 'bold' : 'normal',
                                  textShadow: isOrderCompleted || isFinal ? 'none' : 'none',
                                  '&:hover': {
                                    color: isOrderCompleted ? '#ffffff' : isFinal ? '#ffffff' : '#000000',
                                    textShadow: isOrderCompleted || isFinal ? 'none' : 'none',
                                  },
                                }}
                              >
                                {est.margin?.toLocaleString()}원
                              </TableCell>
                            )}

                            {estimateListDisplay.showActions && (
                              <TableCell sx={{ 
                                borderColor: 'var(--border-color)',
                                fontSize: 'calc(1em + 1px)', // 1px 크게
                                color: isOrderCompleted ? '#ffffff' : isFinal ? '#ffffff' : '#000000',
                                fontWeight: isOrderCompleted || isFinal ? 'bold' : 'normal',
                                textShadow: isOrderCompleted || isFinal ? 'none' : 'none',
                                '&:hover': {
                                  color: isOrderCompleted ? '#ffffff' : isFinal ? '#ffffff' : '#000000',
                                  textShadow: isOrderCompleted || isFinal ? 'none' : 'none',
                                },
                              }}>




                                {status === '계약진행중' && (
                                  <>
                                    <Button
                                      size={isMobile ? "large" : "small"}
                                      variant="contained"
                                      color="warning"
                                      sx={{
                                        mr: 1,
                                        fontWeight: 'bold',
                                        minWidth: isMobile ? 100 : 80,
                                        color: '#ffffff',
                                        fontSize: isMobile ? 16 : 12,
                                        py: isMobile ? 1.5 : 0.5,
                                        px: isMobile ? 3 : 1,
                                        touchAction: 'manipulation',
                                        WebkitTapHighlightColor: 'transparent',
                                        '&:active': {
                                          transform: 'scale(0.95)',
                                        },
                                      }}
                                      onClick={(e) => {
                                        e.preventDefault();
                                        e.stopPropagation();
                                        handleViewContract(est);
                                      }}
                                    >
                                      계약진행중
                                    </Button>
                                    <Button
                                      size={isMobile ? "large" : "small"}
                                      variant="outlined"
                                      color="error"
                                      sx={{ 
                                        mr: 1, 
                                        minWidth: isMobile ? 80 : 60,
                                        fontSize: isMobile ? 16 : 12,
                                        py: isMobile ? 1.5 : 0.5,
                                        px: isMobile ? 3 : 1,
                                        touchAction: 'manipulation',
                                        WebkitTapHighlightColor: 'transparent',
                                        '&:active': {
                                          transform: 'scale(0.95)',
                                        },
                                      }}
                                      onClick={(e) => {
                                        e.preventDefault();
                                        e.stopPropagation();
                                        handleCancelContract(est);
                                      }}
                                    >
                                      취소
                                    </Button>
                                  </>
                                )}

                                {status === '계약완료' && (
                                  <Button
                                    size={isMobile ? "large" : "small"}
                                    variant="contained"
                                    color="success"
                                    sx={{
                                      mr: 1,
                                      fontWeight: 'bold',
                                      minWidth: isMobile ? 100 : 80,
                                      color: '#ffffff',
                                      fontSize: isMobile ? 16 : 12,
                                      py: isMobile ? 1.5 : 0.5,
                                      px: isMobile ? 3 : 1,
                                      touchAction: 'manipulation',
                                      WebkitTapHighlightColor: 'transparent',
                                      '&:active': {
                                        transform: 'scale(0.95)',
                                      },
                                    }}
                                    onClick={(e) => {
                                      e.preventDefault();
                                      e.stopPropagation();
                                      handleViewContract(est);
                                    }}
                                  >
                                    계약완료
                                  </Button>
                                )}

                                {status === '발주완료' && (
                                  <Button
                                    size={isMobile ? "large" : "small"}
                                    variant="contained"
                                    color="secondary"
                                    sx={{
                                      mr: 1,
                                      fontWeight: 'bold',
                                      minWidth: isMobile ? 100 : 80,
                                      color: '#ffffff',
                                      fontSize: isMobile ? 16 : 12,
                                      py: isMobile ? 1.5 : 0.5,
                                      px: isMobile ? 3 : 1,
                                      touchAction: 'manipulation',
                                      WebkitTapHighlightColor: 'transparent',
                                      '&:active': {
                                        transform: 'scale(0.95)',
                                      },
                                    }}
                                    onClick={(e) => {
                                      e.preventDefault();
                                      e.stopPropagation();
                                      handleViewOrder(est);
                                    }}
                                  >
                                    발주완료
                                  </Button>
                                )}

                                {status === '납품완료' && (
                                  <Button
                                    size={isMobile ? "large" : "small"}
                                    variant="contained"
                                    sx={{
                                      mr: 1,
                                      backgroundColor: '#607d8b',
                                      '&:hover': { backgroundColor: '#455a64' },
                                      fontWeight: 'bold',
                                      minWidth: isMobile ? 100 : 80,
                                      color: '#ffffff',
                                      fontSize: isMobile ? 16 : 12,
                                      py: isMobile ? 1.5 : 0.5,
                                      px: isMobile ? 3 : 1,
                                      touchAction: 'manipulation',
                                      WebkitTapHighlightColor: 'transparent',
                                      '&:active': {
                                        transform: 'scale(0.95)',
                                      },
                                    }}
                                    onClick={(e) => {
                                      e.preventDefault();
                                      e.stopPropagation();
                                      handleViewOrder(est);
                                    }}
                                  >
                                    납품완료
                                  </Button>
                                )}

                                {/* 공통 버튼들 */}
                                <IconButton
                                  size="small"
                                  onClick={() => handleLoadSavedEstimate(est)}
                                  sx={{
                                    mr: 1,
                                    color: 'var(--text-secondary-color)',
                                    '&:hover': { backgroundColor: 'var(--hover-color)' },
                                  }}
                                  title="불러오기"
                                >
                                  <EditIcon fontSize="small" />
                                </IconButton>

                                <IconButton
                                  size="small"
                                  onClick={() => {
                                    setSelectedEstimateForPrint(est);
                                    setShowEstimateTemplate(true);
                                  }}
                                  sx={{
                                    mr: 1,
                                    color: 'var(--primary-color)',
                                    '&:hover': { backgroundColor: 'var(--hover-color)' },
                                  }}
                                  title="출력하기"
                                >
                                  <PrintIcon fontSize="small" />
                                </IconButton>

                                <IconButton
                                  size="small"
                                  onClick={async () => {
                                    if (
                                      window.confirm(
                                        '정말로 이 견적서를 삭제하시겠습니까?'
                                      )
                                    ) {
                                      try {
                                        console.log('=== 견적서 삭제 시작 ===');
                                        console.log('삭제할 견적서 번호:', est.estimateNo);
                                        console.log('견적서 ID 타입:', typeof est.id);
                                        console.log('견적서 ID 값:', est.id);

                                        // 문서 ID 결정 로직: firebaseId 또는 id(문서 ID로 통일됨) 우선, 없으면 estimateNo 폴백
                                        let firestoreId: string = ((est as any).firebaseId as string) ?? (typeof est.id === 'string' ? est.id : '');
                                        if (!firestoreId) {
                                          console.log('문서 ID를 찾지 못해 estimateNo로 폴백합니다:', est.estimateNo);
                                          firestoreId = est.estimateNo as string;
                                        }

                                        // Firebase 서버에서 견적서 삭제 (실제 Firestore 문서 ID 사용)
                                        const response = await fetch(`${API_BASE}/estimates/${encodeURIComponent(String(firestoreId))}`, {
                                          method: 'DELETE',
                                          headers: {
                                            'Content-Type': 'application/json',
                                          },
                                        });

                                        console.log('Firebase 삭제 응답:', response.status, response.statusText);

                                        if (response.ok) {
                                          console.log('Firebase에서 견적서 삭제 성공');
                                          
                                          // Firebase 삭제 성공 시에만 localStorage에서도 삭제
                                          console.log('삭제 전 견적서 개수:', savedEstimates.length);
                                          console.log('삭제할 견적서 번호:', est.estimateNo);
                                          console.log('사용한 삭제 ID:', firestoreId);
                                          
                                          // localStorage에서 견적서 삭제 (정확히 해당 견적서만)
                                          const updatedSavedEstimates =
                                            savedEstimates.filter((e: any) => {
                                              const fid = (e as any).firebaseId || (typeof e.id === 'string' ? e.id : undefined);
                                              return fid !== firestoreId && e.estimateNo !== est.estimateNo;
                                            });
                                          
                                          console.log('삭제 후 견적서 개수:', updatedSavedEstimates.length);
                                          console.log('삭제 완료 - 견적서 번호:', est.estimateNo);
                                          
                                          // 상태 업데이트 (즉시 반영)
                                          setSavedEstimates(updatedSavedEstimates);

                                          // 성공 메시지 표시
                                          alert('견적서가 삭제되었습니다.');
                                        } else {
                                          const errorText = await response.text();
                                          console.error('Firebase 삭제 실패:', response.status, response.statusText, errorText);
                                          alert('서버에서 견적서 삭제에 실패했습니다. 잠시 후 다시 시도해주세요.');
                                          return;
                                        }
                                      } catch (error) {
                                        console.error('견적서 삭제 중 오류:', error);
                                        alert('견적서 삭제 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.');
                                      }
                                    }
                                  }}
                                  sx={{
                                    color: '#f44336',
                                    '&:hover': { backgroundColor: 'var(--hover-color)' },
                                  }}
                                  title="삭제"
                                >
                                  <DeleteIcon fontSize="small" />
                                </IconButton>
                              </TableCell>
                            )}
                          </TableRow>
                        );
                      })
                    ) : (
                      <TableRow>
                        <TableCell
                          colSpan={5}
                          align="center"
                          sx={{ color: 'var(--text-secondary-color)', backgroundColor: 'var(--surface-color)' }}
                        >
                          저장된 견적서가 없습니다
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </TableContainer>
            </>
          )}
        </Paper>
      </Grid>

      {/* 계약 목록 모달 */}
      <ContractListModal
        open={contractListModalOpen}
        onClose={() => setContractListModalOpen(false)}
        onSelectContract={handleSelectContract}
      />

      {/* 시공기사 관리 모달 */}
      <Dialog
        open={installerModalOpen}
        onClose={() => setInstallerModalOpen(false)}
        maxWidth="md"
        fullWidth
        fullScreen={isMobile}
      >
        <DialogTitle sx={{ color: 'var(--text-color)' }}>
          시공기사 관리
        </DialogTitle>
        <DialogContent sx={{ backgroundColor: 'var(--surface-color)' }}>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="거래처명"
                value={newInstaller.vendorName}
                onChange={(e) => setNewInstaller(prev => ({ ...prev, vendorName: e.target.value }))}
                size="small"
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="거래처 연락처"
                value={newInstaller.vendorPhone}
                onChange={(e) => setNewInstaller(prev => ({ ...prev, vendorPhone: e.target.value }))}
                size="small"
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="시공기사명"
                value={newInstaller.installerName}
                onChange={(e) => setNewInstaller(prev => ({ ...prev, installerName: e.target.value }))}
                size="small"
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="시공기사 연락처"
                value={newInstaller.installerPhone}
                onChange={(e) => setNewInstaller(prev => ({ ...prev, installerPhone: e.target.value }))}
                size="small"
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="차량번호"
                value={newInstaller.vehicleNumber}
                onChange={(e) => setNewInstaller(prev => ({ ...prev, vehicleNumber: e.target.value }))}
                size="small"
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="메모"
                value={newInstaller.memo}
                onChange={(e) => setNewInstaller(prev => ({ ...prev, memo: e.target.value }))}
                multiline
                rows={3}
                size="small"
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions sx={{ backgroundColor: 'var(--surface-color)' }}>
          <Button onClick={() => setInstallerModalOpen(false)}>
            취소
          </Button>
          <Button
            variant="contained"
            onClick={handleAddInstaller}
            disabled={!newInstaller.vendorName || !newInstaller.installerName}
          >
            추가
          </Button>
        </DialogActions>
      </Dialog>

      {/* 고객리스트 모달 */}
      <Dialog
        open={customerListDialogOpen}
        onClose={() => setCustomerListDialogOpen(false)}
        maxWidth="lg"
        fullWidth
        fullScreen={isMobile}
        disableEnforceFocus
        disableAutoFocus
        PaperProps={{
          sx: {
            backgroundColor: '#1e2633',
            ...(isMobile && {
              margin: 0,
              borderRadius: 0,
              height: '100%',
            }),
          },
        }}
      >
        <DialogTitle sx={{
          backgroundColor: '#1e2633',
          borderBottom: 1,
          borderColor: '#2e3a4a',
          position: 'relative'
        }}>
          {isMobile && (
            <IconButton
              onClick={() => setCustomerListDialogOpen(false)}
              sx={{
                position: 'absolute',
                left: 8,
                top: 8,
                color: '#b0b8c1',
                zIndex: 1,
              }}
            >
              <ArrowBackIcon />
            </IconButton>
          )}
          <Typography
            variant="h6"
            sx={{
              flex: 1,
              textAlign: isMobile ? 'center' : 'left',
              color: 'var(--text-color)',
              fontSize: isMobile ? '1.2rem' : '1.25rem',
              fontWeight: 600,
            }}
          >
            고객 목록
          </Typography>
        </DialogTitle>
        <DialogContent sx={{
          p: isMobile ? 2 : 3,
          backgroundColor: 'var(--surface-color)',
          '& .MuiDialogContent-root': {
            backgroundColor: 'var(--surface-color)',
          }
        }}>
          <TextField
            fullWidth
            label="고객 검색"
            value={customerSearch}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
              setCustomerSearch(e.target.value)
            }
            placeholder="고객명, 연락처, 주소, 프로젝트명으로 검색"
            sx={{
              mb: 2,
              '& .MuiInputLabel-root': { color: 'var(--text-secondary-color)' },
              '& .MuiOutlinedInput-root': {
                backgroundColor: 'var(--background-color)',
                '& fieldset': { borderColor: 'var(--border-color)' },
                '&:hover fieldset': { borderColor: 'var(--primary-color)' },
                '&.Mui-focused fieldset': { borderColor: 'var(--primary-color)' },
              },
              '& .MuiInputBase-input': { color: 'var(--text-color)' },
            }}
            size={isMobile ? "medium" : "small"}
          />
          <TableContainer component={Paper} sx={{
            maxHeight: isMobile ? '70vh' : 500,
            backgroundColor: 'var(--surface-color)',
            '& .MuiTable-root': {
              backgroundColor: 'var(--surface-color)',
            },
            '& .MuiTableCell-root': {
              color: 'var(--text-color)',
              borderColor: 'var(--border-color)',
            },
            '& .MuiTableHead-root .MuiTableCell-root': {
              backgroundColor: 'var(--background-color)',
              color: 'var(--text-secondary-color)',
              fontWeight: 600,
            },
            '& .MuiTableRow-root:hover': {
              backgroundColor: 'var(--hover-color)',
            },
          }}>
            <Table stickyHeader size={isMobile ? "medium" : "small"}>
              <TableHead>
                <TableRow>
                  <TableCell>고객명</TableCell>
                  <TableCell>연락처</TableCell>
                  <TableCell>비상연락처</TableCell>
                  <TableCell>주소</TableCell>
                  <TableCell>프로젝트</TableCell>
                  <TableCell>타입</TableCell>
                  <TableCell>작업</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredCustomerOptions.map((customer, index) => (
                  <TableRow key={index} hover>
                    <TableCell>{customer.name}</TableCell>
                    <TableCell>{customer.tel}</TableCell>
                    <TableCell>{customer.emergencyTel}</TableCell>
                    <TableCell>{customer.address}</TableCell>
                    <TableCell>
                      {customer.projects && customer.projects.length > 0
                        ? customer.projects.map((project: any, idx: number) => (
                          <Chip
                            key={idx}
                            label={project.projectName || '기본'}
                            size="small"
                            sx={{ mr: 0.5, mb: 0.5 }}
                          />
                        ))
                        : '-'}
                    </TableCell>
                    <TableCell>
                      {customer.projects && customer.projects.length > 0
                        ? customer.projects.map((project: any, idx: number) => (
                          <Chip
                            key={idx}
                            label={project.projectType || '-'}
                            size="small"
                            variant="outlined"
                            sx={{ mr: 0.5, mb: 0.5 }}
                          />
                        ))
                        : '-'}
                    </TableCell>
                    <TableCell>
                      <Button
                        size={isMobile ? "medium" : "small"}
                        variant="contained"
                        onClick={() => {
                          console.log('고객 선택됨:', customer);
                          console.log('프로젝트 정보:', customer.projects);
                          console.log(
                            '프로젝트 개수:',
                            customer.projects?.length
                          );

                          if (
                            customer.projects &&
                            customer.projects.length > 1
                          ) {
                            console.log(
                              '프로젝트가 2개 이상 - 프로젝트 선택 다이얼로그 열기'
                            );
                            setProjectOptions(customer.projects);
                            setPendingCustomer(customer);
                            setProjectSelectDialogOpen(true);
                            setCustomerListDialogOpen(false);
                          } else if (
                            customer.projects &&
                            customer.projects.length === 1
                          ) {
                            console.log('프로젝트가 1개 - 바로 선택');
                            setMeta(prev => ({
                              ...prev,
                              customerName: customer.name,
                              contact: customer.tel,
                              emergencyContact: customer.emergencyTel,
                              address:
                                customer.projects[0].address ||
                                customer.address,
                              projectName:
                                customer.projects[0].projectName || '',
                              type: customer.projects[0].projectType || '',
                            }));
                            setCustomerListDialogOpen(false);
                          } else {
                            console.log('프로젝트 없음 - 기본 정보만 입력');
                            setMeta(prev => ({
                              ...prev,
                              customerName: customer.name,
                              contact: customer.tel,
                              emergencyContact: customer.emergencyTel,
                              address: customer.address,
                              projectName: '',
                              type: '',
                            }));
                            setCustomerListDialogOpen(false);
                          }
                        }}
                        sx={{
                          backgroundColor: 'var(--primary-color)',
                          minHeight: isMobile ? '44px' : 'auto',
                          fontSize: isMobile ? '0.9rem' : '0.875rem',
                          '&:hover': {
                            backgroundColor: 'var(--primary-hover-color)'
                          }
                        }}
                      >
                        선택
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </DialogContent>
        {!isMobile && (
          <DialogActions sx={{
            borderTop: 1,
            borderColor: 'var(--border-color)',
            p: 2,
            backgroundColor: 'var(--surface-color)'
          }}>
            <Button
              onClick={() => setCustomerListDialogOpen(false)}
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
        )}
      </Dialog>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={3000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        message={snackbar.message}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      />

      {/* 레일 수정 모달 */}
      <Dialog
        open={railEditOpen}
        onClose={handleRailEditClose}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>레일 정보 수정</DialogTitle>
        <DialogContent>
          <Box sx={{ mt: 2 }}>
            {railEditData?.railItems.map((item, index) => (
              <Box
                key={index}
                sx={{ display: 'flex', gap: 2, mb: 2, alignItems: 'center' }}
              >
                <TextField
                  label="공간"
                  value={item.space}
                  onChange={e =>
                    handleRailItemChange(index, 'space', e.target.value)
                  }
                  size="small"
                  sx={{ minWidth: 120 }}
                />
                <TextField
                  label="길이(자)"
                  type="number"
                  value={item.length}
                  onChange={e =>
                    handleRailItemChange(
                      index,
                      'length',
                      Number(e.target.value)
                    )
                  }
                  size="small"
                  sx={{ minWidth: 100 }}
                />
                <TextField
                  label="수량"
                  type="number"
                  value={item.count}
                  onChange={e =>
                    handleRailItemChange(index, 'count', Number(e.target.value))
                  }
                  size="small"
                  sx={{ minWidth: 100 }}
                />
                <IconButton
                  onClick={() => handleRemoveRailItem(index)}
                  color="error"
                  size="small"
                >
                  <DeleteIcon />
                </IconButton>
              </Box>
            ))}
            <Button
              variant="outlined"
              onClick={handleAddRailItem}
              startIcon={<AddIcon />}
              sx={{ mt: 1 }}
            >
              레일 항목 추가
            </Button>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleRailEditClose}>취소</Button>
          <Button onClick={handleRailEditSave} variant="contained">
            저장
          </Button>
        </DialogActions>
      </Dialog>

      {/* 프로젝트 선택 다이얼로그 */}
      <Dialog
        open={projectSelectDialogOpen}
        onClose={() => setProjectSelectDialogOpen(false)}
        maxWidth="sm"
        fullWidth
        fullScreen={isMobile}
        PaperProps={{
          sx: {
            backgroundColor: '#1e2633',
            ...(isMobile && {
              margin: 0,
              borderRadius: 0,
              height: '100%',
            }),
          },
        }}
      >
        <DialogTitle sx={{
          backgroundColor: '#1e2633',
          borderBottom: 1,
          borderColor: '#2e3a4a',
          position: 'relative'
        }}>
          {isMobile && (
            <IconButton
              onClick={() => setProjectSelectDialogOpen(false)}
              sx={{
                position: 'absolute',
                left: 8,
                top: 8,
                color: '#b0b8c1',
                zIndex: 1,
              }}
            >
              <ArrowBackIcon />
            </IconButton>
          )}
          <Typography
            variant="h6"
            sx={{
              flex: 1,
              textAlign: isMobile ? 'center' : 'left',
              color: '#e0e6ed',
              fontSize: isMobile ? '1.2rem' : '1.25rem',
              fontWeight: 600,
            }}
          >
            프로젝트 선택
          </Typography>
        </DialogTitle>
        <DialogContent sx={{
          p: isMobile ? 2 : 3,
          backgroundColor: '#1e2633',
          '& .MuiDialogContent-root': {
            backgroundColor: '#1e2633',
          }
        }}>
          <List sx={{
            '& .MuiListItem-root': {
              color: '#e0e6ed',
              borderBottom: 1,
              borderColor: '#2e3a4a',
              '&:hover': {
                backgroundColor: '#263040',
              },
            },
            '& .MuiListItemText-primary': {
              color: '#e0e6ed',
              fontSize: isMobile ? '1rem' : '0.875rem',
              fontWeight: 500,
            },
            '& .MuiListItemText-secondary': {
              color: '#b0b8c1',
              fontSize: isMobile ? '0.9rem' : '0.75rem',
            },
          }}>
            {projectOptions.map((project, idx) => (
              <ListItem
                button
                key={project.id || idx}
                sx={{
                  minHeight: isMobile ? '64px' : 'auto',
                  py: isMobile ? 2 : 1,
                }}
                onClick={() => {
                  setMeta(prev => ({
                    ...prev,
                    customerName: pendingCustomer.name,
                    contact: pendingCustomer.tel,
                    emergencyContact: pendingCustomer.emergencyTel,
                    address: project.address || pendingCustomer.address,
                    projectName: project.projectName || '',
                    type: project.projectType || '',
                  }));
                  setProjectSelectDialogOpen(false);
                }}
              >
                <ListItemText
                  primary={`${project.projectName} (${project.projectType})`}
                  secondary={project.address ? `주소: ${project.address}` : ''}
                />
              </ListItem>
            ))}
          </List>
        </DialogContent>
        {!isMobile && (
          <DialogActions sx={{
            borderTop: 1,
            borderColor: '#2e3a4a',
            p: 2,
            backgroundColor: '#1e2633'
          }}>
            <Button
              onClick={() => setProjectSelectDialogOpen(false)}
              sx={{
                color: '#b0b8c1',
                '&:hover': {
                  backgroundColor: '#2e3a4a'
                }
              }}
            >
              닫기
            </Button>
          </DialogActions>
        )}
      </Dialog>

      

      {/* 제품 추가 성공 메시지 Snackbar */}
      <Snackbar
        open={snackbarOpen}
        autoHideDuration={3000}
        onClose={() => setSnackbarOpen(false)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
        sx={{
          '& .MuiSnackbarContent-root': {
            backgroundColor: '#4caf50',
            color: 'white',
            fontWeight: 'bold',
          }
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Typography variant="body2">
            {snackbarMessage}
          </Typography>
        </Box>
      </Snackbar>

      {/* 일괄 변경 메시지 Snackbar */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={3000}
        onClose={() => setSnackbar({ open: false, message: '' })}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
        sx={{
          '& .MuiSnackbarContent-root': {
            backgroundColor: '#2196f3',
            color: 'white',
            fontWeight: 'bold',
          }
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Typography variant="body2">
            {snackbar.message}
          </Typography>
        </Box>
      </Snackbar>

      {/* 수량 수정 모달 */}
      <Dialog
        open={quantityEditModalOpen}
        onClose={handleCloseQuantityEditModal}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: {
            backgroundColor: '#1e2633',
            color: '#e0e6ed',
            border: '1px solid #2e3a4a',
          }
        }}
      >
        <DialogTitle sx={{ 
          borderBottom: '1px solid #2e3a4a',
          backgroundColor: '#2e3a4a',
          color: '#ffffff'
        }}>
          옵션 수량 수정
        </DialogTitle>
        <DialogContent sx={{ pt: 3 }}>
          {editingQuantityRow && (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <Box>
                <Typography variant="subtitle2" sx={{ color: '#b0b8c1', mb: 1 }}>
                  옵션명
                </Typography>
                <Typography variant="body1" sx={{ color: '#ffffff' }}>
                  {editingQuantityRow.optionLabel || editingQuantityRow.productName}
                </Typography>
              </Box>
              
              <Box>
                <Typography variant="subtitle2" sx={{ color: '#b0b8c1', mb: 1 }}>
                  현재 수량
                </Typography>
                <Typography variant="body1" sx={{ color: '#ffffff' }}>
                  {editingQuantityRow.quantity || 1}
                </Typography>
              </Box>

              <Box>
                <Typography variant="subtitle2" sx={{ color: '#b0b8c1', mb: 1 }}>
                  설정 방식
                </Typography>
                <Typography variant="body1" sx={{ color: '#ffffff' }}>
                  {editingQuantityRow.isManualQuantity ? '수동 설정' : '자동 계산'}
                </Typography>
                <Typography variant="caption" sx={{ color: '#8a9ba8', display: 'block', mt: 0.5 }}>
                  {(() => {
                    const optionName = editingQuantityRow.optionLabel || editingQuantityRow.productName || '';
                    if (optionName.includes('커튼시공') || optionName.includes('커튼 시공')) {
                      return '커튼 개수별 자동 계산';
                    } else if (optionName.includes('블라인드시공') || optionName.includes('블라인드 시공')) {
                      return '블라인드 개수별 자동 계산';
                    } else if (optionName.includes('레일') || editingQuantityRow.details?.includes('레일')) {
                      return '레일 개수별 자동 계산';
                    } else if (optionName.includes('전동') || optionName.includes('모터')) {
                      return '전동 옵션 (기본값 1)';
                    } else {
                      return '기본 수량 (1개)';
                    }
                  })()}
                </Typography>
              </Box>

              <Box>
                <Typography variant="subtitle2" sx={{ color: '#b0b8c1', mb: 1 }}>
                  새 수량
                </Typography>
                <TextField
                  type="number"
                  value={editingQuantityValue}
                  onChange={(e) => setEditingQuantityValue(Number(e.target.value) || 1)}
                  fullWidth
                  size="small"
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      color: '#ffffff',
                      backgroundColor: '#2e3a4a',
                      '& fieldset': {
                        borderColor: '#4a5568',
                      },
                      '&:hover fieldset': {
                        borderColor: '#718096',
                      },
                      '&.Mui-focused fieldset': {
                        borderColor: '#40c4ff',
                      },
                    },
                    '& .MuiInputLabel-root': {
                      color: '#b0b8c1',
                    },
                  }}
                />
              </Box>

              {/* 표시 형식 미리보기 */}
              <Box>
                <Typography variant="subtitle2" sx={{ color: '#b0b8c1', mb: 1 }}>
                  표시 형식 미리보기
                </Typography>
                <Box sx={{ 
                  p: 2, 
                  backgroundColor: '#2e3a4a', 
                  borderRadius: 1,
                  border: '1px solid #4a5568'
                }}>
                  <Typography variant="body2" sx={{ color: '#ffffff' }}>
                    {(() => {
                      const optionName = editingQuantityRow.optionLabel || editingQuantityRow.productName || '';
                      let previewText = '';
                      
                      if (optionName.includes('커튼시공') || optionName.includes('커튼 시공')) {
                        previewText = `커튼시공 / 커튼 ${editingQuantityValue}조`;
                      } else if (optionName.includes('블라인드시공') || optionName.includes('블라인드 시공')) {
                        previewText = `블라인드시공 / 블라인드 ${editingQuantityValue}개`;
                      } else if (optionName.includes('전동커튼시공') || optionName.includes('전동커튼 시공')) {
                        previewText = `전동커튼시공 / 전동커튼 시공비용 (커튼 ${editingQuantityValue}조)`;
                      } else {
                        previewText = `${optionName} / ${editingQuantityValue}개`;
                      }
                      
                      return previewText;
                    })()}
                  </Typography>
                </Box>
              </Box>
            </Box>
          )}
        </DialogContent>
        <DialogActions sx={{ 
          borderTop: '1px solid #2e3a4a',
          backgroundColor: '#2e3a4a',
          p: 2
        }}>
          <Button
            onClick={handleRestoreAutoQuantity}
            sx={{
              color: '#40c4ff',
              '&:hover': {
                backgroundColor: 'rgba(64, 196, 255, 0.1)',
              }
            }}
          >
            자동 계산으로 복원
          </Button>
          <Box sx={{ flexGrow: 1 }} />
          <Button
            onClick={handleCloseQuantityEditModal}
            sx={{
              color: '#b0b8c1',
              '&:hover': {
                backgroundColor: '#4a5568',
              }
            }}
          >
            취소
          </Button>
          <Button
            onClick={handleApplyQuantityEdit}
            variant="contained"
            sx={{
              backgroundColor: '#40c4ff',
              color: '#ffffff',
              '&:hover': {
                backgroundColor: '#00b0ff',
              }
            }}
          >
            적용
          </Button>
        </DialogActions>
      </Dialog>

      {/* 행 우클릭 컨텍스트 메뉴 */}
      <Menu
        open={rowContextMenu !== null}
        onClose={handleCloseRowContextMenu}
        anchorReference="anchorPosition"
        anchorPosition={
          rowContextMenu !== null
            ? { top: rowContextMenu.mouseY, left: rowContextMenu.mouseX }
            : undefined
        }
        PaperProps={{
          sx: {
            backgroundColor: 'var(--surface-color)',
            color: 'var(--text-color)',
            border: '1px solid var(--border-color)',
            boxShadow: '0 4px 20px rgba(0, 0, 0, 0.3)',
            '& .MuiMenuItem-root': {
              color: 'var(--text-color)',
              '&:hover': {
                backgroundColor: 'var(--hover-color)',
              },
            },
          }
        }}
      >
        <MenuItem 
          onClick={() => handleRowContextMenuAction('edit')} 
          sx={{ 
            color: 'var(--text-color)',
            '&:hover': {
              backgroundColor: 'var(--hover-color)',
            },
          }}
        >
          <EditIcon fontSize="small" sx={{ mr: 1 }} />
          수정
        </MenuItem>
        {rowContextMenu?.row.type === 'product' && (
          <>
            <MenuItem 
              onClick={() => handleRowContextMenuAction('productSearch')} 
              sx={{ 
                color: 'var(--text-color)',
                '&:hover': {
                  backgroundColor: 'var(--hover-color)',
                },
              }}
            >
              <SearchIcon fontSize="small" sx={{ mr: 1 }} />
              제품검색
            </MenuItem>
            <MenuItem 
              onClick={() => handleRowContextMenuAction('addOption')} 
              sx={{ 
                color: 'var(--text-color)',
                '&:hover': {
                  backgroundColor: 'var(--hover-color)',
                },
              }}
            >
              <AddIcon fontSize="small" sx={{ mr: 1 }} />
              옵션추가
            </MenuItem>
            <MenuItem 
              onClick={() => handleRowContextMenuAction('bulkEdit')} 
              sx={{ 
                color: 'var(--text-color)',
                '&:hover': {
                  backgroundColor: 'var(--hover-color)',
                },
              }}
            >
              <SettingsIcon fontSize="small" sx={{ mr: 1 }} />
              일괄변경
            </MenuItem>
          </>
        )}
        <MenuItem 
          onClick={() => handleRowContextMenuAction('copy')} 
          sx={{ 
            color: 'var(--text-color)',
            '&:hover': {
              backgroundColor: 'var(--hover-color)',
            },
          }}
        >
          <ContentCopyIcon fontSize="small" sx={{ mr: 1 }} />
          복사
        </MenuItem>
        {rowContextMenu?.row.productType === '블라인드' && rowContextMenu?.row.type === 'product' && (
          <>
            <Divider />
            <MenuItem 
              onClick={() => handleRowContextMenuAction('divideSplit')} 
              sx={{ 
                color: '#4caf50',
                fontWeight: 'bold',
                '&:hover': {
                  backgroundColor: 'var(--hover-color)',
                },
              }}
            >
              나누기(분할)
            </MenuItem>
            <MenuItem 
              onClick={() => handleRowContextMenuAction('divideCopy')} 
              sx={{ 
                color: '#2196f3',
                fontWeight: 'bold',
                '&:hover': {
                  backgroundColor: 'var(--hover-color)',
                },
              }}
            >
              나누기(복사)
            </MenuItem>
          </>
        )}
        <Divider />
        <MenuItem 
          onClick={() => handleRowContextMenuAction('delete')} 
          sx={{ 
            color: 'error.main',
            '&:hover': {
              backgroundColor: 'var(--hover-color)',
            },
          }}
        >
          <DeleteIcon fontSize="small" sx={{ mr: 1 }} />
          삭제
                 </MenuItem>
       </Menu>

       {/* 블라인드 나누기 모달 */}
       <Dialog
         open={divideModalOpen}
         onClose={() => setDivideModalOpen(false)}
         maxWidth="sm"
         fullWidth
       >
         <DialogTitle sx={{ 
           color: 'var(--text-color)', 
           backgroundColor: 'var(--surface-color)',
           borderBottom: '1px solid var(--border-color)'
         }}>
           <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
             <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
               블라인드 제품 나누기
             </Typography>
           </Box>
         </DialogTitle>
         <DialogContent sx={{ 
           backgroundColor: 'var(--surface-color)', 
           color: 'var(--text-color)',
           pt: 3
         }}>
           <Typography variant="body1" sx={{ mb: 2, lineHeight: 1.6 }}>
             나누기 타입: <span style={{ color: '#4caf50', fontWeight: 'bold' }}>
               {divideType === 'split' ? '나누기(분할)' : '나누기(복사)'}
             </span>
           </Typography>
           <Typography variant="body2" sx={{ mb: 3, color: 'var(--text-color)', opacity: 0.8 }}>
             {divideType === 'split' 
               ? '가로 사이즈를 균등하게 분할하여 나눕니다.' 
               : '동일한 사이즈로 복사하여 나눕니다.'
             }
           </Typography>
           
           <TextField
             label="나눌 개수"
             type="number"
             value={divideCount}
             onChange={(e) => {
               const value = parseInt(e.target.value);
               if (value >= 2 && value <= 10) {
                 setDivideCount(value);
               }
             }}
             inputProps={{ min: 2, max: 10 }}
             fullWidth
             sx={{
               '& .MuiOutlinedInput-root': {
                 color: 'var(--text-color)',
                 '& fieldset': {
                   borderColor: 'var(--border-color)',
                 },
                 '&:hover fieldset': {
                   borderColor: 'var(--primary-color)',
                 },
                 '&.Mui-focused fieldset': {
                   borderColor: 'var(--primary-color)',
                 },
               },
               '& .MuiInputLabel-root': {
                 color: 'var(--text-color)',
                 '&.Mui-focused': {
                   color: 'var(--primary-color)',
                 },
               },
             }}
           />
           
           <Typography variant="caption" sx={{ mt: 1, color: 'var(--text-color)', opacity: 0.6 }}>
             * 2개에서 10개까지 나눌 수 있습니다.
           </Typography>
         </DialogContent>
         <DialogActions sx={{ 
           backgroundColor: 'var(--surface-color)', 
           color: 'var(--text-color)',
           borderTop: '1px solid var(--border-color)',
           p: 2,
           gap: 1
         }}>
           <Button 
             onClick={() => {
               setDivideModalOpen(false);
               setSelectedRowForDivide(null);
             }}
             variant="outlined"
             sx={{
               borderColor: 'var(--primary-color)',
               color: 'var(--primary-color)',
               '&:hover': {
                 borderColor: 'var(--primary-color)',
                 backgroundColor: 'rgba(25, 118, 210, 0.04)',
               },
             }}
           >
             취소
           </Button>
           <Button 
             onClick={handleDivideBlind}
             variant="contained"
             sx={{
               backgroundColor: 'var(--primary-color)',
               '&:hover': {
                 backgroundColor: 'var(--primary-color-dark)',
               },
             }}
           >
             나누기
          </Button>
        </DialogActions>
      </Dialog>

      {/* 계약서 출력용 숨겨진 div */}
      <div ref={contractPrintRef} style={{ display: 'none' }}>
        {selectedContractForPrint && (
          <ContractTemplate
            contract={selectedContractForPrint}
            open={false}
            onClose={() => {}}
          />
        )}
      </div>

      {/* 계약서 출력 모달 */}
      {selectedContractForPrint && (
        <ContractTemplate
          contract={selectedContractForPrint}
          open={contractTemplateOpen}
          onClose={() => setContractTemplateOpen(false)}
        />
      )}

      {/* 계약서 출력 메뉴 */}
      <Menu
        anchorEl={contractPrintMenuAnchorEl}
        open={contractPrintMenuOpen}
        onClose={handleContractPrintMenuClose}
        PaperProps={{
          sx: {
            backgroundColor: 'var(--surface-color)',
            color: 'var(--text-color)',
            border: '1px solid var(--border-color)',
            boxShadow: '0 4px 20px rgba(0, 0, 0, 0.15)',
            '& .MuiMenuItem-root': {
              color: 'var(--text-color)',
              '&:hover': {
                backgroundColor: 'var(--hover-color)',
              },
            },
          },
        }}
      >
        <MenuItem
          onClick={() => {
            if (selectedContractForPrintMenu) {
              handleContractPrint(selectedContractForPrintMenu);
            }
            handleContractPrintMenuClose();
          }}
          sx={{
            color: 'var(--text-color)',
            '&:hover': {
              backgroundColor: 'var(--hover-color)',
            },
          }}
        >
          <PrintIcon fontSize="small" sx={{ mr: 1, color: 'var(--primary-color)' }} />
          인쇄
        </MenuItem>
        <MenuItem
          onClick={() => {
            if (selectedContractForPrintMenu) {
              handleContractPdfClick(selectedContractForPrintMenu);
            }
            handleContractPrintMenuClose();
          }}
          sx={{
            color: 'var(--text-color)',
            '&:hover': {
              backgroundColor: 'var(--hover-color)',
            },
          }}
        >
          <PictureAsPdfIcon fontSize="small" sx={{ mr: 1, color: '#f44336' }} />
          PDF 다운로드
        </MenuItem>
        <MenuItem
          onClick={() => {
            if (selectedContractForPrintMenu) {
              handleContractJpgClick(selectedContractForPrintMenu);
            }
            handleContractPrintMenuClose();
          }}
          sx={{
            color: 'var(--text-color)',
            '&:hover': {
              backgroundColor: 'var(--hover-color)',
            },
          }}
        >
          <ImageIcon fontSize="small" sx={{ mr: 1, color: '#4caf50' }} />
          JPG 다운로드
        </MenuItem>
        <MenuItem
          onClick={() => {
            if (selectedContractForPrintMenu) {
              handleContractShareClick(selectedContractForPrintMenu);
            }
            handleContractPrintMenuClose();
          }}
          sx={{
            color: 'var(--text-color)',
            '&:hover': {
              backgroundColor: 'var(--hover-color)',
            },
          }}
        >
          <ShareIcon fontSize="small" sx={{ mr: 1, color: '#ff9800' }} />
          공유
        </MenuItem>
      </Menu>
    </>
  );
};

export default EstimateManagement;


