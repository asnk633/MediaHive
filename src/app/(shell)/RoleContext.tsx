"use client";

import React, { createContext, useContext, useMemo, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";

export type Role = "admin" | "team" | "guest";
type User = { id: string; name: string; role: Role };

type Ctx = {
  user: User;
  setRole: (r: Role) => void;
};

const RoleCtx = createContext<Ctx | null>(null);

export function useRole() {
  const v = useContext(RoleCtx);
  if (!v) throw new Error("useRole must be used within <RoleProvider>");
  return v;
}

export function RoleProvider({ children }: { children: React.ReactNode }) {
  const { user: authUser } = useAuth();
  const [role, setRole] = useState<Role>("admin");
  
  // Use the authenticated user if available, otherwise use default users
  const user = useMemo(() => {
    if (authUser) {
      return {
        id: authUser.id.toString(),
        name: authUser.fullName,
        role: authUser.role as Role
      };
    }
    
    // Fallback to default users
    const DEFAULT_USERS: Record<Role, User> = {
      admin: { id: "u3", name: "Shukoor Rahman", role: "admin" },
      team:  { id: "u2", name: "KMS Pallikkunnu", role: "team" },
      guest: { id: "u1", name: "Anu MadMax", role: "guest" },
    };
    
    return DEFAULT_USERS[role];
  }, [authUser, role]);

  const value = useMemo(() => ({ user, setRole }), [user]);

  return <RoleCtx.Provider value={value}>{children}</RoleCtx.Provider>;
}