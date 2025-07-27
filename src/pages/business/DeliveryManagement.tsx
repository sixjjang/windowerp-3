import React, { useState, useMemo, useEffect, useContext } from 'react';
import useMediaQuery from '@mui/material/useMediaQuery';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Grid,
  Button,
  Chip,
  TextField,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Checkbox,
  FormGroup,
  FormControlLabel,
  Tooltip,
  Snackbar,
  Alert,
} from '@mui/material';
import {
  Delete as DeleteIcon,
  Build as BuildIcon,
  ExpandMore as ExpandMoreIcon,
  AttachMoney as MoneyIcon,
  CheckCircle as CheckCircleIcon,
  Warning as WarningIcon,
  Settings as SettingsIcon,
  Visibility as ViewIcon,
  Search as SearchIcon,
  Clear as ClearIcon,
  Print as PrintIcon,
  PictureAsPdf as PdfIcon,
  Image as ImageIcon,
  Assignment as AssignmentIcon,
  Close as CloseIcon,
  ArrowBack as ArrowBackIcon,
} from '@mui/icons-material';
import {
  useDeliveryStore,
  ASRecord,
  DeliverySite,
  ConstructionType,
  PaymentStatus,
  useWorkerStore,
} from '../../utils/deliveryStore';
import { useNotificationStore } from '../../utils/notificationStore';
import { UserContext } from '../../components/Layout';
// 임시 타입 선언 (ts-ignore)
// @ts-ignore
import { v4 as uuidv4 } from 'uuid';
import CuteASApplicationModal from '../../components/CuteASApplicationModal';
import { Order } from './OrderManagement';
import { deliveryService, workerService } from '../../utils/firebaseDataService';

// OrderDetailModal 컴포넌트 정의
type OrderDetailModalProps = {
  open: boolean;
  group: Order[];
  onClose: () => void;
};

