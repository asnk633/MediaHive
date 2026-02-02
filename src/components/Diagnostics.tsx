'use client';

import { useEffect } from 'react';

/**
 * Diagnostics component to capture and log runtime errors and promise rejections.
 * Specifically tailored for Capacitor/WebView environments where debugging can be difficult.
 */
export default function Diagnostics() {
    useEffect(() => {
        if (typeof window === 'undefined') return;
        console.log('[BOOT] Diagnostics initialized');

        // Removed RSC blocking logic to allow client-side navigation


        const handleError = (event: ErrorEvent) => {
            const { message, filename, lineno, colno, error } = event;
            console.error(`[WEBVIEW] [ERROR] ${message} at ${filename}:${lineno}:${colno}`, error?.stack);
        };

        const handleRejection = (event: PromiseRejectionEvent) => {
            console.error(`[WEBVIEW] [UNHANDLED REJECTION]`, event.reason);
        };

        window.addEventListener('error', handleError);
        window.addEventListener('unhandledrejection', handleRejection);

        return () => {
            window.removeEventListener('error', handleError);
            window.removeEventListener('unhandledrejection', handleRejection);
        };
    }, []);

    return null;
}
