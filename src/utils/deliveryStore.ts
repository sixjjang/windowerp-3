import { create } from 'zustand';
import { persist } from 'zustand/middleware';

// =================================================================================
// TYPES & INTERFACES
// =================================================================================

export type DeliveryStatus = '제품준비중' | '납품완료';
export type PaymentStatus = '미수금' | '결제완료';
export type ConstructionType = '의뢰' | '제품만';

export interface PaymentRecord {
  id: string;
  date: string;
  time: string;
  amount: number;
  method: '현금' | '계좌이체' | '카드';
  note: string;
}

export interface ASRecord {
  id: string;
  date: string;
  productName: string;
  space?: string;
  productCode?: string;
  productionDimensions?: string;
  vendor?: string;
  issue: string;
  solution: string;
  status: '접수' | '처리중' | '완료';
  cost?: number;
  note?: string;
  processMethod?: '거래처AS' | '판매자AS' | '고객직접AS';
  visitDate?: string;
  deliveryId?: string;
  customerName?: string;
  contractNo?: string;
  contact?: string;
  address?: string;
  vendorName?: string;
  vendorId?: string;
  vendorContact?: string;
  vendorAddress?: string;
  vendorEmail?: string;
}

export interface DeliverySite {
  id: string;
  // 고객정보
  customerName: string;
  projectName: string;
  projectType?: string; // 견적서의 프로젝트 타입
  contact: string;
  address: string;

  // 시공정보
  constructionType: ConstructionType;
  constructionDate: string;
  constructionTime: string;
  constructionWorker?: string; // 시공자
  vehicleNumber?: string; // 차량번호
  constructionWorkerPhone?: string; // 시공자 전화번호

  // 상태
  deliveryStatus: DeliveryStatus;
  paymentStatus: PaymentStatus;

  // 금액정보
  totalAmount: number;
  discountAmount: number;
  finalAmount: number;
  paidAmount: number;
  remainingAmount: number;

  // 수금기록
  paymentRecords: PaymentRecord[];

  // AS 기록
  asRecords: ASRecord[];

  // 메모
  memo?: string;
  memoCreatedAt?: string;

  // 생성/수정 일시
  createdAt?: string;
  updatedAt?: string;

  // 추가: 모든 주문의 제품 정보 통합
  items?: any[];
  // 레일 정보 별도 저장
  railItems?: any[];
}

export interface DeliveryStore {
  deliveries: DeliverySite[];
  addDelivery: (delivery: DeliverySite) => void;
  removeDelivery: (deliveryId: string) => void;
  updateDelivery: (
    deliveryId: string,
    updatedFields: Partial<DeliverySite>
  ) => void;
  updateDeliveryStatus: (deliveryId: string, status: DeliveryStatus) => void;
  updatePaymentStatus: (deliveryId: string, status: PaymentStatus) => void;
  addPaymentRecord: (deliveryId: string, record: PaymentRecord) => void;
  addASRecord: (deliveryId: string, record: ASRecord) => void;
  removeASRecord: (deliveryId: string, asRecordId: string) => void;
  setDeliveries: (deliveries: DeliverySite[]) => void;
  removeDuplicateDeliveries: () => void;
  consolidateProjectDeliveries: () => void;
}

