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
}

export function OverviewCard({
    icon: Icon,
    count,
    label,
    subLabel,
    variant = "default",
    onClick,
}: OverviewCardProps) {
    const isPrimary = variant === "primary";

    return (
        <div
            onClick={onClick}
            className={cn(
                "relative flex flex-col p-5 rounded-[20px] transition-all duration-300 cursor-pointer overflow-hidden",
                isPrimary
                    ? "bg-gradient-to-br from-[var(--color-primary-start)] to-[var(--color-primary-end)] text-white shadow-lg shadow-blue-500/25"
                    : "bg-white border border-[var(--color-border)] text-[var(--color-text-primary)] shadow-sm hover:shadow-md"
            )}
        >
            <div className="flex justify-between items-start mb-4">
                <div
                    className={cn(
                        "p-2 rounded-full backdrop-blur-sm",
                        isPrimary ? "bg-white/20 text-white" : "bg-gray-100 text-[var(--color-text-secondary)]"
                    )}
                >
                    <Icon size={20} />
                </div>
            </div>

            <div className="mt-auto">
                <h3 className={cn("text-3xl font-bold mb-0.5", isPrimary ? "text-white" : "text-[var(--color-text-primary)]")}>
                    {count}
                </h3>
                <p className={cn("text-sm font-medium opacity-90", isPrimary ? "text-white/90" : "text-[var(--color-text-secondary)]")}>
                    {label}
                </p>
                <p className={cn("text-xs mt-1 font-medium", isPrimary ? "text-white/80" : "text-[var(--color-text-secondary)]")}>
                    {subLabel}
                </p>
            </div>
        </div>
    );
}
