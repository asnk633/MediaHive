"use client";

import React, { useState, useEffect } from 'react';
import { ActivityService } from '@/services/activityService';
import { SystemActivity } from '@/types/activity';
import { useAuth } from '@/contexts/AuthContext';
import { formatDistanceToNow, isToday, isYesterday, format } from 'date-fns';
import {
    Activity,
    CheckCircle2,
    FileText,
    User,
    Shield,
    Package,
    AlertCircle,
    Filter,
    Clock,
    Calendar,
    ChevronRight
} from 'lucide-react';
import { Loader2 } from 'lucide-react';
import { useRouter } from 'next/navigation';

type ActivityFilter = 'all' | 'my_activity' | 'mentions';

export const SmartActivityFeed: React.FC = () => {
    const { user } = useAuth();
    const router = useRouter();
    const [activities, setActivities] = useState<SystemActivity[]>([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState<ActivityFilter>('all');

    useEffect(() => {
        const fetchActivity = async () => {
            setLoading(true);
            try {
                // Fetch reasonably large batch to allow client-side filtering comfortably
                const data = await ActivityService.getRecentActivity(50);
                setActivities(data);
            } catch (error) {
                console.error("Failed to load activity feed", error);
            } finally {
                setLoading(false);
            }
        };

        fetchActivity();
    }, []);

    // Helper to parse timestamp safely
    const getDate = (timestamp: any) => {
        if (!timestamp) return new Date();
        if (typeof timestamp === 'string') return new Date(timestamp);
        if (typeof timestamp === 'number') return new Date(timestamp);
        if (timestamp.seconds) return new Date(timestamp.seconds * 1000);
        return new Date();
    };

    // Filter Logic
    const filteredActivities = activities.filter(act => {
        if (filter === 'all') return true;

        if (filter === 'my_activity') {
            // Actions performed BY me
            if (act.performedBy === user?.name) return true;
            // Actions ON things assigned to me (heuristic: check metadata or title)
            // Ideally backend provides 'targetUserId' but standard SystemActivity might not have it normalized.
            // We check if title contains "assigned to [My Name]"
            if (user?.name && act.title.toLowerCase().includes(`assigned to ${user.name.toLowerCase()}`)) return true;
            return false;
        }

        if (filter === 'mentions') {
            // Heuristic: "mentioned" in title or type (if we had a mention type)
            if (act.title.toLowerCase().includes('mentioned')) return true;
            // Use metadata heuristics if available
            return false;
        }

        return true;
    });

    // Grouping Logic
    const groupedActivities = filteredActivities.reduce((groups, act) => {
        const date = getDate(act.timestamp);
        let key = 'Earlier';

        if (isToday(date)) key = 'Today';
        else if (isYesterday(date)) key = 'Yesterday';
        else key = format(date, 'MMMM d, yyyy');

        if (!groups[key]) groups[key] = [];
        groups[key].push(act);
        return groups;
    }, {} as Record<string, SystemActivity[]>);

    // Activity Icon Helper
    const getActivityIcon = (type: string) => {
        if (type.includes('task')) return <CheckCircle2 size={16} className="text-blue-400" />;
        if (type.includes('file') || type.includes('drive')) return <FileText size={16} className="text-purple-400" />;
        if (type.includes('user')) return <User size={16} className="text-green-400" />;
        if (type.includes('inventory')) return <Package size={16} className="text-orange-400" />;
        if (type.includes('system')) return <Shield size={16} className="text-gray-400" />;
        return <Activity size={16} className="text-gray-400" />;
    };

    const handleItemClick = (act: SystemActivity) => {
        if (act.entityType === 'task' && act.entityId) router.push(`/tasks/view?id=${act.entityId}`);
        if (act.entityType === 'file' && act.entityId) router.push(`/downloads`); // Generic redirect as file view URL varies
        // Add more handlers as needed
    };

    if (loading) {
        return (
            <div className="flex justify-center py-20">
                <Loader2 className="animate-spin text-primary" size={32} />
            </div>
        );
    }

    return (
        <div className="max-w-3xl mx-auto space-y-8">
            {/* Filter Tabs */}
            <div className="flex items-center gap-2 p-1 bg-surface rounded-xl border border-soft w-fit">
                {(['all', 'my_activity', 'mentions'] as ActivityFilter[]).map((f) => (
                    <button
                        key={f}
                        onClick={() => setFilter(f)}
                        className={`
                            px-4 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider transition-all
                            ${filter === f
                                ? 'bg-primary text-white shadow-md'
                                : 'text-muted-foreground hover:text-foreground hover:bg-white/5'
                            }
                        `}
                    >
                        {f.replace('_', ' ')}
                    </button>
                ))}
            </div>

            {/* Timeline */}
            <div className="space-y-8">
                {Object.entries(groupedActivities).map(([dateLabel, items]) => (
                    <div key={dateLabel} className="space-y-4">
                        <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-widest pl-2 border-l-2 border-primary/20">
                            {dateLabel}
                        </h3>

                        <div className="space-y-3">
                            {items.map(act => (
                                <div
                                    key={act.id}
                                    onClick={() => handleItemClick(act)}
                                    className="group relative flex items-start gap-4 p-4 bg-card hover:bg-muted/5 border border-soft hover:border-primary/20 rounded-xl transition-all cursor-pointer"
                                >
                                    {/* Icon Box */}
                                    <div className="mt-1 flex-shrink-0 w-10 h-10 rounded-full bg-surface border border-soft flex items-center justify-center group-hover:scale-110 transition-transform shadow-sm">
                                        {getActivityIcon(act.type)}
                                    </div>

                                    <div className="flex-1 min-w-0">
                                        <div className="flex justify-between items-start gap-2">
                                            <p className="text-sm font-medium text-foreground leading-normal">
                                                <span className="font-bold">{act.performedBy}</span> <span className="text-muted-foreground font-normal">{act.title.replace(act.performedBy, '').trim()}</span>
                                            </p>
                                            <span className="text-[10px] text-muted-foreground whitespace-nowrap bg-surface px-2 py-1 rounded-full border border-soft group-hover:border-primary/20 transition-colors">
                                                {format(getDate(act.timestamp), 'h:mm a')}
                                            </span>
                                        </div>

                                        {/* Metadata Preview (Optional) */}
                                        {act.metadata?.summary && (
                                            <div className="mt-2 text-xs text-muted-foreground bg-surface/50 p-2 rounded-lg border border-transparent group-hover:border-soft transition-colors text-ellipsis overflow-hidden">
                                                {act.metadata.summary}
                                            </div>
                                        )}

                                        <div className="mt-2 flex items-center gap-2">
                                            <span className={`text-[10px] font-bold uppercase px-1.5 py-0.5 rounded border tracking-wide ${act.entityType === 'task' ? 'bg-blue-500/10 text-blue-400 border-blue-500/20' :
                                                    act.entityType === 'system' ? 'bg-red-500/10 text-red-400 border-red-500/20' :
                                                        'bg-gray-500/10 text-gray-400 border-gray-500/20'
                                                }`}>
                                                {act.entityType}
                                            </span>
                                        </div>
                                    </div>

                                    <ChevronRight size={16} className="self-center text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity -translate-x-2 group-hover:translate-x-0" />
                                </div>
                            ))}
                        </div>
                    </div>
                ))}

                {Object.keys(groupedActivities).length === 0 && !loading && (
                    <div className="py-20 flex flex-col items-center justify-center text-center opacity-60">
                        <div className="w-16 h-16 bg-surface rounded-full flex items-center justify-center mb-4">
                            <Activity size={32} className="text-muted-foreground" />
                        </div>
                        <h3 className="text-lg font-bold text-foreground">No recent activity</h3>
                        <p className="text-sm text-muted-foreground mt-1">
                            {filter === 'all'
                                ? "The system has been quiet."
                                : `No ${filter.replace('_', ' ')} found.`}
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
};
