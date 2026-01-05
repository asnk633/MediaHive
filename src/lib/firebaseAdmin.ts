import 'server-only';
import admin from 'firebase-admin';

// Validates that we are running in a server context
if (!process.env.FIREBASE_PROJECT_ID && !process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID) {
  console.warn('Values for FIREBASE_PROJECT_ID (or FIREBASE_ADMIN_PROJECT_ID) are missing.');
}

let adminApp: admin.app.App;

if (admin.apps.length > 0) {
  adminApp = admin.apps[0]!;
} else {
  const projectId = process.env.FIREBASE_ADMIN_PROJECT_ID || process.env.FIREBASE_PROJECT_ID || process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_ADMIN_CLIENT_EMAIL || process.env.FIREBASE_CLIENT_EMAIL || process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
  const privateKey = (process.env.FIREBASE_ADMIN_PRIVATE_KEY || process.env.FIREBASE_PRIVATE_KEY || process.env.GOOGLE_PRIVATE_KEY || '').replace(/\\n/g, '\n');

  if (projectId && clientEmail && privateKey) {
    console.log('[FIREBASE ADMIN] Credentials detected: YES');
    adminApp = admin.initializeApp({
      credential: admin.credential.cert({
        projectId,
        clientEmail,
        privateKey,
      }),
      projectId,
    });
  } else if (process.env.FIREBASE_ADMIN_SA_PATH) {
    // Fallback to Service Account Path
    try {
      const serviceAccount = require(process.env.FIREBASE_ADMIN_SA_PATH);
      console.log('[FIREBASE ADMIN] Credentials detected: YES (SA Path)');
      adminApp = admin.initializeApp({
        credential: admin.credential.cert(serviceAccount)
      });
    } catch (e) {
      console.error('Failed to load service account from path', e);
      throw new Error('Firebase Admin initialization failed: Invalid SA Path');
    }
  } else {
    throw new Error('Firebase Admin initialization failed: Missing credentials (FIREBASE_PROJECT_ID, CLIENT_EMAIL, PRIVATE_KEY)');
  }
}

export const adminAuth = adminApp.auth();
export const adminDb = adminApp.firestore();
export const adminMessaging = adminApp.messaging();

// Legacy compatibility exports if needed, but we prefer direct usage
export const db = adminDb;
export const auth = adminAuth;