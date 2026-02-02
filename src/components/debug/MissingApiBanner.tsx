'use client';

import React, { useEffect, useState } from 'react';
import { AlertTriangle } from 'lucide-react';

export function MissingApiBanner() {
    const [visible, setVisible] = useState(false);

    useEffect(() => {
        // Condition: Live Mode (backend enabled) BUT No API URL (on static web build)
        // We detect "Live Mode" if disableBackend is false. 
        // But disableBackend logic is in RootProviders/AuthContext, hard to read here directly without Context.
        // Instead, we check the ENVIRONMENT variables matching RootProviders logic.

        const noApiEnv = process.env.NEXT_PUBLIC_DEV_NO_API === 'true';
        const override = typeof window !== 'undefined' && localStorage.getItem('force_real_api') === 'true';

        // Live Mode = !noApiEnv OR override is true
        const isLiveMode = !noApiEnv || override;
        const hasApiUrl = !!process.env.NEXT_PUBLIC_API_URL;
        const isMobile = typeof window !== 'undefined' && (window as any).Capacitor?.isNativePlatform?.();

        // Warning needed if: Live Mode AND No API URL AND Not Mobile (Mobile forces hardcoded URL if missing)
        if (isLiveMode && !hasApiUrl && !isMobile) {
            setVisible(true);
        }
    }, []);

    if (!visible) return null;

    return (
        <div className="bg-red-600 text-white px-4 py-2 text-sm font-bold flex items-center justify-center gap-2 shadow-lg z-[100] relative">
            <AlertTriangle size={16} className="shrink-0" />
            <span>
                CRITICAL Configuration Missing: Live Backend active but NEXT_PUBLIC_API_URL is undefined.
                Data fetch will fail.
            </span>
        </div>
    );
}
