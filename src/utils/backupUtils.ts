import * as XLSX from 'xlsx';
import { 
  estimateService,
  customerService, 
  contractService, 
  orderService, 
  productService, 
  optionService, 
  vendorService, 
  measurementService, 
  companyInfoService, 
  userService, 
  deliveryService 
} from './firebaseDataService';

// 백업 데이터 타입 정의 (Firebase 기반)
export interface BackupData {
  estimates: any[];
  contracts: any[];
  orders: any[];
  deliveries: any[];
  customers: any[];
  products: any[];
  options: any[];
  vendors: any[];
  schedules: any[];
  measurements: any[];
  companyInfo: any[];
  users: any[];
  backupDate: string;
  version: string;
  firebaseBackup: boolean;
}

// Firebase 데이터 로드 유틸리티
const loadFirebaseData = async (serviceName: string, methodName: string, fallbackKey: string) => {
  try {
    console.log(`Firebase에서 ${serviceName}.${methodName} 로드 시작`);
    
    // 서비스별 메서드 호출
    let data;
    switch (serviceName) {
      case 'estimateService':
        if (methodName === 'getEstimates') {
          data = await estimateService.getEstimates();
        } else {
          throw new Error(`지원하지 않는 메서드: ${methodName}`);
        }
        break;
      case 'customerService':
        if (methodName === 'getCustomers') {
          data = await customerService.getCustomers();
        } else {
          throw new Error(`지원하지 않는 메서드: ${methodName}`);
        }
        break;
      case 'contractService':
        if (methodName === 'getContracts') {
          data = await contractService.getContracts();
        } else {
          throw new Error(`지원하지 않는 메서드: ${methodName}`);
        }
        break;
      case 'orderService':
        if (methodName === 'getOrders') {
          data = await orderService.getOrders();
        } else {
          throw new Error(`지원하지 않는 메서드: ${methodName}`);
        }
        break;
      case 'productService':
        if (methodName === 'getProducts') {
          data = await productService.getProducts(true);
        } else {
          throw new Error(`지원하지 않는 메서드: ${methodName}`);
        }
        break;
      case 'optionService':
        if (methodName === 'getOptions') {
          data = await optionService.getOptions();
        } else {
          throw new Error(`지원하지 않는 메서드: ${methodName}`);
        }
        break;
      case 'vendorService':
        if (methodName === 'getVendors') {
          data = await vendorService.getVendors();
        } else {
          throw new Error(`지원하지 않는 메서드: ${methodName}`);
        }
        break;
      case 'measurementService':
        if (methodName === 'getMeasurements') {
          data = await measurementService.getMeasurements();
        } else {
          throw new Error(`지원하지 않는 메서드: ${methodName}`);
        }
        break;
      case 'companyInfoService':
        if (methodName === 'getCompanyInfo') {
          data = await companyInfoService.getCompanyInfo();
        } else {
          throw new Error(`지원하지 않는 메서드: ${methodName}`);
        }
        break;
      case 'userService':
        if (methodName === 'getUsers') {
          data = await userService.getUsers();
        } else {
          throw new Error(`지원하지 않는 메서드: ${methodName}`);
        }
        break;
      case 'deliveryService':
        if (methodName === 'getDeliveries') {
          data = await deliveryService.getDeliveries();
        } else {
          throw new Error(`지원하지 않는 메서드: ${methodName}`);
        }
        break;
      default:
        throw new Error(`알 수 없는 서비스: ${serviceName}`);
    }
    
    console.log(`Firebase에서 ${serviceName}.${methodName} 로드 완료:`, data?.length || 0, '개');
    return Array.isArray(data) ? data : [];
  } catch (error) {
    console.warn(`Firebase ${serviceName}.${methodName} 로드 실패, localStorage fallback 사용:`, error);
    // Firebase 실패 시 localStorage fallback
    try {
      const fallbackData = JSON.parse(localStorage.getItem(fallbackKey) || '[]');
      console.log(`localStorage fallback ${fallbackKey}:`, fallbackData.length, '개');
      return fallbackData;
    } catch (localError) {
      console.error(`localStorage fallback ${fallbackKey} 실패:`, localError);
      return [];
    }
  }
};

