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

// 납품 ID 변환 함수 (일관된 ID 생성)
const convertDeliveryId = (originalId: string): string => {
  if (!originalId) {
    return `delivery_${Date.now()}`;
  }
  
  // 이미 변환된 형태인지 확인
  if (originalId.startsWith('delivery_') && originalId.includes('_')) {
    return originalId;
  }
  
  // 특수문자가 있으면 변환
  if (originalId.includes(' ') || originalId.includes('/') || originalId.includes('\\')) {
    const cleanId = originalId.replace(/[^a-zA-Z0-9가-힣]/g, '').substring(0, 20);
    return `delivery_${cleanId}_${Date.now()}`;
  }
  
  // 특수문자가 없으면 그대로 사용
  return originalId;
};

// 실제 저장된 납품 ID 찾기 함수
const findActualDeliveryId = async (originalId: string): Promise<string> => {
  try {
    // 먼저 원본 ID로 직접 시도
    const directResult = await callFirebaseFunction('getDeliveries', {}, 'GET');
    const directMatch = directResult.find((delivery: any) => delivery.id === originalId);
    if (directMatch) {
      return originalId;
    }
    
    // 변환된 ID로 시도
    const convertedId = convertDeliveryId(originalId);
    const convertedMatch = directResult.find((delivery: any) => delivery.id === convertedId);
    if (convertedMatch) {
      return convertedId;
    }
    
    // 주소나 고객명으로 검색
    const addressMatch = directResult.find((delivery: any) => 
      delivery.address === originalId || 
      delivery.customerName === originalId
    );
    if (addressMatch) {
      return addressMatch.id;
    }
    
    // 찾을 수 없으면 원본 ID 반환
    return originalId;
  } catch (error) {
    console.error('실제 납품 ID 찾기 실패:', error);
    return originalId;
  }
};