export const useDeliveryStore = create(
  persist<DeliveryStore>(
    (set, get) => ({
      deliveries: [],
      addDelivery: delivery =>
        set(state => ({ deliveries: [...state.deliveries, delivery] })),
      removeDelivery: deliveryId =>
        set(state => ({
          deliveries: state.deliveries.filter(d => d.id !== deliveryId),
        })),
      updateDelivery: (deliveryId, updatedFields) =>
        set(state => ({
          deliveries: state.deliveries.map(delivery =>
            delivery.id === deliveryId
              ? {
                  ...delivery,
                  ...updatedFields,
                  updatedAt: new Date().toISOString(),
                }
              : delivery
          ),
        })),
      updateDeliveryStatus: (deliveryId, status) => {
        set(state => ({
          deliveries: state.deliveries.map(delivery =>
            delivery.id === deliveryId
              ? {
                  ...delivery,
                  deliveryStatus: status,
                  updatedAt: new Date().toISOString(),
                }
              : delivery
          ),
        }));
      },
      updatePaymentStatus: (deliveryId, status) => {
        set(state => ({
          deliveries: state.deliveries.map(delivery =>
            delivery.id === deliveryId
              ? {
                  ...delivery,
                  paymentStatus: status,
                  updatedAt: new Date().toISOString(),
                }
              : delivery
          ),
        }));
      },
      addPaymentRecord: (deliveryId, record) => {
        set(state => ({
          deliveries: state.deliveries.map(delivery => {
            if (delivery.id === deliveryId) {
              const newPaymentRecords = [...delivery.paymentRecords, record];
              const paidAmount = newPaymentRecords.reduce(
                (sum, r) => sum + r.amount,
                0
              );
              const remainingAmount = delivery.finalAmount - paidAmount;
              const paymentStatus =
                remainingAmount <= 0 ? '결제완료' : '미수금';

              return {
                ...delivery,
                paymentRecords: newPaymentRecords,
                paidAmount,
                remainingAmount,
                paymentStatus,
                updatedAt: new Date().toISOString(),
              };
            }
            return delivery;
          }),
        }));
      },
      addASRecord: (deliveryId, record) => {
        set(state => ({
          deliveries: state.deliveries.map(delivery => {
            if (delivery.id === deliveryId) {
              // 중복 체크: 같은 날짜, 같은 제품명, 같은 문제로 이미 등록된 AS가 있는지 확인
              const existingAS = delivery.asRecords?.find(
                existing =>
                  existing.date === record.date &&
                  existing.productName === record.productName &&
                  existing.issue === record.issue
              );

              // 중복된 AS가 있으면 기존 것을 유지하고 새 것을 추가하지 않음
              if (existingAS) {
                console.warn('중복된 AS 등록 시도 감지:', {
                  date: record.date,
                  productName: record.productName,
                  issue: record.issue,
                });
                return delivery; // 기존 상태 유지
              }

              return {
                ...delivery,
                asRecords: [...(delivery.asRecords || []), record],
                updatedAt: new Date().toISOString(),
              };
            }
            return delivery;
          }),
        }));
      },
      removeASRecord: (deliveryId, asRecordId) => {
        set(state => ({
          deliveries: state.deliveries.map(delivery => {
            if (delivery.id === deliveryId) {
              return {
                ...delivery,
                asRecords:
                  delivery.asRecords?.filter(
                    record => record.id !== asRecordId
                  ) || [],
                updatedAt: new Date().toISOString(),
              };
            }
            return delivery;
          }),
        }));
      },
      setDeliveries: deliveries => set({ deliveries }),
      removeDuplicateDeliveries: () =>
        set(state => ({
          deliveries: state.deliveries.filter(
            (delivery, index, self) =>
              index === self.findIndex(d => d.id === delivery.id)
          ),
        })),
      consolidateProjectDeliveries: () =>
        set(state => {
          // 프로젝트별로 그룹화
          const projectGroups = state.deliveries.reduce(
            (groups, delivery) => {
              // ID에서 프로젝트 정보 추출 (예: "호매실도 212-101_2025-06-24-delivery")
              const projectKey = delivery.id.replace('-delivery', '');
              if (!groups[projectKey]) {
                groups[projectKey] = [];
              }
              groups[projectKey].push(delivery);
              return groups;
            },
            {} as { [key: string]: DeliverySite[] }
          );

          // 각 프로젝트 그룹에서 하나의 통합된 납품 데이터 생성
          const consolidatedDeliveries: DeliverySite[] = [];

          Object.entries(projectGroups).forEach(([projectKey, deliveries]) => {
            if (deliveries.length === 1) {
              // 단일 납품 데이터는 그대로 유지
              consolidatedDeliveries.push(deliveries[0]);
            } else {
              // 여러 납품 데이터가 있는 경우 통합
              const firstDelivery = deliveries[0];
              const totalAmount = deliveries.reduce(
                (sum, delivery) => sum + delivery.totalAmount,
                0
              );
              const totalPaidAmount = deliveries.reduce(
                (sum, delivery) => sum + delivery.paidAmount,
                0
              );

              const consolidatedDelivery: DeliverySite = {
                ...firstDelivery,
                id: `${projectKey}-delivery`,
                totalAmount,
                finalAmount: totalAmount,
                paidAmount: totalPaidAmount,
                remainingAmount: totalAmount - totalPaidAmount,
                paymentStatus:
                  totalPaidAmount >= totalAmount ? '결제완료' : '미수금',
                updatedAt: new Date().toISOString(),
              };

              consolidatedDeliveries.push(consolidatedDelivery);
            }
          });

          return { deliveries: consolidatedDeliveries };
        }),
    }),
    {
      name: 'delivery-management-storage',
    }
  )
);

// ===================== 시공자 마스터(공용) zustand =====================
export interface WorkerInfo {
  id: string; // uuid
  name: string;
  phone: string;
  vehicleNumber: string;
}

export interface WorkerStore {
  workers: WorkerInfo[];
  addWorker: (worker: WorkerInfo) => void;
  updateWorker: (id: string, updated: Partial<WorkerInfo>) => void;
  removeWorker: (id: string) => void;
}

export const useWorkerStore = create(
  persist<WorkerStore>(
    (set, get) => ({
      workers: [],
      addWorker: worker => {
        // 중복(이름+전화) 체크
        const exists = get().workers.some(
          w => w.name === worker.name && w.phone === worker.phone
        );
        if (!exists) {
          set(state => ({ workers: [...state.workers, worker] }));
        }
      },
      updateWorker: (id, updated) => {
        set(state => ({
          workers: state.workers.map(w =>
            w.id === id ? { ...w, ...updated } : w
          ),
        }));
      },
      removeWorker: id => {
        set(state => ({
          workers: state.workers.filter(w => w.id !== id),
        }));
      },
    }),
    {
      name: 'worker-store',
    }
  )
);
