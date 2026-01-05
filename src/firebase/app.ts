import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';

// Firebase configuration using environment variables only
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

// Initialize and export the Firebase app with singleton pattern
let firebaseApp: FirebaseApp;

if (getApps().length === 0) {
  firebaseApp = initializeApp(firebaseConfig);
  console.log('[FIREBASE] App initialized with Project ID:', firebaseApp.options.projectId);
} else {
  firebaseApp = getApp();
  console.log('[FIREBASE] Using existing app with Project ID:', firebaseApp.options.projectId);
}

// HARD RUNTIME GUARD: App crashes immediately if wrong Firebase project is used
// HARD RUNTIME GUARD: App crashes immediately if wrong Firebase project is used
const allowedProjectIds = ['thaiba-media-staging', 'media-app-93b73'];
if (!allowedProjectIds.includes(firebaseApp.options.projectId || '')) {
  const errorMsg = `[FIREBASE] CRITICAL ERROR: Expected one of [${allowedProjectIds.join(', ')}], but got '${firebaseApp.options.projectId}'. App will crash to prevent using wrong Firebase project.`;
  console.error(errorMsg);
  throw new Error(errorMsg);
} else {
  console.log(`[FIREBASE] Confirmed correct project ID: ${firebaseApp.options.projectId}`);
}

export { firebaseApp };
export default firebaseApp;