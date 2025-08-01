import React, { useState, ChangeEvent, useEffect, useContext, useMemo, useCallback } from 'react';
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
  Divider,
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
  Settings as SettingsIcon,
  Description as DescriptionIcon,
  Assignment as AssignmentIcon,
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
import { estimateService, customerService } from '../../utils/firebaseDataService';
import { ensureFirebaseAuth, API_BASE } from '../../utils/auth';

// Order 타입 정의
export interface Order {
  id: string;
  orderNo: string;
  orderDate: string;
  customerName: string;
  customerContact: string;
  customerAddress: string;
  projectName: string;
  projectType: string;
  items: OrderItem[];
  totalAmount: number;
  status: 'pending' | 'confirmed' | 'in_production' | 'ready_for_delivery' | 'delivered' | 'cancelled' | '발주완료';
  notes: string;
  createdAt: string;
  updatedAt: string;
  // 배송관리에서 사용하는 추가 속성들
  contractNo?: string;
  vendorName?: string;
  deliveryDate?: string;
  deliveryAddress?: string;
}

// OrderItem 타입 정의
export interface OrderItem {
  id: string;
  productName: string;
  productType: string;
  vendor: string;
  brand: string;
  space: string;
  widthMM: number;
  heightMM: number;
  area: number;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  details: string;
  status: 'pending' | 'ordered' | 'received' | 'installed';
  notes: string;
  // 배송관리에서 사용하는 추가 속성들
  spaceCustom?: string;
  productCode?: string;
  productionWidth?: number;
  productionHeight?: number;
  widthCount?: number;
  note?: string; // 기존 notes와 별도로 사용되는 필드
}

// 계약 타입 정의
interface Contract {
  id: string;
  contractNo: string;
  estimateNo: string; // 견적서 번호 추가
  contractDate: string;
  customerName: string;
  customerContact: string;
  customerAddress: string;
  projectName: string;
  projectType: string;
  totalAmount: number;
  status: string;
  items: any[];
  createdAt: string;
  updatedAt: string;
}

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

interface OrderStore {
  orders: Estimate[];
  activeTab: number;
  formulas: FormulaMap;
  setActiveTab: (idx: number) => void;
  addOrder: () => void;
  removeOrder: (idx: number) => void;
  updateOrderRows: (idx: number, rows: EstimateRow[]) => void;
  setFormulas: (f: FormulaMap) => void;
  setOrders: (orders: Estimate[]) => void;
}

