"use client";

import React, { useEffect, useState } from 'react';
import { Layers, User, Calendar, FileText, Activity, Clock, ShieldAlert } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { apiClient } from '@/lib/apiClient';
import { SafeAvatar } from "@/components/ui/SafeAvatar";

interface ActivityItem {
    id: number;
    action: string;
    resourceType: string;
    resourceId?: string;
    timestamp: string;
    details?: any;
    user: {
        uid: string;
        name: string;
        avatarUrl?: string;
    };
}

export const ActivityFeedWidget = () => {
    const [feed, setFeed] = useState<ActivityItem[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchFeed = async () => {
        try {
            const data = await apiClient<{ feed: ActivityItem[] }>('/api/activity-feed');
            if (data?.feed) {
                setFeed(data.feed);
            }
        } catch (error) {
            console.error('Failed to load activity feed', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchFeed();
        const interval = setInterval(fetchFeed, 60000); // 60s poll
        return () => clearInterval(interval);
    }, []);

    const getIcon = (type: string, action: string) => {
        if (action === 'login' || action === 'logout') return <User size={14} className="text-blue-400" />;

        switch (type) {
            case 'task': return <Layers size={14} className="text-purple-400" />;
            case 'event': return <Calendar size={14} className="text-amber-400" />;
            case 'user': return <User size={14} className="text-emerald-400" />;
            case 'file': return <FileText size={14} className="text-cyan-400" />;
            case 'automation_rule': return <Activity size={14} className="text-rose-400" />;
            case 'audit_log': return <ShieldAlert size={14} className="text-red-400" />;
            default: return <Clock size={14} className="text-slate-400" />;
        }
    };

    const formatAction = (item: ActivityItem) => {
        const actionMap: Record<string, string> = {
            create: 'created',
            update: 'updated',
            delete: 'deleted',
            login: 'logged in',
            logout: 'logged out',
            upload: 'uploaded',
            send: 'sent'
        };

        const verb = actionMap[item.action] || item.action;
        const noun = item.resourceType.replace('_', ' ');

        // Contextual details
        const targetName = item.details?.title || item.details?.name || item.details?.filename || '';

        return (
            <span>
                {verb} {noun} {targetName && <span className="font-bold text-white">"{targetName}"</span>}
            </span>
        );
    };

    if (loading && feed.length === 0) {
        return (
            <div className="h-64 flex items-center justify-center text-slate-500 animate-pulse">
                Loading pulse...
            </div>
        );
    }

    if (feed.length === 0) {
        return (
            <div className="h-64 flex flex-col items-center justify-center text-slate-500 border border-white/5 bg-slate-900/50 rounded-2xl">
                <Activity size={32} className="opacity-20 mb-3" />
                <div className="text-sm">No recent activity</div>
            </div>
        );
    }

    return (
        <div className="bg-gradient-to-b from-slate-900/80 to-slate-950/90 border border-white/10 rounded-2xl overflow-hidden backdrop-blur-xl shadow-xl">
            <div className="px-6 py-4 border-b border-white/5 flex justify-between items-center bg-white/5">
                <h3 className="font-medium text-white flex items-center gap-2">
                    <Activity size={18} className="text-blue-400" />
                    Live Operations
                </h3>
                <div className="flex items-center gap-2">
                    <span className="relative flex h-2 w-2">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                    </span>
                    <span className="text-xs text-slate-500 font-mono tracking-wider">LIVE</span>
                </div>
            </div>

            <div className="max-h-[400px] overflow-y-auto pr-1 [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-slate-700/30 [&::-webkit-scrollbar-thumb]:rounded-full hover:[&::-webkit-scrollbar-thumb]:bg-slate-600/60">
                <div className="divide-y divide-white/5">
                    {feed.map((item) => (
                        <div key={item.id} className="p-4 flex gap-4 hover:bg-blue-500/5 transition-colors group">
                            <div className="mt-1">
                                <SafeAvatar
                                    src={item.user.avatarUrl}
                                    alt={item.user.name}
                                    name={item.user.name}
                                    className="w-8 h-8 rounded-lg border border-white/10 shadow-sm"
                                />
                            </div>
                            <div className="flex-1 min-w-0">
                                <div className="flex justify-between items-start gap-2">
                                    <div className="text-sm text-slate-300">
                                        <span className="font-medium text-white hover:text-blue-400 transition-colors cursor-pointer">{item.user.name}</span>
                                        {' '}
                                        {formatAction(item)}
                                    </div>
                                    <span className="text-[10px] text-slate-600 whitespace-nowrap pt-1 font-mono">
                                        {formatDistanceToNow(new Date(item.timestamp), { addSuffix: true })}
                                    </span>
                                </div>

                                <div className="mt-2 flex items-center gap-2">
                                    <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-white/5 border border-white/5 text-[10px] text-slate-400 uppercase tracking-wide group-hover:border-white/10 transition-colors">
                                        {getIcon(item.resourceType, item.action)}
                                        {item.resourceType.replace('_', ' ')}
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};
