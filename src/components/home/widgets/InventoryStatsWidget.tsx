import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
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
                // Fetch basic inventory data (Limit 1000 to get decent approximation or all)
                // For a real app, use a dedicated stats endpoint. For now, client-side Agg.
                const data = await apiClient<InventoryApiResponse>('/api/inventory?limit=1000');
                const items = data.items || [];

                // We also need active issues to count 'In Use' accurately if relying on issues, 
                // but items usually have status 'in_use' updated?
                // Actually the derived state in View does it. The raw item might not unless updated by cloud function.
                // Let's assume 'status' field is reasonably up to date or use simple filtering.
                // Re-calculating 'overdue' requires issues. 
                // Let's keep it simple: Count by status field. 
                // For Overdue, we can't easily know without issues. 
                // Let's count 'in_use' items.

                let total = items.length;
                let inUse = items.filter(i => i.status === 'in_use').length;
                let unavailable = items.filter(i => ['broken', 'lost', 'out'].includes(i.status)).length;

                // Value is not in schema yet, ignore.

                setStats({ total, inUse, overdue: 0, value: unavailable }); // Overdue 0 for now
            } catch (e) {
                console.error("Failed to load inventory stats", e);
            } finally {
                setLoading(false);
            }
        };
        fetchStats();
    }, []);

    if (loading) return <div className="h-32 animate-pulse bg-white/5 rounded-xl" />;

    return (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            <OverviewCard
                icon={Box}
                count={stats.total.toString()}
                label="Assets"
                subLabel="Total Inventory"
                onClick={() => router.push('/inventory')}
            />
            <OverviewCard
                icon={Layers}
                count={stats.inUse.toString()}
                label="Active"
                subLabel="Currently In Use"
                onClick={() => router.push('/inventory')}
            />
            <OverviewCard
                icon={AlertTriangle}
                count={stats.value.toString()} // Using 'Unavailable' count here
                label="Alerts"
                subLabel="Broken / Lost / Out"
                onClick={() => router.push('/inventory')}
            />
            <OverviewCard
                icon={TrendingUp}
                count={`${Math.round((stats.inUse / (stats.total || 1)) * 100)}%`}
                label="Utilization"
                subLabel="Asset Usage Rate"
                onClick={() => router.push('/inventory')}
            />
        </div>
    );
};
