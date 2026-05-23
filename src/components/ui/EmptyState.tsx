import React from 'react';
import { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

interface EmptyStateProps {
    icon: LucideIcon;
    title: string;
    description?: string;
    action?: React.ReactNode;
    className?: string;
    compact?: boolean;
}

export default function EmptyState({
    icon: Icon,
    title,
    description,
    action,
    className,
    compact = false
}: EmptyStateProps) {
    return (
        <div className={cn(
            "mh-empty-state flex flex-col items-center justify-center text-center animate-in fade-in duration-500",
            compact ? "py-6" : "py-12 px-6",
            className
        )}>
            <div className={cn(
                "rounded-full bg-foreground/[0.02] border border-foreground/5 flex items-center justify-center mb-4 transition-transform hover:scale-105 duration-300",
                compact ? "w-12 h-12" : "w-16 h-16"
            )}>
                <Icon className={cn("text-foreground/80", compact ? "w-6 h-6" : "w-8 h-8")} />
            </div>
            <h3 className={cn(
                "font-bold text-foreground/80 tracking-tight",
                compact ? "text-base" : "text-lg"
            )}>
                {title}
            </h3>
            {description && (
                <p className={cn(
                    "text-foreground/70 font-medium max-w-[280px] mx-auto mt-1 leading-relaxed",
                    compact ? "text-[11px]" : "text-sm"
                )}>
                    {description}
                </p>
            )}
            {action && (
                <div className="mt-6">
                    {action}
                </div>
            )}
        </div>
    );
}
