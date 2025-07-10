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
