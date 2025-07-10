const functions = require('firebase-functions');
const admin = require('firebase-admin');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const cors = require('cors')({ origin: true });
const express = require('express');

// Firebase Admin 초기화
admin.initializeApp();

const db = admin.firestore();
const JWT_SECRET = functions.config().jwt?.secret || 'windowerp-2024-secure-jwt-secret-key-for-production';

// Express 앱 생성
const app = express();
app.use(express.json());
app.use(cors);

// CORS 헬퍼 함수 (기존 코드와의 호환성을 위해 유지)
const corsHandler = (req, res, callback) => {
  return cors(req, res, () => {
    callback(req, res);
  });
};

// ===== 테스트 함수 =====
exports.helloWorld = functions.https.onCall((data, context) => {
  return {
    message: 'Firebase Functions가 정상 작동합니다!',
    timestamp: new Date().toISOString(),
    data: data
  };
});

// ===== 초기 관리자 계정 생성 함수 =====
exports.createInitialAdmin = functions.https.onRequest(async (req, res) => {
  return corsHandler(req, res, async () => {
    try {
      const usersRef = db.collection('users');
      
      // admin 계정이 이미 존재하는지 확인
      const snapshot = await usersRef.where('username', '==', 'admin').get();
      
      if (!snapshot.empty) {
        return res.status(409).json({ message: 'admin 계정이 이미 존재합니다.' });
      }
      
      // admin 계정 생성
      const hashedPassword = await bcrypt.hash('admin', 10);
      const adminData = {
        username: 'admin',
        password: hashedPassword,
        name: '관리자',
        role: 'admin',
        isApproved: true,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      };
      
      await usersRef.add(adminData);
      
      res.status(201).json({ 
        message: '초기 관리자 계정이 생성되었습니다.',
        credentials: {
          username: 'admin',
          password: 'admin'
        }
      });
    } catch (error) {
      console.error('관리자 계정 생성 오류:', error);
      res.status(500).json({ error: '관리자 계정 생성 실패: ' + error.message });
    }
  });
});

// ===== 사용자 인증 함수들 =====



// 회원가입 (POST /register)
exports.register = functions.https.onRequest(async (req, res) => {
  return corsHandler(req, res, async () => {
    if (req.method !== 'POST') return res.status(405).send('Method Not Allowed');
    
    const { username, password, name } = req.body;
    if (!username || !password || !name) return res.status(400).send('필수 정보 누락');
    
    try {
      const usersRef = db.collection('users');
      const snapshot = await usersRef.where('username', '==', username).get();
      if (!snapshot.empty) return res.status(409).send('이미 존재하는 아이디');
      
      const hashed = await bcrypt.hash(password, 10);
      const userData = {
        username,
        password: hashed,
        name,
        role: 'user',
        isApproved: false,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      };
      
      await usersRef.add(userData);
      res.status(201).send('가입 신청 완료(관리자 승인 후 이용 가능)');
    } catch (e) {
      console.error('회원가입 오류:', e);
      res.status(500).send('회원가입 오류: ' + e.message);
    }
  });
});

// 로그인 (POST /login)
exports.login = functions.https.onRequest(async (req, res) => {
  return corsHandler(req, res, async () => {
    if (req.method !== 'POST') return res.status(405).send('Method Not Allowed');
    
    const { username, password } = req.body;
    if (!username || !password) return res.status(400).send('필수 정보 누락');
    
    try {
      const usersRef = db.collection('users');
      const snapshot = await usersRef.where('username', '==', username).get();
      if (snapshot.empty) return res.status(404).send('사용자를 찾을 수 없음');
      
      const userDoc = snapshot.docs[0];
      const user = userDoc.data();
      if (!user.isApproved) return res.status(403).send('관리자 승인 대기 중');
      
      const ok = await bcrypt.compare(password, user.password);
      if (!ok) return res.status(401).send('비밀번호 불일치');
      
      const token = jwt.sign({ uid: userDoc.id, username: user.username, role: user.role }, JWT_SECRET, { expiresIn: '24h' });
      res.json({ token, user: { id: userDoc.id, username: user.username, name: user.name, role: user.role } });
    } catch (e) {
      console.error('로그인 오류:', e);
      res.status(500).send('로그인 오류: ' + e.message);
    }
  });
});

