// Firebase 기반 알림 소리 유틸리티 함수들

import { callFirebaseFunction } from './firebaseDataService';

export interface SoundSettings {
  enabled: boolean;
  volume: number;
  chatSound: string;      // 채팅 알림 소리
  scheduleSound: string;  // 일정 알림 소리
  lastUpdated?: string;
}

export interface FirebaseSoundFile {
  name: string;
  url: string;
  size: number;
  updated: string;
  extension?: string;
  originalName?: string;
  isLocal?: boolean;
}

// Firebase에서 알림 소리 파일 목록 조회
export const getNotificationSoundsFromFirebase = async (): Promise<FirebaseSoundFile[]> => {
  try {
    const result = await callFirebaseFunction('getNotificationSounds', {}, 'GET');
    return result.sounds || [];
  } catch (error) {
    console.error('Firebase에서 알림 소리 목록 조회 실패:', error);
    return [];
  }
};

// Firebase에서 사용자 알림 소리 설정 조회
export const getUserSoundSettingsFromFirebase = async (userId: string): Promise<SoundSettings> => {
  try {
    const result = await callFirebaseFunction('getUserSoundSettings', { userId }, 'GET');
    return result.settings || getDefaultSoundSettings();
  } catch (error) {
    console.error('Firebase에서 알림 소리 설정 조회 실패:', error);
    return getDefaultSoundSettings();
  }
};

// Firebase에 사용자 알림 소리 설정 저장
export const saveUserSoundSettingsToFirebase = async (userId: string, settings: SoundSettings): Promise<boolean> => {
  try {
    await callFirebaseFunction('saveUserSoundSettings', { userId, settings });
    return true;
  } catch (error) {
    console.error('Firebase에 알림 소리 설정 저장 실패:', error);
    return false;
  }
};

// 기본 알림 소리 설정
export const getDefaultSoundSettings = (): SoundSettings => {
  return {
    enabled: true,
    volume: 0.7,
    chatSound: 'kakao',
    scheduleSound: 'default',
    lastUpdated: new Date().toISOString()
  };
};

// Firebase 기반 알림 소리 재생 클래스
class FirebaseNotificationSoundPlayer {
  private audioContext: AudioContext | null = null;
  private audioCache: Map<string, HTMLAudioElement> = new Map();
  private settings: SoundSettings;
  private userId: string;
  private soundFiles: FirebaseSoundFile[] = [];

  constructor(userId: string) {
    this.userId = userId;
    this.settings = getDefaultSoundSettings();
    this.initializeAudioContext();
    // 비동기 초기화는 별도로 처리
    this.initializeAsync();
  }

  private async initializeAsync(): Promise<void> {
    await this.loadSettings();
    await this.loadSoundFiles();
  }

  private initializeAudioContext(): void {
    try {
      if (typeof window !== 'undefined' && 'AudioContext' in window) {
        this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      }
    } catch (error) {
      console.warn('Web Audio API 초기화 실패:', error);
    }
  }

  private async loadSettings(): Promise<void> {
    try {
      this.settings = await getUserSoundSettingsFromFirebase(this.userId);
    } catch (error) {
      console.error('설정 로드 실패:', error);
      this.settings = getDefaultSoundSettings();
    }
  }

  private async loadSoundFiles(): Promise<void> {
    try {
      // 전역 캐시에서 이미 로드된 파일이 있으면 사용
      if (globalSoundFilesLoaded && globalSoundFiles.length > 0) {
        this.soundFiles = globalSoundFiles;
        console.log(`✅ 전역 캐시에서 알림 소리 파일 목록 로드됨 (${this.soundFiles.length}개)`);
        return;
      }

      // Firebase에서 파일 목록 로드
      this.soundFiles = await getNotificationSoundsFromFirebase();
      globalSoundFiles = this.soundFiles;
      globalSoundFilesLoaded = true;
      
      console.log('📁 Firebase에서 알림 소리 파일 목록 로드 완료:', this.soundFiles.length);
      console.log('📁 로드된 파일들:', this.soundFiles.map(f => ({ 
        name: f.name, 
        url: f.url,
        originalName: (f as any).originalName || 'N/A'
      })));
      
      // 자동 다운로드 비활성화 - 사용자가 직접 다운로드하도록 변경
      console.log('📁 알림 소리 파일 목록 로드 완료 (자동 다운로드 비활성화)');
    } catch (error) {
      console.error('❌ Firebase에서 알림 소리 파일 목록 로드 실패:', error);
      this.soundFiles = [];
    }
  }

