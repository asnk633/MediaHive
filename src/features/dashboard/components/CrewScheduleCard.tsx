'use client';

import React from 'react';
import { Users, Calendar, MapPin } from 'lucide-react';
import { cn } from '@/lib/utils';
import { ReactiveCard } from '@/components/ui/ReactiveCard';
import { Skeleton } from '@/components/ui/skeleton';
import { format } from 'date-fns';

interface CrewScheduleCardProps {
    crew: any[];
    isLoading: boolean;
}

export const CrewScheduleCard: React.FC<CrewScheduleCardProps> = ({ crew, isLoading }) => {
    return (
        <ReactiveCard className="p-5 bg-foreground/[0.03] border border-foreground/[0.06] rounded-[16px] transition-all h-full flex flex-col">
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                    <div className="p-2 rounded-lg bg-blue-500/10 text-blue-400">
                        <Users size={18} />
                    </div>
                    <h3 className="text-sm font-medium text-foreground/85 pl-[6px]">Crew Schedule</h3>
                </div>
            </div>

            <div className="flex-1 space-y-4 overflow-y-auto no-scrollbar max-h-[320px]">
                {isLoading ? (
                    Array(3).fill(0).map((_, i) => (
                        <div key={i} className="flex gap-4 items-center">
                            <Skeleton className="h-10 w-10 rounded-full bg-foreground/10" />
                            <div className="space-y-2 flex-1">
                                <Skeleton className="h-4 w-1/3 bg-foreground/10" />
                                <Skeleton className="h-3 w-1/2 bg-foreground/5" />
                            </div>
                        </div>
                    ))
                ) : crew.length > 0 ? (
                    crew.map((item, idx) => (
                        <div key={`${item.id}-${idx}`} className="flex items-center gap-4 p-2 rounded-[18px] hover:bg-foreground/[0.01] transition-colors">
                            <div className="relative">
                                {item.profile?.avatar_url ? (
                                    <img 
                                        src={item.profile.avatar_url} 
                                        alt={item.profile.full_name} 
                                        className="w-10 h-10 rounded-full object-cover border border-foreground/10"
                                    />
                                ) : (
                                    <div className="w-10 h-10 rounded-full bg-blue-500/20 flex items-center justify-center text-blue-400 font-bold border border-blue-500/20">
                                        {item.profile?.full_name?.charAt(0) || '?'}
                                    </div>
                                )}
                                <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-emerald-500 border-2 border-[#0A0A0B] rounded-full shadow-sm" />
                            </div>
                            
                            <div className="min-w-0 flex-1">
                                <h4 className="text-sm font-semibold text-foreground/90 truncate">
                                    {item.profile?.full_name || 'Team Member'}
                                </h4>
                                <div className="flex items-center gap-3 mt-0.5">
                                    <span className="text-[10px] font-black text-indigo-400 uppercase tracking-widest">
                                        {item.role || 'Crew'}
                                    </span>
                                    <span className="text-[10px] text-foreground/80 whitespace-nowrap">
                                        @ {item.start_at ? format(new Date(item.start_at), 'HH:mm') : '--:--'}
                                    </span>
                                </div>
                                <p className="text-[11px] text-foreground/70 truncate mt-1">
                                    {item.event_title}
                                </p>
                            </div>
                        </div>
                    ))
                ) : (
                    <div className="flex flex-col items-center justify-center py-12 text-center">
                        <Users size={32} className="text-foreground/5 mb-3" />
                        <p className="text-xs text-foreground/70 font-medium">No personnel scheduled today.</p>
                    </div>
                )}
            </div>
        </ReactiveCard>
    );
};
