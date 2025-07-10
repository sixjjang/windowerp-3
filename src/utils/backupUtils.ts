import * as XLSX from 'xlsx';

// 백업 데이터 타입 정의
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
  backupDate: string;
  version: string;
}

// 개별 데이터 다운로드 함수들
export const downloadEstimates = () => {
  try {
    const estimates = JSON.parse(localStorage.getItem('estimates') || '[]');
    const ws = XLSX.utils.json_to_sheet(estimates);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, '견적서');
    XLSX.writeFile(wb, `견적서_백업_${new Date().toISOString().split('T')[0]}.xlsx`);
    return true;
  } catch (error) {
    console.error('견적서 다운로드 실패:', error);
    return false;
  }
};

export const downloadContracts = () => {
  try {
    const contracts = JSON.parse(localStorage.getItem('contracts') || '[]');
    const ws = XLSX.utils.json_to_sheet(contracts);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, '계약서');
    XLSX.writeFile(wb, `계약서_백업_${new Date().toISOString().split('T')[0]}.xlsx`);
    return true;
  } catch (error) {
    console.error('계약서 다운로드 실패:', error);
    return false;
  }
};

export const downloadOrders = () => {
  try {
    const orders = JSON.parse(localStorage.getItem('orders') || '[]');
    const ws = XLSX.utils.json_to_sheet(orders);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, '주문서');
    XLSX.writeFile(wb, `주문서_백업_${new Date().toISOString().split('T')[0]}.xlsx`);
    return true;
  } catch (error) {
    console.error('주문서 다운로드 실패:', error);
    return false;
  }
};

export const downloadDeliveries = () => {
  try {
    const deliveries = JSON.parse(localStorage.getItem('deliveries') || '[]');
    const ws = XLSX.utils.json_to_sheet(deliveries);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, '납품관리');
    XLSX.writeFile(wb, `납품관리_백업_${new Date().toISOString().split('T')[0]}.xlsx`);
    return true;
  } catch (error) {
    console.error('납품관리 다운로드 실패:', error);
    return false;
  }
};

export const downloadCustomers = () => {
  try {
    const customers = JSON.parse(localStorage.getItem('customers') || '[]');
    const ws = XLSX.utils.json_to_sheet(customers);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, '고객리스트');
    XLSX.writeFile(wb, `고객리스트_백업_${new Date().toISOString().split('T')[0]}.xlsx`);
    return true;
  } catch (error) {
    console.error('고객리스트 다운로드 실패:', error);
    return false;
  }
};

export const downloadProducts = () => {
  try {
    const products = JSON.parse(localStorage.getItem('products') || '[]');
    const ws = XLSX.utils.json_to_sheet(products);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, '제품리스트');
    XLSX.writeFile(wb, `제품리스트_백업_${new Date().toISOString().split('T')[0]}.xlsx`);
    return true;
  } catch (error) {
    console.error('제품리스트 다운로드 실패:', error);
    return false;
  }
};

export const downloadOptions = () => {
  try {
    // 옵션관리에서 사용하는 키로 변경
    const options = JSON.parse(localStorage.getItem('erp_options') || '[]');
    const optionTypes = JSON.parse(localStorage.getItem('erp_option_types') || '[]');
    
    const wb = XLSX.utils.book_new();
    
    // 옵션 데이터를 각 탭별로 시트로 추가
    if (Array.isArray(options) && options.length > 0) {
      options.forEach((tabOptions, index) => {
        if (Array.isArray(tabOptions) && tabOptions.length > 0) {
          const ws = XLSX.utils.json_to_sheet(tabOptions);
          const sheetName = optionTypes[index] || `옵션타입${index + 1}`;
          XLSX.utils.book_append_sheet(wb, ws, sheetName);
        }
      });
    }
    
    // 옵션 타입 정보도 별도 시트로 추가
    if (optionTypes.length > 0) {
      const typeData = optionTypes.map((type: string, index: number) => ({ 
        순서: index + 1, 
        옵션타입: type 
      }));
      const typeWs = XLSX.utils.json_to_sheet(typeData);
      XLSX.utils.book_append_sheet(wb, typeWs, '옵션타입설정');
    }
    
    XLSX.writeFile(wb, `옵션리스트_백업_${new Date().toISOString().split('T')[0]}.xlsx`);
    return true;
  } catch (error) {
    console.error('옵션리스트 다운로드 실패:', error);
    return false;
  }
};

export const downloadVendors = () => {
  try {
    const vendors = JSON.parse(localStorage.getItem('vendors') || '[]');
    const ws = XLSX.utils.json_to_sheet(vendors);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, '거래처리스트');
    XLSX.writeFile(wb, `거래처리스트_백업_${new Date().toISOString().split('T')[0]}.xlsx`);
    return true;
  } catch (error) {
    console.error('거래처리스트 다운로드 실패:', error);
    return false;
  }
};

