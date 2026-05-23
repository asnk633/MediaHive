import React, { useEffect, useState } from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import { useRouter } from 'next/navigation';
import { cn, nativeNavigate } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContextProvider';
import { CampaignItem as Campaign } from '@/services/campaigns/campaignService';
import { ArrowRight, FolderPlus } from 'lucide-react';
import { DataIntegritySignal } from '@/components/ui/DataIntegritySignal';
import { useCampaigns } from '@/services/campaigns/useCampaigns';
import { ErrorFallback } from '@/components/ui/ErrorFallback';

/**
 * ActiveCampaignsWidget (2026 Polish Pass)
 * Aligns visually with the Events widget for dashboard cohesion.
 */
export const ActiveCampaignsWidget = () => {
    const { user } = useAuth();
    const router = useRouter();
    const { data: allCampaigns, isLoading, error: queryError } = useCampaigns();
    const [campaigns, setCampaigns] = useState<Campaign[]>([]);

    useEffect(() => {
        if (allCampaigns) {
            const active = allCampaigns.filter(c => c.phase !== 'completed');
            setCampaigns(active);
        }
    }, [allCampaigns]);

    const error = queryError ? "Unable to load active campaigns." : null;

    const handleCreated = (id: string) => {
        nativeNavigate(`/campaigns/${id}`, router, 'ActiveCampaigns (Created)');
    };

    if (!user) return null;

    // Loading State (Skeleton) - Matches Events Grid density
    if (isLoading) {
        return (
            <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {[1, 2, 3].map(i => (
                        <div key={i} className="h-40 rounded-[18px] bg-foreground/[0.02] border border-foreground/5 animate-pulse" />
                    ))}
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <ErrorFallback
                message="Unable to load active campaigns"
                onRetry={() => window.location.reload()}
                className="min-h-[220px]"
            />
        );
    }

    return (
        <div className="space-y-6">
            {/* Data Integrity Signal */}
            <div className="flex items-center justify-between">
                <DataIntegritySignal meta={(campaigns as any).__meta} variant="subtle" />
            </div>

            {campaigns.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 px-6 border border-dashed border-foreground/10 rounded-[18px] bg-foreground/[0.01] animate-in fade-in duration-700">
                    <div className="w-12 h-12 rounded-full bg-foreground/5 flex items-center justify-center mb-4 text-foreground/80">
                        <FolderPlus size={24} />
                    </div>
                    <h3 className="text-sm font-bold text-foreground/80 uppercase tracking-widest">No active campaigns yet</h3>
                    <p className="text-[10px] text-foreground/80 mt-1 text-center">Create a campaign to start tracking initiatives.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-[20px]">
                    {campaigns.map(campaign => {
                        // High-restraint status mapping
                        const statusConfig = {
                            planning: { label: 'Planning', color: 'text-blue-400', bg: 'bg-blue-400/10', border: 'border-blue-400/20', glow: 'bg-blue-500 shadow-[0_0_15px_rgba(59,130,246,0.2)]' },
                            production: { label: 'Active', color: 'text-indigo-400', bg: 'bg-indigo-400/10', border: 'border-indigo-400/20', glow: 'bg-indigo-500 shadow-[0_0_15px_rgba(129,140,248,0.2)]' },
                            review: { label: 'Review', color: 'text-amber-400', bg: 'bg-amber-400/10', border: 'border-amber-400/20', glow: 'bg-amber-500 shadow-[0_0_15px_rgba(251,191,36,0.2)]' },
                            publish: { label: 'Publishing', color: 'text-emerald-400', bg: 'bg-emerald-400/10', border: 'border-emerald-400/20', glow: 'bg-emerald-500 shadow-[0_0_15px_rgba(16,185,129,0.2)]' },
                            completed: { label: 'Completed', color: 'text-slate-400', bg: 'bg-slate-400/10', border: 'border-slate-400/20', glow: 'bg-slate-400 shadow-[0_0_15px_rgba(148,163,184,0.2)]' }
                        }[campaign.phase] || { label: campaign.phase, color: 'text-foreground/80', bg: 'bg-foreground/5', border: 'border-foreground/10', glow: 'bg-foreground/10' };

                        return (
                            <div
                                key={campaign.id}
                                onClick={() => nativeNavigate(`/campaigns/${campaign.id}`, router, 'ActiveCampaigns:Detail')}
                                className="group relative flex flex-col justify-between p-5 lg:px-6 rounded-[18px] border border-foreground/5 bg-foreground/[0.01] backdrop-blur-md hover:bg-foreground/[0.02] hover:border-blue-500/20 transition-all duration-300 cursor-pointer overflow-hidden active:scale-[0.98] shadow-sm hover:shadow-blue-500/5 text-left hover:-translate-y-[2px]"
                            >
                                {/* 3px Accent Strip (Match Events) */}
                                <div className={cn(
                                    "absolute top-0 left-0 w-full h-[3px] opacity-20 group-hover:opacity-100 transition-opacity duration-500",
                                    statusConfig.glow
                                )} />

                                <div>
                                    <div className="flex justify-between items-center mb-5">
                                        <div className={cn(
                                            "px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-widest border transition-colors",
                                            statusConfig.bg,
                                            statusConfig.color,
                                            statusConfig.border
                                        )}>
                                            {statusConfig.label}
                                        </div>
                                        <div className="flex items-center gap-1.5 text-[9px] font-bold text-foreground/70 bg-foreground/5 border border-foreground/10 px-2 py-0.5 rounded-full uppercase tracking-tighter group-hover:text-foreground/80 transition-colors">
                                            Institutional
                                        </div>
                                    </div>

                                    <h3 className="text-sm font-bold text-foreground/80 group-hover:text-foreground leading-snug line-clamp-2 min-h-[40px] transition-all duration-300">
                                        {campaign.name}
                                    </h3>
                                </div>

                                <div className="flex items-center justify-between pt-4 border-t border-foreground/5 mt-4">
                                    <div className="flex flex-col">
                                        <span className="text-[8px] font-black text-foreground/70 uppercase tracking-[0.2em] mb-0.5 group-hover:text-foreground/80 transition-colors">Deadline</span>
                                        <span className="text-xs font-bold text-foreground/80 group-hover:text-foreground/80 transition-colors">
                                            {new Date(campaign.endDate as string).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-1 text-[9px] font-bold text-blue-400/60 opacity-0 group-hover:opacity-100 transform translate-x-3 group-hover:translate-x-0 transition-all duration-500">
                                        ANALYZE <ArrowRight size={10} className="stroke-[3px]" />
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
};
