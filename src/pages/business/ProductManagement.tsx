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
  Chip,
  Card,
  CardContent,
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
import BusinessIcon from '@mui/icons-material/Business';
import CategoryIcon from '@mui/icons-material/Category';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import CloudDownloadIcon from '@mui/icons-material/CloudDownload';
import * as XLSX from 'xlsx';
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';
import type { DropResult } from 'react-beautiful-dnd';
import { useLocation } from 'react-router-dom';
import { productService } from '../../utils/firebaseDataService';

interface Product {
  id: number;
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
  firebaseId?: string; // Firebase 문서 ID (선택적)
}

const initialProduct: Product = {
  id: 0,
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
  '거래처명', '브랜드', '제품종류', '제품코드', '제품명', '폭', '최소주문수량',
  '세부내용', '판매단가', '입고원가', '대폭민자단가', '대폭민자원가',
  '원단입고원가(yd)', '가공비', '예상원가', '겉/속', '비고',
];

const sortKeys: (keyof Product)[] = [
  'vendorName', 'brand', 'category', 'productCode', 'productName', 'width',
  'minOrderQty', 'details', 'salePrice', 'purchaseCost', 'largePlainPrice',
  'largePlainCost', 'fabricPurchaseCostYD', 'processingFee', 'estimatedCost',
  'insideOutside', 'note',
];

const PRODUCT_STORAGE_KEY = 'productList';
const VENDOR_STORAGE_KEY = 'vendorList';

function loadProducts() {
  try {
    console.log('localStorage에서 제품 데이터 로드 시작');
    const data = localStorage.getItem(PRODUCT_STORAGE_KEY);
    if (data) {
      const products = JSON.parse(data);
      console.log('localStorage에서 제품 데이터 로드 완료:', products.length, '개');
      return products;
    } else {
      // 제품 개수만 있는 경우
      const count = localStorage.getItem(PRODUCT_STORAGE_KEY + '_count');
      if (count) {
        console.log('localStorage에 제품 개수만 저장되어 있습니다:', count, '개');
      }
      return [];
    }
  } catch (storageError) {
    console.error('localStorage 로드 실패:', storageError);
    return [];
  }
}

// localStorage에만 저장 (개별 수정/삭제용)
function saveProductsToLocal(products: Product[]) {
  try {
    const productsJson = JSON.stringify(products);
    if (productsJson.length > 5 * 1024 * 1024) { // 5MB 이상이면
      console.warn('제품 데이터가 너무 큽니다. localStorage 백업을 건너뜁니다.');
      localStorage.setItem(PRODUCT_STORAGE_KEY + '_count', products.length.toString());
    } else {
      localStorage.setItem(PRODUCT_STORAGE_KEY, productsJson);
    }
    console.log('localStorage에 제품 데이터 저장 완료:', products.length, '개');
  } catch (storageError) {
    console.warn('localStorage 저장 실패:', storageError);
    localStorage.setItem(PRODUCT_STORAGE_KEY + '_count', products.length.toString());
  }
}

// Firebase에 저장 (엑셀 업로드용)
async function saveProductsToFirebase(products: Product[]) {
  try {
    console.log('Firebase에 제품 데이터 저장 시작:', products.length, '개');
    await productService.saveProductsBatch(products);
    console.log('Firebase에 제품 데이터 저장 완료');
    return true;
  } catch (error) {
    console.error('Firebase에 제품 데이터 저장 실패:', error);
    return false;
  }
}

// Firebase에서 제품 데이터 다운로드
async function downloadProductsFromFirebase() {
  try {
    console.log('Firebase에서 제품 데이터 다운로드 시작');
    const firebaseProducts = await productService.getProducts(true); // useStorage = true로 설정
    console.log('Firebase에서 제품 데이터 다운로드 완료:', firebaseProducts.length, '개');
    
    if (firebaseProducts && firebaseProducts.length > 0) {
      // localStorage에 저장
      saveProductsToLocal(firebaseProducts);
      return firebaseProducts;
    } else {
      console.log('Firebase에 저장된 제품 데이터가 없습니다.');
      return null;
    }
  } catch (error) {
    console.error('Firebase에서 제품 데이터 다운로드 실패:', error);
    return null;
  }
}

// 기존 함수는 localStorage 저장용으로 변경
async function saveProducts(products: Product[]) {
  saveProductsToLocal(products);
}

