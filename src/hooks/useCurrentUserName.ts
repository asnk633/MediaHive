"use client";

import { useAuth } from "@/contexts/AuthContextProvider";

/**
 * @deprecated Use `useAuth().user?.name` instead for authoritative identity.
 * This hook is preserved for backward compatibility but now derives from the 
 * central AuthContext instead of stale localStorage.
 */
export function useCurrentUserName() {
    const { user, loading } = useAuth();

    if (loading) return "...";
    return user?.name || "User";
}
