import { db } from '../firebase/config';
import { 
  collection, 
  doc, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  getDocs, 
  getDoc, 
  query, 
  orderBy, 
  where,
  onSnapshot,
  serverTimestamp 
} from 'firebase/firestore';
import { auth } from '../firebase/config';
import { ensureFirebaseAuth } from './auth';

// Firebase Functions 호출을 위한 유틸리티 함수
const callFirebaseFunction = async (functionName: string, data: any, method: string = 'POST') => {
  try {
    // JWT 토큰 가져오기 (기존 로그인 시스템에서)
    const token = localStorage.getItem('token');
    if (!token) {
      throw new Error('JWT 토큰이 없습니다. 다시 로그인해주세요.');
    }

    const requestOptions: RequestInit = {
      method: method,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      }
    };

    // GET, DELETE 메서드가 아닌 경우에만 body 추가
    if (method !== 'GET' && method !== 'DELETE') {
      requestOptions.body = JSON.stringify(data);
    }

    const response = await fetch(`https://us-central1-windowerp-3.cloudfunctions.net/${functionName}`, requestOptions);

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Firebase Function 호출 실패: ${response.status} - ${errorText}`);
    }

    const result = await response.json();
    return result;
  } catch (error) {
    console.error(`Firebase Function ${functionName} 호출 실패:`, error);
    throw error;
  }
};

// Firebase Auth 상태 확인 함수
const checkFirebaseAuth = () => {
  const user = auth.currentUser;
  console.log('Firebase Auth 상태:', {
    isAuthenticated: !!user,
    userId: user?.uid,
    email: user?.email,
    displayName: user?.displayName
  });
  return user;
};

// 견적서 데이터 서비스
export const estimateService = {
  // 견적서 목록 가져오기
  async getEstimates() {
    try {
      // Firebase Functions를 통해 견적서 목록 조회
      const result = await callFirebaseFunction('getEstimates', {}, 'GET');
      return result;
    } catch (error) {
      console.error('견적서 목록 가져오기 실패:', error);
      throw error;
    }
  },

  // 실시간 견적서 목록 구독
  subscribeToEstimates(callback: (estimates: any[]) => void) {
    const estimatesRef = collection(db, 'estimates');
    const q = query(estimatesRef, orderBy('savedAt', 'desc'));
    return onSnapshot(q, (snapshot) => {
      const estimates = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      callback(estimates);
    });
  },

  // 견적서 저장 (Firebase Functions를 통한 저장)
  async saveEstimate(estimateData: any) {
    try {
      console.log('Firebase Functions를 통한 견적서 저장 시작:', estimateData);
      
      // Firebase Functions를 통해 저장
      const result = await callFirebaseFunction('saveEstimate', estimateData);
      
      console.log('Firebase Functions를 통한 견적서 저장 성공:', result);
      return result.id || result.estimateId;
    } catch (error) {
      console.error('Firebase Functions를 통한 견적서 저장 실패:', error);
      throw error;
    }
  },

  // 견적서 수정 (Firebase Functions를 통한 수정)
  async updateEstimate(estimateId: string, estimateData: any) {
    try {
      console.log('Firebase Functions를 통한 견적서 수정 시작:', estimateId, estimateData);
      
      // Firebase Functions를 통해 수정
      const result = await callFirebaseFunction(`updateEstimate/${estimateId}`, estimateData, 'PUT');
      
      console.log('Firebase Functions를 통한 견적서 수정 성공:', result);
      return result;
    } catch (error) {
      console.error('Firebase Functions를 통한 견적서 수정 실패:', error);
      throw error;
    }
  },



  // 견적서 삭제 (Firebase Functions를 통한 삭제)
  async deleteEstimate(estimateId: string) {
    try {
      console.log('Firebase Functions를 통한 견적서 삭제 시작:', estimateId);
      
      // JWT 토큰 가져오기
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('JWT 토큰이 없습니다. 다시 로그인해주세요.');
      }

      const response = await fetch(`https://us-central1-windowerp-3.cloudfunctions.net/deleteEstimate/${encodeURIComponent(estimateId)}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Firebase Function 호출 실패: ${response.status} - ${errorText}`);
      }

      const result = await response.json();
      console.log('Firebase Functions를 통한 견적서 삭제 성공:', result);
      return result;
    } catch (error) {
      console.error('Firebase Functions를 통한 견적서 삭제 실패:', error);
      throw error;
    }
  },

  // 견적번호로 견적서 찾기
  async getEstimateByNumber(estimateNo: string) {
    try {
      const estimatesRef = collection(db, 'estimates');
      const q = query(estimatesRef, where('estimateNo', '==', estimateNo));
      const snapshot = await getDocs(q);
      if (!snapshot.empty) {
        const doc = snapshot.docs[0];
        return { id: doc.id, ...doc.data() };
      }
      return null;
    } catch (error) {
      console.error('견적서 검색 실패:', error);
      throw error;
    }
  }
};

