import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { CampaignService } from '@/services/campaignService';
import { Campaign } from '@/types/campaign';
import { Plus, ArrowRight, Flag } from 'lucide-react';
import { CampaignCreateModal } from '@/components/campaigns/CampaignCreateModal';

export const ActiveCampaignsWidget = () => {
    const { user } = useAuth();
    const router = useRouter();
    const [campaigns, setCampaigns] = useState<Campaign[]>([]);
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

    useEffect(() => {
        if (!user) return;
        const load = async () => {
            try {
                const data = await CampaignService.getUserCampaigns({
                    uid: user.uid,
                    role: user.role || 'guest'
                });
                // Filter out completed/archived if needed, keeping simple for now
                const active = data.filter(c => c.phase !== 'completed');
                setCampaigns(active);
            } catch (e) {
                console.error('[ActiveCampaignsWidget] Error fetching campaigns:', e);
            }
        };
        load();
    }, [user]);

    const handleCreated = (id: string) => {
        router.push(`/campaigns/${id}`);
    };

    if (!user) return null;

    return (
        <div className="space-y-4">
            {/* <div className="text-xs text-red-500 font-mono">DEBUG: Widget Rendered. Count: {campaigns.length}</div> */}

            <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide snap-x">
                {/* Create Card */}
                <button
                    onClick={() => setIsCreateModalOpen(true)}
                    className="min-w-[160px] h-[180px] rounded-2xl border border-dashed border-white/20 bg-white/5 hover:bg-white/10 flex flex-col items-center justify-center gap-3 transition-all group snap-start shrink-0"
                >
                    <div className="w-10 h-10 rounded-full bg-blue-500/20 text-blue-400 flex items-center justify-center group-hover:scale-110 transition-transform">
                        <Plus size={24} />
                    </div>
                    <span className="text-sm font-semibold text-gray-300 group-hover:text-white">New Campaign</span>
                </button>

                {/* Empty State */}
                {campaigns.length === 0 && (
                    <div className="min-w-[280px] h-[180px] rounded-2xl border border-white/5 bg-white/5 flex flex-col items-center justify-center p-6 text-center text-gray-500 snap-start shrink-0">
                        <Flag className="mb-2 opacity-20" size={32} />
                        <p className="text-sm font-medium">No active campaigns</p>
                        <p className="text-xs opacity-60 mt-1">Create one to get started</p>
                    </div>
                )}

                {/* Campaign Cards */}
                {campaigns.map(campaign => (
                    <div
                        key={campaign.id}
                        onClick={() => router.push(`/campaigns/${campaign.id}`)}
                        className="min-w-[280px] h-[180px] rounded-2xl border border-white/10 bg-[#1e293b]/50 backdrop-blur-sm p-5 flex flex-col justify-between hover:border-blue-500/50 hover:shadow-lg hover:shadow-blue-500/10 transition-all cursor-pointer snap-start group relative overflow-hidden"
                    >
                        {/* Phase Awareness Strip */}
                        <div className={`absolute top-0 left-0 right-0 h-1 ${campaign.phase === 'planning' ? 'bg-blue-500' :
                            campaign.phase === 'production' ? 'bg-indigo-500' :
                                campaign.phase === 'review' ? 'bg-amber-500' :
                                    campaign.phase === 'publish' ? 'bg-emerald-500' :
                                        'bg-gray-500'
                            }`} />
                        {/* Decorative Gradient */}
                        <div className="absolute top-0 right-0 w-24 h-24 bg-blue-500/10 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2 pointer-events-none" />

                        <div>
                            <div className="flex justify-between items-start mb-2">
                                <span className={`text-[10px] font-bold px-2 py-1 rounded-lg uppercase tracking-wider border ${campaign.phase === 'planning' ? 'bg-blue-500/20 text-blue-300 border-blue-500/30' :
                                    'bg-purple-500/20 text-purple-300 border-purple-500/30'
                                    }`}>
                                    {campaign.phase}
                                </span>
                                {campaign.createdBy.role === 'guest' && (
                                    <span className="w-2 h-2 rounded-full bg-yellow-400" title="Guest Created" />
                                )}
                            </div>
                            <h3 className="text-lg font-bold text-white leading-tight line-clamp-2 mt-2 group-hover:text-blue-200 transition-colors">
                                {campaign.name}
                            </h3>
                        </div>

                        <div className="flex items-end justify-between">
                            <div className="text-xs text-gray-400">
                                <p>Ends {new Date(campaign.endDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}</p>
                            </div>
                            <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center text-gray-400 group-hover:bg-blue-500 group-hover:text-white transition-all">
                                <ArrowRight size={16} />
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            <CampaignCreateModal
                isOpen={isCreateModalOpen}
                onClose={() => setIsCreateModalOpen(false)}
                onCreated={handleCreated}
            />
        </div>
    );
};
