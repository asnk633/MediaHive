"use client";

import { useEffect, useRef } from 'react';
import { useRouter, usePathname } from 'next/navigation';

export function useModalHistory(isOpen: boolean, onClose: () => void) {
    const pushedRef = useRef(false);
    const pathname = usePathname();
    const searchParams = typeof window !== 'undefined' ? new URLSearchParams(window.location.search) : new URLSearchParams();

    useEffect(() => {
        if (!isOpen) return;

        // Push state when modal opens
        // We append a hash to indicate modal state, or just a dummy state
        const url = `${pathname}?${searchParams.toString()}#modal`;

        // Check if we already pushed (React strict mode safety)
        if (!pushedRef.current) {
            window.history.pushState({ modalOpen: true }, '', url);
            pushedRef.current = true;
        }

        const handlePopState = (e: PopStateEvent) => {
            // If we popped, it means the user pressed back.
            // logic: The history state `modalOpen` is gone.
            // So we should close.
            e.preventDefault();
            onClose();
            pushedRef.current = false; // We are back to original state
        };

        window.addEventListener('popstate', handlePopState);

        return () => {
            window.removeEventListener('popstate', handlePopState);
            // If unmounting and we are still "pushed" (e.g. user clicked Close button),
            // we must go back manually to clean up history.
            if (pushedRef.current) {
                // We can't just history.back() here blindly because unmount might handle it?
                // Actually, if we are closing via UI, isOpen becomes false.
                // This cleanup runs.
                window.history.back();
                pushedRef.current = false;
            }
        };
    }, [isOpen, pathname, searchParams]);
}
