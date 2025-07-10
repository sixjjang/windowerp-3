require('dotenv').config();
const express = require('express');
const cors = require('cors');
const sqlite3 = require('sqlite3').verbose();
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const xlsx = require('xlsx');
const WebSocket = require('ws');

const app = express();
const port = process.env.PORT || 4000;
const saltRounds = 10;
const JWT_SECRET = process.env.JWT_SECRET || 'windowerp-2024-secure-jwt-secret-key-for-production';
const DATABASE_PATH = process.env.DATABASE_PATH || './database.db';

console.log('=== 서버 시작 ===');
console.log('JWT_SECRET:', JWT_SECRET ? '설정됨' : '기본값 사용');
console.log('DATABASE_PATH:', DATABASE_PATH);
console.log('PORT:', port);

// CORS 설정 - 시놀로지 외부 접속을 위해 더 구체적으로 설정
app.use(cors({
  origin: [
    'http://localhost:3000',
    'http://sixjjang.synology.me',
    'https://sixjjang.synology.me',
    'http://sixjjang.synology.me:3000',
    'https://sixjjang.synology.me:3000'
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));
app.use(express.json());

// WebSocket 서버 설정 - 모든 인터페이스에서 접근 가능
const wss = new WebSocket.Server({ 
  port: 4001,
  host: '0.0.0.0'
});
console.log('WebSocket 서버가 ws://0.0.0.0:4001 에서 실행 중입니다.');
console.log(`외부 WebSocket 접속: ws://sixjjang.synology.me:4001`);

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
          // userId가 admin으로 시작하거나 staff로 시작하는 경우
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

// 데이터베이스 초기화
const db = new sqlite3.Database(DATABASE_PATH, (err) => {
  if (err) {
    console.error(err.message);
  }
  console.log('Connected to the SQLite database.');
  // 테이블 생성
  db.serialize(() => {
    db.run(`CREATE TABLE IF NOT EXISTS templates (
      id TEXT PRIMARY KEY,
      data TEXT
    )`);

    db.run(`CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE,
      password TEXT
    )`);

    // users 테이블에 role, department, isApproved 컬럼이 없으면 추가
    db.run(`ALTER TABLE users ADD COLUMN role TEXT DEFAULT 'user'`, (err) => {
      if (err && !err.message.includes('duplicate column name')) {
        console.error('role 컬럼 추가 실패:', err.message);
      }
    });
    db.run(`ALTER TABLE users ADD COLUMN department TEXT`, (err) => {
      if (err && !err.message.includes('duplicate column name')) {
        console.error('department 컬럼 추가 실패:', err.message);
      }
    });
    db.run(`ALTER TABLE users ADD COLUMN isApproved INTEGER DEFAULT 0`, (err) => {
      if (err && !err.message.includes('duplicate column name')) {
        console.error('isApproved 컬럼 추가 실패:', err.message);
      }
    });
    db.run(`ALTER TABLE users ADD COLUMN name TEXT`, (err) => {
      if (err && !err.message.includes('duplicate column name')) {
        console.error('name 컬럼 추가 실패:', err.message);
      }
    });
    db.run(`ALTER TABLE users ADD COLUMN contact TEXT`, (err) => {
      if (err && !err.message.includes('duplicate column name')) {
        console.error('contact 컬럼 추가 실패:', err.message);
      }
    });
    db.run(`ALTER TABLE users ADD COLUMN profileImage TEXT`, (err) => {
      if (err && !err.message.includes('duplicate column name')) {
        console.error('profileImage 컬럼 추가 실패:', err.message);
      }
    });
    db.run(`ALTER TABLE users ADD COLUMN email TEXT`, (err) => {
      if (err && !err.message.includes('duplicate column name')) {
        console.error('email 컬럼 추가 실패:', err.message);
      }
    });
    db.run(`ALTER TABLE users ADD COLUMN phone TEXT`, (err) => {
      if (err && !err.message.includes('duplicate column name')) {
        console.error('phone 컬럼 추가 실패:', err.message);
      }
    });
    db.run(`ALTER TABLE users ADD COLUMN address TEXT`, (err) => {
      if (err && !err.message.includes('duplicate column name')) {
        console.error('address 컬럼 추가 실패:', err.message);
      }
    });
    db.run(`ALTER TABLE users ADD COLUMN accountNumber TEXT`, (err) => {
      if (err && !err.message.includes('duplicate column name')) {
        console.error('accountNumber 컬럼 추가 실패:', err.message);
      }
    });

    db.run(`CREATE TABLE IF NOT EXISTS company_info (
      id INTEGER PRIMARY KEY DEFAULT 1,
      name TEXT,
      address TEXT,
      contact TEXT
    )`);

    // 여러 회사 정보를 저장할 수 있는 새로운 테이블 생성
    db.run(`CREATE TABLE IF NOT EXISTS companies (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      type TEXT NOT NULL,
      businessNumber TEXT,
      name TEXT NOT NULL,
      ceo TEXT,
      businessType TEXT,
      businessItem TEXT,
      address TEXT,
      contact TEXT,
      fax TEXT,
      email TEXT,
      createdAt TEXT DEFAULT CURRENT_TIMESTAMP,
      updatedAt TEXT DEFAULT CURRENT_TIMESTAMP
    )`);

    // 스케줄 테이블 생성
    db.run(`CREATE TABLE IF NOT EXISTS schedules (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      date TEXT NOT NULL,
      time TEXT NOT NULL,
      type TEXT NOT NULL,
      description TEXT,
      customerName TEXT,
      address TEXT,
      contact TEXT,
      deliveryId TEXT,
      asId TEXT,
      color TEXT,
      priority TEXT DEFAULT '보통',
      status TEXT DEFAULT '예정',
      isLunar INTEGER DEFAULT 0,
      isYearly INTEGER DEFAULT 0,
      originalDate TEXT,
      startDate TEXT,
      endDate TEXT,
      measurementData TEXT,
      estimateNo TEXT,
      comments TEXT,
      notifications TEXT,
      shares TEXT,
      repeatPattern TEXT DEFAULT 'none',
      repeatEndDate TEXT,
      tags TEXT,
      attachments TEXT,
      createdAt TEXT,
      updatedAt TEXT,
      createdBy TEXT,
      assignedTo TEXT
    )`);
    
    // estimateNo 컬럼이 없으면 추가 (안전한 마이그레이션)
    db.run(`ALTER TABLE schedules ADD COLUMN estimateNo TEXT`, (err) => {
      if (err && !err.message.includes('duplicate column name')) {
        console.error('estimateNo 컬럼 추가 실패:', err.message);
      }
    });

    // 고정비 관리 테이블
    db.run(`CREATE TABLE IF NOT EXISTS fixed_expenses (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      amount INTEGER NOT NULL,
      month TEXT NOT NULL,
      note TEXT,
      createdAt TEXT DEFAULT CURRENT_TIMESTAMP,
      updatedAt TEXT DEFAULT CURRENT_TIMESTAMP
    )`);

    // 매출/판매 기록 테이블
    db.run(`CREATE TABLE IF NOT EXISTS sales_records (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      productName TEXT NOT NULL,
      productCode TEXT,
      partner TEXT NOT NULL,
      category TEXT NOT NULL,
      quantity INTEGER NOT NULL,
      amount INTEGER NOT NULL,
      date TEXT NOT NULL,
      createdAt TEXT DEFAULT CURRENT_TIMESTAMP,
      updatedAt TEXT DEFAULT CURRENT_TIMESTAMP
    )`);

    // 전자세금계산서/현금영수증 테이블
    db.run(`CREATE TABLE IF NOT EXISTS tax_invoices (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      type TEXT NOT NULL,
      partner TEXT NOT NULL,
      amount INTEGER NOT NULL,
      date TEXT NOT NULL,
      status TEXT DEFAULT '대기',
      createdAt TEXT DEFAULT CURRENT_TIMESTAMP,
      updatedAt TEXT DEFAULT CURRENT_TIMESTAMP
    )`);

    // 과거자료 테이블 생성 (기존 historical_documents 대체)
    db.run(`CREATE TABLE IF NOT EXISTS historical_data (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      type TEXT NOT NULL,
      year INTEGER NOT NULL,
      filename TEXT NOT NULL,
      originalName TEXT NOT NULL,
      filePath TEXT NOT NULL,
      fileSize INTEGER NOT NULL,
      uploadDate TEXT DEFAULT CURRENT_TIMESTAMP,
      processedData TEXT
    )`);

    // year 컬럼이 없으면 추가 (안전한 마이그레이션)
    db.run(`ALTER TABLE historical_data ADD COLUMN year INTEGER`, (err) => {
      if (err && !err.message.includes('duplicate column name')) {
        console.error('year 컬럼 추가 실패:', err.message);
      }
    });

    // === 견적 데이터 테이블 (자동 연동용) ===
    db.run(`CREATE TABLE IF NOT EXISTS estimates (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      estimateNo TEXT UNIQUE NOT NULL,
      customerName TEXT NOT NULL,
      projectName TEXT,
      totalAmount INTEGER NOT NULL,
      discountedAmount INTEGER,
      estimateDate TEXT NOT NULL,
      status TEXT DEFAULT 'draft',
      contact TEXT,
      emergencyContact TEXT,
      type TEXT,
      address TEXT,
      products TEXT,
      createdAt TEXT DEFAULT CURRENT_TIMESTAMP,
      updatedAt TEXT DEFAULT CURRENT_TIMESTAMP
    )`);

    // === 계약 데이터 테이블 (자동 연동용) ===
    db.run(`CREATE TABLE IF NOT EXISTS contracts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      contractNo TEXT UNIQUE NOT NULL,
      estimateNo TEXT NOT NULL,
      customerName TEXT NOT NULL,
      projectName TEXT,
      totalAmount INTEGER NOT NULL,
      depositAmount INTEGER DEFAULT 0,
      balanceAmount INTEGER,
      contractDate TEXT NOT NULL,
      constructionDate TEXT,
      status TEXT DEFAULT 'draft',
      createdAt TEXT DEFAULT CURRENT_TIMESTAMP,
      updatedAt TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (estimateNo) REFERENCES estimates(estimateNo)
    )`);

    // === 배송 데이터 테이블 (자동 연동용) ===
    db.run(`CREATE TABLE IF NOT EXISTS deliveries (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      deliveryNo TEXT UNIQUE NOT NULL,
      contractNo TEXT NOT NULL,
      estimateNo TEXT NOT NULL,
      customerName TEXT NOT NULL,
      projectName TEXT,
      totalAmount INTEGER NOT NULL,
      deliveryDate TEXT NOT NULL,
      status TEXT DEFAULT 'pending',
      paymentStatus TEXT DEFAULT 'pending',
      createdAt TEXT DEFAULT CURRENT_TIMESTAMP,
      updatedAt TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (contractNo) REFERENCES contracts(contractNo),
      FOREIGN KEY (estimateNo) REFERENCES estimates(estimateNo)
    )`);

    // === 예산 관리 테이블 ===
    db.run(`CREATE TABLE IF NOT EXISTS budgets (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      year INTEGER NOT NULL,
      month INTEGER NOT NULL,
      category TEXT NOT NULL,
      amount INTEGER NOT NULL,
      description TEXT,
      createdAt TEXT DEFAULT CURRENT_TIMESTAMP,
      updatedAt TEXT DEFAULT CURRENT_TIMESTAMP
    )`);

    // === 수익성 분석 테이블 ===
    db.run(`CREATE TABLE IF NOT EXISTS profit_analysis (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      estimateNo TEXT NOT NULL,
      contractNo TEXT,
      deliveryNo TEXT,
      customerName TEXT NOT NULL,
      projectName TEXT,
      totalRevenue INTEGER NOT NULL,
      totalCost INTEGER NOT NULL,
      grossProfit INTEGER NOT NULL,
      grossMargin DECIMAL(5,2) NOT NULL,
      netProfit INTEGER,
      netMargin DECIMAL(5,2),
      roi DECIMAL(5,2),
      analysisDate TEXT NOT NULL,
      createdAt TEXT DEFAULT CURRENT_TIMESTAMP,
      updatedAt TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (estimateNo) REFERENCES estimates(estimateNo),
      FOREIGN KEY (contractNo) REFERENCES contracts(contractNo),
      FOREIGN KEY (deliveryNo) REFERENCES deliveries(deliveryNo)
    )`);

    // === 세금계산서 연동 테이블 ===
    db.run(`CREATE TABLE IF NOT EXISTS tax_invoice_api (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      invoiceNo TEXT UNIQUE,
      estimateNo TEXT,
      contractNo TEXT,
      customerName TEXT NOT NULL,
      amount INTEGER NOT NULL,
      taxAmount INTEGER NOT NULL,
      totalAmount INTEGER NOT NULL,
      issueDate TEXT NOT NULL,
      status TEXT DEFAULT 'pending',
      apiResponse TEXT,
      createdAt TEXT DEFAULT CURRENT_TIMESTAMP,
      updatedAt TEXT DEFAULT CURRENT_TIMESTAMP
    )`);

    db.run(`CREATE TABLE IF NOT EXISTS historical_documents (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      filename TEXT NOT NULL,
      originalName TEXT NOT NULL,
      filePath TEXT NOT NULL,
      fileSize INTEGER NOT NULL,
      uploadDate TEXT NOT NULL,
      year INTEGER NOT NULL
    )`, (err) => {
      if (err) {
        console.error('historical_documents 테이블 생성 오류:', err);
      }
    });

    db.run(`CREATE TABLE IF NOT EXISTS chat_permissions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      userId INTEGER NOT NULL,
      page TEXT NOT NULL,
      hasPermission INTEGER DEFAULT 0,
      createdAt TEXT DEFAULT CURRENT_TIMESTAMP,
      updatedAt TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (userId) REFERENCES users (id) ON DELETE CASCADE
    )`, (err) => {
      if (err) {
        console.error('chat_permissions 테이블 생성 오류:', err);
      }
    });
  });

  // === 최초 관리자 계정 자동 생성 (id: admin, pw: admin) ===
  db.get("SELECT * FROM users WHERE username = 'admin'", (err, user) => {
    if (!user) {
      bcrypt.hash('admin', saltRounds, (err, hash) => {
        db.run(
          `INSERT INTO users (username, password, role, isApproved) VALUES (?, ?, 'admin', 1)`,
          ['admin', hash],
          (err) => {
            if (err) {
              console.error('관리자 계정 생성 실패:', err);
            } else {
              console.log('최초 관리자 계정(admin/admin) 자동 생성됨');
            }
          }
        );
      });
    }
  });
});

// JWT 토큰 검증 미들웨어
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

  if (token == null) return res.sendStatus(401); // 토큰이 없음

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) return res.sendStatus(403); // 토큰이 유효하지 않음
    req.user = user;
    next();
  });
};

