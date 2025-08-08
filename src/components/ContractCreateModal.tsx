import React, { useMemo, useState } from 'react';
import {
  Box,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Stepper,
  Step,
  StepLabel,
  Typography,
  useMediaQuery,
} from '@mui/material';
import { useTheme } from '@mui/material/styles';
import ContractPayment from './ContractPayment';
import ContractAgreement, { AgreementData } from './ContractAgreement';
import type { Contract } from './ContractTemplate';

export interface ContractCreateModalProps {
  open: boolean;
  onClose: () => void;
  estimate: {
    estimateNo: string;
    estimateDate?: string;
    customerName?: string;
    contact?: string;
    emergencyContact?: string;
    projectName?: string;
    type?: string;
    address?: string;
    rows?: any[];
    totalAmount?: number;
    discountedAmount?: number;
  };
  // 금액 표시는 상위에서 계산된 값을 받는다 (표시/저장 일관성 위해)
  totalAmount: number;
  discountedAmount: number;
  onSaved?: (contract: Contract) => void;
  // 수정 모드용 기존 계약서 데이터
  existingContract?: Contract;
  isEditMode?: boolean;
}

const ContractCreateModal: React.FC<ContractCreateModalProps> = ({
  open,
  onClose,
  estimate,
  totalAmount,
  discountedAmount,
  onSaved,
  existingContract,
  isEditMode = false,
}) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  const [currentStep, setCurrentStep] = useState<number>(1);
  const [paymentData, setPaymentData] = useState<any | null>(null);
  const [agreementData, setAgreementData] = useState<AgreementData | null>(null);

  // 수정 모드일 때 기존 계약서 데이터로 초기화
  React.useEffect(() => {
    if (isEditMode && existingContract) {
      setPaymentData({
        totalAmount: existingContract.totalAmount,
        discountedAmount: existingContract.discountedAmount,
        depositAmount: existingContract.depositAmount,
        remainingAmount: existingContract.remainingAmount,
        paymentMethod: existingContract.paymentMethod,
        paymentDate: existingContract.paymentDate,
        memo: existingContract.memo,
        measurementDate: existingContract.measurementDate,
        constructionDate: existingContract.constructionDate,
      });
             setAgreementData({
         isAgreed: true,
         agreementMethod: (existingContract.agreementMethod as 'signature' | 'checkbox') || 'checkbox',
         signatureData: existingContract.signatureData || '',
         agreementDate: new Date().toISOString(), // 항상 현재 시간으로 설정
       });
    } else {
      // 새 계약서 생성 모드일 때 초기화
      setPaymentData(null);
      setAgreementData(null);
      setCurrentStep(1);
    }
  }, [isEditMode, existingContract, open]);

  const todayStr = useMemo(() => new Date().toISOString().split('T')[0], []);

  const handlePaymentSave = (data: any) => {
    setPaymentData(data);
    setCurrentStep(2);
  };

  const handleAgreementSave = (data: AgreementData) => {
    setAgreementData(data);
    setCurrentStep(3);
  };

  const generateContractNoForToday = (): { contractNo: string; id: number } => {
    const list: Contract[] = (() => {
      try {
        return JSON.parse(localStorage.getItem('contracts') || '[]');
      } catch {
        return [] as Contract[];
      }
    })();
    const datePart = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    let seq = 1;
    let candidate = `C${datePart}-${String(seq).padStart(3, '0')}`;
    const existingNos = new Set(list.map(c => c.contractNo));
    while (existingNos.has(candidate)) {
      seq += 1;
      candidate = `C${datePart}-${String(seq).padStart(3, '0')}`;
    }
    const id = Date.now();
    return { contractNo: candidate, id };
  };

  const handleFinalizeSave = () => {
    const discounted = paymentData?.discountedAmount ?? discountedAmount ?? totalAmount ?? 0;
    const deposit = paymentData?.depositAmount ?? 0;
    const remaining = discounted - deposit;

    let contract: Contract;

    if (isEditMode && existingContract) {
      // 수정 모드: 기존 계약서 업데이트
      contract = {
        ...existingContract,
        discountedAmount: discounted,
        depositAmount: deposit,
        remainingAmount: remaining,
        paymentMethod: paymentData?.paymentMethod || '',
        paymentDate: paymentData?.paymentDate || todayStr,
        agreementMethod: agreementData?.agreementMethod || 'checkbox',
        memo: paymentData?.memo || '',
        measurementDate: paymentData?.measurementDate || '',
        constructionDate: paymentData?.constructionDate || '',
        updatedAt: new Date().toISOString(),
      } as any;
    } else {
      // 새 계약서 생성 모드
      const { contractNo, id } = generateContractNoForToday();
      contract = {
        id,
        contractNo,
        estimateNo: estimate.estimateNo,
        contractDate: todayStr,
        customerName: estimate.customerName || '',
        contact: estimate.contact || '',
        emergencyContact: estimate.emergencyContact || '',
        address: estimate.address || '',
        projectName: estimate.projectName || '',
        type: estimate.type || '',
        totalAmount: totalAmount || 0,
        discountedAmount: discounted,
        depositAmount: deposit,
        remainingAmount: remaining,
        paymentMethod: paymentData?.paymentMethod || '',
        paymentDate: paymentData?.paymentDate || todayStr,
        status: 'draft',
        agreementMethod: agreementData?.agreementMethod || 'checkbox',
        memo: paymentData?.memo || '',
        measurementDate: paymentData?.measurementDate || '',
        constructionDate: paymentData?.constructionDate || '',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        rows: estimate.rows || [],
      } as any;
    }

    // 저장: localStorage 우선, 필요 시 상위 콜백
    try {
      const saved: Contract[] = JSON.parse(localStorage.getItem('contracts') || '[]');
      
      if (isEditMode && existingContract) {
        // 수정 모드: 기존 계약서 업데이트
        const index = saved.findIndex(c => c.id === existingContract.id);
        if (index >= 0) {
          saved[index] = contract;
        }
      } else {
        // 새 계약서 생성 모드
        saved.push(contract);
      }
      
      localStorage.setItem('contracts', JSON.stringify(saved));
    } catch (e) {
      console.error('계약 저장 실패(localStorage):', e);
    }

    if (onSaved) onSaved(contract);
    onClose();
    // 초기화
    setCurrentStep(1);
    setPaymentData(null);
    setAgreementData(null);
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="md"
      fullWidth
      fullScreen={isMobile}
      PaperProps={{
        sx: { backgroundColor: 'var(--surface-color)', color: 'var(--text-color)' },
      }}
    >
      <DialogTitle sx={{ backgroundColor: 'var(--surface-color)', color: 'var(--text-color)' }}>
        계약 생성
      </DialogTitle>
      <DialogContent sx={{ backgroundColor: 'var(--surface-color)', color: 'var(--text-color)' }}>
        <Stepper activeStep={currentStep - 1} sx={{ mb: 3 }}>
          {['계약금 지불', '계약서 서명', '계약 완료'].map(label => (
            <Step key={label}>
              <StepLabel>{label}</StepLabel>
            </Step>
          ))}
        </Stepper>

        {/* 견적 정보 요약 */}
        <Box sx={{ mb: 2, p: 2, backgroundColor: 'var(--background-color)', border: '1px solid var(--border-color)', borderRadius: 1 }}>
          <Typography variant="body2">견적번호: {estimate.estimateNo}</Typography>
          <Typography variant="body2">고객명: {estimate.customerName}</Typography>
          <Typography variant="body2">프로젝트: {estimate.projectName}</Typography>
          <Typography variant="body2">소비자금액: {totalAmount.toLocaleString()}원</Typography>
          <Typography variant="body2">할인후금액: {(discountedAmount || totalAmount).toLocaleString()}원</Typography>
        </Box>

        {currentStep === 1 && (
          <ContractPayment
            totalAmount={totalAmount}
            discountedAmount={discountedAmount || totalAmount}
            onSave={handlePaymentSave}
            estimateNo={estimate.estimateNo}
            customerName={estimate.customerName}
            projectName={estimate.projectName}
            address={estimate.address}
            contact={estimate.contact}
          />
        )}

        {currentStep === 2 && (
          <ContractAgreement
            contract={{
              id: 0,
              contractNo: '',
              estimateNo: estimate.estimateNo,
              contractDate: todayStr,
              customerName: estimate.customerName || '',
              contact: estimate.contact || '',
              emergencyContact: estimate.emergencyContact || '',
              address: estimate.address || '',
              projectName: estimate.projectName || '',
              type: estimate.type || '',
              totalAmount: totalAmount || 0,
              discountedAmount: discountedAmount || totalAmount || 0,
              depositAmount: paymentData?.depositAmount || 0,
              remainingAmount: paymentData ? (paymentData.discountedAmount - paymentData.depositAmount) : 0,
              paymentMethod: paymentData?.paymentMethod || '',
              paymentDate: paymentData?.paymentDate || todayStr,
              status: 'draft',
              agreementMethod: 'signature',
              memo: paymentData?.memo || '',
              measurementDate: paymentData?.measurementDate || '',
              constructionDate: paymentData?.constructionDate || '',
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
              rows: estimate.rows || [],
            } as Contract}
            onComplete={handleAgreementSave}
          />
        )}

        {currentStep === 3 && (
          <Box sx={{ p: 2, border: '1px solid var(--border-color)', borderRadius: 1 }}>
            <Typography variant="body1" sx={{ mb: 1 }}>계약이 완료될 준비가 되었습니다.</Typography>
            <Typography variant="body2">할인후금액: {(paymentData?.discountedAmount ?? discountedAmount ?? totalAmount).toLocaleString()}원</Typography>
            <Typography variant="body2">계약금: {(paymentData?.depositAmount ?? 0).toLocaleString()}원</Typography>
            <Typography variant="body2">잔금: {(((paymentData?.discountedAmount ?? discountedAmount ?? totalAmount) - (paymentData?.depositAmount ?? 0)) || 0).toLocaleString()}원</Typography>
          </Box>
        )}
      </DialogContent>
      <DialogActions sx={{ backgroundColor: 'var(--surface-color)' }}>
        <Button onClick={onClose} sx={{ color: 'var(--text-color)' }}>취소</Button>
        {currentStep > 1 && currentStep < 3 && (
          <Button onClick={() => setCurrentStep(s => s - 1)} sx={{ color: 'var(--text-color)' }}>이전</Button>
        )}
        {currentStep === 3 ? (
          <Button variant="contained" onClick={handleFinalizeSave} sx={{ backgroundColor: 'var(--primary-color)', color: 'var(--text-color)' }}>완료 저장</Button>
        ) : null}
      </DialogActions>
    </Dialog>
  );
};

export default ContractCreateModal;


