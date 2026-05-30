'use client';
import { useEffect, useState } from 'react';

const BOOT_FAILURE_THRESHOLD = 3;
const BOOT_STABILITY_WINDOW = 10000; // 10 seconds to consider boot "stable"

/**
 * CrashLoopBreaker: Detects and breaks infinite restart loops.
 */
export function CrashLoopBreaker({ children }: { children: React.ReactNode }) {
    const [isSafeMode, setIsSafeMode] = useState(false);

    useEffect(() => {
        if (typeof window === 'undefined') return;

        // Disable crash loop detection in development to allow real errors to surface
        if (process.env.NODE_ENV === 'development') {
            console.log('[CRASH-LOOP] Disabled in development mode.');
            return;
        }

        const bootCount = parseInt(localStorage.getItem('boot_failure_count') || '0');
        const lastBootTime = parseInt(localStorage.getItem('last_boot_timestamp') || '0');
        const now = Date.now();

        // If the last boot was very recent (< 10s) and we crashed, increment count
        if (now - lastBootTime < BOOT_STABILITY_WINDOW) {
            const newCount = bootCount + 1;
            localStorage.setItem('boot_failure_count', newCount.toString());

            if (newCount >= BOOT_FAILURE_THRESHOLD) {
                console.error(`[CRASH-LOOP] Detected ${newCount} consecutive failures. Triggering Safe Mode.`);
                setIsSafeMode(true);
            }
        } else {
            // Last boot was stable, reset count
            localStorage.setItem('boot_failure_count', '0');
        }

        localStorage.setItem('last_boot_timestamp', now.toString());

        // Set a timer to clear the failure count once the app is stable
        const timer = setTimeout(() => {
            console.log('[CRASH-LOOP] App stable. Resetting failure count.');
            localStorage.setItem('boot_failure_count', '0');
        }, BOOT_STABILITY_WINDOW);

        return () => clearTimeout(timer);
    }, []);

    if (isSafeMode) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-[#0a0c10] text-foreground p-6">
                <div className="max-w-md w-full p-8 bg-red-950/20 border border-red-500/30 rounded-3xl text-center space-y-6">
                    <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mx-auto">
                        <svg className="w-8 h-8 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                        </svg>
                    </div>
                    <div className="space-y-2">
                        <h1 className="text-xl font-bold">Safe Mode Initialized</h1>
                        <p className="text-sm text-foreground/60">The app has crashed multiple times during startup. Non-essential modules have been disabled to ensure stability.</p>
                    </div>
                    <button
                        onClick={() => {
                            localStorage.setItem('boot_failure_count', '0');
                            window.location.reload();
                        }}
                        className="w-full py-3 bg-red-600 hover:bg-red-500 rounded-xl font-bold transition-colors"
                    >
                        Try Normal Launch
                    </button>
                    <p className="text-[10px] text-foreground/50 uppercase tracking-widest">Error Code: PLATINUM_CRASH_LOOP_DETECTED</p>
                </div>
            </div>
        );
    }

    return <>{children}</>;
}
