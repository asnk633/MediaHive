import { useEffect, useState, useCallback } from "react";

type Theme = "dark";

export function getPreferredTheme(): Theme {
    return "dark";
}

export default function useTheme(initial?: Theme) {
    const [theme] = useState<Theme>("dark");

    // Legacy hook - now controlled by ThemeContext.tsx
    // We prevent this hook from interfering with the global theme.
    useEffect(() => {
        // No-op
    }, []);

    const toggle = useCallback(() => {
        // No-op: Theme is locked
        console.log("Theme is locked to Night Sky");
    }, []);

    // Provide legacy setters for compatibility but they do nothing
    const setTheme = () => { };

    return { theme, setTheme, toggle };
}
