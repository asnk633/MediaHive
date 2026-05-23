"use client";

import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';

type Theme = 'midnight' | 'golden' | 'luminous';

interface ThemeContextType {
    theme: Theme;
    setTheme: (theme: Theme) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

const THEME_KEY = 'mediahive-theme';

export function ThemeProvider({ children }: { children: React.ReactNode }) {
    const [theme, setThemeState] = useState<Theme>('midnight');
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
        // 1. Check local storage
        const storedTheme = localStorage.getItem(THEME_KEY) as Theme;

        // 2. Validate stored theme (fallback to midnight if invalid)
        if (storedTheme && ['midnight', 'golden', 'luminous'].includes(storedTheme)) {
            setThemeState(storedTheme);
            document.documentElement.setAttribute('data-theme', storedTheme);
        } else {
            // 3. Enforce Midnight default
            setThemeState('midnight');
            document.documentElement.setAttribute('data-theme', 'midnight');
            localStorage.setItem(THEME_KEY, 'midnight');
        }

        // 4. Listen to Auth changes to apply user's saved theme from cloud
        const { data: { subscription } } = supabase.auth.onAuthStateChange((event: any, session: any) => {
            if (session?.user?.user_metadata?.theme) {
                const userTheme = session.user.user_metadata.theme as Theme;
                if (['midnight', 'golden', 'luminous'].includes(userTheme)) {
                     setThemeState(userTheme);
                     localStorage.setItem(THEME_KEY, userTheme);
                     document.documentElement.setAttribute('data-theme', userTheme);
                }
            }
        });

        return () => subscription.unsubscribe();
    }, []);

    const setTheme = (newTheme: Theme) => {
        setThemeState(newTheme);
        localStorage.setItem(THEME_KEY, newTheme);
        document.documentElement.setAttribute('data-theme', newTheme);
        // Persist to user metadata (fire and forget)
        supabase.auth.updateUser({ data: { theme: newTheme } }).catch((err: any) => {
            console.error('[Theme] Failed to sync theme to cloud', err);
        });
    };

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
