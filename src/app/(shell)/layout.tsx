"use client";

import React, { useEffect, Suspense } from "react";
import BottomNav from "@/components/BottomNavigation";
import TopBar from "@/components/TopBar";
import { ToastProvider } from "@/components/ToastProvider";
import { ClientDataProvider } from "./ClientDataContext";
import FAB from "@/client/components/FAB";
import { initPWA } from "@/lib/init-pwa";
import { ClientOfflineStatusIndicator as OfflineStatusIndicator } from "@/components/ClientOfflineStatusIndicator";
import { HydrationDetector } from "@/components/HydrationDetector";
import ErrorBoundary from "@/components/ErrorBoundary";
import { OfflineBanner } from "@/components/OfflineBanner";
import { KeyboardNavigationDetector } from "@/components/KeyboardNavigationDetector";
import ProtectedRoute from "@/components/ProtectedRoute";
import { TextCycleLoader } from "@/components/ui/TextCycleLoader";

export default function ShellLayout({ children }: { children: React.ReactNode }) {
  // Initialize PWA functionality
  useEffect(() => {
    initPWA();
  }, []);

  return (
    <ProtectedRoute>
      <ToastProvider>
        <ClientDataProvider>
          <div className="min-h-screen flex flex-col">
            {/* Keyboard Navigation Detector */}
            <KeyboardNavigationDetector />

            {/* Offline Banner */}
            <OfflineBanner />

            {/* Top Bar */}
            <div className="print:hidden">
              <TopBar />
            </div>

            {/* Main Content Area - Scrolls independently */}
            <main
              className="flex-1 overflow-y-auto overflow-x-hidden pt-6 print:pt-0 print:pb-0 print:overflow-visible print:h-auto"
              style={{
                paddingBottom: 'var(--bottom-nav-height)',
                paddingTop: 'calc(var(--header-height) + 1.5rem)'
              }}
            >
              <ErrorBoundary>
                <Suspense fallback={
                  <div className="flex items-center justify-center p-12">
                    <TextCycleLoader />
                  </div>
                }>
                  {children}
                </Suspense>
              </ErrorBoundary>
            </main>

            {/* Offline & Hydration Indicators */}
            <OfflineStatusIndicator />
            <HydrationDetector />

            {/* Floating Action Button */}
            <div className="print:hidden">
              <FAB />
            </div>

            {/* Bottom Navigation */}
            <div className="print:hidden">
              <BottomNav />
            </div>
          </div>
        </ClientDataProvider>
      </ToastProvider>
    </ProtectedRoute>
  );
}