// Firebase Functions 호출을 위한 유틸리티 함수
export const callFirebaseFunction = async (functionName: string, data: any, method: string = 'POST') => {
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

    let url = `https://us-central1-windowerp-3.cloudfunctions.net/${functionName}`;

    // GET, DELETE 메서드인 경우 query parameter로 변환
    if (method === 'GET' || method === 'DELETE') {
      if (data && Object.keys(data).length > 0) {
        const params = new URLSearchParams();
        Object.entries(data).forEach(([key, value]) => {
          if (value !== undefined && value !== null) {
            params.append(key, String(value));
          }
        });
        url += `?${params.toString()}`;
      }
    } else {
      // POST, PUT 등인 경우 body에 추가
      requestOptions.body = JSON.stringify(data);
    }

    const response = await fetch(url, requestOptions);

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

  // 모든 주문서 삭제 (강제 삭제)
  async deleteAllOrders() {
    try {
      console.log('Firebase에서 모든 주문서 삭제 시작');
      
      // 1. 모든 주문서 가져오기
      const allOrders = await this.getOrders();
      console.log('삭제할 주문서 수:', allOrders.length);
      console.log('삭제할 주문서 ID들:', allOrders.map(o => o.id));
      
      if (allOrders.length === 0) {
        console.log('삭제할 주문서가 없습니다.');
        return { success: true, message: '삭제할 주문서가 없습니다.', deletedCount: 0 };
      }
      
      // 2. 모든 주문서 삭제 (개별적으로 처리하여 에러 추적)
      let successCount = 0;
      let failCount = 0;
      
      for (const order of allOrders) {
        try {
          console.log(`주문서 삭제 시도: ${order.id}`);
          await deleteDoc(doc(db, 'orders', order.id));
          console.log(`주문서 삭제 성공: ${order.id}`);
          successCount++;
        } catch (error) {
          console.error(`주문서 삭제 실패: ${order.id}`, error);
          failCount++;
        }
      }
      
      console.log(`삭제 결과: 성공 ${successCount}개, 실패 ${failCount}개`);
      
      // 3. 삭제 확인 (잠시 대기 후)
      await new Promise(resolve => setTimeout(resolve, 2000));
      const remainingOrders = await this.getOrders();
      console.log('삭제 후 남은 주문서 수:', remainingOrders.length);
      console.log('남은 주문서 ID들:', remainingOrders.map(o => o.id));
      
      if (remainingOrders.length > 0) {
        console.warn('⚠️ 일부 주문서가 여전히 남아있습니다. 재시도합니다.');
        
        // 재시도
        for (const order of remainingOrders) {
          try {
            await deleteDoc(doc(db, 'orders', order.id));
            console.log(`재시도로 주문서 삭제 성공: ${order.id}`);
          } catch (error) {
            console.error(`재시도로도 주문서 삭제 실패: ${order.id}`, error);
          }
        }
        
        // 최종 확인
        const finalRemainingOrders = await this.getOrders();
        console.log('최종 남은 주문서 수:', finalRemainingOrders.length);
      }
      
      return { 
        success: true, 
        message: `${successCount}개 주문서가 삭제되었습니다. (실패: ${failCount}개)`, 
        deletedCount: successCount,
        failedCount: failCount,
        remainingCount: remainingOrders.length
      };
      
    } catch (error) {
      console.error('모든 주문서 삭제 실패:', error);
      throw error;
    }
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

  // 주문서 삭제 (강화된 로직 - 클라이언트 ID와 Firebase ID 매핑)
  async deleteOrder(orderId: string) {
    let actualFirebaseId = orderId;
    
    try {
      console.log('🔥 Firebase에서 주문서 삭제 시작:', orderId);
      
      // 1. 모든 주문서를 가져와서 ID 매칭
      const allOrders = await this.getOrders();
      console.log('📋 현재 Firebase에 있는 주문서 수:', allOrders.length);
      
      // 2. 삭제할 주문서 찾기 (여러 ID 필드와 매칭)
      const matchingOrder = allOrders.find(order => 
        order.id === orderId || 
        (order as any).id === orderId ||
        (order as any).clientId === orderId ||
        (order as any).tempId === orderId ||
        (order as any).orderNo === orderId ||
        (order as any).internalId === orderId
      );
      
      if (matchingOrder) {
        actualFirebaseId = matchingOrder.id;
        console.log('✅ 삭제할 주문서 찾음:', orderId, '-> Firebase ID:', actualFirebaseId);
      } else {
        console.log('❌ 삭제할 주문서를 찾을 수 없음:', orderId);
        console.log('🔍 현재 Firebase 주문서들:', allOrders.map(o => ({ 
          firebaseId: o.id, 
          internalId: (o as any).id,
          orderNo: (o as any).orderNo 
        })));
        return { success: false, message: '삭제할 주문서를 찾을 수 없습니다.' };
      }
      
      // 3. Firestore에서 삭제
      const orderRef = doc(db, 'orders', actualFirebaseId);
      await deleteDoc(orderRef);
      console.log('🗑️ Firestore에서 주문서 삭제 완료:', actualFirebaseId);
      
      // 4. 삭제 확인 (잠시 대기 후)
      await new Promise(resolve => setTimeout(resolve, 1000));
      const checkDoc = await getDoc(orderRef);
      
      if (checkDoc.exists()) {
        console.error('❌ 주문서 삭제 실패: 문서가 여전히 존재함');
        throw new Error('주문서 삭제 후에도 여전히 존재합니다.');
      }
      
      console.log('✅ 주문서 삭제 확인 완료:', actualFirebaseId);
      
      // 5. 최종 확인 - 전체 주문서 수 재확인
      const remainingOrders = await this.getOrders();
      console.log('📊 삭제 후 남은 주문서 수:', remainingOrders.length);
      
      return { 
        success: true, 
        message: '주문서가 성공적으로 삭제되었습니다.',
        deletedId: actualFirebaseId,
        remainingCount: remainingOrders.length
      };
      
    } catch (error) {
      console.error('❌ 주문서 삭제 실패:', error);
      
      // 6. 강제 삭제 시도 (모든 주문서 삭제)
      try {
        console.log('🔄 강제 삭제 모드: 모든 주문서 삭제 시도');
        const allOrders = await this.getOrders();
        
        if (allOrders.length > 0) {
          const deletePromises = allOrders.map(order => {
            console.log('🗑️ 강제 삭제:', order.id);
            return deleteDoc(doc(db, 'orders', order.id));
          });
          
          await Promise.all(deletePromises);
          console.log('✅ 모든 주문서 강제 삭제 완료');
          
          // 최종 확인
          const finalCheck = await this.getOrders();
          console.log('📊 강제 삭제 후 남은 주문서 수:', finalCheck.length);
          
          return { 
            success: true, 
            message: '모든 주문서가 강제 삭제되었습니다.', 
            forceDeleted: true,
            deletedCount: allOrders.length,
            remainingCount: finalCheck.length
          };
        }
      } catch (forceDeleteError) {
        console.error('❌ 강제 삭제도 실패:', forceDeleteError);
      }
      
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
      
      // 일관된 ID 변환 함수 사용
      const safeDeliveryId = convertDeliveryId(deliveryData.id);
      
      const deliveryDataWithSafeId = {
        ...deliveryData,
        id: safeDeliveryId
      };
      
      // Firebase Functions를 통해 저장
      const result = await callFirebaseFunction('saveDelivery', deliveryDataWithSafeId);
      
      console.log('Firebase Functions를 통한 납품 저장 성공:', result);
      return result.id || result.deliveryId || safeDeliveryId;
    } catch (error) {
      console.error('Firebase Functions를 통한 납품 저장 실패:', error);
      throw error;
    }
  },

  // 납품 업데이트 (Firebase Functions를 통한 업데이트)
  async updateDelivery(deliveryId: string, deliveryData: any) {
    try {
      console.log('Firebase Functions를 통한 납품 업데이트 시작:', { deliveryId, deliveryData });
      
      // 실제 저장된 ID 찾기
      const actualDeliveryId = await findActualDeliveryId(deliveryId);
      console.log(`🔍 실제 저장된 납품 ID: ${deliveryId} → ${actualDeliveryId}`);
      
      // Firebase Functions를 통해 업데이트
      const result = await callFirebaseFunction('updateDelivery', { 
        deliveryId: actualDeliveryId, 
        ...deliveryData 
      });
      
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

// FCM 토큰 관리 및 푸시 알림 서비스
export const fcmService = {
  // FCM 토큰 저장
  async saveFCMToken(userId: string, fcmToken: string, deviceType: string = 'web') {
    try {
      console.log('FCM 토큰 저장 시작:', { userId, deviceType });
      
      const result = await callFirebaseFunction('saveFCMToken', { 
        userId, 
        fcmToken, 
        deviceType 
      });
      
      console.log('FCM 토큰 저장 성공:', result);
      return result;
    } catch (error) {
      console.error('FCM 토큰 저장 실패:', error);
      throw error;
    }
  },

  // FCM 토큰 삭제
  async deleteFCMToken(userId: string) {
    try {
      console.log('FCM 토큰 삭제 시작:', userId);
      
      const result = await callFirebaseFunction('deleteFCMToken', { userId });
      
      console.log('FCM 토큰 삭제 성공:', result);
      return result;
    } catch (error) {
      console.error('FCM 토큰 삭제 실패:', error);
      throw error;
    }
  },

  // 채팅 메시지 전송 (푸시 알림 포함)
  async sendChatMessageWithNotification(user: string, text: string, userId: string) {
    try {
      console.log('채팅 메시지 전송 시작 (푸시 알림 포함):', { user, text, userId });
      
      const result = await callFirebaseFunction('saveEmployeeChatWithNotification', { 
        user, 
        text, 
        userId 
      });
      
      console.log('채팅 메시지 전송 성공 (푸시 알림 포함):', result);
      return result;
    } catch (error) {
      console.error('채팅 메시지 전송 실패 (푸시 알림 포함):', error);
      throw error;
    }
  },

  // 스케줄 채팅 메시지 전송 (푸시 알림 포함)
  async sendScheduleChatMessageWithNotification(
    user: string, 
    text: string, 
    userId: string, 
    scheduleId: string, 
    eventTitle?: string
  ) {
    try {
      console.log('스케줄 채팅 메시지 전송 시작 (푸시 알림 포함):', { 
        user, 
        text, 
        userId, 
        scheduleId, 
        eventTitle 
      });
      
      const result = await callFirebaseFunction('saveScheduleChatWithNotification', { 
        user, 
        text, 
        userId, 
        scheduleId, 
        eventTitle 
      });
      
      console.log('스케줄 채팅 메시지 전송 성공 (푸시 알림 포함):', result);
      return result;
    } catch (error) {
      console.error('스케줄 채팅 메시지 전송 실패 (푸시 알림 포함):', error);
      throw error;
    }
  }
}; 

// 시공자 관리 데이터 서비스
export const workerService = {
  // 시공자 목록 가져오기
  async getWorkers() {
    try {
      console.log('Firebase Functions를 통한 시공자 목록 조회 시작');
      
      // JWT 토큰 가져오기
      const token = localStorage.getItem('token');
      
      const requestOptions: RequestInit = {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Origin': window.location.origin,
        }
      };
      
      // 토큰이 있으면 Authorization 헤더 추가
      if (token) {
        requestOptions.headers = {
          ...requestOptions.headers,
          'Authorization': `Bearer ${token}`
        };
      }
      
      const url = 'https://us-central1-windowerp-3.cloudfunctions.net/getWorkers';
      const response = await fetch(url, requestOptions);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('getWorkers 응답 에러:', response.status, errorText);
        
        // 401 에러인 경우 토큰 문제, 403 에러인 경우 권한 문제
        if (response.status === 401) {
          console.log('인증 토큰이 없거나 만료되었습니다. 로컬 데이터를 사용합니다.');
          return [];
        }
        
        throw new Error(`getWorkers 호출 실패: ${response.status} - ${errorText}`);
      }
      
      const result = await response.json();
      console.log('Firebase Functions를 통한 시공자 목록 조회 완료:', result.workers?.length || 0, '명');
      return result.workers || [];
    } catch (error) {
      console.error('Firebase Functions를 통한 시공자 목록 조회 실패:', error);
      
      // CORS 에러나 네트워크 에러인 경우 빈 배열 반환
      if (error instanceof TypeError && error.message.includes('Failed to fetch')) {
        console.log('네트워크 에러로 인해 로컬 데이터를 사용합니다.');
        return [];
      }
      
      throw error;
    }
  },

  // 실시간 시공자 목록 구독
  subscribeToWorkers(callback: (workers: any[]) => void) {
    const workersRef = collection(db, 'workers');
    const q = query(workersRef, orderBy('createdAt', 'desc'));
    return onSnapshot(q, (snapshot) => {
      const workers = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      callback(workers);
    });
  },

  // 시공자 저장
  async saveWorker(workerData: any) {
    try {
      console.log('Firebase Functions를 통한 시공자 저장 시작:', workerData);
      
      // Firebase Functions를 통해 저장
      const result = await callFirebaseFunction('saveWorker', workerData);
      
      console.log('Firebase Functions를 통한 시공자 저장 완료:', result);
      return result.id;
    } catch (error) {
      console.error('Firebase Functions를 통한 시공자 저장 실패:', error);
      throw error;
    }
  },

  // 시공자 업데이트
  async updateWorker(workerId: string, workerData: any) {
    try {
      console.log('Firebase Functions를 통한 시공자 업데이트 시작:', { workerId, workerData });
      
      // Firebase Functions를 통해 업데이트
      const result = await callFirebaseFunction('updateWorker', { workerId, ...workerData }, 'PUT');
      
      console.log('Firebase Functions를 통한 시공자 업데이트 완료:', result);
    } catch (error) {
      console.error('Firebase Functions를 통한 시공자 업데이트 실패:', error);
      throw error;
    }
  },

  // 시공자 삭제
  async deleteWorker(workerId: string) {
    try {
      console.log('Firebase Functions를 통한 시공자 삭제 시작:', workerId);
      
      // Firebase Functions를 통해 삭제
      const result = await callFirebaseFunction('deleteWorker', { workerId }, 'DELETE');
      
      console.log('Firebase Functions를 통한 시공자 삭제 완료:', result);
    } catch (error) {
      console.error('Firebase Functions를 통한 시공자 삭제 실패:', error);
      throw error;
    }
  }
}; 