const functions = require('firebase-functions');
const admin = require('firebase-admin');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const cors = require('cors')({ 
  origin: [
    'https://windowerp-3.firebaseapp.com',
    'https://windowerp-3.web.app',
    'http://localhost:3000',
    'http://localhost:3001',
    'https://sixjjang.synology.me',
    'http://sixjjang.synology.me'
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Origin', 'Accept']
});
const express = require('express');
const multer = require('multer');
const { v4: uuidv4 } = require('uuid');

// Firebase Admin 초기화
admin.initializeApp();

const db = admin.firestore();
const JWT_SECRET = functions.config().jwt?.secret || 'windowerp-2024-secure-jwt-secret-key-for-production';

// Express 앱 생성
const app = express();
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// CORS 핸들러
const corsHandler = (req, res, callback) => {
  return cors(req, res, callback);
};

// JWT 토큰 검증 미들웨어
const authenticateToken = async (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(403).json({ error: 'Invalid token' });
  }
};

// Multer 설정 (파일 업로드용)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB
  },
});

// ===== 인증 관련 함수들 =====

// 로그인 (HTTP Request) - /login
exports.login = functions.https.onRequest(async (req, res) => {
  return corsHandler(req, res, async () => {
    if (req.method !== 'POST') return res.status(405).send('Method Not Allowed');
    
    try {
      const { username, password } = req.body;
      
      if (!username || !password) {
        return res.status(400).json({ error: '사용자명과 비밀번호가 필요합니다.' });
      }

      // Firestore에서 사용자 조회
      const userSnapshot = await db.collection('users')
        .where('username', '==', username)
        .limit(1)
        .get();

      if (userSnapshot.empty) {
        return res.status(401).json({ error: '사용자명 또는 비밀번호가 잘못되었습니다.' });
      }

      const userDoc = userSnapshot.docs[0];
      const userData = userDoc.data();

      // 비밀번호 검증
      const isValidPassword = await bcrypt.compare(password, userData.password);
      if (!isValidPassword) {
        return res.status(401).json({ error: '사용자명 또는 비밀번호가 잘못되었습니다.' });
      }

      // JWT 토큰 생성
      const token = jwt.sign(
        { 
          id: userDoc.id, 
          username: userData.username, 
          role: userData.role || 'user' 
        },
        JWT_SECRET,
        { expiresIn: '24h' }
      );

      res.json({
        token,
        user: {
          id: userDoc.id,
          username: userData.username,
          name: userData.name,
          role: userData.role || 'user',
          profileImage: userData.profileImage
        }
      });
    } catch (error) {
      console.error('로그인 오류:', error);
      res.status(500).json({ error: error.message });
    }
  });
});

// 사용자 정보 조회 (HTTP Request) - /me
exports.me = functions.https.onRequest(async (req, res) => {
  return corsHandler(req, res, async () => {
    try {
      await authenticateToken(req, res, async () => {
        const userSnapshot = await db.collection('users').doc(req.user.id).get();
        
        if (!userSnapshot.exists) {
          return res.status(404).json({ error: '사용자를 찾을 수 없습니다.' });
        }

        const userData = userSnapshot.data();
        res.json({
          id: userSnapshot.id,
          username: userData.username,
          name: userData.name,
          role: userData.role || 'user',
          profileImage: userData.profileImage
        });
      });
    } catch (error) {
      console.error('사용자 정보 조회 오류:', error);
      res.status(500).json({ error: error.message });
    }
  });
});

// ===== 회사 정보 관리 =====

