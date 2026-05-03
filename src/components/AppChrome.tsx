// src/components/AppChrome.tsx
"use client";

import { usePathname } from "next/navigation";
// BottomNav intentionally not imported here. Use the shell layout to render it.
import { useAuth } from "@/hooks/useAuth";

/**
 * Renders BottomNav + FAB only when:
 * - user is signed in, and
 * - route is NOT an auth route (/login, /register, /auth/*)
 *
 * Both FAB + BottomNav are centered off the same anchor so the + sits perfectly above the nav.
 */
export default function AppChrome() {
  const pathname = usePathname() ?? "/";
  const { user } = useAuth();

  const hideOnAuthRoute =
    pathname === "/login" ||
    pathname === "/register" ||
    pathname.startsWith("/auth");

  if (!user || hideOnAuthRoute) return null;

  return (
    <>
      {/* spacer to avoid content being covered by fixed nav */}
      <div className="bottom-nav-spacer" aria-hidden />

      {/* AppChrome no longer mounts the BottomNav or FloatingActionButton.
          BottomNav is rendered in the shell layout (src/app/(shell)/layout.tsx). */}
      <div className="app-chrome-anchor" />
    </>
  );
}
