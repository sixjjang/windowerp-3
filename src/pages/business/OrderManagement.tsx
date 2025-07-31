import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  Box,
  Typography,
  Button,
  TextField,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Snackbar,
  Alert,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  List,
  ListItem,
  ListItemText,
  ListItemButton,
  Divider,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  ButtonGroup,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  ToggleButton,
  ToggleButtonGroup,
  IconButton,
  Checkbox,
  useMediaQuery,
  useTheme,
} from '@mui/material';
import {
  Print as PrintIcon,
  CheckCircle as CheckCircleIcon,
  ExpandMore as ExpandMoreIcon,
  CallSplit as SplitIcon,
  Delete as DeleteIcon,
  PictureAsPdf as PdfIcon,
  Image as ImageIcon,
  Share as ShareIcon,
  ArrowBack as ArrowBackIcon,
} from '@mui/icons-material';
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import { useReactToPrint } from 'react-to-print';
import {
  useDeliveryStore,
  DeliverySite,
  PaymentStatus,
  ConstructionType,
} from '../../utils/deliveryStore';
import { Estimate, EstimateRow } from '../../types';
import { orderService } from '../../utils/firebaseDataService';

// 타입 정의를 직접 여기에 포함
interface Contract {
  id: number;
  contractNo: string;
  estimateNo: string;
  contractDate: string;
  customerName: string;
  contact: string;
  emergencyContact: string;
  address: string;
  projectName: string;
  type: string;
  totalAmount: number;
  discountedAmount: number;
  depositAmount: number;
  remainingAmount: number;
  paymentMethod: string;
  paymentDate: string;
  status:
    | 'draft'
    | 'pending'
    | 'signed'
    | 'completed'
    | 'cancelled'
    | 'in_progress';
  signatureData?: string;
  agreementMethod: 'signature' | 'checkbox';
  memo: string;
  createdAt: string;
  updatedAt: string;
  constructionDate?: string;
  rows?: EstimateRow[]; // any[]에서 EstimateRow[]로 수정
}

// =================================================================================
// DATA STRUCTURES & STATE MANAGEMENT (ZUSTAND)
// =================================================================================

type OrderStatus = '작성중' | '발주완료' | '입고대기' | '입고완료' | '취소';

export interface OrderItem {
  id: number;
  productCode: string;
  productName: string;
  specification: string;
  unit: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  deliveryDate: string;
  note: string;
  vendor: string;
  brand?: string;
  space?: string;
  spaceCustom?: string;
  productType?: string;
  curtainType?: string;
  pleatType?: string;
  width?: string;
  details?: string;
  widthMM?: number;
  heightMM?: number;
  estimateWidth?: number;
  estimateHeight?: number;
  productionWidth?: number;
  productionHeight?: number;
  area?: number;
  lineDir?: string;
  lineLen?: string | number;
  pleatAmount?: string | number;
  widthCount?: number;
  salePrice?: number;
  cost?: number;
  purchaseCost?: number;
  margin?: number;
  requestNote?: string;
  type?: 'product' | 'option';
  showRequestNote?: boolean;
}

export interface Order {
  id: string;
  orderGroupId: string;
  orderNo: string;
  orderDate: string;
  contractId: string;
  contractNo: string;
  projectName: string;
  customerName: string;
  customerContact: string;
  vendorId: string;
  vendorName: string;
  vendorContact: string;
  vendorAddress: string;
  deliveryDate: string;
  deliveryAddress: string;
  contactPerson: string;
  contactPhone: string;
  status: OrderStatus;
  totalAmount: number;
  taxAmount: number;
  grandTotal: number;
  note: string;
  items: OrderItem[];
  deliveryMethod?: string;
  completionDate?: string;
  createdAt: string;
  updatedAt: string;
}

interface OrderStore {
  orders: Order[];
  addOrder: (order: Order) => void;
  removeOrder: (orderId: string) => void;
  updateOrder: (orderId: string, updatedFields: Partial<Order>) => void;
  updateOrderItems: (orderId: string, items: OrderItem[]) => void;
  setOrders: (orders: Order[]) => void;
}

const useOrderStore = create(
  persist<OrderStore>(
    (set, get) => ({
      orders: [],
      addOrder: async (order) => {
        set(state => ({ orders: [...state.orders, order] }));
        
        // Firebase에 저장
        try {
          await orderService.saveOrder(order);
          console.log('주문 Firebase 저장 성공:', order.id);
        } catch (error) {
          console.error('주문 Firebase 저장 실패:', error);
        }
      },
      removeOrder: async (orderId) => {
        console.log('🗑️ 주문 삭제 시작:', orderId);
        
        // Firebase에서 먼저 삭제
        try {
          const result = await orderService.deleteOrder(orderId);
          console.log('✅ Firebase 삭제 결과:', result);
          
          if (result.success) {
            // Firebase 삭제 성공 시 로컬 상태에서도 제거
            set(state => ({ orders: state.orders.filter(o => o.id !== orderId) }));
            console.log('✅ 로컬 상태에서도 주문 제거 완료');
          } else {
            console.error('❌ Firebase 삭제 실패:', result.message);
            // 삭제 실패 시 사용자에게 알림
            alert(`주문 삭제 실패: ${result.message}`);
          }
        } catch (error) {
          console.error('❌ 주문 Firebase 삭제 중 오류:', error);
          // 오류 발생 시에도 로컬에서는 제거 (일관성 유지)
          set(state => ({ orders: state.orders.filter(o => o.id !== orderId) }));
          console.log('⚠️ 오류 발생으로 로컬에서만 제거됨');
        }
      },
      updateOrder: async (orderId, updatedFields) => {
        const updatedOrder = {
          ...updatedFields,
          updatedAt: new Date().toISOString(),
        };
        
        set(state => ({
          orders: state.orders.map(order =>
            order.id === orderId
              ? {
                  ...order,
                  ...updatedOrder,
                }
              : order
          ),
        }));
        
        // Firebase에 업데이트
        try {
          await orderService.updateOrder(orderId, updatedOrder);
          console.log('주문 Firebase 업데이트 성공:', orderId);
        } catch (error) {
          console.error('주문 Firebase 업데이트 실패:', error);
        }
      },
      updateOrderItems: async (orderId, items) => {
        const order = get().orders.find(o => o.id === orderId);
        if (!order) return;
        
        const totalAmount = items.reduce(
          (sum, item) => sum + item.quantity * item.unitPrice,
          0
        );
        const taxAmount = Math.round(totalAmount * 0.1);
        const updatedOrder = {
          ...order,
          items,
          totalAmount,
          taxAmount,
          grandTotal: totalAmount + taxAmount,
          updatedAt: new Date().toISOString(),
        };
        
        set(state => ({
          orders: state.orders.map(order => {
            if (order.id === orderId) {
              return updatedOrder;
            }
            return order;
          }),
        }));
        
        // Firebase에 업데이트
        try {
          await orderService.updateOrder(orderId, updatedOrder);
          console.log('주문 아이템 Firebase 업데이트 성공:', orderId);
        } catch (error) {
          console.error('주문 아이템 Firebase 업데이트 실패:', error);
        }
      },
      setOrders: orders => set({ orders }),
    }),
    {
      name: 'order-management-storage',
    }
  )
);

// =================================================================================
// HELPER FUNCTIONS
// =================================================================================

function getStatusColor(
  status: string
): 'primary' | 'secondary' | 'error' | 'info' | 'success' | 'warning' {
  switch (status) {
    case '작성중':
      return 'info';
    case '발주완료':
      return 'primary';
    case '입고대기':
      return 'warning';
    case '입고완료':
      return 'success';
    case '취소':
      return 'error';
    default:
      return 'primary';
  }
}

function getContractStatusText(status: string): string {
  switch (status) {
    case 'in_progress':
      return '진행중';
    case 'signed':
      return '계약완료';
    case 'completed':
      return '완료';
    case 'cancelled':
      return '취소';
    default:
      return '알수없음';
  }
}

function getContractStatusColor(status: string): string {
  switch (status) {
    case 'in_progress':
      return '#3498db';
    case 'signed':
      return '#4caf50'; // 계약완료 색상 추가
    case 'completed':
      return '#2ecc71';
    case 'cancelled':
      return '#e74c3c';
    default:
      return '#95a5a6';
  }
}

function extractCoreAddress(address: string): string {
  if (!address) return '';
  const patterns = [
    '힐스테이트',
    '푸르지오',
    '더샵',
    '아이파크',
    '자이',
    '래미안',
    '이편한세상',
    'SKVIEW',
    '롯데캐슬',
    '포레나',
    '데시앙',
    '해링턴플레이스',
  ];
  for (const pattern of patterns) {
    const index = address.indexOf(pattern);
    if (index !== -1) return address.substring(index).replace(/[\s\-,()]/g, '');
  }
  const roadPatterns = ['대로', '로', '길'];
  for (const pattern of roadPatterns) {
    const index = address.lastIndexOf(pattern);
    if (index !== -1)
      return address
        .substring(index + 1)
        .trim()
        .replace(/[\s\-,()]/g, '');
  }
  return address
    .split(' ')
    .filter(p => p)
    .slice(-2)
    .join('')
    .replace(/[\s\-,()]/g, '');
}

// 주소에서 네비게이션 주소 추출 함수 (스케줄과 동일한 방식)
const extractNavigationAddress = (address: string) => {
  if (!address) return '';
  // 1. 아파트/오피스텔/빌라/타워 등 키워드
  const aptRegex =
    /(\S+아파트|\S+오피스텔|\S+빌라|\S+타워|힐스테이트|센트럴|삼성|현대|롯데)[\s\S]*?(\d{1,3}동)?\s?(\d{1,4}호)?/;
  const match = address.match(aptRegex);
  if (match) {
    let result = match[1] || '';
    if (match[2] && match[3]) {
      result +=
        ' ' + match[2].replace('동', '') + '-' + match[3].replace('호', '');
    } else if (match[2]) {
      result += ' ' + match[2];
    } else if (match[3]) {
      result += ' ' + match[3];
    }
    return result.trim();
  }
  // 2. 동/번지
  const dongBunji = address.match(/([가-힣]+동)\s?(\d{1,5}(-\d{1,5})?번지?)/);
  if (dongBunji) {
    return dongBunji[1] + ' ' + dongBunji[2];
  }
  // 3. 기타: 마지막 2~3개 토큰
  const tokens = address.trim().split(/\s+/);
  if (tokens.length <= 2) return address;
  return tokens.slice(-3).join(' ');
};

// 가장 명확하게 찾을 수 있는 주소 정보만 추출 (동호수 패턴 보완)
const extractBestAddress = (address: string) => {
  if (!address) return '';
  // 1. 아파트/오피스텔/빌라/타워/건물명 + 동/호수 (붙어있는 패턴 포함)
  const aptRegex =
    /([가-힣]+)(아파트|오피스텔|빌라|타워|테라스|캐슬|팰리스|센트럴|아이파크|자이|푸르지오|더샵|래미안|이편한세상|SKVIEW|롯데캐슬|포레나|데시앙|해링턴플레이스)[\s-]*((\d{1,3})동)?[\s-]*(\d{1,4})호?/;
  const match = address.match(aptRegex);
  if (match) {
    let result = (match[1] || '') + (match[2] || '');
    if (match[4]) result += ` ${match[4]}동`;
    if (match[5]) result += `${match[5]}호`;
    return result.trim();
  }
  // 2. 동/번지
  const dongBunji = address.match(
    /([가-힣]+동)[\s-]?(\d{1,5}(-\d{1,5})?번지?)/
  );
  if (dongBunji) {
    return `${dongBunji[1]} ${dongBunji[2]}`;
  }
  // 3. 그 외: 전체 주소
  return address.trim();
};

function generateOrderNo(address: string, allOrders: Order[]): string {
  if (!address) return `TEMP-${new Date().getTime()}`;
  const baseOrderNo = extractCoreAddress(address);
  const relatedOrders = allOrders.filter(o =>
    o.orderNo.startsWith(baseOrderNo)
  );
  if (relatedOrders.length === 0) return baseOrderNo;
  const suffixes = relatedOrders
    .map(o => {
      const match = o.orderNo.match(new RegExp(`^${baseOrderNo}-(\\d+)$`));
      return match
        ? parseInt(match[1], 10)
        : o.orderNo === baseOrderNo
          ? 0
          : -1;
    })
    .filter(n => n >= 0);
  const nextSuffix = suffixes.length > 0 ? Math.max(...suffixes) + 1 : 1;
  return `${baseOrderNo}-${nextSuffix}`;
}

function getPurchaseTotal(item: OrderItem): number {
  // 옵션 항목에 대한 계산 로직을 먼저 처리
  if (item.type === 'option' && item.note) {
    const unitPrice = item.unitPrice || 0;
    const quantity = item.quantity || 1;
    switch (item.note) {
      case '폭당':
        return Math.round(unitPrice * (item.widthCount || 0) * quantity);
      case 'm2당':
        return Math.round(unitPrice * (item.area || 0) * quantity);
      case 'm당':
        return Math.round(
          ((unitPrice * (item.widthMM || 0)) / 1000) * quantity
        );
      case '추가':
        return Math.round(unitPrice * quantity);
      case '포함':
        return 0;
      default:
        return Math.round(unitPrice * quantity);
    }
  }

  // 기존 제품 항목에 대한 계산 로직 (폴백)
  // 헌터더글라스: 판매단가 기준 입고금액 계산 (판매단가 * 0.6 / 1.1)
  if (item.brand?.toLowerCase() === 'hunterdouglas')
    return item.salePrice ? Math.round((item.salePrice * 0.6) / 1.1) : 0;
  if (item.productType === '블라인드') {
    const areaNum = Number(item.area);
    return item.purchaseCost && areaNum
      ? Math.round(item.purchaseCost * areaNum)
      : 0;
  }
  if (
    item.curtainType === '겉커튼' &&
    (item.pleatType === '민자' || item.pleatType === '나비')
  )
    return item.purchaseCost && item.widthCount
      ? Math.round(item.purchaseCost * item.widthCount)
      : 0;
  // 속커튼-민자: 대폭민자원가 * 면적(m2)
  if (item.curtainType === '속커튼' && item.pleatType === '민자') {
    const areaNum = Number(item.area);
    let costToUse = (item as any).largePlainCost;
    
    // 대폭민자원가가 없으면 입고원가의 70% 사용
    if (!costToUse) {
      costToUse = item.purchaseCost ? item.purchaseCost * 0.7 : 0;
    }
    
    return costToUse && areaNum ? Math.round(costToUse * areaNum) : 0;
  }
  if (item.curtainType === '속커튼' && item.pleatType === '나비') {
    const areaNum = Number(item.area);
    return item.purchaseCost && areaNum
      ? Math.round(item.purchaseCost * areaNum)
      : 0;
  }
  return item.purchaseCost || 0;
}

