declare module '@mui/material';
declare module '@mui/icons-material';
declare module '@mui/x-data-grid';
declare module '@emotion/react';
declare module '@emotion/styled';

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
}

export interface OptionItem {
  id: number;
  name: string;
  amount: number;
  purchaseAmount: number;
  type: 'fixed' | 'percent' | '%';
  note: string | '폭당' | 'm당' | '추가' | '포함' | 'm2당';
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
}