// 개별 데이터 다운로드 함수들 (Firebase 우선, localStorage fallback)
export const downloadEstimates = async () => {
  try {
    console.log('견적서 백업 시작');
    
    // Firebase에서 견적서 목록 가져오기
    let estimates: any[] = [];
    try {
      estimates = await estimateService.getEstimates();
      console.log('Firebase에서 견적서 목록 로드:', estimates.length, '개');
    } catch (error) {
      console.warn('Firebase 견적서 로드 실패, localStorage 사용:', error);
    }
    
    // localStorage에서 전체 견적서 내용 가져오기 (Firebase 실패 시 또는 보완용)
    let fullEstimates: any[] = [];
    try {
      const savedEstimates = JSON.parse(localStorage.getItem('saved_estimates') || '[]');
      console.log('localStorage에서 견적서 전체 내용 로드:', savedEstimates.length, '개');
      fullEstimates = savedEstimates;
    } catch (error) {
      console.error('localStorage 견적서 로드 실패:', error);
    }
    
    // Firebase 데이터와 localStorage 데이터 병합
    const mergedEstimates = estimates.map((firebaseEst: any) => {
      const localEst = fullEstimates.find((local: any) => 
        local.estimateNo === firebaseEst.estimateNo || 
        local.id === firebaseEst.id
      );
      return localEst || firebaseEst; // localStorage에 있으면 전체 내용, 없으면 Firebase 데이터
    });
    
    // localStorage에만 있는 견적서들도 추가
    const onlyLocalEstimates = fullEstimates.filter((localEst: any) => 
      !estimates.some((firebaseEst: any) => 
        firebaseEst.estimateNo === localEst.estimateNo || 
        firebaseEst.id === localEst.id
      )
    );
    
    const finalEstimates = [...mergedEstimates, ...onlyLocalEstimates];
    
    if (finalEstimates.length === 0) {
      console.warn('백업할 견적서 데이터가 없습니다.');
      return false;
    }

    console.log('최종 백업할 견적서:', finalEstimates.length, '개');
    
    // 견적서 내용 상세 분석
    const estimateAnalysis = finalEstimates.map(est => ({
      estimateNo: est.estimateNo,
      customerName: est.customerName,
      hasRows: Array.isArray(est.rows) && est.rows.length > 0,
      rowsCount: Array.isArray(est.rows) ? est.rows.length : 0,
      totalAmount: est.totalAmount,
      dataSource: est.rows ? 'localStorage (전체내용)' : 'Firebase (목록만)',
      sampleRows: Array.isArray(est.rows) && est.rows.length > 0 ? 
        est.rows.slice(0, 2).map((row: any) => ({
          space: row.space,
          productName: row.productName,
          quantity: row.quantity,
          totalPrice: row.totalPrice
        })) : []
    }));
    
    console.log('견적서 내용 상세 분석:', estimateAnalysis);
    
    // 내용이 없는 견적서 확인
    const emptyEstimates = finalEstimates.filter(est => !Array.isArray(est.rows) || est.rows.length === 0);
    if (emptyEstimates.length > 0) {
      console.warn('⚠️ 내용이 없는 견적서 발견:', emptyEstimates.map(est => est.estimateNo));
    }
    
    // 내용이 있는 견적서 확인
    const estimatesWithContent = finalEstimates.filter(est => Array.isArray(est.rows) && est.rows.length > 0);
    console.log('✅ 내용이 포함된 견적서:', estimatesWithContent.length, '개');
    console.log('❌ 내용이 없는 견적서:', emptyEstimates.length, '개');

    const ws = XLSX.utils.json_to_sheet(finalEstimates);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, '견적서');
    
    const fileName = `견적서_백업_${new Date().toISOString().split('T')[0]}_${finalEstimates.length}개.xlsx`;
    XLSX.writeFile(wb, fileName);
    
    console.log('견적서 백업 완료:', fileName);
    return true;
  } catch (error) {
    console.error('견적서 다운로드 실패:', error);
    return false;
  }
};

