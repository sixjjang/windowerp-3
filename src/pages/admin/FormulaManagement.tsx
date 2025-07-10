import React, { useState } from 'react';
import { DataGrid, GridRowsProp } from '@mui/x-data-grid';
import {
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Switch,
  FormControlLabel,
  Box,
  Typography,
  useMediaQuery,
  useTheme,
  IconButton,
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';

interface Formula {
  id: number;
  name: string;
  description: string;
  expression: string;
  enabled: boolean;
}

const initialRows: Formula[] = [
  {
    id: 1,
    name: '기본 계산',
    description: '기본 단가 * 수량',
    expression: 'unitPrice * quantity',
    enabled: true,
  },
  {
    id: 2,
    name: '할인 적용',
    description: '기본 단가 * 수량 * (1 - 할인율)',
    expression: 'unitPrice * quantity * (1 - discount)',
    enabled: false,
  },
  {
    id: 1001,
    name: '겉커튼 폭수(민자)',
    description:
      '겉커튼, 민자: (실측가로 × 1.4) ÷ 제품폭, 소수점 첫째자리 0.1 이하는 버림, 그 외 올림',
    expression: '(widthMM * 1.4) / productWidth',
    enabled: true,
  },
  {
    id: 1002,
    name: '겉커튼 폭수(나비)',
    description:
      '겉커튼, 나비: (실측가로 × 2) ÷ 제품폭, 소수점 첫째자리 0.1 이하는 버림, 그 외 올림',
    expression: '(widthMM * 2) / productWidth',
    enabled: true,
  },
  {
    id: 1003,
    name: '겉커튼 주름양',
    description: '겉커튼: (제품폭 × 폭수) ÷ 실측가로, 소수점 둘째자리까지',
    expression: '(productWidth * pleatCount) / widthMM',
    enabled: true,
  },
  {
    id: 1004,
    name: '속커튼 면적',
    description: '속커튼, 민자: (실측가로 × 실측세로) ÷ 1,000,000 (m²)',
    expression: '(widthMM * heightMM) / 1000000',
    enabled: true,
  },
  {
    id: 1005,
    name: '할인후금액',
    description: '총금액 - 할인금액',
    expression: 'totalAmount - discountAmount',
    enabled: true,
  },
  {
    id: 1006,
    name: '계약 잔액',
    description: '할인후금액 - 계약금(입금액)',
    expression: 'discountedAmount - depositAmount',
    enabled: true,
  },
  {
    id: 2001,
    name: '판매금액(겉커튼)',
    description: '겉커튼: 판매단가 × 폭수',
    expression: 'salePrice * widthCount',
    enabled: true,
  },
  {
    id: 2002,
    name: '판매금액(속커튼-민자)',
    description: '속커튼-민자: 대폭민자단가 × 면적(m²)',
    expression: 'largePlainPrice * area',
    enabled: true,
  },
  {
    id: 2003,
    name: '판매금액(속커튼-나비)',
    description: '속커튼-나비: 판매단가 × 면적(m²)',
    expression: 'salePrice * area',
    enabled: true,
  },
  {
    id: 2004,
    name: '판매금액(블라인드)',
    description: '블라인드: 판매단가 × 면적(m²)',
    expression: 'salePrice * area',
    enabled: true,
  },
  {
    id: 2005,
    name: '판매금액(헌터더글라스)',
    description: '헌터더글라스: 판매단가 × 수량',
    expression: 'salePrice * quantity',
    enabled: true,
  },
  {
    id: 2101,
    name: '입고금액(겉커튼)',
    description: '겉커튼: 원가 × 폭수',
    expression: 'purchaseCost * widthCount',
    enabled: true,
  },
  {
    id: 2102,
    name: '입고금액(속커튼-민자)',
    description: '속커튼-민자: 대폭민자원가 × 면적(m²)',
    expression: 'largePlainCost * area',
    enabled: true,
  },
  {
    id: 2103,
    name: '입고금액(속커튼-나비)',
    description: '속커튼-나비: 원가 × 면적(m²)',
    expression: 'purchaseCost * area',
    enabled: true,
  },
  {
    id: 2104,
    name: '입고금액(블라인드)',
    description: '블라인드: 원가 × 면적(m²)',
    expression: 'purchaseCost * area',
    enabled: true,
  },
  {
    id: 2105,
    name: '입고금액(헌터더글라스)',
    description: '헌터더글라스: 판매단가 × 0.6 / 1.1',
    expression: 'salePrice * 0.6 / 1.1',
    enabled: true,
  },
  {
    id: 2201,
    name: '옵션/부자재(폭당)',
    description: '옵션/부자재: 단가 × 폭수 × 수량',
    expression: 'unitPrice * widthCount * quantity',
    enabled: true,
  },
  {
    id: 2202,
    name: '옵션/부자재(m2당)',
    description: '옵션/부자재: 단가 × 면적 × 수량',
    expression: 'unitPrice * area * quantity',
    enabled: true,
  },
  {
    id: 2203,
    name: '옵션/부자재(m당)',
    description: '옵션/부자재: 단가 × (가로/1000) × 수량',
    expression: 'unitPrice * (widthMM / 1000) * quantity',
    enabled: true,
  },
  {
    id: 2204,
    name: '옵션/부자재(추가)',
    description: '옵션/부자재: 단가 × 수량',
    expression: 'unitPrice * quantity',
    enabled: true,
  },
  {
    id: 2205,
    name: '옵션/부자재(포함)',
    description: '옵션/부자재: 0원(포함)',
    expression: '0',
    enabled: true,
  },
  {
    id: 2301,
    name: '마진(견적)',
    description: '마진: (할인후금액 또는 소비자금액) ÷ 1.1 - 전체입고금액',
    expression: '(finalAmount / 1.1) - totalPurchaseAmount',
    enabled: true,
  },
  {
    id: 2401,
    name: '제품합계',
    description: '제품행의 판매금액 합계',
    expression: 'sum(productRows.totalPrice)',
    enabled: true,
  },
  {
    id: 2402,
    name: '옵션합계',
    description: '옵션행의 판매금액 합계',
    expression: 'sum(optionRows.totalPrice)',
    enabled: true,
  },
  {
    id: 2403,
    name: '총합계',
    description: '제품합계 + 옵션합계',
    expression: 'productTotalAmount + optionTotalAmount',
    enabled: true,
  },
  {
    id: 2404,
    name: '전체입고금액',
    description: '전체 제품/옵션의 입고금액 합계',
    expression: 'sum(allRows.cost)',
    enabled: true,
  },
];

// GridColDef 타입 정의
interface GridColDef {
  field: string;
  headerName: string;
  flex?: number;
  width?: number;
  renderCell?: (params: any) => React.ReactNode;
  sortable?: boolean;
  filterable?: boolean;
}

export default function FormulaManagement() {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  
  const [rows, setRows] = useState<Formula[]>(initialRows);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Formula | null>(null);
  const [preview, setPreview] = useState<string>('');

  const [form, setForm] = useState<Omit<Formula, 'id'>>({
    name: '',
    description: '',
    expression: '',
    enabled: true,
  });

  const handleOpen = (row?: Formula) => {
    if (row) {
      setEditing(row);
      setForm({
        name: row.name,
        description: row.description,
        expression: row.expression,
        enabled: row.enabled,
      });
      setPreview('');
    } else {
      setEditing(null);
      setForm({ name: '', description: '', expression: '', enabled: true });
      setPreview('');
    }
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
    setEditing(null);
    setPreview('');
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSwitch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, enabled: e.target.checked });
  };

  const handleSave = () => {
    if (editing) {
      setRows(
        rows.map(r => (r.id === editing.id ? { ...editing, ...form } : r))
      );
    } else {
      setRows([...rows, { ...form, id: Date.now() }]);
    }
    handleClose();
  };

  const handleDelete = (id: number) => {
    setRows(rows.filter(r => r.id !== id));
  };

  // 간단한 미리보기(예: unitPrice=1000, quantity=2, discount=0.1)
  const handlePreview = () => {
    try {
      // eslint-disable-next-line no-new-func
      const fn = new Function(
        'unitPrice',
        'quantity',
        'discount',
        `return ${form.expression}`
      );
      const result = fn(1000, 2, 0.1);
      setPreview(`예시 결과: ${result}`);
    } catch {
      setPreview('수식 오류');
    }
  };

  const columns: GridColDef[] = [
    { field: 'name', headerName: '이름', flex: 1 },
    { field: 'description', headerName: '설명', flex: 2 },
    { field: 'expression', headerName: '수식', flex: 2 },
    {
      field: 'enabled',
      headerName: '사용여부',
      width: 100,
      renderCell: (params: any) => (params.value ? '사용' : '미사용'),
    },
    {
      field: 'actions',
      headerName: '관리',
      width: 180,
      renderCell: (params: any) => (
        <>
          <Button size="small" onClick={() => handleOpen(params.row)}>
            수정
          </Button>
          <Button
            size="small"
            color="error"
            onClick={() => handleDelete(params.row.id)}
          >
            삭제
          </Button>
        </>
      ),
      sortable: false,
      filterable: false,
    },
  ];

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h5" gutterBottom>
        계산방식 관리
      </Typography>
      <Button variant="contained" onClick={() => handleOpen()} sx={{ mb: 2 }}>
        계산방식 추가
      </Button>
      <DataGrid
        autoHeight
        rows={rows}
        columns={columns}
        pageSize={5}
        rowsPerPageOptions={[5, 10]}
        disableSelectionOnClick
      />
      <Dialog 
        open={open} 
        onClose={handleClose} 
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
                onClick={handleClose}
                sx={{ mr: 1 }}
              >
                <ArrowBackIcon />
              </IconButton>
            )}
            <Typography variant={isMobile ? 'h6' : 'h5'}>
              {editing ? '계산방식 수정' : '계산방식 추가'}
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
            label="이름"
            name="name"
            value={form.name}
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
            label="설명"
            name="description"
            value={form.description}
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
            label="수식"
            name="expression"
            value={form.expression}
            onChange={handleChange}
            fullWidth
            size={isMobile ? 'medium' : 'small'}
            helperText="예: unitPrice * quantity * (1 - discount)"
            sx={{
              ...(isMobile && {
                marginBottom: 2,
                '& .MuiInputBase-root': {
                  height: 56,
                },
              }),
            }}
          />
          <FormControlLabel
            control={<Switch checked={form.enabled} onChange={handleSwitch} />}
            label="사용여부"
            sx={{
              ...(isMobile && {
                marginBottom: 2,
              }),
            }}
          />
          <Button 
            onClick={handlePreview} 
            sx={{ 
              mt: 1,
              ...(isMobile && {
                width: '100%',
                height: 48,
                marginBottom: 2,
              }),
            }}
            size={isMobile ? 'large' : 'medium'}
          >
            미리보기
          </Button>
          {preview && (
            <Typography 
              sx={{ 
                mt: 1,
                ...(isMobile && {
                  padding: 2,
                  backgroundColor: theme.palette.action.hover,
                  borderRadius: 1,
                }),
              }}
            >
              {preview}
            </Typography>
          )}
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
    </Box>
  );
}
