'use client';

import React, { useEffect } from "react";
import BottomNav from "@/components/BottomNavigation";
import TopBar from "@/components/TopBar";
import { ToastProvider } from "@/components/ToastProvider";
import { ClientDataProvider } from "@/app/(shell)/ClientDataContext";
import { initPWA } from "@/lib/init-pwa";
import { ClientOfflineStatusIndicator as OfflineStatusIndicator } from "@/components/ClientOfflineStatusIndicator";
import { HydrationDetector } from "@/components/HydrationDetector";
import ErrorBoundary from "@/components/ErrorBoundary";
import { OfflineBanner } from "@/components/OfflineBanner";
import { KeyboardNavigationDetector } from "@/components/KeyboardNavigationDetector";
import ProtectedRoute from "@/components/ProtectedRoute";
import { GuestOnboardingWrapper } from "@/components/onboarding/GuestOnboardingWrapper";
import { JankMonitor } from "@/components/JankMonitor";
import { CrashLoopBreaker } from "@/components/CrashLoopBreaker";

import { MobileViewportSafety } from "@/components/layout/MobileViewportSafety";
import DesktopSideNav from "@/components/layout/DesktopSideNav";

export default function ShellProviders({ children }: { children: React.ReactNode }) {
    // Initialize PWA functionality
    useEffect(() => {
        initPWA();
    }, []);

    return (
        <CrashLoopBreaker>
            <ProtectedRoute>
                <JankMonitor />
                <ToastProvider>
                    <ClientDataProvider>
                        {/* Mobile Viewport Management */}
                        <MobileViewportSafety />

                        {/* Shell Container - Fixed height, NO transforms/filters */}
                        <div
                            className="fixed inset-0 flex bg-bg-canvas overflow-hidden"
                            style={{ height: 'var(--viewport-height)' }}
                        >
                            {/* Desktop Sidebar */}
                            <DesktopSideNav />

                            <div className="flex-1 flex flex-col min-w-0 relative lg:pl-[var(--current-sidebar-width)] transition-[padding-left] duration-[240ms] ease-[cubic-bezier(0.4,0,0.2,1)]">
                                {/* Keyboard Navigation Detector */}
                                <KeyboardNavigationDetector />

                                {/* Offline Banner */}
                                <OfflineBanner />

                                {/* Top Bar - Fixed height at top */}
                                <div className="print:hidden flex-none">
                                    <TopBar />
                                </div>

                                {/* Main Content Area - THE single scroll container */}
                                <main
                                    className="flex-1 overflow-y-auto overflow-x-hidden pt-[calc(var(--header-height)+1rem)] lg:pt-8 pb-6 print:pt-0 print:pb-0 print:overflow-visible print:h-auto scroll-smooth transition-all duration-200"
                                    id="main-scroll-container"
                                    style={{
                                        // Mobile bottom nav spacing handled by class or separate var if needed, 
                                        // keeping inline style for bottom-nav if it varies, but bottom-nav is usually fixed height.
                                        // Use style only for bottom padding to match existing logic if needed, or move to class.
                                        // ShellProviders previously had: paddingBottom: 'calc(var(--bottom-nav-height) + 2rem)'
                                        paddingBottom: 'calc(var(--bottom-nav-height) + 2rem)'
                                    }}
                                >
                                    <ErrorBoundary>
                                        <div className="min-h-full">
                                            {children}
                                        </div>
                                    </ErrorBoundary>
                                </main>
                            </div>
                        </div>

                        {/* Offline & Hydration Indicators */}
                        <GuestOnboardingWrapper />
                        <OfflineStatusIndicator />
                        <HydrationDetector />

                        <div className="print:hidden lg:hidden">
                            {process.env.IS_MOBILE !== 'true' || (typeof window !== 'undefined' && !window.location.pathname.startsWith('/reports/activity')) ? (
                                <BottomNav />
                            ) : null}
                        </div>
                    </ClientDataProvider>
                </ToastProvider>
            </ProtectedRoute>
        </CrashLoopBreaker>
    );
}