export const downloadContracts = async () => {
  try {
    console.log('계약서 백업 시작');
    const contracts = await loadFirebaseData('contractService', 'getContracts', 'contracts');
    
    if (contracts.length === 0) {
      console.warn('백업할 계약서 데이터가 없습니다.');
      return false;
    }

    const ws = XLSX.utils.json_to_sheet(contracts);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, '계약서');
    
    const fileName = `계약서_백업_${new Date().toISOString().split('T')[0]}_${contracts.length}개.xlsx`;
    XLSX.writeFile(wb, fileName);
    
    console.log('계약서 백업 완료:', fileName);
    return true;
  } catch (error) {
    console.error('계약서 다운로드 실패:', error);
    return false;
  }
};

export const downloadOrders = async () => {
  try {
    console.log('주문서 백업 시작');
    const orders = await loadFirebaseData('orderService', 'getOrders', 'orders');
    
    if (orders.length === 0) {
      console.warn('백업할 주문서 데이터가 없습니다.');
      return false;
    }

    const ws = XLSX.utils.json_to_sheet(orders);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, '주문서');
    
    const fileName = `주문서_백업_${new Date().toISOString().split('T')[0]}_${orders.length}개.xlsx`;
    XLSX.writeFile(wb, fileName);
    
    console.log('주문서 백업 완료:', fileName);
    return true;
  } catch (error) {
    console.error('주문서 다운로드 실패:', error);
    return false;
  }
};

export const downloadDeliveries = async () => {
  try {
    console.log('납품관리 백업 시작');
    const deliveries = await loadFirebaseData('deliveryService', 'getDeliveries', 'deliveries');
    
    if (deliveries.length === 0) {
      console.warn('백업할 납품관리 데이터가 없습니다.');
      return false;
    }

    const ws = XLSX.utils.json_to_sheet(deliveries);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, '납품관리');
    
    const fileName = `납품관리_백업_${new Date().toISOString().split('T')[0]}_${deliveries.length}개.xlsx`;
    XLSX.writeFile(wb, fileName);
    
    console.log('납품관리 백업 완료:', fileName);
    return true;
  } catch (error) {
    console.error('납품관리 다운로드 실패:', error);
    return false;
  }
};

export const downloadCustomers = async () => {
  try {
    console.log('고객리스트 백업 시작');
    const customers = await loadFirebaseData('customerService', 'getCustomers', 'customers');
    
    if (customers.length === 0) {
      console.warn('백업할 고객리스트 데이터가 없습니다.');
      return false;
    }

    const ws = XLSX.utils.json_to_sheet(customers);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, '고객리스트');
    
    const fileName = `고객리스트_백업_${new Date().toISOString().split('T')[0]}_${customers.length}개.xlsx`;
    XLSX.writeFile(wb, fileName);
    
    console.log('고객리스트 백업 완료:', fileName);
    return true;
  } catch (error) {
    console.error('고객리스트 다운로드 실패:', error);
    return false;
  }
};

export const downloadProducts = async () => {
  try {
    console.log('제품리스트 백업 시작');
    const products = await loadFirebaseData('productService', 'getProducts', 'products');
    
    if (products.length === 0) {
      console.warn('백업할 제품리스트 데이터가 없습니다.');
      return false;
    }

    const ws = XLSX.utils.json_to_sheet(products);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, '제품리스트');
    
    const fileName = `제품리스트_백업_${new Date().toISOString().split('T')[0]}_${products.length}개.xlsx`;
    XLSX.writeFile(wb, fileName);
    
    console.log('제품리스트 백업 완료:', fileName);
    return true;
  } catch (error) {
    console.error('제품리스트 다운로드 실패:', error);
    return false;
  }
};