function loadVendors() {
  try {
    const data = localStorage.getItem(VENDOR_STORAGE_KEY);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
}

function saveVendors(vendors: any[]) {
  localStorage.setItem(VENDOR_STORAGE_KEY, JSON.stringify(vendors));
}

const ProductManagement: React.FC = () => {
  const location = useLocation();
  const [products, setProducts] = useState<Product[]>([]);
  const [vendors, setVendors] = useState<any[]>(() => loadVendors());
  const [isLoading, setIsLoading] = useState(true);
  const [selectedProduct, setSelectedProduct] = useState<Product>(initialProduct);


  const [editMode, setEditMode] = useState(false);
  const [editIndex, setEditIndex] = useState<number | null>(null);
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState<keyof Product | null>(null);
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // 탭 상태 관리
  const [vendorTabValue, setVendorTabValue] = useState(0);
  const [categoryTabValue, setCategoryTabValue] = useState(0);
  const [selectedVendor, setSelectedVendor] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<string>('');

  const handleResetLocalStorage = () => {
    if (window.confirm('정말로 로컬스토리지의 모든 데이터를 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.')) {
      if (window.confirm('다시 한번 확인합니다. 정말로 모든 데이터를 초기화하시겠습니까?')) {
        localStorage.clear();
        alert('로컬 스토리지가 초기화되었습니다. 페이지를 새로고침합니다.');
        window.location.reload();
      }
    }
  };

  // 매입 거래처만 필터링하고 사용빈도 순으로 정렬
  const purchaseVendors = vendors
    .filter(vendor => vendor.transactionType === '매입')
    .sort((a, b) => (b.usageCount || 0) - (a.usageCount || 0));

  // 업체별 제품 그룹화
  const vendorGroups = products.reduce((acc, product) => {
    const vendorName = product.vendorName || '미분류';
    if (!acc[vendorName]) acc[vendorName] = {};
    if (!acc[vendorName][product.category]) acc[vendorName][product.category] = [];
    acc[vendorName][product.category].push(product);
    return acc;
  }, {} as { [key: string]: { [key: string]: Product[] } });

  // 업체 목록 (제품이 있는 업체만)
  const vendorList = Object.keys(vendorGroups).sort();

  // 선택된 업체의 제품종류 목록
  const categoryList = selectedVendor 
    ? Object.keys(vendorGroups[selectedVendor] || {}).sort()
    : [];

  // 현재 표시할 제품 목록
  const currentProducts = selectedVendor && selectedCategory
    ? vendorGroups[selectedVendor]?.[selectedCategory] || []
    : [];

  // 검색 필터
  const filteredProducts = currentProducts.filter(p => {
    const s = search.trim().toLowerCase();
    if (!s) return true;
    return (
      p.vendorName.toLowerCase().includes(s) ||
      p.brand.toLowerCase().includes(s) ||
      p.category.toLowerCase().includes(s) ||
      p.productCode.toLowerCase().includes(s) ||
      p.productName.toLowerCase().includes(s)
    );
  });

  // 정렬
  const sortedProducts = sortBy
    ? [...filteredProducts].sort((a, b) => {
        const aValue = a[sortBy];
        const bValue = b[sortBy];
        if (typeof aValue === 'number' && typeof bValue === 'number') {
          return sortOrder === 'asc' ? aValue - bValue : bValue - aValue;
        }
        return sortOrder === 'asc'
          ? String(aValue).localeCompare(String(bValue))
          : String(bValue).localeCompare(String(aValue));
      })
    : filteredProducts;

  // 거래처 선택 시 사용빈도 증가
  const handleVendorSelect = (vendorName: string) => {
    setSelectedProduct(prev => ({ ...prev, vendorName }));
    const updatedVendors = vendors.map(vendor =>
      vendor.name === vendorName
        ? { ...vendor, usageCount: (vendor.usageCount || 0) + 1 }
        : vendor
    );
    setVendors(updatedVendors);
    saveVendors(updatedVendors);
  };

  // 계산 함수들
  const calculateEstimatedCost = (
    insideOutside: string,
    width: string,
    fabricPurchaseCostYD: number,
    processingFee: number
  ): number => {
    const widthNum = parseFloat(width) || 0;
    const fabricCost = Number(fabricPurchaseCostYD) || 0;
    const fee = Number(processingFee) || 0;

    if (insideOutside === '겉') {
      if (widthNum < 2000) {
        return fabricCost * 3 + fee;
      } else {
        return fabricCost * 1.7 + fee;
      }
    } else if (insideOutside === '속') {
      return (fabricCost + fee) * 2.5;
    }
    return 0;
  };

  const calculateLargePlainCost = (
    insideOutside: string,
    fabricPurchaseCostYD: number,
    processingFee: number
  ): number => {
    const fabricCost = Number(fabricPurchaseCostYD) || 0;
    const fee = Number(processingFee) || 0;
    if (insideOutside === '속') {
      return (fabricCost + fee) * 1.5;
    }
    return 0;
  };

  // 자동 계산을 위한 useEffect
  useEffect(() => {
    if (
      selectedProduct.insideOutside &&
      selectedProduct.fabricPurchaseCostYD !== undefined &&
      selectedProduct.processingFee !== undefined
    ) {
      const estimatedCost = calculateEstimatedCost(
        selectedProduct.insideOutside,
        selectedProduct.width,
        selectedProduct.fabricPurchaseCostYD,
        selectedProduct.processingFee
      );

      const largePlainCost = calculateLargePlainCost(
        selectedProduct.insideOutside,
        selectedProduct.fabricPurchaseCostYD,
        selectedProduct.processingFee
      );

      setSelectedProduct(prev => ({
        ...prev,
        estimatedCost: estimatedCost,
        largePlainCost: largePlainCost,
      }));
    }
  }, [
    selectedProduct.insideOutside,
    selectedProduct.width,
    selectedProduct.fabricPurchaseCostYD,
    selectedProduct.processingFee,
  ]);

  // products가 바뀔 때마다 localStorage에 저장 (빈 배열일 때는 저장하지 않음)
  useEffect(() => {
    if (products.length > 0) {
      saveProducts(products);
    }
  }, [products]);

  // 메뉴 이동/진입 시 localStorage에서 불러오기 (빈 배열일 때만)
  useEffect(() => {
    if (products.length === 0) {
      try {
        setIsLoading(true);
        const loadedProducts = loadProducts();
        setProducts(loadedProducts);
      } catch (error) {
        console.error('제품 데이터 로드 실패:', error);
      } finally {
        setIsLoading(false);
      }
    }
    // eslint-disable-next-line
  }, [location.pathname]);

  // 업체 탭 변경 핸들러
  const handleVendorTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setVendorTabValue(newValue);
    const vendorName = vendorList[newValue];
    setSelectedVendor(vendorName);
    
    // 해당 업체의 제품종류 목록 가져오기 (categoryList는 이미 계산됨)
    const categories = Object.keys(vendorGroups[vendorName] || {}).sort();
    
    // 제품종류가 하나만 있으면 바로 선택, 여러 개 있으면 첫 번째 선택
    if (categories.length === 1) {
      setSelectedCategory(categories[0]);
      setCategoryTabValue(0);
    } else if (categories.length > 1) {
      // 커튼과 블라인드가 모두 있는 경우 첫 번째 선택
      setSelectedCategory(categories[0]);
      setCategoryTabValue(0);
    } else {
      setSelectedCategory('');
      setCategoryTabValue(0);
    }
    setSearch('');
  };

  // 제품종류 탭 변경 핸들러
  const handleCategoryTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setCategoryTabValue(newValue);
    const categoryName = categoryList[newValue];
    setSelectedCategory(categoryName);
    setSearch('');
  };

  const handleInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    const { name, value, type } = e.target;
    setSelectedProduct(prev => ({
      ...prev,
      [name]: type === 'number' ? Number(value) : value,
    }));
  };

  const handleSelectChange = (e: SelectChangeEvent) => {
    const { name, value } = e.target;
    if (name === 'vendorName') {
      handleVendorSelect(value);
    } else {
      setSelectedProduct(prev => ({
        ...prev,
        [name as string]: value,
      }));
    }
  };

  // 숫자 필드 클릭 시 0이면 지우기
  const handleNumberFieldClick = (e: React.MouseEvent<HTMLInputElement>) => {
    const target = e.target as HTMLInputElement;
    if (target.value === '0') {
      target.value = '';
    }
  };

  const handleOpenModal = () => {
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditMode(false);
    setEditIndex(null);
    setSelectedProduct(initialProduct);
  };

  const handleAddProduct = async () => {
    // 선택된 업체와 제품종류로 자동 설정
    const productToSave = {
      ...selectedProduct,
      vendorName: selectedVendor || selectedProduct.vendorName,
      category: selectedCategory || selectedProduct.category,
    };

    if (editMode && editIndex !== null) {
      const updated = products.map((p, idx) =>
        idx === editIndex ? { ...productToSave, id: p.id } : p
      );
      setProducts(updated);
      saveProductsToLocal(updated);
    } else {
      const newProduct = {
        ...productToSave,
        id: products.length ? products[products.length - 1].id + 1 : 1,
      };
      const updated = [...products, newProduct];
      setProducts(updated);
      saveProductsToLocal(updated);
    }
    handleCloseModal();
  };

  const handleAddNewClick = () => {
    setEditMode(false);
    setEditIndex(null);
    setSelectedProduct({
      ...initialProduct,
      vendorName: selectedVendor,
      category: selectedCategory,
    });
    handleOpenModal();
  };

  const handleEdit = (idx: number) => {
    setSelectedProduct(sortedProducts[idx]);
    setEditMode(true);
    setEditIndex(products.findIndex(p => p.id === sortedProducts[idx].id));
    handleOpenModal();
  };

  const handleCopy = async (idx: number) => {
    const copy = {
      ...products[idx],
      id: products.length ? products[products.length - 1].id + 1 : 1,
    };
    const updated = [...products, copy];
    setProducts(updated);
    saveProductsToLocal(updated);
  };

  const handleDelete = async (idx: number) => {
    const updated = products.filter((_, i) => i !== idx);
    setProducts(updated);
    saveProductsToLocal(updated);
  };

  // Excel Upload - 모든 시트 처리
  const handleExcelUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async evt => {
      const data = evt.target?.result;
      if (!data) return;
      const workbook = XLSX.read(data, { type: 'binary' });
      
      let allNewProducts: Product[] = [];
      let totalProcessed = 0;
      let vendorCount = 0;
      
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
        
        // 거래처별로 제품 그룹화
        const vendorGroups: { [key: string]: any[] } = {};
        mapped.forEach(item => {
          const vendorName = item['거래처명'] || sheetName;
          if (!vendorGroups[vendorName]) {
            vendorGroups[vendorName] = [];
          }
          vendorGroups[vendorName].push(item);
        });
        
        // 각 거래처별로 제품 생성
        Object.keys(vendorGroups).forEach(vendorName => {
          const vendorProducts = vendorGroups[vendorName];
          const sheetProducts: Product[] = vendorProducts.map((item, idx) => ({
            id: products.length + allNewProducts.length + idx + 1,
            vendorName: vendorName, // 실제 거래처명 사용
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
          vendorCount++;
          
          console.log(`거래처 "${vendorName}"에서 ${sheetProducts.length}개 제품 처리됨`);
        });
      });
      
      if (allNewProducts.length > 0) {
        const updated = [...products, ...allNewProducts];
        setProducts(updated);
        
        // Firebase에 저장 (엑셀 업로드 시)
        const firebaseSuccess = await saveProductsToFirebase(updated);
        
        // localStorage에도 저장
        saveProductsToLocal(updated);
        
        // 성공 메시지 표시
        if (firebaseSuccess) {
          alert(`엑셀 업로드 완료!\n총 ${vendorCount}개 거래처에서 ${totalProcessed}개 제품이 등록되었습니다.\nFirebase와 로컬에 모두 저장되었습니다.`);
        } else {
          alert(`엑셀 업로드 완료!\n총 ${vendorCount}개 거래처에서 ${totalProcessed}개 제품이 등록되었습니다.\nFirebase 저장에 실패했지만 로컬에 저장되었습니다.`);
        }
      } else {
        alert('업로드할 수 있는 제품 데이터가 없습니다.');
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
    
    XLSX.writeFile(wb, `products_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  // Excel Template Download
  const handleTemplateDownload = () => {
    const ws = XLSX.utils.aoa_to_sheet([productHeaders]);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Template');
    XLSX.writeFile(wb, 'product_template.xlsx');
  };

  // Reset 시 localStorage와 상태 모두 초기화
  const handleReset = () => {
    localStorage.removeItem(PRODUCT_STORAGE_KEY);
    setProducts([]);
    setSearch('');
    setSortBy(null);
    setSortOrder('asc');
    setVendorTabValue(0);
    setCategoryTabValue(0);
    setSelectedVendor('');
    setSelectedCategory('');
  };

  // 정렬 핸들러
  const handleSort = (key: keyof Product) => {
    if (sortBy === key) {
      setSortOrder(prev => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortBy(key);
      setSortOrder('asc');
    }
  };

  // 드래그 앤 드롭
  const onDragEnd = async (result: DropResult) => {
    if (!result.destination) return;
    const reordered = Array.from(products);
    const [removed] = reordered.splice(result.source.index, 1);
    reordered.splice(result.destination!.index, 0, removed);
    setProducts(reordered);
    saveProductsToLocal(reordered);
  };

  // 제품업데이트 버튼 핸들러
  const handleUpdateToFirebase = async () => {
    if (products.length === 0) {
      alert('업로드할 제품 데이터가 없습니다.');
      return;
    }

    if (!window.confirm(`현재 ${products.length}개의 제품을 Firebase에 업로드하시겠습니까?`)) {
      return;
    }

    try {
      const success = await saveProductsToFirebase(products);
      if (success) {
        alert(`성공적으로 ${products.length}개의 제품이 Firebase에 업로드되었습니다.`);
      } else {
        alert('Firebase 업로드에 실패했습니다. 다시 시도해주세요.');
      }
    } catch (error) {
      console.error('Firebase 업로드 오류:', error);
      alert('Firebase 업로드 중 오류가 발생했습니다.');
    }
  };

  // Firebase 다운로드 버튼 핸들러
  const handleDownloadFromFirebase = async () => {
    if (!window.confirm('Firebase에서 제품 데이터를 다운로드하시겠습니까?\n현재 로컬 데이터는 백업됩니다.')) {
      return;
    }

    try {
      // 현재 데이터 백업
      const currentProducts = [...products];
      const backupKey = `productList_backup_${Date.now()}`;
      localStorage.setItem(backupKey, JSON.stringify(currentProducts));
      console.log('현재 데이터 백업 완료:', backupKey);

      // Firebase에서 다운로드
      const firebaseProducts = await downloadProductsFromFirebase();
      
      if (firebaseProducts) {
        setProducts(firebaseProducts);
        alert(`Firebase에서 ${firebaseProducts.length}개의 제품을 성공적으로 다운로드했습니다.\n현재 데이터는 ${backupKey}로 백업되었습니다.`);
      } else {
        alert('Firebase에 저장된 제품 데이터가 없습니다.');
      }
    } catch (error) {
      console.error('Firebase 다운로드 오류:', error);
      alert('Firebase 다운로드 중 오류가 발생했습니다.');
    }
  };

  // 백업 복원 핸들러
  const handleRestoreBackup = () => {
    // localStorage에서 백업 키들 찾기
    const backupKeys = Object.keys(localStorage).filter(key => key.startsWith('productList_backup_'));
    
    if (backupKeys.length === 0) {
      alert('복원할 백업 데이터가 없습니다.');
      return;
    }

    // 백업 목록 생성
    const backupList = backupKeys.map(key => {
      const timestamp = key.replace('productList_backup_', '');
      const date = new Date(parseInt(timestamp));
      return {
        key,
        date: date.toLocaleString(),
        timestamp: parseInt(timestamp)
      };
    }).sort((a, b) => b.timestamp - a.timestamp); // 최신순 정렬

    // 백업 선택 대화상자
    const backupOptions = backupList.map((backup, index) => 
      `${index + 1}. ${backup.date} (${backup.key})`
    ).join('\n');

    const selection = prompt(
      `복원할 백업을 선택하세요:\n\n${backupOptions}\n\n번호를 입력하세요 (1-${backupList.length}):`
    );

    if (selection && !isNaN(parseInt(selection))) {
      const selectedIndex = parseInt(selection) - 1;
      if (selectedIndex >= 0 && selectedIndex < backupList.length) {
        const selectedBackup = backupList[selectedIndex];
        
        if (window.confirm(`정말로 ${selectedBackup.date}의 백업으로 복원하시겠습니까?\n현재 데이터는 덮어써집니다.`)) {
          try {
            const backupData = localStorage.getItem(selectedBackup.key);
            if (backupData) {
              const restoredProducts = JSON.parse(backupData);
              setProducts(restoredProducts);
              saveProductsToLocal(restoredProducts);
              alert(`백업이 성공적으로 복원되었습니다.\n${restoredProducts.length}개의 제품이 복원되었습니다.`);
            } else {
              alert('백업 데이터를 읽을 수 없습니다.');
            }
          } catch (error) {
            console.error('백업 복원 오류:', error);
            alert('백업 복원 중 오류가 발생했습니다.');
          }
        }
      } else {
        alert('잘못된 번호를 입력했습니다.');
      }
    }
  };

  // 공간 드롭다운 옵션
  const spaceOptions = [
    '거실', '안방', '드레스룸', '중간방', '끝방', '주방', '직접입력',
  ];

  // 겉/속 드롭다운 옵션
  const insideOutsideOptions = ['겉', '속'];

  // 제품종류 드롭다운 옵션
  const categoryOptions = ['커튼', '블라인드', '기타'];

  // 통계 정보
  const totalProducts = products.length;
  const totalVendors = vendorList.length;
  const totalCategories = Object.values(vendorGroups).reduce((acc, categories) => {
    return acc + Object.keys(categories).length;
  }, 0);

  return (
    <Grid container spacing={2}>
      {/* 상단 통계 및 버튼 */}
      <Grid item xs={12}>
        <Card sx={{ mb: 2 }}>
          <CardContent>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="h6" sx={{ fontWeight: 'bold', color: 'var(--text-color)' }}>
                📦 제품 관리
              </Typography>
              <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                {isLoading && (
                  <Alert severity="info" sx={{ mr: 1 }}>
                    Firebase에서 데이터 로딩 중...
                  </Alert>
                )}
                <Chip label={`총 제품: ${totalProducts}개`} color="primary" />
                <Chip label={`업체: ${totalVendors}개`} color="secondary" />
                <Chip label={`제품종류: ${totalCategories}개`} color="info" />
              </Box>
            </Box>
            <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
              <Button
                variant="contained"
                startIcon={<AddIcon />}
                onClick={handleAddNewClick}
                disabled={!selectedVendor || !selectedCategory}
              >
                제품 등록
              </Button>
              <Button
                variant="contained"
                color="success"
                startIcon={<FileUploadIcon />}
                component="label"
              >
                제품 업로드 (업체별 시트)
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
              <Button
                variant="contained"
                color="error"
                onClick={handleResetLocalStorage}
              >
                로컬스토리지 초기화
              </Button>
              <Button
                variant="contained"
                color="primary"
                startIcon={<CloudUploadIcon />}
                onClick={handleUpdateToFirebase}
                disabled={products.length === 0}
              >
                제품업데이트 (Firebase)
              </Button>
              <Button
                variant="contained"
                color="secondary"
                startIcon={<CloudDownloadIcon />}
                onClick={handleDownloadFromFirebase}
              >
                Firebase 다운로드
              </Button>
              <Button
                variant="outlined"
                color="info"
                startIcon={<RefreshIcon />}
                onClick={handleRestoreBackup}
              >
                백업 복원
              </Button>
            </Box>
          </CardContent>
        </Card>
      </Grid>

      {/* 업체별 탭 */}
      <Grid item xs={12}>
        <Paper sx={{ width: '100%' }}>
          <Box sx={{ 
            display: 'flex', 
            flexDirection: 'column',
            borderBottom: 1,
            borderColor: 'divider'
          }}>
            {/* 첫 번째 줄 */}
            <Box sx={{ 
              display: 'flex', 
              flexWrap: 'wrap',
              gap: 1,
              p: 1,
              minHeight: 64
            }}>
              {vendorList.slice(0, Math.ceil(vendorList.length / 2)).map((vendor, index) => (
                <Box
                  key={vendor}
                  onClick={() => {
                    const vendorIndex = vendorList.indexOf(vendor);
                    handleVendorTabChange({} as React.SyntheticEvent, vendorIndex);
                  }}
                  sx={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: 0.5,
                    minWidth: 80,
                    maxWidth: 120,
                    p: 1,
                    cursor: 'pointer',
                    borderRadius: 1,
                    border: vendorTabValue === vendorList.indexOf(vendor) ? 2 : 1,
                    borderColor: vendorTabValue === vendorList.indexOf(vendor) ? 'primary.main' : 'divider',
                    backgroundColor: vendorTabValue === vendorList.indexOf(vendor) ? 'primary.light' : 'transparent',
                    '&:hover': {
                      backgroundColor: 'action.hover',
                    }
                  }}
                >
                  <Typography 
                    variant="body2" 
                    sx={{ 
                      fontSize: '0.8rem',
                      textAlign: 'center',
                      wordBreak: 'break-word',
                      lineHeight: 1.2,
                      color: 'var(--text-color)',
                      fontWeight: 500
                    }}
                  >
                    {vendor}
                  </Typography>
                  <Chip
                    label={Object.keys(vendorGroups[vendor] || {}).reduce((acc, category) => 
                      acc + (vendorGroups[vendor][category]?.length || 0), 0
                    )}
                    size="small"
                    color="primary"
                    sx={{ fontSize: '0.7rem', height: 18 }}
                  />
                </Box>
              ))}
            </Box>
            
            {/* 두 번째 줄 */}
            <Box sx={{ 
              display: 'flex', 
              flexWrap: 'wrap',
              gap: 1,
              p: 1,
              minHeight: 64
            }}>
              {vendorList.slice(Math.ceil(vendorList.length / 2)).map((vendor, index) => (
                <Box
                  key={vendor}
                  onClick={() => {
                    const vendorIndex = vendorList.indexOf(vendor);
                    handleVendorTabChange({} as React.SyntheticEvent, vendorIndex);
                  }}
                  sx={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: 0.5,
                    minWidth: 80,
                    maxWidth: 120,
                    p: 1,
                    cursor: 'pointer',
                    borderRadius: 1,
                    border: vendorTabValue === vendorList.indexOf(vendor) ? 2 : 1,
                    borderColor: vendorTabValue === vendorList.indexOf(vendor) ? 'primary.main' : 'divider',
                    backgroundColor: vendorTabValue === vendorList.indexOf(vendor) ? 'rgba(25, 118, 210, 0.08)' : 'transparent',
                    '&:hover': {
                      backgroundColor: 'action.hover',
                    }
                  }}
                >
                  <Typography 
                    variant="body2" 
                    sx={{ 
                      fontSize: '0.8rem',
                      textAlign: 'center',
                      wordBreak: 'break-word',
                      lineHeight: 1.2,
                      color: 'var(--text-color)',
                      fontWeight: 500
                    }}
                  >
                    {vendor}
                  </Typography>
                  <Chip
                    label={Object.keys(vendorGroups[vendor] || {}).reduce((acc, category) => 
                      acc + (vendorGroups[vendor][category]?.length || 0), 0
                    )}
                    size="small"
                    color="primary"
                    sx={{ fontSize: '0.7rem', height: 18 }}
                  />
                </Box>
              ))}
            </Box>
          </Box>
        </Paper>
      </Grid>

      {/* 제품종류별 탭 */}
      {selectedVendor && (
        <Grid item xs={12}>
          <Paper sx={{ width: '100%' }}>
            <Tabs
              value={categoryTabValue}
              onChange={handleCategoryTabChange}
              variant="scrollable"
              scrollButtons="auto"
                          sx={{
              borderBottom: 1,
              borderColor: 'divider',
              '& .MuiTab-root': {
                minWidth: 70,
                fontSize: '0.8rem',
                minHeight: 56,
                padding: '6px 10px',
              },
            }}
            >
              {categoryList.map((category, index) => (
                <Tab
                  key={category}
                  label={
                    <Box sx={{ 
                      display: 'flex', 
                      flexDirection: 'column', 
                      alignItems: 'center', 
                      gap: 0.5,
                      minWidth: 70,
                      maxWidth: 100
                    }}>
                      <Typography 
                        variant="body2" 
                        sx={{ 
                          fontSize: '0.75rem',
                          textAlign: 'center',
                          wordBreak: 'break-word',
                          lineHeight: 1.2,
                          color: 'var(--text-color)',
                          fontWeight: 500
                        }}
                      >
                        {category}
                      </Typography>
                      <Chip
                        label={vendorGroups[selectedVendor][category]?.length || 0}
                        size="small"
                        color="secondary"
                        sx={{ fontSize: '0.7rem', height: 16 }}
                      />
                    </Box>
                  }
                  iconPosition="start"
                />
              ))}
            </Tabs>
          </Paper>
        </Grid>
      )}

      {/* 현재 선택된 업체/제품종류 정보 */}
      {selectedVendor && selectedCategory && (
        <Grid item xs={12}>
          <Alert severity="info" sx={{ mb: 2 }}>
            <Typography variant="body2">
              <strong>{selectedVendor}</strong> - <strong>{selectedCategory}</strong>
              {' '}제품 {currentProducts.length}개
            </Typography>
          </Alert>
        </Grid>
      )}

      {/* 검색 및 테이블 */}
      {selectedVendor && selectedCategory ? (
        <>
          <Grid item xs={12}>
            <TextField
              size="small"
              placeholder={`${selectedVendor} - ${selectedCategory} 제품 검색`}
              value={search}
              onChange={(e: ChangeEvent<HTMLInputElement>) =>
                setSearch(e.target.value)
              }
              sx={{ minWidth: 300, mb: 2 }}
            />
          </Grid>
          <Grid item xs={12}>
            <TableContainer component={Paper}>
              <DragDropContext onDragEnd={onDragEnd}>
                <Table size="small">
                  <TableHead>
                    <TableRow sx={{ height: 32 }}>
                      {productHeaders.map((header, idx) => (
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
                  <Droppable droppableId="product-table">
                    {(droppableProvided: any) => (
                      <TableBody
                        ref={droppableProvided.innerRef}
                        {...droppableProvided.droppableProps}
                      >
                        {sortedProducts.map((product, idx) => (
                          <Draggable
                            key={product.firebaseId || `product-${String(product.id)}-${String(idx)}`}
                            draggableId={product.firebaseId || `product-${String(product.id)}-${String(idx)}`}
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
                                  height: 32,
                                }}
                              >
                                <TableCell sx={{ p: 0.5 }}>
                                  {product.vendorName}
                                </TableCell>
                                <TableCell sx={{ p: 0.5 }}>
                                  {product.brand}
                                </TableCell>
                                <TableCell sx={{ p: 0.5 }}>
                                  {product.category}
                                </TableCell>
                                <TableCell sx={{ p: 0.5 }}>
                                  {product.productCode}
                                </TableCell>
                                <TableCell sx={{ p: 0.5 }}>
                                  {product.productName}
                                </TableCell>
                                <TableCell sx={{ p: 0.5 }}>
                                  {product.width}
                                </TableCell>
                                <TableCell sx={{ p: 0.5 }}>
                                  {product.minOrderQty || 0}
                                </TableCell>
                                <TableCell sx={{ p: 0.5 }}>
                                  {product.details}
                                </TableCell>
                                <TableCell sx={{ p: 0.5 }}>
                                  {(product.salePrice || 0).toLocaleString()}
                                </TableCell>
                                <TableCell sx={{ p: 0.5 }}>
                                  {(product.purchaseCost || 0).toLocaleString()}
                                </TableCell>
                                <TableCell sx={{ p: 0.5 }}>
                                  {(product.largePlainPrice || 0).toLocaleString()}
                                </TableCell>
                                <TableCell sx={{ p: 0.5 }}>
                                  {(product.largePlainCost || 0).toLocaleString()}
                                </TableCell>
                                <TableCell sx={{ p: 0.5 }}>
                                  {(
                                    product.fabricPurchaseCostYD || 0
                                  ).toLocaleString()}
                                </TableCell>
                                <TableCell sx={{ p: 0.5 }}>
                                  {(product.processingFee || 0).toLocaleString()}
                                </TableCell>
                                <TableCell sx={{ p: 0.5 }}>
                                  {(product.estimatedCost || 0).toLocaleString()}
                                </TableCell>
                                <TableCell sx={{ p: 0.5 }}>
                                  {product.insideOutside || ''}
                                </TableCell>
                                <TableCell sx={{ p: 0.5 }}>
                                  {product.note}
                                </TableCell>
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
        </>
      ) : (
        <Grid item xs={12}>
          <Paper sx={{ p: 4, textAlign: 'center' }}>
            <Typography variant="h6" color="text.secondary" gutterBottom>
              {!selectedVendor 
                ? '업체를 선택해주세요' 
                : '제품종류를 선택해주세요'
              }
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {!selectedVendor 
                ? '상단의 업체 탭에서 제품을 관리할 업체를 선택하세요.' 
                : '제품종류 탭에서 관리할 제품 종류를 선택하세요.'
              }
            </Typography>
          </Paper>
        </Grid>
      )}

      {/* 제품 등록/수정 다이얼로그 */}
      <Dialog
        open={isModalOpen}
        onClose={handleCloseModal}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          {editMode ? '제품 수정' : '제품 등록'}
          {selectedVendor && selectedCategory && (
            <Typography variant="body2" color="text.secondary">
              {selectedVendor} - {selectedCategory}
            </Typography>
          )}
        </DialogTitle>
        <DialogContent>
          <Box component="form" sx={{ pt: 2 }}>
            <Grid container spacing={2}>
              {/* 기본 정보 */}
              <Grid item xs={12}>
                <Typography variant="subtitle1" gutterBottom>
                  기본 정보
                </Typography>
              </Grid>
              <Grid item xs={12} sm={6} md={4}>
                <FormControl fullWidth size="small">
                  <InputLabel>거래처명</InputLabel>
                  <Select
                    label="거래처명"
                    name="vendorName"
                    value={selectedProduct.vendorName || selectedVendor || ''}
                    onChange={handleSelectChange}
                  >
                    {purchaseVendors.map(vendor => (
                      <MenuItem key={vendor.id} value={vendor.name}>
                        {vendor.name}{' '}
                        {vendor.usageCount > 0
                          ? `(${vendor.usageCount}회 사용)`
                          : ''}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={6} md={4}>
                <TextField
                  fullWidth
                  label="브랜드"
                  name="brand"
                  value={selectedProduct.brand}
                  onChange={handleInputChange}
                  size="small"
                />
              </Grid>
              <Grid item xs={12} sm={6} md={4}>
                <FormControl fullWidth size="small">
                  <InputLabel>제품종류</InputLabel>
                  <Select
                    label="제품종류"
                    name="category"
                    value={selectedProduct.category || selectedCategory || ''}
                    onChange={handleSelectChange}
                  >
                    {categoryOptions.map(opt => (
                      <MenuItem key={opt} value={opt}>
                        {opt}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={6} md={4}>
                <TextField
                  fullWidth
                  label="제품코드"
                  name="productCode"
                  value={selectedProduct.productCode}
                  onChange={handleInputChange}
                  size="small"
                />
              </Grid>
              <Grid item xs={12} sm={6} md={4}>
                <TextField
                  fullWidth
                  label="제품명"
                  name="productName"
                  value={selectedProduct.productName}
                  onChange={handleInputChange}
                  size="small"
                />
              </Grid>
              <Grid item xs={12} sm={6} md={4}>
                <TextField
                  fullWidth
                  label="폭"
                  name="width"
                  value={selectedProduct.width}
                  onChange={handleInputChange}
                  size="small"
                />
              </Grid>
              <Grid item xs={12} sm={6} md={4}>
                <TextField
                  fullWidth
                  label="최소주문수량"
                  name="minOrderQty"
                  type="number"
                  value={selectedProduct.minOrderQty}
                  onChange={handleInputChange}
                  size="small"
                  onClick={handleNumberFieldClick}
                />
              </Grid>
              <Grid item xs={12} sm={6} md={4}>
                <FormControl fullWidth size="small">
                  <InputLabel>겉/속</InputLabel>
                  <Select
                    label="겉/속"
                    name="insideOutside"
                    value={selectedProduct.insideOutside || ''}
                    onChange={handleSelectChange}
                  >
                    {insideOutsideOptions.map(opt => (
                      <MenuItem key={opt} value={opt}>
                        {opt}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>

              {/* 가격 정보 */}
              <Grid item xs={12}>
                <Typography variant="subtitle1" gutterBottom sx={{ mt: 2 }}>
                  가격 정보
                </Typography>
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <TextField
                  fullWidth
                  label="판매단가"
                  name="salePrice"
                  type="number"
                  value={selectedProduct.salePrice}
                  onChange={handleInputChange}
                  size="small"
                  onClick={handleNumberFieldClick}
                />
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <TextField
                  fullWidth
                  label="입고원가"
                  name="purchaseCost"
                  type="number"
                  value={selectedProduct.purchaseCost}
                  onChange={handleInputChange}
                  size="small"
                  onClick={handleNumberFieldClick}
                />
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <TextField
                  fullWidth
                  label="대폭민자단가"
                  name="largePlainPrice"
                  type="number"
                  value={selectedProduct.largePlainPrice}
                  onChange={handleInputChange}
                  size="small"
                  onClick={handleNumberFieldClick}
                />
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <TextField
                  fullWidth
                  label="대폭민자원가"
                  name="largePlainCost"
                  type="number"
                  value={selectedProduct.largePlainCost}
                  onChange={handleInputChange}
                  size="small"
                  onClick={handleNumberFieldClick}
                  helperText={
                    selectedProduct.insideOutside === '속'
                      ? '자동 계산됨: (원단입고원가+가공비)*1.5'
                      : ''
                  }
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>

              {/* 원가 계산 */}
              <Grid item xs={12}>
                <Typography variant="subtitle1" gutterBottom sx={{ mt: 2 }}>
                  원가 계산
                </Typography>
              </Grid>
              <Grid item xs={12} sm={6} md={4}>
                <TextField
                  fullWidth
                  label="원단입고원가(yd)"
                  name="fabricPurchaseCostYD"
                  type="number"
                  value={selectedProduct.fabricPurchaseCostYD}
                  onChange={handleInputChange}
                  size="small"
                  onClick={handleNumberFieldClick}
                />
              </Grid>
              <Grid item xs={12} sm={6} md={4}>
                <TextField
                  fullWidth
                  label="가공비"
                  name="processingFee"
                  type="number"
                  value={selectedProduct.processingFee}
                  onChange={handleInputChange}
                  size="small"
                  onClick={handleNumberFieldClick}
                />
              </Grid>
              <Grid item xs={12} sm={6} md={4}>
                <TextField
                  fullWidth
                  label="예상원가"
                  name="estimatedCost"
                  type="number"
                  value={selectedProduct.estimatedCost}
                  onChange={handleInputChange}
                  size="small"
                  onClick={handleNumberFieldClick}
                  InputLabelProps={{ shrink: true }}
                  helperText={
                    selectedProduct.insideOutside === '겉'
                      ? parseFloat(selectedProduct.width) < 2000
                        ? '자동 계산됨: 원단입고원가*3+가공비'
                        : '자동 계산됨: 원단입고원가*1.7+가공비'
                      : selectedProduct.insideOutside === '속'
                        ? '자동 계산됨: (원단입고원가+가공비)*2.5'
                        : ''
                  }
                />
              </Grid>

              {/* 추가 정보 */}
              <Grid item xs={12}>
                <Typography variant="subtitle1" gutterBottom sx={{ mt: 2 }}>
                  추가 정보
                </Typography>
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="세부내용"
                  name="details"
                  value={selectedProduct.details}
                  onChange={handleInputChange}
                  size="small"
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="비고"
                  name="note"
                  value={selectedProduct.note}
                  onChange={handleInputChange}
                  size="small"
                />
              </Grid>

              {editMode && (
                <Grid item xs={12} container spacing={2}>
                  <Grid item xs={12} sm={6}>
                    <FormControl fullWidth size="small">
                      <InputLabel>공간</InputLabel>
                      <Select
                        label="공간"
                        name="space"
                        value={selectedProduct.space || ''}
                        onChange={handleSelectChange}
                      >
                        {spaceOptions.map(opt => (
                          <MenuItem key={opt} value={opt}>
                            {opt}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  </Grid>
                  {selectedProduct.space === '직접입력' && (
                    <Grid item xs={12} sm={6}>
                      <TextField
                        fullWidth
                        label="공간 직접입력"
                        name="spaceCustom"
                        value={selectedProduct.spaceCustom || ''}
                        onChange={handleInputChange}
                        size="small"
                      />
                    </Grid>
                  )}
                </Grid>
              )}
            </Grid>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseModal}>취소</Button>
          <Button onClick={handleAddProduct} variant="contained">
            {editMode ? '수정 저장' : '제품 등록'}
          </Button>
        </DialogActions>
      </Dialog>
    </Grid>
  );
};

export default ProductManagement; 