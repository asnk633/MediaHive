"use client";

import React, { createContext, useContext, useEffect, useState } from 'react';

type Theme = 'aura' | 'dusk' | 'frost';

interface ThemeContextType {
    theme: Theme;
    setTheme: (theme: Theme) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

const THEME_KEY = 'mediahive-theme';

export function ThemeProvider({ children }: { children: React.ReactNode }) {
    const [theme, setThemeState] = useState<Theme>('aura');
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
        // 1. Check local storage
        const storedTheme = localStorage.getItem(THEME_KEY) as Theme;

        // 2. Validate stored theme (fallback to aura if invalid)
        if (storedTheme && ['aura', 'dusk', 'frost'].includes(storedTheme)) {
            setThemeState(storedTheme);
            document.documentElement.setAttribute('data-theme', storedTheme);
        } else {
            // 3. Enforce Aura default
            setThemeState('aura');
            document.documentElement.setAttribute('data-theme', 'aura');
            localStorage.setItem(THEME_KEY, 'aura');
        }
    }, []);

    const setTheme = (newTheme: Theme) => {
        setThemeState(newTheme);
        localStorage.setItem(THEME_KEY, newTheme);
        document.documentElement.setAttribute('data-theme', newTheme);
    };

    // Prevent hydration mismatch by rendering only after mount, 
    // or render children but with default theme (Aura) which matches server if possible?
    // Since this is a client functionality (localstorage), we might want to avoid flashing.
    // But Aura is the default.

    const value = React.useMemo(() => ({ theme, setTheme }), [theme]);

    return (
        <ThemeContext.Provider value={value}>
            {children}
        </ThemeContext.Provider>
    );
}

export function useTheme() {
    const context = useContext(ThemeContext);
    if (context === undefined) {
        throw new Error('useTheme must be used within a ThemeProvider');
    }
    return context;
}