// 사용자 정보 조회 (Callable Function)
exports.getUserInfo = functions.https.onCall(async (data, context) => {
  try {
    if (!context.auth) {
      throw new functions.https.HttpsError('unauthenticated', '인증이 필요합니다.');
    }
    
    const userId = context.auth.uid;
    const userDoc = await db.collection('users').doc(userId).get();
    
    if (!userDoc.exists) {
      throw new functions.https.HttpsError('not-found', '사용자를 찾을 수 없습니다.');
    }
    
    const userData = userDoc.data();
    delete userData.password; // 비밀번호 제외
    
    return {
      user: {
        id: userDoc.id,
        ...userData
      }
    };
  } catch (error) {
    console.error('사용자 정보 조회 오류:', error);
    throw new functions.https.HttpsError('internal', error.message);
  }
});

// 내 정보 조회 (HTTP Request - /me 엔드포인트)
exports.me = functions.https.onRequest(async (req, res) => {
  return corsHandler(req, res, async () => {
    try {
      const authHeader = req.headers.authorization;
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ error: '인증 토큰이 필요합니다.' });
      }

      const token = authHeader.split(' ')[1];
      
      // JWT 토큰 검증
      const decoded = jwt.verify(token, JWT_SECRET);
      
      // Firestore에서 사용자 정보 조회
      const usersRef = db.collection('users');
      const snapshot = await usersRef.where('username', '==', decoded.username).get();
      
      if (snapshot.empty) {
        return res.status(404).json({ error: '사용자를 찾을 수 없습니다.' });
      }
      
      const userDoc = snapshot.docs[0];
      const userData = userDoc.data();
      
      // 비밀번호 제외하고 응답
      delete userData.password;
      
      res.json({
        id: userDoc.id,
        username: userData.username,
        name: userData.name,
        role: userData.role,
        isApproved: userData.isApproved,
        email: userData.email,
        phone: userData.phone,
        profileImage: userData.profileImage,
        createdAt: userData.createdAt,
        updatedAt: userData.updatedAt
      });
    } catch (error) {
      console.error('내 정보 조회 오류:', error);
      if (error.name === 'JsonWebTokenError') {
        return res.status(401).json({ error: '유효하지 않은 토큰입니다.' });
      }
      if (error.name === 'TokenExpiredError') {
        return res.status(401).json({ error: '토큰이 만료되었습니다.' });
      }
      res.status(500).json({ error: '서버 오류: ' + error.message });
    }
  });
});

// ===== 일정 관리 함수들 =====

// 일정 목록 조회 (HTTP Request) - /getSchedulesHttp
exports.getSchedulesHttp = functions.https.onRequest(async (req, res) => {
  return corsHandler(req, res, async () => {
    try {
      const { startDate, endDate, type } = req.query;
      let query = db.collection('schedules');
      
      if (startDate && endDate) {
        query = query.where('date', '>=', startDate).where('date', '<=', endDate);
      }
      
      if (type) {
        query = query.where('type', '==', type);
      }
      
      const snapshot = await query.orderBy('date', 'asc').get();
      const schedules = [];
      
      snapshot.forEach(doc => {
        schedules.push({
          id: doc.id,
          ...doc.data()
        });
      });
      
      res.json(schedules);
    } catch (error) {
      console.error('일정 조회 오류:', error);
      res.status(500).json({ error: error.message });
    }
  });
});

// 일정 목록 조회 (HTTP Request) - /schedules (기본 엔드포인트)
exports.schedules = functions.https.onRequest(async (req, res) => {
  return corsHandler(req, res, async () => {
    try {
      const { startDate, endDate, type } = req.query;
      let query = db.collection('schedules');
      
      if (startDate && endDate) {
        query = query.where('date', '>=', startDate).where('date', '<=', endDate);
      }
      
      if (type) {
        query = query.where('type', '==', type);
      }
      
      const snapshot = await query.orderBy('date', 'asc').get();
      const schedules = [];
      
      snapshot.forEach(doc => {
        schedules.push({
          id: doc.id,
          ...doc.data()
        });
      });
      
      res.json(schedules);
    } catch (error) {
      console.error('일정 조회 오류:', error);
      res.status(500).json({ error: error.message });
    }
  });
});

// 일정 생성 (HTTP Request) - /schedules (POST)
exports.schedulesPost = functions.https.onRequest(async (req, res) => {
  return corsHandler(req, res, async () => {
    if (req.method !== 'POST') return res.status(405).send('Method Not Allowed');
    
    try {
      const scheduleData = {
        ...req.body,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      };
      
      const docRef = await db.collection('schedules').add(scheduleData);
      
      res.status(201).json({
        message: '일정이 생성되었습니다.',
        scheduleId: docRef.id
      });
    } catch (error) {
      console.error('일정 생성 오류:', error);
      res.status(500).json({ error: error.message });
    }
  });
});

