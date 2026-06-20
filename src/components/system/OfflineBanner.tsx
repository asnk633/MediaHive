"use client";

import { useState, useEffect } from "react";
import { useNetworkStatus } from "@/hooks/useNetworkStatus";
import { cn } from "@/lib/utils";

export function OfflineBanner() {
    const rawState = useNetworkStatus();
    const [mounted, setMounted] = useState(false);
    const [debouncedState, setDebouncedState] = useState(rawState);

    useEffect(() => {
        setMounted(true);
    }, []);

    useEffect(() => {
        if (rawState === "offline") {
            // Debounce network drops by 1500ms to prevent UI flicker
            const timer = setTimeout(() => {
                setDebouncedState("offline");
            }, 1500);
            return () => clearTimeout(timer);
        } else {
            setDebouncedState("online");
        }
    }, [rawState]);

    if (!mounted || debouncedState === "online") return null;

    const copy = "You’re offline. Changes will sync when you’re back online.";

    return (
        <div
            role="status"
            aria-live="polite"
            className={cn(
                "fixed inset-x-0 top-0 z-[100]", // High z-index to overlay
                "flex justify-center px-4 py-3 text-xs font-semibold tracking-wide uppercase",
                "transition-all duration-300 ease-out shadow-lg backdrop-blur-md",
                "motion-reduce:transition-none",
                "bg-red-500/90 text-foreground border-b border-red-500/50"
            )}
        >
            {copy}
        </div>
    );
}
