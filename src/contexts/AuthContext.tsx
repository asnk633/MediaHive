'use client';
import React, { createContext, useContext, useEffect, useState } from 'react';
import { onAuthStateChanged, signOut as fbSignOut, User as FBUser } from 'firebase/auth';
import { getFirebaseAuth } from '@/firebase/client';
import { apiClient } from '@/lib/apiClient';

type Role = 'admin' | 'team' | 'guest';

export type AuthUser = {
  uid: string;
  email?: string | null;
  name?: string | null;
  role: Role;
  isAdmin: boolean;
  isTeam: boolean;
  isSuperAdmin: boolean;
  defaultDepartment?: string;
  defaultInstitution?: string;
  officialName?: string;
  avatarUrl?: string; // Phase 0: Ensure avatarUrl is available in session
};

type AuthUserStatus = 'unauthenticated' | 'authenticating' | 'authenticated';

type AuthContextValue = {
  user: AuthUser | null;
  loading: boolean;
  claimsReady: boolean;
  authStatus: AuthUserStatus;
  signOut: () => Promise<void>;
  getIdToken: () => Promise<string | null>;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

// Email-based role assignment
const getRoleFromEmail = (email: string): Role => {
  const lowerEmail = email.toLowerCase();

  // Permanent admin
  if (lowerEmail === 'media@thaibagarden.com') {
    return 'admin';
  }

  // Team members
  if (lowerEmail === 'anumadmax@gmail.com' || lowerEmail === 'kmspallikkunnu@gmail.com') {
    return 'team';
  }

  // Everyone else is guest by default
  return 'guest';
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [claimsReady, setClaimsReady] = useState(false);
  const [authStatus, setAuthStatus] = useState<AuthUserStatus>('unauthenticated');

  useEffect(() => {
    let unsub: (() => void) | undefined;

    getFirebaseAuth().then((auth) => {
      unsub = onAuthStateChanged(auth, async (fbUser: FBUser | null) => {
        if (!fbUser) {
          setUser(null);
          setAuthStatus('unauthenticated');
          setLoading(false);
          return;
        }

        setAuthStatus('authenticating');

        try {
          // 1. Sync session with server (Create Session Cookie) FIRST
          // This ensures subsequent API calls (like /api/users/me) have a valid cookie
          try {
            // Get fresh ID token
            const idToken = await fbUser.getIdToken();
            // We use standard fetch here to avoid circular dep or apiClient overhead before auth is settled
            const loginRes = await fetch('/api/auth/login', {
              method: 'POST',
              headers: {
                'Authorization': `Bearer ${idToken}`
              }
            });

            if (!loginRes.ok) {
              console.warn('Session sync warning:', await loginRes.text());
            }
          } catch (err) {
            console.error('Failed to sync session cookie:', err);
          }

          const email = fbUser.email || '';

          // Get the ID token to check for custom claims
          const idTokenResult = await fbUser.getIdTokenResult();

          // Extract custom claims
          const isAdminClaim = idTokenResult.claims.isAdmin === true;
          const isTeamClaim = idTokenResult.claims.isTeam === true;

          // Try to fetch existing user doc via API
          let userData: any = {};
          try {
            // Hard invariant: Ensure we never call /api/users/{uid} for the current user
            // This prevents the 404 recursion bug
            const endpoint = '/api/users/me';

            if (endpoint.includes('/api/users/') && endpoint !== '/api/users/me') {
              throw new Error('Current user profile must use /api/users/me');
            }

            const result = await apiClient(endpoint, {
              method: 'GET'
            });

            userData = result.user || result || {}; // Handle both wrapped and unwrapped responses
          } catch (error) {
            console.warn("User profile does not exist yet. Waiting for registration flow.");
            // User profile doesn't exist yet, use minimal data
            // Determine role from email as fallback
            const fallbackRole = getRoleFromEmail(email);
            userData = {
              role: fallbackRole,
              email,
              name: fbUser.displayName || email.split('@')[0],
            };
          }

          // Determine role based ONLY from API response (userData)
          // Validation: The API must return a role.
          let effectiveRole: Role = userData.role;

          // Fallback if API didn't return role (e.g. 404 -> userData empty -> fallbackRole)
          if (!effectiveRole) {
            console.warn("No role returned from API, using fallback or claims");

            // 1. Try email fallback (Hardcoded list)
            const fallbackRole = getRoleFromEmail(email);
            if (fallbackRole !== 'guest') {
              effectiveRole = fallbackRole;
              console.log('[AUTH] Role inferred from email whitelist:', effectiveRole);
            }
            // 2. Try claims
            else if (idTokenResult.claims.admin) effectiveRole = 'admin';
            else if (idTokenResult.claims.isTeam) effectiveRole = 'team';
            else effectiveRole = 'guest';
          }

          const newUser = {
            uid: fbUser.uid,
            email: fbUser.email,
            name: fbUser.displayName || userData.name || email.split('@')[0],
            role: effectiveRole, // Use role determined from API
            isAdmin: isAdminClaim,
            isTeam: isTeamClaim,
            isSuperAdmin: idTokenResult.claims.superAdmin === true,
            defaultDepartment: userData.defaultDepartment,
            defaultInstitution: userData.defaultInstitution,
            officialName: userData.officialName,
            avatarUrl: userData.avatarUrl || fbUser.photoURL,
          };
          // Prevent unnecessary re-renders if the user ID hasn't changed (basic check)
          // We can do a deep comparison if needed, but ID + Role is usually enough
          setUser(prev => {
            if (prev && prev.uid === newUser.uid && prev.role === newUser.role && prev.avatarUrl === newUser.avatarUrl) {
              return prev;
            }
            console.log("AuthContext: User changed or initialized:", newUser.uid);
            return newUser;
          });

          // Session sync moved to top of try block


          // Force token refresh to get latest claims - only if seemingly missing or on first load? 
          // aggressive force refresh triggers onAuthStateChanged loop in some SDK versions.
          // We will use getIdTokenResult() which handles refresh if expired.
          try {
            // await fbUser.getIdToken(true); // <--- REMOVED to prevent infinite loop
            const tokenResult = await fbUser.getIdTokenResult();

            console.log('[AUTH CLAIMS]', tokenResult.claims);

            // Verify that required claims are present - Log warning but DO NOT CRASH
            if (!tokenResult.claims.superAdmin && !tokenResult.claims.admin && !tokenResult.claims.isTeam) {
              console.debug('ℹ️ [Auth] Authenticated user has no valid claims yet. Using inferred role:', effectiveRole);
            }

            // Update user with actual claims from token
            setUser(prevUser => {
              if (!prevUser) return prevUser;

              // Use role from API response (userData), or fallback to existing if valid.
              // We strictly trust the API /api/users/me for the role.
              // If userData was fetched earlier, it is in 'userData'. 
              // But 'userData' is closed over from the outer scope.
              // We should probably rely on the user object we set earlier or re-merge.
              // Actually, 'newUser' (set via setUser earlier) used 'effectiveRole' which was inferred.
              // We need to change the INITIAL setUser to use userData.role too.

              const finalRole = userData.role || effectiveRole; // Use effectiveRole if API returned nothing
              console.log('[AUTH] Role resolved from API/DB/Inference:', finalRole);

              return {
                ...prevUser,
                isAdmin: !!tokenResult.claims.admin,
                isTeam: !!tokenResult.claims.isTeam,
                isSuperAdmin: !!tokenResult.claims.superAdmin,
                // Update role based on API data
                role: finalRole
              };
            });

            setAuthStatus('authenticated');
            setClaimsReady(true);
          } catch (tokenError) {
            console.error('Error refreshing token or getting claims:', tokenError);
            // If there's an error refreshing claims, this is a critical issue -> But lets warn instead of crash
            console.warn('Claims refresh failed, proceeding with authenticated state:', fbUser.uid);
            setAuthStatus('authenticated');
            setClaimsReady(true); // Still mark as ready to avoid blocking UI
          }
        } catch (e: any) {
          console.error('Auth role fetch error', e);

          // Fallback: For authenticated users without valid claims, this is an invalid state
          // Custom claims should always exist for authenticated users
          const email = fbUser.email || '';
          console.warn('Authenticated user has no valid role claims (caught error). Proceeding with Email Fallback.', fbUser.uid, email);

          // Re-infer role from email in case of total failure
          const fallbackRole = getRoleFromEmail(email);
          setUser(prev => prev ? prev : {
            uid: fbUser.uid,
            email: fbUser.email,
            name: fbUser.displayName || email.split('@')[0],
            role: fallbackRole,
            isAdmin: fallbackRole === 'admin',
            isTeam: fallbackRole === 'team',
            isSuperAdmin: false,
          });
          setAuthStatus('authenticated');
          setClaimsReady(true);
        }

        setLoading(false);
      });
    }).catch((error) => {
      console.error('Error setting up auth listener:', error);
      setLoading(false);
    });

    return () => {
      if (unsub) {
        unsub();
      }
    };
  }, []);

  const signOut = async () => {
    try {
      const auth = await getFirebaseAuth();
      await fbSignOut(auth);
      // Clear server session
      await fetch('/api/auth/logout', { method: 'POST' });
      setUser(null);
    } catch (error: any) {
      console.error('Error signing out:', error);
      setUser(null);
    }
  };

  const getIdToken = async (): Promise<string | null> => {
    try {
      const auth = await getFirebaseAuth();
      if (!auth.currentUser) return null;
      return auth.currentUser.getIdToken();
    } catch (error) {
      console.error('Error getting ID token:', error);
      return null;
    }
  };

  return <AuthContext.Provider value={{ user, loading, claimsReady, authStatus, signOut, getIdToken }}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
