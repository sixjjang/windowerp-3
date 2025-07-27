// 실제 재생 가능한 WAV 알림음 파일들을 생성하는 스크립트
const fs = require('fs');
const path = require('path');

// sounds 디렉토리 생성
const soundsDir = path.join(__dirname, 'sounds');
if (!fs.existsSync(soundsDir)) {
  fs.mkdirSync(soundsDir, { recursive: true });
  console.log('✅ sounds 디렉토리 생성됨');
}

// WAV 파일 헤더 생성 함수
function createWavHeader(sampleRate = 44100, channels = 1, bitsPerSample = 16, duration = 1) {
  const byteRate = sampleRate * channels * bitsPerSample / 8;
  const blockAlign = channels * bitsPerSample / 8;
  const dataSize = sampleRate * channels * bitsPerSample / 8 * duration;
  const fileSize = 36 + dataSize;
  
  const header = Buffer.alloc(44);
  
  // RIFF 헤더
  header.write('RIFF', 0);
  header.writeUInt32LE(fileSize, 4);
  header.write('WAVE', 8);
  
  // fmt 청크
  header.write('fmt ', 12);
  header.writeUInt32LE(16, 16); // fmt 청크 크기
  header.writeUInt16LE(1, 20); // PCM 포맷
  header.writeUInt16LE(channels, 22); // 채널 수
  header.writeUInt32LE(sampleRate, 24); // 샘플레이트
  header.writeUInt32LE(byteRate, 28); // 바이트레이트
  header.writeUInt16LE(blockAlign, 32); // 블록 얼라인
  header.writeUInt16LE(bitsPerSample, 34); // 비트퍼샘플
  
  // data 청크
  header.write('data', 36);
  header.writeUInt32LE(dataSize, 40);
  
  return header;
}

// 사인파 오디오 데이터 생성
function createSineWaveData(frequency, sampleRate, duration, amplitude = 0.3) {
  const samples = Math.floor(sampleRate * duration);
  const data = Buffer.alloc(samples * 2); // 16비트 = 2바이트
  
  for (let i = 0; i < samples; i++) {
    const sample = Math.sin(2 * Math.PI * frequency * i / sampleRate);
    const value = Math.floor(sample * amplitude * 32767);
    data.writeInt16LE(value, i * 2);
  }
  
  return data;
}

// 카카오톡 스타일 알림음 (2번 비프음)
function createKakaoStyleSound() {
  const sampleRate = 44100;
  const duration = 0.3;
  const header = createWavHeader(sampleRate, 1, 16, duration * 2 + 0.1);
  
  // 첫 번째 비프음 (800Hz)
  const data1 = createSineWaveData(800, sampleRate, duration, 0.3);
  
  // 두 번째 비프음 (600Hz) - 0.1초 간격 후
  const data2 = createSineWaveData(600, sampleRate, duration, 0.3);
  
  // 조용한 간격 (0.1초)
  const silence = Buffer.alloc(sampleRate * 0.1 * 2);
  
  const audioData = Buffer.concat([data1, silence, data2]);
  const wavFile = Buffer.concat([header, audioData]);
  
  return wavFile;
}

// 기본 알림음
function createDefaultSound() {
  const sampleRate = 44100;
  const duration = 0.5;
  const header = createWavHeader(sampleRate, 1, 16, duration);
  const data = createSineWaveData(600, sampleRate, duration, 0.4);
  const wavFile = Buffer.concat([header, data]);
  
  return wavFile;
}

// 부드러운 알림음
function createGentleSound() {
  const sampleRate = 44100;
  const duration = 0.8;
  const header = createWavHeader(sampleRate, 1, 16, duration);
  const data = createSineWaveData(400, sampleRate, duration, 0.2);
  const wavFile = Buffer.concat([header, data]);
  
  return wavFile;
}

