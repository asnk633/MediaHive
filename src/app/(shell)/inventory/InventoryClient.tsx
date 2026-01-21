'use client';

import React from 'react';
import InventoryView from '@/components/inventory/InventoryView';
import { PageLayout } from '@/components/ui/layout/PageLayout';
import { useAuth } from '@/contexts/AuthContext';
import { InventoryStatsWidget } from '@/components/home/widgets/InventoryStatsWidget';
import { SectionHeader } from '@/components/ui/SectionHeader';

export default function InventoryClient() {
    const { user } = useAuth();

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