// 관리자 권한 체크 미들웨어
const requireAdmin = (req, res, next) => {
  const userId = req.user && req.user.id;
  if (!userId) return res.status(401).send('Unauthorized');
  db.get('SELECT * FROM users WHERE id = ?', [userId], (err, user) => {
    if (err || !user) return res.status(401).send('Unauthorized');
    if (user.role !== 'admin') return res.status(403).send('관리자만 접근 가능합니다.');
    next();
  });
};

// GET: 모든 템플릿 조회 (보호됨)
app.get('/templates', (req, res) => {
  db.all('SELECT data FROM templates', [], (err, rows) => {
    if (err) {
      res.status(500).send(err.message);
      return;
    }
    const templates = rows.map(row => JSON.parse(row.data));
    res.json(templates);
  });
});

// POST: 모든 템플릿 덮어쓰기 (보호됨)
app.post('/templates', (req, res) => {
  const templates = req.body;
  if (!Array.isArray(templates)) {
    return res.status(400).send('Request body must be an array of templates.');
  }

  db.serialize(() => {
    db.run('DELETE FROM templates', (err) => {
      if (err) {
        return res.status(500).send(err.message);
      }
    });

    const stmt = db.prepare('INSERT INTO templates (id, data) VALUES (?, ?)');
    templates.forEach(template => {
      stmt.run(template.id, JSON.stringify(template));
    });
    stmt.finalize((err) => {
      if (err) {
        return res.status(500).send(err.message);
      }
      res.status(200).send('Templates saved successfully.');
    });
  });
});

// GET: 회사 정보 조회
app.get('/company-info', (req, res) => {
  console.log('회사 정보 조회 요청');
  // 새로운 companies 테이블에서 모든 회사 정보 조회
  db.all('SELECT * FROM companies ORDER BY type, name', [], (err, rows) => {
    if (err) {
      console.error('companies 테이블 조회 오류:', err);
      return res.status(500).json({ error: err.message });
    }
    
    console.log('companies 테이블 조회 결과:', rows);
    
    // 기존 단일 회사 정보도 함께 조회 (하위 호환성)
    db.get('SELECT * FROM company_info WHERE id = 1', [], (err2, oldRow) => {
      if (err2) {
        console.error('기존 회사 정보 조회 오류:', err2);
      }
      
      console.log('기존 company_info 테이블 조회 결과:', oldRow);
      
      // 새로운 회사 정보가 있으면 그것을 반환, 없으면 기존 정보 반환
      if (rows && rows.length > 0) {
        console.log('새로운 회사 정보 반환:', rows);
        res.json(rows);
      } else if (oldRow) {
        console.log('기존 회사 정보 반환:', [oldRow]);
        res.json([oldRow]);
      } else {
        console.log('회사 정보 없음 - 빈 배열 반환');
        res.json([]);
      }
    });
  });
});

// POST: 회사 정보 생성 또는 업데이트 (보호됨)
app.post('/company-info', (req, res) => {
  console.log('회사 정보 저장 요청:', req.body);
  const companies = req.body;
  
  // 배열이 아닌 경우 배열로 변환 (하위 호환성)
  const companiesArray = Array.isArray(companies) ? companies : [companies];
  
  console.log('처리할 회사 정보:', companiesArray);
  
  if (companiesArray.length === 0) {
    console.log('회사 정보가 없음 - 400 에러');
    return res.status(400).json({ error: '회사 정보가 필요합니다.' });
  }

  // 트랜잭션 시작
  db.serialize(() => {
    db.run('BEGIN TRANSACTION');
    console.log('트랜잭션 시작');
    
    try {
      // 기존 데이터 삭제 (전체 교체 방식)
      db.run('DELETE FROM companies', [], (err) => {
        if (err) {
          console.error('기존 데이터 삭제 오류:', err);
          db.run('ROLLBACK');
          return res.status(500).json({ error: err.message });
        }
        
        console.log('기존 데이터 삭제 완료');
        
        // 새로운 데이터 삽입
        const insertPromises = companiesArray.map((company, index) => {
          return new Promise((resolve, reject) => {
            const query = `
              INSERT INTO companies (
                type, businessNumber, name, ceo, businessType, businessItem,
                address, contact, fax, email, createdAt, updatedAt
              ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            `;
            
            const values = [
              company.type || '우리회사',
              company.businessNumber || '',
              company.name || '',
              company.ceo || '',
              company.businessType || '',
              company.businessItem || '',
              company.address || '',
              company.contact || '',
              company.fax || '',
              company.email || '',
              new Date().toISOString(),
              new Date().toISOString()
            ];
            
            console.log(`회사 ${index + 1} 삽입:`, values);
            
            db.run(query, values, function(err) {
              if (err) {
                console.error(`회사 ${index + 1} 삽입 오류:`, err);
                reject(err);
              } else {
                console.log(`회사 ${index + 1} 삽입 성공, ID:`, this.lastID);
                resolve(this.lastID);
              }
            });
          });
        });
        
        Promise.all(insertPromises)
          .then((ids) => {
            console.log('모든 회사 정보 삽입 성공, IDs:', ids);
            db.run('COMMIT');
            console.log('트랜잭션 커밋 완료');
            res.status(200).json({ 
              message: '회사 정보가 성공적으로 저장되었습니다.',
              count: companiesArray.length,
              ids: ids
            });
          })
          .catch((error) => {
            console.error('회사 정보 삽입 실패:', error);
            db.run('ROLLBACK');
            console.log('트랜잭션 롤백');
            res.status(500).json({ error: error.message });
          });
      });
      
    } catch (error) {
      console.error('트랜잭션 처리 중 오류:', error);
      db.run('ROLLBACK');
      console.log('트랜잭션 롤백');
      res.status(500).json({ error: error.message });
    }
  });
});

// 직원 등록 (관리자만)
app.post('/register-staff', authenticateToken, requireAdmin, (req, res) => {
  const { username, password, name, email, phone, address, accountNumber, role } = req.body;
  if (!username || !password || !name || !role) {
    return res.status(400).send('필수 정보가 누락되었습니다.');
  }
  bcrypt.hash(password, saltRounds, (err, hash) => {
    if (err) {
      return res.status(500).send('비밀번호 암호화 오류');
    }
    db.run(
      'INSERT INTO users (username, password, role, isApproved, name, email, phone, address, accountNumber) VALUES (?, ?, ?, 1, ?, ?, ?, ?, ?)',
      [username, hash, role, name, email || '', phone || '', address || '', accountNumber || ''],
      function (err) {
        if (err) {
          if (err.message.includes('UNIQUE constraint failed')) {
            return res.status(409).send('이미 존재하는 아이디입니다.');
          }
          return res.status(500).send('직원 등록 오류');
        }
        res.status(201).send({ message: '직원 등록 성공', userId: this.lastID });
      }
    );
  });
});

