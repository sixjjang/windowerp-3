import React, { useState } from 'react';
import {
  Box,
  TextField,
  Button,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Typography,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from '@mui/material';
import type { SelectChangeEvent } from '@mui/material/Select';

interface ContractPaymentProps {
  totalAmount: number;
  discountedAmount: number;
  onSave: (data: any) => void;
}

const ContractPayment: React.FC<ContractPaymentProps> = ({
  totalAmount,
  discountedAmount,
  onSave,
}) => {
  const [depositAmount, setDepositAmount] = useState<number>(0);
  const [depositDisplay, setDepositDisplay] = useState<string>('0');
  const [currentDiscountedAmount, setCurrentDiscountedAmount] =
    useState<number>(discountedAmount);
  const [discountedDisplay, setDiscountedDisplay] = useState<string>(
    discountedAmount.toLocaleString()
  );
  const [paymentMethod, setPaymentMethod] = useState<string>('cash');
  const [paymentDate, setPaymentDate] = useState<string>(
    new Date().toISOString().split('T')[0]
  );
  const [measurementDate, setMeasurementDate] = useState<string>('');
  const [constructionDate, setConstructionDate] = useState<string>('');
  const [memo, setMemo] = useState<string>('');

  const handleSave = () => {
    onSave({
      totalAmount,
      discountedAmount: currentDiscountedAmount,
      depositAmount,
      remainingAmount: currentDiscountedAmount - depositAmount,
      paymentMethod,
      paymentDate,
      measurementDate,
      constructionDate,
      memo,
    });
  };

  const handleDepositChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/,/g, '');
    const numValue = Number(value);
    if (!isNaN(numValue)) {
      setDepositAmount(numValue);
      setDepositDisplay(value);
    }
  };

  const handleDiscountedChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/,/g, '');
    const numValue = Number(value);
    if (!isNaN(numValue)) {
      setCurrentDiscountedAmount(numValue);
      setDiscountedDisplay(value);
    }
  };

  const handleDepositFocus = () => {
    if (depositAmount === 0) {
      setDepositDisplay('');
    }
  };

  const handleDiscountedFocus = () => {
    if (currentDiscountedAmount === 0) {
      setDiscountedDisplay('');
    }
  };

  const handleDepositBlur = () => {
    if (depositAmount === 0) {
      setDepositDisplay('0');
    } else {
      setDepositDisplay(depositAmount.toLocaleString());
    }
  };

  const handleDiscountedBlur = () => {
    if (currentDiscountedAmount === 0) {
      setDiscountedDisplay('0');
    } else {
      setDiscountedDisplay(currentDiscountedAmount.toLocaleString());
    }
  };

  return (
    <Box>
      <Grid container spacing={2}>
        <Grid item xs={12} sm={6}>
          <TextField
            label="소비자금액"
            type="text"
            value={totalAmount.toLocaleString()}
            fullWidth
            size="small"
            InputProps={{
              readOnly: true,
            }}
          />
        </Grid>
        <Grid item xs={12} sm={6}>
          <TextField
            label="할인 후 금액"
            type="text"
            value={discountedDisplay}
            onChange={handleDiscountedChange}
            onFocus={handleDiscountedFocus}
            onBlur={handleDiscountedBlur}
            fullWidth
            size="small"
          />
        </Grid>
        <Grid item xs={12} sm={6}>
          <TextField
            label="계약금"
            type="text"
            value={depositDisplay}
            onChange={handleDepositChange}
            onFocus={handleDepositFocus}
            onBlur={handleDepositBlur}
            fullWidth
            size="small"
            placeholder="0"
          />
        </Grid>
        <Grid item xs={12} sm={6}>
          <TextField
            label="잔금"
            type="text"
            value={(currentDiscountedAmount - depositAmount).toLocaleString()}
            fullWidth
            size="small"
            InputProps={{
              readOnly: true,
            }}
          />
        </Grid>
        <Grid item xs={12} sm={6}>
          <FormControl fullWidth size="small">
            <InputLabel>결제수단</InputLabel>
            <Select
              value={paymentMethod}
              onChange={(e: SelectChangeEvent) =>
                setPaymentMethod(e.target.value)
              }
              label="결제수단"
            >
              <MenuItem value="cash">현금</MenuItem>
              <MenuItem value="card">카드</MenuItem>
              <MenuItem value="transfer">계좌이체</MenuItem>
            </Select>
          </FormControl>
        </Grid>
        <Grid item xs={12} sm={6}>
          <TextField
            label="결제일"
            type="date"
            value={paymentDate}
            onChange={e => setPaymentDate(e.target.value)}
            fullWidth
            size="small"
            InputLabelProps={{
              shrink: true,
            }}
            onClick={e => {
              const input = e.target as HTMLInputElement;
              if (input.showPicker) {
                input.showPicker();
              } else {
                input.click();
              }
            }}
            sx={{
              cursor: 'pointer',
              '& .MuiOutlinedInput-root': {
                cursor: 'pointer',
                '&:hover': {
                  backgroundColor: 'rgba(255, 255, 255, 0.04)',
                },
              },
            }}
          />
        </Grid>
        <Grid item xs={12} sm={6}>
          <TextField
            label="실측일자"
            type="datetime-local"
            value={measurementDate}
            onChange={e => setMeasurementDate(e.target.value)}
            fullWidth
            size="small"
            InputLabelProps={{
              shrink: true,
            }}
            onClick={e => {
              const input = e.target as HTMLInputElement;
              if (input.showPicker) {
                input.showPicker();
              } else {
                input.click();
              }
            }}
            sx={{
              cursor: 'pointer',
              '& .MuiOutlinedInput-root': {
                cursor: 'pointer',
                '&:hover': {
                  backgroundColor: 'rgba(255, 255, 255, 0.04)',
                },
              },
            }}
          />
        </Grid>
        <Grid item xs={12} sm={6}>
          <TextField
            label="시공일자"
            type="datetime-local"
            value={constructionDate}
            onChange={e => setConstructionDate(e.target.value)}
            fullWidth
            size="small"
            InputLabelProps={{
              shrink: true,
            }}
            onClick={e => {
              const input = e.target as HTMLInputElement;
              if (input.showPicker) {
                input.showPicker();
              } else {
                input.click();
              }
            }}
            sx={{
              cursor: 'pointer',
              '& .MuiOutlinedInput-root': {
                cursor: 'pointer',
                '&:hover': {
                  backgroundColor: 'rgba(255, 255, 255, 0.04)',
                },
              },
            }}
          />
        </Grid>
        <Grid item xs={12}>
          <TextField
            label="메모"
            multiline
            rows={3}
            value={memo}
            onChange={e => setMemo(e.target.value)}
            fullWidth
            size="small"
            placeholder="계약 관련 메모를 입력하세요 (배송관리 화면의 메모에 표시됩니다)"
            sx={{
              '& .MuiOutlinedInput-root': {
                '& fieldset': { borderColor: 'rgba(255, 255, 255, 0.23)' },
                '&:hover fieldset': { borderColor: 'rgba(255, 255, 255, 0.4)' },
                '&.Mui-focused fieldset': { borderColor: '#1976d2' },
              },
              '& .MuiInputLabel-root': { color: 'rgba(255, 255, 255, 0.7)' },
              '& .MuiInputBase-input': { color: '#e0e6ed' },
              '& .MuiInputBase-input::placeholder': {
                color: 'rgba(255, 255, 255, 0.5)',
              },
            }}
          />
        </Grid>
      </Grid>
      <Box sx={{ mt: 2, display: 'flex', justifyContent: 'flex-end' }}>
        <Button variant="contained" color="primary" onClick={handleSave}>
          저장하고 다음으로
        </Button>
      </Box>
    </Box>
  );
};

export default ContractPayment;
