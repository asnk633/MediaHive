import React, { useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { cn, nativeNavigate } from "@/lib/utils";
import { Clock, AlertTriangle, ArrowRight } from 'lucide-react';
import { useDashboard } from '@/system/dashboard/DashboardProvider';

/**
 * OverdueTasksWidget
 * Draws immediate attention to tasks that are past their due date.
 */
export const OverdueTasksWidget = () => {
    const { metrics, tasks } = useDashboard();
    const router = useRouter();

    const overdueCount = metrics?.overdue ?? 0;
    
    // Get top 3 overdue tasks for quick preview
    const recentOverdue = useMemo(() => {
        if (!tasks) return [];
        return tasks
            .filter(t => {
                if (t.status === 'done' || !t.due_date) return false;
                return t.due_date < new Date();
            })
            .sort((a, b) => (a.due_date?.getTime() || 0) - (b.due_date?.getTime() || 0))
            .slice(0, 3);
    }, [tasks]);

    if (overdueCount === 0) return null;

    return (
        <Link 
            href="/tasks?filter=overdue"
            className={cn(
                "group relative pt-6 backdrop-blur-xl rounded-[18px] shadow-[0_10px_30px_rgba(239,68,68,0.15)] cursor-pointer transition-all duration-300 block",
                "card-gradient-border", // We'll override the background logic slightly for the red tint
                "bg-[linear-gradient(rgba(239,68,68,0.05),rgba(239,68,68,0.05))_padding-box,linear-gradient(180deg,rgba(239,68,68,0.2)_0%,rgba(239,68,68,0.05)_100%)_border-box] border-transparent",
                "before:absolute before:inset-0 before:rounded-[18px] before:bg-red-500/5 before:opacity-0 group-hover:before:opacity-100 before:transition-opacity"
            )}
        >
            <div className="flex justify-between items-start dashboard-card-header-spacing py-[14px] px-[18px]">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-[18px] bg-red-500/20 flex items-center justify-center text-red-400 shadow-[0_0_15px_rgba(239,68,68,0.3)]">
                        <AlertTriangle size={20} />
                    </div>
                    <div>
                        <h4 className="text-sm font-medium text-red-400/80 mb-1">Attention Required</h4>
                        <p className="text-xl font-bold text-foreground/90">{overdueCount} Overdue {overdueCount === 1 ? 'Task' : 'Tasks'}</p>
                    </div>
                </div>
                <div className="p-2 rounded-lg bg-foreground/5 group-hover:bg-red-500/10 transition-colors relative">
                    <ArrowRight size={16} className="text-foreground/80 group-hover:text-red-400 group-hover:translate-x-0.5 transition-all" />
                </div>
            </div>

            <div className="space-y-3 px-6 pb-6">
                {recentOverdue.map((task, idx) => (
                    <div key={task.id} className="flex items-center justify-between py-2 border-b border-foreground/5 last:border-0 border-dashed px-2">
                        <div className="flex items-center gap-2 min-w-0">
                            <Clock size={12} className="text-red-400/50 shrink-0" />
                            <span className="text-sm text-foreground/80 truncate">{task.title}</span>
                        </div>
                        <span className="text-[10px] font-bold text-red-400/40 uppercase whitespace-nowrap ml-4">
                            {task.priority || 'Medium'}
                        </span>
                    </div>
                ))}
            </div>

            {overdueCount > 3 && (
                <p className="mt-4 text-[10px] font-bold text-foreground/80 uppercase tracking-widest text-center group-hover:text-red-400/60 transition-colors">
                    View {overdueCount - 3} more overdue items
                </p>
            )}
        </Link>
    );
};
