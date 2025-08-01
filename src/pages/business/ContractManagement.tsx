import React, { useState, useEffect, useRef } from 'react';
import useMediaQuery from '@mui/material/useMediaQuery';
import { API_BASE } from '../../utils/auth';
import {
  Box,
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
  Grid,
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
  Chip,
  Stepper,
  Step,
  StepLabel,
  Alert,
  Menu,
  ListItemIcon,
  ListItemText,
} from '@mui/material';
import {
  Add as AddIcon,
  Delete as DeleteIcon,
  Edit as EditIcon,
  Visibility as ViewIcon,
  Print as PrintIcon,
  PictureAsPdf as PdfIcon,
  Image as ImageIcon,
  Share as ShareIcon,
  MoreVert as MoreVertIcon,
  Search as SearchIcon,
  FilterList as FilterIcon,
  Assignment as ContractIcon,
  Close as CloseIcon,
  ArrowBack as ArrowBackIcon,
} from '@mui/icons-material';
import type { SelectChangeEvent } from '@mui/material/Select';
import SignatureCanvas from '../../components/SignatureCanvas';
import ContractPayment from '../../components/ContractPayment';
import ContractAgreement from '../../components/ContractAgreement';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';
import { useNavigate } from 'react-router-dom';
import ContractTemplate from '../../components/ContractTemplate';

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
  measurementDate?: string;
  constructionDate?: string;
  createdAt: string;
  updatedAt: string;
  rows?: any[];
}

interface Estimate {
  id: number;
  estimateNo: string;
  customerName: string;
  projectName: string;
  totalAmount: number;
  estimateDate: string;
  contact?: string;
  emergencyContact?: string;
  type?: string;
  address?: string;
  products?: string;
  discountedAmount?: number;
  rows?: any[];
  name?: string;
}

