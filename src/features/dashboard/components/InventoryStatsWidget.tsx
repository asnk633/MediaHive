"use client";
import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { nativeNavigate } from '@/lib/utils';
import { apiClient } from '@/lib/apiClient';
import { InventoryApiResponse } from '@/types/inventory';
import { OverviewCard } from '@/components/home/OverviewCard';
import { Box, Layers, AlertTriangle, TrendingUp } from 'lucide-react';

interface StatsState {
    total: number;
    inUse: number;
    overdue: number;
    value: number; // Placeholder for now if not tracking value
}

export const InventoryStatsWidget = () => {
    const router = useRouter();
    const [stats, setStats] = useState<StatsState>({ total: 0, inUse: 0, overdue: 0, value: 0 });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchStats = async () => {
            try {
                // Efficiently fetch pre-aggregated stats from server
                const statsData = await apiClient<StatsState & { utilization: number, unavailable: number }>('/api/inventory/stats');

                setStats({
                    total: statsData.total,
                    inUse: statsData.inUse,
                    overdue: 0, // Not supported by aggregate yet
                    value: statsData.unavailable // Mapping unavailable to Alerts/Value card
                });
            } catch (e) {
                console.error("Failed to load inventory stats", e);
            } finally {
                setLoading(false);
            }
        };
        fetchStats();
    }, []);

    if (loading) return <div className="h-32 animate-pulse bg-foreground/5 rounded-[18px]" />;

    return (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            <OverviewCard
                icon={Box}
                count={(stats.total ?? 0).toString()}
                label="Assets"
                subLabel="Total Inventory"
                onClick={() => nativeNavigate('/inventory', router, 'InventoryStats (Assets)')}
            />
            <OverviewCard
                icon={Layers}
                count={(stats.inUse ?? 0).toString()}
                label="Active"
                subLabel="Currently In Use"
                onClick={() => nativeNavigate('/inventory', router, 'InventoryStats (Active)')}
            />
            <OverviewCard
                icon={AlertTriangle}
                count={(stats.value ?? 0).toString()} // Using 'Unavailable' count here
                label="Alerts"
                subLabel="Broken / Lost / Out"
                onClick={() => nativeNavigate('/inventory', router, 'InventoryStats (Alerts)')}
            />
            <OverviewCard
                icon={TrendingUp}
                count={`${Math.round(((stats.inUse ?? 0) / (stats.total || 1)) * 100)}%`}
                label="Utilization"
                subLabel="Asset Usage Rate"
                onClick={() => nativeNavigate('/inventory', router, 'InventoryStats (Utilization)')}
            />
        </div>
    );
};
