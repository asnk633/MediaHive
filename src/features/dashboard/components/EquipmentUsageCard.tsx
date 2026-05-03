'use client';

import React from 'react';
import { Briefcase, Package, Clock } from 'lucide-react';
import { cn } from '@/lib/utils';
import { ReactiveCard } from '@/components/ui/ReactiveCard';
import { Skeleton } from '@/components/ui/skeleton';
import { format } from 'date-fns';

interface EquipmentUsageCardProps {
    equipment: any[];
    isLoading: boolean;
}

export const EquipmentUsageCard: React.FC<EquipmentUsageCardProps> = ({ equipment, isLoading }) => {
    return (
        <ReactiveCard className="p-5 bg-white/[0.03] border border-white/[0.06] rounded-[16px] transition-all h-full flex flex-col">
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                    <div className="p-2 rounded-lg bg-blue-500/10 text-blue-400">
                        <Briefcase size={18} />
                    </div>
                    <h3 className="text-sm font-medium text-white/85 pl-[6px]">Equipment Usage</h3>
                </div>
            </div>

            <div className="flex-1 space-y-4 overflow-y-auto no-scrollbar max-h-[320px]">
                {isLoading ? (
                    Array(3).fill(0).map((_, i) => (
                        <div key={i} className="flex gap-4 items-center">
                            <Skeleton className="h-10 w-10 rounded-lg bg-white/10" />
                            <div className="space-y-2 flex-1">
                                <Skeleton className="h-4 w-1/3 bg-white/10" />
                                <Skeleton className="h-3 w-1/2 bg-white/5" />
                            </div>
                        </div>
                    ))
                ) : equipment.length > 0 ? (
                    equipment.map((item, idx) => (
                        <div key={`${item.id}-${idx}`} className="flex items-center gap-4 p-2 rounded-[18px] hover:bg-white/[0.01] transition-colors">
                            <div className="w-10 h-10 rounded-lg bg-blue-500/10 border border-blue-500/20 flex items-center justify-center p-1 overflow-hidden">
                                {item.inventory?.image_url ? (
                                    <img 
                                        src={item.inventory.image_url} 
                                        alt={item.inventory.name} 
                                        className="w-full h-full object-cover rounded"
                                    />
                                ) : (
                                    <Package size={20} className="text-blue-400" />
                                )}
                            </div>
                            
                            <div className="min-w-0 flex-1">
                                <h4 className="text-sm font-semibold text-white/90 truncate">
                                    {item.inventory?.name || 'Equipment'}
                                </h4>
                                <div className="flex items-center justify-between mt-1">
                                    <span className="text-[10px] text-white/40 truncate pr-2">
                                        {item.event_title}
                                    </span>
                                    {(() => {
                                        if (!item.start_at) return null;
                                        const eventTime = new Date(item.start_at);
                                        const isPast = eventTime < new Date();
                                        return (
                                            <div className={cn(
                                                "text-[9px] font-black px-1.5 py-0.5 rounded border uppercase tracking-wider whitespace-nowrap",
                                                isPast ? "text-emerald-400 bg-emerald-400/10 border-emerald-400/20" : "text-amber-400 bg-amber-400/10 border-amber-400/20"
                                            )}>
                                                {isPast ? "IN USE" : `RESERVED @ ${format(eventTime, 'HH:mm')}`}
                                            </div>
                                        );
                                    })()}
                                </div>
                            </div>
                        </div>
                    ))
                ) : (
                    <div className="flex flex-col items-center justify-center py-12 text-center">
                        <Briefcase size={32} className="text-white/5 mb-3" />
                        <p className="text-xs text-white/50 font-medium">No equipment entries for today.</p>
                    </div>
                )}
            </div>
        </ReactiveCard>
    );
};