// 경고 알림음 (3번 반복)
function createWarningSound() {
  const sampleRate = 44100;
  const duration = 0.2;
  const header = createWavHeader(sampleRate, 1, 16, duration * 3 + 0.2);
  
  const data1 = createSineWaveData(1000, sampleRate, duration, 0.5);
  const data2 = createSineWaveData(1000, sampleRate, duration, 0.5);
  const data3 = createSineWaveData(1000, sampleRate, duration, 0.5);
  
  const silence1 = Buffer.alloc(sampleRate * 0.1 * 2);
  const silence2 = Buffer.alloc(sampleRate * 0.1 * 2);
  
  const audioData = Buffer.concat([data1, silence1, data2, silence2, data3]);
  const wavFile = Buffer.concat([header, audioData]);
  
  return wavFile;
}

// 채팅 알림음
function createChatSound() {
  const sampleRate = 44100;
  const duration = 0.4;
  const header = createWavHeader(sampleRate, 1, 16, duration);
  const data = createSineWaveData(700, sampleRate, duration, 0.35);
  const wavFile = Buffer.concat([header, data]);
  
  return wavFile;
}

// 일정 알림음
function createScheduleSound() {
  const sampleRate = 44100;
  const duration = 0.6;
  const header = createWavHeader(sampleRate, 1, 16, duration);
  const data = createSineWaveData(500, sampleRate, duration, 0.4);
  const wavFile = Buffer.concat([header, data]);
  
  return wavFile;
}

// 알림음 파일들 생성
const soundFiles = [
  {
    name: 'kakao-notification.wav',
    generator: createKakaoStyleSound,
    description: '카카오톡 스타일 알림음 (2번 비프음)'
  },
  {
    name: 'default-notification.wav',
    generator: createDefaultSound,
    description: '기본 알림음 (600Hz)'
  },
  {
    name: 'gentle-notification.wav',
    generator: createGentleSound,
    description: '부드러운 알림음 (400Hz)'
  },
  {
    name: 'warning-notification.wav',
    generator: createWarningSound,
    description: '경고 알림음 (3번 반복)'
  },
  {
    name: 'chat-notification.wav',
    generator: createChatSound,
    description: '채팅 전용 알림음 (700Hz)'
  },
  {
    name: 'schedule-notification.wav',
    generator: createScheduleSound,
    description: '일정 등록/수정 알림음 (500Hz)'
  }
];

console.log('🎵 실제 재생 가능한 WAV 알림음 파일들을 생성합니다...\n');

soundFiles.forEach(sound => {
  const filePath = path.join(soundsDir, sound.name);
  
  try {
    const wavData = sound.generator();
    fs.writeFileSync(filePath, wavData);
    
    const stats = fs.statSync(filePath);
    console.log(`✅ ${sound.name} 생성됨 (${(stats.size / 1024).toFixed(2)}KB) - ${sound.description}`);
  } catch (error) {
    console.error(`❌ ${sound.name} 생성 실패:`, error.message);
  }
});

console.log('\n📋 생성된 WAV 파일들:');
console.log('- 모든 파일이 실제 재생 가능한 WAV 형식입니다');
console.log('- 파일 크기: 약 20-50KB');
console.log('- 재생 시간: 0.3-1.0초');

console.log('\n🚀 Firebase Console에서 업로드하는 방법:');
console.log('1. https://console.firebase.google.com/project/windowerp-3/storage 접속');
console.log('2. "notification-sounds" 폴더 생성');
console.log('3. 생성된 WAV 파일들을 업로드');
console.log('4. 각 파일을 "공개"로 설정');

console.log('\n✅ 업로드 완료 후:');
console.log('- 브라우저에서 알림 소리 설정 모달을 새로고침');
console.log('- "새로고침" 버튼 클릭');
console.log('- 사용 가능한 알림 소리 목록이 표시됨');

console.log('\n🎵 이제 실제 재생 가능한 알림음이 작동합니다!'); 