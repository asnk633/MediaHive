'use client';

import React, { useEffect } from "react";
import BottomNav from "@/components/BottomNavigation";
import TopBar from "@/components/TopBar";
import { ToastProvider } from "@/components/ToastProvider";
import { ClientDataProvider } from "@/app/(shell)/ClientDataContext";
import { HydrationDetector } from "@/components/HydrationDetector";
import ErrorBoundary from "@/components/ErrorBoundary";
import { KeyboardNavigationDetector } from "@/components/KeyboardNavigationDetector";
import ProtectedRoute from "@/components/ProtectedRoute";
import { MemberOnboardingWrapper } from "@/components/onboarding/MemberOnboardingWrapper";
import { JankMonitor } from "@/components/JankMonitor";
import { CrashLoopBreaker } from "@/components/CrashLoopBreaker";
import { AwarenessIndicator } from "@/components/AwarenessIndicator";
import { collabManager } from "@/lib/collaboration/collabManager";
import { useAuth } from "@/contexts/AuthContextProvider";
 
import { MobileViewportSafety } from "@/components/layout/MobileViewportSafety";
import DesktopSideNav from "@/components/layout/DesktopSideNav";
 
export default function ShellProviders({ children }: { children: React.ReactNode }) {
    const { user } = useAuth();
 
    // Initialize Collaboration functionality
    useEffect(() => {
        if (user) {
            collabManager.init({
                id: user.uid || user.id,
                name: user.name || 'User'
            });
        }
    }, [user]);
 
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
                        <div className="absolute inset-0 pointer-events-none overflow-hidden">
                            {/* Ambient Top Light - Premium SaaS Depth */}
                            <div 
                                className="absolute inset-x-0 -top-[200px] h-[600px] z-0 opacity-50"
                                style={{
                                    background: `radial-gradient(1200px 600px at 50% 0%, rgba(99, 102, 241, 0.15), transparent 60%)`
                                }}
                            />
 
                            <div className="absolute -top-40 left-1/3 w-[700px] h-[700px] bg-blue-600/10 blur-[140px] rounded-full animate-drift" />
                            <div className="absolute top-1/2 right-[-200px] w-[600px] h-[600px] bg-indigo-500/10 blur-[140px] rounded-full animate-drift" style={{ animationDelay: '-15s' }} />
                        </div>
                        {/* Desktop Sidebar */}
                        <DesktopSideNav />
 
                        <div className="flex-1 flex flex-col min-w-0 relative lg:pl-[calc(var(--current-sidebar-width)+3rem)] transition-[padding-left] duration-[240ms] ease-[cubic-bezier(0.4,0,0.2,1)]">
                            {/* Keyboard Navigation Detector */}
                            <KeyboardNavigationDetector />
 

 
                            {/* Top Bar - Fixed height at top */}
                            <div className="print:hidden flex-none">
                                <TopBar />
                            </div>
 
                            {/* Main Content Area - THE single scroll container */}
                            <main
                                className="flex-1 overflow-y-auto overflow-x-hidden relative z-10 pt-[calc(var(--header-height)+1rem)] lg:pt-8 pb-6 print:pt-0 print:pb-0 print:overflow-visible print:h-auto scroll-smooth transition-all duration-200 page-enter"
                                id="main-scroll-container"
                                style={{
                                    paddingBottom: 'calc(var(--bottom-nav-height) + 2rem)'
                                }}
                            >
                                <ErrorBoundary>
                                    <div className="min-h-full max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8">
                                        <ProtectedRoute>
                                            {children}
                                        </ProtectedRoute>
                                    </div>
                                </ErrorBoundary>
                            </main>
                        </div>
                    </div>
 
                    {/* Offline & Hydration Indicators */}
                    <MemberOnboardingWrapper />

                    <AwarenessIndicator />
                    <HydrationDetector />

                    <BottomNav />
                </ClientDataProvider>
            </ToastProvider>
        </CrashLoopBreaker>
    );
}