// 일정 수정 (HTTP Request) - /schedules/:id (PUT)
exports.schedulesPut = functions.https.onRequest(async (req, res) => {
  return corsHandler(req, res, async () => {
    if (req.method !== 'PUT') return res.status(405).send('Method Not Allowed');
    
    try {
      const scheduleId = req.params.id;
      const updateData = {
        ...req.body,
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      };
      
      await db.collection('schedules').doc(scheduleId).update(updateData);
      
      res.json({ message: '일정이 수정되었습니다.' });
    } catch (error) {
      console.error('일정 수정 오류:', error);
      res.status(500).json({ error: error.message });
    }
  });
});

// 일정 삭제 (HTTP Request) - /schedules/:id (DELETE)
exports.schedulesDelete = functions.https.onRequest(async (req, res) => {
  return corsHandler(req, res, async () => {
    if (req.method !== 'DELETE') return res.status(405).send('Method Not Allowed');
    
    try {
      const scheduleId = req.params.id;
      await db.collection('schedules').doc(scheduleId).delete();
      
      res.json({ message: '일정이 삭제되었습니다.' });
    } catch (error) {
      console.error('일정 삭제 오류:', error);
      res.status(500).json({ error: error.message });
    }
  });
});

// 일정 생성 (HTTP Request) - /createScheduleHttp
exports.createScheduleHttp = functions.https.onRequest(async (req, res) => {
  return corsHandler(req, res, async () => {
    if (req.method !== 'POST') return res.status(405).send('Method Not Allowed');
    
    try {
      const scheduleData = {
        ...req.body,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      };
      
      const docRef = await db.collection('schedules').add(scheduleData);
      
      res.status(201).json({
        message: '일정이 생성되었습니다.',
        scheduleId: docRef.id
      });
    } catch (error) {
      console.error('일정 생성 오류:', error);
      res.status(500).json({ error: error.message });
    }
  });
});

// 일정 수정 (HTTP Request)
exports.updateScheduleHttp = functions.https.onRequest(async (req, res) => {
  return corsHandler(req, res, async () => {
    if (req.method !== 'PUT') return res.status(405).send('Method Not Allowed');
    
    try {
      const scheduleId = req.params.id;
      const updateData = {
        ...req.body,
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      };
      
      await db.collection('schedules').doc(scheduleId).update(updateData);
      
      res.json({ message: '일정이 수정되었습니다.' });
    } catch (error) {
      console.error('일정 수정 오류:', error);
      res.status(500).json({ error: error.message });
    }
  });
});

// 일정 삭제 (HTTP Request)
exports.deleteScheduleHttp = functions.https.onRequest(async (req, res) => {
  return corsHandler(req, res, async () => {
    if (req.method !== 'DELETE') return res.status(405).send('Method Not Allowed');
    
    try {
      const scheduleId = req.params.id;
      await db.collection('schedules').doc(scheduleId).delete();
      
      res.json({ message: '일정이 삭제되었습니다.' });
    } catch (error) {
      console.error('일정 삭제 오류:', error);
      res.status(500).json({ error: error.message });
    }
  });
});

// 일정 목록 조회 (Callable Function)
exports.getSchedules = functions.https.onCall(async (data, context) => {
  try {
    if (!context.auth) {
      throw new functions.https.HttpsError('unauthenticated', '인증이 필요합니다.');
    }
    
    const { startDate, endDate, type } = data;
    let query = db.collection('schedules');
    
    if (startDate && endDate) {
      query = query.where('date', '>=', startDate).where('date', '<=', endDate);
    }
    
    if (type) {
      query = query.where('type', '==', type);
    }
    
    const snapshot = await query.orderBy('date', 'asc').get();
    const schedules = [];
    
    snapshot.forEach(doc => {
      schedules.push({
        id: doc.id,
        ...doc.data()
      });
    });
    
    return { schedules };
  } catch (error) {
    console.error('일정 조회 오류:', error);
    throw new functions.https.HttpsError('internal', error.message);
  }
});

// 일정 생성
exports.createSchedule = functions.https.onCall(async (data, context) => {
  try {
    if (!context.auth) {
      throw new functions.https.HttpsError('unauthenticated', '인증이 필요합니다.');
    }
    
    const scheduleData = {
      ...data,
      createdBy: context.auth.uid,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    };
    
    const docRef = await db.collection('schedules').add(scheduleData);
    
    return {
      message: '일정이 생성되었습니다.',
      scheduleId: docRef.id
    };
  } catch (error) {
    console.error('일정 생성 오류:', error);
    throw new functions.https.HttpsError('internal', error.message);
  }
});

