import React, { useState } from 'react';
import {
  Box,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Button,
  Grid,
  Typography,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  useMediaQuery,
  Checkbox,
  FormControlLabel,
} from '@mui/material';
import type { SelectChangeEvent } from '@mui/material/Select';
import { Add, Delete } from '@mui/icons-material';

export interface MeasurementRowData {
  space: string;
  productName: string;
  estimateWidth: string;
  estimateHeight: string;
  measuredWidth: string;
  measuredHeight: string;
  lineDirection: string;
  lineLength: string;
  customLineLength?: string;
  memo: string;
  showMemo?: boolean;
}

interface MeasurementFormProps {
  estimateRows: Array<{
    space: string;
    productName: string;
    widthMM: number | string;
    heightMM: number | string;
  }>;
  initialData?: MeasurementRowData[];
  onSave: (data: MeasurementRowData[]) => void;
  onCancel?: () => void;
  onCreateFinalEstimate?: (data: MeasurementRowData[]) => void;
  onAutoSave?: (data: MeasurementRowData[]) => void;
  onDataChange?: (data: MeasurementRowData[]) => void;
  estimateInfo?: {
    estimateNo: string;
    customerName: string;
    customerContact: string;
    customerAddress: string;
    appointmentDate: string;
    appointmentTime: string;
    constructionDate?: string;
    totalAmount: number;
    discountAmount: number;
    finalAmount: number;
    contractAmount: number;
    projectName?: string;
    projectType?: string;
    memo?: string;
  };
}

const lineDirectionOptions = ['좌', '우', '없음'];
const lineLengthOptions = ['90', '120', '150', '180', '210', '직접입력'];