export const downloadOptions = async () => {
  try {
    console.log('옵션리스트 백업 시작');
    const options = await loadFirebaseData('optionService', 'getOptions', 'erp_options');
    
    if (options.length === 0) {
      console.warn('백업할 옵션리스트 데이터가 없습니다.');
      return false;
    }

    const ws = XLSX.utils.json_to_sheet(options);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, '옵션리스트');
    
    const fileName = `옵션리스트_백업_${new Date().toISOString().split('T')[0]}_${options.length}개.xlsx`;
    XLSX.writeFile(wb, fileName);
    
    console.log('옵션리스트 백업 완료:', fileName);
    return true;
  } catch (error) {
    console.error('옵션리스트 다운로드 실패:', error);
    return false;
  }
};

export const downloadVendors = async () => {
  try {
    console.log('거래처리스트 백업 시작');
    const vendors = await loadFirebaseData('vendorService', 'getVendors', 'vendors');
    
    if (vendors.length === 0) {
      console.warn('백업할 거래처리스트 데이터가 없습니다.');
      return false;
    }

    const ws = XLSX.utils.json_to_sheet(vendors);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, '거래처리스트');
    
    const fileName = `거래처리리스트_백업_${new Date().toISOString().split('T')[0]}_${vendors.length}개.xlsx`;
    XLSX.writeFile(wb, fileName);
    
    console.log('거래처리스트 백업 완료:', fileName);
    return true;
  } catch (error) {
    console.error('거래처리스트 다운로드 실패:', error);
    return false;
  }
};

export const downloadSchedules = async () => {
  try {
    console.log('스케줄내역 백업 시작');
    // 스케줄 데이터는 현재 localStorage에만 저장되어 있음
    const schedules = JSON.parse(localStorage.getItem('schedules') || '[]');
    
    if (schedules.length === 0) {
      console.warn('백업할 스케줄내역 데이터가 없습니다.');
      return false;
    }

    const ws = XLSX.utils.json_to_sheet(schedules);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, '스케줄내역');
    
    const fileName = `스케줄내역_백업_${new Date().toISOString().split('T')[0]}_${schedules.length}개.xlsx`;
    XLSX.writeFile(wb, fileName);
    
    console.log('스케줄내역 백업 완료:', fileName);
    return true;
  } catch (error) {
    console.error('스케줄내역 다운로드 실패:', error);
    return false;
  }
};

export const downloadMeasurements = async () => {
  try {
    console.log('실측데이터 백업 시작');
    const measurements = await loadFirebaseData('measurementService', 'getMeasurements', 'measurements');
    
    if (measurements.length === 0) {
      console.warn('백업할 실측데이터가 없습니다.');
      return false;
    }

    const ws = XLSX.utils.json_to_sheet(measurements);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, '실측데이터');
    
    const fileName = `실측데이터_백업_${new Date().toISOString().split('T')[0]}_${measurements.length}개.xlsx`;
    XLSX.writeFile(wb, fileName);
    
    console.log('실측데이터 백업 완료:', fileName);
    return true;
  } catch (error) {
    console.error('실측데이터 다운로드 실패:', error);
    return false;
  }
};

