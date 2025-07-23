import React, { useState, useEffect, useMemo } from 'react';
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
  FormControlLabel,
  Checkbox,
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
  isRecurring?: boolean; // 매달 반복 여부
  recurringStartMonth?: string; // 반복 시작 월
  recurringEndMonth?: string; // 반복 종료 월 (선택사항)
  type: 'personal' | 'company'; // 개인/회사 구분
  paymentMethod: 'card' | 'autoTransfer' | 'manualTransfer'; // 결제 방식: 카드, 계좌자동이체, 계좌직접이체
  accountId?: string; // 계좌직접이체일 경우 사용할 계좌 ID
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

interface Account {
  id: string;
  name: string; // 계좌명 (예: "계좌1", "계좌2")
  number: string; // 계좌번호 (예: "기업302-054...")
  description?: string; // 설명
  isActive: boolean; // 활성화 여부
  createdAt: string;
  updatedAt: string;
}

interface Transaction {
  id: number;
  type: 'income' | 'expense'; // 'income': 수입, 'expense': 지출
  vendor: string; // 거래처
  paymentMethod: string; // 입금방식: 'card', 'cash', 또는 계좌 ID
  amount: number;
  date: string;
  month: string; // 월별 필터링용
  note?: string;
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
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [accounts, setAccounts] = useState<Account[]>([]);

  // 다이얼로그 상태
  const [expenseDialogOpen, setExpenseDialogOpen] = useState(false);
  const [budgetDialogOpen, setBudgetDialogOpen] = useState(false);
  const [profitDialogOpen, setProfitDialogOpen] = useState(false);
  const [taxInvoiceDialogOpen, setTaxInvoiceDialogOpen] = useState(false);
  const [transactionDialogOpen, setTransactionDialogOpen] = useState(false);
  const [accountDialogOpen, setAccountDialogOpen] = useState(false);

  // 편집 상태
  const [editExpense, setEditExpense] = useState<FixedExpense | null>(null);
  const [editBudget, setEditBudget] = useState<Budget | null>(null);
  const [editProfit, setEditProfit] = useState<ProfitAnalysis | null>(null);
  const [editTransaction, setEditTransaction] = useState<Transaction | null>(null);
  const [editAccount, setEditAccount] = useState<Account | null>(null);

