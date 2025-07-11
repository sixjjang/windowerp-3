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
  res.set('Access-Control-Allow-Origin', '*');
  res.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.set('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With, Origin, Accept');
  res.set('Access-Control-Max-Age', '86400');
  if (req.method === 'OPTIONS') { res.status(200).send(); return; }
  try {
    const snapshot = await db.collection('company-info').get();
    const companies = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    res.json({ companies }); // 항상 배열로 반환
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 회사 정보 저장 (HTTP Request) - /saveCompanyInfo
exports.saveCompanyInfo = functions.https.onRequest(async (req, res) => {
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
  
  if (req.method !== 'POST') return res.status(405).send('Method Not Allowed');
  
  try {
    const companiesData = req.body;
    
    // 배열이 아닌 경우 배열로 변환
    const companiesArray = Array.isArray(companiesData) ? companiesData : [companiesData];
    
    if (companiesArray.length === 0) {
      return res.status(400).json({ error: '회사 정보가 필요합니다.' });
    }
    
    // 기존 회사 정보 삭제
    const existingSnapshot = await db.collection('company-info').get();
    const deletePromises = existingSnapshot.docs.map(doc => doc.ref.delete());
    await Promise.all(deletePromises);
    
    // 새로운 회사 정보 저장
    const savePromises = companiesArray.map(async (companyData) => {
      // undefined 값과 Firestore에서 지원하지 않는 필드 제거
      const cleanData = Object.fromEntries(
        Object.entries(companyData).filter(([key, value]) => 
          value !== undefined && 
          value !== null && 
          key !== 'createdAt' && 
          key !== 'updatedAt'
        )
      );
      
      const dataToSave = {
        ...cleanData,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      };
      
      const docRef = await db.collection('company-info').add(dataToSave);
      return { id: docRef.id, ...dataToSave };
    });
    
    const savedCompanies = await Promise.all(savePromises);
    
    res.json({ 
      message: '회사 정보가 저장되었습니다.',
      count: savedCompanies.length,
      companies: savedCompanies
    });
    } catch (error) {
    console.error('회사 정보 저장 오류:', error);
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

// 스케줄 관리 (HTTP Request) - /schedules
exports.schedules = functions.https.onRequest(async (req, res) => {
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
    // GET: 스케줄 목록 조회
    if (req.method === 'GET') {
      const { date, userId } = req.query;
      
      let query = db.collection('schedules');
      
      if (date) {
        query = query.where('date', '==', date);
      }
      if (userId) {
        query = query.where('userId', '==', userId);
      }
      
      const snapshot = await query.get();
      const schedules = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      
      // 클라이언트 사이드에서 정렬
      schedules.sort((a, b) => {
        const timeA = a.time || '00:00';
        const timeB = b.time || '00:00';
        return timeA.localeCompare(timeB);
      });
      
      res.json(schedules);
    }
    // POST: 새 스케줄 생성 (중복 방지 포함)
    else if (req.method === 'POST') {
      const scheduleData = req.body;
      
      // 중복 스케줄 확인 (같은 id가 있는지)
      if (scheduleData.id) {
        const existingSchedule = await db.collection('schedules')
          .where('id', '==', scheduleData.id)
          .limit(1)
          .get();
        
        if (!existingSchedule.empty) {
          // 기존 스케줄이 있으면 업데이트
          const existingDoc = existingSchedule.docs[0];
          scheduleData.updatedAt = admin.firestore.FieldValue.serverTimestamp();
          
          await db.collection('schedules').doc(existingDoc.id).update(scheduleData);
          
          console.log(`스케줄 업데이트: ${scheduleData.id} (기존 문서 ID: ${existingDoc.id})`);
          
          res.json({ 
            message: '기존 스케줄이 업데이트되었습니다.',
            id: existingDoc.id,
            updated: true
          });
          return;
        }
      }
      
      // 새 스케줄 생성
      scheduleData.createdAt = admin.firestore.FieldValue.serverTimestamp();
      scheduleData.updatedAt = admin.firestore.FieldValue.serverTimestamp();
      
      const docRef = await db.collection('schedules').add(scheduleData);
      
      console.log(`새 스케줄 생성: ${scheduleData.id} (문서 ID: ${docRef.id})`);
      
      res.json({ 
        message: '새로운 스케줄이 생성되었습니다.',
        id: docRef.id,
        created: true
      });
    }
    // PUT: 스케줄 수정
    else if (req.method === 'PUT') {
      const scheduleId = req.params.id;
      const scheduleData = req.body;
      scheduleData.updatedAt = admin.firestore.FieldValue.serverTimestamp();
      
      await db.collection('schedules').doc(scheduleId).update(scheduleData);
      
      res.json({ 
        message: '스케줄이 수정되었습니다.',
        id: scheduleId 
      });
    }
    // DELETE: 스케줄 삭제
    else if (req.method === 'DELETE') {
      const scheduleId = req.params.id;
      
      await db.collection('schedules').doc(scheduleId).delete();
      
    res.json({
        message: '스케줄이 삭제되었습니다.',
        id: scheduleId 
      });
    }
    else {
      res.status(405).send('Method Not Allowed');
    }
  } catch (error) {
    console.error('스케줄 처리 오류:', error);
    res.status(500).json({ error: error.message });
  }
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



// 예산 관리 (HTTP Request) - /budgets
exports.budgets = functions.https.onRequest(async (req, res) => {
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

// ===== 세금계산서 관리 =====

// 세금계산서 목록 조회 (HTTP Request) - /tax-invoices
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

// 세금계산서 저장 (HTTP Request) - /saveTaxInvoice
exports.saveTaxInvoice = functions.https.onRequest(async (req, res) => {
  return corsHandler(req, res, async () => {
    if (req.method !== 'POST') return res.status(405).send('Method Not Allowed');
    
    try {
      const invoiceData = req.body;
      invoiceData.createdAt = admin.firestore.FieldValue.serverTimestamp();
      invoiceData.updatedAt = admin.firestore.FieldValue.serverTimestamp();
      
      const docRef = await db.collection('tax-invoices').add(invoiceData);
      
      res.json({ 
        message: '세금계산서가 저장되었습니다.',
        id: docRef.id 
      });
    } catch (error) {
      console.error('세금계산서 저장 오류:', error);
      res.status(500).json({ error: error.message });
    }
  });
});

// 세금계산서 수정 (HTTP Request) - /updateTaxInvoice/:id
exports.updateTaxInvoice = functions.https.onRequest(async (req, res) => {
  return corsHandler(req, res, async () => {
    if (req.method !== 'PUT') return res.status(405).send('Method Not Allowed');
    
    try {
      const invoiceId = req.params.id;
      const updateData = req.body;
      updateData.updatedAt = admin.firestore.FieldValue.serverTimestamp();
      
      await db.collection('tax-invoices').doc(invoiceId).update(updateData);
      
      res.json({ message: '세금계산서가 수정되었습니다.' });
    } catch (error) {
      console.error('세금계산서 수정 오류:', error);
      res.status(500).json({ error: error.message });
    }
  });
});

// 세금계산서 상태 업데이트 (HTTP Request) - /tax-invoices/:id/status
exports.updateTaxInvoiceStatus = functions.https.onRequest(async (req, res) => {
  return corsHandler(req, res, async () => {
    if (req.method !== 'PUT') return res.status(405).send('Method Not Allowed');
    
    try {
      const invoiceId = req.params.id;
      const { status } = req.body;
      
      if (!status) {
        return res.status(400).json({ error: '상태 값이 필요합니다.' });
      }
      
      await db.collection('tax-invoices').doc(invoiceId).update({
        status,
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      });
      
      res.json({ message: '세금계산서 상태가 업데이트되었습니다.' });
    } catch (error) {
      console.error('세금계산서 상태 업데이트 오류:', error);
      res.status(500).json({ error: error.message });
    }
  });
});

// 세금계산서 삭제 (HTTP Request) - /tax-invoices/:id
exports.deleteTaxInvoice = functions.https.onRequest(async (req, res) => {
  return corsHandler(req, res, async () => {
    if (req.method !== 'DELETE') return res.status(405).send('Method Not Allowed');
    
    try {
      const invoiceId = req.params.id;
      
      await db.collection('tax-invoices').doc(invoiceId).delete();
      
      res.json({ message: '세금계산서가 삭제되었습니다.' });
  } catch (error) {
      console.error('세금계산서 삭제 오류:', error);
      res.status(500).json({ error: error.message });
  }
  });
});

// ===== 매출 관리 =====

// 매출 기록 목록 조회 (HTTP Request) - /sales-records
exports.salesRecords = functions.https.onRequest(async (req, res) => {
  return corsHandler(req, res, async () => {
    try {
      const { month, partner, category, product } = req.query;
      
      let query = db.collection('sales-records');
      
      if (month) {
        // 월별 필터링 (예: 2024-06)
        const startDate = `${month}-01`;
        const endDate = `${month}-31`;
        query = query.where('date', '>=', startDate)
                    .where('date', '<=', endDate);
      }
      if (partner) {
        query = query.where('partner', '==', partner);
      }
      if (category) {
        query = query.where('category', '==', category);
      }
      if (product) {
        query = query.where('productName', '==', product);
      }
      
      const snapshot = await query.orderBy('date', 'desc').get();
      const records = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      
      res.json(records);
    } catch (error) {
      console.error('매출 기록 조회 오류:', error);
      res.status(500).json({ error: error.message });
    }
  });
});

// 매출 기록 저장 (HTTP Request) - /sales-records
exports.saveSalesRecord = functions.https.onRequest(async (req, res) => {
  return corsHandler(req, res, async () => {
    if (req.method !== 'POST') return res.status(405).send('Method Not Allowed');
    
    try {
      const recordData = req.body;
      recordData.createdAt = admin.firestore.FieldValue.serverTimestamp();
      recordData.updatedAt = admin.firestore.FieldValue.serverTimestamp();
      
      const docRef = await db.collection('sales-records').add(recordData);
      
      res.json({ 
        message: '매출 기록이 저장되었습니다.',
        id: docRef.id 
      });
    } catch (error) {
      console.error('매출 기록 저장 오류:', error);
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
      
    let query = db.collection('historical-data');
    
    if (type) {
      query = query.where('type', '==', type);
    }
    if (year) {
      query = query.where('year', '==', parseInt(year));
    }
    
    // orderBy를 제거하고 기본 정렬 사용
    const snapshot = await query.get();
    const records = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
    }));
    
    // 클라이언트 사이드에서 정렬
    records.sort((a, b) => {
      const dateA = a.uploadDate ? new Date(a.uploadDate.seconds * 1000) : new Date(0);
      const dateB = b.uploadDate ? new Date(b.uploadDate.seconds * 1000) : new Date(0);
      return dateB.getTime() - dateA.getTime();
      });

      res.json(records);
    } catch (error) {
    console.error('Historical Data 목록 조회 오류:', error);
      res.status(500).json({ error: error.message });
  }
});

// 과거자료 업로드 (HTTP Request) - /historical-data/upload
exports.historicalDataUpload = functions.https.onRequest(async (req, res) => {
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
  
  if (req.method !== 'POST') return res.status(405).send('Method Not Allowed');
  
  try {
    console.log('과거자료 업로드 요청 시작');
    console.log('요청 바디:', req.body);
    console.log('요청 파일:', req.file);
    
    // multer를 사용한 파일 업로드 처리
    upload.single('file')(req, res, async (err) => {
      if (err) {
        console.error('파일 업로드 오류:', err);
        return res.status(400).json({ error: err.message });
      }

      const { type, year, sheetName } = req.body;
      console.log('파싱된 데이터:', { type, year, sheetName });
      
      if (!type || !year) {
        console.error('필수 파라미터 누락:', { type, year });
        return res.status(400).json({ error: 'type과 year가 필요합니다.' });
      }

      if (!req.file) {
        console.error('파일이 없습니다.');
        return res.status(400).json({ error: '파일이 필요합니다.' });
      }

              // Firebase Storage에 파일 업로드
        const bucket = admin.storage().bucket();
        const fileName = `historical-data/${type}/${year}/${uuidv4()}_${req.file.originalname}`;
        const file = bucket.file(fileName);

        console.log('Firebase Storage 업로드 시작:', fileName);
        
        await file.save(req.file.buffer, {
          metadata: {
            contentType: req.file.mimetype,
          },
        });

        console.log('Firebase Storage 업로드 완료');

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

        console.log('Firestore 저장 데이터:', recordData);

        const docRef = await db.collection('historical-data').add(recordData);
        
        console.log('Firestore 저장 완료:', docRef.id);
        
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

// ===== 사용자 관리 =====

// 사용자 목록 조회 (HTTP Request) - /users
exports.users = functions.https.onRequest(async (req, res) => {
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
    const snapshot = await db.collection('users').get();
    const users = snapshot.docs.map(doc => {
      const userData = doc.data();
      delete userData.password; // 비밀번호 제외
      return {
        id: doc.id,
        ...userData
      };
    });
    
    res.json(users);
  } catch (error) {
    console.error('사용자 목록 조회 오류:', error);
    res.status(500).json({ error: error.message });
  }
});

// 사용자 등록 (HTTP Request) - /register-staff
exports.registerUser = functions.https.onRequest(async (req, res) => {
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
  
  if (req.method !== 'POST') return res.status(405).send('Method Not Allowed');
  
  try {
    const { username, password, name, email, phone, address, accountNumber, role } = req.body;
    
    if (!username || !password || !name) {
      return res.status(400).json({ error: '사용자명, 비밀번호, 이름이 필요합니다.' });
    }

    // 중복 사용자명 체크
    const existingUser = await db.collection('users')
      .where('username', '==', username)
      .limit(1)
      .get();
    
    if (!existingUser.empty) {
      return res.status(409).json({ error: '이미 존재하는 사용자명입니다.' });
    }

    // 비밀번호 해시화
    const hashedPassword = await bcrypt.hash(password, 10);

    const userData = {
      username,
      password: hashedPassword,
      name,
      email: email || '',
      phone: phone || '',
      address: address || '',
      accountNumber: accountNumber || '',
      role: role || 'user',
      isApproved: true,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    };

    const docRef = await db.collection('users').add(userData);
    
    res.json({ 
      message: '사용자가 등록되었습니다.',
      id: docRef.id 
    });
  } catch (error) {
    console.error('사용자 등록 오류:', error);
    res.status(500).json({ error: error.message });
  }
});

// 사용자 승인 (HTTP Request) - /users/:id/approve
exports.approveUser = functions.https.onRequest(async (req, res) => {
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

// 사용자 역할 변경 (HTTP Request) - /users/:id/role
exports.updateUserRole = functions.https.onRequest(async (req, res) => {
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
  
  if (req.method !== 'PUT') return res.status(405).send('Method Not Allowed');
  
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

// 사용자 삭제 (HTTP Request) - /users/:id
exports.deleteUser = functions.https.onRequest(async (req, res) => {
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
    const userId = req.params.id;
    await db.collection('users').doc(userId).delete();
    
    res.json({ message: '사용자가 삭제되었습니다.' });
  } catch (error) {
    console.error('사용자 삭제 오류:', error);
    res.status(500).json({ error: error.message });
  }
});

// ===== 고정비 관리 =====

// 고정비 목록 조회 (HTTP Request) - /fixedExpenses
exports.fixedExpenses = functions.https.onRequest(async (req, res) => {
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
    const { month } = req.query;
    
    let query = db.collection('fixed-expenses');
    if (month) {
      query = query.where('month', '==', month);
    }
    
    // orderBy 제거하고 기본 정렬 사용
    const snapshot = await query.get();
    const expenses = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    
    // 클라이언트 사이드에서 정렬
    expenses.sort((a, b) => {
      const dateA = a.createdAt ? new Date(a.createdAt.seconds * 1000) : new Date(0);
      const dateB = b.createdAt ? new Date(b.createdAt.seconds * 1000) : new Date(0);
      return dateB.getTime() - dateA.getTime();
    });
    
    res.json(expenses);
  } catch (error) {
    console.error('고정비 조회 오류:', error);
    res.status(500).json({ error: error.message });
  }
});

// 고정비 저장 (HTTP Request) - /fixed-expenses
exports.saveFixedExpense = functions.https.onRequest(async (req, res) => {
  return corsHandler(req, res, async () => {
    if (req.method !== 'POST') return res.status(405).send('Method Not Allowed');
    
    try {
      const expenseData = req.body;
      expenseData.createdAt = admin.firestore.FieldValue.serverTimestamp();
      expenseData.updatedAt = admin.firestore.FieldValue.serverTimestamp();
      
      const docRef = await db.collection('fixed-expenses').add(expenseData);
      
      res.json({ 
        message: '고정비가 저장되었습니다.',
        id: docRef.id 
      });
    } catch (error) {
      console.error('고정비 저장 오류:', error);
      res.status(500).json({ error: error.message });
    }
  });
});

// 고정비 수정 (HTTP Request) - /fixed-expenses/:id
exports.updateFixedExpense = functions.https.onRequest(async (req, res) => {
  return corsHandler(req, res, async () => {
    if (req.method !== 'PUT') return res.status(405).send('Method Not Allowed');
    
    try {
      const expenseId = req.params.id;
      const updateData = {
        ...req.body,
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
      };
      
      await db.collection('fixed-expenses').doc(expenseId).update(updateData);
      
      res.json({ message: '고정비가 수정되었습니다.' });
    } catch (error) {
      console.error('고정비 수정 오류:', error);
      res.status(500).json({ error: error.message });
    }
  });
});

// 고정비 삭제 (HTTP Request) - /deleteFixedExpense/:id
exports.deleteFixedExpense = functions.https.onRequest(async (req, res) => {
  res.set('Access-Control-Allow-Origin', '*');
  res.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.set('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With, Origin, Accept');
  res.set('Access-Control-Max-Age', '86400');
  if (req.method === 'OPTIONS') { res.status(200).send(); return; }
  if (req.method !== 'DELETE') return res.status(405).send('Method Not Allowed');

  // id를 쿼리스트링 또는 경로에서 추출
  const id = req.query.id || (req.url.split('/').pop() || '').split('?')[0];
  if (!id) return res.status(400).json({ error: 'id 파라미터 필요' });

  try {
    await db.collection('fixed-expenses').doc(id).delete();
    res.json({ message: '고정비가 삭제되었습니다.' });
  } catch (error) {
    console.error('고정비 삭제 오류:', error);
    res.status(500).json({ error: error.message });
  }
});

// ===== 템플릿 관리 =====

// 템플릿 목록 조회 (HTTP Request) - /templates
exports.templates = functions.https.onRequest(async (req, res) => {
  return corsHandler(req, res, async () => {
    try {
      const snapshot = await db.collection('templates').orderBy('createdAt', 'desc').get();
      const templates = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      
      res.json(templates);
    } catch (error) {
      console.error('템플릿 조회 오류:', error);
      res.status(500).json({ error: error.message });
    }
  });
});

// 템플릿 저장 (HTTP Request) - /templates
exports.saveTemplates = functions.https.onRequest(async (req, res) => {
  return corsHandler(req, res, async () => {
    if (req.method !== 'POST') return res.status(405).send('Method Not Allowed');
    
    try {
      const templatesData = req.body;
      
      if (Array.isArray(templatesData)) {
        // 여러 템플릿 처리
        const batch = db.batch();
        templatesData.forEach((template, index) => {
          const docRef = db.collection('templates').doc(template.id || `template_${index}`);
          batch.set(docRef, {
            ...template,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
            updatedAt: admin.firestore.FieldValue.serverTimestamp()
      });
    });
        await batch.commit();
      } else {
        // 단일 템플릿 처리
        const docRef = await db.collection('templates').add({
          ...templatesData,
          createdAt: admin.firestore.FieldValue.serverTimestamp(),
          updatedAt: admin.firestore.FieldValue.serverTimestamp()
        });
      }
      
      res.json({ message: '템플릿이 저장되었습니다.' });
    } catch (error) {
      console.error('템플릿 저장 오류:', error);
      res.status(500).json({ error: error.message });
    }
  });
});

// ===== 배송 관리 =====

// 배송 목록 조회 (HTTP Request) - /deliveries
exports.deliveries = functions.https.onRequest(async (req, res) => {
  return corsHandler(req, res, async () => {
    try {
      const { status, customerName, contractNo } = req.query;
      
      let query = db.collection('deliveries');
      
      if (status) {
        query = query.where('status', '==', status);
      }
      if (customerName) {
        query = query.where('customerName', '>=', customerName)
                    .where('customerName', '<=', customerName + '\uf8ff');
      }
      if (contractNo) {
        query = query.where('contractNo', '==', contractNo);
      }
      
      const snapshot = await query.orderBy('deliveryDate', 'desc').get();
      const deliveries = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      
      res.json(deliveries);
    } catch (error) {
      console.error('배송 조회 오류:', error);
      res.status(500).json({ error: error.message });
    }
  });
});

// 배송 저장 (HTTP Request) - /deliveries
exports.saveDelivery = functions.https.onRequest(async (req, res) => {
  return corsHandler(req, res, async () => {
    if (req.method !== 'POST') return res.status(405).send('Method Not Allowed');
    
    try {
      const deliveryData = req.body;
      deliveryData.createdAt = admin.firestore.FieldValue.serverTimestamp();
      deliveryData.updatedAt = admin.firestore.FieldValue.serverTimestamp();
      
      const docRef = await db.collection('deliveries').add(deliveryData);
      
      res.json({ 
        message: '배송이 저장되었습니다.',
        id: docRef.id 
      });
    } catch (error) {
      console.error('배송 저장 오류:', error);
      res.status(500).json({ error: error.message });
    }
  });
});

// ===== 자동 연동 API =====

// 견적에서 계약으로 자동 연동 (HTTP Request) - /auto-sync/estimate-to-contract
exports.autoSyncEstimateToContract = functions.https.onRequest(async (req, res) => {
  return corsHandler(req, res, async () => {
    if (req.method !== 'POST') return res.status(405).send('Method Not Allowed');
    
    try {
      const { estimateNo } = req.body;
      
      // 견적서 조회
      const estimateSnapshot = await db.collection('estimates')
        .where('estimateNo', '==', estimateNo)
        .limit(1)
      .get();
    
      if (estimateSnapshot.empty) {
        return res.status(404).json({ error: '견적서를 찾을 수 없습니다.' });
      }

      const estimateData = estimateSnapshot.docs[0].data();
      
      // 계약서 생성
      const contractData = {
        contractNo: `CT-${Date.now()}`,
        estimateNo: estimateNo,
        customerName: estimateData.customerName,
        projectName: estimateData.projectName,
        totalAmount: estimateData.totalAmount,
        depositAmount: 0,
        balanceAmount: estimateData.totalAmount,
        contractDate: new Date().toISOString().split('T')[0],
        status: 'draft',
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      };

      const docRef = await db.collection('contracts').add(contractData);
      
      res.json({ 
        message: '견적서가 계약서로 자동 연동되었습니다.',
        contractId: docRef.id 
      });
    } catch (error) {
      console.error('견적-계약 자동 연동 오류:', error);
      res.status(500).json({ error: error.message });
    }
  });
});

// 계약에서 배송으로 자동 연동 (HTTP Request) - /auto-sync/contract-to-delivery
exports.autoSyncContractToDelivery = functions.https.onRequest(async (req, res) => {
  return corsHandler(req, res, async () => {
    if (req.method !== 'POST') return res.status(405).send('Method Not Allowed');
    
    try {
      const { contractNo } = req.body;
      
      // 계약서 조회
      const contractSnapshot = await db.collection('contracts')
        .where('contractNo', '==', contractNo)
        .limit(1)
        .get();

      if (contractSnapshot.empty) {
        return res.status(404).json({ error: '계약서를 찾을 수 없습니다.' });
      }

      const contractData = contractSnapshot.docs[0].data();
      
      // 배송서 생성
      const deliveryData = {
        deliveryNo: `DL-${Date.now()}`,
        contractNo: contractNo,
        estimateNo: contractData.estimateNo,
        customerName: contractData.customerName,
        projectName: contractData.projectName,
        totalAmount: contractData.totalAmount,
        deliveryDate: new Date().toISOString().split('T')[0],
        status: 'pending',
        paymentStatus: 'pending',
          createdAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      };

      const docRef = await db.collection('deliveries').add(deliveryData);
      
      res.json({ 
        message: '계약서가 배송서로 자동 연동되었습니다.',
        deliveryId: docRef.id 
      });
    } catch (error) {
      console.error('계약-배송 자동 연동 오류:', error);
      res.status(500).json({ error: error.message });
      }
    });
  }); 

// 배송에서 매출로 자동 연동 (HTTP Request) - /auto-sync/delivery-to-sales
exports.autoSyncDeliveryToSales = functions.https.onRequest(async (req, res) => {
  return corsHandler(req, res, async () => {
    if (req.method !== 'POST') return res.status(405).send('Method Not Allowed');
    
    try {
      const { deliveryNo } = req.body;
      
      // 배송서 조회
      const deliverySnapshot = await db.collection('deliveries')
        .where('deliveryNo', '==', deliveryNo)
        .limit(1)
        .get();

      if (deliverySnapshot.empty) {
        return res.status(404).json({ error: '배송서를 찾을 수 없습니다.' });
      }

      const deliveryData = deliverySnapshot.docs[0].data();
      
      // 매출 기록 생성
      const salesData = {
        productName: '커튼 설치',
        productCode: 'CURTAIN-001',
        partner: deliveryData.customerName,
        category: '설치',
        quantity: 1,
        amount: deliveryData.totalAmount,
        date: new Date().toISOString().split('T')[0],
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      };

      const docRef = await db.collection('sales-records').add(salesData);
      
      res.json({ 
        message: '배송서가 매출로 자동 연동되었습니다.',
        salesId: docRef.id 
      });
    } catch (error) {
      console.error('배송-매출 자동 연동 오류:', error);
      res.status(500).json({ error: error.message });
    }
  });
}); 

// ===== 공식 관리 =====

// 공식 목록 조회 (HTTP Request) - /formulas
exports.formulas = functions.https.onRequest(async (req, res) => {
  return corsHandler(req, res, async () => {
    try {
      const snapshot = await db.collection('formulas').orderBy('createdAt', 'desc').get();
      const formulas = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
      }));
      
      res.json(formulas);
    } catch (error) {
      console.error('공식 조회 오류:', error);
      res.status(500).json({ error: error.message });
    }
        });
      });

// 공식 저장 (HTTP Request) - /formulas
exports.saveFormula = functions.https.onRequest(async (req, res) => {
  return corsHandler(req, res, async () => {
    if (req.method !== 'POST') return res.status(405).send('Method Not Allowed');
    
    try {
      const formulaData = req.body;
      formulaData.createdAt = admin.firestore.FieldValue.serverTimestamp();
      formulaData.updatedAt = admin.firestore.FieldValue.serverTimestamp();
      
      const docRef = await db.collection('formulas').add(formulaData);
      
      res.json({ 
        message: '공식이 저장되었습니다.',
        id: docRef.id 
      });
    } catch (error) {
      console.error('공식 저장 오류:', error);
      res.status(500).json({ error: error.message });
    }
  });
});

// ===== 주문 관리 =====

// 주문 목록 조회 (HTTP Request) - /orders
exports.orders = functions.https.onRequest(async (req, res) => {
  return corsHandler(req, res, async () => {
    try {
      const snapshot = await db.collection('orders').orderBy('createdAt', 'desc').get();
      const orders = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      
      res.json(orders);
    } catch (error) {
      console.error('주문 조회 오류:', error);
      res.status(500).json({ error: error.message });
    }
  });
});

// 주문 저장 (HTTP Request) - /orders
exports.saveOrder = functions.https.onRequest(async (req, res) => {
  return corsHandler(req, res, async () => {
    if (req.method !== 'POST') return res.status(405).send('Method Not Allowed');
    
    try {
      const orderData = req.body;
      orderData.createdAt = admin.firestore.FieldValue.serverTimestamp();
      orderData.updatedAt = admin.firestore.FieldValue.serverTimestamp();
      
      const docRef = await db.collection('orders').add(orderData);
      
      res.json({ 
        message: '주문이 저장되었습니다.',
        id: docRef.id 
      });
    } catch (error) {
      console.error('주문 저장 오류:', error);
      res.status(500).json({ error: error.message });
    }
  });
});

// ===== 공급업체 관리 =====

// 공급업체 목록 조회 (HTTP Request) - /vendors
exports.vendors = functions.https.onRequest(async (req, res) => {
  return corsHandler(req, res, async () => {
    try {
      const snapshot = await db.collection('vendors').orderBy('createdAt', 'desc').get();
      const vendors = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      
      res.json(vendors);
    } catch (error) {
      console.error('공급업체 조회 오류:', error);
      res.status(500).json({ error: error.message });
    }
  });
});

// 공급업체 저장 (HTTP Request) - /vendors
exports.saveVendor = functions.https.onRequest(async (req, res) => {
  return corsHandler(req, res, async () => {
    if (req.method !== 'POST') return res.status(405).send('Method Not Allowed');
    
    try {
      const vendorData = req.body;
      vendorData.createdAt = admin.firestore.FieldValue.serverTimestamp();
      vendorData.updatedAt = admin.firestore.FieldValue.serverTimestamp();
      
      const docRef = await db.collection('vendors').add(vendorData);
      
      res.json({ 
        message: '공급업체가 저장되었습니다.',
        id: docRef.id 
      });
    } catch (error) {
      console.error('공급업체 저장 오류:', error);
      res.status(500).json({ error: error.message });
    }
  });
}); 

// ===== Historical Data 관리 =====

// Historical Data 업데이트 (HTTP Request) - /historicalDataUpdate/:id
exports.historicalDataUpdate = functions.https.onRequest(async (req, res) => {
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
  
  if (req.method !== 'PUT') return res.status(405).send('Method Not Allowed');
  
  try {
    const recordId = req.params.id;
    const updateData = req.body;
    updateData.updatedAt = admin.firestore.FieldValue.serverTimestamp();
    
    await db.collection('historical-data').doc(recordId).update(updateData);
    
    res.json({ message: 'Historical Data가 업데이트되었습니다.' });
  } catch (error) {
    console.error('Historical Data 업데이트 오류:', error);
    res.status(500).json({ error: error.message });
  }
});



// ===== 수익성 분석 =====

// 수익성 분석 목록 조회 (HTTP Request) - /profit-analysis
exports.profitAnalysis = functions.https.onRequest(async (req, res) => {
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
    const snapshot = await db.collection('profit-analysis').get();
    const analysis = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    
    // 클라이언트 사이드에서 정렬
    analysis.sort((a, b) => {
      const dateA = a.analysisDate ? new Date(a.analysisDate) : new Date(0);
      const dateB = b.analysisDate ? new Date(b.analysisDate) : new Date(0);
      return dateB.getTime() - dateA.getTime();
    });
    
    res.json(analysis);
  } catch (error) {
    console.error('수익성 분석 조회 오류:', error);
    res.status(500).json({ error: error.message });
  }
});

// 수익성 분석 저장 (HTTP Request) - /profit-analysis
exports.saveProfitAnalysis = functions.https.onRequest(async (req, res) => {
  return corsHandler(req, res, async () => {
    if (req.method !== 'POST') return res.status(405).send('Method Not Allowed');
    
    try {
      const analysisData = req.body;
      
      // 수익성 지표 계산
      const totalRevenue = analysisData.totalRevenue || 0;
      const totalCost = analysisData.totalCost || 0;
      const netProfit = analysisData.netProfit || (totalRevenue - totalCost);
      
      const grossProfit = totalRevenue - totalCost;
      const grossMargin = totalRevenue > 0 ? (grossProfit / totalRevenue * 100) : 0;
      const netMargin = totalRevenue > 0 ? (netProfit / totalRevenue * 100) : 0;
      const roi = totalCost > 0 ? (grossProfit / totalCost * 100) : 0;
      
      const finalData = {
        ...analysisData,
        grossProfit,
        grossMargin,
        netMargin,
        roi,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      };
      
      const docRef = await db.collection('profit-analysis').add(finalData);
      
    res.json({
        message: '수익성 분석이 저장되었습니다.',
        id: docRef.id 
      });
    } catch (error) {
      console.error('수익성 분석 저장 오류:', error);
      res.status(500).json({ error: error.message });
    }
  });
});

// 수익성 분석 수정 (HTTP Request) - /profit-analysis/:id
exports.updateProfitAnalysis = functions.https.onRequest(async (req, res) => {
  return corsHandler(req, res, async () => {
    if (req.method !== 'PUT') return res.status(405).send('Method Not Allowed');
    
    try {
      const analysisId = req.params.id;
      const updateData = req.body;
      
      // 수익성 지표 재계산
      const totalRevenue = updateData.totalRevenue || 0;
      const totalCost = updateData.totalCost || 0;
      const netProfit = updateData.netProfit || (totalRevenue - totalCost);
      
      const grossProfit = totalRevenue - totalCost;
      const grossMargin = totalRevenue > 0 ? (grossProfit / totalRevenue * 100) : 0;
      const netMargin = totalRevenue > 0 ? (netProfit / totalRevenue * 100) : 0;
      const roi = totalCost > 0 ? (grossProfit / totalCost * 100) : 0;
      
      const finalData = {
        ...updateData,
        grossProfit,
        grossMargin,
        netMargin,
        roi,
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      };
      
      await db.collection('profit-analysis').doc(analysisId).update(finalData);
      
      res.json({ message: '수익성 분석이 수정되었습니다.' });
    } catch (error) {
      console.error('수익성 분석 수정 오류:', error);
      res.status(500).json({ error: error.message });
    }
  });
});

// ===== 세금계산서 API =====

// 세금계산서 API 목록 조회 (HTTP Request) - /tax-invoice-api
exports.taxInvoiceApi = functions.https.onRequest(async (req, res) => {
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
    const snapshot = await db.collection('tax-invoice-api').get();
    const invoices = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    
    // 클라이언트 사이드에서 정렬
    invoices.sort((a, b) => {
      const dateA = a.issueDate ? new Date(a.issueDate) : new Date(0);
      const dateB = b.issueDate ? new Date(b.issueDate) : new Date(0);
      return dateB.getTime() - dateA.getTime();
    });
    
    res.json(invoices);
  } catch (error) {
    console.error('세금계산서 API 조회 오류:', error);
    res.status(500).json({ error: error.message });
  }
});

// 세금계산서 발행 요청 (HTTP Request) - /tax-invoice-api/issue
exports.issueTaxInvoice = functions.https.onRequest(async (req, res) => {
  return corsHandler(req, res, async () => {
    if (req.method !== 'POST') return res.status(405).send('Method Not Allowed');
    
    try {
      const invoiceData = req.body;
      
      // 세금계산서 발행 시뮬레이션
      const amount = invoiceData.amount || 0;
      const taxAmount = Math.round(amount * 0.1); // 10% 부가세
      const totalAmount = amount + taxAmount;
      const invoiceNo = `TI${Date.now()}`; // 임시 인보이스 번호
      
      const finalData = {
        ...invoiceData,
        invoiceNo,
        taxAmount,
        totalAmount,
        status: 'completed',
        apiResponse: {
          success: true,
          invoiceNo: invoiceNo,
          message: '세금계산서가 성공적으로 발행되었습니다.',
          timestamp: new Date().toISOString()
        },
          createdAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      };
      
      const docRef = await db.collection('tax-invoice-api').add(finalData);
      
      res.json({ 
        message: '세금계산서 발행이 요청되었습니다.',
        id: docRef.id,
        invoiceNo: invoiceNo,
        apiResponse: finalData.apiResponse
      });
    } catch (error) {
      console.error('세금계산서 발행 오류:', error);
      res.status(500).json({ error: error.message });
    }
  });
});

// register-staff 엔드포인트 alias 추가
exports['register-staff'] = exports.registerUser;