// 회원 목록 조회 (관리자만)
app.get('/users', authenticateToken, requireAdmin, (req, res) => {
  db.all('SELECT id, username, role, isApproved, name, email, phone, address, accountNumber FROM users', [], (err, rows) => {
    if (err) return res.status(500).send('DB 오류');
    res.json(rows);
  });
});

// 회원 승인 (관리자만)
app.post('/users/:id/approve', authenticateToken, requireAdmin, (req, res) => {
  const userId = req.params.id;
  db.run('UPDATE users SET isApproved = 1 WHERE id = ?', [userId], function(err) {
    if (err) return res.status(500).send('DB 오류');
    res.json({ message: '승인 완료' });
  });
});

// 회원 거절/삭제 (관리자만)
app.delete('/users/:id', authenticateToken, requireAdmin, (req, res) => {
  const userId = req.params.id;
  db.run('DELETE FROM users WHERE id = ?', [userId], function(err) {
    if (err) return res.status(500).send('DB 오류');
    res.json({ message: '삭제 완료' });
  });
});

// 권한 변경 (관리자만)
app.post('/users/:id/role', authenticateToken, requireAdmin, (req, res) => {
  const userId = req.params.id;
  const { role } = req.body;
  if (!role) return res.status(400).send('role 값이 필요합니다.');
  db.run('UPDATE users SET role = ? WHERE id = ?', [role, userId], function(err) {
    if (err) return res.status(500).send('DB 오류');
    res.json({ message: '권한 변경 완료' });
  });
});

// === 스케줄 관련 API ===

// GET: 모든 스케줄 조회
app.get('/schedules', (req, res) => {
  db.all('SELECT * FROM schedules ORDER BY date, time', [], (err, rows) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    // JSON 문자열로 저장된 필드들을 파싱
    const schedules = rows.map(row => ({
      ...row,
      isLunar: Boolean(row.isLunar),
      isYearly: Boolean(row.isYearly),
      measurementData: row.measurementData ? JSON.parse(row.measurementData) : undefined,
      comments: row.comments ? JSON.parse(row.comments) : [],
      notifications: row.notifications ? JSON.parse(row.notifications) : [],
      shares: row.shares ? JSON.parse(row.shares) : [],
      tags: row.tags ? JSON.parse(row.tags) : [],
      attachments: row.attachments ? JSON.parse(row.attachments) : [],
      assignedTo: row.assignedTo ? JSON.parse(row.assignedTo) : []
    }));
    res.json(schedules);
  });
});

