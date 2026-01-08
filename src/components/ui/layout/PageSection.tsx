import React, { ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface PageSectionProps {
    title?: string;
    children: ReactNode;
    className?: string;
}

export function PageSection({ title, children, className }: PageSectionProps) {
    return (
        <section className={cn("space-y-6", className)}>
            {title && (
                <h2 className="text-lg font-semibold text-slate-100 tracking-wide">
                    {title}
                </h2>
            )}
            {children}
        </section>
    );
}
