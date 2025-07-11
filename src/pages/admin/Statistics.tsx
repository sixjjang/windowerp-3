import React, { useState, useEffect } from 'react';
import { API_BASE } from '../../utils/auth';
import {
  Box,
  Typography,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  Select,
  MenuItem,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Alert,
  Snackbar,
  Tabs,
  Tab,
  Card,
  CardContent,
  Chip,
  Grid,
  Paper,
  TableContainer,
  IconButton,
  useMediaQuery,
  useTheme,
} from '@mui/material';
import {
  TrendingUp,
  AccountBalance,
  Sync,
  AutoGraph,
  BarChart,
  PieChart,
  ShowChart,
  Refresh,
} from '@mui/icons-material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  PointElement,
  LineElement,
  Filler,
} from 'chart.js';
import { Bar, Doughnut, Line } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  PointElement,
  LineElement,
  Filler
);

interface SalesRecord {
  id: number;
  productName: string;
  productCode: string;
  partner: string;
  category: string;
  quantity: number;
  amount: number;
  date: string;
  createdAt: string;
  updatedAt: string;
}

interface Estimate {
  id: number;
  estimateNo: string;
  customerName: string;
  projectName?: string;
  totalAmount: number;
  discountedAmount?: number;
  estimateDate: string;
  status: string;
  contact?: string;
  emergencyContact?: string;
  type?: string;
  address?: string;
  products?: string;
  createdAt: string;
  updatedAt: string;
}

interface Contract {
  id: number;
  contractNo: string;
  estimateNo: string;
  customerName: string;
  projectName?: string;
  totalAmount: number;
  depositAmount: number;
  balanceAmount: number;
  contractDate: string;
  constructionDate?: string;
  status: string;
  createdAt: string;
  updatedAt: string;
}

interface Delivery {
  id: number;
  deliveryNo: string;
  contractNo: string;
  estimateNo: string;
  customerName: string;
  projectName?: string;
  totalAmount: number;
  deliveryDate: string;
  status: string;
  paymentStatus: string;
  createdAt: string;
  updatedAt: string;
}

interface ProfitAnalysis {
  id: number;
  estimateNo: string;
  contractNo?: string;
  deliveryNo?: string;
  customerName: string;
  projectName?: string;
  totalRevenue: number;
  totalCost: number;
  grossProfit: number;
  grossMargin: number;
  netProfit?: number;
  netMargin?: number;
  roi: number;
  analysisDate: string;
  createdAt: string;
  updatedAt: string;
}


