'use client';

import { AnchorHTMLAttributes, ReactNode } from 'react';
import Link from 'next/link';
declare global {
    interface Window {
        Capacitor?: {
            isNative: boolean;
        };
    }
}

interface AppLinkProps extends Omit<AnchorHTMLAttributes<HTMLAnchorElement>, 'href'> {
    href: string;
    children: ReactNode;
}

/**
 * AppLink - Intelligent navigation component for hybrid web/native apps
 * 
 * Behavior:
 * - In Capacitor/native: Uses standard <a> tag for static HTML navigation
 * - On web: Uses Next.js <Link> with prefetch disabled
 * 
 * This prevents RSC prefetch requests in Capacitor while maintaining
 * Next.js routing benefits on web.
 */
export default function AppLink({ href, children, className, ...props }: AppLinkProps) {
    // Detect if running in Capacitor native environment
    const isNative = typeof window !== 'undefined' && window.Capacitor?.isNative;

    if (isNative) {
        // Use native anchor for Capacitor - no prefetch, pure HTML navigation
        return (
            <a href={href} className={className} {...props}>
                {children}
            </a>
        );
    }

    // Use Next.js Link for web with prefetch disabled
    return (
        <Link href={href} prefetch={false} className={className} {...props}>
            {children}
        </Link>
    );
}
