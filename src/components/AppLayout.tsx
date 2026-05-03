// src/components/AppLayout.tsx
"use client";

import React from "react";
// BottomNav is intentionally not imported here. The shell layout (src/app/(shell)/layout.tsx)
// owns BottomNav + FAB so there is a single source-of-truth for navigation and the FAB.

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen">
      <main className="pb-24 pt-4">{children}</main>
      {/* BottomNav removed from AppLayout to avoid duplicate FAB. */}
    </div>
  );
}
