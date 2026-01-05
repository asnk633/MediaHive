import { useEffect, useState, useCallback } from "react";

type Theme = "dark";

export function getPreferredTheme(): Theme {
    return "dark";
}

export default function useTheme(initial?: Theme) {
    const [theme] = useState<Theme>("dark");

    // Force strict Dark Mode on mount
    useEffect(() => {
        try {
            const root = document.documentElement;
            root.setAttribute("data-theme", "dark");
            root.classList.add("dark");

            // Clear any legacy 'light' setting
            localStorage.setItem("theme", "dark");
        } catch (e) { }
    }, []);

    const toggle = useCallback(() => {
        // No-op: Theme is locked
        console.log("Theme is locked to Night Sky");
    }, []);

    // Provide legacy setters for compatibility but they do nothing
    const setTheme = () => { };

    return { theme, setTheme, toggle };
}
