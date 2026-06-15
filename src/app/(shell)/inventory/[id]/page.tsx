"use client";
import { nativeNavigate } from '@/lib/utils';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { InventoryDetailDialog } from '@/components/inventory/InventoryDetailDialog';
import { inventoryService } from '@/services/inventory/inventoryService';
import { EquipmentItem } from '@/services/inventory/inventoryContract';
import { PageLayout } from '@/components/ui/layout/PageLayout';
import { toast } from 'sonner';
import { usePermissions } from '@/hooks/usePermissions';

export default function InventoryStandalonePage() {
    const params = useParams();
    const router = useRouter();
    const id = params.id as string;
    const [item, setItem] = useState<EquipmentItem | null>(null);
    const [loading, setLoading] = useState(true);
    const { role } = usePermissions();

    useEffect(() => {
        if (!id) return;

        const fetchItem = async () => {
            try {
                // Fetch specific item
                const data = await inventoryService.getById(id);
                if (data) {
                    setItem(data);
                } else {
                    toast.error("Item not found");
                    nativeNavigate('/inventory', router, 'page.tsx');
                }
            } catch (err) {
                console.error("Failed to fetch inventory item for standalone page", err);
                toast.error("An error occurred while loading the item");
                nativeNavigate('/inventory', router, 'page.tsx');
            } finally {
                setLoading(false);
            }
        };

        fetchItem();
    }, [id, router]);

    if (loading) {
        return (
            <PageLayout mode="plain">
                <div className="flex items-center justify-center min-h-[60vh]">
                    <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
                </div>
            </PageLayout>
        );
    }

    if (!item) return null;

    return (
        <PageLayout mode="plain">
            <InventoryDetailDialog 
                item={item}
                open={true}
                onOpenChange={(open) => !open && nativeNavigate('/inventory', router, 'page.tsx')}
                role={role}
                onEdit={['admin', 'manager'].includes(role) ? (i) => nativeNavigate(`/inventory/edit?id=${i.id}`, router, 'page.tsx') : undefined}
                onDelete={['admin', 'manager'].includes(role) ? async (i) => {
                    try {
                        await inventoryService.delete(String(i.id));
                        toast.success("Item moved to trash");
                        nativeNavigate('/inventory', router, 'page.tsx');
                    } catch (error) {
                        toast.error("Failed to delete item");
                    }
                } : undefined}
            />
        </PageLayout>
    );
}