// 회사 정보 조회 (HTTP Request) - /company-info
exports.companyInfo = functions.https.onRequest(async (req, res) => {
  // CORS 헤더를 명시적으로 설정
  res.set('Access-Control-Allow-Origin', '*');
  res.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.set('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With, Origin, Accept');
  res.set('Access-Control-Max-Age', '86400'); // 24시간 캐시
  
  // OPTIONS 요청 처리
  if (req.method === 'OPTIONS') {
    res.status(200).send();
    return;
  }
  
  try {
    if (req.method === 'GET') {
      // Firestore에서 회사 정보 조회
      const companySnapshot = await db.collection('companies').get();
      
      if (!companySnapshot.empty) {
        const companies = companySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        res.json(companies);
      } else {
        // 기본 회사 정보 반환
        res.json([{
          id: 'default',
          type: '우리회사',
          name: '회사명',
          address: '회사주소',
          contact: '회사연락처',
          businessNumber: '',
          representative: '',
          email: '',
          website: ''
        }]);
      }
    } else if (req.method === 'POST') {
      // 회사 정보 저장/업데이트
      const companyData = req.body;
      
      if (Array.isArray(companyData)) {
        // 여러 회사 정보 처리
        const batch = db.batch();
        companyData.forEach((company, index) => {
          const docRef = db.collection('companies').doc(company.id || `company_${index}`);
          batch.set(docRef, company);
        });
        await batch.commit();
      } else {
        // 단일 회사 정보 처리
        await db.collection('companies').doc(companyData.id || 'main').set(companyData, { merge: true });
      }
      
      res.json({ message: '회사 정보가 저장되었습니다.' });
    }
  } catch (error) {
    console.error('회사 정보 처리 오류:', error);
    res.status(500).json({ error: error.message });
  }
});

// ===== 견적서 관리 =====

// 견적서 목록 조회 (HTTP Request) - /estimates
exports.estimates = functions.https.onRequest(async (req, res) => {
  return corsHandler(req, res, async () => {
    try {
      const { status, customerName, dateFrom, dateTo } = req.query;
      
      let query = db.collection('estimates');
      
      if (status) {
        query = query.where('status', '==', status);
      }
      if (customerName) {
        query = query.where('customerName', '>=', customerName)
                    .where('customerName', '<=', customerName + '\uf8ff');
      }
      if (dateFrom) {
        query = query.where('estimateDate', '>=', dateFrom);
      }
      if (dateTo) {
        query = query.where('estimateDate', '<=', dateTo);
      }
      
      const snapshot = await query.orderBy('estimateDate', 'desc').get();
      const estimates = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      
      res.json(estimates);
    } catch (error) {
      console.error('견적서 조회 오류:', error);
      res.status(500).json({ error: error.message });
    }
  });
});

// 견적서 저장 (HTTP Request) - /estimates
exports.saveEstimate = functions.https.onRequest(async (req, res) => {
  return corsHandler(req, res, async () => {
    if (req.method !== 'POST') return res.status(405).send('Method Not Allowed');
    
    try {
      const estimateData = req.body;
      estimateData.createdAt = admin.firestore.FieldValue.serverTimestamp();
      estimateData.updatedAt = admin.firestore.FieldValue.serverTimestamp();
      
      const docRef = await db.collection('estimates').add(estimateData);
      
      res.json({ 
        message: '견적서가 저장되었습니다.',
        id: docRef.id 
      });
    } catch (error) {
      console.error('견적서 저장 오류:', error);
      res.status(500).json({ error: error.message });
    }
  });
});

// ===== 계약서 관리 =====

// 계약서 목록 조회 (HTTP Request) - /contracts
exports.contracts = functions.https.onRequest(async (req, res) => {
  return corsHandler(req, res, async () => {
    try {
      const { status, customerName, estimateNo } = req.query;
      
      let query = db.collection('contracts');
      
      if (status) {
        query = query.where('status', '==', status);
      }
      if (customerName) {
        query = query.where('customerName', '>=', customerName)
                    .where('customerName', '<=', customerName + '\uf8ff');
      }
      if (estimateNo) {
        query = query.where('estimateNo', '==', estimateNo);
      }
      
      const snapshot = await query.orderBy('contractDate', 'desc').get();
      const contracts = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      
      res.json(contracts);
    } catch (error) {
      console.error('계약서 조회 오류:', error);
      res.status(500).json({ error: error.message });
    }
  });
});

