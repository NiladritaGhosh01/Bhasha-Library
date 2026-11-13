import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || 'AIzaSyDemoDummyKeyForDevelopment12345',
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || 'bhasha-library.firebaseapp.com',
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || 'bhasha-library',
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || 'bhasha-library.appspot.com',
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || '1234567890',
  appId: import.meta.env.VITE_FIREBASE_APP_ID || '1:1234567890:web:abcdef123456'
};

let app = null;
let auth = null;
let googleProvider = null;
let db = null;
let isFirebaseConfigured = false;

try {
  if (import.meta.env.VITE_FIREBASE_API_KEY) {
    app = initializeApp(firebaseConfig);
    auth = getAuth(app);
    googleProvider = new GoogleAuthProvider();
    db = getFirestore(app);
    isFirebaseConfigured = true;
  } else {
    // Development fallback mock
    app = initializeApp(firebaseConfig);
    auth = getAuth(app);
    googleProvider = new GoogleAuthProvider();
    db = getFirestore(app);
  }
} catch (err) {
  console.warn('Firebase client initialization note:', err.message);
}

export { app, auth, googleProvider, db, isFirebaseConfigured };
