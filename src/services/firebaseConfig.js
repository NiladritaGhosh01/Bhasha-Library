/**
 * Firebase Service Configuration & Authentication
 * 
 * Configures connection to Firebase Authentication, Cloud Firestore database,
 * and Cloud Storage for Bhasha Library.
 */

import { initializeApp, getApps, getApp } from 'firebase/app';
import { 
  getAuth, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signInWithPopup, 
  GoogleAuthProvider,
  signOut,
  onAuthStateChanged,
  updateProfile
} from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

export const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || 'AIzaSyBn1Fbz74yr9Gaf2ccUKP8JkfVTET3NGIU',
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || 'bhashalibrary-3a11a.firebaseapp.com',
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || 'bhashalibrary-3a11a',
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || 'bhashalibrary-3a11a.firebasestorage.app',
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || '536528249084',
  appId: import.meta.env.VITE_FIREBASE_APP_ID || '1:536528249084:web:07d7984e83df367282f779',
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID || 'G-XR4J7M28ZH'
};

// Initialize Firebase App singleton
export const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
export const auth = getAuth(app);
export const db = getFirestore(app);
export const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({ prompt: 'select_account' });

export const isFirebaseConfigured = Boolean(
  firebaseConfig.apiKey && 
  firebaseConfig.projectId
);

export const FIREBASE_COLLECTIONS = {
  BOOKS: 'manuscripts_catalog',
  CLICK_TELEMETRY: 'reader_clicks',
  RESEARCH_NOTES: 'author_notes'
};

export {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup,
  signOut,
  onAuthStateChanged,
  updateProfile
};
