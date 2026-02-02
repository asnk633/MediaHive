'use client';

import React from 'react';
import InventoryView from '@/components/inventory/InventoryView';
import { PageLayout } from '@/components/ui/layout/PageLayout';
import { useAuth } from '@/contexts/AuthContextProvider';
import { InventoryStatsWidget } from '@/components/home/widgets/InventoryStatsWidget';
import { SectionHeader } from '@/components/ui/SectionHeader';
import { useState, useEffect } from 'react';

import { OfflinePlaceholder } from '@/components/OfflinePlaceholder';
import { Package } from 'lucide-react';

import { useNative } from '@/hooks/useNative';

export default function InventoryClient() {
    const { user } = useAuth();
    const { isNative } = useNative();
    const [isChecking, setIsChecking] = useState(true);

    useEffect(() => {
        setIsChecking(false);
    }, []);

    if (isChecking) return <div className="min-h-screen bg-slate-950" />;

    // TODO: [Future Sync]
    // When offline sync is implemented, we will invoke syncService here or enable write actions.
    // For now, allow render (view-only).

    /*
    if (isNative) {
        // TODO: [Future Sync]
        // When offline sync is implemented, this guard should check:
        // if (isNative && !syncService.isReady) ...
        // Instead of hard blocking all native access.
        return (
            <PageLayout mode="plain">
                <OfflinePlaceholder
                    title="Inventory Sync"
                    message="Mobile inventory sync is coming soon. Use the web app for full management."
                    icon={Package}
                />
            </PageLayout>
        );
    }
    */

    return (
        <PageLayout mode="plain">
            {user?.role === 'admin' && (
                <div className="mb-8">
                    <SectionHeader title="Inventory Snapshot" />
                    <InventoryStatsWidget />
                </div>
            )}
            <InventoryView />
        </PageLayout>
    );
}
