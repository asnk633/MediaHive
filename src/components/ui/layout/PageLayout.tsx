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
                <div className="bg-panel rounded-sm p-6 sm:p-10 space-y-12 border border-border/20 shadow-medium">
                    {children}
                </div>
            ) : (
                <div className="space-y-12">
                    {children}
                </div>
            )}
        </PageContainer>
    );
}