// 고객 데이터 서비스
export const customerService = {
  // 고객 목록 가져오기
  async getCustomers() {
    try {
      const customersRef = collection(db, 'customers');
      const q = query(customersRef, orderBy('createdAt', 'desc'));
      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
    } catch (error) {
      console.error('고객 목록 가져오기 실패:', error);
      throw error;
    }
  },

  // 실시간 고객 목록 구독
  subscribeToCustomers(callback: (customers: any[]) => void) {
    const customersRef = collection(db, 'customers');
    const q = query(customersRef, orderBy('createdAt', 'desc'));
    return onSnapshot(q, (snapshot) => {
      const customers = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      callback(customers);
    });
  },

  // 고객 저장 (Firebase Functions를 통한 저장)
  async saveCustomer(customerData: any) {
    try {
      console.log('Firebase Functions를 통한 고객 저장 시작:', customerData);
      
      // Firebase Functions를 통해 저장
      const result = await callFirebaseFunction('saveCustomer', customerData);
      
      console.log('Firebase Functions를 통한 고객 저장 성공:', result);
      return result.id || result.customerId;
    } catch (error) {
      console.error('Firebase Functions를 통한 고객 저장 실패:', error);
      throw error;
    }
  },

  // 고객 업데이트
  async updateCustomer(customerId: string, customerData: any) {
    try {
      const customerRef = doc(db, 'customers', customerId);
      await updateDoc(customerRef, {
        ...customerData,
        updatedAt: serverTimestamp()
      });
    } catch (error) {
      console.error('고객 업데이트 실패:', error);
      throw error;
    }
  },

  // 고객 삭제
  async deleteCustomer(customerId: string) {
    try {
      const customerRef = doc(db, 'customers', customerId);
      await deleteDoc(customerRef);
    } catch (error) {
      console.error('고객 삭제 실패:', error);
      throw error;
    }
  }
};

// 계약서 데이터 서비스
export const contractService = {
  // 계약서 목록 가져오기
  async getContracts() {
    try {
      const contractsRef = collection(db, 'contracts');
      const q = query(contractsRef, orderBy('createdAt', 'desc'));
      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
    } catch (error) {
      console.error('계약서 목록 가져오기 실패:', error);
      throw error;
    }
  },

  // 실시간 계약서 목록 구독
  subscribeToContracts(callback: (contracts: any[]) => void) {
    const contractsRef = collection(db, 'contracts');
    const q = query(contractsRef, orderBy('createdAt', 'desc'));
    return onSnapshot(q, (snapshot) => {
      const contracts = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      callback(contracts);
    });
  },

  // 계약서 저장 (Firebase Functions를 통한 저장)
  async saveContract(contractData: any) {
    try {
      console.log('Firebase Functions를 통한 계약서 저장 시작:', contractData);
      
      // Firebase Functions를 통해 저장
      const result = await callFirebaseFunction('saveContract', contractData);
      
      console.log('Firebase Functions를 통한 계약서 저장 성공:', result);
      return result.id || result.contractId;
    } catch (error) {
      console.error('Firebase Functions를 통한 계약서 저장 실패:', error);
      throw error;
    }
  },

  // 계약서 업데이트 (Firebase Functions를 통한 업데이트)
  async updateContract(contractId: string, contractData: any) {
    try {
      console.log('Firebase Functions를 통한 계약서 업데이트 시작:', { contractId, contractData });
      
      // Firebase Functions를 통해 업데이트
      const result = await callFirebaseFunction('updateContract', { contractId, ...contractData });
      
      console.log('Firebase Functions를 통한 계약서 업데이트 성공:', result);
      return result;
    } catch (error) {
      console.error('Firebase Functions를 통한 계약서 업데이트 실패:', error);
      throw error;
    }
  },

  // 계약서 삭제
  async deleteContract(contractId: string) {
    try {
      const contractRef = doc(db, 'contracts', contractId);
      await deleteDoc(contractRef);
    } catch (error) {
      console.error('계약서 삭제 실패:', error);
      throw error;
    }
  }
};

