import { NextResponse } from 'next/server';
import { Capacitor } from '@capacitor/core';

/**
 * Standard API Response structure for MediaHive
 */
export interface ApiResponse<T = any> {
    success: boolean;
    data?: T;
    error?: string;
    latency?: string;
}

/**
 * apiResponse - Standardized successful API response helper.
 */
export function apiResponse<T>(data: T, status = 200) {
    return NextResponse.json({
        success: true,
        data,
    } as ApiResponse<T>, { status });
}

/**
 * apiError - Standardized error API response helper.
 */
export function apiError(message: string, status = 500) {
    return NextResponse.json({
        success: false,
        error: message,
    } as ApiResponse, { status });
}

/**
 * Determines the API base URL based on platform.
 */
export function getApiBaseUrl(): string | null {
    if (typeof window !== 'undefined' &&
        ((window as any).Capacitor?.isNativePlatform?.() || Capacitor.isNativePlatform())) {
        return process.env.NEXT_PUBLIC_API_URL || null;
    }
    return process.env.NEXT_PUBLIC_API_URL || '';
}

export async function fetchWithTimeout(
    url: string,
    options: RequestInit = {},
    timeoutMs = 15000
) {
    const controller = new AbortController();
    const id = setTimeout(() => controller.abort(), timeoutMs);

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

export const API_BASE = '/api';
