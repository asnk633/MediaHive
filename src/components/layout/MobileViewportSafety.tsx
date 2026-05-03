'use client';

import { useEffect } from 'react';

/**
 * MobileViewportSafety
 * 
 * Handles dynamic viewport height and keyboard offset tracking.
 * This ensures that fixed elements like BottomNav and FAB respond correctly
 * to the mobile keyboard appearing/disappearing.
 */
export function MobileViewportSafety() {
    useEffect(() => {
        const setViewportHeight = () => {
            const vh = window.innerHeight;
            document.documentElement.style.setProperty('--viewport-height', `${vh}px`);
        };

        const handleVisualViewportChange = () => {
            if (!window.visualViewport) return;

            const vv = window.visualViewport;
            const scrollHeight = document.documentElement.scrollHeight;
            const viewportHeight = vv.height;
            const offsetTop = vv.offsetTop;

            // Calculate keyboard height approx
            const keyboardHeight = Math.max(0, window.innerHeight - viewportHeight);

            document.documentElement.style.setProperty('--keyboard-offset', `${keyboardHeight}px`);
            document.documentElement.style.setProperty('--viewport-height', `${viewportHeight}px`);
            document.documentElement.style.setProperty('--safe-bottom', 'env(safe-area-inset-bottom)');

            // Log for debugging (only in dev)
            if (process.env.NODE_ENV === 'development') {
                // console.log(`[Viewport] height: ${viewportHeight}, keyboard: ${keyboardHeight}`);
            }
        };

        // Initial set
        setViewportHeight();
        handleVisualViewportChange();

        // Listen for changes
        window.addEventListener('resize', setViewportHeight);
        if (window.visualViewport) {
            window.visualViewport.addEventListener('resize', handleVisualViewportChange);
            window.visualViewport.addEventListener('scroll', handleVisualViewportChange);
        }

        return () => {
            window.removeEventListener('resize', setViewportHeight);
            if (window.visualViewport) {
                window.visualViewport.removeEventListener('resize', handleVisualViewportChange);
                window.visualViewport.removeEventListener('scroll', handleVisualViewportChange);
            }
        };
    }, []);

    return null;
}
