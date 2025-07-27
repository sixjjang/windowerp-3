// Firebase Storage에 기본 알림 소리 파일 업로드 스크립트
const admin = require('firebase-admin');
const fs = require('fs');
const path = require('path');

// Firebase Admin 초기화
const serviceAccount = require('./serviceAccountKey.json');
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  storageBucket: 'windowerp-3.appspot.com'
});

const bucket = admin.storage().bucket();

// 기본 알림 소리 파일 정보
const defaultSounds = [
  {
    name: 'kakao',
    description: '카카오톡 스타일 알림소리',
    localPath: './sounds/kakao-notification.mp3'
  },
  {
    name: 'default',
    description: '기본 알림소리',
    localPath: './sounds/default-notification.mp3'
  },
  {
    name: 'gentle',
    description: '부드러운 알림소리',
    localPath: './sounds/gentle-notification.mp3'
  },
  {
    name: 'warning',
    description: '경고 알림소리',
    localPath: './sounds/warning-notification.mp3'
  },
  {
    name: 'chat',
    description: '채팅 전용 알림소리',
    localPath: './sounds/chat-notification.mp3'
  },
  {
    name: 'schedule',
    description: '일정 등록/수정 알림소리',
    localPath: './sounds/schedule-notification.mp3'
  }
];

async function uploadSoundFile(soundInfo) {
  try {
    const fileName = `notification-sounds/${soundInfo.name}.mp3`;
    const filePath = path.resolve(soundInfo.localPath);
    
    // 파일 존재 확인
    if (!fs.existsSync(filePath)) {
      console.log(`⚠️  파일이 없습니다: ${filePath}`);
      return false;
    }

    // 파일 업로드
    await bucket.upload(filePath, {
      destination: fileName,
      metadata: {
        contentType: 'audio/mpeg',
        customMetadata: {
          soundName: soundInfo.name,
          description: soundInfo.description,
          uploadedBy: 'system',
          uploadDate: new Date().toISOString()
        }
      }
    });

    // 공개 URL 생성
    await bucket.file(fileName).makePublic();
    
    console.log(`✅ 업로드 성공: ${soundInfo.name}`);
    return true;
  } catch (error) {
    console.error(`❌ 업로드 실패: ${soundInfo.name}`, error.message);
    return false;
  }
}

async function uploadAllSounds() {
  console.log('🚀 알림 소리 파일 업로드를 시작합니다...\n');
  
  let successCount = 0;
  let totalCount = defaultSounds.length;
  
  for (const soundInfo of defaultSounds) {
    const success = await uploadSoundFile(soundInfo);
    if (success) successCount++;
  }
  
  console.log(`\n📊 업로드 완료: ${successCount}/${totalCount}개 성공`);
  
  if (successCount > 0) {
    console.log('\n🔗 업로드된 파일들:');
    for (const soundInfo of defaultSounds) {
      const publicUrl = `https://storage.googleapis.com/${bucket.name}/notification-sounds/${soundInfo.name}.mp3`;
      console.log(`  ${soundInfo.name}: ${publicUrl}`);
    }
  }
  
  process.exit(0);
}

// 스크립트 실행
uploadAllSounds().catch(error => {
  console.error('❌ 스크립트 실행 실패:', error);
  process.exit(1);
}); 