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
  // 요청의 Origin 확인
  const origin = req.headers.origin;
  const allowedOrigins = [
    'https://windowerp-3.firebaseapp.com',
    'https://windowerp-3.web.app',
    'http://localhost:3000',
    'http://localhost:3001',
    'https://sixjjang.synology.me',
    'http://sixjjang.synology.me'
  ];
  
  // 허용된 Origin인지 확인
  if (origin && allowedOrigins.includes(origin)) {
    res.set('Access-Control-Allow-Origin', origin);
  } else {
    res.set('Access-Control-Allow-Origin', 'http://localhost:3000');
  }
  
  res.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.set('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With, Origin, Accept');
  res.set('Access-Control-Allow-Credentials', 'true');
  res.set('Access-Control-Max-Age', '86400'); // 24시간 캐시
  
  // OPTIONS 요청 처리
  if (req.method === 'OPTIONS') {
    res.status(200).send();
    return;
  }
  
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

// Multer 설정 (파일 업로드용) - 더 안정적인 설정
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB
    fieldSize: 10 * 1024 * 1024, // 10MB
    files: 1, // 단일 파일만
    fields: 10 // 최대 10개 필드
  },
  fileFilter: (req, file, cb) => {
    console.log('파일 필터링:', file.originalname, file.mimetype);
    // 엑셀 파일 및 기타 문서 파일 허용
    if (file.mimetype === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' ||
        file.mimetype === 'application/vnd.ms-excel' ||
        file.mimetype === 'application/octet-stream' ||
        file.mimetype === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
        file.mimetype === 'application/pdf' ||
        file.originalname.endsWith('.xlsx') ||
        file.originalname.endsWith('.xls') ||
        file.originalname.endsWith('.csv')) {
      cb(null, true);
    } else {
      console.log('허용되지 않은 파일 타입:', file.mimetype);
      cb(new Error('엑셀 파일만 업로드 가능합니다.'), false);
    }
  }
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
        nickname: userData.nickname || userData.name || '',
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

// Firebase Auth Custom Token 생성 (HTTP Request) - /getCustomToken
exports.getCustomToken = functions.https.onRequest(async (req, res) => {
  return corsHandler(req, res, async () => {
    if (req.method !== 'POST') return res.status(405).send('Method Not Allowed');
    
    try {
      await authenticateToken(req, res, async () => {
        // Firebase Auth에 사용자가 있는지 확인하고 없으면 생성
        try {
          await admin.auth().getUser(req.user.id);
          console.log('Firebase Auth 사용자가 이미 존재합니다:', req.user.id);
        } catch (error) {
          // 사용자가 없으면 생성
          console.log('Firebase Auth 사용자 생성 중:', req.user.id);
          const userRecord = await admin.auth().createUser({
            uid: req.user.id,
            email: `${req.user.username}@windowerp.local`,
            password: 'tempPassword123!',
            displayName: req.user.username,
            disabled: false
          });
          console.log('Firebase Auth 사용자 생성 완료:', userRecord.uid);
        }
        
        // Firebase Auth Custom Token 생성
        const customToken = await admin.auth().createCustomToken(req.user.id, {
          role: req.user.role,
          username: req.user.username
        });
        
        res.json({ customToken });
      });
    } catch (error) {
      console.error('Custom Token 생성 오류:', error);
      res.status(500).json({ error: error.message });
    }
  });
});

