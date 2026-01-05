/*
  Firebase client async-init with stable named exports.
  Ensure getFirebaseAuth and getFirebaseDb are exported as named exports so
  Next.js server routes can statically import them.
*/
import { getAuthService, getDbService, getStorageService } from './auth';
import { auth, db, storage } from './auth';

// Export the instances directly for client-side usage (e.g. AuthContext)
// Note: These may be undefined until initialization completes
export { auth, db, storage };

// Mock init function - export as named export for compatibility
export async function initFirebase() {
  // This is a mock implementation for build purposes
  // The actual initialization happens in auth.ts
  return { app: {}, auth: null, db: null, storage: null }; // Return null values for mock
}

// Export shims so static imports used by app routes do not break during build.
export async function getFirebaseAuth() {
  if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
    console.log('[FIREBASE] getFirebaseAuth called');
  }
  return getAuthService();
}

export async function getFirebaseDb() {
  if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
    // console.log('[FIREBASE] getFirebaseDb called'); // Commented out to reduce noise
  }
  return getDbService();
}

// Export storage service getter
export async function getFirebaseStorage() {
  if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
    console.log('[FIREBASE] getFirebaseStorage called');
  }
  // ARCHITECTURE RULE:
  // UI components must never import or access Firebase Storage for rendering media.
  // Storage is upload-only. Rendering must use Firestore-hosted HTTPS URLs.
  // See: docs/MEDIA_HANDLING_RULES.md
  return getStorageService();
}