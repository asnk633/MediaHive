'use client';

import React from 'react';
import { AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface DataIntegritySignalProps {
    /** Metadata from data source (e.g., from CanonicalDataService) */
    meta?: {
        total?: number;
        isCapped?: boolean;
        limit?: number;
    };
    /** Custom message override */
    message?: string;
    /** Visual style variant */
    variant?: 'subtle' | 'muted';
    /** Additional CSS classes */
    className?: string;
}

/**
 * DataIntegritySignal — Quiet Honesty Component
 * 
 * Displays a subtle, inline indicator when data is incomplete or truncated.
 * This is NOT a banner. It's a quiet, honest signal.
 * 
 * Usage:
 * ```tsx
 * <DataIntegritySignal meta={(tasks as any).__meta} />
 * ```
 */
export function DataIntegritySignal({
    meta,
    message,
    variant = 'subtle',
    className
}: DataIntegritySignalProps) {
    // Don't render if no truncation
    if (!meta?.isCapped && !message) return null;

    const defaultMessage = meta?.isCapped
        ? `Showing ${meta.limit} of ${meta.total}`
        : message;

    if (!defaultMessage) return null;

    const variantStyles = {
        subtle: 'text-amber-400/50 hover:text-amber-400/70',
        muted: 'text-muted/40 hover:text-muted/60'
    };

    return (
        <div
            className={cn(
                "inline-flex items-center gap-1.5 text-[10px] font-medium tracking-wide transition-colors",
                variantStyles[variant],
                className
            )}
            title="Data may be incomplete or filtered"
        >
            <AlertCircle className="w-3 h-3" />
            <span>{defaultMessage}</span>
        </div>
    );
}
