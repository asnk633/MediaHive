"use client";

import { createContext, useContext, useEffect, useState, useCallback } from "react";
import { supabase } from "@/lib/supabaseClient";
import type { User as BaseUser } from "@supabase/supabase-js";
import { User } from "@/types/user";

type AuthContextType = {
    user: User | null;
    loading: boolean;
    authStatus: 'loading' | 'authenticated' | 'unauthenticated' | 'guest';
    login: (email: string, password: string) => Promise<void>;
    signup: (email: string, password: string) => Promise<void>;
    logout: () => Promise<void>;
    signOut: () => Promise<void>;
    getIdToken: () => Promise<string | null>;
    refreshUser: () => Promise<void>;
};

export type AuthUser = User;

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);
    const [authStatus, setAuthStatus] = useState<'loading' | 'authenticated' | 'unauthenticated' | 'guest'>('loading');

    const fetchProfile = useCallback(async (supabaseUser: BaseUser) => {
        try {
            // Get the session to get the access token
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) {
                setUser(null);
                setAuthStatus('unauthenticated');
                setLoading(false);
                return;
            }

            // Call the authoritative /api/users/me endpoint
            const response = await fetch('/api/users/me', {
                headers: {
                    'Authorization': `Bearer ${session.access_token}`
                }
            });

            if (!response.ok) {
                console.warn("[Auth] Profile fetch failed via API:", response.status);

                // If unauthorized, we clear the user
                if (response.status === 401) {
                    setUser(null);
                    setAuthStatus('unauthenticated');
                    setLoading(false);
                    return;
                }

                // If other API failure, we use the basic auth metadata but stay in 'loading' or switch to 'guest'
                // rather than showing "Unknown User"
                const fallbackUser: User = {
                    uid: supabaseUser.id,
                    email: supabaseUser.email || '',
                    name: supabaseUser.user_metadata?.full_name || supabaseUser.email?.split('@')[0] || 'User',
                    role: 'guest'
                };
                setUser(fallbackUser);
                setAuthStatus('guest');
                return;
            }

            const { user: apiUser } = await response.json();

            if (apiUser) {
                const fullUser: User = {
                    uid: apiUser.uid || apiUser.id || supabaseUser.id,
                    email: apiUser.email || supabaseUser.email || '',
                    name: apiUser.name || apiUser.full_name || apiUser.official_name || 'User',
                    role: apiUser.role || 'guest',
                    institution_id: apiUser.institution_id,
                    department_id: apiUser.department_id,
                    photoURL: apiUser.avatar_url || apiUser.photoURL,
                    official_name: apiUser.official_name || apiUser.full_name,
                    avatar_url: apiUser.avatar_url,
                };
                setUser(fullUser);
                // Truth: only set authenticated if role is NOT guest
                setAuthStatus(fullUser.role === 'guest' ? 'guest' : 'authenticated');
            }
        } catch (err) {
            console.error("[Auth] Unexpected error fetching profile:", err);
            // On unexpected error, we don't clear immediately to avoid flash, 
            // but ensure we aren't stuck in loading forever
            if (authStatus === 'loading') {
                setAuthStatus('unauthenticated');
            }
        } finally {
            setLoading(false);
        }
    }, [authStatus]);

    const refreshUser = useCallback(async () => {
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user) {
            await fetchProfile(session.user);
        } else {
            setUser(null);
            setAuthStatus('unauthenticated');
            setLoading(false);
        }
    }, [fetchProfile]);

    useEffect(() => {
        refreshUser();

        const { data: listener } = supabase.auth.onAuthStateChange(
            async (_event, session) => {
                if (session?.user) {
                    await fetchProfile(session.user);
                } else {
                    setUser(null);
                    setAuthStatus('unauthenticated');
                    setLoading(false);
                }
            }
        );

        return () => {
            listener.subscription.unsubscribe();
        };
    }, [fetchProfile, refreshUser]);

    const login = async (email: string, password: string) => {
        const { error } = await supabase.auth.signInWithPassword({
            email,
            password,
        });

        if (error) throw error;
    };

    const signup = async (email: string, password: string) => {
        const { error } = await supabase.auth.signUp({
            email,
            password,
        });

        if (error) throw error;
    };

    const logout = async () => {
        await supabase.auth.signOut();
    };

    const signOut = logout;

    const getIdToken = async () => {
        const { data: { session } } = await supabase.auth.getSession();
        return session?.access_token || null;
    };

    return (
        <AuthContext.Provider value={{ user, loading, authStatus, login, signup, logout, signOut, getIdToken, refreshUser }}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (!context) throw new Error("useAuth must be used within AuthProvider");
    return context;
}
