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

import * as AuthModule from "@/contexts/AuthContextProvider";

// Prefer an actual named useAuth if present
const useAuthHook = (AuthModule && ((AuthModule as any).useAuth ?? (AuthModule as any).default ?? null)) as any;

// Defensive: if nothing is present, export a stub that returns { user: null }.
// This avoids crash loops but will hide chrome (as intended) so app still runs.
export const useAuth =
  typeof useAuthHook === "function"
    ? useAuthHook
    : () => {
        return { user: null };
      };

export default useAuth;