// 전문가급 일괄 백업 다운로드 (Firebase 우선)
export const downloadAllData = async () => {
  try {
    console.log('=== 전문가급 일괄 백업 시작 ===');
    
    // 견적서는 특별 처리 (전체 내용 포함)
    let estimates: any[] = [];
    try {
      const firebaseEstimates = await estimateService.getEstimates();
      const savedEstimates = JSON.parse(localStorage.getItem('saved_estimates') || '[]');
      
      // Firebase 데이터와 localStorage 데이터 병합
      const mergedEstimates = firebaseEstimates.map((firebaseEst: any) => {
        const localEst = savedEstimates.find((local: any) => 
          local.estimateNo === firebaseEst.estimateNo || 
          local.id === firebaseEst.id
        );
        return localEst || firebaseEst;
      });
      
      // localStorage에만 있는 견적서들도 추가
      const onlyLocalEstimates = savedEstimates.filter((localEst: any) => 
        !firebaseEstimates.some((firebaseEst: any) => 
          firebaseEst.estimateNo === localEst.estimateNo || 
          firebaseEst.id === localEst.id
        )
      );
      
      estimates = [...mergedEstimates, ...onlyLocalEstimates];
      console.log('견적서 병합 완료:', estimates.length, '개 (전체 내용 포함)');
      
      // 견적서 내용 상세 분석
      const estimatesWithContent = estimates.filter(est => Array.isArray(est.rows) && est.rows.length > 0);
      const estimatesWithoutContent = estimates.filter(est => !Array.isArray(est.rows) || est.rows.length === 0);
      
      console.log('✅ 일괄백업 - 내용이 포함된 견적서:', estimatesWithContent.length, '개');
      console.log('❌ 일괄백업 - 내용이 없는 견적서:', estimatesWithoutContent.length, '개');
      
      if (estimatesWithContent.length > 0) {
        console.log('견적서 내용 샘플:', estimatesWithContent[0].rows?.slice(0, 2));
      }
    } catch (error) {
      console.warn('견적서 로드 실패, localStorage만 사용:', error);
      try {
        estimates = JSON.parse(localStorage.getItem('saved_estimates') || '[]');
      } catch (localError) {
        console.error('localStorage 견적서 로드도 실패:', localError);
        estimates = [];
      }
    }

    // 나머지 데이터는 기존 방식으로 로드
    const [
      contracts,
      orders,
      deliveries,
      customers,
      products,
      options,
      vendors,
      measurements,
      companyInfo,
      users
    ] = await Promise.all([
      loadFirebaseData('contractService', 'getContracts', 'contracts'),
      loadFirebaseData('orderService', 'getOrders', 'orders'),
      loadFirebaseData('deliveryService', 'getDeliveries', 'deliveries'),
      loadFirebaseData('customerService', 'getCustomers', 'customers'),
      loadFirebaseData('productService', 'getProducts', 'products'),
      loadFirebaseData('optionService', 'getOptions', 'erp_options'),
      loadFirebaseData('vendorService', 'getVendors', 'vendors'),
      loadFirebaseData('measurementService', 'getMeasurements', 'measurements'),
      loadFirebaseData('companyInfoService', 'getCompanyInfo', 'companyInfo'),
      loadFirebaseData('userService', 'getUsers', 'users')
    ]);

    // 스케줄 데이터 (localStorage만)
    const schedules = JSON.parse(localStorage.getItem('schedules') || '[]');

    const backupData: BackupData = {
      estimates,
      contracts,
      orders,
      deliveries,
      customers,
      products,
      options,
      vendors,
      schedules,
      measurements,
      companyInfo,
      users,
      backupDate: new Date().toISOString(),
      version: '2.0.0',
      firebaseBackup: true
    };

    console.log('백업 데이터 수집 완료:', {
      견적서: estimates.length,
      계약서: contracts.length,
      주문서: orders.length,
      납품관리: deliveries.length,
      고객리스트: customers.length,
      제품리스트: products.length,
      옵션리스트: options.length,
      거래처리스트: vendors.length,
      스케줄내역: schedules.length,
      실측데이터: measurements.length,
      회사정보: companyInfo.length,
      사용자: users.length
    });

    const wb = XLSX.utils.book_new();
    
    // 각 데이터를 별도 시트로 추가 (데이터가 있는 경우만)
    const dataSheets = [
      { data: estimates, name: '견적서' },
      { data: contracts, name: '계약서' },
      { data: orders, name: '주문서' },
      { data: deliveries, name: '납품관리' },
      { data: customers, name: '고객리스트' },
      { data: products, name: '제품리스트' },
      { data: options, name: '옵션리스트' },
      { data: vendors, name: '거래처리스트' },
      { data: schedules, name: '스케줄내역' },
      { data: measurements, name: '실측데이터' },
      { data: companyInfo, name: '회사정보' },
      { data: users, name: '사용자관리' }
    ];

    dataSheets.forEach(({ data, name }) => {
      if (Array.isArray(data) && data.length > 0) {
        const ws = XLSX.utils.json_to_sheet(data);
        XLSX.utils.book_append_sheet(wb, ws, name);
      }
    });

    // 메타데이터 시트 추가
    const metaData = [{
      백업일시: backupData.backupDate,
      버전: backupData.version,
      Firebase백업: backupData.firebaseBackup ? '예' : '아니오',
      견적서수: estimates.length,
      계약서수: contracts.length,
      주문서수: orders.length,
      납품관리수: deliveries.length,
      고객리스트수: customers.length,
      제품리스트수: products.length,
      옵션리스트수: options.length,
      거래처리스트수: vendors.length,
      스케줄내역수: schedules.length,
      실측데이터수: measurements.length,
      회사정보수: companyInfo.length,
      사용자수: users.length,
      총데이터수: estimates.length + contracts.length + orders.length + 
                  deliveries.length + customers.length + products.length + 
                  options.length + vendors.length + schedules.length + 
                  measurements.length + companyInfo.length + users.length
    }];
    
    const metaWs = XLSX.utils.json_to_sheet(metaData);
    XLSX.utils.book_append_sheet(wb, metaWs, '메타데이터');

    const totalDataCount = metaData[0].총데이터수;
    const fileName = `Windowerp_전체백업_${new Date().toISOString().split('T')[0]}_${totalDataCount}개데이터.xlsx`;
    
    XLSX.writeFile(wb, fileName);
    
    console.log('=== 전문가급 일괄 백업 완료 ===');
    console.log('파일명:', fileName);
    console.log('총 데이터 수:', totalDataCount);
    
    return true;
  } catch (error) {
    console.error('일괄 백업 실패:', error);
    return false;
  }
};

