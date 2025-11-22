"use client";

import React, { useEffect } from "react";
import BottomNav from "@/components/BottomNav";
import { ToastProvider } from "@/components/ToastProvider";
import { ClientDataProvider } from "./ClientDataContext";
import { RoleProvider } from "./RoleContext";
import { FAB } from "@/client/components/FAB";
import { initPWA } from "@/lib/init-pwa";

export default function ShellLayout({ children }: { children: React.ReactNode }) {
  // Initialize PWA functionality
  useEffect(() => {
    initPWA();
  }, []);
  
  // Shell layout: single anchor for BottomNav + FAB. Do not render FAB elsewhere.
  return (
    <RoleProvider>
      <ToastProvider>
        <ClientDataProvider>
          <div className="min-h-screen">
            <main className="pb-24 pt-4">{children}</main>

            {/* Bottom navigation + FAB (single source-of-truth) */}
            <BottomNav />
            
            {/* Floating Action Button */}
            <FAB />
          </div>

          <style>{`
            button:active { transform: translateY(1px) scale(0.98); }
            .material-symbols-outlined { font-variation-settings: 'FILL' 0, 'wght' 600, 'GRAD' 0, 'opsz' 48; }
            button:focus { outline: none; box-shadow: 0 0 0 4px rgba(0,190,160,0.08); }
          `}</style>
        </ClientDataProvider>
      </ToastProvider>
    </RoleProvider>
  );
}