  // 폼 상태
  const [expenseForm, setExpenseForm] = useState<
    Omit<FixedExpense, 'id' | 'createdAt' | 'updatedAt'>
  >({
    name: '',
    amount: 0,
    month: getCurrentMonth(),
    note: '',
    isRecurring: false,
    recurringStartMonth: getCurrentMonth(),
    recurringEndMonth: '',
    type: 'personal',
    paymentMethod: 'card',
    accountId: '',
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
  const [transactionForm, setTransactionForm] = useState<
    Omit<Transaction, 'id' | 'createdAt' | 'updatedAt'>
  >({
    type: 'expense',
    vendor: '',
    paymentMethod: 'cash',
    amount: 0,
    date: new Date().toISOString().split('T')[0],
    month: getCurrentMonth(),
    note: '',
  });
  const [accountForm, setAccountForm] = useState<
    Omit<Account, 'id' | 'createdAt' | 'updatedAt'>
  >({
    name: '',
    number: '',
    description: '',
    isActive: true,
  });

  // 필터 상태
  const [selectedMonth, setSelectedMonth] = useState(getCurrentMonth());
  const [selectedYear, setSelectedYear] = useState(getCurrentYear());
  const [expenseTypeFilter, setExpenseTypeFilter] = useState<'all' | 'personal' | 'company'>('all');
  const [transactionPeriodType, setTransactionPeriodType] = useState<'month' | 'quarter' | 'half' | 'year'>('month');
  const [selectedPeriod, setSelectedPeriod] = useState(getCurrentMonth());
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

  const loadTransactions = async (month?: string) => {
    setLoading(true);
    try {
      const url = month
        ? `${API_BASE}/transactions?month=${month}`
        : `${API_BASE}/transactions`;
      console.log('거래내역 로드 URL:', url);
      
      const response = await fetch(url);
      console.log('거래내역 로드 응답 상태:', response.status);
      
      if (!response.ok) throw new Error('데이터 로드 실패');
      const data = await response.json();
      console.log('거래내역 로드 성공, 데이터 개수:', data.length);
      setTransactions(data);
    } catch (error) {
      console.error('거래내역 로드 오류:', error);
      setSnackbar({
        open: true,
        message: '데이터 로드에 실패했습니다.',
        severity: 'error',
      });
    } finally {
      setLoading(false);
    }
  };

  const loadAccounts = async () => {
    setLoading(true);
    try {
      console.log('계좌 로드 시작');
      const response = await fetch(`${API_BASE}/accounts`);
      console.log('계좌 로드 응답 상태:', response.status);
      
      if (!response.ok) throw new Error('데이터 로드 실패');
      const data = await response.json();
      console.log('계좌 로드 성공, 데이터 개수:', data.length);
      setAccounts(data);
    } catch (error) {
      console.error('계좌 로드 오류:', error);
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

  useEffect(() => {
    loadTransactions(selectedMonth);
  }, [selectedMonth]);

  useEffect(() => {
    loadAccounts();
  }, []);

  // 기간별 필터링 함수
  const isTransactionInPeriod = (transaction: Transaction, periodType: string, period: string) => {
    const transactionDate = new Date(transaction.date);
    const transactionYear = transactionDate.getFullYear();
    const transactionMonth = transactionDate.getMonth() + 1;

    switch (periodType) {
      case 'month':
        return transaction.month === period;
      case 'quarter':
        const [year, quarter] = period.split('-Q');
        const quarterNum = parseInt(quarter);
        const startMonth = (quarterNum - 1) * 3 + 1;
        const endMonth = quarterNum * 3;
        return transactionYear === parseInt(year) && 
               transactionMonth >= startMonth && 
               transactionMonth <= endMonth;
      case 'half':
        const [halfYear, half] = period.split('-H');
        const halfNum = parseInt(half);
        const halfStartMonth = (halfNum - 1) * 6 + 1;
        const halfEndMonth = halfNum * 6;
        return transactionYear === parseInt(halfYear) && 
               transactionMonth >= halfStartMonth && 
               transactionMonth <= halfEndMonth;
      case 'year':
        return transactionYear === parseInt(period);
      default:
        return false;
    }
  };

  // 계산 함수들
  const monthExpenses = expenses.filter(e => 
    e.month === selectedMonth && 
    (expenseTypeFilter === 'all' || e.type === expenseTypeFilter)
  );
  const monthTotal = monthExpenses.reduce((sum, e) => sum + e.amount, 0);
  const hasRecurringExpenses = expenses.some(e => e.isRecurring);

  // 트랜잭션 계산
  const periodTransactions = transactions.filter(t => 
    isTransactionInPeriod(t, transactionPeriodType, selectedPeriod)
  );
  const periodIncome = periodTransactions
    .filter(t => t.type === 'income')
    .reduce((sum, t) => sum + t.amount, 0);
  const periodExpense = periodTransactions
    .filter(t => t.type === 'expense')
    .reduce((sum, t) => sum + t.amount, 0);
  const periodNetIncome = periodIncome - periodExpense;

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
        isRecurring: expense.isRecurring || false,
        recurringStartMonth: expense.recurringStartMonth || expense.month,
        recurringEndMonth: expense.recurringEndMonth || '',
        type: expense.type || 'personal',
        paymentMethod: expense.paymentMethod || 'card',
        accountId: expense.accountId || '',
      });
    } else {
      setEditExpense(null);
      setExpenseForm({
        name: '',
        amount: 0,
        month: getCurrentMonth(),
        note: '',
        isRecurring: false,
        recurringStartMonth: getCurrentMonth(),
        recurringEndMonth: '',
        type: 'personal',
        paymentMethod: 'card',
        accountId: '',
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

  const handleTransactionOpen = (transaction?: Transaction) => {
    if (transaction) {
      setEditTransaction(transaction);
      setTransactionForm({
        type: transaction.type,
        vendor: transaction.vendor,
        paymentMethod: transaction.paymentMethod,
        amount: transaction.amount,
        date: transaction.date,
        month: transaction.month,
        note: transaction.note || '',
      });
    } else {
      setEditTransaction(null);
      setTransactionForm({
        type: 'expense',
        vendor: '',
        paymentMethod: 'cash',
        amount: 0,
        date: new Date().toISOString().split('T')[0],
        month: getCurrentMonth(),
        note: '',
      });
    }
    setTransactionDialogOpen(true);
  };

  // 매달 고정비 자동 생성 함수
  const generateMonthlyExpenses = async (baseExpense: any) => {
    if (!baseExpense.isRecurring) return;

    const startDate = new Date(baseExpense.recurringStartMonth + '-01');
    const endDate = baseExpense.recurringEndMonth 
      ? new Date(baseExpense.recurringEndMonth + '-01')
      : new Date(new Date().getFullYear() + 2, 11, 1); // 2년 후까지

    const expenses = [];
    const currentDate = new Date(startDate);

    while (currentDate <= endDate) {
      const monthStr = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}`;
      
      // 기존 고정비가 있는지 확인 (클라이언트 사이드에서 필터링)
      const existingExpense = await fetch(`${API_BASE}/fixedExpenses?month=${monthStr}`);
      const existingData = await existingExpense.json();
      const hasExistingExpense = existingData.some((e: any) => e.name === baseExpense.name);
      
      if (!hasExistingExpense) {
        expenses.push({
          name: baseExpense.name,
          amount: baseExpense.amount,
          month: monthStr,
          note: baseExpense.note,
          isRecurring: false, // 생성된 항목은 반복 아님
          recurringStartMonth: baseExpense.recurringStartMonth,
          recurringEndMonth: baseExpense.recurringEndMonth,
        });
      }
      
      currentDate.setMonth(currentDate.getMonth() + 1);
    }

    // 생성된 고정비들을 일괄 저장
    for (const expense of expenses) {
      try {
        await fetch(`${API_BASE}/saveFixedExpense`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(expense),
        });
      } catch (error) {
        console.error('월별 고정비 생성 오류:', error);
      }
    }

    return expenses.length;
  };

  // 고정비를 거래내역으로 자동 생성하는 함수
  const createTransactionFromExpense = async (expense: Omit<FixedExpense, 'id' | 'createdAt' | 'updatedAt'>) => {
    try {
      // 해당 월에 이미 동일한 고정비 거래내역이 있는지 확인
      const existingTransactions = transactions.filter(t => 
        t.vendor === expense.name && 
        t.month === expense.month &&
        t.type === 'expense'
      );

      if (existingTransactions.length > 0) {
        return; // 이미 존재하면 생성하지 않음
      }

      // 결제 방식에 따른 paymentMethod 결정
      let paymentMethod: string;
      if (expense.paymentMethod === 'card') {
        paymentMethod = 'card';
      } else if (expense.paymentMethod === 'autoTransfer') {
        paymentMethod = 'cash'; // 자동이체는 현금으로 처리
      } else if (expense.paymentMethod === 'manualTransfer') {
        paymentMethod = expense.accountId || 'cash';
      } else {
        paymentMethod = 'cash';
      }

      const transactionData = {
        type: 'expense' as const,
        vendor: expense.name,
        paymentMethod: paymentMethod,
        amount: expense.amount,
        date: `${expense.month}-01`, // 해당 월의 1일로 설정
        month: expense.month,
        note: `고정비: ${expense.note || ''}`,
      };

      const response = await fetch(`${API_BASE}/saveTransaction`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(transactionData),
      });

      if (response.ok) {
        // 거래내역 목록 새로고침
        loadTransactions(selectedMonth);
      }
    } catch (error) {
      console.error('고정비 거래내역 생성 오류:', error);
    }
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

        // 매달 반복 설정된 경우 자동 생성
        if (expenseForm.isRecurring) {
          const generatedCount = await generateMonthlyExpenses(expenseForm);
          if (generatedCount && generatedCount > 0) {
            setSnackbar({
              open: true,
              message: `고정비가 등록되었습니다. ${generatedCount}개월의 고정비가 자동 생성되었습니다.`,
              severity: 'success',
            });
          } else {
            setSnackbar({
              open: true,
              message: '고정비가 등록되었습니다.',
              severity: 'success',
            });
          }
        } else {
          setSnackbar({
            open: true,
            message: '고정비가 등록되었습니다.',
            severity: 'success',
          });
        }
      }

      if (editExpense) {
        setSnackbar({
          open: true,
          message: '고정비가 수정되었습니다.',
          severity: 'success',
        });
      }

      setExpenseDialogOpen(false);
      loadExpenses(selectedMonth);

      // 고정비를 지출/수입 관리에 자동으로 추가
      await createTransactionFromExpense(expenseForm);
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

  // 반복 고정비 수동 생성 함수
  const handleGenerateRecurringExpenses = async () => {
    if (!window.confirm('반복 설정된 고정비를 다음 달부터 자동 생성하시겠습니까?')) return;

    try {
      const recurringExpenses = expenses.filter(e => e.isRecurring);
      let totalGenerated = 0;

      for (const expense of recurringExpenses) {
        const generatedCount = await generateMonthlyExpenses(expense);
        if (generatedCount) {
          totalGenerated += generatedCount;
        }
      }

      setSnackbar({
        open: true,
        message: `${totalGenerated}개의 반복 고정비가 생성되었습니다.`,
        severity: 'success',
      });
      loadExpenses(selectedMonth);
    } catch (error) {
      console.error('반복 고정비 생성 오류:', error);
      setSnackbar({
        open: true,
        message: '반복 고정비 생성에 실패했습니다.',
        severity: 'error',
      });
    }
  };

  const handleTransactionSave = async () => {
    try {
      console.log('거래내역 저장 시작:', transactionForm);
      
      if (editTransaction) {
        console.log('거래내역 수정:', editTransaction.id);
        const response = await fetch(
          `${API_BASE}/updateTransaction/${editTransaction.id}`,
          {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(transactionForm),
          }
        );
        console.log('수정 응답 상태:', response.status);
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(`수정 실패: ${errorData.error}`);
        }
        const responseData = await response.json();
        console.log('수정 성공:', responseData);
      } else {
        console.log('거래내역 신규 등록');
        const response = await fetch(`${API_BASE}/saveTransaction`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(transactionForm),
        });
        console.log('등록 응답 상태:', response.status);
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(`등록 실패: ${errorData.error}`);
        }
        const responseData = await response.json();
        console.log('등록 성공:', responseData);
      }

      setSnackbar({
        open: true,
        message: editTransaction
          ? '거래내역이 수정되었습니다.'
          : '거래내역이 등록되었습니다.',
        severity: 'success',
      });
      setTransactionDialogOpen(false);
      loadTransactions(selectedMonth);
    } catch (error) {
      console.error('거래내역 저장 오류:', error);
      setSnackbar({
        open: true,
        message: `저장에 실패했습니다: ${error instanceof Error ? error.message : '알 수 없는 오류'}`,
        severity: 'error',
      });
    }
  };

  const handleTransactionDelete = async (id: number) => {
    if (!window.confirm('정말 삭제하시겠습니까?')) return;

    try {
      const response = await fetch(`${API_BASE}/deleteTransaction/${id}`, {
        method: 'DELETE',
      });
      if (!response.ok) throw new Error('삭제 실패');

      setSnackbar({
        open: true,
        message: '거래내역이 삭제되었습니다.',
        severity: 'success',
      });
      loadTransactions(selectedMonth);
    } catch (error) {
      console.error('거래내역 삭제 오류:', error);
      setSnackbar({
        open: true,
        message: '삭제에 실패했습니다.',
        severity: 'error',
      });
    }
  };

  const handleAccountOpen = (account?: Account) => {
    if (account) {
      setEditAccount(account);
      setAccountForm({
        name: account.name,
        number: account.number,
        description: account.description || '',
        isActive: account.isActive,
      });
    } else {
      setEditAccount(null);
      setAccountForm({
        name: '',
        number: '',
        description: '',
        isActive: true,
      });
    }
    setAccountDialogOpen(true);
  };

  const handleAccountSave = async () => {
    try {
      console.log('계좌 저장 시작:', accountForm);
      
      if (editAccount) {
        console.log('계좌 수정:', editAccount.id);
        const response = await fetch(
          `${API_BASE}/updateAccount/${editAccount.id}`,
          {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(accountForm),
          }
        );
        console.log('수정 응답 상태:', response.status);
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(`수정 실패: ${errorData.error}`);
        }
        const responseData = await response.json();
        console.log('수정 성공:', responseData);
      } else {
        console.log('계좌 신규 등록');
        const response = await fetch(`${API_BASE}/saveAccount`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(accountForm),
        });
        console.log('등록 응답 상태:', response.status);
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(`등록 실패: ${errorData.error}`);
        }
        const responseData = await response.json();
        console.log('등록 성공:', responseData);
      }

      setSnackbar({
        open: true,
        message: editAccount
          ? '계좌가 수정되었습니다.'
          : '계좌가 등록되었습니다.',
        severity: 'success',
      });
      setAccountDialogOpen(false);
      loadAccounts();
    } catch (error) {
      console.error('계좌 저장 오류:', error);
      setSnackbar({
        open: true,
        message: `저장에 실패했습니다: ${error instanceof Error ? error.message : '알 수 없는 오류'}`,
        severity: 'error',
      });
    }
  };

  const handleAccountDelete = async (id: string) => {
    if (!window.confirm('정말 삭제하시겠습니까?')) return;

    try {
      const response = await fetch(`${API_BASE}/deleteAccount/${id}`, {
        method: 'DELETE',
      });
      if (!response.ok) throw new Error('삭제 실패');

      setSnackbar({
        open: true,
        message: '계좌가 삭제되었습니다.',
        severity: 'success',
      });
      loadAccounts();
    } catch (error) {
      console.error('계좌 삭제 오류:', error);
      setSnackbar({
        open: true,
        message: '삭제에 실패했습니다.',
        severity: 'error',
      });
    }
  };

  // 월 옵션 목록 생성 (중복 제거 및 정렬)
  const monthOptions = useMemo(() => {
    const months = new Set<string>();
    expenses.forEach(e => months.add(e.month));
    transactions.forEach(t => months.add(t.month));
    
    // 현재 월이 없으면 추가
    const currentMonth = getCurrentMonth();
    if (!months.has(currentMonth)) {
      months.add(currentMonth);
    }
    
    return Array.from(months).sort().reverse();
  }, [expenses, transactions]);

  // 분기 옵션 생성
  const quarterOptions = useMemo(() => {
    const quarters = new Set<string>();
    const currentYear = new Date().getFullYear();
    
    // 최근 3년간의 분기 생성
    for (let year = currentYear - 2; year <= currentYear; year++) {
      for (let quarter = 1; quarter <= 4; quarter++) {
        quarters.add(`${year}-Q${quarter}`);
      }
    }
    return Array.from(quarters).sort().reverse();
  }, []);

  // 반기 옵션 생성
  const halfYearOptions = useMemo(() => {
    const halfYears = new Set<string>();
    const currentYear = new Date().getFullYear();
    
    // 최근 3년간의 반기 생성
    for (let year = currentYear - 2; year <= currentYear; year++) {
      for (let half = 1; half <= 2; half++) {
        halfYears.add(`${year}-H${half}`);
      }
    }
    return Array.from(halfYears).sort().reverse();
  }, []);

  // 년도 옵션 생성
  const yearOptions = useMemo(() => {
    const years = new Set<number>();
    const currentYear = new Date().getFullYear();
    
    // 최근 5년간 생성
    for (let year = currentYear - 4; year <= currentYear; year++) {
      years.add(year);
    }
    return Array.from(years).sort((a, b) => b - a);
  }, []);

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
        <Grid item xs={12} sm={6} md={2}>
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
        <Grid item xs={12} sm={6} md={2}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                {transactionPeriodType === 'month' ? '이번달' :
                 transactionPeriodType === 'quarter' ? '이번 분기' :
                 transactionPeriodType === 'half' ? '이번 반기' : '이번 년도'} 수입
              </Typography>
              <Typography variant="h4" color="success.main">
                {periodIncome.toLocaleString()}원
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={2}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                {transactionPeriodType === 'month' ? '이번달' :
                 transactionPeriodType === 'quarter' ? '이번 분기' :
                 transactionPeriodType === 'half' ? '이번 반기' : '이번 년도'} 지출
              </Typography>
              <Typography variant="h4" color="error.main">
                {periodExpense.toLocaleString()}원
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={2}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                {transactionPeriodType === 'month' ? '이번달' :
                 transactionPeriodType === 'quarter' ? '이번 분기' :
                 transactionPeriodType === 'half' ? '이번 반기' : '이번 년도'} 순수익
              </Typography>
              <Typography
                variant="h4"
                color={periodNetIncome >= 0 ? 'success.main' : 'error.main'}
              >
                {periodNetIncome.toLocaleString()}원
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={2}>
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
        <Grid item xs={12} sm={6} md={2}>
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
      </Grid>

      {/* 탭 메뉴 */}
      <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
        <Tabs
          value={tabValue}
          onChange={handleTabChange}
          aria-label="회계 관리 탭"
        >
          <Tab label="지출/수입 관리" icon={<AccountBalance />} />
          <Tab label="고정비 관리" icon={<AccountBalance />} />
          <Tab label="예산 관리" icon={<TrendingUp />} />
          <Tab label="수익성 분석" icon={<TrendingUp />} />
          <Tab label="세금계산서" icon={<Receipt />} />
        </Tabs>
      </Box>

      {/* 지출/수입 관리 탭 */}
      <TabPanel value={tabValue} index={0}>
        <Box sx={{ mb: 2, display: 'flex', gap: 2, alignItems: 'center', flexWrap: 'wrap' }}>
          {/* 기간별 필터 */}
          <FormControl size="small">
            <InputLabel>기간 구분</InputLabel>
            <Select
              value={transactionPeriodType}
              onChange={(e) => {
                const newType = e.target.value as 'month' | 'quarter' | 'half' | 'year';
                setTransactionPeriodType(newType);
                // 기간 타입이 변경되면 기본값으로 설정
                if (newType === 'month') {
                  setSelectedPeriod(getCurrentMonth());
                } else if (newType === 'quarter') {
                  const currentDate = new Date();
                  const currentQuarter = Math.ceil((currentDate.getMonth() + 1) / 3);
                  setSelectedPeriod(`${currentDate.getFullYear()}-Q${currentQuarter}`);
                } else if (newType === 'half') {
                  const currentDate = new Date();
                  const currentHalf = Math.ceil((currentDate.getMonth() + 1) / 6);
                  setSelectedPeriod(`${currentDate.getFullYear()}-H${currentHalf}`);
                } else if (newType === 'year') {
                  setSelectedPeriod(new Date().getFullYear().toString());
                }
              }}
              label="기간 구분"
            >
              <MenuItem value="month">월간</MenuItem>
              <MenuItem value="quarter">분기</MenuItem>
              <MenuItem value="half">반기</MenuItem>
              <MenuItem value="year">년도</MenuItem>
            </Select>
          </FormControl>

          {/* 기간 선택 */}
          <FormControl size="small">
            <InputLabel>기간 선택</InputLabel>
            <Select
              value={selectedPeriod}
              onChange={(e) => setSelectedPeriod(e.target.value)}
              label="기간 선택"
            >
              {transactionPeriodType === 'month' && monthOptions.map(month => (
                <MenuItem key={month} value={month}>
                  {month}
                </MenuItem>
              ))}
              {transactionPeriodType === 'quarter' && quarterOptions.map(quarter => (
                <MenuItem key={quarter} value={quarter}>
                  {quarter}
                </MenuItem>
              ))}
              {transactionPeriodType === 'half' && halfYearOptions.map(half => (
                <MenuItem key={half} value={half}>
                  {half}
                </MenuItem>
              ))}
              {transactionPeriodType === 'year' && yearOptions.map(year => (
                <MenuItem key={year} value={year.toString()}>
                  {year}년
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <Button variant="contained" onClick={() => handleTransactionOpen()}>
            거래내역 등록
          </Button>
          <Button variant="outlined" onClick={() => handleAccountOpen()}>
            계좌 관리
          </Button>
        </Box>

        <TableContainer component={Paper}>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>구분</TableCell>
                <TableCell>거래처</TableCell>
                <TableCell>입금방식</TableCell>
                <TableCell>금액</TableCell>
                <TableCell>날짜</TableCell>
                <TableCell>비고</TableCell>
                <TableCell>관리</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {periodTransactions.map(t => (
                <TableRow key={t.id}>
                  <TableCell>
                    <Chip 
                      label={t.type === 'income' ? '수입' : '지출'} 
                      size="small" 
                      color={t.type === 'income' ? 'success' : 'error'} 
                      variant="outlined"
                    />
                  </TableCell>
                  <TableCell>{t.vendor}</TableCell>
                  <TableCell>
                    <Chip 
                      label={
                        t.paymentMethod === 'card' ? '카드' : 
                        t.paymentMethod === 'cash' ? '현금' :
                        (() => {
                          const account = accounts.find(a => a.id === t.paymentMethod);
                          return account ? `${account.name}(${account.number})` : '알 수 없음';
                        })()
                      } 
                      size="small" 
                      color="primary" 
                      variant="outlined"
                    />
                  </TableCell>
                  <TableCell>{t.amount.toLocaleString()}원</TableCell>
                  <TableCell>{t.date}</TableCell>
                  <TableCell>{t.note}</TableCell>
                  <TableCell>
                    <IconButton
                      size="small"
                      onClick={() => handleTransactionOpen(t)}
                    >
                      <Edit fontSize="small" />
                    </IconButton>
                    <IconButton
                      size="small"
                      onClick={() => handleTransactionDelete(t.id)}
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
            총 수입: <b style={{ color: 'green' }}>{periodIncome.toLocaleString()}원</b>
          </Typography>
          <Typography>
            총 지출: <b style={{ color: 'red' }}>{periodExpense.toLocaleString()}원</b>
          </Typography>
          <Typography>
            순수익: <b style={{ color: periodNetIncome >= 0 ? 'green' : 'red' }}>
              {periodNetIncome.toLocaleString()}원
            </b>
          </Typography>
        </Box>
      </TabPanel>

      {/* 고정비 관리 탭 */}
      <TabPanel value={tabValue} index={1}>
        <Box sx={{ mb: 2, display: 'flex', gap: 2, alignItems: 'center', flexWrap: 'wrap' }}>
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
          <FormControl size="small">
            <InputLabel>구분 필터</InputLabel>
            <Select
              value={expenseTypeFilter}
              onChange={e => setExpenseTypeFilter(e.target.value as 'all' | 'personal' | 'company')}
              label="구분 필터"
            >
              <MenuItem value="all">전체</MenuItem>
              <MenuItem value="personal">개인</MenuItem>
              <MenuItem value="company">회사</MenuItem>
            </Select>
          </FormControl>
          <Button variant="contained" onClick={() => handleExpenseOpen()}>
            고정비 등록
          </Button>
          <Button 
            variant="outlined" 
            onClick={handleGenerateRecurringExpenses}
            disabled={!hasRecurringExpenses}
          >
            반복 고정비 생성
          </Button>
        </Box>

        <TableContainer component={Paper}>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>항목명</TableCell>
                <TableCell>금액</TableCell>
                <TableCell>구분</TableCell>
                <TableCell>결제방식</TableCell>
                <TableCell>비고</TableCell>
                <TableCell>반복</TableCell>
                <TableCell>관리</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {monthExpenses.map(e => (
                <TableRow key={e.id}>
                  <TableCell>{e.name}</TableCell>
                  <TableCell>{e.amount.toLocaleString()}원</TableCell>
                  <TableCell>
                    <Chip
                      label={e.type === 'personal' ? '개인' : '회사'}
                      size="small"
                      color={e.type === 'personal' ? 'info' : 'warning'}
                      variant="outlined"
                    />
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={
                        e.paymentMethod === 'card' ? '카드' :
                        e.paymentMethod === 'autoTransfer' ? '계좌자동이체' :
                        e.paymentMethod === 'manualTransfer' ? 
                          (() => {
                            const account = accounts.find(a => a.id === e.accountId);
                            return account ? `계좌직접이체(${account.name})` : '계좌직접이체';
                          })() : '알 수 없음'
                      }
                      size="small"
                      color="primary"
                      variant="outlined"
                    />
                  </TableCell>
                  <TableCell>{e.note}</TableCell>
                  <TableCell>
                    {e.isRecurring ? (
                      <Chip 
                        label="매달 반복" 
                        size="small" 
                        color="primary" 
                        variant="outlined"
                      />
                    ) : (
                      <Chip 
                        label="일회성" 
                        size="small" 
                        color="default" 
                        variant="outlined"
                      />
                    )}
                  </TableCell>
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

        <Box sx={{ mt: 2, display: 'flex', gap: 4, alignItems: 'center', flexWrap: 'wrap' }}>
          <Typography>
            월 고정비 합계: <b>{monthTotal.toLocaleString()}원</b>
          </Typography>
          <Typography>
            개인 고정비: <b style={{ color: 'info.main' }}>
              {monthExpenses
                .filter(e => e.type === 'personal')
                .reduce((sum, e) => sum + e.amount, 0)
                .toLocaleString()}원
            </b>
          </Typography>
          <Typography>
            회사 고정비: <b style={{ color: 'warning.main' }}>
              {monthExpenses
                .filter(e => e.type === 'company')
                .reduce((sum, e) => sum + e.amount, 0)
                .toLocaleString()}원
            </b>
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
      <TabPanel value={tabValue} index={2}>
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
      <TabPanel value={tabValue} index={3}>
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
      <TabPanel value={tabValue} index={4}>
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

      {/* 계좌 관리 다이얼로그 */}
      <Dialog
        open={accountDialogOpen}
        onClose={() => setAccountDialogOpen(false)}
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
                onClick={() => setAccountDialogOpen(false)}
                sx={{ mr: 1 }}
              >
                <ArrowBackIcon />
              </IconButton>
            )}
            <Typography variant={isMobile ? 'h6' : 'h5'}>
              계좌 관리
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
          <Box sx={{ mb: 3 }}>
            <Button 
              variant="contained" 
              onClick={() => handleAccountOpen()}
              sx={{ mb: 2 }}
            >
              새 계좌 추가
            </Button>
            
            <TableContainer component={Paper}>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>계좌명</TableCell>
                    <TableCell>계좌번호</TableCell>
                    <TableCell>설명</TableCell>
                    <TableCell>상태</TableCell>
                    <TableCell>관리</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {accounts.map(account => (
                    <TableRow key={account.id}>
                      <TableCell>{account.name}</TableCell>
                      <TableCell>{account.number}</TableCell>
                      <TableCell>{account.description}</TableCell>
                      <TableCell>
                        <Chip 
                          label={account.isActive ? '활성' : '비활성'} 
                          size="small" 
                          color={account.isActive ? 'success' : 'default'} 
                          variant="outlined"
                        />
                      </TableCell>
                      <TableCell>
                        <IconButton
                          size="small"
                          onClick={() => handleAccountOpen(account)}
                        >
                          <Edit fontSize="small" />
                        </IconButton>
                        <IconButton
                          size="small"
                          onClick={() => handleAccountDelete(account.id)}
                        >
                          <Delete fontSize="small" />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Box>

                    {/* 계좌 등록/수정 폼 */}
          <Box sx={{ mt: 3, p: 2, border: '1px solid #ddd', borderRadius: 1 }}>
            <Typography variant="h6" sx={{ mb: 2 }}>
              {editAccount ? '계좌 수정' : '새 계좌 등록'}
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="계좌명"
                  value={accountForm.name}
                  onChange={(e) => setAccountForm({ 
                    ...accountForm, 
                    name: e.target.value 
                  })}
                  placeholder="예: 계좌1, 회사계좌"
                  required
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="계좌번호"
                  value={accountForm.number}
                  onChange={(e) => setAccountForm({ 
                    ...accountForm, 
                    number: e.target.value 
                  })}
                  placeholder="예: 기업302-054..."
                  required
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="설명"
                  value={accountForm.description}
                  onChange={(e) => setAccountForm({ 
                    ...accountForm, 
                    description: e.target.value 
                  })}
                  placeholder="계좌에 대한 추가 설명"
                />
              </Grid>
              <Grid item xs={12}>
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={accountForm.isActive}
                      onChange={(e) => setAccountForm({ 
                        ...accountForm, 
                        isActive: e.target.checked 
                      })}
                    />
                  }
                  label="활성화"
                />
              </Grid>
            </Grid>
            <Box sx={{ mt: 2, display: 'flex', gap: 1 }}>
              <Button 
                variant="contained" 
                onClick={handleAccountSave}
                size="small"
                disabled={!accountForm.name || !accountForm.number}
              >
                {editAccount ? '수정' : '등록'}
              </Button>
              <Button 
                variant="outlined" 
                onClick={() => {
                  setEditAccount(null);
                  setAccountForm({
                    name: '',
                    number: '',
                    description: '',
                    isActive: true,
                  });
                }}
                size="small"
              >
                취소
              </Button>
            </Box>
          </Box>
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
            onClick={() => setAccountDialogOpen(false)}
            size={isMobile ? 'large' : 'medium'}
            sx={{
              ...(isMobile && {
                flex: 1,
                height: 48,
              }),
            }}
          >
            닫기
          </Button>
        </DialogActions>
      </Dialog>

      {/* 거래내역 등록/수정 다이얼로그 */}
      <Dialog
        open={transactionDialogOpen}
        onClose={() => setTransactionDialogOpen(false)}
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
                onClick={() => setTransactionDialogOpen(false)}
                sx={{ mr: 1 }}
              >
                <ArrowBackIcon />
              </IconButton>
            )}
            <Typography variant={isMobile ? 'h6' : 'h5'}>
              {editTransaction ? '거래내역 수정' : '거래내역 등록'}
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
          <Grid container spacing={2}>
            <Grid item xs={12}>
              <FormControl fullWidth>
                <InputLabel>구분</InputLabel>
                <Select
                  value={transactionForm.type}
                  onChange={(e) => {
                    const newType = e.target.value as 'income' | 'expense';
                    // 수입으로 변경될 때 계좌 선택이면 현금으로 변경
                    let newPaymentMethod = transactionForm.paymentMethod;
                    if (newType === 'income' && accounts.some(account => account.id === transactionForm.paymentMethod)) {
                      newPaymentMethod = 'cash';
                    }
                    setTransactionForm({ 
                      ...transactionForm, 
                      type: newType,
                      paymentMethod: newPaymentMethod
                    });
                  }}
                  label="구분"
                >
                  <MenuItem value="income">수입</MenuItem>
                  <MenuItem value="expense">지출</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="거래처"
                value={transactionForm.vendor}
                onChange={(e) => setTransactionForm({ 
                  ...transactionForm, 
                  vendor: e.target.value 
                })}
              />
            </Grid>
            <Grid item xs={12}>
              <FormControl fullWidth>
                <InputLabel>입금방식</InputLabel>
                <Select
                  value={transactionForm.paymentMethod}
                  onChange={(e) => setTransactionForm({ 
                    ...transactionForm, 
                    paymentMethod: e.target.value 
                  })}
                  label="입금방식"
                >
                  <MenuItem value="card">카드</MenuItem>
                  {transactionForm.type === 'expense' && accounts
                    .filter(account => account.isActive)
                    .map(account => (
                      <MenuItem key={account.id} value={account.id}>
                        {account.name} ({account.number})
                      </MenuItem>
                    ))
                  }
                  <MenuItem value="cash">현금</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="금액"
                type="number"
                value={transactionForm.amount === 0 ? '' : transactionForm.amount}
                onChange={(e) => setTransactionForm({ 
                  ...transactionForm, 
                  amount: Number(e.target.value) || 0
                })}
                onFocus={(e) => e.target.select()}
                placeholder="금액을 입력하세요"
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="날짜"
                type="date"
                value={transactionForm.date}
                onChange={(e) => {
                  const selectedDate = e.target.value;
                  const dateObj = new Date(selectedDate);
                  const monthStr = `${dateObj.getFullYear()}-${String(dateObj.getMonth() + 1).padStart(2, '0')}`;
                  setTransactionForm({ 
                    ...transactionForm, 
                    date: selectedDate,
                    month: monthStr
                  });
                }}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>

            <Grid item xs={12}>
              <TextField
                fullWidth
                label="비고"
                multiline
                rows={2}
                value={transactionForm.note}
                onChange={(e) => setTransactionForm({ 
                  ...transactionForm, 
                  note: e.target.value 
                })}
              />
            </Grid>
          </Grid>
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
            onClick={() => setTransactionDialogOpen(false)}
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
            onClick={handleTransactionSave} 
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
            value={expenseForm.amount === 0 ? '' : expenseForm.amount}
            onChange={e =>
              setExpenseForm({ ...expenseForm, amount: Number(e.target.value) || 0 })
            }
            onFocus={(e) => e.target.select()}
            placeholder="금액을 입력하세요"
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
          
          {/* 개인/회사 구분 */}
          <FormControl fullWidth margin="dense" size={isMobile ? 'medium' : 'small'}>
            <InputLabel>구분</InputLabel>
            <Select
              value={expenseForm.type}
              onChange={(e) => setExpenseForm({ 
                ...expenseForm, 
                type: e.target.value as 'personal' | 'company' 
              })}
              label="구분"
            >
              <MenuItem value="personal">개인</MenuItem>
              <MenuItem value="company">회사</MenuItem>
            </Select>
          </FormControl>
          
          {/* 결제 방식 */}
          <FormControl fullWidth margin="dense" size={isMobile ? 'medium' : 'small'}>
            <InputLabel>결제 방식</InputLabel>
            <Select
              value={expenseForm.paymentMethod}
              onChange={(e) => setExpenseForm({ 
                ...expenseForm, 
                paymentMethod: e.target.value as 'card' | 'autoTransfer' | 'manualTransfer',
                accountId: e.target.value === 'manualTransfer' ? expenseForm.accountId : ''
              })}
              label="결제 방식"
            >
              <MenuItem value="card">카드</MenuItem>
              <MenuItem value="autoTransfer">계좌자동이체</MenuItem>
              <MenuItem value="manualTransfer">계좌직접이체</MenuItem>
            </Select>
          </FormControl>
          
          {/* 계좌직접이체일 경우 계좌 선택 */}
          {expenseForm.paymentMethod === 'manualTransfer' && (
            <FormControl fullWidth margin="dense" size={isMobile ? 'medium' : 'small'}>
              <InputLabel>계좌 선택</InputLabel>
              <Select
                value={expenseForm.accountId}
                onChange={(e) => setExpenseForm({ 
                  ...expenseForm, 
                  accountId: e.target.value 
                })}
                label="계좌 선택"
              >
                {accounts
                  .filter(account => account.isActive)
                  .map(account => (
                    <MenuItem key={account.id} value={account.id}>
                      {account.name} ({account.number})
                    </MenuItem>
                  ))
                }
              </Select>
            </FormControl>
          )}
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
          
          {/* 매달 반복 설정 */}
          <Box sx={{ mt: 2, p: 2, border: '1px solid #ddd', borderRadius: 1 }}>
            <FormControlLabel
              control={
                <Checkbox
                  checked={expenseForm.isRecurring}
                  onChange={(e) => setExpenseForm({ 
                    ...expenseForm, 
                    isRecurring: e.target.checked 
                  })}
                />
              }
              label="매달 반복 적용"
            />
            
            {expenseForm.isRecurring && (
              <Box sx={{ mt: 2 }}>
                <Grid container spacing={2}>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      margin="dense"
                      label="반복 시작 월"
                      name="recurringStartMonth"
                      type="month"
                      value={expenseForm.recurringStartMonth}
                      onChange={e =>
                        setExpenseForm({ 
                          ...expenseForm, 
                          recurringStartMonth: e.target.value 
                        })
                      }
                      fullWidth
                      size="small"
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      margin="dense"
                      label="반복 종료 월 (선택)"
                      name="recurringEndMonth"
                      type="month"
                      value={expenseForm.recurringEndMonth}
                      onChange={e =>
                        setExpenseForm({ 
                          ...expenseForm, 
                          recurringEndMonth: e.target.value 
                        })
                      }
                      fullWidth
                      size="small"
                      helperText="비워두면 2년 후까지 자동 생성"
                    />
                  </Grid>
                </Grid>
              </Box>
            )}
          </Box>
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
            value={budgetForm.amount === 0 ? '' : budgetForm.amount}
            onChange={e =>
              setBudgetForm({ ...budgetForm, amount: Number(e.target.value) || 0 })
            }
            onFocus={(e) => e.target.select()}
            placeholder="예산을 입력하세요"
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
            value={profitForm.totalRevenue === 0 ? '' : profitForm.totalRevenue}
            onChange={e =>
              setProfitForm({
                ...profitForm,
                totalRevenue: Number(e.target.value) || 0,
              })
            }
            onFocus={(e) => e.target.select()}
            placeholder="총수익을 입력하세요"
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
            value={profitForm.totalCost === 0 ? '' : profitForm.totalCost}
            onChange={e =>
              setProfitForm({
                ...profitForm,
                totalCost: Number(e.target.value) || 0,
              })
            }
            onFocus={(e) => e.target.select()}
            placeholder="총비용을 입력하세요"
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
            value={profitForm.netProfit === 0 ? '' : profitForm.netProfit}
            onChange={e =>
              setProfitForm({
                ...profitForm,
                netProfit: Number(e.target.value) || 0,
              })
            }
            onFocus={(e) => e.target.select()}
            placeholder="순이익을 입력하세요"
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
            value={taxInvoiceForm.amount === 0 ? '' : taxInvoiceForm.amount}
            onChange={e =>
              setTaxInvoiceForm({
                ...taxInvoiceForm,
                amount: Number(e.target.value) || 0,
              })
            }
            onFocus={(e) => e.target.select()}
            placeholder="금액을 입력하세요"
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
