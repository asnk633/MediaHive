import React from 'react';
import { useTheme } from '@/contexts/ThemeContext';
import { Check, Moon, Sun, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';

export const ThemeSelector = () => {
    const { theme, setTheme } = useTheme();

    const themes = [
        {
            id: 'aura',
            name: 'Aura',
            description: 'Default (Locked)',
            icon: Sparkles,
            color: 'bg-indigo-600',
        },
        {
            id: 'dusk',
            name: 'Dusk',
            description: 'Dark · Low-Glow',
            icon: Moon,
            color: 'bg-slate-900',
        },
        {
            id: 'frost',
            name: 'Frost',
            description: 'Light · Professional',
            icon: Sun,
            color: 'bg-slate-100 text-slate-900',
        },
    ] as const;

    return (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {themes.map((t) => {
                const isActive = theme === t.id;
                const Icon = t.icon;

                return (
                    <button
                        key={t.id}
                        onClick={() => setTheme(t.id)}
                        className={cn(
                            "relative flex flex-col items-start gap-3 p-4 rounded-xl border transition-all duration-200 text-left",
                            isActive
                                ? "bg-primary/10 border-primary ring-1 ring-primary"
                                : "bg-card border-border hover:bg-accent/50 hover:border-primary/50"
                        )}
                    >
                        <div className={cn(
                            "w-8 h-8 rounded-lg flex items-center justify-center shrink-0",
                            t.color,
                            t.id === 'frost' ? '' : 'text-white'
                        )}>
                            <Icon size={16} />
                        </div>

                        <div className="space-y-1">
                            <div className="font-medium text-sm text-foreground flex items-center gap-2">
                                {t.name}
                                {isActive && <Check size={14} className="text-primary" />}
                            </div>
                            <p className="text-xs text-muted-foreground w-full">
                                {t.description}
                            </p>
                        </div>
                    </button>
                );
            })}
        </div>
    );
};