  // Firebase Functions를 통해 알림 소리 파일 다운로드 (CORS 문제 해결)
  private async downloadSoundFiles(): Promise<void> {
    console.log('📥 Firebase Functions를 통해 알림 소리 파일 다운로드 시작...');
    
    const filesToDownload = this.soundFiles.filter(f => !(f as any).localUrl);
    console.log(`📥 다운로드할 파일 수: ${filesToDownload.length}`);
    
    for (const soundFile of filesToDownload) {
      try {
        // Firebase Functions를 통해 파일 다운로드 (CORS 문제 해결)
        const fileName = (soundFile as any).originalName || `${soundFile.name}.${(soundFile as any).extension || 'mp3'}`;
        const proxyUrl = `https://us-central1-windowerp-3.cloudfunctions.net/getNotificationSoundFile?fileName=${encodeURIComponent(fileName)}`;
        
        console.log(`🔗 프록시 URL로 다운로드 시도: ${fileName}`);
        
        const response = await fetch(proxyUrl, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
          mode: 'cors' // CORS 모드 명시적 설정
        });
        
        if (!response.ok) {
          console.warn(`⚠️ 프록시 다운로드 실패: ${fileName} (${response.status})`);
          // 프록시 실패 시 직접 다운로드 시도
          try {
            console.log(`🔄 직접 다운로드 시도: ${soundFile.url}`);
            const directResponse = await fetch(soundFile.url, {
              method: 'GET',
              mode: 'no-cors' // CORS 우회 시도
            });
            
            if (directResponse.type === 'opaque') {
              // no-cors 모드에서는 blob을 직접 가져올 수 없으므로 다른 방법 시도
              console.log(`⚠️ no-cors 모드로 다운로드됨: ${fileName}`);
              // 임시로 빈 blob 생성 (실제로는 재생되지 않음)
              const emptyBlob = new Blob([''], { type: 'audio/mpeg' });
              const newLocalUrl = URL.createObjectURL(emptyBlob);
              (soundFile as any).localUrl = newLocalUrl;
            }
          } catch (directError) {
            console.error(`❌ 직접 다운로드도 실패: ${soundFile.name}`, directError);
          }
          continue;
        }

        const blob = await response.blob();
        const newLocalUrl = URL.createObjectURL(blob);
        
        // 로컬 URL을 soundFile에 저장
        (soundFile as any).localUrl = newLocalUrl;
        
        console.log(`✅ 프록시 다운로드 완료: ${fileName}`);
      } catch (error) {
        console.error(`❌ 프록시 다운로드 실패: ${soundFile.name}`, error);
      }
    }
    
