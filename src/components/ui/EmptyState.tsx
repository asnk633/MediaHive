import { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface EmptyStateProps {
    icon?: LucideIcon;
    title: string;
    description: string;
    actionLabel?: string;
    onAction?: () => void;
    className?: string;
}

export default function EmptyState({
    icon: Icon,
    title,
    description,
    actionLabel,
    onAction,
    className
}: EmptyStateProps) {
    return (
        <div className={cn("flex flex-col items-center justify-center py-16 px-4 text-center", className)}>
            {Icon && (
                <div className="w-20 h-20 rounded-full bg-[rgba(255,255,255,0.03)] border border-[var(--border-subtle)] flex items-center justify-center mb-6">
                    <Icon className="w-8 h-8 text-[var(--text-muted)] opacity-80" />
                </div>
            )}
            <h3 className="text-xl font-bold text-[var(--text-primary)] mb-2 font-display">{title}</h3>
            <p className="text-[var(--text-secondary)] max-w-xs mx-auto mb-8 text-sm">{description}</p>

            {actionLabel && onAction && (
                <button
                    onClick={onAction}
                    className="px-6 py-2.5 rounded-full bg-gradient-to-r from-[var(--primary-start)] to-[var(--primary-end)] text-white font-medium text-sm shadow-[var(--shadow-fab)] hover:opacity-90 transition-opacity"
                >
                    {actionLabel}
                </button>
            )}
        </div>
    );
}