// POST: 새 스케줄 생성
app.post('/schedules', (req, res) => {
  const schedule = req.body;
  
  // 필수 필드 검증
  if (!schedule.title || !schedule.date || !schedule.time || !schedule.type) {
    return res.status(400).json({ error: '필수 필드가 누락되었습니다.' });
  }

  const now = new Date().toISOString();
  const scheduleData = {
    id: schedule.id || `schedule_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    title: schedule.title,
    date: schedule.date,
    time: schedule.time,
    type: schedule.type,
    description: schedule.description || '',
    customerName: schedule.customerName || '',
    address: schedule.address || '',
    contact: schedule.contact || '',
    deliveryId: schedule.deliveryId || '',
    asId: schedule.asId || '',
    color: schedule.color || '',
    priority: schedule.priority || '보통',
    status: schedule.status || '예정',
    isLunar: schedule.isLunar ? 1 : 0,
    isYearly: schedule.isYearly ? 1 : 0,
    originalDate: schedule.originalDate || '',
    startDate: schedule.startDate || '',
    endDate: schedule.endDate || '',
    measurementData: schedule.measurementData ? JSON.stringify(schedule.measurementData) : '',
    estimateNo: schedule.estimateNo || '',
    comments: schedule.comments ? JSON.stringify(schedule.comments) : '[]',
    notifications: schedule.notifications ? JSON.stringify(schedule.notifications) : '[]',
    shares: schedule.shares ? JSON.stringify(schedule.shares) : '[]',
    repeatPattern: schedule.repeatPattern || 'none',
    repeatEndDate: schedule.repeatEndDate || '',
    tags: schedule.tags ? JSON.stringify(schedule.tags) : '[]',
    attachments: schedule.attachments ? JSON.stringify(schedule.attachments) : '[]',
    createdAt: schedule.createdAt || now,
    updatedAt: now,
    createdBy: schedule.createdBy || 'current_user',
    assignedTo: schedule.assignedTo ? JSON.stringify(schedule.assignedTo) : '[]'
  };

  const query = `
    INSERT INTO schedules (
      id, title, date, time, type, description, customerName, address, contact,
      deliveryId, asId, color, priority, status, isLunar, isYearly, originalDate,
      startDate, endDate, measurementData, estimateNo, comments, notifications, shares,
      repeatPattern, repeatEndDate, tags, attachments, createdAt, updatedAt, createdBy, assignedTo
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `;

  const values = [
    scheduleData.id, scheduleData.title, scheduleData.date, scheduleData.time,
    scheduleData.type, scheduleData.description, scheduleData.customerName,
    scheduleData.address, scheduleData.contact, scheduleData.deliveryId,
    scheduleData.asId, scheduleData.color, scheduleData.priority, scheduleData.status,
    scheduleData.isLunar, scheduleData.isYearly, scheduleData.originalDate,
    scheduleData.startDate, scheduleData.endDate, scheduleData.measurementData,
    scheduleData.estimateNo, scheduleData.comments, scheduleData.notifications, scheduleData.shares,
    scheduleData.repeatPattern, scheduleData.repeatEndDate, scheduleData.tags,
    scheduleData.attachments, scheduleData.createdAt, scheduleData.updatedAt,
    scheduleData.createdBy, scheduleData.assignedTo
  ];

  db.run(query, values, function(err) {
    if (err) {
      console.error('스케줄 저장 오류:', err);
      return res.status(500).json({ error: err.message });
    }
    res.status(201).json({ 
      message: '스케줄이 성공적으로 저장되었습니다.',
      id: scheduleData.id 
    });
  });
});

// PUT: 스케줄 업데이트
app.put('/schedules/:id', (req, res) => {
  const scheduleId = decodeURIComponent(req.params.id);
  const schedule = req.body;
  
  if (!schedule.title || !schedule.date || !schedule.time || !schedule.type) {
    return res.status(400).json({ error: '필수 필드가 누락되었습니다.' });
  }

  const now = new Date().toISOString();
  const scheduleData = {
    id: scheduleId,
    title: schedule.title,
    date: schedule.date,
    time: schedule.time,
    type: schedule.type,
    description: schedule.description || '',
    customerName: schedule.customerName || '',
    address: schedule.address || '',
    contact: schedule.contact || '',
    deliveryId: schedule.deliveryId || '',
    asId: schedule.asId || '',
    color: schedule.color || '',
    priority: schedule.priority || '보통',
    status: schedule.status || '예정',
    isLunar: schedule.isLunar ? 1 : 0,
    isYearly: schedule.isYearly ? 1 : 0,
    originalDate: schedule.originalDate || '',
    startDate: schedule.startDate || '',
    endDate: schedule.endDate || '',
    measurementData: schedule.measurementData ? JSON.stringify(schedule.measurementData) : '',
    estimateNo: schedule.estimateNo || '',
    comments: schedule.comments ? JSON.stringify(schedule.comments) : '[]',
    notifications: schedule.notifications ? JSON.stringify(schedule.notifications) : '[]',
    shares: schedule.shares ? JSON.stringify(schedule.shares) : '[]',
    repeatPattern: schedule.repeatPattern || 'none',
    repeatEndDate: schedule.repeatEndDate || '',
    tags: schedule.tags ? JSON.stringify(schedule.tags) : '[]',
    attachments: schedule.attachments ? JSON.stringify(schedule.attachments) : '[]',
    updatedAt: now,
    createdAt: schedule.createdAt || now,
    createdBy: schedule.createdBy || 'current_user',
    assignedTo: schedule.assignedTo ? JSON.stringify(schedule.assignedTo) : '[]'
  };

  const updateQuery = `
    UPDATE schedules SET
      title = ?, date = ?, time = ?, type = ?, description = ?, customerName = ?,
      address = ?, contact = ?, deliveryId = ?, asId = ?, color = ?, priority = ?,
      status = ?, isLunar = ?, isYearly = ?, originalDate = ?, startDate = ?,
      endDate = ?, measurementData = ?, estimateNo = ?, comments = ?, notifications = ?, shares = ?,
      repeatPattern = ?, repeatEndDate = ?, tags = ?, attachments = ?, updatedAt = ?, assignedTo = ?
    WHERE id = ?
  `;

  const updateValues = [
    scheduleData.title, scheduleData.date, scheduleData.time, scheduleData.type,
    scheduleData.description, scheduleData.customerName, scheduleData.address,
    scheduleData.contact, scheduleData.deliveryId, scheduleData.asId,
    scheduleData.color, scheduleData.priority, scheduleData.status,
    scheduleData.isLunar, scheduleData.isYearly, scheduleData.originalDate,
    scheduleData.startDate, scheduleData.endDate, scheduleData.measurementData,
    scheduleData.estimateNo, scheduleData.comments, scheduleData.notifications, scheduleData.shares,
    scheduleData.repeatPattern, scheduleData.repeatEndDate, scheduleData.tags,
    scheduleData.attachments, scheduleData.updatedAt, scheduleData.assignedTo,
    scheduleId
  ];

  db.run(updateQuery, updateValues, function(err) {
    if (err) {
      console.error('스케줄 업데이트 오류:', err);
      return res.status(500).json({ error: err.message });
    }
    if (this.changes === 0) {
      // 없으면 새로 생성 (upsert)
      const insertQuery = `
        INSERT INTO schedules (
          id, title, date, time, type, description, customerName, address, contact,
          deliveryId, asId, color, priority, status, isLunar, isYearly, originalDate,
          startDate, endDate, measurementData, estimateNo, comments, notifications, shares,
          repeatPattern, repeatEndDate, tags, attachments, createdAt, updatedAt, createdBy, assignedTo
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `;
      const insertValues = [
        scheduleData.id, scheduleData.title, scheduleData.date, scheduleData.time,
        scheduleData.type, scheduleData.description, scheduleData.customerName,
        scheduleData.address, scheduleData.contact, scheduleData.deliveryId,
        scheduleData.asId, scheduleData.color, scheduleData.priority, scheduleData.status,
        scheduleData.isLunar, scheduleData.isYearly, scheduleData.originalDate,
        scheduleData.startDate, scheduleData.endDate, scheduleData.measurementData,
        scheduleData.estimateNo, scheduleData.comments, scheduleData.notifications, scheduleData.shares,
        scheduleData.repeatPattern, scheduleData.repeatEndDate, scheduleData.tags,
        scheduleData.attachments, scheduleData.createdAt, scheduleData.updatedAt,
        scheduleData.createdBy, scheduleData.assignedTo
      ];
      db.run(insertQuery, insertValues, function(insertErr) {
        if (insertErr) {
          console.error('스케줄 upsert(생성) 오류:', insertErr);
          return res.status(500).json({ error: insertErr.message });
        }
        return res.status(201).json({ message: '스케줄이 새로 생성(upsert)되었습니다.', id: scheduleData.id });
      });
    } else {
      res.json({ message: '스케줄이 성공적으로 업데이트되었습니다.' });
    }
  });
});

// DELETE: 스케줄 삭제
app.delete('/schedules/:id', (req, res) => {
  const scheduleId = decodeURIComponent(req.params.id);
  
  db.run('DELETE FROM schedules WHERE id = ?', [scheduleId], function(err) {
    if (err) {
      console.error('스케줄 삭제 오류:', err);
      return res.status(500).json({ error: err.message });
    }
    if (this.changes === 0) {
      return res.status(404).json({ error: '스케줄을 찾을 수 없습니다.' });
    }
    res.json({ message: '스케줄이 성공적으로 삭제되었습니다.' });
  });
});

// GET: 특정 스케줄 조회
app.get('/schedules/:id', (req, res) => {
  const scheduleId = decodeURIComponent(req.params.id);
  
  db.get('SELECT * FROM schedules WHERE id = ?', [scheduleId], (err, row) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    if (!row) {
      return res.status(404).json({ error: '스케줄을 찾을 수 없습니다.' });
    }
    
    // JSON 문자열로 저장된 필드들을 파싱
    const schedule = {
      ...row,
      isLunar: Boolean(row.isLunar),
      isYearly: Boolean(row.isYearly),
      measurementData: row.measurementData ? JSON.parse(row.measurementData) : undefined,
      comments: row.comments ? JSON.parse(row.comments) : [],
      notifications: row.notifications ? JSON.parse(row.notifications) : [],
      shares: row.shares ? JSON.parse(row.shares) : [],
      tags: row.tags ? JSON.parse(row.tags) : [],
      attachments: row.attachments ? JSON.parse(row.attachments) : [],
      assignedTo: row.assignedTo ? JSON.parse(row.assignedTo) : []
    };
    
    res.json(schedule);
  });
});

// === 고정비 관리 API ===

// GET: 모든 고정비 조회
app.get('/fixed-expenses', (req, res) => {
  const { month } = req.query;
  let query = 'SELECT * FROM fixed_expenses';
  let params = [];
  
  if (month) {
    query += ' WHERE month = ?';
    params.push(month);
  }
  
  query += ' ORDER BY month DESC, createdAt DESC';
  
  db.all(query, params, (err, rows) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    res.json(rows);
  });
});

// POST: 고정비 등록
app.post('/fixed-expenses', (req, res) => {
  const { name, amount, month, note } = req.body;
  
  if (!name || !amount || !month) {
    return res.status(400).json({ error: '필수 필드가 누락되었습니다.' });
  }
  
  const now = new Date().toISOString();
  db.run(
    'INSERT INTO fixed_expenses (name, amount, month, note, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?, ?)',
    [name, amount, month, note || '', now, now],
    function(err) {
      if (err) {
        return res.status(500).json({ error: err.message });
      }
      res.status(201).json({ 
        message: '고정비가 성공적으로 등록되었습니다.',
        id: this.lastID 
      });
    }
  );
});

// PUT: 고정비 수정
app.put('/fixed-expenses/:id', (req, res) => {
  const { id } = req.params;
  const { name, amount, month, note } = req.body;
  
  if (!name || !amount || !month) {
    return res.status(400).json({ error: '필수 필드가 누락되었습니다.' });
  }
  
  const now = new Date().toISOString();
  db.run(
    'UPDATE fixed_expenses SET name = ?, amount = ?, month = ?, note = ?, updatedAt = ? WHERE id = ?',
    [name, amount, month, note || '', now, id],
    function(err) {
      if (err) {
        return res.status(500).json({ error: err.message });
      }
      if (this.changes === 0) {
        return res.status(404).json({ error: '고정비를 찾을 수 없습니다.' });
      }
      res.json({ message: '고정비가 성공적으로 수정되었습니다.' });
    }
  );
});

// DELETE: 고정비 삭제
app.delete('/fixed-expenses/:id', (req, res) => {
  const { id } = req.params;
  
  db.run('DELETE FROM fixed_expenses WHERE id = ?', [id], function(err) {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    if (this.changes === 0) {
      return res.status(404).json({ error: '고정비를 찾을 수 없습니다.' });
    }
    res.json({ message: '고정비가 성공적으로 삭제되었습니다.' });
  });
});

// === 매출/판매 기록 API ===

// GET: 모든 매출 기록 조회
app.get('/sales-records', (req, res) => {
  const { month, partner, category, product } = req.query;
  let query = 'SELECT * FROM sales_records';
  let params = [];
  let conditions = [];
  
  if (month) {
    conditions.push('date LIKE ?');
    params.push(`${month}%`);
  }
  if (partner) {
    conditions.push('partner = ?');
    params.push(partner);
  }
  if (category) {
    conditions.push('category = ?');
    params.push(category);
  }
  if (product) {
    conditions.push('productName = ?');
    params.push(product);
  }
  
  if (conditions.length > 0) {
    query += ' WHERE ' + conditions.join(' AND ');
  }
  
  query += ' ORDER BY date DESC, createdAt DESC';
  
  db.all(query, params, (err, rows) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    res.json(rows);
  });
});

// POST: 매출 기록 등록
app.post('/sales-records', (req, res) => {
  const { productName, productCode, partner, category, quantity, amount, date } = req.body;
  
  if (!productName || !partner || !category || !quantity || !amount || !date) {
    return res.status(400).json({ error: '필수 필드가 누락되었습니다.' });
  }
  
  const now = new Date().toISOString();
  db.run(
    'INSERT INTO sales_records (productName, productCode, partner, category, quantity, amount, date, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
    [productName, productCode || '', partner, category, quantity, amount, date, now, now],
    function(err) {
      if (err) {
        return res.status(500).json({ error: err.message });
      }
      res.status(201).json({ 
        message: '매출 기록이 성공적으로 등록되었습니다.',
        id: this.lastID 
      });
    }
  );
});

// PUT: 매출 기록 수정
app.put('/sales-records/:id', (req, res) => {
  const { id } = req.params;
  const { productName, productCode, partner, category, quantity, amount, date } = req.body;
  
  if (!productName || !partner || !category || !quantity || !amount || !date) {
    return res.status(400).json({ error: '필수 필드가 누락되었습니다.' });
  }
  
  const now = new Date().toISOString();
  db.run(
    'UPDATE sales_records SET productName = ?, productCode = ?, partner = ?, category = ?, quantity = ?, amount = ?, date = ?, updatedAt = ? WHERE id = ?',
    [productName, productCode || '', partner, category, quantity, amount, date, now, id],
    function(err) {
      if (err) {
        return res.status(500).json({ error: err.message });
      }
      if (this.changes === 0) {
        return res.status(404).json({ error: '매출 기록을 찾을 수 없습니다.' });
      }
      res.json({ message: '매출 기록이 성공적으로 수정되었습니다.' });
    }
  );
});

// DELETE: 매출 기록 삭제
app.delete('/sales-records/:id', (req, res) => {
  const { id } = req.params;
  
  db.run('DELETE FROM sales_records WHERE id = ?', [id], function(err) {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    if (this.changes === 0) {
      return res.status(404).json({ error: '매출 기록을 찾을 수 없습니다.' });
    }
    res.json({ message: '매출 기록이 성공적으로 삭제되었습니다.' });
  });
});

// === 전자세금계산서/현금영수증 API ===

// GET: 모든 세금계산서 조회
app.get('/tax-invoices', (req, res) => {
  db.all('SELECT * FROM tax_invoices ORDER BY date DESC, createdAt DESC', [], (err, rows) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    res.json(rows);
  });
});

// POST: 세금계산서 등록
app.post('/tax-invoices', (req, res) => {
  const { type, partner, amount, date } = req.body;
  
  if (!type || !partner || !amount || !date) {
    return res.status(400).json({ error: '필수 필드가 누락되었습니다.' });
  }
  
  const now = new Date().toISOString();
  db.run(
    'INSERT INTO tax_invoices (type, partner, amount, date, status, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?, ?, ?)',
    [type, partner, amount, date, '대기', now, now],
    function(err) {
      if (err) {
        return res.status(500).json({ error: err.message });
      }
      res.status(201).json({ 
        message: '세금계산서가 성공적으로 등록되었습니다.',
        id: this.lastID 
      });
    }
  );
});

// PUT: 세금계산서 상태 업데이트
app.put('/tax-invoices/:id/status', (req, res) => {
  const { id } = req.params;
  const { status } = req.body;
  
  if (!status) {
    return res.status(400).json({ error: '상태 값이 필요합니다.' });
  }
  
  const now = new Date().toISOString();
  db.run(
    'UPDATE tax_invoices SET status = ?, updatedAt = ? WHERE id = ?',
    [status, now, id],
    function(err) {
      if (err) {
        return res.status(500).json({ error: err.message });
      }
      if (this.changes === 0) {
        return res.status(404).json({ error: '세금계산서를 찾을 수 없습니다.' });
      }
      res.json({ message: '세금계산서 상태가 성공적으로 업데이트되었습니다.' });
    }
  );
});

// DELETE: 세금계산서 삭제
app.delete('/tax-invoices/:id', (req, res) => {
  const { id } = req.params;
  
  db.run('DELETE FROM tax_invoices WHERE id = ?', [id], function(err) {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    if (this.changes === 0) {
      return res.status(404).json({ error: '세금계산서를 찾을 수 없습니다.' });
    }
    res.json({ message: '세금계산서가 성공적으로 삭제되었습니다.' });
  });
});

// === 경량화된 과거자료 관리 API ===

// 1. multer storage (연도별 폴더)
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const year = req.body.year || new Date().getFullYear();
    const dir = path.join(__dirname, 'uploads', 'historical', String(year));
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    cb(null, dir);
  },
  filename: function (req, file, cb) {
    const ext = path.extname(file.originalname);
    const base = path.basename(file.originalname, ext);
    cb(null, base + '-' + Date.now() + ext);
  }
});
const upload = multer({ storage });

// 3. 업로드 API
app.post('/historical-documents/upload', upload.single('file'), (req, res) => {
  try {
    const year = req.body.year || new Date().getFullYear();
    const file = req.file;
    if (!file) return res.status(400).json({ error: '파일이 없습니다.' });
    db.run(
      `INSERT INTO historical_documents (filename, originalName, filePath, fileSize, uploadDate, year) VALUES (?, ?, ?, ?, datetime('now', 'localtime'), ?)`,
      [file.filename, file.originalname, file.path, file.size, year],
      function (err) {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ id: this.lastID, filename: file.filename });
      }
    );
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// 4. 연도별 목록 API
app.get('/historical-documents/list', (req, res) => {
  const year = req.query.year;
  if (!year) return res.status(400).json({ error: 'year 파라미터 필요' });
  db.all('SELECT id, filename, originalName, fileSize, uploadDate FROM historical_documents WHERE year = ? ORDER BY uploadDate DESC', [year], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

// 5. 미리보기 API (2차원 배열+병합정보)
app.get('/historical-documents/:id/preview', (req, res) => {
  db.get('SELECT filePath FROM historical_documents WHERE id = ?', [req.params.id], (err, row) => {
    if (err || !row) return res.status(404).json({ error: '파일 정보 없음' });
    try {
      const workbook = xlsx.readFile(row.filePath);
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      const range = xlsx.utils.decode_range(worksheet['!ref']);
      const data = [];
      for (let R = range.s.r; R <= range.e.r; ++R) {
        const rowArr = [];
        for (let C = range.s.c; C <= range.e.c; ++C) {
          const cell = worksheet[xlsx.utils.encode_cell({ r: R, c: C })];
          rowArr.push(cell ? cell.v : '');
        }
        data.push(rowArr);
      }
      const merges = worksheet['!merges'] || [];
      res.json({ data, merges });
    } catch (e) {
      res.status(500).json({ error: e.message });
    }
  });
});

// 6. 검색 API (모든 셀에서 검색)
app.get('/historical-documents/:id/search', (req, res) => {
  const keyword = req.query.keyword;
  if (!keyword) return res.status(400).json({ error: '검색어 필요' });
  db.get('SELECT filePath FROM historical_documents WHERE id = ?', [req.params.id], (err, row) => {
    if (err || !row) return res.status(404).json({ error: '파일 정보 없음' });
    try {
      const workbook = xlsx.readFile(row.filePath);
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      const range = xlsx.utils.decode_range(worksheet['!ref']);
      const results = [];
      for (let R = range.s.r; R <= range.e.r; ++R) {
        for (let C = range.s.c; C <= range.e.c; ++C) {
          const cell = worksheet[xlsx.utils.encode_cell({ r: R, c: C })];
          if (cell && String(cell.v).includes(keyword)) {
            results.push({ row: R, col: C, value: cell.v });
          }
        }
      }
      res.json({ results });
    } catch (e) {
      res.status(500).json({ error: e.message });
    }
  });
});

// === 새로운 경량화된 과거자료 관리 API ===

// 경량화된 multer storage (타입별, 연도별 폴더)
const historicalStorage = multer.diskStorage({
  destination: function (req, file, cb) {
    const type = req.body.type || 'delivery';
    const year = req.body.year || new Date().getFullYear();
    const dir = path.join(__dirname, 'uploads', 'historical', type, String(year));
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    cb(null, dir);
  },
  filename: function (req, file, cb) {
    const ext = path.extname(file.originalname);
    const base = path.basename(file.originalname, ext);
    cb(null, base + '-' + Date.now() + ext);
  }
});
const historicalUpload = multer({ storage: historicalStorage });

// 1. 업로드 API (납품관리/견적관리 구분)
app.post('/historical-data/upload', historicalUpload.single('file'), (req, res) => {
  try {
    const type = req.body.type || 'delivery';
    const year = req.body.year || new Date().getFullYear();
    const file = req.file;
    
    if (!file) return res.status(400).json({ error: '파일이 없습니다.' });
    
    // 경량화된 데이터 처리 (최소 용량)
    const workbook = xlsx.readFile(file.path);
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    
    // 데이터 범위 제한 (성능 최적화)
    const range = xlsx.utils.decode_range(worksheet['!ref']);
    // 제한 없이 전체 저장
    const maxRows = range.e.r;
    const maxCols = range.e.c;
    
    const data = [];
    for (let R = range.s.r; R <= maxRows; ++R) {
      const rowArr = [];
      for (let C = range.s.c; C <= maxCols; ++C) {
        const cell = worksheet[xlsx.utils.encode_cell({ r: R, c: C })];
        rowArr.push(cell ? (cell.w ?? cell.v ?? '') : '');
      }
      data.push(rowArr);
    }
    console.log('엑셀 업로드:', file.originalname, '행:', data.length, '열:', data[0]?.length || 0);
    const merges = worksheet['!merges'] || [];
    const processedData = { data, merges };
    
    db.run(
      `INSERT INTO historical_data (type, year, filename, originalName, filePath, fileSize, uploadDate, processedData) 
       VALUES (?, ?, ?, ?, ?, ?, datetime('now', 'localtime'), ?)`,
      [type, year, file.filename, file.originalname, file.path, file.size, JSON.stringify(processedData)],
      function (err) {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ id: this.lastID, filename: file.filename });
      }
    );
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// 2. 목록 API (타입별, 년도별)
app.get('/historical-data/list', (req, res) => {
  const type = req.query.type || 'delivery';
  const year = req.query.year || new Date().getFullYear();
  
  db.all(
    'SELECT id, type, year, filename, originalName, fileSize, uploadDate FROM historical_data WHERE type = ? AND year = ? ORDER BY uploadDate DESC',
    [type, year],
    (err, rows) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json(rows);
    }
  );
});

// 3. 경량화된 미리보기 API
app.get('/historical-data/:id/preview', (req, res) => {
  db.get('SELECT processedData FROM historical_data WHERE id = ?', [req.params.id], (err, row) => {
    if (err || !row) return res.status(404).json({ error: '파일 정보 없음' });
    
    try {
      const parsed = JSON.parse(row.processedData || '{}');
      const data = parsed.data || [];
      const merges = parsed.merges || [];
      // 전체 데이터 반환 (성능은 프론트엔드 스크롤로 관리)
      res.json({ data, merges });
    } catch (e) {
      res.status(500).json({ error: e.message });
    }
  });
});

// 4. 년도별 검색 API (빠른 검색)
app.get('/historical-data/search', (req, res) => {
  const type = req.query.type || 'delivery';
  const year = req.query.year;
  const keyword = req.query.keyword;
  
  if (!keyword) return res.status(400).json({ error: '검색어 필요' });
  
  db.all(
    'SELECT id, type, year, filename, originalName, fileSize, uploadDate FROM historical_data WHERE type = ? AND year = ?',
    [type, year],
    (err, rows) => {
      if (err) return res.status(500).json({ error: err.message });
      
      // 메모리 내 검색 (빠른 성능)
      const results = [];
      rows.forEach(row => {
        if (row.originalName.toLowerCase().includes(keyword.toLowerCase())) {
          results.push(row);
        }
      });
      
      res.json({ results });
    }
  );
});

// 5. 전체 검색 API (납품관리 + 견적관리)
app.get('/historical-data/global-search', (req, res) => {
  const keyword = req.query.keyword;
  
  if (!keyword) return res.status(400).json({ error: '검색어 필요' });
  
  db.all(
    'SELECT id, type, year, filename, originalName, fileSize, uploadDate FROM historical_data WHERE originalName LIKE ? ORDER BY uploadDate DESC',
    [`%${keyword}%`],
    (err, rows) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ results: rows });
    }
  );
});

// 6. 파일 정보 수정 API
app.put('/historical-data/:id/update', (req, res) => {
  const { originalName, year } = req.body;
  
  if (!originalName || !year) {
    return res.status(400).json({ error: '파일명과 년도는 필수입니다.' });
  }
  
  db.run(
    'UPDATE historical_data SET originalName = ?, year = ? WHERE id = ?',
    [originalName, year, req.params.id],
    function (err) {
      if (err) return res.status(500).json({ error: err.message });
      if (this.changes === 0) return res.status(404).json({ error: '파일 정보 없음' });
      res.json({ message: '수정 완료' });
    }
  );
});

// 7. 삭제 API
app.delete('/historical-data/:id', (req, res) => {
  db.get('SELECT filePath FROM historical_data WHERE id = ?', [req.params.id], (err, row) => {
    if (err || !row) return res.status(404).json({ error: '파일 정보 없음' });
    
    // 파일 삭제
    try {
      if (fs.existsSync(row.filePath)) {
        fs.unlinkSync(row.filePath);
      }
    } catch (e) {
      console.error('파일 삭제 실패:', e);
    }
    
    // DB에서 삭제
    db.run('DELETE FROM historical_data WHERE id = ?', [req.params.id], (err) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ message: '삭제 완료' });
    });
  });
});

// 프로필 사진 업로드를 위한 multer 설정
const profileStorage = multer.diskStorage({
  destination: function (req, file, cb) {
    const dir = path.join(__dirname, 'uploads', 'profiles');
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    cb(null, dir);
  },
  filename: function (req, file, cb) {
    const ext = path.extname(file.originalname);
    const userId = req.user ? req.user.id : 'unknown';
    cb(null, `profile_${userId}_${Date.now()}${ext}`);
  }
});
const profileUpload = multer({ 
  storage: profileStorage,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB 제한
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('이미지 파일만 업로드 가능합니다.'), false);
    }
  }
});

// 회원가입(직접 신청, 승인 대기)
app.post('/register', profileUpload.single('profileImage'), (req, res) => {
  const { username, password, name } = req.body;
  if (!username || !password || !name) {
    return res.status(400).send('필수 정보가 누락되었습니다.');
  }
  
  db.get('SELECT * FROM users WHERE username = ?', [username], (err, user) => {
    if (user) {
      return res.status(409).send('이미 존재하는 아이디입니다.');
    }
    
    bcrypt.hash(password, saltRounds, (err, hash) => {
      if (err) return res.status(500).send('비밀번호 암호화 오류');
      
      // 프로필 사진 경로 처리
      let profileImagePath = null;
      if (req.file) {
        profileImagePath = path.relative(path.join(__dirname, 'uploads'), req.file.path);
      }
      
      db.run(
        'INSERT INTO users (username, password, role, isApproved, name, profileImage) VALUES (?, ?, ?, ?, ?, ?)',
        [username, hash, 'guest', 0, name, profileImagePath],
        function (err) {
          if (err) return res.status(500).send('회원가입 오류');
          res.status(201).send({ 
            message: '가입 신청 완료(관리자 승인 후 이용 가능)', 
            userId: this.lastID,
            profileImage: profileImagePath
          });
        }
      );
    });
  });
});

// 로그인(JWT, 승인된 회원만)
app.post('/login', (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) return res.status(400).send('아이디/비밀번호를 입력하세요.');
  db.get('SELECT * FROM users WHERE username = ?', [username], (err, user) => {
    if (err || !user) return res.status(401).send('존재하지 않는 계정입니다.');
    if (!user.isApproved) return res.status(403).send('관리자 승인 대기중입니다.');
    bcrypt.compare(password, user.password, (err, result) => {
      if (!result) return res.status(401).send('비밀번호가 일치하지 않습니다.');
      const token = jwt.sign({ id: user.id, username: user.username, role: user.role, name: user.name }, JWT_SECRET, { expiresIn: '2d' });
      res.json({ token, user: { id: user.id, username: user.username, name: user.name, role: user.role } });
    });
  });
});

// 내 정보 조회 (로그인 필요)
app.get('/me', authenticateToken, (req, res) => {
  const userId = req.user && req.user.id;
  if (!userId) return res.status(401).send('Unauthorized');
  db.get('SELECT id, username, name, role, department, isApproved, profileImage, email, phone, address, accountNumber FROM users WHERE id = ?', [userId], (err, user) => {
    if (err || !user) return res.status(404).send('사용자 정보 없음');
    res.json(user);
  });
});

// 로그아웃 (토큰 무효화)
app.post('/logout', authenticateToken, (req, res) => {
  // JWT는 stateless이므로 서버에서 특별히 무효화할 수 없지만,
  // 클라이언트에서 토큰을 제거하도록 하고, 필요시 블랙리스트에 추가할 수 있음
  res.json({ message: '로그아웃 성공' });
});

// 닉네임 변경 (로그인 필요)
app.post('/me/nickname', authenticateToken, (req, res) => {
  const userId = req.user && req.user.id;
  const { name } = req.body;
  if (!userId || !name) return res.status(400).send('닉네임이 필요합니다.');
  db.run('UPDATE users SET name = ? WHERE id = ?', [name, userId], function(err) {
    if (err) return res.status(500).send('닉네임 변경 오류');
    res.json({ message: '닉네임이 변경되었습니다.' });
  });
});

// 프로필 정보 업데이트 (로그인 필요)
app.post('/profile/update-info', authenticateToken, (req, res) => {
  const userId = req.user && req.user.id;
  const { name, email, phone, address, accountNumber } = req.body;
  if (!userId) return res.status(400).send('사용자 정보가 필요합니다.');
  
  db.run('UPDATE users SET name = ?, email = ?, phone = ?, address = ?, accountNumber = ? WHERE id = ?', 
    [name || '', email || '', phone || '', address || '', accountNumber || '', userId], 
    function(err) {
      if (err) return res.status(500).send('프로필 정보 변경 오류');
      res.json({ message: '프로필 정보가 변경되었습니다.' });
    }
  );
});

// 프로필 정보 조회 (로그인 필요)
app.get('/profile/info', authenticateToken, (req, res) => {
  const userId = req.user && req.user.id;
  if (!userId) return res.status(401).send('Unauthorized');
  db.get('SELECT id, username, name, email, phone, address, accountNumber FROM users WHERE id = ?', [userId], (err, user) => {
    if (err || !user) return res.status(404).send('사용자 정보 없음');
    res.json(user);
  });
});

// 비밀번호 변경 (로그인 필요)
app.post('/profile/change-password', authenticateToken, (req, res) => {
  const userId = req.user && req.user.id;
  const { currentPassword, newPassword } = req.body;
  
  if (!userId || !currentPassword || !newPassword) {
    return res.status(400).send('현재 비밀번호와 새 비밀번호가 필요합니다.');
  }
  
  // 현재 비밀번호 확인
  db.get('SELECT password FROM users WHERE id = ?', [userId], (err, user) => {
    if (err || !user) {
      return res.status(404).send('사용자 정보를 찾을 수 없습니다.');
    }
    
    bcrypt.compare(currentPassword, user.password, (err, result) => {
      if (err || !result) {
        return res.status(401).send('현재 비밀번호가 일치하지 않습니다.');
      }
      
      // 새 비밀번호 해시화
      bcrypt.hash(newPassword, saltRounds, (err, hash) => {
        if (err) {
          return res.status(500).send('비밀번호 암호화 오류');
        }
        
        // 비밀번호 업데이트
        db.run('UPDATE users SET password = ? WHERE id = ?', [hash, userId], function(err) {
          if (err) {
            return res.status(500).send('비밀번호 변경 오류');
          }
          res.json({ message: '비밀번호가 성공적으로 변경되었습니다.' });
        });
      });
    });
  });
});

// (채팅 등에서) 사용자 id로 닉네임/권한 조회
app.get('/user/:id', (req, res) => {
  const userId = req.params.id;
  db.get('SELECT id, username, name, role FROM users WHERE id = ?', [userId], (err, user) => {
    if (err || !user) return res.status(404).send('사용자 정보 없음');
    res.json(user);
  });
});

// 테스트용 알림 전송 API
app.post('/api/send-notification', (req, res) => {
  const { type, targetUserId, notification } = req.body;
  
  try {
    if (type === 'notify' && targetUserId) {
      const target = clients[targetUserId];
      if (target && target.readyState === WebSocket.OPEN) {
        target.send(JSON.stringify(notification));
        console.log(`API를 통한 알림 전송: ${targetUserId} → ${notification.title}`);
        res.json({ success: true, message: '알림이 전송되었습니다.' });
      } else {
        res.json({ success: false, message: '대상 사용자가 연결되어 있지 않습니다.' });
      }
    } else if (type === 'broadcast') {
      Object.keys(clients).forEach(userId => {
        const client = clients[userId];
        if (client && client.readyState === WebSocket.OPEN) {
          client.send(JSON.stringify(notification));
        }
      });
      console.log(`API를 통한 브로드캐스트 알림 전송: ${notification.title}`);
      res.json({ success: true, message: '브로드캐스트 알림이 전송되었습니다.' });
    } else if (type === 'notify_staff') {
      Object.keys(clients).forEach(userId => {
        if (userId.startsWith('admin') || userId.startsWith('staff') || userId === 'admin') {
          const client = clients[userId];
          if (client && client.readyState === WebSocket.OPEN) {
            client.send(JSON.stringify(notification));
          }
        }
      });
      console.log(`API를 통한 직원 알림 전송: ${notification.title}`);
      res.json({ success: true, message: '직원 알림이 전송되었습니다.' });
    } else {
      res.status(400).json({ success: false, message: '잘못된 알림 타입입니다.' });
    }
  } catch (error) {
    console.error('알림 전송 오류:', error);
    res.status(500).json({ success: false, message: '알림 전송 중 오류가 발생했습니다.' });
  }
});

// 연결된 클라이언트 목록 조회 API
app.get('/api/connected-clients', (req, res) => {
  const clientList = Object.keys(clients).map(userId => ({
    userId,
    connected: clients[userId]?.readyState === WebSocket.OPEN
  }));
  res.json({ clients: clientList, count: clientList.length });
});

// 프로필 사진 업로드 API
app.post('/profile/upload-image', authenticateToken, profileUpload.single('profileImage'), (req, res) => {
  try {
    const userId = req.user.id;
    const file = req.file;
    
    if (!file) {
      return res.status(400).json({ error: '파일이 없습니다.' });
    }
    
    // 기존 프로필 사진 삭제
    db.get('SELECT profileImage FROM users WHERE id = ?', [userId], (err, user) => {
      if (err) {
        return res.status(500).json({ error: err.message });
      }
      
      // 기존 파일 삭제
      if (user && user.profileImage) {
        const oldFilePath = path.join(__dirname, 'uploads', 'profiles', user.profileImage);
        if (fs.existsSync(oldFilePath)) {
          fs.unlinkSync(oldFilePath);
        }
      }
      
      // 새 파일 경로 저장
      const relativePath = path.relative(path.join(__dirname, 'uploads'), file.path);
      db.run('UPDATE users SET profileImage = ? WHERE id = ?', [relativePath, userId], function(err) {
        if (err) {
          return res.status(500).json({ error: err.message });
        }
        res.json({ 
          message: '프로필 사진이 업로드되었습니다.',
          profileImage: relativePath
        });
      });
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 프로필 사진 조회 API
app.get('/profile/image/:userId', (req, res) => {
  const userId = req.params.userId;
  
  db.get('SELECT profileImage FROM users WHERE id = ?', [userId], (err, user) => {
    if (err || !user || !user.profileImage) {
      return res.status(404).json({ error: '프로필 사진을 찾을 수 없습니다.' });
    }
    
    const filePath = path.join(__dirname, 'uploads', user.profileImage);
    if (fs.existsSync(filePath)) {
      res.sendFile(filePath);
    } else {
      res.status(404).json({ error: '파일을 찾을 수 없습니다.' });
    }
  });
});

// 프로필 사진 삭제 API
app.delete('/profile/delete-image', authenticateToken, (req, res) => {
  const userId = req.user.id;
  
  db.get('SELECT profileImage FROM users WHERE id = ?', [userId], (err, user) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    
    if (user && user.profileImage) {
      const filePath = path.join(__dirname, 'uploads', user.profileImage);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    }
    
    db.run('UPDATE users SET profileImage = NULL WHERE id = ?', [userId], function(err) {
      if (err) {
        return res.status(500).json({ error: err.message });
      }
      res.json({ message: '프로필 사진이 삭제되었습니다.' });
    });
  });
});

// === 채팅 권한 관리 API ===

// 채팅 권한 저장
app.post('/chat-permissions', authenticateToken, requireAdmin, (req, res) => {
  const { permissions } = req.body;
  
  if (!permissions || !Array.isArray(permissions)) {
    return res.status(400).json({ error: '권한 데이터가 올바르지 않습니다.' });
  }
  
  try {
    // 기존 채팅 권한 삭제
    db.run('DELETE FROM chat_permissions', [], (err) => {
      if (err) {
        return res.status(500).json({ error: err.message });
      }
      
      // 새로운 권한 데이터 삽입
      const stmt = db.prepare('INSERT INTO chat_permissions (userId, page, hasPermission) VALUES (?, ?, ?)');
      
      permissions.forEach(user => {
        Object.entries(user.permissions).forEach(([page, hasPermission]) => {
          stmt.run([user.userId, page, hasPermission ? 1 : 0]);
        });
      });
      
      stmt.finalize((err) => {
        if (err) {
          return res.status(500).json({ error: err.message });
        }
        res.json({ message: '채팅 권한이 성공적으로 저장되었습니다.' });
      });
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 채팅 권한 조회
app.get('/chat-permissions', authenticateToken, (req, res) => {
  db.all('SELECT userId, page, hasPermission FROM chat_permissions', [], (err, rows) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    
    // 사용자별로 권한 그룹화
    const permissions = {};
    rows.forEach(row => {
      if (!permissions[row.userId]) {
        permissions[row.userId] = {};
      }
      permissions[row.userId][row.page] = row.hasPermission === 1;
    });
    
    res.json(permissions);
  });
});

// === 견적 데이터 API (자동 연동용) ===

// GET: 모든 견적 조회
app.get('/estimates', (req, res) => {
  const { status, customerName, dateFrom, dateTo } = req.query;
  let query = 'SELECT * FROM estimates';
  let params = [];
  let conditions = [];
  
  if (status) {
    conditions.push('status = ?');
    params.push(status);
  }
  if (customerName) {
    conditions.push('customerName LIKE ?');
    params.push(`%${customerName}%`);
  }
  if (dateFrom) {
    conditions.push('estimateDate >= ?');
    params.push(dateFrom);
  }
  if (dateTo) {
    conditions.push('estimateDate <= ?');
    params.push(dateTo);
  }
  
  if (conditions.length > 0) {
    query += ' WHERE ' + conditions.join(' AND ');
  }
  
  query += ' ORDER BY estimateDate DESC, createdAt DESC';
  
  db.all(query, params, (err, rows) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    res.json(rows);
  });
});

// POST: 견적 등록
app.post('/estimates', (req, res) => {
  const { estimateNo, customerName, projectName, totalAmount, discountedAmount, estimateDate, contact, emergencyContact, type, address, products } = req.body;
  
  if (!estimateNo || !customerName || !totalAmount || !estimateDate) {
    return res.status(400).json({ error: '필수 필드가 누락되었습니다.' });
  }
  
  const now = new Date().toISOString();
  db.run(
    'INSERT INTO estimates (estimateNo, customerName, projectName, totalAmount, discountedAmount, estimateDate, contact, emergencyContact, type, address, products, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
    [estimateNo, customerName, projectName || '', totalAmount, discountedAmount || totalAmount, estimateDate, contact || '', emergencyContact || '', type || '', address || '', products ? JSON.stringify(products) : '', now, now],
    function(err) {
      if (err) {
        return res.status(500).json({ error: err.message });
      }
      res.status(201).json({ 
        message: '견적이 성공적으로 등록되었습니다.',
        id: this.lastID 
      });
    }
  );
});

// PUT: 견적 수정
app.put('/estimates/:id', (req, res) => {
  const { id } = req.params;
  const { customerName, projectName, totalAmount, discountedAmount, estimateDate, contact, emergencyContact, type, address, products, status } = req.body;
  
  if (!customerName || !totalAmount || !estimateDate) {
    return res.status(400).json({ error: '필수 필드가 누락되었습니다.' });
  }
  
  const now = new Date().toISOString();
  db.run(
    'UPDATE estimates SET customerName = ?, projectName = ?, totalAmount = ?, discountedAmount = ?, estimateDate = ?, contact = ?, emergencyContact = ?, type = ?, address = ?, products = ?, status = ?, updatedAt = ? WHERE id = ?',
    [customerName, projectName || '', totalAmount, discountedAmount || totalAmount, estimateDate, contact || '', emergencyContact || '', type || '', address || '', products ? JSON.stringify(products) : '', status || 'draft', now, id],
    function(err) {
      if (err) {
        return res.status(500).json({ error: err.message });
      }
      if (this.changes === 0) {
        return res.status(404).json({ error: '견적을 찾을 수 없습니다.' });
      }
      res.json({ message: '견적이 성공적으로 수정되었습니다.' });
    }
  );
});

// === 계약 데이터 API (자동 연동용) ===

// GET: 모든 계약 조회
app.get('/contracts', (req, res) => {
  const { status, customerName, estimateNo } = req.query;
  let query = 'SELECT * FROM contracts';
  let params = [];
  let conditions = [];
  
  if (status) {
    conditions.push('status = ?');
    params.push(status);
  }
  if (customerName) {
    conditions.push('customerName LIKE ?');
    params.push(`%${customerName}%`);
  }
  if (estimateNo) {
    conditions.push('estimateNo = ?');
    params.push(estimateNo);
  }
  
  if (conditions.length > 0) {
    query += ' WHERE ' + conditions.join(' AND ');
  }
  
  query += ' ORDER BY contractDate DESC, createdAt DESC';
  
  db.all(query, params, (err, rows) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    res.json(rows);
  });
});

// POST: 계약 등록
app.post('/contracts', (req, res) => {
  const { contractNo, estimateNo, customerName, projectName, totalAmount, depositAmount, contractDate, constructionDate } = req.body;
  
  if (!contractNo || !estimateNo || !customerName || !totalAmount || !contractDate) {
    return res.status(400).json({ error: '필수 필드가 누락되었습니다.' });
  }
  
  const balanceAmount = totalAmount - (depositAmount || 0);
  const now = new Date().toISOString();
  
  db.run(
    'INSERT INTO contracts (contractNo, estimateNo, customerName, projectName, totalAmount, depositAmount, balanceAmount, contractDate, constructionDate, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
    [contractNo, estimateNo, customerName, projectName || '', totalAmount, depositAmount || 0, balanceAmount, contractDate, constructionDate || '', now, now],
    function(err) {
      if (err) {
        return res.status(500).json({ error: err.message });
      }
      res.status(201).json({ 
        message: '계약이 성공적으로 등록되었습니다.',
        id: this.lastID 
      });
    }
  );
});

// === 배송 데이터 API (자동 연동용) ===

// GET: 모든 배송 조회
app.get('/deliveries', (req, res) => {
  const { status, customerName, contractNo, estimateNo } = req.query;
  let query = 'SELECT * FROM deliveries';
  let params = [];
  let conditions = [];
  
  if (status) {
    conditions.push('status = ?');
    params.push(status);
  }
  if (customerName) {
    conditions.push('customerName LIKE ?');
    params.push(`%${customerName}%`);
  }
  if (contractNo) {
    conditions.push('contractNo = ?');
    params.push(contractNo);
  }
  if (estimateNo) {
    conditions.push('estimateNo = ?');
    params.push(estimateNo);
  }
  
  if (conditions.length > 0) {
    query += ' WHERE ' + conditions.join(' AND ');
  }
  
  query += ' ORDER BY deliveryDate DESC, createdAt DESC';
  
  db.all(query, params, (err, rows) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    res.json(rows);
  });
});

// POST: 배송 등록
app.post('/deliveries', (req, res) => {
  const { deliveryNo, contractNo, estimateNo, customerName, projectName, totalAmount, deliveryDate } = req.body;
  
  if (!deliveryNo || !contractNo || !estimateNo || !customerName || !totalAmount || !deliveryDate) {
    return res.status(400).json({ error: '필수 필드가 누락되었습니다.' });
  }
  
  const now = new Date().toISOString();
  
  db.run(
    'INSERT INTO deliveries (deliveryNo, contractNo, estimateNo, customerName, projectName, totalAmount, deliveryDate, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
    [deliveryNo, contractNo, estimateNo, customerName, projectName || '', totalAmount, deliveryDate, now, now],
    function(err) {
      if (err) {
        return res.status(500).json({ error: err.message });
      }
      res.status(201).json({ 
        message: '배송이 성공적으로 등록되었습니다.',
        id: this.lastID 
      });
    }
  );
});

// === 예산 관리 API ===

// GET: 예산 조회
app.get('/budgets', (req, res) => {
  const { year, month, category } = req.query;
  let query = 'SELECT * FROM budgets';
  let params = [];
  let conditions = [];
  
  if (year) {
    conditions.push('year = ?');
    params.push(year);
  }
  if (month) {
    conditions.push('month = ?');
    params.push(month);
  }
  if (category) {
    conditions.push('category = ?');
    params.push(category);
  }
  
  if (conditions.length > 0) {
    query += ' WHERE ' + conditions.join(' AND ');
  }
  
  query += ' ORDER BY year DESC, month DESC, category';
  
  db.all(query, params, (err, rows) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    res.json(rows);
  });
});

// POST: 예산 등록
app.post('/budgets', (req, res) => {
  const { year, month, category, amount, description } = req.body;
  
  if (!year || !month || !category || !amount) {
    return res.status(400).json({ error: '필수 필드가 누락되었습니다.' });
  }
  
  const now = new Date().toISOString();
  
  // 기존 예산이 있는지 확인 후 INSERT 또는 UPDATE
  db.get('SELECT id FROM budgets WHERE year = ? AND month = ? AND category = ?', [year, month, category], (err, existing) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    
    if (existing) {
      // 기존 예산 업데이트
      db.run(
        'UPDATE budgets SET amount = ?, description = ?, updatedAt = ? WHERE id = ?',
        [amount, description || '', now, existing.id],
        function(err) {
          if (err) {
            return res.status(500).json({ error: err.message });
          }
          res.status(200).json({ 
            message: '예산이 성공적으로 수정되었습니다.',
            id: existing.id 
          });
        }
      );
    } else {
      // 새 예산 등록
      db.run(
        'INSERT INTO budgets (year, month, category, amount, description, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?, ?, ?)',
        [year, month, category, amount, description || '', now, now],
        function(err) {
          if (err) {
            return res.status(500).json({ error: err.message });
          }
          res.status(201).json({ 
            message: '예산이 성공적으로 등록되었습니다.',
            id: this.lastID 
          });
        }
      );
    }
  });
});

// === 수익성 분석 API ===

// GET: 수익성 분석 조회
app.get('/profit-analysis', (req, res) => {
  const { estimateNo, contractNo, customerName, dateFrom, dateTo } = req.query;
  let query = 'SELECT * FROM profit_analysis';
  let params = [];
  let conditions = [];
  
  if (estimateNo) {
    conditions.push('estimateNo = ?');
    params.push(estimateNo);
  }
  if (contractNo) {
    conditions.push('contractNo = ?');
    params.push(contractNo);
  }
  if (customerName) {
    conditions.push('customerName LIKE ?');
    params.push(`%${customerName}%`);
  }
  if (dateFrom) {
    conditions.push('analysisDate >= ?');
    params.push(dateFrom);
  }
  if (dateTo) {
    conditions.push('analysisDate <= ?');
    params.push(dateTo);
  }
  
  if (conditions.length > 0) {
    query += ' WHERE ' + conditions.join(' AND ');
  }
  
  query += ' ORDER BY analysisDate DESC, createdAt DESC';
  
  db.all(query, params, (err, rows) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    res.json(rows);
  });
});

// POST: 수익성 분석 등록
app.post('/profit-analysis', (req, res) => {
  const { estimateNo, contractNo, deliveryNo, customerName, projectName, totalRevenue, totalCost, netProfit, analysisDate } = req.body;
  
  if (!estimateNo || !customerName || !totalRevenue || !totalCost || !analysisDate) {
    return res.status(400).json({ error: '필수 필드가 누락되었습니다.' });
  }
  
  const grossProfit = totalRevenue - totalCost;
  const grossMargin = totalRevenue > 0 ? (grossProfit / totalRevenue * 100) : 0;
  const netMargin = totalRevenue > 0 ? (netProfit / totalRevenue * 100) : 0;
  const roi = totalCost > 0 ? (grossProfit / totalCost * 100) : 0;
  
  const now = new Date().toISOString();
  
  db.run(
    'INSERT INTO profit_analysis (estimateNo, contractNo, deliveryNo, customerName, projectName, totalRevenue, totalCost, grossProfit, grossMargin, netProfit, netMargin, roi, analysisDate, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
    [estimateNo, contractNo || '', deliveryNo || '', customerName, projectName || '', totalRevenue, totalCost, grossProfit, grossMargin, netProfit || grossProfit, netMargin, roi, analysisDate, now, now],
    function(err) {
      if (err) {
        return res.status(500).json({ error: err.message });
      }
      res.status(201).json({ 
        message: '수익성 분석이 성공적으로 등록되었습니다.',
        id: this.lastID 
      });
    }
  );
});

// === 세금계산서 API 연동 ===

// GET: 세금계산서 API 데이터 조회
app.get('/tax-invoice-api', (req, res) => {
  const { status, customerName, estimateNo, contractNo } = req.query;
  let query = 'SELECT * FROM tax_invoice_api';
  let params = [];
  let conditions = [];
  
  if (status) {
    conditions.push('status = ?');
    params.push(status);
  }
  if (customerName) {
    conditions.push('customerName LIKE ?');
    params.push(`%${customerName}%`);
  }
  if (estimateNo) {
    conditions.push('estimateNo = ?');
    params.push(estimateNo);
  }
  if (contractNo) {
    conditions.push('contractNo = ?');
    params.push(contractNo);
  }
  
  if (conditions.length > 0) {
    query += ' WHERE ' + conditions.join(' AND ');
  }
  
  query += ' ORDER BY issueDate DESC, createdAt DESC';
  
  db.all(query, params, (err, rows) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    res.json(rows);
  });
});

// POST: 세금계산서 발행 요청
app.post('/tax-invoice-api/issue', (req, res) => {
  const { estimateNo, contractNo, customerName, amount, issueDate } = req.body;
  
  if (!customerName || !amount || !issueDate) {
    return res.status(400).json({ error: '필수 필드가 누락되었습니다.' });
  }
  
  const taxAmount = Math.round(amount * 0.1); // 10% 부가세
  const totalAmount = amount + taxAmount;
  const invoiceNo = `TI${Date.now()}`; // 임시 인보이스 번호
  
  const now = new Date().toISOString();
  
  // 실제 세금계산서 API 호출 시뮬레이션
  const apiResponse = {
    success: true,
    invoiceNo: invoiceNo,
    message: '세금계산서가 성공적으로 발행되었습니다.',
    timestamp: now
  };
  
  db.run(
    'INSERT INTO tax_invoice_api (invoiceNo, estimateNo, contractNo, customerName, amount, taxAmount, totalAmount, issueDate, status, apiResponse, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
    [invoiceNo, estimateNo || '', contractNo || '', customerName, amount, taxAmount, totalAmount, issueDate, 'completed', JSON.stringify(apiResponse), now, now],
    function(err) {
      if (err) {
        return res.status(500).json({ error: err.message });
      }
      res.status(201).json({ 
        message: '세금계산서 발행이 요청되었습니다.',
        id: this.lastID,
        invoiceNo: invoiceNo,
        apiResponse: apiResponse
      });
    }
  );
});

// === 자동 데이터 연동 API ===

// POST: 견적에서 계약으로 자동 연동
app.post('/auto-sync/estimate-to-contract', (req, res) => {
  const { estimateNo } = req.body;
  
  if (!estimateNo) {
    return res.status(400).json({ error: '견적번호가 필요합니다.' });
  }
  
  // 견적 데이터 조회
  db.get('SELECT * FROM estimates WHERE estimateNo = ?', [estimateNo], (err, estimate) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    if (!estimate) {
      return res.status(404).json({ error: '견적을 찾을 수 없습니다.' });
    }
    
    // 계약번호 생성
    const contractNo = `C${estimateNo.replace('E', '')}-${Date.now()}`;
    const contractDate = new Date().toISOString().split('T')[0];
    
    // 계약 데이터 생성
    const contractData = {
      contractNo: contractNo,
      estimateNo: estimate.estimateNo,
      customerName: estimate.customerName,
      projectName: estimate.projectName,
      totalAmount: estimate.totalAmount,
      depositAmount: 0,
      balanceAmount: estimate.totalAmount,
      contractDate: contractDate,
      status: 'draft'
    };
    
    // 계약 등록
    db.run(
      'INSERT INTO contracts (contractNo, estimateNo, customerName, projectName, totalAmount, depositAmount, balanceAmount, contractDate, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [contractData.contractNo, contractData.estimateNo, contractData.customerName, contractData.projectName, contractData.totalAmount, contractData.depositAmount, contractData.balanceAmount, contractData.contractDate, new Date().toISOString(), new Date().toISOString()],
      function(err) {
        if (err) {
          return res.status(500).json({ error: err.message });
        }
        
        // 견적 상태 업데이트
        db.run('UPDATE estimates SET status = ? WHERE estimateNo = ?', ['contracted', estimateNo], (err2) => {
          if (err2) {
            console.error('견적 상태 업데이트 오류:', err2);
          }
          
          res.status(201).json({ 
            message: '견적이 계약으로 자동 연동되었습니다.',
            contractNo: contractNo,
            contractData: contractData
          });
        });
      }
    );
  });
});

// POST: 계약에서 배송으로 자동 연동
app.post('/auto-sync/contract-to-delivery', (req, res) => {
  const { contractNo } = req.body;
  
  if (!contractNo) {
    return res.status(400).json({ error: '계약번호가 필요합니다.' });
  }
  
  // 계약 데이터 조회
  db.get('SELECT * FROM contracts WHERE contractNo = ?', [contractNo], (err, contract) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    if (!contract) {
      return res.status(404).json({ error: '계약을 찾을 수 없습니다.' });
    }
    
    // 배송번호 생성
    const deliveryNo = `D${contractNo.replace('C', '')}-${Date.now()}`;
    const deliveryDate = new Date().toISOString().split('T')[0];
    
    // 배송 데이터 생성
    const deliveryData = {
      deliveryNo: deliveryNo,
      contractNo: contract.contractNo,
      estimateNo: contract.estimateNo,
      customerName: contract.customerName,
      projectName: contract.projectName,
      totalAmount: contract.totalAmount,
      deliveryDate: deliveryDate,
      status: 'pending',
      paymentStatus: 'pending'
    };
    
    // 배송 등록
    db.run(
      'INSERT INTO deliveries (deliveryNo, contractNo, estimateNo, customerName, projectName, totalAmount, deliveryDate, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [deliveryData.deliveryNo, deliveryData.contractNo, deliveryData.estimateNo, deliveryData.customerName, deliveryData.projectName, deliveryData.totalAmount, deliveryData.deliveryDate, new Date().toISOString(), new Date().toISOString()],
      function(err) {
        if (err) {
          return res.status(500).json({ error: err.message });
        }
        
        // 계약 상태 업데이트
        db.run('UPDATE contracts SET status = ? WHERE contractNo = ?', ['delivered', contractNo], (err2) => {
          if (err2) {
            console.error('계약 상태 업데이트 오류:', err2);
          }
          
          res.status(201).json({ 
            message: '계약이 배송으로 자동 연동되었습니다.',
            deliveryNo: deliveryNo,
            deliveryData: deliveryData
          });
        });
      }
    );
  });
});

// POST: 배송에서 매출로 자동 연동
app.post('/auto-sync/delivery-to-sales', (req, res) => {
  const { deliveryNo } = req.body;
  
  if (!deliveryNo) {
    return res.status(400).json({ error: '배송번호가 필요합니다.' });
  }
  
  // 배송 데이터 조회
  db.get('SELECT * FROM deliveries WHERE deliveryNo = ?', [deliveryNo], (err, delivery) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    if (!delivery) {
      return res.status(404).json({ error: '배송을 찾을 수 없습니다.' });
    }
    
    // 매출 데이터 생성
    const salesData = {
      productName: delivery.projectName || '커튼/블라인드',
      productCode: delivery.deliveryNo,
      partner: delivery.customerName,
      category: '커튼/블라인드',
      quantity: 1,
      amount: delivery.totalAmount,
      date: delivery.deliveryDate
    };
    
    // 매출 기록 등록
    db.run(
      'INSERT INTO sales_records (productName, productCode, partner, category, quantity, amount, date, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [salesData.productName, salesData.productCode, salesData.partner, salesData.category, salesData.quantity, salesData.amount, salesData.date, new Date().toISOString(), new Date().toISOString()],
      function(err) {
        if (err) {
          return res.status(500).json({ error: err.message });
        }
        
        // 배송 상태 업데이트
        db.run('UPDATE deliveries SET status = ?, paymentStatus = ? WHERE deliveryNo = ?', ['completed', 'paid', deliveryNo], (err2) => {
          if (err2) {
            console.error('배송 상태 업데이트 오류:', err2);
          }
          
          res.status(201).json({ 
            message: '배송이 매출로 자동 연동되었습니다.',
            salesData: salesData
          });
        });
      }
    );
  });
});

app.get('/', (req, res) => {
  res.send('백엔드 서버가 실행 중입니다!');
});

app.listen(port, '0.0.0.0', () => {
  console.log(`서버가 http://0.0.0.0:${port} 에서 실행 중입니다.`);
  console.log(`외부 접속: http://sixjjang.synology.me:${port}`);
}); 

process.on('uncaughtException', (err) => {
  console.error('Uncaught Exception:', err);
});
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection:', reason);
}); 