// 전문가급 데이터 복구 (Firebase + localStorage 통합)
export const uploadAndRestore = async (file: File): Promise<{ success: boolean; message: string; restoredData?: any }> => {
  try {
    console.log('=== 전문가급 데이터 복구 시작 ===');
    
    if (!file) {
      throw new Error('복구할 파일이 선택되지 않았습니다.');
    }

    const arrayBuffer = await file.arrayBuffer();
    const workbook = XLSX.read(arrayBuffer, { type: 'array' });
    
    console.log('백업 파일 시트 목록:', workbook.SheetNames);
    
    const restoredData: any = {};
    let totalRestored = 0;
    let firebaseRestored = 0;
    let localStorageRestored = 0;

    // 각 시트를 확인하고 데이터 복구
    for (const sheetName of workbook.SheetNames) {
      if (sheetName === '메타데이터') {
        console.log('메타데이터 시트 건너뛰기');
        continue;
      }
      
      const worksheet = workbook.Sheets[sheetName];
      const jsonData = XLSX.utils.sheet_to_json(worksheet);
      
      if (jsonData.length > 0) {
        console.log(`${sheetName} 시트 데이터 복구 시작:`, jsonData.length, '개');
        
        const storageKey = getStorageKeyFromSheetName(sheetName);
        
        if (storageKey) {
          try {
            // Firebase 복구 시도 (주요 데이터만)
            if (isFirebaseData(sheetName)) {
              await restoreToFirebase(sheetName, jsonData);
              firebaseRestored += jsonData.length;
              console.log(`${sheetName} Firebase 복구 완료`);
            } else {
              // localStorage 복구
              localStorage.setItem(storageKey, JSON.stringify(jsonData));
              localStorageRestored += jsonData.length;
              console.log(`${sheetName} localStorage 복구 완료`);
            }
            
          restoredData[sheetName] = jsonData;
          totalRestored += jsonData.length;
          } catch (restoreError) {
            console.error(`${sheetName} 복구 실패:`, restoreError);
            // Firebase 실패 시 localStorage로 fallback
            try {
          localStorage.setItem(storageKey, JSON.stringify(jsonData));
              localStorageRestored += jsonData.length;
              console.log(`${sheetName} localStorage fallback 복구 완료`);
          restoredData[sheetName] = jsonData;
          totalRestored += jsonData.length;
            } catch (fallbackError) {
              console.error(`${sheetName} localStorage fallback도 실패:`, fallbackError);
            }
          }
        }
      }
    }

    console.log('=== 데이터 복구 완료 ===');
    console.log('총 복구된 데이터:', totalRestored, '개');
    console.log('Firebase 복구:', firebaseRestored, '개');
    console.log('localStorage 복구:', localStorageRestored, '개');

    return {
      success: true,
      message: `복구 완료! 총 ${totalRestored}개의 데이터가 복구되었습니다. (Firebase: ${firebaseRestored}개, localStorage: ${localStorageRestored}개)`,
      restoredData
    };
  } catch (error) {
    console.error('데이터 복구 실패:', error);
    return {
      success: false,
      message: '데이터 복구 중 오류가 발생했습니다: ' + (error as Error).message
    };
  }
};

