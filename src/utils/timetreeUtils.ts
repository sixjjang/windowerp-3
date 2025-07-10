// 타임트리 API 연동 유틸리티

export interface TimeTreeEvent {
  id: string;
  title: string;
  start_at: string;
  end_at: string;
  description?: string;
  location?: string;
  attendees?: string[];
  color?: string;
  all_day?: boolean;
  timezone?: string;
}

export interface TimeTreeCalendar {
  id: string;
  name: string;
  description?: string;
  color?: string;
  order?: number;
}

export interface TimeTreeAuth {
  access_token: string;
  refresh_token: string;
  expires_at: number;
}

export interface TimeTreeSettings {
  enabled: boolean;
  calendar_id?: string;
  sync_direction: 'both' | 'to_timetree' | 'from_timetree';
  auto_sync: boolean;
  sync_interval: number; // minutes
}

class TimeTreeAPI {
  private baseURL = 'https://timetreeapis.com';
  private accessToken: string | null = null;
  private refreshToken: string | null = null;

  constructor() {
    this.loadTokens();
  }

  private loadTokens() {
    const auth = localStorage.getItem('timetree_auth');
    if (auth) {
      try {
        const authData: TimeTreeAuth = JSON.parse(auth);
        this.accessToken = authData.access_token;
        this.refreshToken = authData.refresh_token;
      } catch (error) {
        console.error('타임트리 인증 정보 로드 실패:', error);
      }
    }
  }

  private saveTokens(auth: TimeTreeAuth) {
    localStorage.setItem('timetree_auth', JSON.stringify(auth));
    this.accessToken = auth.access_token;
    this.refreshToken = auth.refresh_token;
  }

  private async makeRequest(endpoint: string, options: RequestInit = {}) {
    if (!this.accessToken) {
      throw new Error('타임트리 인증이 필요합니다.');
    }

    const url = `${this.baseURL}${endpoint}`;
    const headers = {
      'Authorization': `Bearer ${this.accessToken}`,
      'Content-Type': 'application/json',
      ...options.headers,
    };

    try {
      const response = await fetch(url, {
        ...options,
        headers,
      });

      if (response.status === 401) {
        // 토큰 만료 시 갱신 시도
        await this.refreshAccessToken();
        // 재시도
        const retryResponse = await fetch(url, {
          ...options,
          headers: {
            'Authorization': `Bearer ${this.accessToken}`,
            'Content-Type': 'application/json',
            ...options.headers,
          },
        });
        return retryResponse;
      }

      return response;
    } catch (error) {
      console.error('타임트리 API 요청 실패:', error);
      throw error;
    }
  }

  private async refreshAccessToken() {
    if (!this.refreshToken) {
      throw new Error('리프레시 토큰이 없습니다.');
    }

    try {
      const response = await fetch(`${this.baseURL}/oauth/token`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          grant_type: 'refresh_token',
          refresh_token: this.refreshToken,
          client_id: process.env.REACT_APP_TIMETREE_CLIENT_ID || '',
          client_secret: process.env.REACT_APP_TIMETREE_CLIENT_SECRET || '',
        }),
      });

      if (response.ok) {
        const authData: TimeTreeAuth = await response.json();
        this.saveTokens(authData);
      } else {
        throw new Error('토큰 갱신 실패');
      }
    } catch (error) {
      console.error('토큰 갱신 실패:', error);
      // 인증 정보 초기화
      localStorage.removeItem('timetree_auth');
      this.accessToken = null;
      this.refreshToken = null;
      throw error;
    }
  }

  // 캘린더 목록 조회
  async getCalendars(): Promise<TimeTreeCalendar[]> {
    const response = await this.makeRequest('/calendars');
    if (response.ok) {
      const data = await response.json();
      return data.data || [];
    }
    throw new Error('캘린더 목록 조회 실패');
  }

  // 이벤트 목록 조회
  async getEvents(calendarId: string, startDate?: string, endDate?: string): Promise<TimeTreeEvent[]> {
    let endpoint = `/calendars/${calendarId}/events`;
    const params = new URLSearchParams();
    
    if (startDate) params.append('start_at', startDate);
    if (endDate) params.append('end_at', endDate);
    
    if (params.toString()) {
      endpoint += `?${params.toString()}`;
    }

    const response = await this.makeRequest(endpoint);
    if (response.ok) {
      const data = await response.json();
      return data.data || [];
    }
    throw new Error('이벤트 목록 조회 실패');
  }

  // 이벤트 생성
  async createEvent(calendarId: string, event: Omit<TimeTreeEvent, 'id'>): Promise<TimeTreeEvent> {
    const response = await this.makeRequest(`/calendars/${calendarId}/events`, {
      method: 'POST',
      body: JSON.stringify(event),
    });

    if (response.ok) {
      const data = await response.json();
      return data.data;
    }
    throw new Error('이벤트 생성 실패');
  }

  // 이벤트 수정
  async updateEvent(calendarId: string, eventId: string, event: Partial<TimeTreeEvent>): Promise<TimeTreeEvent> {
    const response = await this.makeRequest(`/calendars/${calendarId}/events/${eventId}`, {
      method: 'PUT',
      body: JSON.stringify(event),
    });

    if (response.ok) {
      const data = await response.json();
      return data.data;
    }
    throw new Error('이벤트 수정 실패');
  }

  // 이벤트 삭제
  async deleteEvent(calendarId: string, eventId: string): Promise<void> {
    const response = await this.makeRequest(`/calendars/${calendarId}/events/${eventId}`, {
      method: 'DELETE',
    });

    if (!response.ok) {
      throw new Error('이벤트 삭제 실패');
    }
  }

  // 인증 상태 확인
  isAuthenticated(): boolean {
    return !!this.accessToken;
  }

  // 인증 정보 초기화
  clearAuth(): void {
    localStorage.removeItem('timetree_auth');
    this.accessToken = null;
    this.refreshToken = null;
  }
}

