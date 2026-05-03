"use client";

import { useEffect, useState } from "react";

/**
 * useConnectivity Hook
 * Tracks the browser's connectivity status.
 */
export function useConnectivity() {
    const [online, setOnline] = useState(true);

    useEffect(() => {
        const updateStatus = () => {
            setOnline(navigator.onLine);
        };

        window.addEventListener("online", updateStatus);
        window.addEventListener("offline", updateStatus);

        updateStatus();

        return () => {
            window.removeEventListener("online", updateStatus);
            window.removeEventListener("offline", updateStatus);
        };
    }, []);

    return { online, isOnline: online };
}
