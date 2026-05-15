'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { useWorkspace } from '@/system/workspace/WorkspaceProvider';
import { ReactiveCard } from '@/components/ui/ReactiveCard';
import { Skeleton } from '@/components/ui/skeleton';
import { format, isTomorrow, isToday } from 'date-fns';
import { Calendar, Clock, Users, Briefcase, CheckSquare, ArrowRight } from 'lucide-react';
import { CanonicalDataService } from '@/services/canonicalDataService';


export const NextProductionCard: React.FC = () => {
    const router = useRouter();
    const { currentWorkspaceId } = useWorkspace();
    const [data, setData] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchNext = async () => {
            setLoading(true);
            const summary = await CanonicalDataService.getNextProductionSummary(currentWorkspaceId ? String(currentWorkspaceId) : undefined);
            setData(summary);
            setLoading(false);
        };
        fetchNext();
    }, [currentWorkspaceId]);

    if (loading) {
        return (
            <ReactiveCard className="p-6 bg-white/[0.03] backdrop-blur-xl border border-white/[0.08] h-full flex flex-col min-h-[260px]">
                <Skeleton className="h-4 w-1/3 mb-4 bg-white/10" />
                <Skeleton className="h-8 w-3/4 mb-2 bg-white/5" />
                <Skeleton className="h-4 w-1/2 mb-6 bg-white/5" />
                <div className="grid grid-cols-3 gap-4">
                    <Skeleton className="h-10 w-full bg-white/5" />
                    <Skeleton className="h-10 w-full bg-white/5" />
                    <Skeleton className="h-10 w-full bg-white/5" />
                </div>
            </ReactiveCard>
        );
    }

    if (!data) {
        return (
            <ReactiveCard className="p-6 bg-white/[0.03] backdrop-blur-xl border border-white/[0.08] h-full flex flex-col items-center justify-center text-center opacity-60 min-h-[260px]">
                <Calendar size={32} className="text-white/10 mb-3" />
                <h3 className="text-xs uppercase tracking-widest font-bold text-white/50 mb-1">Next Production</h3>
                <p className="text-sm text-white/40">No upcoming productions scheduled.</p>
            </ReactiveCard>
        );
    }

    const { event, crewCount, equipmentCount, totalTasks, completedTasks } = data;
    const remainingTasks = totalTasks - completedTasks;
    const eventDate = new Date(event.start_at);

    const relativeDate = isToday(eventDate) ? 'Today' : isTomorrow(eventDate) ? 'Tomorrow' : format(eventDate, 'MMM d');
    const timeStr = format(eventDate, 'HH:mm');

    return (
        <ReactiveCard className="group dashboard-card-safe-padding dashboard-card-primary dashboard-card-focus-glow flex flex-col relative overflow-hidden h-full min-h-[260px]">
            <div className="flex items-baseline justify-between dashboard-card-header-spacing">
                <div className="flex items-center gap-3">
                    <div className="p-2.5 rounded-xl bg-blue-500/10 text-blue-400">
                        <Calendar size={20} />
                    </div>
                    <h3 className="text-base font-semibold tracking-tight text-white/90">Next Production</h3>
                </div>
                <div className="flex items-center gap-1.5 text-[10px] font-black text-blue-400/90 bg-blue-400/10 border border-blue-400/20 px-3 py-1.5 rounded-full uppercase tracking-widest">
                    <span className="relative flex h-2 w-2">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500"></span>
                    </span>
                    Operational Focus
                </div>
            </div>

            <div className="mt-4 w-full">
                <h2 className="text-[32px] font-bold text-white leading-tight mb-[6px] tracking-tighter group-hover:text-blue-400 transition-colors duration-500">
                    {event.title}
                </h2>
                <div className="flex items-center gap-2 text-sm text-white/40 font-medium">
                    <Clock size={14} className="text-blue-500/40" />
                    <span>{relativeDate} • {timeStr}</span>
                </div>
            </div>

            {/* Production Stage Indicator */}
            <div className="mt-[14px] flex items-center gap-1.5 overflow-hidden">
                {['Planning', 'Preparation', 'Shooting', 'Editing', 'Delivery'].map((stage, idx) => {
                    const stageKeys = ['planning', 'preparation', 'shooting', 'editing', 'delivery'];
                    const currentStageIndex = stageKeys.indexOf(event.production_stage || 'planning');
                    const isActive = idx === currentStageIndex;
                    const isCompleted = idx < currentStageIndex;
                    const isFuture = idx > currentStageIndex;

                    return (
                        <div key={stage} className="flex items-center gap-1.5 flex-1 min-w-0">
                            <div className="flex flex-col gap-1.5 flex-1 min-w-0">
                                <span className={cn(
                                    "text-[10px] uppercase tracking-widest transition-all truncate",
                                    isActive ? "text-blue-400 font-bold opacity-100" : 
                                    isCompleted ? "text-white opacity-60 font-medium" : 
                                    "text-white opacity-40 font-medium"
                                )}>
                                    {stage}
                                </span>
                                <div className={cn(
                                    "h-1 rounded-full transition-all duration-500",
                                    isActive ? "bg-blue-500 shadow-[0_0_10px_rgba(59,130,246,0.5)] w-full" : 
                                    isCompleted ? "bg-white/40 w-full" : 
                                    "bg-white/10 w-full"
                                )} />
                            </div>
                            {idx < 4 && (
                                <div className="h-[1px] w-2 bg-white/5 mt-4 shrink-0" />
                            )}
                        </div>
                    );
                })}
            </div>

            <div className="grid grid-cols-3 gap-[14px] mt-[18px]">
                <div className="flex flex-col items-center justify-center p-4 rounded-[16px] bg-white/[0.03] border border-white/[0.05] group/item transition-all hover:bg-white/[0.06] hover:border-blue-500/20 shadow-sm cursor-default">
                    <Users size={16} className="text-blue-400 mb-1.5 transition-transform group-hover/item:scale-110" />
                    <span className="text-[13px] font-semibold text-white/90">{crewCount}</span>
                    <span className="text-[9px] uppercase tracking-wider text-white/50 font-bold">Crew</span>
                </div>
                
                <div className="flex flex-col items-center justify-center p-4 rounded-[16px] bg-white/[0.03] border border-white/[0.05] group/item transition-all hover:bg-white/[0.06] hover:border-blue-500/20 shadow-sm cursor-default">
                    <Briefcase size={16} className="text-blue-400 mb-1.5 transition-transform group-hover/item:scale-110" />
                    <span className="text-[13px] font-semibold text-white/90">{equipmentCount}</span>
                    <span className="text-[9px] uppercase tracking-wider text-white/50 font-bold">Eq</span>
                </div>

                <div className="flex flex-col items-center justify-center p-4 rounded-[16px] bg-white/[0.03] border border-white/[0.05] group/item transition-all hover:bg-white/[0.06] hover:border-amber-500/20 shadow-sm cursor-default">
                    <CheckSquare size={16} className="text-amber-400 mb-1.5 transition-transform group-hover/item:scale-110" />
                    <span className="text-[13px] font-semibold text-white/90">{remainingTasks}</span>
                    <span className="text-[9px] uppercase tracking-wider text-white/50 font-bold">Tasks</span>
                </div>
            </div>

            <div className="mt-6 flex items-center">
                <Link 
                  href={`/production/${event.id}`}
                  className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-white/20 hover:text-blue-400 transition-colors group/link no-underline"
                >
                    View Production File <ArrowRight size={12} className="group-hover/link:translate-x-1 transition-transform" />
                </Link>
            </div>
        </ReactiveCard>
    );
};
