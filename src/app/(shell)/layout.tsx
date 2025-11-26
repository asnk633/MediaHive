"use client";

import React, { useEffect, Suspense } from "react";
import BottomNav from "@/components/BottomNav";
import TopBar from "@/components/TopBar";
import { ToastProvider } from "@/components/ToastProvider";
import { ClientDataProvider } from "./ClientDataContext";
import { RoleProvider } from "./RoleContext";
import { FAB } from "@/client/components/FAB";
import { initPWA } from "@/lib/init-pwa";
import { ClientOfflineStatusIndicator as OfflineStatusIndicator } from "@/components/ClientOfflineStatusIndicator";
import { HydrationDetector } from "@/components/HydrationDetector";

export default function ShellLayout({ children }: { children: React.ReactNode }) {
  // Initialize PWA functionality
  useEffect(() => {
    initPWA();
  }, []);

  return (
    <html lang="en" suppressHydrationWarning>
      <body className="min-h-screen">
        <RoleProvider>
          <ToastProvider>
            <ClientDataProvider>
              <div className="min-h-screen flex flex-col">
                {/* Top Bar */}
                <TopBar />

                {/* Main Content Area - Scrolls independently */}
                <main className="flex-1 overflow-y-auto overflow-x-hidden">
                  <Suspense fallback={<div>Loading...</div>}>
                    {children}
                  </Suspense>
                </main>

                {/* Offline & Hydration Indicators */}
                <OfflineStatusIndicator />
                <HydrationDetector />

                {/* Floating Action Button */}
                <FAB />

                {/* Bottom Navigation */}
                <BottomNav />
              </div>
            </ClientDataProvider>
          </ToastProvider>
        </RoleProvider>
      </body>
    </html>
  );
}