// src/components/ClientLayout.tsx
"use client";

import { useAuth } from "@/contexts/AuthContextProvider";
// BottomNav intentionally removed from ClientLayout.
// Navigation (BottomNav) + FAB live in the shell layout at:
// src/app/(shell)/layout.tsx — keep a single source-of-truth there.

export default function ClientLayout({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const canCreateEvent = user ? ["admin", "team"].includes(user.role) : false;
  const isAdmin = user ? user.role === "admin" : false;

  return (
    <>
      <main className="pt-16">{children}</main>
      {/* BottomNav removed here to avoid duplicate FAB. See shell layout for navigation. */}
    </>
  );
}