const ContractManagement: React.FC = () => {
  const navigate = useNavigate();

  // 모바일 환경 감지
  const isMobile = useMediaQuery('(max-width:768px)');

  const [contracts, setContracts] = useState<Contract[]>(() => {
    const savedContracts = localStorage.getItem('contracts');
    return savedContracts ? JSON.parse(savedContracts) : [];
  });

  // contracts 상태가 변경될 때마다 localStorage에 저장
  useEffect(() => {
    localStorage.setItem('contracts', JSON.stringify(contracts));
  }, [contracts]);

  const [estimates, setEstimates] = useState<Estimate[]>(() => {
    const savedEstimates = localStorage.getItem('approvedEstimatesList');
    return savedEstimates ? JSON.parse(savedEstimates) : [];
  });

  useEffect(() => {
    localStorage.setItem('approvedEstimatesList', JSON.stringify(estimates));
  }, [estimates]);

  const [activeTab, setActiveTab] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedContract, setSelectedContract] = useState<Contract | null>(
    null
  );
  const [dialogOpen, setDialogOpen] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [selectedEstimate, setSelectedEstimate] = useState<Estimate | null>(
    null
  );
  const [paymentData, setPaymentData] = useState<any>(null);
  const [agreementData, setAgreementData] = useState<any>(null);

  // 기능 활성화를 위한 상태 변수 추가
  const [editViewDialogOpen, setEditViewDialogOpen] = useState(false);
  const [viewOnly, setViewOnly] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [contractToDelete, setContractToDelete] = useState<Contract | null>(
    null
  );
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);

  // 출력 기능을 위한 ref 추가
  const contractPrintRef = useRef<HTMLDivElement>(null);

  const [contractTemplateOpen, setContractTemplateOpen] = useState(false);
  const [selectedContractForPrint, setSelectedContractForPrint] =
    useState<Contract | null>(null);

  // 샘플 데이터
  useEffect(() => {
    // localStorage에서 승인된 견적서 확인
    const approvedEstimateData = localStorage.getItem('approvedEstimate');
    console.log(
      'ContractManagement 초기 로드 - 승인된 견적서 데이터:',
      approvedEstimateData
    );

    if (approvedEstimateData) {
      try {
        const approvedEstimate = JSON.parse(approvedEstimateData);
        console.log(
          'ContractManagement 초기 로드 - 파싱된 승인된 견적서:',
          approvedEstimate
        );

        // rows 배열이 있는지 확인
        const rows = approvedEstimate.rows || [];
        console.log('ContractManagement - rows:', rows);

        // EstimateManagement에서 전달된 totalAmount를 우선 사용
        const totalAmount =
          approvedEstimate.totalAmount ||
          rows.reduce(
            (sum: number, row: any) => sum + (row.totalPrice || 0),
            0
          );
        console.log('ContractManagement - 계산된 totalAmount:', totalAmount);

        const products =
          approvedEstimate.products ||
          rows
            .map((row: any) => row.productName || row.name || '제품명 없음')
            .join(', ');
        console.log('ContractManagement - products:', products);

        const estimate: Estimate = {
          id: approvedEstimate.id || 1,
          estimateNo:
            approvedEstimate.estimateNo ||
            `E${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-001`,
          customerName: approvedEstimate.customerName || '고객명 없음',
          projectName: approvedEstimate.projectName || '프로젝트명 없음',
          totalAmount: totalAmount,
          estimateDate:
            approvedEstimate.estimateDate ||
            new Date().toISOString().split('T')[0],
          contact:
            approvedEstimate.contact ||
            approvedEstimate.customerPhone ||
            '010-0000-0000',
          emergencyContact: approvedEstimate.emergencyContact || '',
          type: approvedEstimate.type || '커튼',
          address:
            approvedEstimate.address ||
            approvedEstimate.customerAddress ||
            '주소 없음',
          products: products || '제품 정보 없음',
          discountedAmount: approvedEstimate.discountedAmount || totalAmount,
          rows: approvedEstimate.rows || [],
          name:
            approvedEstimate.name || approvedEstimate.estimateNo || '견적서',
        };

        console.log(
          'ContractManagement 초기 로드 - 변환된 승인된 견적서:',
          estimate
        );

        // 기존 estimates에 새 견적서 추가 (중복 방지)
        setEstimates(prevEstimates => {
          const existingIndex = prevEstimates.findIndex(
            e => e.estimateNo === estimate.estimateNo
          );
          if (existingIndex >= 0) {
            // 기존 견적서 업데이트 (이미 목록에 있으면 아무것도 하지 않음)
            console.log('이미 승인 목록에 있는 견적서입니다.');
            return prevEstimates;
          } else {
            // 새 견적서 추가
            console.log('승인 목록에 새 견적서 추가');
            return [...prevEstimates, estimate];
          }
        });

        // "승인한 견적서" 탭으로 자동 전환
        setActiveTab(1);

        // 승인된 견적서 데이터를 사용한 후 localStorage에서 제거
        localStorage.removeItem('approvedEstimate');
        console.log(
          'ContractManagement - localStorage에서 approvedEstimate 제거 완료'
        );
      } catch (error) {
        console.error(
          'ContractManagement 초기 로드 - 승인된 견적서 데이터 파싱 오류:',
          error
        );
        // 에러가 발생해도 기존 estimates는 유지
      }
    } else {
      console.log('ContractManagement 초기 로드 - 승인된 견적서가 없습니다.');
      // 기존 estimates 유지
    }
  }, []);

  // 견적서 데이터 새로고침 함수
  const refreshEstimates = () => {
    const approvedEstimateData = localStorage.getItem('approvedEstimate');
    console.log('localStorage 승인된 견적서 데이터:', approvedEstimateData);

    if (approvedEstimateData) {
      try {
        const approvedEstimate = JSON.parse(approvedEstimateData);
        console.log('파싱된 승인된 견적서:', approvedEstimate);

        // rows 배열이 있는지 확인
        const rows = approvedEstimate.rows || [];
        console.log('ContractManagement - rows:', rows);

        // EstimateManagement에서 전달된 totalAmount를 우선 사용
        const totalAmount =
          approvedEstimate.totalAmount ||
          rows.reduce(
            (sum: number, row: any) => sum + (row.totalPrice || 0),
            0
          );
        console.log('ContractManagement - 계산된 totalAmount:', totalAmount);

        const products =
          approvedEstimate.products ||
          rows
            .map((row: any) => row.productName || row.name || '제품명 없음')
            .join(', ');
        console.log('ContractManagement - products:', products);

        const estimate: Estimate = {
          id: approvedEstimate.id || 1,
          estimateNo:
            approvedEstimate.estimateNo ||
            `E${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-001`,
          customerName: approvedEstimate.customerName || '고객명 없음',
          projectName: approvedEstimate.projectName || '프로젝트명 없음',
          totalAmount: totalAmount,
          estimateDate:
            approvedEstimate.estimateDate ||
            new Date().toISOString().split('T')[0],
          contact:
            approvedEstimate.contact ||
            approvedEstimate.customerPhone ||
            '010-0000-0000',
          emergencyContact: approvedEstimate.emergencyContact || '',
          type: approvedEstimate.type || '커튼',
          address:
            approvedEstimate.address ||
            approvedEstimate.customerAddress ||
            '주소 없음',
          products: products || '제품 정보 없음',
          discountedAmount: approvedEstimate.discountedAmount || totalAmount,
          rows: approvedEstimate.rows || [],
          name:
            approvedEstimate.name || approvedEstimate.estimateNo || '견적서',
        };

        console.log('변환된 승인된 견적서:', estimate);

        // 기존 estimates에 새 견적서 추가 (중복 방지)
        setEstimates(prevEstimates => {
          const existingIndex = prevEstimates.findIndex(
            e => e.estimateNo === estimate.estimateNo
          );
          if (existingIndex >= 0) {
            // 기존 견적서 업데이트
            const updatedEstimates = [...prevEstimates];
            updatedEstimates[existingIndex] = estimate;
            return updatedEstimates;
          } else {
            // 새 견적서 추가
            return [...prevEstimates, estimate];
          }
        });

        // "승인한 견적서" 탭으로 자동 전환
        setActiveTab(1);

        // 승인된 견적서 데이터를 사용한 후 localStorage에서 제거
        localStorage.removeItem('approvedEstimate');
        console.log(
          'ContractManagement - localStorage에서 approvedEstimate 제거 완료'
        );
      } catch (error) {
        console.error('승인된 견적서 데이터 파싱 오류:', error);
        // 에러가 발생해도 기존 estimates는 유지
      }
    } else {
      console.log('승인된 견적서가 없습니다.');
      // 기존 estimates 유지
    }
  };

  // estimates 상태 변경 추적
  useEffect(() => {
    console.log('ContractManagement - estimates 상태 변경:', estimates);
  }, [estimates]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'draft':
        return 'default';
      case 'pending':
        return 'warning';
      case 'signed':
        return 'success';
      case 'completed':
        return 'info';
      case 'cancelled':
        return 'error';
      default:
        return 'default';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'draft':
        return '작성중';
      case 'pending':
        return '대기중';
      case 'signed':
        return '계약완료';
      case 'completed':
        return '완료';
      case 'cancelled':
        return '취소';
      default:
        return '알 수 없음';
    }
  };

  // 견적서가 계약으로 완료되었는지 확인하는 함수
  const isEstimateContracted = (estimateNo: string) => {
    return contracts.some(contract => contract.estimateNo === estimateNo);
  };

  // 견적서에 해당하는 계약을 찾는 함수
  const getContractByEstimate = (estimateNo: string) => {
    return contracts.find(contract => contract.estimateNo === estimateNo);
  };

  // 계약 목록에서 특정 계약을 찾아 스크롤하는 함수
  const scrollToContract = (contractNo: string) => {
    setActiveTab(0); // 계약 목록 탭으로 이동
    // 약간의 지연 후 스크롤 (탭 변경 애니메이션 완료 후)
    setTimeout(() => {
      const element = document.getElementById(`contract-${contractNo}`);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'center' });
        // 하이라이트 효과 추가
        element.style.backgroundColor = '#1b5e20';
        setTimeout(() => {
          element.style.backgroundColor = '#23272b';
        }, 2000);
      }
    }, 300);
  };

  const handleCreateContract = (estimate: Estimate) => {
    setSelectedEstimate(estimate);
    setDialogOpen(true);
    setCurrentStep(1);
  };

  const handlePaymentSave = (data: any) => {
    setPaymentData(data);
    setCurrentStep(2);
  };

  const handleAgreementSave = (data: any) => {
    setAgreementData(data);
    handleContractComplete(data);
  };

  const handleSaveSchedule = async (scheduleData: any) => {
    try {
      console.log('=== 스케줄 저장 시작 ===');
      console.log('스케줄 데이터:', scheduleData);

      // datetime-local 형식을 date와 time으로 분리
      const measurementDateTime = scheduleData.measurementDate;
      let measurementDate = '';
      let measurementTime = '09:00';

      if (measurementDateTime && measurementDateTime.includes('T')) {
        const [datePart, timePart] = measurementDateTime.split('T');
        measurementDate = datePart;
        measurementTime = timePart || '09:00';
      } else if (measurementDateTime) {
        measurementDate = measurementDateTime;
        measurementTime = '09:00';
      }

      console.log('분리된 실측일자:', measurementDate);
      console.log('분리된 실측시간:', measurementTime);

      const navAddress = extractNavigationAddress(scheduleData.address || '');
      const scheduleTitle = `실측 - ${navAddress}`;

      // 견적서 정보 가져오기 (Firebase에서 먼저 시도, 실패 시 localStorage 사용)
      let matchedEstimate = null;
      
      try {
        const response = await fetch(`${API_BASE}/estimates?estimateNo=${scheduleData.estimateNo}`);
        if (response.ok) {
          const estimates = await response.json();
          matchedEstimate = estimates.find((est: any) => est.estimateNo === scheduleData.estimateNo);
          console.log('Firebase에서 견적서 정보 가져옴:', matchedEstimate);
        } else {
          console.log('Firebase에서 견적서를 찾을 수 없음, localStorage에서 시도');
        }
      } catch (error) {
        console.error('Firebase 견적서 조회 실패:', error);
      }
      
      if (!matchedEstimate) {
        const savedEstimates = JSON.parse(
          localStorage.getItem('saved_estimates') || '[]'
        );
        matchedEstimate = savedEstimates.find(
          (est: any) => est.estimateNo === scheduleData.estimateNo
        );
        console.log('localStorage에서 견적서 정보 가져옴:', matchedEstimate);
      }

      if (matchedEstimate && matchedEstimate.rows) {
        // 견적서 내용을 기반으로 실측 데이터 초기화
        const estimateRows = matchedEstimate.rows
          .filter((row: any) => row.space && row.productName)
          .map((row: any) => ({
            space: row.space,
            productName: row.productName,
            widthMM: row.widthMM,
            heightMM: row.heightMM,
          }));

        // 견적서 정보 구성
        const totalAmount =
          matchedEstimate.rows?.reduce(
            (sum: number, row: any) => sum + (row.totalPrice || 0),
            0
          ) || 0;
        const discountAmount = matchedEstimate.discountAmount || 0;
        const finalAmount = totalAmount - discountAmount;

        const estimateInfo = {
          estimateNo: matchedEstimate.estimateNo,
          customerName: matchedEstimate.customerName,
          customerContact:
            matchedEstimate.contact || matchedEstimate.customerContact || '-',
          customerAddress:
            matchedEstimate.address || matchedEstimate.customerAddress || '-',
          appointmentDate: measurementDate,
          appointmentTime: measurementTime,
          constructionDate: scheduleData.constructionDate || '-',
          totalAmount,
          discountAmount,
          finalAmount,
          contractAmount: 0,
          projectName:
            matchedEstimate.projectName || matchedEstimate.name || '-',
          projectType: matchedEstimate.type || '-',
          memo: scheduleData.memo || '-',
        };

        // 실측 데이터 초기화
        const initialData = estimateRows.map((row: any) => ({
          space: row.space,
          productName: row.productName,
          estimateWidth: String(row.widthMM || ''),
          estimateHeight: String(row.heightMM || ''),
          measuredWidth: '',
          measuredHeight: '',
          lineDirection: '',
          lineLength: '',
          customLineLength: '',
          memo: '',
          showMemo: false,
        }));

        console.log('견적서 내용으로 실측 데이터 초기화:', initialData);

        // 실측 모달 열기
        const measurementEvent = {
          id: `schedule-${Date.now()}-measurement`,
          title: scheduleTitle,
          date: measurementDate,
          time: measurementTime,
          type: '실측',
          description: scheduleData.projectName,
          customerName: scheduleData.customerName,
          address: scheduleData.address,
          contact: scheduleData.contact,
          priority: '보통',
          status: '예정',
          estimateNo: scheduleData.estimateNo,
          measurementData: initialData,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          createdBy: 'current_user',
        };

        // 실측일정을 스케줄에 저장
        console.log('실측일정 스케줄 저장 시작:', measurementEvent);

        const response = await fetch('https://us-central1-windowerp-3.cloudfunctions.net/schedules', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(measurementEvent),
        });

        console.log(
          '실측일정 저장 응답 상태:',
          response.status,
          response.statusText
        );

        if (!response.ok) {
          const errorText = await response.text();
          console.error(
            '실측일정 저장 실패:',
            response.status,
            response.statusText,
            errorText
          );
          alert(
            `실측일정 저장에 실패했습니다: ${response.status} ${response.statusText}`
          );
        } else {
          const result = await response.json();
          console.log('실측일정 저장 성공:', result);
          alert(
            `실측일정이 성공적으로 스케줄에 저장되었습니다!\n\n견적번호: ${scheduleData.estimateNo}\n실측일자: ${measurementDate} ${measurementTime}\n제목: ${scheduleTitle}\n\n스케줄 페이지에서 확인하실 수 있습니다.`
          );
        }
      } else {
        console.log('견적서를 찾을 수 없습니다:', scheduleData.estimateNo);
        alert('견적서를 찾을 수 없어 실측 스케줄을 생성할 수 없습니다.');
      }
    } catch (error) {
      console.error('스케줄 저장 중 오류:', error);
      alert(`스케줄 저장 중 오류가 발생했습니다: ${error}`);
    }
  };

  const [isContractCreating, setIsContractCreating] = useState(false);

  const handleContractComplete = async (agreementInfo: any) => {
    if (!selectedEstimate || !paymentData) return;

    // 중복 실행 방지
    if (isContractCreating) {
      console.log('계약 생성이 이미 진행 중입니다.');
      return;
    }

    setIsContractCreating(true);

    // 디버깅을 위한 로그 추가
    console.log('=== 계약 완료 프로세스 시작 ===');
    console.log('계약 완료 - paymentData:', paymentData);
    console.log('실측일자:', paymentData.measurementDate);
    console.log('시공일자:', paymentData.constructionDate);
    console.log('실측일자 타입:', typeof paymentData.measurementDate);
    console.log('실측일자 존재 여부:', !!paymentData.measurementDate);

    // 계약이 완료된 견적서를 승인한 견적서 목록에서 제거
    setEstimates(prevEstimates =>
      prevEstimates.filter(
        estimate => estimate.estimateNo !== selectedEstimate.estimateNo
      )
    );

    // saved_estimates에 status: '계약완료'로 갱신
    try {
      const savedEstimates = JSON.parse(
        localStorage.getItem('saved_estimates') || '[]'
      );
      const idx = savedEstimates.findIndex(
        (e: any) => e.estimateNo === selectedEstimate.estimateNo
      );
      if (idx !== -1) {
        savedEstimates[idx].status = '계약완료';
        localStorage.setItem('saved_estimates', JSON.stringify(savedEstimates));
      }
    } catch (e) {
      console.error('saved_estimates status 갱신 오류:', e);
    }

    const depositAmount = paymentData.depositAmount || 0;
    const discountedAmount =
      paymentData.discountedAmount || paymentData.totalAmount || 0;
    const remainingAmount = discountedAmount - depositAmount;

    // Final 견적서인지 확인 (estimateNo에 '-final'이 포함되어 있는지)
    const isFinalEstimate = selectedEstimate.estimateNo.includes('-final');
    console.log(
      'Final 견적서 여부:',
      isFinalEstimate,
      '견적번호:',
      selectedEstimate.estimateNo
    );

    // Final 견적서인 경우 기존 계약서 찾기
    let existingContract: Contract | null = null;
    if (isFinalEstimate) {
      // 원본 견적번호 추출 (예: E20250101-001-final → E20250101-001)
      const originalEstimateNo = selectedEstimate.estimateNo.replace(
        /-final.*$/,
        ''
      );
      console.log('원본 견적번호:', originalEstimateNo);

      // 기존 계약서 찾기
      existingContract =
        contracts.find(c => c.estimateNo === originalEstimateNo) || null;
      console.log('기존 계약서 찾기 결과:', existingContract);
    }

    // 계약번호 생성
    let contractNo: string;
    let contractId: number;

    if (isFinalEstimate && existingContract) {
      // Final 견적서이고 기존 계약서가 있으면 기존 계약번호 사용
      contractNo = existingContract.contractNo;
      contractId = existingContract.id;
      console.log('기존 계약서 업데이트:', contractNo);
    } else {
      // 새로운 계약서 생성
      const timestamp = Date.now();
      const existingContractNos = contracts.map(c => c.contractNo);
      let contractNumber = 1;
      contractNo = `C${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-${String(contractNumber).padStart(3, '0')}`;

      // 중복되지 않는 계약번호 찾기
      while (existingContractNos.includes(contractNo)) {
        contractNumber++;
        contractNo = `C${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-${String(contractNumber).padStart(3, '0')}`;
      }
      contractId = timestamp;
      console.log('새 계약서 생성:', contractNo);
    }

    const newContract: Contract = {
      id: contractId,
      contractNo: contractNo,
      estimateNo: selectedEstimate.estimateNo,
      contractDate: new Date().toISOString().split('T')[0],
      customerName: selectedEstimate.customerName,
      contact: selectedEstimate.contact || '',
      emergencyContact: selectedEstimate.emergencyContact || '',
      address: selectedEstimate.address || '',
      projectName: selectedEstimate.projectName,
      type: selectedEstimate.type || '',
      totalAmount: paymentData.totalAmount,
      discountedAmount: discountedAmount,
      depositAmount: depositAmount,
      remainingAmount: remainingAmount,
      paymentMethod: paymentData.paymentMethod,
      paymentDate: paymentData.paymentDate,
      status: 'signed',
      signatureData: agreementInfo.signatureData,
      agreementMethod: agreementInfo.agreementMethod,
      memo: paymentData.memo || '',
      measurementDate: paymentData.measurementDate,
      constructionDate: paymentData.constructionDate,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      rows: selectedEstimate.rows || [],
    };

    // Final 견적서인 경우 기존 계약서 업데이트, 아니면 새 계약서 추가
    if (isFinalEstimate && existingContract) {
      console.log('기존 계약서 업데이트 중...');
      setContracts(prev =>
        prev.map(contract =>
          contract.id === existingContract!.id ? newContract : contract
        )
      );
    } else {
      console.log('새 계약서 추가 중...');
      setContracts(prev => [...prev, newContract]);
    }
    setDialogOpen(false);

    // 주문관리로 이동하는 알림
    const alertMessage =
      isFinalEstimate && existingContract
        ? `✅ 계약이 성공적으로 업데이트되었습니다!\n\n📋 Final 견적서 기반으로 계약서가 업데이트되었습니다.\n\n📋 다음 단계:\n1. 주문관리에서 발주를 진행하세요\n2. 발주 완료 후 자동으로 배송관리로 이동됩니다\n\n💡 실측일정이 입력된 경우 "스케줄 저장" 버튼을 눌러 스케줄에 등록하세요.`
        : `✅ 계약이 성공적으로 생성되었습니다!\n\n📋 다음 단계:\n1. 주문관리에서 발주를 진행하세요\n2. 발주 완료 후 자동으로 배송관리로 이동됩니다\n\n💡 실측일정이 입력된 경우 "스케줄 저장" 버튼을 눌러 스케줄에 등록하세요.`;

    alert(alertMessage);

    // 계약 완료 후 계약 목록 탭으로 이동
    setActiveTab(0);

    // 새로 생성된 계약으로 스크롤
    setTimeout(() => {
      const element = document.getElementById(
        `contract-${newContract.contractNo}`
      );
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'center' });
        // 하이라이트 효과 추가
        element.style.backgroundColor = '#1b5e20';
        setTimeout(() => {
          element.style.backgroundColor = '#23272b';
        }, 2000);
      }
    }, 300);

    // 계약 생성 상태 리셋
    setIsContractCreating(false);
  };

  // 계약에서 주문관리로 이동하는 함수 (배송관리는 주문 완료 후 자동 생성됨)
  const navigateToOrderManagement = () => {
    // 주문관리 탭으로 이동하는 로직
    // 실제로는 상위 컴포넌트에서 탭 변경을 처리해야 함
    console.log('주문관리로 이동해야 합니다.');
  };

  // 계약에서 스케줄 생성 함수
  const createScheduleFromContract = async (
    contract: Contract,
    paymentData: any
  ) => {
    try {
      console.log('=== createScheduleFromContract 함수 시작 ===');
      console.log('전달받은 contract:', contract);
      console.log('전달받은 paymentData:', paymentData);

      // 실측일정이 있는 경우
      console.log('=== 실측일정 처리 시작 ===');
      console.log('paymentData.measurementDate:', paymentData.measurementDate);
      console.log('measurementDate 타입:', typeof paymentData.measurementDate);
      console.log('measurementDate 존재 여부:', !!paymentData.measurementDate);

      if (
        paymentData.measurementDate &&
        paymentData.measurementDate.trim() !== ''
      ) {
        console.log('실측일자 조건 통과 - 스케줄 생성 시작');

        // datetime-local 형식을 date와 time으로 분리
        const measurementDateTime = paymentData.measurementDate; // "2024-01-15T09:00" 형식
        let measurementDate = '';
        let measurementTime = '09:00';

        if (measurementDateTime && measurementDateTime.includes('T')) {
          const [datePart, timePart] = measurementDateTime.split('T');
          measurementDate = datePart; // "2024-01-15"
          measurementTime = timePart || '09:00'; // "09:00"
        } else if (measurementDateTime) {
          // T가 없는 경우 날짜만 있는 것으로 간주
          measurementDate = measurementDateTime;
          measurementTime = '09:00';
        }

        console.log('분리된 실측일자:', measurementDate);
        console.log('분리된 실측시간:', measurementTime);

        const navAddress = extractNavigationAddress(
          contract.address || paymentData.address || ''
        );
        const scheduleTitle = `실측 - ${navAddress}`;

        // 견적서 정보 가져오기 (Firebase에서 먼저 시도, 실패 시 localStorage 사용)
        let matchedEstimate = null;
        
        try {
          // Firebase에서 견적서 정보 가져오기
          const response = await fetch(`${API_BASE}/estimates?estimateNo=${contract.estimateNo}`);
          if (response.ok) {
            const estimates = await response.json();
            matchedEstimate = estimates.find((est: any) => est.estimateNo === contract.estimateNo);
            console.log('Firebase에서 견적서 정보 가져옴:', matchedEstimate);
          } else {
            console.log('Firebase에서 견적서를 찾을 수 없음, localStorage에서 시도');
          }
        } catch (error) {
          console.error('Firebase 견적서 조회 실패:', error);
        }
        
        // Firebase에서 찾지 못한 경우 localStorage에서 시도
        if (!matchedEstimate) {
          const savedEstimates = JSON.parse(
            localStorage.getItem('saved_estimates') || '[]'
          );
          matchedEstimate = savedEstimates.find(
            (est: any) => est.estimateNo === contract.estimateNo
          );
          console.log('localStorage에서 견적서 정보 가져옴:', matchedEstimate);
        }

        if (matchedEstimate && matchedEstimate.rows) {
          // 견적서 내용을 기반으로 실측 데이터 초기화
          const estimateRows = matchedEstimate.rows
            .filter((row: any) => row.space && row.productName)
            .map((row: any) => ({
              space: row.space,
              productName: row.productName,
              widthMM: row.widthMM,
              heightMM: row.heightMM,
            }));

          // 견적서 정보 구성
          const totalAmount =
            matchedEstimate.rows?.reduce(
              (sum: number, row: any) => sum + (row.totalPrice || 0),
              0
            ) || 0;
          const discountAmount = matchedEstimate.discountAmount || 0;
          const finalAmount = totalAmount - discountAmount;

          const estimateInfo = {
            estimateNo: matchedEstimate.estimateNo,
            customerName: matchedEstimate.customerName,
            customerContact:
              matchedEstimate.contact || matchedEstimate.customerContact || '-',
            customerAddress:
              matchedEstimate.address || matchedEstimate.customerAddress || '-',
            appointmentDate: measurementDate,
            appointmentTime: measurementTime,
            constructionDate: paymentData.constructionDate || '-',
            totalAmount,
            discountAmount,
            finalAmount,
            contractAmount: contract.depositAmount || 0,
            projectName:
              matchedEstimate.projectName || matchedEstimate.name || '-',
            projectType: matchedEstimate.type || '-',
            memo: contract.memo || '-',
          };

          // 실측 데이터 초기화
          const initialData = estimateRows.map((row: any) => ({
            space: row.space,
            productName: row.productName,
            estimateWidth: String(row.widthMM || ''),
            estimateHeight: String(row.heightMM || ''),
            measuredWidth: '',
            measuredHeight: '',
            lineDirection: '',
            lineLength: '',
            customLineLength: '',
            memo: '',
            showMemo: false,
          }));

          console.log('견적서 내용으로 실측 데이터 초기화:', initialData);

          // 실측 모달 열기
          const measurementEvent = {
            id: `schedule-${Date.now()}-measurement`,
            title: scheduleTitle,
            date: measurementDate,
            time: measurementTime,
            type: '실측',
            description: contract.projectName,
            customerName: contract.customerName,
            address: contract.address,
            contact: contract.contact,
            priority: '보통',
            status: '예정',
            estimateNo: contract.estimateNo,
            measurementData: initialData,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            createdBy: 'current_user',
          };

          // 실측일정을 스케줄에 저장
          try {
            console.log('실측일정 스케줄 저장 시작:', measurementEvent);

            const response = await fetch('https://us-central1-windowerp-3.cloudfunctions.net/schedules', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(measurementEvent),
            });

            console.log(
              '실측일정 저장 응답 상태:',
              response.status,
              response.statusText
            );

            if (!response.ok) {
              const errorText = await response.text();
              console.error(
                '실측일정 저장 실패:',
                response.status,
                response.statusText,
                errorText
              );
              alert(
                `실측일정 저장에 실패했습니다: ${response.status} ${response.statusText}`
              );
            } else {
              const result = await response.json();
              console.log('실측일정 저장 성공:', result);
              alert(
                `실측일정이 성공적으로 스케줄에 저장되었습니다!\n\n견적번호: ${contract.estimateNo}\n실측일자: ${measurementDate} ${measurementTime}\n제목: ${scheduleTitle}\n\n스케줄 페이지에서 확인하실 수 있습니다.`
              );
            }
          } catch (error) {
            console.error('실측일정 저장 중 네트워크 오류:', error);
            alert(`실측일정 저장 중 네트워크 오류가 발생했습니다: ${error}`);
          }
        } else {
          console.log('견적서를 찾을 수 없습니다:', contract.estimateNo);
          alert('견적서를 찾을 수 없어 실측 모달을 열 수 없습니다.');
        }
      } else {
        console.log('실측일자가 없거나 비어있어 스케줄을 생성하지 않습니다.');
      }
    } catch (error) {
      console.error('스케줄 생성 중 오류:', error);
    }
  };

  // 작업 아이콘 핸들러 함수들
  const handleViewClick = (contract: Contract) => {
    setSelectedContract(contract);
    setViewOnly(true);
    setEditViewDialogOpen(true);
  };

  const handleEditClick = (contract: Contract) => {
    setSelectedContract({ ...contract }); // 수정 시 원본이 바뀌지 않도록 복사본 생성
    setViewOnly(false);
    setEditViewDialogOpen(true);
  };

  const handleSaveContract = () => {
    if (selectedContract) {
      // 잔금(remainingAmount)은 할인후금액-계약금 공식으로 항상 재계산
      const depositAmount = selectedContract.depositAmount || 0;
      const discountedAmount =
        selectedContract.discountedAmount || selectedContract.totalAmount || 0;
      const remainingAmount = discountedAmount - depositAmount;
      setContracts(
        contracts.map(c =>
          c.id === selectedContract.id
            ? {
                ...selectedContract,
                remainingAmount,
              }
            : c
        )
      );
      setEditViewDialogOpen(false);
      setSelectedContract(null);
    }
  };

  const handleSaveContractAndSchedule = async () => {
    if (!selectedContract) return;

    // 계약 정보 저장
    const depositAmount = selectedContract.depositAmount || 0;
    const discountedAmount =
      selectedContract.discountedAmount || selectedContract.totalAmount || 0;
    const remainingAmount = discountedAmount - depositAmount;
    
    const updatedContract = {
      ...selectedContract,
      remainingAmount,
    };

    setContracts(
      contracts.map(c =>
        c.id === selectedContract.id ? updatedContract : c
      )
    );

                        // 실측일자가 있는 경우 스케줄 저장
          if (selectedContract.measurementDate && selectedContract.measurementDate.trim() !== '') {
        try {
        console.log('=== 계약 수정 시 스케줄 저장 시작 ===');
        console.log('계약 정보:', updatedContract);

        // datetime-local 형식을 date와 time으로 분리
        const measurementDateTime = selectedContract.measurementDate;
        let measurementDate = '';
        let measurementTime = '09:00';

        if (measurementDateTime && measurementDateTime.includes('T')) {
          const [datePart, timePart] = measurementDateTime.split('T');
          measurementDate = datePart;
          measurementTime = timePart || '09:00';
        } else if (measurementDateTime) {
          measurementDate = measurementDateTime;
          measurementTime = '09:00';
        }

        console.log('분리된 실측일자:', measurementDate);
        console.log('분리된 실측시간:', measurementTime);

        const navAddress = extractNavigationAddress(selectedContract.address || '');
        const scheduleTitle = `실측 - ${navAddress}`;

        // 견적서 정보 가져오기 (Firebase에서 먼저 시도, 실패 시 localStorage 사용)
        let matchedEstimate = null;
        
        try {
          const response = await fetch(`${API_BASE}/estimates?estimateNo=${selectedContract.estimateNo}`);
          if (response.ok) {
            const estimates = await response.json();
            matchedEstimate = estimates.find((est: any) => est.estimateNo === selectedContract.estimateNo);
            console.log('Firebase에서 견적서 정보 가져옴:', matchedEstimate);
          } else {
            console.log('Firebase에서 견적서를 찾을 수 없음, localStorage에서 시도');
          }
        } catch (error) {
          console.error('Firebase 견적서 조회 실패:', error);
        }
        
        if (!matchedEstimate) {
          const savedEstimates = JSON.parse(
            localStorage.getItem('saved_estimates') || '[]'
          );
          matchedEstimate = savedEstimates.find(
            (est: any) => est.estimateNo === selectedContract.estimateNo
          );
          console.log('localStorage에서 견적서 정보 가져옴:', matchedEstimate);
        }

        if (matchedEstimate && matchedEstimate.rows) {
          // 견적서 내용을 기반으로 실측 데이터 초기화
          const estimateRows = matchedEstimate.rows
            .filter((row: any) => row.space && row.productName)
            .map((row: any) => ({
              space: row.space,
              productName: row.productName,
              widthMM: row.widthMM,
              heightMM: row.heightMM,
            }));

          // 실측 데이터 초기화
          const initialData = estimateRows.map((row: any) => ({
            space: row.space,
            productName: row.productName,
            estimateWidth: String(row.widthMM || ''),
            estimateHeight: String(row.heightMM || ''),
            measuredWidth: '',
            measuredHeight: '',
            lineDirection: '',
            lineLength: '',
            customLineLength: '',
            memo: '',
            showMemo: false,
          }));

          console.log('견적서 내용으로 실측 데이터 초기화:', initialData);

          // 기존 스케줄에서 해당 견적번호의 실측일정 찾기
          let existingScheduleId = null;
          let existingSchedule = null;
          let isDateChanged = false;
          let oldDate = '';
          let oldTime = '';
          
          try {
            const scheduleResponse = await fetch('https://us-central1-windowerp-3.cloudfunctions.net/schedules');
            if (scheduleResponse.ok) {
              const schedules = await scheduleResponse.json();
              existingSchedule = schedules.find((schedule: any) => 
                schedule.estimateNo === selectedContract.estimateNo && schedule.type === '실측'
              );
              if (existingSchedule) {
                existingScheduleId = existingSchedule.id;
                oldDate = existingSchedule.date;
                oldTime = existingSchedule.time;
                
                // 날짜가 변경되었는지 확인
                if (oldDate !== measurementDate || oldTime !== measurementTime) {
                  isDateChanged = true;
                }
                
                console.log('기존 실측 스케줄 발견:', existingScheduleId);
                console.log('기존 날짜:', oldDate, oldTime);
                console.log('새 날짜:', measurementDate, measurementTime);
                console.log('날짜 변경 여부:', isDateChanged);
                
                // 실측일자 변경 확인
                if (isDateChanged) {
                  const confirmMessage = `실측일자가 변경되었습니다.\n\n기존: ${oldDate} ${oldTime}\n변경: ${measurementDate} ${measurementTime}\n\n기존 실측 데이터는 보존됩니다.\n계속하시겠습니까?`;
                  if (!window.confirm(confirmMessage)) {
                    setEditViewDialogOpen(false);
                    setSelectedContract(null);
                    return;
                  }
                }
              }
            }
          } catch (error) {
            console.error('기존 스케줄 조회 실패:', error);
          }

          // 실측일정 생성/업데이트
          const measurementEvent = {
            id: existingScheduleId || `schedule-${Date.now()}-measurement`,
            title: scheduleTitle,
            date: measurementDate,
            time: measurementTime,
            type: '실측',
            description: selectedContract.projectName,
            customerName: selectedContract.customerName,
            address: selectedContract.address,
            contact: selectedContract.contact,
            priority: '보통',
            status: '예정',
            estimateNo: selectedContract.estimateNo,
            // 기존 실측 데이터가 있으면 보존, 없으면 초기화
            measurementData: existingSchedule && existingSchedule.measurementData 
              ? existingSchedule.measurementData 
              : initialData,
            createdAt: existingScheduleId ? existingSchedule.createdAt : new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            createdBy: existingScheduleId ? existingSchedule.createdBy : 'current_user',
          };

          // 실측일정을 스케줄에 저장/업데이트
          console.log('실측일정 스케줄 저장/업데이트 시작:', measurementEvent);

          let method = existingScheduleId ? 'PUT' : 'POST';
          let url = existingScheduleId 
            ? `https://us-central1-windowerp-3.cloudfunctions.net/schedules/${existingScheduleId}`
            : 'https://us-central1-windowerp-3.cloudfunctions.net/schedules';

          // id가 올바르지 않으면 POST로 대체
          if (method === 'PUT' && (!existingScheduleId || typeof existingScheduleId !== 'string' || existingScheduleId.trim() === '')) {
            alert('기존 실측일정의 ID가 올바르지 않습니다. 새로 생성합니다.');
            method = 'POST';
            url = 'https://us-central1-windowerp-3.cloudfunctions.net/schedules';
            if (measurementEvent.id) delete measurementEvent.id;
          }

          const response = await fetch(url, {
            method,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(measurementEvent),
          });

          console.log(
            '실측일정 저장/업데이트 응답 상태:',
            response.status,
            response.statusText
          );

          if (!response.ok) {
            const errorText = await response.text();
            console.error(
              '실측일정 저장/업데이트 실패:',
              response.status,
              response.statusText,
              errorText
            );
            alert(
              `실측일정 저장에 실패했습니다: ${response.status} ${response.statusText}`
            );
          } else {
            const result = await response.json();
            console.log('실측일정 저장/업데이트 성공:', result);
            
            let message = '';
            if (existingScheduleId) {
              if (isDateChanged) {
                message = `계약 정보와 실측일정이 성공적으로 업데이트되었습니다!\n\n견적번호: ${selectedContract.estimateNo}\n실측일자 변경: ${oldDate} ${oldTime} → ${measurementDate} ${measurementTime}\n제목: ${scheduleTitle}\n\n기존 실측 데이터는 보존되었습니다.\n스케줄 페이지에서 확인하실 수 있습니다.`;
              } else {
                message = `계약 정보와 실측일정이 성공적으로 업데이트되었습니다!\n\n견적번호: ${selectedContract.estimateNo}\n실측일자: ${measurementDate} ${measurementTime}\n제목: ${scheduleTitle}\n\n스케줄 페이지에서 확인하실 수 있습니다.`;
              }
            } else {
              message = `계약 정보와 실측일정이 성공적으로 저장되었습니다!\n\n견적번호: ${selectedContract.estimateNo}\n실측일자: ${measurementDate} ${measurementTime}\n제목: ${scheduleTitle}\n\n스케줄 페이지에서 확인하실 수 있습니다.`;
            }
            
            alert(message);
          }
        } else {
          console.log('견적서를 찾을 수 없습니다:', selectedContract.estimateNo);
          alert('견적서를 찾을 수 없어 실측 스케줄을 생성할 수 없습니다.');
        }
      } catch (error) {
        console.error('스케줄 저장 중 오류:', error);
        alert(`스케줄 저장 중 오류가 발생했습니다: ${error}`);
      }
    } else {
      // 실측일자가 없는 경우 계약 정보만 저장
      alert('계약 정보가 성공적으로 저장되었습니다.');
    }

    setEditViewDialogOpen(false);
    setSelectedContract(null);
  };

  // 출력 기능 핸들러 함수들
  const handlePrintClick = (contract: Contract) => {
    setSelectedContractForPrint(contract);
    setContractTemplateOpen(true);
  };

  const handlePdfClick = async (contract: Contract) => {
    if (contractPrintRef.current) {
      try {
        const canvas = await html2canvas(contractPrintRef.current, {
          scale: 2,
          useCORS: true,
          allowTaint: true,
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

        pdf.save(`${contract.contractNo}.pdf`);
      } catch (error) {
        console.error('PDF 생성 오류:', error);
        alert('PDF 생성 중 오류가 발생했습니다.');
      }
    }
  };

  const handleJpgClick = async (contract: Contract) => {
    if (contractPrintRef.current) {
      try {
        const canvas = await html2canvas(contractPrintRef.current, {
          scale: 2,
          useCORS: true,
          allowTaint: true,
        });

        const link = document.createElement('a');
        link.download = `${contract.contractNo}.jpg`;
        link.href = canvas.toDataURL('image/jpeg', 0.8);
        link.click();
      } catch (error) {
        console.error('JPG 생성 오류:', error);
        alert('JPG 생성 중 오류가 발생했습니다.');
      }
    }
  };

  const handleShareClick = (contract: Contract) => {
    const shareData = {
      title: `계약서 - ${contract.contractNo}`,
      text: `${contract.customerName}님의 계약서입니다.`,
      url: window.location.href,
    };

    if (navigator.share) {
      navigator.share(shareData);
    } else {
      // 공유 API가 지원되지 않는 경우 클립보드에 복사
      const contractInfo = `
계약서 정보:
계약번호: ${contract.contractNo}
고객명: ${contract.customerName}
계약일자: ${contract.contractDate}
총금액: ${(contract.totalAmount || 0).toLocaleString()}원
      `.trim();

      navigator.clipboard
        .writeText(contractInfo)
        .then(() => {
          alert('계약 정보가 클립보드에 복사되었습니다.');
        })
        .catch(() => {
          alert('클립보드 복사에 실패했습니다.');
        });
    }
  };

  const handleDeleteClick = (contract: Contract) => {
    setContractToDelete(contract);
    setDeleteDialogOpen(true);
  };

  const handleConfirmDelete = () => {
    if (contractToDelete) {
      setContracts(contracts.filter(c => c.id !== contractToDelete.id));
      setDeleteDialogOpen(false);
      setContractToDelete(null);
    }
  };

  const handleDeleteApprovedEstimate = (estimateNo: string) => {
    if (
      window.confirm(
        `'${estimateNo}' 견적서를 승인 목록에서 삭제하시겠습니까? 이 작업은 계약 대기 목록에서만 제거됩니다.`
      )
    ) {
      setEstimates(prev => prev.filter(e => e.estimateNo !== estimateNo));
    }
  };

  const filteredContracts = contracts.filter(contract => {
    const matchesSearch =
      contract.contractNo?.includes(searchTerm) ||
      contract.customerName?.includes(searchTerm) ||
      contract.projectName?.includes(searchTerm);
    const matchesStatus =
      statusFilter === 'all' || contract.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  function extractNavigationAddress(address: string) {
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
  }

  return (
    <Box sx={{ p: 2 }}>
      {/* 헤더 */}
      <Box sx={{ mb: 3 }}>
        <Typography
          variant="h4"
          sx={{ color: 'var(--text-color)', fontWeight: 'bold', mb: 1 }}
        >
          계약 관리
        </Typography>
        <Typography variant="body1" sx={{ color: 'var(--text-secondary-color)' }}>
          견적서를 기반으로 계약을 생성하고 관리합니다.
        </Typography>
      </Box>

      {/* 검색 및 필터 */}
              <Paper sx={{ p: isMobile ? 3 : 2, mb: 2, backgroundColor: 'var(--surface-color)', borderRadius: 1 }}>
        <Grid container spacing={isMobile ? 3 : 2} alignItems="center">
          <Grid item xs={12} md={4}>
            <TextField
              fullWidth
              label="계약 검색"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              placeholder="계약번호, 고객명, 프로젝트명으로 검색"
              size={isMobile ? "medium" : "small"}
              sx={{
                input: { 
                  color: 'var(--text-color)',
                  fontSize: isMobile ? 16 : 14
                },
                label: { 
                  color: 'var(--text-secondary-color)',
                  fontSize: isMobile ? 16 : 14
                },
                '& .MuiOutlinedInput-root': {
                  '& fieldset': { borderColor: 'var(--border-color)' },
                  '&:hover fieldset': { borderColor: 'var(--hover-color)' },
                  '&.Mui-focused fieldset': { borderColor: 'var(--primary-color)' },
                },
              }}
            />
          </Grid>
          <Grid item xs={12} md={3}>
            <FormControl fullWidth size={isMobile ? "medium" : "small"}>
              <InputLabel sx={{ 
                color: 'var(--text-secondary-color)',
                fontSize: isMobile ? 16 : 14
              }}>상태 필터</InputLabel>
              <Select
                value={statusFilter}
                onChange={(e: SelectChangeEvent) =>
                  setStatusFilter(e.target.value)
                }
                sx={{
                  color: 'var(--text-color)',
                  fontSize: isMobile ? 16 : 14,
                  '& .MuiOutlinedInput-notchedOutline': {
                    borderColor: 'var(--border-color)',
                  },
                  '&:hover .MuiOutlinedInput-notchedOutline': {
                    borderColor: 'var(--hover-color)',
                  },
                }}
              >
                <MenuItem value="all" sx={{ fontSize: isMobile ? 16 : 14 }}>전체</MenuItem>
                <MenuItem value="draft" sx={{ fontSize: isMobile ? 16 : 14 }}>작성중</MenuItem>
                <MenuItem value="pending" sx={{ fontSize: isMobile ? 16 : 14 }}>대기중</MenuItem>
                <MenuItem value="signed" sx={{ fontSize: isMobile ? 16 : 14 }}>계약완료</MenuItem>
                <MenuItem value="completed" sx={{ fontSize: isMobile ? 16 : 14 }}>완료</MenuItem>
                <MenuItem value="cancelled" sx={{ fontSize: isMobile ? 16 : 14 }}>취소</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} md={5}>
            <Box sx={{ display: 'flex', gap: isMobile ? 2 : 1, justifyContent: 'flex-end' }}>
              <Button
                variant="contained"
                size={isMobile ? "large" : "small"}
                startIcon={<AddIcon />}
                onClick={() => setDialogOpen(true)}
                sx={{
                  backgroundColor: 'var(--primary-color)',
                  color: '#fff',
                  '&:hover': { backgroundColor: 'var(--hover-color)' },
                  minWidth: isMobile ? 120 : 100,
                  fontSize: isMobile ? 16 : 13,
                  py: isMobile ? 1.5 : 0.5,
                  px: isMobile ? 3 : 1.5,
                }}
              >
                새 계약
              </Button>
            </Box>
          </Grid>
        </Grid>
      </Paper>

      {/* 탭 */}
      <Box sx={{ mb: 2 }}>
        <Tabs
          value={activeTab}
          onChange={(e, v) => setActiveTab(v)}
          sx={{
            backgroundColor: '#f5f5f5',
            color: 'var(--text-color)',
            borderRadius: 1,
            '& .MuiTab-root': {
              color: 'var(--text-secondary-color)',
              fontSize: isMobile ? 16 : 14,
              minHeight: isMobile ? 56 : 48,
              '&.Mui-selected': { 
                color: 'var(--primary-color)',
                fontWeight: 'bold'
              },
            },
            '& .MuiTabs-indicator': {
              backgroundColor: 'var(--primary-color)',
            },
          }}
        >
          <Tab label="계약 목록" />
          <Tab label="승인한 견적서" />
        </Tabs>
      </Box>

      {/* 계약 목록 탭 */}
      {activeTab === 0 && (
        <Paper sx={{ backgroundColor: 'var(--surface-color)' }}>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow sx={{ backgroundColor: 'var(--background-color)' }}>
                  <TableCell sx={{ 
                    color: 'var(--text-color)', 
                    borderColor: 'var(--border-color)',
                    fontSize: isMobile ? 16 : 14,
                    py: isMobile ? 2 : 1
                  }}>
                    계약일자
                  </TableCell>
                  <TableCell sx={{ 
                    color: 'var(--text-color)', 
                    borderColor: 'var(--border-color)',
                    fontSize: isMobile ? 16 : 14,
                    py: isMobile ? 2 : 1
                  }}>
                    계약번호
                  </TableCell>
                  <TableCell sx={{ 
                    color: 'var(--text-color)', 
                    borderColor: 'var(--border-color)',
                    fontSize: isMobile ? 16 : 14,
                    py: isMobile ? 2 : 1
                  }}>
                    견적번호
                  </TableCell>
                  <TableCell sx={{ 
                    color: 'var(--text-color)', 
                    borderColor: 'var(--border-color)',
                    fontSize: isMobile ? 16 : 14,
                    py: isMobile ? 2 : 1
                  }}>
                    고객명
                  </TableCell>
                  <TableCell sx={{ 
                    color: 'var(--text-color)', 
                    borderColor: 'var(--border-color)',
                    fontSize: isMobile ? 16 : 14,
                    py: isMobile ? 2 : 1
                  }}>
                    전화번호
                  </TableCell>
                  <TableCell sx={{ 
                    color: 'var(--text-color)', 
                    borderColor: 'var(--border-color)',
                    fontSize: isMobile ? 16 : 14,
                    py: isMobile ? 2 : 1
                  }}>
                    프로젝트명
                  </TableCell>
                  <TableCell sx={{ 
                    color: 'var(--text-color)', 
                    borderColor: 'var(--border-color)',
                    fontSize: isMobile ? 16 : 14,
                    py: isMobile ? 2 : 1
                  }}>
                    주소
                  </TableCell>
                  <TableCell sx={{ 
                    color: 'var(--text-color)', 
                    borderColor: 'var(--border-color)',
                    fontSize: isMobile ? 16 : 14,
                    py: isMobile ? 2 : 1
                  }}>
                    소비자금액
                  </TableCell>
                  <TableCell sx={{ 
                    color: 'var(--text-color)', 
                    borderColor: 'var(--border-color)',
                    fontSize: isMobile ? 16 : 14,
                    py: isMobile ? 2 : 1
                  }}>
                    할인후금액
                  </TableCell>
                  <TableCell sx={{ 
                    color: 'var(--text-color)', 
                    borderColor: 'var(--border-color)',
                    fontSize: isMobile ? 16 : 14,
                    py: isMobile ? 2 : 1
                  }}>
                    계약금
                  </TableCell>
                  <TableCell sx={{ 
                    color: 'var(--text-color)', 
                    borderColor: 'var(--border-color)',
                    fontSize: isMobile ? 16 : 14,
                    py: isMobile ? 2 : 1
                  }}>
                    잔금
                  </TableCell>
                  <TableCell sx={{ 
                    color: 'var(--text-color)', 
                    borderColor: 'var(--border-color)',
                    fontSize: isMobile ? 16 : 14,
                    py: isMobile ? 2 : 1
                  }}>
                    상태
                  </TableCell>
                  <TableCell sx={{ 
                    color: 'var(--text-color)', 
                    borderColor: 'var(--border-color)',
                    fontSize: isMobile ? 16 : 14,
                    py: isMobile ? 2 : 1
                  }}>
                    작업
                  </TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredContracts.map(contract => (
                  <TableRow
                    key={contract.id}
                    id={`contract-${contract.contractNo}`}
                    hover
                    sx={{
                      backgroundColor: 'var(--surface-color)',
                      '&:hover': { backgroundColor: 'var(--hover-color)' },
                      color: 'var(--text-color)',
                    }}
                  >
                    <TableCell
                      sx={{ 
                        color: 'var(--text-color)', 
                        borderColor: 'var(--border-color)',
                        fontSize: isMobile ? 16 : 14,
                        py: isMobile ? 2 : 1
                      }}
                    >
                      {new Date(contract.contractDate).toLocaleDateString()}
                    </TableCell>
                    <TableCell
                      sx={{ 
                        color: 'var(--text-color)', 
                        borderColor: 'var(--border-color)',
                        fontSize: isMobile ? 16 : 14,
                        py: isMobile ? 2 : 1
                      }}
                    >
                      {contract.contractNo}
                    </TableCell>
                    <TableCell
                      sx={{ 
                        color: 'var(--text-color)', 
                        borderColor: 'var(--border-color)',
                        fontSize: isMobile ? 16 : 14,
                        py: isMobile ? 2 : 1
                      }}
                    >
                      {contract.estimateNo}
                    </TableCell>
                    <TableCell
                      sx={{ 
                        color: 'var(--text-color)', 
                        borderColor: 'var(--border-color)',
                        fontSize: isMobile ? 16 : 14,
                        py: isMobile ? 2 : 1
                      }}
                    >
                      {contract.customerName}
                    </TableCell>
                    <TableCell
                      sx={{ 
                        color: 'var(--text-color)', 
                        borderColor: 'var(--border-color)',
                        fontSize: isMobile ? 16 : 14,
                        py: isMobile ? 2 : 1
                      }}
                    >
                      {contract.contact}
                    </TableCell>
                    <TableCell
                      sx={{ 
                        color: 'var(--text-color)', 
                        borderColor: 'var(--border-color)',
                        fontSize: isMobile ? 16 : 14,
                        py: isMobile ? 2 : 1
                      }}
                    >
                      {contract.projectName}
                    </TableCell>
                    <TableCell
                      sx={{ 
                        color: 'var(--text-color)', 
                        borderColor: 'var(--border-color)',
                        fontSize: isMobile ? 16 : 14,
                        py: isMobile ? 2 : 1
                      }}
                    >
                      {contract.address}
                    </TableCell>
                    <TableCell
                      sx={{ 
                        color: 'var(--text-color)', 
                        borderColor: 'var(--border-color)',
                        fontSize: isMobile ? 16 : 14,
                        py: isMobile ? 2 : 1
                      }}
                    >
                      {(contract.totalAmount || 0).toLocaleString()}원
                    </TableCell>
                    <TableCell
                      sx={{ 
                        color: 'var(--text-color)', 
                        borderColor: 'var(--border-color)',
                        fontSize: isMobile ? 16 : 14,
                        py: isMobile ? 2 : 1
                      }}
                    >
                      {(contract.discountedAmount || 0).toLocaleString()}원
                    </TableCell>
                    <TableCell
                      sx={{ 
                        color: 'var(--text-color)', 
                        borderColor: 'var(--border-color)',
                        fontSize: isMobile ? 16 : 14,
                        py: isMobile ? 2 : 1
                      }}
                    >
                      {(contract.depositAmount || 0).toLocaleString()}원
                    </TableCell>
                    <TableCell
                      sx={{ 
                        color: 'var(--text-color)', 
                        borderColor: 'var(--border-color)',
                        fontSize: isMobile ? 16 : 14,
                        py: isMobile ? 2 : 1
                      }}
                    >
                      {(contract.remainingAmount || 0).toLocaleString()}원
                    </TableCell>
                    <TableCell sx={{ borderColor: 'var(--border-color)' }}>
                      <Chip
                        label={getStatusText(contract.status)}
                        color={getStatusColor(contract.status) as any}
                        size={isMobile ? "medium" : "small"}
                        sx={{ 
                          fontSize: isMobile ? 14 : '0.75rem',
                          minHeight: isMobile ? 32 : 24
                        }}
                      />
                    </TableCell>
                    <TableCell sx={{ borderColor: 'var(--border-color)' }}>
                      <Box sx={{ display: 'flex', gap: isMobile ? 1 : 0.5 }}>
                        <IconButton
                          size={isMobile ? "medium" : "small"}
                          sx={{ 
                            color: '#0091ea',
                            minWidth: isMobile ? 48 : 32,
                            minHeight: isMobile ? 48 : 32
                          }}
                          onClick={() => handleViewClick(contract)}
                        >
                          <ViewIcon fontSize={isMobile ? "medium" : "small"} />
                        </IconButton>
                        <IconButton
                          size={isMobile ? "medium" : "small"}
                          sx={{ 
                            color: '#ff9800',
                            minWidth: isMobile ? 48 : 32,
                            minHeight: isMobile ? 48 : 32
                          }}
                          onClick={() => handleEditClick(contract)}
                        >
                          <EditIcon fontSize={isMobile ? "medium" : "small"} />
                        </IconButton>
                        <IconButton
                          size={isMobile ? "medium" : "small"}
                          sx={{ 
                            color: '#4caf50',
                            minWidth: isMobile ? 48 : 32,
                            minHeight: isMobile ? 48 : 32
                          }}
                          onClick={() => handlePrintClick(contract)}
                        >
                          <PrintIcon fontSize={isMobile ? "medium" : "small"} />
                        </IconButton>
                        <IconButton
                          size={isMobile ? "medium" : "small"}
                          sx={{ 
                            color: '#f44336',
                            minWidth: isMobile ? 48 : 32,
                            minHeight: isMobile ? 48 : 32
                          }}
                          onClick={() => handleDeleteClick(contract)}
                        >
                          <DeleteIcon fontSize={isMobile ? "medium" : "small"} />
                        </IconButton>
                        <IconButton
                          size={isMobile ? "medium" : "small"}
                          sx={{ 
                            color: '#9c27b0',
                            minWidth: isMobile ? 48 : 32,
                            minHeight: isMobile ? 48 : 32
                          }}
                          onClick={event => {
                            setSelectedContract(contract);
                            setAnchorEl(event.currentTarget);
                          }}
                        >
                          <MoreVertIcon fontSize={isMobile ? "medium" : "small"} />
                        </IconButton>
                      </Box>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Paper>
      )}

      {/* 견적서 목록 탭 */}
      {activeTab === 1 && (
        <Paper sx={{ backgroundColor: 'var(--surface-color)' }}>
          <Box
            sx={{
              p: 2,
              borderBottom: '1px solid var(--border-color)',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}
          >
            <Typography variant="h6" sx={{ color: 'var(--text-color)' }}>
              승인한 견적서
            </Typography>
            <Button
              variant="outlined"
              size={isMobile ? "large" : "small"}
              startIcon={<SearchIcon />}
              onClick={refreshEstimates}
              sx={{
                color: 'var(--text-secondary-color)',
                borderColor: 'var(--border-color)',
                '&:hover': {
                  backgroundColor: 'var(--hover-color)',
                  borderColor: 'var(--primary-color)',
                },
                minWidth: isMobile ? 120 : 80,
                fontSize: isMobile ? 16 : 13,
                py: isMobile ? 1.5 : 0.5,
                px: isMobile ? 3 : 1.5,
              }}
            >
              새로고침
            </Button>
          </Box>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow sx={{ backgroundColor: 'var(--background-color)' }}>
                  <TableCell sx={{ 
                    color: 'var(--text-color)', 
                    borderColor: 'var(--border-color)',
                    fontSize: isMobile ? 16 : 14,
                    py: isMobile ? 2 : 1
                  }}>
                    견적번호
                  </TableCell>
                  <TableCell sx={{ 
                    color: 'var(--text-color)', 
                    borderColor: 'var(--border-color)',
                    fontSize: isMobile ? 16 : 14,
                    py: isMobile ? 2 : 1
                  }}>
                    견적일자
                  </TableCell>
                  <TableCell sx={{ 
                    color: 'var(--text-color)', 
                    borderColor: 'var(--border-color)',
                    fontSize: isMobile ? 16 : 14,
                    py: isMobile ? 2 : 1
                  }}>
                    고객명
                  </TableCell>
                  <TableCell sx={{ 
                    color: 'var(--text-color)', 
                    borderColor: 'var(--border-color)',
                    fontSize: isMobile ? 16 : 14,
                    py: isMobile ? 2 : 1
                  }}>
                    연락처
                  </TableCell>
                  <TableCell sx={{ 
                    color: 'var(--text-color)', 
                    borderColor: 'var(--border-color)',
                    fontSize: isMobile ? 16 : 14,
                    py: isMobile ? 2 : 1
                  }}>
                    주소
                  </TableCell>
                  <TableCell sx={{ 
                    color: 'var(--text-color)', 
                    borderColor: 'var(--border-color)',
                    fontSize: isMobile ? 16 : 14,
                    py: isMobile ? 2 : 1
                  }}>
                    포함제품
                  </TableCell>
                  <TableCell sx={{ 
                    color: 'var(--text-color)', 
                    borderColor: 'var(--border-color)',
                    fontSize: isMobile ? 16 : 14,
                    py: isMobile ? 2 : 1
                  }}>
                    총금액
                  </TableCell>
                  <TableCell sx={{ 
                    color: 'var(--text-color)', 
                    borderColor: 'var(--border-color)',
                    fontSize: isMobile ? 16 : 14,
                    py: isMobile ? 2 : 1
                  }}>
                    할인후금액
                  </TableCell>
                  <TableCell sx={{ 
                    color: 'var(--text-color)', 
                    borderColor: 'var(--border-color)',
                    fontSize: isMobile ? 16 : 14,
                    py: isMobile ? 2 : 1
                  }}>
                    작업상태
                  </TableCell>
                  <TableCell sx={{ 
                    color: 'var(--text-color)', 
                    borderColor: 'var(--border-color)',
                    fontSize: isMobile ? 16 : 14,
                    py: isMobile ? 2 : 1
                  }}>
                    작업
                  </TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {estimates.map(estimate => (
                  <TableRow
                    key={estimate.id}
                    hover
                    sx={{
                      backgroundColor: 'var(--surface-color)',
                      '&:hover': { backgroundColor: 'var(--hover-color)' },
                      color: 'var(--text-color)',
                    }}
                  >
                    <TableCell
                      sx={{ 
                        color: 'var(--text-color)', 
                        borderColor: 'var(--border-color)',
                        fontSize: isMobile ? 16 : 14,
                        py: isMobile ? 2 : 1
                      }}
                    >
                      {estimate.estimateNo}
                    </TableCell>
                    <TableCell
                      sx={{ 
                        color: 'var(--text-color)', 
                        borderColor: 'var(--border-color)',
                        fontSize: isMobile ? 16 : 14,
                        py: isMobile ? 2 : 1
                      }}
                    >
                      {new Date(estimate.estimateDate).toLocaleDateString()}
                    </TableCell>
                    <TableCell
                      sx={{ 
                        color: 'var(--text-color)', 
                        borderColor: 'var(--border-color)',
                        fontSize: isMobile ? 16 : 14,
                        py: isMobile ? 2 : 1
                      }}
                    >
                      {estimate.customerName}
                    </TableCell>
                    <TableCell
                      sx={{ 
                        color: 'var(--text-color)', 
                        borderColor: 'var(--border-color)',
                        fontSize: isMobile ? 16 : 14,
                        py: isMobile ? 2 : 1
                      }}
                    >
                      {estimate.contact}
                    </TableCell>
                    <TableCell
                      sx={{ 
                        color: 'var(--text-color)', 
                        borderColor: 'var(--border-color)',
                        fontSize: isMobile ? 16 : 14,
                        py: isMobile ? 2 : 1
                      }}
                    >
                      {estimate.address || '-'}
                    </TableCell>
                    <TableCell
                      sx={{ 
                        color: 'var(--text-color)', 
                        borderColor: 'var(--border-color)',
                        fontSize: isMobile ? 16 : 14,
                        py: isMobile ? 2 : 1
                      }}
                    >
                      {estimate.products}
                    </TableCell>
                    <TableCell
                      sx={{ 
                        color: 'var(--text-color)', 
                        borderColor: 'var(--border-color)',
                        fontSize: isMobile ? 16 : 14,
                        py: isMobile ? 2 : 1
                      }}
                    >
                      {(estimate.totalAmount || 0).toLocaleString()}원
                    </TableCell>
                    <TableCell
                      sx={{ 
                        color: 'var(--text-color)', 
                        borderColor: 'var(--border-color)',
                        fontSize: isMobile ? 16 : 14,
                        py: isMobile ? 2 : 1
                      }}
                    >
                      {(estimate.discountedAmount || 0).toLocaleString()}원
                    </TableCell>
                    <TableCell sx={{ borderColor: 'var(--border-color)' }}>
                      {isEstimateContracted(estimate.estimateNo) ? (
                        <Chip
                          label="계약완료"
                          color="success"
                          size={isMobile ? "medium" : "small"}
                          sx={{ 
                            fontSize: isMobile ? 14 : '0.75rem',
                            minHeight: isMobile ? 32 : 24
                          }}
                        />
                      ) : (
                        <Chip
                          label="견적완료"
                          color="primary"
                          size={isMobile ? "medium" : "small"}
                          sx={{ 
                            fontSize: isMobile ? 14 : '0.75rem',
                            minHeight: isMobile ? 32 : 24
                          }}
                        />
                      )}
                    </TableCell>
                    <TableCell sx={{ borderColor: 'var(--border-color)' }}>
                      {isEstimateContracted(estimate.estimateNo) ? (
                        <Button
                          variant="contained"
                          size={isMobile ? "large" : "small"}
                          onClick={() => {
                            const contract = getContractByEstimate(
                              estimate.estimateNo
                            );
                            if (contract) {
                              scrollToContract(contract.contractNo);
                            }
                          }}
                          sx={{
                            backgroundColor: '#4caf50',
                            color: '#fff',
                            '&:hover': { backgroundColor: '#388e3c' },
                            fontSize: isMobile ? 16 : 12,
                            py: isMobile ? 1.5 : 0.5,
                            px: isMobile ? 3 : 1,
                            minWidth: isMobile ? 100 : 80,
                          }}
                        >
                          계약보기
                        </Button>
                      ) : (
                        <Button
                          variant="contained"
                          size={isMobile ? "large" : "small"}
                          startIcon={<ContractIcon />}
                          onClick={() => handleCreateContract(estimate)}
                          sx={{
                            backgroundColor: '#0091ea',
                            color: '#fff',
                            '&:hover': { backgroundColor: '#0064b7' },
                            fontSize: isMobile ? 16 : 12,
                            py: isMobile ? 1.5 : 0.5,
                            px: isMobile ? 3 : 1,
                            minWidth: isMobile ? 120 : 100,
                          }}
                        >
                          계약 생성
                        </Button>
                      )}
                      <IconButton
                        size={isMobile ? "medium" : "small"}
                        color="error"
                        sx={{ 
                          ml: isMobile ? 2 : 1,
                          minWidth: isMobile ? 48 : 32,
                          minHeight: isMobile ? 48 : 32
                        }}
                        onClick={() =>
                          handleDeleteApprovedEstimate(estimate.estimateNo)
                        }
                      >
                        <DeleteIcon fontSize={isMobile ? "medium" : "small"} />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Paper>
      )}

      {/* 계약 생성 다이얼로그 */}
      <Dialog
        open={dialogOpen}
        onClose={() => {
          setDialogOpen(false);
          setCurrentStep(1);
          if (!selectedEstimate) {
            setSelectedEstimate(null);
          }
        }}
        maxWidth="md"
        fullWidth
        fullScreen={isMobile}
        PaperProps={{
          sx: {
            backgroundColor: 'var(--surface-color)',
            color: 'var(--text-color)',
          },
        }}
      >
        <DialogTitle sx={{ backgroundColor: 'var(--surface-color)', color: 'var(--text-color)' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            {isMobile && (
              <IconButton
                onClick={() => {
                  setDialogOpen(false);
                  setCurrentStep(1);
                  if (!selectedEstimate) {
                    setSelectedEstimate(null);
                  }
                }}
                sx={{ color: 'var(--text-color)', mr: 1 }}
              >
                <ArrowBackIcon />
              </IconButton>
            )}
            <ContractIcon sx={{ color: 'var(--primary-color)' }} />
            <Typography variant={isMobile ? "h5" : "h6"} sx={{ color: 'var(--text-color)' }}>계약 생성</Typography>
          </Box>
        </DialogTitle>
        <DialogContent sx={{ backgroundColor: 'var(--surface-color)', color: 'var(--text-color)' }}>
          <Stepper
            activeStep={currentStep - 1}
            sx={{ mb: 3, color: 'var(--text-color)' }}
          >
            {['계약금 지불', '계약서 서명', '계약 완료'].map(label => (
              <Step key={label}>
                <StepLabel sx={{ color: 'var(--text-color)' }}>{label}</StepLabel>
              </Step>
            ))}
          </Stepper>

          {selectedEstimate && (
            <Box
              sx={{ mb: 3, p: 2, backgroundColor: 'var(--background-color)', borderRadius: 1, border: '1px solid var(--border-color)' }}
            >
              <Typography variant="subtitle1" sx={{ color: 'var(--text-color)', mb: 1 }}>
                선택된 견적서
              </Typography>
              <Typography variant="body2" sx={{ color: 'var(--text-secondary-color)' }}>
                견적번호: {selectedEstimate.estimateNo}
              </Typography>
              <Typography variant="body2" sx={{ color: 'var(--text-secondary-color)' }}>
                고객명: {selectedEstimate.customerName}
              </Typography>
              <Typography variant="body2" sx={{ color: 'var(--text-secondary-color)' }}>
                프로젝트: {selectedEstimate.projectName}
              </Typography>
              <Typography variant="body2" sx={{ color: 'var(--text-secondary-color)' }}>
                소비자금액:{' '}
                {(selectedEstimate.totalAmount || 0).toLocaleString()}원
              </Typography>
              <Typography variant="body2" sx={{ color: 'var(--text-secondary-color)' }}>
                할인후 금액:{' '}
                {(
                  selectedEstimate.discountedAmount ||
                  selectedEstimate.totalAmount ||
                  0
                ).toLocaleString()}
                원
              </Typography>
            </Box>
          )}

          {currentStep === 1 && selectedEstimate && (
            <Box>
              <Typography variant="h6" sx={{ mb: 2, color: 'var(--text-color)' }}>
                계약금 지불 정보
              </Typography>
              <Alert
                severity="info"
                sx={{ mb: 2, backgroundColor: 'var(--primary-color)', color: 'var(--text-color)' }}
              >
                메모를 입력하면 배송관리 화면의 메인 카드 우측 상단에
                표시됩니다.
              </Alert>
              <ContractPayment
                totalAmount={selectedEstimate.totalAmount}
                discountedAmount={
                  selectedEstimate.discountedAmount ||
                  selectedEstimate.totalAmount
                }
                onSave={handlePaymentSave}
                onSaveSchedule={handleSaveSchedule}
                estimateNo={selectedEstimate.estimateNo}
                customerName={selectedEstimate.customerName}
                projectName={selectedEstimate.projectName}
                address={selectedEstimate.address}
                contact={selectedEstimate.contact}
              />
            </Box>
          )}

          {currentStep === 2 && (
            <Box>
              <Typography variant="h6" sx={{ mb: 2, color: 'var(--text-color)' }}>
                계약서 서명
              </Typography>
              <ContractAgreement
                contract={{
                  id: 0,
                  contractNo: selectedEstimate
                    ? `C${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-${String(contracts.length + 1).padStart(3, '0')}`
                    : '',
                  estimateNo: selectedEstimate?.estimateNo || '',
                  contractDate: new Date().toISOString().split('T')[0],
                  customerName: selectedEstimate?.customerName || '',
                  contact: selectedEstimate?.contact || '',
                  emergencyContact: selectedEstimate?.emergencyContact || '',
                  address: selectedEstimate?.address || '',
                  projectName: selectedEstimate?.projectName || '',
                  type: selectedEstimate?.type || '',
                  totalAmount: selectedEstimate?.totalAmount || 0,
                  discountedAmount:
                    selectedEstimate?.discountedAmount ||
                    selectedEstimate?.totalAmount ||
                    0,
                  depositAmount: paymentData?.depositAmount || 0,
                  remainingAmount: paymentData
                    ? paymentData.discountedAmount - paymentData.depositAmount
                    : 0,
                  paymentMethod: paymentData?.paymentMethod || '',
                  paymentDate: paymentData?.paymentDate || '',
                  status: 'draft',
                  agreementMethod: 'signature',
                  memo: paymentData?.memo || '',
                  measurementDate: paymentData?.measurementDate || '',
                  constructionDate: paymentData?.constructionDate || '',
                  createdAt: new Date().toISOString(),
                  updatedAt: new Date().toISOString(),
                  rows: selectedEstimate?.rows || [],
                }}
                onComplete={handleAgreementSave}
              />
            </Box>
          )}

          {currentStep === 3 && (
            <Box>
              <Typography variant="h6" sx={{ mb: 2, color: 'var(--text-color)' }}>
                계약 완료
              </Typography>
              <Alert
                severity="success"
                sx={{ backgroundColor: 'var(--primary-color)', color: 'var(--text-color)' }}
              >
                계약이 성공적으로 생성되었습니다!
              </Alert>
              <Box
                sx={{
                  mt: 2,
                  p: 2,
                  backgroundColor: 'var(--background-color)',
                  borderRadius: 1,
                  border: '1px solid var(--border-color)',
                }}
              >
                <Typography variant="body1" sx={{ color: 'var(--text-color)', mb: 1 }}>
                  <strong>계약번호:</strong>{' '}
                  {selectedEstimate &&
                    `C${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-${String(contracts.length + 1).padStart(3, '0')}`}
                </Typography>
                <Typography variant="body1" sx={{ color: 'var(--text-color)', mb: 1 }}>
                  <strong>고객명:</strong> {selectedEstimate?.customerName}
                </Typography>
                <Typography variant="body1" sx={{ color: 'var(--text-color)', mb: 1 }}>
                  <strong>프로젝트:</strong> {selectedEstimate?.projectName}
                </Typography>
                <Typography variant="body1" sx={{ color: 'var(--text-color)' }}>
                  <strong>총 금액:</strong>{' '}
                  {(selectedEstimate?.totalAmount || 0).toLocaleString()}원
                </Typography>
              </Box>
            </Box>
          )}
        </DialogContent>
        <DialogActions sx={{ 
          p: isMobile ? 2 : 1,
          gap: isMobile ? 1 : 0.5,
          backgroundColor: 'var(--surface-color)',
          color: 'var(--text-color)'
        }}>
          <Button 
            onClick={() => setDialogOpen(false)}
            size={isMobile ? "large" : "medium"}
            sx={{
              minWidth: isMobile ? 80 : 60,
              fontSize: isMobile ? 16 : 14,
              color: 'var(--text-color)'
            }}
          >
            취소
          </Button>
          <Button
            disabled={currentStep <= 1}
            onClick={() => setCurrentStep(prev => prev - 1)}
            size={isMobile ? "large" : "medium"}
            sx={{
              minWidth: isMobile ? 80 : 60,
              fontSize: isMobile ? 16 : 14,
              color: 'var(--text-color)'
            }}
          >
            이전
          </Button>
          {currentStep === 1 && (
            <Button
              variant="contained"
              onClick={() => setCurrentStep(prev => prev + 1)}
              disabled={!paymentData}
              size={isMobile ? "large" : "medium"}
              sx={{
                minWidth: isMobile ? 80 : 60,
                fontSize: isMobile ? 16 : 14,
                backgroundColor: 'var(--primary-color)',
                color: 'var(--text-color)',
                '&:hover': {
                  backgroundColor: 'var(--hover-color)',
                }
              }}
            >
              다음
            </Button>
          )}
        </DialogActions>
      </Dialog>

      {/* 계약 보기/수정 다이얼로그 */}
      <Dialog
        open={editViewDialogOpen}
        onClose={() => setEditViewDialogOpen(false)}
        maxWidth="md"
        fullWidth
        fullScreen={isMobile}
        PaperProps={{
          sx: {
            backgroundColor: 'var(--surface-color)',
            color: 'var(--text-color)',
          },
        }}
      >
        <DialogTitle sx={{ backgroundColor: 'var(--surface-color)', color: 'var(--text-color)' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            {isMobile && (
              <IconButton
                onClick={() => setEditViewDialogOpen(false)}
                sx={{ color: 'var(--text-color)', mr: 1 }}
              >
                <ArrowBackIcon />
              </IconButton>
            )}
            <Typography variant={isMobile ? "h5" : "h6"} sx={{ color: 'var(--text-color)' }}>
              {viewOnly ? '계약 정보 보기' : '계약 정보 수정'}
            </Typography>
          </Box>
        </DialogTitle>
        <DialogContent sx={{ backgroundColor: 'var(--surface-color)', color: 'var(--text-color)' }}>
          {selectedContract && (
            <Grid container spacing={2} sx={{ mt: 1 }}>
              <Grid item xs={12} sm={6}>
                <TextField
                  label="계약일자"
                  value={selectedContract.contractDate}
                  fullWidth
                  InputProps={{ readOnly: viewOnly }}
                  onChange={e =>
                    setSelectedContract({
                      ...selectedContract,
                      contractDate: e.target.value,
                    })
                  }
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      '& fieldset': { borderColor: 'var(--border-color)' },
                      '&:hover fieldset': { borderColor: 'var(--hover-color)' },
                      '&.Mui-focused fieldset': { borderColor: 'var(--primary-color)' },
                    },
                    '& .MuiInputLabel-root': { color: 'var(--text-secondary-color)' },
                    '& .MuiInputBase-input': { color: 'var(--text-color)' },
                  }}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  label="계약번호"
                  value={selectedContract.contractNo}
                  fullWidth
                  InputProps={{ readOnly: true }}
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      '& fieldset': { borderColor: 'var(--border-color)' },
                    },
                    '& .MuiInputLabel-root': { color: 'var(--text-secondary-color)' },
                    '& .MuiInputBase-input': { color: 'var(--text-color)' },
                  }}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  label="고객명"
                  value={selectedContract.customerName}
                  fullWidth
                  InputProps={{ readOnly: viewOnly }}
                  onChange={e =>
                    setSelectedContract({
                      ...selectedContract,
                      customerName: e.target.value,
                    })
                  }
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      '& fieldset': { borderColor: 'var(--border-color)' },
                      '&:hover fieldset': { borderColor: 'var(--hover-color)' },
                      '&.Mui-focused fieldset': { borderColor: 'var(--primary-color)' },
                    },
                    '& .MuiInputLabel-root': { color: 'var(--text-secondary-color)' },
                    '& .MuiInputBase-input': { color: 'var(--text-color)' },
                  }}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  label="연락처"
                  value={selectedContract.contact}
                  fullWidth
                  InputProps={{ readOnly: viewOnly }}
                  onChange={e =>
                    setSelectedContract({
                      ...selectedContract,
                      contact: e.target.value,
                    })
                  }
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      '& fieldset': { borderColor: 'var(--border-color)' },
                      '&:hover fieldset': { borderColor: 'var(--hover-color)' },
                      '&.Mui-focused fieldset': { borderColor: 'var(--primary-color)' },
                    },
                    '& .MuiInputLabel-root': { color: 'var(--text-secondary-color)' },
                    '& .MuiInputBase-input': { color: 'var(--text-color)' },
                  }}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  label="주소"
                  value={selectedContract.address}
                  fullWidth
                  InputProps={{ readOnly: viewOnly }}
                  onChange={e =>
                    setSelectedContract({
                      ...selectedContract,
                      address: e.target.value,
                    })
                  }
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      '& fieldset': { borderColor: 'var(--border-color)' },
                      '&:hover fieldset': { borderColor: 'var(--hover-color)' },
                      '&.Mui-focused fieldset': { borderColor: 'var(--primary-color)' },
                    },
                    '& .MuiInputLabel-root': { color: 'var(--text-secondary-color)' },
                    '& .MuiInputBase-input': { color: 'var(--text-color)' },
                  }}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  label="총금액"
                  type="number"
                  value={selectedContract.totalAmount}
                  fullWidth
                  InputProps={{ readOnly: viewOnly }}
                  onChange={e =>
                    setSelectedContract({
                      ...selectedContract,
                      totalAmount: Number(e.target.value),
                    })
                  }
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      '& fieldset': { borderColor: 'var(--border-color)' },
                      '&:hover fieldset': { borderColor: 'var(--hover-color)' },
                      '&.Mui-focused fieldset': { borderColor: 'var(--primary-color)' },
                    },
                    '& .MuiInputLabel-root': { color: 'var(--text-secondary-color)' },
                    '& .MuiInputBase-input': { color: 'var(--text-color)' },
                  }}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  label="할인후금액"
                  type="number"
                  value={selectedContract.discountedAmount}
                  fullWidth
                  InputProps={{ readOnly: viewOnly }}
                  onChange={e =>
                    setSelectedContract({
                      ...selectedContract,
                      discountedAmount: Number(e.target.value),
                    })
                  }
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      '& fieldset': { borderColor: 'var(--border-color)' },
                      '&:hover fieldset': { borderColor: 'var(--hover-color)' },
                      '&.Mui-focused fieldset': { borderColor: 'var(--primary-color)' },
                    },
                    '& .MuiInputLabel-root': { color: 'var(--text-secondary-color)' },
                    '& .MuiInputBase-input': { color: 'var(--text-color)' },
                  }}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  label="계약금"
                  type="number"
                  value={selectedContract.depositAmount}
                  fullWidth
                  InputProps={{ readOnly: viewOnly }}
                  onChange={e =>
                    setSelectedContract({
                      ...selectedContract,
                      depositAmount: Number(e.target.value),
                    })
                  }
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      '& fieldset': { borderColor: 'var(--border-color)' },
                      '&:hover fieldset': { borderColor: 'var(--hover-color)' },
                      '&.Mui-focused fieldset': { borderColor: 'var(--primary-color)' },
                    },
                    '& .MuiInputLabel-root': { color: 'var(--text-secondary-color)' },
                    '& .MuiInputBase-input': { color: 'var(--text-color)' },
                  }}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  label="잔금"
                  type="number"
                  value={selectedContract.remainingAmount}
                  fullWidth
                  InputProps={{ readOnly: true }}
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      '& fieldset': { borderColor: 'var(--border-color)' },
                    },
                    '& .MuiInputLabel-root': { color: 'var(--text-secondary-color)' },
                    '& .MuiInputBase-input': { color: 'var(--text-color)' },
                  }}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth>
                  <InputLabel sx={{ color: 'var(--text-secondary-color)' }}>상태</InputLabel>
                  <Select
                    value={selectedContract.status}
                    label="상태"
                    onChange={e =>
                      setSelectedContract({
                        ...selectedContract,
                        status: e.target.value as Contract['status'],
                      })
                    }
                    readOnly={viewOnly}
                    sx={{
                      color: 'var(--text-color)',
                      '& .MuiOutlinedInput-notchedOutline': {
                        borderColor: 'var(--border-color)',
                      },
                      '&:hover .MuiOutlinedInput-notchedOutline': {
                        borderColor: 'var(--hover-color)',
                      },
                      '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                        borderColor: 'var(--primary-color)',
                      },
                      '& .MuiSelect-icon': {
                        color: 'var(--text-color)',
                      },
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
                              backgroundColor: 'var(--hover-color)',
                            },
                          },
                        },
                      },
                    }}
                  >
                    <MenuItem value="draft">작성중</MenuItem>
                    <MenuItem value="pending">대기중</MenuItem>
                    <MenuItem value="signed">계약완료</MenuItem>
                    <MenuItem value="completed">완료</MenuItem>
                    <MenuItem value="cancelled">취소</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  label="서명데이터"
                  value={
                    selectedContract.signatureData ? '서명완료' : '서명없음'
                  }
                  fullWidth
                  InputProps={{ readOnly: true }}
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      '& fieldset': { borderColor: 'var(--border-color)' },
                    },
                    '& .MuiInputLabel-root': { color: 'var(--text-secondary-color)' },
                    '& .MuiInputBase-input': { color: 'var(--text-color)' },
                  }}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  label="메모"
                  value={selectedContract.memo}
                  fullWidth
                  multiline
                  rows={3}
                  InputProps={{ readOnly: viewOnly }}
                  onChange={e =>
                    setSelectedContract({
                      ...selectedContract,
                      memo: e.target.value,
                    })
                  }
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      '& fieldset': { borderColor: 'var(--border-color)' },
                      '&:hover fieldset': { borderColor: 'var(--hover-color)' },
                      '&.Mui-focused fieldset': { borderColor: 'var(--primary-color)' },
                    },
                    '& .MuiInputLabel-root': { color: 'var(--text-secondary-color)' },
                    '& .MuiInputBase-input': { color: 'var(--text-color)' },
                  }}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  label="실측일자"
                  type="datetime-local"
                  value={selectedContract?.measurementDate || ''}
                  fullWidth
                  size="small"
                  helperText={!viewOnly ? "실측일자 변경 시 스케줄의 실측일정도 함께 업데이트됩니다" : ""}
                  InputProps={{ 
                    readOnly: viewOnly,
                    ...(viewOnly ? {} : {
                      onClick: (e: any) => {
                        const input = e.target;
                        if (input.showPicker) {
                          input.showPicker();
                        } else {
                          input.click();
                        }
                      }
                    })
                  }}
                  onChange={e =>
                    setSelectedContract({
                      ...selectedContract,
                      measurementDate: e.target.value,
                    })
                  }
                  InputLabelProps={{
                    shrink: true,
                  }}
                  sx={{
                    cursor: viewOnly ? 'default' : 'pointer',
                    '& .MuiOutlinedInput-root': {
                      cursor: viewOnly ? 'default' : 'pointer',
                      '&:hover': {
                        backgroundColor: viewOnly ? 'transparent' : 'var(--hover-color)',
                      },
                      '& fieldset': { borderColor: 'var(--border-color)' },
                      '&:hover fieldset': { borderColor: 'var(--hover-color)' },
                      '&.Mui-focused fieldset': { borderColor: 'var(--primary-color)' },
                    },
                    '& .MuiInputLabel-root': { color: 'var(--text-secondary-color)' },
                    '& .MuiInputBase-input': { color: 'var(--text-color)' },
                    '& .MuiFormHelperText-root': { color: 'var(--text-secondary-color)' },
                  }}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  label="시공일자"
                  type="datetime-local"
                  value={selectedContract?.constructionDate || ''}
                  fullWidth
                  size="small"
                  InputProps={{ 
                    readOnly: viewOnly,
                    ...(viewOnly ? {} : {
                      onClick: (e: any) => {
                        const input = e.target;
                        if (input.showPicker) {
                          input.showPicker();
                        } else {
                          input.click();
                        }
                      }
                    })
                  }}
                  onChange={e =>
                    setSelectedContract({
                      ...selectedContract,
                      constructionDate: e.target.value,
                    })
                  }
                  InputLabelProps={{
                    shrink: true,
                  }}
                  sx={{
                    cursor: viewOnly ? 'default' : 'pointer',
                    '& .MuiOutlinedInput-root': {
                      cursor: viewOnly ? 'default' : 'pointer',
                      '&:hover': {
                        backgroundColor: viewOnly ? 'transparent' : 'var(--hover-color)',
                      },
                      '& fieldset': { borderColor: 'var(--border-color)' },
                      '&:hover fieldset': { borderColor: 'var(--hover-color)' },
                      '&.Mui-focused fieldset': { borderColor: 'var(--primary-color)' },
                    },
                    '& .MuiInputLabel-root': { color: 'var(--text-secondary-color)' },
                    '& .MuiInputBase-input': { color: 'var(--text-color)' },
                  }}
                />
              </Grid>
            </Grid>
          )}
        </DialogContent>
        <DialogActions sx={{ 
          p: isMobile ? 2 : 1,
          gap: isMobile ? 1 : 0.5,
          backgroundColor: 'var(--surface-color)',
          color: 'var(--text-color)'
        }}>
          <Button 
            onClick={() => setEditViewDialogOpen(false)}
            size={isMobile ? "large" : "medium"}
            sx={{
              minWidth: isMobile ? 80 : 60,
              fontSize: isMobile ? 16 : 14,
              color: 'var(--text-color)'
            }}
          >
            닫기
          </Button>
          {!viewOnly && (
            <>
              <Button 
                onClick={handleSaveContract} 
                variant="outlined"
                size={isMobile ? "large" : "medium"}
                sx={{
                  minWidth: isMobile ? 80 : 60,
                  fontSize: isMobile ? 16 : 14,
                  color: 'var(--text-color)',
                  borderColor: 'var(--border-color)',
                  '&:hover': {
                    borderColor: 'var(--hover-color)',
                    backgroundColor: 'var(--hover-color)',
                  }
                }}
              >
                계약만 저장
              </Button>
              <Button 
                onClick={handleSaveContractAndSchedule} 
                variant="contained"
                size={isMobile ? "large" : "medium"}
                sx={{
                  minWidth: isMobile ? 80 : 60,
                  fontSize: isMobile ? 16 : 14,
                  backgroundColor: 'var(--primary-color)',
                  color: 'var(--text-color)',
                  '&:hover': {
                    backgroundColor: 'var(--hover-color)',
                  }
                }}
              >
                📅 계약+실측일정 저장
              </Button>
            </>
          )}
        </DialogActions>
      </Dialog>

      {/* 삭제 확인 다이얼로그 */}
      <Dialog
        open={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
        fullScreen={isMobile}
        PaperProps={{
          sx: {
            backgroundColor: 'var(--surface-color)',
            color: 'var(--text-color)',
          },
        }}
      >
        <DialogTitle sx={{ backgroundColor: 'var(--surface-color)', color: 'var(--text-color)' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            {isMobile && (
              <IconButton
                onClick={() => setDeleteDialogOpen(false)}
                sx={{ color: 'var(--text-color)', mr: 1 }}
              >
                <ArrowBackIcon />
              </IconButton>
            )}
            <Typography variant={isMobile ? "h5" : "h6"} sx={{ color: 'var(--text-color)' }}>계약 삭제 확인</Typography>
          </Box>
        </DialogTitle>
        <DialogContent sx={{ backgroundColor: 'var(--surface-color)', color: 'var(--text-color)' }}>
          <Typography sx={{ fontSize: isMobile ? 16 : 14, color: 'var(--text-color)' }}>
            정말로 '{contractToDelete?.contractNo}' 계약을 삭제하시겠습니까? 이
            작업은 되돌릴 수 없습니다.
          </Typography>
        </DialogContent>
        <DialogActions sx={{ 
          p: isMobile ? 2 : 1,
          gap: isMobile ? 1 : 0.5,
          backgroundColor: 'var(--surface-color)',
          color: 'var(--text-color)'
        }}>
          <Button 
            onClick={() => setDeleteDialogOpen(false)}
            size={isMobile ? "large" : "medium"}
            sx={{
              minWidth: isMobile ? 80 : 60,
              fontSize: isMobile ? 16 : 14,
              color: 'var(--text-color)'
            }}
          >
            취소
          </Button>
          <Button
            onClick={handleConfirmDelete}
            color="error"
            variant="contained"
            size={isMobile ? "large" : "medium"}
            sx={{
              minWidth: isMobile ? 80 : 60,
              fontSize: isMobile ? 16 : 14,
              backgroundColor: '#d32f2f',
              color: 'white',
              '&:hover': {
                backgroundColor: '#b71c1c',
              }
            }}
          >
            삭제
          </Button>
        </DialogActions>
      </Dialog>

      {/* 출력용 숨겨진 div */}
      <div ref={contractPrintRef} style={{ display: 'none' }}>
        {selectedContract && (
          <div style={{ padding: '20px', fontFamily: 'Arial, sans-serif' }}>
            <div style={{ textAlign: 'center', marginBottom: '30px' }}>
              <h1>계약서</h1>
            </div>
            <div style={{ marginBottom: '20px' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <tbody>
                  <tr>
                    <td
                      style={{
                        padding: '8px',
                        border: '1px solid #ddd',
                        fontWeight: 'bold',
                      }}
                    >
                      계약일자
                    </td>
                    <td style={{ padding: '8px', border: '1px solid #ddd' }}>
                      {selectedContract.contractDate}
                    </td>
                  </tr>
                  <tr>
                    <td
                      style={{
                        padding: '8px',
                        border: '1px solid #ddd',
                        fontWeight: 'bold',
                      }}
                    >
                      계약번호
                    </td>
                    <td style={{ padding: '8px', border: '1px solid #ddd' }}>
                      {selectedContract.contractNo}
                    </td>
                  </tr>
                  <tr>
                    <td
                      style={{
                        padding: '8px',
                        border: '1px solid #ddd',
                        fontWeight: 'bold',
                      }}
                    >
                      고객명
                    </td>
                    <td style={{ padding: '8px', border: '1px solid #ddd' }}>
                      {selectedContract.customerName}
                    </td>
                  </tr>
                  <tr>
                    <td
                      style={{
                        padding: '8px',
                        border: '1px solid #ddd',
                        fontWeight: 'bold',
                      }}
                    >
                      연락처
                    </td>
                    <td style={{ padding: '8px', border: '1px solid #ddd' }}>
                      {selectedContract.contact}
                    </td>
                  </tr>
                  <tr>
                    <td
                      style={{
                        padding: '8px',
                        border: '1px solid #ddd',
                        fontWeight: 'bold',
                      }}
                    >
                      주소
                    </td>
                    <td style={{ padding: '8px', border: '1px solid #ddd' }}>
                      {selectedContract.address}
                    </td>
                  </tr>
                  <tr>
                    <td
                      style={{
                        padding: '8px',
                        border: '1px solid #ddd',
                        fontWeight: 'bold',
                      }}
                    >
                      총금액
                    </td>
                    <td style={{ padding: '8px', border: '1px solid #ddd' }}>
                      {(selectedContract.totalAmount || 0).toLocaleString()}원
                    </td>
                  </tr>
                  <tr>
                    <td
                      style={{
                        padding: '8px',
                        border: '1px solid #ddd',
                        fontWeight: 'bold',
                      }}
                    >
                      할인후금액
                    </td>
                    <td style={{ padding: '8px', border: '1px solid #ddd' }}>
                      {(
                        selectedContract.discountedAmount || 0
                      ).toLocaleString()}
                      원
                    </td>
                  </tr>
                  <tr>
                    <td
                      style={{
                        padding: '8px',
                        border: '1px solid #ddd',
                        fontWeight: 'bold',
                      }}
                    >
                      계약금
                    </td>
                    <td style={{ padding: '8px', border: '1px solid #ddd' }}>
                      {(selectedContract.depositAmount || 0).toLocaleString()}원
                    </td>
                  </tr>
                  <tr>
                    <td
                      style={{
                        padding: '8px',
                        border: '1px solid #ddd',
                        fontWeight: 'bold',
                      }}
                    >
                      잔금
                    </td>
                    <td style={{ padding: '8px', border: '1px solid #ddd' }}>
                      {(selectedContract.remainingAmount || 0).toLocaleString()}
                      원
                    </td>
                  </tr>
                  <tr>
                    <td
                      style={{
                        padding: '8px',
                        border: '1px solid #ddd',
                        fontWeight: 'bold',
                      }}
                    >
                      상태
                    </td>
                    <td style={{ padding: '8px', border: '1px solid #ddd' }}>
                      {getStatusText(selectedContract.status)}
                    </td>
                  </tr>
                  <tr>
                    <td
                      style={{
                        padding: '8px',
                        border: '1px solid #ddd',
                        fontWeight: 'bold',
                      }}
                    >
                      서명데이터
                    </td>
                    <td style={{ padding: '8px', border: '1px solid #ddd' }}>
                      {selectedContract.signatureData ? '서명완료' : '서명없음'}
                    </td>
                  </tr>
                  <tr>
                    <td
                      style={{
                        padding: '8px',
                        border: '1px solid #ddd',
                        fontWeight: 'bold',
                      }}
                    >
                      메모
                    </td>
                    <td style={{ padding: '8px', border: '1px solid #ddd' }}>
                      {selectedContract.memo}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
            <div style={{ marginTop: '50px', textAlign: 'center' }}>
              <p>서명: _________________</p>
              <p>날짜: _________________</p>
            </div>
          </div>
        )}
      </div>

      {/* 추가 메뉴 */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={() => setAnchorEl(null)}
      >
        <MenuItem
          onClick={() => {
            if (selectedContract) {
              handlePdfClick(selectedContract);
              setAnchorEl(null);
            }
          }}
        >
          <ListItemIcon>
            <PdfIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>PDF 다운로드</ListItemText>
        </MenuItem>
        <MenuItem
          onClick={() => {
            if (selectedContract) {
              handleJpgClick(selectedContract);
              setAnchorEl(null);
            }
          }}
        >
          <ListItemIcon>
            <ImageIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>JPG 다운로드</ListItemText>
        </MenuItem>
        <MenuItem
          onClick={() => {
            if (selectedContract) {
              handleShareClick(selectedContract);
              setAnchorEl(null);
            }
          }}
        >
          <ListItemIcon>
            <ShareIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>공유하기</ListItemText>
        </MenuItem>
      </Menu>

      {/* 프린트 아이콘 클릭 시 ContractTemplate 다이얼로그 렌더 */}
      {selectedContractForPrint && (
        <ContractTemplate
          contract={selectedContractForPrint}
          open={contractTemplateOpen}
          onClose={() => setContractTemplateOpen(false)}
        />
      )}
    </Box>
  );
};

export default ContractManagement;
