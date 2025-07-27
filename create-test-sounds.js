// 테스트용 알림 소리 파일들을 생성하는 스크립트
const fs = require('fs');
const path = require('path');

// sounds 디렉토리 확인
const soundsDir = path.join(__dirname, 'sounds');
if (!fs.existsSync(soundsDir)) {
  fs.mkdirSync(soundsDir, { recursive: true });
  console.log('✅ sounds 디렉토리 생성됨');
}

// 간단한 테스트용 MP3 파일 생성 (실제 재생 가능한 형태)
function createTestMp3File(filePath, frequency = 440) {
  // 간단한 사인파를 MP3로 인코딩하는 것은 복잡하므로
  // 대신 실제 MP3 파일의 헤더 구조를 모방한 파일 생성
  const sampleRate = 44100;
  const duration = 1; // 1초
  const samples = sampleRate * duration;
  
  // 간단한 사인파 데이터 생성 (16비트)
  const audioData = Buffer.alloc(samples * 2);
  for (let i = 0; i < samples; i++) {
    const sample = Math.sin(2 * Math.PI * frequency * i / sampleRate);
    const value = Math.floor(sample * 32767);
    audioData.writeInt16LE(value, i * 2);
  }
  
  // 간단한 WAV 헤더 (MP3 대신 WAV 사용)
  const wavHeader = Buffer.alloc(44);
  
  // RIFF 헤더
  wavHeader.write('RIFF', 0);
  wavHeader.writeUInt32LE(36 + audioData.length, 4);
  wavHeader.write('WAVE', 8);
  
  // fmt 청크
  wavHeader.write('fmt ', 12);
  wavHeader.writeUInt32LE(16, 16); // fmt 청크 크기
  wavHeader.writeUInt16LE(1, 20); // PCM 포맷
  wavHeader.writeUInt16LE(1, 22); // 모노
  wavHeader.writeUInt32LE(sampleRate, 24); // 샘플레이트
  wavHeader.writeUInt32LE(sampleRate * 2, 28); // 바이트레이트
  wavHeader.writeUInt16LE(2, 32); // 블록 얼라인
  wavHeader.writeUInt16LE(16, 34); // 비트퍼샘플
  
  // data 청크
  wavHeader.write('data', 36);
  wavHeader.writeUInt32LE(audioData.length, 40);
  
  // WAV 파일로 저장 (MP3 대신)
  const wavFile = Buffer.concat([wavHeader, audioData]);
  fs.writeFileSync(filePath.replace('.mp3', '.wav'), wavFile);
  
  // MP3 파일은 더미로 생성
  const mp3Header = Buffer.from([
    0xFF, 0xFB, 0x90, 0x44, 0x00, 0x00, 0x00, 0x00,
    0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00
  ]);
  fs.writeFileSync(filePath, mp3Header);
}

// 테스트용 소리 파일들 생성
const testSounds = [
  { name: 'kakao-notification.mp3', freq: 800, desc: '카카오톡 스타일 알림소리' },
  { name: 'default-notification.mp3', freq: 600, desc: '기본 알림소리' },
  { name: 'gentle-notification.mp3', freq: 400, desc: '부드러운 알림소리' },
  { name: 'warning-notification.mp3', freq: 1000, desc: '경고 알림소리' },
  { name: 'chat-notification.mp3', freq: 700, desc: '채팅 전용 알림소리' },
  { name: 'schedule-notification.mp3', freq: 500, desc: '일정 등록/수정 알림소리' }
];

console.log('🎵 테스트용 알림 소리 파일들을 생성합니다...\n');

testSounds.forEach(sound => {
  const filePath = path.join(soundsDir, sound.name);
  createTestMp3File(filePath, sound.freq);
  console.log(`✅ ${sound.name} 생성됨 - ${sound.desc} (${sound.freq}Hz)`);
});

console.log('\n📋 생성된 파일들:');
console.log('- MP3 파일들: 더미 파일 (실제 재생 불가)');
console.log('- WAV 파일들: 실제 재생 가능한 테스트 소리');

console.log('\n🚀 Firebase Console에서 업로드하는 방법:');
console.log('1. https://console.firebase.google.com/project/windowerp-3/storage 접속');
console.log('2. "notification-sounds" 폴더 생성');
console.log('3. 생성된 MP3 파일들을 업로드');
console.log('4. 각 파일을 "공개"로 설정');

console.log('\n💡 또는 실제 MP3 파일로 교체 후 업로드하세요!'); 