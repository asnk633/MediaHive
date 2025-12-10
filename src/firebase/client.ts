/* 
  Firebase client async-init with stable named exports.
  Ensure getFirebaseAuth and getFirebaseDb are exported as named exports so
  Next.js server routes can statically import them.
*/
import { auth } from './auth';
import { db } from './auth';

// Mock init function - export as named export for compatibility
export async function initFirebase() {
  // This is a mock implementation for build purposes
  return { app: {}, auth, db };
}

// Export shims so static imports used by app routes do not break during build.
export function getFirebaseAuth() {
  if (typeof window !== 'undefined') {
    console.log('[FIREBASE] getFirebaseAuth called');
  }
  return Promise.resolve(auth);
}

export function getFirebaseDb() {
  if (typeof window !== 'undefined') {
    console.log('[FIREBASE] getFirebaseDb called');
  }
  return Promise.resolve(db);
}