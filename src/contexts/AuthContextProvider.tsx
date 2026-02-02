'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { onAuthStateChanged, signOut as fbSignOut, User as FBUser } from 'firebase/auth';
import { getFirebaseAuth } from '@/firebase/client';
import { apiClient } from '@/lib/apiClient';
import { getApiBaseUrl } from '@/lib/api-utils';
import { withTimeout } from '@/lib/utils';

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
    firstName?: string;
    lastName?: string;
    avatarUrl?: string;
    institutionId?: string;
    departmentId?: string;
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

const getRoleFromEmail = (email: string): Role => {
    const lowerEmail = email.toLowerCase();
    if (lowerEmail === 'media@thaibagarden.com') return 'admin';
    if (lowerEmail === 'anumadmax@gmail.com' || lowerEmail === 'kmspallikkunnu@gmail.com') return 'team';
    return 'guest';
};

export const AuthProvider: React.FC<{ children: React.ReactNode; disableBackend?: boolean }> = ({ children, disableBackend }) => {
    const [user, setUser] = useState<AuthUser | null>(null);
    const [loading, setLoading] = useState(true);
    const [claimsReady, setClaimsReady] = useState(false);
    const [authStatus, setAuthStatus] = useState<AuthUserStatus>('unauthenticated');



    useEffect(() => {
        // --- TEST/CI BYPASS ---
        // Only active in development/test environments.
        // Controlled by a specific localStorage flag injected by E2E tests.
        if (typeof window !== 'undefined' &&
            localStorage.getItem('playwright_test_auth') === 'true' &&
            process.env.NODE_ENV === 'development') {
            console.warn('[AUTH][TEST-BYPASS] Active: Injecting test-only authenticated session.');
            const testUser: AuthUser = {
                uid: 'test-ci-user-123',
                email: 'ci-test@thaibagarden.com',
                name: 'CI Invariant Tester',
                role: 'admin',
                isAdmin: true,
                isTeam: true,
                isSuperAdmin: true,
                institutionId: 'test-inst',
                departmentId: 'test-dept',
                avatarUrl: 'https://ui-avatars.com/api/?name=CI+Test'
            };

            setUser(testUser);
            setAuthStatus('authenticated');
            setLoading(false);
            setClaimsReady(true);
            (window as any).authReady = true;
            window.dispatchEvent(new CustomEvent('auth:ready'));
            return;
        }

        if (disableBackend) {
            console.log('[DEV] API boot skipped — using LOCAL MOCK USER (Admin)');

            // Mock Authenticated User (Admin by default)
            // 🔒 GUARDRAIL 1: Mock user must stay obviously fake.
            // Never use real PROD emails or UIDs here to prevent accidents.
            const mockUser: AuthUser = {
                uid: 'dev-mock-admin',
                email: 'admin@local.dev',
                name: 'Local Admin',
                role: 'admin',
                isAdmin: true,
                isTeam: true,
                isSuperAdmin: true,
                institutionId: '1',
                departmentId: '1',
                avatarUrl: 'https://ui-avatars.com/api/?name=Local+Admin&background=0D8ABC&color=fff'
            };

            setUser(mockUser);
            setAuthStatus('authenticated');
            setLoading(false);
            setClaimsReady(true);

            // Dispatch ready anyway for UI that listens
            if (typeof window !== 'undefined') {
                (window as any).authReady = true;
                window.dispatchEvent(new CustomEvent('auth:ready'));
            }
            return;
        }

        let unsub: (() => void) | undefined;
        const bootStart = Date.now();
        console.log(`[BOOT][STEP] Auth Initialization Started at ${new Date().toISOString()}`);

        // Global Safety Timeout to prevent infinite loading
        const safetyTimeout = setTimeout(() => {
            if (loading) {
                console.error('[AUTH] Critical: Auth initialization timed out. Forcing completion.');
                setLoading(false);
                if (typeof window !== 'undefined') {
                    (window as any).authReady = true;
                    window.dispatchEvent(new CustomEvent('auth:ready'));
                }
            }
        }, 15000);

        getFirebaseAuth().then((auth) => {
            console.log(`[BOOT][STEP] Firebase Auth Instance Ready in ${Date.now() - bootStart}ms`);
            unsub = onAuthStateChanged(auth, async (fbUser: FBUser | null) => {
                console.log(`[BOOT][STEP] Auth State Changed: ${fbUser ? 'Authenticated' : 'Unauthenticated'}`);

                if (!fbUser) {
                    setUser(null);
                    setAuthStatus('unauthenticated');
                    setLoading(false);
                    clearTimeout(safetyTimeout);
                    return;
                }

                setAuthStatus('authenticating');

                try {
                    let sessionSynced = false;
                    let retries = 3;

                    // Skip session sync if on localhost/capacitor unless we know where API is
                    const skipSync = !process.env.NEXT_PUBLIC_API_URL && (
                        typeof window !== 'undefined' &&
                        (window.location.protocol === 'capacitor:' || window.location.protocol === 'file:')
                    );

                    if (!skipSync) {
                        while (!sessionSynced && retries > 0) {
                            try {
                                const idToken = await withTimeout(fbUser.getIdToken(), 10000, 'Firebase ID Token');
                                const envBaseUrl = getApiBaseUrl();
                                // if getApiBaseUrl returns '', it's web. If it returns null, it's mobile without URL.
                                // Web ALWAYS uses relative path.
                                const effectiveUrl = '/api/auth/login';

                                const loginRes = await withTimeout(apiClient(effectiveUrl, {
                                    method: 'POST',
                                    headers: { 'Authorization': `Bearer ${idToken}` }
                                }), 5000, 'Session Sync Fetch');

                                console.log('[AUTH] apiClient response:', !!loginRes);

                                // apiClient returns the parsed body and throws on non-2xx
                                if (loginRes) {
                                    console.log('[AUTH] Session sync successful');
                                    sessionSynced = true;
                                } else {
                                    retries--;
                                    if (retries > 0) await new Promise(resolve => setTimeout(resolve, 500));
                                }
                            } catch (err) {
                                console.warn('[AUTH] Session sync warning:', err);
                                if (!navigator.onLine) break;
                                retries--;
                                if (retries > 0) await new Promise(resolve => setTimeout(resolve, 500));
                            }
                        }
                    } else {
                        console.log('[AUTH] Skipping session sync on static/native build (no API URL)');
                    }

                    const email = fbUser.email || '';
                    const idTokenResult = await fbUser.getIdTokenResult();

                    let userData: any = {};
                    try {
                        const result = await withTimeout(apiClient('/api/users/me', {
                            method: 'GET',
                            silent: true
                        }), 5000, '/api/users/me');
                        userData = result.user || result || {};
                    } catch (error) {
                        // Ignore error, fallback to claims
                        console.warn('[AUTH] Failed to fetch user profile, using claims/fallback');
                    }

                    const fallbackRole = getRoleFromEmail(email);
                    let effectiveRole: Role = userData.role;

                    if (!effectiveRole) {
                        if (fallbackRole !== 'guest') effectiveRole = fallbackRole;
                        else if (idTokenResult.claims.admin) effectiveRole = 'admin';
                        else if (idTokenResult.claims.isTeam) effectiveRole = 'team';
                        else effectiveRole = 'guest';
                    }

                    const newUser: AuthUser = {
                        uid: fbUser.uid,
                        email: fbUser.email,
                        name: fbUser.displayName || userData.name || email.split('@')[0],
                        role: effectiveRole,
                        isAdmin: !!idTokenResult.claims.admin || effectiveRole === 'admin',
                        isTeam: !!idTokenResult.claims.isTeam || effectiveRole === 'team',
                        isSuperAdmin: !!idTokenResult.claims.superAdmin,
                        defaultDepartment: userData.defaultDepartment,
                        defaultInstitution: userData.defaultInstitution,
                        institutionId: userData.institutionId || userData.defaultInstitution,
                        departmentId: userData.departmentId || userData.defaultDepartment,
                        officialName: userData.officialName,
                        avatarUrl: userData.avatarUrl || fbUser.photoURL || undefined,
                    };

                    setUser(newUser);
                    console.log('[AUTH] Setting status to AUTHENTICATED for:', newUser.uid);
                    setAuthStatus('authenticated');
                    setClaimsReady(true);
                } catch (e) {
                    console.error('Auth sync error', e);
                    const email = fbUser.email || '';
                    const fallbackRole = getRoleFromEmail(email);
                    setUser({
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
                clearTimeout(safetyTimeout);
                if (typeof window !== 'undefined') {
                    (window as any).authReady = true;
                    window.dispatchEvent(new CustomEvent('auth:ready'));
                }
            });
        }).catch((error) => {
            console.error('Error setting up auth:', error);
            setLoading(false);
            clearTimeout(safetyTimeout);
        });

        return () => {
            unsub?.();
            clearTimeout(safetyTimeout);
        };
    }, []);

    const signOut = async () => {
        if (typeof window !== 'undefined') {
            localStorage.removeItem('playwright_test_auth');
        }
        if (disableBackend) {
            // 🔒 GUARDRAIL 2: SignOut must be a no-op/reload in mock mode.
            // Logging out would drop state to 'unauthenticated', which renders LoginInline.
            // Since backend is disabled, LoginInline would be broken/stuck.
            // Reloading resets the mock auth state correctly.
            console.warn('[DEV] SignOut disabled in local mock mode to prevent login-screen render. Reloading...');
            window.location.reload();
            return;
        }
        try {
            const auth = await getFirebaseAuth();
            await fbSignOut(auth);
            // Attempt server logout but don't block
            apiClient('/api/auth/logout', { method: 'POST' }).catch(() => { });

            setUser(null);
            setAuthStatus('unauthenticated');
        } catch (error) {
            console.error('Sign out error', error);
            setUser(null);
            setAuthStatus('unauthenticated');
        }
    };

    const getIdToken = async (): Promise<string | null> => {
        if (disableBackend) return "mock-jwt-token";
        try {
            const auth = await getFirebaseAuth();
            return auth.currentUser?.getIdToken() || null;
        } catch (error) {
            return null;
        }
    };

    return (
        <AuthContext.Provider value={{ user, loading, claimsReady, authStatus, signOut, getIdToken }}>
            {children}
        </AuthContext.Provider>
    );
};

export function useAuth() {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
}
