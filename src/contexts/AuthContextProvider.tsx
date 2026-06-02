"use client";

import { createContext, useContext, useEffect, useState, useCallback, useRef } from "react";
import { supabase } from "@/lib/supabaseClient";
import { cancelAllRequests, apiClient } from "@/lib/apiClient";
import { User } from "@/types/user";
import { useQueryClient } from "@tanstack/react-query";
import { OnboardingService } from "@/services/onboardingService";
import { offlineDB } from "@/lib/offline/db";

const TIMEOUT_MS = 30000;
const timeout = (ms: number) => new Promise((_, reject) => setTimeout(() => reject(new Error(`TIMEOUT_${ms}`)), ms));


type AuthContextType = {
    user: User | null;
    loading: boolean;
    authReady: boolean;     // true once the initial session check is complete
    authStatus: 'loading' | 'authenticated' | 'unauthenticated';
    authResolved: boolean;
    recoveryMode: boolean;
    setRecoveryMode: (mode: boolean) => void;
    login: (email: string, password: string) => Promise<void>;
    signup: (email: string, password: string, metadata?: Record<string, any>) => Promise<void>;
    logout: () => Promise<void>;
    signOut: () => Promise<void>;
    getIdToken: () => Promise<string | null>;
    refreshUser: () => Promise<void>;
    updateProfile: (updates: any) => Promise<void>;
};

export type AuthUser = User;

export const AuthContext = createContext<AuthContextType | null>(null);

