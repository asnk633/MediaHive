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
                "relative flex flex-col p-6 rounded-[25px] transition-all duration-300 cursor-pointer overflow-hidden group hover:-translate-y-1 hover-sheen animate-in fade-in zoom-in-95 duration-500",
                isPrimary
                    ? "bg-gradient-to-br from-[#141e30] to-[#243b55] text-white shadow-[5px_10px_50px_rgba(0,0,0,0.5),-5px_0px_20px_rgba(255,255,255,0.05)] border-none"
                    : "bg-white/5 backdrop-blur-md border border-white/10 text-white shadow-[0px_4px_20px_rgba(0,0,0,0.2)] hover:bg-white/10"
            )}
        >
            <div className="flex justify-between items-start mb-6">
                <div
                    className={cn(
                        "p-3 rounded-2xl backdrop-blur-md transition-colors",
                        isPrimary
                            ? "bg-white/10 text-blue-300 shadow-inner border border-white/10"
                            : "bg-white/5 text-gray-300 border border-white/5"
                    )}
                >
                    <Icon size={24} strokeWidth={1.5} />
                </div>
                {/* Decorative Pill/Dot */}
                <div className={cn("h-2 w-2 rounded-full transition-colors duration-300",
                    showIndicator ? "bg-red-500 shadow-[0_0_10px_rgba(239,68,68,0.8)] animate-pulse" :
                        isPrimary ? "bg-blue-400 shadow-[0_0_10px_rgba(96,165,250,0.8)]" : "bg-white/20"
                )} />
            </div>

            <div className="mt-auto z-10 relative">
                <div className="flex items-end gap-2 mb-1">
                    <h3 className="text-4xl font-bold tracking-tight text-white drop-shadow-sm">
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
                <p className={cn("text-xs font-bold uppercase tracking-widest", isPrimary ? "text-blue-200" : "text-gray-400")}>
                    {label}
                </p>
                <div className={cn("mt-4 pt-4 border-t flex items-center justify-between", isPrimary ? "border-white/10" : "border-white/10")}>
                    <p className={cn("text-xs font-medium", isPrimary ? "text-white/60" : "text-gray-500")}>
                        {subLabel}
                    </p>
                    <div className={cn("text-[10px] px-2 py-1 rounded-full border",
                        isPrimary ? "border-white/10 bg-white/5 text-white/80" : "border-white/5 bg-black/20 text-gray-400"
                    )}>
                        View
                    </div>
                </div>
            </div>

            {/* Background Glow for Primary */}
            {isPrimary && (
                <div className="absolute -bottom-10 -right-10 w-40 h-40 bg-blue-500/20 rounded-full blur-[50px] pointer-events-none" />
            )}
        </div>
    );
}
