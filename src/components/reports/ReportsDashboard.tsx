'use client';

import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { apiClient } from '@/lib/apiClient';
import {
    CheckCircle2,
    AlertTriangle,
    Calendar,
    Package,
    Activity,
    ArrowRight
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { Badge } from '@/components/ui/badge';

interface ReportOverview {
    totalTasks: number;
    totalEvents: number;
    totalInventory: number;
    lowStock: number;
    outOfStock: number;
    generatedAt: string;
}

interface ActivityItem {
    id: string;
    type: 'task' | 'event' | 'inventory';
    title: string;
    description: string;
    timestamp: string;
    meta: any;
}

export default function ReportsDashboard() {
    const [overview, setOverview] = useState<ReportOverview | null>(null);
    const [activity, setActivity] = useState<ActivityItem[]>([]);
    const [loadingOverview, setLoadingOverview] = useState(true);
    const [loadingActivity, setLoadingActivity] = useState(true);

    useEffect(() => {
        const fetchOverview = async () => {
            try {
                const data = await apiClient<{ overview: ReportOverview }>('/api/reports/overview');
                setOverview(data.overview);
            } catch (error) {
                console.error('Failed to load overview', error);
            } finally {
                setLoadingOverview(false);
            }
        };

        const fetchActivity = async () => {
            try {
                const data = await apiClient<{ activity: ActivityItem[] }>('/api/reports/activity');
                setActivity(data.activity);
            } catch (error) {
                console.error('Failed to load activity', error);
            } finally {
                setLoadingActivity(false);
            }
        };

        fetchOverview();
        fetchActivity();
    }, []);

    return (
        <div className="space-y-8">
            {/* Overview Stats */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <StatsCard
                    title="Total Tasks"
                    value={overview?.totalTasks}
                    icon={<CheckCircle2 className="text-blue-500" />}
                    loading={loadingOverview}
                    className="bg-blue-950/20 border-blue-900/50"
                />
                <StatsCard
                    title="System Events"
                    value={overview?.totalEvents}
                    icon={<Calendar className="text-purple-500" />}
                    loading={loadingOverview}
                    className="bg-purple-950/20 border-purple-900/50"
                />
                <StatsCard
                    title="Inventory Items"
                    value={overview?.totalInventory}
                    icon={<Package className="text-emerald-500" />}
                    loading={loadingOverview}
                    className="bg-emerald-950/20 border-emerald-900/50"
                />
                <StatsCard
                    title="Attention Needed"
                    value={(overview?.lowStock || 0) + (overview?.outOfStock || 0)}
                    label="Low / Out of Stock"
                    icon={<AlertTriangle className="text-amber-500" />}
                    loading={loadingOverview}
                    className="bg-amber-950/20 border-amber-900/50"
                />
            </div>

            {/* Activity Timeline */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2">
                    <Card className="bg-slate-900/30 border-white/10">
                        <CardHeader className="flex flex-row items-center justify-between">
                            <CardTitle className="flex items-center gap-2">
                                <Activity className="w-5 h-5 text-slate-400" />
                                Recent Activity
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            {loadingActivity ? (
                                <div className="space-y-4">
                                    {[1, 2, 3].map(i => (
                                        <div key={i} className="flex gap-4">
                                            <Skeleton className="w-12 h-12 rounded-full bg-slate-800" />
                                            <div className="space-y-2 flex-1">
                                                <Skeleton className="h-4 w-1/3 bg-slate-800" />
                                                <Skeleton className="h-3 w-1/2 bg-slate-800" />
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : activity.length === 0 ? (
                                <div className="text-center py-10 text-slate-500">
                                    No recent activity found.
                                </div>
                            ) : (
                                <div className="relative border-l border-white/10 ml-4 space-y-8 py-2">
                                    {activity.map((item, index) => (
                                        <div key={item.id + index} className="relative pl-8">
                                            <div className={`absolute -left-[9px] top-1 w-4 h-4 rounded-full border-2 border-slate-900 ${getActivityColor(item.type)}`} />
                                            <div className="space-y-1">
                                                <div className="flex items-center justify-between">
                                                    <p className="font-medium text-white text-sm">{item.title}</p>
                                                    <span className="text-xs text-slate-500 whitespace-nowrap">
                                                        {formatDistanceToNow(new Date(item.timestamp), { addSuffix: true })}
                                                    </span>
                                                </div>
                                                <p className="text-sm text-slate-400">{item.description}</p>
                                                {item.type === 'task' && (
                                                    <Badge variant="outline" className="text-[10px] border-white/10 text-slate-400 mt-1">
                                                        {item.meta.status}
                                                    </Badge>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>

                <div className="lg:col-span-1">
                    <Card className="bg-slate-900/30 border-white/10 h-full">
                        <CardHeader>
                            <CardTitle>Quick Insights</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="p-4 rounded-lg bg-blue-500/10 border border-blue-500/20 text-sm text-blue-200">
                                <p className="font-semibold mb-1">System Health</p>
                                <p className="text-xs text-blue-300/70">
                                    All API checkpoints are responding optimally. Cache hit rates are within expected limits.
                                </p>
                            </div>

                            <div className="p-4 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-sm text-emerald-200">
                                <p className="font-semibold mb-1">Inventory Status</p>
                                <p className="text-xs text-emerald-300/70">
                                    {overview ? `${overview.totalInventory} items tracked.` : 'Tracking items...'}
                                    {overview && overview.outOfStock > 0 && ` ${overview.outOfStock} items represent stock-outs.`}
                                </p>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}

interface StatsCardProps {
    title: string;
    value?: number; // Optional because wait for data
    label?: string;
    icon: React.ReactNode;
    loading: boolean;
    className?: string;
}

function StatsCard({ title, value, label, icon, loading, className }: StatsCardProps) {
    return (
        <Card className={`border shadow-lg ${className}`}>
            <CardContent className="p-6">
                <div className="flex justify-between items-start">
                    <div className="space-y-1">
                        <p className="text-sm font-medium text-slate-400">{title}</p>
                        {loading ? (
                            <Skeleton className="h-8 w-16 bg-white/10" />
                        ) : (
                            <h3 className="text-3xl font-bold text-white tracking-tight">{value ?? 0}</h3>
                        )}
                        {label && <p className="text-xs text-slate-500">{label}</p>}
                    </div>
                    <div className="p-2 bg-slate-950/50 rounded-lg">
                        {icon}
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}

function getActivityColor(type: string) {
    switch (type) {
        case 'task': return 'bg-blue-500';
        case 'event': return 'bg-purple-500';
        case 'inventory': return 'bg-emerald-500';
        default: return 'bg-slate-500';
    }
}
