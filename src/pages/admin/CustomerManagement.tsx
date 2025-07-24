import React, { useState, useRef, ChangeEvent, useEffect } from 'react';
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
  IconButton,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  List,
  ListItem,
  ListItemText,
  Divider,
  Tooltip,
  useMediaQuery,
  useTheme,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import FileUploadIcon from '@mui/icons-material/FileUpload';
import FileDownloadIcon from '@mui/icons-material/FileDownload';
import RefreshIcon from '@mui/icons-material/Refresh';
import ProjectIcon from '@mui/icons-material/AccountTree';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import * as XLSX from 'xlsx';
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';
import { customerService } from '../../utils/firebaseDataService';

interface Project {
  id: string;
  projectName: string;
  projectType: string;
  estimateNo: string;
  estimateDate: string;
  status: '견적' | '계약' | '완료' | '취소';
  address?: string; // 프로젝트별 주소
  createdAt: string;
}

interface Customer {
  id: number;
  name: string;
  address: string;
  tel: string;
  emergencyTel: string;
  visitPath: string;
  note: string;
  projects: Project[];
  createdAt: string;
  updatedAt: string;
}

const initialCustomers: Customer[] = [
  {
    id: 1,
    name: '홍길동',
    address: '서울시 강남구',
    tel: '010-1234-5678',
    emergencyTel: '010-1111-2222',
    visitPath: '지인소개',
    note: 'VIP',
    projects: [
      {
        id: '1',
        projectName: '강남 아파트 리모델링',
        projectType: '주거',
        estimateNo: 'EST-2024-001',
        estimateDate: '2024-01-15',
        status: '견적',
        createdAt: '2024-01-15T10:00:00Z',
      },
    ],
    createdAt: '2024-01-15T10:00:00Z',
    updatedAt: '2024-01-15T10:00:00Z',
  },
  {
    id: 2,
    name: '이몽룡',
    address: '부산시 해운대구',
    tel: '010-2345-6789',
    emergencyTel: '010-3333-4444',
    visitPath: '광고',
    note: '',
    projects: [],
    createdAt: '2024-01-16T10:00:00Z',
    updatedAt: '2024-01-16T10:00:00Z',
  },
];

const initialCustomer: Customer = {
  id: 0,
  name: '',
  address: '',
  tel: '',
  emergencyTel: '',
  visitPath: '',
  note: '',
  projects: [],
  createdAt: '',
  updatedAt: '',
};

const customerHeaders = [
  '고객명',
  '기본주소',
  '연락처',
  '비상연락처',
  '방문경로',
  '프로젝트수',
  '비고',
];
const sortKeys: (keyof Customer)[] = [
  'name',
  'address',
  'tel',
  'emergencyTel',
  'visitPath',
  'note',
];

const CUSTOMER_STORAGE_KEY = 'customerList';

async function loadCustomers() {
  try {
    console.log('Firebase에서 고객 데이터 로드 시작');
    const customers = await customerService.getCustomers();
    console.log('Firebase에서 고객 데이터 로드 완료:', customers.length, '개');
    return customers;
  } catch (error) {
    console.error('Firebase에서 고객 데이터 로드 실패:', error);
    // Firebase 실패 시 localStorage에서 로드 (fallback)
    try {
      const customerData = localStorage.getItem(CUSTOMER_STORAGE_KEY);
      if (!customerData) return [];

      const parsed = JSON.parse(customerData);
      if (!Array.isArray(parsed)) return [];

      return parsed.map((customer: any) => ({
        ...customer,
        projects: customer.projects || [],
        createdAt: customer.createdAt || new Date().toISOString(),
        updatedAt: customer.updatedAt || new Date().toISOString(),
      }));
    } catch (localError) {
      console.error('localStorage에서 고객 데이터 로드 실패:', localError);
      return [];
    }
  }
}

async function saveCustomers(customers: Customer[]) {
  try {
    // localStorage에만 저장 (Firebase 저장은 별도로 처리)
    localStorage.setItem('customerList', JSON.stringify(customers));
    console.log('localStorage에 고객 데이터 저장 완료');
  } catch (error) {
    console.error('localStorage에 고객 데이터 저장 실패:', error);
  }
}

// 고객명 + 연락처 + 프로젝트 타입 중복 체크 함수
function findDuplicateCustomer(
  customers: Customer[],
  name: string,
  tel: string,
  projectType?: string
): Customer | null {
  return (
    customers.find(
      customer =>
        customer.name.trim().toLowerCase() === name.trim().toLowerCase() &&
        customer.tel.trim() === tel.trim() &&
        (!projectType ||
          customer.projects.some(p => p.projectType === projectType))
    ) || null
  );
}

