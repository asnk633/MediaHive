import React, { useContext } from 'react';
import { TrendingUp, Timer, Users, BarChart3, ChevronUp } from 'lucide-react';
import { DashboardContext } from '@/system/dashboard/DashboardProvider';
import { cn } from "@/lib/utils";
import { ReactiveCard } from '@/components/ui/ReactiveCard';
import { DashboardMetrics } from '@/lib/dashboardMetrics';

interface MediaTeamOverviewProps {
    performance?: DashboardMetrics['performance'];
}


/**
 * MediaTeamOverview
 * Displays high-level team performance insights instead of operational daily metrics.
 */
export const MediaTeamOverview = ({ performance: propPerformance }: MediaTeamOverviewProps) => {
    const context = useContext(DashboardContext);
    const performance = propPerformance || context?.metrics?.performance;
    
    if (!performance) return null;

    const mainStats = [
        { 
            label: 'Weekly Throughput', 
            value: performance.completedThisWeek, 
            subValue: 'Tasks completed',
            icon: TrendingUp, 
            color: 'text-emerald-400', 
            bg: 'bg-emerald-400/10' 
        },
        { 
            label: 'Avg Turnaround', 
            value: performance.avgCompletionTimeDays === 0 ? `${performance.avgLeadTimeHours}h` : `${performance.avgCompletionTimeDays}d`, 
            subValue: 'Process efficiency',
            icon: Timer, 
            color: 'text-blue-400', 
            bg: 'bg-blue-400/10' 
        },
    ];

    const members = Object.entries(performance.workloadDistribution)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5);

    return (
        <div className="space-y-6">
            {/* Main KPI Row */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {mainStats.map((stat, idx) => (
                    <ReactiveCard 
                        key={idx} 
                        className="dashboard-card-safe-padding cursor-default dashboard-card-secondary"
                    >
                        <div className="flex items-start justify-between">
                            <div className="flex-1">
                                <p className="text-sm font-medium text-white/85 mb-4">{stat.label}</p>
                                <p className="text-4xl font-extrabold text-white tracking-tighter mb-1">
                                    {stat.value}
                                </p>
                                <p className="text-xs text-white/20 font-medium">
                                    {stat.subValue}
                                </p>
                            </div>
                            <div className={cn(
                                "w-12 h-12 rounded-[18px] flex items-center justify-center shadow-2xl",
                                stat.bg, stat.color
                            )}>
                                <stat.icon size={24} />
                            </div>
                        </div>
                    </ReactiveCard>
                ))}
            </div>

            {/* Performance Details Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Team Workload Distribution */}
                <ReactiveCard className="lg:col-span-2 dashboard-card-safe-padding dashboard-card-secondary">
                    <div className="flex items-center justify-between mb-6">
                        <div className="flex items-center gap-3">
                            <Users className="text-blue-400" size={18} />
                            <h3 className="text-sm font-medium text-white/85">Team Assignment Distribution</h3>
                        </div>
                        <span className="text-[10px] text-white/20 font-bold uppercase tracking-widest">Total Tasks</span>
                    </div>
                    
                    <div className="space-y-6">
                        {members.length > 0 ? members.map(([name, count], idx) => (
                            <div key={idx} className="flex items-center gap-4">
                                <div className="min-w-[120px] text-xs font-semibold text-white/60 truncate">
                                    {name}
                                </div>
                                <div className="flex-1 h-2 bg-white/5 rounded-full overflow-hidden">
                                    <div 
                                        className="h-full bg-premium-gradient rounded-full transition-all duration-1000"
                                        style={{ width: `${Math.min((count / 10) * 100, 100)}%` }}
                                    />
                                </div>
                                <div className="text-xs font-bold text-white/40 min-w-[30px] text-right">
                                    {count}
                                </div>
                            </div>
                        )) : (
                            <p className="text-xs text-white/20 italic italic py-4">No active assignments to display.</p>
                        )}
                    </div>
                </ReactiveCard>

                {/* Productivity Trend Sparkline-like View */}
                <ReactiveCard className="dashboard-card-safe-padding dashboard-card-secondary">
                    <div className="flex items-center gap-3 mb-6">
                        <BarChart3 className="text-blue-400" size={18} />
                        <h3 className="text-sm font-medium text-white/85">Productivity Trend</h3>
                    </div>

                    <div className="flex items-end justify-between h-32 gap-2 mt-4">
                        {performance.productivityTrend.map((day, idx) => {
                            const max = Math.max(...performance.productivityTrend.map(d => d.count), 1);
                            const height = (day.count / max) * 100;
                            return (
                                <div key={idx} className="flex-1 flex flex-col items-center gap-2 group">
                                    <div className="w-full relative flex flex-col justify-end h-full">
                                        <div 
                                            className="w-full bg-white/10 rounded-t-lg group-hover:bg-amber-400 transition-all duration-500 relative"
                                            style={{ height: `${Math.max(height, 5)}%` }}
                                        >
                                            {day.count > 0 && (
                                                <div className="absolute -top-6 left-1/2 -translate-x-1/2 text-[10px] font-bold text-amber-400 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                                                    {day.count}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                    <span className="text-[8px] font-black text-white/20 uppercase whitespace-nowrap">
                                        {day.date}
                                    </span>
                                </div>
                            );
                        })}
                    </div>
                    <div className="mt-4 pt-4 border-t border-white/5 flex items-center justify-between">
                        <div className="flex items-center gap-1.5">
                            <ChevronUp className="text-emerald-400" size={12} />
                            <span className="text-[10px] font-bold text-emerald-400">+12% vs LY</span>
                        </div>
                        <span className="text-[10px] text-white/20 font-medium italic">7-day rolling window</span>
                    </div>
                </ReactiveCard>
            </div>
        </div>
    );
};
