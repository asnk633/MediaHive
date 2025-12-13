"use client";

import { useEffect } from "react";

export function WebViewDetector() {
    useEffect(() => {
        // STRIP-DOWN FIX: Only target the actual WebView (which has 'wv' in UA)
        // Standard Chrome on Android does NOT have 'wv', so it keeps the nice UI.
        const ua = navigator.userAgent || "";
        if (ua.includes("wv")) {
            document.documentElement.classList.add("is-android-webview");
        }
    }, []);

    return null;
}
