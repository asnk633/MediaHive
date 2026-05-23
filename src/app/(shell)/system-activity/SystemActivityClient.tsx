'use client';

import React, { useEffect, useState } from 'react';
import { PageLayout } from "@/components/ui/layout/PageLayout";
import { PageHeader } from "@/components/ui/layout/PageHeader";
import { ActivityService } from '@/services/activityService';
import { SystemActivity } from '@/types/activity';
import { formatDistanceToNow } from 'date-fns';
import { Activity, Clock } from 'lucide-react';

export default function SystemActivityClient() {
    const [activities, setActivities] = useState<SystemActivity[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadActivities();
    }, []);

    const loadActivities = async () => {
        setLoading(true);
        try {
            const data = await ActivityService.getRecentActivity();
            setActivities(data);
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    const getActivityIcon = (type: string) => {
        // Simple icon mapping or generic fallback
        return <Activity size={16} className="text-blue-400" />;
    };

    return (
        <PageLayout mode="plain">
            <PageHeader
                title="System Activity"
                description="Audit log of key system actions."
            />

            <div className="max-w-4xl mx-auto mt-6">
                {loading ? (
                    <div className="space-y-4">
                        {[1, 2, 3].map(i => (
                            <div key={i} className="h-20 bg-foreground/5 rounded-xl animate-pulse" />
                        ))}
                    </div>
                ) : activities.length === 0 ? (
                    <div className="text-center py-20 text-foreground/70">
                        <Activity size={48} className="mx-auto mb-4 opacity-50" />
                        <p>No activity recorded yet.</p>
                    </div>
                ) : (
                    <div className="space-y-3">
                        {activities.map((act) => (
                            <div
                                key={act.id}
                                className="flex items-center gap-4 p-4 bg-[#11131F] border border-foreground/5 rounded-xl hover:bg-foreground/5 transition-colors"
                            >
                                <div className="p-2.5 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400">
                                    {getActivityIcon(act.type)}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <h4 className="text-sm font-medium text-foreground truncate">{act.title}</h4>
                                    <div className="flex items-center gap-2 mt-0.5 text-xs text-blue-200/50">
                                        <span className="font-semibold text-blue-200/70">{act.performed_by}</span>
                                        <span>•</span>
                                        <span className="uppercase tracking-wider opacity-70">{act.performedByRole}</span>
                                    </div>
                                </div>
                                <div className="text-xs text-foreground/70 whitespace-nowrap flex items-center gap-1.5">
                                    <Clock size={12} />
                                    {act.timestamp ? formatDistanceToNow(new Date(act.timestamp), { addSuffix: true }) : 'Unknown'}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </PageLayout>
    );
}
