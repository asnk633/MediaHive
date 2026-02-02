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

// Singleton instance
let firebaseAppInstance: FirebaseApp | undefined;

// Lazy initialization function
export function getFirebaseApp(): FirebaseApp {
  if (firebaseAppInstance) return firebaseAppInstance;

  if (getApps().length === 0) {
    firebaseAppInstance = initializeApp(firebaseConfig);
    console.log('[FIREBASE] App initialized with Project ID:', firebaseAppInstance.options.projectId);
  } else {
    firebaseAppInstance = getApp();
    console.log('[FIREBASE] Using existing app with Project ID:', firebaseAppInstance.options.projectId);
  }

  // HARD RUNTIME GUARD: App crashes immediately if wrong Firebase project is used
  // Only enforce this on the client to avoid crashing build workers when env vars are potentially missing
  const allowedProjectIds = ['thaiba-media-staging', 'media-app-93b73', 'thaiba-media-prod'];
  const currentProjectId = firebaseAppInstance.options.projectId || '';

  // Get Data Mode
  // We can't synchronously import IS_EMULATOR here easily if app.ts is used before config?
  // Actually, config.ts is side-effect free.
  const isEmulator = process.env.NEXT_PUBLIC_DATA_MODE === 'emulator';

  if (!isEmulator && typeof window !== 'undefined' && !allowedProjectIds.includes(currentProjectId)) {
    const errorMsg = `[FIREBASE] CRITICAL ERROR: Expected one of [${allowedProjectIds.join(', ')}], but got '${currentProjectId}'. App will crash to prevent using wrong Firebase project.`;
    console.error(errorMsg);
    throw new Error(errorMsg);
  } else if (typeof window !== 'undefined') {
    if (isEmulator) {
      console.log(`[FIREBASE] 🔧 EMULATOR MODE ACTIVE. Project ID Check Bypassed. (ID: ${currentProjectId})`);
    } else {
      console.log(`[FIREBASE] Confirmed correct project ID: ${currentProjectId}`);
    }
  }

  return firebaseAppInstance;
}

// Default export for backward compatibility (WARN: usage risks top-level init if accessed directly)
// Changing to return the function or null to force refactoring? 
// Better to export the function as default or specific named export.
// Reviewing consumers: auth.ts imports 'firebaseApp' default.
// We should update auth.ts first.
export default getFirebaseApp;