export const downloadSchedules = () => {
  try {
    const schedules = JSON.parse(localStorage.getItem('schedules') || '[]');
    const ws = XLSX.utils.json_to_sheet(schedules);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, '스케줄내역');
    XLSX.writeFile(wb, `스케줄내역_백업_${new Date().toISOString().split('T')[0]}.xlsx`);
    return true;
  } catch (error) {
    console.error('스케줄내역 다운로드 실패:', error);
    return false;
  }
};

export const downloadMeasurements = () => {
  try {
    const measurements = JSON.parse(localStorage.getItem('measurements') || '[]');
    const ws = XLSX.utils.json_to_sheet(measurements);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, '실측데이터');
    XLSX.writeFile(wb, `실측데이터_백업_${new Date().toISOString().split('T')[0]}.xlsx`);
    return true;
  } catch (error) {
    console.error('실측데이터 다운로드 실패:', error);
    return false;
  }
};

// 일괄 백업 다운로드
export const downloadAllData = () => {
  try {
    const backupData: BackupData = {
      estimates: JSON.parse(localStorage.getItem('estimates') || '[]'),
      contracts: JSON.parse(localStorage.getItem('contracts') || '[]'),
      orders: JSON.parse(localStorage.getItem('orders') || '[]'),
      deliveries: JSON.parse(localStorage.getItem('deliveries') || '[]'),
      customers: JSON.parse(localStorage.getItem('customers') || '[]'),
      products: JSON.parse(localStorage.getItem('products') || '[]'),
      options: JSON.parse(localStorage.getItem('erp_options') || '[]'), // 옵션관리 키로 변경
      vendors: JSON.parse(localStorage.getItem('vendors') || '[]'),
      schedules: JSON.parse(localStorage.getItem('schedules') || '[]'),
      measurements: JSON.parse(localStorage.getItem('measurements') || '[]'),
      backupDate: new Date().toISOString(),
      version: '1.0.0'
    };

    const wb = XLSX.utils.book_new();
    
    // 각 데이터를 별도 시트로 추가
    if (backupData.estimates.length > 0) {
      const ws = XLSX.utils.json_to_sheet(backupData.estimates);
      XLSX.utils.book_append_sheet(wb, ws, '견적서');
    }
    
    if (backupData.contracts.length > 0) {
      const ws = XLSX.utils.json_to_sheet(backupData.contracts);
      XLSX.utils.book_append_sheet(wb, ws, '계약서');
    }
    
    if (backupData.orders.length > 0) {
      const ws = XLSX.utils.json_to_sheet(backupData.orders);
      XLSX.utils.book_append_sheet(wb, ws, '주문서');
    }
    
    if (backupData.deliveries.length > 0) {
      const ws = XLSX.utils.json_to_sheet(backupData.deliveries);
      XLSX.utils.book_append_sheet(wb, ws, '납품관리');
    }
    
    if (backupData.customers.length > 0) {
      const ws = XLSX.utils.json_to_sheet(backupData.customers);
      XLSX.utils.book_append_sheet(wb, ws, '고객리스트');
    }
    
    if (backupData.products.length > 0) {
      const ws = XLSX.utils.json_to_sheet(backupData.products);
      XLSX.utils.book_append_sheet(wb, ws, '제품리스트');
    }
    
    // 옵션 데이터 처리 (옵션관리 구조에 맞게)
    if (Array.isArray(backupData.options) && backupData.options.length > 0) {
      const optionTypes = JSON.parse(localStorage.getItem('erp_option_types') || '[]');
      
      backupData.options.forEach((tabOptions, index) => {
        if (Array.isArray(tabOptions) && tabOptions.length > 0) {
          const ws = XLSX.utils.json_to_sheet(tabOptions);
          const sheetName = optionTypes[index] || `옵션타입${index + 1}`;
          XLSX.utils.book_append_sheet(wb, ws, sheetName);
        }
      });
      
      // 옵션 타입 정보도 추가
      if (optionTypes.length > 0) {
        const typeData = optionTypes.map((type: string, index: number) => ({ 
          순서: index + 1, 
          옵션타입: type 
        }));
        const typeWs = XLSX.utils.json_to_sheet(typeData);
        XLSX.utils.book_append_sheet(wb, typeWs, '옵션타입설정');
      }
    }
    
    if (backupData.vendors.length > 0) {
      const ws = XLSX.utils.json_to_sheet(backupData.vendors);
      XLSX.utils.book_append_sheet(wb, ws, '거래처리스트');
    }
    
    if (backupData.schedules.length > 0) {
      const ws = XLSX.utils.json_to_sheet(backupData.schedules);
      XLSX.utils.book_append_sheet(wb, ws, '스케줄내역');
    }
    
    if (backupData.measurements.length > 0) {
      const ws = XLSX.utils.json_to_sheet(backupData.measurements);
      XLSX.utils.book_append_sheet(wb, ws, '실측데이터');
    }

    // 메타데이터 시트 추가
    const metaData = [{
      백업일시: backupData.backupDate,
      버전: backupData.version,
      견적서수: backupData.estimates.length,
      계약서수: backupData.contracts.length,
      주문서수: backupData.orders.length,
      납품관리수: backupData.deliveries.length,
      고객수: backupData.customers.length,
      제품수: backupData.products.length,
      옵션수: backupData.options.length,
      거래처수: backupData.vendors.length,
      스케줄수: backupData.schedules.length,
      실측데이터수: backupData.measurements.length
    }];
    
    const metaWs = XLSX.utils.json_to_sheet(metaData);
    XLSX.utils.book_append_sheet(wb, metaWs, '메타데이터');

    XLSX.writeFile(wb, `전체데이터_백업_${new Date().toISOString().split('T')[0]}.xlsx`);
    return true;
  } catch (error) {
    console.error('전체 데이터 다운로드 실패:', error);
    return false;
  }
};

