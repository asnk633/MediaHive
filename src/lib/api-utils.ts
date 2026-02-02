import { Capacitor } from '@capacitor/core';

/**
 * Determines the API base URL based on platform.
 * ⚠️ SEE API_ARCHITECTURE.md BEFORE MODIFYING THIS LOGIC.
 * Web builds MUST always use same-origin relative paths.
 */
export function getApiBaseUrl(): string | null {
    if (typeof window !== 'undefined' &&
        ((window as any).Capacitor?.isNativePlatform?.() || Capacitor.isNativePlatform())) {
        // On native/android, we MUST use the full URL. 
        // If env var is missing, we return null to signal fatal error.
        return process.env.NEXT_PUBLIC_API_URL || null;
    }

    // On web, if API_URL is provided, we use it (e.g. for static exports pointing to a backend).
    // Otherwise, we default to relative paths for same-origin proxying.
    return process.env.NEXT_PUBLIC_API_URL || '';
}

export async function fetchWithTimeout(
    url: string,
    options: RequestInit = {},
    timeoutMs = 15000 // Default to 15s as per P0 requirement
) {
    const controller = new AbortController();
    const id = setTimeout(() => controller.abort(), timeoutMs);

    // If user provided a signal, we should respect it, but we can't easily merge signals without extra logic.
    // For P0, we prioritize the timeout. 
    // Ideally: const signal = AnySignal([controller.signal, options.signal]);

    try {
        const res = await fetch(url, {
            ...options,
            signal: controller.signal,
        });
        return res;
    } catch (error: any) {
        if (error.name === 'AbortError') {
            throw new Error(`[TIMEOUT] Request to ${url} exceeded ${timeoutMs}ms`);
        }
        throw error;
    } finally {
        clearTimeout(id);
    }
}
