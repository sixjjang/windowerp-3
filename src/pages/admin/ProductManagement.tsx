import React, { useState, useRef, useEffect, ChangeEvent } from 'react';
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
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Tabs,
  Tab,
  useMediaQuery,
  useTheme,
  CircularProgress,
  Alert,
} from '@mui/material';
import type { SelectChangeEvent } from '@mui/material/Select';
import AddIcon from '@mui/icons-material/Add';
import FileUploadIcon from '@mui/icons-material/FileUpload';
import FileDownloadIcon from '@mui/icons-material/FileDownload';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import RefreshIcon from '@mui/icons-material/Refresh';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import * as XLSX from 'xlsx';
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';
import type { DropResult } from 'react-beautiful-dnd';
import { useLocation } from 'react-router-dom';
import { productService, vendorService } from '../../utils/firebaseDataService';

interface Product {
  id?: string;
  vendorName: string;
  brand: string;
  category: string;
  productCode: string;
  productName: string;
  width: string;
  minOrderQty: number;
  details: string;
  salePrice: number;
  purchaseCost: number;
  largePlainPrice: number;
  largePlainCost: number;
  fabricPurchaseCostYD: number;
  processingFee: number;
  estimatedCost: number;
  insideOutside: string;
  note: string;
  space: string;
  spaceCustom: string;
  createdAt?: any;
  updatedAt?: any;
}

interface Vendor {
  id?: string;
  name: string;
  transactionType: string;
  usageCount?: number;
  createdAt?: any;
  updatedAt?: any;
}

const initialProduct: Product = {
  vendorName: '',
  brand: '',
  category: '',
  productCode: '',
  productName: '',
  width: '',
  minOrderQty: 0,
  details: '',
  salePrice: 0,
  purchaseCost: 0,
  largePlainPrice: 0,
  largePlainCost: 0,
  fabricPurchaseCostYD: 0,
  processingFee: 0,
  estimatedCost: 0,
  insideOutside: '',
  note: '',
  space: '',
  spaceCustom: '',
};

const productHeaders = [
  '거래처명',
  '브랜드',
  '제품종류',
  '제품코드',
  '제품명',
  '폭',
  '최소주문수량',
  '세부내용',
  '판매단가',
  '입고원가',
  '대폭민자단가',
  '대폭민자원가',
  '원단입고원가(yd)',
  '가공비',
  '예상원가',
  '겉/속',
  '비고',
];

const sortKeys: (keyof Product)[] = [
  'vendorName',
  'brand',
  'category',
  'productCode',
  'productName',
  'width',
  'minOrderQty',
  'details',
  'salePrice',
  'purchaseCost',
  'largePlainPrice',
  'largePlainCost',
  'fabricPurchaseCostYD',
  'processingFee',
  'estimatedCost',
  'insideOutside',
  'note',
];

