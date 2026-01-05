/**
 * Authentication and Authorization Logger
 * Provides consistent logging for auth state changes and claims verification
 */

import { User } from 'firebase/auth';

const isDev = process.env.NODE_ENV === 'development';

export function logAuthStateChange(user: User | null) {
  if (!isDev) return;

  console.log('[AUTH] State change:', {
    uid: user?.uid,
    email: user?.email,
    emailVerified: user?.emailVerified,
    isAnonymous: user?.isAnonymous,
    metadata: {
      creationTime: user?.metadata.creationTime,
      lastSignInTime: user?.metadata.lastSignInTime
    }
  });
}

export function logFirebaseClaimsAndRole(claims: any) {
  if (!isDev) return;

  console.log('[FIREBASE] Claims loaded', claims);
  console.log('[AUTH] Role resolved:', deriveRoleFromClaims(claims));
}

export function logFirestoreAccess(user: User, collection: string) {
  if (!isDev) return;

  console.log('[FIRESTORE] Access attempt by user:', {
    uid: user.uid,
    email: user.email,
    collection
  });
}

export function deriveRoleFromClaims(claims: any): string {
  if (claims?.admin === true) return 'admin';
  if (claims?.team === true) return 'team';
  if (claims?.guest === true) return 'guest';
  return 'guest';
}

export function logFatalAuthError(message: string) {
  // Always log fatal errors, even in production
  console.error('[FATAL AUTH ERROR]', message);
}