let sessionPromise: Promise<string | null> | null = null;
let cachedSessionToken: string | null = null;

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);
    const [recoveryMode, setRecoveryMode] = useState(false);
    const prefetchedRef = useRef(false);
    const queryClient = useQueryClient();

    // Derived states for backward compatibility with downstream components
    const authResolved = !loading;
    const authStatus = loading ? 'loading' : user ? 'authenticated' : 'unauthenticated';

    const sanitizeUrl = useCallback(() => {
        if (typeof window === 'undefined') return;
        const hash = window.location.hash;
        if (hash.includes('access_token') || hash.includes('refresh_token') || hash.includes('type=recovery')) {
            console.log('[Auth] Sanitizing URL hash fragments');
            window.history.replaceState(null, "", window.location.pathname + window.location.search);
        }
    }, []);

    useEffect(() => {
        let mounted = true;

        // 1. Global Hash Scrubber (App Load)
        const scrubberTimeout = setTimeout(() => {
            if (typeof window !== 'undefined' && window.location.hash) {
                const h = window.location.hash;
                if (h.includes('access_token') || h.includes('refresh_token') || h.includes('type=recovery')) {
                    const isRecovery = h.includes('type=recovery');
                    if (isRecovery && mounted) {
                        setRecoveryMode(true);
                    }
                    sanitizeUrl();
                }
            }
        }, 500);



        // 2. Initial Session Check (Single-run pattern)
        const init = async () => {

            try {
                console.log("[BOOT] Checking session...");

                // Detect recovery mode early from URL hash/params
                if (typeof window !== 'undefined') {
                    const hash = window.location.hash;
                    const search = window.location.search;
                    if (hash.includes('type=recovery') || search.includes('recovery=true')) {
                        console.log('[BOOT] Recovery mode detected early');
                        setRecoveryMode(true);
                    }
                }

                // Wrap session fetch in timeout
                const sessionResult = await Promise.race([
                    supabase.auth.getSession(),
                    timeout(TIMEOUT_MS)
                ]).catch(err => {
                    console.warn("[BOOT] Session check timed out or failed:", err);
                    return { data: { session: null } };
                }) as any;

                const session = sessionResult?.data?.session;

                if (!mounted) return;

                if (!session?.user) {
                    console.log("[BOOT] No session found");
                    setUser(null);
                    return;
                }

                console.log("[BOOT] Session found for user:", session.user.id, "fetching profile...");
                
                let profileData = null;
                let profileRetryCount = 0;
                const maxProfileRetries = 2;

                const getProfile = async (): Promise<any> => {
                    try {
                        const { data: profile, error: profileErr } = await Promise.race([
                            supabase
                                .from("profiles")
                                .select("*")
                                .eq("id", session.user.id)
                                .maybeSingle(),
                            timeout(TIMEOUT_MS)
                        ]).catch(err => ({ data: null, error: err })) as any;

                        if (profileErr) throw profileErr;
                        return profile;
                    } catch (err: any) {
                        const isAbort = err?.name === 'AbortError' || err?.message?.includes('Lock broken') || err?.message?.includes('TIMEOUT');
                        if (isAbort && profileRetryCount < maxProfileRetries && mounted) {
                            profileRetryCount++;
                            console.warn(`[BOOT] Profile fetch aborted/timed out (attempt ${profileRetryCount}), retrying...`);
                            await new Promise(res => setTimeout(res, 500 * profileRetryCount));
                            return getProfile();
                        }
                        console.error("[BOOT] Profile fetch error:", err?.message || err);
                        return null;
                    }
                };

                const profile = await getProfile();

                if (!mounted) return;

                if (profile) {
                    console.log("[BOOT] Profile loaded");
                    // Cache profile for offline use
                    await offlineDB.saveProfile(profile);
                    // Auto-link any pending invites for this existing user
                    OnboardingService.autoLinkWorkspaces(session.user.id, session.user.email || '');
                } else {
                    console.warn("[BOOT] No profile found, checking cache...");
                    const cached = await offlineDB.getProfile(session.user.id);
                    if (cached) profileData = cached;
                }
                
                // Use profileData if profile is null but cache exists
                const finalProfile = profile || profileData;

                const uid = finalProfile?.uid || finalProfile?.id || session.user.id;
                // Fetch institution roles (Optional - don't block if fails)
                let institutionRoles: Record<string, string> = {};
                try {
                    const { data: roles } = await Promise.race([
                        supabase
                            .from("user_institutions")
                            .select("institution_id, role")
                            .eq("user_id", session.user.id),
                        timeout(5000) // 5s max for roles
                    ]) as any;
                    
                    if (roles) {
                        roles.forEach((r: any) => institutionRoles[r.institution_id] = r.role);
                    }
                } catch (e) {
                    console.warn("[BOOT] Failed to fetch institution roles", e);
                }

                // Derived tenant_id fallback
                const tenantId = finalProfile?.tenantId || finalProfile?.tenant_id || 
                               session.user.app_metadata?.tenant_id || 
                               session.user.user_metadata?.tenant_id;

                setUser({
                    uid,
                    id: uid,
                    email: finalProfile?.email || session.user.email || '',
                    name: finalProfile?.name || finalProfile?.full_name || 'User',
                    role: (finalProfile?.role || session.user.app_metadata?.role || 'member').toLowerCase() === 'guest' ? 'member' : (finalProfile?.role || session.user.app_metadata?.role || 'member') as any,
                    institution_id: finalProfile?.institution_id || session.user.app_metadata?.institution_id,
                    allowed_institutions: finalProfile?.allowed_institutions || [],
                    institutionRoles,
                    tenant_id: tenantId,
                    department_id: finalProfile?.department_id,
                    avatar_url: finalProfile?.avatar_url,
                    photoURL: finalProfile?.avatar_url,
                    avatar_drive_id: finalProfile?.avatar_drive_id,
                });

            } catch (err: any) {
                console.error("[BOOT] Auth initialization critical failure:", err);
                if (mounted) setUser(null);
            } finally {
                if (mounted) {
                    console.log("[BOOT] Auth ready");
                    setLoading(false);
                }
            }
        };

        init();

        // 3. Singleton Auth Listener
        const { data: listener } = supabase.auth.onAuthStateChange(
            async (event: any, session: any) => {

                console.log("[SUPABASE TRACE] onAuthStateChange event:", event)

                if (event === "PASSWORD_RECOVERY") {
                    if (mounted) setRecoveryMode(true);
                    sanitizeUrl();
                }

                if (event === "SIGNED_IN") {
                    sanitizeUrl();
                }

                if (!session?.user) {
                    if (event === "SIGNED_OUT") {
                        cancelAllRequests();
                        sanitizeUrl();
                    }
                    if (mounted) {
                        setUser(null);
                        setRecoveryMode(false);
                        setLoading(false);
                    }
                    return;
                }

                // If user changed or session refreshed, update profile
                let retryCount = 0;
                const maxRetries = 2;

                const fetchProfileWithRetry = async () => {
                    let profileData = null;
                    try {
                        console.log(`[AUTH LISTENER] Fetching profile (attempt ${retryCount + 1})...`);
                        const { data: profile, error: profileErr } = await Promise.race([
                            supabase
                                .from("profiles")
                                .select("*")
                                .eq("id", session.user.id)
                                .maybeSingle(),
                            timeout(TIMEOUT_MS)
                        ]).catch(err => ({ data: null, error: err })) as any;

                        if (!mounted) return;

                        if (profileErr) throw profileErr;

                        if (profile) {
                            console.log("[AUTH LISTENER] Profile loaded");
                            await offlineDB.saveProfile(profile);
                            // Auto-link any pending invites for this existing user
                            OnboardingService.autoLinkWorkspaces(session.user.id, session.user.email || '');
                        } else {
                            const cached = await offlineDB.getProfile(session.user.id);
                            if (cached) profileData = cached;
                        }

                        const finalProfile = profile || profileData;

                        // Fetch institution roles
                        const { data: roles } = await supabase
                            .from("user_institutions")
                            .select("institution_id, role")
                            .eq("user_id", session.user.id);
                        
                        const institutionRoles: Record<string, string> = {};
                        if (roles) {
                            roles.forEach((r: any) => institutionRoles[r.institution_id] = r.role);
                        }

                        const uid = profile?.uid || profile?.id || session.user.id;
                        setUser({
                            uid,
                            id: uid,
                            email: finalProfile?.email || session.user.email || '',
                            name: finalProfile?.name || finalProfile?.full_name || 'User',
                            role: (finalProfile?.role || 'member').toLowerCase() === 'guest' ? 'member' : (finalProfile?.role || 'member') as any,
                            institution_id: finalProfile?.institution_id,
                            allowed_institutions: finalProfile?.allowed_institutions || [],
                            institutionRoles,
                            tenant_id: finalProfile?.tenantId || finalProfile?.tenant_id,
                            department_id: finalProfile?.department_id,
                            avatar_url: finalProfile?.avatar_url,
                            photoURL: finalProfile?.avatar_url,
                            avatar_drive_id: finalProfile?.avatar_drive_id,
                        });
                    } catch (err: any) {
                        const isAbort = err?.name === 'AbortError' || err?.message?.includes('Lock broken') || err?.message?.includes('TIMEOUT');
                        
                        if (isAbort && retryCount < maxRetries && mounted) {
                            retryCount++;
                            console.warn(`[AUTH LISTENER] Profile fetch aborted/timed out, retrying in ${500 * retryCount}ms...`, err?.message || err);
                            await new Promise(res => setTimeout(res, 500 * retryCount));
                            return fetchProfileWithRetry();
                        }

                        console.error("[AUTH LISTENER] Profile fetch failed final:", err?.message || err);
                        if (mounted) {
                            setUser({
                                uid: session.user.id,
                                id: session.user.id,
                                email: session.user.email || '',
                                name: 'User',
                                role: 'member'
                            });
                        }
                    } finally {
                        if (mounted) setLoading(false);
                    }
                };

                fetchProfileWithRetry();
            }
        );

        return () => {
            mounted = false;
            clearTimeout(scrubberTimeout);
            listener.subscription.unsubscribe();
        };
    }, [sanitizeUrl]);

    const login = async (email: string, password: string) => {
        setLoading(true);
        try {
            console.log("[SUPABASE TRACE] signInWithPassword start for:", email);
            
            // Safety timeout for the auth request itself
            const { error } = await Promise.race([
                supabase.auth.signInWithPassword({
                    email,
                    password,
                }),
                timeout(TIMEOUT_MS)
            ]) as any;

            console.log("[SUPABASE TRACE] signInWithPassword finished");

            if (error) {
                console.error("[LOGIN] Supabase error:", error);
                setLoading(false);
                
                // Enhance the generic 'Failed to fetch' error with configuration advice
                if (error.message === 'Failed to fetch' || error.name === 'AuthRetryableFetchError') {
                    const enhancedError = new Error('Connection failed: Please verify your Supabase URL and network connection.');
                    (enhancedError as any).originalError = error;
                    throw enhancedError;
                }
                
                throw error;
            }
            
            // Success! The onAuthStateChange will take over the redirect
            console.log("[LOGIN] Success, waiting for session state change...");
        } catch (err: any) {
            setLoading(false);
            console.error("[LOGIN] Catch block error:", err);
            throw err;
        }
    };

    const signup = async (email: string, password: string, metadata?: Record<string, any>) => {
        console.log("[SUPABASE TRACE] signUp start for:", email);
        const { error } = await Promise.race([
            supabase.auth.signUp({
                email,
                password,
                options: {
                    data: metadata
                }
            }),
            timeout(TIMEOUT_MS)
        ]) as any;

        if (error) {
            console.error("[SIGNUP] Supabase error:", error);
            throw error;
        }
        console.log("[SIGNUP] Success");
    };

    const logout = async () => {
        try {
            setLoading(true);
            console.log("[SUPABASE TRACE] signOut start")
            
            // Await the actual sign out before clearing local state
            // This prevents race conditions where a hard navigation (window.location.href)
            // cancels the sign-out request if it's still pending.
            await Promise.race([
                supabase.auth.signOut(),
                new Promise(res => setTimeout(res, 3000)) // 3s fallback
            ]);
            
            console.log("[SUPABASE TRACE] signOut end")

            // Clear React Query cache and remove from localStorage on logout
            queryClient.clear();
            if (typeof window !== 'undefined') {
                // MANUALLY purge Supabase keys to prevent session re-hydration loops
                Object.keys(localStorage).forEach(key => {
                    if (key.startsWith('sb-')) {
                        localStorage.removeItem(key);
                    }
                });
                
                localStorage.removeItem('REACT_QUERY_OFFLINE_CACHE');
                localStorage.removeItem('mediahive_workspace');
                localStorage.removeItem('mediahive_onboarding_complete');
            }

            cancelAllRequests();
            
            setUser(null);
            setRecoveryMode(false);
            setLoading(false);
        } catch (err) {
            console.error("[Auth] Logout failed:", err);
            setUser(null);
            setLoading(false);
            setRecoveryMode(false);
        }
    };

    const signOut = logout;

    const getIdToken = async () => {
        if (cachedSessionToken) {
            console.log("[AUTH TRACE] getIdToken using cached token");
            return cachedSessionToken;
        }
        if (sessionPromise) {
            console.log("[AUTH TRACE] getIdToken waiting for existing promise");
            return sessionPromise;
        }

        console.log("[AUTH TRACE] getIdToken fetching new session...");
        sessionPromise = (async () => {
            try {
                console.log("[SUPABASE TRACE] getSession (getIdToken singleton) start")
                const { data: { session } } = await supabase.auth.getSession();
                console.log("[SUPABASE TRACE] getSession (getIdToken singleton) end")
                const token = session?.access_token || null;
                console.log("[AUTH TRACE] getIdToken result:", token ? "Token acquired" : "No token found");
                cachedSessionToken = token;
                return token;
            } catch (err) {
                console.error("[Auth] getIdToken failed:", err);
                return null;
            } finally {
                sessionPromise = null;
            }
        })();

        return sessionPromise;
    };

    const prefetchDashboardData = async () => {
        if (prefetchedRef.current) return;
        prefetchedRef.current = true;

        // Small delay to ensure session is active
        setTimeout(() => {
            console.log("[DATA TRACE] Dashboard data prefetch via React Query...");
            // We don't prefetch tasks/events here anymore because legacy API routes are gone.
            // Downstream hooks (useTasks, useEvents) now handle their own Supabase-direct fetching.
        }, 1000);
    };

    useEffect(() => {
        if (user && !loading) {
            prefetchDashboardData();
            
            // Wire user context to Sentry
            import("@/services/monitoringService").then(({ MonitoringService }) => {
                MonitoringService.setUserContext({
                    id: user.uid,
                    email: user.email,
                    full_name: user.name,
                    role: user.role,
                    tenant_id: user.tenant_id,
                    institution_id: user.institution_id
                });
            }).catch(err => console.error("[Sentry] Failed to set user context:", err));

            // Lazy load and register Web FCM token
            import("@/services/fcmService").then(({ initFcm }) => {
                initFcm(user.uid).catch(err => {
                    console.error("[FCM] Push initialization failed:", err);
                });
            });
        } else if (!user) {
            prefetchedRef.current = false; // Reset on logout
            // Clear Sentry context
            import("@/services/monitoringService").then(({ MonitoringService }) => {
                MonitoringService.clearUserContext();
            }).catch(err => console.error("[Sentry] Failed to clear user context:", err));
        }
    }, [user, loading]);

    const refreshUser = async () => {
        console.log("[SUPABASE TRACE] getSession (refreshUser) start")
        const { data: { session } } = await supabase.auth.getSession();
        console.log("[SUPABASE TRACE] getSession (refreshUser) end")
        if (session?.user) {
            let profileRetryCount = 0;
            const maxProfileRetries = 2;

            const getProfile = async (): Promise<any> => {
                try {
                    const { data: profile, error: profileErr } = await Promise.race([
                        supabase
                            .from("profiles")
                            .select("*")
                            .eq("id", session.user.id)
                            .maybeSingle(),
                        timeout(TIMEOUT_MS)
                    ]).catch(err => ({ data: null, error: err })) as any;

                    if (profileErr) throw profileErr;
                    return profile;
                } catch (err: any) {
                    const isAbort = err?.name === 'AbortError' || err?.message?.includes('Lock broken') || err?.message?.includes('TIMEOUT');
                    if (isAbort && profileRetryCount < maxProfileRetries) {
                        profileRetryCount++;
                        console.warn(`[REFRESH] Profile fetch aborted/timed out (attempt ${profileRetryCount}), retrying...`);
                        await new Promise(res => setTimeout(res, 500 * profileRetryCount));
                        return getProfile();
                    }
                    console.error("[REFRESH] Profile fetch error:", err?.message || err);
                    return null;
                }
            };

            const profile = await getProfile();

            // Fetch institution roles
            const { data: roles } = await supabase
                .from("user_institutions")
                .select("institution_id, role")
                .eq("user_id", session.user.id);
            
            const institutionRoles: Record<string, string> = {};
            if (roles) {
                roles.forEach((r: any) => institutionRoles[r.institution_id] = r.role);
            }

            const uid = profile?.uid || profile?.id || session.user.id;
            setUser({
                uid,
                id: uid,
                email: profile?.email || session.user.email || '',
                name: profile?.name || profile?.full_name || 'User',
                role: (profile?.role || 'member').toLowerCase() === 'guest' ? 'member' : (profile?.role || 'member') as any,
                institution_id: profile?.institution_id,
                allowed_institutions: profile?.allowed_institutions || [],
                institutionRoles,
                tenant_id: profile?.tenantId || profile?.tenant_id,
                department_id: profile?.department_id,
                avatar_url: profile?.avatar_url,
                photoURL: profile?.avatar_url,
                avatar_drive_id: profile?.avatar_drive_id,
            });
        } else {
            setUser(null);
        }
    };

    return (
        <AuthContext.Provider value={{
            user,
            loading,
            authReady: !loading,
            authStatus,
            authResolved,
            recoveryMode,
            setRecoveryMode,
            login,
            signup,
            logout,
            signOut,
            getIdToken,
            refreshUser,
            updateProfile: async (updates: any) => {
                if (!user?.uid) return;
                
                // Map 'name' to 'full_name' if present for database compatibility
                const dbUpdates = { ...updates };
                if (dbUpdates.name && !dbUpdates.full_name) {
                    dbUpdates.full_name = dbUpdates.name;
                    delete dbUpdates.name;
                }

                const { error } = await supabase
                    .from('profiles')
                    .update(dbUpdates)
                    .eq('id', user.uid);
                
                if (error) {
                    console.error("[Auth] updateProfile error:", error);
                    throw error;
                }
                await refreshUser();
            }
        }}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (!context) throw new Error("useAuth must be used within AuthProvider");
    return context;
}
