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
    const { user, loading, claimsReady, authStatus } = useAuth();
    const router = useRouter();
    const pathname = usePathname();
    const [showWatchdog, setShowWatchdog] = useState(false);
    const watchdogTimer = useRef<NodeJS.Timeout | null>(null);

    // Startup log - Enhanced Native Check
    useEffect(() => {
        if (typeof window !== 'undefined') {
            // 🔍 IMPROVED NATIVE DETECTION: Use Capacitor.isNativePlatform() instead of protocol
            const isNative = (window as any).Capacitor?.isNativePlatform?.() || Capacitor.isNativePlatform();
            const envApiUrl = process.env.NEXT_PUBLIC_API_URL;
            const resolvedBaseUrl = getApiBaseUrl();

            // [BOOT] logs
            console.log('[BOOT] isNativePlatform=' + isNative);
            console.log('[BOOT] Capacitor present=' + !!((window as any).Capacitor));
            console.log('[BOOT] protocol=' + window.location.protocol);
            console.log('[BOOT] API BASE=' + (resolvedBaseUrl || 'RELATIVE'));

            // HARD CHECK: Validate API base URL on mobile
            if (isNative) {
                if (!resolvedBaseUrl || resolvedBaseUrl === '' || resolvedBaseUrl === 'RELATIVE') {
                    const errorMsg = '[API][FATAL] MOBILE BUILD USING RELATIVE API — BLOCKED';
                    console.error(errorMsg);
                    console.log('[BOOT] isNativePlatform=true');
                    console.log('[BOOT] Capacitor present=true');
                    console.log('[BOOT] API BASE=' + (resolvedBaseUrl || 'RELATIVE'));
                    throw new Error(errorMsg);
                }
                if (resolvedBaseUrl.startsWith('/') || resolvedBaseUrl.includes('localhost')) {
                    const errorMsg = '[API][FATAL] MOBILE BUILD USING RELATIVE API — BLOCKED';
                    console.error(errorMsg);
                    console.log('[BOOT] isNativePlatform=true');
                    console.log('[BOOT] Capacitor present=true');
                    console.log('[BOOT] API BASE=' + (resolvedBaseUrl || 'RELATIVE'));
                    throw new Error(errorMsg);
                }
                console.log('[BOOT] ✅ API base validated:', resolvedBaseUrl);
            }
        }
    }, []);

    // Consolidated Boot Ready State
    const bootReady = authStatus === 'authenticated' && claimsReady && !loading;

    // 0. State Logging for Debugging
    useEffect(() => {
        console.log('[BOOT][STATE]', {
            loading,
            authStatus,
            claimsReady,
            pathname
        });
    }, [loading, authStatus, claimsReady, pathname]);

    // 1. Watchdog Timer Logic
    useEffect(() => {
        // If we are already ready, clear everything
        if (bootReady) {
            if (watchdogTimer.current) {
                console.log('[BOOT] watchdog cleared');
                clearTimeout(watchdogTimer.current);
            }
            setShowWatchdog(false);
            return;
        }

        // Only start watchdog if we are strictly AUTHENTICATING
        if (authStatus === 'authenticating') {
            console.log('[BOOT] Gate Open - Waiting for Auth...');
            watchdogTimer.current = setTimeout(() => {
                // Double check if we are still not ready
                // Actually, the effect cleanup should handle this, 
                // but checking inside timeout is safer against race conditions
                if (authStatus === 'authenticating') {
                    console.error('[BOOT] Watchdog Fired - Login Taking Too Long');
                    setShowWatchdog(true);
                }
            }, 15000); // 15s timeout
        }

        return () => {
            if (watchdogTimer.current) clearTimeout(watchdogTimer.current);
        };
    }, [bootReady, authStatus]);

    // 2. Navigation Logic
    useEffect(() => {
        const normalizedPath = pathname.endsWith('/') && pathname.length > 1 ? pathname.slice(0, -1) : pathname;
        if (
            authStatus === 'authenticated' &&
            claimsReady &&
            !loading &&
            (normalizedPath === '' || normalizedPath === '/' || normalizedPath === '/login')
        ) {
            console.log('[BOOT] Navigating -> /home');
            nativeNavigate('/home', router, 'BootGate');
        } else if (
            authStatus === 'unauthenticated' &&
            !loading &&
            normalizedPath !== '/login' &&
            normalizedPath !== '' &&
            normalizedPath !== '/'
        ) {
            console.log('[BOOT] Unauthenticated - redirecting to /login');
            nativeNavigate('/login', router, 'BootGate');
        } else {
            console.log(`[BOOT] Already on valid route: ${pathname}`);
        }

    }, [bootReady, pathname, router, authStatus, claimsReady, loading]);

    // 3. Render Logic
    if (showWatchdog && !bootReady) {
        return <WatchdogUI onRetry={() => window.location.reload()} />;
    }

    // If strictly authenticating and at root, block UI to prevent flash.
    // Unauthenticated state should fall through to children (LoginInline).
    if (authStatus === 'authenticating' && pathname === '/') {
        return (
            <div className="fixed inset-0 bg-night-sky flex items-center justify-center z-[9000]">
                <AppLoader />
            </div>
        );
    }

    // Render children (Unauth login page OR Protected app)
    return <>{children}</>;
}
