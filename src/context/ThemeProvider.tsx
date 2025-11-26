// src/context/ThemeProvider.tsx
"use client";

import React, { createContext, useContext, ReactNode } from 'react';
import useTheme from '@/lib/useTheme';

type Theme = "dark" | "light";

interface ThemeContextType {
    theme: Theme | null;
    setTheme: (theme: Theme) => void;
    toggle: () => void;
}

export const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: ReactNode }) {
    const themeValue = useTheme();

    return (
        <ThemeContext.Provider value={themeValue}>
            {children}
        </ThemeContext.Provider>
    );
}

// Note: useTheme hook is imported from '@/lib/useTheme' and used above.

