// 간단한 Firebase Storage 업로드 가이드
const fs = require('fs');
const path = require('path');

console.log('🎵 Firebase Storage에 알림 소리 파일 업로드 가이드\n');

// sounds 디렉토리 확인
const soundsDir = path.join(__dirname, 'sounds');
if (!fs.existsSync(soundsDir)) {
  console.log('❌ sounds 디렉토리가 없습니다. 먼저 create-default-sounds.js를 실행하세요.');
  process.exit(1);
}

// 파일 목록 확인
const files = fs.readdirSync(soundsDir).filter(file => file.endsWith('.mp3'));
console.log(`📁 발견된 MP3 파일들 (${files.length}개):`);
files.forEach(file => {
  const stats = fs.statSync(path.join(soundsDir, file));
  console.log(`  - ${file} (${(stats.size / 1024).toFixed(2)}KB)`);
});

console.log('\n🚀 Firebase Console에서 업로드하는 방법:');
console.log('1. https://console.firebase.google.com/project/windowerp-3/storage 접속');
console.log('2. "Storage" 메뉴 클릭');
console.log('3. "시작하기" 버튼 클릭 (처음 사용하는 경우)');
console.log('4. "폴더 만들기" 클릭');
console.log('5. 폴더명: notification-sounds 입력');
console.log('6. 생성된 폴더 클릭');
console.log('7. "파일 업로드" 클릭');
console.log('8. 위의 MP3 파일들을 선택하여 업로드');
console.log('9. 각 파일을 "공개"로 설정');

console.log('\n📋 업로드할 파일 경로:');
files.forEach(file => {
  console.log(`  ${path.join(soundsDir, file)}`);
});

console.log('\n✅ 업로드 완료 후:');
console.log('- 브라우저에서 알림 소리 설정 모달을 새로고침');
console.log('- "새로고침" 버튼 클릭');
console.log('- 사용 가능한 알림 소리 목록이 표시됨');

console.log('\n💡 현재는 폴백 시스템이 작동하므로 알림음이 재생됩니다!'); 