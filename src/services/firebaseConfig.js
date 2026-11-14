/**
 * Firebase Service Configuration
 * 
 * Configures connection to Firebase Cloud Storage & Firestore database for
 * Bhasha Library manuscripts, metadata, and reader click telemetry.
 * 
 * Works gracefully in production with live credentials or local preview mode.
 */

export const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || 'MOCK_API_KEY',
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || 'bhasha-library.firebaseapp.com',
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || 'bhasha-library',
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || 'bhasha-library.firebasestorage.app',
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || '1029384756',
  appId: import.meta.env.VITE_FIREBASE_APP_ID || '1:1029384756:web:a1b2c3d4e5f6'
};

export const isFirebaseConfigured = Boolean(
  import.meta.env.VITE_FIREBASE_API_KEY && 
  import.meta.env.VITE_FIREBASE_PROJECT_ID
);

export const FIREBASE_COLLECTIONS = {
  BOOKS: 'manuscripts_catalog',
  CLICK_TELEMETRY: 'reader_clicks',
  RESEARCH_NOTES: 'author_notes'
};
