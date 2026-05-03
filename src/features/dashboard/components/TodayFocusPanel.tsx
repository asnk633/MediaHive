'use client';

import React, { useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { 
    AlertCircle, 
    Calendar, 
    Clock, 
    CheckCircle2, 
    ArrowRight,
    LucideIcon,
    AlertTriangle,
    Layers
} from 'lucide-react';
import { cn, nativeNavigate } from '@/lib/utils';
import { ReactiveCard } from '@/components/ui/ReactiveCard';
import { MediaTask as Task } from '@/services/tasks/taskContract';
import { CampaignItem as Campaign } from '@/services/campaigns/campaignService';
import { EventItem as Event } from '@/services/events/eventContract';
import { isSameDay, isBefore, addDays } from 'date-fns';

interface FocusItem {
    id: string;
    type: 'overdue' | 'today' | 'event' | 'campaign' | 'all-clear';
    icon: LucideIcon;
    message: string;
    actionLabel?: string;
    actionRoute?: string;
    colorClass: string;
    bgClass: string;
    borderColor: string;
}

interface TodayFocusPanelProps {
    tasks: Task[];
    events: Event[];
    campaigns: Campaign[];
    isLoading?: boolean;
}

export const TodayFocusPanel: React.FC<TodayFocusPanelProps> = ({ 
    tasks, 
    events, 
    campaigns,
    isLoading 
}) => {
    const router = useRouter();
    const now = new Date();
    const next24h = addDays(now, 1);

    const focusItems = useMemo(() => {
        const items: FocusItem[] = [];

        // 1. Overdue Tasks
        const overdueTasks = tasks.filter(t => 
            t.status !== 'done' && t.due_date && isBefore(new Date(t.due_date), now)
        );
        if (overdueTasks.length > 0) {
            items.push({
                id: 'overdue-tasks',
                type: 'overdue',
                icon: AlertTriangle,
                message: `${overdueTasks.length} ${overdueTasks.length === 1 ? 'task is' : 'tasks are'} overdue — review now`,
                actionLabel: 'Review',
                actionRoute: '/tasks?filter=overdue',
                colorClass: 'text-red-400',
                bgClass: 'bg-red-400/10',
                borderColor: 'border-red-500/20'
            });
        }

        // 2. Tasks Due Today
        const dueToday = tasks.filter(t => 
            t.status !== 'done' && t.due_date && isSameDay(new Date(t.due_date), now) && !isBefore(new Date(t.due_date), now)
        );
        if (dueToday.length > 0) {
            items.push({
                id: 'today-tasks',
                type: 'today',
                icon: Clock,
                message: `${dueToday.length} ${dueToday.length === 1 ? 'item' : 'items'} due today`,
                actionLabel: 'View',
                actionRoute: '/tasks?filter=due_today',
                colorClass: 'text-amber-400',
                bgClass: 'bg-amber-400/10',
                borderColor: 'border-amber-500/20'
            });
        }

        // 3. Upcoming Events (Next 24h)
        const upcomingEvents = events.filter(e => {
            const eDate = new Date(e.startTime);
            return isBefore(eDate, next24h) && !isBefore(eDate, now);
        });
        if (upcomingEvents.length > 0) {
            items.push({
                id: 'upcoming-events',
                type: 'event',
                icon: Calendar,
                message: `${upcomingEvents.length} ${upcomingEvents.length === 1 ? 'event' : 'events'} in the next 24h`,
                actionLabel: 'Calendar',
                actionRoute: '/calendar',
                colorClass: 'text-blue-400',
                bgClass: 'bg-blue-400/10',
                borderColor: 'border-blue-500/20'
            });
        }

        // 4. Campaigns in Review
        const campaignsInReview = campaigns.filter(c => c.phase === 'review');
        if (campaignsInReview.length > 0 && items.length < 3) {
            items.push({
                id: 'campaign-review',
                type: 'campaign',
                icon: Layers,
                message: `${campaignsInReview.length} ${campaignsInReview.length === 1 ? 'campaign needs' : 'campaigns need'} review`,
                actionLabel: 'Review',
                actionRoute: '/campaigns',
                colorClass: 'text-indigo-400',
                bgClass: 'bg-indigo-400/10',
                borderColor: 'border-indigo-500/20'
            });
        }

        // 5. All Clear
        if (items.length === 0) {
            items.push({
                id: 'all-clear',
                type: 'all-clear',
                icon: CheckCircle2,
                message: 'No urgent items today. Great job!',
                colorClass: 'text-emerald-400',
                bgClass: 'bg-emerald-400/10',
                borderColor: 'border-emerald-500/20'
            });
        }

        return items.slice(0, 3);
    }, [tasks, events, campaigns]);

    if (isLoading) {
        return (
            <div className="w-full h-[88px] rounded-[18px] bg-white/[0.02] border border-white/5 animate-pulse" />
        );
    }

    return (
        <ReactiveCard className="w-full bg-white/[0.04] border-white/[0.08] rounded-[18px] p-5 lg:px-6 shadow-[0_10px_40px_rgba(99,102,241,0.08)]">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div className="flex flex-col gap-4 flex-1">
                    {focusItems.map((item) => (
                        <div key={item.id} className="flex items-center justify-between group/item">
                            <div className="flex items-center gap-3">
                                <div className={cn("p-2 rounded-lg", item.bgClass)}>
                                    <item.icon size={18} className={item.colorClass} />
                                </div>
                                <span className="text-sm font-bold text-white/80 group-hover/item:text-white transition-colors">
                                    {item.message}
                                </span>
                            </div>
                            
                            {item.actionRoute && (
                                <button 
                                    onClick={() => nativeNavigate(item.actionRoute!, router, `FocusAction:${item.type}`)}
                                    className={cn(
                                        "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-black uppercase tracking-widest transition-all",
                                        "bg-white/5 border border-white/10 hover:bg-white/10 hover:border-white/20 text-white/40 hover:text-white"
                                    )}
                                >
                                    {item.actionLabel || 'View'}
                                    <ArrowRight size={12} className="opacity-40 group-hover/item:translate-x-0.5 transition-transform" />
                                </button>
                            )}
                        </div>
                    ))}
                </div>
            </div>
        </ReactiveCard>
    );
};
