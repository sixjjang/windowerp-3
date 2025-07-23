import { ScheduleEvent, BuildingInfo } from '../types/schedule';

// 대한민국 2024년 주요 공휴일(설날, 추석 포함)
export const KOREAN_HOLIDAYS: { [date: string]: string } = {
  '2024-01-01': '신정',
  '2024-03-01': '삼일절',
  '2024-05-05': '어린이날',
  '2024-06-06': '현충일',
  '2024-08-15': '광복절',
  '2024-10-03': '개천절',
  '2024-10-09': '한글날',
  '2024-12-25': '성탄절',
  // 설날
  '2024-02-09': '설날 연휴',
  '2024-02-10': '설날',
  '2024-02-11': '설날 연휴',
  // 추석
  '2024-09-16': '추석 연휴',
  '2024-09-17': '추석',
  '2024-09-18': '추석 연휴',
};

// 음력을 양력으로 변환하는 함수
export const lunarToSolar = (
  lunarYear: number,
  lunarMonth: number,
  lunarDay: number
): Date => {
  // 간단한 음력-양력 변환 테이블 (2024년 기준)
  // 실제로는 더 정확한 라이브러리 사용 권장
  const lunarOffset = {
    1: 30, // 1월은 약 30일 후
    2: 29, // 2월은 약 29일 후
    3: 30, // 3월은 약 30일 후
    4: 29, // 4월은 약 29일 후
    5: 30, // 5월은 약 30일 후
    6: 29, // 6월은 약 29일 후
    7: 30, // 7월은 약 30일 후
    8: 30, // 8월은 약 30일 후
    9: 29, // 9월은 약 29일 후
    10: 30, // 10월은 약 30일 후
    11: 29, // 11월은 약 29일 후
    12: 30, // 12월은 약 30일 후
  };

  const baseDate = new Date(lunarYear, lunarMonth - 1, lunarDay);
  const offset = lunarOffset[lunarMonth as keyof typeof lunarOffset] || 30;
  baseDate.setDate(baseDate.getDate() + offset);

  return baseDate;
};

// 양력 날짜를 음력으로 변환하는 함수
export const solarToLunar = (
  solarYear: number,
  solarMonth: number,
  solarDay: number
): Date => {
  // 간단한 양력-음력 변환
  const lunarOffset = {
    1: -30, // 1월은 약 30일 전
    2: -29, // 2월은 약 29일 전
    3: -30, // 3월은 약 30일 전
    4: -29, // 4월은 약 29일 전
    5: -30, // 5월은 약 30일 전
    6: -29, // 6월은 약 29일 전
    7: -30, // 7월은 약 30일 전
    8: -30, // 8월은 약 30일 전
    9: -29, // 9월은 약 29일 전
    10: -30, // 10월은 약 30일 전
    11: -29, // 11월은 약 29일 전
    12: -30, // 12월은 약 30일 전
  };

  const baseDate = new Date(solarYear, solarMonth - 1, solarDay);
  const offset = lunarOffset[solarMonth as keyof typeof lunarOffset] || -30;
  baseDate.setDate(baseDate.getDate() + offset);

  return baseDate;
};

// 건물 정보 추출 함수
export const extractBuildingInfo = (address: string): BuildingInfo => {
  if (!address) return { buildingName: '', unitInfo: '' };
  
  // 아파트 패턴: "아파트명 동,호수" 또는 "아파트명동호수"
  const apartmentPattern = /([가-힣a-zA-Z0-9]+아파트|APT|Apartment)\s*(\d+동)?\s*[,]?\s*(\d+호)?/i;
  const apartmentMatch = address.match(apartmentPattern);
  if (apartmentMatch) {
    const buildingName = apartmentMatch[1];
    const unitInfo = `${apartmentMatch[2] || ''}${apartmentMatch[3] || ''}`.replace(/\s+/g, '');
    return { buildingName, unitInfo };
  }
  
  // 빌라/빌딩 패턴: "빌라명호수" 또는 "빌딩명호수"
  const villaPattern = /([가-힣a-zA-Z0-9]+빌라|[가-힣a-zA-Z0-9]+빌딩)\s*(\d+호)?/i;
  const villaMatch = address.match(villaPattern);
  if (villaMatch) {
    const buildingName = villaMatch[1];
    const unitInfo = villaMatch[2] || '';
    return { buildingName, unitInfo };
  }
  
  // 일반 주소 패턴: "동 번지 호수" 또는 "지역명 번지"
  const addressPattern = /([가-힣]+동)\s*(\d+번지)?\s*(\d+호)?/;
  const addressMatch = address.match(addressPattern);
  if (addressMatch) {
    const buildingName = addressMatch[1];
    const unitInfo = `${addressMatch[2] || ''}${addressMatch[3] || ''}`.replace(/\s+/g, '');
    return { buildingName, unitInfo };
  }
  
  // 기본값: 전체 주소를 건물명으로 사용
  return { buildingName: address, unitInfo: '' };
};