// 계약서 저장 (HTTP Request) - /contracts
exports.saveContract = functions.https.onRequest(async (req, res) => {
  return corsHandler(req, res, async () => {
    if (req.method !== 'POST') return res.status(405).send('Method Not Allowed');
    
    try {
      const contractData = req.body;
      contractData.createdAt = admin.firestore.FieldValue.serverTimestamp();
      contractData.updatedAt = admin.firestore.FieldValue.serverTimestamp();
      
      const docRef = await db.collection('contracts').add(contractData);
      
      res.json({ 
        message: '계약서가 저장되었습니다.',
        id: docRef.id 
      });
    } catch (error) {
      console.error('계약서 저장 오류:', error);
      res.status(500).json({ error: error.message });
    }
  });
});

// ===== 고객 관리 =====

// 고객 목록 조회 (HTTP Request) - /customers
exports.customers = functions.https.onRequest(async (req, res) => {
  return corsHandler(req, res, async () => {
    try {
      const snapshot = await db.collection('customers').orderBy('name').get();
      const customers = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      
      res.json(customers);
    } catch (error) {
      console.error('고객 조회 오류:', error);
      res.status(500).json({ error: error.message });
    }
  });
});

// 고객 저장 (HTTP Request) - /customers
exports.saveCustomer = functions.https.onRequest(async (req, res) => {
  return corsHandler(req, res, async () => {
    if (req.method !== 'POST') return res.status(405).send('Method Not Allowed');
    
    try {
      const customerData = req.body;
      customerData.createdAt = admin.firestore.FieldValue.serverTimestamp();
      customerData.updatedAt = admin.firestore.FieldValue.serverTimestamp();
      
      const docRef = await db.collection('customers').add(customerData);
      
      res.json({ 
        message: '고객 정보가 저장되었습니다.',
        id: docRef.id 
      });
    } catch (error) {
      console.error('고객 저장 오류:', error);
      res.status(500).json({ error: error.message });
    }
  });
});

// ===== 제품 관리 =====

// 제품 목록 조회 (HTTP Request) - /products
exports.products = functions.https.onRequest(async (req, res) => {
  return corsHandler(req, res, async () => {
    try {
      const { vendor, brand, productType } = req.query;
      
      let query = db.collection('products');
      
      if (vendor) {
        query = query.where('vendor', '==', vendor);
      }
      if (brand) {
        query = query.where('brand', '==', brand);
      }
      if (productType) {
        query = query.where('productType', '==', productType);
      }
      
      const snapshot = await query.orderBy('productName').get();
      const products = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      
      res.json(products);
    } catch (error) {
      console.error('제품 조회 오류:', error);
      res.status(500).json({ error: error.message });
    }
  });
});

// 제품 저장 (HTTP Request) - /products
exports.saveProduct = functions.https.onRequest(async (req, res) => {
  return corsHandler(req, res, async () => {
    if (req.method !== 'POST') return res.status(405).send('Method Not Allowed');
    
    try {
      const productData = req.body;
      productData.createdAt = admin.firestore.FieldValue.serverTimestamp();
      productData.updatedAt = admin.firestore.FieldValue.serverTimestamp();
      
      const docRef = await db.collection('products').add(productData);
      
      res.json({ 
        message: '제품이 저장되었습니다.',
        id: docRef.id 
      });
    } catch (error) {
      console.error('제품 저장 오류:', error);
      res.status(500).json({ error: error.message });
    }
  });
});

// ===== 옵션 관리 =====

// 옵션 목록 조회 (HTTP Request) - /options
exports.options = functions.https.onRequest(async (req, res) => {
  return corsHandler(req, res, async () => {
    try {
      const { vendor, optionType } = req.query;
      
      let query = db.collection('options');
      
      if (vendor) {
        query = query.where('vendor', '==', vendor);
      }
      if (optionType) {
        query = query.where('optionType', '==', optionType);
      }
      
      const snapshot = await query.orderBy('optionName').get();
      const options = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      
      res.json(options);
    } catch (error) {
      console.error('옵션 조회 오류:', error);
      res.status(500).json({ error: error.message });
    }
  });
});

