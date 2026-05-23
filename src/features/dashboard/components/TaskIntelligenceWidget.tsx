'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { AlertCircle, Calendar, Clock, ArrowRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useDashboard } from '@/system/dashboard/DashboardProvider';

export const TaskIntelligenceWidget: React.FC = () => {
    const { metrics } = useDashboard();
    const router = useRouter();

    if (!metrics) return null;

    const stats = {
        ...metrics,
        next7Days: metrics.upcomingTasks,
        dueToday: Math.max(0, metrics.dueToday - metrics.overdue),
        onHold: metrics.blocked,
        done: metrics.completedToday
    };


    const displayMetrics = [
        {
            id: 'overdue',
            label: 'Overdue',
            count: stats.overdue,
            icon: AlertCircle,
            color: 'text-red-500',
            bg: 'bg-red-500/10',
            border: 'border-red-500/20',
            filter: 'overdue',
            description: 'Immediate Attention'
        },
        {
            id: 'dueToday',
            label: 'Due Today',
            count: stats.dueToday,
            icon: Clock,
            color: 'text-amber-500',
            bg: 'bg-amber-500/10',
            border: 'border-amber-500/20',
            filter: 'due_today',
            description: 'Focus for Today'
        },
        {
            id: 'upcoming',
            label: 'Upcoming (7 Days)',
            count: stats.next7Days,
            icon: Calendar,
            color: 'text-blue-400',
            bg: 'bg-blue-500/10',
            border: 'border-blue-500/20',
            filter: 'upcoming',
            description: 'Looking Ahead'
        }
    ];

    const handleNavigate = (filter: string) => {
        router.push(`/tasks?filter=${filter}`);
    };

    return (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-[20px]">
            {displayMetrics.map((metric) => (
                <div
                    key={metric.id}
                    onClick={() => handleNavigate(metric.filter)}
                    className={cn(
                        "relative group cursor-pointer p-5 lg:px-6 rounded-[16px] border transition-all duration-300",
                        "bg-foreground/[0.02] hover:bg-foreground/[0.04]",
                        metric.border
                    )}
                >
                    <div className="flex items-start justify-between mb-4">
                        <div className={cn("p-2 rounded-lg", metric.bg)}>
                            <metric.icon size={20} className={metric.color} />
                        </div>
                        <div className="opacity-0 group-hover:opacity-100 transition-opacity -mr-2 -mt-2">
                            <ArrowRight size={16} className="text-foreground/80" />
                        </div>
                    </div>

                    <div className="space-y-1">
                        <h3 className="text-2xl font-bold text-foreground tracking-tight">{metric.count}</h3>
                        <p className={cn("text-xs font-bold uppercase tracking-wider", metric.color)}>
                            {metric.label}
                        </p>
                    </div>

                    <p className="absolute bottom-5 right-5 text-[10px] font-medium text-foreground/80 uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-opacity translate-y-2 group-hover:translate-y-0">
                        View List
                    </p>
                </div>
            ))}
        </div>
    );
};
