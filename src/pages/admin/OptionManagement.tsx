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
  FormControlLabel,
  InputLabel,
  Select,
  MenuItem,
  TableSortLabel,
  Chip,
  Alert,
  useMediaQuery,
  useTheme,
  CircularProgress,
  Checkbox,
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

import FileUploadIcon from '@mui/icons-material/FileUpload';
import FileDownloadIcon from '@mui/icons-material/FileDownload';
import RefreshIcon from '@mui/icons-material/Refresh';
import SettingsIcon from '@mui/icons-material/Settings';
import { optionService } from '../../utils/firebaseDataService';

interface OptionItem {
  id?: string;
  vendor: string;
  optionName: string;
  productCode: string;
  salePrice: number;
  purchaseCost: number;
  details: string;
  optionType: string;
  calculationMethod: string;
  note: string;
  createdAt?: any;
  updatedAt?: any;
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

// 발주경로 설정 인터페이스
interface PurchasePathSettings {
  [tabName: string]: {
    purchasePath: 'product' | 'option'; // 'product': 제품거래처, 'option': 옵션거래처
    excludeFromPurchase: boolean; // 발주예외 여부
  };
}

const optionHeaders: ColumnHeader[] = [
  { field: 'vendor', label: '공급업체' },
  { field: 'optionName', label: '옵션명' },
  { field: 'productCode', label: '제품코드' },
  { field: 'salePrice', label: '판매가' },
  { field: 'purchaseCost', label: '원가' },
  { field: 'details', label: '상세정보' },
  { field: 'optionType', label: '적용타입' },
  { field: 'calculationMethod', label: '계산방식' },
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

// 옵션 타입 기본값 (옵션관리 탭과 동일)
const defaultTabLabels = [
  '커튼옵션',
  '블라인드옵션',
  '커튼전동',
  '블라인드전동',
  '헌터옵션',
  '시공옵션',
  '기타옵션',
];

function validateOption(option: OptionItem): OptionValidation {
  return {
    vendor: option.vendor.trim().length > 0,
    optionName: option.optionName.trim().length > 0,
    salePrice: option.salePrice >= 0,
    optionType: option.optionType.trim().length > 0,
  };
}

const OptionManagement: React.FC = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  const [options, setOptions] = useState<OptionItem[]>([]);
  const [selectedOption, setSelectedOption] = useState<OptionItem>({
    vendor: '',
    optionName: '',
    productCode: '',
    salePrice: 0,
    purchaseCost: 0,
    details: '',
    optionType: '',
    calculationMethod: '',
    note: '',
  });
  const [editMode, setEditMode] = useState(false);
  const [editIndex, setEditIndex] = useState<number | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [validation, setValidation] = useState<OptionValidation>(defaultValidation);
  const [tabValue, setTabValue] = useState(0);
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState<keyof OptionItem | null>(null);
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [optionTypes, setOptionTypes] = useState<string[]>(defaultTabLabels);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // 발주경로 설정 관련 상태
  const [purchasePathSettings, setPurchasePathSettings] = useState<PurchasePathSettings>({});
  const [purchasePathModalOpen, setPurchasePathModalOpen] = useState(false);
  const [purchasePathLoading, setPurchasePathLoading] = useState(false);

  // 발주경로 설정 로드
  const loadPurchasePathSettings = async () => {
    try {
      setPurchasePathLoading(true);
      const settings = await optionService.getPurchasePathSettings();
      
      // 기본값 설정 함수
      const getDefaultSettings = (): PurchasePathSettings => {
        const defaultSettings: PurchasePathSettings = {};
        optionTypes.forEach(type => {
          defaultSettings[type] = {
            purchasePath: 'product',
            excludeFromPurchase: false
          };
        });
        return defaultSettings;
      };
      
      setPurchasePathSettings(settings || getDefaultSettings());
    } catch (error) {
      console.error('발주경로 설정 로드 실패:', error);
      // 기본값 설정
      const defaultSettings: PurchasePathSettings = {};
      optionTypes.forEach(type => {
        defaultSettings[type] = {
          purchasePath: 'product',
          excludeFromPurchase: false
        };
      });
      setPurchasePathSettings(defaultSettings);
    } finally {
      setPurchasePathLoading(false);
    }
  };

  // 발주경로 설정 저장
  const savePurchasePathSettings = async (settings: PurchasePathSettings) => {
    try {
      setPurchasePathLoading(true);
      await optionService.savePurchasePathSettings(settings);
      setPurchasePathSettings(settings);
      setPurchasePathModalOpen(false);
    } catch (error) {
      console.error('발주경로 설정 저장 실패:', error);
      alert('설정 저장에 실패했습니다.');
    } finally {
      setPurchasePathLoading(false);
    }
  };

  // Firebase에서 데이터 로드
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        setError(null);
        console.log('Firebase에서 옵션 데이터 로드 시작');
        
        // 옵션 데이터 로드
        const optionsData = await optionService.getOptions();
        console.log('Firebase에서 가져온 원본 데이터:', optionsData);
        
        // 데이터 구조 검증 및 변환
        const validatedOptions = optionsData.map((option: any) => {
          console.log('개별 옵션 데이터:', option);
          return {
            id: option.id,
            vendor: option.vendor || '',
            optionName: option.optionName || '',
            productCode: option.productCode || '',
            salePrice: Number(option.salePrice) || 0,
            purchaseCost: Number(option.purchaseCost) || 0,
            details: option.details || '',
            optionType: option.optionType || '',
            calculationMethod: option.calculationMethod || '고정가',
            note: option.note || '',
            createdAt: option.createdAt,
            updatedAt: option.updatedAt
          };
        });
        
        console.log('검증된 옵션 데이터:', validatedOptions);
        setOptions(validatedOptions);
        
        console.log('Firebase 옵션 데이터 로드 완료:', {
          options: validatedOptions.length,
          optionsData: validatedOptions
        });
      } catch (error) {
        console.error('Firebase 데이터 로드 실패:', error);
        setError('데이터 로드에 실패했습니다. 인터넷 연결을 확인해주세요.');
      } finally {
        setLoading(false);
      }
    };

    loadData();
    loadPurchasePathSettings(); // 발주경로 설정도 함께 로드
  }, []);

  // 현재 탭의 옵션 타입
  const getCurrentTabType = () => {
    const tabLabel = optionTypes[tabValue];
    console.log('현재 탭 라벨:', tabLabel, '탭 인덱스:', tabValue);
    
    // 시트명과 탭 제목이 동일하므로 매핑 불필요
    console.log('옵션 타입:', tabLabel);
    return tabLabel;
  };

  // 현재 탭의 옵션들 필터링
  const currentTabOptions = useMemo(() => {
    const currentType = getCurrentTabType();
    console.log('현재 탭 타입:', currentType);
    console.log('전체 옵션들:', options);
    
    // 현재 탭 타입에 맞는 옵션들만 필터링
    const filteredOptions = options.filter(option => {
      const optionType = option.optionType || '';
      const matches = optionType === currentType;
      console.log(`옵션 "${option.optionName}" 타입: "${optionType}" vs 현재 타입: "${currentType}" -> ${matches}`);
      return matches;
    });
    
    console.log(`타입 "${currentType}"에 해당하는 옵션 ${filteredOptions.length}개`);
    return filteredOptions;
  }, [options, tabValue, optionTypes]);

  // 검색 필터링
  const filteredOptions = useMemo(() => {
    return currentTabOptions.filter(option =>
      search === '' ||
      option.optionName.toLowerCase().includes(search.toLowerCase()) ||
      option.vendor.toLowerCase().includes(search.toLowerCase()) ||
      option.productCode.toLowerCase().includes(search.toLowerCase()) ||
      option.details.toLowerCase().includes(search.toLowerCase())
    );
  }, [currentTabOptions, search]);

  // 정렬
  const sortedOptions = useMemo(() => {
    if (!sortBy) return filteredOptions;
    
    return [...filteredOptions].sort((a, b) => {
      const aVal = a[sortBy];
      const bVal = b[sortBy];
      
      if (typeof aVal === 'string' && typeof bVal === 'string') {
        return sortOrder === 'asc' ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal);
      }
      if (typeof aVal === 'number' && typeof bVal === 'number') {
        return sortOrder === 'asc' ? aVal - bVal : bVal - aVal;
      }
      return 0;
    });
  }, [filteredOptions, sortBy, sortOrder]);

  const handleOpenModal = () => setIsModalOpen(true);

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedOption({
      vendor: '',
      optionName: '',
      productCode: '',
      salePrice: 0,
      purchaseCost: 0,
      details: '',
      optionType: '',
      calculationMethod: '',
      note: '',
    });
    setEditMode(false);
    setEditIndex(null);
    setValidation(defaultValidation);
  };

  const handleAddNewClick = () => {
    setSelectedOption({
      vendor: '',
      optionName: '',
      productCode: '',
      salePrice: 0,
      purchaseCost: 0,
      details: '',
      optionType: getCurrentTabType(),
      calculationMethod: '',
      note: '',
    });
    setEditMode(false);
    setEditIndex(null);
    setValidation(defaultValidation);
    handleOpenModal();
  };

  const handleAddOption = async () => {
    const newValidation = validateOption(selectedOption);
    setValidation(newValidation);

    if (!Object.values(newValidation).every(Boolean)) {
      alert('필수 항목을 모두 입력해주세요.');
      return;
    }

    try {
      console.log('Firebase에 옵션 데이터 저장 시작');
      
      if (editMode && selectedOption.id) {
        // 기존 옵션 업데이트
        await optionService.updateOption(selectedOption.id, selectedOption);
        setOptions(prev => prev.map(o => o.id === selectedOption.id ? selectedOption : o));
      } else {
        // 새 옵션 저장
        const newOptionId = await optionService.saveOption(selectedOption);
        const newOption = { ...selectedOption, id: newOptionId };
        setOptions(prev => [...prev, newOption]);
      }
      
      console.log('Firebase에 옵션 데이터 저장 완료');
      handleCloseModal();
    } catch (error) {
      console.error('Firebase 저장 실패:', error);
      alert('옵션 저장에 실패했습니다. 인터넷 연결을 확인해주세요.');
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type } = e.target;
    const newValue = type === 'number' ? Number(value) : value;
    
    setSelectedOption(prev => ({
      ...prev,
      [name]: newValue,
    }));

    // 실시간 유효성 검사
    const updatedOption = { ...selectedOption, [name]: newValue };
    const newValidation = validateOption(updatedOption);
    setValidation(newValidation);
  };

  const handleSelectChange = (e: any) => {
    const { name, value } = e.target;
    setSelectedOption(prev => ({
      ...prev,
      [name]: value,
    }));

    // 실시간 유효성 검사
    const updatedOption = { ...selectedOption, [name]: value };
    const newValidation = validateOption(updatedOption);
    setValidation(newValidation);
  };

  const handleEdit = (idx: number) => {
    setSelectedOption(sortedOptions[idx]);
    setEditMode(true);
    setEditIndex(idx);
    setValidation(defaultValidation);
    handleOpenModal();
  };

  const handleCopy = async (idx: number) => {
    try {
      const optionToCopy = sortedOptions[idx];
      const newOption = { 
        ...optionToCopy,
        optionType: getCurrentTabType(), // 현재 탭의 타입으로 설정
        calculationMethod: optionToCopy.calculationMethod || '고정가'
      };
      delete newOption.id; // 새 ID 생성 위해 제거
      
      const newOptionId = await optionService.saveOption(newOption);
      const savedOption = { ...newOption, id: newOptionId };
      setOptions(prev => [...prev, savedOption]);
      
      console.log(`옵션 복사 완료: ${optionToCopy.optionName} -> 타입: ${getCurrentTabType()}`);
    } catch (error) {
      console.error('옵션 복사 실패:', error);
      alert('옵션 복사에 실패했습니다.');
    }
  };

  const handleDelete = async (idx: number) => {
    const optionToDelete = sortedOptions[idx];
    if (!optionToDelete.id) return;
    
    if (window.confirm('정말로 이 옵션을 삭제하시겠습니까?')) {
      try {
        await optionService.deleteOption(optionToDelete.id);
        setOptions(prev => prev.filter(o => o.id !== optionToDelete.id));
      } catch (error) {
        console.error('옵션 삭제 실패:', error);
        alert('옵션 삭제에 실패했습니다.');
      }
    }
  };

  const handleExcelUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    console.log('파일 선택됨:', file.name, '크기:', file.size);
    
    const reader = new FileReader();
    reader.onload = async (evt) => {
      const data = evt.target?.result;
      if (!data) {
        console.error('파일 읽기 실패');
        alert('파일을 읽을 수 없습니다.');
        return;
      }
      
      try {
        console.log('엑셀 파일 파싱 시작');
        const workbook = XLSX.read(data, { type: 'binary' });
        const sheetNames = workbook.SheetNames;
        
        console.log('발견된 시트 목록:', sheetNames);
        
        if (sheetNames.length === 0) {
          alert('엑셀 파일에 시트가 없습니다.');
          return;
        }
        
        let totalUploaded = 0;
        let totalSheetsProcessed = 0;
        const uploadedOptions: OptionItem[] = [];
        const newOptionTypes: string[] = [];
        
        // 모든 시트를 순회하며 옵션 데이터 처리
        for (const sheetName of sheetNames) {
          console.log(`\n=== 시트 "${sheetName}" 처리 시작 ===`);
          
          try {
            const sheet = workbook.Sheets[sheetName];
            if (!sheet) {
              console.log(`시트 "${sheetName}"가 비어있습니다.`);
              continue;
            }
            
            // 시트의 범위 확인
            const range = XLSX.utils.decode_range(sheet['!ref'] || 'A1');
            console.log(`시트 "${sheetName}" 범위:`, range);
            
            // 헤더가 있는지 확인 (최소 2행 필요: 헤더 + 데이터)
            if (range.e.r < 1) {
              console.log(`시트 "${sheetName}"에 데이터가 없습니다.`);
              continue;
            }
            
            // JSON으로 변환 (헤더 포함)
            const json: any[] = XLSX.utils.sheet_to_json(sheet, { 
              header: 1,
              defval: '', // 빈 셀을 빈 문자열로 처리
              raw: false  // 모든 값을 문자열로 처리
            });
            
            console.log(`시트 "${sheetName}" JSON 데이터:`, json);
            
            if (json.length <= 1) {
              console.log(`시트 "${sheetName}"에 데이터 행이 없습니다.`);
              continue;
            }
            
            const [header, ...rows] = json;
            console.log(`시트 "${sheetName}" 헤더:`, header);
            console.log(`시트 "${sheetName}" 데이터 행 수:`, rows.length);
            
            // 각 행을 옵션으로 변환
            const sheetOptions: OptionItem[] = [];
            for (let i = 0; i < rows.length; i++) {
              const row = rows[i];
              console.log(`행 ${i + 1}:`, row);
              
                             // 빈 행 건너뛰기
               if (!row || row.every((cell: any) => !cell || cell.toString().trim() === '')) {
                 console.log(`행 ${i + 1}은 빈 행입니다. 건너뜁니다.`);
                 continue;
               }
              
              const option: OptionItem = {
                vendor: (row[0] || '').toString().trim(),
                optionName: (row[1] || '').toString().trim(),
                productCode: (row[2] || '').toString().trim(),
                salePrice: Number(row[3]) || 0,
                purchaseCost: Number(row[4]) || 0,
                details: (row[5] || '').toString().trim(),
                optionType: sheetName, // 시트명을 옵션 타입으로 강제 설정
                calculationMethod: (row[6] || '고정가').toString().trim(),
                note: (row[7] || '').toString().trim(),
              };
              
              console.log(`변환된 옵션:`, option);
              
              // 유효한 데이터만 저장 (공급업체와 옵션명이 필수)
              if (option.vendor && option.optionName) {
                sheetOptions.push(option);
                console.log(`유효한 옵션으로 추가됨: ${option.vendor} - ${option.optionName}`);
              } else {
                console.log(`유효하지 않은 옵션 건너뜀: 공급업체="${option.vendor}", 옵션명="${option.optionName}"`);
              }
            }
            
            console.log(`시트 "${sheetName}"에서 ${sheetOptions.length}개 유효한 옵션 발견`);
            
            // Firebase에 옵션들 저장
            for (const option of sheetOptions) {
              try {
                await optionService.saveOption(option);
                uploadedOptions.push(option);
                totalUploaded++;
                console.log(`옵션 저장 성공: ${option.vendor} - ${option.optionName}`);
              } catch (saveError) {
                console.error(`옵션 저장 실패: ${option.vendor} - ${option.optionName}`, saveError);
              }
            }
            
            // 새로운 옵션 타입이면 목록에 추가
            if (!optionTypes.includes(sheetName)) {
              newOptionTypes.push(sheetName);
              console.log(`새 옵션 타입 "${sheetName}" 발견`);
            }
            
            totalSheetsProcessed++;
            console.log(`=== 시트 "${sheetName}" 처리 완료 ===\n`);
            
          } catch (sheetError) {
            console.error(`시트 "${sheetName}" 처리 중 오류:`, sheetError);
          }
        }
        
        // 새로운 옵션 타입들을 한 번에 추가
        if (newOptionTypes.length > 0) {
          setOptionTypes(prev => [...prev, ...newOptionTypes]);
          console.log(`새 옵션 타입들 추가됨:`, newOptionTypes);
        }
        
        // 데이터 다시 로드
        console.log('Firebase에서 업데이트된 데이터 로드 중...');
        const updatedOptions = await optionService.getOptions();
        setOptions(updatedOptions as OptionItem[]);
        
        console.log('엑셀 업로드 완료:', {
          totalSheets: sheetNames.length,
          totalSheetsProcessed,
          totalUploaded,
          uploadedOptions: uploadedOptions.length,
          newOptionTypes
        });
        
        const resultMessage = `엑셀 업로드 완료!\n\n` +
          `📊 처리 결과:\n` +
          `• 총 시트 수: ${sheetNames.length}개\n` +
          `• 처리된 시트: ${totalSheetsProcessed}개\n` +
          `• 업로드된 옵션: ${totalUploaded}개\n` +
          `• 새 옵션 타입: ${newOptionTypes.length}개\n\n` +
          `📋 시트별 옵션 타입이 자동으로 설정되었습니다.`;
        
        alert(resultMessage);
        
      } catch (error) {
        console.error('엑셀 업로드 실패:', error);
        alert(`엑셀 업로드에 실패했습니다.\n\n오류: ${error}\n\n파일 형식을 확인해주세요.`);
      }
    };
    
    reader.onerror = () => {
      console.error('파일 읽기 오류');
      alert('파일을 읽는 중 오류가 발생했습니다.');
    };
    
    reader.readAsBinaryString(file);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleExcelDownload = () => {
    const data = currentTabOptions.map(option => [
      option.vendor,
      option.optionName,
      option.productCode,
      option.salePrice,
      option.purchaseCost,
      option.details,
      option.optionType,
      option.note,
    ]);
    
    const ws = XLSX.utils.aoa_to_sheet([
      ['공급업체', '옵션명', '제품코드', '판매가', '원가', '상세정보', '적용타입', '비고'],
      ...data
    ]);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, '옵션목록');
    XLSX.writeFile(wb, `옵션목록_${getCurrentTabType()}_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  const handleTemplateDownload = () => {
    const wb = XLSX.utils.book_new();
    
    // 옵션 관리 탭 제목과 동일한 시트명 사용
    const sheetNames = ['커튼옵션', '블라인드옵션', '커튼전동', '블라인드전동', '헌터옵션', '기타옵션'];
    
    sheetNames.forEach(sheetName => {
      const ws = XLSX.utils.aoa_to_sheet([
        ['공급업체', '옵션명', '제품코드', '판매가', '원가', '상세정보', '적용타입', '비고'],
        ['예시업체', '예시옵션', 'EX001', 50000, 30000, '예시 상세정보', sheetName, '예시 비고']
      ]);
      XLSX.utils.book_append_sheet(wb, ws, sheetName);
    });
    
    XLSX.writeFile(wb, '옵션목록_다중시트_양식.xlsx');
  };

  const handleReset = async () => {
    try {
      // 사용자 확인
      if (!window.confirm('모든 옵션 데이터를 초기화하시겠습니까? 이 작업은 되돌릴 수 없습니다.')) {
        return;
      }

      console.log('옵션 데이터 초기화 시작');
      
      // Firebase에서 모든 옵션 데이터를 한 번에 삭제
      await optionService.deleteAllOptions();
      
      // 로컬 상태 초기화
      setOptions([]);
      setSearch('');
      setSortBy(null);
      setSortOrder('asc');
      setTabValue(0);
      setSelectedOption({
        vendor: '',
        optionName: '',
        productCode: '',
        salePrice: 0,
        purchaseCost: 0,
        details: '',
        optionType: '',
        calculationMethod: '',
        note: '',
      });
      setEditMode(false);
      setEditIndex(null);
      setIsModalOpen(false);
      setValidation(defaultValidation);
      
      console.log('옵션 데이터 초기화 완료');
      alert('모든 옵션 데이터가 초기화되었습니다.');
    } catch (error) {
      console.error('옵션 데이터 초기화 실패:', error);
      alert('옵션 데이터 초기화에 실패했습니다.');
    }
  };

  const handleSort = (key: keyof OptionItem) => {
    if (sortBy === key) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(key);
      setSortOrder('asc');
    }
  };



  const handleAddOptionType = () => {
    const newType = prompt('새 옵션 타입을 입력하세요:');
    if (newType && !optionTypes.includes(newType)) {
      setOptionTypes(prev => [...prev, newType]);
    }
  };

  const handleDeleteOptionType = (index: number) => {
    if (window.confirm('이 옵션 타입을 삭제하시겠습니까?')) {
      setOptionTypes(prev => prev.filter((_, i) => i !== index));
      if (tabValue >= index) {
        setTabValue(Math.max(0, tabValue - 1));
      }
    }
  };

  // 옵션 타입 일괄 수정 함수
  const handleFixOptionTypes = async () => {
    if (!window.confirm('모든 옵션의 타입을 탭 제목에 맞게 수정하시겠습니까?\n\n이 작업은 시간이 걸릴 수 있습니다.')) {
      return;
    }

    try {
      console.log('옵션 타입 일괄 수정 시작');
      
      // 모든 옵션을 가져와서 타입을 수정
      const allOptions = await optionService.getOptions();
      let updatedCount = 0;
      
      for (const option of allOptions as OptionItem[]) {
        if (option.id) {
          // 옵션명이나 상세정보에서 타입을 추측
          let newType = '기타옵션'; // 기본값
          
          const optionName = option.optionName.toLowerCase();
          const details = option.details.toLowerCase();
          
          if (optionName.includes('커튼') || details.includes('커튼')) {
            if (optionName.includes('전동') || details.includes('전동')) {
              newType = '커튼전동';
            } else {
              newType = '커튼옵션';
            }
          } else if (optionName.includes('블라인드') || details.includes('블라인드')) {
            if (optionName.includes('전동') || details.includes('전동')) {
              newType = '블라인드전동';
            } else {
              newType = '블라인드옵션';
            }
          } else if (optionName.includes('헌터') || details.includes('헌터')) {
            newType = '헌터옵션';
          }
          
          // 타입이 다르면 업데이트
          if (option.optionType !== newType) {
            await optionService.updateOption(option.id, { ...option, optionType: newType });
            updatedCount++;
            console.log(`옵션 타입 수정: ${option.optionName} (${option.optionType} → ${newType})`);
          }
        }
      }
      
      // 데이터 다시 로드
      const updatedOptions = await optionService.getOptions();
      setOptions(updatedOptions as OptionItem[]);
      
      console.log(`옵션 타입 일괄 수정 완료: ${updatedCount}개 수정됨`);
      alert(`옵션 타입 일괄 수정 완료!\n\n수정된 옵션: ${updatedCount}개`);
      
    } catch (error) {
      console.error('옵션 타입 일괄 수정 실패:', error);
      alert('옵션 타입 수정에 실패했습니다.');
    }
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
        <Typography variant="h6" sx={{ ml: 2 }}>
          Firebase에서 데이터를 불러오는 중...
        </Typography>
      </Box>
    );
  }

  if (error) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <Alert severity="error" sx={{ maxWidth: 600 }}>
          <Typography variant="h6">데이터 로드 실패</Typography>
          <Typography>{error}</Typography>
          <Button 
            variant="contained" 
            onClick={() => window.location.reload()} 
            sx={{ mt: 2 }}
          >
            다시 시도
          </Button>
        </Alert>
      </Box>
    );
  }

  return (
    <Grid container spacing={2}>
      <Grid item xs={12}>
        <Box
          sx={{
            display: 'flex',
            gap: 1,
            flexWrap: 'wrap',
            alignItems: 'center',
          }}
        >
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={handleAddNewClick}
          >
            옵션 등록
          </Button>
          <Button
            variant="contained"
            color="success"
            startIcon={<FileUploadIcon />}
            component="label"
          >
            옵션 업로드
            <input
              type="file"
              accept=".xlsx"
              hidden
              ref={fileInputRef}
              onChange={handleExcelUpload}
            />
          </Button>
          <Button
            variant="contained"
            color="info"
            startIcon={<FileDownloadIcon />}
            onClick={handleExcelDownload}
          >
            옵션 다운로드
          </Button>
          <Button
            variant="outlined"
            color="secondary"
            startIcon={<FileDownloadIcon />}
            onClick={handleTemplateDownload}
          >
            양식 다운로드
          </Button>
          <Button
            variant="outlined"
            color="warning"
            startIcon={<RefreshIcon />}
            onClick={handleReset}
          >
            초기화
          </Button>
          <Button
            variant="outlined"
            color="info"
            onClick={async () => {
              try {
                const testOptions = [
                  {
                    vendor: '테스트업체1',
                    optionName: '커튼로드',
                    productCode: 'CT001',
                    salePrice: 50000,
                    purchaseCost: 30000,
                    details: '커튼 설치용 로드',
                    optionType: '커튼',
                    calculationMethod: '고정가',
                    note: '테스트 데이터'
                  },
                  {
                    vendor: '테스트업체2',
                    optionName: '블라인드로드',
                    productCode: 'BL001',
                    salePrice: 40000,
                    purchaseCost: 25000,
                    details: '블라인드 설치용 로드',
                    optionType: '블라인드',
                    calculationMethod: '고정가',
                    note: '테스트 데이터'
                  }
                ];
                
                for (const option of testOptions) {
                  await optionService.saveOption(option);
                }
                
                // 데이터 다시 로드
                const updatedOptions = await optionService.getOptions();
                setOptions(updatedOptions as OptionItem[]);
                
                alert('테스트 데이터가 추가되었습니다.');
              } catch (error) {
                console.error('테스트 데이터 추가 실패:', error);
                alert('테스트 데이터 추가에 실패했습니다.');
              }
            }}
          >
            테스트 데이터 추가
          </Button>
          <Button
            variant="outlined"
            color="warning"
            onClick={handleFixOptionTypes}
            sx={{ ml: 1 }}
          >
            옵션 타입 수정
          </Button>
          <TextField
            size="small"
            placeholder="검색 (옵션명, 공급업체, 제품코드)"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            sx={{ minWidth: 220 }}
          />
        </Box>
      </Grid>

      <Grid item xs={12}>
        <Paper sx={{ 
          width: '100%', 
          display: 'flex', 
          alignItems: 'center', 
          mb: 2,
          backgroundColor: 'var(--surface-color)',
          color: 'var(--text-color)'
        }}>
          <Tabs
            value={tabValue}
            onChange={(e, newValue) => setTabValue(newValue)}
            variant="scrollable"
            scrollButtons="auto"
            sx={{ 
              borderBottom: 1, 
              borderColor: 'var(--border-color)', 
              flex: 1,
              '& .MuiTab-root': {
                color: 'var(--text-color)',
              },
              '& .Mui-selected': {
                color: 'var(--primary-color)',
              }
            }}
          >
            {optionTypes.map((type, idx) => (
              <Tab key={type} label={type} />
            ))}
          </Tabs>
          <IconButton onClick={handleAddOptionType} color="primary" sx={{ ml: 1 }}>
            <AddIcon />
          </IconButton>
          <IconButton 
            onClick={() => setPurchasePathModalOpen(true)} 
            color="primary" 
            sx={{ ml: 1 }}
            title="발주경로 설정"
          >
            <SettingsIcon />
          </IconButton>
        </Paper>
      </Grid>

      {loading && (
        <Grid item xs={12}>
          <Paper sx={{ 
            p: 4, 
            textAlign: 'center',
            backgroundColor: 'var(--surface-color)',
            color: 'var(--text-color)'
          }}>
            <CircularProgress sx={{ mb: 2 }} />
            <Typography variant="h6" color="var(--text-secondary-color)" gutterBottom>
              데이터를 불러오는 중...
            </Typography>
          </Paper>
        </Grid>
      )}

      {error && (
        <Grid item xs={12}>
          <Alert severity="error" sx={{ mb: 2 }}>
            <Typography variant="body1">{error}</Typography>
          </Alert>
        </Grid>
      )}

      {!loading && !error && currentTabOptions.length === 0 && (
        <Grid item xs={12}>
          <Paper sx={{ 
            p: 4, 
            textAlign: 'center',
            backgroundColor: 'var(--surface-color)',
            color: 'var(--text-color)'
          }}>
            <Typography variant="h6" color="var(--text-secondary-color)" gutterBottom>
              등록된 옵션이 없습니다
            </Typography>
            <Typography variant="body2" color="var(--text-secondary-color)">
              옵션을 등록하거나 엑셀 파일을 업로드해주세요.
            </Typography>
            <Box sx={{ mt: 2 }}>
              <Typography variant="body2" color="var(--text-secondary-color)">
                현재 탭: {optionTypes[tabValue]} | 전체 옵션 수: {options.length}개
              </Typography>
            </Box>
          </Paper>
        </Grid>
      )}

      <Grid item xs={12}>
        <TableContainer component={Paper} sx={{
          backgroundColor: 'var(--surface-color)',
          '& .MuiPaper-root': {
            backgroundColor: 'var(--surface-color)',
          }
        }}>
          <Table size="small">
            <TableHead>
              <TableRow sx={{ 
                height: 40,
                backgroundColor: 'var(--background-color)'
              }}>
                {optionHeaders.map((header, idx) => (
                  <TableCell
                    key={header.field}
                    onClick={() => handleSort(sortKeys[idx])}
                    sx={{
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      maxWidth: 140,
                      fontWeight: 'bold',
                      fontSize: '1rem',
                      p: 1,
                      cursor: 'pointer',
                      userSelect: 'none',
                      color: 'var(--text-color)',
                      backgroundColor: 'var(--background-color)',
                    }}
                    title={header.label}
                    align="center"
                  >
                    {header.label}
                    {sortBy === sortKeys[idx] && (sortOrder === 'asc' ? ' ▲' : ' ▼')}
                  </TableCell>
                ))}
                <TableCell sx={{ 
                  p: 1, 
                  fontWeight: 'bold', 
                  fontSize: '1rem', 
                  whiteSpace: 'nowrap',
                  color: 'var(--text-color)',
                  backgroundColor: 'var(--background-color)',
                }} align="center">작업</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {sortedOptions.map((option, idx) => (
                <TableRow
                  key={option.id || `option-${idx}`}
                  sx={{
                    background: editIndex === idx ? 'var(--primary-color)20' : 'var(--surface-color)',
                    height: 40,
                    fontSize: '0.95rem',
                    color: 'var(--text-color)',
                    '&:hover': {
                      background: 'var(--hover-color)',
                    },
                  }}
                >
                  <TableCell sx={{ 
                    p: 1, 
                    whiteSpace: 'nowrap', 
                    maxWidth: 140, 
                    overflow: 'hidden', 
                    textOverflow: 'ellipsis',
                    color: 'var(--text-color)'
                  }} align="center">
                    {option.vendor}
                  </TableCell>
                  <TableCell sx={{ 
                    p: 1, 
                    whiteSpace: 'nowrap', 
                    maxWidth: 140, 
                    overflow: 'hidden', 
                    textOverflow: 'ellipsis',
                    color: 'var(--text-color)'
                  }} align="center">
                    {option.optionName}
                  </TableCell>
                  <TableCell sx={{ 
                    p: 1, 
                    whiteSpace: 'nowrap', 
                    maxWidth: 140, 
                    overflow: 'hidden', 
                    textOverflow: 'ellipsis',
                    color: 'var(--text-color)'
                  }} align="center">
                    {option.productCode}
                  </TableCell>
                  <TableCell sx={{ 
                    p: 1, 
                    whiteSpace: 'nowrap', 
                    maxWidth: 140, 
                    overflow: 'hidden', 
                    textOverflow: 'ellipsis',
                    color: 'var(--text-color)'
                  }} align="center">
                    {option.salePrice.toLocaleString()}
                  </TableCell>
                  <TableCell sx={{ 
                    p: 1, 
                    whiteSpace: 'nowrap', 
                    maxWidth: 140, 
                    overflow: 'hidden', 
                    textOverflow: 'ellipsis',
                    color: 'var(--text-color)'
                  }} align="center">
                    {option.purchaseCost.toLocaleString()}
                  </TableCell>
                  <TableCell sx={{ 
                    p: 1, 
                    whiteSpace: 'nowrap', 
                    maxWidth: 140, 
                    overflow: 'hidden', 
                    textOverflow: 'ellipsis',
                    color: 'var(--text-color)'
                  }} align="center">
                    {option.details}
                  </TableCell>
                  <TableCell sx={{ 
                    p: 1, 
                    whiteSpace: 'nowrap', 
                    maxWidth: 140, 
                    overflow: 'hidden', 
                    textOverflow: 'ellipsis',
                    color: 'var(--text-color)'
                  }} align="center">
                    {option.optionType}
                  </TableCell>
                  <TableCell sx={{ 
                    p: 1, 
                    whiteSpace: 'nowrap', 
                    maxWidth: 140, 
                    overflow: 'hidden', 
                    textOverflow: 'ellipsis',
                    color: 'var(--text-color)'
                  }} align="center">
                    {option.calculationMethod}
                  </TableCell>
                  <TableCell sx={{ 
                    p: 1, 
                    whiteSpace: 'nowrap',
                    color: 'var(--text-color)'
                  }} align="center">
                    <Box sx={{ display: 'flex', gap: 0.5, justifyContent: 'center' }}>
                      <IconButton
                        size="small"
                        onClick={() => handleEdit(idx)}
                        sx={{ color: 'primary.main' }}
                      >
                        <EditIcon fontSize="small" />
                      </IconButton>
                      <IconButton
                        size="small"
                        onClick={() => handleCopy(idx)}
                        sx={{ color: 'info.main' }}
                      >
                        <AddIcon fontSize="small" />
                      </IconButton>
                      <IconButton
                        size="small"
                        onClick={() => handleDelete(idx)}
                        sx={{ color: 'error.main' }}
                      >
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    </Box>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Grid>

      {/* 옵션 등록/수정 모달 */}
      <Dialog 
        open={isModalOpen} 
        onClose={handleCloseModal} 
        maxWidth="md" 
        fullWidth
        PaperProps={{
          sx: {
            backgroundColor: 'var(--background-color)',
            color: 'var(--text-color)',
          }
        }}
      >
        <DialogTitle sx={{ color: 'var(--text-color)' }}>
          {editMode ? '옵션 수정' : '옵션 등록'}
        </DialogTitle>
        <DialogContent sx={{ color: 'var(--text-color)' }}>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="공급업체"
                name="vendor"
                value={selectedOption.vendor}
                onChange={handleInputChange}
                required
                error={!validation.vendor}
                helperText={!validation.vendor ? '공급업체를 입력하세요' : ''}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="옵션명"
                name="optionName"
                value={selectedOption.optionName}
                onChange={handleInputChange}
                required
                error={!validation.optionName}
                helperText={!validation.optionName ? '옵션명을 입력하세요' : ''}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="제품코드"
                name="productCode"
                value={selectedOption.productCode}
                onChange={handleInputChange}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="판매가"
                name="salePrice"
                type="number"
                value={selectedOption.salePrice}
                onChange={handleInputChange}
                required
                error={!validation.salePrice}
                helperText={!validation.salePrice ? '올바른 판매가를 입력하세요' : ''}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="원가"
                name="purchaseCost"
                type="number"
                value={selectedOption.purchaseCost}
                onChange={handleInputChange}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth required error={!validation.optionType}>
                <InputLabel>적용타입</InputLabel>
                <Select
                  name="optionType"
                  value={selectedOption.optionType}
                  onChange={handleSelectChange}
                  label="적용타입"
                >
                  {optionTypes.map(type => (
                    <MenuItem key={type} value={type.replace('옵션', '').replace('전동', '')}>
                      {type}
                    </MenuItem>
                  ))}
                </Select>
                {!validation.optionType && (
                  <Typography variant="caption" color="error">
                    적용타입을 선택하세요
                  </Typography>
                )}
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel>계산방식</InputLabel>
                <Select
                  name="calculationMethod"
                  value={selectedOption.calculationMethod}
                  onChange={handleSelectChange}
                  label="계산방식"
                >
                  <MenuItem value="고정가">고정가</MenuItem>
                  <MenuItem value="면적당">면적당</MenuItem>
                  <MenuItem value="미터당">미터당</MenuItem>
                  <MenuItem value="개당">개당</MenuItem>
                  <MenuItem value="세트당">세트당</MenuItem>
                  <MenuItem value="퍼센트">퍼센트</MenuItem>
                  <MenuItem value="기타">기타</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="상세정보"
                name="details"
                value={selectedOption.details}
                onChange={handleInputChange}
                multiline
                rows={2}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="비고"
                name="note"
                value={selectedOption.note}
                onChange={handleInputChange}
                multiline
                rows={2}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseModal}>취소</Button>
          <Button onClick={handleAddOption} variant="contained">
            {editMode ? '수정' : '등록'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* 발주경로 설정 모달 */}
      <Dialog
        open={purchasePathModalOpen}
        onClose={() => setPurchasePathModalOpen(false)}
        maxWidth="md"
        fullWidth
        PaperProps={{
          sx: {
            backgroundColor: '#ffffff',
            color: '#000000'
          }
        }}
      >
        <DialogTitle sx={{ color: '#000000' }}>
          발주경로 설정
        </DialogTitle>
        <DialogContent sx={{ pt: 3, color: '#000000' }}>
          <Typography variant="body1" sx={{ mb: 3, color: '#000000' }}>
            각 탭별로 발주 시 사용할 거래처를 설정할 수 있습니다.
          </Typography>
          
          <Grid container spacing={2}>
            {optionTypes.map((tabName) => (
              <Grid item xs={12} key={tabName}>
                <Paper sx={{ p: 2, backgroundColor: '#f5f5f5' }}>
                  <Typography variant="h6" sx={{ fontWeight: 'bold', color: '#000000', mb: 2 }}>
                    {tabName}
                  </Typography>
                  
                  {/* 발주경로 선택 */}
                  <FormControl fullWidth sx={{ mb: 2 }}>
                    <InputLabel sx={{ color: '#000000' }}>발주경로</InputLabel>
                    <Select
                      value={purchasePathSettings[tabName]?.purchasePath || 'product'}
                      onChange={(e) => {
                        const newSettings = { ...purchasePathSettings };
                        if (!newSettings[tabName]) {
                          newSettings[tabName] = {
                            purchasePath: 'product',
                            excludeFromPurchase: false
                          };
                        }
                        newSettings[tabName].purchasePath = e.target.value as 'product' | 'option';
                        setPurchasePathSettings(newSettings);
                      }}
                      label="발주경로"
                      disabled={purchasePathSettings[tabName]?.excludeFromPurchase || false}
                      sx={{
                        color: '#000000',
                        '& .MuiSelect-icon': {
                          color: '#000000'
                        }
                      }}
                    >
                      <MenuItem value="product" sx={{ color: '#000000' }}>제품거래처</MenuItem>
                      <MenuItem value="option" sx={{ color: '#000000' }}>옵션거래처</MenuItem>
                    </Select>
                  </FormControl>
                  
                  {/* 발주예외 체크박스 */}
                  <FormControlLabel
                    control={
                      <Checkbox
                        checked={purchasePathSettings[tabName]?.excludeFromPurchase || false}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                          const newSettings = { ...purchasePathSettings };
                          if (!newSettings[tabName]) {
                            newSettings[tabName] = {
                              purchasePath: 'product',
                              excludeFromPurchase: false
                            };
                          }
                          newSettings[tabName].excludeFromPurchase = e.target.checked;
                          setPurchasePathSettings(newSettings);
                        }}
                        sx={{ color: '#000000' }}
                      />
                    }
                    label={
                      <Typography sx={{ color: '#000000' }}>
                        발주예외 (발주서에서 제외)
                      </Typography>
                    }
                  />
                </Paper>
              </Grid>
            ))}
          </Grid>
        </DialogContent>
        <DialogActions sx={{ p: 2, gap: 1 }}>
          <Button 
            onClick={() => setPurchasePathModalOpen(false)}
            variant="outlined"
            sx={{ color: '#000000', borderColor: '#000000' }}
          >
            취소
          </Button>
          <Button 
            onClick={() => savePurchasePathSettings(purchasePathSettings)}
            variant="contained"
            disabled={purchasePathLoading}
          >
            {purchasePathLoading ? '저장 중...' : '저장'}
          </Button>
        </DialogActions>
      </Dialog>
    </Grid>
  );
};

export default OptionManagement;
