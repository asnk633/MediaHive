'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { CanonicalDataService, OperationalSummary } from '@/services/canonicalDataService';
import { Calendar, CheckSquare, Users, Wrench } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContextProvider';
import { useWorkspace } from '@/system/workspace/WorkspaceProvider';

export const ProductionPulseBar: React.FC = () => {
    const { user } = useAuth();
    const { currentWorkspaceId } = useWorkspace();
    const [data, setData] = useState<OperationalSummary | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    const fetchPulseData = useCallback(async () => {
        try {
            const summary = await CanonicalDataService.getTodayOperationalSummary(currentWorkspaceId || undefined);
            setData(summary);
        } catch (error) {
            console.error('[ProductionPulseBar] Fetch error:', error);
        } finally {
            setIsLoading(false);
        }
    }, [currentWorkspaceId]);

    useEffect(() => {
        if (user) {
            fetchPulseData();
        }
    }, [user, fetchPulseData]);

    if (isLoading) {
        return (
            <div className="w-full h-10 rounded-[12px] bg-white/[0.03] border border-white/5 animate-pulse" />
        );
    }

    if (!data) return null;

    const eventsCount = data.events.length;
    const tasksInProgress = data.tasks.filter(t => t.status === 'in_progress').length;
    const crewCount = data.crew.length;
    const equipmentCount = data.equipment.length;

    const isActive = eventsCount > 0 || tasksInProgress > 0 || crewCount > 0 || equipmentCount > 0;

    return (
        <div className="w-full flex flex-col md:flex-row md:items-center justify-between px-6 py-4 glass-card border-white/10 rounded-2xl overflow-hidden shadow-2xl gap-4 md:gap-0">
            
            {/* Status Indicator */}
            <div className="flex items-center gap-3 min-w-fit">
                <div className="relative flex h-3.5 w-3.5 items-center justify-center">
                    {isActive ? (
                        <>
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400/40 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-400 shadow-[0_0_12px_rgba(52,211,153,0.8)]"></span>
                        </>
                    ) : (
                        <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-white/10"></span>
                    )}
                </div>
                <span className={cn(
                    "text-[10px] font-black uppercase tracking-[0.2em] transition-colors duration-500",
                    isActive ? "text-emerald-400" : "text-white/50"
                )}>
                    {isActive ? "Production Live" : "Standby Mode"}
                </span>
            </div>

            {/* Metrics Strip */}
            {isActive && (
                <div className="flex flex-wrap items-center gap-x-6 gap-y-3">
                    <div className="flex items-center gap-2.5 shrink-0 group cursor-default">
                        <div className="p-1.5 rounded-lg bg-blue-500/10 border border-blue-500/20 group-hover:bg-blue-500/20 transition-colors">
                            <Calendar size={14} className="text-blue-400" />
                        </div>
                        <span className="text-sm font-bold text-white">{eventsCount} <span className="text-[10px] font-black uppercase tracking-wider text-white/50 ml-1">Events</span></span>
                    </div>
                    
                    <div className="w-px h-4 bg-white/10 shrink-0" />
                    
                    <div className="flex items-center gap-2.5 shrink-0 group cursor-default">
                        <div className="p-1.5 rounded-lg bg-indigo-500/10 border border-indigo-500/20 group-hover:bg-indigo-500/20 transition-colors">
                            <CheckSquare size={14} className="text-indigo-400" />
                        </div>
                        <span className="text-sm font-bold text-white">{tasksInProgress} <span className="text-[10px] font-black uppercase tracking-wider text-white/50 ml-1">Tasks</span></span>
                    </div>

                    <div className="w-px h-4 bg-white/10 shrink-0" />

                    <div className="flex items-center gap-2.5 shrink-0 group cursor-default">
                        <div className="p-1.5 rounded-lg bg-purple-500/10 border border-purple-500/20 group-hover:bg-purple-500/20 transition-colors">
                            <Users size={14} className="text-purple-400" />
                        </div>
                        <span className="text-sm font-bold text-white">{crewCount} <span className="text-[10px] font-black uppercase tracking-wider text-white/50 ml-1">Crew</span></span>
                    </div>

                    <div className="w-px h-4 bg-white/10 shrink-0" />

                    <div className="flex items-center gap-2.5 shrink-0 group cursor-default">
                        <div className="p-1.5 rounded-lg bg-amber-500/10 border border-amber-500/20 group-hover:bg-amber-500/20 transition-colors">
                            <Wrench size={14} className="text-amber-400" />
                        </div>
                        <span className="text-sm font-bold text-white">{equipmentCount} <span className="text-[10px] font-black uppercase tracking-wider text-white/50 ml-1">Equipment</span></span>
                    </div>
                </div>
            )}
        </div>
    );
};
