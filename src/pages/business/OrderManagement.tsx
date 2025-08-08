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
import { findLastIndex } from 'lodash';
import { useNavigate } from 'react-router-dom';
import { useNotificationStore } from '../../utils/notificationStore';
import { UserContext } from '../../components/Layout';
import { estimateService, customerService, optionService, orderService } from '../../utils/firebaseDataService';
import { ensureFirebaseAuth, API_BASE } from '../../utils/auth';
import { createKeyboardNavigationHandler, getNextFieldIndex, focusField } from '../../utils/keyboardNavigation';



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
  address?: string; // 주소 필드 추가 (기존 customerAddress와 별도)
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

// 고객 목록 가져오기 함수
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
      // 주문관리 추가 필드들
      measurementDate: '',
      installationDate: '',
      installerId: '',
      installerName: '',
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
            orderNo: `O${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-${String(state.orders.length + 1).padStart(3, '0')}`,
            estimateDate: getLocalDate(), // 로컬 시간 기준으로 오늘 날짜 설정
            customerName: '',
            contact: '',
            emergencyContact: '',
            projectName: '',
            type: '',
            address: '',
            rows: [],
            // 주문관리 추가 필드들
            measurementDate: '',
            installationDate: '',
            installerId: '',
            installerName: '',
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
            orderNo: `O${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-001`,
            estimateDate: getLocalDate(),
            customerName: '',
            contact: '',
            emergencyContact: '',
            projectName: '',
            type: '',
            address: '',
            rows: [],
            // 주문관리 추가 필드들
            measurementDate: '',
            installationDate: '',
            installerId: '',
            installerName: '',
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
        console.log('로드된 계약 데이터:', parsedContracts);
        // 각 계약의 주소 필드 확인
        parsedContracts.forEach((contract: any, index: number) => {
          console.log(`계약 ${index + 1}:`, {
            contractNo: contract.contractNo,
            customerName: contract.customerName,
            address: contract.address,
            customerAddress: contract.customerAddress,
            projectName: contract.projectName
          });
        });
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
          계약 목록에서 선택
        </Typography>
        <Typography variant="subtitle2" sx={{
          mt: isMobile ? 0.5 : 1,
          color: 'var(--text-secondary-color)',
          fontWeight: 'normal',
          fontSize: isMobile ? '0.9rem' : '0.875rem'
        }}>
          계약을 선택하여 주문서를 작성합니다.
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
            <Typography sx={{ color: 'var(--text-secondary-color)' }}>
              {searchTerm ? '검색 결과가 없습니다.' : '저장된 계약이 없습니다.'}
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

const OrderManagement: React.FC = () => {
  // === UI 개선을 위한 선언 ===
  const isMobile = useMediaQuery('(max-width:600px)');

  // 자동 크기 조절을 위한 ref
  const hiddenInputRef = useRef<HTMLInputElement>(null);

  // 텍스트 길이에 따른 자동 크기 계산 함수
  const calculateInputWidth = (text: string, minWidth: number = 30, maxWidth: number = 300) => {
    if (!hiddenInputRef.current) return minWidth;
    
    hiddenInputRef.current.value = text;
    const scrollWidth = hiddenInputRef.current.scrollWidth;
    const calculatedWidth = Math.max(minWidth, Math.min(maxWidth, scrollWidth + 20)); // 20px 여백 추가
    
    return calculatedWidth;
  };

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

  // 주문서 편집 모드 상태
  const [isOrderEditMode, setIsOrderEditMode] = useState(false);

  // 저장된 주문서 목록 표시항목 설정 상태
  const [savedOrderColumnVisibility, setSavedOrderColumnVisibility] = useState({
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

  // 모바일용 저장된 주문서 목록 표시항목 (주소, 연락처, 시공일자, 할인후금액, 액션만)
  const mobileSavedOrderColumnVisibility = {
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
  const [savedOrderColumnSettingsOpen, setSavedOrderColumnSettingsOpen] = useState(false);

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
  const [selectedOrderForAS, setSelectedOrderForAS] = useState<any>(null);
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

  // 키보드 네비게이션을 위한 ref들
  const orderNoRef = useRef<HTMLInputElement>(null);
  const orderDateRef = useRef<HTMLInputElement>(null);
  const customerNameRef = useRef<HTMLInputElement>(null);
  const contactRef = useRef<HTMLInputElement>(null);
  const emergencyContactRef = useRef<HTMLInputElement>(null);
  const projectNameRef = useRef<HTMLInputElement>(null);
  const typeRef = useRef<HTMLInputElement>(null);
  const addressRef = useRef<HTMLInputElement>(null);

  // 필드 ref 배열
  const fieldRefs = [
    orderNoRef,
    orderDateRef,
    customerNameRef,
    contactRef,
    emergencyContactRef,
    projectNameRef,
    typeRef,
    addressRef
  ];

  // 제품 정보 입력 필드를 위한 ref들
  const orderProductSpaceRef = useRef<HTMLInputElement>(null);
  const orderProductCodeRef = useRef<HTMLInputElement>(null);
  const orderProductDetailsRef = useRef<HTMLInputElement>(null);
  const orderProductWidthRef = useRef<HTMLInputElement>(null);
  const orderProductHeightRef = useRef<HTMLInputElement>(null);
  const orderProductAreaRef = useRef<HTMLInputElement>(null);
  const orderProductLineDirRef = useRef<HTMLInputElement>(null);
  const orderProductLineLenRef = useRef<HTMLInputElement>(null);
  const orderProductWidthCountRef = useRef<HTMLInputElement>(null);
  const orderProductQuantityRef = useRef<HTMLInputElement>(null);

  // 제품 정보 필드 ref 배열
  const orderProductFieldRefs = [
    orderProductSpaceRef,
    orderProductCodeRef,
    orderProductDetailsRef,
    orderProductWidthRef,
    orderProductHeightRef,
    orderProductAreaRef,
    orderProductLineDirRef,
    orderProductLineLenRef,
    orderProductWidthCountRef,
    orderProductQuantityRef
  ];

  // 주문서 전용 키보드 네비게이션 핸들러
  const handleOrderKeyboardNavigation = (currentIndex: number, direction: 'next' | 'prev' | 'up' | 'down') => {
    try {
      let nextIndex: number;
      
      switch (direction) {
        case 'next':
          nextIndex = (currentIndex + 1) % fieldRefs.length;
          break;
        case 'prev':
          nextIndex = currentIndex === 0 ? fieldRefs.length - 1 : currentIndex - 1;
          break;
        case 'down':
          nextIndex = (currentIndex + 1) % fieldRefs.length;
          break;
        case 'up':
          nextIndex = currentIndex === 0 ? fieldRefs.length - 1 : currentIndex - 1;
          break;
        default:
          return;
      }
      
      const nextRef = fieldRefs[nextIndex];
      if (nextRef.current) {
        const inputElement = nextRef.current.querySelector('input') || nextRef.current;
        if (inputElement) {
          inputElement.focus();
          if ('select' in inputElement && inputElement.select) {
            inputElement.select();
          }
        }
      }
    } catch (error) {
      console.error('주문서 키보드 네비게이션 에러:', error);
    }
  };

  // 주문서 제품 정보 키보드 네비게이션 핸들러
  const handleOrderProductKeyboardNavigation = (currentIndex: number, direction: 'next' | 'prev' | 'up' | 'down') => {
    try {
      let nextIndex: number;
      
      switch (direction) {
        case 'next':
          nextIndex = (currentIndex + 1) % orderProductFieldRefs.length;
          break;
        case 'prev':
          nextIndex = currentIndex === 0 ? orderProductFieldRefs.length - 1 : currentIndex - 1;
          break;
        case 'down':
          nextIndex = (currentIndex + 1) % orderProductFieldRefs.length;
          break;
        case 'up':
          nextIndex = currentIndex === 0 ? orderProductFieldRefs.length - 1 : currentIndex - 1;
          break;
        default:
          return;
      }
      
      const nextRef = orderProductFieldRefs[nextIndex];
      if (nextRef.current) {
        const inputElement = nextRef.current.querySelector('input') || nextRef.current;
        if (inputElement) {
          inputElement.focus();
          if ('select' in inputElement && inputElement.select) {
            inputElement.select();
          }
        }
      }
    } catch (error) {
      console.error('주문서 제품 정보 키보드 네비게이션 에러:', error);
    }
  };

  // 주문서 테이블 셀 키보드 네비게이션 핸들러
  const handleOrderTableCellKeyboardNavigation = (currentRowIndex: number, currentField: string, direction: 'next' | 'prev' | 'up' | 'down') => {
    try {
      const editableFields = ['space', 'productCode', 'details', 'widthMM', 'heightMM', 'lineDirection', 'lineLength', 'widthCount', 'quantity'];
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
      const currentRows = orders[activeTab]?.rows || [];
      if (nextRowIndex >= 0 && nextRowIndex < currentRows.length) {
        // 현재 편집 완료
        if (editingCell) {
          handleCellEdit(editingCell.rowIndex, editingCell.field, editingValue);
        }
        
        // 다음 셀을 편집 모드로 설정
        const nextRow = currentRows[nextRowIndex];
        const nextValue = (nextRow as any)[nextField] || '';
        
        // 약간의 지연을 두어 현재 편집이 완료된 후 다음 편집 모드 진입
        setTimeout(() => {
          setEditingCell({ rowIndex: nextRowIndex, field: nextField });
          setEditingValue(nextValue);
        }, 10);
      }
    } catch (error) {
      console.error('주문서 테이블 셀 키보드 네비게이션 에러:', error);
    }
  };
  const [additionalNotes, setAdditionalNotes] = useState<string>('');
  
  // 발주서 기본 정보 상태
  const [purchaseOrderName, setPurchaseOrderName] = useState<string>('');

  // 발주경로 설정 상태
  const [purchasePathSettings, setPurchasePathSettings] = useState<{[key: string]: {purchasePath: 'product' | 'option', excludeFromPurchase: boolean}}>({});

  // 수금내역 관련 상태
  const [paymentModalOpen, setPaymentModalOpen] = useState(false);
  const [selectedOrderForPayment, setSelectedOrderForPayment] = useState<any>(null);
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

  // AS접수 및 수금내역 데이터 (주문번호별 관리)
  const [asRequests, setAsRequests] = useState<{[orderId: string]: ASRequest[]}>({});
  const [paymentRecords, setPaymentRecords] = useState<{[orderId: string]: PaymentRecord[]}>({});

  // 우클릭 메뉴 상태
  const [contextMenu, setContextMenu] = useState<{
    mouseX: number;
    mouseY: number;
    order: any;
    selectedRow?: any;
  } | null>(null);

  // 블라인드 나누기 관련 상태
  const [divideModalOpen, setDivideModalOpen] = useState(false);
  const [divideType, setDivideType] = useState<'split' | 'copy'>('split');
  const [divideCount, setDivideCount] = useState(2);
  const [selectedRowForDivide, setSelectedRowForDivide] = useState<any>(null);

  // 주문서 탭 컨텍스트 메뉴 상태
  const [tabContextMenu, setTabContextMenu] = useState<{
    mouseX: number;
    mouseY: number;
    orderIndex: number;
  } | null>(null);

  // 계약 관련 상태
  const [contractListModalOpen, setContractListModalOpen] = useState(false);
  const [showOrderTemplate, setShowOrderTemplate] = useState(false);
  const [selectedContract, setSelectedContract] = useState<Contract | null>(null);

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
    setInstallerList(loadInstallers());
    loadASRequests();
    loadPaymentRecords();
    loadPurchasePathSettings();
  }, []);

  // 발주경로 설정 로드
  const loadPurchasePathSettings = async () => {
    try {
      const settings = await optionService.getPurchasePathSettings();
      setPurchasePathSettings(settings);
    } catch (error) {
      console.error('발주경로 설정 로드 실패:', error);
      setPurchasePathSettings({});
    }
  };

  // AS접수 데이터 로드
  const loadASRequests = () => {
    try {
      const data = localStorage.getItem('asRequests');
      if (data) {
        const parsedData = JSON.parse(data);
        // 기존 배열 형태 데이터를 객체 형태로 마이그레이션
        if (Array.isArray(parsedData)) {
          const migratedData: {[orderId: string]: ASRequest[]} = {};
          parsedData.forEach((request: ASRequest) => {
            if (!migratedData[request.orderNo]) {
              migratedData[request.orderNo] = [];
            }
            migratedData[request.orderNo].push(request);
          });
          setAsRequests(migratedData);
          // 마이그레이션된 데이터 저장
          localStorage.setItem('asRequests', JSON.stringify(migratedData));
        } else {
          setAsRequests(parsedData);
        }
      } else {
        setAsRequests({});
      }
    } catch (error) {
      console.error('AS접수 데이터 로드 실패:', error);
      setAsRequests({});
    }
  };

  // 수금내역 데이터 로드
  const loadPaymentRecords = () => {
    try {
      const data = localStorage.getItem('paymentRecords');
      if (data) {
        const parsedData = JSON.parse(data);
        // 기존 배열 형태 데이터를 객체 형태로 마이그레이션
        if (Array.isArray(parsedData)) {
          const migratedData: {[orderId: string]: PaymentRecord[]} = {};
          parsedData.forEach((record: PaymentRecord) => {
            if (!migratedData[record.orderNo]) {
              migratedData[record.orderNo] = [];
            }
            migratedData[record.orderNo].push(record);
          });
          setPaymentRecords(migratedData);
          // 마이그레이션된 데이터 저장
          localStorage.setItem('paymentRecords', JSON.stringify(migratedData));
        } else {
          setPaymentRecords(parsedData);
        }
      } else {
        setPaymentRecords({});
      }
    } catch (error) {
      console.error('수금내역 데이터 로드 실패:', error);
      setPaymentRecords({});
    }
  };

  // 우리회사정보 데이터 로드
  const loadCompanyInfo = async () => {
    try {
      const response = await fetch(`${API_BASE}/companyInfo`);
      if (response.ok) {
        const data = await response.json();
        if (Array.isArray(data) && data.length > 0) {
          setCompanyInfoList(data);
          // 첫 번째 회사정보를 기본값으로 설정
          if (!selectedCompanyInfo) {
            setSelectedCompanyInfo(data[0]);
          }
        }
      }
    } catch (error) {
      console.error('우리회사정보 로드 실패:', error);
    }
  };

  // 저장된 주문서 불러오기
  useEffect(() => {
    const loadSavedOrders = () => {
      try {
        const savedOrdersData = localStorage.getItem('saved_orders');
        if (savedOrdersData) {
          const parsedOrders = JSON.parse(savedOrdersData);
          setSavedOrders(parsedOrders);
        }
      } catch (error) {
        console.error('저장된 주문서 불러오기 실패:', error);
        setSavedOrders([]);
      }
    };

    loadSavedOrders();
    loadCompanyInfo(); // 우리회사정보 로드
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
    
    console.log('=== 계약 선택 디버깅 ===');
    console.log('선택된 계약:', contract);
    console.log('계약의 estimateNo:', contract.estimateNo);
    
    // 계약과 연결된 견적서 찾기
    const savedEstimates = JSON.parse(localStorage.getItem('saved_estimates') || '[]');
    const linkedEstimate = savedEstimates.find((est: any) => est.estimateNo === contract.estimateNo);
    
    console.log('저장된 견적서 목록:', savedEstimates);
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
          estimateNo: contract.estimateNo, // 견적서 번호 추가
          estimateDate: getLocalDate(),
          // 주문관리 추가 필드들 초기화
          measurementDate: '',
          installationDate: '',
          installerId: '',
          installerName: '',
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
          rows: linkedEstimate.rows?.map((item: any, index: number) => {
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
        console.log('계약 아이템으로 주문서 업데이트');
        updatedOrder.rows = contract.items?.map((item: any, index: number) => {
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
      
      // 주문서 업데이트
      const updatedOrders = [...orders];
      updatedOrders[activeTab] = updatedOrder;
      setOrders(updatedOrders);
      setIsOrderEditMode(true);
      
      console.log('=== 주문서 업데이트 완료 ===');
      console.log('업데이트된 주문서:', updatedOrder);
      console.log('주문서에 설정된 estimateNo:', updatedOrder.estimateNo);
      
      // 계약 목록 모달 닫기
      setContractListModalOpen(false);
      
      // 할인 설정 초기화 (계약서 불러오기 시)
      setDiscountAmount('');
      setDiscountRate('');
      setDiscountedTotalInput('');
      
      // 발주서 초기화 (계약서 불러오기 시)
      setVendorPurchaseOrders(prev => ({
        ...prev,
        [updatedOrder.id]: []
      }));
      
      // 성공 메시지 표시
      if (linkedEstimate) {
        setSnackbarMessage(`계약과 연결된 견적서(${contract.estimateNo})의 내용이 주문서에 불러와졌습니다. 최종견적서 정보를 확인할 수 있습니다.`);
        setSnackbarOpen(true);
      } else {
        setSnackbarMessage(`계약 내용이 주문서에 불러와졌습니다. (견적번호: ${contract.estimateNo})`);
        setSnackbarOpen(true);
      }
    }
  };

  // 고객정보 직접 입력을 위한 핸들러
  const handleCustomerInfoChange = (field: string, value: string) => {
    const updatedOrders = [...orders];
    if (updatedOrders[activeTab]) {
      updatedOrders[activeTab] = {
        ...updatedOrders[activeTab],
        [field]: value
      };
      setOrders(updatedOrders);
      
      // 주문번호가 변경되면 할인 설정 초기화
      if (field === 'estimateNo') {
        setDiscountAmount('');
        setDiscountRate('');
        setDiscountedTotalInput('');
      }
    }
  };

  // 고객저장 함수
  const handleSaveCustomer = async () => {
    console.log('=== 주문서 고객정보 저장 시작 ===');
    console.log('현재 activeTab:', activeTab);
    console.log('현재 orders 길이:', orders.length);

    if (!orders || orders.length === 0) {
      console.log('주문서 목록이 비어있습니다.');
      setSnackbarMessage('주문서가 없습니다. 먼저 주문서를 생성해주세요.');
      setSnackbarOpen(true);
      return;
    }

    if (activeTab < 0 || activeTab >= orders.length) {
      console.log('유효하지 않은 activeTab:', activeTab);
      setSnackbarMessage('유효하지 않은 주문서입니다.');
      setSnackbarOpen(true);
      return;
    }

    const activeOrder = orders[activeTab];
    if (!activeOrder) {
      console.log('activeOrder가 없습니다.');
      setSnackbarMessage('주문서 정보를 찾을 수 없습니다.');
      setSnackbarOpen(true);
      return;
    }

    const {
      customerName,
      address,
      contact,
      emergencyContact,
      projectName,
      type,
    } = activeOrder;

    console.log('고객정보 저장 시도:', { customerName, contact, address, projectName, type });

    // 고객명과 연락처 중 하나라도 있어야 함
    const hasCustomerName = customerName && customerName.trim().length > 0;
    const hasContact = contact && contact.trim().length > 0;

    console.log('고객명 존재:', hasCustomerName, '연락처 존재:', hasContact);

    if (!hasCustomerName && !hasContact) {
      console.log('고객명과 연락처가 모두 비어있습니다.');
      setSnackbarMessage('고객명 또는 연락처를 입력해주세요.');
      setSnackbarOpen(true);
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
        orderNo: activeOrder.estimateNo,
        orderDate: activeOrder.estimateDate,
        status: '주문',
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
          visitPath: '주문서에서 등록',
          updatedAt: new Date().toISOString(),
        };

        setSnackbarMessage(`기존 고객 정보가 업데이트되었습니다.${!projectExists ? ' 새 프로젝트가 추가되었습니다.' : ''}`);
        setSnackbarOpen(true);
      } else {
        // 새 고객 추가
        const newCustomer: any = {
          id:
            customers.length > 0
              ? Math.max(...customers.map((c: any) => c.id)) + 1
              : 1,
          name: customerName,
          address: address,
          tel: contact,
          emergencyTel: emergencyContact,
          visitPath: '주문서에서 등록',
          note: '',
          projects: [newProject],
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };

        customers.push(newCustomer);
        setSnackbarMessage('새로운 고객 정보가 저장되었습니다. 프로젝트 정보도 함께 추가되었습니다.');
        setSnackbarOpen(true);
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
        setSnackbarMessage('고객 정보가 저장되었지만 Firebase 동기화에 실패했습니다.');
        setSnackbarOpen(true);
      }

    } catch (error) {
      console.error('=== 주문서 고객정보 저장 실패 ===');
      console.error('Error:', error);
      setSnackbarMessage('고객정보 저장 중 오류가 발생했습니다.');
      setSnackbarOpen(true);
    }
  };

  // 고객리스트 관련 상태
  const [customerListModalOpen, setCustomerListModalOpen] = useState(false);
  const [customers, setCustomers] = useState<any[]>([]);
  const [customerSearch, setCustomerSearch] = useState('');
  const [customerOptions, setCustomerOptions] = useState<any[]>([]);

  // 고객리스트 열기 함수
  const handleOpenCustomerList = async () => {
    try {
      const customers = await getCustomerList();
      setCustomerOptions(customers);
      setCustomerSearch(''); // 검색어 초기화
        setCustomerListModalOpen(true);
    } catch (error) {
      console.error('고객리스트 로드 실패:', error);
      setSnackbarMessage('고객리스트를 불러오는데 실패했습니다. 다시 시도해주세요.');
      setSnackbarOpen(true);
    }
  };

  // 고객 선택 함수
  const handleCustomerSelect = (customer: any) => {
    const updatedOrders = [...orders];
    if (updatedOrders[activeTab]) {
      updatedOrders[activeTab] = {
        ...updatedOrders[activeTab],
        customerName: customer.name || '',
        contact: customer.tel || '',
        emergencyContact: customer.emergencyTel || '',
        address: customer.address || '',
        projectName: customer.projectName || '',
        type: customer.type || ''
      };
      setOrders(updatedOrders);
    }
    setCustomerListModalOpen(false);
    setSnackbarMessage('고객 정보가 주문서에 적용되었습니다.');
    setSnackbarOpen(true);
  };

  // 고객 검색 필터링
  const filteredCustomers = customerOptions.filter(customer => {
    const search = customerSearch.toLowerCase();
    return (
      customer.name?.toLowerCase().includes(search) ||
      customer.tel?.toLowerCase().includes(search) ||
      customer.address?.toLowerCase().includes(search) ||
      customer.projects?.some((project: any) => 
        project.projectName?.toLowerCase().includes(search)
      )
    );
  });


  // 견적관리와 동일한 주문서 작성 기능들
  const [productDialogOpen, setProductDialogOpen] = useState(false);
  const [optionDialogOpen, setOptionDialogOpen] = useState(false);
  const [optionSearchTab, setOptionSearchTab] = useState(0);
  const [optionSearch, setOptionSearch] = useState('');
  const [optionResults, setOptionResults] = useState<any[]>([]);
  const [optionSortBy, setOptionSortBy] = useState<'vendor' | 'optionName' | 'salePrice'>('vendor');
  const [optionSortOrder, setOptionSortOrder] = useState<'asc' | 'desc'>('asc');
  const [optionSortKoreanFirst, setOptionSortKoreanFirst] = useState(false);
  const [optionQuantity, setOptionQuantity] = useState(1);
  const [editOptionDialogOpen, setEditOptionDialogOpen] = useState(false);
  const [editingOption, setEditingOption] = useState<any>(null);
  const [editOptionQuantity, setEditOptionQuantity] = useState(1);
  
  // 옵션 복사 확인 다이얼로그 상태
  const [copyOptionDialogOpen, setCopyOptionDialogOpen] = useState(false);
  const [copyTargetRow, setCopyTargetRow] = useState<any>(null);
  const [copyTargetRowIndex, setCopyTargetRowIndex] = useState<number | null>(null);
  const [optionData, setOptionData] = useState<any[][]>([]);
  const [optionDataLoaded, setOptionDataLoaded] = useState(false);
  const [outputAnchorEl, setOutputAnchorEl] = useState<null | HTMLElement>(null);
  const [filterModalOpen, setFilterModalOpen] = useState(false);
  
  // 발주서 관련 상태
  const [purchaseOrderModalOpen, setPurchaseOrderModalOpen] = useState(false);
  const [selectedVendor, setSelectedVendor] = useState<string>('');
  const [modalDeliveryMethod, setModalDeliveryMethod] = useState<string>('직접배송');
  const [modalDeliveryDate, setModalDeliveryDate] = useState<string>('');
  const [purchaseOrderType, setPurchaseOrderType] = useState<'basic' | 'simple'>('basic');
  const [purchaseOrderMemo, setPurchaseOrderMemo] = useState<string>('');
  const [purchaseOrderDate, setPurchaseOrderDate] = useState<string>(getLocalDate());
  const [purchaseOrderItems, setPurchaseOrderItems] = useState<any[]>([]);
  const [vendorPurchaseOrders, setVendorPurchaseOrders] = useState<{[orderId: string]: any[]}>({});
  const [deliveryInfo, setDeliveryInfo] = useState<{[key: string]: {method: string, date: string, company: string, contact: string, address: string}}>({});
  
  // 각 거래처별 발주 정보 관리
  const [vendorPurchaseOrderInfo, setVendorPurchaseOrderInfo] = useState<{
    [orderId: string]: {
      [vendor: string]: {
        purchaseOrderDate: string;
        purchaseOrderName: string;
        deliveryMethod: string;
        deliveryDate: string;
        additionalNotes: string;
      }
    }
  }>({});
  
  // 각 거래처별 발주 상태 관리 (대기/완료)
  const [vendorPurchaseOrderStatus, setVendorPurchaseOrderStatus] = useState<{
    [orderId: string]: {
      [vendor: string]: 'pending' | 'completed'
    }
  }>({});
  
  // 견적서 출력 관련 상태
  const [showEstimateTemplate, setShowEstimateTemplate] = useState(false);
  const [selectedEstimateForPrint, setSelectedEstimateForPrint] = useState<any>(null);
  
  // 견적서 출력 핸들러
  const handleEstimatePrint = (estimate: any) => {
    setSelectedEstimateForPrint(estimate);
    setShowEstimateTemplate(true);
  };
  
  // 발주서 납품정보 추가 필드
  const [modalDeliveryCompany, setModalDeliveryCompany] = useState<string>('');
  
  // 현재 거래처의 발주 정보 가져오기
  const getCurrentVendorPurchaseOrderInfo = (vendor: string) => {
    const currentOrderId = orders[activeTab]?.id;
    if (!currentOrderId) return null;
    
    return vendorPurchaseOrderInfo[currentOrderId]?.[vendor] || {
      purchaseOrderDate: getLocalDate(),
      purchaseOrderName: convertAddressToPurchaseOrderName(orders[activeTab]?.address || ''),
      deliveryMethod: '직접배송',
      deliveryDate: getLocalDate(),
      additionalNotes: ''
    };
  };
  
  // 현재 거래처의 발주 정보 업데이트
  const updateVendorPurchaseOrderInfo = (vendor: string, field: string, value: string) => {
    const currentOrderId = orders[activeTab]?.id;
    if (!currentOrderId) return;
    
    setVendorPurchaseOrderInfo(prev => ({
      ...prev,
      [currentOrderId]: {
        ...prev[currentOrderId],
        [vendor]: {
          ...prev[currentOrderId]?.[vendor],
          [field]: value
        }
      }
    }));
  };
  
  // 현재 거래처의 발주 상태 가져오기
  const getCurrentVendorPurchaseOrderStatus = (vendor: string) => {
    const currentOrderId = orders[activeTab]?.id;
    if (!currentOrderId) return 'pending';
    
    return vendorPurchaseOrderStatus[currentOrderId]?.[vendor] || 'pending';
  };
  
  // 현재 거래처의 발주 상태 업데이트
  const updateVendorPurchaseOrderStatus = (vendor: string, status: 'pending' | 'completed') => {
    const currentOrderId = orders[activeTab]?.id;
    if (!currentOrderId) return;
    
    setVendorPurchaseOrderStatus(prev => ({
      ...prev,
      [currentOrderId]: {
        ...prev[currentOrderId],
        [vendor]: status
      }
    }));
  };
  const [modalDeliveryContact, setModalDeliveryContact] = useState<string>('');
  const [modalDeliveryAddress, setModalDeliveryAddress] = useState<string>('');
  
  // 우리회사정보 관련 상태
  const [companyInfoList, setCompanyInfoList] = useState<any[]>([]);
  const [selectedCompanyInfo, setSelectedCompanyInfo] = useState<any>(null);
  const [companyInfoModalOpen, setCompanyInfoModalOpen] = useState(false);
  

  const [showMarginSum, setShowMarginSum] = useState(false);
  const [discountAmount, setDiscountAmount] = useState('');
  const [discountRate, setDiscountRate] = useState('');
  const [discountedTotalInput, setDiscountedTotalInput] = useState('');
  // 모바일용 제품 목록 표시항목 (순번, 거래처, 공간, 제품코드, 세부내용, 가로, 세로)
  const mobileProductColumnVisibility = {
    vendor: true,
    brand: false,
    space: true,
    productCode: true,
    productType: false,
    productName: false,
    width: false,
    details: true,
    widthMM: true,
    heightMM: true,
    area: false,
    lineDir: false,
    lineLen: false,
    pleatAmount: false,
    widthCount: false,
    quantity: false,
    totalPrice: false,
    salePrice: false,
    cost: false,
    purchaseCost: false,
    margin: false,
  };

  const [columnVisibility, setColumnVisibility] = useState({
    vendor: true,        // 거래처
    brand: false,        // 브랜드
    space: true,         // 공간
    productCode: true,   // 제품코드
    productType: false,  // 제품종류
    productName: true,   // 제품명
    width: false,        // 폭
    details: true,       // 세부내용
    widthMM: true,       // 가로(mm)
    heightMM: true,      // 세로(mm)
    area: true,          // 면적(㎡)
    lineDir: true,       // 줄방향
    lineLen: true,       // 줄길이
    pleatAmount: false,  // 주름양
    widthCount: false,   // 폭수
    quantity: true,      // 수량
    totalPrice: true,    // 판매금액
    salePrice: true,     // 판매단가
    cost: true,          // 입고금액
    purchaseCost: true,  // 입고원가
    margin: true,        // 마진
  });

  // 제품검색 관련 상태 추가
  const [productSearchText, setProductSearchText] = useState('');
  const [productSearchFilters, setProductSearchFilters] = useState({
    category: '',
    vendor: '',
    brand: '',
    searchText: ''
  });
  const [productSearchResults, setProductSearchResults] = useState<any[]>([]);
  const [selectedProducts, setSelectedProducts] = useState<Set<number>>(new Set());
  const [isProductSearching, setIsProductSearching] = useState(false);

  // 제품행 선택 관련 상태 추가
  const [selectedOrderRows, setSelectedOrderRows] = useState<Set<number>>(new Set());
  const [isBulkEditMode, setIsBulkEditMode] = useState(false);
  const [selectedRowIndex, setSelectedRowIndex] = useState<number | null>(null);

  // 행 우클릭 메뉴 상태
  const [rowContextMenu, setRowContextMenu] = useState<{
    mouseX: number;
    mouseY: number;
    rowIndex: number;
    row: any;
  } | null>(null);
  // 제품 정보 수정 모달 상태
  const [editOpen, setEditOpen] = useState(false);
  const [editRowIdx, setEditRowIdx] = useState<number | null>(null);
  const [editRow, setEditRow] = useState<any>(null);
  const [userModifiedWidthCount, setUserModifiedWidthCount] = useState(false);
  const [recommendedPleatCount, setRecommendedPleatCount] = useState(0);
  const [recommendedPleatAmount, setRecommendedPleatAmount] = useState('');

  // 인라인 편집 상태
  const [editingCell, setEditingCell] = useState<{
    rowIndex: number;
    field: string;
  } | null>(null);
  const [editingValue, setEditingValue] = useState<string>('');
  const [editingCustomValue, setEditingCustomValue] = useState<string>('');

  // 공간 옵션
  const spaceOptions = [
    '거실', '안방', '중간방', '중간방2', '끝방', '주방', '드레스룸', '직접입력'
  ];

  // 줄방향 옵션
  const lineDirectionOptions = ['좌', '우', '없음'];

  // 줄길이 옵션
  const lineLengthOptions = ['90cm', '120cm', '150cm', '180cm', '210cm', '직접입력'];

  // 제품 검색에서 제품 선택 시 해당 셀에 제품을 등록하는 핸들러
  const handleProductSelectForCell = (product: any) => {
    if (selectedRowIndex === null) return;

    const currentRows = [...orders[activeTab].rows];
    const targetRow = currentRows[selectedRowIndex];
    
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
    currentRows[selectedRowIndex] = updatedRow;
    updateOrderRows(activeTab, currentRows);
    
    // 제품검색 모달 닫기
    setProductDialogOpen(false);
    setSelectedRowIndex(null);
  };

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
    
    const currentRows = orders[activeTab]?.rows || [];
    const updatedRows = [...currentRows, emptyProduct];
    updateOrderRows(activeTab, updatedRows);
    
    // 새 행으로 스크롤
    setTimeout(() => {
      const tableContainer = document.querySelector('.MuiTableContainer-root');
      if (tableContainer) {
        tableContainer.scrollTop = tableContainer.scrollHeight;
      }
    }, 100);
  };

  // 인라인 편집 핸들러들
  const handleCellClick = (rowIndex: number, field: string, value: string) => {
    // 편집 가능한 필드만 처리
    const editableFields = ['space', 'productCode', 'details', 'widthMM', 'heightMM', 'lineDirection', 'lineLength'];
    if (!editableFields.includes(field)) return;
    
    setEditingCell({ rowIndex, field });
    setEditingValue(value || '');
  };

  const handleCellEdit = (rowIndex: number, field: string, value: string) => {
    const currentRows = orders[activeTab]?.rows || [];
    const updatedRows = [...currentRows];
    
    if (updatedRows[rowIndex]) {
      const row = updatedRows[rowIndex];
      const updatedRow = { ...row, [field]: value };
      
      // 인라인 편집에서는 세부내용 자동 업데이트를 하지 않음 (편집 모달에서 처리)
      
      updatedRows[rowIndex] = updatedRow;
      
      // 줄길이 직접입력 처리
      if (field === 'lineLength' && value === '직접입력') {
        // 직접입력 모드로 설정
        updatedRows[rowIndex].customLineLength = updatedRows[rowIndex].customLineLength || '';
      }
      
      // 가로/세로 변경 시 면적 재계산
      if (field === 'widthMM' || field === 'heightMM') {
        const width = Number(updatedRows[rowIndex].widthMM) || 0;
        const height = Number(updatedRows[rowIndex].heightMM) || 0;
        if (width > 0 && height > 0) {
          const area = (width * height) / 1000000; // mm² to m²
          updatedRows[rowIndex].area = Number(area.toFixed(1));
          
          // 커튼 제품의 경우 주름 관련 계산
          const updatedRow = updatedRows[rowIndex];
          if (updatedRow.productType === '커튼' && updatedRow.curtainType && updatedRow.pleatType) {
            // 겉커튼인 경우 면적을 0으로 설정
            if (updatedRow.curtainType === '겉커튼') {
              updatedRow.area = 0;
            }
            // 속커튼 민자인 경우 주름양 계산
            else if (updatedRow.curtainType === '속커튼' && updatedRow.pleatType === '민자') {
              let pleatMultiplier = 1.4; // 기본값
              if (typeof updatedRow.pleatAmount === 'string') {
                if (updatedRow.pleatAmount.endsWith('배')) {
                  pleatMultiplier = Number(updatedRow.pleatAmount.replace('배', '')) || 1.4;
                } else {
                  pleatMultiplier = Number(updatedRow.pleatAmount) || 1.4;
                }
              } else if (typeof updatedRow.pleatAmount === 'number') {
                pleatMultiplier = updatedRow.pleatAmount;
              }
              const calculatedArea = (width / 1000) * pleatMultiplier;
              updatedRow.area = Number(calculatedArea.toFixed(1));
            }
          }
          
          // 면적이 변경되었으므로 금액도 재계산
          const quantity = Number(updatedRow.quantity) || 1;
          const areaNum = Number(updatedRow.area) || 0;
          
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
      }
      
      // 면적, 폭수, 수량 변경 시 금액 재계산
      if (field === 'area' || field === 'widthCount' || field === 'quantity') {
        const updatedRow = updatedRows[rowIndex];
        const quantity = Number(updatedRow.quantity) || 1;
        const areaNum = Number(updatedRow.area) || 0;
        
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
      
      // 가로/세로/면적 변경 시 세부내용 자동 업데이트 (블라인드 제품 제외)
      if (field === 'widthMM' || field === 'heightMM' || field === 'area') {
        const updatedRow = updatedRows[rowIndex];
        
        // 블라인드 제품의 경우 자동입력 비활성화
        if (updatedRow.productType === '블라인드') {
          // 블라인드 제품에서는 가로, 세로, 면적 정보를 세부내용에 자동으로 입력하지 않음
          // 사용자가 필요시 직접 입력할 수 있도록 함
        } else {
          const width = Number(updatedRow.widthMM) || 0;
          const height = Number(updatedRow.heightMM) || 0;
          const area = Number(updatedRow.area) || 0;
          
          if (width > 0 && height > 0 && area > 0) {
            // 기존 세부내용에서 크기 정보만 업데이트
            let details = updatedRow.details || '';
            
            // 크기 정보 패턴 찾기 및 업데이트 (가로×세로×면적)
            const sizePattern = /(\d+(?:,\d+)?)\s*×\s*(\d+(?:,\d+)?)\s*×\s*(\d+(?:\.\d+)?)/;
            const newSizeInfo = `${width.toLocaleString()} × ${height.toLocaleString()} × ${area.toFixed(1)}`;
            
            if (sizePattern.test(details)) {
              // 기존 크기 정보가 있으면 교체
              details = details.replace(sizePattern, newSizeInfo);
            } else {
              // 기존 크기 정보가 없으면 추가
              details = details ? `${details} ${newSizeInfo}` : newSizeInfo;
            }
            
            updatedRow.details = details;
          }
        }
      }
      
      // 주문서 업데이트
      const updatedOrder = { ...orders[activeTab], rows: updatedRows };
      const updatedOrders = [...orders];
      updatedOrders[activeTab] = updatedOrder;
      setOrders(updatedOrders);
    }
    
    setEditingCell(null);
    setEditingValue('');
  };

  const handleCellCancel = () => {
    setEditingCell(null);
    setEditingValue('');
  };

  const handleKeyPress = (e: React.KeyboardEvent, rowIndex: number, field: string) => {
    if (e.key === 'Enter') {
      handleCellEdit(rowIndex, field, editingValue);
    } else if (e.key === 'Escape') {
      handleCellCancel();
    }
  };

  // 간단한 인라인 편집 셀 컴포넌트
  const EditableCell = ({ 
    rowIndex, 
    field, 
    value, 
    isEditing, 
    onEdit, 
    onCancel, 
    onKeyPress
  }: {
    rowIndex: number;
    field: string;
    value: string;
    isEditing: boolean;
    onEdit: (rowIndex: number, field: string, value: string) => void;
    onCancel: () => void;
    onKeyPress: (e: React.KeyboardEvent, rowIndex: number, field: string) => void;
  }) => {
    if (isEditing) {
      return (
        <TextField
          value={editingValue}
          onChange={(e) => setEditingValue(e.target.value)}
          onBlur={() => onEdit(rowIndex, field, editingValue)}
          onKeyDown={(e) => onKeyPress(e, rowIndex, field)}
          size="small"
          sx={{
            '& .MuiInputBase-root': {
              fontSize: 'inherit',
              padding: '4px 8px'
            }
          }}
          autoFocus
        />
      );
    }

    // 일반 표시 모드
    return (
      <Box
        onClick={() => handleCellClick(rowIndex, field, value)}
        sx={{
          cursor: 'pointer',
          padding: '4px 8px',
          borderRadius: '4px',
          '&:hover': {
            backgroundColor: 'rgba(0, 0, 0, 0.04)',
            border: '1px solid rgba(0, 0, 0, 0.1)'
          }
        }}
      >
        {value || ''}
      </Box>
    );
  };

  // 제품 이동 함수들
  const moveProductUp = (productIndex: number) => {
    const currentRows = orders[activeTab]?.rows || [];
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
    
    const updatedOrders = [...orders];
    updatedOrders[activeTab].rows = newRows;
    setOrders(updatedOrders);
  };

  const moveProductDown = (productIndex: number) => {
    const currentRows = orders[activeTab]?.rows || [];
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
    
    const updatedOrders = [...orders];
    updatedOrders[activeTab].rows = newRows;
    setOrders(updatedOrders);
  };

  // 제품 그룹을 찾는 함수 (제품 + 연결된 옵션들)
  const getProductGroups = (rows: any[]) => {
    const groups: Array<{ product: any; options: any[]; startIndex: number; endIndex: number }> = [];
    let currentGroup: { product: any; options: any[]; startIndex: number; endIndex: number } | null = null;
    
    rows.forEach((row, index) => {
      if (row && row.type === 'product') {
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
      } else if (row && row.type === 'option' && currentGroup) {
        // 현재 제품에 연결된 옵션인지 확인
        if (row.productId === (currentGroup as any).product.id) {
          (currentGroup as any).options.push(row);
          (currentGroup as any).endIndex = index;
        }
      }
    });
    
    // 마지막 그룹 저장 - 실제 마지막 인덱스로 설정
    if (currentGroup) {
      // 마지막 그룹의 endIndex는 이미 올바르게 설정되어 있음 (옵션이 있으면 마지막 옵션의 인덱스, 없으면 제품의 인덱스)
      groups.push(currentGroup);
    }
    
    return groups;
  };

  // 제품 번호 가져오기 함수
  const getProductNumber = (row: any) => {
    const currentRows = orders[activeTab]?.rows || [];
    const productRows = currentRows.filter(r => r && r.type === 'product');
    const productIndex = productRows.findIndex(r => r && r.id === row.id);
    return productIndex >= 0 ? productIndex + 1 : null;
  };

  // 폭수 계산 함수
  const getPleatCount = (
    widthMM: number,
    productWidth: number,
    pleatType: string,
    curtainType: string
  ) => {
    if (curtainType !== '겉커튼') return '';
    // 제품폭이 없을때 1370으로 간주
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

    // 소수점 첫째자리 0.1 이하는 버림, 그 외 올림
    const decimal = result - Math.floor(result);
    return decimal <= 0.1 ? Math.floor(result) : Math.ceil(result);
  };

  // 주름양 계산 함수
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
      if (widthMM <= 0) return '';

      // 주름양 계산 공식- 겉커튼: (제품폭 × 폭수) ÷ 실측가로
      // 제품폭이 없을때 1370으로 간주
      const safeProductWidth = productWidth > 0 ? productWidth : 1370;
      const result = (safeProductWidth * pleatCount) / widthMM;

      // Infinity나 NaN 체크
      if (!isFinite(result) || isNaN(result)) return '';

      // 소수점 둘째자리까지
      return result ? result.toFixed(2) : '';
    }
    
    return '';
  };

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

  // 옵션 금액 계산 함수 (견적관리와 동일한 로직)
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

  // 옵션 입고금액 계산 함수 (견적관리와 동일한 로직)
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





  // 발주서용 세부내용 정리 함수
  const cleanDetailsForPurchaseOrder = (details: string, item: any): string => {
    if (!details) return '';

    let cleanedDetails = details;

    // 면적 정보 제거 (예: "면적: 12.34㎡")
    cleanedDetails = cleanedDetails.replace(/면적:\s*\d+\.?\d*\s*㎡\s*,?\s*/g, '');

    // 커튼종류 정보 제거 (예: "커튼종류: 속커튼", "커튼종류: 겉커튼")
    cleanedDetails = cleanedDetails.replace(/커튼종류:\s*[^,]+/g, '');

    // 주름배수 정보 제거 (예: "주름배수: 2배", "주름배수: 1.5배")
    cleanedDetails = cleanedDetails.replace(/주름배수:\s*[^,]+/g, '');

    // 제품등록시점의 세부내용 관련 정보 제거
    // 브랜드, 제품코드 등 제품 기본 정보 제거
    cleanedDetails = cleanedDetails.replace(/브랜드:\s*[^,]+/g, '');
    cleanedDetails = cleanedDetails.replace(/제품코드:\s*[^,]+/g, '');

    // 쉼표와 공백 정리
    cleanedDetails = cleanedDetails.replace(/,\s*,/g, ','); // 연속된 쉼표 제거
    cleanedDetails = cleanedDetails.replace(/^\s*,\s*/, ''); // 시작 부분 쉼표 제거
    cleanedDetails = cleanedDetails.replace(/\s*,\s*$/, ''); // 끝 부분 쉼표 제거
    cleanedDetails = cleanedDetails.trim();

    return cleanedDetails;
  };

  // 할인 관련 계산
  const sumTotalPrice = orders[activeTab]?.rows?.reduce((sum, row) => sum + (Number(row?.totalPrice) || 0), 0) || 0;
  const discountAmountNumber = Number(discountAmount) || 0;
  const discountedTotal = discountAmountNumber > 0 ? sumTotalPrice - discountAmountNumber : sumTotalPrice;
  
  // 마진 합계 계산 - 할인설정이 적용되면 할인후금액 기준으로 비례 계산
  const originalSumMargin = orders[activeTab]?.rows?.reduce((sum, row) => sum + (Number(row?.margin) || 0), 0) || 0;
  const sumMargin = discountAmountNumber > 0 && sumTotalPrice > 0 
    ? Math.round((originalSumMargin * discountedTotal) / sumTotalPrice)
    : originalSumMargin;



  // WINDOWSTORY 버튼 토글 핸들러 - 입고금액, 입고원가, 마진 항목 표시/숨김
  const handleToggleMarginSum = () => {
    setShowMarginSum(!showMarginSum);
    
    // WINDOWSTORY 버튼 클릭 시 입고금액, 입고원가, 마진 항목 토글
    setColumnVisibility(prev => ({
      ...prev,
      cost: !prev.cost,
      purchaseCost: !prev.purchaseCost,
      margin: !prev.margin,
    }));
  };

  // 할인금액 입력 시 할인율, 할인후금액 자동 계산
  const handleDiscountAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
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

  // 할인후금액 입력 시 할인금액, 할인율 자동 계산
  const handleDiscountedTotalChange = (e: React.ChangeEvent<HTMLInputElement>) => {
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



  // 저장된 주문서 목록 표시항목 토글 핸들러
  const handleSavedOrderColumnToggle = (field: string) => {
    setSavedOrderColumnVisibility(prev => ({
      ...prev,
      [field]: !prev[field as keyof typeof prev]
    }));
  };

  // 저장된 주문서 목록 표시항목 초기화
  const handleSavedOrderColumnReset = () => {
    setSavedOrderColumnVisibility({
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
      brand: false,
      space: true,
      productCode: true,
      productType: false,
      productName: true,
      width: false,
      details: true,
      widthMM: true,
      heightMM: true,
      area: true,
      lineDir: false,
      lineLen: false,
      pleatAmount: false,
      widthCount: false,
      quantity: true,
      totalPrice: true,
      salePrice: true,
      cost: true,
      purchaseCost: true,
      margin: true,
    });
  };

  // 제품 검색 모달 열기
  const handleProductSearch = () => {
    setProductDialogOpen(true);
  };

  // 제품검색 필터 변경 핸들러
  const handleProductSearchFilterChange = (filterType: keyof typeof productSearchFilters, value: string) => {
    let newFilters = { ...productSearchFilters, [filterType]: value };
    
    // 거래처가 변경되면 제품종류와 브랜드 필터 초기화
    if (filterType === 'vendor') {
      newFilters = { ...newFilters, category: '', brand: '' };
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
      newFilters = { ...newFilters, brand: '' };
    }

    setProductSearchFilters(newFilters);
    
    // 즉시 검색 실행
    setTimeout(() => {
      performProductSearch(newFilters);
    }, 0);
  };

  // 제품검색 실행 함수
  const performProductSearch = (filters: typeof productSearchFilters) => {
    // 거래처가 선택되지 않았으면 검색하지 않음
    if (!filters.vendor) {
      setProductSearchResults([]);
      return;
    }

    let filtered = productOptions;

    if (filters.vendor) {
      filtered = filtered.filter(p => p.vendorName === filters.vendor);
    }
    if (filters.category) {
      filtered = filtered.filter(p => p.category === filters.category);
    }
    if (filters.brand) {
      filtered = filtered.filter(p => p.brand === filters.brand);
    }
    if (filters.searchText) {
      const searchText = filters.searchText.trim().toLowerCase();
      if (searchText) {
        const searchWords = searchText.split(/\s+/).filter(word => word.length > 0);
        filtered = filtered.filter(p => {
          return searchWords.every(searchWord => {
            const searchLower = searchWord.toLowerCase();
            return (
              p.vendorName?.toLowerCase().includes(searchLower) ||
              p.brand?.toLowerCase().includes(searchLower) ||
              p.category?.toLowerCase().includes(searchLower) ||
              p.productName?.toLowerCase().includes(searchLower) ||
              p.productCode?.toLowerCase().includes(searchLower) ||
              p.details?.toLowerCase().includes(searchLower)
            );
          });
        });
      }
    }

    setProductSearchResults(filtered);
  };

  // 제품검색 텍스트 변경 핸들러
  const handleProductSearchTextChange = (value: string) => {
    setProductSearchText(value);
    const newFilters = { ...productSearchFilters, searchText: value };
    setProductSearchFilters(newFilters);
    performProductSearch(newFilters);
  };

  // 제품검색 필터 초기화
  const handleProductSearchFilterReset = () => {
    const resetFilters = {
      category: '',
      vendor: '',
      brand: '',
      searchText: ''
    };
    setProductSearchFilters(resetFilters);
    setProductSearchText('');
    setProductSearchResults([]); // 거래처 선택 전까지는 빈 배열
    setSelectedProducts(new Set());
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
  // 제품행 선택 관련 핸들러들
  const handleBulkEditModeToggle = () => {
    setIsBulkEditMode(!isBulkEditMode);
    if (isBulkEditMode) {
      // 일괄 변경 모드 종료 시 선택 초기화
      setSelectedOrderRows(new Set());
      setSelectedRowIndex(null);
    } else {
      // 일괄 변경 모드 시작 시 단일 선택 초기화
      setSelectedRowIndex(null);
    }
  };

  const handleOrderRowSelection = (rowIndex: number) => {
    if (!isBulkEditMode) return;
    
    setSelectedOrderRows(prev => {
      const newSet = new Set(prev);
      if (newSet.has(rowIndex)) {
        newSet.delete(rowIndex);
      } else {
        newSet.add(rowIndex);
      }
      return newSet;
    });
  };

  // 일반 모드에서 행 선택 핸들러
  const handleRowClick = (rowIndex: number) => {
    if (isBulkEditMode) {
      handleOrderRowSelection(rowIndex);
    } else {
      // 일반 모드에서는 단일 행 선택
      setSelectedRowIndex(selectedRowIndex === rowIndex ? null : rowIndex);
    }
  };

  const handleSelectAllOrderRows = () => {
    if (!isBulkEditMode) return;
    
    const currentRows = orders[activeTab]?.rows || [];
    if (selectedOrderRows.size === currentRows.length) {
      setSelectedOrderRows(new Set());
    } else {
      setSelectedOrderRows(new Set(currentRows.map((_, index) => index)));
    }
  };

  const handleDeleteSelectedOrderRows = () => {
    if (selectedOrderRows.size === 0) {
      setSnackbarMessage('삭제할 제품행을 선택해주세요.');
      setSnackbarOpen(true);
      return;
    }

    const currentRows = orders[activeTab]?.rows || [];
    const updatedRows = currentRows.filter((_, index) => !selectedOrderRows.has(index));
    
    const updatedOrders = [...orders];
    updatedOrders[activeTab] = {
      ...updatedOrders[activeTab],
      rows: updatedRows
    };
    setOrders(updatedOrders);
    
    setSelectedOrderRows(new Set());
    
    // 주문서에 아무것도 없으면 할인 설정 초기화
    if (updatedRows.length === 0) {
      setDiscountAmount('');
      setDiscountRate('');
      setDiscountedTotalInput('');
    }
    
    setSnackbarMessage(`${selectedOrderRows.size}개의 제품행이 삭제되었습니다.`);
    setSnackbarOpen(true);
  };

  // 전체 선택/해제 핸들러
  const handleSelectAllProducts = () => {
    if (selectedProducts.size === productSearchResults.length) {
      setSelectedProducts(new Set());
    } else {
      setSelectedProducts(new Set(productSearchResults.map(p => p.id)));
    }
  };

  // 선택된 제품들을 주문서에 추가
  const handleAddSelectedProducts = () => {
    if (selectedProducts.size === 0) {
      alert('추가할 제품을 선택해주세요.');
      return;
    }

    const selectedProductList = productSearchResults.filter(p => selectedProducts.has(p.id));
    
    // 주문서 rows에 추가
    const newRows = selectedProductList.map(product => ({
      id: Date.now() + Math.random(),
      type: 'product' as const,
      vendor: product.vendorName || '',
      brand: product.brand || '',
      space: '',
      productType: product.category || '',
      curtainType: product.category === '커튼' 
        ? (product.insideOutside === '속' ? '속커튼' : '겉커튼') 
        : '',
      pleatType: product.category === '커튼' 
        ? (product.insideOutside === '속' ? '나비' : '민자') 
        : '',
      productName: product.productName || '',
      width: product.width || '',
      details: product.details || '',
      widthMM: 0,
      heightMM: 0,
      area: 0,
      lineDir: '',
      lineLen: 0,
      pleatAmount: product.category === '커튼' && product.insideOutside === '속' ? '1.8~2' : '',
      widthCount: 0,
      quantity: 1,
      totalPrice: product.salePrice || 0,
      salePrice: product.salePrice || 0,
      cost: product.purchaseCost || 0,
      purchaseCost: product.purchaseCost || 0,
      margin: (product.salePrice || 0) - (product.purchaseCost || 0),
      note: '',
      productCode: product.productCode || '',
      largePlainPrice: product.largePlainPrice ?? 0,
      largePlainCost: product.largePlainCost ?? 0,
    }));

    // 현재 주문서 rows에 추가
    const updatedOrders = [...orders];
    updatedOrders[activeTab].rows = [...updatedOrders[activeTab].rows, ...newRows];
    setOrders(updatedOrders);
    
    setSelectedProducts(new Set());
    setSnackbarMessage(`${selectedProductList.length}개의 제품이 주문서에 추가되었습니다.`);
    setSnackbarOpen(true);
  };

  // 단일 제품을 주문서에 추가하고 모달 닫기
  const handleAddSingleProduct = (product: any) => {
    // 주문서 rows에 추가
    const newRow = {
      id: Date.now() + Math.random(),
      type: 'product' as const,
      vendor: product.vendorName || '',
      brand: product.brand || '',
      space: '',
      productType: product.category || '',
      curtainType: product.category === '커튼' 
        ? (product.insideOutside === '속' ? '속커튼' : '겉커튼') 
        : '',
      pleatType: product.category === '커튼' 
        ? (product.insideOutside === '속' ? '나비' : '민자') 
        : '',
      productName: product.productName || '',
      width: product.width || '',
      details: product.details || '',
      widthMM: 0,
      heightMM: 0,
      area: 0,
      lineDir: '',
      lineLen: 0,
      pleatAmount: product.category === '커튼' && product.insideOutside === '속' ? '1.8~2' : '',
      widthCount: 0,
      quantity: 1,
      totalPrice: product.salePrice || 0,
      salePrice: product.salePrice || 0,
      cost: product.purchaseCost || 0,
      purchaseCost: product.purchaseCost || 0,
      margin: (product.salePrice || 0) - (product.purchaseCost || 0),
      note: '',
      productCode: product.productCode || '',
      largePlainPrice: product.largePlainPrice ?? 0,
      largePlainCost: product.largePlainCost ?? 0,
    };

    // 현재 주문서 rows에 추가
    const updatedOrders = [...orders];
    updatedOrders[activeTab].rows = [...updatedOrders[activeTab].rows, newRow];
    setOrders(updatedOrders);
    
    // 모달 닫기
    setProductDialogOpen(false);
    setProductSearchText('');
    handleProductSearchFilterReset();
    
    setSnackbarMessage(`${product.productName}이(가) 주문서에 추가되었습니다.`);
    setSnackbarOpen(true);
  };

  // 선택된 행 편집 핸들러
  const handleEditRow = (rowIndex: number) => {
    const currentRows = orders[activeTab]?.rows || [];
    const originalIndex = rowIndex;
    const rowData = { ...currentRows[originalIndex] };
    
    // 편집 모달이 열릴 때 추천폭수 상태 초기화
    setRecommendedPleatCount(0);
    setRecommendedPleatAmount('');

    // 사용자 수정 여부를 판단하는 로컬 변수
    let isUserModified = false;

    // 겉커튼에서 기존 폭수가 있는 경우 사용자 수정 여부 판단
    if (rowData.productType === '커튼' && rowData.curtainType === '겉커튼' && rowData.pleatType && rowData.widthMM && rowData.widthCount) {
      const product = productOptions.find(p => p.productCode === rowData.productCode);
      const widthMM = Number(rowData.widthMM) || 0;
      const productWidth = product ? Number(product.width) || 0 : 0;
      const currentWidthCount = Number(rowData.widthCount) || 0;
      
      if (widthMM > 0) {
        const recommendedCount = getPleatCount(widthMM, productWidth, rowData.pleatType, '겉커튼');
        const recommendedCountNum = Number(recommendedCount) || 0;
        
        // 기존 폭수가 추천폭수와 일치하면 사용자가 수정하지 않은 것으로 간주
        if (currentWidthCount === recommendedCountNum) {
          isUserModified = false;
        } else {
          isUserModified = true;
        }
      }
    } else {
      // 커튼이 아니거나 폭수가 없는 경우 기본값으로 설정
      isUserModified = false;
    }

    // 상태 업데이트
    setUserModifiedWidthCount(isUserModified);

    // 커튼 제품이고 커튼타입, 주름타입이 이미 설정되어 있다면 바로 계산
    if (rowData.productType === '커튼' && rowData.curtainType && rowData.pleatType && rowData.widthMM) {
      const product = productOptions.find(p => p.productCode === rowData.productCode);
      const widthMM = Number(rowData.widthMM) || 0;
      const pleatTypeVal = rowData.pleatType;
      const curtainTypeVal = rowData.curtainType;
      const productWidth = product ? Number(product.width) || 0 : 0;

      // 겉커튼일 때 추천 폭수 계산
      if (curtainTypeVal === '겉커튼' && widthMM > 0) {
        const userInputWidthCount = Number(rowData.widthCount) || 0;
        let finalWidthCount = userInputWidthCount;

        // 사용자가 폭수를 입력하지 않았거나 사용자가 수정하지 않은 상태에서만 추천 폭수 계산
        if (userInputWidthCount === 0 || !isUserModified) {
          let pleatCount: number | string = 0;
          
          if (pleatTypeVal === '민자' || pleatTypeVal === '나비') {
            pleatCount = getPleatCount(
              widthMM,
              productWidth,
              pleatTypeVal,
              curtainTypeVal
            );
          }
          
          finalWidthCount = Number(pleatCount) || 0;
          
          // 사용자가 수정하지 않은 경우에만 rowData를 업데이트
          if (!isUserModified) {
            rowData.widthCount = finalWidthCount;
            rowData.pleatCount = finalWidthCount;
          }
          
          // 추천폭수 상태 업데이트
          setRecommendedPleatCount(finalWidthCount);
          
          // 추천 주름양 계산
          if (finalWidthCount > 0) {
            let calculatedPleatAmount = '';
            if (pleatTypeVal === '민자' || pleatTypeVal === '나비') {
              calculatedPleatAmount = calculatePleatAmountForGgeotCurtain(widthMM, finalWidthCount, productWidth);
            }
            setRecommendedPleatAmount(calculatedPleatAmount);
          }
        } else {
          // 사용자가 수정한 경우 추천폭수는 현재 값으로 설정
          setRecommendedPleatCount(userInputWidthCount);
          setRecommendedPleatAmount('');
        }

        // 주름양 계산 (사용자 입력값 기준)
        const currentWidthCount = Number(rowData.widthCount) || 0;
        if (currentWidthCount > 0) {
          let calculatedPleatAmount = '';
          if (pleatTypeVal === '민자' || pleatTypeVal === '나비') {
            calculatedPleatAmount = calculatePleatAmountForGgeotCurtain(widthMM, currentWidthCount, productWidth);
          }
          rowData.pleatAmount = calculatedPleatAmount;
        }
      }
      // 속커튼 나비주름일 때
      else if (curtainTypeVal === '속커튼' && pleatTypeVal === '나비') {
        if (widthMM > 0) {
          const area = widthMM / 1000; // m²
          rowData.area = area;
          rowData.pleatAmount = '1.8~2';
          rowData.widthCount = 0;
          rowData.pleatCount = 0;
        }
      }
      // 속커튼 민자일 때
      else if (curtainTypeVal === '속커튼' && pleatTypeVal === '민자') {
        if (widthMM > 0) {
          // 주름양 배수 가져오기 (기본값 1.4배)
          const pleatMultiplier = Number(rowData.pleatMultiplier?.replace('배', '')) || 1.4;
          const area = (widthMM / 1000) * pleatMultiplier; // m²
          rowData.area = area;
          // 주름양은 선택된 배수값을 그대로 사용
          rowData.pleatAmount = rowData.pleatMultiplier || '1.4배';
        }
      }
    }

    // space 필드의 공백 제거 (중간방 2 -> 중간방2)
    if (rowData.space && rowData.space.includes(' ')) {
      rowData.space = rowData.space.replace(/\s+/g, '');
    }

    setEditRowIdx(originalIndex);
    setEditRow(rowData);
    setEditOpen(true);
  };

  // 선택된 행 복사 핸들러
  const handleCopyRow = (rowIndex: number) => {
    const currentRows = orders[activeTab]?.rows || [];
    const rowToCopy = currentRows[rowIndex];
    
    if (rowToCopy && rowToCopy.type === 'product') {
      // 해당 제품 다음에 있는 옵션들 찾기
      const nextIndex = rowIndex + 1;
      const hasOptions = nextIndex < currentRows.length && currentRows[nextIndex].type === 'option';
      
      if (hasOptions) {
        // 옵션이 있는 경우 확인 다이얼로그 표시
        setCopyTargetRow(rowToCopy);
        setCopyTargetRowIndex(rowIndex);
        setCopyOptionDialogOpen(true);
      } else {
        // 옵션이 없는 경우 바로 복사
        copyProductWithoutOptions(rowToCopy, rowIndex);
      }
    } else if (rowToCopy) {
      // 제품이 아닌 경우 바로 복사
      const copiedRow = {
        ...rowToCopy,
        id: Date.now() + Math.random(),
      };
      
      const updatedOrders = [...orders];
      updatedOrders[activeTab].rows = [...currentRows, copiedRow];
      setOrders(updatedOrders);
      
      setSnackbarMessage(`${rowIndex + 1}번 행이 복사되었습니다.`);
      setSnackbarOpen(true);
    }
  };

  // 제품만 복사 (옵션 제외)
  const copyProductWithoutOptions = (rowToCopy: any, rowIndex: number) => {
    const currentRows = orders[activeTab]?.rows || [];
    const copiedRow = {
      ...rowToCopy,
      id: Date.now() + Math.random(),
    };
    
    const updatedOrders = [...orders];
    updatedOrders[activeTab].rows = [...currentRows, copiedRow];
    setOrders(updatedOrders);
    
    setSnackbarMessage(`${rowIndex + 1}번 제품이 복사되었습니다. (옵션 제외)`);
    setSnackbarOpen(true);
  };

  // 제품과 옵션 함께 복사
  const copyProductWithOptions = (rowToCopy: any, rowIndex: number) => {
    const currentRows = orders[activeTab]?.rows || [];
    const copiedRows = [];
    
    // 제품 복사
    const copiedProduct = {
      ...rowToCopy,
      id: Date.now() + Math.random(),
    };
    copiedRows.push(copiedProduct);
    
    // 해당 제품의 옵션들 찾아서 복사
    let nextIndex = rowIndex + 1;
    while (nextIndex < currentRows.length && currentRows[nextIndex].type === 'option') {
      const optionRow = currentRows[nextIndex];
      const copiedOption = {
        ...optionRow,
        id: Date.now() + Math.random() + nextIndex,
      };
      copiedRows.push(copiedOption);
      nextIndex++;
    }
    
    const updatedOrders = [...orders];
    updatedOrders[activeTab].rows = [...currentRows, ...copiedRows];
    setOrders(updatedOrders);
    
    const optionCount = copiedRows.length - 1;
    setSnackbarMessage(`${rowIndex + 1}번 제품과 ${optionCount}개의 옵션이 복사되었습니다.`);
    setSnackbarOpen(true);
  };

  // 선택된 행 삭제 핸들러
  const handleDeleteRow = (rowIndex: number) => {
    const currentRows = orders[activeTab]?.rows || [];
    const updatedRows = currentRows.filter((_, index) => index !== rowIndex);
    
    const updatedOrders = [...orders];
    updatedOrders[activeTab] = {
      ...updatedOrders[activeTab],
      rows: updatedRows
    };
    setOrders(updatedOrders);
    
    // 행 삭제 후 모든 제품의 세부내용 자동 업데이트
    const updatedRowsWithContent = updatedRows.map((row) => {
      if (row.type === 'product') {
        return {
          ...row,
          details: updateDetailsInRealTime(row)
        };
      }
      return row;
    });
    
    updatedOrders[activeTab].rows = updatedRowsWithContent;
    setOrders(updatedOrders);
    
    // 선택 상태 초기화
    setSelectedRowIndex(null);
    setSelectedOrderRows(new Set());
    
    // 주문서에 아무것도 없으면 할인 설정 초기화
    if (updatedRows.length === 0) {
      setDiscountAmount('');
      setDiscountRate('');
      setDiscountedTotalInput('');
    }
    
    setSnackbarMessage(`${rowIndex + 1}번 행이 삭제되었습니다.`);
    setSnackbarOpen(true);
  };
  // 제품검색 모달이 열릴 때 초기 검색 실행
  useEffect(() => {
    if (productDialogOpen) {
      // 모달이 열릴 때 필터 초기화하고 검색 결과는 비움
      const initialFilters = {
        category: '',
        vendor: '',
        brand: '',
        searchText: ''
      };
      setProductSearchFilters(initialFilters);
      setProductSearchText('');
      setProductSearchResults([]); // 거래처 선택 전까지는 빈 배열
      setSelectedProducts(new Set());
    }
  }, [productDialogOpen, productOptions]);

  // 옵션 추가 모달 열기
  const handleOpenOptionDialog = () => {
    // 현재 주문서에 제품이 있는지 확인
    const rows = orders[activeTab]?.rows || [];
    const productRows = rows.filter(row => row && row.type === 'product');
    
    if (productRows.length === 0) {
      setSnackbarMessage('옵션을 추가하려면 먼저 제품을 선택해주세요.');
      setSnackbarOpen(true);
      return;
    }
    
    setOptionDialogOpen(true);
  };

  // 레일추가 핸들러 함수
  const handleAddRailOption = () => {
    // 1. 현재 주문서의 제품 행만 추출
    const rows = orders[activeTab]?.rows || [];
    const productRows = rows.filter(row => row && row.type === 'product');
    if (productRows.length === 0) {
      setSnackbarMessage('추가할 제품이 없습니다.');
      setSnackbarOpen(true);
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
      setSnackbarMessage('적용 가능한 제품(가로값 입력된 커튼)이 없습니다.');
      setSnackbarOpen(true);
      return;
    }

    // 3. 이미 주문서에 레일 옵션이 있으면 중복 추가 방지
    const alreadyExists = rows.some(
      row => row.type === 'option' && row.optionLabel === '레일'
    );
    if (alreadyExists) {
      setSnackbarMessage('이미 레일 옵션이 추가되어 있습니다.');
      setSnackbarOpen(true);
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
    const newOptionRow = {
      id: Date.now() + Math.random(),
      type: 'option' as const,
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
      purchaseCost: totalRailCount > 0 ? Math.round(totalPurchaseCost / totalRailCount) : 0, // 평균 입고단가
      margin: 0 - totalPurchaseCost, // 마진 (판매금액 - 입고금액)
      note: '', // 추가된 note 속성
      optionLabel: '레일',
      largePlainPrice: 0,
      largePlainCost: 0,
    };

    // 레일 옵션을 최하단에 추가
    const updatedRows = [...rows, newOptionRow];
    const updatedOrders = [...orders];
    updatedOrders[activeTab].rows = updatedRows;
    setOrders(updatedOrders);
    
    setSnackbarMessage(
      `레일 옵션이 ${totalRailCount}개 추가되었습니다.\n${detailsArr.join(', ')}\n입고금액: ${totalPurchaseCost.toLocaleString()}원`
    );
    setSnackbarOpen(true);
  };

  // 옵션 타입 매핑
  const optionTypeMap = ['커튼', '블라인드', '커튼전동', '블라인드전동', '헌터', '시공', '기타'];

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

  // 옵션 데이터 로드 함수
  function loadOptions() {
    return optionData;
  }

  // 옵션 정렬 함수
  const sortOptions = (options: any[]) => {
    if (!options || options.length === 0) return [];

    let sorted = [...options];

    // 정렬 기준에 따라 정렬
    switch (optionSortBy) {
      case 'vendor':
        sorted.sort((a, b) => {
          const aVendor = a.vendor || '';
          const bVendor = b.vendor || '';
          
          if (optionSortKoreanFirst) {
            // 한글 우선 정렬
            const aIsKorean = /[가-힣]/.test(aVendor);
            const bIsKorean = /[가-힣]/.test(bVendor);
            
            if (aIsKorean && !bIsKorean) return -1;
            if (!aIsKorean && bIsKorean) return 1;
          }
          
          return optionSortOrder === 'asc' 
            ? aVendor.localeCompare(bVendor, 'ko') 
            : bVendor.localeCompare(aVendor, 'ko');
        });
        break;
      case 'optionName':
        sorted.sort((a, b) => {
          const aName = a.optionName || '';
          const bName = b.optionName || '';
          return optionSortOrder === 'asc' 
            ? aName.localeCompare(bName, 'ko') 
            : bName.localeCompare(aName, 'ko');
        });
        break;
      case 'salePrice':
        sorted.sort((a, b) => {
          const aPrice = a.salePrice || 0;
          const bPrice = b.salePrice || 0;
          return optionSortOrder === 'asc' ? aPrice - bPrice : bPrice - aPrice;
        });
        break;
    }

    return sorted;
  };

  // 옵션 데이터 초기 로드
  useEffect(() => {
    const loadOptionData = async () => {
      if (!optionDataLoaded) {
        console.log('옵션 데이터 초기 로드 시작');
        const options = await loadOptionsFromFirebase();
        setOptionData(options);
        setOptionDataLoaded(true);
        console.log('옵션 데이터 로드 완료:', options);
      }
    };
    
    loadOptionData();
  }, [optionDataLoaded]);

  // 주문서 탭 변경 시 해당 주문서의 발주서 로드
  useEffect(() => {
    const currentOrder = orders[activeTab];
    if (currentOrder && currentOrder.id) {
      // 현재 주문서의 발주서가 있는지 확인하고 로드
      // 발주서는 이미 vendorPurchaseOrders 상태에 저장되어 있으므로 별도 로드 불필요
      console.log(`주문서 ${currentOrder.estimateNo}의 발주서 로드됨`);
    }
  }, [activeTab, orders]);



  // 옵션 검색 초기화
  useEffect(() => {
    if (optionDialogOpen) {
      handleOptionSearch(optionTypeMap[optionSearchTab]);
    }
  }, [optionDialogOpen, optionSearchTab]);
  // 정렬 설정 변경 시 옵션 목록 재정렬
  useEffect(() => {
    if (optionDialogOpen && optionDataLoaded) {
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
  }, [optionSortBy, optionSortOrder, optionSortKoreanFirst, optionDialogOpen, optionDataLoaded]);

  // 옵션 검색 핸들러
  const handleOptionSearch = (optionType: string) => {
    setOptionSearch('');
    const typeIndex = optionTypeMap.indexOf(optionType);
    setOptionSearchTab(typeIndex >= 0 ? typeIndex : 0);
    const all: any[] = loadOptions();
    const targetOptions = all[typeIndex >= 0 ? typeIndex : 0] || [];
    const sortedOptions = sortOptions(targetOptions);
    setOptionResults(sortedOptions);

    console.log(`옵션 탭 클릭: ${optionType}, 옵션 개수: ${sortedOptions.length}`);
  };

  // 옵션 검색 입력 핸들러
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

  // 옵션을 주문서에 추가하는 핸들러 (견적관리와 동일한 로직 적용)
  const handleAddOptionToOrder = (option: any) => {
    if (!option) return;

    const currentRows = orders[activeTab]?.rows || [];
    let insertIndex = currentRows.length; // 기본적으로 마지막에 추가

    // 제품이 선택된 경우 해당 제품 다음에 추가
    if (selectedRowIndex !== null) {
      insertIndex = selectedRowIndex + 1;
      // Move past any existing options for the selected product.
      while (
        insertIndex < currentRows.length &&
        currentRows[insertIndex].type === 'option'
      ) {
        insertIndex++;
      }
    }

    // 모든 옵션의 수량을 자동으로 계산
    let finalQuantity = 1;
    const optionName = option.optionName || '';
    
    // 커튼시공인 경우 커튼 제품의 수량 합계
    if (optionName.includes('커튼시공') || optionName.includes('커튼 시공')) {
      const curtainQuantity = currentRows
        .filter(row => row.type === 'product' && 
                      (row.productType?.includes('커튼') || 
                       row.productName?.includes('커튼') ||
                       row.curtainType?.includes('커튼')))
        .reduce((sum, row) => sum + (row?.quantity || 1), 0);
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
        .reduce((sum, row) => sum + (row?.quantity || 1), 0);
      finalQuantity = blindQuantity > 0 ? blindQuantity : optionQuantity;
      console.log('블라인드시공 자동 수량 설정:', blindQuantity);
    }
    // 레일 관련 옵션인 경우 레일 제품의 수량 합계
    else if (optionName.includes('레일') || option.details?.includes('레일')) {
      const railQuantity = currentRows
        .filter(row => row.type === 'product' && 
                      (row.productType?.includes('레일') || 
                       row.productName?.includes('레일')))
        .reduce((sum, row) => sum + (row?.quantity || 1), 0);
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
      finalQuantity = optionTypeMap[optionSearchTab] === '시공' ? optionQuantity : 1;
      console.log('기타 옵션 수량 설정:', finalQuantity);
    }

    // 모든 옵션의 세부내용에 자동 계산 정보 추가
    let optionDetails = option.details || '';
    
    // 커튼시공 세부내용에 자동 계산 정보 추가
    if (optionName.includes('커튼시공') || optionName.includes('커튼 시공')) {
      const curtainQuantity = currentRows
        .filter(row => row.type === 'product' && 
                      (row.productType?.includes('커튼') || 
                       row.productName?.includes('커튼') ||
                       row.curtainType?.includes('커튼')))
        .reduce((sum, row) => sum + (row?.quantity || 1), 0);
      const autoCalcPattern = /\(커튼 \d+조\)/;
      if (!autoCalcPattern.test(optionDetails)) {
        optionDetails = `${option.details || ''} (커튼 ${curtainQuantity}조)`;
      }
    }
    // 블라인드시공 세부내용에 자동 계산 정보 추가
    else if (optionName.includes('블라인드시공') || optionName.includes('블라인드 시공')) {
      const blindQuantity = currentRows
        .filter(row => row.type === 'product' && 
                      (row.productType?.includes('블라인드') || 
                       row.productName?.includes('블라인드') ||
                       row.curtainType?.includes('블라인드')))
        .reduce((sum, row) => sum + (row?.quantity || 1), 0);
      const autoCalcPattern = /\(블라인드 \d+개\)/;
      if (!autoCalcPattern.test(optionDetails)) {
        optionDetails = `${option.details || ''} (블라인드 ${blindQuantity}개)`;
      }
    }
    // 레일 옵션 세부내용에 자동 계산 정보 추가
    else if (optionName.includes('레일') || option.details?.includes('레일')) {
      const railQuantity = currentRows
        .filter(row => row.type === 'product' && 
                      (row.productType?.includes('레일') || 
                       row.productName?.includes('레일')))
        .reduce((sum, row) => sum + (row?.quantity || 1), 0);
      const autoCalcPattern = /\(레일 \d+개\)/;
      if (!autoCalcPattern.test(optionDetails)) {
        optionDetails = `${option.details || ''} (레일 ${railQuantity}개)`;
      }
    }
    // 전동커튼시공 옵션은 자동 계산 정보 추가하지 않음 (기본값 1)
    else if (optionName.includes('전동커튼시공') || optionName.includes('전동커튼 시공')) {
      // 전동커튼시공은 자동 계산하지 않고 기본값 1 사용
      console.log('전동커튼시공 옵션 - 자동 계산 정보 추가하지 않음');
    }

    // 해당 제품 정보 찾기 (옵션 계산을 위해)
    const targetProduct = selectedRowIndex !== null ? currentRows[selectedRowIndex] : null;
    
    // 옵션 금액 계산 (견적관리와 동일한 로직)
    const calculatedTotalPrice = getOptionAmount({
      ...option,
      quantity: finalQuantity
    }, targetProduct || {});
    
    const calculatedCost = getOptionPurchaseAmount({
      ...option,
      quantity: finalQuantity
    }, targetProduct || {});

    const newOptionRow = {
      id: Date.now() + Math.random(),
      type: 'option' as const,
      productId: selectedRowIndex !== null ? currentRows[selectedRowIndex].id : undefined, // 제품과 연결하는 productId 추가
      vendor: option.vendor || '',
      brand: option.brand || '',
      space: '',
      productType: option.optionType || '',
      optionType: option.optionType || optionTypeMap[optionSearchTab] || '기타옵션', // optionType 필드 추가 (탭 정보 활용)
      curtainType: '',
      pleatType: '',
      productName: option.optionName,
      width: '',
      details: optionDetails, // 자동 계산 정보가 포함된 세부내용
      widthMM: 0,
      heightMM: 0,
      area: 0,
      lineDir: '',
      lineLen: 0,
      pleatAmount: 0,
      widthCount: 0,
      quantity: finalQuantity, // 자동 계산된 수량
      totalPrice: calculatedTotalPrice, // 새로운 계산 함수 사용
      salePrice: option.salePrice || 0, // 판매단가
      cost: calculatedCost, // 새로운 계산 함수 사용
      purchaseCost: option.purchaseCost || 0, // 원가단가
      margin: calculatedTotalPrice - calculatedCost, // 새로운 계산 함수 사용
      note: option.note || '추가', // 기본값을 '추가'로 설정하여 금액 계산이 되도록 함
      productCode: '',
      largePlainPrice: 0,
      largePlainCost: 0,
      optionLabel: option.optionName, // 옵션명을 optionLabel로 설정
      isManualQuantity: false // 기본적으로 자동 계산
    };

    const updatedRows = [...currentRows];
    updatedRows.splice(insertIndex, 0, newOptionRow);
    
    const updatedOrders = [...orders];
    updatedOrders[activeTab].rows = updatedRows;
    setOrders(updatedOrders);
    
    // 옵션 추가 후 관련 제품들의 세부내용 자동 업데이트
    const updatedRowsWithContent = updatedRows.map((row, index) => {
      if (row.type === 'product') {
        return {
          ...row,
          details: updateDetailsInRealTime(row)
        };
      }
      return row;
    });
    
    updatedOrders[activeTab].rows = updatedRowsWithContent;
    setOrders(updatedOrders);
    
    setSnackbarMessage(`${option.optionName} 옵션이 추가되었습니다.`);
    setSnackbarOpen(true);
  };

  // 옵션 컨텍스트 메뉴 핸들러
  const handleOptionContextMenu = (e: React.MouseEvent, option: any) => {
    e.preventDefault();
    if (optionTypeMap[optionSearchTab] === '시공') {
      setEditingOption(option);
      setEditOptionQuantity(optionQuantity);
      setEditOptionDialogOpen(true);
    }
  };

  // 시공 옵션 수정 취소 핸들러
  const handleCancelEditOption = () => {
    setEditOptionDialogOpen(false);
    setEditingOption(null);
  };

  // 시공 옵션 수정 확인 핸들러 (견적관리와 동일한 로직 적용)
  const handleConfirmEditOption = () => {
    if (editingOption) {
      // 기존 시공 옵션의 수량을 수정하는 로직
      const currentRows = orders[activeTab]?.rows || [];
      const updatedRows = currentRows.map(row => {
        if (row.type === 'option' && row.productName === editingOption.optionName) {
          // 수량에 따른 세부내용 업데이트
          let updatedDetails = row.details || '';
          const optionName = editingOption.optionName || '';
          
          // 커튼시공 세부내용 업데이트
          if (optionName.includes('커튼시공') || optionName.includes('커튼 시공')) {
            const autoCalcPattern = /\(커튼 \d+조\)/;
            if (autoCalcPattern.test(updatedDetails)) {
              updatedDetails = updatedDetails.replace(autoCalcPattern, `(커튼 ${editOptionQuantity}조)`);
            } else {
              updatedDetails = `${updatedDetails} (커튼 ${editOptionQuantity}조)`;
            }
          }
          // 블라인드시공 세부내용 업데이트
          else if (optionName.includes('블라인드시공') || optionName.includes('블라인드 시공')) {
            const autoCalcPattern = /\(블라인드 \d+개\)/;
            if (autoCalcPattern.test(updatedDetails)) {
              updatedDetails = updatedDetails.replace(autoCalcPattern, `(블라인드 ${editOptionQuantity}개)`);
            } else {
              updatedDetails = `${updatedDetails} (블라인드 ${editOptionQuantity}개)`;
            }
          }
          // 레일 옵션 세부내용 업데이트
          else if (optionName.includes('레일') || editingOption.details?.includes('레일')) {
            const autoCalcPattern = /\(레일 \d+개\)/;
            if (autoCalcPattern.test(updatedDetails)) {
              updatedDetails = updatedDetails.replace(autoCalcPattern, `(레일 ${editOptionQuantity}개)`);
            } else {
              updatedDetails = `${updatedDetails} (레일 ${editOptionQuantity}개)`;
            }
          }
          
          // 해당 제품 정보 찾기 (옵션 계산을 위해)
          // 옵션 행의 위치를 기준으로 이전 제품을 찾음
          let targetProduct = null;
          for (let i = currentRows.indexOf(row) - 1; i >= 0; i--) {
            if (currentRows[i].type === 'product') {
              targetProduct = currentRows[i];
              break;
            }
          }
          
          // 옵션 금액 계산 (견적관리와 동일한 로직)
          const calculatedTotalPrice = getOptionAmount({
            ...editingOption,
            quantity: editOptionQuantity
          }, targetProduct || {});
          
          const calculatedCost = getOptionPurchaseAmount({
            ...editingOption,
            quantity: editOptionQuantity
          }, targetProduct || {});
          
          return {
            ...row,
            quantity: editOptionQuantity,
            totalPrice: calculatedTotalPrice, // 새로운 계산 함수 사용
            cost: calculatedCost, // 새로운 계산 함수 사용
            margin: calculatedTotalPrice - calculatedCost, // 새로운 계산 함수 사용
            details: updatedDetails,
            isManualQuantity: true // 수동으로 수정됨을 표시
          };
        }
        return row;
      });
      
      // 옵션 수정 후 관련 제품들의 세부내용 자동 업데이트
      const updatedRowsWithDetails = updatedRows.map((row) => {
        if (row.type === 'product') {
          return {
            ...row,
            details: updateDetailsInRealTime(row)
          };
        }
        return row;
      });
      
      const updatedOrders = [...orders];
      updatedOrders[activeTab].rows = updatedRowsWithDetails;
      setOrders(updatedOrders);
      
      setSnackbarMessage(`${editingOption.optionName} 옵션의 수량이 ${editOptionQuantity}개로 수정되었습니다.`);
      setSnackbarOpen(true);
    }
    
    setEditOptionDialogOpen(false);
    setEditingOption(null);
  };

  // 자동 수량 계산 함수 (견적관리와 동일한 로직 적용)
  const calculateAutoQuantity = (optionName: string) => {
    const currentRows = orders[activeTab]?.rows || [];
    
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
        .reduce((sum, row) => sum + (row?.quantity || 1), 0);
      return blindQuantity > 0 ? blindQuantity : 1;
    }
    if (optionName?.includes('레일') || optionName?.includes('레일')) {
      const railQuantity = currentRows
        .filter(row => row.type === 'product' && 
                      (row.productType?.includes('레일') || 
                       row.productName?.includes('레일')))
        .reduce((sum, row) => sum + (row?.quantity || 1), 0);
      return railQuantity > 0 ? railQuantity : 1;
    }
    if (optionName?.includes('전동커튼시공') || optionName?.includes('전동커튼 시공')) {
      return 1; // 전동커튼시공은 기본값 1
    }
    if (optionName?.includes('전동') || optionName?.includes('모터')) {
      return 1; // 전동 관련 옵션은 기본값 1
    }
    return optionQuantity;
  };

  // 특정 제품에 대한 옵션 자동 수량 계산 함수
  const calculateOptionQuantityForProduct = (option: any, targetProduct: any) => {
    const optionName = option.productName || option.optionName || '';
    
    if (optionName?.includes('커튼시공') || optionName?.includes('커튼 시공')) {
      // 커튼 제품인 경우 해당 제품의 수량 반환
      if (targetProduct.productType?.includes('커튼') || 
          targetProduct.productName?.includes('커튼') ||
          targetProduct.curtainType?.includes('커튼')) {
        return targetProduct.quantity || 1;
      }
    }
    if (optionName?.includes('블라인드시공') || optionName?.includes('블라인드 시공')) {
      // 블라인드 제품인 경우 해당 제품의 수량 반환
      if (targetProduct.productType?.includes('블라인드') || 
          targetProduct.productName?.includes('블라인드')) {
        return targetProduct.quantity || 1;
      }
    }
    if (optionName?.includes('레일')) {
      // 레일 옵션은 해당 제품의 수량 반환
      return targetProduct.quantity || 1;
    }
    if (optionName?.includes('전동커튼시공') || optionName?.includes('전동커튼 시공')) {
      return 1; // 전동커튼시공은 기본값 1
    }
    if (optionName?.includes('전동') || optionName?.includes('모터')) {
      return 1; // 전동 관련 옵션은 기본값 1
    }
    
    // 기본값
    return option.quantity || 1;
  };

  // 기타 옵션 추가 핸들러
  const handleAddCustomOption = () => {
    // 간단한 기타 옵션 추가 (나중에 확장 가능)
    const newOptionRow = {
      id: Date.now() + Math.random(),
      type: 'option' as const,
      vendor: '',
      brand: '',
      space: '',
      productType: '',
      curtainType: '',
      pleatType: '',
      productName: '기타 옵션',
      width: '',
      details: '사용자 정의 옵션',
      widthMM: 0,
      heightMM: 0,
      area: 0,
      lineDir: '',
      lineLen: 0,
      pleatAmount: 0,
      widthCount: 0,
      quantity: 1,
      totalPrice: 0,
      salePrice: 0,
      cost: 0,
      purchaseCost: 0,
      margin: 0,
      note: '',
      productCode: '',
      largePlainPrice: 0,
      largePlainCost: 0,
      optionLabel: '기타'
    };

    const currentRows = orders[activeTab]?.rows || [];
    const updatedOrders = [...orders];
    updatedOrders[activeTab].rows = [...currentRows, newOptionRow];
    setOrders(updatedOrders);
    
    setSnackbarMessage('기타 옵션이 추가되었습니다.');
    setSnackbarOpen(true);
    setOptionDialogOpen(false);
  };

  // 출력하기 클릭 핸들러
  const handleOutputClick = (event: React.MouseEvent<HTMLElement>) => {
    setOutputAnchorEl(event.currentTarget);
  };

  // 출력하기 드롭다운 닫기
  const handleOutputClose = () => {
    setOutputAnchorEl(null);
  };
  // 출력 옵션 처리
  const handleOutputOption = async (option: string) => {
    handleOutputClose();

    if (option === 'print') {
      // 프린트의 경우 주문서 양식 모달을 먼저 열기
      setShowOrderTemplate(true);
      return;
    }

    // 숨겨진 estimate-template 요소 찾기
    const captureElement = document.querySelector(
      '.estimate-template'
    ) as HTMLElement;
    if (!captureElement) {
      setSnackbarMessage('견적서 템플릿을 찾을 수 없습니다.');
      setSnackbarOpen(true);
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
          pdf.save(`${orders[activeTab]?.estimateNo || 'order'}.pdf`);
          break;
        }
        case 'jpg': {
          const imgData = canvas.toDataURL('image/png');
          const link = document.createElement('a');
          link.href = imgData;
          link.download = `${orders[activeTab]?.estimateNo || 'order'}.png`;
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
                        `${orders[activeTab]?.estimateNo || 'order'}.png`,
                        { type: 'image/png' }
                      ),
                    ],
                    title: '주문서 공유',
                    text: `주문서(${orders[activeTab]?.estimateNo})를 확인하세요.`,
                  });
                } catch (error) {
                  setSnackbarMessage('공유 실패: ' + error);
                  setSnackbarOpen(true);
                }
              }
            });
          } else {
            setSnackbarMessage('이 브라우저는 공유 기능을 지원하지 않습니다.');
            setSnackbarOpen(true);
          }
          break;
        }
      }
    } catch (error) {
      setSnackbarMessage('출력 중 오류가 발생했습니다: ' + error);
      setSnackbarOpen(true);
    } finally {
      // 원래 스타일로 복원
      captureElement.style.visibility = originalVisibility;
      captureElement.style.position = originalPosition;
      captureElement.style.left = originalLeft;
      captureElement.style.top = originalTop;
      captureElement.style.zIndex = '';
    }
  };

  // 주문서 변경사항 감지 함수
  const hasOrderChanges = (currentOrder: any, savedOrder: any) => {
    if (!savedOrder) return true; // 저장된 주문서가 없으면 변경사항 있음
    
    // 주요 필드들 비교
    const fieldsToCompare = [
      'customerName', 'customerPhone', 'customerAddress', 'estimateNo',
      'rows', 'totalPrice', 'discountAmount', 'discountRate', 'discountedAmount',
      'productStatus', 'vendorPurchaseOrders'
    ];
    
    for (const field of fieldsToCompare) {
      if (field === 'rows') {
        // 제품 목록 비교
        const currentRows = JSON.stringify(currentOrder[field] || []);
        const savedRows = JSON.stringify(savedOrder[field] || []);
        if (currentRows !== savedRows) return true;
      } else if (field === 'vendorPurchaseOrders') {
        // 발주서 정보 비교
        const currentVendorOrders = JSON.stringify(vendorPurchaseOrders[currentOrder.id] || []);
        const savedVendorOrders = JSON.stringify(savedOrder[field] || []);
        if (currentVendorOrders !== savedVendorOrders) return true;
      } else {
        // 일반 필드 비교
        if (currentOrder[field] !== savedOrder[field]) return true;
      }
    }
    
    return false;
  };

  // 저장하기 핸들러
  const handleSaveOrder = async () => {
    try {
      const currentOrder = orders[activeTab];
      if (!currentOrder) {
        setSnackbarMessage('저장할 주문서가 없습니다.');
        setSnackbarOpen(true);
        return;
      }

      // 주문서에 제품이 없으면 할인 설정 초기화
      if (!currentOrder.rows || currentOrder.rows.length === 0) {
        setDiscountAmount('');
        setDiscountRate('');
        setDiscountedTotalInput('');
      }

      // 저장할 주문서 데이터 준비
      const orderToSave = {
        ...currentOrder,
        savedAt: new Date().toISOString(),
        savedDate: getLocalDate(),
        id: currentOrder.id || `order_${Date.now()}`,
        // 할인 설정 저장
        discountAmount: discountAmount,
        discountRate: discountRate,
        discountedTotalInput: discountedTotalInput,
        // 할인후금액 계산하여 저장
        discountedAmount: discountAmountNumber > 0 ? discountedTotal : sumTotalPrice,
        // 발주서 저장
        vendorPurchaseOrders: vendorPurchaseOrders[currentOrder.id] || [],
        // 제품준비 상태 저장 (기존 상태 유지 또는 기본값 설정)
        productStatus: currentOrder.productStatus || '제품준비'
      };

      // 기존 저장된 주문서 불러오기
      const existingSavedOrders = JSON.parse(localStorage.getItem('saved_orders') || '[]');
      
      // 같은 ID의 주문서가 있으면 업데이트, 없으면 새로 추가
      const existingIndex = existingSavedOrders.findIndex((order: any) => order.id === orderToSave.id);
      
      if (existingIndex !== -1) {
        // 기존 주문서가 있는 경우 변경사항 확인
        const existingOrder = existingSavedOrders[existingIndex];
        if (hasOrderChanges(currentOrder, existingOrder)) {
          // 변경사항이 있으면 확인 메시지 표시
          if (window.confirm('주문서 내용이 변경되었습니다. 기존 데이터를 덮어씌워서 저장하시겠습니까?')) {
            // 사용자가 확인하면 저장 진행
            existingSavedOrders[existingIndex] = orderToSave;
            localStorage.setItem('saved_orders', JSON.stringify(existingSavedOrders));
            setSavedOrders(existingSavedOrders);
            
            // Firebase Cloud Functions를 통한 저장
            try {
              console.log('Firebase Cloud Functions를 통한 주문서 저장 시작');
              await orderService.saveOrder(orderToSave);
              console.log('Firebase Cloud Functions를 통한 주문서 저장 성공');
              setSnackbarMessage('주문서가 Firebase에 저장되었습니다.');
            } catch (firebaseError) {
              console.error('Firebase 저장 실패, localStorage만 사용:', firebaseError);
              setSnackbarMessage('주문서가 로컬에만 저장되었습니다. (Firebase 동기화 실패)');
            }
            setSnackbarOpen(true);
          }
          return;
        } else {
          // 변경사항이 없으면 바로 저장
          existingSavedOrders[existingIndex] = orderToSave;
        }
      } else {
        // 새 주문서 추가
        existingSavedOrders.push(orderToSave);
      }

      // localStorage에 저장
      localStorage.setItem('saved_orders', JSON.stringify(existingSavedOrders));
      
      // 상태 업데이트
      setSavedOrders(existingSavedOrders);
      
      // Firebase Cloud Functions를 통한 저장
      try {
        console.log('Firebase Cloud Functions를 통한 주문서 저장 시작');
        await orderService.saveOrder(orderToSave);
        console.log('Firebase Cloud Functions를 통한 주문서 저장 성공');
        setSnackbarMessage('주문서가 Firebase에 저장되었습니다.');
      } catch (firebaseError) {
        console.error('Firebase 저장 실패, localStorage만 사용:', firebaseError);
        setSnackbarMessage('주문서가 로컬에만 저장되었습니다. (Firebase 동기화 실패)');
      }
      setSnackbarOpen(true);
    } catch (error) {
      console.error('주문서 저장 실패:', error);
      setSnackbarMessage('주문서 저장에 실패했습니다.');
      setSnackbarOpen(true);
    }
  };

  // 새 주문서 저장 핸들러
  const handleSaveAsNewOrder = async () => {
    try {
      const currentOrder = orders[activeTab];
      if (!currentOrder) {
        setSnackbarMessage('저장할 주문서가 없습니다.');
        setSnackbarOpen(true);
        return;
      }

      // 주문서에 제품이 없으면 할인 설정 초기화
      if (!currentOrder.rows || currentOrder.rows.length === 0) {
        setDiscountAmount('');
        setDiscountRate('');
        setDiscountedTotalInput('');
      }

      // 새 주문서 번호 생성
      const existingSavedOrders = JSON.parse(localStorage.getItem('saved_orders') || '[]');
      const newOrderNo = generateOrderNo(existingSavedOrders);

      // 저장할 주문서 데이터 준비 (새 ID와 주문번호로)
      const orderToSave = {
        ...currentOrder,
        id: `order_${Date.now()}`,
        estimateNo: newOrderNo,
        savedAt: new Date().toISOString(),
        savedDate: getLocalDate(),
        // 할인 설정 저장
        discountAmount: discountAmount,
        discountRate: discountRate,
        discountedTotalInput: discountedTotalInput,
        // 할인후금액 계산하여 저장
        discountedAmount: discountAmountNumber > 0 ? discountedTotal : sumTotalPrice,
        // 발주서 저장
        vendorPurchaseOrders: vendorPurchaseOrders[currentOrder.id] || [],
        // 제품준비 상태 저장 (기존 상태 유지 또는 기본값 설정)
        productStatus: currentOrder.productStatus || '제품준비'
      };

      // 새 주문서 추가
      existingSavedOrders.push(orderToSave);

      // localStorage에 저장
      localStorage.setItem('saved_orders', JSON.stringify(existingSavedOrders));
      
      // 상태 업데이트
      setSavedOrders(existingSavedOrders);
      
      // Firebase Cloud Functions를 통한 저장
      try {
        console.log('Firebase Cloud Functions를 통한 새 주문서 저장 시작');
        await orderService.saveOrder(orderToSave);
        console.log('Firebase Cloud Functions를 통한 새 주문서 저장 성공');
        setSnackbarMessage('새 주문서가 Firebase에 저장되었습니다.');
      } catch (firebaseError) {
        console.error('Firebase 저장 실패, localStorage만 사용:', firebaseError);
        setSnackbarMessage('새 주문서가 로컬에만 저장되었습니다. (Firebase 동기화 실패)');
      }
      setSnackbarOpen(true);
    } catch (error) {
      console.error('새 주문서 저장 실패:', error);
      setSnackbarMessage('새 주문서 저장에 실패했습니다.');
      setSnackbarOpen(true);
    }
  };

  // 주문서 작성 완료 핸들러
  const handleOrderComplete = () => {
    setShowOrderTemplate(false);
    setSelectedContract(null);
    setSnackbarMessage('주문서가 성공적으로 작성되었습니다.');
    setSnackbarOpen(true);
  };
  // 거래처별 발주서 생성
  const generateVendorPurchaseOrders = () => {
    const currentOrder = orders[activeTab];
    if (!currentOrder || !currentOrder.rows || currentOrder.rows.length === 0) {
      setSnackbarMessage('발주서를 생성할 제품이 없습니다.');
      setSnackbarOpen(true);
      return;
    }

    // 디버깅: 발주경로 설정 확인
    console.log('=== 발주서 생성 디버깅 ===');
    console.log('발주경로 설정:', purchasePathSettings);
    console.log('커튼전동 설정:', purchasePathSettings['커튼전동']);
    
    // 옵션 데이터 상세 확인
    const options = currentOrder.rows.filter(row => row.type === 'option');
    console.log('옵션들:', options.map(option => ({
      id: option.id,
      productId: (option as any).productId,
      productName: option.productName,
      vendor: option.vendor,
      optionType: (option as any).optionType
    })));



    // 옵션 분류 함수
    const classifyOptionsByPurchasePath = (productRow: any, allRows: any[]) => {
      const productOptions = allRows.filter(row => 
        row.type === 'option' && (row as any).productId === productRow.id
      );
      
      console.log(`제품 ${productRow.id} (${productRow.productName})의 연결된 옵션들:`, productOptions);
      
      const productVendorOptions: any[] = [];
      const optionVendorOptions: any[] = [];
      
      productOptions.forEach(option => {
        // optionType이 없는 경우 productType에서 추출하거나 기본값 사용
        let optionType = (option as any).optionType;
        if (!optionType) {
          // 기존 옵션들은 productType에 optionType 정보가 있을 수 있음
          optionType = option.productType || '기타옵션';
        }
        
        console.log(`옵션 ${option.productName}의 optionType:`, optionType);
        
        const settings = purchasePathSettings[optionType];
        console.log(`옵션 ${option.productName}의 발주경로 설정:`, settings);
        
        // 발주예외가 체크된 옵션은 제외
        if (settings?.excludeFromPurchase) {
          console.log(`옵션 ${option.productName}은 발주예외로 제외됨`);
          return;
        }
        
        const purchasePath = settings?.purchasePath || 'product'; // 기본값: 제품거래처
        console.log(`옵션 ${option.productName}의 발주경로:`, purchasePath);
        
        if (purchasePath === 'product') {
          productVendorOptions.push(option);
          console.log(`옵션 ${option.productName}을 제품거래처 옵션으로 분류`);
        } else {
          optionVendorOptions.push(option);
          console.log(`옵션 ${option.productName}을 옵션거래처 옵션으로 분류`);
        }
      });
      
      console.log(`제품 ${productRow.id}의 분류 결과:`, {
        productVendorOptions: productVendorOptions.length,
        optionVendorOptions: optionVendorOptions.length
      });
      
      return { productVendorOptions, optionVendorOptions };
    };

    // 거래처별로 제품 분류 (발주예외 옵션 제외)
    const vendorGroups: { [key: string]: any[] } = {};
    const optionVendorGroups: { [key: string]: any[] } = {};
    
    currentOrder.rows.forEach((row: any) => {
      if (row.type === 'product' && row.vendor) {
        console.log(`\n=== 제품 ${row.productName} (${row.vendor}) 처리 ===`);
        const { productVendorOptions, optionVendorOptions } = classifyOptionsByPurchasePath(row, currentOrder.rows);
        
        // 제품거래처 옵션들을 제품과 함께 그룹화
        if (!vendorGroups[row.vendor]) {
          vendorGroups[row.vendor] = [];
        }
        vendorGroups[row.vendor].push({
          ...row,
          options: productVendorOptions
        });
        console.log(`${row.vendor} 그룹에 제품 추가됨`);
        
        // 옵션거래처 옵션들을 처리
        optionVendorOptions.forEach(option => {
          const optionVendor = option.vendor || '미지정';
          console.log(`옵션거래처 옵션 처리: ${option.productName} (${optionVendor})`);
          
          // 옵션거래처가 제품거래처와 같은 경우, 제품과 함께 그룹화
          if (optionVendor === row.vendor) {
            console.log(`옵션거래처(${optionVendor}) = 제품거래처(${row.vendor}) → 제품과 함께 그룹화`);
            // 제품거래처 그룹에 옵션 추가
            const existingProductIndex = vendorGroups[row.vendor].findIndex(item => 
              item.id === row.id
            );
            if (existingProductIndex !== -1) {
              vendorGroups[row.vendor][existingProductIndex].options.push(option);
              console.log(`제품거래처 그룹에 옵션 추가됨`);
            }
          } else {
            console.log(`옵션거래처(${optionVendor}) ≠ 제품거래처(${row.vendor}) → 별도 그룹화`);
            // 다른 거래처인 경우 별도 그룹화
            if (!optionVendorGroups[optionVendor]) {
              optionVendorGroups[optionVendor] = [];
            }
            optionVendorGroups[optionVendor].push(option);
            console.log(`옵션거래처 그룹에 옵션 추가됨`);
          }
        });
      }
    });

    // 모든 발주서 생성 (제품거래처 + 옵션거래처)
    const allPurchaseOrders: any[] = [];
    
    console.log('\n=== 최종 그룹화 결과 ===');
    console.log('제품거래처 그룹:', vendorGroups);
    console.log('옵션거래처 그룹:', optionVendorGroups);
    
    // 통합된 거래처별 발주서 생성
    const consolidatedVendorGroups: { [key: string]: any[] } = {};
    
    // 제품거래처 그룹 처리
    Object.keys(vendorGroups).forEach(vendor => {
      if (!consolidatedVendorGroups[vendor]) {
        consolidatedVendorGroups[vendor] = [];
      }
      consolidatedVendorGroups[vendor].push(...vendorGroups[vendor]);
      console.log(`제품거래처 그룹 ${vendor} 통합됨`);
    });
    
    // 옵션거래처 그룹 처리 (동일 거래처가 있으면 통합, 없으면 새로 생성)
    Object.keys(optionVendorGroups).forEach(vendor => {
      if (!consolidatedVendorGroups[vendor]) {
        consolidatedVendorGroups[vendor] = [];
      }
      consolidatedVendorGroups[vendor].push(...optionVendorGroups[vendor]);
      console.log(`옵션거래처 그룹 ${vendor} 통합됨`);
    });
    
    // 통합된 발주서 생성
    Object.keys(consolidatedVendorGroups).forEach(vendor => {
      console.log(`통합 발주서 생성: ${vendor} (${consolidatedVendorGroups[vendor].length}개 아이템)`);
      allPurchaseOrders.push({
        vendor,
        items: consolidatedVendorGroups[vendor],
        memo: '',
        createdAt: new Date().toISOString(),
        orderInfo: {
          customerName: currentOrder.customerName,
          address: currentOrder.address,
          projectName: currentOrder.projectName,
          estimateNo: currentOrder.estimateNo,
          estimateDate: currentOrder.estimateDate,
        }
      });
    });

    // 현재 주문서의 발주서를 저장
    setVendorPurchaseOrders(prev => ({
      ...prev,
      [currentOrder.id]: allPurchaseOrders
    }));
    setSnackbarMessage(`${allPurchaseOrders.length}개 거래처의 발주서가 생성되었습니다.`);
    setSnackbarOpen(true);
  };

  // 발주서 모달 열기
  const handleOpenPurchaseOrderModal = (vendor: string, items: any[]) => {
    setSelectedVendor(vendor);
    setPurchaseOrderItems(items);
    setPurchaseOrderDate(getLocalDate()); // 발주일자를 현재 날짜로 초기화
    setPurchaseOrderMemo(''); // 메모 초기화
    const deliveryInfo = getDeliveryInfo(vendor);
    setModalDeliveryMethod(deliveryInfo.method);
    setModalDeliveryDate(deliveryInfo.date);
    setModalDeliveryCompany(deliveryInfo.company);
    setModalDeliveryContact(deliveryInfo.contact);
    setModalDeliveryAddress(deliveryInfo.address);
    setPurchaseOrderModalOpen(true);
  };

  // 발주서 출력
  const handlePrintPurchaseOrder = (type: 'print' | 'jpg' | 'pdf' | 'kakao', vendor?: string) => {
    const selectedVendor = vendor || selectedVendorForPrint;
    if (!selectedVendor) {
      setSnackbarMessage('출력할 거래처가 선택되지 않았습니다.');
      setSnackbarOpen(true);
      return;
    }
    if (type === 'print') {
      // 모바일과 데스크톱 모두에서 동일한 프린트 동작
      if (navigator.userAgent.match(/Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i)) {
        // 모바일에서 프린트
        const printWindow = window.open('', '_blank');
        if (printWindow) {
          const element = document.querySelector('.purchase-order-a4-container');
          if (element) {
            printWindow.document.write(`
              <!DOCTYPE html>
              <html>
                <head>
                  <title>발주서</title>
                  <meta name="viewport" content="width=device-width, initial-scale=1.0">
                  <style>
                    @media print {
                      @page {
                        size: A4;
                        margin: 2mm;
                      }
                      body {
                        margin: 0;
                        padding: 0;
                      }
                    }
                    .print-content {
                      width: 100%;
                      max-width: 210mm;
                      margin: 0 auto;
                      padding: 2mm;
                      background: white;
                    }
                  </style>
                </head>
                <body>
                  <div class="print-content">
                    ${element.outerHTML}
                  </div>
                </body>
              </html>
            `);
            printWindow.document.close();
            printWindow.focus();
            setTimeout(() => {
              printWindow.print();
              printWindow.close();
            }, 500);
          }
        }
      } else {
        // 데스크톱에서 프린트
        window.print();
      }
    } else if (type === 'jpg' || type === 'pdf') {
      const element = document.querySelector('.purchase-order-a4-container');
      if (element) {
        // 모바일과 데스크톱 모두에서 동일한 캔버스 생성
        const options = {
          scale: 2,
          useCORS: true,
          allowTaint: true,
          backgroundColor: '#ffffff',
          width: 794, // A4 width in pixels at 96 DPI
          height: 1123, // A4 height in pixels at 96 DPI
          scrollX: 0,
          scrollY: 0,
          logging: false,
          removeContainer: true
        };

        // html2canvas 라이브러리 사용
        if (typeof html2canvas !== 'undefined') {
          html2canvas(element as HTMLElement, options).then((canvas) => {
            if (type === 'jpg') {
              // JPG 다운로드
              canvas.toBlob((blob) => {
                if (blob) {
                  const url = URL.createObjectURL(blob);
                  const link = document.createElement('a');
                  link.download = `발주서_${selectedVendor}_${getLocalDate()}.jpg`;
                  link.href = url;
                  document.body.appendChild(link);
                  link.click();
                  document.body.removeChild(link);
                  URL.revokeObjectURL(url);
                }
              }, 'image/jpeg', 0.9);
            } else if (type === 'pdf') {
              // PDF 생성
              if (typeof jsPDF !== 'undefined') {
                const imgData = canvas.toDataURL('image/jpeg', 0.9);
                const pdf = new jsPDF('p', 'mm', 'a4');
                const imgWidth = 210;
                const pageHeight = 295;
                const imgHeight = (canvas.height * imgWidth) / canvas.width;
                let heightLeft = imgHeight;
                let position = 0;

                pdf.addImage(imgData, 'JPEG', 0, position, imgWidth, imgHeight);
                heightLeft -= pageHeight;

                while (heightLeft >= 0) {
                  position = heightLeft - imgHeight;
                  pdf.addPage();
                  pdf.addImage(imgData, 'JPEG', 0, position, imgWidth, imgHeight);
                  heightLeft -= pageHeight;
                }

                pdf.save(`발주서_${selectedVendor}_${getLocalDate()}.pdf`);
              } else {
                alert('PDF 생성 라이브러리가 로드되지 않았습니다.');
              }
            }
          }).catch((error) => {
            console.error('Canvas generation error:', error);
            alert('이미지 생성 중 오류가 발생했습니다. 다시 시도해주세요.');
          });
        } else {
          alert('이미지 생성 라이브러리가 로드되지 않았습니다.');
        }
      }
    } else if (type === 'kakao') {
      // 카카오톡 공유 로직
      const element = document.querySelector('.purchase-order-a4-container');
      if (element && typeof html2canvas !== 'undefined') {
        html2canvas(element as HTMLElement, {
          scale: 2,
          useCORS: true,
          allowTaint: true,
          backgroundColor: '#ffffff'
        }).then((canvas) => {
          canvas.toBlob((blob) => {
            if (blob) {
              const url = URL.createObjectURL(blob);
              // 카카오톡 공유 API 호출
              if ((window as any).Kakao && (window as any).Kakao.isInitialized()) {
                (window as any).Kakao.Link.sendDefault({
                  objectType: 'feed',
                  content: {
                    title: `${selectedVendor} 발주서`,
                    description: `발주일: ${purchaseOrderDate}`,
                    imageUrl: url,
                  },
                  buttons: [
                    {
                      title: '자세히 보기',
                      link: {
                        mobileWebUrl: window.location.href,
                        webUrl: window.location.href,
                      },
                    },
                  ],
                });
              }
            }
          }, 'image/jpeg', 0.9);
        });
      }
    }
  };

  // 거래처별 납품 정보 업데이트
  const updateDeliveryInfo = (vendor: string, field: 'method' | 'date' | 'company' | 'contact' | 'address', value: string) => {
    setDeliveryInfo(prev => ({
      ...prev,
      [vendor]: {
        ...prev[vendor],
        [field]: value
      }
    }));
    
    // 납품정보 변경 시 자동 저장
    const currentOrder = orders[activeTab];
    if (currentOrder) {
      const updatedOrder = {
        ...currentOrder,
        deliveryInfo: {
          ...currentOrder.deliveryInfo,
          [vendor]: {
            ...(currentOrder.deliveryInfo?.[vendor] || {}),
            [field]: value
          }
        }
      };
      
      const updatedOrders = [...orders];
      updatedOrders[activeTab] = updatedOrder;
      setOrders(updatedOrders);
      
      // 성공 메시지 표시
      setSnackbarMessage(`${vendor} 거래처의 납품정보가 업데이트되었습니다.`);
      setSnackbarOpen(true);
    }
  };

  // 거래처별 납품 정보 가져오기
  const getDeliveryInfo = (vendor: string) => {
    return deliveryInfo[vendor] || { 
      method: '직접배송', 
      date: '', 
      company: '', 
      contact: '', 
      address: '' 
    };
  };

  // 납품일자 옵션 생성 (발주일 1일 이후부터 10일간)
  const generateDeliveryDateOptions = () => {
    const options = [];
    const today = new Date();
    
    for (let i = 1; i <= 10; i++) {
      const date = new Date(today);
      date.setDate(today.getDate() + i);
      const dateString = date.toISOString().split('T')[0]; // YYYY-MM-DD 형식
      const displayDate = `${date.getFullYear()}년 ${date.getMonth() + 1}월 ${date.getDate()}일`;
      options.push({ value: dateString, label: displayDate });
    }
    
    return options;
  };

  // 전체 발주서 출력
  const handlePrintAllPurchaseOrders = (type: 'jpg' | 'pdf') => {
    const currentOrderId = orders[activeTab]?.id;
    if (currentOrderId && vendorPurchaseOrders[currentOrderId]) {
      vendorPurchaseOrders[currentOrderId].forEach(order => {
        const fileName = `${order.vendor}_${getLocalDate()}_${order.orderInfo.address || '주소'}.${type}`;
        console.log('전체 발주서 출력:', fileName);
      });
    }
  };

  // 발주서 삭제 함수
  const handleDeletePurchaseOrder = (vendor: string) => {
    const currentOrderId = orders[activeTab]?.id;
    if (!currentOrderId || !vendorPurchaseOrders[currentOrderId]) return;

    if (window.confirm(`정말로 ${vendor}의 발주서를 삭제하시겠습니까?`)) {
      const updatedPurchaseOrders = vendorPurchaseOrders[currentOrderId].filter(
        order => order.vendor !== vendor
      );
      
      setVendorPurchaseOrders(prev => ({
        ...prev,
        [currentOrderId]: updatedPurchaseOrders
      }));
      
      setSnackbarMessage(`${vendor}의 발주서가 삭제되었습니다.`);
      setSnackbarOpen(true);
    }
  };

  // 저장된 주문서 불러오기 핸들러
  const handleLoadSavedOrder = (savedOrder: any) => {
    try {
      // 현재 주문서를 저장된 주문서로 교체
      const updatedOrders = [...orders];
      updatedOrders[activeTab] = {
        ...savedOrder,
        // 현재 탭의 ID는 유지
        id: orders[activeTab]?.id || savedOrder.id,
      };
      
      setOrders(updatedOrders);
      setIsOrderEditMode(true);
      
      // 할인 설정 먼저 초기화
      setDiscountAmount('');
      setDiscountRate('');
      setDiscountedTotalInput('');
      
      // 저장된 주문서의 할인 설정 불러오기
      if (savedOrder.discountAmount !== undefined) {
        setDiscountAmount(savedOrder.discountAmount || '');
      }
      if (savedOrder.discountRate !== undefined) {
        setDiscountRate(savedOrder.discountRate || '');
      }
      if (savedOrder.discountedTotalInput !== undefined) {
        setDiscountedTotalInput(savedOrder.discountedTotalInput || '');
      }

      
      // 저장된 주문서의 발주서 불러오기 (발주서가 없으면 빈 배열로 설정)
      setVendorPurchaseOrders(prev => ({
        ...prev,
        [updatedOrders[activeTab].id]: savedOrder.vendorPurchaseOrders || []
      }));
      
      // 저장된 주문서의 수금내역 및 AS접수내역 불러오기
      // 이미 로드된 데이터가 있으므로 별도 로드 불필요 (주문번호별로 자동 필터링됨)
      
      // 주문서 작성 화면 표시하지 않음 (출력 모달이 뜨지 않도록)
      // setShowOrderTemplate(true);
      
      setSnackbarMessage('저장된 주문서가 불러와졌습니다.');
      setSnackbarOpen(true);
    } catch (error) {
      console.error('저장된 주문서 불러오기 실패:', error);
      setSnackbarMessage('저장된 주문서 불러오기에 실패했습니다.');
      setSnackbarOpen(true);
    }
  };

  // AS접수 모달 열기
  const handleOpenASModal = (order: any) => {
    setSelectedOrderForAS(order);
    setAsRequest({
      asRequestDate: getLocalDate(),
      selectedProducts: [],
      processingMethod: '거래처AS',
      problem: '',
      solution: '',
      cost: 0,
      memo: '',
      isCompleted: false
    });
    setAsModalOpen(true);
  };

  // AS접수 저장
  const handleSaveASRequest = () => {
    if (!selectedOrderForAS) return;

    try {
      const newASRequest: ASRequest = {
        id: Date.now(),
        orderId: selectedOrderForAS.id,
        orderNo: selectedOrderForAS.estimateNo,
        address: selectedOrderForAS.address,
        customerName: selectedOrderForAS.customerName,
        contact: selectedOrderForAS.contact,
        installationDate: selectedOrderForAS.installationDate,
        asRequestDate: asRequest.asRequestDate || getLocalDate(),
        selectedProducts: asRequest.selectedProducts || [],
        processingMethod: asRequest.processingMethod || '거래처AS',
        problem: asRequest.problem || '',
        solution: asRequest.solution || '',
        cost: asRequest.cost || 0,
        memo: asRequest.memo || '',
        isCompleted: asRequest.isCompleted || false,
        status: 'AS처리중', // 기본값으로 AS처리중 설정
        createdAt: new Date().toISOString()
      };

      const orderNo = selectedOrderForAS.estimateNo;
      const currentOrderASRequests = asRequests[orderNo] || [];
      const updatedASRequests = {
        ...asRequests,
        [orderNo]: [...currentOrderASRequests, newASRequest]
      };
      localStorage.setItem('asRequests', JSON.stringify(updatedASRequests));
      setAsRequests(updatedASRequests);
      
      setAsModalOpen(false);
      setSnackbarMessage('AS접수가 저장되었습니다.');
      setSnackbarOpen(true);
    } catch (error) {
      console.error('AS접수 저장 실패:', error);
      setSnackbarMessage('AS접수 저장에 실패했습니다.');
      setSnackbarOpen(true);
    }
  };

  // 수금내역 모달 열기
  const handleOpenPaymentModal = (order: any) => {
    setSelectedOrderForPayment(order);
    setPaymentRecord({
      paymentDate: getLocalDate(),
      paymentMethod: '',
      amount: 0,
      remainingAmount: 0,
      refundAmount: 0,
      refundMethod: '',
      refundDate: getLocalDate(),
      refundMemo: ''
    });
    setPaymentModalOpen(true);
  };

  // AS상태 편집 모달 열기
  const handleOpenASEditModal = (asRequest: ASRequest) => {
    setSelectedASRequest(asRequest);
    setEditingASRequest({
      asRequestDate: asRequest.asRequestDate, // 원래 접수일자 유지
      selectedProducts: asRequest.selectedProducts,
      processingMethod: asRequest.processingMethod,
      problem: asRequest.problem,
      solution: asRequest.solution,
      cost: asRequest.cost,
      memo: asRequest.memo,
      status: asRequest.status,
      asProcessDate: asRequest.asProcessDate || getLocalDate() // AS처리일자 추가
    });
    setAsEditModalOpen(true);
  };

  // AS상태 편집 모달 닫기
  const handleCloseASEditModal = () => {
    setAsEditModalOpen(false);
    setSelectedASRequest(null);
    setEditingASRequest({});
  };

  // 제품준비 상태 토글
  const handleToggleProductStatus = (order: any) => {
    try {
      const currentStatus = order.productStatus || '제품준비';
      const newStatus = currentStatus === '제품준비' ? '납품완료' : '제품준비';
      
      // 저장된 주문서 목록에서 해당 주문서 업데이트
      const updatedSavedOrders = savedOrders.map(savedOrder => 
        savedOrder.id === order.id 
          ? { ...savedOrder, productStatus: newStatus }
          : savedOrder
      );
      
      setSavedOrders(updatedSavedOrders);
      localStorage.setItem('saved_orders', JSON.stringify(updatedSavedOrders));
      
      setSnackbarMessage(`제품상태가 ${newStatus}로 변경되었습니다.`);
      setSnackbarOpen(true);
    } catch (error) {
      console.error('제품상태 변경 실패:', error);
      setSnackbarMessage('제품상태 변경에 실패했습니다.');
      setSnackbarOpen(true);
    }
  };

  // AS접수 출력 모달 열기
  const handleOpenASPrintModal = () => {
    setAsPrintModalOpen(true);
  };

  // AS접수 출력 모달 닫기
  const handleCloseASPrintModal = () => {
    setAsPrintModalOpen(false);
  };

  // AS접수 출력 메뉴 관련 함수들
  const handleASPrintMenuOpen = (event: React.MouseEvent<HTMLElement>, request: ASRequest) => {
    setAsPrintMenuAnchorEl(event.currentTarget);
    setAsPrintMenuOpen(true);
    setSelectedASRequestForPrint(request);
  };

  const handleASPrintMenuClose = () => {
    setAsPrintMenuAnchorEl(null);
    setAsPrintMenuOpen(false);
    setSelectedASRequestForPrint(null);
  };

  // 발주서 출력 메뉴 관련 함수들
  const handlePrintMenuClose = () => {
    setPrintMenuAnchorEl(null);
    setPrintMenuOpen(false);
    setSelectedVendorForPrint('');
  };

  // 거래처명 변경 감지
  useEffect(() => {
    console.log('선택된 거래처명이 변경됨:', selectedVendorForPrint);
    if (selectedVendorForPrint) {
      console.log('거래처명이 설정됨:', selectedVendorForPrint);
    } else {
      console.log('거래처명이 비어있음');
    }
  }, [selectedVendorForPrint]);

  const handlePrintMenuOption = (type: 'print' | 'jpg' | 'pdf' | 'kakao') => {
    console.log('프린트 메뉴 옵션 선택:', type, '거래처:', selectedVendorForPrint);
    if (selectedVendorForPrint) {
      if (type === 'print') {
        console.log('발주서 미리보기 모달을 열기 전 거래처명:', selectedVendorForPrint);
        setPurchaseOrderPrintModalOpen(true);
      } else {
        handlePrintPurchaseOrder(type);
      }
    } else {
      console.error('선택된 거래처가 없습니다.');
    }
    handlePrintMenuClose();
  };

  // 수정 가능한 발주서 테이블 관련 함수들
  const handleEditablePurchaseOrderClose = () => {
    setEditablePurchaseOrderModalOpen(false);
    setEditablePurchaseOrderData([]);
    setEditablePurchaseOrderVendor('');
  };

  const handleEditablePurchaseOrderSave = () => {
    // 수정된 데이터를 원본 발주서에 반영
    const currentOrderId = orders[activeTab]?.id;
    if (currentOrderId && editablePurchaseOrderVendor) {
      setVendorPurchaseOrders(prev => ({
        ...prev,
        [currentOrderId]: prev[currentOrderId].map(order => 
          order.vendor === editablePurchaseOrderVendor 
            ? { ...order, items: editablePurchaseOrderData }
            : order
        )
      }));
      
      setSnackbarMessage(`${editablePurchaseOrderVendor} 거래처의 발주서가 수정되었습니다.`);
      setSnackbarOpen(true);
      handleEditablePurchaseOrderClose();
    }
  };

  const handleEditablePurchaseOrderRowChange = (rowIndex: number, field: string, value: any) => {
    setEditablePurchaseOrderData(prev => 
      prev.map((row, index) => 
        index === rowIndex 
          ? { ...row, [field]: value }
          : row
      )
    );
  };

  const handleEditablePurchaseOrderAddRow = () => {
    const newRow = {
      id: `new-${Date.now()}`,
      productName: '',
      productType: '',
      vendor: editablePurchaseOrderVendor,
      brand: '',
      space: '',
      widthMM: 0,
      heightMM: 0,
      area: 0,
      quantity: 1,
      unitPrice: 0,
      totalPrice: 0,
      details: '',
      productionDetails: '',
      notes: '',
      productCode: '',
      spaceCustom: '',
      productionWidth: 0,
      productionHeight: 0,
      widthCount: 0,
      note: ''
    };
    setEditablePurchaseOrderData(prev => [...prev, newRow]);
  };

  const handleEditablePurchaseOrderDeleteRow = (rowIndex: number) => {
    setEditablePurchaseOrderData(prev => prev.filter((_, index) => index !== rowIndex));
  };
  // AS접수 출력 실행
  const handleASPrint = async (type: 'print' | 'jpg' | 'pdf' | 'kakao', specificRequest?: ASRequest) => {
    try {
      const currentOrder = orders[activeTab];
      if (!currentOrder) {
        setSnackbarMessage('출력할 주문서가 없습니다.');
        setSnackbarOpen(true);
        return;
      }

      const orderASRequests = asRequests[currentOrder.estimateNo] || [];
      if (orderASRequests.length === 0) {
        setSnackbarMessage('출력할 AS접수내역이 없습니다.');
        setSnackbarOpen(true);
        return;
      }

      // 출력할 AS접수내역 결정 (개별 건 또는 전체)
      const requestsToPrint = specificRequest ? [specificRequest] : orderASRequests;

      // 회사 정보 가져오기
      let companyInfo = null;
      try {
        const response = await fetch(`${process.env.REACT_APP_API_BASE || 'http://localhost:5001'}/companyInfo`);
        if (response.ok) {
          const companies = await response.json();
          if (Array.isArray(companies) && companies.length > 0) {
            companyInfo = companies[0]; // 첫 번째 회사 정보 사용
          }
        }
      } catch (error) {
        console.error('회사 정보 가져오기 실패:', error);
      }

      // 출력 로직 구현
      switch (type) {
        case 'print':
          // 프린트 출력 (A4 사이즈 최적화)
          const printWindow = window.open('', '_blank');
          if (printWindow) {
            const today = new Date().toLocaleDateString('ko-KR');
            const title = specificRequest ? `AS신청서 (${specificRequest.processingMethod})` : 'AS접수내역 (전체)';
            
            printWindow.document.write(`
              <html>
                <head>
                  <title>${title}</title>
                  <style>
                    @import url('https://fonts.googleapis.com/css2?family=Noto+Sans+KR:wght@300;400;500;700&display=swap');
                    
                    * {
                      margin: 0;
                      padding: 0;
                      box-sizing: border-box;
                    }
                    
                    body {
                      font-family: 'Noto Sans KR', sans-serif;
                      line-height: 1.6;
                      color: #333;
                      background: white;
                      margin: 0;
                      padding: 0;
                    }
                    
                    .container {
                      width: 210mm;
                      height: 297mm;
                      margin: 0 auto;
                      background: white;
                      padding: 15mm;
                      box-sizing: border-box;
                      overflow: hidden;
                    }
                    
                    .header {
                      background: #2c3e50;
                      color: white;
                      padding: 4mm 3mm;
                      text-align: center;
                      border-bottom: 1mm solid #34495e;
                      margin-bottom: 2mm;
                    }
                    
                    .header h1 {
                      font-size: 18pt;
                      font-weight: 500;
                      margin-bottom: 2mm;
                    }
                    
                    .header .subtitle {
                      font-size: 10pt;
                      opacity: 0.8;
                      font-weight: 300;
                    }
                    
                    .content {
                      padding: 0;
                    }
                    
                    .section {
                      margin-bottom: 2mm;
                      page-break-inside: avoid;
                    }
                    
                    .section-title {
                      font-size: 12pt;
                      font-weight: 500;
                      color: #2c3e50;
                      margin-bottom: 2mm;
                      padding-bottom: 2mm;
                      border-bottom: 0.5mm solid #ecf0f1;
                    }
                    
                    .info-grid {
                      display: grid;
                      grid-template-columns: 1fr 1fr;
                      gap: 2mm;
                      margin-bottom: 2mm;
                    }
                    
                    .info-box {
                      background: #f8f9fa;
                      border: 0.5mm solid #e9ecef;
                      padding: 3mm;
                    }
                    
                    .info-item {
                      margin: 1.5mm 0;
                      padding: 1mm 0;
                      font-size: 9pt;
                    }
                    
                    .info-item strong {
                      color: #495057;
                      font-weight: 500;
                      min-width: 20mm;
                      display: inline-block;
                    }
                    
                    .product-info {
                      background: white;
                      border: 0.5mm solid #e9ecef;
                      padding: 3mm;
                      margin-bottom: 2mm;
                      page-break-inside: avoid;
                    }
                    
                    .product-title {
                      font-size: 10pt;
                      font-weight: 500;
                      color: #2c3e50;
                      margin-bottom: 2mm;
                      padding-bottom: 2mm;
                      border-bottom: 0.5mm solid #ecf0f1;
                    }
                    
                    .date-info {
                      background: #ecf0f1;
                      padding: 2mm 3mm;
                      border-left: 2mm solid #2c3e50;
                      margin-bottom: 2mm;
                      font-size: 9pt;
                    }
                    
                    .date-info strong {
                      color: #2c3e50;
                      font-weight: 500;
                    }
                    
                    .customer-info {
                      background: #f8f9fa;
                      border: 0.5mm solid #e9ecef;
                      padding: 3mm;
                      margin-top: 2mm;
                      page-break-inside: avoid;
                    }
                    
                    @media print {
                      @page {
                        size: A4;
                        margin: 0;
                      }
                      
                      body {
                        background: white;
                        margin: 0;
                        padding: 0;
                      }
                      
                                              .container {
                          width: 210mm;
                          height: 297mm;
                          margin: 0;
                          padding: 15mm;
                          box-shadow: none;
                        }
                      
                      .header {
                        background: #2c3e50 !important;
                        -webkit-print-color-adjust: exact;
                        color-adjust: exact;
                      }
                      
                      .info-box, .customer-info {
                        background: #f8f9fa !important;
                        -webkit-print-color-adjust: exact;
                        color-adjust: exact;
                      }
                      
                      .date-info {
                        background: #ecf0f1 !important;
                        -webkit-print-color-adjust: exact;
                        color-adjust: exact;
                      }
                    }
                  </style>
                </head>
                <body>
                  <div class="container">
                    <div class="header">
                      <h1>${title}</h1>
                      <div class="subtitle">After Service Request Form</div>
                    </div>
                    
                    <div class="content">
                      <div class="section">
                        <div class="section-title">AS신청일</div>
                        <div class="date-info">
                          <strong>신청일:</strong> ${today}
                        </div>
                      </div>
                      
                      <div class="info-grid">
                        <div class="info-box">
                          <div class="section-title">수신</div>
                          <div class="info-item"><strong>거래처명:</strong> ${specificRequest ? specificRequest.processingMethod : '거래처명'}</div>
                          <div class="info-item"><strong>전화번호:</strong> ${companyInfo?.contact || '전화번호'}</div>
                          <div class="info-item"><strong>FAX번호:</strong> ${companyInfo?.fax || 'FAX번호'}</div>
                          <div class="info-item"><strong>담당자명:</strong> 담당자명</div>
                        </div>
                        
                        <div class="info-box">
                          <div class="section-title">발신</div>
                          <div class="info-item"><strong>회사명:</strong> ${companyInfo?.name || '회사명'}</div>
                          <div class="info-item"><strong>연락처:</strong> ${companyInfo?.contact || '연락처'}</div>
                        </div>
                      </div>
                      
                      <div class="section">
                        <div class="section-title">AS제품정보</div>
                        ${requestsToPrint.map((request, index) => `
                          <div class="product-info">
                            <div class="product-title">제품 ${specificRequest ? '' : `${index + 1}`}</div>
                            <div class="info-item"><strong>납품일:</strong> ${currentOrder.installationDate || '납품일'}</div>
                            <div class="info-item"><strong>제품정보:</strong> ${request.selectedProducts.join(', ')}</div>
                            <div class="info-item"><strong>문제점:</strong> ${request.problem}</div>
                            <div class="info-item"><strong>해결방안:</strong> ${request.solution}</div>
                            <div class="info-item"><strong>메모:</strong> ${request.memo}</div>
                          </div>
                        `).join('')}
                      </div>
                      
                      <div class="customer-info">
                        <div class="section-title">고객정보</div>
                        <div class="info-item"><strong>고객명:</strong> ${currentOrder.customerName}</div>
                        <div class="info-item"><strong>연락처:</strong> ${currentOrder.contact}</div>
                        <div class="info-item"><strong>주소:</strong> ${currentOrder.address}</div>
                      </div>
                    </div>
                  </div>
                </body>
              </html>
            `);
            printWindow.document.close();
            printWindow.print();
          }
          break;
        case 'jpg':
          // JPG 출력 (html2canvas 사용)
          try {
            const printWindow = window.open('', '_blank');
            if (printWindow) {
              const today = new Date().toLocaleDateString('ko-KR');
              const title = specificRequest ? `AS신청서 (${specificRequest.processingMethod})` : 'AS접수내역 (전체)';
              
              printWindow.document.write(`
                <html>
                  <head>
                    <title>${title}</title>
                    <style>
                      @import url('https://fonts.googleapis.com/css2?family=Noto+Sans+KR:wght@300;400;500;700&display=swap');
                      
                      * {
                        margin: 0;
                        padding: 0;
                        box-sizing: border-box;
                      }
                      
                      body {
                        font-family: 'Noto Sans KR', sans-serif;
                        line-height: 1.6;
                        color: #333;
                        background: #f5f5f5;
                        padding: 20px;
                      }
                      
                      .container {
                        max-width: 800px;
                        margin: 0 auto;
                        background: white;
                        box-shadow: 0 2px 10px rgba(0,0,0,0.1);
                      }
                      
                      .header {
                        background: #2c3e50;
                        color: white;
                        padding: 30px;
                        text-align: center;
                        border-bottom: 3px solid #34495e;
                      }
                      
                      .header h1 {
                        font-size: 1.8rem;
                        font-weight: 500;
                        margin-bottom: 5px;
                      }
                      
                      .header .subtitle {
                        font-size: 0.9rem;
                        opacity: 0.8;
                        font-weight: 300;
                      }
                      
                      .content {
                        padding: 30px;
                      }
                      
                      .section {
                        margin-bottom: 25px;
                      }
                      
                      .section-title {
                        font-size: 1.1rem;
                        font-weight: 500;
                        color: #2c3e50;
                        margin-bottom: 15px;
                        padding-bottom: 8px;
                        border-bottom: 2px solid #ecf0f1;
                      }
                      
                      .info-grid {
                        display: grid;
                        grid-template-columns: 1fr 1fr;
                        gap: 20px;
                        margin-bottom: 25px;
                      }
                      
                      .info-box {
                        background: #f8f9fa;
                        border: 1px solid #e9ecef;
                        padding: 20px;
                      }
                      
                      .info-item {
                        margin: 8px 0;
                        padding: 5px 0;
                      }
                      
                      .info-item strong {
                        color: #495057;
                        font-weight: 500;
                        min-width: 70px;
                        display: inline-block;
                      }
                      
                      .product-info {
                        background: white;
                        border: 1px solid #e9ecef;
                        padding: 20px;
                        margin-bottom: 15px;
                      }
                      
                      .product-title {
                        font-size: 1rem;
                        font-weight: 500;
                        color: #2c3e50;
                        margin-bottom: 15px;
                        padding-bottom: 8px;
                        border-bottom: 1px solid #ecf0f1;
                      }
                      
                      .date-info {
                        background: #ecf0f1;
                        padding: 10px 15px;
                        border-left: 4px solid #2c3e50;
                        margin-bottom: 20px;
                      }
                      
                      .date-info strong {
                        color: #2c3e50;
                        font-weight: 500;
                      }
                      
                      .customer-info {
                        background: #f8f9fa;
                        border: 1px solid #e9ecef;
                        padding: 20px;
                        margin-top: 25px;
                      }
                    </style>
                  </head>
                  <body>
                    <div class="container">
                      <div class="header">
                        <h1>${title}</h1>
                        <div class="subtitle">After Service Request Form</div>
                      </div>
                      
                      <div class="content">
                        <div class="section">
                          <div class="section-title">AS신청일</div>
                          <div class="date-info">
                            <strong>신청일:</strong> ${today}
                          </div>
                        </div>
                        
                        <div class="info-grid">
                          <div class="info-box">
                            <div class="section-title">수신</div>
                            <div class="info-item"><strong>거래처명:</strong> ${specificRequest ? specificRequest.processingMethod : '거래처명'}</div>
                            <div class="info-item"><strong>전화번호:</strong> ${companyInfo?.contact || '전화번호'}</div>
                            <div class="info-item"><strong>FAX번호:</strong> ${companyInfo?.fax || 'FAX번호'}</div>
                            <div class="info-item"><strong>담당자명:</strong> 담당자명</div>
                          </div>
                          
                          <div class="info-box">
                            <div class="section-title">발신</div>
                            <div class="info-item"><strong>회사명:</strong> ${companyInfo?.name || '회사명'}</div>
                            <div class="info-item"><strong>연락처:</strong> ${companyInfo?.contact || '연락처'}</div>
                          </div>
                        </div>
                        
                        <div class="section">
                          <div class="section-title">AS제품정보</div>
                          ${requestsToPrint.map((request, index) => `
                            <div class="product-info">
                              <div class="product-title">제품 ${specificRequest ? '' : `${index + 1}`}</div>
                              <div class="info-item"><strong>납품일:</strong> ${currentOrder.installationDate || '납품일'}</div>
                              <div class="info-item"><strong>제품정보:</strong> ${request.selectedProducts.join(', ')}</div>
                              <div class="info-item"><strong>문제점:</strong> ${request.problem}</div>
                              <div class="info-item"><strong>해결방안:</strong> ${request.solution}</div>
                              <div class="info-item"><strong>메모:</strong> ${request.memo}</div>
                            </div>
                          `).join('')}
                        </div>
                        
                        <div class="customer-info">
                          <div class="section-title">고객정보</div>
                          <div class="info-item"><strong>고객명:</strong> ${currentOrder.customerName}</div>
                          <div class="info-item"><strong>연락처:</strong> ${currentOrder.contact}</div>
                          <div class="info-item"><strong>주소:</strong> ${currentOrder.address}</div>
                        </div>
                      </div>
                    </div>
                  </body>
                </html>
              `);
              printWindow.document.close();
              
              // html2canvas로 이미지 생성
              setTimeout(async () => {
                try {
                  const container = printWindow.document.querySelector('.container');
                  if (!container) {
                    throw new Error('Container element not found');
                  }
                  const canvas = await html2canvas(container as HTMLElement, {
                    scale: 2,
                    useCORS: true,
                    allowTaint: true,
                    backgroundColor: null,
                    logging: false
                  });
                  
                  const link = document.createElement('a');
                  link.download = `${title}_${today}.jpg`;
                  link.href = canvas.toDataURL('image/png', 1.0);
                  link.click();
                  
                  printWindow.close();
                  setSnackbarMessage('JPG 이미지가 다운로드되었습니다.');
                  setSnackbarOpen(true);
                } catch (error) {
                  console.error('JPG 생성 실패:', error);
                  setSnackbarMessage('JPG 생성에 실패했습니다.');
                  setSnackbarOpen(true);
                  printWindow.close();
                }
              }, 1000);
            }
          } catch (error) {
            console.error('JPG 출력 실패:', error);
            setSnackbarMessage('JPG 출력에 실패했습니다.');
            setSnackbarOpen(true);
          }
          break;
        case 'pdf':
          // PDF 출력 (jsPDF 사용)
          try {
            const printWindow = window.open('', '_blank');
            if (printWindow) {
              const today = new Date().toLocaleDateString('ko-KR');
              const title = specificRequest ? `AS신청서 (${specificRequest.processingMethod})` : 'AS접수내역 (전체)';
              
              printWindow.document.write(`
                <html>
                  <head>
                    <title>${title}</title>
                    <style>
                      @import url('https://fonts.googleapis.com/css2?family=Noto+Sans+KR:wght@300;400;500;700&display=swap');
                      
                      * {
                        margin: 0;
                        padding: 0;
                        box-sizing: border-box;
                      }
                      
                      body {
                        font-family: 'Noto Sans KR', sans-serif;
                        line-height: 1.6;
                        color: #333;
                        background: #f5f5f5;
                        padding: 20px;
                      }
                      
                      .container {
                        max-width: 800px;
                        margin: 0 auto;
                        background: white;
                        box-shadow: 0 2px 10px rgba(0,0,0,0.1);
                      }
                      
                      .header {
                        background: #2c3e50;
                        color: white;
                        padding: 30px;
                        text-align: center;
                        border-bottom: 3px solid #34495e;
                      }
                      
                      .header h1 {
                        font-size: 1.8rem;
                        font-weight: 500;
                        margin-bottom: 5px;
                      }
                      
                      .header .subtitle {
                        font-size: 0.9rem;
                        opacity: 0.8;
                        font-weight: 300;
                      }
                      
                      .content {
                        padding: 30px;
                      }
                      
                      .section {
                        margin-bottom: 25px;
                      }
                      
                      .section-title {
                        font-size: 1.1rem;
                        font-weight: 500;
                        color: #2c3e50;
                        margin-bottom: 15px;
                        padding-bottom: 8px;
                        border-bottom: 2px solid #ecf0f1;
                      }
                      
                      .info-grid {
                        display: grid;
                        grid-template-columns: 1fr 1fr;
                        gap: 20px;
                        margin-bottom: 25px;
                      }
                      
                      .info-box {
                        background: #f8f9fa;
                        border: 1px solid #e9ecef;
                        padding: 20px;
                      }
                      
                      .info-item {
                        margin: 8px 0;
                        padding: 5px 0;
                      }
                      
                      .info-item strong {
                        color: #495057;
                        font-weight: 500;
                        min-width: 70px;
                        display: inline-block;
                      }
                      
                      .product-info {
                        background: white;
                        border: 1px solid #e9ecef;
                        padding: 20px;
                        margin-bottom: 15px;
                      }
                      
                      .product-title {
                        font-size: 1rem;
                        font-weight: 500;
                        color: #2c3e50;
                        margin-bottom: 15px;
                        padding-bottom: 8px;
                        border-bottom: 1px solid #ecf0f1;
                      }
                      
                      .date-info {
                        background: #ecf0f1;
                        padding: 10px 15px;
                        border-left: 4px solid #2c3e50;
                        margin-bottom: 20px;
                      }
                      
                      .date-info strong {
                        color: #2c3e50;
                        font-weight: 500;
                      }
                      
                      .customer-info {
                        background: #f8f9fa;
                        border: 1px solid #e9ecef;
                        padding: 20px;
                        margin-top: 25px;
                      }
                    </style>
                  </head>
                  <body>
                    <div class="container">
                      <div class="header">
                        <h1>${title}</h1>
                        <div class="subtitle">After Service Request Form</div>
                      </div>
                      
                      <div class="content">
                        <div class="section">
                          <div class="section-title">AS신청일</div>
                          <div class="date-info">
                            <strong>신청일:</strong> ${today}
                          </div>
                        </div>
                        
                        <div class="info-grid">
                          <div class="info-box">
                            <div class="section-title">수신</div>
                            <div class="info-item"><strong>거래처명:</strong> ${specificRequest ? specificRequest.processingMethod : '거래처명'}</div>
                            <div class="info-item"><strong>전화번호:</strong> ${companyInfo?.contact || '전화번호'}</div>
                            <div class="info-item"><strong>FAX번호:</strong> ${companyInfo?.fax || 'FAX번호'}</div>
                            <div class="info-item"><strong>담당자명:</strong> 담당자명</div>
                          </div>
                          
                          <div class="info-box">
                            <div class="section-title">발신</div>
                            <div class="info-item"><strong>회사명:</strong> ${companyInfo?.name || '회사명'}</div>
                            <div class="info-item"><strong>연락처:</strong> ${companyInfo?.contact || '연락처'}</div>
                          </div>
                        </div>
                        
                        <div class="section">
                          <div class="section-title">AS제품정보</div>
                          ${requestsToPrint.map((request, index) => `
                            <div class="product-info">
                              <div class="product-title">제품 ${specificRequest ? '' : `${index + 1}`}</div>
                              <div class="info-item"><strong>납품일:</strong> ${currentOrder.installationDate || '납품일'}</div>
                              <div class="info-item"><strong>제품정보:</strong> ${request.selectedProducts.join(', ')}</div>
                              <div class="info-item"><strong>문제점:</strong> ${request.problem}</div>
                              <div class="info-item"><strong>해결방안:</strong> ${request.solution}</div>
                              <div class="info-item"><strong>메모:</strong> ${request.memo}</div>
                            </div>
                          `).join('')}
                        </div>
                        
                        <div class="customer-info">
                          <div class="section-title">고객정보</div>
                          <div class="info-item"><strong>고객명:</strong> ${currentOrder.customerName}</div>
                          <div class="info-item"><strong>연락처:</strong> ${currentOrder.contact}</div>
                          <div class="info-item"><strong>주소:</strong> ${currentOrder.address}</div>
                        </div>
                      </div>
                    </div>
                  </body>
                </html>
              `);
              printWindow.document.close();
              
              // html2canvas로 이미지 생성 후 PDF로 변환
              setTimeout(async () => {
                try {
                  const container = printWindow.document.querySelector('.container');
                  if (!container) {
                    throw new Error('Container element not found');
                  }
                  const canvas = await html2canvas(container as HTMLElement, {
                    scale: 2,
                    useCORS: true,
                    allowTaint: true,
                    backgroundColor: null,
                    logging: false
                  });
                  
                  const imgData = canvas.toDataURL('image/png', 1.0);
                  const pdf = new jsPDF('p', 'mm', 'a4');
                  const imgWidth = 210; // A4 너비
                  const pageHeight = 295; // A4 높이
                  const imgHeight = (canvas.height * imgWidth) / canvas.width;
                  let heightLeft = imgHeight;
                  let position = 0;
                  
                  pdf.addImage(imgData, 'JPEG', 0, position, imgWidth, imgHeight);
                  heightLeft -= pageHeight;
                  
                  while (heightLeft >= 0) {
                    position = heightLeft - imgHeight;
                    pdf.addPage();
                    pdf.addImage(imgData, 'JPEG', 0, position, imgWidth, imgHeight);
                    heightLeft -= pageHeight;
                  }
                  
                  pdf.save(`${title}_${today}.pdf`);
                  printWindow.close();
                  setSnackbarMessage('PDF 문서가 다운로드되었습니다.');
                  setSnackbarOpen(true);
                } catch (error) {
                  console.error('PDF 생성 실패:', error);
                  setSnackbarMessage('PDF 생성에 실패했습니다.');
                  setSnackbarOpen(true);
                  printWindow.close();
                }
              }, 1000);
            }
          } catch (error) {
            console.error('PDF 출력 실패:', error);
            setSnackbarMessage('PDF 출력에 실패했습니다.');
            setSnackbarOpen(true);
          }
          break;
        case 'kakao':
          // 카톡전송 (카카오톡 공유 API 사용)
          try {
            const today = new Date().toLocaleDateString('ko-KR');
            const title = specificRequest ? `AS신청서 (${specificRequest.processingMethod})` : 'AS접수내역 (전체)';
            
            // 카카오톡 공유를 위한 텍스트 생성
            const shareText = `${title}\n\n` +
              `AS신청일: ${today}\n` +
              `고객명: ${currentOrder.customerName}\n` +
              `연락처: ${currentOrder.contact}\n` +
              `주소: ${currentOrder.address}\n\n` +
              `AS제품정보:\n` +
              requestsToPrint.map((request, index) => 
                `제품 ${specificRequest ? '' : `${index + 1}`}\n` +
                `납품일: ${currentOrder.installationDate || '납품일'}\n` +
                `제품정보: ${request.selectedProducts.join(', ')}\n` +
                `문제점: ${request.problem}\n` +
                `해결방안: ${request.solution}\n` +
                `메모: ${request.memo}`
              ).join('\n\n');
            
            // 카카오톡 공유 URL 생성
            const shareUrl = `https://story.kakao.com/share?url=${encodeURIComponent(window.location.href)}&text=${encodeURIComponent(shareText)}`;
            
            // 새 창에서 카카오톡 공유 페이지 열기
            window.open(shareUrl, '_blank', 'width=600,height=400');
            
            setSnackbarMessage('카카오톡 공유 페이지가 열렸습니다.');
            setSnackbarOpen(true);
          } catch (error) {
            console.error('카톡전송 실패:', error);
            setSnackbarMessage('카톡전송에 실패했습니다.');
            setSnackbarOpen(true);
          }
          break;
      }

      handleCloseASPrintModal();
    } catch (error) {
      console.error('AS접수 출력 실패:', error);
      setSnackbarMessage('AS접수 출력에 실패했습니다.');
      setSnackbarOpen(true);
    }
  };
  // AS상태 편집 저장
  const handleSaveASEdit = () => {
    if (!selectedASRequest) return;

    try {
      const orderNo = selectedASRequest.orderNo;
      const currentOrderASRequests = asRequests[orderNo] || [];
      const updatedASRequests = currentOrderASRequests.map(request => 
        request.id === selectedASRequest.id 
          ? { 
              ...request, 
              asRequestDate: editingASRequest.asRequestDate || request.asRequestDate,
              selectedProducts: editingASRequest.selectedProducts || request.selectedProducts,
              processingMethod: editingASRequest.processingMethod || request.processingMethod,
              problem: editingASRequest.problem || request.problem,
              solution: editingASRequest.solution || request.solution,
              cost: editingASRequest.cost || request.cost,
              memo: editingASRequest.memo || request.memo,
              status: editingASRequest.status || request.status,
              asProcessDate: editingASRequest.asProcessDate || request.asProcessDate
            }
          : request
      );

      const updatedASRequestsData = {
        ...asRequests,
        [orderNo]: updatedASRequests
      };
      
      localStorage.setItem('asRequests', JSON.stringify(updatedASRequestsData));
      setAsRequests(updatedASRequestsData);
      
      handleCloseASEditModal();
      setSnackbarMessage('AS접수내역이 수정되었습니다.');
      setSnackbarOpen(true);
    } catch (error) {
      console.error('AS접수내역 수정 실패:', error);
      setSnackbarMessage('AS접수내역 수정에 실패했습니다.');
      setSnackbarOpen(true);
    }
  };

  // 수금내역 저장
  const handleSavePaymentRecord = () => {
    if (!selectedOrderForPayment) return;

    try {
      const newPaymentRecord: PaymentRecord = {
        id: Date.now(),
        orderId: selectedOrderForPayment.id,
        orderNo: selectedOrderForPayment.estimateNo,
        paymentDate: paymentRecord.paymentDate || getLocalDate(),
        paymentMethod: paymentRecord.paymentMethod || '',
        amount: paymentRecord.amount || 0,
        remainingAmount: paymentRecord.remainingAmount || 0,
        createdAt: new Date().toISOString()
      };

      const orderNo = selectedOrderForPayment.estimateNo;
      const currentOrderPaymentRecords = paymentRecords[orderNo] || [];
      const updatedPaymentRecords = {
        ...paymentRecords,
        [orderNo]: [...currentOrderPaymentRecords, newPaymentRecord]
      };
      localStorage.setItem('paymentRecords', JSON.stringify(updatedPaymentRecords));
      setPaymentRecords(updatedPaymentRecords);
      
      setPaymentModalOpen(false);
      setSnackbarMessage('수금내역이 저장되었습니다.');
      setSnackbarOpen(true);
    } catch (error) {
      console.error('수금내역 저장 실패:', error);
      setSnackbarMessage('수금내역 저장에 실패했습니다.');
      setSnackbarOpen(true);
    }
  };

  // 모바일 길게 누르기 타이머 상태
  const [longPressTimer, setLongPressTimer] = useState<NodeJS.Timeout | null>(null);
  const [longPressTarget, setLongPressTarget] = useState<{rowIndex: number, row: any} | null>(null);

  // 모바일 터치 시작 핸들러 (제품 행용)
  const handleTouchStart = (rowIndex: number, row: any) => {
    const timer = setTimeout(() => {
      console.log('모바일 길게 누르기 감지:', row);
      
      // 블라인드 제품인 경우 나누기 메뉴를 포함한 컨텍스트 메뉴 표시
      if (row.productType === '블라인드' && row.type === 'product') {
        setContextMenu({
          mouseX: 50, // 모바일에서는 화면 중앙에 표시
          mouseY: 50,
          order: orders[activeTab],
          selectedRow: row
        });
      } else {
        // 기존 행 컨텍스트 메뉴
        setRowContextMenu({
          mouseX: 50, // 모바일에서는 화면 중앙에 표시
          mouseY: 50,
          rowIndex: rowIndex,
          row: row,
        });
      }
      
      setLongPressTarget(null);
    }, 500); // 500ms로 길게 누르는 시간 단축
    
    setLongPressTimer(timer);
    setLongPressTarget({rowIndex, row});
  };

  // 모바일 터치 시작 핸들러 (저장된 주문서용)
  const handleSavedOrderTouchStart = (order: any) => {
    const timer = setTimeout(() => {
      console.log('모바일 길게 누르기 감지 (저장된 주문서):', order);
      
      setContextMenu({
        mouseX: 50, // 모바일에서는 화면 중앙에 표시
        mouseY: 50,
        order: order,
      });
      
      setLongPressTarget(null);
    }, 500); // 500ms로 길게 누르는 시간 단축
    
    setLongPressTimer(timer);
    setLongPressTarget({rowIndex: -1, row: order});
  };

  // 모바일 터치 시작 핸들러 (주문서 탭용)
  const handleTabTouchStart = (orderIndex: number) => {
    const timer = setTimeout(() => {
      console.log('모바일 길게 누르기 감지 (주문서 탭):', orderIndex);
      
      setTabContextMenu({
        mouseX: 50, // 모바일에서는 화면 중앙에 표시
        mouseY: 50,
        orderIndex: orderIndex,
      });
      
      setLongPressTarget(null);
    }, 500); // 500ms로 길게 누르는 시간 단축
    
    setLongPressTimer(timer);
    setLongPressTarget({rowIndex: -2, row: {orderIndex}}); // -2는 주문서 탭을 의미
  };

  // 모바일 터치 종료 핸들러
  const handleTouchEnd = () => {
    if (longPressTimer) {
      clearTimeout(longPressTimer);
      setLongPressTimer(null);
    }
    setLongPressTarget(null);
  };

  // 행 우클릭 메뉴 핸들러 (웹용)
  const handleRowContextMenu = (event: React.MouseEvent, rowIndex: number, row: any) => {
    event.preventDefault();
    console.log('행 우클릭 메뉴:', row);
    
    // 블라인드 제품인 경우 나누기 메뉴를 포함한 컨텍스트 메뉴 표시
    if (row.productType === '블라인드' && row.type === 'product') {
      setContextMenu({
        mouseX: event.clientX + 2,
        mouseY: event.clientY - 6,
        order: orders[activeTab],
        selectedRow: row
      });
    } else {
      // 기존 행 컨텍스트 메뉴
      setRowContextMenu({
        mouseX: event.clientX + 2,
        mouseY: event.clientY - 6,
        rowIndex: rowIndex,
        row: row,
      });
    }
  };

  const handleCloseRowContextMenu = () => {
    setRowContextMenu(null);
  };

  // 저장된 주문서 우클릭 메뉴 핸들러
  const handleSavedOrderContextMenu = (event: React.MouseEvent, order: any) => {
    event.preventDefault();
    setContextMenu({
      mouseX: event.clientX + 2,
      mouseY: event.clientY - 6,
      order: order,
    });
  };

  const handleCloseContextMenu = () => {
    setContextMenu(null);
  };

  // 주문서 탭 컨텍스트 메뉴 핸들러들
  const handleTabContextMenu = (event: React.MouseEvent, orderIndex: number) => {
    event.preventDefault();
    setTabContextMenu({
      mouseX: event.clientX + 2,
      mouseY: event.clientY - 6,
      orderIndex
    });
  };

  const handleCloseTabContextMenu = () => {
    setTabContextMenu(null);
  };

  const handleTabContextMenuAction = (action: string) => {
    if (!tabContextMenu) return;

    const orderIndex = tabContextMenu.orderIndex;
    const order = orders[orderIndex];

    switch (action) {
      case 'save':
        // 현재 주문서 저장
        handleSaveOrder();
        break;
      case 'saveAsNew':
        // 새 주문서로 저장
        handleSaveAsNewOrder();
        break;
      case 'copy':
        // 주문서 복사
        const copiedOrder = { ...order };
        copiedOrder.id = Date.now();
        copiedOrder.estimateNo = generateOrderNo(orders);
        copiedOrder.estimateDate = getLocalDate();
        copiedOrder.rows = copiedOrder.rows?.map((row: any) => ({
          ...row,
          id: Date.now().toString() + Math.random().toString(36).substr(2, 9)
        })) || [];
        
        // 수금내역 및 AS접수내역도 복사
        if (paymentRecords[order.estimateNo]) {
          paymentRecords[order.estimateNo].forEach((record: any) => {
            const copiedRecord = { ...record };
            copiedRecord.id = Date.now().toString() + Math.random().toString(36).substr(2, 9);
            copiedRecord.estimateNo = copiedOrder.estimateNo;
            
            if (!paymentRecords[copiedOrder.estimateNo]) {
              paymentRecords[copiedOrder.estimateNo] = [];
            }
            paymentRecords[copiedOrder.estimateNo].push(copiedRecord);
          });
        }
        
        // AS접수내역 복사
        if (asRequests[order.estimateNo]) {
          asRequests[order.estimateNo].forEach((request: any) => {
            const copiedRequest = { ...request };
            copiedRequest.id = Date.now().toString() + Math.random().toString(36).substr(2, 9);
            copiedRequest.estimateNo = copiedOrder.estimateNo;
            
            if (!asRequests[copiedOrder.estimateNo]) {
              asRequests[copiedOrder.estimateNo] = [];
            }
            asRequests[copiedOrder.estimateNo].push(copiedRequest);
          });
        }
        
        const newOrders = [...orders, copiedOrder];
        setOrders(newOrders);
        setActiveTab(newOrders.length - 1);
        setIsOrderEditMode(true);
        setSnackbarMessage('주문서가 복사되었습니다.');
        break;
      case 'delete':
        // 주문서 삭제
        if (orders.length > 1) {
          const newOrders = orders.filter((_, index) => index !== orderIndex);
          setOrders(newOrders);
          if (activeTab >= orderIndex) {
            setActiveTab(Math.max(0, activeTab - 1));
          }
          setIsOrderEditMode(newOrders.length > 0);
          setSnackbarMessage('주문서가 삭제되었습니다.');
        }
        break;
    }
    setTabContextMenu(null);
  };

  // 우클릭 메뉴 액션 핸들러
  const handleContextMenuAction = (action: string) => {
    if (!contextMenu) return;

    const { order } = contextMenu;
    
    switch (action) {
      case 'load':
        handleLoadSavedOrder(order);
        break;
      case 'payment':
        handleOpenPaymentModal(order);
        break;
      case 'as':
        handleOpenASModal(order);
        break;
      case 'copy':
        // 주문서 복사 로직
        const newOrderNo = generateOrderNo(orders);
        const copiedOrder = {
          ...order,
          id: `order_${Date.now()}`,
          estimateNo: newOrderNo, // orders만 전달 (saved_orders는 함수 내부에서 확인)
          savedAt: new Date().toISOString(),
          savedDate: getLocalDate(),
          // 할인 설정도 복사
          discountAmount: order.discountAmount || '',
          discountRate: order.discountRate || '',
          discountedTotalInput: order.discountedTotalInput || '',
          // 할인후금액도 복사
          discountedAmount: order.discountedAmount,
          // 발주서도 복사
          vendorPurchaseOrders: order.vendorPurchaseOrders || [],
        };

        // 수금내역 및 AS접수내역도 복사
        const originalOrderNo = order.estimateNo;
        const newOrderNoKey = newOrderNo;
        
        // 수금내역 복사
        if (paymentRecords[originalOrderNo]) {
          const copiedPaymentRecords = {
            ...paymentRecords,
            [newOrderNoKey]: paymentRecords[originalOrderNo].map(record => ({
              ...record,
              id: Date.now() + Math.floor(Math.random() * 1000),
              orderNo: newOrderNoKey,
              createdAt: new Date().toISOString()
            })) as PaymentRecord[]
          };
          setPaymentRecords(copiedPaymentRecords);
          localStorage.setItem('paymentRecords', JSON.stringify(copiedPaymentRecords));
        }
        
        // AS접수내역 복사
        if (asRequests[originalOrderNo]) {
          const copiedASRequests = {
            ...asRequests,
            [newOrderNoKey]: asRequests[originalOrderNo].map(request => ({
              ...request,
              id: Date.now() + Math.floor(Math.random() * 1000),
              orderNo: newOrderNoKey,
              createdAt: new Date().toISOString()
            })) as ASRequest[]
          };
          setAsRequests(copiedASRequests);
          localStorage.setItem('asRequests', JSON.stringify(copiedASRequests));
        }
        const updatedSavedOrders = [...savedOrders, copiedOrder];
        localStorage.setItem('saved_orders', JSON.stringify(updatedSavedOrders));
        setSavedOrders(updatedSavedOrders);
        setSnackbarMessage('주문서가 복사되었습니다.');
        setSnackbarOpen(true);
        break;
      case 'delete':
        if (window.confirm('정말로 이 주문서를 삭제하시겠습니까?')) {
          const updatedSavedOrders = savedOrders.filter(o => o.id !== order.id);
          localStorage.setItem('saved_orders', JSON.stringify(updatedSavedOrders));
          setSavedOrders(updatedSavedOrders);
          setSnackbarMessage('주문서가 삭제되었습니다.');
          setSnackbarOpen(true);
        }
        break;
    }
    
    setContextMenu(null);
  };

  // 일괄변경 모드에서 제품 위로 이동
  const moveBulkEditProductUp = () => {
    console.log('moveBulkEditProductUp 호출됨');
    const currentRows = orders[activeTab]?.rows || [];
    const selectedIndices = Array.from(selectedOrderRows).sort((a, b) => a - b);
    
    console.log('selectedIndices:', selectedIndices);
    console.log('currentRows:', currentRows);
    
    if (selectedIndices.length === 0) return;
    
    // 배열 범위 체크
    const validIndices = selectedIndices.filter(index => 
      index >= 0 && index < currentRows.length
    );
    
    if (validIndices.length === 0) {
      console.log('유효한 인덱스가 없음');
      setSnackbarMessage('유효하지 않은 선택입니다.');
      setSnackbarOpen(true);
      return;
    }
    
    // 제품 그룹들을 찾기
    const productGroups = getProductGroups(currentRows);
    console.log('productGroups:', productGroups);
    
    // 선택된 제품 그룹 찾기
    const selectedProductGroups: number[] = [];
    productGroups.forEach((group, groupIndex) => {
      const groupIndices: number[] = [];
      for (let i = group.startIndex; i <= group.endIndex; i++) {
        groupIndices.push(i);
      }
      
      // 선택된 인덱스와 겹치는지 확인
      const hasSelectedItems = validIndices.some(index => groupIndices.includes(index));
      if (hasSelectedItems) {
        selectedProductGroups.push(groupIndex);
      }
    });
    
    console.log('selectedProductGroups:', selectedProductGroups);
    
    if (selectedProductGroups.length === 0) {
      console.log('선택된 제품 그룹이 없음');
      setSnackbarMessage('이동할 제품 그룹이 없습니다.');
      setSnackbarOpen(true);
      return;
    }
    
    // 가장 작은 그룹 인덱스 찾기
    const minGroupIndex = Math.min(...selectedProductGroups);
    console.log('minGroupIndex:', minGroupIndex);
    
    if (minGroupIndex <= 0) {
      console.log('이미 맨 위에 있음');
      return; // 이미 맨 위에 있음
    }
    
    // 현재 그룹과 이전 그룹의 범위
    const currentGroup = productGroups[minGroupIndex] as { product: any; options: any[]; startIndex: number; endIndex: number };
    const prevGroup = productGroups[minGroupIndex - 1] as { product: any; options: any[]; startIndex: number; endIndex: number };
    
    console.log(`그룹 ${minGroupIndex}를 그룹 ${minGroupIndex - 1} 앞으로 이동`);
    
    // 현재 그룹의 모든 항목들을 제거
    const newRows = [...currentRows];
    const currentGroupItems = newRows.slice(currentGroup.startIndex, currentGroup.endIndex + 1);
    newRows.splice(currentGroup.startIndex, currentGroup.endIndex - currentGroup.startIndex + 1);
    
    // 이전 그룹 앞에 현재 그룹 삽입
    newRows.splice(prevGroup.startIndex, 0, ...currentGroupItems);
    
    console.log('이동 완료');
    
    // 주문서 업데이트
    const updatedOrder = { ...orders[activeTab], rows: newRows };
    const updatedOrders = [...orders];
    updatedOrders[activeTab] = updatedOrder;
    setOrders(updatedOrders);
    
    // 선택된 인덱스 업데이트 (제품 그룹 단위)
    const newSelectedIndices = new Set<number>();
    const movedGroupSize = currentGroup.endIndex - currentGroup.startIndex + 1;
    const newStartIndex = prevGroup.startIndex;
    
    for (let i = 0; i < movedGroupSize; i++) {
      newSelectedIndices.add(newStartIndex + i);
    }
    setSelectedOrderRows(newSelectedIndices);
    
    setSnackbarMessage('선택된 제품 그룹이 위로 이동되었습니다.');
    setSnackbarOpen(true);
  };

  // 일괄변경 모드 종료
  const exitBulkEditMode = () => {
    setIsBulkEditMode(false);
    setSelectedOrderRows(new Set<number>());
    setSnackbarMessage('일괄변경 모드가 종료되었습니다.');
    setSnackbarOpen(true);
  };

  // 일괄변경 모드에서 제품 아래로 이동
  const moveBulkEditProductDown = () => {
    console.log('moveBulkEditProductDown 함수 시작');
    const currentRows = orders[activeTab]?.rows || [];
    const selectedIndices = Array.from(selectedOrderRows).sort((a, b) => a - b);
    
    console.log('currentRows:', currentRows);
    console.log('selectedIndices:', selectedIndices);
    console.log('selectedIndices.length:', selectedIndices.length);
    
    if (selectedIndices.length === 0) {
      console.log('selectedIndices가 비어있음');
      return;
    }
    
    // 배열 범위 체크
    const validIndices = selectedIndices.filter(index => 
      index >= 0 && index < currentRows.length
    );
    
    if (validIndices.length === 0) {
      console.log('유효한 인덱스가 없음');
      setSnackbarMessage('유효하지 않은 선택입니다.');
      setSnackbarOpen(true);
      return;
    }
    
    // 제품 그룹들을 찾기
    const productGroups = getProductGroups(currentRows);
    console.log('productGroups:', productGroups);
    
    // 선택된 제품 그룹 찾기
    const selectedProductGroups: number[] = [];
    productGroups.forEach((group, groupIndex) => {
      const groupIndices: number[] = [];
      for (let i = group.startIndex; i <= group.endIndex; i++) {
        groupIndices.push(i);
      }
      
      // 선택된 인덱스와 겹치는지 확인
      const hasSelectedItems = validIndices.some(index => groupIndices.includes(index));
      if (hasSelectedItems) {
        selectedProductGroups.push(groupIndex);
      }
    });
    
    console.log('selectedProductGroups:', selectedProductGroups);
    
    if (selectedProductGroups.length === 0) {
      console.log('선택된 제품 그룹이 없음');
      setSnackbarMessage('이동할 제품 그룹이 없습니다.');
      setSnackbarOpen(true);
      return;
    }
    
    // 가장 큰 그룹 인덱스 찾기
    const maxGroupIndex = Math.max(...selectedProductGroups);
    console.log('maxGroupIndex:', maxGroupIndex);
    
    if (maxGroupIndex >= productGroups.length - 1) {
      console.log('이미 맨 아래에 있음');
      return; // 이미 맨 아래에 있음
    }
    
    // 현재 그룹과 다음 그룹의 범위
    const currentGroup = productGroups[maxGroupIndex] as { product: any; options: any[]; startIndex: number; endIndex: number };
    const nextGroup = productGroups[maxGroupIndex + 1] as { product: any; options: any[]; startIndex: number; endIndex: number };
    
    console.log(`그룹 ${maxGroupIndex}를 그룹 ${maxGroupIndex + 1} 뒤로 이동`);
    
    // 현재 그룹의 모든 항목들을 제거
    const newRows = [...currentRows];
    const currentGroupItems = newRows.slice(currentGroup.startIndex, currentGroup.endIndex + 1);
    newRows.splice(currentGroup.startIndex, currentGroup.endIndex - currentGroup.startIndex + 1);
    
    // 다음 그룹 뒤에 현재 그룹 삽입
    newRows.splice(nextGroup.endIndex + 1, 0, ...currentGroupItems);
    
    console.log('이동 완료');
    
    // 주문서 업데이트
    const updatedOrder = { ...orders[activeTab], rows: newRows };
    const updatedOrders = [...orders];
    updatedOrders[activeTab] = updatedOrder;
    setOrders(updatedOrders);
    
    // 선택된 인덱스 업데이트 (제품 그룹 단위)
    const newSelectedIndices = new Set<number>();
    const movedGroupSize = currentGroup.endIndex - currentGroup.startIndex + 1;
    const newStartIndex = nextGroup.endIndex + 1;
    
    for (let i = 0; i < movedGroupSize; i++) {
      newSelectedIndices.add(newStartIndex + i);
    }
    setSelectedOrderRows(newSelectedIndices);
    
    setSnackbarMessage('선택된 제품 그룹이 아래로 이동되었습니다.');
    setSnackbarOpen(true);
  };

  // 우클릭 메뉴에서 일괄변경 시작하는 함수
  const handleBulkEditFromContextMenu = (rowIndex: number) => {
    // 해당 행이 제품인지 확인
    const currentRows = orders[activeTab]?.rows || [];
    const targetRow = currentRows[rowIndex];
    
    if (targetRow.type !== 'product') {
      alert('제품에만 일괄변경을 적용할 수 있습니다.');
      return;
    }

    // 같은 공간명을 가진 제품들을 찾아서 선택
    const targetSpace = targetRow.space || '';
    
    if (!targetSpace) {
      alert('공간명이 없어서 일괄변경을 적용할 수 없습니다.');
      return;
    }

    // 같은 공간명을 가진 제품들의 인덱스를 찾아서 선택
    const selectedIndices = new Set<number>();
    
    currentRows.forEach((row, index) => {
      if (row.type === 'product' && row.space === targetSpace) {
        selectedIndices.add(index);
      }
    });

    if (selectedIndices.size === 0) {
      alert('일괄변경할 제품을 찾을 수 없습니다.');
      return;
    }

    // 일괄변경 모드 활성화 및 제품 선택
    console.log('일괄변경 모드 활성화');
    console.log('selectedIndices:', selectedIndices);
    console.log('selectedIndices.size:', selectedIndices.size);
    
    setIsBulkEditMode(true);
    setSelectedOrderRows(selectedIndices);
    
    setSnackbarMessage(`${targetSpace} 공간의 제품들이 일괄변경 모드로 선택되었습니다.`);
    setSnackbarOpen(true);
  };

  // 특정 제품 행에 옵션 추가하는 함수
  const handleAddOption = (rowIndex: number) => {
    // 해당 행이 제품인지 확인
    const currentRows = orders[activeTab]?.rows || [];
    const targetRow = currentRows[rowIndex];
    
    if (targetRow.type !== 'product') {
      alert('제품에만 옵션을 추가할 수 있습니다.');
      return;
    }

    // 옵션 추가 모달 열기
    setOptionDialogOpen(true);
    setSnackbarMessage(`${targetRow.productName}에 옵션을 추가할 수 있습니다.`);
    setSnackbarOpen(true);
  };

  const handleRowContextMenuAction = (action: string) => {
    if (!rowContextMenu) return;

    const { rowIndex, row } = rowContextMenu;
    
    switch (action) {
      case 'edit':
        // 옵션인 경우 옵션 수정 모달 열기
        if (row.type === 'option') {
          setEditingOption(row);
          setEditOptionQuantity(row.quantity || 1);
          setEditOptionDialogOpen(true);
        } else {
          // 제품인 경우 제품 정보 수정 모달 열기
          handleEditRow(rowIndex);
        }
        break;
      case 'productSearch':
        // 제품검색 모달 열기 (제품인 경우에만)
        if (row.type === 'product') {
          setSelectedRowIndex(rowIndex);
          setProductDialogOpen(true);
        }
        break;
      case 'addOption':
        handleAddOption(rowIndex);
        break;
      case 'bulkEdit':
        handleBulkEditFromContextMenu(rowIndex);
        break;
      case 'copy':
        handleCopyRow(rowIndex);
        break;
      case 'delete':
        handleDeleteRow(rowIndex);
        break;
    }
    
    setRowContextMenu(null);
  };

  // 블라인드 나누기 컨텍스트 메뉴 액션 핸들러
  const handleBlindContextMenuAction = (action: string) => {
    console.log('handleBlindContextMenuAction 호출됨:', action);
    console.log('contextMenu:', contextMenu);
    console.log('selectedRow:', contextMenu?.selectedRow);
    
    if (!contextMenu?.selectedRow) {
      console.log('selectedRow가 없음');
      return;
    }

    const selectedRow = contextMenu.selectedRow;
    console.log('selectedRow:', selectedRow);
    
    switch (action) {
      case 'divideSplit':
        setSelectedRowForDivide(selectedRow);
        setDivideType('split');
        setDivideModalOpen(true);
        break;
      case 'divideCopy':
        setSelectedRowForDivide(selectedRow);
        setDivideType('copy');
        setDivideModalOpen(true);
        break;
      case 'edit':
        // 제품 정보 수정 모달 열기
        const rowIndex = orders[activeTab]?.rows?.findIndex((r: any) => r.id === selectedRow.id);
        if (rowIndex !== undefined && rowIndex !== -1) {
          handleEditRow(rowIndex);
        }
        break;
      case 'addOption':
        // 옵션 추가
        const addOptionRowIndex = orders[activeTab]?.rows?.findIndex((r: any) => r.id === selectedRow.id);
        if (addOptionRowIndex !== undefined && addOptionRowIndex !== -1) {
          handleAddOption(addOptionRowIndex);
        }
        break;
      case 'bulkEdit':
        // 일괄변경
        const bulkEditRowIndex = orders[activeTab]?.rows?.findIndex((r: any) => r.id === selectedRow.id);
        if (bulkEditRowIndex !== undefined && bulkEditRowIndex !== -1) {
          handleBulkEditFromContextMenu(bulkEditRowIndex);
        }
        break;
      case 'copy':
        // 복사
        const copyRowIndex = orders[activeTab]?.rows?.findIndex((r: any) => r.id === selectedRow.id);
        if (copyRowIndex !== undefined && copyRowIndex !== -1) {
          handleCopyRow(copyRowIndex);
        }
        break;
      case 'delete':
        // 제품 삭제
        const deleteRowIndex = orders[activeTab]?.rows?.findIndex((r: any) => r.id === selectedRow.id);
        if (deleteRowIndex !== undefined && deleteRowIndex !== -1) {
          handleDeleteRow(deleteRowIndex);
        }
        break;
    }
    
    setContextMenu(null);
  };

  // 제품 정보 수정 모달 핸들러들
  // 세부내용 전용 핸들러
  const handleDetailsChange = (value: string) => {
    setEditRow((prev: any) => ({ ...prev, details: value }));
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
  // 공간명 자동 생성 함수
  const generateSpaceNames = (baseSpaceName: string, count: number): string[] => {
    const spaceNames: string[] = [];
    const currentOrder = orders[activeTab];
    const existingSpaces = currentOrder?.rows?.map((row: any) => row.space).filter(Boolean) || [];
    
    // 기존 공간명에서 하이픈(-) 뒤의 번호가 있는 것들을 찾아서 최대 번호 확인
    // 예: "중간방2-1", "중간방2-2" 등의 패턴 매칭
    const baseNameRegex = new RegExp(`^${baseSpaceName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}-(\\d+)$`);
    const existingNumbers = existingSpaces
      .map(space => {
        const match = space.match(baseNameRegex);
        return match ? parseInt(match[1]) : 0;
      })
      .filter(num => num > 0)
      .sort((a, b) => a - b);
    
    // 다음 번호부터 시작
    let nextNumber = 1;
    if (existingNumbers.length > 0) {
      nextNumber = Math.max(...existingNumbers) + 1;
    }
    
    // 새로운 공간명들 생성 (하이픈 사용)
    for (let i = 0; i < count; i++) {
      spaceNames.push(`${baseSpaceName}-${nextNumber + i}`);
    }
    
    return spaceNames;
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
    const currentOrder = orders[activeTab];
    const originalIndex = currentOrder.rows.findIndex((r: any) => r.id === originalRow.id);
    
    console.log('originalRow:', originalRow);
    console.log('currentOrder:', currentOrder);
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
        
        // 세부내용 업데이트
        newProduct.details = updateDetailsInRealTime(newProduct);
        
        // 총 금액, 원가, 마진 재계산
        const quantity = Number(newProduct.quantity) || 1;
        const areaNum = Number(newProduct.area) || 0;
        
        // 총 판매가 계산
        let basePrice = 0;
        if (newProduct.salePrice && areaNum) {
          basePrice = Math.round(newProduct.salePrice * areaNum);
        } else if (newProduct.salePrice) {
          basePrice = newProduct.salePrice;
        }
        newProduct.totalPrice = basePrice * quantity;
        
        // 총 원가 계산
        let baseCost = 0;
        if (newProduct.purchaseCost && areaNum) {
          baseCost = Math.round(newProduct.purchaseCost * areaNum);
        } else if (newProduct.purchaseCost) {
          baseCost = newProduct.purchaseCost;
        }
        newProduct.cost = baseCost * quantity;
        
        // 마진 계산
        newProduct.margin = Math.round(newProduct.totalPrice / 1.1 - newProduct.cost);
      }
      // copy 타입은 가로 사이즈 변경 없음
      
      // copy 타입의 경우에도 금액 재계산 (새로운 제품이므로)
      if (divideType === 'copy') {
        const quantity = Number(newProduct.quantity) || 1;
        const areaNum = Number(newProduct.area) || 0;
        
        // 총 판매가 계산
        let basePrice = 0;
        if (newProduct.salePrice && areaNum) {
          basePrice = Math.round(newProduct.salePrice * areaNum);
        } else if (newProduct.salePrice) {
          basePrice = newProduct.salePrice;
        }
        newProduct.totalPrice = basePrice * quantity;
        
        // 총 원가 계산
        let baseCost = 0;
        if (newProduct.purchaseCost && areaNum) {
          baseCost = Math.round(newProduct.purchaseCost * areaNum);
        } else if (newProduct.purchaseCost) {
          baseCost = newProduct.purchaseCost;
        }
        newProduct.cost = baseCost * quantity;
        
        // 마진 계산
        newProduct.margin = Math.round(newProduct.totalPrice / 1.1 - newProduct.cost);
      }
      
      dividedProducts.push(newProduct);
    }
    
    // 원본 제품 제거하고 나눈 제품들 삽입
    const newRows = [...currentOrder.rows];
    newRows.splice(originalIndex, 1, ...dividedProducts);
    
    // 주문서 업데이트
    const updatedOrder = { ...currentOrder, rows: newRows };
    const updatedOrders = [...orders];
    updatedOrders[activeTab] = updatedOrder;
    setOrders(updatedOrders);
    
    // 모달 닫기
    setDivideModalOpen(false);
    setContextMenu(null);
    setSelectedRowForDivide(null);
    
    // 성공 메시지
    const actionText = divideType === 'split' ? '분할' : '복사';
    setSnackbarMessage(`블라인드 제품이 ${divideCount}개로 ${actionText}되었습니다.`);
    setSnackbarOpen(true);
  };

  // 연결된 옵션들의 세부내용을 가져오는 함수
  const getConnectedOptionDetails = (rowData: any): string => {
    const currentOrder = orders[activeTab];
    if (!currentOrder?.rows) return '';

    // 현재 제품의 인덱스 찾기
    const currentIndex = currentOrder.rows.findIndex(r => r.id === rowData.id);
    if (currentIndex === -1) return '';

    const optionDetails: string[] = [];
    let i = currentIndex + 1;
    
    // 다음 제품을 만날 때까지 옵션들을 확인
    while (i < currentOrder.rows.length && currentOrder.rows[i].type === 'option') {
      const option = currentOrder.rows[i];
      const optionName = option.productName || '';
      const optionDetailsText = option.details || '';
      
             // 커튼 제품인 경우 커튼옵션만 필터링
      if (rowData.productType === '커튼' || rowData.curtainType) {
        if (option.productType === '커튼옵션') {
          if (optionDetailsText) {
            optionDetails.push(optionDetailsText);
          }
        }
      }
      // 블라인드 제품인 경우 블라인드옵션만 필터링
      else if (rowData.productType === '블라인드') {
        if (option.productType === '블라인드옵션') {
          if (optionDetailsText) {
            optionDetails.push(optionDetailsText);
          }
        }
      }
      i++;
    }

    return optionDetails.join(', ');
  };
  const handleEditChange = (field: string, value: any) => {
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
      
      // 주름타입 변경 시 폭수를 추천폭수로 리셋
      if (field === 'pleatType') {
        newEditRow.widthCount = 0; // 추천폭수 계산을 위해 0으로 리셋
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
      // 면적 계산 (블라인드는 이미 위에서 계산됨)
      let calculatedArea = newEditRow.area || 0;
      if (newEditRow.productType === '커튼') {
        if (newEditRow.curtainType === '속커튼') {
          if (newEditRow.pleatType === '민자') {
            const pleatMultiplier = Number(newEditRow.pleatMultiplier?.replace('배', '')) || 1.4;
            calculatedArea = (newEditRow.widthMM / 1000) * pleatMultiplier || 0;
          } else if (newEditRow.pleatType === '나비') {
            calculatedArea = newEditRow.widthMM / 1000 || 0;
          }
        } else {
          calculatedArea = (newEditRow.widthMM * newEditRow.heightMM) / 1000000 || 0;
        }
      } else {
        calculatedArea = (newEditRow.widthMM * newEditRow.heightMM) / 1000000 || 0;
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



    // 상태 업데이트 (무한 루프 방지)
    setEditRow(newEditRow);
  };
  const handleEditSave = () => {
    if (editRowIdx === null) return;
    const currentRows = orders[activeTab]?.rows || [];
    const newRows = [...currentRows];

    // 1. 다이얼로그의 수정된 정보로 시작
    const updatedRow = { ...editRow };



    // 2. 핵심 값들이 유효한 숫자인지 확인
    updatedRow.widthMM = Number(updatedRow.widthMM) || 0;
    updatedRow.heightMM = Number(updatedRow.heightMM) || 0;
    updatedRow.quantity = Number(updatedRow.quantity) || 1;

    // 3. 면적 계산 (견적서와 동일한 로직 적용)
    if (updatedRow.productType === '블라인드') {
      // 블라인드는 기본 면적 계산
      let calculatedArea = (updatedRow.widthMM * updatedRow.heightMM) / 1000000 || 0;
      
      // 블라인드 최소주문수량 적용
      const product = productOptions.find(p => p.productCode === updatedRow.productCode);
      if (product && product.minOrderQty) {
        const minOrderQty = Number(product.minOrderQty) || 0;
        if (minOrderQty > 0 && calculatedArea < minOrderQty) {
          calculatedArea = minOrderQty;
        }
      }
      updatedRow.area = calculatedArea;
    } else if (updatedRow.productType === '커튼') {
      if (updatedRow.curtainType === '속커튼') {
        if (updatedRow.pleatType === '민자') {
          // 속커튼 민자: (widthMM / 1000) × pleatMultiplier
          const pleatMultiplier = Number(updatedRow.pleatMultiplier?.replace('배', '')) || 1.4;
          updatedRow.area = (updatedRow.widthMM / 1000) * pleatMultiplier || 0;
        } else if (updatedRow.pleatType === '나비') {
          // 속커튼 나비: widthMM / 1000
          updatedRow.area = updatedRow.widthMM / 1000 || 0;
        }
      } else {
        // 겉커튼은 기본 면적 계산
        updatedRow.area = (updatedRow.widthMM * updatedRow.heightMM) / 1000000 || 0;
      }
    } else {
      // 기타 제품은 기본 면적 계산
      updatedRow.area = (updatedRow.widthMM * updatedRow.heightMM) / 1000000 || 0;
    }

    // 4. 최종 금액 및 원가 계산 (견적서와 동일한 로직 적용)
    // 판매금액 계산
    if (updatedRow.brand?.toLowerCase() === 'hunterdouglas') {
      // 헌터더글라스 제품: 판매단가 * 수량
      updatedRow.totalPrice = updatedRow.salePrice && updatedRow.quantity
        ? Math.round(updatedRow.salePrice * updatedRow.quantity)
        : 0;
    } else if (updatedRow.productType === '커튼' && updatedRow.curtainType === '겉커튼' && 
               (updatedRow.pleatType === '민자' || updatedRow.pleatType === '나비')) {
      // 겉커튼 민자, 나비: 제품등록 판매단가 * 폭수 * 수량
      const basePrice = updatedRow.salePrice && updatedRow.widthCount
        ? Math.round(updatedRow.salePrice * updatedRow.widthCount)
        : 0;
      updatedRow.totalPrice = basePrice && updatedRow.quantity
        ? Math.round(basePrice * updatedRow.quantity)
        : 0;
    } else if (updatedRow.productType === '커튼' && updatedRow.curtainType === '속커튼' && updatedRow.pleatType === '민자') {
      // 속커튼 민자: 대폭민자단가 * 면적(m2) * 수량
      const areaNum = Number(updatedRow.area);
      let priceToUse = updatedRow.largePlainPrice;
      
      // 대폭민자단가가 없으면 판매단가의 63% 사용
      if (!priceToUse) {
        priceToUse = updatedRow.salePrice ? updatedRow.salePrice * 0.63 : 0;
      }
      
      const basePrice = priceToUse && areaNum
        ? Math.round(priceToUse * areaNum)
        : 0;
      updatedRow.totalPrice = basePrice && updatedRow.quantity
        ? Math.round(basePrice * updatedRow.quantity)
        : 0;
    } else if (updatedRow.productType === '커튼' && updatedRow.curtainType === '속커튼' && updatedRow.pleatType === '나비') {
      // 속커튼 나비: 제품등록 판매단가 * 면적(m2) * 수량
      const areaNum = Number(updatedRow.area);
      const basePrice = updatedRow.salePrice && areaNum 
        ? Math.round(updatedRow.salePrice * areaNum) 
        : 0;
      updatedRow.totalPrice = basePrice && updatedRow.quantity
        ? Math.round(basePrice * updatedRow.quantity)
        : 0;
    } else if (updatedRow.productType === '블라인드') {
      // 블라인드: 제품등록 판매단가 * m2 * 수량
      const areaNum = Number(updatedRow.area);
      const basePrice = updatedRow.salePrice && areaNum 
        ? Math.round(updatedRow.salePrice * areaNum) 
        : 0;
      updatedRow.totalPrice = basePrice && updatedRow.quantity
        ? Math.round(basePrice * updatedRow.quantity)
        : 0;
    } else if (updatedRow.productType === '출장비' || updatedRow.productType === '시공' || updatedRow.productType === '서비스') {
      // 출장비, 시공 등 기타 제품: 판매단가 * 수량
      updatedRow.totalPrice = updatedRow.salePrice && updatedRow.quantity
        ? Math.round(updatedRow.salePrice * updatedRow.quantity)
        : 0;
    } else {
      // 기타 제품: 판매단가 * 수량 (기본 계산)
      updatedRow.totalPrice = updatedRow.salePrice && updatedRow.quantity
        ? Math.round(updatedRow.salePrice * updatedRow.quantity)
        : 0;
    }

    // 입고금액 계산
    if (updatedRow.brand?.toLowerCase() === 'hunterdouglas') {
      // 헌터더글라스: 판매단가의 60% / 1.1 * 수량
      const baseCost = updatedRow.salePrice ? Math.round((updatedRow.salePrice * 0.6) / 1.1) : 0;
      updatedRow.cost = baseCost && updatedRow.quantity
        ? Math.round(baseCost * updatedRow.quantity)
        : 0;
    } else if (updatedRow.productType === '블라인드') {
      // 블라인드: 입고원가 * m2 * 수량
      const areaNum = Number(updatedRow.area);
      const baseCost = updatedRow.purchaseCost && areaNum
        ? Math.round(updatedRow.purchaseCost * areaNum)
        : 0;
      updatedRow.cost = baseCost && updatedRow.quantity
        ? Math.round(baseCost * updatedRow.quantity)
        : 0;
    } else if (updatedRow.productType === '커튼' && updatedRow.curtainType === '겉커튼' && 
               (updatedRow.pleatType === '민자' || updatedRow.pleatType === '나비')) {
      // 겉커튼 민자, 나비: 입고원가 * 폭수 * 수량
      const baseCost = updatedRow.purchaseCost && updatedRow.widthCount
        ? Math.round(updatedRow.purchaseCost * updatedRow.widthCount)
        : 0;
      updatedRow.cost = baseCost && updatedRow.quantity
        ? Math.round(baseCost * updatedRow.quantity)
        : 0;
    } else if (updatedRow.productType === '커튼' && updatedRow.curtainType === '속커튼' && updatedRow.pleatType === '민자') {
      // 속커튼 민자: 대폭민자원가 * 면적(m2) * 수량
      const areaNum = Number(updatedRow.area);
      let costToUse = updatedRow.largePlainCost;
      
      // 대폭민자원가가 없으면 입고원가의 63% 사용
      if (!costToUse) {
        costToUse = updatedRow.purchaseCost ? updatedRow.purchaseCost * 0.63 : 0;
      }
      
      const baseCost = costToUse && areaNum
        ? Math.round(costToUse * areaNum)
        : 0;
      updatedRow.cost = baseCost && updatedRow.quantity
        ? Math.round(baseCost * updatedRow.quantity)
        : 0;
    } else if (updatedRow.productType === '커튼' && updatedRow.curtainType === '속커튼' && updatedRow.pleatType === '나비') {
      // 속커튼 나비: 입고원가 * 면적(m2) * 수량
      const areaNum = Number(updatedRow.area);
      const baseCost = updatedRow.purchaseCost && areaNum
        ? Math.round(updatedRow.purchaseCost * areaNum)
        : 0;
      updatedRow.cost = baseCost && updatedRow.quantity
        ? Math.round(baseCost * updatedRow.quantity)
        : 0;
    } else if (updatedRow.productType === '출장비' || updatedRow.productType === '시공' || updatedRow.productType === '서비스') {
      // 출장비, 시공 등 기타 제품: 입고원가 * 수량
      updatedRow.cost = updatedRow.purchaseCost && updatedRow.quantity
        ? Math.round(updatedRow.purchaseCost * updatedRow.quantity)
        : 0;
    } else {
      // 기타 제품: 입고원가 * 수량 (기본 계산)
      updatedRow.cost = updatedRow.purchaseCost && updatedRow.quantity
        ? Math.round(updatedRow.purchaseCost * updatedRow.quantity)
        : 0;
    }

    // 5. 마진 계산 (견적서와 동일한 로직 적용)
    updatedRow.margin = Math.round(updatedRow.totalPrice / 1.1 - updatedRow.cost);

    // 6. 최종적으로 업데이트된 행을 주문서에 반영
    newRows[editRowIdx] = updatedRow;
    
    // 7. 제품 수정 후 연결된 옵션들의 정보 업데이트
    const updatedRowsWithOptions = newRows.map((row, index) => {
      if (row.type === 'option') {
        // 해당 옵션의 이전 제품 찾기
        let targetProduct = null;
        for (let i = index - 1; i >= 0; i--) {
          if (newRows[i].type === 'product') {
            targetProduct = newRows[i];
            break;
          }
        }
        
                 // 제품이 있고 자동 수량 계산이 활성화된 경우에만 업데이트
         if (targetProduct && !row.isManualQuantity) {
           // 옵션 수량 자동 재계산
           const autoQuantity = calculateOptionQuantityForProduct(row, targetProduct);
          
          // 옵션 금액 재계산
          const calculatedTotalPrice = getOptionAmount({
            ...row,
            quantity: autoQuantity
          }, targetProduct);
          
          const calculatedCost = getOptionPurchaseAmount({
            ...row,
            quantity: autoQuantity
          }, targetProduct);
          
          return {
            ...row,
            quantity: autoQuantity,
            totalPrice: calculatedTotalPrice,
            cost: calculatedCost,
            margin: calculatedTotalPrice - calculatedCost
          };
        }
      }
      return row;
    });
    
    // 8. 제품들의 세부내용 업데이트
    const finalRows = updatedRowsWithOptions.map((row) => {
      if (row.type === 'product') {
        return {
          ...row,
          details: updateDetailsInRealTime(row)
        };
      }
      return row;
    });
    
    const updatedOrders = [...orders];
    updatedOrders[activeTab] = {
      ...updatedOrders[activeTab],
      rows: finalRows
    };
    setOrders(updatedOrders);

    // 7. 다이얼로그 닫기 및 상태 초기화
    setEditOpen(false);
    setEditRowIdx(null);
    setEditRow(null);
    setRecommendedPleatCount(0);
    setRecommendedPleatAmount('');
    setUserModifiedWidthCount(false);

    setSnackbarMessage('제품 정보가 수정되었습니다.');
    setSnackbarOpen(true);
  };

  const handleEditClose = () => {
    setEditOpen(false);
    setEditRowIdx(null);
    setEditRow(null);
    setRecommendedPleatCount(0);
    setRecommendedPleatAmount('');
    setUserModifiedWidthCount(false);
  };

  // editRow가 변경될 때 추천 폭수 계산을 위한 useEffect
  useEffect(() => {
    if (editRow && editOpen && editRow.productType === '커튼' && editRow.curtainType && editRow.pleatType && editRow.widthMM) {
      const product = productOptions.find(p => p.productCode === editRow.productCode);
      const widthMM = Number(editRow.widthMM) || 0;
      const pleatTypeVal = editRow.pleatType;
      const curtainTypeVal = editRow.curtainType;
      const productWidth = product ? Number(product.width) || 0 : 0;

      // 겉커튼일 때 추천 폭수 계산
      if (curtainTypeVal === '겉커튼' && widthMM > 0) {
        const userInputWidthCount = Number(editRow.widthCount) || 0;
        let finalWidthCount = userInputWidthCount;

        // 사용자가 폭수를 입력하지 않았거나 사용자가 수정하지 않은 상태에서만 추천 폭수 계산
        if (userInputWidthCount === 0 || !userModifiedWidthCount) {
          let pleatCount: number | string = 0;
          
          if (pleatTypeVal === '민자' || pleatTypeVal === '나비') {
            pleatCount = getPleatCount(
              widthMM,
              productWidth,
              pleatTypeVal,
              curtainTypeVal
            );
          }
          
          finalWidthCount = Number(pleatCount) || 0;
          
          // 추천폭수 상태 업데이트 (실제 editRow는 수정하지 않음)
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
        } else {
          // 사용자가 수정한 경우 추천폭수는 현재 값으로 설정
          setRecommendedPleatCount(userInputWidthCount);
          setRecommendedPleatAmount('');
        }
      }
    }
  }, [editRow, editOpen, productOptions, userModifiedWidthCount]);
  return (
    <>
      {/* 자동 크기 계산을 위한 숨겨진 input */}
      <input
        ref={hiddenInputRef}
        type="text"
        style={{
          position: 'absolute',
          left: '-9999px',
          top: '-9999px',
          visibility: 'hidden',
          whiteSpace: 'pre',
          fontSize: 'inherit',
          fontFamily: 'inherit',
          padding: '2px 4px',
          border: 'none',
          outline: 'none'
        }}
      />
      
      <Box sx={{ p: isMobile ? 1 : 3 }}>
        {/* 주문서 관리 버튼 */}
        <Box sx={{ mb: 2, display: 'flex', gap: 1, flexWrap: 'wrap' }}>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => {
              addOrder();
              setIsOrderEditMode(true);
              // 새 주문서 추가 후 할인 설정 초기화
              setTimeout(() => {
                setDiscountAmount('');
                setDiscountRate('');
                setDiscountedTotalInput('');
                // 새 주문서의 발주서 초기화
                const newOrderId = orders[orders.length - 1]?.id;
                if (newOrderId) {
                  setVendorPurchaseOrders(prev => ({
                    ...prev,
                    [newOrderId]: []
                  }));
                }
              }, 100);
            }}
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
            onClick={() => {
              setContractListModalOpen(true);
              setIsOrderEditMode(true);
            }}
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
            onClick={() => {
              const currentOrderId = orders[activeTab]?.id;
              // 발주서 삭제
              if (currentOrderId) {
                setVendorPurchaseOrders(prev => {
                  const newState = { ...prev };
                  delete newState[currentOrderId];
                  return newState;
                });
              }
              removeOrder(activeTab);
              // 주문서가 1개 이하로 남으면 편집 모드 해제
              if (orders.length <= 2) {
                setIsOrderEditMode(false);
                // 주문서가 1개일 때 삭제하면 저장된 주문서 목록만 보이도록 설정
                if (orders.length === 1) {
                  setShowSavedOrders(true);
                }
              }
            }}
            disabled={!isOrderEditMode}
            sx={{
              fontSize: isMobile ? '0.875rem' : '1rem',
              minHeight: isMobile ? '40px' : '48px',
            }}
          >
            주문서 삭제
          </Button>
        </Box>

        {/* 주문서 편집 모드일 때만 탭과 내용 표시 */}
        {isOrderEditMode && (
          <>
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
                {filteredOrders.map((order, index) => {
                  const orderIndex = orders.findIndex(o => o.id === order.id);
                  return (
                    <Tab 
                      key={order.id} 
                      label={`주문서-${order.estimateNo}`}
                      onContextMenu={(e) => orderIndex >= 0 && handleTabContextMenu(e, orderIndex)}
                      onTouchStart={() => orderIndex >= 0 && handleTabTouchStart(orderIndex)}
                      onTouchEnd={handleTouchEnd}
                      sx={{
                        textTransform: 'none',
                        fontWeight: 'medium',
                      }}
                    />
                  );
                })}
              </Tabs>
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
                value={orders[activeTab].orderNo || `O${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-${String(activeTab + 1).padStart(3, '0')}`}
                onChange={(e) => handleCustomerInfoChange('orderNo', e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Tab') {
                    e.preventDefault();
                    if (e.shiftKey) {
                      handleOrderKeyboardNavigation(0, 'prev');
                    } else {
                      handleOrderKeyboardNavigation(0, 'next');
                    }
                  } else if (e.key === 'ArrowDown') {
                    e.preventDefault();
                    handleOrderKeyboardNavigation(0, 'down');
                  } else if (e.key === 'ArrowUp') {
                    e.preventDefault();
                    handleOrderKeyboardNavigation(0, 'up');
                  } else if (e.key === 'Enter') {
                    e.preventDefault();
                    handleOrderKeyboardNavigation(0, 'next');
                  }
                }}
                inputRef={orderNoRef}
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
                onChange={(e) => handleCustomerInfoChange('estimateDate', e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Tab') {
                    e.preventDefault();
                    if (e.shiftKey) {
                      handleOrderKeyboardNavigation(1, 'prev');
                    } else {
                      handleOrderKeyboardNavigation(1, 'next');
                    }
                  } else if (e.key === 'ArrowDown') {
                    e.preventDefault();
                    handleOrderKeyboardNavigation(1, 'down');
                  } else if (e.key === 'ArrowUp') {
                    e.preventDefault();
                    handleOrderKeyboardNavigation(1, 'up');
                  } else if (e.key === 'Enter') {
                    e.preventDefault();
                    handleOrderKeyboardNavigation(1, 'next');
                  }
                }}
                inputRef={orderDateRef}
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
                onChange={(e) => handleCustomerInfoChange('customerName', e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Tab') {
                    e.preventDefault();
                    if (e.shiftKey) {
                      handleOrderKeyboardNavigation(2, 'prev');
                    } else {
                      handleOrderKeyboardNavigation(2, 'next');
                    }
                  } else if (e.key === 'ArrowDown') {
                    e.preventDefault();
                    handleOrderKeyboardNavigation(2, 'down');
                  } else if (e.key === 'ArrowUp') {
                    e.preventDefault();
                    handleOrderKeyboardNavigation(2, 'up');
                  } else if (e.key === 'Enter') {
                    e.preventDefault();
                    handleOrderKeyboardNavigation(2, 'next');
                  }
                }}
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
              <TextField
                label="연락처*"
                value={orders[activeTab].contact}
                onChange={(e) => handleCustomerInfoChange('contact', e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Tab') {
                    e.preventDefault();
                    if (e.shiftKey) {
                      handleOrderKeyboardNavigation(3, 'prev');
                    } else {
                      handleOrderKeyboardNavigation(3, 'next');
                    }
                  } else if (e.key === 'ArrowDown') {
                    e.preventDefault();
                    handleOrderKeyboardNavigation(3, 'down');
                  } else if (e.key === 'ArrowUp') {
                    e.preventDefault();
                    handleOrderKeyboardNavigation(3, 'up');
                  } else if (e.key === 'Enter') {
                    e.preventDefault();
                    handleOrderKeyboardNavigation(3, 'next');
                  }
                }}
                inputRef={contactRef}
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
                onChange={(e) => handleCustomerInfoChange('emergencyContact', e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Tab') {
                    e.preventDefault();
                    if (e.shiftKey) {
                      handleOrderKeyboardNavigation(4, 'prev');
                    } else {
                      handleOrderKeyboardNavigation(4, 'next');
                    }
                  } else if (e.key === 'ArrowDown') {
                    e.preventDefault();
                    handleOrderKeyboardNavigation(4, 'down');
                  } else if (e.key === 'ArrowUp') {
                    e.preventDefault();
                    handleOrderKeyboardNavigation(4, 'up');
                  } else if (e.key === 'Enter') {
                    e.preventDefault();
                    handleOrderKeyboardNavigation(4, 'next');
                  }
                }}
                inputRef={emergencyContactRef}
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
                onChange={(e) => handleCustomerInfoChange('projectName', e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Tab') {
                    e.preventDefault();
                    if (e.shiftKey) {
                      handleOrderKeyboardNavigation(5, 'prev');
                    } else {
                      handleOrderKeyboardNavigation(5, 'next');
                    }
                  } else if (e.key === 'ArrowDown') {
                    e.preventDefault();
                    handleOrderKeyboardNavigation(5, 'down');
                  } else if (e.key === 'ArrowUp') {
                    e.preventDefault();
                    handleOrderKeyboardNavigation(5, 'up');
                  } else if (e.key === 'Enter') {
                    e.preventDefault();
                    handleOrderKeyboardNavigation(5, 'next');
                  }
                }}
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
                value={orders[activeTab].type}
                onChange={(e) => handleCustomerInfoChange('type', e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Tab') {
                    e.preventDefault();
                    if (e.shiftKey) {
                      handleOrderKeyboardNavigation(6, 'prev');
                    } else {
                      handleOrderKeyboardNavigation(6, 'next');
                    }
                  } else if (e.key === 'ArrowDown') {
                    e.preventDefault();
                    handleOrderKeyboardNavigation(6, 'down');
                  } else if (e.key === 'ArrowUp') {
                    e.preventDefault();
                    handleOrderKeyboardNavigation(6, 'up');
                  } else if (e.key === 'Enter') {
                    e.preventDefault();
                    handleOrderKeyboardNavigation(6, 'next');
                  }
                }}
                inputRef={typeRef}
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
                onChange={(e) => handleCustomerInfoChange('address', e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Tab') {
                    e.preventDefault();
                    if (e.shiftKey) {
                      handleOrderKeyboardNavigation(7, 'prev');
                    } else {
                      handleOrderKeyboardNavigation(7, 'next');
                    }
                  } else if (e.key === 'ArrowDown') {
                    e.preventDefault();
                    handleOrderKeyboardNavigation(7, 'down');
                  } else if (e.key === 'ArrowUp') {
                    e.preventDefault();
                    handleOrderKeyboardNavigation(7, 'up');
                  } else if (e.key === 'Enter') {
                    e.preventDefault();
                    handleOrderKeyboardNavigation(7, 'next');
                  }
                }}
                inputRef={addressRef}
                size="small"
                sx={{ 
                  minWidth: 350, 
                  maxWidth: 500,
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
              <Box sx={{ display: 'flex', gap: 1, ml: 1 }}>
                <Button
                  variant="contained"
                  color="primary"
                  size="medium"
                  onClick={handleSaveCustomer}
                  sx={{ height: 40, minWidth: 100 }}
                >
                  고객저장
                </Button>
                <Button
                  variant="outlined"
                  color="info"
                  size="medium"
                  onClick={handleOpenCustomerList}
                  sx={{ height: 40, minWidth: 100 }}
                >
                  고객리스트
                </Button>
              </Box>
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
              <TextField
                label="견적번호"
                value={orders[activeTab].estimateNo || ''}
                onChange={(e) => handleCustomerInfoChange('estimateNo', e.target.value)}
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
            </Box>
            
            {/* 실측일자, 시공일자, 시공기사 섹션 */}
            <Box sx={{ 
              display: 'flex', 
              flexDirection: isMobile ? 'column' : 'row',
              gap: 2, 
              alignItems: 'flex-start',
              flexWrap: 'wrap',
              mt: 2,
              pt: 2,
              borderTop: '1px solid var(--border-color)'
            }}>
              {/* 실측일자 */}
              <TextField
                label="실측일자"
                type="datetime-local"
                value={orders[activeTab].measurementDate || ''}
                onChange={(e) => {
                  const updatedOrders = [...orders];
                  updatedOrders[activeTab] = {
                    ...updatedOrders[activeTab],
                    measurementDate: e.target.value
                  };
                  setOrders(updatedOrders);
                }}
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
                    '&.Mui-focused': {
                      color: 'var(--primary-color)',
                    },
                  },
                  '& .MuiInputLabel-shrink': {
                    transform: 'translate(14px, -9px) scale(0.75)',
                  },
                }}
                inputProps={{
                  step: 1800, // 30분 단위 (초 단위)
                  min: '2020-01-01T00:00',
                  max: '2030-12-31T23:59',
                }}
                InputLabelProps={{
                  shrink: true,
                }}
              />
              
              {/* 시공일자 */}
              <TextField
                label="시공일자"
                type="datetime-local"
                value={orders[activeTab].installationDate || ''}
                onChange={(e) => {
                  const updatedOrders = [...orders];
                  updatedOrders[activeTab] = {
                    ...updatedOrders[activeTab],
                    installationDate: e.target.value
                  };
                  setOrders(updatedOrders);
                }}
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
                    '&.Mui-focused': {
                      color: 'var(--primary-color)',
                    },
                  },
                  '& .MuiInputLabel-shrink': {
                    transform: 'translate(14px, -9px) scale(0.75)',
                  },
                }}
                inputProps={{
                  step: 1800, // 30분 단위 (초 단위)
                  min: '2020-01-01T00:00',
                  max: '2030-12-31T23:59',
                }}
                InputLabelProps={{
                  shrink: true,
                }}
              />
              
              {/* 시공기사 드롭다운 */}
              <FormControl size="small" sx={{ minWidth: 200 }}>
                <InputLabel sx={{ color: 'var(--text-secondary-color)' }}>
                  시공기사
                </InputLabel>
                <Select
                  value={orders[activeTab].installerId || ''}
                  onChange={(e) => {
                    const selectedInstaller = installerList.find(installer => installer.id === e.target.value);
                    const updatedOrders = [...orders];
                    updatedOrders[activeTab] = {
                      ...updatedOrders[activeTab],
                      installerId: e.target.value,
                      installerName: selectedInstaller?.installerName || ''
                    };
                    setOrders(updatedOrders);
                  }}
                  sx={{
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
                    '& .MuiSelect-icon': {
                      color: 'var(--text-secondary-color)',
                    },
                  }}
                >
                  <MenuItem value="">
                    <em>시공기사 선택</em>
                  </MenuItem>
                  {installerList.map((installer) => (
                    <MenuItem key={installer.id} value={installer.id}>
                      {installer.installerName} ({installer.vendorName})
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
              
              {/* 기사추가 버튼 */}
              <Button
                variant="outlined"
                size="small"
                onClick={() => setInstallerModalOpen(true)}
                sx={{
                  minHeight: '40px',
                  borderColor: 'var(--border-color)',
                  color: 'var(--text-color)',
                  '&:hover': {
                    borderColor: 'var(--primary-color)',
                    backgroundColor: 'var(--hover-color)',
                  },
                }}
              >
                기사추가
              </Button>
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
              {isBulkEditMode && (
                <Box sx={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: 2, 
                  mb: 2, 
                  p: 1,
                  backgroundColor: 'rgba(255, 193, 7, 0.1)',
                  borderRadius: 1,
                  border: '1px solid rgba(255, 193, 7, 0.3)'
                }}>
                  <Typography variant="body2" color="warning.main" sx={{ fontWeight: 'bold' }}>
                    일괄변경 모드
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    선택된 행: {selectedOrderRows.size}개
                  </Typography>
                  <Button
                    variant="outlined"
                    color="secondary"
                    onClick={handleSelectAllOrderRows}
                    size="small"
                  >
                    전체 선택
                  </Button>
                  <Button
                    variant="contained"
                    color="error"
                    onClick={handleDeleteSelectedOrderRows}
                    disabled={selectedOrderRows.size === 0}
                    size="small"
                  >
                    선택 삭제
                  </Button>
                  <Divider orientation="vertical" flexItem />
                  <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 'bold' }}>
                    순번 이동:
                  </Typography>
                  <Button
                    variant="outlined"
                    color="primary"
                    onClick={() => {
                      console.log('위로 버튼 클릭됨');
                      console.log('selectedOrderRows:', selectedOrderRows);
                      moveBulkEditProductUp();
                    }}
                    disabled={selectedOrderRows.size === 0}
                    size="small"
                    startIcon={<ArrowUpIcon />}
                  >
                    위로
                  </Button>
                  <Button
                    variant="outlined"
                    color="primary"
                    onClick={() => {
                      console.log('아래로 버튼 클릭됨');
                      console.log('selectedOrderRows:', selectedOrderRows);
                      moveBulkEditProductDown();
                    }}
                    disabled={selectedOrderRows.size === 0}
                    size="small"
                    startIcon={<ArrowDownIcon />}
                  >
                    아래로
                  </Button>
                  <Divider orientation="vertical" flexItem />
                  <Button
                    variant="contained"
                    color="error"
                    onClick={exitBulkEditMode}
                    size="small"
                  >
                    종료
                  </Button>
                </Box>
              )}

              <Box sx={{ display: 'flex', gap: 1, flex: 1 }}>
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
                  disabled={(orders[activeTab]?.rows || []).filter(row => row && row.type === 'product').length === 0}
                  sx={{ 
                    minWidth: 80, 
                    fontSize: 13, 
                    py: 0.5, 
                    px: 1.5,
                    opacity: (orders[activeTab]?.rows || []).filter(row => row && row.type === 'product').length === 0 ? 0.5 : 1
                  }}
                  onClick={handleOpenOptionDialog}
                  title={(orders[activeTab]?.rows || []).filter(row => row && row.type === 'product').length === 0 ? '제품을 먼저 선택해주세요' : '옵션 추가'}
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
                <Tooltip title="필터">
                  <IconButton
                    size="small"
                    onClick={() => setFilterModalOpen(true)}
                    sx={{ 
                      color: 'var(--primary-color)',
                      border: '1px solid var(--border-color)',
                      '&:hover': {
                        backgroundColor: 'var(--hover-color)',
                        borderColor: 'var(--primary-color)',
                      },
                    }}
                  >
                    <SettingsIcon fontSize="small" />
                  </IconButton>
                </Tooltip>
                <Tooltip title="일괄변경">
                  <IconButton
                    size="small"
                    onClick={handleBulkEditModeToggle}
                    sx={{ 
                      color: isBulkEditMode ? 'var(--warning-color, #ed6c02)' : 'var(--info-color, #0288d1)',
                      border: '1px solid var(--border-color)',
                      backgroundColor: isBulkEditMode ? 'rgba(237, 108, 2, 0.1)' : 'transparent',
                      '&:hover': {
                        backgroundColor: isBulkEditMode ? 'rgba(237, 108, 2, 0.2)' : 'rgba(2, 136, 209, 0.1)',
                        borderColor: isBulkEditMode ? 'var(--warning-color)' : 'var(--info-color)',
                      },
                    }}
                  >
                    <EditNoteIcon fontSize="small" />
                  </IconButton>
                </Tooltip>
                <Tooltip title="출력하기">
                  <IconButton
                    size="small"
                    onClick={handleOutputClick}
                    sx={{ 
                      color: 'var(--primary-color)',
                      border: '1px solid var(--border-color)',
                      '&:hover': {
                        backgroundColor: 'var(--hover-color)',
                        borderColor: 'var(--primary-color)',
                      },
                    }}
                  >
                    <PrintIcon fontSize="small" />
                  </IconButton>
                </Tooltip>
              </Box>
              <Box sx={{ display: 'flex', gap: 1 }}>
                <Tooltip title="저장하기">
                  <IconButton
                    size="small"
                    onClick={handleSaveOrder}
                    sx={{ 
                      color: 'var(--success-color, #2e7d32)',
                      border: '1px solid var(--border-color)',
                      '&:hover': {
                        backgroundColor: 'rgba(46, 125, 50, 0.1)',
                        borderColor: 'var(--success-color)',
                      },
                    }}
                  >
                    <SaveIcon fontSize="small" />
                  </IconButton>
                </Tooltip>
                <Tooltip title="새주문 저장">
                  <IconButton
                    size="small"
                    onClick={handleSaveAsNewOrder}
                    sx={{ 
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
              </Box>
            </Box>

            {/* 주문서 아이템 테이블 */}
            <TableContainer sx={{
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
              }
            }}>
              <Table size="small">
                <TableHead>
                  <TableRow sx={{
                    // 헤더 줄간격 줄이기
                    '& .MuiTableCell-root': {
                      padding: '6px 8px', // 헤더는 약간 더 여유있게
                      lineHeight: 1.2,
                      fontWeight: 'bold',
                    }
                  }}>
                    {isBulkEditMode && (
                      <TableCell>
                        <Checkbox
                          checked={selectedOrderRows.size === (orders[activeTab]?.rows?.length || 0) && (orders[activeTab]?.rows?.length || 0) > 0}
                          indeterminate={selectedOrderRows.size > 0 && selectedOrderRows.size < (orders[activeTab]?.rows?.length || 0)}
                          onChange={handleSelectAllOrderRows}
                          size="small"
                        />
                      </TableCell>
                    )}
                    <TableCell>순번</TableCell>
                    {(isMobile ? mobileProductColumnVisibility.vendor : columnVisibility.vendor) && <TableCell>거래처</TableCell>}
                    {(isMobile ? mobileProductColumnVisibility.productName : columnVisibility.productName) && <TableCell>제품명</TableCell>}
                    {(isMobile ? mobileProductColumnVisibility.brand : columnVisibility.brand) && <TableCell>브랜드</TableCell>}
                    {(isMobile ? mobileProductColumnVisibility.space : columnVisibility.space) && <TableCell>공간</TableCell>}
                    {(isMobile ? mobileProductColumnVisibility.productCode : columnVisibility.productCode) && <TableCell>제품코드</TableCell>}
                    {(isMobile ? mobileProductColumnVisibility.productType : columnVisibility.productType) && <TableCell>제품종류</TableCell>}
                    {(isMobile ? mobileProductColumnVisibility.width : columnVisibility.width) && <TableCell>폭</TableCell>}
                    {(isMobile ? mobileProductColumnVisibility.details : columnVisibility.details) && <TableCell>세부내용</TableCell>}
                    
                    {(isMobile ? mobileProductColumnVisibility.widthMM : columnVisibility.widthMM) && <TableCell>가로(mm)</TableCell>}
                    {(isMobile ? mobileProductColumnVisibility.heightMM : columnVisibility.heightMM) && <TableCell>세로(mm)</TableCell>}
                    {(isMobile ? mobileProductColumnVisibility.area : columnVisibility.area) && <TableCell>면적(㎡)</TableCell>}
                    {(isMobile ? mobileProductColumnVisibility.lineDir : columnVisibility.lineDir) && <TableCell>줄방향</TableCell>}
                    {(isMobile ? mobileProductColumnVisibility.lineLen : columnVisibility.lineLen) && <TableCell>줄길이</TableCell>}
                    {(isMobile ? mobileProductColumnVisibility.pleatAmount : columnVisibility.pleatAmount) && <TableCell>주름양</TableCell>}
                    {(isMobile ? mobileProductColumnVisibility.widthCount : columnVisibility.widthCount) && <TableCell>폭수</TableCell>}
                    {(isMobile ? mobileProductColumnVisibility.quantity : columnVisibility.quantity) && <TableCell>수량</TableCell>}
                    {(isMobile ? mobileProductColumnVisibility.totalPrice : columnVisibility.totalPrice) && <TableCell>판매금액</TableCell>}
                    {(isMobile ? mobileProductColumnVisibility.salePrice : columnVisibility.salePrice) && <TableCell>판매단가</TableCell>}
                    {(isMobile ? mobileProductColumnVisibility.cost : columnVisibility.cost) && <TableCell>입고금액</TableCell>}
                    {(isMobile ? mobileProductColumnVisibility.purchaseCost : columnVisibility.purchaseCost) && <TableCell>입고원가</TableCell>}
                    {(isMobile ? mobileProductColumnVisibility.margin : columnVisibility.margin) && <TableCell>마진</TableCell>}
                    <TableCell>작업</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {orders[activeTab]?.rows?.map((row, index) => (
                    <TableRow 
                      key={row?.id || index}
                      sx={{
                        backgroundColor: isBulkEditMode 
                          ? (selectedOrderRows.has(index) ? 'rgba(255, 193, 7, 0.3)' : 'inherit')
                          : (selectedRowIndex === index ? 'rgba(25, 118, 210, 0.25)' : 'inherit'),
                        cursor: 'pointer',
                        fontSize: 'calc(1em - 0.3px)', // 모든 행 동일한 크기
                        // 줄간격 줄이기 위한 padding 설정
                        '& .MuiTableCell-root': {
                          padding: '4px 8px', // 기존 기본값보다 줄임
                          lineHeight: 1.2, // 줄간격 줄임
                        },
                        '&:hover': {
                          backgroundColor: isBulkEditMode 
                            ? 'rgba(255, 193, 7, 0.1)' 
                            : 'rgba(25, 118, 210, 0.05)'
                        },
                        // 옵션 행 스타일링
                        ...(row && row.type === 'option' && {
                          backgroundColor: 'rgba(76, 175, 80, 0.08)', // 견적서작성과 동일한 배경색
                          '&:hover': {
                            backgroundColor: 'rgba(76, 175, 80, 0.15)'
                          }
                        })
                      }}
                      onClick={() => handleRowClick(index)}
                      onContextMenu={(e) => handleRowContextMenu(e, index, row)}
                      onTouchStart={() => handleTouchStart(index, row)}
                      onTouchEnd={handleTouchEnd}
                    >
                      {isBulkEditMode && (
                        <TableCell>
                          <Checkbox
                            checked={selectedOrderRows.has(index)}
                            onChange={() => handleOrderRowSelection(index)}
                            size="small"
                            onClick={(e) => e.stopPropagation()}
                          />
                        </TableCell>
                      )}
                                              <TableCell sx={{ 
                          fontSize: 'calc(1em - 0.3px)',
                          color: row && row.type === 'option' ? '#1976d2' : 'inherit',
                          textAlign: 'center'
                        }}>
                        {row && row.type === 'option' ? (
                          // 옵션 행은 순번 표시하지 않음
                          ''
                        ) : (
                          // 제품만 순번 표시 (옵션 제외)
                          (() => {
                            const productNumber = getProductNumber(row);
                            if (productNumber === null) return '';
                            
                            const productRows = orders[activeTab]?.rows?.filter(r => r && r.type === 'product') || [];
                            const canMoveUp = productNumber > 1;
                            const canMoveDown = productNumber < productRows.length;
                            
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
                          })()
                        )}
                      </TableCell>
                      {(isMobile ? mobileProductColumnVisibility.vendor : columnVisibility.vendor) && (
                        <TableCell sx={{ 
                          fontSize: 'calc(1em - 0.3px)',
                          color: row && row.type === 'option' ? '#1976d2' : 'inherit'
                        }}>
                          {row?.vendor}
                        </TableCell>
                      )}
                      {(isMobile ? mobileProductColumnVisibility.productName : columnVisibility.productName) && (
                        <TableCell sx={{ 
                          fontSize: 'calc(1em - 0.3px)',
                          color: row && row.type === 'option' ? '#1976d2' : 'inherit'
                        }}>
                          {row && row.type === 'option' ? (
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                              <Typography variant="body2" sx={{ color: '#1976d2', fontWeight: 'bold', fontSize: 'calc(1em - 0.3px)' }}>
                                {row?.productName}
                              </Typography>
                            </Box>
                          ) : (
                            row?.productName
                          )}
                        </TableCell>
                      )}
                      {(isMobile ? mobileProductColumnVisibility.brand : columnVisibility.brand) && (
                        <TableCell sx={{ 
                          fontSize: 'calc(1em - 0.3px)',
                          color: row && row.type === 'option' ? '#1976d2' : 'inherit'
                        }}>
                          {row?.brand}
                        </TableCell>
                      )}
                      {(isMobile ? mobileProductColumnVisibility.space : columnVisibility.space) && (
                        <TableCell
                          sx={{ fontSize: 'calc(1em - 0.3px)', color: row && row.type === 'option' ? '#1976d2' : 'inherit' }}
                          onClick={() => {
                            if (!(editingCell && editingCell.rowIndex === index && editingCell.field === 'space')) {
                              setEditingCell({ rowIndex: index, field: 'space' });
                              setEditingValue(row?.space || '');
                            }
                          }}
                        >
                          {editingCell?.rowIndex === index && editingCell?.field === 'space' ? (
                            <TextField
                              value={editingValue}
                              onChange={e => setEditingValue(e.target.value)}
                              onBlur={() => handleCellEdit(index, 'space', editingValue)}
                              onKeyDown={e => {
                                if (e.key === 'Tab') {
                                  e.preventDefault();
                                  if (e.shiftKey) {
                                    handleOrderTableCellKeyboardNavigation(index, 'space', 'prev');
                                  } else {
                                    handleOrderTableCellKeyboardNavigation(index, 'space', 'next');
                                  }
                                } else if (e.key === 'ArrowDown') {
                                  e.preventDefault();
                                  handleOrderTableCellKeyboardNavigation(index, 'space', 'down');
                                } else if (e.key === 'ArrowUp') {
                                  e.preventDefault();
                                  handleOrderTableCellKeyboardNavigation(index, 'space', 'up');
                                } else if (e.key === 'Enter') {
                                  e.preventDefault();
                                  handleOrderTableCellKeyboardNavigation(index, 'space', 'next');
                                } else if (e.key === 'Escape') {
                                  handleCellCancel();
                                }
                              }}
                              size="small"
                              autoFocus
                              inputProps={{
                                style: {
                                  width: `${calculateInputWidth(editingValue, 50, 120)}px`,
                                  minWidth: '50px',
                                  maxWidth: '120px',
                                  padding: '2px 4px',
                                  fontSize: 'inherit'
                                }
                              }}
                              sx={{ 
                                minWidth: '50px !important', 
                                maxWidth: '120px !important',
                                width: `${calculateInputWidth(editingValue, 50, 120)}px !important`,
                                fontSize: 'inherit',
                                '& .MuiInputBase-input': {
                                  color: '#000000 !important',
                                  padding: '2px 4px !important',
                                  width: `${calculateInputWidth(editingValue, 50, 120)}px !important`
                                },
                                '& .MuiOutlinedInput-root': {
                                  minWidth: '50px !important',
                                  maxWidth: '120px !important',
                                  width: `${calculateInputWidth(editingValue, 50, 120)}px !important`
                                }
                              }}
                            />
                          ) : (
                            row && row.type === 'option' ? 'ㄴ옵션' : (row?.space || '')
                          )}
                        </TableCell>
                      )}
                      {(isMobile ? mobileProductColumnVisibility.productCode : columnVisibility.productCode) && (
                        <TableCell
                          sx={{ 
                            fontSize: 'calc(1em - 0.3px)',
                            color: row && row.type === 'option' ? '#1976d2' : 'inherit'
                          }}
                          onClick={() => {
                            if (!(editingCell && editingCell.rowIndex === index && editingCell.field === 'productCode')) {
                              setEditingCell({ rowIndex: index, field: 'productCode' });
                              setEditingValue(row?.productCode || '');
                            }
                          }}
                        >
                          {editingCell?.rowIndex === index && editingCell?.field === 'productCode' ? (
                            <TextField
                              value={editingValue}
                              onChange={e => setEditingValue(e.target.value)}
                              onBlur={() => handleCellEdit(index, 'productCode', editingValue)}
                              onKeyDown={e => {
                                if (e.key === 'Tab') {
                                  e.preventDefault();
                                  if (e.shiftKey) {
                                    handleOrderTableCellKeyboardNavigation(index, 'productCode', 'prev');
                                  } else {
                                    handleOrderTableCellKeyboardNavigation(index, 'productCode', 'next');
                                  }
                                } else if (e.key === 'ArrowDown') {
                                  e.preventDefault();
                                  handleOrderTableCellKeyboardNavigation(index, 'productCode', 'down');
                                } else if (e.key === 'ArrowUp') {
                                  e.preventDefault();
                                  handleOrderTableCellKeyboardNavigation(index, 'productCode', 'up');
                                } else if (e.key === 'Enter') {
                                  e.preventDefault();
                                  handleOrderTableCellKeyboardNavigation(index, 'productCode', 'next');
                                } else if (e.key === 'Escape') {
                                  handleCellCancel();
                                }
                              }}
                              size="small"
                              autoFocus
                              inputProps={{
                                style: {
                                  width: `${calculateInputWidth(editingValue, 50, 120)}px`,
                                  minWidth: '50px',
                                  maxWidth: '120px',
                                  padding: '2px 4px',
                                  fontSize: 'inherit'
                                }
                              }}
                              sx={{ 
                                minWidth: '50px !important', 
                                maxWidth: '120px !important',
                                width: `${calculateInputWidth(editingValue, 50, 120)}px !important`,
                                fontSize: 'inherit',
                                '& .MuiInputBase-input': {
                                  color: '#000000 !important',
                                  padding: '2px 4px !important',
                                  width: `${calculateInputWidth(editingValue, 50, 120)}px !important`
                                },
                                '& .MuiOutlinedInput-root': {
                                  minWidth: '50px !important',
                                  maxWidth: '120px !important',
                                  width: `${calculateInputWidth(editingValue, 50, 120)}px !important`
                                }
                              }}
                            />
                          ) : (
                            row?.productCode || ''
                          )}
                        </TableCell>
                      )}
                      {(isMobile ? mobileProductColumnVisibility.productType : columnVisibility.productType) && (
                        <TableCell sx={{ 
                          fontSize: 'calc(1em - 0.3px)',
                          color: row && row.type === 'option' ? '#1976d2' : 'inherit'
                        }}>
                          {row?.productType}
                        </TableCell>
                      )}
                      {(isMobile ? mobileProductColumnVisibility.width : columnVisibility.width) && (
                        <TableCell sx={{ 
                          fontSize: 'calc(1em - 0.3px)',
                          color: row && row.type === 'option' ? '#1976d2' : 'inherit'
                        }}>
                          {row?.width}
                        </TableCell>
                      )}
                      {(isMobile ? mobileProductColumnVisibility.details : columnVisibility.details) && (
                        <TableCell
                          sx={{ 
                            fontSize: 'calc(1em - 0.3px)',
                            color: row && row.type === 'option' ? '#1976d2' : 'inherit'
                          }}
                          onClick={() => {
                            if (!(editingCell && editingCell.rowIndex === index && editingCell.field === 'details')) {
                              setEditingCell({ rowIndex: index, field: 'details' });
                              setEditingValue(row?.details || '');
                            }
                          }}
                        >
                          {editingCell?.rowIndex === index && editingCell?.field === 'details' ? (
                            <TextField
                              value={editingValue}
                              onChange={e => setEditingValue(e.target.value)}
                              onBlur={() => handleCellEdit(index, 'details', editingValue)}
                              onKeyDown={e => {
                                if (e.key === 'Tab') {
                                  e.preventDefault();
                                  if (e.shiftKey) {
                                    handleOrderTableCellKeyboardNavigation(index, 'details', 'prev');
                                  } else {
                                    handleOrderTableCellKeyboardNavigation(index, 'details', 'next');
                                  }
                                } else if (e.key === 'ArrowDown') {
                                  e.preventDefault();
                                  handleOrderTableCellKeyboardNavigation(index, 'details', 'down');
                                } else if (e.key === 'ArrowUp') {
                                  e.preventDefault();
                                  handleOrderTableCellKeyboardNavigation(index, 'details', 'up');
                                } else if (e.key === 'Enter') {
                                  e.preventDefault();
                                  handleOrderTableCellKeyboardNavigation(index, 'details', 'next');
                                } else if (e.key === 'Escape') {
                                  handleCellCancel();
                                }
                              }}
                              size="small"
                              autoFocus
                              inputProps={{
                                style: {
                                  width: `${calculateInputWidth(editingValue, 150, 400)}px`,
                                  minWidth: '150px',
                                  maxWidth: '400px',
                                  padding: '2px 4px',
                                  fontSize: 'inherit'
                                }
                              }}
                              sx={{ 
                                minWidth: '150px !important', 
                                maxWidth: '400px !important',
                                width: `${calculateInputWidth(editingValue, 150, 400)}px !important`,
                                fontSize: 'inherit',
                                '& .MuiInputBase-input': {
                                  color: '#000000 !important',
                                  padding: '2px 4px !important',
                                  width: `${calculateInputWidth(editingValue, 150, 400)}px !important`
                                },
                                '& .MuiOutlinedInput-root': {
                                  minWidth: '150px !important',
                                  maxWidth: '400px !important',
                                  width: `${calculateInputWidth(editingValue, 150, 400)}px !important`
                                }
                              }}
                            />
                          ) : (
                            row?.details || ''
                          )}
                        </TableCell>
                      )}
                      
                      {(isMobile ? mobileProductColumnVisibility.widthMM : columnVisibility.widthMM) && (
                        <TableCell
                          sx={{ 
                            fontSize: row && row.type === 'option' ? 'inherit' : 'calc(1em - 0.3px)',
                            color: row && row.type === 'option' ? '#4caf50' : 'inherit'
                          }}
                          onClick={() => {
                            if (!(editingCell && editingCell.rowIndex === index && editingCell.field === 'widthMM')) {
                              setEditingCell({ rowIndex: index, field: 'widthMM' });
                              setEditingValue(row?.widthMM ? String(row.widthMM) : '');
                            }
                          }}
                        >
                          {editingCell?.rowIndex === index && editingCell?.field === 'widthMM' ? (
                            <TextField
                              value={editingValue}
                              onChange={e => setEditingValue(e.target.value)}
                              onBlur={() => handleCellEdit(index, 'widthMM', editingValue)}
                              onKeyDown={e => {
                                if (e.key === 'Tab') {
                                  e.preventDefault();
                                  if (e.shiftKey) {
                                    handleOrderTableCellKeyboardNavigation(index, 'widthMM', 'prev');
                                  } else {
                                    handleOrderTableCellKeyboardNavigation(index, 'widthMM', 'next');
                                  }
                                } else if (e.key === 'ArrowDown') {
                                  e.preventDefault();
                                  handleOrderTableCellKeyboardNavigation(index, 'widthMM', 'down');
                                } else if (e.key === 'ArrowUp') {
                                  e.preventDefault();
                                  handleOrderTableCellKeyboardNavigation(index, 'widthMM', 'up');
                                } else if (e.key === 'Enter') {
                                  e.preventDefault();
                                  handleOrderTableCellKeyboardNavigation(index, 'widthMM', 'next');
                                } else if (e.key === 'Escape') {
                                  handleCellCancel();
                                }
                              }}
                              size="small"
                              autoFocus
                              inputProps={{
                                style: {
                                  width: `${calculateInputWidth(editingValue, 40, 80)}px`,
                                  minWidth: '40px',
                                  maxWidth: '80px',
                                  padding: '2px 4px',
                                  fontSize: 'inherit'
                                }
                              }}
                              sx={{ 
                                minWidth: '40px !important', 
                                maxWidth: '80px !important',
                                width: `${calculateInputWidth(editingValue, 40, 80)}px !important`,
                                fontSize: 'inherit',
                                '& .MuiInputBase-input': {
                                  color: '#000000 !important',
                                  padding: '2px 4px !important',
                                  width: `${calculateInputWidth(editingValue, 40, 80)}px !important`
                                },
                                '& .MuiOutlinedInput-root': {
                                  minWidth: '40px !important',
                                  maxWidth: '80px !important',
                                  width: `${calculateInputWidth(editingValue, 40, 80)}px !important`
                                }
                              }}
                            />
                          ) : (
                            row?.widthMM ? Number(row.widthMM).toLocaleString() : ''
                          )}
                        </TableCell>
                      )}
                      {(isMobile ? mobileProductColumnVisibility.heightMM : columnVisibility.heightMM) && (
                        <TableCell
                          sx={{ 
                            fontSize: 'calc(1em - 0.3px)',
                            color: row.type === 'option' ? '#1976d2' : 'inherit'
                          }}
                          onClick={() => {
                            if (!(editingCell && editingCell.rowIndex === index && editingCell.field === 'heightMM')) {
                              setEditingCell({ rowIndex: index, field: 'heightMM' });
                              setEditingValue(row?.heightMM ? String(row.heightMM) : '');
                            }
                          }}
                        >
                          {editingCell?.rowIndex === index && editingCell?.field === 'heightMM' ? (
                            <TextField
                              value={editingValue}
                              onChange={e => setEditingValue(e.target.value)}
                              onBlur={() => handleCellEdit(index, 'heightMM', editingValue)}
                              onKeyDown={e => {
                                if (e.key === 'Tab') {
                                  e.preventDefault();
                                  if (e.shiftKey) {
                                    handleOrderTableCellKeyboardNavigation(index, 'heightMM', 'prev');
                                  } else {
                                    handleOrderTableCellKeyboardNavigation(index, 'heightMM', 'next');
                                  }
                                } else if (e.key === 'ArrowDown') {
                                  e.preventDefault();
                                  handleOrderTableCellKeyboardNavigation(index, 'heightMM', 'down');
                                } else if (e.key === 'ArrowUp') {
                                  e.preventDefault();
                                  handleOrderTableCellKeyboardNavigation(index, 'heightMM', 'up');
                                } else if (e.key === 'Enter') {
                                  e.preventDefault();
                                  handleOrderTableCellKeyboardNavigation(index, 'heightMM', 'next');
                                } else if (e.key === 'Escape') {
                                  handleCellCancel();
                                }
                              }}
                              size="small"
                              autoFocus
                              inputProps={{
                                style: {
                                  width: `${calculateInputWidth(editingValue, 40, 80)}px`,
                                  minWidth: '40px',
                                  maxWidth: '80px',
                                  padding: '2px 4px',
                                  fontSize: 'inherit'
                                }
                              }}
                              sx={{ 
                                minWidth: '40px !important', 
                                maxWidth: '80px !important',
                                width: `${calculateInputWidth(editingValue, 40, 80)}px !important`,
                                fontSize: 'inherit',
                                '& .MuiInputBase-input': {
                                  color: '#000000 !important',
                                  padding: '2px 4px !important',
                                  width: `${calculateInputWidth(editingValue, 40, 80)}px !important`
                                },
                                '& .MuiOutlinedInput-root': {
                                  minWidth: '40px !important',
                                  maxWidth: '80px !important',
                                  width: `${calculateInputWidth(editingValue, 40, 80)}px !important`
                                }
                              }}
                            />
                          ) : (
                            row.heightMM ? Number(row.heightMM).toLocaleString() : ''
                          )}
                        </TableCell>
                      )}
                      {(isMobile ? mobileProductColumnVisibility.area : columnVisibility.area) && (
                        <TableCell
                          sx={{ 
                            fontSize: 'calc(1em - 0.3px)',
                            color: row.type === 'option' ? '#1976d2' : 'inherit'
                          }}
                          onClick={() => {
                            if (!(editingCell && editingCell.rowIndex === index && editingCell.field === 'area')) {
                              setEditingCell({ rowIndex: index, field: 'area' });
                              setEditingValue(row?.area ? row.area.toString() : '');
                            }
                          }}
                        >
                          {editingCell?.rowIndex === index && editingCell?.field === 'area' ? (
                            <TextField
                              value={editingValue}
                              onChange={e => setEditingValue(e.target.value)}
                              onBlur={() => handleCellEdit(index, 'area', editingValue)}
                              onKeyDown={e => {
                                if (e.key === 'Enter') handleCellEdit(index, 'area', editingValue);
                                if (e.key === 'Escape') handleCellCancel();
                              }}
                              size="small"
                              autoFocus
                              inputProps={{
                                style: {
                                  width: `${calculateInputWidth(editingValue, 25, 60)}px`,
                                  minWidth: '25px',
                                  maxWidth: '60px',
                                  padding: '2px 4px',
                                  fontSize: 'inherit'
                                }
                              }}
                              sx={{ 
                                minWidth: '25px !important', 
                                maxWidth: '60px !important',
                                width: `${calculateInputWidth(editingValue, 25, 60)}px !important`,
                                fontSize: 'inherit',
                                '& .MuiInputBase-input': {
                                  color: '#000000 !important',
                                  padding: '2px 4px !important',
                                  width: `${calculateInputWidth(editingValue, 25, 60)}px !important`
                                },
                                '& .MuiOutlinedInput-root': {
                                  minWidth: '25px !important',
                                  maxWidth: '60px !important',
                                  width: `${calculateInputWidth(editingValue, 25, 60)}px !important`
                                }
                              }}
                            />
                          ) : (
                            row.curtainType === '겉커튼' ? '' : (row.area && row.area !== 0 ? row.area : '')
                          )}
                        </TableCell>
                      )}
                      {(isMobile ? mobileProductColumnVisibility.lineDir : columnVisibility.lineDir) && (
                        <TableCell
                          sx={{ 
                            fontSize: 'calc(1em - 0.3px)',
                            color: row.type === 'option' ? '#1976d2' : 'inherit'
                          }}
                          onClick={() => {
                            if (!(editingCell && editingCell.rowIndex === index && editingCell.field === 'lineDirection')) {
                              setEditingCell({ rowIndex: index, field: 'lineDirection' });
                              setEditingValue(row?.lineDirection || '');
                            }
                          }}
                        >
                          {editingCell?.rowIndex === index && editingCell?.field === 'lineDirection' ? (
                                                          <TextField
                                select
                                value={editingValue}
                                onChange={e => setEditingValue(e.target.value)}
                                onBlur={() => handleCellEdit(index, 'lineDirection', editingValue)}
                                onKeyDown={e => {
                                  if (e.key === 'Tab') {
                                    e.preventDefault();
                                    if (e.shiftKey) {
                                      handleOrderTableCellKeyboardNavigation(index, 'lineDirection', 'prev');
                                    } else {
                                      handleOrderTableCellKeyboardNavigation(index, 'lineDirection', 'next');
                                    }
                                  } else if (e.key === 'ArrowDown') {
                                    e.preventDefault();
                                    handleOrderTableCellKeyboardNavigation(index, 'lineDirection', 'down');
                                  } else if (e.key === 'ArrowUp') {
                                    e.preventDefault();
                                    handleOrderTableCellKeyboardNavigation(index, 'lineDirection', 'up');
                                  } else if (e.key === 'Enter') {
                                    e.preventDefault();
                                    handleOrderTableCellKeyboardNavigation(index, 'lineDirection', 'next');
                                  } else if (e.key === 'Escape') {
                                    handleCellCancel();
                                  }
                                }}
                                size="small"
                                autoFocus
                                inputProps={{
                                  style: {
                                    width: `${calculateInputWidth(editingValue, 30, 60)}px`,
                                    minWidth: '30px',
                                    maxWidth: '60px',
                                    padding: '2px 4px',
                                    fontSize: 'inherit'
                                  }
                                }}
                                sx={{ 
                                  minWidth: '30px !important', 
                                  maxWidth: '60px !important',
                                  width: `${calculateInputWidth(editingValue, 30, 60)}px !important`,
                                  fontSize: 'inherit',
                                  '& .MuiSelect-select': {
                                    color: '#000000 !important',
                                    padding: '2px 4px !important',
                                    width: `${calculateInputWidth(editingValue, 30, 60)}px !important`
                                  },
                                  '& .MuiInputBase-input': {
                                    color: '#000000 !important',
                                    padding: '2px 4px !important',
                                    width: `${calculateInputWidth(editingValue, 30, 60)}px !important`
                                  },
                                  '& .MuiOutlinedInput-root': {
                                    minWidth: '30px !important',
                                    maxWidth: '60px !important',
                                    width: `${calculateInputWidth(editingValue, 30, 60)}px !important`
                                  },
                                  '& .MuiMenu-paper': {
                                    backgroundColor: '#ffffff !important',
                                    color: '#000000 !important',
                                    minWidth: '30px !important',
                                    maxWidth: '60px !important',
                                  },
                                  '& .MuiMenuItem-root': {
                                    color: '#000000 !important',
                                    backgroundColor: '#ffffff !important',
                                    '&:hover': {
                                      backgroundColor: '#f5f5f5 !important',
                                    },
                                  },
                                }}
                              >
                              {lineDirectionOptions.map((option) => (
                                <MenuItem 
                                  key={option} 
                                  value={option}
                                  sx={{
                                    color: '#000000 !important',
                                    backgroundColor: '#ffffff !important',
                                    '&:hover': {
                                      backgroundColor: '#f5f5f5 !important',
                                    },
                                  }}
                                >
                                  {option}
                                </MenuItem>
                              ))}
                            </TextField>
                          ) : (
                            row.lineDirection || ''
                          )}
                        </TableCell>
                      )}
                      {(isMobile ? mobileProductColumnVisibility.lineLen : columnVisibility.lineLen) && (
                        <TableCell
                          sx={{ 
                            fontSize: 'calc(1em - 0.3px)',
                            color: row.type === 'option' ? '#1976d2' : 'inherit'
                          }}
                          onClick={() => {
                            if (!(editingCell && editingCell.rowIndex === index && editingCell.field === 'lineLength')) {
                              setEditingCell({ rowIndex: index, field: 'lineLength' });
                              setEditingValue(row?.lineLength || '');
                              setEditingCustomValue(row?.customLineLength || '');
                            }
                          }}
                        >
                          {editingCell?.rowIndex === index && editingCell?.field === 'lineLength' ? (
                            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                                                             <TextField
                                 select
                                 value={editingValue}
                                 onChange={e => setEditingValue(e.target.value)}
                                 onBlur={() => handleCellEdit(index, 'lineLength', editingValue)}
                                 onKeyDown={e => {
                                   if (e.key === 'Enter') handleCellEdit(index, 'lineLength', editingValue);
                                   if (e.key === 'Escape') handleCellCancel();
                                 }}
                                 size="small"
                                 autoFocus
                                 inputProps={{
                                   style: {
                                     width: `${calculateInputWidth(editingValue, 30, 60)}px`,
                                     minWidth: '30px',
                                     maxWidth: '60px',
                                     padding: '2px 4px',
                                     fontSize: 'inherit'
                                   }
                                 }}
                                 sx={{ 
                                   minWidth: '30px !important', 
                                   maxWidth: '60px !important',
                                   width: `${calculateInputWidth(editingValue, 30, 60)}px !important`,
                                   fontSize: 'inherit',
                                   '& .MuiSelect-select': {
                                     color: '#000000 !important',
                                     padding: '2px 4px !important',
                                     width: `${calculateInputWidth(editingValue, 30, 60)}px !important`
                                   },
                                   '& .MuiInputBase-input': {
                                     color: '#000000 !important',
                                     padding: '2px 4px !important',
                                     width: `${calculateInputWidth(editingValue, 30, 60)}px !important`
                                   },
                                   '& .MuiOutlinedInput-root': {
                                     minWidth: '30px !important',
                                     maxWidth: '60px !important',
                                     width: `${calculateInputWidth(editingValue, 30, 60)}px !important`
                                   },
                                   '& .MuiMenu-paper': {
                                     backgroundColor: '#ffffff !important',
                                     color: '#000000 !important',
                                     minWidth: '30px !important',
                                     maxWidth: '60px !important',
                                   },
                                   '& .MuiMenuItem-root': {
                                     color: '#000000 !important',
                                     backgroundColor: '#ffffff !important',
                                     '&:hover': {
                                       backgroundColor: '#f5f5f5 !important',
                                     },
                                   },
                                 }}
                               >
                                {lineLengthOptions.map((option) => (
                                  <MenuItem 
                                    key={option} 
                                    value={option}
                                    sx={{
                                      color: '#000000 !important',
                                      backgroundColor: '#ffffff !important',
                                      '&:hover': {
                                        backgroundColor: '#f5f5f5 !important',
                                      },
                                    }}
                                  >
                                    {option}
                                  </MenuItem>
                                ))}
                              </TextField>
                              {editingValue === '직접입력' && (
                                <TextField
                                  value={editingCustomValue}
                                  onChange={e => setEditingCustomValue(e.target.value)}
                                  onBlur={() => {
                                    const currentRows = orders[activeTab]?.rows || [];
                                    const updatedRows = [...currentRows];
                                    if (updatedRows[index]) {
                                      updatedRows[index] = { 
                                        ...updatedRows[index], 
                                        lineLength: '직접입력',
                                        customLineLength: editingCustomValue 
                                      };
                                      const updatedOrder = { ...orders[activeTab], rows: updatedRows };
                                      const updatedOrders = [...orders];
                                      updatedOrders[activeTab] = updatedOrder;
                                      setOrders(updatedOrders);
                                    }
                                    setEditingCell(null);
                                    setEditingValue('');
                                    setEditingCustomValue('');
                                  }}
                                  onKeyDown={e => {
                                    if (e.key === 'Enter') {
                                      const currentRows = orders[activeTab]?.rows || [];
                                      const updatedRows = [...currentRows];
                                      if (updatedRows[index]) {
                                        updatedRows[index] = { 
                                          ...updatedRows[index], 
                                          lineLength: '직접입력',
                                          customLineLength: editingCustomValue 
                                        };
                                        const updatedOrder = { ...orders[activeTab], rows: updatedRows };
                                        const updatedOrders = [...orders];
                                        updatedOrders[activeTab] = updatedOrder;
                                        setOrders(updatedOrders);
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
                                  inputProps={{
                                    style: {
                                      width: `${calculateInputWidth(editingCustomValue, 30, 60)}px`,
                                      minWidth: '30px',
                                      maxWidth: '60px',
                                      padding: '2px 4px',
                                      fontSize: 'inherit'
                                    }
                                  }}
                                  sx={{ 
                                    minWidth: '30px !important', 
                                    maxWidth: '60px !important',
                                    width: `${calculateInputWidth(editingCustomValue, 30, 60)}px !important`,
                                    fontSize: 'inherit',
                                    '& .MuiInputBase-input': {
                                      color: '#000000 !important',
                                      padding: '2px 4px !important',
                                      width: `${calculateInputWidth(editingCustomValue, 30, 60)}px !important`
                                    },
                                    '& .MuiOutlinedInput-root': {
                                      minWidth: '30px !important',
                                      maxWidth: '60px !important',
                                      width: `${calculateInputWidth(editingCustomValue, 30, 60)}px !important`
                                    }
                                  }}
                                />
                              )}
                            </Box>
                          ) : (
                            row.lineLength === '직접입력' ? row.customLineLength : row.lineLength || ''
                          )}
                        </TableCell>
                      )}
                      {(isMobile ? mobileProductColumnVisibility.pleatAmount : columnVisibility.pleatAmount) && (
                        <TableCell sx={{ 
                          fontSize: 'calc(1em - 0.3px)',
                          color: row.type === 'option' ? '#1976d2' : 'inherit'
                        }}>
                          {row.pleatAmount ? (isNaN(Number(row.pleatAmount)) ? row.pleatAmount : Number(row.pleatAmount).toLocaleString()) : ''}
                        </TableCell>
                      )}
                      {(isMobile ? mobileProductColumnVisibility.widthCount : columnVisibility.widthCount) && (
                        <TableCell
                          sx={{ 
                            fontSize: 'calc(1em - 0.3px)',
                            color: row.type === 'option' ? '#1976d2' : 'inherit'
                          }}
                          onClick={() => {
                            if (!(editingCell && editingCell.rowIndex === index && editingCell.field === 'widthCount')) {
                              setEditingCell({ rowIndex: index, field: 'widthCount' });
                              setEditingValue(row?.widthCount ? row.widthCount.toString() : '');
                            }
                          }}
                        >
                          {editingCell?.rowIndex === index && editingCell?.field === 'widthCount' ? (
                            <TextField
                              value={editingValue}
                              onChange={e => setEditingValue(e.target.value)}
                              onBlur={() => handleCellEdit(index, 'widthCount', editingValue)}
                              onKeyDown={e => {
                                if (e.key === 'Tab') {
                                  e.preventDefault();
                                  if (e.shiftKey) {
                                    handleOrderTableCellKeyboardNavigation(index, 'widthCount', 'prev');
                                  } else {
                                    handleOrderTableCellKeyboardNavigation(index, 'widthCount', 'next');
                                  }
                                } else if (e.key === 'ArrowDown') {
                                  e.preventDefault();
                                  handleOrderTableCellKeyboardNavigation(index, 'widthCount', 'down');
                                } else if (e.key === 'ArrowUp') {
                                  e.preventDefault();
                                  handleOrderTableCellKeyboardNavigation(index, 'widthCount', 'up');
                                } else if (e.key === 'Enter') {
                                  e.preventDefault();
                                  handleOrderTableCellKeyboardNavigation(index, 'widthCount', 'next');
                                } else if (e.key === 'Escape') {
                                  handleCellCancel();
                                }
                              }}
                              size="small"
                              autoFocus
                              inputProps={{
                                style: {
                                  width: `${calculateInputWidth(editingValue, 30, 60)}px`,
                                  minWidth: '30px',
                                  maxWidth: '60px',
                                  padding: '2px 4px',
                                  fontSize: 'inherit'
                                }
                              }}
                              sx={{ 
                                minWidth: '30px !important', 
                                maxWidth: '60px !important',
                                width: `${calculateInputWidth(editingValue, 30, 60)}px !important`,
                                fontSize: 'inherit',
                                '& .MuiInputBase-input': {
                                  color: '#000000 !important',
                                  padding: '2px 4px !important',
                                  width: `${calculateInputWidth(editingValue, 30, 60)}px !important`
                                },
                                '& .MuiOutlinedInput-root': {
                                  minWidth: '30px !important',
                                  maxWidth: '60px !important',
                                  width: `${calculateInputWidth(editingValue, 30, 60)}px !important`
                                }
                              }}
                            />
                          ) : (
                            row.widthCount ? Number(row.widthCount).toLocaleString() : ''
                          )}
                        </TableCell>
                      )}
                      {(isMobile ? mobileProductColumnVisibility.quantity : columnVisibility.quantity) && (
                        <TableCell
                          sx={{ 
                            fontSize: 'calc(1em - 0.3px)',
                            color: row.type === 'option' ? '#1976d2' : 'inherit'
                          }}
                          onClick={() => {
                            if (!(editingCell && editingCell.rowIndex === index && editingCell.field === 'quantity')) {
                              setEditingCell({ rowIndex: index, field: 'quantity' });
                              setEditingValue(row?.quantity ? row.quantity.toString() : '');
                            }
                          }}
                        >
                          {editingCell?.rowIndex === index && editingCell?.field === 'quantity' ? (
                            <TextField
                              value={editingValue}
                              onChange={e => setEditingValue(e.target.value)}
                              onBlur={() => handleCellEdit(index, 'quantity', editingValue)}
                              onKeyDown={e => {
                                if (e.key === 'Tab') {
                                  e.preventDefault();
                                  if (e.shiftKey) {
                                    handleOrderTableCellKeyboardNavigation(index, 'quantity', 'prev');
                                  } else {
                                    handleOrderTableCellKeyboardNavigation(index, 'quantity', 'next');
                                  }
                                } else if (e.key === 'ArrowDown') {
                                  e.preventDefault();
                                  handleOrderTableCellKeyboardNavigation(index, 'quantity', 'down');
                                } else if (e.key === 'ArrowUp') {
                                  e.preventDefault();
                                  handleOrderTableCellKeyboardNavigation(index, 'quantity', 'up');
                                } else if (e.key === 'Enter') {
                                  e.preventDefault();
                                  handleOrderTableCellKeyboardNavigation(index, 'quantity', 'next');
                                } else if (e.key === 'Escape') {
                                  handleCellCancel();
                                }
                              }}
                              size="small"
                              autoFocus
                              inputProps={{
                                style: {
                                  width: `${calculateInputWidth(editingValue, 30, 60)}px`,
                                  minWidth: '30px',
                                  maxWidth: '60px',
                                  padding: '2px 4px',
                                  fontSize: 'inherit'
                                }
                              }}
                              sx={{ 
                                minWidth: '30px !important', 
                                maxWidth: '60px !important',
                                width: `${calculateInputWidth(editingValue, 30, 60)}px !important`,
                                fontSize: 'inherit',
                                '& .MuiInputBase-input': {
                                  color: '#000000 !important',
                                  padding: '2px 4px !important',
                                  width: `${calculateInputWidth(editingValue, 30, 60)}px !important`
                                },
                                '& .MuiOutlinedInput-root': {
                                  minWidth: '30px !important',
                                  maxWidth: '60px !important',
                                  width: `${calculateInputWidth(editingValue, 30, 60)}px !important`
                                }
                              }}
                            />
                          ) : (
                            row.quantity ? Number(row.quantity).toLocaleString() : ''
                          )}
                        </TableCell>
                      )}
                      {(isMobile ? mobileProductColumnVisibility.totalPrice : columnVisibility.totalPrice) && (
                        <TableCell sx={{ 
                          fontSize: 'calc(1em - 0.3px)',
                          color: row.type === 'option' ? '#1976d2' : 'inherit'
                        }}>
                          {row.totalPrice?.toLocaleString()}
                        </TableCell>
                      )}
                      {(isMobile ? mobileProductColumnVisibility.salePrice : columnVisibility.salePrice) && (
                        <TableCell sx={{ 
                          fontSize: 'calc(1em - 0.3px)',
                          color: row.type === 'option' ? '#1976d2' : 'inherit'
                        }}>
                          {row.salePrice?.toLocaleString()}
                        </TableCell>
                      )}
                      {(isMobile ? mobileProductColumnVisibility.cost : columnVisibility.cost) && (
                        <TableCell sx={{ 
                          fontSize: 'calc(1em - 0.3px)',
                          color: row.type === 'option' ? '#1976d2' : 'inherit'
                        }}>
                          {row.cost?.toLocaleString()}
                        </TableCell>
                      )}
                      {(isMobile ? mobileProductColumnVisibility.purchaseCost : columnVisibility.purchaseCost) && (
                        <TableCell sx={{ 
                          fontSize: 'calc(1em - 0.3px)',
                          color: row.type === 'option' ? '#1976d2' : 'inherit'
                        }}>
                          {row.purchaseCost?.toLocaleString()}
                        </TableCell>
                      )}
                      {(isMobile ? mobileProductColumnVisibility.margin : columnVisibility.margin) && (
                        <TableCell sx={{ 
                          fontSize: 'calc(1em - 0.3px)',
                          color: row.type === 'option' ? '#1976d2' : 'inherit'
                        }}>
                          {row.margin?.toLocaleString()}
                        </TableCell>
                      )}
                      <TableCell>
                        <IconButton 
                          size="small"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleEditRow(index);
                          }}
                          sx={{ 
                            color: selectedRowIndex === index ? 'primary.main' : 'inherit',
                            '&:hover': { backgroundColor: 'rgba(25, 118, 210, 0.1)' }
                          }}
                        >
                          <EditIcon fontSize="small" />
                        </IconButton>
                        <IconButton 
                          size="small"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleCopyRow(index);
                          }}
                          sx={{ 
                            color: selectedRowIndex === index ? 'primary.main' : 'inherit',
                            '&:hover': { backgroundColor: 'rgba(25, 118, 210, 0.1)' }
                          }}
                        >
                          <ContentCopyIcon fontSize="small" />
                        </IconButton>
                        <IconButton 
                          size="small"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteRow(index);
                          }}
                          sx={{ 
                            color: selectedRowIndex === index ? 'error.main' : 'inherit',
                            '&:hover': { backgroundColor: 'rgba(244, 67, 54, 0.1)' }
                          }}
                        >
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  ))}
                  {/* 합계 행 */}
                  <TableRow sx={{ backgroundColor: '#e3f2fd', fontWeight: 'bold', fontSize: 'calc(1em + 1px)' }}>
                    {isBulkEditMode && <TableCell></TableCell>}
                    <TableCell>합계</TableCell>
                    {(isMobile ? mobileProductColumnVisibility.vendor : columnVisibility.vendor) && <TableCell></TableCell>}
                    {(isMobile ? mobileProductColumnVisibility.brand : columnVisibility.brand) && <TableCell></TableCell>}
                    {(isMobile ? mobileProductColumnVisibility.space : columnVisibility.space) && <TableCell></TableCell>}
                    {(isMobile ? mobileProductColumnVisibility.productCode : columnVisibility.productCode) && <TableCell></TableCell>}
                    {(isMobile ? mobileProductColumnVisibility.productType : columnVisibility.productType) && <TableCell></TableCell>}
                    {(isMobile ? mobileProductColumnVisibility.productName : columnVisibility.productName) && <TableCell></TableCell>}
                    {(isMobile ? mobileProductColumnVisibility.width : columnVisibility.width) && <TableCell></TableCell>}
                    {(isMobile ? mobileProductColumnVisibility.details : columnVisibility.details) && <TableCell></TableCell>}
                    
                    {(isMobile ? mobileProductColumnVisibility.widthMM : columnVisibility.widthMM) && <TableCell></TableCell>}
                    {(isMobile ? mobileProductColumnVisibility.heightMM : columnVisibility.heightMM) && <TableCell></TableCell>}
                                          {(isMobile ? mobileProductColumnVisibility.area : columnVisibility.area) && (
                                            <TableCell>
                                              {orders[activeTab]?.rows
                                                ?.reduce((sum, row) => {
                                                  // 겉커튼은 면적 계산에서 제외
                                                  if (row?.curtainType === '겉커튼') {
                                                    return sum;
                                                  }
                                                  return sum + (Number(row?.area) || 0);
                                                }, 0)
                                                .toFixed(1)}
                                            </TableCell>
                                          )}
                    {(isMobile ? mobileProductColumnVisibility.lineDir : columnVisibility.lineDir) && <TableCell></TableCell>}
                    {(isMobile ? mobileProductColumnVisibility.lineLen : columnVisibility.lineLen) && <TableCell></TableCell>}
                    {(isMobile ? mobileProductColumnVisibility.pleatAmount : columnVisibility.pleatAmount) && <TableCell></TableCell>}
                    {(isMobile ? mobileProductColumnVisibility.widthCount : columnVisibility.widthCount) && <TableCell></TableCell>}
                                          {(isMobile ? mobileProductColumnVisibility.quantity : columnVisibility.quantity) && <TableCell>{orders[activeTab]?.rows?.reduce((sum, row) => sum + (Number(row?.quantity) || 0), 0)}</TableCell>}
                    {(isMobile ? mobileProductColumnVisibility.totalPrice : columnVisibility.totalPrice) && <TableCell>{sumTotalPrice.toLocaleString()}</TableCell>}
                    {(isMobile ? mobileProductColumnVisibility.salePrice : columnVisibility.salePrice) && <TableCell></TableCell>}
                    {(isMobile ? mobileProductColumnVisibility.cost : columnVisibility.cost) && <TableCell>{orders[activeTab]?.rows?.reduce((sum, row) => sum + (Number(row?.cost) || 0), 0).toLocaleString()}</TableCell>}
                    {(isMobile ? mobileProductColumnVisibility.purchaseCost : columnVisibility.purchaseCost) && <TableCell></TableCell>}
                    {(isMobile ? mobileProductColumnVisibility.margin : columnVisibility.margin) && <TableCell>{sumMargin.toLocaleString()}</TableCell>}
                    {!(isMobile ? mobileProductColumnVisibility.margin : columnVisibility.margin) && <TableCell></TableCell>}
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

              <Button
                variant="contained"
                size="small"
                sx={{
                  mx: 2,
                  backgroundColor: '#4caf50',
                  color: '#fff',
                  '&:hover': { backgroundColor: '#388e3c' },
                  fontWeight: 'bold',
                  boxShadow: 'none',
                  borderRadius: 1,
                  minWidth: 120,
                  paddingX: 2,
                }}
                onClick={generateVendorPurchaseOrders}
                disabled={!orders[activeTab]?.rows || orders[activeTab].rows.length === 0}
              >
                발주서 만들기
              </Button>
            </Box>
            {/* 할인 설정 - 소비자금액 바로 아래 */}
            {orders[activeTab]?.rows && orders[activeTab].rows.length > 0 && (
              <Box sx={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: 2, 
                mb: 2, 
                p: 2, 
                backgroundColor: '#f8f9fa', 
                borderRadius: 1, 
                border: '1px solid #e9ecef',
                flexWrap: 'wrap'
              }}>
                <Typography variant="subtitle2" sx={{ fontWeight: 'bold', color: '#000', mr: 2 }}>
                  할인 설정:
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mr: 2 }}>
                  <span style={{ fontSize: '14px', color: '#333' }}>할인금액:</span>
                  <input
                    type="text"
                    value={discountAmount ? Number(discountAmount).toLocaleString() : ''}
                    onChange={handleDiscountAmountChange}
                    style={{ 
                      width: 100, 
                      fontSize: '14px', 
                      padding: '4px 8px',
                      border: '1px solid #ccc',
                      borderRadius: '4px'
                    }}
                  />
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mr: 2 }}>
                  <span style={{ fontSize: '14px', color: '#333' }}>할인율(%):</span>
                  <input
                    type="number"
                    value={discountRate}
                    onChange={handleDiscountRateChange}
                    style={{ 
                      width: 60, 
                      fontSize: '14px',
                      padding: '4px 8px',
                      border: '1px solid #ccc',
                      borderRadius: '4px'
                    }}
                  />
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <span style={{ fontSize: '14px', color: '#333' }}>할인후금액:</span>
                  <input
                    type="text"
                    value={discountedTotalInput ? Number(discountedTotalInput).toLocaleString() : ''}
                    onChange={handleDiscountedTotalChange}
                    style={{ 
                      width: 120, 
                      fontSize: '14px',
                      padding: '4px 8px',
                      border: '1px solid #ccc',
                      borderRadius: '4px'
                    }}
                  />
                </Box>
              </Box>
            )}
            {/* 수금내역 및 AS접수내역 - 서술형으로 표시 */}
            {orders[activeTab] && orders[activeTab].estimateNo && (
              <Box sx={{ mt: 2, mb: 2, p: 2, backgroundColor: '#f8f9fa', borderRadius: 1, border: '1px solid #e9ecef' }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                  <Typography variant="h6" sx={{ fontWeight: 'bold', color: '#000' }}>
                    수금내역 및 AS접수내역
                  </Typography>
                  <Box sx={{ display: 'flex', gap: 1 }}>
                    <Tooltip title="수금입력">
                      <IconButton
                        size="small"
                        onClick={() => handleOpenPaymentModal(orders[activeTab])}
                        sx={{ 
                          color: 'var(--primary-color)',
                          border: '1px solid var(--border-color)',
                          '&:hover': {
                            backgroundColor: 'var(--hover-color)',
                            borderColor: 'var(--primary-color)',
                          },
                        }}
                      >
                        <AttachMoneyIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="AS접수">
                      <IconButton
                        size="small"
                        onClick={() => handleOpenASModal(orders[activeTab])}
                        sx={{ 
                          color: 'var(--secondary-color, #f50057)',
                          border: '1px solid var(--border-color)',
                          '&:hover': {
                            backgroundColor: 'rgba(245, 0, 87, 0.1)',
                            borderColor: 'var(--secondary-color)',
                          },
                        }}
                      >
                        <BuildIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  </Box>
                </Box>
                
                {/* 수금내역 서술형 표시 */}
                <Box sx={{ mb: 2 }}>
                  <Typography variant="subtitle1" sx={{ fontWeight: 'bold', color: '#000', mb: 1 }}>
                    수금내역:
                  </Typography>
                  {(() => {
                    const currentOrderPaymentRecords = paymentRecords[orders[activeTab]?.estimateNo] || [];
                    const totalPaymentAmount = currentOrderPaymentRecords.reduce((sum, record) => sum + record.amount, 0);
                    
                    // 할인후금액 계산
                    const currentOrder = orders[activeTab];
                    let discountedTotal = 0;
                    if (currentOrder) {
                      const totalAmount = currentOrder.rows?.reduce((sum: number, row: any) => sum + (Number(row?.totalPrice) || 0), 0) || 0;
                      if (currentOrder.discountedAmount !== undefined) {
                        discountedTotal = currentOrder.discountedAmount;
                      } else if (currentOrder.discountAmount && Number(currentOrder.discountAmount) > 0) {
                        discountedTotal = totalAmount - Number(currentOrder.discountAmount);
                      } else if (currentOrder.discountRate && Number(currentOrder.discountRate) > 0) {
                        discountedTotal = totalAmount - (totalAmount * Number(currentOrder.discountRate) / 100);
                      } else {
                        discountedTotal = totalAmount;
                      }
                    }
                    
                    const remainingAmount = discountedTotal - totalPaymentAmount;
                    
                    return (
                      <>
                        {currentOrderPaymentRecords.length > 0 ? (
                          <>
                            {currentOrderPaymentRecords.map((record, index) => (
                              <Box key={record.id} sx={{ mb: 1, pl: 2 }}>
                                <Typography variant="body2" sx={{ color: '#333', mb: 0.5 }}>
                                  {index + 1}. {record.paymentDate} - {record.paymentMethod}로 {record.amount.toLocaleString()}원 수금
                                </Typography>
                                {/* 오입금 송금 정보 표시 */}
                                {record.refundAmount && record.refundAmount > 0 && (
                                  <Typography variant="body2" sx={{ color: '#d32f2f', ml: 2, fontSize: '0.875rem' }}>
                                    ↳ {record.refundDate} - {record.refundMethod}로 {record.refundAmount.toLocaleString()}원 오입금 송금
                                    {record.refundMemo && ` (${record.refundMemo})`}
                                  </Typography>
                                )}
                              </Box>
                            ))}
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, pl: 2 }}>
                              <Typography variant="body2" sx={{ color: '#d32f2f', fontWeight: 'bold', mb: 0.5 }}>
                                (잔금: {remainingAmount.toLocaleString()}원)
                              </Typography>
                              {remainingAmount === 0 && (
                                <Chip
                                  label="수금완료"
                                  color="success"
                                  size="small"
                                  sx={{ 
                                    height: 20, 
                                    fontSize: '0.75rem',
                                    fontWeight: 'bold'
                                  }}
                                />
                              )}
                            </Box>
                          </>
                        ) : (
                          <Typography variant="body2" sx={{ color: '#666', fontStyle: 'italic', pl: 2 }}>
                            수금내역이 없습니다.
                          </Typography>
                        )}
                      </>
                    );
                  })()}
                </Box>

                {/* 최종견적서 정보 */}
                <Box sx={{ mb: 2 }}>
                  <Typography variant="subtitle1" sx={{ fontWeight: 'bold', color: '#000', mb: 1 }}>
                    최종견적서:
                  </Typography>
                  {(() => {
                    const currentOrder = orders[activeTab];
                    console.log('=== 최종견적서 표시 디버깅 ===');
                    console.log('현재 주문서:', currentOrder);
                    console.log('주문서 estimateNo:', currentOrder?.estimateNo);
                    
                    if (!currentOrder || !currentOrder.estimateNo) {
                      console.log('견적서 연결 실패: 주문서 또는 estimateNo 없음');
                      return (
                        <Typography variant="body2" sx={{ color: '#666', fontStyle: 'italic', pl: 2 }}>
                          연결된 견적서가 없습니다.
                        </Typography>
                      );
                    }

                    // 저장된 견적서에서 해당 견적서 찾기
                    const savedEstimates = JSON.parse(localStorage.getItem('saved_estimates') || '[]');
                    const linkedEstimate = savedEstimates.find((est: any) => est.estimateNo === currentOrder.estimateNo);
                    
                    console.log('저장된 견적서 목록:', savedEstimates);
                    console.log('찾으려는 estimateNo:', currentOrder.estimateNo);
                    console.log('찾은 견적서:', linkedEstimate);
                    
                    if (!linkedEstimate) {
                      console.log('견적서를 찾을 수 없음');
                      return (
                        <Typography variant="body2" sx={{ color: '#666', fontStyle: 'italic', pl: 2 }}>
                          견적서 정보를 찾을 수 없습니다. (견적번호: {currentOrder.estimateNo})
                        </Typography>
                      );
                    }

                    // 견적서 총 금액 계산
                    const totalAmount = linkedEstimate.rows?.reduce((sum: number, row: any) => {
                      let rowTotal = row.totalPrice || 0;
                      if (row.options && row.options.length > 0) {
                        row.options.forEach((option: any) => {
                          rowTotal += (option.salePrice || 0) * (option.quantity || 1);
                        });
                      }
                      return sum + rowTotal;
                    }, 0) || 0;

                    const consumerPrice = Math.round(totalAmount);
                    const discountedPrice = linkedEstimate.discountedAmount || consumerPrice;

                    return (
                      <Box sx={{ pl: 2 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                          <Typography variant="body2" sx={{ color: '#333', flex: 1 }}>
                            견적일자: {linkedEstimate.estimateDate || '미설정'}
                          </Typography>
                          <IconButton
                            size="small"
                            onClick={() => handleEstimatePrint(linkedEstimate)}
                            sx={{
                              color: 'var(--primary-color)',
                              '&:hover': {
                                backgroundColor: 'rgba(76, 175, 80, 0.1)'
                              }
                            }}
                          >
                            <PrintIcon fontSize="small" />
                          </IconButton>
                        </Box>
                        <Typography variant="body2" sx={{ color: '#333', mb: 1 }}>
                          견적번호: {linkedEstimate.estimateNo || '미설정'}
                        </Typography>
                        <Typography variant="body2" sx={{ color: '#333', mb: 1 }}>
                          소비자금액: {consumerPrice.toLocaleString()}원
                        </Typography>
                        <Typography variant="body2" sx={{ color: '#333', mb: 1 }}>
                          할인후금액: {discountedPrice.toLocaleString()}원
                        </Typography>
                      </Box>
                    );
                  })()}
                </Box>

                {/* AS접수내역 서술형 표시 */}
                <Box>
                  <Typography variant="subtitle1" sx={{ fontWeight: 'bold', color: '#000', mb: 1 }}>
                    AS접수내역:
                  </Typography>
                  {(asRequests[orders[activeTab]?.estimateNo] || []).length > 0 ? (
                    (asRequests[orders[activeTab]?.estimateNo] || [])
                      .map((request, index) => (
                        <Box key={request.id} sx={{ mb: 1, pl: 2 }}>
                          <Box sx={{ display: 'flex', alignItems: 'center', mb: 0.5 }}>
                            <Typography variant="body2" sx={{ color: '#333', flex: 1 }}>
                              {index + 1}. {request.asRequestDate} - {request.processingMethod}
                              {request.selectedProducts.length > 0 && ` (${request.selectedProducts.join(', ')})`}
                            </Typography>
                            <Box sx={{ position: 'relative', ml: 1 }}>
                              <IconButton
                                size="small"
                                onClick={(event) => handleASPrintMenuOpen(event, request)}
                                sx={{
                                  color: 'var(--primary-color)',
                                  '&:hover': {
                                    backgroundColor: 'rgba(76, 175, 80, 0.1)'
                                  }
                                }}
                              >
                                <PrintIcon fontSize="small" />
                              </IconButton>
                              <Menu
                                anchorEl={asPrintMenuAnchorEl}
                                open={asPrintMenuOpen}
                                onClose={handleASPrintMenuClose}
                                anchorOrigin={{
                                  vertical: 'bottom',
                                  horizontal: 'right',
                                }}
                                transformOrigin={{
                                  vertical: 'top',
                                  horizontal: 'right',
                                }}
                              >
                                <MenuItem onClick={() => handleASPrint('print', request)} sx={{ color: '#333', fontWeight: 'bold', '&:hover': { backgroundColor: 'rgba(76, 175, 80, 0.08)' } }}>
                                  <PrintIcon sx={{ mr: 1, fontSize: 20, color: '#4caf50' }} />
                                  프린트
                                </MenuItem>
                                <MenuItem onClick={() => handleASPrint('jpg', request)} sx={{ color: '#333', fontWeight: 'bold', '&:hover': { backgroundColor: 'rgba(255, 193, 7, 0.08)' } }}>
                                  <ImageIcon sx={{ mr: 1, fontSize: 20, color: '#ffc107' }} />
                                  JPG
                                </MenuItem>
                                <MenuItem onClick={() => handleASPrint('pdf', request)} sx={{ color: '#333', fontWeight: 'bold', '&:hover': { backgroundColor: 'rgba(233, 30, 99, 0.08)' } }}>
                                  <PictureAsPdfIcon sx={{ mr: 1, fontSize: 20, color: '#e91e63' }} />
                                  PDF
                                </MenuItem>
                                <MenuItem onClick={() => handleASPrint('kakao', request)} sx={{ color: '#333', fontWeight: 'bold', '&:hover': { backgroundColor: 'rgba(255, 235, 59, 0.08)' } }}>
                                  <ChatIcon sx={{ mr: 1, fontSize: 20, color: '#ffeb3b' }} />
                                  카톡전송
                                </MenuItem>
                              </Menu>
                            </Box>
                          </Box>
                          {request.problem && (
                            <Typography variant="body2" sx={{ color: '#666', pl: 2, fontSize: '0.9rem' }}>
                              문제점: {request.problem}
                            </Typography>
                          )}
                          {request.solution && (
                            <Typography variant="body2" sx={{ color: '#666', pl: 2, fontSize: '0.9rem' }}>
                              해결방안: {request.solution}
                            </Typography>
                          )}
                          {request.cost > 0 && (
                            <Typography variant="body2" sx={{ color: '#666', pl: 2, fontSize: '0.9rem' }}>
                              비용: {request.cost.toLocaleString()}원
                            </Typography>
                          )}
                          {request.memo && (
                            <Typography variant="body2" sx={{ color: '#666', pl: 2, fontSize: '0.9rem' }}>
                              메모: {request.memo}
                            </Typography>
                          )}
                          {request.asProcessDate && (
                            <Typography variant="body2" sx={{ color: '#666', pl: 2, fontSize: '0.9rem' }}>
                              AS처리일자: {new Date(request.asProcessDate).toLocaleDateString('ko-KR', {
                                year: 'numeric',
                                month: '2-digit',
                                day: '2-digit',
                                hour: '2-digit',
                                minute: '2-digit'
                              })}
                            </Typography>
                          )}
                          <Chip
                            label={request.status === 'AS완료' ? 'AS완료' : 'AS처리중'}
                            color={request.status === 'AS완료' ? 'success' : 'warning'}
                            size="small"
                            sx={{ 
                              ml: 2, 
                              mt: 0.5,
                              cursor: 'pointer',
                              '&:hover': {
                                opacity: 0.8
                              }
                            }}
                            onClick={() => handleOpenASEditModal(request)}
                          />
                        </Box>
                      ))
                  ) : (
                    <Typography variant="body2" sx={{ color: '#666', fontStyle: 'italic', pl: 2 }}>
                      AS접수내역이 없습니다.
                    </Typography>
                  )}
                </Box>
              </Box>
            )}


          </Paper>
        )}

        {/* 거래처별 발주서 목록 */}
        {orders[activeTab] && 
         vendorPurchaseOrders[orders[activeTab].id] && 
         Array.isArray(vendorPurchaseOrders[orders[activeTab].id]) && 
         vendorPurchaseOrders[orders[activeTab].id].length > 0 && (
          <Paper sx={{ p: isMobile ? 1 : 2, mb: 2 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="h6" sx={{ fontWeight: 'bold', color: 'var(--text-color)' }}>
                거래처별 발주서 목록
              </Typography>
              <Box sx={{ display: 'flex', gap: 1 }}>
                <Button
                  variant="outlined"
                  size="small"
                  onClick={() => handlePrintAllPurchaseOrders('jpg')}
                >
                  전체 JPG
                </Button>
                <Button
                  variant="outlined"
                  size="small"
                  onClick={() => handlePrintAllPurchaseOrders('pdf')}
                >
                  전체 PDF
                </Button>
              </Box>
            </Box>
            <Grid container spacing={2}>
              {vendorPurchaseOrders[orders[activeTab].id].map((order, index) => (
                <Grid item xs={12} sm={6} md={4} key={index}>
                  <Card sx={{ 
                    p: 2.5, 
                    position: 'relative',
                    borderRadius: 2,
                    border: '1px solid var(--border-color)',
                    backgroundColor: getCurrentVendorPurchaseOrderStatus(order.vendor) === 'pending' ? 'rgba(244, 67, 54, 0.15)' : 'transparent',
                    transition: 'all 0.2s ease-in-out',
                    '&:hover': { 
                      backgroundColor: getCurrentVendorPurchaseOrderStatus(order.vendor) === 'pending' 
                        ? 'rgba(244, 67, 54, 0.2)' 
                        : 'rgba(76, 175, 80, 0.08)',
                      transform: 'translateY(-2px)',
                      boxShadow: '0 4px 12px rgba(0,0,0,0.15)'
                    }
                  }}
                  >
                    {/* 출력 버튼 */}
                    <IconButton
                      size="small"
                      onClick={(e) => {
                        e.stopPropagation();
                        // 선택된 거래처 설정
                        setSelectedVendorForPrint(order.vendor);
                        // 발주서 출력 미리보기 모달 열기
                        setPurchaseOrderPrintModalOpen(true);
                      }}
                      sx={{
                        position: 'absolute',
                        top: 8,
                        right: 36,
                        backgroundColor: 'rgba(255, 255, 255, 0.95)',
                        color: '#1976d2',
                        width: 28,
                        height: 28,
                        '&:hover': {
                          backgroundColor: 'rgba(255, 255, 255, 1)',
                          color: '#1565c0',
                          transform: 'scale(1.1)'
                        },
                        zIndex: 1,
                        transition: 'all 0.2s ease-in-out'
                      }}
                    >
                      <PrintIcon sx={{ fontSize: 16 }} />
                    </IconButton>

                    {/* 삭제 버튼 */}
                    <IconButton
                      size="small"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeletePurchaseOrder(order.vendor);
                      }}
                      sx={{
                        position: 'absolute',
                        top: 8,
                        right: 8,
                        backgroundColor: 'rgba(255, 255, 255, 0.95)',
                        color: '#d32f2f',
                        width: 28,
                        height: 28,
                        '&:hover': {
                          backgroundColor: 'rgba(255, 255, 255, 1)',
                          color: '#b71c1c',
                          transform: 'scale(1.1)'
                        },
                        zIndex: 1,
                        transition: 'all 0.2s ease-in-out'
                      }}
                    >
                      <DeleteIcon sx={{ fontSize: 16 }} />
                    </IconButton>

                    {/* 거래처명과 발주완료 뱃지 */}
                    <Box sx={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      mb: 1.5 
                    }}>
                      <Typography 
                        variant="h6" 
                        sx={{ 
                          fontWeight: 'bold', 
                          color: 'var(--text-color)',
                          fontSize: '1.1rem',
                          lineHeight: 1.2
                        }}
                      >
                        {order.vendor}
                      </Typography>
                      <Chip
                        label={getCurrentVendorPurchaseOrderStatus(order.vendor) === 'completed' ? '발주완료' : '발주대기'}
                        size="small"
                        onClick={(e) => {
                          e.stopPropagation(); // 이벤트 전파 중단
                          const currentStatus = getCurrentVendorPurchaseOrderStatus(order.vendor);
                          const newStatus = currentStatus === 'completed' ? 'pending' : 'completed';
                          updateVendorPurchaseOrderStatus(order.vendor, newStatus);
                        }}
                        sx={{
                          backgroundColor: getCurrentVendorPurchaseOrderStatus(order.vendor) === 'completed' ? '#4caf50' : '#f44336',
                          color: 'white',
                          fontSize: '0.7rem',
                          fontWeight: '600',
                          height: '20px',
                          ml: 1,
                          cursor: 'pointer',
                          '&:hover': {
                            backgroundColor: getCurrentVendorPurchaseOrderStatus(order.vendor) === 'completed' ? '#45a049' : '#d32f2f',
                          },
                          '& .MuiChip-label': {
                            px: 1
                          }
                        }}
                      />
                    </Box>



                    {/* 발주 정보 편집 섹션 */}
                    <Box sx={{ 
                      mt: 2, 
                      p: 1.5, 
                      backgroundColor: 'rgba(76, 175, 80, 0.05)', 
                      borderRadius: 1,
                      border: '1px solid rgba(76, 175, 80, 0.2)'
                    }}>
                      {/* 발주일자와 발주명 */}
                      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, mb: 1 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Typography variant="body2" sx={{ 
                            color: '#2e7d32', 
                            fontSize: '0.75rem', 
                            fontWeight: '600',
                            minWidth: '60px'
                          }}>
                            발주일자:
                          </Typography>
                          <TextField
                            type="date"
                            size="small"
                            value={getCurrentVendorPurchaseOrderInfo(order.vendor)?.purchaseOrderDate || getLocalDate()}
                            onChange={(e) => updateVendorPurchaseOrderInfo(order.vendor, 'purchaseOrderDate', e.target.value)}
                            sx={{
                              flex: 1,
                              '& .MuiOutlinedInput-root': {
                                fontSize: '0.75rem',
                                height: '28px',
                                '& input': {
                                  padding: '4px 8px'
                                }
                              }
                            }}
                          />
                        </Box>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Typography variant="body2" sx={{ 
                            color: '#2e7d32', 
                            fontSize: '0.75rem', 
                            fontWeight: '600',
                            minWidth: '60px'
                          }}>
                            발주명:
                          </Typography>
                          <TextField
                            size="small"
                            value={getCurrentVendorPurchaseOrderInfo(order.vendor)?.purchaseOrderName || ''}
                            onChange={(e) => updateVendorPurchaseOrderInfo(order.vendor, 'purchaseOrderName', e.target.value)}
                            placeholder="발주서 제목을 입력하세요"
                            sx={{
                              flex: 1,
                              '& .MuiOutlinedInput-root': {
                                fontSize: '0.75rem',
                                height: '28px',
                                '& input': {
                                  padding: '4px 8px'
                                }
                              }
                            }}
                          />
                        </Box>
                      </Box>
                      
                      {/* 납품방법과 납품일자 */}
                      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, mb: 1 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Typography variant="body2" sx={{ 
                            color: '#2e7d32', 
                            fontSize: '0.75rem', 
                            fontWeight: '600',
                            minWidth: '60px'
                          }}>
                            납품방법:
                          </Typography>
                                                     <Select
                             size="small"
                             value={getCurrentVendorPurchaseOrderInfo(order.vendor)?.deliveryMethod || '직접배송'}
                             onChange={(e) => updateVendorPurchaseOrderInfo(order.vendor, 'deliveryMethod', e.target.value)}
                             sx={{
                               flex: 1,
                               fontSize: '0.75rem',
                               height: '28px',
                               '& .MuiSelect-select': {
                                 padding: '4px 8px'
                               },
                               '& .MuiMenu-paper': {
                                 backgroundColor: '#ffffff !important',
                                 color: '#2c3e50 !important'
                               },
                               '& .MuiMenuItem-root': {
                                 color: '#2c3e50 !important',
                                 backgroundColor: '#ffffff !important',
                                 '&:hover': {
                                   backgroundColor: '#f5f5f5 !important'
                                 }
                               }
                             }}
                           >
                             <MenuItem value="직접배송" sx={{ color: '#2c3e50 !important' }}>직접배송</MenuItem>
                             <MenuItem value="택배배송" sx={{ color: '#2c3e50 !important' }}>택배배송</MenuItem>
                             <MenuItem value="화물배송" sx={{ color: '#2c3e50 !important' }}>화물배송</MenuItem>
                           </Select>
                        </Box>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Typography variant="body2" sx={{ 
                            color: '#2e7d32', 
                            fontSize: '0.75rem', 
                            fontWeight: '600',
                            minWidth: '60px'
                          }}>
                            {(getCurrentVendorPurchaseOrderInfo(order.vendor)?.deliveryMethod || '직접배송') === '택배배송' ? '발송일자:' : '납품일자:'}
                          </Typography>
                          <TextField
                            type="date"
                            size="small"
                            value={getCurrentVendorPurchaseOrderInfo(order.vendor)?.deliveryDate || getLocalDate()}
                            onChange={(e) => updateVendorPurchaseOrderInfo(order.vendor, 'deliveryDate', e.target.value)}
                            sx={{
                              flex: 1,
                              '& .MuiOutlinedInput-root': {
                                fontSize: '0.75rem',
                                height: '28px',
                                '& input': {
                                  padding: '4px 8px'
                                }
                              }
                            }}
                          />
                        </Box>
                      </Box>
                      
                      {/* 추가 전달사항 */}
                      <Box sx={{ mt: 1 }}>
                        <Typography variant="body2" sx={{ 
                          color: '#2e7d32', 
                          fontSize: '0.75rem', 
                          fontWeight: '600',
                          mb: 0.5
                        }}>
                          추가 전달사항:
                        </Typography>
                        <TextField
                          multiline
                          rows={2}
                          size="small"
                          value={getCurrentVendorPurchaseOrderInfo(order.vendor)?.additionalNotes || ''}
                          onChange={(e) => updateVendorPurchaseOrderInfo(order.vendor, 'additionalNotes', e.target.value)}
                          placeholder="발주서에 포함할 추가 전달사항을 입력하세요..."
                          sx={{
                            width: '100%',
                            '& .MuiOutlinedInput-root': {
                              fontSize: '0.7rem',
                              '& textarea': {
                                padding: '4px 8px',
                                lineHeight: 1.3
                              }
                            }
                          }}
                        />
                      </Box>
                    </Box>


                  </Card>
                </Grid>
              ))}
            </Grid>
          </Paper>
        )}

        </>
        )}

        {/* 주문서 목록 - 항상 최하단에 표시 */}
        <Paper sx={{ p: isMobile ? 1 : 2 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography variant="h6" sx={{ fontWeight: 'bold', color: '#000' }}>
              저장된 주문서 목록
            </Typography>
            <IconButton
              onClick={() => setSavedOrderColumnSettingsOpen(true)}
              sx={{ 
                color: 'var(--primary-color)',
                border: '1px solid var(--border-color)',
                '&:hover': {
                  backgroundColor: 'var(--hover-color)',
                  borderColor: 'var(--primary-color)',
                },
              }}
            >
              <SettingsIcon />
            </IconButton>
          </Box>
          {filteredSavedOrders.length > 0 ? (
            <TableContainer>
              <Table size={isMobile ? "small" : "medium"}>
                <TableHead>
                  <TableRow>
                    {(isMobile ? mobileSavedOrderColumnVisibility.address : savedOrderColumnVisibility.address) && (
                      <TableCell sx={{ color: '#000', fontWeight: 'bold', fontSize: 'calc(1rem + 0.8px)' }}>주소</TableCell>
                    )}
                    {(isMobile ? mobileSavedOrderColumnVisibility.customerName : savedOrderColumnVisibility.customerName) && (
                      <TableCell sx={{ color: '#000', fontWeight: 'bold', fontSize: 'calc(1rem + 0.8px)' }}>고객명</TableCell>
                    )}
                    {(isMobile ? mobileSavedOrderColumnVisibility.contact : savedOrderColumnVisibility.contact) && (
                      <TableCell sx={{ color: '#000', fontWeight: 'bold', fontSize: 'calc(1rem + 0.8px)' }}>연락처</TableCell>
                    )}
                    {(isMobile ? mobileSavedOrderColumnVisibility.estimateNo : savedOrderColumnVisibility.estimateNo) && (
                      <TableCell sx={{ color: '#000', fontWeight: 'bold', fontSize: 'calc(1rem + 0.8px)' }}>주문번호</TableCell>
                    )}
                    {(isMobile ? mobileSavedOrderColumnVisibility.estimateDate : savedOrderColumnVisibility.estimateDate) && (
                      <TableCell sx={{ color: '#000', fontWeight: 'bold', fontSize: 'calc(1rem + 0.8px)' }}>주문일자</TableCell>
                    )}
                    {(isMobile ? mobileSavedOrderColumnVisibility.installationDate : savedOrderColumnVisibility.installationDate) && (
                      <TableCell sx={{ color: '#000', fontWeight: 'bold', fontSize: 'calc(1rem + 0.8px)' }}>시공일자</TableCell>
                    )}
                    {(isMobile ? mobileSavedOrderColumnVisibility.totalAmount : savedOrderColumnVisibility.totalAmount) && (
                      <TableCell sx={{ color: '#000', fontWeight: 'bold', fontSize: 'calc(1rem + 0.8px)' }}>소비자금액</TableCell>
                    )}
                    {(isMobile ? mobileSavedOrderColumnVisibility.discountedAmount : savedOrderColumnVisibility.discountedAmount) && (
                      <TableCell sx={{ color: '#000', fontWeight: 'bold', fontSize: 'calc(1rem + 0.8px)' }}>할인후금액</TableCell>
                    )}
                    {(isMobile ? mobileSavedOrderColumnVisibility.actions : savedOrderColumnVisibility.actions) && (
                      <TableCell sx={{ color: '#000', fontWeight: 'bold', fontSize: 'calc(1rem + 0.8px)' }}>액션</TableCell>
                    )}
                  </TableRow>
                </TableHead>
                <TableBody>
                  {filteredSavedOrders.map((order: any) => {
                    // 소비자금액 계산 (총 판매가)
                    const totalAmount = order.rows?.reduce((sum: number, row: any) => sum + (Number(row?.totalPrice) || 0), 0) || 0;
                    
                    // 할인후금액 계산 (저장된 할인 설정 반영)
                    let discountedAmount = totalAmount;
                    if (order.discountedAmount !== undefined) {
                      // 저장된 할인후금액이 있으면 사용
                      discountedAmount = order.discountedAmount;
                    } else if (order.discountAmount && Number(order.discountAmount) > 0) {
                      // 할인금액이 저장되어 있으면 계산
                      discountedAmount = totalAmount - Number(order.discountAmount);
                    } else if (order.discountRate && Number(order.discountRate) > 0) {
                      // 할인율이 저장되어 있으면 계산
                      discountedAmount = totalAmount - (totalAmount * Number(order.discountRate) / 100);
                    }
                    
                    // 수금내역에서 총 수금액 계산
                    const orderPaymentRecords = paymentRecords[order.estimateNo] || [];
                    const totalPaymentAmount = orderPaymentRecords.reduce((sum: number, record: any) => sum + record.amount, 0);
                    const remainingAmount = discountedAmount - totalPaymentAmount;
                    
                    // AS상태 확인
                    const orderASRequests = asRequests[order.estimateNo] || [];
                    const hasASRequests = orderASRequests.length > 0;
                    const hasCompletedAS = orderASRequests.some((request: any) => request.status === 'AS완료');
                    const hasProcessingAS = orderASRequests.some((request: any) => request.status === 'AS처리중');
                    
                    // AS상태 결정: 처리중이 하나라도 있으면 처리중, 모두 완료면 완료
                    const asStatus = hasProcessingAS ? 'AS처리중' : (hasCompletedAS ? 'AS완료' : null);
                    
                    // 모든 뱃지가 완료 상태인지 확인
                    const isAllCompleted = (
                      order.productStatus === '납품완료' && 
                      remainingAmount === 0 && 
                      (!hasASRequests || asStatus === 'AS완료')
                    );

                    return (
                      <TableRow 
                        key={order.id}
                        onContextMenu={(e) => handleSavedOrderContextMenu(e, order)}
                        onTouchStart={() => handleSavedOrderTouchStart(order)}
                        onTouchEnd={handleTouchEnd}
                        onDoubleClick={() => handleLoadSavedOrder(order)}
                        sx={{ 
                          cursor: 'pointer',
                          backgroundColor: isAllCompleted ? 'rgba(144, 238, 144, 0.3)' : 'inherit',
                          '&:hover': {
                            backgroundColor: isAllCompleted 
                              ? 'rgba(144, 238, 144, 0.4)' 
                              : 'rgba(0, 0, 0, 0.04)'
                          }
                        }}
                      >
                        {(isMobile ? mobileSavedOrderColumnVisibility.address : savedOrderColumnVisibility.address) && (
                          <TableCell sx={{ color: '#000', fontSize: 'calc(1rem + 0.8px)' }}>
                            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                              <span>{order.address}</span>
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
                                {/* 발주 상태 뱃지 */}
                                {(() => {
                                  const currentOrderId = order.id;
                                  const vendorPurchaseOrdersForThisOrder = vendorPurchaseOrders[currentOrderId] || [];
                                  const hasPendingOrders = vendorPurchaseOrdersForThisOrder.some(vendorOrder => 
                                    getCurrentVendorPurchaseOrderStatus(vendorOrder.vendor) === 'pending'
                                  );
                                  const hasCompletedOrders = vendorPurchaseOrdersForThisOrder.some(vendorOrder => 
                                    getCurrentVendorPurchaseOrderStatus(vendorOrder.vendor) === 'completed'
                                  );
                                  
                                  // 발주서가 있는 경우
                                  if (vendorPurchaseOrdersForThisOrder.length > 0) {
                                    if (hasPendingOrders) {
                                      return (
                                        <Chip
                                          label="발주대기"
                                          color="error"
                                          size="small"
                                          sx={{
                                            height: 20,
                                            fontSize: '0.75rem',
                                            fontWeight: 'bold'
                                          }}
                                        />
                                      );
                                    } else if (hasCompletedOrders) {
                                      return (
                                        <Chip
                                          label="발주완료"
                                          color="success"
                                          size="small"
                                          sx={{
                                            height: 20,
                                            fontSize: '0.75rem',
                                            fontWeight: 'bold'
                                          }}
                                        />
                                      );
                                    }
                                  }
                                  
                                  // 발주서가 없는 경우 기본적으로 "발주대기" 표시
                                  return (
                                    <Chip
                                      label="발주대기"
                                      color="error"
                                      size="small"
                                      sx={{
                                        height: 20,
                                        fontSize: '0.75rem',
                                        fontWeight: 'bold'
                                      }}
                                    />
                                  );
                                })()}
                                {/* 제품준비/납품완료 뱃지 */}
                                <Chip
                                  label={order.productStatus || '제품준비'}
                                  color={order.productStatus === '납품완료' ? 'success' : 'error'}
                                  size="small"
                                  sx={{ 
                                    height: 20, 
                                    fontSize: '0.75rem',
                                    fontWeight: 'bold',
                                    cursor: 'pointer',
                                    '&:hover': {
                                      opacity: 0.8
                                    }
                                  }}
                                  onClick={() => handleToggleProductStatus(order)}
                                />
                                {/* 수금 상태 뱃지 */}
                                {remainingAmount === 0 ? (
                                  <Chip
                                    label="수금완료"
                                    color="success"
                                    size="small"
                                    sx={{ 
                                      height: 20, 
                                      fontSize: '0.75rem',
                                      fontWeight: 'bold'
                                    }}
                                  />
                                ) : (
                                  <Chip
                                    label="미수금"
                                    color="error"
                                    size="small"
                                    onClick={() => handleOpenPaymentModal(order)}
                                    sx={{ 
                                      height: 20, 
                                      fontSize: '0.75rem',
                                      fontWeight: 'bold',
                                      cursor: 'pointer',
                                      '&:hover': {
                                        opacity: 0.8
                                      }
                                    }}
                                  />
                                )}
                                {asStatus && (
                                  <Chip
                                    label={asStatus}
                                    color={asStatus === 'AS완료' ? 'success' : 'warning'}
                                    size="small"
                                    sx={{ 
                                      height: 20, 
                                      fontSize: '0.75rem',
                                      fontWeight: 'bold'
                                    }}
                                  />
                                )}
                              </Box>
                            </Box>
                          </TableCell>
                        )}
                        {(isMobile ? mobileSavedOrderColumnVisibility.customerName : savedOrderColumnVisibility.customerName) && (
                          <TableCell sx={{ color: '#000', fontSize: 'calc(1rem + 0.8px)' }}>{order.customerName}</TableCell>
                        )}
                        {(isMobile ? mobileSavedOrderColumnVisibility.contact : savedOrderColumnVisibility.contact) && (
                          <TableCell sx={{ color: '#000', fontSize: 'calc(1rem + 0.8px)' }}>{order.contact}</TableCell>
                        )}
                        {(isMobile ? mobileSavedOrderColumnVisibility.estimateNo : savedOrderColumnVisibility.estimateNo) && (
                          <TableCell sx={{ color: '#000', fontSize: 'calc(1rem + 0.8px)' }}>{order.estimateNo}</TableCell>
                        )}
                        {(isMobile ? mobileSavedOrderColumnVisibility.estimateDate : savedOrderColumnVisibility.estimateDate) && (
                          <TableCell sx={{ color: '#000', fontSize: 'calc(1rem + 0.8px)' }}>{order.estimateDate}</TableCell>
                        )}
                        {(isMobile ? mobileSavedOrderColumnVisibility.installationDate : savedOrderColumnVisibility.installationDate) && (
                          <TableCell sx={{ color: '#000', fontSize: 'calc(1rem + 0.8px)' }}>{order.installationDate ? new Date(order.installationDate).toLocaleString('ko-KR', {
                            year: 'numeric',
                            month: '2-digit',
                            day: '2-digit',
                            hour: '2-digit',
                            minute: '2-digit'
                          }) : '-'}</TableCell>
                        )}
                        {(isMobile ? mobileSavedOrderColumnVisibility.totalAmount : savedOrderColumnVisibility.totalAmount) && (
                          <TableCell sx={{ color: '#000', fontSize: 'calc(1rem + 0.8px)' }}>{totalAmount.toLocaleString()}원</TableCell>
                        )}
                        {(isMobile ? mobileSavedOrderColumnVisibility.discountedAmount : savedOrderColumnVisibility.discountedAmount) && (
                          <TableCell sx={{ color: '#000', fontSize: 'calc(1rem + 0.8px)' }}>{discountedAmount.toLocaleString()}원</TableCell>
                        )}
                        {(isMobile ? mobileSavedOrderColumnVisibility.actions : savedOrderColumnVisibility.actions) && (
                          <TableCell sx={{ fontSize: 'calc(1rem + 0.8px)' }}>
                            <Box sx={{ display: 'flex', gap: 0.5, flexDirection: isMobile ? 'column' : 'row' }}>
                              <Tooltip title="로드">
                                <IconButton
                                  size="small"
                                  onClick={() => handleLoadSavedOrder(order)}
                                  sx={{ 
                                    color: 'var(--primary-color)',
                                    '&:hover': {
                                      backgroundColor: 'rgba(76, 175, 80, 0.1)',
                                    },
                                  }}
                                >
                                  <FolderOpenIcon fontSize="small" />
                                </IconButton>
                              </Tooltip>
                              <Tooltip title="수금입력">
                                <IconButton
                                  size="small"
                                  onClick={() => handleOpenPaymentModal(order)}
                                  sx={{ 
                                    color: 'var(--primary-color)',
                                    '&:hover': {
                                      backgroundColor: 'rgba(76, 175, 80, 0.1)',
                                    },
                                  }}
                                >
                                  <AttachMoneyIcon fontSize="small" />
                                </IconButton>
                              </Tooltip>
                              <Tooltip title="AS접수">
                                <IconButton
                                  size="small"
                                  onClick={() => handleOpenASModal(order)}
                                  sx={{ 
                                    color: 'var(--secondary-color, #f50057)',
                                    '&:hover': {
                                      backgroundColor: 'rgba(245, 0, 87, 0.1)',
                                    },
                                  }}
                                >
                                  <BuildIcon fontSize="small" />
                                </IconButton>
                              </Tooltip>
                            </Box>
                          </TableCell>
                        )}
                      </TableRow>
                    );
                  })}
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

      {/* 고객리스트 모달 */}
      <Dialog
        open={customerListModalOpen}
        onClose={() => setCustomerListModalOpen(false)}
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
              onClick={() => setCustomerListModalOpen(false)}
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
            variant="body1"
            component="span"
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
              backgroundColor: 'var(--surface-color)',
              fontWeight: 'bold',
            },
            '& .MuiTableBody-root .MuiTableRow-root:hover': {
              backgroundColor: 'var(--hover-color)',
            },
          }}>
            <Table size={isMobile ? "small" : "medium"}>
              <TableHead>
                <TableRow>
                  <TableCell>고객명</TableCell>
                  <TableCell>연락처</TableCell>
                  <TableCell>주소</TableCell>
                  <TableCell>프로젝트 수</TableCell>
                  <TableCell>등록일</TableCell>
                  <TableCell>액션</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredCustomers.map((customer) => (
                  <TableRow key={customer.id} hover>
                    <TableCell sx={{ color: 'var(--text-color)' }}>{customer.name}</TableCell>
                    <TableCell sx={{ color: 'var(--text-color)' }}>{customer.tel}</TableCell>
                    <TableCell sx={{ color: 'var(--text-color)' }}>{customer.address}</TableCell>
                    <TableCell sx={{ color: 'var(--text-color)' }}>
                      {customer.projects?.length || 0}개
                    </TableCell>
                    <TableCell sx={{ color: 'var(--text-color)' }}>
                      {customer.createdAt ? new Date(customer.createdAt).toLocaleDateString('ko-KR') : '-'}
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="contained"
                        size="small"
                        onClick={() => handleCustomerSelect(customer)}
                        sx={{
                          backgroundColor: 'var(--primary-color)',
                          color: 'white',
                          '&:hover': {
                            backgroundColor: 'var(--primary-hover-color)',
                          },
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
          {filteredCustomers.length === 0 && (
            <Box sx={{ textAlign: 'center', py: 4 }}>
              <Typography sx={{ color: 'var(--text-secondary-color)' }}>
                {customerSearch ? '검색 결과가 없습니다.' : '저장된 고객이 없습니다.'}
              </Typography>
            </Box>
          )}
        </DialogContent>
        {!isMobile && (
          <DialogActions sx={{ backgroundColor: 'var(--surface-color)', borderTop: '1px solid var(--border-color)' }}>
            <Button 
              onClick={() => setCustomerListModalOpen(false)}
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

      {/* 발주서 모달 */}
      <Dialog
        open={purchaseOrderModalOpen}
        onClose={() => setPurchaseOrderModalOpen(false)}
        maxWidth="lg"
        fullWidth
        sx={{
          '& .MuiDialog-paper': {
            '@media (max-width: 768px)': {
              margin: '10px',
              maxWidth: 'calc(100% - 20px)',
              maxHeight: 'calc(100% - 20px)'
            },
            '@media (max-width: 480px)': {
              margin: '5px',
              maxWidth: 'calc(100% - 10px)',
              maxHeight: 'calc(100% - 10px)'
            }
          }
        }}
      >
        <DialogTitle 
          sx={{ 
            color: '#000',
            '@media print': {
              display: 'none !important',
              visibility: 'hidden !important',
              opacity: 0,
              position: 'absolute',
              left: '-9999px',
              top: '-9999px',
              width: 0,
              height: 0,
              overflow: 'hidden',
              clip: 'rect(0, 0, 0, 0)',
              margin: 0,
              padding: 0,
              border: 0,
              pointerEvents: 'none'
            },
            '@media (max-width: 768px)': {
              padding: '12px 16px'
            },
            '@media (max-width: 480px)': {
              padding: '8px 12px'
            }
          }} 
          className="no-print"
        >
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="h6" sx={{ fontWeight: 'bold', color: '#000' }}>
              {selectedVendor} 발주서
            </Typography>
            <Box sx={{ display: 'flex', gap: 1 }}>
              <Button
                variant="outlined"
                size="small"
                onClick={() => setPurchaseOrderType('basic')}
                color={purchaseOrderType === 'basic' ? 'primary' : 'inherit'}
              >
                기본양식
              </Button>
              <Button
                variant="outlined"
                size="small"
                onClick={() => setPurchaseOrderType('simple')}
                color={purchaseOrderType === 'simple' ? 'primary' : 'inherit'}
              >
                간단양식
              </Button>
              <IconButton
                size="small"
                onClick={() => setCompanyInfoModalOpen(true)}
                sx={{
                  border: '1px solid #ddd',
                  color: '#666',
                  '&:hover': {
                    borderColor: '#FF6B9D',
                    color: '#FF6B9D',
                  },
                }}
              >
                <SettingsIcon />
              </IconButton>
            </Box>
          </Box>
        </DialogTitle>
        <DialogContent sx={{
          '@media (max-width: 768px)': {
            padding: '16px'
          },
          '@media (max-width: 480px)': {
            padding: '12px'
          }
        }}>
          {/* 기본양식 - A4 최적화 전문 발주서 양식 */}
          {purchaseOrderType === 'basic' && (
            <>
              {/* A4 최적화 컨테이너 */}
              <Box 
                className="purchase-order-a4-container"
                sx={{ 
                  width: '100%',
                  maxWidth: '210mm', // A4 가로
                  minHeight: '297mm', // A4 세로
                  margin: '0 auto',
                  padding: '20mm', // A4 여백
                  backgroundColor: 'white',
                  boxShadow: '0 0 20px rgba(0,0,0,0.1)',
                  borderRadius: '8px',
                  '@media print': {
                    boxShadow: 'none',
                    borderRadius: '0',
                    padding: '15mm',
                    maxWidth: 'none',
                    minHeight: 'auto'
                  },
                  '@media (max-width: 768px)': {
                    maxWidth: '100%',
                    minHeight: 'auto',
                    padding: '10mm',
                    margin: '0',
                    borderRadius: '0'
                  },
                  '@media (max-width: 480px)': {
                    padding: '5mm',
                    boxShadow: 'none'
                  }
                }}
              >
                {/* 차분하고 신뢰감 있는 헤더 */}
                <div style={{ textAlign: 'center', marginBottom: '3mm', position: 'relative' }}>
                  <Typography variant="h2" sx={{
                    fontWeight: 600,
                    color: '#2c3e50',
                    letterSpacing: '1mm',
                    fontSize: '5mm',
                    mb: '1.5mm',
                    '@media print': { fontSize: '4.5mm' },
                    '@media (max-width: 768px)': { fontSize: '4mm', mb: '1mm' },
                    '@media (max-width: 480px)': { fontSize: '3.5mm', mb: '0.8mm' }
                  }}>
                    발주서
                  </Typography>
                  <Typography variant="h4" sx={{
                    color: '#34495e',
                    fontWeight: 400,
                    fontSize: '3.5mm',
                    mb: '1mm',
                    '@media print': { fontSize: '3mm' },
                    '@media (max-width: 768px)': { fontSize: '2.8mm', mb: '0.8mm' },
                    '@media (max-width: 480px)': { fontSize: '2.5mm', mb: '0.6mm' }
                  }}>
                    PURCHASE ORDER
                  </Typography>
                  {/* 우측 상단 회사 정보 */}
                  <Box sx={{ 
                    position: 'absolute', 
                    top: '3mm', 
                    right: '3mm', 
                    textAlign: 'right',
                    '@media (max-width: 768px)': { top: '2mm', right: '2mm' },
                    '@media (max-width: 480px)': { top: '1mm', right: '1mm' }
                  }}>
                    <Typography variant="h6" sx={{ 
                      color: '#2c3e50', 
                      fontWeight: 500, 
                      fontSize: '2.8mm', 
                      mb: '0.3mm', 
                      '@media print': { fontSize: '2.4mm', color: '#2c3e50' },
                      '@media (max-width: 768px)': { fontSize: '2.4mm', mb: '0.2mm' },
                      '@media (max-width: 480px)': { fontSize: '2.2mm', mb: '0.1mm' }
                    }}>
                      {selectedCompanyInfo?.companyName || ''}
                    </Typography>
                    <Typography variant="body2" sx={{ 
                      color: '#34495e', 
                      fontSize: '2.2mm', 
                      '@media print': { fontSize: '2mm', color: '#34495e' },
                      '@media (max-width: 768px)': { fontSize: '2mm' },
                      '@media (max-width: 480px)': { fontSize: '1.8mm' }
                    }}>
                      {getLocalDate()}
                    </Typography>
                  </Box>
                </div>

                {/* 기본정보 섹션 */}
                                  <Box sx={{ 
                    mb: '3mm',
                    '@media (max-width: 768px)': { mb: '2mm' },
                    '@media (max-width: 480px)': { mb: '1.5mm' }
                  }}>
                    <Typography variant="h4" sx={{
                      fontWeight: 600,
                      mb: '0.8mm',
                      color: '#2c3e50',
                      borderBottom: '0.3mm solid #2c3e50',
                      pb: '0.3mm',
                      display: 'inline-block',
                      fontSize: '2.8mm',
                      '@media print': { fontSize: '2.5mm', mb: '0.6mm' },
                      '@media (max-width: 768px)': { fontSize: '2.5mm', mb: '0.6mm' },
                      '@media (max-width: 480px)': { fontSize: '2.3mm', mb: '0.5mm' }
                    }}>
                      기본정보
                    </Typography>
                    <Box sx={{
                      p: '1mm',
                      border: '0.2mm solid #ecf0f1',
                      borderRadius: '0.5mm',
                      backgroundColor: '#f8f9fa',
                      boxShadow: 'none',
                      mb: '1mm',
                      '@media print': { p: '0.8mm', border: '0.15mm solid #ecf0f1' },
                      '@media (max-width: 768px)': { p: '0.8mm', mb: '0.8mm' },
                      '@media (max-width: 480px)': { p: '0.6mm', mb: '0.6mm' }
                    }}>
                  <Grid container spacing={3}>
                    <Grid item xs={12} sm={6} md={3}>
                      <Box sx={{ 
                        p: '4mm', 
                        backgroundColor: 'white', 
                        borderRadius: '3mm',
                        border: '0.5mm solid #e0e0e0',
                        boxShadow: '0 1mm 4mm rgba(0,0,0,0.05)',
                        height: '100%',
                        '@media print': {
                          boxShadow: 'none',
                          border: '0.3mm solid #e0e0e0'
                        }
                      }}>
                        <Typography variant="body2" sx={{ 
                          color: '#666', 
                          mb: '2mm', 
                          fontSize: '3mm',
                          fontWeight: 500,
                          textTransform: 'uppercase',
                          letterSpacing: '0.5mm',
                          '@media print': {
                            fontSize: '2.5mm'
                          }
                        }}>
                          거래처명
                        </Typography>
                        <Typography variant="h6" sx={{ 
                          fontWeight: 700, 
                          color: '#2c3e50', 
                          fontSize: '4mm',
                          '@media print': {
                            fontSize: '3.5mm'
                          }
                        }}>
                          {selectedVendor}
                        </Typography>
                      </Box>
                    </Grid>
                    <Grid item xs={12} sm={6} md={3}>
                      <Box sx={{ 
                        p: '4mm', 
                        backgroundColor: 'white', 
                        borderRadius: '3mm',
                        border: '0.5mm solid #e0e0e0',
                        boxShadow: '0 1mm 4mm rgba(0,0,0,0.05)',
                        height: '100%',
                        '@media print': {
                          boxShadow: 'none',
                          border: '0.3mm solid #e0e0e0'
                        }
                      }}>
                        <Typography variant="body2" sx={{ 
                          color: '#666', 
                          mb: '2mm', 
                          fontSize: '3mm',
                          fontWeight: 500,
                          textTransform: 'uppercase',
                          letterSpacing: '0.5mm',
                          '@media print': {
                            fontSize: '2.5mm'
                          }
                        }}>
                          발주일자
                        </Typography>
                        <Typography variant="h6" sx={{ 
                          fontWeight: 700, 
                          color: '#2c3e50', 
                          fontSize: '4mm',
                          '@media print': {
                            fontSize: '3.5mm'
                          }
                        }}>
                          {purchaseOrderDate}
                        </Typography>
                      </Box>
                    </Grid>
                    <Grid item xs={12} sm={6} md={3}>
                      <Box sx={{ 
                        p: '4mm', 
                        backgroundColor: 'white', 
                        borderRadius: '3mm',
                        border: '0.5mm solid #e0e0e0',
                        boxShadow: '0 1mm 4mm rgba(0,0,0,0.05)',
                        height: '100%',
                        '@media print': {
                          boxShadow: 'none',
                          border: '0.3mm solid #e0e0e0'
                        }
                      }}>
                        <Typography variant="body2" sx={{ 
                          color: '#666', 
                          mb: '2mm', 
                          fontSize: '3mm',
                          fontWeight: 500,
                          textTransform: 'uppercase',
                          letterSpacing: '0.5mm',
                          '@media print': {
                            fontSize: '2.5mm'
                          }
                        }}>
                          납품방법
                        </Typography>
                        <Typography variant="h6" sx={{ 
                          fontWeight: 700, 
                          color: '#2c3e50', 
                          fontSize: '4mm',
                          '@media print': {
                            fontSize: '3.5mm'
                          }
                        }}>
                          {getDeliveryInfo(selectedVendor).method || '미설정'}
                        </Typography>
                      </Box>
                    </Grid>
                    <Grid item xs={12} sm={6} md={3}>
                      <Box sx={{ 
                        p: '4mm', 
                        backgroundColor: 'white', 
                        borderRadius: '3mm',
                        border: '0.5mm solid #e0e0e0',
                        boxShadow: '0 1mm 4mm rgba(0,0,0,0.05)',
                        height: '100%',
                        '@media print': {
                          boxShadow: 'none',
                          border: '0.3mm solid #e0e0e0'
                        }
                      }}>
                        <Typography variant="body2" sx={{ 
                          color: '#666', 
                          mb: '2mm', 
                          fontSize: '3mm',
                          fontWeight: 500,
                          textTransform: 'uppercase',
                          letterSpacing: '0.5mm',
                          '@media print': {
                            fontSize: '2.5mm'
                          }
                        }}>
                          납품일자
                        </Typography>
                        <Typography variant="h6" sx={{ 
                          fontWeight: 700, 
                          color: '#2c3e50', 
                          fontSize: '4mm',
                          '@media print': {
                            fontSize: '3.5mm'
                          }
                        }}>
                          {getDeliveryInfo(selectedVendor).date || '미설정'}
                        </Typography>
                      </Box>
                    </Grid>
                  </Grid>
                  </Box>
                </Box>

                {/* 발주 제품 목록 */}
                <Box sx={{ 
                  mb: '2mm',
                  '@media (max-width: 768px)': { mb: '1.5mm' },
                  '@media (max-width: 480px)': { mb: '1mm' }
                }}>
                  <Typography variant="h4" sx={{
                    fontWeight: 600,
                    mb: '1.2mm',
                    color: '#2c3e50',
                    borderBottom: '0.5mm solid #2c3e50',
                    pb: '0.5mm',
                    display: 'inline-block',
                    fontSize: '3.5mm',
                    '@media print': { fontSize: '3.2mm', mb: '1mm' },
                    '@media (max-width: 768px)': { fontSize: '3.2mm', mb: '1mm' },
                    '@media (max-width: 480px)': { fontSize: '3mm', mb: '0.8mm' }
                  }}>
                    발주 제품 목록
                  </Typography>
                  <TableContainer sx={{
                    border: '0.3mm solid #ecf0f1',
                    borderRadius: '1mm',
                    boxShadow: 'none',
                    overflow: 'hidden',
                    mb: '2mm',
                    '@media print': { border: '0.2mm solid #ecf0f1' },
                    '@media (max-width: 768px)': { mb: '1.5mm' },
                    '@media (max-width: 480px)': { mb: '1mm' }
                  }}>
                    <Table size="medium">
                      <TableHead>
                        <TableRow sx={{ 
                          background: 'linear-gradient(135deg, #2c3e50 0%, #34495e 100%)',
                          '& th': {
                            color: 'white',
                            fontWeight: 700,
                            borderRight: '0.3mm solid rgba(255,255,255,0.15)',
                            fontSize: '2.5mm',
                            padding: '1.5mm 0.8mm',
                            textAlign: 'center',
                            letterSpacing: '0.1mm',
                            whiteSpace: 'nowrap',
                            '@media print': {
                              fontSize: '2.2mm',
                              padding: '1mm 0.5mm'
                            },
                            '@media (max-width: 768px)': {
                              fontSize: '2.2mm',
                              padding: '1.2mm 0.6mm'
                            },
                            '@media (max-width: 480px)': {
                              fontSize: '2mm',
                              padding: '1mm 0.5mm'
                            }
                          }
                        }}>
                          <TableCell sx={{ width: '8mm' }}>순번</TableCell>
                          <TableCell sx={{ width: '12mm' }}>공간</TableCell>
                          <TableCell sx={{ width: '15mm' }}>제품코드</TableCell>
                          <TableCell sx={{ width: '20mm' }}>제품명</TableCell>
                          <TableCell sx={{ width: '35mm' }}>세부내용</TableCell>
      
                          <TableCell sx={{ width: '12mm' }}>가로</TableCell>
                          <TableCell sx={{ width: '12mm' }}>세로</TableCell>
                          <TableCell sx={{ width: '10mm' }}>수량</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {purchaseOrderItems.map((item, index) => (
                          <TableRow key={index} sx={{ 
                            '&:nth-of-type(odd)': { backgroundColor: '#f8f9fa' },
                            '&:hover': { backgroundColor: '#ecf0f1' },
                            '& td': {
                              borderRight: '0.3mm solid #e0e0e0',
                              padding: '1.2mm 0.8mm',
                              fontSize: '2.2mm',
                              textAlign: 'center',
                              whiteSpace: 'nowrap',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              '@media print': {
                                fontSize: '2mm',
                                padding: '1mm 0.5mm'
                              },
                              '@media (max-width: 768px)': {
                                fontSize: '2mm',
                                padding: '1mm 0.6mm'
                              },
                              '@media (max-width: 480px)': {
                                fontSize: '1.8mm',
                                padding: '0.8mm 0.4mm'
                              }
                            }
                          }}>
                            <TableCell sx={{ 
                              fontWeight: 700, 
                              color: '#2c3e50',
                              backgroundColor: '#ecf0f1',
                              fontSize: '2.5mm',
                              '@media print': {
                                fontSize: '2.2mm'
                              }
                            }}>
                              {index + 1}
                            </TableCell>
                            <TableCell sx={{ 
                              fontWeight: 600,
                              color: '#2c3e50'
                            }}>
                              {item.space}
                            </TableCell>
                            <TableCell sx={{ 
                              fontFamily: 'monospace',
                              fontWeight: 500,
                              color: '#666',
                              fontSize: '2.6mm'
                            }}>
                              {item.productCode}
                            </TableCell>
                            <TableCell sx={{ 
                              fontWeight: 700,
                              color: '#2c3e50',
                              textAlign: 'left'
                            }}>
                              {item.productName}
                            </TableCell>
                            <TableCell sx={{ 
                              textAlign: 'left',
                              whiteSpace: 'normal',
                              wordBreak: 'break-word',
                              fontSize: '2.6mm',
                              lineHeight: 1.3
                            }}>
                              {item.productType === '블라인드' ? (
                                <>
                                  {item.details.replace(/면적:\s*\d+\.?\d*\s*㎡\s*,?\s*/, '').trim()}
                                  {item.lineDirection && ` | 줄방향: ${item.lineDirection}`}
                                  {item.lineLength && ` | 줄길이: ${item.lineLength === '직접입력' ? item.customLineLength : item.lineLength}`}
                                </>
                              ) : (
                                item.details
                              )}
                            </TableCell>
                            <TableCell sx={{ 
                              color: '#666', 
                              fontSize: '2.4mm',
                              textAlign: 'left',
                              whiteSpace: 'normal',
                              wordBreak: 'break-word',
                              lineHeight: 1.3,
                              '@media print': {
                                fontSize: '2.2mm'
                              }
                            }}>
                              {item.productionDetails || ''}
                            </TableCell>
                            <TableCell sx={{ 
                              fontWeight: 600,
                              color: '#2c3e50',
                              fontSize: '2.6mm'
                            }}>
                              {item.productType === '커튼' ? '-' : item.widthMM}
                            </TableCell>
                            <TableCell sx={{ 
                              fontWeight: 600,
                              color: '#2c3e50',
                              fontSize: '2.6mm'
                            }}>
                              {item.productType === '커튼' ? '-' : item.heightMM}
                            </TableCell>
                            <TableCell sx={{ 
                              fontWeight: 700, 
                              color: '#2c3e50',
                              backgroundColor: '#ecf0f1',
                              borderRadius: '1mm',
                              fontSize: '2.5mm',
                              '@media print': {
                                fontSize: '2.2mm'
                              }
                            }}>
                              {item.quantity}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                </Box>

                {/* 납품지정보 */}
                <Box sx={{ 
                  mb: '2mm',
                  '@media (max-width: 768px)': { mb: '1.5mm' },
                  '@media (max-width: 480px)': { mb: '1mm' }
                }}>
                  <Typography variant="h4" sx={{
                    fontWeight: 600,
                    mb: '1.2mm',
                    color: '#2c3e50',
                    borderBottom: '0.5mm solid #2c3e50',
                    pb: '0.5mm',
                    display: 'inline-block',
                    fontSize: '3.5mm',
                    '@media print': { fontSize: '3.2mm', mb: '1mm' },
                    '@media (max-width: 768px)': { fontSize: '3.2mm', mb: '1mm' },
                    '@media (max-width: 480px)': { fontSize: '3mm', mb: '0.8mm' }
                  }}>
                    납품지정보
                  </Typography>
                  <Box sx={{
                    p: '2mm',
                    border: '0.3mm solid #ecf0f1',
                    borderRadius: '1mm',
                    backgroundColor: '#f8f9fa',
                    boxShadow: 'none',
                    mb: '2mm',
                    '@media print': { p: '1.2mm', border: '0.2mm solid #ecf0f1' },
                    '@media (max-width: 768px)': { p: '1.5mm', mb: '1.5mm' },
                    '@media (max-width: 480px)': { p: '1mm', mb: '1mm' }
                  }}>
                    <Grid container spacing={3}>
                      <Grid item xs={12} sm={6}>
                        <Box sx={{ 
                          p: '2mm', 
                          backgroundColor: 'white', 
                          borderRadius: '1.5mm',
                          border: '0.3mm solid #e0e0e0',
                          boxShadow: '0 0.5mm 2mm rgba(0,0,0,0.05)',
                          height: '100%',
                          '@media print': {
                            boxShadow: 'none',
                            border: '0.2mm solid #e0e0e0'
                          }
                        }}>
                          <Typography variant="body2" sx={{ 
                            color: '#666', 
                            mb: '1mm', 
                            fontSize: '2.2mm',
                            fontWeight: 500,
                            textTransform: 'uppercase',
                            letterSpacing: '0.3mm',
                            '@media print': {
                              fontSize: '2mm'
                            }
                          }}>
                            회사명
                          </Typography>
                          <Typography variant="h6" sx={{ 
                            fontWeight: 700, 
                            color: '#2c3e50', 
                            fontSize: '3mm',
                            '@media print': {
                              fontSize: '2.8mm'
                            }
                          }}>
                            {selectedCompanyInfo?.companyName || ''}
                          </Typography>
                        </Box>
                      </Grid>
                      <Grid item xs={12} sm={6}>
                        <Box sx={{ 
                          p: '2mm', 
                          backgroundColor: 'white', 
                          borderRadius: '1.5mm',
                          border: '0.3mm solid #e0e0e0',
                          boxShadow: '0 0.5mm 2mm rgba(0,0,0,0.05)',
                          height: '100%',
                          '@media print': {
                            boxShadow: 'none',
                            border: '0.2mm solid #e0e0e0'
                          }
                        }}>
                          <Typography variant="body2" sx={{ 
                            color: '#666', 
                            mb: '1mm', 
                            fontSize: '2.2mm',
                            fontWeight: 500,
                            textTransform: 'uppercase',
                            letterSpacing: '0.3mm',
                            '@media print': {
                              fontSize: '2mm'
                            }
                          }}>
                            연락처
                          </Typography>
                          <Typography variant="h6" sx={{ 
                            fontWeight: 700, 
                            color: '#2c3e50', 
                            fontSize: '3mm',
                            '@media print': {
                              fontSize: '2.8mm'
                            }
                          }}>
                            {selectedCompanyInfo?.phone || ''}
                          </Typography>
                        </Box>
                      </Grid>
                      <Grid item xs={12}>
                        <Box sx={{ 
                          p: '2mm', 
                          backgroundColor: 'white', 
                          borderRadius: '1.5mm',
                          border: '0.3mm solid #e0e0e0',
                          boxShadow: '0 0.5mm 2mm rgba(0,0,0,0.05)',
                          '@media print': {
                            boxShadow: 'none',
                            border: '0.2mm solid #e0e0e0'
                          }
                        }}>
                          <Typography variant="body2" sx={{ 
                            color: '#666', 
                            mb: '1mm', 
                            fontSize: '2.2mm',
                            fontWeight: 500,
                            textTransform: 'uppercase',
                            letterSpacing: '0.3mm',
                            '@media print': {
                              fontSize: '2mm'
                            }
                          }}>
                            납품받을 주소
                          </Typography>
                          <Typography variant="h6" sx={{ 
                            fontWeight: 700, 
                            color: '#2c3e50', 
                            fontSize: '3mm',
                            lineHeight: 1.4,
                            '@media print': {
                              fontSize: '2.8mm'
                            }
                          }}>
                            {selectedCompanyInfo?.address || ''}
                          </Typography>
                        </Box>
                      </Grid>
                      {selectedCompanyInfo?.memo && (
                        <Grid item xs={12}>
                          <Box sx={{ 
                            p: '4mm', 
                            backgroundColor: 'white', 
                            borderRadius: '3mm',
                            border: '0.5mm solid #e0e0e0',
                            boxShadow: '0 1mm 4mm rgba(0,0,0,0.05)',
                            '@media print': {
                              boxShadow: 'none',
                              border: '0.3mm solid #e0e0e0'
                            }
                          }}>
                            <Typography variant="body2" sx={{ 
                              color: '#666', 
                              mb: '2mm', 
                              fontSize: '3mm',
                              fontWeight: 500,
                              textTransform: 'uppercase',
                              letterSpacing: '0.5mm',
                              '@media print': {
                                fontSize: '2.5mm'
                              }
                            }}>
                              비고
                            </Typography>
                                                    <Typography variant="h6" sx={{ 
                          fontWeight: 700, 
                          color: '#2c3e50', 
                          fontSize: '4mm',
                          '@media print': {
                            fontSize: '3.5mm'
                          }
                        }}>
                          {selectedCompanyInfo.memo}
                        </Typography>
                          </Box>
                        </Grid>
                      )}
                    </Grid>
                  </Box>
                </Box>

                {/* 추가전달사항 */}
                <Box sx={{ 
                  mb: '3mm',
                  '@media (max-width: 768px)': { mb: '2mm' },
                  '@media (max-width: 480px)': { mb: '1.5mm' }
                }}>
                  <Typography variant="h4" sx={{
                    fontWeight: 600,
                    mb: '0.8mm',
                    color: '#2c3e50',
                    borderBottom: '0.3mm solid #2c3e50',
                    pb: '0.3mm',
                    display: 'inline-block',
                    fontSize: '2.8mm',
                    '@media print': { fontSize: '2.5mm', mb: '0.6mm' },
                    '@media (max-width: 768px)': { fontSize: '2.5mm', mb: '0.6mm' },
                    '@media (max-width: 480px)': { fontSize: '2.3mm', mb: '0.5mm' }
                  }}>
                    추가전달사항
                  </Typography>
                  <TextField
                    fullWidth
                    multiline
                    rows={3}
                    value={purchaseOrderMemo}
                    onChange={(e) => setPurchaseOrderMemo(e.target.value)}
                    variant="outlined"
                    size="small"
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        borderColor: '#ecf0f1',
                        borderRadius: '1.5mm',
                        backgroundColor: '#f8f9fa',
                        '&:hover fieldset': { borderColor: '#2c3e50' },
                        '&.Mui-focused fieldset': { borderColor: '#2c3e50' },
                        '@media print': {
                          border: '0.2mm solid #ecf0f1',
                          backgroundColor: 'transparent'
                        },
                        '@media (max-width: 768px)': {
                          borderRadius: '1mm'
                        },
                        '@media (max-width: 480px)': {
                          borderRadius: '0.8mm'
                        }
                      },
                      '& .MuiInputBase-input': {
                        fontSize: '2.8mm',
                        padding: '2mm',
                        fontWeight: 500,
                        '@media print': {
                          fontSize: '2.5mm',
                          padding: '1.5mm'
                        },
                        '@media (max-width: 768px)': {
                          fontSize: '2.5mm',
                          padding: '1.5mm'
                        },
                        '@media (max-width: 480px)': {
                          fontSize: '2.3mm',
                          padding: '1mm'
                        }
                      }
                    }}
                  />
                </Box>
              </Box>
            </>
          )}
          {/* 간단양식 - AS신청서 양식과 동일한 스타일 */}
          {purchaseOrderType === 'simple' && (
            <>
              {/* 상단 헤더 */}
              <Box sx={{ 
                mb: 3, 
                textAlign: 'center', 
                backgroundColor: '#333', 
                color: 'white', 
                py: 2, 
                borderRadius: 1,
                position: 'relative'
              }}>
                <Typography variant="h4" sx={{ fontWeight: 'bold', mb: 0.5 }}>
                  발주서 ({selectedVendor})
                </Typography>
                <Typography variant="body2" sx={{ opacity: 0.9 }}>
                  Purchase Order Form
                </Typography>
                <Typography variant="body2" sx={{ 
                  position: 'absolute', 
                  top: '50%', 
                  right: '20px', 
                  transform: 'translateY(-50%)',
                  opacity: 0.9,
                  fontSize: '0.9rem'
                }}>
                  {selectedCompanyInfo?.companyName || ''}
                </Typography>
              </Box>

              {/* 발주일 섹션 */}
              <Box sx={{ mb: 3 }}>
                <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 1, color: '#333' }}>
                  기본정보
                </Typography>
                <Typography variant="body1" sx={{ color: '#666' }}>
                  발주일: {purchaseOrderDate}
                </Typography>
                <Typography variant="body1" sx={{ color: '#666' }}>
                  납품일: {getDeliveryInfo(selectedVendor).date || '미설정'}
                </Typography>
                <Typography variant="body1" sx={{ color: '#666' }}>
                  납품방법: {getDeliveryInfo(selectedVendor).method || '미설정'}
                </Typography>
              </Box>



              {/* 발주제품 목록 */}
              <Box sx={{ mb: 3 }}>
                <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 2, color: '#333' }}>
                  발주제품 목록 (Order Product List)
                </Typography>
                <Box sx={{ 
                  border: '1px solid #ddd', 
                  borderRadius: 1,
                  overflow: 'hidden'
                }}>
                  <TableContainer>
                    <Table size="small">
                      <TableHead>
                        <TableRow sx={{ backgroundColor: '#f5f5f5' }}>
                          <TableCell sx={{ fontWeight: 'bold', fontSize: '0.875rem', borderRight: '1px solid #ddd', width: '50px', whiteSpace: 'nowrap' }}>순번</TableCell>
                          <TableCell sx={{ fontWeight: 'bold', fontSize: '0.875rem', borderRight: '1px solid #ddd' }}>공간</TableCell>
                          <TableCell sx={{ fontWeight: 'bold', fontSize: '0.875rem', borderRight: '1px solid #ddd' }}>제품코드</TableCell>
                          <TableCell sx={{ fontWeight: 'bold', fontSize: '0.875rem', borderRight: '1px solid #ddd' }}>세부내용</TableCell>
      
                          <TableCell sx={{ fontWeight: 'bold', fontSize: '0.875rem', borderRight: '1px solid #ddd' }}>가로</TableCell>
                          <TableCell sx={{ fontWeight: 'bold', fontSize: '0.875rem', borderRight: '1px solid #ddd' }}>세로</TableCell>
                          <TableCell sx={{ fontWeight: 'bold', fontSize: '0.875rem' }}>수량</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {purchaseOrderItems.map((item, index) => (
                          <TableRow key={index} sx={{ '&:nth-of-type(odd)': { backgroundColor: '#fafafa' } }}>
                            <TableCell sx={{ fontSize: '0.875rem', borderRight: '1px solid #ddd', width: '50px' }}>{index + 1}</TableCell>
                            <TableCell sx={{ fontSize: '0.875rem', borderRight: '1px solid #ddd' }}>{item.space}</TableCell>
                            <TableCell sx={{ fontSize: '0.875rem', borderRight: '1px solid #ddd' }}>{item.productCode}</TableCell>
                            <TableCell sx={{ fontSize: '0.875rem', borderRight: '1px solid #ddd' }}>
                              {item.productType === '블라인드' ? (
                                <>
                                  {item.details.replace(/면적:\s*\d+\.?\d*\s*㎡\s*,?\s*/, '').trim()}
                                  {item.lineDirection && ` | 줄방향: ${item.lineDirection}`}
                                  {item.lineLength && ` | 줄길이: ${item.lineLength === '직접입력' ? item.customLineLength : item.lineLength}`}
                                </>
                              ) : (
                                item.details
                              )}
                            </TableCell>
                            <TableCell sx={{ fontSize: '0.875rem', borderRight: '1px solid #ddd' }}>{item.productionDetails || ''}</TableCell>
                            <TableCell sx={{ fontSize: '0.875rem', borderRight: '1px solid #ddd' }}>{item.productType === '커튼' ? '' : (item.widthMM ? Number(item.widthMM).toLocaleString() : '')}</TableCell>
                            <TableCell sx={{ fontSize: '0.875rem', borderRight: '1px solid #ddd' }}>{item.productType === '커튼' ? '' : (item.heightMM ? Number(item.heightMM).toLocaleString() : '')}</TableCell>
                            <TableCell sx={{ fontSize: '0.875rem' }}>{item.quantity ? Number(item.quantity).toLocaleString() : ''}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                </Box>
              </Box>

              {/* 납품지정보 섹션 */}
              <Box sx={{ mb: 3 }}>
                <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 2, color: '#333' }}>
                  납품지정보 (Delivery Information)
                </Typography>
                <Box sx={{ 
                  p: 2, 
                  border: '1px solid #ddd', 
                  borderRadius: 1,
                  backgroundColor: '#f9f9f9'
                }}>
                  <Typography variant="body2" sx={{ mb: 1, color: '#666' }}>
                    회사명: <span style={{ fontWeight: 'bold', color: '#333' }}>{selectedCompanyInfo?.companyName || ''}</span>
                  </Typography>
                  <Typography variant="body2" sx={{ mb: 1, color: '#666' }}>
                    연락처: <span style={{ fontWeight: 'bold', color: '#333' }}>{selectedCompanyInfo?.phone || '연락처'}</span>
                  </Typography>
                  <Typography variant="body2" sx={{ mb: 1, color: '#666' }}>
                    납품받을 주소: <span style={{ fontWeight: 'bold', color: '#333' }}>{selectedCompanyInfo?.address || '납품받을 주소'}</span>
                  </Typography>
                  <Typography variant="body2" sx={{ color: '#666' }}>
                    비고: <span style={{ fontWeight: 'bold', color: '#333' }}>{selectedCompanyInfo?.memo || ''}</span>
                  </Typography>
                </Box>
              </Box>

              {/* 추가전달사항 */}
              <Box sx={{ mb: 3 }}>
                <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 2, color: '#333' }}>
                  추가전달사항 (Additional Notes)
                </Typography>
                <TextField
                  fullWidth
                  multiline
                  rows={3}
                  value={purchaseOrderMemo}
                  onChange={(e) => setPurchaseOrderMemo(e.target.value)}
                  placeholder="발주서에 추가할 전달사항을 입력하세요..."
                  variant="outlined"
                  size="small"
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      borderColor: '#ddd',
                      '&:hover fieldset': { borderColor: '#333' },
                      '&.Mui-focused fieldset': { borderColor: '#333' },
                    },
                  }}
                />
              </Box>
            </>
          )}
          

          

        </DialogContent>
        <DialogActions 
          sx={{
            '@media print': {
              display: 'none !important',
              visibility: 'hidden !important',
              opacity: 0,
              position: 'absolute',
              left: '-9999px',
              top: '-9999px',
              width: 0,
              height: 0,
              overflow: 'hidden',
              clip: 'rect(0, 0, 0, 0)',
              margin: 0,
              padding: 0,
              border: 0,
              pointerEvents: 'none'
            }
          }}
          className="no-print"
        >
          <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
            <Button
              variant="outlined"
              startIcon={<PrintIcon />}
              onClick={() => handlePrintPurchaseOrder('print')}
              sx={{
                borderColor: 'var(--border-color)',
                color: 'var(--text-color)',
                '&:hover': {
                  borderColor: 'var(--primary-color)',
                  backgroundColor: 'rgba(76, 175, 80, 0.1)'
                }
              }}
            >
              프린트
            </Button>
            <Button
              variant="outlined"
              startIcon={<ImageIcon />}
              onClick={() => handlePrintPurchaseOrder('jpg')}
              sx={{
                borderColor: 'var(--border-color)',
                color: 'var(--text-color)',
                '&:hover': {
                  borderColor: 'var(--primary-color)',
                  backgroundColor: 'rgba(255, 193, 7, 0.1)'
                }
              }}
            >
              JPG
            </Button>
            <Button
              variant="outlined"
              startIcon={<PictureAsPdfIcon />}
              onClick={() => handlePrintPurchaseOrder('pdf')}
              sx={{
                borderColor: 'var(--border-color)',
                color: 'var(--text-color)',
                '&:hover': {
                  borderColor: 'var(--primary-color)',
                  backgroundColor: 'rgba(233, 30, 99, 0.1)'
                }
              }}
            >
              PDF
            </Button>
            <Button
              variant="outlined"
              startIcon={<ShareIcon />}
              onClick={() => handlePrintPurchaseOrder('kakao')}
              sx={{
                borderColor: 'var(--border-color)',
                color: 'var(--text-color)',
                '&:hover': {
                  borderColor: 'var(--primary-color)',
                  backgroundColor: 'rgba(255, 235, 59, 0.1)'
                }
              }}
            >
              카톡공유
            </Button>
            <Button
              variant="contained"
              onClick={() => setPurchaseOrderModalOpen(false)}
              sx={{
                backgroundColor: 'var(--primary-color)',
                color: 'white',
                '&:hover': {
                  backgroundColor: 'var(--primary-dark-color)'
                }
              }}
            >
              닫기
            </Button>
          </Box>
        </DialogActions>
      </Dialog>

      {/* 필터 모달 */}
      <Dialog
        open={filterModalOpen}
        onClose={() => setFilterModalOpen(false)}
        maxWidth="md"
        fullWidth
        PaperProps={{
          sx: {
            backgroundColor: '#fff !important',
            '& .MuiDialogTitle-root': {
              color: '#000 !important'
            },
            '& .MuiDialogContent-root': {
              color: '#000 !important'
            },
            '& .MuiFormControlLabel-root': {
              color: '#000 !important'
            },
            '& .MuiFormControlLabel-label': {
              color: '#000 !important'
            },
            '& .MuiCheckbox-root': {
              color: '#000 !important'
            },
            '& .MuiButton-root': {
              color: '#000 !important'
            },
            '& .MuiTypography-root': {
              color: '#000 !important'
            },
            '& *': {
              color: '#000 !important'
            }
          }
        }}
      >
        <DialogTitle sx={{ color: '#000 !important', backgroundColor: '#fff !important' }}>열 표시 설정</DialogTitle>
        <DialogContent sx={{ color: '#000 !important', backgroundColor: '#fff !important' }}>
          <Grid container spacing={2} sx={{ 
            '& .MuiFormControlLabel-root': { color: '#000 !important' },
            '& .MuiFormControlLabel-label': { color: '#000 !important' },
            '& .MuiCheckbox-root': { color: '#000 !important' },
            '& .MuiCheckbox-colorPrimary': { color: '#000 !important' },
            '& .MuiCheckbox-colorPrimary.Mui-checked': { color: '#000 !important' }
          }}>
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
                    checked={columnVisibility.salePrice}
                    onChange={() => handleColumnToggle('salePrice')}
                  />
                }
                label="판매단가"
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
                    checked={columnVisibility.purchaseCost}
                    onChange={() => handleColumnToggle('purchaseCost')}
                  />
                }
                label="입고원가"
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
          <Button onClick={handleFilterReset} sx={{ color: '#000' }}>초기화</Button>
          <Button variant="contained" onClick={() => setFilterModalOpen(false)} sx={{ color: '#fff' }}>
            적용
          </Button>
        </DialogActions>
      </Dialog>

      {/* 출력하기 드롭다운 메뉴 */}
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
            backgroundColor: '#fff',
            color: '#222',
            border: '1px solid #e0e0e0',
            boxShadow: '0 4px 20px rgba(0,0,0,0.3)',
            minWidth: 140,
          },
        }}
      >
        <MenuItem onClick={() => handleOutputOption('print')} sx={{ color: '#222', fontWeight: 'bold', '&:hover': { backgroundColor: 'rgba(25, 118, 210, 0.08)' } }}>
          <PrintIcon sx={{ mr: 1, fontSize: 20, color: '#1976d2' }} />
          프린트
        </MenuItem>
        <MenuItem onClick={() => handleOutputOption('pdf')} sx={{ color: '#222', fontWeight: 'bold', '&:hover': { backgroundColor: 'rgba(233, 30, 99, 0.08)' } }}>
          <PictureAsPdfIcon sx={{ mr: 1, fontSize: 20, color: '#e91e63' }} />
          PDF
        </MenuItem>
        <MenuItem onClick={() => handleOutputOption('jpg')} sx={{ color: '#222', fontWeight: 'bold', '&:hover': { backgroundColor: 'rgba(255, 193, 7, 0.08)' } }}>
          <ImageIcon sx={{ mr: 1, fontSize: 20, color: '#ffc107' }} />
          이미지
        </MenuItem>
        <MenuItem onClick={() => handleOutputOption('share')} sx={{ color: '#222', fontWeight: 'bold', '&:hover': { backgroundColor: 'rgba(76, 175, 80, 0.08)' } }}>
          <ShareIcon sx={{ mr: 1, fontSize: 20, color: '#4caf50' }} />
          공유
        </MenuItem>
      </Menu>

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

      {/* 제품 검색 모달 */}
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
            <Typography variant="body1" component="span" sx={{ fontSize: isMobile ? '1.1rem' : '1.25rem' }}>
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
            제품명, 제품코드, 세부내용으로 검색하세요. 제품행을 클릭하면 바로 주문서에 추가됩니다.
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
                          if (productSearchFilters.vendor && p.vendorName !== productSearchFilters.vendor) {
                            return false;
                          }
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
                            onClick={() => handleProductSearchTextChange(productSearchText)}
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

          {/* 검색 결과 */}
          <Typography variant="h6" sx={{ mb: 1, color: 'var(--text-color)' }}>
            {productSearchFilters.vendor 
              ? `검색 결과 (${productSearchResults.length}개)` 
              : '거래처를 선택해주세요'
            }
          </Typography>

          {productSearchResults.length === 0 ? (
            <Box sx={{ textAlign: 'center', py: 4 }}>
              <Typography sx={{ color: 'var(--text-secondary-color)' }} variant="body1">
                {productSearchFilters.vendor ? '검색 결과가 없습니다.' : '거래처를 선택해주세요.'}
              </Typography>
              <Typography variant="body2" sx={{ mt: 1, color: 'var(--text-secondary-color)' }}>
                {productSearchFilters.vendor 
                  ? '다른 검색어나 필터를 사용해보세요.' 
                  : '거래처를 선택하면 해당 거래처의 제품들이 표시됩니다.'
                }
              </Typography>
            </Box>
          ) : (
            <TableContainer sx={{ 
              maxHeight: 400, 
              overflow: 'auto',
              backgroundColor: 'var(--surface-color)',
              '& .MuiTable-root': {
                backgroundColor: 'var(--surface-color)',
              },
              '& .MuiTableHead-root': {
                backgroundColor: 'var(--background-color)',
              },
              '& .MuiTableCell-head': {
                backgroundColor: 'var(--background-color)',
                color: 'var(--text-color)',
                fontWeight: 'bold',
                borderBottom: '2px solid var(--border-color)',
              },
              '& .MuiTableCell-body': {
                color: 'var(--text-color)',
                borderBottom: '1px solid var(--border-color)',
              },
              '& .MuiTableRow-root:hover': {
                backgroundColor: 'var(--hover-color)',
              },
            }}>
              <Table size="small" stickyHeader>
                <TableHead>
                  <TableRow>
                    <TableCell>
                      <Checkbox
                        checked={selectedProducts.size === productSearchResults.length && productSearchResults.length > 0}
                        indeterminate={selectedProducts.size > 0 && selectedProducts.size < productSearchResults.length}
                        onChange={handleSelectAllProducts}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>거래처</TableCell>
                    <TableCell>브랜드</TableCell>
                    <TableCell>제품명</TableCell>
                    <TableCell>세부내용</TableCell>
                    <TableCell>비고</TableCell>
                    <TableCell align="right">판매가</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {productSearchResults.map((product, idx) => (
                    <TableRow
                      key={product.id}
                      hover
                      sx={{ 
                        cursor: 'pointer',
                        '&:hover': {
                          backgroundColor: 'var(--hover-color)',
                        },
                      }}
                      onClick={() => {
                        if (selectedRowIndex !== null) {
                          // 우클릭 메뉴에서 제품검색을 통해 선택된 경우
                          handleProductSelectForCell(product);
                        } else {
                          // 일반적인 제품 추가
                          handleAddSingleProduct(product);
                        }
                      }}
                    >
                      <TableCell>
                        <Checkbox
                          checked={selectedProducts.has(product.id)}
                          onChange={() => handleProductSelection(product.id)}
                          onClick={(e) => e.stopPropagation()}
                          size="small"
                        />
                      </TableCell>
                      <TableCell sx={{ color: 'var(--text-color)' }}>{product.vendorName}</TableCell>
                      <TableCell sx={{ color: 'var(--text-color)' }}>{product.brand}</TableCell>
                      <TableCell sx={{ color: 'var(--text-color)' }}>{product.productName}</TableCell>
                      <TableCell sx={{ color: 'var(--text-color)' }}>{product.details}</TableCell>
                      <TableCell sx={{ color: 'var(--text-color)' }}>{product.note || '-'}</TableCell>
                      <TableCell align="right" sx={{ fontWeight: 'bold', color: 'var(--primary-color)' }}>
                        {product.salePrice?.toLocaleString()}원
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
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
                선택된 제품 추가 ({selectedProducts.size}개)
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
                선택된 제품 추가 ({selectedProducts.size}개)
              </Button>
            )}
            <Button 
              onClick={() => {
                setProductDialogOpen(false);
                setProductSearchText('');
                handleProductSearchFilterReset();
              }}
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
            <Typography variant="body1" component="span" sx={{ fontSize: isMobile ? '1.1rem' : '1.25rem', color: 'var(--text-color)' }}>
              옵션 추가
            </Typography>
            {selectedRowIndex !== null &&
              orders[activeTab]?.rows[selectedRowIndex]?.type === 'product' && (
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
                  선택된 제품: {orders[activeTab]?.rows[selectedRowIndex]?.productName || '알 수 없음'}
                  ({orders[activeTab]?.rows[selectedRowIndex]?.productType || '알 수 없음'})
                </Typography>
              )}
          </Box>
        </DialogTitle>
        <DialogContent sx={{ backgroundColor: 'var(--surface-color)', color: 'var(--text-color)' }}>
          {selectedRowIndex !== null && (
            <Box sx={{ mb: 2, p: 2, bgcolor: 'var(--hover-color)', borderRadius: 1, border: '1px solid var(--border-color)' }}>
              <Typography variant="subtitle2" sx={{ color: 'var(--text-color)', mb: 1 }}>
                선택된 제품: {orders[activeTab]?.rows[selectedRowIndex]?.productName || '알 수 없음'}
                ({orders[activeTab]?.rows[selectedRowIndex]?.productType || '알 수 없음'})
              </Typography>
              <Typography variant="body2" sx={{ color: 'var(--text-color)', opacity: 0.7, fontSize: '0.875rem' }}>
                옵션이 선택된 제품 다음에 추가됩니다.
              </Typography>
            </Box>
          )}
          {selectedRowIndex === null && (
            <Box sx={{ mb: 2, p: 2, bgcolor: 'var(--warning-color)', borderRadius: 1, border: '1px solid var(--border-color)' }}>
              <Typography variant="subtitle2" sx={{ color: 'var(--text-color)', mb: 1, fontWeight: 'bold' }}>
                ⚠️ 제품을 먼저 선택해주세요
              </Typography>
              <Typography variant="body2" sx={{ color: 'var(--text-color)', opacity: 0.8, fontSize: '0.875rem' }}>
                옵션을 추가하려면 주문서에서 제품을 먼저 선택한 후 옵션추가 버튼을 클릭해주세요.
              </Typography>
            </Box>
          )}
          <Box sx={{ borderBottom: 1, borderColor: 'var(--border-color)', mb: isMobile ? 1.5 : 2 }}>
            <Tabs
              value={optionSearchTab}
              onChange={(e: React.SyntheticEvent, newValue: number) => {
                if (selectedRowIndex === null) {
                  setSnackbarMessage('옵션을 추가하려면 먼저 제품을 선택해주세요.');
                  setSnackbarOpen(true);
                  return;
                }
                setOptionSearchTab(newValue);
                const selectedType = optionTypeMap[newValue];
                handleOptionSearch(selectedType);
              }}
              sx={{
                opacity: selectedRowIndex === null ? 0.5 : 1,
                pointerEvents: selectedRowIndex === null ? 'none' : 'auto',
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
          {optionTypeMap[optionSearchTab] === '시공' && (
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
                    },
                    '& .MuiSelect-icon': {
                      color: 'var(--text-color)'
                    }
                  }}
                  MenuProps={{
                    PaperProps: {
                      sx: {
                        backgroundColor: 'var(--surface-color)',
                        color: 'var(--text-color)',
                        border: '1px solid var(--border-color)',
                        '& .MuiMenuItem-root': {
                          color: 'var(--text-color)',
                          '&:hover': {
                            backgroundColor: 'var(--hover-color)'
                          },
                          '&.Mui-selected': {
                            backgroundColor: 'var(--primary-color)',
                            color: 'white',
                            '&:hover': {
                              backgroundColor: 'var(--primary-color)'
                            }
                          }
                        }
                      }
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
                    },
                    '& .MuiSelect-icon': {
                      color: 'var(--text-color)'
                    }
                  }}
                  MenuProps={{
                    PaperProps: {
                      sx: {
                        backgroundColor: 'var(--surface-color)',
                        color: 'var(--text-color)',
                        border: '1px solid var(--border-color)',
                        '& .MuiMenuItem-root': {
                          color: 'var(--text-color)',
                          '&:hover': {
                            backgroundColor: 'var(--hover-color)'
                          },
                          '&.Mui-selected': {
                            backgroundColor: 'var(--primary-color)',
                            color: 'white',
                            '&:hover': {
                              backgroundColor: 'var(--primary-color)'
                            }
                          }
                        }
                      }
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
            disabled={selectedRowIndex === null}
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
                opacity: selectedRowIndex === null ? 0.5 : 1,
                pointerEvents: selectedRowIndex === null ? 'none' : 'auto'
              }}>
                <Table size="small">
                  <TableHead>
                    <TableRow sx={{ backgroundColor: 'var(--hover-color)' }}>
                      <TableCell sx={{ color: 'var(--text-color)', fontWeight: 'bold' }}>공급업체</TableCell>
                      <TableCell sx={{ color: 'var(--text-color)', fontWeight: 'bold' }}>옵션명</TableCell>
                      <TableCell sx={{ color: 'var(--text-color)', fontWeight: 'bold' }}>판매가</TableCell>
                      <TableCell sx={{ color: 'var(--text-color)', fontWeight: 'bold' }}>원가</TableCell>
                      {optionTypeMap[optionSearchTab] === '시공' && (
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
                          if (selectedRowIndex === null) {
                            e.preventDefault();
                            setSnackbarMessage('옵션을 추가하려면 먼저 제품을 선택해주세요.');
                            setSnackbarOpen(true);
                            return;
                          }
                          console.log('클릭 이벤트 발생:', option.optionName);
                          handleAddOptionToOrder(option);
                        }}
                        onContextMenu={(e) => handleOptionContextMenu(e, option)}
                        sx={{
                          cursor: 'pointer',
                          color: 'var(--text-color)',
                          '&:hover': {
                            backgroundColor: optionTypeMap[optionSearchTab] === '시공' ? 'var(--primary-color)' : 'var(--hover-color)',
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
                        {optionTypeMap[optionSearchTab] === '시공' && (
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
          <Typography variant="body1" component="span" sx={{ fontSize: isMobile ? '1.1rem' : '1.25rem' }}>
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
                    '& .MuiInputBase-input': {
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
                  inputProps={{ min: 1 }}
                />
              </Box>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCancelEditOption} sx={{ color: 'var(--text-color)' }}>
            취소
          </Button>
          <Button onClick={handleConfirmEditOption} variant="contained" sx={{ backgroundColor: 'var(--primary-color)' }}>
            확인
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
          수정하기
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
          복사하기
        </MenuItem>
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
          삭제하기
        </MenuItem>
      </Menu>
      {/* 제품 정보 수정 모달 */}
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
                    onKeyDown={(e) => {
                      if (e.key === 'Tab') {
                        e.preventDefault();
                        if (e.shiftKey) {
                          handleOrderProductKeyboardNavigation(1, 'prev');
                        } else {
                          handleOrderProductKeyboardNavigation(1, 'next');
                        }
                      } else if (e.key === 'ArrowDown') {
                        e.preventDefault();
                        handleOrderProductKeyboardNavigation(1, 'down');
                      } else if (e.key === 'ArrowUp') {
                        e.preventDefault();
                        handleOrderProductKeyboardNavigation(1, 'up');
                      } else if (e.key === 'Enter') {
                        e.preventDefault();
                        handleOrderProductKeyboardNavigation(1, 'next');
                      }
                    }}
                    inputRef={orderProductCodeRef}
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
                      {spaceOptions.map((option) => (
                        <MenuItem key={option} value={option} sx={{
                          color: 'var(--text-color)',
                          backgroundColor: 'var(--background-color)',
                          '&:hover': {
                            backgroundColor: 'var(--hover-color)',
                          },
                        }}>
                          {option}
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
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                        handleEditChange('spaceCustom', e.target.value)
                      }
                      onKeyDown={(e) => {
                        if (e.key === 'Tab') {
                          e.preventDefault();
                          if (e.shiftKey) {
                            handleOrderProductKeyboardNavigation(0, 'prev');
                          } else {
                            handleOrderProductKeyboardNavigation(0, 'next');
                          }
                        } else if (e.key === 'ArrowDown') {
                          e.preventDefault();
                          handleOrderProductKeyboardNavigation(0, 'down');
                        } else if (e.key === 'ArrowUp') {
                          e.preventDefault();
                          handleOrderProductKeyboardNavigation(0, 'up');
                        } else if (e.key === 'Enter') {
                          e.preventDefault();
                          handleOrderProductKeyboardNavigation(0, 'next');
                        }
                      }}
                      inputRef={orderProductSpaceRef}
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
                      const value = e.target.value.replace(/[^0-9]/g, '');
                      handleEditChange('widthMM', value);
                    }}
                    onKeyDown={(e) => {
                      if (e.key === 'Tab') {
                        e.preventDefault();
                        if (e.shiftKey) {
                          handleOrderProductKeyboardNavigation(3, 'prev');
                        } else {
                          handleOrderProductKeyboardNavigation(3, 'next');
                        }
                      } else if (e.key === 'ArrowDown') {
                        e.preventDefault();
                        handleOrderProductKeyboardNavigation(3, 'down');
                      } else if (e.key === 'ArrowUp') {
                        e.preventDefault();
                        handleOrderProductKeyboardNavigation(3, 'up');
                      } else if (e.key === 'Enter') {
                        e.preventDefault();
                        handleOrderProductKeyboardNavigation(3, 'next');
                      }
                    }}
                    inputRef={orderProductWidthRef}
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
                      const value = e.target.value.replace(/[^0-9]/g, '');
                      handleEditChange('heightMM', value);
                    }}
                    onKeyDown={(e) => {
                      if (e.key === 'Tab') {
                        e.preventDefault();
                        if (e.shiftKey) {
                          handleOrderProductKeyboardNavigation(4, 'prev');
                        } else {
                          handleOrderProductKeyboardNavigation(4, 'next');
                        }
                      } else if (e.key === 'ArrowDown') {
                        e.preventDefault();
                        handleOrderProductKeyboardNavigation(4, 'down');
                      } else if (e.key === 'ArrowUp') {
                        e.preventDefault();
                        handleOrderProductKeyboardNavigation(4, 'up');
                      } else if (e.key === 'Enter') {
                        e.preventDefault();
                        handleOrderProductKeyboardNavigation(4, 'next');
                      }
                    }}
                    inputRef={orderProductHeightRef}
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
                    onKeyDown={(e) => {
                      if (e.key === 'Tab') {
                        e.preventDefault();
                        if (e.shiftKey) {
                          handleOrderProductKeyboardNavigation(9, 'prev');
                        } else {
                          handleOrderProductKeyboardNavigation(9, 'next');
                        }
                      } else if (e.key === 'ArrowDown') {
                        e.preventDefault();
                        handleOrderProductKeyboardNavigation(9, 'down');
                      } else if (e.key === 'ArrowUp') {
                        e.preventDefault();
                        handleOrderProductKeyboardNavigation(9, 'up');
                      } else if (e.key === 'Enter') {
                        e.preventDefault();
                        handleOrderProductKeyboardNavigation(9, 'next');
                      }
                    }}
                    inputRef={orderProductQuantityRef}
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
                          label: { color: 'var(--text-secondary-color)' },
                          '.MuiSelect-select': { color: 'var(--text-color)' },
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
                          label: { color: 'var(--text-secondary-color)' },
                          '.MuiSelect-select': { color: 'var(--text-color)' },
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
                          onKeyDown={(e) => {
                            if (e.key === 'Tab') {
                              e.preventDefault();
                              if (e.shiftKey) {
                                handleOrderProductKeyboardNavigation(8, 'prev');
                              } else {
                                handleOrderProductKeyboardNavigation(8, 'next');
                              }
                            } else if (e.key === 'ArrowDown') {
                              e.preventDefault();
                              handleOrderProductKeyboardNavigation(8, 'down');
                            } else if (e.key === 'ArrowUp') {
                              e.preventDefault();
                              handleOrderProductKeyboardNavigation(8, 'up');
                            } else if (e.key === 'Enter') {
                              e.preventDefault();
                              handleOrderProductKeyboardNavigation(8, 'next');
                            }
                          }}
                          inputRef={orderProductWidthCountRef}
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
                            label: { color: 'var(--text-secondary-color)' },
                            '.MuiSelect-select': { color: 'var(--text-color)' },
                          }}
                        >
                          <InputLabel>주름양 배수</InputLabel>
                          <Select
                            value={editRow.pleatMultiplier || '1.4배'}
                            onChange={(e: SelectChangeEvent) =>
                              handleEditChange('pleatMultiplier', e.target.value)
                            }
                            label="주름양 배수"
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

                  </>
                )}
                {/* 블라인드일 때 줄방향과 줄길이 필드 추가 */}
                {editRow.productType === '블라인드' && (
                  <>
                    <Grid item xs={12} md={4}>
                      <TextField
                        select
                        label="줄방향"
                        value={editRow.lineDirection || ''}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                          handleEditChange('lineDirection', e.target.value)
                        }
                        onKeyDown={(e) => {
                          if (e.key === 'Tab') {
                            e.preventDefault();
                            if (e.shiftKey) {
                              handleOrderProductKeyboardNavigation(6, 'prev');
                            } else {
                              handleOrderProductKeyboardNavigation(6, 'next');
                            }
                          } else if (e.key === 'ArrowDown') {
                            e.preventDefault();
                            handleOrderProductKeyboardNavigation(6, 'down');
                          } else if (e.key === 'ArrowUp') {
                            e.preventDefault();
                            handleOrderProductKeyboardNavigation(6, 'up');
                          } else if (e.key === 'Enter') {
                            e.preventDefault();
                            handleOrderProductKeyboardNavigation(6, 'next');
                          }
                        }}
                        inputRef={orderProductLineDirRef}
                        fullWidth
                        size="small"
                        sx={{
                          '& .MuiOutlinedInput-root': {
                            '& fieldset': { borderColor: 'var(--border-color)' },
                            '&:hover fieldset': { borderColor: 'var(--primary-color)' },
                            '&.Mui-focused fieldset': { borderColor: 'var(--primary-color)' },
                          },
                          '& .MuiInputLabel-root': { 
                            color: 'var(--text-secondary-color)',
                            '&.Mui-focused': { color: 'var(--primary-color)' }
                          },
                          '& .MuiSelect-select': { 
                            color: 'var(--text-color)',
                            padding: '8.5px 14px'
                          },
                          '& .MuiMenu-paper': {
                            backgroundColor: 'var(--background-color)',
                            color: 'var(--text-color)',
                          },
                        }}
                      >
                        <MenuItem value="" sx={{
                          color: 'var(--text-color) !important',
                          backgroundColor: 'var(--background-color) !important',
                          '&:hover': {
                            backgroundColor: 'var(--hover-color) !important',
                          },
                        }}>선택안함</MenuItem>
                        <MenuItem value="좌" sx={{
                          color: 'var(--text-color) !important',
                          backgroundColor: 'var(--background-color) !important',
                          '&:hover': {
                            backgroundColor: 'var(--hover-color) !important',
                          },
                        }}>좌</MenuItem>
                        <MenuItem value="우" sx={{
                          color: 'var(--text-color) !important',
                          backgroundColor: 'var(--background-color) !important',
                          '&:hover': {
                            backgroundColor: 'var(--hover-color) !important',
                          },
                        }}>우</MenuItem>
                        <MenuItem value="없음" sx={{
                          color: 'var(--text-color) !important',
                          backgroundColor: 'var(--background-color) !important',
                          '&:hover': {
                            backgroundColor: 'var(--hover-color) !important',
                          },
                        }}>없음</MenuItem>
                      </TextField>
                    </Grid>
                    <Grid item xs={12} md={4}>
                      <TextField
                        select
                        label="줄길이"
                        value={editRow.lineLength || ''}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                          handleEditChange('lineLength', e.target.value)
                        }
                        onKeyDown={(e) => {
                          if (e.key === 'Tab') {
                            e.preventDefault();
                            if (e.shiftKey) {
                              handleOrderProductKeyboardNavigation(7, 'prev');
                            } else {
                              handleOrderProductKeyboardNavigation(7, 'next');
                            }
                          } else if (e.key === 'ArrowDown') {
                            e.preventDefault();
                            handleOrderProductKeyboardNavigation(7, 'down');
                          } else if (e.key === 'ArrowUp') {
                            e.preventDefault();
                            handleOrderProductKeyboardNavigation(7, 'up');
                          } else if (e.key === 'Enter') {
                            e.preventDefault();
                            handleOrderProductKeyboardNavigation(7, 'next');
                          }
                        }}
                        inputRef={orderProductLineLenRef}
                        fullWidth
                        size="small"
                        sx={{
                          '& .MuiOutlinedInput-root': {
                            '& fieldset': { borderColor: 'var(--border-color)' },
                            '&:hover fieldset': { borderColor: 'var(--primary-color)' },
                            '&.Mui-focused fieldset': { borderColor: 'var(--primary-color)' },
                          },
                          '& .MuiInputLabel-root': { 
                            color: 'var(--text-secondary-color)',
                            '&.Mui-focused': { color: 'var(--primary-color)' }
                          },
                          '& .MuiSelect-select': { 
                            color: 'var(--text-color)',
                            padding: '8.5px 14px'
                          },
                          '& .MuiMenu-paper': {
                            backgroundColor: 'var(--background-color)',
                            color: 'var(--text-color)',
                          },
                        }}
                      >
                          <MenuItem value="" sx={{
                            color: 'var(--text-color) !important',
                            backgroundColor: 'var(--background-color) !important',
                            '&:hover': {
                              backgroundColor: 'var(--hover-color) !important',
                            },
                          }}>선택안함</MenuItem>
                          <MenuItem value="90cm" sx={{
                            color: 'var(--text-color) !important',
                            backgroundColor: 'var(--background-color) !important',
                            '&:hover': {
                              backgroundColor: 'var(--hover-color) !important',
                            },
                          }}>90cm</MenuItem>
                          <MenuItem value="120cm" sx={{
                            color: 'var(--text-color) !important',
                            backgroundColor: 'var(--background-color) !important',
                            '&:hover': {
                              backgroundColor: 'var(--hover-color) !important',
                            },
                          }}>120cm</MenuItem>
                          <MenuItem value="150cm" sx={{
                            color: 'var(--text-color) !important',
                            backgroundColor: 'var(--background-color) !important',
                            '&:hover': {
                              backgroundColor: 'var(--hover-color) !important',
                            },
                          }}>150cm</MenuItem>
                          <MenuItem value="180cm" sx={{
                            color: 'var(--text-color) !important',
                            backgroundColor: 'var(--background-color) !important',
                            '&:hover': {
                              backgroundColor: 'var(--hover-color) !important',
                            },
                          }}>180cm</MenuItem>
                          <MenuItem value="210cm" sx={{
                            color: 'var(--text-color) !important',
                            backgroundColor: 'var(--background-color) !important',
                            '&:hover': {
                              backgroundColor: 'var(--hover-color) !important',
                            },
                          }}>210cm</MenuItem>
                          <MenuItem value="직접입력" sx={{
                            color: 'var(--text-color) !important',
                            backgroundColor: 'var(--background-color) !important',
                            '&:hover': {
                              backgroundColor: 'var(--hover-color) !important',
                            },
                          }}>직접입력</MenuItem>
                          <MenuItem value="없음" sx={{
                            color: 'var(--text-color) !important',
                            backgroundColor: 'var(--background-color) !important',
                            '&:hover': {
                              backgroundColor: 'var(--hover-color) !important',
                            },
                          }}>없음</MenuItem>
                      </TextField>
                    </Grid>
                    {editRow.lineLength === '직접입력' && (
                      <Grid item xs={12} md={4}>
                        <TextField
                          label="줄길이 직접입력"
                          value={editRow.customLineLength || ''}
                          onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                            setEditRow((prev: any) => ({ ...prev, customLineLength: e.target.value }));
                          }}
                          onKeyDown={(e) => {
                            if (e.key === 'Tab') {
                              e.preventDefault();
                              if (e.shiftKey) {
                                handleOrderProductKeyboardNavigation(7, 'prev');
                              } else {
                                handleOrderProductKeyboardNavigation(7, 'next');
                              }
                            } else if (e.key === 'ArrowDown') {
                              e.preventDefault();
                              handleOrderProductKeyboardNavigation(7, 'down');
                            } else if (e.key === 'ArrowUp') {
                              e.preventDefault();
                              handleOrderProductKeyboardNavigation(7, 'up');
                            } else if (e.key === 'Enter') {
                              e.preventDefault();
                              handleOrderProductKeyboardNavigation(7, 'next');
                            }
                          }}
                          inputRef={orderProductLineLenRef}
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
                    value={editRow.productType === '블라인드' ? 
                      (editRow.details || '').replace(/면적:\s*\d+\.?\d*\s*㎡\s*,?\s*/, '').trim() : 
                      (editRow.details || '')
                    }
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                      handleDetailsChange(e.target.value);
                    }}
                    onKeyDown={(e) => {
                      if (e.key === 'Tab') {
                        e.preventDefault();
                        if (e.shiftKey) {
                          handleOrderProductKeyboardNavigation(2, 'prev');
                        } else {
                          handleOrderProductKeyboardNavigation(2, 'next');
                        }
                      } else if (e.key === 'ArrowDown') {
                        e.preventDefault();
                        handleOrderProductKeyboardNavigation(2, 'down');
                      } else if (e.key === 'ArrowUp') {
                        e.preventDefault();
                        handleOrderProductKeyboardNavigation(2, 'up');
                      } else if (e.key === 'Enter') {
                        e.preventDefault();
                        handleOrderProductKeyboardNavigation(2, 'next');
                      }
                    }}
                    inputRef={orderProductDetailsRef}
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
                  editRow.curtainType === '겉커튼' && (
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

      {/* 기사추가 모달 */}
      <Dialog
        open={installerModalOpen}
        onClose={() => setInstallerModalOpen(false)}
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
              onClick={() => setInstallerModalOpen(false)}
              aria-label="close"
              sx={{ mr: 1 }}
            >
              <ArrowBackIcon />
            </IconButton>
          )}
          <AssignmentIcon sx={{ mr: 1 }} />
          시공기사 추가
          <Typography variant="subtitle2" sx={{
            mt: isMobile ? 0.5 : 1,
            color: '#666',
            fontWeight: 'normal',
            fontSize: isMobile ? '0.9rem' : '0.875rem'
          }}>
            새로운 시공기사를 등록합니다.
          </Typography>
        </DialogTitle>
        
        <DialogContent>
          <Grid container spacing={2}>
            <Grid item xs={12}>
              <TextField
                label="거래처명*"
                value={newInstaller.vendorName}
                onChange={(e) => setNewInstaller(prev => ({ ...prev, vendorName: e.target.value }))}
                fullWidth
                size="small"
                required
                sx={{
                  '& .MuiInputBase-input': {
                    fontSize: isMobile ? '1rem' : '0.875rem',
                    padding: isMobile ? '12px 14px' : '8.5px 14px'
                  }
                }}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                label="거래처 전화번호*"
                value={newInstaller.vendorPhone}
                onChange={(e) => setNewInstaller(prev => ({ ...prev, vendorPhone: e.target.value }))}
                fullWidth
                size="small"
                required
                sx={{
                  '& .MuiInputBase-input': {
                    fontSize: isMobile ? '1rem' : '0.875rem',
                    padding: isMobile ? '12px 14px' : '8.5px 14px'
                  }
                }}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                label="시공기사명*"
                value={newInstaller.installerName}
                onChange={(e) => setNewInstaller(prev => ({ ...prev, installerName: e.target.value }))}
                fullWidth
                size="small"
                required
                sx={{
                  '& .MuiInputBase-input': {
                    fontSize: isMobile ? '1rem' : '0.875rem',
                    padding: isMobile ? '12px 14px' : '8.5px 14px'
                  }
                }}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                label="시공기사 전화번호*"
                value={newInstaller.installerPhone}
                onChange={(e) => setNewInstaller(prev => ({ ...prev, installerPhone: e.target.value }))}
                fullWidth
                size="small"
                required
                sx={{
                  '& .MuiInputBase-input': {
                    fontSize: isMobile ? '1rem' : '0.875rem',
                    padding: isMobile ? '12px 14px' : '8.5px 14px'
                  }
                }}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                label="차량번호"
                value={newInstaller.vehicleNumber}
                onChange={(e) => setNewInstaller(prev => ({ ...prev, vehicleNumber: e.target.value }))}
                fullWidth
                size="small"
                sx={{
                  '& .MuiInputBase-input': {
                    fontSize: isMobile ? '1rem' : '0.875rem',
                    padding: isMobile ? '12px 14px' : '8.5px 14px'
                  }
                }}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                label="메모"
                value={newInstaller.memo}
                onChange={(e) => setNewInstaller(prev => ({ ...prev, memo: e.target.value }))}
                fullWidth
                size="small"
                multiline
                rows={3}
                sx={{
                  '& .MuiInputBase-input': {
                    fontSize: isMobile ? '1rem' : '0.875rem',
                    padding: isMobile ? '12px 14px' : '8.5px 14px'
                  }
                }}
              />
            </Grid>
          </Grid>
        </DialogContent>
        
        {isMobile ? (
          <DialogActions sx={{ flexDirection: 'column', gap: 1, p: 2 }}>
            <Button 
              onClick={handleAddInstaller}
              variant="contained"
              fullWidth
              disabled={!newInstaller.vendorName || !newInstaller.vendorPhone || !newInstaller.installerName || !newInstaller.installerPhone}
            >
              저장
            </Button>
            <Button 
              onClick={() => setInstallerModalOpen(false)}
              variant="outlined"
              fullWidth
            >
              취소
            </Button>
          </DialogActions>
        ) : (
          <DialogActions>
            <Button onClick={() => setInstallerModalOpen(false)}>
              취소
            </Button>
            <Button 
              onClick={handleAddInstaller}
              variant="contained"
              disabled={!newInstaller.vendorName || !newInstaller.vendorPhone || !newInstaller.installerName || !newInstaller.installerPhone}
            >
              저장
            </Button>
          </DialogActions>
        )}
      </Dialog>

      {/* AS접수 모달 */}
      <Dialog
        open={asModalOpen}
        onClose={() => setAsModalOpen(false)}
        maxWidth="md"
        fullWidth
        fullScreen={isMobile}
      >
        <DialogTitle sx={{
          display: 'flex',
          alignItems: 'center',
          gap: 1,
          fontSize: isMobile ? '1.2rem' : '1.25rem',
          pb: isMobile ? 1 : 2,
          color: 'var(--text-primary-color)'
        }}>
          {isMobile && (
            <IconButton
              edge="start"
              color="inherit"
              onClick={() => setAsModalOpen(false)}
              aria-label="close"
              sx={{ mr: 1, color: 'var(--text-primary-color)' }}
            >
              <ArrowBackIcon />
            </IconButton>
          )}
          <AssignmentIcon sx={{ mr: 1, color: 'var(--primary-color)' }} />
          AS접수
          <Typography variant="subtitle2" sx={{
            mt: isMobile ? 0.5 : 1,
            color: 'var(--text-secondary-color)',
            fontWeight: 'normal',
            fontSize: isMobile ? '0.9rem' : '0.875rem'
          }}>
            AS접수 정보를 입력합니다.
          </Typography>
        </DialogTitle>
        
        <DialogContent>
          <Grid container spacing={2}>
            {/* 납품정보 섹션 */}
            <Grid item xs={12}>
              <Typography variant="h6" sx={{ mb: 2, fontWeight: 'bold', color: '#000' }}>
                납품정보
              </Typography>
            </Grid>
            
            <Grid item xs={12} md={6}>
              <TextField
                label="주소"
                value={selectedOrderForAS?.address || ''}
                fullWidth
                size="small"
                InputProps={{ readOnly: true }}
                sx={{ backgroundColor: '#f5f5f5' }}
              />
            </Grid>
            
            <Grid item xs={12} md={6}>
              <TextField
                label="고객명"
                value={selectedOrderForAS?.customerName || ''}
                fullWidth
                size="small"
                InputProps={{ readOnly: true }}
                sx={{ backgroundColor: '#f5f5f5' }}
              />
            </Grid>
            
            <Grid item xs={12} md={6}>
              <TextField
                label="연락처"
                value={selectedOrderForAS?.contact || ''}
                fullWidth
                size="small"
                InputProps={{ readOnly: true }}
                sx={{ backgroundColor: '#f5f5f5' }}
              />
            </Grid>
            
            <Grid item xs={12} md={6}>
              <TextField
                label="시공일자"
                value={selectedOrderForAS?.installationDate ? new Date(selectedOrderForAS.installationDate).toLocaleString('ko-KR') : ''}
                fullWidth
                size="small"
                InputProps={{ readOnly: true }}
                sx={{ backgroundColor: '#f5f5f5' }}
              />
            </Grid>
            
            <Grid item xs={12} md={6}>
              <TextField
                label="AS접수일자"
                type="date"
                value={asRequest.asRequestDate || ''}
                onChange={(e) => setAsRequest(prev => ({ ...prev, asRequestDate: e.target.value }))}
                fullWidth
                size="small"
                required
              />
            </Grid>
            
            <Grid item xs={12}>
              <Typography variant="h6" sx={{ mb: 2, fontWeight: 'bold', color: '#000' }}>
                제품선택
              </Typography>
              <FormControl fullWidth size="small">
                <InputLabel sx={{ color: 'var(--text-secondary-color)' }}>제품 선택</InputLabel>
                <Select
                  multiple
                  value={asRequest.selectedProducts || []}
                  onChange={(e) => setAsRequest(prev => ({ 
                    ...prev, 
                    selectedProducts: typeof e.target.value === 'string' ? e.target.value.split(',') : e.target.value 
                  }))}
                  renderValue={(selected) => selected.join(', ')}
                  sx={{
                    '& .MuiSelect-select': {
                      color: 'var(--text-primary-color)',
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
                  {selectedOrderForAS?.rows?.filter((row: any) => row.type === 'product').map((row: any) => (
                    <MenuItem key={row.id} value={row.productName} sx={{ color: 'var(--text-primary-color)' }}>
                      {row.productName}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            
            <Grid item xs={12} md={6}>
              <FormControl fullWidth size="small">
                <InputLabel sx={{ color: 'var(--text-secondary-color)' }}>처리방법</InputLabel>
                <Select
                  value={asRequest.processingMethod || '거래처AS'}
                  onChange={(e) => {
                    const value = e.target.value;
                    if (value === '거래처AS' || value === '판매자AS' || value === '고객직접') {
                      setAsRequest(prev => ({ ...prev, processingMethod: value }));
                    }
                  }}
                  sx={{
                    '& .MuiSelect-select': {
                      color: 'var(--text-primary-color)',
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
                  <MenuItem value="거래처AS" sx={{ color: 'var(--text-primary-color)' }}>거래처AS</MenuItem>
                  <MenuItem value="판매자AS" sx={{ color: 'var(--text-primary-color)' }}>판매자AS</MenuItem>
                  <MenuItem value="고객직접" sx={{ color: 'var(--text-primary-color)' }}>고객직접</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            
            <Grid item xs={12}>
              <TextField
                label="문제점"
                value={asRequest.problem || ''}
                onChange={(e) => setAsRequest(prev => ({ ...prev, problem: e.target.value }))}
                fullWidth
                size="small"
                multiline
                rows={2}
              />
            </Grid>
            
            <Grid item xs={12}>
              <TextField
                label="해결방안"
                value={asRequest.solution || ''}
                onChange={(e) => setAsRequest(prev => ({ ...prev, solution: e.target.value }))}
                fullWidth
                size="small"
                multiline
                rows={2}
              />
            </Grid>
            
            <Grid item xs={12} md={6}>
              <TextField
                label="비용"
                type="number"
                value={asRequest.cost || ''}
                onChange={(e) => setAsRequest(prev => ({ ...prev, cost: Number(e.target.value) }))}
                fullWidth
                size="small"
                InputProps={{
                  endAdornment: <Typography variant="body2">원</Typography>,
                }}
              />
            </Grid>
            
            <Grid item xs={12}>
              <TextField
                label="메모"
                value={asRequest.memo || ''}
                onChange={(e) => setAsRequest(prev => ({ ...prev, memo: e.target.value }))}
                fullWidth
                size="small"
                multiline
                rows={3}
              />
            </Grid>
          </Grid>
        </DialogContent>
        
        {isMobile ? (
          <DialogActions sx={{ flexDirection: 'column', gap: 1, p: 2 }}>
            <Button 
              onClick={handleSaveASRequest}
              variant="contained"
              fullWidth
              disabled={!asRequest.asRequestDate || !asRequest.selectedProducts?.length}
            >
              저장
            </Button>
            <Button 
              onClick={() => setAsModalOpen(false)}
              variant="outlined"
              fullWidth
            >
              취소
            </Button>
          </DialogActions>
        ) : (
          <DialogActions>
            <Button onClick={() => setAsModalOpen(false)}>
              취소
            </Button>
            <Button 
              onClick={handleSaveASRequest}
              variant="contained"
              disabled={!asRequest.asRequestDate || !asRequest.selectedProducts?.length}
            >
              저장
            </Button>
          </DialogActions>
        )}
      </Dialog>

      {/* 수금내역 모달 */}
      <Dialog
        open={paymentModalOpen}
        onClose={() => setPaymentModalOpen(false)}
        maxWidth="sm"
        fullWidth
        fullScreen={isMobile}
      >
        <DialogTitle sx={{
          display: 'flex',
          alignItems: 'center',
          gap: 1,
          fontSize: isMobile ? '1.2rem' : '1.25rem',
          pb: isMobile ? 1 : 2,
          color: 'var(--text-color)'
        }}>
          {isMobile && (
            <IconButton
              edge="start"
              color="inherit"
              onClick={() => setPaymentModalOpen(false)}
              aria-label="close"
              sx={{ mr: 1 }}
            >
              <ArrowBackIcon />
            </IconButton>
          )}
          <AssignmentIcon sx={{ mr: 1 }} />
          수금입력
          <Typography variant="subtitle2" sx={{
            mt: isMobile ? 0.5 : 1,
            color: '#666',
            fontWeight: 'normal',
            fontSize: isMobile ? '0.9rem' : '0.875rem'
          }}>
            수금 정보를 입력합니다.
          </Typography>
        </DialogTitle>
        
        <DialogContent>
          <Grid container spacing={2}>
            <Grid item xs={12} md={6}>
              <TextField
                label="수금일자"
                type="date"
                value={paymentRecord.paymentDate || ''}
                onChange={(e) => setPaymentRecord(prev => ({ ...prev, paymentDate: e.target.value }))}
                fullWidth
                size="small"
                required
              />
            </Grid>
            
            <Grid item xs={12} md={6}>
              <FormControl fullWidth size="small" required>
                <InputLabel sx={{ color: 'var(--text-secondary-color)' }}>수금방법</InputLabel>
                <Select
                  value={paymentRecord.paymentMethod || ''}
                  onChange={(e) => setPaymentRecord(prev => ({ ...prev, paymentMethod: e.target.value }))}
                  label="수금방법"
                  sx={{
                    '& .MuiSelect-select': {
                      color: 'var(--text-primary-color)',
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
                  <MenuItem value="카드" sx={{ color: 'var(--text-primary-color)' }}>카드</MenuItem>
                  <MenuItem value="계좌이체" sx={{ color: 'var(--text-primary-color)' }}>계좌이체</MenuItem>
                  <MenuItem value="현금" sx={{ color: 'var(--text-primary-color)' }}>현금</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            
            <Grid item xs={12} md={6}>
              <TextField
                label="금액"
                type="number"
                value={paymentRecord.amount || ''}
                onChange={(e) => setPaymentRecord(prev => ({ ...prev, amount: Number(e.target.value) }))}
                fullWidth
                size="small"
                required
                InputProps={{
                  endAdornment: <Typography variant="body2">원</Typography>,
                }}
              />
            </Grid>
            
            {/* 오입금 송금 섹션 */}
            <Grid item xs={12}>
              <Typography variant="h6" sx={{ mt: 2, mb: 1, color: 'var(--text-color)' }}>
                오입금 송금 정보
              </Typography>
            </Grid>
            
            <Grid item xs={12} md={6}>
              <TextField
                label="오입금 송금 금액"
                type="number"
                value={paymentRecord.refundAmount || ''}
                onChange={(e) => setPaymentRecord(prev => ({ ...prev, refundAmount: Number(e.target.value) }))}
                fullWidth
                size="small"
                InputProps={{
                  endAdornment: <Typography variant="body2">원</Typography>,
                }}
                placeholder="오입금 송금 금액을 입력하세요"
              />
            </Grid>
            
            <Grid item xs={12} md={6}>
              <FormControl fullWidth size="small">
                <InputLabel sx={{ color: 'var(--text-secondary-color)' }}>오입금 송금 방법</InputLabel>
                <Select
                  value={paymentRecord.refundMethod || ''}
                  onChange={(e) => setPaymentRecord(prev => ({ ...prev, refundMethod: e.target.value }))}
                  label="오입금 송금 방법"
                  sx={{
                    '& .MuiSelect-select': {
                      color: 'var(--text-primary-color)',
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
                  <MenuItem value="계좌이체" sx={{ color: 'var(--text-primary-color)' }}>계좌이체</MenuItem>
                  <MenuItem value="현금" sx={{ color: 'var(--text-primary-color)' }}>현금</MenuItem>
                  <MenuItem value="카드환불" sx={{ color: 'var(--text-primary-color)' }}>카드환불</MenuItem>
                  <MenuItem value="기타" sx={{ color: 'var(--text-primary-color)' }}>기타</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            
            <Grid item xs={12} md={6}>
              <TextField
                label="오입금 송금 일자"
                type="date"
                value={paymentRecord.refundDate || ''}
                onChange={(e) => setPaymentRecord(prev => ({ ...prev, refundDate: e.target.value }))}
                fullWidth
                size="small"
              />
            </Grid>
            
            <Grid item xs={12}>
              <TextField
                label="오입금 송금 메모"
                value={paymentRecord.refundMemo || ''}
                onChange={(e) => setPaymentRecord(prev => ({ ...prev, refundMemo: e.target.value }))}
                fullWidth
                size="small"
                multiline
                rows={2}
                placeholder="오입금 송금 관련 메모를 입력하세요"
              />
            </Grid>

          </Grid>
        </DialogContent>
        
        {isMobile ? (
          <DialogActions sx={{ flexDirection: 'column', gap: 1, p: 2 }}>
            <Button 
              onClick={handleSavePaymentRecord}
              variant="contained"
              fullWidth
              disabled={!paymentRecord.paymentDate || !paymentRecord.paymentMethod || !paymentRecord.amount}
            >
              저장
            </Button>
            <Button 
              onClick={() => setPaymentModalOpen(false)}
              variant="outlined"
              fullWidth
            >
              취소
            </Button>
          </DialogActions>
        ) : (
          <DialogActions>
            <Button onClick={() => setPaymentModalOpen(false)}>
              취소
            </Button>
            <Button 
              onClick={handleSavePaymentRecord}
              variant="contained"
              disabled={!paymentRecord.paymentDate || !paymentRecord.paymentMethod || !paymentRecord.amount}
            >
              저장
            </Button>
          </DialogActions>
        )}
      </Dialog>

      {/* 우클릭 메뉴 */}
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
            '& .MuiMenuItem-root': {
              color: 'var(--text-color)',
              '&:hover': {
                backgroundColor: 'var(--hover-color)',
              },
            },
          },
        }}
      >
        <MenuItem onClick={() => handleContextMenuAction('load')} sx={{ color: 'var(--text-color)' }}>
          불러오기
        </MenuItem>
        <MenuItem onClick={() => handleContextMenuAction('payment')} sx={{ color: 'var(--text-color)' }}>
          수금입력
        </MenuItem>
        <MenuItem onClick={() => handleContextMenuAction('as')} sx={{ color: 'var(--text-color)' }}>
          AS접수
        </MenuItem>
        <MenuItem onClick={() => handleContextMenuAction('copy')} sx={{ color: 'var(--text-color)' }}>
          복사
        </MenuItem>
        <MenuItem onClick={() => handleContextMenuAction('delete')} sx={{ color: 'error.main' }}>
          삭제
        </MenuItem>
      </Menu>

      {/* 블라인드 제품 컨텍스트 메뉴 */}
      <Menu
        open={contextMenu !== null && contextMenu.selectedRow !== undefined}
        onClose={() => setContextMenu(null)}
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
            '& .MuiMenuItem-root': {
              color: 'var(--text-color)',
              '&:hover': {
                backgroundColor: 'var(--hover-color)',
              },
            },
          },
        }}
      >
        <MenuItem onClick={() => handleBlindContextMenuAction('edit')} sx={{ color: 'var(--text-color)' }}>
          수정
        </MenuItem>
        <MenuItem onClick={() => handleBlindContextMenuAction('addOption')} sx={{ color: 'var(--text-color)' }}>
          옵션추가
        </MenuItem>
        <MenuItem onClick={() => handleBlindContextMenuAction('bulkEdit')} sx={{ color: 'var(--text-color)' }}>
          일괄변경
        </MenuItem>
        <MenuItem onClick={() => handleBlindContextMenuAction('copy')} sx={{ color: 'var(--text-color)' }}>
          복사
        </MenuItem>
        <Divider />
        <MenuItem onClick={() => handleBlindContextMenuAction('divideSplit')} sx={{ color: '#4caf50', fontWeight: 'bold' }}>
          나누기(분할)
        </MenuItem>
        <MenuItem onClick={() => handleBlindContextMenuAction('divideCopy')} sx={{ color: '#2196f3', fontWeight: 'bold' }}>
          나누기(복사)
        </MenuItem>
        <Divider />
        <MenuItem onClick={() => handleBlindContextMenuAction('delete')} sx={{ color: 'error.main' }}>
          삭제
        </MenuItem>
      </Menu>

      {/* AS상태 편집 모달 */}
      <Dialog
        open={asEditModalOpen}
        onClose={handleCloseASEditModal}
        maxWidth="md"
        fullWidth
        PaperProps={{
          sx: {
            backgroundColor: 'var(--background-color)',
            color: 'var(--text-color)',
          },
        }}
      >
        <DialogTitle sx={{ 
          borderBottom: '1px solid var(--border-color)',
          color: 'var(--text-color)'
        }}>
          AS접수내역 수정
        </DialogTitle>
        <DialogContent sx={{ pt: 4 }}>
          <Grid container spacing={3}>
            <Grid item xs={12} md={6} sx={{ mt: 1 }}>
              <TextField
                label="AS접수일자"
                type="datetime-local"
                value={editingASRequest.asRequestDate ? new Date(editingASRequest.asRequestDate).toISOString().slice(0, 16) : ''}
                onChange={(e) => setEditingASRequest(prev => ({ ...prev, asRequestDate: e.target.value }))}
                fullWidth
                size="small"
                required
                InputLabelProps={{ shrink: true }}
                sx={{
                  '& .MuiInputBase-input': { color: 'var(--text-color)' },
                  '& .MuiOutlinedInput-notchedOutline': { borderColor: 'var(--border-color)' },
                  '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                    borderColor: 'var(--primary-color)',
                  },
                }}
              />
            </Grid>
            
            <Grid item xs={12} md={6} sx={{ mt: 1 }}>
              <FormControl fullWidth size="small" required>
                <InputLabel sx={{ color: 'var(--text-color)' }}>AS상태</InputLabel>
                <Select
                  value={editingASRequest.status || ''}
                  onChange={(e) => setEditingASRequest(prev => ({ ...prev, status: e.target.value as 'AS처리중' | 'AS완료' }))}
                  label="AS상태"
                  sx={{
                    '& .MuiSelect-select': { color: 'var(--text-color)' },
                    '& .MuiOutlinedInput-notchedOutline': { borderColor: 'var(--border-color)' },
                    '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                      borderColor: 'var(--primary-color)',
                    },
                    '& .MuiInputLabel-root': { color: 'var(--text-color)' },
                  }}
                >
                  <MenuItem value="AS처리중" sx={{ color: 'var(--text-color)' }}>AS처리중</MenuItem>
                  <MenuItem value="AS완료" sx={{ color: 'var(--text-color)' }}>AS완료</MenuItem>
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12} md={6}>
              <TextField
                label="AS처리일자"
                type="datetime-local"
                value={editingASRequest.asProcessDate || ''}
                onChange={(e) => setEditingASRequest(prev => ({ ...prev, asProcessDate: e.target.value }))}
                fullWidth
                size="small"
                InputLabelProps={{ shrink: true }}
                sx={{
                  '& .MuiInputBase-input': { color: 'var(--text-color)' },
                  '& .MuiOutlinedInput-notchedOutline': { borderColor: 'var(--border-color)' },
                  '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                    borderColor: 'var(--primary-color)',
                  },
                }}
              />
            </Grid>

            <Grid item xs={12} md={6}>
              <FormControl fullWidth size="small" required>
                <InputLabel sx={{ color: 'var(--text-color)' }}>처리방법</InputLabel>
                <Select
                  value={editingASRequest.processingMethod || ''}
                  onChange={(e) => setEditingASRequest(prev => ({ ...prev, processingMethod: e.target.value as '거래처AS' | '판매자AS' | '고객직접' }))}
                  label="처리방법"
                  sx={{
                    '& .MuiSelect-select': { color: 'var(--text-color)' },
                    '& .MuiOutlinedInput-notchedOutline': { borderColor: 'var(--border-color)' },
                    '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                      borderColor: 'var(--primary-color)',
                    },
                    '& .MuiInputLabel-root': { color: 'var(--text-color)' },
                  }}
                >
                  <MenuItem value="거래처AS" sx={{ color: 'var(--text-color)' }}>거래처AS</MenuItem>
                  <MenuItem value="판매자AS" sx={{ color: 'var(--text-color)' }}>판매자AS</MenuItem>
                  <MenuItem value="고객직접" sx={{ color: 'var(--text-color)' }}>고객직접</MenuItem>
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12} md={6}>
              <TextField
                label="비용"
                type="number"
                value={editingASRequest.cost || ''}
                onChange={(e) => setEditingASRequest(prev => ({ ...prev, cost: Number(e.target.value) }))}
                fullWidth
                size="small"
                InputProps={{
                  endAdornment: <Typography variant="body2">원</Typography>,
                }}
                sx={{
                  '& .MuiInputBase-input': { color: 'var(--text-color)' },
                  '& .MuiOutlinedInput-notchedOutline': { borderColor: 'var(--border-color)' },
                  '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                    borderColor: 'var(--primary-color)',
                  },
                }}
              />
            </Grid>

            <Grid item xs={12}>
              <TextField
                label="문제점"
                value={editingASRequest.problem || ''}
                onChange={(e) => setEditingASRequest(prev => ({ ...prev, problem: e.target.value }))}
                fullWidth
                multiline
                rows={2}
                size="small"
                sx={{
                  '& .MuiInputBase-input': { color: 'var(--text-color)' },
                  '& .MuiOutlinedInput-notchedOutline': { borderColor: 'var(--border-color)' },
                  '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                    borderColor: 'var(--primary-color)',
                  },
                }}
              />
            </Grid>

            <Grid item xs={12}>
              <TextField
                label="해결방안"
                value={editingASRequest.solution || ''}
                onChange={(e) => setEditingASRequest(prev => ({ ...prev, solution: e.target.value }))}
                fullWidth
                multiline
                rows={2}
                size="small"
                sx={{
                  '& .MuiInputBase-input': { color: 'var(--text-color)' },
                  '& .MuiOutlinedInput-notchedOutline': { borderColor: 'var(--border-color)' },
                  '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                    borderColor: 'var(--primary-color)',
                  },
                }}
              />
            </Grid>

            <Grid item xs={12}>
              <TextField
                label="메모"
                value={editingASRequest.memo || ''}
                onChange={(e) => setEditingASRequest(prev => ({ ...prev, memo: e.target.value }))}
                fullWidth
                multiline
                rows={2}
                size="small"
                sx={{
                  '& .MuiInputBase-input': { color: 'var(--text-color)' },
                  '& .MuiOutlinedInput-notchedOutline': { borderColor: 'var(--border-color)' },
                  '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                    borderColor: 'var(--primary-color)',
                  },
                }}
              />
            </Grid>
          </Grid>
        </DialogContent>
        
        {isMobile ? (
          <DialogActions sx={{ flexDirection: 'column', gap: 1, p: 2 }}>
            <Button 
              onClick={handleSaveASEdit}
              variant="contained"
              fullWidth
              disabled={!editingASRequest.asRequestDate || !editingASRequest.status}
            >
              저장
            </Button>
            <Button 
              onClick={handleCloseASEditModal}
              variant="outlined"
              fullWidth
            >
              취소
            </Button>
          </DialogActions>
        ) : (
          <DialogActions>
            <Button onClick={handleCloseASEditModal}>
              취소
            </Button>
            <Button 
              onClick={handleSaveASEdit}
              variant="contained"
              disabled={!editingASRequest.asRequestDate || !editingASRequest.status}
            >
              저장
            </Button>
          </DialogActions>
        )}
      </Dialog>

      {/* AS접수 출력 모달 */}
      <Dialog
        open={asPrintModalOpen}
        onClose={handleCloseASPrintModal}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: {
            backgroundColor: 'var(--background-color)',
            color: 'var(--text-color)',
          },
        }}
      >
        <DialogTitle sx={{ 
          borderBottom: '1px solid var(--border-color)',
          color: 'var(--text-color)'
        }}>
          AS접수내역 출력
        </DialogTitle>
        <DialogContent sx={{ pt: 3 }}>
          <Typography variant="body1" sx={{ mb: 2, color: 'var(--text-color)' }}>
            출력 방법을 선택하세요:
          </Typography>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <Button
              variant="outlined"
              startIcon={<PrintIcon />}
              onClick={() => handleASPrint('print')}
              sx={{
                justifyContent: 'flex-start',
                padding: 2,
                borderColor: 'var(--border-color)',
                color: 'var(--text-color)',
                '&:hover': {
                  borderColor: 'var(--primary-color)',
                  backgroundColor: 'rgba(76, 175, 80, 0.1)'
                }
              }}
            >
              전체 프린트 출력
            </Button>
            <Button
              variant="outlined"
              startIcon={<ImageIcon />}
              onClick={() => handleASPrint('jpg')}
              sx={{
                justifyContent: 'flex-start',
                padding: 2,
                borderColor: 'var(--border-color)',
                color: 'var(--text-color)',
                '&:hover': {
                  borderColor: 'var(--primary-color)',
                  backgroundColor: 'rgba(76, 175, 80, 0.1)'
                }
              }}
            >
              JPG 이미지로 저장
            </Button>
            <Button
              variant="outlined"
              startIcon={<PictureAsPdfIcon />}
              onClick={() => handleASPrint('pdf')}
              sx={{
                justifyContent: 'flex-start',
                padding: 2,
                borderColor: 'var(--border-color)',
                color: 'var(--text-color)',
                '&:hover': {
                  borderColor: 'var(--primary-color)',
                  backgroundColor: 'rgba(76, 175, 80, 0.1)'
                }
              }}
            >
              PDF 문서로 저장
            </Button>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseASPrintModal}>
            취소
          </Button>
        </DialogActions>
      </Dialog>

      {/* 저장된 주문서 목록 표시항목 설정 모달 */}
      <Dialog
        open={savedOrderColumnSettingsOpen}
        onClose={() => setSavedOrderColumnSettingsOpen(false)}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: {
            backgroundColor: 'var(--background-color)',
            color: 'var(--text-color)',
          },
        }}
      >
        <DialogTitle sx={{ 
          borderBottom: '1px solid var(--border-color)',
          color: 'var(--text-color)'
        }}>
          저장된 주문서 목록 표시항목 설정
        </DialogTitle>
        <DialogContent sx={{ pt: 3 }}>
          <Typography variant="body2" sx={{ mb: 2, color: 'var(--text-secondary-color)' }}>
            표시할 항목을 선택하세요:
          </Typography>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
            {Object.entries({
              address: '주소',
              customerName: '고객명',
              contact: '연락처',
              estimateNo: '주문번호',
              estimateDate: '주문일자',
              installationDate: '시공일자',
              totalAmount: '소비자금액',
              discountedAmount: '할인후금액',
              actions: '액션'
            }).map(([key, label]) => (
              <FormControlLabel
                key={key}
                control={
                  <Checkbox
                    checked={savedOrderColumnVisibility[key as keyof typeof savedOrderColumnVisibility]}
                    onChange={() => handleSavedOrderColumnToggle(key)}
                    sx={{
                      color: 'var(--border-color)',
                      '&.Mui-checked': {
                        color: 'var(--primary-color)',
                      },
                    }}
                  />
                }
                label={label}
                sx={{
                  color: 'var(--text-color)',
                  '& .MuiFormControlLabel-label': {
                    fontSize: '0.875rem',
                  },
                }}
              />
            ))}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button 
            onClick={handleSavedOrderColumnReset}
            variant="outlined"
            sx={{
              borderColor: 'var(--border-color)',
              color: 'var(--text-color)',
              '&:hover': {
                borderColor: 'var(--primary-color)',
              },
            }}
          >
            초기화
          </Button>
          <Button 
            onClick={() => setSavedOrderColumnSettingsOpen(false)}
            variant="contained"
            sx={{
              backgroundColor: 'var(--primary-color)',
              '&:hover': {
                backgroundColor: 'var(--primary-dark-color)',
              },
            }}
          >
            확인
          </Button>
        </DialogActions>
      </Dialog>

      {/* 주문서 탭 컨텍스트 메뉴 */}
      <Menu
        open={tabContextMenu !== null}
        onClose={handleCloseTabContextMenu}
        anchorReference="anchorPosition"
        anchorPosition={
          tabContextMenu !== null
            ? { top: tabContextMenu.mouseY, left: tabContextMenu.mouseX }
            : undefined
        }
        PaperProps={{
          sx: {
            backgroundColor: 'var(--background-color)',
            color: 'var(--text-color)',
            border: '1px solid var(--border-color)',
            boxShadow: '0 4px 20px rgba(0, 0, 0, 0.15)',
          },
        }}
      >
        <MenuItem 
          onClick={() => handleTabContextMenuAction('save')}
          sx={{
            color: 'var(--text-color)',
            '&:hover': {
              backgroundColor: 'var(--hover-color)',
            },
          }}
        >
          <SaveIcon sx={{ mr: 1, fontSize: '1.2rem' }} />
          저장
        </MenuItem>
        <MenuItem 
          onClick={() => handleTabContextMenuAction('saveAsNew')}
          sx={{
            color: 'var(--text-color)',
            '&:hover': {
              backgroundColor: 'var(--hover-color)',
            },
          }}
        >
          <SaveAltIcon sx={{ mr: 1, fontSize: '1.2rem' }} />
          새로운저장
        </MenuItem>
        <MenuItem 
          onClick={() => handleTabContextMenuAction('copy')}
          sx={{
            color: 'var(--text-color)',
            '&:hover': {
              backgroundColor: 'var(--hover-color)',
            },
          }}
        >
          <ContentCopyIcon sx={{ mr: 1, fontSize: '1.2rem' }} />
          복사
        </MenuItem>
        <MenuItem 
          onClick={() => handleTabContextMenuAction('delete')}
          sx={{
            color: 'var(--error-color, #d32f2f)',
            '&:hover': {
              backgroundColor: 'rgba(211, 47, 47, 0.1)',
            },
          }}
        >
          <DeleteIcon sx={{ mr: 1, fontSize: '1.2rem' }} />
          삭제
        </MenuItem>
      </Menu>

      {/* 발주서 출력 메뉴 */}
      <Menu
        anchorEl={printMenuAnchorEl}
        open={printMenuOpen}
        onClose={handlePrintMenuClose}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'right',
        }}
        transformOrigin={{
          vertical: 'top',
          horizontal: 'right',
        }}
        PaperProps={{
          sx: {
            borderRadius: 2,
            boxShadow: '0 4px 20px rgba(0,0,0,0.15)',
            minWidth: 180,
            '& .MuiMenuItem-root': {
              py: 1.5,
              px: 2,
              fontSize: '0.875rem',
              fontWeight: 500,
            },
          },
        }}
      >
        <MenuItem 
          onClick={() => handlePrintMenuOption('print')}
          sx={{
            color: '#1976d2',
            '&:hover': {
              backgroundColor: 'rgba(25, 118, 210, 0.1)',
            },
          }}
        >
          <PrintIcon sx={{ mr: 1.5, fontSize: '1.2rem', color: '#1976d2' }} />
          프린트
        </MenuItem>
        <MenuItem 
          onClick={() => handlePrintMenuOption('pdf')}
          sx={{
            color: '#e91e63',
            '&:hover': {
              backgroundColor: 'rgba(233, 30, 99, 0.1)',
            },
          }}
        >
          <PictureAsPdfIcon sx={{ mr: 1.5, fontSize: '1.2rem', color: '#e91e63' }} />
          PDF
        </MenuItem>
        <MenuItem 
          onClick={() => handlePrintMenuOption('jpg')}
          sx={{
            color: '#ff9800',
            '&:hover': {
              backgroundColor: 'rgba(255, 152, 0, 0.1)',
            },
          }}
        >
          <ImageIcon sx={{ mr: 1.5, fontSize: '1.2rem', color: '#ff9800' }} />
          이미지
        </MenuItem>
        <MenuItem 
          onClick={() => handlePrintMenuOption('kakao')}
          sx={{
            color: '#4caf50',
            '&:hover': {
              backgroundColor: 'rgba(76, 175, 80, 0.1)',
            },
          }}
        >
          <ShareIcon sx={{ mr: 1.5, fontSize: '1.2rem', color: '#4caf50' }} />
          공유
        </MenuItem>
      </Menu>

      {/* 발주서 출력 미리보기 모달 */}
      <Dialog
        open={purchaseOrderPrintModalOpen}
        onClose={() => setPurchaseOrderPrintModalOpen(false)}
        maxWidth="lg"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 3,
            maxHeight: '95vh',
            overflow: 'hidden',
          },
        }}
      >
        <DialogTitle sx={{ 
          color: '#2c3e50', 
          fontWeight: 'bold',
          borderBottom: '2px solid #ecf0f1',
          pb: 2,
          backgroundColor: '#f8f9fa',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <PrintIcon sx={{ mr: 1, color: '#3498db' }} />
            발주서 출력 미리보기
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Tooltip title="JPG로 저장">
              <IconButton
                onClick={() => {
                  const element = document.querySelector('.purchase-order-a4-container');
                  if (element) {
                    html2canvas(element as HTMLElement, {
                      scale: 2,
                      useCORS: true,
                      allowTaint: true,
                      backgroundColor: '#ffffff'
                    }).then(canvas => {
                      const link = document.createElement('a');
                      link.download = `발주서_${selectedVendorForPrint}_${purchaseOrderDate}.jpg`;
                      link.href = canvas.toDataURL('image/jpeg', 0.9);
                      link.click();
                    });
                  }
                }}
                sx={{
                  color: '#e74c3c',
                  '&:hover': {
                    backgroundColor: 'rgba(231, 76, 60, 0.1)',
                  },
                }}
              >
                <ImageIcon />
              </IconButton>
            </Tooltip>
            <Tooltip title="PDF로 저장">
              <IconButton
                onClick={() => {
                  const element = document.querySelector('.purchase-order-a4-container');
                  if (element) {
                    html2canvas(element as HTMLElement, {
                      scale: 2,
                      useCORS: true,
                      allowTaint: true,
                      backgroundColor: '#ffffff'
                    }).then(canvas => {
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
                      
                      pdf.save(`발주서_${selectedVendorForPrint}_${purchaseOrderDate}.pdf`);
                    });
                  }
                }}
                sx={{
                  color: '#e67e22',
                  '&:hover': {
                    backgroundColor: 'rgba(230, 126, 34, 0.1)',
                  },
                }}
              >
                <PictureAsPdfIcon />
              </IconButton>
            </Tooltip>
          <IconButton
            onClick={() => setPurchaseOrderPrintModalOpen(false)}
            sx={{
              color: '#7f8c8d',
              '&:hover': {
                backgroundColor: 'rgba(127, 140, 141, 0.1)',
              },
            }}
          >
            <CloseIcon />
          </IconButton>
          </Box>
        </DialogTitle>
        <DialogContent sx={{ p: 0, backgroundColor: '#ecf0f1' }}>
          <Box sx={{ p: 4, display: 'flex', justifyContent: 'center' }}>
            {/* 발주서 내용 */}
            <Box 
              className="purchase-order-a4-container"
              sx={{
                width: '210mm',
                minHeight: '297mm',
                backgroundColor: 'white',
                padding: '25mm',
                boxShadow: '0 8px 32px rgba(0,0,0,0.15)',
                borderRadius: 2,
                fontFamily: 'Noto Sans KR, sans-serif',
                fontSize: '11pt',
                lineHeight: 1.5,
                color: '#2c3e50',
                position: 'relative',
                '&::before': {
                  content: '""',
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  right: 0,
                  height: '4px',
                  background: 'linear-gradient(90deg, #3498db, #2980b9)',
                  borderRadius: '2px 2px 0 0',
                }
              }}
            >
              {/* 제목 섹션 */}
              <Box sx={{ 
                mb: 3,
                borderBottom: '3px solid #34495e',
                pb: 3,
                position: 'relative'
              }}>
                <Box sx={{ 
                  textAlign: 'center'
              }}>
                <Typography sx={{ 
                  fontWeight: '900', 
                  fontSize: '28pt',
                  color: '#2c3e50',
                  mb: 1,
                  letterSpacing: '2px'
                }}>
                  발주서
                </Typography>
                <Typography sx={{ 
                  fontSize: '16pt',
                  color: '#2c3e50',
                  fontWeight: '700',
                  backgroundColor: '#ecf0f1',
                  px: 2,
                  py: 1,
                  borderRadius: 1,
                  display: 'inline-block'
                }}>
                  {selectedVendorForPrint ? selectedVendorForPrint : '거래처명을 선택해주세요'}
                </Typography>
              </Box>
              <Box sx={{ 
                  position: 'absolute',
                  bottom: 0,
                  right: 0,
                  textAlign: 'right'
              }}>
                <Typography sx={{ 
                    fontSize: '11pt',
                  fontWeight: '600',
                    color: '#34495e'
                }}>
                  발주일자: {getCurrentVendorPurchaseOrderInfo(selectedVendorForPrint)?.purchaseOrderDate || getLocalDate()}
                </Typography>
                </Box>
                {getCurrentVendorPurchaseOrderInfo(selectedVendorForPrint)?.purchaseOrderName && (
                  <Box sx={{ 
                    position: 'absolute',
                    bottom: 0,
                    left: 0,
                    textAlign: 'left'
                  }}>
                    <Typography sx={{ 
                      fontSize: '11pt',
                      fontWeight: '600',
                      color: '#34495e'
                    }}>
                      발주명: {getCurrentVendorPurchaseOrderInfo(selectedVendorForPrint)?.purchaseOrderName}
                    </Typography>
                  </Box>
                )}
              </Box>



              {/* 수신/발신 정보 */}
              <Box sx={{ mb: 1 }}>
                <Box sx={{ 
                  display: 'flex',
                  gap: 2,
                  p: 1.5,
                  backgroundColor: '#f8f9fa',
                  borderRadius: 1,
                  border: '1px solid #e9ecef',
                  fontSize: '10pt'
                }}>
                  {/* 수신 정보 (좌측) */}
                  <Box sx={{ flex: 1 }}>
                  <Typography sx={{ 
                    fontWeight: 'bold', 
                      fontSize: '11pt',
                      mb: 0.5,
                    color: '#2c3e50'
                  }}>
                    수신: {selectedVendorForPrint ? selectedVendorForPrint : '거래처명을 선택해주세요'}
                  </Typography>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5, ml: 1.5 }}>
                      <Typography sx={{ fontSize: '9pt', color: '#7f8c8d' }}>
                        담당자: _________________
                    </Typography>
                      <Typography sx={{ fontSize: '9pt', color: '#7f8c8d' }}>
                        연락처: _________________
                    </Typography>
                  </Box>
                </Box>
                  
                  {/* 발신 정보 (우측) */}
                  <Box sx={{ flex: 1 }}>
                  <Typography sx={{ 
                    fontWeight: 'bold', 
                      fontSize: '11pt',
                      mb: 0.5,
                    color: '#2c3e50'
                  }}>
                    발신: {selectedCompanyInfo?.name || '우리회사'}
                  </Typography>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5, ml: 1.5 }}>
                      <Typography sx={{ fontSize: '9pt', color: '#7f8c8d' }}>
                    연락처: {selectedCompanyInfo?.contact || '_________________'}
                  </Typography>
                      <Typography sx={{ fontSize: '9pt', color: '#7f8c8d' }}>
                    주소: {selectedCompanyInfo?.address || '_________________'}
                  </Typography>
                    </Box>
                  </Box>
                </Box>
              </Box>



              {/* 제품목록 */}
              <Box sx={{ mb: 3 }}>
                <Box sx={{ 
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  mb: 1,
                  flexWrap: 'nowrap',
                  gap: 2,
                  minHeight: '32px'
                }}>
                      <Typography sx={{ 
                        fontWeight: 'bold', 
                    fontSize: '13pt',
                        color: '#2c3e50',
                        display: 'flex',
                    alignItems: 'center',
                    whiteSpace: 'nowrap',
                    flexShrink: 0,
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    minWidth: 0
                      }}>
                        <Box sx={{ 
                      width: 3, 
                      height: 16, 
                      backgroundColor: '#3498db', 
                      mr: 1.5,
                      borderRadius: 0.5,
                      flexShrink: 0
                    }} />
                    <span style={{ whiteSpace: 'nowrap' }}>제품목록</span>
                      </Typography>

                          </Box>
                <TableContainer sx={{ 
                  border: '2px solid #bdc3c7',
                  borderRadius: 1,
                  overflow: 'hidden',
                  width: '115%',
                  marginLeft: '-7.5%',
                  '& .MuiTable-root': {
                    tableLayout: 'fixed',
                    width: '100%'
                  },
                  '& .MuiTableCell-root': {
                    fontSize: { xs: '8pt', sm: '9pt' },
                    py: { xs: 0.5, sm: 1 },
                    px: { xs: 0.5, sm: 1 }
                  }
                }}>
                  <Table size="small">
                    <TableHead>
                      <TableRow sx={{ backgroundColor: '#34495e' }}>
                        <TableCell sx={{ 
                          border: '1px solid #95a5a6', 
                          textAlign: 'center',
                          fontWeight: 'bold',
                          fontSize: { xs: '6.8pt', sm: '7.8pt' },
                          py: { xs: 1, sm: 1.5 },
                          color: 'white',
                          width: { xs: '10%', sm: '8%' },
                          minWidth: { xs: '35px', sm: '40px' }
                        }}>순번</TableCell>
                        <TableCell sx={{ 
                          border: '1px solid #95a5a6', 
                          textAlign: 'center',
                          fontWeight: 'bold',
                          fontSize: { xs: '6.8pt', sm: '7.8pt' },
                          py: { xs: 1, sm: 1.5 },
                          color: 'white',
                          width: { xs: '15%', sm: '12%' },
                          minWidth: { xs: '60px', sm: '80px' }
                        }}>공간</TableCell>
                        <TableCell sx={{ 
                          border: '1px solid #95a5a6', 
                          textAlign: 'center',
                          fontWeight: 'bold',
                          fontSize: { xs: '6.8pt', sm: '7.8pt' },
                          py: { xs: 1, sm: 1.5 },
                          color: 'white',
                          width: { xs: '15%', sm: '12%' },
                          minWidth: { xs: '70px', sm: '90px' }
                        }}>제품코드</TableCell>
                        <TableCell sx={{ 
                          border: '1px solid #95a5a6', 
                          textAlign: 'left',
                          fontWeight: 'bold',
                          fontSize: { xs: '6.8pt', sm: '7.8pt' },
                          py: { xs: 1, sm: 1.5 },
                          color: 'white',
                          width: { xs: '20%', sm: '25%' },
                          minWidth: { xs: '100px', sm: '120px' }
                        }}>세부내용</TableCell>
                        <TableCell sx={{ 
                          border: '1px solid #95a5a6', 
                          textAlign: 'center',
                          fontWeight: 'bold',
                          fontSize: { xs: '6.8pt', sm: '7.8pt' },
                          py: { xs: 1, sm: 1.5 },
                          color: 'white',
                          width: { xs: '10%', sm: '10%' },
                          minWidth: { xs: '40px', sm: '60px' }
                        }}>가로</TableCell>
                        <TableCell sx={{ 
                          border: '1px solid #95a5a6', 
                          textAlign: 'center',
                          fontWeight: 'bold',
                          fontSize: { xs: '6.8pt', sm: '7.8pt' },
                          py: { xs: 1, sm: 1.5 },
                          color: 'white',
                          width: { xs: '10%', sm: '10%' },
                          minWidth: { xs: '40px', sm: '60px' }
                        }}>세로</TableCell>
                        <TableCell sx={{ 
                          border: '1px solid #95a5a6', 
                          textAlign: 'center',
                          fontWeight: 'bold',
                          fontSize: { xs: '6.8pt', sm: '7.8pt' },
                          py: { xs: 1, sm: 1.5 },
                          color: 'white',
                          width: { xs: '8%', sm: '8%' },
                          minWidth: { xs: '50px', sm: '70px' },
                          whiteSpace: 'nowrap'
                        }}>줄방향</TableCell>
                        <TableCell sx={{ 
                          border: '1px solid #95a5a6', 
                          textAlign: 'center',
                          fontWeight: 'bold',
                          fontSize: { xs: '6.8pt', sm: '7.8pt' },
                          py: { xs: 1, sm: 1.5 },
                          color: 'white',
                          width: { xs: '10%', sm: '10%' },
                          minWidth: { xs: '60px', sm: '80px' },
                          whiteSpace: 'nowrap'
                        }}>줄길이</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {(() => {
                        const selectedOrder = vendorPurchaseOrders[orders[activeTab]?.id]?.find(order => order.vendor === selectedVendorForPrint);
                        const items = selectedOrder?.items || [];
                        
                        if (items.length === 0) {
                          return (
                            <TableRow>
                              <TableCell 
                                colSpan={8} 
                                sx={{ 
                                  textAlign: 'center', 
                                  py: 3,
                                  color: '#7f8c8d',
                                  fontStyle: 'italic'
                                }}
                              >
                                등록된 제품이 없습니다.
                              </TableCell>
                            </TableRow>
                          );
                        }
                        
                        return items.map((item: any, index: number) => (
                          <TableRow key={index} sx={{ 
                            '&:nth-of-type(even)': { backgroundColor: '#f8f9fa' },
                            '&:hover': { backgroundColor: '#e3f2fd' }
                          }}>
                            <TableCell sx={{ 
                              border: '1px solid #bdc3c7', 
                              textAlign: 'center',
                              fontSize: { xs: '8pt', sm: '9pt' },
                              py: { xs: 0.5, sm: 1 },
                              fontWeight: '600',
                              width: { xs: '10%', sm: '8%' }
                            }}>{index + 1}</TableCell>
                            <TableCell sx={{ 
                              border: '1px solid #bdc3c7', 
                              textAlign: 'center',
                              fontSize: { xs: '8pt', sm: '9pt' },
                              py: { xs: 0.5, sm: 1 },
                              width: { xs: '15%', sm: '12%' },
                              wordBreak: 'break-word'
                            }}>{item.space || item.spaceCustom || '-'}</TableCell>
                            <TableCell sx={{ 
                              border: '1px solid #bdc3c7', 
                              textAlign: 'center',
                              fontSize: { xs: '8pt', sm: '9pt' },
                              py: { xs: 0.5, sm: 1 },
                              fontFamily: 'monospace',
                              width: { xs: '15%', sm: '12%' },
                              wordBreak: 'break-all'
                            }}>{item.productCode || '-'}</TableCell>
                            <TableCell sx={{ 
                              border: '1px solid #bdc3c7', 
                              textAlign: 'left',
                              fontSize: { xs: '8pt', sm: '9pt' },
                              py: { xs: 0.5, sm: 1 },
                              width: { xs: '20%', sm: '25%' },
                              wordBreak: 'break-word',
                              whiteSpace: 'normal',
                              lineHeight: 1.3
                            }}>
                              {item.details || '-'}
                            </TableCell>
                            <TableCell sx={{ 
                              border: '1px solid #bdc3c7', 
                              textAlign: 'center',
                              fontSize: { xs: '8pt', sm: '9pt' },
                              py: { xs: 0.5, sm: 1 },
                              fontWeight: '600',
                              width: { xs: '10%', sm: '10%' }
                            }}>
                              {(() => {
                                const width = item.widthMM || item.productionWidth;
                                return width ? Number(width).toLocaleString() : '-';
                              })()}
                            </TableCell>
                            <TableCell sx={{ 
                              border: '1px solid #bdc3c7', 
                              textAlign: 'center',
                              fontSize: { xs: '8pt', sm: '9pt' },
                              py: { xs: 0.5, sm: 1 },
                              fontWeight: '600',
                              width: { xs: '10%', sm: '10%' }
                            }}>
                              {(() => {
                                const height = item.heightMM || item.productionHeight;
                                return height ? Number(height).toLocaleString() : '-';
                              })()}
                            </TableCell>
                            <TableCell sx={{ 
                              border: '1px solid #bdc3c7', 
                              textAlign: 'center',
                              fontSize: { xs: '8pt', sm: '9pt' },
                              py: { xs: 0.5, sm: 1 },
                              fontWeight: '600',
                              width: { xs: '8%', sm: '8%' }
                            }}>{item.lineDirection || item.lineDir || '-'}</TableCell>
                            <TableCell sx={{ 
                              border: '1px solid #bdc3c7', 
                              textAlign: 'center',
                              fontSize: { xs: '8pt', sm: '9pt' },
                              py: { xs: 0.5, sm: 1 },
                              fontWeight: '600',
                              width: { xs: '10%', sm: '10%' }
                            }}>
                              {(() => {
                                const lineLength = item.lineLength || item.lineLen;
                                if (lineLength === '직접입력') {
                                  return item.customLineLength || '직접입력';
                                }
                                // 숫자만 있는 경우 "cm" 추가
                                if (lineLength && /^\d+$/.test(lineLength)) {
                                  return `${lineLength}cm`;
                                }
                                return lineLength || '-';
                              })()}
                            </TableCell>
                          </TableRow>
                        ));
                      })()}
                    </TableBody>
                  </Table>
                </TableContainer>
              </Box>

              {/* 납품정보 */}
              {(() => {
                const currentOrder = orders[activeTab];
                if (currentOrder) {
                  return (
                    <Box sx={{ mb: 4 }}>
                      <Typography sx={{ 
                        fontWeight: 'bold', 
                        fontSize: '13pt',
                        mb: 2,
                        color: '#2c3e50',
                        display: 'flex',
                        alignItems: 'center'
                      }}>
                        <Box sx={{ 
                          width: 3, 
                          height: 16, 
                          backgroundColor: '#27ae60', 
                          mr: 1.5,
                          borderRadius: 0.5
                        }} />
                        납품정보
                      </Typography>
                      <Box sx={{ 
                        p: 2,
                        backgroundColor: '#f8fff8',
                        borderRadius: 1,
                        border: '1px solid #c8e6c9',
                        fontSize: '10pt'
                      }}>
                        {/* 첫 번째 줄: 납품방법, 납품일자, 상호 */}
                        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1.5, mb: 1.5 }}>
                          <Box sx={{ 
                            display: 'flex', 
                            alignItems: 'center', 
                            minWidth: '180px',
                            flex: '1 1 auto'
                          }}>
                            <Typography sx={{ 
                              fontSize: '10pt', 
                              fontWeight: '600',
                              color: '#2e7d32',
                              mr: 1,
                              minWidth: '55px'
                            }}>
                              납품방법:
                            </Typography>
                            <Typography sx={{ 
                              fontSize: '10pt',
                              color: '#2c3e50'
                            }}>
                              {getCurrentVendorPurchaseOrderInfo(selectedVendorForPrint)?.deliveryMethod || '_________________'}
                            </Typography>
                          </Box>
                          <Box sx={{ 
                            display: 'flex', 
                            alignItems: 'center',
                            minWidth: '180px',
                            flex: '1 1 auto'
                          }}>
                            <Typography sx={{ 
                              fontSize: '10pt', 
                              fontWeight: '600',
                              color: '#2e7d32',
                              mr: 1,
                              minWidth: '55px'
                            }}>
                              {(getCurrentVendorPurchaseOrderInfo(selectedVendorForPrint)?.deliveryMethod || '직접배송') === '택배배송' ? '발송일자:' : '납품일자:'}
                            </Typography>
                            <Typography sx={{ 
                              fontSize: '10pt',
                              color: '#2c3e50'
                            }}>
                              {getCurrentVendorPurchaseOrderInfo(selectedVendorForPrint)?.deliveryDate ? new Date(getCurrentVendorPurchaseOrderInfo(selectedVendorForPrint)?.deliveryDate || '').toLocaleDateString('ko-KR') : '_________________'}
                            </Typography>
                        </Box>
                        <Box sx={{ 
                          display: 'flex', 
                          alignItems: 'center',
                            minWidth: '180px',
                            flex: '1 1 auto'
                        }}>
                          <Typography sx={{ 
                            fontSize: '10pt', 
                            fontWeight: '600',
                            color: '#2e7d32',
                            mr: 1,
                              minWidth: '35px'
                          }}>
                            상호:
                          </Typography>
                          <Typography sx={{ 
                            fontSize: '10pt',
                            color: '#2c3e50',
                            flex: 1
                          }}>
                            {selectedCompanyInfo?.name || '_________________'}
                          </Typography>
                          </Box>
                        </Box>
                        
                        {/* 두 번째 줄: 연락처, 주소 */}
                        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1.5 }}>
                          <Box sx={{ 
                            display: 'flex', 
                            alignItems: 'center',
                            minWidth: '180px',
                            flex: '1 1 auto'
                          }}>
                          <Typography sx={{ 
                            fontSize: '10pt', 
                            fontWeight: '600',
                            color: '#2e7d32',
                            mr: 1,
                              minWidth: '45px'
                          }}>
                            연락처:
                          </Typography>
                          <Typography sx={{ 
                            fontSize: '10pt',
                            color: '#2c3e50',
                            flex: 1
                          }}>
                            {selectedCompanyInfo?.deliveryContact || selectedCompanyInfo?.contact || '_________________'}
                          </Typography>
                        </Box>
                        <Box sx={{ 
                          display: 'flex', 
                          alignItems: 'flex-start',
                              minWidth: '300px',
                              flex: '2 1 auto',
                              marginLeft: '-47px'
                        }}>
                          <Typography sx={{ 
                            fontSize: '10pt', 
                            fontWeight: '600',
                            color: '#2e7d32',
                            mr: 1,
                              minWidth: '35px',
                            mt: 0.2
                          }}>
                            주소:
                          </Typography>
                          <Typography sx={{ 
                            fontSize: '10pt',
                            color: '#2c3e50',
                            flex: 1,
                               lineHeight: 1.4,
                               marginTop: '2px'
                          }}>
                            {selectedCompanyInfo?.deliveryAddress || selectedCompanyInfo?.address || '_________________'}
                          </Typography>
                          </Box>
                        </Box>
                      </Box>
                    </Box>
                  );
                }
                return null;
              })()}

              {/* 추가전달사항 */}
              {getCurrentVendorPurchaseOrderInfo(selectedVendorForPrint)?.additionalNotes && getCurrentVendorPurchaseOrderInfo(selectedVendorForPrint)?.additionalNotes.trim() && (
              <Box>
                <Typography sx={{ 
                  fontWeight: 600,
                  mb: '1.2mm',
                  color: '#2c3e50',
                  borderBottom: '0.5mm solid #2c3e50',
                  pb: '0.5mm',
                  display: 'inline-block',
                  fontSize: '3.5mm',
                  '@media print': { fontSize: '3.2mm', mb: '1mm' },
                  '@media (max-width: 768px)': { fontSize: '3.2mm', mb: '1mm' },
                  '@media (max-width: 480px)': { fontSize: '3mm', mb: '0.8mm' }
                }}>
                  추가전달사항
                </Typography>
                <Box sx={{ 
                  minHeight: '120px',
                  border: '2px solid #bdc3c7',
                  borderRadius: 1,
                  p: 3,
                  backgroundColor: '#f8f9fa',
                  backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 24px, #e9ecef 24px, #e9ecef 25px)',
                  lineHeight: '25px'
                }}>
                    <Typography sx={{ 
                      fontSize: '11pt', 
                      color: '#2c3e50',
                      whiteSpace: 'pre-wrap',
                      wordBreak: 'break-word'
                    }}>
                      {getCurrentVendorPurchaseOrderInfo(selectedVendorForPrint)?.additionalNotes}
                    </Typography>
                </Box>
              </Box>
              )}
            </Box>
          </Box>
        </DialogContent>
        <DialogActions sx={{ 
          p: 3, 
          borderTop: '2px solid #ecf0f1',
          backgroundColor: '#f8f9fa',
          display: 'flex',
          justifyContent: 'space-between'
        }}>
          <Box>
            <Typography sx={{ 
              fontSize: '10pt', 
              color: '#7f8c8d',
              fontStyle: 'italic'
            }}>
              * 발주서 내용을 확인 후 인쇄하세요
            </Typography>
          </Box>
          <Box>
            <Button 
              onClick={() => setPurchaseOrderPrintModalOpen(false)}
              sx={{ 
                mr: 2,
                color: '#7f8c8d',
                borderColor: '#bdc3c7',
                '&:hover': {
                  borderColor: '#95a5a6',
                  backgroundColor: 'rgba(127, 140, 141, 0.1)',
                },
              }}
              variant="outlined"
            >
              취소
            </Button>
            <Button 
              onClick={() => {
                handlePrintPurchaseOrder('print');
                setPurchaseOrderPrintModalOpen(false);
              }}
              variant="contained"
              startIcon={<PrintIcon />}
              sx={{
                background: 'linear-gradient(45deg, #3498db, #2980b9)',
                boxShadow: '0 4px 15px rgba(52, 152, 219, 0.3)',
                '&:hover': {
                  background: 'linear-gradient(45deg, #2980b9, #1f5f8b)',
                  boxShadow: '0 6px 20px rgba(52, 152, 219, 0.4)',
                  transform: 'translateY(-1px)',
                },
                transition: 'all 0.3s ease',
              }}
            >
              인쇄
            </Button>
          </Box>
        </DialogActions>
      </Dialog>

      {/* 수정 가능한 발주서 테이블 모달 */}
      <Dialog
        open={editablePurchaseOrderModalOpen}
        onClose={handleEditablePurchaseOrderClose}
        maxWidth="xl"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 2,
            maxHeight: '90vh',
          },
        }}
      >
        <DialogTitle sx={{ 
          color: '#2c3e50', 
          fontWeight: 'bold',
          borderBottom: '2px solid #ecf0f1',
          pb: 2,
          backgroundColor: '#f8f9fa',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <EditIcon sx={{ mr: 1, color: '#3498db' }} />
            {editablePurchaseOrderVendor} 거래처 발주서 수정
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Tooltip title="JPG로 저장">
              <IconButton
                onClick={() => {
                  // JPG 저장 로직 - 모달 없이 바로 저장
                  const currentOrderId = orders[activeTab]?.id;
                  if (currentOrderId && editablePurchaseOrderVendor) {
                    // 임시로 vendorPurchaseOrders 업데이트
                    setVendorPurchaseOrders(prev => ({
                      ...prev,
                      [currentOrderId]: prev[currentOrderId].map(order => 
                        order.vendor === editablePurchaseOrderVendor 
                          ? { ...order, items: editablePurchaseOrderData }
                          : order
                      )
                    }));
                    
                    // 선택된 거래처 설정
                    setSelectedVendorForPrint(editablePurchaseOrderVendor);
                    
                    // 숨겨진 div에 발주서 내용 렌더링
                    const hiddenDiv = document.createElement('div');
                    hiddenDiv.style.position = 'absolute';
                    hiddenDiv.style.left = '-9999px';
                    hiddenDiv.style.top = '-9999px';
                    hiddenDiv.style.width = '210mm';
                    hiddenDiv.style.height = '297mm';
                    hiddenDiv.style.backgroundColor = 'white';
                    hiddenDiv.style.padding = '25mm';
                    hiddenDiv.style.fontFamily = 'Noto Sans KR, sans-serif';
                    hiddenDiv.style.fontSize = '11pt';
                    hiddenDiv.style.lineHeight = '1.5';
                    hiddenDiv.style.color = '#2c3e50';
                    hiddenDiv.className = 'purchase-order-a4-container';
                    
                    // 발주서 내용 생성
                    hiddenDiv.innerHTML = `
                      <div style="margin-bottom: 12mm; border-bottom: 3px solid #34495e; padding-bottom: 12mm; position: relative;">
                        <div style="text-align: center;">
                          <div style="font-weight: 900; font-size: 28pt; color: #2c3e50; margin-bottom: 4mm; letter-spacing: 2px;">발주서</div>
                          <div style="font-size: 16pt; color: #2c3e50; font-weight: 700; background-color: #ecf0f1; padding: 4mm 8mm; border-radius: 4px; display: inline-block;">${editablePurchaseOrderVendor}</div>
                        </div>
                        <div style="position: absolute; bottom: 0; right: 0; text-align: right;">
                          <div style="font-size: 11pt; font-weight: 600; color: #34495e;">발주일자: ${purchaseOrderDate}</div>
                        </div>
                      </div>
                      
                      <div style="margin-bottom: 4mm;">
                        <div style="display: flex; gap: 8mm; padding: 6mm; background-color: #f8f9fa; border-radius: 4px; border: 1px solid #e9ecef; font-size: 10pt;">
                          <div style="flex: 1;">
                            <div style="font-weight: bold; font-size: 11pt; margin-bottom: 2mm; color: #2c3e50;">수신: ${editablePurchaseOrderVendor}</div>
                            <div style="display: flex; flex-direction: column; gap: 2mm; margin-left: 6mm;">
                              <div style="font-size: 9pt; color: #7f8c8d;">담당자: _________________</div>
                              <div style="font-size: 9pt; color: #7f8c8d;">연락처: _________________</div>
                            </div>
                          </div>
                          <div style="flex: 1;">
                            <div style="font-weight: bold; font-size: 11pt; margin-bottom: 2mm; color: #2c3e50;">발신: ${selectedCompanyInfo?.name || '우리회사'}</div>
                            <div style="display: flex; flex-direction: column; gap: 2mm; margin-left: 6mm;">
                              <div style="font-size: 9pt; color: #7f8c8d;">연락처: ${selectedCompanyInfo?.contact || '_________________'}</div>
                              <div style="font-size: 9pt; color: #7f8c8d;">주소: ${selectedCompanyInfo?.address || '_________________'}</div>
                            </div>
                          </div>
                        </div>
                      </div>
                      
                      <div style="margin-bottom: 12mm;">
                        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 4mm; flex-wrap: nowrap; gap: 8mm; min-height: 12.8mm;">
                          <div style="font-weight: bold; font-size: 13pt; color: #2c3e50; display: flex; align-items: center; white-space: nowrap; flex-shrink: 0; overflow: hidden; text-overflow: ellipsis; min-width: 0;">
                            <div style="width: 1.2mm; height: 6.4mm; background-color: #3498db; margin-right: 6mm; border-radius: 2px; flex-shrink: 0;"></div>
                            <span style="white-space: nowrap;">제품목록</span>
                          </div>
                          ${purchaseOrderName ? `<div style="font-size: 11pt; font-weight: 600; color: #2c3e50; background-color: #f8f9fa; padding: 4mm 8mm; border-radius: 4px; border: 1px solid #e9ecef; white-space: nowrap; flex-shrink: 0; min-width: 0; overflow: hidden; text-overflow: ellipsis; max-width: 60%;">발주명: ${purchaseOrderName}</div>` : ''}
                        </div>
                        
                        <div style="border: 2px solid #bdc3c7; border-radius: 4px; overflow: hidden; width: 115%; margin-left: -7.5%;">
                          <table style="table-layout: fixed; width: 100%; border-collapse: collapse;">
                            <thead>
                              <tr style="background-color: #34495e;">
                                <th style="border: 1px solid #95a5a6; text-align: center; font-weight: bold; font-size: 7.8pt; padding: 6mm 4mm; color: white; width: 8%; min-width: 16mm;">순번</th>
                                <th style="border: 1px solid #95a5a6; text-align: center; font-weight: bold; font-size: 7.8pt; padding: 6mm 4mm; color: white; width: 12%; min-width: 32mm;">공간</th>
                                <th style="border: 1px solid #95a5a6; text-align: center; font-weight: bold; font-size: 7.8pt; padding: 6mm 4mm; color: white; width: 12%; min-width: 36mm;">제품코드</th>
                                <th style="border: 1px solid #95a5a6; text-align: left; font-weight: bold; font-size: 7.8pt; padding: 6mm 4mm; color: white; width: 25%; min-width: 48mm;">세부내용</th>
                                <th style="border: 1px solid #95a5a6; text-align: center; font-weight: bold; font-size: 7.8pt; padding: 6mm 4mm; color: white; width: 12%; min-width: 32mm;">가로</th>
                                <th style="border: 1px solid #95a5a6; text-align: center; font-weight: bold; font-size: 7.8pt; padding: 6mm 4mm; color: white; width: 12%; min-width: 32mm;">세로</th>
                                <th style="border: 1px solid #95a5a6; text-align: center; font-weight: bold; font-size: 7.8pt; padding: 6mm 4mm; color: white; width: 8%; min-width: 28mm; white-space: nowrap;">줄방향</th>
                                <th style="border: 1px solid #95a5a6; text-align: center; font-weight: bold; font-size: 7.8pt; padding: 6mm 4mm; color: white; width: 6%; min-width: 24mm; white-space: nowrap;">줄길이</th>
                              </tr>
                            </thead>
                            <tbody>
                              ${editablePurchaseOrderData.length === 0 ? 
                                `<tr><td colspan="8" style="text-align: center; padding: 12mm; color: #7f8c8d; font-style: italic;">등록된 제품이 없습니다.</td></tr>` :
                                editablePurchaseOrderData.map((item: any, index: number) => `
                                  <tr style="${index % 2 === 1 ? 'background-color: #f8f9fa;' : ''}">
                                    <td style="border: 1px solid #bdc3c7; text-align: center; font-size: 9pt; padding: 4mm; font-weight: 600; width: 8%;">${index + 1}</td>
                                    <td style="border: 1px solid #bdc3c7; text-align: center; font-size: 9pt; padding: 4mm; width: 12%; word-break: break-word;">${item.space || item.spaceCustom || '-'}</td>
                                    <td style="border: 1px solid #bdc3c7; text-align: center; font-size: 9pt; padding: 4mm; font-family: monospace; width: 12%; word-break: break-all;">${item.productCode || '-'}</td>
                                    <td style="border: 1px solid #bdc3c7; text-align: left; font-size: 9pt; padding: 4mm; width: 25%; word-break: break-word; white-space: normal; line-height: 1.3;">${item.details || item.productName || '-'}</td>
                                    <td style="border: 1px solid #bdc3c7; text-align: center; font-size: 9pt; padding: 4mm; font-weight: 600; width: 12%;">${item.widthMM || item.productionWidth || '-'}</td>
                                    <td style="border: 1px solid #bdc3c7; text-align: center; font-size: 9pt; padding: 4mm; font-weight: 600; width: 12%;">${item.heightMM || item.productionHeight || '-'}</td>
                                    <td style="border: 1px solid #bdc3c7; text-align: center; font-size: 9pt; padding: 4mm; width: 8%;">${item.lineDir || '-'}</td>
                                    <td style="border: 1px solid #bdc3c7; text-align: center; font-size: 9pt; padding: 4mm; width: 6%;">${item.lineLen || '-'}</td>
                                  </tr>
                                `).join('')
                              }
                            </tbody>
                          </table>
                        </div>
                      </div>
                      
                      <div style="margin-bottom: 12mm;">
                        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 4mm; flex-wrap: nowrap; gap: 8mm; min-height: 12.8mm;">
                          <div style="font-weight: bold; font-size: 13pt; color: #2c3e50; display: flex; align-items: center; white-space: nowrap; flex-shrink: 0; overflow: hidden; textOverflow: ellipsis; min-width: 0;">
                            <div style="width: 1.2mm; height: 6.4mm; background-color: #3498db; margin-right: 6mm; border-radius: 2px; flex-shrink: 0;"></div>
                            <span style="white-space: nowrap;">납품정보</span>
                          </div>
                        </div>
                        
                        <div style="background-color: #e8f5e8; border: 1px solid #4caf50; border-radius: 4px; padding: 6mm; font-size: 10pt;">
                          <div style="display: flex; gap: 8mm;">
                            <div style="flex: 1;">
                              <div style="margin-bottom: 2mm; color: #2c3e50;">납품방법: ${deliveryMethod}</div>
                              <div style="margin-bottom: 2mm; color: #2c3e50;">상호: ${selectedCompanyInfo?.name || '우리회사'}</div>
                              <div style="color: #2c3e50;">주소: ${selectedCompanyInfo?.address || '_________________'}</div>
                            </div>
                            <div style="flex: 1;">
                              <div style="margin-bottom: 2mm; color: #2c3e50;">납품일자: ${deliveryDate}</div>
                              <div style="color: #2c3e50;">연락처: ${selectedCompanyInfo?.contact || '_________________'}</div>
                            </div>
                          </div>
                        </div>
                      </div>
                    `;
                    
                    document.body.appendChild(hiddenDiv);
                    
                    // JPG 저장
                    setTimeout(() => {
                      html2canvas(hiddenDiv, {
                        scale: 2,
                        useCORS: true,
                        allowTaint: true,
                        backgroundColor: '#ffffff'
                      }).then(canvas => {
                        const link = document.createElement('a');
                        link.download = `발주서_${editablePurchaseOrderVendor}_${purchaseOrderDate}.jpg`;
                        link.href = canvas.toDataURL('image/jpeg', 0.9);
                        link.click();
                        
                        // 임시 div 제거
                        document.body.removeChild(hiddenDiv);
                      });
                    }, 100);
                  }
                }}
                sx={{
                  color: '#e74c3c',
                  '&:hover': {
                    backgroundColor: 'rgba(231, 76, 60, 0.1)',
                  },
                }}
              >
                <ImageIcon />
              </IconButton>
            </Tooltip>
            <Tooltip title="PDF로 저장">
              <IconButton
                onClick={() => {
                  // PDF 저장 로직 - 모달 없이 바로 저장
                  const currentOrderId = orders[activeTab]?.id;
                  if (currentOrderId && editablePurchaseOrderVendor) {
                    // 임시로 vendorPurchaseOrders 업데이트
                    setVendorPurchaseOrders(prev => ({
                      ...prev,
                      [currentOrderId]: prev[currentOrderId].map(order => 
                        order.vendor === editablePurchaseOrderVendor 
                          ? { ...order, items: editablePurchaseOrderData }
                          : order
                      )
                    }));
                    
                    // 선택된 거래처 설정
                    setSelectedVendorForPrint(editablePurchaseOrderVendor);
                    
                    // 숨겨진 div에 발주서 내용 렌더링
                    const hiddenDiv = document.createElement('div');
                    hiddenDiv.style.position = 'absolute';
                    hiddenDiv.style.left = '-9999px';
                    hiddenDiv.style.top = '-9999px';
                    hiddenDiv.style.width = '210mm';
                    hiddenDiv.style.height = '297mm';
                    hiddenDiv.style.backgroundColor = 'white';
                    hiddenDiv.style.padding = '25mm';
                    hiddenDiv.style.fontFamily = 'Noto Sans KR, sans-serif';
                    hiddenDiv.style.fontSize = '11pt';
                    hiddenDiv.style.lineHeight = '1.5';
                    hiddenDiv.style.color = '#2c3e50';
                    hiddenDiv.className = 'purchase-order-a4-container';
                    
                    // 발주서 내용 생성
                    hiddenDiv.innerHTML = `
                      <div style="margin-bottom: 12mm; border-bottom: 3px solid #34495e; padding-bottom: 12mm; position: relative;">
                        <div style="text-align: center;">
                          <div style="font-weight: 900; font-size: 28pt; color: #2c3e50; margin-bottom: 4mm; letter-spacing: 2px;">발주서</div>
                          <div style="font-size: 16pt; color: #2c3e50; font-weight: 700; background-color: #ecf0f1; padding: 4mm 8mm; border-radius: 4px; display: inline-block;">${editablePurchaseOrderVendor}</div>
                        </div>
                        <div style="position: absolute; bottom: 0; right: 0; text-align: right;">
                          <div style="font-size: 11pt; font-weight: 600; color: #34495e;">발주일자: ${purchaseOrderDate}</div>
                        </div>
                      </div>
                      
                      <div style="margin-bottom: 4mm;">
                        <div style="display: flex; gap: 8mm; padding: 6mm; background-color: #f8f9fa; border-radius: 4px; border: 1px solid #e9ecef; font-size: 10pt;">
                          <div style="flex: 1;">
                            <div style="font-weight: bold; font-size: 11pt; margin-bottom: 2mm; color: #2c3e50;">수신: ${editablePurchaseOrderVendor}</div>
                            <div style="display: flex; flex-direction: column; gap: 2mm; margin-left: 6mm;">
                              <div style="font-size: 9pt; color: #7f8c8d;">담당자: _________________</div>
                              <div style="font-size: 9pt; color: #7f8c8d;">연락처: _________________</div>
                            </div>
                          </div>
                          <div style="flex: 1;">
                            <div style="font-weight: bold; font-size: 11pt; margin-bottom: 2mm; color: #2c3e50;">발신: ${selectedCompanyInfo?.name || '우리회사'}</div>
                            <div style="display: flex; flex-direction: column; gap: 2mm; margin-left: 6mm;">
                              <div style="font-size: 9pt; color: #7f8c8d;">연락처: ${selectedCompanyInfo?.contact || '_________________'}</div>
                              <div style="font-size: 9pt; color: #7f8c8d;">주소: ${selectedCompanyInfo?.address || '_________________'}</div>
                            </div>
                          </div>
                        </div>
                      </div>
                      
                      <div style="margin-bottom: 12mm;">
                        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 4mm; flex-wrap: nowrap; gap: 8mm; min-height: 12.8mm;">
                          <div style="font-weight: bold; font-size: 13pt; color: #2c3e50; display: flex; align-items: center; white-space: nowrap; flex-shrink: 0; overflow: hidden; text-overflow: ellipsis; min-width: 0;">
                            <div style="width: 1.2mm; height: 6.4mm; background-color: #3498db; margin-right: 6mm; border-radius: 2px; flex-shrink: 0;"></div>
                            <span style="white-space: nowrap;">제품목록</span>
                          </div>
                          ${purchaseOrderName ? `<div style="font-size: 11pt; font-weight: 600; color: #2c3e50; background-color: #f8f9fa; padding: 4mm 8mm; border-radius: 4px; border: 1px solid #e9ecef; white-space: nowrap; flex-shrink: 0; min-width: 0; overflow: hidden; text-overflow: ellipsis; max-width: 60%;">발주명: ${purchaseOrderName}</div>` : ''}
                        </div>
                        
                        <div style="border: 2px solid #bdc3c7; border-radius: 4px; overflow: hidden; width: 115%; margin-left: -7.5%;">
                          <table style="table-layout: fixed; width: 100%; border-collapse: collapse;">
                            <thead>
                              <tr style="background-color: #34495e;">
                                <th style="border: 1px solid #95a5a6; text-align: center; font-weight: bold; font-size: 7.8pt; padding: 6mm 4mm; color: white; width: 8%; min-width: 16mm;">순번</th>
                                <th style="border: 1px solid #95a5a6; text-align: center; font-weight: bold; font-size: 7.8pt; padding: 6mm 4mm; color: white; width: 12%; min-width: 32mm;">공간</th>
                                <th style="border: 1px solid #95a5a6; text-align: center; font-weight: bold; font-size: 7.8pt; padding: 6mm 4mm; color: white; width: 12%; min-width: 36mm;">제품코드</th>
                                <th style="border: 1px solid #95a5a6; text-align: left; font-weight: bold; font-size: 7.8pt; padding: 6mm 4mm; color: white; width: 25%; min-width: 48mm;">세부내용</th>
                                <th style="border: 1px solid #95a5a6; text-align: center; font-weight: bold; font-size: 7.8pt; padding: 6mm 4mm; color: white; width: 12%; min-width: 32mm;">가로</th>
                                <th style="border: 1px solid #95a5a6; text-align: center; font-weight: bold; font-size: 7.8pt; padding: 6mm 4mm; color: white; width: 12%; min-width: 32mm;">세로</th>
                                <th style="border: 1px solid #95a5a6; text-align: center; font-weight: bold; font-size: 7.8pt; padding: 6mm 4mm; color: white; width: 8%; min-width: 28mm; white-space: nowrap;">줄방향</th>
                                <th style="border: 1px solid #95a5a6; text-align: center; font-weight: bold; font-size: 7.8pt; padding: 6mm 4mm; color: white; width: 6%; min-width: 24mm; white-space: nowrap;">줄길이</th>
                              </tr>
                            </thead>
                            <tbody>
                              ${editablePurchaseOrderData.length === 0 ? 
                                `<tr><td colspan="8" style="text-align: center; padding: 12mm; color: #7f8c8d; font-style: italic;">등록된 제품이 없습니다.</td></tr>` :
                                editablePurchaseOrderData.map((item: any, index: number) => `
                                  <tr style="${index % 2 === 1 ? 'background-color: #f8f9fa;' : ''}">
                                    <td style="border: 1px solid #bdc3c7; text-align: center; font-size: 9pt; padding: 4mm; font-weight: 600; width: 8%;">${index + 1}</td>
                                    <td style="border: 1px solid #bdc3c7; text-align: center; font-size: 9pt; padding: 4mm; width: 12%; word-break: break-word;">${item.space || item.spaceCustom || '-'}</td>
                                    <td style="border: 1px solid #bdc3c7; text-align: center; font-size: 9pt; padding: 4mm; font-family: monospace; width: 12%; word-break: break-all;">${item.productCode || '-'}</td>
                                    <td style="border: 1px solid #bdc3c7; text-align: left; font-size: 9pt; padding: 4mm; width: 25%; word-break: break-word; white-space: normal; line-height: 1.3;">${item.details || item.productName || '-'}</td>
                                    <td style="border: 1px solid #bdc3c7; text-align: center; font-size: 9pt; padding: 4mm; font-weight: 600; width: 12%;">${item.widthMM || item.productionWidth || '-'}</td>
                                    <td style="border: 1px solid #bdc3c7; text-align: center; font-size: 9pt; padding: 4mm; font-weight: 600; width: 12%;">${item.heightMM || item.productionHeight || '-'}</td>
                                    <td style="border: 1px solid #bdc3c7; text-align: center; font-size: 9pt; padding: 4mm; width: 8%;">${item.lineDir || '-'}</td>
                                    <td style="border: 1px solid #bdc3c7; text-align: center; font-size: 9pt; padding: 4mm; width: 6%;">${item.lineLen || '-'}</td>
                                  </tr>
                                `).join('')
                              }
                            </tbody>
                          </table>
                        </div>
                      </div>
                      
                      <div style="margin-bottom: 12mm;">
                        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 4mm; flex-wrap: nowrap; gap: 8mm; min-height: 12.8mm;">
                          <div style="font-weight: bold; font-size: 13pt; color: #2c3e50; display: flex; align-items: center; white-space: nowrap; flex-shrink: 0; overflow: hidden; textOverflow: ellipsis; min-width: 0;">
                            <div style="width: 1.2mm; height: 6.4mm; background-color: #3498db; margin-right: 6mm; border-radius: 2px; flex-shrink: 0;"></div>
                            <span style="white-space: nowrap;">납품정보</span>
                          </div>
                        </div>
                        
                        <div style="background-color: #e8f5e8; border: 1px solid #4caf50; border-radius: 4px; padding: 6mm; font-size: 10pt;">
                          <div style="display: flex; gap: 8mm;">
                            <div style="flex: 1;">
                              <div style="margin-bottom: 2mm; color: #2c3e50;">납품방법: ${deliveryMethod}</div>
                              <div style="margin-bottom: 2mm; color: #2c3e50;">상호: ${selectedCompanyInfo?.name || '우리회사'}</div>
                              <div style="color: #2c3e50;">주소: ${selectedCompanyInfo?.address || '_________________'}</div>
                            </div>
                            <div style="flex: 1;">
                              <div style="margin-bottom: 2mm; color: #2c3e50;">납품일자: ${deliveryDate}</div>
                              <div style="color: #2c3e50;">연락처: ${selectedCompanyInfo?.contact || '_________________'}</div>
                            </div>
                          </div>
                        </div>
                      </div>
                    `;
                    
                    document.body.appendChild(hiddenDiv);
                    
                    // PDF 저장
                    setTimeout(() => {
                      html2canvas(hiddenDiv, {
                        scale: 2,
                        useCORS: true,
                        allowTaint: true,
                        backgroundColor: '#ffffff'
                      }).then(canvas => {
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
                        
                        pdf.save(`발주서_${editablePurchaseOrderVendor}_${purchaseOrderDate}.pdf`);
                        
                        // 임시 div 제거
                        document.body.removeChild(hiddenDiv);
                      });
                    }, 100);
                  }
                }}
                sx={{
                  color: '#e67e22',
                  '&:hover': {
                    backgroundColor: 'rgba(230, 126, 34, 0.1)',
                  },
                }}
              >
                <PictureAsPdfIcon />
              </IconButton>
            </Tooltip>
            <Tooltip title="출력 미리보기">
              <IconButton
              onClick={() => {
                // 현재 수정된 데이터로 발주서 출력 미리보기
                const currentOrderId = orders[activeTab]?.id;
                if (currentOrderId && editablePurchaseOrderVendor) {
                  // 임시로 vendorPurchaseOrders 업데이트
                  setVendorPurchaseOrders(prev => ({
                    ...prev,
                    [currentOrderId]: prev[currentOrderId].map(order => 
                      order.vendor === editablePurchaseOrderVendor 
                        ? { ...order, items: editablePurchaseOrderData }
                        : order
                    )
                  }));
                  
                  // 선택된 거래처 설정
                  setSelectedVendorForPrint(editablePurchaseOrderVendor);
                  
                  // 발주서 출력 미리보기 모달 열기
                  setTimeout(() => {
                    setPurchaseOrderPrintModalOpen(true);
                  }, 100);
                }
              }}
              sx={{
                color: '#3498db',
                '&:hover': {
                  backgroundColor: 'rgba(52, 152, 219, 0.1)',
                },
              }}
            >
                <PrintIcon />
              </IconButton>
            </Tooltip>
            <IconButton
              onClick={handleEditablePurchaseOrderClose}
              sx={{
                color: '#7f8c8d',
                '&:hover': {
                  backgroundColor: 'rgba(127, 140, 141, 0.1)',
                },
              }}
            >
              <CloseIcon />
            </IconButton>
          </Box>
        </DialogTitle>
        <DialogContent sx={{ p: 0 }}>
          <Box sx={{ p: 2 }}>


            {/* 발주서 기본 정보 */}
            <Box sx={{ 
              mb: 2, 
              display: 'flex', 
              gap: 2, 
              alignItems: 'center',
              borderBottom: '1px solid #e9ecef',
              pb: 2
            }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Typography sx={{ color: '#2c3e50', fontSize: '0.875rem', fontWeight: '500' }}>
                  발주일자:
                </Typography>
                <TextField
                  type="date"
                  value={purchaseOrderDate}
                  onChange={(e) => setPurchaseOrderDate(e.target.value)}
                  size="small"
                  sx={{ 
                    minWidth: 150,
                    '& .MuiOutlinedInput-root': {
                      fontSize: '0.875rem'
                    },
                    '& .MuiInputBase-input': {
                      color: 'var(--text-color)'
                    }
                  }}
                />
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Typography sx={{ color: '#2c3e50', fontSize: '0.875rem', fontWeight: '500' }}>
                  발주명:
                </Typography>
                <TextField
                  value={purchaseOrderName}
                  onChange={(e) => setPurchaseOrderName(e.target.value)}
                  placeholder="발주서 제목을 입력하세요"
                  size="small"
                  sx={{ 
                    minWidth: 200,
                    '& .MuiOutlinedInput-root': {
                      fontSize: '0.875rem'
                    },
                    '& .MuiInputBase-input': {
                      color: 'var(--text-color)'
                    }
                  }}
                />
              </Box>
            </Box>

            {/* 납품 정보 */}
            <Box sx={{ 
              mb: 2, 
              display: 'flex', 
              gap: 2, 
              alignItems: 'center',
              borderBottom: '1px solid #e9ecef',
              pb: 2
            }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Typography sx={{ color: '#2c3e50', fontSize: '0.875rem', fontWeight: '500' }}>
                  납품방법:
                </Typography>
                <Select
                  value={deliveryMethod}
                  onChange={(e) => setDeliveryMethod(e.target.value)}
                  size="small"
                  sx={{ 
                    minWidth: 120,
                    '& .MuiOutlinedInput-root': {
                      fontSize: '0.875rem'
                    },
                    '& .MuiSelect-select': {
                      color: 'var(--text-color)'
                    },
                    '& .MuiMenuItem-root': {
                      color: 'var(--text-color)'
                    },
                    '& .MuiPaper-root': {
                      backgroundColor: 'var(--background-color)',
                      color: 'var(--text-color)'
                    }
                  }}
                >
                  <MenuItem value="직접배송">직접배송</MenuItem>
                  <MenuItem value="택배">택배</MenuItem>
                  <MenuItem value="화물">화물</MenuItem>
                </Select>
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Typography sx={{ color: '#2c3e50', fontSize: '0.875rem', fontWeight: '500' }}>
                  {deliveryMethod === '택배' ? '발송일자:' : '납품일자:'}
                </Typography>
                <Select
                  value={deliveryDate}
                  onChange={(e) => setDeliveryDate(e.target.value)}
                  size="small"
                  sx={{ 
                    minWidth: 120,
                    '& .MuiOutlinedInput-root': {
                      fontSize: '0.875rem'
                    },
                    '& .MuiSelect-select': {
                      color: 'var(--text-color)'
                    },
                    '& .MuiMenuItem-root': {
                      color: 'var(--text-color)'
                    },
                    '& .MuiPaper-root': {
                      backgroundColor: 'var(--background-color)',
                      color: 'var(--text-color)'
                    }
                  }}
                >
                  {Array.from({ length: 10 }, (_, i) => {
                    const date = new Date();
                    date.setDate(date.getDate() + i);
                    const dateString = date.toISOString().split('T')[0];
                    const displayDate = date.toLocaleDateString('ko-KR', { 
                      month: 'short', 
                      day: 'numeric',
                      weekday: 'short'
                    });
                    return (
                      <MenuItem key={dateString} value={dateString}>
                        {displayDate}
                      </MenuItem>
                    );
                  })}
                </Select>
              </Box>
            </Box>

            {/* 추가 전달사항 */}
            <Box sx={{ 
              mb: 2, 
              borderBottom: '1px solid #e9ecef',
              pb: 2
            }}>
              <Typography sx={{ 
                color: '#2c3e50', 
                fontSize: '0.875rem', 
                fontWeight: '500',
                mb: 1
              }}>
                추가 전달사항:
              </Typography>
              <TextField
                multiline
                rows={3}
                value={additionalNotes}
                onChange={(e) => setAdditionalNotes(e.target.value)}
                placeholder="발주서에 포함할 추가 전달사항을 입력하세요..."
                fullWidth
                size="small"
                sx={{
                  '& .MuiOutlinedInput-root': {
                    fontSize: '0.875rem',
                    '& textarea': {
                      color: 'var(--text-color)',
                      resize: 'vertical'
                    }
                  }
                }}
              />
            </Box>


          </Box>
        </DialogContent>
        <DialogActions sx={{ 
          p: 2, 
          borderTop: '2px solid #ecf0f1',
          backgroundColor: '#f8f9fa',
          display: 'flex',
          justifyContent: 'space-between'
        }}>
          <Box>
            <Typography sx={{ 
              fontSize: '10pt', 
              color: '#7f8c8d',
              fontStyle: 'italic'
            }}>
              * 엑셀처럼 직접 수정할 수 있습니다. 수정 후 저장 버튼을 클릭하세요.
            </Typography>
          </Box>
          <Box>
            <Button 
              onClick={handleEditablePurchaseOrderClose}
              sx={{ 
                mr: 2,
                color: '#7f8c8d',
                borderColor: '#bdc3c7',
                '&:hover': {
                  borderColor: '#95a5a6',
                  backgroundColor: 'rgba(127, 140, 141, 0.1)',
                },
              }}
              variant="outlined"
            >
              취소
            </Button>
            <Button 
              onClick={handleEditablePurchaseOrderSave}
              variant="contained"
              startIcon={<SaveIcon />}
              sx={{
                background: 'linear-gradient(45deg, #3498db, #2980b9)',
                boxShadow: '0 4px 15px rgba(52, 152, 219, 0.3)',
                '&:hover': {
                  background: 'linear-gradient(45deg, #2980b9, #1f5f8b)',
                  boxShadow: '0 6px 20px rgba(52, 152, 219, 0.4)',
                  transform: 'translateY(-1px)',
                },
                transition: 'all 0.3s ease',
              }}
            >
              저장
            </Button>
          </Box>
        </DialogActions>
      </Dialog>

      {/* 우리회사정보 선택 모달 */}
      <Dialog
        open={companyInfoModalOpen}
        onClose={() => setCompanyInfoModalOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle sx={{ color: '#333', fontWeight: 'bold' }}>
          우리회사정보 선택
        </DialogTitle>
        <DialogContent>
          <Typography variant="body2" sx={{ mb: 2, color: '#666' }}>
            발주서에 사용할 우리회사정보를 선택하세요.
          </Typography>
          <Grid container spacing={2}>
            {companyInfoList.map((company, index) => (
              <Grid item xs={12} md={6} key={company.id || index}>
                <Card
                  sx={{
                    cursor: 'pointer',
                    border: selectedCompanyInfo?.id === company.id ? '2px solid #FF6B9D' : '1px solid #ddd',
                    '&:hover': {
                      borderColor: '#FF6B9D',
                      boxShadow: '0 4px 12px rgba(255, 107, 157, 0.2)',
                    },
                  }}
                  onClick={() => setSelectedCompanyInfo(company)}
                >
                  <CardContent>
                    <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 1 }}>
                      {company.name}
                    </Typography>
                    <Typography variant="body2" sx={{ color: '#666', mb: 0.5 }}>
                      대표자: {company.ceo}
                    </Typography>
                    <Typography variant="body2" sx={{ color: '#666', mb: 0.5 }}>
                      연락처: {company.contact}
                    </Typography>
                    <Typography variant="body2" sx={{ color: '#666', mb: 0.5 }}>
                      주소: {company.address}
                    </Typography>
                    {company.deliveryCompanyName && (
                      <Typography variant="body2" sx={{ color: '#FF6B9D', fontWeight: 'bold', mt: 1 }}>
                        납품지: {company.deliveryCompanyName}
                      </Typography>
                    )}
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCompanyInfoModalOpen(false)}>
            취소
          </Button>
          <Button 
            onClick={() => {
              setCompanyInfoModalOpen(false);
            }}
            variant="contained"
            sx={{
              backgroundColor: '#FF6B9D',
              '&:hover': {
                backgroundColor: '#FF4757',
              },
            }}
          >
            선택 완료
          </Button>
        </DialogActions>
      </Dialog>

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

      {/* 옵션 복사 확인 다이얼로그 */}
      <Dialog
        open={copyOptionDialogOpen}
        onClose={() => setCopyOptionDialogOpen(false)}
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
              localhost:3000 내용:
            </Typography>
          </Box>
        </DialogTitle>
        <DialogContent sx={{ 
          backgroundColor: 'var(--surface-color)', 
          color: 'var(--text-color)',
          pt: 3
        }}>
          <Typography variant="body1" sx={{ mb: 2, lineHeight: 1.6 }}>
            이 제품에는 <span style={{ color: '#ff4444', fontWeight: 'bold' }}>옵션</span>이 있습니다. 옵션을 포함해서 복사하시겠습니까?
          </Typography>
          <Typography variant="body2" sx={{ mb: 1, color: 'var(--text-color)', opacity: 0.8 }}>
            "확인"을 누르면 옵션을 포함하여 복사됩니다.
          </Typography>
          <Typography variant="body2" sx={{ color: 'var(--text-color)', opacity: 0.8 }}>
            "취소"를 누르면 옵션 없이 복사됩니다.
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
              if (copyTargetRow && copyTargetRowIndex !== null) {
                copyProductWithoutOptions(copyTargetRow, copyTargetRowIndex);
              }
              setCopyOptionDialogOpen(false);
              setCopyTargetRow(null);
              setCopyTargetRowIndex(null);
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
            onClick={() => {
              if (copyTargetRow && copyTargetRowIndex !== null) {
                copyProductWithOptions(copyTargetRow, copyTargetRowIndex);
              }
              setCopyOptionDialogOpen(false);
              setCopyTargetRow(null);
              setCopyTargetRowIndex(null);
            }}
            variant="contained"
            sx={{
              backgroundColor: 'var(--primary-color)',
              '&:hover': {
                backgroundColor: 'var(--primary-color-dark)',
              },
            }}
          >
            확인
          </Button>
        </DialogActions>
      </Dialog>

      {/* 고객리스트 모달 */}

      {/* 견적서 출력 템플릿 */}
      {selectedEstimateForPrint && (
        <EstimateTemplate
          estimate={selectedEstimateForPrint}
          onClose={() => {
            setShowEstimateTemplate(false);
            setSelectedEstimateForPrint(null);
          }}
          discountAmount={Number(selectedEstimateForPrint.discountAmount) || 0}
          open={showEstimateTemplate}
        />
      )}

    </>
  );
};

export default OrderManagement; 