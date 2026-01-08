"use client";

import React, { useEffect, Suspense } from "react";
import BottomNav from "@/components/BottomNavigation";
import TopBar from "@/components/TopBar";
import { ToastProvider } from "@/components/ToastProvider";
import { ClientDataProvider } from "./ClientDataContext";

import { initPWA } from "@/lib/init-pwa";
import { ClientOfflineStatusIndicator as OfflineStatusIndicator } from "@/components/ClientOfflineStatusIndicator";
import { HydrationDetector } from "@/components/HydrationDetector";
import ErrorBoundary from "@/components/ErrorBoundary";
import { OfflineBanner } from "@/components/OfflineBanner";
import { KeyboardNavigationDetector } from "@/components/KeyboardNavigationDetector";
import ProtectedRoute from "@/components/ProtectedRoute";
import { AppLoader } from "@/components/ui/AppLoader";

export default function ShellLayout({ children }: { children: React.ReactNode }) {
  // Initialize PWA functionality
  useEffect(() => {
    initPWA();
  }, []);

  return (
    <ProtectedRoute>
      <ToastProvider>
        <ClientDataProvider>
          {/* Shell Container - NO transforms/filters that break position:fixed */}
          <div className="min-h-screen flex flex-col bg-night-sky">
            {/* Keyboard Navigation Detector */}
            <KeyboardNavigationDetector />

            {/* Offline Banner */}
            <OfflineBanner />

            {/* Top Bar */}
            <div className="print:hidden">
              <TopBar />
            </div>

            {/* Main Content Area - No independent scroll */}
            <main
              className="flex-1 overflow-x-hidden pt-6 print:pt-0 print:pb-0 print:overflow-visible print:h-auto"
              style={{
                paddingBottom: 'var(--bottom-nav-height)',
                paddingTop: 'calc(var(--header-height) + 1rem)'
              }}
            >
              <ErrorBoundary>
                <Suspense fallback={
                  <div className="flex items-center justify-center p-12">
                    <AppLoader />
                  </div>
                }>
                  {children}
                </Suspense>
              </ErrorBoundary>
            </main>

            {/* Offline & Hydration Indicators */}
            <OfflineStatusIndicator />
            <HydrationDetector />
          </div>



          <div className="print:hidden">
            <BottomNav />
          </div>
        </ClientDataProvider>
      </ToastProvider>
    </ProtectedRoute>
  );
}