// 주문서 데이터 서비스
export const orderService = {
  // 주문서 목록 가져오기
  async getOrders() {
    try {
      const ordersRef = collection(db, 'orders');
      const q = query(ordersRef, orderBy('createdAt', 'desc'));
      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
    } catch (error) {
      console.error('주문서 목록 가져오기 실패:', error);
      throw error;
    }
  },

  // 실시간 주문서 목록 구독
  subscribeToOrders(callback: (orders: any[]) => void) {
    const ordersRef = collection(db, 'orders');
    const q = query(ordersRef, orderBy('createdAt', 'desc'));
    return onSnapshot(q, (snapshot) => {
      const orders = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      callback(orders);
    });
  },

  // 주문서 저장 (Firebase Functions를 통한 저장)
  async saveOrder(orderData: any) {
    try {
      console.log('Firebase Functions를 통한 주문서 저장 시작:', orderData);
      
      // Firebase Functions를 통해 저장
      const result = await callFirebaseFunction('saveOrder', orderData);
      
      console.log('Firebase Functions를 통한 주문서 저장 성공:', result);
      return result.id || result.orderId;
    } catch (error) {
      console.error('Firebase Functions를 통한 주문서 저장 실패:', error);
      throw error;
    }
  },

  // 주문서 업데이트 (Firebase Functions를 통한 업데이트)
  async updateOrder(orderId: string, orderData: any) {
    try {
      console.log('Firebase Functions를 통한 주문서 업데이트 시작:', { orderId, orderData });
      
      // Firebase Functions를 통해 업데이트
      const result = await callFirebaseFunction('updateOrder', { orderId, ...orderData });
      
      console.log('Firebase Functions를 통한 주문서 업데이트 성공:', result);
      return result;
    } catch (error) {
      console.error('Firebase Functions를 통한 주문서 업데이트 실패:', error);
      throw error;
    }
  },

  // 주문서 삭제
  async deleteOrder(orderId: string) {
    try {
      const orderRef = doc(db, 'orders', orderId);
      await deleteDoc(orderRef);
    } catch (error) {
      console.error('주문서 삭제 실패:', error);
      throw error;
    }
  }
};