// 주문서 생성 시 주문번호 생성 함수
function generateOrderNo(existingOrders: Estimate[]): string {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  const dateStr = `${y}${m}${d}`;

  // saved_orders에서도 오늘 날짜의 주문서 확인
  const savedOrders = JSON.parse(
    localStorage.getItem('saved_orders') || '[]'
  );
  const allOrders = [...existingOrders, ...savedOrders];

  // 오늘 날짜의 주문서 중 가장 큰 일련번호 찾기
  const todayOrders = allOrders.filter(e =>
    e.estimateNo?.startsWith(`O${dateStr}`)
  );

  // 기본 일련번호와 수정본 일련번호를 모두 고려
  const allSequences: number[] = [];

  todayOrders.forEach(e => {
    const parts = e.estimateNo.split('-');
    if (parts.length >= 2) {
      // 기본 일련번호 (예: O20250620-001)
      const baseSeq = Number(parts[1]);
      if (!isNaN(baseSeq)) {
        allSequences.push(baseSeq);
      }

      // 수정본 일련번호 (예: O20250620-001-01)
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
  return `O${dateStr}-${nextSeq}`;
}

// 수정번호 생성 함수
function generateRevisionNo(
  originalOrderNo: string,
  existingOrders: Estimate[]
): string {
  // 원본 주문번호에서 날짜 부분 추출 (예: O20250620-003)
  const baseOrderNo = originalOrderNo.split('-').slice(0, 2).join('-');

  // 같은 원본 주문번호를 가진 수정본들 찾기 (saved_orders에서도 확인)
  const savedOrders = JSON.parse(
    localStorage.getItem('saved_orders') || '[]'
  );
  const allOrders = [...existingOrders, ...savedOrders];

  const revisionOrders = allOrders.filter(
    e => e.estimateNo.startsWith(baseOrderNo) && e.estimateNo.includes('-')
  );

  // 수정번호 찾기 (마지막 부분이 숫자인 경우)
  const revisionNumbers = revisionOrders
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

  return `${baseOrderNo}-${String(nextRevision).padStart(2, '0')}`;
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
function removeDuplicateOrders(orders: any[]): any[] {
  const uniqueOrders = new Map();
  
  orders.forEach(order => {
    const key = order.estimateNo;
    if (!uniqueOrders.has(key)) {
      uniqueOrders.set(key, order);
    } else {
      // 이미 존재하는 경우 더 최신 데이터로 업데이트
      const existing = uniqueOrders.get(key);
      const existingDate = new Date(existing.savedAt || 0);
      const currentDate = new Date(order.savedAt || 0);
      
      if (currentDate > existingDate) {
        uniqueOrders.set(key, order);
        console.log('중복 주문서 정리 - 더 최신 데이터로 교체:', key);
      }
    }
  });
  
  const cleanedOrders = Array.from(uniqueOrders.values());
  console.log(`중복 정리 완료: ${orders.length}개 → ${cleanedOrders.length}개`);
  
  return cleanedOrders;
}

const useOrderStore = create<OrderStore>(set => ({
  orders: [
    {
      id: 1, // 고정된 ID 사용으로 안정성 확보
      name: `주문서-${generateOrderNo([])}`,
      estimateNo: generateOrderNo([]),
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
  addOrder: () =>
    set(state => {
      const orderNo = generateOrderNo(state.orders);
      // 고유 ID 생성 (기존 ID 중 최대값 + 1)
      const maxId = state.orders.length > 0 
        ? Math.max(...state.orders.map(e => e.id)) 
        : 0;
      const newId = maxId + 1;
      return {
        orders: [
          ...state.orders,
          {
            id: newId,
            name: `주문서-${orderNo}`,
            estimateNo: orderNo,
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
        activeTab: state.orders.length,
      };
    }),
  removeOrder: idx =>
    set(state => {
      // 주문서가 1개만 남아있으면 삭제하지 않고 초기화
      if (state.orders.length === 1) {
        const orderNo = generateOrderNo([]);
        return {
          orders: [
            {
              id: 1, // 고정된 ID 사용으로 안정성 확보
              name: `주문서-${orderNo}`,
              estimateNo: orderNo,
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

      // 주문서가 2개 이상일 때는 기존 로직대로 삭제
      const newOrders = state.orders.filter((_, i) => i !== idx);
      return {
        orders: newOrders,
        activeTab: Math.max(0, idx - 1),
      };
    }),
  updateOrderRows: (idx, rows) =>
    set(state => {
      const newOrders = [...state.orders];
      newOrders[idx] = { ...newOrders[idx], rows };
      return { orders: newOrders };
    }),
  setFormulas: f => set({ formulas: f }),
  setOrders: orders => set({ orders }),
}));

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
      // localStorage에서 계약 데이터 로드 (계약관리에서 사용하는 키)
      const savedContracts = localStorage.getItem('contracts');
      if (savedContracts) {
        const parsedContracts = JSON.parse(savedContracts);
        setContracts(parsedContracts);
      }
    } catch (error) {
      console.error('계약 목록 로드 실패:', error);
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
      contract.customerAddress?.toLowerCase().includes(search)
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
        <AssignmentIcon sx={{ mr: 1 }} />
        계약 목록에서 선택
        <Typography variant="subtitle2" sx={{
          mt: isMobile ? 0.5 : 1,
          color: '#666',
          fontWeight: 'normal',
          fontSize: isMobile ? '0.9rem' : '0.875rem'
        }}>
          계약을 선택하여 주문서를 작성합니다.
        </Typography>
      </DialogTitle>
      
      <DialogContent>
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
                padding: isMobile ? '12px 14px' : '8.5px 14px'
              }
            }}
          />
        </Box>

        {/* 계약 목록 */}
        {loading ? (
          <Box sx={{ textAlign: 'center', py: 4 }}>
            <Typography>계약 목록을 불러오는 중...</Typography>
          </Box>
        ) : filteredContracts.length > 0 ? (
          <TableContainer>
            <Table size={isMobile ? "small" : "medium"}>
              <TableHead>
                <TableRow>
                  <TableCell>계약번호</TableCell>
                  <TableCell>고객명</TableCell>
                  <TableCell>프로젝트명</TableCell>
                  <TableCell>주소</TableCell>
                  <TableCell>계약일자</TableCell>
                  <TableCell>계약금액</TableCell>
                  <TableCell>액션</TableCell>
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
                    <TableCell>{contract.contractNo}</TableCell>
                    <TableCell>{contract.customerName}</TableCell>
                    <TableCell>{contract.projectName}</TableCell>
                    <TableCell>{contract.customerAddress}</TableCell>
                    <TableCell>{contract.contractDate}</TableCell>
                    <TableCell>
                      {contract.totalAmount?.toLocaleString()}원
                    </TableCell>
                    <TableCell>
                      <Button
                        size="small"
                        variant="contained"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleSelectContract(contract);
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
        ) : (
          <Box sx={{ textAlign: 'center', py: 4 }}>
            <Typography color="text.secondary">
              {searchTerm ? '검색 결과가 없습니다.' : '저장된 계약이 없습니다.'}
            </Typography>
          </Box>
        )}
      </DialogContent>
      
      {!isMobile && (
        <DialogActions>
          <Button onClick={onClose}>닫기</Button>
        </DialogActions>
      )}
    </Dialog>
  );
};

const OrderManagement: React.FC = () => {
  // === UI 개선을 위한 선언 ===
  const isMobile = useMediaQuery('(max-width:600px)');

  // CSS 애니메이션 스타일 추가
  useEffect(() => {
    const style = document.createElement('style');
    style.textContent = `
      @keyframes pulse {
        0% { transform: scale(1); }
        50% { transform: scale(1.02); }
        100% { transform: scale(1); }
      }
    `;
    document.head.appendChild(style);
    
    return () => {
      document.head.removeChild(style);
    };
  }, []);

  // 주문서 스토어에서 데이터 가져오기
  const {
    orders,
    activeTab,
    setActiveTab,
    addOrder,
    removeOrder,
    updateOrderRows,
    setOrders,
  } = useOrderStore();



  const formulas = useOrderStore(s => s.formulas);
  const [productSearch, setProductSearch] = useState('');
  const [orderSearch, setOrderSearch] = useState('');
  const [orderSearchTab, setOrderSearchTab] = useState<
    'current' | 'saved'
  >('current');
  const [savedOrderSearch, setSavedOrderSearch] = useState('');
  const [showSavedOrders, setShowSavedOrders] = useState(true);
  const [productOptions, setProductOptions] = useState<any[]>([]);
  const [snackbarMessage, setSnackbarMessage] = useState<string>('');
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [savedOrders, setSavedOrders] = useState<any[]>([]);

  // 계약 관련 상태
  const [contractListModalOpen, setContractListModalOpen] = useState(false);
  const [showOrderTemplate, setShowOrderTemplate] = useState(false);
  const [selectedContract, setSelectedContract] = useState<Contract | null>(null);

  // 제품 목록 불러오기 함수
  function loadProducts() {
    try {
      const data = localStorage.getItem('productList');
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  }

  useEffect(() => {
    setProductOptions(loadProducts());
  }, []);

  // 주문서 검색 필터링
  const filteredOrders = orders.filter(order => {
    const s = orderSearch.trim().toLowerCase();
    if (!s) return true;
    return (
      order.name.toLowerCase().includes(s) ||
      order.rows.some(
        row =>
          row.productName?.toLowerCase().includes(s) ||
          row.details?.toLowerCase().includes(s) ||
          row.vendor?.toLowerCase().includes(s) ||
          row.brand?.toLowerCase().includes(s)
      )
    );
  });

  // 저장된 주문서 필터링
  const filteredSavedOrders = savedOrders.filter((order: any) => {
    const s = savedOrderSearch.trim().toLowerCase();
    if (!s) return true;
    return (
      order.name.toLowerCase().includes(s) ||
      order.rows.some(
        (row: any) =>
          row.productName?.toLowerCase().includes(s) ||
          row.details?.toLowerCase().includes(s) ||
          row.vendor?.toLowerCase().includes(s) ||
          row.brand?.toLowerCase().includes(s)
      )
    );
  });

  // 계약 선택 핸들러
  const handleSelectContract = (contract: Contract) => {
    setSelectedContract(contract);
    
    // 계약과 연결된 견적서 찾기
    const savedEstimates = JSON.parse(localStorage.getItem('saved_estimates') || '[]');
    const linkedEstimate = savedEstimates.find((est: any) => est.estimateNo === contract.estimateNo);
    
    console.log('계약과 연결된 견적서:', linkedEstimate);
    
    // 주문서 정보 업데이트
    const currentOrder = orders[activeTab];
    if (currentOrder) {
      let updatedOrder = {
        ...currentOrder,
        customerName: contract.customerName || '',
        contact: contract.customerContact || '',
        address: contract.customerAddress || '',
        projectName: contract.projectName || '',
        type: contract.projectType || '',
        // 계약 정보 추가
        contractNo: contract.contractNo,
        estimateDate: getLocalDate(),
      };
      
      // 연결된 견적서가 있으면 견적서의 내용을 우선 사용
      if (linkedEstimate) {
        console.log('견적서 내용으로 주문서 업데이트:', linkedEstimate);
        updatedOrder = {
          ...updatedOrder,
          customerName: linkedEstimate.customerName || contract.customerName || '',
          contact: linkedEstimate.contact || contract.customerContact || '',
          address: linkedEstimate.address || contract.customerAddress || '',
          projectName: linkedEstimate.projectName || contract.projectName || '',
          type: linkedEstimate.type || contract.projectType || '',
          emergencyContact: linkedEstimate.emergencyContact || '',
          // 견적서의 rows를 주문서 rows로 변환
          rows: linkedEstimate.rows?.map((item: any, index: number) => ({
            id: index + 1,
            type: 'product' as const,
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
          })) || [],
        };
      } else {
        // 연결된 견적서가 없으면 계약의 아이템들을 사용
        console.log('계약 아이템으로 주문서 업데이트');
        updatedOrder.rows = contract.items?.map((item: any, index: number) => ({
          id: index + 1,
          type: 'product' as const,
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
        })) || [];
      }
      
      // 주문서 업데이트
      const updatedOrders = [...orders];
      updatedOrders[activeTab] = updatedOrder;
      setOrders(updatedOrders);
      
      // 주문서 작성 화면 표시
      setShowOrderTemplate(true);
      
      // 성공 메시지 표시
      if (linkedEstimate) {
        setSnackbarMessage(`계약과 연결된 견적서(${contract.estimateNo})의 내용이 주문서에 불러와졌습니다.`);
        setSnackbarOpen(true);
      } else {
        setSnackbarMessage(`계약 내용이 주문서에 불러와졌습니다.`);
        setSnackbarOpen(true);
      }
    }
  };

  // 견적관리와 동일한 주문서 작성 기능들
  const [productDialogOpen, setProductDialogOpen] = useState(false);
  const [optionDialogOpen, setOptionDialogOpen] = useState(false);
  const [filterModalOpen, setFilterModalOpen] = useState(false);
  const [showDiscount, setShowDiscount] = useState(false);
  const [showMarginSum, setShowMarginSum] = useState(false);
  const [discountAmount, setDiscountAmount] = useState('');
  const [discountRate, setDiscountRate] = useState('');
  const [discountedTotalInput, setDiscountedTotalInput] = useState('');
  const [columnVisibility, setColumnVisibility] = useState({
    vendor: true,
    brand: true,
    space: true,
    productCode: true,
    productType: true,
    productName: true,
    width: true,
    details: true,
    widthMM: true,
    heightMM: true,
    area: true,
    lineDir: true,
    lineLen: true,
    pleatAmount: true,
    widthCount: true,
    quantity: true,
    totalPrice: true,
    cost: false,
    margin: false,
  });

  // 할인 관련 계산
  const sumTotalPrice = orders[activeTab]?.rows?.reduce((sum, row) => sum + (Number(row.totalPrice) || 0), 0) || 0;
  const discountAmountNumber = Number(discountAmount.replace(/,/g, '')) || 0;
  const discountedTotal = sumTotalPrice - discountAmountNumber;
  const sumMargin = showMarginSum ? orders[activeTab]?.rows?.reduce((sum, row) => sum + (Number(row.margin) || 0), 0) || 0 : 0;

  // 할인 토글 핸들러
  const handleToggleDiscount = () => {
    setShowDiscount(!showDiscount);
  };

  // 마진 합계 토글 핸들러
  const handleToggleMarginSum = () => {
    setShowMarginSum(!showMarginSum);
  };

  // 할인 금액 변경 핸들러
  const handleDiscountAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/[^0-9]/g, '');
    setDiscountAmount(value);
    if (value && sumTotalPrice) {
      const rate = ((Number(value) / sumTotalPrice) * 100).toFixed(2);
      setDiscountRate(rate);
      setDiscountedTotalInput((sumTotalPrice - Number(value)).toString());
    }
  };

  // 할인율 변경 핸들러
  const handleDiscountRateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rate = Number(e.target.value);
    setDiscountRate(e.target.value);
    if (rate && sumTotalPrice) {
      const amount = Math.round((sumTotalPrice * rate) / 100);
      setDiscountAmount(amount.toString());
      setDiscountedTotalInput((sumTotalPrice - amount).toString());
    }
  };

  // 할인 후 금액 변경 핸들러
  const handleDiscountedTotalChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/[^0-9]/g, '');
    setDiscountedTotalInput(value);
    if (value && sumTotalPrice) {
      const amount = sumTotalPrice - Number(value);
      setDiscountAmount(amount.toString());
      const rate = ((amount / sumTotalPrice) * 100).toFixed(2);
      setDiscountRate(rate);
    }
  };

  // 컬럼 표시/숨김 토글
  const handleColumnToggle = (field: string) => {
    setColumnVisibility(prev => ({
      ...prev,
      [field]: !prev[field as keyof typeof prev]
    }));
  };

  // 필터 초기화
  const handleFilterReset = () => {
    setColumnVisibility({
      vendor: true,
      brand: true,
      space: true,
      productCode: true,
      productType: true,
      productName: true,
      width: true,
      details: true,
      widthMM: true,
      heightMM: true,
      area: true,
      lineDir: true,
      lineLen: true,
      pleatAmount: true,
      widthCount: true,
      quantity: true,
      totalPrice: true,
      cost: false,
      margin: false,
    });
  };

  // 제품 검색 모달 열기
  const handleProductSearch = () => {
    setProductDialogOpen(true);
  };

  // 옵션 추가 모달 열기
  const handleOpenOptionDialog = () => {
    setOptionDialogOpen(true);
  };

  // 출력하기 클릭 핸들러
  const handleOutputClick = () => {
    setShowOrderTemplate(true);
  };

  // 저장하기 핸들러
  const handleSaveOrder = () => {
    // 주문서 저장 로직
    setSnackbarMessage('주문서가 저장되었습니다.');
    setSnackbarOpen(true);
  };

  // 새 주문서 저장 핸들러
  const handleSaveAsNewOrder = () => {
    // 새 주문서로 저장 로직
    setSnackbarMessage('새 주문서로 저장되었습니다.');
    setSnackbarOpen(true);
  };

  // 주문서 작성 완료 핸들러
  const handleOrderComplete = () => {
    setShowOrderTemplate(false);
    setSelectedContract(null);
    setSnackbarMessage('주문서가 성공적으로 작성되었습니다.');
    setSnackbarOpen(true);
  };

  return (
    <>
      <Box sx={{ p: isMobile ? 1 : 3 }}>
        <Typography variant="h4" sx={{ 
          mb: 3, 
          fontWeight: 'bold',
          fontSize: isMobile ? '1.5rem' : '2.125rem',
          color: 'primary.main'
        }}>
          주문관리
        </Typography>

        {/* 주문서 탭 */}
        <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 2 }}>
          <Tabs 
            value={activeTab} 
            onChange={(_, newValue) => setActiveTab(newValue)}
            variant="scrollable"
            scrollButtons="auto"
            sx={{
              '& .MuiTab-root': {
                fontSize: isMobile ? '0.875rem' : '1rem',
                minHeight: isMobile ? '48px' : '56px',
              }
            }}
          >
            {filteredOrders.map((order, index) => (
              <Tab 
                key={order.id} 
                label={`주문서-${order.estimateNo}`}
                sx={{
                  textTransform: 'none',
                  fontWeight: 'medium',
                }}
              />
            ))}
          </Tabs>
        </Box>

        {/* 주문서 관리 버튼 */}
        <Box sx={{ mb: 2, display: 'flex', gap: 1, flexWrap: 'wrap' }}>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={addOrder}
            sx={{
              fontSize: isMobile ? '0.875rem' : '1rem',
              minHeight: isMobile ? '40px' : '48px',
            }}
          >
            새 주문서
          </Button>
          <Button
            variant="outlined"
            startIcon={<AssignmentIcon />}
            onClick={() => setContractListModalOpen(true)}
            sx={{
              fontSize: isMobile ? '0.875rem' : '1rem',
              minHeight: isMobile ? '40px' : '48px',
            }}
          >
            계약불러오기
          </Button>
          <Button
            variant="outlined"
            startIcon={<DeleteIcon />}
            onClick={() => removeOrder(activeTab)}
            disabled={orders.length <= 1}
            sx={{
              fontSize: isMobile ? '0.875rem' : '1rem',
              minHeight: isMobile ? '40px' : '48px',
            }}
          >
            주문서 삭제
          </Button>
        </Box>

        {/* 주문서 내용 */}
        {orders[activeTab] && (
          <Paper sx={{ p: isMobile ? 1 : 2, mb: 2 }}>
            <Typography variant="h6" sx={{ mb: 2, fontWeight: 'bold', color: 'primary.main' }}>
              고객정보
            </Typography>
            <Box sx={{ 
              display: 'flex', 
              flexDirection: isMobile ? 'column' : 'row',
              gap: 2, 
              alignItems: 'flex-start',
              flexWrap: 'wrap'
            }}>
              <TextField
                label="주문번호*"
                value={orders[activeTab].estimateNo}
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
                required
              />
              <TextField
                label="주문일자*"
                value={orders[activeTab].estimateDate}
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
                required
              />
              <TextField
                label="고객명"
                value={orders[activeTab].customerName}
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
              <TextField
                label="연락처*"
                value={orders[activeTab].contact}
                size="small"
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
                required
              />
              <TextField
                label="비상연락처"
                value={orders[activeTab].emergencyContact || ''}
                size="small"
                sx={{ 
                  minWidth: 160,
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
                value={orders[activeTab].projectName}
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
                value={orders[activeTab].type}
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
              />
              <TextField
                label="주소"
                value={orders[activeTab].address}
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
              {orders[activeTab].contractNo && (
                <TextField
                  label="계약번호"
                  value={orders[activeTab].contractNo}
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
                  InputProps={{
                    readOnly: true,
                  }}
                />
              )}
            </Box>
          </Paper>
        )}

        {/* 주문서 작성 도구 모음 */}
        {orders[activeTab] && (
          <Paper sx={{ p: isMobile ? 1 : 2, mb: 2 }}>
            <Box sx={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: 2, 
              mb: 2, 
              p: 1
            }}>
              <Box sx={{ display: 'flex', gap: 1, flex: 1 }}>
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
                  onClick={handleProductSearch}
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
              </Box>
              <Box sx={{ display: 'flex', gap: 1 }}>
                <Button
                  variant="outlined"
                  size="small"
                  color="success"
                  sx={{ minWidth: 80, fontSize: 13, py: 0.5, px: 1.5 }}
                  onClick={handleSaveOrder}
                >
                  저장하기
                </Button>
                <Button
                  variant="outlined"
                  size="small"
                  color="warning"
                  sx={{ minWidth: 100, fontSize: 13, py: 0.5, px: 1.5 }}
                  onClick={handleSaveAsNewOrder}
                >
                  새주문 저장
                </Button>
              </Box>
            </Box>

            {/* 주문서 아이템 테이블 */}
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>순번</TableCell>
                    {columnVisibility.vendor && <TableCell>거래처</TableCell>}
                    {columnVisibility.brand && <TableCell>브랜드</TableCell>}
                    {columnVisibility.space && <TableCell>공간</TableCell>}
                    {columnVisibility.productCode && <TableCell>제품코드</TableCell>}
                    {columnVisibility.productType && <TableCell>제품종류</TableCell>}
                    {columnVisibility.productName && <TableCell>제품명</TableCell>}
                    {columnVisibility.width && <TableCell>폭</TableCell>}
                    {columnVisibility.details && <TableCell>세부내용</TableCell>}
                    {columnVisibility.widthMM && <TableCell>가로(mm)</TableCell>}
                    {columnVisibility.heightMM && <TableCell>세로(mm)</TableCell>}
                    {columnVisibility.area && <TableCell>면적(㎡)</TableCell>}
                    {columnVisibility.lineDir && <TableCell>줄방향</TableCell>}
                    {columnVisibility.lineLen && <TableCell>줄길이</TableCell>}
                    {columnVisibility.pleatAmount && <TableCell>주름양</TableCell>}
                    {columnVisibility.widthCount && <TableCell>폭수</TableCell>}
                    {columnVisibility.quantity && <TableCell>수량</TableCell>}
                    {columnVisibility.totalPrice && <TableCell>판매금액</TableCell>}
                    {columnVisibility.cost && <TableCell>입고금액</TableCell>}
                    {columnVisibility.margin && <TableCell>마진</TableCell>}
                    <TableCell>작업</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {orders[activeTab]?.rows?.map((row, index) => (
                    <TableRow key={row.id}>
                      <TableCell>{index + 1}</TableCell>
                      {columnVisibility.vendor && <TableCell>{row.vendor}</TableCell>}
                      {columnVisibility.brand && <TableCell>{row.brand}</TableCell>}
                      {columnVisibility.space && <TableCell>{row.space}</TableCell>}
                      {columnVisibility.productCode && <TableCell>{row.productCode}</TableCell>}
                      {columnVisibility.productType && <TableCell>{row.productType}</TableCell>}
                      {columnVisibility.productName && <TableCell>{row.productName}</TableCell>}
                      {columnVisibility.width && <TableCell>{row.width}</TableCell>}
                      {columnVisibility.details && <TableCell>{row.details}</TableCell>}
                      {columnVisibility.widthMM && <TableCell>{row.widthMM}</TableCell>}
                      {columnVisibility.heightMM && <TableCell>{row.heightMM}</TableCell>}
                      {columnVisibility.area && <TableCell>{row.area}</TableCell>}
                      {columnVisibility.lineDir && <TableCell>{row.lineDir}</TableCell>}
                      {columnVisibility.lineLen && <TableCell>{row.lineLen}</TableCell>}
                      {columnVisibility.pleatAmount && <TableCell>{row.pleatAmount}</TableCell>}
                      {columnVisibility.widthCount && <TableCell>{row.widthCount}</TableCell>}
                      {columnVisibility.quantity && <TableCell>{row.quantity}</TableCell>}
                      {columnVisibility.totalPrice && <TableCell>{row.totalPrice?.toLocaleString()}</TableCell>}
                      {columnVisibility.cost && <TableCell>{row.cost?.toLocaleString()}</TableCell>}
                      {columnVisibility.margin && <TableCell>{row.margin?.toLocaleString()}</TableCell>}
                      <TableCell>
                        <IconButton size="small">
                          <EditIcon fontSize="small" />
                        </IconButton>
                        <IconButton size="small">
                          <ContentCopyIcon fontSize="small" />
                        </IconButton>
                        <IconButton size="small">
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  ))}
                  {/* 합계 행 */}
                  <TableRow sx={{ backgroundColor: '#e3f2fd', fontWeight: 'bold' }}>
                    <TableCell>합계</TableCell>
                    {columnVisibility.vendor && <TableCell></TableCell>}
                    {columnVisibility.brand && <TableCell></TableCell>}
                    {columnVisibility.space && <TableCell></TableCell>}
                    {columnVisibility.productCode && <TableCell></TableCell>}
                    {columnVisibility.productType && <TableCell></TableCell>}
                    {columnVisibility.productName && <TableCell></TableCell>}
                    {columnVisibility.width && <TableCell></TableCell>}
                    {columnVisibility.details && <TableCell></TableCell>}
                    {columnVisibility.widthMM && <TableCell></TableCell>}
                    {columnVisibility.heightMM && <TableCell></TableCell>}
                    {columnVisibility.area && <TableCell>{orders[activeTab]?.rows?.reduce((sum, row) => sum + (Number(row.area) || 0), 0).toFixed(1)}</TableCell>}
                    {columnVisibility.lineDir && <TableCell></TableCell>}
                    {columnVisibility.lineLen && <TableCell></TableCell>}
                    {columnVisibility.pleatAmount && <TableCell></TableCell>}
                    {columnVisibility.widthCount && <TableCell></TableCell>}
                    {columnVisibility.quantity && <TableCell>{orders[activeTab]?.rows?.reduce((sum, row) => sum + (Number(row.quantity) || 0), 0)}</TableCell>}
                    {columnVisibility.totalPrice && <TableCell>{sumTotalPrice.toLocaleString()}</TableCell>}
                    {columnVisibility.cost && <TableCell>{orders[activeTab]?.rows?.reduce((sum, row) => sum + (Number(row.cost) || 0), 0).toLocaleString()}</TableCell>}
                    {columnVisibility.margin && <TableCell>{sumMargin.toLocaleString()}</TableCell>}
                    <TableCell></TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </TableContainer>

            {/* 합계 정보 */}
            <Box sx={{ mt: 2, mb: 2, fontWeight: 'bold', fontSize: 16 }}>
              <span style={{ color: '#000000', marginRight: 32 }}>
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
                <span style={{ color: 'var(--primary-color, #6a1b9a)', marginRight: 32 }}>
                  할인후금액(VAT포함): {discountedTotal.toLocaleString()} 원
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
            </Box>

            {/* 할인 설정 */}
            {showDiscount && (
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2, ml: 2 }}>
                <span>할인금액:</span>
                <input
                  type="text"
                  value={discountAmount ? Number(discountAmount).toLocaleString() : ''}
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
                  value={discountedTotalInput ? Number(discountedTotalInput).toLocaleString() : ''}
                  onChange={handleDiscountedTotalChange}
                  style={{ width: 120, fontSize: '15px' }}
                />
              </Box>
            )}
          </Paper>
        )}

        {/* 주문서 목록 */}
        <Paper sx={{ p: isMobile ? 1 : 2 }}>
          <Typography variant="h6" sx={{ mb: 2, fontWeight: 'bold' }}>
            저장된 주문서 목록
          </Typography>
          {filteredSavedOrders.length > 0 ? (
            <TableContainer>
              <Table size={isMobile ? "small" : "medium"}>
                <TableHead>
                  <TableRow>
                    <TableCell>주문번호</TableCell>
                    <TableCell>고객명</TableCell>
                    <TableCell>주소</TableCell>
                    <TableCell>주문일자</TableCell>
                    <TableCell>액션</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {filteredSavedOrders.map((order: any) => (
                    <TableRow key={order.id}>
                      <TableCell>{order.estimateNo}</TableCell>
                      <TableCell>{order.customerName}</TableCell>
                      <TableCell>{order.address}</TableCell>
                      <TableCell>{order.estimateDate}</TableCell>
                      <TableCell>
                        <Button
                          size="small"
                          variant="outlined"
                          onClick={() => {
                            // 주문서 로드 로직
                            console.log('주문서 로드:', order);
                          }}
                        >
                          로드
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          ) : (
            <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', py: 4 }}>
              저장된 주문서가 없습니다.
            </Typography>
          )}
        </Paper>
      </Box>

      {/* 계약목록 모달 */}
      <ContractListModal
        open={contractListModalOpen}
        onClose={() => setContractListModalOpen(false)}
        onSelectContract={handleSelectContract}
      />

      {/* 필터 모달 */}
      <Dialog
        open={filterModalOpen}
        onClose={() => setFilterModalOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>열 표시 설정</DialogTitle>
        <DialogContent>
          <Grid container spacing={2}>
            <Grid item xs={4}>
              <FormControlLabel
                control={
                  <Checkbox
                    checked={columnVisibility.vendor}
                    onChange={() => handleColumnToggle('vendor')}
                  />
                }
                label="거래처"
              />
            </Grid>
            <Grid item xs={4}>
              <FormControlLabel
                control={
                  <Checkbox
                    checked={columnVisibility.brand}
                    onChange={() => handleColumnToggle('brand')}
                  />
                }
                label="브랜드"
              />
            </Grid>
            <Grid item xs={4}>
              <FormControlLabel
                control={
                  <Checkbox
                    checked={columnVisibility.space}
                    onChange={() => handleColumnToggle('space')}
                  />
                }
                label="공간"
              />
            </Grid>
            <Grid item xs={4}>
              <FormControlLabel
                control={
                  <Checkbox
                    checked={columnVisibility.productCode}
                    onChange={() => handleColumnToggle('productCode')}
                  />
                }
                label="제품코드"
              />
            </Grid>
            <Grid item xs={4}>
              <FormControlLabel
                control={
                  <Checkbox
                    checked={columnVisibility.productType}
                    onChange={() => handleColumnToggle('productType')}
                  />
                }
                label="제품종류"
              />
            </Grid>
            <Grid item xs={4}>
              <FormControlLabel
                control={
                  <Checkbox
                    checked={columnVisibility.productName}
                    onChange={() => handleColumnToggle('productName')}
                  />
                }
                label="제품명"
              />
            </Grid>
            <Grid item xs={4}>
              <FormControlLabel
                control={
                  <Checkbox
                    checked={columnVisibility.width}
                    onChange={() => handleColumnToggle('width')}
                  />
                }
                label="폭"
              />
            </Grid>
            <Grid item xs={4}>
              <FormControlLabel
                control={
                  <Checkbox
                    checked={columnVisibility.details}
                    onChange={() => handleColumnToggle('details')}
                  />
                }
                label="세부내용"
              />
            </Grid>
            <Grid item xs={4}>
              <FormControlLabel
                control={
                  <Checkbox
                    checked={columnVisibility.widthMM}
                    onChange={() => handleColumnToggle('widthMM')}
                  />
                }
                label="가로(mm)"
              />
            </Grid>
            <Grid item xs={4}>
              <FormControlLabel
                control={
                  <Checkbox
                    checked={columnVisibility.heightMM}
                    onChange={() => handleColumnToggle('heightMM')}
                  />
                }
                label="세로(mm)"
              />
            </Grid>
            <Grid item xs={4}>
              <FormControlLabel
                control={
                  <Checkbox
                    checked={columnVisibility.area}
                    onChange={() => handleColumnToggle('area')}
                  />
                }
                label="면적(㎡)"
              />
            </Grid>
            <Grid item xs={4}>
              <FormControlLabel
                control={
                  <Checkbox
                    checked={columnVisibility.lineDir}
                    onChange={() => handleColumnToggle('lineDir')}
                  />
                }
                label="줄방향"
              />
            </Grid>
            <Grid item xs={4}>
              <FormControlLabel
                control={
                  <Checkbox
                    checked={columnVisibility.lineLen}
                    onChange={() => handleColumnToggle('lineLen')}
                  />
                }
                label="줄길이"
              />
            </Grid>
            <Grid item xs={4}>
              <FormControlLabel
                control={
                  <Checkbox
                    checked={columnVisibility.pleatAmount}
                    onChange={() => handleColumnToggle('pleatAmount')}
                  />
                }
                label="주름양"
              />
            </Grid>
            <Grid item xs={4}>
              <FormControlLabel
                control={
                  <Checkbox
                    checked={columnVisibility.widthCount}
                    onChange={() => handleColumnToggle('widthCount')}
                  />
                }
                label="폭수"
              />
            </Grid>
            <Grid item xs={4}>
              <FormControlLabel
                control={
                  <Checkbox
                    checked={columnVisibility.quantity}
                    onChange={() => handleColumnToggle('quantity')}
                  />
                }
                label="수량"
              />
            </Grid>
            <Grid item xs={4}>
              <FormControlLabel
                control={
                  <Checkbox
                    checked={columnVisibility.totalPrice}
                    onChange={() => handleColumnToggle('totalPrice')}
                  />
                }
                label="판매금액"
              />
            </Grid>
            <Grid item xs={4}>
              <FormControlLabel
                control={
                  <Checkbox
                    checked={columnVisibility.cost}
                    onChange={() => handleColumnToggle('cost')}
                  />
                }
                label="입고금액"
              />
            </Grid>
            <Grid item xs={4}>
              <FormControlLabel
                control={
                  <Checkbox
                    checked={columnVisibility.margin}
                    onChange={() => handleColumnToggle('margin')}
                  />
                }
                label="마진"
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleFilterReset}>초기화</Button>
          <Button variant="contained" onClick={() => setFilterModalOpen(false)}>
            적용
          </Button>
        </DialogActions>
      </Dialog>

      {/* 주문서 작성 화면 (EstimateTemplate 사용) */}
      {orders[activeTab] && (
        <EstimateTemplate
          estimate={orders[activeTab]}
          onClose={() => setShowOrderTemplate(false)}
          discountAmount={Number(discountAmount) || 0}
          open={showOrderTemplate}
        />
      )}

      {/* Snackbar */}
      <Snackbar
        open={snackbarOpen}
        autoHideDuration={6000}
        onClose={() => setSnackbarOpen(false)}
        message={snackbarMessage}
      />
    </>
  );
};

export default OrderManagement; 