// ===== 견적서 관리 함수들 =====

// 견적서 목록 조회
exports.getEstimates = functions.https.onCall(async (data, context) => {
  try {
    if (!context.auth) {
      throw new functions.https.HttpsError('unauthenticated', '인증이 필요합니다.');
    }
    
    const snapshot = await db.collection('estimates')
      .orderBy('createdAt', 'desc')
      .get();
    
    const estimates = [];
    snapshot.forEach(doc => {
      estimates.push({
        id: doc.id,
        ...doc.data()
      });
    });
    
    return { estimates };
  } catch (error) {
    console.error('견적서 조회 오류:', error);
    throw new functions.https.HttpsError('internal', error.message);
  }
});

// 견적서 생성
exports.createEstimate = functions.https.onCall(async (data, context) => {
  try {
    if (!context.auth) {
      throw new functions.https.HttpsError('unauthenticated', '인증이 필요합니다.');
    }
    
    const estimateData = {
      ...data,
      createdBy: context.auth.uid,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    };
    
    const docRef = await db.collection('estimates').add(estimateData);
    
    return {
      message: '견적서가 생성되었습니다.',
      estimateId: docRef.id
    };
  } catch (error) {
    console.error('견적서 생성 오류:', error);
    throw new functions.https.HttpsError('internal', error.message);
  }
});

// ===== WebSocket 연결 =====

// WebSocket 연결 (HTTP Request로 시뮬레이션)
exports.ws = functions.https.onRequest(async (req, res) => {
  return corsHandler(req, res, async () => {
    // WebSocket 업그레이드 요청 처리
    if (req.headers.upgrade && req.headers.upgrade.toLowerCase() === 'websocket') {
      res.writeHead(426, { 'Upgrade': 'WebSocket' });
      res.end('WebSocket upgrade required');
      return;
    }
    
    // 일반 HTTP 요청의 경우 연결 상태 반환
    res.json({
      status: 'connected',
      message: 'WebSocket endpoint is available',
      timestamp: new Date().toISOString()
    });
  });
});

// ===== 실시간 알림 함수 =====

// 알림 전송
exports.sendNotification = functions.https.onCall(async (data, context) => {
  try {
    if (!context.auth) {
      throw new functions.https.HttpsError('unauthenticated', '인증이 필요합니다.');
    }
    
    const { targetUserId, notification } = data;
    
    // Firestore에 알림 저장
    await db.collection('notifications').add({
      ...notification,
      userId: targetUserId,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      isRead: false
    });
    
    // Realtime Database에도 저장 (실시간 업데이트용)
    await admin.database().ref(`notifications/${targetUserId}`).push({
      ...notification,
      timestamp: admin.database.ServerValue.TIMESTAMP
    });
    
    return { message: '알림이 전송되었습니다.' };
  } catch (error) {
    console.error('알림 전송 오류:', error);
    throw new functions.https.HttpsError('internal', error.message);
  }
});

// ===== 파일 업로드 함수 =====

// 파일 업로드 URL 생성
exports.generateUploadUrl = functions.https.onCall(async (data, context) => {
  try {
    if (!context.auth) {
      throw new functions.https.HttpsError('unauthenticated', '인증이 필요합니다.');
    }
    
    const { fileName, contentType, path } = data;
    const bucket = admin.storage().bucket();
    
    const file = bucket.file(`${path}/${fileName}`);
    const [url] = await file.getSignedUrl({
      action: 'write',
      expires: Date.now() + 15 * 60 * 1000, // 15분
      contentType: contentType
    });
    
    return { uploadUrl: url };
  } catch (error) {
    console.error('업로드 URL 생성 오류:', error);
    throw new functions.https.HttpsError('internal', error.message);
  }
});

// ===== 사용자 관리 HTTP 엔드포인트 =====

// 사용자 목록 조회 (HTTP Request) - /users
exports.users = functions.https.onRequest(async (req, res) => {
  return corsHandler(req, res, async () => {
    try {
      const snapshot = await db.collection('users').get();
      const users = [];
      
      snapshot.forEach(doc => {
        const userData = doc.data();
        delete userData.password; // 비밀번호 제외
        users.push({
          id: doc.id,
          ...userData
        });
      });
      
      res.json(users);
    } catch (error) {
      console.error('사용자 목록 조회 오류:', error);
      res.status(500).json({ error: error.message });
    }
  });
});

