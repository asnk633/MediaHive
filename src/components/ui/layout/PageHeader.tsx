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
        <div className={cn("flex flex-col gap-6 sm:flex-row sm:items-start sm:justify-between", className)}>
            <div className="space-y-2">
                <h1 className={cn(
                    "font-semibold tracking-tight text-white",
                    size === 'large' ? "text-4xl" : "text-3xl"
                )}>
                    {title}
                </h1>
                {description && (
                    <p className={cn(
                        "text-subtitle max-w-2xl",
                        size === 'large' ? "text-lg" : "text-base"
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