// 고객명 + 연락처로 고객 찾기 (프로젝트 타입 무관)
function findCustomerByNameAndTel(
  customers: Customer[],
  name: string,
  tel: string
): Customer | null {
  return (
    customers.find(
      customer =>
        customer.name.trim().toLowerCase() === name.trim().toLowerCase() &&
        customer.tel.trim() === tel.trim()
    ) || null
  );
}

// 프로젝트별 고객 그룹화
function groupCustomersByProject(customers: Customer[]): {
  [key: string]: Customer[];
} {
  const groups: { [key: string]: Customer[] } = {};

  customers.forEach(customer => {
    customer.projects.forEach(project => {
      const key = `${customer.name}-${customer.tel}-${project.projectType}`;
      if (!groups[key]) {
        groups[key] = [];
      }
      groups[key].push(customer);
    });
  });

  return groups;
}

// 프로젝트 상태별 색상
const getStatusColor = (status: Project['status']) => {
  switch (status) {
    case '견적':
      return 'primary';
    case '계약':
      return 'success';
    case '완료':
      return 'info';
    case '취소':
      return 'error';
    default:
      return 'default';
  }
};

const CustomerManagement: React.FC = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  
  const [customers, setCustomers] = useState<Customer[]>([]);
  
  // 고객 데이터 로드
  useEffect(() => {
    const loadCustomerData = async () => {
      const loadedCustomers = await loadCustomers();
      setCustomers(loadedCustomers && Array.isArray(loadedCustomers) ? loadedCustomers : []);
    };
    loadCustomerData();
  }, []);
  const [selectedCustomer, setSelectedCustomer] =
    useState<Customer>(initialCustomer);
  const [editMode, setEditMode] = useState(false);
  const [editIndex, setEditIndex] = useState<number | null>(null);
  const [search, setSearch] = useState('');
  const [projectTypeFilter, setProjectTypeFilter] = useState('');
  const [sortBy, setSortBy] = useState<keyof Customer | null>(null);
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [projectDialogOpen, setProjectDialogOpen] = useState(false);
  const [selectedCustomerForProjects, setSelectedCustomerForProjects] =
    useState<Customer | null>(null);
  const [addressSelectionDialogOpen, setAddressSelectionDialogOpen] =
    useState(false);
  const [selectedCustomerForAddress, setSelectedCustomerForAddress] =
    useState<Customer | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // customers가 바뀔 때마다 localStorage에 저장 (무한 루프 방지)
  useEffect(() => {
    if (customers && customers.length > 0) {
      // Firebase 저장은 별도로 처리하고, localStorage만 업데이트
      localStorage.setItem('customerList', JSON.stringify(customers));
    }
  }, [customers]);

  // 검색 및 프로젝트 타입 필터
  const filteredCustomers = (customers || []).filter(c => {
    const s = search.trim().toLowerCase();
    const projectFilter = projectTypeFilter.trim();

    // 검색어 필터
    const searchMatch =
      !s ||
      c.name.toLowerCase().includes(s) ||
      c.address.toLowerCase().includes(s) ||
      c.tel.toLowerCase().includes(s) ||
      c.emergencyTel.toLowerCase().includes(s) ||
      c.visitPath.toLowerCase().includes(s) ||
      c.note.toLowerCase().includes(s) ||
      (c.projects &&
        c.projects.some(p => p.projectName.toLowerCase().includes(s)));

    // 프로젝트 타입 필터
    const projectTypeMatch =
      !projectFilter ||
      (c.projects && c.projects.some(p => p.projectType === projectFilter));

    return searchMatch && projectTypeMatch;
  });

  // 정렬
  const sortedCustomers = React.useMemo(() => {
    if (!filteredCustomers || filteredCustomers.length === 0) {
      return [];
    }

    if (sortBy) {
      return [...filteredCustomers].sort((a, b) => {
        const aValue = a[sortBy];
        const bValue = b[sortBy];
        return sortOrder === 'asc'
          ? String(aValue).localeCompare(String(bValue))
          : String(bValue).localeCompare(String(aValue));
      });
    }

    return filteredCustomers;
  }, [filteredCustomers, sortBy, sortOrder]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setSelectedCustomer(prev => ({ ...prev, [name]: value }));
  };

  const handleAddCustomer = async () => {
    if (!selectedCustomer.name.trim() || !selectedCustomer.tel.trim()) {
      alert('고객명과 연락처는 필수 입력 항목입니다.');
      return;
    }

    const currentCustomers = customers || [];

    // 기존 고객 찾기 (프로젝트 타입 무관)
    const existingCustomer = findCustomerByNameAndTel(
      currentCustomers,
      selectedCustomer.name,
      selectedCustomer.tel
    );

    let updatedCustomers: Customer[];

    if (editMode && editIndex !== null) {
      // 수정 모드
      try {
        const customerToUpdate = currentCustomers[editIndex];
        const updatedCustomer = {
          ...selectedCustomer,
          updatedAt: new Date().toISOString(),
        };
        
        // Firebase에서 고객 업데이트
        await customerService.updateCustomer(customerToUpdate.id.toString(), updatedCustomer);
        
        // 로컬 상태 업데이트
        updatedCustomers = [...currentCustomers];
        updatedCustomers[editIndex] = updatedCustomer;
        setCustomers(updatedCustomers);
        setEditMode(false);
        setEditIndex(null);
        setSelectedCustomer(initialCustomer);
        alert('고객 정보가 성공적으로 수정되었습니다.');
      } catch (error) {
        console.error('고객 수정 실패:', error);
        alert('고객 정보 수정에 실패했습니다.');
        return;
      }
    } else if (existingCustomer) {
      // 기존 고객이 있는 경우 - 프로젝트 정보만 추가하거나 업데이트
      try {
        const updatedCustomer = {
          ...existingCustomer,
          ...selectedCustomer,
          updatedAt: new Date().toISOString(),
        };
        
        // Firebase에서 고객 업데이트
        await customerService.updateCustomer(existingCustomer.id.toString(), updatedCustomer);
        
        // 로컬 상태 업데이트
        updatedCustomers = currentCustomers.map(customer => {
          if (customer.id === existingCustomer.id) {
            return updatedCustomer;
          }
          return customer;
        });
        setCustomers(updatedCustomers);
        setSelectedCustomer(initialCustomer);
        alert(
          `기존 고객 정보가 업데이트되었습니다.\n고객명: ${existingCustomer.name}\n연락처: ${existingCustomer.tel}`
        );
      } catch (error) {
        console.error('고객 업데이트 실패:', error);
        alert('고객 정보 업데이트에 실패했습니다.');
        return;
      }
    } else {
      // 새 고객 추가
      try {
        const newCustomer: Customer = {
          ...selectedCustomer,
          id: Date.now(), // 고유한 ID 생성 (타임스탬프 사용)
          projects: [],
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        
        // Firebase에 새 고객 저장
        await customerService.saveCustomer(newCustomer);
        
        // 로컬 상태 업데이트
        updatedCustomers = [...currentCustomers, newCustomer];
        setCustomers(updatedCustomers);
        setSelectedCustomer(initialCustomer);
        alert('새로운 고객이 추가되었습니다.');
      } catch (error) {
        console.error('고객 추가 실패:', error);
        alert('새 고객 추가에 실패했습니다.');
        return;
      }
    }

    // localStorage에 저장 (백업용)
    try {
      console.log('localStorage에 고객 데이터 저장 시작');
      await saveCustomers(updatedCustomers);
      console.log('localStorage에 고객 데이터 저장 완료');
    } catch (error) {
      console.error('localStorage 저장 실패:', error);
      // localStorage 실패는 치명적이지 않으므로 경고만 표시
      console.warn('localStorage 백업 저장에 실패했습니다.');
    }
  };

  const handleEditCustomer = (customer: Customer, index: number) => {
    setSelectedCustomer(customer);
    setEditMode(true);
    setEditIndex(index);
  };

  const handleDeleteCustomer = async (index: number) => {
    if (window.confirm('정말로 이 고객을 삭제하시겠습니까?')) {
      try {
        const currentCustomers = customers || [];
        const customerToDelete = currentCustomers[index];
        
        if (!customerToDelete) {
          alert('삭제할 고객을 찾을 수 없습니다.');
          return;
        }

        // Firebase에서 고객 삭제
        await customerService.deleteCustomer(customerToDelete.id.toString());
        
        // 로컬 상태 업데이트
        const updatedCustomers = currentCustomers.filter((_, i) => i !== index);
        setCustomers(updatedCustomers);
        
        if (editMode && editIndex === index) {
          setEditMode(false);
          setEditIndex(null);
          setSelectedCustomer(initialCustomer);
        }
        
        alert('고객이 성공적으로 삭제되었습니다.');
      } catch (error) {
        console.error('고객 삭제 실패:', error);
        alert('고객 삭제 중 오류가 발생했습니다.');
      }
    }
  };

  const handleCopyCustomer = async (customer: Customer) => {
    try {
      const currentCustomers = customers || [];
      const newCustomer: Customer = {
        ...customer,
        id: Date.now(), // 고유한 ID 생성 (타임스탬프 사용)
        name: `${customer.name} (복사본)`,
        projects: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      
      // Firebase에 새 고객 저장
      await customerService.saveCustomer(newCustomer);
      
      // 로컬 상태 업데이트
      setCustomers([...currentCustomers, newCustomer]);
      alert('고객이 성공적으로 복사되었습니다.');
    } catch (error) {
      console.error('고객 복사 실패:', error);
      alert('고객 복사에 실패했습니다.');
    }
  };

  const handleViewProjects = (customer: Customer) => {
    setSelectedCustomerForProjects(customer);
    setProjectDialogOpen(true);
  };

  const handleSelectDefaultAddress = (customer: Customer) => {
    setSelectedCustomerForAddress(customer);
    setAddressSelectionDialogOpen(true);
  };

  const handleUpdateDefaultAddress = async (newAddress: string) => {
    if (!selectedCustomerForAddress) return;

    try {
      const currentCustomers = customers || [];
      const updatedCustomer = {
        ...selectedCustomerForAddress,
        address: newAddress,
        updatedAt: new Date().toISOString(),
      };

      // Firebase에서 고객 업데이트
      await customerService.updateCustomer(selectedCustomerForAddress.id.toString(), updatedCustomer);

      // 로컬 상태 업데이트
      const updatedCustomers = currentCustomers.map(customer => {
        if (customer.id === selectedCustomerForAddress.id) {
          return updatedCustomer;
        }
        return customer;
      });

      setCustomers(updatedCustomers);
      setAddressSelectionDialogOpen(false);
      setSelectedCustomerForAddress(null);
      alert('기본주소가 업데이트되었습니다.');
    } catch (error) {
      console.error('기본주소 업데이트 실패:', error);
      alert('기본주소 업데이트에 실패했습니다.');
    }
  };

  // Excel Upload
  const handleExcelUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    try {
      const reader = new FileReader();
      reader.onload = async evt => {
        const data = evt.target?.result;
        if (!data) return;
        
        const workbook = XLSX.read(data, { type: 'binary' });
        const sheet = workbook.Sheets[workbook.SheetNames[0]];
        const json: any[] = XLSX.utils.sheet_to_json(sheet, { header: 1 });
        const [header, ...rows] = json;
        const mapped = rows.map(row => {
          const obj: any = {};
          customerHeaders.forEach((h, i) => {
            obj[h] = row[i] ?? '';
          });
          return obj;
        });
        
        // Convert to Customer type
        const currentCustomers = customers || [];
        const newCustomers: Customer[] = mapped.map((item, idx) => ({
          id: currentCustomers.length + idx + 1,
          name: item['고객명'] || '',
          address: item['주소'] || '',
          tel: item['연락처'] || '',
          emergencyTel: item['비상연락처'] || '',
          visitPath: item['방문경로'] || '',
          note: item['비고'] || '',
          projects: [],
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        }));
        
        // Firebase에 새 고객들 저장
        for (const customer of newCustomers) {
          try {
            await customerService.saveCustomer(customer);
          } catch (error) {
            console.error(`고객 ${customer.name} 저장 실패:`, error);
          }
        }
        
        // 로컬 상태 업데이트
        setCustomers(prev => [...(prev || []), ...newCustomers]);
        alert(`${newCustomers.length}명의 고객이 성공적으로 업로드되었습니다.`);
      };
      reader.readAsBinaryString(file);
      if (fileInputRef.current) fileInputRef.current.value = '';
    } catch (error) {
      console.error('Excel 업로드 실패:', error);
      alert('Excel 파일 업로드에 실패했습니다.');
    }
  };

  // Excel Download (Current Data)
  const handleExcelDownload = () => {
    const currentCustomers = customers || [];
    const data = currentCustomers.map(c => [
      c.name,
      c.address,
      c.tel,
      c.emergencyTel,
      c.visitPath,
      c.projects?.length || 0,
      c.note,
    ]);
    const ws = XLSX.utils.aoa_to_sheet([customerHeaders, ...data]);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Customers');
    XLSX.writeFile(wb, 'customers.xlsx');
  };

  // Excel Template Download
  const handleTemplateDownload = () => {
    const ws = XLSX.utils.aoa_to_sheet([customerHeaders]);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Template');
    XLSX.writeFile(wb, 'customer_template.xlsx');
  };

  // Reset
  const handleReset = async () => {
    if (window.confirm('정말로 모든 고객 데이터를 초기화하시겠습니까? 이 작업은 되돌릴 수 없습니다.')) {
      try {
        // Firebase에서 모든 고객 삭제
        const currentCustomers = customers || [];
        for (const customer of currentCustomers) {
          try {
            await customerService.deleteCustomer(customer.id.toString());
          } catch (error) {
            console.error(`고객 ${customer.name} 삭제 실패:`, error);
          }
        }
        
        // 로컬 상태 초기화
        localStorage.removeItem(CUSTOMER_STORAGE_KEY);
        setCustomers([]);
        setSelectedCustomer(initialCustomer);
        setEditMode(false);
        setEditIndex(null);
        setSearch('');
        setSortBy(null);
        setSortOrder('asc');
        
        alert('모든 고객 데이터가 초기화되었습니다.');
      } catch (error) {
        console.error('고객 데이터 초기화 실패:', error);
        alert('고객 데이터 초기화 중 오류가 발생했습니다.');
      }
    }
  };

  // 견적관리에서 자동 저장된 고객들 새로고침
  const handleRefreshFromEstimates = () => {
    const loadCustomerData = async () => {
      const loadedCustomers = await loadCustomers();
      setCustomers(loadedCustomers);
    };
    loadCustomerData();
    alert('견적관리에서 자동 저장된 고객들을 불러왔습니다.');
  };



  // 정렬 핸들러
  const handleSort = (key: keyof Customer) => {
    if (sortBy === key) {
      setSortOrder(prev => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortBy(key);
      setSortOrder('asc');
    }
  };

  // 드래그 앤 드롭
  const onDragEnd = (result: any) => {
    if (!result.destination) return;
    const currentCustomers = customers || [];
    const reordered = Array.from(currentCustomers);
    const [removed] = reordered.splice(result.source.index, 1);
    reordered.splice(result.destination.index, 0, removed);
    setCustomers(reordered);
  };

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
            onClick={handleAddCustomer}
          >
            {editMode ? '수정 저장' : '고객 등록'}
          </Button>
          <Button
            variant="contained"
            color="success"
            startIcon={<FileUploadIcon />}
            component="label"
          >
            고객 업로드
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
            고객 다운로드
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
            startIcon={<RefreshIcon />}
            onClick={handleRefreshFromEstimates}
          >
            견적관리 고객 새로고침
          </Button>

          <TextField
            placeholder="검색 (고객명, 주소, 연락처, 프로젝트명 등)"
            value={search}
            onChange={(e: ChangeEvent<HTMLInputElement>) =>
              setSearch(e.target.value)
            }
            sx={{ minWidth: 220 }}
          />
          <TextField
            select
            label="프로젝트 타입 필터"
            value={projectTypeFilter}
            onChange={(e: ChangeEvent<HTMLInputElement>) =>
              setProjectTypeFilter(e.target.value)
            }
            sx={{ minWidth: 150 }}
          >
            <option value="">전체</option>
            <option value="주거">주거</option>
            <option value="상업">상업</option>
            <option value="사무실">사무실</option>
            <option value="기타">기타</option>
          </TextField>
        </Box>
      </Grid>

      <Grid item xs={12}>
        <TableContainer component={Paper}>
          <DragDropContext onDragEnd={onDragEnd}>
            <Table size="small">
              <TableHead>
                <TableRow sx={{ height: 32 }}>
                  {customerHeaders.map((header, idx) => (
                    <TableCell
                      key={header}
                      onClick={() => handleSort(sortKeys[idx])}
                      sx={{ cursor: 'pointer', userSelect: 'none', p: 0.5 }}
                    >
                      {header}
                      {sortBy === sortKeys[idx] &&
                        (sortOrder === 'asc' ? ' ▲' : ' ▼')}
                    </TableCell>
                  ))}
                  <TableCell sx={{ p: 0.5 }}>작업</TableCell>
                </TableRow>
              </TableHead>
              <Droppable droppableId="customers">
                {(droppableProvided: any) => (
                  <TableBody
                    ref={droppableProvided.innerRef}
                    {...droppableProvided.droppableProps}
                  >
                    {Array.isArray(sortedCustomers) &&
                      sortedCustomers.map((customer, idx) => (
                        <Draggable
                          key={customer.id}
                          draggableId={String(customer.id || idx)}
                          index={idx}
                        >
                          {(draggableProvided: any) => (
                            <TableRow
                              ref={draggableProvided.innerRef}
                              {...draggableProvided.draggableProps}
                              {...draggableProvided.dragHandleProps}
                              sx={{ height: 32 }}
                            >
                              <TableCell sx={{ p: 0.5 }}>
                                {customer.name}
                              </TableCell>
                              <TableCell sx={{ p: 0.5 }}>
                                {customer.address}
                              </TableCell>
                              <TableCell sx={{ p: 0.5 }}>
                                {customer.tel}
                              </TableCell>
                              <TableCell sx={{ p: 0.5 }}>
                                {customer.emergencyTel}
                              </TableCell>
                              <TableCell sx={{ p: 0.5 }}>
                                {customer.visitPath}
                              </TableCell>
                              <TableCell sx={{ p: 0.5 }}>
                                <Box
                                  sx={{
                                    display: 'flex',
                                    gap: 0.5,
                                    alignItems: 'center',
                                  }}
                                >
                                  <Tooltip title="프로젝트 보기">
                                    <Chip
                                      label={customer.projects?.length || 0}
                                      size="small"
                                      color={
                                        (customer.projects?.length || 0) > 0
                                          ? 'primary'
                                          : 'default'
                                      }
                                      onClick={() =>
                                        handleViewProjects(customer)
                                      }
                                      sx={{ cursor: 'pointer' }}
                                    />
                                  </Tooltip>
                                  {(customer.projects?.length || 0) > 1 && (
                                    <Tooltip title="기본주소 선택">
                                      <IconButton
                                        size="small"
                                        onClick={() =>
                                          handleSelectDefaultAddress(customer)
                                        }
                                        sx={{ p: 0.5 }}
                                      >
                                        <EditIcon fontSize="small" />
                                      </IconButton>
                                    </Tooltip>
                                  )}
                                </Box>
                              </TableCell>
                              <TableCell sx={{ p: 0.5 }}>
                                {customer.note}
                              </TableCell>
                              <TableCell sx={{ p: 0.5 }}>
                                <Box sx={{ display: 'flex', gap: 0.5 }}>
                                  <IconButton
                                    size="small"
                                    onClick={() =>
                                      handleEditCustomer(customer, idx)
                                    }
                                    sx={{ p: 0.5 }}
                                  >
                                    <EditIcon fontSize="small" />
                                  </IconButton>
                                  <IconButton
                                    size="small"
                                    onClick={() => handleCopyCustomer(customer)}
                                    sx={{ p: 0.5 }}
                                  >
                                    <ContentCopyIcon fontSize="small" />
                                  </IconButton>
                                  <IconButton
                                    size="small"
                                    onClick={() => handleDeleteCustomer(idx)}
                                    sx={{ p: 0.5 }}
                                  >
                                    <DeleteIcon fontSize="small" />
                                  </IconButton>
                                </Box>
                              </TableCell>
                            </TableRow>
                          )}
                        </Draggable>
                      ))}
                    {droppableProvided.placeholder}
                  </TableBody>
                )}
              </Droppable>
            </Table>
          </DragDropContext>
        </TableContainer>
      </Grid>
      <Grid item xs={12}>
        <Paper sx={{ p: 2 }}>
          <Typography variant="h6" gutterBottom>
            고객 상세 정보
          </Typography>
          <Box
            component="form"
            sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}
          >
            <TextField
              label="고객명"
              name="name"
              value={selectedCustomer.name}
              onChange={handleInputChange}
              size="small"
            />
            <TextField
              label="주소"
              name="address"
              value={selectedCustomer.address}
              onChange={handleInputChange}
              size="small"
            />
            <TextField
              label="연락처"
              name="tel"
              value={selectedCustomer.tel}
              onChange={handleInputChange}
              size="small"
            />
            <TextField
              label="비상연락처"
              name="emergencyTel"
              value={selectedCustomer.emergencyTel}
              onChange={handleInputChange}
              size="small"
            />
            <TextField
              label="방문경로"
              name="visitPath"
              value={selectedCustomer.visitPath}
              onChange={handleInputChange}
              size="small"
            />
            <TextField
              label="비고"
              name="note"
              value={selectedCustomer.note}
              onChange={handleInputChange}
              size="small"
            />
          </Box>
          {editMode && (
            <Box sx={{ display: 'flex', gap: 1, mt: 2 }}>
              <Button
                variant="contained"
                color="primary"
                onClick={handleAddCustomer}
              >
                저장
              </Button>
              <Button
                variant="outlined"
                onClick={() => {
                  setEditMode(false);
                  setEditIndex(null);
                  setSelectedCustomer(initialCustomer);
                }}
              >
                취소
              </Button>
            </Box>
          )}
        </Paper>
      </Grid>

      {/* 프로젝트 목록 다이얼로그 */}
      <Dialog
        open={projectDialogOpen}
        onClose={() => setProjectDialogOpen(false)}
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
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              gap: 1,
              justifyContent: 'space-between',
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              {isMobile && (
                <IconButton
                  onClick={() => setProjectDialogOpen(false)}
                  sx={{ mr: 1 }}
                >
                  <ArrowBackIcon />
                </IconButton>
              )}
              <ProjectIcon />
              <Typography variant={isMobile ? 'h6' : 'h5'}>
                {selectedCustomerForProjects?.name} - 프로젝트 목록
              </Typography>
            </Box>
            {(selectedCustomerForProjects?.projects?.length || 0) > 1 && (
              <Button
                variant="outlined"
                size={isMobile ? 'medium' : 'small'}
                startIcon={<EditIcon />}
                onClick={() => {
                  setProjectDialogOpen(false);
                  setSelectedCustomerForAddress(selectedCustomerForProjects);
                  setAddressSelectionDialogOpen(true);
                }}
                sx={{
                  ...(isMobile && {
                    fontSize: '0.875rem',
                    padding: '8px 16px',
                  }),
                }}
              >
                기본주소 선택
              </Button>
            )}
          </Box>
          <Typography 
            variant="body2" 
            sx={{ 
              color: 'text.secondary', 
              mt: 1,
              ...(isMobile && {
                fontSize: '0.875rem',
                marginTop: 1.5,
              }),
            }}
          >
            기본 주소: {selectedCustomerForProjects?.address || '주소 없음'}
          </Typography>
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
          {!selectedCustomerForProjects?.projects ||
          selectedCustomerForProjects.projects.length === 0 ? (
            <Typography
              variant="body1"
              sx={{ 
                color: 'text.secondary', 
                textAlign: 'center', 
                py: 4,
                ...(isMobile && {
                  fontSize: '1rem',
                  padding: 3,
                }),
              }}
            >
              등록된 프로젝트가 없습니다.
            </Typography>
          ) : (
            <List>
              {(selectedCustomerForProjects.projects || []).map(
                (project, index) => (
                  <React.Fragment key={project.id}>
                    <ListItem
                      sx={{
                        ...(isMobile && {
                          padding: '12px 0',
                        }),
                      }}
                    >
                      <ListItemText
                        primary={
                          <Box
                            component="span"
                            sx={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: 1,
                              flexWrap: 'wrap',
                            }}
                          >
                            <Typography 
                              component="span" 
                              variant={isMobile ? 'h6' : 'h6'}
                              sx={{
                                ...(isMobile && {
                                  fontSize: '1.1rem',
                                  fontWeight: 600,
                                }),
                              }}
                            >
                              {project.projectName}
                            </Typography>
                            <Chip
                              label={project.status}
                              size={isMobile ? 'medium' : 'small'}
                              color={getStatusColor(project.status)}
                              sx={{
                                ...(isMobile && {
                                  fontSize: '0.75rem',
                                  height: '24px',
                                }),
                              }}
                            />
                          </Box>
                        }
                        secondary={
                          <Box 
                            component="span"
                            sx={{
                              ...(isMobile && {
                                marginTop: 1,
                              }),
                            }}
                          >
                            <Typography 
                              component="span" 
                              variant="body2"
                              sx={{
                                ...(isMobile && {
                                  fontSize: '0.875rem',
                                  display: 'block',
                                  marginBottom: 0.5,
                                }),
                              }}
                            >
                              프로젝트 타입: {project.projectType}
                            </Typography>
                            <Typography 
                              component="span" 
                              variant="body2"
                              sx={{
                                ...(isMobile && {
                                  fontSize: '0.875rem',
                                  display: 'block',
                                  marginBottom: 0.5,
                                }),
                              }}
                            >
                              견적번호: {project.estimateNo}
                            </Typography>
                            <Typography 
                              component="span" 
                              variant="body2"
                              sx={{
                                ...(isMobile && {
                                  fontSize: '0.875rem',
                                  display: 'block',
                                  marginBottom: 0.5,
                                }),
                              }}
                            >
                              견적일: {project.estimateDate}
                            </Typography>
                            {project.address && (
                              <Typography 
                                component="span" 
                                variant="body2"
                                sx={{
                                  ...(isMobile && {
                                    fontSize: '0.875rem',
                                    display: 'block',
                                    marginBottom: 0.5,
                                  }),
                                }}
                              >
                                프로젝트 주소: {project.address}
                              </Typography>
                            )}
                            <Typography 
                              component="span" 
                              variant="body2"
                              sx={{
                                ...(isMobile && {
                                  fontSize: '0.875rem',
                                  display: 'block',
                                  marginBottom: 0.5,
                                }),
                              }}
                            >
                              생성일:{' '}
                              {new Date(project.createdAt).toLocaleDateString()}
                            </Typography>
                          </Box>
                        }
                      />
                    </ListItem>
                    {index <
                      (selectedCustomerForProjects?.projects?.length || 0) -
                        1 && <Divider />}
                  </React.Fragment>
                )
              )}
            </List>
          )}
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
            onClick={() => setProjectDialogOpen(false)}
            size={isMobile ? 'large' : 'medium'}
            sx={{
              ...(isMobile && {
                fontSize: '1rem',
                padding: '12px 24px',
                minWidth: '80px',
              }),
            }}
          >
            닫기
          </Button>
        </DialogActions>
      </Dialog>

      {/* 기본주소 선택 다이얼로그 */}
      <Dialog
        open={addressSelectionDialogOpen}
        onClose={() => setAddressSelectionDialogOpen(false)}
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
                onClick={() => setAddressSelectionDialogOpen(false)}
                sx={{ mr: 1 }}
              >
                <ArrowBackIcon />
              </IconButton>
            )}
            <EditIcon />
            <Typography variant={isMobile ? 'h6' : 'h5'}>
              {selectedCustomerForAddress?.name} - 기본주소 선택
            </Typography>
          </Box>
          <Typography 
            variant="body2" 
            sx={{ 
              color: 'text.secondary', 
              mt: 1,
              ...(isMobile && {
                fontSize: '0.875rem',
                marginTop: 1.5,
              }),
            }}
          >
            현재 기본주소: {selectedCustomerForAddress?.address || '주소 없음'}
          </Typography>
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
          {!selectedCustomerForAddress?.projects ||
          selectedCustomerForAddress.projects.length === 0 ? (
            <Typography
              variant="body1"
              sx={{ 
                color: 'text.secondary', 
                textAlign: 'center', 
                py: 4,
                ...(isMobile && {
                  fontSize: '1rem',
                  padding: 3,
                }),
              }}
            >
              등록된 프로젝트가 없습니다.
            </Typography>
          ) : (
            <Box>
              <Typography 
                variant="h6" 
                sx={{ 
                  mb: 2,
                  ...(isMobile && {
                    fontSize: '1.25rem',
                    marginBottom: 2.5,
                  }),
                }}
              >
                프로젝트별 주소 목록
              </Typography>
              <List>
                {(selectedCustomerForAddress.projects || []).map(
                  (project, index) => (
                    <React.Fragment key={project.id}>
                      <ListItem
                        sx={{
                          ...(isMobile && {
                            padding: '12px 0',
                            flexDirection: 'column',
                            alignItems: 'flex-start',
                          }),
                        }}
                      >
                        <ListItemText
                          primary={
                            <Box
                              component="span"
                              sx={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: 1,
                                flexWrap: 'wrap',
                              }}
                            >
                              <Typography 
                                component="span" 
                                variant={isMobile ? 'h6' : 'h6'}
                                sx={{
                                  ...(isMobile && {
                                    fontSize: '1.1rem',
                                    fontWeight: 600,
                                  }),
                                }}
                              >
                                {project.projectName}
                              </Typography>
                              <Chip
                                label={project.projectType}
                                size={isMobile ? 'medium' : 'small'}
                                color="secondary"
                                sx={{
                                  ...(isMobile && {
                                    fontSize: '0.75rem',
                                    height: '24px',
                                  }),
                                }}
                              />
                            </Box>
                          }
                          secondary={
                            <Box 
                              component="span"
                              sx={{
                                ...(isMobile && {
                                  marginTop: 1,
                                }),
                              }}
                            >
                              <Typography 
                                component="span" 
                                variant="body2"
                                sx={{
                                  ...(isMobile && {
                                    fontSize: '0.875rem',
                                    display: 'block',
                                    marginBottom: 0.5,
                                  }),
                                }}
                              >
                                견적번호: {project.estimateNo}
                              </Typography>
                              <Typography 
                                component="span" 
                                variant="body2"
                                sx={{
                                  ...(isMobile && {
                                    fontSize: '0.875rem',
                                    display: 'block',
                                    marginBottom: 0.5,
                                  }),
                                }}
                              >
                                견적일: {project.estimateDate}
                              </Typography>
                              {project.address && (
                                <Typography
                                  component="span"
                                  variant="body2"
                                  sx={{
                                    fontWeight: 'bold',
                                    color: 'primary.main',
                                    ...(isMobile && {
                                      fontSize: '0.875rem',
                                      display: 'block',
                                      marginBottom: 0.5,
                                    }),
                                  }}
                                >
                                  주소: {project.address}
                                </Typography>
                              )}
                            </Box>
                          }
                        />
                        {project.address && (
                          <Button
                            variant="outlined"
                            size={isMobile ? 'medium' : 'small'}
                            onClick={() =>
                              handleUpdateDefaultAddress(project.address!)
                            }
                            sx={{ 
                              ml: isMobile ? 0 : 2,
                              mt: isMobile ? 2 : 0,
                              ...(isMobile && {
                                fontSize: '0.875rem',
                                padding: '8px 16px',
                                width: '100%',
                              }),
                            }}
                          >
                            기본주소로 설정
                          </Button>
                        )}
                      </ListItem>
                      {index <
                        (selectedCustomerForAddress?.projects?.length || 0) -
                          1 && <Divider />}
                    </React.Fragment>
                  )
                )}
              </List>
            </Box>
          )}
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
            onClick={() => setAddressSelectionDialogOpen(false)}
            size={isMobile ? 'large' : 'medium'}
            sx={{
              ...(isMobile && {
                fontSize: '1rem',
                padding: '12px 24px',
                minWidth: '80px',
              }),
            }}
          >
            닫기
          </Button>
        </DialogActions>
      </Dialog>
    </Grid>
  );
};

export default CustomerManagement;
