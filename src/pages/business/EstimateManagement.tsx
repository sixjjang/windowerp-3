import React, { useState, ChangeEvent, useEffect, useContext, useMemo } from 'react';
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
} from '@mui/material';
import type { SelectChangeEvent } from '@mui/material/Select';
import {
  Add as AddIcon,
  Delete as DeleteIcon,
  ContentCopy as ContentCopyIcon,
  Print as PrintIcon,
  PictureAsPdf as PdfIcon,
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
} from '@mui/icons-material';
import { create } from 'zustand';
import { evaluate } from 'mathjs';
import Slide from '@mui/material/Slide';
import EstimateTemplate from '../../components/EstimateTemplate';
import Autocomplete from '@mui/material/Autocomplete';
import TemplateManager from '../../components/TemplateManager';
import { templateRoomToEstimateRow } from '../../utils/templateUtils';
import { EstimateTemplate as EstimateTemplateType, Estimate, EstimateRow, OptionItem } from '../../types';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';
import { findLastIndex } from 'lodash';
import { useNavigate } from 'react-router-dom';
import { useNotificationStore } from '../../utils/notificationStore';
import { UserContext } from '../../components/Layout';

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

const useEstimateStore = create<EstimateStore>(set => ({
  estimates: [
    {
      id: 1,
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
      pleatAmount: '',
    },
    '겉커튼-나비-2000이하': {
      widthCount: 'widthMM*2/productWidth',
      pleatAmount: '',
    },
    '겉커튼-민자-2000이상': { widthCount: 'widthMM*1.4/1370', pleatAmount: '' },
    '겉커튼-나비-2000이상': { widthCount: 'widthMM*2/1370', pleatAmount: '' },
  },
  setActiveTab: idx => set({ activeTab: idx }),
  addEstimate: () =>
    set(state => {
      const estimateNo = generateEstimateNo(state.estimates);
      return {
        estimates: [
          ...state.estimates,
          {
            id: Date.now(),
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
    result = (width * 1.4) / (standardWidth * 0.1);
  } else if (pleatType === '나비') {
    result = (width * 2) / (standardWidth * 0.1);
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
    if (safeProductWidth > 2000) {
      result = (widthMM * 1.4) / 1370;
    } else {
      result = (widthMM * 1.4) / safeProductWidth;
    }
  } else if (pleatType === '나비') {
    if (safeProductWidth > 2000) {
      result = (widthMM * 2) / 1370;
    } else {
      result = (widthMM * 2) / safeProductWidth;
    }
  } else {
    return '';
  }

  // Infinity나 NaN 체크
  if (!isFinite(result) || isNaN(result)) return '';

  const decimal = result - Math.floor(result);
  return decimal <= 0.1 ? Math.floor(result) : Math.ceil(result);
};

// 주름양 계산 함수 추가
const getPleatAmount = (
  widthMM: number,
  productWidth: number,
  pleatType: string,
  curtainType: string,
  pleatCount: number
) => {
  if (curtainType === '속커튼' && pleatType === '나비') return '약2배';
  if (curtainType !== '겉커튼' || !pleatCount) return '';
  if (widthMM <= 0 || productWidth <= 0) return '';

  let result = 0;
  if (pleatType === '민자' || pleatType === '나비') {
    if (productWidth > 2000) {
      result = (1370 * pleatCount) / widthMM;
    } else {
      result = (productWidth * pleatCount) / widthMM;
    }
  } else {
    return '';
  }

  // Infinity나 NaN 체크
  if (!isFinite(result) || isNaN(result)) return '';

  return result ? result.toFixed(2) : '';
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
    let pleat = 0;
    if (pleatAmount === '직접입력' && pleatAmountCustom) {
      pleat = Number(pleatAmountCustom) || 0;
    } else if (typeof pleatAmount === 'string' && pleatAmount.endsWith('배')) {
      pleat = Number(pleatAmount.replace('배', '')) || 0;
    } else {
      pleat = Number(pleatAmount) || 0;
    }
    const area = widthMM * pleat * 0.001;
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
    
    // 대폭민자단가가 없으면 판매단가의 70% 사용
    if (!priceToUse) {
      priceToUse = row.salePrice ? row.salePrice * 0.7 : 0;
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
    
    // 대폭민자원가가 없으면 입고원가의 70% 사용
    if (!costToUse) {
      costToUse = row.purchaseCost ? row.purchaseCost * 0.7 : 0;
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
  { key: 'space', label: '공간', visible: true },
  { key: 'productCode', label: '제품코드', visible: true },
  { key: 'productType', label: '제품종류', visible: true },
  { key: 'curtainType', label: '커튼종류', visible: true },
  { key: 'pleatType', label: '주름방식', visible: true },
  { key: 'productName', label: '제품명', visible: true },
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

// Customer 타입 정의
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

const CUSTOMER_DB_KEY = 'customer_db';
const CUSTOMER_STORAGE_KEY = 'customerList';

function getCustomerList() {
  try {
    const data = localStorage.getItem('customerList');
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
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

function saveCustomerToDB(customer: any) {
  const list = getCustomerList();
  // 연락처 중복 체크
  const idx = list.findIndex((c: any) => c.contact === customer.contact);
  if (idx >= 0) {
    list[idx] = { ...list[idx], ...customer };
  } else {
    list.push(customer);
  }
  localStorage.setItem('customerList', JSON.stringify(list));
}

// 공간별 다크톤 파스텔 컬러 팔레트 (테이블 배경과 어울리게)
const SPACE_COLORS: { [space: string]: string } = {
  거실: '#263040',
  안방: '#2d3545',
  드레스룸: '#2a3a3a',
  중간방: '#2b3440',
  끝방: '#2e2f36',
  주방: '#2a353d',
  기타: '#23272b',
  '': '#23272b',
};
const SPACE_COLOR_LIST = Object.values(SPACE_COLORS);
function getSpaceColor(space: string, lightness = 1) {
  const keys = Object.keys(SPACE_COLORS);
  let idx = keys.indexOf(space);
  if (idx === -1)
    idx =
      Math.abs(space.split('').reduce((a, c) => a + c.charCodeAt(0), 0)) %
      SPACE_COLOR_LIST.length;
  let color = SPACE_COLOR_LIST[idx];
  if (lightness !== 1) {
    // hex to rgb
    const rgb = color.match(/\w\w/g)?.map(x => parseInt(x, 16)) || [35, 39, 43];
    const newRgb = rgb.map(v =>
      Math.round(v + (255 - v) * (lightness - 1) * 0.25)
    ); // 다크톤에서 살짝만 밝게
    color = `rgb(${newRgb.join(',')})`;
  }
  return color;
}

const EstimateManagement: React.FC = () => {
  // === UI 개선을 위한 선언 ===
  const isMobile = useMediaQuery('(max-width:600px)');

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

  // 디버깅: 견적서 스토어 상태 확인
  console.log('견적서 스토어 상태:', { estimates, activeTab });
  console.log('현재 견적서:', estimates[activeTab]);
  console.log('현재 견적서 행 수:', estimates[activeTab]?.rows?.length);

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
  const [optionDialogOpen, setOptionDialogOpen] = useState(false);
  const [optionTab, setOptionTab] = useState(0);
  const [optionSearch, setOptionSearch] = useState('');
  const [optionResults, setOptionResults] = useState<any[]>([]);
  const [optionSearchTab, setOptionSearchTab] = useState<number>(0);
  const [editRowIdx, setEditRowIdx] = useState<number | null>(null);
  const [editRow, setEditRow] = useState<any>(null);
  const [editOpen, setEditOpen] = useState(false);
  const [recommendedPleatCount, setRecommendedPleatCount] = useState<number>(0);
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
      const saved = localStorage.getItem('estimateColumnVisibility');
      if (saved) return JSON.parse(saved);
      const initial: { [key: string]: boolean } = {};
      FILTER_FIELDS.forEach(field => {
        initial[field.key] = field.visible;
      });
      return initial;
    } catch {
      const initial: { [key: string]: boolean } = {};
      FILTER_FIELDS.forEach(field => {
        initial[field.key] = field.visible;
      });
      return initial;
    }
  });
  const [showMarginSum, setShowMarginSum] = useState(false);
  const [showDiscount, setShowDiscount] = useState(false);
  const [discountAmount, setDiscountAmount] = useState('');
  const [discountRate, setDiscountRate] = useState('');
  const [discountedTotalInput, setDiscountedTotalInput] = useState('');
  const [outputAnchorEl, setOutputAnchorEl] = useState<null | HTMLElement>(
    null
  );
  const [selectedProductIdx, setSelectedProductIdx] = useState<number | null>(
    null
  );
  const [showEstimateTemplate, setShowEstimateTemplate] = useState(false);
  // 1. 상태 추가
  const [periodMode, setPeriodMode] = useState<
    'all' | 'week' | 'month' | 'quarter' | 'half' | 'year'
  >('all');
  const [selectedYear, setSelectedYear] = useState<string>('');
  const [selectedQuarter, setSelectedQuarter] = useState<string>('1');
  const [selectedHalf, setSelectedHalf] = useState<string>('1');
  const [templateDialogOpen, setTemplateDialogOpen] = useState(false);
  const [customerListDialogOpen, setCustomerListDialogOpen] = useState(false);
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

  // 고객리스트 검색 상태 추가
  const [customerSearch, setCustomerSearch] = useState('');

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

    console.log('선택된 제품 ID들:', Array.from(selectedProducts));
    console.log('검색 결과 제품들:', productSearchResults.map(p => ({ id: p.id, name: p.productName })));

    const selectedProductList = productSearchResults.filter(p => selectedProducts.has(p.id));
    console.log('필터링된 선택 제품들:', selectedProductList.map(p => ({ id: p.id, name: p.productName })));

    // 선택된 제품들의 선택 횟수 업데이트
    selectedProductList.forEach(product => {
      updateProductSelectionCount(product.id);
    });

    const newRows: EstimateRow[] = selectedProductList.map(product => ({
      id: Date.now() + Math.random(), // 고유 ID 생성
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
    }));

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
  const handleOpenCustomerList = () => {
    setCustomerOptions(getCustomerList());
    setCustomerSearch(''); // 검색어 초기화
    setCustomerListDialogOpen(true);
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
    console.log('=== meta 상태 업데이트 시작 ===');
    console.log('activeTab:', activeTab);
    console.log('estimates 길이:', estimates.length);

    if (estimates.length === 0) {
      console.log('견적서 목록이 비어있어 meta 업데이트를 건너뜁니다.');
      return;
    }

    if (activeTab < 0 || activeTab >= estimates.length) {
      console.log('유효하지 않은 activeTab으로 meta 업데이트를 건너뜁니다.');
      return;
    }

    const est = estimates[activeTab];
    console.log('현재 견적서:', est);

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
      console.log('새로운 meta 상태:', newMeta);
      setMeta(newMeta);
    } else {
      console.log('견적서 정보가 없어 meta 업데이트를 건너뜁니다.');
    }
  }, [activeTab, estimates.length]); // estimates.length만 의존성으로 추가
  const [customerOptions, setCustomerOptions] =
    useState<any[]>(getCustomerList());

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
      // 기본값: 탭 순서: 커튼옵션, 블라인드옵션, 커튼전동, 블라인드전동, 헌터옵션, 기타옵션
      return [
        '커튼옵션',
        '블라인드옵션',
        '커튼전동',
        '블라인드전동',
        '헌터옵션',
        '기타옵션',
      ];
    } catch {
      return [
        '커튼옵션',
        '블라인드옵션',
        '커튼전동',
        '블라인드전동',
        '헌터옵션',
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
        console.log('현재 활성 탭:', activeTab);

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

  // 저장된 견적서 불러오기
  const loadSavedEstimates = () => {
    try {
      const savedData = localStorage.getItem('saved_estimates');
      const estimates = savedData ? JSON.parse(savedData) : [];
      console.log('저장된 견적서 로드:', estimates.length, '개');
      return estimates;
    } catch (error) {
      console.error('저장된 견적서 로드 오류:', error);
      return [];
    }
  };

  // 저장된 견적서 필터링
  const savedEstimates = loadSavedEstimates();
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

  // 디버깅 정보 출력
  console.log('저장된 견적서:', savedEstimates.length, '개');
  console.log('필터링된 견적서:', filteredSavedEstimatesList.length, '개');
  console.log('현재 기간 모드:', periodMode);

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
            let pleatCount = 0;
            if (updatedRow.pleatType === '민자') {
              if (productWidth > 2000) {
                pleatCount = (updatedRow.widthMM * 1.4) / 1370;
              } else {
                pleatCount = (updatedRow.widthMM * 1.4) / productWidth;
              }
            } else if (updatedRow.pleatType === '나비') {
              if (productWidth > 2000) {
                pleatCount = (updatedRow.widthMM * 2) / 1370;
              } else {
                pleatCount = (updatedRow.widthMM * 2) / productWidth;
              }
            }

            // 소수점 첫째자리 기준으로 반올림
            const decimal = pleatCount - Math.floor(pleatCount);
            const finalPleatCount =
              decimal <= 0.1 ? Math.floor(pleatCount) : Math.ceil(pleatCount);

            updatedRow.widthCount = finalPleatCount;

            // 주름양 계산
            if (finalPleatCount > 0) {
              let pleatAmount = 0;
              if (
                updatedRow.pleatType === '민자' ||
                updatedRow.pleatType === '나비'
              ) {
                if (productWidth > 2000) {
                  pleatAmount = (1370 * finalPleatCount) / updatedRow.widthMM;
                } else {
                  pleatAmount =
                    (productWidth * finalPleatCount) / updatedRow.widthMM;
                }
              }
              updatedRow.pleatAmount = pleatAmount
                ? pleatAmount.toFixed(2)
                : '';
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
              updatedRow.pleatAmount = area;
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
      // 일반 견적서인 경우 기존 로직 적용
      const revisionNo = generateRevisionNo(
        savedEstimate.estimateNo,
        estimates
      );
      newEstimate = {
        ...savedEstimate,
        id: Date.now(), // 새로운 ID 부여
        estimateNo: revisionNo, // 수정번호로 변경
        name: `${savedEstimate.name} (수정본)`,
        estimateDate: getLocalDate(), // 로컬 시간 기준으로 오늘 날짜로 설정
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
          `저장된 견적서가 수정본으로 불러와졌습니다.\n견적번호: ${newEstimate.estimateNo}`
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

        // 검색어 히스토리에 추가
        if (filters.searchText &&
          !productSearchHistory.includes(filters.searchText) &&
          !pinnedSearchTerms.includes(filters.searchText)) {
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

      // 1자일 때는 즉시 검색, 그 외에는 디바운싱 적용
      const delay = value.length === 1 ? 0 : 200;

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

      // 검색어 히스토리에 추가 (고정된 검색어가 아닌 경우에만)
      if (!productSearchHistory.includes(searchTerm) && !pinnedSearchTerms.includes(searchTerm)) {
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

  function loadOptions() {
    try {
      const data = localStorage.getItem('erp_options');
      if (!data) return [[], [], [], [], [], []];
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
        console.log('옵션 데이터 분류 중:', parsed.length, '개 옵션');

        const curtainOptions = parsed.filter((o: any) => o.optionType === '커튼');
        const blindOptions = parsed.filter((o: any) => o.optionType === '블라인드');
        const curtainMotorOptions = parsed.filter((o: any) => o.optionType === '커튼전동');
        const blindMotorOptions = parsed.filter((o: any) => o.optionType === '블라인드전동');
        const hunterOptions = parsed.filter((o: any) => o.optionType === '헌터');
        const etcOptions = parsed.filter((o: any) => o.optionType === '기타');

        console.log('분류 결과:', {
          커튼: curtainOptions.length,
          블라인드: blindOptions.length,
          커튼전동: curtainMotorOptions.length,
          블라인드전동: blindMotorOptions.length,
          헌터: hunterOptions.length,
          기타: etcOptions.length
        });

        return [
          curtainOptions,
          blindOptions,
          curtainMotorOptions,
          blindMotorOptions,
          hunterOptions,
          etcOptions,
        ];
      }

      return [[], [], [], [], [], []];
    } catch (error) {
      console.error('옵션 로드 오류:', error);
      return [[], [], [], [], [], []];
    }
  }

  const handleOptionSearch = (type: string) => {
    setOptionSearch('');
    const typeIndex = optionTypeMap.indexOf(type);
    setOptionSearchTab(typeIndex >= 0 ? typeIndex : 0);
    const all: any[] = loadOptions();
    const targetOptions = all[typeIndex >= 0 ? typeIndex : 0] || [];
    setOptionResults(targetOptions);

    console.log(`옵션 탭 클릭: ${type}, 옵션 개수: ${targetOptions.length}`);
  };

  const handleOptionSearchInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    setOptionSearch(e.target.value);
    const all: any[] = loadOptions();
    const arr = all[optionSearchTab] || [];
    setOptionResults(
      arr.filter(
        (o: any) =>
          e.target.value === '' ||
          o.optionName?.toLowerCase().includes(e.target.value.toLowerCase()) ||
          o.details?.toLowerCase().includes(e.target.value.toLowerCase())
      )
    );
  };

  const handleAddOptionToEstimate = (selectedOption: any) => {
    if (!selectedOption) return;

    if (selectedProductIdx === null) {
      alert(
        '옵션을 추가할 제품을 먼저 선택해주세요. 제품 행을 클릭하여 선택할 수 있습니다.'
      );
      return;
    }

    const currentRows = estimates[activeTab].rows;

    // Find the insertion index.
    // Start looking from the selected product index.
    let insertIndex = selectedProductIdx + 1;
    // Move past any existing options for the selected product.
    while (
      insertIndex < currentRows.length &&
      currentRows[insertIndex].type === 'option'
    ) {
      insertIndex++;
    }

    const newOptionRow: EstimateRow = {
      id: Date.now(),
      type: 'option',
      vendor: selectedOption.vendor || '',
      brand: selectedOption.brand || '',
      productName: selectedOption.optionName,
      productType: selectedOption.optionType,
      salePrice: selectedOption.salePrice || 0,
      purchaseCost: selectedOption.purchaseCost || 0,
      note: selectedOption.note,
      details: selectedOption.details,
      quantity: 1, // 기본수량 1
      totalPrice: selectedOption.salePrice || 0, // 옵션의 판매가를 totalPrice로 설정
      cost: selectedOption.purchaseCost || 0, // 옵션의 원가를 cost로 설정
      optionLabel: selectedOption.optionName, // 옵션명을 optionLabel로 설정
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
      margin:
        (selectedOption.salePrice || 0) - (selectedOption.purchaseCost || 0),
    };

    const newRows = [...currentRows];
    // 찾은 위치에 옵션 추가
    newRows.splice(insertIndex, 0, newOptionRow);

    updateEstimateRows(activeTab, newRows);
    setOptionDialogOpen(false);
  };

  useEffect(() => {
    const all: any[] = loadOptions();
    const arr = all[optionSearchTab] || [];
    setOptionResults(
      arr.filter(
        (o: any) =>
          optionSearch === '' ||
          o.optionName?.toLowerCase().includes(optionSearch.toLowerCase()) ||
          o.details?.toLowerCase().includes(optionSearch.toLowerCase())
      )
    );
    // eslint-disable-next-line
  }, [optionSearchTab, optionSearch, optionDialogOpen]);

  const handleCopyRow = (id: number) => {
    const rows = [...estimates[activeTab].rows];
    const idx = rows.findIndex(row => row.id === id);
    if (idx === -1) return;
    const copy = { ...rows[idx], id: Date.now() };
    rows.splice(idx + 1, 0, copy);
    updateEstimateRows(activeTab, rows);
  };

  const handleRowClick = (idx: number) => {
    setEditRowIdx(idx);
    setEditRow({ ...estimates[activeTab].rows[idx] });
    setEditOpen(true);
  };

  const handleEditChange = (field: string, value: any) => {
    const newEditRow = { ...editRow, [field]: value };
    let productDataChanged = false;

    // 제품명이 변경되면 거래처를 포함한 모든 관련 데이터를 제품 DB에서 다시 불러옵니다.
    if (field === 'productName' || field === 'productCode') {
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

        productDataChanged = true;
      }
    }

    // 제품 선택, 주름타입 변경, 커튼타입 변경 시 계산 실행 (가로 변경 시에는 단가 재할당 제외)
    if (
      ['pleatType', 'curtainType', 'productCode', 'productName'].includes(field) ||
      productDataChanged
    ) {
      const product = productOptions.find(
        p => p.productCode === newEditRow.productCode
      );
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
      } else if (curtainTypeVal === '겉커튼' && widthMM > 0) {
        let formulaKey = '';
        if (pleatTypeVal === '민자') {
          formulaKey =
            productWidth > 2000
              ? '겉커튼-민자-2000이상'
              : '겉커튼-민자-2000이하';
        } else if (pleatTypeVal === '나비') {
          formulaKey =
            productWidth > 2000
              ? '겉커튼-나비-2000이상'
              : '겉커튼-나비-2000이하';
        }

        let pleatCount: number | '' = '';
        if (formulaKey && formulas[formulaKey]) {
          try {
            const rawResult = evaluate(formulas[formulaKey].widthCount, {
              widthMM,
              productWidth,
            });
            const decimal = rawResult - Math.floor(rawResult);
            pleatCount =
              decimal <= 0.1 ? Math.floor(rawResult) : Math.ceil(rawResult);
          } catch {
            pleatCount = '';
          }
        }
        newEditRow.pleatCount = pleatCount;
        newEditRow.widthCount = pleatCount;
        setRecommendedPleatCount(pleatCount === '' ? 0 : pleatCount);

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
      }

      // 속커튼 민자일 때 특별 처리
      if (curtainTypeVal === '속커튼' && pleatTypeVal === '민자' && product) {
        // 속커튼 민자 주름양 계산 (면적 기반)
        if (widthMM > 0 && heightMM > 0) {
          const area = (widthMM * heightMM) / 1000000; // m²
          newEditRow.area = area;
          // 속커튼 민자는 주름양을 면적으로 계산
          newEditRow.pleatAmount = area;
        }
      } else if (curtainTypeVal === '속커튼' && pleatTypeVal === '나비') {
        // 속커튼 나비주름일 때 주름양을 1.8~2로 설정
        newEditRow.pleatAmount = '1.8~2';
      }
    }

    // 가로값 변경 시 폭수/주름양 계산만 수행 (단가 재할당 제외)
    if (field === 'widthMM') {
      const product = productOptions.find(
        p => p.productCode === newEditRow.productCode
      );
      const widthMM = Number(newEditRow.widthMM) || 0;
      const heightMM = Number(newEditRow.heightMM) || 0;
      const pleatTypeVal = newEditRow.pleatType;
      const curtainTypeVal = newEditRow.curtainType;
      const productWidth = product ? Number(product.width) || 0 : 0;

      // 겉커튼일 때 폭수 계산
      if (curtainTypeVal === '겉커튼' && widthMM > 0) {
        let formulaKey = '';
        if (pleatTypeVal === '민자') {
          formulaKey =
            productWidth > 2000
              ? '겉커튼-민자-2000이상'
              : '겉커튼-민자-2000이하';
        } else if (pleatTypeVal === '나비') {
          formulaKey =
            productWidth > 2000
              ? '겉커튼-나비-2000이상'
              : '겉커튼-나비-2000이하';
        }

        let pleatCount: number | '' = '';
        if (formulaKey && formulas[formulaKey]) {
          try {
            const rawResult = evaluate(formulas[formulaKey].widthCount, {
              widthMM,
              productWidth,
            });
            const decimal = rawResult - Math.floor(rawResult);
            pleatCount =
              decimal <= 0.1 ? Math.floor(rawResult) : Math.ceil(rawResult);
          } catch {
            pleatCount = '';
          }
        }
        newEditRow.pleatCount = pleatCount;
        newEditRow.widthCount = pleatCount;
        setRecommendedPleatCount(pleatCount === '' ? 0 : pleatCount);

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
      }

      // 속커튼 민자일 때는 면적 기반 주름양 계산
      if (curtainTypeVal === '속커튼' && pleatTypeVal === '민자') {
        if (widthMM > 0 && heightMM > 0) {
          const area = (widthMM * heightMM) / 1000000; // m²
          newEditRow.area = area;
          newEditRow.pleatAmount = area;
        }
      }
    }

    // 세로값 변경 시 면적 계산만 수행 (폭수 계산 제외)
    if (field === 'heightMM') {
      const widthMM = Number(newEditRow.widthMM) || 0;
      const heightMM = Number(newEditRow.heightMM) || 0;
      const pleatTypeVal = newEditRow.pleatType;
      const curtainTypeVal = newEditRow.curtainType;

      // 속커튼 민자일 때는 면적 기반 주름양 계산
      if (curtainTypeVal === '속커튼' && pleatTypeVal === '민자') {
        if (widthMM > 0 && heightMM > 0) {
          const area = (widthMM * heightMM) / 1000000; // m²
          newEditRow.area = area;
          newEditRow.pleatAmount = area;
        }
      }
    }

    // widthCount가 직접 변경될 때도 주름양 계산
    if (field === 'widthCount') {
      const product = productOptions.find(
        p => p.productCode === newEditRow.productCode
      );
      const widthMM = Number(newEditRow.widthMM) || 0;
      const pleatTypeVal = newEditRow.pleatType;
      const curtainTypeVal = newEditRow.curtainType;
      const productWidth = product ? Number(product.width) || 0 : 0;
      const pleatCount = Number(value) || 0;

      if (pleatCount > 0) {
        const calculatedPleatAmount = getPleatAmount(
          widthMM,
          productWidth,
          pleatTypeVal,
          curtainTypeVal,
          pleatCount
        );
        newEditRow.pleatAmount = calculatedPleatAmount;
      }

      // 속커튼 민자일 때는 면적 기반 주름양 계산
      if (curtainTypeVal === '속커튼' && pleatTypeVal === '민자') {
        const heightMM = Number(newEditRow.heightMM) || 0;
        if (widthMM > 0 && heightMM > 0) {
          const area = (widthMM * heightMM) / 1000000; // m²
          newEditRow.area = area;
          newEditRow.pleatAmount = area;
        }
      }
    }

    setEditRow(newEditRow);

    // 겉커튼일 때 추천 폭수 자동 반영
    if (
      ['widthMM', 'productName', 'curtainType', 'pleatType'].includes(field)
    ) {
      const product = productOptions.find(
        p => p.productName === newEditRow.productName
      );

      // 겉커튼일 때만 제품 폭이 0이면 1370으로 간주
      const productWidth = product ?
        (newEditRow.curtainType === '겉커튼' && Number(product.width) === 0 ? 1370 : Number(product.width))
        : 0;

      const widthMM = Number(newEditRow.widthMM) || 0;

      // 가로값이 있고 제품 폭이 있을 때만 계산
      if (widthMM > 0 && productWidth > 0) {
        const pleatCount = getPleatCount(
          widthMM,
          productWidth,
          newEditRow.pleatType,
          newEditRow.curtainType
        );
        setRecommendedPleatCount(pleatCount || 0);
      } else {
        setRecommendedPleatCount(0);
      }
    }
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
      updatedRow.widthCount =
        getPleatCount(
          updatedRow.widthMM,
          productWidth,
          updatedRow.pleatType,
          updatedRow.curtainType
        ) || 0;
      if (updatedRow.widthCount > 0) {
        updatedRow.pleatAmount =
          getPleatAmount(
            updatedRow.widthMM,
            productWidth,
            updatedRow.pleatType,
            updatedRow.curtainType,
            updatedRow.widthCount
          ) || '';
      }
    }

    // 4-2. 면적 계산 (면적을 사용하는 모든 제품 유형에 적용)
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

    // 5. 최종 금액 및 원가 계산
    updatedRow.totalPrice =
      Number(getTotalPrice(updatedRow, updatedRow.area)) || 0;
    updatedRow.cost =
      Number(getPurchaseTotal(updatedRow, updatedRow.area)) || 0;

    // 6. 마진 계산
    updatedRow.margin = Math.round(
      updatedRow.totalPrice / 1.1 - updatedRow.cost
    );

    // 7. 최종적으로 업데이트된 행을 견적서에 반영
    newRows[editRowIdx] = updatedRow;
    updateEstimateRows(activeTab, newRows);

    // 8. 다이얼로그 닫기 및 상태 초기화
    setEditOpen(false);
    setEditRowIdx(null);
    setEditRow(null);
  };

  const handleEditClose = () => {
    setEditOpen(false);
    setEditRowIdx(null);
    setEditRow(null);
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
      'widthMM',
      'heightMM',
    ];

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

  // WINDOWSTORY 버튼 핸들러
  const handleToggleMarginSum = () => setShowMarginSum(v => !v);

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
    if (row.type === 'product') {
      // 이미 계산된 totalPrice를 사용 (중복 계산 방지)
      return sum + (row.totalPrice || 0);
    }
    return sum;
  }, 0);

  // 옵션 합계금액 계산 (옵션 행들의 판매금액 합산)
  const optionTotalAmount = estimates[activeTab].rows.reduce((sum, row) => {
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

  // 옵션 추가 다이얼로그 열기 (제품 종류에 맞는 옵션만 표시)
  const handleOpenOptionDialog = () => {
    if (selectedProductIdx === null) {
      alert('옵션을 추가할 제품을 먼저 선택해주세요. 제품 행을 클릭하여 선택할 수 있습니다.');
      return;
    }

    const selectedProduct = estimates[activeTab].rows[selectedProductIdx];
    if (!selectedProduct || selectedProduct.type !== 'product') {
      alert('선택된 항목이 제품이 아닙니다.');
      return;
    }

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
      setOptionResults(targetOptions);

      console.log(`제품 종류: ${productType}, 표시할 옵션 타입: ${targetOptionType}, 옵션 개수: ${targetOptions.length}`);
    } else {
      // 기본값으로 커튼 옵션 표시
      setOptionSearchTab(0);
      setOptionSearch('');
      const all: any[] = loadOptions();
      setOptionResults(all[0] || []);
    }

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
      largePlainPrice: 0,
      largePlainCost: 0,
    };
    const updatedRows = [...rows, newOptionRow];
    updateEstimateRows(activeTab, updatedRows);
    alert(
      `레일 옵션이 ${totalRailCount}개 추가되었습니다.\n${detailsArr.join(', ')}\n입고금액: ${totalPurchaseCost.toLocaleString()}원`
    );
  };

  // 저장하기 핸들러 함수
  const handleSaveEstimate = () => {
    try {
      const currentEstimate = estimates[activeTab];
      const savedEstimates = JSON.parse(
        localStorage.getItem('saved_estimates') || '[]'
      );

      console.log('현재 견적서:', currentEstimate);
      console.log('기존 저장된 견적서:', savedEstimates.length, '개');

      // Final 견적서인지 확인 (견적번호에 -final이 포함되어 있는지)
      const isFinalEstimate =
        currentEstimate.estimateNo &&
        currentEstimate.estimateNo.includes('-final');

      // 동일한 견적번호가 있는지 확인
      const existingEstimate = savedEstimates.find(
        (est: any) => est.estimateNo === currentEstimate.estimateNo
      );

      let finalEstimateNo = currentEstimate.estimateNo;
      let finalEstimateName = currentEstimate.name;
      let isNewEstimate = false;

      // Final 견적서인 경우 기존 견적번호 유지
      if (isFinalEstimate) {
        console.log('Final 견적서 저장 - 기존 견적번호 유지:', finalEstimateNo);

        // 기존 Final 견적서가 있으면 업데이트, 없으면 새로 저장
        const existingFinalIndex = savedEstimates.findIndex(
          (est: any) => est.estimateNo === finalEstimateNo
        );

        if (existingFinalIndex >= 0) {
          // 기존 Final 견적서 업데이트
          savedEstimates[existingFinalIndex] = {
            ...currentEstimate,
            savedAt: new Date().toISOString(),
            totalAmount: Math.round(
              currentEstimate.rows.reduce(
                (sum: number, row: any) => sum + (row.totalPrice || 0),
                0
              )
            ),
            discountAmount: Number(
              String(discountAmount).replace(/[^\d]/g, '')
            ),
            discountedAmount:
              Number(String(discountAmount).replace(/[^\d]/g, '')) > 0
                ? Math.round(
                  currentEstimate.rows.reduce(
                    (sum: number, row: any) => sum + (row.totalPrice || 0),
                    0
                  )
                ) - Number(String(discountAmount).replace(/[^\d]/g, ''))
                : Math.round(
                  currentEstimate.rows.reduce(
                    (sum: number, row: any) => sum + (row.totalPrice || 0),
                    0
                  )
                ),
            margin: sumMargin,
          };
          console.log('기존 Final 견적서 업데이트:', finalEstimateName);
        } else {
          // 새로운 Final 견적서 저장
          savedEstimates.push({
            ...currentEstimate,
            savedAt: new Date().toISOString(),
            totalAmount: Math.round(
              currentEstimate.rows.reduce(
                (sum: number, row: any) => sum + (row.totalPrice || 0),
                0
              )
            ),
            discountAmount: Number(
              String(discountAmount).replace(/[^\d]/g, '')
            ),
            discountedAmount:
              Number(String(discountAmount).replace(/[^\d]/g, '')) > 0
                ? Math.round(
                  currentEstimate.rows.reduce(
                    (sum: number, row: any) => sum + (row.totalPrice || 0),
                    0
                  )
                ) - Number(String(discountAmount).replace(/[^\d]/g, ''))
                : Math.round(
                  currentEstimate.rows.reduce(
                    (sum: number, row: any) => sum + (row.totalPrice || 0),
                    0
                  )
                ),
            margin: sumMargin,
          });
          console.log('새로운 Final 견적서 저장:', finalEstimateName);
        }

        localStorage.setItem('saved_estimates', JSON.stringify(savedEstimates));
        alert(`Final 견적서가 저장되었습니다.\n견적번호: ${finalEstimateNo}`);

        // Final 견적서 저장 후에는 새로운 견적서로 초기화하지 않음
        return;
      }

      // 일반 견적서 저장 로직 (기존 코드)
      if (existingEstimate) {
        // 고객명, 연락처, 프로젝트명이 모두 동일한지 확인
        const isSameCustomer =
          existingEstimate.customerName === currentEstimate.customerName &&
          existingEstimate.contact === currentEstimate.contact &&
          existingEstimate.projectName === currentEstimate.projectName;

        if (isSameCustomer) {
          // 고객 정보가 동일하면 수정번호로 저장
          const baseEstimateNo = currentEstimate.estimateNo
            .split('-')
            .slice(0, 2)
            .join('-');

          // 같은 기본 견적번호를 가진 수정본들 찾기
          const revisionEstimates = savedEstimates.filter(
            (est: any) =>
              est.estimateNo.startsWith(baseEstimateNo) &&
              est.estimateNo.includes('-')
          );

          // 수정번호 찾기
          const revisionNumbers = revisionEstimates
            .map((est: any) => {
              const parts = est.estimateNo.split('-');
              const lastPart = parts[parts.length - 1];
              return Number(lastPart);
            })
            .filter((num: number) => !isNaN(num));

          const maxRevision =
            revisionNumbers.length > 0 ? Math.max(...revisionNumbers) : 0;
          const nextRevision = maxRevision + 1;

          finalEstimateNo = `${baseEstimateNo}-${String(nextRevision).padStart(2, '0')}`;
          finalEstimateName = `${currentEstimate.name} (수정본)`;

          console.log('동일한 고객 정보, 수정번호로 변경:', finalEstimateNo);
        } else {
          // 고객 정보가 다르면 신규 견적번호로 저장
          finalEstimateNo = generateEstimateNo(estimates);
          finalEstimateName = `견적서명-${finalEstimateNo}`;
          isNewEstimate = true;

          console.log(
            '고객 정보가 다름, 신규 견적번호로 변경:',
            finalEstimateNo
          );
        }
      }

      // 소비자금액과 합계금액 계산 (totalPrice가 이미 VAT 포함이므로 * 1.1 제거)
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

      // 저장 시간 추가
      const estimateToSave = {
        ...currentEstimate,
        estimateNo: finalEstimateNo,
        name: finalEstimateName,
        savedAt: new Date().toISOString(),
        totalAmount,
        discountAmount: discountAmountNumber,
        discountedAmount,
        margin: sumMargin,
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

      // 기존에 같은 ID가 있으면 업데이트, 없으면 새로 추가
      const existingIndex = savedEstimates.findIndex(
        (est: any) => est.id === currentEstimate.id
      );
      if (existingIndex >= 0) {
        savedEstimates[existingIndex] = estimateToSave;
        console.log('기존 견적서 업데이트:', finalEstimateName);
      } else {
        savedEstimates.push(estimateToSave);
        console.log('새 견적서 저장:', finalEstimateName);
      }

      localStorage.setItem('saved_estimates', JSON.stringify(savedEstimates));
      console.log(
        '저장 완료. 총',
        savedEstimates.length,
        '개의 견적서가 저장됨'
      );

      if (existingEstimate && !isNewEstimate) {
        alert(
          `동일한 견적번호가 있어 수정번호로 저장되었습니다.\n견적번호: ${finalEstimateNo}`
        );
      } else if (isNewEstimate) {
        alert(
          `고객 정보가 달라 신규 견적번호로 저장되었습니다.\n견적번호: ${finalEstimateNo}`
        );
      } else {
        alert('견적서가 저장되었습니다.');
      }

      // 저장 후 견적서 입력 내용 초기화
      const newEstimateNo = generateEstimateNo(estimates);
      const newEstimate = {
        id: Date.now(),
        name: `견적서-${newEstimateNo}`,
        estimateNo: newEstimateNo,
        estimateDate: getLocalDate(), // 로컬 시간 기준으로 오늘 날짜 설정
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
        estimateNo: newEstimateNo,
        estimateDate: getLocalDate(), // 로컬 시간 기준으로 오늘 날짜 설정
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

      console.log('견적서 입력 내용 초기화 완료');
    } catch (error) {
      console.error('견적서 저장 중 오류:', error);
      alert('견적서 저장 중 오류가 발생했습니다.');
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

  const handleProceedToContract = (savedEstimate: any) => {
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
    };

    // localStorage에 승인된 견적서 데이터 저장
    localStorage.setItem('approvedEstimate', JSON.stringify(estimateToProceed));

    // 계약관리 페이지로 이동
    navigate('/business/contract-management');
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

  // 상태 변경 시 강제 리렌더링을 위한 상태
  const [statusUpdateTrigger, setStatusUpdateTrigger] = useState(0);

  // 그룹별 색상 배열 (3개 색상 반복, 톤다운)
  const groupColors = [
    { light: '#23272f', dark: '#16181d' }, // 그레이(톤다운)
    { light: '#22304a', dark: '#16213a' }, // 블루(톤다운)
    { light: '#2d223a', dark: '#1a1423' }, // 바이올렛(톤다운)
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

  const triggerStatusUpdate = () => {
    setStatusUpdateTrigger(prev => prev + 1);
  };

  // 주기적으로 상태 업데이트 (5초마다)
  useEffect(() => {
    const interval = setInterval(() => {
      triggerStatusUpdate();
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  const activeEstimate = estimates[activeTab];

  const handleCustomerInfoChange = (
    e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setMeta(prev => ({ ...prev, [name]: value }));
  };

  const [isTemplateManagerOpen, setTemplateManagerOpen] = useState(false);
  const [snackbar, setSnackbar] = useState<{ open: boolean; message: string }>({
    open: false,
    message: '',
  });
  // 메모 상태 추가
  const [estimateMemos, setEstimateMemos] = useState<{ [key: string]: string }>(
    {}
  );

  const handleSaveCustomer = () => {
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
      console.log('localStorage에서 고객 목록 로드 시작');
      const customerData = localStorage.getItem('customerList');
      console.log('localStorage customerData:', customerData);

      let customers = [];
      if (customerData) {
        try {
          customers = JSON.parse(customerData);
          console.log('고객 목록 파싱 성공:', customers.length, '개');
        } catch (parseError) {
          console.error('고객 목록 파싱 실패:', parseError);
          customers = [];
        }
      } else {
        console.log('localStorage에 고객 목록이 없습니다. 새로 생성합니다.');
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

      // 고객명 + 연락처로 기존 고객 찾기
      console.log('기존 고객 검색 시작');
      console.log('검색할 고객명:', customerName);
      console.log('검색할 연락처:', contact);

      const existingIndex = customers.findIndex((c: any) => {
        const nameMatch = c.name && customerName &&
          c.name.trim().toLowerCase() === customerName.trim().toLowerCase();
        const telMatch = c.tel && contact &&
          c.tel.trim() === contact.trim();

        console.log(`고객 ${c.name} (${c.tel}): 이름일치=${nameMatch}, 연락처일치=${telMatch}`);
        return nameMatch && telMatch;
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

        // 고객 정보는 기존 정보 유지 (주소, 프로젝트명, 타입이 다를 수 있으므로)
        customers[existingIndex] = {
          ...existingCustomer,
          emergencyTel: emergencyContact,
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

      console.log('localStorage에 고객 목록 저장 시작');
      const customerListJson = JSON.stringify(customers);
      console.log('저장할 JSON:', customerListJson);

      localStorage.setItem('customerList', customerListJson);
      console.log('localStorage 저장 완료');
      console.log('최종 고객 목록:', customers.length, '개 고객');

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
              space: parts[1].trim(),
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
            const decimal = rawResult - Math.floor(rawResult);
            pleatCount =
              decimal <= 0.1 ? Math.floor(rawResult) : Math.ceil(rawResult);
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
            const decimal = rawResult - Math.floor(rawResult);
            pleatCount =
              decimal <= 0.1 ? Math.floor(rawResult) : Math.ceil(rawResult);
          } catch {
            pleatCount = '';
          }
        }
      }
      newEditRow.pleatCount = pleatCount;
      newEditRow.widthCount = pleatCount;
      setRecommendedPleatCount(pleatCount === '' ? 0 : pleatCount);

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
        `기존 계약을 Final 견적서로 업데이트하시겠습니까?\n\n` +
        `기존 계약번호: ${existingContract.contractNo}\n` +
        `기존 견적번호: ${existingContract.estimateNo}\n` +
        `Final 견적번호: ${finalEstimate.estimateNo}\n\n` +
        `실측 데이터가 반영된 최종 견적서로 업데이트됩니다.`
      );

      if (!confirmUpdate) return;

      // 기존 계약을 Final 견적서로 업데이트
      const updatedContract = {
        ...existingContract,
        estimateNo: finalEstimate.estimateNo,
        totalAmount:
          finalEstimate.totalAmount ||
          getTotalConsumerAmount(finalEstimate.rows),
        discountedAmount:
          finalEstimate.discountedAmount ||
          finalEstimate.totalAmount ||
          getTotalConsumerAmount(finalEstimate.rows),
        rows: finalEstimate.rows,
        updatedAt: new Date().toISOString(),
        measurementInfo: finalEstimate.measurementInfo,
        measurementData: finalEstimate.measurementData,
      };

      // 계약 목록 업데이트
      const updatedContracts = contracts.map((contract: any) =>
        contract.id === existingContract.id ? updatedContract : contract
      );
      localStorage.setItem('contracts', JSON.stringify(updatedContracts));

      alert(
        `기존 계약이 성공적으로 업데이트되었습니다!\n\n` +
        `계약번호: ${existingContract.contractNo}\n` +
        `업데이트된 견적번호: ${finalEstimate.estimateNo}\n` +
        `실측 데이터가 반영된 최종 견적서로 계약이 업데이트되었습니다.`
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
          background: '#232a36',
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
            size="small"
            sx={{ minWidth: 100 }}
            required
          />
          <TextField
            label="견적일자"
            type="date"
            value={meta.estimateDate}
            onChange={handleEstimateDateChange}
            InputLabelProps={{ shrink: true }}
            size="small"
            InputProps={{
              sx: {
                borderRadius: 2,
                background: '#232a36',
                border: '1px solid #2e3a4a',
                color: '#e0e6ed',
                cursor: 'pointer',
                '&:hover': {
                  backgroundColor: '#2e3a4a',
                  borderColor: '#40c4ff',
                },
                '&:focus': {
                  borderColor: '#40c4ff',
                  boxShadow: '0 0 0 2px rgba(64, 196, 255, 0.2)',
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
            size="small"
            sx={{ minWidth: 200 }}
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
                sx={{ minWidth: 180 }}
              />
            )}
          />
          <TextField
            label="비상연락처"
            value={meta.emergencyContact}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
              setMeta(prev => ({ ...prev, emergencyContact: e.target.value }))
            }
            size="small"
            sx={{ minWidth: 60 }}
          />
          <TextField
            label="프로젝트명"
            value={meta.projectName}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
              setMeta(prev => ({ ...prev, projectName: e.target.value }))
            }
            size="small"
            sx={{ minWidth: 140 }}
          />
          <TextField
            label="타입"
            value={meta.type}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
              setMeta(prev => ({ ...prev, type: e.target.value }))
            }
            size="small"
            sx={{ minWidth: 30 }}
          />
          <TextField
            label="주소"
            value={meta.address}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
              setMeta(prev => ({ ...prev, address: e.target.value }))
            }
            size="small"
            sx={{ minWidth: 200, flex: 1 }}
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
                      key={estimate.id}
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
                  {filteredSavedEstimates.map((savedEstimate: any) => (
                    <TableRow
                      key={savedEstimate.id}
                      hover
                      sx={{
                        cursor: 'pointer',
                        backgroundColor: '#232a36',
                        '&:hover': { backgroundColor: '#263040' },
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
        }}
        maxWidth="lg"
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
              제품 검색
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
                  <InputLabel sx={{ fontSize: isMobile ? '1rem' : '0.875rem' }}>거래처</InputLabel>
                  <Select
                    value={productSearchFilters.vendor}
                    onChange={(e) => handleProductSearchFilterChange('vendor', e.target.value)}
                    label="거래처"
                    sx={{
                      '& .MuiSelect-select': {
                        fontSize: isMobile ? '1rem' : '0.875rem',
                        padding: isMobile ? '12px 14px' : '8.5px 14px'
                      }
                    }}
                  >
                    <MenuItem value="" sx={{ fontSize: isMobile ? '1rem' : '0.875rem' }}>전체</MenuItem>
                    {Array.from(new Set(productOptions.map(p => p.vendorName).filter(Boolean))).map(vendor => (
                      <MenuItem key={vendor} value={vendor} sx={{ fontSize: isMobile ? '1rem' : '0.875rem' }}>{vendor}</MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} md={3}>
                <FormControl fullWidth size={isMobile ? "medium" : "small"}>
                  <InputLabel sx={{ fontSize: isMobile ? '1rem' : '0.875rem' }}>제품종류</InputLabel>
                  <Select
                    value={productSearchFilters.category}
                    onChange={(e) => handleProductSearchFilterChange('category', e.target.value)}
                    label="제품종류"
                    sx={{
                      '& .MuiSelect-select': {
                        fontSize: isMobile ? '1rem' : '0.875rem',
                        padding: isMobile ? '12px 14px' : '8.5px 14px'
                      }
                    }}
                  >
                    <MenuItem value="" sx={{ fontSize: isMobile ? '1rem' : '0.875rem' }}>전체</MenuItem>
                    {Array.from(new Set(
                      productOptions
                        .filter(p => !productSearchFilters.vendor || p.vendorName === productSearchFilters.vendor)
                        .map(p => p.category)
                        .filter(Boolean)
                    )).map(category => (
                      <MenuItem key={category} value={category} sx={{ fontSize: isMobile ? '1rem' : '0.875rem' }}>{category}</MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} md={3}>
                <FormControl fullWidth size={isMobile ? "medium" : "small"}>
                  <InputLabel sx={{ fontSize: isMobile ? '1rem' : '0.875rem' }}>브랜드</InputLabel>
                  <Select
                    value={productSearchFilters.brand}
                    onChange={(e) => handleProductSearchFilterChange('brand', e.target.value)}
                    label="브랜드"
                    sx={{
                      '& .MuiSelect-select': {
                        fontSize: isMobile ? '1rem' : '0.875rem',
                        padding: isMobile ? '12px 14px' : '8.5px 14px'
                      }
                    }}
                  >
                    <MenuItem value="" sx={{ fontSize: isMobile ? '1rem' : '0.875rem' }}>전체</MenuItem>
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
                      <MenuItem key={brand} value={brand} sx={{ fontSize: isMobile ? '1rem' : '0.875rem' }}>{brand}</MenuItem>
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
                    '& .MuiInputBase-input': {
                      fontSize: isMobile ? '1rem' : '0.875rem',
                      padding: isMobile ? '12px 14px' : '8.5px 14px'
                    }
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
                        border: '1px solid #eee',
                        borderRadius: 2,
                        p: 2,
                        mb: 1.5,
                        cursor: 'pointer',
                        transition: 'all 0.2s',
                        position: 'relative',
                        '&:hover': {
                          boxShadow: 3,
                          background: '#f5faff',
                          borderColor: '#1976d2'
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
                        <Box fontWeight="bold" fontSize={16} mb={0.5}>
                          {highlightText(product.productName, productSearchText)}
                        </Box>
                        <Box fontSize={13} color="#666" mb={0.5}>
                          {highlightText(product.details, productSearchText)}
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
                <TableContainer sx={{ maxHeight: 400, overflow: 'auto' }}>
                  <Table size="small" stickyHeader>
                    <TableHead>
                      <TableRow>
                        <TableCell sx={{ minWidth: 50 }}>
                          <Checkbox
                            checked={selectedProducts.size === productSearchResults.length && productSearchResults.length > 0}
                            indeterminate={selectedProducts.size > 0 && selectedProducts.size < productSearchResults.length}
                            onChange={handleSelectAllProducts}
                            size="small"
                          />
                        </TableCell>
                        <TableCell sx={{ minWidth: 80 }}>거래처</TableCell>
                        <TableCell sx={{ minWidth: 80 }}>브랜드</TableCell>
                        <TableCell sx={{ minWidth: 200 }}>제품명</TableCell>
                        <TableCell sx={{ minWidth: 250 }}>세부내용</TableCell>
                        <TableCell sx={{ minWidth: 150 }}>비고</TableCell>
                        <TableCell align="right" sx={{ minWidth: 100 }}>판매가</TableCell>
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
                            '&:hover': { background: '#f5faff' }
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
                          <TableCell sx={{ minWidth: 50 }}>
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
                            textOverflow: 'ellipsis'
                          }}>
                            {product.vendorName}
                          </TableCell>
                          <TableCell sx={{
                            maxWidth: 80,
                            whiteSpace: 'nowrap',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis'
                          }}>
                            {product.brand}
                          </TableCell>
                          <TableCell sx={{
                            minWidth: 200,
                            maxWidth: 300,
                            wordBreak: 'break-word',
                            whiteSpace: 'normal'
                          }}>
                            {highlightText(product.productName, productSearchText)}
                          </TableCell>
                          <TableCell sx={{
                            minWidth: 250,
                            maxWidth: 400,
                            wordBreak: 'break-word',
                            whiteSpace: 'normal'
                          }}>
                            {highlightText(product.details, productSearchText)}
                          </TableCell>
                          <TableCell sx={{
                            minWidth: 150,
                            maxWidth: 200,
                            wordBreak: 'break-word',
                            whiteSpace: 'normal'
                          }}>
                            {product.note || '-'}
                          </TableCell>
                          <TableCell align="right" sx={{
                            minWidth: 100,
                            fontWeight: 'bold',
                            color: '#1976d2'
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
              <Typography color="text.secondary" variant="body1">
                제품종류를 먼저 선택하세요.
              </Typography>
              <Typography variant="body2" sx={{ mt: 1, color: '#666' }}>
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
                선택된 제품 추가 후 계속 ({selectedProducts.size}개)
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
                선택된 제품 추가 후 계속 ({selectedProducts.size}개)
              </Button>
            )}
            <Button
              onClick={() => {
                setProductDialogOpen(false);
                setProductSearchText('');
                handleProductSearchFilterReset();
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
              onClick={() => setOptionDialogOpen(false)}
              aria-label="close"
              sx={{ mr: 1 }}
            >
              <ArrowBackIcon />
            </IconButton>
          )}
          <Box>
            <Typography variant="h6" sx={{ fontSize: isMobile ? '1.1rem' : '1.25rem' }}>
              옵션 추가
            </Typography>
            {selectedProductIdx !== null &&
              estimates[activeTab].rows[selectedProductIdx]?.type ===
              'product' && (
                <Typography
                  variant="subtitle2"
                  sx={{
                    mt: isMobile ? 0.5 : 1,
                    color: '#666',
                    fontWeight: 'normal',
                    fontSize: isMobile ? '0.9rem' : '0.875rem'
                  }}
                >
                  선택된 제품: {estimates[activeTab].rows[selectedProductIdx].productName}
                  ({estimates[activeTab].rows[selectedProductIdx].productType})
                </Typography>
              )}
          </Box>
        </DialogTitle>
        <DialogContent>
          {selectedProductIdx === null ? (
            <Box sx={{ textAlign: 'center', py: 4 }}>
              <Typography color="error" variant="body1">
                옵션을 추가할 제품을 먼저 선택해주세요.
              </Typography>
              <Typography variant="body2" sx={{ mt: 1, color: '#666' }}>
                제품 행을 클릭하여 선택한 후 옵션을 추가하세요.
              </Typography>
            </Box>
          ) : (
            <>
              <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: isMobile ? 1.5 : 2 }}>
                <Tabs
                  value={optionSearchTab}
                  onChange={(e: React.SyntheticEvent, newValue: number) => {
                    const selectedType = optionTypeMap[newValue];
                    handleOptionSearch(selectedType);
                  }}
                  sx={{
                    '& .MuiTab-root': {
                      fontSize: isMobile ? '0.9rem' : '0.875rem',
                      minHeight: isMobile ? '48px' : '48px'
                    }
                  }}
                >
                  {optionTypeMap.map((type: string, index: number) => (
                    <Tab key={type} label={type} />
                  ))}
                </Tabs>
              </Box>
              <TextField
                fullWidth
                size={isMobile ? "medium" : "small"}
                label="옵션 검색"
                value={optionSearch}
                onChange={handleOptionSearchInput}
                placeholder="옵션명, 세부내용으로 검색"
                sx={{
                  mb: isMobile ? 1.5 : 2,
                  '& .MuiInputBase-input': {
                    fontSize: isMobile ? '1rem' : '0.875rem',
                    padding: isMobile ? '12px 14px' : '8.5px 14px'
                  }
                }}
              />
              <TableContainer>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>공급업체</TableCell>
                      <TableCell>옵션명</TableCell>
                      <TableCell>판매가</TableCell>
                      <TableCell>원가</TableCell>
                      <TableCell>상세정보</TableCell>
                      <TableCell>적용타입</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {optionResults.map(option => (
                      <TableRow
                        key={option.id}
                        hover
                        sx={{ cursor: 'pointer' }}
                        onClick={() => handleAddOptionToEstimate(option)}
                      >
                        <TableCell>{option.vendor}</TableCell>
                        <TableCell>{option.optionName}</TableCell>
                        <TableCell>
                          {option.salePrice?.toLocaleString()}
                        </TableCell>
                        <TableCell>
                          {option.purchaseCost?.toLocaleString()}
                        </TableCell>
                        <TableCell>{option.details}</TableCell>
                        <TableCell>{option.note}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOptionDialogOpen(false)}>닫기</Button>
        </DialogActions>
      </Dialog>
      {/* 수정 모달 */}
      {editOpen && editRow && (
        <Dialog
          open={editOpen}
          onClose={handleEditClose}
          maxWidth="lg"
          fullWidth
          PaperProps={{ sx: { backgroundColor: '#232a36', color: '#e0e6ed' } }}
        >
          <DialogTitle
            sx={{
              color: '#e0e6ed',
              fontWeight: 'bold',
              backgroundColor: '#263040',
            }}
          >
            제품 정보 수정
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
                      value={editRow.productName || ''}
                      InputProps={{ readOnly: true }}
                      fullWidth
                      size="small"
                    />
                    <Button
                      variant="outlined"
                      size="small"
                      onClick={() => setProductDialogOpen(true)}
                      startIcon={<SearchIcon />}
                      sx={{
                        minWidth: 100,
                        color: '#0091ea',
                        borderColor: '#0091ea',
                        '&:hover': {
                          backgroundColor: '#0091ea',
                          color: '#fff',
                          borderColor: '#0091ea',
                        }
                      }}
                    >
                      제품검색
                    </Button>
                  </Box>
                </Grid>
                <Grid item xs={12} md={4}>
                  <TextField
                    label="제품코드"
                    value={editRow.productCode || ''}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      handleEditChange('productCode', e.target.value)
                    }
                    fullWidth
                    size="small"
                    sx={{
                      input: { color: '#e0e6ed' },
                      label: { color: '#b0b8c1' },
                      '& .MuiOutlinedInput-root': {
                        '& fieldset': { borderColor: '#2e3a4a' },
                        '&:hover fieldset': { borderColor: '#3a4a5a' },
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
                        '& fieldset': { borderColor: '#2e3a4a' },
                        '&:hover fieldset': { borderColor: '#3a4a5a' },
                      },
                      label: { color: '#b0b8c1' },
                      '.MuiSelect-select': { color: '#e0e6ed' },
                    }}
                  >
                    <InputLabel>공간</InputLabel>
                    <Select
                      value={editRow.space || ''}
                      onChange={(e: SelectChangeEvent) =>
                        handleEditChange('space', e.target.value)
                      }
                      label="공간"
                    >
                      {spaceOptions.map((space) => (
                        <MenuItem key={space} value={space}>
                          {space}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
                {editRow.space === '직접입력' && (
                  <Grid item xs={12} md={4}>
                    <TextField
                      label="공간 직접입력"
                      value={editRow.spaceCustom || ''}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                        handleEditChange('spaceCustom', e.target.value)
                      }
                      fullWidth
                      size="small"
                      sx={{
                        input: { color: '#e0e6ed' },
                        label: { color: '#b0b8c1' },
                        '& .MuiOutlinedInput-root': {
                          '& fieldset': { borderColor: '#2e3a4a' },
                          '&:hover fieldset': { borderColor: '#3a4a5a' },
                        },
                      }}
                    />
                  </Grid>
                )}
                <Grid item xs={12} md={4}>
                  <TextField
                    label="가로(mm)"
                    type="number"
                    value={editRow.widthMM || ''}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      handleEditChange('widthMM', e.target.value)
                    }
                    fullWidth
                    size="small"
                    sx={{
                      input: { color: '#e0e6ed' },
                      label: { color: '#b0b8c1' },
                      '& .MuiOutlinedInput-root': {
                        '& fieldset': { borderColor: '#2e3a4a' },
                        '&:hover fieldset': { borderColor: '#3a4a5a' },
                      },
                    }}
                  />
                </Grid>
                <Grid item xs={12} md={4}>
                  <TextField
                    label="세로(mm)"
                    type="number"
                    value={editRow.heightMM || ''}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      handleEditChange('heightMM', e.target.value)
                    }
                    fullWidth
                    size="small"
                    sx={{
                      input: { color: '#e0e6ed' },
                      label: { color: '#b0b8c1' },
                      '& .MuiOutlinedInput-root': {
                        '& fieldset': { borderColor: '#2e3a4a' },
                        '&:hover fieldset': { borderColor: '#3a4a5a' },
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
                    fullWidth
                    size="small"
                    sx={{
                      input: { color: '#e0e6ed' },
                      label: { color: '#b0b8c1' },
                      '& .MuiOutlinedInput-root': {
                        '& fieldset': { borderColor: '#2e3a4a' },
                        '&:hover fieldset': { borderColor: '#3a4a5a' },
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
                            '& fieldset': { borderColor: '#2e3a4a' },
                            '&:hover fieldset': { borderColor: '#3a4a5a' },
                          },
                          label: { color: '#b0b8c1' },
                          '.MuiSelect-select': { color: '#e0e6ed' },
                        }}
                      >
                        <InputLabel>커튼타입</InputLabel>
                        <Select
                          value={editRow.curtainType || ''}
                          onChange={(e: SelectChangeEvent) =>
                            handleEditChange('curtainType', e.target.value)
                          }
                          label="커튼타입"
                        >
                          <MenuItem value="겉커튼">겉커튼</MenuItem>
                          <MenuItem value="속커튼">속커튼</MenuItem>
                          <MenuItem value="일반">일반</MenuItem>
                        </Select>
                      </FormControl>
                    </Grid>
                    <Grid item xs={12} md={4}>
                      <FormControl
                        fullWidth
                        size="small"
                        sx={{
                          '& .MuiOutlinedInput-root': {
                            '& fieldset': { borderColor: '#2e3a4a' },
                            '&:hover fieldset': { borderColor: '#3a4a5a' },
                          },
                          label: { color: '#b0b8c1' },
                          '.MuiSelect-select': { color: '#e0e6ed' },
                        }}
                      >
                        <InputLabel>주름타입</InputLabel>
                        <Select
                          value={editRow.pleatType || ''}
                          onChange={(e: SelectChangeEvent) =>
                            handleEditChange('pleatType', e.target.value)
                          }
                          label="주름타입"
                        >
                          <MenuItem value="민자">민자</MenuItem>
                          <MenuItem value="나비">나비</MenuItem>
                          <MenuItem value="3주름">3주름</MenuItem>
                        </Select>
                      </FormControl>
                    </Grid>
                    <Grid item xs={12} md={4}>
                      <TextField
                        label="폭수"
                        type="number"
                        value={editRow.widthCount || ''}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                          handleEditChange('widthCount', e.target.value)
                        }
                        fullWidth
                        size="small"
                        sx={{
                          input: { color: '#e0e6ed' },
                          label: { color: '#b0b8c1' },
                          '& .MuiOutlinedInput-root': {
                            '& fieldset': { borderColor: '#2e3a4a' },
                            '&:hover fieldset': { borderColor: '#3a4a5a' },
                          },
                        }}
                      />
                    </Grid>
                    <Grid item xs={12} md={4}>
                      {editRow.curtainType === '속커튼' &&
                        editRow.pleatType === '민자' ? (
                        <FormControl
                          fullWidth
                          size="small"
                          sx={{
                            '& .MuiOutlinedInput-root': {
                              '& fieldset': { borderColor: '#2e3a4a' },
                              '&:hover fieldset': { borderColor: '#3a4a5a' },
                            },
                            label: { color: '#b0b8c1' },
                            '.MuiSelect-select': { color: '#e0e6ed' },
                          }}
                        >
                          <InputLabel>주름양 배수</InputLabel>
                          <Select
                            value={editRow.pleatAmount || '1.0'}
                            onChange={(e: SelectChangeEvent) =>
                              handleEditChange('pleatAmount', e.target.value)
                            }
                            label="주름양 배수"
                          >
                            <MenuItem value="1.1">1.1배</MenuItem>
                            <MenuItem value="1.2">1.2배</MenuItem>
                            <MenuItem value="1.3">1.3배</MenuItem>
                            <MenuItem value="1.4">1.4배</MenuItem>
                            <MenuItem value="1.5">1.5배</MenuItem>
                            <MenuItem value="1.6">1.6배</MenuItem>
                            <MenuItem value="1.7">1.7배</MenuItem>
                            <MenuItem value="1.8">1.8배</MenuItem>
                            <MenuItem value="1.9">1.9배</MenuItem>
                            <MenuItem value="2.0">2.0배</MenuItem>
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
                            input: { color: '#e0e6ed' },
                            label: { color: '#b0b8c1' },
                            '& .MuiOutlinedInput-root': {
                              '& fieldset': { borderColor: '#2e3a4a' },
                              '&:hover fieldset': { borderColor: '#3a4a5a' },
                            },
                          }}
                        />
                      )}
                    </Grid>
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
                          input: { color: '#e0e6ed' },
                          label: { color: '#b0b8c1' },
                          '& .MuiOutlinedInput-root': {
                            '& fieldset': { borderColor: '#2e3a4a' },
                            '&:hover fieldset': { borderColor: '#3a4a5a' },
                          },
                        }}
                      />
                    </Grid>
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
                              input: { color: '#e0e6ed' },
                              label: { color: '#b0b8c1' },
                              '& .MuiOutlinedInput-root': {
                                '& fieldset': { borderColor: '#2e3a4a' },
                                '&:hover fieldset': { borderColor: '#3a4a5a' },
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
                            '& fieldset': { borderColor: '#2e3a4a' },
                            '&:hover fieldset': { borderColor: '#3a4a5a' },
                          },
                          label: { color: '#b0b8c1' },
                          '.MuiSelect-select': { color: '#e0e6ed' },
                        }}
                      >
                        <InputLabel>줄방향</InputLabel>
                        <Select
                          value={editRow.lineDirection || ''}
                          onChange={(e: SelectChangeEvent) =>
                            handleEditChange('lineDirection', e.target.value)
                          }
                          label="줄방향"
                        >
                          <MenuItem value="좌">좌</MenuItem>
                          <MenuItem value="우">우</MenuItem>
                          <MenuItem value="없음">없음</MenuItem>
                        </Select>
                      </FormControl>
                    </Grid>
                    <Grid item xs={12} md={4}>
                      <FormControl
                        fullWidth
                        size="small"
                        sx={{
                          '& .MuiOutlinedInput-root': {
                            '& fieldset': { borderColor: '#2e3a4a' },
                            '&:hover fieldset': { borderColor: '#3a4a5a' },
                          },
                          label: { color: '#b0b8c1' },
                          '.MuiSelect-select': { color: '#e0e6ed' },
                        }}
                      >
                        <InputLabel>줄길이</InputLabel>
                        <Select
                          value={editRow.lineLength || ''}
                          onChange={(e: SelectChangeEvent) =>
                            handleEditChange('lineLength', e.target.value)
                          }
                          label="줄길이"
                        >
                          <MenuItem value="90cm">90cm</MenuItem>
                          <MenuItem value="120cm">120cm</MenuItem>
                          <MenuItem value="150cm">150cm</MenuItem>
                          <MenuItem value="180cm">180cm</MenuItem>
                          <MenuItem value="210cm">210cm</MenuItem>
                          <MenuItem value="직접입력">직접입력</MenuItem>
                        </Select>
                      </FormControl>
                    </Grid>
                    {editRow.lineLength === '직접입력' && (
                      <Grid item xs={12} md={4}>
                        <TextField
                          label="줄길이 직접입력"
                          value={editRow.customLineLength || ''}
                          onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                            handleEditChange('customLineLength', e.target.value)
                          }
                          fullWidth
                          size="small"
                          sx={{
                            input: { color: '#e0e6ed' },
                            label: { color: '#b0b8c1' },
                            '& .MuiOutlinedInput-root': {
                              '& fieldset': { borderColor: '#2e3a4a' },
                              '&:hover fieldset': { borderColor: '#3a4a5a' },
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
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      handleEditChange('details', e.target.value)
                    }
                    fullWidth
                    size="small"
                    multiline
                    rows={2}
                    sx={{
                      input: { color: '#e0e6ed' },
                      label: { color: '#b0b8c1' },
                      '& .MuiOutlinedInput-root': {
                        '& fieldset': { borderColor: '#2e3a4a' },
                        '&:hover fieldset': { borderColor: '#3a4a5a' },
                      },
                    }}
                  />
                </Grid>
                {recommendedPleatCount > 0 &&
                  editRow.productType !== '블라인드' && (
                    <Grid item xs={12}>
                      <Box
                        sx={{
                          p: 2,
                          backgroundColor: '#e3f2fd',
                          borderRadius: 1,
                          border: '1px solid #2196f3',
                          color: '#1976d2',
                        }}
                      >
                        <Typography
                          variant="subtitle2"
                          sx={{ fontWeight: 'bold', mb: 1 }}
                        >
                          추천 폭수: {recommendedPleatCount}폭
                        </Typography>
                        <Typography variant="body2" sx={{ color: '#666' }}>
                          가로 {editRow.widthMM}mm, 제품명 {editRow.productName}{' '}
                          기준으로 계산된 추천 폭수입니다.
                        </Typography>
                      </Box>
                    </Grid>
                  )}
              </Grid>
            </Box>
          </DialogContent>
          <DialogActions
            sx={{ backgroundColor: '#263040', padding: '16px 24px' }}
          >
            <Button onClick={handleEditClose} sx={{ color: '#b0b8c1' }}>
              취소
            </Button>
            <Button
              onClick={handleEditSave}
              variant="contained"
              sx={{
                backgroundColor: '#40c4ff',
                '&:hover': { backgroundColor: '#0094cc' },
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
                backgroundColor: '#23272b',
                color: '#fff',
                borderRadius: 1,
                flex: 1,
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
                sx={{ color: '#40c4ff' }}
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
                sx={{ ml: 1, color: '#fff' }}
                title="견적서 탭 표시 설정"
              >
                <ArrowDownIcon />
              </IconButton>
              <IconButton
                onClick={handleOpenSpaceSettings}
                sx={{ ml: 1, color: '#fff' }}
                title="공간 설정"
              >
                <EditIcon />
              </IconButton>
            </Box>
          </Box>
        </Grid>

        {/* 견적서 내용 */}
        <Grid item xs={12}>
          <Paper sx={{ p: 2, pt: 0, backgroundColor: '#23272b' }}>
            {(() => {
              console.log(
                '견적서 테이블 렌더링 - 현재 견적서:',
                estimates[activeTab]
              );
              console.log(
                '견적서 테이블 렌더링 - 행 수:',
                estimates[activeTab]?.rows?.length
              );
              console.log(
                '견적서 테이블 렌더링 - 필터링된 행 수:',
                filteredRows?.length
              );
              console.log('견적서 테이블 렌더링 - 필터링된 행:', filteredRows);

              return estimates[activeTab]?.rows.length > 0 ? (
                <TableContainer>
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell>구분</TableCell>
                        {FILTER_FIELDS.map(
                          field =>
                            columnVisibility[field.key] && (
                              <TableCell key={field.key}>
                                {field.label}
                              </TableCell>
                            )
                        )}
                        <TableCell>작업</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody sx={{ color: '#b0b8c1' }}>
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
                              key={row.id}
                              sx={{
                                backgroundColor:
                                  selectedProductIdx === idx
                                    ? '#f57f17'
                                    : getSpaceColor(row.space),
                                fontSize: '11pt',
                                cursor: 'pointer',
                                transition: 'background 0.2s',
                              }}
                              onClick={() => handleProductRowClick(idx)}
                              onDoubleClick={() => handleRowClick(idx)}
                            >
                              <TableCell
                                sx={{ fontWeight: 'bold', fontSize: '11pt' }}
                              >
                                제품
                              </TableCell>
                              {FILTER_FIELDS.map(
                                field =>
                                  columnVisibility[field.key] && (
                                    <TableCell
                                      key={field.key}
                                      sx={{ fontSize: '11pt' }}
                                    >
                                      {getRowValue(row, field.key)}
                                    </TableCell>
                                  )
                              )}
                              <TableCell>
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
                                >
                                  <DeleteIcon fontSize="small" />
                                </IconButton>
                              </TableCell>
                            </TableRow>
                          );
                        } else {
                          // 옵션행: 제품행보다 밝은 배경, 들여쓰기, 글씨 10.5pt
                          return (
                            <TableRow
                              key={row.id}
                              sx={{
                                backgroundColor: getSpaceColor(row.space, 1.12),
                                fontSize: '10.5pt',
                                cursor: isRail ? 'pointer' : 'default',
                              }}
                              onDoubleClick={
                                isRail ? () => handleRailEdit(idx) : undefined
                              }
                            >
                              <TableCell sx={{ pl: 3, fontSize: '10.5pt' }}>
                                {isRail ? (
                                  <Box
                                    sx={{
                                      display: 'flex',
                                      alignItems: 'center',
                                      gap: 1,
                                      whiteSpace: 'nowrap',
                                    }}
                                  >
                                    <span
                                      style={{
                                        color: '#ff9800',
                                        fontWeight: 'bold',
                                      }}
                                    >
                                      🚇
                                    </span>
                                    <span style={{ fontWeight: 'bold' }}>
                                      레일
                                    </span>
                                  </Box>
                                ) : (
                                  '└ 옵션'
                                )}
                              </TableCell>
                              <TableCell
                                colSpan={visibleNonMonetaryCount}
                                sx={{
                                  whiteSpace: 'nowrap',
                                  fontSize: '10.5pt',
                                }}
                              >
                                {isRail
                                  ? `${row.details} (서비스 품목입니다)`
                                  : `${row.optionLabel} / ${row.details}`}
                              </TableCell>
                              {monetaryFields.map(
                                field =>
                                  columnVisibility[field.key] && (
                                    <TableCell
                                      key={field.key}
                                      align="right"
                                      sx={{ fontSize: '10.5pt' }}
                                    >
                                      {getRowValue(
                                        row,
                                        field.key
                                      )?.toLocaleString()}
                                    </TableCell>
                                  )
                              )}
                              <TableCell>
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
                                  sx={{ color: isRail ? '#ff5722' : '#ff6b6b' }}
                                >
                                  <DeleteIcon fontSize="small" />
                                </IconButton>
                              </TableCell>
                            </TableRow>
                          );
                        }
                      })}
                    </TableBody>
                  </Table>
                </TableContainer>
              ) : (
                <TableContainer>
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell>구분</TableCell>
                        {FILTER_FIELDS.map(
                          field =>
                            columnVisibility[field.key] && (
                              <TableCell key={field.key}>
                                {field.label}
                              </TableCell>
                            )
                        )}
                        <TableCell>작업</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      <TableRow>
                        <TableCell
                          colSpan={FILTER_FIELDS.length + 2}
                          align="center"
                          sx={{ color: '#666' }}
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
                mt: 2,
                mb: 1,
                fontWeight: 'bold',
                fontSize: 14,
                display: 'flex',
                alignItems: 'center',
                flexWrap: 'wrap',
                gap: '32px',
              }}
            >
              <span style={{ color: '#a5d6a7' }}>
                제품 합계금액(VAT포함): {productTotalAmount.toLocaleString()} 원
              </span>
              <span style={{ color: '#ff9800' }}>
                옵션 합계금액(VAT포함): {optionTotalAmount.toLocaleString()} 원
              </span>
            </Box>
            <Box
              sx={{
                mt: 0,
                mb: 2,
                fontWeight: 'bold',
                fontSize: 16,
                display: 'flex',
                alignItems: 'center',
              }}
            >
              <span style={{ color: '#40c4ff', marginRight: 32 }}>
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
                <span style={{ color: '#76ff03', marginRight: 32 }}>
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
                onClick={handleToggleMarginSum}
              >
                WINDOWSTORY
              </Button>
              <Slide
                direction="left"
                in={showMarginSum}
                mountOnEnter
                unmountOnExit
              >
                <span>
                  <span style={{ color: '#718096' }}>
                    마진(VAT별도): {sumMargin.toLocaleString()} 원
                  </span>
                </span>
              </Slide>
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
            {/* 버튼들 */}
            <Box sx={{ display: 'flex', gap: 1, mt: 2, mb: 1 }}>
              <Button
                variant="contained"
                size="small"
                sx={{
                  backgroundColor: '#0091ea',
                  color: '#fff',
                  '&:hover': { backgroundColor: '#0064b7' },
                  minWidth: 120,
                  fontSize: 13,
                  py: 0.5,
                  px: 1.5,
                }}
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
                sx={{ minWidth: 60, fontSize: 13, py: 0.5, px: 1.5 }}
                onClick={() => setFilterModalOpen(true)}
              >
                필터
              </Button>
              <Button
                variant="outlined"
                size="small"
                sx={{ minWidth: 80, fontSize: 13, py: 0.5, px: 1.5 }}
                onClick={handleOutputClick}
                endIcon={<ArrowDownIcon />}
              >
                출력하기
              </Button>
              <Button
                variant="outlined"
                size="small"
                color="success"
                sx={{ minWidth: 80, fontSize: 13, py: 0.5, px: 1.5 }}
                onClick={handleSaveEstimate}
              >
                저장하기
              </Button>
              <Button
                variant="outlined"
                size="small"
                color="info"
                sx={{ minWidth: 80, fontSize: 13, py: 0.5, px: 1.5 }}
                onClick={handleOpenCustomerList}
              >
                고객리스트
              </Button>
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
              >
                <MenuItem onClick={() => handleOutputOption('print')}>
                  <PrintIcon sx={{ mr: 1, fontSize: 20 }} />
                  프린트
                </MenuItem>
                <MenuItem onClick={() => handleOutputOption('pdf')}>
                  <PdfIcon sx={{ mr: 1, fontSize: 20 }} />
                  PDF
                </MenuItem>
                <MenuItem onClick={() => handleOutputOption('jpg')}>
                  <ImageIcon sx={{ mr: 1, fontSize: 20 }} />
                  JPG
                </MenuItem>
                <MenuItem onClick={() => handleOutputOption('share')}>
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
        >
          <DialogTitle>열 표시 설정</DialogTitle>
          <DialogContent>
            <Grid container spacing={2}>
              {FILTER_FIELDS.map(f => (
                <Grid item xs={4} key={f.key}>
                  <FormControlLabel
                    control={
                      <Checkbox
                        checked={columnVisibility[f.key]}
                        onChange={() => handleColumnToggle(f.key)}
                      />
                    }
                    label={f.label}
                  />
                </Grid>
              ))}
            </Grid>
          </DialogContent>
          <DialogActions>
            <Button onClick={handleFilterReset}>초기화</Button>
            <Button
              variant="contained"
              onClick={() => setFilterModalOpen(false)}
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

      {/* 저장된 견적서 리스트 */}
      <Grid item xs={12}>
        <Paper sx={{ p: 2, backgroundColor: '#232a36' }}>
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              mb: 2,
            }}
          >
            <Typography
              sx={{ fontWeight: 'bold', color: '#e0e6ed', fontSize: '17px' }}
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
                  color: '#b0b8c1',
                  borderColor: '#2e3a4a',
                  '&:hover': {
                    backgroundColor: '#263040',
                    borderColor: '#3a4a5a',
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
                  color: '#b0b8c1',
                  borderColor: '#2e3a4a',
                  '&:hover': {
                    backgroundColor: '#263040',
                    borderColor: '#3a4a5a',
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
                  input: { color: '#e0e6ed' },
                  label: { color: '#b0b8c1' },
                  '& .MuiOutlinedInput-root': {
                    '& fieldset': { borderColor: '#2e3a4a' },
                    '&:hover fieldset': { borderColor: '#3a4a5a' },
                  },
                }}
                size="small"
                InputProps={{
                  endAdornment: (
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <ButtonGroup variant="outlined" size="small">
                        <Button
                          onClick={() => setPeriodMode('all')}
                          sx={{
                            color: periodMode === 'all' ? '#40c4ff' : '#b0b8c1',
                            borderColor: '#2e3a4a',
                            backgroundColor:
                              periodMode === 'all' ? '#263040' : 'inherit',
                          }}
                        >
                          전체
                        </Button>
                        <Button
                          onClick={() => setPeriodMode('week')}
                          sx={{
                            color:
                              periodMode === 'week' ? '#40c4ff' : '#b0b8c1',
                            borderColor: '#2e3a4a',
                            backgroundColor:
                              periodMode === 'week' ? '#263040' : 'inherit',
                          }}
                        >
                          주간
                        </Button>
                        <Button
                          onClick={() => setPeriodMode('month')}
                          sx={{
                            color:
                              periodMode === 'month' ? '#40c4ff' : '#b0b8c1',
                            borderColor: '#2e3a4a',
                            backgroundColor:
                              periodMode === 'month' ? '#263040' : 'inherit',
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
                              periodMode === 'quarter' ? '#40c4ff' : '#b0b8c1',
                            borderColor: '#2e3a4a',
                            backgroundColor:
                              periodMode === 'quarter' ? '#263040' : 'inherit',
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
                              periodMode === 'half' ? '#40c4ff' : '#b0b8c1',
                            borderColor: '#2e3a4a',
                            backgroundColor:
                              periodMode === 'half' ? '#263040' : 'inherit',
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
                              periodMode === 'year' ? '#40c4ff' : '#b0b8c1',
                            borderColor: '#2e3a4a',
                            backgroundColor:
                              periodMode === 'year' ? '#263040' : 'inherit',
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
                sx={{ backgroundColor: '#232a36', borderRadius: 1 }}
              >
                <Table size="small">
                  <TableHead>
                    <TableRow sx={{ backgroundColor: '#263040' }}>
                      {estimateListDisplay.showEstimateNo && (
                        <TableCell
                          sx={{ color: '#b0b8c1', borderColor: '#2e3a4a' }}
                        >
                          견적번호
                        </TableCell>
                      )}
                      {estimateListDisplay.showEstimateDate && (
                        <TableCell
                          sx={{ color: '#b0b8c1', borderColor: '#2e3a4a' }}
                        >
                          견적일자
                        </TableCell>
                      )}
                      {estimateListDisplay.showSavedDate && (
                        <TableCell
                          sx={{ color: '#b0b8c1', borderColor: '#2e3a4a' }}
                        >
                          저장일
                        </TableCell>
                      )}
                      {estimateListDisplay.showCustomerName && (
                        <TableCell
                          sx={{ color: '#b0b8c1', borderColor: '#2e3a4a' }}
                        >
                          고객명
                        </TableCell>
                      )}
                      {estimateListDisplay.showContact && (
                        <TableCell
                          sx={{ color: '#b0b8c1', borderColor: '#2e3a4a' }}
                        >
                          연락처
                        </TableCell>
                      )}
                      {estimateListDisplay.showProjectName && (
                        <TableCell
                          sx={{ color: '#b0b8c1', borderColor: '#2e3a4a' }}
                        >
                          프로젝트명
                        </TableCell>
                      )}
                      {estimateListDisplay.showProducts && (
                        <TableCell
                          sx={{ color: '#b0b8c1', borderColor: '#2e3a4a' }}
                        >
                          포함제품
                        </TableCell>
                      )}
                      {estimateListDisplay.showTotalAmount && (
                        <TableCell
                          sx={{ color: '#b0b8c1', borderColor: '#2e3a4a' }}
                        >
                          총금액
                        </TableCell>
                      )}
                      {estimateListDisplay.showDiscountedAmount && (
                        <TableCell
                          sx={{ color: '#b0b8c1', borderColor: '#2e3a4a' }}
                        >
                          할인후금액
                        </TableCell>
                      )}
                      {estimateListDisplay.showDiscountAmount && (
                        <TableCell
                          sx={{ color: '#b0b8c1', borderColor: '#2e3a4a' }}
                        >
                          할인금액
                        </TableCell>
                      )}
                      {estimateListDisplay.showDiscountRate && (
                        <TableCell
                          sx={{ color: '#b0b8c1', borderColor: '#2e3a4a' }}
                        >
                          할인율(%)
                        </TableCell>
                      )}
                      {estimateListDisplay.showMargin && (
                        <TableCell
                          sx={{ color: '#b0b8c1', borderColor: '#2e3a4a' }}
                        >
                          마진
                        </TableCell>
                      )}
                      {estimateListDisplay.showActions && (
                        <TableCell
                          sx={{ color: '#b0b8c1', borderColor: '#2e3a4a' }}
                        >
                          작업
                        </TableCell>
                      )}
                      {estimateListDisplay.showAddress && (
                        <TableCell
                          sx={{ color: '#b0b8c1', borderColor: '#2e3a4a' }}
                        >
                          주소
                        </TableCell>
                      )}
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {filteredSavedEstimatesList.length > 0 ? (
                      filteredSavedEstimatesList.map((est: any) => {
                        const discountedAmount =
                          est.discountedAmount ??
                          est.totalAmount - est.discountAmount;
                        const status = getEstimateStatus(est);
                        // statusUpdateTrigger를 사용하여 실시간 업데이트
                        const key = `${est.id}-${statusUpdateTrigger}`;

                        // 그룹 정보 가져오기
                        const { colorIndex, isLatest, isFinal } =
                          getEstimateGroupInfo(est, filteredSavedEstimatesList);
                        const backgroundColor = isLatest
                          ? groupColors[colorIndex].dark
                          : groupColors[colorIndex].light;

                        // final 견적서인 경우 특별한 스타일 적용
                        const finalStyle = isFinal
                          ? {
                            backgroundColor: '#1a237e',
                            border: '2px solid #3f51b5',
                            '&:hover': {
                              backgroundColor: '#283593',
                              border: '2px solid #5c6bc0',
                            },
                          }
                          : {};

                        return (
                          <TableRow
                            key={key}
                            hover
                            onDoubleClick={() => handleLoadSavedEstimate(est)}
                            sx={{
                              cursor: 'pointer',
                              backgroundColor: backgroundColor,
                              '&:hover': {
                                backgroundColor: isLatest
                                  ? groupColors[colorIndex].light
                                  : groupColors[colorIndex].dark,
                                transition: 'background-color 0.2s ease',
                              },
                              ...finalStyle,
                            }}
                          >
                            {estimateListDisplay.showEstimateNo && (
                              <TableCell
                                sx={{
                                  color: isFinal ? '#ffd700' : '#e0e6ed',
                                  borderColor: '#2e3a4a',
                                  fontWeight: isFinal ? 'bold' : 'normal',
                                }}
                              >
                                {est.estimateNo}
                                {isFinal && (
                                  <Chip
                                    label="Final"
                                    size="small"
                                    sx={{
                                      ml: 1,
                                      backgroundColor: '#ffd700',
                                      color: '#1a237e',
                                      fontSize: '0.7rem',
                                      height: '20px',
                                    }}
                                  />
                                )}
                              </TableCell>
                            )}
                            {estimateListDisplay.showEstimateDate && (
                              <TableCell
                                sx={{
                                  color: '#e0e6ed',
                                  borderColor: '#2e3a4a',
                                }}
                              >
                                {est.estimateDate}
                              </TableCell>
                            )}
                            {estimateListDisplay.showSavedDate && (
                              <TableCell
                                sx={{
                                  color: '#e0e6ed',
                                  borderColor: '#2e3a4a',
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
                                  color: '#e0e6ed',
                                  borderColor: '#2e3a4a',
                                }}
                              >
                                {est.customerName}
                              </TableCell>
                            )}
                            {estimateListDisplay.showContact && (
                              <TableCell
                                sx={{
                                  color: '#e0e6ed',
                                  borderColor: '#2e3a4a',
                                }}
                              >
                                {est.contact}
                              </TableCell>
                            )}
                            {estimateListDisplay.showProjectName && (
                              <TableCell
                                sx={{
                                  color: '#e0e6ed',
                                  borderColor: '#2e3a4a',
                                }}
                              >
                                {est.projectName}
                              </TableCell>
                            )}
                            {estimateListDisplay.showProducts && (
                              <TableCell
                                sx={{
                                  color: '#e0e6ed',
                                  borderColor: '#2e3a4a',
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
                                  color: '#e0e6ed',
                                  borderColor: '#2e3a4a',
                                }}
                              >
                                {est.totalAmount?.toLocaleString()}원
                              </TableCell>
                            )}
                            {estimateListDisplay.showDiscountedAmount && (
                              <TableCell
                                sx={{
                                  color: '#e0e6ed',
                                  borderColor: '#2e3a4a',
                                }}
                              >
                                {discountedAmount.toLocaleString()} 원
                              </TableCell>
                            )}
                            {estimateListDisplay.showDiscountAmount && (
                              <TableCell
                                sx={{
                                  color: '#e0e6ed',
                                  borderColor: '#2e3a4a',
                                }}
                              >
                                {est.discountAmount?.toLocaleString()}원
                              </TableCell>
                            )}
                            {estimateListDisplay.showDiscountRate && (
                              <TableCell
                                sx={{
                                  color: '#e0e6ed',
                                  borderColor: '#2e3a4a',
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
                                  color: '#e0e6ed',
                                  borderColor: '#2e3a4a',
                                }}
                              >
                                {est.margin?.toLocaleString()}원
                              </TableCell>
                            )}

                            {estimateListDisplay.showActions && (
                              <TableCell sx={{ borderColor: '#2e3a4a' }}>
                                {/* final 견적서인 경우 특별한 버튼 표시 */}
                                {isFinal && (
                                  <>
                                    <Button
                                      size="small"
                                      variant="contained"
                                      sx={{
                                        mr: 1,
                                        minWidth: 80,
                                        backgroundColor: '#ffd700',
                                        color: '#1a237e',
                                        '&:hover': {
                                          backgroundColor: '#ffed4e',
                                        },
                                      }}
                                      onClick={() =>
                                        handleProceedToContract(est)
                                      }
                                    >
                                      계약진행
                                    </Button>
                                    <Button
                                      size="small"
                                      variant="outlined"
                                      sx={{
                                        mr: 1,
                                        minWidth: 80,
                                        borderColor: '#4caf50',
                                        color: '#4caf50',
                                        '&:hover': {
                                          borderColor: '#45a049',
                                          backgroundColor:
                                            'rgba(76, 175, 80, 0.1)',
                                        },
                                      }}
                                      onClick={() =>
                                        handleUpdateExistingContract(est)
                                      }
                                    >
                                      기존계약업데이트
                                    </Button>
                                    <IconButton
                                      size="small"
                                      onClick={() =>
                                        handleEditFinalEstimate(est)
                                      }
                                      sx={{
                                        mr: 1,
                                        color: '#40c4ff',
                                        '&:hover': {
                                          backgroundColor:
                                            'rgba(64, 196, 255, 0.1)',
                                        },
                                      }}
                                      title="Final 견적서 수정"
                                    >
                                      <EditIcon fontSize="small" />
                                    </IconButton>
                                    <IconButton
                                      size="small"
                                      onClick={() =>
                                        handleAddNewFinalEstimate(est)
                                      }
                                      sx={{
                                        mr: 1,
                                        color: '#ff9800',
                                        '&:hover': {
                                          backgroundColor:
                                            'rgba(255, 152, 0, 0.1)',
                                        },
                                      }}
                                      title="새 Final 견적서 생성"
                                    >
                                      <AddIcon fontSize="small" />
                                    </IconButton>
                                  </>
                                )}

                                {/* 상태에 따른 버튼 표시 */}
                                {!isFinal && status === '견적완료' && (
                                  <Button
                                    size="small"
                                    variant="contained"
                                    color="primary"
                                    sx={{
                                      mr: 1,
                                      fontWeight: 'bold',
                                      minWidth: 80,
                                      color: '#fff',
                                    }}
                                    onClick={() => handleProceedToContract(est)}
                                  >
                                    진행
                                  </Button>
                                )}

                                {status === '계약진행중' && (
                                  <>
                                    <Button
                                      size="small"
                                      variant="contained"
                                      color="warning"
                                      sx={{
                                        mr: 1,
                                        fontWeight: 'bold',
                                        minWidth: 80,
                                        color: '#fff',
                                      }}
                                      onClick={() => handleViewContract(est)}
                                    >
                                      계약진행중
                                    </Button>
                                    <Button
                                      size="small"
                                      variant="outlined"
                                      color="error"
                                      sx={{ mr: 1, minWidth: 60 }}
                                      onClick={() => handleCancelContract(est)}
                                    >
                                      취소
                                    </Button>
                                  </>
                                )}

                                {status === '계약완료' && (
                                  <Button
                                    size="small"
                                    variant="contained"
                                    color="success"
                                    sx={{
                                      mr: 1,
                                      fontWeight: 'bold',
                                      minWidth: 80,
                                      color: '#fff',
                                    }}
                                    onClick={() => handleViewContract(est)}
                                  >
                                    계약완료
                                  </Button>
                                )}

                                {status === '발주완료' && (
                                  <Button
                                    size="small"
                                    variant="contained"
                                    color="secondary"
                                    sx={{
                                      mr: 1,
                                      fontWeight: 'bold',
                                      minWidth: 80,
                                      color: '#fff',
                                    }}
                                    onClick={() => handleViewOrder(est)}
                                  >
                                    발주완료
                                  </Button>
                                )}

                                {status === '납품완료' && (
                                  <Button
                                    size="small"
                                    variant="contained"
                                    sx={{
                                      mr: 1,
                                      backgroundColor: '#607d8b',
                                      '&:hover': { backgroundColor: '#455a64' },
                                      fontWeight: 'bold',
                                      minWidth: 80,
                                      color: '#fff',
                                    }}
                                    onClick={() => handleViewOrder(est)}
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
                                    color: '#b0b8c1',
                                    '&:hover': { backgroundColor: '#263040' },
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
                                    color: '#40c4ff',
                                    '&:hover': { backgroundColor: '#263040' },
                                  }}
                                  title="출력하기"
                                >
                                  <PrintIcon fontSize="small" />
                                </IconButton>

                                <IconButton
                                  size="small"
                                  onClick={() => {
                                    if (
                                      window.confirm(
                                        '정말로 이 견적서를 삭제하시겠습니까?'
                                      )
                                    ) {
                                      const updatedSavedEstimates =
                                        savedEstimates.filter(
                                          (e: any) => e.id !== est.id
                                        );
                                      localStorage.setItem(
                                        'saved_estimates',
                                        JSON.stringify(updatedSavedEstimates)
                                      );
                                      alert('견적서가 삭제되었습니다.');
                                      window.location.reload();
                                    }
                                  }}
                                  sx={{
                                    color: '#ff6b6b',
                                    '&:hover': { backgroundColor: '#3a4a5a' },
                                  }}
                                  title="삭제"
                                >
                                  <DeleteIcon fontSize="small" />
                                </IconButton>
                              </TableCell>
                            )}
                            {estimateListDisplay.showAddress && (
                              <TableCell
                                sx={{
                                  color: '#e0e6ed',
                                  borderColor: '#2e3a4a',
                                }}
                              >
                                {est.address}
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
                          sx={{ color: '#b0b8c1', backgroundColor: '#232a36' }}
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
              color: '#e0e6ed',
              fontSize: isMobile ? '1.2rem' : '1.25rem',
              fontWeight: 600,
            }}
          >
            고객 목록
          </Typography>
        </DialogTitle>
        <DialogContent sx={{
          p: isMobile ? 2 : 3,
          backgroundColor: '#1e2633',
          '& .MuiDialogContent-root': {
            backgroundColor: '#1e2633',
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
              '& .MuiInputLabel-root': { color: '#b0b8c1' },
              '& .MuiOutlinedInput-root': {
                '& fieldset': { borderColor: '#2e3a4a' },
                '&:hover fieldset': { borderColor: '#40c4ff' },
                '&.Mui-focused fieldset': { borderColor: '#40c4ff' },
              },
              '& .MuiInputBase-input': { color: '#e0e6ed' },
            }}
            size={isMobile ? "medium" : "small"}
          />
          <TableContainer component={Paper} sx={{
            maxHeight: isMobile ? '70vh' : 500,
            backgroundColor: '#232a36',
            '& .MuiTable-root': {
              backgroundColor: '#232a36',
            },
            '& .MuiTableCell-root': {
              color: '#e0e6ed',
              borderColor: '#2e3a4a',
            },
            '& .MuiTableHead-root .MuiTableCell-root': {
              backgroundColor: '#1e2633',
              color: '#b0b8c1',
              fontWeight: 600,
            },
            '& .MuiTableRow-root:hover': {
              backgroundColor: '#263040',
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
                          backgroundColor: '#40c4ff',
                          minHeight: isMobile ? '44px' : 'auto',
                          fontSize: isMobile ? '0.9rem' : '0.875rem',
                          '&:hover': {
                            backgroundColor: '#33a3cc'
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
            borderColor: '#2e3a4a',
            p: 2,
            backgroundColor: '#1e2633'
          }}>
            <Button
              onClick={() => setCustomerListDialogOpen(false)}
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
    </>
  );
};

export default EstimateManagement;