// 제품 데이터 서비스
export const productService = {
  // 제품 목록 가져오기 (가벼운 파일 방식)
  async getProducts(useStorage = true) {
    try {
      if (useStorage) {
        // 가벼운 파일 방식으로 Storage에서 조회
        console.log('가벼운 파일 방식으로 제품 조회');
        const result = await callFirebaseFunction('products', { useStorage: true }, 'GET');
        return result;
      } else {
        // 기존 Firestore 방식 (하위 호환성)
        console.log('Firestore 방식으로 제품 조회');
        const productsRef = collection(db, 'products');
        const q = query(productsRef, orderBy('createdAt', 'desc'));
        const snapshot = await getDocs(q);
        return snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
      }
    } catch (error) {
      console.error('제품 목록 가져오기 실패:', error);
      throw error;
    }
  },

  // 실시간 제품 목록 구독
  subscribeToProducts(callback: (products: any[]) => void) {
    const productsRef = collection(db, 'products');
    const q = query(productsRef, orderBy('createdAt', 'desc'));
    return onSnapshot(q, (snapshot) => {
      const products = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      callback(products);
    });
  },

  // 제품 저장 (Functions 사용)
  async saveProduct(productData: any) {
    try {
      console.log('Firebase Functions를 통해 제품 저장 시작');
      const result = await callFirebaseFunction('saveProduct', productData);
      console.log('Firebase Functions 제품 저장 완료:', result);
      return result.id;
    } catch (error) {
      console.error('Firebase Functions 제품 저장 실패:', error);
      throw error;
    }
  },

  // 제품 배치 저장
  async saveProductsBatch(productsData: any[]) {
    try {
      console.log('Firebase Functions를 통해 제품 배치 저장 시작');
      const result = await callFirebaseFunction('saveProductsBatch', { products: productsData });
      console.log('Firebase Functions 제품 배치 저장 완료:', result);
      return result;
    } catch (error) {
      console.error('Firebase Functions 제품 배치 저장 실패:', error);
      throw error;
    }
  },

  // 제품 업데이트 (Functions 사용)
  async updateProduct(productId: string, productData: any) {
    try {
      console.log('Firebase Functions를 통해 제품 업데이트 시작');
      const result = await callFirebaseFunction('updateProduct', { productId, ...productData }, 'PUT');
      console.log('Firebase Functions 제품 업데이트 완료:', result);
      return result;
    } catch (error) {
      console.error('Firebase Functions 제품 업데이트 실패:', error);
      throw error;
    }
  },

  // 제품 삭제 (Functions 사용)
  async deleteProduct(productId: string) {
    try {
      console.log('Firebase Functions를 통해 제품 삭제 시작');
      const result = await callFirebaseFunction('deleteProduct', { productId }, 'DELETE');
      console.log('Firebase Functions 제품 삭제 완료:', result);
      return result;
    } catch (error) {
      console.error('Firebase Functions 제품 삭제 실패:', error);
      throw error;
    }
  }
};

// 옵션 데이터 서비스
export const optionService = {
  // 옵션 목록 가져오기
  async getOptions() {
    try {
      const optionsRef = collection(db, 'options');
      const q = query(optionsRef, orderBy('createdAt', 'desc'));
      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
    } catch (error) {
      console.error('옵션 목록 가져오기 실패:', error);
      throw error;
    }
  },

  // 실시간 옵션 목록 구독
  subscribeToOptions(callback: (options: any[]) => void) {
    const optionsRef = collection(db, 'options');
    const q = query(optionsRef, orderBy('createdAt', 'desc'));
    return onSnapshot(q, (snapshot) => {
      const options = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      callback(options);
    });
  },

  // 옵션 저장 (Functions 사용)
  async saveOption(optionData: any) {
    try {
      console.log('Firebase Functions를 통해 옵션 저장 시작');
      const result = await callFirebaseFunction('saveOption', optionData);
      console.log('Firebase Functions 옵션 저장 완료:', result);
      return result.id;
    } catch (error) {
      console.error('Firebase Functions 옵션 저장 실패:', error);
      throw error;
    }
  },

  // 옵션 업데이트 (Functions 사용)
  async updateOption(optionId: string, optionData: any) {
    try {
      console.log('Firebase Functions를 통해 옵션 업데이트 시작');
      const result = await callFirebaseFunction('updateOption', { optionId, ...optionData }, 'PUT');
      console.log('Firebase Functions 옵션 업데이트 완료:', result);
      return result;
    } catch (error) {
      console.error('Firebase Functions 옵션 업데이트 실패:', error);
      throw error;
    }
  },

  // 옵션 삭제 (Functions 사용)
  async deleteOption(optionId: string) {
    try {
      console.log('Firebase Functions를 통해 옵션 삭제 시작');
      const result = await callFirebaseFunction(`deleteOption?optionId=${optionId}`, {}, 'DELETE');
      console.log('Firebase Functions 옵션 삭제 완료:', result);
      return result;
    } catch (error) {
      console.error('Firebase Functions 옵션 삭제 실패:', error);
      throw error;
    }
  },

  // 모든 옵션 삭제
  async deleteAllOptions() {
    try {
      console.log('Firebase Functions를 통해 모든 옵션 삭제 시작');
      const result = await callFirebaseFunction('deleteAllOptions', {}, 'DELETE');
      console.log('Firebase Functions 모든 옵션 삭제 완료:', result);
      return result;
    } catch (error) {
      console.error('Firebase Functions 모든 옵션 삭제 실패:', error);
      throw error;
    }
  }
};

