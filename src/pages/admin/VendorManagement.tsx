import React, { useState, useRef, ChangeEvent, useEffect } from 'react';
import {
  Grid,
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
  Box,
  IconButton,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import FileUploadIcon from '@mui/icons-material/FileUpload';
import FileDownloadIcon from '@mui/icons-material/FileDownload';
import RefreshIcon from '@mui/icons-material/Refresh';
import * as XLSX from 'xlsx';
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';
import type { SelectChangeEvent } from '@mui/material/Select';
import { vendorService } from '../../utils/firebaseDataService';

interface Vendor {
  id: number;
  name: string;
  ceo: string;
  regNumber: string;
  address: string;
  businessType: string;
  businessItem: string;
  email: string;
  tel: string;
  fax: string;
  manager: string;
  kakaoTel: string;
  cargoBranch: string;
  transactionType: string; // '매입' 또는 '매출'
  usageCount: number; // 사용 빈도
  note: string;
}

const initialVendors: Vendor[] = [
  {
    id: 1,
    name: 'A상사',
    ceo: '홍길동',
    regNumber: '123-45-67890',
    address: '서울시 강남구',
    businessType: '도소매',
    businessItem: '섬유',
    email: 'a@vendor.com',
    tel: '02-123-4567',
    fax: '02-123-4568',
    manager: '김담당',
    kakaoTel: '010-1111-2222',
    cargoBranch: '강남지점',
    transactionType: '매입',
    usageCount: 0,
    note: '주거래처',
  },
  {
    id: 2,
    name: 'B상사',
    ceo: '이몽룡',
    regNumber: '234-56-78901',
    address: '부산시 해운대구',
    businessType: '제조',
    businessItem: '원단',
    email: 'b@vendor.com',
    tel: '051-234-5678',
    fax: '051-234-5679',
    manager: '박담당',
    kakaoTel: '010-3333-4444',
    cargoBranch: '부산지점',
    transactionType: '매입',
    usageCount: 0,
    note: '',
  },
];

const initialVendor: Vendor = {
  id: 0,
  name: '',
  ceo: '',
  regNumber: '',
  address: '',
  businessType: '',
  businessItem: '',
  email: '',
  tel: '',
  fax: '',
  manager: '',
  kakaoTel: '',
  cargoBranch: '',
  transactionType: '매입',
  usageCount: 0,
  note: '',
};

const vendorHeaders = [
  '거래처명',
  '대표자명',
  '사업자등록번호',
  '사업장주소',
  '업종',
  '업태',
  'email',
  'tel',
  'fax',
  '담당자명',
  '카톡전화',
  '화물지점',
  '거래구분',
  '사용빈도',
  '비고',
];
const sortKeys: (keyof Vendor)[] = [
  'name',
  'ceo',
  'regNumber',
  'address',
  'businessType',
  'businessItem',
  'email',
  'tel',
  'fax',
  'manager',
  'kakaoTel',
  'cargoBranch',
  'transactionType',
  'usageCount',
  'note',
];

const VENDOR_STORAGE_KEY = 'vendorList';

function loadVendors() {
  try {
    const data = localStorage.getItem(VENDOR_STORAGE_KEY);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
}

function saveVendors(vendors: Vendor[]) {
  localStorage.setItem(VENDOR_STORAGE_KEY, JSON.stringify(vendors));
}

const VendorManagement: React.FC = () => {
  const [vendors, setVendors] = useState<Vendor[]>(() => loadVendors());
  const [selectedVendor, setSelectedVendor] = useState<Vendor>(initialVendor);
  const [editMode, setEditMode] = useState(false);
  const [editIndex, setEditIndex] = useState<number | null>(null);
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState<keyof Vendor | null>(null);
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (vendors.length > 0) {
      saveVendors(vendors);
    }
  }, [vendors]);

  // 검색 필터
  const filteredVendors = vendors.filter(v => {
    const s = search.trim().toLowerCase();
    if (!s) return true;
    return (
      v.name.toLowerCase().includes(s) ||
      v.ceo.toLowerCase().includes(s) ||
      v.regNumber.toLowerCase().includes(s) ||
      v.address.toLowerCase().includes(s) ||
      v.businessType.toLowerCase().includes(s) ||
      v.businessItem.toLowerCase().includes(s) ||
      v.email.toLowerCase().includes(s) ||
      v.tel.toLowerCase().includes(s) ||
      v.fax.toLowerCase().includes(s) ||
      v.manager.toLowerCase().includes(s) ||
      v.kakaoTel.toLowerCase().includes(s) ||
      v.cargoBranch.toLowerCase().includes(s) ||
      v.note.toLowerCase().includes(s)
    );
  });

  // 정렬
  const sortedVendors = sortBy
    ? [...filteredVendors].sort((a, b) => {
        const aValue = a[sortBy];
        const bValue = b[sortBy];
        return sortOrder === 'asc'
          ? String(aValue).localeCompare(String(bValue))
          : String(bValue).localeCompare(String(aValue));
      })
    : filteredVendors;

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setSelectedVendor(prev => ({ ...prev, [name]: value }));
  };

  const handleSelectChange = (e: SelectChangeEvent) => {
    const { name, value } = e.target;
    setSelectedVendor(prev => ({ ...prev, [name]: value }));
  };

  const handleAddVendor = async () => {
    let updatedVendors: Vendor[];
    
    if (editMode && editIndex !== null) {
      updatedVendors = vendors.map((v, idx) =>
        idx === editIndex ? { ...selectedVendor, id: v.id } : v
      );
      setVendors(updatedVendors);
      setEditMode(false);
      setEditIndex(null);
    } else {
      const newVendor = {
        ...selectedVendor,
        id: vendors.length ? vendors[vendors.length - 1].id + 1 : 1,
      };
      updatedVendors = [...vendors, newVendor];
      setVendors(updatedVendors);
    }
    
    // localStorage에 저장
    saveVendors(updatedVendors);
    
    // Firebase에 자동 저장
    try {
      console.log('Firebase에 거래처 데이터 저장 시작');
      if (editMode && editIndex !== null) {
        // 기존 거래처 업데이트
        await vendorService.updateVendor(selectedVendor.id.toString(), selectedVendor);
      } else {
        // 새 거래처 저장
        await vendorService.saveVendor(selectedVendor);
      }
      console.log('Firebase에 거래처 데이터 저장 완료');
    } catch (error) {
      console.error('Firebase 저장 실패:', error);
      alert('거래처 정보가 저장되었지만 Firebase 동기화에 실패했습니다. 인터넷 연결을 확인해주세요.');
    }
    
    setSelectedVendor(initialVendor);
  };

  const handleEdit = (idx: number) => {
    setSelectedVendor(vendors[idx]);
    setEditMode(true);
    setEditIndex(idx);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleCopy = (idx: number) => {
    const copy = {
      ...vendors[idx],
      id: vendors.length ? vendors[vendors.length - 1].id + 1 : 1,
    };
    setVendors(prev => [...prev, copy]);
  };

  const handleDelete = (idx: number) => {
    setVendors(prev => prev.filter((_, i) => i !== idx));
  };

  // Excel Upload
  const handleExcelUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = evt => {
      const data = evt.target?.result;
      if (!data) return;
      const workbook = XLSX.read(data, { type: 'binary' });
      const sheet = workbook.Sheets[workbook.SheetNames[0]];
      const json: any[] = XLSX.utils.sheet_to_json(sheet, { header: 1 });
      const [header, ...rows] = json;
      const mapped = rows.map(row => {
        const obj: any = {};
        vendorHeaders.forEach((h, i) => {
          obj[h] = row[i] ?? '';
        });
        return obj;
      });
      // Convert to Vendor type
      const newVendors: Vendor[] = mapped.map((item, idx) => ({
        id: vendors.length + idx + 1,
        name: item['거래처명'] || '',
        ceo: item['대표자명'] || '',
        regNumber: item['사업자등록번호'] || '',
        address: item['사업장주소'] || '',
        businessType: item['업종'] || '',
        businessItem: item['업태'] || '',
        email: item['email'] || '',
        tel: item['tel'] || '',
        fax: item['fax'] || '',
        manager: item['담당자명'] || '',
        kakaoTel: item['카톡전화'] || '',
        cargoBranch: item['화물지점'] || '',
        transactionType: item['거래구분'] || '매입',
        usageCount: item['사용빈도'] || 0,
        note: item['비고'] || '',
      }));
      setVendors(prev => [...prev, ...newVendors]);
    };
    reader.readAsBinaryString(file);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  // Excel Download (Current Data)
  const handleExcelDownload = () => {
    const data = vendors.map(v => [
      v.name,
      v.ceo,
      v.regNumber,
      v.address,
      v.businessType,
      v.businessItem,
      v.email,
      v.tel,
      v.fax,
      v.manager,
      v.kakaoTel,
      v.cargoBranch,
      v.transactionType,
      v.usageCount,
      v.note,
    ]);
    const ws = XLSX.utils.aoa_to_sheet([vendorHeaders, ...data]);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Vendors');
    XLSX.writeFile(wb, 'vendors.xlsx');
  };

  // Excel Template Download
  const handleTemplateDownload = () => {
    const ws = XLSX.utils.aoa_to_sheet([vendorHeaders]);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Template');
    XLSX.writeFile(wb, 'vendor_template.xlsx');
  };

  // Reset
  const handleReset = () => {
    localStorage.removeItem(VENDOR_STORAGE_KEY);
    setVendors([]);
    setSelectedVendor(initialVendor);
    setEditMode(false);
    setEditIndex(null);
    setSearch('');
    setSortBy(null);
    setSortOrder('asc');
  };

  // 정렬 핸들러
  const handleSort = (key: keyof Vendor) => {
    if (sortBy === key) {
      setSortOrder(prev => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortBy(key);
      setSortOrder('asc');
    }
  };

  // 드래그 기능 비활성화 (사용하지 않음)
  const onDragEnd = (result: any) => {
    // 드래그 기능을 사용하지 않으므로 아무것도 하지 않음
    return;
  };

  return (
    <Grid container spacing={2}>
      <Grid item xs={12}>
        <Box
          sx={{
            display: 'flex',
            gap: 1,
            flexWrap: 'wrap',
            alignItems: 'center',
          }}
        >
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={handleAddVendor}
          >
            {editMode ? '수정 저장' : '거래처 등록'}
          </Button>
          <Button
            variant="contained"
            color="success"
            startIcon={<FileUploadIcon />}
            component="label"
          >
            거래처 업로드
            <input
              type="file"
              accept=".xlsx"
              hidden
              ref={fileInputRef}
              onChange={handleExcelUpload}
            />
          </Button>
          <Button
            variant="contained"
            color="info"
            startIcon={<FileDownloadIcon />}
            onClick={handleExcelDownload}
          >
            거래처 다운로드
          </Button>
          <Button
            variant="outlined"
            color="secondary"
            startIcon={<FileDownloadIcon />}
            onClick={handleTemplateDownload}
          >
            양식 다운로드
          </Button>
          <Button
            variant="outlined"
            color="warning"
            startIcon={<RefreshIcon />}
            onClick={handleReset}
          >
            초기화
          </Button>
          <TextField
            placeholder="검색 (거래처명, 대표자명, 사업자등록번호 등)"
            value={search}
            onChange={(e: ChangeEvent<HTMLInputElement>) =>
              setSearch(e.target.value)
            }
            sx={{ minWidth: 220 }}
          />
        </Box>
      </Grid>
      <Grid item xs={12}>
        <TableContainer component={Paper}>
          <DragDropContext onDragEnd={onDragEnd}>
            <Table size="small">
              <TableHead>
                <TableRow sx={{ height: 32 }}>
                  {vendorHeaders.map((header, idx) => (
                    <TableCell
                      key={header}
                      onClick={() => handleSort(sortKeys[idx])}
                      sx={{ cursor: 'pointer', userSelect: 'none', p: 0.5 }}
                    >
                      {header}
                      {sortBy === sortKeys[idx] &&
                        (sortOrder === 'asc' ? ' ▲' : ' ▼')}
                    </TableCell>
                  ))}
                  <TableCell sx={{ p: 0.5 }}>작업</TableCell>
                </TableRow>
              </TableHead>
              <Droppable droppableId="vendor-table">
                {(droppableProvided: any) => (
                  <TableBody
                    ref={droppableProvided.innerRef}
                    {...droppableProvided.droppableProps}
                  >
                    {sortedVendors.map((vendor, idx) => (
                      <Draggable
                        key={`vendor-${String(vendor.id)}-${String(idx)}`}
                        draggableId={`vendor-${String(vendor.id)}-${String(idx)}`}
                        index={idx}
                      >
                        {(draggableProvided: any) => (
                          <TableRow
                            ref={draggableProvided.innerRef}
                            {...draggableProvided.draggableProps}
                            {...draggableProvided.dragHandleProps}
                            sx={{ height: 32 }}
                          >
                            <TableCell sx={{ p: 0.5 }}>{vendor.name}</TableCell>
                            <TableCell sx={{ p: 0.5 }}>{vendor.ceo}</TableCell>
                            <TableCell sx={{ p: 0.5 }}>
                              {vendor.regNumber}
                            </TableCell>
                            <TableCell sx={{ p: 0.5 }}>
                              {vendor.address}
                            </TableCell>
                            <TableCell sx={{ p: 0.5 }}>
                              {vendor.businessType}
                            </TableCell>
                            <TableCell sx={{ p: 0.5 }}>
                              {vendor.businessItem}
                            </TableCell>
                            <TableCell sx={{ p: 0.5 }}>
                              {vendor.email}
                            </TableCell>
                            <TableCell sx={{ p: 0.5 }}>{vendor.tel}</TableCell>
                            <TableCell sx={{ p: 0.5 }}>{vendor.fax}</TableCell>
                            <TableCell sx={{ p: 0.5 }}>
                              {vendor.manager}
                            </TableCell>
                            <TableCell sx={{ p: 0.5 }}>
                              {vendor.kakaoTel}
                            </TableCell>
                            <TableCell sx={{ p: 0.5 }}>
                              {vendor.cargoBranch}
                            </TableCell>
                            <TableCell sx={{ p: 0.5 }}>
                              {vendor.transactionType}
                            </TableCell>
                            <TableCell sx={{ p: 0.5 }}>
                              {vendor.usageCount}
                            </TableCell>
                            <TableCell sx={{ p: 0.5 }}>{vendor.note}</TableCell>
                            <TableCell sx={{ p: 0.5 }}>
                              <IconButton
                                size="small"
                                onClick={() => handleCopy(idx)}
                                title="복사"
                              >
                                <ContentCopyIcon fontSize="small" />
                              </IconButton>
                              <IconButton
                                size="small"
                                onClick={() => handleEdit(idx)}
                                title="수정"
                              >
                                <EditIcon fontSize="small" />
                              </IconButton>
                              <IconButton
                                size="small"
                                onClick={() => handleDelete(idx)}
                                title="삭제"
                              >
                                <DeleteIcon fontSize="small" />
                              </IconButton>
                            </TableCell>
                          </TableRow>
                        )}
                      </Draggable>
                    ))}
                    {droppableProvided.placeholder}
                  </TableBody>
                )}
              </Droppable>
            </Table>
          </DragDropContext>
        </TableContainer>
      </Grid>
      <Grid item xs={12}>
        <Paper sx={{ p: 2 }}>
          <Typography variant="h6" gutterBottom>
            거래처 상세 정보
          </Typography>
          <Box
            component="form"
            sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}
          >
            <TextField
              label="거래처명"
              name="name"
              value={selectedVendor.name}
              onChange={handleInputChange}
              size="small"
            />
            <TextField
              label="대표자명"
              name="ceo"
              value={selectedVendor.ceo}
              onChange={handleInputChange}
              size="small"
            />
            <TextField
              label="사업자등록번호"
              name="regNumber"
              value={selectedVendor.regNumber}
              onChange={handleInputChange}
              size="small"
            />
            <TextField
              label="사업장주소"
              name="address"
              value={selectedVendor.address}
              onChange={handleInputChange}
              size="small"
            />
            <TextField
              label="업종"
              name="businessType"
              value={selectedVendor.businessType}
              onChange={handleInputChange}
              size="small"
            />
            <TextField
              label="업태"
              name="businessItem"
              value={selectedVendor.businessItem}
              onChange={handleInputChange}
              size="small"
            />
            <TextField
              label="email"
              name="email"
              value={selectedVendor.email}
              onChange={handleInputChange}
              size="small"
            />
            <TextField
              label="tel"
              name="tel"
              value={selectedVendor.tel}
              onChange={handleInputChange}
              size="small"
            />
            <TextField
              label="fax"
              name="fax"
              value={selectedVendor.fax}
              onChange={handleInputChange}
              size="small"
            />
            <TextField
              label="담당자명"
              name="manager"
              value={selectedVendor.manager}
              onChange={handleInputChange}
              size="small"
            />
            <TextField
              label="카톡전화"
              name="kakaoTel"
              value={selectedVendor.kakaoTel}
              onChange={handleInputChange}
              size="small"
            />
            <TextField
              label="화물지점"
              name="cargoBranch"
              value={selectedVendor.cargoBranch}
              onChange={handleInputChange}
              size="small"
            />
            <FormControl size="small" sx={{ minWidth: 120 }}>
              <InputLabel>거래구분</InputLabel>
              <Select
                label="거래구분"
                name="transactionType"
                value={selectedVendor.transactionType || ''}
                onChange={handleSelectChange}
              >
                <MenuItem value="매입">매입</MenuItem>
                <MenuItem value="매출">매출</MenuItem>
              </Select>
            </FormControl>
            <TextField
              label="사용빈도"
              name="usageCount"
              type="number"
              value={selectedVendor.usageCount}
              onChange={handleInputChange}
              size="small"
            />
            <TextField
              label="비고"
              name="note"
              value={selectedVendor.note}
              onChange={handleInputChange}
              size="small"
            />
          </Box>
          {editMode && (
            <Box sx={{ display: 'flex', gap: 1, mt: 2 }}>
              <Button
                variant="contained"
                color="primary"
                onClick={handleAddVendor}
              >
                저장
              </Button>
              <Button
                variant="outlined"
                onClick={() => {
                  setEditMode(false);
                  setEditIndex(null);
                  setSelectedVendor(initialVendor);
                }}
              >
                취소
              </Button>
            </Box>
          )}
        </Paper>
      </Grid>
    </Grid>
  );
};

export default VendorManagement;