// 싱글톤 인스턴스
export const timeTreeAPI = new TimeTreeAPI();

// 설정 관리
export const getTimeTreeSettings = (): TimeTreeSettings => {
  const settings = localStorage.getItem('timetree_settings');
  if (settings) {
    try {
      return JSON.parse(settings);
    } catch (error) {
      console.error('타임트리 설정 파싱 실패:', error);
    }
  }
  
  // 기본 설정
  return {
    enabled: false,
    sync_direction: 'both',
    auto_sync: false,
    sync_interval: 30,
  };
};

export const saveTimeTreeSettings = (settings: TimeTreeSettings): void => {
  localStorage.setItem('timetree_settings', JSON.stringify(settings));
};

// 스케줄 이벤트를 타임트리 이벤트로 변환
export const convertToTimeTreeEvent = (scheduleEvent: any): Omit<TimeTreeEvent, 'id'> => {
  const startDate = new Date(`${scheduleEvent.date}T${scheduleEvent.time}`);
  const endDate = scheduleEvent.endTime 
    ? new Date(`${scheduleEvent.date}T${scheduleEvent.endTime}`)
    : new Date(startDate.getTime() + 60 * 60 * 1000); // 기본 1시간

  return {
    title: scheduleEvent.title,
    start_at: startDate.toISOString(),
    end_at: endDate.toISOString(),
    description: scheduleEvent.description || '',
    location: scheduleEvent.address || '',
    all_day: false,
    timezone: 'Asia/Seoul',
  };
};

// 타임트리 이벤트를 스케줄 이벤트로 변환
export const convertFromTimeTreeEvent = (timeTreeEvent: TimeTreeEvent): any => {
  const startDate = new Date(timeTreeEvent.start_at);
  const endDate = new Date(timeTreeEvent.end_at);

  return {
    id: `timetree_${timeTreeEvent.id}`,
    title: timeTreeEvent.title,
    date: startDate.toISOString().split('T')[0],
    time: startDate.toTimeString().slice(0, 5),
    endTime: endDate.toTimeString().slice(0, 5),
    type: '타임트리',
    description: timeTreeEvent.description || '',
    address: timeTreeEvent.location || '',
    priority: '보통',
    status: '예정',
    color: timeTreeEvent.color || '#40c4ff',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    createdBy: 'timetree_sync',
  };
};

// 동기화 함수
export const syncWithTimeTree = async (
  localEvents: any[],
  settings: TimeTreeSettings
): Promise<{ success: boolean; message: string; syncedEvents?: any[] }> => {
  try {
    if (!settings.enabled || !settings.calendar_id) {
      return { success: false, message: '타임트리 연동이 비활성화되어 있습니다.' };
    }

    if (!timeTreeAPI.isAuthenticated()) {
      return { success: false, message: '타임트리 인증이 필요합니다.' };
    }

    const calendarId = settings.calendar_id;
    const now = new Date();
    const startDate = new Date(now.getFullYear(), now.getMonth() - 1, 1).toISOString();
    const endDate = new Date(now.getFullYear(), now.getMonth() + 2, 0).toISOString();

    // 타임트리에서 이벤트 가져오기
    const timeTreeEvents = await timeTreeAPI.getEvents(calendarId, startDate, endDate);
    
    let syncedEvents = [...localEvents];

    if (settings.sync_direction === 'from_timetree' || settings.sync_direction === 'both') {
      // 타임트리 → 로컬 동기화
      timeTreeEvents.forEach(timeTreeEvent => {
        const existingIndex = syncedEvents.findIndex(event => 
          event.id === `timetree_${timeTreeEvent.id}`
        );
        
        const convertedEvent = convertFromTimeTreeEvent(timeTreeEvent);
        
        if (existingIndex >= 0) {
          syncedEvents[existingIndex] = convertedEvent;
        } else {
          syncedEvents.push(convertedEvent);
        }
      });
    }

    if (settings.sync_direction === 'to_timetree' || settings.sync_direction === 'both') {
      // 로컬 → 타임트리 동기화
      for (const localEvent of localEvents) {
        if (localEvent.createdBy === 'timetree_sync') continue; // 타임트리에서 온 이벤트는 제외
        
        const timeTreeEventData = convertToTimeTreeEvent(localEvent);
        
        try {
          await timeTreeAPI.createEvent(calendarId, timeTreeEventData);
        } catch (error) {
          console.error('타임트리 이벤트 생성 실패:', error);
        }
      }
    }

    return { 
      success: true, 
      message: '타임트리 동기화가 완료되었습니다.',
      syncedEvents 
    };

  } catch (error) {
    console.error('타임트리 동기화 실패:', error);
    return { 
      success: false, 
      message: `동기화 실패: ${error instanceof Error ? error.message : '알 수 없는 오류'}` 
    };
  }
}; 