// Firebase 복구 대상 데이터 판별
const isFirebaseData = (sheetName: string): boolean => {
  const firebaseSheets = [
    '견적서', '계약서', '주문서', '납품관리', 
    '고객리스트', '제품리스트', '옵션리스트', 
    '거래처리스트', '실측데이터', '회사정보', '사용자관리'
  ];
  return firebaseSheets.includes(sheetName);
};

// Firebase 복구 함수
const restoreToFirebase = async (sheetName: string, data: any[]) => {
  try {
    console.log(`Firebase 복구 시작: ${sheetName}`);
    
    // 시트별 Firebase 복구 로직
    switch (sheetName) {
      case '견적서':
        // 견적서는 전체 내용을 localStorage에 복구
        console.log('견적서 복구 시작:', data.length, '개');
        
        // 기존 견적서와 병합
        const existingEstimates = JSON.parse(localStorage.getItem('saved_estimates') || '[]');
        const mergedEstimates = [...existingEstimates];
        
        data.forEach((estimate: any) => {
          const existingIndex = mergedEstimates.findIndex((existing: any) => 
            existing.estimateNo === estimate.estimateNo || 
            existing.id === estimate.id
          );
          
          if (existingIndex >= 0) {
            // 기존 견적서 업데이트 (전체 내용 포함)
            mergedEstimates[existingIndex] = estimate;
            console.log('기존 견적서 업데이트:', estimate.estimateNo);
          } else {
            // 새 견적서 추가
            mergedEstimates.push(estimate);
            console.log('새 견적서 추가:', estimate.estimateNo);
          }
        });
        
        // localStorage에 저장
        localStorage.setItem('saved_estimates', JSON.stringify(mergedEstimates));
        console.log('견적서 localStorage 복구 완료:', mergedEstimates.length, '개');
        
        // Firebase에도 저장 (목록만)
        for (const estimate of data) {
          try {
            await estimateService.saveEstimate(estimate);
          } catch (error) {
            console.warn('Firebase 견적서 저장 실패:', estimate.estimateNo, error);
          }
        }
        break;
      case '고객리스트':
        for (const customer of data) {
          await customerService.saveCustomer(customer);
        }
        break;
      case '제품리스트':
        await productService.saveProductsBatch(data);
        break;
      case '옵션리스트':
        for (const option of data) {
          await optionService.saveOption(option);
        }
        break;
      case '거래처리스트':
        for (const vendor of data) {
          await vendorService.saveVendor(vendor);
        }
        break;
      case '실측데이터':
        for (const measurement of data) {
          await measurementService.saveMeasurement(measurement);
        }
        break;
      default:
        console.warn(`Firebase 복구 미지원 시트: ${sheetName}`);
        throw new Error(`${sheetName}은 Firebase 복구를 지원하지 않습니다.`);
    }
  } catch (error) {
    console.error(`Firebase 복구 실패 (${sheetName}):`, error);
    throw error;
  }
};