// =================================================================================
// MAIN COMPONENT
// =================================================================================
const OrderManagement: React.FC = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  
  const { orders, addOrder, updateOrder, updateOrderItems, removeOrder, setOrders } =
    useOrderStore();
  const { addDelivery, deliveries } = useDeliveryStore();
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'info' as 'info' | 'success' | 'error',
  });
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [estimates, setEstimates] = useState<Estimate[]>([]);
  const [selectedContract, setSelectedContract] = useState<Contract | null>(
    null
  );
  const [showCustomerInfo, setShowCustomerInfo] = useState(true);
  const [printDialogOpen, setPrintDialogOpen] = useState(false);
  const [printFormat, setPrintFormat] = useState<'formal' | 'simple'>('formal');
  const [senderInfo, setSenderInfo] = useState({
    companyName: '회사명',
    contact: '연락처',
    address: '주소',
  });

  const [contractPanelWidth, setContractPanelWidth] = useState(25);
  const [isResizing, setIsResizing] = useState(false);
  const [selectedCompletedGroup, setSelectedCompletedGroup] = useState<
    Order[] | null
  >(null);
  const [completedOrderDetailModalOpen, setCompletedOrderDetailModalOpen] =
    useState(false);
  const [completedOrderFilterModalOpen, setCompletedOrderFilterModalOpen] =
    useState(false);
  const [completedOrderFilterType, setCompletedOrderFilterType] = useState<
    'today' | 'week' | 'month' | 'custom'
  >('today');
  const [customDateRange, setCustomDateRange] = useState<{
    start: string;
    end: string;
  }>({
    start: new Date().toISOString().split('T')[0],
    end: new Date().toISOString().split('T')[0],
  });

  const [expandedGroupKey, setExpandedGroupKey] = useState<string | false>(
    false
  );
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);
  const [companyInfo, setCompanyInfo] = useState({
    name: '',
    address: '',
    contact: '',
  });

  const printComponentRef = useRef(null);

  const handleReactToPrint = useReactToPrint({
    content: () => printComponentRef.current,
  });

  const formalTemplateRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const loadData = async () => {
      try {
        console.log('🔄 Firebase에서 주문 데이터 로드 시작');
        const data = await orderService.getOrders();
        console.log('📊 Firebase에서 주문 데이터 로드 완료:', data.length, '개');
        
        // Firebase 데이터를 Order 타입으로 변환하여 Zustand store에 설정
        const ordersData = data.map((item: any) => ({
          id: item.id,
          orderGroupId: item.orderGroupId || '',
          orderNo: item.orderNo || '',
          orderDate: item.orderDate || '',
          contractId: item.contractId || '',
          contractNo: item.contractNo || '',
          projectName: item.projectName || '',
          customerName: item.customerName || '',
          customerContact: item.customerContact || '',
          vendorId: item.vendorId || '',
          vendorName: item.vendorName || '',
          vendorContact: item.vendorContact || '',
          vendorAddress: item.vendorAddress || '',
          deliveryDate: item.deliveryDate || '',
          deliveryAddress: item.deliveryAddress || '',
          contactPerson: item.contactPerson || '',
          contactPhone: item.contactPhone || '',
          status: item.status || '작성중',
          totalAmount: item.totalAmount || 0,
          taxAmount: item.taxAmount || 0,
          grandTotal: item.grandTotal || 0,
          note: item.note || '',
          items: item.items || [],
          deliveryMethod: item.deliveryMethod || '',
          completionDate: item.completionDate || '',
          createdAt: item.createdAt || '',
          updatedAt: item.updatedAt || ''
        })) as Order[];
        
        setOrders(ordersData);
        console.log('✅ Zustand store에 주문 데이터 설정 완료');
        
        // 계약서와 견적서 데이터 로드
        const savedContracts = localStorage.getItem('contracts');
        if (savedContracts) {
          setContracts(JSON.parse(savedContracts));
          console.log('📋 계약서 데이터 로드 완료');
        }
        
        const savedEstimates = localStorage.getItem('approvedEstimatesList');
        if (savedEstimates) {
          setEstimates(JSON.parse(savedEstimates));
          console.log('📋 견적서 데이터 로드 완료');
        }
        
      } catch (error) {
        console.error('❌ Firebase 데이터 로드 실패, localStorage 사용:', error);
        
        // Firebase 실패 시 localStorage에서 로드
        const savedContracts = localStorage.getItem('contracts');
        if (savedContracts) setContracts(JSON.parse(savedContracts));
        
        const savedEstimates = localStorage.getItem('approvedEstimatesList');
        if (savedEstimates) setEstimates(JSON.parse(savedEstimates));
        
        // 주문 데이터는 빈 배열로 설정
        setOrders([]);
        console.log('⚠️ Firebase 실패로 빈 주문 데이터로 설정');
      }
    };
    
    loadData();

    const fetchCompanyInfo = async () => {
      try {
        // Firebase Functions 사용
        const apiUrl = 'https://us-central1-windowerp-3.cloudfunctions.net';
        const response = await fetch(`${apiUrl}/companyInfo`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
          mode: 'cors',
        });
        
        if (response.ok) {
          const data = await response.json();
          setCompanyInfo(data);
          console.log('✅ 회사 정보 로드 성공:', data);
          return;
        } else {
          console.warn('⚠️ 회사 정보 응답 오류:', response.status, response.statusText);
        }
      } catch (error) {
        console.log('❌ Firebase Functions 연결 실패, 기본값 사용:', error);
      }

      // 기본값 설정 (연결 실패 시)
      setCompanyInfo({
        name: '회사명',
        address: '회사주소',
        contact: '회사연락처',
      });
    };
    fetchCompanyInfo();
  }, []);

  // 발주완료 상태에서 입고완료로 자동 변경하는 기능
  useEffect(() => {
    const autoCompleteOrders = () => {
      const ordersToUpdate = orders.filter(
        order => order.status === '발주완료'
      );

      if (ordersToUpdate.length > 0) {
        console.log(
          '🔄 자동 입고완료 처리 시작:',
          ordersToUpdate.length,
          '개 발주'
        );

        ordersToUpdate.forEach(order => {
          // 발주완료 후 3초 후에 입고완료로 자동 변경
          setTimeout(() => {
            console.log(
              '⏰ 자동 입고완료 처리:',
              order.vendorName,
              order.orderNo
            );
            updateOrder(order.id, {
              status: '입고완료',
              completionDate: new Date().toISOString(),
            });
            setSnackbar({
              open: true,
              message: `[${order.vendorName}] 발주가 자동으로 입고완료 처리되었습니다.`,
              severity: 'success',
            });

            // 해당 프로젝트의 모든 발주가 완료되었는지 확인
            checkAndCompleteProject(order.orderGroupId);
          }, 3000); // 3초 후 자동 변경
        });
      }
    };

    // 발주완료 상태의 주문이 있을 때만 실행
    const hasCompletedOrders = orders.some(
      order => order.status === '발주완료'
    );
    if (hasCompletedOrders) {
      autoCompleteOrders();
    }
  }, [orders.filter(order => order.status === '발주완료').length]); // 발주완료 상태인 주문 개수만 의존성으로 설정

  // 프로젝트 완료 체크 및 납품관리 이동 함수
  const checkAndCompleteProject = (orderGroupId: string) => {
    console.log('🔍 checkAndCompleteProject 호출됨:', orderGroupId);

    // 해당 그룹의 모든 주문 가져오기
    const groupOrders = orders.filter(
      order => order.orderGroupId === orderGroupId
    );
    console.log(
      '📋 그룹 주문들:',
      groupOrders.map(o => ({
        id: o.id,
        status: o.status,
        vendorName: o.vendorName,
        orderNo: o.orderNo,
      }))
    );

    // 모든 주문이 입고완료 상태인지 확인
    const allCompleted = groupOrders.every(
      order => order.status === '입고완료' || order.status === '발주완료'
    );
    console.log('✅ 모든 주문 완료 여부:', allCompleted);
    console.log('📊 상태별 개수:', {
      작성중: groupOrders.filter(o => o.status === '작성중').length,
      발주완료: groupOrders.filter(o => o.status === '발주완료').length,
      입고대기: groupOrders.filter(o => o.status === '입고대기').length,
      입고완료: groupOrders.filter(o => o.status === '입고완료').length,
      취소: groupOrders.filter(o => o.status === '취소').length,
    });

    if (allCompleted && groupOrders.length > 0) {
      console.log('🎉 모든 발주 완료! 납품관리로 이동 시작');
      const firstOrder = groupOrders[0];

      // 발주완료 상태인 주문들을 먼저 입고완료로 변경
      const pendingOrders = groupOrders.filter(
        order => order.status === '발주완료'
      );
      if (pendingOrders.length > 0) {
        console.log(
          '⚡ 발주완료 상태인 주문들을 입고완료로 즉시 변경:',
          pendingOrders.length,
          '개'
        );
        pendingOrders.forEach(order => {
          updateOrder(order.id, {
            status: '입고완료',
            completionDate: new Date().toISOString(),
          });
        });
      }

      // 이미 납품관리에 데이터가 있는지 확인 (프로젝트 단위로)
      const projectDeliveryId = `${orderGroupId}-delivery`;
      const isAlreadyDelivered = deliveries.some(
        (delivery: DeliverySite) => delivery.id === projectDeliveryId
      );
      if (isAlreadyDelivered) {
        console.log('❗중복 납품 데이터 추가 방지:', projectDeliveryId);
        setSnackbar({
          open: true,
          message: `[${firstOrder.projectName}] 이미 납품관리에 등록된 프로젝트입니다.`,
          severity: 'info',
        });
        return;
      }

      // 계약에서 계약금 정보 가져오기
      const contract = contracts.find(
        c => c.contractNo === firstOrder.contractNo
      );
      // 모든 발주가 완료된 경우에만 납품관리로 데이터 전송 (프로젝트 단위)
      // 모든 주문의 제품(items) 합치기 (견적서 rows 순서대로)
      let allItems: OrderItem[] = [];
      let railItems: OrderItem[] = []; // 레일 정보 별도 저장

      if (contract && Array.isArray(contract.rows)) {
        // 견적서 rows 순서대로 OrderItem을 찾아서 배열을 재구성
        const processedItems = contract.rows
          .map((row: any, idx: any) => {
            // 옵션도 productCode가 없거나 중복될 수 있으므로, productName+type으로도 매칭
            const found = groupOrders
              .flatMap(order => order.items)
              .find(item => {
                if (item.type === row.type) {
                  if (
                    item.productCode &&
                    row.productCode &&
                    item.productCode === row.productCode
                  )
                    return true;
                  if (
                    !item.productCode &&
                    !row.productCode &&
                    item.productName === row.productName
                  )
                    return true;
                  if (item.productName === row.productName) return true;
                }
                return false;
              });

            if (found) {
              const processedItem = { ...found, originalIndex: idx };

              // 레일 정보는 별도로 분리
              if (row.type === 'option' && row.optionLabel === '레일') {
                railItems.push(processedItem);
                return null; // 레일은 allItems에서 제외
              }

              return processedItem;
            }
            return null;
          })
          .filter(Boolean) as OrderItem[];

        allItems = processedItems;
      } else {
        // fallback: 기존 방식
        allItems = groupOrders.flatMap(order => order.items);
      }

      // 레일 정보가 없으면 계약서에서 직접 추출
      if (railItems.length === 0 && contract && Array.isArray(contract.rows)) {
        const railRow = contract.rows.find(
          row => row.type === 'option' && row.optionLabel === '레일'
        );
        if (railRow) {
          railItems.push({
            id: Date.now() + Math.random(),
            type: 'option',
            productCode: '',
            productName: '레일',
            specification: railRow.details || '',
            unit: 'EA',
            quantity: railRow.quantity || 0,
            unitPrice: railRow.purchaseCost || 0,
            totalPrice: railRow.cost || 0,
            deliveryDate: '',
            note: '서비스 품목',
            vendor: '서비스',
            brand: '',
            space: '',
            productType: '',
            curtainType: '',
            pleatType: '',
            width: '',
            details: railRow.details || '',
            widthMM: 0,
            heightMM: 0,
            area: 0,
            lineDir: '',
            lineLen: 0,
            pleatAmount: 0,
            widthCount: 0,
            salePrice: 0,
            cost: railRow.cost || 0,
            purchaseCost: railRow.purchaseCost || 0,
            margin: railRow.margin || 0,
            requestNote: '',
            showRequestNote: false,
          });
        }
      }

      const totalAmount = groupOrders.reduce(
        (sum, order) => sum + order.totalAmount,
        0
      );
      console.log('💰 총 금액:', totalAmount);

      // 계약에서 계약금 정보 가져오기
      const depositAmount = contract?.depositAmount || 0;
      console.log(
        '💳 계약금:',
        depositAmount,
        '계약번호:',
        firstOrder.contractNo
      );

      // 계약의 할인후금액(discountedAmount)을 사용하여 finalAmount 설정
      const finalAmount = contract?.discountedAmount || totalAmount;
      const discountAmount = totalAmount - finalAmount;
      console.log('💸 할인후금액:', finalAmount, '할인금액:', discountAmount);

      const initialPaymentRecords =
        depositAmount > 0
          ? [
              {
                id: 'contract-deposit',
                date:
                  contract?.contractDate ||
                  new Date().toISOString().split('T')[0],
                time: '00:00',
                amount: depositAmount,
                method:
                  (contract?.paymentMethod as '현금' | '계좌이체' | '카드') ||
                  '현금',
                note: '계약금',
              },
            ]
          : [];

      const deliveryData: DeliverySite = {
        id: projectDeliveryId,
        customerName: firstOrder.customerName,
        projectName: firstOrder.projectName,
        contact: firstOrder.customerContact,
        address: contract?.address || firstOrder.deliveryAddress, // 고객 주소 사용
        constructionType: '제품만' as ConstructionType,
        constructionDate:
          contract?.constructionDate
            ? contract.constructionDate.split('T')[0]
            : (firstOrder.deliveryDate || new Date().toISOString().split('T')[0]),
        constructionTime:
          contract?.constructionDate && contract.constructionDate.includes('T')
            ? contract.constructionDate.split('T')[1]?.substring(0, 5) || '09:00'
            : '09:00',
        deliveryStatus: '제품준비중',
        paymentStatus:
          depositAmount >= finalAmount
            ? ('결제완료' as PaymentStatus)
            : ('미수금' as PaymentStatus),
        totalAmount: totalAmount,
        discountAmount: discountAmount,
        finalAmount: finalAmount,
        paidAmount: depositAmount,
        remainingAmount: finalAmount - depositAmount,
        paymentRecords: initialPaymentRecords,
        asRecords: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        // 추가: 모든 주문의 제품 정보 통합
        items: allItems,
        // 레일 정보 별도 추가
        railItems: railItems,
      };

      console.log('📦 납품 데이터 생성:', deliveryData);
      addDelivery(deliveryData);
      console.log('✅ 납품관리로 데이터 전송 완료');

      setSnackbar({
        open: true,
        message: `[${firstOrder.deliveryAddress}] 현장의 모든 발주가 완료되었습니다. 납품관리로 이동되었습니다.`,
        severity: 'success',
      });
      setSelectedOrderId(null);
      setExpandedGroupKey(false);
    } else {
      console.log('⏳ 아직 모든 발주가 완료되지 않음. 대기 중...');
    }
  };

  const { ongoingOrderGroups, completedOrderGroups, filteredOngoingGroups } =
    useMemo(() => {
      const groups: { [key: string]: Order[] } = {};
      orders.forEach(order => {
        const key = order.orderGroupId;
        if (!groups[key]) groups[key] = [];
        groups[key].push(order);
      });

      const ongoing: { [key: string]: Order[] } = {};
      const completed: { [key: string]: Order[] } = {};
      Object.entries(groups).forEach(([key, groupOrders]) => {
        if (groupOrders.every(o => o.status === '입고완료'))
          completed[key] = groupOrders;
        else ongoing[key] = groupOrders;
      });

      return {
        ongoingOrderGroups: ongoing,
        completedOrderGroups: completed,
        filteredOngoingGroups: ongoing,
      };
    }, [orders]);

  const selectedOrder = useMemo(
    () => orders.find(o => o.id === selectedOrderId),
    [orders, selectedOrderId]
  );

  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsResizing(true);
  };

  const handleMouseMove = (e: MouseEvent) => {
    if (!isResizing) return;
    const container = document.getElementById('order-management-container');
    if (!container) return;
    const newWidth =
      ((e.clientX - container.getBoundingClientRect().left) /
        container.getBoundingClientRect().width) *
      100;
    setContractPanelWidth(Math.max(15, Math.min(50, newWidth)));
  };

  const handleMouseUp = () => setIsResizing(false);

  useEffect(() => {
    if (isResizing) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isResizing, handleMouseMove]);

  const handleSplitVendors = () => {
    if (!selectedContract) {
      return setSnackbar({
        open: true,
        message: '계약서를 선택해주세요.',
        severity: 'error',
      });
    }

    const contractRows = selectedContract.rows;

    if (
      !contractRows ||
      !Array.isArray(contractRows) ||
      contractRows.length === 0
    ) {
      return setSnackbar({
        open: true,
        message: '계약서에 제품 정보가 없습니다.',
        severity: 'error',
      });
    }

    // 1. 부모-자식 관계 설정: 옵션이 자신의 부모 제품을 명확히 알도록 연결합니다.
    let currentProduct: EstimateRow | null = null;
    const linkedRows = contractRows.map(row => {
      if (row.type === 'product') {
        currentProduct = row;
        return { ...row, parent: null }; // 제품은 부모가 없음
      }
      if (row.type === 'option') {
        return { ...row, parent: currentProduct }; // 옵션에 부모 제품을 연결
      }
      return { ...row, parent: null };
    });

    const filteredRows = linkedRows.filter(
      row =>
        row.vendor &&
        row.vendor.trim() !== '서비스' &&
        row.vendor.trim() !== '자사'
    );
    if (filteredRows.length === 0) {
      return setSnackbar({
        open: true,
        message: '발주할 항목이 없습니다 (서비스/자사 제외).',
        severity: 'info',
      });
    }

    // 2. 거래처별로 그룹화
    const vendorGroups = filteredRows.reduce(
      (acc, row) => {
        (acc[row.vendor] = acc[row.vendor] || []).push(row);
        return acc;
      },
      {} as { [key: string]: (EstimateRow & { parent: EstimateRow | null })[] }
    );

    const groupBaseKey = `${selectedContract.address}_${selectedContract.contractDate}`;
    const existingGroupKeys = Object.keys(ongoingOrderGroups).filter(id =>
      id.startsWith(groupBaseKey)
    );
    let newGroupId = groupBaseKey;
    if (existingGroupKeys.length > 0) {
      const suffixes = existingGroupKeys.map(id => {
        const match = id.match(/-(\d+)$/);
        return match ? parseInt(match[1], 10) : 0;
      });
      newGroupId = `${groupBaseKey}-${Math.max(0, ...suffixes) + 1}`;
    }

    const tempOrders = [...orders];

    // 3. 발주서 생성
    Object.entries(vendorGroups).forEach(([vendor, vendorItems]) => {
      const orderNo = generateOrderNo(selectedContract.address, tempOrders);
      const now = new Date();

      const newItems: OrderItem[] = vendorItems.map(item => {
        const parentData = item.parent;

        return {
          id: Date.now() + Math.random(),
          type: item.type,
          productCode: item.productCode || '',
          productName: item.productName,
          specification: item.details || '',
          unit: 'EA',
          quantity: item.quantity,
          unitPrice: item.purchaseCost || 0,
          totalPrice: item.cost || 0,
          deliveryDate: '',
          note: item.note,
          vendor: item.vendor,
          brand: item.brand,
          space:
            item.type === 'option' && parentData
              ? `${parentData.space}-${item.productName}`
              : item.space,
          productType: item.productType,
          curtainType: item.curtainType,
          pleatType: item.pleatType,
          width: item.width,
          details: item.details,
          widthMM:
            item.type === 'option' && parentData
              ? parentData.widthMM
              : item.widthMM,
          heightMM:
            item.type === 'option' && parentData
              ? parentData.heightMM
              : item.heightMM,
          estimateWidth:
            item.type === 'option' && parentData
              ? parentData.widthMM
              : item.widthMM,
          estimateHeight:
            item.type === 'option' && parentData
              ? parentData.heightMM
              : item.heightMM,
          productionWidth:
            item.type === 'option' && parentData
              ? parentData.widthMM
              : item.widthMM,
          productionHeight:
            item.type === 'option' && parentData
              ? parentData.heightMM
              : item.heightMM,
          area:
            item.type === 'option' && parentData ? parentData.area : item.area,
          lineDir: item.lineDir,
          lineLen: item.lineLen,
          pleatAmount: item.pleatAmount,
          widthCount:
            item.type === 'option' && parentData
              ? parentData.widthCount
              : item.widthCount,
          salePrice: item.salePrice,
          cost: item.cost,
          purchaseCost: item.purchaseCost || 0,
          margin: item.margin,
          requestNote: item.note || '',
          showRequestNote: false,
          originalIndex: item.originalIndex, // 견적서/계약서 rows의 순서 정보 추가
        };
      });

      const newOrder: Order = {
        id: `${Date.now()}-${Math.random()}`,
        orderGroupId: newGroupId,
        orderNo,
        orderDate: now.toISOString().split('T')[0],
        contractId: selectedContract.id.toString(),
        contractNo: selectedContract.contractNo,
        projectName: selectedContract.projectName,
        customerName: selectedContract.customerName,
        customerContact: selectedContract.contact,
        vendorId: '',
        vendorName: vendor,
        vendorContact: '',
        vendorAddress: '',
        deliveryDate: '',
        deliveryAddress: companyInfo.address || '회사 주소를 등록해주세요.',
        contactPerson: '',
        contactPhone: companyInfo.contact || '회사 연락처를 등록해주세요.',
        status: '작성중',
        totalAmount: 0,
        taxAmount: 0,
        grandTotal: 0,
        note: '',
        items: newItems,
        deliveryMethod: '택배',
        createdAt: now.toISOString(),
        updatedAt: now.toISOString(),
      };
      addOrder(newOrder);
      tempOrders.push(newOrder);
    });

    setSnackbar({
      open: true,
      message: `${Object.keys(vendorGroups).length}개 발주서가 생성되었습니다.`,
      severity: 'success',
    });
    setExpandedGroupKey(newGroupId);
  };

  const handleUpdateSelectedOrderField = (field: keyof Order, value: any) => {
    if (selectedOrder) updateOrder(selectedOrder.id, { [field]: value });
  };

  const handleUpdateItem = (
    itemId: number,
    updatedFields: Partial<OrderItem>
  ) => {
    if (!selectedOrder) return;
    const newItems = selectedOrder.items.map(item =>
      item.id === itemId ? { ...item, ...updatedFields } : item
    );
    updateOrderItems(selectedOrder.id, newItems);
  };

  const handleCompleteOrder = () => {
    if (selectedOrder) {
      console.log(
        '🚀 발주 완료 버튼 클릭:',
        selectedOrder.vendorName,
        selectedOrder.orderNo
      );

      // 발주완료로 변경 (자동 입고완료 처리 로직이 작동하도록)
      updateOrder(selectedOrder.id, { status: '발주완료' });
      setSnackbar({
        open: true,
        message: `[${selectedOrder.vendorName}] 발주완료 처리되었습니다. 자동으로 입고완료로 변경됩니다.`,
        severity: 'info',
      });

      // 3초 후에 해당 프로젝트의 모든 발주가 완료되었는지 확인
      setTimeout(() => {
        checkAndCompleteProject(selectedOrder.orderGroupId);
      }, 1000); // 자동 입고완료 처리(3초) 후에 체크
    }
  };

  // 발주완료 상태로 변경하는 함수
  const handleMarkAsOrdered = () => {
    if (selectedOrder) {
      updateOrder(selectedOrder.id, { status: '발주완료' });
      setSnackbar({
        open: true,
        message: `[${selectedOrder.vendorName}] 발주완료 처리되었습니다. 자동으로 입고완료로 변경됩니다.`,
        severity: 'info',
      });
    }
  };

  const handleReopenOrder = (orderId: string) => {
    updateOrder(orderId, { status: '작성중' });
    setSnackbar({
      open: true,
      message: '주문이 작성중 상태로 되돌려졌습니다.',
      severity: 'info',
    });
  };

  // 발주완료목록 클릭 핸들러
  const handleCompletedOrderClick = (group: Order[]) => {
    setSelectedCompletedGroup(group);
    setCompletedOrderDetailModalOpen(true);
  };

  // 기간별 발주완료목록 필터링 함수들
  const getTodayCompletedOrders = () => {
    const today = new Date().toISOString().split('T')[0];
    return Object.values(completedOrderGroups).filter(group =>
      group.some(order => order.orderDate === today)
    );
  };

  const getWeekCompletedOrders = () => {
    const today = new Date();
    const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
    return Object.values(completedOrderGroups).filter(group =>
      group.some(order => {
        const orderDate = new Date(order.orderDate);
        return orderDate >= weekAgo && orderDate <= today;
      })
    );
  };

  const getMonthCompletedOrders = () => {
    const today = new Date();
    const monthAgo = new Date(
      today.getFullYear(),
      today.getMonth() - 1,
      today.getDate()
    );
    return Object.values(completedOrderGroups).filter(group =>
      group.some(order => {
        const orderDate = new Date(order.orderDate);
        return orderDate >= monthAgo && orderDate <= today;
      })
    );
  };

  const getCustomDateRangeCompletedOrders = () => {
    return Object.values(completedOrderGroups).filter(group =>
      group.some(order => {
        const orderDate = new Date(order.orderDate);
        const startDate = new Date(customDateRange.start);
        const endDate = new Date(customDateRange.end);
        return orderDate >= startDate && orderDate <= endDate;
      })
    );
  };

  const handleFilterTypeChange = (
    type: 'today' | 'week' | 'month' | 'custom'
  ) => {
    setCompletedOrderFilterType(type);
    if (type !== 'today') {
      setCompletedOrderFilterModalOpen(true);
    }
  };

  const handlePrintOrder = () => {
    setPrintDialogOpen(true);
  };

  const handleExportToPDF = async () => {
    if (!selectedOrder) return;

    const element = document.getElementById('order-print-content');
    if (!element) return;

    try {
      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#ffffff',
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

      pdf.save(`${selectedOrder.orderNo}_발주서.pdf`);
      setSnackbar({
        open: true,
        message: 'PDF가 다운로드되었습니다.',
        severity: 'success',
      });
    } catch (error) {
      console.error('PDF 생성 오류:', error);
      setSnackbar({
        open: true,
        message: 'PDF 생성 중 오류가 발생했습니다.',
        severity: 'error',
      });
    }
  };

  const handleExportToJPG = async () => {
    if (!selectedOrder) return;

    const element = document.getElementById('order-print-content');
    if (!element) return;

    try {
      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#ffffff',
      });

      const link = document.createElement('a');
      link.download = `${selectedOrder.orderNo}_발주서.jpg`;
      link.href = canvas.toDataURL('image/jpeg', 0.9);
      link.click();

      setSnackbar({
        open: true,
        message: 'JPG가 다운로드되었습니다.',
        severity: 'success',
      });
    } catch (error) {
      console.error('JPG 생성 오류:', error);
      setSnackbar({
        open: true,
        message: 'JPG 생성 중 오류가 발생했습니다.',
        severity: 'error',
      });
    }
  };

  const handleShare = async () => {
    if (!selectedOrder) return;

    try {
      // 먼저 PDF를 생성
      const element = document.getElementById('order-print-content');
      if (!element) return;

      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#ffffff',
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

      const pdfBlob = pdf.output('blob');

      // Web Share API 사용
      if (navigator.share) {
        const file = new File(
          [pdfBlob],
          `${selectedOrder.orderNo}_발주서.pdf`,
          { type: 'application/pdf' }
        );
        await navigator.share({
          title: `${selectedOrder.orderNo} 발주서`,
          text: `${selectedOrder.vendorName} 발주서입니다.`,
          files: [file],
        });
        setSnackbar({
          open: true,
          message: '발주서가 공유되었습니다.',
          severity: 'success',
        });
      } else {
        // Web Share API를 지원하지 않는 경우 다운로드
        const url = URL.createObjectURL(pdfBlob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `${selectedOrder.orderNo}_발주서.pdf`;
        link.click();
        URL.revokeObjectURL(url);
        setSnackbar({
          open: true,
          message: 'Web Share API를 지원하지 않아 다운로드되었습니다.',
          severity: 'info',
        });
      }
    } catch (error) {
      console.error('공유 오류:', error);
      setSnackbar({
        open: true,
        message: '공유 중 오류가 발생했습니다.',
        severity: 'error',
      });
    }
  };

  const handleDeleteOrder = (orderId: string, event: React.MouseEvent) => {
    event.stopPropagation();
    removeOrder(orderId);
    if (selectedOrderId === orderId) {
      setSelectedOrderId('');
    }
  };

  // 그룹 전체 삭제 함수
  const handleDeleteOrderGroup = (
    orderGroupId: string,
    event: React.MouseEvent
  ) => {
    event.stopPropagation();

    // 해당 그룹의 모든 주문 찾기
    const groupOrders = orders.filter(
      order => order.orderGroupId === orderGroupId
    );

    // 확인 다이얼로그 표시
    if (
      window.confirm(
        `이 프로젝트의 모든 발주서 (${groupOrders.length}개)를 삭제하시겠습니까?\n\n삭제된 데이터는 복구할 수 없습니다.`
      )
    ) {
      // 그룹의 모든 주문 삭제
      groupOrders.forEach(order => {
        removeOrder(order.id);
      });

      // 선택된 주문이 삭제된 그룹에 속한다면 선택 해제
      if (
        selectedOrderId &&
        groupOrders.some(order => order.id === selectedOrderId)
      ) {
        setSelectedOrderId('');
      }

      // 아코디언 닫기
      setExpandedGroupKey(false);
    }
  };

  const handleContractClick = (contract: Contract) => {
    if (selectedContract?.id === contract.id) {
      // 같은 계약서를 다시 클릭하면 고객정보 토글
      setShowCustomerInfo(!showCustomerInfo);
    } else {
      // 다른 계약서를 클릭하면 선택하고 고객정보 표시
      setSelectedContract(contract);
      setShowCustomerInfo(true);
    }
  };

  const handleDeleteContract = (
    contractId: number,
    event: React.MouseEvent
  ) => {
    event.stopPropagation();
    if (
      window.confirm(
        '이 계약을 삭제하시겠습니까? 관련된 모든 발주 정보도 함께 삭제됩니다.'
      )
    ) {
      // 1. Remove associated orders
      const ordersToDelete = orders.filter(
        o => o.contractId === contractId.toString()
      );
      ordersToDelete.forEach(o => removeOrder(o.id));

      // 2. Remove the contract
      const updatedContracts = contracts.filter(c => c.id !== contractId);
      setContracts(updatedContracts);
      localStorage.setItem('contracts', JSON.stringify(updatedContracts));

      // 3. If the deleted contract was selected, unselect it
      if (selectedContract?.id === contractId) {
        setSelectedContract(null);
        setShowCustomerInfo(false);
      }
      setSnackbar({
        open: true,
        message: '계약 및 관련 발주가 삭제되었습니다.',
        severity: 'success',
      });
    }
  };

  // 발주서 출력용 컴포넌트
  const OrderPrintContent = React.memo(
    ({
      order,
      format,
      senderInfo,
    }: {
      order: Order;
      format: 'formal' | 'simple';
      senderInfo: { companyName: string; contact: string; address: string };
    }) => {
      if (!order) return null;

      return (
        <Box
          id="order-print-content"
          sx={{
            p: 3,
            backgroundColor: '#ffffff',
            color: '#000000',
            fontFamily: 'Arial, sans-serif',
            maxWidth: '210mm',
            margin: '0 auto',
          }}
        >
          {format === 'formal' ? (
            // 정식발주서양식
            <Box>
              {/* 헤더 섹션 */}
              <Box
                sx={{
                  textAlign: 'center',
                  mb: 4,
                  pb: 3,
                  borderBottom: '3px solid #1976d2',
                  position: 'relative',
                }}
              >
                <Typography
                  variant="h3"
                  sx={{
                    fontWeight: 'bold',
                    mb: 1,
                    color: '#1976d2',
                    fontSize: '2.5rem',
                    letterSpacing: '0.1em',
                  }}
                >
                  발 주 서
                </Typography>
                <Typography
                  variant="h6"
                  sx={{
                    color: '#666',
                    fontWeight: 500,
                    letterSpacing: '0.05em',
                  }}
                >
                  PURCHASE ORDER
                </Typography>
                <Box
                  sx={{
                    position: 'absolute',
                    bottom: -2,
                    left: '50%',
                    transform: 'translateX(-50%)',
                    width: '60px',
                    height: '4px',
                    backgroundColor: '#1976d2',
                    borderRadius: '2px',
                  }}
                />
              </Box>

              {/* 발신/수신 정보 섹션 */}
              <Grid container spacing={3} sx={{ mb: 4 }}>
                <Grid item xs={6}>
                  <Box
                    sx={{
                      border: '2px solid #e3f2fd',
                      borderRadius: 2,
                      p: 3,
                      height: '100%',
                      backgroundColor: '#f8fbff',
                      position: 'relative',
                    }}
                  >
                    <Typography
                      variant="h6"
                      sx={{
                        fontWeight: 'bold',
                        mb: 3,
                        color: '#1976d2',
                        borderBottom: '2px solid #1976d2',
                        pb: 1,
                        display: 'flex',
                        alignItems: 'center',
                      }}
                    >
                      <Box
                        sx={{
                          width: 8,
                          height: 8,
                          backgroundColor: '#1976d2',
                          borderRadius: '50%',
                          mr: 1,
                        }}
                      />
                      발신
                    </Typography>
                    <Box sx={{ pl: 2 }}>
                      <Typography variant="body1" sx={{ mb: 2, color: '#333' }}>
                        <Box
                          component="span"
                          sx={{ fontWeight: 'bold', color: '#1976d2', mr: 1 }}
                        >
                          회사명:
                        </Box>
                        {senderInfo.companyName}
                      </Typography>
                      <Typography variant="body1" sx={{ mb: 2, color: '#333' }}>
                        <Box
                          component="span"
                          sx={{ fontWeight: 'bold', color: '#1976d2', mr: 1 }}
                        >
                          연락처:
                        </Box>
                        {senderInfo.contact}
                      </Typography>
                      <Typography variant="body1" sx={{ color: '#333' }}>
                        <Box
                          component="span"
                          sx={{ fontWeight: 'bold', color: '#1976d2', mr: 1 }}
                        >
                          주소:
                        </Box>
                        {senderInfo.address}
                      </Typography>
                    </Box>
                  </Box>
                </Grid>
                <Grid item xs={6}>
                  <Box
                    sx={{
                      border: '2px solid #e8f5e8',
                      borderRadius: 2,
                      p: 3,
                      height: '100%',
                      backgroundColor: '#f8fff8',
                      position: 'relative',
                    }}
                  >
                    <Typography
                      variant="h6"
                      sx={{
                        fontWeight: 'bold',
                        mb: 3,
                        color: '#2e7d32',
                        borderBottom: '2px solid #2e7d32',
                        pb: 1,
                        display: 'flex',
                        alignItems: 'center',
                      }}
                    >
                      <Box
                        sx={{
                          width: 8,
                          height: 8,
                          backgroundColor: '#2e7d32',
                          borderRadius: '50%',
                          mr: 1,
                        }}
                      />
                      수신
                    </Typography>
                    <Box sx={{ pl: 2 }}>
                      <Typography variant="body1" sx={{ mb: 2, color: '#333' }}>
                        <Box
                          component="span"
                          sx={{ fontWeight: 'bold', color: '#2e7d32', mr: 1 }}
                        >
                          회사명:
                        </Box>
                        {order.vendorName}
                      </Typography>
                      <Typography variant="body1" sx={{ mb: 2, color: '#333' }}>
                        <Box
                          component="span"
                          sx={{ fontWeight: 'bold', color: '#2e7d32', mr: 1 }}
                        >
                          연락처:
                        </Box>
                        {order.vendorContact || '-'}
                      </Typography>
                      <Typography variant="body1" sx={{ color: '#333' }}>
                        <Box
                          component="span"
                          sx={{ fontWeight: 'bold', color: '#2e7d32', mr: 1 }}
                        >
                          주소:
                        </Box>
                        {order.vendorAddress || '-'}
                      </Typography>
                    </Box>
                  </Box>
                </Grid>
              </Grid>

              {/* 발주 정보 섹션 */}
              <Box
                sx={{
                  mb: 4,
                  p: 3,
                  backgroundColor: '#f5f5f5',
                  borderRadius: 2,
                  border: '1px solid #e0e0e0',
                }}
              >
                <Typography
                  variant="h6"
                  sx={{
                    fontWeight: 'bold',
                    mb: 3,
                    color: '#333',
                    borderBottom: '1px solid #ddd',
                    pb: 1,
                  }}
                >
                  발주 정보
                </Typography>
                <Grid container spacing={3}>
                  <Grid item xs={3}>
                    <Box sx={{ textAlign: 'center' }}>
                      <Typography
                        variant="body2"
                        sx={{ color: '#666', mb: 0.5 }}
                      >
                        발주번호
                      </Typography>
                      <Typography
                        variant="body1"
                        sx={{ fontWeight: 'bold', color: '#1976d2' }}
                      >
                        {order.orderNo}
                      </Typography>
                    </Box>
                  </Grid>
                  <Grid item xs={3}>
                    <Box sx={{ textAlign: 'center' }}>
                      <Typography
                        variant="body2"
                        sx={{ color: '#666', mb: 0.5 }}
                      >
                        발주일
                      </Typography>
                      <Typography
                        variant="body1"
                        sx={{ fontWeight: 'bold', color: '#333' }}
                      >
                        {order.orderDate}
                      </Typography>
                    </Box>
                  </Grid>
                  <Grid item xs={3}>
                    <Box sx={{ textAlign: 'center' }}>
                      <Typography
                        variant="body2"
                        sx={{ color: '#666', mb: 0.5 }}
                      >
                        납품일
                      </Typography>
                      <Typography
                        variant="body1"
                        sx={{ fontWeight: 'bold', color: '#333' }}
                      >
                        {order.deliveryDate || '-'}
                      </Typography>
                    </Box>
                  </Grid>
                  <Grid item xs={3}>
                    <Box sx={{ textAlign: 'center' }}>
                      <Typography
                        variant="body2"
                        sx={{ color: '#666', mb: 0.5 }}
                      >
                        납품방법
                      </Typography>
                      <Typography
                        variant="body1"
                        sx={{ fontWeight: 'bold', color: '#333' }}
                      >
                        {order.deliveryMethod || '-'}
                      </Typography>
                    </Box>
                  </Grid>
                </Grid>
              </Box>

              {/* 제품내역 섹션 */}
              <Box sx={{ mb: 3 }}>
                <Typography
                  variant="h6"
                  sx={{
                    fontWeight: 'bold',
                    mb: 2,
                    color: '#333',
                    borderBottom: '2px solid #1976d2',
                    pb: 1,
                    display: 'flex',
                    alignItems: 'center',
                  }}
                >
                  <Box
                    sx={{
                      width: 12,
                      height: 12,
                      backgroundColor: '#1976d2',
                      borderRadius: '50%',
                      mr: 1.5,
                    }}
                  />
                  제품내역
                </Typography>
              </Box>

              <TableContainer
                sx={{
                  border: '2px solid #e3f2fd',
                  borderRadius: 2,
                  overflow: 'hidden',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                }}
              >
                <Table>
                  <TableHead>
                    <TableRow sx={{ backgroundColor: '#1976d2' }}>
                      <TableCell
                        sx={{
                          backgroundColor: '#1976d2', // 추가: 같은 행 배경색
                          border: '1px solid #1565c0',
                          fontWeight: 'bold',
                          textAlign: 'center',
                          color: '#fff',
                          fontSize: '0.875rem',
                          py: 1.5,
                        }}
                      >
                        순번
                      </TableCell>
                      <TableCell
                        sx={{
                          backgroundColor: '#1976d2', // 추가: 같은 행 배경색
                          border: '1px solid #1565c0',
                          fontWeight: 'bold',
                          textAlign: 'center',
                          color: '#fff',
                          fontSize: '0.875rem',
                          py: 1.5,
                        }}
                      >
                        공간
                      </TableCell>
                      <TableCell
                        sx={{
                          backgroundColor: '#1976d2', // 추가: 같은 행 배경색
                          border: '1px solid #1565c0',
                          fontWeight: 'bold',
                          textAlign: 'center',
                          color: '#fff',
                          fontSize: '0.875rem',
                          py: 1.5,
                        }}
                      >
                        제품코드
                      </TableCell>
                      <TableCell
                        sx={{
                          backgroundColor: '#1976d2', // 추가: 같은 행 배경색
                          border: '1px solid #1565c0',
                          fontWeight: 'bold',
                          textAlign: 'center',
                          color: '#fff',
                          fontSize: '0.875rem',
                          py: 1.5,
                        }}
                      >
                        제품명
                      </TableCell>
                      <TableCell
                        sx={{
                          backgroundColor: '#1976d2', // 추가: 같은 행 배경색
                          border: '1px solid #1565c0',
                          fontWeight: 'bold',
                          textAlign: 'center',
                          color: '#fff',
                          fontSize: '0.875rem',
                          py: 1.5,
                        }}
                      >
                        주름방식
                      </TableCell>
                      <TableCell
                        sx={{
                          backgroundColor: '#1976d2', // 추가: 같은 행 배경색
                          border: '1px solid #1565c0',
                          fontWeight: 'bold',
                          textAlign: 'center',
                          color: '#fff',
                          fontSize: '0.875rem',
                          py: 1.5,
                        }}
                      >
                        제작사이즈
                      </TableCell>
                      <TableCell
                        sx={{
                          backgroundColor: '#1976d2', // 추가: 같은 행 배경색
                          border: '1px solid #1565c0',
                          fontWeight: 'bold',
                          textAlign: 'center',
                          color: '#fff',
                          fontSize: '0.875rem',
                          py: 1.5,
                        }}
                      >
                        m²
                      </TableCell>
                      <TableCell
                        sx={{
                          backgroundColor: '#1976d2', // 추가: 같은 행 배경색
                          border: '1px solid #1565c0',
                          fontWeight: 'bold',
                          textAlign: 'center',
                          color: '#fff',
                          fontSize: '0.875rem',
                          py: 1.5,
                        }}
                      >
                        줄방향
                      </TableCell>
                      <TableCell
                        sx={{
                          backgroundColor: '#1976d2', // 추가: 같은 행 배경색
                          border: '1px solid #1565c0',
                          fontWeight: 'bold',
                          textAlign: 'center',
                          color: '#fff',
                          fontSize: '0.875rem',
                          py: 1.5,
                        }}
                      >
                        줄길이
                      </TableCell>
                      <TableCell
                        sx={{
                          backgroundColor: '#1976d2', // 추가: 같은 행 배경색
                          border: '1px solid #1565c0',
                          fontWeight: 'bold',
                          textAlign: 'center',
                          color: '#fff',
                          fontSize: '0.875rem',
                          py: 1.5,
                        }}
                      >
                        폭수
                      </TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {order.items.map((item, index) => (
                      <React.Fragment key={item.id}>
                        <TableRow
                          sx={{
                            backgroundColor:
                              index % 2 === 0 ? '#fafafa' : '#fff',
                            '&:hover': { backgroundColor: '#f0f8ff' },
                          }}
                        >
                          <TableCell
                            sx={{
                              border: '1px solid #e0e0e0',
                              textAlign: 'center',
                              color: '#333',
                              fontWeight: 'bold',
                              py: 1.5,
                            }}
                          >
                            {index + 1}
                          </TableCell>
                          <TableCell
                            sx={{
                              border: '1px solid #e0e0e0',
                              color: '#333',
                              py: 1.5,
                            }}
                          >
                            {item.space || '-'}
                          </TableCell>
                          <TableCell
                            sx={{
                              border: '1px solid #e0e0e0',
                              color: '#333',
                              py: 1.5,
                            }}
                          >
                            {item.productCode || '-'}
                          </TableCell>
                          <TableCell
                            sx={{
                              border: '1px solid #e0e0e0',
                              color: '#333',
                              fontWeight: 500,
                              py: 1.5,
                            }}
                          >
                            {item.productName}
                          </TableCell>
                          <TableCell
                            sx={{
                              border: '1px solid #e0e0e0',
                              color: '#333',
                              py: 1.5,
                            }}
                          >
                            {item.pleatType || '-'}
                          </TableCell>
                          <TableCell
                            sx={{
                              border: '1px solid #e0e0e0',
                              textAlign: 'center',
                              color: '#333',
                              fontWeight: 500,
                              py: 1.5,
                            }}
                          >
                            {item.productionWidth && item.productionHeight
                              ? `${item.productionWidth} x ${item.productionHeight}`
                              : '-'}
                          </TableCell>
                          <TableCell
                            sx={{
                              border: '1px solid #e0e0e0',
                              textAlign: 'center',
                              color: '#333',
                              fontWeight: 500,
                              py: 1.5,
                            }}
                          >
                            {item.area ? item.area.toFixed(2) : '-'}
                          </TableCell>
                          <TableCell
                            sx={{
                              border: '1px solid #e0e0e0',
                              textAlign: 'center',
                              color: '#333',
                              py: 1.5,
                            }}
                          >
                            {item.lineDir || '-'}
                          </TableCell>
                          <TableCell
                            sx={{
                              border: '1px solid #e0e0e0',
                              textAlign: 'center',
                              color: '#333',
                              py: 1.5,
                            }}
                          >
                            {item.lineLen || '-'}
                          </TableCell>
                          <TableCell
                            sx={{
                              border: '1px solid #e0e0e0',
                              textAlign: 'center',
                              color: '#333',
                              py: 1.5,
                            }}
                          >
                            {item.widthCount || '-'}
                          </TableCell>
                        </TableRow>
                        {item.showRequestNote && item.requestNote && (
                          <TableRow
                            sx={{
                              backgroundColor:
                                index % 2 === 0 ? '#f5f5f5' : '#e3f2fd',
                            }}
                          >
                            <TableCell
                              sx={{
                                border: '1px solid #e0e0e0',
                                textAlign: 'center',
                              }}
                            >
                              -
                            </TableCell>
                            <TableCell
                              colSpan={10}
                              sx={{ border: '1px solid #e0e0e0' }}
                            >
                              <Typography
                                variant="body2"
                                sx={{ fontWeight: 'bold', color: '#0D47A1' }}
                              >
                                [요청사항] {item.requestNote}
                              </Typography>
                            </TableCell>
                          </TableRow>
                        )}
                      </React.Fragment>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>

              {/* 요청사항 섹션 */}
              <Box
                sx={{
                  mt: 4,
                  p: 3,
                  border: '2px solid #e3f2fd',
                  borderRadius: 2,
                  backgroundColor: '#f8fbff',
                }}
              >
                <Typography
                  variant="h6"
                  sx={{
                    fontWeight: 'bold',
                    mb: 2,
                    color: '#1976d2',
                    display: 'flex',
                    alignItems: 'center',
                  }}
                >
                  <Box
                    sx={{
                      width: 8,
                      height: 8,
                      backgroundColor: '#1976d2',
                      borderRadius: '50%',
                      mr: 1,
                    }}
                  />
                  요청사항
                </Typography>
                <Typography
                  variant="body1"
                  sx={{
                    minHeight: '80px',
                    whiteSpace: 'pre-wrap',
                    color: '#0D47A1',
                    lineHeight: 1.6,
                    p: 2,
                    backgroundColor: '#fff',
                    borderRadius: 1,
                    border: '1px solid #e0e0e0',
                  }}
                >
                  {order.note || '요청사항이 없습니다.'}
                </Typography>
              </Box>
            </Box>
          ) : (
            // 간단발주서양식
            <Box>
              <Box
                sx={{
                  textAlign: 'center',
                  mb: 3,
                  borderBottom: '1px solid #000',
                  pb: 1,
                }}
              >
                <Typography
                  variant="h5"
                  sx={{ fontWeight: 'bold', color: '#000' }}
                >
                  발주서({order.vendorName})
                </Typography>
              </Box>

              <Box sx={{ mb: 2 }}>
                <Typography variant="body1" sx={{ mb: 1, color: '#000' }}>
                  <strong>발주번호:</strong> {order.orderNo}
                </Typography>
                <Typography variant="body1" sx={{ mb: 1, color: '#000' }}>
                  <strong>발주일:</strong> {order.orderDate}
                </Typography>
                <Typography variant="body1" sx={{ mb: 1, color: '#000' }}>
                  <strong>납품일:</strong> {order.deliveryDate || '-'}
                </Typography>
                <Typography variant="body1" sx={{ mb: 1, color: '#000' }}>
                  <strong>납품방법:</strong> {order.deliveryMethod || '-'}
                </Typography>
                <Typography variant="body1" sx={{ mb: 1, color: '#000' }}>
                  <strong>납품처:</strong> {order.deliveryAddress}
                </Typography>
                <Typography variant="body1" sx={{ mb: 1, color: '#000' }}>
                  <strong>연락처:</strong> {order.contactPhone || '-'}
                </Typography>
              </Box>

              <TableContainer sx={{ border: '1px solid #000' }}>
                <Table size="small">
                  <TableHead>
                    <TableRow sx={{ backgroundColor: '#f5f5f5' }}>
                      <TableCell
                        sx={{
                          border: '1px solid #000',
                          fontWeight: 'bold',
                          textAlign: 'center',
                          color: '#000',
                        }}
                      >
                        순번
                      </TableCell>
                      <TableCell
                        sx={{
                          border: '1px solid #000',
                          fontWeight: 'bold',
                          textAlign: 'center',
                          color: '#000',
                        }}
                      >
                        공간
                      </TableCell>
                      <TableCell
                        sx={{
                          border: '1px solid #000',
                          fontWeight: 'bold',
                          textAlign: 'center',
                          color: '#000',
                        }}
                      >
                        제품코드
                      </TableCell>
                      <TableCell
                        sx={{
                          border: '1px solid #000',
                          fontWeight: 'bold',
                          textAlign: 'center',
                          color: '#000',
                        }}
                      >
                        주름방식
                      </TableCell>
                      <TableCell
                        sx={{
                          border: '1px solid #000',
                          fontWeight: 'bold',
                          textAlign: 'center',
                          color: '#000',
                        }}
                      >
                        폭수
                      </TableCell>
                      <TableCell
                        sx={{
                          border: '1px solid #000',
                          fontWeight: 'bold',
                          textAlign: 'center',
                          color: '#000',
                        }}
                      >
                        제작사이즈
                      </TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {order.items.map((item, index) => (
                      <React.Fragment key={item.id}>
                        <TableRow>
                          <TableCell
                            sx={{
                              border: '1px solid #000',
                              textAlign: 'center',
                              color: '#000',
                            }}
                          >
                            {index + 1}
                          </TableCell>
                          <TableCell
                            sx={{ border: '1px solid #000', color: '#000' }}
                          >
                            {item.space || '-'}
                          </TableCell>
                          <TableCell
                            sx={{ border: '1px solid #000', color: '#000' }}
                          >
                            {item.productCode || '-'}
                          </TableCell>
                          <TableCell
                            sx={{ border: '1px solid #000', color: '#000' }}
                          >
                            {item.pleatType || '-'}
                          </TableCell>
                          <TableCell
                            sx={{
                              border: '1px solid #000',
                              textAlign: 'center',
                              color: '#000',
                            }}
                          >
                            {item.widthCount || '-'}
                          </TableCell>
                          <TableCell
                            sx={{
                              border: '1px solid #000',
                              textAlign: 'center',
                              color: '#000',
                            }}
                          >
                            {item.productionWidth && item.productionHeight
                              ? `${item.productionWidth} x ${item.productionHeight}`
                              : '-'}
                          </TableCell>
                        </TableRow>
                        {item.showRequestNote && item.requestNote && (
                          <TableRow>
                            <TableCell
                              sx={{
                                border: '1px solid #000',
                                textAlign: 'center',
                                color: '#000',
                              }}
                            >
                              -
                            </TableCell>
                            <TableCell
                              colSpan={5}
                              sx={{ border: '1px solid #000', color: '#000' }}
                            >
                              <Typography
                                variant="body2"
                                sx={{ fontWeight: 'bold', color: '#0D47A1' }}
                              >
                                [요청사항] {item.requestNote}
                              </Typography>
                            </TableCell>
                          </TableRow>
                        )}
                      </React.Fragment>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>

              <Box sx={{ mt: 2, p: 1, border: '1px solid #000' }}>
                <Typography
                  variant="body2"
                  sx={{ fontWeight: 'bold', mb: 1, color: '#000' }}
                >
                  요청사항:
                </Typography>
                <Typography
                  variant="body2"
                  sx={{
                    minHeight: '40px',
                    whiteSpace: 'pre-wrap',
                    color: '#0D47A1',
                  }}
                >
                  {order.note || '요청사항이 없습니다.'}
                </Typography>
              </Box>
            </Box>
          )}
        </Box>
      );
    }
  );

  return (
    <Box sx={{ height: '100vh', display: 'flex', flexDirection: 'column' }}>
      <Box
        sx={{
          p: 2,
          borderBottom: 1,
          borderColor: 'var(--border-color)',
          backgroundColor: 'var(--background-color)',
          color: 'var(--text-color)',
        }}
      >
        <Box display="flex" justifyContent="space-between" alignItems="center">
          <Typography variant="h4" sx={{ color: 'var(--text-color)' }}>주문관리</Typography>
          <Button
            variant="contained"
            color="primary"
            startIcon={<SplitIcon />}
            onClick={handleSplitVendors}
            disabled={!selectedContract}
          >
            발주처 분리
          </Button>
        </Box>
      </Box>

      <Box
        sx={{ flex: 1, display: 'flex', overflow: 'hidden' }}
        id="order-management-container"
      >
        <Box
          sx={{
            width: `${contractPanelWidth}%`,
            p: 2,
            overflowY: 'auto',
            borderRight: 1,
            borderColor: 'var(--border-color)',
            backgroundColor: 'var(--background-color)',
            color: 'var(--text-color)',
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          <Box sx={{ flex: 0.4, overflowY: 'auto' }}>
            <Typography variant="h6" gutterBottom sx={{ color: 'var(--text-color)' }}>
              계약서 목록 (주문전)
            </Typography>
            <List>
              {contracts
                .filter(
                  c =>
                    !Object.values(completedOrderGroups)
                      .flat()
                      .some((o: Order) => o.contractId === c.id.toString())
                )
                .map(contract => (
                  <Box key={contract.id} sx={{ position: 'relative' }}>
                    <ListItemButton
                      selected={selectedContract?.id === contract.id}
                      onClick={() => handleContractClick(contract)}
                      sx={{
                        mb: 1,
                        borderRadius: 1,
                        '&.Mui-selected': { backgroundColor: 'var(--hover-color)' },
                        pr: 4,
                      }}
                    >
                      <ListItemText
                        primary={
                          <Box display="flex" alignItems="center">
                            <Box
                              component="span"
                              sx={{ 
                                fontWeight: 'bold', 
                                fontSize: '0.875rem',
                                color: 'var(--text-color)'
                              }}
                            >
                              {extractBestAddress(contract.address)}
                            </Box>
                            <Chip
                              label={getContractStatusText(contract.status)}
                              size="small"
                              sx={{
                                ml: 1,
                                backgroundColor: getContractStatusColor(
                                  contract.status
                                ),
                                color: '#fff',
                              }}
                            />
                          </Box>
                        }
                        secondary={`${contract.customerName} | 할인후금액: ${(contract.discountedAmount || 0).toLocaleString()}원 | 시공일자: ${contract.constructionDate ? new Date(contract.constructionDate).toLocaleDateString() : '미정'}`}
                        secondaryTypographyProps={{
                          sx: { color: 'var(--secondary-text-color)', fontSize: '0.75rem' },
                        }}
                      />
                    </ListItemButton>
                    <IconButton
                      size="small"
                      onClick={e => handleDeleteContract(contract.id, e)}
                      sx={{
                        position: 'absolute',
                        top: '50%',
                        right: 8,
                        transform: 'translateY(-50%)',
                        color: 'rgba(255, 255, 255, 0.3)',
                        '&:hover': {
                          color: '#f44336',
                          backgroundColor: 'rgba(244, 67, 54, 0.1)',
                        },
                      }}
                    >
                      <DeleteIcon fontSize="small" />
                    </IconButton>
                  </Box>
                ))}
            </List>
          </Box>
          <Divider sx={{ my: 2, borderColor: 'var(--border-color)' }} />
          <Box sx={{ flex: 0.6, overflowY: 'auto' }}>
            <Box sx={{ mb: 2 }}>
              <Typography variant="h6" gutterBottom sx={{ color: 'var(--text-color)' }}>
                발주완료목록
              </Typography>
              <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
                <Button
                  size="small"
                  variant={
                    completedOrderFilterType === 'today'
                      ? 'contained'
                      : 'outlined'
                  }
                  onClick={() => handleFilterTypeChange('today')}
                  sx={{
                    fontSize: '0.75rem',
                    backgroundColor:
                      completedOrderFilterType === 'today'
                        ? 'var(--primary-color)'
                        : 'transparent',
                    color:
                      completedOrderFilterType === 'today' ? '#fff' : 'var(--primary-color)',
                    borderColor: 'var(--primary-color)',
                    '&:hover': {
                      backgroundColor:
                        completedOrderFilterType === 'today'
                          ? 'var(--primary-color)'
                          : 'var(--hover-color)',
                    },
                  }}
                >
                  오늘
                </Button>
                <Button
                  size="small"
                  variant="outlined"
                  onClick={() => handleFilterTypeChange('week')}
                  sx={{
                    fontSize: '0.75rem',
                    color: 'var(--primary-color)',
                    borderColor: 'var(--primary-color)',
                    '&:hover': {
                      backgroundColor: 'var(--hover-color)',
                    },
                  }}
                >
                  주간
                </Button>
                <Button
                  size="small"
                  variant="outlined"
                  onClick={() => handleFilterTypeChange('month')}
                  sx={{
                    fontSize: '0.75rem',
                    color: 'var(--primary-color)',
                    borderColor: 'var(--primary-color)',
                    '&:hover': {
                      backgroundColor: 'var(--hover-color)',
                    },
                  }}
                >
                  월간
                </Button>
                <Button
                  size="small"
                  variant="outlined"
                  onClick={() => handleFilterTypeChange('custom')}
                  sx={{
                    fontSize: '0.75rem',
                    color: 'var(--primary-color)',
                    borderColor: 'var(--primary-color)',
                    '&:hover': {
                      backgroundColor: 'var(--hover-color)',
                    },
                  }}
                >
                  기간설정
                </Button>
              </Box>
            </Box>
            <List>
              {getTodayCompletedOrders().map((group: Order[]) => {
                // 해당 발주의 계약 정보를 찾아서 고객 주소 가져오기
                const relatedContract = contracts.find(
                  c => c.id.toString() === group[0].contractId
                );
                const customerAddress =
                  relatedContract?.address || group[0].deliveryAddress;

                return (
                  <ListItem
                    key={group[0].orderGroupId}
                    sx={{
                      mb: 1,
                      borderRadius: 1,
                      backgroundColor: 'var(--background-color)',
                      cursor: 'pointer',
                      '&:hover': {
                        backgroundColor: 'var(--hover-color)',
                        transform: 'translateY(-1px)',
                        boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
                      },
                      transition: 'all 0.2s ease',
                    }}
                    onClick={() => handleCompletedOrderClick(group)}
                  >
                    <ListItemText
                      primary={customerAddress}
                      secondary={`[${group[0].orderDate}] ${group.length}개 거래처 완료`}
                      primaryTypographyProps={{ 
                        style: { 
                          fontWeight: 'bold',
                          color: 'var(--text-color)'
                        } 
                      }}
                      secondaryTypographyProps={{
                        sx: { color: 'var(--secondary-text-color)' }
                      }}
                    />
                    <Button
                      size="small"
                      variant="outlined"
                      onClick={e => {
                        e.stopPropagation();
                        group.forEach(order => handleReopenOrder(order.id));
                      }}
                      sx={{
                        ml: 1,
                        color: '#ff6b6b',
                        borderColor: '#ff6b6b',
                        '&:hover': {
                          borderColor: '#ff6b6b',
                          backgroundColor: 'rgba(255, 107, 107, 0.1)',
                        },
                      }}
                    >
                      되돌리기
                    </Button>
                  </ListItem>
                );
              })}
            </List>
          </Box>
        </Box>

        <Box
          onMouseDown={handleMouseDown}
          sx={{
            width: '5px',
            cursor: 'col-resize',
            bgcolor: isResizing ? 'var(--primary-color)' : 'var(--border-color)',
            '&:hover': { bgcolor: 'var(--primary-color)' },
          }}
        />

        <Box
          sx={{
            width: `${100 - contractPanelWidth}%`,
            backgroundColor: 'var(--background-color)',
            p: 2,
            overflowY: 'auto',
            color: 'var(--text-color)',
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          {selectedContract && showCustomerInfo && (
                          <Box
                sx={{
                  mb: 2,
                  p: 1.5,
                  bgcolor: 'var(--surface-color)',
                  borderRadius: 1,
                  border: '1px solid var(--primary-color)',
                  boxShadow: '0 2px 8px rgba(64, 196, 255, 0.1)',
                }}
              >
                              <Box
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    mb: 1.5,
                    pb: 1,
                    borderBottom: '1px solid var(--primary-color)',
                  }}
                >
                <Box
                  component="span"
                  sx={{
                    color: 'var(--primary-color)',
                    fontWeight: 'bold',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 0.5,
                    fontSize: '0.9rem',
                  }}
                >
                  <Box
                    component="span"
                    sx={{
                      width: 4,
                      height: 4,
                      borderRadius: '50%',
                      bgcolor: '#40c4ff',
                      display: 'inline-block',
                    }}
                  />
                  고객정보
                </Box>
              </Box>

              <Grid container spacing={1}>
                <Grid item xs={6} sm={3} md={2}>
                  <Box
                    sx={{
                      p: 1,
                      bgcolor: 'var(--surface-color)',
                      borderRadius: 0.5,
                      border: '1px solid var(--border-color)',
                    }}
                  >
                    <Typography
                      variant="caption"
                      sx={{
                        color: 'var(--secondary-text-color)',
                        mb: 0.5,
                        fontSize: '0.7rem',
                        fontWeight: 500,
                        display: 'block',
                      }}
                    >
                      발주번호
                    </Typography>
                    <Typography
                      variant="body2"
                      sx={{
                        fontWeight: 'bold',
                        color: 'var(--primary-color)',
                        fontSize: '0.8rem',
                      }}
                    >
                      {selectedContract.contractNo}
                    </Typography>
                  </Box>
                </Grid>

                <Grid item xs={6} sm={3} md={2}>
                  <Box
                    sx={{
                      p: 1,
                      bgcolor: 'var(--surface-color)',
                      borderRadius: 0.5,
                      border: '1px solid var(--border-color)',
                    }}
                  >
                    <Typography
                      variant="caption"
                      sx={{
                        color: 'var(--secondary-text-color)',
                        mb: 0.5,
                        fontSize: '0.7rem',
                        fontWeight: 500,
                        display: 'block',
                      }}
                    >
                      고객명
                    </Typography>
                    <Typography
                      variant="body2"
                      sx={{
                        fontWeight: 'bold',
                        color: 'var(--text-color)',
                        fontSize: '0.8rem',
                      }}
                    >
                      {selectedContract.customerName}
                    </Typography>
                  </Box>
                </Grid>

                <Grid item xs={6} sm={3} md={2}>
                  <Box
                    sx={{
                      p: 1,
                      bgcolor: 'var(--surface-color)',
                      borderRadius: 0.5,
                      border: '1px solid var(--border-color)',
                    }}
                  >
                    <Typography
                      variant="caption"
                      sx={{
                        color: 'var(--secondary-text-color)',
                        mb: 0.5,
                        fontSize: '0.7rem',
                        fontWeight: 500,
                        display: 'block',
                      }}
                    >
                      연락처
                    </Typography>
                    <Typography
                      variant="body2"
                      sx={{
                        color: 'var(--text-color)',
                        fontWeight: 500,
                        fontSize: '0.8rem',
                      }}
                    >
                      {selectedContract.contact}
                    </Typography>
                  </Box>
                </Grid>

                <Grid item xs={6} sm={3} md={2}>
                  <Box
                    sx={{
                      p: 1,
                      bgcolor: 'var(--surface-color)',
                      borderRadius: 0.5,
                      border: '1px solid var(--border-color)',
                    }}
                  >
                    <Typography
                      variant="caption"
                      sx={{
                        color: 'var(--secondary-text-color)',
                        mb: 0.5,
                        fontSize: '0.7rem',
                        fontWeight: 500,
                        display: 'block',
                      }}
                    >
                      비상연락처
                    </Typography>
                    <Typography
                      variant="body2"
                      sx={{
                        color: selectedContract.emergencyContact
                          ? 'var(--text-color)'
                          : 'var(--secondary-text-color)',
                        fontWeight: 500,
                        fontSize: '0.8rem',
                      }}
                    >
                      {selectedContract.emergencyContact || '-'}
                    </Typography>
                  </Box>
                </Grid>

                <Grid item xs={6} sm={3} md={2}>
                  <Box
                    sx={{
                      p: 1,
                      bgcolor: 'var(--surface-color)',
                      borderRadius: 0.5,
                      border: '1px solid var(--border-color)',
                    }}
                  >
                    <Typography
                      variant="caption"
                      sx={{
                        color: 'var(--secondary-text-color)',
                        mb: 0.5,
                        fontSize: '0.7rem',
                        fontWeight: 500,
                        display: 'block',
                      }}
                    >
                      프로젝트명
                    </Typography>
                    <Typography
                      variant="body2"
                      sx={{
                        fontWeight: 'bold',
                        color: 'var(--text-color)',
                        fontSize: '0.8rem',
                      }}
                    >
                      {selectedContract.projectName}
                    </Typography>
                  </Box>
                </Grid>

                <Grid item xs={6} sm={3} md={2}>
                  <Box
                    sx={{
                      p: 1,
                      bgcolor: 'var(--surface-color)',
                      borderRadius: 0.5,
                      border: '1px solid var(--border-color)',
                    }}
                  >
                    <Typography
                      variant="caption"
                      sx={{
                        color: 'var(--secondary-text-color)',
                        mb: 0.5,
                        fontSize: '0.7rem',
                        fontWeight: 500,
                        display: 'block',
                      }}
                    >
                      타입
                    </Typography>
                    <Typography
                      variant="body2"
                      sx={{
                        color: selectedContract.type ? 'var(--text-color)' : 'var(--secondary-text-color)',
                        fontWeight: 500,
                        fontSize: '0.8rem',
                      }}
                    >
                      {selectedContract.type || '-'}
                    </Typography>
                  </Box>
                </Grid>

                <Grid item xs={12}>
                  <Box
                    sx={{
                      p: 1,
                      bgcolor: 'var(--surface-color)',
                      borderRadius: 0.5,
                      border: '1px solid var(--border-color)',
                    }}
                  >
                    <Typography
                      variant="caption"
                      sx={{
                        color: 'var(--secondary-text-color)',
                        mb: 0.5,
                        fontSize: '0.7rem',
                        fontWeight: 500,
                        display: 'block',
                      }}
                    >
                      주소
                    </Typography>
                    <Typography
                      variant="body2"
                      sx={{
                        color: 'var(--text-color)',
                        fontWeight: 500,
                        lineHeight: 1.3,
                        fontSize: '0.8rem',
                      }}
                    >
                      {selectedContract.address}
                    </Typography>
                  </Box>
                </Grid>
              </Grid>
            </Box>
          )}

          <Box sx={{ flex: 1, overflowY: 'auto' }}>
            {Object.keys(filteredOngoingGroups).length > 0 ? (
              Object.entries(filteredOngoingGroups).map(([key, group]) => (
                <Accordion
                  key={key}
                  expanded={expandedGroupKey === key}
                  onChange={(e, isExpanded) =>
                    setExpandedGroupKey(isExpanded ? key : false)
                  }
                  sx={{
                    backgroundColor: 'var(--surface-color)',
                    color: 'var(--text-color)',
                    '&:before': { display: 'none' },
                    mb: 1,
                  }}
                >
                  <AccordionSummary
                    expandIcon={<ExpandMoreIcon />}
                    sx={{
                      '& .MuiAccordionSummary-content': {
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        width: '100%',
                      },
                    }}
                  >
                    <Typography sx={{ fontWeight: 'bold', color: 'var(--text-color)' }}>
                      {selectedContract
                        ? selectedContract.address
                        : (group as Order[])[0].deliveryAddress}
                      <Box
                        component="span"
                        sx={{ color: 'var(--secondary-text-color)', fontSize: '0.875rem' }}
                      >
                        ({(group as Order[])[0].orderDate})
                      </Box>
                    </Typography>
                    <Button
                      size="small"
                      color="error"
                      onClick={e => handleDeleteOrderGroup(key, e)}
                      sx={{
                        minWidth: 'auto',
                        width: 32,
                        height: 32,
                        p: 0,
                        backgroundColor: 'rgba(244, 67, 54, 0.1)',
                        '&:hover': {
                          backgroundColor: 'rgba(244, 67, 54, 0.2)',
                        },
                        mr: 1,
                      }}
                      title="전체 삭제"
                    >
                      <DeleteIcon sx={{ fontSize: 18 }} />
                    </Button>
                  </AccordionSummary>
                  <AccordionDetails>
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1.5 }}>
                      {(group as Order[]).map(order => (
                        <Box
                          key={order.id}
                          sx={{
                            position: 'relative',
                            display: 'inline-block',
                          }}
                        >
                          <Button
                            variant={
                              selectedOrderId === order.id
                                ? 'contained'
                                : 'outlined'
                            }
                            color={getStatusColor(order.status)}
                            onClick={() => setSelectedOrderId(order.id)}
                            sx={{
                              p: '8px 12px',
                              textAlign: 'left',
                              lineHeight: 1.4,
                              minWidth: 130,
                              textTransform: 'none',
                              justifyContent: 'flex-start',
                              pr: 4, // 삭제 버튼을 위한 여백
                            }}
                          >
                            <Box>
                              <Typography
                                variant="body1"
                                sx={{ fontWeight: 'bold', color: 'var(--text-color)' }}
                              >
                                {order.vendorName}
                              </Typography>
                              <Typography
                                variant="caption"
                                sx={{ display: 'block', color: 'var(--secondary-text-color)' }}
                              >
                                {order.orderNo}
                              </Typography>
                            </Box>
                          </Button>
                          <Button
                            size="small"
                            color="error"
                            onClick={e => handleDeleteOrder(order.id, e)}
                            sx={{
                              position: 'absolute',
                              top: 2,
                              right: 2,
                              minWidth: 'auto',
                              width: 24,
                              height: 24,
                              p: 0,
                              backgroundColor: 'rgba(244, 67, 54, 0.1)',
                              '&:hover': {
                                backgroundColor: 'rgba(244, 67, 54, 0.2)',
                              },
                            }}
                          >
                            <DeleteIcon sx={{ fontSize: 16 }} />
                          </Button>
                        </Box>
                      ))}
                    </Box>
                  </AccordionDetails>
                </Accordion>
              ))
            ) : (
              <Box
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  height: '100%',
                }}
              >
                <Typography variant="h5" sx={{ color: 'var(--secondary-text-color)' }}>
                  진행중인 발주가 없습니다.
                </Typography>
              </Box>
            )}

            {selectedOrder && (
              <Box key={selectedOrder.id}>
                <Paper
                  sx={{
                    p: 2,
                    mt: 2,
                    backgroundColor: 'var(--surface-color)',
                    color: 'var(--text-color)',
                    border: '1px solid var(--primary-color)',
                  }}
                >
                  <Box
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 2,
                      mb: 2,
                      p: 1,
                      borderRadius: 1,
                      bgcolor: 'var(--background-color)',
                    }}
                  >
                    <Typography variant="h6" sx={{ color: 'var(--text-color)' }}>
                      {selectedOrder.orderNo}
                    </Typography>
                    <Typography
                      variant="h6"
                      sx={{ color: 'var(--primary-color)', fontWeight: 'bold' }}
                    >
                      {selectedOrder.vendorName}
                    </Typography>
                    <Typography variant="body2" sx={{ ml: 'auto', color: 'var(--secondary-text-color)' }}>
                      발주일: {selectedOrder.orderDate}
                    </Typography>
                    <FormControl size="small" sx={{ minWidth: 120 }}>
                      <InputLabel sx={{ color: 'var(--text-color)' }}>상태</InputLabel>
                      <Select
                        value={selectedOrder.status}
                        onChange={e => handleUpdateSelectedOrderField('status', e.target.value as OrderStatus)}
                        sx={{ color: 'var(--text-color)' }}
                        MenuProps={{
                          PaperProps: {
                            sx: { color: 'var(--text-color)', backgroundColor: 'var(--surface-color)' }
                          }
                        }}
                      >
                        <MenuItem value="작성중" sx={{ color: 'var(--text-color)' }}>작성중</MenuItem>
                        <MenuItem value="발주완료" sx={{ color: 'var(--text-color)' }}>발주완료</MenuItem>
                        <MenuItem value="입고대기" sx={{ color: 'var(--text-color)' }}>입고대기</MenuItem>
                        <MenuItem value="입고완료" sx={{ color: 'var(--text-color)' }}>입고완료</MenuItem>
                        <MenuItem value="취소" sx={{ color: 'var(--text-color)' }}>취소</MenuItem>
                      </Select>
                    </FormControl>
                    <ButtonGroup>
                      <Button
                        variant="outlined"
                        size="small"
                        onClick={handlePrintOrder}
                        startIcon={<PrintIcon />}
                      >
                        출력
                      </Button>
                      {selectedOrder.status === '입고완료' ? (
                        <Button
                          variant="outlined"
                          size="small"
                          onClick={() => handleReopenOrder(selectedOrder.id)}
                          sx={{ color: '#ff9800', borderColor: '#ff9800' }}
                        >
                          되돌리기
                        </Button>
                      ) : selectedOrder.status === '발주완료' ? (
                        <Button
                          variant="contained"
                          size="small"
                          onClick={handleCompleteOrder}
                          startIcon={<CheckCircleIcon />}
                          color="success"
                        >
                          입고완료
                        </Button>
                      ) : (
                        <Button
                          variant="contained"
                          size="small"
                          onClick={handleMarkAsOrdered}
                          startIcon={<CheckCircleIcon />}
                          color="primary"
                        >
                          발주완료
                        </Button>
                      )}
                    </ButtonGroup>
                  </Box>
                  <TableContainer sx={{ mb: 2, maxHeight: 300 }}>
                    <Table stickyHeader size="small">
                      <TableHead>
                        <TableRow>
                          <TableCell>요청</TableCell>
                          <TableCell>공간</TableCell>
                          <TableCell>제품코드</TableCell>
                          <TableCell>주름방식</TableCell>
                          <TableCell>견적(가로x세로)</TableCell>
                          <TableCell>제작(가로x세로)</TableCell>
                          <TableCell>m²</TableCell>
                          <TableCell>줄방향</TableCell>
                          <TableCell>줄길이</TableCell>
                          <TableCell>폭수</TableCell>
                          <TableCell>매입합계</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {selectedOrder.items.map(item => (
                          <React.Fragment key={item.id}>
                            <TableRow>
                              <TableCell>
                                <Checkbox
                                  checked={!!item.showRequestNote}
                                  onChange={(
                                    e: React.ChangeEvent<HTMLInputElement>
                                  ) =>
                                    handleUpdateItem(item.id, {
                                      showRequestNote: e.target.checked,
                                    })
                                  }
                                  size="small"
                                />
                              </TableCell>
                              <TableCell>
                                <TextField
                                  size="small"
                                  sx={{
                                    width: 140,
                                    '& .MuiInputBase-input': {
                                      fontSize: '0.75rem',
                                    },
                                  }}
                                  defaultValue={item.space || ''}
                                  onBlur={e =>
                                    handleUpdateItem(item.id, {
                                      space: e.target.value,
                                    })
                                  }
                                />
                              </TableCell>
                              <TableCell>
                                <TextField
                                  size="small"
                                  sx={{ width: 120 }}
                                  defaultValue={item.productCode || ''}
                                  onBlur={e =>
                                    handleUpdateItem(item.id, {
                                      productCode: e.target.value,
                                    })
                                  }
                                />
                              </TableCell>
                              <TableCell>
                                <FormControl size="small" sx={{ width: 120 }}>
                                  <Select
                                    value={item.pleatType || ''}
                                    onChange={e =>
                                      handleUpdateItem(item.id, {
                                        pleatType: e.target.value,
                                      })
                                    }
                                    displayEmpty
                                  >
                                    <MenuItem value="">선택</MenuItem>
                                    <MenuItem value="민자">민자</MenuItem>
                                    <MenuItem value="나비">나비</MenuItem>
                                    <MenuItem value="직접입력">
                                      직접입력
                                    </MenuItem>
                                  </Select>
                                </FormControl>
                                {item.pleatType === '직접입력' && (
                                  <TextField
                                    size="small"
                                    sx={{ width: 120, mt: 1 }}
                                    placeholder="주름방식 입력"
                                    defaultValue={item.pleatType || ''}
                                    onBlur={e =>
                                      handleUpdateItem(item.id, {
                                        pleatType: e.target.value,
                                      })
                                    }
                                  />
                                )}
                              </TableCell>
                              <TableCell>
                                <TextField
                                  size="small"
                                  type="number"
                                  sx={{ width: 80, mr: 1 }}
                                  placeholder="가로"
                                  defaultValue={item.estimateWidth || ''}
                                  onBlur={e =>
                                    handleUpdateItem(item.id, {
                                      estimateWidth: Number(e.target.value),
                                    })
                                  }
                                />
                                <TextField
                                  size="small"
                                  type="number"
                                  sx={{ width: 80 }}
                                  placeholder="세로"
                                  defaultValue={item.estimateHeight || ''}
                                  onBlur={e =>
                                    handleUpdateItem(item.id, {
                                      estimateHeight: Number(e.target.value),
                                    })
                                  }
                                />
                              </TableCell>
                              <TableCell>
                                <TextField
                                  size="small"
                                  type="number"
                                  sx={{ width: 80, mr: 1 }}
                                  defaultValue={item.productionWidth || ''}
                                  onBlur={e =>
                                    handleUpdateItem(item.id, {
                                      productionWidth: Number(e.target.value),
                                    })
                                  }
                                />
                                <TextField
                                  size="small"
                                  type="number"
                                  sx={{ width: 80 }}
                                  defaultValue={item.productionHeight || ''}
                                  onBlur={e =>
                                    handleUpdateItem(item.id, {
                                      productionHeight: Number(e.target.value),
                                    })
                                  }
                                />
                              </TableCell>
                              <TableCell>
                                {item.area ? item.area.toFixed(2) : '-'}
                              </TableCell>
                              <TableCell>
                                <FormControl size="small" sx={{ width: 80 }}>
                                  <Select
                                    value={item.lineDir || ''}
                                    onChange={e =>
                                      handleUpdateItem(item.id, {
                                        lineDir: e.target.value,
                                      })
                                    }
                                    displayEmpty
                                  >
                                    <MenuItem value="">선택</MenuItem>
                                    <MenuItem value="좌">좌</MenuItem>
                                    <MenuItem value="우">우</MenuItem>
                                  </Select>
                                </FormControl>
                              </TableCell>
                              <TableCell>
                                <FormControl size="small" sx={{ width: 100 }}>
                                  <Select
                                    value={String(item.lineLen || '')}
                                    onChange={e =>
                                      handleUpdateItem(item.id, {
                                        lineLen: e.target.value,
                                      })
                                    }
                                    displayEmpty
                                  >
                                    <MenuItem value="">선택</MenuItem>
                                    <MenuItem value="90cm">90cm</MenuItem>
                                    <MenuItem value="120cm">120cm</MenuItem>
                                    <MenuItem value="150cm">150cm</MenuItem>
                                    <MenuItem value="180cm">180cm</MenuItem>
                                    <MenuItem value="직접입력">
                                      직접입력
                                    </MenuItem>
                                  </Select>
                                </FormControl>
                                {String(item.lineLen || '') === '직접입력' && (
                                  <TextField
                                    size="small"
                                    sx={{ width: 100, mt: 1 }}
                                    placeholder="길이 입력"
                                    defaultValue={String(item.lineLen || '')}
                                    onBlur={e =>
                                      handleUpdateItem(item.id, {
                                        lineLen: e.target.value,
                                      })
                                    }
                                  />
                                )}
                              </TableCell>
                              <TableCell>
                                <TextField
                                  size="small"
                                  type="number"
                                  sx={{ width: 80 }}
                                  defaultValue={item.widthCount || ''}
                                  onBlur={e =>
                                    handleUpdateItem(item.id, {
                                      widthCount: e.target.value
                                        ? Number(e.target.value)
                                        : undefined,
                                    })
                                  }
                                />
                              </TableCell>
                              <TableCell align="right">
                                {getPurchaseTotal(item).toLocaleString()}
                              </TableCell>
                            </TableRow>
                            {item.showRequestNote && (
                              <TableRow>
                                <TableCell />
                                <TableCell colSpan={10}>
                                  <TextField
                                    fullWidth
                                    size="small"
                                    placeholder="제품별 추가 요청사항"
                                    defaultValue={item.requestNote || ''}
                                    onBlur={e =>
                                      handleUpdateItem(item.id, {
                                        requestNote: e.target.value,
                                      })
                                    }
                                    sx={{
                                      '& .MuiInputBase-input': {
                                        fontSize: '0.75rem',
                                      },
                                    }}
                                  />
                                </TableCell>
                              </TableRow>
                            )}
                          </React.Fragment>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>

                  {/* 요청사항을 거래처별로 하나씩만 표시 */}
                  <Box
                    sx={{ mt: 2, p: 2, bgcolor: 'var(--surface-color)', borderRadius: 1 }}
                  >
                    <Typography
                      variant="h6"
                      gutterBottom
                      sx={{ color: '#40c4ff' }}
                    >
                      요청사항
                    </Typography>
                    <Box
                      sx={{
                        display: 'flex',
                        alignItems: 'flex-start',
                        gap: 2,
                        p: 1,
                        border: '1px solid #2e3a4a',
                        borderRadius: 1,
                      }}
                    >
                      <Typography
                        variant="body2"
                        sx={{
                          minWidth: 120,
                          color: 'var(--secondary-text-color)',
                          fontWeight: 'bold',
                        }}
                      >
                        {selectedOrder.vendorName}
                      </Typography>
                      <TextField
                        fullWidth
                        multiline
                        rows={3}
                        size="small"
                        defaultValue={selectedOrder.note || ''}
                        onBlur={e =>
                          handleUpdateSelectedOrderField('note', e.target.value)
                        }
                        placeholder="거래처별 요청사항을 입력하세요..."
                        sx={{
                          '& .MuiOutlinedInput-root': {
                            backgroundColor: 'var(--surface-color)',
                            '&:hover': {
                              backgroundColor: 'var(--hover-color)',
                            },
                          },
                        }}
                      />
                    </Box>
                  </Box>
                  <Grid container spacing={2} sx={{ mt: 2 }}>
                    <Grid item xs={3}>
                      <FormControl fullWidth size="small">
                        <InputLabel sx={{ color: 'var(--text-color)' }}>납품방법</InputLabel>
                        <Select
                          value={selectedOrder.deliveryMethod || '택배'}
                          onChange={e => handleUpdateSelectedOrderField('deliveryMethod', e.target.value)}
                          label="납품방법"
                          sx={{ color: 'var(--text-color)' }}
                          MenuProps={{
                            PaperProps: {
                              sx: { color: 'var(--text-color)', backgroundColor: 'var(--surface-color)' }
                            }
                          }}
                        >
                          <MenuItem value="매장배송" sx={{ color: 'var(--text-color)' }}>매장배송</MenuItem>
                          <MenuItem value="택배" sx={{ color: 'var(--text-color)' }}>택배</MenuItem>
                          <MenuItem value="직접입력" sx={{ color: 'var(--text-color)' }}>직접입력</MenuItem>
                        </Select>
                      </FormControl>
                      {selectedOrder.deliveryMethod === '직접입력' && (
                        <TextField
                          fullWidth
                          size="small"
                          label="직접입력"
                          sx={{ mt: 1 }}
                          defaultValue={selectedOrder.deliveryMethod || ''}
                          onBlur={e =>
                            handleUpdateSelectedOrderField(
                              'deliveryMethod',
                              e.target.value
                            )
                          }
                        />
                      )}
                    </Grid>
                    <Grid item xs={3}>
                      <FormControl fullWidth size="small">
                        <InputLabel sx={{ color: 'var(--text-color)' }}>납품일(발송일)</InputLabel>
                        <Select
                          value={selectedOrder.deliveryDate || ''}
                          onChange={e => handleUpdateSelectedOrderField('deliveryDate', e.target.value)}
                          label="납품일(발송일)"
                          sx={{ color: 'var(--text-color)' }}
                          MenuProps={{
                            PaperProps: {
                              sx: { color: 'var(--text-color)', backgroundColor: 'var(--surface-color)' }
                            }
                          }}
                        >
                          <MenuItem value="" sx={{ color: 'var(--text-color)' }}>직접입력</MenuItem>
                          {/* 날짜 MenuItem도 동일하게 sx 적용 */}
                          {Array.from({ length: 9 }, (_, i) => {
                            const date = new Date(selectedOrder.orderDate);
                            date.setDate(date.getDate() + i + 2);
                            return date.toISOString().split('T')[0];
                          }).map(date => (
                            <MenuItem key={date} value={date} sx={{ color: 'var(--text-color)' }}>
                              {new Date(date).toLocaleDateString('ko-KR', {
                                month: 'long',
                                day: 'numeric',
                                weekday: 'short',
                              })}
                            </MenuItem>
                          ))}
                        </Select>
                      </FormControl>
                      {!selectedOrder.deliveryDate && (
                        <TextField
                          fullWidth
                          size="small"
                          label="직접입력"
                          type="date"
                          InputLabelProps={{ shrink: true }}
                          InputProps={{
                            sx: {
                              borderRadius: 2,
                              background: 'var(--surface-color)',
                              border: '1px solid var(--border-color)',
                              color: 'var(--text-color)',
                              cursor: 'pointer',
                              '&:hover': {
                                backgroundColor: 'var(--hover-color)',
                                borderColor: 'var(--primary-color)',
                              },
                              '&:focus': {
                                borderColor: 'var(--primary-color)',
                                boxShadow: '0 0 0 2px rgba(64, 196, 255, 0.2)',
                              },
                            },
                            onClick: (e) => {
                              const input = e.currentTarget.querySelector('input');
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
                            mt: 1,
                            '& .MuiInputBase-root': {
                              cursor: 'pointer',
                            },
                          }}
                          defaultValue={selectedOrder.deliveryDate}
                          onBlur={e =>
                            handleUpdateSelectedOrderField(
                              'deliveryDate',
                              e.target.value
                            )
                          }
                        />
                      )}
                    </Grid>
                    <Grid item xs={3}>
                      <TextField
                        fullWidth
                        size="small"
                        label="받을주소"
                        defaultValue={
                          selectedOrder.deliveryAddress ||
                          companyInfo.address ||
                          ''
                        }
                        onBlur={e =>
                          handleUpdateSelectedOrderField(
                            'deliveryAddress',
                            e.target.value
                          )
                        }
                      />
                    </Grid>
                    <Grid item xs={3}>
                      <TextField
                        fullWidth
                        size="small"
                        label="연락처"
                        defaultValue={
                          selectedOrder.contactPhone ||
                          companyInfo.contact ||
                          ''
                        }
                        onBlur={e =>
                          handleUpdateSelectedOrderField(
                            'contactPhone',
                            e.target.value
                          )
                        }
                      />
                    </Grid>
                  </Grid>
                </Paper>
              </Box>
            )}
          </Box>
        </Box>
      </Box>

      {/* 출력 다이얼로그 */}
      <Dialog
        open={printDialogOpen}
        onClose={() => setPrintDialogOpen(false)}
        maxWidth="md"
        fullWidth
        fullScreen={isMobile}
        disableEnforceFocus
        disableAutoFocus
        PaperProps={{
          sx: {
            backgroundColor: 'var(--background-color)',
            ...(isMobile && {
              margin: 0,
              borderRadius: 0,
              height: '100%',
            }),
          },
        }}
      >
        <DialogTitle sx={{ 
          backgroundColor: 'var(--surface-color)',
          borderBottom: 1,
          borderColor: 'var(--border-color)',
          position: 'relative'
        }}>
          {isMobile && (
            <IconButton
              onClick={() => setPrintDialogOpen(false)}
              sx={{
                position: 'absolute',
                left: 8,
                top: 8,
                color: 'var(--secondary-text-color)',
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
            발주서 출력
          </Typography>
        </DialogTitle>
        <DialogContent sx={{ 
          p: isMobile ? 2 : 3,
          backgroundColor: 'var(--background-color)',
          '& .MuiDialogContent-root': {
            backgroundColor: 'var(--background-color)',
          }
        }}>
          <Box sx={{ mb: 3 }}>
            <Typography 
              variant="h6" 
              sx={{ 
                mb: 2,
                color: 'var(--text-color)',
                fontSize: isMobile ? '1.1rem' : '1.25rem',
                fontWeight: 600,
              }}
            >
              출력 형식 선택
            </Typography>
            <ToggleButtonGroup
              value={printFormat}
              exclusive
              onChange={(e, value) => value && setPrintFormat(value)}
              sx={{ 
                mb: 2,
                '& .MuiToggleButton-root': {
                  color: 'var(--secondary-text-color)',
                  borderColor: 'var(--border-color)',
                  backgroundColor: 'var(--surface-color)',
                  fontSize: isMobile ? '0.9rem' : '0.875rem',
                  minHeight: isMobile ? '44px' : 'auto',
                  '&.Mui-selected': {
                    backgroundColor: 'var(--primary-color)',
                    color: '#fff',
                    '&:hover': {
                      backgroundColor: 'var(--primary-color)',
                    }
                  },
                  '&:hover': {
                    backgroundColor: 'var(--hover-color)',
                    borderColor: 'var(--primary-color)',
                  }
                }
              }}
            >
              <ToggleButton value="formal">정식발주서</ToggleButton>
              <ToggleButton value="simple">간단발주서</ToggleButton>
            </ToggleButtonGroup>
          </Box>

          {printFormat === 'formal' && (
            <Box
              sx={{ mb: 3, p: 2, border: '1px solid #ddd', borderRadius: 1 }}
            >
              <Typography variant="h6" sx={{ mb: 2 }}>
                발신 정보 설정
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={4}>
                  <TextField
                    fullWidth
                    label="회사명"
                    value={senderInfo.companyName}
                    onChange={e =>
                      setSenderInfo({
                        ...senderInfo,
                        companyName: e.target.value,
                      })
                    }
                    size="small"
                  />
                </Grid>
                <Grid item xs={12} sm={4}>
                  <TextField
                    fullWidth
                    label="연락처"
                    value={senderInfo.contact}
                    onChange={e =>
                      setSenderInfo({ ...senderInfo, contact: e.target.value })
                    }
                    size="small"
                  />
                </Grid>
                <Grid item xs={12} sm={4}>
                  <TextField
                    fullWidth
                    label="주소"
                    value={senderInfo.address}
                    onChange={e =>
                      setSenderInfo({ ...senderInfo, address: e.target.value })
                    }
                    size="small"
                  />
                </Grid>
              </Grid>
            </Box>
          )}

          {selectedOrder && (
            <Box
              ref={printComponentRef}
              sx={{
                border: '1px solid #ddd',
                p: 2,
                backgroundColor: '#f9f9f9',
                maxHeight: '400px',
                overflow: 'auto',
              }}
            >
              <OrderPrintContent
                order={selectedOrder}
                format={printFormat}
                senderInfo={senderInfo}
              />
            </Box>
          )}
        </DialogContent>
        {!isMobile && (
          <DialogActions sx={{ 
            borderTop: 1, 
            borderColor: '#2e3a4a', 
            p: 2,
            backgroundColor: '#1e2633'
          }}>
            <Button 
              onClick={() => setPrintDialogOpen(false)}
              sx={{ 
                color: '#b0b8c1',
                '&:hover': {
                  backgroundColor: '#2e3a4a'
                }
              }}
            >
              취소
            </Button>
            <Button 
              onClick={handleExportToPDF} 
              startIcon={<PdfIcon />}
              sx={{
                color: '#f44336',
                '&:hover': {
                  backgroundColor: 'rgba(244, 67, 54, 0.1)'
                }
              }}
            >
              PDF 다운로드
            </Button>
            <Button 
              onClick={handleExportToJPG} 
              startIcon={<ImageIcon />}
              sx={{
                color: '#4caf50',
                '&:hover': {
                  backgroundColor: 'rgba(76, 175, 80, 0.1)'
                }
              }}
            >
              JPG 다운로드
            </Button>
            <Button 
              onClick={handleShare} 
              startIcon={<ShareIcon />}
              sx={{
                color: '#ff9800',
                '&:hover': {
                  backgroundColor: 'rgba(255, 152, 0, 0.1)'
                }
              }}
            >
              공유
            </Button>
            <Button
              onClick={handleReactToPrint}
              startIcon={<PrintIcon />}
              variant="contained"
              sx={{
                backgroundColor: '#40c4ff',
                '&:hover': {
                  backgroundColor: '#33a3cc'
                }
              }}
            >
              인쇄
            </Button>
          </DialogActions>
        )}
        
        {/* 모바일에서 버튼들 */}
        {isMobile && (
          <Box sx={{ 
            p: 2, 
            display: 'flex', 
            flexDirection: 'column',
            gap: 1,
            borderTop: 1, 
            borderColor: '#2e3a4a', 
            backgroundColor: '#1e2633'
          }}>
            <Button
              onClick={handleReactToPrint}
              startIcon={<PrintIcon />}
              variant="contained"
              fullWidth
              sx={{
                backgroundColor: '#40c4ff',
                minHeight: '48px',
                fontSize: '1rem',
                '&:hover': {
                  backgroundColor: '#33a3cc'
                }
              }}
            >
              인쇄
            </Button>
            <Box sx={{ display: 'flex', gap: 1 }}>
              <Button 
                onClick={handleExportToPDF} 
                startIcon={<PdfIcon />}
                variant="outlined"
                sx={{
                  flex: 1,
                  color: '#f44336',
                  borderColor: '#f44336',
                  minHeight: '44px',
                  fontSize: '0.9rem',
                  '&:hover': {
                    backgroundColor: 'rgba(244, 67, 54, 0.1)',
                    borderColor: '#d32f2f'
                  }
                }}
              >
                PDF
              </Button>
              <Button 
                onClick={handleExportToJPG} 
                startIcon={<ImageIcon />}
                variant="outlined"
                sx={{
                  flex: 1,
                  color: '#4caf50',
                  borderColor: '#4caf50',
                  minHeight: '44px',
                  fontSize: '0.9rem',
                  '&:hover': {
                    backgroundColor: 'rgba(76, 175, 80, 0.1)',
                    borderColor: '#388e3c'
                  }
                }}
              >
                JPG
              </Button>
            </Box>
            <Button 
              onClick={handleShare} 
              startIcon={<ShareIcon />}
              variant="outlined"
              fullWidth
              sx={{
                color: '#ff9800',
                borderColor: '#ff9800',
                minHeight: '44px',
                fontSize: '0.9rem',
                '&:hover': {
                  backgroundColor: 'rgba(255, 152, 0, 0.1)',
                  borderColor: '#f57c00'
                }
              }}
            >
              공유
            </Button>
          </Box>
        )}
      </Dialog>

      {/* 기간별 발주완료목록 필터링 모달 */}
      <Dialog
        open={completedOrderFilterModalOpen}
        onClose={() => setCompletedOrderFilterModalOpen(false)}
        maxWidth="md"
        fullWidth
        PaperProps={{
          sx: {
            backgroundColor: 'var(--surface-color)',
            color: 'var(--text-color)',
            maxHeight: '80vh',
          },
        }}
      >
        <DialogTitle
          sx={{
            borderBottom: '1px solid #2e3a4a',
            backgroundColor: '#1a1f2e',
            color: '#40c4ff',
            fontWeight: 'bold',
          }}
        >
          {completedOrderFilterType === 'week'
            ? '주간 발주완료목록'
            : completedOrderFilterType === 'month'
              ? '월간 발주완료목록'
              : '기간별 발주완료목록'}
        </DialogTitle>
        <DialogContent sx={{ p: 3 }}>
          {completedOrderFilterType === 'custom' && (
            <Box
              sx={{
                mb: 3,
                p: 2,
                bgcolor: 'var(--surface-color)',
                borderRadius: 1,
                border: '1px solid var(--border-color)',
              }}
            >
              <Typography
                variant="h6"
                gutterBottom
                sx={{ color: '#40c4ff', mb: 2 }}
              >
                기간 설정
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={6}>
                  <TextField
                    fullWidth
                    label="시작일"
                    type="date"
                    value={customDateRange.start}
                    onChange={e =>
                      setCustomDateRange({
                        ...customDateRange,
                        start: e.target.value,
                      })
                    }
                    InputLabelProps={{ shrink: true }}
                    InputProps={{
                      sx: {
                        borderRadius: 2,
                        background: '#263040',
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
                        const input = e.currentTarget.querySelector('input');
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
                      '& .MuiInputBase-root': {
                        cursor: 'pointer',
                      },
                    }}
                  />
                </Grid>
                <Grid item xs={6}>
                  <TextField
                    fullWidth
                    label="종료일"
                    type="date"
                    value={customDateRange.end}
                    onChange={e =>
                      setCustomDateRange({
                        ...customDateRange,
                        end: e.target.value,
                      })
                    }
                    InputLabelProps={{ shrink: true }}
                    InputProps={{
                      sx: {
                        borderRadius: 2,
                        background: '#263040',
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
                          const input = e.currentTarget.querySelector('input');
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
                      '& .MuiInputBase-root': {
                        cursor: 'pointer',
                      },
                    }}
                  />
                </Grid>
              </Grid>
            </Box>
          )}

          <Typography
            variant="h6"
            gutterBottom
            sx={{ color: '#40c4ff', mb: 2 }}
          >
            {completedOrderFilterType === 'week'
              ? '최근 7일 발주완료목록'
              : completedOrderFilterType === 'month'
                ? '최근 1개월 발주완료목록'
                : '선택 기간 발주완료목록'}
          </Typography>

          <List>
            {(completedOrderFilterType === 'week'
              ? getWeekCompletedOrders()
              : completedOrderFilterType === 'month'
                ? getMonthCompletedOrders()
                : getCustomDateRangeCompletedOrders()
            ).map((group: Order[]) => {
              const relatedContract = contracts.find(
                c => c.id.toString() === group[0].contractId
              );
              const customerAddress =
                relatedContract?.address || group[0].deliveryAddress;

              return (
                <ListItem
                  key={group[0].orderGroupId}
                  sx={{
                    mb: 1,
                    borderRadius: 1,
                    backgroundColor: 'var(--surface-color)',
                    cursor: 'pointer',
                    '&:hover': {
                      backgroundColor: 'var(--hover-color)',
                      transform: 'translateY(-1px)',
                      boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
                    },
                    transition: 'all 0.2s ease',
                  }}
                  onClick={() => {
                    setSelectedCompletedGroup(group);
                    setCompletedOrderFilterModalOpen(false);
                    setCompletedOrderDetailModalOpen(true);
                  }}
                >
                  <ListItemText
                    primary={customerAddress}
                    secondary={`[${group[0].orderDate}] ${group.length}개 거래처 완료`}
                    primaryTypographyProps={{ style: { fontWeight: 'bold' } }}
                  />
                  <Button
                    size="small"
                    variant="outlined"
                    onClick={e => {
                      e.stopPropagation();
                      group.forEach(order => handleReopenOrder(order.id));
                    }}
                    sx={{
                      ml: 1,
                      color: '#ff6b6b',
                      borderColor: '#ff6b6b',
                      '&:hover': {
                        borderColor: '#ff6b6b',
                        backgroundColor: 'rgba(255, 107, 107, 0.1)',
                      },
                    }}
                  >
                    되돌리기
                  </Button>
                </ListItem>
              );
            })}
          </List>
        </DialogContent>
        <DialogActions sx={{ p: 2, borderTop: '1px solid #2e3a4a' }}>
          <Button
            onClick={() => setCompletedOrderFilterModalOpen(false)}
            sx={{
              color: '#b0b8c1',
              '&:hover': { backgroundColor: 'rgba(176, 184, 193, 0.1)' },
            }}
          >
            닫기
          </Button>
        </DialogActions>
      </Dialog>

      {/* 발주완료목록 상세보기 모달 */}
      <Dialog
        open={completedOrderDetailModalOpen}
        onClose={() => setCompletedOrderDetailModalOpen(false)}
        maxWidth="lg"
        fullWidth
        PaperProps={{
          sx: {
            backgroundColor: 'var(--surface-color)',
            color: 'var(--text-color)',
            maxHeight: '90vh',
          },
        }}
      >
        <DialogTitle
          sx={{
            borderBottom: '1px solid #2e3a4a',
            backgroundColor: '#1a1f2e',
            color: '#40c4ff',
            fontWeight: 'bold',
          }}
        >
          거래처별 발주내용 상세보기
        </DialogTitle>
        <DialogContent sx={{ p: 3 }}>
          {selectedCompletedGroup && (
            <Box>
              {/* 프로젝트 정보 */}
              <Box
                sx={{
                  mb: 3,
                  p: 2,
                  bgcolor: 'var(--surface-color)',
                  borderRadius: 1,
                  border: '1px solid var(--border-color)',
                }}
              >
                <Typography
                  variant="h6"
                  gutterBottom
                  sx={{ color: '#40c4ff', mb: 2 }}
                >
                  프로젝트 정보
                </Typography>
                <Grid container spacing={2}>
                  <Grid item xs={12} sm={6} md={3}>
                    <Box sx={{ p: 1, bgcolor: 'var(--surface-color)', borderRadius: 0.5 }}>
                      <Typography
                        variant="caption"
                        sx={{ color: 'var(--secondary-text-color)', display: 'block' }}
                      >
                        계약번호
                      </Typography>
                      <Typography
                        variant="body2"
                        sx={{ fontWeight: 'bold', color: 'var(--text-color)' }}
                      >
                        {selectedCompletedGroup[0].contractNo}
                      </Typography>
                    </Box>
                  </Grid>
                  <Grid item xs={12} sm={6} md={3}>
                    <Box sx={{ p: 1, bgcolor: 'var(--surface-color)', borderRadius: 0.5 }}>
                      <Typography
                        variant="caption"
                        sx={{ color: 'var(--secondary-text-color)', display: 'block' }}
                      >
                        고객명
                      </Typography>
                      <Typography
                        variant="body2"
                        sx={{ fontWeight: 'bold', color: 'var(--text-color)' }}
                      >
                        {selectedCompletedGroup[0].customerName}
                      </Typography>
                    </Box>
                  </Grid>
                  <Grid item xs={12} sm={6} md={3}>
                    <Box sx={{ p: 1, bgcolor: 'var(--surface-color)', borderRadius: 0.5 }}>
                      <Typography
                        variant="caption"
                        sx={{ color: 'var(--secondary-text-color)', display: 'block' }}
                      >
                        발주일
                      </Typography>
                      <Typography
                        variant="body2"
                        sx={{ fontWeight: 'bold', color: 'var(--text-color)' }}
                      >
                        {selectedCompletedGroup[0].orderDate}
                      </Typography>
                    </Box>
                  </Grid>
                  <Grid item xs={12} sm={6} md={3}>
                    <Box sx={{ p: 1, bgcolor: 'var(--surface-color)', borderRadius: 0.5 }}>
                      <Typography
                        variant="caption"
                        sx={{ color: 'var(--secondary-text-color)', display: 'block' }}
                      >
                        거래처 수
                      </Typography>
                      <Typography
                        variant="body2"
                        sx={{ fontWeight: 'bold', color: 'var(--text-color)' }}
                      >
                        {selectedCompletedGroup.length}개
                      </Typography>
                    </Box>
                  </Grid>
                </Grid>
              </Box>

              {/* 거래처별 발주내용 */}
              <Typography
                variant="h6"
                gutterBottom
                sx={{ color: 'var(--primary-color)', mb: 2 }}
              >
                거래처별 발주내용
              </Typography>

              {selectedCompletedGroup.map((order, index) => (
                <Box
                  key={order.id}
                  sx={{
                    mb: 3,
                    p: 2,
                    bgcolor: 'var(--surface-color)',
                    borderRadius: 1,
                    border: '1px solid var(--border-color)',
                  }}
                >
                  {/* 거래처 헤더 */}
                  <Box
                    sx={{
                      mb: 2,
                      p: 1.5,
                      bgcolor: 'var(--surface-color)',
                      borderRadius: 1,
                      border: '1px solid var(--primary-color)',
                    }}
                  >
                    <Grid container spacing={2} alignItems="center">
                      <Grid item xs={12} sm={4}>
                        <Typography
                          variant="subtitle1"
                          sx={{ fontWeight: 'bold', color: 'var(--primary-color)' }}
                        >
                          {order.vendorName}
                        </Typography>
                      </Grid>
                      <Grid item xs={12} sm={3}>
                        <Typography variant="body2" sx={{ color: '#b0b8c1' }}>
                          발주번호: {order.orderNo}
                        </Typography>
                      </Grid>
                      <Grid item xs={12} sm={3}>
                        <Typography variant="body2" sx={{ color: '#b0b8c1' }}>
                          납품일: {order.deliveryDate || '-'}
                        </Typography>
                      </Grid>
                      <Grid item xs={12} sm={2}>
                        <Chip
                          label={order.status}
                          color={getStatusColor(order.status)}
                          size="small"
                          sx={{ fontWeight: 'bold' }}
                        />
                      </Grid>
                    </Grid>
                  </Box>

                  {/* 발주 품목 테이블 */}
                  <TableContainer
                    component={Paper}
                    sx={{ bgcolor: 'var(--surface-color)', mb: 2 }}
                  >
                    <Table size="small">
                      <TableHead>
                        <TableRow sx={{ bgcolor: 'var(--primary-color)' }}>
                          <TableCell
                            sx={{
                              color: 'white',
                              fontWeight: 'bold',
                              fontSize: '0.75rem',
                              minWidth: 80,
                            }}
                          >
                            공간
                          </TableCell>
                          <TableCell
                            sx={{
                              color: 'white',
                              fontWeight: 'bold',
                              fontSize: '0.75rem',
                              minWidth: 100,
                            }}
                          >
                            제품코드
                          </TableCell>
                          <TableCell
                            sx={{
                              color: 'white',
                              fontWeight: 'bold',
                              fontSize: '0.75rem',
                              minWidth: 120,
                            }}
                          >
                            품목
                          </TableCell>
                          <TableCell
                            sx={{
                              color: 'white',
                              fontWeight: 'bold',
                              fontSize: '0.75rem',
                              minWidth: 100,
                            }}
                          >
                            제작사이즈
                          </TableCell>
                          <TableCell
                            sx={{
                              color: 'white',
                              fontWeight: 'bold',
                              fontSize: '0.75rem',
                              minWidth: 60,
                            }}
                          >
                            m²
                          </TableCell>
                          <TableCell
                            sx={{
                              color: 'white',
                              fontWeight: 'bold',
                              fontSize: '0.75rem',
                              minWidth: 60,
                            }}
                          >
                            폭수
                          </TableCell>
                          <TableCell
                            sx={{
                              color: 'white',
                              fontWeight: 'bold',
                              fontSize: '0.75rem',
                              minWidth: 80,
                            }}
                          >
                            수량
                          </TableCell>
                          <TableCell
                            sx={{
                              color: 'white',
                              fontWeight: 'bold',
                              fontSize: '0.75rem',
                              minWidth: 80,
                            }}
                          >
                            입고단가
                          </TableCell>
                          <TableCell
                            sx={{
                              color: 'white',
                              fontWeight: 'bold',
                              fontSize: '0.75rem',
                              minWidth: 80,
                            }}
                          >
                            금액
                          </TableCell>
                          <TableCell
                            sx={{
                              color: '#b0b8c1',
                              fontWeight: 'bold',
                              fontSize: '0.75rem',
                              minWidth: 120,
                            }}
                          >
                            제품별메모
                          </TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {order.items.map((item, itemIndex) => (
                          <TableRow
                            key={item.id}
                            sx={{
                              '&:nth-of-type(odd)': { bgcolor: 'var(--hover-color)' },
                            }}
                          >
                            <TableCell
                              sx={{ color: '#e0e6ed', fontSize: '0.75rem' }}
                            >
                              {item.space || '-'}
                            </TableCell>
                            <TableCell
                              sx={{ color: '#e0e6ed', fontSize: '0.75rem' }}
                            >
                              {item.productCode || '-'}
                            </TableCell>
                            <TableCell
                              sx={{ color: '#e0e6ed', fontSize: '0.75rem' }}
                            >
                              <Box>
                                <Typography
                                  variant="body2"
                                  sx={{ fontWeight: 'bold' }}
                                >
                                  {item.productName}
                                </Typography>
                                {item.brand && (
                                  <Typography
                                    variant="caption"
                                    sx={{ color: 'var(--secondary-text-color)' }}
                                  >
                                    {item.brand}
                                  </Typography>
                                )}
                              </Box>
                            </TableCell>
                            <TableCell
                              sx={{ color: '#e0e6ed', fontSize: '0.75rem' }}
                            >
                              {item.productionWidth && item.productionHeight
                                ? `${item.productionWidth}×${item.productionHeight}`
                                : item.widthMM && item.heightMM
                                  ? `${item.widthMM}×${item.heightMM}`
                                  : item.width
                                    ? item.width
                                    : '-'}
                            </TableCell>
                            <TableCell
                              sx={{ color: '#e0e6ed', fontSize: '0.75rem' }}
                            >
                              {item.area ? item.area.toFixed(2) : '-'}
                            </TableCell>
                            <TableCell
                              sx={{ color: '#e0e6ed', fontSize: '0.75rem' }}
                            >
                              {item.widthCount || '-'}
                            </TableCell>
                            <TableCell
                              sx={{ color: '#e0e6ed', fontSize: '0.75rem' }}
                            >
                              {item.quantity} {item.unit}
                            </TableCell>
                            <TableCell
                              sx={{ color: '#e0e6ed', fontSize: '0.75rem' }}
                            >
                              {item.unitPrice?.toLocaleString() || '-'}
                            </TableCell>
                            <TableCell
                              sx={{
                                color: 'var(--text-color)',
                                fontSize: '0.75rem',
                                fontWeight: 'bold',
                              }}
                            >
                              {item.totalPrice?.toLocaleString() || '-'}
                            </TableCell>
                            <TableCell
                              sx={{ color: '#e0e6ed', fontSize: '0.75rem' }}
                            >
                              {item.requestNote || '-'}
                            </TableCell>
                          </TableRow>
                        ))}
                        {/* 합계 행 */}
                        <TableRow sx={{ bgcolor: 'var(--surface-color)' }}>
                          <TableCell
                            colSpan={8}
                            sx={{
                              color: 'var(--secondary-text-color)',
                              fontWeight: 'bold',
                              textAlign: 'right',
                            }}
                          >
                            합계
                          </TableCell>
                          <TableCell
                            sx={{ color: 'var(--primary-color)', fontWeight: 'bold' }}
                          >
                            {order.items
                              .reduce(
                                (sum, item) => sum + (item.totalPrice || 0),
                                0
                              )
                              .toLocaleString()}
                            원
                          </TableCell>
                          <TableCell></TableCell>
                        </TableRow>
                        <TableRow sx={{ bgcolor: 'var(--surface-color)' }}>
                          <TableCell
                            colSpan={8}
                            sx={{
                              color: 'var(--secondary-text-color)',
                              fontWeight: 'bold',
                              textAlign: 'right',
                            }}
                          >
                            부가세 (10%)
                          </TableCell>
                          <TableCell
                            sx={{ color: 'var(--primary-color)', fontWeight: 'bold' }}
                          >
                            {Math.round(
                              order.items.reduce(
                                (sum, item) => sum + (item.totalPrice || 0),
                                0
                              ) * 0.1
                            ).toLocaleString()}
                            원
                          </TableCell>
                          <TableCell></TableCell>
                        </TableRow>
                        <TableRow sx={{ bgcolor: 'var(--hover-color)' }}>
                          <TableCell
                            colSpan={8}
                            sx={{
                              color: 'var(--primary-color)',
                              fontWeight: 'bold',
                              textAlign: 'right',
                            }}
                          >
                            총 금액
                          </TableCell>
                          <TableCell
                            sx={{
                              color: 'var(--primary-color)',
                              fontWeight: 'bold',
                              fontSize: '1.1rem',
                            }}
                          >
                            {Math.round(
                              order.items.reduce(
                                (sum, item) => sum + (item.totalPrice || 0),
                                0
                              ) * 1.1
                            ).toLocaleString()}
                            원
                          </TableCell>
                          <TableCell></TableCell>
                        </TableRow>
                      </TableBody>
                    </Table>
                  </TableContainer>

                  {/* 요청사항 */}
                  {order.note && (
                    <Box
                      sx={{
                        p: 1.5,
                        bgcolor: 'var(--surface-color)',
                        borderRadius: 1,
                        border: '1px solid var(--border-color)',
                      }}
                    >
                      <Typography
                        variant="subtitle2"
                        sx={{ color: 'var(--secondary-text-color)', mb: 1 }}
                      >
                        요청사항
                      </Typography>
                      <Typography variant="body2" sx={{ color: 'var(--text-color)' }}>
                        {order.note}
                      </Typography>
                    </Box>
                  )}
                </Box>
              ))}
            </Box>
          )}
        </DialogContent>
        <DialogActions sx={{ p: 2, borderTop: '1px solid #2e3a4a' }}>
          <Button
            onClick={() => setCompletedOrderDetailModalOpen(false)}
            sx={{
              color: '#b0b8c1',
              '&:hover': { backgroundColor: 'rgba(176, 184, 193, 0.1)' },
            }}
          >
            닫기
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={3000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert
          onClose={() => setSnackbar({ ...snackbar, open: false })}
          severity={snackbar.severity as any}
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default OrderManagement;
