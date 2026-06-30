'use client';

import React from 'react';
import { useTheme } from '@/contexts/ThemeContext';
import { cn } from '@/lib/utils';
import { Check } from 'lucide-react';

const themes = [
    {
        id: 'light',
        name: 'Light Theme',
        description: 'Clean flat light mode with high contrast text.',
        bgFrom: '#ffffff',
        bgTo: '#f1f5f9',
        accent: '#2563eb',
        preview: [
            { color: '#ffffff', flex: 2 },
            { color: '#f1f5f9', flex: 1.5 },
            { color: '#2563eb', flex: 0.8 },
        ],
    },
    {
        id: 'dark',
        name: 'Dark Theme',
        description: 'Restful dark mode for low-light environments.',
        bgFrom: '#0f172a',
        bgTo: '#1e293b',
        accent: '#38bdf8',
        preview: [
            { color: '#0f172a', flex: 2 },
            { color: '#1e293b', flex: 1.5 },
            { color: '#38bdf8', flex: 0.8 },
        ],
    },
];

export const ThemeSelector = () => {
    const { theme, setTheme } = useTheme();

    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {themes.map((t) => {
                const isActive = theme === t.id;
                return (
                    <button
                        key={t.id}
                        onClick={() => setTheme(t.id as any)}
                        className={cn(
                            'group relative flex flex-col gap-3 p-3 rounded-xl border text-left transition-all duration-200',
                            isActive
                                ? 'border-primary bg-primary/10 ring-1 ring-primary/30'
                                : 'border-foreground/8 hover:border-foreground/20 hover:bg-foreground/5'
                        )}
                    >
                        {/* Color Preview Bar */}
                        <div className="h-12 w-full rounded-lg flex overflow-hidden shadow-inner">
                            {t.preview.map((seg, i) => (
                                <div
                                    key={i}
                                    style={{ backgroundColor: seg.color, flex: seg.flex }}
                                />
                            ))}
                        </div>

                        {/* Name + Description */}
                        <div className="flex flex-col gap-0.5">
                            <div className="flex items-center justify-between">
                                <span
                                    className={cn(
                                        'text-xs font-semibold',
                                        isActive ? 'text-primary' : 'text-foreground/80'
                                    )}
                                >
                                    {t.name}
                                </span>
                                {isActive && (
                                    <div
                                        className="w-4 h-4 rounded-full flex items-center justify-center bg-primary"
                                    >
                                        <Check size={9} className="text-white" strokeWidth={3} />
                                    </div>
                                )}
                            </div>
                            <p className="text-[10px] text-foreground/80 leading-snug">{t.description}</p>
                        </div>
                    </button>
                );
            })}
        </div>
    );
};
