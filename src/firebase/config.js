import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore, connectFirestoreEmulator } from 'firebase/firestore';
import { getStorage, connectStorageEmulator } from 'firebase/storage';
import { getDatabase, connectDatabaseEmulator } from 'firebase/database';
import { getFunctions, connectFunctionsEmulator } from 'firebase/functions';

const firebaseConfig = {
  apiKey: process.env.REACT_APP_FIREBASE_API_KEY || "AIzaSyBXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX",
  authDomain: process.env.REACT_APP_FIREBASE_AUTH_DOMAIN || "windowerp-3.firebaseapp.com",
  projectId: process.env.REACT_APP_FIREBASE_PROJECT_ID || "windowerp-3",
  storageBucket: process.env.REACT_APP_FIREBASE_STORAGE_BUCKET || "windowerp-3.appspot.com",
  messagingSenderId: process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID || "796704494096",
  appId: process.env.REACT_APP_FIREBASE_APP_ID || "1:796704494096:web:XXXXXXXXXXXXXXXXXXXX"
};

// Firebase 앱 초기화
const app = initializeApp(firebaseConfig);

// Firebase 서비스들 초기화
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);
export const realtimeDb = getDatabase(app);
export const functions = getFunctions(app);

// 개발 환경에서 에뮬레이터 사용
if (process.env.NODE_ENV === 'development') {
  // Firestore 에뮬레이터
  connectFirestoreEmulator(db, 'localhost', 8080);
  
  // Functions 에뮬레이터
  connectFunctionsEmulator(functions, 'localhost', 5001);
  
  // Storage 에뮬레이터
  connectStorageEmulator(storage, 'localhost', 9199);
  
  // Realtime Database 에뮬레이터
  connectDatabaseEmulator(realtimeDb, 'localhost', 9000);
}

export default app; 