// 사용자 승인 (HTTP Request) - /users/:id/approve
exports.usersApprove = functions.https.onRequest(async (req, res) => {
  return corsHandler(req, res, async () => {
    if (req.method !== 'POST') return res.status(405).send('Method Not Allowed');
    
    try {
      const userId = req.params.id;
      await db.collection('users').doc(userId).update({
        isApproved: true,
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      });
      
      res.json({ message: '사용자가 승인되었습니다.' });
    } catch (error) {
      console.error('사용자 승인 오류:', error);
      res.status(500).json({ error: error.message });
    }
  });
});

// 사용자 역할 변경 (HTTP Request) - /users/:id/role
exports.usersRole = functions.https.onRequest(async (req, res) => {
  return corsHandler(req, res, async () => {
    if (req.method !== 'POST') return res.status(405).send('Method Not Allowed');
    
    try {
      const userId = req.params.id;
      const { role } = req.body;
      
      await db.collection('users').doc(userId).update({
        role: role,
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      });
      
      res.json({ message: '사용자 역할이 변경되었습니다.' });
    } catch (error) {
      console.error('사용자 역할 변경 오류:', error);
      res.status(500).json({ error: error.message });
    }
  });
});

// 사용자 삭제 (HTTP Request) - /users/:id
exports.usersDelete = functions.https.onRequest(async (req, res) => {
  return corsHandler(req, res, async () => {
    if (req.method !== 'DELETE') return res.status(405).send('Method Not Allowed');
    
    try {
      const userId = req.params.id;
      await db.collection('users').doc(userId).delete();
      
      res.json({ message: '사용자가 삭제되었습니다.' });
    } catch (error) {
      console.error('사용자 삭제 오류:', error);
      res.status(500).json({ error: error.message });
    }
  });
});

// ===== 관리자 함수들 =====

// 사용자 승인 (Callable Function)
exports.approveUser = functions.https.onCall(async (data, context) => {
  try {
    if (!context.auth) {
      throw new functions.https.HttpsError('unauthenticated', '인증이 필요합니다.');
    }
    
    // 관리자 권한 확인
    const adminDoc = await db.collection('users').doc(context.auth.uid).get();
    if (!adminDoc.exists || adminDoc.data().role !== 'admin') {
      throw new functions.https.HttpsError('permission-denied', '관리자 권한이 필요합니다.');
    }
    
    const { userId } = data;
    await db.collection('users').doc(userId).update({
      isApproved: true,
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    });
    
    return { message: '사용자가 승인되었습니다.' };
  } catch (error) {
    console.error('사용자 승인 오류:', error);
    throw new functions.https.HttpsError('internal', error.message);
  }
});

// ===== HTTP 함수들 (CORS 지원) =====

// HTTP 테스트 함수
exports.httpTest = functions.https.onRequest((req, res) => {
  return corsHandler(req, res, (req, res) => {
    res.json({
      message: 'HTTP 함수가 정상 작동합니다!',
      timestamp: new Date().toISOString(),
      method: req.method,
      url: req.url
    });
  });
});

// ===== 트리거 함수들 =====

// 새 사용자 생성 시 알림
exports.onUserCreated = functions.firestore
  .document('users/{userId}')
  .onCreate(async (snap, context) => {
    const userData = snap.data();
    
    // 관리자에게 새 사용자 알림
    const adminsSnapshot = await db.collection('users')
      .where('role', '==', 'admin')
      .get();
    
    const notification = {
      title: '새 사용자 가입',
      message: `${userData.name}님이 가입 신청했습니다.`,
      type: 'user_registration',
      priority: 'medium'
    };
    
    adminsSnapshot.forEach(adminDoc => {
      db.collection('notifications').add({
        ...notification,
        userId: adminDoc.id,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        isRead: false
      });
    });
  });

// 일정 생성 시 알림
exports.onScheduleCreated = functions.firestore
  .document('schedules/{scheduleId}')
  .onCreate(async (snap, context) => {
    const scheduleData = snap.data();
    
    // 직원들에게 일정 알림
    const staffSnapshot = await db.collection('users')
      .where('role', 'in', ['staff', 'admin'])
      .get();
    
    const notification = {
      title: '새 일정 등록',
      message: `${scheduleData.title} - ${scheduleData.date}`,
      type: 'schedule',
      priority: 'high'
    };
    
    staffSnapshot.forEach(staffDoc => {
      if (staffDoc.id !== scheduleData.createdBy) {
        db.collection('notifications').add({
          ...notification,
          userId: staffDoc.id,
          createdAt: admin.firestore.FieldValue.serverTimestamp(),
          isRead: false
        });
      }
    });
  }); 