const ProductManagement: React.FC = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  
  const location = useLocation();
  const [products, setProducts] = useState<Product[]>([]);
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<Product>(initialProduct);
  const [editMode, setEditMode] = useState(false);
  const [editIndex, setEditIndex] = useState<number | null>(null);
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState<keyof Product | null>(null);
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [categoryTabValue, setCategoryTabValue] = useState(0);
  const [categoryAddOpen, setCategoryAddOpen] = useState(false);
  const [newCategory, setNewCategory] = useState('');
  const [vendorTabValue, setVendorTabValue] = useState(0);
  const [vendorAddOpen, setVendorAddOpen] = useState(false);
  const [newVendor, setNewVendor] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Firebase에서 데이터 로드
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        setError(null);
        console.log('Firebase에서 제품 및 거래처 데이터 로드 시작');
        
        // 제품 데이터 로드
        const productsData = await productService.getProducts();
        setProducts(productsData as Product[]);
        
        // 거래처 데이터 로드
        const vendorsData = await vendorService.getVendors();
        setVendors(vendorsData as Vendor[]);
        
        console.log('Firebase 데이터 로드 완료:', {
          products: productsData.length,
          vendors: vendorsData.length
        });
      } catch (error) {
        console.error('Firebase 데이터 로드 실패:', error);
        setError('데이터 로드에 실패했습니다. 인터넷 연결을 확인해주세요.');
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  // 매입 거래처만 필터링하고 사용빈도 순으로 정렬
  const purchaseVendors = vendors
    .filter(vendor => vendor.transactionType === '매입')
    .sort((a, b) => (b.usageCount || 0) - (a.usageCount || 0));

  // 제품종류 옵션 추출
  const categoryOptions = Array.from(new Set(products.map(p => p.category).filter(Boolean)));

  // 선택된 카테고리와 거래처
  const selectedCategory = categoryOptions[categoryTabValue] || '';
  const filteredVendors = Array.from(new Set(
    products
      .filter(p => p.category === selectedCategory)
      .map(p => p.vendorName)
      .filter(Boolean)
  ));
  const selectedVendor = filteredVendors[vendorTabValue] || '';

  // 현재 표시할 제품들
  const currentProducts = products.filter(
    p => p.category === selectedCategory && p.vendorName === selectedVendor
  );

  // 검색 필터링
  const filteredProducts = currentProducts.filter(product =>
    search === '' ||
    product.productName.toLowerCase().includes(search.toLowerCase()) ||
    product.productCode.toLowerCase().includes(search.toLowerCase()) ||
    product.brand.toLowerCase().includes(search.toLowerCase()) ||
    product.vendorName.toLowerCase().includes(search.toLowerCase())
  );

  // 정렬
  const sortedProducts = [...filteredProducts].sort((a, b) => {
    if (!sortBy) return 0;
    const aVal = a[sortBy];
    const bVal = b[sortBy];
    if (typeof aVal === 'string' && typeof bVal === 'string') {
      return sortOrder === 'asc' ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal);
    }
    if (typeof aVal === 'number' && typeof bVal === 'number') {
      return sortOrder === 'asc' ? aVal - bVal : bVal - aVal;
    }
    return 0;
  });

  // 디버깅 정보
  console.log('제품 관리 디버깅:', {
    totalProducts: products.length,
    selectedCategory,
    selectedVendor,
    filteredVendors,
    categoryOptions,
    currentProducts: currentProducts.length,
    allProducts: products.map(p => ({ category: p.category, vendor: p.vendorName, name: p.productName }))
  });

  const handleVendorSelect = (vendorName: string) => {
    setSelectedProduct(prev => ({ ...prev, vendorName }));
  };

  const calculateEstimatedCost = (
    insideOutside: string,
    width: string,
    fabricPurchaseCostYD: number,
    processingFee: number
  ): number => {
    if (!width || !fabricPurchaseCostYD) return 0;
    
    const widthNum = parseFloat(width);
    if (isNaN(widthNum)) return 0;
    
    let costPerMeter = 0;
    if (insideOutside === '겉') {
      costPerMeter = fabricPurchaseCostYD * 1.094 * 2; // 1yd = 1.094m, 겉은 2배
    } else if (insideOutside === '속') {
      costPerMeter = fabricPurchaseCostYD * 1.094; // 1yd = 1.094m
    } else {
      costPerMeter = fabricPurchaseCostYD * 1.094 * 1.5; // 기본값
    }
    
    return costPerMeter + processingFee;
  };

  const calculateLargePlainCost = (
    insideOutside: string,
    fabricPurchaseCostYD: number,
    processingFee: number
  ): number => {
    if (!fabricPurchaseCostYD) return 0;
    
    let costPerMeter = 0;
    if (insideOutside === '겉') {
      costPerMeter = fabricPurchaseCostYD * 1.094 * 2; // 1yd = 1.094m, 겉은 2배
    } else if (insideOutside === '속') {
      costPerMeter = fabricPurchaseCostYD * 1.094; // 1yd = 1.094m
    } else {
      costPerMeter = fabricPurchaseCostYD * 1.094 * 1.5; // 기본값
    }
    
    return costPerMeter + processingFee;
  };

  const handleInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setSelectedProduct(prev => ({ ...prev, [name]: value }));
  };

  const handleSelectChange = (e: SelectChangeEvent) => {
    const { name, value } = e.target;
    setSelectedProduct(prev => ({ ...prev, [name]: value }));
  };

  const handleNumberFieldClick = (e: React.MouseEvent<HTMLInputElement>) => {
    e.currentTarget.select();
  };

  const handleOpenModal = () => {
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedProduct(initialProduct);
    setEditMode(false);
    setEditIndex(null);
  };

  const handleAddProduct = async () => {
    try {
      console.log('Firebase에 제품 데이터 저장 시작');
      
      if (editMode && selectedProduct.id) {
        // 기존 제품 업데이트
        await productService.updateProduct(selectedProduct.id, selectedProduct);
        setProducts(prev => prev.map(p => p.id === selectedProduct.id ? selectedProduct : p));
      } else {
        // 새 제품 저장
        const newProductId = await productService.saveProduct(selectedProduct);
        const newProduct = { ...selectedProduct, id: newProductId };
        setProducts(prev => [...prev, newProduct]);
      }
      
      console.log('Firebase에 제품 데이터 저장 완료');
      handleCloseModal();
    } catch (error) {
      console.error('Firebase 저장 실패:', error);
      alert('제품 저장에 실패했습니다. 인터넷 연결을 확인해주세요.');
    }
  };

  const handleAddNewClick = () => {
    setEditMode(false);
    setEditIndex(null);
    setSelectedProduct(initialProduct);
    handleOpenModal();
  };

  const handleEdit = (idx: number) => {
    setSelectedProduct(sortedProducts[idx]);
    setEditMode(true);
    setEditIndex(idx);
    handleOpenModal();
  };

  const handleCopy = async (idx: number) => {
    try {
      const productToCopy = sortedProducts[idx];
      const newProduct = { ...productToCopy };
      delete newProduct.id; // 새 ID 생성 위해 제거
      
      const newProductId = await productService.saveProduct(newProduct);
      const savedProduct = { ...newProduct, id: newProductId };
      setProducts(prev => [...prev, savedProduct]);
    } catch (error) {
      console.error('제품 복사 실패:', error);
      alert('제품 복사에 실패했습니다.');
    }
  };

  const handleDelete = async (idx: number) => {
    const productToDelete = sortedProducts[idx];
    if (!productToDelete.id) return;
    
    if (window.confirm('정말로 이 제품을 삭제하시겠습니까?')) {
      try {
        await productService.deleteProduct(productToDelete.id);
        setProducts(prev => prev.filter(p => p.id !== productToDelete.id));
      } catch (error) {
        console.error('제품 삭제 실패:', error);
        alert('제품 삭제에 실패했습니다.');
      }
    }
  };

  // Excel Upload - 모든 시트 처리
  const handleExcelUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = async (evt) => {
      const data = evt.target?.result;
      if (!data) return;
      
      try {
        const workbook = XLSX.read(data, { type: 'binary' });
        let allNewProducts: Product[] = [];
        let totalProcessed = 0;
        
        // 모든 시트를 순회하며 처리
        workbook.SheetNames.forEach((sheetName, sheetIndex) => {
          const sheet = workbook.Sheets[sheetName];
          const json: any[] = XLSX.utils.sheet_to_json(sheet, { header: 1 });
          
          if (json.length <= 1) return; // 헤더만 있거나 빈 시트는 건너뛰기
          
          const [header, ...rows] = json;
          const mapped = rows.map(row => {
            const obj: any = {};
            productHeaders.forEach((h, i) => {
              obj[h] = row[i] ?? '';
            });
            return obj;
          });
          
          // Convert to Product type
          const sheetProducts: Product[] = mapped.map((item, idx) => ({
            vendorName: item['거래처명'] || '',
            brand: item['브랜드'] || '',
            category: item['제품종류'] || '',
            productCode: item['제품코드'] || '',
            productName: item['제품명'] || '',
            width: item['폭'] || '',
            minOrderQty: Number(item['최소주문수량']) || 0,
            details: item['세부내용'] || '',
            salePrice: Number(item['판매단가']) || 0,
            purchaseCost: Number(item['입고원가']) || 0,
            largePlainPrice: Number(item['대폭민자단가']) || 0,
            largePlainCost: Number(item['대폭민자원가']) || 0,
            fabricPurchaseCostYD: Number(item['원단입고원가(yd)']) || 0,
            processingFee: Number(item['가공비']) || 0,
            estimatedCost: Number(item['예상원가']) || 0,
            insideOutside: item['겉/속'] || '',
            note: item['비고'] || '',
            space: item['공간'] || '',
            spaceCustom: item['공간 직접입력'] || '',
          }));
          
          allNewProducts = [...allNewProducts, ...sheetProducts];
          totalProcessed += sheetProducts.length;
          
          console.log(`시트 "${sheetName}"에서 ${sheetProducts.length}개 제품 처리됨`);
        });
        
        if (allNewProducts.length > 0) {
          console.log('Firebase에 저장할 제품들:', allNewProducts);
          
          try {
            // 배치 처리로 모든 제품을 한 번에 저장
            console.log(`${allNewProducts.length}개 제품 배치 저장 시작`);
            const result = await productService.saveProductsBatch(allNewProducts);
            console.log('제품 배치 저장 완료:', result);
            
            // 데이터 다시 로드
            try {
              const updatedProducts = await productService.getProducts();
              console.log('Firebase에서 로드된 제품들:', updatedProducts);
              setProducts(updatedProducts as Product[]);
            } catch (error) {
              console.error('제품 목록 다시 로드 실패:', error);
            }
            
            alert(`엑셀 업로드 완료! ${result.savedCount}개 제품이 Firebase에 저장되었습니다.`);
          } catch (error) {
            console.error('제품 배치 저장 실패:', error);
            alert('제품 업로드에 실패했습니다. 다시 시도해주세요.');
          }
        } else {
          alert('업로드할 수 있는 제품 데이터가 없습니다.');
        }
      } catch (error) {
        console.error('엑셀 업로드 실패:', error);
        alert('엑셀 업로드에 실패했습니다.');
      }
    };
    reader.readAsBinaryString(file);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  // Excel Download (Current Data) - 업체별로 시트 분리
  const handleExcelDownload = () => {
    const wb = XLSX.utils.book_new();
    
    // 업체별로 제품 그룹화
    const vendorGroups: { [key: string]: Product[] } = {};
    products.forEach(product => {
      const vendorName = product.vendorName || '미분류';
      if (!vendorGroups[vendorName]) {
        vendorGroups[vendorName] = [];
      }
      vendorGroups[vendorName].push(product);
    });
    
    // 각 업체별로 시트 생성
    Object.keys(vendorGroups).forEach(vendorName => {
      const vendorProducts = vendorGroups[vendorName];
      const data = vendorProducts.map(p => [
        p.vendorName,
        p.brand,
        p.category,
        p.productCode,
        p.productName,
        p.width,
        p.minOrderQty,
        p.details,
        p.salePrice,
        p.purchaseCost,
        p.largePlainPrice,
        p.largePlainCost,
        p.fabricPurchaseCostYD,
        p.processingFee,
        p.estimatedCost,
        p.insideOutside,
        p.note,
      ]);
      
      const ws = XLSX.utils.aoa_to_sheet([productHeaders, ...data]);
      XLSX.utils.book_append_sheet(wb, ws, vendorName);
    });
    
    XLSX.writeFile(wb, `제품목록_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  const handleTemplateDownload = () => {
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.aoa_to_sheet([productHeaders]);
    XLSX.utils.book_append_sheet(wb, ws, '제품목록_양식');
    XLSX.writeFile(wb, '제품목록_양식.xlsx');
  };

  const handleReset = () => {
    setSearch('');
    setSortBy(null);
    setSortOrder('asc');
    setCategoryTabValue(0);
    setVendorTabValue(0);
  };

  const handleSort = (key: keyof Product) => {
    if (sortBy === key) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(key);
      setSortOrder('asc');
    }
  };

  const onDragEnd = (result: DropResult) => {
    if (!result.destination) return;
    
    const items = Array.from(sortedProducts);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);
    
    // Firebase에서 순서 업데이트는 복잡하므로 일단 로컬 상태만 업데이트
    // 실제로는 각 제품에 order 필드를 추가하여 관리해야 함
  };

  const handleCategoryTabChange = (e: React.SyntheticEvent, newValue: number) => {
    setCategoryTabValue(newValue);
    setVendorTabValue(0);
  };

  const handleAddCategory = () => {
    if (newCategory && !categoryOptions.includes(newCategory)) {
      setCategoryTabValue(categoryOptions.length);
      setNewCategory('');
      setCategoryAddOpen(false);
    }
  };

  const handleVendorTabChange = (e: React.SyntheticEvent, newValue: number) => {
    setVendorTabValue(newValue);
  };

  const handleAddVendor = async () => {
    if (newVendor && !vendors.map(v => v.name).includes(newVendor)) {
      try {
        const vendorData = { name: newVendor, transactionType: '매입' };
        await vendorService.saveVendor(vendorData);
        
        // 거래처 목록 다시 로드
        const updatedVendors = await vendorService.getVendors();
        setVendors(updatedVendors as Vendor[]);
        
        setVendorTabValue(vendors.length);
        setNewVendor('');
        setVendorAddOpen(false);
      } catch (error) {
        console.error('거래처 추가 실패:', error);
        alert('거래처 추가에 실패했습니다.');
      }
    }
  };



  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
        <Typography variant="h6" sx={{ ml: 2 }}>
          Firebase에서 데이터를 불러오는 중...
        </Typography>
      </Box>
    );
  }

  if (error) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <Alert severity="error" sx={{ maxWidth: 600 }}>
          <Typography variant="h6">데이터 로드 실패</Typography>
          <Typography>{error}</Typography>
          <Button 
            variant="contained" 
            onClick={() => window.location.reload()} 
            sx={{ mt: 2 }}
          >
            다시 시도
          </Button>
        </Alert>
      </Box>
    );
  }

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
            onClick={handleAddNewClick}
          >
            제품 등록
          </Button>
          <Button
            variant="contained"
            color="success"
            startIcon={<FileUploadIcon />}
            component="label"
          >
            제품 업로드 (다중시트 지원)
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
            제품 다운로드
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
            size="small"
            placeholder="검색 (제품명, 코드, 브랜드, 거래처명)"
            value={search}
            onChange={(e: ChangeEvent<HTMLInputElement>) =>
              setSearch(e.target.value)
            }
            sx={{ minWidth: 220 }}
          />
        </Box>
      </Grid>
      
      <Grid item xs={12}>
        <Paper sx={{ width: '100%', display: 'flex', alignItems: 'center', mb: 2 }}>
          <Tabs
            value={categoryTabValue}
            onChange={handleCategoryTabChange}
            variant="scrollable"
            scrollButtons="auto"
            sx={{ borderBottom: 1, borderColor: 'divider', flex: 1 }}
          >
            {categoryOptions.map((category, idx) => (
              <Tab key={category} label={category} />
            ))}
          </Tabs>
          <IconButton onClick={() => setCategoryAddOpen(true)} color="primary" sx={{ ml: 1 }}>
            <AddIcon />
          </IconButton>
        </Paper>
      </Grid>
      
      {filteredVendors.length > 0 && (
        <Grid item xs={12}>
          <Paper sx={{ width: '100%', display: 'flex', alignItems: 'center', mb: 2, overflowX: 'auto', whiteSpace: 'nowrap' }}>
            <Tabs
              value={vendorTabValue}
              onChange={handleVendorTabChange}
              variant="scrollable"
              scrollButtons="auto"
              sx={{ borderBottom: 1, borderColor: 'divider', flex: 1 }}
            >
              {filteredVendors.map((vendor, idx) => (
                <Tab key={vendor} label={vendor} />
              ))}
            </Tabs>
            <IconButton onClick={() => setVendorAddOpen(true)} color="primary" sx={{ ml: 1 }}>
              <AddIcon />
            </IconButton>
          </Paper>
        </Grid>
      )}
      
      {filteredVendors.length === 0 && categoryOptions.length > 0 && (
        <Grid item xs={12}>
          <Paper sx={{ p: 4, textAlign: 'center' }}>
            <Typography variant="h6" color="text.secondary" gutterBottom>
              선택된 제품종류에 등록된 거래처가 없습니다
            </Typography>
            <Typography variant="body2" color="text.secondary">
              제품을 등록하면 해당 거래처가 자동으로 추가됩니다.
            </Typography>
          </Paper>
        </Grid>
      )}
      
      {categoryOptions.length === 0 && (
        <Grid item xs={12}>
          <Paper sx={{ p: 4, textAlign: 'center' }}>
            <Typography variant="h6" color="text.secondary" gutterBottom>
              등록된 제품이 없습니다
            </Typography>
            <Typography variant="body2" color="text.secondary">
              제품을 등록하거나 엑셀 파일을 업로드해주세요.
            </Typography>
          </Paper>
        </Grid>
      )}
      
      <Grid item xs={12}>
        <TableContainer component={Paper}>
          <DragDropContext onDragEnd={onDragEnd}>
            <Table size="small">
              <TableHead>
                <TableRow sx={{ height: 40 }}>
                  {productHeaders.map((header, idx) => (
                    <TableCell
                      key={header}
                      onClick={() => handleSort(sortKeys[idx])}
                      sx={{
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        maxWidth: 140,
                        fontWeight: 'bold',
                        fontSize: '1rem',
                        p: 1,
                        cursor: 'pointer',
                        userSelect: 'none',
                      }}
                      title={header}
                      align="center"
                    >
                      {header}
                      {sortBy === sortKeys[idx] && (sortOrder === 'asc' ? ' ▲' : ' ▼')}
                    </TableCell>
                  ))}
                  <TableCell sx={{ p: 1, fontWeight: 'bold', fontSize: '1rem', whiteSpace: 'nowrap' }} align="center">작업</TableCell>
                </TableRow>
              </TableHead>
              <Droppable droppableId="product-table">
                {(droppableProvided: any) => (
                  <TableBody
                    ref={droppableProvided.innerRef}
                    {...droppableProvided.droppableProps}
                  >
                    {sortedProducts.map((product, idx) => (
                      <Draggable
                        key={product.id || idx}
                        draggableId={String(product.id || idx)}
                        index={idx}
                      >
                        {(draggableProvided: any) => (
                          <TableRow
                            ref={draggableProvided.innerRef}
                            {...draggableProvided.draggableProps}
                            {...draggableProvided.dragHandleProps}
                            sx={{
                              background:
                                editIndex === idx ? '#f0f4ff' : undefined,
                              height: 40,
                              fontSize: '0.95rem',
                              '&:hover': {
                                background: '#222',
                              },
                            }}
                          >
                            <TableCell sx={{ p: 1, whiteSpace: 'nowrap', maxWidth: 140, overflow: 'hidden', textOverflow: 'ellipsis' }} align="center">
                              {product.vendorName}
                            </TableCell>
                            <TableCell sx={{ p: 1, whiteSpace: 'nowrap', maxWidth: 140, overflow: 'hidden', textOverflow: 'ellipsis' }} align="center">
                              {product.brand}
                            </TableCell>
                            <TableCell sx={{ p: 1, whiteSpace: 'nowrap', maxWidth: 140, overflow: 'hidden', textOverflow: 'ellipsis' }} align="center">
                              {product.category}
                            </TableCell>
                            <TableCell sx={{ p: 1, whiteSpace: 'nowrap', maxWidth: 140, overflow: 'hidden', textOverflow: 'ellipsis' }} align="center">
                              {product.productCode}
                            </TableCell>
                            <TableCell sx={{ p: 1, whiteSpace: 'nowrap', maxWidth: 140, overflow: 'hidden', textOverflow: 'ellipsis' }} align="center">
                              {product.productName}
                            </TableCell>
                            <TableCell sx={{ p: 1, whiteSpace: 'nowrap', maxWidth: 140, overflow: 'hidden', textOverflow: 'ellipsis' }} align="center">
                              {product.width}
                            </TableCell>
                            <TableCell sx={{ p: 1, whiteSpace: 'nowrap', maxWidth: 140, overflow: 'hidden', textOverflow: 'ellipsis' }} align="center">
                              {product.minOrderQty}
                            </TableCell>
                            <TableCell sx={{ p: 1, whiteSpace: 'nowrap', maxWidth: 140, overflow: 'hidden', textOverflow: 'ellipsis' }} align="center">
                              {product.details}
                            </TableCell>
                            <TableCell sx={{ p: 1, whiteSpace: 'nowrap', maxWidth: 140, overflow: 'hidden', textOverflow: 'ellipsis' }} align="center">
                              {product.salePrice.toLocaleString()}
                            </TableCell>
                            <TableCell sx={{ p: 1, whiteSpace: 'nowrap', maxWidth: 140, overflow: 'hidden', textOverflow: 'ellipsis' }} align="center">
                              {product.purchaseCost.toLocaleString()}
                            </TableCell>
                            <TableCell sx={{ p: 1, whiteSpace: 'nowrap', maxWidth: 140, overflow: 'hidden', textOverflow: 'ellipsis' }} align="center">
                              {product.largePlainPrice.toLocaleString()}
                            </TableCell>
                            <TableCell sx={{ p: 1, whiteSpace: 'nowrap', maxWidth: 140, overflow: 'hidden', textOverflow: 'ellipsis' }} align="center">
                              {product.largePlainCost.toLocaleString()}
                            </TableCell>
                            <TableCell sx={{ p: 1, whiteSpace: 'nowrap', maxWidth: 140, overflow: 'hidden', textOverflow: 'ellipsis' }} align="center">
                              {product.fabricPurchaseCostYD.toLocaleString()}
                            </TableCell>
                            <TableCell sx={{ p: 1, whiteSpace: 'nowrap', maxWidth: 140, overflow: 'hidden', textOverflow: 'ellipsis' }} align="center">
                              {product.processingFee.toLocaleString()}
                            </TableCell>
                            <TableCell sx={{ p: 1, whiteSpace: 'nowrap', maxWidth: 140, overflow: 'hidden', textOverflow: 'ellipsis' }} align="center">
                              {product.estimatedCost.toLocaleString()}
                            </TableCell>
                            <TableCell sx={{ p: 1, whiteSpace: 'nowrap', maxWidth: 140, overflow: 'hidden', textOverflow: 'ellipsis' }} align="center">
                              {product.insideOutside}
                            </TableCell>
                            <TableCell sx={{ p: 1, whiteSpace: 'nowrap', maxWidth: 140, overflow: 'hidden', textOverflow: 'ellipsis' }} align="center">
                              {product.note}
                            </TableCell>
                            <TableCell sx={{ p: 1, whiteSpace: 'nowrap' }} align="center">
                              <Box sx={{ display: 'flex', gap: 0.5, justifyContent: 'center' }}>
                                <IconButton
                                  size="small"
                                  onClick={() => handleEdit(idx)}
                                  sx={{ color: 'primary.main' }}
                                >
                                  <EditIcon fontSize="small" />
                                </IconButton>
                                <IconButton
                                  size="small"
                                  onClick={() => handleCopy(idx)}
                                  sx={{ color: 'info.main' }}
                                >
                                  <ContentCopyIcon fontSize="small" />
                                </IconButton>
                                <IconButton
                                  size="small"
                                  onClick={() => handleDelete(idx)}
                                  sx={{ color: 'error.main' }}
                                >
                                  <DeleteIcon fontSize="small" />
                                </IconButton>
                              </Box>
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

      {/* 제품 등록/수정 모달 */}
      <Dialog open={isModalOpen} onClose={handleCloseModal} maxWidth="md" fullWidth>
        <DialogTitle>
          {editMode ? '제품 수정' : '제품 등록'}
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="거래처명"
                name="vendorName"
                value={selectedProduct.vendorName}
                onChange={handleInputChange}
                required
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="브랜드"
                name="brand"
                value={selectedProduct.brand}
                onChange={handleInputChange}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel>제품종류</InputLabel>
                <Select
                  name="category"
                  value={selectedProduct.category}
                  onChange={handleSelectChange}
                  label="제품종류"
                >
                  {categoryOptions.map(opt => (
                    <MenuItem key={opt} value={opt}>
                      {opt}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="제품코드"
                name="productCode"
                value={selectedProduct.productCode}
                onChange={handleInputChange}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="제품명"
                name="productName"
                value={selectedProduct.productName}
                onChange={handleInputChange}
                required
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="폭"
                name="width"
                value={selectedProduct.width}
                onChange={handleInputChange}
                onClick={handleNumberFieldClick}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="최소주문수량"
                name="minOrderQty"
                type="number"
                value={selectedProduct.minOrderQty}
                onChange={handleInputChange}
                onClick={handleNumberFieldClick}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="세부내용"
                name="details"
                value={selectedProduct.details}
                onChange={handleInputChange}
                multiline
                rows={2}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="판매단가"
                name="salePrice"
                type="number"
                value={selectedProduct.salePrice}
                onChange={handleInputChange}
                onClick={handleNumberFieldClick}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="입고원가"
                name="purchaseCost"
                type="number"
                value={selectedProduct.purchaseCost}
                onChange={handleInputChange}
                onClick={handleNumberFieldClick}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="대폭민자단가"
                name="largePlainPrice"
                type="number"
                value={selectedProduct.largePlainPrice}
                onChange={handleInputChange}
                onClick={handleNumberFieldClick}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="대폭민자원가"
                name="largePlainCost"
                type="number"
                value={selectedProduct.largePlainCost}
                onChange={handleInputChange}
                onClick={handleNumberFieldClick}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="원단입고원가(yd)"
                name="fabricPurchaseCostYD"
                type="number"
                value={selectedProduct.fabricPurchaseCostYD}
                onChange={handleInputChange}
                onClick={handleNumberFieldClick}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="가공비"
                name="processingFee"
                type="number"
                value={selectedProduct.processingFee}
                onChange={handleInputChange}
                onClick={handleNumberFieldClick}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="예상원가"
                name="estimatedCost"
                type="number"
                value={selectedProduct.estimatedCost}
                onChange={handleInputChange}
                onClick={handleNumberFieldClick}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel>겉/속</InputLabel>
                <Select
                  name="insideOutside"
                  value={selectedProduct.insideOutside}
                  onChange={handleSelectChange}
                  label="겉/속"
                >
                  <MenuItem value="겉">겉</MenuItem>
                  <MenuItem value="속">속</MenuItem>
                  <MenuItem value="겉/속">겉/속</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="비고"
                name="note"
                value={selectedProduct.note}
                onChange={handleInputChange}
                multiline
                rows={2}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseModal}>취소</Button>
          <Button onClick={handleAddProduct} variant="contained">
            {editMode ? '수정' : '등록'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* 카테고리 추가 모달 */}
      <Dialog open={categoryAddOpen} onClose={() => setCategoryAddOpen(false)}>
        <DialogTitle>제품종류 추가</DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            label="제품종류명"
            value={newCategory}
            onChange={(e) => setNewCategory(e.target.value)}
            sx={{ mt: 1 }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCategoryAddOpen(false)}>취소</Button>
          <Button onClick={handleAddCategory} variant="contained">
            추가
          </Button>
        </DialogActions>
      </Dialog>

      {/* 거래처 추가 모달 */}
      <Dialog open={vendorAddOpen} onClose={() => setVendorAddOpen(false)}>
        <DialogTitle>거래처 추가</DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            label="거래처명"
            value={newVendor}
            onChange={(e) => setNewVendor(e.target.value)}
            sx={{ mt: 1 }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setVendorAddOpen(false)}>취소</Button>
          <Button onClick={handleAddVendor} variant="contained">
            추가
          </Button>
        </DialogActions>
      </Dialog>
    </Grid>
  );
};

export default ProductManagement;