    console.log(`📥 다운로드 완료: ${filesToDownload.length}개 파일`);
  }



  private async loadAudio(soundKey: string): Promise<HTMLAudioElement> {
    // 캐시된 오디오가 있으면 반환
    if (this.audioCache.has(soundKey)) {
      return this.audioCache.get(soundKey)!;
    }

    // 디버깅: 사용 가능한 파일 목록 출력
    console.log('🔍 사용 가능한 소리 파일들:', this.soundFiles.map(f => ({ 
      name: f.name, 
      originalName: (f as any).originalName || 'N/A',
      extension: (f as any).extension || 'N/A',
      isLocal: (f as any).isLocal || false
    })));
    console.log('🔍 찾으려는 소리 키:', soundKey);

    // Firebase에서 해당 소리 파일 찾기 (다양한 매칭 방식 시도)
    let soundFile = this.soundFiles.find(file => file.name === soundKey);
    
    // 1. 정확한 매칭이 없으면 부분 매칭 시도
    if (!soundFile) {
      soundFile = this.soundFiles.find(file => 
        file.name.toLowerCase().includes(soundKey.toLowerCase()) ||
        soundKey.toLowerCase().includes(file.name.toLowerCase())
      );
    }
    
    // 2. originalName으로도 매칭 시도
    if (!soundFile) {
      soundFile = this.soundFiles.find(file => 
        (file as any).originalName === soundKey ||
        ((file as any).originalName && (file as any).originalName.toLowerCase().includes(soundKey.toLowerCase()))
      );
    }
    
    // 3. 파일명에서 숫자 부분만 추출해서 매칭 시도
    if (!soundFile) {
      const soundKeyNumbers = soundKey.match(/\d+/g)?.join('');
      if (soundKeyNumbers) {
        soundFile = this.soundFiles.find(file => {
          const fileNameNumbers = file.name.match(/\d+/g)?.join('');
          const originalNameNumbers = (file as any).originalName?.match(/\d+/g)?.join('');
          return fileNameNumbers === soundKeyNumbers || originalNameNumbers === soundKeyNumbers;
        });
      }
    }
    
    // 4. 여전히 없으면 첫 번째 파일 사용
    if (!soundFile && this.soundFiles.length > 0) {
      console.warn(`⚠️ 소리 파일 "${soundKey}"을 찾을 수 없어 첫 번째 파일을 사용합니다: ${this.soundFiles[0].name}`);
      soundFile = this.soundFiles[0];
    }
    
    if (!soundFile) {
      throw new Error(`알림 소리 파일을 찾을 수 없습니다: ${soundKey} (사용 가능한 파일: ${this.soundFiles.map(f => f.name).join(', ')})`);
    }

    // HTML5 Audio 요소 생성
    const audio = new Audio();
    audio.preload = 'auto';
    audio.volume = this.settings.volume;
    
    // CORS 설정 추가
    audio.crossOrigin = 'anonymous';
    
    // 로컬 URL 우선 사용, 없으면 Firebase URL 사용
    const audioUrl = (soundFile as any).localUrl || soundFile?.url || '';
    console.log(`🎵 오디오 URL 사용: ${audioUrl.includes('blob:') ? '로컬' : 'Firebase'}`);

    // 오디오 로드 타임아웃 및 재시도 로직 추가
    const loadAudioWithRetry = async (retryCount = 0): Promise<HTMLAudioElement> => {
      return new Promise((resolve, reject) => {
        const timeout = setTimeout(() => {
          reject(new Error(`오디오 로드 타임아웃: ${soundFile?.url || soundKey}`));
        }, 10000); // 10초 타임아웃

        audio.addEventListener('canplaythrough', () => {
          clearTimeout(timeout);
          resolve(audio);
        }, { once: true });

        audio.addEventListener('error', (error) => {
          clearTimeout(timeout);
          console.warn(`오디오 로드 실패 (시도 ${retryCount + 1}): ${soundFile?.url || soundKey}`, error);
          
          if (retryCount < 2) {
            // 재시도
            setTimeout(() => {
              loadAudioWithRetry(retryCount + 1).then(resolve).catch(reject);
            }, 1000);
          } else {
            reject(new Error(`오디오 로드 실패 (최대 재시도): ${soundFile?.url || soundKey}`));
          }
        }, { once: true });

        // 오디오 소스 설정 및 로드 시작
        audio.src = audioUrl;
        audio.load();
      });
    };

    try {
      const loadedAudio = await loadAudioWithRetry();
      
      // 캐시에 저장
      this.audioCache.set(soundKey, loadedAudio);
      return loadedAudio;
    } catch (error) {
      console.error(`알림 소리 파일 로드 실패: ${soundFile?.url || soundKey}`, error);
      throw error;
    }
  }

  // 알림 소리 재생
  async playNotificationSound(soundType: 'chat' | 'schedule' | 'general' = 'general'): Promise<void> {
    if (!this.settings.enabled) {
      console.log('🔇 알림 소리가 비활성화되어 있습니다.');
      return;
    }

    try {
      // 사용 가능한 소리 파일이 있는지 확인
      if (this.soundFiles.length === 0) {
        // 소리 파일이 없으면 폴백 소리 재생
        console.log('📁 사용 가능한 소리 파일이 없어 폴백 소리를 재생합니다.');
        this.playFallbackSound();
        return;
      }

      // 타입별로 다른 소리 사용
      let soundKey: string;
      
      if (soundType === 'chat') {
        soundKey = this.settings.chatSound;
        console.log(`💬 채팅 알림 소리 사용: ${soundKey}`);
      } else if (soundType === 'schedule') {
        soundKey = this.settings.scheduleSound;
        console.log(`📅 일정 알림 소리 사용: ${soundKey}`);
      } else {
        // general 타입은 채팅 소리 사용
        soundKey = this.settings.chatSound;
        console.log(`🔔 일반 알림 소리 사용: ${soundKey}`);
      }

      // 선택된 소리가 사용 가능한지 확인
      const availableSound = this.soundFiles.find(f => f.name === soundKey);
      if (!availableSound) {
        // 선택된 소리가 없으면 첫 번째 사용 가능한 소리 사용
        soundKey = this.soundFiles[0].name;
        console.log(`⚠️ 선택된 소리를 찾을 수 없어 기본 소리 사용: ${soundKey}`);
      }

      const audio = await this.loadAudio(soundKey);
      
      // 볼륨 설정 적용
      audio.volume = this.settings.volume;
      
      // 재생
      await audio.play();
      
      console.log(`✅ Firebase 알림 소리 재생 성공: ${soundKey} (${soundType})`);
    } catch (error) {
      console.error('❌ Firebase 알림 소리 재생 실패:', error);
      
      // 폴백: 기본 브라우저 알림음 사용
      console.log('🔄 폴백 소리 재생 시도...');
      this.playFallbackSound();
    }
  }

  // 폴백 소리 재생 (브라우저 기본 알림음)
  private playFallbackSound(): void {
    try {
      // HTML5 Audio API를 사용한 간단한 폴백
      const audio = new Audio();
      audio.volume = this.settings.volume * 0.3;
      
      // 간단한 비프음 데이터 URL 생성
      const sampleRate = 44100;
      const duration = 0.5;
      const frequency = 800;
      const samples = Math.floor(sampleRate * duration);
      
      // WAV 파일 헤더 생성
      const buffer = new ArrayBuffer(44 + samples * 2);
      const view = new DataView(buffer);
      
      // WAV 헤더 작성
      const writeString = (offset: number, string: string) => {
        for (let i = 0; i < string.length; i++) {
          view.setUint8(offset + i, string.charCodeAt(i));
        }
      };
      
      writeString(0, 'RIFF');
      view.setUint32(4, 36 + samples * 2, true);
      writeString(8, 'WAVE');
      writeString(12, 'fmt ');
      view.setUint32(16, 16, true);
      view.setUint16(20, 1, true);
      view.setUint16(22, 1, true);
      view.setUint32(24, sampleRate, true);
      view.setUint32(28, sampleRate * 2, true);
      view.setUint16(32, 2, true);
      view.setUint16(34, 16, true);
      writeString(36, 'data');
      view.setUint32(40, samples * 2, true);
      
      // 사인파 생성 (2번 비프음)
      let offset = 44;
      for (let i = 0; i < samples; i++) {
        const t = i / sampleRate;
        let sample = 0;
        
        // 첫 번째 비프음 (0-0.2초)
        if (t < 0.2) {
          sample = Math.sin(2 * Math.PI * frequency * t) * Math.exp(-t * 5);
        }
        // 두 번째 비프음 (0.3-0.5초)
        else if (t >= 0.3 && t < 0.5) {
          sample = Math.sin(2 * Math.PI * frequency * (t - 0.3)) * Math.exp(-(t - 0.3) * 5);
        }
        
        view.setInt16(offset, Math.max(-32768, Math.min(32767, sample * 16384)), true);
        offset += 2;
      }
      
      const blob = new Blob([buffer], { type: 'audio/wav' });
      const audioUrl = URL.createObjectURL(blob);
      
      audio.src = audioUrl;
      audio.play().then(() => {
        console.log('🔊 폴백 알림음 재생 (HTML5 Audio)');
        // 사용 후 URL 정리
        setTimeout(() => URL.revokeObjectURL(audioUrl), 1000);
      }).catch(error => {
        console.error('❌ 폴백 알림음 재생 실패:', error);
        URL.revokeObjectURL(audioUrl);
      });
      
    } catch (error) {
      console.error('❌ 폴백 알림음 생성 실패:', error);
    }
  }

  // 설정 업데이트
  async updateSettings(newSettings: SoundSettings): Promise<void> {
    this.settings = newSettings;
    
    // Firebase에 저장
    await saveUserSoundSettingsToFirebase(this.userId, newSettings);
    
    // 캐시된 오디오들의 볼륨 업데이트
    this.audioCache.forEach(audio => {
      audio.volume = newSettings.volume;
    });
  }

  // 오디오 컨텍스트 재시작 (사용자 상호작용 후)
  resumeAudioContext(): void {
    if (this.audioContext && this.audioContext.state === 'suspended') {
      this.audioContext.resume().then(() => {
        console.log('🔊 AudioContext 재개 완료');
      }).catch(error => {
        console.error('❌ AudioContext 재개 실패:', error);
      });
    }
  }

  // 테스트 소리 재생
  async playTestSound(soundKey: string): Promise<void> {
    try {
      console.log('🎵 테스트 소리 재생 시작:', soundKey);
      const audio = await this.loadAudio(soundKey);
      audio.volume = this.settings.volume;
      await audio.play();
      console.log('✅ 테스트 소리 재생 성공:', soundKey);
    } catch (error) {
      console.error('❌ 테스트 소리 재생 실패:', error);
      throw error; // 에러를 다시 던져서 UI에서 처리할 수 있도록
    }
  }

  // 현재 설정 반환
  getSettings(): SoundSettings {
    return { ...this.settings };
  }

  // 사용 가능한 소리 목록 반환
  getAvailableSounds(): FirebaseSoundFile[] {
    return [...this.soundFiles];
  }

  // 설정 새로고침
  async refreshSettings(): Promise<void> {
    await this.loadSettings();
    await this.loadSoundFiles();
  }

  // 메모리 정리 (페이지 언로드 시)
  cleanup(): void {
    // 생성된 blob URL들 정리
    this.soundFiles.forEach(soundFile => {
      const localUrl = (soundFile as any).localUrl;
      if (localUrl && localUrl.startsWith('blob:')) {
        URL.revokeObjectURL(localUrl);
      }
    });
    
    // 오디오 캐시 정리
    this.audioCache.clear();
    
    console.log('🧹 알림 소리 메모리 정리 완료');
  }
}

