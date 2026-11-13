const admin = require('firebase-admin');
const fs = require('fs');
const path = require('path');

let db = null;
let auth = null;
let isFirestoreAvailable = false;

function initFirebase() {
  if (isFirestoreAvailable) return true;

  try {
    // 1. Check specified path in env
    const specifiedPath = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;
    if (specifiedPath && fs.existsSync(path.resolve(specifiedPath))) {
      const serviceAccount = require(path.resolve(specifiedPath));
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount)
      });
      db = admin.firestore();
      auth = admin.auth();
      isFirestoreAvailable = true;
      console.log('Firebase Admin initialized via specified service account file.');
      return true;
    }

    // 2. Auto-discover standard serviceAccountKey.json in backend directory
    const defaultJsonPath = path.join(__dirname, '..', 'serviceAccountKey.json');
    if (fs.existsSync(defaultJsonPath)) {
      const serviceAccount = require(defaultJsonPath);
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount)
      });
      db = admin.firestore();
      auth = admin.auth();
      isFirestoreAvailable = true;
      console.log('Firebase Admin auto-discovered serviceAccountKey.json in backend folder.');
      return true;
    }

    // 3. Auto-discover any firebase-adminsdk json file in backend directory
    const backendDir = path.join(__dirname, '..');
    const files = fs.readdirSync(backendDir);
    const matchedFile = files.find(f => f.endsWith('.json') && (f.includes('firebase') || f.includes('adminsdk')));
    if (matchedFile && matchedFile !== 'package.json' && matchedFile !== 'package-lock.json') {
      const serviceAccount = require(path.join(backendDir, matchedFile));
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount)
      });
      db = admin.firestore();
      auth = admin.auth();
      isFirestoreAvailable = true;
      console.log(`Firebase Admin auto-discovered service account file: ${matchedFile}`);
      return true;
    }

    // 4. Check direct environment variables
    const privateKey = process.env.FIREBASE_PRIVATE_KEY
      ? process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n')
      : undefined;

    if (process.env.FIREBASE_PROJECT_ID && process.env.FIREBASE_CLIENT_EMAIL && privateKey) {
      admin.initializeApp({
        credential: admin.credential.cert({
          projectId: process.env.FIREBASE_PROJECT_ID,
          clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
          privateKey: privateKey
        })
      });
      db = admin.firestore();
      auth = admin.auth();
      isFirestoreAvailable = true;
      console.log('Firebase Admin initialized via environment variables.');
      return true;
    }

    // 5. Check Project ID only
    if (process.env.FIREBASE_PROJECT_ID) {
      admin.initializeApp({
        projectId: process.env.FIREBASE_PROJECT_ID
      });
      db = admin.firestore();
      auth = admin.auth();
      isFirestoreAvailable = true;
      console.log('Firebase Admin initialized via Project ID.');
      return true;
    }
  } catch (error) {
    console.warn('Firebase Admin initialization note:', error.message);
  }

  return false;
}

// Initial attempt
initFirebase();

module.exports = {
  admin,
  get db() {
    initFirebase();
    return db;
  },
  get auth() {
    initFirebase();
    return auth;
  },
  isFirestoreAvailable: () => initFirebase()
};
