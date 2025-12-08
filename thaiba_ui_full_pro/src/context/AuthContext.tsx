import React, { createContext, useContext, useEffect, useState } from 'react';
// Import from our local wrapper which handles the Compat SDK and polyfills
import { auth, onAuthStateChanged, signOut, User } from '../firebase/firebaseWrapper';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  role: string | null;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  role: null,
  logout: async () => { },
});

export function useAuth() {
  return useContext(AuthContext);
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [role, setRole] = useState<string | null>(null);

  useEffect(() => {
    // onAuthStateChanged is now a safe function from our own wrapper
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        // Here we could fetch the real role from Firestore using Compat DB
        // For now, mock or simple logic
        setRole('admin');
      } else {
        setRole(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const logout = async () => {
    await signOut(auth);
  };

  return (
    <AuthContext.Provider value={{ user, loading, role, logout }}>
      {children}
    </AuthContext.Provider>
  );
}
