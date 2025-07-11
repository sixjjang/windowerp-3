import React, { useState, useEffect } from 'react';
import { API_BASE } from '../../utils/auth';
import {
  Grid,
  Paper,
  Typography,
  Box,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  IconButton,
  Select,
  MenuItem,
  Alert,
  Snackbar,
  Tabs,
  Tab,
  Card,
  CardContent,
  Chip,
  Divider,
  FormControl,
  InputLabel,
  useMediaQuery,
  useTheme,
} from '@mui/material';
import {
  Delete,
  Edit,
  TrendingUp,
  AccountBalance,
  Receipt,
  Sync,
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

interface FixedExpense {
  id: number;
  name: string;
  amount: number;
  month: string;
  note?: string;
  createdAt: string;
  updatedAt: string;
}

interface Budget {
  id: number;
  year: number;
  month: number;
  category: string;
  amount: number;
  description?: string;
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

interface TaxInvoice {
  id: number;
  invoiceNo: string;
  estimateNo?: string;
  contractNo?: string;
  customerName: string;
  amount: number;
  taxAmount: number;
  totalAmount: number;
  issueDate: string;
  status: string;
  apiResponse?: string;
  createdAt: string;
  updatedAt: string;
}


const getCurrentMonth = () => {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
};

const getCurrentYear = () => {
  return new Date().getFullYear();
};

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
      id={`accounting-tabpanel-${index}`}
      aria-labelledby={`accounting-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  );
}

const Accounting: React.FC = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  
  const [tabValue, setTabValue] = useState(0);
  const [expenses, setExpenses] = useState<FixedExpense[]>([]);
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [profitAnalysis, setProfitAnalysis] = useState<ProfitAnalysis[]>([]);
  const [taxInvoices, setTaxInvoices] = useState<TaxInvoice[]>([]);

  // 다이얼로그 상태
  const [expenseDialogOpen, setExpenseDialogOpen] = useState(false);
  const [budgetDialogOpen, setBudgetDialogOpen] = useState(false);
  const [profitDialogOpen, setProfitDialogOpen] = useState(false);
  const [taxInvoiceDialogOpen, setTaxInvoiceDialogOpen] = useState(false);

  // 편집 상태
  const [editExpense, setEditExpense] = useState<FixedExpense | null>(null);
  const [editBudget, setEditBudget] = useState<Budget | null>(null);
  const [editProfit, setEditProfit] = useState<ProfitAnalysis | null>(null);

  // 폼 상태
  const [expenseForm, setExpenseForm] = useState<
    Omit<FixedExpense, 'id' | 'createdAt' | 'updatedAt'>
  >({
    name: '',
    amount: 0,
    month: getCurrentMonth(),
    note: '',
  });
  const [budgetForm, setBudgetForm] = useState<
    Omit<Budget, 'id' | 'createdAt' | 'updatedAt'>
  >({
    year: getCurrentYear(),
    month: new Date().getMonth() + 1,
    category: '',
    amount: 0,
    description: '',
  });
  const [profitForm, setProfitForm] = useState<
    Omit<
      ProfitAnalysis,
      | 'id'
      | 'createdAt'
      | 'updatedAt'
      | 'grossProfit'
      | 'grossMargin'
      | 'netMargin'
      | 'roi'
    >
  >({
    estimateNo: '',
    contractNo: '',
    deliveryNo: '',
    customerName: '',
    projectName: '',
    totalRevenue: 0,
    totalCost: 0,
    netProfit: 0,
    analysisDate: new Date().toISOString().split('T')[0],
  });
  const [taxInvoiceForm, setTaxInvoiceForm] = useState<{
    estimateNo: string;
    contractNo: string;
    customerName: string;
    amount: number;
    issueDate: string;
  }>({
    estimateNo: '',
    contractNo: '',
    customerName: '',
    amount: 0,
    issueDate: new Date().toISOString().split('T')[0],
  });

  // 필터 상태
  const [selectedMonth, setSelectedMonth] = useState(getCurrentMonth());
  const [selectedYear, setSelectedYear] = useState(getCurrentYear());
  const [loading, setLoading] = useState(false);
  const [snackbar, setSnackbar] = useState<{
    open: boolean;
    message: string;
    severity: 'success' | 'error';
  }>({
    open: false,
    message: '',
    severity: 'success',
  });

  // 데이터 로드 함수들
  const loadExpenses = async (month?: string) => {
    setLoading(true);
    try {
      const url = month
        ? `${API_BASE}/fixedExpenses?month=${month}`
        : `${API_BASE}/fixedExpenses`;
      const response = await fetch(url);
      if (!response.ok) throw new Error('데이터 로드 실패');
      const data = await response.json();
      setExpenses(data);
    } catch (error) {
      console.error('고정비 로드 오류:', error);
      setSnackbar({
        open: true,
        message: '데이터 로드에 실패했습니다.',
        severity: 'error',
      });
    } finally {
      setLoading(false);
    }
  };

  const loadBudgets = async (year?: number) => {
    setLoading(true);
    try {
      const url = year
        ? `${API_BASE}/budgets?year=${year}`
        : `${API_BASE}/budgets`;
      const response = await fetch(url);
      if (!response.ok) throw new Error('데이터 로드 실패');
      const data = await response.json();
      setBudgets(data);
    } catch (error) {
      console.error('예산 로드 오류:', error);
      setSnackbar({
        open: true,
        message: '데이터 로드에 실패했습니다.',
        severity: 'error',
      });
    } finally {
      setLoading(false);
    }
  };

  const loadProfitAnalysis = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${API_BASE}/profitAnalysis`);
      if (!response.ok) throw new Error('데이터 로드 실패');
      const data = await response.json();
      setProfitAnalysis(data);
    } catch (error) {
      console.error('수익성 분석 로드 오류:', error);
      setSnackbar({
        open: true,
        message: '데이터 로드에 실패했습니다.',
        severity: 'error',
      });
    } finally {
      setLoading(false);
    }
  };

  const loadTaxInvoices = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${API_BASE}/taxInvoiceApi`);
      if (!response.ok) throw new Error('데이터 로드 실패');
      const data = await response.json();
      setTaxInvoices(data);
    } catch (error) {
      console.error('세금계산서 로드 오류:', error);
      setSnackbar({
        open: true,
        message: '데이터 로드에 실패했습니다.',
        severity: 'error',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadExpenses();
    loadBudgets();
    loadProfitAnalysis();
    loadTaxInvoices();
  }, []);

  useEffect(() => {
    loadExpenses(selectedMonth);
  }, [selectedMonth]);

  useEffect(() => {
    loadBudgets(selectedYear);
  }, [selectedYear]);

  // 계산 함수들
  const monthExpenses = expenses.filter(e => e.month === selectedMonth);
  const monthTotal = monthExpenses.reduce((sum, e) => sum + e.amount, 0);

  const yearBudgets = budgets.filter(b => b.year === selectedYear);
  const totalBudget = yearBudgets.reduce((sum, b) => sum + b.amount, 0);
  const totalExpenses = expenses
    .filter(e => e.month.startsWith(selectedYear.toString()))
    .reduce((sum, e) => sum + e.amount, 0);
  const budgetRemaining = totalBudget - totalExpenses;

  const averageGrossMargin =
    profitAnalysis.length > 0
      ? profitAnalysis.reduce((sum, p) => sum + p.grossMargin, 0) /
        profitAnalysis.length
      : 0;
  const averageROI =
    profitAnalysis.length > 0
      ? profitAnalysis.reduce((sum, p) => sum + p.roi, 0) /
        profitAnalysis.length
      : 0;

  // 차트 데이터
  const expenseChartData = {
    labels: Array.from(new Set(expenses.map(e => e.month)))
      .sort()
      .slice(-6),
    datasets: [
      {
        label: '월별 고정비',
        data: Array.from(new Set(expenses.map(e => e.month)))
          .sort()
          .slice(-6)
          .map(m =>
            expenses
              .filter(e => e.month === m)
              .reduce((sum, e) => sum + e.amount, 0)
          ),
        backgroundColor: 'rgba(54, 162, 235, 0.5)',
        borderColor: 'rgba(54, 162, 235, 1)',
        borderWidth: 1,
      },
    ],
  };

  const budgetChartData = {
    labels: yearBudgets.map(b => b.category),
    datasets: [
      {
        label: '예산',
        data: yearBudgets.map(b => b.amount),
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

  // 핸들러 함수들
  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  const handleExpenseOpen = (expense?: FixedExpense) => {
    if (expense) {
      setEditExpense(expense);
      setExpenseForm({
        name: expense.name,
        amount: expense.amount,
        month: expense.month,
        note: expense.note || '',
      });
    } else {
      setEditExpense(null);
      setExpenseForm({
        name: '',
        amount: 0,
        month: getCurrentMonth(),
        note: '',
      });
    }
    setExpenseDialogOpen(true);
  };

  const handleBudgetOpen = (budget?: Budget) => {
    if (budget) {
      setEditBudget(budget);
      setBudgetForm({
        year: budget.year,
        month: budget.month,
        category: budget.category,
        amount: budget.amount,
        description: budget.description || '',
      });
    } else {
      setEditBudget(null);
      setBudgetForm({
        year: getCurrentYear(),
        month: new Date().getMonth() + 1,
        category: '',
        amount: 0,
        description: '',
      });
    }
    setBudgetDialogOpen(true);
  };

  const handleProfitOpen = (profit?: ProfitAnalysis) => {
    if (profit) {
      setEditProfit(profit);
      setProfitForm({
        estimateNo: profit.estimateNo,
        contractNo: profit.contractNo || '',
        deliveryNo: profit.deliveryNo || '',
        customerName: profit.customerName,
        projectName: profit.projectName || '',
        totalRevenue: profit.totalRevenue,
        totalCost: profit.totalCost,
        netProfit: profit.netProfit || 0,
        analysisDate: profit.analysisDate,
      });
    } else {
      setEditProfit(null);
      setProfitForm({
        estimateNo: '',
        contractNo: '',
        deliveryNo: '',
        customerName: '',
        projectName: '',
        totalRevenue: 0,
        totalCost: 0,
        netProfit: 0,
        analysisDate: new Date().toISOString().split('T')[0],
      });
    }
    setProfitDialogOpen(true);
  };

  const handleTaxInvoiceOpen = () => {
    setTaxInvoiceForm({
      estimateNo: '',
      contractNo: '',
      customerName: '',
      amount: 0,
      issueDate: new Date().toISOString().split('T')[0],
    });
    setTaxInvoiceDialogOpen(true);
  };

  const handleExpenseSave = async () => {
    try {
      if (editExpense) {
        const response = await fetch(
          `${API_BASE}/updateFixedExpense/${editExpense.id}`,
          {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(expenseForm),
          }
        );
        if (!response.ok) throw new Error('수정 실패');
      } else {
        const response = await fetch(`${API_BASE}/saveFixedExpense`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(expenseForm),
        });
        if (!response.ok) throw new Error('등록 실패');
      }

      setSnackbar({
        open: true,
        message: editExpense
          ? '고정비가 수정되었습니다.'
          : '고정비가 등록되었습니다.',
        severity: 'success',
      });
      setExpenseDialogOpen(false);
      loadExpenses(selectedMonth);
    } catch (error) {
      console.error('고정비 저장 오류:', error);
      setSnackbar({
        open: true,
        message: '저장에 실패했습니다.',
        severity: 'error',
      });
    }
  };

  const handleBudgetSave = async () => {
    try {
      if (editBudget) {
        const response = await fetch(`${API_BASE}/budgets/${editBudget.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(budgetForm),
        });
        if (!response.ok) throw new Error('수정 실패');
      } else {
        const response = await fetch(`${API_BASE}/budgets`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(budgetForm),
        });
        if (!response.ok) throw new Error('등록 실패');
      }

      setSnackbar({
        open: true,
        message: editBudget
          ? '예산이 수정되었습니다.'
          : '예산이 등록되었습니다.',
        severity: 'success',
      });
      setBudgetDialogOpen(false);
      loadBudgets(selectedYear);
    } catch (error) {
      console.error('예산 저장 오류:', error);
      setSnackbar({
        open: true,
        message: '저장에 실패했습니다.',
        severity: 'error',
      });
    }
  };

  const handleProfitSave = async () => {
    try {
      if (editProfit) {
        const response = await fetch(
          `${API_BASE}/profitAnalysis/${editProfit.id}`,
          {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(profitForm),
          }
        );
        if (!response.ok) throw new Error('수정 실패');
      } else {
        const response = await fetch(`${API_BASE}/profitAnalysis`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(profitForm),
        });
        if (!response.ok) throw new Error('등록 실패');
      }

      setSnackbar({
        open: true,
        message: editProfit
          ? '수익성 분석이 수정되었습니다.'
          : '수익성 분석이 등록되었습니다.',
        severity: 'success',
      });
      setProfitDialogOpen(false);
      loadProfitAnalysis();
    } catch (error) {
      console.error('수익성 분석 저장 오류:', error);
      setSnackbar({
        open: true,
        message: '저장에 실패했습니다.',
        severity: 'error',
      });
    }
  };

  const handleTaxInvoiceSave = async () => {
    try {
      const response = await fetch(`${API_BASE}/taxInvoiceApi/issue`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(taxInvoiceForm),
      });
      if (!response.ok) throw new Error('발행 실패');

      setSnackbar({
        open: true,
        message: '세금계산서 발행이 요청되었습니다.',
        severity: 'success',
      });
      setTaxInvoiceDialogOpen(false);
      loadTaxInvoices();
    } catch (error) {
      console.error('세금계산서 발행 오류:', error);
      setSnackbar({
        open: true,
        message: '발행에 실패했습니다.',
        severity: 'error',
      });
    }
  };

  const handleExpenseDelete = async (id: number) => {
    if (!window.confirm('정말 삭제하시겠습니까?')) return;

    try {
      const response = await fetch(`${API_BASE}/deleteFixedExpense/${id}`, {
        method: 'DELETE',
      });
      if (!response.ok) throw new Error('삭제 실패');

      setSnackbar({
        open: true,
        message: '고정비가 삭제되었습니다.',
        severity: 'success',
      });
      loadExpenses(selectedMonth);
    } catch (error) {
      console.error('고정비 삭제 오류:', error);
      setSnackbar({
        open: true,
        message: '삭제에 실패했습니다.',
        severity: 'error',
      });
    }
  };

  // 월 옵션 목록 생성 (중복 제거 및 정렬)
  const monthOptions = Array.from(new Set(expenses.map(e => e.month))).sort();
  // 연도 옵션 목록 (고정)
  const yearOptions = [2023, 2024, 2025];

  return (
    <Box sx={{ p: 3 }}>
      <Typography
        variant="h4"
        gutterBottom
        sx={{ display: 'flex', alignItems: 'center', gap: 2 }}
      >
        <AccountBalance color="primary" />
        회계 관리 시스템
      </Typography>

      {/* 대시보드 카드 */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                이번달 고정비
              </Typography>
              <Typography variant="h4">
                {monthTotal.toLocaleString()}원
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                {selectedYear}년 예산
              </Typography>
              <Typography variant="h4">
                {totalBudget.toLocaleString()}원
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                예산 잔액
              </Typography>
              <Typography
                variant="h4"
                color={budgetRemaining < 0 ? 'error' : 'success'}
              >
                {budgetRemaining.toLocaleString()}원
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

      {/* 탭 메뉴 */}
      <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
        <Tabs
          value={tabValue}
          onChange={handleTabChange}
          aria-label="회계 관리 탭"
        >
          <Tab label="고정비 관리" icon={<AccountBalance />} />
          <Tab label="예산 관리" icon={<TrendingUp />} />
          <Tab label="수익성 분석" icon={<TrendingUp />} />
          <Tab label="세금계산서" icon={<Receipt />} />
        </Tabs>
      </Box>

      {/* 고정비 관리 탭 */}
      <TabPanel value={tabValue} index={0}>
        <Box sx={{ mb: 2, display: 'flex', gap: 2, alignItems: 'center' }}>
          {/* value가 목록에 없으면 ''로 fallback: MUI out-of-range value 경고 방지 */}
          <Select
            value={monthOptions.includes(selectedMonth) ? selectedMonth : ''}
            onChange={e => setSelectedMonth(e.target.value as string)}
            size="small"
          >
            {monthOptions.map(m => (
              <MenuItem key={m} value={m}>
                {m}
              </MenuItem>
            ))}
          </Select>
          <Button variant="contained" onClick={() => handleExpenseOpen()}>
            고정비 등록
          </Button>
        </Box>

        <TableContainer component={Paper}>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>항목명</TableCell>
                <TableCell>금액</TableCell>
                <TableCell>비고</TableCell>
                <TableCell>관리</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {monthExpenses.map(e => (
                <TableRow key={e.id}>
                  <TableCell>{e.name}</TableCell>
                  <TableCell>{e.amount.toLocaleString()}원</TableCell>
                  <TableCell>{e.note}</TableCell>
                  <TableCell>
                    <IconButton
                      size="small"
                      onClick={() => handleExpenseOpen(e)}
                    >
                      <Edit fontSize="small" />
                    </IconButton>
                    <IconButton
                      size="small"
                      onClick={() => handleExpenseDelete(e.id)}
                    >
                      <Delete fontSize="small" />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>

        <Box sx={{ mt: 2, display: 'flex', gap: 4, alignItems: 'center' }}>
          <Typography>
            월 고정비 합계: <b>{monthTotal.toLocaleString()}원</b>
          </Typography>
        </Box>

        {/* 고정비 차트 */}
        <Box sx={{ mt: 4 }}>
          <Typography variant="h6">월별 고정비 추이</Typography>
          <Box sx={{ height: 300, mt: 2 }}>
            <Bar
              data={expenseChartData}
              options={{ maintainAspectRatio: false }}
            />
          </Box>
        </Box>
      </TabPanel>

      {/* 예산 관리 탭 */}
      <TabPanel value={tabValue} index={1}>
        <Box sx={{ mb: 2, display: 'flex', gap: 2, alignItems: 'center' }}>
          {/* value가 목록에 없으면 ''로 fallback: MUI out-of-range value 경고 방지 */}
          <Select
            value={yearOptions.includes(selectedYear) ? selectedYear : ''}
            onChange={e => setSelectedYear(e.target.value as number)}
            size="small"
          >
            {yearOptions.map(year => (
              <MenuItem key={year} value={year}>
                {year}년
              </MenuItem>
            ))}
          </Select>
          <Button variant="contained" onClick={() => handleBudgetOpen()}>
            예산 등록
          </Button>
        </Box>

        <TableContainer component={Paper}>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>카테고리</TableCell>
                <TableCell>월</TableCell>
                <TableCell>예산</TableCell>
                <TableCell>설명</TableCell>
                <TableCell>관리</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {yearBudgets.map(b => (
                <TableRow key={b.id}>
                  <TableCell>{b.category}</TableCell>
                  <TableCell>{b.month}월</TableCell>
                  <TableCell>{b.amount.toLocaleString()}원</TableCell>
                  <TableCell>{b.description}</TableCell>
                  <TableCell>
                    <IconButton
                      size="small"
                      onClick={() => handleBudgetOpen(b)}
                    >
                      <Edit fontSize="small" />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>

        <Box sx={{ mt: 2, display: 'flex', gap: 4, alignItems: 'center' }}>
          <Typography>
            총 예산: <b>{totalBudget.toLocaleString()}원</b>
          </Typography>
          <Typography>
            총 지출: <b>{totalExpenses.toLocaleString()}원</b>
          </Typography>
          <Typography>
            잔액:{' '}
            <b style={{ color: budgetRemaining < 0 ? 'red' : 'green' }}>
              {budgetRemaining.toLocaleString()}원
            </b>
          </Typography>
        </Box>

        {/* 예산 차트 */}
        <Box sx={{ mt: 4 }}>
          <Typography variant="h6">카테고리별 예산</Typography>
          <Box sx={{ height: 300, mt: 2 }}>
            <Doughnut
              data={budgetChartData}
              options={{ maintainAspectRatio: false }}
            />
          </Box>
        </Box>
      </TabPanel>

      {/* 수익성 분석 탭 */}
      <TabPanel value={tabValue} index={2}>
        <Box sx={{ mb: 2, display: 'flex', gap: 2, alignItems: 'center' }}>
          <Button variant="contained" onClick={() => handleProfitOpen()}>
            수익성 분석 등록
          </Button>
        </Box>

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
                <TableCell>관리</TableCell>
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
                  <TableCell>
                    <IconButton
                      size="small"
                      onClick={() => handleProfitOpen(p)}
                    >
                      <Edit fontSize="small" />
                    </IconButton>
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

      {/* 세금계산서 탭 */}
      <TabPanel value={tabValue} index={3}>
        <Box sx={{ mb: 2, display: 'flex', gap: 2, alignItems: 'center' }}>
          <Button variant="contained" onClick={() => handleTaxInvoiceOpen()}>
            세금계산서 발행
          </Button>
        </Box>

        <TableContainer component={Paper}>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>인보이스 번호</TableCell>
                <TableCell>고객명</TableCell>
                <TableCell>금액</TableCell>
                <TableCell>부가세</TableCell>
                <TableCell>총액</TableCell>
                <TableCell>발행일</TableCell>
                <TableCell>상태</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {taxInvoices.map(t => (
                <TableRow key={t.id}>
                  <TableCell>{t.invoiceNo}</TableCell>
                  <TableCell>{t.customerName}</TableCell>
                  <TableCell>{t.amount.toLocaleString()}원</TableCell>
                  <TableCell>{t.taxAmount.toLocaleString()}원</TableCell>
                  <TableCell>{t.totalAmount.toLocaleString()}원</TableCell>
                  <TableCell>{t.issueDate}</TableCell>
                  <TableCell>
                    <Chip
                      label={t.status}
                      color={t.status === 'completed' ? 'success' : 'warning'}
                      size="small"
                    />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </TabPanel>

      {/* 고정비 등록/수정 다이얼로그 */}
      <Dialog
        open={expenseDialogOpen}
        onClose={() => setExpenseDialogOpen(false)}
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
                onClick={() => setExpenseDialogOpen(false)}
                sx={{ mr: 1 }}
              >
                <ArrowBackIcon />
              </IconButton>
            )}
            <Typography variant={isMobile ? 'h6' : 'h5'}>
              {editExpense ? '고정비 수정' : '고정비 등록'}
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
            label="항목명"
            name="name"
            value={expenseForm.name}
            onChange={e =>
              setExpenseForm({ ...expenseForm, name: e.target.value })
            }
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
            value={expenseForm.amount}
            onChange={e =>
              setExpenseForm({ ...expenseForm, amount: Number(e.target.value) })
            }
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
            label="월(YYYY-MM)"
            name="month"
            value={expenseForm.month}
            onChange={e =>
              setExpenseForm({ ...expenseForm, month: e.target.value })
            }
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
            label="비고"
            name="note"
            value={expenseForm.note}
            onChange={e =>
              setExpenseForm({ ...expenseForm, note: e.target.value })
            }
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
            onClick={() => setExpenseDialogOpen(false)}
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
            onClick={handleExpenseSave} 
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

      {/* 예산 등록/수정 다이얼로그 */}
      <Dialog
        open={budgetDialogOpen}
        onClose={() => setBudgetDialogOpen(false)}
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
                onClick={() => setBudgetDialogOpen(false)}
                sx={{ mr: 1 }}
              >
                <ArrowBackIcon />
              </IconButton>
            )}
            <Typography variant={isMobile ? 'h6' : 'h5'}>
              {editBudget ? '예산 수정' : '예산 등록'}
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
            label="년도"
            name="year"
            type="number"
            value={budgetForm.year}
            onChange={e =>
              setBudgetForm({ ...budgetForm, year: Number(e.target.value) })
            }
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
            label="월"
            name="month"
            type="number"
            value={budgetForm.month}
            onChange={e =>
              setBudgetForm({ ...budgetForm, month: Number(e.target.value) })
            }
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
            label="카테고리"
            name="category"
            value={budgetForm.category}
            onChange={e =>
              setBudgetForm({ ...budgetForm, category: e.target.value })
            }
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
            label="예산"
            name="amount"
            type="number"
            value={budgetForm.amount}
            onChange={e =>
              setBudgetForm({ ...budgetForm, amount: Number(e.target.value) })
            }
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
            label="설명"
            name="description"
            value={budgetForm.description}
            onChange={e =>
              setBudgetForm({ ...budgetForm, description: e.target.value })
            }
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
            onClick={() => setBudgetDialogOpen(false)}
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
            onClick={handleBudgetSave} 
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

      {/* 수익성 분석 등록/수정 다이얼로그 */}
      <Dialog
        open={profitDialogOpen}
        onClose={() => setProfitDialogOpen(false)}
        maxWidth="sm"
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
                onClick={() => setProfitDialogOpen(false)}
                sx={{ mr: 1 }}
              >
                <ArrowBackIcon />
              </IconButton>
            )}
            <Typography variant={isMobile ? 'h6' : 'h5'}>
              {editProfit ? '수익성 분석 수정' : '수익성 분석 등록'}
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
            label="견적번호"
            name="estimateNo"
            value={profitForm.estimateNo}
            onChange={e =>
              setProfitForm({ ...profitForm, estimateNo: e.target.value })
            }
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
            label="계약번호"
            name="contractNo"
            value={profitForm.contractNo}
            onChange={e =>
              setProfitForm({ ...profitForm, contractNo: e.target.value })
            }
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
            label="고객명"
            name="customerName"
            value={profitForm.customerName}
            onChange={e =>
              setProfitForm({ ...profitForm, customerName: e.target.value })
            }
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
            label="프로젝트명"
            name="projectName"
            value={profitForm.projectName}
            onChange={e =>
              setProfitForm({ ...profitForm, projectName: e.target.value })
            }
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
            label="총수익"
            name="totalRevenue"
            type="number"
            value={profitForm.totalRevenue}
            onChange={e =>
              setProfitForm({
                ...profitForm,
                totalRevenue: Number(e.target.value),
              })
            }
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
            label="총비용"
            name="totalCost"
            type="number"
            value={profitForm.totalCost}
            onChange={e =>
              setProfitForm({
                ...profitForm,
                totalCost: Number(e.target.value),
              })
            }
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
            label="순이익"
            name="netProfit"
            type="number"
            value={profitForm.netProfit}
            onChange={e =>
              setProfitForm({
                ...profitForm,
                netProfit: Number(e.target.value),
              })
            }
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
            label="분석일"
            name="analysisDate"
            type="date"
            value={profitForm.analysisDate}
            onChange={e =>
              setProfitForm({ ...profitForm, analysisDate: e.target.value })
            }
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
                const input = e.currentTarget.querySelector('input');
                if (input) {
                  input.click();
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
            onClick={() => setProfitDialogOpen(false)}
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
            onClick={handleProfitSave} 
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

      {/* 세금계산서 발행 다이얼로그 */}
      <Dialog
        open={taxInvoiceDialogOpen}
        onClose={() => setTaxInvoiceDialogOpen(false)}
        maxWidth="sm"
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
                onClick={() => setTaxInvoiceDialogOpen(false)}
                sx={{ mr: 1 }}
              >
                <ArrowBackIcon />
              </IconButton>
            )}
            <Typography variant={isMobile ? 'h6' : 'h5'}>
              세금계산서 발행
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
            label="견적번호"
            name="estimateNo"
            value={taxInvoiceForm.estimateNo}
            onChange={e =>
              setTaxInvoiceForm({
                ...taxInvoiceForm,
                estimateNo: e.target.value,
              })
            }
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
            label="계약번호"
            name="contractNo"
            value={taxInvoiceForm.contractNo}
            onChange={e =>
              setTaxInvoiceForm({
                ...taxInvoiceForm,
                contractNo: e.target.value,
              })
            }
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
            label="고객명"
            name="customerName"
            value={taxInvoiceForm.customerName}
            onChange={e =>
              setTaxInvoiceForm({
                ...taxInvoiceForm,
                customerName: e.target.value,
              })
            }
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
            value={taxInvoiceForm.amount}
            onChange={e =>
              setTaxInvoiceForm({
                ...taxInvoiceForm,
                amount: Number(e.target.value),
              })
            }
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
            label="발행일"
            name="issueDate"
            type="date"
            value={taxInvoiceForm.issueDate}
            onChange={e =>
              setTaxInvoiceForm({
                ...taxInvoiceForm,
                issueDate: e.target.value,
              })
            }
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
                const input = e.currentTarget.querySelector('input');
                if (input) {
                  input.click();
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
            onClick={() => setTaxInvoiceDialogOpen(false)}
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
            onClick={handleTaxInvoiceSave} 
            variant="contained"
            size={isMobile ? 'large' : 'medium'}
            sx={{
              ...(isMobile && {
                flex: 1,
                height: 48,
              }),
            }}
          >
            발행
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
};

export default Accounting;