const MeasurementForm: React.FC<MeasurementFormProps> = ({
  estimateRows,
  initialData,
  onSave,
  onCancel,
  onCreateFinalEstimate,
  onAutoSave,
  onDataChange,
  estimateInfo,
}) => {
  // 표의 각 행을 상태로 관리
  const [rows, setRows] = useState<MeasurementRowData[]>(() => {
    // 초기 데이터가 있으면 우선 사용
    if (initialData && initialData.length > 0) {
      console.log('MeasurementForm 초기 데이터 사용:', initialData);
      return initialData;
    }
    
    // 견적서 행이 있으면 견적서 기반으로 초기화
    if (estimateRows.length > 0) {
      console.log('MeasurementForm 견적서 기반 초기화:', estimateRows);
      return estimateRows.map((row, idx) => ({
        space: row.space || '',
        productName: row.productName || '',
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
    }
    
    // 기본 빈 행
    console.log('MeasurementForm 기본 빈 행 생성');
    return [];
  });

  const isMobile = useMediaQuery('(max-width:600px)');

  // 자동 저장 타이머 관리
  const [autoSaveTimer, setAutoSaveTimer] = useState<NodeJS.Timeout | null>(null);

  const handleChange = (
    idx: number,
    field: keyof MeasurementRowData,
    value: string | boolean
  ) => {
    setRows(prev => {
      const newRows = prev.map((row, i) => (i === idx ? { ...row, [field]: value } : row));
      
      // 실시간 데이터 변경 알림
      if (onDataChange) {
        onDataChange(newRows);
      }
      
      // 자동 저장 활성화
      if (onAutoSave) {
        if (autoSaveTimer) {
          clearTimeout(autoSaveTimer);
        }
        const timer = setTimeout(() => {
          console.log('자동 저장 실행:', newRows);
          onAutoSave(newRows);
        }, 3000); // 3초로 단축
        setAutoSaveTimer(timer);
      }
      
      return newRows;
    });
  };

  // Enter 키로 다음 필드 이동 핸들러
  const handleKeyDown = (e: React.KeyboardEvent, currentIdx: number, currentField: string) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      
      // 실측가로와 실측세로만 번갈아가며 이동
      if (currentField === 'measuredWidth') {
        // 실측가로에서 실측세로로 이동
        const nextElement = document.querySelector(`[tabindex="${currentIdx * 2 + 2}"]`) as HTMLElement; // 실측세로
        if (nextElement) {
          nextElement.focus();
          return;
        }
      } else if (currentField === 'measuredHeight') {
        // 실측세로에서 다음 행의 실측가로로 이동
        if (currentIdx < rows.length - 1) {
          const nextRowElement = document.querySelector(`[tabindex="${(currentIdx + 1) * 2 + 1}"]`) as HTMLElement; // 다음 행의 실측가로
          if (nextRowElement) {
            nextRowElement.focus();
            return;
          }
        } else {
          // 마지막 행이면 첫 번째 행의 실측가로로 이동
          const firstRowElement = document.querySelector(`[tabindex="1"]`) as HTMLElement; // 첫 번째 행의 실측가로
          if (firstRowElement) {
            firstRowElement.focus();
            return;
          }
        }
      }
    }
  };

  const handleAddRow = () => {
    setRows(prev => [
      ...prev,
      {
        space: '',
        productName: '',
        estimateWidth: '',
        estimateHeight: '',
        measuredWidth: '',
        measuredHeight: '',
        lineDirection: '',
        lineLength: '',
        customLineLength: '',
        memo: '',
        showMemo: false,
      },
    ]);
  };

  const handleDeleteRow = (idx: number) => {
    setRows(prev => prev.filter((_, i) => i !== idx));
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    // 자동 저장 타이머 정리
    if (autoSaveTimer) {
      clearTimeout(autoSaveTimer);
      setAutoSaveTimer(null);
    }
    onSave(rows);
  };

  // 컴포넌트 언마운트 시 타이머 정리
  React.useEffect(() => {
    return () => {
      if (autoSaveTimer) {
        clearTimeout(autoSaveTimer);
      }
    };
  }, [autoSaveTimer]);

  // 견적서에서 온 행인지 확인
  const isFromEstimate = (idx: number) => idx < estimateRows.length;

  return (
    <Paper
      sx={{
        p: isMobile ? 1 : 2,
        backgroundColor: '#2e3a4a',
        overflowX: 'auto',
      }}
    >
      {/* 견적서 정보 표시 */}
        {estimateInfo && (
          <Box
            sx={{
              mb: 2,
              p: 2,
              backgroundColor: '#1e2a3a',
              borderRadius: 1,
              border: '1px solid #3e4a5a',
            }}
          >
            {/* 첫 번째 행: 기본 정보 */}
            <Grid
              container
              spacing={2}
              sx={{ mb: 1, fontSize: '0.8rem', alignItems: 'center' }}
            >
              <Grid item xs={12} sm={2}>
                <Typography
                  variant="caption"
                  sx={{
                    color: '#b0bec5',
                    display: 'block',
                    fontSize: '0.7rem',
                  }}
                >
                  실측일시
                </Typography>
                <Typography
                  variant="body2"
                  sx={{ color: '#e0e6ed', fontWeight: 'bold' }}
                >
                  {estimateInfo.appointmentDate} {estimateInfo.appointmentTime}
                </Typography>
              </Grid>
              <Grid item xs={12} sm={2}>
                <Typography
                  variant="caption"
                  sx={{
                    color: '#b0bec5',
                    display: 'block',
                    fontSize: '0.7rem',
                  }}
                >
                  견적번호
                </Typography>
                <Typography
                  variant="body2"
                  sx={{ color: '#40c4ff', fontWeight: 'bold' }}
                >
                  {estimateInfo.estimateNo}
                </Typography>
              </Grid>
              <Grid item xs={12} sm={2}>
                <Typography
                  variant="caption"
                  sx={{
                    color: '#b0bec5',
                    display: 'block',
                    fontSize: '0.7rem',
                  }}
                >
                  고객명
                </Typography>
                <Typography
                  variant="body2"
                  sx={{ color: '#e0e6ed', fontWeight: 'bold' }}
                >
                  {estimateInfo.customerName}
                </Typography>
              </Grid>
              <Grid item xs={12} sm={2}>
                <Typography
                  variant="caption"
                  sx={{
                    color: '#b0bec5',
                    display: 'block',
                    fontSize: '0.7rem',
                  }}
                >
                  연락처
                </Typography>
                <Typography variant="body2" sx={{ color: '#e0e6ed' }}>
                  {estimateInfo.customerContact}
                </Typography>
              </Grid>
              <Grid item xs={12} sm={2}>
                <Typography
                  variant="caption"
                  sx={{
                    color: '#b0bec5',
                    display: 'block',
                    fontSize: '0.7rem',
                  }}
                >
                  시공일자
                </Typography>
                <Typography
                  variant="body2"
                  sx={{ color: '#ff9800', fontWeight: 'bold' }}
                >
                  {estimateInfo.constructionDate || '-'}
                </Typography>
              </Grid>
              <Grid item xs={12} sm={2}>
                <Typography
                  variant="caption"
                  sx={{
                    color: '#b0bec5',
                    display: 'block',
                    fontSize: '0.7rem',
                  }}
                >
                  주소
                </Typography>
                <Typography
                  variant="body2"
                  sx={{ color: '#e0e6ed', fontSize: '0.75rem' }}
                >
                  {estimateInfo.customerAddress}
                </Typography>
              </Grid>
            </Grid>

            {/* 두 번째 행: 프로젝트 정보 */}
            <Grid
              container
              spacing={2}
              sx={{ mb: 1, fontSize: '0.8rem', alignItems: 'center' }}
            >
              <Grid item xs={12} sm={3}>
                <Typography
                  variant="caption"
                  sx={{
                    color: '#b0bec5',
                    display: 'block',
                    fontSize: '0.7rem',
                  }}
                >
                  프로젝트명
                </Typography>
                <Typography
                  variant="body2"
                  sx={{ color: '#4caf50', fontWeight: 'bold' }}
                >
                  {estimateInfo.projectName || '-'}
                </Typography>
              </Grid>
              <Grid item xs={12} sm={3}>
                <Typography
                  variant="caption"
                  sx={{
                    color: '#b0bec5',
                    display: 'block',
                    fontSize: '0.7rem',
                  }}
                >
                  타입
                </Typography>
                <Typography
                  variant="body2"
                  sx={{ color: '#ff9800', fontWeight: 'bold' }}
                >
                  {estimateInfo.projectType || '-'}
                </Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography
                  variant="caption"
                  sx={{
                    color: '#b0bec5',
                    display: 'block',
                    fontSize: '0.7rem',
                  }}
                >
                  메모
                </Typography>
                <Typography
                  variant="body2"
                  sx={{ color: '#e0e6ed', fontSize: '0.75rem' }}
                >
                  {estimateInfo.memo || '-'}
                </Typography>
              </Grid>
            </Grid>

            {/* 세 번째 행: 금액 정보 */}
            <Grid
              container
              spacing={2}
              sx={{ fontSize: '0.8rem', alignItems: 'center' }}
            >
              <Grid item xs={12} sm={3}>
                <Typography
                  variant="caption"
                  sx={{
                    color: '#b0bec5',
                    display: 'block',
                    fontSize: '0.7rem',
                  }}
                >
                  소비자금액
                </Typography>
                <Typography
                  variant="body2"
                  sx={{ color: '#ff9800', fontWeight: 'bold' }}
                >
                  {estimateInfo.totalAmount.toLocaleString()}원
                </Typography>
              </Grid>
              <Grid item xs={12} sm={3}>
                <Typography
                  variant="caption"
                  sx={{
                    color: '#b0bec5',
                    display: 'block',
                    fontSize: '0.7rem',
                  }}
                >
                  할인후금액
                </Typography>
                <Typography
                  variant="body2"
                  sx={{ color: '#4caf50', fontWeight: 'bold' }}
                >
                  {estimateInfo.finalAmount.toLocaleString()}원
                </Typography>
              </Grid>
              <Grid item xs={12} sm={3}>
                <Typography
                  variant="caption"
                  sx={{
                    color: '#b0bec5',
                    display: 'block',
                    fontSize: '0.7rem',
                  }}
                >
                  계약금
                </Typography>
                <Typography
                  variant="body2"
                  sx={{
                    color:
                      estimateInfo.contractAmount > 0 ? '#4caf50' : '#f44336',
                    fontWeight: 'bold',
                  }}
                >
                  {estimateInfo.contractAmount > 0
                    ? `${estimateInfo.contractAmount.toLocaleString()}원`
                    : '미입금'}
                </Typography>
              </Grid>
              <Grid item xs={12} sm={3}>
                <Typography
                  variant="caption"
                  sx={{
                    color: '#b0bec5',
                    display: 'block',
                    fontSize: '0.7rem',
                  }}
                >
                  잔금
                </Typography>
                <Typography
                  variant="body2"
                  sx={{ color: '#e0e6ed', fontWeight: 'bold' }}
                >
                  {(
                    estimateInfo.finalAmount - estimateInfo.contractAmount
                  ).toLocaleString()}
                  원
                </Typography>
              </Grid>
            </Grid>
          </Box>
        )}

        <TableContainer>
          <Table
            size="small"
            sx={{ '& .MuiTableCell-root': { padding: '4px 8px' } }}
          >
            <TableHead>
              <TableRow>
                <TableCell sx={{ minWidth: 80, fontSize: '0.8rem' }}>
                  공간
                </TableCell>
                <TableCell sx={{ minWidth: 100, fontSize: '0.8rem' }}>
                  제품명
                </TableCell>
                <TableCell sx={{ minWidth: 120, fontSize: '0.8rem' }}>
                  견적(가로,세로)
                </TableCell>
                <TableCell sx={{ minWidth: 100, fontSize: '0.8rem' }}>
                  실측가로(mm)
                </TableCell>
                <TableCell sx={{ minWidth: 100, fontSize: '0.8rem' }}>
                  실측세로(mm)
                </TableCell>
                <TableCell sx={{ minWidth: 80, fontSize: '0.8rem' }}>
                  줄방향
                </TableCell>
                <TableCell sx={{ minWidth: 100, fontSize: '0.8rem' }}>
                  줄길이
                </TableCell>
                <TableCell sx={{ minWidth: 60, fontSize: '0.8rem' }}>
                  메모
                </TableCell>
                <TableCell
                  align="center"
                  sx={{ minWidth: 50, fontSize: '0.8rem' }}
                >
                  삭제
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {rows.map((row, idx) => (
                <React.Fragment key={idx}>
                  <TableRow>
                    <TableCell>
                      {isFromEstimate(idx) ? (
                        <Typography
                          variant="body2"
                          sx={{ fontWeight: 'bold', color: '#e0e6ed' }}
                        >
                          {row.space}
                        </Typography>
                      ) : (
                        <TextField
                          value={row.space}
                          onChange={e =>
                            handleChange(idx, 'space', e.target.value)
                          }
                          onKeyDown={e => handleKeyDown(e, idx, 'space')}
                          size="small"
                          fullWidth
                          tabIndex={1000 + idx * 4 + 0} // 공간입력: 1000, 1004, 1008, 1012, 1016, 1020, 1024...
                          InputProps={{
                            sx: { fontSize: '0.8rem', height: 32 },
                          }}
                        />
                      )}
                    </TableCell>
                    <TableCell>
                      {isFromEstimate(idx) ? (
                        <Typography variant="body2" sx={{ color: '#e0e6ed' }}>
                          {row.productName}
                        </Typography>
                      ) : (
                        <Typography variant="body2" sx={{ color: '#666' }}>
                          -
                        </Typography>
                      )}
                    </TableCell>
                    <TableCell>
                      {isFromEstimate(idx) ? (
                        <Typography
                          variant="body2"
                          sx={{ color: '#40c4ff', fontWeight: 'bold' }}
                        >
                          {row.estimateWidth}×{row.estimateHeight}
                        </Typography>
                      ) : (
                        <Typography variant="body2" sx={{ color: '#666' }}>
                          -
                        </Typography>
                      )}
                    </TableCell>
                    <TableCell>
                                              <TextField
                          value={row.measuredWidth}
                          onChange={e =>
                            handleChange(idx, 'measuredWidth', e.target.value)
                          }
                          onKeyDown={e => handleKeyDown(e, idx, 'measuredWidth')}
                          size="small"
                          fullWidth
                          type="number"
                          tabIndex={idx * 2 + 1} // 실측가로: 1, 3, 5, 7, 9, 11, 13...
                          InputProps={{
                            sx: { fontSize: '0.8rem', height: 32 },
                            onWheel: e => (e.target as HTMLInputElement).blur(),
                          }}
                        />
                    </TableCell>
                    <TableCell>
                                              <TextField
                          value={row.measuredHeight}
                          onChange={e =>
                            handleChange(idx, 'measuredHeight', e.target.value)
                          }
                          onKeyDown={e => handleKeyDown(e, idx, 'measuredHeight')}
                          size="small"
                          fullWidth
                          type="number"
                          tabIndex={idx * 2 + 2} // 실측세로: 2, 4, 6, 8, 10, 12, 14...
                          InputProps={{
                            sx: { fontSize: '0.8rem', height: 32 },
                            onWheel: e => (e.target as HTMLInputElement).blur(),
                          }}
                        />
                    </TableCell>
                    <TableCell>
                      <FormControl size="small" fullWidth>
                        <Select
                          value={row.lineDirection}
                          onChange={e =>
                            handleChange(idx, 'lineDirection', e.target.value)
                          }
                          onKeyDown={e => handleKeyDown(e, idx, 'lineDirection')}
                          tabIndex={1000 + idx * 4 + 3} // 줄방향: 1003, 1007, 1011, 1015, 1019, 1023, 1027...
                          sx={{ fontSize: '0.8rem', height: 32 }}
                        >
                          <MenuItem value="">선택</MenuItem>
                          {lineDirectionOptions.map(opt => (
                            <MenuItem
                              key={opt}
                              value={opt}
                              sx={{ fontSize: '0.8rem' }}
                            >
                              {opt}
                            </MenuItem>
                          ))}
                        </Select>
                      </FormControl>
                    </TableCell>
                    <TableCell>
                      <FormControl size="small" fullWidth>
                        <Select
                          value={row.lineLength}
                          onChange={e =>
                            handleChange(idx, 'lineLength', e.target.value)
                          }
                          onKeyDown={e => handleKeyDown(e, idx, 'lineLength')}
                          tabIndex={1000 + idx * 4 + 4} // 줄길이: 1004, 1008, 1012, 1016, 1020, 1024, 1028...
                          sx={{ fontSize: '0.8rem', height: 32 }}
                        >
                          <MenuItem value="">선택</MenuItem>
                          {lineLengthOptions.map(opt => (
                            <MenuItem
                              key={opt}
                              value={opt}
                              sx={{ fontSize: '0.8rem' }}
                            >
                              {opt === '직접입력' ? '직접입력' : `${opt}cm`}
                            </MenuItem>
                          ))}
                        </Select>
                      </FormControl>
                      {row.lineLength === '직접입력' && (
                        <TextField
                          value={row.customLineLength}
                          onChange={e =>
                            handleChange(
                              idx,
                              'customLineLength',
                              e.target.value
                            )
                          }
                          onKeyDown={e => handleKeyDown(e, idx, 'customLineLength')}
                          size="small"
                          fullWidth
                          placeholder="줄길이 입력(mm)"
                          tabIndex={1000 + idx * 4 + 5} // 직접입력: 1005, 1009, 1013, 1017, 1021, 1025, 1029...
                          sx={{ mt: 0.5 }}
                          InputProps={{
                            sx: { fontSize: '0.7rem', height: 28 },
                          }}
                        />
                      )}
                    </TableCell>
                    <TableCell align="center">
                                              <Checkbox
                          checked={row.showMemo || false}
                          onChange={e =>
                            handleChange(idx, 'showMemo', e.target.checked)
                          }
                          onKeyDown={e => handleKeyDown(e, idx, 'showMemo')}
                          tabIndex={1000 + idx * 4 + 6} // 메모체크박스: 1006, 1010, 1014, 1018, 1022, 1026, 1030...
                          size="small"
                          sx={{ padding: 0 }}
                        />
                    </TableCell>
                    <TableCell align="center">
                      <Button
                        onClick={() => handleDeleteRow(idx)}
                        color="error"
                        size="small"
                        sx={{ minWidth: 0, padding: '2px' }}
                      >
                        <Delete fontSize="small" />
                      </Button>
                    </TableCell>
                  </TableRow>
                  {/* 메모 행 */}
                  {row.showMemo && (
                    <TableRow>
                      <TableCell colSpan={9}>
                        <TextField
                          value={row.memo}
                          onChange={e =>
                            handleChange(idx, 'memo', e.target.value)
                          }
                          onKeyDown={e => handleKeyDown(e, idx, 'memo')}
                          size="small"
                          fullWidth
                          placeholder="메모를 입력하세요"
                          multiline
                          rows={2}
                          tabIndex={1000 + idx * 4 + 7} // 메모입력: 1007, 1011, 1015, 1019, 1023, 1027, 1031...
                          InputProps={{ sx: { fontSize: '0.8rem' } }}
                        />
                      </TableCell>
                    </TableRow>
                  )}
                </React.Fragment>
              ))}
              <TableRow>
                <TableCell colSpan={9} align="center">
                  <Button
                    onClick={handleAddRow}
                    startIcon={<Add />}
                    color="primary"
                    variant="outlined"
                    size="small"
                  >
                    행 추가
                  </Button>
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </TableContainer>
                {/* 버튼들은 Schedule.tsx에서 처리하므로 여기서는 제거 */}
      </Paper>
  );
};

export default MeasurementForm;
