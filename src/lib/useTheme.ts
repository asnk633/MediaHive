import { useEffect, useState, useCallback } from "react";

type Theme = "dark" | "light";

const STORAGE_KEY = "tg_theme_pref";

export function getPreferredTheme(): Theme | null {
    try {
        const stored = typeof window !== "undefined" ? localStorage.getItem(STORAGE_KEY) : null;
        if (stored === "dark" || stored === "light") return stored;
        if (typeof window !== "undefined" && window.matchMedia) {
            return window.matchMedia("(prefers-color-scheme: light)").matches ? "light" : "dark";
        }
    } catch (e) { }
    return null;
}

export default function useTheme(initial?: Theme) {
    const [theme, setTheme] = useState<Theme | null>(initial ?? null);

    // init on client
    useEffect(() => {
        const stored = getPreferredTheme();
        setTheme(stored ?? initial ?? "dark");
    }, [initial]);

    useEffect(() => {
        if (!theme) return;
        try {
            document.documentElement.setAttribute("data-theme", theme);
            localStorage.setItem(STORAGE_KEY, theme);
        } catch (e) { }
    }, [theme]);

    const toggle = useCallback(() => {
        setTheme((t) => (t === "dark" ? "light" : "dark"));
    }, []);

    return { theme, setTheme, toggle };
}
