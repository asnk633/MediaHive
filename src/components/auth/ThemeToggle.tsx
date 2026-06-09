'use client';

import React from 'react';
import { Sun, Moon, Sparkles } from 'lucide-react';
import { useTheme } from '@/contexts/ThemeContext';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';

export function ThemeToggle() {
    const { theme, setTheme } = useTheme();

    return (
        <div className="absolute top-6 right-6 z-50 flex items-center gap-1.5 p-1 rounded-full backdrop-blur-md bg-black/20 border border-white/5 shadow-lg select-none">
            <button
                type="button"
                onClick={() => setTheme('midnight')}
                className="relative flex items-center justify-center w-8 h-8 rounded-full transition-colors duration-200"
                title="Midnight (Dark)"
            >
                {theme === 'midnight' && (
                    <motion.div
                        layoutId="active-theme-bg"
                        className="absolute inset-0 bg-white/10 rounded-full border border-white/10 shadow-inner"
                        transition={{ type: "spring", stiffness: 380, damping: 30 }}
                    />
                )}
                <Moon size={14} className={cn("relative z-10 transition-colors", theme === 'midnight' ? "text-primary" : "text-white/45 hover:text-white/80")} />
            </button>
            <button
                type="button"
                onClick={() => setTheme('golden')}
                className="relative flex items-center justify-center w-8 h-8 rounded-full transition-colors duration-200"
                title="Golden (Warm Dark)"
            >
                {theme === 'golden' && (
                    <motion.div
                        layoutId="active-theme-bg"
                        className="absolute inset-0 bg-amber-500/10 rounded-full border border-amber-500/25 shadow-inner"
                        transition={{ type: "spring", stiffness: 380, damping: 30 }}
                    />
                )}
                <Sparkles size={14} className={cn("relative z-10 transition-colors", theme === 'golden' ? "text-amber-400" : "text-white/45 hover:text-white/80")} />
            </button>
            <button
                type="button"
                onClick={() => setTheme('luminous')}
                className="relative flex items-center justify-center w-8 h-8 rounded-full transition-colors duration-200"
                title="Luminous (Light)"
            >
                {theme === 'luminous' && (
                    <motion.div
                        layoutId="active-theme-bg"
                        className="absolute inset-0 bg-black/10 rounded-full border border-black/5 shadow-inner"
                        transition={{ type: "spring", stiffness: 380, damping: 30 }}
                    />
                )}
                <Sun size={14} className={cn("relative z-10 transition-colors", theme === 'luminous' ? "text-sky-500" : "text-white/45 hover:text-white/80")} />
            </button>
        </div>
    );
}
