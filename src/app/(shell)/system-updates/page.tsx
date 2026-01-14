"use client";

import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { apiClient } from '@/lib/apiClient';
import { formatDistanceToNow } from 'date-fns';
import Link from 'next/link';
import { Megaphone } from 'lucide-react';

interface SystemUpdate {
    id: string;
    title: string;
    body: string;
    severity: 'info' | 'important' | 'critical';
    createdAt: any;
}

export default function SystemUpdatesFeedPage() {
    const [updates, setUpdates] = useState<SystemUpdate[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchUpdates = async () => {
            try {
                const data = await apiClient('/api/system-updates');
                setUpdates(data.updates || []);
            } catch (e) {
                console.error("Failed to load updates", e);
            } finally {
                setLoading(false);
            }
        };
        fetchUpdates();
    }, []);

    const getSeverityColor = (sev: string) => {
        switch (sev) {
            case 'critical': return 'text-red-400 bg-red-500/10 border-red-500/20';
            case 'important': return 'text-orange-400 bg-orange-500/10 border-orange-500/20';
            default: return 'text-blue-400 bg-blue-500/10 border-blue-500/20';
        }
    };

    return (
        <div className="max-w-4xl mx-auto p-6 space-y-8">
            <div className="flex items-center gap-3 mb-6">
                <div className="p-3 bg-slate-800 rounded-xl">
                    <Megaphone className="w-8 h-8 text-indigo-400" />
                </div>
                <div>
                    <h1 className="text-2xl font-bold text-white">System Updates</h1>
                    <p className="text-slate-400">Latest news and announcements.</p>
                </div>
            </div>

            {loading ? (
                <div className="text-center text-slate-500 py-12">Loading updates...</div>
            ) : updates.length === 0 ? (
                <div className="text-center text-slate-500 py-12">No updates yet.</div>
            ) : (
                <div className="grid gap-4">
                    {updates.map(update => (
                        <Link href={`/system-updates/${update.id}`} key={update.id}>
                            <Card className="bg-slate-950/40 border-slate-800 hover:bg-slate-900/50 transition-colors cursor-pointer group">
                                <CardContent className="p-6">
                                    <div className="flex justify-between items-start gap-4">
                                        <div className="space-y-2 flex-1">
                                            <div className="flex items-center gap-2">
                                                <span className={`px-2 py-0.5 rounded text-[10px] uppercase font-bold border ${getSeverityColor(update.severity)}`}>
                                                    {update.severity}
                                                </span>
                                                <span className="text-xs text-slate-500">
                                                    {update.createdAt ? formatDistanceToNow(new Date(update.createdAt), { addSuffix: true }) : ''}
                                                </span>
                                            </div>
                                            <h3 className="text-lg font-semibold text-slate-200 group-hover:text-indigo-400 transition-colors">
                                                {update.title}
                                            </h3>
                                            <p className="text-sm text-slate-400 line-clamp-2">
                                                {update.body}
                                            </p>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        </Link>
                    ))}
                </div>
            )}
        </div>
    );
}
