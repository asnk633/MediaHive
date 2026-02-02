import React, { useEffect, useState } from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import { useRouter } from 'next/navigation';
import { nativeNavigate } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContextProvider';
import { CampaignService } from '@/services/campaignService';
import { Campaign } from '@/types/campaign';
import { ArrowRight } from 'lucide-react';
import { DataIntegritySignal } from '@/components/ui/DataIntegritySignal';

export const ActiveCampaignsWidget = () => {
    const { user } = useAuth();
    const router = useRouter();
    const [campaigns, setCampaigns] = useState<Campaign[]>([]);
    const [error, setError] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    const lastFetchedUid = React.useRef<string | null>(null);

    useEffect(() => {
        if (!user?.uid) return;

        // Dedup guard
        if (lastFetchedUid.current === user.uid) return;
        lastFetchedUid.current = user.uid;

        const load = async () => {
            setIsLoading(true);
            try {
                // Artificial delay for interaction feel (optional, but good for testing skeleton)
                // await new Promise(r => setTimeout(r, 600)); 

                const data = await CampaignService.getUserCampaigns({
                    uid: user.uid,
                    role: user.role || 'guest'
                });
                // Filter out completed/archived if needed, keeping simple for now
                const active = data.filter(c => c.phase !== 'completed');
                setCampaigns(active);
                setError(null);
            } catch (e) {
                console.error('[ActiveCampaignsWidget] Error fetching campaigns:', e);
                setError("Unable to load active campaigns.");
            } finally {
                setIsLoading(false);
            }
        };
        load();
    }, [user?.uid, user?.role]);

    const handleCreated = (id: string) => {
        nativeNavigate(`/campaigns/${id}`, router, 'ActiveCampaigns (Created)');
    };

    if (!user) return null;

    // Loading State (Skeleton) - Prevents Layout Shift
    if (isLoading) {
        return (
            <div className="space-y-4">
                <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide">
                    {[1, 2, 3].map(i => (
                        <div key={i} className="min-w-[280px] h-[180px] rounded-lg bg-tier3-surface border border-white/5 flex flex-col p-5 justify-between">
                            <div className="space-y-3">
                                <Skeleton className="h-4 w-20 bg-white/10" />
                                <Skeleton className="h-6 w-3/4 bg-white/10" />
                            </div>
                            <div className="flex justify-between items-end">
                                <Skeleton className="h-3 w-24 bg-white/5" />
                                <Skeleton className="w-8 h-8 rounded-full bg-white/5" />
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-w-[280px] h-[180px] rounded-lg border border-white/5 bg-white/[0.02] flex flex-col items-center justify-center text-center p-4">
                <span className="text-text-muted font-medium text-sm mb-2">{error}</span>
                <button
                    onClick={() => window.location.reload()}
                    className="text-xs text-text-secondary hover:text-white transition-colors underline decoration-white/20 hover:decoration-white/50"
                >
                    Retry Connection
                </button>
            </div>
        );
    }

    return (
        <div className="space-y-4">
            {/* Data Integrity Signal */}
            <div className="flex items-center justify-between">
                <DataIntegritySignal meta={(campaigns as any).__meta} variant="subtle" />
            </div>

            <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide snap-x">
                {/* Campaign Cards */}
                {campaigns.map(campaign => (
                    <div
                        key={campaign.id}
                        onClick={() => nativeNavigate(`/campaigns/view?id=${campaign.id}`, router, 'ActiveCampaigns (View)')}
                        className="min-w-[280px] h-[180px] tier3-surface rounded-lg border border-border-subtle p-5 flex flex-col justify-between hover:bg-white/[0.04] transition-colors cursor-pointer snap-start group relative overflow-hidden active:scale-[0.98] duration-200 ease-out"
                    >
                        {/* Phase Awareness Strip */}
                        <div className={`absolute top-0 left-0 right-0 h-1 ${campaign.phase === 'planning' ? 'bg-blue-500' :
                            campaign.phase === 'production' ? 'bg-indigo-500' :
                                campaign.phase === 'review' ? 'bg-amber-500' :
                                    campaign.phase === 'publish' ? 'bg-emerald-500' :
                                        'bg-gray-500'
                            }`} />

                        <div>
                            <div className="flex justify-between items-start mb-2">
                                <span className={`text-[10px] font-bold px-2 py-1 rounded-md uppercase tracking-wider border ${campaign.phase === 'planning' ? 'bg-blue-500/10 text-blue-300 border-blue-500/20' :
                                    'bg-purple-500/10 text-purple-300 border-purple-500/20'
                                    }`}>
                                    {campaign.phase}
                                </span>
                                {campaign.createdBy.role === 'guest' && (
                                    <span className="w-2 h-2 rounded-full bg-yellow-400" title="Guest Created" />
                                )}
                            </div>
                            <h3 className="text-lg font-bold text-white leading-tight line-clamp-2 mt-2 group-hover:text-accent-primary transition-colors">
                                {campaign.name}
                            </h3>
                        </div>

                        <div className="flex items-end justify-between">
                            <div className="text-xs text-text-muted">
                                <p>Ends {new Date(campaign.endDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}</p>
                            </div>
                            <div className="w-8 h-8 rounded-full bg-canvas flex items-center justify-center text-text-muted group-hover:bg-accent-primary group-hover:text-white transition-all">
                                <ArrowRight size={16} />
                            </div>
                        </div>
                    </div>
                ))}
            </div>


        </div>
    );
};
