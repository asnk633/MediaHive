'use client';

import React, { useEffect, useState } from 'react';
import { apiClient } from '@/lib/apiClient';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AdminIntelligenceView } from './AdminIntelligenceView';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Activity, LayoutDashboard, List } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { formatDistanceToNow } from 'date-fns';

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
        <div className="space-y-6">
            <Tabs defaultValue="intelligence" className="w-full space-y-6">
                <TabsList className="bg-slate-900/50 border border-[#ffffff1a] p-1">
                    <TabsTrigger value="intelligence" className="data-[state=active]:bg-blue-600 data-[state=active]:text-white text-slate-400">
                        <LayoutDashboard size={16} className="mr-2" /> Admin Intelligence
                    </TabsTrigger>
                    <TabsTrigger value="activity" className="data-[state=active]:bg-blue-600 data-[state=active]:text-white text-slate-400">
                        <List size={16} className="mr-2" /> Activity Logs
                    </TabsTrigger>
                </TabsList>

                {/* TAB 1: ADMIN INTELLIGENCE */}
                <TabsContent value="intelligence" className="focus-visible:outline-none">
                    <AdminIntelligenceView overview={overview} loading={loadingOverview} />
                </TabsContent>

                {/* TAB 2: ACTIVITY LOGS (Legacy View Preserved) */}
                <TabsContent value="activity" className="focus-visible:outline-none">
                    <Card className="bg-slate-900/30 border-[#ffffff1a]">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Activity className="w-5 h-5 text-slate-400" />
                                System Activity
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
                                <div className="relative border-l border-[#ffffff1a] ml-4 space-y-8 py-2">
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
                                                    <Badge variant="outline" className="text-[10px] border-[#ffffff1a] text-slate-400 mt-1">
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
                </TabsContent>
            </Tabs>
        </div>
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