// 파일 업로드 및 복구
export const uploadAndRestore = async (file: File): Promise<{ success: boolean; message: string; restoredData?: any }> => {
  try {
    const data = await file.arrayBuffer();
    const workbook = XLSX.read(data, { type: 'array' });
    
    const restoredData: any = {};
    let totalRestored = 0;
    let optionData: any[] = [];
    let optionTypes: string[] = [];

    // 각 시트를 확인하고 데이터 복구
    workbook.SheetNames.forEach(sheetName => {
      if (sheetName === '메타데이터') return; // 메타데이터는 건너뛰기
      
      const worksheet = workbook.Sheets[sheetName];
      const jsonData = XLSX.utils.sheet_to_json(worksheet);
      
      if (jsonData.length > 0) {
        const storageKey = getStorageKeyFromSheetName(sheetName);
        
        if (storageKey === 'erp_option_types') {
          // 옵션 타입 설정 복구
          optionTypes = jsonData.map((item: any) => item.옵션타입 || item.optionType).filter(Boolean);
          localStorage.setItem(storageKey, JSON.stringify(optionTypes));
          restoredData[sheetName] = jsonData;
          totalRestored += jsonData.length;
        } else if (storageKey === 'erp_options') {
          // 옵션 데이터는 나중에 처리하기 위해 임시 저장
          optionData.push(jsonData);
          restoredData[sheetName] = jsonData;
          totalRestored += jsonData.length;
        } else if (storageKey) {
          // 일반 데이터 복구
          localStorage.setItem(storageKey, JSON.stringify(jsonData));
          restoredData[sheetName] = jsonData;
          totalRestored += jsonData.length;
        }
      }
    });

    // 옵션 데이터 처리 (옵션관리 구조에 맞게)
    if (optionData.length > 0) {
      localStorage.setItem('erp_options', JSON.stringify(optionData));
    }

    return {
      success: true,
      message: `${totalRestored}개의 데이터가 성공적으로 복구되었습니다.`,
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

// 시트 이름을 localStorage 키로 변환
const getStorageKeyFromSheetName = (sheetName: string): string | null => {
  const keyMap: { [key: string]: string } = {
    '견적서': 'estimates',
    '계약서': 'contracts',
    '주문서': 'orders',
    '납품관리': 'deliveries',
    '고객리스트': 'customers',
    '제품리스트': 'products',
    '거래처리스트': 'vendors',
    '스케줄내역': 'schedules',
    '실측데이터': 'measurements'
  };
  
  // 옵션 관련 시트는 특별 처리
  if (sheetName === '옵션타입설정') {
    return 'erp_option_types';
  }
  
  // 옵션 타입 시트들 (커튼옵션, 블라인드옵션 등)
  if (sheetName.includes('옵션') || sheetName.includes('전동') || sheetName.includes('헌터')) {
    return 'erp_options';
  }
  
  return keyMap[sheetName] || null;
};

// 현재 데이터 상태 확인
export const getDataStatus = () => {
  // 옵션 데이터는 2차원 배열이므로 총 개수 계산
  const optionsData = JSON.parse(localStorage.getItem('erp_options') || '[]');
  const totalOptions = Array.isArray(optionsData) 
    ? optionsData.reduce((total: number, tabOptions: any[]) => total + (Array.isArray(tabOptions) ? tabOptions.length : 0), 0)
    : 0;

  const status = {
    estimates: JSON.parse(localStorage.getItem('estimates') || '[]').length,
    contracts: JSON.parse(localStorage.getItem('contracts') || '[]').length,
    orders: JSON.parse(localStorage.getItem('orders') || '[]').length,
    deliveries: JSON.parse(localStorage.getItem('deliveries') || '[]').length,
    customers: JSON.parse(localStorage.getItem('customers') || '[]').length,
    products: JSON.parse(localStorage.getItem('products') || '[]').length,
    options: totalOptions,
    vendors: JSON.parse(localStorage.getItem('vendors') || '[]').length,
    schedules: JSON.parse(localStorage.getItem('schedules') || '[]').length,
    measurements: JSON.parse(localStorage.getItem('measurements') || '[]').length
  };
  
  return status;
}; 