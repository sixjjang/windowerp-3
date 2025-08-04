declare module '@mui/material';
declare module '@mui/icons-material';
declare module '@mui/x-data-grid';
declare module '@emotion/react';
declare module '@emotion/styled';

// Kakao SDK 타입 정의
declare global {
  interface Window {
    Kakao: {
      init: (key: string) => void;
      isInitialized: () => boolean;
      Link: {
        sendDefault: (options: {
          objectType: string;
          text: string;
          link: {
            mobileWebUrl: string;
            webUrl: string;
          };
        }) => void;
      };
    };
  }
}

// 템플릿 관련 타입들
export interface TemplateRoom {
  id: string;
  name: string;
  width: number;
  height: number;
  quantity: number;
  productType: string;
  curtainType: string;
  pleatType: string;
  productName: string;
  vendor: string;
  brand: string;
  space: string;
  details: string;
  salePrice: number;
  cost: number;
  purchaseCost: number;
}

export interface EstimateTemplate {
  id: string;
  name: string;
  description: string;
  projectName: string;
  createdAt: string;
  updatedAt: string;
  rooms: TemplateRoom[];
}

export interface ProjectSimilarity {
  template: EstimateTemplate;
  similarity: number;
}

// 견적서 관련 공통 타입들
export interface EstimateRow {
  id: number;
  type: 'product' | 'option';
  vendor: string;
  brand: string;
  space: string;
  productType: string;
  curtainType: string;
  pleatType: string;
  productName: string;
  width: string;
  details: string;
  widthMM: number;
  heightMM: number;
  area: number;
  lineDir: string;
  lineLen: number;
  pleatAmount: string | number;
  widthCount: number;
  quantity: number;
  totalPrice: number;
  salePrice: number;
  cost: number;
  purchaseCost: number;
  margin: number;
  note: string;
  productCode?: string;
  parent?: EstimateRow | null;
  showRequestNote?: boolean;
  originalIndex?: number;
  optionLabel?: string;
  options?: OptionItem[];
  isManualQuantity?: boolean; // 수동 수량 설정 여부
  // 추가 필드들
  lineDirection?: string;
  lineLength?: string;
  customLineLength?: string;
  spaceCustom?: string;
  productionContent?: string; // 제작내용
  pleatAmountCustom?: string;
  minOrderQty?: number;
  largePlainPrice?: number;
  largePlainCost?: number;
  // === 자동계산 관련 ===
  pleatMultiplier?: string;
  pleatCount?: number;
}

export interface OptionItem {
  id: number;
  name?: string; // EstimateTemplate에서 사용
  optionName?: string; // EstimateManagement에서 사용
  amount?: number; // types.d.ts에서 사용
  purchaseAmount?: number; // types.d.ts에서 사용
  type?: 'fixed' | 'percent' | '%'; // types.d.ts에서 사용
  salePrice: number;
  purchaseCost: number;
  details: string;
  note: string | '폭당' | 'm당' | '추가' | '포함' | 'm2당';
  quantity?: number;
  optionType?: string; // OptionManagement에서 사용
}

// 시공기사 관련 타입
export interface Installer {
  id: string;
  vendorName: string;
  vendorPhone: string;
  installerName: string;
  installerPhone: string;
  vehicleNumber: string;
  memo: string;
  createdAt: string;
}

// AS접수 관련 타입
export interface ASRequest {
  id: number;
  orderId: string;
  orderNo: string;
  address: string;
  customerName: string;
  contact: string;
  installationDate: string;
  asRequestDate: string;
  selectedProducts: string[];
  processingMethod: '거래처AS' | '판매자AS' | '고객직접';
  problem: string;
  solution: string;
  cost: number;
  memo: string;
  isCompleted: boolean;
  status: 'AS처리중' | 'AS완료'; // AS상태 추가
  asProcessDate?: string; // AS처리일자 추가
  createdAt: string;
}

// 수금내역 관련 타입
export interface PaymentRecord {
  id: number;
  orderId: string;
  orderNo: string;
  paymentDate: string;
  paymentMethod: string;
  amount: number;
  remainingAmount: number;
  refundAmount?: number; // 오입금 송금 금액
  refundMethod?: string; // 오입금 송금 방법
  refundDate?: string; // 오입금 송금 일자
  refundMemo?: string; // 오입금 송금 메모
  createdAt: string;
}

export interface Estimate {
  id: number;
  name: string;
  estimateNo: string;
  estimateDate: string;
  customerName: string;
  contact: string;
  emergencyContact: string;
  projectName: string;
  type: string;
  address: string;
  rows: EstimateRow[];
  // 추가 필드들
  totalAmount?: number;
  discountedAmount?: number;
  discountAmount?: string; // 할인금액
  discountRate?: string; // 할인율
  measurementRequired?: boolean | 'direct';
  measurementInfo?: {
    measuredAt?: string;
    measuredBy?: string;
    measurementMethod?: '현장실측' | '실측없이진행' | '직접입력' | string;
    eventId?: string;
    eventTitle?: string;
    customerName?: string;
    address?: string;
  };
  status?: string;
  createdAt?: string;
  updatedAt?: string;
  products?: string;
  // 계약 관련 필드
  contractNo?: string;
  // 주문관리 추가 필드들
  measurementDate?: string; // 실측일자 (년,월,일,시,30분단위)
  installationDate?: string; // 시공일자 (년,월,일,시,30분단위)
  installerId?: string; // 시공기사 ID
  installerName?: string; // 시공기사명
  // 제품준비 상태 추가
  productStatus?: '제품준비' | '납품완료';
  // 납품정보 추가
  deliveryInfo?: {
    [vendor: string]: {
      method?: string;
      date?: string;
      company?: string;
      contact?: string;
      address?: string;
    };
  };
}