// 전역 캐시 (모든 인스턴스가 공유)
let globalSoundFiles: FirebaseSoundFile[] = [];
let globalSoundFilesLoaded = false;

// 싱글톤 인스턴스 (사용자별로 관리)
const soundPlayerInstances = new Map<string, FirebaseNotificationSoundPlayer>();

// 사용자별 알림 소리 플레이어 가져오기
export const getNotificationSoundPlayer = (userId: string): FirebaseNotificationSoundPlayer => {
  if (!soundPlayerInstances.has(userId)) {
    const player = new FirebaseNotificationSoundPlayer(userId);
    soundPlayerInstances.set(userId, player);
  }
  return soundPlayerInstances.get(userId)!;
};

// 편의 함수들
export const playChatNotification = (userId: string) => 
  getNotificationSoundPlayer(userId).playNotificationSound('chat');

export const playScheduleNotification = (userId: string) => 
  getNotificationSoundPlayer(userId).playNotificationSound('schedule');

export const playGeneralNotification = (userId: string) => 
  getNotificationSoundPlayer(userId).playNotificationSound('general');

// 사용자 상호작용 후 오디오 컨텍스트 재시작
export const initializeAudioOnUserInteraction = (userId?: string) => {
  const resumeAudio = () => {
    console.log('👆 사용자 상호작용 감지 - AudioContext 재개 시도');
    if (userId) {
      getNotificationSoundPlayer(userId).resumeAudioContext();
    }
    // 모든 플레이어 인스턴스에 대해 AudioContext 재개
    soundPlayerInstances.forEach(player => {
      player.resumeAudioContext();
    });
  };

  document.addEventListener('click', resumeAudio, { once: true });
  document.addEventListener('keydown', resumeAudio, { once: true });
  document.addEventListener('touchstart', resumeAudio, { once: true });
};