const getUnique = (arr: string[]) => Array.from(new Set(arr));

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`statistics-tabpanel-${index}`}
      aria-labelledby={`statistics-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  );
}

export default function Statistics() {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  
  const [tabValue, setTabValue] = useState(0);
  const [sales, setSales] = useState<SalesRecord[]>([]);
  const [estimates, setEstimates] = useState<Estimate[]>([]);
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [deliveries, setDeliveries] = useState<Delivery[]>([]);
  const [profitAnalysis, setProfitAnalysis] = useState<ProfitAnalysis[]>([]);

  const [filter, setFilter] = useState({
    month: '2024-06',
    partner: '',
    category: '',
    product: '',
  });
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState<
    Omit<SalesRecord, 'id' | 'createdAt' | 'updatedAt'>
  >({
    productName: '',
    productCode: '',
    partner: '',
    category: '',
    quantity: 0,
    amount: 0,
    date: new Date().toISOString().slice(0, 10),
  });
  const [loading, setLoading] = useState(false);
  const [snackbar, setSnackbar] = useState<{
    open: boolean;
    message: string;
    severity: 'success' | 'error';
  }>({ open: false, message: '', severity: 'success' });

  // 자동 연동 상태
  const [autoSyncLoading, setAutoSyncLoading] = useState(false);

  // 데이터 로드 함수들
  const loadSales = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filter.month) params.append('month', filter.month);
      if (filter.partner) params.append('partner', filter.partner);
      if (filter.category) params.append('category', filter.category);
      if (filter.product) params.append('product', filter.product);

      const url = `${API_BASE}/sales-records${params.toString() ? '?' + params.toString() : ''}`;
      const response = await fetch(url);
      if (!response.ok) throw new Error('데이터 로드 실패');
      const data = await response.json();
      setSales(data);
    } catch (error) {
      console.error('매출 데이터 로드 오류:', error);
      setSnackbar({
        open: true,
        message: '데이터 로드에 실패했습니다.',
        severity: 'error',
      });
    } finally {
      setLoading(false);
    }
  };

  const loadEstimates = async () => {
    try {
      const response = await fetch(`${API_BASE}/estimates`);
      if (!response.ok) throw new Error('견적 데이터 로드 실패');
      const data = await response.json();
      setEstimates(data);
    } catch (error) {
      console.error('견적 데이터 로드 오류:', error);
    }
  };

  const loadContracts = async () => {
    try {
      const response = await fetch(`${API_BASE}/contracts`);
      if (!response.ok) throw new Error('계약 데이터 로드 실패');
      const data = await response.json();
      setContracts(data);
    } catch (error) {
      console.error('계약 데이터 로드 오류:', error);
    }
  };

  const loadDeliveries = async () => {
    try {
      const response = await fetch(`${API_BASE}/deliveries`);
      if (!response.ok) throw new Error('배송 데이터 로드 실패');
      const data = await response.json();
      setDeliveries(data);
    } catch (error) {
      console.error('배송 데이터 로드 오류:', error);
    }
  };

  const loadProfitAnalysis = async () => {
    try {
      const response = await fetch(`${API_BASE}/profit-analysis`);
      if (!response.ok) throw new Error('수익성 분석 데이터 로드 실패');
      const data = await response.json();
      setProfitAnalysis(data);
    } catch (error) {
      console.error('수익성 분석 데이터 로드 오류:', error);
    }
  };

  useEffect(() => {
    loadSales();
    loadEstimates();
    loadContracts();
    loadDeliveries();
    loadProfitAnalysis();
  }, [filter]);

  // 자동 연동 함수들
  const handleAutoSync = async () => {
    setAutoSyncLoading(true);
    try {
      // 견적에서 계약으로 자동 연동
      for (const estimate of estimates.filter(e => e.status === 'draft')) {
        try {
          await fetch(`${API_BASE}/auto-sync/estimate-to-contract`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ estimateNo: estimate.estimateNo }),
          });
        } catch (error) {
          console.error('견적-계약 연동 오류:', error);
        }
      }

      // 계약에서 배송으로 자동 연동
      for (const contract of contracts.filter(c => c.status === 'draft')) {
        try {
          await fetch(`${API_BASE}/auto-sync/contract-to-delivery`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ contractNo: contract.contractNo }),
          });
        } catch (error) {
          console.error('계약-배송 연동 오류:', error);
        }
      }

      // 배송에서 매출로 자동 연동
      for (const delivery of deliveries.filter(d => d.status === 'pending')) {
        try {
          await fetch(`${API_BASE}/auto-sync/delivery-to-sales`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ deliveryNo: delivery.deliveryNo }),
          });
        } catch (error) {
          console.error('배송-매출 연동 오류:', error);
        }
      }

      // 데이터 새로고침
      await Promise.all([
        loadEstimates(),
        loadContracts(),
        loadDeliveries(),
        loadSales(),
      ]);

      setSnackbar({
        open: true,
        message: '자동 연동이 완료되었습니다.',
        severity: 'success',
      });
    } catch (error) {
      console.error('자동 연동 오류:', error);
      setSnackbar({
        open: true,
        message: '자동 연동 중 오류가 발생했습니다.',
        severity: 'error',
      });
    } finally {
      setAutoSyncLoading(false);
    }
  };

  // 계산 함수들
  const filtered = sales;

  const productStats = getUnique(filtered.map(s => s.productName)).map(name => {
    const items = filtered.filter(s => s.productName === name);
    return {
      name,
      quantity: items.reduce((sum, s) => sum + s.quantity, 0),
      amount: items.reduce((sum, s) => sum + s.amount, 0),
    };
  });

  const partnerStats = getUnique(filtered.map(s => s.partner)).map(name => {
    const items = filtered.filter(s => s.partner === name);
    return {
      name,
      quantity: items.reduce((sum, s) => sum + s.quantity, 0),
      amount: items.reduce((sum, s) => sum + s.amount, 0),
    };
  });

  const categoryStats = getUnique(filtered.map(s => s.category)).map(name => {
    const items = filtered.filter(s => s.category === name);
    return {
      name,
      quantity: items.reduce((sum, s) => sum + s.quantity, 0),
      amount: items.reduce((sum, s) => sum + s.amount, 0),
    };
  });

  const totalRevenue = filtered.reduce((sum, s) => sum + s.amount, 0);
  const totalEstimates = estimates.reduce((sum, e) => sum + e.totalAmount, 0);
  const totalContracts = contracts.reduce((sum, c) => sum + c.totalAmount, 0);
  const totalDeliveries = deliveries.reduce((sum, d) => sum + d.totalAmount, 0);
  const averageGrossMargin =
    profitAnalysis.length > 0
      ? profitAnalysis.reduce((sum, p) => sum + p.grossMargin, 0) /
        profitAnalysis.length
      : 0;

  // 차트 데이터
  const salesChartData = {
    labels: productStats.map(s => s.name),
    datasets: [
      {
        label: '매출액',
        data: productStats.map(s => s.amount),
        backgroundColor: 'rgba(54, 162, 235, 0.5)',
        borderColor: 'rgba(54, 162, 235, 1)',
        borderWidth: 1,
      },
    ],
  };

  const partnerChartData = {
    labels: partnerStats.map(s => s.name),
    datasets: [
      {
        label: '거래처별 매출',
        data: partnerStats.map(s => s.amount),
        backgroundColor: 'rgba(75, 192, 192, 0.5)',
        borderColor: 'rgba(75, 192, 192, 1)',
        borderWidth: 1,
      },
    ],
  };

  const profitChartData = {
    labels: profitAnalysis.slice(-10).map(p => p.customerName),
    datasets: [
      {
        label: '총수익',
        data: profitAnalysis.slice(-10).map(p => p.totalRevenue),
        borderColor: 'rgba(255, 99, 132, 1)',
        backgroundColor: 'rgba(255, 99, 132, 0.1)',
        fill: true,
      },
      {
        label: '총비용',
        data: profitAnalysis.slice(-10).map(p => p.totalCost),
        borderColor: 'rgba(54, 162, 235, 1)',
        backgroundColor: 'rgba(54, 162, 235, 0.1)',
        fill: true,
      },
    ],
  };

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  const handleOpen = () => {
    setForm({
      productName: '',
      productCode: '',
      partner: '',
      category: '',
      quantity: 0,
      amount: 0,
      date: new Date().toISOString().slice(0, 10),
    });
    setDialogOpen(true);
  };

  const handleClose = () => setDialogOpen(false);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | { name?: string; value: unknown }>
  ) => {
    const { name, value } = e.target;
    setForm(f => ({
      ...f,
      [name!]: name === 'quantity' || name === 'amount' ? Number(value) : value,
    }));
  };

  const handleSave = async () => {
    try {
      const response = await fetch(`${API_BASE}/sales-records`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      if (!response.ok) throw new Error('등록 실패');

      setSnackbar({
        open: true,
        message: '매출 기록이 등록되었습니다.',
        severity: 'success',
      });
      setDialogOpen(false);
      loadSales();
    } catch (error) {
      console.error('매출 기록 저장 오류:', error);
      setSnackbar({
        open: true,
        message: '저장에 실패했습니다.',
        severity: 'error',
      });
    }
  };

  return (
    <Box sx={{ p: 3 }}>
      <Typography
        variant="h4"
        gutterBottom
        sx={{ display: 'flex', alignItems: 'center', gap: 2 }}
      >
        <BarChart color="primary" />
        매출/판매 통계
      </Typography>

      {/* 대시보드 카드 */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                총 매출액
              </Typography>
              <Typography variant="h4">
                {totalRevenue.toLocaleString()}원
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                총 견적액
              </Typography>
              <Typography variant="h4">
                {totalEstimates.toLocaleString()}원
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                총 계약액
              </Typography>
              <Typography variant="h4">
                {totalContracts.toLocaleString()}원
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                평균 마진율
              </Typography>
              <Typography variant="h4">
                {averageGrossMargin.toFixed(1)}%
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* 자동 연동 버튼 */}
      <Box sx={{ mb: 2, display: 'flex', gap: 2, alignItems: 'center' }}>
        <Button
          variant="contained"
          color="secondary"
          onClick={handleAutoSync}
          disabled={autoSyncLoading}
          startIcon={<Sync />}
        >
          {autoSyncLoading ? '연동 중...' : '자동 데이터 연동'}
        </Button>
        <Typography variant="body2" color="textSecondary">
          견적 → 계약 → 배송 → 매출 자동 연동
        </Typography>
      </Box>

      {/* 탭 메뉴 */}
      <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
        <Tabs value={tabValue} onChange={handleTabChange} aria-label="통계 탭">
          <Tab label="매출 통계" icon={<BarChart />} />
          <Tab label="수익성 분석" icon={<TrendingUp />} />
          <Tab label="자동 연동 현황" icon={<Sync />} />
        </Tabs>
      </Box>

      {/* 매출 통계 탭 */}
      <TabPanel value={tabValue} index={0}>
        <Box sx={{ mb: 2, display: 'flex', gap: 2, alignItems: 'center' }}>
          <Select
            value={filter.month}
            onChange={e =>
              setFilter(f => ({ ...f, month: e.target.value as string }))
            }
            size="small"
          >
            <MenuItem value="2024-06">2024-06</MenuItem>
            <MenuItem value="2024-05">2024-05</MenuItem>
          </Select>
          <Select
            value={filter.partner}
            onChange={e =>
              setFilter(f => ({ ...f, partner: e.target.value as string }))
            }
            size="small"
            displayEmpty
          >
            <MenuItem value="">전체 거래처</MenuItem>
            {getUnique(sales.map(s => s.partner)).map(p => (
              <MenuItem key={p} value={p}>
                {p}
              </MenuItem>
            ))}
          </Select>
          <Select
            value={filter.category}
            onChange={e =>
              setFilter(f => ({ ...f, category: e.target.value as string }))
            }
            size="small"
            displayEmpty
          >
            <MenuItem value="">전체 종류</MenuItem>
            {getUnique(sales.map(s => s.category)).map(c => (
              <MenuItem key={c} value={c}>
                {c}
              </MenuItem>
            ))}
          </Select>
          <Select
            value={filter.product}
            onChange={e =>
              setFilter(f => ({ ...f, product: e.target.value as string }))
            }
            size="small"
            displayEmpty
          >
            <MenuItem value="">전체 제품</MenuItem>
            {getUnique(sales.map(s => s.productName)).map(p => (
              <MenuItem key={p} value={p}>
                {p}
              </MenuItem>
            ))}
          </Select>
          <Button variant="contained" onClick={handleOpen}>
            매출 기록 등록
          </Button>
        </Box>

        {/* 제품별 판매량 */}
        <Typography variant="h6" sx={{ mt: 3 }}>
          제품별 판매량
        </Typography>
        <TableContainer component={Paper}>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>제품명</TableCell>
                <TableCell>판매수량</TableCell>
                <TableCell>매출액</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {productStats.map(s => (
                <TableRow key={s.name}>
                  <TableCell>{s.name}</TableCell>
                  <TableCell>{s.quantity}</TableCell>
                  <TableCell>{s.amount.toLocaleString()}원</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>

        {/* 거래처별 판매량 */}
        <Typography variant="h6" sx={{ mt: 3 }}>
          거래처별 판매량
        </Typography>
        <TableContainer component={Paper}>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>거래처</TableCell>
                <TableCell>판매수량</TableCell>
                <TableCell>매출액</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {partnerStats.map(s => (
                <TableRow key={s.name}>
                  <TableCell>{s.name}</TableCell>
                  <TableCell>{s.quantity}</TableCell>
                  <TableCell>{s.amount.toLocaleString()}원</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>

        {/* 제품종류별 판매량 */}
        <Typography variant="h6" sx={{ mt: 3 }}>
          제품종류별 판매량
        </Typography>
        <TableContainer component={Paper}>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>종류</TableCell>
                <TableCell>판매수량</TableCell>
                <TableCell>매출액</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {categoryStats.map(s => (
                <TableRow key={s.name}>
                  <TableCell>{s.name}</TableCell>
                  <TableCell>{s.quantity}</TableCell>
                  <TableCell>{s.amount.toLocaleString()}원</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>

        {/* 차트 */}
        <Grid container spacing={3} sx={{ mt: 4 }}>
          <Grid item xs={12} md={6}>
            <Typography variant="h6">제품별 매출</Typography>
            <Box sx={{ height: 300, mt: 2 }}>
              <Bar
                data={salesChartData}
                options={{ maintainAspectRatio: false }}
              />
            </Box>
          </Grid>
          <Grid item xs={12} md={6}>
            <Typography variant="h6">거래처별 매출</Typography>
            <Box sx={{ height: 300, mt: 2 }}>
              <Doughnut
                data={partnerChartData}
                options={{ maintainAspectRatio: false }}
              />
            </Box>
          </Grid>
        </Grid>
      </TabPanel>

      {/* 수익성 분석 탭 */}
      <TabPanel value={tabValue} index={1}>
        <Typography variant="h6" sx={{ mb: 2 }}>
          수익성 분석
        </Typography>

        <TableContainer component={Paper}>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>고객명</TableCell>
                <TableCell>프로젝트</TableCell>
                <TableCell>총수익</TableCell>
                <TableCell>총비용</TableCell>
                <TableCell>총이익</TableCell>
                <TableCell>마진율</TableCell>
                <TableCell>ROI</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {profitAnalysis.map(p => (
                <TableRow key={p.id}>
                  <TableCell>{p.customerName}</TableCell>
                  <TableCell>{p.projectName}</TableCell>
                  <TableCell>{p.totalRevenue.toLocaleString()}원</TableCell>
                  <TableCell>{p.totalCost.toLocaleString()}원</TableCell>
                  <TableCell>{p.grossProfit.toLocaleString()}원</TableCell>
                  <TableCell>
                    <Chip
                      label={`${p.grossMargin.toFixed(1)}%`}
                      color={
                        p.grossMargin > 20
                          ? 'success'
                          : p.grossMargin > 10
                            ? 'warning'
                            : 'error'
                      }
                      size="small"
                    />
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={`${p.roi.toFixed(1)}%`}
                      color={
                        p.roi > 30
                          ? 'success'
                          : p.roi > 15
                            ? 'warning'
                            : 'error'
                      }
                      size="small"
                    />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>

        {/* 수익성 차트 */}
        <Box sx={{ mt: 4 }}>
          <Typography variant="h6">수익성 추이</Typography>
          <Box sx={{ height: 300, mt: 2 }}>
            <Line
              data={profitChartData}
              options={{ maintainAspectRatio: false }}
            />
          </Box>
        </Box>
      </TabPanel>

      {/* 자동 연동 현황 탭 */}
      <TabPanel value={tabValue} index={2}>
        <Typography variant="h6" sx={{ mb: 2 }}>
          자동 연동 현황
        </Typography>

        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  견적 현황
                </Typography>
                <Typography variant="h4">{estimates.length}건</Typography>
                <Typography color="textSecondary">
                  계약 대기:{' '}
                  {estimates.filter(e => e.status === 'draft').length}건
                </Typography>
                <Typography color="textSecondary">
                  계약 완료:{' '}
                  {estimates.filter(e => e.status === 'contracted').length}건
                </Typography>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  계약 현황
                </Typography>
                <Typography variant="h4">{contracts.length}건</Typography>
                <Typography color="textSecondary">
                  배송 대기:{' '}
                  {contracts.filter(c => c.status === 'draft').length}건
                </Typography>
                <Typography color="textSecondary">
                  배송 완료:{' '}
                  {contracts.filter(c => c.status === 'delivered').length}건
                </Typography>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  배송 현황
                </Typography>
                <Typography variant="h4">{deliveries.length}건</Typography>
                <Typography color="textSecondary">
                  매출 대기:{' '}
                  {deliveries.filter(d => d.status === 'pending').length}건
                </Typography>
                <Typography color="textSecondary">
                  매출 완료:{' '}
                  {deliveries.filter(d => d.status === 'completed').length}건
                </Typography>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  매출 현황
                </Typography>
                <Typography variant="h4">{sales.length}건</Typography>
                <Typography color="textSecondary">
                  총 매출액: {totalRevenue.toLocaleString()}원
                </Typography>
                <Typography color="textSecondary">
                  이번달:{' '}
                  {sales
                    .filter(s => s.date.startsWith(filter.month))
                    .reduce((sum, s) => sum + s.amount, 0)
                    .toLocaleString()}
                  원
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </TabPanel>

      {/* 등록 다이얼로그 */}
      <Dialog 
        open={dialogOpen} 
        onClose={handleClose} 
        maxWidth="xs" 
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
                onClick={handleClose}
                sx={{ mr: 1 }}
              >
                <ArrowBackIcon />
              </IconButton>
            )}
            <Typography variant={isMobile ? 'h6' : 'h5'}>
              매출 기록 등록
            </Typography>
          </Box>
        </DialogTitle>
        <DialogContent
          sx={{
            ...(isMobile && {
              padding: 2,
              flex: 1,
              overflowY: 'auto',
            }),
          }}
        >
          <TextField
            margin="dense"
            label="제품명"
            name="productName"
            value={form.productName}
            onChange={handleChange}
            fullWidth
            size={isMobile ? 'medium' : 'small'}
            sx={{
              ...(isMobile && {
                marginBottom: 2,
                '& .MuiInputBase-root': {
                  height: 56,
                },
              }),
            }}
          />
          <TextField
            margin="dense"
            label="제품코드"
            name="productCode"
            value={form.productCode}
            onChange={handleChange}
            fullWidth
            size={isMobile ? 'medium' : 'small'}
            sx={{
              ...(isMobile && {
                marginBottom: 2,
                '& .MuiInputBase-root': {
                  height: 56,
                },
              }),
            }}
          />
          <TextField
            margin="dense"
            label="거래처"
            name="partner"
            value={form.partner}
            onChange={handleChange}
            fullWidth
            size={isMobile ? 'medium' : 'small'}
            sx={{
              ...(isMobile && {
                marginBottom: 2,
                '& .MuiInputBase-root': {
                  height: 56,
                },
              }),
            }}
          />
          <TextField
            margin="dense"
            label="종류"
            name="category"
            value={form.category}
            onChange={handleChange}
            fullWidth
            size={isMobile ? 'medium' : 'small'}
            sx={{
              ...(isMobile && {
                marginBottom: 2,
                '& .MuiInputBase-root': {
                  height: 56,
                },
              }),
            }}
          />
          <TextField
            margin="dense"
            label="수량"
            name="quantity"
            type="number"
            value={form.quantity}
            onChange={handleChange}
            fullWidth
            size={isMobile ? 'medium' : 'small'}
            sx={{
              ...(isMobile && {
                marginBottom: 2,
                '& .MuiInputBase-root': {
                  height: 56,
                },
              }),
            }}
          />
          <TextField
            margin="dense"
            label="금액"
            name="amount"
            type="number"
            value={form.amount}
            onChange={handleChange}
            fullWidth
            size={isMobile ? 'medium' : 'small'}
            sx={{
              ...(isMobile && {
                marginBottom: 2,
                '& .MuiInputBase-root': {
                  height: 56,
                },
              }),
            }}
          />
          <TextField
            margin="dense"
            label="날짜"
            name="date"
            type="date"
            value={form.date}
            onChange={handleChange}
            size={isMobile ? 'medium' : 'small'}
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
                ...(isMobile && {
                  height: 56,
                }),
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
              '& .MuiInputBase-root': {
                cursor: 'pointer',
              },
              ...(isMobile && {
                marginBottom: 2,
              }),
            }}
            fullWidth
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
            onClick={handleClose}
            size={isMobile ? 'large' : 'medium'}
            sx={{
              ...(isMobile && {
                flex: 1,
                height: 48,
              }),
            }}
          >
            취소
          </Button>
          <Button 
            onClick={handleSave} 
            variant="contained"
            size={isMobile ? 'large' : 'medium'}
            sx={{
              ...(isMobile && {
                flex: 1,
                height: 48,
              }),
            }}
          >
            저장
          </Button>
        </DialogActions>
      </Dialog>

      {/* 스낵바 */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={3000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
      >
        <Alert
          severity={snackbar.severity}
          onClose={() => setSnackbar({ ...snackbar, open: false })}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
}
