import { EstimateTemplate, TemplateRoom, ProjectSimilarity } from '../types';
import { getAuthHeaders, API_BASE } from './auth';

const TEMPLATES_STORAGE_KEY = 'erp_estimate_templates';

// 템플릿 로드 (백엔드 연동)
export const loadTemplates = async (): Promise<EstimateTemplate[]> => {
  try {
    const response = await fetch(`${API_BASE}/templates`, {
      headers: getAuthHeaders(),
    });
    if (!response.ok) {
      if (response.status === 401 || response.status === 403) {
        // 토큰이 유효하지 않거나 만료된 경우, 앱에서 로그아웃 처리 필요
        // 여기서는 에러를 던져서 상위 컴포넌트가 처리하도록 함
        throw new Error('Unauthorized');
      }
      throw new Error('Failed to load templates');
    }
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error loading templates:', error);
    return [];
  }
};

// 템플릿 저장 (백엔드 연동)
export const saveTemplates = async (
  templates: EstimateTemplate[]
): Promise<void> => {
  try {
    const response = await fetch(`${API_BASE}/templates`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(templates),
    });
    if (!response.ok) {
      if (response.status === 401 || response.status === 403) {
        throw new Error('Unauthorized');
      }
      throw new Error('Failed to save templates');
    }
  } catch (error) {
    console.error('Error saving templates:', error);
    // 여기서도 에러를 다시 던져서 사용자에게 피드백을 줄 수 있음
    throw error;
  }
};

// 새 템플릿 생성
export const createTemplate = (
  name: string,
  description: string,
  projectName: string
): EstimateTemplate => {
  return {
    id: Date.now().toString(),
    name,
    description,
    projectName,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    rooms: [],
  };
};

// 새 방 생성
export const createRoom = (name: string): TemplateRoom => {
  return {
    id: Date.now().toString(),
    name,
    width: 0,
    height: 0,
    quantity: 1,
    productType: '',
    curtainType: '',
    pleatType: '',
    productName: '',
    vendor: '',
    brand: '',
    space: '',
    details: '',
    salePrice: 0,
    cost: 0,
    purchaseCost: 0,
  };
};

// 템플릿 방을 견적서 행으로 변환
export const templateRoomToEstimateRow = (room: TemplateRoom) => {
  return {
    id: Date.now() + Math.random(),
    type: 'product' as const,
    vendor: room.vendor,
    brand: room.brand,
    space: room.space,
    productType: room.productType,
    curtainType: room.curtainType,
    pleatType: room.pleatType,
    productName: room.productName,
    width: `${room.width}mm`,
    details: room.details,
    widthMM: room.width,
    heightMM: room.height,
    area: (room.width * room.height) / 1000000, // m²
    lineDir: '',
    lineLen: 0,
    pleatAmount: '',
    widthCount: 1,
    quantity: room.quantity,
    totalPrice: room.salePrice * room.quantity,
    salePrice: room.salePrice,
    cost: room.cost,
    purchaseCost: room.purchaseCost,
    margin: room.salePrice - room.cost,
    note: '',
  };
};

// 프로젝트명 유사도 검색
export const findSimilarProjects = (
  projectName: string,
  templates: EstimateTemplate[]
): ProjectSimilarity[] => {
  if (!projectName.trim()) return [];

  const similarities = templates.map(template => {
    const similarity = calculateSimilarity(
      projectName.toLowerCase(),
      template.projectName.toLowerCase()
    );
    return { template, similarity };
  });

  return similarities
    .filter(item => item.similarity > 0.3) // 30% 이상 유사한 것만
    .sort((a, b) => b.similarity - a.similarity)
    .slice(0, 5); // 상위 5개만
};

// 문자열 유사도 계산 (간단한 Jaccard 유사도)
const calculateSimilarity = (str1: string, str2: string): number => {
  const words1 = str1.split(/\s+/);
  const words2 = str2.split(/\s+/);

  const intersection = words1.filter(word => words2.includes(word));
  const union = Array.from(new Set([...words1, ...words2]));

  return union.length > 0 ? intersection.length / union.length : 0;
};
