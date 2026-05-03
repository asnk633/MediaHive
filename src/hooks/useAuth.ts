// src/hooks/useAuth.ts
"use client";

/**
 * Thin re-export so components can import from "@/hooks/useAuth".
 * This file imports the hook from src/contexts/AuthContext and re-exports it
 * both as a named export and as the default export to match different import styles.
 *
 * If your AuthContext does not export a `useAuth` hook, this will throw a build-time
 * or runtime error — in that case paste the first ~120 lines of
 * src/contexts/AuthContext.tsx and I will adapt this wrapper accordingly.
 */

import { useAuth as useAuthHook } from "@/contexts/AuthContextProvider";

// Thin re-export so components can import from "@/hooks/useAuth".
// Standardizing on the named export from the central AuthContext.
export const useAuth = useAuthHook;

export default useAuth;
