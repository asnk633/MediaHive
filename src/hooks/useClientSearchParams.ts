'use client';

import { useMemo } from 'react';

/**
 * SSG-safe wrapper for getting search params
 * Returns null during SSG, actual params on client
 */
export function useClientSearchParams() {
    // During SSG, return null
    if (typeof window === 'undefined') {
        return null;
    }

    try {
        // Use URLSearchParams with window.location.search directly
        const searchParams = new URLSearchParams(window.location.search);
        return searchParams;
    } catch (error) {
        // Fallback if URLSearchParams fails
        console.warn('[useClientSearchParams] Failed to get search params:', error);
        return null;
    }
}

/**
 * Get a specific search param value safely
 */
export function useClientSearchParam(key: string): string | null {
    const searchParams = useClientSearchParams();
    return useMemo(() => {
        if (!searchParams) return null;
        return searchParams.get(key);
    }, [searchParams, key]);
}
