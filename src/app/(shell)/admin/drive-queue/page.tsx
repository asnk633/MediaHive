'use client';



import React from 'react';
import { useAuth } from '@/contexts/AuthContextProvider';
import { PageLayout } from "@/components/ui/layout/PageLayout";
import { PageHeader } from "@/components/ui/layout/PageHeader";
import { DriveQueueView } from '@/components/admin/DriveQueueView';

export default function DriveQueuePage() {
    const { user } = useAuth();

    if (!user || user.role !== 'admin') {
        return (
            <PageLayout mode="plain">
                <div className="p-8 text-center text-white/50">Unauthorized</div>
            </PageLayout>
        );
    }

    return (
        <PageLayout mode="plain">
            <PageHeader
                title="Detected from Drive"
                description="Review and approve files uploaded directly to the '/MediaHive/Incoming' Drive folder."
            />
            <div className="mt-8">
                <DriveQueueView />
            </div>
        </PageLayout>
    );
}