// 자동 제목 생성 함수
export const generateAutoTitle = (type: string, address: string, time: string): string => {
  const { buildingName, unitInfo } = extractBuildingInfo(address);
  
  if (!buildingName) {
    // 주소가 없는 경우 기본 형식
    return `${type}-${time}`;
  }
  
  // 아파트인 경우
  if (buildingName.includes('아파트') || buildingName.toUpperCase().includes('APT')) {
    return `${type}-${buildingName} ${unitInfo}-${time}`;
  }
  
  // 빌라/빌딩인 경우
  if (buildingName.includes('빌라') || buildingName.includes('빌딩')) {
    return `${type}-${buildingName}${unitInfo}-${time}`;
  }
  
  // 지역주소인 경우
  if (buildingName.includes('동') && (unitInfo.includes('번지') || unitInfo.includes('호'))) {
    return `${type}-${buildingName}${unitInfo}-${time}`;
  }
  
  // 기타 경우
  return `${type}-${buildingName}${unitInfo ? ` ${unitInfo}` : ''}-${time}`;
};

// 이벤트 타입별 색상 반환 함수
export const getEventColor = (type: string): string => {
  const typeColors: { [key: string]: string } = {
    '매장상담': '#1565c0',
    '실측': '#2e7d32',
    '시공': '#ef6c00',
    'AS': '#c62828',
    '개인': '#6a1b9a',
    '병원': '#0277bd',
    '여행': '#388e3c',
    '기타': '#9e9e9e',
  };
  
  return typeColors[type] || '#9e9e9e';
};

// 타입 색상 반환 함수 (별칭)
export const getTypeColor = (type: string): string => {
  return getEventColor(type);
};

// 활성 타입 목록 반환 함수
export const getActiveTypes = (scheduleTypes: any[]): any[] => {
  return scheduleTypes.filter(type => type.isActive).sort((a, b) => a.order - b.order);
};

// 날짜를 로컬 문자열로 변환
export const toDateStringLocal = (date: Date): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

// 날짜를 로컬 날짜 문자열로 변환
export const toLocalDateString = (date: Date): string => {
  return date.toLocaleDateString('ko-KR', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
};

// 특정 날짜의 이벤트 필터링
export const getEventsForDate = (events: ScheduleEvent[], date: Date): ScheduleEvent[] => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const dateStr = `${year}-${month}-${day}`;
  
  return events.filter(event => {
    if (event.startDate && event.endDate) {
      return event.startDate <= dateStr && dateStr <= event.endDate;
    }
    return event.date === dateStr;
  });
};

// 필터링된 이벤트 반환
export const getFilteredEvents = (
  events: ScheduleEvent[], 
  activeType: string, 
  searchText: string
): ScheduleEvent[] => {
  let filteredEvents = events;

  // 타입별 필터링
  if (activeType !== 'all') {
    filteredEvents = filteredEvents.filter(event => event.type === activeType);
  }

  // 검색어 필터링
  if (searchText.trim()) {
    const searchLower = searchText.toLowerCase();
    filteredEvents = filteredEvents.filter(event =>
      event.title.toLowerCase().includes(searchLower) ||
      event.customerName?.toLowerCase().includes(searchLower) ||
      event.address?.toLowerCase().includes(searchLower) ||
      event.description?.toLowerCase().includes(searchLower)
    );
  }

  return filteredEvents;
};

// 캘린더 제목 생성
export const getCalendarTitle = (event: ScheduleEvent): string => {
  if (event.customerName && event.address) {
    return `${event.title} - ${event.customerName} (${event.address})`;
  }
  return event.title;
};

// 상세 주소 추출
export const extractDetailedAddress = (address: string): string => {
  if (!address) return '';
  
  // 주소에서 건물 정보 제거하고 상세 주소만 반환
  const { buildingName } = extractBuildingInfo(address);
  if (buildingName && buildingName !== address) {
    return address.replace(buildingName, '').trim();
  }
  
  return address;
};

// 네비게이션 주소 추출
export const extractNavigationAddress = (address: string): string => {
  if (!address) return '';
  
  // 주소에서 호수 정보 제거
  return address.replace(/\d+호/g, '').replace(/,\s*$/, '').trim();
};

// 최적 주소 추출
export const extractBestAddress = (address: string): string => {
  if (!address) return '';
  
  // 건물명이 있으면 건물명 반환, 없으면 전체 주소 반환
  const { buildingName } = extractBuildingInfo(address);
  return buildingName || address;
};

// 상세 설명 파싱
export const parseDetailedDescription = (description: string): string => {
  if (!description) return '';
  
  // HTML 태그 제거
  const cleanDescription = description.replace(/<[^>]*>/g, '');
  
  // 줄바꿈 정리
  return cleanDescription.replace(/\n+/g, '\n').trim();
};

// 테이블 내용 파싱
export const parseTableContent = (content: string): string => {
  if (!content) return '';
  
  // 테이블 태그 제거하고 텍스트만 추출
  return content.replace(/<table[^>]*>.*?<\/table>/gs, '').trim();
}; 