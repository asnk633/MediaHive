"use client";

import React, { useEffect, Suspense } from "react";
import BottomNav from "@/components/BottomNavigation";
import TopBar from "@/components/TopBar";
import { ToastProvider } from "@/components/ToastProvider";
import { ClientDataProvider } from "./ClientDataContext";
import { RoleProvider } from "./RoleContext";
import FAB from "@/client/components/FAB";
import { initPWA } from "@/lib/init-pwa";
import { ClientOfflineStatusIndicator as OfflineStatusIndicator } from "@/components/ClientOfflineStatusIndicator";
import { HydrationDetector } from "@/components/HydrationDetector";
import ErrorBoundary from "@/components/ErrorBoundary";
import { OfflineBanner } from "@/components/OfflineBanner";
import { KeyboardNavigationDetector } from "@/components/KeyboardNavigationDetector";

export default function ShellLayout({ children }: { children: React.ReactNode }) {
  // Initialize PWA functionality
  useEffect(() => {
    initPWA();
  }, []);

  return (
    <>
      <RoleProvider>
        <ToastProvider>
          <ClientDataProvider>
            <div className="min-h-screen flex flex-col">
              {/* Keyboard Navigation Detector */}
              <KeyboardNavigationDetector />

              {/* Offline Banner */}
              <OfflineBanner />

              {/* Top Bar */}
              <TopBar />

              {/* Main Content Area - Scrolls independently */}
              <main className="flex-1 overflow-y-auto overflow-x-hidden pt-6">
                <ErrorBoundary>
                  <Suspense fallback={<div>Loading...</div>}>
                    {children}
                  </Suspense>
                </ErrorBoundary>
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
    </>
  );
}