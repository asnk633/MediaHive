import React, { ReactNode } from 'react';
import { PageContainer } from '@/components/ui/PageContainer';
import { cn } from '@/lib/utils';

interface PageLayoutProps {
    children: ReactNode;
    className?: string;
    mode?: 'standard' | 'focused' | 'plain';
}

export function PageLayout({ children, className, mode = 'standard' }: PageLayoutProps) {
    // focused = standard content plane
    // plain = no panel (for lists/cards)

    return (
        <PageContainer className={cn("pt-8 pb-12 space-y-12", className)}>
            {mode === 'standard' ? (
                <div className="bg-glass rounded-3xl p-6 sm:p-8 space-y-10 border border-border">
                    {children}
                </div>
            ) : (
                <div className="space-y-10">
                    {children}
                </div>
            )}
        </PageContainer>
    );
}
