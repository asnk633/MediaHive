"use client";
import { useEffect } from "react";
import { detectDomModifications } from "@/utils/detect-dom-modifications";

export function HydrationDetector() {
    useEffect(() => {
        // Only run in development AND when explicitly enabled
        // Default: Silent
        if (process.env.NODE_ENV === 'development' && process.env.NEXT_PUBLIC_DEBUG_HYDRATION === 'true') {
            detectDomModifications();
        }
    }, []);
    return null;
}
