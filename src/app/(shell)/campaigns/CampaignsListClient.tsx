'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { nativeNavigate } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContextProvider';
import { useWorkspace } from '@/system/workspace/WorkspaceProvider';
import { CampaignService } from '@/features/campaigns/services/campaignService';
import { Campaign } from '@/features/campaigns/types/campaign';
import { PageLayout } from '@/components/ui/layout/PageLayout';
import { PageHeader } from '@/components/ui/layout/PageHeader';
import {
    Layout, Plus, Search, Calendar, CheckCircle, Clock,
    Layers, ChevronRight, Loader2, LayoutGrid
} from 'lucide-react';
import { format } from 'date-fns';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

const PHASE_STYLES: Record<string, string> = {
    planning: 'bg-blue-500/15 text-blue-400 border-blue-500/30',
    production: 'bg-purple-500/15 text-purple-400 border-purple-500/30',
    review: 'bg-amber-500/15 text-amber-400 border-amber-500/30',
    completed: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
};

export default function CampaignsListClient() {
    const router = useRouter();
    const { user } = useAuth();
    const { currentWorkspace } = useWorkspace();
    const [campaigns, setCampaigns] = useState<Campaign[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [phaseFilter, setPhaseFilter] = useState<string>('all');

    useEffect(() => {
        if (!user || !currentWorkspace) return;
        setLoading(true);
        CampaignService.getCampaigns(user).then(data => {
            setCampaigns(data || []);
        }).catch(console.error).finally(() => setLoading(false));
    }, [user, currentWorkspace]);

    const filtered = campaigns.filter(c => {
        const matchSearch = c.name.toLowerCase().includes(search.toLowerCase()) ||
            (c.description || '').toLowerCase().includes(search.toLowerCase());
        const matchPhase = phaseFilter === 'all' || c.phase === phaseFilter;
        return matchSearch && matchPhase;
    });

    const phases = ['all', 'planning', 'production', 'review', 'completed'];

    return (
        <PageLayout mode="plain">
            <PageHeader
                title="Campaigns"
                description="Track all media campaigns, phases, and associated tasks."
                actions={
                    <Button
                        onClick={() => nativeNavigate('/campaigns/new', router, 'Campaigns (New)')}
                        className="bg-primary hover:opacity-90 text-foreground gap-2 font-bold"
                    >
                        <Plus className="h-4 w-4" />
                        New Campaign
                    </Button>
                }
            />

            {/* Filters */}
            <div className="flex flex-col sm:flex-row gap-3 mb-6">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted" />
                    <Input
                        placeholder="Search campaigns..."
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                        className="pl-9 bg-background border-soft"
                    />
                </div>
                <div className="flex items-center gap-2 flex-wrap bg-foreground/[0.03] p-1 rounded-full border border-foreground/10 backdrop-blur-md w-fit">
                    {phases.map(phase => (
                        <button
                            key={phase}
                            onClick={() => setPhaseFilter(phase)}
                            className={cn(
                                'px-4 py-1.5 rounded-full text-xs font-semibold capitalize transition-all border border-transparent',
                                phaseFilter === phase
                                    ? 'bg-primary/10 text-primary border-primary/20 shadow-sm'
                                    : 'text-foreground/80 hover:text-foreground hover:bg-foreground/5'
                            )}
                        >
                            {phase}
                        </button>
                    ))}
                </div>
            </div>

            {/* Content */}
            {loading ? (
                <div className="flex items-center justify-center py-24">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
            ) : filtered.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-24 text-center rounded-2xl border border-dashed border-foreground/10">
                    <LayoutGrid className="h-12 w-12 text-foreground/80 mb-4" />
                    <h3 className="text-foreground font-semibold text-lg">
                        {search || phaseFilter !== 'all' ? 'No matching campaigns' : 'No campaigns yet'}
                    </h3>
                    <p className="text-foreground/80 text-sm mt-1 max-w-xs">
                        {search || phaseFilter !== 'all'
                            ? 'Try adjusting your filters.'
                            : 'Create your first campaign to start organizing media production.'}
                    </p>
                    {!search && phaseFilter === 'all' && (
                        <Button
                            onClick={() => nativeNavigate('/campaigns/new', router, 'Campaigns (Empty New)')}
                            className="mt-6 bg-primary hover:opacity-90 text-foreground gap-2 font-bold"
                        >
                            <Plus className="h-4 w-4" />
                            Create Campaign
                        </Button>
                    )}
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
                    {filtered.map(campaign => {
                        const start = new Date(campaign.startDate);
                        const end = new Date(campaign.endDate);
                        const isOverdue = end < new Date() && campaign.phase !== 'completed';

                        return (
                            <div
                                key={campaign.id}
                                onClick={() => nativeNavigate(`/campaigns/view?id=${campaign.id}`, router, 'Campaigns (View)')}
                                className="group relative bg-glass border border-soft rounded-2xl p-5 hover:border-primary/30 hover:shadow-lg hover:shadow-primary/10 transition-all cursor-pointer"
                            >
                                {/* Phase Badge */}
                                <div className="flex items-center justify-between mb-4">
                                    <span className={cn(
                                        'px-2.5 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider border',
                                        PHASE_STYLES[campaign.phase] || 'bg-foreground/10 text-foreground/80 border-foreground/10'
                                    )}>
                                        {campaign.phase}
                                    </span>
                                    {isOverdue && (
                                        <Badge className="bg-red-500/15 text-red-400 border-red-500/30 text-[10px]">Overdue</Badge>
                                    )}
                                </div>

                                {/* Title */}
                                <h3 className="font-bold text-foreground text-lg leading-snug group-hover:text-primary transition-colors mb-1 pr-6">
                                    {campaign.name}
                                </h3>
                                <p className="text-sm text-foreground/80 line-clamp-2 mb-4">
                                    {campaign.description || 'No description provided.'}
                                </p>

                                {/* Meta */}
                                <div className="flex items-center justify-between text-xs text-foreground/80 border-t border-foreground/5 pt-3">
                                    <span className="flex items-center gap-1.5">
                                        <Calendar className="h-3.5 w-3.5" />
                                        {format(start, 'MMM d')} – {format(end, 'MMM d, yyyy')}
                                    </span>
                                    <ChevronRight className="h-4 w-4 text-foreground/80 group-hover:text-primary group-hover:translate-x-0.5 transition-all" />
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </PageLayout>
    );
}