// 시트 이름을 localStorage 키로 변환 (개선된 버전)
const getStorageKeyFromSheetName = (sheetName: string): string | null => {
  const keyMap: { [key: string]: string } = {
    '견적서': 'saved_estimates',
    '계약서': 'contracts',
    '주문서': 'orders',
    '납품관리': 'deliveries',
    '고객리스트': 'customers',
    '제품리스트': 'products',
    '옵션리스트': 'erp_options',
    '거래처리스트': 'vendors',
    '스케줄내역': 'schedules',
    '실측데이터': 'measurements',
    '회사정보': 'companyInfo',
    '사용자관리': 'users'
  };
  
  return keyMap[sheetName] || null;
};

// 현재 데이터 상태 확인 (Firebase + localStorage 통합)
export const getDataStatus = async () => {
  try {
    console.log('데이터 상태 확인 시작');
    
    // 견적서는 특별 처리 (전체 내용 포함)
    let estimates: any[] = [];
    try {
      const firebaseEstimates = await estimateService.getEstimates();
      const savedEstimates = JSON.parse(localStorage.getItem('saved_estimates') || '[]');
      
      // Firebase 데이터와 localStorage 데이터 병합
      const mergedEstimates = firebaseEstimates.map((firebaseEst: any) => {
        const localEst = savedEstimates.find((local: any) => 
          local.estimateNo === firebaseEst.estimateNo || 
          local.id === firebaseEst.id
        );
        return localEst || firebaseEst;
      });
      
      // localStorage에만 있는 견적서들도 추가
      const onlyLocalEstimates = savedEstimates.filter((localEst: any) => 
        !firebaseEstimates.some((firebaseEst: any) => 
          firebaseEst.estimateNo === localEst.estimateNo || 
          firebaseEst.id === localEst.id
        )
      );
      
      estimates = [...mergedEstimates, ...onlyLocalEstimates];
    } catch (error) {
      console.warn('견적서 상태 확인 실패, localStorage만 사용:', error);
      try {
        estimates = JSON.parse(localStorage.getItem('saved_estimates') || '[]');
      } catch (localError) {
        console.error('localStorage 견적서 로드도 실패:', localError);
        estimates = [];
      }
    }

    // 나머지 데이터는 기존 방식으로 로드
    const [
      contracts,
      orders,
      deliveries,
      customers,
      products,
      options,
      vendors,
      measurements,
      companyInfo,
      users
    ] = await Promise.all([
      loadFirebaseData('contractService', 'getContracts', 'contracts'),
      loadFirebaseData('orderService', 'getOrders', 'orders'),
      loadFirebaseData('deliveryService', 'getDeliveries', 'deliveries'),
      loadFirebaseData('customerService', 'getCustomers', 'customers'),
      loadFirebaseData('productService', 'getProducts', 'products'),
      loadFirebaseData('optionService', 'getOptions', 'erp_options'),
      loadFirebaseData('vendorService', 'getVendors', 'vendors'),
      loadFirebaseData('measurementService', 'getMeasurements', 'measurements'),
      loadFirebaseData('companyInfoService', 'getCompanyInfo', 'companyInfo'),
      loadFirebaseData('userService', 'getUsers', 'users')
    ]);

    // localStorage 데이터 상태 확인
    const schedules = JSON.parse(localStorage.getItem('schedules') || '[]');

  const status = {
      estimates: estimates.length,
      contracts: contracts.length,
      orders: orders.length,
      deliveries: deliveries.length,
      customers: customers.length,
      products: products.length,
      options: options.length,
      vendors: vendors.length,
      schedules: schedules.length,
      measurements: measurements.length,
      companyInfo: companyInfo.length,
      users: users.length
    };
    
    console.log('데이터 상태 확인 완료:', status);
  return status;
  } catch (error) {
    console.error('데이터 상태 확인 실패:', error);
    // 에러 시 기본값 반환
    return {
      estimates: 0,
      contracts: 0,
      orders: 0,
      deliveries: 0,
      customers: 0,
      products: 0,
      options: 0,
      vendors: 0,
      schedules: 0,
      measurements: 0,
      companyInfo: 0,
      users: 0
    };
  }
}; 