// 개별 알림 소리 파일 다운로드
export const downloadNotificationSound = async (fileName: string): Promise<boolean> => {
  try {
    console.log(`📥 알림 소리 다운로드 시작: ${fileName}`);
    
    // Firebase Functions 프록시를 통해 다운로드
    const proxyUrl = `https://us-central1-windowerp-3.cloudfunctions.net/getNotificationSoundFile?fileName=${encodeURIComponent(fileName)}`;
    
    const response = await fetch(proxyUrl, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      mode: 'cors'
    });
    
    if (!response.ok) {
      throw new Error(`다운로드 실패: ${response.status}`);
    }

    const blob = await response.blob();
    
    // 브라우저 다운로드 링크 생성
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    console.log(`✅ 알림 소리 다운로드 완료: ${fileName}`);
    return true;
  } catch (error) {
    console.error(`❌ 알림 소리 다운로드 실패: ${fileName}`, error);
    return false;
  }
};

// 모든 알림 소리 파일 다운로드
export const downloadAllNotificationSounds = async (): Promise<{ success: number; failed: number }> => {
  try {
    console.log('📥 모든 알림 소리 다운로드 시작');
    
    const soundFiles = await getNotificationSoundsFromFirebase();
    let successCount = 0;
    let failedCount = 0;
    
    for (const soundFile of soundFiles) {
      const fileName = (soundFile as any).originalName || `${soundFile.name}.${(soundFile as any).extension || 'mp3'}`;
      const success = await downloadNotificationSound(fileName);
      
      if (success) {
        successCount++;
      } else {
        failedCount++;
      }
      
      // 다운로드 간 간격 (서버 부하 방지)
      await new Promise(resolve => setTimeout(resolve, 500));
    }
    
    console.log(`📥 다운로드 완료: 성공 ${successCount}개, 실패 ${failedCount}개`);
    return { success: successCount, failed: failedCount };
  } catch (error) {
    console.error('❌ 전체 다운로드 실패:', error);
    return { success: 0, failed: 0 };
  }
};

