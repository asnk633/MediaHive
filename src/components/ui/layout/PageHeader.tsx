import React, { ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface PageHeaderProps {
    title: string | ReactNode;
    description?: string;
    actions?: ReactNode;
    className?: string;
    size?: 'default' | 'large';
}

export function PageHeader({ title, description, actions, className, size = 'default' }: PageHeaderProps) {
    return (
        <div className={cn("flex flex-col gap-6 sm:flex-row sm:items-start sm:justify-between border-l-2 border-primary/20 pl-6 py-1", className)}>
            <div className="space-y-4">
                <h1 className={cn(
                    "font-black tracking-tight text-foreground uppercase leading-none",
                    size === 'large' ? "text-4xl" : "text-3xl"
                )}>
                    {title}
                </h1>
                {description && (
                    <p className={cn(
                        "text-muted-foreground font-medium uppercase tracking-[0.2em] opacity-40 leading-relaxed max-w-2xl",
                        size === 'large' ? "text-[11px]" : "text-[10px]"
                    )}>
                        {description}
                    </p>
                )}
            </div>
            {actions && (
                <div className="flex items-center gap-3 mt-4 sm:mt-0">
                    {actions}
                </div>
            )}
        </div>
    );
}
