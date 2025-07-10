const WebSocket = require('ws');
const wss = new WebSocket.Server({ port: 4001 }); // 4000번은 HTTP 서버용, 4001번은 WebSocket용

console.log('=== WebSocket 서버 시작 ===');
console.log('WebSocket 서버가 ws://localhost:4001 에서 실행 중입니다.');

// 연결된 클라이언트들을 관리 (userId: ws)
const clients = {};

wss.on('connection', (ws, req) => {
  console.log('새로운 WebSocket 연결:', req.socket.remoteAddress);

  ws.on('message', (msg) => {
    try {
      const data = JSON.parse(msg);
      console.log('WebSocket 메시지 수신:', data.type);

      // 1. 로그인 후 사용자 등록
      if (data.type === 'register' && data.userId) {
        clients[data.userId] = ws;
        console.log(`사용자 등록: ${data.userId}`);
        
        // 등록 확인 메시지 전송
        ws.send(JSON.stringify({
          type: 'register_success',
          message: 'WebSocket 연결이 등록되었습니다.',
          userId: data.userId
        }));
      }

      // 2. 특정 사용자에게 알림 전송
      if (data.type === 'notify' && data.targetUserId) {
        const target = clients[data.targetUserId];
        if (target && target.readyState === WebSocket.OPEN) {
          target.send(JSON.stringify(data.notification));
          console.log(`알림 전송: ${data.targetUserId} → ${data.notification.title}`);
        } else {
          console.log(`사용자 ${data.targetUserId}가 연결되어 있지 않습니다.`);
        }
      }

      // 3. 모든 사용자에게 브로드캐스트
      if (data.type === 'broadcast') {
        Object.keys(clients).forEach(userId => {
          const client = clients[userId];
          if (client && client.readyState === WebSocket.OPEN) {
            client.send(JSON.stringify(data.notification));
          }
        });
        console.log(`브로드캐스트 알림 전송: ${data.notification.title}`);
      }

      // 4. 관리자/직원에게만 알림 전송
      if (data.type === 'notify_staff') {
        Object.keys(clients).forEach(userId => {
          // userId가 admin으로 시작하거나 staff로 시작하는 경우 (실제로는 권한 정보를 전달받아야 함)
          if (userId.startsWith('admin') || userId.startsWith('staff') || userId === 'admin') {
            const client = clients[userId];
            if (client && client.readyState === WebSocket.OPEN) {
              client.send(JSON.stringify(data.notification));
            }
          }
        });
        console.log(`직원 알림 전송: ${data.notification.title}`);
      }

    } catch (e) {
      console.error('WebSocket 메시지 파싱 오류:', e);
    }
  });

  ws.on('close', () => {
    // 연결 해제 시 clients에서 제거
    Object.keys(clients).forEach(userId => {
      if (clients[userId] === ws) {
        delete clients[userId];
        console.log(`사용자 연결 해제: ${userId}`);
      }
    });
  });

  ws.on('error', (error) => {
    console.error('WebSocket 오류:', error);
  });
});

// 연결된 클라이언트 수 모니터링
setInterval(() => {
  const connectedCount = Object.keys(clients).length;
  console.log(`현재 연결된 클라이언트: ${connectedCount}개`);
}, 30000); // 30초마다 로그

// 서버 종료 시 정리
process.on('SIGINT', () => {
  console.log('WebSocket 서버를 종료합니다...');
  wss.close(() => {
    console.log('WebSocket 서버가 종료되었습니다.');
    process.exit(0);
  });
});

module.exports = { wss, clients }; 