'use client';

import { ReactNode } from 'react';
import { useAuth } from '@/contexts/AuthContextProvider';

interface FirestoreAccessGuardProps {
  children: ReactNode;
  fallback?: ReactNode;
}

const FirestoreAccessGuard = ({ 
  children, 
  fallback = <div>Loading secure content...</div> 
}: FirestoreAccessGuardProps) => {
  const { claimsReady, authStatus, user } = useAuth();

  // Log when access is attempted
  console.log('[FIRESTORE ACCESS GUARD] authStatus:', authStatus, 'claimsReady:', claimsReady);

  // Check if user is authenticated and claims are ready
  if (authStatus === 'unauthenticated') {
    console.log('[FIRESTORE] Access blocked: User not authenticated');
    return <div>Access denied: User not authenticated</div>;
  }

  if (authStatus === 'authenticating' || !claimsReady) {
    console.log('[FIRESTORE] Access blocked: Claims not ready');
    return fallback;
  }

  // Additional check: ensure user has valid role claims
  if (user && !user.isAdmin && !user.isTeam && !user.isSuperAdmin) {
    console.error('FATAL: Authenticated user has no valid role claims - invalid authorization state:', user.uid);
    return <div>FATAL ERROR: Invalid authorization state - contact administrator</div>;
  }

  // Log successful access
  if (user) {
    console.log('[FIRESTORE] Access granted for user:', user.uid);
    console.log('[AUTH] Role resolved:', {
      isSuperAdmin: user.isSuperAdmin,
      isAdmin: user.isAdmin,
      isTeam: user.isTeam
    });
  }

  return <>{children}</>;
};

export default FirestoreAccessGuard;
