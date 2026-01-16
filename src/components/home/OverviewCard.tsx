import React from "react";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface OverviewCardProps {
    icon: LucideIcon;
    count: string | number;
    label: string;
    subLabel: string;
    variant?: "primary" | "default";
    onClick?: () => void;
    trend?: {
        direction: 'up' | 'down';
        value: number;
    };
    showIndicator?: boolean;
}

export function OverviewCard({
    icon: Icon,
    count,
    label,
    subLabel,
    variant = "default",
    onClick,
    showIndicator = false,
    trend,
}: OverviewCardProps) {
    const isPrimary = variant === "primary";

    return (
        <div
            onClick={onClick}
            className={cn(
                "relative flex flex-col p-6 rounded-xl transition-all duration-300 cursor-pointer overflow-hidden group hover:-translate-y-1 animate-in fade-in zoom-in-95 duration-500",
                // Base Style (Inventory Match - Modified for Borderless)
                "bg-surface backdrop-blur-sm shadow-sm",
                // Hover
                "hover:shadow-lg hover:bg-surface/80",
                // Primary Variant (Subtle distinction instead of new gradient)
                isPrimary && "shadow-strong bg-primary/5",
                // Indicator Glow
                showIndicator && "shadow-destructive/10"
            )}
        >
            <div className="flex justify-between items-start mb-6">
                <div
                    className={cn(
                        "p-3 rounded-lg transition-colors",
                        isPrimary
                            ? "bg-primary/10 text-primary"
                            : "bg-glass text-secondary group-hover:text-primary group-hover:bg-primary/10"
                    )}
                >
                    <Icon size={24} strokeWidth={1.5} />
                </div>
                {/* Decorative Pill/Dot */}
                <div className={cn("h-2 w-2 rounded-full transition-colors duration-300",
                    showIndicator ? "bg-destructive shadow-[0_0_10px_rgba(239,68,68,0.8)] animate-pulse" :
                        isPrimary ? "bg-primary shadow-[0_0_10px_rgba(96,165,250,0.8)]" : "bg-glass group-hover:bg-primary/50"
                )} />
            </div>

            <div className="mt-auto z-10 relative">
                <div className="flex items-end gap-2 mb-1">
                    <h3 className="text-3xl font-bold tracking-tight text-foreground group-hover:text-foreground transition-colors">
                        {count}
                    </h3>
                    {trend && (
                        <div className={cn("flex items-center text-xs font-bold mb-1.5",
                            trend.direction === 'up' ? "text-emerald-400" : "text-rose-400"
                        )}>
                            <span>{trend.direction === 'up' ? '▲' : '▼'}</span>
                            <span className="ml-1">{trend.value}</span>
                        </div>
                    )}
                </div>
                <p className={cn("text-xs font-bold uppercase tracking-widest transition-colors",
                    isPrimary ? "text-secondary" : "text-muted group-hover:text-secondary")}>
                    {label}
                </p>
                <div className={cn("mt-4 pt-4 flex items-center justify-between transition-colors",
                    "border-t border-soft/50")}>
                    <p className={cn("text-xs font-medium transition-colors",
                        "text-muted group-hover:text-secondary")}>
                        {subLabel}
                    </p>
                    <div className={cn("text-[10px] px-2 py-1 rounded-full border transition-all",
                        "border-soft bg-glass text-muted group-hover:bg-primary/10 group-hover:text-primary group-hover:border-primary/20"
                    )}>
                        View
                    </div>
                </div>
            </div>

            {/* Subtle Gradient overlay for primary only - very soft */}
            {isPrimary && (
                <div className="absolute inset-0 bg-blue-500/5 pointer-events-none" />
            )}
        </div>
    );
}