// 거래처 데이터 서비스
export const vendorService = {
  // 거래처 목록 가져오기
  async getVendors() {
    try {
      const vendorsRef = collection(db, 'vendors');
      const q = query(vendorsRef, orderBy('createdAt', 'desc'));
      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
    } catch (error) {
      console.error('거래처 목록 가져오기 실패:', error);
      throw error;
    }
  },

  // 실시간 거래처 목록 구독
  subscribeToVendors(callback: (vendors: any[]) => void) {
    const vendorsRef = collection(db, 'vendors');
    const q = query(vendorsRef, orderBy('createdAt', 'desc'));
    return onSnapshot(q, (snapshot) => {
      const vendors = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      callback(vendors);
    });
  },

  // 거래처 저장
  async saveVendor(vendorData: any) {
    try {
      const vendorsRef = collection(db, 'vendors');
      const docRef = await addDoc(vendorsRef, {
        ...vendorData,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
      return docRef.id;
    } catch (error) {
      console.error('거래처 저장 실패:', error);
      throw error;
    }
  },

  // 거래처 업데이트
  async updateVendor(vendorId: string, vendorData: any) {
    try {
      const vendorRef = doc(db, 'vendors', vendorId);
      await updateDoc(vendorRef, {
        ...vendorData,
        updatedAt: serverTimestamp()
      });
    } catch (error) {
      console.error('거래처 업데이트 실패:', error);
      throw error;
    }
  },

  // 거래처 삭제
  async deleteVendor(vendorId: string) {
    try {
      const vendorRef = doc(db, 'vendors', vendorId);
      await deleteDoc(vendorRef);
    } catch (error) {
      console.error('거래처 삭제 실패:', error);
      throw error;
    }
  }
};

// 회사 정보 데이터 서비스
export const companyInfoService = {
  // 회사 정보 가져오기
  async getCompanyInfo() {
    try {
      const companyInfoRef = collection(db, 'companyInfo');
      const snapshot = await getDocs(companyInfoRef);
      if (!snapshot.empty) {
        const doc = snapshot.docs[0];
        return { id: doc.id, ...doc.data() };
      }
      return null;
    } catch (error) {
      console.error('회사 정보 가져오기 실패:', error);
      throw error;
    }
  },

  // 회사 정보 저장/업데이트
  async saveCompanyInfo(companyInfoData: any) {
    try {
      const companyInfoRef = collection(db, 'companyInfo');
      const existing = await this.getCompanyInfo();
      
      if (existing) {
        // 기존 정보 업데이트
        const docRef = doc(db, 'companyInfo', existing.id);
        await updateDoc(docRef, {
          ...companyInfoData,
          updatedAt: serverTimestamp()
        });
        return existing.id;
      } else {
        // 새 정보 저장
        const docRef = await addDoc(companyInfoRef, {
          ...companyInfoData,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp()
        });
        return docRef.id;
      }
    } catch (error) {
      console.error('회사 정보 저장 실패:', error);
      throw error;
    }
  }
};

// 회계 데이터 서비스
export const accountingService = {
  // 회계 데이터 가져오기
  async getAccountingData() {
    try {
      const accountingRef = collection(db, 'accounting');
      const q = query(accountingRef, orderBy('createdAt', 'desc'));
      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
    } catch (error) {
      console.error('회계 데이터 가져오기 실패:', error);
      throw error;
    }
  },

  // 실시간 회계 데이터 구독
  subscribeToAccountingData(callback: (data: any[]) => void) {
    const accountingRef = collection(db, 'accounting');
    const q = query(accountingRef, orderBy('createdAt', 'desc'));
    return onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      callback(data);
    });
  },

  // 회계 데이터 저장
  async saveAccountingData(accountingData: any) {
    try {
      const accountingRef = collection(db, 'accounting');
      const docRef = await addDoc(accountingRef, {
        ...accountingData,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
      return docRef.id;
    } catch (error) {
      console.error('회계 데이터 저장 실패:', error);
      throw error;
    }
  },

  // 회계 데이터 업데이트
  async updateAccountingData(accountingId: string, accountingData: any) {
    try {
      const accountingRef = doc(db, 'accounting', accountingId);
      await updateDoc(accountingRef, {
        ...accountingData,
        updatedAt: serverTimestamp()
      });
    } catch (error) {
      console.error('회계 데이터 업데이트 실패:', error);
      throw error;
    }
  },

  // 회계 데이터 삭제
  async deleteAccountingData(accountingId: string) {
    try {
      const accountingRef = doc(db, 'accounting', accountingId);
      await deleteDoc(accountingRef);
    } catch (error) {
      console.error('회계 데이터 삭제 실패:', error);
      throw error;
    }
  }
};



// 통계 데이터 서비스
export const statisticsService = {
  // 통계 데이터 목록 가져오기
  async getStatistics() {
    try {
      const statisticsRef = collection(db, 'statistics');
      const q = query(statisticsRef, orderBy('createdAt', 'desc'));
      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
    } catch (error) {
      console.error('통계 데이터 목록 가져오기 실패:', error);
      throw error;
    }
  },

  // 실시간 통계 데이터 구독
  subscribeToStatistics(callback: (statistics: any[]) => void) {
    const statisticsRef = collection(db, 'statistics');
    const q = query(statisticsRef, orderBy('createdAt', 'desc'));
    return onSnapshot(q, (snapshot) => {
      const statistics = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      callback(statistics);
    });
  },

  // 통계 데이터 저장
  async saveStatistics(statisticsData: any) {
    try {
      const statisticsRef = collection(db, 'statistics');
      const docRef = await addDoc(statisticsRef, {
        ...statisticsData,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
      return docRef.id;
    } catch (error) {
      console.error('통계 데이터 저장 실패:', error);
      throw error;
    }
  },

  // 통계 데이터 업데이트
  async updateStatistics(statisticsId: string, statisticsData: any) {
    try {
      const statisticsRef = doc(db, 'statistics', statisticsId);
      await updateDoc(statisticsRef, {
        ...statisticsData,
        updatedAt: serverTimestamp()
      });
    } catch (error) {
      console.error('통계 데이터 업데이트 실패:', error);
      throw error;
    }
  },

  // 통계 데이터 삭제
  async deleteStatistics(statisticsId: string) {
    try {
      const statisticsRef = doc(db, 'statistics', statisticsId);
      await deleteDoc(statisticsRef);
    } catch (error) {
      console.error('통계 데이터 삭제 실패:', error);
      throw error;
    }
  }
};

// 세금계산서 데이터 서비스
export const taxInvoiceService = {
  // 세금계산서 목록 가져오기
  async getTaxInvoices() {
    try {
      const taxInvoicesRef = collection(db, 'taxInvoices');
      const q = query(taxInvoicesRef, orderBy('createdAt', 'desc'));
      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
    } catch (error) {
      console.error('세금계산서 목록 가져오기 실패:', error);
      throw error;
    }
  },

  // 실시간 세금계산서 구독
  subscribeToTaxInvoices(callback: (taxInvoices: any[]) => void) {
    const taxInvoicesRef = collection(db, 'taxInvoices');
    const q = query(taxInvoicesRef, orderBy('createdAt', 'desc'));
    return onSnapshot(q, (snapshot) => {
      const taxInvoices = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      callback(taxInvoices);
    });
  },

  // 세금계산서 저장
  async saveTaxInvoice(taxInvoiceData: any) {
    try {
      const taxInvoicesRef = collection(db, 'taxInvoices');
      const docRef = await addDoc(taxInvoicesRef, {
        ...taxInvoiceData,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
      return docRef.id;
    } catch (error) {
      console.error('세금계산서 저장 실패:', error);
      throw error;
    }
  },

  // 세금계산서 업데이트
  async updateTaxInvoice(taxInvoiceId: string, taxInvoiceData: any) {
    try {
      const taxInvoiceRef = doc(db, 'taxInvoices', taxInvoiceId);
      await updateDoc(taxInvoiceRef, {
        ...taxInvoiceData,
        updatedAt: serverTimestamp()
      });
    } catch (error) {
      console.error('세금계산서 업데이트 실패:', error);
      throw error;
    }
  },

  // 세금계산서 삭제
  async deleteTaxInvoice(taxInvoiceId: string) {
    try {
      const taxInvoiceRef = doc(db, 'taxInvoices', taxInvoiceId);
      await deleteDoc(taxInvoiceRef);
    } catch (error) {
      console.error('세금계산서 삭제 실패:', error);
      throw error;
    }
  }
};

// 사용자 관리 데이터 서비스
export const userService = {
  // 사용자 목록 가져오기
  async getUsers() {
    try {
      const usersRef = collection(db, 'users');
      const q = query(usersRef, orderBy('createdAt', 'desc'));
      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
    } catch (error) {
      console.error('사용자 목록 가져오기 실패:', error);
      throw error;
    }
  },

  // 실시간 사용자 목록 구독
  subscribeToUsers(callback: (users: any[]) => void) {
    const usersRef = collection(db, 'users');
    const q = query(usersRef, orderBy('createdAt', 'desc'));
    return onSnapshot(q, (snapshot) => {
      const users = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      callback(users);
    });
  },

  // 사용자 저장
  async saveUser(userData: any) {
    try {
      const usersRef = collection(db, 'users');
      const docRef = await addDoc(usersRef, {
        ...userData,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
      return docRef.id;
    } catch (error) {
      console.error('사용자 저장 실패:', error);
      throw error;
    }
  },

  // 사용자 업데이트
  async updateUser(userId: string, userData: any) {
    try {
      const userRef = doc(db, 'users', userId);
      await updateDoc(userRef, {
        ...userData,
        updatedAt: serverTimestamp()
      });
    } catch (error) {
      console.error('사용자 업데이트 실패:', error);
      throw error;
    }
  },

  // 사용자 삭제
  async deleteUser(userId: string) {
    try {
      const userRef = doc(db, 'users', userId);
      await deleteDoc(userRef);
    } catch (error) {
      console.error('사용자 삭제 실패:', error);
      throw error;
    }
  }
};

// 실측 데이터 서비스
export const measurementService = {
  // 실측 데이터 목록 가져오기 (Firebase Functions를 통한 조회)
  async getMeasurements() {
    try {
      console.log('Firebase Functions를 통한 실측 데이터 목록 조회 시작');
      
      // Firebase Functions를 통해 조회
      const result = await callFirebaseFunction('getMeasurements', {});
      
      console.log('Firebase Functions를 통한 실측 데이터 목록 조회 성공:', result);
      return result;
    } catch (error) {
      console.error('Firebase Functions를 통한 실측 데이터 목록 조회 실패:', error);
      throw error;
    }
  },

  // 실시간 실측 데이터 구독
  subscribeToMeasurements(callback: (measurements: any[]) => void) {
    const measurementsRef = collection(db, 'measurements');
    const q = query(measurementsRef, orderBy('createdAt', 'desc'));
    return onSnapshot(q, (snapshot) => {
      const measurements = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      callback(measurements);
    });
  },

  // 실측 데이터 저장 (Firebase Functions를 통한 저장)
  async saveMeasurement(measurementData: any) {
    try {
      console.log('Firebase Functions를 통한 실측 데이터 저장 시작:', measurementData);
      
      // Firebase Functions를 통해 저장
      const result = await callFirebaseFunction('saveMeasurement', measurementData);
      
      console.log('Firebase Functions를 통한 실측 데이터 저장 성공:', result);
      return result.id;
    } catch (error) {
      console.error('Firebase Functions를 통한 실측 데이터 저장 실패:', error);
      throw error;
    }
  },

  // 실측 데이터 업데이트 (Firebase Functions를 통한 업데이트)
  async updateMeasurement(measurementId: string, measurementData: any) {
    try {
      console.log('Firebase Functions를 통한 실측 데이터 업데이트 시작:', { measurementId, measurementData });
      
      // Firebase Functions를 통해 업데이트
      const result = await callFirebaseFunction('updateMeasurement', { measurementId, ...measurementData });
      
      console.log('Firebase Functions를 통한 실측 데이터 업데이트 성공:', result);
      return result;
    } catch (error) {
      console.error('Firebase Functions를 통한 실측 데이터 업데이트 실패:', error);
      throw error;
    }
  },

  // 실측 데이터 삭제 (Firebase Functions를 통한 삭제)
  async deleteMeasurement(measurementId: string) {
    try {
      console.log('Firebase Functions를 통한 실측 데이터 삭제 시작:', measurementId);
      
      // Firebase Functions를 통해 삭제
      const result = await callFirebaseFunction('deleteMeasurement', { measurementId });
      
      console.log('Firebase Functions를 통한 실측 데이터 삭제 성공:', result);
      return result;
    } catch (error) {
      console.error('Firebase Functions를 통한 실측 데이터 삭제 실패:', error);
      throw error;
    }
  }
};



// 납품 관리 데이터 서비스
export const deliveryService = {
  // 납품 목록 가져오기
  async getDeliveries() {
    try {
      const deliveriesRef = collection(db, 'deliveries');
      const q = query(deliveriesRef, orderBy('createdAt', 'desc'));
      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
    } catch (error) {
      console.error('납품 목록 가져오기 실패:', error);
      throw error;
    }
  },

  // 실시간 납품 목록 구독
  subscribeToDeliveries(callback: (deliveries: any[]) => void) {
    const deliveriesRef = collection(db, 'deliveries');
    const q = query(deliveriesRef, orderBy('createdAt', 'desc'));
    return onSnapshot(q, (snapshot) => {
      const deliveries = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      callback(deliveries);
    });
  },

  // 납품 저장 (Firebase Functions를 통한 저장)
  async saveDelivery(deliveryData: any) {
    try {
      console.log('Firebase Functions를 통한 납품 저장 시작:', deliveryData);
      
      // Firebase Functions를 통해 저장
      const result = await callFirebaseFunction('saveDelivery', deliveryData);
      
      console.log('Firebase Functions를 통한 납품 저장 성공:', result);
      return result.id || result.deliveryId;
    } catch (error) {
      console.error('Firebase Functions를 통한 납품 저장 실패:', error);
      throw error;
    }
  },

  // 납품 업데이트 (Firebase Functions를 통한 업데이트)
  async updateDelivery(deliveryId: string, deliveryData: any) {
    try {
      console.log('Firebase Functions를 통한 납품 업데이트 시작:', { deliveryId, deliveryData });
      
      // Firebase Functions를 통해 업데이트
      const result = await callFirebaseFunction('updateDelivery', { deliveryId, ...deliveryData });
      
      console.log('Firebase Functions를 통한 납품 업데이트 성공:', result);
      return result;
    } catch (error) {
      console.error('Firebase Functions를 통한 납품 업데이트 실패:', error);
      throw error;
    }
  },

  // 납품 삭제
  async deleteDelivery(deliveryId: string) {
    try {
      const deliveryRef = doc(db, 'deliveries', deliveryId);
      await deleteDoc(deliveryRef);
    } catch (error) {
      console.error('납품 삭제 실패:', error);
      throw error;
    }
  }
}; 