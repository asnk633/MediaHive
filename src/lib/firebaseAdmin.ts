// src/lib/firebaseAdmin.ts
import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { getMessaging } from 'firebase-admin/messaging';

// Only initialize if no apps exist and we have credentials
if (!getApps().length) {
  // Check if we have the required environment variables
  if (process.env.FIREBASE_PRIVATE_KEY && process.env.FIREBASE_CLIENT_EMAIL) {
    initializeApp({
      credential: cert({
        projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
      }),
    });
  } else {
    // Initialize with default credentials (for development)
    console.warn('Firebase admin credentials not found, using default initialization');
    initializeApp();
  }
}

// Export clients that will work in both environments
export const adminDb = getFirestore();
export const adminMessaging = getMessaging();