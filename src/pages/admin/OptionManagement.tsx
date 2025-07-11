import React, {
  useState,
  useRef,
  useEffect,
  useCallback,
  useMemo,
} from 'react';
import {
  Grid,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Button,
  Typography,
  Box,
  Tabs,
  Tab,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TableSortLabel,
  Chip,
  Alert,
  useMediaQuery,
  useTheme,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import ClearIcon from '@mui/icons-material/Clear';
import UploadFileIcon from '@mui/icons-material/UploadFile';
import DownloadIcon from '@mui/icons-material/Download';
import AddCircleIcon from '@mui/icons-material/AddCircle';
import RemoveCircleIcon from '@mui/icons-material/RemoveCircle';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import * as XLSX from 'xlsx';
import {
  DragDropContext,
  Droppable,
  Draggable,
  DroppableProvided,
  DraggableProvided,
  DropResult,
} from 'react-beautiful-dnd';
import FileUploadIcon from '@mui/icons-material/FileUpload';
import FileDownloadIcon from '@mui/icons-material/FileDownload';
import RefreshIcon from '@mui/icons-material/Refresh';
import { optionService } from '../../utils/firebaseDataService';

interface OptionItem {
  id: number;
  vendor: string;
  optionName: string;
  productCode: string;
  salePrice: number;
  purchaseCost: number;
  details: string;
  optionType: string;
  note: string;
  createdAt?: string;
  updatedAt?: string;
}

interface OptionValidation {
  vendor: boolean;
  optionName: boolean;
  salePrice: boolean;
  optionType: boolean;
}

const defaultValidation: OptionValidation = {
  vendor: true,
  optionName: true,
  salePrice: true,
  optionType: true,
};

interface ColumnHeader {
  field: keyof OptionItem;
  label: string;
}

const optionHeaders: ColumnHeader[] = [
  { field: 'vendor', label: '공급업체' },
  { field: 'optionName', label: '옵션명' },
  { field: 'productCode', label: '제품코드' },
  { field: 'salePrice', label: '판매가' },
  { field: 'purchaseCost', label: '원가' },
  { field: 'details', label: '상세정보' },
  { field: 'note', label: '적용타입' },
];

const sortKeys: (keyof OptionItem)[] = [
  'vendor',
  'optionName',
  'productCode',
  'salePrice',
  'purchaseCost',
  'details',
  'optionType',
  'note',
];

const initialOptions: OptionItem[] = [
  {
    id: 1,
    vendor: 'A상사',
    optionName: '방염',
    productCode: 'FIRE001',
    salePrice: 10000,
    purchaseCost: 8000,
    details: '방염 처리 옵션',
    optionType: '커튼',
    note: '',
  },
  {
    id: 2,
    vendor: 'B상사',
    optionName: '방수',
    productCode: 'WATER001',
    salePrice: 12000,
    purchaseCost: 9000,
    details: '방수 처리 옵션',
    optionType: '블라인드',
    note: '',
  },
];

const OPTION_STORAGE_KEY = 'erp_options';
const OPTION_TYPES_STORAGE_KEY = 'erp_option_types';
const DEBOUNCE_DELAY = 500; // 디바운스 딜레이 (ms)

// 옵션 타입 기본값 - EstimateManagement와 일관되게 수정
const defaultTabLabels = [
  '커튼옵션',
  '블라인드옵션',
  '커튼전동',
  '블라인드전동',
  '헌터옵션',
  '기타옵션',
];

// 옵션 로드 함수 개선 - EstimateManagement와 일관되게 수정
function loadOptions(): OptionItem[][] {
  try {
    const data = localStorage.getItem(OPTION_STORAGE_KEY);
    if (!data) return [[], [], [], [], [], []];

    const parsed = JSON.parse(data);
    const optionTypes = loadOptionTypes();

    // 2차원 배열이면 각 옵션에 updatedAt 추가
    if (Array.isArray(parsed) && Array.isArray(parsed[0])) {
      // 기존 2차원 배열이 새로운 순서와 다를 수 있으므로 재정렬
      const reorderedOptions: OptionItem[][] = optionTypes.map(type => {
        const typeWithoutOption = type.replace('옵션', '');
        const allOptions = parsed.flat();
        return allOptions
          .filter((opt: any) => opt.optionType === typeWithoutOption)
          .map((opt: any) => ({
            ...opt,
            updatedAt:
              opt.updatedAt || opt.createdAt || new Date().toISOString(),
          }));
      });
      return reorderedOptions;
    }

    // 1차원 배열이면 옵션 타입별로 분리하고 updatedAt 추가 (EstimateManagement와 동일한 순서)
    return optionTypes.map(type => {
      const typeWithoutOption = type.replace('옵션', '');
      return parsed
        .filter((o: OptionItem) => o.optionType === typeWithoutOption)
        .map((opt: OptionItem) => ({
          ...opt,
          updatedAt: opt.updatedAt || opt.createdAt || new Date().toISOString(),
        }));
    });
  } catch (error) {
    console.error('옵션 로드 중 오류:', error);
    return [[], [], [], [], [], []];
  }
}

// 옵션 저장 함수 개선
function saveOptions(options: OptionItem[][]): void {
  try {
    localStorage.setItem(OPTION_STORAGE_KEY, JSON.stringify(options));
  } catch (error) {
    console.error('옵션 저장 중 오류:', error);
    alert('옵션 저장 중 오류가 발생했습니다.');
  }
}

// 옵션 타입 마이그레이션 함수 추가
function migrateOptionTypes(): void {
  try {
    const data = localStorage.getItem(OPTION_TYPES_STORAGE_KEY);
    if (!data) return;

    const oldTypes = JSON.parse(data);
    const newTypes = [
      '커튼옵션',
      '블라인드옵션',
      '커튼전동',
      '블라인드전동',
      '헌터옵션',
      '기타옵션',
    ];

    // 기존 순서가 다르면 새로운 순서로 업데이트
    if (JSON.stringify(oldTypes) !== JSON.stringify(newTypes)) {
      saveOptionTypes(newTypes);
      console.log('옵션 타입 순서가 새로운 순서로 마이그레이션되었습니다.');
    }
  } catch (error) {
    console.error('옵션 타입 마이그레이션 중 오류:', error);
  }
}

// 옵션 타입 로드 함수 개선 - 마이그레이션 포함
function loadOptionTypes(): string[] {
  try {
    // 마이그레이션 실행
    migrateOptionTypes();

    const data = localStorage.getItem(OPTION_TYPES_STORAGE_KEY);
    const types = data ? JSON.parse(data) : null;
    return Array.isArray(types) && types.length > 0
      ? types
      : [...defaultTabLabels];
  } catch (error) {
    console.error('옵션 타입 로드 중 오류:', error);
    return [...defaultTabLabels];
  }
}

// 옵션 타입 저장 함수 개선
function saveOptionTypes(types: string[]): void {
  try {
    localStorage.setItem(OPTION_TYPES_STORAGE_KEY, JSON.stringify(types));
  } catch (error) {
    console.error('옵션 타입 저장 중 오류:', error);
    alert('옵션 타입 저장 중 오류가 발생했습니다.');
  }
}

// 옵션 유효성 검사 함수
function validateOption(option: OptionItem): OptionValidation {
  // % 적용타입일 때는 판매가가 필요 없음
  const isPercentType = option.note && option.note.includes('%');
  
  return {
    vendor: option.vendor.trim().length > 0,
    optionName: option.optionName.trim().length > 0,
    salePrice: isPercentType ? true : option.salePrice > 0,
    optionType: option.optionType.trim().length > 0,
  };
}

const initialOption: OptionItem = {
  id: 0,
  vendor: '',
  optionName: '',
  productCode: '',
  salePrice: 0,
  purchaseCost: 0,
  details: '',
  optionType: '',
  note: '',
};

const OptionManagement: React.FC = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  
  const [tab, setTab] = useState(0);
  const [options, setOptions] = useState<OptionItem[][]>(() => loadOptions());
  const [tabLabels, setTabLabels] = useState<string[]>(() => loadOptionTypes());
  const [selectedOption, setSelectedOption] =
    useState<OptionItem>(initialOption);
  const [editMode, setEditMode] = useState(false);
  const [editIndex, setEditIndex] = useState<number | null>(null);
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState<keyof OptionItem | null>(null);
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [addTypeDialogOpen, setAddTypeDialogOpen] = useState(false);
  const [newOptionType, setNewOptionType] = useState('');
  const [validation, setValidation] =
    useState<OptionValidation>(defaultValidation);
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // 디바운스된 저장 함수
  const debouncedSave = useCallback((newOptions: OptionItem[][]) => {
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }
    saveTimeoutRef.current = setTimeout(() => {
      saveOptions(newOptions);
    }, DEBOUNCE_DELAY);
  }, []);

  // options가 바뀔 때마다 디바운스된 저장 실행
  useEffect(() => {
    debouncedSave(options);
    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, [options, debouncedSave]);

  // tabLabels가 바뀔 때마다 localStorage에 저장
  useEffect(() => {
    saveOptionTypes(tabLabels);
  }, [tabLabels]);

  // 새로운 탭이 추가될 때 해당 탭의 옵션 배열도 추가
  useEffect(() => {
    if (options.length < tabLabels.length) {
      const newOptions = [...options];
      while (newOptions.length < tabLabels.length) {
        newOptions.push([]);
      }
      setOptions(newOptions);
    }
  }, [tabLabels, options.length]);

  // 탭이 변경될 때 해당 탭의 옵션 배열이 없으면 빈 배열로 초기화
  useEffect(() => {
    if (options[tab] === undefined) {
      setOptions(prev => {
        const newOptions = [...prev];
        while (newOptions.length <= tab) {
          newOptions.push([]);
        }
        return newOptions;
      });
    }
  }, [tab, options]);

  // tab이 tabLabels 범위를 벗어나면 0으로 설정
  useEffect(() => {
    if (tab >= tabLabels.length && tabLabels.length > 0) {
      setTab(0);
    }
  }, [tab, tabLabels.length]);

  // 컴포넌트 마운트 시 tabLabels가 유효한 배열이 되도록 보장
  useEffect(() => {
    if (!tabLabels || tabLabels.length === 0) {
      setTabLabels([...defaultTabLabels]);
    }
  }, []);

  // 컴포넌트 마운트 시 옵션 데이터 마이그레이션 및 재정렬
  useEffect(() => {
    const currentOptions = loadOptions();
    const currentTabLabels = loadOptionTypes();

    // 옵션 데이터가 새로운 순서와 다르면 재정렬
    if (JSON.stringify(currentTabLabels) !== JSON.stringify(tabLabels)) {
      setTabLabels(currentTabLabels);
      setOptions(currentOptions);
    }
  }, []);

  // 검색 필터 개선
  const filteredOptions = useMemo(() => {
    const currentOptions = options[tab] || [];
    const searchTerm = search.trim().toLowerCase();

    if (!searchTerm) return currentOptions;

    return currentOptions.filter(o => {
      return (
        o.vendor.toLowerCase().includes(searchTerm) ||
        o.optionName.toLowerCase().includes(searchTerm) ||
        o.details.toLowerCase().includes(searchTerm) ||
        o.optionType.toLowerCase().includes(searchTerm) ||
        o.note.toLowerCase().includes(searchTerm) ||
        o.salePrice.toString().includes(searchTerm) ||
        o.purchaseCost.toString().includes(searchTerm)
      );
    });
  }, [options, tab, search]);

  // 정렬 로직 개선
  const sortedOptions = useMemo(() => {
    if (!sortBy) return filteredOptions;

    return [...filteredOptions].sort((a, b) => {
      const aValue = a[sortBy];
      const bValue = b[sortBy];

      if (typeof aValue === 'number' && typeof bValue === 'number') {
        return sortOrder === 'asc' ? aValue - bValue : bValue - aValue;
      }

      const aStr = String(aValue).toLowerCase();
      const bStr = String(bValue).toLowerCase();
      return sortOrder === 'asc'
        ? aStr.localeCompare(bStr)
        : bStr.localeCompare(aStr);
    });
  }, [filteredOptions, sortBy, sortOrder]);

  // Modal Handlers
  const handleOpenModal = () => setIsModalOpen(true);

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedOption(initialOption);
    setEditMode(false);
    setEditIndex(null);
    setValidation(defaultValidation);
    setErrorMessage('');
  };

  const handleAddNewClick = () => {
    setEditMode(false);
    setSelectedOption(initialOption);
    handleOpenModal();
  };

  // 옵션 추가/수정 핸들러 개선
  const handleAddOption = async () => {
    const currentTabType = getCurrentTabType();
    const optionWithType = {
      ...selectedOption,
      optionType: currentTabType,
    };

    const validationResult = validateOption(optionWithType);
    setValidation(validationResult);

    if (!Object.values(validationResult).every(Boolean)) {
      setErrorMessage('필수 항목을 모두 입력해주세요.');
      return;
    }

    const newOption: OptionItem = {
      ...optionWithType,
      id: editMode ? selectedOption.id : Date.now(),
      updatedAt: new Date().toISOString(),
      createdAt: editMode ? selectedOption.createdAt : new Date().toISOString(),
    };

    const updatedOptions = options.map((arr, i) => {
      if (i === tab) {
        if (editMode && editIndex !== null) {
          const currentTabOptions = [...arr];
          currentTabOptions[editIndex] = newOption;
          return currentTabOptions;
        } else {
          return [...arr, newOption];
        }
      }
      return arr;
    });

    setOptions(updatedOptions);

    // localStorage에 저장
    saveOptions(updatedOptions);

    // Firebase에 자동 저장
    try {
      console.log('Firebase에 옵션 데이터 저장 시작');
      if (editMode && editIndex !== null) {
        // 기존 옵션 업데이트
        await optionService.updateOption(newOption.id.toString(), newOption);
      } else {
        // 새 옵션 저장
        await optionService.saveOption(newOption);
      }
      console.log('Firebase에 옵션 데이터 저장 완료');
    } catch (error) {
      console.error('Firebase 저장 실패:', error);
      alert('옵션 정보가 저장되었지만 Firebase 동기화에 실패했습니다. 인터넷 연결을 확인해주세요.');
    }

    handleCloseModal();
  };

  // 입력 핸들러 개선
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    const newOption = {
      ...selectedOption,
      [name]:
        name === 'salePrice' || name === 'purchaseCost'
          ? value === ''
            ? 0
            : Number(value)
          : value,
    };
    setSelectedOption(newOption);

    // 실시간 유효성 검사
    if (name in defaultValidation) {
      const currentTabType = getCurrentTabType();
      const optionWithType = {
        ...newOption,
        optionType: currentTabType,
      };
      setValidation(prev => ({
        ...prev,
        [name]: validateOption(optionWithType)[name as keyof OptionValidation],
      }));
    }

    // 에러 메시지 초기화
    if (errorMessage) {
      setErrorMessage('');
    }
  };

  const handleEdit = (idx: number) => {
    const currentOptions = sortedOptions;
    if (idx >= 0 && idx < currentOptions.length) {
      const originalIndex = options[tab].findIndex(
        opt => opt.id === currentOptions[idx].id
      );
      setSelectedOption(currentOptions[idx]);
      setEditMode(true);
      setEditIndex(originalIndex);
      handleOpenModal();
    }
  };

  const handleCopy = (idx: number) => {
    const currentOptions = sortedOptions;
    if (idx >= 0 && idx < currentOptions.length) {
      const optionToCopy = currentOptions[idx];
      const copy = {
        ...optionToCopy,
        id: Date.now(),
        optionName: `${optionToCopy.optionName} (복사본)`,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      setOptions(prev =>
        prev.map((arr, i) => (i === tab ? [...arr, copy] : arr))
      );
    }
  };

  const handleDelete = (idx: number) => {
    const currentOptions = sortedOptions;
    if (idx >= 0 && idx < currentOptions.length) {
      if (window.confirm('정말로 이 옵션을 삭제하시겠습니까?')) {
        const optionToDeleteId = currentOptions[idx].id;
        setOptions(prev =>
          prev.map((arr, i) =>
            i === tab ? arr.filter(opt => opt.id !== optionToDeleteId) : arr
          )
        );
      }
    }
  };

  // 현재 탭 라벨을 안전하게 가져오는 함수
  const getCurrentTabLabel = () => {
    return (tabLabels && tabLabels[tab]) || defaultTabLabels[tab] || '';
  };

  // 현재 탭 라벨에서 '옵션'을 제거한 값을 안전하게 가져오는 함수
  const getCurrentTabType = () => {
    const label = getCurrentTabLabel();
    return label && typeof label === 'string' ? label.replace('옵션', '') : '';
  };

  // Excel Upload 개선 - 옵션 타입 순서에 맞게 수정
  const handleExcelUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // 파일 확장자 검증
    const fileExtension = file.name.split('.').pop()?.toLowerCase();
    if (!['xlsx', 'xls'].includes(fileExtension || '')) {
      setErrorMessage('엑셀 파일(.xlsx, .xls)만 업로드 가능합니다.');
      return;
    }

    const reader = new FileReader();
    reader.onload = evt => {
      try {
        const bstr = evt.target?.result;
        if (!bstr) {
          setErrorMessage('파일을 읽을 수 없습니다.');
          return;
        }

        const wb = XLSX.read(bstr, { type: 'binary' });
        const sheetNames = wb.SheetNames;
        
        if (sheetNames.length === 0) {
          setErrorMessage('엑셀 파일에 시트가 없습니다.');
          return;
        }

        console.log('엑셀 파일의 시트들:', sheetNames);

        // 각 시트별로 데이터 처리
        const allValidatedData: { [key: string]: OptionItem[] } = {};
        let totalUploadedCount = 0;
        let newTabTypes: string[] = [];

        sheetNames.forEach((sheetName, sheetIndex) => {
          try {
            const ws = wb.Sheets[sheetName];
            const data: any[] = XLSX.utils.sheet_to_json(ws, { header: 1 });

            if (data.length <= 1) {
              console.log(`시트 "${sheetName}"에 데이터가 없습니다.`);
              return;
            }

            // 헤더 제거하고 데이터만 추출
            const dataRows = data.slice(1);

            // 데이터 검증 및 변환
            const validatedData: OptionItem[] = (
              dataRows.map((row: any, index) => {
                // 행이 배열 형태인지 확인
                if (!Array.isArray(row)) {
                  throw new Error(
                    `시트 "${sheetName}" 행 ${index + 2}: 데이터 형식이 올바르지 않습니다.`
                  );
                }

                // 빈 행은 건너뛰기
                const isEmptyRow = row.every(
                  (cell: any) =>
                    cell === null ||
                    cell === undefined ||
                    cell === '' ||
                    (typeof cell === 'string' && cell.trim() === '')
                );

                if (isEmptyRow) {
                  return null;
                }

                // 필수 필드 검증
                const vendor = String(row[0] || '').trim();
                const optionName = String(row[1] || '').trim();

                if (!vendor || !optionName) {
                  throw new Error(
                    `시트 "${sheetName}" 행 ${index + 2}: 공급업체와 옵션명은 필수 항목입니다.`
                  );
                }

                // 시트명을 옵션 타입으로 사용 (기존 탭과 매칭)
                let optionType = sheetName;
                
                // 기존 탭 라벨과 매칭 시도
                const existingTabLabels = loadOptionTypes();
                const matchingTab = existingTabLabels.find(tab => 
                  tab === sheetName || 
                  tab.replace('옵션', '') === sheetName ||
                  tab === sheetName.replace('옵션', '') + '옵션'
                );
                
                if (matchingTab) {
                  optionType = matchingTab.replace('옵션', '');
                } else {
                  // 새로운 탭 타입인 경우
                  if (!newTabTypes.includes(sheetName)) {
                    newTabTypes.push(sheetName);
                  }
                  optionType = sheetName;
                }

                return {
                  id: Date.now() + sheetIndex * 1000 + index, // 고유 ID 생성
                  vendor: vendor,
                  optionName: optionName,
                  productCode: String(row[2] || '').trim(),
                  salePrice: Number(row[3]) || 0,
                  purchaseCost: Number(row[4]) || 0,
                  details: String(row[5] || '').trim(),
                  optionType: optionType,
                  note: String(row[6] || '').trim(),
                  createdAt: new Date().toISOString(),
                  updatedAt: new Date().toISOString(),
                };
              }) as any[]
            ).filter((item: any): item is OptionItem => item !== null);

            if (validatedData.length > 0) {
              allValidatedData[sheetName] = validatedData;
              totalUploadedCount += validatedData.length;
              console.log(`시트 "${sheetName}"에서 ${validatedData.length}개 옵션 로드됨`);
            }
          } catch (error) {
            console.error(`시트 "${sheetName}" 처리 중 오류:`, error);
            throw new Error(`시트 "${sheetName}" 처리 중 오류: ${error instanceof Error ? error.message : '알 수 없는 오류'}`);
          }
        });

        if (totalUploadedCount === 0) {
          setErrorMessage('업로드할 수 있는 유효한 데이터가 없습니다.');
          return;
        }

        // 새로운 탭 타입이 있으면 추가
        if (newTabTypes.length > 0) {
          const currentTabTypes = loadOptionTypes();
          const updatedTabTypes = [...currentTabTypes];
          
          newTabTypes.forEach(newType => {
            const tabLabel = newType.endsWith('옵션') ? newType : newType + '옵션';
            if (!updatedTabTypes.includes(tabLabel)) {
              updatedTabTypes.push(tabLabel);
            }
          });
          
          saveOptionTypes(updatedTabTypes);
          setTabLabels(updatedTabTypes);
          console.log('새로운 탭 타입 추가됨:', newTabTypes);
        }

        // 기존 옵션 데이터와 새로운 데이터 병합
        setOptions(prevOptions => {
          const updatedOptions = [...prevOptions];
          const currentTabTypes = loadOptionTypes();
          
          // 각 시트의 데이터를 해당하는 탭에 추가
          Object.entries(allValidatedData).forEach(([sheetName, data]) => {
            // 시트명을 탭 인덱스로 변환
            const tabIndex = currentTabTypes.findIndex(tab => 
              tab === sheetName || 
              tab.replace('옵션', '') === sheetName ||
              tab === sheetName.replace('옵션', '') + '옵션'
            );
            
            if (tabIndex !== -1) {
              // 기존 탭에 데이터 추가
              if (updatedOptions[tabIndex]) {
                updatedOptions[tabIndex] = [...updatedOptions[tabIndex], ...data];
              } else {
                updatedOptions[tabIndex] = [...data];
              }
            } else {
              // 새로운 탭인 경우 배열 끝에 추가
              updatedOptions.push(data);
            }
          });
          
          console.log('최종 병합된 옵션:', updatedOptions);
          return updatedOptions;
        });

        setErrorMessage('');
        
        // 성공 메시지
        const successMessage = `엑셀 업로드가 완료되었습니다.\n` +
          `총 ${totalUploadedCount}개의 옵션이 업로드되었습니다.\n` +
          `처리된 시트: ${Object.keys(allValidatedData).join(', ')}` +
          (newTabTypes.length > 0 ? `\n새로 추가된 탭: ${newTabTypes.join(', ')}` : '');
        
        alert(successMessage);
        
      } catch (error) {
        console.error('엑셀 업로드 오류:', error);
        setErrorMessage(
          `엑셀 업로드 중 오류가 발생했습니다: ${error instanceof Error ? error.message : '알 수 없는 오류'}`
        );
      }
    };

    reader.onerror = () => {
      setErrorMessage('파일을 읽는 중 오류가 발생했습니다.');
    };

    reader.readAsBinaryString(file);

    // 파일 입력 초기화
    if (e.target) {
      e.target.value = '';
    }
  };

  // Excel Download (All Tabs)
  const handleExcelDownload = () => {
    try {
      const wb = XLSX.utils.book_new();
      const optionTypes = loadOptionTypes();
      
      optionTypes.forEach((tabLabel, index) => {
        const currentOptions = options[index] || [];
        if (currentOptions.length > 0) {
          const data = currentOptions.map(o => [
            o.vendor,
            o.optionName,
            o.productCode,
            o.salePrice,
            o.purchaseCost,
            o.details,
            o.note,
          ]);
          const ws = XLSX.utils.aoa_to_sheet([
            optionHeaders.map(h => h.label),
            ...data,
          ]);
          XLSX.utils.book_append_sheet(wb, ws, tabLabel);
        }
      });
      
      XLSX.writeFile(wb, `옵션관리_전체_${new Date().toISOString().split('T')[0]}.xlsx`);
    } catch (error) {
      console.error('엑셀 다운로드 오류:', error);
      setErrorMessage('엑셀 다운로드 중 오류가 발생했습니다.');
    }
  };

  // Excel Template Download (All Tabs)
  const handleTemplateDownload = () => {
    try {
      const wb = XLSX.utils.book_new();
      const optionTypes = loadOptionTypes();
      
      optionTypes.forEach((tabLabel) => {
        const ws = XLSX.utils.aoa_to_sheet([optionHeaders.map(h => h.label)]);
        XLSX.utils.book_append_sheet(wb, ws, tabLabel);
      });
      
      XLSX.writeFile(wb, `옵션관리_템플릿_${new Date().toISOString().split('T')[0]}.xlsx`);
    } catch (error) {
      console.error('템플릿 다운로드 오류:', error);
      setErrorMessage('템플릿 다운로드 중 오류가 발생했습니다.');
    }
  };

  // Reset
  const handleReset = () => {
    if (
      window.confirm(
        '모든 데이터를 초기화하시겠습니까? 이 작업은 되돌릴 수 없습니다.'
      )
    ) {
      localStorage.removeItem(OPTION_STORAGE_KEY);
      localStorage.removeItem(OPTION_TYPES_STORAGE_KEY);
      setOptions([[], [], [], [], [], []]);
      setTabLabels([...defaultTabLabels]);
      setSelectedOption(initialOption);
      setEditMode(false);
      setEditIndex(null);
      setSearch('');
      setSortBy(null);
      setSortOrder('asc');
      setTab(0);
      setErrorMessage('');
    }
  };

  // 정렬 핸들러
  const handleSort = (key: keyof OptionItem) => {
    if (sortBy === key) {
      setSortOrder(prev => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortBy(key);
      setSortOrder('asc');
    }
  };

  // 드래그 앤 드롭
  const onDragEnd = (result: DropResult) => {
    if (!result.destination) return;
    setOptions(prev =>
      prev.map((arr, i) => {
        if (i !== tab) return arr;
        const reordered = Array.from(arr);
        const [removed] = reordered.splice(result.source.index, 1);
        reordered.splice(result.destination!.index, 0, removed);
        return reordered;
      })
    );
  };

  // 새로운 옵션 타입 추가
  const handleAddOptionType = () => {
    if (!newOptionType.trim()) {
      setErrorMessage('옵션 타입 이름을 입력해주세요.');
      return;
    }

    const newType = `${newOptionType.trim()}옵션`;
    if (tabLabels.includes(newType)) {
      setErrorMessage('이미 존재하는 옵션 타입입니다.');
      return;
    }

    setTabLabels(prev => [...prev, newType]);
    setOptions(prev => [...prev, []]);
    setNewOptionType('');
    setAddTypeDialogOpen(false);
    setErrorMessage('');
  };

  // 옵션 타입 삭제
  const handleDeleteOptionType = (index: number) => {
    if (tabLabels.length <= 3) {
      setErrorMessage('기본 옵션 타입은 삭제할 수 없습니다.');
      return;
    }

    if (window.confirm(`"${tabLabels[index]}" 옵션 타입을 삭제하시겠습니까?`)) {
      const newTabLabels = tabLabels.filter((_, i) => i !== index);
      const newOptions = options.filter((_, i) => i !== index);
      setTabLabels(newTabLabels);
      setOptions(newOptions);

      // 현재 탭이 삭제된 탭이었다면 첫 번째 탭으로 이동
      if (tab >= index) {
        setTab(Math.max(0, tab - 1));
      }
      setErrorMessage('');
    }
  };

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        옵션 관리
      </Typography>

      {/* 에러 메시지 */}
      {errorMessage && (
        <Alert
          severity="error"
          sx={{ mb: 2 }}
          onClose={() => setErrorMessage('')}
        >
          {errorMessage}
        </Alert>
      )}

      {/* 탭 메뉴 */}
      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 2 }}>
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <Tabs value={tab} onChange={(_, v) => setTab(v)}>
            {tabLabels.map((label, i) => (
              <Tab key={i} label={label} />
            ))}
          </Tabs>
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Button
              size="small"
              startIcon={<AddCircleIcon />}
              onClick={() => setAddTypeDialogOpen(true)}
            >
              옵션 타입 추가
            </Button>
            {tabLabels.length > 3 && (
              <Button
                size="small"
                startIcon={<RemoveCircleIcon />}
                onClick={() => handleDeleteOptionType(tab)}
                color="error"
              >
                현재 타입 삭제
              </Button>
            )}
          </Box>
        </Box>
      </Box>

      {/* 액션 버튼들 */}
      <Grid container spacing={2} sx={{ mb: 2 }}>
        <Grid item xs={12} sm="auto">
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={handleAddNewClick}
          >
            새 옵션 추가
          </Button>
        </Grid>
        <Grid item xs={12} sm>
          <TextField
            fullWidth
            label="검색"
            value={search}
            onChange={e => setSearch(e.target.value)}
            InputProps={{
              endAdornment: search && (
                <IconButton size="small" onClick={() => setSearch('')}>
                  <ClearIcon />
                </IconButton>
              ),
            }}
          />
        </Grid>
        <Grid item xs={12} sm="auto">
          <FormControl sx={{ minWidth: 120 }}>
            <InputLabel>정렬 기준</InputLabel>
            <Select
              value={sortBy || ''}
              onChange={e => setSortBy(e.target.value as keyof OptionItem)}
            >
              <MenuItem value="">없음</MenuItem>
              <MenuItem value="vendor">공급업체</MenuItem>
              <MenuItem value="optionName">옵션명</MenuItem>
              <MenuItem value="productCode">제품코드</MenuItem>
              <MenuItem value="salePrice">판매가</MenuItem>
              <MenuItem value="purchaseCost">원가</MenuItem>
              <MenuItem value="updatedAt">수정일</MenuItem>
            </Select>
          </FormControl>
        </Grid>
        <Grid
          item
          xs={12}
          sm="auto"
          sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}
        >
          <Button
            variant="contained"
            color="success"
            startIcon={<FileUploadIcon />}
            onClick={() => fileInputRef.current?.click()}
          >
            통합 엑셀 업로드
          </Button>
          <Button
            variant="contained"
            color="info"
            startIcon={<FileDownloadIcon />}
            onClick={handleExcelDownload}
          >
            전체 엑셀 다운로드
          </Button>
          <Button
            variant="outlined"
            color="secondary"
            startIcon={<FileDownloadIcon />}
            onClick={handleTemplateDownload}
          >
            전체 양식 다운로드
          </Button>
          <Button
            variant="outlined"
            color="warning"
            startIcon={<RefreshIcon />}
            onClick={handleReset}
          >
            초기화
          </Button>
        </Grid>
      </Grid>

      {/* 숨겨진 파일 입력 */}
      <input
        type="file"
        ref={fileInputRef}
        style={{ display: 'none' }}
        accept=".xlsx,.xls"
        onChange={handleExcelUpload}
      />

      {/* 옵션 목록 */}
      <TableContainer component={Paper}>
        <Table size="small">
          <TableHead>
            <TableRow sx={{ height: 32 }}>
              <TableCell sx={{ p: 0.5 }}>공급업체</TableCell>
              <TableCell sx={{ p: 0.5 }}>옵션명</TableCell>
              <TableCell sx={{ p: 0.5 }}>제품코드</TableCell>
              <TableCell sx={{ p: 0.5 }}>판매가</TableCell>
              <TableCell sx={{ p: 0.5 }}>원가</TableCell>
              <TableCell sx={{ p: 0.5 }}>상세정보</TableCell>
              <TableCell sx={{ p: 0.5 }}>적용타입</TableCell>
              <TableCell sx={{ p: 0.5 }}>타입</TableCell>
              <TableCell sx={{ p: 0.5 }}>작업</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {sortedOptions.map((option, index) => (
              <TableRow key={option.id} sx={{ height: 32 }}>
                <TableCell sx={{ p: 0.5 }}>{option.vendor}</TableCell>
                <TableCell sx={{ p: 0.5 }}>{option.optionName}</TableCell>
                <TableCell sx={{ p: 0.5 }}>{option.productCode}</TableCell>
                <TableCell sx={{ p: 0.5 }}>
                  {option.salePrice.toLocaleString()}
                </TableCell>
                <TableCell sx={{ p: 0.5 }}>
                  {option.purchaseCost.toLocaleString()}
                </TableCell>
                <TableCell sx={{ p: 0.5 }}>{option.details}</TableCell>
                <TableCell sx={{ p: 0.5 }}>{option.note}</TableCell>
                <TableCell sx={{ p: 0.5 }}>{option.optionType}</TableCell>
                <TableCell sx={{ p: 0.5 }}>
                  <IconButton size="small" onClick={() => handleEdit(index)}>
                    <EditIcon />
                  </IconButton>
                  <IconButton size="small" onClick={() => handleCopy(index)}>
                    <AddIcon />
                  </IconButton>
                  <IconButton
                    size="small"
                    onClick={() => handleDelete(index)}
                    color="error"
                  >
                    <DeleteIcon />
                  </IconButton>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      {/* 옵션 타입 추가 다이얼로그 */}
      <Dialog
        open={addTypeDialogOpen}
        onClose={() => setAddTypeDialogOpen(false)}
        fullScreen={isMobile}
        PaperProps={{
          sx: {
            ...(isMobile && {
              margin: 0,
              borderRadius: 0,
              height: '100vh',
              maxHeight: '100vh',
            }),
          },
        }}
      >
        <DialogTitle
          sx={{
            ...(isMobile && {
              backgroundColor: theme.palette.background.paper,
              borderBottom: `1px solid ${theme.palette.divider}`,
              padding: 2,
            }),
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            {isMobile && (
              <IconButton
                onClick={() => setAddTypeDialogOpen(false)}
                sx={{ mr: 1 }}
              >
                <ArrowBackIcon />
              </IconButton>
            )}
            <Typography variant={isMobile ? 'h6' : 'h5'}>
              새 옵션 타입 추가
            </Typography>
          </Box>
        </DialogTitle>
        <DialogContent
          sx={{
            ...(isMobile && {
              padding: 2,
              flex: 1,
              overflow: 'auto',
            }),
          }}
        >
          <TextField
            autoFocus
            margin="dense"
            label="옵션 타입 이름"
            fullWidth
            value={newOptionType}
            onChange={e => setNewOptionType(e.target.value)}
            onKeyPress={e => {
              if (e.key === 'Enter') {
                handleAddOptionType();
              }
            }}
            size={isMobile ? 'medium' : 'small'}
            sx={{
              ...(isMobile && {
                fontSize: '1rem',
                '& .MuiInputBase-input': {
                  fontSize: '1rem',
                  padding: '16px 14px',
                },
              }),
            }}
          />
        </DialogContent>
        <DialogActions
          sx={{
            ...(isMobile && {
              padding: 2,
              backgroundColor: theme.palette.background.paper,
              borderTop: `1px solid ${theme.palette.divider}`,
            }),
          }}
        >
          <Button
            onClick={() => {
              setAddTypeDialogOpen(false);
              setNewOptionType('');
              setErrorMessage('');
            }}
            size={isMobile ? 'large' : 'medium'}
            sx={{
              ...(isMobile && {
                fontSize: '1rem',
                padding: '12px 24px',
                minWidth: '80px',
              }),
            }}
          >
            취소
          </Button>
          <Button 
            onClick={handleAddOptionType} 
            variant="contained"
            size={isMobile ? 'large' : 'medium'}
            sx={{
              ...(isMobile && {
                fontSize: '1rem',
                padding: '12px 24px',
                minWidth: '80px',
              }),
            }}
          >
            추가
          </Button>
        </DialogActions>
      </Dialog>

      {/* 옵션 추가/수정 모달 */}
      <Dialog
        open={isModalOpen}
        onClose={handleCloseModal}
        maxWidth="md"
        fullWidth
        fullScreen={isMobile}
        PaperProps={{
          sx: {
            ...(isMobile && {
              margin: 0,
              borderRadius: 0,
              height: '100vh',
              maxHeight: '100vh',
            }),
          },
        }}
      >
        <DialogTitle
          sx={{
            ...(isMobile && {
              backgroundColor: theme.palette.background.paper,
              borderBottom: `1px solid ${theme.palette.divider}`,
              padding: 2,
            }),
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            {isMobile && (
              <IconButton
                onClick={handleCloseModal}
                sx={{ mr: 1 }}
              >
                <ArrowBackIcon />
              </IconButton>
            )}
            <Typography variant={isMobile ? 'h6' : 'h5'}>
              {editMode ? '옵션 수정' : '새 옵션 추가'}
            </Typography>
          </Box>
        </DialogTitle>
        <DialogContent
          sx={{
            ...(isMobile && {
              padding: 2,
              flex: 1,
              overflow: 'auto',
            }),
          }}
        >
          {/* 적용타입 계산 방식 설명 */}
          <Paper
            sx={{
              p: isMobile ? 1.5 : 2,
              mb: isMobile ? 1.5 : 2,
              backgroundColor: '#f5f5f5',
              border: '1px solid #e0e0e0',
            }}
          >
            <Typography
              variant="subtitle2"
              sx={{ 
                fontWeight: 'bold', 
                mb: 1, 
                color: '#1976d2',
                ...(isMobile && {
                  fontSize: '0.875rem',
                }),
              }}
            >
              💰 적용타입별 금액 계산 방식
            </Typography>
            <Grid container spacing={isMobile ? 0.5 : 1}>
              <Grid item xs={12} sm={6}>
                <Typography 
                  variant="body2" 
                  sx={{ 
                    mb: 0.5,
                    ...(isMobile && {
                      fontSize: '0.75rem',
                    }),
                  }}
                >
                  <strong>📏 폭당:</strong> 단가 × 폭수 × 수량
                </Typography>
                <Typography
                  variant="caption"
                  sx={{ 
                    color: '#666', 
                    display: 'block', 
                    mb: 1,
                    ...(isMobile && {
                      fontSize: '0.7rem',
                    }),
                  }}
                >
                  예시: 방염처리 5,000원/폭, 제품 3폭 → 5,000 × 3 = 15,000원
                </Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography 
                  variant="body2" 
                  sx={{ 
                    mb: 0.5,
                    ...(isMobile && {
                      fontSize: '0.75rem',
                    }),
                  }}
                >
                  <strong>📐 m당:</strong> 단가 × 가로(mm) / 1000 × 수량
                </Typography>
                <Typography
                  variant="caption"
                  sx={{ 
                    color: '#666', 
                    display: 'block', 
                    mb: 1,
                    ...(isMobile && {
                      fontSize: '0.7rem',
                    }),
                  }}
                >
                  예시: 라인 2,000원/m, 가로 2,500mm → 2,000 × 2.5 = 5,000원
                </Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography 
                  variant="body2" 
                  sx={{ 
                    mb: 0.5,
                    ...(isMobile && {
                      fontSize: '0.75rem',
                    }),
                  }}
                >
                  <strong>➕ 추가:</strong> 단가 × 수량
                </Typography>
                <Typography
                  variant="caption"
                  sx={{ 
                    color: '#666', 
                    display: 'block', 
                    mb: 1,
                    ...(isMobile && {
                      fontSize: '0.7rem',
                    }),
                  }}
                >
                  예시: 설치비 10,000원 → 10,000원 (고정)
                </Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography 
                  variant="body2" 
                  sx={{ 
                    mb: 0.5,
                    ...(isMobile && {
                      fontSize: '0.75rem',
                    }),
                  }}
                >
                  <strong>✅ 포함:</strong> 0원
                </Typography>
                <Typography
                  variant="caption"
                  sx={{ 
                    color: '#666', 
                    display: 'block', 
                    mb: 1,
                    ...(isMobile && {
                      fontSize: '0.7rem',
                    }),
                  }}
                >
                  예시: 기본 부속품 등 → 무료
                </Typography>
              </Grid>
              <Grid item xs={12}>
                <Typography 
                  variant="body2" 
                  sx={{ 
                    mb: 0.5,
                    ...(isMobile && {
                      fontSize: '0.75rem',
                    }),
                  }}
                >
                  <strong>📊 m²당:</strong> 단가 × 면적(m²) × 수량
                </Typography>
                <Typography
                  variant="caption"
                  sx={{ 
                    color: '#666', 
                    display: 'block',
                    ...(isMobile && {
                      fontSize: '0.7rem',
                    }),
                  }}
                >
                  예시: 특수처리 3,000원/m², 면적 2.5m² → 3,000 × 2.5 = 7,500원
                </Typography>
              </Grid>
            </Grid>
          </Paper>

          <Paper sx={{ 
            p: isMobile ? 1.5 : 2, 
            mt: isMobile ? 1.5 : 2, 
            boxShadow: 'none', 
            border: 'none' 
          }}>
            <Grid container spacing={isMobile ? 1.5 : 2}>
              <Grid item xs={12} md={4}>
                <TextField
                  fullWidth
                  required
                  label="공급업체"
                  name="vendor"
                  value={selectedOption.vendor}
                  onChange={handleInputChange}
                  error={!validation.vendor}
                  helperText={!validation.vendor && '공급업체를 입력해주세요'}
                  size={isMobile ? 'medium' : 'small'}
                  sx={{
                    ...(isMobile && {
                      '& .MuiInputBase-input': {
                        fontSize: '1rem',
                        padding: '16px 14px',
                      },
                    }),
                  }}
                />
              </Grid>
              <Grid item xs={12} md={4}>
                <TextField
                  fullWidth
                  required
                  label="옵션명"
                  name="optionName"
                  value={selectedOption.optionName}
                  onChange={handleInputChange}
                  error={!validation.optionName}
                  helperText={!validation.optionName && '옵션명을 입력해주세요'}
                  size={isMobile ? 'medium' : 'small'}
                  sx={{
                    ...(isMobile && {
                      '& .MuiInputBase-input': {
                        fontSize: '1rem',
                        padding: '16px 14px',
                      },
                    }),
                  }}
                />
              </Grid>
              <Grid item xs={12} md={4}>
                <TextField
                  fullWidth
                  label="제품코드"
                  name="productCode"
                  value={selectedOption.productCode}
                  onChange={handleInputChange}
                  placeholder="제품코드를 입력하세요"
                  size={isMobile ? 'medium' : 'small'}
                  sx={{
                    ...(isMobile && {
                      '& .MuiInputBase-input': {
                        fontSize: '1rem',
                        padding: '16px 14px',
                      },
                    }),
                  }}
                />
              </Grid>
              <Grid item xs={12} md={4}>
                <TextField
                  fullWidth
                  required={!selectedOption.note?.includes('%')}
                  type="number"
                  label="판매가"
                  name="salePrice"
                  value={
                    selectedOption.salePrice === 0
                      ? ''
                      : selectedOption.salePrice
                  }
                  onChange={handleInputChange}
                  error={!validation.salePrice}
                  helperText={
                    !validation.salePrice && !selectedOption.note?.includes('%')
                      ? '판매가를 입력해주세요'
                      : selectedOption.note?.includes('%')
                      ? '% 적용타입에서는 판매가가 필요 없습니다'
                      : ''
                  }
                  size={isMobile ? 'medium' : 'small'}
                  sx={{
                    ...(isMobile && {
                      '& .MuiInputBase-input': {
                        fontSize: '1rem',
                        padding: '16px 14px',
                      },
                    }),
                  }}
                />
              </Grid>
              <Grid item xs={12} md={4}>
                <TextField
                  fullWidth
                  type="number"
                  label="원가"
                  name="purchaseCost"
                  value={
                    selectedOption.purchaseCost === 0
                      ? ''
                      : selectedOption.purchaseCost
                  }
                  onChange={handleInputChange}
                  size={isMobile ? 'medium' : 'small'}
                  sx={{
                    ...(isMobile && {
                      '& .MuiInputBase-input': {
                        fontSize: '1rem',
                        padding: '16px 14px',
                      },
                    }),
                  }}
                />
              </Grid>
              <Grid item xs={12} md={4}>
                <TextField
                  fullWidth
                  label="상세정보"
                  name="details"
                  value={selectedOption.details}
                  onChange={handleInputChange}
                  size={isMobile ? 'medium' : 'small'}
                  sx={{
                    ...(isMobile && {
                      '& .MuiInputBase-input': {
                        fontSize: '1rem',
                        padding: '16px 14px',
                      },
                    }),
                  }}
                />
              </Grid>
              <Grid item xs={12} md={4}>
                <FormControl fullWidth size={isMobile ? 'medium' : 'small'}>
                  <InputLabel>적용타입</InputLabel>
                  <Select
                    name="note"
                    value={selectedOption.note}
                    onChange={(e) => {
                      const { name, value } = e.target;
                      const newOption = {
                        ...selectedOption,
                        [name]: value,
                      };
                      setSelectedOption(newOption);
                      
                      // 실시간 유효성 검사
                      const currentTabType = getCurrentTabType();
                      const optionWithType = {
                        ...newOption,
                        optionType: currentTabType,
                      };
                      setValidation(prev => ({
                        ...prev,
                        salePrice: validateOption(optionWithType).salePrice,
                      }));
                      
                      // 에러 메시지 초기화
                      if (errorMessage) {
                        setErrorMessage('');
                      }
                    }}
                    label="적용타입"
                    sx={{
                      ...(isMobile && {
                        '& .MuiSelect-select': {
                          fontSize: '1rem',
                          padding: '16px 14px',
                        },
                      }),
                    }}
                  >
                    <MenuItem value="폭당">폭당</MenuItem>
                    <MenuItem value="m당">m당</MenuItem>
                    <MenuItem value="추가">추가</MenuItem>
                    <MenuItem value="포함">포함</MenuItem>
                    <MenuItem value="m2당">m2당</MenuItem>
                    <MenuItem value="5%">5%</MenuItem>
                    <MenuItem value="10%">10%</MenuItem>
                    <MenuItem value="15%">15%</MenuItem>
                    <MenuItem value="20%">20%</MenuItem>
                    <MenuItem value="25%">25%</MenuItem>
                    <MenuItem value="30%">30%</MenuItem>
                    <MenuItem value="직접입력">직접입력</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              {selectedOption.note === '직접입력' && (
                <Grid item xs={12} md={4}>
                  <TextField
                    fullWidth
                    label="퍼센트 입력"
                    name="customPercent"
                    placeholder="예: 12%"
                    onChange={(e) => {
                      const value = e.target.value;
                      if (value.endsWith('%') || value === '') {
                        const newOption = {
                          ...selectedOption,
                          note: value
                        };
                        setSelectedOption(newOption);
                        
                        // 실시간 유효성 검사
                        const currentTabType = getCurrentTabType();
                        const optionWithType = {
                          ...newOption,
                          optionType: currentTabType,
                        };
                        setValidation(prev => ({
                          ...prev,
                          salePrice: validateOption(optionWithType).salePrice,
                        }));
                      }
                    }}
                    size={isMobile ? 'medium' : 'small'}
                    sx={{
                      ...(isMobile && {
                        '& .MuiInputBase-input': {
                          fontSize: '1rem',
                          padding: '16px 14px',
                        },
                      }),
                    }}
                  />
                </Grid>
              )}
            </Grid>
          </Paper>
        </DialogContent>
        <DialogActions
          sx={{
            ...(isMobile && {
              padding: 2,
              backgroundColor: theme.palette.background.paper,
              borderTop: `1px solid ${theme.palette.divider}`,
            }),
          }}
        >
          <Button 
            onClick={handleCloseModal}
            size={isMobile ? 'large' : 'medium'}
            sx={{
              ...(isMobile && {
                fontSize: '1rem',
                padding: '12px 24px',
                minWidth: '80px',
              }),
            }}
          >
            취소
          </Button>
          <Button
            variant="contained"
            onClick={handleAddOption}
            startIcon={editMode ? <EditIcon /> : <AddIcon />}
            size={isMobile ? 'large' : 'medium'}
            sx={{
              ...(isMobile && {
                fontSize: '1rem',
                padding: '12px 24px',
                minWidth: '80px',
              }),
            }}
          >
            {editMode ? '수정' : '추가'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default OptionManagement;
