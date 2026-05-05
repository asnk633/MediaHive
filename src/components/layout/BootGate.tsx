'use client';

import React, { useEffect, useState, useRef } from 'react';
import { useAuth } from '@/contexts/AuthContextProvider';
import { useRouter, usePathname } from 'next/navigation';
import { nativeNavigate } from '@/lib/utils';
import { AppLoader } from '@/components/ui/AppLoader';
import { Button } from '@/components/ui/button';
import { AlertTriangle, RefreshCw, Share2 } from 'lucide-react';
import { getApiBaseUrl } from '@/lib/api-utils';
import { Capacitor } from '@capacitor/core';

const WatchdogUI = ({ onRetry }: { onRetry: () => void }) => (
    <div className="fixed inset-0 z-[9999] bg-[#020617] flex flex-col items-center justify-center p-6 text-center overflow-y-auto">
        <div className="w-20 h-20 rounded-full bg-red-500/10 flex items-center justify-center mb-6 border border-red-500/20">
            <AlertTriangle className="text-red-500 w-10 h-10" />
        </div>
        <h2 className="text-2xl font-bold text-white mb-2">Login Taking Too Long</h2>
        <p className="text-slate-400 max-w-sm mb-8">
            The authentication service is slow to respond. This can happen due to poor network or a session sync issue.
        </p>
        <div className="flex flex-col w-full max-w-xs gap-3">
            <Button onClick={onRetry} className="bg-blue-600 hover:bg-blue-500 text-white gap-2 h-12 text-lg font-bold">
                <RefreshCw size={20} /> Retry Login
            </Button>
            <Button variant="ghost" onClick={() => window.location.reload()} className="text-slate-400 hover:text-white">
                Reload Page
            </Button>
        </div>
    </div>
);

export default function BootGate({ children }: { children: React.ReactNode }) {
    const { user, loading, recoveryMode } = useAuth();
    const router = useRouter();
    const pathname = usePathname();
    const [showWatchdog, setShowWatchdog] = useState(false);
    const watchdogTimer = useRef<NodeJS.Timeout | null>(null);

    // Startup log - Enhanced Native Check
    useEffect(() => {
        if (typeof window !== 'undefined') {
            const isNative = (window as any).Capacitor?.isNativePlatform?.() || Capacitor.isNativePlatform();
            const resolvedBaseUrl = getApiBaseUrl();

            // HARD CHECK: Validate API base URL on mobile
            if (isNative) {
                if (!resolvedBaseUrl || resolvedBaseUrl === '' || resolvedBaseUrl === 'RELATIVE' || resolvedBaseUrl.startsWith('/') || resolvedBaseUrl.includes('localhost')) {
                    const errorMsg = '[API][FATAL] MOBILE BUILD USING RELATIVE API — BLOCKED';
                    console.error(errorMsg);
                    throw new Error(errorMsg);
                }
            }
        }
    }, []);

    // Consolidated Boot Ready State
    const bootReady = !!user && !loading;

    // 0. State Logging for Debugging
    useEffect(() => {
        console.log('[BOOT][STATE]', {
            loading,
            hasUser: !!user,
            pathname
        });
    }, [loading, user, pathname]);

    // 1. Watchdog Timer Logic
    useEffect(() => {
        if (bootReady || !loading) {
            if (watchdogTimer.current) {
                clearTimeout(watchdogTimer.current);
            }
            setShowWatchdog(false);
            return;
        }

        if (loading) {
            watchdogTimer.current = setTimeout(() => {
                if (loading) {
                    console.error('[BOOT] Watchdog Fired - Login Taking Too Long');
                    setShowWatchdog(true);
                }
            }, 15000);
        }

        return () => {
            if (watchdogTimer.current) clearTimeout(watchdogTimer.current);
        };
    }, [bootReady, loading]);

    // 2. Navigation Logic
    useEffect(() => {
        const normalizedPath = pathname.endsWith('/') && pathname.length > 1 ? pathname.slice(0, -1) : pathname;
        const publicRoutes = ['/login', '/signup', '/welcome', '', '/'];

        if (!loading) {
            const onboardingDone = typeof window !== 'undefined' ? localStorage.getItem('mediahive_onboarding_complete') === 'true' : true;

            if (user) {
                // P0: If in recovery mode, stay on the login page to allow password reset
                // Check both state and URL for maximum reliability
                const isRecovery = recoveryMode || window.location.search.includes('recovery=true') || window.location.hash.includes('type=recovery');
                
                if (isRecovery) {
                    console.log('[BOOT] Recovery mode active - staying on current page');
                    return;
                }

                if (normalizedPath === '/welcome') {
                    if (onboardingDone) {
                        console.log('[BOOT] Onboarding done -> /home');
                        nativeNavigate('/home', router, 'BootGate');
                    }
                    return;
                }

                if (!onboardingDone) {
                    console.log('[BOOT] Onboarding pending -> /welcome');
                    nativeNavigate('/welcome', router, 'BootGate');
                } else if (normalizedPath === '' || normalizedPath === '/' || normalizedPath === '/login' || normalizedPath === '/signup') {
                    console.log('[BOOT] Navigating -> /home');
                    nativeNavigate('/home', router, 'BootGate');
                }
            } else if (!publicRoutes.includes(normalizedPath)) {
                console.log('[BOOT] Unauthenticated - redirecting to /login');
                nativeNavigate('/login', router, 'BootGate');
            }
        }
    }, [user, loading, pathname, router]);

    // 3. Render Logic
    if (showWatchdog && !bootReady) {
        return <WatchdogUI onRetry={() => window.location.reload()} />;
    }

    if (loading && pathname === '/') {
        return (
            <div className="fixed inset-0 bg-night-sky flex items-center justify-center z-[9000]">
                <AppLoader />
            </div>
        );
    }

    // Render children (Unauth login page OR Protected app)
    return <>{children}</>;
}