// 옵션 저장 (HTTP Request) - /options
exports.saveOption = functions.https.onRequest(async (req, res) => {
  return corsHandler(req, res, async () => {
    if (req.method !== 'POST') return res.status(405).send('Method Not Allowed');
    
    try {
      const optionData = req.body;
      optionData.createdAt = admin.firestore.FieldValue.serverTimestamp();
      optionData.updatedAt = admin.firestore.FieldValue.serverTimestamp();
      
      const docRef = await db.collection('options').add(optionData);
      
      res.json({ 
        message: '옵션이 저장되었습니다.',
        id: docRef.id 
      });
    } catch (error) {
      console.error('옵션 저장 오류:', error);
      res.status(500).json({ error: error.message });
    }
  });
});

// ===== 스케줄 관리 =====

// 스케줄 목록 조회 (HTTP Request) - /schedules
exports.schedules = functions.https.onRequest(async (req, res) => {
  return corsHandler(req, res, async () => {
    try {
      const snapshot = await db.collection('schedules').orderBy('startDate').get();
      const schedules = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      
      res.json(schedules);
    } catch (error) {
      console.error('스케줄 조회 오류:', error);
      res.status(500).json({ error: error.message });
    }
  });
});

// 스케줄 저장 (HTTP Request) - /schedules
exports.saveSchedule = functions.https.onRequest(async (req, res) => {
  return corsHandler(req, res, async () => {
    if (req.method !== 'POST') return res.status(405).send('Method Not Allowed');
    
    try {
      const scheduleData = req.body;
      scheduleData.createdAt = admin.firestore.FieldValue.serverTimestamp();
      scheduleData.updatedAt = admin.firestore.FieldValue.serverTimestamp();
      
      const docRef = await db.collection('schedules').add(scheduleData);
      
      res.json({ 
        message: '스케줄이 저장되었습니다.',
        id: docRef.id 
      });
    } catch (error) {
      console.error('스케줄 저장 오류:', error);
      res.status(500).json({ error: error.message });
    }
  });
});

// ===== 통계 데이터 =====

// 매출 통계 (HTTP Request) - /sales-records
exports.salesRecords = functions.https.onRequest(async (req, res) => {
  return corsHandler(req, res, async () => {
    try {
      const { month, partner, category, product } = req.query;
      
      let query = db.collection('sales-records');
      
      if (month) {
        query = query.where('month', '==', month);
      }
      if (partner) {
        query = query.where('partner', '==', partner);
      }
      if (category) {
        query = query.where('category', '==', category);
      }
      if (product) {
        query = query.where('product', '==', product);
      }
      
      const snapshot = await query.orderBy('date', 'desc').get();
      const records = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      
      res.json(records);
    } catch (error) {
      console.error('매출 통계 조회 오류:', error);
      res.status(500).json({ error: error.message });
    }
  });
});

// 수익성 분석 (HTTP Request) - /profit-analysis
exports.profitAnalysis = functions.https.onRequest(async (req, res) => {
  return corsHandler(req, res, async () => {
    try {
      const snapshot = await db.collection('profit-analysis').get();
      const analysis = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      
      res.json(analysis);
    } catch (error) {
      console.error('수익성 분석 조회 오류:', error);
      res.status(500).json({ error: error.message });
    }
  });
});

// 예산 관리 (HTTP Request) - /budgets
exports.budgets = functions.https.onRequest(async (req, res) => {
  return corsHandler(req, res, async () => {
    try {
      const { year } = req.query;
      
      let query = db.collection('budgets');
      if (year) {
        query = query.where('year', '==', parseInt(year));
      }
      
      const snapshot = await query.get();
      const budgets = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      
      res.json(budgets);
    } catch (error) {
      console.error('예산 조회 오류:', error);
      res.status(500).json({ error: error.message });
    }
  });
});

// 세금계산서 (HTTP Request) - /tax-invoices
exports.taxInvoices = functions.https.onRequest(async (req, res) => {
  return corsHandler(req, res, async () => {
    try {
      const snapshot = await db.collection('tax-invoices').orderBy('date', 'desc').get();
      const invoices = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      
      res.json(invoices);
    } catch (error) {
      console.error('세금계산서 조회 오류:', error);
      res.status(500).json({ error: error.message });
    }
  });
});

// ===== 과거자료 관리 =====

