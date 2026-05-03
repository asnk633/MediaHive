"use client";

import { useState, useEffect } from "react";
import { useNetworkStatus } from "@/hooks/useNetworkStatus";
import { cn } from "@/lib/utils";

export function OfflineBanner() {
    const state = useNetworkStatus();
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    if (!mounted || state === "online") return null;

    const copy =
        state === "offline"
            ? "You’re offline. Changes will sync when you’re back online."
            : "Back online. Syncing…";

    return (
        <div
            role="status"
            aria-live="polite"
            className={cn(
                "fixed inset-x-0 top-0 z-[100]", // High z-index to overlay
                "flex justify-center px-4 py-3 text-xs font-semibold tracking-wide uppercase",
                "transition-all duration-300 ease-out shadow-lg backdrop-blur-md",
                "motion-reduce:transition-none",
                state === "offline"
                    ? "bg-red-500/90 text-white border-b border-red-500/50"
                    : "bg-emerald-500/90 text-white border-b border-emerald-500/50"
            )}
        >
            {copy}
        </div>
    );
}
