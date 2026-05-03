'use client';

import React from 'react';
import { PageLayout } from '@/components/ui/layout/PageLayout';
import { PageHeader } from '@/components/ui/layout/PageHeader';
import { FlaskConical } from 'lucide-react';

export default function LabsLayout({ children }: { children: React.ReactNode }) {
    return (
        <PageLayout>
            <PageHeader
                title={
                    <div className="flex items-center gap-3">
                        <FlaskConical className="text-amber-500" />
                        <span>MediaHive Labs</span>
                    </div>
                }
                description="Experimental features and prototypes recovered from the feature audit."
            />
            <div className="mt-8">
                {children}
            </div>
        </PageLayout>
    );
}