// 로컬 알림 소리 파일 목록 가져오기
export const getLocalNotificationSounds = async (): Promise<FirebaseSoundFile[]> => {
  try {
    // 브라우저에서 로컬 파일 시스템 접근 시도
    if ('showDirectoryPicker' in window) {
      console.log('📁 로컬 파일 시스템 접근 시도');
      
      // 사용자에게 다운로드 폴더 선택 요청
      const dirHandle = await (window as any).showDirectoryPicker({
        mode: 'read'
      });
      
      const localFiles: FirebaseSoundFile[] = [];
      
      // 디렉토리 내 파일들을 재귀적으로 탐색
      const scanDirectory = async (dirHandle: any, path: string = '') => {
        for await (const entry of dirHandle.values()) {
          if (entry.kind === 'file') {
            const fileName = entry.name;
            if (fileName.endsWith('.mp3') || fileName.endsWith('.wav')) {
              const file = await entry.getFile();
              const nameWithoutExt = fileName.replace('.mp3', '').replace('.wav', '');
              
              localFiles.push({
                name: nameWithoutExt,
                url: URL.createObjectURL(file),
                size: file.size,
                updated: new Date(file.lastModified).toISOString(),
                extension: fileName.split('.').pop() || 'mp3',
                originalName: fileName,
                isLocal: true // 로컬 파일임을 표시
              });
            }
          } else if (entry.kind === 'directory') {
            // 하위 디렉토리도 탐색
            await scanDirectory(entry, `${path}/${entry.name}`);
          }
        }
      };
      
      await scanDirectory(dirHandle);
      console.log(`📁 로컬 파일 ${localFiles.length}개 발견`);
      return localFiles;
    } else {
      console.log('📁 File System Access API 지원하지 않음 - 다운로드 폴더에서 수동 확인 필요');
      return [];
    }
  } catch (error) {
    // 사용자가 디렉토리 선택을 취소한 경우
    if (error instanceof Error && error.name === 'AbortError') {
      console.log('📁 사용자가 디렉토리 선택을 취소했습니다.');
      return [];
    }
    
    // 다른 오류의 경우
    console.error('❌ 로컬 파일 시스템 접근 실패:', error);
    return [];
  }
};

// 다운로드된 파일 목록을 localStorage에 저장
export const saveDownloadedFilesList = (files: FirebaseSoundFile[]): void => {
  try {
    const downloadedFiles = files.map(file => ({
      name: file.name,
      originalName: (file as any).originalName,
      extension: (file as any).extension,
      size: file.size,
      updated: file.updated,
      isLocal: true
    }));
    
    localStorage.setItem('downloadedNotificationSounds', JSON.stringify(downloadedFiles));
    console.log('💾 다운로드된 파일 목록 저장 완료');
  } catch (error) {
    console.error('❌ 다운로드된 파일 목록 저장 실패:', error);
  }
};

// localStorage에서 다운로드된 파일 목록 가져오기
export const getDownloadedFilesList = (): FirebaseSoundFile[] => {
  try {
    const saved = localStorage.getItem('downloadedNotificationSounds');
    if (saved) {
      const files = JSON.parse(saved);
      console.log('📁 저장된 다운로드 파일 목록 로드:', files.length);
      return files;
    }
    return [];
  } catch (error) {
    console.error('❌ 다운로드된 파일 목록 로드 실패:', error);
    return [];
  }
}; 