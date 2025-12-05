// Mock AuthContext for build purposes
import React, { createContext, useContext } from 'react';

const AuthContext = createContext<any>({
  role: null,
});

export function useAuth() {
  return useContext(AuthContext);
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  return (
    <AuthContext.Provider value={{ role: null }}>
      {children}
    </AuthContext.Provider>
  );
}