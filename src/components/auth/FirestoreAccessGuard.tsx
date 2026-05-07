'use client';

import { ReactNode } from 'react';
import { useAuth } from '@/contexts/AuthContextProvider';

interface FirestoreAccessGuardProps {
  children: ReactNode;
  fallback?: ReactNode;
}

const FirestoreAccessGuard = ({
  children,
  fallback = <div className="flex items-center justify-center p-8 text-muted animate-pulse font-mono text-xs">INITIALIZING SECURE SESSION...</div>
}: FirestoreAccessGuardProps) => {
  const { authStatus, user } = useAuth();

  // Log when access is attempted
  console.log('[ACCESS GUARD] authStatus:', authStatus, 'role:', user?.role);

  // Check if user is authenticated
  if (authStatus === 'unauthenticated') {
    console.log('[ACCESS GUARD] Access blocked: User not authenticated');
    return <div className="p-8 text-center text-destructive">Access denied: Professional session required</div>;
  }

  if (authStatus === 'loading') {
    return fallback;
  }

  // Additional check: ensure user has valid role claims
  const hasAccess = user && (['admin', 'manager', 'team', 'member'].includes(user.role) || user.is_super_admin);

  if (!hasAccess) {
    if (user && user.role === 'member') {
      // Members are allowed, but we could add a specialized "Pending" state if we wanted to later.
      // For now, they pass hasAccess.
    }
    console.error('FATAL: Authenticated user has no valid role - unknown state:', user?.uid);
    return <div className="p-8 text-center text-destructive font-bold">FATAL ERROR: Invalid authorization state</div>;
  }

  // Log successful access
  if (user) {
    console.log('[ACCESS GUARD] Access granted for user:', user.uid, 'Role:', user.role);
  }

  return <>{children}</>;
};

export default FirestoreAccessGuard;
