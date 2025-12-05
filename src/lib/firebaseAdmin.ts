// src/lib/firebaseAdmin.ts
import admin from 'firebase-admin';

const getServiceAccount = () => {
  const b64 = process.env.FIREBASE_ADMIN_SA || '';
  if (!b64) {
    // Return null if missing (e.g. during build)
    return null;
  }
  try {
    return JSON.parse(Buffer.from(b64, 'base64').toString('utf8'));
  } catch (e) {
    console.error('Failed to parse FIREBASE_ADMIN_SA', e);
    return null;
  }
};

if (!admin.apps.length) {
  const svc = getServiceAccount();
  if (svc) {
    admin.initializeApp({ credential: admin.credential.cert(svc) });
  } else {
    // Fallback for build/dev where SA might be missing
    // Try default init (picks up GOOGLE_APPLICATION_CREDENTIALS or other envs)
    // or just don't crash immediately
    try {
      admin.initializeApp();
    } catch (e) {
      console.warn('Firebase admin default init failed, some features may not work:', e);
    }
  }
}

export default admin;