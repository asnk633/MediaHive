'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { nativeNavigate } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContextProvider';
import { CampaignService } from '@/features/campaigns/services/campaignService';
import { Campaign } from '@/features/campaigns/types/campaign';
import { Task } from "@/features/tasks/types/task";
import { ArrowLeft, Calendar, Layers, Clock, CheckCircle, AlertCircle } from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';

export default function CampaignDashboardPage() {
    return <CampaignDashboardContent />;
}

function CampaignDashboardContent() {
    const searchParams = typeof window !== 'undefined' ? new URLSearchParams(window.location.search) : new URLSearchParams();
    const id = searchParams.get('id');
    const router = useRouter();
    const { user } = useAuth();
    const [campaign, setCampaign] = useState<Campaign | null>(null);
    const [tasks, setTasks] = useState<Task[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!id || !user) return;

        const loadData = async () => {
            try {
                const camp = await CampaignService.getCampaign(id as string);
                if (!camp) {
                    toast.error("Campaign not found");
                    nativeNavigate('/home', router, 'CampaignView (NotFound)');
                    return;
                }
                setCampaign(camp);

                const campaignTasks = await CampaignService.getCampaignTasks(id as string);
                setTasks(campaignTasks);
            } catch (error) {
                console.error(error);
                toast.error("Failed to load campaign");
            } finally {
                setLoading(false);
            }
        };

        loadData();
    }, [id, user, router]);

    if (loading) return <div className="p-8 text-center text-foreground">Loading Campaign...</div>;
    if (!campaign) return null;

    const canEditDetails = user?.role === 'admin' || user?.role === 'manager';

    // Simple status colors
    const getPhaseColor = (p: string) => {
        switch (p) {
            case 'planning': return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
            case 'production': return 'bg-purple-500/20 text-purple-400 border-purple-500/30';
            case 'review': return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
            case 'completed': return 'bg-green-500/20 text-green-400 border-green-500/30';
            default: return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
        }
    };

    return (
        <div className="min-h-screen bg-[var(--glass-liquid-bg)] p-4 pb-20 md:p-8 space-y-8">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <button
                        onClick={() => router.back()}
                        className="flex items-center gap-2 text-gray-400 hover:text-foreground transition-colors mb-2 text-sm"
                    >
                        <ArrowLeft size={16} /> Back
                    </button>
                    <h1 className="text-3xl font-bold text-foreground tracking-tight">{campaign.name}</h1>
                    <p className="text-gray-400 mt-1 max-w-2xl">{campaign.description || "No description provided."}</p>
                </div>

                <div className="flex items-center gap-3">
                    <button
                        onClick={() => nativeNavigate(`/tasks/new?campaign_id=${campaign.id}`, router, 'CampaignView (New Task)')}
                        className="px-6 py-2.5 bg-primary hover:opacity-90 text-foreground rounded-full text-xs md:text-sm font-bold shadow-lg shadow-primary/25 transition-all hover:scale-105 flex items-center gap-2"
                    >
                        <Layers size={16} />
                        New Task
                    </button>
                    <div className={`px-4 py-1.5 rounded-full border text-xs font-bold uppercase tracking-wider ${getPhaseColor(campaign.phase)}`}>
                        {campaign.phase}
                    </div>
                    {(!canEditDetails && campaign.phase === 'planning') && (
                        <button className="px-4 py-2 bg-foreground/10 hover:bg-foreground/20 text-foreground rounded-full text-sm font-semibold transition-colors">
                            Edit Details
                        </button>
                    )}
                </div>
            </div>

            {/* Info Grid */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-glass border border-soft rounded-2xl p-4 flex items-center gap-4">
                    <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center text-primary">
                        <Calendar size={20} />
                    </div>
                    <div>
                        <p className="text-xs text-gray-400 uppercase">Timeline</p>
                        <p className="text-sm font-semibold text-foreground">
                            {format(new Date(campaign.startDate), 'MMM d')} - {format(new Date(campaign.endDate), 'MMM d, yyyy')}
                        </p>
                    </div>
                </div>

                <div className="bg-glass border border-soft rounded-2xl p-4 flex items-center gap-4">
                    <div className="w-10 h-10 rounded-full bg-purple-500/20 flex items-center justify-center text-purple-400">
                        <Layers size={20} />
                    </div>
                    <div>
                        <p className="text-xs text-gray-400 uppercase">Tasks</p>
                        <p className="text-sm font-semibold text-foreground">{tasks.length} Items</p>
                    </div>
                </div>

                <div className="bg-glass border border-soft rounded-2xl p-4 flex items-center gap-4">
                    <div className="w-10 h-10 rounded-full bg-green-500/20 flex items-center justify-center text-green-400">
                        <CheckCircle size={20} />
                    </div>
                    <div>
                        <p className="text-xs text-gray-400 uppercase">Progress</p>
                        <p className="text-sm font-semibold text-foreground">
                            {Math.round((tasks.filter(t => t.status === 'done').length / (tasks.length || 1)) * 100)}% Complete
                        </p>
                    </div>
                </div>

                <div className="bg-glass border border-soft rounded-2xl p-4 flex items-center gap-4">
                    <div className="w-10 h-10 rounded-full bg-orange-500/20 flex items-center justify-center text-orange-400">
                        <Clock size={20} />
                    </div>
                    <div>
                        <p className="text-xs text-gray-400 uppercase">Status</p>
                        <p className="text-sm font-semibold text-foreground">On Track</p>
                    </div>
                </div>
            </div>

            {/* Content Area */}
            <div className="space-y-6">
                <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
                    <Layers size={20} className="text-primary" />
                    Campaign Tasks
                </h2>

                {tasks.length > 0 ? (
                    <div className="grid grid-cols-1 gap-3">
                        {tasks.map(task => (
                            <div key={task.id} className="bg-glass border border-soft rounded-xl p-4 hover:bg-foreground/10 transition-colors flex items-center justify-between group cursor-pointer" onClick={() => nativeNavigate(`/tasks/view?id=${task.id}`, router, 'CampaignView (Task Click)')}>
                                <div>
                                    <h3 className="text-foreground font-medium group-hover:text-primary transition-colors">{task.title}</h3>
                                    <p className="text-sm text-gray-500 line-clamp-1">{task.description}</p>
                                </div>
                                <div className="flex items-center gap-3">
                                    <span className={`px-2 py-1 rounded-lg text-xs font-semibold ${task.status === 'done' ? 'bg-green-500/20 text-green-400' :
                                        task.status === 'in_progress' ? 'bg-blue-500/20 text-blue-400' :
                                            'bg-gray-500/20 text-gray-400'
                                        }`}>
                                        {task.status.replace('_', ' ')}
                                    </span>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="bg-glass border border-soft border-dashed rounded-2xl p-12 text-center text-gray-500">
                        <div className="w-16 h-16 bg-foreground/5 rounded-full flex items-center justify-center mx-auto mb-4">
                            <Layers size={32} className="opacity-50" />
                        </div>
                        <h3 className="text-foreground font-semibold text-lg">No tasks yet</h3>
                        <p className="text-sm mt-1">Start adding tasks to this campaign to track progress.</p>
                        <button
                            onClick={() => nativeNavigate(`/tasks/new?campaign_id=${campaign.id}`, router, 'CampaignView (Empty New Task)')}
                            className="mt-4 px-6 py-2 bg-primary hover:opacity-90 text-foreground rounded-full text-sm font-semibold transition-colors"
                        >
                            Add First Task
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}
