// src/hooks/useTheme.ts
'use client'
import { useEffect, useState } from 'react';

export type Theme = 'light' | 'dark';

export default function useTheme(initial?: Theme) {
  const [theme, setTheme] = useState<Theme>(() => {
    try {
      return (localStorage.getItem('theme') as Theme) || (initial ?? 'dark');
    } catch {
      return initial ?? 'dark';
    }
  });

  useEffect(() => {
    try {
      document.documentElement.setAttribute('data-theme', theme);
      localStorage.setItem('theme', theme);
    } catch (e) {}
  }, [theme]);

  return { theme, setTheme };
}