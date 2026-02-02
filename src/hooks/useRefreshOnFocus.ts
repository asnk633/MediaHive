import { useEffect, useRef } from 'react';

/**
 * useRefreshOnFocus
 * 
 * Accurately triggers a refresh callback when the window returns to focus.
 * Useful for ensuring "Stale Data Truthfulness" without user intervention.
 * 
 * @param onRefresh Function to call when window gains focus
 * @param enabled Whether the hook is active (default: true)
 */
export function useRefreshOnFocus(onRefresh: () => void | Promise<void>, enabled: boolean = true) {
    const onRefreshRef = useRef(onRefresh);
    const lastFocusStr = useRef<string>(new Date().toISOString());

    // Keep ref fresh
    useEffect(() => {
        onRefreshRef.current = onRefresh;
    }, [onRefresh]);

    useEffect(() => {
        if (!enabled) return;

        const onFocus = () => {
            // Optional: Debounce or check time since last refresh here if needed
            // For now, we trust the simple focus event signal
            onRefreshRef.current();
        };

        window.addEventListener('focus', onFocus);
        return () => {
            window.removeEventListener('focus', onFocus);
        };
    }, [enabled]);
}