// 과거자료 목록 조회 (HTTP Request) - /historical-data/list
exports.historicalDataList = functions.https.onRequest(async (req, res) => {
  // CORS 헤더를 명시적으로 설정
  res.set('Access-Control-Allow-Origin', '*');
  res.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.set('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With, Origin, Accept');
  res.set('Access-Control-Max-Age', '86400'); // 24시간 캐시
  
  // OPTIONS 요청 처리
  if (req.method === 'OPTIONS') {
    res.status(200).send();
    return;
  }
  
  try {
    const { type, year } = req.query;
    
    if (!type || !year) {
      return res.status(400).json({ error: 'type과 year 파라미터가 필요합니다.' });
    }

    // Firestore에서 과거자료 조회
    const snapshot = await db.collection('historical-data')
      .where('type', '==', type)
      .where('year', '==', parseInt(year))
      .orderBy('uploadDate', 'desc')
      .get();

    const records = [];
    snapshot.forEach(doc => {
      records.push({
        id: doc.id,
        ...doc.data()
      });
    });

    res.json(records);
  } catch (error) {
    console.error('과거자료 목록 조회 오류:', error);
    res.status(500).json({ error: error.message });
  }
});

// 과거자료 업로드 (HTTP Request) - /historical-data/upload
exports.historicalDataUpload = functions.https.onRequest(async (req, res) => {
  return corsHandler(req, res, async () => {
    if (req.method !== 'POST') return res.status(405).send('Method Not Allowed');
    
    try {
      // multer를 사용한 파일 업로드 처리
      upload.single('file')(req, res, async (err) => {
        if (err) {
          console.error('파일 업로드 오류:', err);
          return res.status(400).json({ error: err.message });
        }

        const { type, year, sheetName } = req.body;
        
        if (!type || !year) {
          return res.status(400).json({ error: 'type과 year가 필요합니다.' });
        }

        if (!req.file) {
          return res.status(400).json({ error: '파일이 필요합니다.' });
        }

        // Firebase Storage에 파일 업로드
        const bucket = admin.storage().bucket();
        const fileName = `historical-data/${type}/${year}/${uuidv4()}_${req.file.originalname}`;
        const file = bucket.file(fileName);
        
        await file.save(req.file.buffer, {
          metadata: {
            contentType: req.file.mimetype,
          },
        });

        // Firestore에 메타데이터 저장
        const recordData = {
          type,
          year: parseInt(year),
          filename: fileName,
          originalName: req.file.originalname,
          sheetName: sheetName || 'Sheet1',
          uploadDate: admin.firestore.FieldValue.serverTimestamp(),
          fileSize: req.file.size,
          mimeType: req.file.mimetype
        };

        const docRef = await db.collection('historical-data').add(recordData);
        
        res.json({ 
          message: '과거자료가 업로드되었습니다.',
          id: docRef.id,
          fileName: fileName
        });
      });
    } catch (error) {
      console.error('과거자료 업로드 오류:', error);
      res.status(500).json({ error: error.message });
    }
  });
});

// 과거자료 검색 (HTTP Request) - /historical-data/search
exports.historicalDataSearch = functions.https.onRequest(async (req, res) => {
  // CORS 헤더를 명시적으로 설정
  res.set('Access-Control-Allow-Origin', '*');
  res.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.set('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With, Origin, Accept');
  res.set('Access-Control-Max-Age', '86400'); // 24시간 캐시
  
  // OPTIONS 요청 처리
  if (req.method === 'OPTIONS') {
    res.status(200).send();
    return;
  }
  
  try {
    const { type, year, keyword } = req.query;
    
    if (!type || !year || !keyword) {
      return res.status(400).json({ error: 'type, year, keyword 파라미터가 필요합니다.' });
    }

    // Firestore에서 검색 (실제로는 더 정교한 검색 로직 필요)
    const snapshot = await db.collection('historical-data')
      .where('type', '==', type)
      .where('year', '==', parseInt(year))
      .get();

    const results = [];
    snapshot.forEach(doc => {
      const data = doc.data();
      if (data.filename.toLowerCase().includes(keyword.toLowerCase()) ||
          data.originalName.toLowerCase().includes(keyword.toLowerCase())) {
        results.push({
          id: doc.id,
          ...data
        });
      }
    });

    res.json({ results });
  } catch (error) {
    console.error('과거자료 검색 오류:', error);
    res.status(500).json({ error: error.message });
  }
});

