'use client';
import React, { createContext, useContext, useEffect, useState } from 'react';
import { onAuthStateChanged, signOut as fbSignOut, User as FBUser } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db } from '@/firebase/client';

type Role = 'admin' | 'team' | 'guest';

export type AuthUser = {
  uid: string;
  email?: string | null;
  name?: string | null;
  role: Role;
};

type AuthContextValue = {
  user: AuthUser | null;
  loading: boolean;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (fbUser: FBUser | null) => {
      if (!fbUser) {
        setUser(null);
        setLoading(false);
        return;
      }
      try {
        const docRef = doc(db, 'users', fbUser.uid);
        const snap = await getDoc(docRef);
        const data = snap.exists() ? (snap.data() as any) : null;
        const role = (data?.role as Role) || 'guest';
        setUser({
          uid: fbUser.uid,
          email: fbUser.email,
          name: fbUser.displayName || null,
          role,
        });
      } catch (e) {
        console.error('Auth role fetch error', e);
        setUser({
          uid: fbUser.uid,
          email: fbUser.email,
          name: fbUser.displayName || null,
          role: 'guest',
        });
      }
      setLoading(false);
    });
    return () => unsub();
  }, []);

  const signOut = async () => {
    await fbSignOut(auth);
    setUser(null);
  };

  return <AuthContext.Provider value={{ user, loading, signOut }}>{children}</AuthContext.Provider>;
};

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
