// 기본 알림 소리 파일들을 생성하는 스크립트
const fs = require('fs');
const path = require('path');

// sounds 디렉토리 생성
const soundsDir = path.join(__dirname, 'sounds');
if (!fs.existsSync(soundsDir)) {
  fs.mkdirSync(soundsDir, { recursive: true });
  console.log('✅ sounds 디렉토리 생성됨');
}

// 기본 알림 소리 파일 정보
const defaultSounds = [
  {
    name: 'kakao-notification.mp3',
    description: '카카오톡 스타일 알림소리'
  },
  {
    name: 'default-notification.mp3', 
    description: '기본 알림소리'
  },
  {
    name: 'gentle-notification.mp3',
    description: '부드러운 알림소리'
  },
  {
    name: 'warning-notification.mp3',
    description: '경고 알림소리'
  },
  {
    name: 'chat-notification.mp3',
    description: '채팅 전용 알림소리'
  },
  {
    name: 'schedule-notification.mp3',
    description: '일정 등록/수정 알림소리'
  }
];

// 더미 MP3 파일 생성 (실제로는 사용자가 실제 소리 파일로 교체해야 함)
function createDummyMp3File(filePath) {
  // 간단한 MP3 헤더 (실제 재생은 안되지만 파일 구조는 유지)
  const mp3Header = Buffer.from([
    0xFF, 0xFB, 0x90, 0x44, 0x00, 0x00, 0x00, 0x00,
    0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
    0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
    0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00
  ]);
  
  fs.writeFileSync(filePath, mp3Header);
}

// 기본 소리 파일들 생성
console.log('🎵 기본 알림 소리 파일들을 생성합니다...\n');

defaultSounds.forEach(sound => {
  const filePath = path.join(soundsDir, sound.name);
  
  if (!fs.existsSync(filePath)) {
    createDummyMp3File(filePath);
    console.log(`✅ ${sound.name} 생성됨 - ${sound.description}`);
  } else {
    console.log(`⚠️  ${sound.name} 이미 존재함`);
  }
});

console.log('\n📋 다음 단계:');
console.log('1. sounds/ 폴더의 더미 파일들을 실제 MP3 파일로 교체하세요');
console.log('2. node upload-sounds.js 명령어로 Firebase Storage에 업로드하세요');
console.log('3. 또는 Firebase Console에서 직접 파일을 업로드할 수 있습니다');

// README 파일 생성
const readmeContent = `# 알림 소리 파일

이 폴더에는 알림 소리로 사용할 MP3 파일들이 저장됩니다.

## 파일 목록
${defaultSounds.map(sound => `- ${sound.name}: ${sound.description}`).join('\n')}

## 사용법
1. 더미 파일들을 실제 MP3 파일로 교체하세요
2. 파일명은 위의 목록과 동일하게 유지하세요
3. 파일 크기는 1MB 이하로 권장합니다
4. 재생 시간은 3초 이하로 권장합니다

## 업로드
\`\`\`bash
node upload-sounds.js
\`\`\`

또는 Firebase Console에서 직접 업로드할 수 있습니다.
`;

fs.writeFileSync(path.join(soundsDir, 'README.md'), readmeContent);
console.log('\n📖 sounds/README.md 파일이 생성되었습니다.'); 