// Firebase Auth 사용자 확인 및 생성 (HTTP Request) - /ensureFirebaseUser
exports.ensureFirebaseUser = functions.https.onRequest(async (req, res) => {
  return corsHandler(req, res, async () => {
    if (req.method !== 'POST') return res.status(405).send('Method Not Allowed');
    
    try {
      await authenticateToken(req, res, async () => {
        // Firebase Auth에 사용자가 있는지 확인
        try {
          const userRecord = await admin.auth().getUser(req.user.id);
          console.log('Firebase Auth 사용자가 이미 존재합니다:', userRecord.uid);
          res.json({ 
            message: '사용자가 이미 존재합니다.',
            uid: userRecord.uid,
            exists: true
          });
        } catch (error) {
          // 사용자가 없으면 생성
          console.log('Firebase Auth 사용자 생성 중:', req.user.id);
          const userRecord = await admin.auth().createUser({
            uid: req.user.id,
            email: `${req.user.username}@windowerp.local`,
            password: 'tempPassword123!',
            displayName: req.user.username,
            disabled: false
          });
          
          console.log('Firebase Auth 사용자 생성 완료:', userRecord.uid);
          res.json({ 
            message: 'Firebase Authentication 사용자가 생성되었습니다.',
            uid: userRecord.uid,
            exists: false
          });
        }
      });
    } catch (error) {
      console.error('Firebase 사용자 확인/생성 오류:', error);
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

// 견적서 삭제 (HTTP Request) - /estimates/{estimateNo}
exports.deleteEstimate = functions.https.onRequest(async (req, res) => {
  return corsHandler(req, res, async () => {
    if (req.method !== 'DELETE') return res.status(405).send('Method Not Allowed');
    
    try {
      const estimateNo = req.path.split('/').pop();
      
      if (!estimateNo) {
        return res.status(400).json({ error: '견적번호가 필요합니다.' });
      }

      console.log('견적서 삭제 요청:', estimateNo);

      // 견적번호로 견적서 찾기
      const estimateSnapshot = await db.collection('estimates')
        .where('estimateNo', '==', estimateNo)
        .limit(1)
        .get();

      if (estimateSnapshot.empty) {
        return res.status(404).json({ error: '견적서를 찾을 수 없습니다.' });
      }

      const estimateDoc = estimateSnapshot.docs[0];
      
      // 견적서 삭제
      await estimateDoc.ref.delete();
      
      console.log('견적서 삭제 완료:', estimateNo);
      
      res.json({ 
        message: '견적서가 삭제되었습니다.',
        estimateNo: estimateNo
      });
    } catch (error) {
      console.error('견적서 삭제 오류:', error);
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

// 제품 목록 조회 (HTTP Request) - /products (가벼운 파일 방식)
exports.products = functions.https.onRequest(async (req, res) => {
  return corsHandler(req, res, async () => {
    try {
      const { vendor, brand, productType, useStorage = 'false' } = req.query;
      
      // Storage에서 전체 데이터를 읽어오는 방식 (가벼운 파일)
      if (useStorage === 'true') {
        console.log('Storage에서 가벼운 파일로 제품 데이터 조회');
        
        // 가장 최근의 제품 배치 파일 찾기
        const bucket = admin.storage().bucket();
        const [files] = await bucket.getFiles({ prefix: 'products/batch_' });
        
        if (files.length === 0) {
          return res.json([]);
        }
        
        // 가장 최근 파일 선택
        const latestFile = files.sort((a, b) => 
          b.metadata.timeCreated.localeCompare(a.metadata.timeCreated)
        )[0];
        
        console.log('최근 제품 파일:', latestFile.name);
        
        // Storage에서 JSON 파일 읽기
        const [fileContent] = await latestFile.download();
        const jsonData = JSON.parse(fileContent.toString('utf8'));
        
        let products = jsonData.products || [];
        
        // 필터링 적용
        if (vendor) {
          products = products.filter((p) => p.vendorName === vendor);
        }
        if (brand) {
          products = products.filter((p) => p.brand === brand);
        }
        if (productType) {
          products = products.filter((p) => p.category === productType);
        }
        
        // 정렬
        products.sort((a, b) => a.productName.localeCompare(b.productName));
        
        console.log(`Storage에서 ${products.length}개 제품 조회 완료`);
        res.json(products);
      } else {
        // 기존 Firestore 방식 (하위 호환성)
        console.log('Firestore에서 제품 데이터 조회');
        
        let query = db.collection('products');
        
        if (vendor) {
          query = query.where('vendorName', '==', vendor);
        }
        if (brand) {
          query = query.where('brand', '==', brand);
        }
        if (productType) {
          query = query.where('category', '==', productType);
        }
        
        const snapshot = await query.orderBy('productName').get();
        const products = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        
        res.json(products);
      }
    } catch (error) {
      console.error('제품 조회 오류:', error);
      res.status(500).json({ error: error.message });
    }
  });
});

// 제품 저장 (HTTP Request) - /saveProduct
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
}, { timeoutSeconds: 300 }); // 5분으로 타임아웃 증가

// 제품 배치 저장 (HTTP Request) - /saveProductsBatch (가벼운 파일 방식)
exports.saveProductsBatch = functions.https.onRequest(async (req, res) => {
  return corsHandler(req, res, async () => {
    if (req.method !== 'POST') return res.status(405).send('Method Not Allowed');
    
    try {
      const { products } = req.body;
      
      if (!products || !Array.isArray(products)) {
        return res.status(400).json({ error: '제품 배열이 필요합니다.' });
      }
      
      console.log(`${products.length}개의 제품 가벼운 파일 저장 시작`);
      
      // 가벼운 파일 방식으로 제품 데이터를 JSON으로 변환하여 Storage에 저장
      const jsonData = {
        products,
        metadata: {
          totalCount: products.length,
          uploadDate: new Date().toISOString(),
          version: '1.0'
        }
      };
      
      const jsonBuffer = Buffer.from(JSON.stringify(jsonData, null, 2), 'utf8');
      console.log('JSON 데이터 변환 완료, 크기:', jsonBuffer.length);
      
      // Firebase Storage에 JSON 파일 업로드
      const bucket = admin.storage().bucket();
      const fileName = `products/batch_${Date.now()}_${products.length}_products.json`;
      const file = bucket.file(fileName);
      
      console.log('Firebase Storage 업로드 시작:', fileName);
      
      await file.save(jsonBuffer, {
        metadata: {
          contentType: 'application/json',
          customMetadata: {
            uploadDate: new Date().toISOString(),
            productCount: products.length.toString()
          }
        },
      });
      
      console.log('Firebase Storage 업로드 완료');
      
      // Firestore에 메타데이터만 저장 (가벼운 방식)
      const batch = db.batch();
      const savedIds = [];
      
      products.forEach(product => {
        const docRef = db.collection('products').doc();
        const lightProduct = {
          id: docRef.id,
          vendorName: product.vendorName || '',
          brand: product.brand || '',
          category: product.category || '',
          productCode: product.productCode || '',
          productName: product.productName || '',
          width: product.width || '',
          minOrderQty: product.minOrderQty || 0,
          details: product.details || '',
          salePrice: product.salePrice || 0,
          purchaseCost: product.purchaseCost || 0,
          largePlainPrice: product.largePlainPrice || 0,
          largePlainCost: product.largePlainCost || 0,
          fabricPurchaseCostYD: product.fabricPurchaseCostYD || 0,
          processingFee: product.processingFee || 0,
          estimatedCost: product.estimatedCost || 0,
          insideOutside: product.insideOutside || '',
          note: product.note || '',
          space: product.space || '',
          spaceCustom: product.spaceCustom || '',
          storageFile: fileName, // Storage 파일 경로 저장
          createdAt: admin.firestore.FieldValue.serverTimestamp(),
          updatedAt: admin.firestore.FieldValue.serverTimestamp()
        };
        
        batch.set(docRef, lightProduct);
        savedIds.push(docRef.id);
      });
      
      await batch.commit();
      
      console.log(`${products.length}개의 제품 가벼운 파일 저장 완료`);
      
      res.json({
        message: `${products.length}개의 제품이 가벼운 파일로 저장되었습니다.`,
        savedCount: products.length,
        savedIds: savedIds,
        storageFile: fileName
      });
    } catch (error) {
      console.error('제품 가벼운 파일 저장 오류:', error);
      res.status(500).json({ error: error.message });
    }
  });
}, { timeoutSeconds: 540 }); // 9분으로 타임아웃 설정

// 제품 업데이트 (HTTP Request) - /updateProduct
exports.updateProduct = functions.https.onRequest(async (req, res) => {
  return corsHandler(req, res, async () => {
    if (req.method !== 'PUT') return res.status(405).send('Method Not Allowed');
    
    try {
      const { productId, ...productData } = req.body;
      if (!productId) {
        return res.status(400).json({ error: '제품 ID가 필요합니다.' });
      }
      
      productData.updatedAt = admin.firestore.FieldValue.serverTimestamp();
      
      await db.collection('products').doc(productId).update(productData);
      
      res.json({ 
        message: '제품이 업데이트되었습니다.',
        id: productId 
      });
    } catch (error) {
      console.error('제품 업데이트 오류:', error);
      res.status(500).json({ error: error.message });
    }
  });
});

// 제품 삭제 (HTTP Request) - /deleteProduct
exports.deleteProduct = functions.https.onRequest(async (req, res) => {
  return corsHandler(req, res, async () => {
    if (req.method !== 'DELETE') return res.status(405).send('Method Not Allowed');
    
    try {
      const { productId } = req.body;
      if (!productId) {
        return res.status(400).json({ error: '제품 ID가 필요합니다.' });
      }
      
      await db.collection('products').doc(productId).delete();
      
      res.json({ 
        message: '제품이 삭제되었습니다.',
        id: productId 
      });
    } catch (error) {
      console.error('제품 삭제 오류:', error);
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

// 옵션 업데이트 (HTTP Request) - /updateOption
exports.updateOption = functions.https.onRequest(async (req, res) => {
  return corsHandler(req, res, async () => {
    if (req.method !== 'PUT') return res.status(405).send('Method Not Allowed');
    
    try {
      const { optionId, ...optionData } = req.body;
      if (!optionId) {
        return res.status(400).json({ error: '옵션 ID가 필요합니다.' });
      }
      
      optionData.updatedAt = admin.firestore.FieldValue.serverTimestamp();
      
      await db.collection('options').doc(optionId).update(optionData);
      
      res.json({ 
        message: '옵션이 업데이트되었습니다.',
        id: optionId 
      });
    } catch (error) {
      console.error('옵션 업데이트 오류:', error);
      res.status(500).json({ error: error.message });
    }
  });
});

// 옵션 삭제 (HTTP Request) - /deleteOption
exports.deleteOption = functions.https.onRequest(async (req, res) => {
  return corsHandler(req, res, async () => {
    if (req.method !== 'DELETE') return res.status(405).send('Method Not Allowed');
    
    try {
      const { optionId } = req.query;
      if (!optionId) {
        return res.status(400).json({ error: '옵션 ID가 필요합니다.' });
      }
      
      await db.collection('options').doc(optionId).delete();
      
      res.json({ 
        message: '옵션이 삭제되었습니다.',
        id: optionId 
      });
    } catch (error) {
      console.error('옵션 삭제 오류:', error);
      res.status(500).json({ error: error.message });
    }
  });
});

// 모든 옵션 삭제 (HTTP Request) - /deleteAllOptions
exports.deleteAllOptions = functions.https.onRequest(async (req, res) => {
  return corsHandler(req, res, async () => {
    if (req.method !== 'DELETE') return res.status(405).send('Method Not Allowed');
    
    try {
      // 모든 옵션 조회
      const optionsSnapshot = await db.collection('options').get();
      
      if (optionsSnapshot.empty) {
        return res.json({ 
          message: '삭제할 옵션이 없습니다.',
          deletedCount: 0 
        });
      }
      
      // 배치 삭제 실행
      const batch = db.batch();
      const deletedIds = [];
      
      optionsSnapshot.docs.forEach(doc => {
        batch.delete(doc.ref);
        deletedIds.push(doc.id);
      });
      
      await batch.commit();
      
      console.log(`${deletedIds.length}개의 옵션이 삭제되었습니다.`);
      
      res.json({ 
        message: `${deletedIds.length}개의 옵션이 삭제되었습니다.`,
        deletedCount: deletedIds.length,
        deletedIds: deletedIds
      });
    } catch (error) {
      console.error('모든 옵션 삭제 오류:', error);
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
      const schedules = snapshot.docs.map(doc => {
        const data = doc.data();
        return {
          ...data,
          id: doc.id, // 실제 Firestore 문서 ID 사용
          firestoreId: doc.id // 원본 ID도 보존
        };
      });
      
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
      
      // 클라이언트에서 제공한 ID가 있으면 해당 ID로 문서 생성
      if (scheduleData.id) {
        await db.collection('schedules').doc(scheduleData.id).set(scheduleData);
        console.log(`새 스케줄 생성 (클라이언트 ID 사용): ${scheduleData.id}`);
        
        res.json({ 
          message: '새로운 스케줄이 생성되었습니다.',
          id: scheduleData.id,
          created: true
        });
      } else {
        // ID가 없으면 Firestore가 자동 생성
        const docRef = await db.collection('schedules').add(scheduleData);
        console.log(`새 스케줄 생성 (Firestore 자동 ID): ${docRef.id}`);
        
        res.json({ 
          message: '새로운 스케줄이 생성되었습니다.',
          id: docRef.id,
          created: true
        });
      }
    }
    // PUT: 스케줄 수정
    else if (req.method === 'PUT') {
      // URL에서 scheduleId 추출 (DELETE와 동일한 방식)
      const urlParts = req.url.split('/');
      const scheduleId = urlParts[urlParts.length - 1];
      
      // URL 디코딩
      const decodedScheduleId = decodeURIComponent(scheduleId);
      
      const scheduleData = req.body;
      scheduleData.updatedAt = admin.firestore.FieldValue.serverTimestamp();
      
      console.log('PUT 요청 URL:', req.url);
      console.log('URL 파트:', urlParts);
      console.log('추출된 ID:', scheduleId);
      console.log('디코딩된 ID:', decodedScheduleId);
      
      // ID 유효성 검사 (Firestore 문서 ID 규칙)
      if (!decodedScheduleId || decodedScheduleId.trim() === '') {
        return res.status(400).json({ 
          error: '스케줄 ID가 필요합니다.',
          scheduleId: decodedScheduleId,
          url: req.url
        });
      }
      
      // Firestore 문서 ID 규칙: /, ., .., * 제외, 1-1500자
      // 하이픈(-)은 허용됨
      const invalidChars = /[\/\.\*]/;
      if (invalidChars.test(decodedScheduleId) || decodedScheduleId.length > 1500 || decodedScheduleId.length < 1) {
        console.warn(`잠재적 ID 규칙 위반: ${decodedScheduleId}`);
        // 경고만 하고 계속 진행 (실제 Firestore에서 처리)
      }
      
      console.log(`ID 검증 완료: ${decodedScheduleId} (길이: ${decodedScheduleId.length})`);
      
      console.log(`스케줄 수정 요청: ID=${decodedScheduleId}`);
      console.log('수정 요청 데이터:', JSON.stringify(scheduleData, null, 2));
      console.log('ID 길이:', decodedScheduleId.length);
      console.log('ID에 특수문자 포함 여부:', /[\/\.\*]/.test(decodedScheduleId));
      
      try {
        // 먼저 해당 ID로 문서가 존재하는지 확인
        const docRef = db.collection('schedules').doc(decodedScheduleId);
        const doc = await docRef.get();
        
        if (doc.exists) {
          // 문서가 존재하면 업데이트
          await docRef.update(scheduleData);
          console.log(`스케줄 업데이트 성공: ${decodedScheduleId}`);
          
          res.json({ 
            message: '스케줄이 수정되었습니다.',
            id: decodedScheduleId 
          });
        } else {
          // 문서가 존재하지 않으면 새로 생성
          await docRef.set(scheduleData);
          console.log(`스케줄 생성 성공: ${decodedScheduleId}`);
          
          res.json({ 
            message: '스케줄이 생성되었습니다.',
            id: decodedScheduleId 
          });
        }
      } catch (error) {
        console.error('스케줄 처리 오류:', error);
        res.status(500).json({ 
          error: '스케줄 처리에 실패했습니다.',
          details: error.message 
        });
      }
    }
    // DELETE: 스케줄 삭제
    else if (req.method === 'DELETE') {
      // URL에서 scheduleId 추출
      const urlParts = req.url.split('/');
      const scheduleId = urlParts[urlParts.length - 1];
      
      if (!scheduleId) {
        return res.status(400).json({ error: '스케줄 ID가 필요합니다.' });
      }
      
      // URL 디코딩
      const decodedScheduleId = decodeURIComponent(scheduleId);
      
      console.log('삭제 요청된 스케줄 ID:', decodedScheduleId);
      
      await db.collection('schedules').doc(decodedScheduleId).delete();
      
      res.json({
        message: '스케줄이 삭제되었습니다.',
        id: decodedScheduleId 
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

// 닉네임 관리 (HTTP Request) - /nickname
exports.nickname = functions.https.onRequest(async (req, res) => {
  return corsHandler(req, res, async () => {
    try {
      // GET: 닉네임 조회
      if (req.method === 'GET') {
        const token = req.headers.authorization?.split(' ')[1];
        if (!token) {
          return res.status(401).json({ error: '토큰이 필요합니다.' });
        }

        try {
          const decoded = jwt.verify(token, JWT_SECRET);
          const userId = decoded.id;
          
          const userDoc = await db.collection('users').doc(userId.toString()).get();
          if (userDoc.exists) {
            const userData = userDoc.data();
            res.json({ 
              nickname: userData.nickname || '',
              message: '닉네임을 조회했습니다.'
            });
          } else {
            res.json({ 
              nickname: '',
              message: '사용자를 찾을 수 없습니다.'
            });
          }
        } catch (jwtError) {
          res.status(401).json({ error: '유효하지 않은 토큰입니다.' });
        }
      }
      // POST: 닉네임 저장
      else if (req.method === 'POST') {
        const token = req.headers.authorization?.split(' ')[1];
        if (!token) {
          return res.status(401).json({ error: '토큰이 필요합니다.' });
        }

        try {
          const decoded = jwt.verify(token, JWT_SECRET);
          const userId = decoded.id;
          const { nickname } = req.body;
          
          if (!nickname || !nickname.trim()) {
            return res.status(400).json({ error: '닉네임이 필요합니다.' });
          }

          await db.collection('users').doc(userId.toString()).update({
            nickname: nickname.trim(),
            updatedAt: admin.firestore.FieldValue.serverTimestamp()
          });
          
          res.json({ 
            message: '닉네임이 저장되었습니다.',
            nickname: nickname.trim()
          });
        } catch (jwtError) {
          res.status(401).json({ error: '유효하지 않은 토큰입니다.' });
        }
      }
      else {
        res.status(405).send('Method Not Allowed');
      }
    } catch (error) {
      console.error('닉네임 처리 오류:', error);
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
  return corsHandler(req, res, async () => {
    if (req.method !== 'POST') return res.status(405).send('Method Not Allowed');
    
    try {
      console.log('과거자료 업로드 요청 시작');
      console.log('요청 헤더:', req.headers);
      console.log('요청 바디 타입:', req.headers['content-type']);
      
      // JWT 토큰 검증 (헤더 또는 URL 파라미터에서)
      let userId = null;
      let token = null;
      
      // URL 파라미터에서 토큰 확인
      if (req.query.token) {
        token = req.query.token;
      } else if (req.headers['authorization']) {
        token = req.headers['authorization'].split(' ')[1];
      }
      
      if (token) {
        try {
          const decoded = jwt.verify(token, JWT_SECRET);
          userId = decoded.id;
          console.log('인증된 사용자:', userId);
        } catch (error) {
          console.log('토큰 검증 실패:', error.message);
          return res.status(401).json({ error: '유효하지 않은 토큰입니다.' });
        }
      }
      
      // raw body 파싱을 위한 미들웨어
      const rawBody = req.body;
      console.log('Raw body type:', typeof rawBody);
      console.log('Raw body length:', rawBody ? rawBody.length : 'undefined');
      
      // Content-Type 확인
      const contentType = req.headers['content-type'] || '';
      console.log('Content-Type:', contentType);
      
      if (!contentType.includes('application/json')) {
        return res.status(400).json({ error: 'application/json 형식이 필요합니다.' });
      }
      
      // 미리보기 데이터 처리
      try {
        console.log('미리보기 데이터 처리 시작');
        console.log('요청 헤더:', req.headers);
        console.log('요청 바디 타입:', typeof req.body);
        console.log('요청 바디:', JSON.stringify(req.body, null, 2));
        
        const { fileName, previewData, merges, fileType, fileSize, type, year, sheetName, description } = req.body;
        console.log('파싱된 데이터:', { 
          fileName: !!fileName, 
          previewData: !!previewData, 
          fileType, 
          fileSize, 
          type, 
          year, 
          sheetName, 
          description 
        });
        
        if (!type || !year || !fileName || !previewData) {
          console.error('필수 파라미터 누락:', { type, year, fileName: !!fileName, previewData: !!previewData });
          return res.status(400).json({ error: '필수 파라미터가 누락되었습니다.' });
        }

        console.log('미리보기 데이터 수신 완료, 행 수:', previewData.length);

        // 미리보기 데이터를 JSON 파일로 변환하여 Storage에 저장
        const jsonData = {
          previewData,
          merges: merges || [],
          metadata: {
            fileName,
            fileType,
            fileSize,
            type,
            year,
            sheetName,
            description,
            uploadedBy: userId,
            uploadDate: new Date().toISOString()
          }
        };

        const jsonBuffer = Buffer.from(JSON.stringify(jsonData, null, 2), 'utf8');
        console.log('JSON 데이터 변환 완료, 크기:', jsonBuffer.length);

        // Firebase Storage에 JSON 파일 업로드
        const bucket = admin.storage().bucket();
        const storageFileName = `historical-data/${type}/${year}/${uuidv4()}_${fileName.replace(/\.[^/.]+$/, '')}.json`;
        const file = bucket.file(storageFileName);

        console.log('Firebase Storage 업로드 시작:', storageFileName);
        
        // 폴더 구조 확인 및 생성
        const folderPath = `historical-data/${type}/${year}/`;
        console.log('폴더 경로:', folderPath);
        
        await file.save(jsonBuffer, {
          metadata: {
            contentType: 'application/json',
            customMetadata: {
              uploadedBy: userId,
              uploadDate: new Date().toISOString(),
              originalFileName: fileName
            }
          },
        });

        console.log('Firebase Storage 업로드 완료');

        // Firestore에 메타데이터 저장
        const recordData = {
          type,
          year: parseInt(year),
          filename: storageFileName,
          originalName: fileName,
          sheetName: sheetName || 'Sheet1',
          description: description || '',
          uploadedBy: userId,
          uploadDate: admin.firestore.FieldValue.serverTimestamp(),
          fileSize: fileSize,
          mimeType: 'application/json',
          dataRows: previewData.length,
          dataColumns: previewData[0] ? previewData[0].length : 0,
          hasMerges: (merges && merges.length > 0)
        };

        console.log('Firestore 저장 데이터:', recordData);

        // Firestore에 메타데이터 저장 (컬렉션 자동 생성)
        const docRef = await db.collection('historical-data').add(recordData);
        
        console.log('Firestore 저장 완료:', docRef.id);
        console.log('저장된 데이터:', recordData);
      
        res.json({ 
          success: true,
          message: '과거자료가 업로드되었습니다.',
          id: docRef.id,
          fileName: storageFileName
        });
      } catch (innerError) {
        console.error('내부 처리 오류:', innerError);
        res.status(500).json({ error: innerError.message });
      }
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
    const recordId = req.query.id;
    
    if (!recordId) {
      return res.status(400).json({ error: 'id 파라미터가 필요합니다.' });
    }
    
    const doc = await db.collection('historical-data').doc(recordId).get();
    if (!doc.exists) {
      return res.status(404).json({ error: '과거자료를 찾을 수 없습니다.' });
    }

    const data = doc.data();
    
    // Firebase Storage에서 JSON 파일 읽기
    try {
      const bucket = admin.storage().bucket();
      const file = bucket.file(data.filename);
      
      const [fileContent] = await file.download();
      const jsonData = JSON.parse(fileContent.toString('utf8'));
      
      res.json({
        id: doc.id,
        ...data,
        data: jsonData.previewData,
        merges: jsonData.merges || []
      });
    } catch (storageError) {
      console.error('Storage 파일 읽기 실패:', storageError);
      res.status(500).json({ error: '파일 데이터를 읽을 수 없습니다.' });
    }
  } catch (error) {
    console.error('과거자료 미리보기 오류:', error);
    res.status(500).json({ error: error.message });
  }
});

// 과거자료 다운로드 (HTTP Request) - /historical-data/download
exports.historicalDataDownload = functions.https.onRequest(async (req, res) => {
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
    const { filename } = req.query;
    
    if (!filename) {
      return res.status(400).json({ error: 'filename 파라미터가 필요합니다.' });
    }

    // Firebase Storage에서 파일 URL 생성
    const bucket = admin.storage().bucket();
    const file = bucket.file(filename);
    
    // 서명된 URL 생성 (1시간 유효)
    const [signedUrl] = await file.getSignedUrl({
      action: 'read',
      expires: Date.now() + 60 * 60 * 1000, // 1시간
    });

    res.json({ downloadUrl: signedUrl });
  } catch (error) {
    console.error('과거자료 다운로드 오류:', error);
    res.status(500).json({ error: error.message });
  }
});

// 과거자료 배치 업로드 (HTTP Request) - /historical-data/batch-upload
exports.historicalDataBatchUpload = functions.https.onRequest(async (req, res) => {
  return corsHandler(req, res, async () => {
    if (req.method !== 'POST') return res.status(405).send('Method Not Allowed');
    
    try {
      console.log('과거자료 배치 업로드 요청 시작');
      
      // JWT 토큰 검증
      const authHeader = req.headers['authorization'];
      let userId = null;
      if (authHeader) {
        const token = authHeader.split(' ')[1];
        try {
          const decoded = jwt.verify(token, JWT_SECRET);
          userId = decoded.id;
          console.log('인증된 사용자:', userId);
        } catch (error) {
          console.log('토큰 검증 실패:', error.message);
          return res.status(401).json({ error: '유효하지 않은 토큰입니다.' });
        }
      }
      
      // multer를 사용한 다중 파일 업로드 처리
      upload.array('files', 10)(req, res, async (err) => {
        if (err) {
          console.error('파일 업로드 오류:', err);
          return res.status(400).json({ error: err.message });
        }

        try {
          console.log('배치 파일 업로드 성공');
          console.log('업로드된 파일 수:', req.files.length);
          console.log('요청 바디:', req.body);
          
          const { files } = req.body;
          const fileData = JSON.parse(files || '[]');
          
          if (!req.files || req.files.length === 0) {
            return res.status(400).json({ error: '업로드할 파일이 없습니다.' });
          }

          const results = [];
          const bucket = admin.storage().bucket();

          for (let i = 0; i < req.files.length; i++) {
            const file = req.files[i];
            const fileInfo = fileData[i] || {};
            
            const { type, year, sheetName, description } = fileInfo;
            
            if (!type || !year) {
              results.push({
                originalName: file.originalname,
                success: false,
                error: 'type과 year가 필요합니다.'
              });
              continue;
            }

            try {
              // Firebase Storage에 파일 업로드
              const fileName = `historical-data/${type}/${year}/${uuidv4()}_${file.originalname}`;
              const storageFile = bucket.file(fileName);

              await storageFile.save(file.buffer, {
                metadata: {
                  contentType: file.mimetype,
                  customMetadata: {
                    uploadedBy: userId,
                    uploadDate: new Date().toISOString()
                  }
                },
              });

              // Firestore에 메타데이터 저장
              const recordData = {
                type,
                year: parseInt(year),
                filename: fileName,
                originalName: file.originalname,
                sheetName: sheetName || 'Sheet1',
                description: description || '',
                uploadedBy: userId,
                uploadDate: admin.firestore.FieldValue.serverTimestamp(),
                fileSize: file.size,
                mimeType: file.mimetype
              };

              const docRef = await db.collection('historical-data').add(recordData);
              
              results.push({
                originalName: file.originalname,
                success: true,
                id: docRef.id,
                fileName: fileName
              });
              
            } catch (fileError) {
              console.error(`파일 ${file.originalname} 업로드 실패:`, fileError);
              results.push({
                originalName: file.originalname,
                success: false,
                error: fileError.message
              });
            }
          }
          
          const successCount = results.filter(r => r.success).length;
          const failureCount = results.filter(r => !r.success).length;
          
          res.json({ 
            success: true,
            message: `배치 업로드 완료: ${successCount}개 성공, ${failureCount}개 실패`,
            results: results
          });
          
        } catch (innerError) {
          console.error('배치 업로드 내부 처리 오류:', innerError);
          res.status(500).json({ error: innerError.message });
        }
      });
    } catch (error) {
      console.error('과거자료 배치 업로드 오류:', error);
      res.status(500).json({ error: error.message });
    }
  });
});

// 과거자료 삭제 (HTTP Request) - /historical-data/delete
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
    const recordId = req.query.id;
    
    if (!recordId) {
      return res.status(400).json({ error: 'id 파라미터가 필요합니다.' });
    }
    
    console.log('삭제 요청 받음:', recordId);
    
    // Firestore에서 레코드 조회
    const docRef = db.collection('historical-data').doc(recordId);
    const doc = await docRef.get();
    
    if (!doc.exists) {
      return res.status(404).json({ error: '과거자료를 찾을 수 없습니다.' });
    }
    
    const data = doc.data();
    console.log('삭제할 레코드:', data);
    
    // Firebase Storage에서 파일 삭제
    if (data.filename) {
      try {
        const bucket = admin.storage().bucket();
        const file = bucket.file(data.filename);
        
        console.log('Storage 파일 삭제 시도:', data.filename);
        await file.delete();
        console.log('Storage 파일 삭제 완료');
      } catch (storageError) {
        console.error('Storage 파일 삭제 실패:', storageError);
        // Storage 파일이 없어도 Firestore 레코드는 삭제 진행
      }
    }
    
    // Firestore에서 레코드 삭제
    await docRef.delete();
    console.log('Firestore 레코드 삭제 완료');
    
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
      role: 'user',           // 항상 'user'로 고정
      isApproved: false,      // 승인 대기 상태로 변경
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
    // Express 라우팅이 아니므로 URL에서 직접 추출
    const matches = req.url.match(/\/users\/(.+)\/approve/);
    const userId = matches && matches[1];
    if (!userId) return res.status(400).json({ error: 'userId 파라미터 필요' });

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
    // Express 라우팅이 아니므로 URL에서 직접 추출
    const matches = req.url.match(/\/users\/(.+)\/role/);
    const userId = matches && matches[1];
    if (!userId) return res.status(400).json({ error: 'userId 파라미터 필요' });
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

  try {
    const expenseId = req.params.id;
    await db.collection('fixed-expenses').doc(expenseId).delete();
    
    res.json({ message: '고정비가 삭제되었습니다.' });
  } catch (error) {
    console.error('고정비 삭제 오류:', error);
    res.status(500).json({ error: error.message });
  }
});

// ===== 거래내역 관리 =====

// 거래내역 목록 조회 (HTTP Request) - /transactions
exports.transactions = functions.https.onRequest(async (req, res) => {
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
    
    let query = db.collection('transactions');
    if (month) {
      query = query.where('month', '==', month);
    }
    
    const snapshot = await query.get();
    const transactions = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    
    // 클라이언트 사이드에서 정렬
    transactions.sort((a, b) => {
      const dateA = a.createdAt ? new Date(a.createdAt.seconds * 1000) : new Date(0);
      const dateB = b.createdAt ? new Date(b.createdAt.seconds * 1000) : new Date(0);
      return dateB.getTime() - dateA.getTime();
    });
    
    res.json(transactions);
  } catch (error) {
    console.error('거래내역 조회 오류:', error);
    res.status(500).json({ error: error.message });
  }
});

// 거래내역 저장 (HTTP Request) - /saveTransaction
exports.saveTransaction = functions.https.onRequest(async (req, res) => {
  return corsHandler(req, res, async () => {
    if (req.method !== 'POST') return res.status(405).send('Method Not Allowed');
    
    try {
      const transactionData = req.body;
      transactionData.createdAt = admin.firestore.FieldValue.serverTimestamp();
      transactionData.updatedAt = admin.firestore.FieldValue.serverTimestamp();
      
      const docRef = await db.collection('transactions').add(transactionData);
      
      res.json({ 
        message: '거래내역이 저장되었습니다.',
        id: docRef.id 
      });
    } catch (error) {
      console.error('거래내역 저장 오류:', error);
      res.status(500).json({ error: error.message });
    }
  });
});

// 거래내역 수정 (HTTP Request) - /updateTransaction/:id
exports.updateTransaction = functions.https.onRequest(async (req, res) => {
  return corsHandler(req, res, async () => {
    if (req.method !== 'PUT') return res.status(405).send('Method Not Allowed');
    
    try {
      const transactionId = req.params.id;
      const updateData = {
        ...req.body,
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      };
      
      await db.collection('transactions').doc(transactionId).update(updateData);
      
      res.json({ message: '거래내역이 수정되었습니다.' });
    } catch (error) {
      console.error('거래내역 수정 오류:', error);
      res.status(500).json({ error: error.message });
    }
  });
});

// 거래내역 삭제 (HTTP Request) - /deleteTransaction/:id
exports.deleteTransaction = functions.https.onRequest(async (req, res) => {
  res.set('Access-Control-Allow-Origin', '*');
  res.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.set('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With, Origin, Accept');
  res.set('Access-Control-Max-Age', '86400');
  if (req.method === 'OPTIONS') { res.status(200).send(); return; }
  if (req.method !== 'DELETE') return res.status(405).send('Method Not Allowed');

  try {
    const transactionId = req.params.id;
    await db.collection('transactions').doc(transactionId).delete();
    
    res.json({ message: '거래내역이 삭제되었습니다.' });
  } catch (error) {
    console.error('거래내역 삭제 오류:', error);
    res.status(500).json({ error: error.message });
  }
});

// ===== 계좌 관리 =====

// 계좌 목록 조회 (HTTP Request) - /accounts
exports.accounts = functions.https.onRequest(async (req, res) => {
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
    const snapshot = await db.collection('accounts').orderBy('createdAt', 'desc').get();
    const accounts = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    
    res.json(accounts);
  } catch (error) {
    console.error('계좌 조회 오류:', error);
    res.status(500).json({ error: error.message });
  }
});

// 계좌 저장 (HTTP Request) - /saveAccount
exports.saveAccount = functions.https.onRequest(async (req, res) => {
  return corsHandler(req, res, async () => {
    if (req.method !== 'POST') return res.status(405).send('Method Not Allowed');
    
    try {
      const accountData = req.body;
      accountData.createdAt = admin.firestore.FieldValue.serverTimestamp();
      accountData.updatedAt = admin.firestore.FieldValue.serverTimestamp();
      
      const docRef = await db.collection('accounts').add(accountData);
      
      res.json({ 
        message: '계좌가 저장되었습니다.',
        id: docRef.id 
      });
    } catch (error) {
      console.error('계좌 저장 오류:', error);
      res.status(500).json({ error: error.message });
    }
  });
});

// 계좌 수정 (HTTP Request) - /updateAccount/:id
exports.updateAccount = functions.https.onRequest(async (req, res) => {
  return corsHandler(req, res, async () => {
    if (req.method !== 'PUT') return res.status(405).send('Method Not Allowed');
    
    try {
      const accountId = req.params.id;
      const updateData = {
        ...req.body,
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      };
      
      await db.collection('accounts').doc(accountId).update(updateData);
      
      res.json({ message: '계좌가 수정되었습니다.' });
    } catch (error) {
      console.error('계좌 수정 오류:', error);
      res.status(500).json({ error: error.message });
    }
  });
});

// 계좌 삭제 (HTTP Request) - /deleteAccount/:id
exports.deleteAccount = functions.https.onRequest(async (req, res) => {
  res.set('Access-Control-Allow-Origin', '*');
  res.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.set('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With, Origin, Accept');
  res.set('Access-Control-Max-Age', '86400');
  if (req.method === 'OPTIONS') { res.status(200).send(); return; }
  if (req.method !== 'DELETE') return res.status(405).send('Method Not Allowed');

  try {
    const accountId = req.params.id;
    await db.collection('accounts').doc(accountId).delete();
    
    res.json({ message: '계좌가 삭제되었습니다.' });
  } catch (error) {
    console.error('계좌 삭제 오류:', error);
    res.status(500).json({ error: error.message });
  }
});

// 고정비 삭제 (HTTP Request) - /deleteFixedExpense/:id
exports.deleteFixedExpense = functions.https.onRequest(async (req, res) => {
  res.set('Access-Control-Allow-Origin', '*');
  res.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.set('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With, Origin, Accept');
  res.set('Access-Control-Max-Age', '86400');
  if (req.method === 'OPTIONS') { res.status(200).send(); return; }
  if (req.method !== 'DELETE') return res.status(405).send('Method Not Allowed');

  try {
    // id를 쿼리스트링 또는 경로에서 추출
    const id = req.query.id || (req.url.split('/').pop() || '').split('?')[0];
    if (!id) return res.status(400).json({ error: 'id 파라미터 필요' });

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
    // URL 경로에서 ID 추출
    const pathParts = req.path.split('/');
    const recordId = pathParts[pathParts.length - 1];
    
    if (!recordId) {
      return res.status(400).json({ error: '레코드 ID가 필요합니다.' });
    }
    
    console.log('업데이트 요청 받음:', recordId);
    
    const updateData = req.body;
    updateData.updatedAt = admin.firestore.FieldValue.serverTimestamp();
    
    console.log('업데이트 데이터:', updateData);
    
    // Firestore에서 레코드 존재 확인
    const docRef = db.collection('historical-data').doc(recordId);
    const doc = await docRef.get();
    
    if (!doc.exists) {
      return res.status(404).json({ error: '과거자료를 찾을 수 없습니다.' });
    }
    
    await docRef.update(updateData);
    
    console.log('업데이트 완료');
    res.json({ message: 'Historical Data가 업데이트되었습니다.' });
  } catch (error) {
    console.error('Historical Data 업데이트 오류:', error);
    res.status(500).json({ error: error.message });
  }
});



// ===== 실측 데이터 관리 =====

// 실측 데이터 목록 조회 (HTTP Request) - /measurements
exports.getMeasurements = functions.https.onRequest(async (req, res) => {
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
    const snapshot = await db.collection('measurements').orderBy('createdAt', 'desc').get();
    const measurements = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    
    res.json(measurements);
  } catch (error) {
    console.error('실측 데이터 조회 오류:', error);
    res.status(500).json({ error: error.message });
  }
});

// 실측 데이터 저장 (HTTP Request) - /saveMeasurement
exports.saveMeasurement = functions.https.onRequest(async (req, res) => {
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
    const measurementData = req.body;
    
    const docRef = await db.collection('measurements').add({
      ...measurementData,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    });
    
    res.json({ 
      message: '실측 데이터가 저장되었습니다.',
      id: docRef.id 
    });
  } catch (error) {
    console.error('실측 데이터 저장 오류:', error);
    res.status(500).json({ error: error.message });
  }
});

// 실측 데이터 업데이트 (HTTP Request) - /updateMeasurement/:id
exports.updateMeasurement = functions.https.onRequest(async (req, res) => {
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
    const measurementId = req.params.id;
    const updateData = req.body;
    
    await db.collection('measurements').doc(measurementId).update({
      ...updateData,
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    });
    
    res.json({ message: '실측 데이터가 업데이트되었습니다.' });
  } catch (error) {
    console.error('실측 데이터 업데이트 오류:', error);
    res.status(500).json({ error: error.message });
  }
});

// 실측 데이터 삭제 (HTTP Request) - /deleteMeasurement/:id
exports.deleteMeasurement = functions.https.onRequest(async (req, res) => {
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
    const measurementId = req.params.id;
    
    await db.collection('measurements').doc(measurementId).delete();
    
    res.json({ message: '실측 데이터가 삭제되었습니다.' });
  } catch (error) {
    console.error('실측 데이터 삭제 오류:', error);
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

// register-staff 엔드포인트 alias 추가 (하이픈 제거)
exports.registerStaff = exports.registerUser;

// register 엔드포인트 추가 (LoginPage 호환성)
exports.register = exports.registerUser;

// ===== 비밀번호 변경 =====

// 비밀번호 변경 (HTTP Request) - /profile/change-password
exports.changePassword = functions.https.onRequest(async (req, res) => {
  return corsHandler(req, res, async () => {
    if (req.method !== 'POST') return res.status(405).send('Method Not Allowed');
    
    try {
      // JWT 토큰 검증
      const authHeader = req.headers['authorization'];
      const token = authHeader && authHeader.split(' ')[1];

      if (!token) {
        return res.status(401).json({ error: 'Access token required' });
      }

      let decoded;
      try {
        decoded = jwt.verify(token, JWT_SECRET);
      } catch (error) {
        return res.status(403).json({ error: 'Invalid token' });
      }

      const userId = decoded.id || decoded.userId;
      
      if (!userId) {
        return res.status(400).json({ error: '유효한 사용자 ID가 없습니다.' });
      }

      const { currentPassword, newPassword } = req.body;
      
      if (!currentPassword || !newPassword) {
        return res.status(400).json({ error: '현재 비밀번호와 새 비밀번호가 필요합니다.' });
      }

      if (newPassword.length < 6) {
        return res.status(400).json({ error: '새 비밀번호는 6자 이상이어야 합니다.' });
      }

      // 현재 사용자 정보 조회
      const userDoc = await db.collection('users').doc(userId).get();
      if (!userDoc.exists) {
        return res.status(404).json({ error: '사용자를 찾을 수 없습니다.' });
      }

      const userData = userDoc.data();

      // 현재 비밀번호 검증
      const isValidPassword = await bcrypt.compare(currentPassword, userData.password);
      if (!isValidPassword) {
        return res.status(401).json({ error: '현재 비밀번호가 올바르지 않습니다.' });
      }

      // 새 비밀번호 해시화
      const hashedNewPassword = await bcrypt.hash(newPassword, 10);

      // 비밀번호 업데이트
      await db.collection('users').doc(userId).update({
        password: hashedNewPassword,
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      });

      console.log(`비밀번호 변경 성공: ${userId}`);

      res.json({ 
        success: true,
        message: '비밀번호가 성공적으로 변경되었습니다.'
      });

    } catch (error) {
      console.error('비밀번호 변경 오류:', error);
      res.status(500).json({ error: error.message });
    }
  });
});

// ===== 프로필 이미지 업로드 =====

// 프로필 이미지 업로드 (HTTP Request) - /profile/upload-image
exports.uploadProfileImage = functions.https.onRequest(async (req, res) => {
  return corsHandler(req, res, async () => {
    if (req.method !== 'POST') return res.status(405).send('Method Not Allowed');
    
    try {
      // JWT 토큰 검증
      const authHeader = req.headers['authorization'];
      const token = authHeader && authHeader.split(' ')[1];

      if (!token) {
        return res.status(401).json({ error: 'Access token required' });
      }

      let decoded;
      try {
        decoded = jwt.verify(token, JWT_SECRET);
      } catch (error) {
        return res.status(403).json({ error: 'Invalid token' });
      }

      const userId = decoded.id || decoded.userId;
      
      if (!userId) {
        return res.status(400).json({ error: '유효한 사용자 ID가 없습니다.' });
      }
      
      // 이미지 데이터 확인
      const { imageData, imageType } = req.body;
      
      if (!imageData || !imageType) {
        return res.status(400).json({ error: '이미지 데이터와 타입이 필요합니다.' });
      }

      // 이미지 타입 검증
      if (!imageType.startsWith('image/')) {
        return res.status(400).json({ error: '유효한 이미지 타입이 아닙니다.' });
      }

      // Base64 이미지 데이터를 Buffer로 변환
      const base64Data = imageData.replace(/^data:image\/[a-z]+;base64,/, '');
      const imageBuffer = Buffer.from(base64Data, 'base64');

      // 이미지 크기 검증 (5MB 제한)
      if (imageBuffer.length > 5 * 1024 * 1024) {
        return res.status(400).json({ error: '이미지 크기는 5MB를 초과할 수 없습니다.' });
      }

      // Firebase Storage에 업로드
      const bucket = admin.storage().bucket();
      const fileName = `profile-images/${userId}_${Date.now()}.jpg`;
      const file = bucket.file(fileName);

      // 메타데이터 설정
      const metadata = {
        contentType: 'image/jpeg',
        metadata: {
          userId: userId,
          uploadedAt: new Date().toISOString()
        }
      };

      // 파일 업로드
      await file.save(imageBuffer, {
        metadata: metadata,
        resumable: false
      });

      // 파일을 공개로 설정
      await file.makePublic();

      // 공개 URL 생성
      const url = `https://storage.googleapis.com/${bucket.name}/${fileName}`;

      // Firestore에 프로필 이미지 URL 저장
      await db.collection('users').doc(userId).update({
        profileImage: url,
        profileImageUpdatedAt: admin.firestore.FieldValue.serverTimestamp()
      });

      console.log(`프로필 이미지 업로드 성공: ${userId} -> ${fileName}`);

      res.json({ 
        success: true,
        message: '프로필 이미지가 업로드되었습니다.',
        profileImage: url,
        fileName: fileName
      });

    } catch (error) {
      console.error('프로필 이미지 업로드 오류:', error);
      res.status(500).json({ error: error.message });
    }
  });
});

// 프로필 이미지 삭제 (HTTP Request) - /profile/delete-image
exports.deleteProfileImage = functions.https.onRequest(async (req, res) => {
  return corsHandler(req, res, async () => {
    if (req.method !== 'DELETE') return res.status(405).send('Method Not Allowed');
    
    try {
      // JWT 토큰 검증
      const authHeader = req.headers['authorization'];
      const token = authHeader && authHeader.split(' ')[1];

      if (!token) {
        return res.status(401).json({ error: 'Access token required' });
      }

      let decoded;
      try {
        decoded = jwt.verify(token, JWT_SECRET);
      } catch (error) {
        return res.status(403).json({ error: 'Invalid token' });
      }

      const userId = decoded.id || decoded.userId;
      
      if (!userId) {
        return res.status(400).json({ error: '유효한 사용자 ID가 없습니다.' });
      }

      // Firestore에서 프로필 이미지 URL 제거
      await db.collection('users').doc(userId).update({
        profileImage: null,
        profileImageUpdatedAt: admin.firestore.FieldValue.serverTimestamp()
      });

      console.log(`프로필 이미지 삭제 성공: ${userId}`);

      res.json({ 
        success: true,
        message: '프로필 이미지가 삭제되었습니다.'
      });

    } catch (error) {
      console.error('프로필 이미지 삭제 오류:', error);
      res.status(500).json({ error: error.message });
    }
  });
});

