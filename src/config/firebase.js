import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import { getAuth } from 'firebase/auth';

// Your web app's Firebase configuration
const firebaseConfig = {
  // Replace with your Firebase config
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID
};

if (import.meta.env.DEV) {
  if (!firebaseConfig.authDomain) {
    console.warn(
      '[BilloAI] VITE_FIREBASE_AUTH_DOMAIN is missing. Auth will fail until you set it (e.g. your-project.firebaseapp.com) and restart the dev server.',
    )
  }
  if (!firebaseConfig.apiKey || !firebaseConfig.projectId) {
    console.warn('[BilloAI] Firebase web config looks incomplete. Check your .env VITE_FIREBASE_* variables.')
  }
}

// Initialize Firebase
let app;
let db;
let storage;
let auth;

try {
  app = initializeApp(firebaseConfig);
  db = getFirestore(app);
  storage = getStorage(app);
  auth = getAuth(app);
} catch (error) {
  console.error('Error initializing Firebase:', error);
}

export { db, storage, auth }; 