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
  Button,
  Select,
  MenuItem,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Alert,
  Snackbar,
  IconButton,
  SelectChangeEvent,
  useMediaQuery,
  useTheme,
} from '@mui/material';
import { Delete, Edit } from '@mui/icons-material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';

interface TaxInvoice {
  id: number;
  type: '세금계산서' | '현금영수증';
  partner: string;
  amount: number;
  date: string;
  status: '대기' | '발행완료' | '오류';
  createdAt: string;
  updatedAt: string;
}


export default function TaxInvoice() {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  
  const [invoices, setInvoices] = useState<TaxInvoice[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editInvoice, setEditInvoice] = useState<TaxInvoice | null>(null);
  const [form, setForm] = useState<
    Omit<TaxInvoice, 'id' | 'status' | 'createdAt' | 'updatedAt'>
  >({
    type: '세금계산서',
    partner: '',
    amount: 0,
    date: new Date().toISOString().slice(0, 10),
  });
  const [loading, setLoading] = useState(false);
  const [snackbar, setSnackbar] = useState<{
    open: boolean;
    message: string;
    severity: 'success' | 'error';
  }>({ open: false, message: '', severity: 'success' });

  // 데이터 로드
  const loadInvoices = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${API_BASE}/taxInvoices`);
      if (!response.ok) throw new Error('데이터 로드 실패');
      const data = await response.json();
      setInvoices(data);
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
    loadInvoices();
  }, []);

  const handleOpen = (invoice?: TaxInvoice) => {
    if (invoice) {
      setEditInvoice(invoice);
      setForm({
        type: invoice.type,
        partner: invoice.partner,
        amount: invoice.amount,
        date: invoice.date,
      });
    } else {
      setEditInvoice(null);
      setForm({
        type: '세금계산서',
        partner: '',
        amount: 0,
        date: new Date().toISOString().slice(0, 10),
      });
    }
    setDialogOpen(true);
  };

  const handleClose = () => setDialogOpen(false);

  const handleTextFieldChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setForm(f => ({
      ...f,
      [name!]: name === 'amount' ? Number(value) : value,
    }));
  };

  const handleSelectChange = (e: SelectChangeEvent) => {
    const { name, value } = e.target;
    setForm(f => ({ ...f, [name!]: value }));
  };

  const handleSave = async () => {
    try {
      const response = await fetch(`${API_BASE}/saveTaxInvoice`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      if (!response.ok) throw new Error('등록 실패');

      setSnackbar({
        open: true,
        message: '세금계산서가 등록되었습니다.',
        severity: 'success',
      });
      setDialogOpen(false);
      loadInvoices();
    } catch (error) {
      console.error('세금계산서 저장 오류:', error);
      setSnackbar({
        open: true,
        message: '저장에 실패했습니다.',
        severity: 'error',
      });
    }
  };

  const handleStatusUpdate = async (id: number, status: string) => {
    try {
      const response = await fetch(`${API_BASE}/tax-invoices/${id}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });
      if (!response.ok) throw new Error('상태 업데이트 실패');

      setSnackbar({
        open: true,
        message: '상태가 업데이트되었습니다.',
        severity: 'success',
      });
      loadInvoices();
    } catch (error) {
      console.error('상태 업데이트 오류:', error);
      setSnackbar({
        open: true,
        message: '상태 업데이트에 실패했습니다.',
        severity: 'error',
      });
    }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm('정말 삭제하시겠습니까?')) return;

    try {
      const response = await fetch(`${API_BASE}/tax-invoices/${id}`, {
        method: 'DELETE',
      });
      if (!response.ok) throw new Error('삭제 실패');

      setSnackbar({
        open: true,
        message: '세금계산서가 삭제되었습니다.',
        severity: 'success',
      });
      loadInvoices();
    } catch (error) {
      console.error('세금계산서 삭제 오류:', error);
      setSnackbar({
        open: true,
        message: '삭제에 실패했습니다.',
        severity: 'error',
      });
    }
  };

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h5" gutterBottom>
        전자세금계산서/현금영수증 관리
      </Typography>
      <Box sx={{ mb: 2, display: 'flex', gap: 2, alignItems: 'center' }}>
        <Button variant="contained" onClick={() => handleOpen()}>
          세금계산서 등록
        </Button>
      </Box>
      <Table size="small">
        <TableHead>
          <TableRow>
            <TableCell>유형</TableCell>
            <TableCell>거래처</TableCell>
            <TableCell>금액</TableCell>
            <TableCell>발행일</TableCell>
            <TableCell>상태</TableCell>
            <TableCell>관리</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {invoices.map(inv => (
            <TableRow key={inv.id}>
              <TableCell>{inv.type}</TableCell>
              <TableCell>{inv.partner}</TableCell>
              <TableCell>{inv.amount.toLocaleString()}원</TableCell>
              <TableCell>{inv.date}</TableCell>
              <TableCell>
                <Select
                  value={inv.status}
                  onChange={e =>
                    handleStatusUpdate(inv.id, e.target.value as string)
                  }
                  size="small"
                  sx={{ minWidth: 100 }}
                >
                  <MenuItem value="대기">대기</MenuItem>
                  <MenuItem value="발행완료">발행완료</MenuItem>
                  <MenuItem value="오류">오류</MenuItem>
                </Select>
              </TableCell>
              <TableCell>
                <IconButton size="small" onClick={() => handleOpen(inv)}>
                  <Edit fontSize="small" />
                </IconButton>
                <IconButton size="small" onClick={() => handleDelete(inv.id)}>
                  <Delete fontSize="small" />
                </IconButton>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
      <Typography variant="body2" sx={{ mt: 2, color: '#888' }}>
        ※ 실제 전자세금계산서/현금영수증 발행 연동은 추후 구현 예정입니다.
      </Typography>
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
              {editInvoice ? '세금계산서 수정' : '세금계산서 등록'}
            </Typography>
          </Box>
        </DialogTitle>
        <DialogContent
          sx={{
            ...(isMobile && {
              padding: 2,
              flex: 1,
              overflow: 'auto',
            }),
          }}
        >
          <Select
            margin="dense"
            label="유형"
            name="type"
            value={form.type}
            onChange={handleSelectChange}
            fullWidth
            size={isMobile ? 'medium' : 'small'}
            sx={{ 
              mt: 1, 
              mb: 1,
              ...(isMobile && {
                '& .MuiInputBase-input': {
                  fontSize: '1rem',
                  padding: '16px 14px',
                },
              }),
            }}
          >
            <MenuItem value="세금계산서">세금계산서</MenuItem>
            <MenuItem value="현금영수증">현금영수증</MenuItem>
          </Select>
          <TextField
            margin="dense"
            label="거래처"
            name="partner"
            value={form.partner}
            onChange={handleTextFieldChange}
            fullWidth
            size={isMobile ? 'medium' : 'small'}
            sx={{
              ...(isMobile && {
                '& .MuiInputBase-input': {
                  fontSize: '1rem',
                  padding: '16px 14px',
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
            onChange={handleTextFieldChange}
            fullWidth
            size={isMobile ? 'medium' : 'small'}
            sx={{
              ...(isMobile && {
                '& .MuiInputBase-input': {
                  fontSize: '1rem',
                  padding: '16px 14px',
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
            onChange={handleTextFieldChange}
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
                  fontSize: '1rem',
                  padding: '16px 14px',
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
                fontSize: '1rem',
                padding: '12px 24px',
                minWidth: '80px',
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
                fontSize: '1rem',
                padding: '12px 24px',
                minWidth: '80px',
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