const OrderDetailModal: React.FC<OrderDetailModalProps> = ({
  open,
  group,
  onClose,
}) => (
  <Dialog
    open={open}
    onClose={onClose}
    maxWidth="lg"
    fullWidth
    PaperProps={{
              sx: { backgroundColor: 'var(--surface-color)', color: 'var(--text-color)', maxHeight: '90vh' },
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
      {group && group.length > 0 ? (
        <Box>
          {/* 프로젝트 정보 */}
          <Box
            sx={{
              mb: 3,
              p: 2,
              bgcolor: '#1a1f2e',
              borderRadius: 1,
              border: '1px solid #2e3a4a',
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
                <Box sx={{ p: 1, bgcolor: '#263040', borderRadius: 0.5 }}>
                  <Typography
                    variant="caption"
                    sx={{ color: '#b0b8c1', display: 'block' }}
                  >
                    계약번호
                  </Typography>
                  <Typography
                    variant="body2"
                    sx={{ fontWeight: 'bold', color: '#e0e6ed' }}
                  >
                    {group[0].contractNo}
                  </Typography>
                </Box>
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <Box sx={{ p: 1, bgcolor: '#263040', borderRadius: 0.5 }}>
                  <Typography
                    variant="caption"
                    sx={{ color: '#b0b8c1', display: 'block' }}
                  >
                    고객명
                  </Typography>
                  <Typography
                    variant="body2"
                    sx={{ fontWeight: 'bold', color: '#e0e6ed' }}
                  >
                    {group[0].customerName}
                  </Typography>
                </Box>
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <Box sx={{ p: 1, bgcolor: '#263040', borderRadius: 0.5 }}>
                  <Typography
                    variant="caption"
                    sx={{ color: '#b0b8c1', display: 'block' }}
                  >
                    발주일
                  </Typography>
                  <Typography
                    variant="body2"
                    sx={{ fontWeight: 'bold', color: '#e0e6ed' }}
                  >
                    {group[0].orderDate}
                  </Typography>
                </Box>
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <Box sx={{ p: 1, bgcolor: '#263040', borderRadius: 0.5 }}>
                  <Typography
                    variant="caption"
                    sx={{ color: '#b0b8c1', display: 'block' }}
                  >
                    거래처 수
                  </Typography>
                  <Typography
                    variant="body2"
                    sx={{ fontWeight: 'bold', color: '#e0e6ed' }}
                  >
                    {group.length}개
                  </Typography>
                </Box>
              </Grid>
            </Grid>
          </Box>
          {/* 거래처별 발주내용 */}
          <Typography
            variant="h6"
            gutterBottom
            sx={{ color: '#40c4ff', mb: 2 }}
          >
            거래처별 발주내용
          </Typography>
          {group.map((order, index) => (
            <Box
              key={order.id}
              sx={{
                mb: 3,
                p: 2,
                bgcolor: '#1a1f2e',
                borderRadius: 1,
                border: '1px solid #2e3a4a',
              }}
            >
              {/* 거래처 헤더 */}
              <Box
                sx={{
                  mb: 2,
                  p: 1.5,
                  bgcolor: '#263040',
                  borderRadius: 1,
                  border: '1px solid #40c4ff',
                }}
              >
                <Grid container spacing={2} alignItems="center">
                  <Grid item xs={12} sm={4}>
                    <Typography
                      variant="subtitle1"
                      sx={{ fontWeight: 'bold', color: '#40c4ff' }}
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
                </Grid>
              </Box>
              {/* 제품 테이블 */}
              <Box sx={{ overflowX: 'auto' }}>
                <table
                  style={{
                    width: '100%',
                    borderCollapse: 'collapse',
                    background: 'var(--surface-color)',
                    color: '#e0e6ed',
                  }}
                >
                  <thead>
                    <tr style={{ background: '#263040' }}>
                      <th style={{ border: '1px solid #2e3a4a', padding: 6 }}>
                        공간
                      </th>
                      <th style={{ border: '1px solid #2e3a4a', padding: 6 }}>
                        제품코드
                      </th>
                      <th style={{ border: '1px solid #2e3a4a', padding: 6 }}>
                        제작사이즈
                      </th>
                      <th style={{ border: '1px solid #2e3a4a', padding: 6 }}>
                        m²
                      </th>
                      <th style={{ border: '1px solid #2e3a4a', padding: 6 }}>
                        폭수
                      </th>
                      <th style={{ border: '1px solid #2e3a4a', padding: 6 }}>
                        입고단가
                      </th>
                      <th style={{ border: '1px solid #2e3a4a', padding: 6 }}>
                        입고원가
                      </th>
                      <th style={{ border: '1px solid #2e3a4a', padding: 6 }}>
                        제품별메모
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {order.items.map((item, idx) => (
                      <tr
                        key={item.id}
                        style={{
                          background: idx % 2 === 0 ? 'var(--surface-color)' : 'var(--background-color)',
                        }}
                      >
                        <td style={{ border: '1px solid #2e3a4a', padding: 6 }}>
                          {item.space === '직접입력' && item.spaceCustom ? item.spaceCustom : (item.space || '-')}
                        </td>
                        <td style={{ border: '1px solid #2e3a4a', padding: 6 }}>
                          {item.productCode || '-'}
                        </td>
                        <td style={{ border: '1px solid #2e3a4a', padding: 6 }}>
                          {item.productionWidth && item.productionHeight
                            ? `${item.productionWidth} x ${item.productionHeight}`
                            : '-'}
                        </td>
                        <td style={{ border: '1px solid #2e3a4a', padding: 6 }}>
                          {item.area ? item.area.toFixed(2) : '-'}
                        </td>
                        <td style={{ border: '1px solid #2e3a4a', padding: 6 }}>
                          {item.widthCount || '-'}
                        </td>
                        <td style={{ border: '1px solid #2e3a4a', padding: 6 }}>
                          {item.unitPrice
                            ? item.unitPrice.toLocaleString()
                            : '-'}
                        </td>
                        <td style={{ border: '1px solid #2e3a4a', padding: 6 }}>
                          {item.totalPrice
                            ? item.totalPrice.toLocaleString()
                            : '-'}
                        </td>
                        <td style={{ border: '1px solid #2e3a4a', padding: 6 }}>
                          {item.note || '-'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </Box>
            </Box>
          ))}
        </Box>
      ) : (
        <Typography color="error">발주내역이 없습니다.</Typography>
      )}
    </DialogContent>
    <DialogActions sx={{ p: 2, borderTop: '1px solid #2e3a4a' }}>
      <Button
        onClick={onClose}
        sx={{
          color: '#b0b8c1',
          '&:hover': { backgroundColor: 'rgba(176, 184, 193, 0.1)' },
        }}
      >
        닫기
      </Button>
    </DialogActions>
  </Dialog>
);

// 견적서의 컬럼 구조와 함수들을 import
const FILTER_FIELDS = [
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
  { key: 'dimensions', label: '가로*세로', visible: true },
  { key: 'productionDimensions', label: '제작사이즈', visible: true },
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

// 견적서의 getRowValue 함수를 그대로 사용
const getRowValue = (row: any, key: string) => {
  if (key === 'totalPrice') {
    // 헌터더글라스 제품: 판매단가 * 수량
    if (row.brand?.toLowerCase() === 'hunterdouglas') {
      if (
        typeof row.salePrice === 'number' &&
        typeof row.quantity === 'number'
      ) {
        return Math.round(row.salePrice * row.quantity).toLocaleString();
      }
    }
    // 겉커튼 민자, 나비: salePrice * widthCount
    if (
      row.curtainType === '겉커튼' &&
      (row.pleatType === '민자' || row.pleatType === '나비')
    ) {
      if (
        typeof row.salePrice === 'number' &&
        typeof row.widthCount === 'number'
      ) {
        return Math.round(row.salePrice * row.widthCount).toLocaleString();
      }
    }
    // 속커튼 민자: largePlainPrice * area
    if (row.curtainType === '속커튼' && row.pleatType === '민자') {
      const areaNum = Number(row.area);
      let priceToUse = row.largePlainPrice;
      
      // 대폭민자단가가 없으면 판매단가의 70% 사용
      if (!priceToUse) {
        priceToUse = row.salePrice ? row.salePrice * 0.7 : 0;
      }
      
      if (typeof priceToUse === 'number' && areaNum) {
        return Math.round(priceToUse * areaNum).toLocaleString();
      }
    }
    // 속커튼 나비: salePrice * area
    if (row.curtainType === '속커튼' && row.pleatType === '나비') {
      const areaNum = Number(row.area);
      if (typeof row.salePrice === 'number' && areaNum) {
        return Math.round(row.salePrice * areaNum).toLocaleString();
      }
    }
    // 블라인드: salePrice * area
    if (row.productType === '블라인드') {
      const areaNum = Number(row.area);
      if (typeof row.salePrice === 'number' && areaNum) {
        return Math.round(row.salePrice * areaNum).toLocaleString();
      }
    }
    // 그 외: totalPrice 필드 사용
    if (typeof row.totalPrice === 'number') {
      return row.totalPrice.toLocaleString();
    }
    return row.totalPrice || '';
  }
  if (key === 'cost') {
    if (typeof row.cost === 'number') {
      return row.cost.toLocaleString();
    }
    if (
      typeof row.purchaseCost === 'number' &&
      typeof row.quantity === 'number'
    ) {
      return (row.purchaseCost * row.quantity).toLocaleString();
    }
    return row.cost || '';
  }
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
  if (numericKeys.includes(key)) {
    const value = row[key];
    return typeof value === 'number' ? value.toLocaleString() : value;
  }
  if (key === 'dimensions') {
    const widthMM = row.widthMM;
    const heightMM = row.heightMM;
    if (widthMM && heightMM) {
      return `${widthMM}×${heightMM}`;
    }
    return '';
  }
  if (key === 'productionDimensions') {
    const productionWidth = row.productionWidth;
    const productionHeight = row.productionHeight;
    if (productionWidth && productionHeight) {
      return `${productionWidth}×${productionHeight}`;
    }
    return '';
  }
  if (key === 'lineDir') {
    return row.lineDirection || '';
  }
  if (key === 'lineLen') {
    if (row.lineLength === '직접입력') {
      return row.customLineLength || '';
    }
    return row.lineLength || '';
  }
  const value = row[key];
  if (typeof value === 'number') {
    return value.toLocaleString();
  }
  return value;
};

// 공간별 색상 함수 (견적서와 동일)
const getSpaceColor = (space: string, brightness: number = 1) => {
  const colors: { [key: string]: string } = {
    거실: `rgba(255, 193, 7, ${0.15 * brightness})`,
    안방: `rgba(156, 39, 176, ${0.15 * brightness})`,
    침실: `rgba(33, 150, 243, ${0.15 * brightness})`,
    욕실: `rgba(76, 175, 80, ${0.15 * brightness})`,
    주방: `rgba(255, 87, 34, ${0.15 * brightness})`,
    서재: `rgba(121, 85, 72, ${0.15 * brightness})`,
    아이방: `rgba(233, 30, 99, ${0.15 * brightness})`,
    드레스룸: `rgba(0, 188, 212, ${0.15 * brightness})`,
    베란다: `rgba(255, 152, 0, ${0.15 * brightness})`,
    현관: `rgba(158, 158, 158, ${0.15 * brightness})`,
    기타: `rgba(96, 125, 139, ${0.15 * brightness})`,
  };
  return colors[space] || `rgba(96, 125, 139, ${0.15 * brightness})`;
};

// 자수 계산 함수 추가
const calculateRailLength = (details: string): number => {
  if (!details) return 0;

  let totalLength = 0;
  let processedText = details;

  // "몇자 몇개" 패턴을 찾아서 계산
  // 예: "거실 16자 2개" -> 16*2=32자
  // 예: "안방 11자 1개" -> 11*1=11자
  const pattern1 = /(\d+)자\s*(\d+)개/g;
  let match1;
  while ((match1 = pattern1.exec(details)) !== null) {
    const length = parseInt(match1[1]);
    const count = parseInt(match1[2]);
    if (!isNaN(length) && !isNaN(count)) {
      totalLength += length * count;
      // 처리된 부분을 마킹하여 중복 계산 방지
      processedText = processedText.replace(
        match1[0],
        `[PROCESSED_${length}_${count}]`
      );
    }
  }

  // "몇자" 패턴을 찾아서 계산 (개수가 없는 경우)
  // 예: "2자", "3자" 등의 패턴 (이미 처리된 부분 제외)
  const pattern2 = /(\d+)자/g;
  const matches2 = processedText.match(pattern2);
  if (matches2) {
    matches2.forEach(match => {
      // [PROCESSED_xxx] 패턴이 아닌 경우만 처리
      if (!match.includes('PROCESSED')) {
        const number = parseInt(match.replace(/[^\d]/g, ''));
        if (!isNaN(number)) {
          totalLength += number;
        }
      }
    });
  }

  return totalLength;
};

// [주소에서 네비게이션 주소 추출 함수 복사]
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

const DeliveryManagement: React.FC = () => {
  // 모바일 환경 감지
  const isMobile = useMediaQuery('(max-width:768px)');

  const {
    deliveries = [],
    removeDelivery,
    addASRecord,
    removeDuplicateDeliveries,
    consolidateProjectDeliveries,
    updateDeliveryStatus,
    addPaymentRecord,
    updateDelivery,
    removeASRecord,
    setDeliveries,
  } = useDeliveryStore();
  const { workers, addWorker } = useWorkerStore();
  const [firebaseWorkers, setFirebaseWorkers] = useState<any[]>([]);
  const [isLoadingWorkers, setIsLoadingWorkers] = useState(false);
  const { createDeliveryNotification } = useNotificationStore();
  const { nickname } = useContext(UserContext);

  const [expandedDelivery, setExpandedDelivery] = useState<string | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deliveryToDelete, setDeliveryToDelete] = useState<any>(null);
  const [asDialogOpen, setAsDialogOpen] = useState(false);
  const [selectedDeliveryForAS, setSelectedDeliveryForAS] = useState<any>(null);

  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'info' as 'info' | 'success' | 'error' | 'warning',
  });

  // AS 기록 삭제 관련 상태 추가
  const [asDeleteDialogOpen, setAsDeleteDialogOpen] = useState(false);
  const [asRecordToDelete, setAsRecordToDelete] = useState<{
    delivery: any;
    asRecord: any;
  } | null>(null);

  // 검색 조건 상태
  const [searchConditions, setSearchConditions] = useState(() => ({
    customerName: '',
    projectName: '',
    contact: '',
    address: '',
    searchText: '', // 통합 검색용
  }));

  const [asForm, setAsForm] = useState(() => ({
    productName: '',
    space: '',
    productCode: '',
    productionDimensions: '',
    vendor: '',
    issue: '',
    solution: '',
    cost: '',
    note: '',
    processMethod: '거래처AS' as '거래처AS' | '판매자AS' | '고객직접AS',
  }));

  // 수금 입력 관련 상태 추가
  const [paymentDialogOpen, setPaymentDialogOpen] = useState(false);
  const [selectedDeliveryForPayment, setSelectedDeliveryForPayment] =
    useState<any>(null);
  const [paymentForm, setPaymentForm] = useState({
    amount: '',
    method: '현금' as '현금' | '계좌이체' | '카드',
    note: '',
  });

  // AS 출력 관련 상태 추가
  const [asPrintDialogOpen, setAsPrintDialogOpen] = useState(false);
  const [selectedASForPrint, setSelectedASForPrint] = useState<any>(null);
  const [autoScheduleUpdate, setAutoScheduleUpdate] = useState(false); // 자동 스케줄 업데이트 비활성화 (문제 해결을 위해)

  // AS 출력 관련 상태 추가
  const [asApplicationDialogOpen, setAsApplicationDialogOpen] = useState(false);
  const [selectedASForApplication, setSelectedASForApplication] =
    useState<ASRecord | null>(null);

  // 컬럼 표시 설정 상태
  const [visibleColumns, setVisibleColumns] = useState<{
    [key: string]: boolean;
  }>(() => {
    const initial: { [key: string]: boolean } = {};
    FILTER_FIELDS.forEach(field => {
      initial[field.key] = true; // 기본적으로 모든 컬럼 표시
    });
    return initial;
  });

  // 컬럼 설정 패널 열림/닫힘 상태
  const [columnSettingsOpen, setColumnSettingsOpen] = useState(false);

  // 메모 관련 상태
  const [memoDialogOpen, setMemoDialogOpen] = useState(false);
  const [selectedDeliveryForMemo, setSelectedDeliveryForMemo] =
    useState<any>(null);
  const [memoForm, setMemoForm] = useState({
    content: '',
  });

  // 1. 상태 추가 (컴포넌트 상단)
  const [editingMemoId, setEditingMemoId] = useState<string | null>(null);
  const [editingMemoContent, setEditingMemoContent] = useState('');
  const handleInlineMemoSave = (delivery: any) => {
    updateDelivery(delivery.id, {
      ...delivery,
      memo: editingMemoContent,
      memoCreatedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
    setEditingMemoId(null);
  };

  // Firebase 데이터 로딩 및 실시간 구독
  useEffect(() => {
    const loadDeliveryData = async () => {
      try {
        console.log('Firebase에서 납품 데이터 로드 시작');
        const data = await deliveryService.getDeliveries();
        console.log('Firebase에서 납품 데이터 로드 완료:', data.length, '개');
        
        // Firebase 데이터가 있으면 Zustand store에 설정
        if (data.length > 0) {
          console.log('Firebase 납품 데이터를 Zustand store에 적용:', data);
          // Firebase 데이터를 DeliverySite 타입으로 변환
          const convertedData = data.map((item: any) => ({
            id: item.id,
            customerName: item.customerName || '',
            projectName: item.projectName || '',
            projectType: item.projectType,
            contact: item.contact || '',
            address: item.address || '',
            constructionType: item.constructionType || '제품만',
            constructionDate: item.constructionDate || '',
            constructionTime: item.constructionTime || '',
            constructionWorker: item.constructionWorker,
            vehicleNumber: item.vehicleNumber,
            constructionWorkerPhone: item.constructionWorkerPhone,
            deliveryStatus: item.deliveryStatus || '제품준비중',
            paymentStatus: item.paymentStatus || '미수금',
            totalAmount: item.totalAmount || 0,
            discountAmount: item.discountAmount || 0,
            finalAmount: item.finalAmount || 0,
            paidAmount: item.paidAmount || 0,
            remainingAmount: item.remainingAmount || 0,
            paymentRecords: item.paymentRecords || [],
            asRecords: item.asRecords || [],
            memo: item.memo,
            memoCreatedAt: item.memoCreatedAt,
            createdAt: item.createdAt,
            updatedAt: item.updatedAt,
            items: item.items || [],
            railItems: item.railItems || [],
          }));
          setDeliveries(convertedData);
        } else {
          console.log('Firebase에 납품 데이터가 없습니다.');
        }
      } catch (error) {
        console.error('Firebase 납품 데이터 로드 실패:', error);
      }
    };
    
    loadDeliveryData();
    
    // 실시간 구독 설정
    const unsubscribe = deliveryService.subscribeToDeliveries((data) => {
      console.log('Firebase 실시간 납품 데이터 업데이트:', data.length, '개');
      console.log('📋 현재 납품 ID 목록:', data.map((item: any) => item.id));
      if (data.length > 0) {
        // Firebase 데이터를 DeliverySite 타입으로 변환
        const convertedData = data.map((item: any) => ({
          id: item.id,
          customerName: item.customerName || '',
          projectName: item.projectName || '',
          projectType: item.projectType,
          contact: item.contact || '',
          address: item.address || '',
          constructionType: item.constructionType || '제품만',
          constructionDate: item.constructionDate || '',
          constructionTime: item.constructionTime || '',
          constructionWorker: item.constructionWorker,
          vehicleNumber: item.vehicleNumber,
          constructionWorkerPhone: item.constructionWorkerPhone,
          deliveryStatus: item.deliveryStatus || '제품준비중',
          paymentStatus: item.paymentStatus || '미수금',
          totalAmount: item.totalAmount || 0,
          discountAmount: item.discountAmount || 0,
          finalAmount: item.finalAmount || 0,
          paidAmount: item.paidAmount || 0,
          remainingAmount: item.remainingAmount || 0,
          paymentRecords: item.paymentRecords || [],
          asRecords: item.asRecords || [],
          memo: item.memo,
          memoCreatedAt: item.memoCreatedAt,
          createdAt: item.createdAt,
          updatedAt: item.updatedAt,
          items: item.items || [],
          railItems: item.railItems || [],
        }));
        
        // 중복 데이터 필터링 (같은 ID가 여러 개 있는 경우 최신 것만 유지)
        const uniqueData = convertedData.reduce((acc: any[], current: any) => {
          const existingIndex = acc.findIndex(item => item.id === current.id);
          if (existingIndex === -1) {
            acc.push(current);
          } else {
            // 기존 데이터가 있으면 더 최신 데이터로 교체
            const existing = acc[existingIndex];
            const existingUpdatedAt = existing.updatedAt || existing.createdAt || '';
            const currentUpdatedAt = current.updatedAt || current.createdAt || '';
            
            if (currentUpdatedAt > existingUpdatedAt) {
              acc[existingIndex] = current;
              console.log('🔄 중복 데이터 교체:', current.id, '최신 데이터로 업데이트');
            }
          }
          return acc;
        }, []);
        
        console.log('중복 제거 후 납품 데이터:', uniqueData.length, '개');
        setDeliveries(uniqueData);
      }
    });
    
    // 컴포넌트 언마운트 시 구독 해제
    return () => {
      unsubscribe();
    };
  }, [setDeliveries]);

  // Firebase에서 시공자 데이터 로드
  useEffect(() => {
    const loadFirebaseWorkers = async () => {
      setIsLoadingWorkers(true);
      try {
        console.log('🔥 Firebase에서 시공자 데이터 로드 시작...');
        const data = await workerService.getWorkers();
        console.log('🔥 Firebase 시공자 데이터 로드 완료:', data.length, '개');
        
        if (data.length > 0) {
          setFirebaseWorkers(data);
        } else {
          console.log('🔥 Firebase에 시공자 데이터가 없습니다.');
        }
      } catch (error) {
        console.error('🔥 Firebase 시공자 데이터 로드 실패:', error);
      } finally {
        setIsLoadingWorkers(false);
      }
    };

    loadFirebaseWorkers();
  }, []);

  // Firebase 실시간 시공자 구독 설정
  useEffect(() => {
    console.log('🔥 Firebase 시공자 실시간 구독 설정...');
    const unsubscribe = workerService.subscribeToWorkers((data) => {
      console.log('🔥 Firebase 실시간 시공자 데이터 업데이트:', data.length, '개');
      setFirebaseWorkers(data);
    });

    // 컴포넌트 언마운트 시 구독 해제
    return () => {
      unsubscribe();
    };
  }, []);

  // 계약 생성 시 배송관리 스케줄 생성 이벤트 리스너
  useEffect(() => {
    const handleCreateDeliverySchedule = (event: CustomEvent) => {
      const { deliveryId } = event.detail;
      const delivery = deliveries.find(d => d.id === deliveryId);

      if (delivery && delivery.constructionDate) {
        console.log('계약 생성으로 인한 배송관리 스케줄 생성:', deliveryId);
        createDetailedSchedule(delivery);
      }
    };

    window.addEventListener(
      'createDeliverySchedule',
      handleCreateDeliverySchedule as EventListener
    );

    return () => {
      window.removeEventListener(
        'createDeliverySchedule',
        handleCreateDeliverySchedule as EventListener
      );
    };
  }, [deliveries]);

  // 검색 조건 변경 핸들러
  const handleSearchChange = (field: string, value: string) => {
    setSearchConditions(prev => ({
      ...prev,
      [field]: value,
    }));
  };

  // 검색 조건 초기화
  const handleSearchReset = () => {
    setSearchConditions({
      customerName: '',
      projectName: '',
      contact: '',
      address: '',
      searchText: '',
    });
  };

  // 데이터 정리 함수들
  const handleRemoveDuplicates = () => {
    removeDuplicateDeliveries();
  };

  const handleConsolidateProjects = () => {
    consolidateProjectDeliveries();
  };

  // 납품 데이터 초기화 (Firebase 동기화 문제 해결용)
  const handleResetDeliveries = async () => {
    try {
      console.log('🔄 납품 데이터 초기화 시작...');
      
      // Firebase에서 최신 데이터 다시 로드
      const freshData = await deliveryService.getDeliveries();
      console.log('📥 Firebase에서 새로 로드된 납품 데이터:', freshData.length, '개');
      
      // 로컬 상태 업데이트
      setDeliveries(freshData.map((item: any) => ({
        id: item.id,
        customerName: item.customerName || '',
        projectName: item.projectName || '',
        projectType: item.projectType,
        contact: item.contact || '',
        address: item.address || '',
        constructionType: item.constructionType || '제품만',
        constructionDate: item.constructionDate || '',
        constructionTime: item.constructionTime || '',
        constructionWorker: item.constructionWorker,
        vehicleNumber: item.vehicleNumber,
        constructionWorkerPhone: item.constructionWorkerPhone,
        deliveryStatus: item.deliveryStatus || '제품준비중',
        paymentStatus: item.paymentStatus || '미수금',
        totalAmount: item.totalAmount || 0,
        discountAmount: item.discountAmount || 0,
        finalAmount: item.finalAmount || 0,
        paidAmount: item.paidAmount || 0,
        remainingAmount: item.remainingAmount || 0,
        paymentRecords: item.paymentRecords || [],
        asRecords: item.asRecords || [],
        memo: item.memo,
        memoCreatedAt: item.memoCreatedAt,
        createdAt: item.createdAt,
        updatedAt: item.updatedAt,
        items: item.items || [],
        railItems: item.railItems || [],
      })));
      
      setSnackbar({
        open: true,
        message: `납품 데이터가 초기화되었습니다. (${freshData.length}개)`,
        severity: 'success',
      });
    } catch (error) {
      console.error('❌ 납품 데이터 초기화 실패:', error);
      setSnackbar({
        open: true,
        message: '납품 데이터 초기화에 실패했습니다.',
        severity: 'error',
      });
    }
  };

  // 검색 필터링된 납품 목록
  const filteredDeliveries = deliveries.filter(delivery => {
    const { customerName, projectName, contact, address, searchText } =
      searchConditions;

    // 개별 필드 검색
    const customerMatch =
      customerName === '' ||
      delivery.customerName?.toLowerCase().includes(customerName.toLowerCase());
    const projectMatch =
      projectName === '' ||
      delivery.projectName?.toLowerCase().includes(projectName.toLowerCase());
    const contactMatch =
      contact === '' ||
      delivery.contact?.toLowerCase().includes(contact.toLowerCase());
    const addressMatch =
      address === '' ||
      delivery.address?.toLowerCase().includes(address.toLowerCase());

    // 통합 검색 (searchText가 있을 때)
    let searchTextMatch = true;
    if (searchText !== '') {
      const searchLower = searchText.toLowerCase();
      searchTextMatch =
        delivery.customerName?.toLowerCase().includes(searchLower) ||
        delivery.projectName?.toLowerCase().includes(searchLower) ||
        delivery.contact?.toLowerCase().includes(searchLower) ||
        delivery.address?.toLowerCase().includes(searchLower);
    }

    return (
      customerMatch &&
      projectMatch &&
      contactMatch &&
      addressMatch &&
      searchTextMatch
    );
  });

  // 실제 표시할 데이터: 프로젝트별로 1개만 표시
  const uniqueDeliveries = useMemo(() => {
    const seen = new Set();
    return filteredDeliveries.filter(delivery => {
      if (seen.has(delivery.id)) return false;
      seen.add(delivery.id);
      return true;
    });
  }, [filteredDeliveries]);

  // 제품 상태 색상
  const getStatusColor = (status: string) => {
    switch (status) {
      case '견적':
        return 'default';
      case '주문':
        return 'info';
      case '제작':
        return 'warning';
      case '납품':
        return 'success';
      default:
        return 'default';
    }
  };

  // 우선순위 색상
  const getPriorityColor = (priority: string) => {
    return priority === '긴급' ? 'error' : 'default';
  };

  // 삭제 확인 다이얼로그
  const handleDeleteClick = (delivery: any) => {
    setDeliveryToDelete(delivery);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = () => {
    if (deliveryToDelete) {
      removeDelivery(deliveryToDelete.id);
      setDeleteDialogOpen(false);
      setDeliveryToDelete(null);
    }
  };

  // AS 접수 다이얼로그
  const handleASClick = (delivery: any) => {
    setSelectedDeliveryForAS(delivery);
    setAsDialogOpen(true);
  };

  const handleASSubmit = () => {
    if (selectedDeliveryForAS && asForm.productName && asForm.issue) {
      // 중복 체크: 같은 납품건에 같은 제품명과 문제로 이미 등록된 AS가 있는지 확인
      const existingAS = selectedDeliveryForAS.asRecords?.find(
        (existing: ASRecord) =>
          existing.productName === asForm.productName &&
          existing.issue === asForm.issue
      );

      if (existingAS) {
        setSnackbar({
          open: true,
          message:
            '이미 동일한 제품과 문제로 등록된 AS가 있습니다. 중복 등록을 방지합니다.',
          severity: 'warning',
        });
        setAsDialogOpen(false);
        setSelectedDeliveryForAS(null);
        setAsForm({
          productName: '',
          space: '',
          productCode: '',
          productionDimensions: '',
          vendor: '',
          issue: '',
          solution: '',
          cost: '',
          note: '',
          processMethod: '거래처AS' as '거래처AS' | '판매자AS' | '고객직접AS',
        });
        return;
      }

      const newASRecord: ASRecord = {
        id: uuidv4(),
        date: new Date().toISOString().split('T')[0],
        productName: asForm.productName,
        space: asForm.space,
        productCode: asForm.productCode,
        productionDimensions: asForm.productionDimensions,
        vendor: asForm.vendor,
        issue: asForm.issue,
        solution: asForm.solution,
        status: '접수' as const,
        cost: asForm.cost ? Number(asForm.cost) : undefined,
        note: asForm.note,
        processMethod: asForm.processMethod, // 처리방법 추가
        deliveryId: selectedDeliveryForAS.id,
        customerName: selectedDeliveryForAS.customerName,
        contractNo: selectedDeliveryForAS.projectName,
        contact: selectedDeliveryForAS.contact,
        address: selectedDeliveryForAS.projectName
          ? `${selectedDeliveryForAS.projectName} (고객 주소)`
          : selectedDeliveryForAS.address,
        // 거래처(발주처) 정보 자동 포함
        vendorName: asForm.vendor || selectedDeliveryForAS.vendor || '미지정',
        vendorId: selectedDeliveryForAS.vendorId || '',
        vendorContact: selectedDeliveryForAS.vendorContact || '',
        vendorAddress: selectedDeliveryForAS.vendorAddress || '',
        vendorEmail: selectedDeliveryForAS.vendorEmail || '',
      };

      addASRecord(selectedDeliveryForAS.id, newASRecord);
      setSnackbar({
        open: true,
        message: 'AS 접수가 성공적으로 등록되었습니다.',
        severity: 'success',
      });
      setAsDialogOpen(false);
      setSelectedDeliveryForAS(null);
      setAsForm({
        productName: '',
        space: '',
        productCode: '',
        productionDimensions: '',
        vendor: '',
        issue: '',
        solution: '',
        cost: '',
        note: '',
        processMethod: '거래처AS' as '거래처AS' | '판매자AS' | '고객직접AS',
      });
    }
  };

  // 시공/납품완료 핸들러
  const handleConstructionComplete = (delivery: any, e: React.MouseEvent) => {
    e.stopPropagation(); // 아코디언 열림 방지

    // 현재 상태에 따라 토글
    if (delivery.deliveryStatus === '제품준비중') {
      updateDeliveryStatus(delivery.id, '납품완료');
    } else {
      updateDeliveryStatus(delivery.id, '제품준비중');
    }
  };

  // 수금 입력 핸들러들
  const handlePaymentClick = (delivery: any, e: React.MouseEvent) => {
    e.stopPropagation(); // 아코디언 열림 방지
    setSelectedDeliveryForPayment(delivery);
    setPaymentDialogOpen(true);
  };

  const handlePaymentSubmit = () => {
    if (selectedDeliveryForPayment && paymentForm.amount) {
      const newPaymentRecord = {
        id: Date.now().toString(),
        date: new Date().toISOString().split('T')[0],
        time: new Date().toLocaleTimeString('ko-KR', { hour12: false }),
        amount: Number(paymentForm.amount),
        method: paymentForm.method,
        note: paymentForm.note,
      };

      addPaymentRecord(selectedDeliveryForPayment.id, newPaymentRecord);
      setPaymentDialogOpen(false);
      setSelectedDeliveryForPayment(null);
      setPaymentForm({
        amount: '',
        method: '현금',
        note: '',
      });
    }
  };

  const handlePaymentClose = () => {
    setPaymentDialogOpen(false);
    setSelectedDeliveryForPayment(null);
    setPaymentForm({
      amount: '',
      method: '현금',
      note: '',
    });
  };

  // 메모 관련 핸들러
  const handleMemoSubmit = () => {
    if (selectedDeliveryForMemo && memoForm.content.trim()) {
      const updatedDelivery = {
        ...selectedDeliveryForMemo,
        memo: memoForm.content.trim(),
        memoCreatedAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      updateDelivery(selectedDeliveryForMemo.id, updatedDelivery);

      // 스케줄도 함께 업데이트
      try {
        const savedSchedules = JSON.parse(
          localStorage.getItem('schedules') || '[]'
        );
        const scheduleId = `delivery-${selectedDeliveryForMemo.id}`;
        const scheduleIndex = savedSchedules.findIndex(
          (schedule: any) => schedule.id === scheduleId
        );

        if (scheduleIndex !== -1) {
          // 기존 스케줄 업데이트
          const memoText = memoForm.content.trim()
            ? `\n메모: ${memoForm.content.trim()}`
            : '';
          const existingSchedule = savedSchedules[scheduleIndex];

          // description 업데이트
          const updatedSchedule = {
            ...existingSchedule,
            description: `주소: ${selectedDeliveryForMemo.address}\n연락처: ${selectedDeliveryForMemo.contact}\n할인후금액: ${selectedDeliveryForMemo.finalAmount}\n현재입금액: ${selectedDeliveryForMemo.paidAmount}\n잔액: ${selectedDeliveryForMemo.remainingAmount}${memoText}`,
            updatedAt: new Date().toISOString(),
          };

          // memos 배열에 업무메모 추가
          const newMemo = {
            id: `delivery-memo-${Date.now()}`,
            type: '업무' as const,
            content: memoForm.content.trim(),
            createdAt: new Date().toISOString(),
            createdBy: '납품관리',
            deliveryId: selectedDeliveryForMemo.id,
          };

          // 기존 memos 배열이 없으면 생성
          if (!updatedSchedule.memos) {
            updatedSchedule.memos = [];
          }

          // 기존 납품관리 메모가 있으면 제거하고 새로 추가
          updatedSchedule.memos = updatedSchedule.memos.filter(
            (memo: any) =>
              !(
                memo.deliveryId === selectedDeliveryForMemo.id &&
                memo.createdBy === '납품관리'
              )
          );
          updatedSchedule.memos.push(newMemo);

          savedSchedules[scheduleIndex] = updatedSchedule;
        } else {
          // 새 스케줄 생성 (시공일자가 있는 경우)
          if (selectedDeliveryForMemo.constructionDate) {
            const memoText = memoForm.content.trim()
              ? `\n메모: ${memoForm.content.trim()}`
              : '';
            const newMemo = {
              id: `delivery-memo-${Date.now()}`,
              type: '업무' as const,
              content: memoForm.content.trim(),
              createdAt: new Date().toISOString(),
              createdBy: '납품관리',
              deliveryId: selectedDeliveryForMemo.id,
            };

            const newSchedule = {
              id: scheduleId,
              title: `${selectedDeliveryForMemo.customerName} - 시공/납품 일정`,
              date: selectedDeliveryForMemo.constructionDate,
              time: selectedDeliveryForMemo.constructionTime || '09:00',
              type: '시공',
              description: `주소: ${selectedDeliveryForMemo.address}\n연락처: ${selectedDeliveryForMemo.contact}\n할인후금액: ${selectedDeliveryForMemo.finalAmount}\n현재입금액: ${selectedDeliveryForMemo.paidAmount}\n잔액: ${selectedDeliveryForMemo.remainingAmount}${memoText}`,
              customerName: selectedDeliveryForMemo.customerName,
              address: selectedDeliveryForMemo.address,
              contact: selectedDeliveryForMemo.contact,
              deliveryId: selectedDeliveryForMemo.id,
              color: '#40c4ff',
              priority: '높음',
              status: '예정',
              memos: [newMemo], // 메모 배열에 추가
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
              createdBy: 'system',
            };
            savedSchedules.push(newSchedule);
          }
        }

        localStorage.setItem('schedules', JSON.stringify(savedSchedules));
        console.log('✅ 스케줄 메모 업데이트 완료:', scheduleId);

        // 스케줄 페이지에 알림 (새로고침 없이 반영)
        window.dispatchEvent(
          new CustomEvent('scheduleUpdate', {
            detail: {
              deliveryId: selectedDeliveryForMemo.id,
              memo: memoForm.content.trim(),
            },
          })
        );
      } catch (error) {
        console.error('❌ 스케줄 메모 업데이트 실패:', error);
      }

      setMemoDialogOpen(false);
      setSelectedDeliveryForMemo(null);
      setMemoForm({ content: '' });
    }
  };

  const handleMemoClose = () => {
    setMemoDialogOpen(false);
    setSelectedDeliveryForMemo(null);
    setMemoForm({ content: '' });
  };

  // 상세 스케줄 생성 함수 (표 형태로 상세 정보 포함)
  const createDetailedSchedule = async (delivery: any) => {
    try {
      // 필수 데이터 검증
      if (
        !delivery.id ||
        !delivery.customerName ||
        !delivery.constructionDate
      ) {
        console.warn(`스케줄 생성 건너뜀 - 필수 데이터 누락:`, {
          id: delivery.id,
          customerName: delivery.customerName,
          constructionDate: delivery.constructionDate,
        });
        return;
      }

      // 프로젝트 단위 스케줄 ID 생성 (고객명 + 주소 기반, 시공일시 무관)
      const addressKey = delivery.address?.replace(/[^가-힣a-zA-Z0-9]/g, '').substring(0, 10) || '';
      const projectId = `delivery-${delivery.customerName}_${addressKey}`;
      
      console.log('🔍 스케줄 중복 확인:', projectId);
      
      // 기존 스케줄이 있는지 확인 (Firebase에서 조회)
      try {
        const scheduleResponse = await fetch(
          `https://us-central1-windowerp-3.cloudfunctions.net/schedules?id=${projectId}`,
          {
            method: 'GET',
            headers: {
              'Content-Type': 'application/json',
            },
          }
        );
        
        if (scheduleResponse.ok) {
          const existingSchedules = await scheduleResponse.json();
          if (existingSchedules.length > 0) {
            console.log('✅ 기존 스케줄 발견 - 업데이트 모드:', projectId);
          } else {
            console.log('🆕 새 스케줄 생성 모드:', projectId);
          }
        }
      } catch (error) {
        console.warn('스케줄 중복 확인 실패 (계속 진행):', error);
      }

      // 카테고리 색상 가져오기 함수
      const getCategoryColor = (categoryId: string) => {
        try {
          const categories = JSON.parse(
            localStorage.getItem('scheduleCategories') || '[]'
          );
          const category = categories.find((cat: any) => cat.id === categoryId);
          return category?.color || '#424242';
        } catch (error) {
          console.error('카테고리 색상 가져오기 오류:', error);
          return '#424242';
        }
      };

      // 1. 고객정보
      const customerInfo = `고객명: ${delivery.customerName}\n연락처: <a href=\"tel:${delivery.contact?.replace(/[^\d]/g, '')}\">${delivery.contact}</a>\n주소: ${delivery.address}`;

      // 2. 제품상세정보 표
      let productTable =
        '┌────┬────┬────┬────────────┬────┬──────┬────┬────┐\n';
      productTable +=
        '│거래처│공간│제품코드│제작사이즈│줄방향│줄길이│주름양│폭수│\n';
      productTable += '├────┼────┼────┼────────────┼────┼──────┼────┼────┤\n';
      (delivery.items || []).forEach((item: any) => {
        const vendor = item.vendor || '-';
        const space = item.space || '-';
        const productCode = item.productCode || '-';
        const size =
          (item.widthMM || item.width || '-') +
          '*' +
          (item.heightMM || item.height || '-');
        const lineDir = item.lineDirection || '-';
        const lineLen = item.lineLength || '-';
        const pleat = item.pleatAmount || '-';
        const widthCount = item.widthCount || '-';
        productTable += `│${vendor}│${space}│${productCode}│${size}│${lineDir}│${lineLen}│${pleat}│${widthCount}│\n`;
      });
      productTable += '└────┴────┴────┴────────────┴────┴──────┴────┴────┘\n';

      // 3. 레일정보(서술)
      let railDesc = '';
      if (delivery.railItems && delivery.railItems.length > 0) {
        const railList = (delivery.railItems || [])
          .map((railItem: any) => {
            const details = railItem.specification || railItem.details || '';
            const pattern = /(\d+)자\s*(\d+)개/g;
            let result: string[] = [];
            let match;
            while ((match = pattern.exec(details)) !== null) {
              result.push(`${match[1]}자 ${match[2]}개`);
            }
            // "몇자"만 있는 경우
            if (result.length === 0) {
              const pattern2 = /(\d+)자/g;
              let match2;
              while ((match2 = pattern2.exec(details)) !== null) {
                result.push(`${match2[1]}자 1개`);
              }
            }
            return result.join(', ');
          })
          .filter(Boolean)
          .join(', ');
        railDesc = railList;
      }

      // 4. 금액정보
      const amountInfo = `할인후금액: ${(delivery.finalAmount || 0).toLocaleString()}원 / 현재입금액: ${(delivery.paidAmount || 0).toLocaleString()}원 / 잔액: ${(delivery.remainingAmount || 0).toLocaleString()}원`;

      // 최종 설명
      const fullDescription =
        `[고객정보]\n${customerInfo}\n\n` +
        `[제품상세정보]\n${productTable}\n` +
        (railDesc ? `[레일정보]\n${railDesc}\n\n` : '') +
        `[금액정보]\n${amountInfo}`;

      // 상세 주소 포함된 title 생성
      const navAddress = extractNavigationAddress(delivery.address || '');
      const timeStr = delivery.constructionTime || '09:00';
      const scheduleTitle = navAddress
        ? `시공-${navAddress}-${timeStr}`
        : `시공-${timeStr}`;

      const scheduleData = {
        id: projectId,
        title: scheduleTitle,
        date: delivery.constructionDate,
        time: delivery.constructionTime || '09:00',
        type: '시공',
        description: fullDescription,
        customerName: delivery.customerName || '',
        address: delivery.address || '',
        contact: delivery.contact || '',
        deliveryId: delivery.id,
        status: '예정',
        priority: '높음',
        color: getCategoryColor('3'), // 카테고리 색상 동적 적용
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        createdBy: 'system',
        constructionWorker: delivery.constructionWorker || '',
        constructionWorkerPhone: delivery.constructionWorkerPhone || '',
        vehicleNumber: delivery.vehicleNumber || '',
      };

      console.log('스케줄 데이터 전송:', {
        id: projectId,
        title: scheduleTitle,
        date: delivery.constructionDate,
        customerName: delivery.customerName,
        address: delivery.address?.substring(0, 20) + '...',
      });

      // Firebase Functions에 스케줄 저장
      const response = await fetch(
        `https://us-central1-windowerp-3.cloudfunctions.net/schedules`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(scheduleData),
        }
      );

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`스케줄 등록 실패 (${projectId}):`, {
          status: response.status,
          statusText: response.statusText,
          error: errorText,
        });

        // 500 에러인 경우 더 자세한 로깅
        if (response.status === 500) {
          console.error('서버 내부 오류 - 전송된 데이터:', scheduleData);
        }
        throw new Error(`스케줄 등록 실패: ${response.status} ${response.statusText}`);
      } else {
        const result = await response.json();
        console.log(`✅ 상세 스케줄 등록 성공: ${projectId}`, result);
        return result; // 응답 결과 반환
      }
    } catch (error) {
      console.error(`스케줄 등록 중 오류 (${delivery.id}):`, error);

      // 네트워크 오류인지 확인
      if (error instanceof TypeError && error.message.includes('fetch')) {
        console.error('네트워크 오류 - 서버가 실행 중인지 확인하세요');
      }
    }
  };

  const handleExportASAsPDF = async () => {
    if (!selectedASForPrint) return;

    try {
      const { default: jsPDF } = await import('jspdf');
      const { default: html2canvas } = await import('html2canvas');

      const printContent = `
        <!DOCTYPE html>
        <html>
          <head>
            <title>AS신청서</title>
            <style>
              body { font-family: Arial, sans-serif; margin: 20px; background: white; }
              .header { text-align: center; margin-bottom: 30px; }
              .title { font-size: 24px; font-weight: bold; margin-bottom: 10px; }
              .subtitle { font-size: 16px; color: #666; }
              .info-section { margin-bottom: 20px; }
              .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
              .info-item { margin-bottom: 10px; }
              .label { font-weight: bold; color: #333; }
              .value { margin-left: 10px; }
              .issue-section { margin: 20px 0; }
              .issue-title { font-weight: bold; margin-bottom: 10px; }
              .issue-content { background: #f5f5f5; padding: 15px; border-radius: 5px; }
              .signature-section { margin-top: 40px; text-align: center; }
              .signature-line { border-top: 1px solid #000; width: 200px; display: inline-block; margin: 0 20px; }
            </style>
          </head>
          <body>
            <div class="header">
              <div class="title">AS신청서 (거래처)</div>
              <div class="subtitle">After Service Request Form</div>
            </div>
            
            <div class="info-section">
              <div class="info-grid">
                <div class="info-item">
                  <span class="label">신청일자:</span>
                  <span class="value">${selectedASForPrint.date}</span>
                </div>
                <div class="info-item">
                  <span class="label">고객명:</span>
                  <span class="value">${selectedASForPrint.customerName || '-'}</span>
                </div>
                <div class="info-item">
                  <span class="label">프로젝트:</span>
                  <span class="value">${selectedASForPrint.contractNo || '-'}</span>
                </div>
                <div class="info-item">
                  <span class="label">거래처:</span>
                  <span class="value">${selectedASForPrint.vendor || '-'}</span>
                </div>
                <div class="info-item">
                  <span class="label">공간:</span>
                  <span class="value">${selectedASForPrint.space || '-'}</span>
                </div>
                <div class="info-item">
                  <span class="label">제품코드:</span>
                  <span class="value">${selectedASForPrint.productCode || '-'}</span>
                </div>
                <div class="info-item">
                  <span class="label">제작사이즈:</span>
                  <span class="value">${selectedASForPrint.productionDimensions || '-'}</span>
                </div>
                <div class="info-item">
                  <span class="label">제품명:</span>
                  <span class="value">${selectedASForPrint.productName}</span>
                </div>
              </div>
            </div>
            
            <div class="issue-section">
              <div class="issue-title">문제점</div>
              <div class="issue-content">${selectedASForPrint.issue}</div>
            </div>
            
            ${
              selectedASForPrint.solution
                ? `
            <div class="issue-section">
              <div class="issue-title">해결방안</div>
              <div class="issue-content">${selectedASForPrint.solution}</div>
            </div>
            `
                : ''
            }
            
            <div class="info-section">
              <div class="info-grid">
                <div class="info-item">
                  <span class="label">비용:</span>
                  <span class="value">${selectedASForPrint.cost ? selectedASForPrint.cost.toLocaleString() + '원' : '-'}</span>
                </div>
                <div class="info-item">
                  <span class="label">상태:</span>
                  <span class="value">${selectedASForPrint.status}</span>
                </div>
              </div>
            </div>
            
            ${
              selectedASForPrint.note
                ? `
            <div class="issue-section">
              <div class="issue-title">메모</div>
              <div class="issue-content">${selectedASForPrint.note}</div>
            </div>
            `
                : ''
            }
            
            <div class="signature-section">
              <div class="signature-line"></div>
              <span>신청자 서명</span>
              <div class="signature-line"></div>
              <span>처리자 서명</span>
            </div>
          </body>
        </html>
      `;

      const printWindow = window.open('', '_blank');
      if (printWindow) {
        printWindow.document.write(printContent);
        printWindow.document.close();

        const canvas = await html2canvas(printWindow.document.body, {
          backgroundColor: '#ffffff',
          scale: 2,
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

        pdf.save(
          `AS신청서_${selectedASForPrint.customerName}_${selectedASForPrint.date}.pdf`
        );
        printWindow.close();
      }
    } catch (error) {
      console.error('PDF 변환 중 오류:', error);
      alert('PDF 변환 중 오류가 발생했습니다.');
    }
  };

  // 스케줄 자동 등록/수정 로직
  // deliveries가 변경될 때 자동으로 스케줄 등록 (자동 저장 비활성화)
  // useEffect(() => {
  //   const registerSchedules = async () => {
  //     for (const delivery of deliveries) {
  //       if (delivery.constructionDate) {
  //         if (delivery.constructionDate) {
  //           // 상세 스케줄 생성 함수 사용
  //           await createDetailedSchedule(delivery);
  //         }
  //       }
  //     }
  //   };

  //   // deliveries가 변경될 때만 실행
  //   if (deliveries.length > 0) {
  //     registerSchedules();
  //   }
  // }, [deliveries.length]); // 의존성을 단순화

  // AS 출력 핸들러들
  const handleASPrint = (asRecord: any) => {
    setSelectedASForApplication(asRecord);
    setAsApplicationDialogOpen(true);
  };

  const handlePrintAS = () => {
    if (!selectedASForPrint) return;

    const printContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>AS신청서</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 20px; }
            .header { text-align: center; margin-bottom: 30px; }
            .title { font-size: 24px; font-weight: bold; margin-bottom: 10px; }
            .subtitle { font-size: 16px; color: #666; }
            .info-section { margin-bottom: 20px; }
            .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
            .info-item { margin-bottom: 10px; }
            .label { font-weight: bold; color: #333; }
            .value { margin-left: 10px; }
            .issue-section { margin: 20px 0; }
            .issue-title { font-weight: bold; margin-bottom: 10px; }
            .issue-content { background: #f5f5f5; padding: 15px; border-radius: 5px; }
            .signature-section { margin-top: 40px; text-align: center; }
            .signature-line { border-top: 1px solid #000; width: 200px; display: inline-block; margin: 0 20px; }
            @media print { body { margin: 0; } }
          </style>
        </head>
        <body>
          <div class="header">
            <div class="title">AS신청서 (거래처)</div>
            <div class="subtitle">After Service Request Form</div>
          </div>
          
          <div class="info-section">
            <div class="info-grid">
              <div class="info-item">
                <span class="label">신청일자:</span>
                <span class="value">${selectedASForPrint.date}</span>
              </div>
              <div class="info-item">
                <span class="label">고객명:</span>
                <span class="value">${selectedASForPrint.customerName || '-'}</span>
              </div>
              <div class="info-item">
                <span class="label">프로젝트:</span>
                <span class="value">${selectedASForPrint.contractNo || '-'}</span>
              </div>
              <div class="info-item">
                <span class="label">거래처:</span>
                <span class="value">${selectedASForPrint.vendor || '-'}</span>
              </div>
              <div class="info-item">
                <span class="label">공간:</span>
                <span class="value">${selectedASForPrint.space || '-'}</span>
              </div>
              <div class="info-item">
                <span class="label">제품코드:</span>
                <span class="value">${selectedASForPrint.productCode || '-'}</span>
              </div>
              <div class="info-item">
                <span class="label">제작사이즈:</span>
                <span class="value">${selectedASForPrint.productionDimensions || '-'}</span>
              </div>
              <div class="info-item">
                <span class="label">제품명:</span>
                <span class="value">${selectedASForPrint.productName}</span>
              </div>
            </div>
          </div>
          
          <div class="issue-section">
            <div class="issue-title">문제점</div>
            <div class="issue-content">${selectedASForPrint.issue}</div>
          </div>
          
          ${
            selectedASForPrint.solution
              ? `
          <div class="issue-section">
            <div class="issue-title">해결방안</div>
            <div class="issue-content">${selectedASForPrint.solution}</div>
          </div>
          `
              : ''
          }
          
          <div class="info-section">
            <div class="info-grid">
              <div class="info-item">
                <span class="label">비용:</span>
                <span class="value">${selectedASForPrint.cost ? selectedASForPrint.cost.toLocaleString() + '원' : '-'}</span>
              </div>
              <div class="info-item">
                <span class="label">상태:</span>
                <span class="value">${selectedASForPrint.status}</span>
              </div>
            </div>
          </div>
          
          ${
            selectedASForPrint.note
              ? `
          <div class="issue-section">
            <div class="issue-title">메모</div>
            <div class="issue-content">${selectedASForPrint.note}</div>
          </div>
          `
              : ''
          }
          
          <div class="signature-section">
            <div class="signature-line"></div>
            <span>신청자 서명</span>
            <div class="signature-line"></div>
            <span>처리자 서명</span>
          </div>
        </body>
      </html>
    `;

    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(printContent);
      printWindow.document.close();
      printWindow.print();
    }
  };

  const handleExportASAsJPG = async () => {
    if (!selectedASForPrint) return;

    try {
      const printContent = `
        <!DOCTYPE html>
        <html>
          <head>
            <title>AS신청서</title>
            <style>
              body { font-family: Arial, sans-serif; margin: 20px; background: white; }
              .header { text-align: center; margin-bottom: 30px; }
              .title { font-size: 24px; font-weight: bold; margin-bottom: 10px; }
              .subtitle { font-size: 16px; color: #666; }
              .info-section { margin-bottom: 20px; }
              .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
              .info-item { margin-bottom: 10px; }
              .label { font-weight: bold; color: #333; }
              .value { margin-left: 10px; }
              .issue-section { margin: 20px 0; }
              .issue-title { font-weight: bold; margin-bottom: 10px; }
              .issue-content { background: #f5f5f5; padding: 15px; border-radius: 5px; }
              .signature-section { margin-top: 40px; text-align: center; }
              .signature-line { border-top: 1px solid #000; width: 200px; display: inline-block; margin: 0 20px; }
            </style>
          </head>
          <body>
            <div class="header">
              <div class="title">AS신청서 (거래처)</div>
              <div class="subtitle">After Service Request Form</div>
            </div>
            
            <div class="info-section">
              <div class="info-grid">
                <div class="info-item">
                  <span class="label">신청일자:</span>
                  <span class="value">${selectedASForPrint.date}</span>
                </div>
                <div class="info-item">
                  <span class="label">고객명:</span>
                  <span class="value">${selectedASForPrint.customerName || '-'}</span>
                </div>
                <div class="info-item">
                  <span class="label">프로젝트:</span>
                  <span class="value">${selectedASForPrint.contractNo || '-'}</span>
                </div>
                <div class="info-item">
                  <span class="label">거래처:</span>
                  <span class="value">${selectedASForPrint.vendor || '-'}</span>
                </div>
                <div class="info-item">
                  <span class="label">공간:</span>
                  <span class="value">${selectedASForPrint.space || '-'}</span>
                </div>
                <div class="info-item">
                  <span class="label">제품코드:</span>
                  <span class="value">${selectedASForPrint.productCode || '-'}</span>
                </div>
                <div class="info-item">
                  <span class="label">제작사이즈:</span>
                  <span class="value">${selectedASForPrint.productionDimensions || '-'}</span>
                </div>
                <div class="info-item">
                  <span class="label">제품명:</span>
                  <span class="value">${selectedASForPrint.productName}</span>
                </div>
              </div>
            </div>
            
            <div class="issue-section">
              <div class="issue-title">문제점</div>
              <div class="issue-content">${selectedASForPrint.issue}</div>
            </div>
            
            ${
              selectedASForPrint.solution
                ? `
            <div class="issue-section">
              <div class="issue-title">해결방안</div>
              <div class="issue-content">${selectedASForPrint.solution}</div>
            </div>
            `
                : ''
            }
            
            <div class="info-section">
              <div class="info-grid">
                <div class="info-item">
                  <span class="label">비용:</span>
                  <span class="value">${selectedASForPrint.cost ? selectedASForPrint.cost.toLocaleString() + '원' : '-'}</span>
                </div>
                <div class="info-item">
                  <span class="label">상태:</span>
                  <span class="value">${selectedASForPrint.status}</span>
                </div>
              </div>
            </div>
            
            ${
              selectedASForPrint.note
                ? `
            <div class="issue-section">
              <div class="issue-title">메모</div>
              <div class="issue-content">${selectedASForPrint.note}</div>
            </div>
            `
                : ''
            }
            
            <div class="signature-section">
              <div class="signature-line"></div>
              <span>신청자 서명</span>
              <div class="signature-line"></div>
              <span>처리자 서명</span>
            </div>
          </body>
        </html>
      `;

      const printWindow = window.open('', '_blank');
      if (printWindow) {
        printWindow.document.write(printContent);
        printWindow.document.close();

        // html2canvas를 사용하여 JPG로 변환
        const { default: html2canvas } = await import('html2canvas');
        const canvas = await html2canvas(printWindow.document.body, {
          backgroundColor: '#ffffff',
          scale: 2,
        });

        const link = document.createElement('a');
        link.download = `AS신청서_${selectedASForPrint.customerName}_${selectedASForPrint.date}.jpg`;
        link.href = canvas.toDataURL('image/jpeg', 0.9);
        link.click();

        printWindow.close();
      }
    } catch (error) {
      console.error('JPG 변환 중 오류:', error);
      alert('JPG 변환 중 오류가 발생했습니다.');
    }
  };

  // AS방문일자 변경 시 스케줄 업데이트 함수
  const updateASSchedule = async (asRecord: any, delivery: any) => {
    try {
      if (!asRecord.visitDate) {
        console.log('AS방문일자가 없어서 스케줄 등록을 건너뜁니다.');
        return;
      }

      const scheduleId = `as-${asRecord.id}`;

      // 카테고리 색상 가져오기 함수
      const getCategoryColor = (categoryId: string) => {
        try {
          const categories = JSON.parse(
            localStorage.getItem('scheduleCategories') || '[]'
          );
          const category = categories.find((cat: any) => cat.id === categoryId);
          return category?.color || '#424242';
        } catch (error) {
          console.error('카테고리 색상 가져오기 오류:', error);
          return '#424242';
        }
      };

      // datetime-local 값을 날짜와 시간으로 분리
      const visitDateTime = new Date(asRecord.visitDate);
      // 로컬 시간대를 고려하여 날짜와 시간 추출
      const year = visitDateTime.getFullYear();
      const month = String(visitDateTime.getMonth() + 1).padStart(2, '0');
      const day = String(visitDateTime.getDate()).padStart(2, '0');
      const hours = String(visitDateTime.getHours()).padStart(2, '0');
      const minutes = String(visitDateTime.getMinutes()).padStart(2, '0');

      const visitDate = `${year}-${month}-${day}`;
      const visitTime = `${hours}:${minutes}`;

      // 상세 주소 추출
      const navAddress = extractNavigationAddress(delivery.address || '');
      const scheduleTitle = navAddress
        ? `${delivery.customerName} - ${navAddress} - AS`
        : `${delivery.customerName} - AS`;

      // AS 상세 정보
      const asDescription = `[AS 정보]\n제품: ${asRecord.productName}\n문제: ${asRecord.issue}\n해결: ${asRecord.solution}\n처리방법: ${asRecord.processMethod || '미지정'}\n상태: ${asRecord.status}${asRecord.cost ? `\n비용: ${asRecord.cost.toLocaleString()}원` : ''}${asRecord.note ? `\n메모: ${asRecord.note}` : ''}\n\n[고객정보]\n고객명: ${delivery.customerName}\n연락처: ${delivery.contact}\n주소: ${delivery.address}`;

      // AS 카테고리를 동적으로 찾기
      const categories = JSON.parse(
        localStorage.getItem('scheduleCategories') || '[]'
      );
      const asCategory = categories.find((cat: any) => cat.name === 'AS');
      const asCategoryId = asCategory ? asCategory.id : '4'; // fallback
      const asCategoryColor = asCategory
        ? asCategory.color
        : getCategoryColor('4'); // fallback

      const scheduleData = {
        id: scheduleId,
        title: scheduleTitle,
        date: visitDate,
        time: visitTime,
        type: 'AS',
        description: asDescription,
        customerName: delivery.customerName || '',
        address: delivery.address || '',
        contact: delivery.contact || '',
        deliveryId: delivery.id,
        asId: asRecord.id,
        status: '예정',
        priority: '높음',
        categoryId: asCategoryId, // 동적으로 찾은 AS 카테고리 ID
        color: asCategoryColor, // 동적으로 찾은 AS 카테고리 색상
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        createdBy: 'system',
      };

      console.log('AS 스케줄 데이터 전송:', {
        id: scheduleId,
        title: scheduleTitle,
        date: visitDate,
        time: visitTime,
      });

      // 서버에 PUT(있으면 수정, 없으면 생성)
      const response = await fetch(
        `/schedules/${encodeURIComponent(scheduleId)}`,
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            Accept: 'application/json',
          },
          body: JSON.stringify(scheduleData),
        }
      );

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`AS 스케줄 등록 실패 (${scheduleId}):`, {
          status: response.status,
          statusText: response.statusText,
          error: errorText,
        });
      } else {
        const result = await response.json();
        console.log(`✅ AS 스케줄 등록 성공: ${scheduleId}`, result);
      }
    } catch (error) {
      console.error(`AS 스케줄 등록 중 오류 (${asRecord.id}):`, error);
    }
  };

  // AS 기록 삭제 관련 핸들러들
  const handleASDeleteClick = (delivery: any, asRecord: any) => {
    setAsRecordToDelete({ delivery, asRecord });
    setAsDeleteDialogOpen(true);
  };

  const handleASDeleteConfirm = async () => {
    if (asRecordToDelete) {
      const { delivery, asRecord } = asRecordToDelete;

      try {
        // 1. AS 기록 삭제
        removeASRecord(delivery.id, asRecord.id);

        // 2. 캘린더에서 해당 AS 일정 삭제
        const scheduleId = `as-${asRecord.id}`;
        const response = await fetch(
          `/schedules/${encodeURIComponent(scheduleId)}`,
          {
            method: 'DELETE',
            headers: {
              'Content-Type': 'application/json',
              Accept: 'application/json',
            },
          }
        );

        if (response.ok) {
          console.log(`✅ AS 스케줄 삭제 성공: ${scheduleId}`);
          setSnackbar({
            open: true,
            message: 'AS 기록과 캘린더 일정이 모두 삭제되었습니다.',
            severity: 'success',
          });
        } else {
          console.warn(
            `⚠️ AS 스케줄 삭제 실패 (${scheduleId}):`,
            response.status,
            response.statusText
          );
          setSnackbar({
            open: true,
            message: 'AS 기록은 삭제되었지만 캘린더 일정 삭제에 실패했습니다.',
            severity: 'warning',
          });
        }
      } catch (error) {
        console.error('AS 기록 삭제 중 오류:', error);
        setSnackbar({
          open: true,
          message: 'AS 기록 삭제 중 오류가 발생했습니다.',
          severity: 'error',
        });
      }

      setAsDeleteDialogOpen(false);
      setAsRecordToDelete(null);
    }
  };

  // 1. 상태 추가
  const [showCuteASForm, setShowCuteASForm] = useState(false);
  const [selectedASForCuteForm, setSelectedASForCuteForm] =
    useState<ASRecord | null>(null);

  const handleStatusChange = (deliveryId: string, newStatus: string) => {
    const delivery = deliveries.find(d => d.id === deliveryId);
    if (delivery) {
      updateDelivery(deliveryId, {
        ...delivery,
        deliveryStatus: newStatus as any,
      });
    }
  };

  const handleMemoChange = (deliveryId: string, newMemo: string) => {
    const delivery = deliveries.find(d => d.id === deliveryId);
    if (delivery) {
      updateDelivery(deliveryId, { ...delivery, memo: newMemo });
    }
  };

  const [orderDetailModalGroup, setOrderDetailModalGroup] = useState<
    Order[] | null
  >(null);

  const [workerDialogOpen, setWorkerDialogOpen] = useState(false);
  const [newWorker, setNewWorker] = useState({
    name: '',
    phone: '',
    vehicleNumber: '',
  });



  return (
    <Box
      sx={{
        height: '100vh',
        display: 'flex',
        flexDirection: 'column',
        backgroundColor: 'var(--background-color)',
      }}
    >
      {/* 검색 조건과 통계 정보 - 한 줄에 배치 */}
      <Box sx={{ p: 1, backgroundColor: 'var(--surface-color)' }}>
        <Grid container spacing={1} alignItems="center">
          {/* 검색창 */}
          <Grid item xs={12} md={3}>
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 1,
                backgroundColor: 'var(--background-color)',
                backdropFilter: 'blur(10px)',
                border: '1px solid var(--border-color)',
                borderRadius: 1,
                p: 1,
                height: '100%',
              }}
            >
              <SearchIcon sx={{ color: 'var(--primary-color)', fontSize: '1.2rem' }} />
              <TextField
                placeholder="고객명, 프로젝트명, 연락처, 주소로 검색..."
                variant="outlined"
                size="small"
                value={searchConditions.searchText}
                onChange={e => {
                  const value = e.target.value;
                  setSearchConditions(prev => ({
                    ...prev,
                    searchText: value,
                  }));
                }}
                sx={{
                  flex: 1,
                  '& .MuiOutlinedInput-root': {
                    color: 'var(--text-color)',
                    fontSize: '0.85rem',
                    '& fieldset': {
                      borderColor: 'var(--border-color)',
                    },
                    '&:hover fieldset': {
                      borderColor: 'var(--hover-color)',
                    },
                    '&.Mui-focused fieldset': {
                      borderColor: 'var(--primary-color)',
                    },
                  },
                  '& .MuiInputBase-input::placeholder': {
                    color: 'var(--text-secondary-color)',
                    opacity: 1,
                  },
                }}
              />
              <Button
                variant="outlined"
                size="small"
                onClick={handleSearchReset}
                sx={{
                  color: 'var(--text-secondary-color)',
                  borderColor: 'var(--border-color)',
                  fontSize: '0.75rem',
                  py: 0.5,
                  px: 1,
                  minWidth: 'auto',
                  '&:hover': {
                    borderColor: 'var(--primary-color)',
                    color: 'var(--primary-color)',
                  },
                }}
              >
                초기화
              </Button>
              <Chip
                label={`${uniqueDeliveries.length}건`}
                color="primary"
                variant="outlined"
                size="small"
                sx={{
                  borderColor: '#40c4ff',
                  color: '#40c4ff',
                  fontWeight: 'bold',
                  fontSize: '0.75rem',
                  height: '24px',
                }}
              />
              <Chip
                label={autoScheduleUpdate ? '자동업데이트 ON' : '자동업데이트 OFF'}
                color={autoScheduleUpdate ? 'success' : 'default'}
                variant="outlined"
                size="small"
                sx={{
                  fontSize: '0.7rem',
                  height: '20px',
                  ml: 1,
                }}
              />
              <Button
                variant="outlined"
                size="small"
                onClick={handleResetDeliveries}
                sx={{
                  fontSize: '0.7rem',
                  height: '20px',
                  ml: 1,
                  color: 'orange',
                  borderColor: 'orange',
                  '&:hover': {
                    borderColor: 'darkorange',
                    color: 'darkorange',
                  },
                }}
              >
                데이터초기화
              </Button>
            </Box>
          </Grid>

          {/* 전체 시공일정 저장 버튼 */}
          <Grid item xs={12} md={2}>
            <Button
              variant="contained"
              color="primary"
              fullWidth
              onClick={async () => {
                const deliveriesWithConstructionDate = deliveries.filter(
                  delivery => delivery.constructionDate
                );
                
                if (deliveriesWithConstructionDate.length === 0) {
                  setSnackbar({
                    open: true,
                    message: '시공일자가 있는 납품이 없습니다.',
                    severity: 'warning',
                  });
                  return;
                }

                try {
                  let successCount = 0;
                  let errorCount = 0;

                  for (const delivery of deliveriesWithConstructionDate) {
                    try {
                      await createDetailedSchedule(delivery);
                      successCount++;
                    } catch (error) {
                      console.error(`시공일정 저장 실패 (${delivery.customerName}):`, error);
                      errorCount++;
                    }
                  }

                  if (errorCount === 0) {
                    setSnackbar({
                      open: true,
                      message: `${successCount}개의 시공일정이 스케줄에 저장되었습니다.`,
                      severity: 'success',
                    });
                  } else {
                    setSnackbar({
                      open: true,
                      message: `${successCount}개 성공, ${errorCount}개 실패했습니다.`,
                      severity: 'warning',
                    });
                  }
                } catch (error) {
                  console.error('전체 시공일정 저장 실패:', error);
                  setSnackbar({
                    open: true,
                    message: '전체 시공일정 저장에 실패했습니다.',
                    severity: 'error',
                  });
                }
              }}
              sx={{
                backgroundColor: '#40c4ff',
                '&:hover': { backgroundColor: '#33a3cc' },
                height: '100%',
                fontSize: '0.8rem',
              }}
            >
              전체 시공일정 저장
            </Button>
          </Grid>

          {/* 통계 정보 - 좌측 정렬 */}
          <Grid item xs={3} md={1.5}>
            <Box
              sx={{
                backgroundColor: 'var(--background-color)',
                p: 1,
                borderRadius: 1,
                textAlign: 'left',
                border: '1px solid var(--border-color)',
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
                alignItems: 'flex-start',
              }}
            >
              <Typography
                variant="h6"
                sx={{
                  color: 'var(--primary-color)',
                  fontWeight: 'bold',
                  fontSize: '1.5rem',
                }}
              >
                {uniqueDeliveries.length}
              </Typography>
              <Typography
                variant="caption"
                sx={{ color: 'var(--text-secondary-color)', fontSize: '0.7rem' }}
              >
                전체
              </Typography>
            </Box>
          </Grid>
          <Grid item xs={3} md={1.5}>
            <Box
              sx={{
                backgroundColor: 'var(--background-color)',
                p: 1,
                borderRadius: 1,
                textAlign: 'left',
                border: '1px solid var(--border-color)',
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
                alignItems: 'flex-start',
              }}
            >
              <Typography
                variant="h6"
                sx={{
                  color: '#ff6b6b',
                  fontWeight: 'bold',
                  fontSize: '1.5rem',
                }}
              >
                {uniqueDeliveries.filter(d => d.deliveryStatus === '제품준비중').length}
              </Typography>
              <Typography
                variant="caption"
                sx={{ color: 'var(--text-secondary-color)', fontSize: '0.7rem' }}
              >
                준비중
              </Typography>
            </Box>
          </Grid>
          <Grid item xs={3} md={1.5}>
            <Box
              sx={{
                backgroundColor: 'var(--background-color)',
                p: 1,
                borderRadius: 1,
                textAlign: 'left',
                border: '1px solid var(--border-color)',
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
                alignItems: 'flex-start',
              }}
            >
              <Typography
                variant="h6"
                sx={{
                  color: '#ff9800',
                  fontWeight: 'bold',
                  fontSize: '1.5rem',
                }}
              >
                {uniqueDeliveries.filter(d => d.paymentStatus === '미수금').length}
              </Typography>
              <Typography
                variant="caption"
                sx={{ color: 'var(--text-secondary-color)', fontSize: '0.7rem' }}
              >
                미수금
              </Typography>
            </Box>
          </Grid>


        </Grid>
      </Box>

      {/* 납품 목록 */}
      <Box sx={{ flex: 1, overflowY: 'auto', p: 2 }}>
        {uniqueDeliveries.length > 0 ? (
          uniqueDeliveries.map(delivery => (
            <Accordion
              key={delivery.id}
              expanded={expandedDelivery === delivery.id}
              sx={{
                mb: 3,
                backgroundColor: '#2d2d2d',
                color: '#e0e6ed',
                '&:before': { display: 'none' },
                borderRadius: 3,
                overflow: 'hidden',
                boxShadow:
                  '0 8px 32px rgba(0,0,0,0.3), 0 4px 16px rgba(0,0,0,0.2)',
                border: '1px solid rgba(255,255,255,0.05)',
                transition: 'all 0.3s ease-in-out',
                '&:hover': {
                  boxShadow:
                    '0 12px 40px rgba(0,0,0,0.4), 0 6px 20px rgba(0,0,0,0.3)',
                  transform: 'translateY(-2px)',
                },
              }}
            >
                            <AccordionSummary
                expandIcon={
                  <ExpandMoreIcon 
                    sx={{ 
                      color: '#e0e6ed',
                      cursor: 'pointer',
                      '&:hover': {
                        color: '#40c4ff',
                        transform: 'scale(1.1)',
                      },
                      transition: 'all 0.2s ease-in-out',
                    }}
                    onClick={(e) => {
                      e.stopPropagation();
                      setExpandedDelivery(expandedDelivery === delivery.id ? null : delivery.id);
                    }}
                  />
                }
                disableRipple
                disableTouchRipple
                onClick={(e) => {
                  // 클릭된 요소가 실제 입력 요소나 버튼인 경우에만 아코디언 토글 방지
                  const target = e.target as HTMLElement;
                  
                  // expandIcon 영역 클릭은 무시 (expandIcon에서 별도 처리)
                  if (target.closest('.MuiAccordionSummary-expandIconWrapper')) {
                    return;
                  }
                  
                  // 실제 입력 요소나 버튼인 경우에만 클릭 방지
                  const isInteractiveElement = target.closest('button') ||
                                             target.closest('input') ||
                                             target.closest('textarea') ||
                                             target.closest('select') ||
                                             target.closest('.MuiIconButton-root') ||
                                             target.closest('[role="button"]') ||
                                             target.closest('[data-clickable="true"]') ||
                                             target.closest('.MuiFormControl-root') ||
                                             target.closest('.MuiTextField-root') ||
                                             target.closest('.MuiSelect-root') ||
                                             target.closest('.MuiInputBase-root') ||
                                             target.closest('.MuiInput-root') ||
                                             target.closest('.MuiOutlinedInput-root') ||
                                             target.closest('.MuiInputLabel-root') ||
                                             target.closest('.MuiSelect-select') ||
                                             target.closest('.MuiInputBase-input');
                  
                  // 입력 요소가 아닌 경우 아코디언 토글
                  if (!isInteractiveElement) {
                    console.log('메인카드 클릭 - 아코디언 토글:', delivery.id);
                    setExpandedDelivery(expandedDelivery === delivery.id ? null : delivery.id);
                  } else {
                    console.log('입력 요소 클릭 - 아코디언 토글 방지:', target.tagName, target.className);
                  }
                }}
                sx={{
                  '&:hover': {
                    backgroundColor: 'rgba(255,255,255,0.05)',
                    backdropFilter: 'blur(10px)',
                  },
                  cursor: 'pointer',
                  transition: 'all 0.3s ease-in-out',
                  '&:active': {
                    backgroundColor: 'rgba(255,255,255,0.08)',
                    transform: 'scale(0.98)',
                  },
                  borderBottom: '1px solid rgba(255,255,255,0.05)',
                  minHeight: '80px !important',
                  '& .MuiAccordionSummary-content': {
                    margin: '16px 0',
                  },
                }}
              >
                <Grid 
                  container 
                  spacing={2} 
                  alignItems="center"
                >
                  {/* 좌측: 고객정보 */}
                  <Grid item xs={12} md={2.5}>
                    <Typography
                      variant="h6"
                      sx={{
                        color: '#e0e6ed',
                        mb: 1,
                        fontSize: 'calc(1.25rem + 1.5px)',
                      }}
                    >
                      고객정보
                    </Typography>
                    <Typography
                      variant="body2"
                      sx={{
                        color: '#b0b8c1',
                        fontSize: 'calc(0.875rem + 1.5px)',
                      }}
                    >
                      프로젝트: {delivery.projectName}
                      {delivery.projectType &&
                        `, 타입: ${delivery.projectType}`}
                      <br />
                      고객명: {delivery.customerName}
                      <br />
                      연락처: {delivery.contact}
                      <br />
                      주소: {delivery.address}
                    </Typography>
                  </Grid>

                  {/* 좌측: 시공정보 */}
                  <Grid item xs={12} md={2.5}>
                    <Typography variant="h6" sx={{ color: '#e0e6ed', mb: 1 }}>
                      시공정보
                    </Typography>
                    {/* Firebase 시공자 데이터 상태 표시 */}
                    <Box sx={{ display: 'flex', gap: 1, mb: 1, flexWrap: 'wrap' }}>
                      <Chip
                        label={`🔥 Firebase 시공자: ${firebaseWorkers.length}명`}
                        color={firebaseWorkers.length > 0 ? 'success' : 'default'}
                        variant="outlined"
                        size="small"
                      />
                      <Chip
                        label={`💾 Local 시공자: ${workers.length}명`}
                        color="primary"
                        variant="outlined"
                        size="small"
                      />
                      {isLoadingWorkers && (
                        <Chip
                          label="🔥 Firebase 데이터 로딩 중..."
                          color="warning"
                          variant="outlined"
                          size="small"
                        />
                      )}
                    </Box>
                    <Box
                      sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}
                    >
                      <Grid container spacing={1} alignItems="center" sx={{ mb: 1 }}>
                        <Grid item xs={6}>
                          <TextField
                            size="small"
                            label="시공일시"
                            type="datetime-local"
                            data-clickable="true"
                            value={(() => {
                              if (delivery.constructionDate && delivery.constructionTime) {
                                return delivery.constructionDate + 'T' + delivery.constructionTime;
                              } else if (delivery.constructionDate) {
                                return delivery.constructionDate + 'T00:00';
                              } else {
                                return '';
                              }
                            })()}
                            onChange={e => {
                              const val = e.target.value;
                              if (val) {
                                const localDateTime = new Date(val);
                                const year = localDateTime.getFullYear();
                                const month = String(localDateTime.getMonth() + 1).padStart(2, '0');
                                const day = String(localDateTime.getDate()).padStart(2, '0');
                                const hours = String(localDateTime.getHours()).padStart(2, '0');
                                const minutes = String(localDateTime.getMinutes()).padStart(2, '0');
                                const dateStr = `${year}-${month}-${day}`;
                                const timeStr = `${hours}:${minutes}`;
                                const updatedDelivery = {
                                  ...delivery,
                                  constructionDate: dateStr,
                                  constructionTime: timeStr,
                                };
                                updateDelivery(delivery.id, updatedDelivery);
                                
                                // 시공일시 변경 시 기존 스케줄 자동 업데이트
                                console.log('🔄 시공일시 변경 감지 - 스케줄 자동 업데이트:', {
                                  oldDate: delivery.constructionDate,
                                  oldTime: delivery.constructionTime,
                                  newDate: dateStr,
                                  newTime: timeStr
                                });
                                
                                // 자동 스케줄 업데이트 완전 비활성화 (납품 데이터 보호)
                                console.log('✅ 시공일시 변경 완료 - 자동 스케줄 업데이트 비활성화됨');
                              }
                            }}
                            fullWidth
                          />
                        </Grid>
                        <Grid item xs={6}>
                          <FormControl size="small" fullWidth>
                            <InputLabel id={`worker-select-label-${delivery.id}`}>시공자명</InputLabel>
                            <Select
                              labelId={`worker-select-label-${delivery.id}`}
                              value={delivery.constructionWorker || ''}
                              label="시공자명"
                              data-clickable="true"
                              onChange={e => {
                                // Firebase 시공자 데이터에서 먼저 찾기
                                let selected = firebaseWorkers.find((w: any) => w.name === e.target.value);
                                
                                // Firebase에 없으면 localStorage에서 찾기
                                if (!selected) {
                                  selected = workers.find((w: any) => w.name === e.target.value);
                                }
                                
                                if (selected) {
                                  const updatedData = {
                                    constructionWorker: selected.name,
                                    constructionWorkerPhone: selected.phone,
                                    vehicleNumber: selected.vehicleNumber,
                                  };
                                  updateDelivery(delivery.id, updatedData);
                                  
                                  // 자동 스케줄 업데이트 완전 비활성화 (납품 데이터 보호)
                                  console.log('✅ 시공자 변경 완료 - 자동 스케줄 업데이트 비활성화됨');
                                } else {
                                  const updatedData = {
                                    constructionWorker: '',
                                    constructionWorkerPhone: '',
                                    vehicleNumber: '',
                                  };
                                  updateDelivery(delivery.id, updatedData);
                                  
                                  // 자동 스케줄 업데이트 완전 비활성화 (납품 데이터 보호)
                                  console.log('✅ 시공자 제거 완료 - 자동 스케줄 업데이트 비활성화됨');
                                }
                              }}
                            >
                              <MenuItem value="">
                                <em>선택없음</em>
                              </MenuItem>
                              {/* Firebase 시공자 데이터 우선 표시 */}
                              {firebaseWorkers.map((w: any) => (
                                <MenuItem key={w.id} value={w.name}>
                                  {w.name} 🔥
                                </MenuItem>
                              ))}
                              {/* localStorage 시공자 데이터 (Firebase에 없는 것들만) */}
                              {workers.filter((w: any) => 
                                !firebaseWorkers.some((fw: any) => fw.name === w.name && fw.phone === w.phone)
                              ).map((w: any) => (
                                <MenuItem key={w.id} value={w.name}>
                                  {w.name} 💾
                                </MenuItem>
                              ))}
                            </Select>
                          </FormControl>
                        </Grid>
                        <Grid item xs={4} sx={{ mt: 1 }}>
                          <TextField
                            size="small"
                            label="전화번호"
                            data-clickable="true"
                            value={delivery.constructionWorkerPhone || ''}
                            onChange={async (e) => {
                              const newPhone = e.target.value;
                              await updateDelivery(delivery.id, { constructionWorkerPhone: newPhone });
                              
                              // 자동 스케줄 업데이트 완전 비활성화 (납품 데이터 보호)
                              console.log('✅ 전화번호 변경 완료 - 자동 스케줄 업데이트 비활성화됨');
                            }}
                            placeholder="전화번호"
                            fullWidth
                          />
                        </Grid>
                        <Grid item xs={4} sx={{ mt: 1 }}>
                          <TextField
                            size="small"
                            label="차량번호"
                            data-clickable="true"
                            value={delivery.vehicleNumber || ''}
                            onChange={async (e) => {
                              const newVehicleNumber = e.target.value;
                              await updateDelivery(delivery.id, { vehicleNumber: newVehicleNumber });
                              
                              // 자동 스케줄 업데이트 완전 비활성화 (납품 데이터 보호)
                              console.log('✅ 차량번호 변경 완료 - 자동 스케줄 업데이트 비활성화됨');
                            }}
                            placeholder="차량번호"
                            fullWidth
                          />
                        </Grid>
                        <Grid item xs={4} sx={{ mt: 1 }}>
                          <Button 
                            size="small" 
                            variant="outlined" 
                            fullWidth 
                            data-clickable="true"
                            onClick={() => setWorkerDialogOpen(true)}
                          >
                            신규등록
                          </Button>
                        </Grid>
                        <Grid item xs={12} sx={{ mt: 2 }}>
                          <Button 
                            variant="contained" 
                            color="primary" 
                            fullWidth 
                            data-clickable="true"
                            onClick={async () => {
                              if (delivery.constructionDate) {
                                try {
                                  const result = await createDetailedSchedule(delivery);
                                  const message = result?.updated 
                                    ? '기존 시공일정이 업데이트되었습니다.' 
                                    : '시공일정이 스케줄에 저장되었습니다.';
                                  
                                  setSnackbar({
                                    open: true,
                                    message: message,
                                    severity: 'success',
                                  });
                                } catch (error) {
                                  console.error('❌ 시공일정 스케줄 저장 실패:', error);
                                  setSnackbar({
                                    open: true,
                                    message: '시공일정 저장에 실패했습니다.',
                                    severity: 'error',
                                  });
                                }
                              } else {
                                setSnackbar({
                                  open: true,
                                  message: '시공일자를 먼저 입력해주세요.',
                                  severity: 'warning',
                                });
                              }
                            }}
                            sx={{ 
                              backgroundColor: '#40c4ff',
                              '&:hover': { backgroundColor: '#33a3cc' }
                            }}
                          >
                            시공일정 스케줄 저장
                          </Button>
                        </Grid>
                      </Grid>
                      <Dialog open={workerDialogOpen} onClose={() => setWorkerDialogOpen(false)}>
                        <DialogTitle>시공자 신규등록</DialogTitle>
                        <DialogContent>
                          <TextField
                            autoFocus
                            margin="dense"
                            label="이름"
                            fullWidth
                            value={newWorker.name}
                            onChange={e => setNewWorker({ ...newWorker, name: e.target.value })}
                          />
                          <TextField
                            margin="dense"
                            label="전화번호"
                            fullWidth
                            value={newWorker.phone}
                            onChange={e => setNewWorker({ ...newWorker, phone: e.target.value })}
                          />
                          <TextField
                            margin="dense"
                            label="차량번호"
                            fullWidth
                            value={newWorker.vehicleNumber}
                            onChange={e => setNewWorker({ ...newWorker, vehicleNumber: e.target.value })}
                          />
                        </DialogContent>
                        <DialogActions>
                          <Button onClick={() => setWorkerDialogOpen(false)}>취소</Button>
                          <Button onClick={async () => {
                            if (newWorker.name && newWorker.phone) {
                              try {
                                // Firebase에 시공자 저장
                                const firebaseId = await workerService.saveWorker(newWorker);
                                console.log('🔥 Firebase에 시공자 저장 완료:', firebaseId);
                                
                                // localStorage에도 저장 (기존 호환성 유지)
                                addWorker({ ...newWorker, id: uuidv4() });
                                
                                setSnackbar({
                                  open: true,
                                  message: '시공자가 성공적으로 등록되었습니다.',
                                  severity: 'success',
                                });
                                
                                setWorkerDialogOpen(false);
                                setNewWorker({ name: '', phone: '', vehicleNumber: '' });
                              } catch (error) {
                                console.error('🔥 Firebase 시공자 저장 실패:', error);
                                setSnackbar({
                                  open: true,
                                  message: '시공자 등록에 실패했습니다. 인터넷 연결을 확인해주세요.',
                                  severity: 'error',
                                });
                              }
                            } else {
                              setSnackbar({
                                open: true,
                                message: '이름과 전화번호는 필수 입력 항목입니다.',
                                severity: 'warning',
                              });
                            }
                          }}>등록</Button>
                        </DialogActions>
                      </Dialog>
                    </Box>
                  </Grid>

                  {/* 중앙: 상태카드 */}
                  <Grid item xs={12} md={2}>
                    <Box
                      sx={{
                        display: 'flex',
                        flexDirection: 'column',
                        gap: 1.5,
                        alignItems: 'flex-start',
                        justifyContent: 'center',
                        height: '100%',
                      }}
                    >
                      <Chip
                        label={delivery.deliveryStatus}
                        color={
                          delivery.deliveryStatus === '제품준비중'
                            ? 'error'
                            : 'success'
                        }
                        size="medium"
                        icon={
                          delivery.deliveryStatus === '제품준비중' ? (
                            <WarningIcon />
                          ) : (
                            <CheckCircleIcon />
                          )
                        }
                        sx={{
                          minWidth: '140px',
                          height: '48px',
                          fontSize: '1rem',
                          fontWeight: 'bold',
                          '& .MuiChip-icon': { fontSize: '1.5rem' },
                          marginLeft: 0,
                        }}
                      />
                      <Chip
                        label={delivery.paymentStatus}
                        color={
                          delivery.paymentStatus === '미수금'
                            ? 'error'
                            : 'success'
                        }
                        size="medium"
                        icon={
                          delivery.paymentStatus === '미수금' ? (
                            <MoneyIcon />
                          ) : (
                            <CheckCircleIcon />
                          )
                        }
                        sx={{
                          minWidth: '140px',
                          height: '48px',
                          fontSize: '1rem',
                          fontWeight: 'bold',
                          '& .MuiChip-icon': { fontSize: '1.5rem' },
                          marginLeft: 0,
                        }}
                      />
                    </Box>
                  </Grid>

                  {/* 우측: 금액정보 */}
                  <Grid item xs={12} md={2.5}>
                    <Typography
                      variant="h6"
                      sx={{
                        color: '#e0e6ed',
                        mb: 1,
                        fontSize: 'calc(1.25rem + 1.5px)',
                      }}
                    >
                      금액정보
                    </Typography>
                    <Typography
                      variant="body2"
                      sx={{
                        color: '#b0b8c1',
                        fontSize: 'calc(0.875rem + 1.5px)',
                        mb: 1,
                      }}
                    >
                      할인후금액: {(delivery.finalAmount || 0).toLocaleString()}
                      원<br />
                      현재입금액: {(delivery.paidAmount || 0).toLocaleString()}
                      원<br />
                      잔액: {(delivery.remainingAmount || 0).toLocaleString()}원
                    </Typography>
                    <Button
                      variant="contained"
                      size="small"
                      color="primary"
                      startIcon={<MoneyIcon />}
                      data-clickable="true"
                      sx={{
                        transition: 'all 0.2s ease-in-out',
                        '&:hover': {
                          transform: 'translateY(-1px)',
                          boxShadow: '0 4px 8px rgba(0,0,0,0.3)',
                        },
                      }}
                      onClick={e => handlePaymentClick(delivery, e)}
                    >
                      수금입력
                    </Button>
                  </Grid>

                  {/* 우측: MEMO 박스 */}
                  <Grid item xs={12} md={2.5}>
                    <Box
                      sx={{
                        display: 'flex',
                        flexDirection: 'column',
                        gap: 1,
                        height: '100%',
                      }}
                    >
                      {/* 메모 표시 영역 */}
                      <Box
                        sx={{
                          flex: 1,
                          p: 1.5,
                          backgroundColor: 'rgba(255,255,255,0.05)',
                          borderRadius: 2,
                          border: '1px solid rgba(255,255,255,0.1)',
                          backdropFilter: 'blur(10px)',
                          minHeight: '80px',
                          display: 'flex',
                          flexDirection: 'column',
                        }}
                      >
                        <Typography
                          variant="subtitle2"
                          sx={{
                            color: '#40c4ff',
                            mb: 1,
                            fontSize: '0.8rem',
                            fontWeight: 'bold',
                          }}
                        >
                          📝 MEMO
                        </Typography>
                        <Box
                          sx={{ flex: 1 }}
                          onClick={e => {
                            e.stopPropagation();
                            setEditingMemoId(delivery.id);
                            setEditingMemoContent(delivery.memo || '');
                          }}
                        >
                          {editingMemoId === delivery.id ? (
                            <TextField
                              value={editingMemoContent}
                              onChange={e =>
                                setEditingMemoContent(e.target.value)
                              }
                              onBlur={() => handleInlineMemoSave(delivery)}
                              onKeyDown={e => {
                                if (e.key === 'Enter' && !e.shiftKey) {
                                  e.preventDefault();
                                  handleInlineMemoSave(delivery);
                                }
                              }}
                              autoFocus
                              fullWidth
                              multiline
                              size="small"
                              data-clickable="true"
                              sx={{
                                background: '#222',
                                color: '#e0e6ed',
                                borderRadius: 1,
                              }}
                            />
                          ) : (
                            <Typography
                              variant="body2"
                              sx={{
                                color: delivery.memo ? '#e0e6ed' : '#666',
                                fontSize: '0.75rem',
                                lineHeight: 1.4,
                                wordBreak: 'break-word',
                                mb: 1,
                                fontStyle: delivery.memo ? undefined : 'italic',
                                cursor: 'pointer',
                              }}
                            >
                              {delivery.memo ||
                                '메모가 없습니다 (클릭하여 입력)'}
                            </Typography>
                          )}
                          <Typography
                            variant="caption"
                            sx={{
                              color: '#888',
                              fontSize: '0.65rem',
                              display: 'block',
                            }}
                          >
                            {delivery.memoCreatedAt
                              ? new Date(delivery.memoCreatedAt).toLocaleString(
                                  'ko-KR'
                                )
                              : ''}
                          </Typography>
                        </Box>
                      </Box>

                      {/* 기존 액션 버튼들 */}
                      <Box
                        sx={{
                          display: 'flex',
                          gap: 1,
                          flexWrap: 'wrap',
                          justifyContent: 'flex-start',
                        }}
                      >
                        <Button
                          variant="contained"
                          size="small"
                          color={delivery.deliveryStatus === '납품완료' ? 'success' : 'primary'}
                          data-clickable="true"
                          onClick={e => {
                            e.stopPropagation();
                            updateDeliveryStatus(
                              delivery.id,
                              delivery.deliveryStatus === '납품완료' ? '제품준비중' : '납품완료'
                            );
                          }}
                          sx={{
                            mt: 1,
                            minWidth: 120,
                            fontWeight: 'bold',
                            fontSize: '1rem',
                            transition: 'all 0.2s',
                            ...(delivery.deliveryStatus === '납품완료' && {
                              backgroundColor: '#2e7d32',
                              color: '#fff',
                              '&:hover': { backgroundColor: '#388e3c' },
                            }),
                          }}
                        >
                          {delivery.deliveryStatus === '납품완료' ? '납품완료' : '납품대기'}
                        </Button>
                        <IconButton
                          size="small"
                          color="warning"
                          data-clickable="true"
                          onClick={e => {
                            e.stopPropagation();
                            handleASClick(delivery);
                          }}
                          title="AS 접수"
                          sx={{
                            transition: 'all 0.2s ease-in-out',
                            '&:hover': {
                              transform: 'scale(1.1)',
                              backgroundColor: 'rgba(255, 152, 0, 0.1)',
                            },
                          }}
                        >
                          <BuildIcon />
                        </IconButton>
                        <IconButton
                          size="small"
                          color="error"
                          data-clickable="true"
                          onClick={e => {
                            e.stopPropagation();
                            handleDeleteClick(delivery);
                          }}
                          title="삭제"
                          sx={{
                            transition: 'all 0.2s ease-in-out',
                            '&:hover': {
                              transform: 'scale(1.1)',
                              backgroundColor: 'rgba(244, 67, 54, 0.1)',
                            },
                          }}
                        >
                          <DeleteIcon />
                        </IconButton>
                        <IconButton
                          size="small"
                          color="info"
                          data-clickable="true"
                          onClick={() => {
                            // delivery에 contractNo가 없으므로 projectName을 contractNo로 매칭 (fallback)
                            // @ts-ignore
                            const projectOrders = (delivery.orders || []).filter(
                              (o: any) => o.status === '발주완료'
                            );
                            setOrderDetailModalGroup(projectOrders);
                          }}
                          title="발주서 확인"
                          sx={{
                            transition: 'all 0.2s ease-in-out',
                            '&:hover': {
                              transform: 'scale(1.1)',
                              backgroundColor: 'rgba(64, 196, 255, 0.1)',
                            },
                          }}
                        >
                          <AssignmentIcon />
                        </IconButton>
                      </Box>
                    </Box>
                  </Grid>
                </Grid>
              </AccordionSummary>

              {/* 상세내역 아코디언 */}
              <AccordionDetails
                sx={{
                  backgroundColor: 'rgba(0,0,0,0.2)',
                  backdropFilter: 'blur(10px)',
                  borderTop: '1px solid rgba(255,255,255,0.05)',
                }}
              >
                <Box sx={{ p: 3 }}>
                  {/* 제품 정보 표 */}
                  <Box sx={{ mb: 4 }}>
                    <Box
                      sx={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        mb: 2,
                      }}
                    >
                      <Typography variant="subtitle1" sx={{ color: '#40c4ff' }}>
                        📦 제품 상세 정보 (견적서 양식)
                      </Typography>

                      {/* 컬럼 설정 버튼 */}
                      <Button
                        variant="outlined"
                        size="small"
                        startIcon={<SettingsIcon />}
                        onClick={() =>
                          setColumnSettingsOpen(!columnSettingsOpen)
                        }
                        sx={{
                          color: '#40c4ff',
                          borderColor: 'rgba(255,255,255,0.2)',
                          fontSize: '0.75rem',
                          '&:hover': {
                            borderColor: '#40c4ff',
                            backgroundColor: 'rgba(64, 196, 255, 0.1)',
                          },
                        }}
                      >
                        컬럼 설정
                      </Button>
                    </Box>

                    {/* 컬럼 설정 패널 */}
                    {columnSettingsOpen && (
                      <Box
                        sx={{
                          mb: 2,
                          p: 2,
                          backgroundColor: 'rgba(255,255,255,0.05)',
                          borderRadius: 2,
                          border: '1px solid rgba(255,255,255,0.1)',
                          backdropFilter: 'blur(10px)',
                        }}
                      >
                        <Typography
                          variant="subtitle2"
                          sx={{
                            color: '#40c4ff',
                            mb: 1,
                            fontSize: 'calc(0.875rem + 1px)',
                          }}
                        >
                          🔧 컬럼 표시 설정
                        </Typography>
                        <Grid container spacing={2}>
                          {FILTER_FIELDS.map(field => (
                            <Grid item xs={12} sm={6} md={3} key={field.key}>
                              <FormControlLabel
                                control={
                                  <Checkbox
                                    checked={visibleColumns[field.key]}
                                    onChange={e =>
                                      setVisibleColumns(prev => ({
                                        ...prev,
                                        [field.key]: e.target.checked,
                                      }))
                                    }
                                    sx={{
                                      color: '#40c4ff',
                                      '&.Mui-checked': {
                                        color: '#40c4ff',
                                      },
                                    }}
                                  />
                                }
                                label={
                                  <Typography
                                    sx={{
                                      color: '#e0e6ed',
                                      fontSize: '0.8rem',
                                      textDecoration: visibleColumns[field.key]
                                        ? 'none'
                                        : 'line-through',
                                      opacity: visibleColumns[field.key]
                                        ? 1
                                        : 0.6,
                                    }}
                                  >
                                    {field.label}
                                  </Typography>
                                }
                              />
                            </Grid>
                          ))}
                          <Grid item xs={12}>
                            <Box sx={{ display: 'flex', gap: 1, mt: 1 }}>
                              <Button
                                variant="outlined"
                                size="small"
                                onClick={() => {
                                  const allVisible: { [key: string]: boolean } =
                                    {};
                                  FILTER_FIELDS.forEach(field => {
                                    allVisible[field.key] = true;
                                  });
                                  setVisibleColumns(allVisible);
                                }}
                                sx={{
                                  color: '#40c4ff',
                                  borderColor: 'rgba(255,255,255,0.2)',
                                  fontSize: '0.75rem',
                                  '&:hover': {
                                    borderColor: '#40c4ff',
                                  },
                                }}
                              >
                                전체 표시
                              </Button>
                              <Button
                                variant="outlined"
                                size="small"
                                onClick={() => {
                                  const allHidden: { [key: string]: boolean } =
                                    {};
                                  FILTER_FIELDS.forEach(field => {
                                    allHidden[field.key] = false;
                                  });
                                  setVisibleColumns(allHidden);
                                }}
                                sx={{
                                  color: '#ff6b6b',
                                  borderColor: 'rgba(255,255,255,0.2)',
                                  fontSize: '0.75rem',
                                  '&:hover': {
                                    borderColor: '#ff6b6b',
                                  },
                                }}
                              >
                                전체 숨김
                              </Button>
                            </Box>
                          </Grid>
                        </Grid>
                      </Box>
                    )}

                    <TableContainer
                      component={Paper}
                      sx={{
                        backgroundColor: 'rgba(255,255,255,0.05)',
                        backdropFilter: 'blur(10px)',
                        borderRadius: 2,
                        border: '1px solid rgba(255,255,255,0.1)',
                        overflow: 'auto',
                      }}
                    >
                      <Table stickyHeader>
                        <TableHead>
                          <TableRow>
                            <TableCell
                              sx={{
                                backgroundColor: 'rgba(0,0,0,0.8)',
                                color: '#fff',
                                fontWeight: 'bold',
                                borderBottom: '1px solid rgba(255,255,255,0.1)',
                                minWidth: '80px',
                                whiteSpace: 'nowrap',
                                padding: '4px 8px',
                              }}
                            >
                              구분
                            </TableCell>
                            {FILTER_FIELDS.filter(
                              field => visibleColumns[field.key]
                            ).map(field => {
                              // 폭을 줄일 컬럼 key 목록
                              const narrowKeys = [
                                'area',
                                'lineDir',
                                'lineLen',
                                'pleatCount',
                                'panelCount',
                                'quantity',
                                'saleAmount',
                                'saleUnitPrice',
                                'purchaseAmount',
                                'purchaseUnitCost',
                                'margin',
                              ];
                              const baseWidth = 100;
                              const width = narrowKeys.includes(field.key)
                                ? Math.max(baseWidth - 30, 40)
                                : undefined;
                              return (
                                <TableCell
                                  key={field.key}
                                  sx={{
                                    fontSize: '10.5pt',
                                    color: '#e0e6ed',
                                    padding: '4px 8px',
                                    width: width ? `${width}px` : undefined,
                                    minWidth: width ? `${width}px` : undefined,
                                  }}
                                >
                                  {field.label}
                                </TableCell>
                              );
                            })}
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {delivery.items && delivery.items.length > 0 ? (
                            delivery.items
                              .slice()
                              .sort(
                                (a, b) =>
                                  (a.originalIndex ?? 0) -
                                  (b.originalIndex ?? 0)
                              )
                              .map((item, idx) => {
                                // 여러 속성 조합으로 유일한 key 생성
                                const rowKey = item.id 
                                  ? `${delivery.id}-${item.id}-${idx}`
                                  : `${delivery.id}-item-${idx}-${Date.now()}-${Math.random()}`;
                                const isProduct = item.type === 'product';
                                const isRail = item.optionLabel === '레일';
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
                                  nonMonetaryFields.length;

                                if (isProduct) {
                                  return (
                                    <TableRow
                                      key={rowKey}
                                      sx={{
                                        backgroundColor: getSpaceColor(
                                          item.space
                                        ),
                                        fontSize: '11pt',
                                        cursor: 'pointer',
                                        transition: 'background 0.2s',
                                      }}
                                    >
                                      <TableCell
                                        sx={{
                                          fontWeight: 'bold',
                                          fontSize: '11pt',
                                          color: '#e0e6ed',
                                        }}
                                      >
                                        제품
                                      </TableCell>
                                      {FILTER_FIELDS.filter(
                                        field => visibleColumns[field.key]
                                      ).map(field => (
                                        <TableCell
                                          key={field.key}
                                          sx={{
                                            fontSize: '11pt',
                                            color: '#e0e6ed',
                                          }}
                                        >
                                          {getRowValue(item, field.key)}
                                        </TableCell>
                                      ))}
                                    </TableRow>
                                  );
                                } else {
                                  // 옵션행: 제품행보다 밝은 배경, 들여쓰기, 글씨 10.5pt
                                  return (
                                    <TableRow
                                      key={rowKey}
                                      sx={{
                                        backgroundColor: getSpaceColor(
                                          item.space,
                                          1.12
                                        ),
                                        fontSize: '10.5pt',
                                        cursor: isRail ? 'pointer' : 'default',
                                      }}
                                    >
                                      <TableCell
                                        sx={{
                                          pl: 3,
                                          fontSize: '10.5pt',
                                          color: '#e0e6ed',
                                          minWidth: '80px',
                                          whiteSpace: 'nowrap',
                                          padding: '4px 8px',
                                        }}
                                      >
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
                                            <span
                                              style={{ fontWeight: 'bold' }}
                                            >
                                              레일
                                            </span>
                                          </Box>
                                        ) : (
                                          '└ 옵션'
                                        )}
                                      </TableCell>
                                      {FILTER_FIELDS.filter(
                                        field => visibleColumns[field.key]
                                      ).map(field => (
                                        <TableCell
                                          key={field.key}
                                          sx={{
                                            fontSize: '10.5pt',
                                            color: '#e0e6ed',
                                            padding: '4px 8px',
                                          }}
                                        >
                                          {getRowValue(item, field.key)}
                                        </TableCell>
                                      ))}
                                    </TableRow>
                                  );
                                }
                              })
                          ) : (
                            <TableRow>
                              <TableCell
                                colSpan={
                                  FILTER_FIELDS.filter(
                                    field => visibleColumns[field.key]
                                  ).length + 1
                                }
                                align="center"
                                sx={{ color: '#666' }}
                              >
                                제품 정보가 없습니다
                              </TableCell>
                            </TableRow>
                          )}
                        </TableBody>
                      </Table>
                    </TableContainer>
                  </Box>

                  {/* 견적/계약관리 금액 정보: 제품 상세 정보 테이블 아래, 수금기록 위 */}
                  <Box
                    sx={{
                      mt: 2,
                      mb: 2,
                      p: 2,
                      background: 'rgba(0,0,0,0.08)',
                      borderRadius: 1,
                      display: 'flex',
                      gap: 4,
                      alignItems: 'center',
                    }}
                  >
                    <Box
                      sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}
                    >
                      <Typography variant="body2" sx={{ color: '#b0b8c1' }}>
                        소비자금액:{' '}
                        {(delivery.items || [])
                          .reduce((sum, item) => {
                            if (item.brand?.toLowerCase() === 'hunterdouglas') {
                              return (
                                sum +
                                (item.salePrice && item.quantity
                                  ? Math.round(item.salePrice * item.quantity)
                                  : 0)
                              );
                            }
                            if (
                              item.curtainType === '겉커튼' &&
                              (item.pleatType === '민자' ||
                                item.pleatType === '나비')
                            ) {
                              return (
                                sum +
                                (item.salePrice && item.widthCount
                                  ? Math.round(item.salePrice * item.widthCount)
                                  : 0)
                              );
                            }
                            if (
                              item.curtainType === '속커튼' &&
                              item.pleatType === '민자'
                            ) {
                              const areaNum = Number(item.area);
                              const largePlainPrice =
                                item.largePlainPrice || item.salePrice;
                              return (
                                sum +
                                (largePlainPrice && areaNum
                                  ? Math.round(largePlainPrice * areaNum)
                                  : 0)
                              );
                            }
                            if (
                              item.curtainType === '속커튼' &&
                              item.pleatType === '나비'
                            ) {
                              const areaNum = Number(item.area);
                              return (
                                sum +
                                (item.salePrice && areaNum
                                  ? Math.round(item.salePrice * areaNum)
                                  : 0)
                              );
                            }
                            if (item.productType === '블라인드') {
                              const areaNum = Number(item.area);
                              return (
                                sum +
                                (item.salePrice && areaNum
                                  ? Math.round(item.salePrice * areaNum)
                                  : 0)
                              );
                            }
                            return (
                              sum +
                              (typeof item.totalPrice === 'number'
                                ? item.totalPrice
                                : 0)
                            );
                          }, 0)
                          .toLocaleString()}
                        원
                      </Typography>
                      <Typography variant="body2" sx={{ color: '#b0b8c1' }}>
                        할인금액:{' '}
                        {(delivery.discountAmount || 0).toLocaleString()}원
                      </Typography>
                    </Box>
                    <Box
                      sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}
                    >
                      <Typography
                        variant="body2"
                        sx={{ color: '#40c4ff', fontWeight: 'bold' }}
                      >
                        할인후금액:{' '}
                        {(delivery.finalAmount || 0).toLocaleString()}원
                      </Typography>
                      <Typography variant="body2" sx={{ color: '#b0b8c1' }}>
                        결제상태: {delivery.paymentStatus}
                      </Typography>
                    </Box>
                  </Box>

                  {/* 레일 정보 표시: 제품 상세 정보 하단 */}
                  {delivery.railItems && delivery.railItems.length > 0 && (
                    <Box
                      sx={{
                        mt: 2,
                        mb: 2,
                        p: 1.5,
                        background: 'rgba(255, 152, 0, 0.05)',
                        borderRadius: 1,
                        border: '1px solid rgba(255, 152, 0, 0.2)',
                      }}
                    >
                      <Typography
                        variant="subtitle2"
                        sx={{
                          color: '#ff9800',
                          mb: 1,
                          fontSize: '0.9rem',
                          fontWeight: 'bold',
                        }}
                      >
                        🚇 레일 정보
                      </Typography>
                      <TableContainer
                        component={Paper}
                        sx={{
                          backgroundColor: 'rgba(0,0,0,0.1)',
                          borderRadius: 1,
                        }}
                      >
                        <Table size="small">
                          <TableHead>
                            <TableRow
                              sx={{ backgroundColor: 'rgba(255, 152, 0, 0.1)' }}
                            >
                              <TableCell
                                sx={{
                                  color: '#ff9800',
                                  fontWeight: 'bold',
                                  fontSize: '0.8rem',
                                  py: 0.5,
                                }}
                              >
                                세부내용
                              </TableCell>
                              <TableCell
                                sx={{
                                  color: '#ff9800',
                                  fontWeight: 'bold',
                                  fontSize: '0.8rem',
                                  py: 0.5,
                                }}
                              >
                                자수
                              </TableCell>
                              <TableCell
                                sx={{
                                  color: '#ff9800',
                                  fontWeight: 'bold',
                                  fontSize: '0.8rem',
                                  py: 0.5,
                                }}
                              >
                                단가
                              </TableCell>
                              <TableCell
                                sx={{
                                  color: '#ff9800',
                                  fontWeight: 'bold',
                                  fontSize: '0.8rem',
                                  py: 0.5,
                                }}
                              >
                                금액
                              </TableCell>
                            </TableRow>
                          </TableHead>
                          <TableBody>
                            {(delivery.railItems || []).map(
                              (railItem, index) => {
                                const calculatedLength = calculateRailLength(
                                  railItem.specification ||
                                    railItem.details ||
                                    ''
                                );
                                return (
                                  <TableRow
                                    key={index}
                                    sx={{
                                      '&:hover': {
                                        backgroundColor:
                                          'rgba(255, 152, 0, 0.03)',
                                      },
                                    }}
                                  >
                                    <TableCell
                                      sx={{
                                        color: '#e0e6ed',
                                        fontSize: '0.8rem',
                                        py: 0.5,
                                      }}
                                    >
                                      {railItem.specification ||
                                        railItem.details ||
                                        '레일'}
                                    </TableCell>
                                    <TableCell
                                      sx={{
                                        color: '#e0e6ed',
                                        fontSize: '0.8rem',
                                        py: 0.5,
                                      }}
                                    >
                                      {calculatedLength}자
                                    </TableCell>
                                    <TableCell
                                      sx={{
                                        color: '#e0e6ed',
                                        fontSize: '0.8rem',
                                        py: 0.5,
                                      }}
                                    >
                                      500원
                                    </TableCell>
                                    <TableCell
                                      sx={{
                                        color: '#e0e6ed',
                                        fontSize: '0.8rem',
                                        py: 0.5,
                                        fontWeight: 'bold',
                                      }}
                                    >
                                      {(
                                        calculatedLength * 500
                                      ).toLocaleString()}
                                      원
                                    </TableCell>
                                  </TableRow>
                                );
                              }
                            )}
                          </TableBody>
                        </Table>
                      </TableContainer>
                      <Typography
                        variant="caption"
                        sx={{
                          color: '#ff9800',
                          mt: 0.5,
                          display: 'block',
                          fontSize: '0.7rem',
                        }}
                      >
                        * 서비스 품목 (500원/자)
                      </Typography>
                    </Box>
                  )}

                  {/* 수금기록 */}
                  <Grid item xs={12}>
                    <Typography
                      variant="subtitle1"
                      sx={{ color: '#40c4ff', mb: 1 }}
                    >
                      💰 수금기록
                    </Typography>
                    {delivery.paymentRecords &&
                    delivery.paymentRecords.length > 0 ? (
                      delivery.paymentRecords.map((record, index) => (
                        <Box
                          key={index}
                          sx={{
                            mb: 1,
                            p: 2,
                            backgroundColor: 'rgba(255,255,255,0.05)',
                            borderRadius: 2,
                            border: '1px solid rgba(255,255,255,0.1)',
                            backdropFilter: 'blur(5px)',
                            transition: 'all 0.2s ease-in-out',
                            '&:hover': {
                              backgroundColor: 'rgba(255,255,255,0.08)',
                              transform: 'translateX(4px)',
                            },
                          }}
                        >
                          <Typography variant="body2" sx={{ color: '#b0b8c1' }}>
                            {record.date} {record.time} -{' '}
                            {record.amount.toLocaleString()}원 ({record.method})
                            {record.note && <br />}
                            {record.note && (
                              <span style={{ color: '#888' }}>
                                메모: {record.note}
                              </span>
                            )}
                          </Typography>
                        </Box>
                      ))
                    ) : (
                      <Typography variant="body2" sx={{ color: '#666' }}>
                        수금기록이 없습니다.
                      </Typography>
                    )}
                  </Grid>

                  {/* 서류기록 */}
                  <Grid item xs={12}>
                    <Typography
                      variant="subtitle1"
                      sx={{ color: '#40c4ff', mb: 1 }}
                    >
                      📄 서류기록
                    </Typography>
                    <Box
                      sx={{
                        mb: 1,
                        p: 2,
                        backgroundColor: 'rgba(255,255,255,0.05)',
                        borderRadius: 2,
                        border: '1px solid rgba(255,255,255,0.1)',
                        backdropFilter: 'blur(5px)',
                        transition: 'all 0.2s ease-in-out',
                        '&:hover': {
                          backgroundColor: 'rgba(255,255,255,0.08)',
                          transform: 'translateX(4px)',
                        },
                      }}
                    >
                      {(() => {
                        // 견적서 정보 가져오기
                        let savedEstimates: any[] = [];
                        try {
                          savedEstimates = JSON.parse(
                            localStorage.getItem('saved_estimates') || '[]'
                          );
                        } catch {}
                        const estimate = savedEstimates.find(
                          e => e.projectName === delivery.projectName
                        );

                        // 계약 정보 가져오기
                        let contracts: any[] = [];
                        try {
                          contracts = JSON.parse(
                            localStorage.getItem('contracts') || '[]'
                          );
                        } catch {}
                        const contract = contracts.find(
                          c => c.projectName === delivery.projectName
                        );

                        // localStorage에서 orders 가져오기 (임시 해결책)
                        let orders: Order[] = [];
                        try {
                          const savedOrders = localStorage.getItem('order-management-storage');
                          if (savedOrders) {
                            const parsed = JSON.parse(savedOrders);
                            orders = parsed.state?.orders || [];
                          }
                        } catch (error) {
                          console.error('orders 로드 실패:', error);
                        }
                        
                        const projectOrders = orders.filter(
                          (o: Order) =>
                            o.status === '발주완료' &&
                            o.deliveryAddress &&
                            delivery.address &&
                            o.deliveryAddress.trim().toLowerCase() === delivery.address.trim().toLowerCase()
                        );
                        const firstOrder = projectOrders[0];

                        return (
                          <Box
                            sx={{
                              display: 'grid',
                              gridTemplateColumns:
                                'repeat(auto-fit, minmax(200px, 1fr))',
                              gap: 2,
                            }}
                          >
                            <Typography
                              variant="body2"
                              sx={{ color: '#b0b8c1' }}
                            >
                              <b>견적일자:</b> {estimate?.estimateDate || '-'}
                            </Typography>
                            <Typography
                              variant="body2"
                              sx={{ color: '#b0b8c1' }}
                            >
                              <b>견적번호:</b> {estimate?.estimateNo || '-'}
                            </Typography>
                            <Typography
                              variant="body2"
                              sx={{ color: '#b0b8c1' }}
                            >
                              <b>계약일자:</b> {contract?.contractDate || '-'}
                            </Typography>
                            <Typography
                              variant="body2"
                              sx={{ color: '#b0b8c1' }}
                            >
                              <b>계약번호:</b> {contract?.contractNo || '-'}
                            </Typography>
                            <Typography
                              variant="body2"
                              sx={{
                                color: '#b0b8c1',
                                display: 'flex',
                                alignItems: 'center',
                                gap: 1,
                              }}
                            >
                              {projectOrders.length > 0
                                ? projectOrders
                                    .map(
                                      o =>
                                        `${o.orderDate || '-'}(${o.vendorName || '-'})`
                                    )
                                    .join(', ')
                                : '-'}
                              {projectOrders.length > 0 && (
                                <Button
                                  size="small"
                                  variant="outlined"
                                  sx={{
                                    ml: 1,
                                    fontSize: '0.75rem',
                                    color: '#40c4ff',
                                    borderColor: '#40c4ff',
                                    whiteSpace: 'nowrap',
                                  }}
                                  onClick={() =>
                                    setOrderDetailModalGroup(projectOrders)
                                  }
                                >
                                  내역보기
                                </Button>
                              )}
                            </Typography>
                          </Box>
                        );
                      })()}
                    </Box>
                  </Grid>

                  {/* AS 기록 */}
                  {delivery.asRecords && delivery.asRecords.length > 0 && (
                    <Box sx={{ mt: 3 }}>
                      <Typography
                        variant="subtitle1"
                        sx={{ color: '#ff9800', mb: 1 }}
                      >
                        🔧 AS 기록
                      </Typography>
                      {delivery.asRecords.map((asRecord, index) => (
                        <Box
                          key={asRecord.id}
                          sx={{
                            mb: 1,
                            p: 2,
                            backgroundColor: 'rgba(255,255,255,0.05)',
                            borderRadius: 2,
                            border: '1px solid rgba(255,255,255,0.1)',
                            backdropFilter: 'blur(5px)',
                            transition: 'all 0.2s ease-in-out',
                            '&:hover': {
                              backgroundColor: 'rgba(255,255,255,0.08)',
                              transform: 'translateX(4px)',
                            },
                          }}
                        >
                          <Box
                            sx={{
                              display: 'flex',
                              justifyContent: 'space-between',
                              alignItems: 'flex-start',
                              mb: 1,
                            }}
                          >
                            <Typography
                              variant="body2"
                              sx={{ color: '#b0b8c1', flex: 1 }}
                            >
                              {asRecord.date} - {asRecord.productName}
                              <br />
                              문제: {asRecord.issue}
                              <br />
                              해결: {asRecord.solution}
                              <br />
                              상태: {asRecord.status}
                              <br />
                              {asRecord.visitDate && <br />}
                              {asRecord.visitDate &&
                                `방문일자: ${asRecord.visitDate}`}
                              {asRecord.cost && <br />}
                              {asRecord.cost &&
                                `비용: ${asRecord.cost.toLocaleString()}원`}
                              {asRecord.note && <br />}
                              {asRecord.note && (
                                <span style={{ color: '#888' }}>
                                  메모: {asRecord.note}
                                </span>
                              )}
                            </Typography>
                            <Box
                              sx={{
                                display: 'flex',
                                flexDirection: 'column',
                                gap: 1,
                                alignItems: 'flex-end',
                              }}
                            >
                              <FormControl size="small" sx={{ width: '200px' }}>
                                <InputLabel
                                  sx={{ color: '#b0b8c1', fontSize: '0.75rem' }}
                                >
                                  처리방법
                                </InputLabel>
                                <Select
                                  value={asRecord.processMethod || '거래처AS'}
                                  onChange={e => {
                                    // AS 기록 업데이트
                                    const updatedASRecords =
                                      delivery.asRecords.map(record =>
                                        record.id === asRecord.id
                                          ? {
                                              ...record,
                                              processMethod: e.target.value as
                                                | '거래처AS'
                                                | '판매자AS'
                                                | '고객직접AS',
                                            }
                                          : record
                                      );

                                    // 납품 데이터 업데이트
                                    updateDelivery(delivery.id, {
                                      ...delivery,
                                      asRecords: updatedASRecords,
                                      updatedAt: new Date().toISOString(),
                                    });

                                    // AS방문일자가 있으면 스케줄 업데이트
                                    const updatedASRecord =
                                      updatedASRecords.find(
                                        record => record.id === asRecord.id
                                      );
                                    if (
                                      updatedASRecord &&
                                      updatedASRecord.visitDate
                                    ) {
                                      updateASSchedule(
                                        updatedASRecord,
                                        delivery
                                      );
                                    }
                                  }}
                                  label="처리방법"
                                  sx={{
                                    '& .MuiOutlinedInput-notchedOutline': {
                                      borderColor: '#3d3d3d',
                                    },
                                    '&:hover .MuiOutlinedInput-notchedOutline':
                                      { borderColor: '#4d4d4d' },
                                    '&.Mui-focused .MuiOutlinedInput-notchedOutline':
                                      { borderColor: '#40c4ff' },
                                    '& .MuiSelect-select': {
                                      color: '#e0e6ed',
                                      fontSize: '0.75rem',
                                    },
                                  }}
                                >
                                  <MenuItem value="거래처AS">거래처AS</MenuItem>
                                  <MenuItem value="판매자AS">판매자AS</MenuItem>
                                  <MenuItem value="고객직접AS">
                                    고객직접AS
                                  </MenuItem>
                                </Select>
                              </FormControl>
                              <TextField
                                label="AS방문일자"
                                type="datetime-local"
                                value={asRecord.visitDate || ''}
                                onChange={e => {
                                  // AS 기록 업데이트
                                  const updatedASRecords =
                                    delivery.asRecords.map(record =>
                                      record.id === asRecord.id
                                        ? {
                                            ...record,
                                            visitDate: e.target.value,
                                          }
                                        : record
                                    );

                                  // 납품 데이터 업데이트
                                  updateDelivery(delivery.id, {
                                    ...delivery,
                                    asRecords: updatedASRecords,
                                    updatedAt: new Date().toISOString(),
                                  });

                                  // 스케줄 업데이트 (처리방법과 방문일자 모두 고려)
                                  const updatedASRecord = updatedASRecords.find(
                                    record => record.id === asRecord.id
                                  );
                                  if (
                                    updatedASRecord &&
                                    updatedASRecord.visitDate
                                  ) {
                                    updateASSchedule(updatedASRecord, delivery);
                                  }
                                }}
                                size="small"
                                InputLabelProps={{ shrink: true }}
                                sx={{
                                  width: '200px',
                                  '& .MuiOutlinedInput-root': {
                                    '& fieldset': { borderColor: '#3d3d3d' },
                                    '&:hover fieldset': {
                                      borderColor: '#4d4d4d',
                                    },
                                    '&.Mui-focused fieldset': {
                                      borderColor: '#40c4ff',
                                    },
                                  },
                                  '& .MuiInputLabel-root': {
                                    color: '#b0b8c1',
                                    fontSize: '0.75rem',
                                  },
                                  '& .MuiInputBase-input': {
                                    color: '#e0e6ed',
                                    fontSize: '0.75rem',
                                  },
                                }}
                              />
                              <Button
                                variant="outlined"
                                size="small"
                                startIcon={<PrintIcon />}
                                onClick={() => {
                                  setShowCuteASForm(true);
                                  setSelectedASForCuteForm(asRecord);
                                }}
                                sx={{
                                  color: '#ff4b6e',
                                  borderColor: '#ffb6c1',
                                  fontSize: '0.75rem',
                                  py: 0.5,
                                  px: 1,
                                  minWidth: 'auto',
                                  borderRadius: 2,
                                  background:
                                    'linear-gradient(90deg, #fff0f5 0%, #ffb6c1 100%)',
                                  '&:hover': {
                                    borderColor: '#ff4b6e',
                                    background:
                                      'linear-gradient(90deg, #ffb6c1 0%, #fff0f5 100%)',
                                  },
                                }}
                              >
                                신청서
                              </Button>
                              <IconButton
                                size="small"
                                color="error"
                                onClick={() =>
                                  handleASDeleteClick(delivery, asRecord)
                                }
                                title="AS 기록 삭제"
                                sx={{
                                  transition: 'all 0.2s ease-in-out',
                                  '&:hover': {
                                    transform: 'scale(1.1)',
                                    backgroundColor: 'rgba(244, 67, 54, 0.1)',
                                  },
                                }}
                              >
                                <DeleteIcon fontSize="small" />
                              </IconButton>
                            </Box>
                          </Box>
                        </Box>
                      ))}
                    </Box>
                  )}
                </Box>
              </AccordionDetails>
            </Accordion>
          ))
        ) : (
          <Box sx={{ textAlign: 'center', color: 'var(--text-secondary-color)', py: 8 }}>
            <SearchIcon sx={{ fontSize: 64, color: 'var(--text-secondary-color)', mb: 2 }} />
            <Typography variant="h6" sx={{ mb: 1, color: 'var(--text-color)' }}>
              {searchConditions.searchText !== '' ||
              searchConditions.customerName !== '' ||
              searchConditions.projectName !== '' ||
              searchConditions.contact !== '' ||
              searchConditions.address !== ''
                ? '검색 결과가 없습니다.'
                : '납품 건이 없습니다.'}
            </Typography>
            <Typography variant="body2" sx={{ color: 'var(--text-secondary-color)' }}>
              {searchConditions.searchText !== '' ||
              searchConditions.customerName !== '' ||
              searchConditions.projectName !== '' ||
              searchConditions.contact !== '' ||
              searchConditions.address !== ''
                ? '검색 조건을 변경하거나 초기화 버튼을 눌러보세요.'
                : '발주관리에서 발주완료된 건이 자동으로 여기에 추가됩니다.'}
            </Typography>
          </Box>
        )}
      </Box>

      {/* 삭제 확인 다이얼로그 */}
      <Dialog
        open={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
        fullScreen={isMobile}
        disableEnforceFocus
        disableAutoFocus
        PaperProps={{
          sx: {
            backgroundColor: '#2d2d2d',
            borderRadius: 2,
            boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
            transition: 'all 0.3s ease-in-out',
          },
        }}
      >
        <DialogTitle
          sx={{
            color: '#e0e6ed',
            backgroundColor: '#2d2d2d',
            borderBottom: '1px solid #3d3d3d',
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            {isMobile && (
              <IconButton
                onClick={() => setDeleteDialogOpen(false)}
                sx={{ color: '#e0e6ed', mr: 1 }}
              >
                <ArrowBackIcon />
              </IconButton>
            )}
            <Typography variant={isMobile ? "h5" : "h6"}>
              🗑️ 삭제 확인
            </Typography>
          </Box>
        </DialogTitle>
        <DialogContent
          sx={{ backgroundColor: '#2d2d2d', color: '#e0e6ed', p: 3 }}
        >
          <Typography sx={{ lineHeight: 1.6 }}>
            정말로 이 납품 건을 삭제하시겠습니까?
            <br />
            <br />
            <Box
              sx={{ backgroundColor: '#1a1a1a', p: 2, borderRadius: 1, mb: 2 }}
            >
              <strong style={{ color: '#40c4ff' }}>프로젝트:</strong>{' '}
              {deliveryToDelete?.projectName}
              <br />
              <strong style={{ color: '#40c4ff' }}>고객명:</strong>{' '}
              {deliveryToDelete?.customerName}
            </Box>
            ⚠️ 이 작업은 되돌릴 수 없습니다.
          </Typography>
        </DialogContent>
        <DialogActions
          sx={{
            backgroundColor: '#2d2d2d',
            p: isMobile ? 3 : 2,
            borderTop: '1px solid #3d3d3d',
            gap: isMobile ? 2 : 1,
          }}
        >
          <Button
            onClick={() => setDeleteDialogOpen(false)}
            size={isMobile ? "large" : "medium"}
            sx={{
              color: '#b0b8c1',
              minWidth: isMobile ? 100 : 80,
              fontSize: isMobile ? 16 : 14,
              '&:hover': { backgroundColor: 'rgba(176, 184, 193, 0.1)' },
            }}
          >
            취소
          </Button>
          <Button
            onClick={handleDeleteConfirm}
            color="error"
            variant="contained"
            size={isMobile ? "large" : "medium"}
            sx={{
              minWidth: isMobile ? 100 : 80,
              fontSize: isMobile ? 16 : 14,
              '&:hover': {
                backgroundColor: '#d32f2f',
                transform: 'translateY(-1px)',
                boxShadow: '0 4px 8px rgba(211, 47, 47, 0.3)',
              },
              transition: 'all 0.2s ease-in-out',
            }}
          >
            삭제
          </Button>
        </DialogActions>
      </Dialog>

      {/* AS 접수 다이얼로그 */}
      <Dialog
        open={asDialogOpen}
        onClose={() => setAsDialogOpen(false)}
        maxWidth="md"
        fullWidth
        fullScreen={isMobile}
        disableEnforceFocus
        disableAutoFocus
        PaperProps={{
          sx: {
            backgroundColor: '#2d2d2d',
            borderRadius: 2,
            boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
            transition: 'all 0.3s ease-in-out',
          },
        }}
      >
        <DialogTitle
          sx={{
            color: '#e0e6ed',
            backgroundColor: '#2d2d2d',
            borderBottom: '1px solid #3d3d3d',
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            {isMobile && (
              <IconButton
                onClick={() => setAsDialogOpen(false)}
                sx={{ color: '#e0e6ed', mr: 1 }}
              >
                <ArrowBackIcon />
              </IconButton>
            )}
            <Typography variant={isMobile ? "h5" : "h6"}>
              🔧 AS 접수
            </Typography>
          </Box>
        </DialogTitle>
        <DialogContent
          sx={{ backgroundColor: '#2d2d2d', color: '#e0e6ed', p: 3 }}
        >
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <Box
                sx={{
                  backgroundColor: '#1a1a1a',
                  p: 2,
                  borderRadius: 1,
                  mb: 2,
                }}
              >
                <Typography
                  variant="subtitle2"
                  sx={{ color: '#40c4ff', mb: 1 }}
                >
                  📋 프로젝트 정보
                </Typography>
                <Grid container spacing={2}>
                  <Grid item xs={12} md={6}>
                    <Typography
                      variant="body2"
                      sx={{ color: '#b0b8c1', mb: 0.5 }}
                    >
                      <strong style={{ color: '#40c4ff' }}>프로젝트:</strong>{' '}
                      {selectedDeliveryForAS?.projectName}
                    </Typography>
                    <Typography
                      variant="body2"
                      sx={{ color: '#b0b8c1', mb: 0.5 }}
                    >
                      <strong style={{ color: '#40c4ff' }}>고객명:</strong>{' '}
                      {selectedDeliveryForAS?.customerName}
                    </Typography>
                    <Typography
                      variant="body2"
                      sx={{ color: '#b0b8c1', mb: 0.5 }}
                    >
                      <strong style={{ color: '#40c4ff' }}>연락처:</strong>{' '}
                      {selectedDeliveryForAS?.contact}
                    </Typography>
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <Typography
                      variant="body2"
                      sx={{ color: '#b0b8c1', mb: 0.5 }}
                    >
                      <strong style={{ color: '#40c4ff' }}>
                        시공/납품일자:
                      </strong>{' '}
                      {selectedDeliveryForAS?.constructionDate}
                    </Typography>
                    <Typography
                      variant="body2"
                      sx={{ color: '#b0b8c1', mb: 0.5 }}
                    >
                      <strong style={{ color: '#40c4ff' }}>AS 장소:</strong>{' '}
                      {selectedDeliveryForAS?.projectName
                        ? `${selectedDeliveryForAS.projectName} (고객 주소)`
                        : selectedDeliveryForAS?.address}
                    </Typography>
                    <Typography
                      variant="body2"
                      sx={{ color: '#b0b8c1', mb: 0.5 }}
                    >
                      <strong style={{ color: '#40c4ff' }}>거래처:</strong>{' '}
                      {asForm.vendor || '-'}
                    </Typography>
                  </Grid>
                </Grid>
              </Box>
            </Grid>
            <Grid item xs={12} md={6}>
              <FormControl fullWidth size="small">
                <InputLabel sx={{ color: '#b0b8c1' }}>제품 선택 *</InputLabel>
                <Select
                  value={asForm.productName}
                  onChange={e => {
                    const selectedValue = e.target.value;
                    setAsForm({ ...asForm, productName: selectedValue });

                    // 선택된 제품의 상세 정보 찾기
                    const selectedProduct = uniqueDeliveries
                      .flatMap(delivery => delivery.items || [])
                      .find(
                        item =>
                          `${item.space} - ${item.productCode}` ===
                          selectedValue
                      );

                    if (selectedProduct) {
                      // 제품 정보를 AS 폼에 자동 입력
                      setAsForm(prev => ({
                        ...prev,
                        productName: selectedValue,
                        space: selectedProduct.space || '',
                        productCode: selectedProduct.productCode || '',
                        productionDimensions:
                          selectedProduct.productionWidth &&
                          selectedProduct.productionHeight
                            ? `${selectedProduct.productionWidth}×${selectedProduct.productionHeight}`
                            : '',
                        vendor: selectedProduct.vendor || '',
                      }));
                    }
                  }}
                  label="제품 선택 *"
                  sx={{
                    color: '#e0e6ed',
                    '& .MuiOutlinedInput-notchedOutline': {
                      borderColor: '#3d3d3d',
                    },
                    '&:hover .MuiOutlinedInput-notchedOutline': {
                      borderColor: '#4d4d4d',
                    },
                    '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                      borderColor: '#40c4ff',
                    },
                  }}
                >
                  {uniqueDeliveries.flatMap(delivery =>
                    (delivery.items || []).map(item => (
                      <MenuItem
                        key={item.id}
                        value={`${item.space} - ${item.productCode}`}
                      >
                        {item.space} - {item.productCode} ({item.productName})
                      </MenuItem>
                    ))
                  )}
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12} md={6}>
              <FormControl fullWidth size="small">
                <InputLabel sx={{ color: '#b0b8c1' }}>처리방법 *</InputLabel>
                <Select
                  value={asForm.processMethod}
                  onChange={e =>
                    setAsForm({
                      ...asForm,
                      processMethod: e.target.value as
                        | '거래처AS'
                        | '판매자AS'
                        | '고객직접AS',
                    })
                  }
                  label="처리방법 *"
                  sx={{
                    color: '#e0e6ed',
                    '& .MuiOutlinedInput-notchedOutline': {
                      borderColor: '#3d3d3d',
                    },
                    '&:hover .MuiOutlinedInput-notchedOutline': {
                      borderColor: '#4d4d4d',
                    },
                    '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                      borderColor: '#40c4ff',
                    },
                  }}
                >
                  <MenuItem value="거래처AS">거래처AS</MenuItem>
                  <MenuItem value="판매자AS">판매자AS</MenuItem>
                  <MenuItem value="고객직접AS">고객직접AS</MenuItem>
                </Select>
              </FormControl>
            </Grid>

            {/* 선택된 제품 정보 표시 */}
            {asForm.productName && (
              <Grid item xs={12}>
                <Box
                  sx={{
                    backgroundColor: '#1a1a1a',
                    p: 2,
                    borderRadius: 1,
                    mb: 2,
                  }}
                >
                  <Typography
                    variant="subtitle2"
                    sx={{ color: '#40c4ff', mb: 1 }}
                  >
                    📋 선택된 제품 정보
                  </Typography>
                  <Grid container spacing={2}>
                    <Grid item xs={12} md={4}>
                      <Typography
                        variant="body2"
                        sx={{ color: '#b0b8c1', mb: 0.5 }}
                      >
                        <strong style={{ color: '#40c4ff' }}>공간:</strong>{' '}
                        {asForm.space}
                      </Typography>
                    </Grid>
                    <Grid item xs={12} md={4}>
                      <Typography
                        variant="body2"
                        sx={{ color: '#b0b8c1', mb: 0.5 }}
                      >
                        <strong style={{ color: '#40c4ff' }}>제품코드:</strong>{' '}
                        {asForm.productCode}
                      </Typography>
                    </Grid>
                    <Grid item xs={12} md={4}>
                      <Typography
                        variant="body2"
                        sx={{ color: '#b0b8c1', mb: 0.5 }}
                      >
                        <strong style={{ color: '#40c4ff' }}>
                          제작사이즈:
                        </strong>{' '}
                        {asForm.productionDimensions}
                      </Typography>
                    </Grid>
                  </Grid>
                </Box>
              </Grid>
            )}
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="문제점 *"
                value={asForm.issue}
                onChange={e => setAsForm({ ...asForm, issue: e.target.value })}
                multiline
                rows={3}
                sx={{
                  color: '#e0e6ed',
                  '& .MuiOutlinedInput-root': {
                    '& fieldset': { borderColor: '#3d3d3d' },
                    '&:hover fieldset': { borderColor: '#4d4d4d' },
                    '&.Mui-focused fieldset': { borderColor: '#40c4ff' },
                  },
                }}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="해결방안"
                value={asForm.solution}
                onChange={e =>
                  setAsForm({ ...asForm, solution: e.target.value })
                }
                multiline
                rows={3}
                sx={{
                  color: '#e0e6ed',
                  '& .MuiOutlinedInput-root': {
                    '& fieldset': { borderColor: '#3d3d3d' },
                    '&:hover fieldset': { borderColor: '#4d4d4d' },
                    '&.Mui-focused fieldset': { borderColor: '#40c4ff' },
                  },
                }}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="비용"
                type="number"
                value={asForm.cost}
                onChange={e => setAsForm({ ...asForm, cost: e.target.value })}
                sx={{
                  color: '#e0e6ed',
                  '& .MuiOutlinedInput-root': {
                    '& fieldset': { borderColor: '#3d3d3d' },
                    '&:hover fieldset': { borderColor: '#4d4d4d' },
                    '&.Mui-focused fieldset': { borderColor: '#40c4ff' },
                  },
                }}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="메모"
                value={asForm.note}
                onChange={e => setAsForm({ ...asForm, note: e.target.value })}
                multiline
                rows={2}
                sx={{
                  color: '#e0e6ed',
                  '& .MuiOutlinedInput-root': {
                    '& fieldset': { borderColor: '#3d3d3d' },
                    '&:hover fieldset': { borderColor: '#4d4d4d' },
                    '&.Mui-focused fieldset': { borderColor: '#40c4ff' },
                  },
                }}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions
          sx={{
            backgroundColor: '#2d2d2d',
            p: isMobile ? 3 : 2,
            borderTop: '1px solid #3d3d3d',
            gap: isMobile ? 2 : 1,
          }}
        >
          <Button
            onClick={() => setAsDialogOpen(false)}
            size={isMobile ? "large" : "medium"}
            sx={{
              color: '#b0b8c1',
              minWidth: isMobile ? 100 : 80,
              fontSize: isMobile ? 16 : 14,
              '&:hover': { backgroundColor: 'rgba(176, 184, 193, 0.1)' },
            }}
          >
            취소
          </Button>
          <Button
            onClick={handleASSubmit}
            color="primary"
            variant="contained"
            size={isMobile ? "large" : "medium"}
            disabled={!asForm.productName || !asForm.issue}
            sx={{
              minWidth: isMobile ? 100 : 80,
              fontSize: isMobile ? 16 : 14,
              '&:hover': {
                transform: 'translateY(-1px)',
                boxShadow: '0 4px 8px rgba(64, 196, 255, 0.3)',
              },
              transition: 'all 0.2s ease-in-out',
            }}
          >
            AS 접수
          </Button>
        </DialogActions>
      </Dialog>

      {/* 수금 입력 다이얼로그 */}
      <Dialog
        open={paymentDialogOpen}
        onClose={handlePaymentClose}
        maxWidth="sm"
        fullWidth
        fullScreen={isMobile}
        PaperProps={{
          sx: {
            backgroundColor: '#2d2d2d',
            color: '#e0e6ed',
            border: '1px solid rgba(255,255,255,0.1)',
            borderRadius: 2,
          },
        }}
      >
        <DialogTitle
          sx={{
            borderBottom: '1px solid rgba(255,255,255,0.1)',
            backgroundColor: '#263040',
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            {isMobile && (
              <IconButton
                onClick={handlePaymentClose}
                sx={{ color: '#e0e6ed', mr: 1 }}
              >
                <ArrowBackIcon />
              </IconButton>
            )}
            <Typography variant={isMobile ? "h5" : "h6"}>
              💰 수금 입력
            </Typography>
          </Box>
        </DialogTitle>
        <DialogContent sx={{ pt: 3 }}>
          {selectedDeliveryForPayment && (
            <Box
              sx={{
                mb: 3,
                p: 2,
                backgroundColor: 'rgba(255,255,255,0.05)',
                borderRadius: 1,
              }}
            >
              <Typography variant="subtitle2" sx={{ color: '#40c4ff', mb: 1 }}>
                납품 정보
              </Typography>
              <Typography variant="body2" sx={{ color: '#b0b8c1', mb: 0.5 }}>
                고객명: {selectedDeliveryForPayment.customerName}
              </Typography>
              <Typography variant="body2" sx={{ color: '#b0b8c1', mb: 0.5 }}>
                프로젝트: {selectedDeliveryForPayment.projectName}
              </Typography>
              <Typography variant="body2" sx={{ color: '#b0b8c1', mb: 0.5 }}>
                할인후금액:{' '}
                {(selectedDeliveryForPayment.finalAmount || 0).toLocaleString()}
                원
              </Typography>
              <Typography variant="body2" sx={{ color: '#b0b8c1', mb: 0.5 }}>
                현재입금액:{' '}
                {(selectedDeliveryForPayment.paidAmount || 0).toLocaleString()}
                원
              </Typography>
              <Typography variant="body2" sx={{ color: '#b0b8c1' }}>
                잔액:{' '}
                {(
                  selectedDeliveryForPayment.remainingAmount || 0
                ).toLocaleString()}
                원
              </Typography>
            </Box>
          )}

          <Grid container spacing={2}>
            <Grid item xs={12}>
              <TextField
                label="수금 금액"
                type="number"
                value={paymentForm.amount}
                onChange={e =>
                  setPaymentForm({ ...paymentForm, amount: e.target.value })
                }
                fullWidth
                placeholder="수금할 금액을 입력하세요"
                sx={{
                  '& .MuiOutlinedInput-root': {
                    color: '#e0e6ed',
                    '& fieldset': { borderColor: 'rgba(255,255,255,0.2)' },
                    '&:hover fieldset': {
                      borderColor: 'rgba(255,255,255,0.3)',
                    },
                    '&.Mui-focused fieldset': { borderColor: '#40c4ff' },
                  },
                  '& .MuiInputLabel-root': { color: '#b0b8c1' },
                  '& .MuiInputBase-input::placeholder': { color: '#666' },
                }}
              />
            </Grid>
            <Grid item xs={12}>
              <FormControl fullWidth>
                <InputLabel sx={{ color: '#b0b8c1' }}>결제 방법</InputLabel>
                <Select
                  value={paymentForm.method}
                  onChange={e =>
                    setPaymentForm({
                      ...paymentForm,
                      method: e.target.value as '현금' | '계좌이체' | '카드',
                    })
                  }
                  sx={{
                    color: '#e0e6ed',
                    '& .MuiOutlinedInput-notchedOutline': {
                      borderColor: 'rgba(255,255,255,0.2)',
                    },
                    '&:hover .MuiOutlinedInput-notchedOutline': {
                      borderColor: 'rgba(255,255,255,0.3)',
                    },
                    '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                      borderColor: '#40c4ff',
                    },
                  }}
                >
                  <MenuItem value="현금">현금</MenuItem>
                  <MenuItem value="계좌이체">계좌이체</MenuItem>
                  <MenuItem value="카드">카드</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12}>
              <TextField
                label="메모"
                value={paymentForm.note}
                onChange={e =>
                  setPaymentForm({ ...paymentForm, note: e.target.value })
                }
                fullWidth
                multiline
                rows={3}
                placeholder="수금 관련 메모를 입력하세요"
                sx={{
                  '& .MuiOutlinedInput-root': {
                    color: '#e0e6ed',
                    '& fieldset': { borderColor: 'rgba(255,255,255,0.2)' },
                    '&:hover fieldset': {
                      borderColor: 'rgba(255,255,255,0.3)',
                    },
                    '&.Mui-focused fieldset': { borderColor: '#40c4ff' },
                  },
                  '& .MuiInputLabel-root': { color: '#b0b8c1' },
                  '& .MuiInputBase-input::placeholder': { color: '#666' },
                }}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions
          sx={{
            borderTop: '1px solid rgba(255,255,255,0.1)',
            backgroundColor: '#263040',
            p: isMobile ? 3 : 2,
            gap: isMobile ? 2 : 1,
          }}
        >
          <Button
            onClick={handlePaymentClose}
            size={isMobile ? "large" : "medium"}
            sx={{
              color: '#b0b8c1',
              minWidth: isMobile ? 100 : 80,
              fontSize: isMobile ? 16 : 14,
              '&:hover': { backgroundColor: 'rgba(255,255,255,0.1)' },
            }}
          >
            취소
          </Button>
          <Button
            onClick={handlePaymentSubmit}
            variant="contained"
            size={isMobile ? "large" : "medium"}
            disabled={!paymentForm.amount}
            sx={{
              backgroundColor: '#40c4ff',
              minWidth: isMobile ? 100 : 80,
              fontSize: isMobile ? 16 : 14,
              '&:hover': { backgroundColor: '#2196f3' },
              '&:disabled': { backgroundColor: '#666' },
            }}
          >
            수금 입력
          </Button>
        </DialogActions>
      </Dialog>

      {/* AS 출력 다이얼로그 */}
      <Dialog
        open={asPrintDialogOpen}
        onClose={() => setAsPrintDialogOpen(false)}
        maxWidth="sm"
        fullWidth
        fullScreen={isMobile}
        PaperProps={{
          sx: {
            backgroundColor: '#2d2d2d',
            color: '#e0e6ed',
            border: '1px solid rgba(255,255,255,0.1)',
            borderRadius: 2,
          },
        }}
      >
        <DialogTitle
          sx={{
            borderBottom: '1px solid rgba(255,255,255,0.1)',
            backgroundColor: '#263040',
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            {isMobile && (
              <IconButton
                onClick={() => setAsPrintDialogOpen(false)}
                sx={{ color: '#e0e6ed', mr: 1 }}
              >
                <ArrowBackIcon />
              </IconButton>
            )}
            <Typography variant={isMobile ? "h5" : "h6"}>
              📄 AS신청서 출력
            </Typography>
          </Box>
        </DialogTitle>
        <DialogContent sx={{ pt: 3 }}>
          {selectedASForPrint && (
            <Box
              sx={{
                mb: 3,
                p: 2,
                backgroundColor: 'rgba(255,255,255,0.05)',
                borderRadius: 1,
              }}
            >
              <Typography variant="subtitle2" sx={{ color: '#40c4ff', mb: 1 }}>
                선택된 AS 정보
              </Typography>
              <Typography variant="body2" sx={{ color: '#b0b8c1', mb: 0.5 }}>
                제품: {selectedASForPrint.productName}
              </Typography>
              <Typography variant="body2" sx={{ color: '#b0b8c1', mb: 0.5 }}>
                문제: {selectedASForPrint.issue}
              </Typography>
              <Typography variant="body2" sx={{ color: '#b0b8c1' }}>
                상태: {selectedASForPrint.status}
              </Typography>
            </Box>
          )}

          <Typography variant="body2" sx={{ color: '#b0b8c1', mb: 2 }}>
            출력 방식을 선택하세요:
          </Typography>

          <Grid container spacing={2}>
            <Grid item xs={12} sm={4}>
              <Button
                fullWidth
                variant="outlined"
                startIcon={<PrintIcon />}
                onClick={handlePrintAS}
                sx={{
                  color: '#40c4ff',
                  borderColor: '#40c4ff',
                  py: 2,
                  '&:hover': {
                    borderColor: '#2196f3',
                    backgroundColor: 'rgba(64, 196, 255, 0.1)',
                  },
                }}
              >
                프린트
              </Button>
            </Grid>
            <Grid item xs={12} sm={4}>
              <Button
                fullWidth
                variant="outlined"
                startIcon={<ImageIcon />}
                onClick={handleExportASAsJPG}
                sx={{
                  color: '#4caf50',
                  borderColor: '#4caf50',
                  py: 2,
                  '&:hover': {
                    borderColor: '#388e3c',
                    backgroundColor: 'rgba(76, 175, 80, 0.1)',
                  },
                }}
              >
                JPG
              </Button>
            </Grid>
            <Grid item xs={12} sm={4}>
              <Button
                fullWidth
                variant="outlined"
                startIcon={<PdfIcon />}
                onClick={handleExportASAsPDF}
                sx={{
                  color: '#f44336',
                  borderColor: '#f44336',
                  py: 2,
                  '&:hover': {
                    borderColor: '#d32f2f',
                    backgroundColor: 'rgba(244, 67, 54, 0.1)',
                  },
                }}
              >
                PDF
              </Button>
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions
          sx={{
            borderTop: '1px solid rgba(255,255,255,0.1)',
            backgroundColor: '#263040',
            p: isMobile ? 3 : 2,
            gap: isMobile ? 2 : 1,
          }}
        >
          <Button
            onClick={() => setAsPrintDialogOpen(false)}
            size={isMobile ? "large" : "medium"}
            sx={{
              color: '#b0b8c1',
              minWidth: isMobile ? 100 : 80,
              fontSize: isMobile ? 16 : 14,
              '&:hover': { backgroundColor: 'rgba(255,255,255,0.1)' },
            }}
          >
            취소
          </Button>
        </DialogActions>
      </Dialog>

      {/* AS 기록 삭제 확인 다이얼로그 */}
      <Dialog
        open={asDeleteDialogOpen}
        onClose={() => setAsDeleteDialogOpen(false)}
        maxWidth="sm"
        fullWidth
        fullScreen={isMobile}
        PaperProps={{
          sx: {
            backgroundColor: '#2d2d2d',
            color: '#e0e6ed',
            border: '1px solid rgba(255,255,255,0.1)',
            borderRadius: 2,
          },
        }}
      >
        <DialogTitle
          sx={{
            borderBottom: '1px solid rgba(255,255,255,0.1)',
            backgroundColor: '#263040',
            display: 'flex',
            alignItems: 'center',
            gap: 1,
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            {isMobile && (
              <IconButton
                onClick={() => setAsDeleteDialogOpen(false)}
                sx={{ color: '#e0e6ed', mr: 1 }}
              >
                <ArrowBackIcon />
              </IconButton>
            )}
            <DeleteIcon sx={{ color: '#f44336' }} />
            <Typography variant={isMobile ? "h5" : "h6"}>
              AS 기록 삭제 확인
            </Typography>
          </Box>
        </DialogTitle>
        <DialogContent sx={{ pt: 3 }}>
          {asRecordToDelete && (
            <Box>
              <Typography variant="body1" sx={{ color: '#e0e6ed', mb: 2 }}>
                다음 AS 기록을 삭제하시겠습니까?
              </Typography>
              <Box
                sx={{
                  p: 2,
                  backgroundColor: 'rgba(244, 67, 54, 0.1)',
                  borderRadius: 1,
                  border: '1px solid rgba(244, 67, 54, 0.3)',
                }}
              >
                <Typography variant="body2" sx={{ color: '#b0b8c1', mb: 1 }}>
                  <strong>고객명:</strong>{' '}
                  {asRecordToDelete.delivery.customerName}
                </Typography>
                <Typography variant="body2" sx={{ color: '#b0b8c1', mb: 1 }}>
                  <strong>제품:</strong> {asRecordToDelete.asRecord.productName}
                </Typography>
                <Typography variant="body2" sx={{ color: '#b0b8c1', mb: 1 }}>
                  <strong>문제:</strong> {asRecordToDelete.asRecord.issue}
                </Typography>
                <Typography variant="body2" sx={{ color: '#b0b8c1', mb: 1 }}>
                  <strong>접수일:</strong> {asRecordToDelete.asRecord.date}
                </Typography>
                {asRecordToDelete.asRecord.visitDate && (
                  <Typography variant="body2" sx={{ color: '#b0b8c1' }}>
                    <strong>방문일:</strong>{' '}
                    {asRecordToDelete.asRecord.visitDate}
                  </Typography>
                )}
              </Box>
              <Typography
                variant="body2"
                sx={{ color: '#ff9800', mt: 2, fontWeight: 'bold' }}
              >
                ⚠️ 이 작업은 되돌릴 수 없으며, 캘린더의 해당 AS 일정도 함께
                삭제됩니다.
              </Typography>
            </Box>
          )}
        </DialogContent>
        <DialogActions
          sx={{
            borderTop: '1px solid rgba(255,255,255,0.1)',
            backgroundColor: '#263040',
            p: isMobile ? 3 : 2,
            gap: isMobile ? 2 : 1,
          }}
        >
          <Button
            onClick={() => setAsDeleteDialogOpen(false)}
            size={isMobile ? "large" : "medium"}
            sx={{
              color: '#b0b8c1',
              minWidth: isMobile ? 100 : 80,
              fontSize: isMobile ? 16 : 14,
              '&:hover': { backgroundColor: 'rgba(255,255,255,0.1)' },
            }}
          >
            취소
          </Button>
          <Button
            onClick={handleASDeleteConfirm}
            variant="contained"
            color="error"
            size={isMobile ? "large" : "medium"}
            startIcon={<DeleteIcon />}
            sx={{
              backgroundColor: '#f44336',
              minWidth: isMobile ? 100 : 80,
              fontSize: isMobile ? 16 : 14,
              '&:hover': { backgroundColor: '#d32f2f' },
            }}
          >
            삭제
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      >
        <Alert
          onClose={() => setSnackbar({ ...snackbar, open: false })}
          severity={snackbar.severity}
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>

      {/* 모달 추가 */}
      <CuteASApplicationModal
        open={showCuteASForm}
        asRecord={selectedASForCuteForm}
        onClose={() => setShowCuteASForm(false)}
      />

      {orderDetailModalGroup && (
        <OrderDetailModal
          open={!!orderDetailModalGroup}
          group={orderDetailModalGroup}
          onClose={() => setOrderDetailModalGroup(null)}
        />
      )}
    </Box>
  );
};

export default DeliveryManagement;
