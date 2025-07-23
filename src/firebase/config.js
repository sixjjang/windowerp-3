import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore, connectFirestoreEmulator } from 'firebase/firestore';
import { getStorage, connectStorageEmulator } from 'firebase/storage';
import { getDatabase, connectDatabaseEmulator } from 'firebase/database';
import { getFunctions, connectFunctionsEmulator } from 'firebase/functions';

const firebaseConfig = {
  apiKey: "AIzaSyAVlnOIVPulJKUI5XGnVtPtKGqsvkP19So",
  authDomain: "windowerp-3.firebaseapp.com",
  databaseURL: "https://windowerp-3-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "windowerp-3",
  storageBucket: "windowerp-3.firebasestorage.app",
  messagingSenderId: "796704494096",
  appId: "1:796704494096:web:167ec73d8bc4d87634f095",
  measurementId: "G-PZZYGK5SVC"
};

// Firebase 앱 초기화
const app = initializeApp(firebaseConfig);

// Firebase 서비스들 초기화
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);
export const realtimeDb = getDatabase(app);
export const functions = getFunctions(app);

// 개발 환경에서도 실제 Firebase 서버 사용 (에뮬레이터 비활성화)
// if (process.env.NODE_ENV === 'development') {
//   // Firestore 에뮬레이터
//   connectFirestoreEmulator(db, 'localhost', 8080);
//   
//   // Functions 에뮬레이터
//   connectFunctionsEmulator(functions, 'localhost', 5001);
//   
//   // Storage 에뮬레이터
//   connectStorageEmulator(storage, 'localhost', 9199);
//   
//   // Realtime Database는 실제 Firebase 서버 사용 (에뮬레이터 연결 제거)
//   // connectDatabaseEmulator(realtimeDb, 'localhost', 9000);
// }

export default app; 