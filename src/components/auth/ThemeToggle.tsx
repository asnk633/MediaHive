'use client';

import React from 'react';
import { Sun, Moon } from 'lucide-react';
import { useTheme } from '@/contexts/ThemeContext';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';

export function ThemeToggle() {
    const { theme, setTheme } = useTheme();

    return (
        <div className="absolute top-6 right-6 z-50 flex items-center gap-1.5 p-1 rounded-full backdrop-blur-md bg-black/10 dark:bg-white/10 border border-black/5 dark:border-white/5 shadow-lg select-none">
            <button
                type="button"
                onClick={() => setTheme('light')}
                className="relative flex items-center justify-center w-8 h-8 rounded-full transition-colors duration-200"
                title="Light Theme"
            >
                {theme === 'light' && (
                    <motion.div
                        layoutId="active-theme-bg"
                        className="absolute inset-0 bg-black/10 dark:bg-white/10 rounded-full border border-black/5 dark:border-white/5 shadow-inner"
                        transition={{ type: "spring", stiffness: 380, damping: 30 }}
                    />
                )}
                <Sun size={14} className={cn("relative z-10 transition-colors", theme === 'light' ? "text-primary dark:text-sky-400" : "text-black/45 dark:text-white/45 hover:text-black/85 dark:hover:text-white/85")} />
            </button>
            <button
                type="button"
                onClick={() => setTheme('dark')}
                className="relative flex items-center justify-center w-8 h-8 rounded-full transition-colors duration-200"
                title="Dark Theme"
            >
                {theme === 'dark' && (
                    <motion.div
                        layoutId="active-theme-bg"
                        className="absolute inset-0 bg-black/10 dark:bg-white/10 rounded-full border border-black/5 dark:border-white/5 shadow-inner"
                        transition={{ type: "spring", stiffness: 380, damping: 30 }}
                    />
                )}
                <Moon size={14} className={cn("relative z-10 transition-colors", theme === 'dark' ? "text-primary dark:text-sky-400" : "text-black/45 dark:text-white/45 hover:text-black/85 dark:hover:text-white/85")} />
            </button>
        </div>
    );
}
