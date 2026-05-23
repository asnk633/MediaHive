'use client';

import React from 'react';
import { useTheme } from '@/contexts/ThemeContext';
import { cn } from '@/lib/utils';
import { Check } from 'lucide-react';

const themes = [
    {
        id: 'midnight',
        name: 'Midnight Indigo',
        description: 'Deep dark slate with rich blue & purple accents.',
        bgFrom: '#02040a',
        bgTo: '#0c0b25',
        accent: '#6366f1',
        preview: [
            { color: '#02040a', flex: 2 },
            { color: '#1a1a3e', flex: 1.5 },
            { color: '#6366f1', flex: 0.8 },
        ],
    },
    {
        id: 'golden',
        name: 'Golden Glass',
        description: 'Warm amber canvas with glassmorphism & golden glow.',
        bgFrom: '#02040a',
        bgTo: '#151100',
        accent: '#FFB800',
        preview: [
            { color: '#02040a', flex: 2 },
            { color: '#1a1400', flex: 1.5 },
            { color: '#FFB800', flex: 0.8 },
        ],
    },
    {
        id: 'luminous',
        name: 'Luminous White',
        description: 'Bright airy layout with vivid sky-blue accents.',
        bgFrom: '#f8fafc',
        bgTo: '#e2e8f0',
        accent: '#0284c7',
        preview: [
            { color: '#f8fafc', flex: 2 },
            { color: '#dbeafe', flex: 1.5 },
            { color: '#0284c7', flex: 0.8 },
        ],
    },
];

export const ThemeSelector = () => {
    const { theme, setTheme } = useTheme();

    return (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
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
                                        className="w-4 h-4 rounded-full flex items-center justify-center"
                                        style={{ backgroundColor: t.accent }}
                                    >
                                        <Check size={9} className="text-foreground" strokeWidth={3} />
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
