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
import { AwarenessIndicator } from "@/components/AwarenessIndicator";

import { MobileViewportSafety } from "@/components/layout/MobileViewportSafety";
import DesktopSideNav from "@/components/layout/DesktopSideNav";

export default function ShellProviders({ children }: { children: React.ReactNode }) {
    // Initialize PWA functionality
    useEffect(() => {
        initPWA();
    }, []);

    return (
        <CrashLoopBreaker>
            <ToastProvider>
                <ClientDataProvider>
                    {/* Mobile Viewport Management */}
                    <MobileViewportSafety />

                    {/* Shell Container - Fixed height, NO transforms/filters */}
                    <div
                        className="fixed inset-0 flex bg-transparent overflow-hidden"
                        style={{ height: 'var(--viewport-height)' }}
                    >
                        {/* Ambient Mesh Layer - Soft atmospheric glow */}
                        <div className="absolute inset-0 pointer-events-none">
                            <div className="absolute -top-40 left-1/3 w-[700px] h-[700px] bg-blue-600/10 blur-[140px] rounded-full" />
                            <div className="absolute top-1/2 right-[-200px] w-[600px] h-[600px] bg-indigo-500/10 blur-[140px] rounded-full" />
                        </div>
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
                                className="flex-1 overflow-y-auto overflow-x-hidden relative z-10 pt-[calc(var(--header-height)+1rem)] lg:pt-8 pb-6 print:pt-0 print:pb-0 print:overflow-visible print:h-auto scroll-smooth transition-all duration-200"
                                id="main-scroll-container"
                                style={{
                                    paddingBottom: 'calc(var(--bottom-nav-height) + 2rem)'
                                }}
                            >
                                <ErrorBoundary>
                                    <div className="min-h-full">
                                        <ProtectedRoute>
                                            {children}
                                        </ProtectedRoute>
                                    </div>
                                </ErrorBoundary>
                            </main>
                        </div>
                    </div>

                    {/* Offline & Hydration Indicators */}
                    <GuestOnboardingWrapper />
                    <OfflineStatusIndicator />
                    <AwarenessIndicator />
                    <HydrationDetector />

                    <div className="print:hidden lg:hidden">
                        {process.env.IS_MOBILE !== 'true' || (typeof window !== 'undefined' && !window.location.pathname.startsWith('/reports/activity')) ? (
                            <BottomNav />
                        ) : null}
                    </div>
                </ClientDataProvider>
            </ToastProvider>
        </CrashLoopBreaker>
    );
}