// 과거자료 전체 검색 (HTTP Request) - /historical-data/global-search
exports.historicalDataGlobalSearch = functions.https.onRequest(async (req, res) => {
  // CORS 헤더를 명시적으로 설정
  res.set('Access-Control-Allow-Origin', '*');
  res.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.set('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With, Origin, Accept');
  res.set('Access-Control-Max-Age', '86400'); // 24시간 캐시
  
  // OPTIONS 요청 처리
  if (req.method === 'OPTIONS') {
    res.status(200).send();
    return;
  }
  
  try {
    const { keyword } = req.query;
    
    if (!keyword) {
      return res.status(400).json({ error: 'keyword 파라미터가 필요합니다.' });
    }

    // Firestore에서 전체 검색
    const snapshot = await db.collection('historical-data').get();

    const results = [];
    snapshot.forEach(doc => {
      const data = doc.data();
      if (data.filename.toLowerCase().includes(keyword.toLowerCase()) ||
          data.originalName.toLowerCase().includes(keyword.toLowerCase())) {
        results.push({
          id: doc.id,
          ...data
        });
      }
    });

    res.json({ results });
  } catch (error) {
    console.error('과거자료 전체 검색 오류:', error);
    res.status(500).json({ error: error.message });
  }
});

// 과거자료 미리보기 (HTTP Request) - /historical-data/:id/preview
exports.historicalDataPreview = functions.https.onRequest(async (req, res) => {
  // CORS 헤더를 명시적으로 설정
  res.set('Access-Control-Allow-Origin', '*');
  res.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.set('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With, Origin, Accept');
  res.set('Access-Control-Max-Age', '86400'); // 24시간 캐시
  
  // OPTIONS 요청 처리
  if (req.method === 'OPTIONS') {
    res.status(200).send();
    return;
  }
  
  try {
    const recordId = req.params.id;
    
    const doc = await db.collection('historical-data').doc(recordId).get();
    if (!doc.exists) {
      return res.status(404).json({ error: '과거자료를 찾을 수 없습니다.' });
    }

    const data = doc.data();
    // 실제로는 파일에서 데이터를 읽어와야 함
    res.json({
      id: doc.id,
      ...data,
      previewData: [['미리보기 데이터 예시']] // 실제 데이터로 교체 필요
    });
  } catch (error) {
    console.error('과거자료 미리보기 오류:', error);
    res.status(500).json({ error: error.message });
  }
});

// 과거자료 삭제 (HTTP Request) - /historical-data/:id
exports.historicalDataDelete = functions.https.onRequest(async (req, res) => {
  // CORS 헤더를 명시적으로 설정
  res.set('Access-Control-Allow-Origin', '*');
  res.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.set('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With, Origin, Accept');
  res.set('Access-Control-Max-Age', '86400'); // 24시간 캐시
  
  // OPTIONS 요청 처리
  if (req.method === 'OPTIONS') {
    res.status(200).send();
    return;
  }
  
  if (req.method !== 'DELETE') return res.status(405).send('Method Not Allowed');
  
  try {
    const recordId = req.params.id;
    await db.collection('historical-data').doc(recordId).delete();
    
    res.json({ message: '과거자료가 삭제되었습니다.' });
  } catch (error) {
    console.error('과거자료 삭제 오류:', error);
    res.status(500).json({ error: error.message });
  }
});

// ===== 테스트용 HTTP 함수 =====

// HTTP 테스트 함수
exports.httpTest = functions.https.onRequest(async (req, res) => {
  return corsHandler(req, res, async () => {
    res.json({ 
      message: 'Firebase Functions가 정상적으로 작동합니다!',
      timestamp: new Date().toISOString(),
      method: req.method,
      headers: req.headers
    });
  });
}); 