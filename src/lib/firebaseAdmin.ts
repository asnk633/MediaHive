// src/lib/firebaseAdmin.ts
import fs from 'node:fs';
import { cert, getApps, initializeApp } from 'firebase-admin/app';

function getServiceAccount() {
  const path = process.env.FIREBASE_ADMIN_SA_PATH;

  if (path && fs.existsSync(path)) {
    // ✅ CI / production path: read from JSON file
    const raw = fs.readFileSync(path, 'utf8');
    try {
      return JSON.parse(raw);
    } catch (err) {
      console.error('Failed to parse service account JSON from FIREBASE_ADMIN_SA_PATH', err);
      throw err;
    }
  }

  const fromEnv = process.env.FIREBASE_ADMIN_SA;
  if (fromEnv) {
    // ✅ Local dev: use env JSON if no path is provided
    try {
      // If it's base64 encoded, decode it first
      if (fromEnv.startsWith('{')) {
        // It's already JSON
        return JSON.parse(fromEnv);
      } else {
        // It's likely base64 encoded
        return JSON.parse(Buffer.from(fromEnv, 'base64').toString('utf8'));
      }
    } catch (err) {
      console.error('Failed to parse FIREBASE_ADMIN_SA env JSON', err);
      throw err;
    }
  }

  throw new Error('Missing Firebase admin credentials: set FIREBASE_ADMIN_SA_PATH or FIREBASE_ADMIN_SA');
}

export function getFirebaseAdminApp() {
  if (getApps().length) return getApps()[0];

  const serviceAccount = getServiceAccount();

  return initializeApp({
    credential: cert(serviceAccount as any),
  });
}

// Initialize the app immediately if not already initialized
if (getApps().length === 0) {
  try {
    getFirebaseAdminApp();
  } catch (e) {
    console.warn('Firebase admin init failed, some features may not work:', e);
  }
}

export default { apps: getApps(), getFirebaseAdminApp };